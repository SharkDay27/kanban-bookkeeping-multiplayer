const {scaledEnemy}=require('../expedition/danger-system');
const {profileForEnemy}=require('../../shared/damage-types');
const {makeParts}=require('./combat-parts');

function aliveEnemies(combat){return (combat?.enemies||[]).filter(e=>e.currentHp>0);}
function primaryEnemy(combat){return aliveEnemies(combat).find(e=>e.role==='boss'||e.role==='elite')||aliveEnemies(combat)[0]||null;}
function makeEnemy(room,type,role=type,scale=1){
  const base=scaledEnemy(room,type==='minion'?'combat':type),id=`${base.id}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,hp=Math.max(8,Math.round(base.hp*scale));
  const enemy={...base,instanceId:id,role,currentHp:hp,maxHp:hp,attack:Math.max(2,Math.round(base.attack*(role==='minion'?.72:1))),defensePenalty:0,temporaryDefense:0,attackMultiplier:1,statuses:[],parts:[],resistances:base.resistances||profileForEnemy(base.id)};
  enemy.parts=makeParts(enemy,type);return enemy;
}
function spawnEncounter(room,type){
  const playerCount=Math.max(1,room.players.filter(p=>p.connected&&p.hp>0).length);
  if(type==='combat'){
    const count=playerCount===1?1:(Math.random()<.5?2:Math.min(3,playerCount)),scale=count===1?1:count===2?.68:.52;
    return Array.from({length:count},()=>makeEnemy(room,'combat','minion',scale));
  }
  const main=makeEnemy(room,type,type,1),list=[main];
  const escorts=type==='boss'?(playerCount>=3&&Math.random()<.65?1:0):(playerCount>=2&&Math.random()<.45?1:0);
  for(let i=0;i<escorts;i++)list.push(makeEnemy(room,'minion','minion',.45));
  return list;
}
function ensureTarget(combat,targetId){return aliveEnemies(combat).find(e=>e.instanceId===targetId)||primaryEnemy(combat);}
module.exports={aliveEnemies,primaryEnemy,makeEnemy,spawnEncounter,ensureTarget};
