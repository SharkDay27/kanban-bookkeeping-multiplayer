const R=(slash,blunt,pierce)=>({slash,blunt,pierce});
const NORMAL_ENEMIES = [
  {area:'zone-1',id:'z1-scavenger',name:'櫥窗拾荒者',hp:38,attack:7,defense:10,resistances:R(1.35,.75,1),trait:'會被亮起的招牌吸引。斬擊容易切開纏附物，鈍擊較難有效。',skills:[{label:'碎窗撲擊',type:'heavy',mult:1.35,weight:18,description:'撞碎櫥窗後猛撲一名隊員。'}]},
  {area:'zone-1',id:'z1-queue',name:'排隊殘響',hp:32,attack:6,defense:11,resistances:R(.75,1,1.35),trait:'被觀察成功後防禦下降。突擊能穿透排列核心。',skills:[{label:'插隊處刑',type:'status',mult:.55,statusId:'marked',weight:20,description:'鎖定一名隊員並施加「被標記」。'}]},
  {area:'zone-2',id:'z2-worker',name:'失控維修偶',hp:46,attack:9,defense:11,resistances:R(.75,1.35,1),trait:'外殼厚重，鈍擊最容易破壞機構。',skills:[{label:'液壓錘擊',type:'heavy',mult:1.5,weight:20,description:'短暫蓄壓後施以重擊。'}]},
  {area:'zone-2',id:'z2-crawler',name:'管線爬行體',hp:40,attack:8,defense:12,resistances:R(1.35,.75,1),trait:'纜線與軟管暴露，斬擊效果佳。',skills:[{label:'纜線纏足',type:'status',mult:.45,statusId:'slowed',weight:22,description:'纜線纏住目標，造成傷害並施加「遲滯」。'}]},
  {area:'zone-3',id:'z3-reflection',name:'延遲鏡像',hp:44,attack:9,defense:13,resistances:R(.75,1.35,1),trait:'鏡面結構怕震擊，鈍擊能擾亂映像。',skills:[{label:'反射誤導',type:'guard',defenseBoost:3,weight:22,description:'利用錯位倒影提高防禦。'}]},
  {area:'zone-3',id:'z3-specimen',name:'逸散樣本',hp:48,attack:10,defense:11,resistances:R(1, .75,1.35),trait:'軟質外膜對穿刺更脆弱。',skills:[{label:'樣本飛濺',type:'status',mult:.5,statusId:'contaminated',weight:20,description:'污染液飛濺，施加「污染」。'}]},
  {area:'zone-4',id:'z4-hound',name:'失照獵犬',hp:58,attack:12,defense:13,resistances:R(1.35,1,.75),trait:'高速軟質身體怕斬擊，突擊較難命中有效部位。',skills:[{label:'暗域連咬',type:'sweep',mult:.7,weight:20,description:'在黑暗中高速穿梭，波及全隊。'}]},
  {area:'zone-4',id:'z4-shadow',name:'軌側潛影',hp:52,attack:11,defense:14,resistances:R(.75,1,1.35),trait:'核心狹小，突擊能命中隱匿中心。',skills:[{label:'影縫襲擊',type:'heavy',mult:1.45,weight:20,description:'從軌側陰影中突襲。'}]},
  {area:'zone-5',id:'z5-drowned',name:'溺行搬運工',hp:64,attack:13,defense:13,resistances:R(1.35,1,.75),trait:'浸水組織鬆散，斬擊效果較好。',skills:[{label:'拖入積水',type:'status',mult:.6,statusId:'slowed',weight:22,description:'將一名隊員拖入積水，施加「遲滯」。'}]},
  {area:'zone-5',id:'z5-shell',name:'寄殼潮蟲',hp:56,attack:12,defense:15,resistances:R(.75,1.35,1),trait:'硬殼抗斬，鈍擊可直接震裂甲殼。',skills:[{label:'閉殼',type:'guard',defenseBoost:4,weight:25,description:'縮入殼內大幅提高下一輪防禦。'}]},
  {area:'zone-6',id:'z6-wanderer',name:'迴廊迷行者',hp:68,attack:14,defense:14,resistances:R(1,1.35,.75),trait:'形體邊界不穩，鈍擊能干擾其空間定位。',skills:[{label:'錯門突襲',type:'status',mult:.55,statusId:'shaken',weight:20,description:'從錯誤出口現身，施加「動搖」。'}]},
  {area:'zone-6',id:'z6-lamp',name:'嗡鳴燈蛾',hp:60,attack:13,defense:15,resistances:R(1.35,.75,1),trait:'薄翼怕斬擊，鈍擊容易被卸力。',skills:[{label:'頻閃嗡鳴',type:'sweep-status',mult:.45,statusId:'shaken',weight:22,description:'全體受到低傷害，並可能陷入「動搖」。'}]},
  {area:'zone-7',id:'z7-infected',name:'灰疫滯留者',hp:74,attack:15,defense:14,resistances:R(1.35,1,.75),trait:'脆化組織容易被斬開。',skills:[{label:'灰疫抓裂',type:'status',mult:.7,statusId:'bleeding',weight:24,description:'撕裂傷口並施加「流血」。'}]},
  {area:'zone-7',id:'z7-mask',name:'隔離面罩群',hp:66,attack:14,defense:16,resistances:R(.75,1.35,1),trait:'聚集外殼抗斬，但怕大力鈍擊。',skills:[{label:'封鎖呼吸',type:'status',mult:.45,statusId:'weakened',weight:22,description:'阻斷呼吸節奏，施加「虛弱」。'}]},
  {area:'zone-8',id:'z8-drone',name:'寂星維修機',hp:80,attack:16,defense:16,resistances:R(.75,1.35,1),trait:'機械骨架怕震擊，斬擊難切開裝甲。',skills:[{label:'軌道鎖定',type:'heavy',mult:1.55,weight:24,description:'鎖定後發射高能切割束。'}]},
  {area:'zone-8',id:'z8-echo',name:'遠訊回聲體',hp:72,attack:17,defense:15,resistances:R(1, .75,1.35),trait:'回聲核心可被精準突擊刺穿。',skills:[{label:'回聲覆寫',type:'status',mult:.55,statusId:'marked',weight:22,description:'複寫行動軌跡並施加「被標記」。'}]}
];
module.exports = { NORMAL_ENEMIES };
