// 2026-11-19 自 inknock tests/helpers/match-media.ts 搬入（D1 批）
// jsdom 沒有 matchMedia；共用元件（Button／Input／Select／useInputStyle）依 useIsMobile 切高度，
// 掛這些元件的測試都要先裝。`mobile` 為 true 時所有 media query 皆符合（模擬手機寬）。
export function installMatchMedia(mobile = false, reduced?: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced !== undefined && query.includes('prefers-reduced-motion') ? reduced : mobile, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
