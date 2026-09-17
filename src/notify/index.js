// src/index.js — public API
export { toast } from './toast.js'
export { confirm, registerConfirmHost } from './confirmDialog.js'
export { injectStyles } from './injectStyles.js'
export { default as ToastHost } from './ToastHost.jsx'
export { default as ConfirmDialogHost } from './ConfirmDialogHost.jsx'
import './styles.css' // ensures Vite extracts this into dist/style.css during build
