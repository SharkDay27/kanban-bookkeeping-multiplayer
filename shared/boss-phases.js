function phasesForBoss(boss){return Array.isArray(boss?.phases)?boss.phases:[];}
function phaseForHp(boss,currentHp,maxHp){
  const phases=phasesForBoss(boss);if(!phases.length)return null;
  const ratio=Math.max(0,Math.min(1,Number(currentHp||0)/Math.max(1,Number(maxHp||1))));
  return [...phases].sort((a,b)=>Number(a.at)-Number(b.at)).find(phase=>ratio<=Number(phase.at))||phases[0];
}
function phaseIndexForHp(boss,currentHp,maxHp){const phase=phaseForHp(boss,currentHp,maxHp);return phase?phasesForBoss(boss).indexOf(phase):-1;}
module.exports={phasesForBoss,phaseForHp,phaseIndexForHp};
