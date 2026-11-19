// inknock: DropdownMenu 的樣式（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-15/dropdown-menu.tsx；ADR 0001〈外觀定案〉D1）
//
// ⚠️ 只借 class、不渲染 React Aria 的 Menu／Popover（同 Button／Dialog）：React Aria 的 Popover 會把選單以外設成 inert、
//   press 事件會 stopPropagation，且判斷組字只看 isComposing。定位、關閉、鍵盤與焦點在 `../use-dropdown-menu.ts`。
//
// 與上游的差異（2026-11-15 使用者看比較頁選 A、高度 44）：
//   - 選單項高＝版面列高 touch 44（`--row-h-touch`，由 DESIGN.md row-height 產生；iPad 手指）；上游 py-1＝約 28
//   - 字級 body 15（上游 text-sm 14）、字重 400；選取項 600＋右側品牌色勾（上游勾無色）
//   - 鍵盤焦點：底色之外加一圈內縮品牌色框（上游只有底色；hoverSurface 4% 太淡，單靠底色看不出焦點在哪）
//   - 分組標題 caption 12／600（上游 text-xs／500）
//   - 圓角 lg 10（D1 選單／彈出層）；外框照上游 ring-1 ring-foreground/10＋shadow-md（同對話框）
//   - 放大動畫的起點由包裝層依方向給 origin-*（上游用 React Aria 的 --trigger-anchor-point）

export const menuContentClassName =
  "min-w-42 overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none duration-100 animate-in fade-in-0 zoom-in-95"

export const menuItemClassName =
  "relative flex h-(--row-h-touch) w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-left text-body text-ink outline-none select-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:bg-transparent"

export const menuItemDangerClassName = "text-danger-dark hover:bg-danger-bg focus-visible:bg-danger-bg"

export const menuItemSelectedClassName = "font-semibold"

export const menuItemHintClassName = "ml-auto text-caption font-normal text-ink-faint tabular-nums"

export const menuItemCheckClassName = "size-4 shrink-0 text-brand"

export const menuLabelClassName = "px-2.5 pt-2 pb-1 text-caption font-semibold text-ink-muted"

export const menuSeparatorClassName = "-mx-1 my-1 h-px bg-border"

// 多行列（2026-11-18 第 28 批，標題列下拉）：通知（標題＋內文＋時間）、搜尋結果（頭像＋兩行字）比單行列高。
// 高度改「至少 44」＋上下內距 8，其餘與 menuItemClassName 相同；是 cn() 疊在它後面用的，h-auto 會蓋掉 h-(--row-h-touch)
export const menuItemMultilineClassName = "h-auto min-h-(--row-h-touch) py-2"

// 多行列內容頂端對齊（通知：圓點對第一行標題）；預設垂直置中
export const menuItemAlignStartClassName = "items-start"
