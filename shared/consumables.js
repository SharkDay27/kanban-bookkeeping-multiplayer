const CONSUMABLES = [
  {id:'item-medkit',name:'急救針劑',rarity:'common',kind:'heal',power:25,description:'立即恢復 25 HP。'},
  {id:'item-bandage',name:'止血繃帶',rarity:'common',kind:'cleanse',power:12,removeStatus:'bleeding',description:'恢復 12 HP，並移除「流血」。'},
  {id:'item-flash',name:'閃光彈',rarity:'uncommon',kind:'enemy-debuff',status:'dazzled',power:3,combatOnly:true,description:'戰鬥中使用；敵人下一次反擊傷害降低。'},
  {id:'item-sedative',name:'鎮定劑',rarity:'uncommon',kind:'status',status:'steady-mind',description:'獲得「心神穩定」3 回合。'},
  {id:'item-shield',name:'臨時護盾',rarity:'uncommon',kind:'status',status:'guarded',description:'獲得「防護」，下一次受到傷害降低 35%。'},
  {id:'item-stimulant',name:'戰術刺激劑',rarity:'rare',kind:'status',status:'adrenaline',description:'獲得「腎上腺素」2 回合，戰鬥與機動 +2。'},
  {id:'item-focus',name:'觀測增幅鏡片',rarity:'rare',kind:'status',status:'focused',description:'獲得「專注」2 回合，觀察 +2。'},
  {id:'item-suppressor',name:'怪異抑制劑',rarity:'rare',kind:'boss',power:2,bossOnly:true,description:'Boss 戰中使用；Boss 本回合反擊傷害降低 45%，並降低 2 點防禦。'},
  {id:'item-cache',name:'高密度補給包',rarity:'rare',kind:'status',status:'lucky-find',description:'獲得「幸運搜刮」3 個節點，提高高品質戰利品機率。'}
];
module.exports = { CONSUMABLES };
