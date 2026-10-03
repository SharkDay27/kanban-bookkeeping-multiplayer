const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { AREAS, SINNERS, EVENTS, NORMAL_ENEMIES, ELITE_ENEMIES, BOSSES, SUPPLIES, REST_NODES, EQUIPMENT, CONSUMABLES } = require('../shared/game-data');
const {
  createRoom, joinRoom, resumeRoom, restoreRoom, markDisconnected, removeExpiredPlayer,
  setArea, setSinner, publicRoom, rooms, RECONNECT_GRACE_MS,
  signRecovery, recoverySnapshot, persist, loadPersistedRooms, resetForStart
} = require('./room-manager');

const PORT = Number(process.env.PORT || 3000);
const app = express();
const server = http.createServer(app);
const io = new Server(server,{cors:{origin:'*'}});

loadPersistedRooms();
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'..','client')));
app.get('/health',(_req,res)=>res.json({ok:true,rooms:rooms.size,version:'0.7.0'}));
app.get('/api/game-data',(_req,res)=>res.json({areas:AREAS,sinners:SINNERS}));

const EVENT_ACTIONS={
  observe:{id:'observe',label:'觀察判讀',stat:'observe',statLabel:'觀察',risk:'低風險',desc:'確認異常規律與安全路線。',bonus:1},
  steady:{id:'steady',label:'穩固處置',stat:'stability',statLabel:'穩定',risk:'中風險',desc:'控制現場並固定危險源。',bonus:0},
  move:{id:'move',label:'機動突破',stat:'mobility',statLabel:'機動',risk:'中風險',desc:'利用速度與地形穿越危險。',bonus:0},
  force:{id:'force',label:'強行制壓',stat:'combat',statLabel:'戰鬥',risk:'高風險',desc:'直接壓制或破壞威脅。',bonus:-1}
};
const THEME_ACTIONS={lure:['observe','steady','move'],terrain:['observe','move','steady'],mechanical:['steady','observe','force'],time:['observe','steady','move'],sound:['observe','steady','move'],chemical:['observe','steady','move'],unknown:['observe','steady','force']};
const COMBAT_ACTIONS=[
  {id:'attack',label:'攻擊',stat:'combat',statLabel:'戰鬥',desc:'直接攻擊敵人。'},
  {id:'guard',label:'防禦',stat:'stability',statLabel:'穩定',desc:'降低本回合敵人的反擊傷害。'},
  {id:'analyze',label:'觀察弱點',stat:'observe',statLabel:'觀察',desc:'降低敵人防禦並增加線索。'}
];

function getContext(room,socket){const player=room?.players.find((p)=>p.socketId===socket.id&&p.connected);if(!room||!player)throw new Error('你不在這個房間。');return player;}
function sessionPayload(room,player){return {ok:true,room:publicRoom(room),selfId:player.id,reconnectToken:player.reconnectToken,recoveryToken:player.id===room.hostId?signRecovery(room):null,recoverySnapshot:player.id===room.hostId?recoverySnapshot(room):null,gameData:{areas:AREAS,sinners:SINNERS}};}
function emitRoom(room){io.to(room.id).emit('room:update',publicRoom(room));const host=room.players.find((p)=>p.id===room.hostId&&p.connected&&p.socketId);if(host)io.to(host.socketId).emit('room:recovery',{recoveryToken:signRecovery(room),recoverySnapshot:recoverySnapshot(room)});}
function randomFrom(list){return list[Math.floor(Math.random()*list.length)];}
function areaOf(room){return AREAS.find((a)=>a.id===room.areaId)||AREAS[0];}
function sinnerOf(player){return SINNERS.find((s)=>s.id===player.sinnerId);}
function eventOptions(event){const ids=THEME_ACTIONS[event.theme]||THEME_ACTIONS.unknown;return ids.map((id)=>({...EVENT_ACTIONS[id]}));}
function fallbackEvent(area){return {area:area.id,id:`fallback-${area.id}-${Date.now()}`,name:`${area.name}：未確認異常`,theme:'unknown',difficulty:5,description:'前方出現尚未歸檔的異常徵兆。',success:'你們確認安全路線並繼續深入。',failure:'判斷失誤讓局勢惡化。'};}
function pickEvent(room){const area=areaOf(room),pool=EVENTS.filter((e)=>e.area===area.id);const event=pool.length?randomFrom(pool):fallbackEvent(area);return {...event,sceneType:'event',options:eventOptions(event)};}
function pickEnemy(room,type){const source=type==='boss'?BOSSES:type==='elite'?ELITE_ENEMIES:NORMAL_ENEMIES;const pool=source.filter((e)=>e.area===room.areaId);return randomFrom(pool.length?pool:source);}
function equipmentStats(player){const mods={combat:0,observe:0,mobility:0,stability:0};for(const item of Object.values(player.equipment||{})){if(!item?.mods)continue;for(const key of Object.keys(mods))mods[key]+=Number(item.mods[key]||0);}return mods;}
function statFor(player,key){const sinner=sinnerOf(player);return Number(sinner?.stats?.[key]||0)+Number(equipmentStats(player)[key]||0);}
function currentNode(room){return room.exploration.route[room.exploration.position];}
function markCurrentNodeResolved(room){const node=currentNode(room);if(node)node.resolved=true;}

