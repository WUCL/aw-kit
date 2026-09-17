// Shared RuleTester wired to the TypeScript parser. The rules ship to TS projects, so every
// case here is parsed as TS — a JS-only tester would miss the wrapper nodes
// (TSAsExpression / TSSatisfiesExpression / TSNonNullExpression) that caused real false positives.
import { describe, it } from 'vitest'
import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'

RuleTester.describe = describe
RuleTester.it = it

export function makeTester() {
  return new RuleTester({
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  })
}
