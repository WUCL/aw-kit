// 守的是「閘門本身還活著」。一條靜默失效的 lint 規則比沒有規則更糟——CI 全綠會讓人以為
// 未驗證寫入已經不可能發生。valid 那組同時是規則三種通過形式的文件。
import { makeTester } from './_ruleTester.js'
import rule from '../../src/eslint-rules/verified-supabase-write.js'

const ruleTester = makeTester()

ruleTester.run('verified-supabase-write', rule, {
  valid: [
    // 形式 1：包在 verifyWrite 裡
    "verifyWrite(supabase.from('orders').update({ a: 1 }).eq('id', id), '結單')",
    "await verifyWrite(supabase.from('t').delete().eq('id', id), '刪除')",
    // 形式 2：鏈尾自己取回列
    "const { data } = await supabase.from('order_items').update({ note: n }).in('order_no', nos).select('order_no')",
    // 形式 3：先存成變數，之後才交給 verifyWrite
    `let q = supabase.from('orders').update({ customer_id: c })
     q = s ? q.eq('series_no', s) : q.eq('order_no', o)
     const { error } = await verifyWrite(q, '指定客戶')`,
    // insert 不在管轄範圍（沒有「靜默影響 0 列」這個形狀）
    "await supabase.from('orders').insert(rows)",
    // 非 supabase 的同名方法不得誤報
    "params.delete('q')",
    "const s = new Set(); s.delete(x)",
    "map.delete(key)",
    "delete obj.prop",
    "Array.from(rows).forEach(r => set.delete(r.id))",
    // ── TS wrappers（Codex 2026-09-17 以 TS parser 實測會誤報的形狀）──
    // `as`：鏈尾 select 之後再轉型
    "const rows = (await supabase.from('t').update({ a: 1 }).eq('id', id).select()) as Row[]",
    // `as` 夾在鏈中間，select 在轉型之後
    "await (supabase.from('t').update({ a: 1 }) as any).eq('id', id).select()",
    // `as unknown as` 雙重轉型
    "const r = (await supabase.from('t').delete().eq('id', id).select()) as unknown as Row[]",
    // `satisfies`
    "const r = (await supabase.from('t').update(v).eq('id', id).select()) satisfies Result",
    // non-null `!`
    "await supabase.from('t').update({ a: 1 }).eq('id', id).select()!",
    "await (supabase!.from('t').update({ a: 1 }) as any).eq('id', id).select()",
    // 轉型後再交給 verifyWrite
    "await verifyWrite(supabase.from('t').update({ a: 1 }).eq('id', id) as any, '更新')",
    "const q = supabase.from('t').update({ a: 1 }).eq('id', id) as any\nawait verifyWrite(q, '更新')",
    // ── optional chaining（Codex 2026-09-17 review P1）：ESTree 把 `a?.b()` 包成 ChainExpression，
    //    向上走到 verifyWrite 引數時必須穿透它 ──
    "await verifyWrite(supabase.from('orders')?.update({ status: 'done' }).eq('id', id), '更新')",
    "await supabase.from('t')?.update({ a: 1 }).eq('id', id).select()",
    "const q = supabase.from('t')?.update({ a: 1 })\nawait verifyWrite(q, 'x')",
    // ── options：改名 ──
    {
      code: "await ensureRows(db.from('t').update({ a: 1 }).eq('id', id))",
      options: [{ clientNames: ['db'], verifyFnName: 'ensureRows' }],
    },
    // 注意：clientNames 只影響「鏈根識別字」這條判定；鏈上出現 .from() 一律視為 supabase 鏈
    // （這是抓 `const db = supabase` 之類別名的手段），所以 `supabase.from('t').update()` 在
    // clientNames: ['db'] 下仍會報——見 invalid 最後一組。
  ],
  invalid: [
    {
      code: "const { error } = await supabase.from('customers').update({ tags }).eq('id', id)",
      errors: [{ messageId: 'unverified', data: { method: 'update', verifyFnName: 'verifyWrite' } }],
    },
    {
      code: "const { error } = await supabase.from('monthly_goals').delete().eq('year', y).eq('month', m)",
      errors: [{ messageId: 'unverified', data: { method: 'delete', verifyFnName: 'verifyWrite' } }],
    },
    {
      // 存成變數但從未交給 verifyWrite → 仍要擋
      code: `const q = supabase.from('orders').update({ a: 1 }).eq('id', id)
             const { error } = await q`,
      errors: [{ messageId: 'unverified' }],
    },
    {
      code: "const db = supabase\nawait db.from('orders').update({ a: 1 }).eq('id', id)",
      errors: [{ messageId: 'unverified' }],
    },
    {
      code: "const q = supabase.from('orders')\nawait q.delete().eq('id', id)",
      errors: [{ messageId: 'unverified' }],
    },
    {
      // .select() 出現在別條鏈上不算數
      code: `await supabase.from('t').select('id')
             await supabase.from('t').update({ a: 1 }).eq('id', id)`,
      errors: [{ messageId: 'unverified' }],
    },
    // ── TS wrappers 不能變成逃生門：轉型了但仍沒取回列 ──
    {
      code: "const r = (await supabase.from('t').update({ a: 1 }).eq('id', id)) as any",
      errors: [{ messageId: 'unverified' }],
    },
    {
      code: "await (supabase.from('t').update({ a: 1 }) as any).eq('id', id)",
      errors: [{ messageId: 'unverified' }],
    },
    {
      code: "const r = (await supabase.from('t').delete().eq('id', id)) as unknown as Row[]",
      errors: [{ messageId: 'unverified' }],
    },
    {
      code: "const r = (await supabase.from('t').update(v).eq('id', id)) satisfies Result",
      errors: [{ messageId: 'unverified' }],
    },
    {
      code: "await supabase!.from('t').update({ a: 1 }).eq('id', id)!",
      errors: [{ messageId: 'unverified' }],
    },
    {
      // optional chaining 不是逃生門
      code: "await supabase.from('t')?.update({ a: 1 }).eq('id', id)",
      errors: [{ messageId: 'unverified' }],
    },
    {
      // 改了 verifyFnName 之後，舊名字不再算通過
      code: "await verifyWrite(supabase.from('t').update({ a: 1 }).eq('id', id), 'x')",
      options: [{ verifyFnName: 'ensureRows' }],
      errors: [{ messageId: 'unverified' }],
    },
    {
      code: "await db.from('t').update({ a: 1 }).eq('id', id)",
      options: [{ clientNames: ['db'] }],
      errors: [{ messageId: 'unverified' }],
    },
    {
      code: "await supabase.from('t').update({ a: 1 }).eq('id', id)",
      options: [{ clientNames: ['db'] }],
      errors: [{ messageId: 'unverified' }],
    },
    {
      // 鏈根是 client 名但沒有 .from（如 client 直接暴露 table builder）也要抓
      code: "await db.update({ a: 1 }).eq('id', id)",
      options: [{ clientNames: ['db'] }],
      errors: [{ messageId: 'unverified' }],
    },
  ],
})
