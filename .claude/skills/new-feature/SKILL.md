---
name: new-feature
description: 在 src/features 新增畫面或功能區塊：元件、hook、store 欄位、CSS Module、與 GameController 的接法、測試與驗證。使用時機：/new-feature <PRD slug 或描述>，或使用者說「做設定頁」「加結果畫面」「新增一個功能」。
argument-hint: <PRD slug 或描述>
---

# 新增功能

## 步驟

1. **規格**：以 `docs/PRD-<slug>.md` 的 Must 範圍為準；沒有 PRD 時先建議 `/feature-spec`。
2. **純邏輯先行**：解析、驗證、格式化等寫成 `src/lib/` 或 feature 內的純函式，先寫測試。
3. **store**：跨畫面狀態加到 `src/store/`（zustand），action 命名用動詞（`startBattle`、`finishBattle`）；畫面專屬狀態留在元件。
4. **元件**：依 `react-conventions` 的目錄與命名：
   ```
   src/features/<name>/<Name>Screen.tsx
   src/features/<name>/<Name>Screen.module.css
   src/features/<name>/use<Xxx>.ts
   src/features/<name>/<Name>Screen.test.tsx
   ```
5. **接遊戲迴圈**（battle 相關）：
   - `GameController` 用 `useRef` 持有，在 `useEffect` 建立並在 cleanup `destroy()`；StrictMode 下不能留下兩個 rAF 迴圈。
   - HUD 透過 `useGameSnapshot(controller)` 讀，不自行 setState 每幀資料。
   - Canvas 尺寸用 `ResizeObserver` + `devicePixelRatio`。
6. **畫面切換**：在 `App.tsx` 依 store 的 `phase` 顯示；切換時焦點移到新畫面標題。
7. **測試**：純函式完整覆蓋；元件用 Testing Library 以使用者行為測試（`userEvent` 點擊、輸入），用 `getByRole` / `getByLabelText` 查詢；Canvas 不測像素。
8. **驗證**：`npm run lint`、`npm run typecheck`、`npm run test:run`、`npm run build`，再 `npm run dev` 在瀏覽器實際操作一次（360px 寬、鍵盤操作、StrictMode 下 console 無錯誤）。
9. **回報**：新增檔案、store 變更、TODO 狀態，以及 2–3 條「Vue 對照」。
