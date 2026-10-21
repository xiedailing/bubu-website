# 03 洞察與問題定義

實作日期：2026-10-21。來源：[Figma 315:492](https://www.figma.com/design/v6D0w3r2uq6Yp890752s9k/企劃書?node-id=315-492)，透過 Figma MCP 重新讀取設計內容與參考截圖。

## 實作

沿用原生 HTML／CSS／JavaScript。將 `index.html` 原本的 `#insights` 空白容器實作為兩個區塊，樣式新增於 `styles.css` 的 03 章節範圍；既有導覽、首頁、研究內容與 `navigation.js` 保持原樣。

| Figma 節點 | 實作 | 內容 |
| --- | --- | --- |
| 315:512 | `.insights-overview` | 三項洞察、優先標籤、研究依據與註記條 |
| 315:532 | `.insights-definition` | 核心問題定義、重點粗體與研究整合註記 |

桌機最大寬度 1440px、左右留白 64px，兩區最小高度各 814px。重複的 Figma 展示導覽沿用網站單一固定導覽。洞察卡採三欄，使用 Flex 排列內容並將依據列置底；區塊與卡片允許內容自然長高，不使用固定高度裁切。1100px 以下改為單欄、700px 以下使用 24px 水平留白與手機字級。問題定義保留兩段語意換行，窄螢幕允許文字重排。

沿用相同的本機 `bubu-logo.svg` 與 `chapter-dot.svg`，所有橘點維持 10×10px。新增三個 `chiron-insights-*.ttf` 字型子集，來源為 Google Fonts 的 Chiron GoRound TC，限定於本章節；三種字重皆驗證文案無缺字。既有字型檔不變，授權沿用 `public/assets/chiron-OFL.txt`。沒有使用設計截圖或暫時的 Figma URL 作為網頁素材。

## 驗證

`scripts/verify-insights.cjs` 使用 Playwright 與本機 Microsoft Edge。先依 README 啟動靜態伺服器，再執行：

```powershell
node scripts/verify-insights.cjs <Playwright模組路徑> <截圖輸出資料夾>
```

Playwright 可由開發工具環境提供，不是網站的執行時依賴。本次使用已安裝的 Playwright 套件之 JavaScript 入口進行驗證。

檢查 320、390、700、768、1024、1280、1440、1920px：整頁橫向溢出、文字裁切、卡片欄數、素材載入與尺寸、導覽遮擋、章節切換、上一頁／下一頁與返回首頁。此外以 iPhone 13 設定模擬觸控、直接進入 `#insights` 及減少動態效果，並確認 720px 重排。腳本輸出報告與桌機／手機截圖；區塊截圖暫時隱藏固定導覽以便比對。

結果：八種寬度、觸控模擬與歷史導覽通過，無文字裁切、整頁橫向溢出、JavaScript 錯誤或 HTTP 載入失敗。人工檢視 1440px／390px 截圖，並與 Figma 對照。另對既有首頁與研究章節檢查 390px／1440px 的文字與圖片，以及手機比較表的鍵盤捲動，均通過。`node --check navigation.js`、`node --check scripts/verify-insights.cjs`、`git diff --check` 通過。

手機檢查使用 Windows Edge 的視窗與裝置模擬，未使用實體 iOS／Android 裝置。
