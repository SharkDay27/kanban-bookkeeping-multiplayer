# shared

這個資料夾預留給從原單機專案「複製」進來的純資料模組，例如：

- exploration-events.js / 事件資料
- area-exploration.js / 地區資料
- enemies.js / 敵人資料
- equipment.js / 裝備資料
- item-economy.js / 道具資料
- sinners.js / 罪人資料

原則：多人版只保留自己的副本，不直接 import 或引用原 repository 的路徑。
之後若單機版更新，需人工決定是否同步進多人版，避免兩個專案互相影響。
