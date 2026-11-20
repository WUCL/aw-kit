// @vitest-environment node
// checkPin：釘在 tag、package.json／lock／實裝三者一致；每一種不一致都要報，npm link 只略過實裝那項並說明。
import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkPin, fetchTagCommit, readPinState } from '../../src/gates/pin.js'

const ok = { spec: 'github:WUCL/aw-kit#v0.10.0', lockSpec: 'github:WUCL/aw-kit#v0.10.0', lockVersion: '0.10.0', installedVersion: '0.10.0' }

describe('checkPin', () => {
  it('三者一致 → 無問題', () => { expect(checkPin(ok)).toEqual({ problems: [], notes: [] }) })
  it.each([
    ['釘在分支', { spec: 'github:WUCL/aw-kit#main' }, /沒有釘在 WUCL\/aw-kit 的 tag/],
    ['fork', { spec: 'github:someone/aw-kit#v0.10.0' }, /沒有釘在/],
    ['別的倉庫', { spec: 'github:WUCL/aw-kit-x#v0.10.0' }, /沒有釘在/],
    ['釘在 commit', { spec: 'github:WUCL/aw-kit#315ca4f' }, /沒有釘在/],
    ['沒有 #', { spec: 'github:WUCL/aw-kit' }, /沒有釘在/],
    ['semver 範圍', { spec: '^0.10.0' }, /沒有釘在/],
    ['沒裝', { spec: undefined }, /沒有釘在/],
    ['lock 沒跟著改', { lockSpec: 'github:WUCL/aw-kit#v0.9.0' }, /package-lock 記的 aw-kit/],
    ['tag 指到版號沒升的 commit', { lockVersion: '0.9.0' }, /與 tag v0\.10\.0 不同/],
    ['實裝版本不同（沒跑 npm ci）', { installedVersion: '0.9.0' }, /裝到的 aw-kit 是 "0\.9\.0"/],
    ['沒裝進 node_modules', { installedVersion: undefined }, /裝到的 aw-kit 是 undefined/],
  ])('%s → 報', (_, patch, re) => {
    const r = checkPin({ ...ok, ...patch })
    expect(r.problems.some(p => re.test(p)), JSON.stringify(r.problems)).toBe(true)
  })
  it('npm link：實裝版本不比對，回一則說明；其他項照查', () => {
    expect(checkPin({ ...ok, installedVersion: '0.11.0', linked: true })).toEqual({ problems: [], notes: [expect.stringMatching(/npm link/)] })
    expect(checkPin({ ...ok, lockVersion: '0.9.0', linked: true }).problems).toHaveLength(1)
  })
})

describe('checkPin：lock 的 commit＝tag 現在指到的 commit（2026-11-20 aw-kit 補審 TODO I）', () => {
  const A = 'a'.repeat(40), B = 'b'.repeat(40)
  it('相同 → 無問題；沒查（undefined）→ 不比對、也不說明', () => {
    expect(checkPin({ ...ok, lockCommit: A, tagCommit: A })).toEqual({ problems: [], notes: [] })
    expect(checkPin({ ...ok, lockCommit: A })).toEqual({ problems: [], notes: [] })
  })
  it('tag 被移動（版號一樣、commit 不同）→ 報', () => {
    const r = checkPin({ ...ok, lockCommit: A, tagCommit: B })
    expect(r.problems).toEqual([expect.stringMatching(/tag v0\.10\.0 現在指到 b{40}（tag 被移動過）/)])
  })
  it('lock 沒有 commit（resolved 讀不到）而 tag 查得到 → 報', () => {
    expect(checkPin({ ...ok, tagCommit: B }).problems).toHaveLength(1)
  })
  it('查詢失敗（null）：本機只回說明；strict（CI）算問題，不可略過仍報通過', () => {
    expect(checkPin({ ...ok, lockCommit: A, tagCommit: null })).toEqual({ problems: [], notes: [expect.stringMatching(/離線/)] })
    expect(checkPin({ ...ok, lockCommit: A, tagCommit: null, strict: true }).problems).toEqual([expect.stringMatching(/無法確認 tag 沒被移動/)])
  })
  it('遠端沒有這個 tag（被刪）→ 報（不論 strict）', () => {
    expect(checkPin({ ...ok, lockCommit: A, tagMissing: true }).problems).toEqual([expect.stringMatching(/遠端沒有 tag v0\.10\.0/)])
  })
})

describe('readPinState', () => {
  const make = (pkg, lock, installed, { link = false } = {}) => {
    const dir = mkdtempSync(join(tmpdir(), 'pin-'))
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg))
    writeFileSync(join(dir, 'package-lock.json'), JSON.stringify(lock))
    mkdirSync(join(dir, 'node_modules'))
    if (installed) {
      const real = join(dir, link ? 'linked-aw-kit' : 'node_modules/aw-kit')
      mkdirSync(real, { recursive: true })
      writeFileSync(join(real, 'package.json'), JSON.stringify({ version: installed }))
      if (link) symlinkSync(real, join(dir, 'node_modules/aw-kit'))
    }
    return dir
  }
  const spec = 'github:WUCL/aw-kit#v0.11.0'
  it('dependencies／devDependencies 都讀得到，lock 與實裝版本、symlink 都讀出來', () => {
    for (const field of ['dependencies', 'devDependencies']) {
      const dir = make({ [field]: { 'aw-kit': spec } }, { packages: { '': { [field]: { 'aw-kit': spec } }, 'node_modules/aw-kit': { version: '0.11.0' } } }, '0.11.0')
      try { expect(readPinState(dir)).toEqual({ spec, lockSpec: spec, lockVersion: '0.11.0', installedVersion: '0.11.0', linked: false }) }
      finally { rmSync(dir, { recursive: true, force: true }) }
    }
    const dir = make({ dependencies: { 'aw-kit': spec } }, { packages: {} }, '0.12.0', { link: true })
    try { expect(readPinState(dir)).toMatchObject({ lockSpec: undefined, lockVersion: undefined, installedVersion: '0.12.0', linked: true }) }
    finally { rmSync(dir, { recursive: true, force: true }) }
  })
  it('lockCommit 從 resolved 讀出；remote 關著時 tagCommit 不查', () => {
    const C = 'c'.repeat(40)
    const dir = make({ dependencies: { 'aw-kit': spec } }, { packages: { '': { dependencies: { 'aw-kit': spec } }, 'node_modules/aw-kit': { version: '0.11.0', resolved: `git+ssh://git@github.com/WUCL/aw-kit.git#${C}` } } }, '0.11.0')
    try {
      const st = readPinState(dir)
      expect(st.lockCommit).toBe(C)
      expect(st.tagCommit).toBeUndefined()
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
})

describe('fetchTagCommit（連 GitHub）', () => {
  it('v0.11.0 解開附註 tag 後是 2da1a28…；不存在的 tag 回 missing（與查詢失敗的 null 分開）', () => {
    const c = fetchTagCommit('0.11.0')
    if (c === null) return // 離線時跳過（CI 有網路）
    expect(c).toEqual({ commit: '2da1a285d568bf650252cea3a6e7769fb9f43e80' })
    expect(fetchTagCommit('99.99.99')).toEqual({ missing: true })
  }, 30_000)
  it('查詢失敗（倉庫不存在／連不上）回 null', () => {
    expect(fetchTagCommit('0.11.0', 'WUCL/__no_such_repo_aw_kit__', { attempts: 1 })).toBeNull()
  }, 30_000)
})
