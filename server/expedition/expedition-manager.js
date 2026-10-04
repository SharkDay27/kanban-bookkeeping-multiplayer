const {SUPPLIES,REST_NODES,getStatus}=require('../../shared/game-data');
const {persist,beginNextArea,BOSS_INDEX}=require('../room/room-manager');
const {addStatus,removeStatus,healPlayer,tickStatuses}=require('../status/status-manager');
const {randomFrom,pickEvent,rewardChoice}=require('./danger-system');
const {startCombat,checkDefeat}=require('../combat/combat-manager');
const {openShop}=require('../shop/shop-manager');
const {primeFogAfterResolution,prepareInitialRoute}=require('./route-generator');
const {addEquipment}=require('../equipment/equipment-manager');
const {EVENT_ACTIONS,eventOptions,resolveEventCheck,resolveIndividualEventChecks}=require('../events/event-checks');
const {maybePositiveStatus,outcomeForDegree,personalOutcome,awardGoldToParty,grantEventReward}=require('../events/event-rewards');

function currentNode(room){return room.exploration.route[room.exploration.position];}
function markCurrentNodeResolved(room){const node=currentNode(room);if(node)node.resolved=true;}
function finishImmediateNode(room){markCurrentNodeResolved(room);primeFogAfterResolution(room);persist();}
function awardSupply(room,bonus=0){
  const supply=randomFrom(SUPPLIES),recipients=room.players.filter(p=>p.connected),rewards=[];
  for(const recipient of recipients){const reward=rewardChoice(room,recipient,{bonusDanger:bonus});if(reward.slot)addEquipment(recipient,reward);else if(recipient.inventory.length<4)recipient.inventory.push(reward);else room.sharedInventory.push(reward);const buff=maybePositiveStatus(room,recipient,.04);rewards.push({playerId:recipient.id,playerName:recipient.name,reward,quality:reward.rarity||'common',status:buff?.id||null,statusName:buff?.name||''});}
  room.nodeReward={type:'supply',title:supply.name,text:supply.description,rewards};
  room.eventResult={degree:'supply',text:`${supply.description} 每位在線隊員都取得 1 份補給。`,damage:0,rewards};
  finishImmediateNode(room);return rewards;
}
function resolveRest(room){
  const rest=randomFrom(REST_NODES),healed=[];
  for(const player of room.players){const baseHeal=room.areaIndex===0?.34:room.areaIndex===1?.28:.24,amount=healPlayer(player,Math.round(player.maxHp*Math.max(rest.healPercent,baseHeal)));healed.push({playerId:player.id,amount});if(Math.random()<.55){const debuffs=(player.statuses||[]).filter(s=>getStatus(s.id)?.type==='debuff');if(debuffs.length)removeStatus(player,randomFrom(debuffs).id);}}
  room.exploration.danger=Math.max(0,room.exploration.danger-(room.areaIndex===0?2:1));room.nodeReward={type:'rest',title:rest.name,text:rest.description,healed};room.eventResult={degree:'rest',text:`${rest.description} 全隊恢復狀態，危險度下降。`,damage:0};tickStatuses(room.players,{combatRound:false});finishImmediateNode(room);return healed;
}
function enterCurrentNode(room){
  room.currentEvent=null;room.eventResult=null;room.combat=null;room.shop=null;room.nodeReward=null;room.votes={};const node=currentNode(room);if(!node||!node.selected)return null;
  room.exploration.scenes+=1;
  if(node.type==='event')room.currentEvent=pickEvent(room,eventOptions);
  else if(['combat','elite','boss'].includes(node.type))startCombat(room,node.type);
  else if(node.type==='supply')return awardSupply(room);
  else if(node.type==='rest')return resolveRest(room);
  else if(node.type==='shop')openShop(room);
  persist();return node;
}
function resolveEvent(room){
  if(!room.currentEvent)return null;const active=room.players.filter(p=>p.connected&&p.hp>0);if(!active.length||active.some(p=>!room.votes[p.id]))return null;
  if(room.currentEvent.scope==='personal'){
    const checks=resolveIndividualEventChecks(room,room.currentEvent,room.votes,active),personalResults=checks.map(check=>{const player=active.find(p=>p.id===check.playerId);return {...check,...personalOutcome(room,player,check)};});
    room.eventResult={degree:'personal',scope:'personal',text:'',personalResults,damage:personalResults.reduce((s,r)=>s+Number(r.damage||0),0),dangerDelta:0,gold:personalResults.reduce((s,r)=>s+Number(r.gold||0),0)};
  }else{
    const check=resolveEventCheck(room,room.currentEvent,room.votes,active),outcome=outcomeForDegree(room,check.degree,check.balance),loot=grantEventReward(room,room.currentEvent,check);const baseText=['critical','success','mixed'].includes(check.degree)?room.currentEvent.success:room.currentEvent.failure,lootText=loot?` ${loot.playerName} 取得「${loot.item.name}」。`:'';room.eventResult={degree:check.degree,scope:'group',die:check.die,modifier:check.modifier,total:check.total,dc:check.dc,text:`${baseText}${lootText}`,contributions:check.contributions,loot,...outcome};
  }
  markCurrentNodeResolved(room);tickStatuses(room.players,{combatRound:false});checkDefeat(room);if(room.phase==='exploration')primeFogAfterResolution(room);persist();return room.eventResult;
}
function advanceChapterAfterBoss(room){if(room.exploration.position!==BOSS_INDEX||room.eventResult?.degree!=='boss-victory')return false;if(beginNextArea(room)){prepareInitialRoute(room);return true;}room.phase='victory';persist();return true;}
module.exports={EVENT_ACTIONS,eventOptions,enterCurrentNode,resolveEvent,advanceChapterAfterBoss,awardSupply,resolveRest,awardGoldToParty,currentNode,markCurrentNodeResolved};
