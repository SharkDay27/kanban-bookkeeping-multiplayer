const legacy=require('./runtime-expedition-v09');
const {SUPPLIES}=require('../shared/game-data');
const {persist}=require('./room-manager');
const {randomFrom,rewardChoice}=require('./runtime-risk');
const {addEquipment}=require('./runtime-equipment');
const {primeFogAfterResolution}=require('./runtime-route');
function awardSupply(room,bonus=0){
 const supply=randomFrom(SUPPLIES),recipient=randomFrom(room.players.filter(p=>p.connected));
 const reward=rewardChoice(room,recipient,{bonusDanger:bonus});
 if(reward.slot)addEquipment(recipient,reward);else if(recipient.inventory.length<4)recipient.inventory.push(reward);else room.sharedInventory.push(reward);
 room.nodeReward={type:'supply',title:supply.name,text:supply.description,recipientId:recipient.id,reward,quality:reward.rarity||'common'};
 room.eventResult={degree:'supply',text:`${recipient.name} 取得「${reward.name}」。${reward.slot?'已收入裝備庫，可於非戰鬥狀態自由換裝。':''}`,damage:0};
 const node=room.exploration.route[room.exploration.position];if(node)node.resolved=true;primeFogAfterResolution(room);persist();return reward;
}
function enterCurrentNode(room){const node=room.exploration.route[room.exploration.position];if(node?.type!=='supply')return legacy.enterCurrentNode(room);room.currentEvent=null;room.eventResult=null;room.combat=null;room.shop=null;room.nodeReward=null;room.votes={};room.exploration.scenes+=1;return awardSupply(room);}
module.exports={...legacy,awardSupply,enterCurrentNode};