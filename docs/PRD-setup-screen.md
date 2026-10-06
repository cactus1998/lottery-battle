# PRD：設定畫面（setup-screen）

## 目標

輸入參加名單與設定，驗證後開始對戰。

## 範圍

- **Must**：號碼範圍（起、迄、排除 `4, 13, 20-25`）、貼上名單（一行一位、去除空白與重複）、獎品欄位（一個名次一個獎品、最多 10 個、填幾個就取幾名，取代原本的得獎人數欄位；新增後自動聚焦，按 Enter 新增下一格）、選填 seed、即時顯示人數與錯誤。
- **Won't**：匯入 CSV 檔案。

## 資料與介面

- `lib/entrants.ts`：`parseRange`、`parseList`、`parseExclude`、`parseSeed`（純函式）。
- store：`draft`（表單值，回到設定頁時保留，含 `prizes: { id, name }[]`）、`updateDraft`、`addPrize`、`updatePrize`、`removePrize`、`startBattle`。
- `BattleSettings.prizes`：依名次的獎品名稱，引擎不使用，結果頁與歷史紀錄用 `lib/prizes.ts` 的 `prizeForRank` 取得。

## 邊界情況

| 編號  | 情境                      | 預期行為                        |
| ----- | ------------------------- | ------------------------------- |
| EC-01 | 起 > 迄、非整數、空白     | 顯示錯誤，開打按鈕停用          |
| EC-02 | 超過 300 人或超大範圍     | 顯示「最多 300 位」，不建立陣列 |
| EC-03 | 名單有重複名稱            | 去重並提示略過幾個              |
| EC-04 | seed 非數字或超過 32 位元 | 顯示錯誤                        |

## 驗收標準

- [x] AC-01：輸入 1–10、排除 3, 5、seed 42，開打後 store 收到 8 位參加者與 seed 42（`SetupScreen.test.tsx`）。
- [x] AC-02：獎品數量 ≥ 參加人數、或有獎品名稱未填時無法開打。
- [x] AC-03：填 Switch、禮券兩個獎品開打後，`settings` 為 `{ winners: 2, prizes: ['Switch', '禮券'] }`；最多 10 個、至少 1 個；刪除中間一列不會讓其他欄位錯位。

## 開發紀錄

- 解析結果在 render 時直接計算（相當於 Vue 的 computed），沒有額外的 state 或 effect。
- 表單值放 zustand 的 `draft`，從結果頁回來時保留上次輸入。
- 2026-10-06 依使用者要求加入獎品欄位（一個名次一個獎品），得獎人數改由獎品數量決定。獎品顯示在頒獎台、其他得獎者、名次表、複製結果文字與歷史紀錄。
