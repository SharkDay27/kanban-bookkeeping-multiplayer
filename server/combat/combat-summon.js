const {aliveEnemies,makeEnemy,labelDuplicates}=require('./combat-enemies');
function minionCount(combat){return aliveEnemies(combat).filter(e=>e.role==='minion').length;}
function canSummon(combat,enemy){return !!enemy&&enemy.currentHp>0&&['elite','boss'].includes(enemy.role)&&!(enemy.parts||[]).some(p=>p.type==='summon'&&p.destroyed)&&minionCount(combat)<2;}
function summonMinion(room,combat,enemy){if(!canSummon(combat,enemy))return null;const minion=makeEnemy(room,'minion','minion',enemy.role==='boss'?.42:.38);combat.enemies.push(minion);labelDuplicates(combat.enemies);enemy.lastSummonRound=combat.round;return minion;}
function maybeSummon(room,combat,enemy){if(!canSummon(combat,enemy))return null;const intent=combat?.intents?.[enemy.instanceId];if(intent?.type!=='summon')return null;return summonMinion(room,combat,enemy);}
module.exports={minionCount,canSummon,summonMinion,maybeSummon};
