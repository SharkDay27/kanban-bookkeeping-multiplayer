(()=>{
  const SESSION_KEY='kanban-bookkeeping-multiplayer-v0.15-session';
  const LEGACY_KEY='kanban-bookkeeping-multiplayer-v0.7-session';
  const PLAYER_KEY='kanban-bookkeeping-multiplayer-player-name';
  function read(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||localStorage.getItem(LEGACY_KEY)||'null')}catch(_){return null}}
  function write(data){if(!data)return;localStorage.setItem(SESSION_KEY,JSON.stringify(data));localStorage.removeItem(LEGACY_KEY);}
  function clear(){localStorage.removeItem(SESSION_KEY);localStorage.removeItem(LEGACY_KEY);}
  function playerName(){return localStorage.getItem(PLAYER_KEY)||'';}
  function setPlayerName(name){localStorage.setItem(PLAYER_KEY,String(name||''));}
  function persistentToken(){return read()?.reconnectToken||crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;}
  window.KBMSession={read,write,clear,playerName,setPlayerName,persistentToken};
})();