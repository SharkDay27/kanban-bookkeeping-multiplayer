(()=>{
  let lastSerial=null;
  function targetEl(id){return id?document.querySelector(`[data-combat-target="${CSS.escape(id)}"]`):null;}
  function addFx(target,type){
    if(!target)return;const fx=document.createElement('div');fx.className=`typed-combat-vfx ${type}`;
    if(type==='slash')fx.innerHTML='<i></i><i></i>';
    else if(type==='blunt')fx.innerHTML='<i></i><b></b>';
    else if(type==='pierce')fx.innerHTML='<i></i><b></b>';
    else if(type==='gun')fx.innerHTML='<i></i><b></b><em></em>';
    else fx.innerHTML='<i></i><b></b>';
    target.appendChild(fx);setTimeout(()=>fx.remove(),1050);
  }
  function styleFor(rec){if(rec?.soundType==='gun')return'gun';if(['slash','blunt','pierce'].includes(rec?.damageType))return rec.damageType;return'anomaly';}
  function play(res){let delay=160;for(const rec of res?.players||[]){if(rec.dealt>0){setTimeout(()=>addFx(targetEl(rec.targetId),styleFor(rec)),delay);}delay+=850;}}
  function markSummons(){document.querySelectorAll('.intent-card').forEach(card=>{const label=card.querySelector('b')?.textContent||'',summon=label.includes('呼叫增援');card.classList.toggle('summon-intent',summon);let tag=card.querySelector('.summon-warning-tag');if(summon&&!tag){tag=document.createElement('em');tag.className='summon-warning-tag';tag.textContent='下回合召喚手下';card.appendChild(tag);}else if(!summon&&tag)tag.remove();});}
  function apply(room){markSummons();const res=room?.combat?.lastResolution;if(!res?.serial||res.serial===lastSerial)return;lastSerial=res.serial;play(res);}
  socket.on('room:update',room=>requestAnimationFrame(()=>apply(room)));requestAnimationFrame(()=>state?.room&&apply(state.room));
  window.KBMCombatVFX={apply};
})();
