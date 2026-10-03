const socket = io();
const $ = (id) => document.getElementById(id);
const SESSION_KEY = 'kanban-bookkeeping-multiplayer-v0.5-session';
const PLAYER_KEY = 'kanban-bookkeeping-multiplayer-player-name';
let state = { room:null, selfId:null, reconnectToken:null, recoveryToken:null, recoverySnapshot:null, gameData:{ areas:[], sinners:[] }, resuming:false };
let lastResultKey = '';

function readSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function writeSession(){if(!state.room||!state.selfId||!state.reconnectToken)return;localStorage.setItem(SESSION_KEY,JSON.stringify({roomId:state.room.id,playerId:state.selfId,reconnectToken:state.reconnectToken,recoveryToken:state.recoveryToken,recoverySnapshot:state.recoverySnapshot}))}
function clearSession(){localStorage.removeItem(SESSION_KEY)}
function persistentToken(){const old=readSession()?.reconnectToken;if(old)return old;if(crypto?.randomUUID)return crypto.randomUUID();return `${Date.now()}-${Math.random().toString(36).slice(2)}`}

const savedName=localStorage.getItem(PLAYER_KEY);if(savedName)$('playerName').value=savedName;
const inviteRoom=new URLSearchParams(location.search).get('room');
const normalizedInviteRoom=inviteRoom?inviteRoom.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4):'';
if(normalizedInviteRoom){$('roomId').value=normalizedInviteRoom;$('inviteRoomCode').textContent=normalizedInviteRoom;$('inviteNotice').classList.remove('hidden');requestAnimationFrame(()=>$('playerName').select())}
$('deployMode').textContent=location.hostname==='localhost'||location.hostname==='127.0.0.1'?'LOCAL':'ONLINE';

socket.on('connect',()=>{$('connection').textContent='● 已連線';const session=readSession();const inviteMatchesSession=!normalizedInviteRoom||normalizedInviteRoom===session?.roomId;if(session?.roomId&&session?.playerId&&session?.reconnectToken&&inviteMatchesSession&&!state.resuming)resumeSession(session)});
socket.on('disconnect',()=>{$('connection').textContent='○ 已斷線 · 自動重連中';$('reconnectBanner').classList.remove('hidden')});
socket.on('room:update',(room)=>{state.room=room;if(room.players.some((p)=>p.id===state.selfId))writeSession();render()});
socket.on('room:recovery',(payload)=>{if(!payload)return;state.recoveryToken=payload.recoveryToken||state.recoveryToken;state.recoverySnapshot=payload.recoverySnapshot||state.recoverySnapshot;writeSession()});

$('createRoom').addEventListener('click',()=>{ $('entryError').textContent='';const playerName=$('playerName').value;localStorage.setItem(PLAYER_KEY,playerName);socket.emit('room:create',{playerName,reconnectToken:persistentToken()},handleJoinAck)});
$('joinRoom').addEventListener('click',joinFromEntry);
$('roomId').addEventListener('input',(ev)=>{ev.target.value=ev.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4)});
$('roomId').addEventListener('keydown',(ev)=>{if(ev.key==='Enter')joinFromEntry()});
$('playerName').addEventListener('keydown',(ev)=>{if(ev.key==='Enter'&&$('roomId').value.trim())joinFromEntry()});
$('copyInvite').addEventListener('click',copyInviteLink);
$('startGame').addEventListener('click',()=>action('room:start',{roomId:state.room?.id}));
$('nextEvent').addEventListener('click',()=>action('event:next',{roomId:state.room?.id}));
$('forgetSession').addEventListener('click',()=>{clearSession();location.href=location.pathname});

