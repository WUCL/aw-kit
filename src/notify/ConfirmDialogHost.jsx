// src/ConfirmDialogHost.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { registerConfirmHost } from './confirmDialog.js'
import Button from './Button.jsx'

let _confirmHostMountCount = 0 // Strict Mode / multi-instance guard: count of currently-mounted hosts

export default function ConfirmDialogHost() {
  const [dialog, setDialog] = useState(null) // { opts, resolve } | null
  const [show, setShow] = useState(false)
  const panelRef = useRef(null)
  const restoreFocusRef = useRef(null)

  useEffect(() => {
    if (_confirmHostMountCount > 0) {
      console.warn('[aw-kit/notify] ConfirmDialogHost 已掛載超過一次——最後掛載的實例會接管 confirm() 呼叫，行為不可預期，請確認只在 App 根層掛載一次')
    }
    _confirmHostMountCount += 1
    const unregister = registerConfirmHost((opts, resolve) => setDialog({ opts, resolve }))
    return () => {
      unregister()
      _confirmHostMountCount -= 1
    }
  }, [])

  const isMulti = !!dialog?.opts?.actions

  const settle = useCallback((result) => {
    dialog?.resolve(result)
    setShow(false)
    setTimeout(() => setDialog(null), 150)
  }, [dialog])

  const dismiss = useCallback(() => settle(isMulti ? null : false), [settle, isMulti])

  useEffect(() => {
    if (!dialog) return
    restoreFocusRef.current = document.activeElement
    const raf = requestAnimationFrame(() => setShow(true))
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = setTimeout(() => {
      panelRef.current?.querySelector('button:not([disabled])')?.focus()
    }, 60)
    return () => {
      cancelAnimationFrame(raf); clearTimeout(focusTimer)
      document.body.style.overflow = prevOverflow
      // Focus-restore guard: if the element that triggered the dialog was unmounted while
      // the dialog was open (e.g. it lived inside a menu that closed), calling .focus() on a
      // detached node throws / sends focus to an unpredictable place. Only restore focus if
      // the node is still attached to the document.
      if (restoreFocusRef.current instanceof HTMLElement && document.body.contains(restoreFocusRef.current)) {
        restoreFocusRef.current.focus()
      }
    }
  }, [dialog])

  useEffect(() => {
    if (!dialog) return
    const onKey = (e) => {
      if (e.key === 'Escape') { dismiss(); return }
      if (e.key !== 'Tab') return
      const f = panelRef.current?.querySelectorAll('button:not([disabled])')
      if (!f || f.length === 0) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [dialog, dismiss])

  if (!dialog) return null
  const { title, body, confirmLabel = '確定', cancelLabel = '取消', variant = 'primary', actions } = dialog.opts

  return (
    <div className="fbk-dialog-overlay">
      <div onClick={dismiss} aria-hidden="true"
        className={`fbk-dialog-backdrop ${show ? 'fbk-dialog-backdrop--shown' : ''}`} />
      <div ref={panelRef} role="alertdialog" aria-modal="true" aria-label={title}
        className={`fbk-dialog-panel ${show ? 'fbk-dialog-panel--shown' : ''}`}>
        {title && <h2 className="fbk-dialog-title">{title}</h2>}
        {body && <p className="fbk-dialog-body">{body}</p>}
        <div className="fbk-dialog-actions">
          {actions ? (
            actions.map(a => (
              <Button key={a.key} variant={a.variant || 'secondary'} onClick={() => settle(a.key)}>
                {a.label}
              </Button>
            ))
          ) : (
            <>
              <Button variant="secondary" onClick={() => settle(false)}>{cancelLabel}</Button>
              <Button variant={variant} onClick={() => settle(true)}>{confirmLabel}</Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
