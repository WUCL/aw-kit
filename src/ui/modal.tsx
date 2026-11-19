// 2026-11-19 自 inknock `src/shared/ui/modal.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// Modal 包裝層（ADR 0001；2026-11-15 外觀換 shadcn Dialog，使用者確認比較頁）。對外 props 不變（18 個呼叫端不動）。
// 只借 primitives/dialog.tsx 的 class、不渲染 React Aria Modal——理由見該檔開頭（對話框外的 toast／提示泡泡會被設成 inert）。
// 行為照舊：Esc 只關最上層、注音組字中的 Esc 不算、手機（未要求置中）從底部滑出、點遮罩關閉可關。
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useIsMobile } from './breakpoints'
import { useTheme } from './theme-context'
import { Z } from './theme'
import { isCancelEscape } from './submit-enter'
import { CloseIcon } from './close-icon'
import { IconButton } from './icon-button'
import { cn } from './cn'
import {
  dialogBodyClassName, dialogContentClassName, dialogDescriptionClassName, dialogFooterClassName,
  dialogHeaderClassName, dialogOverlayClassName, dialogSheetClassName, dialogTitleClassName,
} from './primitives/dialog'

// 開啟中的 Modal 堆疊：Esc 只由最上層（最後開啟）回應，避免一次關掉兩層。
const modalStack: symbol[] = []

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  width?: number
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  showClose?: boolean
  footer?: ReactNode
  zIndex?: number
  /** 強制置中卡片版型（即使在手機/iPad 也不用底部 bottom sheet） */
  centered?: boolean
  /** 自訂背景遮罩顏色；不給＝10% 黑（shadcn） */
  overlayColor?: string
  /** 背景模糊強度，例如 '6px'；僅在支援 backdrop-filter 的瀏覽器生效 */
  overlayBlur?: string
  children: ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  width = 480,
  closeOnOverlay = true,
  closeOnEscape = true,
  showClose = true,
  footer,
  zIndex = Z.modal,
  centered = false,
  overlayColor,
  overlayBlur,
  children,
}: ModalProps) {
  const T = useTheme()
  const isMobile = useIsMobile()

  const token = useRef(Symbol('modal'))
  useEffect(() => {
    if (!open) return
    const t = token.current
    modalStack.push(t)
    return () => { const i = modalStack.indexOf(t); if (i >= 0) modalStack.splice(i, 1) }
  }, [open])

  useEffect(() => {
    if (!open || !closeOnEscape) return
    const handler = (e: KeyboardEvent) => {
      // defaultPrevented：裡面的元件已經用掉這次 Esc（搜尋選單收起清單），同 aw-kit 面板的規則
      if (isCancelEscape(e) && !e.defaultPrevented && modalStack[modalStack.length - 1] === token.current) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose, closeOnEscape])

  const titleId = useId()
  if (!open) return null

  const sheet = isMobile && !centered
  return (
    <>
      {/* 遮罩：預設 10% 黑＋輕微模糊（shadcn）；呼叫端給 overlayColor／overlayBlur 時以 inline 覆寫（收據預覽要更暗） */}
      <div
        onClick={closeOnOverlay ? onClose : undefined}
        className={cn(dialogOverlayClassName, closeOnOverlay ? 'cursor-pointer' : 'cursor-default')}
        style={{
          zIndex,
          background: overlayColor,
          backdropFilter: overlayBlur ? `blur(${overlayBlur})` : undefined,
          WebkitBackdropFilter: overlayBlur ? `blur(${overlayBlur})` : undefined,
        }}
      />
      {/* ⚠️ 不帶 data-slot：限定子樹的 preflight 會作用到對話框裡的頁面內容（同 Card，ADR 0001〈並存〉規則 ②） */}
      <div
        role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined}
        className={sheet ? dialogSheetClassName : dialogContentClassName}
        style={{ zIndex: zIndex + 1, fontFamily: T.font, ...(sheet ? {} : { width }) }}
      >
        {(title || showClose) && (
          <div className={dialogHeaderClassName}>
            <div>
              {title && <h2 id={titleId} className={dialogTitleClassName}>{title}</h2>}
              {subtitle && <p className={dialogDescriptionClassName}>{subtitle}</p>}
            </div>
            {showClose && (
              <IconButton label="關閉" size="xs" variant="ghost" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            )}
          </div>
        )}

        <div className={cn(dialogBodyClassName, !(title || showClose) && 'pt-6')}>
          {children}
        </div>

        {footer && <div className={dialogFooterClassName}>{footer}</div>}
      </div>
    </>
  )
}
