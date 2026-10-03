const socket = io();
const $ = (id) => document.getElementById(id);
const SESSION_KEY = 'kanban-bookkeeping-multiplayer-v0.5-session';
const PLAYER_KEY = 'kanban-bookkeeping-multiplayer-player-name';
let state = { room:null, selfId:null, reconnectToken:null, recoveryToken:null, recoverySnapshot:null, gameData:{ areas:[], sinners:[] }, resuming:false };

function readSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (_error) { return null; }
}
function writeSession() {
  if (!state.room || !state.selfId || !state.reconnectToken) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ roomId:state.room.id, playerId:state.selfId, reconnectToken:state.reconnectToken, recoveryToken:state.recoveryToken, recoverySnapshot:state.recoverySnapshot }));
}
function clearSession() { localStorage.removeItem(SESSION_KEY); }
function persistentToken() {
  const old = readSession()?.reconnectToken;
  if (old) return old;
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const savedName = localStorage.getItem(PLAYER_KEY);
if (savedName) $('playerName').value = savedName;
const inviteRoom = new URLSearchParams(location.search).get('room');
const normalizedInviteRoom = inviteRoom ? inviteRoom.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) : '';
if (normalizedInviteRoom) {
  const normalized = normalizedInviteRoom;
  if (normalized) {
    $('roomId').value = normalized;
    $('inviteRoomCode').textContent = normalized;
    $('inviteNotice').classList.remove('hidden');
    requestAnimationFrame(() => $('playerName').select());
  }
}
$('deployMode').textContent = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'LOCAL' : 'ONLINE';

socket.on('connect', () => {
  $('connection').textContent = '● 已連線';
  const session = readSession();
  const inviteMatchesSession = !normalizedInviteRoom || normalizedInviteRoom === session?.roomId;
  if (session?.roomId && session?.playerId && session?.reconnectToken && inviteMatchesSession && !state.resuming) resumeSession(session);
});
socket.on('disconnect', () => {
  $('connection').textContent = '○ 已斷線 · 自動重連中';
  $('reconnectBanner').classList.remove('hidden');
});
socket.on('room:update', (room) => {
  state.room = room;
  if (room.players.some((p) => p.id === state.selfId)) writeSession();
  render();
});
socket.on('room:recovery', (payload) => {
  if (!payload) return;
  state.recoveryToken = payload.recoveryToken || state.recoveryToken;
  state.recoverySnapshot = payload.recoverySnapshot || state.recoverySnapshot;
  writeSession();
});

$('createRoom').addEventListener('click', () => {
  $('entryError').textContent = '';
  const playerName = $('playerName').value;
  localStorage.setItem(PLAYER_KEY, playerName);
  socket.emit('room:create', { playerName, reconnectToken:persistentToken() }, handleJoinAck);
});
$('joinRoom').addEventListener('click', joinFromEntry);
$('roomId').addEventListener('input', (ev) => { ev.target.value = ev.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4); });
$('roomId').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') joinFromEntry(); });
$('playerName').addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && $('roomId').value.trim()) joinFromEntry(); });
$('copyInvite').addEventListener('click', copyInviteLink);
$('startGame').addEventListener('click', () => action('room:start', { roomId:state.room?.id }));
$('nextEvent').addEventListener('click', () => action('event:next', { roomId:state.room?.id }));
$('forgetSession').addEventListener('click', () => { clearSession(); location.href = location.pathname; });

