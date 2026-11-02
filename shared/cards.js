(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.KBMCards=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 const SINS={wrath:{name:'暴怒',color:'#bd4946'},lust:{name:'色欲',color:'#d58138'},sloth:{name:'怠惰',color:'#c3a436'},gluttony:{name:'暴食',color:'#568d52'},gloom:{name:'憂鬱',color:'#63a9c3'},pride:{name:'傲慢',color:'#405e9c'},envy:{name:'嫉妒',color:'#89609f'}};
 const TYPES={slash:'斬',blunt:'鈍',pierce:'突',guard:'防禦'};
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
 '04':['點火','personal','目標燒傷 +2 層，2 組攻守。',{applyStatus:'burning',statusStacks:2,statusDuration:2,rarity:'common'}],
 '05':['依令重組','shuffle','棄 1 抽 1，洗勻抽牌堆，獲得 2 護盾。'],
 '06':['隨興換手','shuffle','棄 1 抽 1，洗勻抽牌堆。'],
 '07':['敲裂','personal','目標破裂 +2 層，3 組攻守。',{applyStatus:'rupture',statusStacks:2,statusDuration:3,rarity:'common'}],
 '08':['迎浪','personal','自己獲得反擊 +2 層，1 組攻守。',{selfCounter:2,rarity:'common'}],
 '09':['再押一次','shuffle','棄 1 抽 1，洗勻抽牌堆。'],
 '11':['模仿練習','copy','棄 1 張手牌，複製 1 張行動牌。'],
 '12':['戰術排序','stack','棄 1 張手牌，指定下次抽牌。'],
 '13':['適應整備','draw','抽 1 張牌，恢復 2 HP。']};
 const personalAbility=id=>{const p=PERSONAL[id];return p?{id:'ability-personal-'+id,name:p[0],effect:p[1],description:p[2],sinnerId:id,shield:['03','05'].includes(id)?2:0,heal:id==='13'?2:0,...(p[3]||{})}:null;};
 // Five additional exclusive ability cards per sinner; one always cycles or draws.
 const EXTRA_PERSONAL={
 '01':[['紙鳥翻頁',{effect:'draw'},'抽 1 張牌。'],['翼羽折影',{shield:4},'自己獲得 4 護盾。'],['步出鏡面',{selfStatus:'agile',statusDuration:1},'自己獲得 1 層靈敏，1 組攻守。'],['靜默推演',{applyStatus:'suppressed',statusDuration:1,costRequired:true,battleLimit:1},'棄 1 張未出手牌；目標攻防各減 3 骰，1 組攻守；每場限 1 次。'],['未寫之頁',{nextDraw:1},'下一組攻守開始時多抽 1 張。']],
 '02':[['數據補完',{effect:'draw'},'抽 1 張牌。'],['校準護壁',{shield:4},'自己獲得 4 護盾。'],['心神校正',{cleanse:true},'移除自己 1 種負面狀態。'],['破綻演算',{applyStatus:'vulnerable',statusDuration:1},'目標易傷 +1 層，1 組攻守。'],['囊中餘溫',{heal:4},'自己恢復 4 HP。']],
 '03':[['補給出征',{effect:'draw'},'抽 1 張牌。'],['騎士護佑',{shield:5},'自己獲得 5 護盾。'],['無懼衝鋒',{selfStatus:'agile',statusDuration:1},'自己獲得 1 層靈敏，1 組攻守。'],['路見不平',{teamShield:3,costRequired:true},'棄 1 張未出手牌；所有存活隊友獲得 3 護盾。'],['片刻甘露',{heal:4,healOveruse:true},'自己恢復 4 HP；計入治療過度次數，第 3 次治療後接下來 2 組攻守由伺服器接管。']],
 '04':[['焚稿',{detonate:{status:'burning',per:3},needsTarget:true,rarity:'common'},'引爆：立即造成「目標燒傷層數 × 3」傷害，燒傷層數減半。'],['野火',{spreadStatus:{status:'burning',ratio:1,max:3},needsTarget:true,costRequired:true,rarity:'uncommon'},'棄 1 張未出手牌；其他所有敵人獲得與目標相同的燒傷層數（每名最多 3 層）。'],['灰燼護身',{shieldPerStatus:{status:'burning',per:2,max:16},rarity:'uncommon'},'自己獲得「全場敵人燒傷總層數 × 2」護盾（最多 16）。'],['赤墨淋漓',{power:'kindle',battleLimit:1,rarity:'rare'},'整場能力：本場戰鬥中，你的攻擊每次命中，目標燒傷 +1 層。每場限 1 次。'],['餘燼翻頁',{effect:'draw',drawIfStatus:{status:'burning',n:1},needsTarget:true,rarity:'common'},'抽 1 張；若目標有燒傷，再抽 1 張。']],
 '05':[['行動整理',{effect:'draw'},'抽 1 張牌。'],['鎖鏈維持',{applyStatus:'paralysis',statusDuration:1},'目標麻痺 +1 層，1 組攻守。'],['立定',{shield:6},'自己獲得 6 護盾。'],['沉默清醒',{cleanse:true},'移除自己 1 種負面狀態。'],['按令固守',{selfStatus:'guarded',statusDuration:1},'自己獲得防護，1 組攻守內受到傷害降低 35%。']],
 '06':[['捲簾',{effect:'draw'},'抽 1 張牌。'],['翡翠庇護',{shield:4},'自己獲得 4 護盾。'],['煙雲',{applyStatus:'sinking',statusDuration:1},'目標沉淪 +1 層，1 組攻守。'],['金玉餘響',{goldBonus:4,battleLimit:1},'本場結束額外獲得 4 金幣；每場限 1 次，與技能共用 24 金幣上限。'],['閒庭步',{selfStatus:'agile',statusDuration:1},'自己獲得 1 層靈敏，1 組攻守。']],
 '07':[['不散的怨念',{ruptureKeep:true,rarity:'common'},'本組攻守中，破裂觸發後不減少層數。'],['裂痕蔓延',{spreadStatus:{status:'rupture',ratio:.5,max:3,duration:3},needsTarget:true,costRequired:true,rarity:'uncommon'},'棄 1 張未出手牌；其他所有敵人獲得目標破裂層數一半的破裂（每名最多 3 層）。'],['追打',{ruptureHunt:2,rarity:'uncommon'},'本組攻守中，你每次命中有破裂的敵人，額外造成 2 傷害。'],['豁出去',{effect:'draw',selfDamage:3,boostStatus:'damage-up',boostStacks:2,statusDuration:1,rarity:'common'},'自己失去 3 HP（不會低於 1），抽 1 張，獲得 2 層增傷，1 組攻守。'],['嵐丘',{power:'stormHill',battleLimit:1,rarity:'rare'},'整場能力：本場戰鬥中，你的攻擊每次命中，目標破裂 +1 層。每場限 1 次。']],
 '08':[['錨定',{guardBonus:2,rarity:'common'},'本組攻守防禦骰 +2。'],['代為受擊',{taunt:true,costRequired:true,rarity:'uncommon'},'棄 1 張未出手牌；本組攻守所有敵人的單體攻擊改打你，並獲得反擊 +1 層。只在敵方攻擊時有效。'],['拋錨反打',{counterDetonate:4,needsTarget:true,rarity:'uncommon'},'立即對目標造成「你的反擊層數 × 4」傷害，並清空反擊。'],['白鯨',{power:'mobyDick',battleLimit:1,rarity:'rare'},'整場能力：本場戰鬥中，你每次擋下敵方攻擊，獲得反擊 +1 層。每場限 1 次。'],['測深',{effect:'draw',shieldIfDefense:4,rarity:'common'},'抽 1 張；若是敵方攻擊的回合，再獲得 4 護盾。']],
 '09':[['幸運換手',{effect:'exchange'},'選擇 1 張未出的行動手牌，與指定敵方隨機 1 張行動手牌交換；交換僅限本場戰鬥。'],['先墊一手',{shield:4},'自己獲得 4 護盾。'],['翻倍賭注',{selfStatus:'damage-up',statusDuration:1},'自己增傷 +1 層，1 組攻守。'],['順手牽羊',{stealPile:'hand',costRequired:true,battleLimit:1},'棄 1 張未出手牌；偷取目標 1 張行動手牌，本場可用；每場限 1 次。'],['乾杯',{heal:4},'自己恢復 4 HP。']],
 '11':[['深呼吸',{effect:'draw'},'抽 1 張牌。'],['微聲禱告',{heal:4},'自己恢復 4 HP。'],['搖擺刻印',{imprint:true,battleLimit:1},'刻印 +1 層，隨機提高戰鬥／穩定／機動；每場限 1 次。'],['膽怯護持',{shield:4},'自己獲得 4 護盾。'],['新步伐',{selfStatus:'agile',statusDuration:1},'自己獲得 1 層靈敏，1 組攻守。']],
 '12':[['戰況速讀',{effect:'draw'},'抽 1 張牌。'],['方陣',{selfStatus:'guarded',statusDuration:1},'自己獲得防護，1 組攻守內受到傷害降低 35%。'],['全隊急行',{agile:1},'所有存活隊友靈敏 +1 層，2 組攻守。'],['斷令',{applyStatus:'sealed',statusDuration:1,costRequired:true,battleLimit:1},'棄 1 張未出手牌；封印目標技能 1 組攻守；每場限 1 次。'],['校射',{applyStatus:'vulnerable',statusDuration:1},'目標易傷 +1 層，1 組攻守。']],
 '13':[['清點物資',{effect:'draw'},'抽 1 張牌。'],['組織修復',{regeneration:1},'自己再生 +1 層，2 組攻守。'],['蟲甲',{shield:4},'自己獲得 4 護盾。'],['細胞代謝',{cleanse:true},'移除自己 1 種負面狀態。'],['蟲噬',{destroyEnemy:1,costRequired:true,battleLimit:1},'棄 1 張未出手牌；破壞目標 1 張行動牌，本場不可再用；每場限 1 次，與技能共用破壞 3 張上限。']]
 };
 const extraPersonalAbilities=id=>(EXTRA_PERSONAL[id]||[]).map(([name,effects,description],i)=>({id:`ability-exclusive-${id}-${i}`,name,effect:'personal',...effects,description,sinnerId:id}));
 const personalAbilities=id=>[personalAbility(id),...extraPersonalAbilities(id)].filter(Boolean);
 const starterPersonalAbilities=id=>personalAbilities(id).slice(0,2);
 const abilityNeedsCost=card=>!!card.costRequired||['shuffle','recover','stack','copy','exchange'].includes(card.effect);
 const abilityNeedsEnemy=card=>!!(card.effect==='exchange'||card.applyStatus||card.discardEnemy||card.stealPile||card.destroyEnemy||card.needsTarget);
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
 function weaponCards(weapon,id){if(!weapon)return [];const types=weapon.attackTypes?.length?weapon.attackTypes:['blunt'],spec=LCB[id]||LCB['01'],sins=weapon.rarity==='starter'?[spec.sins[0],spec.sins[0],spec.sins[1],spec.sins[2]]:WEAPON_SINS[types[0]]||WEAPON_SINS.blunt;return Array.from({length:4},(_,i)=>({id:`weapon-${weapon.id}-${i}`,name:weapon.name,kind:'action',source:'武器',faces:[{sin:sins[i],type:types[i%types.length],value:weapon.rarity==='starter'?1+(i%3):({common:3,uncommon:4,rare:5}[weapon.rarity]||3)+(i%2)},{sin:sins[(i+1)%4],type:types.length>1&&i===2?types[(i+1)%types.length]:'guard',value:weapon.rarity==='starter'?1+(i%2):({common:3,uncommon:4,rare:5}[weapon.rarity]||3)}]}));}
 function weaponSummary(weapon,id){return weaponCards(weapon,id).map(c=>`${SINS[c.faces[0].sin].name} ${TYPES[c.faces[0].type]}${c.faces[0].value}`).join(' · ');}
 const imported=typeof module==='object'&&module.exports?require('./skill-requirements'):(globalThis.KBMSkillRequirements||{});
 const requirement=skill=>Object.prototype.hasOwnProperty.call(imported,skill.id)?imported[skill.id]:null;
 const isOutputSkill=s=>s.activationSide==='attack'||!['heal','team-buff','guard','card-guard','support'].includes(s.kind);
 const skillPoints=(t,s)=>isOutputSkill(s)?t.attackColors:t.guardColors;
 const canUse=(t,s)=>meets(skillPoints(t,s),s.cardRequirement,isOutputSkill(s)?t.attackFaces:t.guardFaces);
 const conditionText=r=>Object.entries(r||{}).map(([s,n])=>`${SINS[s]?.name||s} ${typeof n==='number'?n+'點（累計）':n.exact!=null?'單張＝'+n.exact:'單張≥'+n.min}`).join(' ＋ ');
 const meets=(counts,req,faces=[])=>req!=null&&Object.keys(req).length>0&&Object.entries(req).every(([s,n])=>typeof n==='number'?Number((counts||{})[s]||0)>=n:faces.some(f=>f.sin===s&&(n.exact!=null?f.value===n.exact:f.value>=n.min)));
 const COLLECTIBLE=[];
 for(const rarity of ['common','uncommon','rare'])for(const sin of Object.keys(SINS))for(const type of ['slash','blunt','pierce']){const value={common:3,uncommon:4,rare:5}[rarity],id=rarity==='uncommon'?`card-${sin}-${type}`:`card-${rarity}-${sin}-${type}`;COLLECTIBLE.push({id,name:`${SINS[sin].name}・${TYPES[type]}擊`,kind:'action',cardItem:true,rarity,description:`行動牌：${SINS[sin].name} ${TYPES[type]}${value} / ${SINS[sin].name} 防禦${value}。加入本次遠征牌組。`,faces:[{sin,type,value},{sin,type:'guard',value}]});}
 for(const [i,sin] of Object.keys(SINS).entries())for(const [j,type] of ['slash','blunt','pierce'].entries()){const other=['slash','blunt','pierce'][(j+1)%3],next=Object.keys(SINS)[(i+1)%7];COLLECTIBLE.push({id:`card-dual-${sin}-${type}`,name:`交織・${SINS[sin].name}`,kind:'action',cardItem:true,rarity:'rare',description:`雙向行動牌：${SINS[sin].name} ${TYPES[type]}5 / ${SINS[next].name} ${TYPES[other]}4。加入本次遠征牌組。`,faces:[{sin,type,value:5},{sin:next,type:other,value:4}]});}
 for(const a of ABILITIES)COLLECTIBLE.push({...a,kind:'ability',cardItem:true,rarity:a.effect==='copy'?'rare':'uncommon'});
 for(const id of Object.keys(LCB))for(const a of personalAbilities(id))COLLECTIBLE.push({...a,kind:'ability',cardItem:true,rarity:a.rarity||(a.battleLimit?'rare':'uncommon')});
 const rewardPool=id=>COLLECTIBLE.filter(c=>!c.sinnerId||c.sinnerId===id);
 const face=(card,flipped=false)=>card.faces?.[flipped?1:0]||null;
 function totals(hand,picks){const counts={},attackColors={},guardColors={},attackFaces=[],guardFaces=[],points={slash:0,blunt:0,pierce:0,guard:0};for(const p of picks||[]){const card=hand.find(c=>c.uid===p.uid),f=face(card||{},p.flipped);if(!f)continue;counts[f.sin]=(counts[f.sin]||0)+f.value;(f.type==='guard'?guardFaces:attackFaces).push(f);const colors=f.type==='guard'?guardColors:attackColors;colors[f.sin]=(colors[f.sin]||0)+f.value;points[f.type]=(points[f.type]||0)+f.value;}return {counts,points,attackColors,guardColors,attackFaces,guardFaces};}
 return {SINS,TYPES,LCB,ABILITIES,COLLECTIBLE,personalAbility,personalAbilities,starterPersonalAbilities,rewardPool,extraPersonalAbilities,abilityNeedsCost,abilityNeedsEnemy,initialCards,weaponCards,weaponSummary,requirement,isOutputSkill,skillPoints,canUse,conditionText,meets,face,totals};
});
