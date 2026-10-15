import { describe, it, expect } from 'vitest'
import { panelReducer, makeEntry, atMaxDepth, MAX_DEPTH } from '../../src/panel/panel-stack.js'

const e = (t) => makeEntry(t, { id: t })

describe('panelReducer', () => {
  it('open 疊一層、back 退一層、closeAll 清空', () => {
    let s = []
    s = panelReducer(s, { type: 'open', entry: e('a') })
    s = panelReducer(s, { type: 'open', entry: e('b') })
    expect(s.map(x => x.type)).toEqual(['a', 'b'])
    s = panelReducer(s, { type: 'back' })
    expect(s.map(x => x.type)).toEqual(['a'])
    s = panelReducer(s, { type: 'open', entry: e('c') })
    expect(panelReducer(s, { type: 'closeAll' })).toEqual([])
  })
  it('空堆疊 back 仍是空（不拋錯）', () => {
    expect(panelReducer([], { type: 'back' })).toEqual([])
  })
  it('restore 原樣換成快照', () => {
    const snap = [e('x'), e('y')]
    expect(panelReducer([e('z')], { type: 'restore', stack: snap })).toBe(snap)
  })
  it('MAX_DEPTH：滿了 open 不再增加（回傳同一個陣列）', () => {
    let s = []
    for (let i = 0; i < MAX_DEPTH; i++) s = panelReducer(s, { type: 'open', entry: e(`p${i}`) })
    expect(s).toHaveLength(MAX_DEPTH)
    expect(atMaxDepth(s)).toBe(true)
    expect(panelReducer(s, { type: 'open', entry: e('over') })).toBe(s)
  })
  it('makeEntry 的 key 不重複', () => {
    const a = e('a'), b = e('a')
    expect(a.key).not.toBe(b.key)
  })
})
