// @vitest-environment node
// aw-kit/ui 自掃（scripts/check-gates.mjs，inknock ADR 0002 E 批）：
//   ① 掃描範圍固定＝src/ui 底下全部 .ts／.tsx（不含測試）——少掃一塊照樣綠燈，所以用獨立的列舉方式比對（C 批補審停損項 ②）
//   ② 乾淨的 src/ui 真的有跑、而且綠（不是什麼都不做就 exit 0）
//   ③ 陽性對照：在一份 src/ui 複本裡放違規探針，CLI 要紅、每條規則都要出現
// 複本放在暫存目錄（不寫進真的 src/ui：exports.test.js 會同時檢查 src/ui 的每個檔都有匯出）。
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { describe, expect, it, vi } from 'vitest'
import { UI_DIR, targets, violations } from '../../scripts/check-gates.mjs'

vi.setConfig({ testTimeout: 30000 })
const ROOT = fileURLToPath(new URL('../..', import.meta.url))

const PROBE = `import { T } from './theme'
const v = { base: 'text-lg inline-block', b: '#123456' }
export function P() {
  return (<div>
    <button style={{ height: T.controlH.md }}>a</button>
    <label>x</label>
    <span style={{ padding: '2px 6px', borderRadius: 4, background: '#FFFFFF', fontSize: T.fontSize.caption }}>t</span>
    <div style={{ height: 40, boxShadow: '0 2px 4px #000', color: T.accent600, border: \`1px solid \${T.line}\` }} />
    <NumberInput style={{ border: \`1px solid \${T.state.danger.base}\` }} />
    <FormField label="a"><Input /></FormField>
    <label htmlFor="nope">y</label>
  </div>)
}
`
const EXPECTED_RULES = ['字級', 'palette', 'bareControl', 'labelFor', 'fieldLabelFor', 'labelTarget', 'softShadow', 'accentAsText', 'faintBorder', 'handTag', 'numberErrorBorder', 'staticTheme', 'controlHeight', 'hitArea']

describe('aw-kit/ui 自掃', () => {
  it('① 掃描範圍＝src/ui 底下全部 .ts／.tsx（不含 *.test.*），標籤 src/ui/…', () => {
    const expected = readdirSync(UI_DIR, { recursive: true })
      .map(p => String(p).split('\\').join('/'))
      .filter(p => /\.(ts|tsx)$/.test(p) && !/\.test\./.test(p))
      .map(p => `src/ui/${p}`).sort()
    expect(targets().map(([label]) => label).sort()).toEqual(expected)
    expect(expected).toContain('src/ui/primitives/button.tsx')
    expect(expected).toContain('src/ui/internal/token-names.generated.ts')
  })

  it('② 乾淨的 src/ui：CLI 真的有跑、0 違規', () => {
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts/check-gates.mjs')], { encoding: 'utf8' })
    expect(r.stderr).toBe('')
    expect(r.status).toBe(0)
    expect(r.stdout).toMatch(new RegExp(`✅ check:gates — aw-kit/ui ${targets().length} 檔`))
  })

  it('③ 陽性對照：探針的每條規則都抓得到（規則層）', () => {
    const dir = mkdtempSync(join(tmpdir(), 'aw-kit-gates-'))
    try {
      const f = join(dir, 'zz-probe.tsx')
      writeFileSync(f, PROBE)
      const out = violations([['src/ui/zz-probe.tsx', f]])
      for (const rule of EXPECTED_RULES) expect(out.some(l => l.includes(`[${rule}]`)), rule).toBe(true)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })

  it('③ 陽性對照：src/ui 複本裡放探針，CLI exit 1（不是只印訊息）', () => {
    const dir = mkdtempSync(join(tmpdir(), 'aw-kit-gates-'))
    try {
      for (const d of ['src/ui', 'src/gates', 'src/design-tokens']) cpSync(join(ROOT, d), join(dir, d), { recursive: true })
      mkdirSync(join(dir, 'scripts'))
      cpSync(join(ROOT, 'scripts/check-gates.mjs'), join(dir, 'scripts/check-gates.mjs'))
      symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'))
      writeFileSync(join(dir, 'package.json'), '{"type":"module"}')   // src/gates/*.js 是 ESM；不靠 Node 的語法自動偵測
      const clean = spawnSync(process.execPath, [join(dir, 'scripts/check-gates.mjs')], { encoding: 'utf8' })
      expect(clean.status, clean.stderr).toBe(0)
      writeFileSync(join(dir, 'src/ui/zz-probe.tsx'), PROBE)
      const r = spawnSync(process.execPath, [join(dir, 'scripts/check-gates.mjs')], { encoding: 'utf8' })
      expect(r.status).toBe(1)
      expect(r.stderr).toContain('src/ui/zz-probe.tsx')
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
})
