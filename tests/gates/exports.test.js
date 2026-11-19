// @vitest-environment node
// aw-kit/gates 的匯出表與 src/gates 的檔案一對一（多一個檔忘了匯出、或刪了檔留著匯出，都要在這裡紅，不等消費端 import 才發現）。
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))

describe('aw-kit/gates 匯出表', () => {
  it('src/gates 的每個 .js 都有 ./gates/<名稱> 匯出，且匯出不指向不存在的檔', () => {
    const files = readdirSync(new URL('../../src/gates', import.meta.url)).filter(f => f.endsWith('.js')).sort()
    const exported = Object.entries(pkg.exports).filter(([k]) => k.startsWith('./gates/'))
    expect(exported.map(([k]) => k.slice('./gates/'.length) + '.js').sort()).toEqual(files)
    for (const [k, v] of exported) expect(v, k).toBe(`./src/gates/${k.slice('./gates/'.length)}.js`)
    expect(pkg.files).toContain('src/gates')
  })
})
