const {STARTER_WEAPONS,starterWeaponFor}=require('./starter-equipment');
const {DAMAGE_TYPE_LABELS}=require('./damage-types');

const EQUIPMENT=[
  // Weapons / common
  {id:'eq-serrated-cleaver',name:'鋸齒拆解刀',slot:'weapon',rarity:'common',attackTypes:['slash'],mods:{combat:2,mobility:-1},description:'斬擊。戰鬥 +2、機動 -1。沉重鋸背適合破開軟質目標。'},
  {id:'eq-hydraulic-maul',name:'液壓破拆槌',slot:'weapon',rarity:'common',attackTypes:['blunt'],mods:{combat:2,observe:-1},description:'鈍擊。戰鬥 +2、觀察 -1。威力直接，但不利精細判斷。'},
  {id:'eq-pneumatic-spear',name:'氣動穿刺槍',slot:'weapon',rarity:'common',attackTypes:['pierce'],mods:{combat:1,mobility:1,stability:-1},description:'突擊。戰鬥 +1、機動 +1、穩定 -1。'},
  {id:'eq-short-sabre',name:'短身軍刀',slot:'weapon',rarity:'common',attackTypes:['slash'],mods:{mobility:2,combat:1,stability:-1},description:'斬擊。機動 +2、戰鬥 +1、穩定 -1。'},
  {id:'eq-rebar-club',name:'配重鋼筋棍',slot:'weapon',rarity:'common',attackTypes:['blunt'],mods:{combat:1,stability:1,mobility:-1},description:'鈍擊。戰鬥 +1、穩定 +1、機動 -1。'},
  // Weapons / uncommon
  {id:'eq-rescue-axe',name:'多用途救援斧',slot:'weapon',rarity:'uncommon',attackTypes:['slash','blunt'],mods:{combat:2,stability:1,mobility:-1},description:'可選斬擊或鈍擊。戰鬥 +2、穩定 +1、機動 -1。'},
  {id:'eq-needle-bayonet',name:'細針刺刀',slot:'weapon',rarity:'uncommon',attackTypes:['pierce','slash'],mods:{mobility:2,combat:1,stability:-1},description:'可選突擊或斬擊。機動 +2、戰鬥 +1、穩定 -1。'},
  {id:'eq-impact-pike',name:'衝角長柄槌',slot:'weapon',rarity:'uncommon',attackTypes:['blunt','pierce'],mods:{combat:2,observe:1,mobility:-2},description:'可選鈍擊或突擊。戰鬥 +2、觀察 +1、機動 -2。'},
  {id:'eq-vibration-blade',name:'震動切割刃',slot:'weapon',rarity:'uncommon',attackTypes:['slash'],mods:{combat:2,observe:1,stability:-1},description:'斬擊。戰鬥 +2、觀察 +1、穩定 -1。'},
  {id:'eq-telescopic-lance',name:'伸縮戰術槍',slot:'weapon',rarity:'uncommon',attackTypes:['pierce'],mods:{mobility:2,observe:1,combat:1,stability:-2},description:'突擊。機動 +2、觀察 +1、戰鬥 +1、穩定 -2。'},
  // Weapons / rare
  {id:'eq-impact-driver',name:'衝擊樁機',slot:'weapon',rarity:'rare',attackTypes:['blunt','pierce'],mods:{combat:3,mobility:-2},description:'可選鈍擊或突擊。戰鬥 +3、機動 -2。'},
  {id:'eq-monomolecular-edge',name:'單分子長刃',slot:'weapon',rarity:'rare',attackTypes:['slash'],mods:{combat:3,observe:1,stability:-1},description:'斬擊。戰鬥 +3、觀察 +1、穩定 -1。'},
  {id:'eq-countermass-halberd',name:'逆配重戟',slot:'weapon',rarity:'rare',attackTypes:['slash','pierce'],mods:{combat:3,mobility:1,stability:-2},description:'可選斬擊或突擊。戰鬥 +3、機動 +1、穩定 -2。'},
  {id:'eq-pulse-hammer',name:'脈衝震擊槌',slot:'weapon',rarity:'rare',attackTypes:['blunt'],mods:{combat:3,stability:2,observe:-2,mobility:-1},description:'鈍擊。戰鬥 +3、穩定 +2、觀察 -2、機動 -1。'},
  {id:'eq-triad-weapon',name:'三相破障器',slot:'weapon',rarity:'rare',attackTypes:['slash','blunt','pierce'],mods:{combat:2,observe:1,mobility:1,stability:-2},description:'可選斬擊、鈍擊或突擊。泛用性高，但精神負擔明顯。'},

  // Armor / common
  {id:'eq-service-coat',name:'維修防護衣',slot:'armor',rarity:'common',mods:{stability:2,mobility:-1},description:'穩定 +2、機動 -1。'},
  {id:'eq-light-rig',name:'輕量探索背心',slot:'armor',rarity:'common',mods:{mobility:2,stability:-1},description:'機動 +2、穩定 -1。'},
  {id:'eq-padding-jacket',name:'夾層緩衝外套',slot:'armor',rarity:'common',mods:{stability:1,combat:1,observe:-1},description:'穩定 +1、戰鬥 +1、觀察 -1。'},
  {id:'eq-surveyor-vest',name:'測繪員背心',slot:'armor',rarity:'common',mods:{observe:2,combat:-1},description:'觀察 +2、戰鬥 -1。'},
  // Armor / uncommon
  {id:'eq-sealed-suit',name:'密封隔離服',slot:'armor',rarity:'uncommon',mods:{stability:2,observe:1,mobility:-1},description:'穩定 +2、觀察 +1、機動 -1。'},
  {id:'eq-braced-coat',name:'支架強化大衣',slot:'armor',rarity:'uncommon',mods:{combat:2,stability:2,mobility:-2},description:'戰鬥 +2、穩定 +2、機動 -2。'},
  {id:'eq-phase-cloak',name:'折光薄披',slot:'armor',rarity:'uncommon',mods:{mobility:2,observe:2,stability:-2},description:'機動 +2、觀察 +2、穩定 -2。'},
  {id:'eq-pressure-shell',name:'耐壓殼衣',slot:'armor',rarity:'uncommon',mods:{stability:3,combat:-1,mobility:-1},description:'穩定 +3、戰鬥 -1、機動 -1。'},
  // Armor / rare
  {id:'eq-reactive-plate',name:'反應式護板',slot:'armor',rarity:'rare',mods:{stability:3,combat:1,mobility:-2},description:'穩定 +3、戰鬥 +1、機動 -2。'},
  {id:'eq-scout-harness',name:'先遣機動裝具',slot:'armor',rarity:'rare',mods:{mobility:3,observe:1,stability:-2},description:'機動 +3、觀察 +1、穩定 -2。'},
  {id:'eq-anomaly-laminate',name:'異常層壓防護服',slot:'armor',rarity:'rare',mods:{stability:3,observe:2,combat:-1,mobility:-1},description:'穩定 +3、觀察 +2、戰鬥 -1、機動 -1。'},
  {id:'eq-assault-frame',name:'突入外骨骼',slot:'armor',rarity:'rare',mods:{combat:3,stability:2,observe:-2,mobility:-1},description:'戰鬥 +3、穩定 +2、觀察 -2、機動 -1。'},

  // Accessories / common
  {id:'eq-detector',name:'異常探測器',slot:'accessory',rarity:'common',mods:{observe:2,combat:-1},description:'觀察 +2、戰鬥 -1。'},
  {id:'eq-counterweight',name:'戰術配重環',slot:'accessory',rarity:'common',mods:{combat:1,stability:1,mobility:-1},description:'戰鬥 +1、穩定 +1、機動 -1。'},
  {id:'eq-route-chalk',name:'回溯標記粉筆',slot:'accessory',rarity:'common',mods:{observe:1,stability:1},description:'觀察 +1、穩定 +1。'},
  {id:'eq-quick-holster',name:'快拆工具扣',slot:'accessory',rarity:'common',mods:{mobility:1,combat:1,stability:-1},description:'機動 +1、戰鬥 +1、穩定 -1。'},
  // Accessories / uncommon
  {id:'eq-quiet-tag',name:'靜默識別牌',slot:'accessory',rarity:'uncommon',mods:{stability:2,observe:1},description:'穩定 +2、觀察 +1。'},
  {id:'eq-reflex-charm',name:'反射校準器',slot:'accessory',rarity:'uncommon',mods:{mobility:2,observe:1,stability:-1},description:'機動 +2、觀察 +1、穩定 -1。'},
  {id:'eq-risk-dial',name:'風險讀數盤',slot:'accessory',rarity:'uncommon',mods:{observe:2,combat:1,stability:-1},description:'觀察 +2、戰鬥 +1、穩定 -1。'},
  {id:'eq-anchor-token',name:'定錨代幣',slot:'accessory',rarity:'uncommon',mods:{stability:2,combat:1,mobility:-1},description:'穩定 +2、戰鬥 +1、機動 -1。'},
  // Accessories / rare
  {id:'eq-blackbox-eye',name:'黑匣觀測眼',slot:'accessory',rarity:'rare',mods:{observe:3,combat:1,stability:-2},description:'觀察 +3、戰鬥 +1、穩定 -2。'},
  {id:'eq-redline-buckle',name:'紅線超載扣',slot:'accessory',rarity:'rare',mods:{combat:3,mobility:2,stability:-2,observe:-1},description:'戰鬥 +3、機動 +2、穩定 -2、觀察 -1。'},
  {id:'eq-calm-core',name:'靜默心核',slot:'accessory',rarity:'rare',mods:{stability:3,observe:2,combat:-1},description:'穩定 +3、觀察 +2、戰鬥 -1。'},
  {id:'eq-vector-lens',name:'向量預測鏡',slot:'accessory',rarity:'rare',mods:{observe:3,mobility:2,stability:-2},description:'觀察 +3、機動 +2、穩定 -2。'}
];

module.exports={EQUIPMENT,STARTER_WEAPONS,DAMAGE_TYPES:DAMAGE_TYPE_LABELS,starterWeaponFor};
