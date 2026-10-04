const {randomFrom}=require('../expedition/danger-system');
const {aliveEnemies,primaryEnemy}=require('./combat-enemies');
const {canSummon}=require('./combat-summon');

function rollIntent(enemy,combat){
  const base=Math.max(2,Math.round(enemy.attack*(enemy.role==='boss'?.78:enemy.role==='elite'?.72:.62))),parts=(enemy.parts||[]).filter(p=>!p.destroyed),canCharge=parts.some(p=>p.type==='weapon');

  if(canCharge&&combat.round%3===0&&enemy.role!=='minion'){
    const p=parts.find(x=>x.type==='weapon');return {type:'charged',label:'蓄力部位攻擊',damage:Math.round(base*1.7),target:'all',partId:p.id,blockRequired:Math.max(8,Math.round(p.maxHp*.48)),description:'在本回合對指定部位造成足夠傷害即可阻擋。'};
  }
  const unique=Array.isArray(enemy.skills)&&enemy.skills.length?randomFrom(enemy.skills):null;
  if(unique&&Math.random()<.42){
    const type=unique.type||'attack';
    if(type==='shield')return {type,label:unique.label||'防護',damage:0,target:'none',shield:Math.max(1,Number(unique.shield||Math.round(enemy.maxHp*.1))),description:unique.description||'獲得護盾。'};
    if(type==='guard')return {type,label:unique.label||'防禦',damage:0,target:'none',shield:Math.max(1,Math.round(enemy.maxHp*.08)+Number(unique.defenseBoost||0)*2),description:unique.description||'提高防護。'};
    if(type==='enrage')return {type,label:unique.label||'強化',damage:0,target:'none',attackBoost:Number(unique.attackBoost||.18),description:unique.description||'提高後續攻擊。'};
    return {type,label:unique.label||'特殊攻擊',damage:Math.max(1,Math.round(base*Number(unique.mult||1))),target:type.includes('sweep')?'all':'single',statusId:unique.statusId||null,description:unique.description||''};
  }
  return Math.random()<.24?{type:'heavy',label:'重擊',damage:Math.round(base*1.45),target:'single',description:`約 ${Math.round(base*1.45)} 傷害`}:{type:'attack',label:'攻擊',damage:base,target:'single',description:`約 ${base} 傷害`};
}
function setEnemyIntents(combat){
  combat.intents={};for(const enemy of aliveEnemies(combat)){const intent=rollIntent(enemy,combat);if(combat.cardMode){const plan=require('../cards/enemy-cards').plan(enemy,combat),sins=require('../../shared/cards').SINS,primary=Object.keys(sins)[[...(enemy.baseName||enemy.name)].reduce((n,c)=>n+c.charCodeAt(0),0)%7],secondary=Object.keys(sins)[(Object.keys(sins).indexOf(primary)+1)%7];intent.cardRequirement=intent.type==='attack'?{}:intent.type==='heavy'?{[primary]:2}:{[primary]:2,[secondary]:1};if(Object.keys(intent.cardRequirement).length&&!require('../../shared/cards').meets(['guard','shield','enrage'].includes(intent.type)?plan.guardColors:plan.attackColors,intent.cardRequirement)){intent.type='attack';intent.label='普通出牌';intent.damage=Math.max(2,Math.round(enemy.attack*(enemy.role==='boss'?.78:enemy.role==='elite'?.72:.62)));intent.target='single';intent.statusId=null;intent.cardRequirement={};}const attackPoints=plan.points.slash+plan.points.blunt+plan.points.pierce,base=Math.max(2,Math.round(enemy.attack*(enemy.role==='boss'?.78:enemy.role==='elite'?.72:.62))),factor=intent.damage>0?intent.damage/base:1;intent.cardPlan=plan;intent.attackDice=enemy.attack>0&&attackPoints>0?attackPoints:0;intent.defenseDice=Math.max(0,plan.points.guard-Number(enemy.defenseDicePenalty||0));intent.damagePerPoint=attackPoints>0?Math.max(2,base*factor*2/attackPoints):0;if(['guard','shield','summon','enrage'].includes(intent.type))intent.attackDice=0;intent.damage=Math.round(intent.attackDice*.5*intent.damagePerPoint);intent.description=`出 ${plan.picks.length} 張牌 · 攻擊 ${intent.attackDice} 骰／防禦 ${intent.defenseDice} 骰`;intent.soundType=plan.cards.find(c=>!c.flipped)?.faces[0]?.type||'anomaly';intent.label='卡牌・'+intent.label;intent.summonAfterAttack=canSummon(combat,enemy)&&combat.round>=2&&combat.round-Number(enemy.lastSummonRound||-2)>=3&&require('./combat-summon').minionCount(combat)===0;if(intent.summonAfterAttack)intent.description+=' · 回合末召喚 1 名小怪（破壞召喚部位可阻止）';}combat.intents[enemy.instanceId]=intent;}
  const main=primaryEnemy(combat),intent=main?combat.intents[main.instanceId]:null;combat.intent=intent||null;
  combat.blockChallenge=intent?.type==='charged'?{enemyId:main.instanceId,partId:intent.partId,requiredDamage:intent.blockRequired,currentDamage:0,label:intent.label}:null;
}
module.exports={rollIntent,setEnemyIntents};
