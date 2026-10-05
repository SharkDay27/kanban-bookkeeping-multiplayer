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
// Upgrade unfinished saved battles without resetting HP, inventory or card ownership.
for(const room of rooms.values()){const c=room.combat;if(!c||c.ended||Number(c.rulesVersion)>=28)continue;for(const e of c.enemies||[]){e.mobility=Number(e.mobility||5);e.baseName=e.baseName||e.name;const old=e.parts||[];e.parts=require('./combat/combat-parts').makeParts(e,e.role);e.parts.forEach((p,i)=>{if(old[i]){p.currentHp=Math.round(p.maxHp*Math.max(0,old[i].currentHp)/Math.max(1,old[i].maxHp));p.destroyed=p.currentHp<=0;}});}require('./combat/combat-enemies').labelDuplicates(c.enemies||[]);c.selections={};c.lastResolution=null;c.rulesVersion=28;for(const p of room.players){const d=c.cardDecks?.[p.id];if(d&&p.hp>0)require('./cards/card-manager').draw(d,Math.max(0,6-d.hand.length));}require('./combat/combat-intents').setEnemyIntents(c);}
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'..','client')));
app.get('/shared/check-rules.js',(_req,res)=>res.sendFile(path.join(__dirname,'..','shared','check-rules.js')));
app.get('/shared/skill-requirements.js',(_req,res)=>res.sendFile(path.join(__dirname,'..','shared','skill-requirements.js')));
app.get('/shared/cards.js',(_req,res)=>res.sendFile(path.join(__dirname,'..','shared','cards.js')));
app.get('/health',(_req,res)=>res.json({ok:true,rooms:rooms.size,version:'0.30.0'}));
app.get('/api/game-data',(_req,res)=>res.json(gameDataPayload()));

registerSocketHandlers(io);
server.listen(PORT,()=>console.log(`Multiplayer v0.30.0: http://localhost:${PORT}`));
