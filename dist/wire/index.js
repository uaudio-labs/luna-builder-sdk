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
    super("not_running", `No LUNA engine at ${url}. Start LUNA and open a session, or connect with { engine: 'wasm' }.`);
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
   * attempt fails; later drops are handled by reconnect instead.
   */
  open() {
    if (this.closed) return Promise.reject(new ConnectionLost());
    if (this.status === "connected") return Promise.resolve();
    return new Promise((resolve, reject) => {
      let settled = false;
      const socket = new this.Socket(this.url);
      this.socket = socket;
      this.setStatus("connecting");
      socket.onopen = () => {
        settled = true;
        this.everConnected = true;
        this.reconnectDelay = this.reconnectMinMs;
        this.setStatus("connected");
        this.resubscribeAll();
        this.startHeartbeat();
        resolve();
      };
      socket.onmessage = (ev) => this.handleFrame(ev.data);
      socket.onerror = () => {
      };
      socket.onclose = () => {
        if (this.socket !== socket) return;
        this.socket = void 0;
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

// src/wire/mock-port.ts
var EMPTY_MIDI_TABLE = () => ({ operation: "update", row_ids: [], enabled: [], midi_data: [], tick: [] });
function encodeMidiTable(operation, rows) {
  return {
    operation,
    row_ids: rows.map((r) => r.rowid),
    enabled: rows.map((r) => r.enabled),
    midi_data: rows.map((r) => (r.status & 255) << 16 | (r.data1 & 127) << 8 | r.data2 & 127),
    tick: rows.map((r) => r.tick)
  };
}
function decodeMidiTable(value) {
  const table = value;
  return (table?.row_ids ?? []).map((rowid, i) => {
    const packed = table?.midi_data?.[i] ?? 0;
    return { rowid, tick: table?.tick?.[i] ?? 0, status: packed >>> 16 & 255, data1: packed >>> 8 & 127, data2: packed & 127, enabled: table?.enabled?.[i] !== false };
  });
}
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
var MockEngine = class {
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
  constructor() {
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
         * folder, and `cancel` throws the partial away.
         */
        import_file: (data, engine) => {
          const body = data ?? {};
          const pkg = body.session_package_uid ?? "";
          switch (body.phase) {
            case "begin": {
              const uid = `src${engine.imports.size + engine.children(`/workspace/sessions/${pkg}/audio`).length + 1}`;
              engine.imports.set(uid, { pkg, name: body.name ?? uid, bytes: 0 });
              return { uid };
            }
            case "transfer": {
              const pending = engine.imports.get(body.uid ?? "");
              if (!pending) throw new UAError("uasrv.invalid_object", "import_file: no import in progress for that uid", { cmd: "post", path: "/workspace/import_file" });
              const encoded = body.file_data ?? "";
              const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
              pending.bytes += Math.max(0, encoded.length / 4 * 3 - padding);
              return null;
            }
            case "end": {
              const uid = body.uid ?? "";
              const pending = engine.imports.get(uid);
              if (!pending) throw new UAError("uasrv.invalid_object", "import_file: no import in progress for that uid", { cmd: "post", path: "/workspace/import_file" });
              engine.imports.delete(uid);
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
    this.addNode("/plugins", { properties: { type: "folder" }, commands: { rescan: () => null } });
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
    this.addNode("/gui/add_ons/com.example.demo", { properties: { id: "com.example.demo", title: "Demo", target: "window", icon: "" } });
    this.addNode("/gui/file_chooser");
  }
  /** What the next mock file dialog "selects"; empty means the user cancelled. */
  nextDialogFiles = [];
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
  /** Add a plugin to the catalog. */
  addPlugin(pluginId, options = {}) {
    this.addNode(`/plugins/${pluginId}`, {
      properties: {
        plugin_id: pluginId,
        name: options.name ?? pluginId,
        version: "1.0.0",
        description: "",
        installed: true,
        favorite: false,
        authorized: null,
        default_preset_uid: null,
        manifest: { manufacturer: options.manufacturer ?? "Mock", name: options.name ?? pluginId, plugin_id: pluginId, categories: options.categories ?? [], short_names: [] }
      }
    });
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
  }
  /** Engine-side property change: updates the tree and pushes to every subscribed port. */
  setValue(nodePath, property, value) {
    const node = this.nodes.get(normalize(nodePath));
    if (!node) throw new Error(`MockEngine: no node ${nodePath}`);
    node.properties.set(property, value);
    this.push({ path: `${normalize(nodePath)}/${property}/value`, data: value }, void 0);
  }
  /**
   * The session `location` LUNA reports for `tick`: bar|beat from the session's time
   * signatures, whose `bar` numbers need not put bar 1 at tick 0 (fact 91).
   */
  locationAt(sessionPath, tick) {
    const beatTicks = 96e9;
    const sigs = this.children(`${sessionPath}/time_signatures`).map((id) => this.nodes.get(`${sessionPath}/time_signatures/${id}`).properties).map((p) => ({ tick: Number(p.get("tick") ?? 0), bar: Number(p.get("bar") ?? 1), n: Number(p.get("numerator") ?? 4), d: Number(p.get("denominator") ?? 4) })).sort((a, b) => a.tick - b.tick);
    const sig = sigs.filter((x) => x.tick <= tick).at(-1) ?? sigs[0] ?? { tick: 0, bar: 1, n: 4, d: 4 };
    const beat = beatTicks * 4 / sig.d;
    const rel = tick - sig.tick;
    const inBar = (rel % (beat * sig.n) + beat * sig.n) % (beat * sig.n);
    const previous = this.nodes.get(sessionPath)?.properties.get("location");
    return {
      tick,
      bar_beat: { bar: sig.bar + Math.floor(rel / (beat * sig.n)), beat: 1 + Math.floor(inBar / beat), tick: inBar % beat },
      tempo: previous?.tempo ?? 120,
      time_signature: { numerator: sig.n, denominator: sig.d },
      playing: this.nodes.get(sessionPath)?.properties.get("playing") === true
    };
  }
  /**
   * A MIDI clip's table (facts 39-41): apply `rows` and push the matching delta, exactly as
   * LUNA does — the stored property stays the whole table, so a `get` answers the table
   * while subscribers see only the delta.
   *
   * `added` and `changed` carry rows; `deleted` needs only their `rowid`s. Rows given
   * without a `rowid` get the next free one. Ticks are table ticks.
   *
   * @example
   * engine.midiEdit(clipPath, 'added', [{ tick: 0, status: 0x90, data1: 60, data2: 100 }]);
   * engine.midiEdit(clipPath, 'deleted', [{ rowid: 1 }]);
   */
  midiEdit(clipPath, operation, rows) {
    const table = `${normalize(clipPath)}/midi/table`;
    if (!this.nodes.has(table)) this.addNode(table, { properties: { row_data: EMPTY_MIDI_TABLE() } });
    const stored = decodeMidiTable(this.value(table, "row_data"));
    let next = stored.length ? Math.max(...stored.map((r) => r.rowid)) + 1 : 1;
    const applied = [];
    for (const row of rows) {
      const rowid = row.rowid ?? next++;
      if (operation === "deleted") {
        applied.push({ rowid, tick: 0, status: 0, data1: 0, data2: 0, enabled: true });
        continue;
      }
      const merged = { rowid, tick: row.tick ?? 0, status: row.status ?? 144, data1: row.data1 ?? 60, data2: row.data2 ?? 0, enabled: row.enabled ?? true };
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
  children(nodePath) {
    return [...this.nodes.get(normalize(nodePath))?.children ?? []];
  }
  /** @internal Uploads between `begin` and `end` (fact 42). */
  imports = /* @__PURE__ */ new Map();
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
        if (body.track_type === "bus") {
          const id2 = `bus${engine.children(`${base}/buses`).length + 1}`;
          engine.addBus(uid, id2, { name: body.name ?? "Bus", busType: "aux", stemFormat: body.stem_format ?? "stereo" });
          return { uid: id2 };
        }
        const id = `t${engine.children(`${base}/tracks`).length + 1}`;
        engine.addTrack(uid, id, { name: body.name ?? "Untitled", trackType: body.track_type ?? "audio", stemFormat: body.stem_format ?? "mono" });
        return { track_uid: id };
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
        const id = `clip${engine.children(`${base}/playlists/${playlist}/clips`).length + 1}`;
        engine.addNode(`${base}/playlists/${playlist}/clips/${id}`, {
          properties: { uid: id, name: body.name ?? "Clip", start: body.start ?? 0, stop: body.stop ?? 0, source_uid: body.source_uid ?? "", source_start: body.source_start ?? 0, source_stop: body.source_stop ?? 0, clip_type: body.clip_type ?? 0, gain: 0, bypass: false, midi_source_start: 0, layer: 0, mute: false }
        });
        if (body.clip_type === 2) engine.addNode(`${base}/playlists/${playlist}/clips/${id}/midi/table`, { properties: { row_data: EMPTY_MIDI_TABLE() } });
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
          engine.addNode(`${base}/playlists/pl_${t}_${n}`, { properties: { uid: `pl_${t}_${n}`, name: `V${n}`, track_uid: t, version: n, stem_format: "mono", frozen: false } });
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
          engine.setValue(path, "plugin_id", empty ? null : ins.plugin_id);
          engine.setValue(path, "plugin_name", null);
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
            engine.addControl(`${path}/controls/bypass`, "parameter", { discrete: true, value: 1, real: true, str: "in", automatable: true });
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
      set_key_signature: () => null,
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
      move_clips: () => null,
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
      properties: { context_type: "main", focus: "tracks", selection_start: null, selection_stop: null, selection_tracks: null, selection_playlists: null, selection_notes: null, last_selected_track: null, pixels_per_tick: 1e-10, grid_enable: true, grid: "1_4" }
    });
    this.addNode(`${base}/contexts/main/commands`, {
      commands: {
        set_inserts_in_out: (data, engine) => {
          const body = data ?? {};
          const channel = engine.has(`${base}/tracks/${body.channel_uid}`) ? `${base}/tracks/${body.channel_uid}` : `${base}/buses/${body.channel_uid}`;
          for (const slot of body.inserts ?? []) {
            const ctl = engine.value(`${channel}/effects/${slot}`, "bypass_control");
            if (typeof ctl === "string" && ctl) engine.setValue(`${channel}/effects/${slot}/controls/${ctl}`, "value", body.value ? 1 : 0);
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
        select_all: () => null,
        copy: () => null,
        cut: () => null,
        paste: () => null,
        duplicate: () => null,
        /**
         * Acts on `selection_notes`, not on a clip (fact 74): deletes the selected note-on
         * rows and the note-offs that terminate them.
         */
        clear: (_d, engine) => {
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
         * Writes notes onto a playlist, making the MIDI clip to hold them if there is none
         * there, and then **selects** what it made: that is where the caller reads the new
         * row ids from (fact 74).
         */
        create_note: (data, engine) => {
          const body = data ?? {};
          const playlist = body.playlist_uid;
          if (!playlist || !engine.has(`${base}/playlists/${playlist}`)) throw new UAError("uasrv.invalid_object", "create_note: no such playlist", { cmd: "post", path: `${base}/create_note` });
          const notes = body.notes ?? (body.note !== void 0 ? [{ note: body.note, start: body.start, stop: body.stop, velocity: body.velocity }] : []);
          if (!notes.length) return null;
          const span = { start: Math.min(...notes.map((n) => n.start ?? 0)), stop: Math.max(...notes.map((n) => n.stop ?? 0)) };
          let clipUid = engine.children(`${base}/playlists/${playlist}/clips`).find((uid2) => engine.value(`${base}/playlists/${playlist}/clips/${uid2}`, "clip_type") === 2);
          if (!clipUid) {
            clipUid = `midi${engine.children(`${base}/playlists/${playlist}/clips`).length + 1}`;
            engine.addNode(`${base}/playlists/${playlist}/clips/${clipUid}`, {
              properties: { uid: clipUid, name: "MIDI", start: span.start, stop: span.stop, source_uid: "", source_start: 0, source_stop: 0, clip_type: 2, gain: 0, bypass: false, render_source_uid: null, render_state: "none", midi_source_start: 0 }
            });
            engine.addNode(`${base}/playlists/${playlist}/clips/${clipUid}/midi/table`, { properties: { row_data: EMPTY_MIDI_TABLE() } });
          }
          const clipPath = `${base}/playlists/${playlist}/clips/${clipUid}`;
          const origin = Number(engine.value(clipPath, "midi_source_start") ?? 0);
          const before = new Set(engine.midiRows(clipPath).map((r) => r.rowid));
          engine.midiEdit(
            clipPath,
            "added",
            notes.flatMap((n) => [
              { tick: (n.start ?? 0) + origin, status: 144, data1: n.note ?? 60, data2: n.velocity_on ?? n.velocity ?? 100 },
              { tick: (n.stop ?? 0) + origin, status: 128, data1: n.note ?? 60, data2: n.velocity_off ?? 0 }
            ])
          );
          const added = engine.midiRows(clipPath).filter((r) => !before.has(r.rowid) && (r.status & 240) === 144 && r.data2 > 0);
          engine.setValue(`${base}/contexts/main`, "focus", "notes");
          engine.setValue(`${base}/contexts/main`, "selection_playlists", [playlist]);
          engine.setValue(`${base}/contexts/main`, "selection_start", span.start);
          engine.setValue(`${base}/contexts/main`, "selection_stop", span.stop);
          engine.setValue(`${base}/contexts/main`, "selection_notes", [
            { playlist_uid: playlist, notes: added.map((r) => [r.data1, r.tick - origin, r.tick - origin, r.rowid]) }
          ]);
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
        nudge: () => null,
        separate_clips: () => null,
        consolidate: () => null,
        mute_clips: () => null
      }
    });
    this.addNode(`${base}/tempo_map/1`, { properties: { tick: 0, time: 0, tempo: 120 } });
    this.addNode(`${base}/time_signatures/1`, { properties: { tick: 0, bar: 1, partial: false, numerator: 4, denominator: 4 } });
    this.addNode(`${base}/key_signatures`);
    this.addNode(`${base}/markers`);
    this.addPackage(pkg, { name: options.name ?? uid, lastOpened: Date.now() });
    for (let i = 0; i < 4; i++) this.addBus(uid, `cue${i + 1}_${uid}`, { name: `CUE ${i + 1}`, busType: `cue_${i}`, stemFormat: "stereo" });
    this.addBus(uid, `master_${uid}`, { name: "Main Output", busType: "master", stemFormat: "stereo", color: 4294948970 });
    this.addNode(`/workspace/sessions/${pkg}/audio`);
    for (const name of options.tracks ?? []) this.addTrack(uid, name, { name });
    if (options.focused ?? true) this.setValue("/sessions", "focused_session", uid);
  }
  /** Add a track with the standard control layout and one playlist. */
  addTrack(sessionUid, id, options = {}) {
    const base = `/sessions/${sessionUid}`;
    const order = this.children(`${base}/tracks`).length;
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
        record_mute: false
      },
      options.stemFormat === "stereo"
    );
    this.routeCues(sessionUid, `${base}/tracks/${id}`);
    this.addNode(`${base}/playlists/${playlist}`, { properties: { uid: playlist, name: "V1", track_uid: id, version: 1, stem_format: options.stemFormat ?? "mono", frozen: false } });
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
   * Add a bus. `busType` is `aux`, `master` or `cue_0`..`cue_3`; cue buses have only a main
   * output (fact 83). Orders after everything already in the session.
   */
  addBus(sessionUid, id, options = {}) {
    const base = `/sessions/${sessionUid}`;
    const busType = options.busType ?? "aux";
    const stereo = (options.stemFormat ?? "stereo") === "stereo";
    const order = this.children(`${base}/buses`).length;
    this.addChannel(
      `${base}/buses/${id}`,
      { uid: id, name: options.name ?? id, bus_type: busType, order, stem_format: options.stemFormat ?? "stereo", color: options.color ?? 4282400832, folder_mode: "none", folder_uid: null, automation_mode: "read", frozen: false, enabled: true, comments: "" },
      stereo,
      !busType.startsWith("cue_")
    );
    if (!busType.startsWith("cue_")) this.routeCues(sessionUid, `${base}/buses/${id}`);
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
        this.addControl(`${path}/outputs/${out}/controls/${name}`, name, isSwitch ? { discrete: true, value: 0, real: false, str: "false", automatable: true } : { discrete: false, value: 0, real: 0, str: isPan ? "C" : "0.0", automatable: true, normalized: isPan ? 0.5 : 0.78 });
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
        string_values: o.discrete ? ["false", "true"] : []
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
        }
      }
    });
    this.addNode(`${path}/automation`);
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
    const isTrack = /^\/sessions\/[^/]+\/tracks\/[^/]+$/.test(nodePath);
    if (isTrack && name === "input_monitor" && data === true && this.value("/preferences", "record_mute") === true) {
      throw new UAError("uasrv.invalid_value", `set ${path}: uasrv.invalid_value`, { cmd: "set", path });
    }
    node.properties.set(name, data);
    this.push({ path: `${nodePath}/${name}/value`, data }, from);
    if (name === "record_enabled" && /^\/sessions\/[^/]+$/.test(nodePath)) this.runRecord(nodePath, data === true || data === 1);
    if (name === "play_start" && /^\/sessions\/[^/]+$/.test(nodePath) && node.properties.get("playing") !== true) this.setValue(nodePath, "location", this.locationAt(nodePath, Number(data)));
    if (isTrack && name === "input_monitor") this.setValue(nodePath, "input_monitor_state", data === true);
    return null;
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
      this.recording.set(uid, this.children(`${sessionPath}/tracks`).filter((t) => this.value(`${sessionPath}/tracks/${t}`, "record_enabled") === true));
      return;
    }
    const armedTracks = this.recording.get(uid) ?? [];
    this.recording.delete(uid);
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
export {
  ConnectionLost,
  DEFAULT_LUNA_PORT,
  Disposed,
  FloatLiteral,
  MockEngine,
  MockPort,
  NoSessionOpen,
  NotRunning,
  RequestTimeout,
  UAError,
  Unsupported,
  WebSocketPort,
  appendParams,
  consoleLog,
  correlationId,
  decodeMessage,
  encodePayload,
  encodeRequest,
  eventMatches,
  expandMulti,
  float,
  getOptionsToParams,
  joinPath,
  propertyValue,
  splitPath,
  stripValueSuffix,
  toEvent
};
//# sourceMappingURL=index.js.map