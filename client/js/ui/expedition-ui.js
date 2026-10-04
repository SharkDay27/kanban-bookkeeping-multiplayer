// Transitional expedition/event UI loader.
(function(){
  const files=['/js/v083-ui.js','/js/v09-ui.js'];
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
  (async()=>{for(const file of files){try{await load(file);}catch(error){console.error('Expedition UI module load failed:',file,error);break;}}})();
})();
