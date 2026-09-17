# TODO — aw-kit

## 待使用者

- [x] push `main` 並打 `v0.2.0`／`v0.2.1` tag（2026-09-17 完成）

## 消費端跟進（各自 repo，不在本 repo 做）

- [ ] inknock：`aw-notify-kit` → `aw-kit/notify` sed；`shared/ui/notify.ts` 改用 `createNotify`；`scripts/check-rpc-types.mjs` 改用 `aw-check-rpc-types` bin（刪舊基線、`--init-baseline`）；eslint 三條 selector 改 `aw-kit/eslint-rules`（存量多，severity 自行降 warn）
- [ ] mh1491：`aw-notify-kit` → `aw-kit/notify` sed；`eslint-rules/verified-supabase-write.js` 改用套件版

## 套件本身（有需求再做）

- [ ] `aw-check-rpc-types` 不抓 `Promise<Array<Row>>` 形狀、不支援 `--root=dir` 寫法（Codex P2，刻意保守；出現實際漏抓再補）
- [ ] `aw-check-rpc-types`：`listTsFiles` 目錄項目未排序，多檔違規時診斷輸出順序可能因檔案系統而異（基線檔本身已排序、不受影響）。下次改 CLI 順手加 `.sort()`。（Codex review 2026-09-17，Low）
- [ ] `no-hardcoded-design-token` 若小數誤傷（`fontSize: 0.875` 之類合法用法）再收窄回整數

## 地基回饋候選（base-promotion-candidate，需使用者確認後另開段落改 `aw-cc_workflow`）

- [ ] ratchet 型閘門通則：「`--update-baseline` 必須在有新命中時拒寫、基線只縮不長」——inknock 原版與本套件初版都能一個旗標洗白新違規（Codex 2026-09-17 P1）。建議落點：`aw-cc_workflow/CLAUDE.md`「高事故率規則要有可機械驗證的落地」段補一句；證據 `bin/aw-check-rpc-types.mjs` 檔頭、plan Codex verdict
- [ ] 共用套件發版慣例：「git 安裝只跑 `prepare`、`build` 不會；`dist/` 進 git」目前只在本 repo CLAUDE.md，`shared-packages.json` 所列套件若再多一個就該升格。落點 `templates/`（套件 CLAUDE.md 骨架）

## 已完成

- [x] 2026-09-17 v0.2.1：`aw-check-rpc-types` 遞迴掃描（aw-admin_starter Codex P1）
- [x] 2026-09-17 v0.2.0：更名、子路徑匯出、createNotify、三條規則、bin、docs、Codex review 修正
