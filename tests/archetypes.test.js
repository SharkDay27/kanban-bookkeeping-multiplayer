const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kbm-arch-'));process.env.DATA_DIR=dir;
const R=require('../server/room/room-manager'),Battle=require('../server/combat/combat-manager'),Flow=require('../server/combat/combat-flow'),Cards=require('../server/cards/card-manager'),I=require('../server/combat/initiative'),B=require('../server/status/battle-status'),A=require('../server/skills/archetypes'),C=require('../shared/cards'),G=require('../shared/game-data');
function fixture(sinner,first='player'){const {room:r,player:p}=R.createRoom('a'+sinner,'A');r.selectedAreas=['zone-1','zone-2','zone-3'];R.setSinner(r,p,sinner);R.resetForStart(r);Battle.startCombat(r,'combat');const e=r.combat.enemies[0];e.currentHp=e.maxHp=500;e.shield=0;e.parts=[];e.attack=5;r.combat.enemies=[e];p.hp=p.maxHp=100;
 I.order=()=>first==='player'?[{side:'player',id:p.id,name:p.name,total:7,mobility:7,rolls:[1]},{side:'enemy',id:e.instanceId,name:e.name,total:4,mobility:4,rolls:[1]}]:[{side:'enemy',id:e.instanceId,name:e.name,total:8,mobility:8,rolls:[1]},{side:'player',id:p.id,name:p.name,total:3,mobility:3,rolls:[1]}];
 Flow.movement(r);Flow.ready(r,p,'initiative',r.combat.initiativeSerial);return {r,p,e};}
function play(r,p,name,enemy,cost){const deck=r.combat.cardDecks[p.id],card=Cards.instance({...C.personalAbilities(p.sinnerId).find(a=>a.name===name),kind:'ability'});deck.hand.push(card);if(cost)deck.hand.push(cost);deck.abilityUses=0;return Cards.useAbility(r,p,{uid:card.uid,costId:cost?.uid,enemyId:enemy?.instanceId});}
const filler=()=>Cards.instance({name:'filler',kind:'action',faces:[{sin:'wrath',type:'slash',value:1},{sin:'wrath',type:'guard',value:1}]});
// Each prototype has six exclusive abilities, none repeated, and none of the generic draw-1 / shield-4 cards.
for(const id of ['04','07','08']){const list=C.personalAbilities(id),names=new Set(list.map(a=>a.name)),texts=new Set(list.map(a=>a.description));assert.equal(list.length,6);assert.equal(names.size,6);assert.equal(texts.size,6);assert(!list.some(a=>a.description==='抽 1 張牌。'||a.description==='自己獲得 4 護盾。'));}
// Ryōshū: ignite, detonate, spread, ash shield, kindle power.
{const {r,p,e}=fixture('04');assert.equal(r.combat.phase,'attack');play(r,p,'點火',e);assert.equal(B.stack(e,'burning'),2);B.add(e,'burning',2,2);const hp=e.currentHp;play(r,p,'焚稿',e);assert.equal(hp-e.currentHp,12);assert.equal(B.stack(e,'burning'),2);
 const e2={...JSON.parse(JSON.stringify(e)),instanceId:'e2',statuses:[]};r.combat.enemies.push(e2);play(r,p,'野火',e,filler());assert.equal(B.stack(e2,'burning'),2);
 play(r,p,'灰燼護身');assert.equal(p.temporaryShield,8);play(r,p,'赤墨淋漓');const before=B.stack(e,'burning');A.onHit(r,p,e);assert.equal(B.stack(e,'burning'),before+1);
 assert(G.SINNER_SKILLS.filter(s=>s.sinnerId==='04'&&!['heal','team-buff'].includes(s.kind)).every(s=>s.onHitStatus==='burning'));}
// Heathcliff: rupture bursts on each hit and wears down; grudge keeps the stacks; hunt adds damage; storm-hill power.
{const {r,p,e}=fixture('07');play(r,p,'敲裂',e);assert.equal(B.stack(e,'rupture'),2);assert.equal(A.onHit(r,p,e),4);assert.equal(B.stack(e,'rupture'),1);
 play(r,p,'不散的怨念');play(r,p,'追打');assert.equal(A.onHit(r,p,e),4);assert.equal(B.stack(e,'rupture'),1);
 r.combat.phaseSerial='next';assert.equal(A.onHit(r,p,e),2);assert.equal(B.stack(e,'rupture'),0);
 play(r,p,'嵐丘');A.onHit(r,p,e);assert.equal(B.stack(e,'rupture'),1);const hp=p.hp;play(r,p,'豁出去');assert.equal(p.hp,hp-3);assert.equal(B.stack(p,'damage-up'),2);}
// Ishmael: counter turns blocked dice into damage; anchor adds guard dice this exchange only; taunt redirects; detonate.
{const {r,p,e}=fixture('08','enemy');assert.equal(r.combat.phase,'defense');play(r,p,'迎浪');assert.equal(B.stack(p,'counter'),2);const hp=e.currentHp;assert.equal(A.onBlock(r,p,e,{attackTotal:4,net:1}),10);assert.equal(hp-e.currentHp,10);
 play(r,p,'錨定');assert.equal(A.guardBonus(r,p),2);const intent=Object.values(r.combat.intents)[0];intent.attackDice=Math.max(1,intent.attackDice);play(r,p,'代為受擊',null,filler());assert.equal(intent.targetPlayerId,p.id);assert.match(intent.description,/嘲諷/);assert.equal(B.stack(p,'counter'),3);
 play(r,p,'白鯨');A.onBlock(r,p,e,{attackTotal:2,net:0});assert.equal(B.stack(p,'counter'),4);const hp2=e.currentHp;play(r,p,'拋錨反打',e);assert.equal(hp2-e.currentHp,16);assert.equal(B.stack(p,'counter'),0);
 r.combat.phaseSerial='later';assert.equal(A.guardBonus(r,p),0);}
console.log('Archetype regressions passed: burn ignite/detonate/spread/ash/kindle, rupture burst/keep/hunt/storm, counter/anchor/taunt/moby/detonate, no duplicate abilities.');
