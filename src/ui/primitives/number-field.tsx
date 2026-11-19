// inknock: 帶後綴／步進鈕的數字欄外觀（2026-11-15 ADR 0001 D5；比較頁待使用者確認）。
//
// shadcn 三個底層都沒有 number-field（ADR〈PoC 補充〉），也不用 React Aria 的 NumberField（press 會 stopPropagation、
// 只看 isComposing）。外框、聚焦、錯誤、停用照 primitives/input.tsx 的 inputClassName 同一組值，只是畫在外框上
// （欄位本身無框透明），讓 −／＋ 與後綴「%」在同一個框裡。包裝層：../number-input.tsx（`suffix`／`stepper`）。

/** 外框：與 inputClassName 同值（框 input、圓角 md、白底、聚焦品牌色框＋外圈、錯誤紅框＋淡紅外圈、停用凹陷底）；唯讀＝凹陷底、不畫聚焦外圈 */
export const numberGroupClassName =
  "flex h-(--control-h-md) w-full min-w-auto items-stretch rounded-md border border-input bg-background text-foreground transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring data-invalid:border-danger-base data-invalid:ring-3 data-invalid:ring-danger-base/20 data-invalid:focus-within:ring-2 data-invalid:focus-within:ring-ring data-disabled:cursor-not-allowed data-disabled:border-line-strong data-disabled:bg-surface-sunken data-disabled:text-ink-faint data-readonly:bg-surface-sunken data-readonly:focus-within:border-input data-readonly:focus-within:ring-0"

/** 框內的欄位：無框透明、撐滿；字級與 inputClassName 同 */
export const numberGroupInputClassName =
  "h-full min-w-0 flex-1 border-0 bg-transparent px-2.5 py-1 text-base font-normal text-foreground tabular-nums outline-none placeholder:text-ink-faint disabled:cursor-not-allowed disabled:text-ink-faint disabled:opacity-100 md:text-sm"

/** 後綴（%、分鐘）：淡字、緊貼數字 */
export const numberSuffixClassName = "flex shrink-0 items-center pr-2.5 pl-0.5 text-ink-faint select-none"

/** −／＋：框內的正方形鈕（寬＝高），與欄位以框線色隔開；可點範圍上下補到 44（.hit-area）。
 *  停用用 line-strong：ink-faint 與可按時的 ink-muted 幾乎同色，到下限時看不出 − 不能按（比較頁實測） */
export const numberStepClassName =
  "hit-area flex w-(--control-h-md) shrink-0 cursor-pointer items-center justify-center text-ink-muted transition-colors hover:bg-accent hover:text-ink disabled:cursor-not-allowed disabled:text-line-strong disabled:hover:bg-transparent [&_svg]:size-4 first:rounded-l-[calc(var(--radius-md)-1px)] first:border-r first:border-input last:rounded-r-[calc(var(--radius-md)-1px)] last:border-l last:border-input"
