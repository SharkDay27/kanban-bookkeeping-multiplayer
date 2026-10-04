let v11LastSerial=null,v11Playing=false,v11Queue=[];
const v11Sleep=ms=>new Promise(r=>setTimeout(r,ms));
function v11Esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function v11Ensure(){
 const panel=document.getElementById('combatPanel');if(!panel)return;
 if(!document.getElementById('v11BattleFocus')){const d=document.createElement('div');d.id='v11BattleFocus';d.className='v11-battle-focus hidden';document.getElementById('combatStage')?.after(d);}
 if(!document.getElementById('v11RoundProgress')){const d=document.createElement('div');d.id='v11RoundProgress';d.className='v11-round-progress';document.getElementById('v11BattleFocus')?.after(d);}
 const log=document.getElementById('combatLog');if(log&&!log.closest('.v11-log-fold')){const details=document.createElement('details');details.className='v11-log-fold';const summary=document.createElement('summary');summary.textContent='戰鬥紀錄';log.parentNode.insertBefore(details,log);details.appendChild(summary);details.appendChild(log);}
}
function v11FindEnemy(name,id){if(id)return document.querySelector(`[data-v10-target="${CSS.escape(id)}"]`);return [...document.querySelectorAll('[data-v10-target]')].find(x=>x.querySelector('.v10-enemy-head strong')?.textContent===name)||null;}
function v11FindPlayer(id){return [...document.querySelectorAll('.v10-team-row')].find(x=>x.dataset.playerId===id)||null;}
function v11Focus(kind,title,body,amount=''){
 const box=document.getElementById('v11BattleFocus');if(!box)return;box.className=`v11-battle-focus ${kind}`;box.innerHTML=`<span>${v11Esc(title)}</span><strong>${v11Esc(body)}</strong>${amount?`<b>${v11Esc(amount)}</b>`:''}`;
}
function v11Fx(target,cls,text){if(!target)return;target.classList.remove('v11-hit','v11-attack','v11-block');void target.offsetWidth;target.classList.add(cls);const n=document.createElement('div');n.className='v11-float';n.textContent=text;target.appendChild(n);setTimeout(()=>n.remove(),1150);setTimeout(()=>target.classList.remove(cls),650);}
async function v11PlayerStep(rec){
 const enemy=v11FindEnemy(rec.target);v11Focus('player',rec.sinner,`${rec.action}${rec.target?` → ${rec.target}`:''}${rec.part?` / ${rec.part}`:''}`,rec.dealt>0?`-${rec.dealt}`:rec.action==='防禦'?'GUARD':rec.action==='觀察弱點'?'ANALYZE':'MISS');
 if(enemy){enemy.scrollIntoView({block:'nearest',behavior:'smooth'});enemy.classList.add('v11-target-focus');await v11Sleep(180);v11Fx(enemy,rec.dealt>0?'v11-hit':'v11-block',rec.dealt>0?`-${rec.dealt}`:'MISS');}
 await v11Sleep(720);enemy?.classList.remove('v11-target-focus');
}
async function v11EnemyStep(room,res){
 const enemy=v11FindEnemy(null,res.enemyId),targets=(res.targets||[]).map(id=>sinnerById(room.players.find(p=>p.id===id)?.sinnerId)?.name||room.players.find(p=>p.id===id)?.name).filter(Boolean).join('、');
 v11Focus(res.blocked?'blocked':'enemy',enemy?.querySelector('.v10-enemy-head strong')?.textContent||'敵人',res.blocked?`${res.label} 被阻擋`: `${res.label}${targets?` → ${targets}`:''}`,res.blocked?'BLOCK':res.damage?`-${res.damage}`:'');
 if(enemy)v11Fx(enemy,'v11-attack',res.blocked?'BLOCK':'!');
 if(!res.blocked&&res.damage){document.getElementById('combatPanel')?.classList.add('v11-party-impact');setTimeout(()=>document.getElementById('combatPanel')?.classList.remove('v11-party-impact'),600);}
 await v11Sleep(760);
 if(res.summoned){v11Focus('summon','增援',`${res.summoned} 進入戰場`,'SUMMON');await v11Sleep(650);}
}
async function v11Play(room,res){
 if(v11Playing)return;v11Playing=true;document.getElementById('combatPanel')?.classList.add('v11-resolving');
 const total=(res.players?.length||0)+(res.enemyResults?.length||0);let step=0;const prog=document.getElementById('v11RoundProgress');
 for(const p of res.players||[]){step++;if(prog)prog.innerHTML=`<i style="width:${total?step/total*100:100}%"></i>`;await v11PlayerStep(p);}
 for(const e of res.enemyResults||[]){step++;if(prog)prog.innerHTML=`<i style="width:${total?step/total*100:100}%"></i>`;await v11EnemyStep(room,e);}
 if(res.victory){v11Focus('victory','戰鬥結束','敵方已被擊破',res.gold?`+${res.gold} 金幣`:'VICTORY');await v11Sleep(1100);}
 document.getElementById('combatPanel')?.classList.remove('v11-resolving');if(prog)prog.innerHTML='<i style="width:100%"></i>';await v11Sleep(220);document.getElementById('v11BattleFocus')?.classList.add('hidden');v11Playing=false;
}
function v11Compact(room){
 v11Ensure();const c=room.combat;if(!c)return;
 document.querySelectorAll('.v10-team-row').forEach((row,i)=>{const p=room.players.filter(p=>p.connected&&p.hp>0)[i];if(p)row.dataset.playerId=p.id;});
 const root=document.getElementById('v10TeamActions');if(root){const confirmed=room.players.filter(p=>p.connected&&p.hp>0&&c.selections?.[p.id]?.confirmed).length,active=room.players.filter(p=>p.connected&&p.hp>0).length;root.querySelector('.v10-team-title')?.replaceChildren(document.createTextNode(`隊伍行動 · ${confirmed}/${active} 已確認`));}
 const focus=document.getElementById('v11BattleFocus');if(!v11Playing&&focus)focus.classList.add('hidden');
 const res=c.lastResolution;if(res?.serial&&res.serial!==v11LastSerial){v11LastSerial=res.serial;setTimeout(()=>v11Play(room,res),120);}
}
if(typeof animateCombat==='function')animateCombat=function(){};
socket.on('room:update',room=>requestAnimationFrame(()=>v11Compact(room)));
requestAnimationFrame(()=>state?.room&&v11Compact(state.room));