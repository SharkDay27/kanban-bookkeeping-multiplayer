const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { AREAS, SINNERS, EVENTS } = require('../shared/game-data');
const {
  createRoom, joinRoom, resumeRoom, restoreRoom, markDisconnected, removeExpiredPlayer,
  setArea, setSinner, publicRoom, rooms, RECONNECT_GRACE_MS,
  signRecovery, recoverySnapshot, persist, loadPersistedRooms
} = require('./room-manager');

const PORT = Number(process.env.PORT || 3000);
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

loadPersistedRooms();
app.use(express.json({ limit:'1mb' }));
app.use(express.static(path.join(__dirname, '..', 'client')));
app.get('/health', (_req, res) => res.json({ ok:true, rooms:rooms.size, version:'0.5.0' }));
app.get('/api/game-data', (_req, res) => res.json({ areas:AREAS, sinners:SINNERS }));

function getContext(room, socket) {
  const player = room?.players.find((p) => p.socketId === socket.id && p.connected);
  if (!room || !player) throw new Error('你不在這個房間。');
  return player;
}
function sessionPayload(room, player) {
  return { ok:true, room:publicRoom(room), selfId:player.id, reconnectToken:player.reconnectToken, recoveryToken:player.id===room.hostId?signRecovery(room):null, recoverySnapshot:player.id===room.hostId?recoverySnapshot(room):null, gameData:{areas:AREAS,sinners:SINNERS} };
}
function emitRoom(room) {
  io.to(room.id).emit('room:update', publicRoom(room));
  const host = room.players.find((p) => p.id === room.hostId && p.connected && p.socketId);
  if (host) io.to(host.socketId).emit('room:recovery', { recoveryToken:signRecovery(room), recoverySnapshot:recoverySnapshot(room) });
}
function fallbackEvent(area) {
  return { area:area.id, id:`fallback-${area.id}`, name:`${area.name}：未確認異常`, theme:'unknown', difficulty:Math.max(1,Math.round(area.level/3)), description:`隊伍在「${area.name}」發現尚未歸檔的異常徵兆。前方路線仍可通行，但需要共同決定處理方式。`, success:'隊伍保持距離並完成觀測，安全通過。', failure:'判讀失誤，隊伍在撤離時受到波及。' };
}
function pickEvent(room) {
  const area = AREAS.find((a)=>a.id===room.areaId)||AREAS[0];
  const pool = EVENTS.filter((e)=>e.area===area.id);
  const event = pool.length?pool[Math.floor(Math.random()*pool.length)]:fallbackEvent(area);
  return {...event,options:[{id:'careful',label:'謹慎調查'},{id:'advance',label:'直接通過'}]};
}
function teamObserve(room) {
  const selected=room.players.map((p)=>SINNERS.find((s)=>s.id===p.sinnerId)).filter(Boolean);
  if(!selected.length)return 0;
  return selected.reduce((sum,s)=>sum+s.stats.observe+s.stats.stability*.5,0)/selected.length;
}
function resolveCurrentEvent(room) {
  if(!room.currentEvent)return null;
  const activePlayers=room.players.filter((p)=>p.connected);
  if(!activePlayers.length||activePlayers.some((p)=>!room.votes[p.id]))return null;
  const votes=activePlayers.map((p)=>room.votes[p.id]);
  const careful=votes.filter((v)=>v==='careful').length;
  const chosen=careful>=Math.ceil(votes.length/2)?'careful':'advance';
  const area=AREAS.find((a)=>a.id===room.areaId)||AREAS[0];
  const observe=teamObserve(room),difficulty=8+area.level*.7+Number(room.currentEvent.difficulty||0),bonus=chosen==='careful'?5:-1;
  const chance=Math.max(.18,Math.min(.92,.58+(observe+bonus-difficulty)/35));
  const roll=Math.random(),success=roll<chance,damage=success?0:Math.max(4,Math.round(area.level*.8+4));
  if(damage)room.players.forEach((p)=>{p.hp=Math.max(0,p.hp-damage)});
  room.eventResult={success,chosen,chance:Math.round(chance*100),roll:Math.round(roll*100),text:success?room.currentEvent.success:room.currentEvent.failure,damage};
  persist(); return room.eventResult;
}

