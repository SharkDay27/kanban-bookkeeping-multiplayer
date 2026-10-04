let v083LastPhaseKey='';
let v083LastResolution=null;

function v083PlayerStat(player,key){
  const sinner=sinnerById(player.sinnerId);if(!sinner)return 0;
  const eq=equipmentMods(player),sm=statusMods(player);
  return Number(sinner.stats?.[key]||0)+Number(eq[key]||0)+Number(sm[key]||0);
}
function v083SuccessChance(modifier,dc){
  let success=0;
  for(let die=1;die<=20;die++)if(die===20||die+modifier>=dc)success++;
  return Math.round(success/20*100);
}
function v083OptionChanceRange(room,option){
  const event=room.currentEvent;if(!event)return null;
  const active=room.players.filter(p=>p.connected&&p.hp>0);if(!active.length)return null;
  const chapterDc=[-2,0,2][Math.max(0,Math.min(2,room.areaIndex||0))]||0;
  const dc=Math.max(8,Math.round(11+Number(event.difficulty||0)+Number(room.exploration?.danger||0)*.7+chapterDc));
  let lowSum=0,highSum=0;
  for(const p of active){
    if(p.id===state.selfId){const value=v083PlayerStat(p,option.stat)+Number(option.bonus||0);lowSum+=value;highSum+=value;continue;}
    const voted=event.options.find(o=>o.id===room.votes?.[p.id]);
    if(voted){const value=v083PlayerStat(p,voted.stat)+Number(voted.bonus||0);lowSum+=value;highSum+=value;continue;}
    const candidates=event.options.map(o=>v083PlayerStat(p,o.stat)+Number(o.bonus||0));
    lowSum+=Math.min(...candidates);highSum+=Math.max(...candidates);
  }
  const lowMod=Math.round((lowSum/active.length)/2),highMod=Math.round((highSum/active.length)/2);
  const a=v083SuccessChance(lowMod,dc),b=v083SuccessChance(highMod,dc);
  return {min:Math.min(a,b),max:Math.max(a,b),dc};
}
function v083AddProbability(room){
  if(!room.currentEvent||room.eventResult)return;
  document.querySelectorAll('#eventOptions [data-option]').forEach(button=>{
    const option=room.currentEvent.options.find(o=>o.id===button.dataset.option);if(!option)return;
    const range=v083OptionChanceRange(room,option);if(!range)return;
    button.querySelector('.success-range')?.remove();
    const label=document.createElement('div');label.className='success-range';
    label.innerHTML=range.min===range.max?`估計成功率 <strong>${range.min}%</strong>`:`估計成功率 <strong>${range.min}%～${range.max}%</strong>`;
    button.appendChild(label);
  });
}
function v083CollapseInventory(){
  const root=document.getElementById('mySinner');if(!root||root.querySelector('.inventory-fold'))return;
  const headings=[...root.querySelectorAll('.mini-heading')];
  headings.forEach((heading,index)=>{
    const grid=heading.nextElementSibling;if(!grid)return;
    const details=document.createElement('details');details.className='inventory-fold';
    const summary=document.createElement('summary');summary.innerHTML=index===0?'裝備':'消耗品';
    heading.parentNode.insertBefore(details,heading);details.appendChild(summary);details.appendChild(grid);heading.remove();
  });
}
function v083HostButton(room){
  const button=document.getElementById('forgetSession');if(!button)return;
  button.classList.toggle('hidden',state.selfId!==room.hostId);
}
function v083BossPhase(room){
  const box=document.getElementById('bossPhase');if(!box)return;
  const combat=room.combat;
  if(!combat||combat.kind!=='boss'||!combat.bossPhase){box.classList.add('hidden');box.textContent='';return;}
  box.classList.remove('hidden');box.textContent=`PHASE / ${combat.bossPhase}`;
  const key=`${combat.enemy.id}:${combat.bossPhase}`;
  if(key!==v083LastPhaseKey){v083LastPhaseKey=key;box.classList.remove('phase-shift');void box.offsetWidth;box.classList.add('phase-shift');}
}
function v083PartyScale(room){
  const combat=room.combat,kind=document.getElementById('enemyKind');
  if(!combat?.enemy?.partyScale||!kind)return;
  const n=combat.enemy.partyScale.count;kind.title=`已依 ${n} 人隊伍調整敵人生命與攻擊。`;
}
function v083Enhance(room){v083HostButton(room);v083AddProbability(room);v083CollapseInventory();v083BossPhase(room);v083PartyScale(room);}

animateCombat=function(c){
  const key=`${state.room?.areaIndex}-${state.room?.exploration?.position}-${c.enemy?.id}`;
  if(key!==lastCombatKey){lastCombatKey=key;lastCombatSerial=null;const stage=$('combatStage');stage.classList.remove('boss-enter','encounter-enter');void stage.offsetWidth;stage.classList.add(c.kind==='boss'?'boss-enter':'encounter-enter');setTimeout(()=>stage.classList.remove('boss-enter','encounter-enter'),1000)}
  const r=c.lastResolution;if(!r||r.serial===lastCombatSerial)return;lastCombatSerial=r.serial;
  const stage=$('combatStage'),fx=$('combatFx');stage.classList.remove('enemy-hit','party-hit','phase-impact');void stage.offsetWidth;
  if(r.teamDamage>0)stage.classList.add('enemy-hit');if(r.incoming>0)setTimeout(()=>stage.classList.add('party-hit'),250);if(r.phaseChanged)stage.classList.add('phase-impact');
  fx.innerHTML=`${r.teamDamage>0?`<span class="floating-damage enemy-damage">-${r.teamDamage}</span>`:''}${r.incoming>0?`<span class="floating-damage party-damage">全隊 -${r.incoming}</span>`:''}${r.phaseChanged?`<span class="phase-float">${escapeHtml(r.phaseChanged.to)}</span>`:''}`;
  setTimeout(()=>{stage.classList.remove('enemy-hit','party-hit','phase-impact');fx.innerHTML=''},1650);
};

socket.on('room:update',room=>requestAnimationFrame(()=>v083Enhance(room)));
requestAnimationFrame(()=>state?.room&&v083Enhance(state.room));
