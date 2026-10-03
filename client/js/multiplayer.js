const socket=io();
const $=(id)=>document.getElementById(id);
const SESSION_KEY='kanban-bookkeeping-multiplayer-v0.7-session';
const PLAYER_KEY='kanban-bookkeeping-multiplayer-player-name';
const CHAPTER_LABELS=['初級','中級','高級'];
let state={room:null,selfId:null,reconnectToken:null,recoveryToken:null,recoverySnapshot:null,gameData:{areas:[],sinners:[],statusEffects:[]},resuming:false};
let lastCombatSerial=null,lastCombatKey='';

function readSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function writeSession(){if(!state.room||!state.selfId||!state.reconnectToken)return;localStorage.setItem(SESSION_KEY,JSON.stringify({roomId:state.room.id,playerId:state.selfId,reconnectToken:state.reconnectToken,recoveryToken:state.recoveryToken,recoverySnapshot:state.recoverySnapshot}))}
function clearSession(){localStorage.removeItem(SESSION_KEY)}
function persistentToken(){return readSession()?.reconnectToken||crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function areaById(id){return state.gameData.areas.find(x=>x.id===id)}
function sinnerById(id){return state.gameData.sinners.find(x=>x.id===id)}
function statusById(id){return state.gameData.statusEffects?.find(x=>x.id===id)}
function itemName(item){return item?.name||'空'}
function equipmentMods(me){const out={combat:0,observe:0,mobility:0,stability:0};Object.values(me.equipment||{}).forEach(item=>Object.keys(out).forEach(k=>out[k]+=Number(item?.mods?.[k]||0)));return out}
function statusMods(me){const out={combat:0,observe:0,mobility:0,stability:0};(me.statuses||[]).forEach(active=>{const def=statusById(active.id);Object.keys(out).forEach(k=>out[k]+=Number(def?.mods?.[k]||0))});return out}
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
$('roomId').onkeydown=e=>{if(e.key==='Enter')joinFromEntry()};
$('copyInvite').onclick=copyInviteLink;
$('startGame').onclick=()=>action('room:start',{roomId:state.room?.id});
$('nextEvent').onclick=()=>action('event:next',{roomId:state.room?.id});
$('nextCombatNode').onclick=()=>action('event:next',{roomId:state.room?.id});
$('forgetSession').onclick=()=>{clearSession();location.href=location.pathname};

function joinFromEntry(){const playerName=$('playerName').value;localStorage.setItem(PLAYER_KEY,playerName);socket.emit('room:join',{roomId:$('roomId').value,playerName,reconnectToken:persistentToken()},handleJoinAck)}
function resumeSession(s){state.resuming=true;$('resumeStatus').textContent='正在重新加入原房間…';socket.emit('room:resume',s,res=>{state.resuming=false;if(res?.ok)return handleJoinAck(res,true);if(s?.recoveryToken&&s?.recoverySnapshot&&s.playerId===s.recoverySnapshot.hostId){socket.emit('room:restore',{snapshot:s.recoverySnapshot,recoveryToken:s.recoveryToken,playerId:s.playerId,reconnectToken:s.reconnectToken},r=>r?.ok?handleJoinAck(r,true):(clearSession(),location.reload()))}else{clearSession();$('resumeStatus').textContent='原房間已失效。'}})}
function handleJoinAck(res,resumed=false){if(!res?.ok){$('entryError').textContent=res?.error||'操作失敗。';return}state.selfId=res.selfId;state.reconnectToken=res.reconnectToken;state.recoveryToken=res.recoveryToken||state.recoveryToken;state.recoverySnapshot=res.recoverySnapshot||state.recoverySnapshot;state.room=res.room;state.gameData=res.gameData||state.gameData;writeSession();$('entry').classList.add('hidden');$('game').classList.remove('hidden');$('reconnectBanner').classList.add('hidden');$('resumeStatus').textContent=resumed?'已自動回到原房間。':'';const u=new URL(location.href);u.searchParams.set('room',res.room.id);history.replaceState(null,'',u);render()}
function inviteUrl(){const u=new URL(location.origin+location.pathname);u.searchParams.set('room',state.room.id);return u.toString()}
async function copyInviteLink(){try{await navigator.clipboard.writeText(inviteUrl());$('copyInviteStatus').textContent='已複製';setTimeout(()=>$('copyInviteStatus').textContent='',1500)}catch(_){}}

function render(){
  const room=state.room;if(!room)return;const me=room.players.find(p=>p.id===state.selfId);if(!me)return;
  const isHost=state.selfId===room.hostId,area=areaById(room.areaId);$('roomCode').textContent=room.id;$('hostTools').classList.toggle('hidden',!isHost);
  $('areaSummary').innerHTML=room.phase==='lobby'?`<strong>已選 ${room.selectedAreas?.length||0} / 3 地區</strong><span>選取順序決定初級 → 中級 → 高級</span>`:area?`<strong>${escapeHtml(area.name)}</strong><span>${escapeHtml(room.exploration?.difficultyLabel||CHAPTER_LABELS[room.areaIndex]||'')}</span>`:'';
  $('playerList').innerHTML=room.players.map(p=>{const s=sinnerById(p.sinnerId),pct=Math.max(0,Math.round(p.hp/p.maxHp*100));return `<div class="player${p.id===state.selfId?' me':''}"><div class="player-headline"><div><b>${escapeHtml(p.name)}${p.id===room.hostId?' · 房主':''}</b><small>${escapeHtml(s?.name||'未選角色')}${p.connected?'':' · 離線'}</small></div><span>${p.hp}/${p.maxHp}</span></div><div class="hp-track"><i style="width:${pct}%"></i></div></div>`}).join('');
  $('lobbySetup').classList.toggle('hidden',room.phase!=='lobby');$('explorationPanel').classList.toggle('hidden',room.phase==='lobby');$('startGame').classList.toggle('hidden',!isHost||room.phase!=='lobby');$('startGame').disabled=(room.selectedAreas?.length||0)!==3;
  $('startGame').textContent=(room.selectedAreas?.length||0)===3?'開始遠征':`選滿 3 個地區 (${room.selectedAreas?.length||0}/3)`;
  if(room.phase==='lobby')renderLobby(room,me,isHost);else renderExpedition(room,isHost);
  renderSelf(me);renderTeam(room);
}

function renderLobby(room,me,isHost){
  const selected=room.selectedAreas||[];$('mapSelectionNote').textContent=isHost?`依點選順序安排難度，目前已選 ${selected.length}/3。再次點擊已選地區可取消。`:`房主正在選擇三個地區；順序依序為初級、中級、高級。`;
  $('areaList').innerHTML=state.gameData.areas.map(a=>{const order=selected.indexOf(a.id),label=order>=0?`${order+1} · ${CHAPTER_LABELS[order]}`:'';return `<button class="area-card${order>=0?' active':''}" data-area="${a.id}"${isHost?'':' disabled'}><div><b>${escapeHtml(a.name)}</b>${label?`<span class="map-order">${label}</span>`:`<span>${escapeHtml(a.risk)}</span>`}</div><p>${escapeHtml(a.desc)}</p></button>`}).join('');
  document.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>action('room:map-toggle',{roomId:room.id,areaId:b.dataset.area}));
  const occupied=new Set(room.players.filter(p=>p.id!==me.id).map(p=>p.sinnerId));
  $('sinnerList').innerHTML=state.gameData.sinners.map(s=>`<button class="sinner-card${me.sinnerId===s.id?' active':''}" data-sinner="${s.id}"${occupied.has(s.id)?' disabled':''}><b>${escapeHtml(s.name)}</b><span>${escapeHtml(s.specialty)}</span><small>戰 ${s.stats.combat} · 觀 ${s.stats.observe} · 機 ${s.stats.mobility} · 穩 ${s.stats.stability}</small></button>`).join('');
  document.querySelectorAll('[data-sinner]').forEach(b=>b.onclick=()=>action('player:sinner',{roomId:room.id,sinnerId:b.dataset.sinner}));
}

