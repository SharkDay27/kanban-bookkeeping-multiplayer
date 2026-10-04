(()=>{
  let shownKey='',timer=null;
  function ensure(){
    if(document.getElementById('expeditionOutcomeOverlay'))return;
    const overlay=document.createElement('div');overlay.id='expeditionOutcomeOverlay';overlay.className='expedition-outcome-overlay hidden';overlay.innerHTML=`<div class="outcome-flash"><span id="outcomeWord">VICTORY</span><small id="outcomeCountdown"></small></div><div id="outcomePrompt" class="outcome-prompt hidden"></div>`;document.body.appendChild(overlay);
  }
  function hide(){const o=document.getElementById('expeditionOutcomeOverlay');if(o)o.classList.add('hidden');if(timer){clearInterval(timer);timer=null;}}
  function showPrompt(room){
    const root=document.getElementById('outcomePrompt');if(!root)return;const host=state.selfId===room.hostId;root.classList.remove('hidden');
    root.innerHTML=host?`<strong>${room.phase==='victory'?'遠征完成':'遠征失敗'}</strong><p>${room.phase==='victory'?'三張地圖已完成。要保留同一個房間再來一把嗎？':'這次遠征已結束。要保留同一個房間重新挑戰嗎？'}</p><div><button id="outcomeReplay">再來一把</button><button id="outcomeStay" class="secondary">留在結果畫面</button></div>`:`<strong>${room.phase==='victory'?'遠征完成':'遠征失敗'}</strong><p>等待房主決定是否再來一把。</p>`;
    root.querySelector('#outcomeReplay')?.addEventListener('click',()=>action('room:restart',{roomId:room.id}));root.querySelector('#outcomeStay')?.addEventListener('click',()=>root.classList.add('hidden'));
  }
  function show(room){
    ensure();const overlay=document.getElementById('expeditionOutcomeOverlay'),word=document.getElementById('outcomeWord'),count=document.getElementById('outcomeCountdown'),prompt=document.getElementById('outcomePrompt');overlay.classList.remove('hidden','victory','fail');overlay.classList.add(room.phase==='victory'?'victory':'fail');word.textContent=room.phase==='victory'?'VICTORY':'FAIL';prompt.classList.add('hidden');let left=3;count.textContent=`${left}`;if(window.KBMCombatSounds){room.phase==='victory'?window.KBMCombatSounds.victory():window.KBMCombatSounds.hurt();}
    if(timer)clearInterval(timer);timer=setInterval(()=>{left-=1;if(left>0){count.textContent=`${left}`;return;}clearInterval(timer);timer=null;count.textContent='';showPrompt(room);},1000);
  }
  function apply(room){if(document.body.classList.contains('battle-playing'))return;ensure();if(!['victory','defeat'].includes(room?.phase)){shownKey='';hide();return;}const key=`${room.id}:${room.run}:${room.phase}`;if(key===shownKey)return;shownKey=key;show(room);}
  socket.on('room:update',room=>requestAnimationFrame(()=>apply(room)));requestAnimationFrame(()=>state?.room&&apply(state.room));
  window.KBMOutcomeUI={apply};
})();
