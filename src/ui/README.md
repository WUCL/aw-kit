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
- lint 在這裡跑（`npm run lint:ui`，見根目錄 `eslint.config.js`），消費端的 lint 掃不到 node_modules。
- 不對外的模組放 `internal/`（不匯出）；測試放 `tests/ui/`。
