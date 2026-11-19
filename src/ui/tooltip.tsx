// 2026-11-19 自 inknock `src/shared/ui/tooltip.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from './theme-context'
import type { Theme } from './theme'
import { INTERACTIVE_SELECTOR } from './interactive'

/**
 * 全站唯一的 hover tooltip——深色氣泡、下方置中、帶小三角。
 *
 * ⚠️ 2026-09-11 從 `Badge` 抽出：`CompletenessBar` 也需要同一種提示，
 * 原地再刻一份就是「同一種東西兩種畫法」。往後任何 hover 提示都走這支。
 *
 * 觸控（2026-11-15，使用者看原型選 C）：**點一下切換說明**（點別處或 4 秒後收起）；
 * 被點的東西本身或外層可點時（按鈕、連結、表單控制項、可聚焦的列…）不出說明，點擊交給它（列照樣開面板）。
 * ⚠️ **永遠不攔點擊**（不 stopPropagation／preventDefault，2026-11-15 補審）：可點的容器不一定有語意
 *    （佣金報表的設計師列是裸 `div onClick`），從 DOM 猜不全；攔了就會吃掉列的點擊、弄壞勾選框。
 *    猜漏的代價只剩「列打開時說明也短暫出現」。
 * 所以列表裡 Badge 的說明在 iPad 上看不到——提示內容只能是「錦上添花」，
 * 不可放只有觸控使用者拿不到就會卡住的必要資訊。
 * 滑鼠只認 pointerType=mouse 的進出：iOS 點擊會補發模擬的 mouseenter，舊寫法在 iPad 上會黏住。
 */
// 「可點的東西」的 selector 與 Pressable 共用一份（interactive.ts）
const INTERACTIVE_ANCESTOR = INTERACTIVE_SELECTOR

/** 泡泡外觀（全站唯一；銷售摘要的長條提示也用這份，改外觀只改這裡） */
export function tooltipBubbleStyle(T: Theme): CSSProperties {
  return {
    background: T.inkSurface,
    color: '#FFFFFF',
    // 2026-11-15 外觀微調（使用者確認原型）：圓角 6 → 8（rounded.md）、左右 10 → 12（shadcn px-3）
    padding: '6px 12px',
    borderRadius: T.radius.md,
    fontSize: T.fontSize.caption,
    fontWeight: T.fontWeight.medium,
    boxShadow: T.shadow.menu,
    pointerEvents: 'none',
    lineHeight: T.lineHeight.title,
  }
}

