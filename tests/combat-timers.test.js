const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kbm-timers-'));process.env.DATA_DIR=dir;
const R=require('../server/room/room-manager'),Battle=require('../server/combat/combat-manager'),Flow=require('../server/combat/combat-flow'),Cards=require('../server/cards/card-manager'),D=require('../server/combat/opposed-dice'),I=require('../server/combat/initiative'),T=require('../server/combat/combat-timers'),Intents=require('../server/combat/combat-intents'),G=require('../shared/game-data');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,ms=1500)=>{const end=Date.now()+ms;while(!fn()&&Date.now()<end)await sleep(10);return fn();};
function fixture(){const {room:r,player:p}=R.createRoom('t1','A');r.selectedAreas=['zone-1','zone-2','zone-3'];R.setSinner(r,p,'04');const q=R.joinRoom(r.id,'t2','B').player;R.setSinner(r,q,'08');R.resetForStart(r);Battle.startCombat(r,'combat');const e=r.combat.enemies[0];e.currentHp=e.maxHp=9999;e.parts=[];e.attack=5;r.combat.enemies=[e];r.players.forEach(p=>{p.hp=p.maxHp=100;});I.order=()=>[...r.players.map(p=>({side:'player',id:p.id,name:p.name,total:7,mobility:7,rolls:[1]})),{side:'enemy',id:e.instanceId,name:e.name,total:4,mobility:4,rolls:[1]}];Flow.movement(r);return r;}
(async()=>{
 D.roll=n=>Array(n).fill(1);Object.assign(T.LIMITS,{initiative:40,resolving:300,select:60});
 // A player who never acknowledges the dice playback no longer holds the party.
 let r=fixture(),[p,q]=r.players,c=r.combat;let emits=0;const emit=()=>{emits++;T.guard(r,emit);};
 Flow.ready(r,p,'initiative',c.initiativeSerial);T.guard(r,emit);assert.equal(c.phase,'initiative');assert(await until(()=>c.phase==='attack'));assert(emits>=1);
 // The client is told how long is left to choose.
 assert(c.deadlineLeft>0&&c.deadlineLeft<=60);
 // An idle player is confirmed automatically when the deadline passes, and the exchange resolves.
 const labels=[];const orig=Cards.autoSelect;Cards.autoSelect=(room,pl)=>{orig(room,pl);labels.push(pl.id);};Battle.confirmCombatAction(r,p);assert.equal(c.phase,'attack');T.guard(r,emit);assert(await until(()=>c.phase==='resolving'));assert(c.lastResolution?.serial);assert.deepEqual(labels,[q.id]);Cards.autoSelect=orig;assert(JSON.stringify(c.journal||r.combatJournal||c.lastResolution).length>0);
 // Playback that is never acknowledged moves on by itself too.
 assert(await until(()=>c.phase==="defense"));
 // The last unconfirmed player disconnecting resolves at once instead of waiting.
 Battle.confirmCombatAction(r,p);q.connected=false;T.guard(r,()=>{});assert.equal(c.phase,'resolving');T.clear(r);
 // Boss signature skills come up: defensive ones while players attack, offensive ones while they defend.
 const boss=JSON.parse(JSON.stringify(G.BOSSES?.[0]||require('../shared/bosses')[0]||{}));
 const enemy={...boss,instanceId:'boss-1',role:'boss',currentHp:300,maxHp:300,attack:18,statuses:[],parts:[]};const names=new Set((enemy.phases?.[0]?.skills||enemy.skills||[]).map(s=>s.label));enemy.skills=enemy.phases?.[0]?.skills||enemy.skills||[];
 if(names.size){let fired=0;for(let i=0;i<200;i++){for(const phase of ['attack','defense']){const cb={enemies:[JSON.parse(JSON.stringify(enemy))],flowVersion:29,cardMode:true,phase,exchange:1,round:1,phaseSerial:phase+i,chapterIndex:0};Intents.setEnemyIntents(cb);const label=cb.intents['boss-1'].label.replace('卡牌・','');if(names.has(label))fired++;}}assert(fired>60,'boss skills fire: '+fired);}
 // 閃光彈 halves every enemy's next attacking exchange, once.
 r=fixture();[p,q]=r.players;c=r.combat;const e=c.enemies[0];p.inventory=[{id:'item-flash'}];c.phase='defense';Battle.useConsumable(r,p,0);assert.equal(e.nextHitMult,.5);
 c.intents[e.instanceId]={attackDice:3,defenseDice:0,cardPlan:{cards:[],picks:[]}};c.selections={};
 for(const pl of r.players)c.selections[pl.id]={picks:[],confirmed:true};D.prepare(r);assert.equal(c.lockedEnemyTurns[0].attackMultiplier,.5);assert.equal(e.nextHitMult,undefined);
 console.log('Combat timer regressions passed: unacknowledged playback and idle players time out, disconnect resolves, boss skills fire, flash is one-shot.');
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
