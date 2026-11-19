// inknock: Skeleton 的樣式（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-15/skeleton.tsx；ADR 0001 第一階段）
//   2026-11-15 改走 class，**外觀與換之前相同**（比較頁 getComputedStyle 逐屬性比對）：
//   - 上游 animate-pulse＋bg-muted（整塊閃爍）→ 保留 inknock 的掃光（neutral-sunken／line 漸層、1.4 秒、DESIGN.md「骨架載入」）
//   - 尺寸（寬、高、圓角）由包裝層以 props 給（每個骨架都要和真實內容同尺寸），這裡只放外觀
//   - 顏色用執行期存在的 --ds-* 變數（--color-* 在 @theme inline 裡，不會輸出成變數）
export const skeletonClassName = "block rounded-md"
export const skeletonShimmerClassName =
  "bg-[linear-gradient(90deg,var(--ds-neutral-sunken)_25%,var(--ds-line)_50%,var(--ds-neutral-sunken)_75%)] bg-[length:200%_100%] animate-[skeleton-shimmer_1.4s_infinite]"
