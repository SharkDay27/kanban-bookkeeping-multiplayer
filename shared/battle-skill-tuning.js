// Each sinner retains six skills and existing healing roles. Direct attacks add dice to the current attack.
function tune(skills){for(const sinnerId of new Set(skills.map(s=>s.sinnerId))){const list=skills.filter(s=>s.sinnerId===sinnerId);list.forEach((s,i)=>{
 const support=['heal','team-buff'].includes(s.kind),originalKind=s.kind;
 s.activationSide=support?'guard':'attack';s.skillClass=support?'支援技能':['heavy','pierce','aoe','finisher','guard-break'].includes(s.kind)?'攻擊技能':'特殊技能';
 s.originalKind=originalKind;s.originalDescription=s.description;
 for(const k of ['attackDown','defenseDown','enemyDamageMult','dangerScale','buff','selfStatus','statusId','counter'])delete s[k];
 if(!support){s.kind=s.skillClass==='攻擊技能'?'attack-boost':'special';s.attackDiceBonus=s.kind==='attack-boost'?(i>=4?3:2):0;s.specialDamage=s.kind==='special';s.diceCount=s.specialDamage?2:0;s.power=1;s.flatDamage=i===5?2:0;}
 const base=s.kind==='attack-boost'?`當下攻擊增加 ${s.attackDiceBonus} 顆骰子。`:s.kind==='heal'?`恢復${s.team?'全隊':'自身'} ${s.heal} HP。`:s.kind==='team-buff'?'防禦牌觸發支援。':'特殊攻擊：2 顆骰子。';let extra='';
 switch(sinnerId){
 case '01':if(i===0){s.nextDraw=1;extra='下回合多抽 1 張牌。';}if(i===1){s.specialDamage=false;s.zeroAttack=true;s.applyStatus='suppressed';s.statusDuration=2;extra='本回合攻擊歸零，敵方攻防各減 3 骰，持續 2 回合。';}if(i===3){s.onBlockBuff='damage-up';extra='本回合防禦完全抵擋攻擊時獲得 1 層增傷。';}if(i===4){s.nextDraw=2;extra='下回合多抽 2 張牌。';}break;
 case '02':if(i===4)s.team=true;if(i===0){s.randomAllyBuff=true;extra='隨機給予全隊一種增益（增傷／護盾／再生／靈敏）。';}else if(i===1||i===3){s.randomEnemyDebuff=true;extra='隨機給予目標一種負面狀態。';}break;
 case '03':if(s.kind==='heal'){s.healOveruse=true;extra='本場第 3 次治療後，接下來 2 回合由伺服器接管出牌；接管期間不觸發治療技能。';}else if(i===3){s.applyStatus='paralysis';s.statusStacks=2;extra='造成傷害時施加 2 層麻痺。';}break;
 case '04':s.onHitStatus=i%2?'burning':'bleeding';s.statusStacks=i>=4?2:1;if(i===2||i===5){s.discardEnemy=1;extra='造成傷害後斬去敵方 1 張手牌，送入回收堆；';}extra+=`造成傷害時施加 ${s.statusStacks} 層${s.onHitStatus==='burning'?'燒傷':'流血'}。`;break;
 case '05':if(i===0){s.kind='team-buff';s.teamBuff=false;s.activationSide='guard';s.skillClass='防禦技能';s.specialDamage=false;s.shield=12;s.guardDiceBonus=3;s.applyStatus='paralysis';s.statusStacks=2;extra='防禦 +3 骰、自己護盾 +12，敵方麻痺 +2 層。';}else if(i===3){extra='保留自身治療。';}else if(i===1||i===4){s.applyStatus='paralysis';s.statusStacks=2;extra='敵方麻痺 +2 層，機動下降。';}break;
 case '06':if(i===0||i===4){s.goldBonus=i>=4?8:4;extra=`本場戰鬥結束額外 +${s.goldBonus} 金幣；累積上限 24。`;}if(i===1){s.applyStatus='sinking';extra+='敵方沉淪 +1。';}break;
 case '07':if(i===0||i===3){s.onHitStatus='vulnerable';s.statusStacks=i>=4?2:1;extra=`造成傷害時施加 ${s.statusStacks} 層易傷。`;}break;
 case '08':if(i===3||i===4){s.teamShield=i===3?8:4;extra=`給予所有存活隊友 ${s.teamShield} 護盾。`;}break;
 case '09':if(i===1||i===2||i===4){s.stealPile=i===1?'hand':i===2?'draw':'discard';extra=`偷取敵方${{hand:'手牌',draw:'抽牌堆',discard:'回收堆'}[s.stealPile]} 1 張行動牌，本場可用；無牌則不偷取。`;}if(i===0||i===4){s.bestOfTwo=true;extra+='本回合攻擊與防禦各擲兩次取正面數較高者。';}if(i===4){s.kind='team-buff';s.activationSide='guard';s.skillClass='防禦技能';s.specialDamage=false;s.shield=12;}break;
 case '11':if(s.kind==='heal'||s.lifesteal||i===0){s.imprint=true;extra='增加 1 層刻印，隨機提高戰鬥／穩定／機動一項（最多 +3）。';}if(i===5){s.applyStatus='terror';extra='敵方恐怖 2 回合，攻擊傷害減半。';}break;
 case '12':if(i===1||i===4){s.agile=2;extra='全隊靈敏 +2，持續 2 回合。';}else {s.enemyDiceDown=i>=4?2:1;s.enemyDiceType=i===2?'defense':'attack';extra=`敵方${s.enemyDiceType==='attack'?'攻擊':'防禦'}減少 ${s.enemyDiceDown} 骰（2 回合）。`;}if(i===5){s.applyStatus='sealed';s.statusDuration=1;extra+='封印敵方技能 1 回合。';}break;
 case '13':if(i===1||i===5){s.destroyEnemy=1;extra='永久破壞敵方 1 張行動牌，本場不得再使用；每場最多 3 張。';}if(i===2||i===4){s.regeneration=1;extra+='自己再生 +1，2 回合。';}break;
 }
 if((sinnerId==='02'&&i===5)||(sinnerId==='06'&&i===3)||(sinnerId==='07'&&i===1)||(sinnerId==='08'&&i===5)){s.kind='aoe';s.skillClass='特殊技能';s.specialDamage=true;s.diceCount=2;s.attackDiceBonus=0;}
 // Signature exact-face skills are special except retained heals / shields.
 if([1,4].includes(i)&&s.kind==='attack-boost'){s.kind='special';s.specialDamage=true;s.diceCount=3;s.attackDiceBonus=0;s.skillClass='特殊技能';}
 s.description=(s.kind==='heal'?`恢復${s.team?'全隊':'自身'} ${s.heal} HP。`:s.kind==='aoe'?`群體特殊攻擊：每名敵人 ${s.diceCount} 顆骰子。`:s.kind==='team-buff'?'防禦牌觸發支援。':s.kind==='special'?(s.specialDamage?`特殊攻擊：${s.diceCount} 顆骰子。`:'特殊技能。'):base)+extra+(s.flatDamage&&!support?`擲出至少 1 個正面時，骰後傷害 +${s.flatDamage}。`:'');
 });}return skills;}
module.exports={tune};
