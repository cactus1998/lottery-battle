---
name: git-commit
description: Git Commit 流程：執行 lint、型別檢查、測試與 build 預檢，生成繁體中文 Angular 規範的 commit 訊息並提交，有 upstream 時推送。使用時機：/git-commit，或使用者說「幫我 commit」「提交變更」「push」「推上去」。
---

# Git Commit

## 安全規則

- 預檢失敗就停止，回報錯誤，不要 commit。
- 不使用 `--no-verify`，不跳過 hooks。
- 只在目前分支已設定 upstream 時 push；不使用 `--force` / `--force-with-lease`，不刪除遠端分支。
- 不把 `.env*`、金鑰、`dist/`、`node_modules/` 加進 commit；發現時先警告使用者。

## 步驟

### 1. 檢查狀態

`git status` 與 `git branch --show-current`。個人專案：直接 commit 在目前分支，不開新分支。

### 2. 預檢

依序執行，任一失敗就停止：

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test:run`
4. `npm run build`

只改文件（`docs/`、`*.md`）或 `.claude/` 時可跳過預檢，並在回報中說明。

### 3. 暫存變更

沒有已暫存的變更時，列出變更檔案，詢問要暫存全部還是特定檔案。暫存時列出具體檔名，不盲目 `git add .`。

### 4. commit 訊息

讀 `git diff --staged`，寫繁體中文 Angular 規範訊息：

- type：`feat`、`fix`、`refactor`、`perf`、`style`、`test`、`docs`、`build`、`chore`
- scope：優先用 PRD slug（`engine-core`、`setup-screen`），跨功能用層級名稱（`engine`、`game`、`render`、`ui`）或 `skills`、`docs`
- 標題 ≤ 50 字，不加句號
- 內文說明為什麼改；平衡調整或效能變更附前後數據

```text
<type>(<scope>): <功能說明>

摘要：
<一到兩句說明目的>

主要變更內容：
- <變更 1>
- <變更 2>
```

小變更只寫標題。依系統指示附 `Co-Authored-By` trailer。

### 5. 提交

```bash
git commit -F - <<'EOF'
<訊息>
EOF
```

提交後 `git log --oneline -1` 確認。

### 6. 推送

1. 只有 `git rev-parse --abbrev-ref @{u}` 成功時才 `git push`。
2. 沒有 upstream 時不 push，提示使用者：第一次推送執行 `! git push -u origin <分支>`；還沒有 `origin` 時先建立 GitHub repo 並 `! git remote add origin <repo URL>`。
3. push 被拒時回報錯誤原文；遠端有新 commit 時建議 `git pull --rebase` 由使用者決定，不自行 rebase、不 force。

回報：commit hash 與標題、是否已推送。
