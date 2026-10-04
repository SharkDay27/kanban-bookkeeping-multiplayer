const { CONSUMABLES, NORMAL_ENEMIES, getSinnerSkill }=require('../shared/game-data');
const { persist, chapterRule }=require('./room-manager');
const { sinnerOf,statFor,addStatus,removeStatus,applyDamageToPlayer,healPlayer,tickStatuses,statusName }=require('./runtime-status');
const { randomFrom,scaledEnemy,rewardChoice,pickPositiveStatus }=require('./runtime-risk');
const { primeFogAfterResolution }=require('./runtime-route');

const BASIC_ACTIONS=[
  {id:'attack',label:'攻擊',stat:'combat',statLabel:'戰鬥',desc:'直接攻擊指定敵人。'},
  {id:'guard',label:'防禦',stat:'stability',statLabel:'穩定',desc:'本回合受到的傷害大幅降低。'},
  {id:'analyze',label:'觀察弱點',stat:'observe',statLabel:'觀察',desc:'降低敵人防禦並增加線索。'}
];
const COMBAT_ACTIONS=BASIC_ACTIONS;
function currentNode(room){return room.exploration.route[room.exploration.position];}
function markCurrentNodeResolved(room){const node=currentNode(room);if(node)node.resolved=true;}
function checkDefeat(room){if(room.exploration.danger>=room.exploration.dangerMax||room.players.every(p=>p.hp<=0)){room.phase='defeat';return true;}return false;}
function aliveEnemies(combat){return (combat.enemies||[]).filter(e=>e.currentHp>0);}
function primaryEnemy(combat){return aliveEnemies(combat).find(e=>e.role==='boss'||e.role==='elite')||aliveEnemies(combat)[0]||null;}
function makeParts(enemy,kind){
  if(!['elite','boss'].includes(kind))return[];
  const defs=kind==='boss'?[['核心',.28,'破壞後降低敵人攻擊'],['攻擊部位',.22,'可阻擋蓄力攻擊'],['外殼',.25,'破壞後降低防禦']]:[['攻擊部位',.24,'可阻擋特定攻擊'],['護甲',.2,'破壞後降低防禦']];
  return defs.map((d,i)=>({id:`${enemy.instanceId}-part-${i}`,name:d[0],maxHp:Math.max(10,Math.round(enemy.maxHp*d[1])),currentHp:Math.max(10,Math.round(enemy.maxHp*d[1])),destroyed:false,effect:d[2]}));
}
function makeEnemy(room,type,role=type,scale=1){
  const base=scaledEnemy(room,type==='minion'?'combat':type);const id=`${base.id}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const hp=Math.max(8,Math.round(base.hp*scale));
  const enemy={...base,instanceId:id,role,currentHp:hp,maxHp:hp,attack:Math.max(2,Math.round(base.attack*(role==='minion'?.72:1))),defensePenalty:0,temporaryDefense:0,attackMultiplier:1,statuses:[],parts:[]};
  enemy.parts=makeParts(enemy,type);return enemy;
}
function spawnEncounter(room,type){
  const playerCount=Math.max(1,room.players.filter(p=>p.connected&&p.hp>0).length);
  if(type==='combat'){
    const count=playerCount===1?1:(Math.random()<.5?2:Math.min(3,playerCount));
    const scale=count===1?1:count===2?.68:.52;
    return Array.from({length:count},()=>makeEnemy(room,'combat','minion',scale));
  }
  const main=makeEnemy(room,type,type,1),list=[main];
  const escorts=type==='boss'?(playerCount>=3&&Math.random()<.65?1:0):(playerCount>=2&&Math.random()<.45?1:0);
  for(let i=0;i<escorts;i++)list.push(makeEnemy(room,'minion','minion',.45));
  return list;
}
function skillActions(player){return (player.learnedSkills||[]).map(getSinnerSkill).filter(Boolean).map(s=>({...s,label:s.name,statLabel:{combat:'戰鬥',observe:'觀察',mobility:'機動',stability:'穩定'}[s.stat]||'技能'}));}
function actionsForPlayer(player){return [...BASIC_ACTIONS,...skillActions(player)];}
function actionForPlayer(player,id){return actionsForPlayer(player).find(a=>a.id===id)||null;}
function estimateDamage(room,player,action,target,part){
  if(!action||action.id==='guard'||action.id==='analyze'||action.kind==='heal'||action.kind==='team-buff')return {min:0,max:0,hit:100};
  const stat=Math.max(1,statFor(player,action.stat||'combat')),mult=Number(action.power||1.35),flat=action.id==='attack'?0:2;
  let min=Math.max(1,Math.round(stat*mult)+flat),max=min+6;
  if(action.bossBonus&&['boss','elite'].includes(target?.role)){min=Math.round(min*(1+action.bossBonus));max=Math.round(max*(1+action.bossBonus));}
  if(action.partBonus&&part){min=Math.round(min*(1+action.partBonus));max=Math.round(max*(1+action.partBonus));}
  if(action.minionBonus&&target?.role==='minion'){min=Math.round(min*(1+action.minionBonus));max=Math.round(max*(1+action.minionBonus));}
  if(action.dangerScale){const m=1+room.exploration.danger*action.dangerScale;min=Math.round(min*m);max=Math.round(max*m);}
  const defense=Math.max(5,(target?.defense||10)-(action.ignoreDefense||0)-(target?.defensePenalty||0));const mod=Math.round(stat/2);let hits=0;for(let d=1;d<=20;d++)if(d===20||d+mod>=defense)hits++;
  return {min,max,hit:Math.round(hits/20*100)};
}
function ensureTarget(combat,targetId){return aliveEnemies(combat).find(e=>e.instanceId===targetId)||primaryEnemy(combat);}
function selectCombatAction(room,player,{actionId,targetId,partId}){
  const combat=room.combat;if(!combat)throw new Error('目前不在戰鬥中。');
  const sel=combat.selections?.[player.id];if(sel?.confirmed)throw new Error('請先取消確認再修改行動。');
  const action=actionForPlayer(player,actionId);if(!action)throw new Error('無效的戰鬥行動。');
  if(action.id!=='attack'&&!BASIC_ACTIONS.some(a=>a.id===action.id)&&!(player.learnedSkills||[]).includes(action.id))throw new Error('尚未學會此技能。');
  const cooldown=Number(combat.cooldowns?.[player.id]?.[action.id]||0);if(cooldown>0)throw new Error(`技能冷卻中，剩餘 ${cooldown} 回合。`);
  const target=ensureTarget(combat,targetId),part=target?.parts?.find(p=>p.id===partId&&!p.destroyed)||null;
  combat.selections[player.id]={actionId:action.id,targetId:target?.instanceId||null,partId:part?.id||null,confirmed:false,preview:estimateDamage(room,player,action,target,part),label:action.label||action.name};
  persist();return combat.selections[player.id];
}
function cancelCombatConfirm(room,player){if(!room.combat)throw new Error('目前不在戰鬥中。');const s=room.combat.selections?.[player.id];if(s)s.confirmed=false;persist();}
function confirmCombatAction(room,player){
  if(!room.combat)throw new Error('目前不在戰鬥中。');const s=room.combat.selections?.[player.id];if(!s)throw new Error('請先選擇行動。');s.confirmed=true;persist();
  const active=room.players.filter(p=>p.connected&&p.hp>0);if(active.every(p=>room.combat.selections?.[p.id]?.confirmed))return resolveCombatRound(room);return null;
}
function rollIntent(enemy,combat){
  const base=Math.max(2,Math.round(enemy.attack*(enemy.role==='boss'?.78:enemy.role==='elite'?.72:.62)));
  const parts=(enemy.parts||[]).filter(p=>!p.destroyed);const canCharge=parts.some(p=>p.name==='攻擊部位');
  if(canCharge&&combat.round%3===0&&enemy.role!=='minion'){
    const p=parts.find(x=>x.name==='攻擊部位');return {type:'charged',label:'蓄力部位攻擊',damage:Math.round(base*1.7),target:'all',partId:p.id,blockRequired:Math.max(8,Math.round(p.maxHp*.48)),description:'在本回合對指定部位造成足夠傷害即可阻擋。'};
  }
  const unique=Array.isArray(enemy.skills)&&enemy.skills.length?randomFrom(enemy.skills):null;
  if(unique&&Math.random()<.42)return {type:unique.type||'attack',label:unique.label||'特殊攻擊',damage:Math.max(1,Math.round(base*Number(unique.mult||1))),target:(unique.type||'').includes('sweep')?'all':'single',statusId:unique.statusId||null,description:unique.description||''};
  return Math.random()<.24?{type:'heavy',label:'重擊',damage:Math.round(base*1.45),target:'single',description:`約 ${Math.round(base*1.45)} 傷害`}:{type:'attack',label:'攻擊',damage:base,target:'single',description:`約 ${base} 傷害`};
}
function setEnemyIntents(combat){combat.intents={};for(const e of aliveEnemies(combat))combat.intents[e.instanceId]=rollIntent(e,combat);const main=primaryEnemy(combat),intent=main?combat.intents[main.instanceId]:null;combat.intent=intent||null;combat.blockChallenge=intent?.type==='charged'?{enemyId:main.instanceId,partId:intent.partId,requiredDamage:intent.blockRequired,currentDamage:0,label:intent.label}:null;}
function startCombat(room,type){
  const enemies=spawnEncounter(room,type),main=enemies[0];
  room.combat={kind:type,enemies,enemy:main,round:1,log:[],options:BASIC_ACTIONS,selections:{},cooldowns:{},intents:{},intent:null,blockChallenge:null,lastResolution:null,chapter:room.areaIndex,difficultyLabel:chapterRule(room.areaIndex).label};
  setEnemyIntents(room.combat);room.currentEvent=null;room.eventResult=null;room.votes={};persist();
}
function applySkillUtility(room,player,action,target,dealt){
  if(action.shield)player.temporaryShield=Math.min(99,Number(player.temporaryShield||0)+action.shield);
  if(action.buff)addStatus(player,action.buff,2);
  if(action.statusId&&target)target.statuses=(target.statuses||[]).concat([{id:action.statusId,remaining:2}]);
  if(action.defenseDown&&target)target.defensePenalty=Math.min(8,Number(target.defensePenalty||0)+action.defenseDown);
  if(action.attackDown&&target)target.attackMultiplier=Math.max(.45,Number(target.attackMultiplier||1)*(1-action.attackDown));
  if(action.enemyDamageMult)for(const e of aliveEnemies(room.combat))e.attackMultiplier=Math.max(.45,Number(e.attackMultiplier||1)*action.enemyDamageMult);
  if(action.heal){const targets=action.team?room.players.filter(p=>p.hp>0):[player];for(const p of targets)healPlayer(p,action.heal);}
  if(action.cleanse){const deb=(player.statuses||[])[0];if(deb)removeStatus(player,deb.id);}
  if(action.lifesteal&&dealt>0)healPlayer(player,Math.max(1,Math.round(dealt*action.lifesteal)));
  if(action.dangerDown)room.exploration.danger=Math.max(0,room.exploration.danger-action.dangerDown);
  if(action.clue)room.exploration.clues+=action.clue;
}
function damageTarget(room,combat,player,action,target,part,die,total){
  const preview=estimateDamage(room,player,action,target,part),defense=Math.max(5,target.defense-(action.ignoreDefense||0)-(target.defensePenalty||0));
  if(die!==20&&total<defense)return 0;
  let dealt=preview.min+Math.floor(Math.random()*(Math.max(1,preview.max-preview.min+1)));
  if(part&&!part.destroyed){part.currentHp=Math.max(0,part.currentHp-dealt);if(combat.blockChallenge?.partId===part.id)combat.blockChallenge.currentDamage+=dealt;if(part.currentHp<=0){part.destroyed=true;if(part.name==='外殼'||part.name==='護甲')target.defensePenalty=Math.min(8,(target.defensePenalty||0)+2);if(part.name==='核心')target.attackMultiplier=Math.max(.6,(target.attackMultiplier||1)*.82);}target.currentHp=Math.max(0,target.currentHp-Math.round(dealt*.55));}
  else target.currentHp=Math.max(0,target.currentHp-dealt);
  return dealt;
}
function resolvePlayerAction(room,player,sel,guards,records){
  const combat=room.combat,action=actionForPlayer(player,sel.actionId),target=ensureTarget(combat,sel.targetId);if(!action||!target&&action.id!=='guard')return;
  const part=target?.parts?.find(p=>p.id===sel.partId&&!p.destroyed)||null,stat=statFor(player,action.stat||'combat'),die=1+Math.floor(Math.random()*20),total=die+Math.round(stat/2);let dealt=0;
  if(action.id==='guard'){guards.add(player.id);}else if(action.id==='analyze'){if(total>=10+Math.floor(room.exploration.danger/2)&&target){target.defensePenalty=Math.min(8,(target.defensePenalty||0)+1);room.exploration.clues+=1;}}
  else if(action.kind==='aoe'||action.kind==='aoe-debuff'){for(const e of aliveEnemies(combat))dealt+=damageTarget(room,combat,player,action,e,null,die,total);applySkillUtility(room,player,action,target,dealt);}
  else if(action.kind==='heal'||action.kind==='team-buff'){applySkillUtility(room,player,action,target,0);}
  else {dealt=damageTarget(room,combat,player,action,target,part,die,total);applySkillUtility(room,player,action,target,dealt);}
  if(!BASIC_ACTIONS.some(a=>a.id===action.id)){combat.cooldowns[player.id]=combat.cooldowns[player.id]||{};combat.cooldowns[player.id][action.id]=2;}
  records.push({playerId:player.id,sinner:sinnerOf(player)?.name||player.name,action:action.label||action.name,target:target?.name||'',part:part?.name||'',die,total,dealt});
}
function maybeSummon(room,combat,enemy){
  if(!enemy||enemy.currentHp<=0||enemy.role==='minion')return null;
  const minions=aliveEnemies(combat).filter(e=>e.role==='minion').length;if(minions>=2)return null;
  const chance=enemy.role==='boss'?.28:.18;if(combat.round<2||Math.random()>chance)return null;
  const m=makeEnemy(room,'minion','minion',enemy.role==='boss'?.42:.38);combat.enemies.push(m);return m;
}
function resolveEnemyActions(room,guards){
  const combat=room.combat,active=room.players.filter(p=>p.connected&&p.hp>0),results=[];let total=0;
  for(const enemy of aliveEnemies(combat)){
    const intent=combat.intents[enemy.instanceId]||rollIntent(enemy,combat);
    if(intent.type==='charged'&&combat.blockChallenge?.enemyId===enemy.instanceId&&combat.blockChallenge.currentDamage>=combat.blockChallenge.requiredDamage){results.push({enemyId:enemy.instanceId,label:intent.label,blocked:true,damage:0});continue;}
    const targets=intent.target==='all'?active:[randomFrom(active.filter(p=>p.hp>0))].filter(Boolean);let dsum=0;
    for(const p of targets){const mult=guards.has(p.id)?.48:1;const raw=Math.round(intent.damage*Number(enemy.attackMultiplier||1));const d=applyDamageToPlayer(p,raw,mult);dsum+=d;if(intent.statusId&&p.hp>0)addStatus(p,intent.statusId,2);}total+=dsum;results.push({enemyId:enemy.instanceId,label:intent.label,damage:dsum,targets:targets.map(p=>p.id)});
    const summoned=maybeSummon(room,combat,enemy);if(summoned)results[results.length-1].summoned=summoned.name;
  }
  return {total,results};
}
function victoryGold(room,kind){const d=room.exploration.danger,ch=room.areaIndex||0;const base=kind==='boss'?78:kind==='elite'?44:22;const variance=kind==='boss'?18:kind==='elite'?12:8;return Math.round(base+ch*(kind==='boss'?16:kind==='elite'?9:5)+d*2+Math.floor(Math.random()*(variance+1)));}
function finishVictory(room){
  const combat=room.combat,gold=victoryGold(room,combat.kind);for(const p of room.players)p.gold=(p.gold||0)+gold;
  room.eventResult={degree:combat.kind==='boss'?'boss-victory':'combat-victory',text:`戰鬥勝利。每位隊員獲得 ${gold} 金幣。`,gold};markCurrentNodeResolved(room);primeFogAfterResolution(room);
  if(combat.kind==='boss'){if(room.areaIndex<room.selectedAreas.length-1)room.eventResult.nextAreaAvailable=true;else room.phase='victory';}
}
function tickCooldowns(combat){for(const map of Object.values(combat.cooldowns||{}))for(const k of Object.keys(map))map[k]=Math.max(0,map[k]-1);}
function resolveCombatRound(room){
  const combat=room.combat;if(!combat)return null;const active=room.players.filter(p=>p.connected&&p.hp>0);if(active.some(p=>!combat.selections?.[p.id]?.confirmed))return null;
  const guards=new Set(),records=[];combat.blockChallenge&& (combat.blockChallenge.currentDamage=0);
  for(const p of active)resolvePlayerAction(room,p,combat.selections[p.id],guards,records);
  combat.enemies=combat.enemies.filter(e=>e.currentHp>0);
  if(!combat.enemies.length){finishVictory(room);combat.lastResolution={serial:Date.now(),players:records,victory:true,gold:room.eventResult.gold};combat.selections={};persist();return room.eventResult;}
  const enemyResult=resolveEnemyActions(room,guards);tickStatuses(room.players,{combatRound:true});tickCooldowns(combat);combat.round+=1;combat.selections={};setEnemyIntents(combat);checkDefeat(room);
  combat.log.push({round:combat.round-1,text:`隊伍完成行動；敵方造成 ${enemyResult.total} 總傷害。`});combat.lastResolution={serial:Date.now(),players:records,enemyResults:enemyResult.results,incoming:enemyResult.total,blockChallenge:combat.blockChallenge};persist();return combat.lastResolution;
}
function useConsumable(room,player,slot){
  if(!Number.isInteger(slot)||slot<0||slot>=player.inventory.length)throw new Error('找不到這個道具。');const item=player.inventory[slot];if(!item)throw new Error('這個道具欄是空的。');const def=CONSUMABLES.find(x=>x.id===item.id)||item;let message='';
  if(def.kind==='heal'||def.kind==='cleanse'){const healed=healPlayer(player,Number(def.power||0));if(def.removeStatus)removeStatus(player,def.removeStatus);message=`${player.name} 使用「${def.name}」，恢復 ${healed} HP。`;}
  else if(def.kind==='buff'){addStatus(player,def.status||'steady-mind',3);message=`${player.name} 使用「${def.name}」。`;}
  else if(def.kind==='guard'){player.temporaryShield=Math.min(99,(player.temporaryShield||0)+Number(def.power||15));message=`${player.name} 獲得臨時防護。`;}
  else if(def.kind==='enemy-debuff'||def.kind==='combat'){if(!room.combat)throw new Error('這個道具只能在戰鬥中使用。');for(const e of aliveEnemies(room.combat))e.attackMultiplier=Math.max(.5,(e.attackMultiplier||1)*.75);message=`${player.name} 使用「${def.name}」，敵方攻擊被削弱。`;}
  else if(def.kind==='boss'){if(!room.combat||room.combat.kind!=='boss')throw new Error('這個道具只能在 Boss 戰使用。');const e=primaryEnemy(room.combat);e.defensePenalty=Math.min(8,(e.defensePenalty||0)+Number(def.power||2));message=`${player.name} 使用「${def.name}」，Boss 防禦下降。`;}
  else throw new Error('這個道具目前沒有可使用效果。');player.inventory.splice(slot,1);persist();return message;
}
module.exports={COMBAT_ACTIONS,BASIC_ACTIONS,startCombat,selectCombatAction,confirmCombatAction,cancelCombatConfirm,resolveCombatRound,useConsumable,checkDefeat,actionsForPlayer,estimateDamage};
