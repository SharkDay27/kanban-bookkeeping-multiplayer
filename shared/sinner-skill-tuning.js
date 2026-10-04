const SKILL_NAMES={
 'ys-crow':'烏瞰刀','ys-bygone':'往昔','ys-match':'第四根火柴之焰','ys-cairn':'祈願石','ys-dimension':'次元撕裂者','ys-sunshower':'狐雨',
 'faust-emitter':'表象放射器','faust-nail':'詛咒之釘','faust-92':'9章2節','faust-lasso':'套索','faust-fluid':'液囊','faust-telepole':'電線桿',
 'don-sangre':'桑丘之血','don-stew':'一生燉菜','don-cairn':'祈願石','don-scream':'電子哀鳴','don-fluid':'液囊','don-telepole':'電線桿',
 'ryo-forest':'森羅炎象','ryo-match':'第四根火柴之焰','ryo-red-eyes':'赤瞳','ryo-open':'赤瞳（開）','ryo-blind':'盲目','ryo-contempt':'輕蔑，敬畏',
 'meur-chain':'他人之鎖','meur-regret':'悔恨','meur-capote':'鬥牛披風','meur-pursuance':'執行','meur-scream':'電子哀鳴','meur-wallop':'脫線一擊',
 'hong-illusion':'太虛幻境','hong-rose':'粉紅慾望','hong-soda':'美味蘇打','hong-wail':'低泣','hong-dimension':'次元撕裂者','hong-corrosion':'沸騰腐蝕',
 'heath-bag':'屍袋','heath-holiday':'悲慘假日','heath-aedd':'AEDD','heath-fell':'凶彈','heath-movein':'遷居申請','heath-telepole':'電線桿',
 'ish-snag':'捕鯨叉','ish-rose':'粉紅慾望','ish-capote':'鬥牛披風','ish-bygone':'往日','ish-ardor':'紅豔煞','ish-blind':'盲目',
 'rod-cast':'覆水難收','rod-sunset':'步入晚霞','rod-rime':'冰結之爪','rod-corrosion':'沸騰腐蝕','rod-mirror':'鏡反射觸覺','rod-match':'第四根火柴之焰',
 'sin-branch':'知識樹之枝','sin-day':'迫近之日','sin-stew':'一生燉菜','sin-lantern':'提燈','sin-92':'9章2節','sin-scream':'和聲',
 'outis-pathos':'致智慧與苦難','outis-holiday':'悲慘假日','outis-ebony':'黑檀枝幹','outis-sunshower':'狐雨','outis-dimension':'次元撕裂者','outis-binds':'拘束',
 'greg-day':'某一日，突然','greg-lies':'障眼把戲','greg-lantern':'提燈','greg-aedd':'AEDD','greg-thorns':'荊棘花園','greg-lament':'莊嚴哀悼'
};
const BALANCE_PATCHES={
 'meur-chain':{shield:12,description:'降低目標攻擊與防禦，自己獲得 12 點護盾。'},
 'faust-emitter':{teamShield:6,description:'提升全隊下一回合的判定穩定度，並給全隊 6 點護盾。'},
 'ish-capote':{shield:10,description:'強力單體攻擊；以防禦姿態為自己取得 10 點護盾。'},
 'rod-mirror':{shield:16,description:'獲得 16 點護盾，若本回合受到攻擊則反擊。'},
 'greg-thorns':{shield:14,description:'攻擊所有敵人並讓自己獲得 14 點護盾。'}
};
function applySkillTuning(skills){for(const skill of skills||[]){if(SKILL_NAMES[skill.id])skill.name=SKILL_NAMES[skill.id];if(BALANCE_PATCHES[skill.id])Object.assign(skill,BALANCE_PATCHES[skill.id]);}return skills;}
module.exports={SKILL_NAMES,BALANCE_PATCHES,applySkillTuning};
