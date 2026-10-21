# 05A 設計迭代

實作日期：2026-10-21。依 [Figma 289:244](https://www.figma.com/design/v6D0w3r2uq6Yp890752s9k/企劃書?node-id=289-244) 的最新設計內容與截圖實作。

## 範圍與版面

在原有 `#iteration` 容器加入兩個區塊：測試觀察與完整畫面（300:251）、我的用品頂端與新增入口（415:1061）。保留既有導覽列及 01–04 內容；Figma 重複的展示導覽沿用網站單一固定導覽。05B、05C、06、07 不在本次範圍。

使用原生 HTML／CSS／JavaScript。新增 `iteration.css`，沿用既有色彩、章節標記、放大圖示與 `solution.js` 的原生 dialog。1440px 保留 64px 留白、字級、雙欄觀察、兩張與三張對照圖。1250px 以下觀察與對照改為上下排列；700px 以下卡片與截圖改為單欄，圖片完整保留並可放大。

## 素材與互動

五張截圖直接從 Figma MCP 提供的素材下載至 `public/assets/05a-screen-{1..5}.png`，分別為舊版首頁、目前我的用品、舊版所有用品選單、目前空間選單、目前加號選單。沒有使用整頁設計截圖或暫時素材 URL。

前兩張螢幕為 231.043×500px，後三張為 249.526×540px，外框各加 7px。沿用 Chiron GoRound TC 完整字型產生本章節 400／500／700 子集，全部可見文案字元涵蓋檢查通過。可用 `scripts/subset-iteration-font.py` 加上三個完整字重檔路徑重新產生，授權沿用 `public/assets/chiron-OFL.txt`。

每張圖使用原生按鈕，支援點擊、Enter／Space 放大、Escape／關閉按鈕與關閉後還原焦點。圖片內的 App 功能為展示截圖。

## 驗證

```powershell
node scripts/verify-iteration.cjs <Playwright模組路徑> artifacts/iteration-qa
node scripts/verify-solution.cjs <Playwright模組路徑> artifacts/solution-regression
```

05A 檢查 320、390、700、768、1024、1280、1440、1920px 的頁面溢出、文字裁切、圖片來源、有效尺寸、原圖比例、章節高亮、固定導覽遮擋與瀏覽器返回。各寬度逐一檢查五張圖的鍵盤放大與焦點還原，另使用 iPhone 13 模擬觸控及減少動態效果。無 JavaScript 或 HTTP 錯誤。1440px 與 390px 兩區塊截圖及 JSON 報告位於 `artifacts/iteration-qa/`，已人工檢視。手機檢查使用 Windows Edge 裝置模擬，未使用實體手機。

既有 04 驗證腳本的圖片按鈕選取範圍限縮至 `#solution`，避免把新增的 05A 圖片誤判為 04 流程截圖。
