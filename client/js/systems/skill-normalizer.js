(()=>{
  function normalize(){
    for(const skill of state?.gameData?.sinnerSkills||[]){
      if(['heal','team-buff'].includes(skill.kind)){delete skill.damageType;delete skill.soundType;}
    }
  }
  socket.on('room:update',normalize);
  requestAnimationFrame(normalize);
  window.KBMSkillNormalizer={normalize};
})();
