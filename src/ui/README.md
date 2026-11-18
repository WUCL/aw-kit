# aw-kit/ui

inknock 與 inflorify 共用的 UI 元件（inknock `docs/adr/0002-shared-ui-in-aw-kit.md`）。

- **以 TS 原始碼交付、不 build**：消費端的 Vite／Tailwind 編譯，`@source` 要掃到本目錄。
- 每個模組一個子路徑（`aw-kit/ui/button`），匯出表與檔案一一對應，由 `tests/ui/exports.test.js` 驗。
- 型別檢查用 `tsconfig.ui.json`（兩個消費端的最嚴聯集）——這裡的檔案會被消費端的 tsc 直接檢查。
- 只用相對路徑 import，不用任何消費端的別名（`@/…`）。
- **只支援 React 19**（ref 當一般 prop 傳）。套件的 `peerDependencies` 寫 `react >=18` 是為了 notify／panel，npm 無法依子路徑分開宣告，所以 React 18 專案 import `aw-kit/ui/*` 不會有安裝警告——不要在 React 18 專案用。
- 不依賴 react-aria-components。
- 不對外的模組放 `internal/`（不匯出）；測試放 `tests/ui/`。
