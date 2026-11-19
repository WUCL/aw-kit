// 2026-11-19 自 inknock `src/shared/ui/combobox.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { PlusIcon } from 'lucide-react'
import { Z } from './theme'
import { isCancelEscape, isImeComposing, isSubmitEnter } from './submit-enter'
import { cn } from './cn'
import { Input } from './input'
import { LinkButton } from './link-button'
import { placeMenu, visibleViewport, type MenuPlacement } from './menu-placement'
import { menuContentClassName, menuItemClassName, menuItemHintClassName } from './primitives/dropdown-menu'

/**
 * 搜尋選單（ComboBox，2026-11-16，ADR 0001 D4：長清單——客戶、品項——用可搜尋的選單）。
 * 使用者看比較頁 `tmp/combobox-compare.html` 確認：自己寫（不用 React Aria 的 ComboBox）、外觀與下拉選單同一套。
 *
 * 只管「輸入框＋浮出的清單」：搜什麼、怎麼搜、選了之後畫面長怎樣都由呼叫端決定
 * （客戶見 `features/customers/ui/customer-picker.tsx`；品項見 `features/inventory/ui/item-picker.tsx`——可直接用打的字，
 *  所以用 `showWhenEmpty`／`wrap`／`footer`／`onEnterWithoutActive`／`onEscape`／`onOpen`／`onClose`，2026-11-16 第 12 批）。
 *
 * - 焦點一直留在輸入框，`aria-activedescendant` 指向目前那一列（WAI-ARIA combobox 模式）；打字、↑↓、Enter 都在同一處。
 * - Enter／Esc 走 `isSubmitEnter`／`isCancelEscape`，注音選字（含 Safari 的 keyCode 229）不會誤選、誤關。
 * - 目前列只由 ↑↓ 設定，Enter 只選它；滑鼠滑過只上底色、並清掉鍵盤的目前列（畫面上永遠只有一列亮，Enter 選哪列不會看錯）。
 * - 清單開著時：Enter 不送出外層表單——有目前列就選它，沒有就呼叫 `onEnterWithoutActive`（沒給就什麼都不做）；
 *   Esc 只收清單——`preventDefault`，aw-kit 面板與 Modal 都依 `defaultPrevented` 略過，不會連面板一起關。
 *   「打開了但沒有可顯示的內容」時：給了 `onEnterWithoutActive`／`onEscape` 的那一鍵照樣攔下交給它（品項：仍在編輯中）。
 *   其餘情況（清單收起）兩者照常往外傳。
 * - 開關有 `onOpen`／`onClose` 兩個訊號（收起不論原因——選了、Enter、Esc、失焦——都會 onClose），呼叫端有自己的「編輯中」狀態就只看這兩個。
 * - 選取在 mousedown（並擋掉預設，輸入框不失焦）：iPad 點一下時輸入框可能先失焦、清單先收起，等到 click 就點不到了
 *   （ItemPicker 2026-08 起同一做法，已在 iPad 用過）。手指捲動清單不會觸發 mousedown，不會誤選。
 * - 清單掛在 body（portal）：側邊面板有 transform，fixed 定位放在面板裡會以面板為準而錯位。
 *   定位用 `menu-placement.ts`（與下拉選單同一支），可見範圍用 visualViewport——iPad 叫出鍵盤後不會開在鍵盤後面；
 *   上下都放不下時不蓋住輸入框（挑空間大的一邊、清單縮高捲動）。
 *   外面捲動、視窗或鍵盤改變大小時跟著輸入框重新定位（不像下拉選單直接關：iPad 叫出鍵盤時頁面本身就會捲動）。
 * - 層級在 Modal 之上（Z.modal＋2）：清單是輸入框的一部分，放在對話框裡也要看得到。
 */
export type ComboBoxStatus = 'idle' | 'loading' | 'ready' | 'error'

const NO_ACTIVE = { key: '', index: -1 }

