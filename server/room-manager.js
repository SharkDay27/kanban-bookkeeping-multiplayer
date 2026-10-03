const crypto = require('crypto');
const { AREAS, SINNERS, EVENTS } = require('../shared/game-data');
const { loadRooms, saveRooms } = require('./persistence');

const rooms = new Map();
const MAX_PLAYERS = 4;
const RECONNECT_GRACE_MS = 10 * 60 * 1000;
const ROOM_SIGNING_SECRET = process.env.ROOM_SIGNING_SECRET || 'local-dev-v0.5-signing-secret-change-me';

function cleanName(name) {
  const value = String(name || '').trim().slice(0, 16);
  return value || '探索者';
}

function makeRoomId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let id = '';
    for (let i = 0; i < 4; i += 1) id += alphabet[crypto.randomInt(0, alphabet.length)];
    if (!rooms.has(id)) return id;
  }
  throw new Error('暫時無法建立房間，請重試。');
}

function makePlayer(socketId, playerName, reconnectToken) {
  return {
    id: crypto.randomUUID(),
    reconnectToken: reconnectToken || crypto.randomUUID(),
    socketId,
    connected: true,
    disconnectedAt: null,
    name: cleanName(playerName),
    hp: 100,
    maxHp: 100,
    level: 22,
    sinnerId: '',
    ready: false,
    inventory: []
  };
}

function signRecovery(room) {
  return crypto.createHmac('sha256', ROOM_SIGNING_SECRET).update(`${room.id}:${room.hostId}`).digest('hex');
}

