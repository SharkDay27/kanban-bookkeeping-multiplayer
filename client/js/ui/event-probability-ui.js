(()=>{
  function playerStat(player,key){const sinner=sinnerById(player?.sinnerId);if(!sinner)return 0;const eq=equipmentMods(player),sm=statusMods(player);return Number(sinner.stats?.[key]||0)+Number(eq[key]||0)+Number(sm[key]||0);}
  function successChance(mod,dc){let ok=0;for(let d=1;d<=20;d++)if(d===20||d+mod>=dc)ok++;return Math.round(ok/20*100);}
  function personalDc(room,event){const chapterDc=[-2,0,2][Math.max(0,Math.min(2,room.areaIndex||0))]||0;return Math.max(8,Math.round(11+Number(event.difficulty||0)+Number(room.exploration?.danger||0)*.7+chapterDc));}
  function apply(room){const event=room?.currentEvent;if(!event||event.scope!=='personal'||room.eventResult)return;const player=room.players.find(p=>p.id===state.selfId&&p.connected&&p.hp>0);if(!player)return;const dc=personalDc(room,event);requestAnimationFrame(()=>document.querySelectorAll('#eventOptions [data-option]').forEach(btn=>{const option=event.options.find(o=>o.id===btn.dataset.option);if(!option)return;const mod=Math.round((playerStat(player,option.stat)+Number(option.bonus||0))/2),chance=successChance(mod,dc);let el=btn.querySelector('.success-range');if(!el){el=document.createElement('div');el.className='success-range';btn.appendChild(el);}el.innerHTML=`個人成功率 <strong>${chance}%</strong>`;}));}
  socket.on('room:update',apply);requestAnimationFrame(()=>state?.room&&apply(state.room));
})();
