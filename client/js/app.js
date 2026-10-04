const socket=io();
const $=id=>document.getElementById(id);
const CHAPTER_LABELS=['初級','中級','高級'];
let state={room:null,selfId:null,reconnectToken:null,recoveryToken:null,recoverySnapshot:null,gameData:{areas:[],sinners:[],statusEffects:[],sinnerSkills:[]},resuming:false};
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function areaById(id){return state.gameData.areas?.find(x=>x.id===id)}
function sinnerById(id){return state.gameData.sinners?.find(x=>x.id===id)}
function statusById(id){return state.gameData.statusEffects?.find(x=>x.id===id)}
function equipmentMods(player){const out={combat:0,observe:0,mobility:0,stability:0};Object.values(player?.equipment||{}).forEach(item=>Object.keys(out).forEach(k=>out[k]+=Number(item?.mods?.[k]||0)));return out;}
function statusMods(player){const out={combat:0,observe:0,mobility:0,stability:0};(player?.statuses||[]).forEach(active=>{const def=statusById(active.id);Object.keys(out).forEach(k=>out[k]+=Number(def?.mods?.[k]||0));});return out;}
function action(name,payload){socket.emit(name,payload,res=>{if(!res?.ok)alert(res?.error||'操作失敗。')});}
function sessionData(){return state.room&&state.selfId&&state.reconnectToken?{roomId:state.room.id,playerId:state.selfId,reconnectToken:state.reconnectToken,recoveryToken:state.recoveryToken,recoverySnapshot:state.recoverySnapshot}:null;}
function writeSession(){const data=sessionData();if(data)window.KBMSession?.write(data);}
function healthClass(p){const r=Number(p?.hp||0)/Math.max(1,Number(p?.maxHp||100));return r<=.3?'health-critical':r<=.5?'health-warning':'health-safe';}
function renderShell(){
  const room=state.room;if(!room)return;const player=room.players.find(p=>p.id===state.selfId);if(!player)return;const isHost=state.selfId===room.hostId,area=areaById(room.areaId);
  $('roomCode').textContent=room.id;$('hostTools').classList.toggle('hidden',!isHost);$('forgetSession').classList.toggle('hidden',!isHost);
  $('areaSummary').innerHTML=room.phase==='lobby'?`<strong>已選 ${room.selectedAreas?.length||0} / 3 地區</strong><span>選取順序決定初級 → 中級 → 高級</span>`:area?`<strong>${escapeHtml(area.name)}</strong><span>${escapeHtml(room.exploration?.difficultyLabel||CHAPTER_LABELS[room.areaIndex]||'')}</span>`:'';
  $('playerList').innerHTML=room.players.map(p=>{const s=sinnerById(p.sinnerId),pct=Math.max(0,Math.round(Number(p.hp||0)/Math.max(1,Number(p.maxHp||100))*100)),health=healthClass(p);return `<div data-player-id="${escapeHtml(p.id)}" class="player ${health}${p.id===state.selfId?' me':''}" style="--sinner-color:${escapeHtml(s?.color||'#9ba3a7')};--sinner-soft:${escapeHtml(s?.colorSoft||'#f3f3f3')}"><div class="player-headline"><div><b>${escapeHtml(p.name)}${p.id===room.hostId?' · 房主':''}</b><small>${escapeHtml(s?.name||'未選角色')}${p.connected?'':' · 離線'}${health==='health-critical'?' · 瀕危':health==='health-warning'?' · 警戒':''}</small></div><span>${p.hp}/${p.maxHp}</span></div><div class="hp-track"><i style="width:${pct}%"></i></div></div>`}).join('');
  const combatActive=!!room.combat&&!room.combat.ended&&room.phase==='exploration'&&!room.shop;document.body.classList.toggle('combat-active',combatActive||!!window.KBMCombatUI?.isResolving(room));
  const lobby=room.phase==='lobby';$('lobbySetup').classList.toggle('hidden',!lobby);$('explorationPanel').classList.toggle('hidden',lobby);$('startGame').classList.toggle('hidden',!isHost||!lobby);$('startGame').disabled=(room.selectedAreas?.length||0)!==3;$('startGame').textContent=(room.selectedAreas?.length||0)===3?'開始遠征':`選滿 3 個地區 (${room.selectedAreas?.length||0}/3)`;
  if(!lobby){$('eventPanel').classList.add('hidden');$('combatPanel').classList.toggle('hidden',!room.combat);$('endingPanel').classList.toggle('hidden',!['victory','defeat'].includes(room.phase));}
  if(lobby)window.KBMLobbyUI?.render(room,player,isHost);
}
function handleJoinAck(res,resumed=false){if(!res?.ok){$('entryError').textContent=res?.error||'操作失敗。';return;}state.selfId=res.selfId;state.reconnectToken=res.reconnectToken;state.recoveryToken=res.recoveryToken||state.recoveryToken;state.recoverySnapshot=res.recoverySnapshot||state.recoverySnapshot;state.room=res.room;state.gameData=res.gameData||state.gameData;writeSession();$('entry').classList.add('hidden');$('game').classList.remove('hidden');$('reconnectBanner').classList.add('hidden');$('resumeStatus').textContent=resumed?'已自動回到原房間。':'';const u=new URL(location.href);u.searchParams.set('room',res.room.id);history.replaceState(null,'',u);renderShell();}
function resumeSession(saved){state.resuming=true;$('resumeStatus').textContent='正在重新加入原房間…';socket.emit('room:resume',saved,res=>{state.resuming=false;if(res?.ok)return handleJoinAck(res,true);if(saved?.recoveryToken&&saved?.recoverySnapshot&&saved.playerId===saved.recoverySnapshot.hostId){socket.emit('room:restore',{snapshot:saved.recoverySnapshot,recoveryToken:saved.recoveryToken,playerId:saved.playerId,reconnectToken:saved.reconnectToken},r=>r?.ok?handleJoinAck(r,true):(window.KBMSession?.clear(),location.reload()));}else{window.KBMSession?.clear();$('resumeStatus').textContent='原房間已失效。';}});}
function joinFromEntry(){const name=$('playerName').value;window.KBMSession?.setPlayerName(name);socket.emit('room:join',{roomId:$('roomId').value,playerName:name,reconnectToken:window.KBMSession?.persistentToken()},handleJoinAck);}
function inviteUrl(){const u=new URL(location.origin+location.pathname);u.searchParams.set('room',state.room.id);return u.toString();}
async function copyInviteLink(){try{await navigator.clipboard.writeText(inviteUrl());$('copyInviteStatus').textContent='已複製';setTimeout(()=>$('copyInviteStatus').textContent='',1500);}catch(_){}}

