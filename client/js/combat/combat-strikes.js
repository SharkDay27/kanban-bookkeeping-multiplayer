/* Heavier per-type hit cinematics, three variants each, picked at random per hit:
   gun   – shots cracking the screen like glass (one heavy shot, a tight burst, a spray across the screen)
   blunt – the target panel crushed flat from above, knocked off the side, or driven in so it dents
   slash – the target panel diced into pieces (the full-screen diagonal and vertical cuts live in combat-vfx). */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const still=()=>reduced.matches||document.hidden;
 const pick=list=>list[Math.floor(Math.random()*list.length)];
 const rand=(a,b)=>a+Math.random()*(b-a);
 const box=target=>{const r=target?.getBoundingClientRect?.();return r&&r.height?r:null;};
 const sound=name=>{try{window.KBMCombatSounds?.[name]?.();}catch{}};

 // ---- Gun: procedurally cracked glass ------------------------------------------------------
 let glass=null,glassTimer=null;
 function glassLayer(){if(!glass||!glass.isConnected){glass=document.createElementNS('http://www.w3.org/2000/svg','svg');glass.setAttribute('class','glass-shots');glass.setAttribute('aria-hidden','true');document.body.appendChild(glass);}glass.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);glass.setAttribute('width',innerWidth);glass.setAttribute('height',innerHeight);clearTimeout(glassTimer);glass.classList.remove('fading');glassTimer=setTimeout(()=>{glass?.classList.add('fading');glassTimer=setTimeout(()=>{glass?.remove();glass=null;},500);},1500);return glass;}
 const pts=list=>list.map(([x,y])=>x.toFixed(1)+','+y.toFixed(1)).join(' ');
 // One impact on glass: a small dark hole inside a frosted crush cone, many hairline radial cracks that taper
 // and fork as they run outward, and concave spider-web arcs between neighbouring cracks.
 let crackId=0;
 const f1=v=>v.toFixed(1);
 function crack(x,y,size){
  const id='gc'+(++crackId),hole=size*rand(.032,.045),crush=hole*rand(2.7,3.5),rays=Math.round(rand(16,24));
  const seg=(x1,y1,x2,y2,w,o)=>`<path d="M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}" stroke-width="${w.toFixed(2)}" stroke-opacity="${o.toFixed(2)}"/>`;
  let dark='',light='',fine='',arcs='';const rayData=[];let a0=rand(0,Math.PI*2);
  for(let i=0;i<rays;i++){
   const ang=a0+Math.PI*2*i/rays+rand(-.12,.12),len=size*(Math.random()<.3?rand(.18,.4):rand(.5,1.15)),steps=7;let px=x+Math.cos(ang)*hole*1.1,py=y+Math.sin(ang)*hole*1.1,dir=ang;const line=[[px,py]];
   for(let k=1;k<=steps;k++){dir+=rand(-.07,.07);const step=(len-hole)/steps,nx=px+Math.cos(dir)*step,ny=py+Math.sin(dir)*step,t=k/steps,w=1.25*(1-t)+.28;dark+=seg(px,py,nx,ny,w,.82-t*.35);if(k<=5)light+=seg(px+.55,py+.55,nx+.55,ny+.55,w*.55,.9-t*.4);
    if(k>=2&&k<=5&&Math.random()<.32){let bx=nx,by=ny,bd=dir+(Math.random()<.5?-1:1)*rand(.3,.75);const bl=len*rand(.08,.22);for(let b=1;b<=3;b++){const ex=bx+Math.cos(bd)*bl/3,ey=by+Math.sin(bd)*bl/3;dark+=seg(bx,by,ex,ey,.42-b*.05,.6);bx=ex;by=ey;bd+=rand(-.1,.1);}}
    px=nx;py=ny;line.push([px,py]);}
   rayData.push({ang,len,line});}
  // Crushed cone: a ring of very short hairlines around the hole.
  for(let i=0;i<46;i++){const t=rand(0,Math.PI*2),r1=hole*rand(1.05,1.4),r2=crush*rand(.7,1.15);fine+=seg(x+Math.cos(t)*r1,y+Math.sin(t)*r1,x+Math.cos(t+rand(-.05,.05))*r2,y+Math.sin(t+rand(-.05,.05))*r2,.35,.5);}
  // Concave arcs between neighbouring cracks, denser near the centre.
  for(const f of [.11,.17,.25,.35,.48,.63,.8]){const R=size*f*rand(.9,1.1);for(let i=0;i<rayData.length;i++){const p=rayData[i],q=rayData[(i+1)%rayData.length];if(p.len<R*1.05||q.len<R*1.05||Math.random()<.28)continue;const at=(d,r)=>{const idx=Math.min(d.line.length-1,Math.max(1,Math.round((r-hole)/(d.len-hole)*(d.line.length-1))));return d.line[idx];},A=at(p,R*rand(.92,1.08)),B=at(q,R*rand(.92,1.08)),mx=(A[0]+B[0])/2,my=(A[1]+B[1])/2,cx=x+(mx-x)*rand(.86,.95),cy=y+(my-y)*rand(.86,.95);arcs+=`<path d="M${f1(A[0])} ${f1(A[1])}Q${f1(cx)} ${f1(cy)} ${f1(B[0])} ${f1(B[1])}" stroke-width="${(.75-f*.45).toFixed(2)}" stroke-opacity="${(.7-f*.35).toFixed(2)}"/>`;}}
  let glints='';for(let i=0;i<5;i++){const t=rand(0,Math.PI*2),r=crush*rand(1.1,2.2),l=rand(3,7);glints+=seg(x+Math.cos(t)*r,y+Math.sin(t)*r,x+Math.cos(t)*(r+l),y+Math.sin(t)*(r+l),.7,.9);}
  return `<g class="glass-hit"><defs><radialGradient id="${id}"><stop offset="0" stop-color="#0d0d10"/><stop offset=".26" stop-color="#1c1c21"/><stop offset=".3" stop-color="#f7f9fa" stop-opacity=".95"/><stop offset=".55" stop-color="#e3e8eb" stop-opacity=".75"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>`+
   `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(crush*1.25)}" fill="url(#${id})"/><g class="glass-fine">${fine}</g><g class="glass-arcs">${arcs}</g><g class="glass-light">${light}</g><g class="glass-crack">${dark}</g><g class="glass-glints">${glints}</g><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(hole*.9)}" class="glass-hole"/><circle cx="${f1(x-hole*.3)}" cy="${f1(y-hole*.35)}" r="${f1(hole*.25)}" class="glass-glint"/></g>`;
 }
 function shoot(x,y,size,withSound){const layer=glassLayer();layer.insertAdjacentHTML('beforeend',crack(x,y,size));const g=layer.lastElementChild;g.style.transformOrigin=`${x}px ${y}px`;if(withSound)sound('gun');}
 function gun(target,power=0,variant=pick(['single','burst','spray'])){if(still())return 0;const r=box(target),cx=r?r.left+r.width/2:innerWidth/2,cy=r?r.top+r.height/2:innerHeight/2,big=Math.min(innerWidth,innerHeight),heavy=Math.min(1,Number(power||0)/30);
  if(variant==='single'){shoot(cx+rand(-12,12),cy+rand(-8,8),big*rand(.42,.5)*(1+heavy*.2),false);return 600;}
  if(variant==='burst'){const n=3+Math.round(heavy);for(let i=0;i<n;i++)setTimeout(()=>shoot(cx+rand(-.28,.28)*(r?.width||160),cy+rand(-.3,.3)*(r?.height||90),big*rand(.22,.3),i>0),i*95);return 300+n*95;}
  const n=6,y0=cy+rand(-30,30),dir=Math.random()<.5?1:-1;for(let i=0;i<n;i++)setTimeout(()=>{const t=(i+.5)/n,x=dir>0?innerWidth*t:innerWidth*(1-t);shoot(x+rand(-14,14),y0+rand(-36,36),big*rand(.17,.24),i>0);},i*75);return 300+n*75;
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
  const copy=target.cloneNode(true);copy.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));copy.removeAttribute('id');copy.removeAttribute('data-combat-target');copy.removeAttribute('data-player-id');copy.querySelectorAll('[data-combat-target],[data-player-id],.combat-float,.battle-effect').forEach(e=>e.remove());
  const power01=Math.min(1,Number(power||0)/30);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const p=[grid[y][x],grid[y][x+1],grid[y+1][x+1],grid[y+1][x]],piece=document.createElement('div');piece.className='shred-piece';piece.style.clipPath=`polygon(${p.map(([a,b])=>a+'% '+b+'%').join(',')})`;const cx=(x+.5)/cols-.5,cy=(y+.5)/rows-.5;piece.style.setProperty('--dx',(cx*rand(120,220)*(1+power01)+rand(-20,20))+'px');piece.style.setProperty('--dy',(cy*rand(80,160)*(1+power01)+rand(10,60))+'px');piece.style.setProperty('--rot',rand(-40,40)+'deg');const c=copy.cloneNode(true);c.style.cssText+=`;position:absolute;inset:0;margin:0;width:${r.width}px;height:${r.height}px;box-sizing:border-box;animation:none;transform:none`;piece.appendChild(c);wrap.appendChild(piece);}
  document.body.appendChild(wrap);const vis=target.style.visibility;target.style.visibility='hidden';
  setTimeout(()=>{wrap.remove();target.style.visibility=vis;target.classList.remove('shred-return');void target.offsetWidth;target.classList.add('shred-return');setTimeout(()=>target.classList.remove('shred-return'),420);},1050);return 1050;
 }

 window.KBMStrikes={gun,blunt,shred,crack};
})();
