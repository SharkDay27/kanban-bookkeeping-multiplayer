const {statFor,sinnerOf}=require('../status/status-manager');
const {balance}=require('../expedition/danger-system');

const EVENT_ACTIONS={
  observe:{id:'observe',label:'觀察判讀',stat:'observe',statLabel:'觀察',risk:'低風險',desc:'確認異常規律與安全路線。',bonus:1},
  steady:{id:'steady',label:'穩固處置',stat:'stability',statLabel:'穩定',risk:'中風險',desc:'控制現場並固定危險源。',bonus:0},
  move:{id:'move',label:'機動突破',stat:'mobility',statLabel:'機動',risk:'中風險',desc:'利用速度與地形穿越危險。',bonus:0},
  force:{id:'force',label:'強行制壓',stat:'combat',statLabel:'戰鬥',risk:'高風險',desc:'直接壓制或破壞威脅。',bonus:-1}
};
const THEME_ACTIONS={lure:['observe','steady','move'],terrain:['observe','move','steady'],mechanical:['steady','observe','force'],time:['observe','steady','move'],sound:['observe','steady','move'],chemical:['observe','steady','move'],unknown:['observe','steady','force']};
function eventOptions(event){return (THEME_ACTIONS[event.theme]||THEME_ACTIONS.unknown).map(id=>({...EVENT_ACTIONS[id],rewardHint:event.rewardByAction?.[id]?.hint||''}));}
function degreeFor(die,total,dc){if(die===20||total>=dc+5)return 'critical';if(total>=dc)return 'success';if(total>=dc-3)return 'mixed';if(die===1||total<=dc-7)return 'critical-failure';return 'failure';}
function resolveEventCheck(room,event,votes,activePlayers){
  const active=activePlayers||room.players.filter(p=>p.connected&&p.hp>0),b=balance(room);
  const contributions=active.map(player=>{const option=event.options.find(o=>o.id===votes[player.id]),value=statFor(player,option?.stat);return {playerId:player.id,sinner:sinnerOf(player)?.name||player.name,actionId:option?.id||'',actionLabel:option?.label||'',statLabel:option?.statLabel||'',statValue:value,bonus:option?.bonus||0};});
  const avg=contributions.reduce((sum,x)=>sum+x.statValue+x.bonus,0)/Math.max(1,active.length),modifier=Math.round(avg/2),dc=Math.max(8,Math.round(11+Number(event.difficulty||0)+room.exploration.danger*.7+b.eventDc)),die=1+Math.floor(Math.random()*20),total=die+modifier,degree=degreeFor(die,total,dc);
  return {contributions,modifier,dc,die,total,degree,balance:b};
}
module.exports={EVENT_ACTIONS,THEME_ACTIONS,eventOptions,degreeFor,resolveEventCheck};
