const legacy=require('../room-manager');
const {starterWeaponFor}=require('../../shared/starter-equipment');

function cloneItem(item){return item?JSON.parse(JSON.stringify(item)):null;}
function ensurePlayerEquipment(player){
  player.equipment=player.equipment&&typeof player.equipment==='object'?player.equipment:{weapon:null,armor:null,accessory:null};
  player.equipmentInventory=Array.isArray(player.equipmentInventory)?player.equipmentInventory:[];
  return player;
}
function applyStarterWeapon(player,{resetInventory=false}={}){
  ensurePlayerEquipment(player);
  if(resetInventory)player.equipmentInventory=[];
  const starter=starterWeaponFor(player.sinnerId);
  if(starter)player.equipment.weapon=cloneItem(starter);
  return player;
}
function createRoom(...args){const result=legacy.createRoom(...args);ensurePlayerEquipment(result.player);return result;}
function joinRoom(...args){const result=legacy.joinRoom(...args);ensurePlayerEquipment(result.player);return result;}
function resumeRoom(...args){const result=legacy.resumeRoom(...args);ensurePlayerEquipment(result.player);return result;}
function restoreRoom(snapshot,...args){
  const result=legacy.restoreRoom(snapshot,...args);
  const savedPlayers=new Map((snapshot?.players||[]).map(p=>[String(p.id),p]));
  for(const player of result.room.players){
    ensurePlayerEquipment(player);
    const saved=savedPlayers.get(String(player.id));
    player.equipmentInventory=Array.isArray(saved?.equipmentInventory)?saved.equipmentInventory.slice(0,40).map(cloneItem):[];
    if(!player.equipment.weapon&&player.sinnerId)applyStarterWeapon(player);
  }
  legacy.persist();
  return result;
}
function setSinner(room,player,sinnerId){legacy.setSinner(room,player,sinnerId);applyStarterWeapon(player,{resetInventory:true});legacy.persist();}
function resetForStart(room){
  legacy.resetForStart(room);
  for(const player of room.players){
    ensurePlayerEquipment(player);
    if(!player.equipment.weapon&&player.sinnerId)applyStarterWeapon(player);
  }
  legacy.persist();
}
function restartRoom(room,player){
  if(player.id!==room.hostId)throw new Error('只有房主可以重新開始。');
  if(!['victory','defeat'].includes(room.phase))throw new Error('目前還不能重新開始。');
  room.phase='lobby';room.selectedAreas=[];room.areaIndex=0;room.areaId='';room.run=0;room.sharedInventory=[];room.currentEvent=null;room.eventResult=null;room.combat=null;room.shop=null;room.nodeReward=null;room.votes={};room.routeVotes={};room.exploration=legacy.freshExploration(0,0);
  for(const p of room.players){p.hp=p.maxHp;p.gold=0;p.sinnerId='';p.ready=false;p.inventory=[];p.equipment={weapon:null,armor:null,accessory:null};p.equipmentInventory=[];p.statuses=[];p.temporaryShield=0;p.learnedSkills=[];}
  legacy.persist();return room;
}
function loadPersistedRooms(){
  const count=legacy.loadPersistedRooms();
  for(const room of legacy.rooms.values())for(const player of room.players){ensurePlayerEquipment(player);if(!player.equipment.weapon&&player.sinnerId)applyStarterWeapon(player);}
  if(count)legacy.persist();
  return count;
}

module.exports={...legacy,createRoom,joinRoom,resumeRoom,restoreRoom,setSinner,resetForStart,restartRoom,loadPersistedRooms,ensurePlayerEquipment,applyStarterWeapon};
