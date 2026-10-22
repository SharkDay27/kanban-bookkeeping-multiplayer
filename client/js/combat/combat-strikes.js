/* Heavier per-type hit cinematics, three variants each, picked at random per hit:
   gun   – an unseen bullet's wake and shock punch through the panel, which shatters from that point and reforms
           (one heavy shot, a tight burst, or a row of shots across it)
   blunt – manga-style ink speed lines and impact bursts: a jab-jab-cross combo, a hook from the side, or an uppercut
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

 // ---- Blunt: manga-style blows, the target panel taking hits like a heavy bag --------------------------------
 // No fist is drawn. Each blow is a band of tapered ink speed lines along its path (straight for jabs, curved for a hook
 // or an uppercut), an ink starburst with radiating impact lines where it lands and a spray of screentone dots blown
 // through. The panel is knocked back along the blow and springs back. Web Animations throughout, self-cleaning.
 const NS='http://www.w3.org/2000/svg';
 function overlay(r,ms){const host=document.createElement('div');host.className='ink-fx';host.setAttribute('aria-hidden','true');host.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  const pad=Math.max(r.width,r.height)*1.2,svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox',`${f1(-pad)} ${f1(-pad)} ${f1(r.width+pad*2)} ${f1(r.height+pad*2)}`);svg.style.cssText=`left:${f1(-pad)}px;top:${f1(-pad)}px;width:${f1(r.width+pad*2)}px;height:${f1(r.height+pad*2)}px`;host.appendChild(svg);
  document.body.appendChild(host);host.animate([{opacity:1},{opacity:1}],{duration:ms}).finished.then(()=>host.remove(),()=>host.remove());return svg;}
 const el=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);parent.appendChild(n);return n;};
 const poly=pts=>pts.map(p=>f1(p[0])+','+f1(p[1])).join(' ');
 // Path helpers: P(t) along a straight line or a quadratic curve, with unit tangent.
 const lineP=(S,E)=>t=>[S[0]+(E[0]-S[0])*t,S[1]+(E[1]-S[1])*t];
 const quadP=(S,C,E)=>t=>{const u=1-t;return [u*u*S[0]+2*u*t*C[0]+t*t*E[0],u*u*S[1]+2*u*t*C[1]+t*t*E[1]];};
 const tangent=(P,t)=>{const a=P(Math.max(0,t-.01)),b=P(Math.min(1,t+.01)),d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [(b[0]-a[0])/d,(b[1]-a[1])/d];};
 // Speed lines: spindle-shaped ink strokes offset across a band around the path, front ends staggered near the contact.
 function speedLines(svg,P,band,count,delay,heavy){const g=el('g',{class:'ink-lines'},svg),[ex,ey]=tangent(P,1);
  for(let k=0;k<count;k++){const o=band*Math.sign(rand(-1,1))*Math.pow(Math.random(),.8),t1=rand(.72,.98)-Math.abs(o)/band*.12,t0=Math.max(0,t1-rand(.3,.75)),wk=rand(.8,2.2)+(1-Math.abs(o)/band)*rand(1,2.6)*heavy,L=[],R=[];
   for(let n=0;n<=12;n++){const u=n/12,t=t0+(t1-t0)*u,[x,y]=P(t),[tx,ty]=tangent(P,t),w=wk*Math.pow(Math.sin(Math.PI*u),.55)/2;L.push([x-ty*(o+w),y+tx*(o+w)]);R.unshift([x-ty*(o-w),y+tx*(o-w)]);}
   const line=el('polygon',{points:poly(L.concat(R)),class:'ink-line'},g),d=delay+rand(0,50),back=rand(26,48);
   line.animate([{transform:`translate(${f1(-ex*back)}px,${f1(-ey*back)}px)`,opacity:0},{transform:'translate(0,0)',opacity:rand(.75,1),offset:.18},{transform:`translate(${f1(ex*6)}px,${f1(ey*6)}px)`,opacity:rand(.6,.9),offset:.55},{transform:`translate(${f1(ex*14)}px,${f1(ey*14)}px)`,opacity:0}],{duration:520,delay:d,easing:'cubic-bezier(.2,.8,.4,1)',fill:'both'});}}
 // Contact, like the reference's misted hit: the struck spot dissolves into a grainy ink mist blown along the blow —
 // a blurred, hazy patch on the panel, a cone of fine screentone grain and soft dark spray clouds drifting through.
 function inkHit(svg,x,y,ux,uy,size,delay){const g=el('g',{class:'ink-hit'},svg),host=svg.parentNode,a0=Math.atan2(uy,ux);
  const fog=document.createElement('i');fog.className='ink-fog';fog.style.cssText=`left:${f1(x)}px;top:${f1(y)}px;--s:${f1(size*1.5)}px`;host.appendChild(fog);
  fog.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.4)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.15},{opacity:.8,offset:.5},{opacity:0,transform:`translate(calc(-50% + ${f1(ux*size*.35)}px),calc(-50% + ${f1(uy*size*.35)}px)) scale(1.3)`}],{duration:760,delay,easing:'cubic-bezier(.2,.7,.4,1)',fill:'both'});
  for(let k=0;k<4;k++){const d=size*rand(.3,1.1),sp=rand(-.5,.5),cx=x+Math.cos(a0+sp)*d*.25,cy=y+Math.sin(a0+sp)*d*.25,cl=el('ellipse',{cx:f1(cx),cy:f1(cy),rx:f1(size*rand(.28,.45)),ry:f1(size*rand(.16,.26)),class:'ink-cloud',transform:`rotate(${f1(a0*57.3)} ${f1(cx)} ${f1(cy)})`},g);
   cl.animate([{opacity:0,transform:`rotate(${f1(a0*57.3)}deg) scale(.5)`},{opacity:rand(.22,.38),offset:.2},{opacity:0,transform:`translate(${f1(Math.cos(a0+sp)*d)}px,${f1(Math.sin(a0+sp)*d)}px) rotate(${f1(a0*57.3)}deg) scale(1.6)`}],{duration:rand(700,900),delay:delay+k*25,easing:'cubic-bezier(.15,.7,.35,1)',fill:'both'});cl.style.transformBox='fill-box';cl.style.transformOrigin='50% 50%';cl.removeAttribute('transform');}
  for(let k=0;k<220;k++){const sp=rand(-.6,.6)*(Math.random()<.85?1:1.8),d=size*Math.pow(Math.random(),.7)*rand(.6,1.9),r0=size*rand(0,.25),px=x+Math.cos(a0+sp+Math.PI/2)*rand(-r0,r0),py=y+Math.sin(a0+sp+Math.PI/2)*rand(-r0,r0);
   el('circle',{cx:f1(px),cy:f1(py),r:f1(rand(.35,1.5)),class:'ink-dot'},g).animate([{opacity:0,transform:'translate(0,0)'},{opacity:rand(.45,.95),offset:.1},{opacity:rand(.3,.6),offset:.55},{opacity:0,transform:`translate(${f1(Math.cos(a0+sp)*d)}px,${f1(Math.sin(a0+sp)*d)}px)`}],{duration:rand(520,860),delay:delay+rand(0,60),easing:'cubic-bezier(.12,.75,.3,1)',fill:'both'});}}
 // Motion streaks across the panel itself, all running along the blow, so the struck panel reads as smeared by speed.
 function panelStreaks(svg,r,ux,uy,delay,count){const g=el('g',{class:'ink-streaks'},svg),W=r.width,H=r.height,L0=Math.hypot(W,H);
  for(let k=0;k<count;k++){const cx=rand(-.05,1.05)*W,cy=rand(0,1)*H,len=L0*rand(.18,.5),w=rand(.6,2.2),hx=ux*len/2,hy=uy*len/2,nx=-uy*w/2,ny=ux*w/2;
   el('polygon',{points:poly([[cx-hx,cy-hy],[cx+nx,cy+ny],[cx+hx,cy+hy],[cx-nx,cy-ny]]),class:'ink-line ink-streak'},g).animate([{opacity:0,transform:`translate(${f1(-ux*30)}px,${f1(-uy*30)}px)`},{opacity:rand(.35,.75),transform:'translate(0,0)',offset:.25},{opacity:0,transform:`translate(${f1(ux*26)}px,${f1(uy*26)}px)`}],{duration:rand(300,420),delay:delay+rand(0,70),easing:'cubic-bezier(.2,.8,.4,1)',fill:'both'});}}
 // The panel takes the blow: it judders strictly back and forth along the blow's line (never sideways), with faint
 // blurred afterimages trailing behind it in the same direction, then settles.
 function knock(target,svg,r,hits,dur){const frames=[{transform:'none',offset:0}],at=(o,d,ux,uy)=>({transform:`translate(${f1(ux*d)}px,${f1(uy*d)}px)`,offset:Math.min(.995,o)});
  for(const [t,ux,uy,force] of hits){const o=t/dur,d=8+force*14;frames.push({transform:'none',offset:o});[[.03,1],[.07,-.45],[.11,.6],[.15,-.25],[.19,.32],[.24,-.1]].forEach(([dt,m])=>frames.push(at(o+dt,d*m,ux,uy)));
   panelStreaks(svg,r,ux,uy,t,Math.round(10+force*10));
   const host=svg.parentNode;for(let g=1;g<=2;g++){const ghost=panelCopy(target,r);ghost.classList.add('ink-ghost');host.appendChild(ghost);ghost.animate([{opacity:0,transform:'none'},{opacity:.32/g,transform:`translate(${f1(ux*d*(1-g*.7))}px,${f1(uy*d*(1-g*.7))}px)`,offset:.2},{opacity:0,transform:`translate(${f1(-ux*d*g*1.4)}px,${f1(-uy*d*g*1.4)}px)`}],{duration:320,delay:t+10,easing:'cubic-bezier(.2,.7,.4,1)',fill:'both'});}}
  frames.push({transform:'none',offset:1});const seen=new Set(),clean=frames.sort((a,b)=>a.offset-b.offset).filter(f=>{if(seen.has(f.offset))return false;seen.add(f.offset);return true;});
  target.animate(clean,{duration:dur,easing:'linear'});}
 function blunt(target,heavy=.5,variant=pick(['combo','hook','uppercut'])){const r=box(target);if(still()||!r)return 0;const W=r.width,H=r.height,size=Math.max(56,Math.min(110,Math.min(W,H)*.7)),dir=Math.random()<.5?1:-1;
  if(variant==='combo'){// Jab, jab, cross: three straight blows driven in from one side.
   const dur=1050,svg=overlay(r,dur+120),hits=[];
   [[.4,.42,0,.55],[.58,.58,200,.6],[.5,.5,410,1]].forEach(([u,v,t,force],k)=>{const x=W*u+rand(-8,8),y=H*v+rand(-6,6),a=(dir>0?Math.PI:0)+rand(-.22,.22),L=W*rand(.95,1.2),S=[x+Math.cos(a)*L,y+Math.sin(a)*L*.6],ux=-Math.cos(a),uy=-Math.sin(a)*.6,n=Math.hypot(ux,uy);
    speedLines(svg,lineP(S,[x,y]),H*(k===2?.42:.3),k===2?34:20,t,force);inkHit(svg,x,y,ux/n,uy/n,size*(k===2?1:.7),t+70);hits.push([t+70,ux/n,uy/n,force]);if(k)setTimeout(()=>sound('blunt'),t+70);});
   knock(target,svg,r,hits,dur);return dur;}
  if(variant==='hook'){// Hook: a wide arc swings round from one side into the near edge.
   const dur=950,svg=overlay(r,dur+120),x=dir>0?W*.2:W*.8,y=H*rand(.4,.55),S=[dir>0?-W*.12:W*1.12,H*1.9],C=[dir>0?-W*.32:W*1.32,-H*.25],P=quadP(S,C,[x,y]),[ux,uy]=tangent(P,1);
   speedLines(svg,P,H*.5,40,0,1);inkHit(svg,x,y,ux,uy,size*1.1,130);knock(target,svg,r,[[130,ux,uy,1.1]],dur);return dur;}
  // Uppercut: rises from below and drives up into the bottom of the panel.
  const dur=950,svg=overlay(r,dur+120),x=W*rand(.4,.6),y=H*.78,S=[x-dir*W*.35,H*2.4],C=[x+dir*W*.25,H*1.5],P=quadP(S,C,[x,y]),[ux,uy]=tangent(P,1);
  speedLines(svg,P,W*.16,36,0,1);inkHit(svg,x,y,ux,uy,size*1.1,130);knock(target,svg,r,[[130,ux,uy,1.1]],dur);return dur;
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
