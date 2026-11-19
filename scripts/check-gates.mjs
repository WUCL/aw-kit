#!/usr/bin/env node
// aw-kit/ui 自掃（2026-11-19，inknock ADR 0002 E 批）：元件層的閘門在 aw-kit 自己的 CI 跑。
// 原本只在消費端（inknock）跑——違規要等改釘後才紅，inflorify 接入後則完全沒人掃（C 批補審停損項 ①）。
// 與消費端掃 aw-kit/ui 的是同一份規則（src/gates），名單與擁有者取 aw-kit 自己的：
//   1. 字級／撞名（class-gate checkAllStrings＋checkSharedUiToken，名單＝共用層 tokenNames(BASE)）
//   2. 設計規範（style-gate；src/ui 全部算元件層；色票＝src/ui/theme.ts）
//   3. 控制項高度寫死、自繪按鈕缺 hit-area（controls-gate）
// 用詞（check:terms）不在這裡：用詞表是產品的，由各消費端掃。沒有基線（src/ui 目前 0 違規，直接擋）。
// 用法：npm run check:gates（CI 經 `npm test` 的 tests/gates/self-scan.test.js 實際執行這支 CLI）；`--list` 只列出掃到的檔案（範圍由 tests/gates/self-scan.test.js 經 targets() 鎖住）。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BASE, tokenNames } from '../src/design-tokens/index.js'
import { isMain } from '../src/gates/is-main.js'
import { uiFiles } from '../src/gates/sources.js'
import { checkAllStrings, checkSharedUiToken } from '../src/gates/class-gate.js'
import { createStyleRules, readPalette, scan as scanStyle, uiOwners } from '../src/gates/style-gate.js'
import { scan as scanHeight, scanHit } from '../src/gates/controls-gate.js'

export const UI_DIR = fileURLToPath(new URL('../src/ui', import.meta.url))
const PREFIX = 'src/ui/'

/** 掃描範圍：[標籤, 實際路徑] */
export const targets = () => uiFiles(UI_DIR, PREFIX)

/** 全部違規（字串陣列，一筆一行）；files 預設＝targets() */
export function violations(files = targets()) {
  const names = tokenNames(BASE)
  const sharedCheck = token => checkSharedUiToken(token, names.text, names.spacing)
  const rules = createStyleRules({
    palette: readPalette([readFileSync(`${UI_DIR}/theme.ts`, 'utf8')]),
    ...uiOwners(PREFIX),
    isComponentLayer: () => true,
  })
  const out = []
  for (const [label, path] of files) {
    const text = readFileSync(path, 'utf8')
    for (const v of checkAllStrings(text, label, sharedCheck)) out.push(`${label}:${v.line}  [字級] ${v.token}  ${v.reason}`)
    for (const h of scanStyle(label, text, rules)) out.push(`${label}:${h.line}  [${h.rule}] ${h.text}`)
    for (const h of scanHeight(label, text)) out.push(`${label}:${h.line}  [controlHeight] height: ${h.v}（請改用 T.controlH；非控制項寫 audit-ok: controlHeight — 理由）`)
    for (const h of scanHit(label, text)) out.push(`${label}:${h.line}  [hitArea] <${h.tag}> 高度引用 T.controlH 卻沒有 className="hit-area"`)
  }
  return out
}

if (isMain(import.meta)) {
  const files = targets()
  if (process.argv.includes('--list')) { console.log(files.map(([label]) => label).join('\n')); process.exit(0) }
  const out = violations(files)
  if (out.length) { console.error(`❌ check:gates — aw-kit/ui ${out.length} 處違規：\n${out.join('\n')}`); process.exit(1) }
  console.log(`✅ check:gates — aw-kit/ui ${files.length} 檔：字級、設計規範、控制項高度 0 違規`)
}
