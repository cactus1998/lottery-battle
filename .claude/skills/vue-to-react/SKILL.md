---
name: vue-to-react
description: 用 Vue 3 的觀念解釋 React 寫法：並排對照程式碼、說明心智模型差異與陷阱，並把新學到的對照補進 docs/vue-to-react.md。使用時機：/vue-to-react <概念或檔案>，或使用者問「Vue 的 xxx 在 React 怎麼寫」「這段 React 為什麼這樣寫」「看不懂這個 hook」。
argument-hint: <Vue 概念、React API 或檔案路徑>
---

# Vue → React 對照

使用者熟悉 Vue 3（Composition API、`<script setup>`、Pinia）。用已知的 Vue 觀念解釋新東西。

## 回答方式

1. 一句話結論：對應 Vue 的什麼。
2. 並排程式碼：左 Vue、右 React（用兩個程式碼區塊），範例優先取自本專案實際程式碼；給檔案路徑。
3. 差異與原因：從「React 每次 render 重跑元件函式、狀態 immutable」解釋，不只說「React 就是這樣」。
4. 陷阱：這個寫法在 React 最容易犯的錯（stale closure、依賴陣列、StrictMode 雙掛載、`&&` 印出 0 等）。
5. 指定檔案時：逐段解釋該檔案用到的 React 概念，標出行號。

## 更新筆記

- 對照不在 `docs/vue-to-react.md` 時，補進對應表格或「常見陷阱」，一列一個概念，保持精簡。
- 已存在時不重複，只在有新陷阱或更好的例子時補充。

## 功能完成時的「Vue 對照」

依 `CLAUDE.md`，完成一項功能回報時附 2–3 條：這次用到的 React 寫法、對應 Vue 的什麼、差在哪。挑真正用到且有差異的，不湊數。
