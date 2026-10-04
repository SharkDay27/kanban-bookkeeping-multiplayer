const DAMAGE_TYPE_LABELS={slash:'斬擊',blunt:'鈍擊',pierce:'突擊'};
const WEAK=1.35,RESIST=.72,NEUTRAL=1;
function hashId(id=''){let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;return h;}
function profileForEnemy(id='enemy'){
  const types=['slash','blunt','pierce'],h=hashId(id),weak=types[h%3],resist=types[(h%3+1+(h%2))%3];
  const out={slash:NEUTRAL,blunt:NEUTRAL,pierce:NEUTRAL};out[weak]=WEAK;if(resist!==weak)out[resist]=RESIST;return out;
}
function multiplier(profile,type){return Number(profile?.[type]??NEUTRAL);}
function relation(mult){return mult>=1.2?'弱點':mult<=.8?'抗性':'普通';}
module.exports={DAMAGE_TYPE_LABELS,WEAK,RESIST,NEUTRAL,profileForEnemy,multiplier,relation};