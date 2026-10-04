(function(){
  let volume=Math.max(0,Math.min(1,Number(localStorage.getItem('kbm-sfx-volume')??0.55)));
  if(localStorage.getItem('kbm-sfx')==='off'){volume=0;localStorage.setItem('kbm-sfx-volume','0');}localStorage.removeItem('kbm-sfx');
  let ctx=null,master=null;
  function context(){
    if(volume<=0)return null;
    if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C();master=ctx.createGain();master.gain.value=volume;master.connect(ctx.destination);}
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx;
  }
  function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));localStorage.setItem('kbm-sfx-volume',String(volume));if(master)master.gain.value=volume;renderControls();}
  function tone(freq=440,dur=.07,type='sine',gain=.035,slide=0,delay=0){const c=context();if(!c||!master)return;const now=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),now+dur);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(gain,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+dur);o.connect(g);g.connect(master);o.start(now);o.stop(now+dur+.02);}
  function noise(dur=.08,gain=.025,delay=0,filterFreq=0){const c=context();if(!c||!master)return;const len=Math.max(1,Math.floor(c.sampleRate*dur)),buf=c.createBuffer(1,len,c.sampleRate),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);const src=c.createBufferSource(),g=c.createGain();src.buffer=buf;g.gain.setValueAtTime(gain,c.currentTime+delay);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+delay+dur);src.connect(g);if(filterFreq){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=filterFreq;g.connect(f);f.connect(master);}else g.connect(master);src.start(c.currentTime+delay);}
  function ensureControls(){
    const bar=document.querySelector('.save-audio-row');if(!bar)return;
    let wrap=document.getElementById('sfxControls');if(wrap)return;
    wrap=document.createElement('div');wrap.id='sfxControls';wrap.className='v14-audio-controls';wrap.innerHTML='<label class="v14-volume"><span>音量</span><input id="sfxVolume" type="range" min="0" max="100" step="1"></label>';bar.appendChild(wrap);
    wrap.querySelector('#sfxVolume').addEventListener('input',e=>setVolume(Number(e.target.value)/100));renderControls();
  }
  function renderControls(){const v=document.getElementById('sfxVolume');if(v)v.value=String(Math.round(volume*100));}
  window.GameAudio={context,tone,noise,setVolume,get enabled(){return volume>0;},get volume(){return volume;},ensureControls};
  document.addEventListener('pointerdown',()=>context(),{once:true,capture:true});
  requestAnimationFrame(ensureControls);
})();
