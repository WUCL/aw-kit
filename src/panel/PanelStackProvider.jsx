import { useReducer, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react'
import { panelReducer, makeEntry, atMaxDepth } from './panel-stack.js'
import { awPanelOf } from './panel-navigation.js'
import { PanelStateContext, PanelActionsContext } from './panel-context.js'
import { PanelConfigContext, DEFAULT_Z_BASE, DEFAULT_MOBILE_QUERY } from './panel-config.js'

// 移植自 inflorify（原出自 mh1491 PanelStackProvider.jsx）。必須跑在 data router／Router 之下（經 `router` prop 注入 useLocation／useNavigate／useNavigationType，aw-kit 不 import 任何 router）。
//
// 【瀏覽器上一頁＝關最上層面板，不改網址】
// 每開一層（ownsHistory 預設 true）用 router 的 navigate(同網址, { state: { ...舊 state, awPanel: 深度 } }) 推一筆紀錄。
// 為什麼不用 window.history.pushState：實測（router v6.30、createBrowserRouter）它會把 router 存在 history.state 的
// {usr,key,idx} 整個覆蓋掉，之後 POP 的 key／idx（useBlocker 靠 idx 算 delta）全部錯亂；navigate 則保留三者且 POP 能讀回 state。
//
// 關閉路徑（單一路徑）：
// - 守門永遠先問（PanelHost 的 canClose，Esc／遮罩／✕／closeAll 都經過；不然紀錄先退掉、使用者選「留下」還得補推）。
// - 通過後 back()／closeAll() 若該層有自己的紀錄，不直接改堆疊，而是 navigate(-n)，由 POP 處理去關（expectedRef 旗標：
//   POP 到來時直接依預期深度關、不再問守門；旗標存在期間重複的 back／closeAll 一律忽略，避免連點多退一層）。
// - 使用者按瀏覽器上一頁（非預期 POP）：目標深度 = 該紀錄的 awPanel（無標記＝0，或帶網址第一層自己的紀錄＝1）。
//   比目前淺 → 問守門；通過就關到目標，拒絕就把被退掉的紀錄補推回去（讓下次上一頁仍會問）。
// - 整頁跳轉（PUSH 無標記、且不是同一個 location 內剛開的層）→ closeAll，不呼叫 onClosed；舊紀錄不會成為孤兒：
//   往回按會落在帶 awPanel 的紀錄上，由下方快照還原把當時的堆疊原樣重開，深度與紀錄一致。
const awOf = awPanelOf
const GUARD_FLAG_MS = 1000
/**
 * 快照只留「純身分 seed」的層：seed 帶回呼（函式）代表綁在已卸載的頁面實例上，還原後存檔不會更新新頁的清單。
 * 取捨：寧可少還原（回到頁面時該層不重開，使用者再點一次），不還原會靜默失效的層。
 * 從第一個含回呼的層起（含其上各層，避免孤兒）一律不留；網址第一層（ownsHistory:false）由頁面依 param 重開，不受此限。
 */
const hasCallback = (seed) => !!seed && typeof seed === 'object' && Object.values(seed).some(v => typeof v === 'function')
const restorablePrefix = (stack) => {
  const i = stack.findIndex((e, idx) => !(idx === 0 && !e.ownsHistory) && hasCallback(e.seed))
  return i < 0 ? stack : stack.slice(0, i)
}
/** 把 pathname+search+hash 字串還原成 Location（state 清空，補推用） */
const locOf = (url, base) => {
  const q = url.indexOf('?'), h = url.indexOf('#')
  const cut = [q, h].filter(i => i >= 0).sort((a, b) => a - b)[0] ?? url.length
  return { ...base, pathname: url.slice(0, cut), search: q >= 0 ? url.slice(q, h > q ? h : undefined) : '', hash: h >= 0 ? url.slice(h) : '', state: null }
}

export function PanelStackProvider({ children, router, zBase = DEFAULT_Z_BASE, mobileQuery = DEFAULT_MOBILE_QUERY, onMaxDepth }) {
  if (!router) throw new Error('<PanelStackProvider> 需要 router prop：{ useLocation, useNavigate, useNavigationType }')
  const { useLocation, useNavigate, useNavigationType } = router
  const [stack, dispatch] = useReducer(panelReducer, [])
  const stackRef = useRef(stack)
  // 不可在 effect 裡回寫 stackRef.current = stack：子元件 effect 先於本元件 effect 執行，
  // 同一輪 commit 內子元件 apply 的新堆疊會被這裡用舊 render 的 stack 蓋掉（連開兩層會丟一層）。
  // 所有寫入一律經 apply，stackRef 由 apply 同步維護。
  // 同一輪內連續 openPanel／關閉要看得到最新堆疊：動作先套到 ref 再 dispatch
  const apply = useCallback((a) => { stackRef.current = panelReducer(stackRef.current, a); dispatch(a) }, [])

  const location = useLocation()
  const navType = useNavigationType()
  const navigate = useNavigate()
  const locRef = useRef(location)
  // layout effect：頁面（子層）在 push 網址參數後的 passive effect 內 openPanel，要讀到「新」location.key；
  // 若用 passive effect，子層 effect 先於 Provider 跑，會拿到舊 key → 被下方 PUSH→closeAll 立刻關掉。
  useLayoutEffect(() => { locRef.current = location })
  const gateRef = useRef(null)
  const expectedRef = useRef(null)
  const mountedRef = useRef(false)
  const expectedTimer = useRef(null)
  const restoringUrlRef = useRef(false)   // 守門拒絕後補推網址中：這次 PUSH 不是整頁跳轉、也不存快照
  const registerGate = useCallback((g) => { gateRef.current = g }, [])

  const pushRecord = useCallback((loc, depth) => {
    navigate({ pathname: loc.pathname, search: loc.search, hash: loc.hash }, { state: { ...loc.state, awPanel: depth } })
  }, [navigate])

  const removeTo = useCallback((depth, notify = true) => {
    const removed = stackRef.current.slice(depth)
    if (removed.length === 0) return
    apply({ type: 'closeTo', depth })
    if (notify) removed.forEach(e => e.onClosed?.())
  }, [apply])

  const goBack = useCallback((n, targetDepth) => {
    if (expectedTimer.current) clearTimeout(expectedTimer.current)
    expectedRef.current = targetDepth
    expectedTimer.current = setTimeout(() => { expectedRef.current = null }, GUARD_FLAG_MS)   // 保險：POP 沒來也不鎖死
    void navigate(-n)
  }, [navigate])
  useEffect(() => () => { if (expectedTimer.current) clearTimeout(expectedTimer.current) }, [])

  const openPanel = useCallback((type, seed, opts) => {
    if (atMaxDepth(stackRef.current)) { onMaxDepth?.(); return }
    const loc = locRef.current
    const owns = opts?.ownsHistory !== false
    apply({ type: 'open', entry: makeEntry(type, seed, { ownsHistory: owns, onClosed: opts?.onClosed, openedAtKey: loc.key, openedAtPath: loc.pathname, openedAtUrl: loc.pathname + loc.search + loc.hash }) })
    if (owns) pushRecord(loc, stackRef.current.length)
    // 2026-10-15 翻案 ⑧：下層保持掛載，疊新層不會丟資料，故不再先問下層守門（守門只在「關」時問）。
  }, [apply, pushRecord, onMaxDepth])

  // back／closeAll 是「守門已通過」之後的動作（PanelHost 負責先問）
  const back = useCallback(() => {
    if (expectedRef.current !== null) return
    const s = stackRef.current
    const top = s[s.length - 1]
    if (!top) return
    if (top.ownsHistory) goBack(1, s.length - 1)
    else removeTo(s.length - 1)
  }, [goBack, removeTo])
  const closeAll = useCallback(() => {
    if (expectedRef.current !== null) return false   // 返回進行中：忽略
    const s = stackRef.current
    if (s.length === 0) return true
    const owned = s.filter(e => e.ownsHistory).length
    if (owned > 0) goBack(owned, 0)
    else removeTo(0)
    return true
  }, [goBack, removeTo])

  const dismissAll = useCallback(async (onAllowed) => {
    const s = stackRef.current
    if (s.length === 0) { onAllowed?.(); return true }
    const ok = gateRef.current ? await gateRef.current(0) : true
    if (!ok) {
      // 拒絕：頁面已把 param 拿掉，補回原網址（replace，不多一筆紀錄），保留目前層數的標記
      const first = stackRef.current[0]
      if (first) {
        const o = locOf(first.replacedFrom ?? first.openedAtUrl, locRef.current)
        const d = stackRef.current.length
        void navigate({ pathname: o.pathname, search: o.search, hash: o.hash }, { replace: true, state: d > 1 ? { awPanel: d } : null })
      }
      return false
    }
    onAllowed?.()
    removeTo(0)
    return true
  }, [navigate, removeTo])
  const actions = useMemo(() => ({ openPanel, back, closeAll, dismissAll, registerGate }), [openPanel, back, closeAll, dismissAll, registerGate])
  const state = useMemo(() => ({ stack, dispatch }), [stack])

  // 面板返回還原：從面板整頁跳轉（PUSH）時，用「改變前」的 location.key 存當時的非空堆疊；
  // 瀏覽器返回（POP）回到那個 key、且目前堆疊為空時，把快照原樣重開。
  // 為什麼不能直接讀當下的 location.key：navigate() 是立即的 PUSH，effect 跑到時 key 已經是新頁的了，
  // 所以用 prevKeyRef／prevStackRef 記「上一輪 render 看到的」那組，key 變動時才回頭存舊的。
  // 還原只是重開快照（內容元件重新掛載）；資料新鮮度由各內容元件自己以 seed 身分重查——
  // provider 是純 UI 狀態，永不碰資料庫。
  const snapshots = useRef(new Map())
  const prevLocRef = useRef(location)
  const prevStackRef = useRef(stack)
  // 快照的第一層若是網址層（ownsHistory:false），交給頁面依 param 重開，快照只還原其上的層（等第一層重開後才接上）。
  // 否則頁面 useUrlPanel 與快照各開一份，出現兩層一樣的面板。
  const pendingRestore = useRef(null)

  useEffect(() => {
    const prev = prevLocRef.current
    if (location.key !== prev.key) {
      // 面板自己的歷史（同頁、awPanel 變動）不是整頁跳轉，不存快照；否則關掉的層會被舊快照復活
      const internal = location.pathname === prev.pathname && awOf(location) !== awOf(prev)
      // 空堆疊要刪舊快照：還原後使用者關掉面板、再前進→返回，否則已關閉的面板會從舊快照復活
      pendingRestore.current = null
      // 頁面以 replace 改 search（例：StaffPanel 切 ?tab=）：開在舊網址的層，「開啟網址」跟著換；
      // 否則上一頁時 openedAtUrl 對不上目前網址，網址第一層被誤判成已退掉而連關。
      if (navType === 'REPLACE' && location.pathname === prev.pathname) {
        const from = prev.pathname + prev.search + prev.hash
        const to = location.pathname + location.search + location.hash
        stackRef.current.forEach(e => { if (e.openedAtUrl === from) { e.replacedFrom = e.replacedFrom ?? from; e.openedAtUrl = to } })
      }
      if (!internal && !restoringUrlRef.current) {
        const snap = restorablePrefix(prevStackRef.current)
        if (snap.length > 0) snapshots.current.set(prev.key, snap)
        else snapshots.current.delete(prev.key)
      }
      prevLocRef.current = location
    }
    prevStackRef.current = stack
  }, [location, stack]) // eslint-disable-line react-hooks/exhaustive-deps

  // 整頁跳轉（PUSH）自動清空面板。只認 PUSH：REPLACE 多半是清單頁正規化 search params，面板不該因此關掉；POP 走下面。
  // 忽略兩種 PUSH：① 自己推的 awPanel 紀錄 ② 這個 location 內剛開的層（頁面 setSearchParams 推 ?tx 後在 effect 才 openPanel，
  // 子層 effect 先於 Provider effect，不排除會被這裡立刻關掉）。整頁跳轉造成的關閉不呼叫 onClosed（頁面已離開，別去改新頁網址）。
  useEffect(() => {
    if (restoringUrlRef.current && navType === 'PUSH') {
      restoringUrlRef.current = false
      stackRef.current.forEach(e => { e.openedAtKey = location.key })   // 補回的網址是新紀錄：各層「開啟位置」跟著換
      return
    }
    if (navType !== 'PUSH' || awOf(location) !== 0) return
    const s = stackRef.current
    if (s.length === 0 || s.every(e => e.openedAtKey === location.key)) return
    apply({ type: 'closeAll' })
  }, [location, navType, apply])

  const attachPending = useCallback(() => {
    const p = pendingRestore.current
    const s = stackRef.current
    if (!p || p.key !== locRef.current.key || s.length !== 1 || s[0].ownsHistory) return
    pendingRestore.current = null
    snapshots.current.delete(p.key)
    apply({ type: 'restore', stack: [s[0], ...p.rest] })
  }, [apply])
  useEffect(() => {
    if (navType !== 'POP') return
    const snap = snapshots.current.get(location.key)
    if (stackRef.current.length > 0) {
      // 頁面在同一輪已依 param 重開第一層：接上快照其上的層
      if (snap && snap.length > 1 && !snap[0].ownsHistory && stackRef.current.length === 1) { pendingRestore.current = { key: location.key, rest: snap.slice(1) }; attachPending() }
      return   // 面板還開著（同頁巢狀）不需還原
    }
    if (!snap || snap.length === 0) return
    if (!snap[0].ownsHistory) {
      if (snap.length > 1) pendingRestore.current = { key: location.key, rest: snap.slice(1) }   // 等頁面重開第一層
      return
    }
    snapshots.current.delete(location.key)
    apply({ type: 'restore', stack: snap })
  }, [location.key, navType, apply, attachPending]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { attachPending() }, [stack, attachPending])

  // POP：自己發的 navigate(-n)（expectedRef）直接關；使用者按瀏覽器上一頁／下一頁則依 awPanel 判斷
  useEffect(() => {
    if (navType !== 'POP') return
    const s = stackRef.current
    if (expectedRef.current !== null) {
      const t = expectedRef.current
      expectedRef.current = null
      if (expectedTimer.current) clearTimeout(expectedTimer.current)
      removeTo(t)
      return
    }
    if (s.length === 0) {
      // 空堆疊：有快照由還原 effect 重開；沒有快照卻落在 awPanel 紀錄＝下一頁走進已關掉層的舊紀錄，退回去
      // （首次載入／重新整理的初始 POP 不算：沒有「上一筆」可退，留一筆死紀錄是已知限制）
      if (!mountedRef.current) { mountedRef.current = true; return }
      if (awOf(location) > 0 && !snapshots.current.get(location.key)?.length) void navigate(-1)
      return
    }
    mountedRef.current = true
    if (location.pathname !== s[0].openedAtPath) {
      // 跨頁 POP：殼不跟著去別頁，但清堆疊前要先問守門（dirty 的班表等）；拒絕＝補推回原網址與各層紀錄，通過才關（會呼叫各層 onClosed）
      void (async () => {
        const depth = s.length
        const ok = gateRef.current ? await gateRef.current(0) : true
        if (ok) { removeTo(0); return }
        const first = s[0]
        const orig = locOf(first.openedAtUrl, location)
        restoringUrlRef.current = true
        void navigate({ pathname: orig.pathname, search: orig.search, hash: orig.hash })
        for (let d = first.ownsHistory ? 1 : 2; d <= depth; d++) pushRecord(orig, d)
      })()
      return
    }
    const marker = awOf(location)
    // 以網址（而非 location.key）判斷：快照還原後第一層是在「帶 awPanel 的同網址紀錄」上重開的，key 與原本那筆不同
    const curUrl = location.pathname + location.search + location.hash
    const firstIsUrlLayer = !s[0].ownsHistory && s[0].openedAtUrl === curUrl
    const target = marker > 0 ? marker : firstIsUrlLayer ? 1 : 0
    const depth = s.length
    if (target === depth) return
    if (target > depth) { void navigate(-1); return }   // 下一頁走進已關閉層的舊紀錄：退回去，不憑空重開
    void (async () => {
      const ok = gateRef.current ? await gateRef.current(target) : true
      if (ok) { removeTo(target); return }
      // 守門拒絕（使用者選留下）：把被退掉的紀錄補推回去，下次上一頁仍會問
      const first = s[0]
      if (!first.ownsHistory && first.openedAtUrl !== curUrl) {
        // 網址第一層的 param 被這次上一頁退掉了：重推原網址補回 param（狀態不帶 awPanel），再補推其上各層自己的紀錄
        const orig = locOf(first.openedAtUrl, location)
        restoringUrlRef.current = true
        if (depth < 2) void navigate({ pathname: orig.pathname, search: orig.search, hash: orig.hash })
        for (let d = Math.max(target, 1) + 1; d <= depth; d++) pushRecord(orig, d)
        return
      }
      for (let d = target + 1; d <= depth; d++) pushRecord(location, d)
    })()
  }, [location.key, navType]) // eslint-disable-line react-hooks/exhaustive-deps

  const config = useMemo(() => ({ router, zBase, mobileQuery, onMaxDepth }), [router, zBase, mobileQuery, onMaxDepth])
  return (
    <PanelConfigContext.Provider value={config}>
      <PanelStateContext.Provider value={state}>
        <PanelActionsContext.Provider value={actions}>{children}</PanelActionsContext.Provider>
      </PanelStateContext.Provider>
    </PanelConfigContext.Provider>
  )
}
