完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 |# 開發 TODO

總規格見 [PRD-lottery-battle.md](PRD-lottery-battle.md)。每一項開工前先用 `/feature-spec <slug>` 寫出 `docs/PRD-<slug>.md`（已存在就直接用），完成後勾選該 PRD 的驗收標準並更新下方狀態。

## 第一階段：引擎與迴圈

| #   | PRD                                       | 內容                                                                                                                | 基於 | 狀態 |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---- | ---- |
| 01  | [project-setup](PRD-project-setup.md)     | Vite + React 19 + TS、oxlint、Prettier、Vitest + Testing Library、`base: '/lottery-battle/'`、`@` alias、seeded rng | —    | 完成 |
| 02  | [engine-core](PRD-engine-core.md)         | `engine/types`、`config`、`createWorld`（隨機出生點）、`step`（選目標、移動、攻擊、死亡、勝負判定）；golden test    | 01   | 完成 |
| 03  | [zone](PRD-zone.md)                       | ~~毒圈縮小與圈外扣血~~ 已由 17 延長賽取代                                                                           | 02   | 移除 |
| 04  | [game-loop](PRD-game-loop.md)             | `GameController`：rAF 固定步長、暫停、1x/2x/4x、直接跑到結束；`useGameSnapshot`（`useSyncExternalStore`）           | 02   | 完成 |
| 05  | [canvas-renderer](PRD-canvas-renderer.md) | `Arena` 元件、DPR 與 ResizeObserver、畫小人與號碼、位置內插                                                         | 04   | 完成 |

## 第二階段：完整流程

| #   | PRD                                   | 內容                                                                    | 基於       | 狀態 |
| --- | ------------------------------------- | ----------------------------------------------------------------------- | ---------- | ---- |
| 06  | [setup-screen](PRD-setup-screen.md)   | 名單輸入（範圍 / 貼上）、驗證、得獎人數、seed；zustand store 與 `phase` | 01         | 完成 |
| 07  | [battle-screen](PRD-battle-screen.md) | Canvas + HUD（存活數、時間、擊殺訊息）、控制列、鍵盤快捷鍵              | 03、05、06 | 完成 |
| 08  | [result-screen](PRD-result-screen.md) | 得獎者頒獎台、名次表、重播、再開一場、複製結果                          | 07         | 完成 |

## 第三階段：好玩與完整度

| #   | PRD                                   | 內容                                                      | 基於 | 狀態          |
| --- | ------------------------------------- | --------------------------------------------------------- | ---- | ------------- |
| 09  | [effects](PRD-effects.md)             | 受擊閃白、傷害數字、死亡粒子、鏡頭震動、reduced motion    | 07   | 完成          |
| 10  | [history](PRD-history.md)             | `lib/storage`、最近 20 場紀錄、從紀錄重播                 | 08   | 完成          |
| 11  | [perf](PRD-perf.md)                   | 空間雜湊找最近敵人、300 人 FPS 與 tick 耗時量測、FPS 顯示 | 07   | 完成          |
| 12  | [ui-polish](PRD-ui-polish.md)         | 深色主題、360px RWD、鍵盤與 a11y                          | 08   | 完成          |
| 13  | [sound](PRD-sound.md)                 | （Could）Web Audio 音效，預設靜音                         | 09   | 完成          |
| 14  | [random-events](PRD-random-events.md) | （Could）補血包、狂暴、隕石                               | 03   | 未做（Could） |

## 第四階段：上線

| #   | PRD                     | 內容                                                            | 基於 | 狀態 |
| --- | ----------------------- | --------------------------------------------------------------- | ---- | ---- |
| 15  | [deploy](PRD-deploy.md) | build 到 `portfolio-dist/lottery-battle/`、portfolio 首頁加卡片 | 08   | 完成 |

## 第五階段：職業與小人偶（2026-10-06 需求變更）

| #   | PRD                                   | 內容                                                                             | 基於 | 狀態 |
| --- | ------------------------------------- | -------------------------------------------------------------------------------- | ---- | ---- |
| 16  | [classes](PRD-classes.md)             | 五種職業、洗牌發牌、投射物（箭、火球）、旋風斬、刺客獵殺遠程、HP 提高            | 02   | 完成 |
| 17  | [overtime](PRD-overtime.md)           | 移除毒圈，改為延長賽傷害倍率保證結束                                             | 16   | 完成 |
| 18  | [pixel-sprites](PRD-pixel-sprites.md) | 程式內建像素小人偶（帽子、武器、動作幀、受擊白）、像素草地、墓碑、職業圖示與介紹 | 16   | 完成 |
| 19  | [drama](PRD-drama.md)                 | 結尾戲劇效果：決戰時刻 / 賽點放慢、鏡頭拉近、暗角、最後一擊停格慢動作與閃光      | 16   | 完成 |
| 20  | [class-skills](PRD-class-skills.md)   | 每職業 1 主動（機率觸發）+ 1 被動、技能浮字與暈眩標記、重新平衡                  | 16   | 完成 |
