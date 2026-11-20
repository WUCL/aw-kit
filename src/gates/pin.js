// aw-kit 釘版一致性（2026-11-20，inknock ADR 0002 E2 批）：消費端一律釘在 tag（`github:WUCL/aw-kit#vX.Y.Z`），
// 且 package.json、package-lock、實際裝到的版本三者相同。釘在分支或 commit、改了 package.json 沒重跑 npm install、
// 或 tag 指到版號沒升的 commit，都會讓「裝到哪一版」說不清楚——這些情況不報錯、只是靜默裝錯。
// checkPin 是純函式；readPinState(root) 讀消費端的 package.json／package-lock（lockfileVersion 2／3 的 packages）／node_modules。
// npm link（開發時）實際裝的是本機工作區，版號可能已經往前，所以 linked 時只略過第 4 項並回一則說明（不算通過也不算失敗）。

import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const escape = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

/**
 * @param {{ spec?: string, lockSpec?: string, lockVersion?: string, installedVersion?: string, linked?: boolean, repo?: string, lockCommit?: string, tagCommit?: string | null, tagMissing?: boolean, strict?: boolean }} pin
 *   spec：package.json dependencies 的值；lockSpec：lock 根套件記的 spec；lockVersion：lock 裡 node_modules/aw-kit 的 version；
 *   installedVersion：node_modules/aw-kit/package.json 的 version；linked：node_modules/aw-kit 是不是 symlink（npm link）；
 *   repo：應釘的 GitHub 倉庫（預設 WUCL/aw-kit；fork 或打錯 owner 都算沒釘對）；
 *   lockCommit：lock 的 resolved 裡記的 commit；tagCommit：遠端 tag 現在指到的 commit——undefined＝沒查（不比對）、
 *   null＝查詢失敗（離線、限流、沒裝 git）；tagMissing：遠端沒有這個 tag（被刪了）→ 報。
 *   （「不存在」用獨立欄位，不塞進 tagCommit 當字串哨兵：`string | 'missing'` 在型別上分不開，漏判會把 'missing' 當 commit 比）
 *   lockCommit 與 tagCommit 不同＝有人刪 tag 重打到別的 commit：
 *   版號一樣、npm ci 照 lock 裝回舊 commit，其他三項全過（2026-11-20 aw-kit 補審）。
 *   strict：查詢失敗也算問題（CI 用；本機離線只回說明）——缺資料時不可略過仍報通過（2026-11-20 review）
 * @returns {{ problems: string[], notes: string[] }}
 */
export function checkPin({ spec, lockSpec, lockVersion, installedVersion, linked = false, repo = 'WUCL/aw-kit', lockCommit, tagCommit, tagMissing = false, strict = false }) {
  const problems = []
  const notes = []
  const m = typeof spec === 'string' ? spec.match(new RegExp(`^github:${escape(repo)}#v(\\d+\\.\\d+\\.\\d+)$`)) : null
  if (!m) {
    problems.push(`aw-kit 沒有釘在 ${repo} 的 tag：package.json 寫的是 ${JSON.stringify(spec)}，應為 github:${repo}#vX.Y.Z`)
    return { problems, notes }
  }
  const tag = m[1]
  if (lockSpec !== spec) problems.push(`package-lock 記的 aw-kit 是 ${JSON.stringify(lockSpec)}，與 package.json 的 ${spec} 不同：重跑 npm install "aw-kit@${spec}"`)
  if (lockVersion !== tag) problems.push(`package-lock 裡 aw-kit 的版本是 ${JSON.stringify(lockVersion)}，與 tag v${tag} 不同（tag 指到的 commit 版號沒升，或 lock 沒更新）`)
  if (linked) notes.push(`node_modules/aw-kit 是 npm link（本機工作區 ${installedVersion ?? '?'}），略過「實裝版本＝v${tag}」這一項；CI 用 npm ci 會檢查` +
    (installedVersion !== tag ? `。⚠️ 工作區版本與釘的 v${tag} 不同：用到新匯出的改動要等 aw-kit 發版、改釘後才可 push，否則 CI 裝回 v${tag} 會整片紅` : ''))
  else if (installedVersion !== tag) problems.push(`node_modules 裝到的 aw-kit 是 ${JSON.stringify(installedVersion)}，與釘的 v${tag} 不同：跑 npm ci`)
  if (tagMissing) problems.push(`遠端沒有 tag v${tag}（被刪了？）：package.json 釘的版本已不存在，新環境 npm install 會失敗`)
  else if (tagCommit === null) {
    if (strict) problems.push(`查不到遠端 tag v${tag} 指到的 commit（連線失敗、限流或沒有 git）：無法確認 tag 沒被移動，重跑一次`)
    else notes.push(`查不到遠端 tag v${tag} 指到的 commit（離線？），略過「lock 的 commit＝tag 的 commit」這一項；CI 會檢查`)
  } else if (tagCommit !== undefined && lockCommit !== tagCommit) problems.push(`package-lock 裝的 aw-kit commit 是 ${JSON.stringify(lockCommit)}，但 tag v${tag} 現在指到 ${tagCommit}（tag 被移動過）：重跑 npm install "aw-kit@${spec}" 更新 lock`)
  return { problems, notes }
}

