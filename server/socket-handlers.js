const CardRewards=require('./cards/card-rewards');
const {AREAS,SINNERS,STATUS_EFFECTS,SINNER_SKILLS,EXPEDITION_RELICS,BUILD_TAGS,upgradeOptionsFor}=require('../shared/game-data');
const {
  createRoom,joinRoom,resumeRoom,restoreRoom,markDisconnected,removeExpiredPlayer,
  toggleArea,setSinner,publicRoom,rooms,RECONNECT_GRACE_MS,signRecovery,recoverySnapshot,
  persist,resetForStart,restartRoom
}=require('./room/room-manager');
const {selectCombatAction,selectCombatCards,useAbilityCard,confirmCombatAction,cancelCombatConfirm,useConsumable}=require('./combat/combat-manager');
const {enterCurrentNode,resolveEvent,advanceChapterAfterBoss}=require('./expedition/expedition-manager');
const {prepareInitialRoute,primeFogAfterResolution}=require('./expedition/route-generator');
const {resolveRouteVote}=require('./expedition/route-voting');
const {buyShopItem,shopReady}=require('./shop/shop-manager');
const {learnSkill}=require('./skills/skill-manager');
const {upgradeSkill}=require('./skills/skill-upgrades');
const {chooseRelic,pendingRelicChoices}=require('./relics/relic-manager');
const {sell}=require('./shop/shop-sales');
const {equipFromInventory,unequip}=require('./equipment/equipment-manager');

const Cards=require('../shared/cards');
function gameDataPayload(){return {cards:Cards.COLLECTIBLE,cardSins:Cards.SINS,lcbDecks:Cards.LCB,areas:AREAS,sinners:SINNERS,statusEffects:STATUS_EFFECTS,sinnerSkills:SINNER_SKILLS.map(s=>({...s,cardRequirement:Cards.requirement(s,SINNER_SKILLS.filter(x=>x.sinnerId===s.sinnerId).findIndex(x=>x.id===s.id))})),relics:EXPEDITION_RELICS,buildTags:BUILD_TAGS,skillUpgradeOptions:Object.fromEntries(SINNER_SKILLS.map(s=>[s.id,upgradeOptionsFor(s)]))};}
function getContext(room,socket){const player=room?.players.find(p=>p.socketId===socket.id&&p.connected);if(!room||!player)throw new Error('你不在這個房間。');return player;}
function sessionPayload(room,player){return {ok:true,room:publicRoom(room),selfId:player.id,reconnectToken:player.reconnectToken,recoveryToken:player.id===room.hostId?signRecovery(room):null,recoverySnapshot:player.id===room.hostId?recoverySnapshot(room):null,gameData:gameDataPayload()};}
const automaticTimers=new Map();
function emitRoom(io,room){
 require('./expedition/rest-event').complete(room);
 if(room.phase==='exploration'&&room.combat&&!room.combat.ended){const active=room.players.filter(p=>p.connected&&p.hp>0);if(active.length&&active.every(p=>p.serverControl>0)&&!automaticTimers.has(room.id)){automaticTimers.set(room.id,setTimeout(()=>{automaticTimers.delete(room.id);if(room.phase==='exploration'&&room.combat&&!room.combat.ended&&room.players.filter(p=>p.connected&&p.hp>0).every(p=>p.serverControl>0)){require('./combat/combat-manager').resolveCombatRound(room);emitRoom(io,room);}},3000));}}
io.to(room.id).emit('room:update',publicRoom(room));const host=room.players.find(p=>p.id===room.hostId&&p.connected&&p.socketId);if(host)io.to(host.socketId).emit('room:recovery',{recoveryToken:signRecovery(room),recoverySnapshot:recoverySnapshot(room)});}
function withRoom(roomId,socket){const room=rooms.get(String(roomId||'').toUpperCase());const player=getContext(room,socket);return {room,player};}