function joinFromEntry() {
  $('entryError').textContent = '';
  const playerName = $('playerName').value;
  localStorage.setItem(PLAYER_KEY, playerName);
  socket.emit('room:join', { roomId:$('roomId').value, playerName, reconnectToken:persistentToken() }, handleJoinAck);
}
function action(name, payload) { socket.emit(name, payload, (res) => { if (!res?.ok) alert(res?.error || '操作失敗。'); }); }
function resumeSession(session) {
  state.resuming = true;
  $('resumeStatus').textContent = '正在重新加入原房間…';
  socket.emit('room:resume', session, (res) => {
    state.resuming = false;
    if (!res?.ok) {
      if (session?.recoveryToken && session?.recoverySnapshot && session?.playerId === session.recoverySnapshot.hostId) {
        $('resumeStatus').textContent = '伺服器剛重啟，正在由房主存檔復原房間…';
        socket.emit('room:restore', { snapshot:session.recoverySnapshot, recoveryToken:session.recoveryToken, playerId:session.playerId, reconnectToken:session.reconnectToken }, (restored) => {
          if (restored?.ok) return handleJoinAck(restored, true);
          clearSession(); $('resumeStatus').textContent = '房間復原失敗，可重新建立或加入房間。'; $('entry').classList.remove('hidden');
        });
        return;
      }
      clearSession();
      $('resumeStatus').textContent = '原房間已失效，可重新建立或加入房間。';
      $('entry').classList.remove('hidden');
      return;
    }
    handleJoinAck(res, true);
  });
}
function handleJoinAck(res, resumed = false) {
  if (!res?.ok) { $('entryError').textContent = res?.error || '操作失敗。'; return; }
  state.selfId = res.selfId;
  state.reconnectToken = res.reconnectToken;
  state.recoveryToken = res.recoveryToken || state.recoveryToken;
  state.recoverySnapshot = res.recoverySnapshot || state.recoverySnapshot;
  state.room = res.room;
  state.gameData = res.gameData || state.gameData;
  writeSession();
  $('entry').classList.add('hidden');
  $('game').classList.remove('hidden');
  $('reconnectBanner').classList.add('hidden');
  $('resumeStatus').textContent = resumed ? '已自動回到原房間。' : '';
  const url = new URL(location.href);
  url.searchParams.set('room', res.room.id);
  history.replaceState(null, '', url);
  render();
}
function inviteUrl() {
  if (!state.room) return '';
  const url = new URL(location.origin + location.pathname);
  url.searchParams.set('room', state.room.id);
  return url.toString();
}
async function copyInviteLink() {
  const text = inviteUrl(); if (!text) return;
  try { await navigator.clipboard.writeText(text); showCopyStatus('已複製'); }
  catch (_error) {
    const input = document.createElement('textarea'); input.value = text; input.setAttribute('readonly', ''); input.style.position = 'fixed'; input.style.opacity = '0';
    document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove(); showCopyStatus('已複製');
  }
}
function showCopyStatus(text) { $('copyInviteStatus').textContent = text; clearTimeout(showCopyStatus.timer); showCopyStatus.timer = setTimeout(() => { $('copyInviteStatus').textContent = ''; }, 1800); }
function areaById(id) { return state.gameData.areas.find((x) => x.id === id); }
function sinnerById(id) { return state.gameData.sinners.find((x) => x.id === id); }

function render() {
  const room = state.room; if (!room) return;
  const me = room.players.find((p) => p.id === state.selfId);
  if (!me) { clearSession(); location.reload(); return; }
  const area = areaById(room.areaId);
  const isHost = state.selfId === room.hostId;
  $('roomCode').textContent = room.id;
  $('areaSummary').innerHTML = area ? `<strong>${escapeHtml(area.name)}</strong><span>RISK / ${escapeHtml(area.risk)} · 建議 Lv.${area.level}</span>` : '';
  $('playerList').innerHTML = room.players.map((p) => {
    const sinner = sinnerById(p.sinnerId);
    return `<div class="player${p.id === state.selfId ? ' me' : ''}${p.connected ? '' : ' offline'}"><div class="player-name">${escapeHtml(p.name)}${p.id === room.hostId ? ' · 房主' : ''}${p.connected ? '' : ' · 離線'}</div><div class="player-meta">${sinner ? escapeHtml(sinner.name) : '未選角色'} · HP ${p.hp}/${p.maxHp}</div></div>`;
  }).join('');
  $('lobbySetup').classList.toggle('hidden', room.phase !== 'lobby');
  $('explorationPanel').classList.toggle('hidden', room.phase !== 'exploration');
  $('startGame').classList.toggle('hidden', !isHost || room.phase !== 'lobby');
  if (room.phase === 'lobby') renderLobby(room, me, isHost);
  if (room.phase === 'exploration') renderExploration(room, isHost);
  $('teamInfo').innerHTML = room.players.map((p) => { const sinner = sinnerById(p.sinnerId); return `<div class="team-row${p.connected ? '' : ' offline-row'}"><b>${escapeHtml(sinner?.name || p.name)}</b><span>${p.connected ? '' : '離線 · '}HP ${p.hp}/${p.maxHp}</span></div>`; }).join('');
}

