# 07 成果、學習、團隊與後續驗證

實作日期：2026-10-22。

依 [Figma 324:999](https://www.figma.com/design/v6D0w3r2uq6Yp890752s9k/企劃書?node-id=324-999) 最新設計資料與截圖實作。最新稿共有五段，含展示用重複導覽時為 1440×4500px，已更新 README 的舊尺寸。

## 實作範圍

- `index.html`：填入既有 `#results`，包含四項產品成果、四項專案學習、兩位成員的主要貢獻與共同協作、近期／中長期／長期方向，以及生活化品牌收尾。
- `results.css`：樣式限於 `.results`，沿用既有色彩與 Chiron GoRound TC 字型。1440px 時保留 64px 頁邊、44/58px 標題、每段 814px 高度，省略 Figma 重複導覽列。1100px 以下收斂版面與留白；700px 以下卡片單欄、內容自然展開，標題平衡換行。
- `public/assets/`：新增收尾 Logo `07-bubu-logo.svg` 與 400／500／700 字重的本章字型子集。兩份 Figma 橘點與現有 `chapter-dot.svg` 的 SHA-256 完全一致，直接沿用；Logo 使用本次下載版本。10 個可見圖片位置均檢查來源、載入與渲染尺寸（9 個 10×10px 橘點、1 個 60×45px Logo）。所有素材皆為本地檔案。
- `scripts/subset-results-fonts.py`：從完整 Chiron 字型重建本章子集，逐字檢查涵蓋範圍。三種字重皆通過，授權沿用 `chiron-OFL.txt`。

保留原生 HTML／CSS／JavaScript，沒有新增執行時套件或建置流程。既有導覽與 `navigation.js`、首頁、02–06 的內容、樣式及互動皆保留。本章使用既有 `#results` 深連結及章節狀態更新，未新增按鈕或互動。

成果卡片的「Vue 3／Vercel」為 Figma 指定的產品成果文案，描述補補產品；本發表網站仍使用原生 HTML／CSS／JavaScript。未把未來方向實作成產品功能。

## 驗證

執行：

```powershell
node scripts/verify-results.cjs 'C:/Users/喵喵凌/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
```

需 Microsoft Edge、可用的 Node Playwright 與 5173 本機靜態伺服器；亦可傳入其他 Playwright 套件路徑及第三個參數作為網站網址。網站本身不依賴這些測試工具。

- 320、390、700、768、1024、1100、1280、1440、1920px：沒有橫向溢出或文字裁切，卡片欄數與內容數量正確，圖片及字型載入正常，沒有 HTTP／JavaScript 錯誤。
- 1440px 五段高度皆為 814px；章節標題不被固定導覽遮住。
- Tab 焦點、Enter 前往 07、01–07 導覽及瀏覽器上一頁／下一頁通過。
- iPhone 13 模擬觸控與減少動態效果通過。另檢查 1440px 桌機放大 200% 的等效重排寬度（720 CSS px）；未使用實體手機，未宣稱測過 Safari。
- 桌機與手機五段截圖均已檢視；截圖及 JSON 報告位於 `artifacts/results-qa/`。
- 既有 `verify-demo.cjs` 八種寬度與鍵盤新分頁測試通過；外部產品請求被攔截，未測試產品登入。
- 既有 `verify-iteration.cjs` 八種寬度、圖片放大、關閉與模擬手機觸控回歸通過；報告位於 `artifacts/results-iteration-regression/`。

另執行 premium 靜態檢查，報告為 `artifacts/results-qa/static-audit.json`。它將原有 04／05 圖片按鈕、共用關閉按鈕及舊預覽副本誤判為沒有行為（共 40 筆），未辨識 `solution.js` 的 DOM 事件綁定；本次新增區域沒有違規。相關既有按鈕以瀏覽器回歸確認有效，未為通過靜態掃描而修改範圍外程式。

本次完成本地實作與檢查，未部署。
