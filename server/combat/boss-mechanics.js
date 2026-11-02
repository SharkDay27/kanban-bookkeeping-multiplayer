// Elite and boss parts stay hidden until the enemy needs them. Each enemy brews for a few rounds, then one part
// surfaces with a countdown: break it in time to interrupt (and get the part's break effect), or the enemy unleashes
// that part's move. Then the part sinks back, a short cooldown passes and the next brew begins.
const J=require('./combat-journal');
const {aliveEnemies}=require('./combat-enemies');
const {summonMinion,canSummon}=require('./combat-summon');
const MOVES={
 weapon:{label:'蓄力重擊',fail:'下一次攻擊傷害 ×1.8'},
 armor:{label:'硬化外殼',fail:'獲得最大 HP 15% 的護盾'},
 summon:{label:'呼叫增援',fail:'召喚 1 名小怪'}
};
const ORDER=['weapon','armor','summon'];
const WINDOW=2;// rounds the part stays exposed
const brewFor=(enemy,first)=>enemy.role==='boss'?(first?2+Math.floor(Math.random()*2):1+Math.floor(Math.random()*2)):(first?3:2);
function candidates(combat,enemy){return ORDER.map(type=>enemy.parts.find(p=>p.type===type&&!p.destroyed)).filter(p=>p&&(p.type!=='summon'||canSummon(combat,enemy)));}
function reveal(room,enemy){const combat=room.combat,list=candidates(combat,enemy);if(!list.length)return false;
 const next=list[Number(enemy.partTurn||0)%list.length];enemy.partTurn=Number(enemy.partTurn||0)+1;next.hidden=false;
 const move=MOVES[next.type];enemy.partEvent={partId:next.id,partName:next.name,type:next.type,label:move.label,fail:move.fail,roundsLeft:WINDOW};
 J.write(room,`⚠ ${enemy.name} 醞釀完成，「${next.name}」顯現：${move.label}。${WINDOW} 回合內破壞可中斷，否則${move.fail}。`);return true;}
function unleash(room,enemy,ev){const combat=room.combat;
 if(ev.type==='weapon'){enemy.nextHitMult=Number(enemy.nextHitMult||1)*1.8;J.write(room,`${enemy.name} 完成蓄力重擊：下一次攻擊傷害 ×1.8。`);}
 else if(ev.type==='armor'){const add=Math.round(enemy.maxHp*.15);enemy.shield=Number(enemy.shield||0)+add;enemy.maxShield=Math.max(Number(enemy.maxShield||0),enemy.shield);J.write(room,`${enemy.name} 外殼硬化，獲得 ${add} 護盾。`);}
 else if(ev.type==='summon'){const m=summonMinion(room,combat,enemy);J.write(room,m?`${enemy.name} 呼叫增援：${m.name} 加入戰鬥。`:`${enemy.name} 呼叫增援，但沒有回應。`);}}
// Called at the start of every round (movement phase).
function tick(room){const combat=room.combat;if(!combat)return;
 for(const enemy of aliveEnemies(combat)){if(!['elite','boss'].includes(enemy.role)||!(enemy.parts||[]).length)continue;
  const ev=enemy.partEvent,part=ev&&enemy.parts.find(p=>p.id===ev.partId);
  if(ev){
   if(!part||part.destroyed){J.write(room,`「${ev.partName}」被破壞，${enemy.name} 的${ev.label}被中斷！`);enemy.partEvent=null;enemy.partCycle={state:'cooldown',rounds:1};continue;}
   if(--ev.roundsLeft>0)continue;
   unleash(room,enemy,ev);part.hidden=true;enemy.partEvent=null;enemy.partCycle={state:'cooldown',rounds:1};continue;}
  const cycle=enemy.partCycle||(enemy.partCycle={state:'brewing',rounds:brewFor(enemy,true)});
  if(cycle.state==='cooldown'){if(--cycle.rounds<=0)enemy.partCycle={state:'brewing',rounds:brewFor(enemy,false)};continue;}
  if(--cycle.rounds<=0){if(reveal(room,enemy))enemy.partCycle={state:'exposed'};else enemy.partCycle={state:'done'};}
 }}
module.exports={tick,MOVES,WINDOW};
