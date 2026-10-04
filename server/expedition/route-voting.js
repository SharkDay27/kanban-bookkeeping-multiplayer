const {BOSS_INDEX,persist}=require('../room-manager');
const {generateChoiceLayer}=require('./route-generator');

function targetChoiceIndex(room){
  const pos=Number(room.exploration.position||0),node=room.exploration.route[pos];
  if(node?.selected&&!node?.resolved)return null;
  if(node?.selected&&node?.resolved)return pos+1<=BOSS_INDEX?pos+1:null;
  return pos;
}
function currentChoiceLayer(room){const index=targetChoiceIndex(room);if(index===null)return {index:null,choices:[]};return {index,choices:generateChoiceLayer(room,index)};}
function resolveRouteVote(room,player,choiceId){
  const {index,choices}=currentChoiceLayer(room);
  if(index===null)throw new Error('目前節點尚未完成，不能選擇下一條路。');
  const choice=choices.find(c=>c.id===choiceId);if(!choice)throw new Error('這個路線選項不存在。');
  room.routeVotes[player.id]=choiceId;
  const voters=room.players.filter(p=>p.connected);
  if(voters.some(p=>!room.routeVotes[p.id])){persist();return {resolved:false,index};}
  const counts=new Map();for(const p of voters){const id=room.routeVotes[p.id];counts.set(id,(counts.get(id)||0)+1);}
  const max=Math.max(...counts.values()),tied=[...counts.entries()].filter(([,n])=>n===max).map(([id])=>id);
  const winner=tied.length===1?tied[0]:tied[Math.floor(Math.random()*tied.length)];
  const selected=choices.find(c=>c.id===winner)||choice,node=room.exploration.route[index];
  node.type=selected.type;node.label=selected.label;node.revealed=true;node.selected=true;node.resolved=false;
  room.exploration.position=index;room.routeVotes={};persist();
  return {resolved:true,index,node,choice:selected,tied:tied.length>1};
}
function routeVoteSummary(room){const {index,choices}=currentChoiceLayer(room),counts={};for(const c of choices)counts[c.id]=0;for(const id of Object.values(room.routeVotes||{}))if(Object.prototype.hasOwnProperty.call(counts,id))counts[id]+=1;return {index,choices,counts};}
module.exports={targetChoiceIndex,currentChoiceLayer,resolveRouteVote,routeVoteSummary};
