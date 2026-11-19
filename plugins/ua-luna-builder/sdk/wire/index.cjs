"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/wire/index.ts
var wire_exports = {};
__export(wire_exports, {
  ConnectionLost: () => ConnectionLost,
  DEFAULT_LUNA_PORT: () => DEFAULT_LUNA_PORT,
  Disposed: () => Disposed,
  FloatLiteral: () => FloatLiteral,
  MockEngine: () => MockEngine,
  MockPort: () => MockPort,
  NoSessionOpen: () => NoSessionOpen,
  NotRunning: () => NotRunning,
  RequestTimeout: () => RequestTimeout,
  UAError: () => UAError,
  Unsupported: () => Unsupported,
  WebSocketPort: () => WebSocketPort,
  appendParams: () => appendParams,
  consoleLog: () => consoleLog,
  correlationId: () => correlationId,
  decodeMessage: () => decodeMessage,
  encodePayload: () => encodePayload,
  encodeRequest: () => encodeRequest,
  eventMatches: () => eventMatches,
  expandMulti: () => expandMulti,
  float: () => float,
  getOptionsToParams: () => getOptionsToParams,
  joinPath: () => joinPath,
  propertyValue: () => propertyValue,
  splitPath: () => splitPath,
  stripValueSuffix: () => stripValueSuffix,
  toEvent: () => toEvent
});
module.exports = __toCommonJS(wire_exports);

// src/wire/port.ts
var WIRE_KEYS = {
  properties: "properties",
  children: "children",
  commands: "commands",
  flatvalue: "flatvalue",
  propinfo: "propinfo",
  cmdparams: "cmdparams",
  propfilter: "propfilter",
  recursive: "recursive",
  levels: "levels",
  hidden: "hidden",
  offset: "offset",
  limit: "limit",
  includedChildren: "included_children",
  excludedChildren: "excluded_children",
  ignoreResponse: "ignore_response"
};
function getOptionsToParams(options) {
  const params = {};
  if (!options) return params;
  for (const key of Object.keys(options)) {
    const value = options[key];
    if (value === void 0) continue;
    params[WIRE_KEYS[key]] = typeof value === "boolean" ? value ? "1" : "0" : String(value);
  }
  return params;
}
function stripValueSuffix(path) {
  return path.endsWith("/value") ? path.slice(0, -"/value".length) : path;
}
function toEvent(message) {
  const event = { path: stripValueSuffix(message.path), data: message.data };
  if (message.operation) event.operation = message.operation;
  return event;
}
function eventMatches(subPath, eventPath) {
  if (subPath === "/" || subPath === "") return true;
  return eventPath === subPath || eventPath.startsWith(subPath + "/");
}
function propertyValue(data) {
  if (data !== null && typeof data === "object" && !Array.isArray(data) && "value" in data) {
    const keys = Object.keys(data);
    if (keys.length === 1 || keys.every((k) => k === "value" || k === "default" || k === "type" || k === "readonly")) {
      return data.value;
    }
  }
  return data;
}
function splitPath(path) {
  const at = path.lastIndexOf("/");
  if (at <= 0) return { node: "/", name: path.slice(at + 1) };
  return { node: path.slice(0, at), name: path.slice(at + 1) };
}
function joinPath(...segments) {
  const parts = [];
  for (const segment of segments) {
    for (const piece of segment.split("/")) {
      if (piece.length > 0) parts.push(piece);
    }
  }
  return "/" + parts.join("/");
}
var consoleLog = (level, message, detail) => {
  if (level === "error") console.error(`[Luna] ${message}`, detail ?? "");
  else if (level === "warn") console.warn(`[Luna] ${message}`, detail ?? "");
};

// src/wire/errors.ts
var UAError = class extends Error {
  /** Engine error string or one of the SDK codes. */
  code;
  /** Verb of the request that failed, when known. */
  cmd;
  /** Path of the request that failed, when known. */
  path;
  constructor(code, message, detail = {}) {
    super(message);
    this.name = "UAError";
    this.code = code;
    this.cmd = detail.cmd;
    this.path = detail.path;
  }
};
var NotRunning = class extends UAError {
  constructor(url) {
    super("not_running", `No LUNA engine at ${url}. Start LUNA and open a session.`);
    this.name = "NotRunning";
  }
};
var RequestTimeout = class extends UAError {
  constructor(cmd, path, ms) {
    super("timeout", `${cmd} ${path} did not answer within ${ms} ms`, { cmd, path });
    this.name = "RequestTimeout";
  }
};
var ConnectionLost = class extends UAError {
  constructor(cmd, path) {
    super("disconnected", cmd ? `connection lost during ${cmd} ${path}` : "connection lost", cmd && path ? { cmd, path } : {});
    this.name = "ConnectionLost";
  }
};
var Unsupported = class extends UAError {
  constructor(what) {
    super("unsupported", what);
    this.name = "Unsupported";
  }
};
var NoSessionOpen = class extends UAError {
  constructor() {
    super("no_session", "No session is open. Open or create one in LUNA, or call luna.sessions.create().");
    this.name = "NoSessionOpen";
  }
};
var Disposed = class extends UAError {
  constructor(what, path) {
    super("disposed", `${what} was disposed: the engine removed it`, path ? { path } : {});
    this.name = "Disposed";
  }
};

// src/wire/codec.ts
function appendParams(path, params) {
  if (!params) return path;
  const entries = Object.entries(params);
  if (entries.length === 0) return path;
  const query = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  return path + (path.includes("?") ? "&" : "?") + query;
}
var FloatLiteral = class {
  constructor(value) {
    this.value = value;
    if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`Luna.float: ${String(value)} is not a finite number`);
  }
  value;
  /** The literal as it goes on the wire: always with a fraction or an exponent. */
  toLiteral() {
    const text = String(this.value);
    return /[.eE]/.test(text) ? text : `${text}.0`;
  }
  toJSON() {
    return this.value;
  }
};
function float(value) {
  return value instanceof FloatLiteral ? value : new FloatLiteral(value);
}
var floatNonce = 0;
function encodePayload(data) {
  if (data === void 0) return "";
  let floats = false;
  const marker = `float${++floatNonce}:`;
  const text = JSON.stringify(data, function(key, value) {
    const original = this[key];
    if (original instanceof FloatLiteral) {
      floats = true;
      return marker + original.toLiteral();
    }
    return value;
  });
  if (!floats) return text;
  const quoted = JSON.stringify(marker).slice(1, -1);
  return text.replace(new RegExp(`"${quoted.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")}([^"]*)"`, "g"), "$1");
}
function encodeRequest(verb, path, params, data) {
  const payload = encodePayload(data);
  return `${verb} ${appendParams(path, params)}${payload ? " " + payload : ""}`;
}
var JSON_MAGIC = "JSON";
function decodeMessage(text) {
  let body = text;
  if (body.startsWith(JSON_MAGIC)) body = body.slice(8);
  const nul = body.indexOf("\0");
  if (nul >= 0) body = body.slice(0, nul);
  body = body.trim();
  if (body.length === 0) return void 0;
  let raw;
  try {
    raw = JSON.parse(body);
  } catch {
    return void 0;
  }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return void 0;
  const record = raw;
  const path = typeof record["path"] === "string" ? record["path"] : typeof record["url"] === "string" ? record["url"] : void 0;
  if (path === void 0) return void 0;
  const message = { path };
  if ("data" in record) message.data = record["data"];
  if (record["operation"] === "added" || record["operation"] === "removed") message.operation = record["operation"];
  if (record["parameters"] !== null && typeof record["parameters"] === "object") {
    message.parameters = record["parameters"];
  }
  if (typeof record["error"] === "string") message.error = record["error"];
  if (typeof record["cmd"] === "string") message.cmd = record["cmd"];
  return message;
}
function correlationId(message, key) {
  const value = message.parameters?.[key];
  return value === void 0 || value === null ? void 0 : String(value);
}

// src/wire/multi.ts
function isPacked(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return false;
  const p = data;
  return Array.isArray(p["data"]) && Array.isArray(p["path"]) && Array.isArray(p["name"]) && Array.isArray(p["parent"]) && Array.isArray(p["string"]);
}
var MAX_DEPTH = 256;
function packedPath(p, id) {
  const parts = [];
  let current = id;
  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const nameIndex = p.name[current];
    const parent = p.parent[current];
    if (nameIndex === void 0 || parent === void 0) break;
    parts.push(p.string[nameIndex] ?? "");
    if (parent === current) break;
    current = parent;
  }
  return "/" + parts.reverse().join("/");
}
function expandMulti(message) {
  if (message.path !== "multi") return [message];
  const payload = message.data;
  if (Array.isArray(payload)) {
    const out2 = [];
    for (const entry of payload) {
      if (entry !== null && typeof entry === "object" && typeof entry.path === "string") {
        out2.push(entry);
      }
    }
    return out2;
  }
  if (!isPacked(payload)) return [];
  const out = [];
  for (let i = 0; i < payload.data.length; i++) {
    const pathId = payload.path[i];
    if (pathId === void 0) continue;
    out.push({ path: packedPath(payload, pathId), data: payload.data[i] });
  }
  for (const i of payload.added ?? []) {
    const m = out[i];
    if (m) m.operation = "added";
  }
  for (const i of payload.removed ?? []) {
    const m = out[i];
    if (m) m.operation = "removed";
  }
  return out;
}

