import { jsx as A, jsxs as _, Fragment as Ee } from "react/jsx-runtime";
import { createContext as K, useContext as G, useCallback as S, useSyncExternalStore as Ue, useReducer as ve, useRef as p, useLayoutEffect as we, useEffect as R, useMemo as D, useState as Y } from "react";
import { createPortal as Me } from "react-dom";
const ze = 8;
let Fe = 0;
function Ie(e, n, r = {}) {
  return { key: `panel_${++Fe}`, type: e, seed: n, ownsHistory: !0, openedAtKey: "", openedAtPath: "", openedAtUrl: "", ...r };
}
function ye(e) {
  return e.length >= ze;
}
function ie(e, n) {
  switch (n.type) {
    case "open":
      return ye(e) ? e : [...e, n.entry];
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
const ee = (e) => {
  var r;
  const n = (r = e.state) == null ? void 0 : r.awPanel;
  return typeof n == "number" ? n : 0;
};
function sn(e, n) {
  return ne > 0 ? !0 : e.pathname === n.pathname && e.search === n.search && ee(e) !== ee(n);
}
let ne = 0;
function Oe(e) {
  ne++;
  try {
    return e();
  } finally {
    ne--;
  }
}
const ge = K(null), te = K(null), ke = 160, be = "(max-width: 767px)", xe = K({
  router: null,
  zBase: ke,
  mobileQuery: be,
  onMaxDepth: void 0
});
function re() {
  return G(xe);
}
const Z = /* @__PURE__ */ new Map();
let ue = null;
function de(e) {
  ue !== window.matchMedia && (Z.clear(), ue = window.matchMedia);
  let n = Z.get(e);
  return n || (n = window.matchMedia(e), Z.set(e, n)), n;
}
function Pe(e) {
  const n = S((r) => {
    const i = de(e);
    return i.addEventListener("change", r), () => i.removeEventListener("change", r);
  }, [e]);
  return Ue(n, () => de(e).matches, () => !1);
}
function Ce() {
  return Pe(re().mobileQuery);
}
function Se() {
  return Pe("(prefers-reduced-motion: reduce)");
}
const $ = ee, _e = 1e3, Be = (e) => !!e && typeof e == "object" && Object.values(e).some((n) => typeof n == "function"), Ne = (e) => {
  const n = e.findIndex((r, i) => !(i === 0 && !r.ownsHistory) && Be(r.seed));
  return n < 0 ? e : e.slice(0, n);
}, V = (e, n) => {
  const r = e.indexOf("?"), i = e.indexOf("#"), u = [r, i].filter((s) => s >= 0).sort((s, x) => s - x)[0] ?? e.length;
  return { ...n, pathname: e.slice(0, u), search: r >= 0 ? e.slice(r, i > r ? i : void 0) : "", hash: i >= 0 ? e.slice(i) : "", state: null };
};
function ln({ children: e, router: n, zBase: r = ke, mobileQuery: i = be, onMaxDepth: u }) {
  if (!n) throw new Error("<PanelStackProvider> 需要 router prop：{ useLocation, useNavigate, useNavigationType }");
  const { useLocation: s, useNavigate: x, useNavigationType: m } = n, [w, U] = ve(ie, []), l = p(w), h = S((t) => {
    l.current = ie(l.current, t), U(t);
  }, []), a = s(), H = m(), y = x(), E = p(a);
  we(() => {
    E.current = a;
  });
  const T = p(null), P = p(null), z = p(!1), v = p(null), g = p(!1), L = S((t) => {
    T.current = t;
  }, []), o = S((t, f) => {
    y({ pathname: t.pathname, search: t.search, hash: t.hash }, { state: { ...t.state, awPanel: f } });
  }, [y]), c = S((t, f = !0) => {
    const k = l.current.slice(t);
    k.length !== 0 && (h({ type: "closeTo", depth: t }), f && k.forEach((C) => {
      var b;
      return (b = C.onClosed) == null ? void 0 : b.call(C);
    }));
  }, [h]), d = S((t, f) => {
    v.current && clearTimeout(v.current), P.current = f, v.current = setTimeout(() => {
      P.current = null;
    }, _e), y(-t);
  }, [y]);
  R(() => () => {
    v.current && clearTimeout(v.current);
  }, []);
  const M = S((t, f, k) => {
    if (ye(l.current)) {
      u == null || u();
      return;
    }
    const C = E.current, b = (k == null ? void 0 : k.ownsHistory) !== !1;
    h({ type: "open", entry: Ie(t, f, { ownsHistory: b, onClosed: k == null ? void 0 : k.onClosed, openedAtKey: C.key, openedAtPath: C.pathname, openedAtUrl: C.pathname + C.search + C.hash }) }), b && o(C, l.current.length);
  }, [h, o, u]), B = S(() => {
    if (P.current !== null) return;
    const t = l.current, f = t[t.length - 1];
    f && (f.ownsHistory ? d(1, t.length - 1) : c(t.length - 1));
  }, [d, c]), oe = S(() => {
    if (P.current !== null) return !1;
    const t = l.current;
    if (t.length === 0) return !0;
    const f = t.filter((k) => k.ownsHistory).length;
    return f > 0 ? d(f, 0) : c(0), !0;
  }, [d, c]), ae = S(async (t) => {
    if (l.current.length === 0)
      return t == null || t(), !0;
    if (!(T.current ? await T.current(0) : !0)) {
      const C = l.current[0];
      if (C) {
        const b = V(C.replacedFrom ?? C.openedAtUrl, E.current), I = l.current.length;
        y({ pathname: b.pathname, search: b.search, hash: b.hash }, { replace: !0, state: I > 1 ? { awPanel: I } : null });
      }
      return !1;
    }
    return t == null || t(), c(0), !0;
  }, [y, c]), He = D(() => ({ openPanel: M, back: B, closeAll: oe, dismissAll: ae, registerGate: L }), [M, B, oe, ae, L]), Te = D(() => ({ stack: w, dispatch: U }), [w]), N = p(/* @__PURE__ */ new Map()), ce = p(a), se = p(w), W = p(null);
  R(() => {
    const t = ce.current;
    if (a.key !== t.key) {
      const f = a.pathname === t.pathname && $(a) !== $(t);
      if (W.current = null, H === "REPLACE" && a.pathname === t.pathname) {
        const k = t.pathname + t.search + t.hash, C = a.pathname + a.search + a.hash;
        l.current.forEach((b) => {
          b.openedAtUrl === k && (b.replacedFrom = b.replacedFrom ?? k, b.openedAtUrl = C);
        });
      }
      if (!f && !g.current) {
        const k = Ne(se.current);
        k.length > 0 ? N.current.set(t.key, k) : N.current.delete(t.key);
      }
      ce.current = a;
    }
    se.current = w;
  }, [a, w]), R(() => {
    if (g.current && H === "PUSH") {
      g.current = !1, l.current.forEach((f) => {
        f.openedAtKey = a.key;
      });
      return;
    }
    if (H !== "PUSH" || $(a) !== 0) return;
    const t = l.current;
    t.length === 0 || t.every((f) => f.openedAtKey === a.key) || h({ type: "closeAll" });
  }, [a, H, h]);
  const j = S(() => {
    const t = W.current, f = l.current;
    !t || t.key !== E.current.key || f.length !== 1 || f[0].ownsHistory || (W.current = null, N.current.delete(t.key), h({ type: "restore", stack: [f[0], ...t.rest] }));
  }, [h]);
  R(() => {
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
  }, [a.key, H, h, j]), R(() => {
    j();
  }, [w, j]), R(() => {
    var le;
    if (H !== "POP") return;
    const t = l.current;
    if (P.current !== null) {
      const q = P.current;
      P.current = null, v.current && clearTimeout(v.current), c(q);
      return;
    }
    if (t.length === 0) {
      if (!z.current) {
        z.current = !0;
        return;
      }
      $(a) > 0 && !((le = N.current.get(a.key)) != null && le.length) && y(-1);
      return;
    }
    if (z.current = !0, a.pathname !== t[0].openedAtPath) {
      (async () => {
        const q = t.length;
        if (T.current ? await T.current(0) : !0) {
          c(0);
          return;
        }
        const F = t[0], O = V(F.openedAtUrl, a);
        g.current = !0, y({ pathname: O.pathname, search: O.search, hash: O.hash });
        for (let Q = F.ownsHistory ? 1 : 2; Q <= q; Q++) o(O, Q);
      })();
      return;
    }
    const f = $(a), k = a.pathname + a.search + a.hash, C = !t[0].ownsHistory && t[0].openedAtUrl === k, b = f > 0 ? f : C ? 1 : 0, I = t.length;
    if (b !== I) {
      if (b > I) {
        y(-1);
        return;
      }
      (async () => {
        if (T.current ? await T.current(b) : !0) {
          c(b);
          return;
        }
        const X = t[0];
        if (!X.ownsHistory && X.openedAtUrl !== k) {
          const F = V(X.openedAtUrl, a);
          g.current = !0, I < 2 && y({ pathname: F.pathname, search: F.search, hash: F.hash });
          for (let O = Math.max(b, 1) + 1; O <= I; O++) o(F, O);
          return;
        }
        for (let F = b + 1; F <= I; F++) o(a, F);
      })();
    }
  }, [a.key, H]);
  const Le = D(() => ({ router: n, zBase: r, mobileQuery: i, onMaxDepth: u }), [n, r, i, u]);
  return /* @__PURE__ */ A(xe.Provider, { value: Le, children: /* @__PURE__ */ A(ge.Provider, { value: Te, children: /* @__PURE__ */ A(te.Provider, { value: He, children: e }) }) });
}
function Ge() {
  const e = G(te);
  if (!e) throw new Error("usePanel 必須在 <PanelStackProvider> 內使用");
  return e;
}
function We() {
  const e = G(ge);
  if (!e) throw new Error("usePanelStack 必須在 <PanelStackProvider> 內使用");
  return e;
}
async function $e(e) {
  for (const n of [...e]) if (!await n()) return !1;
  return !0;
}
const Ae = K(null);
function un(e) {
  const n = G(Ae), r = p(e);
  R(() => {
    r.current = e;
  });
  const i = e !== null;
  R(() => {
    if (!(!n || !i))
      return n.add(() => r.current ? r.current() : !0);
  }, [n, i]);
}
function De(e) {
  var n;
  return !!(((n = e.nativeEvent) == null ? void 0 : n.isComposing) ?? e.isComposing) || e.keyCode === 229;
}
function Ke(e) {
  return e.key === "Escape" && !De(e);
}
const fe = "calc(100% - 40px)";
function je(e) {
  for (let n = e; n && n !== document.body; n = n.parentElement) {
    const r = parseInt(getComputedStyle(n).zIndex, 10);
    if (!Number.isNaN(r)) return r;
  }
  return 0;
}
function qe(e) {
  return [...document.querySelectorAll('[aria-modal="true"]')].some((n) => je(n) > e);
}
const pe = "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])";
function Xe() {
  if (typeof document > "u") return 220;
  const e = getComputedStyle(document.documentElement).getPropertyValue("--aw-panel-motion").trim(), n = /^(\d*\.?\d+)(ms|s)$/i.exec(e);
  if (!n) return 220;
  const r = n[2].toLowerCase() === "s" ? parseFloat(n[1]) * 1e3 : parseFloat(n[1]);
  return Number.isFinite(r) ? r : 220;
}
const Ye = "min(560px, calc((100vw - var(--app-shell-sidebar-width, 0px)) * 0.52))", Qe = (e, n = 160) => n + e * 2, Ze = (e, n) => {
  const r = typeof e == "number" ? `${e}px` : e;
  return n === 0 ? r : `max(360px, calc(${r} * 0.93))`;
};
function Ve({ open: e, index: n, isTop: r, ariaLabel: i, children: u, onRequestClose: s, width: x = Ye }) {
  const [m, w] = Y(!1), U = p(null), l = p(null), h = p(null), a = p(r);
  R(() => {
    a.current = r;
  });
  const H = Ce(), y = Se(), E = Qe(n, re().zBase);
  we(() => {
    const v = l.current;
    v && (r ? v.removeAttribute("inert") : v.setAttribute("inert", ""));
  }, [r]), R(() => {
    h.current = document.activeElement;
    const v = requestAnimationFrame(() => w(!0)), g = setTimeout(() => {
      var L, o;
      a.current && ((o = (L = U.current) == null ? void 0 : L.querySelector(pe)) == null || o.focus({ preventScroll: !0 }));
    }, 60);
    return () => {
      cancelAnimationFrame(v), clearTimeout(g), h.current instanceof HTMLElement && h.current.isConnected && h.current.focus({ preventScroll: !0 });
    };
  }, []);
  const T = p(s);
  R(() => {
    T.current = s;
  }), R(() => {
    if (!r || !e) return;
    const v = (g) => {
      var d;
      if (g.defaultPrevented) return;
      if (Ke(g)) {
        if (qe(E + 1)) return;
        T.current();
        return;
      }
      if (g.key !== "Tab") return;
      const L = (d = U.current) == null ? void 0 : d.querySelectorAll(pe);
      if (!L || L.length === 0) return;
      const o = L[0], c = L[L.length - 1];
      g.shiftKey && document.activeElement === o ? (g.preventDefault(), c.focus()) : !g.shiftKey && document.activeElement === c && (g.preventDefault(), o.focus());
    };
    return document.addEventListener("keydown", v), () => document.removeEventListener("keydown", v);
  }, [r, e, E]);
  const P = e && m, z = y ? "none" : void 0;
  return Me(
    /* @__PURE__ */ _("div", { ref: l, "aria-hidden": r ? void 0 : !0, style: { position: "fixed", inset: 0, zIndex: E, pointerEvents: e ? void 0 : "none" }, children: [
      /* @__PURE__ */ A(
        "div",
        {
          onClick: () => {
            r && s();
          },
          "aria-hidden": "true",
          style: { position: "absolute", inset: 0, background: "var(--aw-panel-scrim)", opacity: P ? 1 : 0, transition: z ?? "opacity var(--aw-panel-motion) ease-out" }
        }
      ),
      /* @__PURE__ */ A(
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
            width: H ? n === 0 ? fe : `calc(${fe} * 0.93)` : Ze(x, n),
            // 手機同規則、不設 360 下限（會比螢幕寬）
            maxWidth: "100%",
            background: "var(--aw-panel-bg)",
            boxShadow: "var(--aw-panel-shadow)",
            borderRadius: "var(--aw-panel-radius)",
            transform: P ? "translateX(0)" : "translateX(100%)",
            transition: z ?? "transform var(--aw-panel-motion) var(--aw-panel-easing)"
          },
          children: u
        }
      )
    ] }),
    document.body
  );
}
function Je({ size: e = 14 }) {
  return /* @__PURE__ */ _("svg", { width: e, height: e, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": !0, children: [
    /* @__PURE__ */ A("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    /* @__PURE__ */ A("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ] });
}
const he = 20, en = "var(--aw-panel-hit)", J = 4;
function nn({ title: e, meta: n, backLabel: r, onBack: i, onClose: u, padX: s }) {
  const x = en, m = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    height: x,
    minWidth: x,
    display: "grid",
    placeItems: "center",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit"
  };
  return /* @__PURE__ */ _("header", { style: { padding: `var(--aw-panel-space-lg) ${s} ${J}px`, borderBottom: "1px solid var(--aw-panel-rule)", background: "var(--aw-panel-bg)" }, children: [
    /* @__PURE__ */ _("div", { style: { position: "relative", height: he, marginBottom: J }, children: [
      r !== void 0 && /* @__PURE__ */ _(
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
      /* @__PURE__ */ A(
        "button",
        {
          type: "button",
          className: "aw-panel-hit",
          onClick: u,
          "aria-label": "關閉",
          style: { ...m, right: `calc(-1 * (${x} - ${he}px) / 2)`, width: x, color: "var(--aw-panel-ink-subtle)" },
          children: /* @__PURE__ */ A(Je, { size: 16 })
        }
      )
    ] }),
    /* @__PURE__ */ _("h2", { style: { margin: 0, paddingBottom: J, fontSize: "var(--aw-panel-title-size)", fontWeight: 600, color: "var(--aw-panel-ink)", lineHeight: "var(--aw-panel-title-line-height)" }, children: [
      e,
      n && /* @__PURE__ */ A("span", { style: { marginLeft: "var(--aw-panel-space-sm)", fontSize: "var(--aw-panel-meta-size)", fontWeight: 400, color: "var(--aw-panel-meta-color)" }, children: n })
    ] })
  ] });
}
const Re = K(null);
function dn({ title: e, meta: n }) {
  const r = G(Re);
  R(() => {
    r == null || r.set({ title: e, meta: n });
  }, [r, e, n]);
}
function fn({ registry: e }) {
  const { stack: n } = We(), r = G(te), i = Se(), u = p(n);
  u.current = n;
  const s = n.length, [x, m] = Y(n), [w, U] = Y([]);
  if (x !== n) {
    const o = new Set(n.map((d) => d.key)), c = x.map((d, M) => ({ entry: d, index: M })).filter((d) => !o.has(d.entry.key));
    m(n), U([...w.filter((d) => !o.has(d.entry.key)), ...c]);
  }
  const l = p(/* @__PURE__ */ new Map());
  R(() => {
    if (w.length === 0) return;
    const o = w.map((d) => d.entry.key), c = setTimeout(() => {
      U((d) => d.filter((M) => !o.includes(M.entry.key))), o.forEach((d) => {
        u.current.some((M) => M.key === d) || l.current.delete(d);
      });
    }, i ? 0 : Xe());
    return () => clearTimeout(c);
  }, [w, i]);
  const h = s > 0 || w.length > 0;
  R(() => {
    if (!h) return;
    const o = document.body.style.overflow;
    return document.body.style.overflow = "hidden", () => {
      document.body.style.overflow = o;
    };
  }, [h]);
  const [, a] = ve((o) => o + 1, 0), H = S((o, c) => {
    const d = u.current.find((M) => M.key === o);
    !d || d.title === c || (d.title = c, a());
  }, []), y = S((o) => {
    let c = l.current.get(o);
    return c || (c = /* @__PURE__ */ new Set(), l.current.set(o, c)), c;
  }, []), E = p(!1), T = S(async (o) => {
    if (E.current) return !1;
    E.current = !0;
    try {
      const c = u.current, d = Math.max(0, Math.min(o ?? c.length - 1, c.length)), M = [];
      for (let B = c.length - 1; B >= d; B--) M.push(...l.current.get(c[B].key) ?? []);
      return await $e(M);
    } finally {
      E.current = !1;
    }
  }, []);
  R(() => (r.registerGate(T), () => r.registerGate(null)), [r, T]);
  const P = S(async (o, c) => {
    await T(o) && c();
  }, [T]), z = S(() => P(void 0, r.back), [P, r]), v = S(() => P(0, r.closeAll), [P, r]), g = S(() => {
    u.current.length > 1 ? z() : v();
  }, [z, v]), L = [
    ...w.map((o) => ({ ...o, open: !1 })),
    ...n.map((o, c) => ({ entry: o, index: c, open: !0 }))
  ];
  return /* @__PURE__ */ A(Ee, { children: L.map((o) => {
    var c;
    return /* @__PURE__ */ A(
      tn,
      {
        entry: o.entry,
        index: o.index,
        open: o.open,
        isTop: o.open && o.index === s - 1,
        backLabel: o.index > 0 ? ((c = u.current[o.index - 1]) == null ? void 0 : c.title) || "返回" : void 0,
        registryEntry: e[o.entry.type],
        actions: r,
        guards: y(o.entry.key),
        setTitle: H,
        closeTop: g,
        guardedBack: z,
        guardedCloseAll: v
      },
      o.entry.key
    );
  }) });
}
function tn({ entry: e, index: n, open: r, isTop: i, backLabel: u, registryEntry: s, actions: x, guards: m, setTitle: w, closeTop: U, guardedBack: l, guardedCloseAll: h }) {
  const H = Ce() ? "var(--aw-panel-pad-mobile)" : "var(--aw-panel-pad)", [y, E] = Y(null), T = D(() => ({ add: (o) => {
    const c = () => o();
    return m.add(c), () => {
      m.delete(c);
    };
  } }), [m]), P = e.key, z = D(() => ({ set: (o) => {
    w(P, o.title), E(o);
  } }), [P, w]), v = s == null ? void 0 : s.component, g = () => {
    r && l();
  }, L = () => {
    r && h();
  };
  return /* @__PURE__ */ A(Ve, { open: r, index: n, isTop: i, ariaLabel: (s == null ? void 0 : s.ariaLabel) ?? "詳情面板", width: s == null ? void 0 : s.width, onRequestClose: U, children: /* @__PURE__ */ A(Ae.Provider, { value: T, children: /* @__PURE__ */ A(Re.Provider, { value: z, children: /* @__PURE__ */ _("div", { style: { display: "flex", flexDirection: "column", flex: 1 }, children: [
    /* @__PURE__ */ A(
      nn,
      {
        title: (y == null ? void 0 : y.title) ?? (s == null ? void 0 : s.ariaLabel) ?? "詳情面板",
        meta: y == null ? void 0 : y.meta,
        backLabel: u,
        onBack: g,
        onClose: u !== void 0 ? g : L,
        padX: H
      }
    ),
    /* @__PURE__ */ A("div", { style: { flex: 1, padding: H }, children: v ? /* @__PURE__ */ A(v, { seed: e.seed, openPanel: x.openPanel, back: g, closeAll: L, canBack: u !== void 0 }) : /* @__PURE__ */ _("div", { style: { fontSize: "var(--aw-panel-body-size)", color: "var(--aw-panel-danger)" }, children: [
      "未註冊的面板型別：",
      e.type
    ] }) })
  ] }) }) }) });
}
function pn(e, n, r) {
  const i = Ge(), u = p(i), s = p(r), x = p(n == null ? void 0 : n.seed), m = p(null), w = p(null), U = re().router.useNavigationType(), l = p(U);
  R(() => {
    u.current = i, s.current = r, x.current = n == null ? void 0 : n.seed, l.current = U;
  });
  const h = (n == null ? void 0 : n.key) ?? null;
  R(() => {
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
    if (m.current && w.current === h) return;
    m.current && (m.current = null, u.current.closeAll());
    const a = {};
    m.current = a, w.current = h, u.current.openPanel(e, x.current, {
      ownsHistory: !1,
      onClosed: () => {
        m.current === a && (m.current = null, Oe(() => s.current()));
      }
    });
  }, [h, e]);
}
const rn = `/* aw-kit/panel — default appearance. Override any --aw-panel-* on :root (or a wrapper) to re-theme.
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
  --aw-panel-hit: 44px;
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
`, me = "awp-styles";
function hn() {
  if (typeof document > "u" || document.getElementById(me)) return;
  const e = document.createElement("style");
  e.id = me, e.textContent = rn, document.head.appendChild(e);
}
export {
  ze as MAX_DEPTH,
  nn as PanelHeader,
  fn as PanelHost,
  ln as PanelStackProvider,
  ee as awPanelOf,
  hn as injectStyles,
  sn as isPanelOnlyNavigation,
  Ge as usePanel,
  un as usePanelCloseGuard,
  dn as usePanelHeader,
  We as usePanelStack,
  pn as useUrlPanel,
  Oe as withPanelNavigationAllowed
};
