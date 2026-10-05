const {grantCard,ensureCollection}=require('../cards/card-manager');
const {persist}=require('../room/room-manager');
const {addEquipment}=require('../equipment/equipment-manager');
const {generateShopStock}=require('./shop-generator');
const {consumableDiscount}=require('../relics/relic-effects');

function openShop(room){
  room.shop={title:'行商補給站',stock:generateShopStock(room),ready:{},openedAt:Date.now()};
  room.currentEvent=null;room.combat=null;room.eventResult=null;room.nodeReward=null;room.votes={};persist();return room.shop;
}
function buyShopItem(room,player,offerId){
  if(!room.shop)throw new Error('目前不在商店。');
  if(room.shop.ready?.[player.id])throw new Error('你已經完成購物。');
  const offer=room.shop.stock.find(o=>o.offerId===offerId);if(!offer)throw new Error('找不到這件商品。');
  if(offer.soldTo)throw new Error('這件商品已售出。');
  const item={...offer.item},discount=item.slot||item.cardItem?0:consumableDiscount(player),price=Math.max(1,Math.round(Number(offer.price||0)*(1-discount)));
  if(player.gold<price)throw new Error('金幣不足。');
  if(item.sinnerId&&item.sinnerId!==player.sinnerId)throw new Error('這張能力牌只限指定罪人使用。');
  if(item.cardItem&&ensureCollection(player).length>=24)throw new Error('探索牌組已達 24 張上限。');
  if(!item.cardItem&&!item.slot&&player.inventory.length>=4)throw new Error('消耗品欄已滿。');
  player.gold-=price;if(item.cardItem)grantCard(player,item);else if(item.slot)addEquipment(player,item);else player.inventory.push(item);offer.soldTo=player.id;persist();return {item,price,discount};
}
function shopReady(room,player){
  if(!room.shop)throw new Error('目前不在商店。');room.shop.ready[player.id]=true;
  const active=room.players.filter(p=>p.connected),allReady=active.every(p=>room.shop.ready[p.id]);
  if(allReady){const node=room.exploration.route[room.exploration.position];if(node)node.resolved=true;room.eventResult={degree:'shop',text:'隊伍完成採購，準備繼續遠征。',damage:0};}
  persist();return allReady;
}
module.exports={openShop,buyShopItem,shopReady};
