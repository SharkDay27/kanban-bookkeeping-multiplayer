/* Heavier per-type hit cinematics, three variants each, picked at random per hit:
   gun   – the target panel as a pane of glass: shot, cracks spread from the hole, it shatters and reforms
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

 // ---- Gun: the target panel is a pane of glass -------------------------------------------
 // Each shot punches a hole, cracks grow outward from it, then the pane shatters into falling shards and reforms.
 let crackId=0;
 const f1=v=>v.toFixed(1);
 // Fracture around (x,y) in panel coordinates. Every path draws itself in after `base` ms, outer parts later.
 function crack(x,y,size,base=0){
  const id='gc'+(++crackId),hole=Math.max(3,size*rand(.04,.055)),crush=hole*rand(2.6,3.3),rays=Math.round(rand(14,20)),grow=320;
  const seg=(x1,y1,x2,y2,w,o,t)=>`<path pathLength="1" style="animation-delay:${Math.round(base+t*grow)}ms" d="M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}" stroke-width="${w.toFixed(2)}" stroke-opacity="${o.toFixed(2)}"/>`;
  let dark='',light='',fine='',arcs='';const rayData=[];const a0=rand(0,Math.PI*2);
  for(let i=0;i<rays;i++){
   const ang=a0+Math.PI*2*i/rays+rand(-.12,.12),len=size*(Math.random()<.3?rand(.2,.45):rand(.55,1.2)),steps=7;let px=x+Math.cos(ang)*hole*1.1,py=y+Math.sin(ang)*hole*1.1,dir=ang;const line=[[px,py]];
   for(let k=1;k<=steps;k++){dir+=rand(-.07,.07);const step=(len-hole)/steps,nx=px+Math.cos(dir)*step,ny=py+Math.sin(dir)*step,t=k/steps,w=1.2*(1-t)+.3;dark+=seg(px,py,nx,ny,w,.85-t*.35,t);if(k<=5)light+=seg(px+.55,py+.55,nx+.55,ny+.55,w*.55,.9-t*.4,t);
    if(k>=2&&k<=5&&Math.random()<.32){let bx=nx,by=ny,bd=dir+(Math.random()<.5?-1:1)*rand(.3,.75);const bl=len*rand(.08,.22);for(let b=1;b<=3;b++){const ex=bx+Math.cos(bd)*bl/3,ey=by+Math.sin(bd)*bl/3;dark+=seg(bx,by,ex,ey,.42-b*.05,.6,t+b*.05);bx=ex;by=ey;bd+=rand(-.1,.1);}}
    px=nx;py=ny;line.push([px,py]);}
   rayData.push({ang,len,line});}
  for(let i=0;i<40;i++){const t=rand(0,Math.PI*2),r1=hole*rand(1.05,1.4),r2=crush*rand(.7,1.15);fine+=seg(x+Math.cos(t)*r1,y+Math.sin(t)*r1,x+Math.cos(t)*r2,y+Math.sin(t)*r2,.35,.5,0);}
  for(const f of [.12,.2,.3,.43,.6,.8]){const R=size*f*rand(.9,1.1);for(let i=0;i<rayData.length;i++){const p=rayData[i],q=rayData[(i+1)%rayData.length];if(p.len<R*1.05||q.len<R*1.05||Math.random()<.28)continue;const at=(d,r)=>d.line[Math.min(d.line.length-1,Math.max(1,Math.round((r-hole)/(d.len-hole)*(d.line.length-1))))],A=at(p,R*rand(.92,1.08)),B=at(q,R*rand(.92,1.08)),mx=(A[0]+B[0])/2,my=(A[1]+B[1])/2,cx=x+(mx-x)*rand(.86,.95),cy=y+(my-y)*rand(.86,.95);arcs+=`<path pathLength="1" style="animation-delay:${Math.round(base+(f+.15)*grow)}ms" d="M${f1(A[0])} ${f1(A[1])}Q${f1(cx)} ${f1(cy)} ${f1(B[0])} ${f1(B[1])}" stroke-width="${(.75-f*.4).toFixed(2)}" stroke-opacity="${(.7-f*.3).toFixed(2)}"/>`;}}
  return {rays:rayData.map(r=>r.ang),svg:`<g class="glass-hit" style="animation-delay:${Math.round(base)}ms"><defs><radialGradient id="${id}"><stop offset="0" stop-color="#0d0d10"/><stop offset=".26" stop-color="#1c1c21"/><stop offset=".3" stop-color="#f7f9fa" stop-opacity=".95"/><stop offset=".55" stop-color="#e3e8eb" stop-opacity=".75"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>`+
   `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(crush*1.25)}" fill="url(#${id})"/><g class="glass-fine">${fine}</g><g class="glass-arcs">${arcs}</g><g class="glass-light">${light}</g><g class="glass-crack">${dark}</g><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(hole*.9)}" class="glass-hole"/><circle cx="${f1(x-hole*.3)}" cy="${f1(y-hole*.35)}" r="${f1(hole*.25)}" class="glass-glint"/></g>`};
 }
 // A copy of the panel used for shards and slices, stripped of ids and live hooks.
 function panelCopy(target,r){const copy=target.cloneNode(true);copy.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));copy.removeAttribute('id');copy.removeAttribute('data-combat-target');copy.removeAttribute('data-player-id');copy.querySelectorAll('[data-combat-target],[data-player-id],.combat-float,.battle-effect').forEach(e=>e.remove());copy.style.cssText+=`;position:absolute;inset:0;margin:0;width:${r.width}px;height:${r.height}px;box-sizing:border-box;animation:none;transform:none;visibility:visible`;return copy;}
 // Shards are wedges between fracture rays and rings around the main hole, so the break follows the cracks.
 function shatter(wrap,target,r,hx,hy,angles,power01){const copy=panelCopy(target,r),far=Math.hypot(r.width,r.height)*2,rings=[0,Math.min(r.width,r.height)*rand(.12,.18),Math.min(r.width,r.height)*rand(.32,.42),Math.max(r.width,r.height)*rand(.55,.7),far],sorted=[...angles].map(a=>(a%(Math.PI*2)+Math.PI*2)%(Math.PI*2)).sort((a,b)=>a-b);
  const use=sorted.filter((_,i)=>i%2===0);if(use.length<5)use.push(...sorted.slice(0,5-use.length));
  for(let ri=0;ri<rings.length-1;ri++)for(let i=0;i<use.length;i++){const a1=use[i],a2=use[(i+1)%use.length]+(i===use.length-1?Math.PI*2:0),R1=rings[ri],R2=rings[ri+1],pt=(a,R)=>[hx+Math.cos(a)*R,hy+Math.sin(a)*R],poly=ri===0?[[hx,hy],pt(a1,R2),pt((a1+a2)/2,R2*rand(.92,1.05)),pt(a2,R2)]:[pt(a1,R1),pt(a1,R2),pt((a1+a2)/2,R2*rand(.92,1.05)),pt(a2,R2),pt(a2,R1)];
   const shard=document.createElement('div');shard.className='glass-shard';shard.style.clipPath=`polygon(${poly.map(([a,b])=>f1(a)+'px '+f1(b)+'px').join(',')})`;const mid=(a1+a2)/2,push=(1-ri/rings.length)*rand(60,140)*(1+power01)+rand(10,40);shard.style.setProperty('--dx',f1(Math.cos(mid)*push)+'px');shard.style.setProperty('--dy',f1(Math.sin(mid)*push*.6+rand(80,180))+'px');shard.style.setProperty('--rot',f1(rand(-70,70))+'deg');shard.style.setProperty('--d',Math.round(ri*35+rand(0,40))+'ms');shard.appendChild(copy.cloneNode(true));wrap.appendChild(shard);}
 }
 function gun(target,power=0,variant=pick(['single','burst','spray'])){const r=box(target);if(still()||!r)return 0;const power01=Math.min(1,Number(power||0)/30),size=Math.max(r.width,r.height)*rand(.55,.75),holes=[];
  if(variant==='single')holes.push([r.width*rand(.35,.65),r.height*rand(.35,.65),size*1.1,0]);
  else if(variant==='burst'){const cx=r.width*rand(.35,.65),cy=r.height*rand(.35,.65);for(let i=0;i<3;i++)holes.push([cx+rand(-.18,.18)*r.width,cy+rand(-.22,.22)*r.height,size*.75,i*120]);}
  else{const dir=Math.random()<.5,y0=r.height*rand(.3,.7);for(let i=0;i<4;i++){const t=(i+.5)/4;holes.push([r.width*(dir?t:1-t)+rand(-8,8),y0+rand(-.15,.15)*r.height,size*.6,i*90]);}}
  const wrap=document.createElement('div');wrap.className='glass-break';wrap.setAttribute('aria-hidden','true');wrap.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  const pane=document.createElement('div');pane.className='glass-pane';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);svg.setAttribute('width',r.width);svg.setAttribute('height',r.height);let main=null;
  holes.forEach(([x,y,sz,delay],i)=>{const c=crack(x,y,sz,delay);svg.insertAdjacentHTML('beforeend',c.svg);if(i===Math.floor(holes.length/2))main={x,y,rays:c.rays};if(i)setTimeout(()=>sound('gun'),delay);});
  pane.appendChild(svg);wrap.appendChild(pane);document.body.appendChild(wrap);
  const lastShot=holes[holes.length-1][3],breakAt=lastShot+560,vis=target.style.visibility;
  setTimeout(()=>{if(!wrap.isConnected)return;sound('shieldBreak');target.style.visibility='hidden';pane.classList.add('broken');shatter(wrap,target,r,main.x,main.y,main.rays,power01);},breakAt);
  setTimeout(()=>{wrap.remove();target.style.visibility=vis;target.classList.remove('shred-return');void target.offsetWidth;target.classList.add('shred-return');setTimeout(()=>target.classList.remove('shred-return'),420);},breakAt+900);
  return breakAt+900;
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
 function shred(target,power=0){const r=box(target);if(still()||!r)return 0;const cols=3,rows=3,j=(v,amt)=>Math.max(0,Math.min(100,v+rand(-amt,amt))),grid=[];
  for(let y=0;y<=rows;y++){grid.push([]);for(let x=0;x<=cols;x++){const edgeX=x===0||x===cols,edgeY=y===0||y===rows;grid[y].push([edgeX?x/cols*100:j(x/cols*100,9),edgeY?y/rows*100:j(y/rows*100,11)]);}}
  const wrap=document.createElement('div');wrap.className='shred';wrap.setAttribute('aria-hidden','true');wrap.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  for(let i=0;i<4;i++){const line=document.createElement('i');line.className='shred-line';line.style.setProperty('--a',rand(-60,60)+'deg');line.style.setProperty('--y',rand(20,80)+'%');line.style.setProperty('--d',i*55+'ms');wrap.appendChild(line);}
  const copy=panelCopy(target,r);
  const power01=Math.min(1,Number(power||0)/30);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const p=[grid[y][x],grid[y][x+1],grid[y+1][x+1],grid[y+1][x]],piece=document.createElement('div');piece.className='shred-piece';piece.style.clipPath=`polygon(${p.map(([a,b])=>a+'% '+b+'%').join(',')})`;const cx=(x+.5)/cols-.5,cy=(y+.5)/rows-.5;piece.style.setProperty('--dx',(cx*rand(120,220)*(1+power01)+rand(-20,20))+'px');piece.style.setProperty('--dy',(cy*rand(80,160)*(1+power01)+rand(10,60))+'px');piece.style.setProperty('--rot',rand(-40,40)+'deg');piece.appendChild(copy.cloneNode(true));wrap.appendChild(piece);}
  document.body.appendChild(wrap);const vis=target.style.visibility;target.style.visibility='hidden';
  setTimeout(()=>{wrap.remove();target.style.visibility=vis;target.classList.remove('shred-return');void target.offsetWidth;target.classList.add('shred-return');setTimeout(()=>target.classList.remove('shred-return'),420);},1050);return 1050;
 }

 window.KBMStrikes={gun,blunt,shred};
})();
