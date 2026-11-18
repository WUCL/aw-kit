# 決策紀錄 — aw-kit

> **用途**：記錄「已經討論過並給過結論」的事項，避免重複討論、反覆處理、或結論在整理時遺失。
> 回頭確認某件事「當初到底決定怎樣、現在什麼狀態」時，先看這裡。
>
> **規則**：
> 1. 每次做出結論（定案 / 不做 / 已處理 / 擱置）就在此登記一列。
> 2. 重新提起任何事項前，先查這份清單——已定案/不做的**不重新討論**，除非出現新事證。
> 3. 這裡**只記結論與狀態**，不記過程（過程在 `CHANGELOG-YYYY.md` / git）；需要細節時連到 memory 或 ADR。
> 4. 清理 memory / TODO 時，**若某條承載的是一個結論，先確認它已登記在這裡，才可刪除**。
> 5. `/checkpoint` 收尾時會掃描本 session 有無結論漏登記——但平時做出結論就當下登記，不要積到 checkpoint。
> 6. **安全**：這是 git 版控檔，絕不可放密鑰 / token / 任何 secret 明文。
>
> **各文件邊界（一個決策該寫哪）**：
> - **本檔 DECISIONS.md** = 所有「已定案/不做/擱置」結論的**單一入口索引**（狀態 + 一句話 + 連結）；尤其「決定**不做** X」這種別處不會記的。連 ADR 也放一列指過去。
> - **docs/adr/**（若有） = 有結構性影響的架構決策（重、少）。
> - **memory `feedback_*`** = 可重用的工作方式 / 技術陷阱（不是一次性決策）。
> - **CHANGELOG** = 做了什麼（動作流水帳）。
> - 本檔只放「狀態 + 一句話 + 連結」，**理由細節放 memory/ADR，不重複**（避免 drift）。

## 狀態圖例

| 圖示 | 意義 |
|------|------|
| ✅ | 已處理 / 已完成 |
| 🔒 | 定案（採用此做法，不再討論） |
| 🚫 | 不做（評估後決定不採用） |
| ⏸️ | 擱置（暫不處理，未來觸發式重看） |

---

## 2026-11

| 日期 | 主題 | 結論 | 狀態 | 細節 |
|------|------|------|------|------|
| 2026-11-19 | **`aw-kit/ui` 工具鏈（A 批）** | ① 開發依賴 React 19 **精確釘在兩消費端較低的版本**（目前 19.2.4），消費端升級後才跟著升 ② 型別檢查 `tsconfig.ui.json`＝兩消費端最嚴聯集（inflorify 嚴格旗標＋inknock ES2020 lib） ③ 匯出表**逐條列舉**、目標只收 `./src/ui/` 開頭字串、`src/ui` 除 README 與 `internal/` 外每個檔案都要有匯出（`tests/ui/exports.test.js`，含固定負例） ④ CI：React 19 全套＋build；React 18 重跑 `tests/ui` 以外全部 ⑤ 🚫 不做「dist 與 src 逐字同步」閘門（重建只差壓縮變數名） | 🔒 | inknock `docs/plans/2026-11-19-aw-kit-ui.md` |
| 2026-11-18 | **新增子路徑 `aw-kit/ui`：inknock 與 inflorify 共用的 UI 元件** | 使用者在 inknock grilling 確認。① **TS 原始碼交付、不 build**（`exports` 指 `src/ui/*.tsx`、`files` 含 `src/ui`；消費端 Vite／Tailwind 編譯、`@source` 掃套件目錄）——notify／panel 維持 JS＋dist，兩種交付並存，為 2026-09-17「只交付 dist」的例外 ② 新依賴（cva、lucide 等）一律**選用 peer**，dependencies 維持空，未 import `aw-kit/ui` 的消費端（mh1491、starter）不多裝任何東西 ③ `aw-kit/ui` 只支援 React 19；notify／panel 照舊 ≥18 ④ 不依賴 react-aria-components ⑤ 代幣名稱契約、產生器（bin）、頁面層閘門（eslint 規則／bin）也放這裡 ⑥ 補 CI（最嚴 tsconfig、元件測試、樣式閘門）；開發依賴 React 型別升 19 ⑦ 仍是單一套件、只有子路徑匯出、不做 workspaces（2026-09-17 套件形狀不變）。**尚未動工**：等 inknock 第一階段收尾 | 🔒 | inknock `docs/adr/0002-shared-ui-in-aw-kit.md` |

---

## 2026-09

| 日期 | 主題 | 結論 | 狀態 | 細節 |
|------|------|------|------|------|
| 2026-09-17 | `aw-check-rpc-types` 掃描範圍 | 遞迴掃 `--root`，只跳 `node_modules`；`.d.ts` 與 dotfolder **不**排除（保持逐層行為與 v0.2.0 一致，排除須另案論證） | 🔒 | v0.2.1 CHANGELOG；Codex review 2026-09-17 同意 |
| 2026-09-17 | 套件形狀 | 單一套件、只有子路徑匯出（`./notify`／`./notify/style.css`／`./eslint-rules`＋bin），**不留根 `.`**、不做 workspaces | 🔒 | `aw-workflow/DECISIONS.md` 2026-09-17；plan §0 |
| 2026-09-17 | `build` script 與 git 安裝 | npm 對 git dependency **只跑 `prepare`**，`build` script 不會觸發；不改 script 名 | ✅ | Codex P1 以 marker 實測駁回，見 CLAUDE.md gotcha、plan Codex verdict |
| 2026-09-17 | `aw-check-rpc-types` ratchet | `--update-baseline` 有新命中時拒寫（exit 1）；首次導入用 `--init-baseline`；基線只縮不長 | 🔒 | Codex P1；`bin/aw-check-rpc-types.mjs` 檔頭 |
| 2026-09-17 | `createNotify.refusalCodes` | 無套件預設值，由消費端決定 | 🔒 | `src/notify/createNotify.js` 檔頭 |
| 2026-09-17 | `no-hardcoded-design-token` 判定 | 所有 numeric literal（含小數）都算硬編，比 inknock 的整數 raw 寬 | 🔒 | 規則檔頭；TODO 留收窄條件 |
| 2026-09-17 | `verified-supabase-write` `.from()` 判定 | 鏈上有 `.from()` 一律算 supabase 鏈，與 `clientNames` 無關（抓別名）；kysely 之類誤報接受 | 🔒 | 規則檔頭；Codex P2 |
| 2026-09-17 | RuleTester parser | 規則測試一律用 TS parser | 🔒 | `tests/eslint-rules/_ruleTester.js` |
| 2026-09-17 | 不進套件 | `format`（日期／金額）、`check:sql`、`undoDelete` 等綁後端邏輯 | 🚫 | plan §3／§8 |

---

*此檔為 append-only 分類帳，越往下越舊；新結論加在對應月份區塊頂部。*
