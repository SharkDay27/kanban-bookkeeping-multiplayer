const {getStatus}=require('../../shared/status-effects');
function activeDefinitions(player){return (player.battleStatusActive===false?[]:player.statuses||[]).map(active=>({active,def:getStatus(active.id)})).filter(x=>x.def);}
function multiplyHook(player,key,initial=1){let value=initial;for(const {def} of activeDefinitions(player))if(def[key]!==undefined)value*=Number(def[key]);return value;}
function sumHook(player,key){let value=0;for(const {def} of activeDefinitions(player))value+=Number(def[key]||0);return value;}
function tickDamageFor(player){return sumHook(player,'tickDamage');}
module.exports={activeDefinitions,multiplyHook,sumHook,tickDamageFor};
