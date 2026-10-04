const {aliveEnemies,makeEnemy}=require('./combat-enemies');
function minionCount(combat){return aliveEnemies(combat).filter(e=>e.role==='minion').length;}
function canSummon(combat,enemy){return !!enemy&&enemy.currentHp>0&&enemy.role!=='minion'&&minionCount(combat)<2;}
function summonMinion(room,combat,enemy){if(!canSummon(combat,enemy))return null;const minion=makeEnemy(room,'minion','minion',enemy.role==='boss'?.42:.38);combat.enemies.push(minion);return minion;}
function maybeSummon(room,combat,enemy){if(!canSummon(combat,enemy))return null;const chance=enemy.role==='boss'?.28:.18;if(combat.round<2||Math.random()>chance)return null;return summonMinion(room,combat,enemy);}
module.exports={minionCount,canSummon,summonMinion,maybeSummon};
