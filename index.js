! function (t) {
  var e = {};

  function n(i) {
    if (e[i]) return e[i].exports;
    var r = e[i] = {
      i: i,
      l: !1,
      exports: {}
    };
    return t[i].call(r.exports, r, r.exports, n), r.l = !0, r.exports
  }
  n.m = t, n.c = e, n.d = function (t, e, i) {
    n.o(t, e) || Object.defineProperty(t, e, {
      enumerable: !0,
      get: i
    })
  }, n.r = function (t) {
    "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, {
      value: "Module"
    }), Object.defineProperty(t, "__esModule", {
      value: !0
    })
  }, n.t = function (t, e) {
    if (1 & e && (t = n(t)), 8 & e) return t;
    if (4 & e && "object" == typeof t && t && t.__esModule) return t;
    var i = Object.create(null);
    if (n.r(i), Object.defineProperty(i, "default", {
        enumerable: !0,
        value: t
      }), 2 & e && "string" != typeof t)
      for (var r in t) n.d(i, r, function (e) {
        return t[e]
      }.bind(null, r));
    return i
  }, n.n = function (t) {
    var e = t && t.__esModule ? function () {
      return t.default
    } : function () {
      return t
    };
    return n.d(e, "a", e), e
  }, n.o = function (t, e) {
    return Object.prototype.hasOwnProperty.call(t, e)
  }, n.p = "", n(n.s = 3)
}([function (t, e) {
  t.exports = require("react")
}, function (t, e) {
  t.exports = require("lodash")
}, function (t, e) {
  t.exports = require("dexie")
}, function (t, e, n) {
  "use strict";
  n.r(e), n.d(e, "ViewBox", (function () {
    return u
  })), n.d(e, "useInternet", (function () {
    return a
  })), n.d(e, "useVisible", (function () {
    return c
  })), n.d(e, "useKeyboard", (function () {
    return l
  })), n.d(e, "useContextMenu", (function () {
    return d
  })), n.d(e, "useViewport", (function () {
    return h
  })), n.d(e, "useDeviceOrientation", (function () {
    return A
  })), n.d(e, "useDeviceMotion", (function () {
    return $
  })), n.d(e, "useGeoLocation", (function () {
    return I
  })), n.d(e, "usePoll", (function () {
    return lt
  })), n.d(e, "Bits", (function () {
    return ht
  })), n.d(e, "debug", (function () {
    return jt
  })), n.d(e, "pushState", (function () {
    return zt
  })), n.d(e, "replaceState", (function () {
    return Lt
  })), n.d(e, "localStore", (function () {
    return Mt
  })), n.d(e, "sessionStore", (function () {
    return Pt
  })), n.d(e, "pushStateStorage", (function () {
    return It
  })), n.d(e, "replaceStateStorage", (function () {
    return Nt
  })), n.d(e, "useStore", (function () {
    return Ht
  })), n.d(e, "Tempo", (function () {
    return F
  })), n.d(e, "to_tempo", (function () {
    return X
  })), n.d(e, "to_tempo_bare", (function () {
    return Y
  })), n.d(e, "to_tempo_by", (function () {
    return Z
  })), n.d(e, "to_msec", (function () {
    return tt
  })), n.d(e, "to_sec", (function () {
    return et
  })), n.d(e, "to_timer", (function () {
    return nt
  })), n.d(e, "to_relative_time_distance", (function () {
    return it
  }));
  var i = n(0);
  const r = "undefined" == typeof window,
    s = !r,
    o = (r || location.hostname, s ? window.visualViewport : {
      width: 0,
      height: 0,
      scale: 1
    }),
    u = {
      size: [o.width, o.height],
      scale: o.scale
    };

  function a() {
    const [t, e] = Object(i.useState)(!0);
    return s && Object(i.useEffect)(() => (window.addEventListener("offline", n), window.addEventListener("online", n), () => {
      window.removeEventListener("offline", n), window.removeEventListener("online", n)
    }), []), [t];

    function n() {
      e(window.navigator.onLine)
    }
  }

  function c() {
    const [t, e] = Object(i.useState)(!0);
    return s && Object(i.useEffect)(() => (document.addEventListener("visibilitychange", n), () => {
      document.removeEventListener("visibilitychange", n)
    }), []), [t];

    function n() {
      e("hidden" !== document.visibilityState)
    }
  }

  function l() {
    return s && Object(i.useEffect)(() => (document.addEventListener("keyup", t), () => {
      document.removeEventListener("keyup", t)
    }), []), [];

    function t(t) {
      console.log(t)
    }
  }

  function d() {
    const [t, e] = Object(i.useState)(!0);
    return s && (Object(i.useEffect)(() => {
      const {
        style: e
      } = document.body;
      t ? e.setProperty("--menu-display", "block") : e.setProperty("--menu-display", "none")
    }, [t]), Object(i.useEffect)(() => (document.addEventListener("contextmenu", n), () => {
      document.removeEventListener("contextmenu", n)
    }), [])), [t, e];

    function n(t) {
      t.preventDefault(), e(!0)
    }
  }

  function h() {
    const [t, e] = Object(i.useState)(u.size[0]), [n, r] = Object(i.useState)(u.size[1]), [o, a] = Object(i.useState)(u.scale);
    return s && Object(i.useEffect)(() => (c(), window.visualViewport.addEventListener("resize", c), window.addEventListener("orientationChange", c), () => {
      window.visualViewport.removeEventListener("resize", c), window.addEventListener("orientationChange", c)
    }), []), [t, n, o];

    function c() {
      const {
        style: t
      } = document.body, {
        scale: n,
        width: i,
        height: s
      } = window.visualViewport;
      u.scale = n, a(n), 1 === n && (t.setProperty("--view-width", i + "px"), t.setProperty("--view-height", s + "px"), u.size = [i, s], e(i), r(s))
    }
  }
  class f {
    constructor(t, e, n, i) {
      this.min = t, this.max = e, this.minus = n, this.plus = i
    }
    label(t, e) {
      return null === t ? null : t < -4 ? this.minus : 4 < t ? this.plus : e === this.minus && t < -1 ? this.minus : e === this.plus && 1 < t ? this.plus : ""
    }
  }
  class w {
    constructor(t, e, n, i) {
      this.min = t, this.max = e, this.minus = n, this.plus = i
    }
    label(t, e) {
      return null === t ? null : t < -140 ? this.minus : 140 < t ? this.plus : e === this.minus && t < -30 ? this.minus : e === this.plus && 30 < t ? this.plus : ""
    }
  }
  class m {
    constructor(t, e) {
      this.min = t, this.max = e
    }
    label(t) {
      if (null === t) return null;
      return `${Math.floor(t)}°${Math.floor(60*t%60)}′${Math.floor(3600*t%60)}″`
    }
  }
  class b {
    constructor(t, e, n, i) {
      this.min = t, this.max = e, this.minus = n, this.plus = i
    }
    label(t) {
      if (null === t) return null;
      return `${Math.floor(t)}°${Math.floor(60*t%60)}′${Math.floor(3600*t%60)}″${Math.floor(216e3*t%60)}‴${Math.floor(1296e4*t%60)}⁗${t<0?this.minus:this.plus}`
    }
  }
  class _ {
    constructor(t, e) {
      this.min = t, this.max = e
    }
    label(t) {
      if (null === t) return null;
      return `${Math.floor(t)}ｍ${Math.floor(100*t%100)}㎝`
    }
  }
  const v = new f(-10, 10, "右", "左"),
    p = new f(-10, 10, "上", "下"),
    g = new f(-10, 10, "表", "裏"),
    y = new w(-360, 360, "俯下", "仰上"),
    x = new w(-360, 360, "左折", "右折"),
    O = new w(-360, 360, "左巻", "右巻"),
    j = new _(0, 10),
    E = new _(0, 10),
    S = new m(0, 360),
    z = new b(-180, 180, "左折", "右折"),
    L = new b(-90, 90, "左巻", "右巻"),
    R = new b(-180, 180, "E", "W"),
    M = new b(-90, 90, "N", "S"),
    P = new m(0, 360);

  function A(t) {
    const [e, n] = Object(i.useReducer)(h, t(null, null, S)), [r, o] = Object(i.useReducer)(h, t(null, null, z)), [u, a] = Object(i.useReducer)(h, t(null, null, L)), [c, l] = Object(i.useState)(!0);
    return s && Object(i.useEffect)(() => (DeviceOrientationEvent.requestPermission ? DeviceOrientationEvent.requestPermission().then(t => {
      "granted" === t && window.addEventListener("deviceorientation", d)
    }) : window.addEventListener("deviceorientation", d), () => {
      window.addEventListener("deviceorientation", d)
    }), []), [
      [e, r, u], c
    ];

    function d({
      alpha: t,
      beta: e,
      gamma: i,
      absolute: r
    }) {
      n([t, S]), o([e, z]), a([i, L]), l(r)
    }

    function h(e, [n, i]) {
      return t(e, n, i)
    }
  }

  function $(t, e) {
    const [n, r] = Object(i.useReducer)(T, t(null, null, v)), [o, u] = Object(i.useReducer)(T, t(null, null, p)), [a, c] = Object(i.useReducer)(T, t(null, null, g)), [l, d] = Object(i.useReducer)(T, t(null, null, v)), [h, f] = Object(i.useReducer)(T, t(null, null, p)), [w, m] = Object(i.useReducer)(T, t(null, null, g)), [b, _] = Object(i.useReducer)(T, t(null, null, v)), [j, E] = Object(i.useReducer)(T, t(null, null, p)), [S, z] = Object(i.useReducer)(T, t(null, null, g)), [L, R] = Object(i.useReducer)(D, e(null, null, y)), [M, P] = Object(i.useReducer)(D, e(null, null, x)), [A, $] = Object(i.useReducer)(D, e(null, null, O)), [I, N] = Object(i.useState)(0);
    return s && Object(i.useEffect)(() => (DeviceMotionEvent.requestPermission ? DeviceMotionEvent.requestPermission().then(t => {
      "granted" === t && window.addEventListener("devicemotion", H)
    }) : window.addEventListener("devicemotion", H), () => {
      window.addEventListener("devicemotion", H)
    }), []), [
      [n, o, a],
      [l, h, w],
      [b, j, S],
      [L, M, A], I
    ];

    function H({
      interval: t,
      acceleration: e,
      accelerationIncludingGravity: n,
      rotationRate: i
    }) {
      const {
        x: s,
        y: o,
        z: a
      } = e, {
        x: l,
        y: h,
        z: w
      } = n, {
        alpha: b,
        beta: j,
        gamma: S
      } = i;
      r([s, v]), u([o, p]), c([a, g]), _([l, v]), E([h, p]), z([w, g]), d([l - s, v]), f([h - o, p]), m([w - a, g]), R([b, y]), P([j, x]), $([S, O]), N(t)
    }

    function T(e, [n, i]) {
      return t(e, n, i)
    }

    function D(t, [n, i]) {
      return e(t, n, i)
    }
  }

  function I(t, e) {
    const [n, r] = Object(i.useReducer)(m, t(null, null, R)), [o, u] = Object(i.useReducer)(m, t(null, null, M)), [a, c] = Object(i.useReducer)((function (e, [n, i]) {
      return t(e, n, i)
    }), t(null, null, P)), [l, d] = Object(i.useReducer)(b, e(null, null, j)), [h, f] = Object(i.useReducer)(b, e(null, null, E));
    if (s) {
      if (!(null === navigator || void 0 === navigator ? void 0 : navigator.geolocation)) return [
        [n, o], l, a, h
      ];
      Object(i.useEffect)(() => {
        const t = navigator.geolocation.watchPosition(w, ({
          code: t
        }) => {
          console.log("error watchPosition = " + t)
        }, {
          enableHighAccuracy: !0,
          maximumAge: 6e4,
          timeout: 1e4
        });
        return () => {
          navigator.geolocation.clearWatch(t)
        }
      }, [])
    }
    return [
      [n, o], l, a, h
    ];

    function w({
      coords: t,
      timestamp: e
    }) {
      let {
        latitude: n,
        longitude: i,
        altitude: s,
        heading: o,
        speed: a
      } = t;
      u([i, M]), r([n, R]), null !== s && d([s, j]), null !== o && c([o, P]), null !== a && f([a, E])
    }

    function m(e, [n, i]) {
      return t(e, n, i)
    }

    function b(t, [n, i]) {
      return e(t, n, i)
    }
  }
  const N = tt("1s"),
    H = tt("1m"),
    T = tt("1h"),
    D = tt("1d"),
    k = tt("1w"),
    C = tt("30d"),
    B = tt("1y"),
    U = 0xfffffffffffff,
    V = "undefined" != typeof window ? H * (new Date).getTimezoneOffset() : tt("-9h"),
    q = -new Date(0).getDay() * D + V,
    J = [
      ["年", "y", B],
      ["週", "w", k],
      ["日", "d", D],
      ["時", "h", T],
      ["分", "m", H],
      ["秒", "s", N]
    ],
    G = [-U, 2147483647, B, "？？？"],
    W = [1 / 0, 2147483647, U, "昔"],
    K = [G, [-B, 2147483647, B, "%s年後"],
      [-C, 2147483647, C, "%sヶ月後"],
      [-k, k, k, "%s週間後"],
      [-D, D, D, "%s日後"],
      [-T, T, T, "%s時間後"],
      [-H, H, H, "%s分後"],
      [-25e3, N, N, "%s秒後"],
      [25e3, 25e3, 25e3, "今"],
      [H, N, N, "%s秒前"],
      [T, H, H, "%s分前"],
      [D, T, T, "%s時間前"],
      [k, D, D, "%s日前"],
      [C, k, k, "%s週間前"],
      [B, 2147483647, C, "%sヶ月前"],
      [U, 2147483647, B, "%s年前"], W
    ];
  class F {
    constructor(t, e, n, i, r, s = null) {
      s && (this.table = s), this.zero = t, this.write_at = n, this.now_idx = e, this.last_at = i, this.next_at = r
    }
    get size() {
      return this.next_at - this.last_at
    }
    get since() {
      return this.write_at - this.last_at
    }
    get remain() {
      return this.next_at - this.write_at
    }
    get timeout() {
      return this.next_at - this.write_at
    }
    get center_at() {
      return (this.next_at + this.last_at) / 2
    }
    get moderate_at() {
      return 1 & this.now_idx ? this.last_at : this.next_at
    }
    get deg() {
      return Math.floor(360 * this.since / this.size) + "deg"
    }
    is_cover(t) {
      return this.last_at <= t && t < this.next_at
    }
    is_hit(t) {
      return this.last_at <= t.next_at && t.last_at < this.next_at
    }
    succ(t = 1) {
      return this.slide(+t)
    }
    back(t = 1) {
      return this.slide(-t)
    }
    slide_to(t) {
      return this.slide(t - this.now_idx)
    }
    round(t, e, n = Y) {
      let {
        last_at: i,
        write_at: r,
        next_at: s,
        now_idx: o,
        size: u
      } = this;
      return (() => {
        const a = n(t, e, i);
        if (r < a.center_at) {
          ({
            last_at: i,
            size: u
          } = this.slide(-1));
          const r = n(t, e, i);
          return s = a.center_at, i = r.center_at, void o--
        }
        const c = n(t, e, s);
        if (c.center_at <= r) {
          ({
            next_at: s,
            size: u
          } = this.slide(1));
          const r = n(t, e, s);
          return i = c.center_at, s = r.center_at, void o++
        }
        s = c.center_at, i = a.center_at
      })(), new F(i - o * u, o, r, i, s)
    }
    ceil(t, e, n = Y) {
      let {
        last_at: i,
        write_at: r,
        next_at: s,
        now_idx: o,
        size: u
      } = this;
      const a = n(t, e, i);
      if (r < a.next_at) {
        ({
          last_at: i,
          size: u
        } = this.slide(-1));
        const r = n(t, e, i);
        s = a.next_at, i = r.next_at, o--
      } else {
        s = n(t, e, s).next_at, i = a.next_at
      }
      return new F(i - o * u, o, r, i, s)
    }
    floor(t, e, n = Y) {
      let {
        last_at: i,
        write_at: r,
        next_at: s,
        now_idx: o,
        size: u
      } = this;
      const a = n(t, e, s);
      if (a.last_at <= r) {
        ({
          next_at: s,
          size: u
        } = this.slide(1));
        const r = n(t, e, s);
        i = a.last_at, s = r.last_at, o++
      } else {
        i = n(t, e, i).last_at, s = a.last_at
      }
      return new F(i - o * u, o, r, i, s)
    }
    to_list(t) {
      const e = t.reset(this.last_at),
        n = t.reset(this.next_at - 1);
      return e.upto(n)
    }
    upto(t) {
      let e = this;
      const n = [];
      for (; e.last_at < t.last_at;) n.push(e), e = e.succ();
      return n
    }
    slide(t) {
      if (this.table) {
        const e = this.now_idx + t,
          n = Q(e, this.table.length),
          i = Math.floor(e / this.table.length) - Math.floor(this.now_idx / this.table.length),
          r = i ? this.table[this.table.length - 1] * i : 0,
          s = this.zero + r + (this.table[n - 1] || 0),
          o = this.zero + r + this.table[n],
          u = s + this.since;
        return new F(this.zero, e, u, s, o, this.table)
      } {
        const e = t * this.size;
        return Y(this.size, this.zero, this.write_at + e)
      }
    }
    copy() {
      return new F(this.zero, this.now_idx, this.write_at, this.last_at, this.next_at, this.table)
    }
    reset(t = Date.now()) {
      return this.table ? Z(this.table, this.zero, t) : Y(this.size, this.zero, t)
    }
    tick() {
      const t = Date.now();
      return this.next_at <= t ? this.reset(t) : null
    }
    sleep() {
      return F.sleep([this])
    }
    static join(t, e) {
      if (t.zero != e.zero) throw new Error("can't join.");
      const n = Math.min(t.last_at, e.last_at);
      return Y(Math.max(t.next_at, e.next_at) - n, n, (t.write_at + e.write_at) / 2)
    }
    static async sleep(t) {
      if (t && t.length) {
        const e = t.reduce((t, e) => t.timeout < e.timeout ? t : e, {
          timeout: 1 / 0
        });
        if (e.timeout < 1 / 0) return new Promise(t => {
          setTimeout(() => {
            t(e)
          }, e.timeout)
        })
      }
      return new Promise(t => t(null))
    }
  }
  const Q = (t, e) => (+t % (e = +e) + e) % e;

  function X(t, e = "0s", n = Date.now()) {
    return Y(tt(t), tt(e) + q, Number(n))
  }

  function Y(t, e, n) {
    const i = Math.floor((n - e) / t);
    return new F(e, i, n, (i + 0) * t + e, (i + 1) * t + e)
  }

  function Z(t, e, n) {
    let i = n - e;
    const r = t[t.length - 1],
      s = Math.floor(i / r);
    s && (i -= s * r);
    let o = t.length,
      u = 0,
      a = e;
    for (; u < o;) {
      const e = u + o >>> 1;
      a = t[e], a <= i ? u = e + 1 : o = e
    }
    const c = e + (t[o - 1] || 0);
    return a = e + t[o], o += s * t.length, new F(e, o, n, c, a, t)
  }

  function tt(t) {
    return 1e3 * et(t)
  }

  function et(t) {
    let e = 0;
    return t.replace(/(\d+)([ヵ]?([smhdwy秒分時日週月年])[間]?(半$)?)|0/g, (n, i, r, s, o) => {
      let u = Number(i);
      return u ? ("半" === o && (u += .5), e += u * (() => {
        switch (s) {
          case "s":
          case "秒":
            return 1;
          case "m":
          case "分":
            return 60;
          case "h":
          case "時":
            return 3600;
          case "d":
          case "日":
            return 86400;
          case "w":
          case "週":
            return 604800;
          case "y":
          case "年":
            return 31556925.147;
          default:
            throw new Error(`${t} at ${u}${s}`)
        }
      })(), "") : ""
    }), e
  }

  function nt(t, e = 1) {
    let n = "";
    const i = J.length;
    for (let r = 0; r < i; ++r) {
      const i = J[r][e],
        s = J[r][2],
        o = Math.floor(t / s);
      o && (t %= s, n += `${o}${i}`)
    }
    return n
  }

  function it(t) {
    if (t < -U || U < t || t - 0 == NaN) return G;
    const e = K.length;
    for (let n = 0; n < e; ++n) {
      const e = K[n];
      if (t < e[0]) return e
    }
    return W
  }
  var rt = n(2);
  const st = {},
    ot = {},
    ut = {},
    at = new(n.n(rt).a)("poll-web");

  function ct() {
    const t = window.navigator.onLine,
      e = "hidden" != document.visibilityState;
    t && e ? Object.values(st).forEach(t => t()) : Object.values(ot).forEach(clearTimeout)
  }

  function lt(t, e, n, r, s = []) {
    const o = [t.name, ...s].join("&");
    let u = X(n);
    const [a, c] = Object(i.useState)(e);
    return Object(i.useEffect)(() => {
      st[o] = l;
      l();
      return () => {
        clearTimeout(ot[o]), delete st[o], delete ot[o]
      }
    }, []), [a, c];
    async function l() {
      var e, n, i;
      let a = null,
        d = null;
      u = u.reset();
      const {
        timeout: h,
        write_at: f,
        next_at: w
      } = u;
      try {
        f < ut[o] ? async function () {
          console.log({
            wait: (new Date).getTime() - f,
            idx: o,
            mode: null
          })
        }(): (0 < ut[o] || (a = await at.table("meta").get(o), (null === (e = a) || void 0 === e ? void 0 : e.version) !== r && (a = null)), f < (null === (n = a) || void 0 === n ? void 0 : n.next_at) ? await m() : 0 < (null === (i = a) || void 0 === i ? void 0 : i.next_at) ? (await m(), await b()) : (await b(), at.table("meta").put({
          idx: o,
          version: r,
          next_at: w
        }))), ut[o] = w
      } catch (t) {
        console.error(t)
      }
      async function m() {
        var t;
        d = await at.table("data").get(o), c(null === (t = d) || void 0 === t ? void 0 : t.pack), console.log({
          wait: (new Date).getTime() - f,
          idx: o,
          mode: "(lf)"
        })
      }
      async function b() {
        const e = await t(...s);
        d = {
          idx: o,
          pack: e
        }, await at.table("data").put(d), c(e), console.log({
          wait: (new Date).getTime() - f,
          idx: o,
          mode: "(api)"
        })
      }
      h < 2147483647 && (ot[o] = setTimeout(l, h))
    }
  }
  at.version(1).stores({
    meta: "&idx",
    data: "&idx"
  }), "undefined" != typeof window && (window.addEventListener("offline", ct), window.addEventListener("online", ct), document.addEventListener("visibilitychange", ct));
  var dt = n(1);
  class ht {
    static by_str(t, e) {
      const n = [null, void 0, "undefined"].includes(t) ? 0 : Number.parseInt(t, 36);
      return e._.copy(n)
    }
    static to_str(t) {
      return t.bits.toString(36)
    }
    static min(t) {
      return t & -t
    }
    static assign(t) {
      if (31 < t.length) throw new Error("too much bits.");
      class e {
        constructor(e) {
          this.target = e, this.labels = t
        }
        copy(t = this.target.bits) {
          return new n(t)
        }
        calc(t) {
          const e = this.target.bits;
          return this.copy(t(e))
        }
        get labels_off() {
          return e.get_labels(2 ** 31 - 1 - this.target.bits)
        }
        get labels_on() {
          return e.get_labels(this.target.bits)
        }
        static get_labels(e) {
          let n = t.length,
            i = 0;
          const r = [];
          do {
            1 & e && t[i] && r.push(t[i]), e >>>= 1, ++i
          } while (--n);
          return r.reverse()
        }
      }
      class n extends ht {
        constructor(t) {
          super(), this.bits = t, this._ = new e(this)
        }
        static by(t) {
          const e = new n(0);
          return t.forEach(t => {
            e[t] = !0
          }), e
        }
      }
      return n.all = new n(2 ** 31 - 1), n.zero = new n(0), t.forEach((t, e) => {
        const i = 2 ** e,
          r = 2 ** 31 - 1 - i;
        Object.defineProperty(n.prototype, t, {
          enumerable: !0,
          get: function () {
            return Boolean(this.bits & i)
          },
          set: function (t) {
            this.bits = this.bits & r | i * Number(bt(t))
          }
        })
      }), n
    }
  }

  function ft(t, e) {
    return t ? String(t) : e
  }

  function wt(t) {
    return t ? Number(t) : NaN
  }

  function mt(t) {
    return t instanceof Array ? t : t ? Array(t) : []
  }

  function bt(t) {
    return !!t && !["0", "false"].includes(t)
  }

  function
  _t(t, e) {
    switch (e.constructor) {
      case String:
      case Number:
        return ft(t, "");
      case Boolean:
        return ft(bt(t), "")
    }
    return e instanceof ht ? ht.to_str(t) : e instanceof Array ? JSON.stringify(mt(t)) : JSON.stringify((n = t) instanceof Object ? n : {});
    var n
  }

  function vt(t, e) {
    switch (e.constructor) {
      case String:
        return ft(t, void 0);
      case Number:
        return wt(t);
      case Boolean:
        return bt(t)
    }
    return e instanceof ht ? ht.by_str(t, e) : e instanceof Array ? JSON.parse(t) || [] : JSON.parse(t) || {}
  }

  function pt(t, e) {
    switch (e.constructor) {
      case String:
        return [encodeURIComponent(ft(t, ""))];
      case Number:
        return [ft(wt(t), "")];
      case Boolean:
        return [ft(bt(t), "")]
    }
    return e instanceof ht ? [ht.to_str(t)] : e instanceof Array ? mt(t).map(encodeURIComponent) : void 0
  }

  function gt(t, e) {
    switch (e.constructor) {
      case String:
        return ft(decodeURIComponent(t[0]), "");
      case Number:
        return wt(decodeURIComponent(t[0]));
      case Boolean:
        return bt(t[0])
    }
    return e instanceof ht ? ht.by_str(t[0], e) : e instanceof Array ? mt(t).map(decodeURIComponent) : void 0
  }
  const yt = {},
    xt = {},
    Ot = {},
    jt = {
      share: Ot,
      dataStore: xt,
      defaults: yt
    };

  function Et(t, e, n, i) {
    i instanceof Object && Object.keys(n).forEach(n => {
        if (e === n) return;
        if ("_" === n[0]) return;
        const i = [...t, n],
          r = dt.get(yt, i);
        Et(i, void 0, dt.get(xt, i), r)
      }),
      function (t, e, n, i) {
        const r = t.join(".");
        Ot[r] && Ot[r].forEach(t => {
          t(n, i)
        })
      }(t, 0, n, i)
  }

  function St(t) {
    let e = t.length;
    do {
      const n = t[e],
        i = t.slice(0, e),
        r = dt.get(yt, i);
      Et(i, n, dt.get(xt, i), r)
    } while (--e)
  }

  function zt(t) {
    Rt(It, t)
  }

  function Lt(t) {
    Rt(Nt, t)
  }

  function Rt(t, e) {
    At(t, e, pt, gt), t.reset(e)
  }

  function Mt(t) {
    At(Dt, t, _t, vt)
  }

  function Pt(t) {
    At(kt, t, _t, vt)
  }

  function At(t, e, n, i) {
    Object.keys(e).forEach(r => {
      const s = e[r],
        o = t.getItem(r),
        u = dt.debounce(e => {
          e ? t.setItem(r, n(e, yt[r])) : t.removeItem(r)
        }, 100);
      yt[r] = s, Ot[r] || (Ot[r] = new Set), Ot[r].add(u), o ? xt[r] = i(o, s) : (xt[r] = s, u(s))
    })
  }
  class $t {
    constructor(t) {
      this.mode = t, this.rootPaths = [], this.data = {
        PATH: [""],
        HASH: [""],
        BASIC_AUTH: ["", ""]
      }
    }
    getItem(t) {
      return this.data[t]
    }
    setItem(t, e) {
      e !== this.data[t] ? (this.data[t] = e, this.store()) : this.data[t] = e
    }
    removeItem(t) {
      this.data[t] ? (delete this.data[t], this.store()) : delete this.data[t]
    }
    reset(t) {
      this.rootPaths.forEach(t => {}), this.rootPaths = Object.keys(t), this.data = $t.parse(), this.store("replaceState")
    }
    store(t = this.mode) {
      const e = $t.stringify(this.data);
      "undefined" != typeof window && history[t](this.data, "", e)
    }
    static parse(t = Tt(), e = Tt()) {
      const {
        hash: n,
        search: i,
        pathname: r,
        username: s,
        password: o,
        protocol: u,
        host: a,
        hostname: c
      } = new URL(t, e), l = {
        PATH: r.split(/\/+/).slice(1),
        HASH: [n.slice(1)],
        BASIC_AUTH: [s, o]
      };
      return i.slice(1).split("&").forEach(t => {
        const [e, ...n] = t.split("=");
        e && (l[e] = n)
      }), l
    }
    static stringify(t, e = Tt()) {
      const n = t.HASH[0] ? "#" + t.HASH[0] : "";
      let i = "";
      for (const e in t) switch (e) {
        case "PATH":
        case "HASH":
        case "BASIC_AUTH":
          break;
        default:
          t[e].length ? i += `&${e}=${t[e].join("=")}` : i += "&" + e
      }
      return i && (i = "?" + i.slice(1)), new URL(`${i}${n}`, e).href
    }
  }
  const It = new $t("pushState"),
    Nt = new $t("replaceState");

  function Ht(t) {
    const e = dt.toPath(t),
      n = e.join(".");
    Ot[n] || (Ot[n] = new Set);
    const [r, s] = Object(i.useState)(dt.get(xt, e));
    return Object(i.useEffect)(() => (Ot[n].add(s), () => {
      Ot[n].delete(s)
    }), [n]), [r, t => {
      dt.set(xt, e, t), St(e)
    }]
  }
  let Tt, Dt, kt;
  if ("undefined" != typeof window) Tt = () => window.location.href, Dt = window.localStorage, kt = window.sessionStorage, window.addEventListener("popstate", t => {
    $t.parse();
    console.warn(t)
  }), window.addEventListener("storage", ({
    key: t,
    newValue: e
  }) => {
    if (!t || !e) return;
    const n = yt[t];
    if (!n) return;
    const i = vt(e, n);
    xt[t] = i, St([t])
  });
  else {
    Tt = () => "https://localhost/", Dt = kt = {
      getItem: t => "",
      setItem(t) {},
      removeItem(t) {}
    }
  }
}]);