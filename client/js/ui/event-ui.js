(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));
  function render(room){
    const panel=document.getElementById('eventPanel');if(!panel)return;
    if(room.phase!=='exploration'||room.combat||room.shop||(!room.currentEvent&&!room.nodeReward&&!room.eventResult)){panel.classList.add('hidden');return;}
    panel.classList.remove('hidden');const event=room.currentEvent,resolved=!!room.eventResult;
    const area=areaById(room.areaId);document.getElementById('eventArea').textContent=`${area?.name||''} · ${room.exploration?.difficultyLabel||''}`;
    document.getElementById('eventName').textContent=event?.name||room.nodeReward?.title||'節點結算';document.getElementById('eventDescription').textContent=event?.description||room.nodeReward?.text||room.eventResult?.text||'';
    const options=document.getElementById('eventOptions');if(options){options.innerHTML=event&&!resolved?(event.options||[]).map(o=>`<button class="event-option${room.votes?.[state.selfId]===o.id?' selected':''}" data-option="${esc(o.id)}"><div class="option-head"><span>${esc(o.label)}</span><em>${esc(o.statLabel)}檢定</em></div><p>${esc(o.desc)}</p>${o.rewardHint?`<div class="event-reward-hint">◆ ${esc(o.rewardHint)}</div>`:''}</button>`).join(''):'';options.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>action('event:vote',{roomId:room.id,optionId:b.dataset.option}));}
    const result=document.getElementById('eventResult');if(result){result.classList.toggle('hidden',!resolved);if(resolved){const r=room.eventResult||{},status=r.statusApplied?`<div class="status-alert">${esc(r.statusApplied.name)} 被施加。</div>`:'',loot=r.loot?`<div class="event-loot-result">獲得：${esc(r.loot.item?.name||'戰利品')}</div>`:'';result.innerHTML=`<strong>${r.degree==='supply'?'取得補給':r.degree==='rest'?'休整完成':r.degree==='shop'?'採購完成':'判定結果'}</strong><p>${esc(r.text||'節點完成。')}</p>${r.damage?`<small>隊伍受到傷害：${r.damage}</small>`:''}${Number(r.gold||0)>0?`<small>獲得金幣：${r.gold}</small>`:''}${loot}${status}`;}}
  }
  socket.on('room:update',room=>requestAnimationFrame(()=>render(room)));requestAnimationFrame(()=>state?.room&&render(state.room));window.KBMEventUI={render};
})();
