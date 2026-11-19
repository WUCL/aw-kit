// aw-kit 的 lint（2026-11-19，inknock ADR 0002 C 批）——src/ui、tests/ui 為主，另含 scripts、src/eslint-rules；`npm run lint:ui`（`npm test` 內含）。
//
// 元件與 helper 從 inknock 搬來後，就不在 inknock `npm run lint` 的範圍（在 node_modules 裡）。原本在那邊擋的規則
// 這裡全部補上，不讓搬家默默少一道檢查（review 2026-11-19）：
//   - js／typescript-eslint recommended（含 no-irregular-whitespace：註解裡誤打全形空格，inknock 2026-09-09 連紅 4 次）
//   - react/jsx-no-comment-textnodes（JSX 裡沒包 {} 的註解會畫在畫面上，inknock 使用者實機抓到兩次）
//   - react-hooks recommended、static-components
//   - aw-kit/eslint-rules recommended（代幣、日期格式、Supabase 寫入）
//   - no-restricted-syntax：中文輸入法 Enter／Esc、原生 confirm／alert、toISOString 取日期、數字欄 inputMode／type=number
//     ——selector 與 inknock 同一份（src/eslint-rules/selectors.js），只有訊息不同
//   - 不准裸 import 'cn'（套件預設版不認得共用層字級）、@supabase/* 只准 import type（元件層不碰資料）
// inknock 寬限成 warn 的（set-state-in-effect、purity、refs、no-explicit-any…）這裡維持 error：src/ui 目前 0 違規，`--max-warnings 0`。
// 負例清單：tests/ui/eslint-config.test.js（讀本檔跑 lintText）。
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import awKit, { imeKeyRules, nativeDialogRules, utcDateRules, numberFieldRules } from './src/eslint-rules/index.js'

export const IME_MSG = 'Enter／Esc 請用 aw-kit/ui/submit-enter 的 isSubmitEnter()／isCancelEscape()——中文輸入法選字時的 Enter／Esc 不可觸發送出或關閉。'
const RESTRICTED_SYNTAX = [
  ...imeKeyRules(IME_MSG),
  ...nativeDialogRules({
    confirm: '元件層不用瀏覽器原生 window.confirm／alert：確認框用 aw-kit/notify 的 confirm()。',
    alert: '元件層不用瀏覽器原生 alert()：提示用 aw-kit/notify 的 toast。',
  }),
  ...utcDateRules('不要用 toISOString() 取日期或月份（那是 UTC，UTC+8 的 00:00–08:00 會落在前一天）。'),
  ...numberFieldRules({
    inputMode: '數字欄不要直接寫 inputMode——原生輸入框不會擋非數字；用共用的數字欄元件（sanitize-number 清洗）。',
    typeNumber: '不要用 type="number"（iPad 滾動會誤改數值、打得進 e／+／-）。',
  }),
]
// 元件層不依賴路由套件（2026-11-19 D3 review）：綁 v6 會擋住用 v7 的消費端、npm link 時還會載入第二份 router。
// 要導頁／跟著路由的用 prop 讓消費端注入（MenuRow linkAs、HeaderDropdown routeKey）。只套 src/ui（測試要用 MemoryRouter）
const NO_ROUTER = { group: ['react-router', 'react-router/*', 'react-router-dom', 'react-router-dom/*'], message: 'aw-kit/ui 不依賴路由套件：導頁連結用 linkAs、跟著路由的用 routeKey 之類的 prop，由消費端注入。' }
const RESTRICTED_IMPORTS = {
  paths: [{ name: 'cn', message: '請用 src/ui/cn 的 cn（認得共用層字級／間距）；套件根目錄的 cn 是預設版，會把 text-meta 當顏色吃掉。' }],
  patterns: [
    { group: ['@supabase/*', '**/node_modules/@supabase/*'], allowTypeImports: true, message: 'aw-kit/ui 是元件層，不碰資料：@supabase/* 只准 import type。' },
  ],
}

export default tseslint.config(
  {
    // 套件自己的 Node 腳本與 ESLint 規則（含從 inknock 搬來的 scripts/is-main.mjs）：至少要有 recommended＋全形空格檢查
    // （inknock 的 `npm run lint` 含 scripts/，搬過來不能變成一條規則都沒套；補審 2026-11-19）
    files: ['scripts/**/*.mjs', 'src/eslint-rules/**/*.js', 'tests/scripts/**/*.js', 'tests/eslint-rules/**/*.js', 'tests/setup.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.node } },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: { 'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true }] },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}', 'tests/ui/**/*.{ts,tsx,js}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/static-components': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-comment-textnodes': 'error',
      // 型別層交給 tsc（tsconfig.ui.json），同 inknock
      'no-undef': 'off',
      // 中文 UI 的全形空白在字串／樣板／JSX 文字是刻意排版，放行；程式碼與註解仍擋（同 inknock）
      'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true, skipJSXText: true }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      '@typescript-eslint/no-restricted-imports': ['error', RESTRICTED_IMPORTS],
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    plugins: awKit.configs.recommended.plugins,
    rules: {
      ...awKit.configs.recommended.rules,
      'no-restricted-syntax': ['error', ...RESTRICTED_SYNTAX],
      // flat config 同名 rule 後者整段取代前者：src/ui 這裡要把 cn／supabase 那組一起重列再加路由禁令
      '@typescript-eslint/no-restricted-imports': ['error', { ...RESTRICTED_IMPORTS, patterns: [...RESTRICTED_IMPORTS.patterns, NO_ROUTER] }],
    },
  },
)
