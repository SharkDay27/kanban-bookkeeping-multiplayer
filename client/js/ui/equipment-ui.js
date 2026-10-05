(()=>{
  const TYPE_LABEL={slash:'斬擊',blunt:'鈍擊',pierce:'突擊'};
  const SLOT_LABEL={weapon:'武器',armor:'防具',accessory:'飾品'};
  const STAT_LABEL={combat:'戰鬥',observe:'觀察',mobility:'機動',stability:'穩定'};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function modsText(item){const survival=item?.slot==='armor'?`生命上限 +${Number(item.survival?.maxHp||0)} · 初始護盾 +${Number(item.survival?.startShield||0)} · `:'';const rows=Object.entries(item?.mods||{}).filter(([,v])=>Number(v)!==0);return survival+rows.map(([k,v])=>`${STAT_LABEL[k]||k} ${Number(v)>0?'+':''}${Number(v)}`).join(' · ');}
  function typesText(item){return (item?.attackTypes||[]).map(t=>TYPE_LABEL[t]||t).join(' / ');}
  function renderEquipped(room,player,root){
    const grid=root.querySelector('.equipment-grid');if(!grid)return;
    const combatLocked=!!room.combat&&!room.combat.ended;
    grid.innerHTML=['weapon','armor','accessory'].map(slot=>{const item=player.equipment?.[slot];const canRemove=slot!=='weapon'&&!!item&&!combatLocked;return `<div class="equipped-row"><div><span>${SLOT_LABEL[slot]}</span><b>${esc(item?.name||'空')}</b>${item?.attackTypes?.length?`<small>${esc(typesText(item))}</small>`:''}${item?.slot==='weapon'?`<small class="weapon-card-note">帶入 4 張牌：${esc(KBMCards.weaponSummary(item,player.sinnerId))}</small>`:''}${modsText(item)?`<small>${esc(modsText(item))}</small>`:''}</div>${slot!=='weapon'&&item?`<button class="equipment-mini-btn" data-unequip="${slot}" ${canRemove?'':'disabled'}>卸下</button>`:''}</div>`}).join('');
    grid.querySelectorAll('[data-unequip]').forEach(b=>b.onclick=()=>action('equipment:unequip',{roomId:room.id,slot:b.dataset.unequip}));
  }
  function renderInventory(room,player,root){
    root.querySelector('.equipment-inventory-fold')?.remove();
    const list=Array.isArray(player.equipmentInventory)?player.equipmentInventory:[],locked=!!room.combat&&!room.combat.ended;
    const details=document.createElement('details');details.className='inventory-fold equipment-inventory-fold';
    details.innerHTML=`<summary>裝備庫 <span>${list.length}/4</span></summary>${locked?'<p class="equipment-lock-note">戰鬥進行中，裝備已鎖定。戰鬥結束後才能更換。</p>':''}<div class="equipment-inventory-list">${list.length?list.map((item,index)=>`<div class="equipment-inventory-row"><div><strong>${esc(item.name||'裝備')}</strong><small>${esc(SLOT_LABEL[item.slot]||item.slot||'裝備')}${typesText(item)?` · ${esc(typesText(item))}`:''}</small><em>${esc(modsText(item)||item.description||'')}</em>${item.slot==='weapon'?`<small class="weapon-card-note">帶入 4 張牌：${esc(KBMCards.weaponSummary(item,player.sinnerId))}</small>`:''}</div><button data-equip-index="${index}" ${locked?'disabled':''}>裝備</button></div>`).join(''):'<p class="muted">目前沒有備用裝備。</p>'}</div>`;
    const skill=root.querySelector('.skill-fold');skill?root.insertBefore(details,skill):root.appendChild(details);
    details.querySelectorAll('[data-equip-index]').forEach(b=>b.onclick=()=>action('equipment:equip',{roomId:room.id,index:Number(b.dataset.equipIndex)}));
  }
  function overflow(room,player){const pending=player.pendingEquipment?.[0],old=document.getElementById('equipmentOverflowDialog');if(!pending){old?.remove();return;}if(old?.dataset.rewardId===pending.id)return;old?.remove();const dialog=document.createElement('dialog');dialog.id='equipmentOverflowDialog';dialog.dataset.rewardId=pending.id;dialog.className='equipment-overflow-dialog';const itemText=item=>`<b>${esc(item.name)}</b><small>${esc(SLOT_LABEL[item.slot]||'裝備')} · ${esc(modsText(item)||item.description||'')}</small>`;dialog.innerHTML=`<h3>裝備庫已滿（4／4）</h3><p>取得新裝備：${esc(pending.item.name)}。請選擇要丟棄的備用裝備，或放棄新裝備。</p><div class="overflow-new-item">${itemText(pending.item)}</div><div class="overflow-choices">${player.equipmentInventory.map(item=>`<button type="button" data-discard-gear="${esc(item.gearUid)}">${itemText(item)}<span>丟棄此件，保留新裝備</span></button>`).join('')}</div><button type="button" data-skip-gear>放棄新裝備：${esc(pending.item.name)}</button><p class="overflow-error" role="alert"></p>`;dialog.oncancel=e=>e.preventDefault();let busy=false;const choose=discardUid=>{if(busy)return;busy=true;dialog.querySelectorAll('button').forEach(b=>b.disabled=true);socket.emit('equipment:overflow',{roomId:room.id,rewardId:pending.id,discardUid},res=>{busy=false;if(!res?.ok){dialog.querySelector('.overflow-error').textContent=res.error||'處理失敗';dialog.querySelectorAll('button').forEach(b=>b.disabled=false);}else if(state.room)apply(state.room);});};dialog.querySelectorAll('[data-discard-gear]').forEach(b=>b.onclick=()=>choose(b.dataset.discardGear));dialog.querySelector('[data-skip-gear]').onclick=()=>choose(null);document.body.appendChild(dialog);dialog.showModal();}
  function bindItems(room,root){
    root.querySelectorAll('[data-item-index]').forEach(b=>{const item=room.players.find(p=>p.id===state.selfId)?.inventory?.[Number(b.dataset.itemIndex)];if(item?.kind==='guard'&&(!room.combat||room.combat.ended)){b.disabled=true;b.title='護盾道具僅限戰鬥使用';}b.onclick=()=>action('item:use',{roomId:room.id,slot:Number(b.dataset.itemIndex)});});
  }
  function apply(room){const player=room?.players?.find(p=>p.id===state.selfId),root=document.getElementById('mySinner');if(!player||!root||!player.sinnerId)return;overflow(room,player);renderEquipped(room,player,root);renderInventory(room,player,root);bindItems(room,root);}
  socket.on('room:update',room=>requestAnimationFrame(()=>apply(room)));
  requestAnimationFrame(()=>state?.room&&apply(state.room));
  window.KBMEquipmentUI={apply};
})();