(()=>{
  const A=()=>window.GameAudio;
  const sfx={
    slash(){A()?.noise(.075,.025,0,2600);A()?.tone(920,.055,'sawtooth',.018,-520,.01)},
    blunt(){A()?.noise(.12,.045,0,700);A()?.tone(115,.11,'square',.03,-35)},
    pierce(){A()?.tone(1180,.045,'triangle',.026,-620);A()?.noise(.045,.012,.015,3200)},
    gun(){A()?.noise(.075,.06,0,1800);A()?.tone(145,.06,'square',.04,-70);A()?.noise(.12,.022,.06,900)},
    anomaly(){A()?.tone(310,.16,'sawtooth',.018,240);A()?.tone(520,.2,'sine',.016,-300,.03)},
    shieldBreak(){A()?.noise(.22,.055,0,2400);A()?.tone(260,.07,'square',.035,-150);A()?.tone(105,.15,'square',.022,-35,.08)},
    bossWarning(){A()?.tone(285,.18,'sawtooth',.028,65);A()?.tone(210,.22,'sawtooth',.03,-30,.17)},
    blocked(){A()?.tone(490,.075,'sine',.018,-190)},
    hurt(){A()?.noise(.14,.04,0,650);A()?.tone(92,.13,'sawtooth',.018,-22)},
    victory(){[523,659,784,1047].forEach((f,i)=>A()?.tone(f,.22,'triangle',.035,30,i*.105))},
    attack(type){if(type&&typeof sfx[type]==='function')return sfx[type]();return sfx.anomaly();}
  };
  window.GameCombatSounds=sfx;
  window.KBMCombatSounds=sfx;
})();