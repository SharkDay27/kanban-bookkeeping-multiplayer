const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { AREAS, SINNERS, EVENTS, NORMAL_ENEMIES, ELITE_ENEMIES, BOSSES, SUPPLIES, REST_NODES, EQUIPMENT, CONSUMABLES, STATUS_EFFECTS, getStatus } = require('../shared/game-data');
const { createRoom, joinRoom, resumeRoom, restoreRoom, markDisconnected, removeExpiredPlayer, toggleArea, setSinner, publicRoom, rooms, RECONNECT_GRACE_MS, signRecovery, recoverySnapshot, persist, loadPersistedRooms, resetForStart, beginNextArea, NODE_LABELS } = require('./room-manager');

const PORT = Number(process.env.PORT || 3000);
const app = express();
const server = http.createServer(app);
const io = new Server(server,{cors:{origin:'*'}});
loadPersistedRooms();
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'..','client')));
app.get('/health',(_req,res)=>res.json({ok:true,rooms:rooms.size,version:'0.8.0'}));
app.get('/api/game-data',(_req,res)=>res.json({areas:AREAS,sinners:SINNERS,statusEffects:STATUS_EFFECTS}));

const EVENT_ACTIONS={
  observe:{id:'observe',label:'觀察判讀',stat:'observe',statLabel:'觀察',risk:'低風險',desc:'確認異常規律與安全路線。',bonus:1},
  steady:{id:'steady',label:'穩固處置',stat:'stability',statLabel:'穩定',risk:'中風險',desc:'控制現場並固定危險源。',bonus:0},
  move:{id:'move',label:'機動突破',stat:'mobility',statLabel:'機動',risk:'中風險',desc:'利用速度與地形穿越危險。',bonus:0},
  force:{id:'force',label:'強行制壓',stat:'combat',statLabel:'戰鬥',risk:'高風險',desc:'直接壓制或破壞威脅。',bonus:-1}
};
const THEME_ACTIONS={lure:['observe','steady','move'],terrain:['observe','move','steady'],mechanical:['steady','observe','force'],time:['observe','steady','move'],sound:['observe','steady','move'],chemical:['observe','steady','move'],unknown:['observe','steady','force']};
const COMBAT_ACTIONS=[
  {id:'attack',label:'攻擊',stat:'combat',statLabel:'戰鬥',desc:'直接攻擊敵人。'},
  {id:'guard',label:'防禦',stat:'stability',statLabel:'穩定',desc:'降低本回合受到的傷害。'},
  {id:'analyze',label:'觀察弱點',stat:'observe',statLabel:'觀察',desc:'降低敵人防禦並增加線索。'}
];

