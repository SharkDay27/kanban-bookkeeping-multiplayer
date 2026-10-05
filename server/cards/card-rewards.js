const C=require('../../shared/cards');
const Cards=require('./card-manager');
function choices(room,p){const pool=[...C.rewardPool(p.sinnerId)],pick=require('../expedition/danger-system').pickReward,result=[];for(let i=0;i<3&&pool.length;i++){const card=pick(pool,room.exploration.danger,p,room.areaIndex);result.push(card);pool.splice(pool.indexOf(card),1);}return result;}
function createChoices(room){room.cardChoices={};for(const p of room.players.filter(p=>p.connected&&p.hp>0)){if(Cards.ensureCollection(p).length>=24)continue;room.cardChoices[p.id]=choices(room,p).map(c=>c.id);}return room.cardChoices;}
function pending(room){return room.players.some(p=>p.connected&&room.cardChoices?.[p.id]?.length);}
function choose(room,player,cardId){const choices=room.cardChoices?.[player.id];if(!choices?.length||cardId!==null&&!choices.includes(cardId))throw new Error('這張牌不在本次獎勵中。');if(room.combat&&!room.combat.ended)throw new Error('請先完成戰鬥。');const card=cardId===null?null:Cards.grantCard(player,cardId);if(cardId!==null&&!card)throw new Error('遠征牌組已達上限，請略過獎勵。');delete room.cardChoices[player.id];if(card){room.eventResult.cardLootByPlayer=room.eventResult.cardLootByPlayer||{};room.eventResult.cardLootByPlayer[player.id]=card;}require('../room/room-manager').persist();return card;}
module.exports={createChoices,pending,choose};
