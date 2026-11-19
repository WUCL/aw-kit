import { cva } from "class-variance-authority"

// inknock: EmptyState 的樣式（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-15/empty.tsx；ADR 0001 第一階段）
//   2026-11-15 改走 class，**外觀與換之前相同**（比較頁 getComputedStyle 逐屬性比對）：
//   - 上游是圖示＋標題＋說明＋動作的整塊空狀態 → inknock 是一行置中的淡字（載入中／空清單／錯誤／未啟用，批次 7c-1 收斂 76 處）
//   - 留白四種（block 40／tight 上下 40／inset 上下 60／insetX 60×24；固定 px——換之前是字面值，不隨瀏覽器字級縮放；「空狀態留白」的唯一決定點）
//   - 字級 body 但行高沿用外層（換之前只設 fontSize）、明寫品牌字體（換之前寫 fontFamily，放進按鈕等自帶字體的容器也不變）；錯誤用 danger-ink（danger-base 在白底對比 3.76 不及格）
//   - 根元素不帶 data-slot：內容可能是頁面的連結與按鈕
export const emptyVariants = cva("font-sans text-body leading-[inherit]", {
  variants: {
    tone: {
      muted: "text-ink-muted",
      faint: "text-ink-faint",
      error: "text-danger-ink",
    },
    padded: {
      block: "p-[40px]",
      tight: "py-[40px]",
      inset: "py-[60px]",
      insetX: "px-[24px] py-[60px]",
    },
    align: {
      center: "text-center",
      left: "text-left",
    },
  },
})
