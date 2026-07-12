import { jsx as c, jsxs as x, Fragment as I } from "react/jsx-runtime";
import { useState as E, useEffect as y, useCallback as w, useRef as h } from "react";
const A = /* @__PURE__ */ new Set();
let R = 0;
const L = /* @__PURE__ */ new Map(), F = 300;
function j(n, e, { duration: d = 3500, action: s = null, key: r = null } = {}) {
  const a = r ?? e;
  if (!s) {
    const o = Date.now(), t = L.get(a);
    if (t != null && o - t < F) return;
    L.set(a, o);
  }
  const f = { id: ++R, type: n, message: e, duration: d, action: s, key: a };
  A.forEach((o) => o(f));
}
const P = {
  success(n, e) {
    j("success", n, e);
  },
  error(n, e) {
    j("error", n, { duration: null, ...e });
  },
  subscribe(n) {
    return A.add(n), () => A.delete(n);
  }
};
let v = null;
function B(n) {
  return v = n, () => {
    v === n && (v = null);
  };
}
function X(n) {
  return v ? new Promise((e) => v(n, e)) : Promise.resolve(n != null && n.actions ? null : !1);
}
const K = `/* src/styles.css — aw-notify-kit default theme.
   All rules are scoped under the fbk- prefix to avoid colliding with consumer styles.
   Override --fbk-* custom properties to re-theme without touching these rules. */

:root {
  --fbk-accent: #7d6299;        /* brand-600 equivalent, used for primary buttons / undo action */
  --fbk-accent-hover: #634d7d;  /* brand-700 equivalent */
  --fbk-toast-bg: #1f2937;      /* gray-800 */
  --fbk-toast-fg: #f9fafb;      /* gray-50 */
  --fbk-success: #4ade80;       /* green-400 */
  --fbk-error: #f87171;         /* red-400 */
  --fbk-error-border: rgba(248, 113, 113, 0.35);
  --fbk-z-toast: 850;
  --fbk-z-dialog: 1000;
}

/* ---------- Toast ---------- */

.fbk-toast-container {
  position: fixed;
  z-index: var(--fbk-z-toast);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
}

.fbk-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--fbk-toast-bg);
  color: var(--fbk-toast-fg);
  font-size: 14px;
  border-radius: 8px;
  padding: 10px 16px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2);
  max-width: min(88vw, 384px);
  transition: opacity 300ms ease-out, transform 300ms ease-out;
  opacity: 0;
  transform: translateY(12px);
}

.fbk-toast--shown { opacity: 1; transform: translateY(0); }
.fbk-toast--clickable { cursor: pointer; }
.fbk-toast--error { border: 1px solid var(--fbk-error-border); }

.fbk-toast__dot { width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0; background: var(--fbk-success); }
.fbk-toast--error .fbk-toast__dot { background: var(--fbk-error); }

.fbk-toast__message { flex: 1; line-height: 1.4; word-break: break-word; }

.fbk-toast__count {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255,255,255,0.15);
  border-radius: 999px;
  padding: 1px 6px;
}

.fbk-toast__action {
  flex-shrink: 0;
  font-weight: 700;
  color: var(--fbk-accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
}
.fbk-toast__action:hover { color: var(--fbk-accent-hover); }

.fbk-toast__close {
  flex-shrink: 0;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 0 2px;
}
.fbk-toast__close:hover { color: #d1d5db; }

/* ---------- ConfirmDialog ---------- */

.fbk-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--fbk-z-dialog);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.fbk-dialog-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  transition: opacity 150ms ease-out;
  opacity: 0;
}
.fbk-dialog-backdrop--shown { opacity: 1; }

.fbk-dialog-panel {
  position: relative;
  width: 100%;
  max-width: 384px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: opacity 150ms ease-out, transform 150ms ease-out;
  opacity: 0;
  transform: scale(0.95);
}
.fbk-dialog-panel--shown { opacity: 1; transform: scale(1); }

.fbk-dialog-title { margin: 0; font-size: 16px; font-weight: 600; color: #111827; }
.fbk-dialog-body { margin: 0; font-size: 14px; color: #4b5563; white-space: pre-line; line-height: 1.6; }

.fbk-dialog-actions {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

/* ---------- Button ---------- */

.fbk-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 150ms, color 150ms, border-color 150ms;
}

.fbk-btn--primary {
  background: var(--fbk-accent);
  color: #fff;
  border: none;
}
.fbk-btn--primary:hover { background: var(--fbk-accent-hover); }

.fbk-btn--secondary {
  background: #fff;
  color: #374151;
  border: 1px solid #e5e7eb;
}
.fbk-btn--secondary:hover { background: #f9fafb; }

.fbk-btn--danger {
  background: #fff;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.fbk-btn--danger:hover { background: #fef2f2; }

@media (prefers-reduced-motion: reduce) {
  .fbk-toast, .fbk-dialog-backdrop, .fbk-dialog-panel { transition: none; }
}
`, q = "fbk-styles";
function V() {
  if (typeof document > "u" || document.getElementById(q)) return;
  const n = document.createElement("style");
  n.id = q, n.textContent = K, document.head.appendChild(n);
}
const Y = 3;
let T = 0;
function $({ item: n, onClose: e }) {
  const [d, s] = E(!1), r = h(null), a = h(n.duration), f = h(0), o = n.duration == null, t = w(() => {
    o || (f.current = Date.now(), r.current = setTimeout(() => e(n.id), a.current));
  }, [n.id, e, o]), i = w(() => {
    o || (clearTimeout(r.current), a.current -= Date.now() - f.current);
  }, [o]);
  y(() => {
    const p = requestAnimationFrame(() => s(!0));
    return t(), () => {
      cancelAnimationFrame(p), clearTimeout(r.current);
    };
  }, [t]);
  const k = n.type === "error", _ = !!n.action, C = !_ && !k;
  return /* @__PURE__ */ x(
    "div",
    {
      role: k ? "alert" : "status",
      onMouseEnter: i,
      onMouseLeave: t,
      onClick: C ? () => e(n.id) : void 0,
      className: [
        "fbk-toast",
        k && "fbk-toast--error",
        C && "fbk-toast--clickable",
        d && "fbk-toast--shown"
      ].filter(Boolean).join(" "),
      children: [
        /* @__PURE__ */ c("div", { className: "fbk-toast__dot" }),
        /* @__PURE__ */ c("span", { className: "fbk-toast__message", children: n.message }),
        n.count > 1 && /* @__PURE__ */ x("span", { className: "fbk-toast__count", children: [
          "×",
          n.count
        ] }),
        _ && /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            className: "fbk-toast__action",
            onClick: (p) => {
              p.stopPropagation(), n.action.onClick(), e(n.id);
            },
            children: n.action.label
          }
        ),
        /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            className: "fbk-toast__close",
            "aria-label": "關閉",
            onClick: (p) => {
              p.stopPropagation(), e(n.id);
            },
            children: "✕"
          }
        )
      ]
    }
  );
}
function G() {
  const [n, e] = E([]);
  y(() => {
    T > 0 && console.warn("[aw-notify-kit] ToastHost 已掛載超過一次——多個實例都會收到並各自渲染同一則通知（重複顯示），請確認只在 App 根層掛載一次"), T += 1;
    const s = P.subscribe((r) => {
      e((a) => {
        if (r.type === "error") {
          const t = a.findIndex((i) => i.type === "error" && i.message === r.message);
          if (t !== -1) {
            const i = [...a];
            return i[t] = { ...i[t], count: (i[t].count || 1) + 1 }, i;
          }
        }
        const f = [...a, { ...r, count: 1 }], o = f.filter((t) => t.type === "success" && !t.action);
        if (o.length > Y) {
          const t = o[0].id;
          return f.filter((i) => i.id !== t);
        }
        return f;
      });
    });
    return () => {
      s(), T -= 1;
    };
  }, []);
  const d = w((s) => e((r) => r.filter((a) => a.id !== s)), []);
  return /* @__PURE__ */ c("div", { "aria-live": "polite", className: "fbk-toast-container", children: n.map((s) => /* @__PURE__ */ c($, { item: s, onClose: d }, s.id)) });
}
const H = {
  primary: "fbk-btn--primary",
  secondary: "fbk-btn--secondary",
  danger: "fbk-btn--danger"
};
function S({ variant: n = "secondary", onClick: e, children: d, ...s }) {
  const r = H[n] || H.secondary;
  return /* @__PURE__ */ c("button", { type: "button", className: `fbk-btn ${r}`, onClick: e, ...s, children: d });
}
let N = 0;
function J() {
  var D;
  const [n, e] = E(null), [d, s] = E(!1), r = h(null), a = h(null);
  y(() => {
    N > 0 && console.warn("[aw-notify-kit] ConfirmDialogHost 已掛載超過一次——最後掛載的實例會接管 confirm() 呼叫，行為不可預期，請確認只在 App 根層掛載一次"), N += 1;
    const l = B((u, b) => e({ opts: u, resolve: b }));
    return () => {
      l(), N -= 1;
    };
  }, []);
  const f = !!((D = n == null ? void 0 : n.opts) != null && D.actions), o = w((l) => {
    n == null || n.resolve(l), s(!1), setTimeout(() => e(null), 150);
  }, [n]), t = w(() => o(f ? null : !1), [o, f]);
  if (y(() => {
    if (!n) return;
    a.current = document.activeElement;
    const l = requestAnimationFrame(() => s(!0)), u = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const b = setTimeout(() => {
      var m, g;
      (g = (m = r.current) == null ? void 0 : m.querySelector("button:not([disabled])")) == null || g.focus();
    }, 60);
    return () => {
      cancelAnimationFrame(l), clearTimeout(b), document.body.style.overflow = u, a.current instanceof HTMLElement && document.body.contains(a.current) && a.current.focus();
    };
  }, [n]), y(() => {
    if (!n) return;
    const l = (u) => {
      var M;
      if (u.key === "Escape") {
        t();
        return;
      }
      if (u.key !== "Tab") return;
      const b = (M = r.current) == null ? void 0 : M.querySelectorAll("button:not([disabled])");
      if (!b || b.length === 0) return;
      const m = b[0], g = b[b.length - 1];
      u.shiftKey && document.activeElement === m ? (u.preventDefault(), g.focus()) : !u.shiftKey && document.activeElement === g && (u.preventDefault(), m.focus());
    };
    return document.addEventListener("keydown", l), () => document.removeEventListener("keydown", l);
  }, [n, t]), !n) return null;
  const { title: i, body: k, confirmLabel: _ = "確定", cancelLabel: C = "取消", variant: p = "primary", actions: z } = n.opts;
  return /* @__PURE__ */ x("div", { className: "fbk-dialog-overlay", children: [
    /* @__PURE__ */ c(
      "div",
      {
        onClick: t,
        "aria-hidden": "true",
        className: `fbk-dialog-backdrop ${d ? "fbk-dialog-backdrop--shown" : ""}`
      }
    ),
    /* @__PURE__ */ x(
      "div",
      {
        ref: r,
        role: "alertdialog",
        "aria-modal": "true",
        "aria-label": i,
        className: `fbk-dialog-panel ${d ? "fbk-dialog-panel--shown" : ""}`,
        children: [
          i && /* @__PURE__ */ c("h2", { className: "fbk-dialog-title", children: i }),
          k && /* @__PURE__ */ c("p", { className: "fbk-dialog-body", children: k }),
          /* @__PURE__ */ c("div", { className: "fbk-dialog-actions", children: z ? z.map((l) => /* @__PURE__ */ c(S, { variant: l.variant || "secondary", onClick: () => o(l.key), children: l.label }, l.key)) : /* @__PURE__ */ x(I, { children: [
            /* @__PURE__ */ c(S, { variant: "secondary", onClick: () => o(!1), children: C }),
            /* @__PURE__ */ c(S, { variant: p, onClick: () => o(!0), children: _ })
          ] }) })
        ]
      }
    )
  ] });
}
export {
  J as ConfirmDialogHost,
  G as ToastHost,
  X as confirm,
  V as injectStyles,
  B as registerConfirmHost,
  P as toast
};
