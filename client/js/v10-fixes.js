function v10FixLegacyCombatResult(room){
  if(!room?.combat)return;
  const result=document.getElementById('combatResult'),next=document.getElementById('nextCombatNode');
  const won=['combat-victory','boss-victory'].includes(room.eventResult?.degree);
  if(result){result.classList.toggle('hidden',!won);if(won)result.innerHTML=`<strong>戰鬥勝利</strong><p>${String(room.eventResult?.text||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}</p>`;}
  if(next&&!room.eventResult?.nextAreaAvailable)next.classList.add('hidden');
}
socket.on('room:update',room=>requestAnimationFrame(()=>v10FixLegacyCombatResult(room)));
