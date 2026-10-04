(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function ensure(){
    if(document.getElementById('manualMenuToggle'))return;
    const toggle=document.createElement('button');toggle.id='manualMenuToggle';toggle.className='manual-menu-toggle';toggle.setAttribute('aria-label','開啟選單');toggle.innerHTML='<i></i><i></i><i></i>';
    const backdrop=document.createElement('div');backdrop.id='manualBackdrop';backdrop.className='manual-backdrop hidden';
    const drawer=document.createElement('aside');drawer.id='manualDrawer';drawer.className='manual-drawer';drawer.setAttribute('aria-hidden','true');
    drawer.innerHTML=`<div class="manual-drawer-head"><div><span>EXPEDITION GUIDE</span><strong>遠征選單</strong></div><button id="manualClose" aria-label="關閉選單">×</button></div><nav class="manual-nav"><button class="active" data-manual-tab="guide">教學手冊</button></nav><div id="manualContent" class="manual-content"></div>`;
    document.body.append(toggle,backdrop,drawer);
    const close=()=>{drawer.classList.remove('open');backdrop.classList.add('hidden');drawer.setAttribute('aria-hidden','true');};
    const open=()=>{render();drawer.classList.add('open');backdrop.classList.remove('hidden');drawer.setAttribute('aria-hidden','false');};
    toggle.onclick=()=>drawer.classList.contains('open')?close():open();backdrop.onclick=close;drawer.querySelector('#manualClose').onclick=close;
  }
  function statusRows(){const list=state?.gameData?.statusEffects||[];if(!list.length)return '<p>進入房間後會在這裡顯示目前所有狀態效果。</p>';return `<div class="manual-status-list">${list.map(s=>`<div class="manual-status ${esc(s.type)}"><b>${esc(s.name)}</b><span>${esc(s.type==='buff'?'增益':'負面')}</span><p>${esc(s.description)}</p></div>`).join('')}</div>`;}
  function sinnerRows(){const list=state?.gameData?.sinners||[];return `<div class="manual-sinner-colors">${list.map(s=>`<span style="--manual-color:${esc(s.color||'#999')}"><i></i>${esc(s.name)}</span>`).join('')}</div>`;}
  function section(title,body,open=false){return `<details class="manual-section" ${open?'open':''}><summary>${esc(title)}</summary><div>${body}</div></details>`;}
  function render(){const root=document.getElementById('manualContent');if(!root)return;root.innerHTML=[
    section('第一次玩：我要做什麼？',`<p>一場遠征會依序通過三張地圖：初級 → 中級 → 高級。每張地圖共有 14 層，第 14 層固定為 Boss。</p><p>每一層通常會提供 2～3 條路線。隊伍投票決定要去哪裡；有明確高票就採高票，完全平票則由伺服器隨機決定。</p><p>目標是在資源耗盡前逐步建立裝備、消耗品與技能配置，擊敗第三張地圖的 Boss。</p>`,true),
    section('四大屬性',`<div class="manual-stat-grid"><article><b>戰鬥</b><p>用於強行制壓、近戰判定與多數直接傷害技能。越高通常代表正面戰鬥能力越強。</p></article><article><b>觀察</b><p>辨識異常規律、弱點、陷阱與事件線索。也會影響部分精準型技能。</p></article><article><b>機動</b><p>閃避、穿越地形、快速突入與部分高速技能使用的能力。</p></article><article><b>穩定</b><p>承受壓力、固定危險源、防禦與部分治療／支援技能的能力。</p></article></div><p class="manual-note">裝備與狀態效果會讓四大屬性暫時或長期上升／下降。</p>`),
    section('斬擊／鈍擊／突擊',`<p>所有敵人都有三種物理耐性。倍率高於 1 代表弱點，低於 1 代表抗性。</p><div class="manual-damage-types"><span>斬擊：適合軟質、接縫、纜線</span><span>鈍擊：適合甲殼、機械、結構體</span><span>突擊：適合狹小核心、深層弱點</span></div><p>雙屬性武器會直接顯示兩個不同攻擊選項，請依敵方倍率選擇。</p>`),
    section('節點與迷霧',`<div class="manual-node-grid"><span class="event">事件</span><span class="combat">小怪</span><span class="supply">補給</span><span class="elite">精英</span><span class="rest">休整</span><span class="shop">商店</span><span class="boss">BOSS</span></div><p>下一層的候選節點會直接顯示；更深層仍在迷霧中。當前節點結算後的危險度變化，主要影響下下層以後的節點生成。</p>`),
    section('危險度',`<p>危險度越高，事件 DC、敵人威脅與精英出現機率越高；同時稀有裝備、稀有消耗品與高品質增益的機率也會提高。</p><p>高危險不是單純的懲罰，而是用更高風險換取更快的 Build 成長。</p>`),
    section('戰鬥流程',`<ol><li>先查看敵人 HP、弱點／抗性與「下一行動」。</li><li>選擇普通攻擊、技能、防禦或觀察。</li><li>選擇敵人與部位。</li><li>確認前都可以修改行動；多人模式會即時看到隊友選擇。</li><li>所有在線且存活的玩家確認後才結算。</li></ol><p>如果敵人顯示「呼叫增援」，代表下一次敵方行動會召喚手下；若顯示阻擋要求，則需在當回合對指定部位造成足夠傷害。</p>`),
    section('裝備、金幣與商店',`<p>武器決定可用的普通攻擊性質；防具與飾品會改變能力值，有些強力裝備同時也會降低另一項能力。</p><p>探索中可自由換裝，但一旦進入戰鬥就會鎖定裝備，必須等戰鬥結束。</p><p>金幣主要來自戰鬥，也可能從事件取得。金幣可用於商店購買裝備／消耗品，或學習罪人技能。</p>`),
    section('罪人技能',`<p>每名罪人共有 6 個可學技能，但一場遠征最多只能學 3 個。攻擊型技能同樣具有斬擊／鈍擊／突擊屬性，因此也會受到敵人弱點與抗性影響。</p>${sinnerRows()}`),
    section('狀態效果',statusRows()),
    section('事件檢定與獎勵',`<p>事件選項會顯示目前成功率估計。如果某個選項成功後「可能取得裝備／消耗品」，會直接寫在選項上。</p><p>事件成功不代表必定拿到物品：仍會依選項標示的機率、危險度與結果品質決定。</p>`),
    section('多人遊戲',`<p>節點選擇採多數決：例如 2:1 直接採 2 票的路線；1:1、2:2 或 1:1:1 等完全平票，由伺服器在平票選項中隨機。</p><p>戰鬥行動則需要每位在線且存活的玩家按下確認，確認前可取消並重選。</p>`),
    section('勝利與失敗',`<p><b>勝利：</b>完成三張地圖並擊敗第三張地圖 Boss。</p><p><b>失敗：</b>隊伍全滅，或危險度達到該章節上限並觸發遠征失敗。</p><p>結束時會播放 VICTORY / FAIL 演出；約三秒後房主可選擇同房「再來一把」。</p>`)
  ].join('');}
  ensure();
  socket.on('room:update',()=>{if(document.getElementById('manualDrawer')?.classList.contains('open'))render();});
  window.KBMTutorialManual={render};
})();
