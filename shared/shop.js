const SHOP_RULES={
  stockSize:5,
  consumableSlots:3,
  equipmentSlots:2,
  priceByRarity:{common:1,uncommon:1.55,rare:2.35},
  chapterPriceMultiplier:[1,1.12,1.25]
};

const SHOP_PRICE_BASE={
  consumable:14,
  equipment:32
};

function shopBasePrice(item,chapter=0){
  const rarity=item?.rarity||'common';
  const kind=item?.slot?'equipment':'consumable';
  const base=SHOP_PRICE_BASE[kind];
  const rarityMult=SHOP_RULES.priceByRarity[rarity]||1;
  const chapterMult=SHOP_RULES.chapterPriceMultiplier[Math.max(0,Math.min(2,chapter))]||1;
  return Math.max(1,Math.round(base*rarityMult*chapterMult));
}

module.exports={SHOP_RULES,SHOP_PRICE_BASE,shopBasePrice};
