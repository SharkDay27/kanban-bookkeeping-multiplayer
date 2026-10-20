/* Heavier per-type hit cinematics, three variants each, picked at random per hit:
   gun   – an unseen bullet's wake and shock punch through the panel, which shatters from that point and reforms
           (one heavy shot, a tight burst, or a row of shots across it)
   blunt – the target panel crushed flat from above, knocked off the side, or driven in so it dents
   slash – the target panel diced into pieces (the full-screen diagonal and vertical cuts live in combat-vfx). */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const still=()=>reduced.matches||document.hidden;
 const pick=list=>list[Math.floor(Math.random()*list.length)];
 const rand=(a,b)=>a+Math.random()*(b-a);
 const box=target=>{const r=target?.getBoundingClientRect?.();return r&&r.height?r:null;};
 const sound=name=>{try{window.KBMCombatSounds?.[name]?.();}catch{}};

 // ---- Gun: an unseen bullet tears through the panel, which then shatters from that point ---------
 // No bullet is drawn: only a heat-haze wake along its path and a lens-like shock where it punches through.
 const f1=v=>v.toFixed(1);
 function bulletWake(r,x,y){const px=r.left+x,py=r.top+y,from=Math.random()<.5?-1:1,len=Math.hypot(innerWidth,innerHeight),ang=rand(-.35,.35)+(from<0?0:Math.PI);
  const wake=document.createElement('div');wake.className='bullet-wake';wake.setAttribute('aria-hidden','true');wake.style.left=px+'px';wake.style.top=py+'px';wake.style.width=len+'px';wake.style.transform=`rotate(${ang}rad)`;document.body.appendChild(wake);setTimeout(()=>wake.remove(),420);
  const shock=document.createElement('div');shock.className='bullet-shock';shock.setAttribute('aria-hidden','true');shock.style.left=px+'px';shock.style.top=py+'px';shock.style.setProperty('--size',Math.max(60,Math.min(140,r.height*.9))+'px');shock.innerHTML='<i></i><i></i><i></i><b></b>';document.body.appendChild(shock);setTimeout(()=>shock.remove(),700);}
 // A copy of the panel used for shards and slices, stripped of ids and live hooks.
 function panelCopy(target,r){const copy=target.cloneNode(true);copy.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));copy.removeAttribute('id');copy.removeAttribute('data-combat-target');copy.removeAttribute('data-player-id');copy.querySelectorAll('[data-combat-target],[data-player-id],.combat-float,.battle-effect').forEach(e=>e.remove());copy.style.cssText+=`;position:absolute;inset:0;margin:0;width:${r.width}px;height:${r.height}px;box-sizing:border-box;animation:none;transform:none;visibility:visible`;return copy;}
 // Shards are wedges between rays and rings around the impact point, so the pane breaks outward from it.
 function shatter(wrap,target,r,hx,hy,angles,power01){const copy=panelCopy(target,r),far=Math.hypot(r.width,r.height)*2,rings=[0,Math.min(r.width,r.height)*rand(.12,.18),Math.min(r.width,r.height)*rand(.32,.42),Math.max(r.width,r.height)*rand(.55,.7),far],sorted=[...angles].map(a=>(a%(Math.PI*2)+Math.PI*2)%(Math.PI*2)).sort((a,b)=>a-b);
  const use=sorted.filter((_,i)=>i%2===0);if(use.length<5)use.push(...sorted.slice(0,5-use.length));
  for(let ri=0;ri<rings.length-1;ri++)for(let i=0;i<use.length;i++){const a1=use[i],a2=use[(i+1)%use.length]+(i===use.length-1?Math.PI*2:0),R1=rings[ri],R2=rings[ri+1],pt=(a,R)=>[hx+Math.cos(a)*R,hy+Math.sin(a)*R],poly=ri===0?[[hx,hy],pt(a1,R2),pt((a1+a2)/2,R2*rand(.92,1.05)),pt(a2,R2)]:[pt(a1,R1),pt(a1,R2),pt((a1+a2)/2,R2*rand(.92,1.05)),pt(a2,R2),pt(a2,R1)];
   const shard=document.createElement('div');shard.className='glass-shard';shard.style.clipPath=`polygon(${poly.map(([a,b])=>f1(a)+'px '+f1(b)+'px').join(',')})`;const mid=(a1+a2)/2,push=(1-ri/rings.length)*rand(60,140)*(1+power01)+rand(10,40);shard.style.setProperty('--dx',f1(Math.cos(mid)*push)+'px');shard.style.setProperty('--dy',f1(Math.sin(mid)*push*.6+rand(80,180))+'px');shard.style.setProperty('--rot',f1(rand(-70,70))+'deg');shard.style.setProperty('--d',Math.round(ri*35+rand(0,40))+'ms');shard.appendChild(copy.cloneNode(true));wrap.appendChild(shard);}
 }
 function gun(target,power=0,variant=pick(['single','burst','spray'])){const r=box(target);if(still()||!r)return 0;const power01=Math.min(1,Number(power||0)/30),holes=[];
  if(variant==='single')holes.push([r.width*rand(.35,.65),r.height*rand(.35,.65),0]);
  else if(variant==='burst'){const cx=r.width*rand(.35,.65),cy=r.height*rand(.35,.65);for(let i=0;i<3;i++)holes.push([cx+rand(-.18,.18)*r.width,cy+rand(-.22,.22)*r.height,i*120]);}
  else{const dir=Math.random()<.5,y0=r.height*rand(.3,.7);for(let i=0;i<4;i++){const t=(i+.5)/4;holes.push([r.width*(dir?t:1-t)+rand(-8,8),y0+rand(-.15,.15)*r.height,i*90]);}}
  holes.forEach(([x,y,delay],i)=>setTimeout(()=>{bulletWake(r,x,y);if(i)sound('gun');},delay));
  const [mx,my]=holes[Math.floor(holes.length/2)],angles=Array.from({length:12},(_,i)=>i/12*Math.PI*2+rand(-.18,.18)),lastShot=holes[holes.length-1][2],breakAt=lastShot+240,vis=target.style.visibility;
  const wrap=document.createElement('div');wrap.className='glass-break';wrap.setAttribute('aria-hidden','true');wrap.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  setTimeout(()=>{if(!target.isConnected)return;document.body.appendChild(wrap);sound('shieldBreak');target.style.visibility='hidden';shatter(wrap,target,r,mx,my,angles,power01);},breakAt);
  setTimeout(()=>{wrap.remove();target.style.visibility=vis;target.classList.remove('shred-return');void target.offsetWidth;target.classList.add('shred-return');setTimeout(()=>target.classList.remove('shred-return'),420);},breakAt+950);
  return breakAt+950;
 }

 // ---- Blunt: the target panel treated as a physical object ---------------------------------
 // No props: the force reads from streaks, dust, shockwaves and how the panel itself deforms.
 function layer(r,cls,ms){const el=document.createElement('div');el.className='blunt-fx '+cls;el.setAttribute('aria-hidden','true');el.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;document.body.appendChild(el);setTimeout(()=>el.remove(),ms);return el;}
 function lines(el,n,make){for(let i=0;i<n;i++){const l=document.createElement('i');make(l,i);el.appendChild(l);}}
 function hit(target,cls,ms){target.classList.remove('blunt-smash','blunt-swat','blunt-dent');void target.offsetWidth;target.classList.add(cls);setTimeout(()=>target.classList.remove(cls),ms);}
 function blunt(target,heavy=.5,variant=pick(['smash','swat','dent'])){const r=box(target);if(still()||!r)return 0;target.style.setProperty('--dent',(.8-heavy*.12).toFixed(2));
  if(variant==='smash'){// A crushing weight from above: streaks drop onto the top edge, the panel flattens, dust bursts out at the base.
   const fx=layer(r,'fx-smash',900);lines(fx,9,(l,i)=>{l.className='drop-streak';l.style.left=(6+i*11+rand(-3,3))+'%';l.style.setProperty('--d',rand(0,60)+'ms');l.style.setProperty('--len',rand(40,90)+'%');});lines(fx,10,(l,i)=>{l.className='dust';const side=i%2?1:-1;l.style.left=(side>0?rand(70,100):rand(0,30))+'%';l.style.setProperty('--dx',side*rand(20,70)+'px');l.style.setProperty('--dy',-rand(6,26)+'px');l.style.setProperty('--s',rand(.6,1.4));});
   setTimeout(()=>window.KBMCombatVFX?.impactFrame?.(target,heavy),150);hit(target,'blunt-smash',760);return 760;}
  if(variant==='swat'){// A sideways blow: horizontal motion streaks across the panel as it is knocked off screen and slides back.
   const fx=layer(r,'fx-swat',900);lines(fx,12,(l,i)=>{l.className='side-streak';l.style.top=(4+i*8+rand(-2,2))+'%';l.style.setProperty('--d',rand(0,90)+'ms');l.style.setProperty('--len',rand(35,95)+'%');});hit(target,'blunt-swat',900);return 900;}
  // A blow straight into the centre: shockwave rings, crater shading and the panel pushed back into the screen.
  const fx=layer(r,'fx-dent',820);lines(fx,3,(l,i)=>{l.className='dent-ring';l.style.setProperty('--d',i*90+'ms');});const crater=document.createElement('b');crater.className='dent-crater';fx.appendChild(crater);
  setTimeout(()=>window.KBMCombatVFX?.impactFrame?.(target,heavy),110);hit(target,'blunt-dent',760);return 760;
 }

 // ---- Slash: dice the target panel into pieces that fly apart ------------------------------
 // angle (deg) is the main cut through the centre; the other cuts and the pieces' spread follow it.
 function shred(target,power=0,angle=rand(-40,40)){const r=box(target);if(still()||!r)return 0;const cols=3,rows=3,j=(v,amt)=>Math.max(0,Math.min(100,v+rand(-amt,amt))),grid=[];
  for(let y=0;y<=rows;y++){grid.push([]);for(let x=0;x<=cols;x++){const edgeX=x===0||x===cols,edgeY=y===0||y===rows;grid[y].push([edgeX?x/cols*100:j(x/cols*100,9),edgeY?y/rows*100:j(y/rows*100,11)]);}}
  const wrap=document.createElement('div');wrap.className='shred';wrap.setAttribute('aria-hidden','true');wrap.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  for(let i=0;i<4;i++){const line=document.createElement('i');line.className='shred-line';line.style.setProperty('--a',(i?angle+rand(-55,55):angle)+'deg');line.style.setProperty('--y',(i?rand(20,80):50)+'%');line.style.setProperty('--d',i*55+'ms');wrap.appendChild(line);}
  const copy=panelCopy(target,r);
  const power01=Math.min(1,Number(power||0)/30);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const p=[grid[y][x],grid[y][x+1],grid[y+1][x+1],grid[y+1][x]],piece=document.createElement('div');piece.className='shred-piece';piece.style.clipPath=`polygon(${p.map(([a,b])=>a+'% '+b+'%').join(',')})`;const cx=(x+.5)/cols-.5,cy=(y+.5)/rows-.5;piece.style.setProperty('--dx',(cx*rand(120,220)*(1+power01)+rand(-20,20))+'px');piece.style.setProperty('--dy',(cy*rand(80,160)*(1+power01)+rand(10,60))+'px');piece.style.setProperty('--rot',rand(-40,40)+'deg');piece.appendChild(copy.cloneNode(true));wrap.appendChild(piece);}
  document.body.appendChild(wrap);const vis=target.style.visibility;target.style.visibility='hidden';
  setTimeout(()=>{wrap.remove();target.style.visibility=vis;target.classList.remove('shred-return');void target.offsetWidth;target.classList.add('shred-return');setTimeout(()=>target.classList.remove('shred-return'),420);},1050);return 1050;
 }

 // ---- Slash impact: like the gun, the force shows through the air rather than as a drawn blade ---------
 // A clear crescent of compressed air sweeps across the target, a pressure line flares along the cut, and the air ripples.
 // opts.angle (deg) and opts.x/y/w place the wake on the cut line so the air blade follows the same direction as the cut.
 function slashWake(target,power=0,opts={}){const r=box(target);if(still()||!r)return 0;const cx=opts.x??r.left+r.width/2,cy=opts.y??r.top+r.height/2,w=opts.w??Math.min(innerWidth*1.1,Math.max(220,r.width*1.4)),ang=opts.angle??rand(-38,38),power01=Math.min(1,Number(power||0)/30);
  const el=document.createElement('div');el.className='slash-wake';el.setAttribute('aria-hidden','true');el.style.cssText=`left:${cx}px;top:${cy}px;--w:${w}px;--h:${Math.round(Math.min(w*.42,150))}px;--ang:${ang.toFixed(1)}deg;--thick:${(1+power01*.6).toFixed(2)}`;el.innerHTML='<i class="slash-crescent"></i><i class="slash-pressure"></i><i class="slash-ripple"></i><i class="slash-ripple"></i>';document.body.appendChild(el);setTimeout(()=>el.remove(),720);return 720;}

 window.KBMStrikes={gun,blunt,shred,slashWake};
})();
