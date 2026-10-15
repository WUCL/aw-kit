import { jsx as S, jsxs as B, Fragment as Re } from "react/jsx-runtime";
import { createContext as $, useContext as G, useCallback as C, useSyncExternalStore as He, useReducer as fe, useRef as p, useLayoutEffect as pe, useEffect as A, useMemo as K, useState as Y } from "react";
import { createPortal as Te } from "react-dom";
const Le = 8;
let Ee = 0;
function Ue(e, n, r = {}) {
  return { key: `panel_${++Ee}`, type: e, seed: n, ownsHistory: !0, openedAtKey: "", openedAtPath: "", openedAtUrl: "", ...r };
}
function he(e) {
  return e.length >= Le;
}
function le(e, n) {
  switch (n.type) {
    case "open":
      return he(e) ? e : [...e, n.entry];
    case "back":
      return e.slice(0, -1);
    case "closeAll":
      return [];
    case "closeTo":
      return e.length > n.depth ? e.slice(0, Math.max(0, n.depth)) : e;
    case "restore":
      return n.stack;
  }
}
const J = (e) => {
  var r;
  const n = (r = e.state) == null ? void 0 : r.awPanel;
  return typeof n == "number" ? n : 0;
};
function on(e, n) {
  return ee > 0 ? !0 : e.pathname === n.pathname && e.search === n.search && J(e) !== J(n);
}
let ee = 0;
function ze(e) {
  ee++;
  try {
    return e();
  } finally {
    ee--;
  }
}
const me = $(null), ne = $(null), ve = 160, ye = "(max-width: 767px)", we = $({
  router: null,
  zBase: ve,
  mobileQuery: ye,
  onMaxDepth: void 0
});
function te() {
  return G(we);
}
function ge(e) {
  const n = C((r) => {
    const i = window.matchMedia(e);
    return i.addEventListener("change", r), () => i.removeEventListener("change", r);
  }, [e]);
  return He(n, () => window.matchMedia(e).matches, () => !1);
}
function ke() {
  return ge(te().mobileQuery);
}
function be() {
  return ge("(prefers-reduced-motion: reduce)");
}
const D = J, Ie = 1e3, Oe = (e) => !!e && typeof e == "object" && Object.values(e).some((n) => typeof n == "function"), Me = (e) => {
  const n = e.findIndex((r, i) => !(i === 0 && !r.ownsHistory) && Oe(r.seed));
  return n < 0 ? e : e.slice(0, n);
}, Z = (e, n) => {
  const r = e.indexOf("?"), i = e.indexOf("#"), u = [r, i].filter((s) => s >= 0).sort((s, R) => s - R)[0] ?? e.length;
  return { ...n, pathname: e.slice(0, u), search: r >= 0 ? e.slice(r, i > r ? i : void 0) : "", hash: i >= 0 ? e.slice(i) : "", state: null };
};
function an({ children: e, router: n, zBase: r = ve, mobileQuery: i = ye, onMaxDepth: u }) {
  if (!n) throw new Error("<PanelStackProvider> 需要 router prop：{ useLocation, useNavigate, useNavigationType }");
  const { useLocation: s, useNavigate: R, useNavigationType: m } = n, [y, U] = fe(le, []), l = p(y), h = C((t) => {
    l.current = le(l.current, t), U(t);
  }, []), a = s(), H = m(), w = R(), E = p(a);
  pe(() => {
    E.current = a;
  });
  const T = p(null), P = p(null), I = p(!1), v = p(null), g = p(!1), L = C((t) => {
    T.current = t;
  }, []), o = C((t, f) => {
    w({ pathname: t.pathname, search: t.search, hash: t.hash }, { state: { ...t.state, awPanel: f } });
  }, [w]), c = C((t, f = !0) => {
    const k = l.current.slice(t);
    k.length !== 0 && (h({ type: "closeTo", depth: t }), f && k.forEach((x) => {
      var b;
      return (b = x.onClosed) == null ? void 0 : b.call(x);
    }));
  }, [h]), d = C((t, f) => {
    v.current && clearTimeout(v.current), P.current = f, v.current = setTimeout(() => {
      P.current = null;
    }, Ie), w(-t);
  }, [w]);
  A(() => () => {
    v.current && clearTimeout(v.current);
  }, []);
  const z = C((t, f, k) => {
    if (he(l.current)) {
      u == null || u();
      return;
    }
    const x = E.current, b = (k == null ? void 0 : k.ownsHistory) !== !1;
    h({ type: "open", entry: Ue(t, f, { ownsHistory: b, onClosed: k == null ? void 0 : k.onClosed, openedAtKey: x.key, openedAtPath: x.pathname, openedAtUrl: x.pathname + x.search + x.hash }) }), b && o(x, l.current.length);
  }, [h, o, u]), F = C(() => {
    if (P.current !== null) return;
    const t = l.current, f = t[t.length - 1];
    f && (f.ownsHistory ? d(1, t.length - 1) : c(t.length - 1));
  }, [d, c]), re = C(() => {
    if (P.current !== null) return !1;
    const t = l.current;
    if (t.length === 0) return !0;
    const f = t.filter((k) => k.ownsHistory).length;
    return f > 0 ? d(f, 0) : c(0), !0;
  }, [d, c]), oe = C(async (t) => {
    if (l.current.length === 0)
      return t == null || t(), !0;
    if (!(T.current ? await T.current(0) : !0)) {
      const x = l.current[0];
      if (x) {
        const b = Z(x.replacedFrom ?? x.openedAtUrl, E.current), M = l.current.length;
        w({ pathname: b.pathname, search: b.search, hash: b.hash }, { replace: !0, state: M > 1 ? { awPanel: M } : null });
      }
      return !1;
    }
    return t == null || t(), c(0), !0;
  }, [w, c]), Ce = K(() => ({ openPanel: z, back: F, closeAll: re, dismissAll: oe, registerGate: L }), [z, F, re, oe, L]), Se = K(() => ({ stack: y, dispatch: U }), [y]), N = p(/* @__PURE__ */ new Map()), ae = p(a), ce = p(y), W = p(null);
  A(() => {
    const t = ae.current;
    if (a.key !== t.key) {
      const f = a.pathname === t.pathname && D(a) !== D(t);
      if (W.current = null, H === "REPLACE" && a.pathname === t.pathname) {
        const k = t.pathname + t.search + t.hash, x = a.pathname + a.search + a.hash;
        l.current.forEach((b) => {
          b.openedAtUrl === k && (b.replacedFrom = b.replacedFrom ?? k, b.openedAtUrl = x);
        });
      }
      if (!f && !g.current) {
        const k = Me(ce.current);
        k.length > 0 ? N.current.set(t.key, k) : N.current.delete(t.key);
      }
      ae.current = a;
    }
    ce.current = y;
  }, [a, y]), A(() => {
    if (g.current && H === "PUSH") {
      g.current = !1, l.current.forEach((f) => {
        f.openedAtKey = a.key;
      });
      return;
    }
    if (H !== "PUSH" || D(a) !== 0) return;
    const t = l.current;
    t.length === 0 || t.every((f) => f.openedAtKey === a.key) || h({ type: "closeAll" });
  }, [a, H, h]);
  const j = C(() => {
    const t = W.current, f = l.current;
    !t || t.key !== E.current.key || f.length !== 1 || f[0].ownsHistory || (W.current = null, N.current.delete(t.key), h({ type: "restore", stack: [f[0], ...t.rest] }));
  }, [h]);
  A(() => {
    if (H !== "POP") return;
    const t = N.current.get(a.key);
    if (l.current.length > 0) {
      t && t.length > 1 && !t[0].ownsHistory && l.current.length === 1 && (W.current = { key: a.key, rest: t.slice(1) }, j());
      return;
    }
    if (!(!t || t.length === 0)) {
      if (!t[0].ownsHistory) {
        t.length > 1 && (W.current = { key: a.key, rest: t.slice(1) });
        return;
      }
      N.current.delete(a.key), h({ type: "restore", stack: t });
    }
  }, [a.key, H, h, j]), A(() => {
    j();
  }, [y, j]), A(() => {
    var se;
    if (H !== "POP") return;
    const t = l.current;
    if (P.current !== null) {
      const X = P.current;
      P.current = null, v.current && clearTimeout(v.current), c(X);
      return;
    }
    if (t.length === 0) {
      if (!I.current) {
        I.current = !0;
        return;
      }
      D(a) > 0 && !((se = N.current.get(a.key)) != null && se.length) && w(-1);
      return;
    }
    if (I.current = !0, a.pathname !== t[0].openedAtPath) {
      (async () => {
        const X = t.length;
        if (T.current ? await T.current(0) : !0) {
          c(0);
          return;
        }
        const O = t[0], _ = Z(O.openedAtUrl, a);
        g.current = !0, w({ pathname: _.pathname, search: _.search, hash: _.hash });
        for (let Q = O.ownsHistory ? 1 : 2; Q <= X; Q++) o(_, Q);
      })();
      return;
    }
    const f = D(a), k = a.pathname + a.search + a.hash, x = !t[0].ownsHistory && t[0].openedAtUrl === k, b = f > 0 ? f : x ? 1 : 0, M = t.length;
    if (b !== M) {
      if (b > M) {
        w(-1);
        return;
      }
      (async () => {
        if (T.current ? await T.current(b) : !0) {
          c(b);
          return;
        }
        const q = t[0];
        if (!q.ownsHistory && q.openedAtUrl !== k) {
          const O = Z(q.openedAtUrl, a);
          g.current = !0, M < 2 && w({ pathname: O.pathname, search: O.search, hash: O.hash });
          for (let _ = Math.max(b, 1) + 1; _ <= M; _++) o(O, _);
          return;
        }
        for (let O = b + 1; O <= M; O++) o(a, O);
      })();
    }
  }, [a.key, H]);
  const Ae = K(() => ({ router: n, zBase: r, mobileQuery: i, onMaxDepth: u }), [n, r, i, u]);
  return /* @__PURE__ */ S(we.Provider, { value: Ae, children: /* @__PURE__ */ S(me.Provider, { value: Se, children: /* @__PURE__ */ S(ne.Provider, { value: Ce, children: e }) }) });
}
function _e() {
  const e = G(ne);
  if (!e) throw new Error("usePanel 必須在 <PanelStackProvider> 內使用");
  return e;
}
function Be() {
  const e = G(me);
  if (!e) throw new Error("usePanelStack 必須在 <PanelStackProvider> 內使用");
  return e;
}
async function Fe(e) {
  for (const n of [...e]) if (!await n()) return !1;
  return !0;
}
const Pe = $(null);
function cn(e) {
  const n = G(Pe), r = p(e);
  A(() => {
    r.current = e;
  });
  const i = e !== null;
  A(() => {
    if (!(!n || !i))
      return n.add(() => r.current ? r.current() : !0);
  }, [n, i]);
}
function Ne(e) {
  var n;
  return !!(((n = e.nativeEvent) == null ? void 0 : n.isComposing) ?? e.isComposing) || e.keyCode === 229;
}
function Ge(e) {
  return e.key === "Escape" && !Ne(e);
}
const ie = "calc(100% - 40px)";
function We(e) {
  for (let n = e; n && n !== document.body; n = n.parentElement) {
    const r = parseInt(getComputedStyle(n).zIndex, 10);
    if (!Number.isNaN(r)) return r;
  }
  return 0;
}
function De(e) {
  return [...document.querySelectorAll('[aria-modal="true"]')].some((n) => We(n) > e);
}
const ue = "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])";
function Ke() {
  if (typeof document > "u") return 220;
  const e = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--aw-panel-motion"));
  return Number.isFinite(e) && e >= 0 ? e : 220;
}
const $e = "min(560px, calc((100vw - var(--app-shell-sidebar-width, 0px)) * 0.52))", je = (e, n = 160) => n + e * 2, Xe = (e, n) => {
  const r = typeof e == "number" ? `${e}px` : e;
  return n === 0 ? r : `max(360px, calc(${r} * 0.93))`;
};
function qe({ open: e, index: n, isTop: r, ariaLabel: i, children: u, onRequestClose: s, width: R = $e }) {
  const [m, y] = Y(!1), U = p(null), l = p(null), h = p(null), a = p(r);
  A(() => {
    a.current = r;
  });
  const H = ke(), w = be(), E = je(n, te().zBase);
  pe(() => {
    const v = l.current;
    v && (r ? v.removeAttribute("inert") : v.setAttribute("inert", ""));
  }, [r]), A(() => {
    h.current = document.activeElement;
    const v = requestAnimationFrame(() => y(!0)), g = setTimeout(() => {
      var L, o;
      a.current && ((o = (L = U.current) == null ? void 0 : L.querySelector(ue)) == null || o.focus({ preventScroll: !0 }));
    }, 60);
    return () => {
      cancelAnimationFrame(v), clearTimeout(g), h.current instanceof HTMLElement && h.current.isConnected && h.current.focus({ preventScroll: !0 });
    };
  }, []);
  const T = p(s);
  A(() => {
    T.current = s;
  }), A(() => {
    if (!r || !e) return;
    const v = (g) => {
      var d;
      if (g.defaultPrevented) return;
      if (Ge(g)) {
        if (De(E + 1)) return;
        T.current();
        return;
      }
      if (g.key !== "Tab") return;
      const L = (d = U.current) == null ? void 0 : d.querySelectorAll(ue);
      if (!L || L.length === 0) return;
      const o = L[0], c = L[L.length - 1];
      g.shiftKey && document.activeElement === o ? (g.preventDefault(), c.focus()) : !g.shiftKey && document.activeElement === c && (g.preventDefault(), o.focus());
    };
    return document.addEventListener("keydown", v), () => document.removeEventListener("keydown", v);
  }, [r, e, E]);
  const P = e && m, I = w ? "none" : void 0;
  return Te(
    /* @__PURE__ */ B("div", { ref: l, "aria-hidden": r ? void 0 : !0, style: { position: "fixed", inset: 0, zIndex: E, pointerEvents: e ? void 0 : "none" }, children: [
      /* @__PURE__ */ S(
        "div",
        {
          onClick: () => {
            r && s();
          },
          "aria-hidden": "true",
          style: { position: "absolute", inset: 0, background: "var(--aw-panel-scrim)", opacity: P ? 1 : 0, transition: I ?? "opacity var(--aw-panel-motion) ease-out" }
        }
      ),
      /* @__PURE__ */ S(
        "div",
        {
          ref: U,
          role: "dialog",
          "aria-modal": r ? "true" : void 0,
          "aria-label": i,
          style: {
            position: "absolute",
            top: 0,
            bottom: "var(--aw-panel-offset-bottom)",
            right: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            zIndex: E + 1,
            width: H ? n === 0 ? ie : `calc(${ie} * 0.93)` : Xe(R, n),
            // 手機同規則、不設 360 下限（會比螢幕寬）
            maxWidth: "100%",
            background: "var(--aw-panel-bg)",
            boxShadow: "var(--aw-panel-shadow)",
            borderRadius: "var(--aw-panel-radius)",
            transform: P ? "translateX(0)" : "translateX(100%)",
            transition: I ?? "transform var(--aw-panel-motion) var(--aw-panel-easing)"
          },
          children: u
        }
      )
    ] }),
    document.body
  );
}
function Ye({ size: e = 14 }) {
  return /* @__PURE__ */ B("svg", { width: e, height: e, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": !0, children: [
    /* @__PURE__ */ S("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    /* @__PURE__ */ S("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ] });
}
const Qe = 20, Ze = 44, V = 4;
function Ve({ title: e, meta: n, backLabel: r, onBack: i, onClose: u, padX: s }) {
  const R = Ze, m = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    height: R,
    minWidth: R,
    display: "grid",
    placeItems: "center",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit"
  };
  return /* @__PURE__ */ B("header", { style: { padding: `var(--aw-panel-space-lg) ${s} ${V}px`, borderBottom: "1px solid var(--aw-panel-rule)", background: "var(--aw-panel-bg)" }, children: [
    /* @__PURE__ */ B("div", { style: { position: "relative", height: Qe, marginBottom: V }, children: [
      r !== void 0 && /* @__PURE__ */ B(
        "button",
        {
          type: "button",
          className: "aw-panel-hit",
          onClick: i,
          "aria-label": `返回${r}`,
          style: { ...m, left: "calc(-1 * var(--aw-panel-space-sm))", padding: "0 var(--aw-panel-space-sm)", color: "var(--aw-panel-back-color)", fontSize: "var(--aw-panel-meta-size)", fontWeight: 600 },
          children: [
            "‹ ",
            r
          ]
        }
      ),
      /* @__PURE__ */ S(
        "button",
        {
          type: "button",
          className: "aw-panel-hit",
          onClick: u,
          "aria-label": "關閉",
          style: { ...m, right: -24 / 2, width: R, color: "var(--aw-panel-ink-subtle)" },
          children: /* @__PURE__ */ S(Ye, { size: 16 })
        }
      )
    ] }),
    /* @__PURE__ */ B("h2", { style: { margin: 0, paddingBottom: V, fontSize: "var(--aw-panel-title-size)", fontWeight: 600, color: "var(--aw-panel-ink)", lineHeight: "var(--aw-panel-title-line-height)" }, children: [
      e,
      n && /* @__PURE__ */ S("span", { style: { marginLeft: "var(--aw-panel-space-sm)", fontSize: "var(--aw-panel-meta-size)", fontWeight: 400, color: "var(--aw-panel-meta-color)" }, children: n })
    ] })
  ] });
}
const xe = $(null);
function sn({ title: e, meta: n }) {
  const r = G(xe);
  A(() => {
    r == null || r.set({ title: e, meta: n });
  }, [r, e, n]);
}
function ln({ registry: e }) {
  const { stack: n } = Be(), r = G(ne), i = be(), u = p(n);
  u.current = n;
  const s = n.length, [R, m] = Y(n), [y, U] = Y([]);
  if (R !== n) {
    const o = new Set(n.map((d) => d.key)), c = R.map((d, z) => ({ entry: d, index: z })).filter((d) => !o.has(d.entry.key));
    m(n), U([...y.filter((d) => !o.has(d.entry.key)), ...c]);
  }
  const l = p(/* @__PURE__ */ new Map());
  A(() => {
    if (y.length === 0) return;
    const o = y.map((d) => d.entry.key), c = setTimeout(() => {
      U((d) => d.filter((z) => !o.includes(z.entry.key))), o.forEach((d) => {
        u.current.some((z) => z.key === d) || l.current.delete(d);
      });
    }, i ? 0 : Ke());
    return () => clearTimeout(c);
  }, [y, i]);
  const h = s > 0 || y.length > 0;
  A(() => {
    if (!h) return;
    const o = document.body.style.overflow;
    return document.body.style.overflow = "hidden", () => {
      document.body.style.overflow = o;
    };
  }, [h]);
  const [, a] = fe((o) => o + 1, 0), H = C((o, c) => {
    const d = u.current.find((z) => z.key === o);
    !d || d.title === c || (d.title = c, a());
  }, []), w = C((o) => {
    let c = l.current.get(o);
    return c || (c = /* @__PURE__ */ new Set(), l.current.set(o, c)), c;
  }, []), E = p(!1), T = C(async (o) => {
    if (E.current) return !1;
    E.current = !0;
    try {
      const c = u.current, d = Math.max(0, Math.min(o ?? c.length - 1, c.length)), z = [];
      for (let F = c.length - 1; F >= d; F--) z.push(...l.current.get(c[F].key) ?? []);
      return await Fe(z);
    } finally {
      E.current = !1;
    }
  }, []);
  A(() => (r.registerGate(T), () => r.registerGate(null)), [r, T]);
  const P = C(async (o, c) => {
    await T(o) && c();
  }, [T]), I = C(() => P(void 0, r.back), [P, r]), v = C(() => P(0, r.closeAll), [P, r]), g = C(() => {
    u.current.length > 1 ? I() : v();
  }, [I, v]), L = [
    ...y.map((o) => ({ ...o, open: !1 })),
    ...n.map((o, c) => ({ entry: o, index: c, open: !0 }))
  ];
  return /* @__PURE__ */ S(Re, { children: L.map((o) => {
    var c;
    return /* @__PURE__ */ S(
      Je,
      {
        entry: o.entry,
        index: o.index,
        open: o.open,
        isTop: o.open && o.index === s - 1,
        backLabel: o.index > 0 ? ((c = u.current[o.index - 1]) == null ? void 0 : c.title) || "返回" : void 0,
        registryEntry: e[o.entry.type],
        actions: r,
        guards: w(o.entry.key),
        setTitle: H,
        closeTop: g,
        guardedBack: I,
        guardedCloseAll: v
      },
      o.entry.key
    );
  }) });
}
function Je({ entry: e, index: n, open: r, isTop: i, backLabel: u, registryEntry: s, actions: R, guards: m, setTitle: y, closeTop: U, guardedBack: l, guardedCloseAll: h }) {
  const H = ke() ? "var(--aw-panel-pad-mobile)" : "var(--aw-panel-pad)", [w, E] = Y(null), T = K(() => ({ add: (o) => {
    const c = () => o();
    return m.add(c), () => {
      m.delete(c);
    };
  } }), [m]), P = e.key, I = K(() => ({ set: (o) => {
    y(P, o.title), E(o);
  } }), [P, y]), v = s == null ? void 0 : s.component, g = () => {
    r && l();
  }, L = () => {
    r && h();
  };
  return /* @__PURE__ */ S(qe, { open: r, index: n, isTop: i, ariaLabel: (s == null ? void 0 : s.ariaLabel) ?? "詳情面板", width: s == null ? void 0 : s.width, onRequestClose: U, children: /* @__PURE__ */ S(Pe.Provider, { value: T, children: /* @__PURE__ */ S(xe.Provider, { value: I, children: /* @__PURE__ */ B("div", { style: { display: "flex", flexDirection: "column", flex: 1 }, children: [
    /* @__PURE__ */ S(
      Ve,
      {
        title: (w == null ? void 0 : w.title) ?? (s == null ? void 0 : s.ariaLabel) ?? "詳情面板",
        meta: w == null ? void 0 : w.meta,
        backLabel: u,
        onBack: g,
        onClose: u !== void 0 ? g : L,
        padX: H
      }
    ),
    /* @__PURE__ */ S("div", { style: { flex: 1, padding: H }, children: v ? /* @__PURE__ */ S(v, { seed: e.seed, openPanel: R.openPanel, back: g, closeAll: L, canBack: u !== void 0 }) : /* @__PURE__ */ B("div", { style: { fontSize: "var(--aw-panel-body-size)", color: "var(--aw-panel-danger)" }, children: [
      "未註冊的面板型別：",
      e.type
    ] }) })
  ] }) }) }) });
}
function un(e, n, r) {
  const i = _e(), u = p(i), s = p(r), R = p(n == null ? void 0 : n.seed), m = p(null), y = p(null), U = te().router.useNavigationType(), l = p(U);
  A(() => {
    u.current = i, s.current = r, R.current = n == null ? void 0 : n.seed, l.current = U;
  });
  const h = (n == null ? void 0 : n.key) ?? null;
  A(() => {
    if (h === null) {
      if (m.current && l.current === "POP") return;
      if (m.current) {
        const H = m.current;
        u.current.dismissAll(() => {
          m.current === H && (m.current = null);
        });
      }
      return;
    }
    if (m.current && y.current === h) return;
    m.current && (m.current = null, u.current.closeAll());
    const a = {};
    m.current = a, y.current = h, u.current.openPanel(e, R.current, {
      ownsHistory: !1,
      onClosed: () => {
        m.current === a && (m.current = null, ze(() => s.current()));
      }
    });
  }, [h, e]);
}
const en = `/* aw-kit/panel — default appearance. Override any --aw-panel-* on :root (or a wrapper) to re-theme.
   Defaults follow aw-cc_workflow/templates/design-system-baseline.md (neutral system); see docs/panel.md §4. */
:root {
  --aw-panel-bg: #ffffff;
  --aw-panel-scrim: rgba(0, 0, 0, 0.3);
  --aw-panel-shadow: -8px 0 32px rgba(20, 24, 28, 0.10);
  --aw-panel-rule: #e3e3e3;
  --aw-panel-ink: #1a1a1a;
  --aw-panel-ink-subtle: #616161;
  --aw-panel-back-color: #4a4a4a;
  --aw-panel-focus: #303030;
  --aw-panel-notice-bg: #f0f0f0;
  --aw-panel-title-size: 20px;
  --aw-panel-radius: 0;
  --aw-panel-pad: 24px;
  --aw-panel-pad-mobile: 16px;
  --aw-panel-motion: 220ms;
  --aw-panel-easing: cubic-bezier(0.32, 0.72, 0, 1);
  --aw-panel-offset-bottom: 0px;
  /* additions beyond the original §4 table (documented there) */
  --aw-panel-meta-size: 13px;
  --aw-panel-meta-color: var(--aw-panel-ink-subtle);
  --aw-panel-title-line-height: 1.35;
  --aw-panel-body-size: 15px;
  --aw-panel-danger: #b42318;
  --aw-panel-space-sm: 8px;
  --aw-panel-space-lg: 16px;
}

.aw-panel-hit:focus-visible {
  outline: 2px solid var(--aw-panel-focus);
  outline-offset: -2px;
}
`, de = "awp-styles";
function dn() {
  if (typeof document > "u" || document.getElementById(de)) return;
  const e = document.createElement("style");
  e.id = de, e.textContent = en, document.head.appendChild(e);
}
export {
  Le as MAX_DEPTH,
  Ve as PanelHeader,
  ln as PanelHost,
  an as PanelStackProvider,
  J as awPanelOf,
  dn as injectStyles,
  on as isPanelOnlyNavigation,
  _e as usePanel,
  cn as usePanelCloseGuard,
  sn as usePanelHeader,
  Be as usePanelStack,
  un as useUrlPanel,
  ze as withPanelNavigationAllowed
};
