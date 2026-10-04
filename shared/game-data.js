const { AREAS } = require('./areas');
const { SINNERS } = require('./sinners');
const { EVENTS } = require('./events');
const { NORMAL_ENEMIES } = require('./normal-enemies');
const { ELITE_ENEMIES } = require('./elite-enemies');
const { BOSSES } = require('./bosses');
const { SUPPLIES } = require('./supplies');
const { REST_NODES } = require('./rest');
const { EQUIPMENT, STARTER_WEAPONS, starterWeaponFor } = require('./equipment');
const { DAMAGE_TYPE_LABELS, WEAK, RESIST, NEUTRAL, profileForEnemy, multiplier, relation } = require('./damage-types');
const { CONSUMABLES } = require('./consumables');
const { STATUS_EFFECTS, getStatus } = require('./status-effects');
const { SHOP_RULES, SHOP_PRICE_BASE, shopBasePrice } = require('./shop');
const { SINNER_SKILLS, skillsForSinner, getSinnerSkill } = require('./sinner-skills');
const { applySkillTuning } = require('./sinner-skill-tuning');
const { EXPEDITION_RELICS, getRelic } = require('./expedition-relics');
const { BUILD_TAGS, inferTags, buildScoreFromPlayer, affinityMultiplier, topBuildTags } = require('./build-tags');
const { upgradeOptionsFor, applyUpgrade } = require('./skill-upgrades');
applySkillTuning(SINNER_SKILLS);

module.exports = {
  AREAS,SINNERS,EVENTS,NORMAL_ENEMIES,ELITE_ENEMIES,BOSSES,SUPPLIES,REST_NODES,
  EQUIPMENT,STARTER_WEAPONS,starterWeaponFor,
  DAMAGE_TYPE_LABELS,WEAK,RESIST,NEUTRAL,profileForEnemy,multiplier,relation,
  CONSUMABLES,STATUS_EFFECTS,getStatus,SHOP_RULES,SHOP_PRICE_BASE,shopBasePrice,
  SINNER_SKILLS,skillsForSinner,getSinnerSkill,
  EXPEDITION_RELICS,getRelic,BUILD_TAGS,inferTags,buildScoreFromPlayer,affinityMultiplier,topBuildTags,
  upgradeOptionsFor,applyUpgrade
};
