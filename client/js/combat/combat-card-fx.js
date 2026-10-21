/* Card cinematics for skills that touch the enemy's cards.
   destroy: the card is wrenched out of the target, a blade cuts it, the halves part along the cut and crumble into
   fragments that fall away with sparks and dust. steal (Rodion): the card is flicked out, spins like a tossed coin,
   then arcs into the thief's hand with a trail of afterimages and lands with a flourish. Visual only. */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const rand=(a,b)=>a+Math.random()*(b-a),f=n=>n.toFixed(1);
 const CW=78,CH=106;
 function face(card){const el=document.createElement('div');el.className='card-motion-face cfx-face';
  if(card?.faces&&window.KBMCardUI?.half)el.innerHTML=KBMCardUI.half(card.faces[0],'top')+KBMCardUI.half(card.faces[1],'bottom');
  else{const b=document.createElement('b');b.className='cfx-ability';b.textContent='◇ '+(card?.name||'能力牌');el.appendChild(b);}return el;}
 const centre=el=>{const r=el?.getBoundingClientRect();return r&&r.height?{x:r.left+r.width/2,y:r.top+r.height/2,r}:null;};
 function tag(host,text,color){const t=document.createElement('b');t.className='cfx-tag';t.style.setProperty('--c',color);t.textContent=text;host.appendChild(t);}
 // Clip a convex polygon by the half-plane side*(n·p - c) >= 0.
 function clip(poly,nx,ny,c,side){const out=[],val=p=>side*(nx*p[0]+ny*p[1]-c);for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],va=val(a),vb=val(b);if(va>=0)out.push(a);if((va>=0)!==(vb>=0)){const t=va/(va-vb);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;}
 function destroy(card,from){
  const host=document.createElement('div');host.className='cfx cfx-destroy';const x=Math.max(60,Math.min(innerWidth-60,from.x)),y=Math.max(90,Math.min(innerHeight-90,from.y-20));
  host.style.cssText=`left:${x}px;top:${y}px;--rise:${f(Math.min(40,from.y-80))}px`;
  const stage=document.createElement('div');stage.className='cfx-stage';host.appendChild(stage);
  // The cut: a diagonal through the card; fragments are a jittered grid clipped to either side of it.
  const ang=rand(-.65,-.35)*(Math.random()<.5?1:-1),nx=-Math.sin(ang),ny=Math.cos(ang),c=nx*CW/2+ny*CH*rand(.42,.58);
  const cols=3,rows=4,P=[];for(let j=0;j<=rows;j++){P.push([]);for(let i=0;i<=cols;i++){const edgeX=i===0||i===cols,edgeY=j===0||j===rows;P[j].push([i/cols*CW+(edgeX?0:rand(-7,7)),j/rows*CH+(edgeY?0:rand(-7,7))]);}}
  const tris=[];for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=P[j][i],b=P[j][i+1],d=P[j+1][i],e=P[j+1][i+1];if(Math.random()<.5)tris.push([a,b,e],[a,e,d]);else tris.push([a,b,d],[b,e,d]);}
  for(const side of [1,-1])for(const t of tris){const poly=clip(t,nx,ny,c,side);if(poly.length<3)continue;
   const cx=poly.reduce((s,p)=>s+p[0],0)/poly.length-CW/2,cy=poly.reduce((s,p)=>s+p[1],0)/poly.length-CH/2;
   const frag=document.createElement('div');frag.className='cfx-frag';frag.style.clipPath=`polygon(${poly.map(p=>f(p[0])+'px '+f(p[1])+'px').join(',')})`;
   const push=10*side,v=frag.style;v.setProperty('--hx',f(nx*push)+'px');v.setProperty('--hy',f(ny*push)+'px');v.setProperty('--hr',(side*4)+'deg');
   v.setProperty('--fx',f(cx*rand(.6,1.4)+nx*side*rand(10,30))+'px');v.setProperty('--fy',f(rand(60,130)+cy*.3)+'px');v.setProperty('--fr',f(rand(-160,160))+'deg');v.setProperty('--fd',f(rand(0,140))+'ms');
   v.transformOrigin=`${f(cx+CW/2)}px ${f(cy+CH/2)}px`;frag.appendChild(face(card));stage.appendChild(frag);}
  const slash=document.createElement('i');slash.className='cfx-slash';slash.style.setProperty('--a',ang+'rad');slash.style.top=f(c/ny-(CW/2)*nx/ny)+'px';stage.appendChild(slash);
  const glow=document.createElement('i');glow.className='cfx-seam';glow.style.cssText=slash.style.cssText;stage.appendChild(glow);
  for(let i=0;i<12;i++){const s=document.createElement('i');s.className='cfx-spark';const a=ang+(Math.random()<.5?0:Math.PI)+rand(-.5,.5),d=rand(30,80);s.style.cssText=`--x:${f(Math.cos(a)*d)}px;--y:${f(Math.sin(a)*d+rand(0,20))}px;--d:${f(rand(380,460))}ms;--r:${f(a)}rad`;stage.appendChild(s);}
  for(let i=0;i<10;i++){const s=document.createElement('i');s.className='cfx-dust';s.style.cssText=`--x:${f(rand(-CW*.6,CW*.6))}px;--y:${f(rand(30,90))}px;--d:${f(rand(560,800))}ms;--s:${f(rand(.6,1.4))}`;stage.appendChild(s);}
  tag(host,'破壞・本場移除','#a3221a');document.body.appendChild(host);setTimeout(()=>host.remove(),1500);return 1500;}
 function steal(card,from,to){
  const host=document.createElement('div');host.className='cfx cfx-steal';const x=Math.max(60,Math.min(innerWidth-60,from.x)),y=Math.max(90,Math.min(innerHeight-90,from.y-10));
  const dx=to.x-x,dy=to.y-y;host.style.cssText=`left:${x}px;top:${y}px;--dx:${f(dx)}px;--dy:${f(dy)}px;--swing:${f((Math.random()<.5?-1:1)*rand(50,80))}px;--c:#be678b`;
  const burst=document.createElement('i');burst.className='cfx-snatch';host.appendChild(burst);
  // Afterimages share the flight but lag behind; the real card is last so it draws on top.
  for(let g=3;g>=0;g--){const fly=document.createElement('div');fly.className='cfx-flyx'+(g?' ghost':'');fly.style.setProperty('--lag',g*45+'ms');fly.style.setProperty('--o',g?f(.34-g*.08):'1');
   const fy=document.createElement('div');fy.className='cfx-flyy';const spin=document.createElement('div');spin.className='cfx-spin';
   const front=face(card);front.classList.add('front');const back=document.createElement('div');back.className='cfx-back';back.innerHTML='<i></i>';spin.append(front,back);fy.appendChild(spin);fly.appendChild(fy);host.appendChild(fly);}
  for(let i=0;i<8;i++){const s=document.createElement('i');s.className='cfx-glint';const a=rand(0,Math.PI*2),d=rand(28,56);s.style.cssText=`--x:${f(Math.cos(a)*d)}px;--y:${f(Math.sin(a)*d-20)}px;--d:${f(rand(120,420))}ms`;host.appendChild(s);}
  const land=document.createElement('div');land.className='cfx-land';land.style.cssText=`left:${f(dx)}px;top:${f(dy)}px`;land.innerHTML='<i></i><i></i>';host.appendChild(land);
  tag(host,'羅佳・偷取','#be678b');document.body.appendChild(host);setTimeout(()=>host.remove(),1600);return 1600;}
 function play(kind,card,sourceEl,destEl){if(reduced.matches||document.hidden)return 0;const from=centre(sourceEl);if(!from)return 0;
  if(kind==='destroy')return destroy(card,from);
  if(kind==='steal'){const to=centre(destEl)||{x:innerWidth/2,y:innerHeight-80};return steal(card,from,to);}return 0;}
 window.KBMCardFX={play};
})();
