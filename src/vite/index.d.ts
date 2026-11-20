import type { DepOptimizationOptions } from 'vite'
/** aw-kit/ui 消費端的 optimizeDeps（開發伺服器不把 aw-kit 原始檔載成兩份）；有自己的設定時傳進來合併 */
export function awKitOptimizeDeps(own?: DepOptimizationOptions): DepOptimizationOptions
