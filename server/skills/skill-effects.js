const {addStatus,removeStatus,healPlayer}=require('../status/status-manager');
const {aliveEnemies}=require('../combat/combat-enemies');

function grantShield(player,amount){const value=Math.max(0,Math.round(Number(amount||0)));if(!value)return 0;const before=Number(player.temporaryShield||0);player.temporaryShield=Math.min(99,before+value);return player.temporaryShield-before;}
function applySkillUtility(room,player,action,target,dealt){
  if(action.shield)grantShield(player,action.shield);
  if(action.teamShield)for(const ally of room.players.filter(p=>p.hp>0))grantShield(ally,action.teamShield);
  if(action.buff)addStatus(player,action.buff,Number(action.buffDuration||2));
  if(action.statusId&&target)target.statuses=(target.statuses||[]).concat([{id:action.statusId,remaining:Number(action.statusDuration||2)}]);
  if(action.defenseDown&&target)target.defensePenalty=Math.min(8,Number(target.defensePenalty||0)+action.defenseDown);
  if(action.attackDown&&target)target.attackMultiplier=Math.max(.45,Number(target.attackMultiplier||1)*(1-action.attackDown));
  if(action.enemyDamageMult)for(const enemy of aliveEnemies(room.combat))enemy.attackMultiplier=Math.max(.45,Number(enemy.attackMultiplier||1)*action.enemyDamageMult);
  if(action.heal){const targets=action.team?room.players.filter(p=>p.hp>0):[player];for(const targetPlayer of targets)healPlayer(targetPlayer,action.heal);}
  if(action.cleanse){const debuff=(player.statuses||[])[0];if(debuff)removeStatus(player,debuff.id);}
  if(action.lifesteal&&dealt>0)healPlayer(player,Math.max(1,Math.round(dealt*action.lifesteal)));
  if(action.dangerDown)room.exploration.danger=Math.max(0,room.exploration.danger-action.dangerDown);
  if(action.clue)room.exploration.clues+=action.clue;
}
module.exports={applySkillUtility,grantShield};
