(()=>{
  function normalize(){
    for(const skill of state?.gameData?.sinnerSkills||[]){
      if(skill.kind==='heal'){delete skill.damageType;delete skill.soundType;}
    }
  }
  socket.on('room:update',normalize);
  requestAnimationFrame(normalize);
  window.KBMSkillNormalizer={normalize};
})();
