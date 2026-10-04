const {getSinnerSkill}=require('../../shared/sinner-skills');
const {upgradeOptionsFor}=require('../../shared/skill-upgrades');
const {persist}=require('../room/room-manager');
function upgradeSkill(room,player,skillId,upgradeId){
  if(room.combat&&!room.combat.ended)throw new Error('戰鬥中不能升級技能。');
  if(!(player.learnedSkills||[]).includes(skillId))throw new Error('必須先學會這個技能。');
  const skill=getSinnerSkill(skillId);if(!skill||skill.sinnerId!==player.sinnerId)throw new Error('技能資料不正確。');
  player.skillUpgrades=player.skillUpgrades&&typeof player.skillUpgrades==='object'?player.skillUpgrades:{};
  if(player.skillUpgrades[skillId])throw new Error('這個技能已經選過升級分支。');
  const option=upgradeOptionsFor(skill).find(x=>x.id===upgradeId);if(!option)throw new Error('找不到這個升級分支。');
  if(Number(player.gold||0)<Number(option.cost||0))throw new Error(`金幣不足，需要 ${option.cost}。`);
  player.gold-=Number(option.cost||0);player.skillUpgrades[skillId]=option.id;persist();return option;
}
function sanitizeSkillUpgrades(player){const learned=new Set(player.learnedSkills||[]),out={};for(const [skillId,upgradeId] of Object.entries(player.skillUpgrades||{})){if(!learned.has(skillId))continue;const skill=getSinnerSkill(skillId),ok=upgradeOptionsFor(skill).some(x=>x.id===upgradeId);if(ok)out[skillId]=upgradeId;}player.skillUpgrades=out;return out;}
module.exports={upgradeSkill,sanitizeSkillUpgrades};
