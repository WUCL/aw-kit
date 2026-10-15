// IME-safe Escape. Copied from inknock src/shared/ui/submit-enter.ts (isImeComposing + isCancelEscape).
// Composing keys: most browsers set isComposing; Safari fires keydown after compositionend with
// isComposing already false, so keyCode 229 is the only tell. Works for React events (nativeEvent) and native ones.
export function isImeComposing(e) {
  return !!(e.nativeEvent?.isComposing ?? e.isComposing) || e.keyCode === 229
}

export function isCancelEscape(e) {
  return e.key === 'Escape' && !isImeComposing(e)
}
