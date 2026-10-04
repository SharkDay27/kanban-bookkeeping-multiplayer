const {addStatus,removeStatus,healPlayer}=require('../status/status-manager');
const {aliveEnemies}=require('../combat/combat-enemies');

function applySkillUtility(room,player,action,target,dealt){
  if(action.shield)player.temporaryShield=Math.min(99,Number(player.temporaryShield||0)+action.shield);
  if(action.buff)addStatus(player,action.buff,2);
  if(action.statusId&&target)target.statuses=(target.statuses||[]).concat([{id:action.statusId,remaining:2}]);
  if(action.defenseDown&&target)target.defensePenalty=Math.min(8,Number(target.defensePenalty||0)+action.defenseDown);
  if(action.attackDown&&target)target.attackMultiplier=Math.max(.45,Number(target.attackMultiplier||1)*(1-action.attackDown));
  if(action.enemyDamageMult)for(const enemy of aliveEnemies(room.combat))enemy.attackMultiplier=Math.max(.45,Number(enemy.attackMultiplier||1)*action.enemyDamageMult);
  if(action.heal){const targets=action.team?room.players.filter(p=>p.hp>0):[player];for(const targetPlayer of targets)healPlayer(targetPlayer,action.heal);}
  if(action.cleanse){const debuff=(player.statuses||[])[0];if(debuff)removeStatus(player,debuff.id);}
  if(action.lifesteal&&dealt>0)healPlayer(player,Math.max(1,Math.round(dealt*action.lifesteal)));
  if(action.dangerDown)room.exploration.danger=Math.max(0,room.exploration.danger-action.dangerDown);
  if(action.clue)room.exploration.clues+=action.clue;
}
module.exports={applySkillUtility};
