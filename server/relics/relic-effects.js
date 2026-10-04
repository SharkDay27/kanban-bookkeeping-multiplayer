const {getRelic}=require('../../shared/expedition-relics');
function relicsOf(player){return (player?.relics||[]).map(getRelic).filter(Boolean);}
function hasRelic(player,id){return (player?.relics||[]).includes(id);}
function effectSum(player,key){return relicsOf(player).reduce((n,r)=>n+Number(r.effects?.[key]||0),0);}
function effectProduct(player,key,base=1){return relicsOf(player).reduce((n,r)=>n*Number(r.effects?.[key]??1),base);}
function damageMultiplier(player,{action,target,part,room}={}){
  let mult=1;for(const relic of relicsOf(player)){const e=relic.effects||{},type=action?.damageType;
    if(type&&e.damageTypeBonus?.[type]){const weak=Number(target?.resistances?.[type]??1)>1.15;if(!e.weaknessOnly||weak)mult*=1+e.damageTypeBonus[type];}
    if(part&&e.partBonus)mult*=1+e.partBonus;
    if(Number(target?.shield||0)>0&&e.shieldBreakBonus)mult*=1+e.shieldBreakBonus;
    if(String(action?.kind||'').includes('aoe')&&e.aoeDamageBonus)mult*=1+e.aoeDamageBonus;
    if(player?.temporaryShield>0&&e.shieldedDamageBonus)mult*=1+e.shieldedDamageBonus;
    if((target?.statuses||[]).some(s=>s.id==='marked')&&e.markedDamageBonus)mult*=1+e.markedDamageBonus;
    if((target?.statuses||[]).length&&e.debuffDamageBonus)mult*=1+e.debuffDamageBonus;
    const hpRatio=Number(player?.hp||0)/Math.max(1,Number(player?.maxHp||100));if(e.lowHpDamageBonus&&hpRatio<=.5)mult*=1+e.lowHpDamageBonus*(1-hpRatio)/.5;if(e.criticalHpDamageBonus&&hpRatio<=.3)mult*=1+e.criticalHpDamageBonus;
    const danger=Number(room?.exploration?.danger||0);if(e.dangerDamagePerPoint)mult*=1+danger*e.dangerDamagePerPoint;
    const weak=type&&Number(target?.resistances?.[type]??1)>1.15;if(weak&&danger>=5&&e.highDangerWeaknessBonus)mult*=1+e.highDangerWeaknessBonus;
    if(weak&&(target?.statuses||[]).some(s=>s.id==='marked')&&e.markedWeaknessBonus)mult*=1+e.markedWeaknessBonus;
  }
  if((target?.statuses||[]).some(s=>s.id==='marked')&&room?.players?.some(p=>hasRelic(p,'relic-command-chain')))mult*=1.10;
  return mult;
}
function combatStartShield(player){return Math.round(effectSum(player,'combatStartShield'));}
function healingMultiplier(player){return effectProduct(player,'healingMult',1);}
function consumablePowerMultiplier(player){return 1+effectSum(player,'consumablePower');}
function consumableDiscount(player){return Math.max(0,Math.min(.45,effectSum(player,'consumableDiscount')));}
function goldMultiplier(player,room){let mult=effectProduct(player,'goldMult',1);if(Number(room?.exploration?.danger||0)>=5)mult*=effectProduct(player,'highDangerGoldMult',1);return mult;}
function lootBonus(player){return effectSum(player,'lootBonus');}
function cooldownReduction(player){return Math.round(effectSum(player,'firstSkillCooldownReduction'));}
function debuffDurationBonus(player){return Math.round(effectSum(player,'debuffDurationBonus'));}
function bleedChanceOnSlash(player){return Math.max(0,Math.min(.9,effectSum(player,'onSlashBleedChance')));}
function bleedCooldownChance(player){return Math.max(0,Math.min(.9,effectSum(player,'bleedCooldownChance')));}
function cooldownOnKill(player,minion=false){return Math.round(effectSum(player,minion?'cooldownOnMinionKill':'cooldownOnKill')+effectSum(player,'cooldownOnKill'));}
function cooldownOnBlock(player){return Math.round(effectSum(player,'cooldownOnBlock'));}
function shieldOnPartBreak(player){return Math.round(effectSum(player,'shieldOnPartBreak'));}
function incomingMultiplier(player,enemy){if((enemy?.statuses||[]).length&&hasRelic(player,'relic-static-cage'))return .90;return 1;}
function consumableRefund(player){const chance=Math.max(0,Math.min(.95,effectSum(player,'consumableRefundChance'))),gold=Math.round(effectSum(player,'consumableRefundGold'));return {chance,gold};}
function extraGoldFromLostHp(player,lostHp){return Math.max(0,Math.round(Number(lostHp||0)*effectSum(player,'goldPerLostHp')));}
module.exports={relicsOf,hasRelic,effectSum,effectProduct,damageMultiplier,combatStartShield,healingMultiplier,consumablePowerMultiplier,consumableDiscount,goldMultiplier,lootBonus,cooldownReduction,debuffDurationBonus,bleedChanceOnSlash,bleedCooldownChance,cooldownOnKill,cooldownOnBlock,shieldOnPartBreak,incomingMultiplier,consumableRefund,extraGoldFromLostHp};
