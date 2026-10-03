const AREAS = [
  { id:'zone-1', name:'廢棄商業區', level:1, risk:'LOW', tier:'beginner', requiredLevel:0, desc:'封鎖後的商業街、百貨後場與地下通道。常見與消費、廣告、人群殘響相關的怪異。' },
  { id:'zone-2', name:'地下維修層', level:3, risk:'MEDIUM', tier:'beginner', requiredLevel:0, desc:'泵房、維修井、管線與輸送設備構成的複雜區域。機械型與聲響型怪異較常出現。' },
  { id:'zone-3', name:'封鎖研究棟', level:5, risk:'HIGH', tier:'beginner', requiredLevel:0, desc:'舊研究設施與觀測室仍殘留未終止的實驗。認知、鏡像與檔案型怪異密度較高。' },
  { id:'zone-4', name:'外緣黑區', level:8, risk:'EXTREME', tier:'beginner', requiredLevel:0, desc:'城市邊緣的失照區與廢棄軌道帶。空間、獵食與無法穩定觀測的高危怪異活動頻繁。' },
  { id:'zone-5', name:'沉潮港灣', level:12, risk:'HIGH', tier:'intermediate', requiredLevel:12, desc:'退潮後才露出的碼頭、沉船艙室與潮汐觀測站。水位不依月相變化；回程前務必確認繫索。' },
  { id:'zone-6', name:'無窗迴廊', level:16, risk:'EXTREME', tier:'intermediate', requiredLevel:16, desc:'黃牆、潮濕地毯與不停嗡鳴的燈管。房間彼此相似，門牌、步數與時間都可能失去意義。' },
  { id:'zone-7', name:'灰疫封鎖市', level:18, risk:'HIGH', tier:'intermediate', requiredLevel:18, desc:'撤離警報停在同一天的感染都市，有些東西仍在等待被宣布痊癒。' },
  { id:'zone-8', name:'寂星觀測站', level:22, risk:'EXTREME', tier:'intermediate', requiredLevel:22, desc:'經空間轉接門抵達的深空觀測設施。密閉艙段仍有重力與空氣，窗外卻沒有已知星圖；遙遠訊號偶爾比提問更早抵達。' }
];

const SINNERS = [
  { id:'01', name:'李箱', stats:{combat:4,observe:8,mobility:5,stability:7}, specialty:'觀測解析' },
  { id:'02', name:'浮士德', stats:{combat:5,observe:9,mobility:4,stability:8}, specialty:'情報演算' },
  { id:'03', name:'堂吉訶德', stats:{combat:7,observe:4,mobility:8,stability:5}, specialty:'先鋒突入' },
  { id:'04', name:'良秀', stats:{combat:9,observe:6,mobility:7,stability:4}, specialty:'弱點切割' },
  { id:'05', name:'默爾索', stats:{combat:8,observe:5,mobility:4,stability:9}, specialty:'制壓固定' },
  { id:'06', name:'鴻璐', stats:{combat:5,observe:7,mobility:8,stability:6}, specialty:'適應感知' },
  { id:'07', name:'希斯克利夫', stats:{combat:9,observe:4,mobility:7,stability:5}, specialty:'強襲突破' },
  { id:'08', name:'以實瑪利', stats:{combat:7,observe:8,mobility:6,stability:8}, specialty:'追跡與風險判讀' },
  { id:'09', name:'羅佳', stats:{combat:7,observe:5,mobility:7,stability:6}, specialty:'機會判斷' },
  { id:'11', name:'辛克萊', stats:{combat:6,observe:6,mobility:7,stability:5}, specialty:'成長適應' },
  { id:'12', name:'奧提斯', stats:{combat:7,observe:8,mobility:5,stability:8}, specialty:'戰術指揮' },
  { id:'13', name:'格里高爾', stats:{combat:7,observe:6,mobility:5,stability:9}, specialty:'生存韌性' }
];

