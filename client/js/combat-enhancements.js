let v082LastIntentSerial=null;
let v082LastResolutionSerial=null;

function v082Escape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function v082RenderIntent(room){
  const box=document.getElementById('enemyIntent');
  if(!box)return;
  const intent=room?.combat?.intent;
  if(!intent){box.innerHTML='';box.className='enemy-intent hidden';return;}
  box.className=`enemy-intent intent-${intent.type||'attack'}`;
  box.innerHTML=`<div class="intent-head"><span>敵人下一行動</span><strong>${v082Escape(intent.label)}</strong></div><p>${v082Escape(intent.description||'')}</p>${intent.statusName?`<small>可能施加：${v082Escape(intent.statusName)}</small>`:''}`;
  if(intent.serial&&intent.serial!==v082LastIntentSerial){
    v082LastIntentSerial=intent.serial;
    box.classList.remove('intent-reveal');void box.offsetWidth;box.classList.add('intent-reveal');
  }
}
function v082FixItemButtons(room){
  document.querySelectorAll('[data-item-index]').forEach((button)=>{
    button.onclick=()=>action('item:use',{roomId:room.id,slot:Number(button.dataset.itemIndex)});
  });
}
function v082DangerHint(room){
  const meter=document.querySelector('.meter.danger');
  if(!meter||meter.querySelector('.danger-hint'))return;
  const d=Number(room?.exploration?.danger||0);
  const text=d<=1?'穩定：安全節點較多，報酬偏基礎。':d<=3?'警戒：敵人與事件增強，稀有報酬率上升。':d<=5?'高風險：精英與高難事件增加，高品質報酬率提高。':'極高風險：敵人非常危險，但稀有裝備、道具與增益機率最高。';
  const hint=document.createElement('small');hint.className='danger-hint';hint.textContent=text;meter.appendChild(hint);
}
function v082CombatImpact(room){
  const resolution=room?.combat?.lastResolution;
  const stage=document.getElementById('combatStage');
  const fx=document.getElementById('combatFx');
  if(!resolution?.serial||resolution.serial===v082LastResolutionSerial||!stage||!fx)return;
  v082LastResolutionSerial=resolution.serial;
  if(resolution.enemyIntent){
    const intentFlash=document.createElement('div');
    intentFlash.className='intent-executed';
    intentFlash.textContent=resolution.enemyIntent.label;
    fx.appendChild(intentFlash);
  }
  (resolution.enemyTargets||[]).forEach((target,index)=>{
    const chip=document.createElement('div');
    chip.className='target-impact';
    chip.style.setProperty('--impact-index',index);
    chip.textContent=`${target.name} -${target.damage}${target.guarded?'（防禦）':''}`;
    fx.appendChild(chip);
  });
  if(resolution.statusApplied){
    const status=document.createElement('div');
    status.className='status-impact';
    status.textContent=`${resolution.statusApplied.name}：${resolution.statusApplied.statusName}`;
    fx.appendChild(status);
  }
  if(resolution.enemyBuff){
    const buff=document.createElement('div');buff.className='enemy-buff-impact';buff.textContent=resolution.enemyBuff;fx.appendChild(buff);
  }
  setTimeout(()=>{fx.querySelectorAll('.intent-executed,.target-impact,.status-impact,.enemy-buff-impact').forEach(x=>x.remove());},1500);
}
function v082Enhance(room){
  v082RenderIntent(room);
  v082FixItemButtons(room);
  v082DangerHint(room);
  v082CombatImpact(room);
}

socket.on('room:update',(room)=>requestAnimationFrame(()=>v082Enhance(room)));
requestAnimationFrame(()=>state?.room&&v082Enhance(state.room));
