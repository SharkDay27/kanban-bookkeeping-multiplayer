const path=require('path');
const http=require('http');
const express=require('express');
const {Server}=require('socket.io');
const {AREAS,SINNERS,STATUS_EFFECTS}=require('../shared/game-data');
const {
  createRoom,joinRoom,resumeRoom,restoreRoom,markDisconnected,removeExpiredPlayer,
  toggleArea,setSinner,publicRoom,rooms,RECONNECT_GRACE_MS,
  signRecovery,recoverySnapshot,persist,loadPersistedRooms,resetForStart
}=require('./room-manager');
const {COMBAT_ACTIONS,resolveCombatRound,useConsumable}=require('./runtime-combat');
const {enterCurrentNode,resolveEvent,advanceNode}=require('./runtime-expedition');

const PORT=Number(process.env.PORT||3000);
const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:'*'}});

loadPersistedRooms();
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'..','client')));
app.get('/health',(_req,res)=>res.json({ok:true,rooms:rooms.size,version:'0.8.2'}));
app.get('/api/game-data',(_req,res)=>res.json({areas:AREAS,sinners:SINNERS,statusEffects:STATUS_EFFECTS}));

function getContext(room,socket){
  const player=room?.players.find((p)=>p.socketId===socket.id&&p.connected);
  if(!room||!player)throw new Error('你不在這個房間。');
  return player;
}
function sessionPayload(room,player){
  return {
    ok:true,room:publicRoom(room),selfId:player.id,reconnectToken:player.reconnectToken,
    recoveryToken:player.id===room.hostId?signRecovery(room):null,
    recoverySnapshot:player.id===room.hostId?recoverySnapshot(room):null,
    gameData:{areas:AREAS,sinners:SINNERS,statusEffects:STATUS_EFFECTS}
  };
}
function emitRoom(room){
  io.to(room.id).emit('room:update',publicRoom(room));
  const host=room.players.find((p)=>p.id===room.hostId&&p.connected&&p.socketId);
  if(host)io.to(host.socketId).emit('room:recovery',{recoveryToken:signRecovery(room),recoverySnapshot:recoverySnapshot(room)});
}
function withRoom(roomId,socket){
  const room=rooms.get(String(roomId||'').toUpperCase());
  const player=getContext(room,socket);
  return {room,player};
}

io.on('connection',(socket)=>{
  socket.on('room:create',({playerName,reconnectToken},ack=()=>{})=>{
    try{const {room,player}=createRoom(socket.id,playerName,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room);}catch(e){ack({ok:false,error:e.message});}
  });
  socket.on('room:join',({roomId,playerName,reconnectToken},ack=()=>{})=>{
    try{const {room,player}=joinRoom(roomId,socket.id,playerName,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room);}catch(e){ack({ok:false,error:e.message});}
  });
  socket.on('room:resume',({roomId,playerId,reconnectToken},ack=()=>{})=>{
    try{const {room,player}=resumeRoom(roomId,socket.id,playerId,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room);}catch(e){ack({ok:false,error:e.message});}
  });
  socket.on('room:restore',({snapshot,recoveryToken,playerId,reconnectToken},ack=()=>{})=>{
    try{const {room,player}=restoreRoom(snapshot,recoveryToken,socket.id,playerId,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room);}catch(e){ack({ok:false,error:e.message});}
  });
  const toggleMap=({roomId,areaId},ack=()=>{})=>{
    try{const {room,player}=withRoom(roomId,socket);toggleArea(room,player,areaId);emitRoom(room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}
  };
  socket.on('room:map-toggle',toggleMap);
  socket.on('room:area-toggle',toggleMap);
  socket.on('player:sinner',({roomId,sinnerId},ack=()=>{})=>{
    try{const {room,player}=withRoom(roomId,socket);setSinner(room,player,sinnerId);emitRoom(room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}
  });
  socket.on('room:start',({roomId},ack=()=>{})=>{
    try{
      const {room,player}=withRoom(roomId,socket);
      if(player.id!==room.hostId)throw new Error('只有房主可以開始。');
      if(room.players.some((p)=>!p.connected))throw new Error('有玩家目前離線。');
      if(room.players.some((p)=>!p.sinnerId))throw new Error('每位玩家都要先選擇罪人。');
      resetForStart(room);
      enterCurrentNode(room);
      emitRoom(room);
      ack({ok:true});
    }catch(e){ack({ok:false,error:e.message});}
  });
  socket.on('event:vote',({roomId,optionId},ack=()=>{})=>{
    try{
      const {room,player}=withRoom(roomId,socket);
      if(room.phase!=='exploration')throw new Error('目前不在遠征中。');
      const options=room.combat?COMBAT_ACTIONS:room.currentEvent?.options;
      if(!options?.some((o)=>o.id===optionId))throw new Error('無效行動。');
      room.votes[player.id]=optionId;
      persist();
      if(room.combat)resolveCombatRound(room);else resolveEvent(room);
      emitRoom(room);
      ack({ok:true});
    }catch(e){ack({ok:false,error:e.message});}
  });
  socket.on('item:use',({roomId,slot},ack=()=>{})=>{
    try{
      const {room,player}=withRoom(roomId,socket);
      if(room.phase!=='exploration')throw new Error('目前不能使用道具。');
      const text=useConsumable(room,player,Number(slot));
      emitRoom(room);
      ack({ok:true,text});
    }catch(e){ack({ok:false,error:e.message});}
  });
  socket.on('event:next',({roomId},ack=()=>{})=>{
    try{
      const {room,player}=withRoom(roomId,socket);
      if(player.id!==room.hostId)throw new Error('只有房主可以推進遠征。');
      if(!room.eventResult)throw new Error('目前節點尚未完成。');
      advanceNode(room);
      emitRoom(room);
      ack({ok:true});
    }catch(e){ack({ok:false,error:e.message});}
  });
  socket.on('disconnect',()=>{
    const result=markDisconnected(socket.id);
    if(!result?.room)return;
    emitRoom(result.room);
    const roomId=result.room.id,playerId=result.player.id,disconnectedAt=result.player.disconnectedAt;
    setTimeout(()=>{const removed=removeExpiredPlayer(roomId,playerId,disconnectedAt);if(removed?.room)emitRoom(removed.room);},RECONNECT_GRACE_MS+1000);
  });
});

server.listen(PORT,()=>console.log(`Multiplayer v0.8.2: http://localhost:${PORT}`));
