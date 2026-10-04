const {shopBasePrice}=require('../../shared/shop');
function priceFor(item,chapter=0){return shopBasePrice(item,chapter);}
module.exports={priceFor};
