# 05B／05C 設計迭代

實作日期：2026-10-21。

依 Figma 最新設計及截圖實作：

- [05B 認購改為認領，320:755](https://www.figma.com/design/v6D0w3r2uq6Yp890752s9k/企劃書?node-id=320-755)
- [05C 日期設定，320:910](https://www.figma.com/design/v6D0w3r2uq6Yp890752s9k/企劃書?node-id=320-910)

## 實作

在 `#iteration` 的 05A 後接上兩個區塊。保留既有導覽、首頁、02–04 及 05A，使用原生 HTML／CSS／JavaScript。沿用 `iteration.css` 的卡片、版本標籤、手機外框，新增樣式以 `.iteration-b`、`.iteration-c` 限定範圍。

05B 包含 3／7 測試觀察、按鈕文字調整、版本差異摘要及兩張畫面。05C 包含至少 2／7 測試觀察、從先估日期到累積紀錄的設計回應及三張畫面。兩區皆保留第二輪測試待確認的註記。

五張手機截圖由 Figma 提供的素材下載至 `public/assets/05b-screen-{1,2}.png` 與 `05c-screen-{1,2,3}.png`，無暫時 Figma URL。螢幕顯示尺寸 231.043×500px，外框 245.043×514px。放大圖示、章節橘點沿用既有相同素材；導覽沿用單一固定導覽。字型 400／500／700 子集已重新產生並確認全章節字元涵蓋。

1440px 保留 64px 頁邊、原稿字級、左右配置與對照圖間距。1250px 以下改為上下配置，700px 以下對照畫面直向排列。圖片以按鈕開啟原生 dialog，支援鍵盤、Escape、關閉按鈕及焦點還原。共用 `solution.js` 增加狀態檢查，避免延遲觸發的 close 事件清除剛重開的新圖片。

## 驗證

沿用 `scripts/verify-iteration.cjs`，擴充為檢查 05A–C 共十張圖：

```powershell
node scripts/verify-iteration.cjs <Playwright模組路徑> artifacts/iteration-bc-qa
node scripts/verify-solution.cjs <Playwright模組路徑> artifacts/solution-bc-regression
node scripts/verify-insights.cjs <Playwright模組路徑> artifacts/insights-bc-regression
```

320、390、700、768、1024、1280、1440、1920px 全部通過頁面溢出、文字裁切、圖片載入／比例／有效尺寸、導覽狀態、瀏覽器返回及全部圖片鍵盤放大檢查。iPhone 13 模擬觸控與減少動態效果檢查通過。無 JavaScript 或 HTTP 錯誤。

1440px 與 390px 的 05B／05C 截圖已人工檢視，位於 `artifacts/iteration-bc-qa/`，同目錄含 JSON 報告。04、03 的八種寬度回歸通過，首頁與 02 在 390／1440px 回歸通過。使用 Windows Edge 裝置模擬，未使用實體手機。
