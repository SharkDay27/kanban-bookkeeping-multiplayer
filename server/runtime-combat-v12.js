const legacy=require('./runtime-combat-v10');
const {persist}=require('./room-manager');

function isCombatVictory(room){
  return ['combat-victory','boss-victory'].includes(room?.eventResult?.degree);
}
function assertCombatOpen(room){
  if(!room?.combat)throw new Error('目前不在戰鬥中。');
  if(room.combat.ended||isCombatVictory(room))throw new Error('這場戰鬥已經結束。');
}
function selectCombatAction(room,player,payload){assertCombatOpen(room);return legacy.selectCombatAction(room,player,payload);}
function cancelCombatConfirm(room,player){assertCombatOpen(room);return legacy.cancelCombatConfirm(room,player);}
function confirmCombatAction(room,player){
  assertCombatOpen(room);
  const beforeGold=room.players.reduce((s,p)=>s+Number(p.gold||0),0);
  const result=legacy.confirmCombatAction(room,player);
  if(isCombatVictory(room)){
    room.combat.ended=true;
    room.combat.endedAt=Date.now();
    room.combat.rewardGranted=true;
    room.combat.selections={};
    room.combat.intents={};
    room.combat.intent=null;
    room.combat.blockChallenge=null;
    room.combat.finalGoldDelta=Math.max(0,room.players.reduce((s,p)=>s+Number(p.gold||0),0)-beforeGold);
    persist();
  }
  return result;
}
function useConsumable(room,player,slot){
  const item=player?.inventory?.[slot];
  const combatOnly=['enemy-debuff','combat','boss'].includes(item?.kind);
  if(combatOnly)assertCombatOpen(room);
  return legacy.useConsumable(room,player,slot);
}
module.exports={...legacy,selectCombatAction,cancelCombatConfirm,confirmCombatAction,useConsumable,assertCombatOpen,isCombatVictory};
