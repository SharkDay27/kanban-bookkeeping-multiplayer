(()=>{
 const label={critical:'大成功',success:'成功',mixed:'代價成功',failure:'失敗','critical-failure':'大失敗'};
 let chain=Promise.resolve(),lastRoom=null,lastEvent=null;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function split(value){let left=Math.max(1,Math.min(20,Math.round(Number(value)||1))),parts=[];while(left>0){parts.push(Math.min(6,left));left-=6;}return parts;}
 const positions={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
 function face(value){const f=document.createElement('div');f.className='cube-face';for(let i=1;i<=9;i++){const p=document.createElement('i');p.className=positions[value].includes(i)?'pip':'empty-pip';f.appendChild(p);}return f;}
 function cube(value){const stage=document.createElement('div');stage.className='dice-stage';const c=document.createElement('div');c.className='dice-cube rolling';[value,7-value,...[1,2,3,4,5,6].filter(x=>x!==value&&x!==7-value)].forEach((v,i)=>{const f=face(v);f.classList.add('face-'+i);c.appendChild(f);});stage.appendChild(c);stage.setAttribute('aria-label',value+' 點');return {stage,c,value};}
 async function show(records,title){if(!records.length)return;
 const panel=document.createElement('section');panel.className='dice-toast';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');const h=document.createElement('strong');h.textContent=title;panel.appendChild(h);
 const rows=records.map(record=>{const row=document.createElement('div');row.className='dice-row';const name=document.createElement('span');name.textContent=record.name||'團體';const tray=document.createElement('div');tray.className='dice-tray';const parts=split(record.die),cubes=parts.map(cube);cubes.forEach(({stage})=>tray.appendChild(stage));const result=document.createElement('small');result.textContent='擲骰中…';row.append(name,tray,result);panel.appendChild(row);return {record,cubes,result,parts};});
 document.body.appendChild(panel);const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;try{await wait(reduced?0:850);for(const {record,cubes,result,parts} of rows){cubes.forEach(({c})=>c.classList.remove('rolling'));result.textContent=`骰點 ${parts.join('＋')}＝${Number(record.die)} · 合計 ${Number(record.total)}${record.dc!=null?' / DC '+Number(record.dc):''}${record.degree?' · '+(label[record.degree]||record.degree):''}`;}await wait(reduced?650:950);}finally{panel.remove();}
 }
 function play(records,title='擲骰判定'){chain=chain.catch(()=>{}).then(()=>show(records,title));return chain;}
 function apply(room){const key=room.currentEvent?`${room.id}:${room.run}:${room.areaIndex}:${room.exploration?.position}:${room.currentEvent.id}`:null,r=room.eventResult;if(room.id!==lastRoom){lastRoom=room.id;lastEvent=r&&key?key:null;return;}if(!r){lastEvent=null;return;}if(!key||lastEvent===key)return;lastEvent=key;
 const records=r.degree==='personal'?(r.personalResults||[]).map(x=>({name:x.sinner,die:x.die,total:x.total,dc:x.dc,degree:x.degree})):Number(r.die)>0?[{name:'團體',die:r.die,total:r.total,dc:r.dc,degree:r.degree}]:[];if(records.length)play(records,r.degree==='personal'?'個人事件擲骰':'團體事件擲骰');
 }
 socket.on('room:update',apply);window.KBMDice={play,split};
})();
