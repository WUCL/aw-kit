// src/ToastHost.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from './toast.js'

const MAX_SUCCESS = 3 // success items are capped at 3 concurrent; warn, error and action toasts are exempt

let _hostMountCount = 0 // Strict Mode / multi-instance guard: count of currently-mounted hosts

function ToastItem({ item, onClose }) {
  const [shown, setShown] = useState(false)
  const timerRef = useRef(null)
  const remainRef = useRef(item.duration)
  const startRef = useRef(0)

  const persistent = item.duration == null

  const startTimer = useCallback(() => {
    if (persistent) return
    startRef.current = Date.now()
    timerRef.current = setTimeout(() => onClose(item.id), remainRef.current)
  }, [item.id, onClose, persistent])

  const pauseTimer = useCallback(() => {
    if (persistent) return
    clearTimeout(timerRef.current)
    remainRef.current -= Date.now() - startRef.current
  }, [persistent])

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    startTimer()
    return () => { cancelAnimationFrame(raf); clearTimeout(timerRef.current) }
  }, [startTimer])

  const isError = item.type === 'error'
  const isWarn = item.type === 'warn'
  const hasAction = !!item.action
  // warn auto-dismisses, so click-to-close on the body is fine (same as success);
  // error must be dismissed deliberately via the ✕, never by a stray click.
  const bodyClose = !hasAction && !isError

  return (
    <div
      role={isError || isWarn ? 'alert' : 'status'}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      onClick={bodyClose ? () => onClose(item.id) : undefined}
      className={[
        'fbk-toast',
        isError && 'fbk-toast--error',
        isWarn && 'fbk-toast--warn',
        bodyClose && 'fbk-toast--clickable',
        shown && 'fbk-toast--shown',
      ].filter(Boolean).join(' ')}
    >
      <div className="fbk-toast__dot" />
      <span className="fbk-toast__message">{item.message}</span>
      {item.count > 1 && <span className="fbk-toast__count">×{item.count}</span>}
      {hasAction && (
        <button type="button" className="fbk-toast__action"
          onClick={(e) => { e.stopPropagation(); item.action.onClick(); onClose(item.id) }}>
          {item.action.label}
        </button>
      )}
      <button type="button" className="fbk-toast__close" aria-label="關閉"
        onClick={(e) => { e.stopPropagation(); onClose(item.id) }}>✕</button>
    </div>
  )
}

export default function ToastHost() {
  const [items, setItems] = useState([])

  useEffect(() => {
    if (_hostMountCount > 0) {
      console.warn('[aw-kit/notify] ToastHost 已掛載超過一次——多個實例都會收到並各自渲染同一則通知（重複顯示），請確認只在 App 根層掛載一次')
    }
    _hostMountCount += 1
    const unsubscribe = toast.subscribe(incoming => {
      setItems(prev => {
        // Repeated identical warnings (clicking Save three times with the same field
        // empty) collapse into one toast with a ×N counter, same as errors.
        if (incoming.type === 'error' || incoming.type === 'warn') {
          const idx = prev.findIndex(t => t.type === incoming.type && t.message === incoming.message)
          if (idx !== -1) {
            const next = [...prev]
            next[idx] = { ...next[idx], count: (next[idx].count || 1) + 1 }
            return next
          }
        }
        const next = [...prev, { ...incoming, count: 1 }]
        const evictable = next.filter(t => t.type === 'success' && !t.action)
        if (evictable.length > MAX_SUCCESS) {
          const victimId = evictable[0].id
          return next.filter(t => t.id !== victimId)
        }
        return next
      })
    })
    return () => {
      unsubscribe()
      _hostMountCount -= 1
    }
  }, [])

  const close = useCallback(id => setItems(prev => prev.filter(t => t.id !== id)), [])

  return (
    <div aria-live="polite" className="fbk-toast-container">
      {items.map(item => (
        <ToastItem key={item.id} item={item} onClose={close} />
      ))}
    </div>
  )
}
