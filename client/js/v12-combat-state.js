function v12Esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function v12EnsureStrip(){
  const panel=document.getElementById('combatPanel');if(!panel)return null;
  let strip=document.getElementById('v12CombatStrip');
  if(!strip){strip=document.createElement('div');strip.id='v12CombatStrip';strip.className='v12-combat-strip';const roster=document.getElementById('v10EnemyRoster');(roster||document.getElementById('combatStage'))?.before(strip);}
  return strip;
}
function v12CombatEnded(room){return !!room?.combat?.ended||['combat-victory','boss-victory'].includes(room?.eventResult?.degree);}
function v12RenderLog(room){
  const log=document.getElementById('combatLog');if(!log)return;
  const rows=room.combat?.log||[];
  if(rows.length)log.innerHTML=rows.map(r=>`<div class="v12-log-row"><span>R${Number(r.round||0)}</span><p>${v12Esc(r.text||'')}</p></div>`).join('');
  const fold=log.closest('.v11-log-fold');if(fold){fold.classList.remove('hidden');if(v12CombatEnded(room))fold.open=true;}
}
function v12RenderResult(room){
  const result=document.getElementById('combatResult');if(!result)return;
  if(!v12CombatEnded(room)){result.classList.add('hidden');return;}
  const r=room.eventResult||{};
  result.classList.remove('hidden');
  result.innerHTML=`<div class="v12-result-head"><span>COMBAT RESULT</span><strong>${r.degree==='boss-victory'?'BOSS 擊破':'戰鬥勝利'}</strong></div><p>${v12Esc(r.text||'敵方已被擊破。')}</p>${Number(r.gold||0)>0?`<div class="v12-reward">每位隊員 +${Number(r.gold)} 金幣</div>`:''}`;
}
function v12Apply(room){
  const panel=document.getElementById('combatPanel');if(!panel||!room.combat)return;
  const ended=v12CombatEnded(room),strip=v12EnsureStrip();
  document.getElementById('combatStage')?.classList.add('v12-hide-stage');
  if(strip){const alive=Math.max(0,(room.combat.enemies||[]).filter(e=>e.currentHp>0).length);strip.innerHTML=ended?'<span>戰鬥結束</span>':`<span>${room.combat.kind==='boss'?'BOSS':room.combat.kind==='elite'?'精英戰':'戰鬥中'}</span><b>ROUND ${Number(room.combat.round||1)}</b><em>敵方 ${alive}</em>`;strip.classList.toggle('ended',ended);}
  ['v10EnemyRoster','combatOptions','v10TeamActions','v10ConfirmBar','v11RoundProgress'].forEach(id=>document.getElementById(id)?.classList.toggle('v12-ended-hidden',ended));
  panel.querySelectorAll('.action-prompt').forEach(el=>el.classList.toggle('v12-ended-hidden',ended));
  if(ended)document.getElementById('v11BattleFocus')?.classList.add('hidden');
  v12RenderResult(room);v12RenderLog(room);
}
socket.on('room:update',room=>requestAnimationFrame(()=>v12Apply(room)));
requestAnimationFrame(()=>state?.room&&v12Apply(state.room));
