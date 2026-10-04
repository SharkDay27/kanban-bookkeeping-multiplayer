let v13AudioEnabled=localStorage.getItem('kbm-sfx')!=='off';
let v13AudioCtx=null,v13LastCombatSerial=null;
function v13Audio(){
  if(!v13AudioEnabled)return null;
  if(!v13AudioCtx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;v13AudioCtx=new C();}
  if(v13AudioCtx.state==='suspended')v13AudioCtx.resume().catch(()=>{});
  return v13AudioCtx;
}
function v13Tone(freq=440,dur=.07,type='sine',gain=.035,slide=0){
  const ctx=v13Audio();if(!ctx)return;const now=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,now);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),now+dur);
  g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(gain,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+dur);
  o.connect(g);g.connect(ctx.destination);o.start(now);o.stop(now+dur+.02);
}
function v13Noise(dur=.08,gain=.025){
  const ctx=v13Audio();if(!ctx)return;const len=Math.max(1,Math.floor(ctx.sampleRate*dur)),buf=ctx.createBuffer(1,len,ctx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
  const src=ctx.createBufferSource(),g=ctx.createGain();src.buffer=buf;g.gain.setValueAtTime(gain,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur);src.connect(g);g.connect(ctx.destination);src.start();
}
const v13Sfx={
  click(){v13Tone(520,.045,'sine',.018,70)},
  select(){v13Tone(620,.065,'triangle',.025,140)},
  confirm(){v13Tone(540,.06,'triangle',.03,120);setTimeout(()=>v13Tone(760,.08,'triangle',.025,90),55)},
  cancel(){v13Tone(360,.08,'sine',.022,-90)},
  hit(){v13Noise(.11,.035);v13Tone(120,.09,'square',.025,-35)},
  miss(){v13Tone(480,.07,'sine',.018,-180)},
  hurt(){v13Noise(.14,.04);v13Tone(95,.13,'sawtooth',.018,-25)},
  break(){v13Noise(.2,.05);v13Tone(210,.08,'square',.03,-130);setTimeout(()=>v13Tone(110,.13,'square',.025,-45),70)},
  warning(){v13Tone(330,.14,'sawtooth',.025,80);setTimeout(()=>v13Tone(250,.17,'sawtooth',.028,-40),130)},
  victory(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>v13Tone(f,.22,'triangle',.035,30),i*105))}
};
function v13EnsureAudioToggle(){
  if(document.getElementById('sfxToggle'))return;const bar=document.querySelector('.top-statuses');if(!bar)return;
  const b=document.createElement('button');b.id='sfxToggle';b.className='status subtle v13-sfx-toggle';b.type='button';b.textContent=v13AudioEnabled?'音效 ON':'音效 OFF';
  b.onclick=e=>{e.stopPropagation();v13AudioEnabled=!v13AudioEnabled;localStorage.setItem('kbm-sfx',v13AudioEnabled?'on':'off');b.textContent=v13AudioEnabled?'音效 ON':'音效 OFF';if(v13AudioEnabled){v13Audio();v13Sfx.confirm();}};bar.appendChild(b);
}
function v13Selection(room){
  const me=room?.players?.find(p=>p.id===state.selfId),c=room?.combat;if(!me||!c)return null;return c.selections?.[me.id]||null;
}
function v13MarkPartSelection(room){
  const sel=v13Selection(room);const targetId=sel?.targetId||((typeof v10DraftTarget!=='undefined')?v10DraftTarget:null);const partId=sel?.partId||((typeof v10DraftPart!=='undefined')?v10DraftPart:null);
  document.querySelectorAll('[data-v10-target]').forEach(el=>el.classList.toggle('v13-target-selected',!!targetId&&el.dataset.v10Target===targetId));
  document.querySelectorAll('[data-v10-part]').forEach(btn=>{
    const yes=!!partId&&btn.dataset.v10Part===partId&&(!targetId||btn.dataset.enemy===targetId);btn.classList.toggle('v13-part-selected',yes);
    let tag=btn.querySelector('.v13-selected-tag');if(yes&&!tag){tag=document.createElement('i');tag.className='v13-selected-tag';tag.textContent='已選擇';btn.appendChild(tag);}else if(!yes&&tag)tag.remove();
  });
  const bar=document.getElementById('v10ConfirmBar');if(bar&&sel){const enemy=(room.combat.enemies||[]).find(e=>e.instanceId===sel.targetId),part=enemy?.parts?.find(p=>p.id===sel.partId);let summary=bar.querySelector('.v13-target-summary');if(!summary){summary=document.createElement('div');summary.className='v13-target-summary';bar.appendChild(summary);}summary.innerHTML=`<span>目標</span><b>${enemy?String(enemy.name):'—'}${part?` / ${String(part.name)}`:''}</b>`;}else bar?.querySelector('.v13-target-summary')?.remove();
}
function v13BindPartSound(){
  document.addEventListener('click',e=>{
    if(e.target.closest('#sfxToggle'))return;
    const part=e.target.closest('[data-v10-part]');if(part){v13Audio();v13Sfx.select();return;}
    if(e.target.closest('#v10Confirm')){v13Sfx.confirm();return;}
    if(e.target.closest('#v10CancelConfirm')){v13Sfx.cancel();return;}
    if(e.target.closest('button:not(:disabled)'))v13Sfx.click();
  },true);
}
function v13CombatSounds(room){
  const r=room?.combat?.lastResolution;if(!r?.serial||r.serial===v13LastCombatSerial)return;v13LastCombatSerial=r.serial;
  let delay=120;
  for(const p of r.players||[]){setTimeout(()=>p.dealt>0?v13Sfx.hit():v13Sfx.miss(),delay);delay+=760;}
  for(const e of r.enemyResults||[]){setTimeout(()=>e.blocked?v13Sfx.break():e.damage>0?v13Sfx.hurt():v13Sfx.miss(),delay);delay+=800;}
  if(r.victory)setTimeout(()=>v13Sfx.victory(),delay+150);
}
function v13Apply(room){v13EnsureAudioToggle();if(room?.combat){requestAnimationFrame(()=>v13MarkPartSelection(room));v13CombatSounds(room);}}
v13BindPartSound();
document.addEventListener('pointerdown',()=>v13Audio(),{once:true,capture:true});
socket.on('room:update',room=>requestAnimationFrame(()=>v13Apply(room)));
requestAnimationFrame(()=>{v13EnsureAudioToggle();if(state?.room)v13Apply(state.room);});