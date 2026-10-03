const ELITE_ENEMIES = [
  {area:'zone-1',id:'z1-elite-mannequin',name:'封店模特',hp:92,attack:15,defense:14,trait:'受到觀察成功後會暴露接縫弱點。'},
  {area:'zone-2',id:'z2-elite-boiler',name:'過壓鍋爐獸',hp:108,attack:18,defense:15,trait:'第三回合會進入高壓爆發。'},
  {area:'zone-3',id:'z3-elite-twin',name:'雙生觀測體',hp:116,attack:19,defense:16,trait:'每回合會複製一名罪人的能力傾向。'},
  {area:'zone-4',id:'z4-elite-stalker',name:'無燈追獵者',hp:128,attack:22,defense:17,trait:'未被觀察鎖定前攻擊較難命中。'},
  {area:'zone-5',id:'z5-elite-anchor',name:'沉錨巨殼',hp:142,attack:24,defense:19,trait:'高防禦，機動行動可削弱其護殼。'},
  {area:'zone-6',id:'z6-elite-room',name:'活動房間',hp:150,attack:25,defense:18,trait:'場景本身會在回合間改變通路。'},
  {area:'zone-7',id:'z7-elite-doctor',name:'灰疫宣告者',hp:158,attack:27,defense:18,trait:'會施加感染標記並強化其他敵對單位。'},
  {area:'zone-8',id:'z8-elite-oracle',name:'逆時預報機',hp:172,attack:29,defense:20,trait:'會提前顯示並改寫下一次攻擊意圖。'}
];
module.exports = { ELITE_ENEMIES };
