/* Heavier per-type hit cinematics, three variants each, picked at random per hit:
   gun   – an unseen bullet's wake and shock punch through the panel, which shatters from that point and reforms
           (one heavy shot, a tight burst, or a row of shots across it)
   blunt – the panel is a hanging heavy bag: a jab-jab-cross combo, a hook from the side, or an uppercut from below
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

 // ---- Blunt: the target panel is a hanging heavy bag -----------------------------------------
 // No fist is drawn: only the blow's path (speed lines / a hook's arc / an uppercut's rise), a shock ring, a dent shadow
 // and canvas dust where it lands. The panel swings from a pivot above it, squashes on contact and settles with damped
 // swings. Everything runs on Web Animations so the overlay cleans itself up when its timeline ends.
 const ease='cubic-bezier(.3,.6,.4,1)';
 function overlay(r,ms){const host=document.createElement('div');host.className='bag-fx';host.setAttribute('aria-hidden','true');host.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  const pad=Math.max(r.width,r.height),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','bag-trails');svg.setAttribute('viewBox',`${-pad} ${-pad} ${r.width+pad*2} ${r.height+pad*2}`);svg.style.cssText=`left:${-pad}px;top:${-pad}px;width:${r.width+pad*2}px;height:${r.height+pad*2}px`;host.appendChild(svg);
  document.body.appendChild(host);host.animate([{opacity:1},{opacity:1}],{duration:ms}).finished.then(()=>host.remove(),()=>host.remove());return {host,svg};}
 // A blow's path: a bright streak runs along it into the contact point, with thinner parallel speed lines.
 function trail(svg,d,delay,dur,width,lines=3){const NS='http://www.w3.org/2000/svg';
  // The smear: a wide, soft band laid down along the whole path as the blow travels, lingering a moment like a motion blur.
  const band=document.createElementNS(NS,'path');band.setAttribute('d',d);band.setAttribute('class','bag-smear');band.style.strokeWidth=f1(width*4.2);svg.appendChild(band);const bl=band.getTotalLength();band.style.strokeDasharray=`${f1(bl)} ${f1(bl)}`;
  band.animate([{strokeDashoffset:bl,opacity:.95},{strokeDashoffset:0,opacity:.95,offset:.38},{strokeDashoffset:0,opacity:0}],{duration:dur*2.6,delay,easing:'cubic-bezier(.25,.7,.4,1)',fill:'both'});for(let k=0;k<lines;k++){const p=document.createElementNS(NS,'path');p.setAttribute('d',d);p.setAttribute('class','bag-trail'+(k?' thin':''));
   const off=(k-(lines-1)/2)*width*1.6;if(k)p.setAttribute('transform',`translate(0 ${f1(off)})`);p.style.strokeWidth=f1(k?width*.35:width);svg.appendChild(p);const len=p.getTotalLength(),seg=len*(k?.4:.55);
   p.style.strokeDasharray=`${f1(seg)} ${f1(len+seg)}`;p.animate([{strokeDashoffset:seg,opacity:0},{opacity:k?.5:1,offset:.25},{strokeDashoffset:-len*.15,opacity:k?.4:.9,offset:.7},{strokeDashoffset:-len,opacity:0}],{duration:dur+k*30,delay:delay+k*18,easing:'cubic-bezier(.2,.7,.4,1)',fill:'both'});}}
 // Contact: shock ring, short radial spikes, a dent shadow on the bag and a puff of canvas dust thrown back out.
 function contact(host,x,y,delay,size,back){const add=(cls,css)=>{const el=document.createElement('i');el.className=cls;el.style.cssText=`left:${f1(x)}px;top:${f1(y)}px;${css||''}`;host.appendChild(el);return el;};
  add('bag-dent',`--s:${f1(size)}px`).animate([{opacity:0,transform:'translate(-50%,-50%) scale(.3)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.15},{opacity:0,transform:'translate(-50%,-50%) scale(1.2)'}],{duration:520,delay,easing:ease,fill:'both'});
  for(let k=0;k<2;k++)add('bag-ring',`--s:${f1(size)}px`).animate([{opacity:.9,transform:'translate(-50%,-50%) scale(.2)'},{opacity:0,transform:`translate(-50%,-50%) scale(${2.2+k*.8})`}],{duration:340+k*90,delay:delay+k*50,easing:'cubic-bezier(.1,.7,.3,1)',fill:'both'});
  for(let k=0;k<9;k++){const a=k/9*Math.PI*2+rand(-.2,.2),d=size*rand(.7,1.2);add('bag-spike').animate([{opacity:0,transform:`translate(-50%,-50%) rotate(${f1(a)}rad) translateX(${f1(size*.25)}px) scaleX(.3)`},{opacity:1,offset:.2},{opacity:0,transform:`translate(-50%,-50%) rotate(${f1(a)}rad) translateX(${f1(d)}px) scaleX(1)`}],{duration:260,delay,easing:'cubic-bezier(.1,.8,.3,1)',fill:'both'});}
  for(let k=0;k<7;k++){const a=back+rand(-.9,.9),d=size*rand(.6,1.4);add('bag-dust',`--d:${f1(rand(6,14))}px`).animate([{opacity:0,transform:'translate(-50%,-50%) scale(.4)'},{opacity:.55,offset:.2},{opacity:0,transform:`translate(calc(-50% + ${f1(Math.cos(a)*d)}px),calc(-50% + ${f1(Math.sin(a)*d+size*.4)}px)) scale(1.8)`}],{duration:620,delay:delay+20,easing:'cubic-bezier(.2,.7,.4,1)',fill:'both'});}}
 // The bag itself: swings about a pivot above the panel. Chains drawn in the overlay swing with it.
 function swing(target,host,r,frames,dur){const origin=`50% ${f1(-r.height*.9)}px`,opts={duration:dur,easing:'linear'};
  const rig=document.createElement('div');rig.className='bag-rig';rig.style.transformOrigin=origin;rig.innerHTML='<i class="bag-chain l"></i><i class="bag-chain r"></i>';const lift=r.height*.9,dx=r.width*.4;rig.style.setProperty('--cl',f1(Math.hypot(dx,lift))+'px');rig.style.setProperty('--ca',f1(Math.atan2(dx,lift)*57.3)+'deg');host.prepend(rig);rig.animate(frames,opts);
  rig.animate([{opacity:0},{opacity:1,offset:.06},{opacity:1,offset:.8},{opacity:0}],{duration:dur,fill:'both'});
  const prev=target.style.transformOrigin;target.style.transformOrigin=origin;target.animate(frames,opts).finished.then(()=>{target.style.transformOrigin=prev;},()=>{target.style.transformOrigin=prev;});}
 function blunt(target,heavy=.5,variant=pick(['combo','hook','uppercut'])){const r=box(target);if(still()||!r)return 0;const W=r.width,H=r.height,size=Math.max(46,Math.min(96,Math.min(W,H)*.55)),dir=Math.random()<.5?1:-1;
  if(variant==='combo'){// Jab, jab, cross: three straight blows from the same side land at slightly different spots.
   const dur=1150,{host,svg}=overlay(r,dur+80),a=(dir>0?Math.PI:0)+rand(-.35,.35),hits=[[.42,.4,0],[.56,.55,210],[.48,.46,430]];
   hits.forEach(([u,v,t],k)=>{const x=W*u+rand(-10,10),y=H*v+rand(-8,8),L=W*.85,sx=x+Math.cos(a)*L,sy=y+Math.sin(a)*L*.5;trail(svg,`M${f1(sx)} ${f1(sy)}L${f1(x)} ${f1(y)}`,t,170,k===2?5:3.4,k===2?3:2);contact(host,x,y,t+90,size*(k===2?1.15:.8),a);if(k)setTimeout(()=>sound('blunt'),t+90);});
   const s=-dir;swing(target,host,r,[{transform:'none'},{transform:`rotate(${s*1.2}deg) scale(.95,.97)`,offset:.09},{transform:`rotate(${-s*.8}deg) scale(1.01)`,offset:.17},{transform:`rotate(${s*1.8}deg) scale(.95,.97)`,offset:.27},{transform:`rotate(${-s*.9}deg) scale(1.01)`,offset:.35},{transform:`rotate(${s*4.5}deg) scale(.92,.95)`,offset:.46},{transform:`rotate(${-s*3}deg) scale(1.02,.99)`,offset:.62},{transform:`rotate(${s*1.6}deg)`,offset:.76},{transform:`rotate(${-s*.7}deg)`,offset:.89},{transform:'none'}],dur);return dur;}
  if(variant==='hook'){// Hook: a wide arc sweeps in from one side and drives into that edge; the bag swings hard away and back.
   const dur=1250,{host,svg}=overlay(r,dur+80),x=dir>0?W*.16:W*.84,y=H*rand(.38,.55),sx=dir>0?-W*.55:W*1.55,sy=H*1.25,cx=dir>0?-W*.2:W*1.2,cy=-H*.55;
   trail(svg,`M${f1(sx)} ${f1(sy)}Q${f1(cx)} ${f1(cy)} ${f1(x)} ${f1(y)}`,0,230,7,3);contact(host,x,y,140,size*1.25,dir>0?Math.PI:0);
   swing(target,host,r,[{transform:'none'},{transform:'none',offset:.1},{transform:`rotate(${-dir*4}deg) skewX(${-dir*7}deg) scale(.93,1)`,offset:.15},{transform:`rotate(${-dir*15}deg) skewX(${dir*3}deg)`,offset:.32},{transform:`rotate(${dir*8}deg) skewX(${-dir*2}deg)`,offset:.52},{transform:`rotate(${-dir*4.5}deg)`,offset:.68},{transform:`rotate(${dir*2}deg)`,offset:.82},{transform:`rotate(${-dir*.7}deg)`,offset:.92},{transform:'none'}],dur);return dur;}
  // Uppercut: the path rises from below into the bottom of the bag, which lifts, tips, drops back and swings.
  const dur=1200,{host,svg}=overlay(r,dur+80),x=W*rand(.4,.6),y=H*.84,sx=x-dir*W*.25,sy=H*2.1,cx=x+dir*W*.3,cy=H*1.45;
  trail(svg,`M${f1(sx)} ${f1(sy)}Q${f1(cx)} ${f1(cy)} ${f1(x)} ${f1(y)}`,0,210,6.5,3);contact(host,x,y,130,size*1.2,Math.PI/2);
  swing(target,host,r,[{transform:'none'},{transform:'none',offset:.1},{transform:'translateY(4px) scale(1.04,.9)',offset:.15},{transform:`translateY(${f1(-H*.2)}px) rotate(${dir*5}deg) scale(.98,1.04)`,offset:.32},{transform:`translateY(${f1(-H*.24)}px) rotate(${dir*6}deg)`,offset:.42},{transform:`translateY(3px) rotate(${-dir*3}deg) scale(1.03,.95)`,offset:.58},{transform:`translateY(-3px) rotate(${dir*2}deg)`,offset:.72},{transform:`rotate(${-dir*.8}deg)`,offset:.86},{transform:'none'}],dur);return dur;
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
