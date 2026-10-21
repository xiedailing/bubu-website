# 06 Live Demo 現場操作引導

實作日期：2026-10-21。

依 [Figma 324:921](https://www.figma.com/design/v6D0w3r2uq6Yp890752s9k/企劃書?node-id=324-921) 的設計資料與截圖，在既有 `#demo` 容器實作。保留導覽、首頁、02–04、05A–C 及共用 JavaScript，使用原生 HTML／CSS。新增樣式獨立於 `demo.css`，限定 `.demo` 範圍。

包含個人補貨的四個步驟、家庭共同採買的三個步驟、產品入口、備援文字及 localStorage 單機模擬註記。產品入口以原生連結在新分頁開啟，支援鍵盤焦點及 Enter。備援列依稿保留為說明文字；專案沒有 90 秒備用錄影，尚無錄影入口。

桌機依稿使用 1440px 最大寬度、64px 頁邊、44/58px 標題、兩張等高卡片與 36px 編號圓。700px 以下改為單欄並縮小字級與頁邊，網址可以換行。僅沿用單一共用固定導覽列。

橘點沿用既有相同的 `chapter-dot.svg`，三個位置皆為 10×10px。使用原先下載的完整 Chiron GoRound TC 字型產生獨立的 400／500／700 字重子集，產生時檢查本章文字與步驟編號的字元覆蓋；沒有暫時 Figma 素材網址。

## 驗證

執行 `scripts/verify-demo.py`（需 Python Playwright、Edge 及 5173 本機伺服器）。

- 320、390、700、768、1024、1280、1440、1920px：無頁面溢出、文字裁切、HTTP 或 JavaScript 錯誤。
- 三個橘點素材載入、來源與 10×10px 尺寸正確；情境卡欄數與步驟數正確。
- 章節深連結、導覽、瀏覽器返回、Tab 焦點及 Enter 開啟新分頁通過。新分頁測試攔截產品請求，驗證連結行為與目的網址，未驗證外部產品登入功能。
- iPhone 13 模擬觸控與減少動態效果通過；未使用實體手機。
- 1440px 與 390px 截圖已人工檢視，位於 `artifacts/demo-qa/`，同目錄包含 `report.json`。
- `scripts/verify-iteration.cjs` 八種寬度及模擬手機回歸通過，包含 05A–C 十張圖片的放大操作。報告位於 `artifacts/demo-iteration-regression/`。

本次只新增 06 內容、樣式、字型與驗證資料，07 仍為既有空白容器。
