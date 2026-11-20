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
| v0.2.0 的套件形狀（子路徑、不留根 `.`、不做 workspaces） | `aw-workflow/docs/plans/2026-09-17-aw-admin_starter.md` §0／§3／§4＋`DECISIONS.md` 2026-09-17 | 該 plan 檔 |

本機路徑：`~/Documents/GitHub/ucdi/mh1491`、`~/Documents/GitHub/ucdi/inknock`、`~/Documents/GitHub/aw-workflow`。
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
| `src/ui/`（2026-11-19 起，inknock ADR 0002） | inknock＋inflorify 共用 UI 元件；**TS 原始碼交付、不 build**，每個模組一個子路徑匯出 | 原始碼直出；型別 `tsconfig.ui.json`（兩消費端最嚴聯集）、`tests/ui/` |
| `src/ui/theme.ts`、`src/design-tokens/` | 代幣共用層（TS 常數＋`createThemeFactory`）與產生器（`BASE` 共用層＋專案 `DESIGN.md` 品牌層 → theme.css／名稱檔；純函式，讀寫檔由專案包裝腳本做） | 原始碼直出；`tests/design-tokens/` 驗 BASE↔theme.ts、品牌層負例 |
| `src/ui/primitives/`、`cn.ts`、`internal/`、helper（submit-enter 等） | shadcn class 來源（C 批）、名單由 `scripts/gen-ui-names.mjs` 自共用層產生；`vendor/shadcn-base/` 是三方合併基準版 | 原始碼直出；`tests/ui/`、`npm run lint:ui` |
| `src/ui/styles/globals.css`（2026-11-20 E2 批） | 元件依賴的全域 class（focus-ring、hit-area、hide-scrollbar、skeleton keyframes）；消費端 root 載入一次 | 原始碼直出（`aw-kit/ui/styles/globals.css`）；`tests/ui/globals-css.test.js` |
| `src/gates/`（2026-11-19 E1 批） | UI 閘門的判斷核心（class／style／controls／terms、檔案清單與 ratchet、is-main）：純函式，專案設定由呼叫端帶入；`scripts/check-gates.mjs` 用 aw-kit 自己的設定掃 `src/ui` | 原始碼直出（`aw-kit/gates/*`）；`tests/gates/`、`npm run check:gates`（`npm test` 內含） |
| `.github/workflows/ci.yml` | React 19 全套＋React 18 重跑 notify／panel／規則／bin | push／PR |

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
- **`src/ui` 不依賴任何路由套件**：要導頁或跟著路由的元件用 prop 讓消費端注入（`MenuRow` 的 `linkAs`、`HeaderDropdown` 的 `routeKey`）。直接 import react-router 會擋住用 v7 的消費端，且 `npm link` 時會載入第二份 router（inknock 2026-11-19 D3 review 實測標題列整個崩）。
- **測試檔用 `tests/ui/tsconfig.json`**（tests/ui 底下全部測試）：沿用 `tsconfig.ui.json` 全部嚴格旗標、只關 `noUncheckedIndexedAccess`（消費端只檢查 src/ui，不看測試）；`src/ui` 一律全嚴。渲染讀主題的元件用 `tests/ui/helpers/test-theme.tsx` 的 `renderWithTheme`；`tests/setup.js` 統一 cleanup（globals 關閉，Testing Library 不會自動清）。jsdom 跟 inknock 同版（29），舊版缺 PointerEvent。
- **`aw-kit/ui` 的檔案會被消費端的 tsc 直接檢查**（原始碼不是 .d.ts，`skipLibCheck` 管不到）：只用相對路徑 import、必須過 `tsconfig.ui.json`（inflorify 的嚴格旗標＋inknock 的 ES2020 lib，不可用 `.at()`／`Object.hasOwn`）。匯出表用逐條列舉而非 `./ui/*`（同資料夾有 .ts 與 .tsx），`tests/ui/exports.test.js` 驗一一對應。
- **開發依賴是 React 19，精確釘在兩個消費端裡較低的版本**（2026-11-19：inknock 19.2.4／@types 19.2.14，inflorify 19.3.0）——`aw-kit/ui` 以原始碼交付，用到較新版才有的 API 時，舊版那邊的 tsc／執行期會壞；消費端升級後這裡才跟著升。notify／panel 仍宣稱 ≥18，靠 CI 的 react18 job 守住，不要在 notify／panel 用 19 才有的 API。
- **代幣共用層有兩份表示（`src/design-tokens/index.js` 的 `BASE` 與 `src/ui/theme.ts`），改值兩邊一起改**，`tests/design-tokens/` 會擋不一致。`COLOR_ORDER` 決定 theme.css 的顏色順序，沿用 inknock 拆分前的順序，**不要重排**（inknock 的 theme.css 會整份變動）。專案 `DESIGN.md` 品牌層的名稱由 `BRAND_COLOR_NAMES` 定義，多一個或少一個都報錯——新增品牌色名稱＝所有消費端都要補值。
- **不要加「dist 與 src 同步」的逐字比對閘門**：重建後只有壓縮變數名不同（2026-11-19 實測）。
- **`src/ui/primitives` 的 class 字串改一個字，消費端的 CSS 就會變**：它們是 Tailwind 的掃描來源（消費端 `@source` 指到 `node_modules/aw-kit/src/ui`）。搬家／重構時以消費端「建置前後 CSS 逐字相同」證明零外觀變化；`vendor/shadcn-base` 是三方合併的基準版，提交後不手改。
- **`src/ui` 的 lint 在這裡跑（`npm run lint:ui`，`--max-warnings 0`）**：從 inknock 搬來後就不在 inknock 的 lint 範圍內，所以 inknock 會套到這些檔案的規則這裡全部補齊（清單見 `eslint.config.js` 檔頭，負例 `tests/ui/eslint-config.test.js`）。`no-restricted-syntax` 的 selector（IME Enter／Esc、原生 confirm／alert、toISOString 取日期、數字欄）只有一份：`src/eslint-rules/selectors.js`，inknock 的 eslint.config.js 也引用它，**不要再在任何一邊手抄 selector**。
- **主題 context 沒有預設值**：`useTheme()` 找不到 `ThemeProvider` 直接丟錯（inknock 使用者 2026-11-19 選定）。aw-kit 自己的元件測試要渲染讀主題的元件時，自己包一個用 `createThemeFactory(測試品牌)` 做的主題。
- **連結模式（`npm link aw-kit`）下消費端會看到兩份 `@types/react`**（aw-kit 自己的 devDependency）：消費端 tsconfig 以 `paths` 把 `react`／`react-dom` 型別指回自己的 node_modules（inknock 2026-11-19 做法；`preserveSymlinks` 無效，因為連結目標裡就有 node_modules）。

