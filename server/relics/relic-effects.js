const {getRelic}=require('../../shared/expedition-relics');
function relicsOf(player){return (player?.relics||[]).map(getRelic).filter(Boolean);}
function effectSum(player,key){return relicsOf(player).reduce((n,r)=>n+Number(r.effects?.[key]||0),0);}
function effectProduct(player,key,base=1){return relicsOf(player).reduce((n,r)=>n*Number(r.effects?.[key]??1),base);}
function damageMultiplier(player,{action,target,part,room}={}){
  let mult=1;for(const relic of relicsOf(player)){const e=relic.effects||{},type=action?.damageType;
    if(type&&e.damageTypeBonus?.[type]){const weak=Number(target?.resistances?.[type]??1)>1.15;if(!e.weaknessOnly||weak)mult*=1+e.damageTypeBonus[type];}
    if(part&&e.partBonus)mult*=1+e.partBonus;
    if(player?.temporaryShield>0&&e.shieldedDamageBonus)mult*=1+e.shieldedDamageBonus;
    if((target?.statuses||[]).some(s=>s.id==='marked')&&e.markedDamageBonus)mult*=1+e.markedDamageBonus;
    if((target?.statuses||[]).length&&e.debuffDamageBonus)mult*=1+e.debuffDamageBonus;
    const hpRatio=Number(player?.hp||0)/Math.max(1,Number(player?.maxHp||100));if(e.lowHpDamageBonus&&hpRatio<=.5)mult*=1+e.lowHpDamageBonus*(1-hpRatio)/.5;if(e.criticalHpDamageBonus&&hpRatio<=.3)mult*=1+e.criticalHpDamageBonus;
    const danger=Number(room?.exploration?.danger||0);if(e.dangerDamagePerPoint)mult*=1+danger*e.dangerDamagePerPoint;
    const weak=type&&Number(target?.resistances?.[type]??1)>1.15;if(weak&&danger>=5&&e.highDangerWeaknessBonus)mult*=1+e.highDangerWeaknessBonus;
    if(weak&&(target?.statuses||[]).some(s=>s.id==='marked')&&e.markedWeaknessBonus)mult*=1+e.markedWeaknessBonus;
  }return mult;
}
function combatStartShield(player){return Math.round(effectSum(player,'combatStartShield'));}
function healingMultiplier(player){return effectProduct(player,'healingMult',1);}
function consumablePowerMultiplier(player){return 1+effectSum(player,'consumablePower');}
function consumableDiscount(player){return Math.max(0,Math.min(.45,effectSum(player,'consumableDiscount')));}
function goldMultiplier(player,room){let mult=effectProduct(player,'goldMult',1);if(Number(room?.exploration?.danger||0)>=5)mult*=effectProduct(player,'highDangerGoldMult',1);return mult;}
function lootBonus(player){return effectSum(player,'lootBonus');}
function cooldownReduction(player){return Math.round(effectSum(player,'firstSkillCooldownReduction'));}
module.exports={relicsOf,effectSum,effectProduct,damageMultiplier,combatStartShield,healingMultiplier,consumablePowerMultiplier,consumableDiscount,goldMultiplier,lootBonus,cooldownReduction};
