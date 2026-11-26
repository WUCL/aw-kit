// aw-kit/gates/controls-gate 的型別（實作：controls-gate.js）
export function scan(file: string, text: string): { file: string; line: number; v: number }[]
export function scanHit(file: string, text: string, opts?: { extraTags?: readonly string[] }): { file: string; line: number; tag: string }[]
