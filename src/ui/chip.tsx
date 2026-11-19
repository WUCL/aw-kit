// 2026-11-19 自 inknock `src/shared/ui/chip.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// 屬性標記 chip（2026-09-07，批二 C1）。
//
// ⚠️ **這不是 Badge。** 分野是「狀態 vs 識別」：
//   `Badge`  ——「這東西現在處於什麼狀態」（已下單／部分收貨／已交付…），有色點。
//   `Chip`   ——「這東西是誰／屬於哪裡」（店名、分類…），**沒有色點**。
// 依 `badge-tone.ts` 的既有規則：「色點是『這是一個狀態』的訊號，屬性標記不該有」。
// 在地名旁邊點一顆狀態點會讓人以為 NOUR-1 是某種狀態。
//
// ⚠️ **長相不在這裡定義**，一律取自 `primitives/chip.tsx`（2026-11-15 前是 `badge-tone.markerShape()`）——
// 標籤家族的長相只有那一份，這裡只是它的消費者。
// 2026-09-06 盤點的教訓是同一個視覺家族長出了七種實作，其中一份複製品的註解
// 還寫著「比照 StatusPill 的圓角膠囊」而 StatusPill 實測是方角 6px——
// **複製品連要比照什麼都會抄錯。**
import type { ReactNode } from 'react'
import { chipVariants } from './primitives/chip'

/** `tone="accent"`：唯一的強調屬性（例：主店）。仍是有框的形狀——實心淺底會在 hover／選取列的底色上消失（mockup 108 A1） */
/** `size="md"`：字級 meta，給內文是 body 的面板（結帳預覽、訂單面板）；預設 caption */
export function Chip({ children, title, tone, size }: { children: ReactNode; title?: string; tone?: 'accent'; size?: 'sm' | 'md' }) {
  // 外觀走 primitives/chip.tsx 的 class（2026-11-15 改走 class，外觀不變）
  return (
    <span title={title} className={chipVariants({ tone, size })}>
      {/* 欄寬不夠時截斷成「…」（2026-09-29）；完整名稱由呼叫端的 title 提供 */}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  )
}

/**
 * 一組 chip，一個一行（2026-09-29 使用者翻案：原本超過 `max` 收斂成「等 N 家」以保持單列高，
 * 實機上多店的單反而看不出送去哪幾家）。每個 chip 各自截斷、各自有 title。
 */
export function ChipList({ items, empty }: {
  items: string[]
  /** 沒有任何項目時顯示的文字。⚠️ 一律要給——空白會被當成「資料掉了」 */
  empty: ReactNode
}) {
  if (items.length === 0) return <>{empty}</>
  // 2026-09-29 使用者：一個一行（原本單列＋「等 N 家」收斂）。店家數量少，列高隨之變高可接受；
  // 名稱過長由 Chip 截斷，滑過去看 title 的完整名稱。
  return (
    <span className="flex max-w-full min-w-0 flex-col items-start gap-hairline">
      {items.map((s, i) => <Chip key={`${s}-${i}`} title={s}>{s}</Chip>)}
    </span>
  )
}
