// 2026-11-19 自 inknock `src/shared/ui/skeleton.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// 骨架載入（skeleton screen，2026-09-29 使用者）。
//
// 用途：資料還沒回來時，在**原本的位置**畫同樣大小的灰塊＋一道光，資料一到直接換成內容——
// 遮住等待、版面不跳。與「fake loading（刻意多等）」不同：這裡不延長任何等待。
//
// ⚠️ 0.2 秒門檻（`SKELETON_DELAY_MS`）：很快就回來的資料**不顯示**骨架，否則灰塊一閃而過，
//    反而像在閃爍。門檻內仍佔住同樣的空間（透明），所以不論多快回來，版面都不跳。
//    這條規則寫在 DESIGN.md「骨架載入」；新畫面一律用這個元件，不要各頁自寫一份。
//    （之後預計升到 aw-kit；先在 inknock 驗證。）
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useTheme } from './theme-context'
import { cn } from './cn'
import { skeletonClassName, skeletonShimmerClassName } from './primitives/skeleton'
import { useIsMobile } from './breakpoints'

export const SKELETON_DELAY_MS = 200

/** loading 持續超過 delay 才回 true；loading 一結束立刻回 false。 */
export function useDelayedFlag(loading: boolean, delay = SKELETON_DELAY_MS): boolean {
  const [show, setShow] = useState(false)
  useEffect(() => {
    // loading 一結束要「立刻」收掉骨架（不等下一輪）；既有寫法，inknock 為 warn 級，2026-11-19 搬入時原樣保留
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 見上
    if (!loading) { setShow(false); return }
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [loading, delay])
  return show
}

/** 一塊骨架。`visible=false` 時透明但佔位（門檻內用）。 */
export function Skeleton({ width = '100%', height = 16, radius, visible = true, style }: {
  width?: number | string; height?: number | string; radius?: number; visible?: boolean; style?: CSSProperties
}) {
  // 外觀（掃光漸層、預設圓角）走 primitives/skeleton.tsx 的 class；尺寸每塊都不同（要與真實內容同尺寸），以 inline 給
  return (
    <span aria-hidden
      className={cn(skeletonClassName, visible && skeletonShimmerClassName)}
      style={{ width, height, ...(radius !== undefined && { borderRadius: radius }), ...style }} />
  )
}

/** 載入中顯示骨架（過了門檻才看得見）、載完顯示 children。骨架形狀由 `skeleton` 決定，要與真實內容同尺寸。 */
export function SkeletonGate({ loading, skeleton, children, delay }: {
  loading: boolean; skeleton: (visible: boolean) => ReactNode; children: ReactNode; delay?: number
}) {
  const visible = useDelayedFlag(loading, delay)
  return <>{loading ? <span role="status" aria-label="載入中" style={{ display: 'contents' }}>{skeleton(visible)}</span> : children}</>
}

/**
 * 整塊內容還沒回來時的骨架（2026-09-29 全站推廣，mockup `TyEqHuaR`）——取代各頁的「載入中…」文字。
 * 呼叫端在「資料是 loading」的分支直接 `return <LoadingSkeleton variant="…" />`，不需要自己管門檻。
 *
 * - `list`：整頁列表（標題列＋一張卡片裡 5 列）
 * - `form`：設定頁／表單（標籤＋輸入框 × 4）
 * - `panel`：側邊面板或分頁內容（標題、欄位、大塊內容）
 * - `kpi`：報表與儀表板（三張數字卡＋一塊圖表區）
 *
 * `inset`：整頁載入時頁面自己的外距還沒出現，給 true 由骨架留同樣的外距（桌機 28／手機 20·16）；
 *   放在面板、分頁、報表區塊裡面時不要給。
 * ⚠️ 只代表「還在路上」。載入**失敗**照舊顯示錯誤訊息，不要用骨架。
 * ⚠️ 下拉選單裡的「載入中…」選項、按鈕上的處理中文字不屬於這裡——那些位置放不下骨架，保留文字。
 */
export function LoadingSkeleton({ variant = 'list', rows = 5, inset = false }: { variant?: 'list' | 'form' | 'panel' | 'kpi'; rows?: number; inset?: boolean }) {
  const T = useTheme()
  const isMobile = useIsMobile()
  const v = useDelayedFlag(true)
  const card: CSSProperties = { background: T.surface, border: `1px solid ${T.lineStrong}`, borderRadius: T.radius.xl, overflow: 'hidden' }
  const body = (() => {
    if (variant === 'form') {
      return Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: T.gap.hairline }}>
          <Skeleton visible={v} width="22%" height={12} />
          <Skeleton visible={v} height={T.controlH.md} />
        </div>
      ))
    }
    if (variant === 'panel') {
      return <>
        <Skeleton visible={v} width="40%" height={14} />
        <Skeleton visible={v} height={T.controlH.md} />
        <Skeleton visible={v} width="60%" height={14} />
        <Skeleton visible={v} height={80} />
      </>
    }
    if (variant === 'kpi') {
      return <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: T.gap.inline }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ ...card, padding: T.spacing.lg, display: 'flex', flexDirection: 'column', gap: T.gap.inline }}>
              <Skeleton visible={v} width="50%" height={12} />
              <Skeleton visible={v} width="75%" height={26} />
            </div>
          ))}
        </div>
        <Skeleton visible={v} height={180} radius={T.radius.xl} />
      </>
    }
    // list：欄寬比例接近倉儲／訂單列表的實際版面（識別欄寬、狀態 pill、次要欄、右側數字）
    return <>
      <Skeleton visible={v} width="30%" height={20} />
      <div style={card}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: T.gap.block, padding: `${T.pad.rowY + 4}px ${T.pad.inputX}px`,
            borderTop: i === 0 ? 'none' : `1px solid ${T.line}` }}>
            <Skeleton visible={v} width="18%" height={12} />
            <Skeleton visible={v} width={52} height={18} />
            <Skeleton visible={v} width="30%" height={12} />
            <Skeleton visible={v} width="12%" height={12} style={{ marginLeft: 'auto' }} />
          </div>
        ))}
      </div>
    </>
  })()
  return (
    <div role="status" aria-label="載入中" aria-busy="true"
      style={{ display: 'flex', flexDirection: 'column', gap: T.gap.stack, padding: inset ? (isMobile ? '20px 16px' : 28) : 0 }}>
      {body}
    </div>
  )
}
