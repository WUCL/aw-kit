// src/notify/index.js — public API of aw-kit/notify
export { toast } from './toast.js'
export { confirm, registerConfirmHost } from './confirmDialog.js'
export { injectStyles } from './injectStyles.js'
export { default as ToastHost } from './ToastHost.jsx'
export { default as ConfirmDialogHost } from './ConfirmDialogHost.jsx'
export { createNotify, errText } from './createNotify.js'
import './styles.css' // ensures Vite extracts this into dist/notify/style.css during build
