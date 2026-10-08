import React from 'react';
import {createRoot} from 'react-dom/client';
import {Toaster,toast} from 'sonner';
const mount=document.createElement('div');mount.id='notificationRoot';document.body.appendChild(mount);
createRoot(mount).render(<Toaster theme="light" position="bottom-right" closeButton visibleToasts={3} toastOptions={{duration:4500,className:'expedition-toast'}}/>);
const message=(text,description='',kind='message')=>toast[kind]?.(text,{description:description||undefined})||toast(text,{description});
window.KBMToast={message,success:(text,description)=>message(text,description,'success'),error:(text,description)=>message(text,description,'error')};
let roomId=null,previousResult=null;
socket.on('room:update',room=>{const key=room.eventResult?JSON.stringify(room.eventResult):null;if(roomId!==room.id){roomId=room.id;previousResult=key;return;}if(!key){previousResult=null;return;}if(previousResult===key)return;previousResult=key;
 const result=room.eventResult,loot=result.degree==='personal'?result.personalResults?.find(r=>r.playerId===state.selfId)?.loot:result.lootByPlayer?.[state.selfId]||result.loot;
 if(loot){const text=loot.type==='gold'?`取得 ${loot.amount} 金幣`:`取得${{equipment:'裝備',card:'卡牌',consumable:'消耗品'}[loot.type]||'獎勵'}：${loot.item?.name||'補給'}`;
 const show=()=>window.KBMToast.success(text,'詳細內容已保留在事件結算。');if(window.KBMDice?.enabled()&&window.KBMDice?.isPlaying())window.KBMDice.whenIdle().then(show);else requestAnimationFrame(()=>{if(window.KBMDice?.eventPending(room))window.KBMDice.whenIdle().then(show);else show();});}
});
