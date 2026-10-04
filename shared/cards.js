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
 function initialCards(id){const spec=LCB[id]||LCB['01'],rows=[];[6,4,2].forEach((count,tier)=>{for(let i=0;i<count;i++)rows.push({id:`base-${id}-${tier}-${i}`,name:'LCB 行動',kind:'action',source:'初始',faces:[{sin:spec.sins[tier],type:spec.types[tier],value:1+(i%3)},{sin:spec.sins[(tier+(i%2))%3],type:'guard',value:1+((i+1)%3)}]});});return rows;}
 const WEAPON_SINS={slash:['wrath','wrath','lust','pride'],blunt:['sloth','sloth','wrath','envy'],pierce:['pride','pride','gloom','gluttony']};
 function weaponCards(weapon,id){if(!weapon)return [];const types=weapon.attackTypes?.length?weapon.attackTypes:['blunt'],spec=LCB[id]||LCB['01'],sins=weapon.rarity==='starter'?[spec.sins[0],spec.sins[0],spec.sins[1],spec.sins[2]]:WEAPON_SINS[types[0]]||WEAPON_SINS.blunt;return Array.from({length:4},(_,i)=>({id:`weapon-${weapon.id}-${i}`,name:weapon.name,kind:'action',source:'武器',faces:[{sin:sins[i],type:types[i%types.length],value:weapon.rarity==='rare'?3:weapon.rarity==='uncommon'?2+(i%2):1+(i%3)},{sin:sins[(i+1)%4],type:types.length>1&&i===2?types[(i+1)%types.length]:'guard',value:1+(i%2)}]}));}
 function weaponSummary(weapon,id){return weaponCards(weapon,id).map(c=>`${SINS[c.faces[0].sin].name} ${TYPES[c.faces[0].type]}${c.faces[0].value}`).join(' · ');}
 function requirement(skill,index=0){const [a,b,c]=(LCB[skill.sinnerId]||LCB['01']).sins;const tiers=[{[a]:2},{[a]:1,[b]:1},{[a]:2,[b]:1},{[a]:1,[b]:1,[c]:1},{[a]:2,[b]:2},{[a]:2,[b]:1,[c]:1}];return tiers[Math.max(0,Math.min(5,index))];}
 const conditionText=r=>Object.entries(r||{}).map(([s,n])=>`${SINS[s]?.name||s} ×${n}`).join(' ＋ ');
 const meets=(counts,req)=>Object.entries(req||{}).every(([s,n])=>Number(counts[s]||0)>=n);
 const COLLECTIBLE=[];for(const sin of Object.keys(SINS))for(const type of ['slash','blunt','pierce'])COLLECTIBLE.push({id:`card-${sin}-${type}`,name:`${SINS[sin].name}・${TYPES[type]}擊`,kind:'action',cardItem:true,rarity:'uncommon',description:`行動牌：${SINS[sin].name} ${TYPES[type]}3 / ${SINS[sin].name} 防禦2。加入本次遠征牌組。`,faces:[{sin,type,value:3},{sin,type:'guard',value:2}]});
 for(const [i,sin] of Object.keys(SINS).entries())for(const [j,type] of ['slash','blunt','pierce'].entries()){const other=['slash','blunt','pierce'][(j+1)%3],next=Object.keys(SINS)[(i+1)%7];COLLECTIBLE.push({id:`card-dual-${sin}-${type}`,name:`交織・${SINS[sin].name}`,kind:'action',cardItem:true,rarity:'rare',description:`雙向行動牌：${SINS[sin].name} ${TYPES[type]}3 / ${SINS[next].name} ${TYPES[other]}2。加入本次遠征牌組。`,faces:[{sin,type,value:3},{sin:next,type:other,value:2}]});}
 for(const a of ABILITIES)COLLECTIBLE.push({...a,kind:'ability',cardItem:true,rarity:a.effect==='copy'?'rare':'uncommon',description:a.description+' 加入本次遠征牌組。'});
 const face=(card,flipped=false)=>card.faces?.[flipped?1:0]||null;
 function totals(hand,picks){const counts={},points={slash:0,blunt:0,pierce:0,guard:0};for(const p of picks||[]){const card=hand.find(c=>c.uid===p.uid),f=face(card||{},p.flipped);if(!f)continue;counts[f.sin]=(counts[f.sin]||0)+1;points[f.type]=(points[f.type]||0)+f.value;}return {counts,points};}
 return {SINS,TYPES,LCB,ABILITIES,COLLECTIBLE,personalAbility,initialCards,weaponCards,weaponSummary,requirement,conditionText,meets,face,totals};
});
