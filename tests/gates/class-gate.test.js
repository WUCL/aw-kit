// @vitest-environment node
// class-gate 的負例清單（頁面 class 閘門、元件層字級、間距別名撞名、@source 解析）。
// 2026-11-19 自 inknock tests/check-ui-gate.test.ts 搬入（ADR 0002 E 批），案例不變；名單取共用層 tokenNames(BASE)（與消費端合成後相同：字級與間距別名只在共用層）。
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { BASE, tokenNames } from '../../src/design-tokens/index.js'
import { checkAllStrings, checkSharedUiToken, checkSource, checkToken, sourceDirs } from '../../src/gates/class-gate.js'

const names = tokenNames(BASE)
// 被掃的程式碼片段是 TSX（含型別註記），掃描器本身不執行它
const scan = code => checkSource(code, 'src/zz-probe.tsx', t => checkToken(t, names.spacing))
const scanShared = code => checkAllStrings(code, 'src/shared/ui/zz-probe.tsx', t => checkSharedUiToken(t, names.text, names.spacing))

describe('頁面 class 閘門（check:ui）', () => {
  it.each([
    ['顏色', '<div className="bg-brand" />', 'bg-brand'],
    ['內建色票（就算編不出來也要擋）', '<div className="text-red-500" />', 'text-red-500'],
    ['字級', '<p className="text-meta" />', 'text-meta'],
    ['框線', '<div className="border" />', 'border'],
    ['單邊框線', '<div className="border-t" />', 'border-t'],
    ['圓角', '<div className="rounded-md" />', 'rounded-md'],
    ['陰影', '<div className="shadow-sm" />', 'shadow-sm'],
    ['字重', '<b className="font-semibold" />', 'font-semibold'],
    ['數字間距', '<div className="p-4" />', 'p-4'],
    ['t-shirt 階梯名（Alias-Not-Ladder）', '<div className="gap-sm" />', 'gap-sm'],
    ['負 margin', '<div className="-mt-4" />', '-mt-4'],
    ['任意值', '<div className="w-[300px]" />', 'w-[300px]'],
    ['任意 variant', '<div className="[&>*]:flex" />', '[&>*]:flex'],
    ['帶 variant 前綴', '<div className="md:hover:bg-brand" />', 'md:hover:bg-brand'],
    ['important', '<div className="!p-4" />', '!p-4'],
    ['樣板字串', 'const x = 1; export const C = () => <div className={`flex ${x} p-4`} />', 'p-4'],
    ['cn() 參數', "import { cn } from 'cn'; export const C = () => <div className={cn('flex', 'rounded')} />", 'rounded'],
    ['三元式', "export const C = ({ a }: { a: boolean }) => <div className={a ? 'text-meta' : ''} />", 'text-meta'],
    ['物件屬性 className', "export const props = { className: 'shadow' }", 'shadow'],
    ['class 屬性', '<div class="bg-white" />', 'bg-white'],
    ['*ClassName 屬性', '<Dialog contentClassName="bg-white p-4" />', 'p-4'],
    ['計算鍵 [\'className\']', "export const props = { ['className']: 'p-4' }", 'p-4'],
    ['軸向間距用數字', '<div className="gap-x-4" />', 'gap-x-4'],
    ['計算鍵 [`className`]', 'export const props = { [`className`]: \'p-4\' }', 'p-4'],
    ['classNames（sonner 等）', "export const C = () => <Toaster toastOptions={{ classNames: { toast: 'bg-white p-4' } }} />", 'bg-white'],
    ['解構預設值', "export const C = ({ className = 'shadow-sm' }: { className?: string }) => <div className={className} />", 'shadow-sm'],
    ['解構改名＋預設值', "export const C = ({ className: c = 'shadow-sm' }: { className?: string }) => <div className={c} />", 'shadow-sm'],
    ['參數預設值', "export function f(className = 'rounded') { return className }", 'rounded'],
    ['變數宣告', "const className = 'border'\nexport const C = () => <div className={className} />", 'border'],
    ['比較式旁邊的 class 仍要擋', "export const C = ({ v }: { v: string }) => <div className={cn(v === 'a' && 'p-4')} />", 'p-4'],
  ])('擋：%s', (_, code, token) => {
    expect(scan(code).map(v => v.token)).toContain(token)
  })

  it.each([
    ['版面', '<div className="flex items-center justify-between w-full grid-cols-2" />'],
    ['情境間距', '<div className="gap-stack p-card px-input-x md:gap-block space-y-section" />'],
    ['0 與 m-auto', '<div className="mt-0 m-auto mx-auto" />'],
    ['文字對齊與截斷', '<p className="text-center truncate text-nowrap" />'],
    ['表格版面', '<table className="border-collapse" />'],
    ['既有自訂 class', '<button className="focus-ring touch-target" />'],
    ['軸向情境間距（gap-x／gap-y 不可被切成 gap + x-stack）', '<div className="gap-x-stack gap-y-field space-x-inline" />'],
    ['space-*-reverse', '<div className="space-x-reverse space-y-reverse" />'],
    ['比較式的運算元不是 class', "export const C = ({ v }: { v: string }) => <div className={cn(v === 'text-only' && 'flex', v !== 'border-strong' ? 'grid' : '')} />"],
    ['索引鍵不是 class', "const M = { x: 'flex' }\nexport const C = () => <div className={M['border-x' as 'x']} />"],
  ])('放行：%s', (_, code) => {
    expect(scan(code)).toEqual([])
  })

  it('className 以外的字串不看（避免把資料誤判成 class）', () => {
    expect(scan("export const label = 'p-4 bg-red-500'")).toEqual([])
  })
})

