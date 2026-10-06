# PRD：模擬引擎核心（engine-core）

## 目標

用純 TypeScript 模擬混戰，結果只由 seed、名單、設定決定，可在 Node 測試、可重播。

## 範圍

- **Must**：`config`、`types`、`createWorld`、`step`、`stepUntilEnd`、`getResult`；選目標、移動、碰撞分離、攻擊、死亡、勝負判定；golden test。
- **Won't**：不同職業或能力值。

## 資料與介面

- `createWorld({ entrants, settings, seed }): World`
- `step(world)`：推進一個 tick，系統順序 zone → targeting → movement → combat → zone 傷害。
- `stepUntilEnd(world): BattleResult`、`getResult(world): BattleResult`
- `world.events`：`hit`、`kill`、`zone-start`、`finish`，由 GameController 取走。
- `SpatialGrid`：50 單位格子，`nearest()` 由內向外一圈圈搜尋，`queryInto()` 給碰撞分離用。

## 邊界情況

| 編號  | 情境                       | 預期行為                                   |
| ----- | -------------------------- | ------------------------------------------ |
| EC-01 | 最後兩人同一 tick 互砍致死 | 洗牌後先出手者先結算，死者不能出手，留一人 |
| EC-02 | 得獎人數 ≥ 參加人數        | `createWorld` 直接標記結束，`step` 不動作  |
| EC-03 | 兩個小人位置完全重疊       | 依索引決定推開方向，維持決定性             |
| EC-04 | 超過 `maxTicks`（120 秒）  | 依 HP 由低到高淘汰到剩得獎人數（安全網）   |

## 驗收標準

- [x] AC-01：同 seed 跑兩次結果完全相同（`world.test.ts`）。
- [x] AC-02：2 / 10 / 50 / 300 人、各種得獎人數，結束時存活數剛好等於得獎人數。
- [x] AC-03：golden test 記錄 seed 20261006 的名次與 tick 數（`world.golden.test.ts`）。
- [x] AC-04：`SpatialGrid.nearest` 與暴力搜尋結果一致。

## 開發紀錄

- 初版數值（HP 100、冷卻 0.8 秒）跑 40 個 seed：300 人平均 24 秒就結束，毒圈還沒發揮作用。調成 HP 150、冷卻 1 秒、毒圈提早到 15 秒後，300 人平均 33 秒，觀賞時間較合適。
- 熱迴圈內不配置新陣列：攻擊順序與鄰近查詢共用 `world.scratch`、`world.neighbors`。
- 實測 300 人 `step()` 平均 0.13ms、p95 0.31ms（`world.perf.test.ts`）。
