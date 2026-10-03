const {
  AREAS, EVENTS, NORMAL_ENEMIES, ELITE_ENEMIES, BOSSES,
  EQUIPMENT, CONSUMABLES, STATUS_EFFECTS
}=require('../shared/game-data');
const { playerLootBonus }=require('./runtime-status');

const CHAPTER_BALANCE=[
  {enemyHp:.78,enemyAtk:.76,enemyDef:-1,eventDc:-2,eventDamage:.70,dangerGain:.65,eliteBias:-5,bossAtk:.82},
  {enemyHp:1,enemyAtk:1,enemyDef:0,eventDc:0,eventDamage:1,dangerGain:1,eliteBias:0,bossAtk:1},
  {enemyHp:1.22,enemyAtk:1.18,enemyDef:2,eventDc:2,eventDamage:1.2,dangerGain:1.15,eliteBias:7,bossAtk:1.18}
];

function balance(room){ return CHAPTER_BALANCE[Math.max(0,Math.min(2,room.areaIndex||0))]; }
function randomFrom(list){ return list[Math.floor(Math.random()*list.length)]; }
function weightedPick(entries){
  const usable=entries.filter((e)=>Number(e.weight)>0);
  const total=usable.reduce((s,e)=>s+Number(e.weight),0);
  if(!usable.length||total<=0) return entries[0]?.value;
  let roll=Math.random()*total;
  for(const entry of usable){ roll-=Number(entry.weight); if(roll<=0) return entry.value; }
  return usable[usable.length-1].value;
}
function areaOf(room){ return AREAS.find((a)=>a.id===room.areaId)||AREAS[0]; }
function rarityWeight(rarity,danger,lootBonus=0,chapter=0){
  const effective=Math.max(0,Math.min(10,Number(danger||0)+chapter*1.5));
  if(rarity==='rare') return 5+effective*7+lootBonus*100;
  if(rarity==='uncommon') return 28+effective*3;
  return Math.max(10,67-effective*6);
}
function pickReward(pool,danger,player,chapter){
  return weightedPick(pool.map((item)=>({value:item,weight:rarityWeight(item.rarity||'common',danger,playerLootBonus(player),chapter)})));
}
function chooseNextNodeType(room){
  const danger=Math.max(0,Math.min(8,room.exploration.danger));
  const chapter=room.areaIndex||0,b=balance(room);
  const safety=chapter===0?7:chapter===1?0:-4;
  return weightedPick([
    {value:'event',weight:38-danger*2.2+safety},
    {value:'combat',weight:24+danger*2+chapter*3},
    {value:'supply',weight:18-danger*.5+(chapter===0?4:0)},
    {value:'rest',weight:14-danger*.9+(chapter===0?4:chapter===1?1:0)},
    {value:'elite',weight:Math.max(2,3+danger*2.6+b.eliteBias)}
  ]);
}
function revealNode(room,index,NODE_LABELS){
  const node=room.exploration.route[index];
  if(!node||node.revealed) return node;
  if(index===9){ node.type='boss'; node.label='BOSS'; node.revealed=true; return node; }
  node.type=chooseNextNodeType(room); node.label=NODE_LABELS[node.type]; node.revealed=true; return node;
}
function fallbackEvent(area){
  return {area:area.id,id:`fallback-${area.id}-${Date.now()}`,name:`${area.name}：未確認異常`,theme:'unknown',difficulty:5,description:'前方出現尚未歸檔的異常徵兆。',success:'你們確認安全路線並繼續深入。',failure:'判斷失誤讓局勢惡化。'};
}
function pickEvent(room,eventOptions){
  const area=areaOf(room),pool=EVENTS.filter((e)=>e.area===area.id);
  if(!pool.length){ const f=fallbackEvent(area); return {...f,sceneType:'event',options:eventOptions(f)}; }
  const target=2+room.exploration.danger*1.2+(room.areaIndex||0)*2;
  const event=weightedPick(pool.map((e)=>({value:e,weight:Math.max(2,22-Math.abs(Number(e.difficulty||0)-target)*3)})));
  return {...event,sceneType:'event',options:eventOptions(event)};
}
function pickEnemy(room,type){
  const source=type==='boss'?BOSSES:type==='elite'?ELITE_ENEMIES:NORMAL_ENEMIES;
  const pool=source.filter((e)=>e.area===room.areaId);
  return {...randomFrom(pool.length?pool:source)};
}
function scaledEnemy(room,type){
  const base=pickEnemy(room,type),danger=room.exploration.danger,b=balance(room);
  const hpDanger=1+danger*(type==='boss'?.06:type==='elite'?.055:.04);
  const hpMult=b.enemyHp*hpDanger;
  const atkMult=(type==='boss'?b.bossAtk:b.enemyAtk)*(1+danger*.035);
  return {...base,
    hp:Math.max(12,Math.round(base.hp*hpMult)),
    attack:Math.max(3,Math.round(base.attack*atkMult)),
    defense:Math.max(7,Math.round(base.defense+b.enemyDef+danger*.3))
  };
}
function pickPositiveStatus(room,player){
  const danger=room.exploration.danger,chapter=room.areaIndex||0;
  const buffs=STATUS_EFFECTS.filter((s)=>s.type==='buff');
  return weightedPick(buffs.map((s)=>({value:s,weight:rarityWeight(s.rarity||'common',danger,playerLootBonus(player),chapter)})));
}
function rewardChoice(room,player,{bonusDanger=0,equipmentBias=0}={}){
  const danger=Math.min(10,room.exploration.danger+bonusDanger),chapter=room.areaIndex||0;
  const equipmentChance=Math.min(.78,.32+danger*.05+chapter*.04+equipmentBias);
  if(Math.random()<equipmentChance) return {...pickReward(EQUIPMENT,danger,player,chapter)};
  return {...pickReward(CONSUMABLES,danger,player,chapter)};
}

module.exports={
  CHAPTER_BALANCE,balance,randomFrom,weightedPick,areaOf,rarityWeight,pickReward,
  chooseNextNodeType,revealNode,pickEvent,scaledEnemy,pickPositiveStatus,rewardChoice
};
