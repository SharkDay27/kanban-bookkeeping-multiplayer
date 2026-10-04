(()=>{
  const TYPE_LABEL={slash:'斬擊',blunt:'鈍擊',pierce:'突擊'};
  let draftTarget=null,draftPart=null,lastSerial=null,playing=false;const deathPlayed=new Set();
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const me=room=>room?.players?.find(p=>p.id===state.selfId);
  const alive=c=>(c?.enemies||[]).filter(e=>e.currentHp>0);
  const skill=id=>state.gameData?.sinnerSkills?.find(s=>s.id===id);
  const relation=m=>m>=1.2?'弱點':m<=.8?'抗性':'普通';
  const typeClass=m=>m>=1.2?'weak':m<=.8?'resist':'normal';

  function playerStat(player,key){
    const sinner=sinnerById(player?.sinnerId);if(!sinner)return 0;
    const eq=equipmentMods(player),sm=statusMods(player);
    return Number(sinner.stats?.[key]||0)+Number(eq[key]||0)+Number(sm[key]||0);
  }
  function currentSelection(room){const p=me(room);return p?room.combat?.selections?.[p.id]:null;}
  function currentTarget(room){
    const c=room.combat,sel=currentSelection(room),id=sel?.targetId||draftTarget;
    return alive(c).find(e=>e.instanceId===id)||alive(c)[0]||null;
  }
  function ensure(){
    const panel=document.getElementById('combatPanel');if(!panel)return;
    const stage=document.getElementById('combatStage');stage?.classList.add('combat-stage-compact');
    if(!document.getElementById('combatStatusStrip')){const d=document.createElement('div');d.id='combatStatusStrip';d.className='combat-status-strip';stage?.before(d);}
    if(!document.getElementById('combatEnemyRoster')){const d=document.createElement('div');d.id='combatEnemyRoster';d.className='combat-enemy-roster';stage?.after(d);}
    if(!document.getElementById('battleFocus')){const d=document.createElement('div');d.id='battleFocus';d.className='battle-focus hidden';document.getElementById('combatEnemyRoster')?.after(d);}
    if(!document.getElementById('roundProgress')){const d=document.createElement('div');d.id='roundProgress';d.className='round-progress';document.getElementById('battleFocus')?.after(d);}
    if(!document.getElementById('teamActions')){const d=document.createElement('div');d.id='teamActions';d.className='team-actions';document.getElementById('combatOptions')?.after(d);}
    if(!document.getElementById('confirmBar')){const d=document.createElement('div');d.id='confirmBar';d.className='confirm-bar';document.getElementById('teamActions')?.after(d);}
    const log=document.getElementById('combatLog');if(log&&!log.closest('.combat-log-fold')){const details=document.createElement('details');details.className='combat-log-fold';const s=document.createElement('summary');s.textContent='戰鬥紀錄';log.parentNode.insertBefore(details,log);details.appendChild(s);details.appendChild(log);}
  }
  function resistanceHtml(enemy){return `<div class="damage-resistances">${['slash','blunt','pierce'].filter(t=>Number(enemy.resistances?.[t]??1)!==1).map(t=>{const m=Number(enemy.resistances?.[t]??1);return `<span class="${typeClass(m)}"><b>${TYPE_LABEL[t]}</b><em>×${m.toFixed(2)}</em><small>${relation(m)}</small></span>`}).join('')}</div>`;}
  function renderEnemies(room){
    const c=room.combat,root=document.getElementById('combatEnemyRoster');if(!root||!c)return;const sel=currentSelection(room),targetId=sel?.targetId||draftTarget||alive(c)[0]?.instanceId;
    root.innerHTML=c.blockChallenge?`<div class="block-warning"><strong>阻擋要求</strong><span>本回合對指定攻擊部位造成至少 <b>${Number(c.blockChallenge.requiredDamage||0)}</b> 傷害，可中斷「${esc(c.blockChallenge.label||'蓄力攻擊')}」。</span></div>`:'';
    root.innerHTML+=`<div class="enemy-grid">${(c.enemies||[]).filter(e=>e.currentHp>0||!deathPlayed.has(e.instanceId)).map(e=>{const intent=c.intents?.[e.instanceId],pct=e.maxHp?Math.max(0,e.currentHp/e.maxHp*100):0,selected=e.instanceId===targetId;return `<article class="enemy-card ${selected?'selected':''} ${esc(e.role)}" data-combat-target="${esc(e.instanceId)}"><div class="enemy-card-head"><div class="enemy-identity"><strong>${esc(e.name)}</strong><small>${e.role==='boss'?'BOSS':e.role==='elite'?'精英':'小怪'}</small></div>${resistanceHtml(e)}<div class="intent-card"><span>下一行動</span><div class="intent-copy"><b>${esc(intent?.label||'觀察中')}</b><small>${esc(intent?.description||'')}</small></div></div><span class="enemy-hp-value">${e.currentHp}/${e.maxHp}</span></div><div class="combat-hp"><i style="width:${pct}%"></i></div>${(e.parts||[]).length?`<div class="part-list">${e.parts.map(p=>`<button class="part-button" data-combat-part="${esc(p.id)}" data-enemy="${esc(e.instanceId)}" ${p.destroyed?'disabled':''}><span>${esc(p.name)}</span><b>${p.destroyed?'已破壞':`${p.currentHp}/${p.maxHp}`}</b><small>${esc(p.effect||'')}</small></button>`).join('')}</div>`:''}</article>`}).join('')}</div>`;
    root.querySelectorAll('[data-combat-target]').forEach(el=>el.onclick=ev=>{if(ev.target.closest('[data-combat-part]'))return;draftTarget=el.dataset.combatTarget;draftPart=null;const s=currentSelection(room);window.KBMCardUI?.target(room,draftTarget,null);});
    root.querySelectorAll('[data-combat-part]').forEach(btn=>btn.onclick=ev=>{ev.stopPropagation();draftTarget=btn.dataset.enemy;draftPart=btn.dataset.combatPart;const s=currentSelection(room);window.KBMCardUI?.target(room,draftTarget,draftPart);});
  }
  function renderActions(room){window.KBMCardUI?.render(room);}
  function renderTeam(room){
    const root=document.getElementById('teamActions'),c=room.combat;if(!root||!c)return;const active=room.players.filter(p=>p.connected&&p.hp>0),confirmed=active.filter(p=>c.selections?.[p.id]?.confirmed).length;
    root.innerHTML=`<div class="team-actions-title">隊伍行動 · ${confirmed}/${active.length} 已確認</div>${active.map(p=>{const s=c.selections?.[p.id],enemy=(c.enemies||[]).find(e=>e.instanceId===s?.targetId),part=enemy?.parts?.find(x=>x.id===s?.partId);return `<div class="team-action-row ${s?.confirmed?'confirmed':''}" data-player-id="${esc(p.id)}"><span>${esc(sinnerById(p.sinnerId)?.name||p.name)}</span><b>${esc(s?.label||'尚未選擇')}</b><small>${enemy?`→ ${esc(enemy.name)}${part?` / ${esc(part.name)}`:''}`:''}</small><em>${s?.confirmed?'已確認':s?'可更改':'思考中'}</em></div>`}).join('')}`;
  }
  function renderConfirm(room){window.KBMCardUI?.confirm(room);}
  function renderSkills(room){window.KBMSkillUI?.apply(room);}
  function renderLog(room){const log=document.getElementById('combatLog');if(!log)return;const rows=room.combat?.log||[];log.innerHTML=rows.map(r=>`<div class="combat-log-row"><span>R${Number(r.round||0)}</span><p>${esc(r.text||'')}</p></div>`).join('');const fold=log.closest('.combat-log-fold');if(fold){fold.classList.remove('hidden');if(room.combat?.ended)fold.open=true;}}
  function renderResult(room){const result=document.getElementById('combatResult');if(!result)return;const ended=!!room.combat?.ended||['combat-victory','boss-victory'].includes(room.eventResult?.degree);result.classList.toggle('hidden',!ended);if(!ended)return;const r=room.eventResult||{};result.innerHTML=`<div class="combat-result-head"><span>COMBAT RESULT</span><strong>${r.degree==='boss-victory'?'BOSS 擊破':'戰鬥勝利'}</strong></div><p>${esc(r.text||'敵方已被擊破。')}</p>${Number(r.gold||0)>0?`<div class="combat-reward">每位隊員 +${Number(r.gold)} 金幣</div>`:''}`;}
  function focus(kind,title,body,amount=''){const box=document.getElementById('battleFocus');if(!box)return;box.className=`battle-focus ${kind}`;box.innerHTML=`<span>${esc(title)}</span><strong>${esc(body)}</strong>${amount?`<b>${esc(amount)}</b>`:''}`;}
  function fx(target,cls,text){if(!target)return;target.classList.remove('combat-hit','combat-attack','combat-block');void target.offsetWidth;target.classList.add(cls);const n=document.createElement('div');n.className='combat-float';n.textContent=text;target.appendChild(n);setTimeout(()=>n.remove(),1900);setTimeout(()=>target.classList.remove(cls),750);}
  function enemyEl(id){return id?document.querySelector(`[data-combat-target="${CSS.escape(id)}"]`):null;}
  async function playResolution(room,res){
    if(playing)return;playing=true;document.body.classList.add('battle-playing');document.getElementById('combatPanel')?.classList.add('combat-resolving');
    try{
      const rolledPlayers=new Set();
      for(const rec of res.players||[]){
        if(rec.cardBased&&Number(rec.die)>0&&!rolledPlayers.has(rec.playerId)){rolledPlayers.add(rec.playerId);await window.KBMDice?.play((res.players||[]).filter(x=>x.playerId===rec.playerId&&x.cardBased&&Number(x.die)>0).map(x=>({name:`${x.sinner} · ${x.action}`,die:x.die,total:x.dealt})), '卡牌傷害擲骰');}
        if(!rec.cardBased&&Number(rec.die)>0)await window.KBMDice?.play([{name:rec.sinner,die:rec.die,total:rec.total}],rec.cardBased?'卡牌傷害擲骰':'戰鬥擲骰');
        const enemy=enemyEl(rec.targetId),support=['guard','card-guard','heal','team-buff'].includes(rec.kind);
        focus('player',rec.sinner,rec.action,rec.shieldGained?`護盾 +${rec.shieldGained}`:rec.healing?.length?'恢復生命':rec.dealt>0?`-${rec.dealt}`:support?'防護 / 支援':'MISS');
        if(enemy&&!support){enemy.classList.add('target-focus');fx(enemy,rec.dealt>0?'combat-hit':'combat-block',rec.dealt>0?`-${rec.dealt}`:'MISS');}
        window.KBMCombatVFX?.attack(rec);if(rec.dealt>0)window.KBMCombatSounds?.attack(rec.damageType||'anomaly');else if(!support)window.KBMCombatSounds?.miss();await sleep(600);
        for(const id of rec.defeatedTargets||[]){if(!deathPlayed.has(id)){deathPlayed.add(id);window.KBMCombatVFX?.death(id);await sleep(950);}}enemy?.classList.remove('target-focus');
      }
      for(const er of res.enemyResults||[]){const el=enemyEl(er.enemyId);focus('enemy',el?.querySelector('strong')?.textContent||'敵人',er.label,er.blocked?'BLOCK':`-${er.damage||0}`);if(er.defeated&&!deathPlayed.has(er.enemyId)){deathPlayed.add(er.enemyId);window.KBMCombatVFX?.death(er.enemyId);}for(const id of er.targets||[])window.KBMCombatVFX?.playerEls(id).forEach(p=>{fx(p,'combat-hit',`-${er.damage||0}`);if(er.shieldBroken)window.KBMCombatVFX?.effect(p,'blunt');});await sleep(900);}
      if(res.victory){focus('victory','戰鬥結束','敵方已被擊破',`+${res.gold||0} 金幣`);window.KBMCombatSounds?.victory();await sleep(800);}
    }finally{playing=false;document.body.classList.remove('battle-playing');document.getElementById('combatPanel')?.classList.remove('combat-resolving');document.getElementById('battleFocus')?.classList.add('hidden');render(state.room);window.KBMCombatVFX?.shield(state.room);window.KBMBuildEconomyUI?.apply(state.room);window.KBMDeckUI?.apply(state.room);window.KBMOutcomeUI?.apply(state.room);}
  }
  function render(room){
    if(playing)return;ensure();const c=room?.combat;if(!c)return;const pending=!!c.lastResolution?.serial&&c.lastResolution.serial!==lastSerial;const ended=!!c.ended||['combat-victory','boss-victory'].includes(room.eventResult?.degree),strip=document.getElementById('combatStatusStrip');if(strip){strip.innerHTML=ended?'<span>戰鬥結束</span>':`<span>${c.kind==='boss'?'BOSS':c.kind==='elite'?'精英戰':'戰鬥中'}</span><b>ROUND ${Number(c.round||1)}</b><em>敵方 ${alive(c).length}</em>`;strip.classList.toggle('ended',ended);}
    document.getElementById('combatStage')?.classList.add('hidden');
    if(!ended||pending){renderEnemies(room);renderTeam(room);}if(!ended){renderActions(room);renderConfirm(room);}['combatEnemyRoster','combatOptions','teamActions','confirmBar','roundProgress'].forEach(id=>document.getElementById(id)?.classList.toggle('combat-ended-hidden',ended&&!pending));document.querySelectorAll('#combatPanel .action-prompt').forEach(el=>el.classList.toggle('combat-ended-hidden',ended&&!pending));
    renderLog(room);renderResult(room);renderSkills(room);
    if(c.kind==='boss'&&!c._clientBossWarned){c._clientBossWarned=true;window.KBMCombatSounds?.bossWarning();}
    const r=c.lastResolution;if(r?.serial&&r.serial!==lastSerial){document.body.classList.add('battle-playing');lastSerial=r.serial;setTimeout(()=>playResolution(room,r),100);}
  }
  socket.on('room:update',room=>requestAnimationFrame(()=>render(room)));
  requestAnimationFrame(()=>state?.room?.combat&&render(state.room));
  window.KBMCombatUI={render};
})();