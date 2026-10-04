(()=>{
  let lastSerial=null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function compactEnemyCards(room){
    const combat=room?.combat;if(!combat)return;
    document.querySelectorAll('[data-combat-target]').forEach(card=>{
      const enemy=combat.enemies?.find(e=>e.instanceId===card.dataset.combatTarget);if(!enemy)return;
      const head=card.querySelector('.enemy-card-head'),res=card.querySelector('.damage-resistances');
      if(head&&res&&!head.contains(res)){res.classList.add('inline-resistances');head.insertBefore(res,head.lastElementChild);}
      if(res)res.querySelectorAll('span').forEach(x=>{const b=x.querySelector('b'),em=x.querySelector('em');if(b&&em)x.innerHTML=`<b>${esc(b.textContent?.slice(0,1)||'')}</b><em>${esc(em.textContent||'')}</em>`;});
      let shield=card.querySelector('.enemy-shield-chip');
      if(Number(enemy.shield||0)>0){if(!shield){shield=document.createElement('span');shield.className='enemy-shield-chip';head?.appendChild(shield);}shield.textContent=`盾 ${Number(enemy.shield)}`;}else shield?.remove();
      const intent=combat.intents?.[enemy.instanceId];card.classList.toggle('summon-intent',intent?.type==='summon');
    });
  }
  function renderPlayerShield(room){
    const player=room?.players?.find(p=>p.id===state.selfId),hp=document.querySelector('#mySinner .character-hp');if(!player||!hp)return;
    let chip=hp.querySelector('.player-shield-chip');
    if(Number(player.temporaryShield||0)>0){if(!chip){chip=document.createElement('span');chip.className='player-shield-chip';hp.insertBefore(chip,hp.querySelector('.hp-track'));}chip.textContent=`護盾 ${Number(player.temporaryShield)}`;}else chip?.remove();
  }
  function shieldBreakFx(room){const res=room?.combat?.lastResolution;if(!res?.serial||res.serial===lastSerial)return;lastSerial=res.serial;for(const rec of res.players||[]){if(!rec.shieldBroken)continue;const target=document.querySelector(`[data-combat-target="${CSS.escape(rec.targetId||'')}"]`);if(target){target.classList.remove('shield-break-flash');void target.offsetWidth;target.classList.add('shield-break-flash');setTimeout(()=>target.classList.remove('shield-break-flash'),700);}window.GameCombatSounds?.shieldBreak?.();}for(const er of res.enemyResults||[]){if(er.shieldBroken)window.GameCombatSounds?.shieldBreak?.();}}
  function apply(room){requestAnimationFrame(()=>{compactEnemyCards(room);renderPlayerShield(room);shieldBreakFx(room);});}
  socket.on('room:update',apply);requestAnimationFrame(()=>state?.room&&apply(state.room));window.KBMCombatLayoutUI={apply};
})();
