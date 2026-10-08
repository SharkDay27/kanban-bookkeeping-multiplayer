/* One shared 2D canvas; tick only while short, target-anchored effects are alive. */
(()=>{
 let app=null,loading=null,jobs=[],failed=false;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 async function init(){if(app||failed)return app;if(loading)return loading;loading=(async()=>{try{if(!window.PIXI)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/vendor/pixi.min.js';script.onload=resolve;script.onerror=reject;document.head.appendChild(script);});const instance=new PIXI.Application();await instance.init({backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,width:innerWidth,height:innerHeight,preference:'webgl',autoStart:false});instance.canvas.className='pixi-battle-canvas';instance.canvas.hidden=true;instance.canvas.setAttribute('aria-hidden','true');document.body.appendChild(instance.canvas);app=instance;app.ticker.add(update);return app;}catch(_){failed=true;return null;}})();return loading;}
 const palette={slash:0xc26b70,blunt:0xb39158,pierce:0x6ba0b1,anomaly:0x9280ac,bleeding:0xb53b51,burning:0xec8547,paralysis:0xc8a94d,sinking:0x648fb8,tremor:0xb19a78,sealed:0x977bac,terror:0x887290,vulnerable:0xc87884,heal:0x72a488,regeneration:0x72a488,shield:0x6fa4b4,agile:0x76a69c,'damage-up':0xb58a60,imprint:0xb5a168};
 function update(ticker){const delta=Math.min(40,ticker.deltaMS);for(const job of [...jobs]){job.age+=delta;const rect=job.target.getBoundingClientRect();if(!job.target.isConnected||job.age>=job.duration){job.root.destroy({children:true});jobs.splice(jobs.indexOf(job),1);continue;}job.root.position.set(rect.left+rect.width/2,rect.top+rect.height/2);const t=job.age/job.duration;
 for(const particle of job.particles){const q=Math.max(0,Math.min(1,(t-particle.delay)/(1-particle.delay)));particle.g.alpha=q<=0?0:Math.sin(Math.PI*q)*particle.opacity;particle.g.position.set(particle.x+particle.vx*q,particle.y+particle.vy*q+particle.gravity*q*q);particle.g.rotation=particle.rotation+particle.spin*q;particle.g.scale.set(particle.startScale+(particle.endScale-particle.startScale)*q);}}
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
 function clear(){for(const job of jobs)job.root.destroy({children:true});jobs=[];if(app){app.stop();app.canvas.hidden=true;}}
 addEventListener('resize',()=>{if(app)app.renderer.resize(innerWidth,innerHeight);});document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)clear();});
 window.KBMBattle2D={emit,clear,ready:init,get activeCount(){return jobs.length;},get available(){return !!app;}};
 if('requestIdleCallback' in window)requestIdleCallback(()=>init(),{timeout:2500});else setTimeout(()=>init(),1000);
})();
