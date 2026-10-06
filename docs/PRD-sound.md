# PRD：音效（sound）

## 目標

可選的打擊音效，預設靜音。

## 範圍

- **Must**：Web Audio 即時合成（hit、crit、kill、zone、finish），不需要音檔；同類音效有最短間隔，避免 300 人時爆音；M 鍵或按鈕切換，偏好會記住。

## 驗收標準

- [x] AC-01：預設靜音；第一次取消靜音（使用者互動）時才建立 `AudioContext`。
- [x] AC-02：離開對戰畫面時關閉 `AudioContext`。

## 開發紀錄

- 未寫自動化測試（jsdom 沒有 Web Audio），聲音需在瀏覽器手動確認。
