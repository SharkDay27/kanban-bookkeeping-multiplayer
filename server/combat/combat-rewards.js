const {combatGoldReward}=require('../economy');
const {primeFogAfterResolution}=require('../expedition/route-generator');
const {goldMultiplier,extraGoldFromLostHp}=require('../relics/relic-effects');
const {createRelicChoices}=require('../relics/relic-manager');

function currentNode(room){return room.exploration.route[room.exploration.position];}
function markCurrentNodeResolved(room){const node=currentNode(room);if(node)node.resolved=true;}
function finishVictory(room){
  const combat=room.combat,baseGold=combatGoldReward(room,combat.kind),goldByPlayer={};
  for(const player of room.players){const lost=Math.max(0,Number(combat.playerStartHp?.[player.id]||player.hp)-Number(player.hp||0)),gain=Math.max(0,Math.round(baseGold*goldMultiplier(player,room))+extraGoldFromLostHp(player,lost));player.gold=(player.gold||0)+gain;goldByPlayer[player.id]=gain;}
  room.eventResult={degree:combat.kind==='boss'?'boss-victory':'combat-victory',text:`戰鬥勝利。隊伍取得戰鬥金幣。`,gold:baseGold,goldByPlayer};
  markCurrentNodeResolved(room);primeFogAfterResolution(room);
  const hasNextArea=room.areaIndex<room.selectedAreas.length-1;
  if(combat.kind==='elite'||(combat.kind==='boss'&&hasNextArea)){createRelicChoices(room,combat.kind);room.eventResult.relicReward=true;}
  if(combat.kind==='boss'){if(hasNextArea)room.eventResult.nextAreaAvailable=true;else room.phase='victory';}
  return room.eventResult;
}
module.exports={currentNode,markCurrentNodeResolved,finishVictory};