io.on('connection',(socket)=>{
  socket.on('room:create',({playerName,reconnectToken},ack=()=>{})=>{try{const {room,player}=createRoom(socket.id,playerName,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room)}catch(error){ack({ok:false,error:error.message})}});
  socket.on('room:join',({roomId,playerName,reconnectToken},ack=()=>{})=>{try{const {room,player}=joinRoom(roomId,socket.id,playerName,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room)}catch(error){ack({ok:false,error:error.message})}});
  socket.on('room:resume',({roomId,playerId,reconnectToken},ack=()=>{})=>{try{const {room,player}=resumeRoom(roomId,socket.id,playerId,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room)}catch(error){ack({ok:false,error:error.message})}});
  socket.on('room:restore',({snapshot,recoveryToken,playerId,reconnectToken},ack=()=>{})=>{try{const {room,player}=restoreRoom(snapshot,recoveryToken,socket.id,playerId,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room)}catch(error){ack({ok:false,error:error.message})}});
  socket.on('room:area',({roomId,areaId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);setArea(room,player,areaId);emitRoom(room);ack({ok:true})}catch(error){ack({ok:false,error:error.message})}});
  socket.on('player:sinner',({roomId,sinnerId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);setSinner(room,player,sinnerId);emitRoom(room);ack({ok:true})}catch(error){ack({ok:false,error:error.message})}});
  socket.on('room:start',({roomId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),actor=getContext(room,socket);if(actor.id!==room.hostId)throw new Error('只有房主可以開始。');if(room.players.length<2)throw new Error('至少需要 2 名玩家。');if(room.players.some((p)=>!p.connected))throw new Error('有玩家目前離線，請等他重新連線。');if(room.players.some((p)=>!p.sinnerId))throw new Error('每位玩家都要先選擇罪人。');const area=AREAS.find((a)=>a.id===room.areaId);if(area.requiredLevel&&room.players.some((p)=>p.level<area.requiredLevel))throw new Error(`此區域需要全隊至少 Lv.${area.requiredLevel}。`);room.phase='exploration';room.run+=1;room.currentEvent=pickEvent(room);room.eventResult=null;room.votes={};persist();emitRoom(room);ack({ok:true})}catch(error){ack({ok:false,error:error.message})}});
  socket.on('event:vote',({roomId,optionId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);if(room.phase!=='exploration'||!room.currentEvent||room.eventResult)throw new Error('目前沒有可投票事件。');if(!room.currentEvent.options.some((o)=>o.id===optionId))throw new Error('無效選項。');room.votes[player.id]=optionId;persist();resolveCurrentEvent(room);emitRoom(room);ack({ok:true})}catch(error){ack({ok:false,error:error.message})}});
  socket.on('event:next',({roomId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);if(player.id!==room.hostId)throw new Error('只有房主可以繼續探索。');if(!room.eventResult)throw new Error('目前事件尚未結算。');room.run+=1;room.currentEvent=pickEvent(room);room.eventResult=null;room.votes={};persist();emitRoom(room);ack({ok:true})}catch(error){ack({ok:false,error:error.message})}});
  socket.on('disconnect',()=>{const result=markDisconnected(socket.id);if(!result?.room)return;emitRoom(result.room);const {id:roomId}=result.room,{id:playerId,disconnectedAt}=result.player;setTimeout(()=>{const removed=removeExpiredPlayer(roomId,playerId,disconnectedAt);if(removed?.room)emitRoom(removed.room)},RECONNECT_GRACE_MS+1000)});
});

server.listen(PORT,()=>console.log(`Multiplayer v0.5: http://localhost:${PORT}`));
