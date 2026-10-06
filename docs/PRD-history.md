# PRD：歷史紀錄（history）

## 目標

保存最近 20 場，可從設定頁重播。

## 範圍

- **Must**：`lib/storage.ts`（`{ version, data }`、驗證、失敗回預設值）；新對戰結束時寫入（重播不寫）；設定頁列出日期、人數、得獎者、seed；重播；兩段式清除。

## 驗收標準

- [x] AC-01：版本不符、JSON 壞掉、容量滿時不拋錯（`storage.test.ts`）。
- [x] AC-02：最多保留 20 筆，重播不新增（`appStore.test.ts`）。

## 開發紀錄

- 偏好（速度、音效、FPS）同樣用 storage 存在 `prefs`。
- 清除紀錄不用 `window.confirm`，改成按鈕兩段式確認。
