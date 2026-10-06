---
name: add-tests
description: 為 lottery-battle 補測試：engine 純函式與決定性（golden test）、lib 純函式、hook、React 元件（Testing Library）、GameController（fake timers）。使用時機：/add-tests <PRD slug 或路徑>，或使用者說「補測試」「幫這個功能寫測試」。
argument-hint: <PRD slug | engine | lib | features/<name>>
---

# 加測試

測試驗證行為，不驗證實作細節。

## 位置與工具

| 對象                    | 位置                      | 工具                                     |
| ----------------------- | ------------------------- | ---------------------------------------- |
| `src/engine`、`src/lib` | 同目錄 `*.test.ts`        | Vitest                                   |
| hook                    | 同目錄 `use<Xxx>.test.ts` | `renderHook`（@testing-library/react）   |
| 元件                    | 同目錄 `<Name>.test.tsx`  | Testing Library + `userEvent` + jest-dom |
| `GameController`        | `src/game/*.test.ts`      | `vi.useFakeTimers()`，mock rAF           |

## 撰寫

有 `docs/PRD-<slug>.md` 時，每條 AC 與 EC 至少一個測試，名稱或註解標編號（`// EC-03`）。

優先順序：

1. **引擎**：固定 seed；決定性（跑兩次相同）、golden 名次、終止（2 人、300 人、得獎 = n − 1）、系統單元測試（手動擺位置）。
2. **純函式**：名單解析（範圍、排除、空白行、重複、上限 300）、格式化、storage 版本不符與 JSON 壞掉。
3. **元件**：用 `getByRole` / `getByLabelText` 查詢，模擬使用者輸入與點擊，斷言畫面文字與 store 結果。不測 CSS class、不做大量 snapshot。
4. **副作用與清理**：unmount 後 rAF 取消、listener 移除、`ResizeObserver.disconnect()`；StrictMode 雙掛載後只剩一個迴圈。

原則：

- 測試名稱描述行為：`it('ends with exactly N survivors')`。
- 每個測試獨立；zustand store 在 `beforeEach` 重設。
- Canvas 不測像素，測傳給 renderer 的資料或呼叫次數。

## 驗證

`npm run test:run` 與 `npm run typecheck`。回報測試數量與涵蓋的 AC / EC。發現產品程式碼有 bug 時先回報並詢問，不為了讓測試通過而改斷言。
