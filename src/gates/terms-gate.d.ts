// aw-kit/gates/terms-gate 的型別（實作：terms-gate.js）
export function scanTerms(file: string, text: string, dict: { deprecated?: Record<string, string>; forbidden?: Record<string, string> }): string[]
