const {addStatus,removeStatus,healPlayer}=require('../status/status-manager');
const B=require('../status/battle-status');
const {aliveEnemies}=require('../combat/combat-enemies');
const {randomFrom}=require('../expedition/danger-system');
function grantShield(p,n){const before=Number(p.temporaryShield||0);B.grantShield(p,n);return Number(p.temporaryShield||0)-before;}
function alterEnemyCards(room,player,target,pile,destroy=false,steal=false){const deck=room.combat.enemyCardDecks?.[target?.instanceId],own=room.combat.cardDecks?.[player.id];if(!deck||!own)return false;if(destroy&&Number(target.cardsDestroyed||0)>=3)return false;const index=deck[pile].findIndex(c=>c.kind==='action');if(index<0)return false;const card=deck[pile].splice(index,1)[0];if(destroy){(deck.destroyed||=[]).push(card);target.cardsDestroyed=Number(target.cardsDestroyed||0)+1;}else if(steal){card.source='戰鬥偷取';card.temporary=true;own.hand.push(card);B.trimHand(player,own);}else deck.discard.push(card);B.cardEvent(target,destroy?'destroy':steal?'steal':'discard',card,pile);
 if(pile==='hand'){const turn=room.combat.lockedEnemyTurns?.find(t=>t.enemyId===target.instanceId),intent=turn?.intent||room.combat.intents[target.instanceId],plan=intent?.cardPlan;if(plan){plan.picks=(plan.picks||[]).filter(p=>p.uid!==card.uid);const sums=require('../../shared/cards').totals(deck.hand,plan.picks);Object.assign(plan,sums);plan.cards=(plan.cards||[]).filter(c=>c.uid!==card.uid);intent.attackDice=sums.points.slash+sums.points.blunt+sums.points.pierce;intent.defenseDice=sums.points.guard;const defense=room.combat.diceDefense?.enemies?.[target.instanceId];if(defense){const D=require('../combat/opposed-dice'),rolls=defense.rolls.slice(0,intent.defenseDice);defense.rolls=rolls;defense.total=D.sum(rolls);defense.remaining=Math.min(defense.remaining,defense.total);}if(!require('../../shared/cards').meets(['guard','shield','enrage'].includes(intent.type)?sums.guardColors:sums.attackColors,intent.cardRequirement,['guard','shield','enrage'].includes(intent.type)?sums.guardFaces:sums.attackFaces)&&intent.type!=='attack'){intent.type='attack';intent.statusId=null;intent.label='普通出牌（技能條件被破壞）';}}}return true;}
function applySkillUtility(room,player,action,target,dealt=0){
 const c=room.combat,allies=room.players.filter(p=>p.hp>0);
 if(action.shield)grantShield(player,action.shield);
 if(action.teamShield)for(const p of allies)grantShield(p,action.teamShield);
 if(action.buff)for(const p of action.teamBuff?allies:[player])addStatus(p,action.buff==='focus'?'focused':action.buff,action.buffDuration||2);
 if(action.selfStatus)addStatus(player,action.selfStatus,action.statusDuration||2);
 if(action.heal){for(const p of action.team?allies:[player])healPlayer(p,action.heal);if(action.id==='don-stew'){const ally=allies.filter(p=>p.id!==player.id).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(ally)healPlayer(ally,action.heal);}if(action.healOveruse&&!player.serverControl){player.healUses=Number(player.healUses||0)+1;if(player.healUses>=3){player.healUses=0;player.serverControl=2;player.controlFresh=true;}}}
 if(action.cleanse){for(const p of action.team?allies:[player]){const d=(p.statuses||[]).find(s=>require('../../shared/status-effects').getStatus(s.id)?.type==='debuff');if(d)removeStatus(p,d.id);}}
 if(action.lifesteal&&dealt>0)healPlayer(player,Math.max(1,Math.round(dealt*action.lifesteal)));
 if(action.imprint)B.imprint(player);
 if(action.regeneration)addStatus(player,'regeneration',2,action.regeneration);
 if(action.agile)for(const p of allies)addStatus(p,'agile',2,action.agile);
 if(action.randomAllyBuff){const id=randomFrom(['damage-up','shield','regeneration','agile']);for(const p of allies)addStatus(p,id,2);}
 if(action.randomEnemyDebuff&&target)B.add(target,randomFrom(['vulnerable','bleeding','paralysis','sealed','terror','burning','tremor','sinking']),2);
 if(action.applyStatus&&target){B.add(target,action.applyStatus,action.statusDuration||2,action.statusStacks||1);if(action.applyStatus==='suppressed'){const pool=c.diceDefense?.enemies?.[target.instanceId];if(pool){pool.rolls=pool.rolls.slice(0,Math.max(0,pool.rolls.length-3));pool.total=require('../combat/opposed-dice').sum(pool.rolls);pool.remaining=Math.min(pool.remaining,pool.total);}}}
 if(action.onHitStatus&&dealt>0&&target)B.add(target,action.onHitStatus,2,action.statusStacks||1);
 if(action.statusId&&dealt>0&&target)B.add(target,action.statusId,action.statusDuration||2);
 if(action.nextDraw){const d=c.cardDecks[player.id];d.nextDrawBonus=Math.min(2,Number(d.nextDrawBonus||0)+action.nextDraw);}
 if(action.onBlockBuff)player.onBlockBuff=action.onBlockBuff;
 if(action.bestOfTwo)player.bestOfTwo=true;
 if(action.enemyDiceDown&&target){const id=action.enemyDiceType==='defense'?'defense-down':'attack-down';B.add(target,id,2,action.enemyDiceDown);const pool=c.diceDefense?.enemies?.[target.instanceId];if(id==='defense-down'&&pool){pool.rolls=pool.rolls.slice(0,Math.max(0,pool.rolls.length-action.enemyDiceDown));pool.total=require('../combat/opposed-dice').sum(pool.rolls);pool.remaining=Math.min(pool.remaining,pool.total);}}
 if(action.goldBonus)player.battleGoldBonus=Math.min(24,Number(player.battleGoldBonus||0)+action.goldBonus);
 if(action.discardEnemy&&dealt>0)alterEnemyCards(room,player,target,'hand');
 if(action.stealPile)alterEnemyCards(room,player,target,action.stealPile,false,true);
 if(action.destroyEnemy)for(const pile of ['hand','draw','discard'])if(alterEnemyCards(room,player,target,pile,true))break;
 if(action.clue)room.exploration.clues+=action.clue;
}
module.exports={applySkillUtility,grantShield,alterEnemyCards};
