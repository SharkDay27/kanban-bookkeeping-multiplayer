# kanban-bookkeeping-multiplayer v0.5

獨立多人探索專案，不會讀寫原本 `kanban-bookkeeping` 單機版資料。

## v0.5
- 2–4 人房間與邀請連結
- 固定玩家身分、重新整理與短暫斷線自動回房
- 離線席位保留 10 分鐘
- 房間狀態自動寫入 `data/rooms.json`
- 伺服器啟動時自動讀取房間存檔
- 房主瀏覽器保存「伺服器簽章房間快照」
- Render 等無持久磁碟環境若因重啟/重新部署失去記憶體房間，原房主重新開啟頁面時可自動復原房間與所有玩家席位
- 其他玩家可再使用原 reconnect token 接回自己的席位
- Render Blueprint 會自動產生 `ROOM_SIGNING_SECRET`，不把密鑰寫入 GitHub

## 本機啟動
```bash
npm install
npm start
```
開啟 `http://localhost:3000`。

## Render
Repository 根目錄已包含 `render.yaml`。在 Render 使用 Blueprint 連接本 repository 即可建立 Web Service。

> 免費 Render 磁碟不保證跨重新部署持久存在，因此 v0.5 同時使用房主瀏覽器的簽章復原快照作為第二層復原機制。只要原房主仍保留瀏覽器資料，即可在伺服器重啟後自動重建房間。
