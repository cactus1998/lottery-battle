# PRD：介面打磨（ui-polish）

## 目標

深淺色主題、手機可用、鍵盤可操作。

## 範圍

- **Must**：CSS 變數 token 與 `prefers-color-scheme` 深色；最小寬度 360px；所有操作可用鍵盤；換畫面時焦點移到標題；`aria-pressed` 標示目前速度；`aria-keyshortcuts`。
- **Won't**：手動切換主題按鈕。

## 驗收標準

- [x] AC-01：375px 寬（iframe 模擬）不破版，場地下方直接是控制列。
- [x] AC-02：Chrome console 無錯誤。
