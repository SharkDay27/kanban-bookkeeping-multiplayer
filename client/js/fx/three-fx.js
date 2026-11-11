/* three.js effects layer: one transparent full-screen WebGL canvas above the UI, loaded on first use and rendered
   only while an effect is alive. The camera is set so the z=0 plane maps 1:1 to screen pixels, which lets effects be
   anchored to DOM rects while debris, rings and tiles still move in real 3D (depth, tumbling, lighting).
   Purely visual: nothing here reads or changes game state. Disabled under prefers-reduced-motion. */
(()=>{
 let T=null,renderer=null,scene=null,camera=null,loading=null,failed=false,raf=0,last=0,W=0,H=0;
 const jobs=[],FOV=38;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
 const COLORS={ink:0x1f1f1d,paper:0xf4f4f1,line:0xd3d3cf,red:0xa3221a,gold:0xb98a3a,steel:0x2f6b86,blood:0x8f0a18,fire:0xff6a10,ember:0xffd23f,rupture:0x8f4a2a,heal:0x3f9a6c,violet:0x7f5aa8};
 async function init(){if(renderer||failed)return renderer;if(loading)return loading;
  loading=(async()=>{try{T=await import('/vendor/three/three.module.min.js');
    const r=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});r.setPixelRatio(Math.min(devicePixelRatio||1,2));r.setClearColor(0,0);
    r.domElement.className='three-fx-canvas';r.domElement.setAttribute('aria-hidden','true');r.domElement.hidden=true;document.body.appendChild(r.domElement);
    scene=new T.Scene();camera=new T.PerspectiveCamera(FOV,1,10,6000);
    scene.add(new T.HemisphereLight(0xffffff,0x8a8a86,1.5));const sun=new T.DirectionalLight(0xffffff,1.9);sun.position.set(-.5,.9,1);scene.add(sun);
    renderer=r;resize();addEventListener('resize',resize);return r;}catch(_){failed=true;return null;}})();
  return loading;}
 function resize(){if(!renderer)return;W=innerWidth;H=innerHeight;renderer.setSize(W,H,false);camera.aspect=W/H;camera.position.set(0,0,(H/2)/Math.tan(FOV*Math.PI/360));camera.updateProjectionMatrix();}
 const world=(x,y,z=0)=>new T.Vector3(x-W/2,H/2-y,z);
 function tick(now){raf=0;const dt=Math.min(.05,(now-last)/1000||.016);last=now;
  for(let i=jobs.length-1;i>=0;i--){const j=jobs[i];j.age+=dt;const t=Math.min(1,j.age/j.life);try{j.update(t,dt,j.age);}catch(_){j.age=j.life;}if(j.age>=j.life){j.dispose();jobs.splice(i,1);}}
  renderer.render(scene,camera);
  if(jobs.length)raf=requestAnimationFrame(tick);else renderer.domElement.hidden=true;}
 function add(life,update,objects){const job={life,age:0,update,dispose(){for(const o of objects){scene.remove(o);o.geometry?.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m?.dispose());}}};
  for(const o of objects)scene.add(o);jobs.push(job);renderer.domElement.hidden=false;if(!raf){last=performance.now();raf=requestAnimationFrame(tick);}return job;}
 const ready=async()=>!reduced()&&!document.hidden&&!!(await init());
 const rectOf=el=>{const r=el?.getBoundingClientRect?.();return r&&r.height?r:null;};

 // ---- Debris: lit, tumbling 3D pieces with gravity. shape: chunk | sliver | needle | plate ----------------------
 function debris({x,y,count=24,shape='chunk',colors=[COLORS.ink],size=[5,12],speed=[220,520],dir=null,spread=Math.PI,gravity=900,life=1,lift=.5,zKick=260,originJitter=10}){
  const geo=shape==='sliver'?new T.ConeGeometry(.5,2.4,3):shape==='needle'?new T.OctahedronGeometry(.6):shape==='plate'?new T.BoxGeometry(1.6,1.1,.08):new T.DodecahedronGeometry(.7,0);
  if(shape==='sliver')geo.scale(1,1,.25);if(shape==='needle')geo.scale(.35,2.6,.35);
  const mat=new T.MeshStandardMaterial({flatShading:true,roughness:.55,metalness:.1,transparent:true,side:T.DoubleSide}),mesh=new T.InstancedMesh(geo,mat,count),m=new T.Matrix4(),q=new T.Quaternion(),c=new T.Color(),parts=[];
  for(let i=0;i<count;i++){const a=dir==null?rand(0,Math.PI*2):dir+rand(-spread/2,spread/2),v=rand(speed[0],speed[1]),s=rand(size[0],size[1]);
   parts.push({p:world(x+rand(-originJitter,originJitter),y+rand(-originJitter,originJitter),rand(-10,30)),v:new T.Vector3(Math.cos(a)*v,Math.sin(a)*v+v*lift,rand(-.3,1)*zKick),axis:new T.Vector3(rand(-1,1),rand(-1,1),rand(-1,1)).normalize(),spin:rand(4,14),ang:rand(0,6),s});
   mesh.setColorAt(i,c.setHex(pick(colors)));}
  mesh.instanceColor.needsUpdate=true;mesh.frustumCulled=false;const sv=new T.Vector3();
  return add(life,(t,dt)=>{for(let i=0;i<count;i++){const o=parts[i];o.v.y-=gravity*dt;o.v.multiplyScalar(1-.6*dt);o.p.addScaledVector(o.v,dt);o.ang+=o.spin*dt;q.setFromAxisAngle(o.axis,o.ang);const s=o.s*(t<.75?1:Math.max(0,1-(t-.75)/.25));m.compose(o.p,q,sv.set(s,s,s));mesh.setMatrixAt(i,m);}
   mesh.instanceMatrix.needsUpdate=true;mat.opacity=t<.6?1:1-(t-.6)/.4;},[mesh]);}
 // ---- Shock ring: a flat ring that expands, optionally tilted back like a ground shock ------------------------------
 function ring({x,y,color=COLORS.ink,from=10,to=120,width=.16,tilt=0,life=.5,delay=0,z=20}){
  const geo=new T.RingGeometry(1-width,1,48),mat=new T.MeshBasicMaterial({color,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}),mesh=new T.Mesh(geo,mat);mesh.position.copy(world(x,y,z));mesh.rotation.x=-tilt;
  return add(life+delay,(t,dt,age)=>{const k=Math.max(0,(age-delay)/life),e=1-Math.pow(1-k,3),s=from+(to-from)*e;mesh.scale.set(s,s,s);mat.opacity=k<=0?0:(1-k)*.9;},[mesh]);}
 // ---- Particles: shader points (soft discs) that follow a simple per-particle flow; used for fire, motes, blood ----
 function particles({x,y,w=80,h=20,count=90,life=1.5,rise=[120,260],drift=30,size=[10,26],ramp=[COLORS.ember,COLORS.fire,COLORS.red,0x3a3a38],loop=.7,gravity=0,swirl=1}){
  const geo=new T.BufferGeometry(),pos=new Float32Array(count*3),seed=new Float32Array(count*4);
  for(let i=0;i<count;i++){const p=world(x+rand(-w/2,w/2),y+rand(-h/2,h/2),rand(0,40));pos.set([p.x,p.y,p.z],i*3);seed.set([Math.random(),rand(rise[0],rise[1]),rand(-drift,drift),rand(size[0],size[1])],i*4);}
  geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('seed',new T.BufferAttribute(seed,4));
  const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uFade:{value:1},uLoop:{value:loop},uGravity:{value:gravity},uSwirl:{value:swirl},uScale:{value:renderer.getPixelRatio()},c0:{value:new T.Color(ramp[0])},c1:{value:new T.Color(ramp[1])},c2:{value:new T.Color(ramp[2])},c3:{value:new T.Color(ramp[3])}},
   vertexShader:`attribute vec4 seed;uniform float uTime,uLoop,uGravity,uSwirl,uScale;varying float vLife;
    void main(){float k=fract(uTime/uLoop+seed.x);vLife=k;float tt=k*uLoop;vec3 p=position;p.y+=seed.y*tt-uGravity*tt*tt;p.x+=seed.z*tt+sin(tt*9.+seed.x*40.)*6.*uSwirl;
     vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=seed.w*uScale*(1.-k*.7)*(sin(min(k*8.,1.57)));}`,
   fragmentShader:`uniform vec3 c0,c1,c2,c3;uniform float uFade;varying float vLife;
    void main(){vec2 d=gl_PointCoord-.5;float r=length(d);if(r>.5)discard;vec3 c=vLife<.33?mix(c0,c1,vLife/.33):vLife<.66?mix(c1,c2,(vLife-.33)/.33):mix(c2,c3,(vLife-.66)/.34);
     float a=smoothstep(.5,.2,r)*(1.-vLife*vLife)*uFade;gl_FragColor=vec4(c,a);}`});
  const pts=new T.Points(geo,mat);pts.frustumCulled=false;
  return add(life,(t,dt,age)=>{mat.uniforms.uTime.value=age;mat.uniforms.uFade.value=t<.12?t/.12:t>.7?1-(t-.7)/.3:1;},[pts]);}

 // ---- Flame: a procedural fire sheet (scrolling fractal noise shaped into tongues), white-hot core to red tips ----------
 function flame({x,y,w=160,h=140,life=1.6}){
  const geo=new T.PlaneGeometry(w,h),mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uFade:{value:0},uSeed:{value:rand(0,50)}},
   vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`precision highp float;varying vec2 vUv;uniform float uTime,uFade,uSeed;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
    void main(){vec2 uv=vUv;float t=uTime*1.6;
     float sway=(fbm(vec2(uv.y*2.5-t*.8,uSeed))-.5)*.22*uv.y;float xx=(uv.x-.5+sway)*2.;
     float n=fbm(vec2(uv.x*4.+uSeed,uv.y*3.2-t*2.2));float n2=fbm(vec2(uv.x*9.-uSeed,uv.y*7.-t*3.4));
     float body=1.-abs(xx)*(1.05+uv.y*.9);float heat=body+ (n-.5)*1.25+(n2-.5)*.45-uv.y*1.15*uFade-(1.-uFade)*1.2+.18;
     heat*=smoothstep(0.,.06,uv.y);if(heat<.08)discard;
     vec3 c=heat>.85?vec3(1.,.97,.82):heat>.6?mix(vec3(1.,.82,.25),vec3(1.,.97,.82),(heat-.6)/.25):heat>.34?mix(vec3(1.,.42,.06),vec3(1.,.82,.25),(heat-.34)/.26):mix(vec3(.64,.13,.1),vec3(1.,.42,.06),(heat-.08)/.26);
     gl_FragColor=vec4(c,smoothstep(.08,.16,heat));}`});
  const mesh=new T.Mesh(geo,mat);mesh.position.copy(world(x,y-h/2,30));
  return add(life,(t,dt,age)=>{mat.uniforms.uTime.value=age;mat.uniforms.uFade.value=t<.18?t/.18:t>.7?Math.max(0,1-(t-.7)/.3):1;},[mesh]);}
 // ---- Public effects --------------------------------------------------------------------------------------------------
 // A hit landing on a panel, by damage type.
 async function impact(type,target,power=0,blocked=false){if(!await ready())return;const r=rectOf(target);if(!r)return;const x=r.left+r.width*rand(.35,.65),y=r.top+r.height*rand(.35,.6),heavy=Math.min(1,Math.max(.3,power/30));
  if(blocked){debris({x,y,count:14,shape:'plate',colors:[COLORS.steel,0x8fb4c4,COLORS.paper],size:[4,8],speed:[160,340],life:.8});ring({x,y,color:COLORS.steel,to:70,life:.4});return;}
  if(type==='slash'){const a=rand(-.6,.6)+(Math.random()<.5?0:Math.PI);debris({x,y,count:Math.round(18+heavy*18),shape:'sliver',colors:[COLORS.ink,COLORS.red,COLORS.paper,COLORS.line],size:[5,11],speed:[300,720],dir:a,spread:.7,lift:.25,life:.95});debris({x,y,count:10,shape:'sliver',colors:[COLORS.red],size:[3,6],speed:[200,460],dir:a+Math.PI,spread:1,lift:.2,life:.8});}
  else if(type==='blunt'){debris({x,y,count:Math.round(16+heavy*16),shape:'chunk',colors:[COLORS.ink,0x55554f,COLORS.line,COLORS.gold],size:[5,13],speed:[220,560],lift:.7,zKick:420,life:1.1});ring({x,y:r.top+r.height*.8,color:COLORS.ink,to:r.width*.55,tilt:1.15,life:.55});ring({x,y:r.top+r.height*.8,color:COLORS.gold,to:r.width*.4,tilt:1.15,life:.5,delay:.08,width:.1});}
  else if(type==='pierce'||type==='gun'){const a=Math.random()<.5?0:Math.PI;debris({x,y,count:Math.round(14+heavy*12),shape:'needle',colors:[COLORS.ink,COLORS.steel,COLORS.paper],size:[4,9],speed:[420,900],dir:a,spread:.45,lift:.1,gravity:500,life:.8});ring({x,y,color:COLORS.steel,to:60,life:.35,width:.22});debris({x,y,count:8,shape:'plate',colors:[COLORS.line,COLORS.paper],size:[4,7],speed:[120,300],life:.9});}
  else{debris({x,y,count:20,shape:'chunk',colors:[COLORS.violet,COLORS.ink,COLORS.paper],size:[4,10],life:1});ring({x,y,color:COLORS.violet,to:90,life:.5});}}
 // A status landing on a panel.
 async function status(target,id){if(!await ready())return;const r=rectOf(target);if(!r)return;const cx=r.left+r.width/2,cy=r.top+r.height/2,base=r.top+r.height*.88;
  if(id==='burning'){flame({x:cx,y:r.bottom-4,w:Math.min(r.width*.85,300),h:Math.min(220,r.height*1.25),life:1.7});particles({x:cx,y:base-20,w:r.width*.5,h:10,count:26,life:1.6,rise:[120,r.height*1.6],size:[4,9],ramp:[COLORS.ember,COLORS.fire,COLORS.red,0x55554f],loop:.9});debris({x:cx,y:base,count:12,shape:'needle',colors:[COLORS.fire,COLORS.ember],size:[2,4],speed:[80,220],dir:Math.PI/2,spread:1.2,gravity:-120,lift:0,life:1.2});}
  else if(id==='rupture'){debris({x:cx,y:cy,count:22,shape:'plate',colors:[COLORS.rupture,COLORS.ink,COLORS.line],size:[5,11],speed:[120,380],lift:.5,life:1.1});ring({x:cx,y:cy,color:COLORS.rupture,to:r.height*.7,life:.45,width:.1});}
  else if(id==='bleeding'){particles({x:cx,y:r.top+r.height*.35,w:r.width*.4,h:6,count:40,life:1.3,rise:[-40,60],drift:50,size:[6,13],ramp:[0xc0172d,COLORS.blood,0x5e0711,0x3d0207],loop:1.1,gravity:260,swirl:0});}
  else if(id==='counter'||id==='shield'||id==='guarded'){ring({x:cx,y:cy,color:COLORS.steel,from:r.height*.9,to:r.height*.45,life:.5,width:.08});ring({x:cx,y:cy,color:COLORS.steel,from:r.height*.2,to:r.height*.6,life:.6,delay:.25,width:.14});debris({x:cx,y:cy,count:10,shape:'plate',colors:[COLORS.steel,0x8fb4c4],size:[4,7],speed:[80,200],lift:.6,life:.9});}
  else if(id==='regeneration'||id==='heal'){particles({x:cx,y:base,w:r.width*.6,h:r.height*.3,count:50,life:1.4,rise:[60,160],size:[6,14],ramp:[0xd9f5e4,COLORS.heal,COLORS.heal,0x2c6b4b],loop:1});}
  else if(id==='paralysis'){debris({x:cx,y:cy,count:16,shape:'needle',colors:[0xf2c94c,COLORS.ink],size:[3,6],speed:[200,520],gravity:200,lift:0,life:.6});}
  else if(id==='sinking'){particles({x:cx,y:r.top+r.height*.2,w:r.width*.7,h:10,count:50,life:1.4,rise:[-120,-50],size:[8,18],ramp:[0x8fbfe8,0x3f7fb4,0x1f4f80,0x163a5e],loop:1.1,swirl:.6});}}
 // An enemy panel breaking apart on death.
 async function shatter(target){if(!await ready())return;const r=rectOf(target);if(!r)return;for(let i=0;i<3;i++)debris({x:r.left+r.width*(.25+i*.25),y:r.top+r.height/2,count:20,shape:'plate',colors:[COLORS.paper,COLORS.line,COLORS.ink,COLORS.red],size:[7,16],speed:[120,460],lift:.6,zKick:380,originJitter:r.height*.35,life:1.3});ring({x:r.left+r.width/2,y:r.top+r.height/2,color:COLORS.red,to:r.width*.7,life:.6,width:.06});}
 // Battle start: a wall of tiles flips shut across the screen and open again, staggered along the diagonal.
 async function transition(label='戰鬥開始',sub='ENCOUNTER'){if(!await ready())return 0;const cols=Math.max(5,Math.round(W/80)),size=W/cols,rows=Math.ceil(H/size)+1,count=cols*rows,life=1.25;
  const geo=new T.BoxGeometry(size*.985,size*.985,6),mat=new T.MeshStandardMaterial({roughness:.6,metalness:.15}),mesh=new T.InstancedMesh(geo,mat,count),m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),c=new T.Color(),one=new T.Vector3(1,1,1),cells=[];
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const k=j*cols+i;cells.push({p:world(i*size+size/2,j*size+size/2,0),d:(i/cols+j/rows)*.32});mesh.setColorAt(k,c.setHex(Math.random()<.1?COLORS.red:Math.random()<.05?COLORS.gold:(i+j)%2?0x1f1f1d:0x262624));}
  mesh.instanceColor.needsUpdate=true;mesh.frustumCulled=false;
  const tag=document.createElement('div');tag.className='three-fx-title';tag.setAttribute('aria-hidden','true');tag.innerHTML=`<small></small><b></b>`;tag.querySelector('small').textContent=sub;tag.querySelector('b').textContent=label;document.body.appendChild(tag);setTimeout(()=>tag.remove(),life*1000+80);
  add(life,(t,dt,age)=>{for(let k=0;k<count;k++){const o=cells[k],a=(age-o.d)/.3,b=(age-o.d-.62)/.3,rot=a<1?(1-Math.max(0,Math.min(1,a)))*Math.PI/2:Math.max(0,Math.min(1,b))*-Math.PI/2,sc=a<=0||b>=1?0.0001:1;q.setFromEuler(e.set(rot,rot*.35,0));m.compose(o.p,q,one.clone().multiplyScalar(sc));mesh.setMatrixAt(k,m);}mesh.instanceMatrix.needsUpdate=true;},[mesh]);return life*1000;}
 // Victory: gold and red paper tumbling down.
 async function confetti(){if(!await ready())return;for(let i=0;i<4;i++)debris({x:W*(.15+i*.23),y:-10,count:26,shape:'plate',colors:[COLORS.gold,0xd9b46a,COLORS.red,COLORS.paper],size:[6,12],speed:[40,260],dir:-Math.PI/2,spread:2.2,lift:0,gravity:260,zKick:300,originJitter:W*.1,life:2.2});}

 // Battle start / victory are detected from room updates (skipping the first one after load, e.g. a reconnect mid-fight).
 let seen=false,hadCombat=false,wasEnded=false;
 function watch(room){const c=room?.combat,active=!!c&&!c.ended;if(seen){if(active&&!hadCombat)transition(c.kind==='boss'?'BOSS 戰':c.kind==='elite'?'精英戰':'戰鬥開始',c.kind==='boss'?'WARNING':'ENCOUNTER');if(c?.ended&&!wasEnded&&hadCombat&&(room.players||[]).some(p=>p.hp>0))confetti();}seen=true;hadCombat=active;wasEnded=!!c?.ended;}
 if(typeof socket!=='undefined')socket.on('room:update',watch);
 window.KBMThree={flame:async o=>(await ready())&&flame(o),impact,status,shatter,transition,confetti,debris:async o=>(await ready())&&debris(o),ring:async o=>(await ready())&&ring(o),particles:async o=>(await ready())&&particles(o)};
})();
