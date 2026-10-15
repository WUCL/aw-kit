import { useEffect, useRef } from 'react'
import { usePanel } from './use-panel.js'
import { usePanelConfig } from './panel-config.js'
import { withPanelNavigationAllowed } from './panel-navigation.js'

/**
 * 「網址參數是真相」的第一層面板（?tx／?category／?designer／?customer）。
 * 頁面把 search param 算成 target（有值＝要開）；param 消失（例如外部改網址）時面板跟著關。
 * 殼關閉第一層（✕／縫隙／Esc／上一頁）時呼叫 onClosed，由頁面清 param（replace）。
 * 第一層 ownsHistory:false：param 本身已是一筆瀏覽器紀錄，殼不額外推。
 * 同一 key 不重開（seed 是開啟當下的快照，身分以 key 為準）。
 * 注意：不在 unmount 時關——整頁跳轉由 Provider 的 PUSH→closeAll 處理，這裡再 closeAll 會把巢狀層的紀錄 navigate(-n) 退掉。
 */
export function useUrlPanel(type, target, onClosed) {
  const panel = usePanel()
  const panelRef = useRef(panel)
  const onClosedRef = useRef(onClosed)
  const seedRef = useRef(target?.seed)
  const tokenRef = useRef(null)
  const openKeyRef = useRef(null)
  const navType = usePanelConfig().router.useNavigationType()
  const navTypeRef = useRef(navType)
  useEffect(() => { panelRef.current = panel; onClosedRef.current = onClosed; seedRef.current = target?.seed; navTypeRef.current = navType })
  const key = target?.key ?? null
  useEffect(() => {
    if (key === null) {
      // 瀏覽器上一頁（POP）退掉 param：交給 Provider 的 POP 處理（先問守門；拒絕則補回網址），這裡不可直接關
      if (tokenRef.current && navTypeRef.current === 'POP') return
      if (tokenRef.current) {
        // 頁面自己移除 param：經守門關閉（不用 closeAll 的 navigate(-n)，那會退回仍帶 param 的紀錄 → 重開閃爍）。
        // 通過才清 token（殼回呼的 onClosed 會被忽略，param 已不在）；拒絕則殼把網址補回，token 保留＝面板續開。
        const token = tokenRef.current
        void panelRef.current.dismissAll(() => { if (tokenRef.current === token) tokenRef.current = null })
      }
      return
    }
    if (tokenRef.current && openKeyRef.current === key) return   // 守門拒絕後 Provider 把網址補回：同一目標，面板還開著
    if (tokenRef.current) { tokenRef.current = null; panelRef.current.closeAll() }     // 換了目標：先關舊的
    const token = {}
    tokenRef.current = token
    openKeyRef.current = key
    panelRef.current.openPanel(type, seedRef.current, {
      ownsHistory: false,
      onClosed: () => { if (tokenRef.current !== token) return; tokenRef.current = null; withPanelNavigationAllowed(() => onClosedRef.current()) },
    })
  }, [key, type])
}
