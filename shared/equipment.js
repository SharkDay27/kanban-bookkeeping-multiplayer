const DAMAGE_TYPES={slash:'斬擊',blunt:'鈍擊',pierce:'突擊'};

const STARTER_WEAPONS={
 '01':{id:'starter-yi-sang',name:'墨痕短匕',slot:'weapon',rarity:'starter',attackTypes:['slash'],mods:{observe:1},description:'李箱的短匕。斬擊；觀察 +1。'},
 '02':{id:'starter-faust',name:'演算大劍',slot:'weapon',rarity:'starter',attackTypes:['slash'],mods:{combat:1,mobility:-1},description:'浮士德的大劍。斬擊；戰鬥 +1、機動 -1。'},
 '03':{id:'starter-don',name:'突進騎槍',slot:'weapon',rarity:'starter',attackTypes:['pierce'],mods:{mobility:1},description:'堂吉訶德的長槍。突擊；機動 +1。'},
 '04':{id:'starter-ryoshu',name:'赤墨打刀',slot:'weapon',rarity:'starter',attackTypes:['slash'],mods:{combat:1},description:'良秀的武士刀。斬擊；戰鬥 +1。'},
 '05':{id:'starter-meursault',name:'拘束拳套',slot:'weapon',rarity:'starter',attackTypes:['pierce'],mods:{stability:1},description:'默爾索的拳套。突擊；穩定 +1。'},
 '06':{id:'starter-honglu',name:'青玉偃月刀',slot:'weapon',rarity:'starter',attackTypes:['slash'],mods:{mobility:1},description:'鴻璐的偃月刀。斬擊；機動 +1。'},
 '07':{id:'starter-heathcliff',name:'裂痕球棒',slot:'weapon',rarity:'starter',attackTypes:['blunt'],mods:{combat:1},description:'希斯克利夫的球棒。鈍擊；戰鬥 +1。'},
 '08':{id:'starter-ishmael',name:'航海重盾',slot:'weapon',rarity:'starter',attackTypes:['blunt'],mods:{stability:1,mobility:-1},description:'以實瑪利的盾牌。鈍擊；穩定 +1、機動 -1。'},
 '09':{id:'starter-rodion',name:'賭徒戰斧',slot:'weapon',rarity:'starter',attackTypes:['slash'],mods:{combat:1},description:'羅佳的斧頭。斬擊；戰鬥 +1。'},
 '11':{id:'starter-sinclair',name:'長柄伐斧',slot:'weapon',rarity:'starter',attackTypes:['slash'],mods:{combat:1,mobility:-1},description:'辛克萊的長柄斧。斬擊；戰鬥 +1、機動 -1。'},
 '12':{id:'starter-outis',name:'戰術火銃刺刀',slot:'weapon',rarity:'starter',attackTypes:['slash','blunt'],mods:{observe:1},description:'奧提斯的火銃刺刀。可選斬擊或鈍擊；觀察 +1。'},
 '13':{id:'starter-gregor',name:'硬化蟲肢',slot:'weapon',rarity:'starter',attackTypes:['blunt'],mods:{stability:1},description:'格里高爾硬化的蟲手臂。鈍擊；穩定 +1。'}
};

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

function starterWeaponFor(sinnerId){const w=STARTER_WEAPONS[String(sinnerId)];return w?JSON.parse(JSON.stringify(w)):null;}
module.exports={EQUIPMENT,STARTER_WEAPONS,DAMAGE_TYPES,starterWeaponFor};