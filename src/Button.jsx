// src/Button.jsx
// Self-contained button — does NOT depend on the consumer's own Button component.
// Only the variants ConfirmDialogHost needs: primary / secondary / danger, size sm.
const VARIANT_CLASS = {
  primary: 'fbk-btn--primary',
  secondary: 'fbk-btn--secondary',
  danger: 'fbk-btn--danger',
}

export default function Button({ variant = 'secondary', onClick, children, ...props }) {
  const variantClass = VARIANT_CLASS[variant] || VARIANT_CLASS.secondary
  return (
    <button type="button" className={`fbk-btn ${variantClass}`} onClick={onClick} {...props}>
      {children}
    </button>
  )
}
