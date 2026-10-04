const ECONOMY={
  combatGold:{combat:22,elite:44,boss:78},
  combatGoldVariance:{combat:8,elite:12,boss:18},
  eventGold:{critical:[22,34],success:[14,24],mixed:[8,15]},
  eventGoldChance:{critical:.9,success:.62,mixed:.28},
  chapterGoldBonus:{combat:5,elite:9,boss:16},
  eventChapterBonus:4,
  dangerGoldBonusPerPoint:2,
  maxLearnedSkills:3
};
function combatGoldBase(kind){return ECONOMY.combatGold[kind]??ECONOMY.combatGold.combat;}
function eventGoldRange(degree){return ECONOMY.eventGold[degree]||null;}
function combatGoldReward(room,kind){const base=combatGoldBase(kind),variance=ECONOMY.combatGoldVariance[kind]??8,chapter=Number(room.areaIndex||0),danger=Number(room.exploration?.danger||0);return Math.round(base+chapter*(ECONOMY.chapterGoldBonus[kind]??5)+danger*ECONOMY.dangerGoldBonusPerPoint+Math.floor(Math.random()*(variance+1)));}
module.exports={ECONOMY,combatGoldBase,eventGoldRange,combatGoldReward};