function joinFromEntry(){ $('entryError').textContent='';const playerName=$('playerName').value;localStorage.setItem(PLAYER_KEY,playerName);socket.emit('room:join',{roomId:$('roomId').value,playerName,reconnectToken:persistentToken()},handleJoinAck)}
function action(name,payload){socket.emit(name,payload,(res)=>{if(!res?.ok)alert(res?.error||'操作失敗。')})}
function resumeSession(session){state.resuming=true;$('resumeStatus').textContent='正在重新加入原房間…';socket.emit('room:resume',session,(res)=>{state.resuming=false;if(!res?.ok){if(session?.recoveryToken&&session?.recoverySnapshot&&session?.playerId===session.recoverySnapshot.hostId){$('resumeStatus').textContent='伺服器剛重啟，正在由房主存檔復原房間…';socket.emit('room:restore',{snapshot:session.recoverySnapshot,recoveryToken:session.recoveryToken,playerId:session.playerId,reconnectToken:session.reconnectToken},(restored)=>{if(restored?.ok)return handleJoinAck(restored,true);clearSession();$('resumeStatus').textContent='房間復原失敗，可重新建立或加入房間。';$('entry').classList.remove('hidden')});return}clearSession();$('resumeStatus').textContent='原房間已失效，可重新建立或加入房間。';$('entry').classList.remove('hidden');return}handleJoinAck(res,true)})}
function handleJoinAck(res,resumed=false){if(!res?.ok){$('entryError').textContent=res?.error||'操作失敗。';return}state.selfId=res.selfId;state.reconnectToken=res.reconnectToken;state.recoveryToken=res.recoveryToken||state.recoveryToken;state.recoverySnapshot=res.recoverySnapshot||state.recoverySnapshot;state.room=res.room;state.gameData=res.gameData||state.gameData;writeSession();$('entry').classList.add('hidden');$('game').classList.remove('hidden');$('reconnectBanner').classList.add('hidden');$('resumeStatus').textContent=resumed?'已自動回到原房間。':'';const url=new URL(location.href);url.searchParams.set('room',res.room.id);history.replaceState(null,'',url);render()}
function inviteUrl(){if(!state.room)return'';const url=new URL(location.origin+location.pathname);url.searchParams.set('room',state.room.id);return url.toString()}
async function copyInviteLink(){const text=inviteUrl();if(!text)return;try{await navigator.clipboard.writeText(text);showCopyStatus('已複製')}catch(_){const input=document.createElement('textarea');input.value=text;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();document.execCommand('copy');input.remove();showCopyStatus('已複製')}}
function showCopyStatus(text){$('copyInviteStatus').textContent=text;clearTimeout(showCopyStatus.timer);showCopyStatus.timer=setTimeout(()=>{$('copyInviteStatus').textContent=''},1800)}
function areaById(id){return state.gameData.areas.find((x)=>x.id===id)}
function sinnerById(id){return state.gameData.sinners.find((x)=>x.id===id)}

