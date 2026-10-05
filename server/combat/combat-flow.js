const crypto = require('crypto');
const Cards = require('../cards/card-manager');
const B = require('../status/battle-status');
const {aliveEnemies} = require('./combat-enemies');
const {setEnemyIntents} = require('./combat-intents');
const {syncCombatBossPhases} = require('./boss-phase');
const {resolvePlayerAction, resolveEnemyActions} = require('./combat-damage');
const {persist} = require('../room/room-manager');
const active = room => room.players.filter(p => p.connected && p.hp > 0);

function movement(room) {
  const c = room.combat;
  c.phase = 'initiative';
  c.exchange = 1;
  c.initiativeSerial = crypto.randomUUID();
  c.ready = {};
  c.initiative = require('./initiative').order(room);
  c.firstSide = c.initiative[0]?.side || 'player';
  c.selections = {};
  c.intents = {};
  c.intent = null;
  c.blockChallenge = null;
}
function initialize(room) {
  room.combat.flowVersion = 29;
  room.combat.rulesVersion = 29;
  room.combat.lastResolution = null;
  movement(room);
}
function open(room) {
  const c = room.combat;
  const playerFirst = c.firstSide === 'player';
  c.phase = (c.exchange === 1 ? playerFirst : !playerFirst) ? 'attack' : 'defense';
  c.phaseSerial = crypto.randomUUID();
  c.ready = {};
  setEnemyIntents(c);
  Cards.prepareAutomatic(room);
}
function advance(room) {
  const c = room.combat, actors = active(room);
  if (!c || c.ended || !c.flowVersion || !actors.length) return;
  if (!['initiative', 'resolving'].includes(c.phase) || !actors.every(p => c.ready?.[p.id])) return;
  if (c.phase === 'initiative') open(room);
  else if (c.exchange === 1) { c.exchange = 2; open(room); }
  else { c.round++; movement(room); }
  persist();
}
function ready(room, player, kind, serial) {
  const c = room.combat;
  if (!c || c.ended || player.hp <= 0 || !player.connected) return;
  const valid = kind === 'initiative' && c.phase === 'initiative' && serial === c.initiativeSerial
    || kind === 'resolution' && c.phase === 'resolving' && serial === c.lastResolution?.serial;
  if (!valid) return;
  c.ready[player.id] = true;
  advance(room);
  persist();
}
function resolve(room) {
  const c = room.combat;
  if (c.ended || !['attack', 'defense'].includes(c.phase)) return null;
  Cards.prepareAutomatic(room);
  const actors = active(room);
  if (!actors.length || actors.some(p => !c.selections[p.id]?.confirmed)) return null;
  const phase = c.phase, records = [], enemyResults = [], guards = new Set();
  let incoming = 0;
  c.timeline = [];
  require('./opposed-dice').prepare(room);
  const enemyTurn = turn => {
    const events = B.captureEffects(() => {
      const result = resolveEnemyActions(room, guards, turn.id);
      incoming += result.total;
      for (const rec of result.results) {
        c.timeline.push({side: 'enemy', index: enemyResults.length});
        enemyResults.push(rec);
      }
    });
    if (events.length) c.timeline.push({side: 'status', events});
  };
  // Defenders may use defensive utilities, but never execute an attack here.
  if (phase === 'attack') for (const turn of c.initiative.filter(t => t.side === 'enemy')) {
    if (['guard', 'shield', 'enrage'].includes(c.intents[turn.id]?.type)) enemyTurn(turn);
  }
  // A reconnecting teammate can contribute without changing the locked first side.
  const players = [...c.initiative.filter(t => t.side === 'player'),
    ...actors.filter(p => !c.initiative.some(t => t.side === 'player' && t.id === p.id))
      .map(p => ({side: 'player', id: p.id, name: require('../status/status-manager').sinnerOf(p)?.name || p.name}))];
  for (const turn of players) {
    const player = actors.find(p => p.id === turn.id);
    if (!player || player.hp <= 0 || !aliveEnemies(c).length) continue;
    const before = records.length;
    const events = B.captureEffects(() => {
      if (B.skip(player)) records.push({playerId: player.id, sinner: turn.name, action: '麻痺：本次無法行動', kind: 'card-guard', cardBased: true, dealt: 0});
      else resolvePlayerAction(room, player, c.selections[player.id], guards, records);
    });
    for (let i = before; i < records.length; i++) c.timeline.push({side: 'player', index: i});
    if (events.length) c.timeline.push({side: 'status', events});
    syncCombatBossPhases(c);
  }
  // All player defensive/support actions finish before the enemy attacks.
  if (phase === 'defense') for (const turn of c.initiative.filter(t => t.side === 'enemy')) {
    if (room.players.every(p => p.hp <= 0)) break;
    enemyTurn(turn);
  }
  const manager = require('./combat-manager');
  const victory = () => {
    const result = manager.closeVictory(room, records, enemyResults);
    Object.assign(c.lastResolution, {initiativeAlreadyPlayed: true, phase});
    persist();
    return result;
  };
  if (!aliveEnemies(c).length && !room.players.every(p => p.hp <= 0)) return victory();
  // Periodic effects and durations tick once after both attack/defense exchanges.
  if (c.exchange === 2) {
    const events = B.captureEffects(() => {
      require('../status/status-manager').tickStatuses(room.players, {combatRound: true});
      for (const enemy of aliveEnemies(c)) B.tick(enemy);
    });
    if (events.length) c.timeline.push({side: 'status', events});
    for (const player of room.players) {
      if (player.controlFresh) player.controlFresh = false;
      else player.serverControl = Math.max(0, Number(player.serverControl || 0) - 1);
    }
    manager.tickCooldowns(c);
  }
  const result = {serial: crypto.randomUUID(), phase, round: c.round, players: records, enemyResults, incoming, timeline: c.timeline, initiativeAlreadyPlayed: true};
  c.lastResolution = result;
  if (manager.checkDefeat(room)) { persist(); return result; }
  if (!aliveEnemies(c).length) return victory();
  Cards.nextRound(room);
  c.selections = {};
  c.phase = 'resolving';
  c.ready = {};
  persist();
  return result;
}
module.exports = {initialize, movement, open, advance, ready, resolve};
