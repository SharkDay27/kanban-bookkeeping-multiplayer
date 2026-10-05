const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kbm-presentation-'));process.env.DATA_DIR=dir;
const Rooms=require('../server/room/room-manager'),B=require('../server/status/battle-status'),Battle=require('../server/combat/combat-manager'),Cards=require('../server/cards/card-manager'),Dice=require('../server/combat/opposed-dice'),I=require('../server/combat/initiative'),E=require('../server/expedition/expedition-manager'),G=require('../shared/game-data');
const originalRoll=Dice.roll,originalOrder=I.order;
try{
 const {room:r,player:p}=Rooms.createRoom('test','test');r.selectedAreas=['zone-1','zone-2','zone-3'];Rooms.setSinner(r,p,'04');Rooms.resetForStart(r);
 // Every state application is recorded, even reapplication at the cap or later removal.
 for(const def of G.STATUS_EFFECTS){const e=def.id==='imprint'?{id:'sinclair',sinnerId:'11',statuses:[]}:p;const events=B.captureEffects(()=>{B.add(e,def.id,2,9);B.add(e,def.id,3,1);e.statuses=[];});assert.equal(events.length,2,def.id);assert.equal(events[0].targetId,e.id);assert.equal(events[0].statusId,def.id);assert.equal(events[1].stacks,9);}
 assert.throws(()=>B.captureEffects(()=>{throw new Error('abort');}));assert.equal(B.captureEffects(()=>B.add(p,'agile')).length,1);
 // Apply a weapon state on a real attack, and an enemy state on its real turn.
 Battle.startCombat(r,'combat');const enemy=r.combat.enemies[0];enemy.currentHp=enemy.maxHp=9999;enemy.shield=0;enemy.parts=[];r.combat.enemies=[enemy];p.equipment.weapon.onHitStatus='bleeding';
 I.order=()=>[{side:'player',id:p.id,name:'test',mobility:7,total:7,rolls:[1]},{side:'enemy',id:enemy.instanceId,name:enemy.name,mobility:5,total:5,rolls:[1]}];Dice.roll=n=>Array(n).fill(1);
 const Flow=require('../server/combat/combat-flow');Flow.movement(r);Flow.ready(r,p,'initiative',r.combat.initiativeSerial);r.combat.intents={[enemy.instanceId]:{type:'status',target:'single',attackDice:5,defenseDice:0,damagePerPoint:3,statusId:'sealed',cardPlan:{},label:'封印'}};
 const d=r.combat.cardDecks[p.id];d.hand=[Cards.instance({name:'test',kind:'action',faces:[{sin:'wrath',value:3,type:'slash'},{sin:'wrath',value:3,type:'guard'}]})];
 Battle.selectCombatCards(r,p,{picks:d.hand.map(c=>({uid:c.uid,flipped:false})),targetId:enemy.instanceId});Battle.confirmCombatAction(r,p);
 const res=r.combat.lastResolution;assert(res.players.some(x=>x.statusEvents?.some(e=>e.targetId===enemy.instanceId&&e.statusId==='bleeding')));assert(res.enemyResults.every(x=>!x.clashes?.length&&!x.damage));Flow.ready(r,p,'resolution',res.serial);assert.equal(r.combat.phase,'defense');r.combat.intents={[enemy.instanceId]:{type:'status',target:'single',attackDice:5,defenseDice:0,damagePerPoint:3,statusId:'sealed',cardPlan:{},label:'封印'}};Battle.selectCombatCards(r,p,{picks:[]});Battle.confirmCombatAction(r,p);assert(r.combat.lastResolution.timeline.some(x=>x.side==='status'&&x.events.some(e=>e.targetId===p.id&&e.statusId==='sealed')));
 // Boss completion advances both subsequent chapters, with resources carried forward.
 for(let index=0;index<3;index++){p.hp=80;r.exploration.position=Rooms.BOSS_INDEX;r.exploration.route[Rooms.BOSS_INDEX]={selected:true,type:'boss'};r.combat.kind='boss';r.combat.playerStartHp={[p.id]:80};require('../server/combat/combat-rewards').finishVictory(r);r.combat.ended=true;
  if(index<2){assert.equal(r.phase,'exploration');assert(r.eventResult.nextAreaAvailable);const gold=p.gold;r.cardChoices={};r.relicChoices={};assert(E.advanceChapterAfterBoss(r));assert.equal(r.areaIndex,index+1);assert.equal(r.exploration.difficultyLabel,['中級','高級'][index]);assert.equal(r.exploration.position,0);assert(r.exploration.choiceLayers[0].length);assert.equal(p.gold,gold);assert.equal(p.hp,100);assert.equal(r.exploration.danger,0);Battle.startCombat(r,'boss');}
  else {assert.equal(r.phase,'victory');assert(!r.eventResult.nextAreaAvailable);}
 }
 console.log('Battle presentation regressions passed: all state events, real actor timing, beginner → intermediate → advanced → victory.');
}finally{Dice.roll=originalRoll;I.order=originalOrder;fs.rmSync(dir,{recursive:true,force:true});}
