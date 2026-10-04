(()=>{
  function selection(room){const p=room?.players?.find(x=>x.id===state.selfId);return p&&room?.combat?room.combat.selections?.[p.id]||null:null;}
  function apply(room){
    if(!room?.combat)return;const s=selection(room),targetId=s?.targetId,partId=s?.partId;
    document.querySelectorAll('[data-combat-target]').forEach(el=>el.classList.toggle('target-selected',!!targetId&&el.dataset.combatTarget===targetId));
    document.querySelectorAll('[data-combat-part]').forEach(btn=>{const yes=!!partId&&btn.dataset.combatPart===partId&&(!targetId||btn.dataset.enemy===targetId);btn.classList.toggle('part-selected',yes);let tag=btn.querySelector('.selected-tag');if(yes&&!tag){tag=document.createElement('i');tag.className='selected-tag';tag.textContent='已選擇';btn.appendChild(tag);}else if(!yes&&tag)tag.remove();});
    const bar=document.getElementById('confirmBar');if(!bar)return;let summary=bar.querySelector('.target-summary');if(!s){summary?.remove();return;}const enemy=(room.combat.enemies||[]).find(e=>e.instanceId===s.targetId),part=enemy?.parts?.find(p=>p.id===s.partId);if(!summary){summary=document.createElement('div');summary.className='target-summary';bar.appendChild(summary);}summary.innerHTML=`<span>目標</span><b>${enemy?String(enemy.name):'—'}${part?` / ${String(part.name)}`:''}</b>`;
  }
  socket.on('room:update',room=>requestAnimationFrame(()=>apply(room)));requestAnimationFrame(()=>state?.room&&apply(state.room));window.KBMCombatTargetUI={apply};
})();