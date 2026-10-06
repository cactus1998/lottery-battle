# Vue 3 → React 19 對照筆記

開發過程中遇到的對照會持續補在這裡（`/vue-to-react` 會更新本檔）。

## 心智模型

|          | Vue 3                                            | React 19                                |
| -------- | ------------------------------------------------ | --------------------------------------- |
| 更新方式 | 響應式追蹤：改 `ref.value`，只有用到它的地方更新 | 重新執行整個元件函式，產生新 JSX 再比對 |
| 狀態改變 | 直接改（mutable）                                | 產生新值（immutable），`setX(新值)`     |
| 元件函式 | `setup()` 只跑一次                               | 元件函式每次 render 都跑                |
| 樣板     | `<template>` + 指令                              | JSX（就是 JavaScript）                  |

最大的差別：**React 元件函式每次 render 都會重跑**。函式內宣告的變數、函式、物件每次都是新的；要跨 render 保留的值用 `useState`（會觸發 render）或 `useRef`（不觸發 render）。

## 常用寫法

| Vue                                        | React                                                               | 備註                                                       |
| ------------------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| `const n = ref(0)`；`n.value++`            | `const [n, setN] = useState(0)`；`setN(v => v + 1)`                 | 依前值更新用函式形式，避免拿到舊值                         |
| `const obj = reactive({...})`；`obj.a = 1` | `setObj(o => ({ ...o, a: 1 }))`                                     | 不能直接改物件，要換新物件                                 |
| `computed(() => a.value * 2)`              | `const double = a * 2`（render 時直接算）                           | 很貴才用 `useMemo`                                         |
| `watch(src, cb)`                           | 多數情況不需要：在事件處理裡做，或 render 時算                      | 同步外部系統才用 `useEffect`                               |
| `onMounted` / `onUnmounted`                | `useEffect(() => { ...; return () => cleanup }, [])`                | dev 的 StrictMode 會掛載→卸載→再掛載一次，cleanup 必須正確 |
| 模板 ref `useTemplateRef('el')`            | `const el = useRef<HTMLCanvasElement>(null)`；`<canvas ref={el} />` |                                                            |
| `defineProps<Props>()`                     | `function Foo({ a, b = 1 }: Props)`                                 |                                                            |
| `defineEmits` / `emit('change', v)`        | props 傳函式 `onChange={(v) => ...}`                                | React 沒有 emit，callback 就是 prop                        |
| `v-model`                                  | `value={v} onChange={(e) => setV(e.target.value)}`                  | 受控元件                                                   |
| `v-if` / `v-else`                          | `{cond ? <A /> : <B />}`、`{cond && <A />}`                         | `&&` 左邊是 `0` 時會印出 0                                 |
| `v-for` + `:key`                           | `{list.map(item => <Li key={item.id} />)}`                          |                                                            |
| `v-show`                                   | `style={{ display: cond ? '' : 'none' }}` 或 `hidden`               |                                                            |
| `<slot />`                                 | `children` prop                                                     | 具名 slot 用一般 prop 傳 JSX                               |
| `provide` / `inject`                       | `createContext` + `useContext`                                      |                                                            |
| composable `useXxx()`                      | custom hook `useXxx()`                                              | hook 只能在元件或 hook 頂層呼叫，不能放在 if / 迴圈裡      |
| Pinia setup store                          | zustand `create()`                                                  | 用 selector 取值：`useStore(s => s.phase)`                 |
| `<style scoped>`                           | CSS Modules `Foo.module.css`                                        | `className={styles.root}`                                  |
| `nextTick`                                 | 通常不需要；量 DOM 用 `useLayoutEffect`                             |                                                            |

## 常見陷阱

- **stale closure**：`useEffect` / `setInterval` 裡讀到的是建立當下那次 render 的值。解法：依賴陣列寫完整、用函式形式 setState、或把會變的值放 `useRef`。
- **每幀 setState**：遊戲迴圈每幀 `setState` 會讓整棵樹每秒 re-render 60 次。本專案改用 Canvas 直接畫，React 只讀節流後的 snapshot。
- **物件 / 函式 prop 每次都是新參照**：子元件用 `memo` 時才有影響，先不要預先最佳化。
- **useEffect 拿來同步 state**：「A 變了就 set B」通常應該改成 render 時直接算 B。

## 本專案實際用到的對照

| 情境                   | Vue 會怎麼寫                                      | 本專案 React 寫法                                                                        | 檔案                                         |
| ---------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| 元件內只建立一次的物件 | `setup()` 裡直接 `const c = new GameController()` | `const [c] = useState(() => new GameController())`，惰性初始化只跑一次                   | `src/features/battle/useBattleController.ts` |
| 外部物件的狀態給畫面用 | `shallowRef` + 手動 `triggerRef`                  | `useSyncExternalStore(subscribe, getSnapshot)`；`getSnapshot` 沒變時要回傳同一個物件     | `src/game/useGameSnapshot.ts`                |
| 重開一場、重置整個元件 | `:key` 換值                                       | `<BattleScreen key={battleKey} />`，key 變了就卸載重建                                   | `src/App.tsx`                                |
| 表單衍生資料           | `computed(() => parse(draft))`                    | render 時直接 `const parsed = parse(draft)`                                              | `src/features/setup/SetupScreen.tsx`         |
| 全域狀態               | Pinia `storeToRefs(store)`                        | zustand `useAppStore((s) => s.phase)`，每個欄位一個 selector                             | `src/store/appStore.ts`                      |
| 鍵盤快捷鍵             | `onMounted` 加 listener、`onUnmounted` 移除       | 同一個 `useEffect` 回傳 cleanup，依賴陣列列出用到的值                                    | `src/features/battle/BattleScreen.tsx`       |
| callback 一直是最新的  | 不需要考慮（setup 只跑一次、讀的是 ref）          | 每次 render 的函式都是新的，用 effect 交給 controller（`setOnFinish`）避免 stale closure | `src/features/battle/useBattleController.ts` |

- **StrictMode 雙掛載**：開發模式下 effect 會「執行 → cleanup → 再執行」。`GameController` 的 `start()` / `stop()` 設計成可以重複呼叫，`App.test.tsx` 驗證最後只剩一個 rAF 迴圈。
- **ref 不能在 render 中讀**：oxlint 的 `react(refs)` 規則會警告。只在 render 中建立一次的實例改用 `useState` 惰性初始化。