function awardSupply(room){
  const supply=randomFrom(SUPPLIES);const recipient=randomFrom(room.players.filter((p)=>p.connected));let reward;
  const giveEquipment=supply.pool==='equipment'||(supply.pool==='mixed'&&Math.random()<.45);
  if(giveEquipment){reward={...randomFrom(EQUIPMENT)};recipient.equipment[reward.slot]=reward;}
  else {reward={...randomFrom(CONSUMABLES)};if(recipient.inventory.length<4)recipient.inventory.push(reward);else room.sharedInventory.push(reward);}
  room.nodeReward={type:'supply',title:supply.name,text:supply.description,recipientId:recipient.id,reward};
  room.eventResult={degree:'supply',text:`${recipient.name} 取得「${reward.name}」。`,damage:0};markCurrentNodeResolved(room);persist();
}
function resolveRest(room){const rest=randomFrom(REST_NODES);const healed=[];for(const p of room.players){const before=p.hp;p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*rest.healPercent));healed.push({playerId:p.id,amount:p.hp-before});}room.nodeReward={type:'rest',title:rest.name,text:rest.description,healed};room.eventResult={degree:'rest',text:`${rest.description} 全隊獲得休整。`,damage:0};markCurrentNodeResolved(room);persist();}
function startCombat(room,type){const enemy=pickEnemy(room,type);room.combat={kind:type,enemy:{...enemy,currentHp:enemy.hp,maxHp:enemy.hp,defensePenalty:0},round:1,log:[],options:COMBAT_ACTIONS};room.currentEvent=null;room.eventResult=null;room.votes={};persist();}
function enterCurrentNode(room){room.currentEvent=null;room.eventResult=null;room.combat=null;room.nodeReward=null;room.votes={};const node=currentNode(room);if(!node)return;room.exploration.scenes+=1;if(node.type==='event')room.currentEvent=pickEvent(room);else if(node.type==='combat'||node.type==='elite'||node.type==='boss')startCombat(room,node.type);else if(node.type==='supply')awardSupply(room);else if(node.type==='rest')resolveRest(room);persist();}

function resolveEvent(room){
  if(!room.currentEvent)return null;const active=room.players.filter((p)=>p.connected);if(!active.length||active.some((p)=>!room.votes[p.id]))return null;
  const area=areaOf(room);const contributions=active.map((p)=>{const option=room.currentEvent.options.find((o)=>o.id===room.votes[p.id]);const value=statFor(p,option?.stat);return {playerId:p.id,sinner:sinnerOf(p)?.name||p.name,actionLabel:option?.label||'',statLabel:option?.statLabel||'',statValue:value,bonus:option?.bonus||0};});
  const avg=contributions.reduce((s,x)=>s+x.statValue+x.bonus,0)/active.length;const modifier=Math.round(avg/2);const dc=11+Number(room.currentEvent.difficulty||0)+room.exploration.danger;const die=1+Math.floor(Math.random()*20),total=die+modifier;
  let degree='failure';if(die===20||total>=dc+5)degree='critical';else if(total>=dc)degree='success';else if(total>=dc-3)degree='mixed';else if(die===1||total<=dc-7)degree='critical-failure';
  let damage=0,cluesDelta=0,dangerDelta=0;if(degree==='critical'){cluesDelta=2;dangerDelta=-1;}else if(degree==='success'){cluesDelta=1;}else if(degree==='mixed'){cluesDelta=1;dangerDelta=1;damage=3;}else if(degree==='failure'){dangerDelta=2;damage=7;}else{dangerDelta=3;damage=11;}
  room.players.forEach((p)=>{p.hp=Math.max(0,p.hp-damage);});room.exploration.clues=Math.max(0,room.exploration.clues+cluesDelta);room.exploration.danger=Math.max(0,Math.min(6,room.exploration.danger+dangerDelta));
  room.eventResult={degree,die,modifier,total,dc,text:['critical','success','mixed'].includes(degree)?room.currentEvent.success:room.currentEvent.failure,damage,cluesDelta,dangerDelta,contributions};markCurrentNodeResolved(room);checkDefeat(room);persist();return room.eventResult;
}
function resolveCombatRound(room){
  const combat=room.combat;if(!combat)return null;const active=room.players.filter((p)=>p.connected&&p.hp>0);if(!active.length||active.some((p)=>!room.votes[p.id]))return null;
  let teamDamage=0,guards=0,analysis=0;const rolls=[];
  for(const p of active){const action=COMBAT_ACTIONS.find((a)=>a.id===room.votes[p.id])||COMBAT_ACTIONS[0];const stat=statFor(p,action.stat);const die=1+Math.floor(Math.random()*20);const total=die+Math.round(stat/2);let dealt=0;if(action.id==='attack'&&total>=Math.max(8,combat.enemy.defense-combat.enemy.defensePenalty)){dealt=Math.max(4,Math.round(stat*1.4)+Math.floor(Math.random()*7));teamDamage+=dealt;}if(action.id==='guard')guards++;if(action.id==='analyze'&&total>=11){analysis++;combat.enemy.defensePenalty=Math.min(5,combat.enemy.defensePenalty+1);room.exploration.clues+=1;}rolls.push({playerId:p.id,sinner:sinnerOf(p)?.name||p.name,action:action.label,die,total,dealt});}
  combat.enemy.currentHp=Math.max(0,combat.enemy.currentHp-teamDamage);
  if(combat.enemy.currentHp<=0){combat.log.push({round:combat.round,text:`敵人受到 ${teamDamage} 傷害並被擊敗。`});room.eventResult={degree:combat.kind==='boss'?'boss-victory':'combat-victory',text:`擊敗 ${combat.enemy.name}。`,damage:0,rolls};markCurrentNodeResolved(room);room.votes={};if(combat.kind==='boss')room.phase='victory';persist();return room.eventResult;}
  const base=Math.max(2,Math.round(combat.enemy.attack*(combat.kind==='boss'?1:.75)));const mitigation=Math.min(.7,guards*.22);const incoming=Math.max(1,Math.round(base*(1-mitigation)));active.forEach((p)=>{p.hp=Math.max(0,p.hp-incoming);});combat.log.push({round:combat.round,text:`隊伍造成 ${teamDamage} 傷害；${combat.enemy.name} 反擊，全隊各受到 ${incoming} 傷害。`});combat.round+=1;room.votes={};checkDefeat(room);persist();return {round:combat.round-1,teamDamage,incoming,analysis,rolls};
}
function checkDefeat(room){if(room.exploration.danger>=6||room.players.every((p)=>p.hp<=0)){room.phase='defeat';return true;}return false;}
function advanceNode(room){if(room.phase==='victory'||room.phase==='defeat')return;if(!currentNode(room)?.resolved)throw new Error('目前節點尚未完成。');if(room.exploration.position>=9)return;room.exploration.position+=1;room.run+=1;enterCurrentNode(room);}

