const { EVENTS } = require('./events');
const { NORMAL_ENEMIES } = require('./normal-enemies');
const { ELITE_ENEMIES } = require('./elite-enemies');
const { BOSSES } = require('./bosses');
const { SUPPLIES } = require('./supplies');
const { REST_NODES } = require('./rest');
const { EQUIPMENT } = require('./equipment');
const { CONSUMABLES } = require('./consumables');
const { STATUS_EFFECTS, getStatus } = require('./status-effects');
const { SHOP_RULES, SHOP_PRICE_BASE, shopBasePrice } = require('./shop');
const { SINNER_SKILLS, skillsForSinner, getSinnerSkill } = require('./sinner-skills');

const AREAS = [
  { id:'zone-1', name:'廢棄商業區', risk:'LOW', desc:'封鎖後的商業街、百貨後場與地下通道。常見與消費、廣告、人群殘響相關的怪異。' },
  { id:'zone-2', name:'地下維修層', risk:'MEDIUM', desc:'泵房、維修井、管線與輸送設備構成的複雜區域。機械型與聲響型怪異較常出現。' },
  { id:'zone-3', name:'封鎖研究棟', risk:'HIGH', desc:'舊研究設施與觀測室仍殘留未終止的實驗。認知、鏡像與檔案型怪異密度較高。' },
  { id:'zone-4', name:'外緣黑區', risk:'EXTREME', desc:'城市邊緣的失照區與廢棄軌道帶。空間、獵食與高危怪異活動頻繁。' },
  { id:'zone-5', name:'沉潮港灣', risk:'HIGH', desc:'退潮後才露出的碼頭、沉船艙室與潮汐觀測站。水位不依月相變化。' },
  { id:'zone-6', name:'無窗迴廊', risk:'EXTREME', desc:'黃牆、潮濕地毯與不停嗡鳴的燈管。門牌、步數與時間都可能失去意義。' },
  { id:'zone-7', name:'灰疫封鎖市', risk:'HIGH', desc:'撤離警報停在同一天的感染都市，有些東西仍在等待被宣布痊癒。' },
  { id:'zone-8', name:'寂星觀測站', risk:'EXTREME', desc:'經空間轉接門抵達的深空觀測設施，遙遠訊號偶爾比提問更早抵達。' }
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

module.exports = { AREAS, SINNERS, EVENTS, NORMAL_ENEMIES, ELITE_ENEMIES, BOSSES, SUPPLIES, REST_NODES, EQUIPMENT, CONSUMABLES, STATUS_EFFECTS, getStatus, SHOP_RULES, SHOP_PRICE_BASE, shopBasePrice, SINNER_SKILLS, skillsForSinner, getSinnerSkill };
