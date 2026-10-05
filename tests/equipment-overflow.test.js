const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os');
const dir=fs.mkdtempSync(os.tmpdir()+'/kbm-equipment-full-');process.env.DATA_DIR=dir;
const E=require('../server/equipment/equipment-manager'),G=require('../shared/game-data'),P=require('../server/persistence');
try{
 const p={id:'p',connected:true,hp:100,maxHp:100,equipment:{},equipmentInventory:[]},room={players:[p],combat:null};
 const defs=G.EQUIPMENT.slice(0,6);for(const item of defs.slice(0,4))E.addEquipment(p,item);
 assert.equal(p.equipmentInventory.length,4);const before=p.equipmentInventory.map(x=>x.gearUid);
 E.addEquipment(p,defs[4]);assert.equal(p.pendingEquipment.length,1);assert.equal(p.equipmentInventory.length,4);
 const reward=p.pendingEquipment[0];assert.throws(()=>E.resolveOverflow(room,p,{rewardId:'stale',discardUid:before[0]}));assert.equal(p.pendingEquipment.length,1);
 E.resolveOverflow(room,p,{rewardId:reward.id,discardUid:before[1]});assert.equal(p.equipmentInventory.length,4);assert(!p.equipmentInventory.some(x=>x.gearUid===before[1]));assert(p.equipmentInventory.some(x=>x.id===defs[4].id));assert(!E.pendingEquipment(room));
 E.addEquipment(p,defs[5]);const keep=p.equipmentInventory.map(x=>x.gearUid);E.resolveOverflow(room,p,{rewardId:p.pendingEquipment[0].id});assert.deepEqual(p.equipmentInventory.map(x=>x.gearUid),keep);
 const legacy={...p,equipmentInventory:defs.map(x=>({...x})),pendingEquipment:[]};E.ensureGear(legacy);assert.equal(legacy.equipmentInventory.length,4);assert.equal(legacy.pendingEquipment.length,2);E.ensureGear(legacy);assert.equal(legacy.pendingEquipment.length,2);
 P.saveRooms(new Map([['test',{id:'test',phase:'exploration',players:[legacy]}]]));assert.equal(P.loadRooms()[0].players[0].pendingEquipment.length,2);
 console.log('Equipment overflow passed: cap, explicit discard/decline, stable IDs, stale request rejection, lossless legacy overflow and persistence.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
