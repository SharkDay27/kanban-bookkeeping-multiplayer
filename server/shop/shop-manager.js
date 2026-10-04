const {persist}=require('../room/room-manager');
const {addEquipment}=require('../equipment/equipment-manager');
const {generateShopStock}=require('./shop-generator');

function openShop(room){
  room.shop={title:'行商補給站',stock:generateShopStock(room),ready:{},openedAt:Date.now()};
  room.currentEvent=null;room.combat=null;room.eventResult=null;room.nodeReward=null;room.votes={};persist();return room.shop;
}
function buyShopItem(room,player,offerId){
  if(!room.shop)throw new Error('目前不在商店。');
  if(room.shop.ready?.[player.id])throw new Error('你已經完成購物。');
  const offer=room.shop.stock.find(o=>o.offerId===offerId);if(!offer)throw new Error('找不到這件商品。');
  if(offer.soldTo)throw new Error('這件商品已售出。');
  if(player.gold<offer.price)throw new Error('金幣不足。');
  const item={...offer.item};if(!item.slot&&player.inventory.length>=4)throw new Error('消耗品欄已滿。');
  player.gold-=offer.price;if(item.slot)addEquipment(player,item);else player.inventory.push(item);offer.soldTo=player.id;persist();return {item,price:offer.price};
}
function shopReady(room,player){
  if(!room.shop)throw new Error('目前不在商店。');room.shop.ready[player.id]=true;
  const active=room.players.filter(p=>p.connected),allReady=active.every(p=>room.shop.ready[p.id]);
  if(allReady){const node=room.exploration.route[room.exploration.position];if(node)node.resolved=true;room.eventResult={degree:'shop',text:'隊伍完成採購，準備繼續遠征。',damage:0};}
  persist();return allReady;
}
module.exports={openShop,buyShopItem,shopReady};
