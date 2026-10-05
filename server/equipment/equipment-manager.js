const crypto=require('crypto');
const {starterWeaponFor}=require('../../shared/starter-equipment');
const {persist}=require('../room/room-manager');

function cloneItem(item){return item?JSON.parse(JSON.stringify(item)):null;}
function ensureGear(player){
  player.equipment=player.equipment&&typeof player.equipment==='object'?player.equipment:{weapon:null,armor:null,accessory:null};
  player.equipmentInventory=Array.isArray(player.equipmentInventory)?player.equipmentInventory:[];
  player.pendingEquipment=Array.isArray(player.pendingEquipment)?player.pendingEquipment:[];
  for(const item of player.equipmentInventory)item.gearUid=item.gearUid||crypto.randomUUID();
  for(const item of player.equipmentInventory.splice(4))player.pendingEquipment.push({id:crypto.randomUUID(),item});
  require('./equipment-survival').sync(player);return player;
}
function initializeStarterGear(player){ensureGear(player);if(!player.sinnerId)return null;const starter=starterWeaponFor(player.sinnerId);player.equipment={weapon:starter,armor:null,accessory:null};player.equipmentInventory=[];player.pendingEquipment=[];return starter;}
function addEquipment(player,item){ensureGear(player);const copy=cloneItem(item);copy.gearUid=crypto.randomUUID();if(player.equipmentInventory.length>=4)player.pendingEquipment.push({id:crypto.randomUUID(),item:copy});else player.equipmentInventory.push(copy);return copy;}
function canChangeEquipment(room){return !(room.combat&&!room.combat.ended);}
function equipFromInventory(room,player,index){
  if(!canChangeEquipment(room))throw new Error('戰鬥中不能更換裝備。');
  ensureGear(player);if(!Number.isInteger(index)||index<0||index>=player.equipmentInventory.length)throw new Error('找不到這件裝備。');
  const next=player.equipmentInventory[index];if(!next?.slot||!['weapon','armor','accessory'].includes(next.slot))throw new Error('這不是可裝備物品。');
  const previous=player.equipment[next.slot]||null;player.equipment[next.slot]=next;player.equipmentInventory.splice(index,1);if(previous)player.equipmentInventory.push(previous);require('./equipment-survival').sync(player);persist();return {equipped:next,stored:previous};
}
function unequip(room,player,slot){
  if(!canChangeEquipment(room))throw new Error('戰鬥中不能更換裝備。');
  ensureGear(player);if(!['weapon','armor','accessory'].includes(slot))throw new Error('無效裝備欄。');
  if(slot==='weapon'&&player.equipment.weapon)throw new Error('武器欄必須保留一把武器；請直接更換其他武器。');
  const item=player.equipment[slot];if(!item)return null;if(player.equipmentInventory.length>=4)throw new Error('裝備庫已滿，請先騰出空間再卸下。');player.equipment[slot]=null;player.equipmentInventory.push(item);require('./equipment-survival').sync(player);persist();return item;
}
function resolveOverflow(room,player,{rewardId,discardUid=null}){ensureGear(player);const pending=player.pendingEquipment[0];if(!pending||pending.id!==rewardId)throw new Error('這件待領裝備已處理，請重新選擇。');if(discardUid!==null){const index=player.equipmentInventory.findIndex(item=>item.gearUid===discardUid);if(index<0)throw new Error('所選裝備已不在裝備庫。');player.equipmentInventory.splice(index,1);player.equipmentInventory.push(pending.item);}player.pendingEquipment.shift();persist();return {kept:discardUid!==null,item:pending.item};}
function pendingEquipment(room){return (room.players||[]).some(p=>p.connected&&(p.pendingEquipment||[]).length);}
function equipmentInventory(player){ensureGear(player);return player.equipmentInventory;}
module.exports={resolveOverflow,pendingEquipment,ensureGear,initializeStarterGear,addEquipment,equipFromInventory,unequip,equipmentInventory,canChangeEquipment};
