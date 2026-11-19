// 2026-11-19 自 inknock `src/shared/ui/info-tip.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useTheme } from './theme-context'
import { isCancelEscape, useButtonKeys } from './submit-enter'
import { Tooltip } from './tooltip'

/**
 * 欄位旁的 ⓘ 說明：**點開才顯示**，再點、點別處或按 Esc 收起（觸控與鍵盤都能開）。
 *
 * 為什麼不用 hover 式提示：Tooltip 的 hover iPad／手機點不到，而本站主載具是 iPad（舊的 hover 式 InfoDot 已於 2026-11-04 刪除）。
 * 泡泡本體仍是同一個 `Tooltip`（portal 到 body、依觸發點定位並夾回視窗），只是改成受控——不另刻第二套氣泡。
 * 2026-10-22 起（記帳費用面板 mockup 112 §3″）。2026-11-04 起全站唯一的說明提示（mockup 120；hover-only 的 InfoDot 已刪）：
 * - `tone="danger"`：關著紅框紅字、點開填滿紅色——用於說明「為什麼這裡是紅的」；**訊號本身（紅框、紅字）仍要在畫面上直接看得到**，ⓘ 只放解釋。
 * - 外觀 18px，可點範圍 32px（四周透明邊、負邊距抵銷，不撐高所在那一行）：18px 用手指點不準。
 */
const VISUAL = 18
const HIT = 32

export function InfoTip({ text, label, tone = 'muted', style }: {
  text: string; label?: string; tone?: 'muted' | 'danger'
  /** 外層定位用（例：接在標籤文字後的左間距）；不影響圓本身的外觀 */
  style?: CSSProperties
}) {
  const T = useTheme()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: Event) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    // capture + stopPropagation：Esc 只收起泡泡，不連帶關掉底下的面板／對話框
    const onKey = (e: KeyboardEvent) => {
      if (isCancelEscape(e)) { e.stopPropagation(); setOpen(false) }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const keys = useButtonKeys<HTMLSpanElement>(() => setOpen(o => !o))
  const strong = tone === 'danger' ? T.state.danger.dark : T.accent600
  const idle = tone === 'danger' ? T.state.danger.dark : T.inkMuted
  const pad = (HIT - VISUAL) / 2
  return (
    <span ref={wrapRef} style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', ...style }}>
      <Tooltip text={text} open={open}>
        {/* 不用 <button>：<label> 沒寫 htmlFor 時指向「第一個可被標記的子元素」，button 就是。ⓘ 放在 label 裡、欄位前面時，
            label 會改指向 ⓘ——點欄名開的是提示、欄位失去名稱（2026-11-04 code review）。span[role=button] 不是可被標記的元素；
            點擊時 preventDefault，label 也不會把這次點擊轉發給欄位。 */}
        <span
          role="button"
          tabIndex={0}
          aria-label={label ? `說明：${label}` : "說明"}
          aria-expanded={open}
          onClick={e => { e.preventDefault(); setOpen(o => !o) }}
          // 比照原生 <button>：Enter 按下觸發、空白鍵放開觸發、按住不重複（共用 useButtonKeys）
          {...keys}
          className="focus-ring"
          style={{
            width: HIT, height: HIT, margin: -pad, cursor: 'pointer', borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: VISUAL, height: VISUAL, borderRadius: '50%', boxSizing: 'border-box', fontFamily: T.font,
              border: `1px solid ${open || tone === 'danger' ? strong : T.lineControl}`,
              background: open ? strong : T.surface, color: open ? '#FFFFFF' : idle,
              // eslint-disable-next-line aw-kit/no-hardcoded-design-token -- 18px 圓內的「i」字元當圖示用，拉丁字母可用 600
              fontSize: 11, lineHeight: 1, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >i</span>
        </span>
      </Tooltip>
    </span>
  )
}
