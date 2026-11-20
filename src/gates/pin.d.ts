// aw-kit/gates/pin 的型別（實作：pin.js）
export interface PinState {
  spec?: string; lockSpec?: string; lockVersion?: string; installedVersion?: string; linked?: boolean
  /** lock 的 resolved 裡記的 commit */
  lockCommit?: string
  /** 遠端 tag 現在指到的 commit；undefined＝沒查（不比對）、null＝查詢失敗 */
  tagCommit?: string | null
  /** 遠端沒有這個 tag（被刪了） */
  tagMissing?: boolean
}
/** strict：查詢失敗（tagCommit null）也算問題——CI 用；tagMissing 一律算問題 */
export function checkPin(pin: PinState & { repo?: string; strict?: boolean }): { problems: string[]; notes: string[] }
/** remote：連 GitHub 查 tag 指到的 commit（建議只在 CI 開，並配 checkPin 的 strict） */
export function readPinState(root: string, opts?: { remote?: boolean }): PinState
/** 遠端 tag 指到的 commit（附註 tag 解開後）；遠端沒有這個 tag 回 { missing: true }，查詢失敗（重試後）回 null */
export function fetchTagCommit(tag: string, repo?: string, opts?: { attempts?: number }): { commit: string } | { missing: true } | null
