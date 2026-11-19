// 2026-11-19 自 inknock `src/shared/ui/nav-count-badge.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useTheme } from './theme-context'

/**
 * 導覽數字徽章 —— 掛在側欄／抽屜導覽項右側的 pill 計數提示。
 *
 * 2026-09-16 從兩處各刻兩份（共四份）收斂而來（盤點 #8 C4-2）：
 * - **預約待審數字**：`Sidebar.tsx`／`MobileDrawer.tsx` 掛在 `/app/bookings` 那一列，
 *   各自手刻一份「danger 底、白字、99+ 上限」的 badge，兩份逐字相同。
 * - **待叫貨數字**（`NavLeaf.badge`）：同樣 Sidebar／MobileDrawer 各刻一份，
 *   原為 accent 弱階，2026-09-27 改琥珀（warning）——不是危險，但是「等你動手」，
 *   原本也**沒有** 99+ 上限（純粹渲染 `child.badge`）。併入本元件後統一補上，
 *   在數字達三位數之前不會有可見差異。
 *
 * 兩種用途外觀不同，所以留 `tone` 分岔顏色而不是硬改成同色；
 * 但「count<=0 不顯示／>99 顯示 99+／pill 形狀」的規則相同，收成一份。
 *
 * ⚠️ `/app/bookings` 這個 href 判斷刻意留在消費端（Sidebar／MobileDrawer）——
 * 那是「哪個導覽項要掛這個徽章」的業務決定，不是徽章本身的事。
 */

export type NavCountBadgeTone = 'danger' | 'warning'

export function NavCountBadge({ count, tone = 'danger' }: { count: number; tone?: NavCountBadgeTone }) {
  const T = useTheme()
  if (count <= 0) return null
  const label = count > 99 ? '99+' : String(count)

  // 待叫貨用琥珀（2026-09-27 使用者）：原本品牌綠弱階讀起來像「通過／成功」。
  // 依 badge 語意——琥珀＝等你動手、紅＝預約待審那種急件——待叫貨是「等採購處理」，屬琥珀。
  if (tone === 'warning') {
    return (
      <span /* audit-ok: handTag — 側欄計數徽章，是另一種共用元件 */ style={{
        marginLeft: 'auto', flexShrink: 0,
        minWidth: 20, textAlign: 'center',
        background: T.state.warning.bg, color: T.state.warning.text,
        borderRadius: T.radius.pill, padding: '1px 7px',
        fontSize: T.fontSize.caption, fontWeight: T.fontWeight.semibold,
        fontVariantNumeric: 'tabular-nums',
      }}>{label}</span>
    )
  }

  return (
    <span style={{
      marginLeft: 'auto', flexShrink: 0, background: T.state.danger.dark, color: '#fff',
      fontSize: T.fontSize.caption, fontWeight: T.fontWeight.bold, lineHeight: 1,
      minWidth: 18, height: 18, borderRadius: T.radius.pill,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
    }}>{label}</span>
  )
}
