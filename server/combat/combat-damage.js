const B=require('../status/battle-status');
const Dice=require('./opposed-dice');
const Cards=require('../cards/card-manager');
const {sinnerOf,statFor,addStatus,applyDamageToPlayer}=require('../status/status-manager');
const {combatModifier}=require('../../shared/check-rules');
const {randomFrom}=require('../expedition/danger-system');
const {applySkillUtility}=require('../skills/skill-effects');
const {actionForPlayer,estimateDamage}=require('./combat-actions');
const {aliveEnemies,ensureTarget}=require('./combat-enemies');
const {findPart,applyPartDamage}=require('./combat-parts');
const {rollIntent}=require('./combat-intents');
const {summonMinion}=require('./combat-summon');
const {cooldownReduction,bleedChanceOnSlash,bleedCooldownChance,cooldownOnKill,cooldownOnBlock,shieldOnPartBreak,incomingMultiplier}=require('../relics/relic-effects');

function soundTypeFor(action){if(action?.soundType)return action.soundType;if(action?.damageType)return action.damageType;const label=String(action?.label||action?.name||'');if(/火銃|槍擊|射擊|彈|砲|銃/.test(label))return'gun';if(action?.skillId)return'anomaly';return'anomaly';}
function reduceOneCooldown(combat,player,amount){amount=Math.max(0,Math.round(amount||0));if(!amount)return null;if(combat.cardMode){const deck=combat.cardDecks?.[player.id];if(deck)deck.nextDrawBonus=Math.min(2,Number(deck.nextDrawBonus||0)+amount);return 'next-draw';}const map=combat.cooldowns[player.id]||{},keys=Object.keys(map).filter(k=>Number(map[k])>0);if(!keys.length)return null;const key=randomFrom(keys);map[key]=Math.max(0,Number(map[key])-amount);return key;}
function addEnemyStatus(target,id,duration=2){if(!target||!id)return;target.statuses=Array.isArray(target.statuses)?target.statuses:[];const old=target.statuses.find(s=>s.id===id);if(old)old.remaining=Math.max(Number(old.remaining||0),duration);else target.statuses.push({id,remaining:duration});}
function damageTarget(room,combat,player,action,target,part,die,total){
  const preview=estimateDamage(room,player,action,target,part);
  const beforeHp=Number(target.currentHp||0),isOpposed=combat.cardMode&&(action.cardSkill||action.cardBase!=null);
  const dice=Math.max(0,Number(preview.diceCount||0)-B.attackPenalty(player)),rolls=Dice.roll(dice,B.probability(player));if(player.bestOfTwo){const second=Dice.roll(dice,B.probability(player));if(Dice.sum(second)>Dice.sum(rolls))rolls.splice(0,rolls.length,...second);}
  const clash=isOpposed?Dice.clash(rolls,combat.diceDefense?.enemies?.[target.instanceId]):null;
  let rolled=clash?Math.floor((clash.net*(3+Math.max(0,statFor(player,'combat')-4)*.1)+(clash.attackTotal>0?B.flatDamage(player)+Number(action.flatDamage||0):0))*B.outgoing(player)*B.vulnerability(target)*preview.resistance*preview.relicMultiplier):preview.min+Math.floor(Math.random()*Math.max(1,preview.max-preview.min+1));
  if(clash&&action.specialDamage)rolled=Math.floor(rolled*Number(action.power||1));

  const beforeShield=Math.max(0,Number(target.shield||0)),shieldAbsorbed=Math.min(beforeShield,rolled);target.shield=Math.max(0,beforeShield-shieldAbsorbed);const hpDamage=Math.max(0,rolled-shieldAbsorbed),shieldBroken=beforeShield>0&&target.shield<=0;
  let partDestroyed=false;if(hpDamage>0){if(part&&!part.destroyed){const result=applyPartDamage(combat,target,part,hpDamage);partDestroyed=!!result.destroyed;}else target.currentHp=Math.max(0,target.currentHp-hpDamage);}
  const killed=beforeHp>0&&target.currentHp<=0;if(killed){if(action.onKillBuff)addStatus(player,action.onKillBuff,2);if(action.onKillHeal)require('../status/status-manager').healPlayer(player,action.onKillHeal);}
  if(hpDamage>0&&action.damageType==='slash'&&Math.random()<bleedChanceOnSlash(player))addEnemyStatus(target,'bleeding',2);
  if(partDestroyed){const shield=shieldOnPartBreak(player);if(shield)player.temporaryShield=Math.min(99,Number(player.temporaryShield||0)+shield);}
  if((target.statuses||[]).some(s=>s.id==='bleeding')&&Math.random()<bleedCooldownChance(player))reduceOneCooldown(combat,player,1);
  if(hpDamage>0){for(const effect of action.onHitStatuses||[])B.add(target,effect.id,2,effect.stacks);if(action.kind==='card-attack'&&player.equipment?.weapon?.onHitStatus&&player._weaponStatusRound!==combat.round){B.add(target,player.equipment.weapon.onHitStatus,2,player.equipment.weapon.statusStacks||1);player._weaponStatusRound=combat.round;}}
  if(killed)reduceOneCooldown(combat,player,cooldownOnKill(player,target.role==='minion'));
  return {clash,dealt:rolled,hpDamage,shieldAbsorbed,shieldBroken,partDestroyed,killed,preview};
}
function resolvePlayerAction(room,player,selection,guards,records){
  if(selection.actionId==='cards'){for(const action of Cards.actions(room,player,selection)){resolvePlayerAction(room,player,{...selection,actionId:action.id,_cardAction:action},guards,records);}return;}
  if(player.hp<=0)return;const combat=room.combat,action=selection._cardAction||actionForPlayer(player,selection.actionId),target=ensureTarget(combat,selection.targetId);if(!action||(!target&&!['guard','card-guard','heal','team-buff'].includes(action.kind)))return;
  const shieldBefore=Number(player.temporaryShield||0);const hitTargets=[];const hpBefore=Object.fromEntries(room.players.map(p=>[p.id,p.hp]));
  const part=findPart(target,selection.partId),stat=statFor(player,action.stat||'combat'),die=action.cardSkill||action.cardBase!=null?1+Math.floor(Math.random()*6):1+Math.floor(Math.random()*20),total=die+(action.kind==='analyze'?Math.round(stat/2):combatModifier(stat));let clashes=[],dealt=0,hpDamage=0,shieldAbsorbed=0,shieldBroken=false,partDestroyed=false,preview=selection.preview||null;
  if(action.kind==='card-guard'){/* Round defense dice are prepared before either side attacks. */}
  else if(action.kind==='guard')guards.add(player.id);
  else if(action.kind==='analyze'){if(total>=10+Math.floor(room.exploration.danger/2)&&target){target.defensePenalty=Math.min(8,(target.defensePenalty||0)+1);room.exploration.clues+=1;}}
  else if(action.kind==='aoe'||action.kind==='aoe-debuff'){
    for(const enemy of aliveEnemies(combat)){const hit=damageTarget(room,combat,player,action,enemy,null,die,total);if(hit.clash)clashes.push({...hit.clash,target:enemy.name});if(hit.dealt>0)hitTargets.push(enemy.instanceId);dealt+=hit.dealt;hpDamage+=hit.hpDamage;shieldAbsorbed+=hit.shieldAbsorbed;shieldBroken=shieldBroken||hit.shieldBroken;partDestroyed=partDestroyed||hit.partDestroyed;preview=hit.preview;}
    applySkillUtility(room,player,action,target,dealt);
  }
  else if(['heal','team-buff','skill-utility'].includes(action.kind)||(action.kind==='special'&&!action.specialDamage))applySkillUtility(room,player,action,target,0);
  else {const hit=damageTarget(room,combat,player,action,target,part,die,total);if(hit.clash)clashes.push({...hit.clash,target:target.name});dealt=hit.dealt;hpDamage=hit.hpDamage;shieldAbsorbed=hit.shieldAbsorbed;shieldBroken=hit.shieldBroken;partDestroyed=hit.partDestroyed;preview=hit.preview;applySkillUtility(room,player,action,target,dealt);}
  if(action.skillId&&action.cardSkill)reduceOneCooldown(combat,player,Number(action.cooldownReduction||0)+cooldownReduction(player));
  if(action.skillId&&!action.cardSkill){combat.cooldowns[player.id]=combat.cooldowns[player.id]||{};const baseCd=2,reduce=Number(action.cooldownReduction||0)+cooldownReduction(player);combat.cooldowns[player.id][action.id]=Math.max(0,baseCd-reduce);}
  const defeatedTargets=(combat.enemies||[]).filter(e=>e.currentHp<=0).map(e=>e.instanceId);
  const healing=room.players.map(p=>({playerId:p.id,amount:Math.max(0,Number(p.hp||0)-Number(hpBefore[p.id]||0))})).filter(x=>x.amount>0);
  records.push({clashes,defenseRolls:action.kind==='card-guard'?combat.diceDefense?.players?.[player.id]?.rolls||[]:[],cardBased:!!(action.cardSkill||action.cardBase!=null||action.kind==='card-guard'),shieldGained:Math.max(0,Number(player.temporaryShield||0)-shieldBefore),hitTargets,kind:action.kind,healing,defeatedTargets,playerId:player.id,sinner:sinnerOf(player)?.name||player.name,sinnerColor:sinnerOf(player)?.color,action:action.label||action.name,target:target?.name||'',targetId:target?.instanceId||null,part:part?.name||'',partId:part?.id||null,die:['card-guard','heal','team-buff','skill-utility'].includes(action.kind)?0:die,total:action.cardSkill||action.cardBase!=null?dealt:total,dealt,hpDamage,shieldAbsorbed,shieldBroken,partDestroyed,damageType:action.damageType||null,soundType:soundTypeFor(action),resistance:preview?.resistance??1,relation:preview?.relation||'普通'});
}
function resolveEnemyActions(room,guards,onlyId=null){
  const combat=room.combat,active=room.players.filter(p=>p.connected&&p.hp>0),results=[];let total=0;
  for(const turn of (combat.cardMode?combat.lockedEnemyTurns||[]:aliveEnemies(combat).map(e=>({enemyId:e.instanceId})))){const enemy=combat.enemies.find(e=>e.instanceId===turn.enemyId);if(onlyId&&turn.enemyId!==onlyId)continue;if(!enemy||enemy.currentHp<=0)continue;const statusDamage=0;if(B.skip(enemy)){results.push({enemyId:enemy.instanceId,label:'麻痺：本次無法行動',damage:0});continue;}
    let intent=turn.intent||combat.intents[enemy.instanceId]||rollIntent(enemy,combat);if(B.sealed(enemy)&&intent.type!=='attack'){intent={...intent,type:'attack',label:'封印：普通出牌',statusId:null,summonAfterAttack:false,attackDice:(intent.cardPlan?.points?.slash||0)+(intent.cardPlan?.points?.blunt||0)+(intent.cardPlan?.points?.pierce||0),damagePerPoint:3};}
    if(intent.type==='charged'&&combat.blockChallenge?.enemyId===enemy.instanceId&&combat.blockChallenge.currentDamage>=combat.blockChallenge.requiredDamage){for(const p of active)reduceOneCooldown(combat,p,cooldownOnBlock(p));results.push({enemyId:enemy.instanceId,label:intent.label,blocked:true,damage:0,statusDamage});continue;}
    if(intent.type==='summon'){if(enemy.currentHp<=0)continue;const summoned=summonMinion(room,combat,enemy);results.push({enemyId:enemy.instanceId,label:intent.label,damage:0,statusDamage,summoned:summoned?.name||null,soundType:'anomaly'});continue;}
    if(intent.type==='guard'&&combat.cardMode){results.push({enemyId:enemy.instanceId,label:intent.label,damage:0,statusDamage,defenseRolls:combat.diceDefense?.enemies?.[enemy.instanceId]?.rolls||[]});continue;}
    if(intent.type==='shield'||intent.type==='guard'){if(enemy.currentHp<=0)continue;const gained=Math.max(1,Number(intent.shield||Math.round(enemy.maxHp*.08)));enemy.shield=Math.min(Math.round(enemy.maxHp*.6),Number(enemy.shield||0)+gained);enemy.maxShield=Math.max(Number(enemy.maxShield||0),enemy.shield);B.add(enemy,'regeneration',2);results.push({enemyId:enemy.instanceId,label:intent.label,damage:0,statusDamage,gainedShield:gained,soundType:'shieldBreak'});continue;}
    if(intent.type==='enrage'){if(enemy.currentHp<=0)continue;enemy.attackMultiplier=Math.min(2.5,Number(enemy.attackMultiplier||1)*(1+Number(intent.attackBoost||.18)));B.add(enemy,'damage-up',2);B.add(enemy,'agile',2);results.push({enemyId:enemy.instanceId,label:intent.label,damage:0,statusDamage,enraged:true,soundType:'anomaly'});continue;}
    const eligible=combat.cardMode?room.players.filter(p=>p.hp>0&&p.connected&&(turn.targets||[]).includes(p.id)):active;const targets=intent.target==='all'?eligible:[randomFrom(eligible)].filter(Boolean);let clashes=[],sum=0,shieldAbsorbed=0,shieldBroken=false;
    for(const player of targets){const mult=(guards.has(player.id)?.48:1)*incomingMultiplier(player,enemy),clash=combat.cardMode?Dice.clash(Dice.roll(Math.max(0,Number(intent.attackDice||0)-B.attackPenalty(enemy)),B.probability(enemy)),combat.diceDefense?.players?.[player.id]):null,raw=clash?Math.floor((clash.net*Number(intent.damagePerPoint||3)+(clash.attackTotal>0?B.flatDamage(enemy)+Number(intent.flatDamage||0):0))*Number(turn.attackMultiplier||1)*B.outgoing(enemy)):Math.round(intent.damage*Number(enemy.attackMultiplier||1)),beforeShield=Number(player.temporaryShield||0),damage=applyDamageToPlayer(player,raw,mult),afterShield=Number(player.temporaryShield||0);if(clash){clashes.push({...clash,target:sinnerOf(player)?.name||player.name,sinnerColor:sinnerOf(player)?.color,targetId:player.id});if(clash.attackTotal>0&&clash.net===0){reduceOneCooldown(combat,player,cooldownOnBlock(player));if(player.onBlockBuff)addStatus(player,player.onBlockBuff,2);}}shieldAbsorbed+=Math.max(0,beforeShield-afterShield);shieldBroken=shieldBroken||(beforeShield>0&&afterShield<=0);sum+=damage;if(intent.statusId&&damage>0&&player.hp>0)addStatus(player,intent.statusId,2,intent.statusStacks||1);}
    const summoned=intent.summonAfterAttack?summonMinion(room,combat,enemy):null;total+=sum;results.push({enemyId:enemy.instanceId,label:intent.label,summoned:summoned?.name||null,clashes,damage:sum,statusDamage,shieldAbsorbed,shieldBroken,targets:targets.map(p=>p.id),soundType:intent.soundType||'anomaly'});
  }
  return {total,results};
}
module.exports={damageTarget,resolvePlayerAction,resolveEnemyActions,soundTypeFor};
