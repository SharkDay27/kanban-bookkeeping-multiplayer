const {aliveEnemies,makeEnemy}=require('./combat-enemies');
function maybeSummon(room,combat,enemy){
  if(!enemy||enemy.currentHp<=0||enemy.role==='minion')return null;
  const minions=aliveEnemies(combat).filter(e=>e.role==='minion').length;if(minions>=2)return null;
  const chance=enemy.role==='boss'?.28:.18;if(combat.round<2||Math.random()>chance)return null;
  const minion=makeEnemy(room,'minion','minion',enemy.role==='boss'?.42:.38);combat.enemies.push(minion);return minion;
}
module.exports={maybeSummon};
