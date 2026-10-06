# PRD：遊戲迴圈（game-loop）

## 目標

在 React 之外用 requestAnimationFrame 跑固定步長模擬與繪製，React 只讀節流後的 HUD 快照。

## 範圍

- **Must**：`GameController`（start / stop / 暫停 / 1x 2x 4x / skipToEnd）、HUD 快照 ≤ 10Hz、`useGameSnapshot`（`useSyncExternalStore`）、分出勝負 1.8 秒後回報結果。
- **Won't**：Web Worker。

## 資料與介面

- `new GameController(config, { speed, showFps, reducedMotion, sound, onFinish })`
- `subscribe` / `getSnapshot`：箭頭函式屬性，可直接傳給 `useSyncExternalStore`。
- `HudSnapshot`：`elapsedSec`、`alive`、`total`、`winners`、`paused`、`speed`、`finished`、`zoneActive`、`killFeed`（最多 5 筆）、`leaders`（擊殺前 3 名）。

## 邊界情況

| 編號  | 情境                            | 預期行為                                  |
| ----- | ------------------------------- | ----------------------------------------- |
| EC-01 | StrictMode 掛載 → 卸載 → 再掛載 | start / stop 可重複呼叫，最後只剩一個 rAF |
| EC-02 | 分頁在背景 10 秒後切回          | 單幀最多補算 0.25 秒                      |
| EC-03 | 快照內容沒變                    | 回傳同一個物件，React 不 re-render        |
| EC-04 | 結束等待期間元件卸載            | stop 清掉 timer，不會呼叫 onFinish        |

## 驗收標準

- [x] AC-01：1x 約每秒 30 tick，4x 約 120 tick（`GameController.test.ts`）。
- [x] AC-02：暫停時 tick 不前進。
- [x] AC-03：`skipToEnd` 的結果與 `stepUntilEnd` 相同。
- [x] AC-04：StrictMode 下對戰畫面只有一個 rAF 迴圈，離開後歸零（`App.test.tsx`）。

## 開發紀錄

- 速度倍率用 accumulator：每幀把實際經過時間 × 倍率加進 accumulator，滿 1/30 秒就 `step` 一次；畫面用 `accumulator / DT` 內插位置。
- `onFinish` 由 `setOnFinish` 在 effect 中更新，避免 controller 抓住舊的 callback（stale closure）。
