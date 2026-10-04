const S=(id,sinnerId,name,cost,kind,stat,power,description,extra={})=>({id,sinnerId,name,cost,kind,stat,power,description,...extra});

const SINNER_SKILLS=[
  // 李箱
  S('ys-crow','01','烏瞰刀',55,'team-buff','observe',1.15,'提高全隊下一回合的觀察。',{buff:'focus'}),
  S('ys-bygone','01','往昔',65,'debuff','observe',1.05,'削弱目標防禦，若目標已有弱點則追加傷害。',{defenseDown:2}),
  S('ys-match','01','第四根火柴',75,'heavy','combat',1.65,'高傷害單體攻擊，對已受傷目標傷害提高。'),
  S('ys-cairn','01','許願石',70,'guard-break','stability',1.2,'攻擊部位並提高破壞／阻擋檢定效率。',{breakBonus:6}),
  S('ys-dimension','01','次元撕裂者',90,'pierce','mobility',1.45,'無視部分防禦並可直接攻擊後排或部位。',{ignoreDefense:3}),
  S('ys-sunshower','01','狐雨',100,'aoe','observe',1.0,'對所有敵人造成傷害並有機率施加動搖。',{statusId:'shaken'}),
  // 浮士德
  S('faust-emitter','02','表象放射器',55,'team-buff','observe',.9,'提升全隊下一回合的判定穩定度。',{buff:'steady-mind'}),
  S('faust-nail','02','詛咒之釘',70,'debuff','observe',1.15,'標記目標，使其承受更多傷害。',{statusId:'marked'}),
  S('faust-92','02','9:2',75,'aoe','combat',1.0,'對所有敵人造成中等傷害。'),
  S('faust-lasso','02','套索',70,'control','observe',1.05,'降低目標攻擊並提高部位破壞效率。',{attackDown:.15,breakBonus:4}),
  S('faust-fluid','02','水袋',90,'heal','stability',0,'治療全隊少量 HP，並移除一個隨機負面狀態。',{heal:18,cleanse:true}),
  S('faust-telepole','02','電線桿',95,'aoe-debuff','combat',1.15,'對所有敵人造成傷害，並使下一次敵方攻擊減弱。',{enemyDamageMult:.8}),
  // 堂吉訶德
  S('don-sangre','03','桑丘之血',55,'heavy','combat',1.45,'單體高傷害；自身 HP 越低，傷害越高。',{lowHpScale:.35}),
  S('don-stew','03','一生饪',65,'heal','stability',0,'恢復自身與一名最低 HP 隊友。',{heal:20}),
  S('don-cairn','03','許願石',70,'guard-break','mobility',1.15,'高速撞擊部位，獲得額外破壞值。',{breakBonus:6}),
  S('don-scream','03','電擊尖叫',75,'debuff','combat',1.15,'造成傷害並降低目標下回合攻擊。',{attackDown:.18}),
  S('don-fluid','03','水袋',85,'heal','stability',0,'恢復全隊少量 HP。',{heal:14,team:true}),
  S('don-telepole','03','電線桿',95,'aoe','mobility',1.1,'快速衝擊全部敵人，對召喚物傷害提高。',{minionBonus:.35}),
  // 良秀
  S('ryo-forest','04','森羅炎象',55,'heavy','combat',1.5,'高傷害斬擊，若造成擊殺則獲得短暫戰鬥增益。',{onKillBuff:'adrenaline'}),
  S('ryo-match','04','第四根火柴',70,'heavy','combat',1.7,'高傷害攻擊，對破壞部位有額外傷害。',{partBonus:.25}),
  S('ryo-red-eyes','04','赤瞳',70,'debuff','observe',1.15,'標記敵人弱點並降低防禦。',{defenseDown:2}),
  S('ryo-open','04','赤瞳（開）',85,'pierce','combat',1.45,'無視部分防禦；若目標已被標記則追加傷害。',{ignoreDefense:3,markedBonus:.3}),
  S('ryo-blind','04','盲目',90,'aoe','combat',1.05,'攻擊所有敵人並降低其命中。',{enemyDamageMult:.85}),
  S('ryo-contempt','04','輕蔑，敬畏',110,'finisher','combat',1.9,'對高 HP 敵人與 Boss 部位造成強力斬擊。',{bossBonus:.2}),
  // 默爾索
  S('meur-chain','05','他人之鎖',55,'control','stability',1.0,'降低目標攻擊與防禦，自己獲得防護。',{attackDown:.12,defenseDown:1,shield:8}),
  S('meur-regret','05','悔恨',70,'guard-break','combat',1.25,'對部位與防禦型敵人造成更多破壞。',{breakBonus:7}),
  S('meur-capote','05','鬥牛披風',75,'heavy','combat',1.5,'穩定的高傷害單體攻擊。'),
  S('meur-pursuance','05','執行',90,'heal','stability',.9,'恢復自身 HP。',{heal:24}),
  S('meur-scream','05','電擊尖叫',80,'debuff','stability',1.1,'削弱敵人下一回合傷害。',{enemyDamageMult:.78}),
  S('meur-wallop','05','螺絲鬆動重擊',100,'heavy','combat',1.8,'極高單體傷害，但自身下回合機動下降。',{selfStatus:'slowed'}),
  // 鴻璐
  S('hong-illusion','06','虛幻之境',55,'debuff','observe',1.0,'降低目標命中並提高自身迴避。',{enemyDamageMult:.88}),
  S('hong-rose','06','桃色契約',65,'control','observe',1.05,'施加標記，使隊伍對目標傷害提高。',{statusId:'marked'}),
  S('hong-soda','06','汽水',65,'heal','stability',0,'治療自身。',{heal:20}),
  S('hong-wail','06','洞穴哀鳴',75,'aoe-debuff','observe',.95,'攻擊全體並有機率施加動搖。',{statusId:'shaken'}),
  S('hong-dimension','06','次元撕裂者',90,'pierce','mobility',1.45,'可越過前排攻擊後排或部位。',{ignoreDefense:3}),
  S('hong-corrosion','06','泡沫腐蝕',100,'aoe','combat',1.15,'對全體造成傷害，對已有負面狀態者追加傷害。',{debuffBonus:.25}),
  // 希斯克利夫
  S('heath-bag','07','屍體袋',55,'heavy','combat',1.55,'強力單體攻擊；使用後獲得短暫戰鬥增益。',{buff:'adrenaline'}),
  S('heath-holiday','07','假日',65,'aoe','combat',1.0,'攻擊全部敵人，對小怪傷害提高。',{minionBonus:.3}),
  S('heath-aedd','07','AEDD',75,'debuff','combat',1.15,'造成傷害並使目標下次受到攻擊時承受額外傷害。',{statusId:'marked'}),
  S('heath-fell','07','墜彈',80,'pierce','observe',1.4,'高精度單體攻擊，對部位傷害提高。',{partBonus:.3}),
  S('heath-movein','07','搬入登記',85,'control','mobility',1.2,'攻擊並降低目標行動效率。',{attackDown:.15}),
  S('heath-telepole','07','電線桿',95,'heavy','combat',1.65,'高傷害攻擊，危險度越高傷害越高。',{dangerScale:.04}),
  // 以實瑪利
  S('ish-snag','08','牽制魚叉',55,'control','combat',1.1,'攻擊並降低目標攻擊。',{attackDown:.12}),
  S('ish-rose','08','桃色契約',65,'debuff','observe',1.05,'標記敵人並提高隊伍對其輸出。',{statusId:'marked'}),
  S('ish-capote','08','鬥牛披風',75,'heavy','combat',1.5,'強力單體攻擊。'),
  S('ish-bygone','08','往昔',75,'team-buff','stability',.9,'提高全隊穩定。',{buff:'steady-mind'}),
  S('ish-ardor','08','紅豔煞',90,'aoe','combat',1.1,'攻擊所有敵人；對已受傷敵人效果提高。'),
  S('ish-blind','08','盲目痴迷',110,'aoe-debuff','observe',1.25,'大範圍攻擊並削弱敵方下一回合。',{enemyDamageMult:.75}),
  // 羅佳
  S('rod-cast','09','覆水難收',55,'heavy','combat',1.4,'穩定單體攻擊；若骰值高則追加傷害。',{highRollBonus:.25}),
  S('rod-sunset','09','日落時分',65,'finisher','combat',1.45,'對低 HP 敵人造成額外傷害。',{executeBonus:.4}),
  S('rod-rime','09','冰橋',75,'control','stability',1.05,'攻擊並降低目標行動效率。',{attackDown:.15}),
  S('rod-corrosion','09','泡沫腐蝕',80,'aoe','combat',1.0,'對全體造成傷害。'),
  S('rod-mirror','09','鏡觸',85,'counter','stability',1.0,'獲得防護，若本回合受到攻擊則反擊。',{shield:12,counter:.6}),
  S('rod-match','09','第四根火柴',100,'heavy','combat',1.75,'高傷害單體攻擊。'),
  // 辛克萊
  S('sin-branch','11','知識之枝',55,'pierce','observe',1.3,'無視少量防禦並提高線索獲取。',{ignoreDefense:2,clue:1}),
  S('sin-day','11','迫近之日',70,'heavy','combat',1.55,'高傷害單體攻擊；擊殺時恢復少量 HP。',{onKillHeal:15}),
  S('sin-stew','11','一生饪',65,'heal','stability',0,'恢復自身 HP 並解除一個負面狀態。',{heal:22,cleanse:true}),
  S('sin-lantern','11','提燈',75,'heal-hit','combat',1.15,'攻擊後依造成傷害恢復 HP。',{lifesteal:.45}),
  S('sin-92','11','9:2',85,'aoe','combat',1.05,'攻擊所有敵人。'),
  S('sin-scream','11','電擊尖叫',95,'debuff','combat',1.25,'攻擊並大幅降低目標下一回合傷害。',{enemyDamageMult:.72}),
  // 奧提斯
  S('outis-pathos','12','To Páthos Máthos',55,'heavy','combat',1.45,'可靠的高傷害單體攻擊。'),
  S('outis-holiday','12','假日',65,'team-buff','stability',.9,'提高隊伍穩定。',{buff:'steady-mind'}),
  S('outis-ebony','12','黑檀枝幹',75,'aoe','combat',1.05,'攻擊所有敵人並降低防禦。',{defenseDown:1}),
  S('outis-sunshower','12','狐雨',85,'aoe-debuff','observe',1.0,'攻擊全體並施加動搖。',{statusId:'shaken'}),
  S('outis-dimension','12','次元撕裂者',95,'pierce','mobility',1.45,'無視部分防禦並可直接攻擊部位。',{ignoreDefense:3}),
  S('outis-binds','12','束縛',110,'control','stability',1.2,'削弱所有敵人的下一回合攻擊。',{enemyDamageMult:.72,team:true}),
  // 格里高爾
  S('greg-day','13','某日忽至',55,'heavy','combat',1.4,'單體攻擊並有機率施加虛弱。',{statusId:'weakened'}),
  S('greg-lies','13','虛假之實',65,'debuff','observe',1.0,'降低目標防禦並提高自身觀察。',{defenseDown:2,buff:'focus'}),
  S('greg-lantern','13','提燈',75,'heal-hit','combat',1.1,'攻擊後依傷害恢復 HP。',{lifesteal:.5}),
  S('greg-aedd','13','AEDD',80,'debuff','combat',1.15,'標記敵人，使後續攻擊更加有效。',{statusId:'marked'}),
  S('greg-thorns','13','荊棘花園',95,'aoe','combat',1.1,'攻擊所有敵人並提高自身防護。',{shield:10}),
  S('greg-lament','13','莊嚴哀悼',110,'finisher','observe',1.65,'高精度強力攻擊，對 Boss 與精英傷害提高。',{bossBonus:.25})
];

