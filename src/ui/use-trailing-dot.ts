// 2026-11-19 自 inknock `src/shared/ui/use-trailing-dot.ts` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useRef, useState } from 'react'
import { normalizeInteger, type NumberKind } from './sanitize-number'

/**
 * integer 欄「結尾的小數點」回顯（深度審查 2026-10-28 A2）。
 *
 * `sanitizeNumber(…,'integer')` 會保留第一個小數點（「1200.」），讓逐鍵打字時點還在、後面的數字被擋。
 * 但許多呼叫端把值轉成數字再存（`Number(v)`、`replace(/\D/g,'')`），再從數字回灌 `value`——
 * 點在這一圈會被吃掉，下一鍵 `5` 就接成 12005。這裡記住「最近一次送出、以點結尾」的值，
 * 只要呼叫端回灌的 `value` 恰等於去掉點的那個值，就把點補回顯示。
 * 呼叫端回灌了別的值（重設、他處改動）就立刻失效，不會殘留。
 */
export function useTrailingDot(value: string | number | readonly string[] | undefined, kind: NumberKind | undefined) {
  const dotFor = useRef<string | null>(null)
  const [, bump] = useState(0)
  const base = value === undefined || Array.isArray(value) ? undefined : String(value)
  // 刻意在 render 讀寫 ref：「最近一次送出的值」只影響這一輪的顯示，不需要（也不可）觸發額外重繪；
  // 回灌值變了就當場失效（見檔頭）。inknock 原本即為 warn 級（2026-11-19 搬入時原樣保留，未改寫）
  // eslint-disable-next-line react-hooks/refs -- 見上
  if (dotFor.current !== null && base !== dotFor.current) dotFor.current = null
  // eslint-disable-next-line react-hooks/refs -- 同上
  const display = kind === 'integer' && base !== undefined && dotFor.current === base ? `${base}.` : value
  /** 每次把清洗後的值交給呼叫端之前呼叫 */
  const remember = (emitted: string) => {
    const next = kind === 'integer' && emitted.endsWith('.') ? normalizeInteger(emitted) : null
    if (next === dotFor.current) return
    dotFor.current = next
    // 呼叫端回灌的 value 沒變時 React 不會重繪，受控 input 會被還原成舊值（點被吃掉）——自己觸發一次重繪
    bump(n => n + 1)
  }
  return { display, remember }
}
