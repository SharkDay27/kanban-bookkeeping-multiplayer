const socket=io();
const $=(id)=>document.getElementById(id);
const SESSION_KEY='kanban-bookkeeping-multiplayer-v0.7-session';
const PLAYER_KEY='kanban-bookkeeping-multiplayer-player-name';
const NODE_BADGES={event:'事',combat:'戰',supply:'補',elite:'精',rest:'休',boss:'王'};
let state={room:null,selfId:null,reconnectToken:null,recoveryToken:null,recoverySnapshot:null,gameData:{areas:[],sinners:[]},resuming:false};

function readSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function writeSession(){if(!state.room||!state.selfId||!state.reconnectToken)return;localStorage.setItem(SESSION_KEY,JSON.stringify({roomId:state.room.id,playerId:state.selfId,reconnectToken:state.reconnectToken,recoveryToken:state.recoveryToken,recoverySnapshot:state.recoverySnapshot}))}
function clearSession(){localStorage.removeItem(SESSION_KEY)}
function persistentToken(){return readSession()?.reconnectToken||crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function areaById(id){return state.gameData.areas.find(x=>x.id===id)}
function sinnerById(id){return state.gameData.sinners.find(x=>x.id===id)}
function itemName(item){return item?.name||'空'}
function equipmentMods(me){const out={combat:0,observe:0,mobility:0,stability:0};Object.values(me.equipment||{}).forEach(item=>{Object.keys(out).forEach(k=>out[k]+=Number(item?.mods?.[k]||0))});return out}
function action(name,payload){socket.emit(name,payload,res=>{if(!res?.ok)alert(res?.error||'操作失敗。')})}

const savedName=localStorage.getItem(PLAYER_KEY);if(savedName)$('playerName').value=savedName;
const inviteRoom=new URLSearchParams(location.search).get('room');
const normalizedInviteRoom=inviteRoom?inviteRoom.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4):'';
if(normalizedInviteRoom){$('roomId').value=normalizedInviteRoom;$('inviteRoomCode').textContent=normalizedInviteRoom;$('inviteNotice').classList.remove('hidden')}
$('deployMode').textContent=['localhost','127.0.0.1'].includes(location.hostname)?'LOCAL':'ONLINE';

socket.on('connect',()=>{$('connection').textContent='● 已連線';const s=readSession();if(s?.roomId&&s?.playerId&&s?.reconnectToken&&(!normalizedInviteRoom||normalizedInviteRoom===s.roomId)&&!state.resuming)resumeSession(s)});
socket.on('disconnect',()=>{$('connection').textContent='○ 已斷線 · 自動重連中';$('reconnectBanner').classList.remove('hidden')});
socket.on('room:update',room=>{state.room=room;if(room.players.some(p=>p.id===state.selfId))writeSession();render()});
socket.on('room:recovery',p=>{if(!p)return;state.recoveryToken=p.recoveryToken||state.recoveryToken;state.recoverySnapshot=p.recoverySnapshot||state.recoverySnapshot;writeSession()});

$('createRoom').onclick=()=>{const playerName=$('playerName').value;localStorage.setItem(PLAYER_KEY,playerName);socket.emit('room:create',{playerName,reconnectToken:persistentToken()},handleJoinAck)};
$('joinRoom').onclick=joinFromEntry;
$('roomId').oninput=e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);
$('copyInvite').onclick=copyInviteLink;
$('startGame').onclick=()=>action('room:start',{roomId:state.room?.id});
$('nextEvent').onclick=()=>action('event:next',{roomId:state.room?.id});
$('nextCombatNode').onclick=()=>action('event:next',{roomId:state.room?.id});
$('forgetSession').onclick=()=>{clearSession();location.href=location.pathname};

