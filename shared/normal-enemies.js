const NORMAL_ENEMIES = [
  {area:'zone-1',id:'z1-scavenger',name:'櫥窗拾荒者',hp:38,attack:7,defense:10,trait:'會被亮起的招牌吸引。',skills:[{label:'碎窗撲擊',type:'heavy',mult:1.35,weight:18,description:'撞碎櫥窗後猛撲一名隊員。'}]},
  {area:'zone-1',id:'z1-queue',name:'排隊殘響',hp:32,attack:6,defense:11,trait:'被觀察成功後防禦下降。',skills:[{label:'插隊處刑',type:'status',mult:.55,statusId:'marked',weight:20,description:'鎖定一名隊員並施加「被標記」。'}]},
  {area:'zone-2',id:'z2-worker',name:'失控維修偶',hp:46,attack:9,defense:11,trait:'攻擊前會發出機械警示音。',skills:[{label:'液壓錘擊',type:'heavy',mult:1.5,weight:20,description:'短暫蓄壓後施以重擊。'}]},
  {area:'zone-2',id:'z2-crawler',name:'管線爬行體',hp:40,attack:8,defense:12,trait:'機動檢定失敗時容易被纏住。',skills:[{label:'纜線纏足',type:'status',mult:.45,statusId:'slowed',weight:22,description:'纜線纏住目標，造成傷害並施加「遲滯」。'}]},
  {area:'zone-3',id:'z3-reflection',name:'延遲鏡像',hp:44,attack:9,defense:13,trait:'第一次攻擊它時命中較難。',skills:[{label:'反射誤導',type:'guard',defenseBoost:3,weight:22,description:'利用錯位倒影提高防禦。'}]},
  {area:'zone-3',id:'z3-specimen',name:'逸散樣本',hp:48,attack:10,defense:11,trait:'受傷時可能留下污染區。',skills:[{label:'樣本飛濺',type:'status',mult:.5,statusId:'contaminated',weight:20,description:'污染液飛濺，施加「污染」。'}]},
  {area:'zone-4',id:'z4-hound',name:'失照獵犬',hp:58,attack:12,defense:13,trait:'低光下行動速度極快。',skills:[{label:'暗域連咬',type:'sweep',mult:.7,weight:20,description:'在黑暗中高速穿梭，波及全隊。'}]},
  {area:'zone-4',id:'z4-shadow',name:'軌側潛影',hp:52,attack:11,defense:14,trait:'觀察成功可解除隱匿。',skills:[{label:'影縫襲擊',type:'heavy',mult:1.45,weight:20,description:'從軌側陰影中突襲。'}]},
  {area:'zone-5',id:'z5-drowned',name:'溺行搬運工',hp:64,attack:13,defense:13,trait:'會把目標拖向積水區。',skills:[{label:'拖入積水',type:'status',mult:.6,statusId:'slowed',weight:22,description:'將一名隊員拖入積水，施加「遲滯」。'}]},
  {area:'zone-5',id:'z5-shell',name:'寄殼潮蟲',hp:56,attack:12,defense:15,trait:'防禦高但機動低。',skills:[{label:'閉殼',type:'guard',defenseBoost:4,weight:25,description:'縮入殼內大幅提高下一輪防禦。'}]},
  {area:'zone-6',id:'z6-wanderer',name:'迴廊迷行者',hp:68,attack:14,defense:14,trait:'回合結束後可能改變站位。',skills:[{label:'錯門突襲',type:'status',mult:.55,statusId:'shaken',weight:20,description:'從錯誤出口現身，施加「動搖」。'}]},
  {area:'zone-6',id:'z6-lamp',name:'嗡鳴燈蛾',hp:60,attack:13,defense:15,trait:'會干擾穩定檢定。',skills:[{label:'頻閃嗡鳴',type:'sweep-status',mult:.45,statusId:'shaken',weight:22,description:'全體受到低傷害，並可能陷入「動搖」。'}]},
  {area:'zone-7',id:'z7-infected',name:'灰疫滯留者',hp:74,attack:15,defense:14,trait:'攻擊可能造成持續傷害。',skills:[{label:'灰疫抓裂',type:'status',mult:.7,statusId:'bleeding',weight:24,description:'撕裂傷口並施加「流血」。'}]},
  {area:'zone-7',id:'z7-mask',name:'隔離面罩群',hp:66,attack:14,defense:16,trait:'聚集時防禦提高。',skills:[{label:'封鎖呼吸',type:'status',mult:.45,statusId:'weakened',weight:22,description:'阻斷呼吸節奏，施加「虛弱」。'}]},
  {area:'zone-8',id:'z8-drone',name:'寂星維修機',hp:80,attack:16,defense:16,trait:'會鎖定上一回合輸出最高者。',skills:[{label:'軌道鎖定',type:'heavy',mult:1.55,weight:24,description:'鎖定後發射高能切割束。'}]},
  {area:'zone-8',id:'z8-echo',name:'遠訊回聲體',hp:72,attack:17,defense:15,trait:'能模仿玩家上一個動作。',skills:[{label:'回聲覆寫',type:'status',mult:.55,statusId:'marked',weight:22,description:'複寫行動軌跡並施加「被標記」。'}]}
];
module.exports = { NORMAL_ENEMIES };
