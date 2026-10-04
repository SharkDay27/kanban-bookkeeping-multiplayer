// Parts follow each encounter's physical form; their descriptions describe enforced rules.
function anatomy(name){
 const profiles={
 '封店模特':['右手','展示頭盔','胸腔聲盒'],'失控促銷推車':['撞擊前輪','車架護板','促銷喇叭'],'閉店保全偶':['警棍手臂','保全頭盔','通訊背包'],'活化巨型招牌':['揮擊支架','招牌面板','閃爍燈管'],'拒載電梯門':['夾擊門扇','門框','呼叫面板'],
 '過壓鍋爐獸':['排壓噴口','鍋爐外殼','警報閥'],'維修吊臂獵手':['機械臂','駕駛艙護罩','信號天線'],'多頭閥門獸':['高壓閥頭','主管護殼','旁通閥'],'高壓纜線巢':['帶電纜束','絕緣護層','分支接線盒'],'往復活塞群':['衝擊活塞','導軌護板','控制接頭'],
 '雙生觀測體':['伸縮觸手','雙生面罩','共鳴眼'],'自鎖樣本櫃':['鉸鏈夾臂','櫃門','樣本釋放槽'],'縫合實驗體':['縫合手臂','胸腔縫線','寄生囊'],'多眼觀測鏡':['聚焦主鏡','鏡面護蓋','側面觀測眼'],'失序無菌清掃機':['清掃機械臂','機身護板','排放噴口'],
 '無燈追獵者':['利爪','頭骨面甲','喉囊'],'軌枕伏行體':['前肢','背部軌枕','腹部裂隙'],'失照信號柱':['放電桿','信號罩','呼叫燈'],'空車廂殘像':['夾擊車門','車廂壁','車廂連接口'],'隧道耳語群':['回聲口','石壁覆層','分裂裂縫'],
 '沉錨巨殼':['錨鉗','背甲','腹部育囊'],'活化拖網':['絞索','浮標護層','網囊'],'鏽甲碼頭蟹':['巨螯','鏽甲','腹部育囊'],'積水電鰻群':['放電鰭','黏膜護層','群聚腮口'],'無面潛水員':['持鉤手','潛水頭盔','供氧背包'],
 '活動房間':['撞擊牆','承重梁','房門'],'追逐門扉':['鉸鏈夾臂','門板','門鎖孔'],'無窗燈列':['灼熱燈頭','燈罩','線路分接器'],'折返樓梯':['踏步前緣','扶手護欄','轉角平台'],'錯號房客':['右手','面部繃帶','喉嚨'],
 '灰疫宣告者':['持杖手','防疫面罩','喉囊'],'自行搬運病床':['撞擊床腳','床板','床底孢囊'],'面罩聚合體':['伸縮管束','面罩群','呼吸孔'],'隔離警報柱':['電擊接頭','警報護殼','擴音器'],'灰疫孢巢':['毒刺','菌殼','孢子囊'],
 '逆時預報機':['逆時指針','表盤護罩','訊息出口'],'失焦望遠鏡陣列':['聚焦鏡筒','鏡片護蓋','副鏡接頭'],'遠訊接收盤':['放電天線','接收盤','轉播模組'],'星時校準鐘':['擺錘','鐘面','報時口'],'真空觀測服':['右手','觀測頭盔','生命維持背包'],
 '永不結帳的收銀員':['持刀手','收銀面罩','叫號喉管'],'櫥窗中的最後顧客':['玻璃手','展示面具','胸腔回聲盒'],'百貨閉店廣播塔':['放電天線','塔身護板','廣播喇叭'],
 '逆流維修核心':['機械臂','核心裝甲','維修艙口'],'無限加壓泵組':['加壓活塞','泵體護殼','旁通管'],'牽引鏈主機':['牽引鏈臂','齒輪護罩','輸送接口'],
 '鏡後觀測者':['鏡刃手','鏡面頭盔','後方裂隙'],'無標籤母樣本':['主觸手','樣本外膜','孵化囊'],'第七隔離觀測席':['束縛機械臂','觀測護罩','樣本出口'],
 '失照吞行者':['巨顎','脊背甲','咽喉囊'],'黑軌列車殘影':['車頭撞角','車廂護板','連結車門'],'無燈巡行巨獸':['前爪','頭骨甲','喉囊'],
 '沉潮母體':['主觸腕','潮汐外膜','育囊'],'錨鏈鯨骸':['錨鏈尾','鯨骨頭甲','胸腔裂隙'],'溺港引潮燈':['聚光鏡','燈塔護壁','潮聲喇叭'],
 '第零號房間':['碾壓牆','承重天花','零號門扉'],'無窗管理員':['持鑰手','管理員面罩','喉管'],'迴廊摺疊體':['摺疊接縫','迴廊外壁','分岔門'],
 '被宣布痊癒者':['變異手臂','病患面罩','胸腔孢囊'],'封鎖區廣播醫師':['手術機械臂','醫師頭盔','廣播器'],'灰疫孵化塔':['毒霧噴口','菌塔外殼','孵化囊'],
 '寂星回應體':['光束觸手','星殼','訊號腔'],'逆時天文儀':['旋轉星環','天文儀護罩','回訊模組'],'最後觀測衛星':['太陽能翼','衛星護板','增援通訊天線']};
 return profiles[name]||['攻擊手臂','頭盔','呼叫器'];
}
function makeParts(enemy,kind){
 if(!['elite','boss'].includes(kind))return [];
 const names=anatomy(enemy.baseName||enemy.name),ratios=kind==='boss'?[.22,.20,.18]:[.20,.18,.16];
 const defs=[['weapon','未破壞前免疫降低攻擊的效果；破壞後輸出降低 20%，停止部位蓄力攻擊。'],['armor','破壞後每回合防禦骰減少 2 顆。'],['summon','破壞後無法再召喚小怪。']];
 return defs.map(([type,effect],i)=>{const hp=Math.max(6,Math.round(enemy.maxHp*ratios[i]));return {id:`${enemy.instanceId}-part-${i}`,type,name:names[i],maxHp:hp,currentHp:hp,destroyed:false,effect};});
}
function findPart(target,id){return target?.parts?.find(p=>p.id===id&&!p.destroyed)||null;}
function reduceAttack(enemy,factor){if((enemy.parts||[]).some(p=>p.type==='weapon'&&!p.destroyed))return false;enemy.attackMultiplier=Math.max(.45,Number(enemy.attackMultiplier||1)*factor);return true;}
function applyPartDamage(combat,target,part,dealt){
 if(!part||part.destroyed)return {destroyed:false,mainDamage:0};const before=part.currentHp;part.currentHp=Math.max(0,before-dealt);
 if(combat.blockChallenge?.partId===part.id)combat.blockChallenge.currentDamage+=dealt;
 const destroyed=before>0&&part.currentHp<=0;
 if(destroyed){part.destroyed=true;if(part.type==='weapon')reduceAttack(target,.8);if(part.type==='armor'){target.defenseDicePenalty=2;target.defensePenalty=Math.min(8,(target.defensePenalty||0)+2);}}
 const mainDamage=Math.round(dealt*.55);target.currentHp=Math.max(0,target.currentHp-mainDamage);return {destroyed,mainDamage};
}
module.exports={anatomy,makeParts,findPart,applyPartDamage,reduceAttack};
