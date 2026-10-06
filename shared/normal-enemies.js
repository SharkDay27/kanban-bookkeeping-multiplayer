const R=(slash,blunt,pierce)=>({slash,blunt,pierce});
const NORMAL_ENEMIES = [
  {area:'zone-1',id:'z1-scavenger',name:'櫥窗拾荒者',hp:38,attack:7,defense:10,resistances:R(1.35,.75,1),trait:'會被亮起的招牌吸引。斬擊容易切開纏附物，鈍擊較難有效。',skills:[{label:'碎窗撲擊',type:'heavy',mult:1.35,weight:18,description:'撞碎櫥窗後猛撲一名隊員。'}]},
  {area:'zone-1',id:'z1-queue',name:'排隊殘響',hp:32,attack:6,defense:11,resistances:R(.75,1,1.35),trait:'被觀察成功後防禦下降。突擊能穿透排列核心。',skills:[{label:'插隊處刑',type:'status',mult:.55,statusId:'marked',weight:20,description:'鎖定一名隊員並施加「被標記」。'}]},
  {area:'zone-2',id:'z2-worker',name:'失控維修偶',hp:46,attack:9,defense:11,resistances:R(.75,1.35,1),trait:'外殼厚重，鈍擊最容易破壞機構。',skills:[{label:'液壓錘擊',type:'heavy',mult:1.5,weight:20,description:'短暫蓄壓後施以重擊。'}]},
  {area:'zone-2',id:'z2-crawler',name:'管線爬行體',hp:40,attack:8,defense:12,resistances:R(1.35,.75,1),trait:'纜線與軟管暴露，斬擊效果佳。',skills:[{label:'纜線纏足',type:'status',mult:.45,statusId:'slowed',weight:22,description:'纜線纏住目標，造成傷害並施加「遲滯」。'}]},
  {area:'zone-3',id:'z3-reflection',name:'延遲鏡像',hp:44,attack:9,defense:13,resistances:R(.75,1.35,1),trait:'鏡面結構怕震擊，鈍擊能擾亂映像。',skills:[{label:'反射誤導',type:'guard',defenseBoost:3,weight:22,description:'利用錯位倒影提高防禦。'}]},
  {area:'zone-3',id:'z3-specimen',name:'逸散樣本',hp:48,attack:10,defense:11,resistances:R(1, .75,1.35),trait:'軟質外膜對穿刺更脆弱。',skills:[{label:'樣本飛濺',type:'status',mult:.5,statusId:'contaminated',weight:20,description:'污染液飛濺，施加「污染」。'}]},
  {area:'zone-4',id:'z4-hound',name:'失照獵犬',hp:58,attack:12,defense:13,resistances:R(1.35,1,.75),trait:'高速軟質身體怕斬擊，對槍擊有較高抗性。',skills:[{label:'暗域連咬',type:'sweep',mult:.7,weight:20,description:'在黑暗中高速穿梭，波及全隊。'}]},
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
// Additional local encounter variants, kept within each area's existing stat range.
const additions=[
 ['zone-1','z1-billboard','裂屏推銷員',36,7,11,'slash','廣告屏幕的接縫容易被斬開。','閃屏叫賣','sweep-status','terror','閃爍廣告干擾全隊，造成低傷害並施加恐怖。'],
 ['zone-1','z1-register','零錢吞食箱',42,6,12,'blunt','金屬箱體怕鈍擊，刀刃容易滑開。','硬幣噴射','heavy',null,'噴出積存的零錢，重擊一名隊員。'],
 ['zone-1','z1-receipt','收據纏繞體',34,8,10,'pierce','紙帶裡的捲軸核心怕突擊。','紙帶勒痕','status','bleeding','紙帶割傷一名隊員，造成流血。'],
 ['zone-2','z2-valve','逆轉閥門偶',44,9,12,'blunt','齒輪厚重，但容易被鈍擊震鬆。','蒸汽噴口','status','burning','高溫蒸汽灼傷一名隊員，施加燒傷。'],
 ['zone-2','z2-coil','漏電線圈',40,10,11,'pierce','線圈中央的導電核心怕突擊。','跨接電弧','status','paralysis','電弧擊中一名隊員，施加麻痺。'],
 ['zone-2','z2-filter','濾網啃噬者',48,8,12,'slash','柔軟濾網包覆身體，斬擊更有效。','污泥附著','status','sinking','污泥黏附一名隊員，施加沉淪。'],
 ['zone-3','z3-file','翻頁檔案蟲',46,9,12,'slash','身體由薄紙與纖維組成，怕斬擊。','錯誤條目','status','sealed','錯誤檔案覆蓋指令，封印一名隊員的技能。'],
 ['zone-3','z3-lens','游離透鏡',42,10,13,'blunt','脆硬鏡片怕鈍擊震裂。','折光穿刺','heavy',null,'匯聚光線穿刺一名隊員。'],
 ['zone-3','z3-culture','培養皿孢團',50,9,11,'pierce','厚膜保護孢團，突擊可刺穿核心。','脆化孢霧','status','vulnerable','孢霧使一名隊員易傷。'],
 ['zone-4','z4-signal','熄燈信號偶',54,12,13,'blunt','信號架的關節怕鈍擊。','失照震鳴','sweep-status','tremor','警笛波及全隊，施加震顫。'],
 ['zone-4','z4-ribbon','夜軌纏帶',50,12,14,'slash','纏附軌道的軟質長帶怕斬擊。','軌縫割傷','status','bleeding','纏帶割傷一名隊員，造成流血。'],
 ['zone-4','z4-eye','盲區窺眼',58,11,13,'pierce','窺眼的細小瞳核怕突擊。','無光凝視','status','terror','從盲區凝視一名隊員，施加恐怖。'],
 ['zone-5','z5-chain','鏽鏈拖曳偶',60,13,14,'blunt','鏽蝕鎖鏈怕鈍擊崩裂。','沉錨拖拽','status','sinking','鎖鏈拖拽一名隊員，施加沉淪。'],
 ['zone-5','z5-algae','漂浮藻幕',56,12,14,'slash','藻絲容易被斬斷。','藻絲滲血','status','bleeding','藻絲割入一名隊員的傷口，造成流血。'],
 ['zone-5','z5-buoy','倒鳴浮標',64,12,15,'pierce','浮標的共鳴芯怕突擊。','潮聲共振','sweep-status','tremor','逆向潮聲波及全隊，施加震顫。'],
 ['zone-6','z6-wall','牆紙匍匐者',62,14,14,'slash','層疊牆紙的邊緣怕斬擊。','紙壁伏擊','heavy',null,'從牆紙縫隙突襲一名隊員。'],
 ['zone-6','z6-clock','停秒掛鐘',66,13,15,'blunt','僵硬鐘殼怕鈍擊。','停秒拘束','status','paralysis','停滯的鐘聲使一名隊員麻痺。'],
 ['zone-6','z6-keyhole','游走鎖孔',64,14,14,'pierce','遊走的鎖芯怕精準突擊。','無效開門','status','sealed','封住一名隊員的技能指令。'],
 ['zone-7','z7-ash','灰袋搬運偶',70,15,15,'slash','灰袋的纖維外皮怕斬擊。','灰袋撕裂','status','vulnerable','灰塵腐蝕防護，使一名隊員易傷。'],
 ['zone-7','z7-siren','封區警報器',68,14,16,'blunt','擴音裝置怕鈍擊。','隔離震波','sweep-status','tremor','警報震波波及全隊，施加震顫。'],
 ['zone-7','z7-ember','餘燼巡行體',74,15,14,'pierce','冷卻外殼裡的餘燼核心怕突擊。','餘燼黏附','status','burning','餘燼附著一名隊員，施加燒傷。'],
 ['zone-8','z8-antenna','折翼天線群',76,16,15,'slash','細長天線怕斬擊。','失頻回授','status','sinking','回授雜訊使一名隊員沉淪。'],
 ['zone-8','z8-gyro','漂移陀螺偶',78,16,16,'blunt','旋轉外殼怕鈍擊震偏。','偏軸衝撞','heavy',null,'偏離軌道撞向一名隊員。'],
 ['zone-8','z8-probe','失聯探針',72,17,15,'pierce','探針尾端的通訊核心怕突擊。','靜電標定','status','paralysis','靜電標定一名隊員，施加麻痺。']
];
for(const [area,id,name,hp,attack,defense,weak,trait,label,type,statusId,description] of additions){const resistances={slash:1,blunt:1,pierce:1};resistances[weak]=1.35;resistances[{slash:'blunt',blunt:'pierce',pierce:'slash'}[weak]]=.75;NORMAL_ENEMIES.push({area,id,name,hp,attack,defense,resistances,trait,skills:[{label,type,mult:type==='heavy'?1.3:type==='sweep-status'?.4:.55,weight:20,...(statusId?{statusId}:{}),description}]});}
module.exports = { NORMAL_ENEMIES };
