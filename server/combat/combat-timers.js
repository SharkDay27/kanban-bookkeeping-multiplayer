// Keeps a combat from stalling on one player: a background tab that never acknowledges playback, an idle player who
// never confirms, or the last unconfirmed player disconnecting. Each waiting step gets a deadline; when it passes the
// server acknowledges or confirms for whoever is missing. Timers live in memory and are rebuilt from the stored
// deadline on the next room update after a restart.
const LIMITS={initiative:15000,resolving:40000,select:75000};
const timers=new Map();
const active=room=>room.players.filter(p=>p.connected&&p.hp>0);
function step(c){
  if(c.phase==='initiative')return {kind:'initiative',key:'i:'+c.initiativeSerial};
  if(c.phase==='resolving')return {kind:'resolving',key:'r:'+(c.lastResolution?.serial||'')};
  if(['attack','defense'].includes(c.phase))return {kind:'select',key:'s:'+c.phaseSerial};
  return null;
}
function clear(room){const t=timers.get(room.id);if(t){clearTimeout(t.handle);timers.delete(room.id);}}
function expire(room){
  const c=room.combat,s=c&&step(c);if(!s)return;
  if(s.kind==='select'){require('./combat-manager').forceConfirmAll(room);return;}
  for(const p of active(room))c.ready[p.id]=true;
  require('./combat-flow').advance(room);
}
// Call on every room update, before the update is sent. onExpire re-emits the room after a deadline fires.
function guard(room,onExpire){
  const c=room.combat;
  if(room.phase!=='exploration'||!c||c.ended||!c.flowVersion){clear(room);return;}
  // Everyone still here has confirmed (e.g. the only holdout disconnected): resolve now instead of waiting.
  const actors=active(room);
  if(['attack','defense'].includes(c.phase)&&actors.length&&actors.every(p=>c.selections?.[p.id]?.confirmed))require('./combat-manager').resolveCombatRound(room);
  const s=step(c);if(!s){clear(room);return;}
  if(c.deadlineKey!==s.key){c.deadlineKey=s.key;c.deadline=Date.now()+LIMITS[s.kind];}
  c.deadlineLeft=s.kind==='select'?Math.max(0,c.deadline-Date.now()):null;
  if(timers.get(room.id)?.key===s.key)return;
  clear(room);
  const handle=setTimeout(()=>{timers.delete(room.id);const now=room.combat&&step(room.combat);if(!now||now.key!==s.key||room.combat.ended)return;expire(room);onExpire();},Math.max(50,c.deadline-Date.now()));
  timers.set(room.id,{key:s.key,handle});
}
module.exports={guard,clear,LIMITS};
