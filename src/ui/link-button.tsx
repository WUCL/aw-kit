// 2026-11-19 自 inknock `src/shared/ui/link-button.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { useTheme } from './theme-context'

interface LinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 字級：caption 12／meta 13（預設）／body 15 */
  size?: 'caption' | 'meta' | 'body'
  /** link＝連結色（打開另一個東西）；muted＝淡灰的次要動作（例：＋ 向其他供應商領料） */
  tone?: 'link' | 'muted'
}

/**
 * 看起來像連結的按鈕：無框、無底、無內距，點了打開另一張單或做一個輕量動作。
 * 2026-09-30 收斂各頁手寫的 `<button style={{ border: 'none', background: 'none', … }}>`（check:style bareControl）。
 * 要跳頁請用 react-router 的 `<Link>`；這個只給「點了在原地打開面板／執行動作」。
 */
export const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(function LinkButton(
  { size = 'meta', tone = 'link', type = 'button', style, ...rest },
  ref,
) {
  const T = useTheme()
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      style={{
        border: 'none', background: 'none', padding: 0, cursor: rest.disabled ? 'default' : 'pointer',
        fontFamily: T.font, fontSize: T.fontSize[size],
        fontWeight: tone === 'link' ? T.fontWeight.semibold : T.fontWeight.medium,
        color: tone === 'link' ? T.link : T.inkFaint,
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    />
  )
})
