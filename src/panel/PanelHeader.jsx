import { CloseIcon } from './close-icon.jsx'

// 面板頭部（版面依 tmp/mockup-panel-topbar.html）：
//   頂列 20px：‹ 來源名（depth>1 才有）……✕（點擊區 44×44，視覺小）
//   4px → 標題（獨佔一列靠左）＋ 可選 meta（單號／狀態，淡一階、可換行）→ 4px → 分隔線
// 頂列不放任何動作；不提供「全部關閉」。
// 骨架常數（規格 §2.4，不開放覆寫）：頂列高 20、點擊區 44、細列／標題間距 4。
const TOP_ROW_H = 20
const HIT = 44        // inknock T.controlH.lg
const GAP_XS = 4      // inknock SPACING.xs

/** padX：左右內距，CSS 長度字串（殼傳 var(--aw-panel-pad-mobile)／var(--aw-panel-pad)） */
export function PanelHeader({ title, meta, backLabel, onBack, onClose, padX }) {
  const hit = HIT
  const hitBtn = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)', height: hit, minWidth: hit,
    display: 'grid', placeItems: 'center', border: 'none', background: 'transparent',
    cursor: 'pointer', padding: 0, fontFamily: 'inherit',
  }
  return (
    <header style={{ padding: `var(--aw-panel-space-lg) ${padX} ${GAP_XS}px`, borderBottom: '1px solid var(--aw-panel-rule)', background: 'var(--aw-panel-bg)' }}>
      <div style={{ position: 'relative', height: TOP_ROW_H, marginBottom: GAP_XS }}>
        {backLabel !== undefined && (
          <button type="button" className="aw-panel-hit" onClick={onBack} aria-label={`返回${backLabel}`}
            style={{ ...hitBtn, left: 'calc(-1 * var(--aw-panel-space-sm))', padding: '0 var(--aw-panel-space-sm)', color: 'var(--aw-panel-back-color)', fontSize: 'var(--aw-panel-meta-size)', fontWeight: 600 }}>
            ‹ {backLabel}
          </button>
        )}
        <button type="button" className="aw-panel-hit" onClick={onClose} aria-label="關閉"
          style={{ ...hitBtn, right: -(hit - TOP_ROW_H) / 2, width: hit, color: 'var(--aw-panel-ink-subtle)' }}>
          <CloseIcon size={16} />
        </button>
      </div>
      <h2 style={{ margin: 0, paddingBottom: GAP_XS, fontSize: 'var(--aw-panel-title-size)', fontWeight: 600, color: 'var(--aw-panel-ink)', lineHeight: 'var(--aw-panel-title-line-height)' }}>
        {title}
        {meta && <span style={{ marginLeft: 'var(--aw-panel-space-sm)', fontSize: 'var(--aw-panel-meta-size)', fontWeight: 400, color: 'var(--aw-panel-meta-color)' }}>{meta}</span>}
      </h2>
    </header>
  )
}
