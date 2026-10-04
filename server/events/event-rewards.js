const {getStatus,CONSUMABLES,EQUIPMENT}=require('../../shared/game-data');
const {ECONOMY,eventGoldRange}=require('../economy');
const {randomFrom,pickPositiveStatus}=require('../expedition/danger-system');
const {addStatus,randomStatus,dangerShield,applyDamageToPlayer}=require('../status/status-manager');
const {addEquipment}=require('../equipment/equipment-manager');

function maybePositiveStatus(room,player,bonus=0){const chance=.08+room.exploration.danger*.035+(room.areaIndex||0)*.04+bonus;if(Math.random()>chance)return null;const status=pickPositiveStatus(room,player);addStatus(player,status.id);return status;}
function maybeNegativeStatus(room,severity=1){const chance=.05+room.exploration.danger*.03+(room.areaIndex||0)*.03+severity*.025;if(Math.random()>chance)return null;const targets=room.players.filter(p=>p.hp>0);if(!targets.length)return null;const target=randomFrom(targets),status=randomStatus('debuff');addStatus(target,status.id);return {playerId:target.id,statusId:status.id,name:status.name};}
function awardGoldToParty(room,amount){const value=Math.max(0,Math.round(amount||0));if(!value)return 0;for(const player of room.players)player.gold=Math.max(0,Number(player.gold||0)+value);return value;}
function eventGold(room,degree){const range=eventGoldRange(degree),chance=ECONOMY.eventGoldChance[degree]||0;if(!range||Math.random()>chance)return 0;const [min,max]=range,danger=Number(room.exploration.danger||0),chapter=room.areaIndex||0;return awardGoldToParty(room,min+Math.floor(Math.random()*(max-min+1))+chapter*ECONOMY.eventChapterBonus+Math.floor(danger/2));}
function chooseRarity(room){const danger=Number(room.exploration?.danger||0),chapter=Number(room.areaIndex||0),rare=Math.min(.38,.06+danger*.025+chapter*.055),uncommon=Math.min(.62,.28+danger*.03+chapter*.05),r=Math.random();return r<rare?'rare':r<rare+uncommon?'uncommon':'common';}
function pickLoot(room,type){const source=type==='equipment'?EQUIPMENT:CONSUMABLES,rarity=chooseRarity(room),exact=source.filter(x=>x.rarity===rarity);return JSON.parse(JSON.stringify(randomFrom(exact.length?exact:source)));}
function grantEventReward(room,event,check){
  if(!event?.rewardByAction||!check?.contributions?.length||!['critical','success','mixed'].includes(check.degree))return null;
  const candidates=check.contributions.map(c=>({playerId:c.playerId,rule:event.rewardByAction[c.actionId]})).filter(x=>x.rule);
  if(!candidates.length)return null;const picked=randomFrom(candidates),degreeMult=check.degree==='critical'?1.25:check.degree==='mixed'?.45:1,chance=Math.min(.95,Number(picked.rule.chance||0)*degreeMult);if(Math.random()>chance)return null;
  const recipient=room.players.find(p=>p.id===picked.playerId&&p.connected)||randomFrom(room.players.filter(p=>p.connected&&p.hp>0));if(!recipient)return null;
  const item=pickLoot(room,picked.rule.type);if(picked.rule.type==='equipment')addEquipment(recipient,item);else if(recipient.inventory.length<4)recipient.inventory.push(item);else room.sharedInventory.push(item);
  return {playerId:recipient.id,playerName:recipient.name,type:picked.rule.type,item};
}
function outcomeForDegree(room,degree,balance){
  let damage=0,cluesDelta=0,dangerDelta=0;
  if(degree==='critical'){cluesDelta=2;dangerDelta=-1;}else if(degree==='success')cluesDelta=1;else if(degree==='mixed'){cluesDelta=1;dangerDelta=1;damage=3;}else if(degree==='failure'){dangerDelta=2;damage=7;}else{dangerDelta=3;damage=11;}
  damage=Math.max(0,Math.round(damage*balance.eventDamage));dangerDelta=dangerDelta>0?Math.max(1,Math.round(dangerDelta*balance.dangerGain)):dangerDelta;
  const active=room.players.filter(p=>p.connected&&p.hp>0),partyShield=Math.max(...active.map(dangerShield),0);if(dangerDelta>0)dangerDelta=Math.max(0,dangerDelta-partyShield);
  const actualDamage=[];if(damage)for(const player of active)actualDamage.push({playerId:player.id,amount:applyDamageToPlayer(player,damage)});
  room.exploration.clues=Math.max(0,room.exploration.clues+cluesDelta);room.exploration.danger=Math.max(0,Math.min(room.exploration.dangerMax,room.exploration.danger+dangerDelta));
  const debuff=['failure','critical-failure'].includes(degree)?maybeNegativeStatus(room,degree==='critical-failure'?3:1):null,buffTarget=['critical','success'].includes(degree)?randomFrom(active):null,buff=buffTarget?maybePositiveStatus(room,buffTarget,degree==='critical'?.1:0):null,gold=eventGold(room,degree);
  return {damage,actualDamage,cluesDelta,dangerDelta,gold,statusApplied:debuff||(buff?{playerId:buffTarget.id,statusId:buff.id,name:buff.name}:null)};
}
module.exports={maybePositiveStatus,maybeNegativeStatus,awardGoldToParty,eventGold,outcomeForDegree,grantEventReward};