function joinFromEntry(){const playerName=$('playerName').value;localStorage.setItem(PLAYER_KEY,playerName);socket.emit('room:join',{roomId:$('roomId').value,playerName,reconnectToken:persistentToken()},handleJoinAck)}
function resumeSession(s){state.resuming=true;$('resumeStatus').textContent='正在重新加入原房間…';socket.emit('room:resume',s,res=>{state.resuming=false;if(res?.ok)return handleJoinAck(res,true);if(s?.recoveryToken&&s?.recoverySnapshot&&s.playerId===s.recoverySnapshot.hostId){socket.emit('room:restore',{snapshot:s.recoverySnapshot,recoveryToken:s.recoveryToken,playerId:s.playerId,reconnectToken:s.reconnectToken},r=>r?.ok?handleJoinAck(r,true):(clearSession(),location.reload()));}else{clearSession();$('resumeStatus').textContent='原房間已失效。';}})}
function handleJoinAck(res,resumed=false){if(!res?.ok){$('entryError').textContent=res?.error||'操作失敗。';return}state.selfId=res.selfId;state.reconnectToken=res.reconnectToken;state.recoveryToken=res.recoveryToken||state.recoveryToken;state.recoverySnapshot=res.recoverySnapshot||state.recoverySnapshot;state.room=res.room;state.gameData=res.gameData||state.gameData;writeSession();$('entry').classList.add('hidden');$('game').classList.remove('hidden');$('reconnectBanner').classList.add('hidden');$('resumeStatus').textContent=resumed?'已自動回到原房間。':'';const u=new URL(location.href);u.searchParams.set('room',res.room.id);history.replaceState(null,'',u);render()}
function inviteUrl(){const u=new URL(location.origin+location.pathname);u.searchParams.set('room',state.room.id);return u.toString()}
async function copyInviteLink(){try{await navigator.clipboard.writeText(inviteUrl());$('copyInviteStatus').textContent='已複製';setTimeout(()=>$('copyInviteStatus').textContent='',1500)}catch(_){}}

function render(){
  const room=state.room;if(!room)return;const me=room.players.find(p=>p.id===state.selfId);if(!me)return;
  const isHost=state.selfId===room.hostId,area=areaById(room.areaId);$('roomCode').textContent=room.id;
  $('hostTools').classList.toggle('hidden',!isHost);
  $('areaSummary').innerHTML=area?`<strong>${escapeHtml(area.name)}</strong><span>RISK / ${escapeHtml(area.risk)}</span>`:'';
  $('playerList').innerHTML=room.players.map(p=>{const s=sinnerById(p.sinnerId),pct=Math.round(p.hp/p.maxHp*100);return `<div class="player${p.id===state.selfId?' me':''}"><div class="player-headline"><div><b>${escapeHtml(p.name)}${p.id===room.hostId?' · 房主':''}</b><small>${escapeHtml(s?.name||'未選角色')}${p.connected?'':' · 離線'}</small></div><span>${p.hp}/${p.maxHp}</span></div><div class="hp-track"><i style="width:${pct}%"></i></div></div>`}).join('');
  $('lobbySetup').classList.toggle('hidden',room.phase!=='lobby');$('explorationPanel').classList.toggle('hidden',room.phase==='lobby');$('startGame').classList.toggle('hidden',!isHost||room.phase!=='lobby');
  if(room.phase==='lobby')renderLobby(room,me,isHost);else renderExpedition(room,isHost);
  renderSelf(me);renderTeam(room);
}

function renderLobby(room,me,isHost){
  const allowed=new Set(room.mapOptions||[]);
  $('areaList').innerHTML=state.gameData.areas.filter(a=>allowed.has(a.id)).map(a=>`<button class="area-card${room.areaId===a.id?' active':''}" data-area="${a.id}"${isHost?'':' disabled'}><div><b>${escapeHtml(a.name)}</b><span>${escapeHtml(a.risk)}</span></div><p>${escapeHtml(a.desc)}</p></button>`).join('');
  document.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>action('room:area',{roomId:room.id,areaId:b.dataset.area}));
  const occupied=new Set(room.players.filter(p=>p.id!==me.id).map(p=>p.sinnerId));
  $('sinnerList').innerHTML=state.gameData.sinners.map(s=>`<button class="sinner-card${me.sinnerId===s.id?' active':''}" data-sinner="${s.id}"${occupied.has(s.id)?' disabled':''}><b>${escapeHtml(s.name)}</b><span>${escapeHtml(s.specialty)}</span><small>戰 ${s.stats.combat} · 觀 ${s.stats.observe} · 機 ${s.stats.mobility} · 穩 ${s.stats.stability}</small></button>`).join('');
  document.querySelectorAll('[data-sinner]').forEach(b=>b.onclick=()=>action('player:sinner',{roomId:room.id,sinnerId:b.dataset.sinner}));
}

