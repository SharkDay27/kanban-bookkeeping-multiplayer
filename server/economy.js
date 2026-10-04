const ECONOMY={
  combatGold:{combat:22,elite:44,boss:78},
  eventGold:{critical:[22,34],success:[14,24],mixed:[8,15]},
  chapterGoldBonus:{combat:5,elite:9,boss:16},
  dangerGoldBonusPerPoint:2,
  maxLearnedSkills:3
};
function combatGoldBase(kind){return ECONOMY.combatGold[kind]??ECONOMY.combatGold.combat;}
function eventGoldRange(degree){return ECONOMY.eventGold[degree]||null;}
module.exports={ECONOMY,combatGoldBase,eventGoldRange};
