# CHANGELOG 2026 — aw-kit

> 各次對話的工作紀錄，依時間倒序排列。最新狀態請見 CLAUDE.md。（npm 發版紀錄在 `CHANGELOG.md`，兩檔用途不同。）

## 2026-09-17（v0.2.1：aw-check-rpc-types 遞迴掃描＋Codex review）

- 2026-09-17：v0.2.1 — `aw-check-rpc-types` 改為遞迴掃 `--root`（Codex P1），加 `nested/` 負例 fixture，已 push＋tag；Codex review 後補 README 釘版 → v0.2.1。
- 2026-09-17：v0.2.0 實作＋Codex review 修正完成（7 個本機 commit `772baa4`→`ca895ab`），**待使用者 push 並打 `v0.2.0` tag**；C（aw-admin_starter）等 tag。

---

## 2026-09-17（v0.2.0：更名 aw-kit、子路徑匯出、createNotify、三條 ESLint 規則、aw-check-rpc-types bin）

- 2026-09-17：v0.2.0 完整實作（更名 aw-kit、子路徑匯出、`createNotify` adapter、三條 ESLint 規則含 TS unwrap、`aw-check-rpc-types` bin、README／CHANGELOG 重寫），6 個本機 commit（含 Codex review 修正 `e6811a4`：ChainExpression、ratchet 只縮＋`--init-baseline`），**尚未 push、尚未打 v0.2.0 tag**（等使用者）。隔離消費端安裝驗證通過（三個 subpath 可解析、根 `.` 正確拒絕、bin 可執行、git 安裝不跑 build script）。
- 2026-07-12：v0.1.0 完整實作完成（scaffold → port toast/confirmDialog emitter → Button → styles/injectStyles → ToastHost/ConfirmDialogHost with Strict Mode + focus-restore guard → barrel export + dist build → README → 2 輪 code review 修正含 refcount guard fix 與警告文案修正）。已 push 到 GitHub，尚未打 tag。（v0.1.1–0.1.3 的發版見 `CHANGELOG.md`。）

---