function getContext(room,socket){const player=room?.players.find((p)=>p.socketId===socket.id&&p.connected);if(!room||!player)throw new Error('你不在這個房間。');return player;}
function sessionPayload(room,player){return {ok:true,room:publicRoom(room),selfId:player.id,reconnectToken:player.reconnectToken,recoveryToken:player.id===room.hostId?signRecovery(room):null,recoverySnapshot:player.id===room.hostId?recoverySnapshot(room):null,gameData:{areas:AREAS,sinners:SINNERS,statusEffects:STATUS_EFFECTS}};}
function emitRoom(room){io.to(room.id).emit('room:update',publicRoom(room));const host=room.players.find((p)=>p.id===room.hostId&&p.connected&&p.socketId);if(host)io.to(host.socketId).emit('room:recovery',{recoveryToken:signRecovery(room),recoverySnapshot:recoverySnapshot(room)});}
function randomFrom(list){return list[Math.floor(Math.random()*list.length)];}
function weightedPick(entries){const total=entries.reduce((s,e)=>s+Math.max(0,e.weight),0);let roll=Math.random()*total;for(const e of entries){roll-=Math.max(0,e.weight);if(roll<=0)return e.value;}return entries[entries.length-1].value;}
function areaOf(room){return AREAS.find((a)=>a.id===room.areaId)||AREAS[0];}
function sinnerOf(player){return SINNERS.find((s)=>s.id===player.sinnerId);}
function eventOptions(event){const ids=THEME_ACTIONS[event.theme]||THEME_ACTIONS.unknown;return ids.map((id)=>({...EVENT_ACTIONS[id]}));}
function equipmentStats(player){const mods={combat:0,observe:0,mobility:0,stability:0};for(const item of Object.values(player.equipment||{})){if(!item?.mods)continue;for(const key of Object.keys(mods))mods[key]+=Number(item.mods[key]||0);}return mods;}
function statusMods(player){const mods={combat:0,observe:0,mobility:0,stability:0};for(const active of player.statuses||[]){const def=getStatus(active.id);if(!def?.mods)continue;for(const k of Object.keys(mods))mods[k]+=Number(def.mods[k]||0);}return mods;}
function statFor(player,key){const sinner=sinnerOf(player);return Number(sinner?.stats?.[key]||0)+Number(equipmentStats(player)[key]||0)+Number(statusMods(player)[key]||0);}
function currentNode(room){return room.exploration.route[room.exploration.position];}
function markCurrentNodeResolved(room){const node=currentNode(room);if(node)node.resolved=true;}
function rarityWeight(rarity,danger,lootBonus=0){const d=Math.max(0,Math.min(5,danger));if(rarity==='rare')return 5+d*7+lootBonus*100;if(rarity==='uncommon')return 28+d*3;return Math.max(15,67-d*8);}
function playerLootBonus(player){return (player.statuses||[]).reduce((sum,s)=>sum+Number(getStatus(s.id)?.lootBonus||0),0);}
function pickReward(pool,danger,player){return weightedPick(pool.map((item)=>({value:item,weight:rarityWeight(item.rarity||'common',danger,playerLootBonus(player))})));}
function addStatus(player,statusId,duration){const def=getStatus(statusId);if(!def)return false;const existing=(player.statuses||[]).find((s)=>s.id===statusId);if(existing)existing.remaining=Math.max(existing.remaining,duration||def.duration||1);else player.statuses.push({id:statusId,remaining:duration||def.duration||1});return true;}
function removeStatus(player,statusId){player.statuses=(player.statuses||[]).filter((s)=>s.id!==statusId);}
function tickStatuses(players,scope='round'){
  for(const p of players){let tick=0;for(const active of p.statuses||[]){const def=getStatus(active.id);if(scope==='round'&&def?.tickDamage)tick+=def.tickDamage;active.remaining-=1;}if(tick)p.hp=Math.max(0,p.hp-tick);p.statuses=(p.statuses||[]).filter((s)=>s.remaining>0);}
}
function damageMultiplier(player){let m=1;for(const active of player.statuses||[]){const def=getStatus(active.id);if(def?.damageTakenMultiplier)m*=def.damageTakenMultiplier;}return m;}
function dangerShield(player){return (player.statuses||[]).reduce((s,a)=>s+Number(getStatus(a.id)?.dangerShield||0),0);}
function healMultiplier(player){return (player.statuses||[]).reduce((m,a)=>m*Number(getStatus(a.id)?.healingMultiplier||1),1);}

