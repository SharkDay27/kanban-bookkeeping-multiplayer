const BUILD_TAGS={
  bleed:{id:'bleed',name:'流血',description:'持續傷害、斬擊與流血疊層。'},
  shield:{id:'shield',name:'護盾',description:'取得護盾、減傷與反擊。'},
  break:{id:'break',name:'部位破壞',description:'集中破壞精英／Boss 部位並中斷攻擊。'},
  weakness:{id:'weakness',name:'弱點獵殺',description:'針對斬／鈍／突弱點切換攻擊。'},
  mark:{id:'mark',name:'標記集火',description:'標記目標後由全隊集中輸出。'},
  control:{id:'control',name:'異常控制',description:'動搖、遲滯、虛弱、污染等負面狀態。'},
  lowhp:{id:'lowhp',name:'低血狂戰',description:'維持低 HP 換取更高輸出或回復。'},
  danger:{id:'danger',name:'危險賭徒',description:'高危險度下取得更高收益與戰鬥加成。'},
  cooldown:{id:'cooldown',name:'技能循環',description:'縮短冷卻並頻繁使用技能。'},
  economy:{id:'economy',name:'金幣經濟',description:'增加金幣收益、商店效率與購買力。'},
  consumable:{id:'consumable',name:'消耗品',description:'強化道具、補給與使用次數。'},
  aoe:{id:'aoe',name:'群體清場',description:'範圍傷害、召喚物處理與連鎖擊殺。'}
};

function uniq(list){return [...new Set((list||[]).filter(Boolean))];}
function inferTags(item){
  if(!item)return[];if(Array.isArray(item.buildTags))return uniq(item.buildTags);
  const tags=[],text=`${item.name||''} ${item.description||''} ${item.kind||''}`;
  if(item.attackTypes?.length>1||item.damageType)tags.push('weakness');
  if(item.partBonus||item.breakBonus||/部位|破壞|護甲/.test(text))tags.push('break');
  if(item.shield||item.kind==='guard'||/護盾|防護|反擊/.test(text))tags.push('shield');
  if(item.statusId==='bleeding'||/流血|出血/.test(text))tags.push('bleed');
  if(item.statusId==='marked'||/標記/.test(text))tags.push('mark');
  if(item.statusId||item.attackDown||item.enemyDamageMult||/動搖|遲滯|虛弱|污染|控制/.test(text))tags.push('control');
  if(item.lowHpScale||/低 HP|低血|瀕危/.test(text))tags.push('lowhp');
  if(item.dangerScale||/危險度/.test(text))tags.push('danger');
  if(item.cooldownReduction||/冷卻/.test(text))tags.push('cooldown');
  if(item.goldMult||/金幣|商店|折扣/.test(text))tags.push('economy');
  if(item.kind==='heal'||item.kind==='cleanse'||/消耗品|道具|補給/.test(text))tags.push('consumable');
  if(String(item.kind||'').includes('aoe')||/全體|所有敵人|召喚物/.test(text))tags.push('aoe');
  return uniq(tags);
}
function buildScoreFromPlayer(player,{skills=[],relics=[]}={}){
  const score={};const add=(tags,w=1)=>{for(const tag of uniq(tags))score[tag]=(score[tag]||0)+w;};
  add(inferTags(player?.equipment?.weapon),1.4);add(inferTags(player?.equipment?.armor),1);add(inferTags(player?.equipment?.accessory),1);
  for(const id of player?.learnedSkills||[])add(inferTags(skills.find(s=>s.id===id)),1.15);
  for(const id of player?.relics||[])add(inferTags(relics.find(r=>r.id===id)),1.35);
  return score;
}
function affinityMultiplier(item,score={},strength=.045,maxBonus=.20){
  const tags=inferTags(item);if(!tags.length)return 1;const points=tags.reduce((n,t)=>n+Number(score[t]||0),0)/tags.length;return 1+Math.min(maxBonus,points*strength);
}
function topBuildTags(score={},limit=3){return Object.entries(score).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([id,value])=>({...(BUILD_TAGS[id]||{id,name:id}),value}));}
module.exports={BUILD_TAGS,inferTags,buildScoreFromPlayer,affinityMultiplier,topBuildTags};
