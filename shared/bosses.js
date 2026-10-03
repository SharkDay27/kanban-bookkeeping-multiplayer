const BOSSES = [
  {area:'zone-1',id:'z1-boss-cashier',name:'永不結帳的收銀員',hp:220,attack:20,defense:15,phase2At:.5,trait:'會把累積的「帳款」轉為全體傷害。'},
  {area:'zone-2',id:'z2-boss-core',name:'逆流維修核心',hp:260,attack:23,defense:17,phase2At:.55,trait:'高壓階段會交替封鎖不同類型行動。'},
  {area:'zone-3',id:'z3-boss-observer',name:'鏡後觀測者',hp:285,attack:25,defense:18,phase2At:.5,trait:'會生成錯誤鏡像；觀察可找出本體。'},
  {area:'zone-4',id:'z4-boss-darkness',name:'失照吞行者',hp:320,attack:28,defense:19,phase2At:.45,trait:'HP 越低，場景照明越弱。'},
  {area:'zone-5',id:'z5-boss-tide',name:'沉潮母體',hp:350,attack:30,defense:20,phase2At:.5,trait:'潮位會週期性改變安全區域。'},
  {area:'zone-6',id:'z6-boss-corridor',name:'第零號房間',hp:380,attack:32,defense:21,phase2At:.5,trait:'每階段改寫戰場規則與出口方向。'},
  {area:'zone-7',id:'z7-boss-cure',name:'被宣布痊癒者',hp:410,attack:34,defense:22,phase2At:.5,trait:'會吸收感染標記恢復生命。'},
  {area:'zone-8',id:'z8-boss-star',name:'寂星回應體',hp:450,attack:37,defense:23,phase2At:.4,trait:'會預先回應下一回合的玩家選擇。'}
];
module.exports = { BOSSES };
