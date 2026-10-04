function v09Escape(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function v09EnsurePanels(){
  const meters=document.getElementById('explorationMeters');if(!meters)return;
  if(!document.getElementById('routeChoicePanel')){
    const panel=document.createElement('section');panel.id='routeChoicePanel';panel.className='route-choice-panel hidden';meters.after(panel);
  }
  if(!document.getElementById('shopPanel')){
    const panel=document.createElement('section');panel.id='shopPanel';panel.className='shop-panel hidden';document.getElementById('routeChoicePanel').after(panel);
  }
}
function v09TargetIndex(room){
  const ex=room.exploration||{},pos=Number(ex.position||0),node=ex.route?.[pos];
  if(node?.selected&&!node?.resolved)return null;
  if(node?.selected&&node?.resolved)return pos+1<14?pos+1:null;
  return pos;
}
function v09VoteCounts(room,choices){
  const counts={};choices.forEach(c=>counts[c.id]=0);Object.values(room.routeVotes||{}).forEach(id=>{if(id in counts)counts[id]++});return counts;
}
function v09RenderChoices(room){
  const panel=document.getElementById('routeChoicePanel');if(!panel)return;
  const index=v09TargetIndex(room);if(index===null||room.phase!=='exploration'){panel.classList.add('hidden');panel.innerHTML='';return;}
  const choices=room.exploration?.choiceLayers?.[index]||[];if(!choices.length){panel.classList.add('hidden');return;}
  const meVote=room.routeVotes?.[state.selfId],counts=v09VoteCounts(room,choices),online=room.players.filter(p=>p.connected).length;
  panel.classList.remove('hidden');
  panel.innerHTML=`<div class="route-choice-head"><div><span>NEXT ROUTE</span><strong>選擇第 ${index+1} / 14 層</strong></div><small>${Object.keys(room.routeVotes||{}).length}/${online} 已投票</small></div><div class="route-choice-grid">${choices.map(c=>`<button class="route-choice ${meVote===c.id?'selected':''}" data-route-choice="${c.id}"><span>${v09Escape(c.label)}</span><small>${counts[c.id]||0} 票</small></button>`).join('')}</div><p class="route-forecast-note">下一層已知；更深處仍受迷霧遮蔽。當前節點造成的危險度變化會影響下下層的候選節點。</p>`;
  panel.querySelectorAll('[data-route-choice]').forEach(btn=>btn.onclick=()=>action('route:vote',{roomId:room.id,choiceId:btn.dataset.routeChoice}));
}
function v09RenderRoute(room){
  const ex=room.exploration||{},route=ex.route||[],target=v09TargetIndex(room);
  const panel=document.getElementById('routePanel');if(!panel)return;
  panel.innerHTML=`<div class="route-caption"><span>${v09Escape(ex.difficultyLabel||'')}路線</span><b>${Math.min(14,Number(ex.position||0)+1)} / 14</b></div><div class="route-scroll"><div class="route-track">${route.map((n,i)=>{
    const completed=n.selected&&n.resolved,current=n.selected&&i===ex.position&&!n.resolved,next=i===target;
    let label='迷霧';if(n.selected)label=n.label;else if(next)label='可選擇';else if(i===13)label='BOSS';
    return `<div class="route-node ${completed?'done':''} ${current?'current':''} ${next?'next':''} ${!n.selected&&!next?'fogged':''}"><div class="route-node-box"><b>${i+1}</b><span>${v09Escape(label)}</span></div></div>${i<route.length-1?'<i class="route-link"></i>':''}`;
  }).join('')}</div></div>`;
  requestAnimationFrame(()=>panel.querySelector('.route-node.current,.route-node.next')?.scrollIntoView({block:'nearest',inline:'center'}));
}
function v09RenderShop(room){
  const panel=document.getElementById('shopPanel');if(!panel)return;
  if(!room.shop){panel.classList.add('hidden');panel.innerHTML='';return;}
  const me=room.players.find(p=>p.id===state.selfId);if(!me)return;
  document.getElementById('eventPanel')?.classList.add('hidden');document.getElementById('combatPanel')?.classList.add('hidden');
  panel.classList.remove('hidden');const ready=!!room.shop.ready?.[me.id],done=!!room.eventResult;
  panel.innerHTML=`<div class="shop-head"><div><span>SHOP / 商店</span><strong>${v09Escape(room.shop.title||'行商補給站')}</strong></div><div class="shop-gold">金幣 <b>${Number(me.gold||0)}</b></div></div><div class="shop-stock">${(room.shop.stock||[]).map(o=>{const sold=!!o.soldTo,can=Number(me.gold||0)>=Number(o.price||0)&&!sold&&!ready;return `<div class="shop-item ${sold?'sold':''}"><div><strong>${v09Escape(o.item?.name||'商品')}</strong><small>${v09Escape(o.item?.description||'')}</small><em>${v09Escape(o.item?.rarity||'common')}</em></div><button data-shop-buy="${o.offerId}" ${can?'':'disabled'}>${sold?'已售出':`${o.price} 金幣`}</button></div>`}).join('')}</div><button id="shopReadyBtn" class="shop-ready" ${ready||done?'disabled':''}>${done?'已完成採購':ready?'等待其他玩家…':'完成購物'}</button>`;
  panel.querySelectorAll('[data-shop-buy]').forEach(btn=>btn.onclick=()=>action('shop:buy',{roomId:room.id,offerId:btn.dataset.shopBuy}));
  panel.querySelector('#shopReadyBtn')?.addEventListener('click',()=>action('shop:ready',{roomId:room.id}));
}
function v09GoldInSinner(room){
  const me=room.players.find(p=>p.id===state.selfId),root=document.getElementById('mySinner');if(!me||!root)return;
  root.querySelector('.sinner-gold')?.remove();const row=document.createElement('div');row.className='sinner-gold';row.innerHTML=`<span>金幣</span><strong>${Number(me.gold||0)}</strong>`;root.prepend(row);
}
function v09FixNextButtons(room){
  const next=document.getElementById('nextEvent'),nextCombat=document.getElementById('nextCombatNode');
  const bossContinue=!!room.eventResult?.nextAreaAvailable&&state.selfId===room.hostId;
  if(next){next.classList.toggle('hidden',!bossContinue);if(bossContinue)next.textContent='前往下一個地區';}
  if(nextCombat){nextCombat.classList.toggle('hidden',!bossContinue);if(bossContinue)nextCombat.textContent='前往下一個地區';}
}
function v09Enhance(room){
  v09EnsurePanels();
  if(room.phase!=='lobby'){
    v09RenderRoute(room);v09RenderChoices(room);v09RenderShop(room);
    const rn=document.getElementById('runNumber');if(rn)rn.textContent=`第 ${room.areaIndex+1} 圖 · ${Math.min(14,Number(room.exploration?.position||0)+1)}/14`;
    if(!room.currentEvent&&!room.combat&&!room.shop&&!room.eventResult)document.getElementById('eventPanel')?.classList.add('hidden');
  }
  v09GoldInSinner(room);v09FixNextButtons(room);
}
socket.on('room:update',room=>requestAnimationFrame(()=>v09Enhance(room)));
requestAnimationFrame(()=>state?.room&&v09Enhance(state.room));
