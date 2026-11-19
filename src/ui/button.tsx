// 2026-11-19 自 inknock `src/shared/ui/button.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// Button 包裝層（ADR 0001 第 3、4 點；外觀見〈外觀定案〉）。對外 props 與舊版 button.tsx 完全相同，頁面不用改。
//
// ⚠️ 刻意渲染原生 <button>、只借用 primitive 的 buttonVariants（樣式單一來源），不渲染 React Aria 的 Button：
//   React Aria 的 usePress 會對 pointerdown／mousedown／click／keydown 呼叫 stopPropagation，
//   document 上的「點外面就關閉」監聽（overflow-menu、header-dropdown、period-picker、info-tip、SalesDigestPage）
//   在點到按鈕時會收不到，選單就關不掉；它也會濾掉 title（7 處用來說明「為什麼不能按」）。
//   全站 201 處 onClick 依賴原生語意，換底層不可靜默改變它們（2026-11-13 讀 react-aria 1.22 原始碼確認）。
//   React Aria 版（primitives/button 的 Button）留給 src/shared/ui 內部需要 press 語意的複合元件（Dialog 觸發等）。
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { buttonVariants } from './primitives/button'
import { cn } from './cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'cta'
export type ButtonSize = 'sm' | 'md' | 'lg'

// className 不開放：頁面要不同外觀就加 variant（ADR 第 3 點），不從外面疊 class
interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

// 停用：白底＋lineStrong 框＋淡字（ghost 只降字色），不用 shadcn 的半透明——
// 2026-10-08 mockup 106 D 定案：透明度會和次要文字的灰撞色，分不出「說明文字」還是「這顆不能按」；
// 2026-11-13 Button 換新時使用者再次確認維持。載入中不套（維持變體顏色＋spinner）。
// IconButton（方形圖示鈕）也引用這兩份，停用外觀不另寫（2026-11-16）
export const DISABLED_LOOK = 'disabled:opacity-100 bg-background hover:bg-background border-line-strong text-ink-faint hover:text-ink-faint'
export const DISABLED_GHOST = 'disabled:opacity-100 text-ink-faint hover:bg-transparent hover:text-ink-faint'

const VARIANT = { primary: 'default', secondary: 'outline', ghost: 'ghost', danger: 'destructive', cta: 'cta' } as const
const SIZE = { sm: 'sm', md: 'default', lg: 'lg' } as const

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth = false, leftIcon, rightIcon, disabled, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={disabled || loading}
      data-slot="button"
      data-variant={VARIANT[variant]}
      data-size={SIZE[size]}
      data-loading={loading || undefined}
      className={cn(
        buttonVariants({ variant: VARIANT[variant], size: SIZE[size] }),
        fullWidth && 'w-full',
        // 載入中維持該變體的顏色（只換成 spinner），不套停用的半透明
        loading && 'disabled:opacity-100',
        disabled && !loading && (variant === 'ghost' ? DISABLED_GHOST : DISABLED_LOOK),
      )}
    >
      {/* 載入中 spinner（14）取代左圖示，按鈕寬度不跳：sm 圖示也是 14 → 沿用圖示側內距 6；
          md／lg 圖示是 16 → spinner 不帶 data-icon、改用一般內距 10（10＋14＝8＋16）。 */}
      {loading
        ? (hasIcon(leftIcon) && size === 'sm' ? <IconSlot side="inline-start"><Spinner /></IconSlot> : <Spinner />)
        : <IconSlot side="inline-start">{leftIcon}</IconSlot>}
      {children}
      {!loading && <IconSlot side="inline-end">{rightIcon}</IconSlot>}
    </button>
  )
})

function hasIcon(icon: ReactNode) {
  return icon !== null && icon !== undefined && icon !== false && icon !== ''
}

// primitives/button 的 `has-data-[icon=inline-start|end]:pl／pr` 規則（圖示側內距 sm 6、md／lg 8，照 shadcn 上游）
// 要按鈕內有帶 data-icon 的元素才會生效；上游是呼叫端自己在 <Icon> 上寫，本站呼叫端只傳 leftIcon／rightIcon，
// 所以由包裝層補。用 `contents` 的 span：不產生盒子，圖示仍是 flex 的直接子項，對齊、gap、高度與沒包時相同。
// 沒有圖示就不輸出（空 span 也會讓 :has 命中、把內距縮掉）。
function IconSlot({ side, children }: { side: 'inline-start' | 'inline-end'; children: ReactNode }) {
  if (!hasIcon(children)) return null
  return <span data-icon={side} className="contents">{children}</span>
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className="size-3.5 animate-spin" aria-hidden="true">
      {/* audit-ok: iconStroke — 這是載入 spinner 的**環**，不是線條圖示。
          環的粗細是另一種設計決定（太細會讀成閃爍），刻意不套 ICON_STROKE。 */}
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
