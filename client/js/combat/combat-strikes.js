/* Heavier per-type hit cinematics, three variants each, picked at random per hit:
   gun   – shots cracking the screen like glass (one heavy shot, a tight burst, a spray across the screen)
   blunt – the target panel smashed flat from above, swatted off the side, or punched in so it dents
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
 // One impact: an irregular hole with a chipped white rim, radial cracks that wander, and a spider-web of ring cracks.
 function crack(x,y,size){
  const rays=Math.round(rand(9,15)),hole=size*rand(.07,.1),ringR=[.28,.5,.74].map(f=>size*f*rand(.9,1.1)),angles=[];let a=rand(0,Math.PI*2);
  for(let i=0;i<rays;i++){angles.push(a);a+=Math.PI*2/rays*rand(.6,1.4);}
  const rayPts=angles.map(ang=>{const len=size*rand(.55,1.35),steps=4,line=[];for(let s=0;s<=steps;s++){const r=hole*1.2+(len-hole*1.2)*s/steps,j=s?rand(-.09,.09):0;line.push([x+Math.cos(ang+j)*r,y+Math.sin(ang+j)*r]);}return {ang,len,line};});
  let dark='',light='';
  for(const r of rayPts){dark+=`<polyline points="${pts(r.line)}"/>`;light+=`<polyline points="${pts(r.line.map(([px,py])=>[px+.9,py+.9]))}"/>`;}
  for(const R of ringR)for(let i=0;i<rayPts.length;i++){const p=rayPts[i],q=rayPts[(i+1)%rayPts.length];if(p.len<R||q.len<R||Math.random()<.2)continue;const r1=R*rand(.88,1.12),r2=R*rand(.88,1.12),mid=(p.ang+q.ang+(q.ang<p.ang?Math.PI*2:0))/2,rm=(r1+r2)/2*rand(.86,.98),seg=[[x+Math.cos(p.ang)*r1,y+Math.sin(p.ang)*r1],[x+Math.cos(mid)*rm,y+Math.sin(mid)*rm],[x+Math.cos(q.ang)*r2,y+Math.sin(q.ang)*r2]];dark+=`<polyline points="${pts(seg)}"/>`;light+=`<polyline points="${pts(seg.map(([px,py])=>[px+.8,py+.8]))}"/>`;}
  const ring=(r,j)=>pts(Array.from({length:11},(_,i)=>{const t=i/11*Math.PI*2;const rr=r*rand(1-j,1+j);return [x+Math.cos(t)*rr,y+Math.sin(t)*rr];}));
  let chips='';for(let i=0;i<7;i++){const t=rand(0,Math.PI*2),r=hole*rand(1.6,3),c=[x+Math.cos(t)*r,y+Math.sin(t)*r],s=rand(1.5,3.5);chips+=`<polygon points="${pts([[c[0],c[1]-s],[c[0]+s,c[1]+s*.6],[c[0]-s*.7,c[1]+s*.4]])}"/>`;}
  return `<g class="glass-hit"><circle cx="${x}" cy="${y}" r="${size*.24}" class="glass-frost"/><g class="glass-crack-light">${light}</g><g class="glass-crack">${dark}</g><polygon class="glass-rim" points="${ring(hole*1.55,.22)}"/><g class="glass-chips">${chips}</g><polygon class="glass-hole" points="${ring(hole,.25)}"/><circle cx="${x-hole*.35}" cy="${y-hole*.35}" r="${hole*.22}" class="glass-glint"/></g>`;
 }
 function shoot(x,y,size,withSound){const layer=glassLayer();layer.insertAdjacentHTML('beforeend',crack(x,y,size));const g=layer.lastElementChild;g.style.transformOrigin=`${x}px ${y}px`;if(withSound)sound('gun');}
 function gun(target,power=0,variant=pick(['single','burst','spray'])){if(still())return 0;const r=box(target),cx=r?r.left+r.width/2:innerWidth/2,cy=r?r.top+r.height/2:innerHeight/2,big=Math.min(innerWidth,innerHeight),heavy=Math.min(1,Number(power||0)/30);
  if(variant==='single'){shoot(cx+rand(-12,12),cy+rand(-8,8),big*rand(.38,.46)*(1+heavy*.25),false);return 600;}
  if(variant==='burst'){const n=3+Math.round(heavy);for(let i=0;i<n;i++)setTimeout(()=>shoot(cx+rand(-.28,.28)*(r?.width||160),cy+rand(-.3,.3)*(r?.height||90),big*rand(.17,.24),i>0),i*95);return 300+n*95;}
  const n=6,y0=cy+rand(-30,30),dir=Math.random()<.5?1:-1;for(let i=0;i<n;i++)setTimeout(()=>{const t=(i+.5)/n,x=dir>0?innerWidth*t:innerWidth*(1-t);shoot(x+rand(-14,14),y0+rand(-36,36),big*rand(.13,.19),i>0);},i*75);return 300+n*75;
 }

 // ---- Blunt: the target panel treated as a physical object ---------------------------------
 const FIST='<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="#111114" stroke-width="3" stroke-linejoin="round"><path d="M22 40c0-8 6-12 12-12h36c8 0 12 6 12 13v24c0 14-10 23-24 23H40C29 88 22 80 22 70Z" fill="#2c2c32"/><g fill="#3a3a42"><rect x="24" y="18" width="15" height="24" rx="7"/><rect x="38" y="14" width="15" height="28" rx="7"/><rect x="52" y="15" width="15" height="27" rx="7"/><rect x="66" y="20" width="14" height="24" rx="7"/></g><path d="M22 56c-6-2-10 2-9 8 1 7 8 10 16 9" fill="#2c2c32"/></g><g fill="#6a6a74" opacity=".7"><rect x="28" y="21" width="5" height="6" rx="2"/><rect x="42" y="17" width="5" height="6" rx="2"/><rect x="56" y="18" width="5" height="6" rx="2"/><rect x="69" y="23" width="5" height="6" rx="2"/></g></svg>';
 function prop(r,cls,size){const el=document.createElement('div');el.className='blunt-prop '+cls;el.setAttribute('aria-hidden','true');el.innerHTML=FIST;el.style.left=(r.left+r.width/2)+'px';el.style.top=(r.top+r.height/2)+'px';el.style.setProperty('--size',size+'px');el.style.setProperty('--h',r.height+'px');el.style.setProperty('--w',r.width+'px');document.body.appendChild(el);setTimeout(()=>el.remove(),900);}
 function hit(target,cls,ms){target.classList.remove('blunt-smash','blunt-swat','blunt-dent');void target.offsetWidth;target.classList.add(cls);setTimeout(()=>target.classList.remove(cls),ms);}
 function blunt(target,heavy=.5,variant=pick(['smash','swat','dent'])){const r=box(target);if(still()||!r)return 0;const size=Math.max(70,Math.min(160,r.height*1.1));target.style.setProperty('--dent',(.78-heavy*.12).toFixed(2));
  if(variant==='smash'){prop(r,'prop-smash',size);setTimeout(()=>window.KBMCombatVFX?.impactFrame?.(target,heavy),120);hit(target,'blunt-smash',760);return 760;}
  if(variant==='swat'){prop(r,'prop-swat',size);hit(target,'blunt-swat',900);return 900;}
  prop(r,'prop-dent',size);setTimeout(()=>window.KBMCombatVFX?.impactFrame?.(target,heavy),110);hit(target,'blunt-dent',760);return 760;
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
