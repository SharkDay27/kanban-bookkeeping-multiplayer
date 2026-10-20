(()=>{
 const label={critical:'大成功',success:'成功',mixed:'代價成功',failure:'失敗','critical-failure':'大失敗'};
 let chain=Promise.resolve(),lastRoom=null,lastEvent=null,busy=0,pendingEvent=null;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function split(value){let left=Math.max(1,Math.min(20,Math.round(Number(value)||1))),parts=[];while(left>0){parts.push(Math.min(6,left));left-=6;}return parts;}
 const positions={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
 function face(value){const f=document.createElement('div');f.className='cube-face';for(let i=1;i<=9;i++){const p=document.createElement('i');p.className=(positions[value]||[]).includes(i)?'pip':'empty-pip';f.appendChild(p);}return f;}
 // Cube rotation that brings each face to the front; extra whole turns keep the landing orientation.
 const orient={1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]};
 const sound=name=>{try{window.KBMCombatSounds?.[name]?.();}catch{}};
 function cube(value){const stage=document.createElement('div');stage.className='dice-stage';const c=document.createElement('div');c.className='dice-cube';for(let v=1;v<=6;v++){const f=face(v);f.classList.add('f'+v);c.appendChild(f);}stage.appendChild(c);stage.setAttribute('aria-label','擲骰中，結果尚未揭示');return {stage,c,value};}
 function land({c,value},i){const [x,y]=orient[value]||orient[1];c.style.transform=`rotateX(${x+360*(2+i%2)}deg) rotateY(${y+360*(3-i%2)}deg)`;}
 async function show(records,title){if(!records.length||!animations)return;
 const panel=document.createElement('section');panel.className='dice-toast';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');const h=document.createElement('strong');h.textContent=title;panel.appendChild(h);
 const rows=records.map(record=>{const row=document.createElement('div');row.className='dice-row';const name=document.createElement('span');name.textContent=record.name||'團體';const tray=document.createElement('div');tray.className='dice-tray';const parts=split(record.die),cubes=parts.map(v=>cube(v));cubes.forEach(({stage},i)=>{stage.style.setProperty('--i',i);tray.appendChild(stage);});const result=document.createElement('small');result.textContent='擲骰中…';row.append(name,tray,result);panel.appendChild(row);return {record,cubes,result,parts,row};});
 document.body.appendChild(panel);const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;void panel.offsetWidth;panel.classList.toggle('dice-instant',reduced);for(const {cubes} of rows)cubes.forEach((x,i)=>{x.stage.classList.add('tossing');land(x,i);});if(!reduced)sound('diceRoll');try{await wait(reduced?0:1000);if(!reduced)sound('diceLand');for(const {record,cubes,result,parts,row} of rows){cubes.forEach(({stage},i)=>{stage.classList.remove('tossing');stage.classList.add('landed');stage.setAttribute('aria-label',parts[i]+' 點');});result.textContent=`骰點 ${parts.join('＋')}＝${Number(record.die)} · 合計 ${Number(record.total)}${record.dc!=null?' / DC '+Number(record.dc):''}${record.degree?' · '+(label[record.degree]||record.degree):''}`;if(label[record.degree]){row.dataset.degree=record.degree;const stamp=document.createElement('b');stamp.className='dice-degree';stamp.textContent=label[record.degree];stamp.setAttribute('aria-hidden','true');row.appendChild(stamp);}}await wait(reduced?1150:1450);}finally{panel.remove();}
 }
 let animations=true;try{animations=localStorage.getItem('kbm-dice-animation')!=='off';}catch{}
 const enabled=()=>animations;
 function setEnabled(value){animations=!!value;try{localStorage.setItem('kbm-dice-animation',animations?'on':'off');}catch{}}
 function coin(){const el=document.createElement('span');el.className='coin-die waiting';el.setAttribute('aria-label','骰子等待投擲，結果尚未揭示');const inner=document.createElement('span');inner.className='coin-inner';for(const face of ['positive','empty']){const side=document.createElement('i');side.className='coin-face coin-'+face;side.setAttribute('aria-hidden','true');inner.appendChild(side);}el.appendChild(inner);return el;}
 function reveal(tray,rolls,usedBefore=0){let heads=0;[...tray.children].forEach((el,i)=>{const positive=rolls[i]===1,spent=positive&&heads++<usedBefore;el.classList.remove('waiting');el.classList.add(positive?'front':'back');if(spent)el.classList.add('spent');el.style.setProperty('--i',i);el.classList.add('landed');el.setAttribute('aria-label',spent?'已消耗的有效骰子':positive?'有效骰子':'無效骰子');});}
 async function toss(tray,rolls,reduced,usedBefore=0,duration=850){[...tray.children].forEach((el,i)=>el.style.setProperty('--i',i));if(!reduced&&rolls.length){tray.classList.add('coin-rolling');sound('diceRoll');await wait(duration);tray.classList.remove('coin-rolling');sound('diceLand');}reveal(tray,rolls,usedBefore);}
 async function tossAttempts(tray,rolls,attempts,chosen,result,label,reduced,usedBefore=0){
  if(!attempts||attempts.length<2)return toss(tray,rolls,reduced,usedBefore);
  for(let i=0;i<attempts.length;i++){tray.replaceChildren(...attempts[i].map(()=>coin()));result.textContent=label+' · 第 '+(i+1)+' 次擲骰…';await toss(tray,attempts[i],reduced);result.textContent=label+' · 第 '+(i+1)+' 次：'+attempts[i].reduce((n,x)=>n+x,0)+' 個正面';await wait(reduced?0:500);}
  tray.replaceChildren(...rolls.map(()=>coin()));reveal(tray,rolls,usedBefore);result.textContent=label+' 兩次正面 '+attempts.map(a=>a.reduce((n,x)=>n+x,0)).join('／')+'，採用第 '+(Number(chosen||0)+1)+' 次';await wait(reduced?0:700);
 }
 async function showClashes(records){
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const r of records){if(!animations)break;
   const panel=document.createElement('section');panel.className='dice-toast binary-clash';panel.setAttribute('role','status');panel.style.setProperty('--dice-color',r.color||'#6F92A8');
   const title=document.createElement('strong');if(r.targetName){title.appendChild(document.createTextNode((r.attackerName||'敵方')+' → '));const target=document.createElement('span');target.className='dice-target-name';target.textContent=r.targetName;target.style.color=r.targetColor||'#6F92A8';title.appendChild(target);}else title.textContent=r.name;panel.appendChild(title);
   const trays=[];
   for(const [label,rolls] of [['攻擊骰',r.attackRolls],['防禦骰',r.defenseRolls]]){
    if(trays.length){const divider=document.createElement('div');divider.className='clash-divider';divider.setAttribute('aria-hidden','true');divider.innerHTML='<b>VS</b>';panel.appendChild(divider);}
    const side=document.createElement('div');side.className='binary-side '+(trays.length?'defense-side':'attack-side');if(trays.length)side.style.setProperty('--dice-color',r.targetColor||'#5f7f95');const h=document.createElement('small');h.textContent=label;const tray=document.createElement('div');tray.className='binary-tray';
    rolls.forEach(()=>tray.appendChild(coin()));side.append(h,tray);panel.appendChild(side);trays.push(tray);
   }
   const result=document.createElement('p');result.className='coin-result';result.textContent='攻擊擲骰…';panel.appendChild(result);document.body.appendChild(panel);
   try{
    if(r.defenseFresh===false)reveal(trays[1],r.defenseRolls,Number(r.defenseUsedBefore||0));
    await tossAttempts(trays[0],r.attackRolls,r.attackAttempts,r.attackChosen,result,'攻擊',reduced);result.textContent=r.defenseFresh===false?'沿用本回合防禦骰…':'防禦擲骰…';
    if(r.defenseFresh!==false)await tossAttempts(trays[1],r.defenseRolls,r.defenseAttempts,r.defenseChosen,result,'防禦',reduced,Number(r.defenseUsedBefore||0));
    result.textContent=`攻擊 ${r.attackTotal} − 防禦 ${r.defenseTotal} → 抵消 ${Math.min(r.attackTotal,r.defenseTotal)} 對`;
    const attack=[...trays[0].querySelectorAll('.front:not(.spent)')],defense=[...trays[1].querySelectorAll('.front:not(.spent)')];
    const pairs=Math.min(attack.length,defense.length);for(let i=0;i<pairs;i++){attack[i].style.setProperty('--pair',i);defense[i].style.setProperty('--pair',i);attack[i].classList.add('coin-cut');defense[i].classList.add('coin-cut');}
    if(pairs){panel.classList.add('clashing');if(!reduced)sound('diceClash');}
    await wait(reduced?0:500);result.textContent=`攻擊 ${r.attackTotal} − 防禦 ${r.defenseTotal} ＝ 淨 ${r.net} 點`;
    const net=document.createElement('div');net.className='clash-net '+(Number(r.net)>0?'hit':'blocked');net.innerHTML=Number(r.net)>0?`<b>${Number(r.net)}</b><small>淨命中</small>`:'<b>BLOCK</b><small>完全抵擋</small>';panel.appendChild(net);
    await wait(1450);
   }finally{panel.remove();}
  }
 }
 async function showInitiative(records){if(!animations||!records.length)return;const panel=document.createElement('section');panel.className='dice-toast binary-clash initiative-dice';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');const title=document.createElement('strong');title.textContent='機動判定 · 正面數高者先行動';panel.appendChild(title);const result=document.createElement('p');result.className='initiative-result';result.textContent='移動回合 · 機動擲骰中…';const rows=records.map(r=>{const row=document.createElement('div');row.className='binary-side';row.style.setProperty('--dice-color',r.color||'#6F92A8');const label=document.createElement('small');label.textContent=r.name+' · 機動 '+r.mobility;const tray=document.createElement('div');tray.className='binary-tray';r.rolls.forEach(()=>tray.appendChild(coin()));row.append(label,tray);panel.appendChild(row);return {r,tray,label};});panel.appendChild(result);document.body.appendChild(panel);const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;try{await Promise.all(rows.map(x=>toss(x.tray,x.r.rolls,reduced,0,1350)));await wait(reduced?0:200);for(const x of rows)x.label.textContent=x.r.name+' · 機動 '+x.r.mobility+' → '+x.r.total+' 正面';result.textContent=records[0].name+' 先行動！';const order=document.createElement('small');order.className='initiative-order';order.textContent='先攻方：'+(records[0].side==='player'?'我方':'敵方')+' · 同點先比較機動屬性，仍相同才隨機決定';panel.appendChild(order);await wait(2050);}finally{panel.remove();}}
 function enqueue(run){busy++;chain=chain.catch(()=>{}).then(run).finally(()=>busy--);return chain;}
 function playInitiative(records){return enqueue(()=>showInitiative(records));}
 function playClashes(records){return enqueue(()=>showClashes(records));}
 function play(records,title='擲骰判定'){return enqueue(()=>show(records,title));}
 const eventKey=room=>room.currentEvent?`${room.id}:${room.run}:${room.areaIndex}:${room.exploration?.position}:${room.currentEvent.id}`:null;
 function eventPending(room){return !!pendingEvent&&pendingEvent===eventKey(room);}
 function apply(room){const key=room.currentEvent?`${room.id}:${room.run}:${room.areaIndex}:${room.exploration?.position}:${room.currentEvent.id}`:null,r=room.eventResult;if(room.id!==lastRoom){lastRoom=room.id;lastEvent=r&&key?key:null;return;}if(!r){lastEvent=null;return;}if(!key||lastEvent===key)return;lastEvent=key;
 const records=r.degree==='personal'?(r.personalResults||[]).filter(x=>Number(x.die)>0).map(x=>({name:x.sinner,die:x.die,total:x.total,dc:x.dc,degree:x.degree})):Number(r.die)>0?[{name:'團體',die:r.die,total:r.total,dc:r.dc,degree:r.degree}]:[];if(records.length&&animations){pendingEvent=key;document.body.classList.add('event-dice-playing');play(records,r.degree==='personal'?'個人事件擲骰':'危機事件擲骰').finally(()=>{if(pendingEvent!==key)return;pendingEvent=null;document.body.classList.remove('event-dice-playing');window.KBMEventUI?.render(state.room);window.KBMExpeditionUI?.apply(state.room);});}
 }
 socket.on('room:update',apply);window.KBMDice={play,split,playClashes,playInitiative,enabled,setEnabled,eventPending,isPlaying:()=>busy>0,whenIdle:()=>chain};
})();
