// CLI 走 subprocess＋隔離 fixture：負例（故意手寫的 RPC 回傳型別）放在 fixtures 裡，透過
// 參數化的 --root 掃描，不會進到任何正常的 CI 掃描路徑。每個 fixture 目錄就是一個案例。
import { describe, it, expect, afterEach } from 'vitest'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync, writeFileSync, mkdtempSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const BIN = join(here, '..', '..', 'bin', 'aw-check-rpc-types.mjs')
const FX = join(here, 'fixtures', 'rpc-types')
const NOWHERE = join(FX, 'no-such-baseline.json')

function run(args, cwd = here) {
  const r = spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' })
  return { code: r.status, out: r.stdout + r.stderr }
}

describe('aw-check-rpc-types', () => {
  it('乾淨（衍生自 generated Database）→ exit 0 ✅', () => {
    const r = run(['--root', join(FX, 'clean'), '--baseline', NOWHERE])
    expect(r.code).toBe(0)
    expect(r.out).toContain('✅')
  })

  it('手寫 export interface 被當 RPC 回傳 → exit 1，列出 file:line name', () => {
    const r = run(['--root', join(FX, 'violation'), '--baseline', NOWHERE])
    expect(r.code).toBe(1)
    expect(r.out).toContain('❌')
    expect(r.out).toContain('orders.ts:1')
    expect(r.out).toContain('OrderRow')
  })

  it('export type X = {…} 同樣抓（只認 interface 會被繞過）', () => {
    const r = run(['--root', join(FX, 'type-alias'), '--baseline', NOWHERE])
    expect(r.code).toBe(1)
    expect(r.out).toContain('OrderRow')
  })

  it('// rpc-type-ok: 白名單放行', () => {
    expect(run(['--root', join(FX, 'whitelisted'), '--baseline', NOWHERE]).code).toBe(0)
  })

  it('手寫型別只當參數、且不因前綴誤中 OrderRowView → 放行', () => {
    expect(run(['--root', join(FX, 'unrelated-type'), '--baseline', NOWHERE]).code).toBe(0)
  })

  it('命中但在基線內 → exit 0，印待清筆數', () => {
    const r = run(['--root', join(FX, 'baselined'), '--baseline', join(FX, 'baselined', 'baseline.json')])
    expect(r.code).toBe(0)
    expect(r.out).toMatch(/待清 1/)
  })

  it('基線內項目已清乾淨 → exit 1，要求收縮基線', () => {
    const r = run(['--root', join(FX, 'cleared'), '--baseline', join(FX, 'cleared', 'baseline.json')])
    expect(r.code).toBe(1)
    expect(r.out).toContain('--update-baseline')
    expect(r.out).toContain('orders.ts:OrderRow')
  })

  it('--update-baseline 把目前命中寫進基線（key 是相對 root 的路徑）', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'rpc-types-'))
    cpSync(join(FX, 'violation'), tmp, { recursive: true })
    const baseline = join(tmp, 'baseline.json')
    const r = run(['--root', tmp, '--baseline', baseline, '--update-baseline'])
    expect(r.code).toBe(0)
    expect(JSON.parse(readFileSync(baseline, 'utf8'))).toEqual(['orders.ts:OrderRow'])
    // 寫完再跑一次就是綠的
    expect(run(['--root', tmp, '--baseline', baseline]).code).toBe(0)
  })

  it('--root 不存在 → exit 2 並說明', () => {
    const r = run(['--root', join(FX, 'does-not-exist'), '--baseline', NOWHERE])
    expect(r.code).toBe(2)
    expect(r.out).toContain('does-not-exist')
  })
})
