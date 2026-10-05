const STATUS_EFFECTS = [
  { id:'focused', name:'專注', type:'buff', rarity:'common', duration:2, description:'觀察檢定 +2。', mods:{observe:2} },
  { id:'adrenaline', name:'腎上腺素', type:'buff', rarity:'uncommon', duration:2, description:'戰鬥與機動 +2。', mods:{combat:2,mobility:2} },
  { id:'guarded', name:'防護', type:'buff', rarity:'common', duration:1, description:'下一次受到的傷害降低 35%。', damageTakenMultiplier:.65 },
  { id:'steady-mind', name:'心神穩定', type:'buff', rarity:'uncommon', duration:3, description:'穩定 +2；事件失敗時可抵銷 1 點危險度增加。', mods:{stability:2}, dangerShield:1 },
  { id:'lucky-find', name:'幸運搜刮', type:'buff', rarity:'rare', duration:3, description:'高品質戰利品機率提高。', lootBonus:.18 },
  { id:'bleeding', name:'流血', type:'debuff', rarity:'common', duration:3, description:'每層於回合結束造成 2 傷害，最多 9 層；護盾可吸收。', stacking:true },
  { id:'shaken', name:'動搖', type:'debuff', rarity:'common', duration:2, description:'穩定與觀察 -2。', mods:{stability:-2,observe:-2} },
  { id:'slowed', name:'遲滯', type:'debuff', rarity:'common', duration:2, description:'機動 -3。', mods:{mobility:-3} },
  { id:'weakened', name:'虛弱', type:'debuff', rarity:'uncommon', duration:2, description:'戰鬥 -3。', mods:{combat:-3} },
  { id:'marked', name:'被標記', type:'debuff', rarity:'uncommon', duration:2, description:'受到敵人造成的傷害提高 20%。', damageTakenMultiplier:1.2 },
  { id:'contaminated', name:'污染', type:'debuff', rarity:'rare', duration:4, description:'受到治療與休整時的恢復量降低 40%。', healingMultiplier:.6 },
  {id:'vulnerable',name:'易傷',type:'debuff',duration:2,stacking:true,description:'每層使受到的攻擊傷害增加 10%，最多增加 60%；持續 2 回合。'},
  {id:'paralysis',name:'麻痺',type:'debuff',duration:2,stacking:true,mods:{mobility:-1},description:'每層機動 -1；行動時達 4 層則消耗 4 層，跳過這次攻擊與技能，仍可防禦。'},
  {id:'sealed',name:'封印',type:'debuff',duration:1,description:'無法發動罪人／敵方技能；普通卡牌與能力牌仍可使用。持續 1 回合。'},
  {id:'terror',name:'恐怖',type:'debuff',duration:2,description:'造成的戰鬥攻擊傷害減半（向下取整），持續 2 回合。'},
  {id:'burning',name:'燒傷',type:'debuff',duration:2,stacking:true,description:'每層於回合結束造成 2 傷害，並減少 1 顆攻擊骰；最多 9 層。'},
  {id:'tremor',name:'震顫',type:'debuff',duration:3,stacking:true,description:'每 3 層使下回合補牌目標與手牌上限各減 1（最低補至 3 張）；超出上限的牌進入回收堆。持續 3 回合。'},
  {id:'sinking',name:'沉淪',type:'debuff',duration:2,stacking:true,description:'每層使攻擊、防禦與機動雙面骰正面率減少 5 個百分點；由 50% 最低降至 20%。'},
  {id:'damage-up',name:'增傷',type:'buff',duration:2,stacking:true,description:'攻擊至少擲出 1 個正面時，每層在淨骰點傷害後加 2 傷害，最多加 12；再計抗性、易傷與護盾。'},
  {id:'shield',name:'護盾',type:'buff',duration:1,description:'施加時每層增加 4 點持續護盾；玩家護盾上限 99，戰鬥結束清空。護盾值另顯示，不隨此狀態到期消失。'},
  {id:'regeneration',name:'再生',type:'buff',duration:2,stacking:true,description:'每層於回合結束恢復 3 HP；最多 9 層，無法復活倒下角色。'},
  {id:'agile',name:'靈敏',type:'buff',duration:2,stacking:true,mods:{mobility:1},description:'每層機動 +1，影響下次先攻骰數；持續 2 回合。'},
  {id:'attack-down',name:'攻勢削弱',type:'debuff',duration:2,stacking:true,description:'每層減少 1 顆攻擊骰，持續 2 回合。'},
  {id:'defense-down',name:'防勢削弱',type:'debuff',duration:2,stacking:true,description:'每層減少 1 顆防禦骰，持續 2 回合。'},
  {id:'suppressed',name:'鏡中壓制',type:'debuff',duration:2,description:'攻擊與防禦各減 3 顆骰子，持續 2 回合。李箱發動時本回合攻擊變為 0。'},
  {id:'imprint',name:'刻印',type:'buff',duration:99,description:'辛克萊專有，每層隨機提高戰鬥／穩定／機動中的一項；加成最多 +3，每次刻印重新抽選。只持續本場戰鬥。'}
];

function getStatus(id){ return STATUS_EFFECTS.find((s)=>s.id===id); }
module.exports = { STATUS_EFFECTS, getStatus };
