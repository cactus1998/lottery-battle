# lottery-battle（號碼大亂鬥）

純娛樂的網頁抽獎：每個參加號碼是一個隨機職業的像素小人偶，在競技場 RTS 式自動混戰，最後存活者得獎。純前端（Vite + React 19 + TypeScript），部署到 `https://kentfolio.dev/lottery-battle/`。總規格見 `docs/PRD-lottery-battle.md`。

開發者是 Vue 3 工程師，第一次用 React 寫專案。

## 工作方式

- 開工前讀 `docs/TODO.md`，依編號與「基於」欄位的依賴順序進行。
- 每一項先有 `docs/PRD-<slug>.md`（`/feature-spec`），實作以 Must 範圍為準；完成後勾選 AC、補開發紀錄、更新 TODO 與 `docs/README.md` 狀態。
- 範圍超出總規格時先詢問。
- 完成一項功能回報時，附 2–3 條「Vue 對照」：這次用到的 React 寫法對應 Vue 的什麼、差在哪（規則見 `vue-to-react`）。

## 指令

| 用途   | 指令                                                                     |
| ------ | ------------------------------------------------------------------------ |
| 開發   | `npm run dev`                                                            |
| 檢查   | `npm run lint`、`npm run typecheck`、`npm run test:run`、`npm run build` |
| 格式化 | `npm run format`                                                         |

## 架構

```
src/
  engine/      純 TS 模擬：rng、型別、world、systems。不 import React / DOM / render
  render/      Canvas 2D 繪製（讀 world 狀態，不改它）
  game/        GameController：rAF 迴圈、固定步長、速度、暫停；subscribe / getSnapshot 給 React
  features/    setup / battle / result / history，各自的元件、hook、CSS Module、測試
  components/  共用 UI 元件
  store/       zustand store（跨畫面狀態）
  lib/         storage、格式化等工具
```

依賴方向：`features → game → render → engine`，反向 import 禁止。

## Skills

| 情境                                    | skill                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------- |
| 寫規格                                  | `/feature-spec`                                                           |
| 新增畫面或功能區塊                      | `/new-feature`                                                            |
| 改模擬引擎（移動、戰鬥、職業、平衡）    | `game-engine`                                                             |
| React 撰寫規範                          | `react-conventions`                                                       |
| Vue 寫法怎麼換成 React、解釋 React 概念 | `/vue-to-react`                                                           |
| 補測試                                  | `/add-tests`                                                              |
| 修 bug / 重構 / 查原因 / 驗收           | `surgical-patch`、`safe-refactor`、`investigate-first`、`verify-and-stop` |
| 效能量測（FPS、tick 耗時、打包）        | `/perf-audit`                                                             |
| commit、部署                            | `/git-commit`、`/deploy-check`                                            |

## 必守

- 對戰結果只由 seed + 參加名單 + 設定決定：引擎內不用 `Math.random`、`Date.now`、`performance.now`，一律用 `engine/rng.ts`。同 seed 重播必須得到同一個結果。
- 每幀畫面由 Canvas 直接畫，不用 React state 驅動；React 只負責 HUD 與表單，HUD 更新頻率 ≤ 10 次/秒。
- `localStorage` 只透過 `src/lib/storage.ts` 存取，格式 `{ version, data }`，讀取失敗回預設值。
- Vite `base` 固定 `/lottery-battle/`，資源路徑用 `import.meta.env.BASE_URL`，不要寫死 `/`。
- push 與部署只透過 `/git-commit`、`/deploy-check`，部署到 `portfolio-dist` 前先取得使用者同意。
