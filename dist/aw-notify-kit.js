import { jsx as i, jsxs as p, Fragment as q } from "react/jsx-runtime";
import { useState as S, useEffect as v, useCallback as _, useRef as g } from "react";
const A = /* @__PURE__ */ new Set();
let P = 0;
const H = /* @__PURE__ */ new Map(), j = 300;
function I(e, t, { duration: f = 3500, action: c = null, key: r = null } = {}) {
  const s = r ?? t;
  if (!c) {
    const o = Date.now(), n = H.get(s);
    if (n != null && o - n < j) return;
    H.set(s, o);
  }
  const u = { id: ++P, type: e, message: t, duration: f, action: c, key: s };
  A.forEach((o) => o(u));
}
const K = {
  success(e, t) {
    I("success", e, t);
  },
  error(e, t) {
    I("error", e, { duration: null, ...t });
  },
  subscribe(e) {
    return A.add(e), () => A.delete(e);
  }
};
let w = null;
function B(e) {
  return w = e, () => {
    w === e && (w = null);
  };
}
function X(e) {
  return w ? new Promise((t) => w(e, t)) : Promise.resolve(e != null && e.actions ? null : !1);
}
const R = "fbk-styles", $ = `
:root {
  --fbk-accent: #7d6299;
  --fbk-accent-hover: #634d7d;
  --fbk-toast-bg: #1f2937;
  --fbk-toast-fg: #f9fafb;
  --fbk-success: #4ade80;
  --fbk-error: #f87171;
  --fbk-error-border: rgba(248, 113, 113, 0.35);
  --fbk-z-toast: 850;
  --fbk-z-dialog: 1000;
}
/* See src/styles.css for the full, authoritative rule set — this fallback carries the
   same rules; keep the two files in sync if the design changes. */
`;
function Y() {
  if (typeof document > "u" || document.getElementById(R)) return;
  const e = document.createElement("style");
  e.id = R, e.textContent = $, document.head.appendChild(e);
}
const z = 3;
let T = 0;
function U({ item: e, onClose: t }) {
  const [f, c] = S(!1), r = g(null), s = g(e.duration), u = g(0), o = e.duration == null, n = _(() => {
    o || (u.current = Date.now(), r.current = setTimeout(() => t(e.id), s.current));
  }, [e.id, t, o]), a = _(() => {
    o || (clearTimeout(r.current), s.current -= Date.now() - u.current);
  }, [o]);
  v(() => {
    const m = requestAnimationFrame(() => c(!0));
    return n(), () => {
      cancelAnimationFrame(m), clearTimeout(r.current);
    };
  }, [n]);
  const k = e.type === "error", C = !!e.action, E = !C && !k;
  return /* @__PURE__ */ p(
    "div",
    {
      role: k ? "alert" : "status",
      onMouseEnter: a,
      onMouseLeave: n,
      onClick: E ? () => t(e.id) : void 0,
      className: [
        "fbk-toast",
        k && "fbk-toast--error",
        E && "fbk-toast--clickable",
        f && "fbk-toast--shown"
      ].filter(Boolean).join(" "),
      children: [
        /* @__PURE__ */ i("div", { className: "fbk-toast__dot" }),
        /* @__PURE__ */ i("span", { className: "fbk-toast__message", children: e.message }),
        e.count > 1 && /* @__PURE__ */ p("span", { className: "fbk-toast__count", children: [
          "×",
          e.count
        ] }),
        C && /* @__PURE__ */ i(
          "button",
          {
            type: "button",
            className: "fbk-toast__action",
            onClick: (m) => {
              m.stopPropagation(), e.action.onClick(), t(e.id);
            },
            children: e.action.label
          }
        ),
        /* @__PURE__ */ i(
          "button",
          {
            type: "button",
            className: "fbk-toast__close",
            "aria-label": "關閉",
            onClick: (m) => {
              m.stopPropagation(), t(e.id);
            },
            children: "✕"
          }
        )
      ]
    }
  );
}
function G() {
  const [e, t] = S([]);
  v(() => {
    T > 0 && console.warn("[aw-notify-kit] ToastHost 已掛載超過一次，僅第一個實例會生效"), T += 1;
    const c = K.subscribe((r) => {
      t((s) => {
        if (r.type === "error") {
          const n = s.findIndex((a) => a.type === "error" && a.message === r.message);
          if (n !== -1) {
            const a = [...s];
            return a[n] = { ...a[n], count: (a[n].count || 1) + 1 }, a;
          }
        }
        const u = [...s, { ...r, count: 1 }], o = u.filter((n) => n.type === "success" && !n.action);
        if (o.length > z) {
          const n = o[0].id;
          return u.filter((a) => a.id !== n);
        }
        return u;
      });
    });
    return () => {
      c(), T -= 1;
    };
  }, []);
  const f = _((c) => t((r) => r.filter((s) => s.id !== c)), []);
  return /* @__PURE__ */ i("div", { "aria-live": "polite", className: "fbk-toast-container", children: e.map((c) => /* @__PURE__ */ i(U, { item: c, onClose: f }, c.id)) });
}
const F = {
  primary: "fbk-btn--primary",
  secondary: "fbk-btn--secondary",
  danger: "fbk-btn--danger"
};
function N({ variant: e = "secondary", onClick: t, children: f, ...c }) {
  const r = F[e] || F.secondary;
  return /* @__PURE__ */ i("button", { type: "button", className: `fbk-btn ${r}`, onClick: t, ...c, children: f });
}
let D = 0;
function J() {
  var x;
  const [e, t] = S(null), [f, c] = S(!1), r = g(null), s = g(null);
  v(() => {
    D > 0 && console.warn("[aw-notify-kit] ConfirmDialogHost 已掛載超過一次，僅第一個實例會生效"), D += 1;
    const l = B((d, b) => t({ opts: d, resolve: b }));
    return () => {
      l(), D -= 1;
    };
  }, []);
  const u = !!((x = e == null ? void 0 : e.opts) != null && x.actions), o = _((l) => {
    e == null || e.resolve(l), c(!1), setTimeout(() => t(null), 150);
  }, [e]), n = _(() => o(u ? null : !1), [o, u]);
  if (v(() => {
    if (!e) return;
    s.current = document.activeElement;
    const l = requestAnimationFrame(() => c(!0)), d = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const b = setTimeout(() => {
      var y, h;
      (h = (y = r.current) == null ? void 0 : y.querySelector("button:not([disabled])")) == null || h.focus();
    }, 60);
    return () => {
      cancelAnimationFrame(l), clearTimeout(b), document.body.style.overflow = d, s.current instanceof HTMLElement && document.body.contains(s.current) && s.current.focus();
    };
  }, [e]), v(() => {
    if (!e) return;
    const l = (d) => {
      var L;
      if (d.key === "Escape") {
        n();
        return;
      }
      if (d.key !== "Tab") return;
      const b = (L = r.current) == null ? void 0 : L.querySelectorAll("button:not([disabled])");
      if (!b || b.length === 0) return;
      const y = b[0], h = b[b.length - 1];
      d.shiftKey && document.activeElement === y ? (d.preventDefault(), h.focus()) : !d.shiftKey && document.activeElement === h && (d.preventDefault(), y.focus());
    };
    return document.addEventListener("keydown", l), () => document.removeEventListener("keydown", l);
  }, [e, n]), !e) return null;
  const { title: a, body: k, confirmLabel: C = "確定", cancelLabel: E = "取消", variant: m = "primary", actions: M } = e.opts;
  return /* @__PURE__ */ p("div", { className: "fbk-dialog-overlay", children: [
    /* @__PURE__ */ i(
      "div",
      {
        onClick: n,
        "aria-hidden": "true",
        className: `fbk-dialog-backdrop ${f ? "fbk-dialog-backdrop--shown" : ""}`
      }
    ),
    /* @__PURE__ */ p(
      "div",
      {
        ref: r,
        role: "alertdialog",
        "aria-modal": "true",
        "aria-label": a,
        className: `fbk-dialog-panel ${f ? "fbk-dialog-panel--shown" : ""}`,
        children: [
          a && /* @__PURE__ */ i("h2", { className: "fbk-dialog-title", children: a }),
          k && /* @__PURE__ */ i("p", { className: "fbk-dialog-body", children: k }),
          /* @__PURE__ */ i("div", { className: "fbk-dialog-actions", children: M ? M.map((l) => /* @__PURE__ */ i(N, { variant: l.variant || "secondary", onClick: () => o(l.key), children: l.label }, l.key)) : /* @__PURE__ */ p(q, { children: [
            /* @__PURE__ */ i(N, { variant: "secondary", onClick: () => o(!1), children: E }),
            /* @__PURE__ */ i(N, { variant: m, onClick: () => o(!0), children: C })
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
  Y as injectStyles,
  B as registerConfirmHost,
  K as toast
};
