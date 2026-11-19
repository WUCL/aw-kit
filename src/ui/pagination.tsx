// 2026-11-19 自 inknock `src/shared/ui/pagination.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useState, useEffect, type ReactNode } from "react"
import { IconButton } from "./icon-button"
import { useIsMobile } from "./breakpoints"
import { useTheme } from "./theme-context"
import { NumberInput } from './number-input'
import { isSubmitEnter } from './submit-enter'

interface PaginationProps {
  page: number              // 1-indexed
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  /** 顯示「跳到第 X 頁」輸入框（桌機才顯示，預設 true） */
  showJump?: boolean
}

export function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  showJump = true,
}: PaginationProps) {
  const T = useTheme()
  const isMobile = useIsMobile()
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const [jumpInput, setJumpInput] = useState(String(page))

  // 外部換頁時把跳頁欄同步成新頁碼；既有寫法，inknock 為 warn 級，2026-11-19 搬入時原樣保留
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 見上
  useEffect(() => { setJumpInput(String(page)) }, [page])

  if (totalCount === 0 || totalPages <= 1) return null

  const startIdx = (page - 1) * pageSize + 1
  const endIdx = Math.min(page * pageSize, totalCount)

  function go(delta: number) {
    const next = Math.min(totalPages, Math.max(1, page + delta))
    if (next !== page) onPageChange(next)
  }

  function handleJump() {
    const n = parseInt(jumpInput, 10)
    if (!isNaN(n) && n >= 1 && n <= totalPages && n !== page) {
      onPageChange(n)
    } else {
      setJumpInput(String(page))
    }
  }

  return (
    <nav aria-label="分頁" style={{
      display: 'flex', alignItems: 'center',
      justifyContent: isMobile ? 'space-between' : 'flex-end',
      gap: isMobile ? T.gap.inline : T.gap.stack,
      padding: `${T.pad.inputY}px ${T.pad.inputX}px`, flexWrap: 'wrap',
      fontFamily: T.font,
    }}>
      <span style={{ fontSize: T.fontSize.meta, color: T.inkMuted, fontWeight: T.fontWeight.medium, fontVariantNumeric: 'tabular-nums' }}>
        {startIdx}–{endIdx} / 共 {totalCount} 筆
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: T.gap.inline }}>
        <PageButton label="上一頁" disabled={page <= 1} onClick={() => go(-1)}>
          <polyline points="15 18 9 12 15 6" />
        </PageButton>

        <span style={{ fontSize: T.fontSize.body, fontWeight: T.fontWeight.semibold, color: T.ink, padding: '0 6px', fontVariantNumeric: 'tabular-nums' }}>
          第 {page} / {totalPages} 頁
        </span>

        <PageButton label="下一頁" disabled={page >= totalPages} onClick={() => go(1)}>
          <polyline points="9 18 15 12 9 6" />
        </PageButton>

        {!isMobile && showJump && totalPages > 5 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: T.gap.hairline, marginLeft: T.spacing.sm }}>
            <span style={{ fontSize: T.fontSize.meta, color: T.inkFaint }}>跳至</span>
            <NumberInput kind="integer"
              // 2026-09-29 改用 NumberInput（全站不用 type=number）；範圍由 handleJump 檢查
              value={jumpInput}
              onChange={v => setJumpInput(v)}
              onBlur={handleJump}
              onKeyDown={e => { if (isSubmitEnter(e)) (e.target as HTMLInputElement).blur() }}
              inputSize="sm" align="center"
              aria-label="跳至第幾頁"
              style={{ width: 56 }}
            />
          </div>
        )}
      </div>
    </nav>
  )
}

/** 翻頁鈕＝共用 IconButton（外框鈕）；純圖示 → label 必填（第 13 批補上「上一頁／下一頁」）。2026-11-16 IconButton 換新後改用它，不再自己組 class。 */
function PageButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <IconButton label={label} disabled={disabled} onClick={onClick}>
      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </IconButton>
  )
}

/** 計算分頁切片 — 通用工具 */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}
