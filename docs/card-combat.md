# V0.22 卡牌戰鬥

每回合抽 5 張，額外抽牌最多 +2，手牌最多 8 張。初始牌組為 12 張 LCB 配色行動牌、4 張目前武器牌、3 張無色能力牌。探索牌永久保留到本次遠征結束，最多 24 張。未用牌於回合結束回收；抽牌堆用光才洗勻回收堆。複製牌只存活於該場戰鬥，各場最多 2 張。

雙向行動牌的上半部生效；旋轉會同時改變性質、數值與罪孽顏色。卡牌點數 1～3。同類攻擊合併結算，基礎傷害為 `round(點數 ×1.55 + 戰鬥值 ×0.55 ×該類點數/全部攻擊點數)`，另有 0～2 點骰子變動，再套用抗性、狀態及遺物。攻擊必定命中。防禦牌生成 `點數 ×2 + floor(穩定 ×0.3)` 護盾，每次防禦最多 24、總護盾上限 99，護盾持續到耗盡。

每回合最多 1 個技能（從已學技能中選符合條件者；未指定時優先使用需要較多牌的技能）。第一個技能免費學會，最多學 3 個。每個罪人的 6 個技能按資料順序依次需要：主色2、主色1+副色1、主色2+副色1、三色各1、主色2+副色2、主色2+副色1+稀有色1。顏色按張數，不按點數；能力牌不提供顏色。升級強化效果保留，循環式與原冷卻遺物改為下回合額外抽牌，合計最多 2。

能力每回合最多 2 張。整備抽1；重整棄1抽1並洗勻抽牌堆；回溯棄1回收指定行動牌；預備棄1將指定抽牌堆行動牌置頂；鏡像棄1複製另一張手中行動牌。已出的牌不能作為棄牌代價。包含 12 種罪人限定能力（每名罪人初始帶 1 種）及通用能力。

武器為固定 4 張附帶牌，依攻擊性質及稀有度決定配色／數值，換裝會在下場戰鬥替換，不會累積舊武器牌。初始武器使用罪人配色。商店固定新增 3 件卡牌商品；行動牌18+章節×4、能力牌26+章節×4金幣，不占消耗品欄。小怪／精英／前兩章Boss戰後有45%／80%／80%機率額外得到卡牌；補給50%。既有金幣、裝備、遺物獎勵另行保留。

卡牌制將普通敵人HP提高35%、精英HP提高12%，Boss HP沿用原設定。新牌是單攻擊／防禦及雙攻擊配對，包含7種罪孽顏色。每次攻擊群組的六面骰都由伺服器決定，前端以同玩家多骰同時演出，縮短多人等待。

## LCB 參考及改編界線

LCB 人格以 S1/S2/S3 的罪孽配色與攻擊性質作初始牌參考，數字、上下配對、技能卡牌條件及能力牌為本遊戲原創平衡改編，沒有搬用 Unlight 卡牌素材。

Wiki 已嘗試讀取（https://limbuscompany.wiki.gg/wiki/LCB_Sinner_Yi_Sang 等12頁），頁面403。配色與攻擊類型改由下列可讀的人格資料庫交叉核對（2026-10-04）：

- https://www.prydwen.gg/limbus-company/identities/lcb-sinner-yi-sang
- https://www.prydwen.gg/limbus-company/identities/lcb-sinner-faust
- https://www.prydwen.gg/limbus-company/identities/lcb-sinner-don-quixote
- https://www.prydwen.gg/limbus-company/identities/lcb-sinner-ryoshu
- https://www.prydwen.gg/limbus-company/identities/lcb-sinner-meursault
- https://www.prydwen.gg/limbus-company/identities/lcb-sinner-hong-lu
- https://www.prydwen.gg/limbus-company/identities/lcb-sinner-heathcliff
- https://www.prydwen.gg/limbus-company/identities/lcb-sinner-ishmael
- https://www.prydwen.gg/limbus-company/identities/lcb-sinner-rodion
- https://www.prydwen.gg/limbus-company/identities/lcb-sinner-sinclair
- https://www.prydwen.gg/limbus-company/identities/lcb-sinner-outis
- https://www.prydwen.gg/limbus-company/identities/lcb-sinner-gregor

## 驗證

`npm run test:cards` 驗證12名罪人、旋轉、卡牌所有權／重複／確認鎖、技能條件、五種能力、棄牌代價、回收洗牌、多人結算、購牌、換武器及暫存複製牌。

平衡樣本：12罪人 × 3章 × 3種戰鬥 × 30場 = 3240場；單人、滿血、初始武器、無遺物、無探索牌，簡單策略（使用抽牌能力，有攻擊預告時視護盾選一張防禦，其餘攻擊，不刻意湊技能）。Boss平均約4.3／6.6／8.0回合。第三章Boss此基礎配置約74%勝率。此為開發樣本，不代表所有地區、危險度、多人、真實玩家策略或完整遠征的勝率；後續以遊玩回饋調整。
