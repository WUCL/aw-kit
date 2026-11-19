// 2026-11-19 自 inknock `src/shared/ui/use-dropdown-menu.ts` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { Z } from './theme'
import { isCancelEscape, isSubmitEnter } from './submit-enter'
import { cn } from './cn'
import { menuContentClassName } from './primitives/dropdown-menu'
import { placeMenu, windowViewport, type MenuPlacement } from './menu-placement'

const ITEM = '[role="menuitem"]:not(:disabled), [role="menuitemradio"]:not(:disabled), [role="menuitemcheckbox"]:not(:disabled)'

/**
 * 下拉選單的殼（2026-11-15，ADR 0001 選單批次；OverflowMenu、PeriodPicker 共用）：定位、關閉、鍵盤、焦點。
 * ⚠️ review 改設計：原本兩個元件各有一份定位／點外面關／Esc／捲動關，任何修正都要改兩次（「一個功能兩條路徑」），
 *    收成這一支；新的選單也用它，不要再各刻一份。
 *
 * - 定位：fixed＋即時量測（表格與卡片容器常有 overflow，absolute 會被裁掉；計算在 `menu-placement.ts`，與搜尋選單共用）。下方放不下往上開，上下都不夠貼齊上緣、由選單自己捲動。
 *   首次定位時選單未掛載，用 `estimateHeight` 估；掛載後以實測高度再校正一次。`remeasureKey` 變了（選單內容變高）也重量。
 *   實測用 scrollHeight（offsetHeight 已被 maxHeight 壓住，估小了就永遠翻不上去，補審）；高度上限與寬度都用實際可見範圍
 *   （innerHeight／clientWidth：iPad Safari 的 100vh 比可見區高、innerWidth 含捲軸）。
 * - 關閉：點外面、Esc（排除注音組字）、視窗 resize、外面捲動（fixed 不會跟著容器捲動）。**選單自己捲動不關**（短視窗下選單要捲才看得到下面的項目）。
 * - 焦點：鍵盤開啟（click 的 detail＝0）→ 焦點到已選項（aria-checked），沒有就第一項；滑鼠／觸控開啟 → 焦點放在選單本體，
 *   方向鍵照樣可用，但不會有任何一列被標成焦點（iPad 上 Safari 對程式設定的焦點可能套 :focus-visible，已選項會被誤畫成 hover）。
 *   選了項目用 `select(e)`：鍵盤選的（click detail＝0）焦點回觸發鈕，滑鼠／觸控選的不搶（iPad 上程式設定的焦點可能畫出焦點框）。
 *   Esc、Shift+Tab → 關閉並回到觸發鈕；點外面、Tab 移出則不搶回（使用者已經去別處）。
 * - 鍵盤：↑↓ 循環、Home／End；只在焦點在選單項或選單本體時處理——期間選擇器的自訂區間有日期欄，欄位裡的方向鍵不可被吃掉。
 *   按住 Enter 開啟時，自動重複的 Enter 不可接著觸發剛拿到焦點的第一項（常是危險動作）。
 *
 * 不用 React Aria 的 Menu：它的 Popover 會把選單以外設成 inert、press 會 stopPropagation（見 primitives/dropdown-menu.tsx）。
 */
