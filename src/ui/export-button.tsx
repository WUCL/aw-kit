// 2026-11-19 自 inknock `src/shared/ui/export-button.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useEffect, useRef, useState } from 'react'
import { useTheme } from './theme-context'

// 全站統一的匯出按鈕：點擊後鎖定（顯示「匯出中…」+ spinner）至少 minLockMs，避免同步匯出一閃而過、
// 並防止當下連點重複觸發。onClick 可為同步或回傳 Promise（async 期間也持續鎖定，取較長者）。
export function ExportButton({ onClick, disabled = false, label = '匯出', fullWidth = false, minLockMs = 1500 }: {
  onClick: () => void | Promise<void>
  disabled?: boolean
  label?: string
  fullWidth?: boolean
  minLockMs?: number
}) {
  const T = useTheme()
  const [busy, setBusy] = useState(false)
  const mounted = useRef(true)
  // StrictMode 會 mount→cleanup→remount：body 內重設 true，否則 dev 下按鈕會永久卡「匯出中…」
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const off = busy || disabled
  // 與 Button md 同高，並排時才等高
  const h = T.controlH.md

  async function handle() {
    if (off) return
    setBusy(true)
    const start = Date.now()
    try {
      await onClick()
    } finally {
      // 最短鎖定：確保回饋可見 + 防連點；async 較久則以實際完成為準
      const wait = Math.max(0, minLockMs - (Date.now() - start))
      window.setTimeout(() => { if (mounted.current) setBusy(false) }, wait)
    }
  }

  return (
    // audit-ok: bareControl — 匯出鈕有自己的 busy/aria-busy 狀態機與
    //   下載副作用，Button 元件沒有 busy 語意（只有 loading spinner）。
    //   ⚠️ 但**尺寸一律對齊 Button secondary**：原本是 40/9/14，
    //      與同列的 36/8/15 差三個值，並排時看得出沒對齊。
    <button className="hit-area" onClick={handle} disabled={off} aria-busy={busy} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: T.gap.inline,
      height: h, padding: '0 14px', borderRadius: T.radius.md, border: `1px solid ${T.lineControl}`,
      background: T.surface, font: 'inherit', fontWeight: T.fontWeight.semibold, fontSize: T.fontSize.body,
      color: off ? T.inkFaint : T.ink, fontFamily: T.font, width: fullWidth ? '100%' : undefined,
      cursor: off ? 'not-allowed' : 'pointer', opacity: disabled && !busy ? 0.55 : 1,
      transition: `opacity ${T.motion.base}, color ${T.motion.base}, border-color ${T.motion.base}`,
    }}>
      {busy ? <><Spinner /> 匯出中…</> : <><DownloadIcon /> {label}</>}
    </button>
  )
}

// 線條下載圖示（Lucide download 同形；2026-10-02 取代文字符號「⬇」——字元在各裝置粗細不一，與側欄線條圖示不搭）
function DownloadIcon() {
  const T = useTheme()
  return (
    <svg width={T.icon.sm} height={T.icon.sm} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={T.iconStroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

// 自足式 SVG spinner（SMIL 旋轉，不需 CSS keyframe）
function Spinner() {
  const T = useTheme()
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* audit-ok: iconStroke — 這是載入 spinner 的**環**，不是線條圖示。
          環的粗細是另一種設計決定（太細會讀成閃爍），刻意不套 ICON_STROKE。 */}
      <circle cx="12" cy="12" r="9" stroke={T.line} strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke={T.accent600} strokeWidth="3" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}
