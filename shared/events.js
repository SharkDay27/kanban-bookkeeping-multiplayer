const EVENTS = [
  {area:'zone-1',id:'last-sale',name:'最後一場特賣',theme:'lure',difficulty:3,description:'空店的櫥窗突然亮了，折扣倒數只剩一秒。可是每次數到零，又會跳回一秒，始終不肯結束。',success:'看清循環的倒數，從櫥窗旁繞過。',failure:'櫥窗突然合攏，玻璃向外碎落。'},
  {area:'zone-1',id:'empty-queue',name:'沒有人的隊伍',theme:'lure',difficulty:1,description:'地上的排隊標記一個接一個亮起，收銀台也不停止叫「下一位」。店裡沒有店員，更沒有其他顧客。',success:'避開排隊標記，沿後場通過。',failure:'欄杆自行收攏，擋住出口。'},
  {area:'zone-1',id:'hanging-sign',name:'搖晃的路牌',theme:'terrain',difficulty:2,description:'一塊招牌懸在商街通道上，只靠最後一根吊索撐著。',success:'沿牆避開吊索，找到安全落腳點。',failure:'吊索斷裂，招牌砸向通道。'},
  {area:'zone-2',id:'sealed-door',name:'封死的防火門',theme:'mechanical',difficulty:3,description:'被封住的防火門後不停傳來撞門聲，鉸鏈已經向外凸起。',success:'避開門的正面，走維修側道。',failure:'鉸鏈斷開，門片向外倒下。'},
  {area:'zone-2',id:'false-radio',name:'錯頻廣播',theme:'sound',difficulty:5,description:'通訊器裡傳來不存在的第三名隊員聲音。',success:'比對頻道後隔離錯誤訊號。',failure:'聲音蓋過警報，隊伍誤入運轉機房。'},
  {area:'zone-3',id:'mirror-corridor',name:'錯位鏡廊',theme:'time',difficulty:5,description:'鏡中的倒影總比本人慢半拍。',success:'找到未受影響的出口。',failure:'倒影忽然追上動作，鏡面向外破裂。'},
  {area:'zone-3',id:'unlabeled-vial',name:'無標籤的樣本',theme:'chemical',difficulty:5,description:'一支沒有標籤的試管裂開，透明液體正滲出。',success:'封住污染範圍。',failure:'隔離櫃突然加壓，樣本液噴向走廊。'},
  {area:'zone-4',id:'dark-track',name:'失照軌道',theme:'terrain',difficulty:6,description:'軌道前方的燈一盞接一盞熄滅，黑暗正朝隊伍靠近。',success:'找到維修側道繞過失照區。',failure:'黑暗吞掉標記，隊伍在碎石帶摔傷。'},
  {area:'zone-5',id:'reverse-tide',name:'逆潮',theme:'terrain',difficulty:6,description:'退潮中的海水突然逆向攀上碼頭。',success:'利用繫索固定位置等待潮位回落。',failure:'浪頭將隊伍撞向護欄。'},
  {area:'zone-6',id:'same-door',name:'重複的門牌',theme:'time',difficulty:7,description:'連續走過五扇門，門牌卻全是同一個號碼。',success:'記錄燈管嗡鳴差異找到真正出口。',failure:'錯誤的門將隊伍帶回更深處。'},
  {area:'zone-7',id:'q-sealed-gate',name:'封死的隔離閘',theme:'mechanical',difficulty:8,description:'隔離閘擋住通道，馬達卻仍不停轉動。',success:'從維修槽解除馬達。',failure:'閘門突然下墜。'},
  {area:'zone-8',id:'early-signal',name:'提前抵達的訊號',theme:'sound',difficulty:9,description:'接收器先播放了你們幾秒後才會說出的話。',success:'切斷回授並標記訊號來源。',failure:'訊號形成迴圈，設備開始過載。'}
];
module.exports = { EVENTS };