const savedName=window.KBMSession?.playerName();if(savedName)$('playerName').value=savedName;
const rawInvite=new URLSearchParams(location.search).get('room'),normalizedInviteRoom=rawInvite?rawInvite.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4):'';
if(normalizedInviteRoom){$('roomId').value=normalizedInviteRoom;$('inviteRoomCode').textContent=normalizedInviteRoom;$('inviteNotice').classList.remove('hidden');}
$('deployMode').textContent=['localhost','127.0.0.1'].includes(location.hostname)?'LOCAL':'ONLINE';
$('createRoom').onclick=()=>{const name=$('playerName').value;window.KBMSession?.setPlayerName(name);socket.emit('room:create',{playerName:name,reconnectToken:window.KBMSession?.persistentToken()},handleJoinAck);};
$('joinRoom').onclick=joinFromEntry;$('roomId').oninput=e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);$('roomId').onkeydown=e=>{if(e.key==='Enter')joinFromEntry();};$('copyInvite').onclick=copyInviteLink;$('startGame').onclick=()=>action('room:start',{roomId:state.room?.id});$('nextEvent').onclick=()=>action('event:next',{roomId:state.room?.id});$('nextCombatNode').onclick=()=>action('event:next',{roomId:state.room?.id});$('forgetSession').onclick=()=>{window.KBMSession?.clear();location.href=location.pathname;};
socket.on('connect',()=>{$('connection').textContent='● 已連線';const saved=window.KBMSession?.read();if(saved?.roomId&&saved?.playerId&&saved?.reconnectToken&&(!normalizedInviteRoom||normalizedInviteRoom===saved.roomId)&&!state.resuming)resumeSession(saved);});
socket.on('disconnect',()=>{$('connection').textContent='○ 已斷線 · 自動重連中';$('reconnectBanner').classList.remove('hidden')});
socket.on('room:update',room=>{state.room=room;if(room.players.some(p=>p.id===state.selfId))writeSession();renderShell();});
socket.on('room:recovery',payload=>{if(!payload)return;state.recoveryToken=payload.recoveryToken||state.recoveryToken;state.recoverySnapshot=payload.recoverySnapshot||state.recoverySnapshot;writeSession();});
window.KBMApp={renderShell,handleJoinAck};
