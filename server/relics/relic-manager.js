const {EXPEDITION_RELICS,getRelic}=require('../../shared/expedition-relics');
const {weightedPick}=require('../expedition/danger-system');
const {weightForItem}=require('../builds/build-affinity');
const {persist}=require('../room/room-manager');
function rarityBase(rarity,kind){if(kind==='boss')return rarity==='rare'?28:rarity==='uncommon'?44:28;if(kind==='elite')return rarity==='rare'?16:rarity==='uncommon'?44:40;return rarity==='rare'?8:rarity==='uncommon'?34:58;}
function choicesForPlayer(player,kind='elite',count=3){
  player.relics=Array.isArray(player.relics)?player.relics:[];const owned=new Set([...player.relics,...(player.soldRelics||[])]),pool=EXPEDITION_RELICS.filter(r=>!owned.has(r.id)),out=[];
  while(out.length<count&&pool.length){const pick=weightedPick(pool.map(r=>({value:r,weight:rarityBase(r.rarity,kind)*weightForItem(player,r,1)})));if(!pick)break;out.push(pick);pool.splice(pool.findIndex(r=>r.id===pick.id),1);}
  return out;
}
function createRelicChoices(room,kind){room.relicChoices={};for(const p of room.players.filter(p=>p.connected&&p.hp>0))room.relicChoices[p.id]=choicesForPlayer(p,kind,3).map(r=>r.id);return room.relicChoices;}
function pendingRelicChoices(room){const choices=room.relicChoices||{};return room.players.some(p=>p.connected&&Array.isArray(choices[p.id])&&choices[p.id].length>0);}
function chooseRelic(room,player,relicId){const list=room.relicChoices?.[player.id];if(!Array.isArray(list)||!list.includes(relicId))throw new Error('這個遺物不在目前候選中。');const relic=getRelic(relicId);if(!relic)throw new Error('找不到遺物。');player.relics=Array.isArray(player.relics)?player.relics:[];if(!player.relics.includes(relic.id))player.relics.push(relic.id);room.relicChoices[player.id]=[];persist();return relic;}
module.exports={choicesForPlayer,createRelicChoices,pendingRelicChoices,chooseRelic};
