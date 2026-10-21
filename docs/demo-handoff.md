# 06 Live Demo：目前狀態與交接

更新日期：2026-10-21。

## 範圍與完成狀態

對照設計：https://www.figma.com/design/v6D0w3r2uq6Yp890752s9k/企劃書?node-id=324-921

本次檢查發現此頁已存在於工作區，沿用原實作，沒有重寫或覆蓋其他章節。內容位於 `index.html` 的 `#demo`，樣式為 `demo.css`，章節導覽為 `navigation.js`。原生 HTML／CSS／JavaScript，無建置步驟。

已具備：兩個情境及 4／3 個步驟、產品新分頁連結、備援說明、localStorage 單機模擬註記、桌機雙欄及手機單欄、既有本地 Logo／橘點／Chiron 字型。

本次新增 Node 版驗證腳本 `scripts/verify-demo.cjs`，原 Python 腳本所需的 Playwright 在目前 Python 環境中不存在，因此使用已安裝的 Node Playwright，不新增專案依賴。

## 本次驗證

啟動伺服器：`python -m http.server 5173 --bind 127.0.0.1`

預覽：http://127.0.0.1:5173/#demo

執行：`node scripts/verify-demo.cjs <playwright 套件絕對路徑>`。

本機 Node：`C:/Program Files/nodejs/node.exe`。

本機 Playwright：`C:/Users/喵喵凌/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`。

320、390、700、768、1024、1280、1440、1920px 檢查通過：沒有橫向溢出或文字裁切、三個 10×10px 橘點載入、步驟數正確、章節選取正確、鍵盤焦點與 Enter 新分頁正確，沒有 HTTP／JavaScript 錯誤。截圖及 JSON 報告在 `artifacts/demo-current-qa/`。

產品請求在測試中被攔截，僅驗證連結目的地及開啟行為，未測試外部產品登入。未執行本次範圍之外的全站回歸或部署。

## 尚待素材／後續可做

- 90 秒備用錄影尚未提供。現有備援列只是 Figma 對應的說明文字；取得正式影片或截圖後再接實際入口，勿製造無效連結。
- 若要部署，沿用使用者指定的部署流程；本次只完成本地確認。
- `#results`（07 成果）仍為既有空白容器，不在這次單頁任務內。

## 給接手 AI

先讀此文件、`docs/demo-implementation.md`、`demo.css` 與 `index.html` 的 `#demo`。這頁目前無已知待修的排版問題，不需重新開發。若使用者提供備援素材，只補備援入口並重跑驗證即可。工作區原先已有大量未提交檔案，請勿 reset、clean、覆蓋或自行提交全部變更。