function chooseNextNodeType(danger){
  const d=Math.max(0,Math.min(5,danger));
  return weightedPick([
    {value:'event',weight:36-d*4},{value:'combat',weight:28+d*3},{value:'supply',weight:18-d*2},
    {value:'rest',weight:13-d*2},{value:'elite',weight:5+d*5}
  ]);
}
function revealNode(room,index){const node=room.exploration.route[index];if(!node||node.revealed)return node;if(index===9){node.type='boss';node.label='BOSS';node.revealed=true;return node;}node.type=chooseNextNodeType(room.exploration.danger);node.label=NODE_LABELS[node.type];node.revealed=true;return node;}
function fallbackEvent(area){return {area:area.id,id:`fallback-${area.id}-${Date.now()}`,name:`${area.name}：未確認異常`,theme:'unknown',difficulty:5,description:'前方出現尚未歸檔的異常徵兆。',success:'你們確認安全路線並繼續深入。',failure:'判斷失誤讓局勢惡化。'};}
function pickEvent(room){const area=areaOf(room),pool=EVENTS.filter((e)=>e.area===area.id);if(!pool.length)return {...fallbackEvent(area),sceneType:'event',options:eventOptions(fallbackEvent(area))};const target=room.exploration.danger*2+2;const event=weightedPick(pool.map((e)=>({value:e,weight:Math.max(2,18-Math.abs(Number(e.difficulty||0)-target)*3)})));return {...event,sceneType:'event',options:eventOptions(event)};}
function pickEnemy(room,type){const source=type==='boss'?BOSSES:type==='elite'?ELITE_ENEMIES:NORMAL_ENEMIES;const pool=source.filter((e)=>e.area===room.areaId);return {...randomFrom(pool.length?pool:source)};}
function scaledEnemy(room,type){const base=pickEnemy(room,type);const d=room.exploration.danger;const mult=1+d*(type==='boss'?.15:type==='elite'?.13:.1);return {...base,hp:Math.round(base.hp*mult),attack:Math.round(base.attack*(1+d*.08)),defense:Math.round(base.defense+d*.55)};}

function awardSupply(room,bonus=0){const supply=randomFrom(SUPPLIES),recipient=randomFrom(room.players.filter((p)=>p.connected)),danger=Math.min(5,room.exploration.danger+bonus);const equipmentChance=.38+danger*.07;let reward;if(Math.random()<equipmentChance){reward={...pickReward(EQUIPMENT,danger,recipient)};recipient.equipment[reward.slot]=reward;}else{reward={...pickReward(CONSUMABLES,danger,recipient)};if(recipient.inventory.length<4)recipient.inventory.push(reward);else room.sharedInventory.push(reward);}if(danger>=3&&Math.random()<.18+danger*.05)addStatus(recipient,randomFrom(STATUS_EFFECTS.filter((s)=>s.type==='buff')).id);room.nodeReward={type:'supply',title:supply.name,text:supply.description,recipientId:recipient.id,reward,quality:reward.rarity||'common'};room.eventResult={degree:'supply',text:`${recipient.name} 取得「${reward.name}」。`,damage:0};markCurrentNodeResolved(room);persist();}
function resolveRest(room){const rest=randomFrom(REST_NODES),healed=[];for(const p of room.players){const before=p.hp;const amount=Math.round(p.maxHp*rest.healPercent*healMultiplier(p));p.hp=Math.min(p.maxHp,p.hp+amount);healed.push({playerId:p.id,amount:p.hp-before});if(Math.random()<.35)removeStatus(p,randomFrom(['bleeding','shaken','slowed','weakened','marked','contaminated']));}room.exploration.danger=Math.max(0,room.exploration.danger-1);room.nodeReward={type:'rest',title:rest.name,text:rest.description,healed};room.eventResult={degree:'rest',text:`${rest.description} 全隊恢復狀態，危險度 -1。`,damage:0};markCurrentNodeResolved(room);persist();}
function startCombat(room,type){const enemy=scaledEnemy(room,type);room.combat={kind:type,enemy:{...enemy,currentHp:enemy.hp,maxHp:enemy.hp,defensePenalty:0},round:1,log:[],options:COMBAT_ACTIONS,enemyDamageMultiplier:1,serial:Date.now(),lastResolution:null};room.currentEvent=null;room.eventResult=null;room.votes={};persist();}
function enterCurrentNode(room){room.currentEvent=null;room.eventResult=null;room.combat=null;room.nodeReward=null;room.votes={};const node=currentNode(room);if(!node)return;revealNode(room,room.exploration.position);room.exploration.scenes+=1;if(node.type==='event')room.currentEvent=pickEvent(room);else if(['combat','elite','boss'].includes(node.type))startCombat(room,node.type);else if(node.type==='supply')awardSupply(room);else if(node.type==='rest')resolveRest(room);persist();}

