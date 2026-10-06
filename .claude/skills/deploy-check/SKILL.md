---
name: deploy-check
description: 部署到 https://kentfolio.dev/lottery-battle/：跑完整關卡、build、檢查 base 路徑、預覽，經使用者同意後複製到 portfolio-dist/lottery-battle 並在 portfolio-dist commit 與 push。使用時機：/deploy-check，或使用者說「部署」「上線」「更新正式站」。
---

# 部署

正式站是 GitHub Pages repo `portfolio-dist`（`https://github.com/cactus1998/portfolio-dist`，自訂網域 `kentfolio.dev`），每個專案一個子資料夾。本專案的資料夾是 `lottery-battle/`。

- 本專案：`C:\Users\s7708\Desktop\所有工作\前端\react\趣味抽獎`
- 部署 repo：`C:\Users\s7708\Desktop\所有工作\前端\vue3\portfolio-dist`

## 步驟

1. **狀態**：本專案 `git status`；有未 commit 的變更時停止，建議先 `/git-commit`。
2. **關卡**（任一失敗就停止）：`npm run lint`、`npm run typecheck`、`npm run test:run`、`npm run build`。
3. **base 檢查**：
   - `vite.config.ts` 的 `base` 是 `/lottery-battle/`。
   - `dist/index.html` 的 `src` / `href` 都以 `/lottery-battle/` 開頭；`grep` 原始碼沒有寫死的 `"/` 資源路徑。
4. **預覽**：`npm run preview`，提示使用者開 `http://localhost:4173/lottery-battle/` 實際玩一場（或用瀏覽器工具確認畫面載入、console 無錯誤）。
5. **確認**：列出將覆蓋的資料夾 `portfolio-dist/lottery-battle/`、檔案數與大小，以及本專案 commit hash。**取得使用者明確同意後**才繼續。
6. **複製**：
   - `portfolio-dist` 先 `git status` 確認乾淨、`git pull --ff-only`。
   - 刪除 `portfolio-dist/lottery-battle/` 舊內容後複製 `dist/*` 進去（只動這個資料夾）。
7. **commit 與 push**（在 `portfolio-dist`）：
   - 訊息沿用該 repo 慣例：`deploy(lottery-battle): <說明>`，內文附本專案 commit hash。
   - 再次詢問後 `git push`；不 force。
8. **確認上線**：GitHub Pages 約 1–2 分鐘生效，提示使用者開 `https://kentfolio.dev/lottery-battle/` 確認。

## 首次部署額外事項

- portfolio 首頁（`vue3/portfolio`）加專案卡片屬於另一個 repo，先詢問使用者再處理。

## 原則

- 只修改 `portfolio-dist/lottery-battle/`，不碰其他專案資料夾。
- 不 force push、不使用 `--no-verify`。
