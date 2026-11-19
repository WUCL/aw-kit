// 2026-11-19 自 inknock `src/shared/ui/pressable.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { useButtonKeys } from './submit-enter'
import { isFromInnerControl as notForMe } from './interactive'


/**
 * 「整塊可以點」的區塊（清單列、卡片、行事曆上的預約）——2026-11-17 第 20 批。
 *
 * 原本這些是裸 `<div onClick>`：鍵盤到不了、報讀不知道能按，共用 Tooltip 也認不出是可點的列。
 * 內容多欄（姓名＋金額＋徽章）、版面各異，套 `<Button>` 會被它的高度與內距撐壞，所以用 div＋按鈕語意：
 * - `role="button"`、`tabIndex=0`（切換開關不要用它：用 `<label>`＋共用 `Switch`，2026-11-18 第 28 批）
 * - 鍵盤比照原生按鈕（共用 `useButtonKeys`：Enter 按下觸發、空白鍵放開觸發、按住不重複、排除注音組字）
 * - 聚焦外圈走全站 `focus-ring`
 * - `disabled`：不觸發、`aria-disabled`，仍可聚焦（說明為什麼不能按的 title 讀得到）
 * - 按鍵與點擊若來自內層的按鈕／連結／欄位，留給它們自己（review：不然內層輸入框打不出空格、內層按鈕的 Enter 變成開整列）
 * - 報讀名稱：內容很長時（訂單列、品牌列）呼叫端給精簡的 `aria-label`
 * 外觀由呼叫端的 `style` 決定（頁面只寫排版；顏色等仍引用 T 代幣）。
 */
type PressableProps = {
  onPress: () => void
  disabled?: boolean
  /** 聚焦外圈畫在框內（預設）：清單容器 overflow:hidden 會裁掉框外的外圈。外面有留白、框內會壓到內容時給 false */
  focusInset?: boolean
  style?: CSSProperties
  children: ReactNode
} & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'role' | 'className' | 'children' | 'style' | 'tabIndex'>

export const Pressable = forwardRef<HTMLDivElement, PressableProps>(function Pressable(
  { onPress, disabled = false, focusInset = true, style, children, ...rest }, ref,
) {
  const activate = () => { if (!disabled) onPress() }
  const keys = useButtonKeys<HTMLDivElement>(activate)
  return (
    <div
      {...rest}
      ref={ref}
      role="button"
      tabIndex={0}
      aria-disabled={disabled || undefined}
      // 外圈畫在框內（inset）：列常放在 overflow:hidden 的清單容器裡，畫在框外會被裁掉（review：SP 品牌列）
      className={focusInset ? 'focus-ring focus-ring-inset' : 'focus-ring'}
      onClick={e => { if (!notForMe(e)) activate() }}
      onKeyDown={e => { if (!notForMe(e)) keys.onKeyDown(e); rest.onKeyDown?.(e) }}
      onKeyUp={e => { if (!notForMe(e)) keys.onKeyUp(e); rest.onKeyUp?.(e) }}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {children}
    </div>
  )
})
