const crypto = require('crypto');
const { AREAS, SINNERS } = require('../shared/game-data');
const { loadRooms, saveRooms } = require('./persistence');

const rooms = new Map();
const MAX_PLAYERS = 4;
const RECONNECT_GRACE_MS = 10 * 60 * 1000;
const ROOM_SIGNING_SECRET = process.env.ROOM_SIGNING_SECRET || 'local-dev-v0.7-signing-secret-change-me';
const NODE_ICONS = { event:'?', combat:'⚔', supply:'▣', elite:'◆', rest:'✚', boss:'♛' };
const NODE_LABELS = { event:'事件', combat:'小怪', supply:'補給', elite:'精英', rest:'休整', boss:'BOSS' };

function cleanName(name){const value=String(name||'').trim().slice(0,16);return value||'探索者';}
function clamp(n,min,max){return Math.max(min,Math.min(max,Number(n)||0));}
function makeRoomId(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';for(let attempt=0;attempt<100;attempt++){let id='';for(let i=0;i<4;i++)id+=alphabet[crypto.randomInt(0,alphabet.length)];if(!rooms.has(id))return id;}throw new Error('暫時無法建立房間，請重試。');}
function emptyEquipment(){return {weapon:null,armor:null,accessory:null};}
function makePlayer(socketId,playerName,reconnectToken){return {id:crypto.randomUUID(),reconnectToken:reconnectToken||crypto.randomUUID(),socketId,connected:true,disconnectedAt:null,name:cleanName(playerName),hp:100,maxHp:100,sinnerId:'',ready:false,inventory:[],equipment:emptyEquipment()};}
function sample(array,count){const pool=[...array];const out=[];while(pool.length&&out.length<count){out.push(pool.splice(crypto.randomInt(0,pool.length),1)[0]);}return out;}
function makeMapOptions(){return sample(AREAS,3).map((a)=>a.id);}
function makeNode(type,index){return {index,type,label:NODE_LABELS[type],icon:NODE_ICONS[type],resolved:false};}
function generateRoute(){
  const guaranteed=['combat','combat','event','supply','rest','elite'];
  const weighted=['event','event','combat','combat','supply','rest','elite'];
  while(guaranteed.length<9) guaranteed.push(weighted[crypto.randomInt(0,weighted.length)]);
  const shuffled=sample(guaranteed,guaranteed.length);
  const route=shuffled.map((type,i)=>makeNode(type,i));
  route.push(makeNode('boss',9));
  return route;
}
function freshExploration(){return {danger:0,dangerMax:6,clues:0,scenes:0,route:generateRoute(),position:0};}
function signRecovery(room){return crypto.createHmac('sha256',ROOM_SIGNING_SECRET).update(`${room.id}:${room.hostId}`).digest('hex');}
function verifyRecovery(roomId,hostId,token){const expected=crypto.createHmac('sha256',ROOM_SIGNING_SECRET).update(`${roomId}:${hostId}`).digest('hex');const a=Buffer.from(String(expected)),b=Buffer.from(String(token||''));return a.length===b.length&&crypto.timingSafeEqual(a,b);}
function recoverySnapshot(room){return JSON.parse(JSON.stringify(room));}
function persist(){saveRooms(rooms);}
function sanitizeEquipment(raw){const source=raw&&typeof raw==='object'?raw:{};return {weapon:source.weapon||null,armor:source.armor||null,accessory:source.accessory||null};}
function sanitizeRoute(raw){if(!Array.isArray(raw)||raw.length!==10)return generateRoute();return raw.map((n,i)=>makeNode(i===9?'boss':['event','combat','supply','elite','rest'].includes(n?.type)?n.type:'event',i)).map((n,i)=>({...n,resolved:!!raw[i]?.resolved}));}

function sanitizeRestoredRoom(snapshot){
  if(!snapshot||typeof snapshot!=='object')throw new Error('存檔格式不正確。');
  const id=String(snapshot.id||'').toUpperCase();if(!/^[A-Z2-9]{4}$/.test(id))throw new Error('房號格式不正確。');
  if(!Array.isArray(snapshot.players)||snapshot.players.length<1||snapshot.players.length>MAX_PLAYERS)throw new Error('玩家資料不正確。');
  const mapOptions=(Array.isArray(snapshot.mapOptions)?snapshot.mapOptions:[]).filter((id)=>AREAS.some((a)=>a.id===id)).slice(0,3);
  const normalizedMapOptions=mapOptions.length===3?mapOptions:makeMapOptions();
  const area=AREAS.find((a)=>a.id===snapshot.areaId&&normalizedMapOptions.includes(a.id))||AREAS.find((a)=>a.id===normalizedMapOptions[0])||AREAS[0];
  const players=snapshot.players.map((p)=>({id:String(p.id||crypto.randomUUID()),reconnectToken:String(p.reconnectToken||crypto.randomUUID()),socketId:'',connected:false,disconnectedAt:Date.now(),name:cleanName(p.name),hp:clamp(p.hp??100,0,100),maxHp:100,sinnerId:SINNERS.some((s)=>s.id===p.sinnerId)?p.sinnerId:'',ready:!!p.ready,inventory:Array.isArray(p.inventory)?p.inventory.slice(0,4):[],equipment:sanitizeEquipment(p.equipment)}));
  const hostId=players.some((p)=>p.id===snapshot.hostId)?snapshot.hostId:players[0].id;
  const ex=snapshot.exploration||{};
  const exploration={danger:clamp(ex.danger,0,6),dangerMax:6,clues:clamp(ex.clues,0,99),scenes:clamp(ex.scenes,0,999),route:sanitizeRoute(ex.route),position:clamp(ex.position,0,9)};
  const votes={};for(const p of players)if(typeof snapshot.votes?.[p.id]==='string')votes[p.id]=snapshot.votes[p.id];
  return {id,createdAt:Number(snapshot.createdAt||Date.now()),phase:['exploration','victory','defeat'].includes(snapshot.phase)?snapshot.phase:'lobby',hostId,players,mapOptions:normalizedMapOptions,areaId:area.id,run:Math.max(0,Number(snapshot.run||0)),sharedInventory:Array.isArray(snapshot.sharedInventory)?snapshot.sharedInventory.slice(0,100):[],currentEvent:snapshot.currentEvent&&typeof snapshot.currentEvent==='object'?snapshot.currentEvent:null,eventResult:snapshot.eventResult&&typeof snapshot.eventResult==='object'?snapshot.eventResult:null,combat:snapshot.combat&&typeof snapshot.combat==='object'?snapshot.combat:null,nodeReward:snapshot.nodeReward&&typeof snapshot.nodeReward==='object'?snapshot.nodeReward:null,votes,exploration};
}
function restoreRoom(snapshot,recoveryToken,socketId,playerId,reconnectToken){const candidate=sanitizeRestoredRoom(snapshot);if(rooms.has(candidate.id))throw new Error('房間已經存在。');if(!verifyRecovery(candidate.id,candidate.hostId,recoveryToken))throw new Error('房間復原授權無效。');const player=candidate.players.find((p)=>p.id===playerId&&p.reconnectToken===reconnectToken);if(!player||player.id!==candidate.hostId)throw new Error('只有原房主可以復原房間。');player.socketId=socketId;player.connected=true;player.disconnectedAt=null;rooms.set(candidate.id,candidate);persist();return {room:candidate,player};}
function createRoom(socketId,playerName,reconnectToken){const player=makePlayer(socketId,playerName,reconnectToken);const mapOptions=makeMapOptions();const room={id:makeRoomId(),createdAt:Date.now(),phase:'lobby',hostId:player.id,players:[player],mapOptions,areaId:mapOptions[0],run:0,sharedInventory:[],currentEvent:null,eventResult:null,combat:null,nodeReward:null,votes:{},exploration:freshExploration()};rooms.set(room.id,room);persist();return {room,player};}
function joinRoom(roomId,socketId,playerName,reconnectToken){const id=String(roomId||'').trim().toUpperCase(),room=rooms.get(id);if(!room)throw new Error('找不到房間。');if(room.phase!=='lobby')throw new Error('遊戲已經開始。請使用原本的瀏覽器重新連線。');if(room.players.length>=MAX_PLAYERS)throw new Error('房間已滿。');const player=makePlayer(socketId,playerName,reconnectToken);room.players.push(player);persist();return {room,player};}
function resumeRoom(roomId,socketId,playerId,reconnectToken){const room=rooms.get(String(roomId||'').trim().toUpperCase());if(!room)throw new Error('房間已不存在。');const player=room.players.find((p)=>p.id===playerId&&p.reconnectToken===reconnectToken);if(!player)throw new Error('無法驗證原本的玩家席位。');player.socketId=socketId;player.connected=true;player.disconnectedAt=null;persist();return {room,player};}
function markDisconnected(socketId){for(const room of rooms.values()){const player=room.players.find((p)=>p.socketId===socketId);if(!player)continue;player.socketId='';player.connected=false;player.disconnectedAt=Date.now();persist();return {room,player};}return null;}
function removeExpiredPlayer(roomId,playerId,disconnectedAt){const room=rooms.get(roomId);if(!room)return null;const index=room.players.findIndex((p)=>p.id===playerId);if(index<0)return null;const player=room.players[index];if(player.connected||player.disconnectedAt!==disconnectedAt||Date.now()-disconnectedAt<RECONNECT_GRACE_MS)return null;room.players.splice(index,1);delete room.votes[player.id];if(!room.players.length){rooms.delete(room.id);persist();return {room:null,player};}if(room.hostId===player.id)room.hostId=room.players.find((p)=>p.connected)?.id||room.players[0].id;persist();return {room,player};}
function setArea(room,player,areaId){if(player.id!==room.hostId)throw new Error('只有房主可以選擇探索地區。');if(room.phase!=='lobby')throw new Error('探索開始後不能更換區域。');if(!room.mapOptions.includes(areaId))throw new Error('這張地圖不在本局三個候選地區中。');room.areaId=areaId;persist();}
function setSinner(room,player,sinnerId){if(room.phase!=='lobby')throw new Error('探索開始後不能更換罪人。');const sinner=SINNERS.find((s)=>s.id===sinnerId);if(!sinner)throw new Error('找不到罪人。');if(room.players.some((p)=>p.id!==player.id&&p.sinnerId===sinner.id))throw new Error('這名罪人已被其他玩家選擇。');player.sinnerId=sinner.id;player.ready=true;persist();}
function resetForStart(room){room.run+=1;room.phase='exploration';room.exploration=freshExploration();room.currentEvent=null;room.eventResult=null;room.combat=null;room.nodeReward=null;room.votes={};room.players.forEach((p)=>{p.hp=p.maxHp;});persist();}
function publicRoom(room){return {id:room.id,phase:room.phase,hostId:room.hostId,players:room.players.map(({socketId,reconnectToken,disconnectedAt,...p})=>p),mapOptions:room.mapOptions,areaId:room.areaId,run:room.run,sharedInventory:room.sharedInventory,currentEvent:room.currentEvent,eventResult:room.eventResult,combat:room.combat,nodeReward:room.nodeReward,votes:room.votes,exploration:room.exploration||freshExploration()};}
function loadPersistedRooms(){const snapshots=loadRooms();for(const raw of snapshots){try{const room=sanitizeRestoredRoom(raw);room.players.forEach((p)=>{p.connected=false;p.socketId='';p.disconnectedAt=Date.now();});rooms.set(room.id,room);}catch(error){console.warn('Skipped invalid persisted room:',error.message);}}if(rooms.size)persist();return rooms.size;}

module.exports={rooms,RECONNECT_GRACE_MS,signRecovery,recoverySnapshot,restoreRoom,persist,createRoom,joinRoom,resumeRoom,markDisconnected,removeExpiredPlayer,setArea,setSinner,publicRoom,loadPersistedRooms,freshExploration,resetForStart};
