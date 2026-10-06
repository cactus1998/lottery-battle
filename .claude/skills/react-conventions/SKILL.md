---
name: react-conventions
description: lottery-battle 的 React 19 + TypeScript 撰寫規範：元件、hooks、狀態（useState / zustand / useSyncExternalStore）、副作用與清理、Canvas 整合、CSS Modules、無障礙與 localStorage。撰寫或修改 src/ 下任何 .tsx / 非 engine 的 .ts 檔案時套用。
---

# React 撰寫規範

開發者是 Vue 工程師。寫法偏離 Vue 直覺的地方（re-render 模型、immutable 更新、effect 清理），在程式碼註解或回報中簡短說明原因。

## 元件

- 函式元件 + 具名 export；檔名 PascalCase `BattleHud.tsx`，一檔一個元件。
- Props 用 `type XxxProps = { ... }`，在參數解構並給預設值；不使用 `React.FC`。
- 事件 callback 命名 `onXxx`（prop）與 `handleXxx`（元件內函式）。
- React 19：`ref` 直接當 prop 傳，不用 `forwardRef`。
- 不使用 `any`；`!` 只用在 `main.tsx` 的 root。

## 狀態放哪

| 狀態                                            | 放哪                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| 單一元件的 UI 狀態（輸入框、展開）              | `useState`                                                        |
| 可由其他值算出                                  | render 時直接算，不另存 state                                     |
| 跨畫面：`phase`、名單、設定、最後結果           | zustand `src/store/`                                              |
| 每幀變動的遊戲狀態                              | `GameController` 內部，React 不持有                               |
| HUD 要顯示的遊戲資料                            | `useGameSnapshot`（`useSyncExternalStore`），snapshot ≤ 10Hz 更新 |
| 不影響畫面的可變值（controller 實例、timer id） | `useRef`                                                          |

- zustand 用 selector：`useAppStore(s => s.phase)`；一次取多個欄位用 `useShallow`。
- 更新物件 / 陣列一律產生新值，不 mutate。
- `getSnapshot` 必須在資料沒變時回傳同一個參照，否則會無限 re-render。

## 副作用

- `useEffect` 只用來同步外部系統：Canvas、rAF、`GameController`、`ResizeObserver`、鍵盤 listener。
- 每個 effect 都回傳 cleanup；dev 模式 StrictMode 會掛載兩次，cleanup 後再建立必須正常。
- 不用 effect 做「state A 變了就 set state B」；改在事件處理或 render 時處理。
- 依賴陣列寫完整，不關掉 `react-hooks` 規則。

## 結構

```
src/features/<name>/
  <Name>Screen.tsx       # 畫面組裝
  <Part>.tsx             # 子元件
  use<Xxx>.ts            # 該功能的 hook
  <Name>Screen.module.css
  <Name>Screen.test.tsx
```

- 元件只負責畫面；邏輯放 hook 或 `lib/` 純函式（例如名單解析 `parseEntrants`），純函式優先測試。
- `features/*` 不互相 import；共用的東西提到 `components/`、`lib/` 或 `store/`。

## 效能

- 不預先 `useMemo` / `useCallback` / `memo`；有量測證據（React DevTools Profiler）才加。
- 列表 `key` 用穩定 id，不用 index。
- 遊戲畫面不靠 React render；不在 rAF 中呼叫 setState。

## 樣式

- CSS Modules（`*.module.css`）＋ `src/index.css` 的 CSS 變數 token；深色以 `prefers-color-scheme` 覆寫 token。
- mobile-first，最小 360px。
- 動畫尊重 `prefers-reduced-motion`。

## 無障礙

- 可點擊用 `<button type="button">`；表單欄位有 `<label>`。
- 圖示按鈕加 `aria-label`；鍵盤快捷鍵在畫面上有提示。
- 宣布得獎者用 `aria-live="polite"`，戰鬥中的擊殺訊息不要用 live region（太吵）。

## 資料持久化

- `localStorage` 只透過 `src/lib/storage.ts`：格式 `{ version: 1, data }`，`try/catch` 讀取，版本不符或解析失敗回預設值。
- 只存歷史紀錄與 UI 偏好（速度、靜音）。

## 路徑

- 靜態資源用 `import` 或 `` `${import.meta.env.BASE_URL}xxx` ``，不寫死 `/xxx`（部署在 `/lottery-battle/`）。
