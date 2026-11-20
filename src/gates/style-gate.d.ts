// aw-kit/gates/style-gate 的型別（實作：style-gate.js）
export type NativeControl = 'button' | 'input' | 'select' | 'textarea'
export const UI_OWNERS: Record<NativeControl, string[]>
export const UI_TAG_OWNERS: string[]
export function uiOwners(prefix: string): { owners: Record<NativeControl, string[]>; tagOwners: string[]; paletteSkip: string[] }
export function readPalette(themeSources: string[]): Set<string>
export interface StyleRule { id: string; desc: string; scan: (src: string, file: string) => (RegExpMatchArray | (string[] & { index: number }))[] }
export function createStyleRules(options: {
  palette: Set<string>
  allowHex?: string[]
  owners: Partial<Record<NativeControl, string[]>>
  tagOwners: string[]
  isComponentLayer: (file: string) => boolean
  paletteSkip?: string[]
}): StyleRule[]
export function jsxOpenTag(src: string, at: number): string
export function stripComments(src: string): string
export function scan(file: string, src: string, rules: StyleRule[]): { file: string; line: number; rule: string; text: string }[]