function renderChapterBar(room){$('chapterBar').innerHTML=(room.selectedAreas||[]).map((id,i)=>{const a=areaById(id);return `<div class="chapter-step${i===room.areaIndex?' current':''}${i<room.areaIndex?' done':''}"><span>${i+1}</span><div><b>${escapeHtml(CHAPTER_LABELS[i])}</b><small>${escapeHtml(a?.name||'')}</small></div></div>`}).join('')}
function renderRoute(room){const ex=room.exploration||{},route=ex.route||[];$('routePanel').innerHTML=`<div class="route-caption"><span>${escapeHtml(ex.difficultyLabel||'')}路線</span><b>${Number(ex.position||0)+1} / 10</b></div><div class="route-scroll"><div class="route-track">${route.map((n,i)=>{const label=n.revealed?escapeHtml(n.label):'未知';return `<div class="route-node ${n.type}${n.resolved?' done':''}${i===ex.position?' current':''}"><div class="route-node-box"><b>${i+1}</b><span>${label}</span></div></div>${i<route.length-1?'<i class="route-link"></i>':''}`}).join('')}</div></div>`;requestAnimationFrame(()=>document.querySelector('.route-node.current')?.scrollIntoView({block:'nearest',inline:'center'}))}
function renderExpedition(room,isHost){
  $('runNumber').textContent=`第 ${room.areaIndex+1} 圖 · ${Number(room.exploration?.position||0)+1}/10`;renderChapterBar(room);renderRoute(room);
  const ex=room.exploration||{danger:0,dangerMax:8,clues:0};const max=ex.dangerMax||8;$('explorationMeters').innerHTML=`<div class="meter danger"><div><b>危險度</b><span>${ex.danger}/${max}</span></div><div class="meter-track"><i style="width:${Math.min(100,ex.danger/max*100)}%"></i></div></div><div class="clue-card"><span>線索</span><strong>${ex.clues}</strong></div>`;
  const ended=['victory','defeat'].includes(room.phase);$('endingPanel').classList.toggle('hidden',!ended);$('eventPanel').classList.add('hidden');$('combatPanel').classList.add('hidden');
  if(ended){$('endingPanel').innerHTML=`<strong>${room.phase==='victory'?'遠征完成':'遠征失敗'}</strong><p>${room.phase==='victory'?'三個地區的 Boss 均已擊敗。':'危險失控或隊伍已失去戰鬥能力。'}</p>`;return}
  if(room.combat)return renderCombat(room,isHost);renderScene(room,isHost);
}

