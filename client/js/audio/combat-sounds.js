(function(){
  const A=()=>window.GameAudio;
  const sfx={
    slash(){A()?.noise(.075,.025,0,2600);A()?.tone(920,.055,'sawtooth',.018,-520,.01)},
    blunt(){A()?.noise(.12,.045,0,700);A()?.tone(115,.11,'square',.03,-35)},
    pierce(){A()?.tone(1180,.045,'triangle',.026,-620);A()?.noise(.045,.012,.015,3200)},
    gun(){A()?.noise(.075,.06,0,1800);A()?.tone(145,.06,'square',.04,-70);A()?.noise(.12,.022,.06,900)},
    anomaly(){A()?.tone(310,.16,'sawtooth',.018,240);A()?.tone(520,.2,'sine',.016,-300,.03)},
    shieldBreak(){A()?.noise(.22,.055,0,2400);A()?.tone(260,.07,'square',.035,-150);A()?.tone(105,.15,'square',.022,-35,.08)},
    bossWarning(){A()?.tone(285,.18,'sawtooth',.028,65);A()?.tone(210,.22,'sawtooth',.03,-30,.17)},
    miss(){A()?.tone(490,.075,'sine',.018,-190)},
    hurt(){A()?.noise(.14,.04,0,650);A()?.tone(92,.13,'sawtooth',.018,-22)},
    victory(){[523,659,784,1047].forEach((f,i)=>A()?.tone(f,.22,'triangle',.035,30,i*.105))}
  };
  window.GameCombatSounds=sfx;
  let lastSerial=null,lastCombatKey='';
  function typeForRecord(record){const type=record?.damageType||record?.attackType;return ['slash','blunt','pierce'].includes(type)?type:null;}
  function soundPlayer(record){if(!record?.dealt)return sfx.miss();const type=typeForRecord(record);if(type)return sfx[type]();const label=String(record?.action||'');if(/火銃|槍擊|射擊|彈/.test(label))return sfx.gun();if(/E\.G\.O|怪異|異常/.test(label))return sfx.anomaly();sfx.slash();}
  function onRoom(room){
    const combat=room?.combat;if(!combat)return;
    const key=`${room.id}:${room.exploration?.position}:${combat.kind}`;
    if(key!==lastCombatKey){lastCombatKey=key;if(combat.kind==='boss')setTimeout(sfx.bossWarning,100);}
    const resolution=combat.lastResolution;if(!resolution?.serial||resolution.serial===lastSerial)return;lastSerial=resolution.serial;
    let delay=100;for(const record of resolution.players||[]){setTimeout(()=>soundPlayer(record),delay);delay+=760;}
    for(const enemy of resolution.enemyResults||[]){setTimeout(()=>enemy.blocked?sfx.shieldBreak():enemy.damage>0?sfx.hurt():sfx.miss(),delay);delay+=800;}
    for(const phase of resolution.phaseTransitions||[])setTimeout(sfx.bossWarning,Math.max(0,delay-250));
    if(resolution.victory)setTimeout(sfx.victory,delay+120);
  }
  socket.on('room:update',onRoom);requestAnimationFrame(()=>state?.room&&onRoom(state.room));
})();
