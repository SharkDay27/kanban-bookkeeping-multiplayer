const {getSinnerSkill}=require('../../shared/game-data');
const {statFor}=require('../status/status-manager');

const BASIC_ACTIONS=[
  {id:'attack',label:'攻擊',stat:'combat',statLabel:'戰鬥',desc:'直接攻擊指定敵人。'},
  {id:'guard',label:'防禦',stat:'stability',statLabel:'穩定',desc:'本回合受到的傷害大幅降低。'},
  {id:'analyze',label:'觀察弱點',stat:'observe',statLabel:'觀察',desc:'降低敵人防禦並增加線索。'}
];
const COMBAT_ACTIONS=BASIC_ACTIONS;
function skillActions(player){return (player.learnedSkills||[]).map(getSinnerSkill).filter(Boolean).map(s=>({...s,label:s.name,statLabel:{combat:'戰鬥',observe:'觀察',mobility:'機動',stability:'穩定'}[s.stat]||'技能'}));}
function actionsForPlayer(player){return [...BASIC_ACTIONS,...skillActions(player)];}
function actionForPlayer(player,id){return actionsForPlayer(player).find(a=>a.id===id)||null;}
function estimateDamage(room,player,action,target,part){
  if(!action||action.id==='guard'||action.id==='analyze'||action.kind==='heal'||action.kind==='team-buff')return {min:0,max:0,hit:100};
  const stat=Math.max(1,statFor(player,action.stat||'combat')),mult=Number(action.power||1.35),flat=action.id==='attack'?0:2;
  let min=Math.max(1,Math.round(stat*mult)+flat),max=min+6;
  if(action.bossBonus&&['boss','elite'].includes(target?.role)){min=Math.round(min*(1+action.bossBonus));max=Math.round(max*(1+action.bossBonus));}
  if(action.partBonus&&part){min=Math.round(min*(1+action.partBonus));max=Math.round(max*(1+action.partBonus));}
  if(action.minionBonus&&target?.role==='minion'){min=Math.round(min*(1+action.minionBonus));max=Math.round(max*(1+action.minionBonus));}
  if(action.dangerScale){const m=1+room.exploration.danger*action.dangerScale;min=Math.round(min*m);max=Math.round(max*m);}
  const defense=Math.max(5,(target?.defense||10)-(action.ignoreDefense||0)-(target?.defensePenalty||0)),mod=Math.round(stat/2);let hits=0;
  for(let d=1;d<=20;d++)if(d===20||d+mod>=defense)hits++;
  return {min,max,hit:Math.round(hits/20*100)};
}
module.exports={BASIC_ACTIONS,COMBAT_ACTIONS,skillActions,actionsForPlayer,actionForPlayer,estimateDamage};
