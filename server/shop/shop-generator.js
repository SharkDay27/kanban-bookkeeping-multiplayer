const {COLLECTIBLE}=require('../../shared/cards');
const {EQUIPMENT,CONSUMABLES}=require('../../shared/game-data');
const {weightedPick,rarityWeight}=require('../expedition/danger-system');
const {weightForItem}=require('../builds/build-affinity');
const {priceFor}=require('./shop-pricing');

function partyAffinity(room,item){const players=room.players.filter(p=>p.connected&&p.sinnerId);if(!players.length)return 1;return players.reduce((sum,p)=>sum+weightForItem(p,item,1),0)/players.length;}
function weightedItem(pool,room){const danger=room.exploration.danger,chapter=room.areaIndex||0;return weightedPick(pool.map(item=>({value:item,weight:rarityWeight(item.rarity||'common',danger,0,chapter)*partyAffinity(room,item)})));}
function uniquePicks(pool,count,room){const picked=[],available=[...pool];while(picked.length<count&&available.length){const item=weightedItem(available,room);if(!item)break;picked.push(item);const i=available.findIndex(x=>x.id===item.id);if(i>=0)available.splice(i,1);}return picked;}
function generateShopStock(room){const chapter=room.areaIndex||0,consumables=uniquePicks(CONSUMABLES,3,room),equipment=uniquePicks(EQUIPMENT,2,room);return [...consumables,...equipment,...uniquePicks(COLLECTIBLE,3,room)].map((item,index)=>({offerId:`shop-${Date.now()}-${index}-${item.id}`,item:{...item},price:item.cardItem?(item.kind==='ability'?26:18)+chapter*4:priceFor(item,chapter),soldTo:null}));}
module.exports={weightedItem,uniquePicks,generateShopStock};
