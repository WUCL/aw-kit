// aw-kit 釘版一致性（2026-11-20，inknock ADR 0002 E2 批）：消費端一律釘在 tag（`github:WUCL/aw-kit#vX.Y.Z`），
// 且 package.json、package-lock、實際裝到的版本三者相同。釘在分支或 commit、改了 package.json 沒重跑 npm install、
// 或 tag 指到版號沒升的 commit，都會讓「裝到哪一版」說不清楚——這些情況不報錯、只是靜默裝錯。
// checkPin 是純函式；readPinState(root) 讀消費端的 package.json／package-lock（lockfileVersion 2／3 的 packages）／node_modules。
// npm link（開發時）實際裝的是本機工作區，版號可能已經往前，所以 linked 時只略過第 4 項並回一則說明（不算通過也不算失敗）。

import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const escape = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

/**
 * @param {{ spec?: string, lockSpec?: string, lockVersion?: string, installedVersion?: string, linked?: boolean, repo?: string }} pin
 *   spec：package.json dependencies 的值；lockSpec：lock 根套件記的 spec；lockVersion：lock 裡 node_modules/aw-kit 的 version；
 *   installedVersion：node_modules/aw-kit/package.json 的 version；linked：node_modules/aw-kit 是不是 symlink（npm link）；
 *   repo：應釘的 GitHub 倉庫（預設 WUCL/aw-kit；fork 或打錯 owner 都算沒釘對）
 * @returns {{ problems: string[], notes: string[] }}
 */
export function checkPin({ spec, lockSpec, lockVersion, installedVersion, linked = false, repo = 'WUCL/aw-kit' }) {
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
  return { problems, notes }
}

/**
 * 讀消費端（root）的釘版狀態給 checkPin。aw-kit 在 dependencies 或 devDependencies 都認；
 * lock 只認 lockfileVersion 2／3 的 `packages`（npm 7+），讀不到時欄位是 undefined，checkPin 會報出來。
 */
export function readPinState(root) {
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
  }
}