function maybeApplyNegativeStatus(room,severity=1){const chance=.1+room.exploration.danger*.06+severity*.04;if(Math.random()>chance)return null;const target=randomFrom(room.players.filter((p)=>p.hp>0));const status=randomFrom(STATUS_EFFECTS.filter((s)=>s.type==='debuff'));addStatus(target,status.id);return {playerId:target.id,statusId:status.id,name:status.name};}
function resolveEvent(room){
  if(!room.currentEvent)return null;const active=room.players.filter((p)=>p.connected);if(!active.length||active.some((p)=>!room.votes[p.id]))return null;
  const contributions=active.map((p)=>{const option=room.currentEvent.options.find((o)=>o.id===room.votes[p.id]);const value=statFor(p,option?.stat);return {playerId:p.id,sinner:sinnerOf(p)?.name||p.name,actionLabel:option?.label||'',statLabel:option?.statLabel||'',statValue:value,bonus:option?.bonus||0};});
  const avg=contributions.reduce((s,x)=>s+x.statValue+x.bonus,0)/active.length,modifier=Math.round(avg/2),dc=11+Number(room.currentEvent.difficulty||0)+room.exploration.danger;const die=1+Math.floor(Math.random()*20),total=die+modifier;
  let degree='failure';if(die===20||total>=dc+5)degree='critical';else if(total>=dc)degree='success';else if(total>=dc-3)degree='mixed';else if(die===1||total<=dc-7)degree='critical-failure';
  let damage=0,cluesDelta=0,dangerDelta=0;if(degree==='critical'){cluesDelta=2;dangerDelta=-1;}else if(degree==='success'){cluesDelta=1;}else if(degree==='mixed'){cluesDelta=1;dangerDelta=1;damage=3+room.exploration.danger;}else if(degree==='failure'){dangerDelta=2;damage=7+room.exploration.danger*2;}else{dangerDelta=3;damage=11+room.exploration.danger*2;}
  const shield=Math.max(...active.map(dangerShield),0);dangerDelta=Math.max(-1,dangerDelta-shield);room.players.forEach((p)=>{p.hp=Math.max(0,p.hp-Math.round(damage*damageMultiplier(p)));});room.exploration.clues=Math.max(0,room.exploration.clues+cluesDelta);room.exploration.danger=Math.max(0,Math.min(6,room.exploration.danger+dangerDelta));
  const statusApplied=['failure','critical-failure'].includes(degree)?maybeApplyNegativeStatus(room,degree==='critical-failure'?2:1):null;room.eventResult={degree,die,modifier,total,dc,text:['critical','success','mixed'].includes(degree)?room.currentEvent.success:room.currentEvent.failure,damage,cluesDelta,dangerDelta,contributions,statusApplied};markCurrentNodeResolved(room);checkDefeat(room);persist();return room.eventResult;
}
function resolveCombatRound(room){
  const combat=room.combat;if(!combat)return null;const active=room.players.filter((p)=>p.connected&&p.hp>0);if(!active.length||active.some((p)=>!room.votes[p.id]))return null;
  let teamDamage=0,guards=0,analysis=0;const rolls=[];
  for(const p of active){const action=COMBAT_ACTIONS.find((a)=>a.id===room.votes[p.id])||COMBAT_ACTIONS[0],stat=statFor(p,action.stat),die=1+Math.floor(Math.random()*20),total=die+Math.round(stat/2);let dealt=0;if(action.id==='attack'&&total>=Math.max(7,combat.enemy.defense-combat.enemy.defensePenalty)){dealt=Math.max(4,Math.round(stat*1.45)+Math.floor(Math.random()*7));teamDamage+=dealt;}if(action.id==='guard')guards++;if(action.id==='analyze'&&total>=11){analysis++;combat.enemy.defensePenalty=Math.min(6,combat.enemy.defensePenalty+1);room.exploration.clues+=1;}rolls.push({playerId:p.id,sinner:sinnerOf(p)?.name||p.name,action:action.label,die,total,dealt});}
  combat.enemy.currentHp=Math.max(0,combat.enemy.currentHp-teamDamage);const resolution={serial:++combat.serial,round:combat.round,teamDamage,rolls,incoming:0,enemyName:combat.enemy.name,enemyHp:combat.enemy.currentHp};
  if(combat.enemy.currentHp<=0){combat.log.push({round:combat.round,text:`敵人受到 ${teamDamage} 傷害並被擊敗。`});room.eventResult={degree:combat.kind==='boss'?'boss-victory':'combat-victory',text:`擊敗 ${combat.enemy.name}。`,damage:0,rolls};markCurrentNodeResolved(room);room.votes={};combat.lastResolution=resolution;if(combat.kind==='elite')awardSupply(room,2);checkDefeat(room);persist();return room.eventResult;}
  const base=Math.max(2,Math.round(combat.enemy.attack*(combat.kind==='boss'?1:.78))),mitigation=Math.min(.72,guards*.22),incomingBase=Math.max(1,Math.round(base*(1-mitigation)*combat.enemyDamageMultiplier));combat.enemyDamageMultiplier=1;
  for(const p of active){let incoming=Math.round(incomingBase*damageMultiplier(p));if(p.temporaryShield>0){const absorbed=Math.min(p.temporaryShield,incoming);p.temporaryShield-=absorbed;incoming-=absorbed;}p.hp=Math.max(0,p.hp-incoming);resolution.incoming=Math.max(resolution.incoming,incoming);}
  tickStatuses(active,'round');const statusApplied=maybeApplyNegativeStatus(room,combat.kind==='boss'?2:combat.kind==='elite'?1:0);combat.log.push({round:combat.round,text:`隊伍造成 ${teamDamage} 傷害；${combat.enemy.name} 反擊。`});combat.lastResolution={...resolution,statusApplied};combat.round+=1;room.votes={};checkDefeat(room);persist();return combat.lastResolution;
}
function checkDefeat(room){if(room.exploration.danger>=6||room.players.every((p)=>p.hp<=0)){room.phase='defeat';return true;}return false;}
function advanceNode(room){if(['victory','defeat'].includes(room.phase))return;if(!currentNode(room)?.resolved)throw new Error('目前節點尚未完成。');if(room.exploration.position===9){if(beginNextArea(room)){revealNode(room,0);enterCurrentNode(room);return;}room.phase='victory';persist();return;}room.exploration.position+=1;room.run+=1;revealNode(room,room.exploration.position);tickStatuses(room.players,'node');enterCurrentNode(room);}

