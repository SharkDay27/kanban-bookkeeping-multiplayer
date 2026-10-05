const STAT_KEYS=['combat','observe','mobility','stability'];
function emptyMods(){return {combat:0,observe:0,mobility:0,stability:0};}
function equipmentStats(player){const mods=emptyMods();for(const item of Object.values(player.equipment||{})){if(!item?.mods)continue;for(const key of STAT_KEYS)mods[key]+=Number(item.mods[key]||0);}return mods;}
function mergeStatMods(...sources){const out=emptyMods();for(const source of sources)for(const key of STAT_KEYS)out[key]+=Number(source?.[key]||0);return out;}
module.exports={STAT_KEYS,emptyMods,equipmentStats,mergeStatMods};
