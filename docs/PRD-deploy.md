# PRD：部署（deploy）

## 目標

讓大家能在 `https://kentfolio.dev/lottery-battle/` 直接玩。

## 範圍

- **Must**：原始碼推到公開 repo `cactus1998/lottery-battle`；build 產物複製到 `portfolio-dist/lottery-battle/`（GitHub Pages，自訂網域 kentfolio.dev）並 push。
- **Won't**：portfolio 首頁卡片（另一個 repo，之後再決定）。

## 驗收標準

- [x] AC-01：`https://kentfolio.dev/lottery-battle/` 回應 200，JS / CSS 皆以 `/lottery-battle/` 路徑載入。
- [x] AC-02：Chrome 開啟正式網址畫面正常、console 無錯誤。

## 開發紀錄

- 2026-10-06 首次部署：portfolio-dist `6df073d`，來源 `lottery-battle@77699b4`。push 後約 1.5 分鐘 GitHub Pages 生效。
- 之後更新用 `/deploy-check`。
