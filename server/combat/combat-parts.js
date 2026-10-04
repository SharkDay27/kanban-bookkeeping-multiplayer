function makeParts(enemy,kind){
  if(!['elite','boss'].includes(kind))return [];
  const defs=kind==='boss'
    ?[['核心',.28,'破壞後降低敵人攻擊'],['攻擊部位',.22,'可阻擋蓄力攻擊'],['外殼',.25,'破壞後降低防禦']]
    :[['攻擊部位',.24,'可阻擋特定攻擊'],['護甲',.2,'破壞後降低防禦']];
  return defs.map((d,i)=>({id:`${enemy.instanceId}-part-${i}`,name:d[0],maxHp:Math.max(10,Math.round(enemy.maxHp*d[1])),currentHp:Math.max(10,Math.round(enemy.maxHp*d[1])),destroyed:false,effect:d[2]}));
}
function findPart(target,partId){return target?.parts?.find(p=>p.id===partId&&!p.destroyed)||null;}
function applyPartDamage(combat,target,part,dealt){
  if(!part||part.destroyed)return {destroyed:false,mainDamage:0};
  const wasAlive=part.currentHp>0;
  part.currentHp=Math.max(0,part.currentHp-dealt);
  if(combat.blockChallenge?.partId===part.id)combat.blockChallenge.currentDamage+=dealt;
  const destroyed=wasAlive&&part.currentHp<=0;
  if(destroyed){
    part.destroyed=true;
    if(part.name==='外殼'||part.name==='護甲')target.defensePenalty=Math.min(8,(target.defensePenalty||0)+2);
    if(part.name==='核心')target.attackMultiplier=Math.max(.6,(target.attackMultiplier||1)*.82);
  }
  const mainDamage=Math.round(dealt*.55);target.currentHp=Math.max(0,target.currentHp-mainDamage);
  return {destroyed,mainDamage};
}
module.exports={makeParts,findPart,applyPartDamage};
