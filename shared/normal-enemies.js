const NORMAL_ENEMIES = [
  {area:'zone-1',id:'z1-scavenger',name:'櫥窗拾荒者',hp:38,attack:7,defense:10,trait:'會被亮起的招牌吸引。'},
  {area:'zone-1',id:'z1-queue',name:'排隊殘響',hp:32,attack:6,defense:11,trait:'被觀察成功後防禦下降。'},
  {area:'zone-2',id:'z2-worker',name:'失控維修偶',hp:46,attack:9,defense:11,trait:'攻擊前會發出機械警示音。'},
  {area:'zone-2',id:'z2-crawler',name:'管線爬行體',hp:40,attack:8,defense:12,trait:'機動檢定失敗時容易被纏住。'},
  {area:'zone-3',id:'z3-reflection',name:'延遲鏡像',hp:44,attack:9,defense:13,trait:'第一次攻擊它時命中較難。'},
  {area:'zone-3',id:'z3-specimen',name:'逸散樣本',hp:48,attack:10,defense:11,trait:'受傷時可能留下污染區。'},
  {area:'zone-4',id:'z4-hound',name:'失照獵犬',hp:58,attack:12,defense:13,trait:'低光下行動速度極快。'},
  {area:'zone-4',id:'z4-shadow',name:'軌側潛影',hp:52,attack:11,defense:14,trait:'觀察成功可解除隱匿。'},
  {area:'zone-5',id:'z5-drowned',name:'溺行搬運工',hp:64,attack:13,defense:13,trait:'會把目標拖向積水區。'},
  {area:'zone-5',id:'z5-shell',name:'寄殼潮蟲',hp:56,attack:12,defense:15,trait:'防禦高但機動低。'},
  {area:'zone-6',id:'z6-wanderer',name:'迴廊迷行者',hp:68,attack:14,defense:14,trait:'回合結束後可能改變站位。'},
  {area:'zone-6',id:'z6-lamp',name:'嗡鳴燈蛾',hp:60,attack:13,defense:15,trait:'會干擾穩定檢定。'},
  {area:'zone-7',id:'z7-infected',name:'灰疫滯留者',hp:74,attack:15,defense:14,trait:'攻擊可能造成持續傷害。'},
  {area:'zone-7',id:'z7-mask',name:'隔離面罩群',hp:66,attack:14,defense:16,trait:'聚集時防禦提高。'},
  {area:'zone-8',id:'z8-drone',name:'寂星維修機',hp:80,attack:16,defense:16,trait:'會鎖定上一回合輸出最高者。'},
  {area:'zone-8',id:'z8-echo',name:'遠訊回聲體',hp:72,attack:17,defense:15,trait:'能模仿玩家上一個動作。'}
];
module.exports = { NORMAL_ENEMIES };
