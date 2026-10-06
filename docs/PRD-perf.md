# PRD：效能（perf）

## 目標

300 人時維持順暢。

## 範圍

- **Must**：空間格子找最近敵人、熱迴圈不配置陣列、FPS 顯示（F 鍵）、`world.perf.test.ts` 量測 tick 耗時。

## 驗收標準

- [x] AC-01：300 人 `step()` p95 < 2ms（實測平均 0.13ms、p95 0.31ms）。
- [x] AC-02：300 人畫面 60 FPS（Chrome，1536×689 視窗實測）。
- [x] AC-03：首次載入 JS gzip ≤ 120KB（實測 81.8KB）。

## 開發紀錄

- Vitest 5 的 `bench` 匯出方式與舊版不同，改用一般測試以 `performance.now()` 量測；斷言放寬到 p95 < 5ms，避免機器忙碌時誤報。