function renderScene(room,isHost){
  $('eventPanel').classList.remove('hidden');const e=room.currentEvent;$('eventArea').textContent=`${areaById(room.areaId)?.name||''} · ${room.exploration?.difficultyLabel||''}`;$('eventName').textContent=e?.name||room.nodeReward?.title||'節點結算';$('eventDescription').textContent=e?.description||room.nodeReward?.text||room.eventResult?.text||'';
  const resolved=!!room.eventResult;$('eventOptions').innerHTML=e&&!resolved?e.options.map(o=>`<button class="event-option${room.votes?.[state.selfId]===o.id?' selected':''}" data-option="${o.id}"><div class="option-head"><span>${escapeHtml(o.label)}</span><em>${escapeHtml(o.statLabel)}檢定</em></div><p>${escapeHtml(o.desc)}</p></button>`).join(''):'';
  document.querySelectorAll('#eventOptions [data-option]').forEach(b=>b.onclick=()=>action('event:vote',{roomId:room.id,optionId:b.dataset.option}));
  $('eventResult').classList.toggle('hidden',!resolved);if(resolved){const r=room.eventResult;const status=r.statusApplied?`<div class="status-alert">${escapeHtml(r.statusApplied.name)} 被施加。</div>`:'';$('eventResult').innerHTML=`<strong>${r.degree==='supply'?'取得補給':r.degree==='rest'?'休整完成':'判定結果'}</strong><p>${escapeHtml(r.text||'節點完成。')}</p>${r.damage?`<small>隊伍受到傷害：${r.damage}</small>`:''}${status}`}
  $('nextEvent').classList.toggle('hidden',!isHost||!resolved);
}

