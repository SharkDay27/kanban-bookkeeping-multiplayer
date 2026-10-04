const {getSinnerSkill}=require('./sinner-skills');
const COST_BASE=45;
function branch(id,name,description,mods,cost=COST_BASE){return {id,name,description,mods,cost};}
function upgradeOptionsFor(skillOrId){
  const s=typeof skillOrId==='string'?getSinnerSkill(skillOrId):skillOrId;if(!s)return[];
  const power=Number(s.power||0),kind=String(s.kind||''),type=s.damageType;
  if(kind==='heal')return [
    branch(`${s.id}:deep`,'深度治療','治療量提高，並額外解除 1 個負面狀態。',{healAdd:8,cleanse:true},50),
    branch(`${s.id}:wide`,'廣域處置','治療量略減，但改為全隊生效。',{team:true,healMult:.82},55)
  ];
  if(kind==='team-buff')return [
    branch(`${s.id}:long`,'持續強化','增益持續時間 +1 回合。',{buffDurationAdd:1},50),
    branch(`${s.id}:tempo`,'快速循環','技能冷卻 -1。',{cooldownReduction:1},55)
  ];
  if(type==='slash')return [
    branch(`${s.id}:power`,'斬擊深化',`威力提高${power>0?'，更適合直接爆發':''}。`,{powerMult:1.18},50),
    branch(`${s.id}:bleed`,'裂傷式','威力小幅提高，命中時施加流血。',{powerMult:1.08,statusId:'bleeding',statusDuration:2},55)
  ];
  if(type==='blunt')return [
    branch(`${s.id}:power`,'鈍擊深化','提高直接傷害。',{powerMult:1.18},50),
    branch(`${s.id}:break`,'震破式','提高部位傷害與阻擋效率。',{powerMult:1.07,partBonusAdd:.22,breakBonusAdd:4},55)
  ];
  if(type==='pierce')return [
    branch(`${s.id}:power`,'突擊深化','提高直接傷害。',{powerMult:1.18},50),
    branch(`${s.id}:core`,'貫芯式','無視更多防禦，對部位額外增傷。',{powerMult:1.06,ignoreDefenseAdd:2,partBonusAdd:.16},55)
  ];
  return [
    branch(`${s.id}:power`,'強化式','提高技能主要效果。',{powerMult:1.16,healAdd:4,shieldAdd:4},50),
    branch(`${s.id}:tempo`,'循環式','技能冷卻 -1。',{cooldownReduction:1},55)
  ];
}
function applyUpgrade(skill,upgradeId){
  if(!skill||!upgradeId)return {...skill};const option=upgradeOptionsFor(skill).find(x=>x.id===upgradeId);if(!option)return {...skill};const m=option.mods||{},out={...skill,upgradeId,upgradeName:option.name};
  if(m.powerMult&&Number(out.power)>0)out.power=Number(out.power)*m.powerMult;
  if(m.healAdd)out.heal=Number(out.heal||0)+m.healAdd;
  if(m.healMult)out.heal=Math.max(1,Math.round(Number(out.heal||0)*m.healMult));
  if(m.shieldAdd)out.shield=Number(out.shield||0)+m.shieldAdd;
  if(m.team!==undefined)out.team=m.team;
  if(m.cleanse!==undefined)out.cleanse=m.cleanse;
  if(m.statusId)out.statusId=m.statusId;
  if(m.statusDuration)out.statusDuration=m.statusDuration;
  if(m.partBonusAdd)out.partBonus=Number(out.partBonus||0)+m.partBonusAdd;
  if(m.breakBonusAdd)out.breakBonus=Number(out.breakBonus||0)+m.breakBonusAdd;
  if(m.ignoreDefenseAdd)out.ignoreDefense=Number(out.ignoreDefense||0)+m.ignoreDefenseAdd;
  if(m.cooldownReduction)out.cooldownReduction=Number(out.cooldownReduction||0)+m.cooldownReduction;
  if(m.buffDurationAdd)out.buffDuration=Number(out.buffDuration||2)+m.buffDurationAdd;
  return out;
}
module.exports={COST_BASE,upgradeOptionsFor,applyUpgrade};