// src/wire/websocket-port.ts
var DEFAULT_LUNA_PORT = 4718;
var OPEN = 1;
function unref(timer) {
  const t = timer;
  if (typeof t.unref === "function") t.unref();
}
var WebSocketPort = class {
  url;
  Socket;
  requestTimeoutMs;
  reconnectEnabled;
  reconnectMinMs;
  reconnectMaxMs;
  heartbeatEnabled;
  idKey;
  onUnhandled;
  log;
  socket;
  status = "disconnected";
  everConnected = false;
  closed = false;
  nextId = 1;
  pending = /* @__PURE__ */ new Map();
  subscriptions = /* @__PURE__ */ new Map();
  statusListeners = /* @__PURE__ */ new Set();
  reconnectTimer;
  reconnectDelay;
  heartbeatTimer;
  constructor(options = {}) {
    this.url = options.url ?? `ws://${options.host ?? "localhost"}:${options.port ?? DEFAULT_LUNA_PORT}`;
    const Socket = options.WebSocket ?? globalThis.WebSocket;
    if (!Socket) throw new UAError("no_websocket", "No WebSocket implementation available; pass one in options.WebSocket");
    this.Socket = Socket;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 1e4;
    this.reconnectEnabled = options.reconnect ?? true;
    this.reconnectMinMs = options.reconnectMinMs ?? 250;
    this.reconnectMaxMs = options.reconnectMaxMs ?? 1e4;
    this.reconnectDelay = this.reconnectMinMs;
    this.heartbeatEnabled = options.heartbeat ?? true;
    this.idKey = options.idKey ?? "ua_id";
    this.onUnhandled = options.onUnhandled;
    this.log = options.log ?? consoleLog;
  }
  get connected() {
    return this.status === "connected";
  }
  /**
   * Connect. Resolves once the socket is open. Rejects with {@link NotRunning} if the first
   * attempt fails, or has not opened within `requestTimeoutMs`; later drops are handled by
   * reconnect instead.
   */
  open() {
    if (this.closed) return Promise.reject(new ConnectionLost());
    if (this.status === "connected") return Promise.resolve();
    return new Promise((resolve, reject) => {
      let settled = false;
      const socket = new this.Socket(this.url);
      this.socket = socket;
      this.setStatus("connecting");
      const openTimer = setTimeout(() => {
        if (this.socket !== socket || settled) return;
        this.log("warn", `no answer from ${this.url} within ${this.requestTimeoutMs} ms`, { url: this.url, timeoutMs: this.requestTimeoutMs });
        dropped();
      }, this.requestTimeoutMs);
      unref(openTimer);
      const dropped = () => {
        clearTimeout(openTimer);
        if (this.socket !== socket) return;
        this.socket = void 0;
        socket.onopen = socket.onerror = socket.onclose = socket.onmessage = null;
        try {
          if (socket.readyState !== 3) socket.close();
        } catch {
        }
        this.stopHeartbeat();
        this.failPending();
        if (!settled) {
          settled = true;
          this.setStatus("disconnected");
          if (!this.everConnected) {
            reject(new NotRunning(this.url));
            return;
          }
        } else if (!this.closed) {
          this.setStatus("disconnected");
        }
        this.scheduleReconnect();
      };
      socket.onopen = () => {
        clearTimeout(openTimer);
        settled = true;
        this.everConnected = true;
        this.reconnectDelay = this.reconnectMinMs;
        this.setStatus("connected");
        this.resubscribeAll();
        this.startHeartbeat();
        resolve();
      };
      socket.onmessage = (ev) => this.handleFrame(ev.data);
      socket.onerror = dropped;
      socket.onclose = dropped;
    });
  }
  async get(path, options) {
    return this.request("get", path, getOptionsToParams(options), void 0, options?.ignoreResponse === true);
  }
  async set(path, data) {
    await this.request("set", path, {}, data, false);
  }
  async post(path, data) {
    return this.request("post", path, {}, data, false);
  }
  subscribe(path, handler, options) {
    const recursive = options?.recursive === true;
    const key = `${path}|${recursive ? 1 : 0}`;
    let sub = this.subscriptions.get(key);
    if (!sub) {
      sub = { path, recursive, handlers: /* @__PURE__ */ new Set() };
      this.subscriptions.set(key, sub);
      if (this.connected) this.sendSubscribe(sub);
    }
    sub.handlers.add(handler);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const current = this.subscriptions.get(key);
      if (!current) return;
      current.handlers.delete(handler);
      if (current.handlers.size === 0) {
        this.subscriptions.delete(key);
        if (this.connected) this.fireAndForget("unsubscribe", current.path, {});
      }
    };
  }
  onStatus(listener) {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }
  async close() {
    if (this.closed) return;
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = void 0;
    this.stopHeartbeat();
    const socket = this.socket;
    this.socket = void 0;
    this.failPending();
    this.setStatus("closed");
    if (socket) {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 300);
        unref(timer);
        socket.onclose = () => {
          clearTimeout(timer);
          resolve();
        };
        try {
          socket.close();
        } catch {
          clearTimeout(timer);
          resolve();
        }
      });
    }
  }
  // -----------------------------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------------------------
  request(verb, path, params, data, ignoreResponse) {
    const socket = this.socket;
    if (!socket || socket.readyState !== OPEN || !this.connected) {
      return Promise.reject(new ConnectionLost(verb, path));
    }
    if (ignoreResponse) {
      socket.send(encodeRequest(verb, path, params, data));
      return Promise.resolve(void 0);
    }
    const id = `r${this.nextId++}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        this.log("warn", `${verb} ${path} timed out`, { verb, path, ms: this.requestTimeoutMs });
        reject(new RequestTimeout(verb, path, this.requestTimeoutMs));
      }, this.requestTimeoutMs);
      unref(timer);
      this.pending.set(id, { verb, path, resolve, reject, timer });
      socket.send(encodeRequest(verb, path, { ...params, [this.idKey]: id }, data));
    });
  }
  fireAndForget(verb, path, params) {
    const socket = this.socket;
    if (!socket || socket.readyState !== OPEN) return;
    socket.send(encodeRequest(verb, appendParams(path, { ignore_response: "1" }), params));
  }
  sendSubscribe(sub) {
    this.fireAndForget("subscribe", sub.path, sub.recursive ? { recursive: "1" } : {});
  }
  resubscribeAll() {
    for (const sub of this.subscriptions.values()) this.sendSubscribe(sub);
  }
  handleFrame(data) {
    if (typeof data !== "string") return;
    const message = decodeMessage(data);
    if (!message) return;
    for (const entry of expandMulti(message)) {
      const id = correlationId(entry, this.idKey);
      if (id !== void 0) {
        const pending = this.pending.get(id);
        if (!pending) continue;
        this.pending.delete(id);
        clearTimeout(pending.timer);
        if (entry.error !== void 0) {
          pending.reject(new UAError(entry.error, `${pending.verb} ${pending.path}: ${entry.error}`, { cmd: pending.verb, path: pending.path }));
        } else {
          pending.resolve(entry.data);
        }
        continue;
      }
      if (entry.parameters && "ignore_response" in entry.parameters) continue;
      const event = toEvent(entry);
      let delivered = false;
      for (const sub of this.subscriptions.values()) {
        if (!eventMatches(sub.path, event.path)) continue;
        delivered = true;
        for (const handler of sub.handlers) {
          try {
            handler(event);
          } catch (err) {
            this.log("error", "subscription handler threw", { path: event.path, error: err });
          }
        }
      }
      if (!delivered) this.onUnhandled?.(entry);
    }
  }
  failPending() {
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      this.pending.delete(id);
      p.reject(new ConnectionLost(p.verb, p.path));
    }
  }
  scheduleReconnect() {
    if (this.closed || !this.reconnectEnabled || !this.everConnected || this.reconnectTimer) return;
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.reconnectMaxMs);
    this.log("info", `reconnecting to ${this.url} in ${delay} ms`, { url: this.url, delayMs: delay });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = void 0;
      if (this.closed) return;
      this.open().catch(() => {
      });
    }, delay);
    unref(this.reconnectTimer);
  }
  startHeartbeat() {
    if (!this.heartbeatEnabled) return;
    this.get("/status/timeout_ms", { flatvalue: true }).then((data) => {
      const timeoutMs = Number(propertyValue(data));
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || this.closed || !this.connected) return;
      const interval = Math.max(1e3, Math.floor(timeoutMs / 2));
      this.stopHeartbeat();
      this.heartbeatTimer = setInterval(() => {
        if (!this.connected) return;
        this.fireAndForget("get", "/ping", {});
      }, interval);
      unref(this.heartbeatTimer);
    }).catch(() => {
    });
  }
  stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = void 0;
  }
  setStatus(status, detail) {
    if (this.status === status) return;
    this.status = status;
    this.log(status === "disconnected" && this.everConnected && !this.closed ? "warn" : "debug", `${this.url} ${status}`, { url: this.url, status });
    for (const listener of this.statusListeners) {
      try {
        listener(status, detail);
      } catch (err) {
        this.log("error", "status listener threw", { status, error: err });
      }
    }
  }
};

// src/model/taper.ts
var TABLES = {
  "+18": [
    [18, 1],
    [6, 0.8153846154],
    [0, 0.7230769231],
    [-6, 0.6307692308],
    [-9, 0.5846153846],
    [-12, 0.5384615385],
    [-18, 0.4461538462],
    [-28, 0.3408906883],
    [-32, 0.2987854251],
    [-40, 0.2503005766],
    [-56, 0.1533308796],
    [-86, 0.05163596439],
    [-144, 0]
  ],
  "+12": [
    [12, 1],
    [6, 0.8909090909],
    [0, 0.7818181818],
    [-6, 0.6727272727],
    [-9, 0.6181818182],
    [-12, 0.5636363636],
    [-18, 0.4713286713],
    [-28, 0.3536816125],
    [-32, 0.306622789],
    [-40, 0.2550098857],
    [-56, 0.1517840793],
    [-86, 0.05008916404],
    [-144, 0]
  ],
  "+12Neve": [
    [12, 1],
    [6, 0.8553345389],
    [0, 0.7106690778],
    [-6, 0.5660036166],
    [-9, 0.4936708861],
    [-11.33, 0.4374924653],
    [-12, 0.4323257023],
    [-18, 0.3860561823],
    [-40, 0.2164012758],
    [-57.025, 0.08511151296],
    [-66, 0.05023154281],
    [-76.35, 0.02229632013],
    [-85.61, 0.008514507365],
    [-96, 0.002065097061],
    [-144, 0]
  ],
  API: [
    [12, 1],
    [11.1722, 0.9367],
    [9.4764, 0.8734],
    [7.4751, 0.8101],
    [4.966, 0.7468],
    [2.6192, 0.6835],
    [0.7171, 0.6203],
    [0, 0.59423],
    [-1.0243, 0.557],
    [-3.1383, 0.4937],
    [-6.3115, 0.4304],
    [-11.4058, 0.3671],
    [-15.9097, 0.3038],
    [-19.9252, 0.2405],
    [-23.3901, 0.1772],
    [-29.3541, 0.1139],
    [-53.8287, 0.0506],
    [-144, 0]
  ],
  "+6": [
    [6, 1],
    [0, 0.88],
    [-6, 0.76],
    [-9, 0.7],
    [-12, 0.64],
    [-18, 0.52],
    [-28, 0.3661538462],
    [-32, 0.3190950226],
    [-40, 0.2674821194],
    [-56, 0.1642563129],
    [-86, 0.06256139769],
    [-144, 0]
  ],
  "+0": [
    [0, 1],
    [-6, 0.8666666667],
    [-9, 0.8],
    [-12, 0.7333333333],
    [-18, 0.6],
    [-28, 0.3777777778],
    [-32, 0.3277777778],
    [-40, 0.2550505051],
    [-56, 0.1750505051],
    [-86, 0.08130050505],
    [-144, 0]
  ],
  preamp: [
    [0, 0],
    [60, 1]
  ],
  volt_monitor_gain: [
    [0, 0],
    [100, 1]
  ]
};
var MARKS = {
  "+18": [
    [18, 12, 6, 0, -6, -12, -20, -32, -56, -144],
    [18, 0, -12, -32, -144]
  ],
  "+12": [
    [12, 6, 0, -6, -12, -20, -32, -56, -144],
    [12, 0, -12, -32, -144]
  ],
  "+12Neve": [
    [10, 5, 0, -5, -10, -20, -30, -40, -144],
    [10, 0, -10, -30, -144]
  ],
  API: [
    [10, 5, 0, -5, -10, -15, -20, -25, -35, -50, -144],
    [10, 0, -10, -30, -144]
  ],
  "+6": [
    [6, 0, -6, -12, -20, -32, -56, -144],
    [6, 0, -12, -32, -144]
  ],
  "+0": [
    [0, -6, -12, -18, -32, -56, -144],
    [0, -12, -32, -144]
  ],
  preamp: [
    [60, 50, 40, 30, 20, 10, 0],
    [60, 30, 0]
  ],
  volt_monitor_gain: [
    [100, 75, 50, 25, 0],
    [100, 50, 0]
  ]
};
var TAPERED_CONTROLS = /* @__PURE__ */ new Set(["gain", "gain_trim", "input_trim_left", "input_trim_right", "input_trim_mono", "sidechain_input_trim"]);
function interpolate(points, x) {
  const first = points[0];
  const last = points[points.length - 1];
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];
  let hi = 1;
  while (points[hi][0] < x) hi++;
  const [x0, y0] = points[hi - 1];
  const [x1, y1] = points[hi];
  return x1 === x0 ? y1 : y0 + (x - x0) / (x1 - x0) * (y1 - y0);
}
var Taper = class _Taper {
  constructor(name) {
    this.name = name;
    this.points = TABLES[name];
    this.byDb = [...this.points].sort((a, b) => a[0] - b[0]);
    this.byNormalized = this.points.map(([db, n]) => [n, db]).sort((a, b) => a[0] - b[0]);
    this.minDb = this.byDb[0][0];
    this.maxDb = this.byDb[this.byDb.length - 1][0];
  }
  name;
  static cache = /* @__PURE__ */ new Map();
  /** The default taper: what LUNA uses for a gain control whose `taper` is empty or unknown. */
  static DEFAULT_NAME = "+12";
  /** Every taper name LUNA defines, `none` aside. */
  static NAMES = Object.keys(TABLES);
  /** Lowest dB on the taper; for the dB tapers −144, which LUNA shows as −∞. */
  minDb;
  /** Highest dB on the taper: the top of the fader. */
  maxDb;
  /** LUNA's breakpoints as `[dB, normalized]`, highest dB first, as LUNA lists them. */
  points;
  byDb;
  byNormalized;
  /**
   * The taper LUNA uses for a `taper` property value. Empty, `null` and unknown names give
   * `+12`, as in LUNA; `none` gives `null`. The same name always gives the same object.
   *
   * @example
   * Luna.Taper.named('API')!.toNormalized(0);  // 0.59423
   * Luna.Taper.named('')!.name;                // '+12'
   * Luna.Taper.named('none');                  // null
   */
  static named(name) {
    if (name === "none") return null;
    const key = name && name in TABLES ? name : _Taper.DEFAULT_NAME;
    let taper = _Taper.cache.get(key);
    if (!taper) _Taper.cache.set(key, taper = new _Taper(key));
    return taper;
  }
  /**
   * The taper a control uses, from its `control_type` and `taper` properties: `null` for a
   * control LUNA gives no fader taper (pan, mute, a plugin parameter), `undefined` while the
   * control type has not arrived.
   *
   * @example
   * Luna.Taper.forControl('gain', null)?.name;   // '+12'
   * Luna.Taper.forControl('pan', null);          // null
   */
  static forControl(controlType, taper) {
    if (controlType === void 0) return void 0;
    return TAPERED_CONTROLS.has(controlType) ? _Taper.named(taper) : null;
  }
  /**
   * The 0..1 fader position for a dB value, clamped to the taper's range.
   *
   * @example
   * Luna.Taper.named('+12')!.toNormalized(-6);   // 0.6727
   */
  toNormalized(db) {
    return interpolate(this.byDb, db);
  }
  /**
   * The dB value at a 0..1 fader position, clamped to the taper's range.
   *
   * @example
   * Luna.Taper.named('+12')!.toDb(1);   // 12
   */
  toDb(normalized) {
    return interpolate(this.byNormalized, normalized);
  }
  /**
   * The dB values to draw fader hash marks at, top first. The last is {@link minDb}, which
   * LUNA labels ∞. Place each with {@link toNormalized}.
   *
   * @example
   * taper.marks();                    // [12, 6, 0, -6, -12, -20, -32, -56, -144] for +12
   * taper.marks({ compact: true });   // [12, 0, -12, -32, -144]
   */
  marks(options = {}) {
    return [...MARKS[this.name][options.compact ? 1 : 0]];
  }
};

// src/wire/mock-port.ts
var LUNA_DEVICE_UID = "d37e009d693549a0b6ab1da3fad05443";
var EMPTY_MIDI_TABLE = () => ({ operation: "update", row_ids: [], enabled: [], midi_data: [], tick: [], sysex: [] });
function encodeMidiTable(operation, rows) {
  return {
    operation,
    row_ids: rows.map((r) => r.rowid),
    enabled: rows.map((r) => r.enabled),
    midi_data: rows.map((r) => (r.status & 255) << 16 | (r.data1 & 127) << 8 | r.data2 & 127),
    tick: rows.map((r) => r.tick),
    // LUNA's sysex column (fact 139): the message's bytes, null on every other row.
    sysex: rows.map((r) => r.sysex)
  };
}
function decodeMidiTable(value) {
  const table = value;
  return (table?.row_ids ?? []).map((rowid, i) => {
    const packed = table?.midi_data?.[i] ?? 0;
    return { rowid, tick: table?.tick?.[i] ?? 0, status: packed >>> 16 & 255, data1: packed >>> 8 & 127, data2: packed & 127, enabled: table?.enabled?.[i] !== false, sysex: table?.sysex?.[i] ?? null };
  });
}
var normalizeChordName = (name) => name.replace(/\u266D/g, "b").replace(/\u266F/g, "#");
function groupByClip(rows) {
  const out = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const uid = row.clip_uid;
    if (!uid) continue;
    out.set(uid, [...out.get(uid) ?? [], row]);
  }
  return out;
}
function normalize(path) {
  const q = path.indexOf("?");
  const clean = q >= 0 ? path.slice(0, q) : path;
  const parts = clean.split("/").filter((p) => p.length > 0);
  return "/" + parts.join("/");
}
function parentOf(path) {
  return splitPath(path).node;
}
function wireFloat(value) {
  if (value instanceof FloatLiteral) return value.value;
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Number.isInteger(value) ? 0 : value;
}
function faderTaper(p) {
  return Taper.forControl(String(p.get("control_type") ?? ""), p.get("taper")) ?? Taper.named(Taper.DEFAULT_NAME);
}
var FADER_ZERO = Taper.named(Taper.DEFAULT_NAME).toNormalized(0);
function formatPan(real) {
  const n = Math.round(Math.abs(real));
  return n === 0 ? "C" : real < 0 ? `L${n}` : `R${n}`;
}
function parsePan(text) {
  const m = /^([LR])(\d+(?:\.\d+)?)$/.exec(text);
  if (m) return (m[1] === "L" ? -1 : 1) * Number(m[2]);
  return text === "C" ? 0 : Number(text) || 0;
}
var CONTROL_VIEWS = /* @__PURE__ */ new Set(["value", "real_value", "normalized_value", "string_value"]);
var MockEngine = class _MockEngine {
  nodes = /* @__PURE__ */ new Map();
  ports = /* @__PURE__ */ new Set();
  faults = /* @__PURE__ */ new Map();
  pendingDeliveries = 0;
  settleWaiters = [];
  /** Every request any port made, oldest first. Useful for asserting what a model did. */
  requests = [];
  /** `set_touch` calls, as `<control path>:on|off`, oldest first. */
  touches = [];
  /** Transaction commands seen: `begin`, `commit`, `abort`. */
  transactions = [];
  /** Live MIDI LUNA delivered through `/sessions/send_midi` and `send_midi_all_notes_off`, oldest first. */
  midiSent = [];
  compiledClipFades;
  /** Per playlist path: published compiled-clip node names by start tick, and the next name. */
  compiled = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.compiledClipFades = options.compiledClipFades ?? true;
    this.nodes.set("/", { properties: /* @__PURE__ */ new Map(), readOnly: /* @__PURE__ */ new Set(), commands: /* @__PURE__ */ new Map(), children: [] });
    this.addNode("/status", { properties: { timeout_ms: 0, version: "mock", name: "LUNA" } });
    this.addNode("/sessions", {
      properties: { focused_session: "" },
      commands: {
        new_session: (data, engine) => {
          const body = data ?? {};
          const uid = `s${engine.children("/sessions").length + 1}`;
          engine.addSession(uid, { name: body.name ?? "Untitled", focused: false });
          engine.setValue(`/sessions/${uid}`, "loaded", false);
          return { session_uid: uid };
        },
        open_session: (data, engine) => {
          const body = data ?? {};
          const uid = `s${engine.children("/sessions").length + 1}`;
          engine.addSession(uid, { name: body.session_package_uid ?? "Opened", focused: false, ...body.session_package_uid ? { packageUid: body.session_package_uid } : {} });
          engine.setValue(`/sessions/${uid}`, "loaded", false);
          return { session_uid: uid };
        },
        load_session: (data, engine) => {
          const body = data ?? {};
          if (!body.session_uid || !engine.has(`/sessions/${body.session_uid}`)) {
            throw new UAError("uasrv.invalid_object", "load_session: unknown session", { cmd: "post", path: "/sessions/load_session" });
          }
          setTimeout(() => {
            if (engine.has(`/sessions/${body.session_uid}`)) {
              engine.setValue(`/sessions/${body.session_uid}`, "loaded", true);
              engine.setValue("/sessions", "focused_session", body.session_uid);
            }
          }, 5);
          return null;
        },
        close_session: (data, engine) => {
          const body = data ?? {};
          if (body.session_uid) engine.removeNode(`/sessions/${body.session_uid}`);
          return null;
        },
        // Facts 108 and 109, after deviced's Edit_SendMidi.
        send_midi: (data, engine) => {
          const body = data ?? {};
          const invalid = () => new UAError("uasrv.invalid_property", "post /sessions/send_midi: uasrv.invalid_property", { cmd: "post", path: "/sessions/send_midi" });
          if (body.sysex !== void 0) {
            const s = body.sysex;
            const ok = Array.isArray(s) && s.length >= 2 && s.length <= 65536 && s[0] === 240 && s[s.length - 1] === 247 && s.slice(1, -1).every((b) => Number.isInteger(b) && b >= 0 && b < 128);
            if (!ok || !body.midi_input_source || body.byte_0 !== void 0 || body.track_uid !== void 0 || body.tracks !== void 0) throw invalid();
            const sent = { bytes: [240, 0, 0], sysex: [...s], recordEnabled: false };
            engine.midiSent.push(engine.isMidiOutputPortUid(body.midi_input_source) ? { outputPortUid: body.midi_input_source, ...sent } : { midiInputSource: body.midi_input_source, ...sent });
            return null;
          }
          const { byte_0, byte_1, byte_2 } = body;
          if (typeof byte_0 !== "number" || typeof byte_1 !== "number" || typeof byte_2 !== "number") throw invalid();
          const bytes = [byte_0, byte_1, byte_2];
          const live = (uid) => !!uid && engine.has(`/sessions/${uid}`);
          if (body.session_uid !== void 0 && body.track_uid !== void 0) {
            if (!live(body.session_uid) || !body.track_uid) throw invalid();
            engine.midiSent.push({ sessionUid: body.session_uid, trackUid: body.track_uid, bytes, recordEnabled: body.record_enabled === true });
            return null;
          }
          if (body.session_uid !== void 0 && Array.isArray(body.tracks)) {
            if (live(body.session_uid)) {
              for (const t of body.tracks) {
                if (t.track_uid && typeof t.record_enabled === "boolean") engine.midiSent.push({ sessionUid: body.session_uid, trackUid: t.track_uid, bytes, recordEnabled: t.record_enabled });
              }
            }
            throw invalid();
          }
          if (body.midi_input_source !== void 0) {
            if (engine.isMidiOutputPortUid(body.midi_input_source)) engine.midiSent.push({ outputPortUid: body.midi_input_source, bytes, recordEnabled: false });
            else engine.midiSent.push({ midiInputSource: body.midi_input_source, bytes, recordEnabled: false });
            return null;
          }
          throw invalid();
        },
        send_midi_all_notes_off: (_data, engine) => {
          engine.midiSent.push({ allNotesOff: true, bytes: [176, 123, 0], recordEnabled: false });
          return null;
        }
      }
    });
    this.addNode("/ping", {});
    this.addNode("/workspace/sessions");
    this.addNode("/workspace", {
      properties: { type: "folder" },
      commands: {
        query: (data, engine) => {
          const body = data ?? {};
          let rows = engine.children("/workspace/sessions").map((uid) => ({
            uid,
            name: String(engine.value(`/workspace/sessions/${uid}`, "file_name") ?? uid),
            path: `${String(engine.value(`/workspace/sessions/${uid}`, "directory_path") ?? "")}/${String(engine.value(`/workspace/sessions/${uid}`, "file_name") ?? "")}`,
            file_online: true,
            session_type: 0,
            factory: false,
            favorite: Boolean(engine.value(`/workspace/sessions/${uid}`, "favorite")),
            created: Number(engine.value(`/workspace/sessions/${uid}`, "created") ?? 0),
            modified: 0,
            last_opened: Number(engine.value(`/workspace/sessions/${uid}`, "last_opened") ?? 0),
            tags: []
          }));
          if (body.search) rows = rows.filter((r) => r.name.toLowerCase().includes(body.search.toLowerCase()));
          if (body.order_by) {
            const key = body.order_by;
            rows.sort((a, b) => a[key] - b[key]);
            if (body.order_as === "desc") rows.reverse();
          }
          if (body.limit !== void 0) rows = rows.slice(0, body.limit);
          const results = { num_rows: rows.length };
          for (const k of Object.keys(rows[0] ?? { uid: 0 })) results[k] = rows.map((r) => r[k]);
          return { results };
        },
        full_text_search: () => ({ results: { num_rows: 0 } }),
        /**
         * The chunked import protocol (fact 42): `begin` answers a uid, each `transfer`
         * appends base64 bytes, `end` files the finished source under the package's audio
         * folder, and `cancel` throws the partial away. Bytes identical to an uploaded source
         * already in the package are not filed again: `end` answers that source's uid.
         */
        import_file: (data, engine) => {
          const body = data ?? {};
          const pkg = body.session_package_uid ?? "";
          switch (body.phase) {
            case "begin": {
              const uid = `src${engine.imports.size + engine.children(`/workspace/sessions/${pkg}/audio`).length + 1}`;
              engine.imports.set(uid, { pkg, name: body.name ?? uid, bytes: 0, content: "" });
              return { uid };
            }
            case "transfer": {
              const pending = engine.imports.get(body.uid ?? "");
              if (!pending) throw new UAError("uasrv.invalid_object", "import_file: no import in progress for that uid", { cmd: "post", path: "/workspace/import_file" });
              const encoded = body.file_data ?? "";
              const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
              pending.bytes += Math.max(0, encoded.length / 4 * 3 - padding);
              pending.content += encoded;
              return null;
            }
            case "end": {
              const uid = body.uid ?? "";
              const pending = engine.imports.get(uid);
              if (!pending) throw new UAError("uasrv.invalid_object", "import_file: no import in progress for that uid", { cmd: "post", path: "/workspace/import_file" });
              engine.imports.delete(uid);
              const same = engine.uploaded.get(`${pending.pkg}:${pending.content}`);
              if (same && engine.has(`/workspace/sessions/${pending.pkg}/audio/${same}`)) return { uid: same };
              engine.uploaded.set(`${pending.pkg}:${pending.content}`, uid);
              engine.addNode(`/workspace/sessions/${pending.pkg}/audio/${uid}`, {
                properties: { uid, name: body.name ?? pending.name, stem_format: "stereo", length: 0, sample_rate: 48e3, created: 0, size: pending.bytes }
              });
              return { uid };
            }
            case "cancel":
              engine.imports.delete(body.uid ?? "");
              return null;
            case "local_copy":
            default: {
              const uid = `src${engine.children(`/workspace/sessions/${pkg}/audio`).length + 1}`;
              engine.addNode(`/workspace/sessions/${pkg}/audio/${uid}`, {
                properties: { uid, name: body.name ?? uid, stem_format: "stereo", length: 0, sample_rate: 48e3, created: 0, size: 0 }
              });
              return { uid };
            }
          }
        }
      }
    });
    this.addNode("/plugins", { properties: { type: "folder" }, commands: { rescan: () => null, query: (data, engine) => engine.queryPlugins(data) } });
    this.addNode("/presets", {
      properties: { type: "folder" },
      commands: {
        query: (data, engine) => engine.queryPresets(data),
        // Fact 121: deviced forwards to UA Assistant's hybrid search; with the assistant not
        // connected it answers `ua.unknown`, and the assistant refuses empty text.
        preset_recommendations: (data, engine) => {
          const body = data ?? {};
          const where = { cmd: "post", path: "/presets/preset_recommendations" };
          if (!body.plugin_id || body.query === void 0 || engine.value("/assistant", "enabled") !== true) throw new UAError("ua.unknown", "post /presets/preset_recommendations: ua.unknown", where);
          if (body.query.trim() === "") throw new UAError("assistant.input_classifier_rejected", "post /presets/preset_recommendations: assistant.input_classifier_rejected", where);
          return { results: engine.recommendPresets(body.plugin_id, body.query) };
        }
      }
    });
    this.addNode("/presets/devices/track", { properties: { device_type_id: "track" }, commands: { load: (data, engine) => engine.loadTrackPreset(data) } });
    this.addNode("/presets/devices/track/presets", { properties: { type: "presets" } });
    this.addNode("/presets/devices/track/categories", { properties: { type: "categories" } });
    this.addNode("/assistant", { properties: { enabled: false }, readOnly: ["enabled"] });
    this.addNode("/drivers", { properties: { connected: [{ id: "mock", name: "Mock Device", type: "built_in", num_inputs: 2, num_outputs: 2 }], unsupported: [], sample_rates: [44100, 48e3] } });
    this.addNode("/preferences", { properties: { io_buffer_size: 256, play_from_stop_location: false, record_mute: false, metronome_sound: "click", metronome_sounds: ["click", "beep"] } });
    this.addNode("/renders", {
      properties: { type: "folder" },
      commands: {
        new: (data, engine) => {
          const body = data ?? {};
          const uid = body.uid ?? `r${engine.children("/renders").length + 1}`;
          engine.addNode(`/renders/${uid}`, {
            properties: {
              uid,
              name: body.name ?? "Bounce",
              type: body.type ?? "bounce",
              session_uid: body.session_uid ?? "",
              state: "created",
              percent_complete: 0,
              error_message: null,
              render_is_offline: body.real_time !== true,
              time_remaining: body.real_time === true ? 0 : void 0,
              total_samples: 0
            }
          });
          return { uid };
        },
        start: (data, engine) => {
          const body = data ?? {};
          const path = `/renders/${body.uid}`;
          if (!engine.has(path)) throw new UAError("uasrv.invalid_object", "start: no such render", { cmd: "post", path: "/renders/start" });
          engine.setValue(path, "state", "running");
          return null;
        },
        abort: (data, engine) => {
          const body = data ?? {};
          const path = `/renders/${body.uid}`;
          if (engine.has(path)) engine.setValue(path, "state", "aborted");
          return null;
        },
        delete: (data, engine) => {
          const body = data ?? {};
          const path = `/renders/${body.uid}`;
          if (engine.has(path)) engine.removeNode(path);
          return null;
        }
      }
    });
    this.addNode("/jobs");
    this.addNode("/devices");
    this.addNode("/gui", {
      properties: { prior_launch_count: 1 },
      commands: {
        set_page: (data, engine) => {
          const body = data ?? {};
          engine.setValue(`/gui/windows/${body.context_type ?? "main"}`, "page", body.page ?? "timeline");
          return null;
        },
        open_url: () => null,
        reveal_path: () => null,
        open_settings: () => null,
        open_plugin_manager: () => null,
        show_feedback: () => null,
        show_session_in_finder: () => null,
        show_add_on: () => null,
        // Fact 128: install_add_on's checks and codes as LUNA's. It records the request
        // instead of downloading and installing anything.
        install_add_on: (data, engine) => {
          const fail = (code, why) => new UAError(code, `install_add_on: ${why}`, { cmd: "post", path: "/gui/install_add_on" });
          const body = typeof data === "object" && data !== null ? data : {};
          const hasId = typeof body.id === "string";
          const hasUrl = typeof body.url === "string";
          if (hasId === hasUrl) throw hasId ? fail("uasrv.invalid_value", "give id or url, not both") : fail("uasrv.missing_field", "id or url is required");
          if (hasUrl) {
            const target = githubRepoUrl(body.url) ?? driveDownloadUrl(body.url) ?? iCloudShareUrl(body.url) ?? dropboxDownloadUrl(body.url);
            if (!target) throw fail("uasrv.invalid_value", "url is not a GitHub repo, or a Google Drive, iCloud Drive or Dropbox share");
            engine.addOnInstalls.push({ url: target });
            return null;
          }
          const id = body.id.toLowerCase();
          const pkg = engine.showcase[id] !== void 0 ? id : Object.keys(engine.showcase).find((p) => engine.showcase[p]?.includes(id));
          if (pkg === void 0) throw fail("uasrv.invalid_value", `no showcase package or Add On ${id}`);
          if (engine.installingPackages.includes(pkg)) throw fail("uasrv.too_many_requests", `${pkg} is already installing`);
          engine.addOnInstalls.push({ id: pkg });
          return null;
        },
        // Fact 128: remove_add_on's checks and codes as LUNA's.
        remove_add_on: (data, engine) => {
          const fail = (code, why) => new UAError(code, `remove_add_on: ${why}`, { cmd: "post", path: "/gui/remove_add_on" });
          const body = typeof data === "object" && data !== null ? data : {};
          if (typeof body.id !== "string") throw fail("uasrv.missing_field", "id is required");
          const id = body.id.toLowerCase();
          const pkg = engine.showcase[id] !== void 0 ? id : Object.keys(engine.showcase).find((p) => engine.showcase[p]?.includes(id));
          if (pkg === void 0) throw fail("uasrv.invalid_value", `no showcase package or Add On ${id}`);
          if (!engine.importedPackages.includes(pkg)) throw fail("uasrv.not_permitted", `${pkg} is the showcase's own`);
          engine.importedPackages = engine.importedPackages.filter((p) => p !== pkg);
          delete engine.showcase[pkg];
          return null;
        },
        // Fact 130: uninstall_add_on's checks and codes as LUNA's. LUNA's prompt is answered
        // with uninstallAnswer; on 'remove' the Add On leaves /gui/add_ons.
        uninstall_add_on: (data, engine) => {
          const fail = (code, why) => new UAError(code, `uninstall_add_on: ${why}`, { cmd: "post", path: "/gui/uninstall_add_on" });
          const body = typeof data === "object" && data !== null ? data : {};
          if (typeof body.id !== "string") throw fail("uasrv.missing_field", "id is required");
          const id = body.id.toLowerCase();
          if (!engine.has(`/gui/add_ons/${id}`)) throw fail("uasrv.invalid_value", `no Add On ${id}`);
          if (engine.builtInAddOns.includes(id)) throw fail("uasrv.not_permitted", `${id} is built into LUNA`);
          engine.addOnUninstalls.push(id);
          if (engine.uninstallAnswer === "remove") engine.removeNode(`/gui/add_ons/${id}`);
          return null;
        },
        // Fact 126: what LUNA's show_plugin / hide_plugin check and do. LUNA opens a window
        // only for a slot with a plugin, and lists it in /gui/plugin_windows by uid.
        show_plugin: (data, engine) => {
          const { slot, key } = engine.pluginWindowTarget(data, "show_plugin");
          const open = engine.pluginWindowsOpen();
          if (engine.value(slot, "plugin_id") && !open.some((w) => sameWindow(w, key))) engine.setValue("/gui/plugin_windows", "open", [...open, key]);
          return null;
        },
        hide_plugin: (data, engine) => {
          const { key } = engine.pluginWindowTarget(data, "hide_plugin");
          const open = engine.pluginWindowsOpen();
          if (open.some((w) => sameWindow(w, key))) engine.setValue("/gui/plugin_windows", "open", open.filter((w) => !sameWindow(w, key)));
          return null;
        },
        execute: () => null,
        add_task: () => null,
        update_task: () => null,
        remove_task: () => null,
        release_file_chooser: () => null,
        release_save_dialog: () => null,
        show_open_dialog: (_data, engine) => {
          const uid = `fc${engine.nextRow()}`;
          engine.addNode(`/gui/file_chooser/${uid}`, { properties: { status: "pending", files: [] } });
          setTimeout(() => {
            if (!engine.has(`/gui/file_chooser/${uid}`)) return;
            engine.setValue(`/gui/file_chooser/${uid}`, "files", engine.nextDialogFiles.map((p) => ({ path: p })));
            engine.setValue(`/gui/file_chooser/${uid}`, "status", engine.nextDialogFiles.length ? "selected" : "cancelled");
          }, 5);
          return { uid };
        },
        show_folder_dialog: (_data, engine) => {
          const uid = `fc${engine.nextRow()}`;
          engine.addNode(`/gui/file_chooser/${uid}`, { properties: { status: "pending", files: [] } });
          setTimeout(() => {
            if (!engine.has(`/gui/file_chooser/${uid}`)) return;
            const ask = engine.nextDialogFiles.map(normalizeFolder).filter((p) => engine.folders[p] !== void 0 && engine.blessedRootOf(p) === void 0);
            if (ask.length) {
              engine.blessRequests.push(...ask);
              if (engine.blessAnswer === "allow") for (const p of ask) engine.grantFolder(p);
            }
            engine.setValue(`/gui/file_chooser/${uid}`, "files", engine.nextDialogFiles.map((p) => ({ path: p })));
            engine.setValue(`/gui/file_chooser/${uid}`, "status", engine.nextDialogFiles.length ? "selected" : "cancelled");
          }, 5);
          return { uid };
        },
        // Fact 106: validation, hidden entries and order (naturalCompare) as LUNA's list_files.
        // Fact 133: recursive lists each folder followed by its contents, with relative_path,
        // and stops at listLimit entries with truncated.
        list_files: (data, engine) => {
          const fail = (code, why) => new UAError(code, `list_files: ${why}`, { cmd: "post", path: "/gui/list_files" });
          const body = typeof data === "object" && data !== null ? data : {};
          const path = body.path;
          if (path === void 0 || path === null) throw fail("uasrv.missing_field", "path is required");
          if (typeof path !== "string" || !/^(\/|[A-Za-z]:[\\/])/.test(path)) throw fail("uasrv.invalid_value", "path must be absolute");
          if (body.recursive !== void 0 && body.recursive !== null && typeof body.recursive !== "boolean") throw fail("uasrv.invalid_value", "recursive must be a bool");
          const recursive = body.recursive === true;
          const dir = normalizeFolder(path);
          if (engine.blessedRootOf(dir) === void 0) {
            throw fail("uasrv.not_permitted", "path is not in a folder the user granted");
          }
          if (!engine.folders[dir]) {
            const cut = dir.lastIndexOf("/");
            const isFile = engine.folders[cut > 0 ? dir.slice(0, cut) : "/"]?.includes(dir.slice(cut + 1));
            throw fail(isFile ? "uasrv.invalid_value" : "uasrv.filesystem_error", isFile ? "path is a file" : "no folder at path");
          }
          const files = [];
          let truncated = false;
          const walk = (folder, relative) => {
            const entries = (engine.folders[folder] ?? []).map((raw) => ({ name: raw.replace(/\/$/, ""), is_directory: raw.endsWith("/") })).filter((e) => !e.name.startsWith(".")).sort((a, b) => naturalCompare(a.name, b.name) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
            for (const e of entries) {
              if (recursive && files.length === engine.listLimit) {
                truncated = true;
                return;
              }
              const entryPath = `${folder === "/" ? "" : folder}/${e.name}`;
              const rel = relative ? `${relative}/${e.name}` : e.name;
              files.push(recursive ? { name: e.name, path: entryPath, is_directory: e.is_directory, relative_path: rel } : { name: e.name, path: entryPath, is_directory: e.is_directory });
              if (recursive && e.is_directory) {
                walk(entryPath, rel);
                if (truncated) return;
              }
            }
          };
          walk(dir, "");
          return recursive ? { files, truncated } : { files };
        },
        // Fact 133: add_blessed_folder's checks and codes as LUNA's. LUNA's prompt is answered
        // with blessAnswer; it answers before asking, so a page reads the outcome from
        // /gui/add_ons blessed_folders.
        add_blessed_folder: (data, engine) => {
          const fail = (code, why) => new UAError(code, `add_blessed_folder: ${why}`, { cmd: "post", path: "/gui/add_blessed_folder" });
          const path = typeof data === "object" && data !== null ? data.path : void 0;
          if (path === void 0 || path === null) throw fail("uasrv.missing_field", "path is required");
          if (typeof path !== "string" || !/^(\/|[A-Za-z]:[\\/])/.test(path)) throw fail("uasrv.invalid_value", "path must be absolute");
          const dir = normalizeFolder(path);
          if (!engine.folders[dir]) {
            const cut = dir.lastIndexOf("/");
            const isFile = engine.folders[cut > 0 ? dir.slice(0, cut) : "/"]?.includes(dir.slice(cut + 1));
            throw fail(isFile ? "uasrv.invalid_value" : "uasrv.filesystem_error", isFile ? "path is a file" : "no folder at path");
          }
          if (engine.blessedRootOf(dir) !== void 0) return null;
          engine.blessRequests.push(dir);
          if (engine.blessAnswer === "allow") engine.grantFolder(dir);
          return null;
        },
        // Fact 133: remove_blessed_folder takes a listed folder out, without asking.
        remove_blessed_folder: (data, engine) => {
          const fail = (code, why) => new UAError(code, `remove_blessed_folder: ${why}`, { cmd: "post", path: "/gui/remove_blessed_folder" });
          const path = typeof data === "object" && data !== null ? data.path : void 0;
          if (path === void 0 || path === null) throw fail("uasrv.missing_field", "path is required");
          if (typeof path !== "string") throw fail("uasrv.invalid_value", "path must be a string");
          const dir = normalizeFolder(path);
          if (!engine.grantedFolders.includes(dir)) throw fail("uasrv.invalid_value", "path is not a blessed folder");
          engine.grantedFolders = engine.grantedFolders.filter((f) => f !== dir);
          return null;
        },
        // Fact 114: serve_media_file's checks, codes and URL as LUNA's (macOS form).
        serve_media_file: (data, engine) => {
          const fail = (code, why) => new UAError(code, `serve_media_file: ${why}`, { cmd: "post", path: "/gui/serve_media_file" });
          const body = typeof data === "object" && data !== null ? data : {};
          if (body.add_on_id === void 0 || body.add_on_id === null || body.path === void 0 || body.path === null) throw fail("uasrv.missing_field", "add_on_id and path are required");
          if (typeof body.add_on_id !== "string" || typeof body.path !== "string") throw fail("uasrv.invalid_type", "add_on_id and path must be strings");
          const path = body.path;
          if (!/^(\/|[A-Za-z]:[\\/])/.test(path)) throw fail("uasrv.invalid_value", "path must be absolute");
          if (engine.isBlessedFile(path)) {
            const id2 = body.add_on_id.toLowerCase();
            if (!engine.has(`/gui/add_ons/${id2}`)) throw fail("uasrv.not_installed", `no Add On ${id2}`);
            const linked = engine.mediaFiles[path];
            const target2 = typeof linked === "string" ? linked : normalizeFolder(path);
            engine.mediaServed.push({ addOnId: id2, path: target2 });
            return { url: `ua-content://${localContentHost(id2)}${encodeMediaPath(target2)}` };
          }
          const file = engine.mediaFiles[path];
          if (file === void 0) throw fail("uasrv.filesystem_error", "no file at path");
          if (file === null) throw fail("uasrv.invalid_value", "not an audio, video or MIDI file");
          const id = body.add_on_id.toLowerCase();
          if (!engine.has(`/gui/add_ons/${id}`)) throw fail("uasrv.not_installed", `no Add On ${id}`);
          const target = file === true ? path : file;
          engine.mediaServed.push({ addOnId: id, path: target });
          return { url: `ua-content://${localContentHost(id)}${encodeMediaPath(target)}` };
        },
        show_save_dialog: (_data, engine) => {
          const uid = `fc${engine.nextRow()}`;
          engine.addNode(`/gui/file_chooser/${uid}`, { properties: { status: "pending", files: [] } });
          setTimeout(() => {
            if (!engine.has(`/gui/file_chooser/${uid}`)) return;
            engine.setValue(`/gui/file_chooser/${uid}`, "files", engine.nextDialogFiles.map((p) => ({ path: p })));
            engine.setValue(`/gui/file_chooser/${uid}`, "status", engine.nextDialogFiles.length ? "selected" : "cancelled");
          }, 5);
          return { uid };
        }
      }
    });
    this.addNode("/gui/windows/main", { properties: { page: "timeline" } });
    this.addNode("/gui/transport", { properties: { arm_mode: false } });
    this.addNode("/gui/add_ons", { properties: { blessed_folders: [] }, readOnly: ["blessed_folders"] });
    this.addNode("/gui/add_ons/com.example.demo", { properties: { id: "com.example.demo", name: "Demo", targets: ["window"], icon: "", floating: true, show_with_session: false, fixed_size: false, run_hidden: false, unload_on_close: false, manufacturer: "Example Co", description: "A demo Add On.", categories: ["Utility"], network: [], network_allowed: [], version: "1.0.0", installed_from: "folder", min_width: null, min_height: null, max_width: null, max_height: null, requires_plugins: [] } });
    this.addNode("/gui/add_ons/com.example.demo/instances");
    this.addNode("/gui/file_chooser");
    this.addNode("/gui/plugin_windows", { properties: { open: [] }, readOnly: ["open"] });
    if (options.gui === false) this.removeNode("/gui");
  }
  /**
   * Open a page of an installed Add On, as LUNA does when it shows one (fact 143): a node at
   * `/gui/add_ons/<id>/instances/<add_on_inst>` with its `target` and size. The target is
   * `options.target`, one of the Add On's `targets` (the host the user swapped it to), or else
   * the first, its default. Width and height are writable for a `'window'` and clamped to the
   * Add On's `min_*`/`max_*`. Returns the id.
   *
   * @example
   * const inst = engine.openAddOnInstance('com.example.demo', { width: 400, height: 300 });
   */
  openAddOnInstance(addOnId, options = {}) {
    const addOn = `/gui/add_ons/${addOnId.toLowerCase()}`;
    if (!this.has(addOn)) throw new Error(`openAddOnInstance: no Add On ${addOnId}`);
    const targets = this.value(addOn, "targets") ?? ["window"];
    if (options.target !== void 0 && !targets.includes(options.target)) {
      throw new Error(`openAddOnInstance: ${addOnId} does not list target ${options.target}`);
    }
    if (!this.has(`${addOn}/instances`)) this.addNode(`${addOn}/instances`);
    const id = options.instanceId ?? `inst-${this.nextRow()}`;
    const target = options.target ?? targets[0] ?? "window";
    this.addNode(`${addOn}/instances/${id}`, {
      properties: { target, width: options.width ?? 0, height: options.height ?? 0 },
      readOnly: target === "window" && this.value(addOn, "fixed_size") !== true ? ["target"] : ["target", "width", "height"]
    });
    return id;
  }
  /** Close a page opened with {@link openAddOnInstance}. */
  closeAddOnInstance(addOnId, instanceId) {
    this.removeNode(`/gui/add_ons/${addOnId.toLowerCase()}/instances/${instanceId}`);
  }
  resizeAddOnInstance(nodePath, name, data, path) {
    if (typeof data !== "number" || !Number.isFinite(data)) throw new UAError("uasrv.invalid_type", `set ${path}: uasrv.invalid_type`, { cmd: "set", path });
    if (data <= 0) throw new UAError("uasrv.invalid_value", `set ${path}: uasrv.invalid_value`, { cmd: "set", path });
    const addOn = nodePath.slice(0, nodePath.lastIndexOf("/instances/"));
    const limit = (field) => {
      const v = this.value(addOn, field);
      return typeof v === "number" && v > 0 ? v : void 0;
    };
    let size = Math.trunc(data);
    const max = limit(`max_${name}`);
    const min = limit(`min_${name}`);
    if (max !== void 0 && size > max) size = max;
    if (min !== void 0 && size < min) size = min;
    this.setValue(nodePath, name, size);
  }
  /** @internal The windows listed in `/gui/plugin_windows`. */
  pluginWindowsOpen() {
    const open = this.value("/gui/plugin_windows", "open");
    return Array.isArray(open) ? open : [];
  }
  /** @internal Validate a show_plugin / hide_plugin payload as LUNA does (fact 126). */
  pluginWindowTarget(data, command) {
    const fail = (code, why) => new UAError(code, `${command}: ${why}`, { cmd: "post", path: `/gui/${command}` });
    const body = typeof data === "object" && data !== null ? data : {};
    if (typeof body.channel_uid !== "string") throw fail("uasrv.missing_field", "channel_uid is required");
    if (typeof body.insert_type !== "string") throw fail("uasrv.missing_field", "insert_type is required");
    if (!/^(effect_\d+|record_fx_\d+|midi_\d+|console|tape|bus_input|instrument|sidechain_filter)$/.test(body.insert_type)) throw fail("uasrv.invalid_value", `unknown insert_type ${body.insert_type}`);
    const sessionUid = typeof body.session_uid === "string" ? body.session_uid : this.children("/sessions")[0];
    if (sessionUid === void 0 || !this.has(`/sessions/${sessionUid}`)) throw fail("uasrv.invalid_value", "no such open session");
    const base = `/sessions/${sessionUid}`;
    const channel = this.has(`${base}/tracks/${body.channel_uid}`) ? `${base}/tracks/${body.channel_uid}` : `${base}/buses/${body.channel_uid}`;
    return { slot: `${channel}/effects/${body.insert_type}`, key: { session_uid: sessionUid, channel_uid: body.channel_uid, insert_type: body.insert_type } };
  }
  /** What the next mock file dialog "selects"; empty means the user cancelled. */
  nextDialogFiles = [];
  /**
   * The files `/gui/serve_media_file` finds, by absolute path: `true` for an audio, video or
   * MIDI file it serves, `null` for one it refuses (not media, or media in name only), or the
   * path a link leads to, which is served under that path. A path not listed is missing.
   *
   * @example
   * engine.mediaFiles['/Movies/cut.mov'] = true;
   * engine.mediaFiles['/Movies/notes.mp4'] = null;
   * engine.mediaFiles['/Movies/latest.mov'] = '/Movies/cut.mov';
   */
  mediaFiles = {};
  /** Every file `/gui/serve_media_file` served, in order, by lowercase Add On id. */
  mediaServed = [];
  /**
   * The showcase `/gui/install_add_on` installs from: each package id to the ids of the
   * Add Ons in it, all lowercase.
   *
   * @example
   * engine.showcase['uaudio-labs.midi-notation'] = ['com.uaudio.midi-notation', 'com.uaudio.score-view'];
   */
  showcase = {};
  /** Package ids `/gui/install_add_on` treats as already installing. */
  installingPackages = [];
  /**
   * Package ids in {@link showcase} that were imported from a link, which
   * `/gui/remove_add_on` removes (from here and from `showcase`); any other
   * package is the showcase's own and is refused.
   */
  importedPackages = [];
  /**
   * Every install `/gui/install_add_on` started, in order: `{ id }` with the package id, or
   * `{ url }` with what LUNA fetches: a repo's URL (`https://github.com/<owner>/<repo>`), or
   * a Drive file's direct download
   * (`https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t`), or
   * an iCloud Drive share as `https://www.icloud.com/iclouddrive/<id>`, which LUNA resolves,
   * or a Dropbox file's download (`https://www.dropbox.com/scl/fi/<id>/<name>?rlkey=<key>&dl=1`).
   */
  addOnInstalls = [];
  /** Add On ids (lowercase) under `/gui/add_ons` that are built into LUNA, which `/gui/uninstall_add_on` refuses. */
  builtInAddOns = [];
  /** How the user answers LUNA's prompt for `/gui/uninstall_add_on`: `'remove'` (the default) takes the Add On out of `/gui/add_ons`, `'cancel'` leaves it. */
  uninstallAnswer = "remove";
  /** Every Add On id (lowercase) `/gui/uninstall_add_on` asked the user about, in order, whatever the answer. */
  addOnUninstalls = [];
  /**
   * The disk `/gui/list_files` reads: each folder's absolute path to the names inside it,
   * a trailing `/` marking a subfolder. A name starting with `.` is hidden, as in LUNA.
   *
   * @example
   * engine.folders['/Samples'] = ['kick.wav', 'Loops/', '.DS_Store'];
   */
  folders = {};
  /**
   * The folders `/gui/list_files` may read, it and every folder inside them (facts 106, 133):
   * the blessed folders. LUNA asks the user before blessing a folder picked in
   * `show_folder_dialog` (the mock asks {@link blessAnswer} for each of `nextDialogFiles`
   * that is in {@link folders}) or dropped on an Add On; set this, or call
   * {@link grantFolder}, to model an allowed drop or a folder blessed in an earlier run.
   * Anything else is `uasrv.not_permitted`.
   * The mock does not model links or LUNA's cap on how many folders it keeps.
   *
   * @example
   * engine.folders['/Samples'] = ['kick.wav'];
   * engine.grantFolder('/Samples');
   */
  get grantedFolders() {
    return this.blessed;
  }
  set grantedFolders(folders) {
    this.blessed = [...folders];
    if (this.has("/gui/add_ons")) this.setValue("/gui/add_ons", "blessed_folders", [...this.blessed]);
  }
  blessed = [];
  /** Let `/gui/list_files` read the folder at `path` and the folders inside it. */
  grantFolder(path) {
    const dir = normalizeFolder(path);
    if (!this.grantedFolders.includes(dir)) this.grantedFolders = [...this.grantedFolders, dir];
  }
  /** How the user answers LUNA's prompt for `/gui/add_blessed_folder` and for folders picked in `show_folder_dialog`: `'allow'` (the default) blesses them, `'dont_allow'` leaves them out. */
  blessAnswer = "allow";
  /** Every folder LUNA asked the user about (`/gui/add_blessed_folder`, `show_folder_dialog`), in order, whatever the answer. */
  blessRequests = [];
  /** Entries a recursive `/gui/list_files` returns before it sets `truncated` (LUNA: 10,000). */
  listLimit = 1e4;
  /** @internal The blessed folder `dir` (normalized) is, or is inside; `undefined` for none. */
  blessedRootOf(dir) {
    return this.grantedFolders.find((root) => dir === root || dir.startsWith(root === "/" ? "/" : `${root}/`));
  }
  /**
   * @internal Whether `path` is a file in {@link folders} (or {@link mediaFiles}) inside a
   * blessed folder with no hidden name below it, which serve_media_file serves whatever its
   * type (fact 133).
   */
  isBlessedFile(path) {
    const file = normalizeFolder(path);
    const root = this.blessedRootOf(file);
    if (root === void 0 || file === root) return false;
    const below = file.slice(root === "/" ? 1 : root.length + 1).split("/");
    if (below.some((part) => part.startsWith("."))) return false;
    const cut = file.lastIndexOf("/");
    const listed = this.folders[cut > 0 ? file.slice(0, cut) : "/"]?.includes(file.slice(cut + 1)) ?? false;
    const media = this.mediaFiles[path];
    if (typeof media === "string") return this.blessedRootOf(normalizeFolder(media)) === root;
    return listed || media !== void 0;
  }
  rowCounter = 100;
  /** @internal */
  nextRow() {
    return ++this.rowCounter;
  }
  /** @internal Find a control node by its `uid` property. */
  /**
   * Route `output` to the bus at `busPath` the way LUNA records it (fact 83): append a row to
   * `assignments` and add an `assignment_objects/<uid>` node. Returns the assignment uid.
   */
  addAssignment(output, busUid, busPath) {
    const uid = `asg${this.nextRow()}`;
    const name = String(this.value(busPath, "name") ?? busUid);
    const stem = String(this.value(busPath, "stem_format") ?? "stereo");
    const busType = this.value(busPath, "bus_type");
    const desc = { bus_uid: busUid, name, stem_format: stem, is_bus: "true", sidechain_in_use: "false" };
    this.addNode(`${output}/assignment_objects/${uid}`, {
      properties: { type: "assignment", rowid: this.nextRow(), uid, bus_uid: busUid, output_node_uid: busUid, connection_error: "", output_desc: desc },
      readOnly: ["type", "rowid", "uid", "bus_uid", "output_node_uid", "connection_error", "output_desc"]
    });
    const rows = this.value(output, "assignments") ?? [];
    this.setValue(output, "assignments", [...rows, { connection_error: null, name, stem_format: stem, type: typeof busType === "string" ? busType : null, value: busUid, sidechain_in_use: "false" }]);
    return uid;
  }
  /** @internal Remove one destination: its `assignments` row and its object, which share an index. */
  removeAssignment(output, uid) {
    const index = this.children(`${output}/assignment_objects`).indexOf(uid);
    if (index < 0) return;
    const rows = [...this.value(output, "assignments") ?? []];
    rows.splice(index, 1);
    this.removeNode(`${output}/assignment_objects/${uid}`);
    this.setValue(output, "assignments", rows);
  }
  /** @internal A deleted bus does not cascade: assignments to it stay, marked `device.missing_bus` (fact 83). */
  danglingAssignments(sessionUid, busUid) {
    const base = `/sessions/${sessionUid}`;
    for (const kind of ["tracks", "buses"]) {
      for (const ch of this.children(`${base}/${kind}`)) {
        for (const out of this.children(`${base}/${kind}/${ch}/outputs`)) {
          const output = `${base}/${kind}/${ch}/outputs/${out}`;
          const objects = this.children(`${output}/assignment_objects`);
          const rows = this.value(output, "assignments") ?? [];
          if (!rows.some((r) => r["value"] === busUid)) continue;
          for (const uid of objects) {
            const object = `${output}/assignment_objects/${uid}`;
            if (this.value(object, "bus_uid") !== busUid) continue;
            this.setValue(object, "output_node_uid", null);
            this.setValue(object, "connection_error", "device.missing_bus");
          }
          this.setValue(output, "assignments", rows.map((r) => r["value"] === busUid ? { ...r, value: null, connection_error: "device.missing_bus" } : r));
        }
      }
    }
  }
  controlPathByUid(uid) {
    for (const [path, node] of this.nodes) {
      if (node.properties.get("control_type") !== void 0 && node.properties.get("uid") === uid) return path;
    }
    return void 0;
  }
  /**
   * Add a plugin to the catalog. `effectType` is the manifest's (comma separated, `effect`
   * when absent); `formats` the `[input, output]` stem formats it runs in (any when absent);
   * `version` its installed version (`1.0.0` when absent).
   */
  addPlugin(pluginId, options = {}) {
    const manifest = { manufacturer: options.manufacturer ?? "Mock", name: options.name ?? pluginId, plugin_id: pluginId, categories: options.categories ?? [], short_names: [] };
    if (options.effectType !== void 0) manifest["effect_type"] = options.effectType;
    if (options.formats !== void 0) manifest["supported_stream_formats"] = { primary: options.formats };
    this.addNode(`/plugins/${pluginId}`, {
      properties: {
        plugin_id: pluginId,
        name: options.name ?? pluginId,
        version: options.version ?? "1.0.0",
        description: "",
        installed: true,
        favorite: options.favorite ?? false,
        authorized: null,
        default_preset_uid: null,
        manifest
      }
    });
  }
  /** `/plugins/query` (fact 127), with LUNA's slot rules. Categories pass through untranslated. */
  queryPlugins(data) {
    const body = data ?? {};
    const fail = (msg, code = "uasrv.invalid_value") => new UAError(code, `query: ${msg}`, { cmd: "post", path: "/plugins/query" });
    const visible = ["effect", "instrument", "midi", "unison"];
    let slotType;
    let checksFormat = false;
    if (body.insert_type !== void 0) {
      const slot = body.insert_type;
      if (/^(effect|record_fx)_\d+$/.test(slot)) [slotType, checksFormat] = ["effect", true];
      else if (/^midi_\d+$/.test(slot)) slotType = "midi";
      else if (slot === "instrument") [slotType, checksFormat] = ["instrument", true];
      else if (slot === "tape") slotType = "tape";
      else if (slot === "bus_input") slotType = "console";
      else if (slot === "console") slotType = "console_ext";
      else if (slot === "sidechain_filter") slotType = "";
      else if (["reserved_0", "bus_compressor", "ara_editor_renderer"].includes(slot)) slotType = "none";
      else throw fail(`unknown insert_type ${slot}`);
    }
    let channelFormat;
    if (body.channel_uid !== void 0) {
      const base = `/sessions/${body.session_uid ?? ""}`;
      if (!body.session_uid || !this.has(base)) throw fail("unknown session", "error_code.session_missing");
      const channel = [`${base}/tracks/${body.channel_uid}`, `${base}/buses/${body.channel_uid}`].find((p) => this.has(p));
      if (!channel) throw fail("unknown channel");
      channelFormat = String(this.value(channel, "stem_format") ?? "");
    }
    const search = (body.search ?? "").toLowerCase();
    const rows = this.children("/plugins").map((id) => {
      const path = `/plugins/${id}`;
      const manifest = this.value(path, "manifest") ?? {};
      return {
        plugin_id: id,
        name: String(this.value(path, "name") ?? ""),
        manufacturer: manifest.manufacturer ?? "",
        categories: manifest.categories ?? [],
        favorite: this.value(path, "favorite") === true,
        installed: this.value(path, "installed") !== false,
        effectTypes: (manifest.effect_type || "effect").split(","),
        formats: manifest.supported_stream_formats?.primary
      };
    }).filter((p) => p.installed && p.name !== "").filter((p) => !body.favorite || p.favorite).filter((p) => !search || p.name.toLowerCase().includes(search) || p.manufacturer.toLowerCase().includes(search)).filter((p) => !body.categories?.length || p.categories.some((c) => body.categories.includes(c))).filter((p) => {
      if (slotType === "none") return false;
      if (checksFormat && channelFormat && p.formats && !p.formats.some(([i, o]) => (i === channelFormat || i === "any") && (o === channelFormat || o === "any"))) return false;
      return slotType ? p.effectTypes.includes(slotType) : p.effectTypes.some((t) => visible.includes(t));
    }).sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0);
    const limited = body.limit && body.limit > 0 ? rows.slice(0, body.limit) : rows;
    return { plugins: limited.map(({ plugin_id, name, manufacturer, categories, favorite }) => ({ plugin_id, name, manufacturer, categories, favorite })) };
  }
  /**
   * Add a preset for a plugin to the library (fact 98), with any `tags` (fact 120). Returns
   * its uid.
   */
  addPreset(pluginId, name, options = {}) {
    this.ensurePresetPlugin(pluginId);
    const root = `/presets/plugins/${pluginId}/presets`;
    const uid = options.uid ?? `preset_${this.children(root).length + 1}_${pluginId}`;
    const folder = this.value(`/presets/plugins/${pluginId}`, options.factory ? "factory_root" : "user_root");
    this.addNode(`${root}/${uid}`, {
      properties: { uid, preset_name: name, version: options.version ?? 1, favorite: options.favorite ?? false, factory: options.factory ?? false, path: folder }
    });
    this.addNode(`${root}/${uid}/tags`, { properties: { type: "tags" } });
    for (const tag of options.tags ?? []) {
      const rowid = this.nextRow();
      this.addNode(`${root}/${uid}/tags/${rowid}`, { properties: { type: "tag", rowid, tag } });
    }
    return uid;
  }
  /**
   * `/presets/query` (facts 98, 120, 132). A plugin's presets, or a device type's; with
   * `device_type_id: "track"` and `include_instrument_presets`, also every installed instrument
   * plugin's presets, with `Instrument` dropped from the tags they must match and added to the
   * tags they report, and an `is_instrument_preset` column.
   */
  queryPresets(data) {
    const body = data ?? {};
    if (!body.plugin_id && !body.device_type_id) throw new UAError("uasrv.invalid_type", "query: plugin_id or device_type_id required", { cmd: "post", path: "/presets/query" });
    const wanted = (Array.isArray(body.tag) ? body.tag : body.tag !== void 0 ? [body.tag] : []).filter((t) => t !== "");
    const any = Array.isArray(body.tag) && body.union === true;
    const search = (body.search ?? "").toLowerCase();
    const list = (root, tagsOf, tags) => this.children(root).map((uid) => ({
      uid,
      name: String(this.value(`${root}/${uid}`, "preset_name") ?? uid),
      version: Number(this.value(`${root}/${uid}`, "version") ?? 1),
      favorite: this.value(`${root}/${uid}`, "favorite") ? 1 : 0,
      factory: this.value(`${root}/${uid}`, "factory") ? 1 : 0,
      path: String(this.value(`${root}/${uid}`, "path") ?? ""),
      tags: tagsOf(uid),
      instrument: false
    })).filter((r) => tags.length === 0 || (any ? tags.some((t) => r.tags.includes(t)) : tags.every((t) => r.tags.includes(t)))).filter((r) => !search || r.name.toLowerCase().includes(search)).filter((r) => !body.favorite || r.favorite === 1);
    const limit = (rows2) => body.limit !== void 0 && body.limit > 0 ? rows2.slice(0, body.limit) : rows2;
    let rows = body.plugin_id ? limit(list(`/presets/plugins/${body.plugin_id}/presets`, (uid) => this.presetTags(body.plugin_id, uid), wanted)) : limit(list(`/presets/devices/${body.device_type_id}/presets`, (uid) => this.presetTagsAt(`/presets/devices/${body.device_type_id}/presets/${uid}/tags`), wanted));
    const merge = !body.plugin_id && body.device_type_id === "track" && body.include_instrument_presets === true;
    if (merge) {
      const pluginTags = wanted.filter((t) => t !== "Instrument");
      for (const pluginId of this.instrumentPluginIds()) {
        const found = limit(list(`/presets/plugins/${pluginId}/presets`, (uid) => this.presetTags(pluginId, uid), pluginTags));
        rows = rows.concat(found.map((r) => ({ ...r, instrument: true, tags: r.tags.includes("Instrument") ? r.tags : [...r.tags, "Instrument"] })));
      }
    }
    const results = { num_rows: rows.length };
    for (const k of ["uid", "name", "version", "favorite", "factory", "path"]) results[k] = rows.map((r) => r[k]);
    if (body.tags) results["tags"] = rows.map((r) => r.tags);
    if (merge) results["is_instrument_preset"] = rows.map((r) => r.instrument);
    return { results, folders: [] };
  }
  /** @internal Installed plugins whose manifest makes them instruments. */
  instrumentPluginIds() {
    return this.children("/plugins").filter((id) => {
      const manifest = this.value(`/plugins/${id}`, "manifest") ?? {};
      return this.value(`/plugins/${id}`, "installed") !== false && (manifest.effect_type ?? "").split(",").includes("instrument");
    });
  }
  /**
   * Add a track preset to the library (fact 132). Like LUNA when it saves one, it is tagged
   * with its category (`Audio`, `Instrument`, `Bus`, or `Multi-Track` for more than one
   * track) besides any `tags`. `new_track` with it makes one track of `trackType` named after
   * it, or, with `trackNames`, a track per name, named as the preset saved them. Returns its uid.
   */
  addTrackPreset(name, options = {}) {
    const root = "/presets/devices/track/presets";
    const uid = options.uid ?? `track_preset_${this.children(root).length + 1}`;
    const trackType = options.trackType ?? "audio";
    const count = options.trackNames?.length ?? 1;
    this.addNode(`${root}/${uid}`, {
      properties: { uid, preset_name: name, version: 1, favorite: options.favorite ?? false, factory: options.factory ?? false, path: "", track_type: trackType, track_names: options.trackNames ?? null }
    });
    this.addNode(`${root}/${uid}/tags`, { properties: { type: "tags" } });
    const category = count > 1 ? "Multi-Track" : { audio: "Audio", instrument: "Instrument", bus: "Bus" }[trackType];
    for (const tag of [category, ...options.tags ?? []]) {
      const rowid = this.nextRow();
      this.addNode(`${root}/${uid}/tags/${rowid}`, { properties: { type: "tag", rowid, tag } });
    }
    return uid;
  }
  /** Add a group of track preset tags, as {@link addPresetTagGroup} does for a plugin. */
  addTrackPresetTagGroup(name, tags, options = {}) {
    return this.addTagGroupAt("/presets/devices/track/categories", name, tags, options);
  }
  /** @internal The preset `uid` names: a track preset, or a plugin preset with its plugin. */
  findPreset(uid) {
    const track = `/presets/devices/track/presets/${uid}`;
    if (this.has(track)) return { kind: "track", path: track };
    for (const pluginId of this.children("/presets/plugins")) {
      const path = `/presets/plugins/${pluginId}/presets/${uid}`;
      if (this.has(path)) return { kind: "plugin", path, pluginId };
    }
    return void 0;
  }
  /** @internal Put a plugin on a track's instrument slot (or first effect slot), on a preset. */
  putPluginPreset(track, pluginId, presetPath) {
    const instrument = this.instrumentPluginIds().includes(pluginId);
    const slot = `${track}/effects/${instrument ? "instrument" : "effect_0"}`;
    if (!this.has(slot)) {
      this.addNode(slot, { properties: { uid: `${track}_instrument`, insert_type: "instrument", plugin_id: null, plugin_name: null, external_sdk_instance_id: null, enabled: true, plugin_power: true, preset_name: null, preset_uid: null, preset_uid_dirty: false }, readOnly: ["uid", "insert_type", "plugin_id", "plugin_name"] });
      this.addNode(`${slot}/controls`);
    }
    this.setValue(slot, "plugin_id", pluginId);
    this.setValue(slot, "plugin_name", this.value(`/plugins/${pluginId}`, "name") ?? pluginId);
    this.setValue(slot, "preset_uid", this.value(presetPath, "uid"));
    this.setValue(slot, "preset_name", this.value(presetPath, "preset_name"));
    this.setValue(slot, "preset_uid_dirty", false);
  }
  /**
   * `post /presets/devices/track/load` (fact 132): a track preset or an instrument plugin's
   * preset onto a track. The track records the preset and takes its name unless its
   * `name_modified` is true; a name set through `set` does not make it so.
   */
  loadTrackPreset(data) {
    const body = data ?? {};
    const where = { cmd: "post", path: "/presets/devices/track/load" };
    const track = `/sessions/${body.session_uid ?? ""}/tracks/${body.uid ?? ""}`;
    if (!body.session_uid || !body.preset_uid) throw new UAError("uasrv.invalid_property", "load: session_uid and preset_uid required", where);
    const preset = this.findPreset(body.preset_uid);
    if (!preset || !this.has(track)) throw new UAError("device.database_error", "load: no such track or preset", where);
    if (preset.kind === "plugin") {
      if (this.instrumentPluginIds().includes(preset.pluginId) && this.value(track, "track_type") !== "instrument") throw new UAError("uasrv.invalid_value", "load: an instrument preset needs an instrument track", where);
      this.putPluginPreset(track, preset.pluginId, preset.path);
    }
    const name = this.value(preset.path, "preset_name");
    this.setValue(track, "preset_uid", body.preset_uid);
    this.setValue(track, "preset_name", name);
    if (this.value(track, "name_modified") !== true) this.setValue(track, "name", name);
    return null;
  }
  /**
   * Add a group of preset tags for a plugin, as LUNA keeps them: a sub-category named `name`
   * under the category `category` (default `Default`) holding the tags (fact 120). Returns
   * the sub-category uid.
   */
  addPresetTagGroup(pluginId, name, tags, options = {}) {
    this.ensurePresetPlugin(pluginId);
    return this.addTagGroupAt(`/presets/plugins/${pluginId}/categories`, name, tags, options);
  }
  addTagGroupAt(categories, name, tags, options) {
    const categoryName = options.category ?? "Default";
    let categoryUid = this.children(categories).find((c) => this.value(`${categories}/${c}`, "name") === categoryName);
    if (!categoryUid) {
      categoryUid = `cat_${this.nextRow()}`;
      this.addNode(`${categories}/${categoryUid}`, { properties: { type: "category", rowid: this.nextRow(), uid: categoryUid, name: categoryName } });
      this.addNode(`${categories}/${categoryUid}/sub_categories`, { properties: { type: "sub_categories" } });
    }
    const subUid = `sub_${this.nextRow()}`;
    const sub = `${categories}/${categoryUid}/sub_categories/${subUid}`;
    this.addNode(sub, { properties: { type: "sub_category", rowid: this.nextRow(), uid: subUid, name } });
    this.addNode(`${sub}/tags`, { properties: { type: "tags" } });
    for (const tag of tags) {
      const rowid = this.nextRow();
      this.addNode(`${sub}/tags/${rowid}`, { properties: { type: "tag", rowid, tag } });
    }
    return subUid;
  }
  /** Connect or disconnect UA Assistant, which preset recommendations need (fact 121). */
  setAssistantEnabled(enabled) {
    this.setValue("/assistant", "enabled", enabled);
  }
  /**
   * Script what UA Assistant recommends for a plugin. Without one the mock ranks the plugin's
   * presets by how many words of the query appear in their name or tags.
   */
  setPresetRecommendations(pluginId, recommend) {
    this.recommenders.set(pluginId, recommend);
  }
  /** @internal */
  presetTags(pluginId, uid) {
    return this.presetTagsAt(`/presets/plugins/${pluginId}/presets/${uid}/tags`);
  }
  /** @internal */
  presetTagsAt(folder) {
    return this.children(folder).map((t) => String(this.value(`${folder}/${t}`, "tag") ?? "")).filter((t) => t !== "");
  }
  /** @internal */
  recommendPresets(pluginId, query) {
    const scripted = this.recommenders.get(pluginId);
    if (scripted) return scripted(query);
    const words = query.toLowerCase().split(/\s+/).filter((w) => w !== "");
    const root = `/presets/plugins/${pluginId}/presets`;
    return this.children(root).map((uid) => {
      const name = String(this.value(`${root}/${uid}`, "preset_name") ?? uid);
      const haystack = [name, ...this.presetTags(pluginId, uid)].join(" ").toLowerCase();
      const hits = words.filter((w) => haystack.includes(w)).length;
      return { preset_name: name, preset_uuid: uid, rrf_score: hits / 60 };
    }).filter((r) => r.rrf_score > 0).sort((a, b) => b.rrf_score - a.rrf_score).slice(0, 5);
  }
  /**
   * `/presets/plugins/<id>` with its `load` command: put a preset's identity on the effect
   * whose `uid` is given (fact 122).
   */
  ensurePresetPlugin(pluginId) {
    const path = `/presets/plugins/${pluginId}`;
    if (this.has(path)) return;
    this.addNode(path, {
      properties: { plugin_id: pluginId, factory_root: `/Mock/factory_presets/${pluginId}`, user_root: `/Mock/Presets/Plug-Ins/${pluginId}` },
      commands: {
        load: (data, engine) => {
          const body = data ?? {};
          const preset = `${path}/presets/${body.preset_uid ?? ""}`;
          const effect = engine.effectPathByUid(body.session_uid ?? "", body.uid ?? "");
          if (!effect || !body.preset_uid || !engine.has(preset)) throw new UAError("uasrv.invalid_property", "load: no such effect or preset", { cmd: "post", path: `${path}/load` });
          engine.setValue(effect, "preset_uid", body.preset_uid);
          engine.setValue(effect, "preset_name", engine.value(preset, "preset_name"));
          engine.setValue(effect, "preset_uid_dirty", false);
          return null;
        }
      }
    });
    this.addNode(`${path}/presets`, { properties: { type: "presets" } });
    this.addNode(`${path}/categories`, { properties: { type: "categories" } });
  }
  /** @internal The effect slot under `session` whose `uid` is `uid`. */
  effectPathByUid(session, uid) {
    const prefix = `/sessions/${session}/`;
    for (const [path, node] of this.nodes) {
      if (path.startsWith(prefix) && /\/effects\/[^/]+$/.test(path) && node.properties.get("uid") === uid) return path;
    }
    return void 0;
  }
  /** Register a session package in the workspace. */
  addPackage(uid, options = {}) {
    this.addNode(`/workspace/sessions/${uid}`, {
      properties: { uid, file_name: `${options.name ?? uid}.luna`, directory_path: `/tmp/${options.name ?? uid}`, session_type: "default", factory: false, favorite: options.favorite ?? false, created: options.lastOpened ?? 0, modified: 0, last_opened: options.lastOpened ?? 0, comments: "" }
    });
  }
  /** A new client connection. */
  port() {
    const port = new MockPort(this);
    this.ports.add(port);
    return port;
  }
  // ---------------------------------------------------------------------------------------
  // Tree building
  // ---------------------------------------------------------------------------------------
  /** Create a node (and any missing ancestors). Pushes `added` to subscribers. */
  addNode(path, spec = {}) {
    const clean = normalize(path);
    if (clean !== "/" && !this.nodes.has(parentOf(clean))) this.addNode(parentOf(clean));
    const node = {
      properties: new Map(Object.entries(spec.properties ?? {})),
      readOnly: new Set(spec.readOnly ?? []),
      commands: new Map(Object.entries(spec.commands ?? {})),
      children: []
    };
    const existed = this.nodes.has(clean);
    this.nodes.set(clean, node);
    if (clean !== "/") {
      const parent = this.nodes.get(parentOf(clean));
      const name = splitPath(clean).name;
      if (parent && !parent.children.includes(name)) parent.children.push(name);
    }
    if (!existed && clean !== "/") this.push({ path: clean, operation: "added" }, void 0);
    this.clipChanged(clean);
  }
  /** Remove a node and its subtree. Pushes `removed` to subscribers. */
  removeNode(path) {
    const clean = normalize(path);
    if (!this.nodes.has(clean)) return;
    for (const key of [...this.nodes.keys()]) {
      if (key === clean || key.startsWith(clean + "/")) this.nodes.delete(key);
    }
    const parent = this.nodes.get(parentOf(clean));
    const name = splitPath(clean).name;
    if (parent) parent.children = parent.children.filter((c) => c !== name);
    this.push({ path: clean, operation: "removed" }, void 0);
    this.clipChanged(clean);
  }
  /** @internal Drop a property; LUNA pushes nothing for it (fact 110). */
  deleteValue(nodePath, property) {
    this.nodes.get(normalize(nodePath))?.properties.delete(property);
  }
  /** Engine-side property change: updates the tree and pushes to every subscribed port. */
  setValue(nodePath, property, value) {
    const clean = normalize(nodePath);
    const node = this.nodes.get(clean);
    if (!node) throw new Error(`MockEngine: no node ${nodePath}`);
    node.properties.set(property, value);
    this.push({ path: `${clean}/${property}/value`, data: value }, void 0);
    this.clipChanged(clean);
    if (property === "play_start" && /^\/sessions\/[^/]+$/.test(clean) && node.properties.get("playing") !== true) {
      this.setValue(clean, "location", this.locationAt(clean, Number(value)));
    }
    if (property === "taper" && typeof node.properties.get("real_value") === "number" && node.properties.get("discrete") !== true) {
      this.setValue(clean, "normalized_value", faderTaper(node.properties).toNormalized(Number(node.properties.get("real_value"))));
    }
  }
  /**
   * The session `location` LUNA reports for `tick`: bar|beat from the session's time
   * signatures, whose `bar` numbers need not put bar 1 at tick 0 (fact 91), and `min_sec`
   * from the tempo map (fact 96).
   */
  locationAt(sessionPath, tick) {
    const beatTicks = 96e9;
    const sigs = this.children(`${sessionPath}/time_signatures`).map((id) => this.nodes.get(`${sessionPath}/time_signatures/${id}`).properties).map((p) => ({ tick: Number(p.get("tick") ?? 0), bar: Number(p.get("bar") ?? 1), n: Number(p.get("numerator") ?? 4), d: Number(p.get("denominator") ?? 4) })).sort((a, b) => a.tick - b.tick);
    const sig = sigs.filter((x) => x.tick <= tick).at(-1) ?? sigs[0] ?? { tick: 0, bar: 1, n: 4, d: 4 };
    const beat = beatTicks * 4 / sig.d;
    const rel = tick - sig.tick;
    const inBar = (rel % (beat * sig.n) + beat * sig.n) % (beat * sig.n);
    const seconds = this.secondsAt(sessionPath, tick);
    const previous = this.nodes.get(sessionPath)?.properties.get("location");
    return {
      tick,
      bar_beat: { bar: sig.bar + Math.floor(rel / (beat * sig.n)), beat: 1 + Math.floor(inBar / beat), tick: inBar % beat },
      min_sec: { minutes: Math.floor(seconds / 60), seconds: seconds % 60 },
      tempo: previous?.tempo ?? 120,
      time_signature: { numerator: sig.n, denominator: sig.d },
      playing: this.nodes.get(sessionPath)?.properties.get("playing") === true
    };
  }
  /**
   * What a playlist plays (fact 116): every clip cut at every clip edge, each piece given to
   * the highest layer (then the narrower clip, then the larger uid), neighbouring pieces of one
   * clip joined. Time order.
   */
  segmentsOf(playlistPath) {
    const clips = this.children(`${playlistPath}/clips`).map((uid) => {
      const p = this.nodes.get(`${playlistPath}/clips/${uid}`).properties;
      return { uid, path: `${playlistPath}/clips/${uid}`, name: p.get("name"), start: Number(p.get("start") ?? 0), stop: Number(p.get("stop") ?? 0), layer: Number(p.get("layer") ?? 0), sourceStart: Number(p.get("source_start") ?? 0), sourceStop: Number(p.get("source_stop") ?? 0) };
    }).filter((c) => c.stop > c.start);
    const edges = [...new Set(clips.flatMap((c) => [c.start, c.stop]))].sort((a, b) => a - b);
    const segments = [];
    for (let i = 0; i + 1 < edges.length; i++) {
      const [from, to] = [edges[i], edges[i + 1]];
      const winner = clips.filter((c) => c.start <= from && c.stop >= to).sort((a, b) => b.layer - a.layer || a.stop - a.start - (b.stop - b.start) || (a.uid < b.uid ? 1 : a.uid > b.uid ? -1 : 0))[0];
      if (!winner) continue;
      const last = segments.at(-1);
      if (last && last.clip === winner && last.stop === from) last.stop = to;
      else segments.push({ clip: winner, start: from, stop: to });
    }
    return segments;
  }
  /**
   * One segment's fades as LUNA compiles them (fact 117): a crossfade with the segment it
   * adjoins, measured from the edit between them, whether the clips are butted or overlap;
   * otherwise the clip's plain fade-in on its first segment and fade-out on its last.
   */
  segmentFades(segments, i, playlistPath) {
    const seg = segments[i];
    const prev = segments[i - 1]?.stop === seg.start ? segments[i - 1] : void 0;
    const next = segments[i + 1]?.start === seg.stop ? segments[i + 1] : void 0;
    const rows = this.fadeRows(`${playlistPath}/clips/${seg.clip.uid}`);
    const abs = (r, edge) => r ? { ...r, start: edge + r.startOffset, stop: edge + r.stopOffset, clipPath: seg.clip.path } : void 0;
    const crossIn = prev && rows.find((r) => r.type === "fade_in" && r.contributor === prev.clip.uid);
    const crossOut = next && rows.find((r) => r.type === "fade_out" && r.contributor === next.clip.uid);
    const plainIn = seg.start === seg.clip.start ? rows.find((r) => r.type === "fade_in" && !r.contributor) : void 0;
    const plainOut = seg.stop === seg.clip.stop ? rows.find((r) => r.type === "fade_out" && !r.contributor) : void 0;
    return { fin: crossIn ? abs(crossIn, seg.start) : abs(plainIn, seg.clip.start), fout: crossOut ? abs(crossOut, seg.stop) : abs(plainOut, seg.clip.stop) };
  }
  /** A clip node or one of its properties changed: recompile its playlist if a client enabled that. */
  clipChanged(path) {
    const m = /^(\/sessions\/[^/]+\/playlists\/[^/]+)\/clips\/[^/]+(?:\/fades(?:\/[^/]+)?)?$/.exec(path);
    if (m && this.nodes.get(m[1])?.properties.get("enable_compiled_clips") === true) this.compilePlaylist(m[1]);
  }
  /**
   * Publish a playlist's compiled clips the way deviced's clip compiler and
   * `Sesn_CompiledClips` do (fact 116): cut every clip at every clip edge, give each piece to
   * the highest layer (then the narrower clip, then the larger uid), join neighbouring pieces
   * of one clip, and cut each segment's source range out through the tempo map. Nodes are
   * named by a running counter and updated in place while their start stays put. The mock
   * keeps no fades, so they publish as null and the full range equals the segment.
   */
  compilePlaylist(playlistPath) {
    const sessionPath = playlistPath.slice(0, playlistPath.indexOf("/playlists/"));
    const folder = `${playlistPath}/compiled_clips`;
    if (!this.nodes.has(folder)) this.addNode(folder);
    const segments = this.segmentsOf(playlistPath);
    const clips = segments.map((s) => s.clip);
    const state = this.compiled.get(playlistPath) ?? { byStart: /* @__PURE__ */ new Map(), next: 0 };
    this.compiled.set(playlistPath, state);
    const sourceAt = (clip, tick) => Math.round(clip.sourceStart + (this.secondsAt(sessionPath, tick) - this.secondsAt(sessionPath, clip.start)) * 1e9);
    const kept = /* @__PURE__ */ new Set();
    for (const seg of segments) {
      kept.add(seg.start);
      const props = { clip_uid: seg.clip.uid, name: seg.clip.name, start: seg.start, stop: seg.stop, source_start: sourceAt(seg.clip, seg.start), source_stop: sourceAt(seg.clip, seg.stop) };
      if (this.compiledClipFades) {
        const { fin, fout } = this.segmentFades(segments, segments.indexOf(seg), playlistPath);
        Object.assign(props, { full_start: fin?.contributor ? Math.min(seg.start, fin.start) : seg.start, full_stop: fout?.contributor ? Math.max(seg.stop, fout.stop) : seg.stop });
        const clipProps = this.nodes.get(`${playlistPath}/clips/${seg.clip.uid}`).properties;
        const clipRender = clipProps.get("render_state") === "current" ? clipProps.get("render_source_uid") : void 0;
        if (typeof clipRender === "string" && clipRender) {
          const piece = segments.filter((s) => s.clip === seg.clip).indexOf(seg);
          Object.assign(props, { render_source_uid: piece === 0 ? clipRender : `${clipRender}_${piece}`, render_source_start: 0, render_source_stop: Math.round((this.secondsAt(sessionPath, seg.stop) - this.secondsAt(sessionPath, seg.start)) * 1e9), needs_render: true });
        } else Object.assign(props, { render_source_uid: null, render_source_start: null, render_source_stop: null, needs_render: false });
        for (const [side, f] of [["fade_in", fin], ["fade_out", fout]]) {
          props[`${side}_uid`] = f?.uid ?? null;
          props[`${side}_start`] = f?.start ?? null;
          props[`${side}_stop`] = f?.stop ?? null;
          props[`${side}_shape`] = f?.shape ?? null;
          props[`${side}_curvature`] = f ? f.curvature : null;
          props[`${side}_crossfade`] = f ? f.contributor !== void 0 : null;
          props[`${side}_contributor_clip_uid`] = f?.contributor ?? null;
        }
      }
      const name = state.byStart.get(seg.start);
      if (name === void 0 || !this.nodes.has(`${folder}/${name}`)) {
        const fresh = String(state.next++);
        state.byStart.set(seg.start, fresh);
        this.addNode(`${folder}/${fresh}`, { properties: props, readOnly: Object.keys(props) });
        continue;
      }
      const node = this.nodes.get(`${folder}/${name}`);
      for (const [k, v] of Object.entries(props)) if (node.properties.get(k) !== v) this.setValue(`${folder}/${name}`, k, v);
    }
    for (const [start, name] of [...state.byStart]) {
      if (kept.has(start)) continue;
      state.byStart.delete(start);
      this.removeNode(`${folder}/${name}`);
    }
  }
  fadeCounter = 0;
  /** @internal A clip uid free on the playlist: `clip<n>`, counting on from the clips there. */
  nextClipId(base, playlist) {
    const taken = new Set(this.children(`${base}/playlists/${playlist}/clips`));
    let n = taken.size + 1;
    while (taken.has(`clip${n}`)) n++;
    return `clip${n}`;
  }
  /** A clip's stored fade rows (`<clip>/fades/<uid>`), offsets relative to the clip edge. */
  fadeRows(clipPath) {
    return this.children(`${clipPath}/fades`).map((uid) => {
      const p = this.nodes.get(`${clipPath}/fades/${uid}`).properties;
      const contributor = p.get("contributor_clip_uid");
      return {
        uid,
        type: String(p.get("fade_type")),
        shape: String(p.get("fade_shape") ?? "log"),
        curvature: Number(p.get("fade_curvature") ?? 0),
        startOffset: Number(p.get("start_offset") ?? 0),
        stopOffset: Number(p.get("stop_offset") ?? 0),
        contributor: typeof contributor === "string" && contributor ? contributor : void 0
      };
    });
  }
  /** Create or update a fade row the way `set_fade` does: shape only for a new one (fact 117). */
  putFade(clipPath, type, contributor, startOffset, stopOffset, shape, results) {
    const existing = this.fadeRows(clipPath).find((r) => r.type === type && r.contributor === contributor);
    if (existing) {
      if (existing.startOffset === startOffset && existing.stopOffset === stopOffset) return;
      this.setValue(`${clipPath}/fades/${existing.uid}`, "start_offset", startOffset);
      this.setValue(`${clipPath}/fades/${existing.uid}`, "stop_offset", stopOffset);
      results.changed.push({ fade_uid: existing.uid, properties: { start_offset: startOffset, stop_offset: stopOffset } });
      return;
    }
    const uid = `fade${++this.fadeCounter}`;
    const clipUid = splitPath(clipPath).name;
    const properties = { uid, clip_uid: clipUid, contributor_clip_uid: contributor ?? null, fade_type: type, fade_shape: shape, start_offset: startOffset, stop_offset: stopOffset, fade_curvature: 0, fade_reference_edge: false };
    this.addNode(`${clipPath}/fades/${uid}`, { properties, readOnly: ["uid", "clip_uid", "contributor_clip_uid"] });
    results.added.push({ clip_uid: clipUid, fade_uid: uid, properties });
  }
  /** The tick `seconds` after `tick` through the tempo map. */
  tickAfter(sessionPath, tick, seconds) {
    const target = this.secondsAt(sessionPath, tick) + seconds;
    let lo = tick, hi = tick + 96e9;
    while (this.secondsAt(sessionPath, hi) < target) hi += hi - tick;
    for (let i = 0; i < 64; i++) {
      const mid = (lo + hi) / 2;
      if (this.secondsAt(sessionPath, mid) < target) lo = mid;
      else hi = mid;
    }
    return Math.round(hi);
  }
  /** @internal What the last timeline copy or cut put on the clipboard: its length and each track's clips, offset from the range start. */
  timelineClipboard;
  /**
   * @internal The edit context's clip commands with focus `timeline` (fact 150), as LUNA does
   * them: on the clips of the selected tracks' active playlists inside the selected range.
   * `copy` puts them on the clipboard cut to the range; `clear` takes the range out of them
   * (trimming or splitting a clip that crosses an edge) and collapses the selection to its
   * start; `cut` is both; `paste` puts the clipboard at the selection start, the first copied
   * track's clips on the first selected track and so on, and selects what it pasted;
   * `duplicate` pastes the range right after itself and selects the copy. Nothing happens
   * without a range, or with another focus.
   */
  timelineEdit(base, command) {
    const ctx = `${base}/contexts/main`;
    if (this.value(ctx, "focus") !== "timeline") return null;
    const list = (v) => Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? [v] : [];
    const tracks = list(this.value(ctx, "selection_tracks")).filter((t) => this.has(`${base}/tracks/${t}`));
    const playlists = tracks.map((t) => String(this.value(`${base}/tracks/${t}`, "playlist_uid")));
    const start = this.value(ctx, "selection_start");
    const stop = this.value(ctx, "selection_stop");
    const s = typeof start === "number" ? start : void 0;
    const e = typeof stop === "number" ? stop : void 0;
    const ns = (a, b) => Math.round((this.secondsAt(base, b) - this.secondsAt(base, a)) * 1e9);
    const clipsOf = (pl) => this.children(`${base}/playlists/${pl}/clips`).map((uid) => {
      const path = `${base}/playlists/${pl}/clips/${uid}`;
      return { uid, path, props: Object.fromEntries(this.nodes.get(path).properties) };
    });
    const num = (v) => Number(v ?? 0);
    const copy = () => {
      if (s === void 0 || e === void 0 || e <= s) return false;
      this.timelineClipboard = {
        length: e - s,
        lanes: playlists.map(
          (pl) => clipsOf(pl).filter((c) => num(c.props["start"]) < e && num(c.props["stop"]) > s).map((c) => {
            const c0 = num(c.props["start"]);
            const from = Math.max(c0, s);
            const to = Math.min(num(c.props["stop"]), e);
            const srcStart = num(c.props["source_start"]) + ns(c0, from);
            return { ...c.props, start: from - s, stop: to - s, source_start: srcStart, source_stop: srcStart + ns(from, to) };
          })
        )
      };
      return true;
    };
    const clear = () => {
      if (s === void 0 || e === void 0 || e <= s) return;
      for (const pl of playlists) {
        for (const c of clipsOf(pl)) {
          const c0 = num(c.props["start"]);
          const c1 = num(c.props["stop"]);
          if (c1 <= s || c0 >= e) continue;
          const src0 = num(c.props["source_start"]);
          if (c0 >= s && c1 <= e) {
            this.removeNode(c.path);
            continue;
          }
          if (c0 < s && c1 > e) {
            const tailSrc = src0 + ns(c0, e);
            const id = this.nextClipId(base, pl);
            this.addNode(`${base}/playlists/${pl}/clips/${id}`, { properties: { ...c.props, uid: id, start: e, source_start: tailSrc } });
            this.setValue(c.path, "stop", s);
            this.setValue(c.path, "source_stop", src0 + ns(c0, s));
          } else if (c0 < s) {
            this.setValue(c.path, "stop", s);
            this.setValue(c.path, "source_stop", src0 + ns(c0, s));
          } else {
            this.setValue(c.path, "source_start", src0 + ns(c0, e));
            this.setValue(c.path, "start", e);
          }
        }
      }
      this.setValue(ctx, "selection_stop", s);
    };
    const paste = (at) => {
      const board = this.timelineClipboard;
      if (!board) return;
      board.lanes.forEach((clips, i) => {
        const pl = playlists[i];
        if (!pl) return;
        for (const c of clips) {
          const id = this.nextClipId(base, pl);
          this.addNode(`${base}/playlists/${pl}/clips/${id}`, { properties: { ...c, uid: id, start: num(c["start"]) + at, stop: num(c["stop"]) + at } });
        }
      });
      this.setValue(ctx, "selection_start", at);
      this.setValue(ctx, "selection_stop", at + board.length);
    };
    switch (command) {
      case "copy":
        copy();
        break;
      case "clear":
        clear();
        break;
      case "cut":
        if (copy()) clear();
        break;
      case "paste":
        if (s !== void 0) paste(s);
        break;
      case "duplicate":
        if (copy() && e !== void 0) paste(e);
        break;
    }
    return null;
  }
  /** The playlists a context edit names: `playlist_uid`, else `track_uid` (active playlists), else the selection. */
  /** @internal */
  editPlaylists(base, body, tracksOnly = false) {
    const list = (v) => v === void 0 || v === null ? void 0 : (Array.isArray(v) ? v : [v]).map(String);
    const tracks = list(body["track_uid"]);
    if (tracks) return tracks.map((t) => String(this.value(`${base}/tracks/${t}`, "playlist_uid")));
    const playlists = tracksOnly ? void 0 : list(body["playlist_uid"]);
    return playlists ?? list(this.value(`${base}/contexts/main`, "selection_playlists")) ?? [];
  }
  /**
   * @internal The clip and fade edits of the edit context, as measured on LUNA (fact 117):
   * explicit ranges where LUNA takes them, the selection where it reads one.
   */
  clipEdit(base, command, data) {
    const body = data ?? {};
    const ctx = `${base}/contexts/main`;
    const clipsOf = (pl) => this.children(`${base}/playlists/${pl}/clips`).map((uid) => {
      const path = `${base}/playlists/${pl}/clips/${uid}`;
      const p = this.nodes.get(path).properties;
      return { uid, path, start: Number(p.get("start")), stop: Number(p.get("stop")), sourceUid: p.get("source_uid"), sourceStart: Number(p.get("source_start") ?? 0), sourceStop: Number(p.get("source_stop") ?? 0) };
    });
    const nsBetween = (a, b) => Math.round((this.secondsAt(base, b) - this.secondsAt(base, a)) * 1e9);
    const newClipFrom = (pl, fromPath, props) => {
      const id = this.nextClipId(base, pl);
      const source = Object.fromEntries(this.nodes.get(fromPath).properties);
      this.addNode(`${base}/playlists/${pl}/clips/${id}`, { properties: { ...source, uid: id, ...props } });
      return id;
    };
    switch (command) {
      case "move_clips": {
        const start = Number(body["start"] ?? this.value(ctx, "selection_start"));
        const stop = Number(body["stop"] ?? this.value(ctx, "selection_stop"));
        const location = Number(body["location"]);
        if (!Number.isFinite(location)) throw new UAError("uasrv.invalid_property", "move_clips: location is required", { cmd: "post", path: `${ctx}/commands/move_clips` });
        for (const pl of this.editPlaylists(base, body)) {
          const segments = this.segmentsOf(`${base}/playlists/${pl}`);
          const inside = segments.filter((s) => s.start >= start && s.stop <= stop);
          for (const clip of [...new Set(inside.map((s) => s.clip))]) {
            const from = Math.max(clip.start, start), to = Math.min(clip.stop, stop);
            const at = (tick) => clip.sourceStart + nsBetween(clip.start, tick);
            const dest = location + (from - start);
            const moved = { start: dest, stop: dest + (to - from), source_start: at(from), source_stop: at(to) };
            const before = segments.some((s) => s.clip === clip && s.stop <= start);
            const after = segments.some((s) => s.clip === clip && s.start >= stop);
            if (body["copy"] === true) {
              newClipFrom(pl, clip.path, moved);
              continue;
            }
            if (!before && !after) {
              for (const [k, v] of Object.entries(moved)) this.setValue(clip.path, k, v);
              continue;
            }
            newClipFrom(pl, clip.path, moved);
            if (before && after) newClipFrom(pl, clip.path, { start: to, stop: clip.stop, source_start: at(to), source_stop: clip.sourceStop });
            if (before) {
              this.setValue(clip.path, "stop", from);
              this.setValue(clip.path, "source_stop", at(from));
            } else {
              this.setValue(clip.path, "start", to);
              this.setValue(clip.path, "source_start", at(to));
            }
          }
        }
        this.setValue(ctx, "selection_start", location);
        this.setValue(ctx, "selection_stop", location + (stop - start));
        return null;
      }
      case "separate_clips": {
        const locations = [...new Set((Array.isArray(body["location"]) ? body["location"] : [body["location"]]).map(Number))].sort((a, b) => a - b);
        for (const pl of this.editPlaylists(base, body)) {
          for (const c of clipsOf(pl)) {
            const cuts = locations.filter((l) => l > c.start && l < c.stop);
            if (!cuts.length) continue;
            const edges = [c.start, ...cuts, c.stop];
            const at = (tick) => c.sourceStart + nsBetween(c.start, tick);
            const rows = this.fadeRows(c.path);
            for (const r of rows.filter((r2) => r2.contributor)) this.removeNode(`${c.path}/fades/${r.uid}`);
            const fadeOut = rows.find((r) => r.type === "fade_out" && !r.contributor);
            let last = "";
            for (let i = 1; i + 1 < edges.length; i++) last = newClipFrom(pl, c.path, { start: edges[i], stop: edges[i + 1], source_start: at(edges[i]), source_stop: at(edges[i + 1]) });
            this.setValue(c.path, "stop", cuts[0]);
            this.setValue(c.path, "source_stop", at(cuts[0]));
            if (fadeOut) {
              this.removeNode(`${c.path}/fades/${fadeOut.uid}`);
              this.putFade(`${base}/playlists/${pl}/clips/${last}`, "fade_out", void 0, fadeOut.startOffset, fadeOut.stopOffset, fadeOut.shape, { added: [], changed: [] });
            }
          }
        }
        return null;
      }
      case "heal_separation": {
        const selStart = Number(this.value(ctx, "selection_start"));
        const selStop = Number(this.value(ctx, "selection_stop"));
        for (const pl of this.editPlaylists(base, {})) {
          const set = clipsOf(pl).filter((c) => c.start > selStart && c.start <= selStop || c.start <= selStart && c.stop > selStart).sort((a, b) => a.start - b.start);
          let left = set[0];
          for (const right of set.slice(1)) {
            const continues = left.sourceUid === right.sourceUid && right.start >= left.stop && Math.abs(right.sourceStart - nsBetween(left.stop, right.start) - left.sourceStop) <= 1024;
            if (!continues) {
              left = right;
              continue;
            }
            this.removeNode(right.path);
            this.setValue(left.path, "stop", right.stop);
            this.setValue(left.path, "source_stop", right.sourceStop);
            left = { ...left, stop: right.stop, sourceStop: right.sourceStop };
          }
        }
        return null;
      }
      case "set_fade": {
        const shape = typeof body["fade_shape"] === "string" && ["linear", "equal_power", "log"].includes(body["fade_shape"]) ? body["fade_shape"] : "log";
        const entries = Array.isArray(body["clips"]) ? body["clips"] : [body];
        const results = { added: [], changed: [] };
        for (const f of entries) {
          const clipPath = this.findClip(base, String(f["clip_uid"] ?? ""));
          if (!clipPath || ![0, "audio", void 0].includes(this.value(clipPath, "clip_type"))) continue;
          const so = Number(f["start_offset"] ?? 0);
          const eo = Number(f["stop_offset"] ?? 0);
          const contributor = typeof f["contributor_clip_uid"] === "string" && f["contributor_clip_uid"] ? f["contributor_clip_uid"] : void 0;
          if (f["fade_type"] === "fade_in") this.putFade(clipPath, "fade_in", void 0, 0, eo, shape, results);
          else if (f["fade_type"] === "fade_out") this.putFade(clipPath, "fade_out", void 0, so, 0, shape, results);
          else if (f["fade_type"] === "cross_fade" && contributor) {
            const right = this.findClip(base, contributor);
            if (!right) continue;
            this.putFade(clipPath, "fade_out", contributor, so, eo, shape, results);
            this.putFade(right, "fade_in", splitPath(clipPath).name, so, eo, shape, results);
          } else throw new UAError("uasrv.invalid_object", "set_fade: unknown fade_type", { cmd: "post", path: `${ctx}/commands/set_fade` });
        }
        const out = {};
        if (results.added.length) out["added"] = { fades: results.added };
        if (results.changed.length) out["changed"] = { fades: results.changed };
        return Object.keys(out).length ? { edit_results: out } : null;
      }
      case "delete_fades": {
        const start = Number(body["start"] ?? this.value(ctx, "selection_start"));
        const stop = Number(body["stop"] ?? this.value(ctx, "selection_stop"));
        for (const pl of this.editPlaylists(base, body)) {
          const playlistPath = `${base}/playlists/${pl}`;
          const segments = this.segmentsOf(playlistPath);
          const doomed = segments.flatMap((s, i) => {
            if (!(s.start < stop && s.stop > start)) return [];
            const { fin, fout } = this.segmentFades(segments, i, playlistPath);
            return [fin, fout].filter((f) => f !== void 0 && f.start >= start && f.stop <= stop).map((f) => `${f.clipPath}/fades/${f.uid}`);
          });
          for (const path of new Set(doomed)) this.removeNode(path);
        }
        return null;
      }
      case "batch_fades": {
        const start = Number(body["start"] ?? this.value(ctx, "selection_start"));
        const stop = Number(body["stop"] ?? this.value(ctx, "selection_stop"));
        const seconds = Number(body["length"] ?? 0) / 1e9;
        const shape = typeof body["fade_shape"] === "string" ? body["fade_shape"] : "log";
        const results = { added: [], changed: [] };
        for (const pl of this.editPlaylists(base, body, true)) {
          const clips = clipsOf(pl).filter((c) => c.start < stop && c.stop > start).sort((a, b) => a.start - b.start);
          for (const [i, c] of clips.entries()) {
            const len = (from) => this.tickAfter(base, from, seconds) - from;
            const next = clips[i + 1];
            if (next && next.start === c.stop) {
              const half = Math.round(len(c.stop) / 2);
              this.putFade(c.path, "fade_out", next.uid, -half, half, shape, results);
              this.putFade(next.path, "fade_in", c.uid, -half, half, shape, results);
            } else this.putFade(c.path, "fade_out", void 0, -len(c.stop - 1), 0, shape, results);
            if (!this.fadeRows(c.path).some((r) => r.type === "fade_in")) this.putFade(c.path, "fade_in", void 0, 0, len(c.start), shape, results);
          }
        }
        return null;
      }
      case "change_fade_curvature": {
        const uids = Array.isArray(body["fades"]) ? body["fades"].map(String) : [];
        if (!uids.length) throw new UAError("uasrv.missing_field", "change_fade_curvature: fades", { cmd: "post", path: `${ctx}/commands/change_fade_curvature` });
        const initial = Array.isArray(body["initial_curvature_values"]) ? body["initial_curvature_values"].map(Number) : [];
        for (const pl of this.children(`${base}/playlists`)) {
          for (const c of clipsOf(pl)) {
            for (const r of this.fadeRows(c.path)) {
              const i = uids.indexOf(r.uid);
              if (i < 0) continue;
              const path = `${c.path}/fades/${r.uid}`;
              if (body["default"] === true) {
                this.setValue(path, "fade_shape", "log");
                this.setValue(path, "fade_curvature", 0);
                continue;
              }
              if (typeof body["fade_shape"] === "string") this.setValue(path, "fade_shape", body["fade_shape"]);
              if (typeof body["fade_curvature"] === "number") this.setValue(path, "fade_curvature", Math.max(-1, Math.min(1, (initial[i] ?? 0) + body["fade_curvature"] - (initial[0] ?? 0))));
            }
          }
        }
        return null;
      }
      case "nudge": {
        if (body["nudge_settings"] === void 0) return null;
        const settings = JSON.parse(String(body["nudge_settings"]));
        const op = settings.operation ?? "";
        if (!op) throw new UAError("uasrv.invalid_type", "nudge: nudge_settings.operation", { cmd: "post", path: `${ctx}/commands/nudge` });
        if (!op.startsWith("content_") || settings.mode !== "samples") return null;
        const ns = (settings.samples ?? 0) * 1e9 / 48e3 * (op.startsWith("content_right") ? -1 : 1);
        const selStart = Number(this.value(ctx, "selection_start"));
        const selStop = Number(this.value(ctx, "selection_stop"));
        const tracks = this.value(ctx, "selection_tracks") ?? [];
        for (const t of tracks) {
          const pl = String(this.value(`${base}/tracks/${t}`, "playlist_uid"));
          for (const c of clipsOf(pl).filter((c2) => c2.start >= selStart && c2.stop <= selStop)) {
            if (c.sourceStart + ns < 0) continue;
            this.setValue(c.path, "source_start", Math.round(c.sourceStart + ns));
            this.setValue(c.path, "source_stop", Math.round(c.sourceStop + ns));
          }
        }
        return null;
      }
    }
    return null;
  }
  /** Seconds at `tick`, integrating the session's tempo map (constant tempo between events). */
  secondsAt(sessionPath, tick) {
    const beatTicks = 96e9;
    const tempos = this.children(`${sessionPath}/tempo_map`).map((id) => this.nodes.get(`${sessionPath}/tempo_map/${id}`).properties).map((p) => ({ tick: Number(p.get("tick") ?? 0), tempo: Number(p.get("tempo") ?? 120) })).sort((a, b) => a.tick - b.tick);
    if (tempos.length === 0) return tick / beatTicks * 0.5;
    let seconds = 0;
    let at = 0;
    let tempo = tempos[0].tempo;
    for (const t of tempos) {
      if (t.tick >= tick) break;
      if (t.tick > at) {
        seconds += (t.tick - at) / beatTicks * (60 / tempo);
        at = t.tick;
      }
      tempo = t.tempo;
    }
    return Math.max(0, seconds + (tick - at) / beatTicks * (60 / tempo));
  }
  /**
   * A MIDI clip's table (facts 39-41): apply `rows` and push the matching delta, exactly as
   * LUNA does — the stored property stays the whole table, so a `get` answers the table
   * while subscribers see only the delta.
   *
   * `added` and `changed` carry rows; `deleted` needs only their `rowid`s. Rows given
   * without a `rowid` get the next id free across the session's clips, as in LUNA. Ticks are table ticks.
   *
   * @example
   * engine.midiEdit(clipPath, 'added', [{ tick: 0, status: 0x90, data1: 60, data2: 100 }]);
   * engine.midiEdit(clipPath, 'deleted', [{ rowid: 1 }]);
   */
  midiEdit(clipPath, operation, rows) {
    const table = `${normalize(clipPath)}/midi/table`;
    if (!this.nodes.has(table)) this.addNode(table, { properties: { row_data: EMPTY_MIDI_TABLE() } });
    const stored = decodeMidiTable(this.value(table, "row_data"));
    const session = table.split("/").slice(0, 3).join("/");
    const used = [...this.nodes.keys()].filter((k) => k.startsWith(`${session}/`) && k.endsWith("/midi/table")).flatMap((k) => decodeMidiTable(this.value(k, "row_data")).map((r) => r.rowid));
    let next = used.length ? Math.max(...used) + 1 : 1;
    const applied = [];
    for (const row of rows) {
      const rowid = row.rowid ?? next++;
      if (operation === "deleted") {
        applied.push({ rowid, tick: 0, status: 0, data1: 0, data2: 0, enabled: true, sysex: null });
        continue;
      }
      const sysex = row.sysex ?? null;
      const merged = { rowid, tick: row.tick ?? 0, status: sysex ? 240 : row.status ?? 144, data1: sysex ? 0 : row.data1 ?? 60, data2: sysex ? 0 : row.data2 ?? 0, enabled: row.enabled ?? true, sysex: sysex ? [...sysex] : null };
      applied.push(merged);
    }
    const kept = operation === "deleted" ? stored.filter((r) => !applied.some((a) => a.rowid === r.rowid)) : [...stored.filter((r) => !applied.some((a) => a.rowid === r.rowid)), ...applied];
    const node = this.nodes.get(table);
    node?.properties.set("row_data", encodeMidiTable("update", kept));
    this.push({ path: `${table}/row_data/value`, data: operation === "deleted" ? { operation, row_ids: applied.map((r) => r.rowid) } : encodeMidiTable(operation, applied) }, void 0);
  }
  /**
   * Drive a render to a terminal state, the way LUNA's engine would (fact 44). With
   * `percent` only, it reports progress without finishing.
   *
   * @example
   * engine.finishRender(uid, { percent: 50 });
   * engine.finishRender(uid, { state: 'completed' });
   */
  finishRender(uid, options = {}) {
    const path = `/renders/${uid}`;
    if (!this.has(path)) throw new Error(`MockEngine: no render ${uid}`);
    if (options.percent !== void 0) this.setValue(path, "percent_complete", options.percent);
    if (options.error !== void 0) this.setValue(path, "error_message", options.error);
    if (options.state) {
      if (options.state === "completed") this.setValue(path, "percent_complete", 100);
      this.setValue(path, "state", options.state);
    }
    if (options.remove) this.removeNode(path);
  }
  /** @internal The rows of a clip's MIDI table, decoded. */
  midiRows(clipPath) {
    return decodeMidiTable(this.value(`${normalize(clipPath)}/midi/table`, "row_data"));
  }
  /**
   * @internal The rows `selection_notes` names, per clip. The selection holds
   * `[pitch, start, stop, rowid]` in absolute ticks, so rows are matched by rowid and the
   * note-off that terminates each one is included.
   */
  selectedRows(sessionBase) {
    const out = /* @__PURE__ */ new Map();
    const selection = this.value(`${sessionBase}/contexts/main`, "selection_notes");
    if (!Array.isArray(selection)) return out;
    for (const entry of selection) {
      const playlist = entry?.playlist_uid;
      if (!playlist || !Array.isArray(entry.notes)) continue;
      const rowids = new Set(entry.notes.map((n) => n[3]).filter((v) => typeof v === "number"));
      for (const clipUid of this.children(`${sessionBase}/playlists/${playlist}/clips`)) {
        const clip = `${sessionBase}/playlists/${playlist}/clips/${clipUid}`;
        const rows = this.midiRows(clip);
        const picked = [];
        for (const row of rows) {
          if (!rowids.has(row.rowid)) continue;
          picked.push({ ...row, noteOn: true });
          const off = rows.find((r) => r.tick >= row.tick && r.rowid !== row.rowid && r.data1 === row.data1 && ((r.status & 240) === 128 || (r.status & 240) === 144 && r.data2 === 0) && (r.status & 15) === (row.status & 15));
          if (off && !picked.some((p) => p.rowid === off.rowid)) picked.push({ ...off, noteOn: false });
        }
        if (picked.length) out.set(clip, picked);
      }
    }
    return out;
  }
  /** @internal The path of a clip by uid, across every playlist of a session. */
  findClip(sessionBase, clipUid) {
    for (const pl of this.children(`${sessionBase}/playlists`)) {
      const path = `${sessionBase}/playlists/${pl}/clips/${clipUid}`;
      if (this.has(path)) return path;
    }
    return void 0;
  }
  /** Read a property directly (no port involved). */
  value(nodePath, property) {
    return this.nodes.get(normalize(nodePath))?.properties.get(property);
  }
  has(path) {
    return this.nodes.has(normalize(path));
  }
  /** @internal Every property of a node, copied (no port involved). */
  properties(nodePath) {
    return Object.fromEntries(this.nodes.get(normalize(nodePath))?.properties ?? []);
  }
  children(nodePath) {
    return [...this.nodes.get(normalize(nodePath))?.children ?? []];
  }
  /** Names of a node's properties. */
  propertyNames(nodePath) {
    return [...this.nodes.get(normalize(nodePath))?.properties.keys() ?? []];
  }
  /** @internal Uploads between `begin` and `end` (fact 42). */
  imports = /* @__PURE__ */ new Map();
  /** @internal Uploaded content (package and base64) to the source it was filed as, for fact 42's de-duplication. */
  uploaded = /* @__PURE__ */ new Map();
  recommenders = /* @__PURE__ */ new Map();
  /**
   * Replace the handler of the command at `path` (for example
   * `/sessions/abc/set_marker`), to reproduce a verb that answers without acting (fact 71).
   *
   * @example
   * engine.overrideCommand('/sessions/abc/delete_clip', () => null);
   */
  overrideCommand(path, handler) {
    const { node: nodePath, name } = splitPath(normalize(path));
    const node = this.nodes.get(nodePath);
    if (!node || !node.commands.has(name)) throw new UAError("uasrv.invalid_object", `overrideCommand: no command at ${path}`, { path });
    node.commands.set(name, handler);
  }
  /** Make the next `times` requests on `path` fail with `code`. */
  fail(path, code, times = 1) {
    this.faults.set(normalize(path), { code, remaining: times });
  }
  /**
   * Convenience: a session shaped like LUNA's, with a transport, a master bus, named tracks
   * (each with `outputs/main/controls/{gain,pan,mute}`, `controls/solo`, a meter and one
   * playlist), and the session-level commands the SDK uses.
   */
  addSession(uid, options = {}) {
    const base = `/sessions/${uid}`;
    const pkg = options.packageUid ?? `pkg_${uid}`;
    const sessionCommands = {
      new_track: (data, engine) => {
        const body = data ?? {};
        if (body.preset_uid !== void 0) return engine.newTrackFromPreset(uid, body.preset_uid, body.name, body.stem_format);
        if (body.folder_uid && !engine.isFolder(uid, body.folder_uid)) throw new UAError("device.database_error", "new_track: folder_uid is not a folder", { cmd: "post", path: `${base}/new_track` });
        if (body.track_type === "bus") {
          const id = `bus${engine.children(`${base}/buses`).length + 1}`;
          engine.addBus(uid, id, { name: body.name ?? "Bus", busType: "aux", stemFormat: body.stem_format ?? "stereo" });
          if (body.folder_mode && body.folder_mode !== "none") {
            engine.setValue(`${base}/buses/${id}`, "folder_mode", body.folder_mode);
            engine.rerouteFolderSubtree(uid, [id]);
          }
          if (body.folder_uid) engine.moveToFolder(uid, [id], body.folder_uid);
          return { uid: id };
        }
        const count = Math.max(1, Number(body.count ?? 1));
        const made = [];
        for (let i = 0; i < count; i++) {
          const id = `t${engine.children(`${base}/tracks`).length + 1}`;
          engine.addTrack(uid, id, { name: body.name ?? "Untitled", trackType: body.track_type ?? "audio", stemFormat: body.stem_format ?? "mono" });
          made.push({ uid: id });
        }
        if (body.folder_uid) engine.moveToFolder(uid, made.map((m) => m.uid), body.folder_uid);
        return count === 1 ? made[0] : made;
      },
      delete_tracks: (data, engine) => {
        const body = data ?? {};
        const ids = Array.isArray(body.track_uid) ? body.track_uid : body.track_uid ? [body.track_uid] : [];
        for (const id of ids) {
          if (engine.has(`${base}/buses/${id}`)) {
            engine.removeNode(`${base}/buses/${id}`);
            engine.danglingAssignments(uid, id);
          } else engine.removeNode(`${base}/tracks/${id}`);
        }
        engine.renumber(uid);
        return { deleted_channels: ids };
      },
      duplicate_tracks: (data, engine) => {
        const body = data ?? {};
        const out = [];
        for (const id of body.track_uid ?? []) {
          const copy = `${id}_copy`;
          engine.addTrack(uid, copy, { name: `${String(engine.value(`${base}/tracks/${id}`, "name"))} copy` });
          out.push(copy);
        }
        return { duplicated_channels: out.map((id) => ({ channel_id: id })) };
      },
      begin_transaction: (_d, engine) => {
        engine.transactions.push("begin");
        return null;
      },
      commit_transaction: (_d, engine) => {
        engine.transactions.push("commit");
        return null;
      },
      abort_transaction: (_d, engine) => {
        engine.transactions.push("abort");
        return null;
      },
      undo: () => ({ did_undo: true }),
      redo: () => ({ did_redo: true }),
      save_session: () => null,
      // While playing, 'now' restarts from the play start; next_bar and loop_end defer, and
      // stopped it does nothing (fact 90). The mock applies 'now' only.
      sync_playback: (data, engine) => {
        const body = data ?? {};
        const path = `/sessions/${body.session_uid}`;
        if (engine.value(path, "playing") === true && !body.next_bar && !body.loop_end) engine.setValue(path, "location", engine.locationAt(path, Number(engine.value(path, "play_start") ?? 0)));
        return null;
      },
      import_files: () => null,
      export_session: (data, engine) => {
        const body = data ?? {};
        const uid2 = `export_${engine.children("/renders").length + 1}`;
        const name = body.bounce_name ?? "Export";
        engine.addNode(`/renders/${uid2}`, {
          properties: {
            uid: uid2,
            name,
            type: "export",
            session_uid: body.session_uid ?? "",
            state: "running",
            percent_complete: 0,
            error_message: null,
            render_is_offline: body.realtime !== true,
            time_remaining: body.realtime === true ? 0 : void 0,
            total_samples: 0
          }
        });
        return { render_uid: uid2, file: `/exports/${name} - MAIN.wav` };
      },
      insert_clip: (data, engine) => {
        const body = data ?? {};
        const playlist = body.playlist_uid ?? (body.track_uid ? String(engine.value(`${base}/tracks/${body.track_uid}`, "playlist_uid")) : void 0);
        if (!playlist) throw new UAError("uasrv.invalid_object", "insert_clip: no playlist", { cmd: "post", path: `${base}/insert_clip` });
        if (!body.source_uid) throw new UAError("uasrv.invalid_property", "insert_clip: source_uid is required", { cmd: "post", path: `${base}/insert_clip` });
        const start = body.start ?? 0;
        const stop = body.stop ?? 0;
        const copyPath = body.clip_uid ? engine.findClip(base, body.clip_uid) : void 0;
        if (body.clip_uid && !copyPath) throw new UAError("device.database_error", "insert_clip: no clip to copy", { cmd: "post", path: `${base}/insert_clip` });
        const copied = copyPath ? { ...engine.properties(copyPath) } : {};
        let layer = body.layer;
        if (layer === void 0) {
          const clipsPath = `${base}/playlists/${playlist}/clips`;
          const overlapping = engine.children(clipsPath).map((c) => `${clipsPath}/${c}`).filter((c) => Number(engine.value(c, "start")) < stop && Number(engine.value(c, "stop")) > start);
          layer = overlapping.length ? Math.max(...overlapping.map((c) => Number(engine.value(c, "layer") ?? 0))) + 1 : 0;
        }
        const clipType = copyPath ? Number(copied["clip_type"] ?? 0) : body.clip_type ?? 0;
        const id = engine.nextClipId(base, playlist);
        engine.addNode(`${base}/playlists/${playlist}/clips/${id}`, {
          properties: {
            gain: 0,
            bypass: false,
            mute: false,
            ...copied,
            uid: id,
            name: body.name ?? (copyPath ? "" : "Clip"),
            start,
            stop,
            layer,
            source_uid: copyPath ? copied["source_uid"] : body.source_uid,
            source_start: body.source_start ?? 0,
            source_stop: body.source_stop ?? 0,
            clip_type: clipType,
            midi_source_start: 0,
            ...body.length_follows === "ticks" || body.length_follows === "time" ? { length_follows: body.length_follows } : {},
            ...body.alg_type !== void 0 ? { alg_type: body.alg_type } : {}
          }
        });
        if (clipType === 2) {
          const rows = copyPath && engine.has(`${copyPath}/midi/table`) ? structuredClone(engine.value(`${copyPath}/midi/table`, "row_data")) : EMPTY_MIDI_TABLE();
          engine.addNode(`${base}/playlists/${playlist}/clips/${id}/midi/table`, { properties: { row_data: rows } });
        }
        return { uid: id };
      },
      delete_clip: (data, engine) => {
        const body = data ?? {};
        for (const pl of engine.children(`${base}/playlists`)) {
          if (engine.has(`${base}/playlists/${pl}/clips/${body.uid}`)) engine.removeNode(`${base}/playlists/${pl}/clips/${body.uid}`);
        }
        return null;
      },
      bring_to_front: () => null,
      send_to_back: () => null,
      new_playlists: (data, engine) => {
        const body = data ?? {};
        for (const t of body.track_uid ?? []) {
          const n = engine.children(`${base}/playlists`).filter((p) => engine.value(`${base}/playlists/${p}`, "track_uid") === t).length + 1;
          engine.addNode(`${base}/playlists/pl_${t}_${n}`, { properties: { uid: `pl_${t}_${n}`, name: `V${n}`, track_uid: t, version: n, stem_format: "mono", frozen: false, enable_compiled_clips: false } });
          engine.addNode(`${base}/playlists/pl_${t}_${n}/clips`);
        }
        return null;
      },
      set_playlists: () => null,
      set_inserts: (data, engine) => {
        const body = data ?? {};
        const channel = engine.has(`${base}/tracks/${body.channel_uid}`) ? `${base}/tracks/${body.channel_uid}` : `${base}/buses/${body.channel_uid}`;
        for (const ins of body.inserts ?? []) {
          const slot = ins.insert_type ?? `effect_${ins.index ?? 0}`;
          const path = `${channel}/effects/${slot}`;
          if (!engine.has(path)) throw new UAError("uasrv.invalid_object", `set_inserts: no slot ${slot}`, { cmd: "post", path: `${base}/set_inserts` });
          const empty = !ins.plugin_id;
          const known = !empty && engine.has(`/plugins/${ins.plugin_id}`);
          if (empty || engine.value(path, "plugin_id") !== ins.plugin_id) {
            engine.setValue(path, "plugin_power", true);
            engine.setValue(path, "preset_name", null);
            engine.setValue(path, "preset_uid", null);
          }
          engine.setValue(path, "plugin_id", empty ? null : ins.plugin_id);
          engine.setValue(path, "plugin_name", null);
          if (!empty && ins.preset_name !== void 0) engine.setValue(path, "preset_name", ins.preset_name);
          if (!empty && ins.preset_uid !== void 0) {
            engine.setValue(path, "preset_uid", ins.preset_uid);
            const preset = `/presets/plugins/${ins.plugin_id}/presets/${ins.preset_uid}`;
            if (engine.has(preset)) engine.setValue(path, "preset_name", engine.value(preset, "preset_name"));
          }
          engine.setValue(path, "plugin_error", empty || known ? null : "mixer.missing_plug-in");
          engine.setValue(path, "external_sdk_instance_id", known ? engine.nextRow() : null);
          if (empty || !known) {
            engine.setValue(path, "bypass_control", null);
            for (const c of engine.children(`${path}/controls`)) {
              engine.setValue(`${path}/controls/${c}`, "initialized", null);
              engine.setValue(`${path}/controls/${c}`, "normalized_value", null);
            }
          } else {
            engine.setValue(path, "bypass_control", "bypass");
            engine.setValue(path, "bypass_control_active_low", false);
            engine.addControl(`${path}/controls/bypass`, "parameter", { discrete: true, value: 0, real: false, str: "in", automatable: true });
            engine.addControl(`${path}/controls/input`, "parameter", { discrete: false, value: 0.5, real: 0, str: "0.0", automatable: true, normalized: 0.5 });
          }
        }
        return null;
      },
      set_tempo: (data, engine) => {
        const body = data ?? {};
        const tick = body.tick ?? 0;
        const existing = engine.children(`${base}/tempo_map`).find((id) => engine.value(`${base}/tempo_map/${id}`, "tick") === tick);
        if (existing) engine.setValue(`${base}/tempo_map/${existing}`, "tempo", body.tempo ?? 120);
        else engine.addNode(`${base}/tempo_map/${engine.children(`${base}/tempo_map`).length + 1}`, { properties: { tick, time: 0, tempo: body.tempo ?? 120 } });
        return { tempo: body.tempo, position_ticks: tick };
      },
      delete_tempo: (data, engine) => {
        const body = data ?? {};
        for (const id of engine.children(`${base}/tempo_map`)) if (engine.value(`${base}/tempo_map/${id}`, "tick") === body.tick && body.tick !== 0) engine.removeNode(`${base}/tempo_map/${id}`);
        return null;
      },
      set_time_signature: (data, engine) => {
        const body = data ?? {};
        const id = engine.children(`${base}/time_signatures`).length + 1;
        engine.addNode(`${base}/time_signatures/${id}`, { properties: { tick: 0, bar: body.bar ?? 1, partial: false, numerator: body.numerator ?? 4, denominator: body.denominator ?? 4 } });
        return null;
      },
      /** One key signature per tick: setting one where a row already sits rewrites that row (fact 113). */
      set_key_signature: (data, engine) => {
        const body = data ?? {};
        if (typeof body.tick !== "number" || typeof body.sharps_and_flats !== "number" || typeof body.is_minor !== "boolean") {
          throw new UAError("uasrv.invalid_property", "set_key_signature: tick, sharps_and_flats and is_minor are required", { cmd: "post", path: `${base}/set_key_signature` });
        }
        const existing = engine.children(`${base}/key_signatures`).find((row) => engine.value(`${base}/key_signatures/${row}`, "tick") === body.tick);
        if (existing !== void 0) {
          engine.setValue(`${base}/key_signatures/${existing}`, "sharps_and_flats", body.sharps_and_flats);
          engine.setValue(`${base}/key_signatures/${existing}`, "is_minor", body.is_minor);
          return null;
        }
        const rowid = engine.nextRow();
        engine.addNode(`${base}/key_signatures/${rowid}`, { properties: { rowid, tick: body.tick, sharps_and_flats: body.sharps_and_flats, is_minor: body.is_minor } });
        return null;
      },
      set_automode_on_tracks: (data, engine) => {
        const body = data ?? {};
        const names = ["off", "read", "write", "touch", "latch"];
        for (const t of body.tracks ?? []) if (engine.has(`${base}/tracks/${t}`)) engine.setValue(`${base}/tracks/${t}`, "automation_mode", names[body.automation_mode ?? 1] ?? "read");
        return null;
      },
      insert_bp: (data, engine) => {
        const body = data ?? {};
        const ctl = engine.controlPathByUid(body.control_uid ?? "");
        if (!ctl) throw new UAError("uasrv.invalid_object", "insert_bp: unknown control", { cmd: "post", path: `${base}/insert_bp` });
        if (body.start !== void 0 && body.stop !== void 0) {
          for (const id of engine.children(`${ctl}/automation`)) {
            const t = Number(engine.value(`${ctl}/automation/${id}`, "start"));
            if (t >= body.start && t <= body.stop) engine.removeNode(`${ctl}/automation/${id}`);
          }
        }
        for (const v of body.values ?? []) engine.addNode(`${ctl}/automation/${engine.nextRow()}`, { properties: { start: v.location, value: wireFloat(v.value) } });
        return null;
      },
      delete_bp: (data, engine) => {
        const body = data ?? {};
        const ctl = engine.controlPathByUid(body.control_uid ?? "");
        if (!ctl) return null;
        for (const id of engine.children(`${ctl}/automation`)) {
          const t = Number(engine.value(`${ctl}/automation/${id}`, "start"));
          if (t === body.start || body.stop !== void 0 && t >= (body.start ?? 0) && t <= body.stop) engine.removeNode(`${ctl}/automation/${id}`);
        }
        return null;
      },
      move_bp: (data, engine) => {
        const body = data ?? {};
        const ctl = engine.controlPathByUid(body.control_uid ?? "");
        if (!ctl) return null;
        for (const id of engine.children(`${ctl}/automation`)) {
          const path = `${ctl}/automation/${id}`;
          if (Number(engine.value(path, "start")) === body.location) {
            engine.setValue(path, "start", body.new_location ?? body.location);
            break;
          }
        }
        return null;
      },
      trim_bp: (data, engine) => {
        const body = data ?? {};
        const ctl = engine.controlPathByUid(body.control_uid ?? "");
        if (!ctl) return null;
        for (const id of engine.children(`${ctl}/automation`)) {
          const path = `${ctl}/automation/${id}`;
          if (Number(engine.value(path, "start")) === body.location) {
            engine.setValue(path, "value", wireFloat(body.value));
            break;
          }
        }
        return null;
      },
      /**
       * Routing, as measured (facts 43, 83): LUNA **appends**; each destination is a row of the
       * output's `assignments` (`value` is the bus uid) and an `assignment_objects/<uid>` node,
       * whose uid is the handle for deletion. The output's own `bus_uid` stays null.
       */
      new_output_assignment: (data, engine) => {
        const body = data ?? {};
        const cmdPath = `${base}/new_output_assignment`;
        const channel = body.track_uid !== void 0 ? `${base}/tracks/${body.track_uid}` : `${base}/buses/${body.bus_src_uid}`;
        const outputType = body.output_type ?? "main";
        const bus = `${base}/buses/${body.bus_uid}`;
        if (body.bus_src_uid !== void 0 && String(engine.value(channel, "bus_type") ?? "").startsWith("cue_")) {
          throw new UAError("device.database_error", "new_output_assignment: a cue bus cannot be a source", { cmd: "post", path: cmdPath });
        }
        if (!engine.has(channel) || !engine.has(bus) || outputType.startsWith("cue_") || !engine.has(`${channel}/outputs/${outputType}`)) {
          throw new UAError("uasrv.invalid_type", "new_output_assignment: uasrv.invalid_type", { cmd: "post", path: cmdPath });
        }
        return { uid: engine.addAssignment(`${channel}/outputs/${outputType}`, String(body.bus_uid), bus) };
      },
      delete_output_assignment: (data, engine) => {
        const body = data ?? {};
        const cmdPath = `${base}/delete_output_assignment`;
        const target = String(body.uid ?? "");
        for (const kind of ["tracks", "buses"]) {
          for (const ch of engine.children(`${base}/${kind}`)) {
            if (ch === target) throw new UAError("device.database_error", "delete_output_assignment: a channel uid is not an assignment", { cmd: "post", path: cmdPath });
            for (const out of engine.children(`${base}/${kind}/${ch}/outputs`)) {
              const output = `${base}/${kind}/${ch}/outputs/${out}`;
              if (engine.children(`${output}/assignment_objects`).includes(target)) {
                engine.removeAssignment(output, target);
                return null;
              }
            }
          }
        }
        throw new UAError("uasrv.invalid_type", "delete_output_assignment: uasrv.invalid_type", { cmd: "post", path: cmdPath });
      },
      /** Moves the routing under new assignment uids and copies the slot's control values; the source keeps its values (fact 83). */
      move_send: (data, engine) => {
        const body = data ?? {};
        const find = (channelUid, out) => {
          for (const kind of ["tracks", "buses"]) {
            const path = `${base}/${kind}/${channelUid}/outputs/${out}`;
            if (engine.has(path)) return path;
          }
          return void 0;
        };
        const from = find(body.source_uid ?? "", body.source ?? "");
        const to = find(body.destination_uid ?? "", body.destination ?? "");
        if (!from || !to) throw new UAError("uasrv.invalid_object", "move_send: no such send", { cmd: "post", path: `${base}/move_send` });
        const rows = engine.value(from, "assignments") ?? [];
        for (const row of rows) if (row.value) engine.addAssignment(to, row.value, `${base}/buses/${row.value}`);
        for (const name of engine.children(`${from}/controls`)) {
          if (engine.has(`${to}/controls/${name}`)) for (const prop of ["value", "real_value", "normalized_value", "string_value"]) engine.setValue(`${to}/controls/${name}`, prop, engine.value(`${from}/controls/${name}`, prop));
        }
        if (body.copy !== true) for (const uid2 of [...engine.children(`${from}/assignment_objects`)]) engine.removeAssignment(from, uid2);
        return null;
      },
      add_midi: (data, engine) => {
        const body = data ?? {};
        for (const [clipUid, rows] of groupByClip(body.midi ?? [])) {
          const path = engine.findClip(base, clipUid);
          if (!path) continue;
          engine.midiEdit(
            path,
            "added",
            rows.map((r) => ({ tick: r.tick ?? 0, status: r.byte_0 ?? 144, data1: r.byte_1 ?? 60, data2: r.byte_2 ?? 0 }))
          );
        }
        return null;
      },
      move_clips: (data, engine) => engine.clipEdit(base, "move_clips", data),
      get_clip_info: (data, engine) => {
        const uid2 = String(data?.clip_uid ?? "");
        if (!engine.findClip(base, uid2)) throw new UAError("uasrv.invalid_object", "get_clip_info: no such clip", { cmd: "post", path: `${base}/get_clip_info` });
        const clipPath = engine.findClip(base, uid2);
        const playlistUid = clipPath.split("/")[4] ?? "";
        return { sample_rate: 48e3, compiled_clips: [], playlist_uid: playlistUid, track_uid: String(engine.value(`${base}/playlists/${playlistUid}`, "track_uid") ?? "") };
      },
      set_bar_one: () => null,
      set_marker: (data, engine) => {
        const body = data ?? {};
        if (body.rowid !== void 0 && !engine.has(`${base}/markers/${body.rowid}`)) return null;
        const id = body.rowid ?? engine.nextRow();
        const path = `${base}/markers/${id}`;
        if (engine.has(path)) {
          if (body.name !== void 0) engine.setValue(path, "name", body.name);
          if (body.location !== void 0) engine.setValue(path, "location", body.location);
          if (body.color !== void 0) engine.setValue(path, "color", body.color);
          if (body.comments !== void 0) engine.setValue(path, "comments", body.comments);
        } else {
          engine.addNode(path, { properties: { rowid: id, location: body.location ?? 0, name: body.name ?? "Marker", color: body.color ?? 0, comments: body.comments ?? "" } });
        }
        return { rowid: id };
      },
      delete_marker: (data, engine) => {
        const body = data ?? {};
        engine.removeNode(`${base}/markers/${body.rowid}`);
        return null;
      },
      set_chord: (data, engine) => {
        const body = data ?? {};
        if (body.rowid !== void 0) {
          const path = `${base}/chords/${body.rowid}`;
          if (!engine.has(path)) throw new UAError("device.database_error", "set_chord: no such rowid", { cmd: "post", path: `${base}/set_chord` });
          if (body.location !== void 0) {
            const occupant = engine.chordAt(uid, body.location);
            if (occupant !== void 0) engine.removeNode(`${base}/chords/${occupant}`);
            if (engine.has(path)) engine.setValue(path, "location", body.location);
          }
          if (body.name) engine.setValue(path, "name", normalizeChordName(body.name));
          return null;
        }
        if (body.location === void 0) throw new UAError("uasrv.missing_field", "set_chord: location is required to add a chord", { cmd: "post", path: `${base}/set_chord` });
        engine.addChord(uid, body.location, body.name ?? "");
        return null;
      },
      delete_chord: (data, engine) => {
        const body = data ?? {};
        const rows = body.all === true ? engine.children(`${base}/chords`) : body.rowid !== void 0 ? [String(body.rowid)] : body.location !== void 0 ? [engine.chordAt(uid, body.location)].filter((r) => r !== void 0) : void 0;
        if (!rows) throw new UAError("uasrv.missing_field", "delete_chord: rowid, location or all is required", { cmd: "post", path: `${base}/delete_chord` });
        for (const row of rows) engine.removeNode(`${base}/chords/${row}`);
        return null;
      }
    };
    this.addNode(base, {
      properties: {
        uid,
        name: options.name ?? uid,
        loaded: true,
        read_only: false,
        session_package_uid: pkg,
        session_package_path: `/tmp/${uid}.luna`,
        can_undo: false,
        can_redo: false,
        change_count: 0,
        solo_mode: "latch",
        tempo_established: false,
        command_status: null,
        command_percent_complete: 0,
        playing: false,
        record_enabled: false,
        looping: false,
        play_start: 0,
        loop_start: 0,
        arrangement_start: 0,
        arrangement_end: -1,
        loop_stop: 0,
        location: { tick: 0, bar_beat: { bar: 1, beat: 1, tick: 0 }, min_sec: { minutes: 0, seconds: 0 }, tempo: 120, time_signature: { numerator: 4, denominator: 4 }, playing: false },
        counting_in: false,
        punched_in: false,
        max_tick: 0,
        tempo_percent: 100,
        rec_play_mode: "normal",
        count_in_enabled: false,
        pre_roll_enabled: false,
        post_roll_enabled: false
      },
      readOnly: ["uid", "loaded", "session_package_uid", "can_undo", "can_redo", "change_count", "location"],
      commands: sessionCommands
    });
    this.addNode(`${base}/tracks`);
    this.addNode(`${base}/playlists`);
    this.addNode(`${base}/buses`);
    this.addNode(`${base}/contexts/main`, {
      properties: { context_type: "main", focus: "tracks", selection_start: null, selection_stop: null, selection_tracks: null, selection_playlists: null, selection_notes: null, last_selected_track: null, pixels_per_tick: 1e-10, grid_enable: true, grid: "1_4", settings: "{}" }
    });
    this.addNode(`${base}/contexts/main/commands`, {
      commands: {
        set_inserts_in_out: (data, engine) => {
          const body = data ?? {};
          const channel = engine.has(`${base}/tracks/${body.channel_uid}`) ? `${base}/tracks/${body.channel_uid}` : `${base}/buses/${body.channel_uid}`;
          for (const slot of body.inserts ?? []) {
            const ctl = engine.value(`${channel}/effects/${slot}`, "bypass_control");
            if (typeof ctl !== "string" || !ctl) continue;
            const on = body.value !== false;
            const raw = engine.value(`${channel}/effects/${slot}`, "bypass_control_active_low") === true === on ? 1 : 0;
            const control = `${channel}/effects/${slot}/controls/${ctl}`;
            engine.setValue(control, "value", raw);
            engine.setValue(control, "normalized_value", raw);
            engine.setValue(control, "real_value", raw === 1);
            engine.setValue(control, "string_value", on ? "in" : "bypassed");
          }
          return null;
        },
        /** A command of the edit context, not of the session. */
        trim_clip: (data, engine) => {
          const body = data ?? {};
          const path = engine.findClip(base, body.clip_uid ?? "");
          if (!path) return null;
          if (body.start !== void 0) engine.setValue(path, "start", body.start);
          if (body.stop !== void 0) engine.setValue(path, "stop", body.stop);
          return null;
        },
        /** Widens the range to the clips on the selected playlists, keeping them (fact 150). */
        select_all: (_d, engine) => {
          const ctx = `${base}/contexts/main`;
          const pls = engine.editPlaylists(base, {});
          const clips = pls.flatMap((pl) => engine.children(`${base}/playlists/${pl}/clips`).map((c) => `${base}/playlists/${pl}/clips/${c}`));
          if (!clips.length) return null;
          engine.setValue(ctx, "selection_start", Math.min(...clips.map((c) => Number(engine.value(c, "start")))));
          engine.setValue(ctx, "selection_stop", Math.max(...clips.map((c) => Number(engine.value(c, "stop")))));
          return null;
        },
        // With focus `timeline`, these act on the clips in the selected range of the selected
        // tracks (fact 150).
        copy: (_d, engine) => engine.timelineEdit(base, "copy"),
        cut: (_d, engine) => engine.timelineEdit(base, "cut"),
        paste: (_d, engine) => engine.timelineEdit(base, "paste"),
        duplicate: (_d, engine) => engine.timelineEdit(base, "duplicate"),
        /**
         * With focus `notes`, acts on `selection_notes`, not on a clip (fact 74): deletes the
         * selected note-on rows and the note-offs that terminate them. With focus `timeline`,
         * clears the selected range of the selected tracks (fact 150).
         */
        clear: (_d, engine) => {
          if (engine.value(`${base}/contexts/main`, "focus") === "timeline") return engine.timelineEdit(base, "clear");
          for (const [clip, rows] of engine.selectedRows(base)) engine.midiEdit(clip, "deleted", rows.map((r) => ({ rowid: r.rowid })));
          return null;
        },
        /** A toggle over the selection (fact 74): flips `enabled` on each selected note-on row. */
        mute_notes: (_d, engine) => {
          for (const [clip, rows] of engine.selectedRows(base)) {
            engine.midiEdit(
              clip,
              "changed",
              rows.filter((r) => r.noteOn).map((r) => ({ rowid: r.rowid, tick: r.tick, status: r.status, data1: r.data1, data2: r.data2, enabled: !r.enabled }))
            );
          }
          return null;
        },
        /**
         * Writes notes onto a playlist, as deviced's `Edit_CreateNote` does (fact 111): ticks
         * are session ticks; each note goes into the clip under its note-on, else into one new
         * MIDI clip spanning the bars the notes cover. Then LUNA **selects** what it made,
         * which is where the caller reads the new row ids from (fact 74). No channel field:
         * every note is on channel 0.
         */
        create_note: (data, engine) => {
          const body = data ?? {};
          const playlist = body.playlist_uid;
          if (!playlist || !engine.has(`${base}/playlists/${playlist}`)) throw new UAError("uasrv.invalid_object", "create_note: no such playlist", { cmd: "post", path: `${base}/create_note` });
          const notes = body.notes ?? (body.note !== void 0 ? [{ note: body.note, start: body.start, stop: body.stop, velocity: body.velocity }] : []);
          if (!notes.length) return null;
          const clipsPath = `${base}/playlists/${playlist}/clips`;
          const clips = () => engine.children(clipsPath).map((uid2) => ({ uid: uid2, start: Number(engine.value(`${clipsPath}/${uid2}`, "start") ?? 0), stop: Number(engine.value(`${clipsPath}/${uid2}`, "stop") ?? 0) })).sort((a, b) => a.start - b.start);
          const firstClip = (from, to) => clips().find((c) => from === to ? from >= c.start && from < c.stop : c.start < to && c.stop > from);
          const span = { start: Math.min(...notes.map((n) => n.start ?? 0)), stop: Math.max(...notes.map((n) => n.stop ?? 0)) };
          const onsets = { start: Math.min(...notes.map((n) => n.start ?? 0)), stop: Math.max(...notes.map((n) => n.start ?? 0)) };
          let clipUid = firstClip(onsets.start, onsets.stop)?.uid;
          if (!clipUid) {
            let start = engine.barLines(base, span.start).floor;
            let stop = engine.barLines(base, span.stop).ceil;
            for (const c of clips()) {
              if (c.start < span.start && c.stop > start) start = Math.max(start, c.stop);
              if (c.start < stop && c.stop > span.stop) stop = Math.min(stop, c.start);
            }
            const trackUid = String(engine.value(`${base}/playlists/${playlist}`, "track_uid") ?? "");
            const name = engine.value(`${base}/tracks/${trackUid}`, "name");
            clipUid = engine.addMidiClipToPlaylist(base, playlist, { startTick: start, stopTick: stop, name: typeof name === "string" ? name : "MIDI", midiSourceStart: start });
          }
          const offsetOf = (uid2) => Number(engine.value(`${clipsPath}/${uid2}`, "midi_source_start") ?? 0) - Number(engine.value(`${clipsPath}/${uid2}`, "start") ?? 0);
          let offset = offsetOf(clipUid);
          const selected = [];
          for (const n of notes) {
            const start = n.start ?? 0;
            const stop = n.stop ?? 0;
            const hit = firstClip(start, start);
            if (hit) {
              clipUid = hit.uid;
              offset = offsetOf(clipUid);
            }
            const clipPath = `${clipsPath}/${clipUid}`;
            const before = new Set(engine.midiRows(clipPath).map((r) => r.rowid));
            engine.midiEdit(clipPath, "added", [
              { tick: start + offset, status: 144, data1: n.note ?? 60, data2: n.velocity_on ?? n.velocity ?? 100 },
              { tick: stop + offset, status: 128, data1: n.note ?? 60, data2: n.velocity_off ?? n.velocity ?? 100 }
            ]);
            const on = engine.midiRows(clipPath).find((r) => !before.has(r.rowid) && (r.status & 240) === 144);
            if (on) selected.push([on.data1, start, stop, on.rowid]);
          }
          engine.setValue(`${base}/contexts/main`, "focus", "notes");
          engine.setValue(`${base}/contexts/main`, "selection_playlists", [playlist]);
          engine.setValue(`${base}/contexts/main`, "selection_start", span.start);
          engine.setValue(`${base}/contexts/main`, "selection_stop", span.stop);
          engine.setValue(`${base}/contexts/main`, "selection_notes", [{ playlist_uid: playlist, notes: selected }]);
          return null;
        },
        /** Addresses rows by rowid, unlike the other two (fact 74). */
        change_velocity: (data, engine) => {
          const body = data ?? {};
          const wanted = /* @__PURE__ */ new Map();
          for (const n of body.notes ?? []) if (typeof n.rowid === "number") wanted.set(n.rowid, n.velocity ?? 0);
          for (const pl of engine.children(`${base}/playlists`)) {
            for (const clipUid of engine.children(`${base}/playlists/${pl}/clips`)) {
              const clip = `${base}/playlists/${pl}/clips/${clipUid}`;
              const rows = engine.midiRows(clip).filter((r) => wanted.has(r.rowid));
              if (rows.length) engine.midiEdit(clip, "changed", rows.map((r) => ({ ...r, data2: wanted.get(r.rowid) })));
            }
          }
          return null;
        },
        /**
         * Moves rows other than notes by `offset` ticks, by row id across the session's clips
         * (fact 141). Refuses note rows, unknown rows and a move below tick 0, before changing
         * any; nothing happens for no rows or offset 0.
         */
        move_midi_events: (data, engine) => {
          const body = data ?? {};
          const path = `${base}/contexts/main/commands/move_midi_events`;
          if (!Array.isArray(body.row_ids) || typeof body.offset !== "number") throw new UAError("uasrv.missing_field", "move_midi_events: row_ids and offset are required", { cmd: "post", path });
          const offset = body.offset;
          const wanted = new Set(body.row_ids);
          const byClip = /* @__PURE__ */ new Map();
          const found = /* @__PURE__ */ new Set();
          for (const pl of engine.children(`${base}/playlists`)) {
            for (const clipUid of engine.children(`${base}/playlists/${pl}/clips`)) {
              const clip = `${base}/playlists/${pl}/clips/${clipUid}`;
              const rows = engine.midiRows(clip).filter((r) => wanted.has(r.rowid));
              for (const r of rows) {
                const command = r.status & 240;
                if (command === 128 || command === 144 || r.tick + offset < 0) throw new UAError("uasrv.invalid_value", "move_midi_events: a note row, or a tick below 0", { cmd: "post", path });
                found.add(r.rowid);
              }
              if (rows.length) byClip.set(clip, rows);
            }
          }
          if (found.size !== wanted.size) throw new UAError("uasrv.invalid_value", "move_midi_events: no such row", { cmd: "post", path });
          if (offset === 0) return null;
          for (const [clip, rows] of byClip) engine.midiEdit(clip, "changed", rows.map((r) => ({ ...r, tick: r.tick + offset })));
          return null;
        },
        nudge: (data, engine) => engine.clipEdit(base, "nudge", data),
        separate_clips: (data, engine) => engine.clipEdit(base, "separate_clips", data),
        heal_separation: (data, engine) => engine.clipEdit(base, "heal_separation", data),
        move_clips: (data, engine) => engine.clipEdit(base, "move_clips", data),
        set_fade: (data, engine) => engine.clipEdit(base, "set_fade", data),
        delete_fades: (data, engine) => engine.clipEdit(base, "delete_fades", data),
        batch_fades: (data, engine) => engine.clipEdit(base, "batch_fades", data),
        change_fade_curvature: (data, engine) => engine.clipEdit(base, "change_fade_curvature", data),
        consolidate: () => null,
        mute_clips: () => null
      }
    });
    this.addNode(`${base}/tempo_map/1`, { properties: { tick: 0, time: 0, tempo: 120 } });
    this.addNode(`${base}/time_signatures/1`, { properties: { tick: 0, bar: 1, partial: false, numerator: 4, denominator: 4 } });
    this.addNode(`${base}/key_signatures`);
    this.addNode(`${base}/markers`);
    this.addNode(`${base}/chords`);
    this.addNode(`${base}/storage`, { commands: storageCommands(`${base}/storage`) });
    this.addPackage(pkg, { name: options.name ?? uid, lastOpened: Date.now() });
    const moveToFolderCommand = (data, engine) => {
      const body = data ?? {};
      const folder = body.folder_uid || null;
      const fail = (why) => new UAError("uasrv.invalid_value", `move_to_folder: ${why}`, { cmd: "post", path: `${base}/tracks/move_to_folder` });
      if (!Array.isArray(body.after_uids)) throw new UAError("uasrv.invalid_property", "move_to_folder: after_uids is required", { cmd: "post", path: `${base}/tracks/move_to_folder` });
      if (folder && !engine.isFolder(uid, folder)) throw fail("folder_uid is not a folder");
      if (body.before_uid && !engine.channelIds(uid).includes(body.before_uid)) throw fail("no such before_uid");
      for (const id of body.after_uids) {
        if (!engine.has(`${base}/tracks/${id}`) && !engine.has(`${base}/buses/${id}`)) throw fail("no such track or bus");
        for (let f = folder; f; f = engine.folderOf(uid, f)) if (f === id) throw fail("a folder cannot contain itself");
      }
      engine.moveToFolder(uid, body.after_uids, folder, body.before_uid || void 0);
      return null;
    };
    const changeOrderCommand = (data, engine) => {
      const body = data ?? {};
      if (body.reset) {
        const ids2 = engine.channelIds(uid);
        engine.renumber(uid, [...ids2.filter((id) => engine.has(`${base}/tracks/${id}`)), ...ids2.filter((id) => engine.has(`${base}/buses/${id}`))]);
        return null;
      }
      if (!Array.isArray(body.after_uids) || body.after_uids.some((id) => typeof id !== "string" || !id)) throw new UAError("uasrv.invalid_property", "change_order: after_uids is required", { cmd: "post", path: `${base}/tracks/change_order` });
      const known = engine.channelIds(uid);
      const ids = body.after_uids;
      if (ids.length && ids.every((id) => known.includes(id)) && (!body.before_uid || known.includes(body.before_uid))) engine.changeOrder(uid, ids, body.before_uid || null);
      return null;
    };
    this.addNode(`${base}/tracks`, { commands: { move_to_folder: moveToFolderCommand, change_order: changeOrderCommand } });
    this.addNode(`${base}/buses`, {
      commands: {
        move_to_folder: moveToFolderCommand,
        change_order: changeOrderCommand,
        set_folder_mode: (data, engine) => {
          const body = data ?? {};
          const bus = `${base}/buses/${body.bus_uid}`;
          if (!body.bus_uid || !engine.has(bus) || engine.value(bus, "bus_type") !== "aux") throw new UAError("uasrv.invalid_value", "set_folder_mode: not an aux bus", { cmd: "post", path: `${base}/buses/set_folder_mode` });
          if (!["none", "summing", "container"].includes(String(body.folder_mode))) throw new UAError("uasrv.invalid_value", "set_folder_mode: bad folder_mode", { cmd: "post", path: `${base}/buses/set_folder_mode` });
          engine.setFolderMode(uid, body.bus_uid, body.folder_mode);
          return null;
        }
      }
    });
    for (let i = 0; i < 4; i++) this.addBus(uid, `cue${i + 1}_${uid}`, { name: `CUE ${i + 1}`, busType: `cue_${i}`, stemFormat: "stereo" });
    this.addBus(uid, `master_${uid}`, { name: "Main Output", busType: "master", stemFormat: "stereo", color: 4294948970 });
    this.addNode(`/workspace/sessions/${pkg}/audio`);
    for (const name of options.tracks ?? []) this.addTrack(uid, name, { name });
    if (options.focused ?? true) this.setValue("/sessions", "focused_session", uid);
  }
  /** Add a track with the standard control layout and one playlist. */
  /** @internal `new_track` with `preset_uid` (fact 132). */
  newTrackFromPreset(sessionUid, presetUid, name, stemFormat) {
    const base = `/sessions/${sessionUid}`;
    const preset = this.findPreset(presetUid);
    if (!preset) throw new UAError("device.database_error", "new_track: no such preset", { cmd: "post", path: `${base}/new_track` });
    const presetName = String(this.value(preset.path, "preset_name") ?? "");
    const made = [];
    const make = (trackName, trackType, format) => {
      const id = `t${this.children(`${base}/tracks`).length + 1}`;
      this.addTrack(sessionUid, id, { name: trackName, trackType, stemFormat: format });
      this.setValue(`${base}/tracks/${id}`, "preset_uid", presetUid);
      this.setValue(`${base}/tracks/${id}`, "preset_name", presetName);
      made.push(id);
      return `${base}/tracks/${id}`;
    };
    if (preset.kind === "plugin") {
      const instrument = this.instrumentPluginIds().includes(preset.pluginId);
      const track = make(name ?? presetName, instrument ? "instrument" : "audio", instrument ? "stereo" : stemFormat ?? "mono");
      this.putPluginPreset(track, preset.pluginId, preset.path);
    } else {
      const saved = this.value(preset.path, "track_names") ?? [];
      const trackType = String(this.value(preset.path, "track_type") ?? "audio");
      const names = saved.length > 1 ? saved : [name ?? presetName];
      for (const trackName of names) make(trackName, trackType, trackType === "instrument" ? "stereo" : "mono");
    }
    return made.length === 1 ? { uid: made[0] } : made.map((uid) => ({ uid }));
  }
  addTrack(sessionUid, id, options = {}) {
    const base = `/sessions/${sessionUid}`;
    const order = this.channelIds(sessionUid).length + 1;
    const playlist = `pl_${id}_1`;
    this.addChannel(
      `${base}/tracks/${id}`,
      {
        uid: id,
        name: options.name ?? id,
        track_type: options.trackType ?? "audio",
        io_type: "mono",
        stem_format: options.stemFormat ?? "mono",
        order,
        color: 4278190335,
        comments: "",
        automation_mode: "read",
        folder_uid: null,
        frozen: false,
        enabled: true,
        record_enabled: false,
        input_monitor: false,
        input_monitor_state: false,
        input_monitor_source: "node",
        input_desc: null,
        input_node_uid: null,
        playlist_uid: playlist,
        has_preamp: false,
        record_mute: false,
        preset_uid: null,
        preset_name: null
      },
      options.stemFormat === "stereo"
    );
    this.routeCues(sessionUid, `${base}/tracks/${id}`);
    this.addNode(`${base}/playlists/${playlist}`, { properties: { uid: playlist, name: "V1", track_uid: id, version: 1, stem_format: options.stemFormat ?? "mono", frozen: false, enable_compiled_clips: false } });
    this.addNode(`${base}/playlists/${playlist}/clips`);
  }
  /**
   * Add a source audio file to a session package's workspace folder. With `analysis`, it also
   * carries a fine and a coarse overview, sized from its length the way LUNA's is: one fine
   * pair per 125 samples at 48 kHz, one coarse pair per twelve fine (fact 72).
   */
  addSource(packageUid, uid, options = {}) {
    const path = `/workspace/sessions/${packageUid}/audio/${uid}`;
    const lengthNs = options.lengthNs ?? 1e9;
    const channels = options.stemFormat === "stereo" ? 2 : 1;
    this.addNode(path, {
      properties: { uid, name: options.name ?? `${uid}.wav`, stem_format: options.stemFormat ?? "mono", length: lengthNs, sample_rate: options.sampleRate ?? 48e3 }
    });
    if (options.analysis === false) return;
    for (const [kind, pairNs] of [
      ["overview", 125e9 / 48e3],
      ["overview_coarse", 125e9 / 48e3 * 12]
    ]) {
      const count = Math.max(1, Math.floor(lengthNs / pairNs));
      this.addNode(`${path}/analysis/${kind}`, { properties: { count, md5: `md5-${uid}-${kind}` } });
      this.addNode(`${path}/analysis/${kind}/file`, { properties: { data: { count, channels } } });
    }
  }
  /**
   * Add a hardware device with `inputs` named inputs, the shape `luna.audioInputs()` reads
   * (fact 76).
   *
   * @example
   * engine.addDevice('Apollo', { inputs: ['In 1', 'In 2'] });
   */
  addDevice(id, options = {}) {
    const path = `/devices/${id}`;
    this.addNode(path, { properties: { name: id, device_type: "audio", online: options.online ?? true, sample_rate: 48e3, clock_source: "internal" } });
    this.addNode(`${path}/inputs`);
    (options.inputs ?? []).forEach((name, i) => {
      this.addNode(`${path}/inputs/in_${i + 1}`, { properties: { name, stem_format: options.stemFormat ?? "mono", device_id: id, in_use: false } });
    });
  }
  /**
   * Add a MIDI device under LUNA's device (`/devices/<LUNA_DEVICE_UID>/midi`, fact 123). The
   * first call also adds LUNA's device, the `midi` folder, and the `All` and `None` entries
   * LUNA lists beside the real devices, each with an input port only. The device gets an input
   * and an output port unless `input` or `output` is false. Returns the device's uid.
   *
   * @example
   * engine.addMidiDevice('Volt 876');
   * engine.addMidiDevice('IAC Driver Bus 1', { uid: 'iac1' });
   */
  addMidiDevice(name, options = {}) {
    const folder = `/devices/${LUNA_DEVICE_UID}/midi`;
    if (!this.has(folder)) {
      if (!this.has(`/devices/${LUNA_DEVICE_UID}`)) this.addNode(`/devices/${LUNA_DEVICE_UID}`, { properties: { name: "LUNA", online: true } });
      this.addNode(folder, { properties: { type: "folder" } });
      for (const [uid2, pseudo] of [["midi_all", "All"], ["midi_none", "None"]]) this.addMidiDeviceNode(`${folder}/${uid2}`, pseudo, null, true, false);
    }
    const uid = options.uid ?? `midi_${this.children(folder).length + 1}`;
    this.addMidiDeviceNode(`${folder}/${uid}`, name, options.deviceType ?? "normal", options.input ?? true, options.output ?? true);
    return uid;
  }
  /**
   * MIDI arriving from a device, as LUNA publishes it (fact 125): one batch on the device's
   * input port `midi_events`, and the same batch on `All`'s. Like LUNA, nothing is published
   * on a port no one subscribes to by its `midi_events` path, and a `get` reads no events.
   * `device` is a uid from {@link addMidiDevice} or a device name; each message is
   * `[status, data1, data2]`, or a whole SysEx `[0xf0, ..., 0xf7]` (fact 138), stamped `timeMs`
   * (default 0) apart by `stepMs` (default 1). Returns how many ports published.
   *
   * @example
   * engine.addMidiDevice('Volt 876', { uid: 'volt' });
   * engine.receiveMidi('volt', [[0x90, 60, 100], [0x80, 60, 0], [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]]);
   */
  receiveMidi(device, messages, options = {}) {
    const folder = `/devices/${LUNA_DEVICE_UID}/midi`;
    if (!this.has(folder)) throw new Error("MockEngine.receiveMidi: no MIDI devices; call addMidiDevice first");
    const uid = this.children(folder).find((d) => d === device || this.value(`${folder}/${d}`, "name") === device);
    if (!uid || !this.has(`${folder}/${uid}/input_ports/0`)) throw new Error(`MockEngine.receiveMidi: no MIDI device ${device} with an input port`);
    const start = options.timeMs ?? 0;
    const step = options.stepMs ?? 1;
    const events = messages.map((m, i) => m[0] === 240 ? [start + i * step, 240, [...m]] : [start + i * step, m[0], m[1], m[2]]);
    const all = this.children(folder).find((d) => this.value(`${folder}/${d}`, "name") === "All");
    let published = 0;
    for (const id of all && all !== uid ? [uid, all] : [uid]) {
      const port = `${folder}/${id}/input_ports/0`;
      const path = `${port}/midi_events`;
      if (![...this.ports].some((p) => p.subscribesTo(path))) continue;
      const current = this.value(port, "midi_events");
      const seq = current.seq + 1;
      this.nodes.get(port)?.properties.set("midi_events", { seq, dropped: current.dropped, events: [] });
      this.push({ path: `${path}/value`, data: { seq, dropped: current.dropped, events } }, void 0);
      published++;
    }
    return published;
  }
  /** True when `uid` is a mock MIDI device's output port uid. */
  isMidiOutputPortUid(uid) {
    const folder = `/devices/${LUNA_DEVICE_UID}/midi`;
    if (!this.has(folder)) return false;
    return this.children(folder).some((d) => this.has(`${folder}/${d}/output_ports/0`) && this.value(`${folder}/${d}/output_ports/0`, "uid") === uid);
  }
  addMidiDeviceNode(path, name, deviceType, input, output) {
    const real = deviceType !== null;
    this.addNode(path, {
      properties: {
        type: "midi-device",
        name,
        last_midi_note: [255, 255, 255],
        last_midi_control: [255, 255, 255],
        midi_device_type: deviceType,
        midi_device_mode: null,
        output_lateness: real ? 0 : null,
        midi_clock_generation_enabled: real ? false : null,
        midi_clock_generation_mode: real ? "song1" : null,
        midi_clock_generation_offset_ms: real ? 0 : null
      }
    });
    const id = path.slice(path.lastIndexOf("/") + 1);
    if (input) {
      this.addNode(`${path}/input_ports`, { properties: { type: "folder" } });
      this.addNode(`${path}/input_ports/0`, { properties: { type: "midi-input", uid: `${id}_in`, midi_events: { seq: 0, dropped: 0, events: [] } } });
    }
    if (output) {
      this.addNode(`${path}/output_ports`, { properties: { type: "folder" } });
      this.addNode(`${path}/output_ports/0`, { properties: { type: "midi-output", uid: `${id}_out` } });
    }
  }
  /**
   * Finish a record pass the way LUNA does: punch in, then on the caller's stop drop a
   * finalized take clip on the track's active playlist with a source to match (fact 75).
   *
   * @example
   * engine.onRecord(({ sessionUid, trackUid }) => engine.finishTake(sessionUid, trackUid, { startTick: 0, stopTick: Luna.WHOLE_NOTE }));
   */
  finishTake(sessionUid, trackUid, options = {}) {
    const base = `/sessions/${sessionUid}`;
    const playlist = String(this.value(`${base}/tracks/${trackUid}`, "playlist_uid"));
    const pkg = String(this.value(base, "session_package_uid"));
    const n = this.children(`${base}/playlists/${playlist}/clips`).length + 1;
    const clipUid = `take${n}`;
    const sourceUid = `src_${clipUid}`;
    const startTick = options.startTick ?? 0;
    const stopTick = options.stopTick ?? startTick + 96e9 * 4;
    this.addSource(pkg, sourceUid, { name: `${options.name ?? "Take"}.wav`, lengthNs: (stopTick - startTick) / 96e9 * 5e8 });
    this.addNode(`${base}/playlists/${playlist}/clips/${clipUid}`, {
      properties: {
        uid: clipUid,
        name: options.name ?? `Take ${n}`,
        start: startTick,
        stop: stopTick,
        source_uid: sourceUid,
        source_start: 0,
        source_stop: (stopTick - startTick) / 96e9 * 5e8,
        clip_type: 0,
        gain: 0,
        bypass: false,
        render_source_uid: null,
        render_state: "none",
        midi_source_start: 0
      }
    });
    return clipUid;
  }
  /**
   * Add an empty MIDI clip to a track's current playlist, the way LUNA makes one for notes
   * drawn in place. `midiSourceStart` is the table tick at the clip's start (fact 41): 0 by
   * default. `insert_clip` cannot make one: it needs a source (fact 112). Returns the clip uid.
   *
   * @example
   * const clipUid = engine.addMidiClip('abc', 'Keys', { startTick: 0, stopTick: Luna.WHOLE_NOTE });
   */
  addMidiClip(sessionUid, trackUid, options = {}) {
    const base = `/sessions/${sessionUid}`;
    return this.addMidiClipToPlaylist(base, String(this.value(`${base}/tracks/${trackUid}`, "playlist_uid")), options);
  }
  /** @internal */
  addMidiClipToPlaylist(sessionPath, playlistUid, options) {
    const clips = `${sessionPath}/playlists/${playlistUid}/clips`;
    let n = this.children(clips).length + 1;
    while (this.has(`${clips}/midi${n}`)) n++;
    const clipUid = `midi${n}`;
    const start = options.startTick ?? 0;
    const stop = options.stopTick ?? start + 96e9 * 4;
    this.addNode(`${clips}/${clipUid}`, {
      properties: { uid: clipUid, name: options.name ?? "MIDI", start, stop, source_uid: "", source_start: start, source_stop: stop, clip_type: 2, gain: 0, bypass: false, render_source_uid: null, render_state: "none", midi_source_start: options.midiSourceStart ?? 0, layer: 0, mute: false }
    });
    this.addNode(`${clips}/${clipUid}/midi/table`, { properties: { row_data: EMPTY_MIDI_TABLE() } });
    return clipUid;
  }
  /**
   * @internal The bar lines either side of `tick`: the one at or before it and the one at or
   * after it, from the time signature in effect (deviced's `GetBarRangeForNoteEvents`).
   */
  barLines(sessionPath, tick) {
    const beatTicks = 96e9;
    const sigs = this.children(`${sessionPath}/time_signatures`).map((id) => this.nodes.get(`${sessionPath}/time_signatures/${id}`).properties).map((p) => ({ tick: Number(p.get("tick") ?? 0), n: Number(p.get("numerator") ?? 4), d: Number(p.get("denominator") ?? 4) })).sort((a, b) => a.tick - b.tick);
    const sig = sigs.filter((x) => x.tick <= tick).at(-1) ?? sigs[0] ?? { tick: 0, n: 4, d: 4 };
    const bar = beatTicks * 4 / sig.d * sig.n;
    const floor = sig.tick + Math.floor((tick - sig.tick) / bar) * bar;
    return { floor, ceil: floor === tick ? tick : floor + bar };
  }
  /**
   * Put a chord on a session's Chord ruler, as a user typing one in LUNA would: it replaces
   * any chord at `tick`, and `♭`/`♯` are stored as `b`/`#` (fact 100). Returns the rowid.
   *
   * @example engine.addChord('abc', 0, 'Am7');
   */
  addChord(sessionUid, tick, name) {
    const base = `/sessions/${sessionUid}/chords`;
    const existing = this.chordAt(sessionUid, tick);
    if (existing !== void 0) this.removeNode(`${base}/${existing}`);
    const rowid = this.nextRow();
    this.addNode(`${base}/${rowid}`, { properties: { rowid, location: tick, name: normalizeChordName(name) } });
    return rowid;
  }
  /** @internal The rowid of the chord at `tick`, if any. */
  chordAt(sessionUid, tick) {
    const base = `/sessions/${sessionUid}/chords`;
    return this.children(base).find((row) => this.value(`${base}/${row}`, "location") === tick);
  }
  /**
   * Add a bus. `busType` is `aux`, `master` or `cue_0`..`cue_3`; cue buses have only a main
   * output (fact 83). Orders after everything already in the session.
   */
  addBus(sessionUid, id, options = {}) {
    const base = `/sessions/${sessionUid}`;
    const busType = options.busType ?? "aux";
    const stereo = (options.stemFormat ?? "stereo") === "stereo";
    const order = this.channelIds(sessionUid).length + 1;
    this.addChannel(
      `${base}/buses/${id}`,
      { uid: id, name: options.name ?? id, bus_type: busType, order, stem_format: options.stemFormat ?? "stereo", color: options.color ?? 4282400832, folder_mode: "none", folder_uid: null, automation_mode: "read", frozen: false, enabled: true, comments: "" },
      stereo,
      !busType.startsWith("cue_")
    );
    if (!busType.startsWith("cue_")) this.routeCues(sessionUid, `${base}/buses/${id}`);
  }
  /** @internal True when `id` is a bus of the session whose folder_mode is not none (fact 136). */
  isFolder(sessionUid, id) {
    const mode = this.value(`/sessions/${sessionUid}/buses/${id}`, "folder_mode");
    return typeof mode === "string" && mode !== "none";
  }
  /** @internal The folder a track or bus is in, or null at the session root. */
  folderOf(sessionUid, id) {
    const base = `/sessions/${sessionUid}`;
    const path = this.has(`${base}/tracks/${id}`) ? `${base}/tracks/${id}` : `${base}/buses/${id}`;
    return this.value(path, "folder_uid") ?? null;
  }
  /**
   * @internal Put tracks and buses in `folder` (null: the session root), as LUNA's
   * `move_to_folder` does (fact 136): set each one's `folder_uid` and reroute the main outputs
   * of it and everything inside it. The order is not modelled.
   */
  moveToFolder(sessionUid, ids, folder, before) {
    const base = `/sessions/${sessionUid}`;
    const topLevel = ids.filter((id) => {
      for (let f = this.folderOf(sessionUid, id); f; f = this.folderOf(sessionUid, f)) if (ids.includes(f)) return false;
      return true;
    });
    const moved = this.withSubtrees(sessionUid, topLevel);
    for (const id of topLevel) {
      const path = this.has(`${base}/tracks/${id}`) ? `${base}/tracks/${id}` : `${base}/buses/${id}`;
      this.setValue(path, "folder_uid", folder);
    }
    this.renumber(sessionUid, this.spliceAfter(sessionUid, moved, before ?? folder));
    this.rerouteFolderSubtree(sessionUid, topLevel);
  }
  /** @internal Every track and bus of the session, sorted by `order` (fact 137). */
  channelIds(sessionUid) {
    const base = `/sessions/${sessionUid}`;
    const rows = [...this.children(`${base}/tracks`).map((id) => [id, `${base}/tracks/${id}`]), ...this.children(`${base}/buses`).map((id) => [id, `${base}/buses/${id}`])];
    return rows.map(([id, path]) => [id, Number(this.value(path, "order") ?? 0)]).sort((a, b) => a[1] - b[1]).map(([id]) => id);
  }
  /** `ids` in the order given, each folder followed by everything inside it in current order. */
  withSubtrees(sessionUid, ids) {
    const flat = this.channelIds(sessionUid);
    const out = [];
    const add = (id) => {
      if (out.includes(id)) return;
      out.push(id);
      if (this.isFolder(sessionUid, id)) {
        for (const child of flat) if (this.folderOf(sessionUid, child) === id) add(child);
      }
    };
    for (const id of ids) add(id);
    return out;
  }
  /** The current order without `moved`, with `moved` put back after `anchor` (null: the front). */
  spliceAfter(sessionUid, moved, anchor) {
    const rest = this.channelIds(sessionUid).filter((id) => !moved.includes(id));
    const at = anchor === null ? 0 : rest.indexOf(anchor) + 1;
    if (anchor !== null && at === 0) return [...rest, ...moved];
    return [...rest.slice(0, at), ...moved, ...rest.slice(at)];
  }
  /**
   * @internal Write `order` as 1..N from `flat`, re-serialized depth-first so each folder is
   * followed at once by everything inside it, siblings keeping their order in `flat` (fact 137).
   */
  renumber(sessionUid, flat = this.channelIds(sessionUid)) {
    const base = `/sessions/${sessionUid}`;
    const byParent = /* @__PURE__ */ new Map();
    for (const id of flat) {
      const parent = this.folderOf(sessionUid, id);
      byParent.set(parent, [...byParent.get(parent) ?? [], id]);
    }
    const out = [];
    const walk = (parent) => {
      for (const id of byParent.get(parent) ?? []) {
        if (out.includes(id)) continue;
        out.push(id);
        walk(id);
      }
    };
    walk(null);
    for (const id of flat) if (!out.includes(id)) out.push(id);
    out.forEach((id, i) => {
      const path = this.has(`${base}/tracks/${id}`) ? `${base}/tracks/${id}` : `${base}/buses/${id}`;
      if (this.value(path, "order") !== i + 1) this.setValue(path, "order", i + 1);
    });
  }
  /**
   * @internal LUNA's `change_order` (fact 137): move `ids` (folders with everything inside
   * them) to just after `anchor`, or the front for null, then renumber. Which folder each one
   * is in never changes, so the anchor only picks a place among its siblings.
   */
  changeOrder(sessionUid, ids, anchor) {
    this.renumber(sessionUid, this.spliceAfter(sessionUid, this.withSubtrees(sessionUid, ids), anchor));
  }
  /**
   * @internal `set_folder_mode` (fact 136): `none` moves the bus's direct children to the
   * session root; any change reroutes everything inside it.
   */
  setFolderMode(sessionUid, busUid, mode) {
    const base = `/sessions/${sessionUid}`;
    const children = this.folderChildren(sessionUid, busUid);
    this.setValue(`${base}/buses/${busUid}`, "folder_mode", mode);
    if (mode === "none") {
      for (const id of children) this.setValue(this.has(`${base}/tracks/${id}`) ? `${base}/tracks/${id}` : `${base}/buses/${id}`, "folder_uid", null);
      this.renumber(sessionUid);
    }
    this.rerouteFolderSubtree(sessionUid, children);
  }
  folderChildren(sessionUid, folder) {
    const base = `/sessions/${sessionUid}`;
    return [...this.children(`${base}/tracks`), ...this.children(`${base}/buses`)].filter((id) => this.folderOf(sessionUid, id) === folder);
  }
  /**
   * Route the main output of each of `ids`, and of everything inside them, to the nearest
   * summing folder it is in (a container folder passes through), else the master (fact 136).
   */
  /** @internal */
  rerouteFolderSubtree(sessionUid, ids) {
    const base = `/sessions/${sessionUid}`;
    const master = this.children(`${base}/buses`).find((b) => this.value(`${base}/buses/${b}`, "bus_type") === "master");
    for (const id of ids) {
      let target = this.folderOf(sessionUid, id);
      while (target && this.value(`${base}/buses/${target}`, "folder_mode") !== "summing") target = this.folderOf(sessionUid, target);
      target ??= master;
      const main = `${this.has(`${base}/tracks/${id}`) ? `${base}/tracks/${id}` : `${base}/buses/${id}`}/outputs/main`;
      if (target && this.has(main)) {
        for (const object of this.children(`${main}/assignment_objects`)) this.removeNode(`${main}/assignment_objects/${object}`);
        this.setValue(main, "assignments", []);
        this.addAssignment(main, target, `${base}/buses/${target}`);
      }
      this.rerouteFolderSubtree(sessionUid, this.folderChildren(sessionUid, id));
    }
  }
  /** LUNA routes a new channel's cue outputs to CUE 1-4 (fact 83). */
  routeCues(sessionUid, channel) {
    const base = `/sessions/${sessionUid}`;
    for (const bus of this.children(`${base}/buses`)) {
      const busType = String(this.value(`${base}/buses/${bus}`, "bus_type") ?? "");
      const out = `${channel}/outputs/${busType}`;
      if (busType.startsWith("cue_") && this.has(out)) this.addAssignment(out, bus, `${base}/buses/${bus}`);
    }
  }
  /**
   * The standard strip: `controls/solo`, a main output, and (unless `slots` is false) eight
   * sends and four cue outputs. Pan is `pan` on a mono channel and `pan_left`/`pan_right` on
   * a stereo one, on the main output and on every send alike (fact 84).
   */
  addChannel(path, properties, stereo, slots = true) {
    const pans = stereo ? ["pan_left", "pan_right"] : ["pan"];
    this.addNode(path, { properties, readOnly: ["uid", "order", "track_type", "bus_type", "io_type", "folder_uid", "playlist_uid", "input_monitor_state"] });
    this.addNode(`${path}/controls`);
    this.addControl(`${path}/controls/solo`, "solo", { discrete: true, value: 0, real: false, str: "false", automatable: false });
    const outputs = ["main", ...slots ? [...Array.from({ length: 8 }, (_, i) => `send_${i}`), ...Array.from({ length: 4 }, (_, i) => `cue_${i}`)] : []];
    for (const out of outputs) {
      const main = out === "main";
      this.addNode(`${path}/outputs/${out}`, { properties: { uid: `${path}_${out}`, output_type: out, bus_uid: null, assignments: main ? [{ value: "out12", name: "OUTPUT 1-2", stem_format: "stereo" }] : [] } });
      this.addNode(`${path}/outputs/${out}/controls`);
      this.addNode(`${path}/outputs/${out}/assignment_objects`);
      const names = main ? ["gain", ...pans, "mute", "gain_trim"] : ["gain", ...pans, "mute", "pre_fader", "enabled", "gain_trim"];
      for (const name of names) {
        const isSwitch = name === "mute" || name === "pre_fader" || name === "enabled";
        const isPan = name.startsWith("pan");
        this.addControl(`${path}/outputs/${out}/controls/${name}`, name, isSwitch ? { discrete: true, value: 0, real: false, str: "false", automatable: true } : { discrete: false, value: 0, real: 0, str: isPan ? "C" : "0.0", automatable: true, normalized: isPan ? 0.5 : FADER_ZERO });
      }
      this.addNode(`${path}/outputs/${out}/meters/level`, { properties: { type: "meter", name: "Level", enabled: true, num_streams: stereo ? 2 : 1, level: stereo ? [0, 0] : [0], peak: stereo ? [0, 0] : [0], clip: stereo ? [0, 0] : [0] } });
    }
    this.addNode(`${path}/effects`);
    for (const slot of ["tape", "console", "reserved_0", ...Array.from({ length: 8 }, (_, i) => `effect_${i}`), "sidechain_filter", ...Array.from({ length: 4 }, (_, i) => `record_fx_${i}`)]) {
      this.addNode(`${path}/effects/${slot}`, {
        properties: { uid: `${path}_${slot}`, insert_type: slot, plugin_id: null, plugin_name: null, external_sdk_instance_id: null, bypass_control: null, bypass_control_active_low: null, enabled: true, plugin_power: true, preset_name: null, preset_uid: null, preset_uid_dirty: false, frozen: false, sidechain_allowed: false, sidechain_in_use: false, plugin_error: null, plugin_license_error: null },
        readOnly: ["uid", "insert_type", "plugin_id", "plugin_name"]
      });
      this.addNode(`${path}/effects/${slot}/controls`);
      this.addNode(`${path}/effects/${slot}/commands`, { commands: { preset_browser_increment: () => null, preset_browser_decrement: () => null, preset_browser_toggle: () => null } });
    }
  }
  /** @internal */
  addControl(path, controlType, o) {
    this.addNode(path, {
      properties: {
        uid: `ctl_${path.replaceAll("/", "_")}`,
        name: controlType,
        control_type: controlType,
        value: o.value,
        real_value: o.real,
        normalized_value: o.normalized ?? o.value,
        string_value: o.str,
        automatable: o.automatable,
        discrete: o.discrete,
        num_steps: o.discrete ? 2 : 0,
        initialized: true,
        touch_count: 0,
        real_values: o.discrete ? [false, true] : [],
        string_values: o.discrete ? ["false", "true"] : [],
        taper: null
      },
      readOnly: ["uid", "control_type", "automatable", "discrete", "num_steps"],
      commands: {
        set_touch: (data, engine, nodePath) => {
          const touching = Boolean(data?.touch);
          engine.touches.push(`${nodePath}:${touching ? "on" : "off"}`);
          const count = Number(engine.value(nodePath, "touch_count") ?? 0) + (touching ? 1 : -1);
          if (count < 0) throw new UAError("uasrv.invalid_value", "set_touch: control is not touched", { cmd: "post", path: `${nodePath}/set_touch` });
          engine.setValue(nodePath, "touch_count", count);
          return null;
        },
        // The control's default is the value it was created with; LUNA answers the default
        // real value (fact 92).
        set_control_default_value: (_data, engine, nodePath) => {
          const defaults = { value: o.value, real_value: o.real, normalized_value: o.normalized ?? o.value, string_value: o.str };
          for (const [prop, v] of Object.entries(defaults)) if (engine.value(nodePath, prop) !== v) engine.setValue(nodePath, prop, v);
          return o.real;
        }
      }
    });
    this.addNode(`${path}/automation`);
  }
  /**
   * A small ready-made engine: one focused session, `Demo`, with four audio tracks. What a
   * page gets from `?engine=mock` when it defines no `LunaMockSetup`.
   *
   * @example
   * const engine = Luna.MockEngine.demo();
   * const luna = await Luna.connect({ port_: engine.port() });
   */
  static demo(options = {}) {
    const engine = new _MockEngine(options);
    engine.addSession("demo", { name: "Demo", tracks: ["Vocal", "Guitar", "Bass", "Drums"] });
    return engine;
  }
  /** Resolves once every queued push has been delivered. */
  settled() {
    if (this.pendingDeliveries === 0) return Promise.resolve();
    return new Promise((resolve) => this.settleWaiters.push(resolve));
  }
  // ---------------------------------------------------------------------------------------
  // Request handling (called by MockPort)
  // ---------------------------------------------------------------------------------------
  /** @internal */
  handle(from, verb, rawPath, data) {
    this.requests.push({ verb, path: rawPath, data });
    const path = normalize(rawPath);
    const params = parseQuery(rawPath);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const fault = this.faults.get(path);
        if (fault && fault.remaining > 0) {
          fault.remaining--;
          if (fault.remaining === 0) this.faults.delete(path);
          reject(new UAError(fault.code, `${verb} ${rawPath}: ${fault.code}`, { cmd: verb, path }));
          return;
        }
        try {
          resolve(this.execute(from, verb, path, params, data));
        } catch (err) {
          reject(err);
        }
      }, 0);
    });
  }
  execute(from, verb, path, params, data) {
    switch (verb) {
      case "get":
        return this.get(path, params);
      case "set":
        if (this.ignoresBareWhole(path, data)) return null;
        return this.set(from, path, data instanceof FloatLiteral ? data.value : data);
      case "post":
        return this.post(path, data);
      case "subscribe":
      case "unsubscribe":
        return null;
    }
  }
  get(path, params) {
    if (path === "/ping") return null;
    if (path.endsWith("/file/data") && path.includes("/analysis/")) return { value: this.overviewPage(path, params) };
    const node = this.nodes.get(path);
    if (node) return this.describe(path, node, params, params["recursive"] === "1" ? Infinity : Number(params["levels"] ?? 1));
    const { node: nodePath, name } = splitPath(path);
    const owner = this.nodes.get(nodePath);
    if (owner && owner.properties.has(name)) {
      const value = owner.properties.get(name);
      return params["flatvalue"] === "1" ? value : { value };
    }
    if (name === "value") {
      const inner = splitPath(nodePath);
      const holder = this.nodes.get(inner.node);
      if (holder && holder.properties.has(inner.name)) return holder.properties.get(inner.name);
    }
    return {};
  }
  /**
   * A bounded page of overview pairs, generated rather than stored: `count` int16 min/max
   * pairs per channel, clamped to what the analysis holds. A request past the end answers an
   * empty page, as LUNA's does.
   */
  overviewPage(path, params) {
    const holder = this.nodes.get(splitPath(path).node);
    const info = holder?.properties.get("data");
    if (!info) return void 0;
    const total = info.count ?? 0;
    const channels = info.channels ?? 1;
    const index = Math.max(0, Number(params["index"] ?? 0));
    const want = Math.max(0, Number(params["count"] ?? 1024));
    const n = Math.max(0, Math.min(want, total - index));
    const data = [];
    for (let c = 0; c < channels; c++) {
      const min = [];
      const max = [];
      for (let i = 0; i < n; i++) {
        const amp = Math.round(16384 * Math.abs(Math.sin((index + i) / 32 + c)));
        min.push(-amp);
        max.push(amp);
      }
      data.push({ min, max });
    }
    return { count: n, data };
  }
  describe(path, node, params, levels) {
    const out = {};
    const flat = params["flatvalue"] === "1";
    const filter = params["propfilter"] ? new Set(params["propfilter"].split(",")) : void 0;
    if (params["properties"] !== "0" && node.properties.size > 0) {
      const properties = {};
      for (const [name, value] of node.properties) {
        if (filter && !filter.has(name)) continue;
        properties[name] = flat ? value : { value };
      }
      if (Object.keys(properties).length > 0) out["properties"] = properties;
    }
    if (params["children"] !== "0" && node.children.length > 0) {
      out["children"] = node.children.map((name) => {
        const entry = { path: name };
        if (levels > 1) {
          const child = this.nodes.get(`${path === "/" ? "" : path}/${name}`);
          if (child) Object.assign(entry, this.describe(`${path === "/" ? "" : path}/${name}`, child, params, levels - 1));
        }
        return entry;
      });
    }
    if (params["commands"] !== "0" && node.commands.size > 0) out["commands"] = [...node.commands.keys()].map((name) => ({ path: name }));
    return out;
  }
  /**
   * A plugin parameter's `real_value` wants a float literal (fact 142): a bare whole number is
   * refused with `uasrv.invalid_value`. (LUNA ignores one sent to `value`; the mock cannot
   * address a control's `value` property, which it reads as the `/value` suffix.) The mock sees
   * payload objects, so a `FloatLiteral` stands for the literal and a plain integer for the bare
   * token. Throws for a write to refuse.
   */
  ignoresBareWhole(path, data) {
    if (typeof data !== "number" || !Number.isInteger(data)) return false;
    const { node: nodePath, name } = splitPath(path);
    if (name !== "real_value") return false;
    if (!/\/effects\/[^/]+\/controls\/[^/]+$/.test(nodePath)) return false;
    const node = this.nodes.get(nodePath);
    if (node?.properties.get("control_type") !== "parameter" || node.properties.get("discrete") !== false) return false;
    throw new UAError("uasrv.invalid_value", `set ${path}: uasrv.invalid_value`, { cmd: "set", path });
  }
  set(from, path, data) {
    if (this.nodes.has(path)) {
      throw new UAError("uasrv.invalid_property", `set ${path}: uasrv.invalid_property`, { cmd: "set", path });
    }
    let { node: nodePath, name } = splitPath(path);
    if (name === "value") ({ node: nodePath, name } = splitPath(nodePath));
    const node = this.nodes.get(nodePath);
    if (!node || !node.properties.has(name)) {
      throw new UAError("uasrv.invalid_object", `set ${path}: uasrv.invalid_object`, { cmd: "set", path });
    }
    if (node.readOnly.has(name)) throw new UAError("uasrv.read_only", `set ${path}: uasrv.read_only`, { cmd: "set", path });
    if ((name === "width" || name === "height") && /^\/gui\/add_ons\/[^/]+\/instances\/[^/]+$/.test(nodePath)) {
      this.resizeAddOnInstance(nodePath, name, data, path);
      return null;
    }
    const isTrack = /^\/sessions\/[^/]+\/tracks\/[^/]+$/.test(nodePath);
    if (isTrack && name === "input_monitor" && data === true && this.value("/preferences", "record_mute") === true) {
      throw new UAError("uasrv.invalid_value", `set ${path}: uasrv.invalid_value`, { cmd: "set", path });
    }
    if (node.properties.get("control_type") !== void 0 && CONTROL_VIEWS.has(name)) {
      this.writeControl(nodePath, node, name, data, from);
      return null;
    }
    node.properties.set(name, data);
    this.push({ path: `${nodePath}/${name}/value`, data }, from);
    this.clipChanged(nodePath);
    if (name === "enable_compiled_clips" && /^\/sessions\/[^/]+\/playlists\/[^/]+$/.test(nodePath)) this.compilePlaylist(nodePath);
    if (name === "record_enabled" && /^\/sessions\/[^/]+$/.test(nodePath)) this.runRecord(nodePath, data === true || data === 1);
    if (name === "play_start" && /^\/sessions\/[^/]+$/.test(nodePath) && node.properties.get("playing") !== true) this.setValue(nodePath, "location", this.locationAt(nodePath, Number(data)));
    if (isTrack && name === "input_monitor") this.setValue(nodePath, "input_monitor_state", data === true);
    return null;
  }
  /**
   * A client write to one view of a control (fact 97): re-derive the other three and push
   * them to every port — the writer too, since they are derived (fact 6); only the written
   * view itself is withheld from the writer. A switch snaps to a step of its
   * `real_values`/`string_values`; a continuous control goes through the mock's stand-in
   * fader taper (see {@link faderTaper}); a plugin `parameter`'s `value` tracks its
   * normalized view, since plugin units are plugin-specific (fact 85).
   */
  writeControl(nodePath, node, written, data, from) {
    const p = node.properties;
    const views = {};
    if (p.get("discrete") === true) {
      const reals = p.get("real_values") ?? [false, true];
      const strings = p.get("string_values") ?? ["false", "true"];
      const steps = Math.max(reals.length, 2);
      const index = Math.max(
        0,
        Math.min(
          steps - 1,
          written === "real_value" ? reals.includes(data) ? reals.indexOf(data) : data ? 1 : 0 : written === "string_value" ? Math.max(0, strings.indexOf(String(data))) : written === "normalized_value" ? Math.round(Number(data) * (steps - 1)) : Math.round(Number(data))
        )
      );
      views["value"] = index;
      views["real_value"] = reals[index] ?? index;
      views["normalized_value"] = index / (steps - 1);
      views["string_value"] = strings[index] ?? String(index);
    } else {
      const pan = String(p.get("control_type") ?? "").startsWith("pan");
      const parameter = p.get("control_type") === "parameter";
      const real = written === "real_value" ? Number(data) : written === "string_value" ? pan ? parsePan(String(data)) : Number(data) || 0 : written === "normalized_value" || parameter ? pan ? Number(data) * 200 - 100 : faderTaper(p).toDb(Number(data)) : Number(data);
      const normalized = written === "normalized_value" || parameter && written === "value" ? Number(data) : pan ? Math.min(1, Math.max(0, (real + 100) / 200)) : faderTaper(p).toNormalized(real);
      views["real_value"] = real;
      views["normalized_value"] = normalized;
      views["string_value"] = pan ? formatPan(real) : real.toFixed(1);
      views["value"] = parameter ? normalized : real;
    }
    views[written] = data;
    for (const [prop, value] of Object.entries(views)) {
      p.set(prop, value);
      this.push({ path: `${nodePath}/${prop}/value`, data: value }, prop === written ? from : void 0);
    }
  }
  /**
   * Model LUNA's record pass (fact 75): arming the session rolls the transport and punches in
   * once any count-in is over; disarming finalizes a take on every armed track, but only when
   * the punch point lay inside the loop marks — outside them LUNA rolls and captures nothing.
   */
  runRecord(sessionPath, armed) {
    const uid = sessionPath.slice("/sessions/".length);
    if (armed) {
      this.setValue(sessionPath, "playing", true);
      this.setValue(sessionPath, "punched_in", true);
      const armedTracks2 = this.children(`${sessionPath}/tracks`).filter((t) => this.value(`${sessionPath}/tracks/${t}`, "record_enabled") === true);
      this.recording.set(uid, armedTracks2);
      const punchAt2 = Number(this.value(sessionPath, "play_start") ?? 0);
      for (const track of armedTracks2) this.startRecordTake(sessionPath, track, punchAt2);
      return;
    }
    const armedTracks = this.recording.get(uid) ?? [];
    this.recording.delete(uid);
    for (const track of armedTracks) {
      const sourceUid = this.value(`${sessionPath}/record/clips/${track}/rec_${track}`, "source_uid");
      this.removeNode(`${sessionPath}/record/clips/${track}`);
      if (typeof sourceUid === "string") this.removeNode(`${sessionPath}/record/audio/${sourceUid}`);
    }
    const punchAt = Number(this.value(sessionPath, "play_start") ?? 0);
    const loopStart = Number(this.value(sessionPath, "loop_start") ?? 0);
    const loopStop = Number(this.value(sessionPath, "loop_stop") ?? 0);
    this.setValue(sessionPath, "punched_in", false);
    this.setValue(sessionPath, "playing", false);
    if (!(punchAt >= loopStart && punchAt < loopStop)) return;
    for (const track of armedTracks) this.finishTake(uid, track, { startTick: punchAt, stopTick: punchAt + 96e9 * 4 });
  }
  /** @internal Tracks armed when each session's record pass began. */
  recording = /* @__PURE__ */ new Map();
  /**
   * Publish a take in progress the way LUNA does while punched in (fact 149):
   * `record/clips/<track>/<take>` with a `stop` that grows, and on an audio track the file being
   * written under `record/audio/<source>` with an overview that grows with it; a MIDI-capable
   * track's take gets a `midi` folder instead.
   */
  startRecordTake(sessionPath, track, punchAt) {
    const trackType = this.value(`${sessionPath}/tracks/${track}`, "track_type");
    const midi = trackType === "instrument" || trackType === "midi_matrix";
    const takePath = `${sessionPath}/record/clips/${track}/rec_${track}`;
    const sourceUid = midi ? void 0 : `recsrc_${track}`;
    this.addNode(takePath, {
      properties: {
        type: "track_record_clip",
        track_uid: track,
        session_uid: sessionPath.slice("/sessions/".length),
        input_node_uid: String(this.value(`${sessionPath}/tracks/${track}`, "input_node_uid") ?? ""),
        start: punchAt,
        stop: punchAt,
        length: 0,
        ...sourceUid ? { source_uid: sourceUid, source_start: 0, source_stop: 0 } : {}
      }
    });
    if (midi) {
      this.addNode(`${takePath}/midi`);
      return;
    }
    const filePath = `${sessionPath}/record/audio/${sourceUid}`;
    const stereo = this.value(`${sessionPath}/tracks/${track}`, "stem_format") === "stereo";
    this.addNode(filePath, { properties: { uid: sourceUid, stem_format: stereo ? "stereo" : "mono", sample_rate: 48e3, length: 0 } });
    for (const kind of ["overview", "overview_coarse"]) {
      this.addNode(`${filePath}/analysis/${kind}`, { properties: { count: 0, md5: null } });
      this.addNode(`${filePath}/analysis/${kind}/file`, { properties: { data: { count: 0, channels: stereo ? 2 : 1 } } });
    }
  }
  /**
   * Move every take in progress in a session on to `stopTick`, as LUNA does while recording:
   * `stop` and `length` grow, and an audio take's `source_stop`, file length and overview grow
   * with them (fact 149). The mock runs at 120 BPM: a beat is 0.5 s.
   *
   * @example
   * await session.transport.recordEnabled.set(true);
   * engine.recordProgress('abc', Luna.WHOLE_NOTE);
   */
  recordProgress(sessionUid, stopTick) {
    const sessionPath = `/sessions/${sessionUid}`;
    for (const track of this.recording.get(sessionUid) ?? []) {
      const takePath = `${sessionPath}/record/clips/${track}/rec_${track}`;
      if (!this.nodes.has(takePath)) continue;
      const start = Number(this.value(takePath, "start") ?? 0);
      const ns = Math.max(0, (stopTick - start) / 96e9 * 5e8);
      this.setValue(takePath, "stop", stopTick);
      this.setValue(takePath, "length", ns);
      const sourceUid = this.value(takePath, "source_uid");
      if (typeof sourceUid !== "string") continue;
      this.setValue(takePath, "source_stop", ns);
      const filePath = `${sessionPath}/record/audio/${sourceUid}`;
      this.setValue(filePath, "length", ns);
      for (const [kind, pairNs] of [
        ["overview", 125e9 / 48e3],
        ["overview_coarse", 125e9 / 48e3 * 12]
      ]) {
        const count = Math.floor(ns / pairNs);
        const file = `${filePath}/analysis/${kind}/file`;
        const data = this.value(file, "data");
        this.setValue(file, "data", { count, channels: data?.channels ?? 1 });
        this.setValue(`${filePath}/analysis/${kind}`, "count", count);
      }
    }
  }
  /**
   * Record MIDI messages into the take in progress on a track, as LUNA publishes them while
   * recording: one `midi/<rowid>` node each, its `tick` a session tick (fact 149). Returns the
   * row ids.
   *
   * @example
   * engine.recordMidi('abc', 'keys', [
   *   { tick: 0, status: 0x90, data1: 60, data2: 100 },
   *   { tick: Luna.QUARTER_NOTE, status: 0x80, data1: 60, data2: 0 },
   * ]);
   */
  recordMidi(sessionUid, trackUid, events) {
    const folder = `/sessions/${sessionUid}/record/clips/${trackUid}/rec_${trackUid}/midi`;
    if (!this.nodes.has(folder)) throw new Error(`MockEngine: no MIDI take recording on ${trackUid}`);
    const ids = [];
    for (const e of events) {
      const rowid = ++this.recordRowId;
      const packed = (e.status & 255) << 16 | (e.data1 & 127) << 8 | (e.data2 ?? 0) & 127;
      this.addNode(`${folder}/${rowid}`, { properties: { tick: e.tick, midi_data: packed, rowid } });
      ids.push(rowid);
    }
    return ids;
  }
  recordRowId = 0;
  post(path, data) {
    const { node: nodePath, name } = splitPath(path);
    const node = this.nodes.get(nodePath);
    const handler = node?.commands.get(name);
    if (!node || !handler) throw new UAError("uasrv.invalid_object", `post ${path}: uasrv.invalid_object`, { cmd: "post", path });
    const result = handler(data, this, nodePath);
    return result === void 0 ? null : result;
  }
  push(message, except) {
    const event = toEvent(message);
    const targets = [...this.ports].filter((port) => port !== except && port.wantsEvent(event.path));
    this.pendingDeliveries++;
    setTimeout(() => {
      for (const port of targets) port.deliver(event);
      this.pendingDeliveries--;
      if (this.pendingDeliveries === 0) {
        const waiters = this.settleWaiters;
        this.settleWaiters = [];
        for (const w of waiters) w();
      }
    }, 0);
  }
  /** @internal */
  detach(port) {
    this.ports.delete(port);
  }
};
function parseQuery(path) {
  const q = path.indexOf("?");
  const params = {};
  if (q < 0) return params;
  for (const pair of path.slice(q + 1).split("&")) {
    const eq = pair.indexOf("=");
    if (eq < 0) params[decodeURIComponent(pair)] = "";
    else params[decodeURIComponent(pair.slice(0, eq))] = decodeURIComponent(pair.slice(eq + 1));
  }
  return params;
}
var MockPort = class {
  /** @internal */
  constructor(engine) {
    this.engine = engine;
  }
  engine;
  status = "connected";
  subscriptions = /* @__PURE__ */ new Map();
  statusListeners = /* @__PURE__ */ new Set();
  get connected() {
    return this.status === "connected";
  }
  get(path, options) {
    const params = getOptionsToParams(options);
    const query = Object.entries(params).map(([k, v]) => `${k}=${v}`).join("&");
    return this.request("get", query ? `${path}${path.includes("?") ? "&" : "?"}${query}` : path, void 0);
  }
  async set(path, data) {
    await this.request("set", path, data);
  }
  post(path, data) {
    return this.request("post", path, data);
  }
  subscribe(path, handler, _options) {
    let sub = this.subscriptions.get(path);
    if (!sub) {
      sub = { path, handlers: /* @__PURE__ */ new Set() };
      this.subscriptions.set(path, sub);
      void this.request("subscribe", path, void 0).catch(() => void 0);
    }
    sub.handlers.add(handler);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const current = this.subscriptions.get(path);
      if (!current) return;
      current.handlers.delete(handler);
      if (current.handlers.size === 0) {
        this.subscriptions.delete(path);
        void this.request("unsubscribe", path, void 0).catch(() => void 0);
      }
    };
  }
  onStatus(listener) {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }
  async close() {
    if (this.status === "closed") return;
    this.engine.detach(this);
    this.setStatus("closed");
  }
  /**
   * Simulate a drop and recovery; subscriptions survive as they do on the real port.
   * Anything `during` does happens while the port is down, so its pushes are missed.
   */
  async reconnect(during) {
    this.setStatus("disconnected");
    await during?.();
    await this.engine.settled();
    await new Promise((r) => setTimeout(r, 0));
    this.setStatus("connected");
  }
  /** @internal True when this port subscribed to exactly `path`. */
  subscribesTo(path) {
    return this.status === "connected" && this.subscriptions.has(path);
  }
  /** @internal */
  wantsEvent(path) {
    if (this.status !== "connected") return false;
    for (const sub of this.subscriptions.values()) {
      if (eventMatches(sub.path, path)) return true;
    }
    return false;
  }
  /** @internal */
  deliver(event) {
    if (this.status !== "connected") return;
    for (const sub of this.subscriptions.values()) {
      if (!eventMatches(sub.path, event.path)) continue;
      for (const handler of sub.handlers) handler(event);
    }
  }
  request(verb, path, data) {
    if (this.status !== "connected") return Promise.reject(new ConnectionLost(verb, path));
    return this.engine.handle(this, verb, path, data);
  }
  setStatus(status) {
    if (this.status === status) return;
    this.status = status;
    for (const listener of this.statusListeners) listener(status);
  }
};
function githubRepoUrl(input) {
  const url = input.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  if (!/^github\.com\//i.test(url)) return void 0;
  const [owner = "", rawName = ""] = (url.slice(11).split(/[?#]/)[0] ?? "").split("/");
  const name = rawName.replace(/\.git$/i, "");
  const ok = (part) => /^[A-Za-z0-9._-]+$/.test(part) && !/^\.+$/.test(part);
  return ok(owner) && ok(name) ? `https://github.com/${owner}/${name}` : void 0;
}
function driveDownloadUrl(input) {
  const url = input.trim().replace(/^https?:\/\//i, "");
  const slash = url.indexOf("/");
  if (slash < 0) return void 0;
  const host = url.slice(0, slash).toLowerCase();
  if (!["drive.google.com", "docs.google.com", "drive.usercontent.google.com"].includes(host)) return void 0;
  const rest = url.slice(slash + 1).split("#")[0] ?? "";
  const [path = "", query = ""] = rest.split("?");
  const param = (name) => {
    const hit = query.split("&").find((p) => p.split("=")[0] === name);
    return hit === void 0 ? "" : decodeURIComponent(hit.slice(name.length + 1));
  };
  const file = /^(?:u\/[^/]+\/)?file\/d\/([^/]*)/.exec(path);
  const id = file ? file[1] ?? "" : ["open", "uc", "download"].includes(path) ? param("id") : "";
  const key = param("resourcekey");
  const ok = (part) => /^[A-Za-z0-9_-]*$/.test(part);
  if (!id || !ok(id) || !ok(key)) return void 0;
  return `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t${key ? `&resourcekey=${key}` : ""}`;
}
function iCloudShareUrl(input) {
  const url = input.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  if (!/^icloud\.com\/iclouddrive\//i.test(url)) return void 0;
  const guid = url.slice(23).split(/[#?/]/)[0] ?? "";
  return /^[A-Za-z0-9_-]+$/.test(guid) ? `https://www.icloud.com/iclouddrive/${guid}` : void 0;
}
function dropboxDownloadUrl(input) {
  const url = input.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  if (!/^dropbox\.com\//i.test(url)) return void 0;
  const rest = url.slice(12).split("#")[0] ?? "";
  const [path = "", query = ""] = rest.split("?");
  const parts = path.split("/").filter(Boolean);
  const current = parts.length === 4 && parts[0] === "scl" && parts[1] === "fi";
  const older = parts.length === 3 && parts[0] === "s";
  if (!current && !older) return void 0;
  const id = parts[parts.length - 2] ?? "";
  const name = parts[parts.length - 1] ?? "";
  const hit = query.split("&").find((p) => p.split("=")[0] === "rlkey");
  const key = hit === void 0 ? "" : decodeURIComponent(hit.slice(6));
  const idOk = (part) => /^[A-Za-z0-9_-]*$/.test(part);
  let decoded;
  try {
    decoded = decodeURIComponent(name);
  } catch {
    return void 0;
  }
  if (!id || !idOk(id) || !/^[A-Za-z0-9._%~+()!-]+$/.test(name) || /[/\\]/.test(decoded) || !idOk(key) || current && !key) return void 0;
  return `https://www.dropbox.com/${parts.join("/")}?${key ? `rlkey=${key}&` : ""}dl=1`;
}
function localContentHost(id) {
  let host = "";
  for (const byte of new TextEncoder().encode(id)) {
    const c = String.fromCharCode(byte);
    if (/[a-z0-9.-]/.test(c)) host += c;
    else if (c === "_") host += "__";
    else host += `_${byte.toString(16).padStart(2, "0")}`;
  }
  return host || "_";
}
function encodeMediaPath(path) {
  let out = "";
  for (const byte of new TextEncoder().encode(path.replaceAll("\\", "/"))) {
    const c = String.fromCharCode(byte);
    out += /[A-Za-z0-9\-._~/]/.test(c) ? c : `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
  }
  return out.startsWith("/") ? out : `/${out}`;
}
function normalizeFolder(path) {
  const drive = /^[A-Za-z]:/.exec(path)?.[0] ?? "";
  const parts = [];
  for (const part of path.slice(drive.length).split(/[\\/]+/).slice(1)) {
    if (part === "" || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return `${drive}/${parts.join("/")}`;
}
function naturalCompare(a, b) {
  const s1 = [...a].map((c) => c.codePointAt(0)).concat(0);
  const s2 = [...b].map((c) => c.codePointAt(0)).concat(0);
  const isSpace = (c) => c === 32 || c >= 9 && c <= 13;
  const isDigit = (c) => c >= 48 && c <= 57;
  const isAlnum = (c) => isDigit(c) || c >= 65 && c <= 90 || c >= 97 && c <= 122;
  const upper = (c) => c >= 97 && c <= 122 ? c - 32 : c;
  let i = 0;
  let j = 0;
  for (let first = true; ; first = false) {
    const space1 = isSpace(s1[i]);
    const space2 = isSpace(s2[j]);
    if (!first && space1 !== space2) {
      if (s1[i] === 0) return -1;
      if (s2[j] === 0) return 1;
      return space2 ? 1 : -1;
    }
    while (isSpace(s1[i])) i++;
    while (isSpace(s2[j])) j++;
    if (isDigit(s1[i]) && isDigit(s2[j])) {
      const result = s1[i] === 48 || s2[j] === 48 ? digitsLeft(s1, i, s2, j) : digitsRight(s1, i, s2, j);
      if (result !== 0) return result;
    }
    let c1 = s1[i++];
    let c2 = s2[j++];
    if (c1 !== c2) {
      c1 = upper(c1);
      c2 = upper(c2);
    }
    if (c1 === c2) {
      if (c1 === 0) return 0;
      continue;
    }
    const alnum1 = isAlnum(c1);
    const alnum2 = isAlnum(c2);
    if (alnum2 && !alnum1) return -1;
    if (alnum1 && !alnum2) return 1;
    return c1 < c2 ? -1 : 1;
  }
  function digitsRight(x, xi, y, yi) {
    for (let bias = 0; ; xi++, yi++) {
      const d1 = isDigit(x[xi]);
      const d2 = isDigit(y[yi]);
      if (!d1 && !d2) return bias;
      if (!d1) return -1;
      if (!d2) return 1;
      if (x[xi] !== y[yi] && bias === 0) bias = x[xi] < y[yi] ? -1 : 1;
    }
  }
  function digitsLeft(x, xi, y, yi) {
    for (; ; xi++, yi++) {
      const d1 = isDigit(x[xi]);
      const d2 = isDigit(y[yi]);
      if (!d1 && !d2) return 0;
      if (!d1) return -1;
      if (!d2) return 1;
      if (x[xi] < y[yi]) return -1;
      if (x[xi] > y[yi]) return 1;
    }
  }
}
function storageCommands(root) {
  const validName = (v) => typeof v === "string" && v !== "" && !v.includes("/");
  const asJson = (v) => v === void 0 ? null : JSON.parse(JSON.stringify(v));
  const target = (body, verb) => {
    if (body.context === void 0 || body.record === void 0 || body.field === void 0) {
      throw new UAError("uasrv.missing_field", `${verb}: uasrv.missing_field`, { cmd: "post", path: `${root}/${verb}` });
    }
    if (!validName(body.context) || !validName(body.record) || !validName(body.field)) {
      throw new UAError("uasrv.invalid_value", `${verb}: uasrv.invalid_value`, { cmd: "post", path: `${root}/${verb}` });
    }
    return { node: `${root}/${body.context}/${body.record}`, field: body.field };
  };
  const prune = (engine, context) => {
    for (const record of engine.children(`${root}/${context}`)) {
      const path = `${root}/${context}/${record}`;
      if (engine.propertyNames(path).length === 0) engine.removeNode(path);
    }
    if (engine.children(`${root}/${context}`).length === 0) engine.removeNode(`${root}/${context}`);
  };
  return {
    add_field: (data, engine) => {
      const body = data ?? {};
      const { node, field } = target(body, "add_field");
      if (engine.has(node) && engine.propertyNames(node).includes(field)) return null;
      if (!engine.has(node)) engine.addNode(node, { properties: { [field]: asJson(body.value) } });
      else engine.setValue(node, field, asJson(body.value));
      return null;
    },
    set_field: (data, engine) => {
      const body = data ?? {};
      if (body.value === void 0) throw new UAError("uasrv.missing_field", "set_field: uasrv.missing_field", { cmd: "post", path: `${root}/set_field` });
      const { node, field } = target(body, "set_field");
      if (!engine.has(node) || !engine.propertyNames(node).includes(field)) {
        throw new UAError("uasrv.invalid_property", "set_field: uasrv.invalid_property", { cmd: "post", path: `${root}/set_field` });
      }
      engine.setValue(node, field, asJson(body.value));
      return null;
    },
    remove_field: (data, engine) => {
      const body = data ?? {};
      const path = `${root}/remove_field`;
      if (body.context === void 0) throw new UAError("uasrv.missing_field", "remove_field: uasrv.missing_field", { cmd: "post", path });
      const record = body.record ?? "";
      const field = body.field ?? "";
      if (!validName(body.context) || record === "" && field !== "") throw new UAError("uasrv.invalid_value", "remove_field: uasrv.invalid_value", { cmd: "post", path });
      const contextPath = `${root}/${body.context}`;
      if (!engine.has(contextPath)) return null;
      if (record === "") engine.removeNode(contextPath);
      else if (field === "") engine.removeNode(`${contextPath}/${String(record)}`);
      else engine.deleteValue(`${contextPath}/${String(record)}`, String(field));
      prune(engine, body.context);
      return null;
    }
  };
}
function sameWindow(a, b) {
  return a.session_uid === b.session_uid && a.channel_uid === b.channel_uid && a.insert_type === b.insert_type;
}
