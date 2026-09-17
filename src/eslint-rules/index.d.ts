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
