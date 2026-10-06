# PRD：Canvas 繪製（canvas-renderer）

## 目標

把 world 畫到 Canvas：場地、毒圈、小人（身體、武器、眼睛、血條、號碼）、墓碑與特效。

## 範圍

- **Must**：DPR 清晰度、ResizeObserver 自適應、位置內插、小畫面時放大小人外觀（螢幕半徑至少 7px）、號碼至少 10px。
- **Won't**：sprite 圖片、鏡頭跟隨。

## 驗收標準

- [x] AC-01：視窗縮放後畫面自動填滿正方形容器且不模糊。
- [x] AC-02：300 人時 60 FPS（Chrome 實測，開啟 FPS 顯示）。
- [x] AC-03：jsdom 沒有 canvas 時 renderer 直接略過，不拋錯。

## 開發紀錄

- `Renderer` 只讀 world；顏色字串依索引快取，避免每幀組字串。
- 第一版把 1000 單位場地縮到 470px 時，小人只剩 3.7px。改成依縮放倍率放大外觀，只影響畫面，不影響碰撞與攻擊距離。
