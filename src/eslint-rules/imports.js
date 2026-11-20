// no-restricted-imports 用的 pattern 組（2026-11-20，inknock ADR 0002 E2 批）：「UI 底層只准元件層用」。
// 原本寫在 inknock eslint.config.js（UI_LIBRARY_PATTERNS）；inflorify 接上 aw-kit/ui 後要同一套，所以搬到這裡。
// 訊息由呼叫端決定（指向各自的包裝元件目錄）；消費端自己的舊路徑（例：inknock 的 '@/src/shared/ui/primitives'）用 extraPrimitivePaths 加。
// 要套在「頁面」那個 block，元件層（消費端自己的包裝層目錄）不套。
//
//   import { uiLibraryPatterns, bareCnPath } from 'aw-kit/eslint-rules'
//   '@typescript-eslint/no-restricted-imports': ['error', { paths: [bareCnPath('…')], patterns: [...uiLibraryPatterns('…')] }]
//
// 邊界：import／export … from／import x = require() 都擋；CommonJS require() 由 no-require-imports 擋；動態 import() 不擋，歸 code review。
// 負例清單：tests/eslint-rules/imports.test.js（本套件）、inknock tests/check-ui-gate.test.ts（讀 inknock 真實設定）。

// aw-kit/ui 的 primitives（shadcn class 來源）。後兩條（任意前綴＋ui/primitives）涵蓋相對路徑（'./ui/primitives/…'、'../node_modules/aw-kit/src/ui/primitives/…'）
export const PRIMITIVE_GROUP = ['aw-kit/ui/primitives', 'aw-kit/ui/primitives/*', '**/ui/primitives', '**/ui/primitives/*']
/** 元件層的第三方底層：圖示與無障礙底層只經包裝元件用 */
export const VENDOR_GROUP = ['react-aria-components', 'react-aria-components/*', 'react-aria', 'react-aria/*', '@react-aria/*', 'lucide-react', 'lucide-react/*']

/**
 * @param {string} message
 * @param {{ extraPrimitivePaths?: string[] }} [options] 消費端自己要一起擋的 primitives 路徑
 */
export function uiLibraryPatterns(message, { extraPrimitivePaths = [] } = {}) {
  if (!message) throw new Error('aw-kit/eslint-rules uiLibraryPatterns：需要訊息（指向消費端的包裝元件）')
  return [
    { group: [...PRIMITIVE_GROUP, ...extraPrimitivePaths], message },
    { group: [...VENDOR_GROUP], message },
  ]
}

/** 裸 `cn`（套件預設版，不認得共用層的 text-meta／p-card／shadow-knob，字級會被當顏色靜默吃掉）：一律用 aw-kit/ui/cn。`cn/config` 等子路徑不受影響（paths 是精確比對） */
export function bareCnPath(message = '請用 aw-kit/ui/cn 的 cn（認得共用層字級／間距）；套件根目錄的 cn 是預設版，會把 text-meta 當顏色吃掉。') {
  return { name: 'cn', message }
}
