// Sinner archetype mechanics (prototype: Ryōshū burn, Heathcliff rupture, Ishmael counter).
// apply()   – extra card/skill fields, called from applySkillUtility for every ability card and skill.
// onHit()   – when a player's attack lands on an enemy: rupture bursts, on-hit powers, rupture-hunt bonus.
// onBlock() – when an enemy attack meets a player's guard: counter damage and the Moby Dick power.
// Battle-long powers and per-exchange flags live on room.combat.archetype, so they end with the combat.
const B=require('../status/battle-status');
const state=c=>c.archetype||(c.archetype={powers:{},flags:{}});
const powers=(c,id)=>state(c).powers[id]||(state(c).powers[id]={});
// Per-exchange flags are keyed by the phase serial, so they lapse when the exchange changes.
const setFlag=(c,id,key,value)=>{const f=state(c).flags[id]||(state(c).flags[id]={});f[key]={serial:c.phaseSerial,value};};
const flag=(c,id,key)=>{const f=state(c).flags[id]?.[key];return f&&f.serial===c.phaseSerial?f.value:null;};
const J=(room,text)=>(room.combat.log=room.combat.log||[]).push({round:room.combat.round,text});
// Damage straight to an enemy (shield first), for detonations and counters.
function hurt(enemy,n){n=Math.max(0,Math.round(n));if(!n||enemy.currentHp<=0)return 0;const absorbed=Math.min(Number(enemy.shield||0),n);enemy.shield=Number(enemy.shield||0)-absorbed;const hp=n-absorbed;enemy.currentHp=Math.max(0,enemy.currentHp-hp);return n;}
function apply(room,player,action,target){const c=room.combat;if(!c)return;const alive=c.enemies.filter(e=>e.currentHp>0);
 if(action.detonate&&target){const {status,per}=action.detonate,n=B.stack(target,status);if(n){const dealt=hurt(target,n*per),s=target.statuses.find(x=>x.id===status);s.stacks=Math.floor(n/2);if(s.stacks<=0)target.statuses=target.statuses.filter(x=>x!==s);J(room,`${player.name} 引爆 ${target.name} 的燒傷 ${n} 層，造成 ${dealt} 傷害。`);}}
 if(action.spreadStatus&&target){const {status,ratio,max,duration}=action.spreadStatus,n=Math.min(max,Math.floor(B.stack(target,status)*ratio));if(n>0)for(const e of alive)if(e!==target)B.add(e,status,duration||2,n);}
 if(action.shieldPerStatus){const {status,per,max}=action.shieldPerStatus,total=alive.reduce((s,e)=>s+B.stack(e,status),0),amount=Math.min(max,total*per);if(amount>0)B.grantShield(player,amount);}
 if(action.drawIfStatus&&target&&B.stack(target,action.drawIfStatus.status)>0){const deck=c.cardDecks?.[player.id];if(deck)require('../cards/card-manager').draw(deck,action.drawIfStatus.n||1);}
 if(action.power){powers(c,player.id)[action.power]=true;J(room,`${player.name} 進入整場能力「${action.name||action.power}」。`);}
 if(action.ruptureKeep)setFlag(c,player.id,'ruptureKeep',true);
 if(action.ruptureHunt)setFlag(c,player.id,'ruptureHunt',action.ruptureHunt);
 if(action.selfDamage){player.hp=Math.max(1,Number(player.hp)-action.selfDamage);}
 if(action.boostStatus)B.add(player,action.boostStatus,action.statusDuration||1,action.boostStacks||1);
 if(action.selfCounter)B.add(player,'counter',action.counterDuration||1,action.selfCounter);
 if(action.guardBonus)setFlag(c,player.id,'guardBonus',action.guardBonus);
 if(action.taunt&&c.phase==='defense'){const who=require('../status/status-manager').sinnerOf(player)?.name||player.name;for(const intent of Object.values(c.intents||{})){if(!intent||intent.target==='all'||!(Number(intent.attackDice||0)>0))continue;intent.targetPlayerId=player.id;intent.targetName=who;intent.description=String(intent.description||'').replace(/ · 目標：.*$/,'')+' · 目標：'+who+'（嘲諷）';}for(const t of c.lockedEnemyTurns||[])if(t.intent&&t.intent.target!=='all')t.intent.targetPlayerId=player.id;B.add(player,'counter',1,1);}
 if(action.counterDetonate&&target){const n=B.stack(player,'counter');if(n){const dealt=hurt(target,n*action.counterDetonate);player.statuses=player.statuses.filter(s=>s.id!=='counter');J(room,`${player.name} 拋錨反打：消耗反擊 ${n} 層，對 ${target.name} 造成 ${dealt} 傷害。`);}}
 if(action.shieldIfDefense&&c.phase==='defense')B.grantShield(player,action.shieldIfDefense);
}
// Returns extra damage to add to a landed hit, then applies on-hit stacks.
function onHit(room,player,target){const c=room.combat;if(!c||!target||target.sinnerId)return 0;let extra=0;
 const r=B.stack(target,'rupture');if(r>0){extra+=2*r;if(!flag(c,player.id,'ruptureKeep')){const s=target.statuses.find(x=>x.id==='rupture');s.stacks-=1;if(s.stacks<=0)target.statuses=target.statuses.filter(x=>x!==s);}const hunt=flag(c,player.id,'ruptureHunt');if(hunt)extra+=hunt;}
 const p=state(c).powers[player.id]||{};if(p.kindle)B.add(target,'burning',2,1);if(p.stormHill)B.add(target,'rupture',3,1);
 return extra;}
function guardBonus(room,player){return Number(room.combat&&flag(room.combat,player.id,'guardBonus')||0);}
// An enemy attack met this player's guard: each blocked hit die strikes back.
function onBlock(room,player,enemy,clash){const c=room.combat;if(!c||!clash||!(clash.attackTotal>0))return 0;const blocked=Math.max(0,clash.attackTotal-clash.net);if(!blocked)return 0;let dealt=0;
 const n=B.stack(player,'counter');if(n>0){dealt=hurt(enemy,blocked*2+n*2);if(dealt)J(room,`${player.name} 反擊 ${enemy.name}：擋下 ${blocked} 顆，造成 ${dealt} 傷害。`);}
 if(state(c).powers[player.id]?.mobyDick)B.add(player,'counter',1,1);
 return dealt;}
module.exports={apply,onHit,onBlock,guardBonus,hurt};
