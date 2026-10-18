import { jsx as y, jsxs as D, Fragment as Me } from "react/jsx-runtime";
import { createContext as W, useContext as $, useCallback as T, useSyncExternalStore as Ue, useReducer as we, useRef as g, useLayoutEffect as be, useEffect as E, useMemo as j, useState as _, useId as De } from "react";
import { createPortal as ge } from "react-dom";
const Fe = 8;
let Oe = 0;
function Be(e, n, r = {}) {
  return { key: `panel_${++Oe}`, type: e, seed: n, ownsHistory: !0, openedAtKey: "", openedAtPath: "", openedAtUrl: "", ...r };
}
function ve(e) {
  return e.length >= Fe;
}
function ie(e, n) {
  switch (n.type) {
    case "open":
      return ve(e) ? e : [...e, n.entry];
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
function pn(e, n) {
  return ne > 0 ? !0 : e.pathname === n.pathname && e.search === n.search && ee(e) !== ee(n);
}
let ne = 0;
function _e(e) {
  ne++;
  try {
    return e();
  } finally {
    ne--;
  }
}
const ye = W(null), te = W(null), ke = 160, xe = "(max-width: 767px)", Pe = W({
  router: null,
  zBase: ke,
  mobileQuery: xe,
  onMaxDepth: void 0
});
function re() {
  return $(Pe);
}
const Z = /* @__PURE__ */ new Map();
let ue = null;
function de(e) {
  ue !== window.matchMedia && (Z.clear(), ue = window.matchMedia);
  let n = Z.get(e);
  return n || (n = window.matchMedia(e), Z.set(e, n)), n;
}
function Se(e) {
  const n = T((r) => {
    const p = de(e);
    return p.addEventListener("change", r), () => p.removeEventListener("change", r);
  }, [e]);
  return Ue(n, () => de(e).matches, () => !1);
}
function Ce() {
  return Se(re().mobileQuery);
}
function Ae() {
  return Se("(prefers-reduced-motion: reduce)");
}
const K = ee, $e = 1e3, Ne = (e) => !!e && typeof e == "object" && Object.values(e).some((n) => typeof n == "function"), We = (e) => {
  const n = e.findIndex((r, p) => !(p === 0 && !r.ownsHistory) && Ne(r.seed));
  return n < 0 ? e : e.slice(0, n);
}, V = (e, n) => {
  const r = e.indexOf("?"), p = e.indexOf("#"), h = [r, p].filter((u) => u >= 0).sort((u, x) => u - x)[0] ?? e.length;
  return { ...n, pathname: e.slice(0, h), search: r >= 0 ? e.slice(r, p > r ? p : void 0) : "", hash: p >= 0 ? e.slice(p) : "", state: null };
};
function hn({ children: e, router: n, zBase: r = ke, mobileQuery: p = xe, onMaxDepth: h }) {
  if (!n) throw new Error("<PanelStackProvider> 需要 router prop：{ useLocation, useNavigate, useNavigationType }");
  const { useLocation: u, useNavigate: x, useNavigationType: d } = n, [m, L] = we(ie, []), f = g(m), w = T((t) => {
    f.current = ie(f.current, t), L(t);
  }, []), c = u(), A = d(), k = x(), I = g(c);
  be(() => {
    I.current = c;
  });
  const R = g(null), H = g(null), M = g(!1), b = g(null), a = g(!1), l = T((t) => {
    R.current = t;
  }, []), o = T((t, v) => {
    k({ pathname: t.pathname, search: t.search, hash: t.hash }, { state: { ...t.state, awPanel: v } });
  }, [k]), s = T((t, v = !0) => {
    const S = f.current.slice(t);
    S.length !== 0 && (w({ type: "closeTo", depth: t }), v && S.forEach((z) => {
      var C;
      return (C = z.onClosed) == null ? void 0 : C.call(z);
    }));
  }, [w]), i = T((t, v) => {
    b.current && clearTimeout(b.current), H.current = v, b.current = setTimeout(() => {
      H.current = null;
    }, $e), k(-t);
  }, [k]);
  E(() => () => {
    b.current && clearTimeout(b.current);
  }, []);
  const P = T((t, v, S) => {
    if (ve(f.current)) {
      h == null || h();
      return;
    }
    const z = I.current, C = (S == null ? void 0 : S.ownsHistory) !== !1;
    w({ type: "open", entry: Be(t, v, { ownsHistory: C, onClosed: S == null ? void 0 : S.onClosed, openedAtKey: z.key, openedAtPath: z.pathname, openedAtUrl: z.pathname + z.search + z.hash }) }), C && o(z, f.current.length);
  }, [w, o, h]), F = T(() => {
    if (H.current !== null) return;
    const t = f.current, v = t[t.length - 1];
    v && (v.ownsHistory ? i(1, t.length - 1) : s(t.length - 1));
  }, [i, s]), ae = T(() => {
    if (H.current !== null) return !1;
    const t = f.current;
    if (t.length === 0) return !0;
    const v = t.filter((S) => S.ownsHistory).length;
    return v > 0 ? i(v, 0) : s(0), !0;
  }, [i, s]), oe = T(async (t) => {
    if (f.current.length === 0)
      return t == null || t(), !0;
    if (!(R.current ? await R.current(0) : !0)) {
      const z = f.current[0];
      if (z) {
        const C = V(z.replacedFrom ?? z.openedAtUrl, I.current), O = f.current.length;
        k({ pathname: C.pathname, search: C.search, hash: C.hash }, { replace: !0, state: O > 1 ? { awPanel: O } : null });
      }
      return !1;
    }
    return t == null || t(), s(0), !0;
  }, [k, s]), ze = j(() => ({ openPanel: P, back: F, closeAll: ae, dismissAll: oe, registerGate: l }), [P, F, ae, oe, l]), Te = j(() => ({ stack: m, dispatch: L }), [m]), N = g(/* @__PURE__ */ new Map()), se = g(c), ce = g(m), G = g(null);
  E(() => {
    const t = se.current;
    if (c.key !== t.key) {
      const v = c.pathname === t.pathname && K(c) !== K(t);
      if (G.current = null, A === "REPLACE" && c.pathname === t.pathname) {
        const S = t.pathname + t.search + t.hash, z = c.pathname + c.search + c.hash;
        f.current.forEach((C) => {
          C.openedAtUrl === S && (C.replacedFrom = C.replacedFrom ?? S, C.openedAtUrl = z);
        });
      }
      if (!v && !a.current) {
        const S = We(ce.current);
        S.length > 0 ? N.current.set(t.key, S) : N.current.delete(t.key);
      }
      se.current = c;
    }
    ce.current = m;
  }, [c, m]), E(() => {
    if (a.current && A === "PUSH") {
      a.current = !1, f.current.forEach((v) => {
        v.openedAtKey = c.key;
      });
      return;
    }
    if (A !== "PUSH" || K(c) !== 0) return;
    const t = f.current;
    t.length === 0 || t.every((v) => v.openedAtKey === c.key) || w({ type: "closeAll" });
  }, [c, A, w]);
  const q = T(() => {
    const t = G.current, v = f.current;
    !t || t.key !== I.current.key || v.length !== 1 || v[0].ownsHistory || (G.current = null, N.current.delete(t.key), w({ type: "restore", stack: [v[0], ...t.rest] }));
  }, [w]);
  E(() => {
    if (A !== "POP") return;
    const t = N.current.get(c.key);
    if (f.current.length > 0) {
      t && t.length > 1 && !t[0].ownsHistory && f.current.length === 1 && (G.current = { key: c.key, rest: t.slice(1) }, q());
      return;
    }
    if (!(!t || t.length === 0)) {
      if (!t[0].ownsHistory) {
        t.length > 1 && (G.current = { key: c.key, rest: t.slice(1) });
        return;
      }
      N.current.delete(c.key), w({ type: "restore", stack: t });
    }
  }, [c.key, A, w, q]), E(() => {
    q();
  }, [m, q]), E(() => {
    var le;
    if (A !== "POP") return;
    const t = f.current;
    if (H.current !== null) {
      const X = H.current;
      H.current = null, b.current && clearTimeout(b.current), s(X);
      return;
    }
    if (t.length === 0) {
      if (!M.current) {
        M.current = !0;
        return;
      }
      K(c) > 0 && !((le = N.current.get(c.key)) != null && le.length) && k(-1);
      return;
    }
    if (M.current = !0, c.pathname !== t[0].openedAtPath) {
      (async () => {
        const X = t.length;
        if (R.current ? await R.current(0) : !0) {
          s(0);
          return;
        }
        const U = t[0], B = V(U.openedAtUrl, c);
        a.current = !0, k({ pathname: B.pathname, search: B.search, hash: B.hash });
        for (let Q = U.ownsHistory ? 1 : 2; Q <= X; Q++) o(B, Q);
      })();
      return;
    }
    const v = K(c), S = c.pathname + c.search + c.hash, z = !t[0].ownsHistory && t[0].openedAtUrl === S, C = v > 0 ? v : z ? 1 : 0, O = t.length;
    if (C !== O) {
      if (C > O) {
        k(-1);
        return;
      }
      (async () => {
        if (R.current ? await R.current(C) : !0) {
          s(C);
          return;
        }
        const Y = t[0];
        if (!Y.ownsHistory && Y.openedAtUrl !== S) {
          const U = V(Y.openedAtUrl, c);
          a.current = !0, O < 2 && k({ pathname: U.pathname, search: U.search, hash: U.hash });
          for (let B = Math.max(C, 1) + 1; B <= O; B++) o(U, B);
          return;
        }
        for (let U = C + 1; U <= O; U++) o(c, U);
      })();
    }
  }, [c.key, A]);
  const Ie = j(() => ({ router: n, zBase: r, mobileQuery: p, onMaxDepth: h }), [n, r, p, h]);
  return /* @__PURE__ */ y(Pe.Provider, { value: Ie, children: /* @__PURE__ */ y(ye.Provider, { value: Te, children: /* @__PURE__ */ y(te.Provider, { value: ze, children: e }) }) });
}
function Ge() {
  const e = $(te);
  if (!e) throw new Error("usePanel 必須在 <PanelStackProvider> 內使用");
  return e;
}
function Ke() {
  const e = $(ye);
  if (!e) throw new Error("usePanelStack 必須在 <PanelStackProvider> 內使用");
  return e;
}
async function je(e) {
  for (const n of [...e]) if (!await n()) return !1;
  return !0;
}
const Re = W(null);
function mn(e) {
  const n = $(Re), r = g(e);
  E(() => {
    r.current = e;
  });
  const p = e !== null;
  E(() => {
    if (!(!n || !p))
      return n.add(() => r.current ? r.current() : !0);
  }, [n, p]);
}
function qe(e) {
  var n;
  return !!(((n = e.nativeEvent) == null ? void 0 : n.isComposing) ?? e.isComposing) || e.keyCode === 229;
}
function He(e) {
  return e.key === "Escape" && !qe(e);
}
const fe = "calc(100% - 40px)";
function Xe(e) {
  for (let n = e; n && n !== document.body; n = n.parentElement) {
    const r = parseInt(getComputedStyle(n).zIndex, 10);
    if (!Number.isNaN(r)) return r;
  }
  return 0;
}
function Ye(e) {
  return [...document.querySelectorAll('[aria-modal="true"]')].some((n) => Xe(n) > e);
}
const pe = "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])";
function Qe() {
  if (typeof document > "u") return 220;
  const e = getComputedStyle(document.documentElement).getPropertyValue("--aw-panel-motion").trim(), n = /^(\d*\.?\d+)(ms|s)$/i.exec(e);
  if (!n) return 220;
  const r = n[2].toLowerCase() === "s" ? parseFloat(n[1]) * 1e3 : parseFloat(n[1]);
  return Number.isFinite(r) ? r : 220;
}
const Ze = "min(560px, calc((100vw - var(--app-shell-sidebar-width, 0px)) * 0.52))", Ve = (e, n = 160) => n + e * 2, Je = (e, n) => {
  const r = typeof e == "number" ? `${e}px` : e;
  return n === 0 ? r : `max(360px, calc(${r} * 0.93))`;
};
function en({ open: e, index: n, isTop: r, ariaLabel: p, children: h, onRequestClose: u, width: x = Ze }) {
  const [d, m] = _(!1), L = g(null), f = g(null), w = g(null), c = g(r);
  E(() => {
    c.current = r;
  });
  const A = Ce(), k = Ae(), I = Ve(n, re().zBase);
  be(() => {
    const b = f.current;
    b && (r ? b.removeAttribute("inert") : b.setAttribute("inert", ""));
  }, [r]), E(() => {
    w.current = document.activeElement;
    const b = requestAnimationFrame(() => m(!0)), a = setTimeout(() => {
      var l, o;
      c.current && ((o = (l = L.current) == null ? void 0 : l.querySelector(pe)) == null || o.focus({ preventScroll: !0 }));
    }, 60);
    return () => {
      cancelAnimationFrame(b), clearTimeout(a), w.current instanceof HTMLElement && w.current.isConnected && w.current.focus({ preventScroll: !0 });
    };
  }, []);
  const R = g(u);
  E(() => {
    R.current = u;
  }), E(() => {
    if (!r || !e) return;
    const b = (a) => {
      var i;
      if (a.defaultPrevented) return;
      if (He(a)) {
        if (Ye(I + 1)) return;
        R.current();
        return;
      }
      if (a.key !== "Tab") return;
      const l = (i = L.current) == null ? void 0 : i.querySelectorAll(pe);
      if (!l || l.length === 0) return;
      const o = l[0], s = l[l.length - 1];
      a.shiftKey && document.activeElement === o ? (a.preventDefault(), s.focus()) : !a.shiftKey && document.activeElement === s && (a.preventDefault(), o.focus());
    };
    return document.addEventListener("keydown", b), () => document.removeEventListener("keydown", b);
  }, [r, e, I]);
  const H = e && d, M = k ? "none" : void 0;
  return ge(
    /* @__PURE__ */ D("div", { ref: f, "aria-hidden": r ? void 0 : !0, style: { position: "fixed", inset: 0, zIndex: I, pointerEvents: e ? void 0 : "none" }, children: [
      /* @__PURE__ */ y(
        "div",
        {
          onClick: () => {
            r && u();
          },
          "aria-hidden": "true",
          style: { position: "absolute", inset: 0, background: "var(--aw-panel-scrim)", opacity: H ? 1 : 0, transition: M ?? "opacity var(--aw-panel-motion) ease-out" }
        }
      ),
      /* @__PURE__ */ y(
        "div",
        {
          ref: L,
          role: "dialog",
          "aria-modal": r ? "true" : void 0,
          "aria-label": p,
          style: {
            position: "absolute",
            top: 0,
            bottom: "var(--aw-panel-offset-bottom)",
            right: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            zIndex: I + 1,
            width: A ? n === 0 ? fe : `calc(${fe} * 0.93)` : Je(x, n),
            // 手機同規則、不設 360 下限（會比螢幕寬）
            maxWidth: "100%",
            background: "var(--aw-panel-bg)",
            boxShadow: "var(--aw-panel-shadow)",
            borderRadius: "var(--aw-panel-radius)",
            transform: H ? "translateX(0)" : "translateX(100%)",
            transition: M ?? "transform var(--aw-panel-motion) var(--aw-panel-easing)"
          },
          children: h
        }
      )
    ] }),
    document.body
  );
}
function nn({ size: e = 14 }) {
  return /* @__PURE__ */ D("svg", { width: e, height: e, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": !0, children: [
    /* @__PURE__ */ y("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    /* @__PURE__ */ y("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ] });
}
const he = 20, tn = "var(--aw-panel-hit)", J = 4;
function rn({ title: e, meta: n, backLabel: r, onBack: p, onClose: h, padX: u, statusRef: x }) {
  const d = tn, m = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    height: d,
    minWidth: d,
    display: "grid",
    placeItems: "center",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit"
  };
  return /* @__PURE__ */ D("header", { style: { padding: `var(--aw-panel-space-lg) ${u} ${J}px`, borderBottom: "1px solid var(--aw-panel-rule)", background: "var(--aw-panel-bg)" }, children: [
    /* @__PURE__ */ D("div", { style: { position: "relative", height: he, marginBottom: J }, children: [
      r !== void 0 && /* @__PURE__ */ D(
        "button",
        {
          type: "button",
          className: "aw-panel-hit",
          onClick: p,
          "aria-label": `返回${r}`,
          style: { ...m, left: "calc(-1 * var(--aw-panel-space-sm))", padding: "0 var(--aw-panel-space-sm)", color: "var(--aw-panel-back-color)", fontSize: "var(--aw-panel-meta-size)", fontWeight: 600 },
          children: [
            "‹ ",
            r
          ]
        }
      ),
      /* @__PURE__ */ y(
        "button",
        {
          type: "button",
          className: "aw-panel-hit",
          onClick: h,
          "aria-label": "關閉",
          style: { ...m, right: `calc(-1 * (${d} - ${he}px) / 2)`, width: d, color: "var(--aw-panel-ink-subtle)" },
          children: /* @__PURE__ */ y(nn, { size: 16 })
        }
      )
    ] }),
    /* @__PURE__ */ D("h2", { style: { margin: 0, paddingBottom: J, fontSize: "var(--aw-panel-title-size)", fontWeight: 600, color: "var(--aw-panel-ink)", lineHeight: "var(--aw-panel-title-line-height)" }, children: [
      e,
      n && /* @__PURE__ */ y("span", { style: { marginLeft: "var(--aw-panel-space-sm)", fontSize: "var(--aw-panel-meta-size)", fontWeight: 400, color: "var(--aw-panel-meta-color)" }, children: n })
    ] }),
    x && /* @__PURE__ */ y("div", { ref: x, className: "aw-panel-status" })
  ] });
}
const Ee = W(null);
function wn({ title: e, meta: n }) {
  const r = $(Ee);
  E(() => {
    r == null || r.set({ title: e, meta: n });
  }, [r, e, n]);
}
const Le = W(void 0);
function bn({ children: e }) {
  const n = $(Le);
  return n === void 0 ? e ?? null : n === null ? null : ge(e, n);
}
function gn({ registry: e }) {
  const { stack: n } = Ke(), r = $(te), p = Ae(), h = g(n);
  h.current = n;
  const u = n.length, [x, d] = _(n), [m, L] = _([]);
  if (x !== n) {
    const o = new Set(n.map((i) => i.key)), s = x.map((i, P) => ({ entry: i, index: P })).filter((i) => !o.has(i.entry.key));
    d(n), L([...m.filter((i) => !o.has(i.entry.key)), ...s]);
  }
  const f = g(/* @__PURE__ */ new Map());
  E(() => {
    if (m.length === 0) return;
    const o = m.map((i) => i.entry.key), s = setTimeout(() => {
      L((i) => i.filter((P) => !o.includes(P.entry.key))), o.forEach((i) => {
        h.current.some((P) => P.key === i) || f.current.delete(i);
      });
    }, p ? 0 : Qe());
    return () => clearTimeout(s);
  }, [m, p]);
  const w = u > 0 || m.length > 0;
  E(() => {
    if (!w) return;
    const o = document.body.style.overflow;
    return document.body.style.overflow = "hidden", () => {
      document.body.style.overflow = o;
    };
  }, [w]);
  const [, c] = we((o) => o + 1, 0), A = T((o, s) => {
    const i = h.current.find((P) => P.key === o);
    !i || i.title === s || (i.title = s, c());
  }, []), k = T((o) => {
    let s = f.current.get(o);
    return s || (s = /* @__PURE__ */ new Set(), f.current.set(o, s)), s;
  }, []), I = g(!1), R = T(async (o) => {
    if (I.current) return !1;
    I.current = !0;
    try {
      const s = h.current, i = Math.max(0, Math.min(o ?? s.length - 1, s.length)), P = [];
      for (let F = s.length - 1; F >= i; F--) P.push(...f.current.get(s[F].key) ?? []);
      return await je(P);
    } finally {
      I.current = !1;
    }
  }, []);
  E(() => (r.registerGate(R), () => r.registerGate(null)), [r, R]);
  const H = T(async (o, s) => {
    await R(o) && s();
  }, [R]), M = T(() => H(void 0, r.back), [H, r]), b = T(() => H(0, r.closeAll), [H, r]), a = T(() => {
    h.current.length > 1 ? M() : b();
  }, [M, b]), l = [
    ...m.map((o) => ({ ...o, open: !1 })),
    ...n.map((o, s) => ({ entry: o, index: s, open: !0 }))
  ];
  return /* @__PURE__ */ y(Me, { children: l.map((o) => {
    var s;
    return /* @__PURE__ */ y(
      an,
      {
        entry: o.entry,
        index: o.index,
        open: o.open,
        isTop: o.open && o.index === u - 1,
        backLabel: o.index > 0 ? ((s = h.current[o.index - 1]) == null ? void 0 : s.title) || "返回" : void 0,
        registryEntry: e[o.entry.type],
        actions: r,
        guards: k(o.entry.key),
        setTitle: A,
        closeTop: a,
        guardedBack: M,
        guardedCloseAll: b
      },
      o.entry.key
    );
  }) });
}
function an({ entry: e, index: n, open: r, isTop: p, backLabel: h, registryEntry: u, actions: x, guards: d, setTitle: m, closeTop: L, guardedBack: f, guardedCloseAll: w }) {
  const A = Ce() ? "var(--aw-panel-pad-mobile)" : "var(--aw-panel-pad)", [k, I] = _(null), [R, H] = _(null), M = j(() => ({ add: (i) => {
    const P = () => i();
    return d.add(P), () => {
      d.delete(P);
    };
  } }), [d]), b = e.key, a = j(() => ({ set: (i) => {
    m(b, i.title), I(i);
  } }), [b, m]), l = u == null ? void 0 : u.component, o = () => {
    r && f();
  }, s = () => {
    r && w();
  };
  return /* @__PURE__ */ y(en, { open: r, index: n, isTop: p, ariaLabel: (u == null ? void 0 : u.ariaLabel) ?? "詳情面板", width: u == null ? void 0 : u.width, onRequestClose: L, children: /* @__PURE__ */ y(Re.Provider, { value: M, children: /* @__PURE__ */ y(Ee.Provider, { value: a, children: /* @__PURE__ */ y(Le.Provider, { value: R, children: /* @__PURE__ */ D("div", { style: { display: "flex", flexDirection: "column", flex: 1 }, children: [
    /* @__PURE__ */ y(
      rn,
      {
        title: (k == null ? void 0 : k.title) ?? (u == null ? void 0 : u.ariaLabel) ?? "詳情面板",
        meta: k == null ? void 0 : k.meta,
        backLabel: h,
        onBack: o,
        onClose: h !== void 0 ? o : s,
        padX: A,
        statusRef: H
      }
    ),
    /* @__PURE__ */ y("div", { style: { flex: 1, padding: A }, children: l ? /* @__PURE__ */ y(l, { seed: e.seed, openPanel: x.openPanel, back: o, closeAll: s, canBack: h !== void 0 }) : /* @__PURE__ */ D("div", { style: { fontSize: "var(--aw-panel-body-size)", color: "var(--aw-panel-danger)" }, children: [
      "未註冊的面板型別：",
      e.type
    ] }) })
  ] }) }) }) }) });
}
function vn(e, n, r) {
  const p = Ge(), h = g(p), u = g(r), x = g(n == null ? void 0 : n.seed), d = g(null), m = g(null), L = re().router.useNavigationType(), f = g(L);
  E(() => {
    h.current = p, u.current = r, x.current = n == null ? void 0 : n.seed, f.current = L;
  });
  const w = (n == null ? void 0 : n.key) ?? null;
  E(() => {
    if (w === null) {
      if (d.current && f.current === "POP") return;
      if (d.current) {
        const A = d.current;
        h.current.dismissAll(() => {
          d.current === A && (d.current = null);
        });
      }
      return;
    }
    if (d.current && m.current === w) return;
    d.current && (d.current = null, h.current.closeAll());
    const c = {};
    d.current = c, m.current = w, h.current.openPanel(e, x.current, {
      ownsHistory: !1,
      onClosed: () => {
        d.current === c && (d.current = null, _e(() => u.current()));
      }
    });
  }, [w, e]);
}
const on = { success: "ok", warning: "warn", accent: "brand" }, sn = /* @__PURE__ */ new Set(["warn", "danger", "date", "box"]);
function cn(e) {
  const n = e ? on[e] ?? e : "plain";
  return { t: n, bg: `var(--aw-badge-${n}-bg)`, text: `var(--aw-badge-${n}-text)`, border: `var(--aw-badge-${n}-border)` };
}
function yn({ label: e, tone: n, value: r, options: p, onSelect: h, ariaLabel: u }) {
  const [x, d] = _(!1), m = g(null), L = g(null), f = De(), w = () => {
    var a;
    return Array.from(((a = m.current) == null ? void 0 : a.querySelectorAll('[role="menuitemradio"]:not([aria-disabled="true"])')) ?? []);
  }, c = (a) => {
    var l;
    d(!1), (l = L.current) == null || l.focus();
  };
  E(() => {
    var s, i;
    if (!x) return;
    (i = ((s = m.current) == null ? void 0 : s.querySelector('[aria-checked="true"]:not([aria-disabled="true"])')) ?? w()[0]) == null || i.focus();
    const l = (P) => {
      var F;
      (F = m.current) != null && F.contains(P.target) || d(!1);
    }, o = (P) => {
      He(P) && (P.preventDefault(), P.stopImmediatePropagation(), c());
    };
    return document.addEventListener("pointerdown", l), document.addEventListener("keydown", o, !0), () => {
      document.removeEventListener("pointerdown", l), document.removeEventListener("keydown", o, !0);
    };
  }, [x]);
  const A = (a) => {
    var s;
    const l = w();
    if (l.length === 0) return;
    const o = l.indexOf(document.activeElement);
    (s = l[(o + a + l.length) % l.length]) == null || s.focus();
  }, k = (a) => {
    var o;
    const l = w();
    (o = a ? l[l.length - 1] : l[0]) == null || o.focus();
  }, [I, R] = _(null), [H, M] = _(null), b = cn(n);
  return /* @__PURE__ */ D("span", { ref: m, style: { position: "relative", display: "inline-flex" }, children: [
    /* @__PURE__ */ y(
      "button",
      {
        ref: L,
        type: "button",
        "aria-haspopup": "menu",
        "aria-expanded": x,
        "aria-controls": x ? f : void 0,
        "aria-label": `${u}：${e}`,
        onClick: () => d((a) => !a),
        onKeyDown: (a) => {
          a.key === "ArrowDown" && !x && (a.preventDefault(), d(!0));
        },
        style: { border: 0, padding: 0, background: "transparent", cursor: "pointer", fontFamily: "inherit", borderRadius: "var(--aw-badge-radius)" },
        children: /* @__PURE__ */ D("span", { "data-badge": b.t, style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          height: 24,
          padding: "0 7px",
          boxSizing: "border-box",
          border: `1px solid ${b.border}`,
          borderRadius: "var(--aw-badge-radius)",
          background: b.bg,
          color: b.text,
          fontSize: "var(--aw-panel-meta-size)",
          fontWeight: sn.has(b.t) ? 600 : 400,
          lineHeight: 1,
          whiteSpace: "nowrap"
        }, children: [
          e,
          /* @__PURE__ */ y("span", { "aria-hidden": !0, style: { fontSize: 11, lineHeight: 1, opacity: 0.7 }, children: "▾" })
        ] })
      }
    ),
    x && /* @__PURE__ */ y(
      "div",
      {
        id: f,
        role: "menu",
        "aria-label": u,
        onKeyDown: (a) => {
          a.key === "ArrowDown" ? (a.preventDefault(), A(1)) : a.key === "ArrowUp" ? (a.preventDefault(), A(-1)) : a.key === "Home" ? (a.preventDefault(), k(!1)) : a.key === "End" ? (a.preventDefault(), k(!0)) : a.key === "Tab" && d(!1);
        },
        style: {
          position: "absolute",
          zIndex: "var(--aw-badge-menu-z)",
          top: "100%",
          left: 0,
          marginTop: 4,
          minWidth: 140,
          padding: 4,
          background: "var(--aw-panel-bg)",
          border: "1px solid var(--aw-panel-rule)",
          borderRadius: "var(--aw-badge-radius)",
          boxShadow: "var(--aw-badge-menu-shadow)",
          fontSize: "var(--aw-panel-body-size)",
          color: "var(--aw-panel-ink)"
        },
        children: p.map((a) => {
          const l = a.value === r;
          return /* @__PURE__ */ D(
            "button",
            {
              type: "button",
              role: "menuitemradio",
              "aria-checked": l,
              "aria-disabled": a.disabled || void 0,
              onMouseEnter: () => R(a.value),
              onMouseLeave: () => R(null),
              onFocus: () => M(a.value),
              onBlur: () => M(null),
              onClick: () => {
                var o;
                a.disabled || (d(!1), (o = L.current) == null || o.focus(), l || h(a.value));
              },
              style: {
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                border: 0,
                background: !a.disabled && (I === a.value || H === a.value) ? "var(--aw-badge-menu-hover-bg)" : "transparent",
                padding: "7px 10px",
                borderRadius: 4,
                fontFamily: "inherit",
                fontSize: "inherit",
                textAlign: "left",
                fontWeight: l ? 600 : 400,
                cursor: a.disabled ? "not-allowed" : "pointer",
                color: a.disabled ? "var(--aw-panel-ink-subtle)" : "var(--aw-panel-ink)",
                opacity: a.disabled ? 0.7 : 1
              },
              children: [
                /* @__PURE__ */ y("span", { children: a.label }),
                a.disabled && a.reason && /* @__PURE__ */ y("small", { style: { fontSize: 11, color: "var(--aw-panel-ink-subtle)" }, children: a.reason }),
                l && /* @__PURE__ */ y("span", { "aria-hidden": !0, style: { color: "var(--aw-badge-menu-check)" }, children: "✓" })
              ]
            },
            a.value
          );
        })
      }
    )
  ] });
}
const ln = `/* aw-kit/panel — default appearance. Override any --aw-panel-* on :root (or a wrapper) to re-theme.
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
  /* v0.4.0 StatusMenuBadge（每個 tone 三個變數：-bg／-text／-border；預設取中性系統 + 狀態色） */
  --aw-badge-neutral-bg: #f4f5f6;   --aw-badge-neutral-text: #374151; --aw-badge-neutral-border: #e5e7eb;
  --aw-badge-info-bg: #eff6ff;      --aw-badge-info-text: #1d4ed8;    --aw-badge-info-border: #bfdbfe;
  --aw-badge-ok-bg: #f0fdf4;        --aw-badge-ok-text: #15803d;      --aw-badge-ok-border: #bbf7d0;
  --aw-badge-warn-bg: #fffbeb;      --aw-badge-warn-text: #b45309;    --aw-badge-warn-border: #fbbf24;
  --aw-badge-danger-bg: #fef2f2;    --aw-badge-danger-text: #b91c1c;  --aw-badge-danger-border: #fecaca;
  --aw-badge-brand-bg: #f0f0f0;     --aw-badge-brand-text: #303030;   --aw-badge-brand-border: #c8c8c8;
  --aw-badge-date-bg: #f0f0f0;      --aw-badge-date-text: #1a1a1a;    --aw-badge-date-border: transparent;
  --aw-badge-box-bg: #ffffff;       --aw-badge-box-text: #1a1a1a;     --aw-badge-box-border: #e3e3e3;
  --aw-badge-plain-bg: #ffffff;     --aw-badge-plain-text: #4a4a4a;   --aw-badge-plain-border: #e3e3e3;
  --aw-badge-radius: 6px;
  --aw-badge-menu-z: 20;
  --aw-badge-menu-shadow: 0 4px 16px rgba(20, 24, 28, 0.10);
  --aw-badge-menu-hover-bg: #f0f0f0;
  --aw-badge-menu-check: #1a1a1a;
}

/* 標頭狀態列（PanelHeaderStatus 的 portal 容器）：沒有內容時不佔高度 */
.aw-panel-status {
  padding-bottom: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--aw-panel-space-sm);
}
.aw-panel-status:empty { display: none; }

.aw-panel-hit:focus-visible {
  outline: 2px solid var(--aw-panel-focus);
  outline-offset: -2px;
}
`, me = "awp-styles";
function kn() {
  if (typeof document > "u" || document.getElementById(me)) return;
  const e = document.createElement("style");
  e.id = me, e.textContent = ln, document.head.appendChild(e);
}
export {
  Fe as MAX_DEPTH,
  rn as PanelHeader,
  bn as PanelHeaderStatus,
  gn as PanelHost,
  hn as PanelStackProvider,
  yn as StatusMenuBadge,
  ee as awPanelOf,
  kn as injectStyles,
  pn as isPanelOnlyNavigation,
  Ge as usePanel,
  mn as usePanelCloseGuard,
  wn as usePanelHeader,
  Ke as usePanelStack,
  vn as useUrlPanel,
  _e as withPanelNavigationAllowed
};
