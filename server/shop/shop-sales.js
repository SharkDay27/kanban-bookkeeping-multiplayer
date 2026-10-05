const Cards=require('../cards/card-manager');
const {persist}=require('../room/room-manager');
const {getRelic}=require('../../shared/expedition-relics');
const {shopBasePrice}=require('../../shared/shop');
function salePrice(item,type){if(type==='card')return item.kind==='ability'?9:item.source==='探索'?6:3;if(type==='relic')return {common:12,uncommon:20,rare:32}[item?.rarity]||12;if(item?.rarity==='starter')return 3;return Math.max(1,Math.floor(shopBasePrice(item,0)*.35));}
function sell(room,player,selection){
 if(room.phase!=='exploration'||!room.shop||room.eventResult||room.shop.ready?.[player.id])throw new Error('請在商店完成購物前出售。');
 let item,remove;
 if(selection.type==='relic'){
 const id=String(selection.relicId||''),index=(player.relics||[]).indexOf(id);item=getRelic(id);if(index<0||!item)throw new Error('找不到這件遺物。');remove=()=>{player.relics.splice(index,1);player.soldRelics=[...new Set([...(player.soldRelics||[]),id])];};
 }else if(selection.type==='equipment'){
 const inventory=player.equipmentInventory||[],index=inventory.findIndex(x=>selection.gearUid?x.gearUid===selection.gearUid:x.id===selection.itemId);if(index<0)throw new Error('請先將要出售的裝備放入裝備庫。');item=inventory[index];remove=()=>inventory.splice(index,1);
 }else if(selection.type==='card'){const deck=Cards.deckFor(player);if(selection.cardRevision!=null&&selection.cardRevision!==deck.map(c=>c.id).join('|'))throw new Error('牌組已更新，請重新選擇要出售的卡牌。');if(deck.length<=5)throw new Error('牌組至少需要保留 5 張牌。');const id=String(selection.cardId||selection.itemId||'');item=deck.find(c=>c.id===id);if(!item)throw new Error('這張牌不在你的牌組中。');if(item.source==='探索'){const i=player.explorationCards.indexOf(id);remove=()=>player.explorationCards.splice(i,1);}else remove=()=>{player.removedDeckCards=[...new Set([...(player.removedDeckCards||[]),id])];};
 }else throw new Error('無效的出售類型。');
 const gold=salePrice(item,selection.type);remove();player.gold=Number(player.gold||0)+gold;persist();return {item,gold};
}
module.exports={salePrice,sell};
