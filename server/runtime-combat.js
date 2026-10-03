const { CONSUMABLES, STATUS_EFFECTS, getStatus }=require('../shared/game-data');
const { persist, chapterRule }=require('./room-manager');
const {
  sinnerOf,statFor,addStatus,removeStatus,applyDamageToPlayer,healPlayer,tickStatuses,statusName
}=require('./runtime-status');
const { randomFrom,weightedPick,areaOf,scaledEnemy,rewardChoice,pickPositiveStatus }=require('./runtime-risk');

const COMBAT_ACTIONS=[
  {id:'attack',label:'攻擊',stat:'combat',statLabel:'戰鬥',desc:'直接攻擊敵人。'},
  {id:'guard',label:'防禦',stat:'stability',statLabel:'穩定',desc:'準備承受敵人的下一次行動。'},
  {id:'analyze',label:'觀察弱點',stat:'observe',statLabel:'觀察',desc:'分析敵人，降低防禦並增加線索。'}
];

function currentNode(room){ return room.exploration.route[room.exploration.position]; }
function markCurrentNodeResolved(room){ const node=currentNode(room); if(node) node.resolved=true; }
function checkDefeat(room){
  if(room.exploration.danger>=room.exploration.dangerMax||room.players.every((p)=>p.hp<=0)){room.phase='defeat';return true;}
  return false;
}
function giveReward(room,player,reward){
  if(reward.slot){ player.equipment[reward.slot]=reward; }
  else if(player.inventory.length<4) player.inventory.push(reward);
  else room.sharedInventory.push(reward);
}
function maybePositiveStatus(room,player,bonus=0){
  const chance=.08+room.exploration.danger*.035+(room.areaIndex||0)*.04+bonus;
  if(Math.random()>chance) return null;
  const status=pickPositiveStatus(room,player); addStatus(player,status.id); return status;
}
function awardCombatLoot(room,kind){
  const chance=kind==='boss'?1:kind==='elite'?.9:.42+room.exploration.danger*.035;
  if(Math.random()>chance) return null;
  const recipient=randomFrom(room.players.filter((p)=>p.connected&&p.hp>0)); if(!recipient) return null;
  const reward=rewardChoice(room,recipient,{bonusDanger:kind==='boss'?3:kind==='elite'?2:0,equipmentBias:kind==='boss'?.28:kind==='elite'?.18:0});
  giveReward(room,recipient,reward);
  const buff=maybePositiveStatus(room,recipient,kind==='boss'?.2:kind==='elite'?.1:0);
  return {recipientId:recipient.id,reward,status:buff?.id||null,text:`${recipient.name} 獲得「${reward.name}」${buff?`與「${buff.name}」`:''}。`};
}
function intentPool(room,combat){
  const enemy=combat.enemy,danger=room.exploration.danger,chapter=room.areaIndex||0;
  const isBoss=combat.kind==='boss',isElite=combat.kind==='elite';
  const baseDamage=Math.max(2,Math.round(enemy.attack*(isBoss?.80:isElite?.72:.64)));
  const debuffs=['bleeding','shaken','slowed','weakened','marked'];
  if(areaOf(room).id==='zone-7') debuffs.push('contaminated');
  return [
    {type:'attack',label:'攻擊',description:`對一名隊員造成約 ${baseDamage} 傷害。`,damage:baseDamage,target:'single',weight:42},
    {type:'heavy',label:'蓄力重擊',description:`高傷害單體攻擊，約 ${Math.round(baseDamage*1.55)} 傷害。`,damage:Math.round(baseDamage*1.55),target:'single',weight:13+danger*1.5+chapter*2},
    {type:'sweep',label:'範圍攻擊',description:`全隊受到約 ${Math.round(baseDamage*.65)} 傷害。`,damage:Math.round(baseDamage*.65),target:'all',weight:(isBoss?18:isElite?10:4)+danger},
    {type:'status',label:'異常侵蝕',description:'攻擊一名隊員並施加負面狀態。',damage:Math.round(baseDamage*.55),target:'single',statusId:randomFrom(debuffs),weight:8+danger*2+chapter*2},
    {type:'guard',label:'收縮防禦',description:'本回合不攻擊，下一輪防禦提高。',defenseBoost:2+(isBoss?2:0),weight:8},
    {type:'enrage',label:'異常增幅',description:'本回合不攻擊，之後的攻擊傷害提高。',attackBoost:.18+danger*.01,weight:isBoss?12:isElite?6:2}
  ];
}
function rollEnemyIntent(room,combat){
  const choices=intentPool(room,combat);
  const intent={...weightedPick(choices.map((x)=>({value:x,weight:x.weight})))};
  intent.serial=Date.now()+Math.floor(Math.random()*1000);
  intent.statusName=intent.statusId?statusName(intent.statusId):null;
  return intent;
}
function setNextIntent(room){ if(room.combat) room.combat.intent=rollEnemyIntent(room,room.combat); }
function startCombat(room,type){
  const enemy=scaledEnemy(room,type);
  room.combat={kind:type,enemy:{...enemy,currentHp:enemy.hp,maxHp:enemy.hp,defensePenalty:0,temporaryDefense:0,attackMultiplier:1},round:1,log:[],options:COMBAT_ACTIONS,enemyDamageMultiplier:1,serial:Date.now(),lastResolution:null,chapter:room.areaIndex,difficultyLabel:chapterRule(room.areaIndex).label,intent:null};
  setNextIntent(room); room.currentEvent=null; room.eventResult=null; room.votes={}; persist();
}
function resolveEnemyIntent(room,combat,activePlayers,guards){
  const intent=combat.intent||rollEnemyIntent(room,combat);
  const result={intent,targets:[],totalDamage:0,statusApplied:null,enemyBuff:null};
  if(intent.type==='guard'){
    combat.enemy.temporaryDefense=Math.max(combat.enemy.temporaryDefense||0,intent.defenseBoost||2);
    result.enemyBuff=`防禦 +${intent.defenseBoost||2}`; return result;
  }
  if(intent.type==='enrage'){
    combat.enemy.attackMultiplier=Math.min(2.2,Number(combat.enemy.attackMultiplier||1)+Number(intent.attackBoost||.2));
    result.enemyBuff='攻擊威力提高'; return result;
  }
  const candidates=activePlayers.filter((p)=>p.hp>0); if(!candidates.length) return result;
  const targets=intent.target==='all'?candidates:[randomFrom(candidates)];
  for(const target of targets){
    const guarded=guards.has(target.id),guardMult=guarded?.48:1;
    const raw=Math.round(Number(intent.damage||0)*Number(combat.enemy.attackMultiplier||1)*Number(combat.enemyDamageMultiplier||1));
    const applied=applyDamageToPlayer(target,raw,guardMult);
    result.targets.push({playerId:target.id,name:sinnerOf(target)?.name||target.name,damage:applied,guarded}); result.totalDamage+=applied;
  }
  if(intent.statusId){
    const target=targets[0];
    if(target?.hp>0){ addStatus(target,intent.statusId); result.statusApplied={playerId:target.id,name:sinnerOf(target)?.name||target.name,statusId:intent.statusId,statusName:statusName(intent.statusId)}; }
  }
  combat.enemyDamageMultiplier=1;
  return result;
}
function resolveCombatRound(room){
  const combat=room.combat;if(!combat)return null;
  const active=room.players.filter((p)=>p.connected&&p.hp>0); if(!active.length||active.some((p)=>!room.votes[p.id])) return null;
  let teamDamage=0; const guards=new Set(),rolls=[];
  for(const p of active){
    const action=COMBAT_ACTIONS.find((a)=>a.id===room.votes[p.id])||COMBAT_ACTIONS[0];
    const stat=statFor(p,action.stat),die=1+Math.floor(Math.random()*20),total=die+Math.round(stat/2); let dealt=0;
    if(action.id==='attack'){
      const defense=Math.max(5,combat.enemy.defense+Number(combat.enemy.temporaryDefense||0)-Number(combat.enemy.defensePenalty||0));
      if(die===20||total>=defense){dealt=Math.max(4,Math.round(stat*1.35)+Math.floor(Math.random()*7)+(die===20?6:0));teamDamage+=dealt;}
    }else if(action.id==='guard') guards.add(p.id);
    else if(action.id==='analyze'&&total>=10+Math.floor(room.exploration.danger/2)){combat.enemy.defensePenalty=Math.min(6,Number(combat.enemy.defensePenalty||0)+1);room.exploration.clues+=1;}
    rolls.push({playerId:p.id,sinner:sinnerOf(p)?.name||p.name,action:action.label,die,total,dealt});
  }
  combat.enemy.temporaryDefense=0; combat.enemy.currentHp=Math.max(0,combat.enemy.currentHp-teamDamage);
  if(combat.enemy.currentHp<=0){
    const loot=awardCombatLoot(room,combat.kind);
    combat.log.push({round:combat.round,text:`隊伍造成 ${teamDamage} 傷害，擊敗 ${combat.enemy.name}。${loot?` ${loot.text}`:''}`});
    room.eventResult={degree:combat.kind==='boss'?'boss-victory':'combat-victory',text:`擊敗 ${combat.enemy.name}。${loot?` ${loot.text}`:''}`,damage:0,rolls,loot};
    markCurrentNodeResolved(room);room.votes={};combat.lastResolution={serial:Date.now(),teamDamage,incoming:0,enemyDefeated:true,rolls,loot};
    if(combat.kind==='boss'){if(room.areaIndex<room.selectedAreas.length-1)room.eventResult.nextAreaAvailable=true;else room.phase='victory';}
    persist();return room.eventResult;
  }
  const enemyResult=resolveEnemyIntent(room,combat,active,guards);
  tickStatuses(room.players,{combatRound:true});
  combat.log.push({round:combat.round,text:`隊伍造成 ${teamDamage} 傷害。${combat.enemy.name} 使用「${enemyResult.intent.label}」${enemyResult.totalDamage?`，造成 ${enemyResult.totalDamage} 總傷害`:''}${enemyResult.statusApplied?`，${enemyResult.statusApplied.name} 獲得「${enemyResult.statusApplied.statusName}」`:''}${enemyResult.enemyBuff?`，${enemyResult.enemyBuff}`:''}。`});
  combat.lastResolution={serial:Date.now(),teamDamage,incoming:enemyResult.totalDamage,enemyIntent:enemyResult.intent,enemyTargets:enemyResult.targets,statusApplied:enemyResult.statusApplied,enemyBuff:enemyResult.enemyBuff,rolls};
  combat.round+=1;room.votes={};if(!checkDefeat(room))setNextIntent(room);persist();return combat.lastResolution;
}
function useConsumable(room,player,slot){
  if(!Number.isInteger(slot)||slot<0||slot>=player.inventory.length)throw new Error('找不到這個道具。');
  const item=player.inventory[slot];if(!item)throw new Error('這個道具欄是空的。');
  const def=CONSUMABLES.find((x)=>x.id===item.id)||item;let message='';
  if(def.kind==='heal'){
    if(player.hp>=player.maxHp&&def.id!=='item-bandage')throw new Error('HP 已滿，現在不需要使用。');
    const healed=healPlayer(player,Number(def.power||0));if(def.id==='item-bandage')removeStatus(player,'bleeding');
    message=`${player.name} 使用「${def.name}」，恢復 ${healed} HP${def.id==='item-bandage'?'並移除流血':''}。`;
  }else if(def.kind==='buff'){
    addStatus(player,'steady-mind',3);message=`${player.name} 使用「${def.name}」，獲得「心神穩定」。`;
  }else if(def.kind==='guard'){
    player.temporaryShield=Math.min(99,Number(player.temporaryShield||0)+Number(def.power||15));message=`${player.name} 使用「${def.name}」，獲得 ${def.power||15} 點臨時防護。`;
  }else if(def.kind==='combat'){
    if(!room.combat)throw new Error('這個道具只能在戰鬥中使用。');room.combat.enemyDamageMultiplier=Math.min(room.combat.enemyDamageMultiplier||1,.65);message=`${player.name} 使用「${def.name}」，敵人的下一次傷害降低。`;
  }else if(def.kind==='boss'){
    if(!room.combat||room.combat.kind!=='boss')throw new Error('這個道具只能在 Boss 戰使用。');room.combat.enemyDamageMultiplier=Math.min(room.combat.enemyDamageMultiplier||1,.55);room.combat.enemy.defensePenalty=Math.min(6,Number(room.combat.enemy.defensePenalty||0)+Number(def.power||2));message=`${player.name} 使用「${def.name}」，Boss 的下一次攻擊被抑制且防禦下降。`;
  }else throw new Error('這個道具目前沒有可使用效果。');
  player.inventory.splice(slot,1);if(room.combat)room.combat.log.push({round:room.combat.round,text:message});persist();return message;
}

module.exports={COMBAT_ACTIONS,startCombat,resolveCombatRound,useConsumable,checkDefeat,awardCombatLoot};
