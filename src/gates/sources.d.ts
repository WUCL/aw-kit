// aw-kit/gates/sources 的型別（實作：sources.js）
export function listSources(dir: string, options?: { skip?: string[] }): string[]
export function awKitUiDir(fromUrl: string | URL): string
export function uiFiles(uiDir: string, prefix: string): [label: string, path: string][]
export function ratchet<H>(hits: H[], key: (h: H) => string, baseline: string[]): { fresh: H[]; cleared: [string, number][] }