function useItem(room,player,index){
  index=Number(index);if(!Number.isInteger(index)||index<0||index>=player.inventory.length)throw new Error('找不到這個道具。');const item=player.inventory[index];if(!item)throw new Error('這個欄位沒有道具。');if(item.combatOnly&&!room.combat)throw new Error('這個道具只能在戰鬥中使用。');if(item.bossOnly&&room.combat?.kind!=='boss')throw new Error('這個道具只能在 Boss 戰使用。');
  let message='';if(item.kind==='heal'){const before=player.hp;player.hp=Math.min(player.maxHp,player.hp+Number(item.power||0));message=`恢復 ${player.hp-before} HP。`;}else if(item.kind==='cleanse'){const before=player.hp;player.hp=Math.min(player.maxHp,player.hp+Number(item.power||0));removeStatus(player,item.removeStatus);message=`恢復 ${player.hp-before} HP，並清除負面狀態。`;}else if(item.kind==='status'){addStatus(player,item.status);message=`獲得「${getStatus(item.status)?.name||item.status}」。`;}else if(item.kind==='enemy-debuff'){room.combat.enemyDamageMultiplier=Math.min(room.combat.enemyDamageMultiplier,.6);message='敵人的下一次反擊被削弱。';}else if(item.kind==='boss'){room.combat.enemyDamageMultiplier=Math.min(room.combat.enemyDamageMultiplier,.55);room.combat.enemy.defensePenalty=Math.min(6,room.combat.enemy.defensePenalty+2);message='Boss 的攻勢與防禦受到抑制。';}else throw new Error('這個道具目前沒有可用效果。');
  player.inventory.splice(index,1);room.nodeReward={type:'item-use',title:item.name,text:`${player.name} 使用「${item.name}」：${message}`,recipientId:player.id,reward:item,serial:Date.now()};persist();return room.nodeReward;
}

