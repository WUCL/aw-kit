// 2026-11-19 自 inknock `src/shared/ui/use-collapsible-search.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useState, type ReactNode } from 'react'
import { FilterToggle } from './filter-toggle'
import { Input } from './input'

/**
 * 清單頁「收合搜尋」的共用狀態機。客戶／商品／交易三個清單頁原本各自複製一份
 * 完全相同的 `useState(false)` + `FilterToggle` + `Input` 組裝（2026-09-25 使用者
 * 指出「各自模組化」讓人混亂，要求收斂）。領料單頁沒有搜尋，不用這支。
 *
 * `toggle` 放進常駐工具列（通常最右側）；`extra` 餵給 `<TableShell toolbarExtra>`——
 * 兩者仍是分開的兩個插入點，因為 `TableShell` 本身把「常駐列」與「展開列」
 * 設計成兩條不同 border-bottom 的區塊，不是這支 hook 決定版面。
 */
export function useCollapsibleSearch(opts: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  leftIcon?: ReactNode
}) {
  const [open, setOpen] = useState(false)

  const toggle = <FilterToggle open={open} onToggle={() => setOpen(v => !v)} active={opts.value.trim() !== ''} />

  const extra = open ? (
    <div style={{ flex: 1, minWidth: 200 }}>
      <Input
        autoFocus
        value={opts.value}
        onChange={e => opts.onChange(e.target.value)}
        placeholder={opts.placeholder}
        leftIcon={opts.leftIcon}
      />
    </div>
  ) : null

  return { open, toggle, extra }
}
