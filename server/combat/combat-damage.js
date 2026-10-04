const {sinnerOf,statFor,addStatus,applyDamageToPlayer}=require('../status/status-manager');
const {randomFrom}=require('../expedition/danger-system');
const {applySkillUtility}=require('../skills/skill-effects');
const {actionForPlayer,estimateDamage}=require('./combat-actions');
const {aliveEnemies,ensureTarget}=require('./combat-enemies');
const {findPart,applyPartDamage}=require('./combat-parts');
const {rollIntent}=require('./combat-intents');
const {maybeSummon}=require('./combat-summon');

function damageTarget(room,combat,player,action,target,part,die,total){
  const preview=estimateDamage(room,player,action,target,part),defense=Math.max(5,target.defense-(action.ignoreDefense||0)-(target.defensePenalty||0));
  if(die!==20&&total<defense)return {dealt:0,preview};
  const dealt=preview.min+Math.floor(Math.random()*Math.max(1,preview.max-preview.min+1));
  if(part&&!part.destroyed)applyPartDamage(combat,target,part,dealt);else target.currentHp=Math.max(0,target.currentHp-dealt);
  return {dealt,preview};
}
function resolvePlayerAction(room,player,selection,guards,records){
  const combat=room.combat,action=actionForPlayer(player,selection.actionId),target=ensureTarget(combat,selection.targetId);if(!action||(!target&&action.kind!=='guard'))return;
  const part=findPart(target,selection.partId),stat=statFor(player,action.stat||'combat'),die=1+Math.floor(Math.random()*20),total=die+Math.round(stat/2);let dealt=0,preview=selection.preview||null;
  if(action.kind==='guard')guards.add(player.id);
  else if(action.kind==='analyze'){if(total>=10+Math.floor(room.exploration.danger/2)&&target){target.defensePenalty=Math.min(8,(target.defensePenalty||0)+1);room.exploration.clues+=1;}}
  else if(action.kind==='aoe'||action.kind==='aoe-debuff'){
    for(const enemy of aliveEnemies(combat)){const hit=damageTarget(room,combat,player,action,enemy,null,die,total);dealt+=hit.dealt;preview=hit.preview;}
    applySkillUtility(room,player,action,target,dealt);
  }
  else if(action.kind==='heal'||action.kind==='team-buff')applySkillUtility(room,player,action,target,0);
  else {const hit=damageTarget(room,combat,player,action,target,part,die,total);dealt=hit.dealt;preview=hit.preview;applySkillUtility(room,player,action,target,dealt);}
  if(action.skillId){combat.cooldowns[player.id]=combat.cooldowns[player.id]||{};combat.cooldowns[player.id][action.id]=2;}
  records.push({playerId:player.id,sinner:sinnerOf(player)?.name||player.name,action:action.label||action.name,target:target?.name||'',targetId:target?.instanceId||null,part:part?.name||'',partId:part?.id||null,die,total,dealt,damageType:action.damageType||null,resistance:preview?.resistance??1,relation:preview?.relation||'普通'});
}
function resolveEnemyActions(room,guards){
  const combat=room.combat,active=room.players.filter(p=>p.connected&&p.hp>0),results=[];let total=0;
  for(const enemy of aliveEnemies(combat)){
    const intent=combat.intents[enemy.instanceId]||rollIntent(enemy,combat);
    if(intent.type==='charged'&&combat.blockChallenge?.enemyId===enemy.instanceId&&combat.blockChallenge.currentDamage>=combat.blockChallenge.requiredDamage){results.push({enemyId:enemy.instanceId,label:intent.label,blocked:true,damage:0});continue;}
    const targets=intent.target==='all'?active:[randomFrom(active.filter(p=>p.hp>0))].filter(Boolean);let sum=0;
    for(const player of targets){const mult=guards.has(player.id)?.48:1,raw=Math.round(intent.damage*Number(enemy.attackMultiplier||1)),damage=applyDamageToPlayer(player,raw,mult);sum+=damage;if(intent.statusId&&player.hp>0)addStatus(player,intent.statusId,2);}
    total+=sum;results.push({enemyId:enemy.instanceId,label:intent.label,damage:sum,targets:targets.map(p=>p.id),soundType:intent.soundType||'anomaly'});
    const summoned=maybeSummon(room,combat,enemy);if(summoned)results[results.length-1].summoned=summoned.name;
  }
  return {total,results};
}
module.exports={damageTarget,resolvePlayerAction,resolveEnemyActions};