// v0.2 先接入一批原版事件，其他區域使用伺服器 fallback 事件；後續可無痛擴充完整事件庫。
const EVENTS = [
  {area:'zone-1',id:'last-sale',name:'最後一場特賣',theme:'lure',difficulty:3,description:'空店的櫥窗突然亮了，折扣倒數只剩一秒。可是每次數到零，又會跳回一秒，始終不肯結束。',success:'看清循環的倒數，從櫥窗旁繞過。',failure:'櫥窗突然合攏，玻璃向外碎落。'},
  {area:'zone-1',id:'empty-queue',name:'沒有人的隊伍',theme:'lure',difficulty:1,description:'地上的排隊標記一個接一個亮起，收銀台也不停止叫「下一位」。店裡沒有店員，更沒有其他顧客。',success:'避開排隊標記，沿後場通過。',failure:'欄杆自行收攏，擋住出口。'},
  {area:'zone-1',id:'hanging-sign',name:'搖晃的路牌',theme:'terrain',difficulty:0,description:'一塊招牌懸在商街通道上，只靠最後一根吊索撐著。吊索已快斷裂，從下面走過很容易被砸中。',success:'沿牆避開吊索，找到安全落腳點。',failure:'吊索斷裂，招牌砸向通道。'},
  {area:'zone-1',id:'fallen-shutter',name:'半落的鐵捲門',theme:'mechanical',difficulty:2,description:'商店的鐵捲門卡在半空，看起來還能從下面鑽過。馬達明明已經燒壞，卻仍在震動，門片也隨時可能滑下來。',success:'固定支架後找到側門。',failure:'支架鬆脫，門片猛然下滑。'},
  {area:'zone-1',id:'abandoned-meal',name:'仍溫熱的餐桌',theme:'time',difficulty:3,description:'封閉的餐飲區裡，桌上還放著兩份熱飯。碗口的蒸氣卻停在半空，沒有散開。',success:'確認停滯範圍，離開餐桌旁。',failure:'餐具突然滑動，桌椅擋住退路。'},
  {area:'zone-1',id:'receipt-storm',name:'收據雨',theme:'lure',difficulty:4,description:'關閉的收銀機不停吐出收據。兩人每往前走一步，收據上的金額就增加一些。',success:'停在收銀線外，從貨架後通過。',failure:'紙帶纏住腳踝，倒下的貨架封住通道。'},
  {area:'zone-2',id:'sealed-door',name:'封死的防火門',theme:'mechanical',difficulty:2,description:'被封住的防火門後，不停傳來撞門聲。門上的鉸鏈已經向外凸起，像快要被撞斷了。',success:'避開門的正面，走維修側道。',failure:'鉸鏈斷開，門片向外倒下。'},
  {area:'zone-2',id:'pressure-valve',name:'超壓的閥門',theme:'mechanical',difficulty:4,description:'壓力錶的指針不停震動，閥門縫隙發出刺耳的漏氣聲。裡面的壓力已經太高，繼續靠近可能被噴出的蒸氣傷到。',success:'避開洩壓口，沿管架下方通過。',failure:'蒸氣提前噴出，隊伍未能通過。'},
  {area:'zone-2',id:'moving-ladder',name:'移位的維修梯',theme:'terrain',difficulty:3,description:'每次燈光照過去，維修梯的位置就會改變。梯腳正一點點移向維修井，像要自己滑進去。',success:'重新固定梯腳，繞過井口。',failure:'梯腳滑進井中，踏板跟著鬆脫。'},
  {area:'zone-2',id:'false-radio',name:'錯頻廣播',theme:'sound',difficulty:5,description:'明明只有兩人出發，通訊器裡卻傳來第三名隊員的聲音。聲音像在與隊伍聯絡，卻找不到這個人。',success:'比對頻道後隔離了錯誤訊號。',failure:'聲音蓋過警報，隊伍誤入運轉的機房。'},
  {area:'zone-2',id:'cable-surge',name:'裸露的電纜',theme:'mechanical',difficulty:5,description:'斷掉的電纜泡在通道的積水裡。遠處的電箱忽亮忽滅，無法確定積水是否仍帶電。',success:'找到斷電開關，改走乾燥的管道。',failure:'電箱突然恢復供電，火花沿積水竄開。'},
  {area:'zone-2',id:'pump-backflow',name:'倒灌的泵房',theme:'terrain',difficulty:6,description:'泵房的排水口突然往外冒黑水。水位不停上升，已經快淹到兩人站著的平台。',success:'打開旁路排水，沿高處撤離。',failure:'旁路堵塞，水流沖倒護欄。'},
  {area:'zone-3',id:'mirror-corridor',name:'錯位鏡廊',theme:'time',difficulty:5,description:'走廊的鏡子照出隊伍的身影，但倒影的動作慢了半拍。本人已經轉頭，鏡裡的人還在看著前方。',success:'找到未受影響的出口，離開反射範圍。',failure:'倒影忽然追上動作，鏡面向外破裂。'},
  {area:'zone-3',id:'unlabeled-vial',name:'無標籤的樣本',theme:'chemical',difficulty:5,description:'一支沒有標籤的試管裂開了，透明液體正從裡面滲出。無法確認液體是什麼，也不知道碰到後會怎樣。',success:'封住污染範圍，從乾燥通道離開。',failure:'隔離櫃突然加壓，樣本液噴向走廊。'},
  {area:'zone-7',id:'q-sealed-gate',name:'封死的隔離閘',theme:'mechanical',difficulty:8,description:'隔離閘擋住了通道，馬達卻還在不停轉動。閘門下面散著壓碎的通行證，顯然不是能直接鑽過去的地方。',success:'從維修槽解除馬達，經側門通過。',failure:'閘門突然下墜，碎片彈向維修槽。'}
];

module.exports = { AREAS, SINNERS, EVENTS };
