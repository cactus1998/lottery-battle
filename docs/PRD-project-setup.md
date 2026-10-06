# PRD：專案初始化（project-setup）

## 目標

建立可開發、可測試、可部署到 `/lottery-battle/` 子路徑的 React 專案骨架。

## 範圍

- **Must**：Vite + React 19 + TypeScript；oxlint；Prettier；Vitest + jsdom + Testing Library；`@` 指向 `src`；`base: '/lottery-battle/'`；seeded rng。
- **Won't**：CI、router、UI 套件。

## 驗收標準

- [x] AC-01：`npm run lint`、`npm run typecheck`、`npm run test:run`、`npm run build` 全部通過。
- [x] AC-02：`dist/index.html` 引用的資源路徑帶 `/lottery-battle/`。
- [x] AC-03：`createRng` 同 seed 產生相同序列（`src/engine/rng.test.ts`）。

## 開發紀錄

- 以 `npm create vite@latest -- --template react-ts` 建立，保留模板的 oxlint（取代 ESLint，速度快、設定少）。
- tsconfig 加 `noUncheckedIndexedAccess`，陣列索引取值必須處理 `undefined`，引擎大量用陣列，及早擋錯。
- Vitest 設定寫在 `vite.config.ts` 的 `test` 欄位，setup 檔 `src/test/setup.ts` 載入 jest-dom matcher。
- 狀態管理選 zustand：寫法最接近 Pinia setup store，用 selector 訂閱避免不必要的 re-render。