function renderRoute(room){const ex=room.exploration||{},route=ex.route||[];$('routePanel').innerHTML=`<div class="route-caption"><span>遠征路線</span><b>${Number(ex.position||0)+1} / 10</b></div><div class="route-scroll"><div class="route-track">${route.map((n,i)=>`<div class="route-node ${n.type}${n.resolved?' done':''}${i===ex.position?' current':''}"><span class="node-badge">${NODE_BADGES[n.type]||'?'}</span><small>${escapeHtml(n.label)}</small></div>${i<route.length-1?'<i class="route-link"></i>':''}`).join('')}</div></div>`;requestAnimationFrame(()=>document.querySelector('.route-node.current')?.scrollIntoView({block:'nearest',inline:'center'}))}
function renderExpedition(room,isHost){
  $('runNumber').textContent=`${(room.exploration?.position||0)+1}/10`;renderRoute(room);
  const ex=room.exploration||{danger:0,dangerMax:6,clues:0};$('explorationMeters').innerHTML=`<div class="meter danger"><div><b>危險度</b><span>${ex.danger}/6</span></div><div class="meter-track"><i style="width:${ex.danger/6*100}%"></i></div></div><div class="clue-card"><span>線索</span><strong>${ex.clues}</strong></div>`;
  const ended=['victory','defeat'].includes(room.phase);$('endingPanel').classList.toggle('hidden',!ended);$('eventPanel').classList.add('hidden');$('combatPanel').classList.add('hidden');
  if(ended){$('endingPanel').innerHTML=`<strong>${room.phase==='victory'?'遠征完成':'遠征失敗'}</strong><p>${room.phase==='victory'?'Boss 已被擊敗，隊伍完成本區域探索。':'隊伍失去繼續遠征的能力。'}</p>`;return}
  if(room.combat)return renderCombat(room,isHost);
  renderScene(room,isHost);
}

function renderScene(room,isHost){
  $('eventPanel').classList.remove('hidden');const e=room.currentEvent;$('eventArea').textContent=areaById(room.areaId)?.name||'';$('eventName').textContent=e?.name||room.nodeReward?.title||'節點結算';$('eventDescription').textContent=e?.description||room.nodeReward?.text||room.eventResult?.text||'';
  const resolved=!!room.eventResult;$('eventOptions').innerHTML=e&&!resolved?e.options.map(o=>`<button class="event-option${room.votes?.[state.selfId]===o.id?' selected':''}" data-option="${o.id}"><div class="option-head"><span>${escapeHtml(o.label)}</span><em>${escapeHtml(o.statLabel)}檢定</em></div><p>${escapeHtml(o.desc)}</p></button>`).join(''):'';
  document.querySelectorAll('#eventOptions [data-option]').forEach(b=>b.onclick=()=>action('event:vote',{roomId:room.id,optionId:b.dataset.option}));
  $('eventResult').classList.toggle('hidden',!resolved);$('eventResult').innerHTML=resolved?`<strong>${escapeHtml(room.eventResult.degree==='supply'?'取得補給':room.eventResult.degree==='rest'?'休整完成':'判定結果')}</strong><p>${escapeHtml(room.eventResult.text||'節點完成。')}</p>${room.eventResult.damage?`<small>全隊 HP -${room.eventResult.damage}</small>`:''}`:'';
  $('nextEvent').classList.toggle('hidden',!isHost||!resolved);
}

