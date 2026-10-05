const CONSUMABLES = [
  {id:'item-bandage',name:'止血繃帶',kind:'heal',rarity:'common',power:12,description:'恢復 12 HP，並移除「流血」。'},
  {id:'item-medkit',name:'急救針劑',kind:'heal',rarity:'common',power:25,description:'恢復 25 HP。'},
  {id:'item-sedative',name:'鎮定劑',kind:'buff',rarity:'uncommon',power:2,description:'僅限戰鬥使用，獲得「心神穩定」3 回合；戰鬥結束清除。'},
  {id:'item-flash',name:'閃光彈',kind:'combat',rarity:'uncommon',power:3,description:'僅限戰鬥；敵人的下一次傷害降低。'},
  {id:'item-shield',name:'臨時護盾',kind:'guard',rarity:'uncommon',power:15,description:'獲得 15 點臨時防護，優先吸收傷害。'},
  {id:'item-suppressor',name:'怪異抑制劑',kind:'boss',rarity:'rare',power:2,description:'僅限 Boss 戰；降低 Boss 下一次傷害並降低其防禦。'}
];
module.exports = { CONSUMABLES };
