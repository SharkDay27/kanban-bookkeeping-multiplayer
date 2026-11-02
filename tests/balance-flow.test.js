const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kbm-balance-'));process.env.DATA_DIR=dir;
const R=require('../server/room/room-manager'),Battle=require('../server/combat/combat-manager'),Flow=require('../server/combat/combat-flow'),D=require('../server/combat/opposed-dice'),I=require('../server/combat/initiative'),B=require('../server/status/battle-status'),P=require('../server/combat/combat-parts');
function fixture(first='player'){const {room:r,player:p}=R.createRoom('b1','A');r.selectedAreas=['zone-1','zone-2','zone-3'];R.setSinner(r,p,'04');const q=R.joinRoom(r.id,'b2','B').player;R.setSinner(r,q,'08');R.resetForStart(r);Battle.startCombat(r,'combat');const e=r.combat.enemies[0];e.currentHp=e.maxHp=9999;e.parts=[];e.attack=5;r.combat.enemies=[e];r.players.forEach(p=>{p.hp=p.maxHp=100;});
 I.order=()=>first==='player'?[...r.players.map(p=>({side:'player',id:p.id,name:p.name,total:7,mobility:7,rolls:[1]})),{side:'enemy',id:e.instanceId,name:e.name,total:4,mobility:4,rolls:[1]}]:[{side:'enemy',id:e.instanceId,name:e.name,total:8,mobility:8,rolls:[1]},...r.players.map(p=>({side:'player',id:p.id,name:p.name,total:3,mobility:3,rolls:[1]}))];Flow.movement(r);return r;}
const ackAll=(r,kind)=>{const serial=kind==='initiative'?r.combat.initiativeSerial:r.combat.lastResolution.serial;for(const p of r.players)Flow.ready(r,p,kind,serial);};
const confirmAll=r=>{for(const p of r.players)Battle.confirmCombatAction(r,p);};
const oldRoll=D.roll;
try{
 D.roll=n=>Array(n).fill(1);
 // Enemy single-target attacks show their target when the exchange opens, and hit that player.
 let r=fixture('enemy'),c=r.combat,[p,q]=r.players;ackAll(r,'initiative');assert.equal(c.phase,'defense');const intent=Object.values(c.intents)[0];
 if(intent.attackDice>0&&intent.target!=='all'){assert(intent.targetPlayerId);assert.match(intent.description,/目標：/);const victim=r.players.find(x=>x.id===intent.targetPlayerId),other=r.players.find(x=>x.id!==victim.id),hp=other.hp;confirmAll(r);assert.equal(other.hp,hp,'only the announced target is attacked');}
 // Player shields halve at the end of each round instead of piling up.
 r=fixture();c=r.combat;[p,q]=r.players;p.temporaryShield=20;ackAll(r,'initiative');confirmAll(r);ackAll(r,'resolution');assert.equal(c.exchange,2);confirmAll(r);assert(p.temporaryShield<=10,'shield halved: '+p.temporaryShield);
 // Part damage: the part absorbs up to its HP; only the overflow reaches the body (no more 155%).
 {const e={maxHp:200,currentHp:200,instanceId:'x',parts:[]};const part={id:'x-p',type:'armor',maxHp:20,currentHp:20,destroyed:false,hidden:false};e.parts=[part];P.applyPartDamage({},e,part,15);assert.equal(e.currentHp,200);assert.equal(part.currentHp,5);P.applyPartDamage({},e,part,12);assert(part.destroyed);assert.equal(e.currentHp,193);}
 // Paralysis triggers at 3 stacks, and is not spent on an enemy's guard turn.
 {const e={instanceId:'z',currentHp:50,maxHp:50,statuses:[]};B.add(e,'paralysis',2,2);assert(!B.skip(e));B.add(e,'paralysis',2,1);assert(B.skip(e));}
 // "1 組攻守": a status applied in the first exchange expires after this round; one applied in the second survives the next round.
 {const e={instanceId:'y',currentHp:50,maxHp:50,statuses:[]};B.setExchange(1);B.add(e,'vulnerable',1);B.tick(e);assert.equal(B.stack(e,'vulnerable'),0);B.setExchange(2);B.add(e,'vulnerable',1);B.tick(e);assert.equal(B.stack(e,'vulnerable'),1);B.tick(e);assert.equal(B.stack(e,'vulnerable'),0);}
 console.log('Balance regressions passed: announced targets, shield halving, part overflow, paralysis 3, exchange-aware durations.');
}finally{D.roll=oldRoll;}
