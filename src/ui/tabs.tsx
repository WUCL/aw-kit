// 2026-11-19 自 inknock `src/shared/ui/tabs.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// Tabs 包裝層（ADR 0001〈外觀定案〉D7：舊 Tabs 與 Segmented 合併成一個元件，以 variant 區分）。
//   variant="line"（預設，舊 Tabs）：檢視切換——6 個以上、可能帶計數（全部／新客／復購／常客…），底線式、可橫向捲動不換行
//   variant="default"（舊 Segmented）：篩選條件——2–5 個、標籤短（本日／本週／本月），灰底膠囊群組、選中那格白底
// 同 Button：渲染原生 <button>、只借 primitives/tabs 的 class（樣式單一來源），不渲染 React Aria 的 Tabs——
// React Aria Tabs 要求 TabPanel 結構，而本專案的分頁內容由各頁自己渲染（以 idPrefix 對上 aria-controls）；
// 其 press 處理也會擋掉 document 上「點外面就關閉」的監聽（見 button.tsx 開頭）。
//
// 無障礙語意沿用兩個舊元件：line＝tablist／tab（aria-selected），default＝radiogroup／radio（aria-checked）——
// default 是篩選條件、底下沒有 tabpanel，讀屏念「單選 3 之 2」比「分頁」貼切。
// 鍵盤（2026-11-15 補上，兩個舊元件都只能點）：只有選中那格在 Tab 順序裡，左右鍵／Home／End 移動並直接選取（WAI-ARIA tabs 自動啟用、radiogroup 同，
// radiogroup 另認上下鍵）；帶 Alt／Cmd／Ctrl 的不攔。
import { useRef, type KeyboardEvent } from 'react'
import { tabsListVariants, tabsTriggerClassName } from './primitives/tabs'
import { cn } from './cn'
import { useTheme } from './theme-context'

export type TabOption<V extends string> = {
  value: V
  label: string
  /** 該分頁的筆數。給了就顯示在標籤右側（line） */
  count?: number
  /** 提醒小圓點（例：客戶有過敏備注）。2026-09-29 自 CustomerPanel 手刻分頁收進來 */
  dot?: boolean
}

interface TabsProps<V extends string> {
  options: readonly TabOption<V>[]
  /** default（篩選）可為 null＝目前沒有選任何一格 */
  value: V | null
  onChange: (value: V) => void
  /** 無障礙群組名稱，例如「客戶分類」「時間範圍」 */
  label: string
  variant?: 'line' | 'default'
  /**
   * line 放在哪裡（2026-09-29）：`shell`（預設）＝放在 TableShell 外框頂端，左右留內距、底線由外框畫；
   * `panel`＝放在側邊面板內容裡，貼齊內容左緣、自己畫底線。
   */
  placement?: 'shell' | 'panel'
  /** line：給了就產生 `${idPrefix}-tab-${value}`／aria-controls `${idPrefix}-tabpanel-${value}`，讓 tabpanel 以 aria-labelledby 對應 */
  idPrefix?: string
  /** default 的高度：預設 md；工具列較擠處（行事曆頁首）用 sm */
  size?: 'sm' | 'md'
}

export function Tabs<V extends string>({
  options, value, onChange, label, variant = 'line', placement = 'shell', idPrefix, size = 'md',
}: TabsProps<V>) {
  const T = useTheme()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const line = variant === 'line'
  const selectedIdx = options.findIndex(o => o.value === value)
  // 沒有選任何一格時，第一格進 Tab 順序（否則整組用鍵盤到不了）
  const focusIdx = selectedIdx >= 0 ? selectedIdx : 0

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = options.length
    // 帶修飾鍵的是瀏覽器／系統快捷鍵（Alt+← 上一頁、Cmd+← 行首），不攔（2026-11-15 review）
    if (n === 0 || e.altKey || e.metaKey || e.ctrlKey) return
    // radiogroup 照 WAI-ARIA 另認 ↑／↓（讀屏念「單選群組」，使用者會按上下）；tablist 是橫向的，只認左右
    const from = refs.current.findIndex(el => el === document.activeElement)
    const cur = from >= 0 ? from : focusIdx
    const fwd = e.key === 'ArrowRight' || (!line && e.key === 'ArrowDown')
    const back = e.key === 'ArrowLeft' || (!line && e.key === 'ArrowUp')
    const next = fwd ? (cur + 1) % n
      : back ? (cur - 1 + n) % n
      : e.key === 'Home' ? 0
      : e.key === 'End' ? n - 1
      : -1
    if (next < 0) return
    e.preventDefault()
    refs.current[next]?.focus()
    const opt = options[next]! // next 在 0..n-1（noUncheckedIndexedAccess）
    if (opt.value !== value) onChange(opt.value)
  }

  return (
    <div data-slot="tabs" data-orientation="horizontal"
      // panel 的底線畫在外層（＝內容寬），清單往外擴 6 不會連底線一起變寬
      className={cn('group/tabs', line ? 'flex min-w-0' : 'inline-flex shrink-0', line && placement === 'panel' && 'border-b border-line')}>
      <div
        role={line ? 'tablist' : 'radiogroup'}
        aria-label={label}
        data-slot="tabs-list"
        data-variant={variant}
        data-size={line ? undefined : size}
        onKeyDown={onKeyDown}
        className={cn(
          tabsListVariants({ variant }),
          line && 'no-scrollbar',
          // 項目自帶左右 6（焦點框用），這裡抵銷：shell 16－6＝10、panel 往外 -6，文字位置與舊版幾乎相同（見 primitives/tabs.tsx）
          line && (placement === 'panel' ? '-mx-1.5 w-[calc(100%+12px)]' : 'px-2.5'),
        )}
      >
        {options.map((opt, i) => {
          const active = i === selectedIdx
          return (
            <button
              key={opt.value}
              ref={el => { refs.current[i] = el }}
              type="button"
              role={line ? 'tab' : 'radio'}
              {...(line ? { 'aria-selected': active } : { 'aria-checked': active })}
              {...(line && idPrefix ? { id: `${idPrefix}-tab-${opt.value}`, 'aria-controls': `${idPrefix}-tabpanel-${opt.value}` } : {})}
              tabIndex={i === focusIdx ? 0 : -1}
              data-slot="tabs-trigger"
              data-selected={active || undefined}
              onClick={() => onChange(opt.value)}
              className={cn(
                tabsTriggerClassName,
                // default 的格子只有 26 高（32 扣 3px 內距）：可點範圍以 ::before 往上下補到 44（::after 是 line 的底線）
                !line && 'before:absolute before:inset-x-0 before:inset-y-[min(0px,calc((100%_-_44px)/2))]',
              )}
            >
              {opt.label}
              {/* 琥珀圓點：warning.base 沒有對應的 Tailwind 色（theme.css 只產生 amber 的 bg／ink／border），沿用代幣 */}
              {opt.dot && <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: T.state.warning.base }} />}
              {opt.count !== undefined && <span className="text-ink-faint tabular-nums">{opt.count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
