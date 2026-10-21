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
   // Modelled on a real cut on an upright surface: a thin slit wells up along its whole length, the blood hangs as a
   // thin film under the cut, and narrow rivulets slide down under gravity — slightly meandering, tapering, led by a
   // small bead, starting at different times, some running out early. Thick blood reads near-black, thin film lighter.
   const w=parseFloat(fx.style.width),h=parseFloat(fx.style.height),U=Math.min(w,h),id='sfxgoo'+(++gooId),f=n=>n.toFixed(1);
   const cx=w*rand(.38,.62),cy=h*rand(.22,.32),a=rand(-.28,.28),half=Math.min(w*.26,U*rand(.28,.36)),ca=Math.cos(a),sa=Math.sin(a);
   const at=t=>[cx+ca*half*t,cy+sa*half*t];
   // The cut: a thin dark lens, deepest in the middle, opened by a blade travelling from one end to the other (CUT ms).
   // Everything downstream is timed off the moment the blade passes that point, so blood follows the blade.
   const [x0,y0]=at(-1),[x1,y1]=at(1),op=U*.012,CUT=rand(280,360),dir=Math.random()<.5?1:-1,pass=t=>CUT*(dir>0?(t+1)/2:(1-t)/2);
   const [bx0,by0]=dir>0?[x0,y0]:[x1,y1],[bx1,by1]=dir>0?[x1,y1]:[x0,y0],mid='sfxcut'+gooId;
   let cut=`<mask id="${mid}" maskUnits="userSpaceOnUse"><path class="cut-reveal" pathLength="100" style="--t:${f(CUT)}ms" d="M${f(bx0-(bx1-bx0)*.04)} ${f(by0-(by1-by0)*.04)}L${f(bx1+(bx1-bx0)*.04)} ${f(by1+(by1-by0)*.04)}" stroke-width="${f(op*8)}"/></mask>`+
    `<path class="cut" mask="url(#${mid})" d="M${f(x0)} ${f(y0)}Q${f(cx-sa*op)} ${f(cy+ca*op)} ${f(x1)} ${f(y1)}Q${f(cx+sa*op*.6)} ${f(cy-ca*op*.6)} ${f(x0)} ${f(y0)}Z"/>`+
    `<path class="glint" style="--t:${f(CUT)}ms;--dx:${f(bx1-bx0)}px;--dy:${f(by1-by0)}px;stroke-width:${f(U*.009)}" d="M${f(bx0-(bx1-bx0)/half/2*U*.09)} ${f(by0-(by1-by0)/half/2*U*.09)}L${f(bx0)} ${f(by0)}"/>`;
   // Welling film: slices along the cut, each starting to well as the blade passes it; uneven lower edge, thickest mid-cut.
   let body='';const N=14,sag=[];for(let k=0;k<=N;k++){const t=k/N*2-1;sag.push(U*(.075*(1-t*t)+rand(.004,.03)));}
   for(let k=0;k<N;k++){const t0=k/N*2-1,t1=(k+1)/N*2-1,[ax,ay]=at(t0-.02),[bx,by]=at(t1+.02),[px,py]=at(t0),[qx,qy]=at(t1);
    body+=`<path class="film" style="--d:${f(40+pass((t0+t1)/2))}ms" d="M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}L${f(qx)} ${f(qy+sag[k+1])}L${f(px)} ${f(py+sag[k])}Z"/>`;}
   // Rivulets: thin, slightly wandering, thicker near the source, bead at the front; some stop short.
   const n=4+Math.floor(rand(0,3));
   for(let i=0;i<n;i++){const t=((i+.5)/n*2-1)*.85+rand(-.06,.06),[sx,sy0]=at(t),sy=sy0+U*(.04*(1-t*t)+.012),len=h*rand(.16,.62)*(1-Math.abs(t)*.35),
     tw=U*rand(.016,.024)*(1-Math.abs(t)*.3),br=tw*rand(.75,.95),d=pass(t)+rand(110,260),dur=rand(820,1080);
    let x=sx,path=`M${f(sx)} ${f(sy)}`;for(let s=1;s<=6;s++){x+=rand(-U*.008,U*.008);path+=`L${f(x)} ${f(sy+len*s/6)}`;}
    const st=`--d:${f(d)}ms;--t:${f(dur)}ms`;
    body+=`<path class="rill" pathLength="100" style="${st};stroke-width:${f(tw)}" d="${path}"/><path class="rill root" pathLength="100" style="${st};stroke-width:${f(tw*1.7)}" d="M${f(sx)} ${f(sy-U*.01)}L${f(sx+(x-sx)*.2)} ${f(sy+len*.22)}"/>`;
    body+=`<circle class="bead" style="${st};--dx:${f(x-sx)}px;--dy:${f(len)}px" cx="${f(sx)}" cy="${f(sy)}" r="${f(br)}"/>`;}
   const sd=f(U*.009);
   const filt=`<filter id="${id}" x="-20%" y="-20%" width="140%" height="160%" color-interpolation-filters="sRGB">`+
    `<feGaussianBlur in="SourceGraphic" stdDeviation="${sd}" result="b"/><feColorMatrix in="b" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 26 -11" result="goo"/>`+
    `<feComponentTransfer in="goo" result="thin"><feFuncA type="linear" slope=".86"/></feComponentTransfer>`+
    `<feMorphology in="goo" operator="erode" radius="${f(U*.006)}" result="er"/><feGaussianBlur in="er" stdDeviation="${f(U*.006)}" result="erb"/>`+
    `<feFlood flood-color="#3d0207" flood-opacity=".72"/><feComposite in2="erb" operator="in" result="core"/>`+
    `<feGaussianBlur in="goo" stdDeviation="${f(U*.005)}" result="gb"/><feSpecularLighting in="gb" surfaceScale="2" specularConstant=".55" specularExponent="38" lighting-color="#ffd9dc" result="sp"><feDistantLight azimuth="225" elevation="58"/></feSpecularLighting><feComposite in="sp" in2="er" operator="in" result="spi"/>`+
    `<feMerge><feMergeNode in="thin"/><feMergeNode in="core"/><feMergeNode in="spi"/></feMerge></filter>`;
   fx.insertAdjacentHTML('beforeend',`<svg class="sfx-blood" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs>${filt}</defs>${cut}<g class="liquid" filter="url(#${id})">${body}</g></svg>`);},
  burn(fx){
   // Modelled on a real fire catching a surface: a hot ignition point, a charred patch that spreads out with a glowing
   // orange rim that cools to black, flames with a white-yellow core fading to orange-red tips that flicker and lick
   // upward (turbulence displacement flowing up), grey smoke rising off the tips, a few embers, and the char left behind.
   const w=parseFloat(fx.style.width),h=parseFloat(fx.style.height),U=Math.min(w,h),n=++gooId,f=v=>v.toFixed(1);
   const cx=w*rand(.38,.62),by=h*rand(.66,.8),rx=Math.min(w*.26,U*rand(.42,.52)),ry=U*rand(.2,.26);
   let defs=`<linearGradient id="sfxfo${n}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff4c8"/><stop offset=".18" stop-color="#ffd257"/><stop offset=".45" stop-color="#ff9a1f"/><stop offset=".75" stop-color="#f0520c" stop-opacity=".85"/><stop offset="1" stop-color="#c4260a" stop-opacity="0"/></linearGradient>`+
    `<linearGradient id="sfxfi${n}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fffdf2"/><stop offset=".4" stop-color="#fff0b0"/><stop offset=".8" stop-color="#ffc640" stop-opacity=".6"/><stop offset="1" stop-color="#ffb030" stop-opacity="0"/></linearGradient>`+
    `<radialGradient id="sfxch${n}"><stop offset="0" stop-color="#140904" stop-opacity=".9"/><stop offset=".55" stop-color="#2b1309" stop-opacity=".78"/><stop offset=".82" stop-color="#5a2a10" stop-opacity=".42"/><stop offset="1" stop-color="#7a4520" stop-opacity="0"/></radialGradient>`+
    `<filter id="sfxfl${n}" x="-30%" y="-40%" width="160%" height="150%"><feTurbulence type="fractalNoise" baseFrequency="${(4/U).toFixed(4)} ${(9/U).toFixed(4)}" numOctaves="2" seed="${n%97}" result="t"><animate attributeName="baseFrequency" values="${(4/U).toFixed(4)} ${(9/U).toFixed(4)};${(4.6/U).toFixed(4)} ${(7/U).toFixed(4)};${(3.6/U).toFixed(4)} ${(10/U).toFixed(4)};${(4.2/U).toFixed(4)} ${(8/U).toFixed(4)}" dur="1.5s" fill="freeze"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="t" scale="${f(U*.13)}" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation=".6"/></filter>`+
    `<filter id="sfxsc${n}" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="${(7/U).toFixed(4)}" numOctaves="3" seed="${(n*7)%97}"/><feDisplacementMap in="SourceGraphic" scale="${f(U*.12)}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
   const scorch=blob(cx,by-ry*.25,rx,ry,rand(-.15,.15));
   // Char: spreads from the ignition point; the rim glows orange first and cools to dark.
   let char=`<g filter="url(#sfxsc${n})"><path class="char" fill="url(#sfxch${n})" d="${scorch}"/><path class="rim" d="${scorch}" stroke-width="${f(U*.02)}"/>`;
   for(let i=0;i<6;i++){const a=rand(0,Math.PI*2),r=rand(.2,.75);char+=`<circle class="coal" style="--d:${f(rand(250,600))}ms" cx="${f(cx+Math.cos(a)*rx*r)}" cy="${f(by-ry*.25+Math.sin(a)*ry*r)}" r="${f(U*rand(.008,.016))}"/>`;}
   char+='</g>';
   // Flames: outer tongues across the burn, tallest mid; inner white-hot cores on top.
   let fl='';const tongue=(x,H,W)=>`M${f(x)} ${f(by)}C${f(x-W*.55)} ${f(by)} ${f(x-W*.5)} ${f(by-H*.38)} ${f(x-W*.18)} ${f(by-H*.62)}C${f(x-W*.06)} ${f(by-H*.76)} ${f(x+W*.02)} ${f(by-H*.86)} ${f(x+rand(-W*.15,W*.15))} ${f(by-H)}C${f(x+W*.12)} ${f(by-H*.78)} ${f(x+W*.38)} ${f(by-H*.56)} ${f(x+W*.48)} ${f(by-H*.3)}C${f(x+W*.56)} ${f(by-H*.08)} ${f(x+W*.32)} ${f(by)} ${f(x)} ${f(by)}Z`;
   const nt=7;for(let i=0;i<nt;i++){const t=(i+.5)/nt*2-1,x=cx+t*rx*.78+rand(-4,4),H=h*rand(.42,.62)*(1-t*t*.55),W=rx*rand(.42,.6);
    fl+=`<path class="flame" style="--d:${f(rand(30,160))}ms;--k:${f(rand(.85,1.15))}" fill="url(#sfxfo${n})" d="${tongue(x,H,W)}"/>`;}
   for(let i=0;i<4;i++){const t=(i+.5)/4*2-1,x=cx+t*rx*.5+rand(-3,3),H=h*rand(.2,.3)*(1-t*t*.5),W=rx*rand(.3,.4);
    fl+=`<path class="flame core" style="--d:${f(rand(60,200))}ms;--k:${f(rand(.85,1.15))}" fill="url(#sfxfi${n})" d="${tongue(x,H,W)}"/>`;}
   // Smoke rising off the tips, embers spat upward.
   let smoke='';for(let i=0;i<6;i++){smoke+=`<circle class="smoke" style="--d:${f(rand(380,700))}ms;--dx:${f(rand(-U*.12,U*.12))}px;--dy:${f(-h*rand(.45,.7))}px" cx="${f(cx+rand(-rx*.5,rx*.5))}" cy="${f(by-h*rand(.5,.62))}" r="${f(U*rand(.045,.07))}"/>`;}
   let em='';for(let i=0;i<9;i++){em+=`<circle class="spark" style="--d:${f(rand(150,800))}ms;--dx:${f(rand(-U*.18,U*.18))}px;--dy:${f(-h*rand(.4,.85))}px" cx="${f(cx+rand(-rx*.6,rx*.6))}" cy="${f(by-h*rand(.1,.3))}" r="${f(U*rand(.006,.011))}"/>`;}
   fx.insertAdjacentHTML('beforeend',`<i class="sfx-ignite" style="left:${f(cx)}px;top:${f(by-ry*.3)}px"></i><svg class="sfx-fire" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs>${defs}</defs>${char}<g class="smokes">${smoke}</g><g class="flames" filter="url(#sfxfl${n})"><ellipse class="bed" cx="${f(cx)}" cy="${f(by-ry*.1)}" rx="${f(rx*.85)}" ry="${f(ry*.45)}"/>${fl}</g>${em}</svg>`);
   const hz=document.createElement('i');hz.className='sfx-haze';fx.appendChild(hz);},
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
