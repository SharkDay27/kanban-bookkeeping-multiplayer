const {SINNER_SKILLS}=require('../../shared/sinner-skills');
const {EXPEDITION_RELICS}=require('../../shared/expedition-relics');
const {buildScoreFromPlayer,affinityMultiplier,topBuildTags}=require('../../shared/build-tags');
function scoreForPlayer(player){return buildScoreFromPlayer(player,{skills:SINNER_SKILLS,relics:EXPEDITION_RELICS});}
function weightForItem(player,item,baseWeight=1){return Number(baseWeight||1)*affinityMultiplier(item,scoreForPlayer(player));}
function profileForPlayer(player){const score=scoreForPlayer(player);return {score,top:topBuildTags(score,3)};}
module.exports={scoreForPlayer,weightForItem,profileForPlayer};
