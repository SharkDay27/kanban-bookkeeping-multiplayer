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
    details.innerHTML=`<summary>裝備庫 <span>${list.length}</span></summary>${locked?'<p class="equipment-lock-note">戰鬥進行中，裝備已鎖定。戰鬥結束後才能更換。</p>':''}<div class="equipment-inventory-list">${list.length?list.map((item,index)=>`<div class="equipment-inventory-row"><div><strong>${esc(item.name||'裝備')}</strong><small>${esc(SLOT_LABEL[item.slot]||item.slot||'裝備')}${typesText(item)?` · ${esc(typesText(item))}`:''}</small><em>${esc(modsText(item)||item.description||'')}</em>${item.slot==='weapon'?`<small class="weapon-card-note">帶入 4 張牌：${esc(KBMCards.weaponSummary(item,player.sinnerId))}</small>`:''}</div><button data-equip-index="${index}" ${locked?'disabled':''}>裝備</button></div>`).join(''):'<p class="muted">目前沒有備用裝備。</p>'}</div>`;
    const skill=root.querySelector('.skill-fold');skill?root.insertBefore(details,skill):root.appendChild(details);
    details.querySelectorAll('[data-equip-index]').forEach(b=>b.onclick=()=>action('equipment:equip',{roomId:room.id,index:Number(b.dataset.equipIndex)}));
  }
  function bindItems(room,root){
    root.querySelectorAll('[data-item-index]').forEach(b=>{const item=room.players.find(p=>p.id===state.selfId)?.inventory?.[Number(b.dataset.itemIndex)];if(item?.kind==='guard'&&(!room.combat||room.combat.ended)){b.disabled=true;b.title='護盾道具僅限戰鬥使用';}b.onclick=()=>action('item:use',{roomId:room.id,slot:Number(b.dataset.itemIndex)});});
  }
  function apply(room){const player=room?.players?.find(p=>p.id===state.selfId),root=document.getElementById('mySinner');if(!player||!root||!player.sinnerId)return;renderEquipped(room,player,root);renderInventory(room,player,root);bindItems(room,root);}
  socket.on('room:update',room=>requestAnimationFrame(()=>apply(room)));
  requestAnimationFrame(()=>state?.room&&apply(state.room));
  window.KBMEquipmentUI={apply};
})();