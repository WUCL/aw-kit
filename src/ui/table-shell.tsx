// 2026-11-19 自 inknock `src/shared/ui/table-shell.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import type { ReactNode } from 'react'
import { useTheme } from './theme-context'
import { useIsMobile } from './breakpoints'

interface TableShellProps {
  /** 檢視分頁（`<Tabs>`）。渲染在工具列之上，下緣一條髮絲線 */
  tabs?: ReactNode
  /** 常駐的篩選列。給 null 則不渲染工具列（純表格容器） */
  toolbar?: ReactNode
  /**
   * 收合的第二列（搜尋、日期區間等不常用的條件）。
   * 由呼叫端控制展開與否——傳 `null` 就是收起來。
   */
  toolbarExtra?: ReactNode
  children: ReactNode
}

/**
 * 表格外殼 — 篩選列與列表共用同一個容器邊界。
 *
 * 為什麼要有這個元件（2026-08-26 使用者拍板做法 B）：
 * 篩選列若自己浮在頁面上，畫面上會出現三個各自獨立的區塊
 * （快篩／搜尋／表格），但它們其實是一件事——「篩選這張表」。
 * 共用一個外框之後，那份關聯由版面直接說出來。
 *
 * ⚠️ **桌機與手機共用同一個容器**（2026-08-26 依 Polaris 實證修訂）。
 * 先前這裡為手機寫了獨立分支，是因為當時手機主體是「一堆各自有外框的卡片」，
 * 塞進同一個框會變成雙層框。查證 Polaris `IndexTable` 的 condensed 模式後
 * 確認：Shopify 在窄螢幕只是把 `<table>` 換成 `<ul>`（`Row.tsx:191`），
 * **沒有卡片外框、沒有圓角、沒有陰影**，容器語言與桌機完全相同。
 * 改由 `DataTable` 自己處理 condensed 之後，這裡的手機分支就不需要了——
 * 少一種容器語言，也少一處會分岔的地方。
 */
export function TableShell({ tabs, toolbar, toolbarExtra, children }: TableShellProps) {
  const T = useTheme()
  const isMobile = useIsMobile()

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.lineStrong}`,
        borderRadius: T.radius.xl,
        boxShadow: T.shadow.card,
        overflow: 'hidden',
      }}
    >
      {tabs && <div style={{ borderBottom: `1px solid ${T.line}` }}>{tabs}</div>}

      {toolbar && (
        <div style={{ borderBottom: `1px solid ${T.line}` }}>
          <div
            style={{
              padding: isMobile ? '12px 14px' : '14px 16px',
              display: 'flex',
              gap: T.gap.inline,
              alignItems: 'center',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
              // 手機上條件會擠爆一列，改成可橫向捲動而不是換行——換行會讓
              // 工具列高度隨篩選數量跳動，列表的起始位置跟著上下移動。
              overflowX: isMobile ? 'auto' : 'visible',
            }}
            className={isMobile ? 'hide-scrollbar' : undefined}
          >
            {toolbar}
          </div>
        </div>
      )}

      {toolbarExtra && (
        <div
          style={{
            borderBottom: `1px solid ${T.line}`,
            padding: isMobile ? '12px 14px' : '14px 16px',
            display: 'flex',
            gap: T.gap.inline,
            alignItems: 'center',
            // 展開列**不橫向捲動**：它裝的是搜尋框這類「要打字」的控制項，
            // 藏在捲動區外等於不存在。寬度不夠就換行。
            flexWrap: 'wrap',
          }}
        >
          {toolbarExtra}
        </div>
      )}

      {children}
    </div>
  )
}
