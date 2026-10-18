// Compile-only test (npm run test:types): calls every public API of aw-kit/panel the way a consumer would,
// so a hand-written index.d.ts that drifts from the implementation fails `tsc --noEmit`.
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import {
  PanelStackProvider, PanelHost, PanelHeader, usePanel, usePanelStack, usePanelCloseGuard, usePanelHeader,
  PanelHeaderStatus, StatusMenuBadge, type StatusMenuOption, type StatusMenuBadgeTone,
  useUrlPanel, MAX_DEPTH, isPanelOnlyNavigation, awPanelOf, withPanelNavigationAllowed, injectStyles,
  type PanelRegistry, type PanelRenderProps, type CloseGuard, type PanelEntry, type OpenOptions,
  type PanelActions, type PanelRouterAdapter, type PanelLocation, type PanelStackProviderProps,
} from 'aw-kit/panel'

// react-router-dom v6's hooks must satisfy the adapter type as-is
const router: PanelRouterAdapter = { useLocation, useNavigate, useNavigationType }

function Content({ seed, openPanel, back, closeAll, canBack }: PanelRenderProps<{ id: string }>) {
  const guard: CloseGuard = async () => seed.id !== ''
  usePanelCloseGuard(guard)
  usePanelCloseGuard(null)
  usePanelHeader({ title: seed.id, meta: 'NO-1' })
  const status: StatusMenuOption<'a' | 'b'>[] = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B', disabled: true, reason: 'x' }]
  const tone: StatusMenuBadgeTone = 'warn'
  const badge = <StatusMenuBadge ariaLabel="進度" label="A" tone={tone} value="a" options={status} onSelect={(v: 'a' | 'b') => void v} />
  const opts: OpenOptions = { ownsHistory: false, onClosed: () => {} }
  openPanel('c', { id: 'x' }, opts)
  back(); closeAll()
  return <i>{String(canBack)}<PanelHeaderStatus>{badge}</PanelHeaderStatus><PanelHeaderStatus /></i>
}

const registry: PanelRegistry = {
  c: { component: Content, ariaLabel: 'x', width: 480 },
  d: { component: Content, width: 'min(560px, 50vw)' },
}

function Page() {
  const actions: PanelActions = usePanel()
  actions.openPanel('c', { id: 'a' })
  actions.back()
  const closed: boolean | void = actions.closeAll()
  void closed
  void actions.dismissAll(() => {}).then((ok: boolean) => ok)
  actions.registerGate(async (d?: number) => d === undefined)
  const entries: PanelEntry[] = usePanelStack().stack
  const first = entries[0]
  const loc: PanelLocation = { pathname: '/', search: '', hash: '', state: null, key: 'k' }
  const blocked: boolean = isPanelOnlyNavigation(loc, loc) || (first ? first.ownsHistory : false)
  const depth: number = awPanelOf(loc) + MAX_DEPTH
  const wrapped: string = withPanelNavigationAllowed(() => 'ok')
  useUrlPanel('c', { key: 'k', seed: { id: 'a' } }, () => {})
  useUrlPanel('c', null, () => {})
  return <PanelHeader title="t" meta="m" backLabel="b" onBack={() => {}} onClose={() => {}} padX="var(--aw-panel-pad)" key={`${blocked}${depth}${wrapped}`} />
}

const props: PanelStackProviderProps = { router, zBase: 160, mobileQuery: '(max-width: 767px)', onMaxDepth: () => {} }
injectStyles()

export const App = () => (
  <PanelStackProvider {...props}>
    <PanelStackProvider router={router} />
    <Page />
    <PanelHost registry={registry} />
  </PanelStackProvider>
)

// @ts-expect-error router is required
export const NoRouter = () => <PanelStackProvider />
// @ts-expect-error padX is a CSS string, not a number
export const BadPad = () => <PanelHeader title="t" onClose={() => {}} padX={16} />
// @ts-expect-error PanelHost returns a ReactElement, not any (a global-JSX d.ts would make this silently pass)
export const NotANumber: number = PanelHost({ registry })
// @ts-expect-error onSelect value must be one of the option values
export const BadSelect = () => <StatusMenuBadge ariaLabel="x" label="A" value="a" options={[{ value: 'a' as const, label: 'A' }]} onSelect={(v: 'zzz') => void v} />
