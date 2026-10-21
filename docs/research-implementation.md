# 02 研究方法與研究發現

實作日期：2026-10-21。設計來源：[Figma 312:423](https://www.figma.com/design/v6D0w3r2uq6Yp890752s9k/企劃書?node-id=312-423)。本次透過 Figma MCP 重新讀取設計內容與截圖。

## 範圍與版型

沿用原生 HTML、CSS、JavaScript 與既有導覽，不新增執行時套件。`index.html` 的 `#research` 包含四個具名區塊；`styles.css` 的新增樣式以研究章節 class 為範圍，不更改首頁與導覽列的版型。`navigation.js` 保持原樣。

| Figma 節點 | 內容 | 實作 |
| --- | --- | --- |
| 312:443 | 研究方法、情境與問卷招募註記 | `.research-methods` |
| 329:1086 | 三款直接競品、LINE 與三個設計問題 | `.research-competition` |
| 312:463 | 35／47、32／47、8／47、6／37 | `.research-findings` |
| 312:483 | 五階段旅程與「記住或交代」重點 | `.research-journey` |

桌機沿用 1440px 最大寬、64px 水平留白與 Figma 字級。各區使用最小高度，文字增加時允許自然長高。Figma 重複的導覽列整合為網站原本的一個固定導覽列。

1100px 以下調整卡片欄數與留白；700px 以下卡片與旅程採單欄。比較表使用原生 `table`、欄列標頭與具名可聚焦的捲動區域，保留欄位對應，支援觸控及方向鍵水平捲動。研究章節標題使用 h2，內部標題依層級排列，旅程使用有序清單。

## 素材與字型

設計僅使用既有 Logo 與橘色章節圓點，直接重用 `public/assets/` 的相同素材；橘點維持 10×10px。沒有使用設計截圖當作網頁內容，也沒有暫時的 Figma 素材網址。

新增三個 `chiron-research-*.ttf` 本機字型子集，透過獨立字型家族限定在研究章節。字型來源為 Google Fonts 的 Chiron GoRound TC，沿用現有 SIL Open Font License。首頁原本的三個字型檔不變。

## 驗證

可重跑的瀏覽器檢查：`scripts/verify-research.py`，開發工具需要 Python、Playwright、fonttools 與 Microsoft Edge。這些不是網站執行時依賴。

先啟動 README 中的靜態伺服器，再執行：

```powershell
python scripts/verify-research.py --output "$env:TEMP/bubu-research-qa"
```

檢查範圍：320、390、700、768、1024、1280、1440、1920px；整頁橫向溢出、文字裁切、章節定位與固定導覽遮擋、章節高亮、上一頁／下一頁、比較表鍵盤捲動、素材載入與橘點尺寸、減少動態效果設定下直接進入 `#research`、720px 重排，以及三種字重的研究文案字元覆蓋。腳本輸出 JSON 結果和 390／1440px 的區塊截圖。區塊截圖暫時隱藏固定導覽，以避免長截圖中出現重疊；另存一般視窗截圖保留導覽供檢查。

本次結果：八種寬度全部通過；無整頁橫向溢出、文字裁切、瀏覽器 JavaScript 錯誤或 HTTP 載入失敗。400／500／700 三種字重的研究文案缺字數皆為 0。已人工對照 1440px 桌機與 390px 手機截圖；`node --check navigation.js` 與 `git diff --check` 通過。

本次以 Windows Edge 的桌機瀏覽器與窄視窗檢查，未測試實體 iOS／Android 裝置。未加入後端或資料互動，研究內容為 Figma 設計中的靜態研究結果。
