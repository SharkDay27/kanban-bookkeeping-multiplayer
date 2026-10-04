(()=>{
  const label={critical:'大成功',success:'成功',mixed:'代價成功',failure:'失敗','critical-failure':'大失敗'};
  let chain=Promise.resolve(),lastRoom=null,lastEvent=null;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function show(records,title){
    if(!records.length)return;
    const panel=document.createElement('section');panel.className='dice-toast';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');
    const heading=document.createElement('strong');heading.textContent=title;panel.appendChild(heading);
    const rows=records.map(record=>{const row=document.createElement('div');row.className='dice-row';const name=document.createElement('span');name.textContent=record.name||'團體';const die=document.createElement('b');die.className='dice-face rolling';die.textContent='?';const result=document.createElement('small');result.textContent='擲骰中…';row.append(name,die,result);panel.appendChild(row);return {record,die,result};});
    document.body.appendChild(panel);const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer=reduced?null:setInterval(()=>rows.forEach(({die})=>die.textContent=1+Math.floor(Math.random()*20)),70);
    try{await wait(reduced?0:650);if(timer)clearInterval(timer);for(const {record,die,result} of rows){die.classList.remove('rolling');die.textContent=Number(record.die);result.textContent=`合計 ${Number(record.total)}${record.dc!=null?' / DC '+Number(record.dc):''}${record.degree?' · '+(label[record.degree]||record.degree):''}`;}await wait(reduced?700:900);}finally{if(timer)clearInterval(timer);panel.remove();}
  }
  function play(records,title='擲骰判定'){chain=chain.catch(()=>{}).then(()=>show(records,title));return chain;}
  function apply(room){const key=room.currentEvent?`${room.id}:${room.run}:${room.areaIndex}:${room.exploration?.position}:${room.currentEvent.id}`:null;const result=room.eventResult;
    // A loaded saved result is already settled; animate only an observed new resolution.
    if(room.id!==lastRoom){lastRoom=room.id;lastEvent=result&&key?key:null;return;}
    if(!result){lastEvent=null;return;}if(!key||lastEvent===key)return;lastEvent=key;
    const records=result.degree==='personal'?(result.personalResults||[]).map(r=>({name:r.sinner,die:r.die,total:r.total,dc:r.dc,degree:r.degree})):Number(result.die)>0?[{name:'團體',die:result.die,total:result.total,dc:result.dc,degree:result.degree}]:[];
    if(records.length)play(records,result.degree==='personal'?'個人事件擲骰':'團體事件擲骰');
  }
  socket.on('room:update',apply);window.KBMDice={play};
})();
