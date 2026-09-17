# aw-kit

Allen Wu 的跨專案前端套件（更名自 `aw-notify-kit`，2026-09-17 起）。單一 npm 套件、**只有子路徑匯出**：
`aw-kit/notify`（toast／confirm／hosts＋`createNotify` adapter）、`aw-kit/notify/style.css`、
`aw-kit/eslint-rules`（三條規則）、bin `aw-check-rpc-types`。消費端用 `github:WUCL/aw-kit#vX.Y.Z` 釘版。

---

## 這個 repo 從哪裡來（重要 — 這是「移植」不是「原創」）

每一塊都是從生產環境已驗證的機制搬來，**不是從零設計**。要追溯「為什麼這樣設計」去來源 repo 看，這裡不重複：

| 子路徑 | 來源 | 設計討論在哪 |
|---|---|---|
| `notify` toast／confirm／hosts | mh1491 通知系統重構（2026-07） | `mh1491/docs/superpowers/specs/2026-07-12-notify-kit-design.md`、`plans/2026-07-12-notify-kit.md` |
| `notify` `createNotify`／`errText` | inknock `src/shared/ui/notify.ts`＋`shared/errors.ts`（2026-09-15） | 檔頭註解 |
| `eslint-rules/verified-supabase-write` | mh1491 `eslint-rules/verified-supabase-write.js`（2026-09-02） | 檔頭註解＋mh1491 ADR-0001 |
| `eslint-rules/no-hardcoded-design-token`、`no-inline-date-format` | inknock `eslint.config.js` 的 `no-restricted-syntax` selectors（2026-08／09） | inknock `docs/design/style-plan.md` §8.3 |
| bin `aw-check-rpc-types` | inknock `scripts/check-rpc-types.mjs`（2026-09-16） | 檔頭註解 |
| v0.2.0 的套件形狀（子路徑、不留根 `.`、不做 workspaces） | `aw-cc_workflow/docs/plans/2026-09-17-aw-admin_starter.md` §0／§3／§4＋`DECISIONS.md` 2026-09-17 | 該 plan 檔 |

本機路徑：`~/Documents/GitHub/ucdi/mh1491`、`~/Documents/GitHub/ucdi/inknock`、`~/Documents/GitHub/aw-cc_workflow`。
**動 mh1491／inknock 的來源檔只讀不改。**

移植時的改動只有：拿掉 Tailwind → `fbk-*` class＋CSS variable；拿掉對消費端 Button 的依賴；
Strict Mode refcount guard；焦點還原防呆；規則 TS 化（unwrap `as`／`satisfies`／`!`）與參數化；
CLI 的 scan root／baseline 參數化。

---

## 架構速覽

| 路徑 | 負責 | 怎麼交付 |
|---|---|---|
| `src/notify/toast.js`、`confirmDialog.js` | module-level emitter（pub/sub、Promise-based confirm） | vite build → `dist/notify/` |
| `src/notify/ToastHost.jsx`、`ConfirmDialogHost.jsx`、`Button.jsx` | React hosts＋自帶按鈕 | 同上 |
| `src/notify/createNotify.js` | 專案層 adapter factory：分級判準的單一出處 | 同上 |
| `src/notify/styles.css`、`injectStyles.js` | 主樣式（→ `dist/notify/style.css`）與 CSS 注入 fallback | 同上 |
| `src/notify/index.js`、`index.d.ts` | barrel export、手寫型別（build 時複製進 dist） | 同上 |
| `src/eslint-rules/*.js`、`index.js`、`index.d.ts` | 三條規則＋flat-config plugin 物件 | **不 build**，直接從 src 匯出 |
| `bin/aw-check-rpc-types.mjs` | ratchet CLI | **不 build** |
| `tests/notify/`、`tests/eslint-rules/`、`tests/bin/` | jsdom 元件測試／RuleTester（TS parser）／subprocess＋fixture | `npm test` |

---

## 重要規則 / gotcha（給未來的 Claude，避免重踩雷）

