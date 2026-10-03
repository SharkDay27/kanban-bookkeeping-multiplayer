const STATUS_EFFECTS = [
  { id:'focused', name:'專注', type:'buff', rarity:'common', duration:2, description:'觀察檢定 +2。', mods:{observe:2} },
  { id:'adrenaline', name:'腎上腺素', type:'buff', rarity:'uncommon', duration:2, description:'戰鬥與機動 +2。', mods:{combat:2,mobility:2} },
  { id:'guarded', name:'防護', type:'buff', rarity:'common', duration:1, description:'下一次受到的傷害降低 35%。', damageTakenMultiplier:.65 },
  { id:'steady-mind', name:'心神穩定', type:'buff', rarity:'uncommon', duration:3, description:'穩定 +2；事件失敗時可抵銷 1 點危險度增加。', mods:{stability:2}, dangerShield:1 },
  { id:'lucky-find', name:'幸運搜刮', type:'buff', rarity:'rare', duration:3, description:'高品質戰利品機率提高。', lootBonus:.18 },
  { id:'bleeding', name:'流血', type:'debuff', rarity:'common', duration:3, description:'每個戰鬥回合結束失去 4 HP。', tickDamage:4 },
  { id:'shaken', name:'動搖', type:'debuff', rarity:'common', duration:2, description:'穩定與觀察 -2。', mods:{stability:-2,observe:-2} },
  { id:'slowed', name:'遲滯', type:'debuff', rarity:'common', duration:2, description:'機動 -3。', mods:{mobility:-3} },
  { id:'weakened', name:'虛弱', type:'debuff', rarity:'uncommon', duration:2, description:'戰鬥 -3。', mods:{combat:-3} },
  { id:'marked', name:'被標記', type:'debuff', rarity:'uncommon', duration:2, description:'受到敵人造成的傷害提高 20%。', damageTakenMultiplier:1.2 },
  { id:'contaminated', name:'污染', type:'debuff', rarity:'rare', duration:4, description:'受到治療與休整時的恢復量降低 40%。', healingMultiplier:.6 }
];

function getStatus(id){ return STATUS_EFFECTS.find((s)=>s.id===id); }
module.exports = { STATUS_EFFECTS, getStatus };
