// 2026-11-19 自 inknock `src/shared/ui/icon-button.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { buttonVariants } from './primitives/button'
import { DISABLED_GHOST, DISABLED_LOOK } from './button'
import { cn } from './cn'

/**
 * 只有一個符號、沒有文字的方形按鈕（⋯、‹ ›、×、＋）。
 *
 * 存在的理由（2026-09-30）：專案有 Button／Select／Input，唯獨缺這一塊，
 * 於是每處自己手刻、尺寸各異（⋯ 44、日曆 32/40、鈴鐺 34、關閉 28），
 * 放進同一列就對不齊。尺寸一律跟 Button 同一套控制項高度：
 *   xs：與 sm 同高 28、圓角小一階——標題列關閉鈕、chip 內的移除鈕
 *   sm 28：表格內嵌（明細列刪除 ×）
 *   md 32：預設（桌機手機相同，2026-11-13 方案 B）
 *   lg 36
 * `label` 必填——純圖示按鈕沒有文字，讀屏只念得出 aria-label。
 *
 * 2026-11-16 換新（ADR 0001，使用者看比較頁確認）：外觀改走 Button 同一套 class（`buttonVariants`）——
 * 外框、hover、聚焦外圈、44 可點範圍、停用樣子（白底灰框淡字／透明鈕只降字色，不再半透明）都與 Button 相同。
 *   secondary＝Button outline、ghost＝Button ghost（符號中灰，原本淡灰）、primary＝Button 主要（深色實心）、
 *   sunken＝灰底（只有手機行事曆的 ‹ › 用）、remove＝透明鈕但滑過符號變紅（明細列刪除 ×，2026-11-17 第 15 批）。
 * 符號（‹ › × ⋯ ＋）粗細維持一般字重。圖示：Button 的 class 會把沒有 size- class 的 svg 一律放大成 16（一般按鈕的規格），
 *   圖示鈕則照 svg 的 width 屬性——12、14 對應到固定的 size-3／size-3.5（不用 size-auto：那要靠瀏覽器從屬性推原始尺寸，Safari 未驗；補審）。
 *   其他寬度照上游成 16；svg 自己帶 size- class 時一律以它為準。選擇器多一個屬性，權重高過上游那條（review：桌機行事曆 ‹ › 被放大）。
 * ⚠️ 不開放 className：要不同外觀就加 variant（同 Button，ADR 第 3 點）。
 */
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg'
export type IconButtonVariant = 'secondary' | 'ghost' | 'remove' | 'sunken' | 'primary'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label' | 'className'> {
  label: string
  size?: IconButtonSize
  variant?: IconButtonVariant
  children: ReactNode
}

const VARIANT = { secondary: 'outline', ghost: 'ghost', remove: 'ghost', sunken: 'ghost', primary: 'default' } as const
const SIZE = { xs: 'icon-sm', sm: 'icon-sm', md: 'icon', lg: 'icon-lg' } as const
// 灰底鈕停用：保留灰底、只降字色（套 DISABLED_LOOK 會變成白底灰框的外框鈕；補審）
const DISABLED_SUNKEN = 'disabled:opacity-100 text-ink-faint hover:bg-surface-sunken hover:text-ink-faint'

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', variant = 'secondary', disabled, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      aria-label={label}
      title={rest.title ?? label}
      disabled={disabled}
      data-slot="button"
      data-variant={variant}
      data-size={SIZE[size]}
      className={cn(
        buttonVariants({ variant: VARIANT[variant], size: SIZE[size] }),
        'font-normal',
        "[&_svg[width='12']:not([class*='size-'])]:size-3 [&_svg[width='14']:not([class*='size-'])]:size-3.5",
        size === 'xs' && 'rounded-sm',
        variant === 'sunken' && 'bg-surface-sunken text-ink hover:bg-muted',
        variant === 'remove' && 'hover:text-danger-ink',
        disabled && (variant === 'ghost' || variant === 'remove' ? DISABLED_GHOST : variant === 'sunken' ? DISABLED_SUNKEN : DISABLED_LOOK),
      )}
    >
      {children}
    </button>
  )
})
