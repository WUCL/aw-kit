// @vitest-environment node
// scripts/is-main.mjs：腳本入口判斷（判斷錯＝腳本什麼都不做就 exit 0，閘門靜默變綠）。照搬 inknock tests/check-ui-gate.test.ts 同名區塊。
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { isMain } from '../../scripts/is-main.mjs'

const real = realpathSync(fileURLToPath(new URL('../../scripts/is-main.mjs', import.meta.url)))
const meta = { url: pathToFileURL(real).href }
const withArgv = (p, fn) => {
  const old = process.argv[1]
  process.argv[1] = p
  try { fn() } finally { process.argv[1] = old }
}

describe('scripts/is-main.mjs', () => {
  it('經 symlink 執行仍成立（Node 對主模組的 import.meta.url 已解開 symlink）', () => {
    const dir = mkdtempSync(join(tmpdir(), 'is-main-'))
    try {
      const link = join(dir, 'link.mjs')
      symlinkSync(real, link)
      withArgv(link, () => expect(isMain(meta)).toBe(true))
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
  it('路徑含空白與中文仍成立', () => {
    const dir = mkdtempSync(join(tmpdir(), 'is-main-'))
    try {
      const sub = join(dir, '專案 x')
      mkdirSync(sub)
      const f = join(sub, 'g.mjs')
      writeFileSync(f, '')
      withArgv(f, () => expect(isMain({ url: pathToFileURL(realpathSync(f)).href })).toBe(true))
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
  it('realpath 失敗時退回原路徑比對，不直接判「不是主程式」', () => {
    const p = join(tmpdir(), 'is-main-nonexistent', 'x.mjs')
    withArgv(p, () => expect(isMain({ url: pathToFileURL(p).href })).toBe(true))
  })
  it('被 import（不是主程式）時不成立', () => {
    withArgv(fileURLToPath(new URL('../../scripts/gen-ui-names.mjs', import.meta.url)), () => expect(isMain(meta)).toBe(false))
  })
  it('gen-ui-names --check 真的有跑（同步時印 ✅；不是什麼都不做就 exit 0）', () => {
    const r = spawnSync(process.execPath, [fileURLToPath(new URL('../../scripts/gen-ui-names.mjs', import.meta.url)), '--check'], { encoding: 'utf8' })
    expect(r.status).toBe(0)
    expect(r.stdout).toContain('✅')
  })
})