- **不可加 `"prepare"` script 到 package.json**：消費端 `npm install github:...` 會跑 `prepare`，但沒裝這裡的 devDependencies（vite），install 直接失敗。
- **`dist/` 刻意 commit 進 git**：消費端不 build，只拉 `dist/` 靜態檔。改完 `src/notify/` 記得 `npm run build` 並一起 commit，否則消費端裝到舊版。`eslint-rules` 與 `bin` 不在此列（純 Node ESM，從 src 直出）。
- **不留根路徑 `.` 匯出**：搬遷要是明確的 sed，不是靜默相容。有人要求加回根匯出時，先看 plan §0 的理由。
- **Strict Mode guard 用 refcount 不用布林**：布林在兩個 host 卸載順序不同時會誤判，code review 抓到後改成 module-level 計數器。
- **兩個 host 的「多重掛載」警告文字刻意不同**：ToastHost 重複掛載＝都收到事件、畫面重複；ConfirmDialogHost 重複掛載＝最後掛的贏、前面悄悄失效。是真實機制差異（Set 多監聽 vs 單一 handler 覆蓋）。
- **`createNotify` 的 `refusalCodes` 沒有預設值**：哪些 Postgres 錯誤碼算「明確拒絕」是專案決定，套件放預設會讓分級判準有兩個出處。`toastFromError` 內部必須直接呼叫 `toast.warn`／`toast.error`，不可寫成呼叫自己（inknock 機械替換造成無限遞迴、只有測試抓得到）。
- **每個 refusal code 都要有獨立測試案例**：少一個，那個碼被人從白名單拿掉時測試仍全綠（Codex 在 inknock 抓到）。
- **`verified-supabase-write` 鏈上有 `.from()` 一律算 supabase 鏈**，與 `clientNames` 無關——這是抓 `const db = supabase` 別名的手段，不是 bug。TS wrapper 只是透明層，不能變逃生門：`(await q.update(v)) as any` 仍要報。
- **設計代幣規則是具名規則不是 `no-restricted-syntax`**：flat config 同名 rule 後者整段取代前者，inknock 因此在 `src/features` 三條全滅。不要「為了省事」改回 selector。
- **`no-inline-date-format` 是形狀防呆，不是完整禁止**：helper／中間變數是已知盲點，刻意不擴大 selector；套件不放 formatter 白名單檔，專案用 `files`／`ignores` 排除自己的 formatter。
- **CLI 的負例只能放隔離 fixture、透過 `--root` 掃**：放進正常路徑會讓消費端 CI 必紅。baseline key 是相對 `--root` 的路徑（與 inknock 舊版不同，遷移要刪舊基線再 `--init-baseline` 一次；`--update-baseline` 有新命中時拒絕寫入（只縮不長））。
- **RuleTester 一律用 TS parser**（`tests/eslint-rules/_ruleTester.js`）：規則出貨給 TS 專案，JS parser 看不到 `TSAsExpression` 等節點，會漏掉真實誤報。
- **`undoDelete` 之類綁定資料庫的邏輯刻意不進套件**；`format`（日期／金額）也不進套件（plan §8），由 starter 複製。
- **`package-lock.json` 已 commit**：只服務套件開發者。

---

## 開發指令

```bash
npm install
npm test         # vitest run（notify jsdom／eslint-rules RuleTester／bin subprocess）
npm run build    # 只 build notify → dist/notify/{index.js,index.d.ts,style.css}
```

發版：改 `package.json` version＋`src/eslint-rules/index.js` 的 `meta.version`＋CHANGELOG → `npm run build` → commit → **由使用者 push 與打 tag**。

---

## Remote

```
origin  https://github.com/WUCL/aw-kit.git   （舊 URL aw-notify-kit 會轉址）
```

---

## 目前狀態（更新：2026-09-17）

- 2026-09-17：v0.2.0 實作＋Codex review 修正完成（7 個本機 commit `772baa4`→`ca895ab`），**待使用者 push 並打 `v0.2.0` tag**；C（aw-admin_starter）等 tag。

**待辦：** 見 `TODO.md`
