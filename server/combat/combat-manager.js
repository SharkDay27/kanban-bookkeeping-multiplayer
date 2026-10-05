const B=require('../status/battle-status');
const Cards=require('../cards/card-manager');
const {CONSUMABLES}=require('../../shared/game-data');
const {persist}=require('../room/room-manager');
const {chapterRule}=require('../expedition/chapter-system');
const {addStatus,removeStatus,healPlayer,tickStatuses}=require('../status/status-manager');
const {BASIC_ACTIONS,COMBAT_ACTIONS,actionsForPlayer,actionForPlayer,estimateDamage}=require('./combat-actions');
const {aliveEnemies,primaryEnemy,spawnEncounter,ensureTarget}=require('./combat-enemies');
const {findPart}=require('./combat-parts');
const {setEnemyIntents}=require('./combat-intents');
const {resolvePlayerAction,resolveEnemyActions}=require('./combat-damage');
const {finishVictory}=require('./combat-rewards');
const {syncCombatBossPhases}=require('./boss-phase');
const {combatStartShield,consumablePowerMultiplier,consumableRefund}=require('../relics/relic-effects');

function checkDefeat(room){if(room.players.every(p=>p.hp<=0)){room.phase='defeat';for(const p of room.players)p.temporaryShield=0;if(room.combat)room.combat.ended=true;return true;}return false;}
function isCombatVictory(room){return ['combat-victory','boss-victory'].includes(room?.eventResult?.degree);}
function assertCombatOpen(room){if(!room?.combat)throw new Error('目前不在戰鬥中。');if(room.combat.ended||isCombatVictory(room))throw new Error('這場戰鬥已經結束。');}
function selectCombatAction(){throw new Error('戰鬥已改為卡牌制，請使用手牌出牌。');}
function selectCombatCards(room,player,data){assertCombatOpen(room);const result=Cards.selection(room,player,data);persist();return result;}
function useAbilityCard(room,player,data){assertCombatOpen(room);const result=Cards.useAbility(room,player,data);persist();return result;}
function cancelCombatConfirm(room,player){assertCombatOpen(room);const selection=room.combat.selections?.[player.id];if(player.serverControl>0)throw new Error('本回合由伺服器接管。');if(selection)selection.confirmed=false;persist();}
function confirmCombatAction(room,player){assertCombatOpen(room);Cards.assertPlayable(room,player);const existing=room.combat.selections?.[player.id];const selection=Cards.selection(room,player,existing||{picks:[]});Cards.actions(room,player,selection);selection.confirmed=true;Cards.prepareAutomatic(room);persist();const active=room.players.filter(p=>p.connected&&p.hp>0);if(active.every(p=>room.combat.selections?.[p.id]?.confirmed))return resolveCombatRound(room);return null;}
function startCombat(room,type){const enemies=spawnEncounter(room,type),main=enemies[0];for(const enemy of enemies){const scale=type==='combat'?1.35:type==='elite'?1.12:1;enemy.currentHp=enemy.maxHp=Math.round(enemy.maxHp*scale);for(const part of enemy.parts||[])part.currentHp=part.maxHp=Math.round(part.maxHp*scale);}for(const p of room.players){p.temporaryShield=0;p.healUses=0;p.serverControl=0;p.markMods={};p.battleGoldBonus=0;p.statuses=(p.statuses||[]).filter(s=>s.id!=='imprint');}room.combat={rulesVersion:28,kind:type,enemies,enemy:main,round:1,log:[],options:[],selections:{},cooldowns:{},intents:{},intent:null,blockChallenge:null,lastResolution:null,chapter:room.areaIndex,difficultyLabel:chapterRule(room.areaIndex).label,ended:false,rewardGranted:false,playerStartHp:{}};for(const p of room.players.filter(p=>p.hp>0)){room.combat.playerStartHp[p.id]=Number(p.hp||0);p.temporaryShield=Math.min(99,combatStartShield(p)+Number(p.equipment?.armor?.survival?.startShield||0));}Cards.initialize(room);syncCombatBossPhases(room.combat);setEnemyIntents(room.combat);room.currentEvent=null;room.eventResult=null;room.votes={};persist();return room.combat;}
function tickCooldowns(combat){for(const map of Object.values(combat.cooldowns||{}))for(const key of Object.keys(map))map[key]=Math.max(0,map[key]-1);}
function closeVictory(room,records,enemyResults=[]){const result=finishVictory(room),combat=room.combat;combat.ended=true;combat.endedAt=Date.now();combat.rewardGranted=true;for(const p of room.players){p.temporaryShield=0;p.serverControl=0;p.markMods={};p.statuses=(p.statuses||[]).filter(s=>s.id!=='imprint');}combat.selections={};combat.intents={};combat.intent=null;combat.blockChallenge=null;combat.lastResolution={serial:require('crypto').randomUUID(),players:records,enemyResults,initiative:combat.initiative,timeline:combat.timeline,victory:true,gold:result.gold};combat.finalGoldDelta=Number(result.gold||0)*room.players.length;persist();return result;}
function resolveCombatRound(room){assertCombatOpen(room);const combat=room.combat,active=room.players.filter(p=>p.connected&&p.hp>0);Cards.prepareAutomatic(room);if(active.some(p=>!combat.selections?.[p.id]?.confirmed))return null;
 const guards=new Set(),records=[],enemyResults=[];let incoming=0;
 for(const p of active){p.bestOfTwo=false;p.onBlockBuff=null;}
 if(combat.cardMode)require('./opposed-dice').prepare(room);
 combat.initiative=require('./initiative').order(room);combat.timeline=[];
 if(combat.blockChallenge)combat.blockChallenge.currentDamage=0;
 for(const turn of combat.initiative){if(room.players.every(p=>p.hp<=0)||!aliveEnemies(combat).length)break;
  const statusEvents=B.captureEffects(()=>{
  if(turn.side==='player'){const p=room.players.find(p=>p.id===turn.id);if(!p||p.hp<=0)return;const before=records.length;if(B.skip(p)){records.push({playerId:p.id,sinner:turn.name,action:'麻痺：本次無法行動',kind:'card-guard',cardBased:true,dealt:0});}else resolvePlayerAction(room,p,combat.selections[p.id],guards,records);for(let i=before;i<records.length;i++)combat.timeline.push({side:'player',index:i});}
  else {const result=resolveEnemyActions(room,guards,turn.id);incoming+=result.total;for(const record of result.results){combat.timeline.push({side:'enemy',index:enemyResults.length});enemyResults.push(record);}}
  });if(statusEvents.length)combat.timeline.push({side:'status',events:statusEvents});
  syncCombatBossPhases(combat);
 }
 // Dead enemies cannot act; status ticks are resolved together at the end of a live round.
 if(!aliveEnemies(combat).length&&!room.players.every(p=>p.hp<=0))return closeVictory(room,records,enemyResults);
 tickStatuses(room.players,{combatRound:true});for(const e of aliveEnemies(combat))B.tick(e);
 const result={serial:require('crypto').randomUUID(),players:records,enemyResults,incoming,initiative:combat.initiative,timeline:combat.timeline};
 if(checkDefeat(room)){combat.lastResolution=result;persist();return result;}
 if(!aliveEnemies(combat).length)return closeVictory(room,records,enemyResults);
 for(const p of room.players){if(p.controlFresh)p.controlFresh=false;else p.serverControl=Math.max(0,Number(p.serverControl||0)-1);}
 tickCooldowns(combat);combat.round++;Cards.nextRound(room);combat.selections={};syncCombatBossPhases(combat);setEnemyIntents(combat);Cards.prepareAutomatic(room);
 combat.log.push({round:combat.round-1,text:`機動順序：${combat.initiative.map(x=>x.name+' '+x.total+'（機動 '+x.mobility+'）').join(' → ')}。敵方造成 ${incoming} 傷害。`});combat.lastResolution=result;persist();return result;
}
function useConsumable(room,player,slot){const beforeHp=Number(player.hp||0);if(!Number.isInteger(slot)||slot<0||slot>=player.inventory.length)throw new Error('找不到這個道具。');const item=player.inventory[slot];if(!item)throw new Error('這個道具欄是空的。');const def=CONSUMABLES.find(x=>x.id===item.id)||item,combatOnly=['enemy-debuff','combat','boss','guard'].includes(def.kind),powerMult=consumablePowerMultiplier(player);if(combatOnly)assertCombatOpen(room);let message='';if(def.kind==='heal'||def.kind==='cleanse'){const healed=healPlayer(player,Math.round(Number(def.power||0)*powerMult));if(def.removeStatus)removeStatus(player,def.removeStatus);message=`${player.name} 使用「${def.name}」，恢復 ${healed} HP。`;}else if(def.kind==='buff'){addStatus(player,def.status||'steady-mind',3);message=`${player.name} 使用「${def.name}」。`;}else if(def.kind==='guard'){player.temporaryShield=Math.min(99,(player.temporaryShield||0)+Math.round(Number(def.power||15)*powerMult));message=`${player.name} 獲得臨時防護。`;}else if(def.kind==='enemy-debuff'||def.kind==='combat'){for(const enemy of aliveEnemies(room.combat))require('./combat-parts').reduceAttack(enemy,.75);message=`${player.name} 使用「${def.name}」，可削弱的敵方攻擊已降低；未破壞攻擊部位的敵人免疫。`;}else if(def.kind==='boss'){if(room.combat.kind!=='boss')throw new Error('這個道具只能在 Boss 戰使用。');const enemy=primaryEnemy(room.combat);enemy.defensePenalty=Math.min(8,(enemy.defensePenalty||0)+Number(def.power||2));message=`${player.name} 使用「${def.name}」，Boss 防禦下降。`;}else throw new Error('這個道具目前沒有可使用效果。');player.inventory.splice(slot,1);const refund=consumableRefund(player);if(refund.gold>0&&Math.random()<refund.chance){player.gold=Number(player.gold||0)+refund.gold;message+=` 回收物資返還 ${refund.gold} 金幣。`;}const healed=Math.max(0,Number(player.hp||0)-beforeHp);if(healed)room.visualEffect={id:require('crypto').randomUUID(),type:'heal',playerId:player.id,amount:healed};persist();return message;}
module.exports={COMBAT_ACTIONS,BASIC_ACTIONS,startCombat,selectCombatAction,selectCombatCards,useAbilityCard,confirmCombatAction,cancelCombatConfirm,resolveCombatRound,useConsumable,checkDefeat,actionsForPlayer,estimateDamage,assertCombatOpen,isCombatVictory};
