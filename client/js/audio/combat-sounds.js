(()=>{
  const A=()=>window.GameAudio;
  const t=(...a)=>A()?.tone(...a),n=(...a)=>A()?.noise(...a);
  const sfx={
    // Blade: a fast air whoosh, the cut itself, then a thin metallic ring.
    slash(){n(.16,.16,0,1800,{type:'bandpass',to:6200,q:.8});n(.05,.22,.07,5200,{type:'highpass'});t(2600,.18,'triangle',.05,-700,.08);t(3900,.12,'sine',.03,-900,.09)},
    // Blunt: a deep body thump with a pitch drop, a crunch of debris and a short knock on top.
    blunt(){t(140,.32,'sine',.32,-95);t(70,.4,'sine',.22,-25,.01);n(.22,.34,0,520);n(.12,.16,.02,2400,{type:'bandpass',q:1.2});t(190,.06,'square',.06,-80)},
    // Gun: a sharp crack, the muzzle boom, a low tail and a casing tinkling a moment later.
    pierce(){sfx.gun();},
    gun(){n(.035,.42,0,3200,{type:'highpass'});n(.2,.3,0,1100);t(170,.16,'square',.1,-110);n(.42,.08,.04,380);t(3300,.05,'triangle',.03,-200,.24);t(2900,.05,'triangle',.022,-200,.33)},
    anomaly(){t(310,.22,'sawtooth',.06,240);t(520,.26,'sine',.05,-300,.03);n(.2,.06,0,900,{type:'bandpass',q:4})},
    // Shield: a rising shimmer as the barrier unfolds.
    shield(){t(380,.36,'sine',.07,520);t(760,.32,'triangle',.05,700,.05);n(.3,.07,0,900,{type:'bandpass',to:5200,q:2});t(1520,.22,'sine',.025,0,.22)},
    blocked(){t(880,.16,'triangle',.09,-120);t(1320,.12,'triangle',.06,-160,.01);n(.06,.12,0,2600,{type:'bandpass',q:3})},
    shieldBreak(){n(.28,.22,0,3000,{type:'highpass'});[2400,3100,1900,3600].forEach((f,i)=>t(f,.12,'triangle',.04,-600,i*.03));t(260,.12,'square',.08,-150);t(105,.2,'square',.05,-35,.08)},
    bossWarning(){t(285,.18,'sawtooth',.06,65);t(210,.22,'sawtooth',.065,-30,.17)},
    hurt(){n(.14,.1,0,650);t(92,.13,'sawtooth',.05,-22)},
    victory(){[523,659,784,1047].forEach((f,i)=>t(f,.22,'triangle',.07,30,i*.105))},
    diceRoll(){[0,.07,.16,.27,.4,.55].forEach((d,i)=>n(.022,.05+i*.006,d,2600+i*200))},
    diceLand(){n(.035,.07,0,1500);t(560,.05,'triangle',.04,-180)},
    diceClash(){t(1480,.08,'square',.035,-760);n(.09,.08,0,4200);t(740,.12,'triangle',.035,-260,.03)},
    attack(type){if(type&&typeof sfx[type]==='function')return sfx[type]();return sfx.anomaly();}
  };
  window.GameCombatSounds=sfx;
  window.KBMCombatSounds=sfx;
})();
