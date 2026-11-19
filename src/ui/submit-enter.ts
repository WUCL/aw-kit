// 2026-11-19 自 inknock `src/shared/ui/submit-enter.ts` 原樣搬入（inknock ADR 0002 C 批）；註解中的 DECISIONS／CLAUDE.md／日期指 inknock 的紀錄。
import { useRef, type KeyboardEvent } from 'react'

// 鍵盤快捷鍵 × 中文輸入法：「Enter 送出」「Esc 關閉」的唯一判準。
//
// 中文輸入法（注音／倉頡／拼音）組字時，Enter 是「確認選字」、Esc 是「取消選字」，
// 都不是給頁面的指令。2026-10-04 使用者回報：領料駁回原因打一個字、按 Enter 選字，
// 對話框就直接送出了；同一個形狀的 Esc 會把面板／對話框連同打到一半的字一起關掉。
// 組字中的按鍵：多數瀏覽器 `isComposing === true`；Safari 會在 compositionend 之後
// 才補發 keydown，此時 isComposing 已是 false，只能靠 `keyCode === 229` 認出來。
// ⚠️ 全站凡是「Enter 觸發動作」「Esc 關閉」一律走這兩支，不要各自寫 `e.key === 'Enter'`。
//    React 事件（e.nativeEvent）與原生 document 監聽（e 本身）都吃。
type KeyLike = { key: string; keyCode?: number; isComposing?: boolean; nativeEvent?: { isComposing?: boolean } }

export function isImeComposing(e: KeyLike): boolean {
  return !!(e.nativeEvent?.isComposing ?? e.isComposing) || e.keyCode === 229
}

export function isSubmitEnter(e: KeyLike): boolean {
  // eslint-disable-next-line no-restricted-syntax -- Enter 判斷的唯一實作處（全站其他地方一律呼叫本函式）
  return e.key === 'Enter' && !isImeComposing(e)
}

export function isCancelEscape(e: KeyLike): boolean {
  // eslint-disable-next-line no-restricted-syntax -- Esc 判斷的唯一實作處（全站其他地方一律呼叫本函式）
  return e.key === 'Escape' && !isImeComposing(e)
}

/**
 * 可點的列（role="button" 的 div、DataTable 列）的鍵盤啟動：Enter 或空白鍵，排除組字。
 * 只認焦點在列本身的按鍵——列內按鈕／輸入框冒泡上來的要留給它們自己（2026-10-08 review）。
 * 符合時呼叫端應 preventDefault（空白鍵預設會捲動頁面）。
 */
export function isRowActivateKey(e: KeyLike & { target: unknown; currentTarget: unknown }): boolean {
  if (e.target !== e.currentTarget) return false
  return isSubmitEnter(e) || (e.key === ' ' && !isImeComposing(e))
}

/**
 * role="button" 元素的鍵盤啟動，比照原生 <button>（2026-11-04 mockup 120 第四輪 review）：
 * - Enter：按下時觸發，按住的自動重複不再觸發
 * - 空白鍵：按下時只擋捲動，**放開時**才觸發，且必須是在本元素上按下的（焦點移進來時才放開不算）
 * - 兩者都排除注音等輸入法組字
 * 回傳的 onKeyDown／onKeyUp 原樣掛上。使用：InfoTip、Pressable（整塊可點的區塊，2026-11-17）。
 */
export function useButtonKeys<E extends HTMLElement>(activate: () => void) {
  const spaceDown = useRef(false)
  return {
    onKeyDown: (e: KeyboardEvent<E>) => {
      if (e.key === ' ') { e.preventDefault(); if (!e.repeat && !isImeComposing(e)) spaceDown.current = true; return }
      if (!e.repeat && isSubmitEnter(e)) { e.preventDefault(); activate() }
    },
    onKeyUp: (e: KeyboardEvent<E>) => {
      if (e.key !== ' ') return
      const pressedHere = spaceDown.current
      spaceDown.current = false
      if (pressedHere && !isImeComposing(e)) activate()
    },
  }
}