io.on('connection',(socket)=>{
  socket.on('room:create',({playerName,reconnectToken},ack=()=>{})=>{try{const {room,player}=createRoom(socket.id,playerName,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room);}catch(e){ack({ok:false,error:e.message});}});
  socket.on('room:join',({roomId,playerName,reconnectToken},ack=()=>{})=>{try{const {room,player}=joinRoom(roomId,socket.id,playerName,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room);}catch(e){ack({ok:false,error:e.message});}});
  socket.on('room:resume',({roomId,playerId,reconnectToken},ack=()=>{})=>{try{const {room,player}=resumeRoom(roomId,socket.id,playerId,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room);}catch(e){ack({ok:false,error:e.message});}});
  socket.on('room:restore',({snapshot,recoveryToken,playerId,reconnectToken},ack=()=>{})=>{try{const {room,player}=restoreRoom(snapshot,recoveryToken,socket.id,playerId,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room);}catch(e){ack({ok:false,error:e.message});}});
  socket.on('room:area',({roomId,areaId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);setArea(room,player,areaId);emitRoom(room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});
  socket.on('player:sinner',({roomId,sinnerId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);setSinner(room,player,sinnerId);emitRoom(room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});
  socket.on('room:start',({roomId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),actor=getContext(room,socket);if(actor.id!==room.hostId)throw new Error('只有房主可以開始。');if(room.players.some((p)=>!p.connected))throw new Error('有玩家目前離線。');if(room.players.some((p)=>!p.sinnerId))throw new Error('每位玩家都要先選擇罪人。');resetForStart(room);enterCurrentNode(room);emitRoom(room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});
  socket.on('event:vote',({roomId,optionId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);if(room.phase!=='exploration')throw new Error('目前不在遠征中。');const options=room.combat?COMBAT_ACTIONS:room.currentEvent?.options;if(!options?.some((o)=>o.id===optionId))throw new Error('無效行動。');room.votes[player.id]=optionId;persist();if(room.combat)resolveCombatRound(room);else resolveEvent(room);emitRoom(room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});
  socket.on('event:next',({roomId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);if(player.id!==room.hostId)throw new Error('只有房主可以推進路線。');advanceNode(room);emitRoom(room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});
  socket.on('disconnect',()=>{const result=markDisconnected(socket.id);if(!result?.room)return;emitRoom(result.room);const {id:roomId}=result.room,{id:playerId,disconnectedAt}=result.player;setTimeout(()=>{const removed=removeExpiredPlayer(roomId,playerId,disconnectedAt);if(removed?.room)emitRoom(removed.room);},RECONNECT_GRACE_MS+1000);});
});

server.listen(PORT,()=>console.log(`Multiplayer v0.7 expedition: http://localhost:${PORT}`));
