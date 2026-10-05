const crypto=require('crypto');
const {getStatus}=require('../../shared/status-effects');
let effectSink=null;
function captureEffects(run){const prior=effectSink,events=[];effectSink=events;try{run();return events;}finally{effectSink=prior;}}
const stack=(e,id)=>Math.max(0,Number((e.statuses||[]).find(s=>s.id===id&&s.remaining>0)?.stacks||((e.statuses||[]).some(s=>s.id===id&&s.remaining>0)?1:0)));
function add(e,id,duration=2,amount=1){if(!e||!getStatus(id)||(id==='imprint'&&e.sinnerId!=='11'))return false;e.statuses=e.statuses||[];const s=e.statuses.find(s=>s.id===id);if(s){s.stacks=Math.min(9,Number(s.stacks||1)+amount);s.remaining=Math.max(s.remaining,duration);s.fresh=true;}else e.statuses.push({id,remaining:duration,stacks:Math.min(9,amount),fresh:true});if(effectSink)effectSink.push({targetId:e.sinnerId?e.id:e.instanceId,side:e.sinnerId?'player':'enemy',statusId:id,stacks:stack(e,id),duration});return true;}
function mods(e){const out={combat:0,observe:0,mobility:0,stability:0};for(const s of e.statuses||[]){const d=getStatus(s.id);if(s.remaining<=0||!d)continue;for(const k of Object.keys(out))out[k]+=Number(d.mods?.[k]||0)*(d.stacking?Number(s.stacks||1):1);}for(const k of Object.keys(out))out[k]+=Number(e.markMods?.[k]||0);return out;}
function mobility(e){const base=e.sinnerId?require('./status-manager').statFor(e,'mobility'):Number(e.mobility||5)+mods(e).mobility;return Math.max(0,base);}
const probability=e=>Math.max(.2,.5-.05*stack(e,'sinking'));
const handTarget=e=>Math.max(3,6-Math.floor(stack(e,'tremor')/3));
const handLimit=e=>handTarget(e)+2;
function trimHand(e,deck){if(!deck)return;const over=Math.max(0,deck.hand.length-handLimit(e));if(over)deck.discard.push(...deck.hand.splice(-over));}
const sealed=e=>stack(e,'sealed')>0;
function skip(e){if(stack(e,'paralysis')<4)return false;const s=e.statuses.find(s=>s.id==='paralysis');s.stacks-=4;if(s.stacks<=0)e.statuses=e.statuses.filter(x=>x!==s);return true;}
const attackPenalty=e=>stack(e,'burning')+stack(e,'suppressed')*3+stack(e,'attack-down')+Math.max(0,-mods(e).combat);
const defensePenalty=e=>stack(e,'suppressed')*3+stack(e,'defense-down');
const outgoing=e=>(stack(e,'terror')>0?.5:1);
const vulnerability=e=>1+Math.min(.6,.1*stack(e,'vulnerable'));
const flatDamage=e=>Math.min(12,2*stack(e,'damage-up'));
function grantShield(e,n){const before=Number(e.sinnerId?e.temporaryShield:e.shield)||0;if(e.sinnerId)e.temporaryShield=Math.min(99,Number(e.temporaryShield||0)+n);else {e.shield=Math.min(Math.round(e.maxHp*.6),Number(e.shield||0)+n);e.maxShield=Math.max(e.maxShield||0,e.shield);}const amount=Number(e.sinnerId?e.temporaryShield:e.shield)-before;if(effectSink&&amount>0){const targetId=e.sinnerId?e.id:e.instanceId,last=effectSink[effectSink.length-1];if(last?.targetId===targetId&&last.statusId==='shield')last.amount=amount;else effectSink.push({targetId,side:e.sinnerId?'player':'enemy',statusId:'shield',amount});}}
function tick(e){const alive=e.sinnerId?e.hp>0:e.currentHp>0;let damage=0,healed=0;if(alive){damage=2*stack(e,'bleeding')+2*stack(e,'burning');if(e.sinnerId){if(damage)require('./status-manager').applyDamageToPlayer(e,damage);if(e.hp>0)healed=require('./status-manager').healPlayer(e,3*stack(e,'regeneration'));}else {e.currentHp=Math.max(0,e.currentHp-damage);if(e.currentHp>0){const before=e.currentHp;e.currentHp=Math.min(e.maxHp,e.currentHp+3*stack(e,'regeneration'));healed=e.currentHp-before;}}}for(const s of e.statuses||[]){if(s.fresh)s.fresh=false;else if(s.id!=='imprint')s.remaining--;}e.statuses=(e.statuses||[]).filter(s=>s.remaining>0);return {damage,healed};}
function imprint(e){if(e.sinnerId!=='11')return;add(e,'imprint',99,1);const count=Math.min(3,stack(e,'imprint')),keys=['combat','stability','mobility'],key=keys[crypto.randomInt(0,3)];e.markMods={[key]:count};}
module.exports={captureEffects,stack,add,mods,mobility,probability,handTarget,handLimit,trimHand,sealed,skip,attackPenalty,defensePenalty,outgoing,vulnerability,flatDamage,grantShield,tick,imprint};
