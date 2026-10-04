const {SINNERS,STATUS_EFFECTS,getStatus}=require('../../shared/game-data');
const {equipmentStats}=require('../equipment/equipment-stats');

function sinnerOf(player){return SINNERS.find(s=>s.id===player.sinnerId);}
function statusMods(player){
  const mods={combat:0,observe:0,mobility:0,stability:0};
  for(const active of player.statuses||[]){const def=getStatus(active.id);if(!def?.mods)continue;for(const key of Object.keys(mods))mods[key]+=Number(def.mods[key]||0);}
  return mods;
}
function statFor(player,key){const sinner=sinnerOf(player);return Number(sinner?.stats?.[key]||0)+Number(equipmentStats(player)[key]||0)+Number(statusMods(player)[key]||0);}
function addStatus(player,statusId,duration){const def=getStatus(statusId);if(!def)return false;if(!Array.isArray(player.statuses))player.statuses=[];const existing=player.statuses.find(s=>s.id===statusId);if(existing)existing.remaining=Math.max(existing.remaining,duration||def.duration||1);else player.statuses.push({id:statusId,remaining:duration||def.duration||1});return true;}
function removeStatus(player,statusId){player.statuses=(player.statuses||[]).filter(s=>s.id!==statusId);}
function damageTakenMultiplier(player){let mult=1;for(const active of player.statuses||[]){const def=getStatus(active.id);if(def?.damageTakenMultiplier)mult*=Number(def.damageTakenMultiplier);}return mult;}
function healingMultiplier(player){let mult=1;for(const active of player.statuses||[]){const def=getStatus(active.id);if(def?.healingMultiplier)mult*=Number(def.healingMultiplier);}return mult;}
function dangerShield(player){return (player.statuses||[]).reduce((sum,active)=>sum+Number(getStatus(active.id)?.dangerShield||0),0);}
function playerLootBonus(player){return (player.statuses||[]).reduce((sum,active)=>sum+Number(getStatus(active.id)?.lootBonus||0),0);}
function applyDamageToPlayer(player,rawDamage,extraMultiplier=1){let remaining=Math.max(0,Math.round(Number(rawDamage||0)*damageTakenMultiplier(player)*extraMultiplier));if(player.temporaryShield>0){const absorbed=Math.min(player.temporaryShield,remaining);player.temporaryShield-=absorbed;remaining-=absorbed;}if(remaining>0)player.hp=Math.max(0,player.hp-remaining);return remaining;}
function healPlayer(player,rawAmount){const amount=Math.max(0,Math.round(Number(rawAmount||0)*healingMultiplier(player))),before=player.hp;player.hp=Math.min(player.maxHp,player.hp+amount);return player.hp-before;}
function tickStatuses(players,{combatRound=false}={}){for(const player of players){let tickDamage=0;for(const active of player.statuses||[]){const def=getStatus(active.id);if(combatRound&&def?.tickDamage)tickDamage+=Number(def.tickDamage||0);active.remaining-=1;}if(tickDamage)applyDamageToPlayer(player,tickDamage);player.statuses=(player.statuses||[]).filter(s=>s.remaining>0);}}
function statusName(id){return getStatus(id)?.name||id;}
function randomStatus(type){const pool=STATUS_EFFECTS.filter(s=>s.type===type);return pool[Math.floor(Math.random()*pool.length)];}
module.exports={sinnerOf,equipmentStats,statusMods,statFor,addStatus,removeStatus,damageTakenMultiplier,healingMultiplier,dangerShield,playerLootBonus,applyDamageToPlayer,healPlayer,tickStatuses,statusName,randomStatus};