export function Tooltip({ text, children, style, open }: {
  text: string; children: ReactNode; style?: CSSProperties
  /** 受控模式（給 InfoTip 的「點開」用）：有值就以它為準，不再吃 hover。 */
  open?: boolean
}) {
  const T = useTheme()
  // 誰打開的：滑鼠移入、或觸控點擊（觸控才有「點別處／4 秒收起」）。用狀態而非 ref：
  // 觸控開著時滑鼠移入（iPad 接觸控板）要讓收起計時跟著取消（2026-11-15 補審）
  const [openBy, setOpenBy] = useState<'mouse' | 'touch' | null>(null)
  const controlled = open !== undefined
  const hover = controlled ? open : openBy !== null
  const lastPointer = useRef<string>('mouse')
  // ⚠️ 泡泡**必須畫在 body**（2026-09-21 使用者截圖：面板左緣把它切掉一半）。
  // 原本是 `position: absolute` 疊在觸發點旁，於是被祖先的捲動容器／側邊面板裁切——
  // 那不是 z-index 的問題，提高 z-index 也救不了被 `overflow` 切掉的東西。
  // 改成 portal 到 body ＋ `position: fixed`，再依觸發點的 rect 定位並夾回視窗內。
  const anchorRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; arrow: number; flipped: boolean } | null>(null)

  // ⚠️ 2026-09-22 Codex review 抓到兩個缺口：
  // ① 原本只在 hover 開始那一刻量一次，捲動 SidePanel 內容或縮放視窗後，
  //    fixed 定位的泡泡不會跟著觸發點移動，漂離原本指的東西。
  // ② 觸發點貼近視窗底部時，泡泡永遠往下開，會被下緣裁掉——需要往上翻。
  // 改成一個 `measure` 函式，量測時機從「hover/text 改變」擴大到「捲動／resize」，
  // 且垂直方向改成有空間就往下、沒空間就往上翻（三角跟著換邊）。
  useLayoutEffect(() => {
    // 移開就立刻收掉泡泡（layout effect、畫面更新前）；既有寫法，inknock 為 warn 級，2026-11-19 搬入時原樣保留
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 見上
    if (!hover) { setPos(null); return }
    const measure = () => {
      const a = anchorRef.current
      const b = bubbleRef.current
      if (!a || !b) return
      const M = 8
      const ar = a.getBoundingClientRect()
      const br = b.getBoundingClientRect()
      const centre = ar.left + ar.width / 2
      const half = br.width / 2
      const left = Math.min(Math.max(centre - half, M), window.innerWidth - br.width - M)
      const spaceBelow = window.innerHeight - ar.bottom - M
      const flip = spaceBelow < br.height && ar.top > br.height + M
      const top = flip ? ar.top - br.height - M : ar.bottom + M
      setPos({ top, left, arrow: centre - left, flipped: flip })
    }
    measure()
    // capture:true 才能收到「面板內容捲動」這類發生在祖先容器上的 scroll 事件
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [hover, text])

  // 觸控開啟後：點別處或 4 秒收起（滑鼠開的由 pointerleave 收）
  useEffect(() => {
    if (openBy !== 'touch') return
    const close = (e: PointerEvent) => {
      if (!anchorRef.current?.contains(e.target as Node)) setOpenBy(null)
    }
    const t = window.setTimeout(() => setOpenBy(null), 4000)
    document.addEventListener('pointerdown', close, true)
    return () => { document.removeEventListener('pointerdown', close, true); window.clearTimeout(t) }
  }, [openBy])

  const onTap = (e: MouseEvent<HTMLSpanElement>) => {
    // 鍵盤觸發的 click（detail 0）不是點擊；被點的東西本身或外層可點時不出說明（從 target 往上找，觸發點內外都涵蓋）。
    // 不 stopPropagation／preventDefault：點擊一律照常往上傳（見檔頭）
    if (controlled || lastPointer.current === 'mouse' || e.detail === 0) return
    // 點到可點的東西：不出說明；已開著的順手收起（點觸發點內的按鈕後不該留著泡泡）
    if ((e.target as Element).closest(INTERACTIVE_ANCESTOR)) { setOpenBy(null); return }
    // 開著就收（不論是滑鼠還是觸控開的：iPad 接觸控板時游標停著、手指點一下要能關）
    setOpenBy(o => (o === null ? 'touch' : null))
  }

  return (
    <span
      ref={anchorRef}
      // 預設 inline-flex＋content-size（適合包一個 badge／文字）；呼叫端可用 `style`
      // 覆寫（例如包一個要滿寬的區塊），見 CompletenessBar。
      style={{ position: 'relative', display: 'inline-flex', ...style }}
      onPointerDown={e => { lastPointer.current = e.pointerType }}
      onPointerEnter={controlled ? undefined : e => { lastPointer.current = e.pointerType; if (e.pointerType === 'mouse') setOpenBy('mouse') }}
      onPointerLeave={controlled ? undefined : e => { if (e.pointerType === 'mouse') setOpenBy(null) }}
      onClick={onTap}
    >
      {children}
      {hover && createPortal(
        <span
          ref={bubbleRef}
          role="tooltip"
          className="animate-in fade-in-0 duration-100"
          style={{
            position: 'fixed',
            // 量測前先畫在視窗外，避免第一幀閃一下在左上角
            top: pos ? pos.top : -9999,
            left: pos ? pos.left : -9999,
            ...tooltipBubbleStyle(T),
            // 不可用 `nowrap`：長提示會衝出螢幕。`max-content` 讓短句仍是一行，`maxWidth` 才是斷行的閘門。
            whiteSpace: 'normal',
            width: 'max-content',
            maxWidth: 260,
            textAlign: 'center',
            zIndex: T.z.menu,
          }}
        >
          {text}
          <span
            style={{
              position: 'absolute',
              // 翻到上方時，三角改貼泡泡下緣指回觸發點（下緣中心朝下才會被裁一半）
              ...(pos?.flipped ? { bottom: -3 } : { top: -3 }),
              // 三角指回觸發點：泡泡被夾回視窗內之後，它不一定還在正中央
              left: pos ? pos.arrow : '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8,
              height: 8,
              background: T.inkSurface,
            }}
          />
        </span>,
        document.body,
      )}
    </span>
  )
}
