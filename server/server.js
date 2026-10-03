const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { AREAS, SINNERS, EVENTS } = require('../shared/game-data');
const {
  createRoom, joinRoom, resumeRoom, restoreRoom, markDisconnected, removeExpiredPlayer,
  setArea, setSinner, publicRoom, rooms, RECONNECT_GRACE_MS,
  signRecovery, recoverySnapshot, persist, loadPersistedRooms, freshExploration
} = require('./room-manager');

const PORT = Number(process.env.PORT || 3000);
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

loadPersistedRooms();
app.use(express.json({ limit:'1mb' }));
app.use(express.static(path.join(__dirname, '..', 'client')));
app.get('/health', (_req, res) => res.json({ ok:true, rooms:rooms.size, version:'0.6.0' }));
app.get('/api/game-data', (_req, res) => res.json({ areas:AREAS, sinners:SINNERS }));

const ACTIONS = {
  observe:{ id:'observe', label:'觀察判讀', stat:'observe', statLabel:'觀察', risk:'低風險', desc:'先確認異常規律與安全路線，再決定如何行動。', bonus:1 },
  steady:{ id:'steady', label:'穩固處置', stat:'stability', statLabel:'穩定', risk:'中風險', desc:'控制現場、固定危險源，以穩健方式處理問題。', bonus:0 },
  move:{ id:'move', label:'機動突破', stat:'mobility', statLabel:'機動', risk:'中風險', desc:'利用速度、地形與時機快速穿越危險區域。', bonus:0 },
  force:{ id:'force', label:'強行制壓', stat:'combat', statLabel:'戰鬥', risk:'高風險', desc:'直接破壞、壓制或逼退威脅，成功快但失敗代價較高。', bonus:-1 }
};
const THEME_ACTIONS = {
  lure:['observe','steady','move'], terrain:['observe','move','steady'], mechanical:['steady','observe','force'],
  time:['observe','steady','move'], sound:['observe','steady','move'], chemical:['observe','steady','move'], unknown:['observe','steady','force']
};
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
  return { area:area.id, id:`fallback-${area.id}-${Date.now()}`, name:`${area.name}：未確認異常`, theme:'unknown', difficulty:Math.max(1,Math.round(area.level/3)), description:`隊伍在「${area.name}」發現尚未歸檔的異常徵兆。空氣、聲音與路線都出現不一致，你們需要決定如何處理。`, success:'隊伍掌握了異常規律，找到可以繼續深入的路。', failure:'判斷出現偏差，異常趁著空檔反過來逼近隊伍。' };
}
function eventOptions(event) {
  const ids = THEME_ACTIONS[event.theme] || THEME_ACTIONS.unknown;
  return ids.map((id)=>({ ...ACTIONS[id] }));
}
function pickEvent(room) {
  const area = AREAS.find((a)=>a.id===room.areaId)||AREAS[0];
  const pool = EVENTS.filter((e)=>e.area===area.id);
  const event = pool.length?pool[Math.floor(Math.random()*pool.length)]:fallbackEvent(area);
  return {...event,options:eventOptions(event)};
}
function sinnerForPlayer(player){ return SINNERS.find((s)=>s.id===player.sinnerId); }
function resolveCurrentEvent(room) {
  if(!room.currentEvent)return null;
  const activePlayers=room.players.filter((p)=>p.connected);
  if(!activePlayers.length||activePlayers.some((p)=>!room.votes[p.id]))return null;
  const area=AREAS.find((a)=>a.id===room.areaId)||AREAS[0];
  const contributions=activePlayers.map((p)=>{
    const option=room.currentEvent.options.find((o)=>o.id===room.votes[p.id]);
    const sinner=sinnerForPlayer(p);
    const statValue=sinner?.stats?.[option?.stat] || 0;
    return { playerId:p.id, playerName:p.name, sinner:sinner?.name||p.name, actionId:option?.id, actionLabel:option?.label||'未知行動', stat:option?.stat, statLabel:option?.statLabel||'', statValue };
  });
  const avgStat=contributions.reduce((sum,x)=>sum+x.statValue,0)/Math.max(1,contributions.length);
  const avgActionBonus=contributions.reduce((sum,x)=>sum+(ACTIONS[x.actionId]?.bonus||0),0)/Math.max(1,contributions.length);
  const modifier=Math.round(avgStat/2+avgActionBonus);
  const dc=Math.max(9,Math.round(8+area.level*.2+Number(room.currentEvent.difficulty||0)*.4+(room.exploration?.danger||0)*.35));
  const die=1+Math.floor(Math.random()*20);
  const total=die+modifier;
  let degree='failure';
  if(die===20 || total>=dc+5)degree='critical';
  else if(total>=dc)degree='success';
  else if(total>=dc-3)degree='mixed';
  else if(die===1 || total<=dc-7)degree='critical-failure';

  room.exploration = room.exploration || freshExploration();
  const baseDamage=Math.max(3,Math.round(3+area.level*.55));
  let damage=0,progressDelta=0,cluesDelta=0,dangerDelta=0,text='';
  if(degree==='critical') { progressDelta=2; cluesDelta=2; dangerDelta=-1; text=`大成功。${room.currentEvent.success}你們還發現了額外線索，並讓局勢暫時穩定下來。`; }
  if(degree==='success') { progressDelta=2; cluesDelta=1; text=`成功。${room.currentEvent.success}`; }
  if(degree==='mixed') { progressDelta=1; cluesDelta=1; dangerDelta=1; damage=Math.max(1,Math.round(baseDamage*.35)); text=`代價成功。${room.currentEvent.success}但過程留下破綻，隊伍付出了一些代價。`; }
  if(degree==='failure') { dangerDelta=2; damage=baseDamage; text=`失敗。${room.currentEvent.failure}`; }
  if(degree==='critical-failure') { dangerDelta=3; damage=Math.round(baseDamage*1.5); text=`大失敗。${room.currentEvent.failure}情勢迅速惡化。`; }
  if(damage)room.players.forEach((p)=>{p.hp=Math.max(0,p.hp-damage)});
  room.exploration.progress=Math.max(0,Math.min(room.exploration.progressGoal,room.exploration.progress+progressDelta));
  room.exploration.clues=Math.max(0,room.exploration.clues+cluesDelta);
  room.exploration.danger=Math.max(0,Math.min(room.exploration.dangerMax,room.exploration.danger+dangerDelta));
  room.exploration.scenes=(room.exploration.scenes||0)+1;
  room.eventResult={degree,die,modifier,total,dc,text,damage,progressDelta,cluesDelta,dangerDelta,contributions};
  persist();return room.eventResult;
}