function renderLobby(room, me, isHost) {
  $('areaList').innerHTML = state.gameData.areas.map((area) => {
    const active = room.areaId === area.id ? ' active' : '';
    const disabled = isHost ? '' : ' disabled';
    return `<button class="area-card${active}" data-area="${area.id}"${disabled}><div><b>${escapeHtml(area.name)}</b><span>RISK / ${escapeHtml(area.risk)}</span></div><small>${escapeHtml(area.tier === 'intermediate' ? `中級 · 全隊需 Lv.${area.requiredLevel}` : `初級 · 建議 Lv.${area.level}`)}</small><p>${escapeHtml(area.desc)}</p></button>`;
  }).join('');
  document.querySelectorAll('[data-area]').forEach((button) => button.addEventListener('click', () => action('room:area', { roomId:room.id, areaId:button.dataset.area })));
  const occupied = new Set(room.players.filter((p) => p.id !== me?.id).map((p) => p.sinnerId).filter(Boolean));
  $('sinnerList').innerHTML = state.gameData.sinners.map((sinner) => {
    const active = me?.sinnerId === sinner.id ? ' active' : '';
    const disabled = occupied.has(sinner.id) ? ' disabled' : '';
    return `<button class="sinner-card${active}" data-sinner="${sinner.id}"${disabled}><b>${escapeHtml(sinner.name)}</b><span>${escapeHtml(sinner.specialty)}</span><small>戰 ${sinner.stats.combat} · 觀 ${sinner.stats.observe} · 機 ${sinner.stats.mobility} · 穩 ${sinner.stats.stability}</small></button>`;
  }).join('');
  document.querySelectorAll('[data-sinner]').forEach((button) => button.addEventListener('click', () => action('player:sinner', { roomId:room.id, sinnerId:button.dataset.sinner })));
}

function renderExploration(room, isHost) {
  const event = room.currentEvent;
  const area = areaById(room.areaId);
  const onlineCount = room.players.filter((p) => p.connected).length;
  $('runNumber').textContent = `#${room.run}`;
  $('eventArea').textContent = area ? `${area.name} · RISK / ${area.risk}` : '';
  $('eventName').textContent = event?.name || '等待事件';
  $('eventDescription').textContent = event?.description || '';
  $('eventResult').classList.toggle('hidden', !room.eventResult);
  $('nextEvent').classList.toggle('hidden', !isHost || !room.eventResult);
  if (!event) { $('eventOptions').innerHTML = ''; return; }
  $('eventOptions').innerHTML = event.options.map((option) => {
    const count = room.players.filter((p) => p.connected && room.votes?.[p.id] === option.id).length;
    const selected = room.votes?.[state.selfId] === option.id ? ' selected' : '';
    return `<button class="event-option${selected}" data-option="${escapeHtml(option.id)}"${room.eventResult ? ' disabled' : ''}><span>${escapeHtml(option.label)}</span><span class="vote-count">${count} / ${onlineCount}</span></button>`;
  }).join('');
  document.querySelectorAll('[data-option]').forEach((button) => button.addEventListener('click', () => action('event:vote', { roomId:room.id, optionId:button.dataset.option })));
  if (room.eventResult) {
    const r = room.eventResult;
    $('eventResult').innerHTML = `<strong>${r.success ? '判定成功' : '判定失敗'}</strong><p>${escapeHtml(r.text)}</p><small>成功率 ${r.chance}% · 伺服器擲值 ${r.roll}%${r.damage ? ` · 全隊受到 ${r.damage} 傷害` : ''}</small>`;
  } else $('eventResult').innerHTML = '';
}

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char])); }
