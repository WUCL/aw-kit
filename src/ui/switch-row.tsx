// 2026-11-20 新增（inknock TODO ⑪，比較頁經使用者確認）：「標題＋說明＋開關」的整列，全站一種寫法。
import { useId } from 'react'
import { useTheme } from './theme-context'
import { Switch } from './switch'
import { useIsMobile } from './breakpoints'

/**
 * 整列開關：左邊標題（＋說明／狀態字），右邊 Switch。
 *
 * - **整列可點**：整列是 `<label htmlFor>`，點標題、說明或空白處都等於點開關（label 的原生行為，只切換一次）。
 *   開關本身是 Switch，不可再包進其他可互動元素（「開關裡面還有開關」）。
 * - **名稱固定＝標題**：用 `aria-labelledby` 只指向標題。不靠 label 的原生名稱——label 包住整列時，
 *   原生名稱會把說明也算進去（「現金現場收取現金」）。
 * - `description`：固定說明，連到開關（`aria-describedby`），報讀時名稱之後接著念。
 * - `stateText`：隨開關變的狀態字（例：未到場的「客戶未出現／有出現」）→ `aria-hidden`，開或關由 `aria-checked` 表達，
 *   名稱不跟著變。
 * - `tone="warning"`：開啟時整列變警示色（金底、琥珀框、標題琥珀字），只在 `framed` 時有底與框。
 * - `framed`：單獨一列時自帶外框與凹陷底；放在清單裡時不加，分隔線由外層清單畫。
 * - `inset`（預設 true）：列自帶左右內距 18（手機 14）；外層容器已有左右內距時傳 false。
 */
export function SwitchRow({
  label, description, stateText, checked, onChange, disabled, tone = 'default', framed = false, inset = true,
}: {
  label: string
  description?: string
  stateText?: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
  tone?: 'default' | 'warning'
  framed?: boolean
  inset?: boolean
}) {
  const T = useTheme()
  const isMobile = useIsMobile()
  const switchId = useId()
  const labelId = useId()
  const descId = useId()
  const warn = tone === 'warning' && checked
  return (
    <label
      htmlFor={switchId}
      style={{
        display: 'flex', alignItems: 'center', gap: T.gap.field,
        padding: inset ? (isMobile ? '12px 14px' : '12px 18px') : '12px 0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: T.font,
        ...(framed ? {
          borderRadius: T.radius.lg,
          border: `1px solid ${warn ? T.state.warning.base : T.lineControl}`,
          background: warn ? T.state.gold.bg : T.surfaceSunken,
          transition: `background ${T.motion.slow}, border-color ${T.motion.slow}`,
        } : {}),
      }}
    >
      {/* label 內只能放行內內容（HTML 內容模型），所以用 span＋display:block，不用 div */}
      <span style={{ display: 'block', flex: 1, minWidth: 0 }}>
        <span id={labelId} style={{ display: 'block', fontSize: T.fontSize.body, fontWeight: T.fontWeight.semibold, color: warn ? T.state.warning.text : T.ink }}>{label}</span>
        {description && <span id={descId} style={{ display: 'block', fontSize: T.fontSize.caption, color: T.inkMuted }}>{description}</span>}
        {stateText && <span aria-hidden="true" style={{ display: 'block', fontSize: T.fontSize.caption, color: warn ? T.state.warning.dark : T.inkMuted, marginTop: 1 }}>{stateText}</span>}
      </span>
      <Switch
        id={switchId}
        aria-labelledby={labelId}
        aria-describedby={description ? descId : undefined}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  )
}