io.on('connection',(socket)=>{
  socket.on('room:create',({playerName,reconnectToken},ack=()=>{})=>{try{const {room,player}=createRoom(socket.id,playerName,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room)}catch(error){ack({ok:false,error:error.message})}});
  socket.on('room:join',({roomId,playerName,reconnectToken},ack=()=>{})=>{try{const {room,player}=joinRoom(roomId,socket.id,playerName,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room)}catch(error){ack({ok:false,error:error.message})}});
  socket.on('room:resume',({roomId,playerId,reconnectToken},ack=()=>{})=>{try{const {room,player}=resumeRoom(roomId,socket.id,playerId,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room)}catch(error){ack({ok:false,error:error.message})}});
  socket.on('room:restore',({snapshot,recoveryToken,playerId,reconnectToken},ack=()=>{})=>{try{const {room,player}=restoreRoom(snapshot,recoveryToken,socket.id,playerId,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room)}catch(error){ack({ok:false,error:error.message})}});
  socket.on('room:area',({roomId,areaId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);setArea(room,player,areaId);emitRoom(room);ack({ok:true})}catch(error){ack({ok:false,error:error.message})}});
  socket.on('player:sinner',({roomId,sinnerId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);setSinner(room,player,sinnerId);emitRoom(room);ack({ok:true})}catch(error){ack({ok:false,error:error.message})}});
  socket.on('room:start',({roomId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),actor=getContext(room,socket);if(actor.id!==room.hostId)throw new Error('只有房主可以開始。');if(room.players.length<2)throw new Error('至少需要 2 名玩家。');if(room.players.some((p)=>!p.connected))throw new Error('有玩家目前離線，請等他重新連線。');if(room.players.some((p)=>!p.sinnerId))throw new Error('每位玩家都要先選擇罪人。');const area=AREAS.find((a)=>a.id===room.areaId);if(area.requiredLevel&&room.players.some((p)=>p.level<area.requiredLevel))throw new Error(`此區域需要全隊至少 Lv.${area.requiredLevel}。`);room.phase='exploration';room.run+=1;room.exploration=freshExploration();room.currentEvent=pickEvent(room);room.eventResult=null;room.votes={};persist();emitRoom(room);ack({ok:true})}catch(error){ack({ok:false,error:error.message})}});
  socket.on('event:vote',({roomId,optionId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);if(room.phase!=='exploration'||!room.currentEvent||room.eventResult)throw new Error('目前沒有可宣告的場景行動。');if(!room.currentEvent.options.some((o)=>o.id===optionId))throw new Error('無效行動。');room.votes[player.id]=optionId;persist();resolveCurrentEvent(room);emitRoom(room);ack({ok:true})}catch(error){ack({ok:false,error:error.message})}});
  socket.on('event:next',({roomId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);if(player.id!==room.hostId)throw new Error('只有房主可以推進場景。');if(!room.eventResult)throw new Error('目前場景尚未結算。');room.run+=1;room.currentEvent=pickEvent(room);room.eventResult=null;room.votes={};persist();emitRoom(room);ack({ok:true})}catch(error){ack({ok:false,error:error.message})}});
  socket.on('disconnect',()=>{const result=markDisconnected(socket.id);if(!result?.room)return;emitRoom(result.room);const {id:roomId}=result.room,{id:playerId,disconnectedAt}=result.player;setTimeout(()=>{const removed=removeExpiredPlayer(roomId,playerId,disconnectedAt);if(removed?.room)emitRoom(removed.room)},RECONNECT_GRACE_MS+1000)});
});

server.listen(PORT,()=>console.log(`Multiplayer v0.6 TRPG: http://localhost:${PORT}`));
