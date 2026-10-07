# PRD：打到最後一人（last-one-standing）

## 目標

不論獎品有幾個，對戰都打到只剩 1 人才結束。名次完全由存活順序決定：最後存活者是第 1 名，最後倒下的是第 2 名，依此類推；前 N 名（N = 獎品數）得獎。

原本的規則是「剩下 N 人就結束」，同時存活的 N 人再依 HP 排名，觀眾看不出 1、2、3 名怎麼分出來的。

## 範圍

- **Must**
  - 結束條件改為存活數 ≤ 1（`killUnit`、`createWorld`、`forceFinish`）。
  - `getResult`：`winner` 改為 `rank <= settings.winners`。
  - 戲劇效果以「剩 1 人」為終點：剩 3 人內為決戰時刻、剩 2 人且有人血量偏低為賽點。
  - 設定頁：獎品數可以等於參加人數（每人都有名次獎品），只有獎品數多於參加人數才報錯。
  - 更新 golden test 期望值與相關測試。
- **Won't**：調整職業平衡、延長賽時程。

## 邊界情況

- 只有 1 位參加者：開局即結束，該人第 1 名。
- 舊歷史紀錄 seed 重播：規則改變，結果會與舊紀錄不同（重播功能已移除，無影響）。

## 驗收標準

- [x] AC-01：Given 30 人 4 個獎品，When 跑到結束，Then 存活 1 人，名次 1–4 標記得獎，第 2 名是最後倒下者。
- [x] AC-02：Given 任意人數與獎品數，When 跑到結束，Then 在 `maxTicks` 前結束且得獎人數 = min(獎品數, 人數)。
- [x] AC-03：Given 同 seed，When 跑兩次，Then 名次相同。
- [x] AC-04：Given 剩 3 人，Then 戲劇階段為 `final`。

## 開發紀錄

- 2026-10-07：使用者回報 4 個獎品時剩 4 人就結束、看不出名次怎麼分。改為一律打到剩 1 人。
- AC-01 由 `world.test.ts` 的 `fights down to a single survivor regardless of prize count` 驗證；AC-02、AC-03 由既有的人數 / 決定性測試涵蓋；AC-04 由 `drama.test.ts` 驗證。
- golden test（16 人、3 個獎品、seed 20261006）：名次順序不變，tick 從 1178 變成 1402（多打到剩 1 人）。
- 設定頁：獎品數可以等於參加人數（參加者最少仍是 2 人）。
