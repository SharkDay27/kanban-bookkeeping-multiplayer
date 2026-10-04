const {getSinnerSkill,applyUpgrade}=require('../../shared/game-data');
const {DAMAGE_TYPE_LABELS,multiplier,relation}=require('../../shared/damage-types');
const {statFor}=require('../status/status-manager');
const {damageMultiplier}=require('../relics/relic-effects');

const BASIC_ACTIONS=[
  {id:'guard',label:'防禦',stat:'stability',statLabel:'穩定',desc:'本回合受到的傷害大幅降低。',kind:'guard'},
  {id:'analyze',label:'觀察弱點',stat:'observe',statLabel:'觀察',desc:'降低敵人防禦並增加線索。',kind:'analyze'}
];
const COMBAT_ACTIONS=BASIC_ACTIONS;
function weaponActions(player){
  const weapon=player?.equipment?.weapon;
  const types=Array.isArray(weapon?.attackTypes)&&weapon.attackTypes.length?weapon.attackTypes:['blunt'];
  return types.map(type=>({id:`attack:${type}`,label:`${weapon?.name||'徒手攻擊'}・${DAMAGE_TYPE_LABELS[type]||type}`,stat:'combat',statLabel:'戰鬥',kind:'weapon-attack',damageType:type,power:1.35,desc:`使用目前武器進行${DAMAGE_TYPE_LABELS[type]||type}攻擊。`}));
}
function skillActions(player){return (player.learnedSkills||[]).map(getSinnerSkill).filter(Boolean).map(base=>{const s=applyUpgrade(base,player?.skillUpgrades?.[base.id]);const action={...s,label:s.name,statLabel:{combat:'戰鬥',observe:'觀察',mobility:'機動',stability:'穩定'}[s.stat]||'技能',skillId:s.id};if(['heal','team-buff'].includes(action.kind)){delete action.damageType;delete action.soundType;}return action;});}
function actionsForPlayer(player){return [...weaponActions(player),...BASIC_ACTIONS,...skillActions(player)];}
function actionForPlayer(player,id){return actionsForPlayer(player).find(a=>a.id===id)||null;}
function estimateDamage(room,player,action,target,part){
  if(!action||action.kind==='guard'||action.kind==='analyze'||action.kind==='heal'||action.kind==='team-buff')return {min:0,max:0,hit:100,damageType:null,resistance:1,relation:'普通'};
  const stat=Math.max(1,statFor(player,action.stat||'combat')),power=Number(action.power||1.35),flat=action.kind==='weapon-attack'?0:2;
  let min=Math.max(1,Math.round(stat*power)+flat),max=min+6;
  if(action.bossBonus&&['boss','elite'].includes(target?.role)){min=Math.round(min*(1+action.bossBonus));max=Math.round(max*(1+action.bossBonus));}
  if(action.partBonus&&part){min=Math.round(min*(1+action.partBonus));max=Math.round(max*(1+action.partBonus));}
  if(action.minionBonus&&target?.role==='minion'){min=Math.round(min*(1+action.minionBonus));max=Math.round(max*(1+action.minionBonus));}
  if(action.dangerScale){const m=1+room.exploration.danger*action.dangerScale;min=Math.round(min*m);max=Math.round(max*m);}
  const typeMult=action.damageType?multiplier(target?.resistances,action.damageType):1,relicMult=damageMultiplier(player,{action,target,part,room});
  min=Math.max(1,Math.round(min*typeMult*relicMult));max=Math.max(min,Math.round(max*typeMult*relicMult));
  const relicIgnore=(player?.relics||[]).includes('relic-needle-eye')&&action.damageType==='pierce'?1:0,defense=Math.max(5,(target?.defense||10)-(action.ignoreDefense||0)-relicIgnore-(target?.defensePenalty||0)),mod=Math.round(stat/2);let hits=0;
  for(let d=1;d<=20;d++)if(d===20||d+mod>=defense)hits++;
  return {min,max,hit:Math.round(hits/20*100),damageType:action.damageType||null,resistance:typeMult,relation:action.damageType?relation(typeMult):'普通',relicMultiplier:relicMult};
}
module.exports={BASIC_ACTIONS,COMBAT_ACTIONS,weaponActions,skillActions,actionsForPlayer,actionForPlayer,estimateDamage};
