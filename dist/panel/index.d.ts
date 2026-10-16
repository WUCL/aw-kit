// Hand-written type declarations for aw-kit/panel's public API.
// Copied to dist/panel/index.d.ts at build time (not compiler-generated — the package is plain JS/JSX).

import type { ComponentType, ReactElement, ReactNode } from 'react'

/** Minimal location shape the panel shell reads (a v6/v7 router Location satisfies it). */
export interface PanelLocation {
  pathname: string
  search: string
  hash: string
  state: unknown
  key: string
}

/** Router adapter: pass your router's own hooks (router v6 / v7 both fit). aw-kit never imports a router. */
export interface PanelRouterAdapter {
  useLocation: () => PanelLocation
  useNavigate: () => (to: any, options?: any) => void | Promise<void>
  useNavigationType: () => 'POP' | 'PUSH' | 'REPLACE' | (string & {})
}

export interface PanelStackProviderProps {
  children?: ReactNode
  router: PanelRouterAdapter
  /** z-index of layer 0's scrim; layer d uses base+2d (scrim) / base+2d+1 (panel). Default 160. */
  zBase?: number
  /** Media query that switches to the mobile layout. Default '(max-width: 767px)'. */
  mobileQuery?: string
  /** Called when openPanel hits MAX_DEPTH (inknock shows a toast here). Omitted = silent. */
  onMaxDepth?: () => void
}
export function PanelStackProvider(props: PanelStackProviderProps): ReactElement

export type CloseGuard = () => boolean | Promise<boolean>

export interface OpenOptions {
  /** false = layer is driven by a page URL param and does not push its own history record. Default true. */
  ownsHistory?: boolean
  /** Called when the shell closes this layer (not when a full-page navigation clears the stack). */
  onClosed?: () => void
}

export interface PanelEntry<S = unknown> {
  key: string
  type: string
  seed: S
  title?: string
  ownsHistory: boolean
  openedAtKey: string
  openedAtPath: string
  openedAtUrl: string
  replacedFrom?: string
  onClosed?: () => void
}

export interface PanelActions {
  openPanel: (type: string, seed: unknown, opts?: OpenOptions) => void
  back: () => void
  /** Returns false when the call was ignored (a back navigation is in progress). */
  closeAll: () => void | boolean
  dismissAll: (onAllowed?: () => void) => Promise<boolean>
  registerGate: (g: ((targetDepth?: number) => Promise<boolean>) | null) => void
}

export function usePanel(): PanelActions
export function usePanelStack(): { stack: PanelEntry[]; dispatch: (a: unknown) => void }

/** Context every panel content component receives. */
export interface PanelRenderProps<S = unknown> {
  seed: S
  openPanel: (type: string, seed: unknown, opts?: OpenOptions) => void
  back: () => void
  closeAll: () => void
  canBack: boolean
}

/** type -> content component. `width` is the desktop width of layer 0 (number = px, string = CSS expression). */
export type PanelRegistry = Record<string, {
  component: ComponentType<PanelRenderProps<never>>
  ariaLabel?: string
  width?: number | string
}>

export function PanelHost(props: { registry: PanelRegistry }): ReactElement

/** Register a close guard for the current panel layer; null = no guard. Several per layer are allowed. */
export function usePanelCloseGuard(guard: CloseGuard | null): void

export const MAX_DEPTH: number

export function PanelHeader(props: {
  title: string
  meta?: string
  /** undefined = first layer (no back link); string = shows "‹ string" */
  backLabel?: string
  onBack?: () => void
  onClose: () => void
  /** Horizontal padding as a CSS length, e.g. 'var(--aw-panel-pad)' */
  padX: string
}): ReactElement

export function usePanelHeader(info: { title: string; meta?: string }): void

export function useUrlPanel(
  type: string,
  target: { key: string; seed: unknown } | null,
  onClosed: () => void,
): void

export function awPanelOf(loc: { state?: unknown }): number
/** For useBlocker's shouldBlock: true when the move is the shell's own (same path+search, only state.awPanel differs). */
export function isPanelOnlyNavigation(
  current: { pathname: string; search: string; state?: unknown },
  next: { pathname: string; search: string; state?: unknown },
): boolean
export function withPanelNavigationAllowed<T>(fn: () => T): T

export function injectStyles(): void
