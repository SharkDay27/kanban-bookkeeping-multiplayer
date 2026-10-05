(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.KBMCards=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 const SINS={wrath:{name:'暴怒',color:'#bd4946'},lust:{name:'色欲',color:'#d58138'},sloth:{name:'怠惰',color:'#c3a436'},gluttony:{name:'暴食',color:'#568d52'},gloom:{name:'憂鬱',color:'#63a9c3'},pride:{name:'傲慢',color:'#405e9c'},envy:{name:'嫉妒',color:'#89609f'}};
 const TYPES={slash:'斬',blunt:'鈍',pierce:'槍',guard:'防禦'};
 // LCB S1/S2/S3 affinities and damage types; game-specific double-ended adaptation.
 const LCB={
 '01':{sins:['gloom','envy','sloth'],types:['slash','pierce','slash']},
 '02':{sins:['pride','sloth','gluttony'],types:['blunt','blunt','pierce']},
 '03':{sins:['lust','envy','gluttony'],types:['pierce','pierce','pierce']},
 '04':{sins:['gluttony','lust','pride'],types:['slash','slash','slash']},
 '05':{sins:['sloth','pride','gloom'],types:['blunt','blunt','blunt']},
 '06':{sins:['pride','sloth','lust'],types:['blunt','slash','blunt']},
 '07':{sins:['envy','wrath','lust'],types:['blunt','blunt','blunt']},
 '08':{sins:['wrath','gluttony','gloom'],types:['blunt','blunt','blunt']},
 '09':{sins:['gluttony','pride','wrath'],types:['slash','slash','slash']},
 '11':{sins:['pride','wrath','envy'],types:['slash','slash','slash']},
 '12':{sins:['sloth','pride','gloom'],types:['pierce','slash','pierce']},
 '13':{sins:['gloom','gluttony','sloth'],types:['slash','pierce','pierce']}};
 const ABILITIES=[
 {id:'ability-draw',name:'整備',effect:'draw',description:'抽 1 張牌。'},
 {id:'ability-shuffle',name:'重整思路',effect:'shuffle',description:'選擇 1 張未出手牌回收，抽 1 張；洗勻剩餘抽牌堆。'},
 {id:'ability-recover',name:'回溯',effect:'recover',description:'棄 1 張未出手牌，選擇回收堆的 1 張行動牌加入手牌。'},
 {id:'ability-stack',name:'預備',effect:'stack',description:'棄 1 張未出手牌，將抽牌堆的 1 張行動牌移到最上方。'},
 {id:'ability-copy',name:'鏡像',effect:'copy',description:'棄 1 張未出手牌，複製手中的 1 張行動牌；每場最多 2 次，戰鬥結束消失。'}
 ];
 const PERSONAL={
 '01':['鏡中預演','stack','預備：棄 1 張手牌，指定下次抽牌。'],
 '02':['演算校正','recover','回溯：棄 1 張手牌，回收 1 張行動牌。'],
 '03':['騎士整裝','draw','抽 1 張牌，獲得 2 護盾。'],
 '04':['摹寫','copy','鏡像：棄 1 張手牌，複製 1 張行動牌。'],
 '05':['依令重組','shuffle','棄 1 抽 1，洗勻抽牌堆，獲得 2 護盾。'],
 '06':['隨興換手','shuffle','棄 1 抽 1，洗勻抽牌堆。'],
 '07':['執念重拾','recover','棄 1 張手牌，回收 1 張行動牌。'],
 '08':['航路預測','stack','棄 1 張手牌，指定下次抽牌。'],
 '09':['再押一次','shuffle','棄 1 抽 1，洗勻抽牌堆。'],
 '11':['模仿練習','copy','棄 1 張手牌，複製 1 張行動牌。'],
 '12':['戰術排序','stack','棄 1 張手牌，指定下次抽牌。'],
 '13':['適應整備','draw','抽 1 張牌，恢復 2 HP。']};
 const personalAbility=id=>{const p=PERSONAL[id];return p?{id:'ability-personal-'+id,name:p[0],effect:p[1],description:p[2],sinnerId:id,shield:['03','05'].includes(id)?2:0,heal:id==='13'?2:0}:null;};
 // Twelve cards, with separate attack/support sin budgets imported from the skill sheet.
 function sinLayout(weights,fallback){
  const entries=Object.keys(weights).filter(k=>weights[k]>0);if(!entries.length)entries.push(...fallback);
  const quotas=Object.fromEntries(entries.map(k=>[k,1]));
  for(let i=entries.length;i<12;i++){const k=entries.reduce((a,b)=>(weights[b]||1)/(quotas[b]+1)>(weights[a]||1)/(quotas[a]+1)?b:a);quotas[k]++;}
  const result=[];while(result.length<12)for(const k of entries)if(quotas[k]>0){result.push(k);quotas[k]--;}
  return result;
 }
 function initialCards(id){
  const spec=LCB[id]||LCB['01'],attack={},guard={};
  const support={ys:['ys-crow'],faust:['faust-emitter','faust-fluid'],don:['don-stew','don-fluid'],ryo:[],meur:['meur-chain','meur-pursuance'],hong:['hong-soda'],heath:[],ish:['ish-bygone'],rod:['rod-mirror'],sin:['sin-stew'],outis:['outis-holiday'],greg:[]};
  const prefixes={'01':'ys','02':'faust','03':'don','04':'ryo','05':'meur','06':'hong','07':'heath','08':'ish','09':'rod','11':'sin','12':'outis','13':'greg'},prefix=prefixes[id];
  for(const [skill,cost] of Object.entries(imported))if(skill.startsWith(prefix+'-')&&cost){const budget=(support[prefix]||[]).includes(skill)?guard:attack;for(const [sin,n] of Object.entries(cost))budget[sin]=(budget[sin]||0)+(typeof n==='number'?n:(n.exact||n.min||1));}
  const all={...attack};for(const [k,n] of Object.entries(guard))all[k]=(all[k]||0)+n;
  const top=sinLayout(attack,spec.sins),bottom=sinLayout(Object.keys(guard).length?guard:all,spec.sins);
  const cards=Array.from({length:12},(_,i)=>({id:`base-${id}-${i<6?0:i<10?1:2}-${i<6?i:i<10?i-6:i-10}`,name:'罪孽行動',kind:'action',source:'初始',faces:[{sin:top[i],type:spec.types[i<6?0:i<10?1:2],value:1+i%3},{sin:bottom[i],type:'guard',value:1+(i+1)%3}]}));
  const first=Object.keys(imported).find(k=>k.startsWith(prefix+'-')),cost=imported[first]||{},side=(support[prefix]||[]).includes(first)?1:0;
  const budget=()=>{const out={};for(const c of cards){const f=c.faces[side];out[f.sin]=(out[f.sin]||0)+f.value;}return out;};
  for(const [sin,need] of Object.entries(cost))while((budget()[sin]||0)<need){const receiver=cards.find(c=>c.faces[side].sin===sin&&c.faces[side].value<3),points=budget(),donor=cards.find(c=>c.faces[side].sin!==sin&&c.faces[side].value>1&&points[c.faces[side].sin]>(cost[c.faces[side].sin]||0));if(!receiver||!donor)break;receiver.faces[side].value++;donor.faces[side].value--;}
  for(const [key,req] of Object.entries(imported).filter(([k])=>k.startsWith(prefix+'-'))){const side=(support[prefix]||[]).includes(key)?1:0;for(const [sin,n] of Object.entries(req))if(typeof n==='object'){const value=n.exact||n.min;if(!cards.some(c=>c.faces[side].sin===sin&&c.faces[side].value===value)){const c=cards.find(c=>c.faces[side].sin===sin);if(c)c.faces[side].value=value;}}}// Reserve individual-face conditions, then ensure cumulative costs are achievable without overwriting them.
  for(const side of [0,1]){const reqs=Object.entries(imported).filter(([k])=>k.startsWith(prefix+'-')&&((support[prefix]||[]).includes(k)?1:0)===side),locked=new Set(),maximum={};
   for(const [,req] of reqs)for(const [sin,n] of Object.entries(req))if(typeof n==='number')maximum[sin]=Math.max(maximum[sin]||0,n);
   for(const [,req] of reqs)for(const [sin,n] of Object.entries(req))if(typeof n==='object'){const value=n.exact||n.min;let c=cards.find(c=>c.faces[side].sin===sin&&c.faces[side].value===value);if(!c)c=cards.find(c=>c.faces[side].sin===sin&&!locked.has(c));if(!c)c=cards.find(c=>!locked.has(c)&&cards.filter(x=>x.faces[side].sin===c.faces[side].sin).length>1);if(c){c.faces[side].sin=sin;c.faces[side].value=value;locked.add(c);}}
   const total=sin=>cards.reduce((n,c)=>n+(c.faces[side].sin===sin?c.faces[side].value:0),0);
   for(const [sin,need] of Object.entries(maximum))while(total(sin)<need){const own=cards.find(c=>c.faces[side].sin===sin&&c.faces[side].value<3&&!locked.has(c));if(own){own.faces[side].value++;continue;}const donor=cards.find(c=>!locked.has(c)&&c.faces[side].sin!==sin&&total(c.faces[side].sin)-c.faces[side].value>=Number(maximum[c.faces[side].sin]||0));if(!donor)break;donor.faces[side].sin=sin;donor.faces[side].value=Math.min(3,need-total(sin));}
  }
  return cards;
 }
 const WEAPON_SINS={slash:['wrath','wrath','lust','pride'],blunt:['sloth','sloth','wrath','envy'],pierce:['pride','pride','gloom','gluttony']};
 function weaponCards(weapon,id){if(!weapon)return [];const types=weapon.attackTypes?.length?weapon.attackTypes:['blunt'],spec=LCB[id]||LCB['01'],sins=weapon.rarity==='starter'?[spec.sins[0],spec.sins[0],spec.sins[1],spec.sins[2]]:WEAPON_SINS[types[0]]||WEAPON_SINS.blunt;return Array.from({length:4},(_,i)=>({id:`weapon-${weapon.id}-${i}`,name:weapon.name,kind:'action',source:'武器',faces:[{sin:sins[i],type:types[i%types.length],value:weapon.rarity==='rare'?3:weapon.rarity==='uncommon'?2+(i%2):1+(i%3)},{sin:sins[(i+1)%4],type:types.length>1&&i===2?types[(i+1)%types.length]:'guard',value:1+(i%2)}]}));}
 function weaponSummary(weapon,id){return weaponCards(weapon,id).map(c=>`${SINS[c.faces[0].sin].name} ${TYPES[c.faces[0].type]}${c.faces[0].value}`).join(' · ');}
 const imported=typeof module==='object'&&module.exports?require('./skill-requirements'):(globalThis.KBMSkillRequirements||{});
 const requirement=skill=>Object.prototype.hasOwnProperty.call(imported,skill.id)?imported[skill.id]:null;
 const isOutputSkill=s=>s.activationSide==='attack'||!['heal','team-buff','guard','card-guard','support'].includes(s.kind);
 const skillPoints=(t,s)=>isOutputSkill(s)?t.attackColors:t.guardColors;
 const canUse=(t,s)=>meets(skillPoints(t,s),s.cardRequirement,isOutputSkill(s)?t.attackFaces:t.guardFaces);
 const conditionText=r=>Object.entries(r||{}).map(([s,n])=>`${SINS[s]?.name||s} ${typeof n==='number'?n+'點（累計）':n.exact!=null?'單張＝'+n.exact:'單張≥'+n.min}`).join(' ＋ ');
 const meets=(counts,req,faces=[])=>req!=null&&Object.keys(req).length>0&&Object.entries(req).every(([s,n])=>typeof n==='number'?Number((counts||{})[s]||0)>=n:faces.some(f=>f.sin===s&&(n.exact!=null?f.value===n.exact:f.value>=n.min)));
 const COLLECTIBLE=[];for(const sin of Object.keys(SINS))for(const type of ['slash','blunt','pierce'])COLLECTIBLE.push({id:`card-${sin}-${type}`,name:`${SINS[sin].name}・${TYPES[type]}擊`,kind:'action',cardItem:true,rarity:'uncommon',description:`行動牌：${SINS[sin].name} ${TYPES[type]}3 / ${SINS[sin].name} 防禦2。加入本次遠征牌組。`,faces:[{sin,type,value:3},{sin,type:'guard',value:2}]});
 for(const [i,sin] of Object.keys(SINS).entries())for(const [j,type] of ['slash','blunt','pierce'].entries()){const other=['slash','blunt','pierce'][(j+1)%3],next=Object.keys(SINS)[(i+1)%7];COLLECTIBLE.push({id:`card-dual-${sin}-${type}`,name:`交織・${SINS[sin].name}`,kind:'action',cardItem:true,rarity:'rare',description:`雙向行動牌：${SINS[sin].name} ${TYPES[type]}3 / ${SINS[next].name} ${TYPES[other]}2。加入本次遠征牌組。`,faces:[{sin,type,value:3},{sin:next,type:other,value:2}]});}
 for(const a of ABILITIES)COLLECTIBLE.push({...a,kind:'ability',cardItem:true,rarity:a.effect==='copy'?'rare':'uncommon',description:a.description+' 加入本次遠征牌組。'});
 const face=(card,flipped=false)=>card.faces?.[flipped?1:0]||null;
 function totals(hand,picks){const counts={},attackColors={},guardColors={},attackFaces=[],guardFaces=[],points={slash:0,blunt:0,pierce:0,guard:0};for(const p of picks||[]){const card=hand.find(c=>c.uid===p.uid),f=face(card||{},p.flipped);if(!f)continue;counts[f.sin]=(counts[f.sin]||0)+f.value;(f.type==='guard'?guardFaces:attackFaces).push(f);const colors=f.type==='guard'?guardColors:attackColors;colors[f.sin]=(colors[f.sin]||0)+f.value;points[f.type]=(points[f.type]||0)+f.value;}return {counts,points,attackColors,guardColors,attackFaces,guardFaces};}
 return {SINS,TYPES,LCB,ABILITIES,COLLECTIBLE,personalAbility,initialCards,weaponCards,weaponSummary,requirement,isOutputSkill,skillPoints,canUse,conditionText,meets,face,totals};
});