function render(){
  const room=state.room;if(!room)return;const me=room.players.find((p)=>p.id===state.selfId);if(!me){clearSession();location.reload();return}
  const area=areaById(room.areaId),isHost=state.selfId===room.hostId;$('roomCode').textContent=room.id;
  $('areaSummary').innerHTML=area?`<strong>${escapeHtml(area.name)}</strong><span>RISK / ${escapeHtml(area.risk)} · 建議 Lv.${area.level}</span>`:'';
  $('playerList').innerHTML=room.players.map((p)=>{const sinner=sinnerById(p.sinnerId);const hpPct=Math.max(0,Math.round(p.hp/p.maxHp*100));return `<div class="player${p.id===state.selfId?' me':''}${p.connected?'':' offline'}"><div class="player-name">${escapeHtml(p.name)}${p.id===room.hostId?' · 房主':''}${p.connected?'':' · 離線'}</div><div class="player-meta">${sinner?escapeHtml(sinner.name):'未選角色'}</div><div class="hp-line"><span>HP ${p.hp}/${p.maxHp}</span><div class="hp-track"><i style="width:${hpPct}%"></i></div></div></div>`}).join('');
  $('lobbySetup').classList.toggle('hidden',room.phase!=='lobby');$('explorationPanel').classList.toggle('hidden',room.phase!=='exploration');$('startGame').classList.toggle('hidden',!isHost||room.phase!=='lobby');
  if(room.phase==='lobby')renderLobby(room,me,isHost);if(room.phase==='exploration')renderExploration(room,isHost);
  $('teamInfo').innerHTML=room.players.map((p)=>{const sinner=sinnerById(p.sinnerId);const hpPct=Math.max(0,Math.round(p.hp/p.maxHp*100));return `<div class="team-row${p.connected?'':' offline-row'}"><div><b>${escapeHtml(sinner?.name||p.name)}</b><small>${p.connected?'在線':'離線'}</small></div><div class="team-hp"><span>${p.hp}/${p.maxHp}</span><div class="hp-track"><i style="width:${hpPct}%"></i></div></div></div>`}).join('');
}
function renderLobby(room,me,isHost){
  $('areaList').innerHTML=state.gameData.areas.map((area)=>{const active=room.areaId===area.id?' active':'',disabled=isHost?'':' disabled';return `<button class="area-card${active}" data-area="${area.id}"${disabled}><div><b>${escapeHtml(area.name)}</b><span>RISK / ${escapeHtml(area.risk)}</span></div><small>${escapeHtml(area.tier==='intermediate'?`中級 · 全隊需 Lv.${area.requiredLevel}`:`初級 · 建議 Lv.${area.level}`)}</small><p>${escapeHtml(area.desc)}</p></button>`}).join('');
  document.querySelectorAll('[data-area]').forEach((button)=>button.addEventListener('click',()=>action('room:area',{roomId:room.id,areaId:button.dataset.area})));
  const occupied=new Set(room.players.filter((p)=>p.id!==me?.id).map((p)=>p.sinnerId).filter(Boolean));
  $('sinnerList').innerHTML=state.gameData.sinners.map((sinner)=>{const active=me?.sinnerId===sinner.id?' active':'',disabled=occupied.has(sinner.id)?' disabled':'';return `<button class="sinner-card${active}" data-sinner="${sinner.id}"${disabled}><b>${escapeHtml(sinner.name)}</b><span>${escapeHtml(sinner.specialty)}</span><small>戰 ${sinner.stats.combat} · 觀 ${sinner.stats.observe} · 機 ${sinner.stats.mobility} · 穩 ${sinner.stats.stability}</small></button>`}).join('');
  document.querySelectorAll('[data-sinner]').forEach((button)=>button.addEventListener('click',()=>action('player:sinner',{roomId:room.id,sinnerId:button.dataset.sinner})));
}
function meter(label,value,max,kind){const pct=Math.max(0,Math.min(100,Math.round(value/max*100)));return `<div class="meter ${kind}"><div><b>${label}</b><span>${value} / ${max}</span></div><div class="meter-track"><i style="width:${pct}%"></i></div></div>`}
function renderExploration(room,isHost){
  const event=room.currentEvent,area=areaById(room.areaId),ex=room.exploration||{progress:0,progressGoal:8,danger:0,dangerMax:6,clues:0};
  $('runNumber').textContent=`#${room.run}`;$('eventArea').textContent=area?`${area.name} · RISK / ${area.risk}`:'';
  $('explorationMeters').innerHTML=`${meter('探索進度',ex.progress,ex.progressGoal,'progress')}${meter('危險度',ex.danger,ex.dangerMax,'danger')}<div class="clue-card"><span>CLUES / 線索</span><strong>${ex.clues}</strong></div>`;
  $('eventName').textContent=event?.name||'等待場景';$('eventDescription').textContent=event?.description||'';
  $('eventResult').classList.toggle('hidden',!room.eventResult);$('nextEvent').classList.toggle('hidden',!isHost||!room.eventResult);
  if(!event){$('eventOptions').innerHTML='';return}
  $('eventOptions').innerHTML=event.options.map((option)=>{const declarations=room.players.filter((p)=>room.votes?.[p.id]===option.id);const selected=room.votes?.[state.selfId]===option.id?' selected':'';const names=declarations.map((p)=>escapeHtml(sinnerById(p.sinnerId)?.name||p.name)).join('、');return `<button class="event-option${selected}" data-option="${escapeHtml(option.id)}"${room.eventResult?' disabled':''}><div class="option-head"><span>${escapeHtml(option.label)}</span><em>${escapeHtml(option.statLabel)}檢定</em></div><p>${escapeHtml(option.desc)}</p><div class="option-foot"><span>${escapeHtml(option.risk)}</span><span>${declarations.length?`宣告：${names}`:'尚無人宣告'}</span></div></button>`}).join('');
  document.querySelectorAll('[data-option]').forEach((button)=>button.addEventListener('click',()=>action('event:vote',{roomId:room.id,optionId:button.dataset.option})));
  if(room.eventResult)renderResult(room.eventResult);else $('eventResult').innerHTML='';
}
function renderResult(r){
  const labels={critical:'大成功',success:'成功',mixed:'代價成功',failure:'失敗','critical-failure':'大失敗'};const key=`${state.room?.run}-${r.degree}-${r.die}-${r.total}`;
  const contributionHtml=(r.contributions||[]).map((c)=>`<div class="contribution"><b>${escapeHtml(c.sinner)}</b><span>${escapeHtml(c.actionLabel)} · ${escapeHtml(c.statLabel)} ${c.statValue}</span></div>`).join('');
  $('eventResult').className=`event-result result-${r.degree}`;
  $('eventResult').innerHTML=`<div class="result-title"><span>${labels[r.degree]||'判定結果'}</span><strong class="die-face">d20 = ${r.die}</strong></div><div class="roll-line"><span>修正 +${r.modifier}</span><b>總值 ${r.total}</b><span>DC ${r.dc}</span></div><p class="gm-result">${escapeHtml(r.text)}</p><div class="result-deltas"><span>進度 ${signed(r.progressDelta)}</span><span>線索 ${signed(r.cluesDelta)}</span><span>危險 ${signed(r.dangerDelta)}</span>${r.damage?`<span>全隊 HP -${r.damage}</span>`:''}</div><details><summary>查看本幕行動</summary><div class="contribution-list">${contributionHtml}</div></details>`;
  if(key!==lastResultKey){lastResultKey=key;document.body.classList.remove('feedback-success','feedback-failure');void document.body.offsetWidth;document.body.classList.add(['critical','success'].includes(r.degree)?'feedback-success':'feedback-failure');setTimeout(()=>document.body.classList.remove('feedback-success','feedback-failure'),700)}
}
function signed(n){const v=Number(n||0);return v>0?`+${v}`:`${v}`}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
