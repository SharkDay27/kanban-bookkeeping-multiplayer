const {phaseForHp,phaseIndexForHp}=require('../../shared/boss-phases');

function currentBossPhase(enemy){
  if(!enemy||!Array.isArray(enemy.phases)||!enemy.phases.length)return null;
  return phaseForHp(enemy,enemy.currentHp,enemy.maxHp);
}
function syncBossPhase(enemy){
  const phase=currentBossPhase(enemy);if(!phase)return {changed:false,phase:null};
  const index=phaseIndexForHp(enemy,enemy.currentHp,enemy.maxHp),changed=enemy.phaseIndex!==undefined&&enemy.phaseIndex!==index;
  enemy.phaseIndex=index;enemy.phaseLabel=phase.label||`PHASE ${index+1}`;enemy.skills=Array.isArray(phase.skills)?phase.skills:enemy.skills||[];
  return {changed,phase,index,label:enemy.phaseLabel};
}
function syncCombatBossPhases(combat){
  const transitions=[];
  for(const enemy of combat?.enemies||[]){if(enemy.role!=='boss')continue;const result=syncBossPhase(enemy);if(result.changed)transitions.push({enemyId:enemy.instanceId,...result});}
  return transitions;
}
module.exports={currentBossPhase,syncBossPhase,syncCombatBossPhases};
