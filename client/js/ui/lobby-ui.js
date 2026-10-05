(()=>{
  let editingMaps=false,lastRoom='';
  const CHAPTER_LABELS=['初級','中級','高級'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function render(room,player,isHost){
    const selected=room.selectedAreas||[];if(lastRoom!==room.id){lastRoom=room.id;editingMaps=false;}if(selected.length!==3)editingMaps=false;const mapStage=selected.length!==3||editingMaps;document.getElementById('mapSetup').classList.toggle('hidden',!mapStage);document.getElementById('sinnerSetup').classList.toggle('hidden',mapStage);const back=document.getElementById('editMaps');back.hidden=!isHost;back.onclick=()=>{editingMaps=true;render(room,player,isHost);};document.querySelector('.party-panel')?.classList.toggle('hidden',true);
    const note=document.getElementById('mapSelectionNote');if(note)note.textContent=isHost?`依點選順序安排難度，目前已選 ${selected.length}/3。再次點擊已選地區可取消。`:'房主正在選擇三個地區；順序依序為初級、中級、高級。';
    const areaList=document.getElementById('areaList');if(areaList){areaList.innerHTML=(state.gameData.areas||[]).map(a=>{const order=selected.indexOf(a.id),label=order>=0?`${order+1} · ${CHAPTER_LABELS[order]}`:'';return `<button class="area-card${order>=0?' active':''}" data-area="${a.id}"${isHost?'':' disabled'}><div><b>${esc(a.name)}</b>${label?`<span class="map-order">${label}</span>`:''}</div><p>${esc(a.desc)}</p></button>`}).join('');areaList.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>action('room:map-toggle',{roomId:room.id,areaId:b.dataset.area}));}
    const occupied=new Set(room.players.filter(p=>p.id!==player.id).map(p=>p.sinnerId));const sinnerList=document.getElementById('sinnerList');if(sinnerList){sinnerList.innerHTML=(state.gameData.sinners||[]).map(s=>`<button class="sinner-card sinner-themed${player.sinnerId===s.id?' active':''}" style="--sinner-color:${esc(s.color||'#63bdb0')};--sinner-soft:${esc(s.colorSoft||'#eef8f6')}" data-sinner="${s.id}"${occupied.has(s.id)?' disabled':''}><b>${esc(s.name)}</b><small>戰 ${s.stats.combat} · 觀 ${s.stats.observe} · 機 ${s.stats.mobility} · 穩 ${s.stats.stability}</small></button>`).join('');sinnerList.querySelectorAll('[data-sinner]').forEach(b=>b.onclick=()=>action('player:sinner',{roomId:room.id,sinnerId:b.dataset.sinner}));}
  }
  window.KBMLobbyUI={render};
})();