function animateCombat(c){
  const key=`${state.room?.areaIndex}-${state.room?.exploration?.position}-${c.enemy?.id}`;if(key!==lastCombatKey){lastCombatKey=key;lastCombatSerial=null;const stage=$('combatStage');stage.classList.remove('boss-enter','encounter-enter');void stage.offsetWidth;stage.classList.add(c.kind==='boss'?'boss-enter':'encounter-enter');setTimeout(()=>stage.classList.remove('boss-enter','encounter-enter'),800)}
  const r=c.lastResolution;if(!r||r.serial===lastCombatSerial)return;lastCombatSerial=r.serial;const stage=$('combatStage'),fx=$('combatFx');stage.classList.remove('enemy-hit','party-hit');void stage.offsetWidth;if(r.teamDamage>0)stage.classList.add('enemy-hit');if(r.incoming>0)setTimeout(()=>stage.classList.add('party-hit'),220);fx.innerHTML=`${r.teamDamage>0?`<span class="floating-damage enemy-damage">-${r.teamDamage}</span>`:''}${r.incoming>0?`<span class="floating-damage party-damage">全隊 -${r.incoming}</span>`:''}`;setTimeout(()=>{stage.classList.remove('enemy-hit','party-hit');fx.innerHTML=''},900)
}
function renderCombat(room,isHost){
  $('combatPanel').classList.remove('hidden');const c=room.combat,e=c.enemy,pct=Math.max(0,e.currentHp/e.maxHp*100);$('enemyKind').textContent=`${c.kind==='boss'?'BOSS':c.kind==='elite'?'ELITE / 精英':'ENCOUNTER / 小怪'} · ${c.difficultyLabel||room.exploration?.difficultyLabel||''}`;$('enemyName').textContent=e.name;$('enemyHpText').textContent=`${e.currentHp} / ${e.maxHp}`;$('enemyHpBar').style.width=`${pct}%`;$('enemyTrait').textContent=e.trait||'';$('combatRound').textContent=`ROUND ${c.round}`;
  const won=e.currentHp<=0||['combat-victory','boss-victory','supply'].includes(room.eventResult?.degree)&&currentNodeResolved(room);$('combatOptions').innerHTML=won?'':c.options.map(o=>`<button class="event-option${room.votes?.[state.selfId]===o.id?' selected':''}" data-combat="${o.id}"><div class="option-head"><span>${escapeHtml(o.label)}</span><em>${escapeHtml(o.statLabel)}</em></div><p>${escapeHtml(o.desc)}</p></button>`).join('');document.querySelectorAll('[data-combat]').forEach(b=>b.onclick=()=>action('event:vote',{roomId:room.id,optionId:b.dataset.combat}));
  $('combatLog').innerHTML=(c.log||[]).slice(-4).map(l=>`<div>${escapeHtml(l.text)}</div>`).join('');$('combatResult').classList.toggle('hidden',!won);$('combatResult').innerHTML=won?`<strong>戰鬥勝利</strong><p>${escapeHtml(room.eventResult?.text||`擊敗 ${e.name}。`)}</p>${room.nodeReward?.reward?`<small>戰利品：${escapeHtml(room.nodeReward.reward.name)}</small>`:''}`:'';$('nextCombatNode').classList.toggle('hidden',!isHost||!won);animateCombat(c)
}
function currentNodeResolved(room){return !!room.exploration?.route?.[room.exploration.position]?.resolved}

function renderSelf(me){
  const s=sinnerById(me.sinnerId);if(!s){$('mySinner').innerHTML='<p class="muted">尚未選擇罪人。</p>';return}const eq=equipmentMods(me),sm=statusMods(me),inv=[...(me.inventory||[])];while(inv.length<4)inv.push(null);const val=k=>s.stats[k]+eq[k]+sm[k];const statuses=(me.statuses||[]).map(a=>{const d=statusById(a.id);return d?`<span class="status-chip ${d.type}" title="${escapeHtml(d.description)}">${escapeHtml(d.name)} · ${a.remaining}</span>`:''}).join('');
  $('mySinner').innerHTML=`<div class="character-header"><div><strong>${escapeHtml(s.name)}</strong><span>${escapeHtml(s.specialty)}</span></div></div><div class="character-hp"><span>HP</span><b>${me.hp}/${me.maxHp}</b><div class="hp-track"><i style="width:${me.hp/me.maxHp*100}%"></i></div></div>${statuses?`<div class="status-list">${statuses}</div>`:''}<div class="stat-grid"><div><span>戰鬥</span><b>${val('combat')}</b></div><div><span>觀察</span><b>${val('observe')}</b></div><div><span>機動</span><b>${val('mobility')}</b></div><div><span>穩定</span><b>${val('stability')}</b></div></div><div class="mini-heading">裝備</div><div class="equipment-grid"><div><span>武器</span><b>${escapeHtml(itemName(me.equipment?.weapon))}</b></div><div><span>防具</span><b>${escapeHtml(itemName(me.equipment?.armor))}</b></div><div><span>飾品</span><b>${escapeHtml(itemName(me.equipment?.accessory))}</b></div></div><div class="mini-heading">消耗品 <span>${inv.filter(Boolean).length}/4</span></div><div class="inventory-grid">${inv.map((x,i)=>x?`<button class="inventory-slot filled" data-item-index="${i}" title="${escapeHtml(x.description||'')}"><span>${i+1}</span><b>${escapeHtml(itemName(x))}</b><small>使用</small></button>`:`<div class="inventory-slot"><span>${i+1}</span><b>空</b></div>`).join('')}</div>`;document.querySelectorAll('[data-item-index]').forEach(b=>b.onclick=()=>action('item:use',{roomId:state.room.id,index:Number(b.dataset.itemIndex)}))
}
function renderTeam(room){$('teamInfo').innerHTML=room.players.map(p=>{const s=sinnerById(p.sinnerId),st=(p.statuses||[]).map(a=>statusById(a.id)?.name).filter(Boolean).join('、');return `<div class="team-row"><div><b>${escapeHtml(s?.name||p.name)}</b><small>${p.connected?'在線':'離線'}${st?` · ${escapeHtml(st)}`:''}</small></div><span>${p.hp}/${p.maxHp}</span></div>`}).join('')}