describe('src/shared/ui：不可用已被移除的 Tailwind 內建字級（寫了不報錯、只是不產生）', () => {
  it.each(['text-lg', 'md:text-xl', 'text-2xl', 'text-lg/7'])('擋：%s', token => {
    expect(scanShared(`<h2 className="${token}" />`).map(v => v.token)).toEqual([token])
  })
  it('擋：寫在 cva() 裡（shadcn 的 class 多半在這，不在 className 上）', () => {
    expect(scanShared("const b = cva('text-lg', { variants: { size: { lg: 'text-xl' } } })").map(v => v.token)).toEqual(['text-lg', 'text-xl'])
  })
  it('放行：DESIGN.md 字級、shadcn 對應過的 xs／sm／base、顏色與對齊', () => {
    expect(scanShared('<p className="text-meta text-sm text-xs text-base text-muted-foreground text-center p-4 bg-primary" />')).toEqual([])
  })
})

describe('間距別名與 display class 撞名（2026-11-15：別名 block 讓 inline-block 多出 inline-size: 24px）', () => {
  it('擋：src/shared/ui 與頁面都擋 inline-block（DESIGN.md 有間距別名 block）', () => {
    expect(scanShared('<span className="inline-block size-1.5" />').map(v => v.token)).toEqual(['inline-block'])
    expect(scan('<span className="inline-block" />').map(v => v.token)).toEqual(['inline-block'])
  })
  it('放行：沒有對應別名的 inline-flex／inline-grid、單獨的 block', () => {
    expect(scanShared('<span className="inline-flex inline-grid block" />')).toEqual([])
  })
})

describe('@source 解析（tailwind.css）', () => {
  const root = mkdtempSync(join(tmpdir(), 'class-gate-'))
  for (const d of ['src', 'lib', 'src/shared/ui/styles']) mkdirSync(join(root, d), { recursive: true })
  const css = join(root, 'src/shared/ui/styles/tailwind.css')
  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it('路徑相對於 CSS 檔本身、回報相對於專案根、標出 not 與目錄是否存在', () => {
    expect(sourceDirs('@source "../../../../src";\n@source not "../../../../src/liff";\n@source "../../../../lib";', css, root))
      .toEqual([{ not: false, dir: 'src', exists: true }, { not: true, dir: 'src/liff', exists: false }, { not: false, dir: 'lib', exists: true }])
  })
  it('陽性對照：少退一層的舊寫法會被判為不存在', () => {
    expect(sourceDirs('@source "../../../src";\n@source "../../../lib";', css, root))
      .toEqual([{ not: false, dir: 'src/src', exists: false }, { not: false, dir: 'src/lib', exists: false }])
  })
  it('用 postcss 解析：註解裡的字不算、單引號也認得', () => {
    expect(sourceDirs("/* 舊寫法 @source \"../../../src\" */\n@source '../../../../src';", css, root).map(s => s.dir)).toEqual(['src'])
  })
  it('看不懂的寫法（inline(…) 等）回報成不存在，不靜默略過', () => {
    expect(sourceDirs('@source inline("p-4");', css, root)).toEqual([{ not: false, dir: '（看不懂：inline("p-4")）', exists: false }])
  })
})

describe('外觀 class 的訊息：元件層目錄由呼叫端帶入', () => {
  it('帶了就寫出目錄、沒帶就寫「元件層」', () => {
    expect(checkToken('bg-white', names.spacing, { componentLayer: 'src/shared/ui' })).toBe('外觀 class 只准寫在 src/shared/ui：頁面請用元件的 variant')
    expect(checkToken('bg-white', names.spacing)).toBe('外觀 class 只准寫在元件層：頁面請用元件的 variant')
  })
})

describe('呼叫端沒帶名單／check 就丟錯（不靜默用空名單＝全部放行或全部擋）', () => {
  it.each([
    ['checkToken', () => checkToken('p-4')],
    ['checkSharedUiToken', () => checkSharedUiToken('text-lg', undefined, names.spacing)],
    ['checkSource', () => checkSource('<div className="p-4" />', 'x.tsx')],
    ['checkAllStrings', () => checkAllStrings("'p-4'", 'x.ts')],
    ['sourceDirs', () => sourceDirs('@source "x";')],
  ])('%s', (_, fn) => { expect(fn).toThrow(/aw-kit\/gates\/class-gate/) })
})
