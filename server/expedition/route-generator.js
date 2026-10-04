const {NODE_LABELS,BOSS_INDEX,persist}=require('../room-manager');
const {chooseNextNodeType}=require('./danger-system');

function choiceCount(index){if(index===BOSS_INDEX)return 1;return Math.random()<.46?3:2;}
function makeChoice(index,type,order){return {id:`L${index}-${order}-${type}`,type,label:NODE_LABELS[type]||type,revealed:true};}
function generateChoiceLayer(room,index){
  if(index<0||index>BOSS_INDEX)return [];
  if(room.exploration.choiceLayers[index]?.length)return room.exploration.choiceLayers[index];
  if(index===BOSS_INDEX){room.exploration.choiceLayers[index]=[makeChoice(index,'boss',0)];return room.exploration.choiceLayers[index];}
  const count=choiceCount(index),types=[];
  for(let i=0;i<count;i++){
    let type=chooseNextNodeType(room,index,types);
    if(!type||types.includes(type))type='event';
    types.push(type);
  }
  room.exploration.choiceLayers[index]=types.map((type,i)=>makeChoice(index,type,i));
  return room.exploration.choiceLayers[index];
}
function prepareInitialRoute(room){room.exploration.choiceLayers={};room.routeVotes={};generateChoiceLayer(room,0);generateChoiceLayer(room,1);persist();}
function primeFogAfterResolution(room){const index=Number(room.exploration.position||0)+2;if(index<=BOSS_INDEX)generateChoiceLayer(room,index);persist();}
module.exports={choiceCount,makeChoice,generateChoiceLayer,prepareInitialRoute,primeFogAfterResolution};
