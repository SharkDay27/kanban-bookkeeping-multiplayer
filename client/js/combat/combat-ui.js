// Transitional combat UI loader. Versioned files remain implementation details until their logic is fully migrated.
(function(){
  const files=['/js/v10-ui.js','/js/v10-fixes.js','/js/v11-combat-ui.js','/js/v12-combat-state.js'];
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
  (async()=>{for(const file of files){try{await load(file);}catch(error){console.error('Combat UI module load failed:',file,error);break;}}})();
})();
