/* One shared 2D canvas; tick only while short, target-anchored effects are alive. */
(()=>{
 let app=null,loading=null,jobs=[],failed=false;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 async function init(){if(app||failed)return app;if(loading)return loading;loading=(async()=>{try{if(!window.PIXI)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/vendor/pixi.min.js';script.onload=resolve;script.onerror=reject;document.head.appendChild(script);});const instance=new PIXI.Application();await instance.init({backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,width:innerWidth,height:innerHeight,preference:'webgl',autoStart:false});instance.canvas.className='pixi-battle-canvas';instance.canvas.hidden=true;instance.canvas.setAttribute('aria-hidden','true');document.body.appendChild(instance.canvas);app=instance;app.ticker.add(update);return app;}catch(_){failed=true;return null;}})();return loading;}
 const palette={slash:0xc26b70,blunt:0xb39158,pierce:0x6ba0b1,anomaly:0x9280ac,bleeding:0xb53b51,burning:0xec8547,paralysis:0xc8a94d,sinking:0x648fb8,tremor:0xb19a78,sealed:0x977bac,terror:0x887290,vulnerable:0xc87884,heal:0x72a488,regeneration:0x72a488,shield:0x6fa4b4,agile:0x76a69c,'damage-up':0xb58a60,imprint:0xb5a168};
 function update(ticker){const delta=Math.max(0,Number(ticker.elapsedMS??ticker.deltaMS)||0);for(const job of [...jobs]){job.age+=delta;const rect=job.target.getBoundingClientRect();if(!job.target.isConnected||job.age>=job.duration){job.root.destroy({children:true});jobs.splice(jobs.indexOf(job),1);continue;}job.root.position.set(rect.left+rect.width/2,rect.top+rect.height/2);const t=job.age/job.duration;
 for(const particle of job.particles){const end=particle.end??1,q=Math.max(0,Math.min(1,(t-particle.delay)/(end-particle.delay))),eased=particle.fast?1-Math.pow(1-q,3):q;particle.g.alpha=q<=0||q>=1?0:(particle.fast?Math.min(1,q*9)*Math.pow(1-q,.75):Math.sin(Math.PI*q))*particle.opacity;particle.g.position.set(particle.x+particle.vx*eased,particle.y+particle.vy*eased+particle.gravity*q*q);particle.g.rotation=particle.rotation+particle.spin*eased;const scale=particle.startScale+(particle.endScale-particle.startScale)*eased;particle.g.scale.set(scale*(particle.wide||1),scale*(particle.tall||1));}}
 if(!jobs.length){app.stop();app.canvas.hidden=true;}}
 function shape(kind,color,index){const g=new PIXI.Graphics();if(kind==='slash'){g.moveTo(-50,10).quadraticCurveTo(0,-28,62,-12).stroke({color,width:3});g.moveTo(-42,14).quadraticCurveTo(0,-15,50,-8).stroke({color:0xf5ddd8,width:1});}
 else if(kind==='pierce'){g.moveTo(-65,0).lineTo(44,0).lineTo(33,-6).moveTo(44,0).lineTo(33,6).stroke({color,width:3});}
 else if(kind==='paralysis'){g.moveTo(8,-40).lineTo(-8,-5).lineTo(4,-5).lineTo(-8,35).lineTo(14,-10).lineTo(2,-10).stroke({color,width:3});}
 else if(kind==='bleeding'){g.moveTo(0,-7).bezierCurveTo(1,-1,7,1,5,7).bezierCurveTo(3,12,-4,12,-5,7).bezierCurveTo(-7,2,-1,-1,0,-7).fill(color);}
 else if(kind==='burning'){g.moveTo(0,-19).bezierCurveTo(11,-4,13,5,7,13).bezierCurveTo(-1,21,-12,10,-8,1).bezierCurveTo(-4,10,4,-1,0,-19).fill(index%2?0xf2b653:color);}
 else if(kind==='sinking'||kind==='agile'||kind==='damage-up'){g.moveTo(-5,-5).lineTo(0,1).lineTo(5,-5).stroke({color,width:2});}
 else if(kind==='shield'||kind==='sealed'){g.moveTo(0,-15).lineTo(14,-9).lineTo(11,9).lineTo(0,18).lineTo(-11,9).lineTo(-14,-9).closePath().stroke({color,width:2});}
 else if(kind==='heal'||kind==='regeneration'){g.rect(-2,-7,4,14).rect(-7,-2,14,4).fill(color);}
 else if(kind==='blunt'){if(index===0)g.circle(0,0,20).stroke({color,width:2});else g.moveTo(-4,0).lineTo(4,0).stroke({color,width:2});}
 else if(kind==='terror'){g.circle(0,0,11).stroke({color,width:2});}
 else g.circle(0,0,2+(index%3)).fill(color);return g;}
 function emit(target,kind){if(!target||!target.isConnected||reduced()||document.hidden)return false;if(!app){init();return false;}if(jobs.length>=8)return false;const rect=target.getBoundingClientRect();if(rect.width===0||rect.bottom<0||rect.top>innerHeight)return false;
 const color=palette[kind]||0x8c9d85,root=new PIXI.Container(),particles=[],count=['slash','pierce'].includes(kind)?3:kind==='paralysis'?4:kind==='blunt'?16:kind==='bleeding'?7:18;app.stage.addChild(root);
 for(let i=0;i<count;i++){const g=shape(kind,color,i),angle=Math.random()*Math.PI*2,spread=Math.min(85,rect.width*.3),p={g,x:(Math.random()-.5)*spread,y:(Math.random()-.5)*32,vx:Math.cos(angle)*35,vy:Math.sin(angle)*35,gravity:0,rotation:0,spin:0,delay:i/count*.22,startScale:.7,endScale:1,opacity:.85};
 if(kind==='bleeding'){p.vx=2;p.vy=18;p.gravity=25;p.startScale=.08;p.endScale=1.1;p.delay=i*.05;}
 else if(kind==='burning'){p.y=20;p.vx=(Math.random()-.5)*22;p.vy=-58;p.startScale=1;p.endScale=.15;}
 else if(kind==='sinking'){p.y=-28;p.vx=0;p.vy=70;p.startScale=.8;p.endScale=.8;}
 else if(['heal','regeneration','agile','damage-up'].includes(kind)){p.vy=-55;p.vx=(Math.random()-.5)*18;if(kind==='agile'||kind==='damage-up')p.rotation=Math.PI;}
 else if(kind==='slash'){p.x=-30+i*17;p.y=-7+i*10;p.vx=55;p.vy=-15;p.rotation=-.4+i*.2;p.startScale=.4;p.endScale=1.2;}
 else if(kind==='pierce'){p.x=-45;p.y=i*8-8;p.vx=90;p.vy=0;}
 else if(kind==='blunt'){p.x=p.y=0;p.vx=i===0?0:Math.cos(angle)*75;p.vy=i===0?0:Math.sin(angle)*55;p.startScale=.15;p.endScale=i===0?2.8:.7;p.rotation=angle;}
 else if(kind==='shield'||kind==='sealed'){p.startScale=.3;p.endScale=1.5;p.vx*=.4;p.vy*=.4;}
 else if(kind==='paralysis'){p.startScale=.5;p.endScale=.9;p.vx=p.vy=0;p.x=(i-1.5)*22;}
 root.addChild(g);particles.push(p);}
 jobs.push({root,target,particles,age:0,duration:kind==='bleeding'?1300:kind==='burning'?1100:900});app.canvas.hidden=false;app.start();return true;}
 // Timed layers: 0–160ms anticipation, 160–360ms contact, then trails/shards.
 function strike(target,kind,options={}){if(!target?.isConnected||reduced()||document.hidden)return 0;if(!app){init();return 0;}if(jobs.length>=8)return 0;const rect=target.getBoundingClientRect();if(!rect.width||rect.bottom<0||rect.top>innerHeight)return 0;
  const mobile=innerWidth<720,root=new PIXI.Container(),particles=[],power=Math.min(1.65,1+Math.max(0,Number(options.power||0)-8)/32),radius=Math.min(mobile?92:150,Math.max(65,rect.width*.34)),color=({slash:0xc74565,blunt:0xc89235,pierce:0x398fae,anomaly:0x9165c4,block:0x498db9,'shield-break':0x548aa3,shield:0x639fbc}[kind]||palette[kind]||0x738f9e);
  app.stage.addChild(root);
  const add=(g,props={})=>{g.alpha=0;root.addChild(g);const p={g,x:0,y:0,vx:0,vy:0,gravity:0,rotation:0,spin:0,delay:.16,end:.92,startScale:.15,endScale:1,opacity:.95,fast:true,...props};particles.push(p);return p;};
  const ring=(r,c,width=2)=>new PIXI.Graphics().circle(0,0,r).stroke({color:c,width});
  const line=(length,c,width=2)=>new PIXI.Graphics().moveTo(-length/2,0).lineTo(length/2,0).stroke({color:c,width,cap:'round'});
  const shard=(c,n)=>new PIXI.Graphics().moveTo(-3-n,0).lineTo(4,-3-n).lineTo(2,7+n).closePath().fill(c);
  const star=c=>{const g=new PIXI.Graphics();for(let i=0;i<8;i++){const a=i*Math.PI/4;g.moveTo(Math.cos(a)*9,Math.sin(a)*9).lineTo(Math.cos(a)*25,Math.sin(a)*25);}return g.stroke({color:c,width:2});};
  const shield=()=>new PIXI.Graphics().moveTo(0,-40).lineTo(34,-23).lineTo(28,20).lineTo(0,43).lineTo(-28,20).lineTo(-34,-23).closePath().stroke({color,width:3}).moveTo(0,-30).lineTo(25,-17).lineTo(20,15).lineTo(0,31).lineTo(-20,15).lineTo(-25,-17).closePath().stroke({color:0xc6e7ed,width:1});
  add(ring(25,color,1),{delay:0,end:.24,startScale:1.7,endScale:.25,opacity:.32,fast:false});
  if(['block','shield'].includes(kind)){
   if(kind==='block'){const incoming=options.attackType==='blunt'?ring(16,0xd4ac6a,3):line(radius*1.15,options.attackType==='pierce'?0x73a8b9:0xc96177,4);add(incoming,{x:-radius,y:-40,vx:radius*.8,vy:30,rotation:.45,delay:.08,end:.35,startScale:.7,endScale:1});}
   add(shield(),{delay:.04,end:.94,startScale:.35,endScale:1.3,opacity:.95,fast:false});
   for(let i=0;i<3;i++)add(ring(25+i*8,color,1),{delay:.1+i*.05,end:.85,startScale:.2,endScale:2+i*.35,wide:1.25,tall:.75,opacity:.38});
   for(let i=0;i<(mobile?7:12);i++){const a=i*Math.PI/6;add(line(14,color,2),{x:Math.cos(a)*30,y:Math.sin(a)*32,vx:Math.cos(a)*65,vy:Math.sin(a)*50,rotation:a,delay:.23+(i%3)*.025,end:.8,startScale:.15,endScale:1,opacity:.7});}
  }else if(kind==='slash'){
   for(let i=0;i<2;i++){const blade=new PIXI.Graphics().moveTo(-radius,28).quadraticCurveTo(0,-45,radius,-22).stroke({color,width:8-i*2}).moveTo(-radius,26).quadraticCurveTo(0,-44,radius,-23).stroke({color:0xfff5ea,width:2});add(blade,{x:-16,y:i*8,vx:40,vy:-10,delay:.14+i*.1,end:.52+i*.1,rotation:i?-.65:.3,startScale:.2,endScale:1.2});}
  }else if(kind==='pierce'){
   add(line(radius*2.1,color,7),{x:-radius,y:0,vx:radius*1.4,delay:.1,end:.43,startScale:.5,endScale:1.15});
   add(line(radius*1.85,0xf1fcff,2),{x:-radius,y:0,vx:radius*1.4,delay:.11,end:.46,startScale:.5,endScale:1.2});
   for(let i=0;i<3;i++)add(ring(16+i*5,color,2),{x:radius*.25,vx:i*12,delay:.23+i*.045,end:.8,startScale:.1,endScale:2.4,wide:.65,tall:1.2,opacity:.65});
  }else if(kind==='blunt'){
   for(let i=0;i<3;i++)add(ring(16+i*10,color,i===0?4:1),{delay:.18+i*.06,end:.85,startScale:.12,endScale:3.1,tall:.66,opacity:.6});
   const crack=new PIXI.Graphics();for(let i=0;i<7;i++){const a=i*Math.PI*2/7,r=28+i%3*12;crack.moveTo(0,0).lineTo(Math.cos(a)*r,Math.sin(a)*r).lineTo(Math.cos(a+.15)*(r+18),Math.sin(a+.15)*(r+18));}crack.stroke({color,width:2});add(crack,{delay:.2,end:.66,startScale:.25,endScale:1.25});
  }else if(kind==='shield-break'){
   add(shield(),{delay:0,end:.3,startScale:1.1,endScale:1.3,opacity:.8});
   for(let i=0;i<7;i++)add(shard(i%2?color:0xc1dee3,i%3),{vx:Math.cos(i)*radius,vy:Math.sin(i)*65,gravity:40,spin:i*.7,delay:.15+(i%2)*.035,end:.98,startScale:1.1,endScale:.2});
  }else{for(let i=0;i<4;i++)add(ring(12+i*7,color,2),{delay:.14+i*.05,end:.85,startScale:.2,endScale:2.8,rotation:i*.6,wide:1.4,tall:.6,opacity:.65});}
  if(!['shield','block'].includes(kind)){
   add(star(color),{delay:.18,end:.58,startScale:.15,endScale:power*1.6});add(star(0xfff8ec),{delay:.2,end:.4,startScale:.15,endScale:.8});
   const count=mobile?18:30;for(let i=0;i<count;i++){const a=(i/count)*Math.PI*2+Math.random()*.2,speed=(35+Math.random()*radius)*power;add(i%4===0?shard(color,i%2):line(8+Math.random()*10,i%3===0?0xbeb7a4:color,1.5),{vx:Math.cos(a)*speed,vy:Math.sin(a)*speed*.65,gravity:kind==='blunt'?25:8,rotation:a,spin:i%3*.25,delay:.19+Math.random()*.1,end:.72+Math.random()*.22,startScale:1.1,endScale:.2,opacity:.8});}
  }
  jobs.push({root,target,particles,age:0,duration:980});app.canvas.hidden=false;app.start();return 980;
 }
 function clear(){for(const job of jobs)job.root.destroy({children:true});jobs=[];if(app){app.stop();app.canvas.hidden=true;}}
 addEventListener('resize',()=>{if(app)app.renderer.resize(innerWidth,innerHeight);});document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)clear();});
 window.KBMBattle2D={emit,strike,clear,ready:init,get activeCount(){return jobs.length;},get available(){return !!app;}};
 if('requestIdleCallback' in window)requestIdleCallback(()=>init(),{timeout:2500});else setTimeout(()=>init(),1000);
})();
