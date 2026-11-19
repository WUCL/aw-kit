// 2026-11-19 自 inknock `src/shared/ui/close-icon.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
/**
 * 「×」關閉圖示 — 全站唯一一份（2026-10-11 由 modal／side-panel／CheckoutForm／SalesDigestPage／
 * inventory-ui／filter-bar 六份逐字複製收斂而來；各處只有 `size` 不同：12／14／16）。
 * 線寬沿用全站 `ICON_STROKE`(2)。純裝飾，可點的外殼要自己帶 aria-label。
 */
export function CloseIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
