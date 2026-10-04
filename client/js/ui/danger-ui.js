(()=>{
  function textFor(d){if(d<=1)return'穩定：安全節點較多，報酬偏基礎。';if(d<=3)return'警戒：敵人與事件增強，稀有報酬率開始上升。';if(d<=5)return'高風險：精英與高難事件增加，高品質報酬率提高。';return'極高風險：敵人非常危險，但稀有裝備、道具與增益機率最高。';}
  function apply(room){const meter=document.querySelector('.meter.danger');if(!meter)return;let hint=meter.querySelector('.danger-hint');if(!hint){hint=document.createElement('small');hint.className='danger-hint';meter.appendChild(hint);}hint.textContent=textFor(Number(room?.exploration?.danger||0));}
  socket.on('room:update',room=>requestAnimationFrame(()=>apply(room)));requestAnimationFrame(()=>state?.room&&apply(state.room));
})();