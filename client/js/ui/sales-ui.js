(()=>{
 const esc=escapeHtml;
 const relic=id=>(state.gameData?.relics||[]).find(r=>r.id===id);
 function price(item,type){if(type==='relic')return {common:12,uncommon:20,rare:32}[item.rarity]||12;if(item.rarity==='starter')return 3;return Math.max(1,Math.floor(Math.round(32*({common:1,uncommon:1.55,rare:2.35}[item.rarity]||1))*.35));}
 function apply(room){document.getElementById('shopSales')?.remove();const p=room.players.find(x=>x.id===state.selfId),root=document.getElementById('shopPanel');if(!p||!root||!room.shop||room.eventResult||room.shop.ready?.[p.id])return;
 const entries=[...(p.equipmentInventory||[]).map(item=>({item,type:'equipment'})),...(p.relics||[]).map(relic).filter(Boolean).map(item=>({item,type:'relic'}))];
 const panel=document.createElement('details');panel.id='shopSales';panel.className='inventory-fold';panel.innerHTML=`<summary>出售裝備與遺物</summary><p>裝備請先放入裝備庫。出售遺物會失去其效果。</p>${entries.length?entries.map(({item,type})=>`<div class="shop-item"><div><strong>${esc(item.name)}</strong><small>${type==='relic'?'遺物':'装備'}</small></div><button data-sell-id="${esc(item.id)}" data-sell-type="${type}">出售 · ${price(item,type)} 金幣</button></div>`).join(''):'<p>目前沒有可出售的物品。</p>'}`;root.appendChild(panel);panel.querySelectorAll('[data-sell-id]').forEach(b=>b.onclick=()=>action('shop:sell',{roomId:room.id,type:b.dataset.sellType,itemId:b.dataset.sellId,relicId:b.dataset.sellId}));
 }
 socket.on('room:update',room=>requestAnimationFrame(()=>apply(room)));
})();
