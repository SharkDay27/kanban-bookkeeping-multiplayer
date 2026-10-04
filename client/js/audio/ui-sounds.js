(function(){
  function tone(...args){window.GameAudio?.tone?.(...args);}
  const sounds={
    click(){tone(520,.045,'sine',.018,70)},
    select(){tone(620,.065,'triangle',.025,140)},
    confirm(){tone(540,.06,'triangle',.03,120);tone(760,.08,'triangle',.025,90,.055)},
    cancel(){tone(360,.08,'sine',.022,-90)}
  };
  window.GameUISounds=sounds;
  document.addEventListener('click',event=>{
    if(event.target.closest('#sfxToggle,#sfxVolume'))return;
    if(event.target.closest('[data-v10-part]')){sounds.select();return;}
    if(event.target.closest('#v10Confirm')){sounds.confirm();return;}
    if(event.target.closest('#v10CancelConfirm')){sounds.cancel();return;}
    if(event.target.closest('button:not(:disabled)'))sounds.click();
  },true);
})();
