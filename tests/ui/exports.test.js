// @vitest-environment node
// aw-kit/ui 的匯出表必須與 src/ui 的檔案一一對應（inknock ADR 0002：以原始碼交付、每個元件一個子路徑）。
// 為什麼不用萬用字元 "./ui/*"：同一個資料夾有 .ts 與 .tsx，exports 的萬用字元只能對到一種副檔名。
// 為什麼要測：漏寫一條，消費端 import 時才會發現「找不到模組」；多寫一條（檔案已刪），一樣只在消費端爆。
// 不對外的模組放 src/ui/internal/（不需要、也不准有匯出）；測試一律放 tests/ui，不與元件同資料夾。
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CODE = /\.(tsx?|jsx?|mts|cts|mjs|cjs)$/
const INTERNAL = 'src/ui/internal/'
const DOC = 'src/ui/README.md'

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

/**
 * 回傳問題清單（空陣列＝一致）。規則刻意收窄（2026-11-19 補審兩輪都落在這支，改設計不再逐條補洞）：
 * - 目標只接受以 ./src/ui/ 開頭的字串（不收條件物件：原始碼交付不需要 types／import 分流，收了就要逐個條件驗）
 * - src/ui 底下除了 README.md 與 internal/，**任何檔案**（含 .css）都要有匯出；文件與 internal 不准匯出
 * - 子路徑名稱＝去掉 src/ 的路徑，程式檔再去掉副檔名（./ui/button → src/ui/button.tsx；./ui/button.css 保留）
 * files：相對 ROOT、以 / 分隔；exportsMap：package.json 的 exports；exists：檔案是否存在
 */
export function checkUiExports(files, exportsMap, exists) {
  const problems = []
  const targets = new Set()
  for (const [key, v] of Object.entries(exportsMap).filter(([k]) => k === './ui' || k.startsWith('./ui/'))) {
    if (typeof v !== 'string' || !v.startsWith('./src/ui/')) { problems.push(`${key}：目標必須是 ./src/ui/ 開頭的字串`); continue }
    const rel = v.slice(2)
    targets.add(rel)
    if (!exists(rel)) problems.push(`${key} → ${v}：檔案不存在`)
    if (rel.startsWith(INTERNAL) || rel === DOC || rel.endsWith('.md')) problems.push(`${key} → ${v}：文件與 internal 模組不可匯出`)
    const expected = './' + rel.replace(/^src\//, '').replace(CODE, '')
    if (key !== expected) problems.push(`${key} → ${v}：子路徑名稱應為 ${expected}`)
  }
  for (const f of files) {
    if (f === DOC || f.startsWith(INTERNAL)) continue
    if (!targets.has(f)) problems.push(`${f}：沒有對應的子路徑匯出`)
  }
  return problems
}

describe('aw-kit/ui 匯出表', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))

  it('實際的 package.json 與 src/ui 一致', () => {
    const files = walk(join(ROOT, 'src/ui')).map(f => relative(ROOT, f).split(sep).join('/'))
    expect(checkUiExports(files, pkg.exports, rel => existsSync(join(ROOT, rel)))).toEqual([])
  })

  it('src/ui 有隨套件發佈（files）', () => {
    expect(pkg.files).toContain('src/ui')
  })
})

// 負例：閘門真的會亮（目前 src/ui 幾乎是空的，上面那條只靠它會一直空轉變綠）
describe('checkUiExports 負例', () => {
  const has = set => rel => set.includes(rel)
  const ok = { './ui/button': './src/ui/button.tsx', './ui/theme': './src/ui/theme.ts' }
  const files = ['src/ui/button.tsx', 'src/ui/theme.ts', 'src/ui/README.md', 'src/ui/internal/focus.ts']

  it('一致時無問題（internal 模組與 README 不需匯出）', () => {
    expect(checkUiExports(files, ok, has(files))).toEqual([])
  })
  it('有檔案沒匯出 → 報（.jsx 也算）', () => {
    expect(checkUiExports([...files, 'src/ui/chip.jsx'], ok, has(files))).toEqual(['src/ui/chip.jsx：沒有對應的子路徑匯出'])
  })
  it('匯出指到不存在的檔案 → 報', () => {
    expect(checkUiExports(files, { ...ok, './ui/gone': './src/ui/gone.tsx' }, has(files))).toEqual(['./ui/gone → ./src/ui/gone.tsx：檔案不存在'])
  })
  it('子路徑名稱與檔名不符 → 報', () => {
    expect(checkUiExports(files, { './ui/btn': './src/ui/button.tsx', './ui/theme': './src/ui/theme.ts' }, has(files)))
      .toEqual(['./ui/btn → ./src/ui/button.tsx：子路徑名稱應為 ./ui/button'])
  })
  it('匯出 internal 模組 → 報', () => {
    expect(checkUiExports(files, { ...ok, './ui/internal/focus': './src/ui/internal/focus.ts' }, has(files)))
      .toEqual(['./ui/internal/focus → ./src/ui/internal/focus.ts：文件與 internal 模組不可匯出'])
  })
  it('非 ./src/ui/ 開頭的字串、條件物件 → 報（Node／Vite 會拒絕沒有 ./ 的目標）', () => {
    expect(checkUiExports(files, { './ui/button': 'src/ui/button.tsx', './ui/theme': './src/ui/theme.ts' }, has(files)))
      .toEqual(['./ui/button：目標必須是 ./src/ui/ 開頭的字串', 'src/ui/button.tsx：沒有對應的子路徑匯出'])
    expect(checkUiExports(files, { ...ok, './ui/x': { types: './src/ui/x.d.ts', default: './src/ui/x.tsx' } }, has(files)))
      .toEqual(['./ui/x：目標必須是 ./src/ui/ 開頭的字串'])
  })
  it('任何非文件檔案都要匯出（.css、.mjs 也算），.css 子路徑保留副檔名', () => {
    const more = [...files, 'src/ui/button.css', 'src/ui/tokens.mjs']
    expect(checkUiExports(more, ok, has(more))).toEqual(['src/ui/button.css：沒有對應的子路徑匯出', 'src/ui/tokens.mjs：沒有對應的子路徑匯出'])
    expect(checkUiExports(more, { ...ok, './ui/button.css': './src/ui/button.css', './ui/tokens': './src/ui/tokens.mjs' }, has(more))).toEqual([])
  })
  it('匯出文件 → 報', () => {
    expect(checkUiExports(files, { ...ok, './ui/README.md': './src/ui/README.md' }, has(files)))
      .toEqual(['./ui/README.md → ./src/ui/README.md：文件與 internal 模組不可匯出'])
  })
  it('裸 ./ui 桶 → 名稱不符', () => {
    expect(checkUiExports([...files, 'src/ui/index.ts'], { ...ok, './ui': './src/ui/index.ts' }, has([...files, 'src/ui/index.ts'])))
      .toEqual(['./ui → ./src/ui/index.ts：子路徑名稱應為 ./ui/index'])
  })
})
