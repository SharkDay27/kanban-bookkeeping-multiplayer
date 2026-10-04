const {combatGoldReward}=require('../economy');
const {primeFogAfterResolution}=require('../expedition/route-generator');

function currentNode(room){return room.exploration.route[room.exploration.position];}
function markCurrentNodeResolved(room){const node=currentNode(room);if(node)node.resolved=true;}
function finishVictory(room){
  const combat=room.combat,gold=combatGoldReward(room,combat.kind);for(const player of room.players)player.gold=(player.gold||0)+gold;
  room.eventResult={degree:combat.kind==='boss'?'boss-victory':'combat-victory',text:`戰鬥勝利。每位隊員獲得 ${gold} 金幣。`,gold};
  markCurrentNodeResolved(room);primeFogAfterResolution(room);
  if(combat.kind==='boss'){if(room.areaIndex<room.selectedAreas.length-1)room.eventResult.nextAreaAvailable=true;else room.phase='victory';}
  return room.eventResult;
}
module.exports={currentNode,markCurrentNodeResolved,finishVictory};
