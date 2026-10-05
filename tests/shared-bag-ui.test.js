const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nodes=[];class Element{constructor(){this.parentNode=null;this.open=false;nodes.push(this);}appendChild(e){e.remove();e.parentNode=this;}after(e){e.remove();e.parentNode=this.parentNode;}remove(){this.parentNode=null;}contains(e){for(;e;e=e.parentNode)if(e===this)return true;return false;}querySelectorAll(){return [];}querySelector(){return this.grid;}closest(){return this.fold;}}
const page=new Element(),outer=new Element(),root=new Element(),grid=new Element();page.appendChild(outer);outer.appendChild(root);root.grid=grid;root.appendChild(grid);grid.fold=outer;
const document={querySelectorAll:()=>nodes.filter(n=>n.parentNode&&n.className==='inventory-fold shared-inventory-fold'),createElement:()=>new Element()};
const source=fs.readFileSync('client/js/ui/equipment-ui.js','utf8'),start=source.indexOf('  function sharedBag('),end=source.indexOf('\n  function modsText',start),context={document,esc:s=>s,action(){}};vm.runInNewContext(source.slice(start,end)+';this.render=sharedBag;',context);
// Reproduce old fields as siblings outside #mySinner, with one expanded.
for(let i=0;i<6;i++){const old=new Element();old.className='inventory-fold shared-inventory-fold';outer.appendChild(old);old.open=i===2;}
const room={sharedInventory:[]},player={inventory:[]};for(let i=0;i<30;i++){context.render(room,player,root);const folds=document.querySelectorAll();assert.equal(folds.length,1);assert.equal(folds[0].parentNode,root);assert(folds[0].open);}
// Also handle an actual consumables fold inside the sinner root.
const inner=new Element();root.appendChild(inner);grid.fold=inner;context.render(room,player,root);assert.equal(document.querySelectorAll().length,1);assert.equal(document.querySelectorAll()[0].parentNode,root);
console.log('Shared bag UI passed: repeated updates retain one fold, old external duplicates removed, expanded state preserved, both nested and external consumables containers handled.');
