const {SINNER_SKILLS}=require('../../shared/sinner-skills');
const {EXPEDITION_RELICS}=require('../../shared/expedition-relics');
const {inferTags,affinityMultiplier,topBuildTags}=require('../../shared/build-tags');
const {applyUpgrade}=require('../../shared/skill-upgrades');
function scoreForPlayer(player){
  const score={};const add=(tags,w=1)=>{for(const tag of [...new Set(tags||[])])score[tag]=(score[tag]||0)+w;};
  add(inferTags(player?.equipment?.weapon),1.4);add(inferTags(player?.equipment?.armor),1);add(inferTags(player?.equipment?.accessory),1);
  for(const id of player?.learnedSkills||[]){const base=SINNER_SKILLS.find(s=>s.id===id);if(base)add(inferTags(applyUpgrade(base,player?.skillUpgrades?.[id])),1.15);}
  for(const id of player?.relics||[]){const relic=EXPEDITION_RELICS.find(r=>r.id===id);if(relic)add(inferTags(relic),1.35);}
  return score;
}
function weightForItem(player,item,baseWeight=1){return Number(baseWeight||1)*affinityMultiplier(item,scoreForPlayer(player));}
function profileForPlayer(player){const score=scoreForPlayer(player);return {score,top:topBuildTags(score,3)};}
module.exports={scoreForPlayer,weightForItem,profileForPlayer};
