const path=require('path');
const http=require('http');
const express=require('express');
const {Server}=require('socket.io');
const {rooms,loadPersistedRooms}=require('./room/room-manager');
const {registerSocketHandlers,gameDataPayload}=require('./socket-handlers');

const PORT=Number(process.env.PORT||3000);
const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:'*'}});

loadPersistedRooms();
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'..','client')));
app.get('/shared/check-rules.js',(_req,res)=>res.sendFile(path.join(__dirname,'..','shared','check-rules.js')));
app.get('/shared/cards.js',(_req,res)=>res.sendFile(path.join(__dirname,'..','shared','cards.js')));
app.get('/health',(_req,res)=>res.json({ok:true,rooms:rooms.size,version:'0.22.0'}));
app.get('/api/game-data',(_req,res)=>res.json(gameDataPayload()));

registerSocketHandlers(io);
server.listen(PORT,()=>console.log(`Multiplayer v0.22.0: http://localhost:${PORT}`));
