const { SUPPLIES, REST_NODES }=require('../shared/game-data');
const { persist, beginNextArea, NODE_LABELS }=require('./room-manager');
const { getStatus }=require('../shared/game-data');
const {
  sinnerOf,statFor,addStatus,removeStatus,dangerShield,healPlayer,tickStatuses,randomStatus,applyDamageToPlayer
}=require('./runtime-status');
const {
  balance,randomFrom,revealNode,pickEvent,rewardChoice,pickPositiveStatus
}=require('./runtime-risk');
const { startCombat,checkDefeat }=require('./runtime-combat');

const EVENT_ACTIONS={
  observe:{id:'observe',label:'觀察判讀',stat:'observe',statLabel:'觀察',risk:'低風險',desc:'確認異常規律與安全路線。',bonus:1},
  steady:{id:'steady',label:'穩固處置',stat:'stability',statLabel:'穩定',risk:'中風險',desc:'控制現場並固定危險源。',bonus:0},
  move:{id:'move',label:'機動突破',stat:'mobility',statLabel:'機動',risk:'中風險',desc:'利用速度與地形穿越危險。',bonus:0},
  force:{id:'force',label:'強行制壓',stat:'combat',statLabel:'戰鬥',risk:'高風險',desc:'直接壓制或破壞威脅。',bonus:-1}
};
const THEME_ACTIONS={
  lure:['observe','steady','move'],terrain:['observe','move','steady'],mechanical:['steady','observe','force'],
  time:['observe','steady','move'],sound:['observe','steady','move'],chemical:['observe','steady','move'],unknown:['observe','steady','force']
};
function eventOptions(event){ return (THEME_ACTIONS[event.theme]||THEME_ACTIONS.unknown).map((id)=>({...EVENT_ACTIONS[id]})); }
function currentNode(room){ return room.exploration.route[room.exploration.position]; }
function markCurrentNodeResolved(room){ const node=currentNode(room);if(node)node.resolved=true; }
function giveReward(room,player,reward){
  if(reward.slot) player.equipment[reward.slot]=reward;
  else if(player.inventory.length<4) player.inventory.push(reward);
  else room.sharedInventory.push(reward);
}
function maybePositiveStatus(room,player,bonus=0){
  const chance=.08+room.exploration.danger*.035+(room.areaIndex||0)*.04+bonus;
  if(Math.random()>chance)return null;
  const status=pickPositiveStatus(room,player);addStatus(player,status.id);return status;
}
function maybeNegativeStatus(room,severity=1){
  const chance=.05+room.exploration.danger*.03+(room.areaIndex||0)*.03+severity*.025;
  if(Math.random()>chance)return null;
  const targets=room.players.filter((p)=>p.hp>0);if(!targets.length)return null;
  const target=randomFrom(targets);const status=randomStatus('debuff');addStatus(target,status.id);
  return {playerId:target.id,statusId:status.id,name:status.name};
}
function awardSupply(room,bonus=0){
  const supply=randomFrom(SUPPLIES),recipient=randomFrom(room.players.filter((p)=>p.connected));
  const reward=rewardChoice(room,recipient,{bonusDanger:bonus});giveReward(room,recipient,reward);
  const buff=maybePositiveStatus(room,recipient,.04);
  room.nodeReward={type:'supply',title:supply.name,text:supply.description,recipientId:recipient.id,reward,quality:reward.rarity||'common',status:buff?.id||null};
  room.eventResult={degree:'supply',text:`${recipient.name} 取得「${reward.name}」${buff?`，並獲得「${buff.name}」`:''}。`,damage:0};markCurrentNodeResolved(room);persist();
}
function resolveRest(room){
  const rest=randomFrom(REST_NODES),healed=[];
  for(const player of room.players){
    const baseHeal=room.areaIndex===0?.34:room.areaIndex===1?.28:.24;
    const amount=healPlayer(player,Math.round(player.maxHp*Math.max(rest.healPercent,baseHeal)));healed.push({playerId:player.id,amount});
    if(Math.random()<.55){const debuffs=(player.statuses||[]).filter((s)=>getStatus(s.id)?.type==='debuff');if(debuffs.length)removeStatus(player,randomFrom(debuffs).id);}
  }
  room.exploration.danger=Math.max(0,room.exploration.danger-(room.areaIndex===0?2:1));
  room.nodeReward={type:'rest',title:rest.name,text:rest.description,healed};room.eventResult={degree:'rest',text:`${rest.description} 全隊恢復狀態，危險度下降。`,damage:0};markCurrentNodeResolved(room);tickStatuses(room.players,{combatRound:false});persist();
}
function enterCurrentNode(room){
  room.currentEvent=null;room.eventResult=null;room.combat=null;room.nodeReward=null;room.votes={};
  const node=currentNode(room);if(!node)return;
  revealNode(room,room.exploration.position,NODE_LABELS);room.exploration.scenes+=1;
  if(node.type==='event')room.currentEvent=pickEvent(room,eventOptions);
  else if(['combat','elite','boss'].includes(node.type))startCombat(room,node.type);
  else if(node.type==='supply')awardSupply(room);
  else if(node.type==='rest')resolveRest(room);
  persist();
}
function resolveEvent(room){
  if(!room.currentEvent)return null;
  const active=room.players.filter((p)=>p.connected&&p.hp>0);if(!active.length||active.some((p)=>!room.votes[p.id]))return null;
  const b=balance(room);
  const contributions=active.map((p)=>{const option=room.currentEvent.options.find((o)=>o.id===room.votes[p.id]);const value=statFor(p,option?.stat);return {playerId:p.id,sinner:sinnerOf(p)?.name||p.name,actionLabel:option?.label||'',statLabel:option?.statLabel||'',statValue:value,bonus:option?.bonus||0};});
  const avg=contributions.reduce((s,x)=>s+x.statValue+x.bonus,0)/active.length,modifier=Math.round(avg/2);
  const dc=Math.max(8,Math.round(11+Number(room.currentEvent.difficulty||0)+room.exploration.danger*.7+b.eventDc));
  const die=1+Math.floor(Math.random()*20),total=die+modifier;let degree='failure';
  if(die===20||total>=dc+5)degree='critical';else if(total>=dc)degree='success';else if(total>=dc-3)degree='mixed';else if(die===1||total<=dc-7)degree='critical-failure';
  let damage=0,cluesDelta=0,dangerDelta=0;
  if(degree==='critical'){cluesDelta=2;dangerDelta=-1;}else if(degree==='success')cluesDelta=1;else if(degree==='mixed'){cluesDelta=1;dangerDelta=1;damage=3;}else if(degree==='failure'){dangerDelta=2;damage=7;}else{dangerDelta=3;damage=11;}
  damage=Math.max(0,Math.round(damage*b.eventDamage));dangerDelta=dangerDelta>0?Math.max(1,Math.round(dangerDelta*b.dangerGain)):dangerDelta;
  const partyShield=Math.max(...active.map(dangerShield),0);if(dangerDelta>0)dangerDelta=Math.max(0,dangerDelta-partyShield);
  const actualDamage=[];if(damage)for(const p of active){actualDamage.push({playerId:p.id,amount:applyDamageToPlayer(p,damage)});}
  room.exploration.clues=Math.max(0,room.exploration.clues+cluesDelta);room.exploration.danger=Math.max(0,Math.min(room.exploration.dangerMax,room.exploration.danger+dangerDelta));
  const debuff=['failure','critical-failure'].includes(degree)?maybeNegativeStatus(room,degree==='critical-failure'?3:1):null;
  const buffTarget=['critical','success'].includes(degree)?randomFrom(active):null;const buff=buffTarget?maybePositiveStatus(room,buffTarget,degree==='critical'?.1:0):null;
  room.eventResult={degree,die,modifier,total,dc,text:['critical','success','mixed'].includes(degree)?room.currentEvent.success:room.currentEvent.failure,damage,actualDamage,cluesDelta,dangerDelta,contributions,statusApplied:debuff||(buff?{playerId:buffTarget.id,statusId:buff.id,name:buff.name}:null)};
  markCurrentNodeResolved(room);tickStatuses(room.players,{combatRound:false});checkDefeat(room);persist();return room.eventResult;
}
function advanceNode(room){
  if(['victory','defeat'].includes(room.phase))return;
  if(!currentNode(room)?.resolved)throw new Error('目前節點尚未完成。');
  if(room.exploration.position>=9){
    if(room.combat?.kind==='boss'&&room.eventResult?.degree==='boss-victory'){
      if(beginNextArea(room)){revealNode(room,0,NODE_LABELS);enterCurrentNode(room);return;}
      room.phase='victory';persist();return;
    }
    return;
  }
  room.exploration.position+=1;room.run+=1;revealNode(room,room.exploration.position,NODE_LABELS);enterCurrentNode(room);
}

module.exports={EVENT_ACTIONS,eventOptions,enterCurrentNode,resolveEvent,advanceNode,awardSupply,resolveRest};
