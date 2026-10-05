const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os');
const dir=fs.mkdtempSync(os.tmpdir()+'/kbm-status-scope-');process.env.DATA_DIR=dir;
const R=require('../server/room/room-manager'),Battle=require('../server/combat/combat-manager'),S=require('../server/status/status-manager'),B=require('../server/status/battle-status'),Events=require('../server/events/event-rewards');
try{
 const {room:r,player:p}=R.createRoom('scope','scope');r.selectedAreas=['zone-1','zone-2','zone-3'];R.setSinner(r,p,'04');R.resetForStart(r);
 assert.equal(S.addStatus(p,'contaminated'),false);
 assert.equal(Events.maybePositiveStatus(r,p,1),null);assert.equal(Events.maybeNegativeStatus(r,99,p),null);
 p.inventory=[{id:'item-sedative'}];assert.throws(()=>Battle.useConsumable(r,p,0));assert.equal(p.inventory.length,1);
 const base=S.statFor(p,'mobility');Battle.startCombat(r,'combat');assert.equal(S.addStatus(p,'agile',2,2),true);assert.equal(S.statFor(p,'mobility'),base+2);
 S.addStatus(p,'contaminated');p.hp=p.maxHp-20;assert.equal(S.healPlayer(p,10),6);
 const rewardBase=S.playerLootBonus(p);S.addStatus(p,'lucky-find');assert.equal(S.playerLootBonus(p),rewardBase);assert.equal(S.dangerShield(p),0);
 Battle.closeVictory(r,[]);assert.deepEqual(p.statuses,[]);assert.equal(p.battleStatusActive,false);assert.equal(S.statFor(p,'mobility'),base);
 p.hp=p.maxHp-20;assert.equal(S.healPlayer(p,10),10);assert.equal(S.addStatus(p,'bleeding'),false);
 Battle.startCombat(r,'combat');assert.deepEqual(p.statuses,[]);S.addStatus(p,'bleeding');p.hp=0;Battle.checkDefeat(r);assert.deepEqual(p.statuses,[]);assert.equal(B.stack(p,'bleeding'),0);
 console.log('Status scope passed: combat-only applications/items, no event statuses or loot/danger modifiers, full victory/defeat cleanup and fresh next battle.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
