const {skillsForSinner,getSinnerSkill}=require('../../shared/sinner-skills');
const {persist}=require('../room/room-manager');
const {ECONOMY}=require('../economy');

function availableSkills(player){return skillsForSinner(player.sinnerId);}
function learnSkill(room,player,skillId){
  if(!player.sinnerId)throw new Error('請先選擇罪人。');
  if(room.combat&&!room.combat.ended)throw new Error('戰鬥中不能學習技能。');
  const skill=getSinnerSkill(skillId);if(!skill||skill.sinnerId!==player.sinnerId)throw new Error('這不是目前罪人的技能。');
  player.learnedSkills=Array.isArray(player.learnedSkills)?player.learnedSkills:[];
  if(player.learnedSkills.includes(skill.id))throw new Error('已經學會這個技能。');
  if(player.learnedSkills.length>=ECONOMY.maxLearnedSkills)throw new Error(`每名罪人最多只能學習 ${ECONOMY.maxLearnedSkills} 個技能。`);
  if(player.gold<skill.cost)throw new Error(`金幣不足，需要 ${skill.cost}。`);
  player.gold-=skill.cost;player.learnedSkills.push(skill.id);persist();return skill;
}
function sanitizeLearnedSkills(player){const valid=new Set(skillsForSinner(player.sinnerId).map(s=>s.id));player.learnedSkills=(Array.isArray(player.learnedSkills)?player.learnedSkills:[]).filter((id,i,a)=>valid.has(id)&&a.indexOf(id)===i).slice(0,ECONOMY.maxLearnedSkills);return player.learnedSkills;}
module.exports={availableSkills,learnSkill,sanitizeLearnedSkills};
