const STARTER_WEAPONS={
 '01':{id:'starter-yi-sang',name:'墨痕短匕',slot:'weapon',rarity:'starter',attackTypes:['slash'],mods:{observe:1},description:'李箱的短匕。斬擊；觀察 +1。'},
 '02':{id:'starter-faust',name:'演算大劍',slot:'weapon',rarity:'starter',attackTypes:['blunt','pierce'],mods:{combat:1,mobility:-1},description:'浮士德的大劍。鈍擊／槍擊；戰鬥 +1、機動 -1。'},
 '03':{id:'starter-don',name:'突進騎槍',slot:'weapon',rarity:'starter',attackTypes:['pierce'],mods:{mobility:1},description:'堂吉訶德的長槍。突擊；機動 +1。'},
 '04':{id:'starter-ryoshu',name:'赤墨打刀',slot:'weapon',rarity:'starter',attackTypes:['slash'],mods:{combat:1},description:'良秀的武士刀。斬擊；戰鬥 +1。'},
 '05':{id:'starter-meursault',name:'拘束拳套',slot:'weapon',rarity:'starter',attackTypes:['blunt'],mods:{stability:1},description:'默爾索的拳套。鈍擊；穩定 +1。'},
 '06':{id:'starter-honglu',name:'青玉偃月刀',slot:'weapon',rarity:'starter',attackTypes:['slash'],mods:{mobility:1},description:'鴻璐的偃月刀。斬擊；機動 +1。'},
 '07':{id:'starter-heathcliff',name:'裂痕球棒',slot:'weapon',rarity:'starter',attackTypes:['blunt'],mods:{combat:1},description:'希斯克利夫的球棒。鈍擊；戰鬥 +1。'},
 '08':{id:'starter-ishmael',name:'航海重盾',slot:'weapon',rarity:'starter',attackTypes:['blunt'],mods:{stability:1,mobility:-1},description:'以實瑪利的盾牌。鈍擊；穩定 +1、機動 -1。'},
 '09':{id:'starter-rodion',name:'賭徒戰斧',slot:'weapon',rarity:'starter',attackTypes:['slash'],mods:{combat:1},description:'羅佳的斧頭。斬擊；戰鬥 +1。'},
 '11':{id:'starter-sinclair',name:'長柄伐斧',slot:'weapon',rarity:'starter',attackTypes:['slash'],mods:{combat:1,mobility:-1},description:'辛克萊的長柄斧。斬擊；戰鬥 +1、機動 -1。'},
 '12':{id:'starter-outis',name:'戰術火銃刺刀',slot:'weapon',rarity:'starter',attackTypes:['pierce','slash'],mods:{observe:1},description:'奧提斯的火銃刺刀。可選槍擊或斬擊；觀察 +1。'},
 '13':{id:'starter-gregor',name:'硬化蟲肢',slot:'weapon',rarity:'starter',attackTypes:['slash','pierce'],mods:{stability:1},description:'格里高爾硬化的蟲手臂。斬擊／槍擊；穩定 +1。'}
};
function starterWeaponFor(sinnerId){const w=STARTER_WEAPONS[String(sinnerId)];return w?JSON.parse(JSON.stringify(w)):null;}
module.exports={STARTER_WEAPONS,starterWeaponFor};
