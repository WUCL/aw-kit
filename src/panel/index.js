// src/panel/index.js — public API of aw-kit/panel (same names/set as inknock src/shared/ui/panel/index.ts, plus injectStyles)
export { PanelStackProvider } from './PanelStackProvider.jsx'
export { usePanel, usePanelStack } from './use-panel.js'
export { PanelHost } from './PanelHost.jsx'
export { usePanelCloseGuard } from './close-guard.js'
export { MAX_DEPTH } from './panel-stack.js'
export { PanelHeader } from './PanelHeader.jsx'
export { usePanelHeader, PanelHeaderStatus } from './header-context.js'
export { useUrlPanel } from './use-url-panel.js'
export { isPanelOnlyNavigation, awPanelOf, withPanelNavigationAllowed } from './panel-navigation.js'
export { StatusMenuBadge } from './StatusMenuBadge.jsx'
export { injectStyles } from './injectStyles.js'
import './styles.css' // ensures Vite extracts this into dist/panel/style.css during build
