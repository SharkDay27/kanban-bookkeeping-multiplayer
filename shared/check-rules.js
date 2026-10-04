(function(root,factory){const rules=factory();if(typeof module==='object'&&module.exports)module.exports=rules;else root.KBMCheckRules=rules;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function eventDc(difficulty,danger,chapter){const adjustment=[-2,0,2][Math.max(0,Math.min(2,Number(chapter)||0))];return Math.max(8,Math.min(18,Math.round(10+Number(difficulty||0)*.6+Number(danger||0)*.3+adjustment)));}
  function combatModifier(stat){return Math.round(Number(stat||0)) + 3;}
  function combatDefense(target,action,relics){const needle=(relics||[]).includes('relic-needle-eye')&&action?.damageType==='pierce'?1:0;return Math.max(5,Number(target?.defense||10)-Number(action?.ignoreDefense||0)-needle-Number(target?.defensePenalty||0));}
  function chance(mod,dc){let hits=0;for(let die=1;die<=20;die++)if(die===20||die+mod>=dc)hits++;return hits*5;}
  function attackDc(stat,target,action,relics){return Math.min(combatDefense(target,action,relics),combatModifier(stat)+8);}
  return {eventDc,combatModifier,combatDefense,attackDc,chance};
});