function renderCombat(room,isHost){
  $('combatPanel').classList.remove('hidden');const c=room.combat,e=c.enemy,pct=Math.max(0,e.currentHp/e.maxHp*100);$('enemyKind').textContent=c.kind==='boss'?'BOSS':c.kind==='elite'?'ELITE / 精英':'ENCOUNTER / 小怪';$('enemyName').textContent=e.name;$('enemyHpText').textContent=`HP ${e.currentHp} / ${e.maxHp}`;$('enemyHpBar').style.width=`${pct}%`;$('enemyTrait').textContent=e.trait||'';$('combatRound').textContent=`ROUND ${c.round}`;$('enemyAvatar').textContent=c.kind==='boss'?'王':c.kind==='elite'?'精':'敵';
  const won=room.eventResult?.degree==='combat-victory'||room.eventResult?.degree==='boss-victory';$('combatOptions').innerHTML=won?'':c.options.map(o=>`<button class="event-option${room.votes?.[state.selfId]===o.id?' selected':''}" data-combat="${o.id}"><div class="option-head"><span>${escapeHtml(o.label)}</span><em>${escapeHtml(o.statLabel)}</em></div><p>${escapeHtml(o.desc)}</p></button>`).join('');document.querySelectorAll('[data-combat]').forEach(b=>b.onclick=()=>action('event:vote',{roomId:room.id,optionId:b.dataset.combat}));
  $('combatLog').innerHTML=(c.log||[]).slice(-3).map(l=>`<div>${escapeHtml(l.text)}</div>`).join('');$('combatResult').classList.toggle('hidden',!won);$('combatResult').innerHTML=won?`<strong>戰鬥勝利</strong><p>${escapeHtml(room.eventResult.text)}</p>`:'';$('nextCombatNode').classList.toggle('hidden',!isHost||!won||c.kind==='boss');
}

function renderSelf(me){const s=sinnerById(me.sinnerId);if(!s){$('mySinner').innerHTML='<p class="muted">尚未選擇罪人。</p>';return}const mods=equipmentMods(me),inv=[...(me.inventory||[])];while(inv.length<4)inv.push(null);const val=k=>s.stats[k]+mods[k];$('mySinner').innerHTML=`<div class="character-header"><div><strong>${escapeHtml(s.name)}</strong><span>${escapeHtml(s.specialty)}</span></div></div><div class="character-hp"><span>HP</span><b>${me.hp}/${me.maxHp}</b><div class="hp-track"><i style="width:${me.hp/me.maxHp*100}%"></i></div></div><div class="stat-grid"><div><span>戰鬥</span><b>${val('combat')}</b></div><div><span>觀察</span><b>${val('observe')}</b></div><div><span>機動</span><b>${val('mobility')}</b></div><div><span>穩定</span><b>${val('stability')}</b></div></div><div class="mini-heading">裝備</div><div class="equipment-grid"><div><span>武器</span><b>${escapeHtml(itemName(me.equipment?.weapon))}</b></div><div><span>防具</span><b>${escapeHtml(itemName(me.equipment?.armor))}</b></div><div><span>飾品</span><b>${escapeHtml(itemName(me.equipment?.accessory))}</b></div></div><div class="mini-heading">消耗品 <span>${inv.filter(Boolean).length}/4</span></div><div class="inventory-grid">${inv.map((x,i)=>`<div class="inventory-slot${x?' filled':''}"><span>${i+1}</span><b>${escapeHtml(itemName(x))}</b></div>`).join('')}</div>`}
function renderTeam(room){$('teamInfo').innerHTML=room.players.map(p=>{const s=sinnerById(p.sinnerId);return `<div class="team-row"><div><b>${escapeHtml(s?.name||p.name)}</b><small>${p.connected?'在線':'離線'}</small></div><span>${p.hp}/${p.maxHp}</span></div>`}).join('')}
