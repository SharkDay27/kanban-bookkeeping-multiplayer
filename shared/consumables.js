const CONSUMABLES = [
  {id:'item-medkit',name:'急救針劑',kind:'heal',power:25,description:'恢復 25 HP。'},
  {id:'item-bandage',name:'止血繃帶',kind:'heal',power:12,description:'恢復 12 HP，之後可擴充移除流血。'},
  {id:'item-flash',name:'閃光彈',kind:'combat',power:3,description:'本場戰鬥下一次敵方命中修正 -3。'},
  {id:'item-sedative',name:'鎮定劑',kind:'buff',power:2,description:'下一次穩定檢定 +2。'},
  {id:'item-shield',name:'臨時護盾',kind:'guard',power:15,description:'獲得 15 點臨時防護。'},
  {id:'item-suppressor',name:'怪異抑制劑',kind:'boss',power:2,description:'Boss 戰中降低一次特殊行動效果。'}
];
module.exports = { CONSUMABLES };