export type ComboBoxProps<T> = {
  query: string
  onQueryChange: (q: string) => void
  /** 符合目前 query 的項目。⚠️ 必須與輸入框一致：換了 query 還沒搜完時給空陣列＋status 'loading'，不可留著上一次的結果（會選到別人） */
  items: T[]
  getKey: (item: T) => string
  getLabel: (item: T) => string
  /** 列右側的灰字（客戶的電話） */
  getHint?: (item: T) => string | null
  onSelect: (item: T) => void
  status?: ComboBoxStatus
  loadingText?: string
  /** null＝不顯示（品項：沒有結果時改由 footer 說「會照你打的名稱送出」） */
  emptyText?: string | null
  errorText?: string
  /** 清單最後一列的「新增」動作（例：建立「X」為新客戶），前面帶＋、以分隔線與項目隔開；有輸入且不在搜尋中、未失敗時才出現 */
  action?: { label: string; onSelect: () => void }
  /** 清單底部的灰字說明（例：結果被截斷時「只列出前 20 位」）；搜尋完成時出現（含「找不到」——篩掉後空了也可能還有更多） */
  footnote?: string
  /** 失敗時的「重試」：給了就在失敗訊息旁出現重試鈕（不必刪字重打） */
  onRetry?: () => void
  /** 沒打字也打開清單（品項：聚焦就列前幾筆） */
  showWhenEmpty?: boolean
  /** 列的主要內容（預設 getLabel；品項要在品名後接灰字規格） */
  renderLabel?: (item: T) => ReactNode
  /** 長名稱換行而不截斷（品項：截掉尾巴會分不出同系列不同品） */
  wrap?: boolean
  /** 清單底部的自訂內容（提示、說明），在 footnote 之下 */
  footer?: ReactNode
  /** 清單開著、沒有目前列時按 Enter（品項：就用打的字） */
  onEnterWithoutActive?: () => void
  /** 清單開著時按 Esc 收起（品項：放棄這次打的字） */
  onEscape?: () => void
  /** 清單從收起變成打開（聚焦、點一下、打字、↓）時通知——呼叫端有自己的「編輯中」狀態時（品項）用它對齊，不另外推算 */
  onOpen?: () => void
  /** 清單收起（選了、Enter、Esc、失焦，不論原因）時通知；在 onSelect／onEnterWithoutActive／onEscape／onBlur 之前呼叫 */
  onClose?: () => void
  onBlur?: () => void
  placeholder?: string
  /** 輸入框的無障礙名稱（沒有可見 label 時必給） */
  label?: string
  id?: string
  /** 必填：輸入框帶 aria-required（label 屬性會蓋過外層 <label for> 的「（必填）」，報讀改靠這個；第 13 批補審） */
  required?: boolean
  disabled?: boolean
  autoFocus?: boolean
  error?: boolean
}