io.on('connection',(socket)=>{
  socket.on('room:create',({playerName,reconnectToken},ack=()=>{})=>{try{const {room,player}=createRoom(socket.id,playerName,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room);}catch(e){ack({ok:false,error:e.message});}});
  socket.on('room:join',({roomId,playerName,reconnectToken},ack=()=>{})=>{try{const {room,player}=joinRoom(roomId,socket.id,playerName,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room);}catch(e){ack({ok:false,error:e.message});}});
  socket.on('room:resume',({roomId,playerId,reconnectToken},ack=()=>{})=>{try{const {room,player}=resumeRoom(roomId,socket.id,playerId,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room);}catch(e){ack({ok:false,error:e.message});}});
  socket.on('room:restore',({snapshot,recoveryToken,playerId,reconnectToken},ack=()=>{})=>{try{const {room,player}=restoreRoom(snapshot,recoveryToken,socket.id,playerId,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(room);}catch(e){ack({ok:false,error:e.message});}});
  socket.on('room:map-toggle',({roomId,areaId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);toggleArea(room,player,areaId);emitRoom(room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});
  socket.on('player:sinner',({roomId,sinnerId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);setSinner(room,player,sinnerId);emitRoom(room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});
  socket.on('room:start',({roomId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),actor=getContext(room,socket);if(actor.id!==room.hostId)throw new Error('只有房主可以開始。');if(room.players.some((p)=>!p.connected))throw new Error('有玩家目前離線。');if(room.players.some((p)=>!p.sinnerId))throw new Error('每位玩家都要先選擇罪人。');resetForStart(room);revealNode(room,0);enterCurrentNode(room);emitRoom(room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});
  socket.on('event:vote',({roomId,optionId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);if(room.phase!=='exploration')throw new Error('目前不在遠征中。');const options=room.combat?COMBAT_ACTIONS:room.currentEvent?.options;if(!options?.some((o)=>o.id===optionId))throw new Error('無效行動。');room.votes[player.id]=optionId;persist();if(room.combat)resolveCombatRound(room);else resolveEvent(room);emitRoom(room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});
  socket.on('item:use',({roomId,index},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);const result=useItem(room,player,index);emitRoom(room);ack({ok:true,result});}catch(e){ack({ok:false,error:e.message});}});
  socket.on('event:next',({roomId},ack=()=>{})=>{try{const room=rooms.get(String(roomId||'').toUpperCase()),player=getContext(room,socket);if(player.id!==room.hostId)throw new Error('只有房主可以推進遠征。');advanceNode(room);emitRoom(room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});
  socket.on('disconnect',()=>{const result=markDisconnected(socket.id);if(!result?.room)return;emitRoom(result.room);const {id:roomId}=result.room,{id:playerId,disconnectedAt}=result.player;setTimeout(()=>{const removed=removeExpiredPlayer(roomId,playerId,disconnectedAt);if(removed?.room)emitRoom(removed.room);},RECONNECT_GRACE_MS+1000);});
});
server.listen(PORT,()=>console.log(`Multiplayer v0.8 expedition: http://localhost:${PORT}`));
