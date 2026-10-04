(()=>{
  const TYPE_LABEL={slash:'斬擊',blunt:'鈍擊',pierce:'突擊'};
  let draftTarget=null,draftPart=null,lastSerial=null,playing=false;
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
  function actionsFor(player){
    const weapon=player?.equipment?.weapon,types=Array.isArray(weapon?.attackTypes)&&weapon.attackTypes.length?weapon.attackTypes:['blunt'];
    const attacks=types.map(type=>({id:`attack:${type}`,label:`${weapon?.name||'徒手攻擊'}・${TYPE_LABEL[type]||type}`,stat:'combat',statLabel:'戰鬥',kind:'weapon-attack',damageType:type,power:1.35,desc:`使用目前武器進行${TYPE_LABEL[type]||type}攻擊。`}));
    const basics=[{id:'guard',label:'防禦',stat:'stability',statLabel:'穩定',kind:'guard',desc:'本回合受到的傷害大幅降低。'},{id:'analyze',label:'觀察弱點',stat:'observe',statLabel:'觀察',kind:'analyze',desc:'降低敵人防禦並增加線索。'}];
    const skills=(player?.learnedSkills||[]).map(skill).filter(Boolean).map(s=>({...s,label:s.name,skillId:s.id,statLabel:{combat:'戰鬥',observe:'觀察',mobility:'機動',stability:'穩定'}[s.stat]||'技能'}));
    return [...attacks,...basics,...skills];
  }
  function estimate(room,player,a,target,part){
    if(!a||['guard','analyze'].includes(a.id)||['heal','team-buff'].includes(a.kind))return {text:a?.id==='guard'?'減傷約 52%':a?.id==='analyze'?'降低防禦／取得線索':'輔助技能'};
    const stat=Math.max(1,playerStat(player,a.stat||'combat')),power=Number(a.power||1.35),flat=a.kind==='weapon-attack'?0:2;
    let min=Math.max(1,Math.round(stat*power)+flat),max=min+6;
    if(a.partBonus&&part){min=Math.round(min*(1+a.partBonus));max=Math.round(max*(1+a.partBonus));}
    if(a.minionBonus&&target?.role==='minion'){min=Math.round(min*(1+a.minionBonus));max=Math.round(max*(1+a.minionBonus));}
    if(a.bossBonus&&['boss','elite'].includes(target?.role)){min=Math.round(min*(1+a.bossBonus));max=Math.round(max*(1+a.bossBonus));}
    if(a.dangerScale){const d=1+Number(room.exploration?.danger||0)*a.dangerScale;min=Math.round(min*d);max=Math.round(max*d);}
    const mult=a.damageType?Number(target?.resistances?.[a.damageType]??1):1;min=Math.max(1,Math.round(min*mult));max=Math.max(min,Math.round(max*mult));
    const def=KBMCheckRules.combatDefense(target,a,player?.relics),mod=KBMCheckRules.combatModifier(stat);let hits=0;for(let d=1;d<=20;d++)if(d===20||d+mod>=def)hits++;
    return {min,max,hit:Math.round(hits/20*100),mult,relation:relation(mult),text:`${min}～${max} 傷害 · 命中約 ${Math.round(hits/20*100)}%`};
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
  function resistanceHtml(enemy){return `<div class="damage-resistances">${['slash','blunt','pierce'].map(t=>{const m=Number(enemy.resistances?.[t]??1);return `<span class="${typeClass(m)}"><b>${TYPE_LABEL[t]}</b><em>×${m.toFixed(2)}</em><small>${relation(m)}</small></span>`}).join('')}</div>`;}
  function renderEnemies(room){
    const c=room.combat,root=document.getElementById('combatEnemyRoster');if(!root||!c)return;const sel=currentSelection(room),targetId=sel?.targetId||draftTarget||alive(c)[0]?.instanceId;
    root.innerHTML=c.blockChallenge?`<div class="block-warning"><strong>阻擋要求</strong><span>本回合對指定攻擊部位造成至少 <b>${Number(c.blockChallenge.requiredDamage||0)}</b> 傷害，可中斷「${esc(c.blockChallenge.label||'蓄力攻擊')}」。</span></div>`:'';
    root.innerHTML+=`<div class="enemy-grid">${alive(c).map(e=>{const intent=c.intents?.[e.instanceId],pct=e.maxHp?Math.max(0,e.currentHp/e.maxHp*100):0,selected=e.instanceId===targetId;return `<article class="enemy-card ${selected?'selected':''} ${esc(e.role)}" data-combat-target="${esc(e.instanceId)}"><div class="enemy-card-head"><div><strong>${esc(e.name)}</strong><small>${e.role==='boss'?'BOSS':e.role==='elite'?'精英':'小怪'}</small></div><span>${e.currentHp}/${e.maxHp}</span></div><div class="combat-hp"><i style="width:${pct}%"></i></div>${resistanceHtml(e)}<div class="intent-card"><span>下一行動</span><b>${esc(intent?.label||'觀察中')}</b><small>${esc(intent?.description||'')}</small></div>${(e.parts||[]).length?`<div class="part-list">${e.parts.map(p=>`<button class="part-button" data-combat-part="${esc(p.id)}" data-enemy="${esc(e.instanceId)}" ${p.destroyed?'disabled':''}><span>${esc(p.name)}</span><b>${p.destroyed?'已破壞':`${p.currentHp}/${p.maxHp}`}</b><small>${esc(p.effect||'')}</small></button>`).join('')}</div>`:''}</article>`}).join('')}</div>`;
    root.querySelectorAll('[data-combat-target]').forEach(el=>el.onclick=ev=>{if(ev.target.closest('[data-combat-part]'))return;draftTarget=el.dataset.combatTarget;draftPart=null;const s=currentSelection(room);if(s?.actionId)action('combat:select',{roomId:room.id,actionId:s.actionId,targetId:draftTarget,partId:null});else render(room);});
    root.querySelectorAll('[data-combat-part]').forEach(btn=>btn.onclick=ev=>{ev.stopPropagation();draftTarget=btn.dataset.enemy;draftPart=btn.dataset.combatPart;const s=currentSelection(room);if(s?.actionId)action('combat:select',{roomId:room.id,actionId:s.actionId,targetId:draftTarget,partId:draftPart});else render(room);});
  }
  function renderActions(room){
    const root=document.getElementById('combatOptions'),player=me(room),c=room.combat;if(!root||!player||!c)return;const sel=currentSelection(room),target=currentTarget(room),part=target?.parts?.find(p=>p.id===(sel?.partId||draftPart)&&!p.destroyed)||null;
    root.innerHTML=actionsFor(player).map(a=>{const cd=Number(c.cooldowns?.[player.id]?.[a.id]||0),selected=sel?.actionId===a.id,locked=!!sel?.confirmed||cd>0,est=estimate(room,player,a,target,part);return `<button class="event-option combat-action ${selected?'selected':''}" data-combat-action="${esc(a.id)}" ${locked?'disabled':''}><div class="option-head"><span>${esc(a.label||a.name)}</span><em>${esc(a.damageType?TYPE_LABEL[a.damageType]:a.statLabel||a.stat||'技能')}</em></div><p>${esc(a.desc||a.description||'')}</p><div class="damage-preview">${cd>0?`冷卻 ${cd} 回合`:esc(est.text||'')}</div>${a.damageType&&target?`<div class="damage-relation ${typeClass(est.mult)}">${TYPE_LABEL[a.damageType]} ${est.relation} ×${Number(est.mult||1).toFixed(2)}</div>`:''}</button>`}).join('');
    root.querySelectorAll('[data-combat-action]').forEach(btn=>btn.onclick=()=>{const targetNow=currentTarget(room)||alive(c)[0];draftTarget=targetNow?.instanceId||null;action('combat:select',{roomId:room.id,actionId:btn.dataset.combatAction,targetId:draftTarget,partId:draftPart});});
  }
  function renderTeam(room){
    const root=document.getElementById('teamActions'),c=room.combat;if(!root||!c)return;const active=room.players.filter(p=>p.connected&&p.hp>0),confirmed=active.filter(p=>c.selections?.[p.id]?.confirmed).length;
    root.innerHTML=`<div class="team-actions-title">隊伍行動 · ${confirmed}/${active.length} 已確認</div>${active.map(p=>{const s=c.selections?.[p.id],enemy=(c.enemies||[]).find(e=>e.instanceId===s?.targetId),part=enemy?.parts?.find(x=>x.id===s?.partId);return `<div class="team-action-row ${s?.confirmed?'confirmed':''}" data-player-id="${esc(p.id)}"><span>${esc(sinnerById(p.sinnerId)?.name||p.name)}</span><b>${esc(s?.label||'尚未選擇')}</b><small>${enemy?`→ ${esc(enemy.name)}${part?` / ${esc(part.name)}`:''}`:''}</small><em>${s?.confirmed?'已確認':s?'可更改':'思考中'}</em></div>`}).join('')}`;
  }
  function renderConfirm(room){
    const root=document.getElementById('confirmBar'),player=me(room),c=room.combat;if(!root||!player||!c)return;const s=c.selections?.[player.id],enemy=(c.enemies||[]).find(e=>e.instanceId===s?.targetId),part=enemy?.parts?.find(p=>p.id===s?.partId);
    root.innerHTML=s?.confirmed?`<button id="cancelCombatConfirm" class="secondary">取消確認</button><span>等待其他隊員確認…</span>`:`<button id="confirmCombat" ${s?'':'disabled'}>確認本回合行動</button><span>${s?`已選：${esc(s.label)}${enemy?` → ${esc(enemy.name)}`:''}${part?` / ${esc(part.name)}`:''}${s.preview?.max?` · ${s.preview.min}～${s.preview.max} 傷害`:''}`:'先選擇行動與目標'}</span>`;
    root.querySelector('#confirmCombat')?.addEventListener('click',()=>action('combat:confirm',{roomId:room.id}));root.querySelector('#cancelCombatConfirm')?.addEventListener('click',()=>action('combat:cancel-confirm',{roomId:room.id}));
  }
  function renderSkills(room){
    const player=me(room),root=document.getElementById('mySinner');if(!player||!root||!player.sinnerId)return;root.querySelector('.skill-fold')?.remove();const list=(state.gameData?.sinnerSkills||[]).filter(s=>s.sinnerId===player.sinnerId),learned=player.learnedSkills||[];const d=document.createElement('details');d.className='inventory-fold skill-fold';d.innerHTML=`<summary>罪人技能 <span>${learned.length}/3</span></summary><div class="skill-list">${list.map(s=>{const has=learned.includes(s.id),can=!has&&learned.length<3&&Number(player.gold||0)>=Number(s.cost||0)&&!room.combat;return `<div class="skill-row ${has?'learned':''}"><div><strong>${esc(s.name)}</strong><small>${esc(s.description)}</small><em>${esc(s.stat)} · ${Number(s.cost||0)} 金幣</em></div><button data-learn-skill="${esc(s.id)}" ${can?'':'disabled'}>${has?'已學會':learned.length>=3?'已滿':`${Number(s.cost||0)} 金幣`}</button></div>`}).join('')}</div>`;root.appendChild(d);d.querySelectorAll('[data-learn-skill]').forEach(b=>b.onclick=()=>action('skill:learn',{roomId:room.id,skillId:b.dataset.learnSkill}));
  }
  function renderLog(room){const log=document.getElementById('combatLog');if(!log)return;const rows=room.combat?.log||[];log.innerHTML=rows.map(r=>`<div class="combat-log-row"><span>R${Number(r.round||0)}</span><p>${esc(r.text||'')}</p></div>`).join('');const fold=log.closest('.combat-log-fold');if(fold){fold.classList.remove('hidden');if(room.combat?.ended)fold.open=true;}}
  function renderResult(room){const result=document.getElementById('combatResult');if(!result)return;const ended=!!room.combat?.ended||['combat-victory','boss-victory'].includes(room.eventResult?.degree);result.classList.toggle('hidden',!ended);if(!ended)return;const r=room.eventResult||{};result.innerHTML=`<div class="combat-result-head"><span>COMBAT RESULT</span><strong>${r.degree==='boss-victory'?'BOSS 擊破':'戰鬥勝利'}</strong></div><p>${esc(r.text||'敵方已被擊破。')}</p>${Number(r.gold||0)>0?`<div class="combat-reward">每位隊員 +${Number(r.gold)} 金幣</div>`:''}`;}
  function focus(kind,title,body,amount=''){const box=document.getElementById('battleFocus');if(!box)return;box.className=`battle-focus ${kind}`;box.innerHTML=`<span>${esc(title)}</span><strong>${esc(body)}</strong>${amount?`<b>${esc(amount)}</b>`:''}`;}
  function fx(target,cls,text){if(!target)return;target.classList.remove('combat-hit','combat-attack','combat-block');void target.offsetWidth;target.classList.add(cls);const n=document.createElement('div');n.className='combat-float';n.textContent=text;target.appendChild(n);setTimeout(()=>n.remove(),1900);setTimeout(()=>target.classList.remove(cls),750);}
  function enemyEl(id){return id?document.querySelector(`[data-combat-target="${CSS.escape(id)}"]`):null;}
  async function playResolution(room,res){
    if(playing)return;playing=true;document.getElementById('combatPanel')?.classList.add('combat-resolving');const steps=(res.players?.length||0)+(res.enemyResults?.length||0),bar=document.getElementById('roundProgress');let i=0;
    for(const rec of res.players||[]){if(Number(rec.die)>0)await window.KBMDice?.play([{name:rec.sinner,die:rec.die,total:rec.total}],"戰鬥擲骰");i++;if(bar)bar.innerHTML=`<i style="width:${steps?i/steps*100:100}%"></i>`;const enemy=enemyEl(rec.targetId);focus('player',rec.sinner,`${rec.action}${rec.target?` → ${rec.target}`:''}${rec.part?` / ${rec.part}`:''}`,rec.dealt>0?`-${rec.dealt}`:rec.action==='防禦'?'GUARD':rec.action==='觀察弱點'?'ANALYZE':'MISS');if(enemy){enemy.scrollIntoView({block:'nearest',behavior:'smooth'});enemy.classList.add('target-focus');await sleep(160);fx(enemy,rec.dealt>0?'combat-hit':'combat-block',rec.dealt>0?`-${rec.dealt}`:'MISS');}if(window.KBMCombatSounds){if(rec.dealt>0)window.KBMCombatSounds.attack(rec.damageType||'anomaly');else window.KBMCombatSounds.miss();}await sleep(850);enemy?.classList.remove('target-focus');}
    for(const er of res.enemyResults||[]){i++;if(bar)bar.innerHTML=`<i style="width:${steps?i/steps*100:100}%"></i>`;const enemy=enemyEl(er.enemyId);focus(er.blocked?'blocked':'enemy',enemy?.querySelector('.enemy-card-head strong')?.textContent||'敵人',er.blocked?`${er.label} 被阻擋`:er.label,er.blocked?'BLOCK':er.damage?`-${er.damage}`:'');if(enemy)fx(enemy,er.blocked?'combat-block':'combat-attack',er.blocked?'BLOCK':'!');if(window.KBMCombatSounds){if(er.blocked)window.KBMCombatSounds.shieldBreak();else if(er.damage>0)window.KBMCombatSounds.hurt();else window.KBMCombatSounds.miss();}await sleep(900);if(er.summoned){focus('summon','增援',`${er.summoned} 進入戰場`,'SUMMON');await sleep(650);}}
    if(res.victory){focus('victory','戰鬥結束','敵方已被擊破',res.gold?`+${res.gold} 金幣`:'VICTORY');window.KBMCombatSounds?.victory();await sleep(1100);}document.getElementById('combatPanel')?.classList.remove('combat-resolving');if(bar)bar.innerHTML='<i style="width:100%"></i>';await sleep(200);document.getElementById('battleFocus')?.classList.add('hidden');playing=false;
  }
  function render(room){
    ensure();const c=room?.combat;if(!c)return;const ended=!!c.ended||['combat-victory','boss-victory'].includes(room.eventResult?.degree),strip=document.getElementById('combatStatusStrip');if(strip){strip.innerHTML=ended?'<span>戰鬥結束</span>':`<span>${c.kind==='boss'?'BOSS':c.kind==='elite'?'精英戰':'戰鬥中'}</span><b>ROUND ${Number(c.round||1)}</b><em>敵方 ${alive(c).length}</em>`;strip.classList.toggle('ended',ended);}
    document.getElementById('combatStage')?.classList.add('hidden');
    if(!ended){renderEnemies(room);renderActions(room);renderTeam(room);renderConfirm(room);}['combatEnemyRoster','combatOptions','teamActions','confirmBar','roundProgress'].forEach(id=>document.getElementById(id)?.classList.toggle('combat-ended-hidden',ended));document.querySelectorAll('#combatPanel .action-prompt').forEach(el=>el.classList.toggle('combat-ended-hidden',ended));
    renderLog(room);renderResult(room);renderSkills(room);
    if(c.kind==='boss'&&!c._clientBossWarned){c._clientBossWarned=true;window.KBMCombatSounds?.bossWarning();}
    const r=c.lastResolution;if(r?.serial&&r.serial!==lastSerial){lastSerial=r.serial;setTimeout(()=>playResolution(room,r),100);}
  }
  socket.on('room:update',room=>requestAnimationFrame(()=>render(room)));
  requestAnimationFrame(()=>state?.room?.combat&&render(state.room));
  window.KBMCombatUI={render,actionsFor,estimate};
})();