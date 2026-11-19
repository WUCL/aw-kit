# aw-kit/ui

inknock 與 inflorify 共用的 UI 元件（inknock `docs/adr/0002-shared-ui-in-aw-kit.md`）。

- **以 TS 原始碼交付、不 build**：消費端的 Vite／Tailwind 編譯，`@source` 要掃到本目錄。
- 每個模組一個子路徑（`aw-kit/ui/button`），匯出表與檔案一一對應，由 `tests/ui/exports.test.js` 驗。
- 型別檢查用 `tsconfig.ui.json`（兩個消費端的最嚴聯集）——這裡的檔案會被消費端的 tsc 直接檢查。
- 只用相對路徑 import，不用任何消費端的別名（`@/…`）。
- **只支援 React 19**（ref 當一般 prop 傳）。套件的 `peerDependencies` 寫 `react >=18` 是為了 notify／panel，npm 無法依子路徑分開宣告，所以 React 18 專案 import `aw-kit/ui/*` 不會有安裝警告——不要在 React 18 專案用。
- 不依賴 react-aria-components。
- **要用 `aw-kit/ui` 的專案必須自己安裝 `class-variance-authority`、`cn`、`lucide-react`**（primitives 與 `cn` 在執行期就會用到）。
  它們在 `package.json` 是「選用的 peer」——只用 notify／panel 的專案不必裝，所以 npm 不會提醒；少裝一個要到 Vite 建置才會報
  `Failed to resolve import "cn/config"`（從 node_modules/aw-kit/src/ui 裡面）。
- 消費端的 Tailwind 要 `@source` 到 `node_modules/aw-kit/src/ui`（primitives 的 class 字串在這裡）；`npm link` 開發時，Vite 要
  `resolve.dedupe` 上面三個套件與 react、react-dom，tsc 要以 `paths` 把 react 型別指回消費端自己的那份（做法見 inknock `vite.config.ts`／`tsconfig.vite.json`）。
- **部分元件依賴消費端全域 CSS 的 class**（2026-11-19 D2 批時仍定義在 inknock `src/index.css`）：`focus-ring`（讀 `--focus-ring`，由 `ThemeProvider` 寫入）、`hit-area`（可點範圍補到 44）、`hide-scrollbar`。用到的有 filter-toggle、panel-kpis、rank-list、export-button、table-shell 等。
  新的消費端（inflorify）接入前要把這幾個 class 搬進 aw-kit（例如 `aw-kit/ui/style.css`），否則元件會靜默失去聚焦外圈與可點範圍、不報錯。
- **`--focus-ring` 全站只有一份**：只有最外層的 `ThemeProvider` 寫它、卸載時移除；巢狀 Provider 只提供 context、不改焦點環。前提是一個頁面只有一個 React 根節點（兩個互不巢狀的根同時存在時，先卸載的會清掉另一個的值）。
- **主題 context 沒有預設值**：`useTheme()` 找不到 `ThemeProvider` 直接丟錯；專案在根節點包一層，錯誤邊界的備援畫面若在 Provider 外面要自己再包。
- lint 在這裡跑（`npm run lint:ui`，見根目錄 `eslint.config.js`），消費端的 lint 掃不到 node_modules。
- 不對外的模組放 `internal/`（不匯出）；測試放 `tests/ui/`。