function verifyRecovery(roomId, hostId, token) {
  const expected = crypto.createHmac('sha256', ROOM_SIGNING_SECRET).update(`${roomId}:${hostId}`).digest('hex');
  const a = Buffer.from(String(expected));
  const b = Buffer.from(String(token || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function recoverySnapshot(room) {
  return JSON.parse(JSON.stringify(room));
}

function persist() { saveRooms(rooms); }

function sanitizeRestoredRoom(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') throw new Error('存檔格式不正確。');
  const id = String(snapshot.id || '').toUpperCase();
  if (!/^[A-Z2-9]{4}$/.test(id)) throw new Error('房號格式不正確。');
  if (!Array.isArray(snapshot.players) || snapshot.players.length < 1 || snapshot.players.length > MAX_PLAYERS) throw new Error('玩家資料不正確。');
  const area = AREAS.find((a) => a.id === snapshot.areaId) || AREAS[0];
  const validEventIds = new Set(EVENTS.filter((e) => e.area === area.id).map((e) => e.id));
  const players = snapshot.players.map((p) => ({
    id: String(p.id || crypto.randomUUID()),
    reconnectToken: String(p.reconnectToken || crypto.randomUUID()),
    socketId: '', connected: false, disconnectedAt: Date.now(),
    name: cleanName(p.name),
    hp: Math.max(0, Math.min(100, Number(p.hp ?? 100))), maxHp: 100,
    level: Math.max(1, Math.min(99, Number(p.level || 22))),
    sinnerId: SINNERS.some((s) => s.id === p.sinnerId) ? p.sinnerId : '',
    ready: !!p.ready,
    inventory: Array.isArray(p.inventory) ? p.inventory.slice(0, 100) : []
  }));
  const hostId = players.some((p) => p.id === snapshot.hostId) ? snapshot.hostId : players[0].id;
  let currentEvent = null;
  if (snapshot.currentEvent?.id && validEventIds.has(snapshot.currentEvent.id)) {
    const source = EVENTS.find((e) => e.id === snapshot.currentEvent.id);
    currentEvent = { ...source, options:[{id:'careful',label:'謹慎調查'},{id:'advance',label:'直接通過'}] };
  }
  const votes = {};
  for (const p of players) {
    if (['careful','advance'].includes(snapshot.votes?.[p.id])) votes[p.id] = snapshot.votes[p.id];
  }
  return {
    id, createdAt:Number(snapshot.createdAt || Date.now()), phase:snapshot.phase === 'exploration' ? 'exploration' : 'lobby',
    hostId, players, areaId:area.id, run:Math.max(0, Number(snapshot.run || 0)),
    sharedInventory:Array.isArray(snapshot.sharedInventory) ? snapshot.sharedInventory.slice(0, 100) : [],
    currentEvent, eventResult:snapshot.eventResult && typeof snapshot.eventResult === 'object' ? snapshot.eventResult : null,
    votes
  };
}

function restoreRoom(snapshot, recoveryToken, socketId, playerId, reconnectToken) {
  const candidate = sanitizeRestoredRoom(snapshot);
  if (rooms.has(candidate.id)) throw new Error('房間已經存在。');
  if (!verifyRecovery(candidate.id, candidate.hostId, recoveryToken)) throw new Error('房間復原授權無效。');
  const player = candidate.players.find((p) => p.id === playerId && p.reconnectToken === reconnectToken);
  if (!player || player.id !== candidate.hostId) throw new Error('只有原房主可以復原房間。');
  player.socketId = socketId; player.connected = true; player.disconnectedAt = null;
  rooms.set(candidate.id, candidate); persist();
  return { room:candidate, player };
}

function createRoom(socketId, playerName, reconnectToken) {
  const player = makePlayer(socketId, playerName, reconnectToken);
  const room = { id:makeRoomId(), createdAt:Date.now(), phase:'lobby', hostId:player.id, players:[player], areaId:'zone-1', run:0, sharedInventory:[], currentEvent:null, eventResult:null, votes:{} };
  rooms.set(room.id, room); persist();
  return { room, player };
}

function joinRoom(roomId, socketId, playerName, reconnectToken) {
  const id = String(roomId || '').trim().toUpperCase();
  const room = rooms.get(id);
  if (!room) throw new Error('找不到房間。');
  if (room.phase !== 'lobby') throw new Error('遊戲已經開始。請使用原本的瀏覽器重新連線。');
  if (room.players.length >= MAX_PLAYERS) throw new Error('房間已滿。');
  const player = makePlayer(socketId, playerName, reconnectToken);
  room.players.push(player); persist();
  return { room, player };
}

function resumeRoom(roomId, socketId, playerId, reconnectToken) {
  const id = String(roomId || '').trim().toUpperCase();
  const room = rooms.get(id);
  if (!room) throw new Error('房間已不存在。');
  const player = room.players.find((p) => p.id === playerId && p.reconnectToken === reconnectToken);
  if (!player) throw new Error('無法驗證原本的玩家席位。');
  player.socketId = socketId; player.connected = true; player.disconnectedAt = null; persist();
  return { room, player };
}

function markDisconnected(socketId) {
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) continue;
    player.socketId = ''; player.connected = false; player.disconnectedAt = Date.now(); persist();
    return { room, player };
  }
  return null;
}

function removeExpiredPlayer(roomId, playerId, disconnectedAt) {
  const room = rooms.get(roomId); if (!room) return null;
  const index = room.players.findIndex((p) => p.id === playerId); if (index < 0) return null;
  const player = room.players[index];
  if (player.connected || player.disconnectedAt !== disconnectedAt) return null;
  if (Date.now() - disconnectedAt < RECONNECT_GRACE_MS) return null;
  room.players.splice(index, 1); delete room.votes[player.id];
  if (room.players.length === 0) { rooms.delete(room.id); persist(); return { room:null, player }; }
  if (room.hostId === player.id) room.hostId = room.players.find((p) => p.connected)?.id || room.players[0].id;
  persist(); return { room, player };
}

function setArea(room, player, areaId) {
  if (player.id !== room.hostId) throw new Error('只有房主可以選擇探索地區。');
  if (room.phase !== 'lobby') throw new Error('探索開始後不能更換區域。');
  const area = AREAS.find((a) => a.id === areaId); if (!area) throw new Error('找不到探索地區。');
  room.areaId = area.id; room.eventResult = null; persist();
}

function setSinner(room, player, sinnerId) {
  if (room.phase !== 'lobby') throw new Error('探索開始後不能更換罪人。');
  const sinner = SINNERS.find((s) => s.id === sinnerId); if (!sinner) throw new Error('找不到罪人。');
  if (room.players.some((p) => p.id !== player.id && p.sinnerId === sinner.id)) throw new Error('這名罪人已被其他玩家選擇。');
  player.sinnerId = sinner.id; player.ready = true; persist();
}

function publicRoom(room) {
  return { id:room.id, phase:room.phase, hostId:room.hostId, players:room.players.map(({socketId,reconnectToken,disconnectedAt,...player})=>player), areaId:room.areaId, run:room.run, sharedInventory:room.sharedInventory, currentEvent:room.currentEvent, eventResult:room.eventResult, votes:room.votes };
}

function loadPersistedRooms() {
  const snapshots = loadRooms();
  for (const raw of snapshots) {
    try {
      const room = sanitizeRestoredRoom(raw);
      room.players.forEach((p) => { p.connected = false; p.socketId = ''; p.disconnectedAt = Date.now(); });
      rooms.set(room.id, room);
    } catch (error) { console.warn('Skipped invalid persisted room:', error.message); }
  }
  if (rooms.size) persist();
  return rooms.size;
}

module.exports = {
  rooms, RECONNECT_GRACE_MS, signRecovery, recoverySnapshot, restoreRoom, persist,
  createRoom, joinRoom, resumeRoom, markDisconnected, removeExpiredPlayer,
  setArea, setSinner, publicRoom, loadPersistedRooms
};
