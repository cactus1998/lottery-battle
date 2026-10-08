# 抽獎大亂鬥（lottery-battle）

趣味抽獎：每個參加號碼是一個小人，在競技場自動混戰，最後存活的人得獎。同一個 seed 可以重播出完全相同的結果。

- 技術：Vite、React 19、TypeScript、zustand、Canvas 2D、Vitest
- 線上：https://kentfolio.dev/lottery-battle/
- 規格與進度：[docs/](docs/README.md)

```bash
npm install
npm run dev        # 開發
npm run test:run   # 測試
npm run build      # 建置（base: /lottery-battle/）
```

## 開發方式：規格驅動的 AI 協作

本專案以 AI 輔助開發（Claude Code）。我的重心在**規劃與把關**：先定義玩法與規則，拆成可驗收的規格，再把引擎規則與程式規範寫成 skill，讓 AI 照同一套流程實作，最後由測試驗證。

### 1. 規格先行：總規格 → 功能 PRD → TODO

- [總規格](docs/PRD-lottery-battle.md)拆成 21 份功能 PRD（[docs/](docs/README.md)），每份都有 MoSCoW 範圍、邊界情況與 Given-When-Then 驗收標準。
- [TODO](docs/TODO.md) 依相依關係分階段：先做引擎與遊戲迴圈，再做完整流程，最後才加效果與音效。
- 規劃會隨實測調整，並留下紀錄：原本的毒圈改為延長賽，不縮圈但保證對戰一定結束；TODO 保留被取代的項目與原因。

### 2. 流程寫成 skill

| 階段 | skill | 規範的內容 |
|------|-------|-----------|
| 規劃 | `feature-spec` | 實作前先產出 PRD |
| 引擎 | `game-engine` | 決定性規則：所有隨機都來自 seed、固定步長，同 seed 必定重播出相同結果 |
| 實作 | `new-feature`、`react-conventions` | 元件、hook、zustand store 的撰寫規範 |
| 學習 | `vue-to-react` | 以 Vue 3 觀念對照 React 寫法，並累積成 [對照筆記](docs/vue-to-react.md) |
| 品質 | `add-tests`、`perf-audit` | golden test 鎖定同 seed 結果、引擎 `step()` 耗時與 Canvas FPS 量測 |
| 交付 | `git-commit`、`deploy-check` | 測試與 build 通過才提交，上線前檢查 base 路徑 |

### 3. 我做的規劃決策

- 玩法與規則：原本同時存活者依 HP 排名，觀眾看不出名次怎麼分出來，改為一律打到剩最後一人、名次完全依存活順序（`6cbd50a`）。
- 平衡驗收：職業技能改版後，以 200～300 個 seed 模擬各職業勝率，確認分布合理（`9f54dd0`）。
- 範圍取捨：引擎規則改版後，舊紀錄用原 seed 重播會得到不同結果，因此移除歷史紀錄重播，只保留結果頁的重播（`3e0a082`）。

### 4. AI 負責的部分

- 依 PRD 與 skill 產生實作程式碼與測試。
- 所有變更都要通過型別檢查與測試才提交。
