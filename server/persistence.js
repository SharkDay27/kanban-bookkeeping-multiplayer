const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const SAVE_FILE = path.join(DATA_DIR, 'rooms.json');

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadRooms() {
  try {
    ensureDir();
    if (!fs.existsSync(SAVE_FILE)) return [];
    const raw = fs.readFileSync(SAVE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if(!Array.isArray(parsed))return [];
    for(const room of parsed)for(const p of room.players||[]){p.battleStatusActive=!!room.combat&&!room.combat.ended&&room.phase==='exploration';if(!p.battleStatusActive){p.statuses=[];p.markMods={};p.temporaryShield=0;}}
    return parsed;
  } catch (error) {
    console.error('Failed to load room persistence:', error);
    return [];
  }
}

function saveRooms(rooms) {
  try {
    ensureDir();
    const temp = `${SAVE_FILE}.tmp`;
    fs.writeFileSync(temp, JSON.stringify([...rooms.values()], null, 2), 'utf8');
    fs.renameSync(temp, SAVE_FILE);
  } catch (error) {
    console.error('Failed to save room persistence:', error);
  }
}

module.exports = { DATA_DIR, SAVE_FILE, loadRooms, saveRooms };