---

## 開發指令

```bash
npm install
npm test         # vitest run（notify jsdom／eslint-rules RuleTester／bin subprocess）
npm run build    # 只 build notify → dist/notify/{index.js,index.d.ts,style.css}
```

發版：改 `package.json` version＋`src/eslint-rules/index.js` 的 `meta.version`＋CHANGELOG → `npm run build`（notify／panel 原始碼有變才需要）→ commit → **AI 在本機打附註 tag `git tag -a vX.Y.Z -m …`，使用者 `git push --follow-tags`**（2026-11-19 起，inknock ADR 0002〈五〉；⚠️ 輕量 tag（`git tag vX.Y.Z`）不會被 `--follow-tags` 推上去，2026-11-20 E1 實際踩過——推完用 `git ls-remote --tags origin vX.Y.Z` 確認）→ AI 改消費端釘版。

---

## Remote

```
origin  https://github.com/WUCL/aw-kit.git   （舊 URL aw-notify-kit 會轉址）
```

---

## 目前狀態（更新：2026-11-20）

- 2026-11-20：E2 批（第 2 步收尾）——`aw-kit/ui/styles/globals.css`（元件依賴的全域 class，自 inknock 搬入、focus 退回值改品牌層變數）、`uiLibraryPatterns`／`bareCnPath`（ESLint）、`aw-kit/gates/pin`（釘版一致）、gates 型別宣告；**v0.11.0**
- 2026-11-19：E1 批——UI 閘門的判斷核心從 inknock 四支腳本搬進 `aw-kit/gates/*`（專案設定由呼叫端帶入、is-main 收成一份）；`npm run check:gates` 讓 aw-kit 自己的 CI 掃 src/ui（字級、設計規範、控制項高度；用詞表留消費端）；負例清單、固定範圍測試、陽性對照在 `tests/gates/`；inknock 閘門輸出前後逐字相同；**v0.10.0**
- 2026-11-19：`aw-kit/ui` D3 批——欄位／選單／對話框鏈 20 檔（input、number-input、select、form-field、tooltip、modal、combobox、header-dropdown 等）＋15 支元件測試（測試主題夾具、cleanup setup、jsdom 29、測試專用 tsconfig）；**元件層不依賴路由套件**（MenuRow 收 `linkAs`、HeaderDropdown 收 `routeKey`，由消費端注入）；**v0.9.0**
- 2026-11-19：`aw-kit/ui` D2 批——`theme-context`（無預設主題、沒包 Provider 就丟錯）＋讀主題的通用元件 19 檔（data-table、tabs、skeleton、panel-*、page-header 等）；inknock 建置 CSS 逐字相同；**v0.8.0**
- 2026-11-19：`aw-kit/ui` D1 批——葉子包裝層 14 檔（button、icon-button、card、checkbox、switch、chip、removable-chip、callout、empty-state、pressable 等，只依賴 aw-kit/ui）＋3 支測試；inknock 建置 CSS 逐字相同；**v0.7.0** 已發版（CI 綠），inknock 已改釘
- 2026-11-19：`aw-kit/ui` C 批——primitives 16 檔（拿掉從未渲染的 RAC 元件）、`cn`（名單由共用層產生）、submit-enter／interactive／menu-placement／breakpoints／sanitize-number、shadcn 基準版、`lint:ui`；inknock 建置 CSS 逐字相同；**v0.6.0** 已發版（CI 綠），inknock 已改釘
- 2026-11-19：`aw-kit/ui` B 批（代幣合約）——`aw-kit/ui/theme`（共用層常數＋`createThemeFactory`）、`aw-kit/design-tokens`（產生器：共用層 BASE＋專案品牌層驗證與合成）（不依賴 YAML 套件，解析函式由呼叫端傳入）；inknock 已改接（theme.css 逐位元組相同）；**v0.5.0**（A＋B 批）本機已打 tag，待使用者 push
- 2026-11-19：`aw-kit/ui` A 批（工具鏈）——開發依賴升 React 19（釘在兩消費端較低的 19.2.x）、`tsconfig.ui.json`、`tests/ui`（管線＋匯出表一致）、GitHub Actions CI（React 19 全套＋React 18 重跑）；尚未匯出任何元件、未發版
- 2026-11-15：v0.4.1——confirm 對話框 Esc 排除中文輸入法組字（inflorify 代驗 P2）、rpc-types 掃描排序；已 commit，待使用者 push＋打 tag `v0.4.1`，之後 inknock／inflorify／mh1491 改釘
- 2026-09-27：v0.2.2 修 confirm 連開時第二個被上一個的 150ms 收尾清掉（inknock 刪除供應商兩段確認）；已 commit，待使用者 push＋打 tag `v0.2.2`，inknock 再改釘。
- 2026-09-17：checkpoint v0.2.1（遞迴掃描修正＋Codex review 收尾），tag 已推；下游 aw-admin_starter 待改釘 `#v0.2.1`。

**待辦：** 見 `TODO.md`
