// 2026-11-19 自 inknock `src/shared/ui/menu-row.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentType, ReactNode } from 'react'
import { cn } from './cn'
import {
  menuItemClassName, menuItemDangerClassName, menuItemSelectedClassName,
  menuItemMultilineClassName, menuItemAlignStartClassName,
  menuLabelClassName, menuSeparatorClassName,
} from './primitives/dropdown-menu'

/**
 * 選單的「列」外觀，全站一份（2026-11-18 第 28 批）：OverflowMenu、PeriodPicker，
 * 以及標題列下拉（品牌選單、通知、搜尋結果）都用它，頁面層不能寫 Tailwind class，所以由這裡提供。
 *
 * ⚠️ 只管外觀，不管語意：role、aria-*、鍵盤由呼叫端決定（OverflowMenu／PeriodPicker 傳 role=menuitem*，
 * 並由 use-dropdown-menu 管方向鍵；標題列下拉不是 menu，不傳 role、也沒有方向鍵）。
 *
 * - 預設單行、高＝版面列高 44；`multiline` 改成「至少 44」＋上下內距，給多行內容（通知、搜尋結果）
 * - `danger`：破壞性動作（紅字、hover 淡紅底）；`selected`：字重 600（單選項，勾由呼叫端畫）
 * - 傳 `to`＋`linkAs`（消費端的路由 Link 元件）就渲染成導頁連結，否則是 button。
 *   aw-kit 不依賴任何路由套件（2026-11-19 D3 review：綁 react-router-dom v6 會擋住用 v7 的消費端、連結模式下還會載入兩份 router）；
 *   消費端通常包一層把自己的 Link 帶進來（inknock：src/shared/ui/menu-row.tsx）
 * - 一律帶 `data-slot="dropdown-menu-item"`：preflight 只作用在 data-slot 底下，沒有它按鈕會露出瀏覽器預設外觀
 */
type RowBase = {
  children: ReactNode
  danger?: boolean
  selected?: boolean
  multiline?: boolean
  /** 多行內容的垂直對齊；預設置中，'start' 給「圓點對第一行」這類版面 */
  align?: 'center' | 'start'
}
type ButtonRow = RowBase & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style' | 'children'> & { to?: undefined; linkAs?: undefined }
/** 消費端路由的 Link（react-router 的 Link 等）：收 `to`、`className` 與 anchor 屬性 */
export type MenuLinkComponent = ComponentType<Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; 'data-slot'?: string }>
type LinkRow = RowBase & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'style' | 'children' | 'href'> & { to: string; linkAs: MenuLinkComponent }

export type MenuRowProps = ButtonRow | LinkRow

export function MenuRow(props: MenuRowProps) {
  const { children, danger, selected, multiline, align, ...rest } = props
  const className = cn(
    menuItemClassName,
    multiline && menuItemMultilineClassName,
    align === 'start' && menuItemAlignStartClassName,
    danger && menuItemDangerClassName,
    selected && menuItemSelectedClassName,
  )
  if (rest.to !== undefined) {
    const { to, linkAs: LinkAs, ...a } = rest as Omit<LinkRow, keyof RowBase>
    return <LinkAs {...a} to={to} data-slot="dropdown-menu-item" className={className}>{children}</LinkAs>
  }
  const b = rest as Omit<ButtonRow, keyof RowBase>
  return (
    <button
      // audit-ok: bareControl — 選單列，滿寬左對齊無邊框，與 Button 的形狀完全不同；高＝版面列高 rowH.touch
      type="button"
      data-slot="dropdown-menu-item"
      {...b}
      className={className}
    >
      {children}
    </button>
  )
}

/** 分組小標（caption 12／600）；`id` 給 role=group 的 aria-labelledby */
export function MenuLabel({ id, children }: { id?: string; children: ReactNode }) {
  return <div id={id} className={menuLabelClassName}>{children}</div>
}

/**
 * 區塊分隔線。選單內用預設（role=separator）；標題列下拉不是 menu，傳 `decorative` 只畫線、不進無障礙樹。
 */
export function MenuSeparator({ decorative = false }: { decorative?: boolean }) {
  return decorative
    ? <div aria-hidden="true" className={menuSeparatorClassName} />
    : <div role="separator" className={menuSeparatorClassName} />
}
