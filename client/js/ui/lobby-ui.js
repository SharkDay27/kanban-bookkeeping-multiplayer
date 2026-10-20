(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function render(room,player){
    document.querySelector('.party-panel')?.classList.toggle('hidden',true);
    const occupied=new Set(room.players.filter(p=>p.id!==player.id).map(p=>p.sinnerId));const sinnerList=document.getElementById('sinnerList');if(sinnerList){sinnerList.innerHTML=(state.gameData.sinners||[]).map(s=>`<button class="sinner-card sinner-themed${player.sinnerId===s.id?' active':''}" style="--sinner-color:${esc(s.color||'#63bdb0')};--sinner-soft:${esc(s.colorSoft||'#eef8f6')}" data-sinner="${s.id}"${occupied.has(s.id)?' disabled':''}><b>${esc(s.name)}</b><small>戰 ${s.stats.combat} · 觀 ${s.stats.observe} · 機 ${s.stats.mobility} · 穩 ${s.stats.stability}</small></button>`).join('');sinnerList.querySelectorAll('[data-sinner]').forEach(b=>b.onclick=()=>action('player:sinner',{roomId:room.id,sinnerId:b.dataset.sinner}));}
  }
  window.KBMLobbyUI={render};
})();
