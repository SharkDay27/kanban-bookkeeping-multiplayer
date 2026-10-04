const {sinnerOf,statFor,addStatus,removeStatus,applyDamageToPlayer,healPlayer}=require('../status/status-manager');
const {randomFrom}=require('../expedition/danger-system');
const {BASIC_ACTIONS,actionForPlayer,estimateDamage}=require('./combat-actions');
const {aliveEnemies,ensureTarget}=require('./combat-enemies');
const {findPart,applyPartDamage}=require('./combat-parts');
const {rollIntent}=require('./combat-intents');
const {maybeSummon}=require('./combat-summon');

function applySkillUtility(room,player,action,target,dealt){
  if(action.shield)player.temporaryShield=Math.min(99,Number(player.temporaryShield||0)+action.shield);
  if(action.buff)addStatus(player,action.buff,2);
  if(action.statusId&&target)target.statuses=(target.statuses||[]).concat([{id:action.statusId,remaining:2}]);
  if(action.defenseDown&&target)target.defensePenalty=Math.min(8,Number(target.defensePenalty||0)+action.defenseDown);
  if(action.attackDown&&target)target.attackMultiplier=Math.max(.45,Number(target.attackMultiplier||1)*(1-action.attackDown));
  if(action.enemyDamageMult)for(const e of aliveEnemies(room.combat))e.attackMultiplier=Math.max(.45,Number(e.attackMultiplier||1)*action.enemyDamageMult);
  if(action.heal){const targets=action.team?room.players.filter(p=>p.hp>0):[player];for(const p of targets)healPlayer(p,action.heal);}
  if(action.cleanse){const deb=(player.statuses||[])[0];if(deb)removeStatus(player,deb.id);}
  if(action.lifesteal&&dealt>0)healPlayer(player,Math.max(1,Math.round(dealt*action.lifesteal)));
  if(action.dangerDown)room.exploration.danger=Math.max(0,room.exploration.danger-action.dangerDown);
  if(action.clue)room.exploration.clues+=action.clue;
}
function damageTarget(room,combat,player,action,target,part,die,total){
  const preview=estimateDamage(room,player,action,target,part),defense=Math.max(5,target.defense-(action.ignoreDefense||0)-(target.defensePenalty||0));
  if(die!==20&&total<defense)return 0;
  const dealt=preview.min+Math.floor(Math.random()*Math.max(1,preview.max-preview.min+1));
  if(part&&!part.destroyed)applyPartDamage(combat,target,part,dealt);else target.currentHp=Math.max(0,target.currentHp-dealt);
  return dealt;
}
function resolvePlayerAction(room,player,selection,guards,records){
  const combat=room.combat,action=actionForPlayer(player,selection.actionId),target=ensureTarget(combat,selection.targetId);if(!action||(!target&&action.id!=='guard'))return;
  const part=findPart(target,selection.partId),stat=statFor(player,action.stat||'combat'),die=1+Math.floor(Math.random()*20),total=die+Math.round(stat/2);let dealt=0;
  if(action.id==='guard')guards.add(player.id);
  else if(action.id==='analyze'){if(total>=10+Math.floor(room.exploration.danger/2)&&target){target.defensePenalty=Math.min(8,(target.defensePenalty||0)+1);room.exploration.clues+=1;}}
  else if(action.kind==='aoe'||action.kind==='aoe-debuff'){for(const enemy of aliveEnemies(combat))dealt+=damageTarget(room,combat,player,action,enemy,null,die,total);applySkillUtility(room,player,action,target,dealt);}
  else if(action.kind==='heal'||action.kind==='team-buff')applySkillUtility(room,player,action,target,0);
  else {dealt=damageTarget(room,combat,player,action,target,part,die,total);applySkillUtility(room,player,action,target,dealt);}
  if(!BASIC_ACTIONS.some(a=>a.id===action.id)){combat.cooldowns[player.id]=combat.cooldowns[player.id]||{};combat.cooldowns[player.id][action.id]=2;}
  records.push({playerId:player.id,sinner:sinnerOf(player)?.name||player.name,action:action.label||action.name,target:target?.name||'',part:part?.name||'',die,total,dealt});
}
function resolveEnemyActions(room,guards){
  const combat=room.combat,active=room.players.filter(p=>p.connected&&p.hp>0),results=[];let total=0;
  for(const enemy of aliveEnemies(combat)){
    const intent=combat.intents[enemy.instanceId]||rollIntent(enemy,combat);
    if(intent.type==='charged'&&combat.blockChallenge?.enemyId===enemy.instanceId&&combat.blockChallenge.currentDamage>=combat.blockChallenge.requiredDamage){results.push({enemyId:enemy.instanceId,label:intent.label,blocked:true,damage:0});continue;}
    const targets=intent.target==='all'?active:[randomFrom(active.filter(p=>p.hp>0))].filter(Boolean);let sum=0;
    for(const player of targets){const mult=guards.has(player.id)?.48:1,raw=Math.round(intent.damage*Number(enemy.attackMultiplier||1)),damage=applyDamageToPlayer(player,raw,mult);sum+=damage;if(intent.statusId&&player.hp>0)addStatus(player,intent.statusId,2);}
    total+=sum;results.push({enemyId:enemy.instanceId,label:intent.label,damage:sum,targets:targets.map(p=>p.id)});
    const summoned=maybeSummon(room,combat,enemy);if(summoned)results[results.length-1].summoned=summoned.name;
  }
  return {total,results};
}
module.exports={applySkillUtility,damageTarget,resolvePlayerAction,resolveEnemyActions};
