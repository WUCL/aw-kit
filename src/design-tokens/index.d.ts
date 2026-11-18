// aw-kit/design-tokens 的型別（手寫，同 eslint-rules 慣例）。frontmatter 是 YAML 解析結果，結構寬鬆，以 Record 表示。
export type Frontmatter = Record<string, any>
export declare const BASE: Frontmatter
export declare const COLOR_ORDER: readonly string[]
export declare const BRAND_COLOR_NAMES: readonly string[]
export declare const SHADCN_TEXT: { readonly xs: 'caption'; readonly sm: 'body'; readonly base: 'body' }
export declare function extractFrontmatter(md: string): string
export declare function readFrontmatter(md: string, parse: (yamlText: string) => unknown): Frontmatter
export declare function mergeDesign(brand: Frontmatter): Frontmatter
export declare function readDesign(md: string, parse: (yamlText: string) => unknown): Frontmatter
export declare function resolveRef(fm: Frontmatter, v: unknown): unknown
export declare function assertNoAliasClash(fm: Frontmatter): void
export declare function render(fm: Frontmatter, opts?: { header?: string[] }): string
export declare function tokenNames(fm: Frontmatter): { text: string[]; spacing: string[]; shadow: string[] }
export declare function renderNames(fm: Frontmatter, opts?: { header?: string[] }): string
