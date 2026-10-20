/* Status application cinematics: a rotating sigil with the status icon, a particle layer drawn for the
   status family (blood, embers, lightning, water, quake, seal, fear, target lock, toxin, light pillar, drain),
   and a name badge. Laid over the target panel; nothing here changes game state. */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const rand=(a,b)=>a+Math.random()*(b-a);
 const ICON={
  wound:'M5 4l6 9M10 3l5 9M15 3l4 7M8 14v5M13 13v7M18 11v4',
  drop:'M12 3C9 8 6 11 6 15a6 6 0 0 0 12 0c0-4-3-7-6-12Z',
  flame:'M12 3c3 5 6 7 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3-1-3 0-5 0-7Z',
  bolt:'M13 2 5 13h6l-1 9 8-12h-6l1-8Z',
  waves:'M3 9c2 0 2-2 4.5-2S10 9 12 9s2-2 4.5-2S19 9 21 9M3 14c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2M12 16v5m-3-2 3 3 3-3',
  quake:'M2 12h3l2-5 3 10 3-12 3 9 2-2h4',
  lock:'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5ZM12 15v3',
  fear:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8.5 10h.01M15.5 10h.01M8 16c1.5-2 6.5-2 8 0',
  reticle:'M12 2v5M12 17v5M2 12h5M17 12h5M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
  toxin:'M12 3c-2 3-4 5-4 7a4 4 0 0 0 8 0c0-2-2-4-4-7ZM6 14c-1.5 2-3 3.5-3 5a3 3 0 0 0 6 0c0-1.5-1.5-3-3-5ZM18 14c-1.5 2-3 3.5-3 5a3 3 0 0 0 6 0c0-1.5-1.5-3-3-5Z',
  up:'M6 14l6-6 6 6M6 19l6-6 6 6',down:'M6 6l6 6 6-6M6 11l6 6 6-6',plus:'M12 5v14M5 12h14',
  shield:'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6Z',star:'M12 2l3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9Z',
  wind:'M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  spark:'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z',calm:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM7 12h10',cross:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8 8l8 8M16 8l-8 8'
 };
 // statusId -> [family, icon, colour]
 const LOOK={
  bleeding:['bleed','wound','#b5233a'],burning:['burn','flame','#e2672a'],paralysis:['shock','bolt','#d2a72a'],sinking:['sink','waves','#3f7fb4'],
  tremor:['quake','quake','#a4834f'],sealed:['seal','lock','#7f5aa8'],suppressed:['seal','cross','#5f5f96'],terror:['fear','fear','#5c4a74'],shaken:['fear','fear','#9a5f92'],
  vulnerable:['lock','reticle','#c4495f'],marked:['lock','reticle','#a85d8f'],contaminated:['toxin','toxin','#6f8f3a'],
  'damage-up':['rise','up','#d0743e'],adrenaline:['rise','up','#d0663a'],focused:['rise','eye','#4f87a6'],agile:['rise','wind','#3f9c90'],
  regeneration:['heal','plus','#3f9a6c'],guarded:['rise','shield','#4f8fa8'],shield:['rise','shield','#4f8fa8'],'steady-mind':['rise','calm','#5c88a0'],
  'lucky-find':['rise','spark','#b98a2a'],imprint:['rise','star','#b98a2a'],
  weakened:['drain','down','#8f6f7c'],slowed:['drain','down','#5f7f9f'],'attack-down':['drain','down','#9f5f66'],'defense-down':['drain','down','#7f6f9f']
 };
 const svg=(d,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
 function particles(fx,n,cls,set){for(let i=0;i<n;i++){const p=document.createElement('i');p.className='sfx-p '+cls;set(p.style,i);fx.appendChild(p);}}
 const v=(st,k,val)=>st.setProperty(k,val);
 let gooId=0;
 // Irregular splat outline: lobed polar shape stretched along angle a.
 function blob(cx,cy,rx,ry,a){const n=12,pts=[];for(let i=0;i<n;i++){const t=i/n*Math.PI*2,k=rand(.72,1.18)*(Math.random()<.2?1.3:1),x=Math.cos(t)*rx*k,y=Math.sin(t)*ry*k;pts.push([cx+x*Math.cos(a)-y*Math.sin(a),cy+x*Math.sin(a)+y*Math.cos(a)]);}
  const m=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2],f=n=>n.toFixed(1);let s=m(pts[n-1],pts[0]),d=`M${f(s[0])} ${f(s[1])}`;for(let i=0;i<n;i++){const q=m(pts[i],pts[(i+1)%n]);d+=`Q${f(pts[i][0])} ${f(pts[i][1])} ${f(q[0])} ${f(q[1])}`;}return d+'Z';}
 // Family layers. Each sets its own particles inside the overlay box (0–100% of the target).
 const LAYERS={
  bleed(fx){
   // Liquid blood through a metaball ("goo") filter with specular lighting: a slit oozes, swells into a wet pool,
   // and heavy drips break away and run down, thinning behind a rounded head, merging where they touch.
   const w=parseFloat(fx.style.width),h=parseFloat(fx.style.height),U=Math.min(w,h),id='sfxgoo'+(++gooId);
   const cx=w*rand(.36,.64),cy=h*rand(.24,.36),a=rand(-.35,.35),slit=U*rand(.34,.44),f=n=>n.toFixed(1);
   let body='';
   // Ooze along the slit: beads swell from nothing and fuse into one wet line.
   for(let i=0;i<7;i++){const t=i/6-.5,x=cx+Math.cos(a)*slit*t,y=cy+Math.sin(a)*slit*t,r=U*rand(.03,.05)*(1-Math.abs(t)*.7);body+=`<circle class="ooze" style="--d:${f(i*18+rand(0,40))}ms" cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`;}
   body+=`<ellipse class="ooze" style="--d:120ms" cx="${f(cx)}" cy="${f(cy+U*.03)}" rx="${f(slit*.3)}" ry="${f(U*.04)}" transform="rotate(${f(a*57.3)} ${f(cx)} ${f(cy)})"/>`;
   // Drips: the trail grows exactly as the head falls (same duration/easing); heads are fatter than trails.
   const n=3+(Math.random()<.6);for(let i=0;i<n;i++){const t=((i+.5)/n-.5)*.9+rand(-.04,.04),x=cx+Math.cos(a)*slit*t,y=cy+Math.sin(a)*slit*t+U*.03,len=h*rand(.22,.6),hr=U*rand(.028,.038),tw=hr*rand(.75,.95),d=160+i*rand(60,140),dur=rand(780,1050);
    body+=`<path class="trail" pathLength="100" style="--d:${f(d)}ms;--t:${f(dur)}ms;stroke-width:${f(tw)}" d="M${f(x)} ${f(y)}V${f(y+len)}"/><circle class="head" style="--d:${f(d)}ms;--t:${f(dur)}ms;--len:${f(len)}px" cx="${f(x)}" cy="${f(y)}" r="${f(hr)}"/>`;}
   // A couple of loose drops flicked off the wound (kept small and few so it stays a liquid, not confetti).
   for(let i=0;i<4;i++){const ang=rand(0,Math.PI*2),dist=U*rand(.18,.34);body+=`<circle class="fleck" style="--d:${f(rand(40,140))}ms" cx="${f(cx+Math.cos(ang)*dist)}" cy="${f(cy+Math.sin(ang)*dist*.7)}" r="${f(U*rand(.022,.034))}"/>`;}
   const filt=`<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="${f(U*.014)}" result="b"/><feColorMatrix in="b" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -10" result="goo"/><feGaussianBlur in="goo" stdDeviation="1.6" result="gb"/><feSpecularLighting in="gb" surfaceScale="4" specularConstant=".85" specularExponent="26" lighting-color="#ffe9ea" result="sp"><feDistantLight azimuth="235" elevation="52"/></feSpecularLighting><feComposite in="sp" in2="goo" operator="in" result="spi"/><feComposite in="goo" in2="spi" operator="arithmetic" k2="1" k3=".75"/></filter>`;
   fx.insertAdjacentHTML('beforeend',`<svg class="sfx-blood" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs>${filt}</defs><ellipse class="soak" cx="${f(cx)}" cy="${f(cy+U*.04)}" rx="${f(slit*.75)}" ry="${f(U*.11)}"/><g class="liquid" filter="url(#${id})">${body}</g></svg>`);},
  burn(fx){particles(fx,3,'sfx-tongue',(s,i)=>{v(s,'--x',(20+i*30+rand(-6,6))+'%');v(s,'--d',i*90+'ms');v(s,'--s',rand(.8,1.25));});particles(fx,14,'sfx-ember',(s)=>{v(s,'--x',rand(5,95)+'%');v(s,'--d',rand(0,700)+'ms');v(s,'--rise',-rand(60,140)+'px');v(s,'--drift',rand(-24,24)+'px');});const h=document.createElement('i');h.className='sfx-haze';fx.appendChild(h);},
  shock(fx){const w=100,h=100;let paths='';for(let k=0;k<3;k++){let x=rand(0,15),y=rand(10,90),d=`M${x} ${y}`;while(x<w){x+=rand(6,14);y=Math.max(4,Math.min(h-4,y+rand(-22,22)));d+=`L${x.toFixed(1)} ${y.toFixed(1)}`;}paths+=`<path d="${d}" style="animation-delay:${k*90}ms"/>`;}fx.insertAdjacentHTML('beforeend',`<svg class="sfx-arcs" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>`);particles(fx,10,'sfx-spark',(s)=>{v(s,'--x',rand(5,95)+'%');v(s,'--y',rand(10,90)+'%');v(s,'--d',rand(0,500)+'ms');});},
  sink(fx){const w=document.createElement('i');w.className='sfx-water';fx.appendChild(w);particles(fx,10,'sfx-bubble',(s)=>{v(s,'--x',rand(8,92)+'%');v(s,'--d',rand(200,800)+'ms');v(s,'--s',rand(.5,1.3));});},
  quake(fx,target){target.classList.remove('sfx-shake');void target.offsetWidth;target.classList.add('sfx-shake');setTimeout(()=>target.classList.remove('sfx-shake'),620);particles(fx,3,'sfx-groundwave',(s,i)=>{v(s,'--d',i*120+'ms');});},
  seal(fx){fx.insertAdjacentHTML('beforeend','<i class="sfx-chain sfx-chain-a"></i><i class="sfx-chain sfx-chain-b"></i><i class="sfx-runes"></i>');},
  fear(fx){fx.insertAdjacentHTML('beforeend','<i class="sfx-dread"></i>');particles(fx,7,'sfx-wisp',(s)=>{v(s,'--x',rand(10,90)+'%');v(s,'--d',rand(0,500)+'ms');v(s,'--drift',rand(-30,30)+'px');});},
  lock(fx){fx.insertAdjacentHTML('beforeend','<i class="sfx-bracket tl"></i><i class="sfx-bracket tr"></i><i class="sfx-bracket bl"></i><i class="sfx-bracket br"></i>');},
  toxin(fx){fx.insertAdjacentHTML('beforeend','<i class="sfx-miasma"></i>');particles(fx,12,'sfx-bubble sfx-toxic',(s)=>{v(s,'--x',rand(8,92)+'%');v(s,'--d',rand(0,800)+'ms');v(s,'--s',rand(.5,1.2));});},
  rise(fx){fx.insertAdjacentHTML('beforeend','<i class="sfx-pillar"></i>');particles(fx,12,'sfx-mote',(s)=>{v(s,'--x',rand(10,90)+'%');v(s,'--d',rand(0,600)+'ms');v(s,'--rise',-rand(50,120)+'px');});particles(fx,3,'sfx-chevron',(s,i)=>{v(s,'--x',(30+i*20)+'%');v(s,'--d',i*110+'ms');});},
  heal(fx){fx.insertAdjacentHTML('beforeend','<i class="sfx-pillar sfx-soft"></i>');particles(fx,10,'sfx-cross',(s)=>{v(s,'--x',rand(10,90)+'%');v(s,'--d',rand(0,600)+'ms');v(s,'--rise',-rand(40,100)+'px');v(s,'--s',rand(.6,1.1));});},
  drain(fx){fx.insertAdjacentHTML('beforeend','<i class="sfx-pillar sfx-down"></i>');particles(fx,3,'sfx-chevron sfx-fall',(s,i)=>{v(s,'--x',(30+i*20)+'%');v(s,'--d',i*110+'ms');});particles(fx,8,'sfx-mote sfx-sink',(s)=>{v(s,'--x',rand(10,90)+'%');v(s,'--d',rand(0,600)+'ms');v(s,'--rise',rand(40,90)+'px');});}
 };
 function play(target,statusId,def,label){if(reduced.matches||document.hidden||!target?.isConnected)return 0;const r=target.getBoundingClientRect();if(!r.height)return 0;
  const [family,icon,color]=LOOK[statusId]||[def?.type==='buff'?'rise':'drain',def?.type==='buff'?'up':'down',def?.type==='buff'?'#4f8f80':'#9f6f7c'];
  const fx=document.createElement('div');fx.className='sfx sfx-'+family;fx.setAttribute('aria-hidden','true');fx.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;--c:${color};--sig:${Math.round(Math.max(56,Math.min(110,Math.min(r.width,r.height)*.8)))}px`;
  LAYERS[family]?.(fx,target);
  fx.insertAdjacentHTML('beforeend',`<i class="sfx-sigil"><svg class="sfx-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="38" class="dash"/></svg>${svg(ICON[icon]||ICON.spark,'sfx-icon')}</i>`);
  const tag=document.createElement('b');tag.className='sfx-tag';tag.innerHTML=svg(ICON[icon]||ICON.spark);const name=document.createElement('span');name.textContent=def?.name||statusId;tag.appendChild(name);if(label){const em=document.createElement('em');em.textContent=label;tag.appendChild(em);}fx.appendChild(tag);
  document.body.appendChild(fx);setTimeout(()=>fx.remove(),1500);return 1500;}
 window.KBMStatusFX={play};
})();