/**
 * 遠端 tag 指到的 commit（附註 tag 取 `^{}` 解開後的 commit）。
 * 回 `{ commit }`；遠端沒有這個 tag 回 `{ missing: true }`；查詢失敗（離線、限流、逾時、沒有 git）重試 3 次後回 null。
 * @param {string} tag 例：0.11.0
 * @returns {{ commit: string } | { missing: true } | null}
 */
export function fetchTagCommit(tag, repo = 'WUCL/aw-kit', { attempts = 3 } = {}) {
  for (let i = 0; i < attempts; i++) {
    let out
    try {
      out = execFileSync('git', ['ls-remote', `https://github.com/${repo}.git`, `refs/tags/v${tag}`, `refs/tags/v${tag}^{}`], { encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })   // 不存在的倉庫不可跳出帳密提示卡住
    } catch {   // GitHub 短暫 5xx／限流：等一下再試（1、2 秒；CI 用 strict，一次失敗就紅會製造假紅）
      if (i < attempts - 1) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000 * (i + 1))
      continue
    }
    const lines = out.trim().split('\n').filter(Boolean).map(l => l.split('\t'))
    if (lines.length === 0) return { missing: true }
    const peeled = lines.find(([, ref]) => ref.endsWith('^{}'))
    return { commit: (peeled ?? lines[0])[0] }
  }
  return null
}

/**
 * 讀消費端（root）的釘版狀態給 checkPin。aw-kit 在 dependencies 或 devDependencies 都認；
 * lock 只認 lockfileVersion 2／3 的 `packages`（npm 7+），讀不到時欄位是 undefined，checkPin 會報出來。
 */
export function readPinState(root, { remote = false } = {}) {
  const read = f => JSON.parse(readFileSync(join(root, f), 'utf8'))
  const pkg = read('package.json')
  const lock = read('package-lock.json')
  const mod = join(root, 'node_modules', 'aw-kit')
  const root0 = lock.packages?.[''] ?? {}
  return {
    spec: pkg.dependencies?.['aw-kit'] ?? pkg.devDependencies?.['aw-kit'],
    lockSpec: root0.dependencies?.['aw-kit'] ?? root0.devDependencies?.['aw-kit'],
    lockVersion: lock.packages?.['node_modules/aw-kit']?.version,
    installedVersion: existsSync(join(mod, 'package.json')) ? read('node_modules/aw-kit/package.json').version : undefined,
    linked: existsSync(mod) && lstatSync(mod).isSymbolicLink(),
    lockCommit: lock.packages?.['node_modules/aw-kit']?.resolved?.match(/#([0-9a-f]{40})$/)?.[1],
    // remote：連 GitHub 查 tag 現在指到哪個 commit（checkPin 的 tagCommit）；沒開就不比對
    ...remoteTag(remote ? tagOf(pkg) : undefined),
  }
}

/** readPinState 的 tagCommit／tagMissing：沒查（沒開 remote 或沒釘 tag）兩個都不給 */
function remoteTag(tag) {
  if (!tag) return {}
  const r = fetchTagCommit(tag)
  if (r === null) return { tagCommit: null }
  return 'missing' in r ? { tagMissing: true } : { tagCommit: r.commit }
}

const tagOf = pkg => (pkg.dependencies?.['aw-kit'] ?? pkg.devDependencies?.['aw-kit'])?.match(/#v(\d+\.\d+\.\d+)$/)?.[1]
