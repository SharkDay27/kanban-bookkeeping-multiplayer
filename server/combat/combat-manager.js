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

function checkDefeat(room){if(room.exploration.danger>=room.exploration.dangerMax||room.players.every(p=>p.hp<=0)){room.phase='defeat';return true;}return false;}
function isCombatVictory(room){return ['combat-victory','boss-victory'].includes(room?.eventResult?.degree);}
function assertCombatOpen(room){if(!room?.combat)throw new Error('目前不在戰鬥中。');if(room.combat.ended||isCombatVictory(room))throw new Error('這場戰鬥已經結束。');}
function selectCombatAction(room,player,{actionId,targetId,partId}){
  assertCombatOpen(room);const combat=room.combat,selected=combat.selections?.[player.id];if(selected?.confirmed)throw new Error('請先取消確認再修改行動。');
  const action=actionForPlayer(player,actionId);if(!action)throw new Error('無效的戰鬥行動。');
  const isBasic=BASIC_ACTIONS.some(a=>a.id===action.id)||action.kind==='weapon-attack';
  if(!isBasic&&!(player.learnedSkills||[]).includes(action.id))throw new Error('尚未學會此技能。');
  const cooldown=Number(combat.cooldowns?.[player.id]?.[action.id]||0);if(cooldown>0)throw new Error(`技能冷卻中，剩餘 ${cooldown} 回合。`);
  const target=ensureTarget(combat,targetId),part=findPart(target,partId);
  combat.selections[player.id]={actionId:action.id,targetId:target?.instanceId||null,partId:part?.id||null,confirmed:false,preview:estimateDamage(room,player,action,target,part),label:action.label||action.name,damageType:action.damageType||null};
  persist();return combat.selections[player.id];
}
function cancelCombatConfirm(room,player){assertCombatOpen(room);const selection=room.combat.selections?.[player.id];if(selection)selection.confirmed=false;persist();}
function confirmCombatAction(room,player){assertCombatOpen(room);const selection=room.combat.selections?.[player.id];if(!selection)throw new Error('請先選擇行動。');selection.confirmed=true;persist();const active=room.players.filter(p=>p.connected&&p.hp>0);if(active.every(p=>room.combat.selections?.[p.id]?.confirmed))return resolveCombatRound(room);return null;}
function startCombat(room,type){
  const enemies=spawnEncounter(room,type),main=enemies[0];room.combat={kind:type,enemies,enemy:main,round:1,log:[],options:BASIC_ACTIONS,selections:{},cooldowns:{},intents:{},intent:null,blockChallenge:null,lastResolution:null,chapter:room.areaIndex,difficultyLabel:chapterRule(room.areaIndex).label,ended:false,rewardGranted:false};
  syncCombatBossPhases(room.combat);setEnemyIntents(room.combat);room.currentEvent=null;room.eventResult=null;room.votes={};persist();return room.combat;
}
function tickCooldowns(combat){for(const map of Object.values(combat.cooldowns||{}))for(const key of Object.keys(map))map[key]=Math.max(0,map[key]-1);}
function closeVictory(room,records){const result=finishVictory(room),combat=room.combat;combat.ended=true;combat.endedAt=Date.now();combat.rewardGranted=true;combat.selections={};combat.intents={};combat.intent=null;combat.blockChallenge=null;combat.lastResolution={serial:Date.now(),players:records,victory:true,gold:result.gold};combat.finalGoldDelta=Number(result.gold||0)*room.players.length;persist();return result;}
function resolveCombatRound(room){
  assertCombatOpen(room);const combat=room.combat,active=room.players.filter(p=>p.connected&&p.hp>0);if(active.some(p=>!combat.selections?.[p.id]?.confirmed))return null;
  const guards=new Set(),records=[];if(combat.blockChallenge)combat.blockChallenge.currentDamage=0;
  for(const player of active)resolvePlayerAction(room,player,combat.selections[player.id],guards,records);
  combat.enemies=combat.enemies.filter(e=>e.currentHp>0);if(!combat.enemies.length)return closeVictory(room,records);
  const phaseTransitions=syncCombatBossPhases(combat),enemyResult=resolveEnemyActions(room,guards);tickStatuses(room.players,{combatRound:true});tickCooldowns(combat);combat.round+=1;combat.selections={};syncCombatBossPhases(combat);setEnemyIntents(combat);checkDefeat(room);
  combat.log.push({round:combat.round-1,text:`隊伍完成行動；敵方造成 ${enemyResult.total} 總傷害。`});combat.lastResolution={serial:Date.now(),players:records,enemyResults:enemyResult.results,incoming:enemyResult.total,blockChallenge:combat.blockChallenge,phaseTransitions};persist();return combat.lastResolution;
}
function useConsumable(room,player,slot){
  if(!Number.isInteger(slot)||slot<0||slot>=player.inventory.length)throw new Error('找不到這個道具。');const item=player.inventory[slot];if(!item)throw new Error('這個道具欄是空的。');const def=CONSUMABLES.find(x=>x.id===item.id)||item,combatOnly=['enemy-debuff','combat','boss'].includes(def.kind);if(combatOnly)assertCombatOpen(room);let message='';
  if(def.kind==='heal'||def.kind==='cleanse'){const healed=healPlayer(player,Number(def.power||0));if(def.removeStatus)removeStatus(player,def.removeStatus);message=`${player.name} 使用「${def.name}」，恢復 ${healed} HP。`;}
  else if(def.kind==='buff'){addStatus(player,def.status||'steady-mind',3);message=`${player.name} 使用「${def.name}」。`;}
  else if(def.kind==='guard'){player.temporaryShield=Math.min(99,(player.temporaryShield||0)+Number(def.power||15));message=`${player.name} 獲得臨時防護。`;}
  else if(def.kind==='enemy-debuff'||def.kind==='combat'){for(const enemy of aliveEnemies(room.combat))enemy.attackMultiplier=Math.max(.5,(enemy.attackMultiplier||1)*.75);message=`${player.name} 使用「${def.name}」，敵方攻擊被削弱。`;}
  else if(def.kind==='boss'){if(room.combat.kind!=='boss')throw new Error('這個道具只能在 Boss 戰使用。');const enemy=primaryEnemy(room.combat);enemy.defensePenalty=Math.min(8,(enemy.defensePenalty||0)+Number(def.power||2));message=`${player.name} 使用「${def.name}」，Boss 防禦下降。`;}
  else throw new Error('這個道具目前沒有可使用效果。');player.inventory.splice(slot,1);persist();return message;
}
module.exports={COMBAT_ACTIONS,BASIC_ACTIONS,startCombat,selectCombatAction,confirmCombatAction,cancelCombatConfirm,resolveCombatRound,useConsumable,checkDefeat,actionsForPlayer,estimateDamage,assertCombatOpen,isCombatVictory};