import { useRef, useEffect, useContext, useMemo, useCallback, useReducer, useState } from 'react'
import { PanelCloseGuardContext, runCloseGuards } from './close-guard.js'
import { SlideOver, getPanelExitMs } from './SlideOver.jsx'
import { usePanelStack } from './use-panel.js'
import { PanelActionsContext } from './panel-context.js'
import { PanelHeader } from './PanelHeader.jsx'
import { PanelHeaderContext, PanelHeaderSlotContext } from './header-context.js'
import { useIsMobile, useReducedMotion } from './panel-config.js'

// PanelRenderProps（每個面板內容元件收到的統一 context）與 PanelRegistry（type → 內容元件）的型別見 index.d.ts。
// 巢狀開啟一律走 openPanel → Host push；back／closeAll 由 Host 提供。
// 資料新鮮度慣例：seed 只是「身分＋樂觀初繪」；內容元件掛載時要用 seed 的身分自己重查最新資料再覆蓋。
// 這讓「編輯整頁後瀏覽器返回、面板還原」自動顯示最新值，而 provider 維持純 UI 狀態。

// 每層一個 SlideOver、全部保留掛載（2026-10-15 翻案 ⑧）：下層不卸載，分頁／捲動／輸入自然保留。
// 關閉的層不立刻卸載：進 ghosts（open=false）等滑出動畫跑完才移除；期間保持同一個 React key，不重掛。
// 守門一層一組（Map<key, Set>）；單一 mutex 沿用（back／closeAll／Esc／遮罩／上一頁任何一條問守門期間，其他條一律視為不可關）。
// 移植自 inflorify（原出自 mh1491 PanelHost.jsx）。
export function PanelHost({ registry }) {
  const { stack } = usePanelStack()
  const actions = useContext(PanelActionsContext)
  const reduceMotion = useReducedMotion()
  const stackRef = useRef(stack)
  stackRef.current = stack
  const depth = stack.length

  // ghosts：剛離開堆疊、正在滑出的層。以「render 期間調整 state」推導（無 flicker：同一輪就補上，內容不會先卸載）
  const [prevStack, setPrevStack] = useState(stack)
  const [ghosts, setGhosts] = useState([])
  if (prevStack !== stack) {
    const live = new Set(stack.map(e => e.key))
    const gone = prevStack.map((entry, index) => ({ entry, index })).filter(g => !live.has(g.entry.key))
    setPrevStack(stack)
    setGhosts([...ghosts.filter(g => !live.has(g.entry.key)), ...gone])
  }
  const guardsMap = useRef(new Map())
  useEffect(() => {
    if (ghosts.length === 0) return
    const keys = ghosts.map(g => g.entry.key)
    const t = setTimeout(() => {
      setGhosts(gs => gs.filter(g => !keys.includes(g.entry.key)))
      keys.forEach(k => { if (!stackRef.current.some(e => e.key === k)) guardsMap.current.delete(k) })
    }, reduceMotion ? 0 : getPanelExitMs())
    return () => clearTimeout(t)
  }, [ghosts, reduceMotion])

  // body 捲動鎖只鎖一次：第一層開時鎖、全部（含滑出中）關完還原
  const anyLayer = depth > 0 || ghosts.length > 0
  useEffect(() => {
    if (!anyLayer) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [anyLayer])

  // 標題寫回 entry.title（直接 mutate；下一層頂列「‹ 來源名」讀它）
  const [, bumpTitle] = useReducer((n) => n + 1, 0)
  const setTitle = useCallback((key, title) => {
    const e = stackRef.current.find(x => x.key === key)
    if (!e || e.title === title) return
    e.title = title
    bumpTitle()   // 上一層頂列「‹ 來源名」讀它：標題變了要重繪（只在值真的改變時）
  }, [])
  const getGuards = useCallback((key) => {
    let g = guardsMap.current.get(key)
    if (!g) { g = new Set(); guardsMap.current.set(key, g) }
    return g
  }, [])

  // 單一共用 mutex（Codex 4-B 第 3 輪 P1-B）：back（Esc／點遮罩，depth>1）與 closeAll（內容的 closeAll、
  // depth===1 的預設關閉）若各用一把鎖，async 守門回覆前「back 一層」與「closeAll」會各自放行、跳過父層守門。
  // 所有關閉路徑共用這一把：任何一條在問守門期間，其他條一律視為不可關閉。
  // targetDepth＝關完後剩幾層；問所有 index >= targetDepth 的層（由上往下）。省略＝只問最上層。
  const transitioning = useRef(false)
  const canCloseTo = useCallback(async (targetDepth) => {
    if (transitioning.current) return false
    transitioning.current = true
    try {
      const s = stackRef.current
      const from = Math.max(0, Math.min(targetDepth ?? s.length - 1, s.length))
      const gs = []
      for (let i = s.length - 1; i >= from; i--) gs.push(...(guardsMap.current.get(s[i].key) ?? []))
      return await runCloseGuards(gs)
    } finally { transitioning.current = false }
  }, [])
  useEffect(() => { actions.registerGate(canCloseTo); return () => actions.registerGate(null) }, [actions, canCloseTo])
  // 守門放行後直接關。路由攔截（useBlocker）已排除面板自身的移動（isPanelOnlyNavigation），
  // 不再需要「放行後讓出一小段讓攔截重新登記」。重複關閉由 canCloseTo 的 transitioning mutex 擋。
  const runClose = useCallback(async (target, act) => {
    if (!(await canCloseTo(target))) return
    act()
  }, [canCloseTo])
  const guardedBack = useCallback(() => runClose(undefined, actions.back), [runClose, actions])
  const guardedCloseAll = useCallback(() => runClose(0, actions.closeAll), [runClose, actions])
  const closeTop = useCallback(() => { void (stackRef.current.length > 1 ? guardedBack() : guardedCloseAll()) }, [guardedBack, guardedCloseAll])

  // ghosts 排前面：同 index 的新層（剛關完又開）DOM 順序在後、疊在滑出中的舊層上
  const layers = [
    ...ghosts.map(g => ({ ...g, open: false })),
    ...stack.map((entry, index) => ({ entry, index, open: true })),
  ]
  return (
    <>
      {layers.map(l => (
        <HostLayer key={l.entry.key} entry={l.entry} index={l.index} open={l.open} isTop={l.open && l.index === depth - 1}
          backLabel={l.index > 0 ? (stackRef.current[l.index - 1]?.title || '返回') : undefined}
          registryEntry={registry[l.entry.type]} actions={actions} guards={getGuards(l.entry.key)} setTitle={setTitle}
          closeTop={closeTop} guardedBack={guardedBack} guardedCloseAll={guardedCloseAll} />
      ))}
    </>
  )
}

function HostLayer({ entry, index, open, isTop, backLabel, registryEntry, actions, guards, setTitle, closeTop, guardedBack, guardedCloseAll}) {
  const mobile = useIsMobile()
  const padX = mobile ? 'var(--aw-panel-pad-mobile)' : 'var(--aw-panel-pad)'
  const [hdr, setHdr] = useState(null)
  const [statusEl, setStatusEl] = useState(null)   // 本層標頭的狀態列容器（callback ref）；經 PanelHeaderSlotContext 給 PanelHeaderStatus
  const guardReg = useMemo(() => ({ add: (g) => { const w = () => g(); guards.add(w); return () => { guards.delete(w) } } }), [guards])
  const key = entry.key
  const hdrReg = useMemo(() => ({ set: (h) => { setTitle(key, h.title); setHdr(h) } }), [key, setTitle])
  const Content = registryEntry?.component
  // 滑出中（ghost）的層不再收新操作：內容的 back／closeAll 變成 no-op
  const onBack = () => { if (open) void guardedBack() }
  const onClose = () => { if (open) void guardedCloseAll() }
  return (
    <SlideOver open={open} index={index} isTop={isTop} ariaLabel={registryEntry?.ariaLabel ?? '詳情面板'} width={registryEntry?.width} onRequestClose={closeTop}>
      <PanelCloseGuardContext.Provider value={guardReg}><PanelHeaderContext.Provider value={hdrReg}><PanelHeaderSlotContext.Provider value={statusEl}><div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <PanelHeader title={hdr?.title ?? registryEntry?.ariaLabel ?? '詳情面板'} meta={hdr?.meta}
          backLabel={backLabel} onBack={onBack} onClose={backLabel !== undefined ? onBack : onClose} padX={padX} statusRef={setStatusEl} />
        {/* 內容區內距統一由殼給（內容元件不再自帶外層 padding）：桌機 24／手機 16 */}
        <div style={{ flex: 1, padding: padX }}>
          {Content
            ? <Content seed={entry.seed} openPanel={actions.openPanel} back={onBack} closeAll={onClose} canBack={backLabel !== undefined} />
            : <div style={{ fontSize: 'var(--aw-panel-body-size)', color: 'var(--aw-panel-danger)' }}>未註冊的面板型別：{entry.type}</div>}
        </div>
      </div></PanelHeaderSlotContext.Provider></PanelHeaderContext.Provider></PanelCloseGuardContext.Provider>
    </SlideOver>
  )
}
