const {sinnerOf,statFor,addStatus,applyDamageToPlayer}=require('../status/status-manager');
const {combatModifier,combatDefense,attackDc}=require('../../shared/check-rules');
const {randomFrom}=require('../expedition/danger-system');
const {applySkillUtility}=require('../skills/skill-effects');
const {actionForPlayer,estimateDamage}=require('./combat-actions');
const {aliveEnemies,ensureTarget}=require('./combat-enemies');
const {findPart,applyPartDamage}=require('./combat-parts');
const {rollIntent}=require('./combat-intents');
const {summonMinion}=require('./combat-summon');
const {cooldownReduction,bleedChanceOnSlash,bleedCooldownChance,cooldownOnKill,cooldownOnBlock,shieldOnPartBreak,incomingMultiplier}=require('../relics/relic-effects');

function soundTypeFor(action){if(action?.soundType)return action.soundType;if(action?.damageType)return action.damageType;const label=String(action?.label||action?.name||'');if(/火銃|槍擊|射擊|彈|砲|銃/.test(label))return'gun';if(action?.skillId)return'anomaly';return'anomaly';}
function reduceOneCooldown(combat,player,amount){amount=Math.max(0,Math.round(amount||0));if(!amount)return null;const map=combat.cooldowns[player.id]||{},keys=Object.keys(map).filter(k=>Number(map[k])>0);if(!keys.length)return null;const key=randomFrom(keys);map[key]=Math.max(0,Number(map[key])-amount);return key;}
function addEnemyStatus(target,id,duration=2){if(!target||!id)return;target.statuses=Array.isArray(target.statuses)?target.statuses:[];const old=target.statuses.find(s=>s.id===id);if(old)old.remaining=Math.max(Number(old.remaining||0),duration);else target.statuses.push({id,remaining:duration});}
function damageTarget(room,combat,player,action,target,part,die,total){
  const preview=estimateDamage(room,player,action,target,part),defense=attackDc(statFor(player,action.stat||'combat'),target,action,player?.relics);
  if(die!==20&&total<defense)return {dealt:0,hpDamage:0,shieldAbsorbed:0,shieldBroken:false,partDestroyed:false,killed:false,preview};
  const beforeHp=Number(target.currentHp||0),rolled=preview.min+Math.floor(Math.random()*Math.max(1,preview.max-preview.min+1));
  const beforeShield=Math.max(0,Number(target.shield||0)),shieldAbsorbed=Math.min(beforeShield,rolled);target.shield=Math.max(0,beforeShield-shieldAbsorbed);const hpDamage=Math.max(0,rolled-shieldAbsorbed),shieldBroken=beforeShield>0&&target.shield<=0;
  let partDestroyed=false;if(hpDamage>0){if(part&&!part.destroyed){const result=applyPartDamage(combat,target,part,hpDamage);partDestroyed=!!result.destroyed;}else target.currentHp=Math.max(0,target.currentHp-hpDamage);}
  const killed=beforeHp>0&&target.currentHp<=0;
  if(hpDamage>0&&action.damageType==='slash'&&Math.random()<bleedChanceOnSlash(player))addEnemyStatus(target,'bleeding',2);
  if(partDestroyed){const shield=shieldOnPartBreak(player);if(shield)player.temporaryShield=Math.min(99,Number(player.temporaryShield||0)+shield);}
  if((target.statuses||[]).some(s=>s.id==='bleeding')&&Math.random()<bleedCooldownChance(player))reduceOneCooldown(combat,player,1);
  if(killed)reduceOneCooldown(combat,player,cooldownOnKill(player,target.role==='minion'));
  return {dealt:rolled,hpDamage,shieldAbsorbed,shieldBroken,partDestroyed,killed,preview};
}
function resolvePlayerAction(room,player,selection,guards,records){
  const combat=room.combat,action=actionForPlayer(player,selection.actionId),target=ensureTarget(combat,selection.targetId);if(!action||(!target&&action.kind!=='guard'))return;
  const hitTargets=[];const hpBefore=Object.fromEntries(room.players.map(p=>[p.id,p.hp]));
  const part=findPart(target,selection.partId),stat=statFor(player,action.stat||'combat'),die=1+Math.floor(Math.random()*20),total=die+(action.kind==='analyze'?Math.round(stat/2):combatModifier(stat));let dealt=0,hpDamage=0,shieldAbsorbed=0,shieldBroken=false,partDestroyed=false,preview=selection.preview||null;
  if(action.kind==='guard')guards.add(player.id);
  else if(action.kind==='analyze'){if(total>=10+Math.floor(room.exploration.danger/2)&&target){target.defensePenalty=Math.min(8,(target.defensePenalty||0)+1);room.exploration.clues+=1;}}
  else if(action.kind==='aoe'||action.kind==='aoe-debuff'){
    for(const enemy of aliveEnemies(combat)){const hit=damageTarget(room,combat,player,action,enemy,null,die,total);if(hit.dealt>0)hitTargets.push(enemy.instanceId);dealt+=hit.dealt;hpDamage+=hit.hpDamage;shieldAbsorbed+=hit.shieldAbsorbed;shieldBroken=shieldBroken||hit.shieldBroken;partDestroyed=partDestroyed||hit.partDestroyed;preview=hit.preview;}
    applySkillUtility(room,player,action,target,dealt);
  }
  else if(action.kind==='heal'||action.kind==='team-buff')applySkillUtility(room,player,action,target,0);
  else {const hit=damageTarget(room,combat,player,action,target,part,die,total);dealt=hit.dealt;hpDamage=hit.hpDamage;shieldAbsorbed=hit.shieldAbsorbed;shieldBroken=hit.shieldBroken;partDestroyed=hit.partDestroyed;preview=hit.preview;applySkillUtility(room,player,action,target,dealt);}
  if(action.skillId){combat.cooldowns[player.id]=combat.cooldowns[player.id]||{};const baseCd=2,reduce=Number(action.cooldownReduction||0)+cooldownReduction(player);combat.cooldowns[player.id][action.id]=Math.max(0,baseCd-reduce);}
  const defeatedTargets=(combat.enemies||[]).filter(e=>e.currentHp<=0).map(e=>e.instanceId);
  const healing=room.players.map(p=>({playerId:p.id,amount:Math.max(0,Number(p.hp||0)-Number(hpBefore[p.id]||0))})).filter(x=>x.amount>0);
  records.push({hitTargets,kind:action.kind,healing,defeatedTargets,playerId:player.id,sinner:sinnerOf(player)?.name||player.name,action:action.label||action.name,target:target?.name||'',targetId:target?.instanceId||null,part:part?.name||'',partId:part?.id||null,die,total,dealt,hpDamage,shieldAbsorbed,shieldBroken,partDestroyed,damageType:action.damageType||null,soundType:soundTypeFor(action),resistance:preview?.resistance??1,relation:preview?.relation||'普通'});
}
function tickEnemyStatuses(enemy){let damage=0;for(const s of enemy.statuses||[]){if(s.id==='bleeding')damage+=4;s.remaining=Number(s.remaining||0)-1;}enemy.statuses=(enemy.statuses||[]).filter(s=>s.remaining>0);if(damage>0)enemy.currentHp=Math.max(0,enemy.currentHp-damage);return damage;}
function resolveEnemyActions(room,guards){
  const combat=room.combat,active=room.players.filter(p=>p.connected&&p.hp>0),results=[];let total=0;
  for(const enemy of aliveEnemies(combat)){
    const statusDamage=tickEnemyStatuses(enemy);if(enemy.currentHp<=0){results.push({enemyId:enemy.instanceId,label:'流血',damage:0,statusDamage,defeated:true,soundType:'slash'});continue;}
    const intent=combat.intents[enemy.instanceId]||rollIntent(enemy,combat);
    if(intent.type==='charged'&&combat.blockChallenge?.enemyId===enemy.instanceId&&combat.blockChallenge.currentDamage>=combat.blockChallenge.requiredDamage){for(const p of active)reduceOneCooldown(combat,p,cooldownOnBlock(p));results.push({enemyId:enemy.instanceId,label:intent.label,blocked:true,damage:0,statusDamage});continue;}
    if(intent.type==='summon'){const summoned=summonMinion(room,combat,enemy);results.push({enemyId:enemy.instanceId,label:intent.label,damage:0,statusDamage,summoned:summoned?.name||null,soundType:'anomaly'});continue;}
    if(intent.type==='shield'||intent.type==='guard'){const gained=Math.max(1,Number(intent.shield||Math.round(enemy.maxHp*.08)));enemy.shield=Math.min(Math.round(enemy.maxHp*.6),Number(enemy.shield||0)+gained);enemy.maxShield=Math.max(Number(enemy.maxShield||0),enemy.shield);results.push({enemyId:enemy.instanceId,label:intent.label,damage:0,statusDamage,gainedShield:gained,soundType:'shieldBreak'});continue;}
    if(intent.type==='enrage'){enemy.attackMultiplier=Math.min(2.5,Number(enemy.attackMultiplier||1)*(1+Number(intent.attackBoost||.18)));results.push({enemyId:enemy.instanceId,label:intent.label,damage:0,statusDamage,enraged:true,soundType:'anomaly'});continue;}
    const targets=intent.target==='all'?active:[randomFrom(active.filter(p=>p.hp>0))].filter(Boolean);let sum=0,shieldAbsorbed=0,shieldBroken=false;
    for(const player of targets){const mult=(guards.has(player.id)?.48:1)*incomingMultiplier(player,enemy),raw=Math.round(intent.damage*Number(enemy.attackMultiplier||1)),beforeShield=Number(player.temporaryShield||0),damage=applyDamageToPlayer(player,raw,mult),afterShield=Number(player.temporaryShield||0);shieldAbsorbed+=Math.max(0,beforeShield-afterShield);shieldBroken=shieldBroken||(beforeShield>0&&afterShield<=0);sum+=damage;if(intent.statusId&&player.hp>0)addStatus(player,intent.statusId,2);}
    total+=sum;results.push({enemyId:enemy.instanceId,label:intent.label,damage:sum,statusDamage,shieldAbsorbed,shieldBroken,targets:targets.map(p=>p.id),soundType:intent.soundType||'anomaly'});
  }
  return {total,results};
}
module.exports={damageTarget,resolvePlayerAction,resolveEnemyActions,soundTypeFor};
