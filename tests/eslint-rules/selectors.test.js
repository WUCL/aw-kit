// src/eslint-rules/selectors.js 四組 no-restricted-syntax selector 的固定負例（RuleTester，TS parser）。
// inknock 與 aw-kit/ui 的 lint 都用這一份；改壞任何一個分支這裡要紅（不必等消費端改釘新版才發現）。
import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import { describe, it } from 'vitest'
import { imeKeyRules, nativeDialogRules, utcDateRules, numberFieldRules } from '../../src/eslint-rules/index.js'

RuleTester.describe = describe
RuleTester.it = it
const tester = new RuleTester({ languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } } })
const rule = (await import('eslint/use-at-your-own-risk')).builtinRules.get('no-restricted-syntax')
const err = message => [{ message }]

tester.run('imeKeyRules', rule, {
  valid: [
    "e.key === 'ArrowDown'",
    "switch (e.key) { case 'ArrowUp': break }",
    "['ArrowUp', 'ArrowDown'].includes(e.key)",
    "o[key] === 'Escape'",
    // 已知限制（歸 code review）：鎖住「擋不到」，有人擴大時要回來改文件
    "const { key } = e; key === 'Enter'",
    "handlers[e.key]?.()",
    "const K = ['Enter']; K.includes(e.key)",
    "new Set(['Enter']).has(e.key)",
    'e.key === `Enter`',
  ].map(code => ({ code, options: imeKeyRules('IME') })),
  invalid: [
    "e.key === 'Enter'", "e.key !== 'Escape'", "e.key == 'Enter'", "e.key != 'Escape'",
    "'Enter' === e.key", "e['key'] === 'Escape'", "e.code === 'Enter'", "e['code'] === 'Enter'",
    "e?.key === 'Enter'", "'Escape' === e?.key",
    "switch (e.key) { case 'Enter': break }", "switch (e?.key) { case 'Escape': break }",
    "['Enter', 'Tab'].includes(e.key)", "['Escape'].includes(e['code'])",
  ].map(code => ({ code, options: imeKeyRules('IME'), errors: err('IME') })),
})

tester.run('nativeDialogRules', rule, {
  valid: ["confirm('x')", "notify.alert('x')", "myWindow.confirm('x')"].map(code => ({ code, options: nativeDialogRules({ confirm: 'C', alert: 'A' }) })),
  invalid: [
    ["window.confirm('x')", 'C'], ["globalThis.confirm('x')", 'C'], ["window.alert('x')", 'C'], ["globalThis.alert('x')", 'C'], ["alert('x')", 'A'],
  ].map(([code, m]) => ({ code, options: nativeDialogRules({ confirm: 'C', alert: 'A' }), errors: err(m) })),
})

tester.run('utcDateRules', rule, {
  valid: [
    'd.toISOString()', "d.toISOString().split('.')[0]", 'd.toISOString().slice(0, 19)', 's.slice(0, 10)',
  ].map(code => ({ code, options: utcDateRules('UTC') })),
  invalid: [
    'd.toISOString().slice(0, 10)', 'd.toISOString().slice(0, 7)', 'd.toJSON().slice(0, 10)',
    'd.toISOString().substring(0, 10)', 'd.toISOString().substr(0, 7)', "d.toISOString()['slice'](0, 10)",
    "d['toISOString']().slice(0, 10)", "d.toISOString().split('T')", "d.toJSON()['split']('T')",
  ].map(code => ({ code, options: utcDateRules('UTC'), errors: err('UTC') })),
})

tester.run('numberFieldRules', rule, {
  valid: ['<input inputMode="text" />', '<input type="text" />', '<Foo type="number" />'].map(code => ({ code, options: numberFieldRules({ inputMode: 'I', typeNumber: 'T' }) })),
  invalid: [['<input inputMode="numeric" />', 'I'], ['<input inputMode="decimal" />', 'I'], ['<input type="number" />', 'T'], ['<Foo inputMode="numeric" />', 'I']]
    .map(([code, m]) => ({ code, options: numberFieldRules({ inputMode: 'I', typeNumber: 'T' }), errors: err(m) })),
})
