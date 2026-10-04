const {grantCard}=require('../cards/card-manager');
const {COLLECTIBLE}=require('../../shared/cards');
const {combatGoldReward}=require('../economy');
const {primeFogAfterResolution}=require('../expedition/route-generator');
const {goldMultiplier,extraGoldFromLostHp}=require('../relics/relic-effects');
const {createRelicChoices,choicesForPlayer}=require('../relics/relic-manager');
const {EQUIPMENT}=require('../../shared/game-data');
const {pickReward}=require('../expedition/danger-system');
const {addEquipment}=require('../equipment/equipment-manager');

function currentNode(room){return room.exploration.route[room.exploration.position];}
function markCurrentNodeResolved(room){const node=currentNode(room);if(node)node.resolved=true;}
function finishVictory(room){
  const combat=room.combat,baseGold=combatGoldReward(room,combat.kind),goldByPlayer={};
  for(const player of room.players){const lost=Math.max(0,Number(combat.playerStartHp?.[player.id]||player.hp)-Number(player.hp||0)),gain=Math.max(0,Math.round(baseGold*goldMultiplier(player,room))+extraGoldFromLostHp(player,lost));player.gold=(player.gold||0)+gain;goldByPlayer[player.id]=gain;}
  room.eventResult={degree:combat.kind==='boss'?'boss-victory':'combat-victory',text:`戰鬥勝利。隊伍取得戰鬥金幣。`,gold:baseGold,goldByPlayer};
  markCurrentNodeResolved(room);primeFogAfterResolution(room);
  const hasNextArea=room.areaIndex<room.selectedAreas.length-1;
  room.relicChoices={};room.eventResult.lootByPlayer={};room.eventResult.cardLootByPlayer={};
  for(const player of room.players.filter(p=>p.connected&&p.hp>0)){
    const relicChance=combat.kind==='combat'?.18:1;
    if(Math.random()<relicChance && !(combat.kind==='boss'&&!hasNextArea)){
      const choices=choicesForPlayer(player,combat.kind,3).map(r=>r.id);
      if(choices.length){room.relicChoices[player.id]=choices;room.eventResult.relicReward=true;room.eventResult.lootByPlayer[player.id]={type:'relic-choice'};continue;}
    }
    const equipmentChance=combat.kind==='combat'?.55:1;
    if(Math.random()<equipmentChance){const item=addEquipment(player,pickReward(EQUIPMENT,room.exploration.danger,player,room.areaIndex));room.eventResult.lootByPlayer[player.id]={type:'equipment',item};}
  }

  require('../cards/card-rewards').createChoices(room);
  if(combat.kind==='boss'){if(hasNextArea)room.eventResult.nextAreaAvailable=true;else room.phase='victory';}
  return room.eventResult;
}
module.exports={currentNode,markCurrentNodeResolved,finishVictory};
