const rt = "[Filtered]";
function it(i, { maxLength: t = 64e3, keysBlocklist: e = [], keysAllowlist: r = [] } = {}) {
  if (i.errors)
    for (let a = 0; a < i.errors.length; a++) {
      let p = new H({ keysBlocklist: e, keysAllowlist: r });
      i.errors[a] = p.truncate(i.errors[a]);
    }
  let s = "", n = ["params", "environment", "session"];
  for (let a = 0; a < 8; a++) {
    let p = { level: a, keysBlocklist: e, keysAllowlist: r };
    for (let h of n) {
      let l = i[h];
      l && (i[h] = st(l, p));
    }
    if (s = JSON.stringify(i), s.length < t)
      return s;
  }
  let o = {
    json: s.slice(0, Math.floor(t / 2)) + "..."
  };
  n.push("errors");
  for (let a of n) {
    let p = i[a];
    p && (s = JSON.stringify(p), o[a] = s.length);
  }
  let u = new Error("airbrake: notice exceeds max length and can't be truncated");
  throw u.params = o, u;
}
function b(i, t) {
  return i >> t || 1;
}
class H {
  constructor(t) {
    this.maxStringLength = 1024, this.maxObjectLength = 128, this.maxArrayLength = 128, this.maxDepth = 8, this.keys = [], this.keysBlocklist = [], this.keysAllowlist = [], this.seen = [];
    let e = t.level || 0;
    this.keysBlocklist = t.keysBlocklist || [], this.keysAllowlist = t.keysAllowlist || [], this.maxStringLength = b(this.maxStringLength, e), this.maxObjectLength = b(this.maxObjectLength, e), this.maxArrayLength = b(this.maxArrayLength, e), this.maxDepth = b(this.maxDepth, e);
  }
  truncate(t, e = "", r = 0) {
    if (t == null)
      return t;
    switch (typeof t) {
      case "boolean":
      case "number":
      case "function":
        return t;
      case "string":
        return this.truncateString(t);
      case "object":
        break;
      default:
        return this.truncateString(String(t));
    }
    if (t instanceof String)
      return this.truncateString(t.toString());
    if (t instanceof Boolean || t instanceof Number || t instanceof Date || t instanceof RegExp)
      return t;
    if (t instanceof Error)
      return this.truncateString(t.toString());
    if (this.seen.indexOf(t) >= 0)
      return `[Circular ${this.getPath(t)}]`;
    let s = nt(t);
    if (r++, r > this.maxDepth)
      return `[Truncated ${s}]`;
    switch (this.keys.push(e), this.seen.push(t), s) {
      case "Array":
        return this.truncateArray(t, r);
      case "Object":
        return this.truncateObject(t, r);
      default:
        let n = this.maxDepth;
        this.maxDepth = 0;
        let o = this.truncateObject(t, r);
        return o.__type = s, this.maxDepth = n, o;
    }
  }
  getPath(t) {
    let e = this.seen.indexOf(t), r = [this.keys[e]];
    for (let s = e; s >= 0; s--) {
      let n = this.seen[s];
      n && R(n, r[0]) === t && (t = n, r.unshift(this.keys[s]));
    }
    return "~" + r.join(".");
  }
  truncateString(t) {
    return t.length > this.maxStringLength ? t.slice(0, this.maxStringLength) + "..." : t;
  }
  truncateArray(t, e = 0) {
    let r = 0, s = [];
    for (let n = 0; n < t.length; n++) {
      let o = t[n];
      if (s.push(this.truncate(o, n.toString(), e)), r++, r >= this.maxArrayLength)
        break;
    }
    return s;
  }
  truncateObject(t, e = 0) {
    let r = 0, s = {};
    for (let n in t) {
      if (!Object.prototype.hasOwnProperty.call(t, n) || this.filterKey(n, s))
        continue;
      let o = R(t, n);
      if (!(o === void 0 || typeof o == "function") && (s[n] = this.truncate(o, n, e), r++, r >= this.maxObjectLength))
        break;
    }
    return s;
  }
  filterKey(t, e) {
    return this.keysAllowlist.length > 0 && !j(t, this.keysAllowlist) || this.keysAllowlist.length === 0 && j(t, this.keysBlocklist) ? (e[t] = rt, !0) : !1;
  }
}
function st(i, t = {}) {
  return new H(t).truncate(i);
}
function R(i, t) {
  try {
    return i[t];
  } catch {
    return;
  }
}
function nt(i) {
  return Object.prototype.toString.apply(i).slice(8, -1);
}
function j(i, t) {
  for (let e of t)
    if (e === i || e instanceof RegExp && i.match(e))
      return !0;
  return !1;
}
class ot {
  constructor(t, e, r) {
    this._dur = 0, this._level = 0, this._metric = t, this.name = e, this.startTime = r || /* @__PURE__ */ new Date();
  }
  end(t) {
    this.endTime = t || /* @__PURE__ */ new Date(), this._dur += this.endTime.getTime() - this.startTime.getTime(), this._metric._incGroup(this.name, this._dur), this._metric = null;
  }
  _pause() {
    if (this._paused())
      return;
    let t = /* @__PURE__ */ new Date();
    this._dur += t.getTime() - this.startTime.getTime(), this.startTime = null;
  }
  _resume() {
    this._paused() && (this.startTime = /* @__PURE__ */ new Date());
  }
  _paused() {
    return this.startTime == null;
  }
}
class J {
  constructor() {
    this._spans = {}, this._groups = {}, this.startTime = /* @__PURE__ */ new Date();
  }
  end(t) {
    this.endTime || (this.endTime = t || /* @__PURE__ */ new Date());
  }
  isRecording() {
    return !0;
  }
  startSpan(t, e) {
    let r = this._spans[t];
    r ? r._level++ : (r = new ot(this, t, e), this._spans[t] = r);
  }
  endSpan(t, e) {
    let r = this._spans[t];
    if (!r) {
      console.error("airbrake: span=%s does not exist", t);
      return;
    }
    r._level > 0 ? r._level-- : (r.end(e), delete this._spans[r.name]);
  }
  _incGroup(t, e) {
    this._groups[t] = (this._groups[t] || 0) + e;
  }
  _duration() {
    return this.endTime || (this.endTime = /* @__PURE__ */ new Date()), this.endTime.getTime() - this.startTime.getTime();
  }
}
class at {
  isRecording() {
    return !1;
  }
  startSpan(t, e) {
  }
  endSpan(t, e) {
  }
  _incGroup(t, e) {
  }
}
class T {
  constructor() {
    this._noopMetric = new at(), this._context = {}, this._historyMaxLen = 20, this._history = [];
  }
  clone() {
    const t = new T();
    return t._context = { ...this._context }, t._history = this._history.slice(), t;
  }
  setContext(t) {
    this._context = { ...this._context, ...t };
  }
  context() {
    const t = { ...this._context };
    return this._history.length > 0 && (t.history = this._history.slice()), t;
  }
  pushHistory(t) {
    if (this._isDupState(t)) {
      this._lastRecord.num ? this._lastRecord.num++ : this._lastRecord.num = 2;
      return;
    }
    t.date || (t.date = /* @__PURE__ */ new Date()), this._history.push(t), this._lastRecord = t, this._history.length > this._historyMaxLen && (this._history = this._history.slice(-this._historyMaxLen));
  }
  _isDupState(t) {
    if (!this._lastRecord)
      return !1;
    for (let e in t)
      if (!(!t.hasOwnProperty(e) || e === "date") && t[e] !== this._lastRecord[e])
        return !1;
    return !0;
  }
  routeMetric() {
    return this._routeMetric || this._noopMetric;
  }
  setRouteMetric(t) {
    this._routeMetric = t;
  }
  queueMetric() {
    return this._queueMetric || this._noopMetric;
  }
  setQueueMetric(t) {
    this._queueMetric = t;
  }
}
var q = typeof globalThis != "undefined" ? globalThis : typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : {};
function ut(i) {
  return i && i.__esModule && Object.prototype.hasOwnProperty.call(i, "default") ? i.default : i;
}
var G = { exports: {} }, k = { exports: {} }, $;
function ht() {
  return $ || ($ = 1, function(i, t) {
    (function(e, r) {
      i.exports = r();
    })(q, function() {
      function e(c) {
        return !isNaN(parseFloat(c)) && isFinite(c);
      }
      function r(c) {
        return c.charAt(0).toUpperCase() + c.substring(1);
      }
      function s(c) {
        return function() {
          return this[c];
        };
      }
      var n = ["isConstructor", "isEval", "isNative", "isToplevel"], o = ["columnNumber", "lineNumber"], u = ["fileName", "functionName", "source"], a = ["args"], p = ["evalOrigin"], h = n.concat(o, u, a, p);
      function l(c) {
        if (c)
          for (var d = 0; d < h.length; d++)
            c[h[d]] !== void 0 && this["set" + r(h[d])](c[h[d]]);
      }
      l.prototype = {
        getArgs: function() {
          return this.args;
        },
        setArgs: function(c) {
          if (Object.prototype.toString.call(c) !== "[object Array]")
            throw new TypeError("Args must be an Array");
          this.args = c;
        },
        getEvalOrigin: function() {
          return this.evalOrigin;
        },
        setEvalOrigin: function(c) {
          if (c instanceof l)
            this.evalOrigin = c;
          else if (c instanceof Object)
            this.evalOrigin = new l(c);
          else
            throw new TypeError("Eval Origin must be an Object or StackFrame");
        },
        toString: function() {
          var c = this.getFileName() || "", d = this.getLineNumber() || "", g = this.getColumnNumber() || "", v = this.getFunctionName() || "";
          return this.getIsEval() ? c ? "[eval] (" + c + ":" + d + ":" + g + ")" : "[eval]:" + d + ":" + g : v ? v + " (" + c + ":" + d + ":" + g + ")" : c + ":" + d + ":" + g;
        }
      }, l.fromString = function(d) {
        var g = d.indexOf("("), v = d.lastIndexOf(")"), z = d.substring(0, g), Y = d.substring(g + 1, v).split(","), L = d.substring(v + 1);
        if (L.indexOf("@") === 0)
          var E = /@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(L, ""), Z = E[1], tt = E[2], et = E[3];
        return new l({
          functionName: z,
          args: Y || void 0,
          fileName: Z,
          lineNumber: tt || void 0,
          columnNumber: et || void 0
        });
      };
      for (var f = 0; f < n.length; f++)
        l.prototype["get" + r(n[f])] = s(n[f]), l.prototype["set" + r(n[f])] = function(c) {
          return function(d) {
            this[c] = !!d;
          };
        }(n[f]);
      for (var _ = 0; _ < o.length; _++)
        l.prototype["get" + r(o[_])] = s(o[_]), l.prototype["set" + r(o[_])] = function(c) {
          return function(d) {
            if (!e(d))
              throw new TypeError(c + " must be a Number");
            this[c] = Number(d);
          };
        }(o[_]);
      for (var m = 0; m < u.length; m++)
        l.prototype["get" + r(u[m])] = s(u[m]), l.prototype["set" + r(u[m])] = function(c) {
          return function(d) {
            this[c] = String(d);
          };
        }(u[m]);
      return l;
    });
  }(k)), k.exports;
}
(function(i, t) {
  (function(e, r) {
    i.exports = r(ht());
  })(q, function(r) {
    var s = /(^|@)\S+:\d+/, n = /^\s*at .*(\S+:\d+|\(native\))/m, o = /^(eval@)?(\[native code])?$/;
    return {
      /**
       * Given an Error object, extract the most information from it.
       *
       * @param {Error} error object
       * @return {Array} of StackFrames
       */
      parse: function(a) {
        if (typeof a.stacktrace != "undefined" || typeof a["opera#sourceloc"] != "undefined")
          return this.parseOpera(a);
        if (a.stack && a.stack.match(n))
          return this.parseV8OrIE(a);
        if (a.stack)
          return this.parseFFOrSafari(a);
        throw new Error("Cannot parse given Error object");
      },
      // Separate line and column numbers from a string of the form: (URI:Line:Column)
      extractLocation: function(a) {
        if (a.indexOf(":") === -1)
          return [a];
        var p = /(.+?)(?::(\d+))?(?::(\d+))?$/, h = p.exec(a.replace(/[()]/g, ""));
        return [h[1], h[2] || void 0, h[3] || void 0];
      },
      parseV8OrIE: function(a) {
        var p = a.stack.split(`
`).filter(function(h) {
          return !!h.match(n);
        }, this);
        return p.map(function(h) {
          h.indexOf("(eval ") > -1 && (h = h.replace(/eval code/g, "eval").replace(/(\(eval at [^()]*)|(,.*$)/g, ""));
          var l = h.replace(/^\s+/, "").replace(/\(eval code/g, "(").replace(/^.*?\s+/, ""), f = l.match(/ (\(.+\)$)/);
          l = f ? l.replace(f[0], "") : l;
          var _ = this.extractLocation(f ? f[1] : l), m = f && l || void 0, c = ["eval", "<anonymous>"].indexOf(_[0]) > -1 ? void 0 : _[0];
          return new r({
            functionName: m,
            fileName: c,
            lineNumber: _[1],
            columnNumber: _[2],
            source: h
          });
        }, this);
      },
      parseFFOrSafari: function(a) {
        var p = a.stack.split(`
`).filter(function(h) {
          return !h.match(o);
        }, this);
        return p.map(function(h) {
          if (h.indexOf(" > eval") > -1 && (h = h.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g, ":$1")), h.indexOf("@") === -1 && h.indexOf(":") === -1)
            return new r({
              functionName: h
            });
          var l = /((.*".+"[^@]*)?[^@]*)(?:@)/, f = h.match(l), _ = f && f[1] ? f[1] : void 0, m = this.extractLocation(h.replace(l, ""));
          return new r({
            functionName: _,
            fileName: m[0],
            lineNumber: m[1],
            columnNumber: m[2],
            source: h
          });
        }, this);
      },
      parseOpera: function(a) {
        return !a.stacktrace || a.message.indexOf(`
`) > -1 && a.message.split(`
`).length > a.stacktrace.split(`
`).length ? this.parseOpera9(a) : a.stack ? this.parseOpera11(a) : this.parseOpera10(a);
      },
      parseOpera9: function(a) {
        for (var p = /Line (\d+).*script (?:in )?(\S+)/i, h = a.message.split(`
`), l = [], f = 2, _ = h.length; f < _; f += 2) {
          var m = p.exec(h[f]);
          m && l.push(new r({
            fileName: m[2],
            lineNumber: m[1],
            source: h[f]
          }));
        }
        return l;
      },
      parseOpera10: function(a) {
        for (var p = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i, h = a.stacktrace.split(`
`), l = [], f = 0, _ = h.length; f < _; f += 2) {
          var m = p.exec(h[f]);
          m && l.push(
            new r({
              functionName: m[3] || void 0,
              fileName: m[2],
              lineNumber: m[1],
              source: h[f]
            })
          );
        }
        return l;
      },
      // Opera 10.65+ Error.stack very similar to FF/Safari
      parseOpera11: function(a) {
        var p = a.stack.split(`
`).filter(function(h) {
          return !!h.match(s) && !h.match(/^Error created at/);
        }, this);
        return p.map(function(h) {
          var l = h.split("@"), f = this.extractLocation(l.pop()), _ = l.shift() || "", m = _.replace(/<anonymous function(: (\w+))?>/, "$2").replace(/\([^)]*\)/g, "") || void 0, c;
          _.match(/\(([^)]*)\)/) && (c = _.replace(/^[^(]+\(([^)]*)\)$/, "$1"));
          var d = c === void 0 || c === "[arguments not available]" ? void 0 : c.split(",");
          return new r({
            functionName: m,
            args: d,
            fileName: f[0],
            lineNumber: f[1],
            columnNumber: f[2],
            source: h
          });
        }, this);
      }
    };
  });
})(G);
var ct = G.exports;
const lt = /* @__PURE__ */ ut(ct), ft = typeof console == "object" && console.warn;
function A(i) {
  try {
    return lt.parse(i);
  } catch (t) {
    ft && i.stack && console.warn("ErrorStackParser:", t.toString(), i.stack);
  }
  return i.fileName ? [i] : [];
}
function pt(i) {
  let t = [];
  if (i.noStack)
    t.push({
      function: i.functionName || "",
      file: i.fileName || "",
      line: i.lineNumber || 0,
      column: i.columnNumber || 0
    });
  else {
    let s = A(i);
    if (s.length === 0)
      try {
        throw new Error("fake");
      } catch (n) {
        s = A(n), s.shift(), s.shift();
      }
    for (let n of s)
      t.push({
        function: n.functionName || "",
        file: n.fileName || "",
        line: n.lineNumber || 0,
        column: n.columnNumber || 0
      });
  }
  let e = i.name ? i.name : "", r = i.message ? String(i.message) : String(i);
  return {
    type: e,
    message: r,
    backtrace: t
  };
}
let dt = new RegExp([
  "^",
  "\\[(\\$.+)\\]",
  "\\s",
  "([\\s\\S]+)",
  "$"
].join(""));
function mt(i) {
  let t = i.errors[0];
  if (t.type !== "" && t.type !== "Error")
    return i;
  let e = t.message.match(dt);
  return e !== null && (t.type = e[1], t.message = e[2]), i;
}
function _t() {
  let i, t;
  return (e) => {
    let r = JSON.stringify(e.errors);
    return r === i ? null : (t && clearTimeout(t), i = r, t = setTimeout(() => {
      i = "";
    }, 1e3), e);
  };
}
const gt = [
  "Script error",
  "Script error.",
  "InvalidAccessError"
];
function yt(i) {
  let t = i.errors[0];
  return t.type === "" && gt.indexOf(t.message) !== -1 || t.backtrace && t.backtrace.length > 0 && t.backtrace[0].file === "<anonymous>" ? null : i;
}
let wt = new RegExp([
  "^",
  "Uncaught\\s",
  "(.+?)",
  ":\\s",
  "(.+)",
  "$"
].join(""));
function St(i) {
  let t = i.errors[0];
  if (t.type !== "" && t.type !== "Error")
    return i;
  let e = t.message.match(wt);
  return e !== null && (t.type = e[1], t.message = e[2]), i;
}
let y = {
  unauthorized: new Error("airbrake: unauthorized: project id or key are wrong"),
  ipRateLimited: new Error("airbrake: IP is rate limited")
}, P = 0;
function vt(i) {
  if (Date.now() / 1e3 < P)
    return Promise.reject(y.ipRateLimited);
  let e = {
    method: i.method,
    body: i.body,
    headers: i.headers
  };
  return fetch(i.url, e).then((r) => {
    if (r.status === 401)
      throw y.unauthorized;
    if (r.status === 429) {
      let s = r.headers.get("X-RateLimit-Delay");
      if (!s)
        throw y.ipRateLimited;
      let n = parseInt(s, 10);
      throw n > 0 && (P = Date.now() / 1e3 + n), y.ipRateLimited;
    }
    if (r.status === 204)
      return { json: null };
    if (r.status === 404)
      throw new Error("404 Not Found");
    return r.status >= 200 && r.status < 300 ? r.json().then((s) => ({ json: s })) : r.status >= 400 && r.status < 500 ? r.json().then((s) => {
      throw new Error(s.message);
    }) : r.text().then((s) => {
      throw new Error(`airbrake: fetch: unexpected response: code=${r.status} body='${s}'`);
    });
  });
}
function Nt(i) {
  return (t) => bt(t, i);
}
let C = 0;
function bt(i, t) {
  return Date.now() / 1e3 < C ? Promise.reject(y.ipRateLimited) : new Promise((r, s) => {
    t({
      url: i.url,
      method: i.method,
      body: i.body,
      headers: {
        "content-type": "application/json"
      },
      timeout: i.timeout
    }, (n, o, u) => {
      if (n) {
        s(n);
        return;
      }
      if (!o.statusCode) {
        n = new Error(`airbrake: request: response statusCode is ${o.statusCode}`), s(n);
        return;
      }
      if (o.statusCode === 401) {
        s(y.unauthorized);
        return;
      }
      if (o.statusCode === 429) {
        s(y.ipRateLimited);
        let a = o.headers["x-ratelimit-delay"];
        if (!a)
          return;
        let p;
        if (typeof a == "string")
          p = a;
        else if (a instanceof Array)
          p = a[0];
        else
          return;
        let h = parseInt(p, 10);
        h > 0 && (C = Date.now() / 1e3 + h);
        return;
      }
      if (o.statusCode === 204) {
        r({ json: null });
        return;
      }
      if (o.statusCode >= 200 && o.statusCode < 300) {
        let a;
        try {
          a = JSON.parse(u);
        } catch (p) {
          s(p);
          return;
        }
        r(a);
        return;
      }
      if (o.statusCode >= 400 && o.statusCode < 500) {
        let a;
        try {
          a = JSON.parse(u);
        } catch (p) {
          s(p);
          return;
        }
        n = new Error(a.message), s(n);
        return;
      }
      u = u.trim(), n = new Error(`airbrake: node: unexpected response: code=${o.statusCode} body='${u}'`), s(n);
    });
  });
}
function S(i) {
  return i.request ? Nt(i.request) : vt;
}
let X, N = !1;
try {
  X = require("tdigest"), N = !0;
} catch {
}
class O {
  constructor() {
    this.count = 0, this.sum = 0, this.sumsq = 0, this._td = new X.Digest();
  }
  add(t) {
    t === 0 && (t = 1e-5), this.count += 1, this.sum += t, this.sumsq += t * t, this._td && this._td.push(t);
  }
  toJSON() {
    return {
      count: this.count,
      sum: this.sum,
      sumsq: this.sumsq,
      tdigestCentroids: U(this._td)
    };
  }
}
class B extends O {
  constructor() {
    super(...arguments), this.groups = {};
  }
  addGroups(t, e) {
    this.add(t);
    for (const r in e)
      e.hasOwnProperty(r) && this.addGroup(r, e[r]);
  }
  addGroup(t, e) {
    let r = this.groups[t];
    r || (r = new O(), this.groups[t] = r), r.add(e);
  }
  toJSON() {
    return {
      count: this.count,
      sum: this.sum,
      sumsq: this.sumsq,
      tdigestCentroids: U(this._td),
      groups: this.groups
    };
  }
}
function U(i) {
  let t = [], e = [];
  return i.centroids.each((r) => {
    t.push(r.mean), e.push(r.n);
  }), {
    mean: t,
    count: e
  };
}
const Ot = 15e3;
class Et {
  constructor(t = "") {
    this.method = "", this.route = "", this.query = "", this.func = "", this.file = "", this.line = 0, this.startTime = /* @__PURE__ */ new Date(), this.query = t;
  }
  _duration() {
    return this.endTime || (this.endTime = /* @__PURE__ */ new Date()), this.endTime.getTime() - this.startTime.getTime();
  }
}
class kt {
  constructor(t) {
    this._m = {}, this._opt = t, this._url = `${t.host}/api/v5/projects/${t.projectId}/queries-stats?key=${t.projectKey}`, this._requester = S(t);
  }
  start(t = "") {
    return new Et(t);
  }
  notify(t) {
    if (!N || !this._opt.performanceStats || !this._opt.queryStats)
      return;
    let e = t._duration();
    const r = 60 * 1e3;
    let s = new Date(Math.floor(t.startTime.getTime() / r) * r), n = {
      method: t.method,
      route: t.route,
      query: t.query,
      func: t.func,
      file: t.file,
      line: t.line,
      time: s
    }, o = JSON.stringify(n), u = this._m[o];
    u || (u = new O(), this._m[o] = u), u.add(e), !this._timer && (this._timer = setTimeout(() => {
      this._flush();
    }, Ot));
  }
  _flush() {
    let t = [];
    for (let s in this._m) {
      if (!this._m.hasOwnProperty(s))
        continue;
      let o = {
        ...JSON.parse(s),
        ...this._m[s].toJSON()
      };
      t.push(o);
    }
    this._m = {}, this._timer = null;
    let e = JSON.stringify({
      environment: this._opt.environment,
      queries: t
    }), r = {
      method: "POST",
      url: this._url,
      body: e
    };
    this._requester(r).then((s) => {
    }).catch((s) => {
      console.error && console.error("can not report queries stats", s);
    });
  }
}
const xt = 15e3;
class Tt extends J {
  constructor(t) {
    super(), this.queue = t, this.startTime = /* @__PURE__ */ new Date();
  }
}
class Lt {
  constructor(t) {
    this._m = {}, this._opt = t, this._url = `${t.host}/api/v5/projects/${t.projectId}/queues-stats?key=${t.projectKey}`, this._requester = S(t);
  }
  notify(t) {
    if (!N || !this._opt.performanceStats || !this._opt.queueStats)
      return;
    let e = t._duration();
    e === 0 && (e = 1e-5);
    const r = 60 * 1e3;
    let s = new Date(Math.floor(t.startTime.getTime() / r) * r), n = {
      queue: t.queue,
      time: s
    }, o = JSON.stringify(n), u = this._m[o];
    u || (u = new B(), this._m[o] = u), u.addGroups(e, t._groups), !this._timer && (this._timer = setTimeout(() => {
      this._flush();
    }, xt));
  }
  _flush() {
    let t = [];
    for (let s in this._m) {
      if (!this._m.hasOwnProperty(s))
        continue;
      let o = {
        ...JSON.parse(s),
        ...this._m[s].toJSON()
      };
      t.push(o);
    }
    this._m = {}, this._timer = null;
    let e = JSON.stringify({
      environment: this._opt.environment,
      queues: t
    }), r = {
      method: "POST",
      url: this._url,
      body: e
    };
    this._requester(r).then((s) => {
    }).catch((s) => {
      console.error && console.error("can not report queues breakdowns", s);
    });
  }
}
const V = 15e3;
class Rt extends J {
  constructor(t = "", e = "", r = 0, s = "") {
    super(), this.method = t, this.route = e, this.statusCode = r, this.contentType = s, this.startTime = /* @__PURE__ */ new Date();
  }
}
class jt {
  constructor(t) {
    this._m = {}, this._opt = t, this._url = `${t.host}/api/v5/projects/${t.projectId}/routes-stats?key=${t.projectKey}`, this._requester = S(t);
  }
  notify(t) {
    if (!N || !this._opt.performanceStats)
      return;
    let e = t._duration();
    const r = 60 * 1e3;
    let s = new Date(Math.floor(t.startTime.getTime() / r) * r), n = {
      method: t.method,
      route: t.route,
      statusCode: t.statusCode,
      time: s
    }, o = JSON.stringify(n), u = this._m[o];
    u || (u = new O(), this._m[o] = u), u.add(e), !this._timer && (this._timer = setTimeout(() => {
      this._flush();
    }, V));
  }
  _flush() {
    let t = [];
    for (let s in this._m) {
      if (!this._m.hasOwnProperty(s))
        continue;
      let o = {
        ...JSON.parse(s),
        ...this._m[s].toJSON()
      };
      t.push(o);
    }
    this._m = {}, this._timer = null;
    let e = JSON.stringify({
      environment: this._opt.environment,
      routes: t
    }), r = {
      method: "POST",
      url: this._url,
      body: e
    };
    this._requester(r).then((s) => {
    }).catch((s) => {
      console.error && console.error("can not report routes stats", s);
    });
  }
}
class $t {
  constructor(t) {
    this._m = {}, this._opt = t, this._url = `${t.host}/api/v5/projects/${t.projectId}/routes-breakdowns?key=${t.projectKey}`, this._requester = S(t);
  }
  notify(t) {
    if (!N || !this._opt.performanceStats || t.statusCode < 200 || t.statusCode >= 300 && t.statusCode < 400 || t.statusCode === 404 || Object.keys(t._groups).length === 0)
      return;
    let e = t._duration();
    e === 0 && (e = 1e-5);
    const r = 60 * 1e3;
    let s = new Date(Math.floor(t.startTime.getTime() / r) * r), n = {
      method: t.method,
      route: t.route,
      responseType: this._responseType(t),
      time: s
    }, o = JSON.stringify(n), u = this._m[o];
    u || (u = new B(), this._m[o] = u), u.addGroups(e, t._groups), !this._timer && (this._timer = setTimeout(() => {
      this._flush();
    }, V));
  }
  _flush() {
    let t = [];
    for (let s in this._m) {
      if (!this._m.hasOwnProperty(s))
        continue;
      let o = {
        ...JSON.parse(s),
        ...this._m[s].toJSON()
      };
      t.push(o);
    }
    this._m = {}, this._timer = null;
    let e = JSON.stringify({
      environment: this._opt.environment,
      routes: t
    }), r = {
      method: "POST",
      url: this._url,
      body: e
    };
    this._requester(r).then((s) => {
    }).catch((s) => {
      console.error && console.error("can not report routes breakdowns", s);
    });
  }
  _responseType(t) {
    if (t.statusCode >= 500)
      return "5xx";
    if (t.statusCode >= 400)
      return "4xx";
    if (!t.contentType)
      return "";
    const e = t.contentType.split(";")[0].split("/");
    return e[e.length - 1];
  }
}
const K = "airbrake-js/browser", W = "2.1.8", At = "https://github.com/airbrake/airbrake-js/tree/master/packages/browser", Pt = "2020-06-18", Ct = 6e5, It = {
  notifier_name: K,
  notifier_version: W,
  os: typeof window != "undefined" && window.navigator && window.navigator.userAgent ? window.navigator.userAgent : void 0,
  language: "JavaScript"
}, I = "errors", D = "apm";
class Dt {
  constructor(t) {
    this._opt = t, this._requester = S(t), this._data = new Ft(t.projectId, {
      project_id: null,
      poll_sec: 0,
      updated_at: 0,
      config_route: "",
      settings: []
    }), this._origErrorNotifications = t.errorNotifications, this._origPerformanceStats = t.performanceStats;
  }
  poll() {
    const t = setInterval(() => {
      this._doRequest(), clearInterval(t);
    }, 0);
    return setInterval(this._doRequest.bind(this), Ct);
  }
  _doRequest() {
    this._requester(this._requestParams(this._opt)).then((t) => {
      this._data.merge(t.json), this._opt.host = this._data.errorHost(), this._opt.apmHost = this._data.apmHost(), this._processErrorNotifications(this._data), this._processPerformanceStats(this._data);
    }).catch((t) => {
    });
  }
  _requestParams(t) {
    return {
      method: "GET",
      url: this._pollUrl(t),
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache,no-store"
      }
    };
  }
  _pollUrl(t) {
    const e = this._data.configRoute(t.remoteConfigHost);
    let r = "?";
    for (const [s, n] of this._entries(It))
      r += `&${encodeURIComponent(s)}=${encodeURIComponent(n)}`;
    return e + r;
  }
  _processErrorNotifications(t) {
    this._origErrorNotifications && (this._opt.errorNotifications = t.errorNotifications());
  }
  _processPerformanceStats(t) {
    this._origPerformanceStats && (this._opt.performanceStats = t.performanceStats());
  }
  // Polyfill from:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries#polyfill
  _entries(t) {
    const e = Object.keys(t);
    let r = e.length;
    const s = new Array(r);
    for (; r--; )
      s[r] = [e[r], t[e[r]]];
    return s;
  }
}
class Ft {
  constructor(t, e) {
    this._projectId = t, this._data = e;
  }
  merge(t) {
    this._data = { ...this._data, ...t };
  }
  configRoute(t) {
    const e = t.replace(/\/$/, ""), r = this._data.config_route;
    return r == null || r === "" ? `${e}/${Pt}/config/${this._projectId}/config.json` : `${e}/${r}`;
  }
  errorNotifications() {
    const t = this._findSetting(I);
    return t === null ? !0 : t.enabled;
  }
  performanceStats() {
    const t = this._findSetting(D);
    return t === null ? !0 : t.enabled;
  }
  errorHost() {
    const t = this._findSetting(I);
    return t === null ? null : t.endpoint;
  }
  apmHost() {
    const t = this._findSetting(D);
    return t === null ? null : t.endpoint;
  }
  _findSetting(t) {
    const e = this._data.settings;
    if (e == null)
      return null;
    const r = e.find((s) => s.name === t);
    return r === void 0 ? null : r;
  }
}
class Mt {
  constructor(t) {
    if (this._filters = [], this._performanceFilters = [], this._scope = new T(), this._onClose = [], !t.projectId || !t.projectKey)
      throw new Error("airbrake: projectId and projectKey are required");
    if (this._opt = t, this._opt.host = this._opt.host || "https://api.airbrake.io", this._opt.remoteConfigHost = this._opt.remoteConfigHost || "https://notifier-configs.airbrake.io", this._opt.apmHost = this._opt.apmHost || "https://api.airbrake.io", this._opt.timeout = this._opt.timeout || 1e4, this._opt.keysBlocklist = this._opt.keysBlocklist || [/password/, /secret/], this._url = `${this._opt.host}/api/v3/projects/${this._opt.projectId}/notices?key=${this._opt.projectKey}`, this._opt.errorNotifications = this._opt.errorNotifications !== !1, this._opt.performanceStats = this._opt.performanceStats !== !1, this._opt.queryStats = this._opt.queryStats !== !1, this._opt.queueStats = this._opt.queueStats !== !1, this._opt.remoteConfig = this._opt.remoteConfig !== !1, this._processor = this._opt.processor || pt, this._requester = S(this._opt), this.addFilter(yt), this.addFilter(_t()), this.addFilter(St), this.addFilter(mt), this.addFilter((e) => (e.context.notifier = {
      name: K,
      version: W,
      url: At
    }, this._opt.environment && (e.context.environment = this._opt.environment), e)), this.routes = new Ht(this), this.queues = new Jt(this), this.queries = new kt(this._opt), this._opt.remoteConfig) {
      const e = new Dt(this._opt).poll();
      this._onClose.push(() => clearInterval(e));
    }
  }
  close() {
    for (let t of this._onClose)
      t();
  }
  scope() {
    return this._scope;
  }
  setActiveScope(t) {
    this._scope = t;
  }
  addFilter(t) {
    this._filters.push(t);
  }
  addPerformanceFilter(t) {
    this._performanceFilters.push(t);
  }
  notify(t) {
    (typeof t != "object" || t === null || !("error" in t)) && (t = { error: t }), this.handleFalseyError(t);
    let e = this.newNotice(t);
    if (!this._opt.errorNotifications)
      return e.error = new Error(`airbrake: not sending this error, errorNotifications is disabled err=${JSON.stringify(t.error)}`), Promise.resolve(e);
    let r = this._processor(t.error);
    e.errors.push(r);
    for (let s of this._filters) {
      let n = s(e);
      if (n === null)
        return e.error = new Error("airbrake: error is filtered"), Promise.resolve(e);
      e = n;
    }
    return e.context || (e.context = {}), e.context.language = "JavaScript", this._sendNotice(e);
  }
  handleFalseyError(t) {
    Number.isNaN(t.error) ? t.error = new Error("NaN") : t.error === void 0 ? t.error = new Error("undefined") : t.error === "" ? t.error = new Error("<empty string>") : t.error === null && (t.error = new Error("null"));
  }
  newNotice(t) {
    return {
      errors: [],
      context: {
        severity: "error",
        ...this.scope().context(),
        ...t.context
      },
      params: t.params || {},
      environment: t.environment || {},
      session: t.session || {}
    };
  }
  _sendNotice(t) {
    let e = it(t, {
      // @ts-ignore
      keysBlocklist: this._opt.keysBlocklist
    });
    if (this._opt.reporter) {
      if (typeof this._opt.reporter == "function")
        return this._opt.reporter(t);
      console.warn("airbrake: options.reporter must be a function");
    }
    let r = {
      method: "POST",
      url: this._url,
      body: e
    };
    return this._requester(r).then((s) => (t.id = s.json.id, t.url = s.json.url, t)).catch((s) => (t.error = s, t));
  }
  wrap(t, e = []) {
    if (t._airbrake)
      return t;
    let r = this, s = function() {
      let n = Array.prototype.slice.call(arguments), o = r._wrapArguments(n);
      try {
        return t.apply(this, o);
      } catch (u) {
        throw r.notify({ error: u, params: { arguments: n } }), r._ignoreNextWindowError(), u;
      }
    };
    for (let n in t)
      t.hasOwnProperty(n) && (s[n] = t[n]);
    for (let n of e)
      t.hasOwnProperty(n) && (s[n] = t[n]);
    return s._airbrake = !0, s.inner = t, s;
  }
  _wrapArguments(t) {
    for (let e = 0; e < t.length; e++) {
      let r = t[e];
      typeof r == "function" && (t[e] = this.wrap(r));
    }
    return t;
  }
  _ignoreNextWindowError() {
  }
  call(t, ...e) {
    return this.wrap(t).apply(this, Array.prototype.slice.call(arguments, 1));
  }
}
class Ht {
  constructor(t) {
    this._notifier = t, this._routes = new jt(t._opt), this._breakdowns = new $t(t._opt), this._opt = t._opt;
  }
  start(t = "", e = "", r = 0, s = "") {
    const n = new Rt(t, e, r, s);
    if (!this._opt.performanceStats)
      return n;
    const o = this._notifier.scope().clone();
    return o.setContext({ httpMethod: t, route: e }), o.setRouteMetric(n), this._notifier.setActiveScope(o), n;
  }
  notify(t) {
    if (this._opt.performanceStats) {
      t.end();
      for (const e of this._notifier._performanceFilters)
        if (e(t) === null)
          return;
      this._routes.notify(t), this._breakdowns.notify(t);
    }
  }
}
class Jt {
  constructor(t) {
    this._notifier = t, this._queues = new Lt(t._opt), this._opt = t._opt;
  }
  start(t) {
    const e = new Tt(t);
    if (!this._opt.performanceStats)
      return e;
    const r = this._notifier.scope().clone();
    return r.setContext({ queue: t }), r.setQueueMetric(e), this._notifier.setActiveScope(r), e;
  }
  notify(t) {
    this._opt.performanceStats && (t.end(), this._queues.notify(t));
  }
}
function qt(i) {
  return window.navigator && window.navigator.userAgent && (i.context.userAgent = window.navigator.userAgent), window.location && (i.context.url = String(window.location), i.context.rootDirectory = window.location.protocol + "//" + window.location.host), i;
}
const Gt = ["debug", "log", "info", "warn", "error"];
function Xt(i) {
  for (let t of Gt) {
    if (!(t in console))
      continue;
    const e = console[t];
    let r = (...s) => {
      e.apply(console, s), i.scope().pushHistory({
        type: "log",
        severity: t,
        arguments: s
      });
    };
    r.inner = e, console[t] = r;
  }
}
const Bt = ["type", "name", "src"];
function Ut(i) {
  const t = Vt(i);
  window.addEventListener && (window.addEventListener("load", t), window.addEventListener("error", (e) => {
    Q(e, "error") || t(e);
  }, !0)), typeof document == "object" && document.addEventListener && (document.addEventListener("DOMContentLoaded", t), document.addEventListener("click", t), document.addEventListener("keypress", t));
}
function Vt(i) {
  return (t) => {
    let e = Q(t, "target");
    if (!e)
      return;
    let r = { type: t.type };
    try {
      r.target = Qt(e);
    } catch (s) {
      r.target = `<${String(s)}>`;
    }
    i.scope().pushHistory(r);
  };
}
function Kt(i) {
  if (!i)
    return "";
  let t = [];
  if (i.tagName && t.push(i.tagName.toLowerCase()), i.id && (t.push("#"), t.push(i.id)), i.classList && Array.from)
    t.push("."), t.push(Array.from(i.classList).join("."));
  else if (i.className) {
    let e = Wt(i.className);
    e !== "" && (t.push("."), t.push(e));
  }
  if (i.getAttribute)
    for (let e of Bt) {
      let r = i.getAttribute(e);
      r && t.push(`[${e}="${r}"]`);
    }
  return t.join("");
}
function Wt(i) {
  return i.split ? i.split(" ").join(".") : i.baseVal && i.baseVal.split ? i.baseVal.split(" ").join(".") : (console.error("unsupported HTMLElement.className type", typeof i), "");
}
function Qt(i) {
  let e = [], r = i;
  for (; r; ) {
    let s = Kt(r);
    if (s !== "" && (e.push(s), e.length > 10))
      break;
    r = r.parentNode;
  }
  return e.length === 0 ? String(i) : e.reverse().join(" > ");
}
function Q(i, t) {
  try {
    return i[t];
  } catch {
    return null;
  }
}
function zt(i) {
  let t = window.fetch;
  window.fetch = function(e, r) {
    let s = {
      type: "xhr",
      date: /* @__PURE__ */ new Date()
    };
    return s.method = r && r.method ? r.method : "GET", typeof e == "string" ? s.url = e : (s.method = e.method, s.url = e.url), i._ignoreNextXHR++, setTimeout(() => i._ignoreNextXHR--), t.apply(this, arguments).then((n) => (s.statusCode = n.status, s.duration = (/* @__PURE__ */ new Date()).getTime() - s.date.getTime(), i.scope().pushHistory(s), n)).catch((n) => {
      throw s.error = n, s.duration = (/* @__PURE__ */ new Date()).getTime() - s.date.getTime(), i.scope().pushHistory(s), n;
    });
  };
}
let x = "";
function F() {
  return document.location && document.location.pathname;
}
function Yt(i) {
  x = F();
  const t = window.onpopstate;
  window.onpopstate = function(s) {
    const n = F();
    if (n && M(i, n), t)
      return t.apply(this, arguments);
  };
  const e = history.pushState;
  history.pushState = function(s, n, o) {
    o && M(i, o.toString()), e.apply(this, arguments);
  };
}
function M(i, t) {
  let e = t.indexOf("://");
  e >= 0 ? (t = t.slice(e + 3), e = t.indexOf("/"), t = e >= 0 ? t.slice(e) : "/") : t.charAt(0) !== "/" && (t = "/" + t), i.scope().pushHistory({
    type: "location",
    from: x,
    to: t
  }), x = t;
}
function Zt(i) {
  function t(s) {
    const n = s.__state;
    n.statusCode = s.status, n.duration = (/* @__PURE__ */ new Date()).getTime() - n.date.getTime(), i.scope().pushHistory(n);
  }
  const e = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(n, o, u, a, p) {
    i._ignoreNextXHR === 0 && (this.__state = {
      type: "xhr",
      method: n,
      url: o
    }), e.apply(this, arguments);
  };
  const r = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(n) {
    let o = this.onreadystatechange;
    return this.onreadystatechange = function(u) {
      if (this.readyState === 4 && this.__state && t(this), o)
        return o.apply(this, arguments);
    }, this.__state && (this.__state.date = /* @__PURE__ */ new Date()), r.apply(this, arguments);
  };
}
function te(i) {
  const t = ee.bind(i);
  window.addEventListener("unhandledrejection", t), i._onClose.push(() => {
    window.removeEventListener("unhandledrejection", t);
  });
}
function ee(i) {
  let t = i.reason || i.detail && i.detail.reason;
  if (!t)
    return;
  let e = t.message || String(t);
  if (!(e.indexOf && e.indexOf("airbrake: ") === 0)) {
    if (typeof t != "object" || t.error === void 0) {
      this.notify({
        error: t,
        context: {
          unhandledRejection: !0
        }
      });
      return;
    }
    this.notify({ ...t, context: { unhandledRejection: !0 } });
  }
}
class ie extends Mt {
  constructor(t) {
    super(t), this.offline = !1, this.todo = [], this._ignoreWindowError = 0, this._ignoreNextXHR = 0, typeof window != "undefined" && (this.addFilter(qt), window.addEventListener && (this.onOnline = this.onOnline.bind(this), window.addEventListener("online", this.onOnline), this.onOffline = this.onOffline.bind(this), window.addEventListener("offline", this.onOffline), this._onClose.push(() => {
      window.removeEventListener("online", this.onOnline), window.removeEventListener("offline", this.onOffline);
    })), this._instrument(t.instrumentation));
  }
  _instrument(t = {}) {
    if (t.console === void 0 && (t.console = !re(this._opt.environment)), w(t.onerror)) {
      let e = this, r = window.onerror;
      window.onerror = function() {
        r && r.apply(this, arguments), e.onerror.apply(e, arguments);
      };
    }
    Ut(this), w(t.fetch) && typeof fetch == "function" && zt(this), w(t.history) && typeof history == "object" && Yt(this), w(t.console) && typeof console == "object" && Xt(this), w(t.xhr) && typeof XMLHttpRequest != "undefined" && Zt(this), w(t.unhandledrejection) && typeof addEventListener == "function" && te(this);
  }
  notify(t) {
    return this.offline ? new Promise((e, r) => {
      for (this.todo.push({
        err: t,
        resolve: e,
        reject: r
      }); this.todo.length > 100; ) {
        let s = this.todo.shift();
        if (s === void 0)
          break;
        s.resolve({
          error: new Error("airbrake: offline queue is too large")
        });
      }
    }) : super.notify(t);
  }
  onOnline() {
    this.offline = !1;
    for (let t of this.todo)
      this.notify(t.err).then((e) => {
        t.resolve(e);
      });
    this.todo = [];
  }
  onOffline() {
    this.offline = !0;
  }
  onerror(t, e, r, s, n) {
    if (!(this._ignoreWindowError > 0)) {
      if (n) {
        this.notify({
          error: n,
          context: {
            windowError: !0
          }
        });
        return;
      }
      !e || !r || this.notify({
        error: {
          message: t,
          fileName: e,
          lineNumber: r,
          columnNumber: s,
          noStack: !0
        },
        context: {
          windowError: !0
        }
      });
    }
  }
  _ignoreNextWindowError() {
    this._ignoreWindowError++, setTimeout(() => this._ignoreWindowError--);
  }
}
function re(i) {
  return i && i.startsWith && i.startsWith("dev");
}
function w(i) {
  return i === void 0 || i === !0;
}
export {
  Mt as BaseNotifier,
  ie as Notifier,
  Et as QueryInfo,
  T as Scope
};
//# sourceMappingURL=index.js.map
