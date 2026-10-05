const {SINNERS,STATUS_EFFECTS,getStatus}=require('../../shared/game-data');
const {equipmentStats}=require('../equipment/equipment-stats');
const {activeDefinitions,multiplyHook,sumHook,tickDamageFor}=require('./status-hooks');
const {healingMultiplier:relicHealingMultiplier,lootBonus:relicLootBonus}=require('../relics/relic-effects');

function sinnerOf(player){return SINNERS.find(s=>s.id===player.sinnerId);}
function statusMods(player){return require('./battle-status').mods(player);}
function statFor(player,key){const sinner=sinnerOf(player);return Number(sinner?.stats?.[key]||0)+Number(equipmentStats(player)[key]||0)+Number(statusMods(player)[key]||0);}
function addStatus(player,statusId,duration,stacks=1){const ok=require('./battle-status').add(player,statusId,duration||getStatus(statusId)?.duration||2,stacks);if(ok&&statusId==='shield')require('./battle-status').grantShield(player,4*stacks);return ok;}
function removeStatus(player,statusId){player.statuses=(player.statuses||[]).filter(s=>s.id!==statusId);}
function damageTakenMultiplier(player){return multiplyHook(player,'damageTakenMultiplier',1)*require('./battle-status').vulnerability(player);}
function healingMultiplier(player){return multiplyHook(player,'healingMultiplier',1)*relicHealingMultiplier(player);}
function dangerShield(player){return sumHook(player,'dangerShield');}
function playerLootBonus(player){return sumHook(player,'lootBonus')+relicLootBonus(player);}
function applyDamageToPlayer(player,rawDamage,extraMultiplier=1){let remaining=Math.max(0,Math.round(Number(rawDamage||0)*damageTakenMultiplier(player)*extraMultiplier));if(player.temporaryShield>0){const absorbed=Math.min(player.temporaryShield,remaining);player.temporaryShield-=absorbed;remaining-=absorbed;}if(remaining>0)player.hp=Math.max(0,player.hp-remaining);return remaining;}
function healPlayer(player,rawAmount){if(player.hp<=0)return 0;const amount=Math.max(0,Math.round(Number(rawAmount||0)*healingMultiplier(player))),before=player.hp;player.hp=Math.min(player.maxHp,player.hp+amount);return player.hp-before;}
function tickStatuses(players,{combatRound=false}={}){for(const p of players){if(combatRound)require('./battle-status').tick(p);else {for(const s of p.statuses||[])if(s.id!=='imprint')s.remaining--;p.statuses=(p.statuses||[]).filter(s=>s.remaining>0);}}}
function statusName(id){return getStatus(id)?.name||id;}
function randomStatus(type){const pool=STATUS_EFFECTS.filter(s=>s.type===type&&s.id!=='imprint');return pool[Math.floor(Math.random()*pool.length)];}
module.exports={sinnerOf,equipmentStats,statusMods,statFor,addStatus,removeStatus,damageTakenMultiplier,healingMultiplier,dangerShield,playerLootBonus,applyDamageToPlayer,healPlayer,tickStatuses,statusName,randomStatus};
