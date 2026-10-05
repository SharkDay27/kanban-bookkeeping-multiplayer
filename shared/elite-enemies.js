const R=(slash,blunt,pierce)=>({slash,blunt,pierce});
const E=(area,id,name,hp,attack,defense,resistances,trait,skills)=>({area,id,name,hp,attack,defense,resistances,trait,skills});
const ELITE_ENEMIES=[
 E('zone-1','z1-elite-mannequin','封店模特',92,15,14,R(1.35,.75,1),'接縫與布料結構怕斬擊。',[{label:'展示櫃突進',type:'heavy',mult:1.45,weight:22,description:'高速撞向一名隊員。'},{label:'玻璃罩',type:'shield',shield:18,weight:16,description:'以櫥窗玻璃形成護盾。'}]),
 E('zone-1','z1-elite-cart','失控促銷推車',88,16,13,R(.75,1.35,1),'金屬車架抗斬但怕鈍擊。',[{label:'滿載衝撞',type:'heavy',mult:1.5,weight:24,description:'高速推車衝撞單體。'},{label:'貨架護欄',type:'shield',shield:16,weight:16,description:'折起貨架形成護盾。'}]),
 E('zone-1','z1-elite-security','閉店保全偶',96,15,16,R(1,1.3,.75),'厚制服下的核心具有槍擊抗性。',[{label:'強制驅離',type:'status',mult:.62,statusId:'marked',weight:22,description:'標記一名隊員。'},{label:'伸縮警棍',type:'heavy',mult:1.4,weight:20,description:'警棍重擊。'}]),
 E('zone-1','z1-elite-signage','活化巨型招牌',102,14,15,R(1.35,.8,1),'吊索和板材接縫可被斬開。',[{label:'招牌墜落',type:'sweep',mult:.72,weight:24,description:'整塊招牌向隊伍砸落。'},{label:'霓虹爆閃',type:'sweep-status',mult:.42,statusId:'shaken',weight:18,description:'霓虹閃爍使全隊動搖。'}]),
 E('zone-1','z1-elite-elevator','拒載電梯門',98,17,15,R(.7,1.4,1),'機械門體最怕鈍擊震壞。',[{label:'夾門',type:'heavy',mult:1.55,weight:24,description:'門片高速夾擊單體。'},{label:'層門閉鎖',type:'shield',shield:22,weight:18,description:'雙層門片閉合形成護盾。'}]),

 E('zone-2','z2-elite-boiler','過壓鍋爐獸',108,18,15,R(.7,1.4,1),'厚重金屬殼抗斬，鈍擊可震裂壓力結構。',[{label:'蒸汽噴發',type:'sweep',mult:.75,weight:24,description:'高壓蒸汽掃過全隊。'},{label:'壓力殼',type:'shield',shield:24,weight:18,description:'蒸汽壓力形成護盾。'}]),
 E('zone-2','z2-elite-crane','維修吊臂獵手',112,19,14,R(1,1.35,.75),'沉重關節怕鈍擊，突擊易滑開。',[{label:'吊臂砸落',type:'heavy',mult:1.58,weight:24,description:'吊臂垂直砸擊。'},{label:'鋼索捆束',type:'status',mult:.55,statusId:'slowed',weight:20,description:'鋼索纏住目標。'}]),
 E('zone-2','z2-elite-valve','多頭閥門獸',105,18,16,R(.75,1,1.35),'深藏閥芯是突擊弱點。',[{label:'多口噴汽',type:'sweep',mult:.68,weight:22,description:'多個閥口同時噴射。'},{label:'閥芯護套',type:'shield',shield:20,weight:16,description:'護套閉合形成護盾。'}]),
 E('zone-2','z2-elite-cable','高壓纜線巢',100,17,15,R(1.35,.75,1),'大量線纜最怕斬擊。',[{label:'纜線鞭擊',type:'sweep',mult:.7,weight:22,description:'電纜掃過全隊。'},{label:'纏足',type:'status',mult:.48,statusId:'slowed',weight:20,description:'纜線纏住隊員。'}]),
 E('zone-2','z2-elite-piston','往復活塞群',116,20,17,R(.7,1.35,1),'厚實活塞抗斬，鈍擊可破壞軸承。',[{label:'連續壓床',type:'sweep',mult:.78,weight:24,description:'活塞連續向下壓擊。'},{label:'機座鎖定',type:'shield',shield:28,weight:18,description:'機座固定提高防護。'}]),

 E('zone-3','z3-elite-twin','雙生觀測體',116,19,16,R(1,.75,1.35),'觀測核心狹窄，突擊能精準刺穿。',[{label:'雙重投影',type:'sweep-status',mult:.55,statusId:'shaken',weight:22,description:'錯位影像攻擊全隊。'},{label:'觀測鎖定',type:'status',mult:.6,statusId:'marked',weight:20,description:'鎖定一名隊員。'}]),
 E('zone-3','z3-elite-cabinet','自鎖樣本櫃',122,18,18,R(.7,1.35,1),'強化櫃體抗斬、怕鈍擊。',[{label:'櫃門夾擊',type:'heavy',mult:1.5,weight:22,description:'強化櫃門猛然閉合。'},{label:'隔離玻璃',type:'shield',shield:30,weight:20,description:'多層玻璃形成護盾。'}]),
 E('zone-3','z3-elite-thread','縫合實驗體',118,20,15,R(1.35,.8,1),'縫線和外露組織怕斬擊。',[{label:'縫線割裂',type:'heavy',mult:1.48,weight:22,description:'縫線高速收緊。'},{label:'組織飛濺',type:'status',mult:.5,statusId:'contaminated',weight:20,description:'污染液飛濺。'}]),
 E('zone-3','z3-elite-lens','多眼觀測鏡',110,19,17,R(1,.75,1.35),'鏡後焦點可被突擊貫穿。',[{label:'焦點灼射',type:'heavy',mult:1.55,weight:24,description:'聚焦光束攻擊單體。'},{label:'折射幕',type:'shield',shield:24,weight:18,description:'折射光形成護盾。'}]),
 E('zone-3','z3-elite-cleaner','失序無菌清掃機',120,18,17,R(.75,1.35,1),'機械底盤怕鈍擊。',[{label:'消毒沖刷',type:'sweep-status',mult:.5,statusId:'weakened',weight:22,description:'高壓藥液沖刷全隊。'},{label:'密封外殼',type:'shield',shield:26,weight:16,description:'外殼密封形成護盾。'}]),

 E('zone-4','z4-elite-stalker','無燈追獵者',128,22,17,R(1.35,1,.75),'高速獵殺型態怕大範圍斬擊，突擊容易落空。',[{label:'熄燈獵殺',type:'heavy',mult:1.6,weight:24,description:'利用黑暗進行致命突襲。'},{label:'暗域皮膜',type:'shield',shield:24,weight:16,description:'黑暗凝聚成護盾。'}]),
 E('zone-4','z4-elite-sleeper','軌枕伏行體',124,21,18,R(.75,1.35,1),'硬質軌枕結構怕鈍擊。',[{label:'軌下撲擊',type:'heavy',mult:1.5,weight:22,description:'從軌道下方突襲。'},{label:'碎石護層',type:'shield',shield:26,weight:18,description:'碎石堆疊形成護盾。'}]),
 E('zone-4','z4-elite-signal','失照信號柱',130,20,19,R(1,.75,1.35),'信號核心深藏，突擊效果最佳。',[{label:'紅燈標記',type:'status',mult:.52,statusId:'marked',weight:20,description:'標記一名隊員。'},{label:'訊號爆閃',type:'sweep-status',mult:.48,statusId:'shaken',weight:22,description:'強烈閃光擾亂全隊。'}]),
 E('zone-4','z4-elite-carriage','空車廂殘像',136,22,18,R(.7,1.35,1),'車體外殼抗斬、怕鈍擊。',[{label:'車門夾殺',type:'heavy',mult:1.55,weight:22,description:'車門高速閉合。'},{label:'車體殘像',type:'shield',shield:30,weight:18,description:'重疊殘像吸收傷害。'}]),
 E('zone-4','z4-elite-whisper','隧道耳語群',120,23,15,R(1.35,1,.75),'延展暗影可被斬開。',[{label:'耳語侵蝕',type:'sweep-status',mult:.5,statusId:'shaken',weight:24,description:'耳語侵蝕全隊心神。'},{label:'影縫襲擊',type:'heavy',mult:1.48,weight:20,description:'黑影從縫隙突襲。'}]),

 E('zone-5','z5-elite-anchor','沉錨巨殼',142,24,19,R(.7,1.4,1),'極厚甲殼抗斬，鈍擊能打碎承力層。',[{label:'沉錨橫掃',type:'sweep',mult:.8,weight:24,description:'巨大的錨肢橫掃全隊。'},{label:'深殼閉鎖',type:'shield',shield:34,weight:20,description:'封閉外殼形成護盾。'}]),
 E('zone-5','z5-elite-net','活化拖網',134,23,17,R(1.35,.75,1),'纜網結構非常怕斬擊。',[{label:'拖網收束',type:'sweep-status',mult:.55,statusId:'slowed',weight:24,description:'巨網收束全隊。'},{label:'浮標撞擊',type:'heavy',mult:1.42,weight:18,description:'沉重浮標撞擊單體。'}]),
 E('zone-5','z5-elite-crab','鏽甲碼頭蟹',148,25,20,R(.7,1.35,1),'厚甲怕鈍擊。',[{label:'鉗擊',type:'heavy',mult:1.58,weight:24,description:'巨鉗夾擊單體。'},{label:'甲殼閉合',type:'shield',shield:36,weight:20,description:'甲殼閉合形成護盾。'}]),
 E('zone-5','z5-elite-eel','積水電鰻群',132,24,16,R(1,1.35,.75),'柔韌軀體怕鈍擊震盪。',[{label:'導電積水',type:'sweep-status',mult:.52,statusId:'weakened',weight:24,description:'積水導電削弱全隊。'},{label:'電尾抽擊',type:'heavy',mult:1.45,weight:20,description:'電尾抽擊。'}]),
 E('zone-5','z5-elite-diver','無面潛水員',140,26,18,R(1,.75,1.35),'潛水服深層氣閥可被突擊。',[{label:'鉛靴踐踏',type:'heavy',mult:1.55,weight:22,description:'沉重鉛靴砸擊。'},{label:'深水壓迫',type:'status',mult:.55,statusId:'slowed',weight:20,description:'水壓拖慢目標。'}]),

 E('zone-6','z6-elite-room','活動房間',150,25,18,R(.75,1.35,1),'整體空間結構可被鈍擊震鬆。',[{label:'牆面合攏',type:'sweep',mult:.72,weight:24,description:'整個房間向內擠壓。'},{label:'重疊牆層',type:'shield',shield:34,weight:18,description:'重疊牆面形成護盾。'}]),
 E('zone-6','z6-elite-door','追逐門扉',146,26,17,R(1.35,.75,1),'門縫與鉸鏈怕斬擊。',[{label:'門扉追咬',type:'heavy',mult:1.55,weight:22,description:'門板像口器般夾擊。'},{label:'門牌錯置',type:'status',mult:.5,statusId:'shaken',weight:20,description:'錯誤門牌擾亂心神。'}]),
 E('zone-6','z6-elite-lamp','無窗燈列',142,24,19,R(1,.75,1.35),'燈座核心深藏，突擊最有效。',[{label:'頻閃灼射',type:'sweep-status',mult:.52,statusId:'shaken',weight:24,description:'燈列高速頻閃。'},{label:'玻璃燈罩',type:'shield',shield:28,weight:18,description:'厚玻璃罩形成護盾。'}]),
 E('zone-6','z6-elite-stairs','折返樓梯',156,24,20,R(.7,1.35,1),'結構體抗斬、怕鈍擊。',[{label:'階梯翻折',type:'sweep',mult:.76,weight:24,description:'樓梯整體翻折。'},{label:'扶手閉鎖',type:'shield',shield:32,weight:18,description:'扶手交錯形成護盾。'}]),
 E('zone-6','z6-elite-number','錯號房客',148,27,16,R(1.35,1,.75),'不穩定輪廓可被斬擊切斷。',[{label:'門縫伸手',type:'heavy',mult:1.5,weight:22,description:'從錯誤門牌後伸出手臂。'},{label:'房號覆寫',type:'status',mult:.55,statusId:'marked',weight:20,description:'把一名隊員標成錯誤房客。'}]),

 E('zone-7','z7-elite-doctor','灰疫宣告者',158,27,18,R(1.35,1,.75),'污染組織脆化，斬擊能有效切除。',[{label:'診斷：惡化',type:'status',mult:.65,statusId:'contaminated',weight:25,description:'施加污染。'},{label:'隔離布簾',type:'shield',shield:30,weight:16,description:'層層隔離簾形成護盾。'}]),
 E('zone-7','z7-elite-stretcher','自行搬運病床',154,28,19,R(.7,1.35,1),'金屬床架抗斬，鈍擊可破壞輪軸。',[{label:'病床衝撞',type:'heavy',mult:1.58,weight:24,description:'高速病床撞擊。'},{label:'束帶固定',type:'status',mult:.52,statusId:'slowed',weight:20,description:'束帶纏住目標。'}]),
 E('zone-7','z7-elite-mask','面罩聚合體',150,26,18,R(1,.75,1.35),'內部呼吸管路可被突擊刺穿。',[{label:'缺氧壓迫',type:'sweep-status',mult:.5,statusId:'weakened',weight:24,description:'全隊呼吸受阻。'},{label:'面罩層疊',type:'shield',shield:32,weight:18,description:'面罩堆疊形成護盾。'}]),
 E('zone-7','z7-elite-siren','隔離警報柱',162,27,20,R(.75,1,1.35),'內部訊號核心是突擊弱點。',[{label:'警報震盪',type:'sweep-status',mult:.52,statusId:'shaken',weight:24,description:'高強度警報擾亂全隊。'},{label:'金屬護罩',type:'shield',shield:34,weight:18,description:'護罩閉合形成護盾。'}]),
 E('zone-7','z7-elite-nest','灰疫孢巢',166,25,21,R(1.35,.8,1),'外露菌絲可被斬擊快速切除。',[{label:'孢子爆發',type:'sweep-status',mult:.5,statusId:'contaminated',weight:24,description:'孢子污染全隊。'},{label:'菌絲殼',type:'shield',shield:38,weight:20,description:'菌絲編織成護盾。'}]),

 E('zone-8','z8-elite-oracle','逆時預報機',172,29,20,R(.75,1,1.4),'核心深藏於機殼內，突擊最容易穿透。',[{label:'預報命中',type:'heavy',mult:1.65,weight:24,description:'先宣告結果，再執行高傷害打擊。'},{label:'時序護罩',type:'shield',shield:36,weight:18,description:'時間差形成護盾。'}]),
 E('zone-8','z8-elite-array','失焦望遠鏡陣列',168,30,19,R(1,.75,1.35),'光學焦點與鏡筒深處怕突擊。',[{label:'失焦灼射',type:'sweep',mult:.72,weight:24,description:'多束失焦光掃過全隊。'},{label:'鏡筒閉合',type:'shield',shield:34,weight:18,description:'鏡筒閉合形成護盾。'}]),
 E('zone-8','z8-elite-dish','遠訊接收盤',176,28,22,R(.7,1.35,1),'大型金屬結構抗斬、怕鈍擊。',[{label:'回波震擊',type:'sweep',mult:.76,weight:24,description:'高能回波震盪全場。'},{label:'盤面折收',type:'shield',shield:40,weight:20,description:'接收盤折起形成護盾。'}]),
 E('zone-8','z8-elite-clock','星時校準鐘',170,31,20,R(1.35,.75,1),'外露齒帶可被斬擊切斷。',[{label:'秒針突刺',type:'heavy',mult:1.62,weight:24,description:'巨大秒針高速刺擊。'},{label:'逆時擺動',type:'status',mult:.5,statusId:'slowed',weight:20,description:'時間感被拖慢。'}]),
 E('zone-8','z8-elite-suit','真空觀測服',164,30,18,R(1,.8,1.35),'生命維持接頭可被突擊破壞。',[{label:'真空擁抱',type:'heavy',mult:1.55,weight:22,description:'觀測服緊緊箍住單體。'},{label:'壓力層',type:'shield',shield:32,weight:18,description:'壓力服膨脹形成護盾。'}])
];
module.exports={ELITE_ENEMIES};
