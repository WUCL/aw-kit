// aw-kit/ui 消費端的 Vite 開發伺服器設定（2026-11-20，inknock TODO K）。
//
// 為什麼需要：aw-kit/ui 以 .ts／.tsx 原始碼裝在 node_modules。Vite 6 開發模式只替 node_modules 的 .ts 加 `?v=`
// （`OPTIMIZABLE_ENTRY_RE = /\.[cm]?[jt]s$/`），不替 .tsx 加；相對引入又繼承引入者的 `?v=` → 同一個
// theme-context.tsx 以「有／沒有 ?v」兩種網址載成兩份模組、兩個 React context，`npm run dev` 一進頁面就是
// 「找不到 ThemeProvider」。build 與 vitest 不經過依賴最佳化，所以 CI 全綠也抓不到；`npm link` 時路徑不在
// node_modules，也不會出現。
//
// 做法：aw-kit 不進依賴最佳化（exclude），並讓掃描器認得 .tsx（extensions），兩者缺一都會重現（inknock 實測）。
// 只影響開發伺服器，build 輸出不變。
//
// 用法（消費端 vite.config.ts）：
//   import { awKitOptimizeDeps } from 'aw-kit/vite'
//   optimizeDeps: awKitOptimizeDeps(),                       // 沒有自己的 optimizeDeps 時
//   optimizeDeps: awKitOptimizeDeps({ include: ['x'] }),     // 有的話傳進來合併（exclude／extensions 會串接、不覆蓋）
// 回歸測試照抄 inknock `tests/vite-dev-single-instance.test.ts`（起真的開發伺服器爬模組圖，每個 aw-kit 原始檔只准一種網址）。

/** @param {import('vite').DepOptimizationOptions} [own] 消費端自己的 optimizeDeps */
export function awKitOptimizeDeps(own = {}) {
  return {
    ...own,
    exclude: [...new Set([...(own.exclude ?? []), 'aw-kit'])],
    extensions: [...new Set([...(own.extensions ?? []), '.tsx'])],
  }
}
