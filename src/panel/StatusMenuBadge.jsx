import { useEffect, useId, useRef, useState } from 'react'
import { isCancelEscape } from './key-utils.js'

// 可點的狀態標籤＋下拉選單（移植自 inflorify src/shared/ui/StatusMenuBadge.tsx，行為照搬，外觀改走 --aw-badge-* / --aw-panel-* 變數）。
// 選項可 disabled 並寫出原因（不可選但看得到）。
// 鍵盤：按鈕 Enter／空白／↓ 開啟並聚焦目前項；選單內 ↑↓ 移動、Home／End、Enter 選取、
// Esc（排除 IME 組字）關閉並回到按鈕；Tab 或點外面關閉。

const LEGACY = { success: 'ok', warning: 'warn', accent: 'brand' }
const BOLD = new Set(['warn', 'danger', 'date', 'box'])

function toneVars(tone) {
  const t = tone ? (LEGACY[tone] ?? tone) : 'plain'
  return { t, bg: `var(--aw-badge-${t}-bg)`, text: `var(--aw-badge-${t}-text)`, border: `var(--aw-badge-${t}-border)` }
}

export function StatusMenuBadge({ label, tone, value, options, onSelect, ariaLabel }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const menuId = useId()

  const items = () => Array.from(root.current?.querySelectorAll('[role="menuitemradio"]:not([aria-disabled="true"])') ?? [])
  const close = (refocus) => { setOpen(false); if (refocus) trigger.current?.focus() }

  useEffect(() => {
    if (!open) return
    const cur = root.current?.querySelector('[aria-checked="true"]:not([aria-disabled="true"])')
    ;(cur ?? items()[0])?.focus()
    const onDown = (e) => { if (!root.current?.contains(e.target)) setOpen(false) }
    // capture + stopImmediatePropagation：選單在 SlideOver 等同樣掛 document keydown 的容器內時，Esc 只關選單，不連面板一起關
    // （SlideOver 另有 defaultPrevented 防線）。
    const onKey = (e) => { if (isCancelEscape(e)) { e.preventDefault(); e.stopImmediatePropagation(); close(true) } }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey, true) }
  }, [open])

  const move = (d) => {
    const list = items(); if (list.length === 0) return
    const i = list.indexOf(document.activeElement)
    list[(i + d + list.length) % list.length]?.focus()
  }
  const edge = (end) => { const list = items(); (end ? list[list.length - 1] : list[0])?.focus() }
  const [hover, setHover] = useState(null)
  const [focused, setFocused] = useState(null)
  const c = toneVars(tone)

  return (
    <span ref={root} style={{ position: 'relative', display: 'inline-flex' }}>
      <button ref={trigger} type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} aria-label={`${ariaLabel}：${label}`}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true) } }}
        style={{ border: 0, padding: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 'var(--aw-badge-radius)' }}>
        <span data-badge={c.t} style={{
          display: 'inline-flex', alignItems: 'center', gap: 2, height: 24, padding: '0 7px', boxSizing: 'border-box',
          border: `1px solid ${c.border}`, borderRadius: 'var(--aw-badge-radius)', background: c.bg, color: c.text,
          fontSize: 'var(--aw-panel-meta-size)', fontWeight: BOLD.has(c.t) ? 600 : 400, lineHeight: 1, whiteSpace: 'nowrap',
        }}>{label}<span aria-hidden style={{ fontSize: 11, lineHeight: 1, opacity: 0.7 }}>▾</span></span>
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label={ariaLabel}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
            else if (e.key === 'Home') { e.preventDefault(); edge(false) }
            else if (e.key === 'End') { e.preventDefault(); edge(true) }
            else if (e.key === 'Tab') setOpen(false)
          }}
          style={{
            position: 'absolute', zIndex: 'var(--aw-badge-menu-z)', top: '100%', left: 0, marginTop: 4, minWidth: 140, padding: 4,
            background: 'var(--aw-panel-bg)', border: '1px solid var(--aw-panel-rule)', borderRadius: 'var(--aw-badge-radius)',
            boxShadow: 'var(--aw-badge-menu-shadow)', fontSize: 'var(--aw-panel-body-size)', color: 'var(--aw-panel-ink)',
          }}>
          {options.map(o => {
            const cur = o.value === value
            return (
              <button key={o.value} type="button" role="menuitemradio" aria-checked={cur} aria-disabled={o.disabled || undefined}
                onMouseEnter={() => setHover(o.value)} onMouseLeave={() => setHover(null)}
                onFocus={() => setFocused(o.value)} onBlur={() => setFocused(null)}
                onClick={() => { if (o.disabled) return; setOpen(false); trigger.current?.focus(); if (!cur) onSelect(o.value) }}
                style={{
                  display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: 12, border: 0,
                  background: !o.disabled && (hover === o.value || focused === o.value) ? 'var(--aw-badge-menu-hover-bg)' : 'transparent',
                  padding: '7px 10px', borderRadius: 4, fontFamily: 'inherit', fontSize: 'inherit', textAlign: 'left',
                  fontWeight: cur ? 600 : 400, cursor: o.disabled ? 'not-allowed' : 'pointer',
                  color: o.disabled ? 'var(--aw-panel-ink-subtle)' : 'var(--aw-panel-ink)', opacity: o.disabled ? 0.7 : 1,
                }}>
                <span>{o.label}</span>
                {o.disabled && o.reason && <small style={{ fontSize: 11, color: 'var(--aw-panel-ink-subtle)' }}>{o.reason}</small>}
                {cur && <span aria-hidden style={{ color: 'var(--aw-badge-menu-check)' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </span>
  )
}
