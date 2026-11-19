// inknock: Dialog／AlertDialog 的樣式（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-15/{dialog,alert-dialog}.tsx；ADR 0001〈外觀定案〉D1／D9）
//
// ⚠️ 只借 class、不渲染 React Aria 的 Modal（同 Button／Switch，2026-11-15 定案 B）：
//   React Aria 的 ModalOverlay 開啟時把對話框以外的元素全部設成 inert（react-aria 1.x
//   useModalOverlay → ariaHideOutside({ shouldUseInert: true })）。本站的 Tooltip、下拉、aw-kit toast 都 portal 在
//   對話框外——對話框開著時跳出的錯誤 toast 會關不掉、對話框裡的提示泡泡失效。另外它判斷組字只看 isComposing，
//   Safari 組字中的 Esc 會關掉對話框（ADR〈PoC 補充〉1）。包裝層（src/shared/ui/modal.tsx）沿用自家的 Esc 堆疊與注音防護。
//
// 與上游的差異：
//   - 進場動畫照上游（淡入＋95% 放大，100ms）；不做退場動畫（包裝層關閉即卸載）
//   - 遮罩照上游 bg-black/10＋backdrop-blur-xs（取代現行 rgba(0,0,0,.4)）；不用上游的 supports-backdrop-filter:——
//     它以 @supports 檢查無前綴的 backdrop-filter，iOS 17 以前的 Safari 只認 -webkit- 前綴，模糊會整個不見（review）
//   - 外框照上游 ring-1 ring-foreground/10、無陰影；圓角 rounded-xl＝DESIGN.md xl 12（D1）
//   - 內距用 inknock 間距（左右 24＝pad.panel），不用上游 p-4：與側邊面板、卡片對齊
//   - 標題 20／600（DESIGN.md title；上游 text-base／500，現行 700 超過中文字重上限）
//   - 手機（< md 且未要求置中）維持底部滑出（bottom sheet），進場改由下往上滑（不留底部安全區：index.html 未設 viewport-fit=cover，env(safe-area-inset-bottom) 恆為 0，補審實查）
//   - 確認框（confirm()）不用這裡的 class：元件是 aw-kit ConfirmDialogHost，外觀在 src/index.css 覆寫（規格見 DESIGN.md §Modal）

export const dialogOverlayClassName =
  "fixed inset-0 isolate bg-black/10 duration-100 animate-in fade-in-0 backdrop-blur-xs"

export const dialogContentClassName =
  "fixed top-1/2 left-1/2 flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground ring-1 ring-foreground/10 outline-none duration-100 animate-in fade-in-0 zoom-in-95"

export const dialogSheetClassName =
  "fixed inset-x-0 bottom-0 flex max-h-[90vh] flex-col overflow-hidden rounded-t-xl bg-popover text-popover-foreground ring-1 ring-foreground/10 outline-none duration-200 animate-in slide-in-from-bottom"

export const dialogHeaderClassName = "flex shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-4"
export const dialogTitleClassName = "m-0 text-title font-semibold text-ink"
export const dialogDescriptionClassName = "mt-1 mb-0 text-meta text-ink-muted"
export const dialogBodyClassName = "flex-1 overflow-auto px-6 pb-6"
export const dialogFooterClassName = "shrink-0 border-t border-line bg-muted/50 px-6 py-4"
