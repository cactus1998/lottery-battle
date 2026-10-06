---
name: game-engine
description: lottery-battle 模擬引擎（src/engine）的規則：決定性（seed 重播）、固定步長、系統順序、平衡參數、效能與 golden test。修改 src/engine 下任何檔案、調整數值平衡、新增遊戲機制（毒圈、隨機事件）時套用。
---

# 模擬引擎

引擎決定誰得獎，所以「公平」與「可重播」比好看更重要。

## 決定性（必守）

- 只用 `createRng(seed)` 產生的 `Rng`；禁止 `Math.random`、`Date.now`、`performance.now`、`crypto`（`randomSeed()` 只在開局前由 UI 呼叫）。
- 時間只來自 tick 數：`time = tick * DT`，`DT = 1 / 30`。`step(world)` 一次只推進一個 tick，不接受可變的 dt。
- 迭代順序固定：依 `units` 陣列順序或 rng 洗牌；不依賴 `Map` / `Set` 以外的不穩定順序，不依賴物件 key 順序做邏輯。
- 不在引擎中使用浮點累積誤差敏感的比較做勝負判定（例如距離比較用平方距離）。
- 同 tick 內攻擊依 rng 洗牌順序逐一結算；已死亡的單位不能出手。存活數不會低於得獎人數。

## 結構

```
src/engine/
  rng.ts          # mulberry32
  config.ts       # 共通數值（場地、步長、延長賽時程）
  classes.ts      # 職業數值（HP、速度、射程、傷害、冷卻、特性）
  types.ts        # Unit、World、BattleEvent、BattleResult
  world.ts        # createWorld(entrants, settings, seed)、step(world)
  systems/        # overtime、targeting、movement、combat、projectiles、damage、death
  spatialHash.ts  # 找最近敵人（TODO 11）
```

- `step` 依固定順序呼叫系統：overtime → targeting → movement → combat → projectiles。傷害一律經過 `applyDamage` / `applySplash`，死亡經過 `killUnit`（回傳 true 時立即停止本 tick）。新增系統時說明放在哪一步與原因。
- 系統之間只透過 `World` 溝通；需要給 UI 的事件（命中、擊殺、射擊、爆炸、旋風斬、延長賽）推進 `world.events`，由 `GameController` 每 tick 取走。
- 數值一律放 `config.ts`，不在系統中寫魔術數字。
- 引擎不 import `react`、`render/`、`game/`、DOM API。

## 效能

- 熱迴圈內不建立新物件或陣列（預先配置、重用）；不使用 `filter` / `map` 產生暫存陣列。
- 最近敵人搜尋在 300 人時使用空間雜湊，不做 O(n²)。
- 目標：300 人時 `step()` ≤ 2ms（`src/engine/world.perf.test.ts` 量測，見 `/perf-audit`）。

## 測試

- 每個系統有單元測試（建立小 world，手動擺位置）。
- **golden test**（`world.golden.test.ts`）：固定 seed 與名單跑到結束，斷言名次陣列與 tick 數。改動平衡或系統順序導致 golden 變化時，先向使用者說明原因再更新期望值，不要默默改。
- 決定性測試：同 seed 跑兩次結果相同；`stepUntilEnd` 與逐 tick `step` 結果相同。
- 終止測試：2 人、300 人、得獎人數 = n − 1 都會在 `maxTicks` 安全上限前結束。

## 調平衡

職業勝率是體感重點：調整 `classes.ts` 後，暫時寫一個測試跑 2 / 10 / 30 / 100 / 300 人各數十到數百個 seed，統計平均時長、各職業勝率與平均名次百分位，前後對照後回報，結束後刪除暫時測試。

1. 說明想改善的體感問題（例如「前 10 秒沒人打架」）。
2. 只改 `config.ts`，跑一批 seed（例如 100 場）統計平均時長、第一滴血時間，前後對照後回報。
3. 更新 golden test 並在 commit 內文附數據。
