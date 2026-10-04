(()=>{
 const label={critical:'大成功',success:'成功',mixed:'代價成功',failure:'失敗','critical-failure':'大失敗'};
 let chain=Promise.resolve(),lastRoom=null,lastEvent=null;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function split(value){let left=Math.max(1,Math.min(20,Math.round(Number(value)||1))),parts=[];while(left>0){parts.push(Math.min(6,left));left-=6;}return parts;}
 const positions={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
 function face(value){const f=document.createElement('div');f.className='cube-face';for(let i=1;i<=9;i++){const p=document.createElement('i');p.className=positions[value].includes(i)?'pip':'empty-pip';f.appendChild(p);}return f;}
 function cube(value){const stage=document.createElement('div');stage.className='dice-stage';const c=document.createElement('div');c.className='dice-flat rolling';c.appendChild(face(value));stage.appendChild(c);stage.setAttribute('aria-label',value+' 點');return {stage,c,value};}
 async function show(records,title){if(!records.length||!animations)return;
 const panel=document.createElement('section');panel.className='dice-toast';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');const h=document.createElement('strong');h.textContent=title;panel.appendChild(h);
 const rows=records.map(record=>{const row=document.createElement('div');row.className='dice-row';const name=document.createElement('span');name.textContent=record.name||'團體';const tray=document.createElement('div');tray.className='dice-tray';const parts=split(record.die),cubes=parts.map(cube);cubes.forEach(({stage})=>tray.appendChild(stage));const result=document.createElement('small');result.textContent='擲骰中…';row.append(name,tray,result);panel.appendChild(row);return {record,cubes,result,parts};});
 document.body.appendChild(panel);const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;try{await wait(reduced?0:850);for(const {record,cubes,result,parts} of rows){cubes.forEach(({c})=>c.classList.remove('rolling'));result.textContent=`骰點 ${parts.join('＋')}＝${Number(record.die)} · 合計 ${Number(record.total)}${record.dc!=null?' / DC '+Number(record.dc):''}${record.degree?' · '+(label[record.degree]||record.degree):''}`;}await wait(reduced?1150:1450);}finally{panel.remove();}
 }
 let animations=true;try{animations=localStorage.getItem('kbm-dice-animation')!=='off';}catch{}
 const enabled=()=>animations;
 function setEnabled(value){animations=!!value;try{localStorage.setItem('kbm-dice-animation',animations?'on':'off');}catch{}}
 function coin(){const el=document.createElement('span');el.className='coin-die waiting';el.setAttribute('aria-label','骰子等待投擲，結果尚未揭示');const inner=document.createElement('span');inner.className='coin-inner';for(const face of ['positive','empty']){const side=document.createElement('i');side.className='coin-face coin-'+face;side.setAttribute('aria-hidden','true');inner.appendChild(side);}el.appendChild(inner);return el;}
 function reveal(tray,rolls,usedBefore=0){let heads=0;[...tray.children].forEach((el,i)=>{const positive=rolls[i]===1,spent=positive&&heads++<usedBefore;el.classList.remove('waiting');el.classList.add(positive?'front':'back');if(spent)el.classList.add('spent');el.setAttribute('aria-label',spent?'已消耗的有效骰子':positive?'有效骰子':'無效骰子');});}
 async function toss(tray,rolls,reduced,usedBefore=0){if(!reduced&&rolls.length){tray.classList.add('coin-rolling');await wait(850);tray.classList.remove('coin-rolling');}reveal(tray,rolls,usedBefore);}
 async function showClashes(records){
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const r of records){if(!animations)break;
   const panel=document.createElement('section');panel.className='dice-toast binary-clash';panel.setAttribute('role','status');panel.style.setProperty('--dice-color',r.color||'#6F92A8');
   const title=document.createElement('strong');if(r.targetName){title.appendChild(document.createTextNode((r.attackerName||'敵方')+' → '));const target=document.createElement('span');target.className='dice-target-name';target.textContent=r.targetName;target.style.color=r.targetColor||'#6F92A8';title.appendChild(target);}else title.textContent=r.name;panel.appendChild(title);
   const trays=[];
   for(const [label,rolls] of [['攻擊骰',r.attackRolls],['防禦骰',r.defenseRolls]]){
    const side=document.createElement('div');side.className='binary-side';const h=document.createElement('small');h.textContent=label;const tray=document.createElement('div');tray.className='binary-tray';
    rolls.forEach(()=>tray.appendChild(coin()));side.append(h,tray);panel.appendChild(side);trays.push(tray);
   }
   const result=document.createElement('p');result.className='coin-result';result.textContent='攻擊擲骰…';panel.appendChild(result);document.body.appendChild(panel);
   try{
    if(r.defenseFresh===false)reveal(trays[1],r.defenseRolls,Number(r.defenseUsedBefore||0));
    await toss(trays[0],r.attackRolls,reduced);result.textContent=r.defenseFresh===false?'沿用本回合防禦骰…':'防禦擲骰…';
    if(r.defenseFresh!==false)await toss(trays[1],r.defenseRolls,reduced,Number(r.defenseUsedBefore||0));
    result.textContent=`攻擊 ${r.attackTotal} − 防禦 ${r.defenseTotal} → 抵消 ${Math.min(r.attackTotal,r.defenseTotal)} 對`;
    const attack=[...trays[0].querySelectorAll('.front:not(.spent)')],defense=[...trays[1].querySelectorAll('.front:not(.spent)')];
    for(let i=0;i<Math.min(attack.length,defense.length);i++){attack[i].classList.add('coin-cut');defense[i].classList.add('coin-cut');}
    await wait(reduced?0:500);result.textContent=`攻擊 ${r.attackTotal} − 防禦 ${r.defenseTotal} ＝ 淨 ${r.net} 點`;
    await wait(1450);
   }finally{panel.remove();}
  }
 }
 function playClashes(records){chain=chain.catch(()=>{}).then(()=>showClashes(records));return chain;}
 function play(records,title='擲骰判定'){chain=chain.catch(()=>{}).then(()=>show(records,title));return chain;}
 function apply(room){const key=room.currentEvent?`${room.id}:${room.run}:${room.areaIndex}:${room.exploration?.position}:${room.currentEvent.id}`:null,r=room.eventResult;if(room.id!==lastRoom){lastRoom=room.id;lastEvent=r&&key?key:null;return;}if(!r){lastEvent=null;return;}if(!key||lastEvent===key)return;lastEvent=key;
 const records=r.degree==='personal'?(r.personalResults||[]).map(x=>({name:x.sinner,die:x.die,total:x.total,dc:x.dc,degree:x.degree})):Number(r.die)>0?[{name:'團體',die:r.die,total:r.total,dc:r.dc,degree:r.degree}]:[];if(records.length)play(records,r.degree==='personal'?'個人事件擲骰':'團體事件擲骰');
 }
 socket.on('room:update',apply);window.KBMDice={play,split,playClashes,enabled,setEnabled};
})();
