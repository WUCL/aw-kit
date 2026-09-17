import { jsx as l, jsxs as y, Fragment as I } from "react/jsx-runtime";
import { useState as S, useEffect as x, useCallback as w, useRef as h } from "react";
const j = /* @__PURE__ */ new Set();
let R = 0;
const q = /* @__PURE__ */ new Map(), $ = 300;
function N(n, t, { duration: d = 3500, action: s = null, key: r = null } = {}) {
  const e = r ?? `${n}:${t}`;
  if (!s) {
    const a = Date.now(), o = q.get(e);
    if (o != null && a - o < $) return;
    q.set(e, a);
  }
  const i = { id: ++R, type: n, message: t, duration: d, action: s, key: e };
  j.forEach((a) => a(i));
}
const T = {
  success(n, t) {
    N("success", n, t);
  },
  warn(n, t) {
    N("warn", n, { duration: 4e3, ...t });
  },
  error(n, t) {
    N("error", n, { duration: null, ...t });
  },
  subscribe(n) {
    return j.add(n), () => j.delete(n);
  }
};
let v = null;
function P(n) {
  return v = n, () => {
    v === n && (v = null);
  };
}
function W(n) {
  return v ? new Promise((t) => v(n, t)) : Promise.resolve(n != null && n.actions ? null : !1);
}
const B = `/* src/notify/styles.css — aw-kit/notify default theme.
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
  --fbk-warn: #fbbf24;          /* amber-400 */
  --fbk-warn-border: rgba(251, 191, 36, 0.35);
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
.fbk-toast--warn { border: 1px solid var(--fbk-warn-border); }

.fbk-toast__dot { width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0; background: var(--fbk-success); }
.fbk-toast--error .fbk-toast__dot { background: var(--fbk-error); }
.fbk-toast--warn .fbk-toast__dot { background: var(--fbk-warn); }

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
`, F = "fbk-styles";
function G() {
  if (typeof document > "u" || document.getElementById(F)) return;
  const n = document.createElement("style");
  n.id = F, n.textContent = B, document.head.appendChild(n);
}
const K = 3;
let A = 0;
function Y({ item: n, onClose: t }) {
  const [d, s] = S(!1), r = h(null), e = h(n.duration), i = h(0), a = n.duration == null, o = w(() => {
    a || (i.current = Date.now(), r.current = setTimeout(() => t(n.id), e.current));
  }, [n.id, t, a]), c = w(() => {
    a || (clearTimeout(r.current), e.current -= Date.now() - i.current);
  }, [a]);
  x(() => {
    const p = requestAnimationFrame(() => s(!0));
    return o(), () => {
      cancelAnimationFrame(p), clearTimeout(r.current);
    };
  }, [o]);
  const k = n.type === "error", _ = n.type === "warn", C = !!n.action, E = !C && !k;
  return /* @__PURE__ */ y(
    "div",
    {
      role: k || _ ? "alert" : "status",
      onMouseEnter: c,
      onMouseLeave: o,
      onClick: E ? () => t(n.id) : void 0,
      className: [
        "fbk-toast",
        k && "fbk-toast--error",
        _ && "fbk-toast--warn",
        E && "fbk-toast--clickable",
        d && "fbk-toast--shown"
      ].filter(Boolean).join(" "),
      children: [
        /* @__PURE__ */ l("div", { className: "fbk-toast__dot" }),
        /* @__PURE__ */ l("span", { className: "fbk-toast__message", children: n.message }),
        n.count > 1 && /* @__PURE__ */ y("span", { className: "fbk-toast__count", children: [
          "×",
          n.count
        ] }),
        C && /* @__PURE__ */ l(
          "button",
          {
            type: "button",
            className: "fbk-toast__action",
            onClick: (p) => {
              p.stopPropagation(), n.action.onClick(), t(n.id);
            },
            children: n.action.label
          }
        ),
        /* @__PURE__ */ l(
          "button",
          {
            type: "button",
            className: "fbk-toast__close",
            "aria-label": "關閉",
            onClick: (p) => {
              p.stopPropagation(), t(n.id);
            },
            children: "✕"
          }
        )
      ]
    }
  );
}
function J() {
  const [n, t] = S([]);
  x(() => {
    A > 0 && console.warn("[aw-kit/notify] ToastHost 已掛載超過一次——多個實例都會收到並各自渲染同一則通知（重複顯示），請確認只在 App 根層掛載一次"), A += 1;
    const s = T.subscribe((r) => {
      t((e) => {
        if (r.type === "error" || r.type === "warn") {
          const o = e.findIndex((c) => c.type === r.type && c.message === r.message);
          if (o !== -1) {
            const c = [...e];
            return c[o] = { ...c[o], count: (c[o].count || 1) + 1 }, c;
          }
        }
        const i = [...e, { ...r, count: 1 }], a = i.filter((o) => o.type === "success" && !o.action);
        if (a.length > K) {
          const o = a[0].id;
          return i.filter((c) => c.id !== o);
        }
        return i;
      });
    });
    return () => {
      s(), A -= 1;
    };
  }, []);
  const d = w((s) => t((r) => r.filter((e) => e.id !== s)), []);
  return /* @__PURE__ */ l("div", { "aria-live": "polite", className: "fbk-toast-container", children: n.map((s) => /* @__PURE__ */ l(Y, { item: s, onClose: d }, s.id)) });
}
const H = {
  primary: "fbk-btn--primary",
  secondary: "fbk-btn--secondary",
  danger: "fbk-btn--danger"
};
function z({ variant: n = "secondary", onClick: t, children: d, ...s }) {
  const r = H[n] || H.secondary;
  return /* @__PURE__ */ l("button", { type: "button", className: `fbk-btn ${r}`, onClick: t, ...s, children: d });
}
let D = 0;
function Q() {
  var M;
  const [n, t] = S(null), [d, s] = S(!1), r = h(null), e = h(null);
  x(() => {
    D > 0 && console.warn("[aw-kit/notify] ConfirmDialogHost 已掛載超過一次——最後掛載的實例會接管 confirm() 呼叫，行為不可預期，請確認只在 App 根層掛載一次"), D += 1;
    const f = P((u, b) => t({ opts: u, resolve: b }));
    return () => {
      f(), D -= 1;
    };
  }, []);
  const i = !!((M = n == null ? void 0 : n.opts) != null && M.actions), a = w((f) => {
    n == null || n.resolve(f), s(!1), setTimeout(() => t(null), 150);
  }, [n]), o = w(() => a(i ? null : !1), [a, i]);
  if (x(() => {
    if (!n) return;
    e.current = document.activeElement;
    const f = requestAnimationFrame(() => s(!0)), u = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const b = setTimeout(() => {
      var m, g;
      (g = (m = r.current) == null ? void 0 : m.querySelector("button:not([disabled])")) == null || g.focus();
    }, 60);
    return () => {
      cancelAnimationFrame(f), clearTimeout(b), document.body.style.overflow = u, e.current instanceof HTMLElement && document.body.contains(e.current) && e.current.focus();
    };
  }, [n]), x(() => {
    if (!n) return;
    const f = (u) => {
      var L;
      if (u.key === "Escape") {
        o();
        return;
      }
      if (u.key !== "Tab") return;
      const b = (L = r.current) == null ? void 0 : L.querySelectorAll("button:not([disabled])");
      if (!b || b.length === 0) return;
      const m = b[0], g = b[b.length - 1];
      u.shiftKey && document.activeElement === m ? (u.preventDefault(), g.focus()) : !u.shiftKey && document.activeElement === g && (u.preventDefault(), m.focus());
    };
    return document.addEventListener("keydown", f), () => document.removeEventListener("keydown", f);
  }, [n, o]), !n) return null;
  const { title: c, body: k, confirmLabel: _ = "確定", cancelLabel: C = "取消", variant: E = "primary", actions: p } = n.opts;
  return /* @__PURE__ */ y("div", { className: "fbk-dialog-overlay", children: [
    /* @__PURE__ */ l(
      "div",
      {
        onClick: o,
        "aria-hidden": "true",
        className: `fbk-dialog-backdrop ${d ? "fbk-dialog-backdrop--shown" : ""}`
      }
    ),
    /* @__PURE__ */ y(
      "div",
      {
        ref: r,
        role: "alertdialog",
        "aria-modal": "true",
        "aria-label": c,
        className: `fbk-dialog-panel ${d ? "fbk-dialog-panel--shown" : ""}`,
        children: [
          c && /* @__PURE__ */ l("h2", { className: "fbk-dialog-title", children: c }),
          k && /* @__PURE__ */ l("p", { className: "fbk-dialog-body", children: k }),
          /* @__PURE__ */ l("div", { className: "fbk-dialog-actions", children: p ? p.map((f) => /* @__PURE__ */ l(z, { variant: f.variant || "secondary", onClick: () => a(f.key), children: f.label }, f.key)) : /* @__PURE__ */ y(I, { children: [
            /* @__PURE__ */ l(z, { variant: "secondary", onClick: () => a(!1), children: C }),
            /* @__PURE__ */ l(z, { variant: E, onClick: () => a(!0), children: _ })
          ] }) })
        ]
      }
    )
  ] });
}
function O(n, t) {
  if (typeof n == "string" && n.trim()) return n;
  if (typeof n == "object" && n !== null) {
    if (typeof n.message == "string" && n.message.trim()) return n.message;
    if (typeof n.details == "string" && n.details.trim()) return n.details;
    if (typeof n.hint == "string" && n.hint.trim()) return n.hint;
    if (typeof n.code == "string" && n.code.trim()) return `錯誤代碼 ${n.code}`;
  }
  return t;
}
function U(n) {
  return typeof n == "object" && n !== null && typeof n.code == "string" && n.code.trim() ? n.code.trim() : null;
}
function Z({ refusalCodes: n, fallbackMessage: t = "操作失敗" }) {
  const d = new Set(n), s = {
    success(e, i) {
      T.success(e, i);
    },
    /** The user can fix this themselves, right now. Auto-dismisses. */
    warn(e, i) {
      T.warn(e, i);
    },
    /** The system couldn't do it / data may not be saved. **Persistent by design.** */
    error(e, i) {
      T.error(e, i);
    }
  };
  function r(e, i = t, a) {
    const o = U(e), c = O(e, i);
    o && d.has(o) ? s.warn(c, a) : s.error(c, a);
  }
  return { toast: s, toastFromError: r };
}
export {
  Q as ConfirmDialogHost,
  J as ToastHost,
  W as confirm,
  Z as createNotify,
  O as errText,
  G as injectStyles,
  P as registerConfirmHost,
  T as toast
};
