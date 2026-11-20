// aw-kit/gates/class-gate 的型別（實作：class-gate.js）
export interface ClassViolation { line: number; token: string; reason: string }
export type TokenCheck = (token: string) => string | null
export function aliasDisplayClash(raw: string, spacingAliases: readonly string[]): string | null
export function checkToken(raw: string, spacingAliases: readonly string[], options?: { componentLayer?: string }): string | null
export function checkSharedUiToken(raw: string, textSizes: readonly string[], spacingAliases: readonly string[]): string | null
export function checkSource(text: string, fileName: string, check: TokenCheck): ClassViolation[]
export function checkAllStrings(text: string, fileName: string, check: TokenCheck): ClassViolation[]
export interface SourceDir { not: boolean; dir: string; exists: boolean }
export function sourceDirs(cssText: string, cssFile: string, root: string): SourceDir[]
