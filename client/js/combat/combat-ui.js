(()=>{
  const TYPE_LABEL={slash:'斬擊',blunt:'鈍擊',pierce:'突擊'};
  let draftTarget=null,draftPart=null,lastSerial=null,lastInitiative=null,playing=false;const deathPlayed=new Set(),resolutionQueue=[],sentAcks=new Set();socket.on('connect',()=>sentAcks.clear());
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
    if(!document.getElementById('combatPhaseBanner')){const d=document.createElement('div');d.id='combatPhaseBanner';d.className='combat-phase-banner hidden';d.setAttribute('role','status');d.setAttribute('aria-live','polite');document.getElementById('combatStatusStrip')?.after(d);}
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
    root.innerHTML+=`<div class="enemy-grid">${(c.enemies||[]).filter(e=>e.currentHp>0||!deathPlayed.has(e.instanceId)).map(e=>{const intent=c.intents?.[e.instanceId],pct=e.maxHp?Math.max(0,e.currentHp/e.maxHp*100):0,selected=e.instanceId===targetId;return `<article class="enemy-card ${selected?'selected':''} ${esc(e.role)}" data-combat-target="${esc(e.instanceId)}"><div class="enemy-card-head"><div class="enemy-identity"><strong>${esc(e.name)}</strong><small>${e.role==='boss'?'BOSS':e.role==='elite'?'精英':'小怪'} · 機動 ${Math.max(0,Number(e.mobility||5)+Object.entries(statusMods(e)).filter(([k])=>k==='mobility').reduce((n,[,v])=>n+v,0))}</small></div>${resistanceHtml(e)}<div class="intent-card"><span>下一行動</span><div class="intent-copy"><b>${esc(intent?.label||'觀察中')}</b><small>${esc(intent?.description||'')}</small></div></div><span class="enemy-hp-value">${e.currentHp}/${e.maxHp}</span></div><div class="combat-hp"><i style="width:${pct}%"></i></div>${intent?.cardPlan?`<div class="enemy-played-cards">${intent.cardPlan.cards.map(card=>{const f=KBMCards.face(card,card.flipped);return `<span style="--sin:${KBMCards.SINS[f.sin].color}">${KBMCards.SINS[f.sin].name} ${KBMCards.TYPES[f.type]}${f.value}</span>`;}).join('')}<small>手牌 ${c.enemyCardDecks?.[e.instanceId]?.hand.length||0} · 抽牌 ${c.enemyCardDecks?.[e.instanceId]?.draw.length||0} · 回收 ${c.enemyCardDecks?.[e.instanceId]?.discard.length||0} · 破壞 ${c.enemyCardDecks?.[e.instanceId]?.destroyed?.length||0}${intent.cardPlan.abilities.length?' · 能力 '+intent.cardPlan.abilities.join('、'):''}</small></div>`:''}<div class="enemy-skill-row">${Object.keys(intent?.cardRequirement||{}).length?`<span class="enemy-skill-cost">技能：${KBMCardUI.conditions(intent.cardRequirement)}</span>`:'<span class="enemy-skill-caption">技能</span>'}<button type="button" class="enemy-skill-toggle" data-enemy-skills="${esc(e.instanceId)}">查看技能說明</button></div>${(e.statuses||[]).length?`<div class="status-list">${e.statuses.map(s=>`<span class="status-chip ${statusById(s.id)?.type||'debuff'}">${esc(statusById(s.id)?.name||s.id)} ${s.stacks||1}層 · ${s.remaining}回合</span>`).join('')}</div>`:''}${(e.parts||[]).length?`<div class="part-list">${e.parts.filter(p=>p.type!=='weapon'||c.blockChallenge?.partId===p.id).map(p=>`<button class="part-button" data-combat-part="${esc(p.id)}" data-enemy="${esc(e.instanceId)}" ${p.destroyed?'disabled':''}><span>${esc(p.name)}</span><b>${p.destroyed?'已破壞':`${p.currentHp}/${p.maxHp}`}</b><small>${esc(p.effect||'')}</small></button>`).join('')}</div>`:''}</article>`}).join('')}</div>`;
    root.querySelectorAll('[data-combat-target]').forEach(el=>el.onclick=ev=>{if(ev.target.closest('[data-combat-part],details'))return;draftTarget=el.dataset.combatTarget;draftPart=null;const s=currentSelection(room);window.KBMCardUI?.target(room,draftTarget,null);});
    root.querySelectorAll('[data-enemy-skills]').forEach(btn=>btn.onclick=ev=>{ev.stopPropagation();const e=c.enemies.find(e=>e.instanceId===btn.dataset.enemySkills);openEnemySkills(e,c.intents?.[e.instanceId]);});
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
  function renderResult(room){const result=document.getElementById('combatResult');if(!result)return;const ended=room.phase==='defeat'||!!room.combat?.ended||['combat-victory','boss-victory'].includes(room.eventResult?.degree);result.classList.toggle('hidden',!ended);if(!ended)return;const r=room.eventResult||{};result.innerHTML=`<div class="combat-result-head"><span>COMBAT RESULT</span><strong>${room.phase==='defeat'?'戰鬥失敗':r.degree==='boss-victory'?'BOSS 擊破':'戰鬥勝利'}</strong></div><p>${esc(r.text||(room.phase==='defeat'?'所有罪人已倒下。':'敵方已被擊破。'))}</p>${Number(r.gold||0)>0?`<div class="combat-reward">每位隊員 +${Number(r.gold)} 金幣</div>`:''}`;}
  function focus(kind,title,body,amount=''){const box=document.getElementById('battleFocus');if(!box)return;box.className=`battle-focus ${kind}`;box.innerHTML=`<span>${esc(title)}</span><strong>${esc(body)}</strong>${amount?`<b>${esc(amount)}</b>`:''}`;}
  function fx(target,cls,text){if(!target)return;target.classList.remove('combat-hit','combat-attack','combat-block');void target.offsetWidth;target.classList.add(cls);const n=document.createElement('div');n.className='combat-float';n.textContent=text;target.appendChild(n);setTimeout(()=>n.remove(),1900);setTimeout(()=>target.classList.remove(cls),750);}
  function enemyEl(id){return id?document.querySelector(`[data-combat-target="${CSS.escape(id)}"]`):null;}
  function phase(kind,detail=''){
    const banner=document.getElementById('combatPhaseBanner');if(!banner)return;
    const labels={movement:'移動回合',attack:'我方攻擊回合',defense:'我方防守回合',support:'我方支援回合','enemy-support':'敵方支援回合',ready:'準備移動回合'};
    banner.className='combat-phase-banner phase-'+kind;banner.dataset.phase=kind;
    banner.innerHTML=`<div class="phase-arrows" aria-hidden="true"><i>${kind==='attack'?'↑':kind==='defense'?'↓':'↔'}</i><i>${kind==='attack'?'↑':kind==='defense'?'↓':'↔'}</i><i>${kind==='attack'?'↑':kind==='defense'?'↓':'↔'}</i></div><div><strong>${labels[kind]||kind}</strong><small>${esc(detail)}</small></div>`;
  }
  function acknowledge(room,kind,serial){const key=room.id+':'+kind+':'+serial;if(sentAcks.has(key))return;sentAcks.add(key);socket.emit('combat:'+kind+'-ready',{roomId:room.id,serial});}
  async function playMovement(room){playing=true;document.body.classList.add('battle-playing');const c=room.combat;try{phase('movement','即將進行機動投骰');focus('movement','移動回合','雙方依機動屬性投骰');await sleep(650);await window.KBMDice?.playInitiative(c.initiative.map(x=>({...x,color:x.side==='enemy'?'#111111':sinnerById(room.players.find(p=>p.id===x.id)?.sinnerId)?.color})));phase('movement',(c.initiative[0]?.name||'我方')+' 先行動');await sleep(650);}finally{playing=false;document.body.classList.remove('battle-playing');document.getElementById('battleFocus')?.classList.add('hidden');acknowledge(room,'initiative',c.initiativeSerial);render(state.room);}}
  function openEnemySkills(e,intent){document.getElementById('enemySkillDialog')?.remove();const dialog=document.createElement('dialog');dialog.id='enemySkillDialog';dialog.className='enemy-skill-dialog';dialog.innerHTML=`<header><strong>${esc(e.name)} · 技能</strong><button type="button" data-close>×</button></header>${enemySkills(e,intent)}`;document.body.appendChild(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();dialog.showModal();}
  function enemySkills(e,intent){return `<section class="enemy-skills"><div>${(e.skills||[]).map(s=>`<article><b>${esc(s.label||'技能')}</b><p>${esc(s.description||'')}</p><small>${s.mult?'攻擊倍率 ×'+s.mult:''}${s.shield?' · 護盾 +'+s.shield:''}${s.defenseBoost?' · 防禦提高 '+s.defenseBoost:''}${s.attackBoost?' · 攻擊提高 '+Math.round(s.attackBoost*100)+'%':''}${s.statusId?' · '+esc(statusById(s.statusId)?.name||s.statusId):''}</small></article>`).join('')||'<p>此敵人使用普通攻擊與防守。</p>'}${intent?`<article><b>本次行動：${esc(intent.label)}</b><p>${esc(intent.skillDescription||intent.description||'')}</p>${Object.keys(intent.cardRequirement||{}).length?`<small>條件: <span class="card-side-tag ${roomSide(intent)}">${roomSide(intent)==='attack'?'攻擊卡':'防禦卡'}</span> ${KBMCardUI.conditions(intent.cardRequirement)}</small>`:''}</article>`:''}</div></section>`;}
  const roomSide=intent=>['guard','shield','enrage'].includes(intent.type)?'defense':'attack';
  function renderHUD(room){let root=document.getElementById('battlePlayerHUD');if(!root){root=document.createElement('aside');root.id='battlePlayerHUD';document.body.appendChild(root);}const p=me(room);root.hidden=!window.matchMedia('(max-width:640px)').matches||!p||!room.combat||room.combat.ended||room.phase!=='exploration';if(root.hidden)return;root.dataset.playerId=p.id;root.innerHTML=`<strong>${esc(sinnerById(p.sinnerId)?.name||p.name)}</strong><b>HP ${p.hp}/${p.maxHp}</b><span>護盾 ${p.temporaryShield||0}</span><div class="hud-statuses">${(p.statuses||[]).map(s=>`<span class="status-chip ${statusById(s.id)?.type||'debuff'}">${esc(statusById(s.id)?.name||s.id)} ${s.stacks||1}</span>`).join('')}</div>`;}
  async function playResolution(room,res){
    if(playing)return;playing=true;document.body.classList.add('battle-playing');document.getElementById('combatPanel')?.classList.add('combat-resolving');
    try{
      if(!res.initiativeAlreadyPlayed){
      phase('movement','雙方依機動值擲骰，決定本回合行動順序');focus('movement','移動回合','即將進行機動投骰');await sleep(650);
      if(res.initiative?.length)await window.KBMDice?.playInitiative(res.initiative.map(x=>({...x,color:x.side==='enemy'?'#111111':sinnerById(room.players.find(p=>p.id===x.id)?.sinnerId)?.color})));
      if(res.initiative?.length){const first=res.initiative[0];phase('movement',first.name+' 先行動！');focus('movement','機動判定完成',first.name+' 先行動！');await sleep(650);}
      }
      const timeline=res.timeline||[...(res.players||[]).map((_,index)=>({side:'player',index})),...(res.enemyResults||[]).map((_,index)=>({side:'enemy',index}))];
      for(const step of timeline){
       if(step.side==='status'){window.KBMCombatVFX?.statuses(step.events);await sleep(900);continue;}
       if(step.side==='player'){const rec=res.players[step.index];if(!rec)continue;
        const support=['guard','card-guard','heal','team-buff','skill-utility'].includes(rec.kind)||(!rec.clashes?.length&&!rec.dealt);phase(room.combat.flowVersion?res.phase:support?'support':'attack',rec.sinner+' · '+rec.action+(support?'':' · 敵方防禦'));focus('player',rec.sinner,rec.action);
        if(rec.clashes?.length)await window.KBMDice?.playClashes(rec.clashes.map(x=>({...x,name:rec.sinner+' · '+rec.action+' → '+x.target,color:rec.sinnerColor})));
        const enemy=enemyEl(rec.targetId);
        focus('player',rec.sinner,rec.action,rec.shieldGained?`護盾 +${rec.shieldGained}`:rec.healing?.length?'恢復生命':rec.dealt>0?`-${rec.dealt}`:support?'防護 / 支援':'');
        if(enemy&&!support&&rec.dealt>0)fx(enemy,'combat-hit',`-${rec.dealt}`);window.KBMCombatVFX?.attack(rec);if(rec.dealt>0)window.KBMCombatSounds?.attack(rec.damageType||'anomaly');window.KBMCombatVFX?.statuses(rec.statusEvents);await sleep(rec.statusEvents?.length?900:500);
        for(const id of rec.defeatedTargets||[])if(!deathPlayed.has(id)){deathPlayed.add(id);window.KBMCombatVFX?.death(id);await sleep(600);}
       }else {const er=res.enemyResults[step.index];if(!er)continue;const name=room.combat.enemies.find(e=>e.instanceId===er.enemyId)?.name||'敵方';
        const attacks=!!er.clashes?.length||!!er.targets?.length;phase(room.combat.flowVersion?res.phase:attacks?'defense':'enemy-support',name+(attacks?' 攻擊 · 我方防禦':' · '+er.label));focus('enemy',name,er.label);
        if(er.clashes?.length)await window.KBMDice?.playClashes(er.clashes.map(x=>({...x,color:'#111111',attackerName:name,targetName:x.target,targetColor:x.sinnerColor})));
        focus('enemy',name,er.label,er.blocked?'BLOCK':`-${er.damage||0}`);for(const id of er.targets||[])window.KBMCombatVFX?.playerEls(id).forEach(p=>fx(p,er.damage>0?'combat-hit':'combat-block',`-${er.damage||0}`));await sleep(700);
       }
      }
      if(res.victory){focus('victory','戰鬥結束','敵方已被擊破',`+${res.gold||0} 金幣`);window.KBMCombatSounds?.victory();await sleep(800);}
    }finally{if(room.combat.flowVersion&&!room.combat.ended)acknowledge(room,'resolution',res.serial);playing=false;document.body.classList.remove('battle-playing');document.getElementById('combatPanel')?.classList.remove('combat-resolving');document.getElementById('battleFocus')?.classList.add('hidden');document.getElementById('combatPhaseBanner')?.classList.add('hidden');render(resolutionQueue.shift()||state.room);window.KBMExpeditionUI?.apply(state.room);window.KBMCombatVFX?.shield(state.room);window.KBMBuildEconomyUI?.apply(state.room);window.KBMDeckUI?.apply(state.room);window.KBMOutcomeUI?.apply(state.room);}
  }
  function isResolving(room){return playing||!!(room?.combat?.lastResolution?.serial&&room.combat.lastResolution.serial!==lastSerial);}
  function render(room){
    document.body.classList.toggle('combat-active',!!room?.combat&&!room.shop&&room.phase!=='lobby'&&(!room.combat.ended||isResolving(room)));
    if(room?.combat?.flowVersion&&!room.combat.ended&&room.combat.phase!=='resolving'&&room.combat.lastResolution?.serial)lastSerial=room.combat.lastResolution.serial;
    renderHUD(room);if(playing){const serial=room?.combat?.lastResolution?.serial;if(serial&&serial!==lastSerial&&!resolutionQueue.some(r=>r.combat.lastResolution.serial===serial))resolutionQueue.push(room);return;}ensure();const c=room?.combat;if(!c)return;const pending=!!c.lastResolution?.serial&&c.lastResolution.serial!==lastSerial;const ended=room.phase==='defeat'||!!c.ended||['combat-victory','boss-victory'].includes(room.eventResult?.degree),strip=document.getElementById('combatStatusStrip');if(strip){strip.innerHTML=ended?'<span>戰鬥結束</span>':`<span>${c.kind==='boss'?'BOSS':c.kind==='elite'?'精英戰':'戰鬥中'}</span><b>ROUND ${Number(c.round||1)}</b><em>敵方 ${alive(c).length}</em>`;strip.classList.toggle('ended',ended);}
    document.getElementById('combatPanel')?.classList.toggle('combat-result-only',ended&&!pending);
    document.getElementById('combatStage')?.classList.add('hidden');
    if(!ended||pending){renderEnemies(room);renderTeam(room);}if(!ended){renderActions(room);renderConfirm(room);}['combatEnemyRoster','combatOptions','teamActions','confirmBar','roundProgress','combatStatusStrip','battleLog','combatLog'].forEach(id=>document.getElementById(id)?.classList.toggle('combat-ended-hidden',ended&&!pending));document.querySelectorAll('#combatPanel .action-prompt').forEach(el=>el.classList.toggle('combat-ended-hidden',ended&&!pending));
    if(!ended)phase(c.phase==='attack'?'attack':c.phase==='defense'?'defense':c.phase==='resolving'?c.lastResolution?.phase||'movement':'movement',c.phase==='attack'?'僅輸出牌生效，敵方防守':c.phase==='defense'?'僅防禦牌生效，敵方攻擊':c.phase==='resolving'?'演出完成後等待隊友，再輪換回合':'等待機動判定完成');else document.getElementById('combatPhaseBanner')?.classList.add('hidden');
    renderLog(room);document.getElementById('combatLog')?.closest('details')?.classList.toggle('combat-ended-hidden',ended&&!pending);renderResult(room);renderSkills(room);window.KBMCombatVFX?.persistent(room);
    if(c.kind==='boss'&&!c._clientBossWarned){c._clientBossWarned=true;window.KBMCombatSounds?.bossWarning();}
    if(!ended&&c.flowVersion&&c.phase==='initiative'){if(lastInitiative!==c.initiativeSerial){lastInitiative=c.initiativeSerial;playMovement(room);}else acknowledge(room,'initiative',c.initiativeSerial);return;}
    const r=c.lastResolution;if(c.flowVersion&&c.phase==='resolving'&&r?.serial===lastSerial)acknowledge(room,'resolution',r.serial);if(r?.serial&&r.serial!==lastSerial){document.body.classList.add('battle-playing');lastSerial=r.serial;setTimeout(()=>playResolution(room,r),100);}
  }
  socket.on('room:update',room=>requestAnimationFrame(()=>render(room)));
  requestAnimationFrame(()=>state?.room?.combat&&render(state.room));
  window.KBMCombatUI={render,isResolving};
})();