const DEFAULT_DAMAGE_TYPE={
  '01':'slash','02':'slash','03':'pierce','04':'slash','05':'pierce','06':'slash',
  '07':'blunt','08':'blunt','09':'slash','11':'slash','12':'slash','13':'blunt'
};
const DAMAGE_TYPE_OVERRIDES={
  'ys-dimension':'pierce','ys-cairn':'blunt','ys-sunshower':'pierce',
  'faust-nail':'pierce','faust-lasso':'blunt','faust-telepole':'blunt','faust-92':'blunt',
  'don-cairn':'blunt','don-scream':'blunt','don-telepole':'blunt',
  'ryo-open':'pierce','ryo-red-eyes':'slash',
  'meur-regret':'blunt','meur-capote':'blunt','meur-scream':'blunt','meur-wallop':'blunt',
  'hong-dimension':'pierce','hong-wail':'blunt','hong-corrosion':'blunt',
  'heath-fell':'pierce','heath-aedd':'blunt','heath-telepole':'blunt',
  'ish-snag':'pierce','ish-rose':'pierce','ish-ardor':'slash','ish-blind':'blunt',
  'rod-rime':'blunt','rod-corrosion':'blunt','rod-mirror':'blunt',
  'sin-branch':'pierce','sin-92':'blunt','sin-scream':'blunt',
  'outis-pathos':'pierce','outis-ebony':'slash','outis-sunshower':'pierce','outis-dimension':'pierce','outis-binds':'blunt',
  'greg-aedd':'blunt','greg-thorns':'pierce','greg-lament':'pierce'
};
const SOUND_OVERRIDES={
  'faust-92':'anomaly','faust-telepole':'anomaly','don-scream':'anomaly','don-telepole':'anomaly',
  'heath-aedd':'anomaly','heath-telepole':'anomaly','sin-92':'anomaly','sin-scream':'anomaly','greg-aedd':'anomaly',
  'outis-pathos':'gun','outis-ebony':'gun','greg-lament':'gun'
};
for(const skill of SINNER_SKILLS){
  if(Number(skill.power)>0){
    skill.damageType=skill.damageType||DAMAGE_TYPE_OVERRIDES[skill.id]||DEFAULT_DAMAGE_TYPE[skill.sinnerId]||'blunt';
    skill.soundType=skill.soundType||SOUND_OVERRIDES[skill.id]||skill.damageType;
  }
}

function skillsForSinner(sinnerId){return SINNER_SKILLS.filter(s=>s.sinnerId===sinnerId);}
function getSinnerSkill(id){return SINNER_SKILLS.find(s=>s.id===id)||null;}
module.exports={SINNER_SKILLS,skillsForSinner,getSinnerSkill};
