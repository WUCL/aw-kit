// 「這支腳本是被直接執行的嗎」——aw-kit scripts/ 共用（2026-11-19 自 inknock scripts/is-main.mjs 原樣搬入）。
// 判斷錯了腳本會什麼都不做就 exit 0，閘門靜默變綠，所以只准用這一份：
// - 不可寫 `file://${argv[1]}`：含空白或中文的路徑會被百分比編碼，永遠不相等
// - argv[1] 要先 realpath：Node 對主模組的 import.meta.url 已解開 symlink（macOS /tmp→/private/tmp、symlink 的 worktree）
import { realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export function isMain(meta) {
  const entry = process.argv[1]
  if (!entry) return false
  // realpath 失敗時退回未解 symlink 的路徑再比一次，不直接判「不是主程式」（那等於閘門靜默跳過）
  let real = entry
  try { real = realpathSync(entry) } catch { /* 用原路徑 */ }
  return meta.url === pathToFileURL(real).href
}
