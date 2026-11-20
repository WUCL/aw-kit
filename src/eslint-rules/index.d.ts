import type { ESLint, Linter, Rule } from 'eslint'

export const rules: {
  'verified-supabase-write': Rule.RuleModule
  'no-hardcoded-design-token': Rule.RuleModule
  'no-inline-date-format': Rule.RuleModule
}

/** Flat config block: all three rules as `error`, plugin registered under `aw-kit`. */
export const recommended: Linter.Config

declare const plugin: ESLint.Plugin & {
  meta: { name: 'aw-kit'; version: string }
  rules: typeof rules
  configs: { recommended: typeof recommended }
}
export default plugin

/** Options accepted by `aw-kit/verified-supabase-write`. */
export interface VerifiedSupabaseWriteOptions {
  /** Identifiers treated as the Supabase client. Default `['supabase']`. Any chain containing `.from()` also counts. */
  clientNames?: string[]
  /** Name of the helper that returns affected rows. Default `'verifyWrite'`. */
  verifyFnName?: string
}

/** Options accepted by `aw-kit/no-hardcoded-design-token` — each category can be switched off. */
export interface NoHardcodedDesignTokenOptions {
  fontSize?: boolean
  borderRadius?: boolean
  fontWeight?: boolean
}

/** Options accepted by `aw-kit/no-inline-date-format`. */
export interface NoInlineDateFormatOptions {
  /** Replaces the report text, e.g. point at the project's own formatter. */
  message?: string
}

/** One `no-restricted-syntax` entry. */
export interface RestrictedSyntax { selector: string; message: string }
/** Hand-written Enter／Escape key checks (IME composition): use the project's isSubmitEnter／isCancelEscape. */
export function imeKeyRules(message: string): RestrictedSyntax[]
/** window.confirm／globalThis.alert and bare alert(). */
export function nativeDialogRules(messages: { confirm: string; alert: string }): RestrictedSyntax[]
/** toISOString()／toJSON() sliced to a date or month (UTC, not local). */
export function utcDateRules(message: string): RestrictedSyntax[]
/** inputMode="decimal|numeric" and <input type="number">. */
export function numberFieldRules(messages: { inputMode: string; typeNumber: string }): RestrictedSyntax[]

/** no-restricted-imports 的 pattern／path（imports.js） */
export interface RestrictedImportPattern { group: string[]; message: string }
export const PRIMITIVE_GROUP: readonly string[]
export const VENDOR_GROUP: readonly string[]
export function uiLibraryPatterns(message: string, options?: { extraPrimitivePaths?: string[] }): RestrictedImportPattern[]
export function bareCnPath(message?: string): { name: 'cn'; message: string }
