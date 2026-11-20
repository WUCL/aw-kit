// aw-kit/gates 型別宣告的使用面檢查（tsc -p tests/gates/tsconfig.json）：照消費端的寫法呼叫一次，宣告與實作的參數形狀不合時這裡紅。
import { checkSource, checkToken, sourceDirs, type ClassViolation } from '../../src/gates/class-gate.js'
import { scan as scanHeight, scanHit } from '../../src/gates/controls-gate.js'
import { isMain } from '../../src/gates/is-main.js'
import { listSources, ratchet, uiFiles } from '../../src/gates/sources.js'
import { createStyleRules, readPalette, scan as scanStyle, uiOwners } from '../../src/gates/style-gate.js'
import { scanTerms } from '../../src/gates/terms-gate.js'
import { checkPin, readPinState } from '../../src/gates/pin.js'

const spacing = ['stack']
const v: ClassViolation[] = checkSource('<div className="p-4" />', 'x.tsx', t => checkToken(t, spacing, { componentLayer: 'src/shared/ui' }))
const dirs: { dir: string }[] = sourceDirs('@source "x";', '/a/b.css', '/a')
const kit = uiOwners('aw-kit/src/ui/')
const rules = createStyleRules({ palette: readPalette(["'#FFFFFF'"]), ...kit, isComponentLayer: f => f.startsWith('src/shared/ui/') })
const hits = scanStyle('x.tsx', '', rules)
const { fresh, cleared } = ratchet(hits, h => `${h.file}:${h.rule}`, [])
const files: [string, string][] = uiFiles('/x', 'p/')
export const used = [v, dirs, fresh, cleared, files, listSources('src'), scanHeight('x.tsx', ''), scanHit('x.tsx', ''), isMain({ url: '' }), scanTerms('x.tsx', '', { forbidden: { a: 'b' } }), checkPin({ ...readPinState('.', { remote: false }), repo: 'WUCL/aw-kit', strict: true }).problems]
