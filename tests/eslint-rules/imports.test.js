// src/eslint-rules/imports.js（uiLibraryPatterns、bareCnPath）的固定負例：以 typescript-eslint 的 no-restricted-imports 跑（消費端用的那條）。
import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import { uiLibraryPatterns, bareCnPath } from '../../src/eslint-rules/index.js'

RuleTester.describe = describe
RuleTester.it = it
const tester = new RuleTester({ languageOptions: { parser: tsParser } })
const rule = tseslint.plugin.rules['no-restricted-imports']
const MSG = '用包裝元件'
const options = [{ paths: [bareCnPath('用 aw-kit/ui/cn')], patterns: uiLibraryPatterns(MSG, { extraPrimitivePaths: ['@/src/shared/ui/primitives', '@/src/shared/ui/primitives/*'] }) }]
// 訊息前面會加上「'x' import is restricted…」，所以比對結尾
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const bad = (code, message = MSG) => ({ code, options, errors: [{ message: new RegExp(`${esc(message)}$`) }] })

tester.run('uiLibraryPatterns＋bareCnPath', rule, {
  valid: [
    { code: "import { Button } from 'aw-kit/ui/button'", options },
    { code: "import { cn } from 'aw-kit/ui/cn'", options },
    { code: "import { twMerge } from 'cn/config'", options },
    { code: "import { x } from 'react-aria-components-extra'", options },
    // 已知限制：動態 import() 不擋（歸 code review）
    { code: "const m = () => import('lucide-react')", options },
  ],
  invalid: [
    bad("import { buttonVariants } from 'aw-kit/ui/primitives/button'"),
    bad("export { buttonVariants } from 'aw-kit/ui/primitives/button'"),
    bad("export * from 'aw-kit/ui/primitives/button'"),
    bad("import x from 'aw-kit/ui/primitives'"),
    bad("import { buttonVariants } from './ui/primitives/button'"),
    bad("import { buttonVariants } from '../../node_modules/aw-kit/src/ui/primitives/button.tsx'"),
    bad("import { x } from '@/src/shared/ui/primitives/button'"),
    bad("import { Check } from 'lucide-react'"),
    bad("import { Button } from 'react-aria-components'"),
    bad("import { useButton } from 'react-aria'"),
    bad("import { useFocusRing } from '@react-aria/focus'"),
    bad("import x = require('lucide-react')"),
    bad("import { cn } from 'cn'", '用 aw-kit/ui/cn'),
  ],
})

describe('參數', () => {
  it('沒給訊息就丟錯', () => { expect(() => uiLibraryPatterns('')).toThrow(/需要訊息/) })
  it('bareCnPath 預設訊息', () => { expect(bareCnPath().name).toBe('cn') })
})
