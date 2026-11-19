import { cva } from "class-variance-authority"

// inknock: Callout（提示列）的樣式（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-15/alert.tsx；ADR 0001 第一階段）
//   2026-11-15 改走 class，**外觀與換之前相同**（比較頁 getComputedStyle 逐屬性比對）：
//   - 上游 grid＋圖示欄＋AlertTitle／Description → inknock 是一行文字＋右側 sm 按鈕（QuickView ②b，DECISIONS 2026-10-14），用 flex
//   - 上游只有 default／destructive（卡片底）→ inknock 兩種色調：warning（待處理，琥珀）／info（中性說明）
//   - 圓角 lg 10、內距 10×14（固定 px，換之前就是字面值）、間距 gap.stack、字級 body 但行高沿用外層（換之前只設 fontSize）
//   - 根元素不帶 data-slot：內容是頁面的文字與按鈕，限定子樹的 preflight 不可套進去（同 Card／Modal）
export const calloutVariants = cva(
  "flex flex-wrap items-center gap-stack rounded-lg border px-[14px] py-[10px] text-body leading-[inherit]",
  {
    variants: {
      tone: {
        warning: "border-amber-border bg-amber-bg text-amber-ink",
        info: "border-line-strong bg-neutral-bg text-neutral-ink",
      },
    },
  }
)
