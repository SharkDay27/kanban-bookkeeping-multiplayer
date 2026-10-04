(()=>{
  const relic=id=>(state.gameData?.relics||[]).find(r=>r.id===id);
  function discountFor(player){let v=0;for(const id of player?.relics||[])v+=Number(relic(id)?.effects?.consumableDiscount||0);return Math.max(0,Math.min(.45,v));}
  function apply(room){
    const player=room?.players?.find(p=>p.id===state.selfId);if(!player)return;
    const reward=document.querySelector('#combatResult .combat-reward'),gain=room.eventResult?.goldByPlayer?.[player.id];if(reward&&Number.isFinite(Number(gain)))reward.textContent=`你獲得 +${Number(gain)} 金幣`;
    const result=document.getElementById('combatResult'),loot=room.eventResult?.lootByPlayer?.[player.id];if(result&&loot&&!result.querySelector('.battle-loot')){const line=document.createElement('p');line.className='battle-loot';line.textContent=loot.type==='equipment'?`取得裝備：${loot.item?.name||''}`:'獲得遺物三選一，請到罪人資訊選擇。';result.appendChild(line);}
    if(room.shop){const discount=discountFor(player);document.querySelectorAll('[data-shop-buy]').forEach(btn=>{const offer=room.shop.stock?.find(o=>o.offerId===btn.dataset.shopBuy);if(!offer||offer.soldTo)return;const price=offer.item?.slot?Number(offer.price||0):Math.max(1,Math.round(Number(offer.price||0)*(1-discount)));btn.textContent=discount>0&&!offer.item?.slot?`${price} 金幣 · 折扣`:`${price} 金幣`;});}
  }
  socket.on('room:update',room=>requestAnimationFrame(()=>apply(room)));requestAnimationFrame(()=>state?.room&&apply(state.room));window.KBMBuildEconomyUI={apply};
})();
