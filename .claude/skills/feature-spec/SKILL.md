---
name: feature-spec
description: 在實作前先寫精簡規格：目標、範圍、狀態流程、介面、邊界情況與 Given-When-Then 驗收標準，存成 docs/PRD-<slug>.md，並同步 docs/TODO.md 與 docs/README.md。使用時機：/feature-spec <slug 或功能描述>，或使用者說「先規劃這個功能」「寫個規格」「需求拆解」。
argument-hint: <TODO 編號、slug 或功能描述>
---

# 功能規格

規格要短：一頁內寫完，重點是讓實作與測試有明確依據。

## 存放位置（必守）

- PRD 一律寫在 `docs/PRD-<slug>.md`，slug 與 `docs/TODO.md` 的連結一致。
- 在 `docs/README.md` 文件清單加一列（狀態 Draft），並把 `docs/TODO.md` 該列狀態改為「PRD 完成」。
- 範圍必須落在 `docs/PRD-lottery-battle.md` 之內；需要超出總規格時，先詢問使用者並同步更新總規格。

## 原則

- **明確**：不寫「適當的速度」「流暢的動畫」，要寫數值（例如 HUD 更新 ≤ 10Hz、死亡粒子 12 顆 0.4 秒）。
- **涵蓋邊界**：除了正常流程，列出空名單、重複名稱、超過上限、極端設定（得獎 = n − 1）、快速連點、分頁切到背景、視窗縮放、StrictMode 雙掛載。
- **公平性**：牽涉引擎時，寫明對決定性的影響與 golden test 是否會變（見 `game-engine`）。
- **React 介面**：寫出元件 Props、hook 回傳值、store 欄位與 action。
- **可驗收**：每個需求對應至少一條驗收標準，驗收標準要能直接寫成測試。
- **先澄清**：需求只有一句話時，先列出 3–5 個關鍵決策與建議選項，跟使用者確認後再寫。

## 步驟

1. 讀 `docs/PRD-lottery-battle.md` 與 `docs/TODO.md` 該列內容與依賴項目，確認依賴已完成或已有介面。
2. 必要時提出關鍵決策問題。
3. 用下方模板寫入 `docs/PRD-<slug>.md`，同步 README 與 TODO。
4. 有狀態轉換時附 Mermaid 狀態圖。
5. 回報規格摘要與建議實作順序。

## 模板

```markdown
# PRD：<功能名稱>（<slug>）

## 目標

<這個功能解決什麼問題（2–3 句）>

## 範圍

- **Must**：
- **Should**：
- **Won't**：

## 使用情境

- 身為 <主持人 / 觀眾 / 參加者>，我想要 <操作>，以便 <目的>。

## 狀態與流程

\`\`\`mermaid
stateDiagram-v2
[*] --> Setup
Setup --> Battle : 開始
Battle --> Paused : 暫停
Paused --> Battle : 繼續
Battle --> Result : 剩 N 人
Result --> Battle : 重播
Result --> Setup : 重新設定
\`\`\`

## 資料與介面

- engine：<新增的型別、系統、config 欄位>
- game：<GameController 方法、snapshot 欄位>
- React：<元件 Props、hook 回傳值、store 欄位與 action>

## 邊界情況

| 編號  | 情境 | 預期行為 |
| ----- | ---- | -------- |
| EC-01 |      |          |

## 非功能需求

- 效能：<數值目標>
- 無障礙：<鍵盤、ARIA>
- RWD：<最小寬度 360px>

## 驗收標準

- [ ] AC-01：Given <前置條件>，When <操作>，Then <預期結果>

## 開發紀錄

<完成後補：實際做法、與規格的差異、量測數據、Vue 對照心得>
```

## 與其他 skill 的關係

- `/new-feature`：實作以 PRD 的 Must 範圍為準，不額外擴充。
- `/add-tests`：每條 AC 與 EC 至少對應一個測試。
