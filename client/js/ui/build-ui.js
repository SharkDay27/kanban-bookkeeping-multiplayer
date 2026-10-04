(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const relicById=id=>(state.gameData?.relics||[]).find(r=>r.id===id);
  function apply(room){
    const player=room?.players?.find(p=>p.id===state.selfId),root=document.getElementById('mySinner');if(!player||!root||!player.sinnerId)return;
    root.querySelector('.build-fold')?.remove();root.querySelector('.relic-choice-panel')?.remove();
    const profile=room.buildProfiles?.[player.id],top=profile?.top||[],relics=(player.relics||[]).map(relicById).filter(Boolean),choices=(room.relicChoices?.[player.id]||[]).map(relicById).filter(Boolean);
    const details=document.createElement('details');details.className='inventory-fold build-fold';details.innerHTML=`<summary>流派與遺物 <span>${relics.length}</span></summary><div class="build-profile">${top.length?top.map(t=>`<span class="build-tag"><b>${esc(t.name||t.id)}</b><small>${Number(t.value||0).toFixed(1)}</small></span>`).join(''):'<span class="build-empty">尚未形成明顯流派</span>'}</div><div class="relic-list">${relics.length?relics.map(r=>`<article class="relic-chip rarity-${esc(r.rarity)}"><strong>${esc(r.name)}</strong><small>${esc(r.description)}</small><em>${(r.buildTags||[]).map(id=>esc(state.gameData?.buildTags?.[id]?.name||id)).join(' · ')}</em></article>`).join(''):'<p class="build-empty">尚未取得遠征遺物。</p>'}</div>`;root.appendChild(details);
    if(choices.length){const panel=document.createElement('section');panel.className='relic-choice-panel';panel.innerHTML=`<div class="relic-choice-head"><span>RELIC REWARD</span><strong>選擇 1 個遠征遺物</strong><small>選完才能繼續推進路線</small></div><div class="relic-choice-grid">${choices.map(r=>`<button class="relic-choice rarity-${esc(r.rarity)}" data-relic-choice="${esc(r.id)}"><span>${esc(r.name)}</span><p>${esc(r.description)}</p><small>${(r.buildTags||[]).map(id=>esc(state.gameData?.buildTags?.[id]?.name||id)).join(' · ')}</small></button>`).join('')}</div>`;root.prepend(panel);panel.querySelectorAll('[data-relic-choice]').forEach(b=>b.onclick=()=>action('relic:choose',{roomId:room.id,relicId:b.dataset.relicChoice}));}
  }
  socket.on('room:update',room=>requestAnimationFrame(()=>apply(room)));requestAnimationFrame(()=>state?.room&&apply(state.room));window.KBMBuildUI={apply};
})();