export function useDropdownMenu({ align, minWidth = 0, estimateHeight, remeasureKey }: {
  /** 選單對齊觸發鈕的哪一邊 */
  align: 'start' | 'end'
  minWidth?: number
  /** 首次定位用的估計高度（選單尚未掛載） */
  estimateHeight: () => number
  remeasureKey?: unknown
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<MenuPlacement | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const viaKeyboard = useRef(false)
  const estimateRef = useRef(estimateHeight)
  useEffect(() => { estimateRef.current = estimateHeight })

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return
    const menu = menuRef.current
    setPos(placeMenu({
      anchor: r, height: menu ? menu.scrollHeight : estimateRef.current(), viewport: windowViewport(),
      align, minWidth, menuWidth: menu?.offsetWidth ?? 0,
    }))
  }, [align, minWidth])

  const mounted = open && pos !== null
  const close = useCallback((returnFocus = true) => {
    setOpen(false)
    setPos(null)
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true })
  }, [])

  // 掛載後與內容變高時用實測高度校正
  useLayoutEffect(() => {
    if (mounted) place()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, remeasureKey])

  useEffect(() => {
    if (!open) return
    place()
    const onDown = (e: globalThis.MouseEvent) => {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) close(false)
    }
    // 焦點不在選單裡（停在觸發鈕）時的 Esc：capture 階段先接，否則較早註冊的 Modal document 監聽會先把對話框關掉（補審）。
    // 焦點在選單裡的交給 menuProps.onKeyDown（選單內元件可先用掉 Esc）
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!isCancelEscape(e) || e.defaultPrevented) return
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return
      e.preventDefault()
      close(true)
    }
    const onResize = () => close(false)
    const onScroll = (e: Event) => { if (!(e.target instanceof Node && menuRef.current?.contains(e.target))) close(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, place, close])

  // 只在掛上那一刻移一次焦點；之後選單內容變動（展開自訂區間）不可把焦點搶回來
  useEffect(() => {
    if (!mounted) return
    const menu = menuRef.current
    if (!menu) return
    if (!viaKeyboard.current) { menu.focus({ preventScroll: true }); return }
    const items = itemsOf(menu)
    focusItem(items.find(i => i.getAttribute('aria-checked') === 'true') ?? items[0])
  }, [mounted])

  /** 選了某一項：關閉；鍵盤選的焦點回觸發鈕 */
  const select = (e: MouseEvent) => close(e.detail === 0)

  const toggle = (e: MouseEvent) => {
    viaKeyboard.current = e.detail === 0
    setPos(null)
    setOpen(o => !o)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const menu = menuRef.current
    const target = e.target as HTMLElement
    // Esc 只收起選單：preventDefault 讓外層 Modal／面板（document 監聽、檢查 defaultPrevented）不跟著關（整包 review）。
    // React 的 handler 比 document 監聽先跑；選單內元件自己用掉的 Esc（已 preventDefault）不再處理
    if (isCancelEscape(e) && !e.defaultPrevented) { e.preventDefault(); close(true); return }
    if (!menu || (target !== menu && !target.matches(ITEM))) return
    // 按住 Enter 開啟：自動重複的 keydown 落在剛拿到焦點的項目上，按鈕的 Enter 會當成點擊
    if (e.repeat && (isSubmitEnter(e) || e.key === ' ')) { e.preventDefault(); return }
    // Shift+Tab 會回到觸發鈕（它在選單之前），onBlur 不把觸發鈕當外面（點觸發鈕本身要交給 toggle）→ 這裡直接關
    if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); close(true); return }
    const items = itemsOf(menu)
    if (items.length === 0) return
    const i = items.indexOf(target)
    const to = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? (i < 0 ? items.length - 1 : i - 1)
      : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : null
    if (to === null) return
    e.preventDefault()
    focusItem(items[(to + items.length) % items.length])
  }

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    // relatedTarget 為 null（點到不可聚焦處、Safari 點按鈕不給焦點）不關——點外面由 mousedown 處理
    const next = e.relatedTarget as Node | null
    if (next && !menuRef.current?.contains(next) && !triggerRef.current?.contains(next)) close(false)
  }

  const style: CSSProperties | undefined = pos ? {
    position: 'fixed', top: pos.top, minWidth: pos.width, zIndex: Z.menu,
    maxHeight: pos.maxH,
    ...(align === 'end' ? { right: pos.x } : { left: pos.x }),
  } : undefined

  return {
    // ref 另外回傳、由呼叫端解構成 `triggerRef`／`menuRef` 掛上（放在 props 物件裡，React Compiler 會判成 render 時讀 ref）
    open, mounted, triggerRef, menuRef, toggle, close, select,
    triggerProps: { 'aria-haspopup': 'menu' as const, 'aria-expanded': open },
    menuProps: {
      role: 'menu' as const,
      tabIndex: -1,
      'data-slot': 'dropdown-menu-content',
      onKeyDown,
      onBlur,
      // 放大動畫從觸發鈕那一角長出來（上游用 --trigger-anchor-point，我們自己定位所以照方向挑）
      className: cn(menuContentClassName, pos?.up
        ? (align === 'end' ? 'origin-bottom-right' : 'origin-bottom-left')
        : (align === 'end' ? 'origin-top-right' : 'origin-top-left')),
      style,
    },
  }
}

function itemsOf(menu: HTMLElement) {
  return [...menu.querySelectorAll<HTMLElement>(ITEM)]
}
/**
 * preventScroll（不讓外層捲動而觸發關閉）＋只捲選單本身，讓焦點列在短視窗下也看得到。
 * 不用 scrollIntoView：它也可能捲動選單的 DOM 祖先（表格、面板的捲動容器），外面一捲就觸發「捲動即關閉」（補審）。
 */
function focusItem(el: HTMLElement | undefined) {
  if (!el) return
  el.focus({ preventScroll: true })
  const menu = el.closest<HTMLElement>('[role="menu"]')
  if (!menu) return
  const top = el.getBoundingClientRect().top - menu.getBoundingClientRect().top + menu.scrollTop
  const PAD = 4
  if (top < menu.scrollTop + PAD) menu.scrollTop = top - PAD
  else if (top + el.offsetHeight > menu.scrollTop + menu.clientHeight - PAD) menu.scrollTop = top + el.offsetHeight - menu.clientHeight + PAD
}