export function ComboBox<T>({
  query, onQueryChange, items, getKey, getLabel, getHint, onSelect, status = 'ready',
  loadingText = '搜尋中…', emptyText = '找不到符合的項目', errorText = '搜尋失敗，請檢查網路後重試',
  action, footnote, onRetry, showWhenEmpty = false, renderLabel, wrap = false, footer, onEnterWithoutActive, onEscape, onOpen, onClose, onBlur, placeholder, label, id, required, disabled, autoFocus, error,
}: ComboBoxProps<T>) {
  const listId = useId()
  const anchorRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  // 目前列＝**只有鍵盤（↑↓）會設**，Enter 只選它。連同「是哪一份結果」一起記：結果換了（新的搜尋）就自動作廢——同一個位置已經是別人。
  // 滑鼠滑過只靠 CSS hover 上底色、不算目前列（review：游標剛好停在清單上，按 Enter 會選走滑過的那列而不是用打的字）
  const [activeAt, setActiveAt] = useState<{ key: string; index: number }>({ key: '', index: -1 })
  const [pos, setPos] = useState<MenuPlacement | null>(null)

  const hasQuery = query.trim() !== ''
  const showAction = !!action && hasQuery && status === 'ready'
  const rows = status === 'ready' ? items : []
  const count = rows.length + (showAction ? 1 : 0)
  const hasContent = rows.length > 0 || showAction || !!footer || !!footnote || status !== 'ready' || (emptyText !== null && hasQuery)
  const show = open && (hasQuery || showWhenEmpty) && !disabled && hasContent

  const itemsKey = rows.map(getKey).join('\n') + (showAction ? `\n+${query.trim()}` : '')
  const active = activeAt.key === itemsKey ? activeAt.index : -1
  const setActive = (next: (a: number) => number) => setActiveAt({ key: itemsKey, index: next(active) })

  const place = useCallback(() => {
    const r = anchorRef.current?.getBoundingClientRect()
    if (!r) return
    const list = listRef.current
    const next = placeMenu({ anchor: r, height: list ? list.scrollHeight : 0, viewport: visibleViewport(), align: 'start', menuWidth: list?.offsetWidth ?? 0, keepAnchorVisible: true })
    // 捲動時每一格都會呼叫：位置沒變就不更新，避免整個元件跟著重畫（review）
    setPos(prev => prev && prev.top === next.top && prev.x === next.x && prev.width === next.width && prev.maxH === next.maxH && prev.up === next.up ? prev : next)
  }, [])

  // 開啟、結果變了都重量一次
  useLayoutEffect(() => {
    if (show) place()
  }, [show, place, itemsKey, status])
  // 清單本身高度變了（footer 隨打的字增減提示、狀態列換字）也重量；只在真的變高變矮時才量，不是每個按鍵都量（review）。
  // flushSync：ResizeObserver 在繪製前通知，同步畫好新位置——否則往上開的清單變高時會有一格蓋住輸入框（補審）
  useEffect(() => {
    const list = listRef.current
    if (!show || !list || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => flushSync(place))
    ro.observe(list)
    return () => ro.disconnect()
  }, [show, place])

  useEffect(() => {
    if (!show) return
    // 捲動／鍵盤事件一格可能來好幾次：每個畫格只量一次（review）
    let frame = 0
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; place() }) }
    const onScroll = (e: Event) => { if (!(e.target instanceof Node && listRef.current?.contains(e.target))) schedule() }
    const vv = window.visualViewport
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', onScroll, true)
    vv?.addEventListener('resize', schedule)
    vv?.addEventListener('scroll', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', onScroll, true)
      vv?.removeEventListener('resize', schedule)
      vv?.removeEventListener('scroll', schedule)
    }
  }, [show, place])

  // 目前列捲進清單可見範圍（只捲清單本身，不用 scrollIntoView——它也會捲面板）
  useEffect(() => {
    const list = listRef.current
    const el = active >= 0 ? list?.querySelector<HTMLElement>(`[data-index="${active}"]`) : null
    if (!list || !el) return
    const top = el.offsetTop, PAD = 4
    if (top < list.scrollTop + PAD) list.scrollTop = top - PAD
    else if (top + el.offsetHeight > list.scrollTop + list.clientHeight - PAD) list.scrollTop = top + el.offsetHeight - list.clientHeight + PAD
  }, [active])

  // 打開／收起只走這兩支：打開時通知呼叫端；兩者都清掉目前列（review：重新聚焦後結果相同，舊的目前列會自己回來）
  function openList() {
    if (open) return
    setActiveAt(NO_ACTIVE)
    setOpen(true)
    onOpen?.()
  }
  function closeList() {
    setActiveAt(NO_ACTIVE)
    if (!open) return
    setOpen(false)
    onClose?.()
  }

  function choose(i: number) {
    if (i < 0 || i >= count) return
    closeList()
    if (i < rows.length) onSelect(rows[i]!) // 上一行已確認 i 在範圍內（noUncheckedIndexedAccess）
    else action?.onSelect()
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // 組字中的方向鍵是在選注音候選字，不是在移動清單（review：Enter／Esc 有排除、方向鍵漏了）
    if (isImeComposing(e)) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!hasQuery && !showWhenEmpty) return
      e.preventDefault()
      if (!show) { openList(); return }
      if (count === 0) return
      const down = e.key === 'ArrowDown'
      setActive(a => a < 0 ? (down ? 0 : count - 1) : (a + (down ? 1 : -1) + count) % count)
    } else if (isSubmitEnter(e) && (show || (open && onEnterWithoutActive))) {
      // 清單沒有可顯示的內容（例：品項沒有任何候選）但仍在編輯中：Enter 照樣走 onEnterWithoutActive，不送出外層表單
      e.preventDefault()
      if (e.repeat) return
      if (active >= 0) choose(active)
      // 搜尋失敗：Enter 就是重試——重試鈕在清單裡，焦點留在輸入框，Tab 過去清單就收起（整包 review）。
      // 有 onEnterWithoutActive（Enter＝採用打的字，例：品項）時它優先，斷線時仍能用 Enter 送出（補審）
      else if (status === 'error' && onRetry && !onEnterWithoutActive) onRetry()
      else if (onEnterWithoutActive) { closeList(); onEnterWithoutActive() }
    } else if (isCancelEscape(e) && (show || (open && onEscape))) {
      e.preventDefault()
      closeList()
      onEscape?.()
    }
  }

  const optionId = (i: number) => `${listId}-${i}`
  const status1 = (text: string, danger = false, retry?: () => void) => (
    <div className={cn('flex items-center gap-2 px-2.5 py-2.5 text-meta', danger ? 'text-danger-dark' : 'text-ink-faint')} role="status">
      <span className="min-w-0">{text}</span>
      {retry && !onEnterWithoutActive && <span className="sr-only">，按 Enter 重試</span>}
      {retry && <LinkButton className="hit-area ml-auto shrink-0" onClick={retry}>重試</LinkButton>}
    </div>
  )
  // 一般項目與「新增」動作列共用同一份選項行為（目前列、滑鼠、選取）；只差外觀（補審：原本兩份手抄）
  const option = (i: number, key: string, slot: string, extra: string | false, children: ReactNode) => (
    <div
      key={key}
      id={optionId(i)}
      data-index={i}
      role="option"
      aria-selected={active === i}
      data-slot={slot}
      className={cn(menuItemClassName, extra, active === i && 'bg-accent ring-2 ring-ring ring-inset')}
      // 滑鼠一動就交給滑鼠：清掉鍵盤的目前列，畫面上只剩 hover 那一列亮（補審：兩列同底色，分不清 Enter 選哪列）
      onMouseMove={() => { if (active >= 0) setActiveAt(NO_ACTIVE) }}
      onMouseDown={e => { if (e.button === 0) choose(i) }}
    >
      {children}
    </div>
  )

  return (
    <div ref={anchorRef}>
      <Input
        id={id}
        value={query}
        disabled={disabled}
        autoFocus={autoFocus}
        error={error}
        placeholder={placeholder}
        aria-label={label}
        aria-required={required || undefined}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={show ? listId : undefined}
        aria-activedescendant={show && active >= 0 ? optionId(active) : undefined}
        // 打字就清掉目前列：新結果即使與舊的一樣，也不可自己標回去（DESIGN.md「打字不會自動標第一列」；補審）
        // 先 openList 再 onQueryChange：呼叫端在 onOpen 裡預填的值要被這次打的字蓋過，不是反過來
        onChange={e => { setActiveAt(NO_ACTIVE); openList(); onQueryChange(e.target.value) }}
        onFocus={openList}
        // 按 Esc 收起後焦點還在輸入框，再點一下要能重新打開（review）
        onClick={openList}
        onBlur={() => { closeList(); onBlur?.() }}
        onKeyDown={onKeyDown}
      />
      {show && createPortal(
        <div
          ref={listRef}
          data-slot="combobox-content"
          className={cn(menuContentClassName, pos?.up ? 'origin-bottom-left' : 'origin-top-left')}
          style={{
            position: 'fixed', zIndex: Z.modal + 2,
            ...(pos ? { top: pos.top, left: pos.x, width: pos.width, maxHeight: pos.maxH } : { visibility: 'hidden', top: 0, left: 0 }),
          }}
          // 點清單任何地方都不讓輸入框失焦（失焦＝收起）
          onMouseDown={e => e.preventDefault()}
        >
          {status === 'loading' && status1(loadingText)}
          {status === 'error' && status1(errorText, true, onRetry)}
          {status === 'ready' && rows.length === 0 && emptyText !== null && hasQuery && status1(emptyText)}
          {/* listbox 裡只放選項（狀態文字、分隔線都不放進去：listbox 的子元素只能是 option） */}
          <div id={listId} role="listbox" aria-label={label}>
            {rows.map((item, i) => {
              const hint = getHint?.(item)
              return option(i, getKey(item), 'combobox-item', wrap && 'h-auto min-h-(--row-h-touch) py-2.5', <>
                <span className={wrap ? 'min-w-0 flex-1 break-words' : 'min-w-0 truncate'}>{renderLabel ? renderLabel(item) : getLabel(item)}</span>
                {/* 提示不縮、不換行（補審：長品名時「供應商・庫存 N」會被擠成兩三行） */}
                {hint && <span className={cn(menuItemHintClassName, 'shrink-0 whitespace-nowrap')}>{hint}</span>}
              </>)
            })}
            {showAction && option(rows.length, '\u0000action', 'combobox-action',
              // 與項目之間的分隔線畫在動作列自己身上（不另放一個非選項的子元素）
              cn('font-semibold text-link', rows.length > 0 && 'mt-2 before:absolute before:-inset-x-1 before:-top-1 before:h-px before:bg-border'),
              <><PlusIcon className="size-4 shrink-0" aria-hidden />{action.label}</>)}
          </div>
          {footnote && status === 'ready' && <div className="border-t border-border px-2.5 py-2 text-caption text-ink-faint">{footnote}</div>}
          {footer}
        </div>,
        document.body,
      )}
    </div>
  )
}
