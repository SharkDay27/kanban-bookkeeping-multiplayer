(()=>{
 const mobile=window.matchMedia('(max-width:640px)'),reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
 const button=document.createElement('button');button.id='mobileBackToTop';button.type='button';button.hidden=true;button.setAttribute('aria-label','回到頁面頂端');button.innerHTML='<span aria-hidden="true">↑</span><small>置頂</small>';document.body.appendChild(button);
 let scheduled=false;function update(){scheduled=false;button.hidden=!mobile.matches||window.scrollY<240;}
 window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}},{passive:true});mobile.addEventListener('change',update);
 button.onclick=()=>window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});update();
})();
