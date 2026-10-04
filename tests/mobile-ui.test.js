const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const C=require('../shared/cards');
function button(){return {disabled:false,textContent:'',classList:{toggle(){}},addEventListener(name,fn){this[name]=fn;}};}
// A server update must not replace the touch target or allow duplicate confirmation requests.
{
 let nodes=null,writes=0,request;
 const root={set innerHTML(value){writes++;nodes={confirm:button(),cancel:button(),note:{}};},querySelector(sel){return nodes?sel==='#confirmCombat'?nodes.confirm:sel==='#cancelCombatConfirm'?nodes.cancel:nodes.note:null;},setAttribute(){}};
 const room={id:'A',phase:'exploration',players:[{id:'p',hp:100}],combat:{round:1,selections:{p:{picks:[{uid:'x'}]}}}};
 const state={selfId:'p',room};
 const context={KBMCards:C,escapeHtml:String,state,document:{getElementById:()=>root},window:{},socket:{emit(...args){request=args;}},alert(){}};
 vm.runInNewContext(fs.readFileSync('client/js/combat/card-ui.js','utf8'),context);
 const ui=context.window.KBMCardUI;ui.confirm(room);const original=nodes.confirm;
 for(let i=0;i<10;i++)ui.confirm(room);
 assert.equal(writes,1);assert.equal(nodes.confirm,original);
 original.click({currentTarget:original});assert.equal(request[0],'combat:confirm');assert(original.disabled);
 const first=request;original.click({currentTarget:original});assert.equal(request,first);
 first[2]({ok:true});assert(!original.disabled);
 state.room={...room,id:'B',combat:{round:2,selections:{p:{confirmed:true,picks:[]}}}};ui.confirm(state.room);
 nodes.cancel.click({currentTarget:nodes.cancel});assert.equal(request[0],'combat:cancel-confirm');assert.equal(request[1].roomId,'B');
 request[2]({ok:true});assert.equal(nodes.confirm,original);
}
// Selection/party updates must leave route layout and page scroll untouched.
{
 let writes=0,centers=0;
 const scroller={scrollLeft:0,getBoundingClientRect:()=>({left:0,width:300})};
 const node={getBoundingClientRect(){centers++;return {left:500,width:60};},scrollIntoView(){throw Error('Must not scroll the page');}};
 const panel={set innerHTML(value){writes++;},querySelector(sel){return sel==='.route-scroll'?scroller:node;}};
 const context={state:{},window:{},document:{getElementById:id=>id==='routePanel'?panel:null},socket:{on(){}},requestAnimationFrame:fn=>fn()};
 vm.runInNewContext(fs.readFileSync('client/js/ui/expedition-ui.js','utf8'),context);
 const room={id:'A',run:1,areaIndex:0,exploration:{position:0,difficultyLabel:'初級',route:[{selected:true,resolved:false,label:'小怪',type:'combat'}]}};
 const ui=context.window.KBMExpeditionUI;ui.renderRoute(room);const left=scroller.scrollLeft;
 for(let i=0;i<10;i++)ui.renderRoute({...room,combat:{selections:{p:{picks:Array(i)}}}});
 assert.equal(writes,1);assert.equal(centers,1);assert.equal(scroller.scrollLeft,left);
 ui.renderRoute({...room,exploration:{...room.exploration,position:1}});assert.equal(writes,2);assert.equal(centers,2);
}
console.log('Mobile UI regression checks passed: stable confirmation, duplicate prevention, current room and horizontal-only route updates.');
