// 2026-11-19 自 inknock `src/shared/ui/checkbox.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// Checkbox 包裝層（ADR 0001；2026-11-13 對照圖：原生 checkbox 各瀏覽器長相不同 → 統一外觀＋品牌色勾選）。
// 同 Button：渲染原生 <input type="checkbox">（appearance-none 畫框）、只借 primitives/checkbox 的 class（樣式單一來源），
// 不渲染 React Aria 的 Checkbox——呼叫端都是「<label> 包住勾選框＋文字」，原生 input 讓 label 點擊、表單語意、
// onChange(e.target.checked) 全部照舊，頁面只需把 <input type="checkbox"> 換成 <Checkbox>。
//
// indeterminate（部分選取）是 DOM 屬性、不是 HTML 屬性，React 不會幫忙設；這裡用 prop 收進來寫到元素上，
// 顯示「－」（不沿用上游部分選取也畫勾：勾＝全選，部分選取畫勾會看成全選）。
import { forwardRef, useCallback, useLayoutEffect, useRef, type ChangeEvent, type CSSProperties, type InputHTMLAttributes } from 'react'
import { CheckIcon, MinusIcon } from 'lucide-react'
import { checkboxBoxClassName, checkboxIconClassName } from './primitives/checkbox'
import { cn } from './cn'

// className 不開放（同 Button／Input）；style 只給外層（版面：marginTop 之類），尺寸與外觀由元件決定
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className' | 'style' | 'size'> {
  indeterminate?: boolean
  style?: CSSProperties
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { indeterminate = false, style, onChange, ...rest },
  ref,
) {
  const inner = useRef<HTMLInputElement | null>(null)
  // 每次 render 都寫回（不設依賴）；用 layout effect：首次繪製前就到位，不閃一下空框
  useLayoutEffect(() => { if (inner.current) inner.current.indeterminate = indeterminate })
  // 瀏覽器點擊時會自己把 DOM 的 indeterminate 清掉；呼叫端若在 onChange 裡沒改狀態（被確認框取消、唯讀擋下），
  // React 只把 checked 還原、不重新 render，上面的 effect 不會跑，畫面就變成「未選」（2026-11-15 review）。
  // onChange 之後同步寫回目前的值（React 的還原只動 checked、不動 indeterminate；有狀態更新的話重繪後 effect 會再覆寫成新值）；
  // finally：呼叫端 throw 也要寫回
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    try { onChange?.(e) } finally { e.currentTarget.indeterminate = indeterminate }
  }
  // 穩定的 callback ref：每次 render 新建的話，呼叫端的函式 ref 每次重繪都會先收到 null 再收到元素
  const setRef = useCallback((el: HTMLInputElement | null) => {
    inner.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }, [ref])
  return (
    // 停用的淡化放在外層：框與疊在上面的勾／橫線一起變淡（只放在 input 上，勾會是 100% 不透明，看起來像可操作）；
    // 框本身的兩條停用透明度（disabled:、group-has-disabled/field:）都歸零，避免疊兩次
    <span data-slot="checkbox-root" className="inline-grid shrink-0 place-items-center has-disabled:opacity-45" style={style}>
      <input {...rest} onChange={handleChange} ref={setRef} type="checkbox" data-slot="checkbox"
        className={cn(checkboxBoxClassName, 'col-start-1 row-start-1 disabled:opacity-100 group-has-disabled/field:opacity-100')} />
      {/* :checked 但非部分選取才畫勾；部分選取畫橫線（原生 :indeterminate 與 :checked 可同時成立） */}
      <CheckIcon aria-hidden className={cn(checkboxIconClassName, 'peer-[:checked:not(:indeterminate)]:opacity-100')} />
      <MinusIcon aria-hidden className={cn(checkboxIconClassName, 'peer-indeterminate:opacity-100')} />
    </span>
  )
})
