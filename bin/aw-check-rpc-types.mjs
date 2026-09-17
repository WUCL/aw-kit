#!/usr/bin/env node
/**
 * aw-check-rpc-types — ported from inknock `scripts/check-rpc-types.mjs` (2026-09-16),
 * scan root and baseline path parameterised for aw-kit (2026-09-17).
 *
 * 閘門：呼叫 `.rpc(...)` 的 adapter 檔，回傳型別不可手抄成 `export interface`／`export type X = {`，
 * 一律要衍生自 generated `Database['public']['Functions']['<rpc>']['Returns']`
 * （陣列 RPC 用 `Returns[number]`）——單一真相，欄名／型別／nullability 不會漂移。
 *
 * 判定規則（零依賴、純字串／正則掃描，故意保守——寧可漏抓也不要誤殺無關的 interface）：
 *   同一檔案內同時出現
 *     ① `.rpc('<fn>'`（有呼叫 RPC）
 *     ② `export interface <Name> {` 或 `export type <Name> = {`（手寫型別；只認 interface 會被 type 繞過）
 *     ③ `as <Name>[]`／`as <Name>`／`as unknown as <Name>[]`／`Promise<<Name>[]>`／`Promise<<Name>>`
 *        （這個手寫型別被當成 RPC 回傳值使用；雙重轉型也算）
 *   → 判定 <Name> 是「手寫的 RPC 回傳型別」，違規。
 *
 * 白名單：型別宣告正上方（往上找最近的非空行）寫 `// rpc-type-ok: <理由>` 可豁免。
 *
 * Ratchet：`--baseline` 檔記錄「已知、待清」的 `<相對 root 路徑>:<Name>`；
 *   · 命中不在基線內 → 新增的手抄型別 → exit 1（CI 擋）
 *   · 基線內的項目已不再命中 → exit 1 要人收縮（`--update-baseline` 自動收縮）
 *   · 基線只能變短，不能變長——`--update-baseline` 在有新命中時**拒絕**寫入（exit 1）；
 *     要加新項目必須手改這個檔，diff 會被 review 看到。（inknock 原版會無條件重寫，等於
 *     一個旗標就能把新違規洗白；Codex 2026-09-17 review 指出與「只縮不長」契約矛盾。）
 *   · 第一次導入用 `--init-baseline` 把現況全部登記（只在基線檔不存在時允許）
 *
 * 用法：aw-check-rpc-types [--root <dir>] [--baseline <file>] [--update-baseline | --init-baseline]
 *   --root      掃描目錄（預設 src/infrastructure/supabase；只掃該層 *.ts，不遞迴）
 *   --baseline  基線檔（預設 scripts/check-rpc-types.baseline.json；不存在＝全部都是新的）
 * Exit：0 通過／1 有違規或基線需收縮／2 參數或路徑錯誤
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

function parseArgs(argv) {
  const opts = { root: 'src/infrastructure/supabase', baseline: 'scripts/check-rpc-types.baseline.json', update: false, init: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--root') opts.root = argv[++i]
    else if (a === '--baseline') opts.baseline = argv[++i]
    else if (a === '--update-baseline') opts.update = true
    else if (a === '--init-baseline') opts.init = true
    else { console.error(`未知參數：${a}`); process.exit(2) }
  }
  if (!opts.root || !opts.baseline) { console.error('--root／--baseline 需要值'); process.exit(2) }
  return opts
}

function listTsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.ts'))
    .map((e) => join(dir, e.name))
}

function findViolations(file, root) {
  const src = readFileSync(file, 'utf8')
  const lines = src.split('\n')
  const rel = relative(root, file).split('\\').join('/')

  // ① 這檔有沒有呼叫過 .rpc(
  if (!/\.rpc\(\s*['"]/.test(src)) return []

  // ② 所有手寫型別宣告與行號（白名單判斷用）
  const declRe = /^export (?:interface (\w+)\s*\{|type (\w+)\s*=\s*\{)/
  const decls = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(declRe)
    if (m) decls.push({ name: m[1] ?? m[2], line: i })
  }
  if (decls.length === 0) return []

  const violations = []
  for (const { name, line } of decls) {
    let whitelisted = false
    for (let j = line - 1; j >= 0 && j >= line - 6; j--) {
      const t = lines[j].trim()
      if (t === '') continue
      if (/^\/\/\s*rpc-type-ok:/.test(t) || / rpc-type-ok:/.test(t)) whitelisted = true
      break
    }
    if (whitelisted) continue

    // ③ 被當成 RPC 回傳值使用——\b 收尾避免 X 誤中 XView
    const usedAsReturn = new RegExp(`(as (?:unknown as )?${name}(?:\\[\\])?\\b)|(Promise<${name}(?:\\[\\])?>)`)
    if (usedAsReturn.test(src)) violations.push({ file: rel, name, line: line + 1 })
  }
  return violations
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  const root = resolve(opts.root)
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    console.error(`❌ --root 不是目錄：${opts.root}`)
    process.exit(2)
  }

  const allViolations = listTsFiles(root).flatMap((f) => findViolations(f, root))
  const key = (v) => `${v.file}:${v.name}`

  let baseline = []
  try { baseline = JSON.parse(readFileSync(opts.baseline, 'utf8')) } catch { /* 沒有基線＝全部都是新的 */ }
  const baselineSet = new Set(baseline)
  const fresh = allViolations.filter((v) => !baselineSet.has(key(v)))
  const cleared = baseline.filter((k) => !allViolations.some((v) => key(v) === k))

  const writeBaseline = () => {
    writeFileSync(opts.baseline, JSON.stringify(allViolations.map(key).sort(), null, 2) + '\n')
    console.log(`基線已寫入：${allViolations.length} 筆 → ${opts.baseline}`)
  }

  if (opts.init) {
    if (existsSync(opts.baseline)) {
      console.error(`❌ --init-baseline 只用於第一次導入；${opts.baseline} 已存在，請改用 --update-baseline（只縮不長）`)
      process.exit(2)
    }
    writeBaseline()
    process.exit(0)
  }

  if (opts.update) {
    if (fresh.length > 0) {
      console.error('❌ --update-baseline 只能收縮基線，不能把新命中洗進去。以下為新增的手抄型別，請先修掉：\n')
      for (const v of fresh) console.error(`  ${v.file}:${v.line}  ${v.name}`)
      console.error('\n（若確定要登記為既有債務，手動編輯基線檔讓 review 看到 diff。）')
      process.exit(1)
    }
    writeBaseline()
    process.exit(0)
  }

  if (fresh.length > 0) {
    console.error('❌ 新增了手寫的 RPC 回傳型別（不在基線內），未衍生自 generated：\n')
    for (const v of fresh) console.error(`  ${v.file}:${v.line}  ${v.name}`)
    console.error(
      '\n改法：\n' +
      "  export type <Name> = Database['public']['Functions']['<rpc>']['Returns'][number]\n" +
      "  （單一物件 RPC 用 ['Returns']，不要加 [number]）\n" +
      '  型別上的業務註解搬到 generated types 對應欄位旁，不要留在這裡重抄。\n' +
      '  若這個型別是刻意手刻（非 RPC 回傳型別），在宣告正上方加一行：\n' +
      '  // rpc-type-ok: <理由>\n',
    )
    process.exit(1)
  }
  if (cleared.length > 0) {
    console.error(`⚠️ 基線內有 ${cleared.length} 筆已清乾淨，請跑 aw-check-rpc-types --update-baseline 收縮基線：`)
    for (const k of cleared) console.error(`  ${k}`)
    process.exit(1)
  }
  console.log(`✅ check:rpc-types — 無新增手抄型別；基線待清 ${allViolations.length} 筆。`)
}

main()