function registerSocketHandlers(io){
  io.on('connection',(socket)=>{
    socket.on('room:create',({playerName,reconnectToken},ack=()=>{})=>{try{const {room,player}=createRoom(socket.id,playerName,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(io,room);}catch(e){ack({ok:false,error:e.message});}});
    socket.on('room:join',({roomId,playerName,reconnectToken},ack=()=>{})=>{try{const {room,player}=joinRoom(roomId,socket.id,playerName,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(io,room);}catch(e){ack({ok:false,error:e.message});}});
    socket.on('room:resume',({roomId,playerId,reconnectToken},ack=()=>{})=>{try{const {room,player}=resumeRoom(roomId,socket.id,playerId,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(io,room);}catch(e){ack({ok:false,error:e.message});}});
    socket.on('room:restore',({snapshot,recoveryToken,playerId,reconnectToken},ack=()=>{})=>{try{const {room,player}=restoreRoom(snapshot,recoveryToken,socket.id,playerId,reconnectToken);socket.join(room.id);ack(sessionPayload(room,player));emitRoom(io,room);}catch(e){ack({ok:false,error:e.message});}});

    const toggleMap=({roomId,areaId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);toggleArea(room,player,areaId);emitRoom(io,room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}};
    socket.on('room:map-toggle',toggleMap);socket.on('room:area-toggle',toggleMap);
    socket.on('player:sinner',({roomId,sinnerId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);setSinner(room,player,sinnerId);emitRoom(io,room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('room:start',({roomId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);if(player.id!==room.hostId)throw new Error('只有房主可以開始。');if(room.players.some(p=>!p.connected))throw new Error('有玩家目前離線。');if(room.players.some(p=>!p.sinnerId))throw new Error('每位玩家都要先選擇罪人。');resetForStart(room);prepareInitialRoute(room);emitRoom(io,room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('room:restart',({roomId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);restartRoom(room,player);emitRoom(io,room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});

    socket.on('route:vote',({roomId,choiceId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);if(room.phase!=='exploration')throw new Error('目前不在遠征中。');if(CardRewards.pending(room))throw new Error('請先完成本次卡牌三選一。');if(pendingRelicChoices(room))throw new Error('請先完成本次遺物三選一。');if(room.combat&&!room.eventResult)throw new Error('戰鬥尚未結束。');if(room.currentEvent&&!room.eventResult)throw new Error('事件尚未結束。');if(room.shop&&!room.eventResult)throw new Error('商店尚未完成。');const result=resolveRouteVote(room,player,choiceId);if(result.resolved)enterCurrentNode(room);emitRoom(io,room);ack({ok:true,resolved:result.resolved,tied:result.tied});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('event:vote',({roomId,optionId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);if(room.phase!=='exploration')throw new Error('目前不在遠征中。');if(room.combat)throw new Error('戰鬥行動請使用確認制。');if(room.currentEvent?.sceneType==='rest'){require('./expedition/rest-event').choose(room,player,optionId);emitRoom(io,room);ack({ok:true});return;}if(room.eventResult||player.hp<=0)throw new Error('目前不能選擇事件行動。');const options=room.currentEvent?.options;if(!options?.some(o=>o.id===optionId))throw new Error('無效行動。');room.votes[player.id]=optionId;persist();resolveEvent(room);emitRoom(io,room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});

    socket.on('combat:select',({roomId,actionId,targetId,partId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const selection=selectCombatAction(room,player,{actionId,targetId,partId});emitRoom(io,room);ack({ok:true,selection});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('combat:cards',({roomId,...data},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const selection=selectCombatCards(room,player,data);emitRoom(io,room);ack({ok:true,selection});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('combat:ability',({roomId,...data},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const result=useAbilityCard(room,player,data);emitRoom(io,room);ack({ok:true,...result});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('combat:confirm',({roomId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const result=confirmCombatAction(room,player);emitRoom(io,room);ack({ok:true,resolved:!!result});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('combat:cancel-confirm',({roomId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);cancelCombatConfirm(room,player);emitRoom(io,room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});

    socket.on('skill:learn',({roomId,skillId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const skill=learnSkill(room,player,skillId);emitRoom(io,room);ack({ok:true,skill});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('skill:upgrade',({roomId,skillId,upgradeId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const upgrade=upgradeSkill(room,player,skillId,upgradeId);emitRoom(io,room);ack({ok:true,upgrade});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('card:choose',({roomId,cardId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const card=CardRewards.choose(room,player,cardId);emitRoom(io,room);ack({ok:true,card});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('relic:choose',({roomId,relicId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const relic=chooseRelic(room,player,relicId);emitRoom(io,room);ack({ok:true,relic});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('item:use',({roomId,slot},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);if(room.phase!=='exploration')throw new Error('目前不能使用道具。');const text=useConsumable(room,player,Number(slot));emitRoom(io,room);ack({ok:true,text});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('equipment:equip',({roomId,index},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const result=equipFromInventory(room,player,Number(index));emitRoom(io,room);ack({ok:true,...result});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('equipment:unequip',({roomId,slot},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const item=unequip(room,player,String(slot||''));emitRoom(io,room);ack({ok:true,item});}catch(e){ack({ok:false,error:e.message});}});

    socket.on('shop:sell',({roomId,...selection},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const result=sell(room,player,selection);emitRoom(io,room);ack({ok:true,...result});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('shop:buy',({roomId,offerId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const result=buyShopItem(room,player,offerId);emitRoom(io,room);ack({ok:true,...result});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('shop:ready',({roomId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);const done=shopReady(room,player);if(done)primeFogAfterResolution(room);emitRoom(io,room);ack({ok:true,done});}catch(e){ack({ok:false,error:e.message});}});
    socket.on('event:next',({roomId},ack=()=>{})=>{try{const {room,player}=withRoom(roomId,socket);if(player.id!==room.hostId)throw new Error('只有房主可以推進章節。');if(CardRewards.pending(room))throw new Error('請先完成本次卡牌三選一。');if(pendingRelicChoices(room))throw new Error('仍有玩家尚未選擇 Boss 遺物。');if(!room.eventResult?.nextAreaAvailable)throw new Error('現在請由隊伍投票選擇下一節點。');advanceChapterAfterBoss(room);emitRoom(io,room);ack({ok:true});}catch(e){ack({ok:false,error:e.message});}});

    socket.on('disconnect',()=>{const result=markDisconnected(socket.id);if(!result?.room)return;emitRoom(io,result.room);const roomId=result.room.id,playerId=result.player.id,disconnectedAt=result.player.disconnectedAt;setTimeout(()=>{const removed=removeExpiredPlayer(roomId,playerId,disconnectedAt);if(removed?.room)emitRoom(io,removed.room);},RECONNECT_GRACE_MS+1000);});
  });
}

module.exports={registerSocketHandlers,gameDataPayload,emitRoom,withRoom};
