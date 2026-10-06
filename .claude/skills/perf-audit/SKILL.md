---
name: perf-audit
description: 量測 lottery-battle 效能：引擎 step() 耗時（world.perf.test.ts）、Canvas FPS 與長任務、React re-render 次數、打包體積，輸出依影響排序的改善清單。使用時機：/perf-audit [engine | render | react | bundle | all]，或使用者說「很卡」「掉幀」「檢查效能」。
argument-hint: [engine | render | react | bundle | all]
---

# 效能檢查

先量測再下結論。每個建議附改善前數據與預估效果。

## engine

1. `src/engine/world.perf.test.ts`：300 人、固定 seed，量前 300 tick 的 `step()` 平均與 p95。目標 300 人 ≤ 2ms。
2. `npx vitest run src/engine/world.perf.test.ts --silent=false`，讀取輸出的 mean / p95。
3. 慢時檢查：O(n²) 找敵人、熱迴圈配置新物件、陣列 `filter` / `map`。

## render

1. `npm run dev`，300 人開場；開 FPS 顯示（TODO 11 之後有）或 DevTools Performance 錄 10 秒。
2. 檢查長任務（> 50ms）、每幀 draw 耗時、`fillText` 次數（號碼文字是常見瓶頸，可快取成 offscreen canvas）。
3. 分頁在背景時 rAF 會暫停，量測前保持前景。

## react

1. React DevTools Profiler 錄一場對戰。
2. 期望：戰鬥中只有 HUD 元件 re-render，頻率 ≤ 10 次/秒；Canvas 元件不因 HUD 更新 re-render。
3. 有多餘 re-render 時先確認 zustand selector 與 `getSnapshot` 參照穩定，再考慮 `memo`。

## bundle

1. `npm run build`，記錄每個檔案大小與 gzip。
2. 首次載入 JS gzip 目標 ≤ 120KB。

## 報告

| 項目 | 目前 | 目標 | 做法 | 預估效果 |
| ---- | ---- | ---- | ---- | -------- |

詢問使用者要做哪些項目，確認後再改；改完重新量測，commit 內文附前後數據，並更新 `docs/PRD-perf.md` 開發紀錄。

## 原則

- 不為數字犧牲決定性：優化後 golden test 必須不變。
