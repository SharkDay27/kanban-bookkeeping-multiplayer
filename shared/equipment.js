const {STARTER_WEAPONS,starterWeaponFor}=require('./starter-equipment');
const {DAMAGE_TYPE_LABELS}=require('./damage-types');

const EQUIPMENT=[
 {id:'eq-serrated-cleaver',name:'鋸齒切割刀',slot:'weapon',rarity:'common',attackTypes:['slash'],mods:{combat:2,mobility:-1},description:'斬擊。戰鬥 +2、機動 -1。'},
 {id:'eq-hydraulic-maul',name:'液壓破拆槌',slot:'weapon',rarity:'common',attackTypes:['blunt'],mods:{combat:2,observe:-1},description:'鈍擊。戰鬥 +2、觀察 -1。'},
 {id:'eq-pneumatic-spear',name:'氣動穿刺槍',slot:'weapon',rarity:'common',attackTypes:['pierce'],mods:{mobility:1,combat:1,stability:-1},description:'突擊。戰鬥 +1、機動 +1、穩定 -1。'},
 {id:'eq-rescue-axe',name:'多用途救援斧',slot:'weapon',rarity:'uncommon',attackTypes:['slash','blunt'],mods:{combat:2,stability:1,mobility:-1},description:'可選斬擊或鈍擊。戰鬥 +2、穩定 +1、機動 -1。'},
 {id:'eq-needle-bayonet',name:'細針刺刀',slot:'weapon',rarity:'uncommon',attackTypes:['pierce','slash'],mods:{mobility:2,combat:1,stability:-1},description:'可選突擊或斬擊。機動 +2、戰鬥 +1、穩定 -1。'},
 {id:'eq-impact-driver',name:'衝擊樁機',slot:'weapon',rarity:'rare',attackTypes:['blunt','pierce'],mods:{combat:3,mobility:-2},description:'可選鈍擊或突擊。戰鬥 +3、機動 -2。'},
 {id:'eq-monomolecular-edge',name:'單分子長刃',slot:'weapon',rarity:'rare',attackTypes:['slash'],mods:{combat:3,observe:1,stability:-1},description:'斬擊。戰鬥 +3、觀察 +1、穩定 -1。'},
 {id:'eq-service-coat',name:'維修防護衣',slot:'armor',rarity:'common',mods:{stability:2,mobility:-1},description:'穩定 +2、機動 -1。'},
 {id:'eq-light-rig',name:'輕量探索背心',slot:'armor',rarity:'common',mods:{mobility:2,stability:-1},description:'機動 +2、穩定 -1。'},
 {id:'eq-sealed-suit',name:'密封隔離服',slot:'armor',rarity:'uncommon',mods:{stability:2,observe:1,mobility:-1},description:'穩定 +2、觀察 +1、機動 -1。'},
 {id:'eq-reactive-plate',name:'反應式護板',slot:'armor',rarity:'rare',mods:{stability:3,combat:1,mobility:-2},description:'穩定 +3、戰鬥 +1、機動 -2。'},
 {id:'eq-scout-harness',name:'先遣機動裝具',slot:'armor',rarity:'rare',mods:{mobility:3,observe:1,stability:-2},description:'機動 +3、觀察 +1、穩定 -2。'},
 {id:'eq-detector',name:'異常探測器',slot:'accessory',rarity:'common',mods:{observe:2,combat:-1},description:'觀察 +2、戰鬥 -1。'},
 {id:'eq-counterweight',name:'戰術配重環',slot:'accessory',rarity:'common',mods:{combat:1,stability:1,mobility:-1},description:'戰鬥 +1、穩定 +1、機動 -1。'},
 {id:'eq-quiet-tag',name:'靜默識別牌',slot:'accessory',rarity:'uncommon',mods:{stability:2,observe:1},description:'穩定 +2、觀察 +1。'},
 {id:'eq-reflex-charm',name:'反射校準器',slot:'accessory',rarity:'uncommon',mods:{mobility:2,observe:1,stability:-1},description:'機動 +2、觀察 +1、穩定 -1。'},
 {id:'eq-blackbox-eye',name:'黑匣觀測眼',slot:'accessory',rarity:'rare',mods:{observe:3,combat:1,stability:-2},description:'觀察 +3、戰鬥 +1、穩定 -2。'}
];

module.exports={EQUIPMENT,STARTER_WEAPONS,DAMAGE_TYPES:DAMAGE_TYPE_LABELS,starterWeaponFor};
