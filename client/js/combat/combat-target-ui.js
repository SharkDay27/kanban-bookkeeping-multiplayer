(function(){
  function selfSelection(room){const me=room?.players?.find(p=>p.id===state.selfId),combat=room?.combat;return me&&combat?combat.selections?.[me.id]||null:null;}
  function apply(room){
    if(!room?.combat)return;const selection=selfSelection(room),targetId=selection?.targetId||((typeof v10DraftTarget!=='undefined')?v10DraftTarget:null),partId=selection?.partId||((typeof v10DraftPart!=='undefined')?v10DraftPart:null);
    document.querySelectorAll('[data-v10-target]').forEach(el=>el.classList.toggle('v13-target-selected',!!targetId&&el.dataset.v10Target===targetId));
    document.querySelectorAll('[data-v10-part]').forEach(btn=>{
      const selected=!!partId&&btn.dataset.v10Part===partId&&(!targetId||btn.dataset.enemy===targetId);btn.classList.toggle('v13-part-selected',selected);
      let tag=btn.querySelector('.v13-selected-tag');if(selected&&!tag){tag=document.createElement('i');tag.className='v13-selected-tag';tag.textContent='已選擇';btn.appendChild(tag);}else if(!selected&&tag)tag.remove();
    });
    const bar=document.getElementById('v10ConfirmBar');if(!bar)return;
    let summary=bar.querySelector('.v13-target-summary');if(!selection){summary?.remove();return;}
    const enemy=(room.combat.enemies||[]).find(e=>e.instanceId===selection.targetId),part=enemy?.parts?.find(p=>p.id===selection.partId);
    if(!summary){summary=document.createElement('div');summary.className='v13-target-summary';bar.appendChild(summary);}
    summary.innerHTML=`<span>目標</span><b>${enemy?String(enemy.name):'—'}${part?` / ${String(part.name)}`:''}</b>`;
  }
  window.CombatTargetUI={apply};
  socket.on('room:update',room=>requestAnimationFrame(()=>apply(room)));requestAnimationFrame(()=>state?.room&&apply(state.room));
})();
