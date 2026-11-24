"use strict";
var Luna = (() => {
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

  // src/global.ts
  var global_exports = {};
  __export(global_exports, {
    ADD_ON_CATEGORIES: () => ADD_ON_CATEGORIES,
    AUTOMATION_MODES: () => AUTOMATION_MODES,
    ActiveAudioEngine: () => ActiveAudioEngine,
    AddOn: () => AddOn,
    AddOnInstance: () => AddOnInstance,
    AnalysisNode: () => AnalysisNode,
    Assistant: () => Assistant,
    AudioSource: () => AudioSource,
    AutoGain: () => AutoGain,
    AutoGainChannel: () => AutoGainChannel,
    Automation: () => Automation,
    BUS_TYPES: () => BUS_TYPES,
    Bindings: () => Bindings,
    BreakpointNode: () => BreakpointNode,
    Bus: () => Bus,
    COARSE_PAIRS_PER_FINE: () => COARSE_PAIRS_PER_FINE,
    COARSE_PAIR_NS: () => COARSE_PAIR_NS,
    CONTROL_TYPES: () => CONTROL_TYPES,
    CUE_COUNT: () => CUE_COUNT,
    Cell: () => Cell,
    Channel: () => Channel,
    Chord: () => Chord,
    ChordAnalysis: () => ChordAnalysis,
    Chords: () => Chords,
    Client: () => Client,
    Clip: () => Clip,
    Collection: () => Collection,
    CompiledClip: () => CompiledClip,
    CompiledClips: () => CompiledClips,
    ConnectionLost: () => ConnectionLost,
    Context: () => Context,
    Control: () => Control,
    Controls: () => Controls,
    DEFAULT_LUNA_PORT: () => DEFAULT_LUNA_PORT,
    DEFAULT_SHORTCUTS: () => DEFAULT_SHORTCUTS,
    DISPLAY_TICKS_PER_BEAT: () => DISPLAY_TICKS_PER_BEAT,
    Device: () => Device,
    DeviceInput: () => DeviceInput,
    DeviceInputs: () => DeviceInputs,
    DeviceOutput: () => DeviceOutput,
    DeviceOutputs: () => DeviceOutputs,
    Devices: () => Devices,
    Disposed: () => Disposed,
    Drivers: () => Drivers,
    EDIT_SHORTCUTS: () => EDIT_SHORTCUTS,
    EDIT_TIMEOUT_MS: () => EDIT_TIMEOUT_MS,
    EIGHTH_NOTE: () => EIGHTH_NOTE,
    Effect: () => Effect,
    Error: () => UAError,
    ErrorCodes: () => ErrorCodes,
    ErrorNotice: () => ErrorNotice,
    ErrorNotices: () => ErrorNotices,
    FOLDER_MODES: () => FOLDER_MODES,
    FloatLiteral: () => FloatLiteral,
    FolderTree: () => FolderTree,
    GROUP_ATTRIBUTES: () => GROUP_ATTRIBUTES,
    Group: () => Group,
    Groups: () => Groups,
    Gui: () => Gui,
    GuiWindow: () => GuiWindow,
    HALF_NOTE: () => HALF_NOTE,
    HIDDEN_SESSION_TYPES: () => HIDDEN_SESSION_TYPES,
    INPUT_ANALYSIS_KINDS: () => INPUT_ANALYSIS_KINDS,
    INSERT_ALIAS_PREFIX: () => INSERT_ALIAS_PREFIX,
    InstrumentAnalysis: () => InstrumentAnalysis,
    Job: () => Job,
    JobRun: () => JobRun,
    Jobs: () => Jobs,
    KeyAnalysis: () => KeyAnalysis,
    KeySignature: () => KeySignature,
    LUNA_CHANNEL_PLUGIN_ID: () => LUNA_CHANNEL_PLUGIN_ID,
    LUNA_DEVICE_UID: () => LUNA_DEVICE_UID2,
    LUNA_EXTENSION_PLUGIN_IDS: () => LUNA_EXTENSION_PLUGIN_IDS,
    Lyric: () => Lyric,
    Lyrics: () => Lyrics,
    MAX_CUE_BUSES: () => MAX_CUE_BUSES,
    MAX_SECRET_BYTES: () => MAX_SECRET_BYTES,
    MAX_SECRET_NAME_LENGTH: () => MAX_SECRET_NAME_LENGTH,
    MAX_SYSEX_BYTES: () => MAX_SYSEX_BYTES,
    Marker: () => Marker,
    Markers: () => Markers,
    Meter: () => Meter,
    MidiClip: () => MidiClip,
    MidiDevice: () => MidiDevice,
    MidiDevices: () => MidiDevices,
    MidiInput: () => MidiInput,
    MidiOutputAssignment: () => MidiOutputAssignment,
    MidiOutputs: () => MidiOutputs,
    MidiPort: () => MidiPort,
    MockEngine: () => MockEngine,
    MockPort: () => MockPort,
    Musical: () => Musical,
    NEG_INFINITY_DB: () => NEG_INFINITY_DB,
    NoSessionOpen: () => NoSessionOpen,
    Node: () => Node,
    NotRunning: () => NotRunning,
    ONE_TWENTY_EIGHTH_NOTE: () => ONE_TWENTY_EIGHTH_NOTE,
    OVERVIEW_PAIR_NS: () => OVERVIEW_PAIR_NS,
    Output: () => Output,
    PLUGIN_ERROR_MISSING: () => PLUGIN_ERROR_MISSING,
    POST_RECORD_COMMANDS: () => POST_RECORD_COMMANDS,
    PROGRESS_SUPPRESSION_MAX_MS: () => PROGRESS_SUPPRESSION_MAX_MS,
    Playlist: () => Playlist,
    Plugin: () => Plugin,
    Plugins: () => Plugins,
    PreferenceContext: () => PreferenceContext,
    Preferences: () => Preferences,
    PresetSelection: () => PresetSelection,
    Presets: () => Presets,
    QUARTER_NOTE: () => QUARTER_NOTE,
    QwertyMidi: () => QwertyMidi,
    RECORD_LOOP_MARGIN_TICKS: () => RECORD_LOOP_MARGIN_TICKS,
    RecentSessions: () => RecentSessions,
    RecordTake: () => RecordTake,
    RecordTakes: () => RecordTakes,
    Render: () => Render,
    Renders: () => Renders,
    RequestTimeout: () => RequestTimeout,
    SEND_COUNT: () => SEND_COUNT,
    SESSION_TYPES: () => SESSION_TYPES2,
    SIXTEENTH_NOTE: () => SIXTEENTH_NOTE,
    SIXTY_FOURTH_NOTE: () => SIXTY_FOURTH_NOTE,
    STEM_FORMATS: () => STEM_FORMATS,
    Scheduler: () => Scheduler,
    Secrets: () => Secrets,
    SendMidi: () => SendMidi,
    Session: () => Session,
    SessionPackage: () => SessionPackage,
    SessionStorage: () => SessionStorage,
    Sessions: () => Sessions,
    Shortcuts: () => Shortcuts,
    SourceAnalysis: () => SourceAnalysis,
    SourceOrigin: () => SourceOrigin,
    SourceUsage: () => SourceUsage,
    StorageContext: () => StorageContext,
    Store: () => Store,
    THIRTY_SECOND_NOTE: () => THIRTY_SECOND_NOTE,
    TICKS_PER_BEAT: () => TICKS_PER_BEAT,
    TICKS_PER_DISPLAY_TICK: () => TICKS_PER_DISPLAY_TICK,
    TRACK_PRESET_CATEGORIES: () => TRACK_PRESET_CATEGORIES,
    TRACK_TYPES: () => TRACK_TYPES,
    Taper: () => Taper,
    TempoAnalysis: () => TempoAnalysis,
    TempoEvent: () => TempoEvent,
    TimeSignature: () => TimeSignature,
    Timeline: () => Timeline,
    Track: () => Track,
    TrackPresetSelection: () => TrackPresetSelection,
    TransientAnalysis: () => TransientAnalysis,
    Transport: () => Transport,
    Unsupported: () => Unsupported,
    VERSION: () => VERSION2,
    WARP_TRANSIENT_ZONE_NS: () => WARP_TRANSIENT_ZONE_NS,
    WAVEFORM_PAGE: () => WAVEFORM_PAGE,
    WHOLE_NOTE: () => WHOLE_NOTE,
    Warp: () => Warp,
    Warps: () => Warps,
    WasmEngine: () => WasmEngine,
    WasmPort: () => WasmPort,
    Waveforms: () => Waveforms,
    WebSocketPort: () => WebSocketPort,
    Workspace: () => Workspace,
    addOnTarget: () => addOnTarget,
    audioNsAtTick: () => audioNsAtTick,
    automationModeOrdinal: () => automationModeOrdinal,
    beatsToTicks: () => beatsToTicks,
    bindClock: () => bindClock,
    bindDrag: () => bindDrag,
    bindGesture: () => bindGesture,
    bindRange: () => bindRange,
    bindShortcuts: () => bindShortcuts,
    bootWasmEngine: () => bootWasmEngine,
    canDropPaths: () => canDropPaths,
    clients: () => clients,
    clipAudio: () => clipAudio,
    clipGainAt: () => clipGainAt,
    clipTypeFrom: () => clipTypeFrom,
    compiledClipAudio: () => compiledClipAudio,
    connect: () => connect,
    consoleLog: () => consoleLog,
    dbToGain: () => dbToGain,
    decodeMessage: () => decodeMessage,
    decodeMidiData: () => decodeMidiData,
    decodeMidiEvents: () => decodeMidiEvents,
    derived: () => derived,
    dotted: () => dotted,
    encodeMidiData: () => encodeMidiData,
    encodePayload: () => encodePayload,
    encodeRequest: () => encodeRequest,
    eventMatches: () => eventMatches,
    expandMulti: () => expandMulti,
    fileUrl: () => fileUrl,
    float: () => float,
    folderTree: () => folderTree,
    formatBarBeat: () => formatBarBeat,
    formatMinSec: () => formatMinSec,
    formatRollDuration: () => formatRollDuration,
    formatTimeSignature: () => formatTimeSignature,
    gainToDb: () => gainToDb,
    getOptionsToParams: () => getOptionsToParams,
    hasNativeBridge: () => hasNativeBridge,
    insertSlotForAlias: () => insertSlotForAlias,
    isAddOnCategory: () => isAddOnCategory,
    isEmbeddedInLuna: () => isEmbeddedInLuna,
    isHiddenSessionType: () => isHiddenSessionType,
    isInsertAliasPluginId: () => isInsertAliasPluginId,
    isLunaEnginePort: () => isLunaEnginePort,
    isLunaExtensionPluginId: () => isLunaExtensionPluginId,
    isRecordFxSlot: () => isRecordFxSlot,
    isTerminalJobStatus: () => isTerminalJobStatus,
    joinPath: () => joinPath,
    kindForScale: () => kindForScale,
    listOf: () => listOf,
    locationOptions: () => locationOptions,
    midiByte: () => midiByte,
    normalizeChordName: () => normalizeChordName2,
    normalizePackageUid: () => normalizePackageUid,
    onPathDrop: () => onPathDrop,
    pairNotes: () => pairNotes,
    pairNs: () => pairNs,
    pairRange: () => pairRange,
    parseBusType: () => parseBusType,
    parseChord: () => parseChord,
    parseControlType: () => parseControlType,
    parseFolderMode: () => parseFolderMode,
    parseRollDuration: () => parseRollDuration,
    parseSessionType: () => parseSessionType,
    parseStemFormat: () => parseStemFormat,
    parseTrackType: () => parseTrackType,
    pluginFormat: () => pluginFormat,
    pluginVersionMeets: () => pluginVersionMeets,
    propertyValue: () => propertyValue,
    requireTick: () => requireTick,
    secondsToTicks: () => secondsToTicks,
    selectedNotes: () => selectedNotes,
    settle: () => settle,
    shallowEquals: () => shallowEquals,
    sourceDisplayName: () => sourceDisplayName,
    sourceFilePath: () => sourceFilePath,
    splitPath: () => splitPath,
    startSourceDrag: () => startSourceDrag,
    stripValueSuffix: () => stripValueSuffix,
    suggestAddOnCategories: () => suggestAddOnCategories,
    ticksToBeats: () => ticksToBeats,
    ticksToSeconds: () => ticksToSeconds,
    toEvent: () => toEvent,
    traceWaveform: () => traceWaveform,
    triplet: () => triplet,
    wasmUpdateToEvent: () => wasmUpdateToEvent,
    waveformColumns: () => waveformColumns,
    waveformLanes: () => waveformLanes,
    waveformPeak: () => waveformPeak,
    writable: () => writable,
    yieldTask: () => yieldTask
  });

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
    async set(path, data, params) {
      await this.request("set", path, { ...params }, data, false);
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
          const pending2 = this.pending.get(id);
          if (!pending2) continue;
          this.pending.delete(id);
          clearTimeout(pending2.timer);
          if (entry.error !== void 0) {
            pending2.reject(new UAError(entry.error, `${pending2.verb} ${pending2.path}: ${entry.error}`, { cmd: pending2.verb, path: pending2.path }));
          } else {
            pending2.resolve(entry.data);
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

  // src/wire/mock-automation.ts
  function toDouble(v) {
    if (v instanceof FloatLiteral) return v.value;
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  }
  function bps(e, ctl) {
    return e.children(`${ctl}/automation`).map((id) => ({ path: `${ctl}/automation/${id}`, tick: Number(e.value(`${ctl}/automation/${id}`, "start")), value: Number(e.value(`${ctl}/automation/${id}`, "value")) })).sort((a, b) => a.tick - b.tick);
  }
  function insertBp(e, ctl, tick, value) {
    e.addNode(`${ctl}/automation/${e.nextRow()}`, { properties: { start: tick, value } });
  }
  function clearRange(e, ctl, a, b) {
    for (const bp of bps(e, ctl)) if (bp.tick >= a && bp.tick <= b) e.removeNode(bp.path);
  }
  function trimAt(e, ctl, tick, value) {
    for (const bp of bps(e, ctl)) if (bp.tick === tick) e.setValue(bp.path, "value", value);
  }
  function maxBefore(e, ctl, tick) {
    const t = bps(e, ctl).filter((b) => b.tick < tick).map((b) => b.tick);
    return t.length ? Math.max(...t) : void 0;
  }
  function minAfter(e, ctl, tick) {
    const t = bps(e, ctl).filter((b) => b.tick > tick).map((b) => b.tick);
    return t.length ? Math.min(...t) : void 0;
  }
  function curve(points, staticValue) {
    return (tick) => {
      if (points.length === 0) return staticValue;
      const first = points[0];
      const last = points[points.length - 1];
      if (tick <= first.tick) return first.value;
      if (tick >= last.tick) return last.value;
      let i = 1;
      while (points[i].tick <= tick) i++;
      const prev = points[i - 1];
      const next = points[i];
      return prev.value + (next.value - prev.value) * (tick - prev.tick) / (next.tick - prev.tick);
    };
  }
  function write(e, ctl, start, stop, value) {
    const points = bps(e, ctl);
    const at = curve(points, Number(e.value(ctl, "value") ?? 0));
    const startAnchor = at(start - 1);
    const stopAnchor = at(stop);
    const has = points.length > 0;
    const anchorBefore = (loc) => {
      if (loc <= 0) return;
      const before = maxBefore(e, ctl, loc);
      if (!has || before === void 0 || before < loc - 1) insertBp(e, ctl, loc - 1, startAnchor);
    };
    if (start < stop) {
      clearRange(e, ctl, start, stop - 1);
      anchorBefore(start);
      if (has) {
        const after = minAfter(e, ctl, start);
        if (after !== void 0 && after === stop) insertBp(e, ctl, stop - 1, value);
        else if (stopAnchor !== value) {
          insertBp(e, ctl, stop - 1, value);
          insertBp(e, ctl, stop, stopAnchor);
        }
      } else {
        insertBp(e, ctl, stop - 1, value);
        insertBp(e, ctl, stop, stopAnchor);
      }
    } else {
      anchorBefore(start);
      if (has) {
        let after = minAfter(e, ctl, start);
        if (after !== void 0 && after > start + 1) {
          const anchor = minAfter(e, ctl, after);
          if (anchor !== void 0 && anchor === after + 1) {
            after = anchor;
            clearRange(e, ctl, after - 1, after - 1);
          }
          insertBp(e, ctl, after - 1, value);
        }
      }
    }
    clearRange(e, ctl, start, start);
    insertBp(e, ctl, start, value);
  }
  function trim(e, h, ctl, start, stop, delta) {
    const out = /^(.*\/outputs\/[^/]+)\/controls\/[^/]+$/.exec(ctl);
    if (out && e.has(`${out[1]}/controls/gain_trim`)) h.zeroControl(`${out[1]}/controls/gain_trim`);
    const points = bps(e, ctl);
    const at = curve(points, Number(e.value(ctl, "value") ?? 0));
    const startAnchor = at(start - 1);
    const stopAnchor = at(stop);
    if (points.length === 0) {
      if (start > 0) insertBp(e, ctl, start - 1, startAnchor);
      insertBp(e, ctl, start, startAnchor + delta);
      if (start < stop) {
        insertBp(e, ctl, stop - 1, startAnchor + delta);
        insertBp(e, ctl, stop, stopAnchor);
      }
      return;
    }
    const before = maxBefore(e, ctl, start);
    if (before === void 0 || before < start - 1) insertBp(e, ctl, start - 1, startAnchor);
    if (start < stop) {
      const startValue2 = at(start);
      const stopValue = at(stop - 1);
      const after2 = minAfter(e, ctl, stop - 1);
      if (after2 === void 0 || after2 > stop) insertBp(e, ctl, stop, stopAnchor);
      let foundStart = false;
      let foundStop = false;
      const seen = /* @__PURE__ */ new Set();
      for (const bp of bps(e, ctl)) {
        if (bp.tick < start || bp.tick >= stop || seen.has(bp.tick)) continue;
        seen.add(bp.tick);
        trimAt(e, ctl, bp.tick, bp.value + delta);
        if (bp.tick === start) foundStart = true;
        if (bp.tick === stop - 1) foundStop = true;
      }
      if (!foundStart) insertBp(e, ctl, start, startValue2 + delta);
      if (!foundStop) insertBp(e, ctl, stop - 1, stopValue + delta);
      return;
    }
    const startValue = at(start);
    const after = minAfter(e, ctl, start);
    if (after !== void 0) {
      const afterValue = at(after);
      const anchor = minAfter(e, ctl, after);
      if (anchor !== void 0 && anchor === after + 1) trimAt(e, ctl, after, afterValue + delta);
      else insertBp(e, ctl, after - 1, afterValue + delta);
    }
    const atOrAfter = minAfter(e, ctl, start - 1);
    if (atOrAfter === start) trimAt(e, ctl, start, startValue + delta);
    else insertBp(e, ctl, start, startValue + delta);
  }
  function controlValuesCommand(command, base, e, h) {
    return (data) => {
      const body = data ?? {};
      const path = `${base}/${command}`;
      const refuse = (why) => new UAError("uasrv.invalid_property", `${command}: ${why}`, { cmd: "post", path });
      let start;
      let stop;
      if (body.start !== void 0 && body.stop !== void 0) {
        start = Math.trunc(Number(body.start));
        stop = Math.trunc(Number(body.stop));
      } else {
        const ctx = `${base}/contexts/${body.context_type ?? ""}`;
        if (!body.context_type || !e.has(ctx)) throw refuse("no range and no context");
        start = Number(e.value(ctx, "selection_start") ?? 0);
        stop = Number(e.value(ctx, "selection_stop") ?? 0);
      }
      const entries = (Array.isArray(body.controls) ? body.controls : []).filter((c) => typeof c === "object" && c !== null && "control_uid" in c && "value" in c).map((c) => ({ uid: String(c.control_uid), value: Math.fround(toDouble(c.value)) }));
      if (entries.length === 0) throw refuse("no controls");
      const paths = entries.map((c) => e.controlPathByUid(c.uid));
      if (paths.some((p) => p === void 0)) throw new UAError("device.database_error", `${command}: unknown control`, { cmd: "post", path });
      entries.forEach((c, i) => command === "write_control_values" ? write(e, paths[i], start, stop, c.value) : trim(e, h, paths[i], start, stop, c.value));
      return null;
    };
  }
  function addClipChildren(e, clipPath, addControl) {
    if (!e.has(`${clipPath}/controls/gain`)) addControl(`${clipPath}/controls/gain`, Number(e.value(clipPath, "gain") ?? 0));
    if (!e.has(`${clipPath}/warps`)) e.addNode(`${clipPath}/warps`);
  }
  var ZONE_NS = 3e7;
  function warps(e, clip) {
    return e.children(`${clip}/warps`).map((id) => ({ path: `${clip}/warps/${id}`, rowid: Number(id), start: Number(e.value(`${clip}/warps/${id}`, "start")), source: Number(e.value(`${clip}/warps/${id}`, "source_start")) }));
  }
  function warpCommands(base, e, h) {
    const err = (code, cmd, why) => new UAError(code, `${cmd}: ${why}`, { cmd: "post", path: `${base}/${cmd}` });
    return {
      set_warp: (data) => {
        const body = data ?? {};
        if (!body.playlist_uid || body.start === void 0 || body.source_start === void 0) return null;
        const inPlaylist = `${base}/playlists/${body.playlist_uid}/clips/${body.clip_uid ?? ""}`;
        const clip = e.has(inPlaylist) ? inPlaylist : void 0;
        if (!clip) throw err("device.database_error", "set_warp", "no such clip");
        const start = Math.trunc(Number(body.start)) + Math.trunc(Number(body.move ?? 0));
        const source = Math.trunc(Number(body.source_start));
        const rows = warps(e, clip);
        const conflict = (others) => others.some((w) => w.start === start || w.source === source);
        if (body.rowid !== void 0) {
          const row = rows.find((w) => w.rowid === Number(body.rowid));
          if (!row) return null;
          if (conflict(rows.filter((w) => w !== row))) throw err("uasrv.invalid_object", "set_warp", "warp conflict");
          e.setValue(row.path, "start", start);
          e.setValue(row.path, "source_start", source);
          e.setValue(row.path, "warp_type", 0);
          return null;
        }
        const near = rows.find((w) => Math.abs(w.source - source) <= ZONE_NS);
        if (near) return { rowid: near.rowid };
        if (conflict(rows)) throw err("uasrv.invalid_object", "set_warp", "warp conflict");
        const rowid = e.nextRow();
        e.addNode(`${clip}/warps/${rowid}`, { properties: { warp_type: 0, start, source_start: source, start_original: start, source_start_original: source } });
        return { rowid };
      },
      delete_warp: (data) => {
        const body = data ?? {};
        if (!body.clip_uid || body.start === void 0) throw err("uasrv.invalid_property", "delete_warp", "clip_uid and start are required");
        const clip = e.findClip(base, body.clip_uid);
        if (!clip) return null;
        const start = Number(body.start);
        for (const w of warps(e, clip)) {
          if (body.stop === void 0 ? w.start === start : w.start > start && w.start < Number(body.stop)) e.removeNode(w.path);
        }
        return null;
      },
      remove_tce: (data) => {
        const body = data ?? {};
        const uids = Array.isArray(body.clip_uid) ? body.clip_uid : body.clip_uid ? [body.clip_uid] : [];
        if (uids.length === 0) throw err("uasrv.invalid_property", "remove_tce", "clip_uid is required");
        const clips = uids.map((u) => e.findClip(base, String(u)));
        if (clips.some((c) => c === void 0)) throw err("device.database_error", "remove_tce", "no such clip");
        if (clips.some((c) => Number(e.value(c, "clip_type") ?? 0) !== 0)) throw err("uasrv.invalid_object", "remove_tce", "not an audio clip");
        for (const clip of clips) {
          for (const w of warps(e, clip)) e.removeNode(w.path);
          const start = Number(e.value(clip, "start") ?? 0);
          const span = (Number(e.value(clip, "source_stop") ?? 0) - Number(e.value(clip, "source_start") ?? 0)) / 1e9;
          const stop = h.tickAfter(base, start, span);
          e.setValue(clip, "stop", stop);
          const ctx = `${base}/contexts/${body.context_type ?? "main"}`;
          if (e.has(ctx)) {
            e.setValue(ctx, "selection_start", start);
            e.setValue(ctx, "selection_stop", stop);
          }
        }
        return null;
      }
    };
  }

  // src/wire/mock-parity.ts
  var ATTRIBUTE_BITS = { edit: 1, mix: 2, plugin: 4, send: 8, all: 15, mix_and_edit: 3, unknown: 0, "": 0 };
  var ATTRIBUTE_NAMES = ["edit", "mix", "plugin", "send"];
  function groupAttributeBits(csv) {
    let bits = 0;
    for (const token of csv.split(/[, ]/)) {
      const bit = ATTRIBUTE_BITS[token];
      if (bit === void 0) return void 0;
      bits |= bit;
    }
    return bits;
  }
  function groupAttributeCsv(bits) {
    return ATTRIBUTE_NAMES.filter((_, i) => (bits & 1 << i) !== 0).join(",");
  }
  var isNil = (uid) => typeof uid !== "string" || uid === "" || /^0+$/.test(uid.replaceAll("-", ""));
  function groupCommands(sessionUid) {
    const base = `/sessions/${sessionUid}`;
    const groups = `${base}/groups`;
    const err = (code, command, why) => new UAError(code, `${command}: ${why}`, { cmd: "post", path: `${base}/${command}` });
    const channelKind = (engine, uid) => engine.has(`${base}/tracks/${uid}`) ? "track" : engine.has(`${base}/buses/${uid}`) ? "bus" : void 0;
    const addMember = (engine, command, group, uid) => {
      const kind = channelKind(engine, uid);
      if (!kind) throw err("device.database_error", command, `no track or bus ${uid}`);
      engine.addNode(`${group}/members/${engine.nextRow()}`, { properties: { track_uid: kind === "track" ? uid : null, bus_uid: kind === "bus" ? uid : null } });
    };
    const members = (engine, group) => engine.children(`${group}/members`).map((row) => ({ row, uid: String(engine.value(`${group}/members/${row}`, "track_uid") ?? engine.value(`${group}/members/${row}`, "bus_uid") ?? "") }));
    const sorted = (engine) => [...engine.children(groups)].sort((a, b) => Number(engine.value(`${groups}/${a}`, "order") ?? 0) - Number(engine.value(`${groups}/${b}`, "order") ?? 0));
    return {
      new_group: (data, engine) => {
        const body = data ?? {};
        if (body.group_attributes === void 0) throw err("uasrv.missing_field", "new_group", "group_attributes is required");
        const bits = groupAttributeBits(String(body.group_attributes));
        if (bits === void 0) throw err("uasrv.invalid_property", "new_group", "unknown group attribute");
        if (body.uid !== void 0 && isNil(body.uid)) throw err("uasrv.invalid_property", "new_group", "uid is not a uuid");
        const uid = body.uid !== void 0 ? String(body.uid) : `group${engine.nextRow()}`;
        if (engine.has(`${groups}/${uid}`)) throw err("device.database_error", "new_group", "uid already names a group");
        const baseName = body.name !== void 0 ? String(body.name) : "New Group";
        let name = baseName;
        if (body.make_name_unique === true) {
          const taken = new Set(engine.children(groups).map((g) => engine.value(`${groups}/${g}`, "name")));
          for (let n = 2; taken.has(name); n++) name = `${baseName} ${n}`;
        }
        const tracks = Array.isArray(body.tracks) ? body.tracks : [];
        const memberUids = tracks.map((m) => typeof m === "string" ? m : typeof m === "object" && m !== null ? m.track_uid : void 0).filter((m) => typeof m === "string");
        for (const m of memberUids) if (!channelKind(engine, m)) throw err("device.database_error", "new_group", `no track or bus ${m}`);
        const order = Math.max(0, ...engine.children(groups).map((g) => Number(engine.value(`${groups}/${g}`, "order") ?? 0))) + 1;
        engine.addNode(`${groups}/${uid}`, { properties: { uid, name, group_attributes: groupAttributeCsv(bits), order } });
        engine.addNode(`${groups}/${uid}/members`);
        for (const m of memberUids) addMember(engine, "new_group", `${groups}/${uid}`, m);
        return { uid };
      },
      delete_group: (data, engine) => {
        const body = data ?? {};
        if (body.uid === void 0) throw err("uasrv.missing_field", "delete_group", "uid is required");
        const path = `${groups}/${String(body.uid)}`;
        if (!engine.has(path)) throw err("device.database_error", "delete_group", "no such group");
        engine.removeNode(path);
        return null;
      },
      add_group_members: (data, engine) => {
        const body = data ?? {};
        if (body.uid === void 0 || body.tracks === void 0) throw err("uasrv.missing_field", "add_group_members", "uid and tracks are required");
        const group = `${groups}/${String(body.uid)}`;
        if (!engine.has(group)) throw err("device.database_error", "add_group_members", "no such group");
        const uids = (Array.isArray(body.tracks) ? body.tracks : []).map(String);
        for (const m of uids) if (!channelKind(engine, m)) throw err("device.database_error", "add_group_members", `no track or bus ${m}`);
        for (const m of uids) addMember(engine, "add_group_members", group, m);
        return null;
      },
      remove_group_members: (data, engine) => {
        const body = data ?? {};
        if (body.uid === void 0 || body.tracks === void 0) throw err("uasrv.missing_field", "remove_group_members", "uid and tracks are required");
        const group = `${groups}/${String(body.uid)}`;
        const gone = new Set((Array.isArray(body.tracks) ? body.tracks : []).map(String));
        if (!engine.has(group)) return null;
        for (const m of members(engine, group)) if (gone.has(m.uid)) engine.removeNode(`${group}/members/${m.row}`);
        return null;
      },
      /**
       * Moves the dragged groups to just AFTER `before_uid`, or to the front when it is absent
       * or nil, and renumbers `order` from 1. An unknown uid changes nothing and still answers
       * success (fact 217).
       */
      group_change_order: (data, engine) => {
        if (typeof data !== "object" || data === null) throw err("uasrv.invalid_type", "group_change_order", "payload must be an object");
        const body = data;
        if (isNil(body.session_uid)) throw err("uasrv.invalid_property", "group_change_order", "session_uid is required");
        if (!Array.isArray(body.dragged_uids)) throw err("uasrv.invalid_property", "group_change_order", "dragged_uids must be an array");
        if (body.dragged_uids.some((u) => typeof u !== "string" || isNil(u))) throw err("uasrv.invalid_property", "group_change_order", "dragged_uids must be uuids");
        const dragged = body.dragged_uids;
        if (!dragged.length) return null;
        const existing = sorted(engine);
        const before = isNil(body.before_uid) ? void 0 : String(body.before_uid);
        if (dragged.some((u) => !existing.includes(u)) || before !== void 0 && !existing.includes(before)) return null;
        const rest = existing.filter((u) => !dragged.includes(u));
        const at = before === void 0 ? 0 : rest.indexOf(before) + 1;
        if (before !== void 0 && at === 0) return null;
        const next = [...rest.slice(0, at), ...dragged, ...rest.slice(at)];
        if (new Set(next).size !== existing.length) return null;
        next.forEach((u, i) => {
          if (engine.value(`${groups}/${u}`, "order") !== i + 1) engine.setValue(`${groups}/${u}`, "order", i + 1);
        });
        return null;
      },
      /**
       * The tracks an operation on `track_uid` reaches (fact 218): the context selection when it
       * holds the track (selection grouping on), else the track, plus every member of a group
       * holding the track whose attributes share a bit with `group_attributes`.
       */
      group_affected_tracks: (data, engine) => {
        const body = data ?? {};
        if (body.track_uid === void 0 || body.group_attributes === void 0) throw err("uasrv.missing_field", "group_affected_tracks", "track_uid and group_attributes are required");
        const bits = groupAttributeBits(String(body.group_attributes));
        if (bits === void 0) throw err("uasrv.invalid_value", "group_affected_tracks", "unknown group attribute");
        const contextType = body.context_type === void 0 ? "main" : String(body.context_type);
        if (!/^(main|editor|alt_?\d+)$/.test(contextType)) throw err("uasrv.invalid_value", "group_affected_tracks", "unknown context_type");
        const src = String(body.track_uid);
        const ctx = `${base}/contexts/${contextType}`;
        const selection = (engine.has(ctx) ? engine.value(ctx, "selection_tracks") : null) ?? [];
        const grouping = !engine.has(ctx) || engine.value(ctx, "selection_grouping") !== false;
        const out = new Set(grouping && selection.includes(src) ? selection : [src]);
        const suspended = engine.has(ctx) && engine.value(ctx, "groups_suspended") === true;
        if (!suspended) {
          for (const g of engine.children(groups)) {
            const attrs = groupAttributeBits(String(engine.value(`${groups}/${g}`, "group_attributes") ?? "")) ?? 0;
            if ((attrs & bits) === 0) continue;
            const list = members(engine, `${groups}/${g}`).map((m) => m.uid);
            if (list.includes(src)) for (const m of list) out.add(m);
          }
        }
        return { tracks: [...out] };
      }
    };
  }
  function midiOutputCommand(sessionUid) {
    const base = `/sessions/${sessionUid}`;
    const path = `${base}/contexts/main/commands/set_midi_output_assignments`;
    const fail = (code, why) => new UAError(code, `set_midi_output_assignments: ${why}`, { cmd: "post", path });
    return (data, engine) => {
      const body = typeof data === "object" && data !== null ? data : {};
      if (body.track_uid === void 0 || body.devices === void 0 || body.tracks === void 0) throw fail("uasrv.invalid_type", "track_uid, devices and tracks are required");
      if (!Array.isArray(body.devices) || !Array.isArray(body.tracks)) throw fail("uasrv.invalid_object", "devices and tracks must be arrays");
      const read = (list) => list.filter((e) => typeof e === "object" && e !== null && !Array.isArray(e)).map((e) => {
        if (!("channel" in e) || !("value" in e)) throw fail("uasrv.missing_field", "each entry needs value and channel");
        return { value: String(e["value"]), channel: Math.trunc(Number(e["channel"])) };
      });
      const devices = read(body.devices);
      const tracks = read(body.tracks);
      const src = `${base}/tracks/${String(body.track_uid)}`;
      if (!engine.has(src)) throw fail("device.database_error", "no such track");
      for (const t of tracks) if (!engine.has(`${base}/tracks/${t.value}`) && !engine.has(`${base}/buses/${t.value}`)) throw fail("device.database_error", `no track or bus ${t.value}`);
      const folder = `${src}/midi_output_assignments`;
      if (!engine.has(folder)) engine.addNode(folder);
      for (const row2 of [...engine.children(folder)]) engine.removeNode(`${folder}/${row2}`);
      const row = (props, channel) => {
        const uid = `moa${engine.nextRow()}`;
        engine.addNode(`${folder}/${uid}`, { properties: { uid, destination_track_uid: null, destination_bus_uid: null, effect_uid: null, midi_device: null, midi_output_channel: channel, ...props } });
      };
      for (const d of devices) row({ midi_device: d.value }, d.channel);
      for (const t of tracks) row(engine.has(`${base}/tracks/${t.value}`) ? { destination_track_uid: t.value } : { destination_bus_uid: t.value }, t.channel);
      return null;
    };
  }
  var suppressions = /* @__PURE__ */ new WeakMap();
  var KNOWN_OWNERS = /* @__PURE__ */ new Set(["dashboard", "luna_play", "catalog", "universe"]);
  function progressSuppressions(engine) {
    let map = suppressions.get(engine);
    if (!map) suppressions.set(engine, map = /* @__PURE__ */ new Map());
    return map;
  }
  function progressSuppressionCommands() {
    const parse = (data, command) => {
      const raw = typeof data === "object" && data !== null ? data.suppression_uid : void 0;
      const path = `/gui/${command}`;
      if (typeof raw !== "string") throw new UAError("uasrv.missing_field", `${command}: suppression_uid is required`, { cmd: "post", path });
      const hex = raw.replaceAll("-", "").toLowerCase();
      if (!/^[0-9a-f]{32}$/.test(hex) || /^0+$/.test(hex)) throw new UAError("uasrv.invalid_value", `${command}: suppression_uid is not a uuid`, { cmd: "post", path });
      return hex;
    };
    return {
      add_progress_suppression: (data, engine) => {
        const uid = parse(data, "add_progress_suppression");
        const owner = data.owner;
        const path = "/gui/add_progress_suppression";
        if (owner !== void 0 && owner !== null && typeof owner !== "string") throw new UAError("uasrv.invalid_type", "add_progress_suppression: owner must be a string", { cmd: "post", path });
        if (typeof owner === "string" && !KNOWN_OWNERS.has(owner)) throw new UAError("uasrv.invalid_value", "add_progress_suppression: unknown owner", { cmd: "post", path });
        const map = progressSuppressions(engine);
        if (map.has(uid)) throw new UAError("uasrv.invalid_value", "add_progress_suppression: handle already held", { cmd: "post", path });
        map.set(uid, typeof owner === "string" ? owner : "legacy");
        return null;
      },
      remove_progress_suppression: (data, engine) => {
        const uid = parse(data, "remove_progress_suppression");
        if (!progressSuppressions(engine).delete(uid)) throw new UAError("uasrv.invalid_value", "remove_progress_suppression: no such handle", { cmd: "post", path: "/gui/remove_progress_suppression" });
        return null;
      }
    };
  }
  function resetWebClient(engine, owner) {
    const map = progressSuppressions(engine);
    for (const [uid, o] of [...map]) if (o === owner || o === "legacy") map.delete(uid);
  }

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
  var SESSION_TYPES = ["default", "multi", "history", "template", "track_preset", "device_mixer", "volt", "standalone"];
  var WORKSPACE_SESSION_TYPES = ["default", "multi", "history", "session_template", "track_preset", "device_mixer", "volt", "standalone"];
  function analysisCount(kind, payload) {
    if (typeof payload["count"] === "number") return payload["count"];
    const data = payload["data"];
    if (Array.isArray(data)) return data.length;
    if (kind === "transients") return (data?.["location"] ?? []).length;
    return 1;
  }
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
  var ANALYSIS_IDLE = { signal_level_peak: -144, tempo: 0, instrument: null, stereo_detect: false };
  var ANALYSIS_RESULT = { signal_level: "signal_level_peak", tempo: "tempo", instrument: "instrument", stereo_detect: "stereo_detect" };
  function autoCreatesTrack(name) {
    const lower = name.toLowerCase();
    return lower !== "" && lower !== "mon" && !["talkback", "monitor", "mon ", "loopback"].some((f) => lower.includes(f));
  }
  function sdkTypeOf(pluginId) {
    if (pluginId.includes(".vst.")) return "vst";
    if (pluginId.includes(".vst3.")) return "vst3";
    if (pluginId.includes(".au.")) return "au";
    if (pluginId.startsWith("cloud:")) return "cloud";
    if (pluginId.startsWith("localml:")) return "localml";
    if (pluginId.startsWith("UAD ")) return "uad2";
    return "uadx";
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
    /** Every route `set_page` handed to a page, in order (fact 243). The mock only records them. */
    pageRoutes = [];
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
          // Fact 152: the package takes the client's session_package_uid (else a new one) and is
          // listed in the workspace; session_type 'standalone' with standalone_id puts it in that
          // standalone sessions subfolder.
          new_session: (data, engine) => {
            const body = data ?? {};
            const uid = body.session_uid || `s${engine.children("/sessions").length + 1}`;
            const pkg = body.session_package_uid || `pkg_${uid}`;
            const name = body.name ?? "Untitled";
            const type = body.session_type !== void 0 && SESSION_TYPES.includes(body.session_type) ? body.session_type : "default";
            const directory = type === "standalone" && body.standalone_id !== void 0 ? `/tmp/standalone/${body.standalone_id}` : body.directory_path ?? "/tmp/Sessions";
            if (engine.has(`/workspace/sessions/${pkg}`)) engine.removeNode(`/workspace/sessions/${pkg}`);
            engine.offlinePackages.delete(pkg);
            const rowType = type === "template" ? "session_template" : type === "standalone" ? "default" : type;
            engine.addPackage(pkg, { name, directoryPath: `${directory}/${name}`, sessionType: rowType, lastOpened: Date.now() });
            engine.addSession(uid, { name, focused: false, packageUid: pkg });
            engine.setValue(`/sessions/${uid}`, "loaded", false);
            return { session_package_uid: pkg, session_uid: uid };
          },
          open_session: (data, engine) => {
            const body = data ?? {};
            const uid = `s${engine.children("/sessions").length + 1}`;
            const row = body.session_package_uid ? `/workspace/sessions/${body.session_package_uid}` : void 0;
            const fileName2 = row && engine.has(row) ? engine.value(row, "file_name") : void 0;
            const name = typeof fileName2 === "string" ? fileName2.replace(/\.luna(template)?$/, "") : body.session_package_uid ?? "Opened";
            engine.addSession(uid, { name, focused: false, ...body.session_package_uid ? { packageUid: body.session_package_uid } : {} });
            engine.setValue(`/sessions/${uid}`, "loaded", false);
            if (row && engine.has(row)) engine.setValue(row, "last_opened", Date.now());
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
          // Fact 151: copies a template package into a new session, under the uid the client
          // sends (or a new one), which `load_session` then loads.
          new_session_from_template: (data, engine) => {
            const body = data ?? {};
            const pkg = body.session_package_uid ?? "";
            const template = `/workspace/sessions/${pkg}`;
            if (!pkg || !engine.has(template) || engine.offlinePackages.has(pkg)) {
              throw new UAError("device.filesystem_error", "post /sessions/new_session_from_template: device.filesystem_error", { cmd: "post", path: "/sessions/new_session_from_template" });
            }
            if (engine.value(template, "session_type") !== "session_template") {
              throw new UAError("device.database_error", "new_session_from_template: not a template", { cmd: "post", path: "/sessions/new_session_from_template" });
            }
            const uid = body.session_uid || `s${engine.children("/sessions").length + 1}`;
            const tracks = engine.templateTracks.get(pkg);
            engine.addSession(uid, { name: body.name ?? String(engine.value(template, "file_name") ?? "Untitled").replace(/\.lunatemplate$/, ""), focused: false, ...tracks ? { tracks } : {} });
            engine.setValue(`/sessions/${uid}`, "loaded", false);
            return { session_uid: uid };
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
      this.nodes.get("/").commands.set("move_insert", (data, engine) => engine.moveInsert(data));
      this.addNode("/ping", {});
      this.addNode("/errors", { properties: { type: "folder" } });
      this.addNode("/workspace/sessions");
      this.addNode("/workspace", {
        properties: { type: "folder" },
        commands: {
          query: (data, engine) => {
            const body = data ?? {};
            let rows = engine.children("/workspace/sessions").filter((uid) => engine.value(`/workspace/sessions/${uid}`, "session_type") !== "track_preset").map((uid) => ({
              uid,
              name: String(engine.value(`/workspace/sessions/${uid}`, "file_name") ?? uid),
              path: `${String(engine.value(`/workspace/sessions/${uid}`, "directory_path") ?? "")}/${String(engine.value(`/workspace/sessions/${uid}`, "file_name") ?? "")}`,
              file_online: !engine.offlinePackages.has(uid),
              // Columnar like LUNA's: the session type's number, 3 for a template (fact 151), 7 standalone.
              session_type: Math.max(0, WORKSPACE_SESSION_TYPES.indexOf(String(engine.value(`/workspace/sessions/${uid}`, "session_type")))),
              factory: Boolean(engine.value(`/workspace/sessions/${uid}`, "factory")),
              favorite: Boolean(engine.value(`/workspace/sessions/${uid}`, "favorite")),
              created: Number(engine.value(`/workspace/sessions/${uid}`, "created") ?? 0),
              modified: 0,
              last_opened: Number(engine.value(`/workspace/sessions/${uid}`, "last_opened") ?? 0),
              tags: [...engine.packageTags.get(uid) ?? []]
            }));
            const wantedTags = (Array.isArray(body.tag) ? body.tag : body.tag !== void 0 ? [body.tag] : []).filter((t) => t !== "");
            if (wantedTags.length) rows = rows.filter((r) => body.union === true && Array.isArray(body.tag) ? wantedTags.some((t) => r.tags.includes(t)) : wantedTags.every((t) => r.tags.includes(t)));
            if (typeof body.factory === "boolean") rows = rows.filter((r) => r.factory === body.factory);
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
           * `Strg_DeleteUnusedMedia` (fact 240): a file no clip of an open session of the package
           * uses (as source or rendering) is unused, unless `keepMedia()` gave it a reason.
           * `pre_flight` only reports; otherwise the unused files are removed.
           */
          delete_unused_media: (data, engine) => engine.deleteUnusedMedia(data),
          /**
           * `Strg_AddTag` for a session package (fact 161): an empty tag is refused, an unknown
           * package answers `device.database_error`, a factory one `uasrv.read_only_property`.
           */
          add_tag: (data, engine) => {
            const body = data ?? {};
            const where = { cmd: "post", path: "/workspace/add_tag" };
            if (typeof body.tag !== "string" || body.tag === "") throw new UAError("uasrv.invalid_property", "add_tag: uasrv.invalid_property", where);
            if (typeof body.session_package_uid !== "string") throw new UAError("uasrv.invalid_type", "add_tag: uasrv.invalid_type", where);
            const pkg = body.session_package_uid;
            if (!engine.has(`/workspace/sessions/${pkg}`)) throw new UAError("device.database_error", "add_tag: device.database_error", where);
            if (engine.value(`/workspace/sessions/${pkg}`, "factory") === true) throw new UAError("uasrv.read_only_property", "add_tag: uasrv.read_only_property", where);
            const tags = engine.packageTags.get(pkg) ?? [];
            if (!tags.includes(body.tag)) tags.push(body.tag);
            engine.packageTags.set(pkg, tags);
            return null;
          },
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
                const pending2 = engine.imports.get(body.uid ?? "");
                if (!pending2) throw new UAError("uasrv.invalid_object", "import_file: no import in progress for that uid", { cmd: "post", path: "/workspace/import_file" });
                const encoded = body.file_data ?? "";
                const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
                pending2.bytes += Math.max(0, encoded.length / 4 * 3 - padding);
                pending2.content += encoded;
                return null;
              }
              case "end": {
                const uid = body.uid ?? "";
                const pending2 = engine.imports.get(uid);
                if (!pending2) throw new UAError("uasrv.invalid_object", "import_file: no import in progress for that uid", { cmd: "post", path: "/workspace/import_file" });
                engine.imports.delete(uid);
                const same = engine.uploaded.get(`${pending2.pkg}:${pending2.content}`);
                if (same && engine.has(`/workspace/sessions/${pending2.pkg}/audio/${same}`)) return { uid: same };
                engine.uploaded.set(`${pending2.pkg}:${pending2.content}`, uid);
                engine.addNode(`/workspace/sessions/${pending2.pkg}/audio/${uid}`, {
                  properties: { uid, name: body.name ?? pending2.name, stem_format: "stereo", length: 0, sample_rate: 48e3, created: 0, size: pending2.bytes }
                });
                return { uid };
              }
              case "cancel":
                engine.imports.delete(body.uid ?? "");
                return null;
              case "local_copy":
              default: {
                if (body.type === "midi" || body.type === "video") {
                  const uid2 = `${body.type}${engine.importedFiles.length + 1}`;
                  engine.importedFiles.push({ pkg, uid: uid2, type: body.type, name: body.name ?? uid2, path: body.path ?? "" });
                  if (body.type === "midi") engine.addNode(`/workspace/sessions/${pkg}/midi/${uid2}`, { properties: { uid: uid2, name: body.name ?? uid2 } });
                  return { uid: uid2 };
                }
                if (body.type !== void 0 && body.type !== "audio") throw new UAError("uasrv.invalid_property", "import_file: unknown type", { cmd: "post", path: "/workspace/import_file" });
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
      this.addNode("/preferences", {
        properties: { io_buffer_size: 256, play_from_stop_location: false, record_mute: false, metronome_sound: "click", metronome_sounds: ["click", "beep"] },
        commands: {
          // Fact 232: a context is read from its file only when a preference in it is
          // initialised; a new preference starts null, an existing one keeps its value.
          init_preference: (data, engine) => {
            const body = data ?? {};
            if (!body.context || !body.preference) throw new UAError("uasrv.missing_field", "init_preference: context and preference are required", { cmd: "post", path: "/preferences/init_preference" });
            const path = `/preferences/${body.context}`;
            const file = engine.preferenceFiles.get(body.context) ?? {};
            if (!(body.preference in file)) file[body.preference] = null;
            engine.preferenceFiles.set(body.context, file);
            if (!engine.has(path)) engine.addNode(path, { properties: { ...file } });
            else if (engine.value(path, body.preference) === void 0) engine.setValue(path, body.preference, null);
            return null;
          }
        }
      });
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
      this.addNode("/lyric_transcription", { properties: { available: true, providers: ["music_ai", "audioshake"], default_provider: "music_ai" }, readOnly: ["available", "providers", "default_provider"] });
      this.addNode("/devices");
      const root = this.nodes.get("/");
      root.properties.set("active_audio_engine", { enabled: true, audio_engine_type: "system", devices: [{ id: "mock", name: "Mock Device", type: "built_in", num_inputs: 2, num_outputs: 2 }], outputs: [] });
      root.readOnly.add("active_audio_engine");
      if (options.autoGain !== false) this.addAutoGainService();
      this.addNode("/gui", {
        // session_storage_path: where LUNA makes new sessions, read-only (fact 160).
        properties: { prior_launch_count: 1, session_storage_path: "/Users/mock/Music/LUNA" },
        readOnly: ["session_storage_path"],
        commands: {
          ...progressSuppressionCommands(),
          set_page: (data, engine) => {
            const body = data ?? {};
            const refuse = (why) => new UAError("uasrv.invalid_value", `set_page: ${why}`, { cmd: "post", path: "/gui/set_page" });
            if (body.route !== void 0 && body.route !== null) {
              if (typeof body.route !== "string" || body.route === "") throw refuse("route must be a non-empty string");
              if (!["dashboard", "catalog", "universe"].includes(body.page ?? "")) throw refuse(`page ${String(body.page)} takes no route`);
              if (body.page === "universe" && /[\x00-\x20\x7f-\uffff\\#]/.test(body.route)) throw refuse("universe route is not a path");
            }
            if (!["mixer", "timeline", "home", "addon", "dashboard", "catalog", "universe"].includes(body.page ?? "")) {
              throw refuse(`no page ${String(body.page)}`);
            }
            engine.setValue(`/gui/windows/${body.context_type ?? "main"}`, "page", body.page ?? "timeline");
            if (typeof body.route === "string") engine.pageRoutes.push({ page: body.page ?? "", route: body.route, contextType: body.context_type ?? "main" });
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
              return { url: `ua-content://${localContentHost(id2)}_t${engine.installToken(id2)}${encodeMediaPath(target2)}` };
            }
            const file = engine.mediaFiles[path];
            if (file === void 0) throw fail("uasrv.filesystem_error", "no file at path");
            if (file === null) throw fail("uasrv.invalid_value", "not an audio, video or MIDI file");
            const id = body.add_on_id.toLowerCase();
            if (!engine.has(`/gui/add_ons/${id}`)) throw fail("uasrv.not_installed", `no Add On ${id}`);
            const target = file === true ? path : file;
            engine.mediaServed.push({ addOnId: id, path: target });
            return { url: `ua-content://${localContentHost(id)}_t${engine.installToken(id)}${encodeMediaPath(target)}` };
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
      const contextType = typeof body.context_type === "string" && /^(main|editor|alt_\d+|editor_\d+)$/.test(body.context_type) ? body.context_type : "main";
      if (!this.has(`/gui/windows/${contextType}`)) throw fail("uasrv.invalid_object", `no ${contextType} window`);
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
     * Each installed Add On's install token, by lowercase id: 32 lowercase hex digits that LUNA
     * gives an install (fact 114) and that end its page host (`<id>_t<token>`). The mock makes
     * one up the first time an id needs it; set one to pin it.
     *
     * @example
     * engine.installTokens['com.example.demo'] = '0123456789abcdef0123456789abcdef';
     */
    installTokens = {};
    /**
     * The install token of the Add On `id` (lowercase), made up on first use.
     *
     * @example
     * const host = `com.example.demo_t${engine.installToken('com.example.demo')}`;
     */
    installToken(id) {
      let token = this.installTokens[id];
      if (token === void 0) {
        token = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        this.installTokens[id] = token;
      }
      return token;
    }
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
          manifest,
          // LUNA's format for it (fact 177): from the id, as UA::PluginIDToSDKType, unless given.
          sdk_type: options.sdkType ?? sdkTypeOf(pluginId)
        },
        readOnly: ["sdk_type"]
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
      const search2 = (body.search ?? "").toLowerCase();
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
      }).filter((p) => p.installed && p.name !== "").filter((p) => !body.favorite || p.favorite).filter((p) => !search2 || p.name.toLowerCase().includes(search2) || p.manufacturer.toLowerCase().includes(search2)).filter((p) => !body.categories?.length || p.categories.some((c) => body.categories.includes(c))).filter((p) => {
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
        // `description` is a node property the query does not return (fact 175).
        properties: { uid, preset_name: name, version: options.version ?? 1, favorite: options.favorite ?? false, factory: options.factory ?? false, path: folder, description: options.description ?? "" }
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
      const search2 = (body.search ?? "").toLowerCase();
      const list = (root, tagsOf, tags) => this.children(root).map((uid) => ({
        uid,
        name: String(this.value(`${root}/${uid}`, "preset_name") ?? uid),
        version: Number(this.value(`${root}/${uid}`, "version") ?? 1),
        favorite: this.value(`${root}/${uid}`, "favorite") ? 1 : 0,
        factory: this.value(`${root}/${uid}`, "factory") ? 1 : 0,
        path: String(this.value(`${root}/${uid}`, "path") ?? ""),
        tags: tagsOf(uid),
        instrument: false
      })).filter((r) => tags.length === 0 || (any ? tags.some((t) => r.tags.includes(t)) : tags.every((t) => r.tags.includes(t)))).filter((r) => !search2 || r.name.toLowerCase().includes(search2)).filter((r) => !body.favorite || r.favorite === 1);
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
        properties: { uid, preset_name: name, version: 1, favorite: options.favorite ?? false, factory: options.factory ?? false, path: "", track_type: trackType, track_names: options.trackNames ?? null, description: options.description ?? "" }
      });
      if (options.plugins) this.addNode(`/workspace/sessions/${uid}`, { properties: { uid, file_name: `${name}.lunapreset`, session_type: "track_preset", plugins: JSON.stringify(options.plugins) } });
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
    /**
     * @internal `post /move_insert` (fact 173), as Edit_MoveInsert: the source slot's plugin,
     * power, preset and parameters go to the destination slot, named by effect uid on any
     * channel of the session. A move clears the source first. An occupied `effect_N` or
     * `record_fx_N` destination first shuffles its neighbours toward the nearest empty slot of
     * its kind, below it, else above it. Like LUNA, nothing checks that the two slots are of
     * one kind.
     */
    moveInsert(data) {
      const body = data ?? {};
      const where = { cmd: "post", path: "/move_insert" };
      const base = `/sessions/${body.session_uid ?? ""}`;
      if (!body.session_uid || !body.destination_uid || !this.has(base)) throw new UAError("uasrv.invalid_object", "move_insert: session_uid and destination_uid are required", where);
      const find = (uid) => {
        for (const kind of ["tracks", "buses"]) {
          for (const ch of this.children(`${base}/${kind}`)) {
            for (const slot of this.children(`${base}/${kind}/${ch}/effects`)) {
              const path = `${base}/${kind}/${ch}/effects/${slot}`;
              if (this.value(path, "uid") === uid) return path;
            }
          }
        }
        return void 0;
      };
      const src = body.source_uid ? find(body.source_uid) : void 0;
      const dst = find(body.destination_uid);
      if (body.source_uid && !src || !dst) throw new UAError("device.database_error", "move_insert: no such insert", where);
      const state = src ? this.slotState(src) : void 0;
      if (src && body.copy !== true) this.clearSlot(src);
      const family = /^(effect_|record_fx_)(\d+)$/.exec(splitPath(dst).name);
      if (family && this.value(dst, "plugin_id")) {
        const effects = splitPath(dst).node;
        const prefix = family[1];
        const at = Number(family[2]);
        const slot = (i) => `${effects}/${prefix}${i}`;
        const empty = (i) => !this.value(slot(i), "plugin_id");
        const count = this.children(effects).filter((c) => c.startsWith(prefix)).length;
        let free = -1;
        for (let i = at - 1; i >= 0; i--) {
          if (empty(i)) {
            free = i;
            break;
          }
        }
        if (free >= 0) {
          for (let i = free; i < at; i++) this.applySlotState(slot(i), this.slotState(slot(i + 1)));
        } else {
          for (let i = at + 1; i < count; i++) {
            if (empty(i)) {
              free = i;
              break;
            }
          }
          if (free >= 0) for (let i = free; i > at; i--) this.applySlotState(slot(i), this.slotState(slot(i - 1)));
        }
      }
      if (state) this.applySlotState(dst, state);
      return null;
    }
    static SLOT_STATE = ["plugin_id", "plugin_name", "plugin_power", "enabled", "preset_name", "preset_uid", "preset_uid_dirty", "bypass_control", "bypass_control_active_low", "plugin_error", "external_sdk_instance_id"];
    slotState(path) {
      const props = {};
      for (const k of _MockEngine.SLOT_STATE) props[k] = this.value(path, k);
      const controls = this.children(`${path}/controls`).map((c) => [c, this.properties(`${path}/controls/${c}`)]);
      return { props, controls };
    }
    applySlotState(path, state) {
      for (const c of this.children(`${path}/controls`)) this.removeNode(`${path}/controls/${c}`);
      for (const [k, v] of Object.entries(state.props)) this.setValue(path, k, k === "external_sdk_instance_id" && v !== null && v !== void 0 ? this.nextRow() : v);
      for (const [name, props] of state.controls) {
        const control = `${path}/controls/${name}`;
        this.addControl(control, String(props["control_type"] ?? "parameter"), { discrete: props["discrete"] === true, value: Number(props["value"] ?? 0), real: props["real_value"] ?? 0, str: String(props["string_value"] ?? ""), automatable: props["automatable"] === true });
        for (const [k, v] of Object.entries(props)) if (k !== "uid") this.nodes.get(control).properties.set(k, v);
      }
    }
    clearSlot(path) {
      for (const c of this.children(`${path}/controls`)) this.removeNode(`${path}/controls/${c}`);
      const cleared = { plugin_id: null, plugin_name: null, plugin_power: true, preset_name: null, preset_uid: null, preset_uid_dirty: false, bypass_control: null, bypass_control_active_low: null, plugin_error: null, external_sdk_instance_id: null };
      for (const [k, v] of Object.entries(cleared)) this.setValue(path, k, v);
    }
    /**
     * @internal `delete_playlists` (fact 170), as Edit_DeletePlaylists with no edit groups:
     * with `context_type`, each listed playlist's track is affected. A playlist a track is not
     * using is deleted. Listing only playlists in use deletes them, each track switching to
     * the version before (after, for the first); `delete_unused` deletes every playlist the
     * affected tracks are not using instead. Nothing to delete is `uasrv.invalid_value`.
     */
    deletePlaylists(sessionUid, data) {
      const base = `/sessions/${sessionUid}`;
      const body = data ?? {};
      const listed = Array.isArray(body.playlist_uid) ? body.playlist_uid : typeof body.playlist_uid === "string" ? [body.playlist_uid] : [];
      const trackOf = (pl) => this.value(`${base}/playlists/${pl}`, "track_uid");
      const current = (pl) => this.children(`${base}/tracks`).some((t) => this.value(`${base}/tracks/${t}`, "playlist_uid") === pl);
      const versionOf = (pl) => Number(this.value(`${base}/playlists/${pl}`, "version"));
      const ofTrack = (t) => this.children(`${base}/playlists`).filter((p) => trackOf(p) === t).sort((a, b) => versionOf(a) - versionOf(b));
      const doomed = new Set(listed.filter((p) => this.has(`${base}/playlists/${p}`) && !current(p)));
      const tracks = /* @__PURE__ */ new Set();
      let deleteCurrent = body.delete_unused !== true;
      if (body.context_type !== void 0) {
        for (const p of listed) {
          const t = trackOf(p);
          if (t) tracks.add(t);
          deleteCurrent = deleteCurrent && current(p);
        }
      }
      const switchAway = (t) => {
        const list = ofTrack(t);
        const now = this.value(`${base}/tracks/${t}`, "playlist_uid");
        const i = list.indexOf(now);
        if (list.length < 2 || i < 0) return;
        this.setValue(`${base}/tracks/${t}`, "playlist_uid", list[i === 0 ? 1 : i - 1]);
        doomed.add(now);
      };
      if (!deleteCurrent && body.delete_unused !== true && listed.length) {
        const version = versionOf(listed[0]);
        for (const t of tracks) {
          for (const p of ofTrack(t)) {
            if (versionOf(p) !== version) continue;
            if (current(p)) switchAway(t);
            else doomed.add(p);
          }
        }
      } else if (body.delete_unused === true) {
        for (const t of tracks) for (const p of ofTrack(t)) if (!current(p)) doomed.add(p);
      } else {
        for (const t of tracks) switchAway(t);
      }
      if (doomed.size === 0) throw new UAError("uasrv.invalid_value", "delete_playlists: nothing to delete", { cmd: "post", path: `${base}/delete_playlists` });
      for (const p of doomed) this.removeNode(`${base}/playlists/${p}`);
      return null;
    }
    /**
     * @internal `new_tracks_from_inputs` (fact 172), as Edit_NewTracksFromInputs: one audio
     * track per device input LUNA would auto-create for (not talkback, monitor, loopback),
     * named after the input (made unique), in the input's stem format unless `stem_format`
     * overrides it, with the input assigned, armed with `record_enable`. Answers
     * `{ new_tracks: [uid, ...] }`. Like LUNA, it never answers when no input is left or an
     * input is unknown. Auto gain is not modelled.
     */
    newTracksFromInputs(sessionUid, data) {
      const base = `/sessions/${sessionUid}`;
      const body = data ?? {};
      const ids = (Array.isArray(body.input_uids) ? body.input_uids : []).filter((u) => typeof u === "string" && u !== "");
      if (!ids.length) throw new UAError("uasrv.default_error", "new_tracks_from_inputs: input_uids is required", { cmd: "post", path: `${base}/new_tracks_from_inputs` });
      const inputs = ids.map((id) => this.children("/devices").map((d) => `/devices/${d}/inputs/${id}`).find((p) => this.has(p)));
      const never = () => new Promise(() => void 0);
      if (inputs.some((p) => p === void 0)) return never();
      const usable = inputs.filter((p) => autoCreatesTrack(String(this.value(p, "name") ?? "")));
      if (!usable.length) return never();
      const made = [];
      for (const input of [...new Set(usable)]) {
        const taken = new Set(this.children(`${base}/tracks`).map((t) => String(this.value(`${base}/tracks/${t}`, "name"))));
        const wanted = String(this.value(input, "name"));
        let name = wanted;
        for (let n = 2; taken.has(name); n++) name = `${wanted} ${n}`;
        const id = `t${this.children(`${base}/tracks`).length + 1}`;
        this.addTrack(sessionUid, id, { name, trackType: "audio", stemFormat: body.stem_format || String(this.value(input, "stem_format") ?? "mono") });
        this.setValue(`${base}/tracks/${id}`, "input_node_uid", splitPath(input).name);
        if (body.record_enable === true) this.setValue(`${base}/tracks/${id}`, "record_enabled", true);
        made.push(id);
      }
      return { new_tracks: made };
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
      const track = `/sessions/${body.session_uid ?? ""}/${body.is_bus === true ? "buses" : "tracks"}/${body.uid ?? ""}`;
      if (!body.session_uid || !body.preset_uid) throw new UAError("uasrv.invalid_property", "load: session_uid and preset_uid required", where);
      const preset = this.findPreset(body.preset_uid);
      if (!preset || !this.has(track)) throw new UAError("device.database_error", "load: no such track or preset", where);
      if (preset.kind === "plugin" && body.is_bus === true) throw new UAError("uasrv.invalid_type", "load: a plugin preset cannot go on a bus", where);
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
    /**
     * Add an analysis result to a source (fact 205): `<source>/analysis/<kind>` with `count`,
     * `md5` and versions, and its stored result as `payload`, which a `file/data` read answers.
     * `transients` pages by `index`/`count` like LUNA; the others answer whole. Pass the payload
     * in LUNA's shape (fact 207), e.g. `{ data: { keyData: [{ key: 'C major', confidence: 0.9 }] } }`.
     * Adding it again updates the node, as a re-analysis does (fact 206).
     *
     * @example
     * engine.addAnalysis('pkg1', 'src1', 'instrument', { instrument: 'vocals', confidence: 0.8 });
     */
    addAnalysis(packageUid, sourceUid, kind, payload, options = {}) {
      const path = `${options.sourcePath ?? `/workspace/sessions/${packageUid}/audio/${sourceUid}`}/analysis/${kind}`;
      const count = options.count ?? analysisCount(kind, payload);
      const md5 = options.md5 === void 0 ? `md5-${sourceUid}-${kind}-${this.nextRow()}` : options.md5;
      if (this.has(path)) {
        this.setValue(`${path}/file`, "payload", payload);
        this.setValue(path, "count", count);
        this.setValue(path, "md5", md5);
        return;
      }
      const version = Number(payload["version"] ?? 1);
      const versionMinor = Number(payload["version_minor"] ?? 0);
      this.addNode(path, { properties: { type: kind, version, version_minor: versionMinor, count, md5 }, readOnly: ["type", "version", "version_minor", "count", "md5"] });
      this.addNode(`${path}/file`, { properties: { payload } });
    }
    /** A `file/data` read of a non-overview analysis: LUNA answers nothing without a count (fact 205). */
    analysisPage(path, params) {
      const holder = this.nodes.get(splitPath(path).node);
      const payload = holder?.properties.get("payload");
      const count = Number(params["count"] ?? 0);
      if (!payload || count === 0) return void 0;
      if (!path.includes("/analysis/transients/")) return payload;
      const data = payload["data"] ?? {};
      const total = data.location?.length ?? 0;
      const index = Math.min(Math.max(0, Number(params["index"] ?? 0)), total);
      const n = count < 0 ? total - index : Math.min(count, total - index);
      return { ...payload, index, count: n, data: { ...data, location: (data.location ?? []).slice(index, index + n), level: (data.level ?? []).slice(index, index + n) } };
    }
    /**
     * How the next job the mock starts ends (facts 200-202): `completed` (default), `empty`
     * (LUNA's `failed` with `job.no_result`), `failed` with `error`, or `instant`, where the job
     * is added, finished and removed in one turn, as LUNA's cached-analysis path can (fact 202).
     * `hold` keeps it running until {@link finishJob} or a cancel.
     *
     * @example
     * engine.planNextJob({ outcome: 'failed', error: 'job.provider_unavailable' });
     */
    planNextJob(plan) {
      this.jobPlans.push(plan);
    }
    /**
     * Start a job under `/jobs/<uid>` as deviced's Job_Service does (fact 200): the node appears
     * (status `queued`) a turn after the command answers, runs and reports progress a turn at a
     * time, then publishes its error and terminal status and is removed in the same turn.
     * `work` runs just before it ends and answers whether anything was found. Returns the uid.
     *
     * @example
     * const uid = engine.startJob({ sessionUid: 'abc', jobType: 'chord_extraction' });
     */
    startJob(spec) {
      const plan = { ...this.jobPlans.shift() ?? {} };
      const uid = (268435456 + this.nextRow()).toString(16).padStart(32, "0");
      const path = `/jobs/${uid}`;
      const properties = {
        uid,
        session_uid: spec.sessionUid,
        job_type: spec.jobType,
        status: "queued",
        stage: "",
        error: "",
        warning: "",
        cancellable: true,
        percent_complete: 0
      };
      if (spec.targetUid) properties["target_uid"] = spec.targetUid;
      let canceled = false;
      const end = () => {
        if (!this.has(path)) return;
        let status = "completed";
        let error = "";
        if (canceled) status = "canceled";
        else if (plan.outcome === "failed") {
          status = "failed";
          error = plan.error ?? "job.internal";
        } else {
          const found = spec.work ? spec.work() : true;
          if (plan.outcome === "empty" || !found) {
            status = "failed";
            error = "job.no_result";
          }
        }
        if (error) this.setValue(path, "error", error);
        if (status === "completed") this.setValue(path, "percent_complete", 100);
        this.setValue(path, "status", status);
        this.setValue(path, "cancellable", false);
        this.jobFinishers.delete(uid);
        this.removeNode(path);
      };
      const commands = {
        cancel_job: (_d, engine) => {
          if (engine.value(path, "cancellable") !== true || engine.value(path, "status") === "canceling") throw new UAError("uasrv.invalid_value", "cancel_job: no longer cancellable", { cmd: "post", path: `${path}/cancel_job` });
          canceled = true;
          engine.setValue(path, "status", "canceling");
          return null;
        }
      };
      const add = () => {
        this.addNode(path, { properties, readOnly: Object.keys(properties) });
        this.nodes.get(path).children = [];
        this.nodes.set(`${path}/commands`, { properties: /* @__PURE__ */ new Map(), readOnly: /* @__PURE__ */ new Set(), commands: new Map(Object.entries(commands)), children: [] });
      };
      if (plan.outcome === "instant") {
        plan.outcome = void 0;
        setTimeout(() => {
          add();
          end();
        }, 0);
        return uid;
      }
      this.jobFinishers.set(uid, end);
      const steps = [
        add,
        () => {
          this.setValue(path, "status", "running");
          this.setValue(path, "stage", "processing");
          this.setValue(path, "percent_complete", 40);
        },
        () => this.setValue(path, "percent_complete", 80)
      ];
      const tick = (i) => {
        setTimeout(() => {
          if (i < steps.length) {
            if (i === 0 || this.has(path)) steps[i]();
            tick(i + 1);
          } else if (!plan.hold || canceled) end();
          else tick(i);
        }, 0);
      };
      tick(0);
      return uid;
    }
    /** End a job started under a `hold` plan (see {@link planNextJob}). */
    finishJob(uid) {
      this.jobFinishers.get(uid)?.();
    }
    jobPlans = [];
    jobFinishers = /* @__PURE__ */ new Map();
    /**
     * `extract_chords` and `extract_lyrics` on the session's main context (facts 203, 204): a
     * clip, or the context's selected playlists; the job targets the clip's track. What they
     * find is the mock's stand-in, not a detector's: chords `C G Am F` a bar apart over the clip,
     * and one transcribed line per second of source.
     */
    installExtractionCommands(sessionUid, packageUid) {
      const base = `/sessions/${sessionUid}`;
      const node = this.nodes.get(`${base}/contexts/main/commands`);
      if (!node) return;
      const fail = (cmd, code, why) => new UAError(code, `${cmd}: ${why}`, { cmd: "post", path: `${base}/contexts/main/commands/${cmd}` });
      const target = (body, cmd) => {
        if (body.clip_uid !== void 0) {
          const clip = this.findClip(base, body.clip_uid);
          if (!clip) throw fail(cmd, "device.no_selection", "no such clip");
          const pl2 = clip.slice(0, clip.lastIndexOf("/clips/"));
          return { clips: [clip], track: String(this.value(pl2, "track_uid") ?? "") || void 0 };
        }
        const pls = this.value(`${base}/contexts/main`, "selection_playlists") ?? [];
        if (cmd === "extract_chords" ? pls.length !== 1 : pls.length === 0) throw fail(cmd, "device.no_selection", "nothing (or more than one track) selected");
        const pl = `${base}/playlists/${pls[0]}`;
        return { clips: this.children(`${pl}/clips`).map((c) => `${pl}/clips/${c}`), track: String(this.value(pl, "track_uid") ?? "") || void 0 };
      };
      node.commands.set("extract_chords", (data) => {
        const body = data ?? {};
        if (!body.session_uid) throw fail("extract_chords", "uasrv.missing_field", "session_uid is required");
        const { clips, track } = target(body, "extract_chords");
        this.startJob({
          sessionUid,
          jobType: "chord_extraction",
          ...track ? { targetUid: track } : {},
          work: () => {
            const names = ["C", "G", "Am", "F"];
            let found = false;
            for (const clip of clips) {
              const start = Number(this.value(clip, "start") ?? 0);
              const stop = Number(this.value(clip, "stop") ?? start);
              const segments = [];
              for (let t = start, i = 0; t < stop; t += 4 * 96e9, i++) {
                this.addChord(sessionUid, t, names[i % 4]);
                segments.push({ chord_complex_pop: names[i % 4], start: i * 2, end: i * 2 + 2 });
                found = true;
              }
              const source = this.value(clip, "source_uid");
              if (typeof source === "string" && source) this.addAnalysis(packageUid, source, "chord", { version: 1, index: 0, count: segments.length, key: "C major", data: segments });
            }
            return found;
          }
        });
        return null;
      });
      node.commands.set("extract_lyrics", (data) => {
        const body = data ?? {};
        if (!body.session_uid) throw fail("extract_lyrics", "uasrv.missing_field", "session_uid is required");
        const { clips, track } = target(body, "extract_lyrics");
        const known = this.value("/lyric_transcription", "providers") ?? [];
        if (body.provider !== void 0 && !known.includes(body.provider)) this.jobPlans.unshift({ outcome: "failed", error: "job.provider_unavailable" });
        this.startJob({
          sessionUid,
          jobType: "lyric_transcription",
          ...track ? { targetUid: track } : {},
          work: () => {
            let found = false;
            for (const clip of clips) {
              const source = this.value(clip, "source_uid");
              if (typeof source !== "string" || !source) continue;
              const from = Number(this.value(clip, "source_start") ?? 0);
              const to = Number(this.value(clip, "source_stop") ?? from);
              for (let ns = from, n = 1; ns < to; ns += 1e9, n++) {
                const text = `line ${n}`;
                this.addLyric(sessionUid, { sourceUid: source, location: ns, length: 8e8, text, words: [{ word: "line", offset: 0, length: 4e8 }, { word: String(n), offset: 4e8, length: 4e8 }] });
                if (body.add_to_session === true) this.addLyric(sessionUid, { location: Number(this.value(clip, "start") ?? 0) + (n - 1) * 2 * 96e9, length: 96e9, text });
                found = true;
              }
            }
            return found;
          }
        });
        return null;
      });
    }
    /**
     * Add a lyric line to a session (fact 152): a ruler line at a tick, or with `sourceUid` a line
     * transcribed from that source, at nanoseconds into it. `words` is stored as LUNA sends it, a
     * JSON string. Answers the line's rowid.
     */
    addLyric(session, line) {
      const base = `/sessions/${session}/lyrics`;
      const rowid = line.rowid ?? this.children(base).length + 1;
      this.addNode(`${base}/${rowid}`, {
        properties: {
          type: "lyric",
          rowid,
          source_uid: line.sourceUid ?? "00000000000000000000000000000000",
          // LUNA's units: 0 ticks (a ruler line), 1 time (a transcribed line).
          units: line.sourceUid ? 1 : 0,
          length: line.length ?? 0,
          location: line.location,
          text: line.text,
          words: JSON.stringify({ words: line.words ?? [] })
        },
        readOnly: ["rowid"]
      });
      return rowid;
    }
    /**
     * @internal The rowid of the lyric line at `location` among the ruler's lines, or with
     * `sourceUid` among that source's lines (fact 153).
     */
    lyricAt(session, location, sourceUid) {
      const base = `/sessions/${session}/lyrics`;
      const isRuler = (v) => /^[0-]*$/.test(String(v ?? ""));
      return this.children(base).find((row) => {
        const src = this.value(`${base}/${row}`, "source_uid");
        const sameKind = sourceUid === void 0 ? isRuler(src) : src === sourceUid;
        return sameKind && this.value(`${base}/${row}`, "location") === location;
      });
    }
    /**
     * @internal Re-derive the ticks of a session's time signatures from the first, keeping each
     * one's bar, as deviced's `Edit_TimeSignatures` does after a set or a delete (fact 154).
     */
    retickTimeSignatures(sessionBase) {
      const folder = `${sessionBase}/time_signatures`;
      const rows = this.children(folder).map((id) => ({ id, bar: Number(this.value(`${folder}/${id}`, "bar") ?? 1), tick: Number(this.value(`${folder}/${id}`, "tick") ?? 0), n: Number(this.value(`${folder}/${id}`, "numerator") ?? 4), d: Number(this.value(`${folder}/${id}`, "denominator") ?? 4) })).sort((a, b) => a.bar - b.bar);
      let prev = rows[0];
      for (const row of rows.slice(1)) {
        const tick = prev.tick + (row.bar - prev.bar) * prev.n * (4 * 96e9 / prev.d);
        if (tick !== row.tick) this.setValue(`${folder}/${row.id}`, "tick", tick);
        row.tick = tick;
        prev = row;
      }
    }
    /**
     * Register a session package in the workspace. `template` makes it a session template
     * (`.lunatemplate`) that `new_session_from_template` copies, with `tracks` as the new
     * session's tracks; `online: false` is one whose file is missing. `sessionType` is the
     * row's `session_type` (`'default'`, `'standalone'`, ...), `directoryPath` its folder.
     */
    addPackage(uid, options = {}) {
      const ext = options.template ? "lunatemplate" : "luna";
      this.addNode(`/workspace/sessions/${uid}`, {
        properties: { uid, file_name: `${options.name ?? uid}.${ext}`, directory_path: options.directoryPath ?? `/tmp/${options.name ?? uid}`, session_type: options.sessionType ?? (options.template ? "session_template" : "default"), factory: options.factory ?? false, favorite: options.favorite ?? false, created: options.lastOpened ?? 0, modified: 0, last_opened: options.lastOpened ?? 0, comments: "" }
      });
      if (options.tracks) this.templateTracks.set(uid, options.tracks);
      if (options.online === false) this.offlinePackages.add(uid);
    }
    /** @internal Files `delete_unused_media` keeps for a reason the mock does not model (undo, versions, backups). */
    keptMedia = /* @__PURE__ */ new Map();
    /**
     * Make `delete_unused_media` keep a file of a package for `reason` (`'undo'`, `'version'`,
     * `'backup'`, ...), as LUNA keeps one undo history or a saved version still uses (fact 240).
     *
     * @example engine.keepMedia('pkg_abc', 'src3', 'undo');
     */
    keepMedia(packageUid, uid, reason) {
      this.keptMedia.set(`${packageUid}:${uid}`, reason);
    }
    /** @internal The `delete_unused_media` handler. */
    deleteUnusedMedia(data) {
      const body = data ?? {};
      const where = { cmd: "post", path: "/workspace/delete_unused_media" };
      if (typeof body.session_package_uid !== "string" || body.session_package_uid === "") throw new UAError("uasrv.missing_field", "delete_unused_media: session_package_uid is required", where);
      const pkg = body.session_package_uid;
      const folder = `/workspace/sessions/${pkg}/audio`;
      const all = this.has(folder) ? this.children(folder) : [];
      const used = /* @__PURE__ */ new Set();
      for (const session of this.children("/sessions")) {
        if (String(this.value(`/sessions/${session}`, "session_package_uid")) !== pkg) continue;
        for (const playlist of this.children(`/sessions/${session}/playlists`)) {
          for (const clip of this.children(`/sessions/${session}/playlists/${playlist}/clips`)) {
            const path = `/sessions/${session}/playlists/${playlist}/clips/${clip}`;
            for (const prop of ["source_uid", "render_source_uid"]) {
              const v = this.value(path, prop);
              if (typeof v === "string" && v) used.add(v);
            }
          }
        }
      }
      const unused = [];
      const kept = [];
      for (const uid of all) {
        let reason = used.has(uid) ? "session" : this.keptMedia.get(`${pkg}:${uid}`);
        if (reason === "undo" && body.clear_undo === true) reason = void 0;
        if (reason === "backup" && body.delete_auto_backups === true) reason = void 0;
        if (reason) kept.push({ uid, reason });
        else unused.push(uid);
      }
      if (body.pre_flight !== true) {
        for (const uid of unused) {
          this.removeNode(`${folder}/${uid}`);
          this.keptMedia.delete(`${pkg}:${uid}`);
        }
      }
      return {
        total_files: all.length,
        total_unused_files: unused.length,
        files_only_in_backups: kept.filter((k) => k.reason === "backup").length,
        unused_files: unused,
        kept_files: kept
      };
    }
    /**
     * Publish whether `command` on `nodePath` is enabled, as LUNA does at
     * `<nodePath>/<command>/enabled` (fact 234), and push changes. Posting the command is not
     * affected: LUNA's own handlers decide what a disabled command does.
     */
    setCommandEnabled(nodePath, command, enabled) {
      const path = `${nodePath}/${command}`;
      if (this.has(path)) this.setValue(path, "enabled", enabled);
      else this.addNode(path, { properties: { enabled } });
    }
    /**
     * Raise an error notice in `/errors` (fact 235), as LUNA's error service does: `group` is
     * stored as LUNA stores it, JSON text. Answers its uid.
     */
    addErrorNotice(notice) {
      if (!this.has("/errors")) this.addNode("/errors", { properties: { type: "folder" } });
      const uid = notice.uid ?? `err${this.children("/errors").length + 1}`;
      this.addNode(`/errors/${uid}`, {
        properties: {
          uid,
          error_timestamp: notice.timestamp ?? Math.floor(Date.now() / 1e3),
          error_level: notice.level ?? "error",
          error_code: notice.code,
          error_title: notice.title ?? "",
          error_payload: notice.payload ?? "",
          error_btn_title: "",
          error_parent_uuid: null,
          error_group: JSON.stringify(notice.groups ?? [])
        }
      });
      return uid;
    }
    /** Per template package, the tracks a session made from it starts with. */
    templateTracks = /* @__PURE__ */ new Map();
    /**
     * Preference contexts as LUNA keeps them on disk, one record per context (fact 232): a
     * context is loaded into `/preferences/<context>` only when `init_preference` names it.
     * Seed one to model values left by an earlier run.
     */
    preferenceFiles = /* @__PURE__ */ new Map();
    /** Packages whose file is missing: the query answers `file_online: false` for them. */
    offlinePackages = /* @__PURE__ */ new Set();
    /** @internal The highest lyric rowid handed out per session: deleted rows keep theirs (fact 153). */
    lyricRowHigh = /* @__PURE__ */ new Map();
    /** Tags per session package, added with `/workspace/add_tag` or set here (fact 161). */
    packageTags = /* @__PURE__ */ new Map();
    /** MIDI and video files `import_file` copied into packages (fact 163). */
    importedFiles = [];
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
      if (!existed && /^\/sessions\/[^/]+\/playlists\/[^/]+\/clips\/[^/]+$/.test(clean)) {
        addClipChildren(this, clean, (path2, gain) => this.addControl(path2, "gain", { discrete: false, value: gain, real: gain, str: gain.toFixed(1), automatable: true, normalized: Taper.named(Taper.DEFAULT_NAME).toNormalized(gain) }));
      }
    }
    /** @internal What mock-automation.ts needs from inside the engine. */
    editHelpers = {
      zeroControl: (path) => {
        for (const [prop, v] of Object.entries({ value: 0, real_value: 0, normalized_value: FADER_ZERO, string_value: "0.0" })) if (this.value(path, prop) !== v) this.setValue(path, prop, v);
      },
      tickAfter: (sessionPath, tick, seconds) => this.tickAfter(sessionPath, tick, seconds)
    };
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
      this.push({ path: `${clean === "/" ? "" : clean}/${property}/value`, data: value }, void 0);
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
      const previous2 = this.nodes.get(sessionPath)?.properties.get("location");
      return {
        tick,
        bar_beat: { bar: sig.bar + Math.floor(rel / (beat * sig.n)), beat: 1 + Math.floor(inBar / beat), tick: inBar % beat },
        min_sec: { minutes: Math.floor(seconds / 60), seconds: seconds % 60 },
        tempo: previous2?.tempo ?? 120,
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
    /**
     * @internal A clip uid free in the whole session, as LUNA's are: `clip<n>`, counting on from
     * the clips on the playlist and skipping any uid another playlist already uses.
     */
    nextClipId(base, playlist) {
      const here = this.children(`${base}/playlists/${playlist}/clips`);
      const taken = new Set(this.children(`${base}/playlists`).flatMap((pl) => this.children(`${base}/playlists/${pl}/clips`)));
      let n = here.length + 1;
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
      const num2 = (v) => Number(v ?? 0);
      const copy = () => {
        if (s === void 0 || e === void 0 || e <= s) return false;
        this.timelineClipboard = {
          length: e - s,
          lanes: playlists.map(
            (pl) => clipsOf(pl).filter((c) => num2(c.props["start"]) < e && num2(c.props["stop"]) > s).map((c) => {
              const c0 = num2(c.props["start"]);
              const from = Math.max(c0, s);
              const to = Math.min(num2(c.props["stop"]), e);
              const srcStart = num2(c.props["source_start"]) + ns(c0, from);
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
            const c0 = num2(c.props["start"]);
            const c1 = num2(c.props["stop"]);
            if (c1 <= s || c0 >= e) continue;
            const src0 = num2(c.props["source_start"]);
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
            this.addNode(`${base}/playlists/${pl}/clips/${id}`, { properties: { ...c, uid: id, start: num2(c["start"]) + at, stop: num2(c["stop"]) + at } });
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
          const remap = Array.isArray(body["playlists"]) ? body["playlists"].filter((e) => e?.source_playlist && e.destination_playlist).map((e) => [e.source_playlist, e.destination_playlist]) : [];
          const pairs = remap.length ? remap : this.editPlaylists(base, body).map((pl) => [pl, pl]);
          for (const [pl, dstPl] of pairs) {
            if (!this.has(`${base}/playlists/${pl}`) || !this.has(`${base}/playlists/${dstPl}/clips`)) continue;
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
                newClipFrom(dstPl, clip.path, moved);
                continue;
              }
              if (!before && !after && dstPl === pl) {
                for (const [k, v] of Object.entries(moved)) this.setValue(clip.path, k, v);
                continue;
              }
              newClipFrom(dstPl, clip.path, moved);
              if (!before && !after) {
                this.removeNode(clip.path);
                continue;
              }
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
     * @internal `midi_operation` as deviced's `Edit_MIDIOperation` applies it (fact 158), on the
     * main context's selected notes (focus `notes`). The payload is checked as
     * `UAMIDIOperation::FromVar` does, refusing with `uasrv.invalid_property`. Modelled: velocity,
     * velocity_percent, transpose, duration (`bar|beat|tick`, in the first time signature),
     * duration_percent (with the exact `num/den`), staccato, legato (to the next selected start
     * in the clip, else the next beat), reverse_time (inside the selection range) and the three
     * chromatic inverts; a scale is checked but inverts stay chromatic. Other focuses, and a
     * selection with no notes, change nothing and answer success, as LUNA's "nothing to operate
     * on" does. The selected notes are rewritten to follow, as LUNA re-selects them.
     */
    midiOperation(sessionBase, data) {
      const where = { cmd: "post", path: `${sessionBase}/contexts/main/commands/midi_operation` };
      const refuse = () => new UAError("uasrv.invalid_property", "midi_operation: uasrv.invalid_property", where);
      const op = (data ?? {}).midi_operation;
      if (!op || typeof op !== "object" || typeof op.operation !== "string") throw refuse();
      const isInt = (v2) => typeof v2 === "number" && Number.isInteger(v2);
      const name = op.operation;
      const value = op.value;
      const needsValue = ["velocity", "velocity_percent", "transpose", "duration_percent"];
      const known = [...needsValue, "duration", "legato", "staccato", "reverse_time", "invert_notes", "invert_notes_first", "invert_notes_root"];
      if (!known.includes(name)) throw refuse();
      if (needsValue.includes(name) && !isInt(value)) throw refuse();
      const v = value;
      if (name === "velocity" && (v < 1 || v > 127)) throw refuse();
      if (name === "velocity_percent" && (v < 1 || v > 200)) throw refuse();
      if (name === "duration_percent" && v < 1) throw refuse();
      if (name === "transpose" && (v < -24 || v > 24)) throw refuse();
      if (name === "duration" && (typeof op.value_str !== "string" || op.value_str === "")) throw refuse();
      if (name.startsWith("invert")) {
        const hasRoot = op.scale_root !== void 0;
        if (hasRoot !== (op.scale_mask !== void 0)) throw refuse();
        if (hasRoot && (!isInt(op.scale_root) || !isInt(op.scale_mask) || op.scale_root < 0 || op.scale_root > 11 || op.scale_mask < 1 || op.scale_mask > 4095 || (op.scale_mask & 1 << op.scale_root) === 0)) throw refuse();
      }
      const ctx = `${sessionBase}/contexts/main`;
      if (this.value(ctx, "focus") !== "notes") return null;
      const TICKS_PER_DISPLAY = 1e8;
      const BEAT = 960 * TICKS_PER_DISPLAY;
      const pairs = [];
      for (const [clip, rows] of this.selectedRows(sessionBase)) {
        for (const on of rows.filter((r) => r.noteOn)) {
          const off = rows.find((r) => !r.noteOn && r.data1 === on.data1 && r.tick >= on.tick);
          pairs.push({ clip, on, off });
        }
      }
      if (!pairs.length) return null;
      const length = (p) => p.off ? p.off.tick - p.on.tick : 0;
      let newStart = (p) => p.on.tick;
      let newLength = (p) => length(p);
      let newPitch = (p) => p.on.data1;
      let newVelocity = (p) => p.on.data2;
      const pitches = pairs.map((p) => p.on.data1);
      const lo = Math.min(...pitches);
      const hi = Math.max(...pitches);
      switch (name) {
        case "velocity":
          newVelocity = () => v;
          break;
        case "velocity_percent":
          newVelocity = (p) => Math.min(127, Math.max(1, Math.trunc(p.on.data2 * v / 100)));
          break;
        case "transpose":
          newPitch = (p) => Math.min(127, Math.max(0, p.on.data1 + v));
          break;
        case "staccato":
          newLength = () => 100 * TICKS_PER_DISPLAY;
          break;
        case "duration_percent": {
          const exact = typeof op.value_str === "string" ? /^(\d+)\/(\d+)$/.exec(op.value_str) : null;
          const num2 = exact ? Number(exact[1]) : 0;
          const den = exact ? Number(exact[2]) : 0;
          newLength = (p) => num2 > 0 && den > 0 ? Math.floor((length(p) * num2 + Math.floor(den / 2)) / den) : Math.trunc(length(p) * v / 100);
          break;
        }
        case "duration": {
          const parts = String(op.value_str).match(/-?\d+/g)?.map(Number) ?? [];
          if (parts.length === 0) throw refuse();
          const [bars, beats, tick] = parts.length >= 3 ? [parts[0], parts[1], parts[2]] : parts.length === 2 ? [0, parts[0], parts[1]] : [0, 0, parts[0]];
          const ticks = tick < 3840 ? tick * TICKS_PER_DISPLAY : tick;
          const first = this.children(`${sessionBase}/time_signatures`).map((id) => this.properties(`${sessionBase}/time_signatures/${id}`)).sort((a, b) => Number(a["tick"] ?? 0) - Number(b["tick"] ?? 0))[0] ?? {};
          const beatTicks = 4 * BEAT / Number(first["denominator"] ?? 4);
          const total = bars * Number(first["numerator"] ?? 4) * beatTicks + beats * beatTicks + ticks;
          newLength = () => total;
          break;
        }
        case "legato": {
          const nextBeat = (t) => t % BEAT === 0 ? t : Math.ceil(t / BEAT) * BEAT;
          newLength = (p) => {
            const stop = p.on.tick + length(p);
            const later = pairs.filter((q) => q.clip === p.clip && q.on.tick > p.on.tick).map((q) => q.on.tick);
            const target = later.length ? later.reduce((best, t) => Math.abs(t - stop) < Math.abs(best - stop) ? t : best) : nextBeat(stop);
            return target - p.on.tick;
          };
          break;
        }
        case "reverse_time": {
          const start = Number(this.value(ctx, "selection_start") ?? 0);
          const stop = Number(this.value(ctx, "selection_stop") ?? 0);
          newStart = (p) => {
            const offset = Number(this.value(p.clip, "midi_source_start") ?? 0) - Number(this.value(p.clip, "start") ?? 0);
            return start + offset + (stop + offset - (p.on.tick + length(p)));
          };
          break;
        }
        case "invert_notes":
        case "invert_notes_root":
          newPitch = (p) => Math.min(127, Math.max(0, lo + hi - p.on.data1));
          break;
        case "invert_notes_first": {
          const first = [...pairs].sort((a, b) => a.on.tick - b.on.tick)[0].on.data1;
          newPitch = (p) => Math.min(127, Math.max(0, 2 * first - p.on.data1));
          break;
        }
      }
      const byClip = /* @__PURE__ */ new Map();
      const selection = /* @__PURE__ */ new Map();
      for (const p of pairs) {
        const start = newStart(p);
        const pitch = newPitch(p);
        const rows = byClip.get(p.clip) ?? [];
        rows.push({ ...p.on, tick: start, data1: pitch, data2: newVelocity(p) });
        if (p.off) rows.push({ ...p.off, tick: start + newLength(p), data1: pitch });
        byClip.set(p.clip, rows);
        const playlist = p.clip.split("/")[4];
        const offset = Number(this.value(p.clip, "midi_source_start") ?? 0) - Number(this.value(p.clip, "start") ?? 0);
        const notes = selection.get(playlist) ?? [];
        notes.push([pitch, start - offset, start - offset + newLength(p), p.on.rowid]);
        selection.set(playlist, notes);
      }
      for (const [clip, rows] of byClip) this.midiEdit(clip, "changed", rows);
      this.setValue(ctx, "selection_notes", [...selection].map(([playlist_uid, notes]) => ({ playlist_uid, notes })));
      return null;
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
     * `/sessions/abc/set_marker`), to reproduce a verb that answers without acting (fact 71),
     * or add a command the mock does not model to a node it has.
     *
     * @example
     * engine.overrideCommand('/sessions/abc/delete_clip', () => null);
     * engine.overrideCommand('/workspace/some_new_command', (data) => ({ ok: true }));
     */
    overrideCommand(path, handler) {
      const { node: nodePath, name } = splitPath(normalize(path));
      const node = this.nodes.get(nodePath);
      if (!node) throw new UAError("uasrv.invalid_object", `overrideCommand: no node at ${nodePath}`, { path });
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
          if (body.track_uid === void 0) throw new UAError("uasrv.missing_field", "duplicate_tracks: track_uid is required", { cmd: "post", path: `${base}/duplicate_tracks` });
          if (!Array.isArray(body.track_uid)) throw new UAError("uasrv.invalid_type", "duplicate_tracks: track_uid must be an array", { cmd: "post", path: `${base}/duplicate_tracks` });
          const out = [];
          body.track_uid.forEach((id, i) => {
            if (engine.value(`${base}/buses/${id}`, "bus_type") === "master") return;
            const copy = body.destination_track_uid?.[i] || `${id}_copy`;
            const src = `${base}/tracks/${id}`;
            engine.addTrack(uid, copy, { name: `${String(engine.value(src, "name"))} copy`, trackType: String(engine.value(src, "track_type") ?? "audio"), stemFormat: String(engine.value(src, "stem_format") ?? "mono") });
            out.push(copy);
          });
          if (body.before_uid && out.length && engine.channelIds(uid).includes(body.before_uid)) {
            const ids = engine.channelIds(uid).filter((c) => !out.includes(c));
            const at = ids.indexOf(body.before_uid) + 1;
            engine.renumber(uid, [...ids.slice(0, at), ...out, ...ids.slice(at)]);
          }
          return { duplicated_channels: out.map((id) => ({ channel_id: id })) };
        },
        // Fact 168, as Edit_DeleteBus: the master is refused with device.database_error, a cue
        // bus or an unknown one with uasrv.invalid_type. A folder's contents stay, outside it.
        delete_bus: (data, engine) => {
          const body = data ?? {};
          const where = { cmd: "post", path: `${base}/delete_bus` };
          if (!body.bus_uid) throw new UAError("uasrv.missing_field", "delete_bus: bus_uid is required", where);
          const bus = `${base}/buses/${body.bus_uid}`;
          const type = String(engine.value(bus, "bus_type") ?? "");
          if (!engine.has(bus) || type.startsWith("cue_")) throw new UAError("uasrv.invalid_type", "delete_bus: no such bus, or a cue bus", where);
          if (type === "master") throw new UAError("device.database_error", "delete_bus: the master bus cannot be deleted", where);
          if (engine.isFolder(uid, body.bus_uid)) engine.setFolderMode(uid, body.bus_uid, "none");
          engine.removeNode(bus);
          engine.danglingAssignments(uid, body.bus_uid);
          engine.renumber(uid);
          return null;
        },
        // Fact 170: as Edit_DeletePlaylists, without edit groups.
        delete_playlists: (data, engine) => engine.deletePlaylists(uid, data),
        // Fact 172: as Edit_NewTracksFromInputs.
        new_tracks_from_inputs: (data, engine) => engine.newTracksFromInputs(uid, data),
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
        /**
         * As `Edit_TimeSignatures::SetTimeSignatureAtBar`: the signature at `bar` is rewritten or
         * a new one added there, and every signature after it keeps its bar and moves to the tick
         * the signatures before it give that bar (fact 154).
         */
        set_time_signature: (data, engine) => {
          const body = data ?? {};
          const bar = body.bar ?? 1;
          const n = body.numerator ?? 4;
          const d = body.denominator ?? 4;
          const existing = engine.children(`${base}/time_signatures`).find((id) => engine.value(`${base}/time_signatures/${id}`, "bar") === bar);
          if (existing !== void 0) {
            engine.setValue(`${base}/time_signatures/${existing}`, "numerator", n);
            engine.setValue(`${base}/time_signatures/${existing}`, "denominator", d);
          } else {
            const id = Math.max(0, ...engine.children(`${base}/time_signatures`).map(Number).filter(Number.isFinite)) + 1;
            engine.addNode(`${base}/time_signatures/${id}`, { properties: { tick: 0, bar, partial: false, numerator: n, denominator: d } });
          }
          engine.retickTimeSignatures(base);
          return null;
        },
        /**
         * As `Edit_DeleteTimeSignature`: by `bar`, removes the signature starting there and re-ticks
         * the later ones (keeping their bars); a bar with none answers success and changes nothing.
         * By `tick`, removes the one at that tick; tick 0 or no signature there is refused (fact 154).
         */
        delete_time_signature: (data, engine) => {
          const body = data ?? {};
          const refuse = () => new UAError("uasrv.invalid_property", "delete_time_signature: uasrv.invalid_property", { cmd: "post", path: `${base}/delete_time_signature` });
          const rows = engine.children(`${base}/time_signatures`);
          if (body.bar !== void 0) {
            const row2 = rows.find((id) => engine.value(`${base}/time_signatures/${id}`, "bar") === body.bar);
            if (row2 !== void 0) engine.removeNode(`${base}/time_signatures/${row2}`);
            engine.retickTimeSignatures(base);
            return null;
          }
          if (body.tick === void 0 || body.tick === 0) throw refuse();
          const row = rows.find((id) => engine.value(`${base}/time_signatures/${id}`, "tick") === body.tick);
          if (row === void 0) throw refuse();
          engine.removeNode(`${base}/time_signatures/${row}`);
          return null;
        },
        /** As `Edit_DeleteKeySignature`: tick 0, a missing tick or no key there is refused (fact 154). */
        delete_key_signature: (data, engine) => {
          const body = data ?? {};
          const row = engine.children(`${base}/key_signatures`).find((id) => engine.value(`${base}/key_signatures/${id}`, "tick") === body.tick);
          if (typeof body.tick !== "number" || body.tick === 0 || row === void 0) {
            throw new UAError("uasrv.invalid_property", "delete_key_signature: uasrv.invalid_property", { cmd: "post", path: `${base}/delete_key_signature` });
          }
          engine.removeNode(`${base}/key_signatures/${row}`);
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
          for (const t of body.tracks ?? []) {
            const path = engine.has(`${base}/tracks/${t}`) ? `${base}/tracks/${t}` : `${base}/buses/${t}`;
            if (engine.has(path)) engine.setValue(path, "automation_mode", names[body.automation_mode ?? 1] ?? "read");
          }
          return null;
        },
        // Range automation edits and warp markers (facts 227, 230-231), in mock-automation.ts.
        write_control_values: (data) => controlValuesCommand("write_control_values", base, this, this.editHelpers)(data),
        trim_control_values: (data) => controlValuesCommand("trim_control_values", base, this, this.editHelpers)(data),
        ...warpCommands(base, this, this.editHelpers),
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
        },
        /**
         * As `Edit_SetLyric` (fact 153). With `rowid`: a `location` first deletes the line of the
         * same kind (ruler, or `source_uid`'s) at that location, this one included, then moves the
         * row; a non-empty `text` rewrites it, an empty one is skipped. Without `rowid`, a
         * `location` adds a line, replacing the one of the same kind already there.
         */
        set_lyric: (data, engine) => {
          const body = data ?? {};
          const where = { cmd: "post", path: `${base}/set_lyric` };
          if (typeof body.session_uid !== "string") throw new UAError("uasrv.invalid_property", "set_lyric: uasrv.invalid_property", where);
          if (body.rowid !== void 0) {
            const path = `${base}/lyrics/${body.rowid}`;
            if (!engine.has(path)) throw new UAError("device.database_error", "set_lyric: no such rowid", where);
            if (body.location !== void 0) {
              const occupant2 = engine.lyricAt(uid, body.location, body.source_uid);
              if (occupant2 !== void 0) engine.removeNode(`${base}/lyrics/${occupant2}`);
              if (engine.has(path)) engine.setValue(path, "location", body.location);
            }
            if (body.text && engine.has(path)) engine.setValue(path, "text", body.text);
            return null;
          }
          if (body.location === void 0) throw new UAError("uasrv.missing_field", "set_lyric: location is required to add a lyric", where);
          const occupant = engine.lyricAt(uid, body.location, body.source_uid);
          if (occupant !== void 0) engine.removeNode(`${base}/lyrics/${occupant}`);
          const rowid = Math.max(engine.lyricRowHigh.get(uid) ?? 0, ...engine.children(`${base}/lyrics`).map(Number).filter(Number.isFinite)) + 1;
          engine.lyricRowHigh.set(uid, rowid);
          engine.addLyric(uid, { rowid, location: body.location, text: body.text ?? "", ...body.length !== void 0 ? { length: body.length } : {}, ...body.source_uid !== void 0 ? { sourceUid: body.source_uid } : {} });
          return null;
        },
        /**
         * As `Edit_DeleteLyric` (fact 153): by `rowid`, by `location` (a ruler line, or
         * `source_uid`'s), or every line of `source_uids`. A row or location that is not there
         * answers success, as deviced ignores the delete's own result.
         */
        delete_lyric: (data, engine) => {
          const body = data ?? {};
          const where = { cmd: "post", path: `${base}/delete_lyric` };
          const rows = engine.children(`${base}/lyrics`);
          if (body.rowid === void 0 && body.location === void 0 && body.source_uids !== void 0) {
            if (!Array.isArray(body.source_uids)) throw new UAError("uasrv.invalid_property", "delete_lyric: source_uids must be an array", where);
            const sources = body.source_uids;
            for (const row of rows) if (sources.includes(engine.value(`${base}/lyrics/${row}`, "source_uid"))) engine.removeNode(`${base}/lyrics/${row}`);
            return null;
          }
          if (body.rowid !== void 0) {
            if (engine.has(`${base}/lyrics/${body.rowid}`)) engine.removeNode(`${base}/lyrics/${body.rowid}`);
            return null;
          }
          if (body.location !== void 0) {
            const row = engine.lyricAt(uid, body.location, body.source_uid);
            if (row !== void 0) engine.removeNode(`${base}/lyrics/${row}`);
            return null;
          }
          throw new UAError("uasrv.missing_field", "delete_lyric: rowid, location or source_uids is required", where);
        }
      };
      this.addNode(base, {
        properties: {
          uid,
          name: options.name ?? uid,
          loaded: true,
          read_only: false,
          session_package_uid: pkg,
          // The package folder, `<directory_path>/<file_name>` of its workspace row (fact 239).
          session_package_path: this.has(`/workspace/sessions/${pkg}`) ? `${String(this.value(`/workspace/sessions/${pkg}`, "directory_path"))}/${String(this.value(`/workspace/sessions/${pkg}`, "file_name"))}` : `/tmp/${options.name ?? uid}/${options.name ?? uid}.luna`,
          can_undo: false,
          can_redo: false,
          change_count: 0,
          // LUNA's tokens for UA::ESoloMode (fact 157).
          solo_mode: "latching",
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
          enable_tempo_percent: false,
          rec_play_mode: "normal",
          count_in_enabled: false,
          pre_roll_enabled: false,
          post_roll_enabled: false,
          // Session settings (facts 155-156): rolls are "bars,beats,ticks" text, empty until set;
          // the click flags default on, as the session table declares them.
          pre_roll: "",
          post_roll: "",
          click_during_play: true,
          click_during_record: true,
          click_during_count_in: true,
          merge_midi: false
        },
        readOnly: ["uid", "loaded", "session_package_uid", "can_undo", "can_redo", "change_count", "location"],
        commands: { ...sessionCommands, ...groupCommands(uid) }
      });
      this.addNode(`${base}/tracks`);
      this.addNode(`${base}/playlists`);
      this.addNode(`${base}/buses`);
      this.addNode(`${base}/contexts/main`, {
        properties: { context_type: "main", focus: "tracks", selection_start: null, selection_stop: null, selection_tracks: null, selection_playlists: null, selection_notes: null, last_selected_track: null, pixels_per_tick: 1e-10, timeline_view_start_tick: null, grid_enable: true, grid: "1_4", settings: "{}" }
      });
      this.addNode(`${base}/contexts/main/commands`, {
        commands: {
          set_midi_output_assignments: midiOutputCommand(uid),
          // Fact 171, as Edit_SetInsertsPower: `plugin_power` of each named slot, `value` true
          // when left out; a frozen slot is skipped; an unknown slot is device.database_error.
          set_inserts_power: (data, engine) => {
            const body = data ?? {};
            const channel = engine.has(`${base}/tracks/${body.channel_uid}`) ? `${base}/tracks/${body.channel_uid}` : `${base}/buses/${body.channel_uid}`;
            const where = { cmd: "post", path: `${base}/contexts/main/commands/set_inserts_power` };
            if (!Array.isArray(body.inserts)) throw new UAError("uasrv.invalid_property", "set_inserts_power: inserts is required", where);
            for (const slot of body.inserts) {
              const path = `${channel}/effects/${slot}`;
              if (!engine.has(path)) throw new UAError("device.database_error", `set_inserts_power: no slot ${slot}`, where);
              if (engine.value(path, "frozen") === true) continue;
              engine.setValue(path, "plugin_power", body.value !== false);
            }
            return null;
          },
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
          /** LUNA's MIDI operations on the selection (fact 158); see {@link MockEngine.midiOperation}. */
          midi_operation: (data, engine) => engine.midiOperation(base, data),
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
      this.addNode(`${base}/lyrics`, { properties: { type: "lyrics" } });
      this.addNode(`${base}/groups`);
      this.addNode(`${base}/chords`);
      this.addNode(`${base}/storage`, { commands: storageCommands(`${base}/storage`) });
      if (!this.has(`/workspace/sessions/${pkg}`)) this.addPackage(pkg, { name: options.name ?? uid, lastOpened: Date.now() });
      this.installExtractionCommands(uid, pkg);
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
          },
          // Fact 168, as Edit_DeleteFolderContents: the folder, and everything inside it.
          delete_folder_with_contents: (data, engine) => {
            const body = data ?? {};
            const where = { cmd: "post", path: `${base}/buses/delete_folder_with_contents` };
            if (!body.session_uid || !body.bus_uid) throw new UAError("uasrv.invalid_property", "delete_folder_with_contents: session_uid and bus_uid are required", where);
            if (!engine.isFolder(uid, body.bus_uid)) throw new UAError("uasrv.invalid_value", "delete_folder_with_contents: not a folder", where);
            const doomed = [body.bus_uid];
            for (let i = 0; i < doomed.length; i++) for (const id of engine.channelIds(uid)) if (engine.folderOf(uid, id) === doomed[i] && !doomed.includes(id)) doomed.push(id);
            for (const id of doomed.reverse()) {
              if (engine.has(`${base}/tracks/${id}`)) engine.removeNode(`${base}/tracks/${id}`);
              else {
                engine.removeNode(`${base}/buses/${id}`);
                engine.danglingAssignments(uid, id);
              }
            }
            engine.renumber(uid);
            return null;
          }
        }
      });
      for (let i = 0; i < 4; i++) this.addBus(uid, `cue${i + 1}_${uid}`, { name: `CUE ${i + 1}`, busType: `cue_${i}`, stemFormat: "stereo" });
      this.addBus(uid, `master_${uid}`, { name: "Main Output", busType: "master", stemFormat: "stereo", color: 4294948970 });
      this.addNode(`/workspace/sessions/${pkg}/audio`);
      for (const name of options.tracks ?? []) this.addTrack(uid, name, { name });
      this.setCommandEnabled(`${base}/contexts/main/commands`, "paste", false);
      this.setCommandEnabled(base, "redo", false);
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
          preset_name: null,
          supports_auto_gain: false,
          name_modified: false,
          post_record_commands: [],
          instrument_determined: null
        },
        options.stemFormat === "stereo"
      );
      this.routeCues(sessionUid, `${base}/tracks/${id}`);
      this.addNode(`${base}/playlists/${playlist}`, { properties: { uid: playlist, name: "V1", track_uid: id, version: 1, stem_format: options.stemFormat ?? "mono", frozen: false, enable_compiled_clips: false } });
      this.addNode(`${base}/playlists/${playlist}/clips`);
      this.addNode(`${base}/tracks/${id}/midi_output_assignments`);
    }
    /** The `/gui` progress suppression handles held, uid (no dashes) to owner (fact 223). */
    get progressSuppressions() {
      return progressSuppressions(this);
    }
    /** An embedded LUNA page (`dashboard`, `luna_play`, ...) reloading: drops its and every legacy suppression (fact 224). */
    resetWebClient(owner) {
      resetWebClient(this, owner);
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
      const name = options.unnamed ? uid : options.name ?? `${uid}.wav`;
      this.addNode(path, {
        properties: { uid, name, stem_format: options.stemFormat ?? "mono", length: lengthNs, sample_rate: options.sampleRate ?? 48e3, origin: options.origin ?? 2, format: options.format ?? "wav" }
      });
      if (options.analysis === false) return;
      for (const [kind, pairNs2] of [
        ["overview", 125e9 / 48e3],
        ["overview_coarse", 125e9 / 48e3 * 12]
      ]) {
        const count = Math.max(1, Math.floor(lengthNs / pairNs2));
        this.addNode(`${path}/analysis/${kind}`, { properties: { count, md5: `md5-${uid}-${kind}` } });
        this.addNode(`${path}/analysis/${kind}/file`, { properties: { data: { count, channels } } });
      }
    }
    /**
     * Add a hardware device with `inputs` named inputs (uids `in_1`, `in_2`, ...) and `outputs`
     * named outputs (`out_1`, ...), with the properties LUNA's input and output nodes publish
     * (facts 76, 185, 189). Each input carries the four live analyses, off (fact 186). With
     * `autoGain`, tracks routed to its inputs report `supports_auto_gain` (fact 194).
     *
     * @example
     * engine.addDevice('Apollo', { inputs: ['In 1', 'In 2'], outputs: ['Monitor'], autoGain: true });
     */
    addDevice(id, options = {}) {
      const path = `/devices/${id}`;
      this.addNode(path, { properties: { name: id, device_type: "audio", online: options.online ?? true, sample_rate: 48e3, clock_source: "internal" } });
      if (options.autoGain) this.autoGainDevices.add(id);
      this.addNode(`${path}/inputs`);
      this.addNode(`${path}/outputs`);
      (options.inputs ?? []).forEach(
        (name, i) => this.addDeviceInput(id, name, { uid: `in_${i + 1}`, channel: i, ...options.stemFormat ? { stemFormat: options.stemFormat } : {}, ...options.ioType ? { ioType: options.ioType } : {} })
      );
      (options.outputs ?? []).forEach((name, i) => {
        const stem = options.stemFormat ?? "mono";
        const channels = stem === "stereo" ? [2 * i, 2 * i + 1] : [i];
        this.addNode(`${path}/outputs/out_${i + 1}`, {
          properties: { type: "output", uid: `out_${i + 1}`, name, stem_format: stem, device_name: id, device_id: id, device_channels: channels, hardware_insert: false, in_use: false, IOType: options.ioType ? [options.ioType] : [], ChannelIndex: channels, Name: [name], DeviceHwID: [], Active: [true] },
          readOnly: ["type", "uid", "device_name", "device_id", "device_channels", "hardware_insert", "in_use", "IOType", "ChannelIndex", "Name", "DeviceHwID", "Active"]
        });
      });
    }
    /**
     * Plug an input into a device that exists (hotplug): LUNA pushes it as `added` (fact 185).
     * Unplug one with `removeNode`.
     *
     * @example
     * engine.addDeviceInput('Apollo', 'Hi-Z', { uid: 'hiz' });
     */
    addDeviceInput(deviceId, name, options = {}) {
      const folder = `/devices/${deviceId}/inputs`;
      const uid = options.uid ?? `in_${this.children(folder).length + 1}`;
      const stem = options.stemFormat ?? "mono";
      const ch = options.channel ?? this.children(folder).length;
      const channels = stem === "stereo" ? [2 * ch, 2 * ch + 1] : [ch];
      const ioType = options.ioType ? [options.ioType] : [];
      const ioDesc = { name, stem_format: stem, device_channels: channels, IOType: ioType, ChannelIndex: channels, Name: [name], DeviceHwID: [], hardware_index: ch };
      this.addNode(`${folder}/${uid}`, {
        properties: {
          type: "input",
          uid,
          name,
          stem_format: stem,
          device_name: deviceId,
          device_id: deviceId,
          device_channels: channels,
          hardware_insert: false,
          in_use: this.inputUsed(uid),
          IOType: ioType,
          ChannelIndex: channels,
          Name: [name],
          DeviceHwID: [],
          Active: [true],
          enabled: true,
          io_desc: ioDesc,
          ...ANALYSIS_IDLE,
          signal_level_analysis_enabled: false,
          tempo_analysis_enabled: false,
          instrument_analysis_enabled: false,
          stereo_detect_analysis_enabled: false
        },
        // Everything but the analysis switches is read-only, `name` included (fact 185).
        readOnly: ["type", "uid", "name", "stem_format", "device_name", "device_id", "device_channels", "hardware_insert", "in_use", "IOType", "ChannelIndex", "Name", "DeviceHwID", "Active", "enabled", "io_desc", "signal_level_peak", "tempo", "instrument", "stereo_detect"]
      });
      return uid;
    }
    /**
     * Publish analysis results on a device input, as LUNA does when a result is due (fact 187).
     * A result for an analysis that is off is dropped, as LUNA has nothing running to produce it;
     * returns whether anything was published. A signal-level peak also reaches any Auto Gain
     * channel listening to a track on that input (fact 191).
     *
     * @example
     * engine.setInputAnalysis('Apollo', 'in_1', { signalLevelPeak: 0.5, tempo: 120 });
     */
    setInputAnalysis(deviceId, inputUid, results) {
      const path = `/devices/${deviceId}/inputs/${inputUid}`;
      if (!this.has(path)) throw new Error(`MockEngine.setInputAnalysis: no input ${path}`);
      let any = false;
      const put = (kind, prop, value) => {
        if (value === void 0 || this.value(path, `${kind}_analysis_enabled`) !== true) return;
        this.setValue(path, prop, value);
        any = true;
      };
      put("signal_level", "signal_level_peak", results.signalLevelPeak);
      put("tempo", "tempo", results.tempo);
      put("instrument", "instrument", results.instrument);
      put("stereo_detect", "stereo_detect", results.stereoDetect);
      if (results.signalLevelPeak !== void 0 && this.value(path, "signal_level_analysis_enabled") === true) {
        for (const ch of this.children("/auto_gain/channels")) {
          const chPath = `/auto_gain/channels/${ch}`;
          if (this.inputOfChannel(String(this.value(chPath, "session_uid")), String(this.value(chPath, "channel_uid"))) === path) this.setValue(chPath, "signal_level_peak", results.signalLevelPeak);
        }
      }
      return any;
    }
    /**
     * Change the root's `active_audio_engine` (fact 190), as LUNA does when the driver or the
     * audio setting changes.
     *
     * @example
     * engine.setActiveAudioEngine({ enabled: false, audio_engine_type: '', devices: [] });
     */
    setActiveAudioEngine(info) {
      this.setValue("/", "active_audio_engine", { outputs: [], ...info });
    }
    /** Devices whose inputs support Auto Gain (`addDevice({ autoGain })`). */
    autoGainDevices = /* @__PURE__ */ new Set();
    /** @internal The last `duration` a `start_auto_gain` carried, in seconds (fact 192). */
    autoGainDuration;
    /** True when a track in any session is routed to the input `uid` (fact 185). */
    inputUsed(uid) {
      for (const session of this.children("/sessions")) {
        for (const track of this.children(`/sessions/${session}/tracks`)) {
          if (this.value(`/sessions/${session}/tracks/${track}`, "input_node_uid") === uid) return true;
        }
      }
      return false;
    }
    /** The device input path a track is routed to, if it names one. */
    inputOfChannel(sessionUid, trackUid) {
      const uid = this.value(`/sessions/${sessionUid}/tracks/${trackUid}`, "input_node_uid");
      if (typeof uid !== "string" || !uid) return void 0;
      for (const device of this.children("/devices")) {
        const path = `/devices/${device}/inputs/${uid}`;
        if (this.has(path)) return path;
      }
      return void 0;
    }
    /** After a routing change: every input's `in_use`, and the track's `supports_auto_gain` (facts 185, 194). */
    routingChanged(trackPath) {
      for (const device of this.children("/devices")) {
        for (const input2 of this.children(`/devices/${device}/inputs`)) {
          const path = `/devices/${device}/inputs/${input2}`;
          const used = this.inputUsed(input2);
          if (this.value(path, "in_use") !== used) this.setValue(path, "in_use", used);
        }
      }
      const [, , session, , track] = trackPath.split("/");
      const input = this.inputOfChannel(session ?? "", track ?? "");
      const supports = input !== void 0 && this.autoGainDevices.has(input.split("/")[2] ?? "");
      if (this.value(trackPath, "supports_auto_gain") !== supports) this.setValue(trackPath, "supports_auto_gain", supports);
    }
    /** An analysis switch moved: LUNA republishes the result at its no-result value (facts 186-187). */
    analysisSwitched(inputPath, flag2) {
      const prop = ANALYSIS_RESULT[flag2.slice(0, -"_analysis_enabled".length)];
      if (prop) this.setValue(inputPath, prop, ANALYSIS_IDLE[prop]);
    }
    /** LUNA itself moving an input's signal-level switch (Auto Gain, fact 188): pushed to every client. */
    switchSignalLevel(sessionUid, trackUid, on) {
      const input = this.inputOfChannel(sessionUid, trackUid);
      if (!input || this.value(input, "signal_level_analysis_enabled") === on) return;
      this.setValue(input, "signal_level_analysis_enabled", on);
      this.analysisSwitched(input, "signal_level_analysis_enabled");
    }
    /** `/auto_gain`, its `channels` and its commands (facts 191-193). */
    addAutoGainService() {
      const removeChannel = (engine, name) => {
        const path = `/auto_gain/channels/${name}`;
        engine.switchSignalLevel(String(engine.value(path, "session_uid")), String(engine.value(path, "channel_uid")), false);
        engine.removeNode(path);
      };
      this.addNode("/auto_gain", {
        properties: { status: "stopped", status_str: "", info: "", count_down: 0 },
        readOnly: ["status", "status_str", "info", "count_down"],
        commands: {
          // LUNA answers null whatever it did; a body it cannot read does nothing (fact 192).
          start_auto_gain: (data, engine) => {
            const body = typeof data === "object" && data !== null ? data : {};
            if (typeof body.duration === "number" && body.duration > 0) engine.autoGainDuration = Math.trunc(body.duration);
            if (body.all === true) {
              if (engine.children("/auto_gain/channels").length) engine.setValue("/auto_gain", "status", "waiting_for_signal");
              return null;
            }
            if (typeof body.session_uid !== "string" || typeof body.channel_uid !== "string") return null;
            const path = `/auto_gain/channels/${body.session_uid}.${body.channel_uid}`;
            if (!engine.has(path)) {
              engine.addNode(path, { properties: { session_uid: body.session_uid, channel_uid: body.channel_uid, signal_level_peak: 0 }, readOnly: ["session_uid", "channel_uid", "signal_level_peak"] });
              engine.switchSignalLevel(body.session_uid, body.channel_uid, true);
            }
            const supported = engine.value(`/sessions/${body.session_uid}/tracks/${body.channel_uid}`, "supports_auto_gain") === true;
            if (body.auto_start === true && supported) engine.setValue("/auto_gain", "status", "waiting_for_signal");
            return null;
          },
          stop_auto_gain: (data, engine) => {
            const body = typeof data === "object" && data !== null ? data : {};
            if (body.all === true) {
              for (const name of engine.children("/auto_gain/channels")) removeChannel(engine, name);
            } else if (typeof body.session_uid === "string" && typeof body.channel_uid === "string") {
              const name = `${body.session_uid}.${body.channel_uid}`;
              if (engine.has(`/auto_gain/channels/${name}`)) removeChannel(engine, name);
            }
            if (engine.children("/auto_gain/channels").length === 0) {
              if (engine.value("/auto_gain", "status") !== "stopped") engine.setValue("/auto_gain", "status", "stopped");
              if (engine.value("/auto_gain", "count_down") !== 0) engine.setValue("/auto_gain", "count_down", 0);
            }
            return null;
          }
        }
      });
      this.addNode("/auto_gain/channels");
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
      const sourceUid = `src_${trackUid}_${clipUid}`;
      const startTick = options.startTick ?? 0;
      const stopTick = options.stopTick ?? startTick + 96e9 * 4;
      this.addSource(pkg, sourceUid, { name: `${options.name ?? "Take"}.wav`, lengthNs: (stopTick - startTick) / 96e9 * 5e8, origin: 1 });
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
        { uid: id, name: options.name ?? id, bus_type: busType, order, stem_format: options.stemFormat ?? "stereo", color: options.color ?? 4282400832, folder_mode: "none", folder_uid: null, automation_mode: "read", frozen: false, enabled: true, comments: "", preset_uid: null, preset_name: null },
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
          return this.set(from, path, data instanceof FloatLiteral ? data.value : data, params);
        case "post":
          return this.post(path, data);
        case "subscribe":
        case "unsubscribe":
          return null;
      }
    }
    get(path, params) {
      if (path === "/ping") return null;
      if (path.endsWith("/file/data") && path.includes("/analysis/")) {
        const kind = splitPath(splitPath(splitPath(path).node).node).name;
        if (kind === "overview" || kind === "overview_coarse") return { value: this.overviewPage(path, params) };
        return { value: this.analysisPage(path, params) };
      }
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
    set(from, path, data, params = {}) {
      if (this.nodes.has(path)) {
        throw new UAError("uasrv.invalid_property", `set ${path}: uasrv.invalid_property`, { cmd: "set", path });
      }
      let { node: nodePath, name } = splitPath(path);
      if (name === "value") ({ node: nodePath, name } = splitPath(nodePath));
      const pref = /^\/preferences\/([^/]+)$/.exec(nodePath);
      if (pref && this.nodes.has(nodePath)) {
        const file = this.preferenceFiles.get(pref[1]) ?? {};
        file[name] = data;
        this.preferenceFiles.set(pref[1], file);
      }
      const node = this.nodes.get(nodePath);
      if (!node || !node.properties.has(name)) {
        throw new UAError("uasrv.invalid_object", `set ${path}: uasrv.invalid_object`, { cmd: "set", path });
      }
      if (node.readOnly.has(name)) throw new UAError("uasrv.read_only", `set ${path}: uasrv.read_only`, { cmd: "set", path });
      if ((name === "width" || name === "height") && /^\/gui\/add_ons\/[^/]+\/instances\/[^/]+$/.test(nodePath)) {
        this.resizeAddOnInstance(nodePath, name, data, path);
        return null;
      }
      if (name === "solo_mode" && /^\/sessions\/[^/]+$/.test(nodePath) && data !== "latching" && data !== "exclusive") {
        throw new UAError("uasrv.invalid_value", `set ${path}: uasrv.invalid_value`, { cmd: "set", path });
      }
      const isTrack = /^\/sessions\/[^/]+\/tracks\/[^/]+$/.test(nodePath);
      if (isTrack && name === "input_monitor" && data === true && this.value("/preferences", "record_mute") === true) {
        throw new UAError("uasrv.invalid_value", `set ${path}: uasrv.invalid_value`, { cmd: "set", path });
      }
      if (node.properties.get("control_type") !== void 0 && CONTROL_VIEWS.has(name)) {
        this.writeControl(nodePath, node, name, data, from);
        return null;
      }
      if (isTrack && name === "name" && params["name_modified"] === "true") this.setValue(nodePath, "name_modified", true);
      node.properties.set(name, data);
      this.push({ path: `${nodePath}/${name}/value`, data }, from);
      if (name === "gain" && typeof data === "number" && /\/playlists\/[^/]+\/clips\/[^/]+$/.test(nodePath) && this.has(`${nodePath}/controls/gain`)) {
        const ctl = `${nodePath}/controls/gain`;
        for (const [prop, v] of Object.entries({ value: data, real_value: data, normalized_value: Taper.named(Taper.DEFAULT_NAME).toNormalized(data), string_value: data.toFixed(1) })) if (this.value(ctl, prop) !== v) this.setValue(ctl, prop, v);
      }
      this.clipChanged(nodePath);
      if (name === "enable_compiled_clips" && /^\/sessions\/[^/]+\/playlists\/[^/]+$/.test(nodePath)) this.compilePlaylist(nodePath);
      if (name === "record_enabled" && /^\/sessions\/[^/]+$/.test(nodePath)) this.runRecord(nodePath, data === true || data === 1);
      if (name === "play_start" && /^\/sessions\/[^/]+$/.test(nodePath) && node.properties.get("playing") !== true) this.setValue(nodePath, "location", this.locationAt(nodePath, Number(data)));
      if (isTrack && name === "input_monitor") this.setValue(nodePath, "input_monitor_state", data === true);
      if (isTrack && name === "input_node_uid") this.routingChanged(nodePath);
      if (name.endsWith("_analysis_enabled") && /^\/devices\/[^/]+\/inputs\/[^/]+$/.test(nodePath)) this.analysisSwitched(nodePath, name);
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
        for (const [kind, pairNs2] of [
          ["overview", 125e9 / 48e3],
          ["overview_coarse", 125e9 / 48e3 * 12]
        ]) {
          const count = Math.floor(ns / pairNs2);
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
    async set(path, data, params) {
      await this.request("set", appendParams(path, params), data);
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

  // src/wire/wasm-port.ts
  var METHOD = { get: 0, set: 1, post: 2, subscribe: 3, unsubscribe: 4 };
  var RECORD_ENABLED = /\/record_enabled(\/value)?(\?|$)/;
  function wasmUpdateToEvent(path, json) {
    let data = void 0;
    if (json !== "") {
      try {
        data = JSON.parse(json);
      } catch {
        data = json;
      }
    }
    if (path.endsWith("/value")) return { path: stripValueSuffix(path), data };
    if (data === null) return { path, data: void 0, operation: "removed" };
    if (data !== null && typeof data === "object" && !Array.isArray(data) && ("properties" in data || "children" in data)) {
      return { path, data, operation: "added" };
    }
    return { path, data };
  }
  var WasmPort = class {
    constructor(engine, options = {}) {
      this.engine = engine;
      this.requestTimeoutMs = options.requestTimeoutMs ?? 2e4;
      this.onUnhandled = options.onUnhandled;
      engine.attach(
        (id, error, json) => this.handleReply(id, error, json),
        (path, json) => this.handleUpdate(path, json)
      );
      this.stateUnsub = engine.onState((state, detail) => {
        if (state === "running") this.setStatus("connected");
        else if (state === "stopped" || state === "error") {
          this.failPending();
          this.setStatus("closed", detail);
        } else if (state === "booting" || state === "loading") this.setStatus("connecting");
      });
      if (engine.state === "running") this.status = "connected";
    }
    engine;
    status = "disconnected";
    pending = /* @__PURE__ */ new Map();
    subscriptions = /* @__PURE__ */ new Map();
    statusListeners = /* @__PURE__ */ new Set();
    requestTimeoutMs;
    onUnhandled;
    stateUnsub;
    get connected() {
      return this.status === "connected";
    }
    /** Engine descriptor for logs. */
    get url() {
      return `wasm:${this.engine.engineUrl}`;
    }
    get(path, options) {
      const params = getOptionsToParams(options);
      delete params["ignore_response"];
      return this.request("get", appendParams(path, params), "");
    }
    async set(path, data, params) {
      if (data === true && RECORD_ENABLED.test(path)) this.engine.wantAudioInput();
      await this.request("set", appendParams(path, params), encodePayload(data));
    }
    post(path, data) {
      return this.request("post", path, encodePayload(data));
    }
    subscribe(path, handler, options) {
      const recursive = options?.recursive === true;
      const key = `${path}|${recursive ? 1 : 0}`;
      let sub = this.subscriptions.get(key);
      if (!sub) {
        sub = { path, recursive, handlers: /* @__PURE__ */ new Set() };
        this.subscriptions.set(key, sub);
        if (this.connected) void this.request("subscribe", recursive ? appendParams(path, { recursive: "1" }) : path, "").catch(() => void 0);
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
          if (this.connected) void this.request("unsubscribe", current.path, "").catch(() => void 0);
        }
      };
    }
    onStatus(listener) {
      this.statusListeners.add(listener);
      return () => {
        this.statusListeners.delete(listener);
      };
    }
    /** Detach from the engine. The engine keeps running; use `engine.shutdown()` to stop it. */
    async close() {
      if (this.status === "closed") return;
      this.failPending();
      this.stateUnsub?.();
      this.stateUnsub = void 0;
      this.setStatus("closed");
    }
    // -----------------------------------------------------------------------------------------
    request(verb, path, body) {
      if (!this.connected) return Promise.reject(new ConnectionLost(verb, path));
      const id = this.engine.send(METHOD[verb], path, body);
      if (!id) return Promise.reject(new ConnectionLost(verb, path));
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pending.delete(id);
          reject(new RequestTimeout(verb, path, this.requestTimeoutMs));
        }, this.requestTimeoutMs);
        this.pending.set(id, { verb, path, resolve, reject, timer });
      });
    }
    handleReply(id, error, json) {
      const p = this.pending.get(id);
      if (!p) return;
      this.pending.delete(id);
      clearTimeout(p.timer);
      if (error) {
        p.reject(new UAError(error, `${p.verb} ${p.path}: ${error}`, { cmd: p.verb, path: p.path }));
        return;
      }
      let data = null;
      if (json !== "") {
        try {
          data = JSON.parse(json);
        } catch {
          data = json;
        }
      }
      p.resolve(data);
    }
    handleUpdate(path, json) {
      const event = wasmUpdateToEvent(path, json);
      let delivered = false;
      for (const sub of this.subscriptions.values()) {
        if (!eventMatches(sub.path, event.path)) continue;
        delivered = true;
        for (const h of sub.handlers) {
          try {
            h(event);
          } catch (err) {
            console.error("[Luna.WasmPort] subscription handler threw", err);
          }
        }
      }
      if (!delivered) this.onUnhandled?.(event);
    }
    failPending() {
      for (const [id, p] of this.pending) {
        clearTimeout(p.timer);
        this.pending.delete(id);
        p.reject(new ConnectionLost(p.verb, p.path));
      }
    }
    setStatus(status, detail) {
      if (this.status === status) return;
      this.status = status;
      for (const l of this.statusListeners) {
        try {
          l(status, detail);
        } catch (err) {
          console.error("[Luna.WasmPort] status listener threw", err);
        }
      }
    }
  };

  // src/engine/loader.ts
  var WasmEngine = class {
    /** @internal */
    constructor(module, engineUrl) {
      this.module = module;
      this.engineUrl = engineUrl;
    }
    module;
    engineUrl;
    currentState = "loading";
    stateListeners = /* @__PURE__ */ new Set();
    replyHandler;
    updateHandler;
    /** `Date.now()` of the last click or key press seen while running. */
    lastGestureAt = 0;
    /** A microphone was wanted with no gesture to ask inside; the next one asks. */
    inputWanted = false;
    /** @internal Ask for the microphone when a track or the session is record-armed. */
    audioInputOnRecord = true;
    get state() {
      return this.currentState;
    }
    get isRunning() {
      return this.currentState === "running" && Boolean(this.module.ccall("wasmd_is_running_export", "number", [], []));
    }
    onState(listener) {
      this.stateListeners.add(listener);
      return () => {
        this.stateListeners.delete(listener);
      };
    }
    /** @internal Route replies and updates to the port. */
    attach(reply, update) {
      this.replyHandler = reply;
      this.updateHandler = update;
    }
    /** @internal Send one request; returns the request id or 0 on failure. */
    send(method, path, bodyJson) {
      return Number(this.module.ccall("wasmd_send_export", "number", ["number", "string", "string"], [method, path, bodyJson]));
    }
    /** @internal The hooks object installed on the page. */
    hooks() {
      return {
        onReply: (id, error, json) => this.replyHandler?.(id, error, json),
        onUpdate: (path, json) => this.updateHandler?.(path, json),
        onState: (state, detail) => this.setState(state, detail)
      };
    }
    /** @internal */
    setState(state, detail = "") {
      this.currentState = state;
      for (const l of [...this.stateListeners]) l(state, detail);
    }
    /**
     * Resume the AudioContext. Browsers only allow this after a user gesture, so call it from a
     * click handler; the loader already does on every click and key press. Resolves true once
     * the context runs, or false if it is not running within `timeoutMs` (the browser resumes
     * asynchronously, so the state lags the call).
     */
    async resumeAudio(timeoutMs = 1e3) {
      if (!this.module.ccall("wasmd_resume_audio_export", "number", [], [])) return false;
      const deadline = Date.now() + timeoutMs;
      while (this.audio().contextState !== 1) {
        if (Date.now() >= deadline) return false;
        await new Promise((r) => setTimeout(r, 20));
      }
      return true;
    }
    /** Ask for microphone input (getUserMedia). Needs a secure context and a user gesture. */
    requestAudioInput() {
      return Boolean(this.module.ccall("wasmd_request_audio_input_export", "number", [], []));
    }
    /**
     * @internal A click or key press while running: resume audio, and ask for a microphone that
     * was wanted without a gesture to ask inside.
     */
    noteGesture() {
      this.lastGestureAt = Date.now();
      void this.resumeAudio();
      if (this.inputWanted) this.askForInput();
    }
    /**
     * @internal A track or the session was record-armed. Asks for the microphone inside the
     * gesture that armed it when there is one, or else on the next click or key press. Does
     * nothing while asking or connected, and asks again after a denial or a failure.
     */
    wantAudioInput() {
      if (!this.audioInputOnRecord) return;
      const state = this.inputState();
      if (state === 1 || state === 2 || state === 4) return;
      if (hasActivation(this.lastGestureAt)) this.askForInput();
      else this.inputWanted = true;
    }
    askForInput() {
      this.inputWanted = false;
      const state = this.inputState();
      if (state === 1 || state === 2 || state === 4) return;
      this.module.ccall(state === 3 || state === 5 ? "wasmd_retry_audio_input_export" : "wasmd_request_audio_input_export", "number", [], []);
    }
    inputState() {
      return Number(this.module.ccall("wasmd_audio_input_state_export", "number", [], []));
    }
    audio() {
      const n = (name) => Number(this.module.ccall(name, "number", [], []));
      return {
        contextState: n("wasmd_audio_state_export"),
        callbacks: n("wasmd_audio_callbacks_export"),
        underruns: n("wasmd_audio_underruns_export"),
        peak: n("wasmd_audio_peak_export"),
        inputState: n("wasmd_audio_input_state_export"),
        inputPeak: n("wasmd_audio_input_peak_export")
      };
    }
    /** OPFS persistence status, when the module was built with it. */
    persistStatus() {
      return this.module.UAPersist?.status();
    }
    /** Stop the engine. Terminal: reload the page to boot again. */
    shutdown() {
      this.setState("stopping");
      this.module.ccall("wasmd_shutdown_export", null, [], []);
    }
  };
  var booting;
  function bootWasmEngine(options = {}) {
    booting ??= doBoot(options).catch((err) => {
      booting = void 0;
      throw err;
    });
    return booting;
  }
  async function doBoot(options) {
    const engineUrl = (options.engineUrl ?? "/__engine/").replace(/\/?$/, "/");
    const log = options.log ?? ((line, level) => level === "err" ? console.warn("[wasm]", line) : console.debug("[wasm]", line));
    const factory = options.factory_ ?? await loadFactory(engineUrl);
    const target = options.hooksTarget_ ?? globalThis;
    let engine;
    let resolveRunning;
    let rejectRunning;
    const running = new Promise((res, rej) => {
      resolveRunning = res;
      rejectRunning = rej;
    });
    const pending2 = [];
    target.WasmDeviced = {
      onReply: (id, error, json) => engine?.hooks().onReply(id, error, json),
      onUpdate: (path, json) => engine?.hooks().onUpdate(path, json),
      onState: (state, detail) => {
        if (engine) engine.hooks().onState(state, detail);
        else pending2.push({ state, detail });
        if (state === "running") resolveRunning();
        if (state === "error" || state === "stopped") rejectRunning(new UAError("engine_boot", `wasm engine ${state}${detail ? ": " + detail : ""}`));
      }
    };
    let sawGesture = false;
    const onGesture = () => {
      sawGesture = true;
      if (engine?.isRunning) engine.noteGesture();
    };
    const gestureTarget = options.resumeOnGesture === false ? void 0 : options.gestureTarget_ ?? globalThis.document;
    for (const type of GESTURE_EVENTS) gestureTarget?.addEventListener(type, onGesture, true);
    const timeoutMs = options.timeoutMs ?? 12e4;
    const timer = setTimeout(() => rejectRunning(new UAError("engine_boot", `wasm engine did not reach running within ${timeoutMs} ms`)), timeoutMs);
    try {
      const module = await factory({
        print: (t) => log(t, "out"),
        printErr: (t) => log(t, "err"),
        onAbort: (what) => {
          log(`abort: ${String(what)}`, "err");
          rejectRunning(new UAError("engine_boot", `wasm engine aborted: ${String(what)}`));
        },
        locateFile: (path, prefix) => `${prefix || engineUrl}${path}${options.strip && path.endsWith(".wasm") ? "?strip=1" : ""}`,
        UAPersistDisabled: options.persist === false,
        UAPersistLog: (t) => log(`persist ${t}`, "out")
      });
      engine = new WasmEngine(module, engineUrl);
      engine.audioInputOnRecord = options.audioInputOnRecord !== false;
      for (const p of pending2) engine.setState(p.state, p.detail);
      await running;
      if (engine.state !== "running") engine.setState("running");
      const activated = globalThis.navigator?.userActivation?.hasBeenActive;
      if (gestureTarget && (sawGesture || activated)) void engine.resumeAudio();
      return engine;
    } catch (err) {
      for (const type of GESTURE_EVENTS) gestureTarget?.removeEventListener(type, onGesture, true);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  var GESTURE_EVENTS = ["pointerdown", "pointerup", "keydown"];
  function hasActivation(lastGestureAt) {
    const active = globalThis.navigator?.userActivation?.isActive;
    return active ?? Date.now() - lastGestureAt < 4e3;
  }
  async function loadFactory(engineUrl) {
    const g = globalThis;
    if (typeof g.createLunaEngineModule === "function") return g.createLunaEngineModule;
    if (!g.document) throw new UAError("engine_boot", "the wasm engine needs a browser page");
    await new Promise((resolve, reject) => {
      const script = g.document.createElement("script");
      script.src = `${engineUrl}luna-engine.js`;
      script.onload = () => resolve();
      script.onerror = () => reject(new UAError("engine_boot", `could not load ${script.src}; is the engine served at ${engineUrl}?`));
      g.document.head.appendChild(script);
    });
    if (typeof g.createLunaEngineModule !== "function") throw new UAError("engine_boot", "luna-engine.js loaded but createLunaEngineModule is missing");
    return g.createLunaEngineModule;
  }

  // src/store/prop.ts
  var Scheduler = class {
    dirty = /* @__PURE__ */ new Set();
    scheduled = false;
    rafHandle;
    timerHandle;
    waiters = [];
    /** Queue `notify` to run once at the next flush. */
    enqueue(notify) {
      this.dirty.add(notify);
      if (this.scheduled) return;
      this.scheduled = true;
      const g = globalThis;
      if (typeof g.requestAnimationFrame === "function") {
        this.rafHandle = g.requestAnimationFrame(() => this.flush());
        this.timerHandle = setTimeout(() => this.flush(), 100);
      } else {
        this.timerHandle = setTimeout(() => this.flush(), 0);
      }
    }
    /** Run every queued notification now. */
    flush() {
      if (!this.scheduled) return;
      this.scheduled = false;
      const g = globalThis;
      if (this.rafHandle !== void 0 && typeof g.cancelAnimationFrame === "function") g.cancelAnimationFrame(this.rafHandle);
      if (this.timerHandle !== void 0) clearTimeout(this.timerHandle);
      this.rafHandle = void 0;
      this.timerHandle = void 0;
      const batch = [...this.dirty];
      this.dirty.clear();
      for (const notify of batch) {
        try {
          notify();
        } catch (err) {
          console.error("[Luna] change listener threw", err);
        }
      }
      const waiters = this.waiters;
      this.waiters = [];
      for (const w of waiters) w();
    }
    /** Resolves after the next flush (or immediately if nothing is queued). */
    settled() {
      if (!this.scheduled) return Promise.resolve();
      return new Promise((resolve) => this.waiters.push(resolve));
    }
  };
  var versionCounter = 0;
  function nextVersion() {
    return ++versionCounter;
  }
  var Cell = class {
    constructor(scheduler, initial) {
      this.scheduler = scheduler;
      this.current = initial;
    }
    scheduler;
    current;
    stamp = 0;
    listeners = /* @__PURE__ */ new Set();
    notify = () => {
      for (const l of [...this.listeners]) l();
    };
    get value() {
      return this.current;
    }
    /** Version of the current value; 0 until first written. */
    get version() {
      return this.stamp;
    }
    /**
     * Write with a stamp. Returns true if the value changed. A write stamped older than the
     * current value is ignored, so a read that was answered late cannot undo a push or a
     * write that landed while it was in flight.
     */
    update(value, version = nextVersion(), equals = shallowEquals) {
      if (version < this.stamp) return false;
      this.stamp = version;
      if (equals(this.current, value)) return false;
      this.current = value;
      if (this.listeners.size > 0) this.scheduler.enqueue(this.notify);
      return true;
    }
    onChange(listener) {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    }
    /** @internal */
    get listenerCount() {
      return this.listeners.size;
    }
  };
  function shallowEquals(a, b) {
    if (a === b) return true;
    if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((v, i) => shallowEquals(v, b[i]));
    }
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => shallowEquals(a[k], b[k]));
  }
  function derived(sources, compute, options = {}) {
    const listeners = /* @__PURE__ */ new Set();
    let subscriptions = [];
    let last;
    const fanOut = () => {
      if (options.distinct) {
        const next = compute();
        if (shallowEquals(last, next)) return;
        last = next;
      }
      for (const l of [...listeners]) l();
    };
    return {
      get value() {
        return compute();
      },
      onChange(listener) {
        if (listeners.size === 0) {
          if (options.distinct) last = compute();
          subscriptions = sources.map((s) => s.onChange(fanOut));
        }
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
          if (listeners.size === 0) {
            for (const u of subscriptions) u();
            subscriptions = [];
          }
        };
      }
    };
  }
  function writable(view, setter) {
    return {
      get value() {
        return view.value;
      },
      onChange: (l) => view.onChange(l),
      set: setter
    };
  }
  function listOf(source, idOf2) {
    return {
      get value() {
        return source.value ?? [];
      },
      get items() {
        return source.value ?? [];
      },
      onChange: (l) => source.onChange(l),
      byId(id) {
        return (source.value ?? []).find((item) => idOf2(item) === id);
      }
    };
  }

  // src/store/store.ts
  function isNodeReply(data) {
    return data !== null && typeof data === "object" && !Array.isArray(data) && ("properties" in data || "children" in data || "commands" in data);
  }
  var Store = class {
    constructor(port, scheduler = new Scheduler()) {
      this.port = port;
      this.scheduler = scheduler;
      this.statusUnsub = port.onStatus((status) => {
        if (status === "disconnected") this.wasDisconnected = true;
        if (status === "connected" && this.wasDisconnected) {
          this.wasDisconnected = false;
          void this.reloadAll();
        }
      });
    }
    port;
    scheduler;
    cells = /* @__PURE__ */ new Map();
    childCells = /* @__PURE__ */ new Map();
    watches = /* @__PURE__ */ new Map();
    loaded = /* @__PURE__ */ new Map();
    /** Nodes that have had at least one property written, by a read or a push. */
    propertied = /* @__PURE__ */ new Set();
    /** Reads sent and not yet answered, for {@link readsSettled}. */
    inflight = /* @__PURE__ */ new Set();
    eventListeners = /* @__PURE__ */ new Set();
    /** The last value the engine confirmed for each property cell, for rolling back a refused write. */
    confirmed = /* @__PURE__ */ new Map();
    statusUnsub;
    wasDisconnected = false;
    closed = false;
    /** The cell for `<node>/<property>`. Created on demand, `undefined` until loaded or pushed. */
    cell(nodePath, property) {
      const key = `${nodePath}/${property}`;
      let cell = this.cells.get(key);
      if (!cell) {
        cell = new Cell(this.scheduler);
        this.cells.set(key, cell);
      }
      return cell;
    }
    /** The cell holding a node's child names, in engine order. */
    children(nodePath) {
      let cell = this.childCells.get(nodePath);
      if (!cell) {
        cell = new Cell(this.scheduler);
        this.childCells.set(nodePath, cell);
      }
      return cell;
    }
    /** True once `load` or a push has given this node a child list. */
    knowsNode(nodePath) {
      return this.childCells.has(nodePath);
    }
    /**
     * `get` a path and apply the reply to cells. Resolves to the raw reply. A property path fills
     * its own cell; a node path fills its properties and children, recursing into nested children
     * when the reply carries them (`levels`/`recursive`).
     */
    load(path, options) {
      const read = this.read(path, options);
      this.inflight.add(read);
      const done = () => {
        this.inflight.delete(read);
      };
      read.then(done, done);
      return read;
    }
    /**
     * Resolve once no read is in flight, including reads started while waiting (a member the
     * engine just added is fetched on its own, and that fetch can start another). Never
     * rejects; a failed read counts as finished.
     *
     * @example
     * await luna.store.readsSettled();
     */
    async readsSettled() {
      for (let round = 0; this.inflight.size > 0 && round < 16; round++) {
        await Promise.allSettled([...this.inflight]);
      }
    }
    /** How many reads are in flight. */
    get pendingReads() {
      return this.inflight.size;
    }
    /** True once any property of `nodePath` has been written by a read or a push. */
    hasProperties(nodePath) {
      return this.propertied.has(nodePath);
    }
    async read(path, options) {
      const opts = { flatvalue: true, commands: false, ...options };
      const version = nextVersion();
      const data = await this.port.get(path, opts);
      this.loaded.set(path, options);
      const depth = opts.children === false ? 0 : opts.recursive ? Infinity : opts.levels ?? 1;
      this.apply(path, data, version, depth);
      return data;
    }
    /**
     * Subscribe to `path` and load it. Refcounted: the wire subscription is shared and released
     * when the last watcher calls `release`.
     */
    watch(path, options = {}) {
      if (this.closed) return { ready: Promise.resolve(), release: () => {
      } };
      const recursive = options.recursive === true;
      const key = `${path}|${recursive ? 1 : 0}`;
      let watch = this.watches.get(key);
      if (!watch) {
        const subOptions = recursive ? { recursive: true } : {};
        const off = this.port.subscribe(path, (e) => this.onEvent(e), subOptions);
        let subscribed = true;
        const unsubscribe = () => {
          if (!subscribed) return;
          subscribed = false;
          off();
        };
        const ready = options.load === false ? Promise.resolve() : this.load(path, recursive ? { recursive: true, ...options.load } : options.load).then(() => void 0);
        const created = { path, recursive, refs: 0, unsubscribe, ready };
        ready.catch(() => {
          if (this.watches.get(key) !== created) return;
          this.watches.delete(key);
          created.unsubscribe();
        });
        watch = created;
        this.watches.set(key, watch);
      }
      watch.refs++;
      let released = false;
      const w = watch;
      return {
        ready: w.ready,
        release: () => {
          if (released) return;
          released = true;
          w.refs--;
          if (w.refs === 0) {
            w.unsubscribe();
            if (this.watches.get(key) === w) {
              this.watches.delete(key);
              this.loaded.delete(path);
            }
          }
        }
      };
    }
    /**
     * Optimistic write. The cell takes `value` immediately with a fresh version; the engine's
     * acknowledgement resolves the promise. On rejection the previous value is restored if the
     * cell still holds our write, then the error is rethrown.
     */
    /**
     * Write a property: the cell takes `value` at once, and `wire` (default `value`) is what is
     * sent, for a value whose wire form differs, such as a number that must go as a float literal.
     */
    async set(nodePath, property, value, wire = value, params) {
      const key = `${nodePath}/${property}`;
      const cell = this.cell(nodePath, property);
      const fallback = this.confirmed.has(key) ? this.confirmed.get(key) : cell.value;
      const ours = nextVersion();
      cell.update(value, ours);
      try {
        await (params ? this.port.set(key, wire, params) : this.port.set(key, wire));
        if (cell.version === ours) this.confirmed.set(key, value);
      } catch (err) {
        if (cell.version === ours) cell.update(fallback);
        throw err;
      }
    }
    onEvent(arg) {
      if (typeof arg === "function") {
        this.eventListeners.add(arg);
        return () => {
          this.eventListeners.delete(arg);
        };
      }
      for (const l of this.eventListeners) l(arg);
      this.applyEvent(arg);
    }
    /** Drop a subtree from the mirror (after a `removed`, or when a view is disposed). */
    forget(nodePath) {
      for (const key of [...this.cells.keys()]) {
        if (key.startsWith(nodePath + "/")) this.cells.delete(key);
      }
      for (const key of [...this.confirmed.keys()]) {
        if (key.startsWith(nodePath + "/")) this.confirmed.delete(key);
      }
      for (const key of [...this.childCells.keys()]) {
        if (key === nodePath || key.startsWith(nodePath + "/")) this.childCells.delete(key);
      }
      for (const key of [...this.loaded.keys()]) {
        if (key === nodePath || key.startsWith(nodePath + "/")) this.loaded.delete(key);
      }
      for (const key of [...this.propertied]) {
        if (key === nodePath || key.startsWith(nodePath + "/")) this.propertied.delete(key);
      }
    }
    /** Re-`get` every loaded path. Called automatically after a reconnect. */
    async reloadAll() {
      const entries = [...this.loaded.entries()];
      await Promise.all(
        entries.map(
          ([path, options]) => this.load(path, options).catch(() => {
          })
        )
      );
    }
    async close() {
      if (this.closed) return;
      this.closed = true;
      this.statusUnsub();
      for (const w of this.watches.values()) w.unsubscribe();
      this.watches.clear();
      this.loaded.clear();
    }
    // -----------------------------------------------------------------------------------------
    applyEvent(event) {
      if (event.operation) {
        const { node: parent, name: name2 } = splitPath(event.path);
        const list = this.children(parent);
        const current = list.value ?? [];
        if (event.operation === "added") {
          if (!current.includes(name2)) list.update([...current, name2]);
          if (isNodeReply(event.data)) this.apply(event.path, event.data, nextVersion(), 0);
          else if (!this.knowsNode(event.path)) this.children(event.path).update([]);
        } else {
          if (current.includes(name2)) list.update(current.filter((c) => c !== name2));
          this.forget(event.path);
        }
        return;
      }
      const { node, name } = splitPath(event.path);
      this.write(node, name, event.data, nextVersion());
    }
    /** Write a value the engine reported, and remember it as confirmed if it took. */
    write(node, name, value, version) {
      const cell = this.cell(node, name);
      this.propertied.add(node);
      cell.update(value, version);
      if (cell.version === version) this.confirmed.set(`${node}/${name}`, value);
    }
    /**
     * Apply a `get` reply. `depth` is how many levels below `path` the reply lists children
     * completely: there a missing `children` section means "no children" (fact 18); deeper,
     * a child is a bare name and says nothing about its own children.
     */
    apply(path, data, version, depth = 1) {
      if (data !== null && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length === 0) {
        if (depth >= 1 || !this.knowsNode(path)) this.children(path).update([], version);
        return;
      }
      if (isNodeReply(data)) {
        if (data.properties) {
          for (const [name2, raw] of Object.entries(data.properties)) this.write(path, name2, propertyValue(raw), version);
        }
        if (!Array.isArray(data.children)) {
          if (depth >= 1 || !this.knowsNode(path)) this.children(path).update([], version);
        } else {
          const names = [];
          for (const child of data.children) {
            const name2 = typeof child.path === "string" ? child.path.split("/").filter(Boolean).pop() : void 0;
            if (!name2) continue;
            names.push(name2);
            const childPath = `${path === "/" ? "" : path}/${name2}`;
            if (isNodeReply(child)) this.apply(childPath, child, version, depth - 1);
            else if (depth - 1 >= 1) this.children(childPath).update([], version);
            else if (!this.knowsNode(childPath)) this.children(childPath).update([], version);
          }
          this.children(path).update(names, version);
        }
        return;
      }
      const { node, name } = splitPath(path);
      this.write(node, name, propertyValue(data), version);
    }
  };

  // src/model/ticks.ts
  var DISPLAY_TICKS_PER_BEAT = 960;
  var TICKS_PER_DISPLAY_TICK = 1e8;
  var TICKS_PER_BEAT = DISPLAY_TICKS_PER_BEAT * TICKS_PER_DISPLAY_TICK;
  var WHOLE_NOTE = TICKS_PER_BEAT * 4;
  var HALF_NOTE = TICKS_PER_BEAT * 2;
  var QUARTER_NOTE = TICKS_PER_BEAT;
  var EIGHTH_NOTE = TICKS_PER_BEAT / 2;
  var SIXTEENTH_NOTE = TICKS_PER_BEAT / 4;
  var THIRTY_SECOND_NOTE = TICKS_PER_BEAT / 8;
  var SIXTY_FOURTH_NOTE = TICKS_PER_BEAT / 16;
  var ONE_TWENTY_EIGHTH_NOTE = TICKS_PER_BEAT / 32;
  function dotted(note) {
    return note + note / 2;
  }
  function triplet(note) {
    return note * 2 / 3;
  }
  function ticksToBeats(ticks) {
    return ticks / TICKS_PER_BEAT;
  }
  function beatsToTicks(beats) {
    return Math.round(beats * TICKS_PER_BEAT);
  }
  function ticksToSeconds(ticks, bpm) {
    return ticks / TICKS_PER_BEAT * (60 / bpm);
  }
  function secondsToTicks(seconds, bpm) {
    return Math.round(seconds / 60 * bpm * TICKS_PER_BEAT);
  }
  function formatBarBeat(bb) {
    if (!bb) return "-|-|---";
    return `${bb.bar}|${bb.beat}|${String(Math.floor(bb.tick / TICKS_PER_DISPLAY_TICK)).padStart(3, "0")}`;
  }
  function formatTimeSignature(ts) {
    if (!ts) return "-/-";
    return `${ts.numerator}/${ts.denominator}`;
  }
  function formatMinSec(seconds, options = {}) {
    const fraction = options.fraction ?? 0;
    if (seconds === void 0 || !Number.isFinite(seconds)) return `--:--${fraction > 0 ? "." + "-".repeat(fraction) : ""}`;
    const total = Math.max(0, seconds);
    const whole = Math.floor(total);
    const clock = `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
    if (fraction <= 0) return clock;
    const frac = Math.floor((total - whole) * 10 ** fraction);
    return `${clock}.${String(frac).padStart(fraction, "0")}`;
  }

  // src/model/node.ts
  var Node = class {
    /** @internal */
    constructor(client, path) {
      this.client = client;
      this.path = path;
    }
    client;
    path;
    loading;
    isDisposed = false;
    disposeListeners;
    /** Last path segment: the uid or name the engine addresses this node by. */
    get id() {
      return this.path.slice(this.path.lastIndexOf("/") + 1);
    }
    /**
     * Fetch this node's properties (and child names) once. Later calls return the same promise.
     * Pushes keep the cells current afterwards as long as an ancestor is watched.
     */
    load(options) {
      if (!this.loading) {
        this.loading = this.client.store.load(this.path, options).then(() => void 0);
      }
      return this.loading;
    }
    /** Fetch again, ignoring the once-only cache of {@link load}. */
    reload(options) {
      this.loading = this.client.store.load(this.path, options).then(() => void 0);
      return this.loading;
    }
    /**
     * Subscribe to this node so its props follow engine pushes, and load it. Nodes under a
     * session that called `ready()` are already covered; use this for nodes outside a session
     * (for example `luna.gui.main`, `luna.preferences`). Call `release` when done.
     */
    watch(options = {}) {
      const w = this.client.store.watch(this.path, { ...options.recursive !== void 0 ? { recursive: options.recursive } : {}, load: { flatvalue: true, commands: false } });
      this.loading ??= w.ready;
      return w;
    }
    /**
     * Whether LUNA would take `command` on this node now (`<command>/enabled`, fact 234), as
     * LUNA greys out its own menu items: `false` for `paste` with nothing copied, for example.
     * Follows LUNA from the first call until this node is disposed. `undefined` until read, and
     * for a command that publishes no enabled state (most are always enabled).
     *
     * @example
     * const canPaste = session.context.commandEnabled('paste');
     * canPaste.onChange(() => (pasteButton.disabled = canPaste.value === false));
     */
    commandEnabled(command) {
      const path = this.commandPath(command);
      if (!this.commandWatches.has(path)) {
        const w = this.client.store.watch(path, { load: { flatvalue: true, commands: false, children: false } });
        w.ready.catch(() => void 0);
        this.commandWatches.set(path, w.release);
        if (this.commandWatches.size === 1) this.onDispose(() => {
          for (const release2 of this.commandWatches.values()) release2();
          this.commandWatches.clear();
        });
      }
      return this.client.store.cell(path, "enabled");
    }
    commandWatches = /* @__PURE__ */ new Map();
    /** Where `command`'s node is: under this node. */
    commandPath(command) {
      return `${this.path}/${command}`;
    }
    /** Read-only property view. `value` is `undefined` until loaded or pushed. */
    prop(name) {
      return this.client.store.cell(this.path, name);
    }
    /**
     * Any property of this node by its engine name, for properties the typed surface does not
     * cover yet. Prefer a typed member when one exists.
     *
     * @example
     * track.property<number>('latency_override').value
     * await track.property<string>('comments').set('take 3')
     */
    property(name) {
      return this.writableProp(name);
    }
    /** Invoke any command on this node by name. Prefer a typed method when one exists. */
    command(name, payload) {
      return this.post(name, payload);
    }
    /**
     * Writable property view; `set` is optimistic with rollback, and refuses once disposed.
     * `toWire` gives the form sent to the engine when it differs from the value the view holds.
     */
    writableProp(name, toWire) {
      const cell = this.client.store.cell(this.path, name);
      return writable(cell, (v) => this.isDisposed ? Promise.reject(new Disposed(this.constructor.name, this.path)) : this.client.store.set(this.path, name, v, toWire ? toWire(v) : v));
    }
    /** The cell holding this node's child names. */
    childNames() {
      return this.client.store.children(this.path);
    }
    /** Invoke a command on this node. Refuses once disposed. */
    post(command, payload) {
      if (this.isDisposed) return Promise.reject(new Disposed(this.constructor.name, this.path));
      return this.wire.post(`${this.path}/${command}`, payload);
    }
    /**
     * `client.raw` for this object's own commands, refusing with {@link Disposed} once the
     * object is gone. Domain methods post through this rather than `client.raw`.
     */
    get wire() {
      const raw = this.client.raw;
      const check = (run2) => this.isDisposed ? Promise.reject(new Disposed(this.constructor.name, this.path)) : run2();
      return {
        get: (path, options) => check(() => raw.get(path, options)),
        set: (path, data, params) => check(() => params ? raw.set(path, data, params) : raw.set(path, data)),
        post: (path, data) => check(() => raw.post(path, data))
      };
    }
    /** Throw {@link Disposed} if this object is gone. Commands that post elsewhere call it first. */
    assertLive() {
      if (this.isDisposed) throw new Disposed(this.constructor.name, this.path);
    }
    /**
     * True once the engine removed this node or its owner was disposed. A disposed object's
     * props stop updating and its commands reject with {@link Disposed}.
     */
    get disposed() {
      return this.isDisposed;
    }
    /**
     * Called once when this object is disposed. Returns an unsubscribe.
     *
     * @example
     * track.onDispose(() => row.remove());
     */
    onDispose(listener) {
      if (this.isDisposed) {
        listener();
        return () => {
        };
      }
      (this.disposeListeners ??= []).push(listener);
      return () => {
        this.disposeListeners = this.disposeListeners?.filter((l) => l !== listener);
      };
    }
    /** @internal Called when the engine removes this node or its owner goes. Idempotent. */
    dispose() {
      if (this.isDisposed) return;
      this.isDisposed = true;
      this.release();
      const listeners = this.disposeListeners ?? [];
      this.disposeListeners = void 0;
      for (const l of listeners) {
        try {
          l();
        } catch (err) {
          console.error("[Luna] onDispose listener threw", err);
        }
      }
    }
    /** Release what this object owns. Subclasses override this, not {@link dispose}. */
    release() {
    }
  };

  // src/model/collection.ts
  var Collection = class {
    /** @internal */
    constructor(client, path, create, loadOptions = { levels: 2 }) {
      this.client = client;
      this.path = path;
      this.create = create;
      this.loadOptions = loadOptions;
      this.sync();
      this.announced = this.ordered;
      this.namesUnsub = this.client.store.children(this.path).onChange(() => {
        this.sync();
        this.announce();
      });
    }
    client;
    path;
    create;
    loadOptions;
    members = /* @__PURE__ */ new Map();
    /** Members handed out by {@link member} before the engine listed them, by name. */
    early = /* @__PURE__ */ new Map();
    ordered = [];
    loading;
    listeners = /* @__PURE__ */ new Set();
    namesUnsub;
    syncedVersion = -1;
    /** Member paths already fetched, so a new child is loaded once and only once. */
    fetched = /* @__PURE__ */ new Set();
    /** Added members whose first read has not landed, by name. `onChange` waits for them. */
    pending = /* @__PURE__ */ new Map();
    disposed = false;
    /** The members listeners were last told about. */
    announced = [];
    /** Members in engine order. Empty until loaded or pushed. */
    get items() {
      this.ensureSynced();
      return this.ordered;
    }
    get value() {
      return this.items;
    }
    byId(id) {
      this.ensureSynced();
      return this.members.get(id);
    }
    /**
     * @internal The member named `id`, or a handle for one the engine has not listed yet (a
     * track made inside a batch transaction, whose push LUNA holds until the commit). The
     * collection adopts that same instance when the engine lists it, so `byId(id)` and `items`
     * hand back the object the caller already holds. Its props read `undefined` until then.
     */
    member(id) {
      this.ensureSynced();
      const existing = this.members.get(id) ?? this.early.get(id);
      if (existing) return existing;
      const made = this.create(`${this.path}/${id}`, id);
      this.early.set(id, made);
      return made;
    }
    /**
     * Resolve once every member the engine has added has its properties loaded. Resolves at
     * once when nothing is being fetched.
     *
     * @example
     * await session.insertClip({ trackUid: track.id, sourceUid, startTick: 0, stopTick: Luna.WHOLE_NOTE });
     * await Luna.settle(() => lane.clips.items.length > before, 'insert clip');
     * await lane.clips.membersReady();
     * lane.clips.items.at(-1).start.value;   // loaded, not undefined
     */
    async membersReady() {
      this.ensureSynced();
      while (this.pending.size > 0) await Promise.allSettled([...this.pending.values()]);
    }
    /** Fetch the member list (and, with the default `levels: 2`, each member's properties). */
    load() {
      if (!this.loading) {
        this.loading = this.client.store.load(this.path, this.loadOptions).then(() => void 0);
      }
      return this.loading;
    }
    /**
     * Fetch the member list again, ignoring the once-only cache of {@link load}, and re-sync
     * the members. Use it after an edit whose push LUNA held back, or inside a transaction.
     *
     * @example
     * await session.tracks.reload();
     */
    async reload() {
      this.loading = this.client.store.load(this.path, this.loadOptions).then(() => void 0);
      await this.loading;
      this.sync();
    }
    /**
     * Subscribe to this folder on the wire and load it, so members and their properties
     * follow engine pushes. Collections under a session that called `ready()` are already
     * covered; use this for folders outside one, such as `/renders` or `/jobs` (fact 34).
     * Refcounted through the Store; call `release` when done.
     *
     * @example
     * const w = luna.renders.watch();
     * await w.ready;
     * luna.renders.onChange(() => draw(luna.renders.items));
     */
    watch(options = {}) {
      const w = this.client.store.watch(this.path, {
        ...options.recursive !== void 0 ? { recursive: options.recursive } : {},
        load: this.loadOptions
      });
      this.loading ??= w.ready;
      return { ready: w.ready.then(() => {
        this.sync();
      }), release: w.release };
    }
    /** Called when members are added or removed. */
    onChange(listener) {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    }
    /**
     * Called when members are added or removed, or when any of the named props of any member
     * changes: one listener for "redraw the list". The per-member subscriptions follow the
     * list, so a member added later is covered and a removed one is let go. Several changes in
     * the same turn call the listener once.
     *
     * `props` are the member's prop fields by name (`'name'`, `'length'`), not wire names.
     *
     * @example
     * const sources = await session.loadSources();
     * const stop = sources.onAnyChange(() => render(sources.items), { props: ['name', 'length'] });
     */
    onAnyChange(listener, options = {}) {
      const props = options.props ?? [];
      const perMember = /* @__PURE__ */ new Map();
      let queued = false;
      let stopped = false;
      const fire = () => {
        if (queued || stopped) return;
        queued = true;
        queueMicrotask(() => {
          queued = false;
          if (!stopped) listener();
        });
      };
      const follow = () => {
        const now = new Set(this.items);
        for (const [member, unsubs] of perMember) {
          if (now.has(member)) continue;
          for (const u of unsubs) u();
          perMember.delete(member);
        }
        for (const member of now) {
          if (perMember.has(member)) continue;
          const unsubs = [];
          for (const key of props) {
            const prop = member[key];
            if (isProp(prop)) unsubs.push(prop.onChange(fire));
          }
          perMember.set(member, unsubs);
        }
      };
      follow();
      const stopList = this.onChange(() => {
        follow();
        fire();
      });
      return () => {
        stopped = true;
        stopList();
        for (const unsubs of perMember.values()) for (const u of unsubs) u();
        perMember.clear();
      };
    }
    /** @internal */
    dispose() {
      this.disposed = true;
      this.pending.clear();
      this.namesUnsub?.();
      this.namesUnsub = void 0;
      this.listeners.clear();
      for (const m of this.members.values()) m.dispose();
      for (const m of this.early.values()) m.dispose();
      this.members.clear();
      this.early.clear();
      this.ordered = [];
    }
    /** Rebuild members if the child-name cell moved since the last sync. */
    ensureSynced() {
      if (this.client.store.children(this.path).version !== this.syncedVersion) this.sync();
    }
    /** Rebuild `members` from the child-name cell; keeps existing instances, disposes removed. */
    sync() {
      const cell = this.client.store.children(this.path);
      this.syncedVersion = cell.version;
      const names = cell.value ?? [];
      const next = /* @__PURE__ */ new Map();
      for (const name of names) {
        const existing = this.members.get(name) ?? this.early.get(name);
        this.early.delete(name);
        next.set(name, existing ?? this.create(`${this.path}/${name}`, name));
      }
      for (const [name, member] of this.members) {
        if (!next.has(name)) {
          member.dispose();
          this.fetched.delete(`${this.path}/${name}`);
          this.pending.delete(name);
        }
      }
      if (this.loading) {
        for (const [name] of next) {
          const path = `${this.path}/${name}`;
          if (this.members.has(name) || this.fetched.has(path)) continue;
          this.fetched.add(path);
          const hold = !this.client.store.hasProperties(path);
          const read = this.client.store.load(path, this.loadOptions).then(
            () => void 0,
            () => {
              this.fetched.delete(path);
            }
          );
          if (!hold) continue;
          const arrived = read.then(() => this.arrived(name, arrived));
          this.pending.set(name, arrived);
        }
      }
      this.members = next;
      this.ordered = names.map((n) => next.get(n));
    }
    /** A held member's first read landed (or failed): tell listeners. */
    arrived(name, read) {
      if (this.disposed || this.pending.get(name) !== read) return;
      this.pending.delete(name);
      this.announce();
    }
    /** Notify if the members a listener can see differ from those it was last told about. */
    announce() {
      const now = this.pending.size ? this.ordered.filter((m) => !this.pending.has(nameOf(m))) : this.ordered;
      if (sameMembers(this.announced, now)) return;
      this.announced = now;
      for (const l of [...this.listeners]) l();
    }
    /** @internal Re-read the child cell without notifying (used before first `onChange`). */
    refresh() {
      this.sync();
      return this.ordered;
    }
  };
  function isProp(value) {
    return typeof value === "object" && value !== null && typeof value.onChange === "function" && "value" in value;
  }
  function sameMembers(a, b) {
    return a.length === b.length && a.every((m, i) => m === b[i]);
  }
  function nameOf(node) {
    return node.path.slice(node.path.lastIndexOf("/") + 1);
  }

  // src/model/settle.ts
  var EDIT_TIMEOUT_MS = 4e3;
  var REFRESH_AFTER_MS = 120;
  var REFRESH_EVERY_MS = 300;
  function yieldTask() {
    return new Promise((resolve) => {
      if (typeof MessageChannel === "function") {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => {
          channel.port1.close();
          resolve();
        };
        channel.port2.postMessage(0);
      } else setTimeout(resolve, 0);
    });
  }
  async function settle(done, what, options = {}) {
    const started = Date.now();
    const timeoutMs = options.timeoutMs ?? EDIT_TIMEOUT_MS;
    const deadline = started + timeoutMs;
    let nextRefresh = started + REFRESH_AFTER_MS;
    while (!done()) {
      if (options.disposed?.()) throw new UAError("disposed", `${what}: the object was disposed while waiting`, options.path ? { path: options.path } : {});
      if (Date.now() > deadline) throw new UAError("no_effect", `${what}: LUNA answered, but the change did not appear in ${timeoutMs} ms`, options.path ? { path: options.path } : {});
      for (let i = 0; i < 8 && !done(); i++) await yieldTask();
      if (done()) return;
      if (options.refresh && Date.now() >= nextRefresh) {
        nextRefresh = Date.now() + REFRESH_EVERY_MS;
        await options.refresh().catch((err) => {
          if (err?.code === "disconnected") throw err;
        });
        options.flush?.();
        for (let i = 0; i < 8 && !done(); i++) await yieldTask();
        if (done()) return;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  function requireTick(value, what) {
    if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
      throw new UAError("out_of_range", `${what} must be an integer tick count`);
    }
    return value;
  }
  function midiByte(value, what, min = 0) {
    if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > 127) {
      throw new UAError("out_of_range", `${what} must be an integer ${min}-127`);
    }
    return value;
  }

  // src/model/control-values.ts
  function postControlValues(client, sessionUid, command, entries, range, contextType) {
    const what = command === "write_control_values" ? "writeControlValues" : "trimControlValues";
    if (entries.length === 0) return Promise.reject(new UAError("out_of_range", `${what}(): no controls given`));
    if (range.start === void 0 !== (range.stop === void 0)) {
      return Promise.reject(new UAError("out_of_range", `${what}(): give both start and stop, or neither for the selection`));
    }
    const controls = [];
    for (const e of entries) {
      const uid = typeof e.control === "string" ? e.control : e.control.uid.value;
      if (!uid) return Promise.reject(new UAError("unavailable", `${what}(): control uid not loaded; call control.load() first`));
      if (typeof e.value !== "number" || !Number.isFinite(e.value)) return Promise.reject(new UAError("out_of_range", `${what}(): value must be a finite number`));
      controls.push({ control_uid: uid, value: float(e.value) });
    }
    const payload = { session_uid: sessionUid, context_type: contextType, controls };
    if (range.start !== void 0 && range.stop !== void 0) {
      payload["start"] = requireTick(range.start, "start");
      payload["stop"] = requireTick(range.stop, "stop");
    }
    return client.raw.post(`/sessions/${sessionUid}/${command}`, payload);
  }

  // src/model/automation.ts
  var AUTOMATION_MODES = ["off", "read", "write", "touch", "latch"];
  function automationModeOrdinal(mode) {
    return AUTOMATION_MODES.indexOf(mode);
  }
  var BreakpointNode = class extends Node {
    start;
    value;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.start = this.prop("start");
      this.value = this.prop("value");
    }
  };
  var Automation = class extends Collection {
    /** @internal */
    constructor(client, controlPath, controlUidProp, sessionUid, lane = "automation") {
      super(client, `${controlPath}/${lane}`, (p) => new BreakpointNode(client, p), { levels: 2, commands: false, flatvalue: true });
      this.controlUidProp = controlUidProp;
      this.sessionUid = sessionUid;
    }
    controlUidProp;
    sessionUid;
    /** Breakpoints sorted by tick. */
    get breakpoints() {
      return this.items.map((b) => ({ tick: b.start.value ?? 0, value: b.value.value ?? 0 })).sort((a, b) => a.tick - b.tick);
    }
    post(command, payload) {
      const controlUid = this.controlUidProp.value;
      if (!controlUid) return Promise.reject(new UAError("unavailable", "control uid not loaded; call control.load() first", { path: this.path }));
      return this.client.raw.post(`/sessions/${this.sessionUid}/${command}`, { session_uid: this.sessionUid, control_uid: controlUid, ...payload });
    }
    /**
     * Wait until the lane shows the edit. The breakpoint verbs answer `null` whether or not
     * anything changed (fact 71), and LUNA holds pushes inside a batch but answers reads
     * (fact 60), so the lane is re-read while waiting.
     */
    settled(done, what) {
      return settle(done, what, { path: this.path, refresh: () => this.reload() });
    }
    at(tick) {
      return this.breakpoints.find((b) => b.tick === tick);
    }
    /**
     * Insert breakpoints. With `clearRange`, existing breakpoints in that range are removed first;
     * without it, new points stack on existing ones. Values go on the wire as float literals,
     * because LUNA stores a bare whole number as 0 (fact 82). Resolves once every point is in
     * the lane.
     *
     * @example
     * await track.gain.automation.insert([{ tick: 0, value: 0 }, { tick: Luna.WHOLE_NOTE, value: -6 }]);
     */
    async insert(points, clearRange2) {
      const values = points.map((p) => ({ location: requireTick(p.tick, "breakpoint tick"), value: float(p.value) }));
      const payload = { values };
      if (clearRange2) {
        payload["start"] = requireTick(clearRange2.startTick, "clearRange.startTick");
        payload["stop"] = requireTick(clearRange2.stopTick, "clearRange.stopTick");
      }
      await this.post("insert_bp", payload);
      await this.settled(() => points.every((p) => sameValue(this.at(p.tick)?.value, p.value)), "insert breakpoints");
    }
    /**
     * Delete the breakpoint at `tick`, or every breakpoint in `[startTick, stopTick]`. Resolves
     * once they are gone.
     *
     * @example
     * await track.gain.automation.clear(0, Luna.WHOLE_NOTE * 4);
     */
    async clear(startTick, stopTick) {
      const payload = { start: requireTick(startTick, "startTick") };
      if (stopTick !== void 0) payload["stop"] = requireTick(stopTick, "stopTick");
      await this.post("delete_bp", payload);
      const gone = (b) => stopTick === void 0 ? b.tick !== startTick : b.tick < startTick || b.tick > stopTick;
      await this.settled(() => this.breakpoints.every(gone), "clear breakpoints");
    }
    /**
     * Move the breakpoint at `fromTick` to `toTick`. Resolves once it has moved.
     *
     * @example
     * await track.gain.automation.move(0, Luna.QUARTER_NOTE);
     */
    async move(fromTick, toTick) {
      const value = this.at(fromTick)?.value;
      await this.post("move_bp", { location: requireTick(fromTick, "fromTick"), new_location: requireTick(toTick, "toTick") });
      if (fromTick === toTick) return;
      await this.settled(() => this.at(toTick) !== void 0 && (value === void 0 || this.at(fromTick) === void 0), "move breakpoint");
    }
    /**
     * Set the value of the breakpoint at `tick`, sent as a float literal (fact 82). Resolves
     * once the lane shows it.
     *
     * @example
     * await track.gain.automation.setValue(0, -3);
     */
    async setValue(tick, value) {
      await this.post("trim_bp", { location: requireTick(tick, "tick"), value: float(value) });
      await this.settled(() => sameValue(this.at(tick)?.value, value), "set breakpoint value");
    }
    /**
     * Write `value` over `[start, stop)` (`write_control_values`, fact 227): breakpoints in the
     * range go, and LUNA adds anchors so the curve outside it keeps its shape (one at `start - 1`
     * holding the old value, a step to `value` at `start` and `stop - 1`, and one at `stop` back
     * to the old value). `start === stop` writes a single point. One undo step. The value goes as
     * a float literal (fact 82). Resolves once the lane shows the write.
     *
     * @example
     * await track.gain.automation.writeRange(-12, { start: Luna.WHOLE_NOTE, stop: Luna.WHOLE_NOTE * 2 });
     */
    async writeRange(value, range) {
      const { start, stop } = range;
      await postControlValues(this.client, this.sessionUid, "write_control_values", [{ control: this.uidOrThrow(), value }], { start, stop }, "main");
      await this.settled(
        () => sameValue(this.at(start)?.value, value) && this.breakpoints.every((b) => b.tick <= start || b.tick >= stop - 1),
        "write automation range"
      );
    }
    /**
     * Add `delta` to the curve over `[start, stop)` (`trim_control_values`, fact 227): every
     * breakpoint in the range moves by `delta`, LUNA adds anchors at the edges so the curve
     * outside keeps its shape, and on a mixer output it puts that output's `gain_trim` back to 0.
     * With no breakpoints yet, the control's value plus `delta` becomes a plateau. One undo step.
     * Resolves once the lane has changed.
     *
     * @example
     * await track.gain.automation.trimRange(3, { start: 0, stop: Luna.WHOLE_NOTE * 4 }); // +3 dB
     */
    async trimRange(delta, range) {
      const { start, stop } = range;
      const before = JSON.stringify(this.breakpoints);
      await postControlValues(this.client, this.sessionUid, "trim_control_values", [{ control: this.uidOrThrow(), value: delta }], { start, stop }, "main");
      await this.settled(
        () => this.at(start) !== void 0 && (delta === 0 || JSON.stringify(this.breakpoints) !== before),
        "trim automation range"
      );
    }
    uidOrThrow() {
      const uid = this.controlUidProp.value;
      if (!uid) throw new UAError("unavailable", "control uid not loaded; call control.load() first", { path: this.path });
      return uid;
    }
  };
  function sameValue(stored, wanted) {
    return stored !== void 0 && Math.abs(stored - wanted) <= 1e-5 * Math.max(1, Math.abs(wanted));
  }

  // src/model/control.ts
  var CONTROL_TYPES = [
    "gain",
    "pan",
    "pan_left",
    "pan_right",
    "mute",
    "record_mute",
    "solo",
    "solo_safe",
    "parameter",
    "audio_source",
    "pre_fader",
    "enabled",
    "gain_trim",
    "input_trim_left",
    "input_trim_right",
    "input_trim_invert_left",
    "input_trim_invert_right",
    "input_trim_mono",
    "input_trim_invert_mono",
    "input_trim_link",
    "sidechain_input_trim",
    "latency_offset",
    "mix_to_mono",
    "preamp_gain",
    "preamp_hiz",
    "preamp_invert",
    "preamp_48v",
    "preamp_limitor",
    "preamp_compressor",
    "preamp_max_compressor",
    "preamp_tone",
    "preamp_pad",
    "preamp_low_cut"
  ];
  var Control = class extends Node {
    /** @internal */
    constructor(client, path, sessionUid = sessionUidFromPath(path)) {
      super(client, path);
      this.sessionUid = sessionUid;
      const wire = (v) => this.wireNumber(v);
      this.value = this.gated(this.writableProp("value", wire));
      this.normalized = this.gated(this.writableProp("normalized_value", wire));
      this.real = this.gated(this.writableProp("real_value", wire));
      this.display = this.prop("string_value");
      this.uid = this.prop("uid");
      this.name = this.prop("name");
      this.controlType = this.prop("control_type");
      this.automatable = this.prop("automatable");
      this.discrete = this.prop("discrete");
      this.numSteps = this.prop("num_steps");
      this.touchCount = this.prop("touch_count");
      this.initialized = this.prop("initialized");
      this.realValues = this.prop("real_values");
      this.displayValues = this.prop("string_values");
      const taperName = this.prop("taper");
      this.taper = derived([this.controlType, taperName], () => Taper.forControl(this.controlType.value, taperName.value));
    }
    sessionUid;
    /** Engine-native value. Writing here is undoable. */
    value;
    /** 0..1 view. */
    normalized;
    /** Value in units (dB, pan position) or boolean for switches. */
    real;
    /** Formatted for display, as the engine formats it. */
    display;
    uid;
    name;
    controlType;
    automatable;
    discrete;
    numSteps;
    touchCount;
    /**
     * `true` on a live control. A plugin parameter left behind when its slot was cleared has
     * `initialized: null` (fact 86); {@link Effect.params} lists only live ones.
     */
    initialized;
    /** For discrete controls: the real value of each step. */
    realValues;
    /** For discrete controls: the display string of each step. */
    displayValues;
    /**
     * The fader taper LUNA maps this control's `normalized` to dB with (fact 134): a
     * {@link Taper} for gain-type controls (gain, gain trim, input trims), `null` for the rest,
     * `undefined` until the control type arrives. It changes, and notifies, when LUNA swaps the
     * taper, as it does for a summing console on a bus input.
     *
     * @example
     * const taper = track.gain.taper.value!;
     * taper.name;                     // '+12'
     * taper.toNormalized(0);          // 0.7818
     * track.gain.taper.onChange(() => redrawMarks(track.gain.taper.value));
     */
    taper;
    gestureDepth = 0;
    /** Whether the outermost {@link begin} sent a touch, so {@link end} releases only that. */
    gestureTouched = false;
    automationLane;
    recordingLane;
    /** Playback automation lane. Call `load()` on it before reading breakpoints. */
    get automation() {
      this.automationLane ??= new Automation(this.client, this.path, this.uid, this.sessionUid, "automation");
      return this.automationLane;
    }
    /** Automation captured during the current record pass. */
    get automationRecording() {
      this.recordingLane ??= new Automation(this.client, this.path, this.uid, this.sessionUid, "automation_recording");
      return this.recordingLane;
    }
    release() {
      this.automationLane?.dispose();
      this.recordingLane?.dispose();
    }
    /**
     * A number written to a continuous control goes as a float literal (fact 142): LUNA refuses a
     * bare whole number for a plugin parameter's `real_value` and ignores one for its `value`, so
     * `real.set(-3)` would fail where `real.set(-3.5)` works. A discrete control's step value
     * stays a whole number, which is what it requires; so do booleans and anything else.
     */
    wireNumber(v) {
      return typeof v === "number" && Number.isFinite(v) && this.discrete.value === false ? float(v) : v;
    }
    /** True when `real` is boolean-like (mute, solo, switches). */
    get isSwitch() {
      return this.discrete.value === true && this.numSteps.value === 2;
    }
    /** For switches: current state as a boolean. */
    get on() {
      const r = this.real.value;
      if (typeof r === "boolean") return r;
      return (this.value.value ?? 0) !== 0;
    }
    /** For switches: flip the state. */
    async toggle() {
      await this.real.set(!this.on);
    }
    /**
     * True when writes to this control are touch-bracketed: automatable controls, and discrete
     * ones (switches, stepped parameters), which LUNA's GUI always brackets (fact 78). A control
     * whose `automatable` has not arrived yet counts as automatable.
     *
     * @example
     * track.gain.touchable; // true
     * track.solo.touchable; // true: a switch, though not automatable
     */
    get touchable() {
      return this.automatable.value !== false || this.discrete.value === true;
    }
    /**
     * Start a continuous gesture (pointer down). Sends `set_touch` on for a {@link touchable}
     * control; writes until {@link end} are not bracketed individually. Nested calls are
     * counted and only the outermost touches. Always pair with {@link end}, including on
     * cancelled drags; {@link bindGesture} does the pairing for a DOM element.
     *
     * @example
     * gain.begin();
     * await gain.normalized.set(0.6);
     * gain.end();
     */
    begin() {
      if (this.gestureDepth++ > 0) return;
      this.gestureTouched = this.touchable;
      if (this.gestureTouched) void this.touch(true);
    }
    /**
     * Finish a continuous gesture (pointer up). Releases the touch the matching {@link begin}
     * took; an unmatched call is ignored, since LUNA rejects a release it never saw a touch for
     * (fact 78).
     */
    end() {
      if (this.gestureDepth === 0) return;
      if (--this.gestureDepth > 0 || !this.gestureTouched) return;
      this.gestureTouched = false;
      void this.touch(false);
    }
    /**
     * Put the control back to its default value (`set_control_default_value`). LUNA knows each
     * control's default, so there is no default to read or hard-code: a double-click-to-reset
     * calls this. Like a one-shot write it is touch-bracketed, so it makes one undo step; inside
     * a {@link begin}/{@link end} gesture it is not bracketed again. The new value arrives by
     * push. A plugin parameter whose plugin gives LUNA no default keeps its value (fact 92).
     *
     * @example
     * fader.addEventListener('dblclick', () => track.gain.resetToDefault());  // 0 dB
     * panKnob.addEventListener('dblclick', () => track.main.pans[0]?.resetToDefault()); // centre
     */
    async resetToDefault() {
      const reset = () => this.post("set_control_default_value", {}).then(() => void 0);
      if (this.gestureDepth > 0 || !this.touchable) return reset();
      await this.touch(true);
      try {
        await reset();
      } finally {
        await this.touch(false);
      }
    }
    /** True while inside a {@link begin}/{@link end} pair. */
    get inGesture() {
      return this.gestureDepth > 0;
    }
    /** Raw touch state on the engine (`set_touch` command). Prefer begin/end; errors are swallowed. */
    touch(touching) {
      return this.post("set_touch", { touch: touching }).then(() => void 0, () => void 0);
    }
    /** Wrap a writable view so one-shot writes outside a gesture are touch-bracketed. */
    gated(view) {
      const set = view.set;
      return {
        get value() {
          return view.value;
        },
        onChange: (l) => view.onChange(l),
        set: async (v) => {
          if (this.gestureDepth > 0 || !this.touchable) {
            await set(v);
            return;
          }
          await this.touch(true);
          try {
            await set(v);
          } finally {
            await this.touch(false);
          }
        }
      };
    }
  };
  function sessionUidFromPath(path) {
    const m = /^\/sessions\/([^/]+)/.exec(path);
    return m?.[1] ?? "";
  }

  // src/model/gesture.ts
  function bindGesture(target, controls, options = {}) {
    const list = Array.isArray(controls) ? controls : [controls];
    const el = target;
    const view = el.ownerDocument?.defaultView ?? globalThis.window;
    let active = false;
    let pointerId;
    let releaseHold;
    const samePointer = (e) => pointerId === void 0 || e.pointerId === void 0 || e.pointerId === pointerId;
    const finish = (event) => {
      if (!active) return;
      active = false;
      view?.removeEventListener("pointerup", onRelease);
      view?.removeEventListener("pointercancel", onRelease);
      view?.removeEventListener("blur", onBlur);
      if (pointerId !== void 0 && el.hasPointerCapture?.(pointerId)) el.releasePointerCapture?.(pointerId);
      pointerId = void 0;
      for (const c of list) c.end();
      try {
        options.onEnd?.(event);
      } finally {
        const done = releaseHold;
        releaseHold = void 0;
        done?.();
      }
    };
    const onRelease = (e) => {
      if (samePointer(e)) finish(e);
    };
    const onBlur = (e) => finish(e);
    const onDown = (e) => {
      const p = e;
      if (active || p.button !== void 0 && p.button !== 0) return;
      active = true;
      pointerId = p.pointerId;
      releaseHold = options.bindings?.hold();
      for (const c of list) c.begin();
      if (options.capture && pointerId !== void 0) {
        try {
          el.setPointerCapture?.(pointerId);
        } catch {
        }
      }
      view?.addEventListener("pointerup", onRelease);
      view?.addEventListener("pointercancel", onRelease);
      view?.addEventListener("blur", onBlur);
      options.onBegin?.(e);
    };
    target.addEventListener("pointerdown", onDown, true);
    target.addEventListener("pointerup", onRelease);
    target.addEventListener("pointercancel", onRelease);
    target.addEventListener("lostpointercapture", onRelease);
    const gesture = {
      get active() {
        return active;
      },
      end: () => finish(),
      dispose: () => {
        finish();
        target.removeEventListener("pointerdown", onDown, true);
        target.removeEventListener("pointerup", onRelease);
        target.removeEventListener("pointercancel", onRelease);
        target.removeEventListener("lostpointercapture", onRelease);
      }
    };
    options.bindings?.add(gesture);
    return gesture;
  }

  // src/model/bind.ts
  var clamp01 = (v) => Math.min(1, Math.max(0, v));
  function bindRange(input, control, options = {}) {
    const view = options.view ?? "normalized";
    const fail = options.onError ?? ((e) => console.error("[Luna] bindRange", e));
    const bounds = () => {
      const min = input.min === "" ? 0 : Number(input.min);
      const max = input.max === "" ? 100 : Number(input.max);
      return [min, max > min ? max : min + 1];
    };
    const sync = () => {
      if (view === "real") {
        const r = control.real.value;
        if (typeof r === "number") input.value = String(r);
        return;
      }
      const [min, max] = bounds();
      input.value = String(min + (control.normalized.value ?? 0) * (max - min));
    };
    const gesture = bindGesture(input, control, {
      ...options.onBegin ? { onBegin: options.onBegin } : {},
      ...options.bindings ? { bindings: options.bindings } : {},
      onEnd: (e) => {
        sync();
        options.onEnd?.(e);
      }
    });
    const onInput = () => {
      const v = Number(input.value);
      let write2;
      if (view === "real") write2 = control.real.set(v);
      else {
        const [min, max] = bounds();
        write2 = control.normalized.set(clamp01((v - min) / (max - min)));
      }
      write2.catch(fail);
    };
    const onDouble = () => void control.resetToDefault().catch(fail);
    const off = control[view].onChange(() => {
      if (!gesture.active) sync();
    });
    input.addEventListener("input", onInput);
    if (options.reset !== false) input.addEventListener("dblclick", onDouble);
    sync();
    return withBindings(options.bindings, gesture, sync, () => {
      off();
      input.removeEventListener("input", onInput);
      input.removeEventListener("dblclick", onDouble);
    });
  }
  function bindDrag(el, controls, options = {}) {
    const list = Array.isArray(controls) ? controls : [controls];
    const lead = list[0];
    if (!lead) throw new TypeError("bindDrag needs at least one control");
    const fail = options.onError ?? ((e) => console.error("[Luna] bindDrag", e));
    const axis = options.axis ?? "y";
    const perUnit = options.pixelsPerUnit ?? 200;
    const step = options.step ?? 0.01;
    if (el.tabIndex < 0 && !el.hasAttribute("tabindex")) el.tabIndex = 0;
    if (!el.hasAttribute("role")) el.setAttribute("role", "slider");
    el.setAttribute("aria-valuemin", "0");
    el.setAttribute("aria-valuemax", "1");
    if (options.label && !el.hasAttribute("aria-label")) el.setAttribute("aria-label", options.label);
    if (!el.style.touchAction) el.style.touchAction = "none";
    let value = 0;
    const paint = () => {
      el.setAttribute("aria-valuenow", value.toFixed(3));
      const text = lead.display.value;
      if (text) el.setAttribute("aria-valuetext", text);
      else el.removeAttribute("aria-valuetext");
      options.render?.(value);
    };
    const sync = () => {
      value = clamp01(lead.normalized.value ?? value);
      paint();
    };
    const write2 = (v) => {
      value = clamp01(v);
      paint();
      for (const c of list) c.normalized.set(value).catch(fail);
    };
    let from;
    const gesture = bindGesture(el, list, {
      capture: true,
      ...options.bindings ? { bindings: options.bindings } : {},
      onBegin: (e) => {
        const p = e;
        from = { x: p.clientX, y: p.clientY, value };
        options.onBegin?.(e);
      },
      onEnd: (e) => {
        from = void 0;
        sync();
        options.onEnd?.(e);
      }
    });
    const onMove = (e) => {
      if (!gesture.active || !from) return;
      const dx = e.clientX - from.x;
      const dy = from.y - e.clientY;
      const travel = axis === "x" ? dx : axis === "y" ? dy : dx + dy;
      write2(from.value + travel / perUnit);
    };
    const onKey = (e) => {
      const next = {
        ArrowUp: value + step,
        ArrowRight: value + step,
        ArrowDown: value - step,
        ArrowLeft: value - step,
        PageUp: value + step * 10,
        PageDown: value - step * 10,
        Home: 0,
        End: 1
      };
      const v = next[e.key];
      if (v === void 0 || e.defaultPrevented) return;
      e.preventDefault();
      write2(v);
    };
    const onDouble = () => {
      for (const c of list) c.resetToDefault().catch(fail);
    };
    const offs = [lead.normalized, lead.display].map(
      (p) => p.onChange(() => {
        if (!gesture.active) sync();
      })
    );
    el.addEventListener("pointermove", onMove);
    el.addEventListener("keydown", onKey);
    if (options.reset !== false) el.addEventListener("dblclick", onDouble);
    sync();
    return withBindings(options.bindings, gesture, sync, () => {
      for (const off of offs) off();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("dblclick", onDouble);
    });
  }
  function withBindings(bindings, gesture, sync, unbind) {
    let disposed = false;
    const binding = {
      get active() {
        return gesture.active;
      },
      sync,
      end: () => gesture.end(),
      dispose: () => {
        if (disposed) return;
        disposed = true;
        gesture.dispose();
        unbind();
      }
    };
    bindings?.add(binding);
    return binding;
  }

  // src/model/clock.ts
  function bindClock(el, transport, options = {}) {
    const render = options.render ?? ((seconds) => void (el.textContent = formatMinSec(seconds, { fraction: 1 })));
    const now = () => (globalThis.performance ?? Date).now();
    const hasRaf = typeof globalThis.requestAnimationFrame === "function";
    const raf = hasRaf ? (fn) => requestAnimationFrame(fn) : (fn) => setTimeout(fn, 33);
    const unraf = hasRaf ? (h) => cancelAnimationFrame(h) : (h) => clearTimeout(h);
    let anchor = { seconds: transport.seconds, at: now() };
    let frame;
    let released = false;
    const paint = () => render(anchor.seconds + (transport.playing.value === true ? (now() - anchor.at) / 1e3 : 0));
    const loop = () => {
      frame = void 0;
      if (released || transport.playing.value !== true) return;
      paint();
      frame = raf(loop);
    };
    const stopFrames = () => {
      if (frame !== void 0) unraf(frame);
      frame = void 0;
    };
    const reanchor = () => {
      anchor = { seconds: transport.seconds, at: now() };
      paint();
      if (transport.playing.value === true) {
        if (frame === void 0) frame = raf(loop);
      } else stopFrames();
    };
    const offs = [transport.location.onChange(reanchor), transport.playing.onChange(reanchor), transport.playStart.onChange(reanchor)];
    reanchor();
    const release2 = () => {
      if (released) return;
      released = true;
      stopFrames();
      for (const off of offs) off();
    };
    options.bindings?.add(release2);
    return release2;
  }

  // src/model/bindings.ts
  var Bindings = class {
    releases = [];
    holds = /* @__PURE__ */ new Set();
    pending;
    /** A {@link whenIdle} rebuild that has not settled yet (an async one still loading). */
    running = false;
    disposed = false;
    /** True while a drag bound with this group, or a {@link hold}, is in progress. */
    get busy() {
      return this.holds.size > 0;
    }
    /**
     * Release `item` with the group. After {@link dispose} it is released at once.
     *
     * @example
     * const g = bindings.add(Luna.bindGesture(canvas, control, { capture: true }));
     * bindings.add(() => clearInterval(timer));
     */
    add(item) {
      if (this.disposed) release(item);
      else this.releases.push(item);
      return item;
    }
    /**
     * Subscribe to `prop` for as long as the group lives.
     *
     * @example
     * bindings.on(track.name, () => { label.textContent = track.name.value ?? ''; });
     */
    on(prop, listener) {
      return this.add(prop.onChange(listener));
    }
    /**
     * Keep the group busy until the returned function is called, for an edit that is not a drag
     * (an inline rename). Releasing twice is harmless; {@link clear} drops every hold.
     *
     * @example
     * const done = bindings.hold();
     * input.addEventListener('blur', done, { once: true });
     */
    hold() {
      const token = {};
      this.holds.add(token);
      return () => {
        if (this.holds.delete(token)) this.flush();
      };
    }
    /**
     * Run `rebuild` now when the group is idle. While it is busy, or while an earlier async
     * `rebuild` is still running, run it once afterwards instead; asked again meanwhile, the
     * latest `rebuild` replaces the waiting one, so a burst of changes costs one rebuild. The
     * promise settles when the `rebuild` that finally ran has finished.
     *
     * An async `rebuild` can find the group busy again after an `await` (a drag began while it
     * loaded). It should then ask again and return without touching the DOM:
     * `if (strips.busy) { void strips.whenIdle(render); return; }`. Returning that promise
     * instead would wait on itself.
     *
     * @example
     * session.tracks.onChange(() => void strips.whenIdle(render));
     */
    whenIdle(rebuild) {
      if (!this.busy && !this.running) return this.start(rebuild);
      return new Promise((resolve, reject) => {
        const waiters = this.pending?.waiters ?? [];
        waiters.push({ resolve, reject });
        this.pending = { run: rebuild, waiters };
      });
    }
    /**
     * Release everything added so far, end any drag and drop the holds. The group stays usable:
     * call it in each rebuild, just before replacing the DOM. A rebuild still waiting in
     * {@link whenIdle} is kept, and runs once nothing holds the group.
     *
     * @example
     * function render() { strips.clear(); ... }
     */
    clear() {
      this.holds.clear();
      const releases = this.releases;
      this.releases = [];
      for (const item of releases) {
        try {
          release(item);
        } catch (err) {
          console.error("[Luna] release threw", err);
        }
      }
      this.flush();
    }
    /**
     * {@link clear}, drop any waiting {@link whenIdle} rebuild (its promise resolves), and
     * release anything added afterwards at once.
     */
    dispose() {
      this.disposed = true;
      const pending2 = this.pending;
      this.pending = void 0;
      this.clear();
      for (const w of pending2?.waiters ?? []) w.resolve();
    }
    start(rebuild) {
      this.running = true;
      const done = run(rebuild);
      const settle2 = () => {
        this.running = false;
        this.flush();
      };
      done.then(settle2, settle2);
      return done;
    }
    flush() {
      const pending2 = this.pending;
      if (!pending2 || this.busy || this.running) return;
      this.pending = void 0;
      this.start(pending2.run).then(
        () => pending2.waiters.forEach((w) => w.resolve()),
        (err) => pending2.waiters.forEach((w) => w.reject(err))
      );
    }
  };
  function release(item) {
    if (typeof item === "function") item();
    else item.dispose();
  }
  function run(fn) {
    try {
      return Promise.resolve(fn());
    } catch (err) {
      return Promise.reject(err);
    }
  }

  // src/client/detect.ts
  function search() {
    const loc = globalThis.location;
    return typeof loc?.search === "string" ? loc.search : void 0;
  }
  function pageEngine() {
    const doc = globalThis.document;
    const engine = doc?.querySelector?.('meta[name="luna-engine"]')?.getAttribute("content");
    return engine === "wasm" || engine === "luna" || engine === "mock" ? engine : void 0;
  }
  function locationOptions() {
    const out = {};
    const s = search();
    const params = new URLSearchParams(s ?? "");
    if (!params.has("engine") && !params.has("port")) {
      const engine2 = pageEngine();
      if (engine2) out.engine = engine2;
    }
    if (!s) return out;
    const host = params.get("host");
    const port = params.get("port");
    if (host) out.host = host;
    if (port && Number.isFinite(Number(port))) out.port = Number(port);
    const engine = params.get("engine");
    if (engine === "wasm" || engine === "luna" || engine === "mock") out.engine = engine;
    const engineUrl = params.get("engine_url");
    if (engineUrl) out.engineUrl = engineUrl;
    return out;
  }
  function addOnTarget() {
    const target = new URLSearchParams(search() ?? "").get("target");
    return target === "window" || target === "browser" || target === "editor" || target === "app" ? target : void 0;
  }
  function isEmbeddedInLuna() {
    return locationOptions().port !== void 0;
  }
  function isLunaEnginePort(port) {
    return port === DEFAULT_LUNA_PORT;
  }
  function hasNativeBridge() {
    const w = globalThis;
    return typeof w.lunaAPI?.setAcceptsFileDrops === "function";
  }

  // src/model/shortcuts.ts
  var DEFAULT_SHORTCUTS = Object.freeze({
    undo: ["Mod+Z"],
    redo: ["Mod+Shift+Z"],
    togglePlayback: ["Space", "Numpad0"],
    toggleRecord: ["Mod+Space", "Numpad3"],
    // The edit commands are off unless a page asks for them (EDIT_SHORTCUTS): on by default they
    // would take Cmd+C and Backspace from every page that copies text or deletes in its own UI.
    selectAll: [],
    cut: [],
    copy: [],
    paste: [],
    clear: [],
    duplicate: []
  });
  var EDIT_SHORTCUTS = Object.freeze({
    selectAll: ["Mod+A"],
    cut: ["Mod+X"],
    copy: ["Mod+C"],
    paste: ["Mod+V"],
    clear: ["Backspace", "Delete"],
    duplicate: ["Mod+D"]
  });
  var COMMANDS = ["undo", "redo", "togglePlayback", "toggleRecord", "selectAll", "cut", "copy", "paste", "clear", "duplicate"];
  var NO_REPEAT = /* @__PURE__ */ new Set(["togglePlayback", "toggleRecord", "selectAll", "cut", "copy", "paste", "clear", "duplicate"]);
  function detectPlatform() {
    const nav = globalThis.navigator;
    const name = nav?.userAgentData?.platform ?? nav?.platform ?? nav?.userAgent ?? "";
    return /mac|iphone|ipad/i.test(name) ? "mac" : "other";
  }
  function parseCombo(combo, platform) {
    const parts = combo.split("+").map((p) => p.trim());
    const key = combo.endsWith("++") ? "+" : parts.pop() ?? "";
    const out = { key, meta: false, ctrl: false, alt: false, shift: false };
    for (const raw of parts) {
      const m = raw.toLowerCase();
      if (m === "") continue;
      if (m === "mod") out[platform === "mac" ? "meta" : "ctrl"] = true;
      else if (m === "cmd" || m === "command" || m === "meta") out.meta = true;
      else if (m === "ctrl" || m === "control") out.ctrl = true;
      else if (m === "alt" || m === "option") out.alt = true;
      else if (m === "shift") out.shift = true;
      else throw new Error(`unknown modifier "${raw}" in shortcut "${combo}"`);
    }
    return out;
  }
  function keyMatches(key, event) {
    if (key === event.code) return true;
    if (key === "Space") return event.key === " ";
    return key.length === 1 ? event.key.toLowerCase() === key.toLowerCase() : event.key === key;
  }
  function comboMatches(c, event) {
    return c.meta === event.metaKey && c.ctrl === event.ctrlKey && c.alt === event.altKey && c.shift === event.shiftKey && keyMatches(c.key, event);
  }
  function isEditable(target) {
    const el = target;
    if (!el || typeof el.tagName !== "string") return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName.toUpperCase();
    if (tag === "TEXTAREA" || tag === "SELECT") return true;
    if (tag !== "INPUT") return false;
    const type = (el.type ?? "text").toLowerCase();
    return !["button", "checkbox", "radio", "range", "color", "file", "image", "reset", "submit"].includes(type);
  }
  var Shortcuts = class {
    constructor(client, options = {}) {
      this.client = client;
      this.options = options;
      this.platform = options.platform ?? detectPlatform();
      this.bindings = Object.freeze({ ...DEFAULT_SHORTCUTS, ...options.bindings });
      this.parsed = COMMANDS.flatMap((cmd) => this.bindings[cmd].map((combo) => [cmd, parseCombo(combo, this.platform)]));
    }
    client;
    options;
    /** The combos in effect, per command. */
    bindings;
    platform;
    parsed;
    /** The key whose keydown was handled, so its keyup cannot also click a focused button. */
    swallowKeyUp;
    /** The command `event` is bound to, if any. Ignores focus and `defaultPrevented`. */
    commandFor(event) {
      return this.parsed.find(([, combo]) => comboMatches(combo, event))?.[0];
    }
    /**
     * Run the command for a keydown the page has not handled. Returns true, having called
     * `preventDefault()`, when it ran one; false for a key that is claimed, typed into a text
     * field, unbound, a held-down transport key, or pressed with no session open.
     */
    handle(event) {
      if (event.defaultPrevented || event.isComposing || isEditable(event.target)) return false;
      const command = this.commandFor(event);
      if (!command || event.repeat && NO_REPEAT.has(command)) return false;
      const session = this.session();
      if (!session) return false;
      event.preventDefault();
      this.swallowKeyUp = event.code;
      this.options.onCommand?.(command, event);
      this.runOn(session, command).catch((e) => (this.options.onError ?? warn)(e, command));
      return true;
    }
    /**
     * Keyup half of {@link handle}: claims the keyup of a key whose keydown was handled, so
     * Space does not also activate a focused button.
     */
    handleKeyUp(event) {
      if (this.swallowKeyUp !== void 0 && event.code === this.swallowKeyUp) {
        this.swallowKeyUp = void 0;
        event.preventDefault();
      }
    }
    /**
     * Run a command on the focused session (or `options.session`), as LUNA's own shortcut
     * would. Resolves without doing anything when no session is open.
     */
    async run(command) {
      const session = this.session();
      if (session) await this.runOn(session, command);
    }
    session() {
      return this.options.session ? this.options.session() : this.client.sessions.current();
    }
    async runOn(session, command) {
      switch (command) {
        case "undo":
          await session.undo();
          return;
        case "redo":
          await session.redo();
          return;
        case "togglePlayback":
        case "toggleRecord": {
          await session.ready();
          await (command === "togglePlayback" ? session.transport.toggle() : session.transport.toggleRecord());
          return;
        }
        case "selectAll":
        case "cut":
        case "copy":
        case "paste":
        case "clear":
        case "duplicate": {
          await this.options.prepare?.(command, session);
          await session.context[command]();
          return;
        }
      }
    }
  };
  function warn(error, command) {
    console.warn(`Luna shortcut ${command} failed:`, error);
  }
  function bindShortcuts(client, options = {}) {
    const shortcuts = new Shortcuts(client, options);
    if (hasNativeBridge()) return { shortcuts, installed: false, dispose: () => {
    } };
    const target = options.target ?? globalThis.window;
    const onDown = (e) => {
      shortcuts.handle(e);
    };
    const onUp = (e) => shortcuts.handleKeyUp(e);
    target?.addEventListener("keydown", onDown);
    target?.addEventListener("keyup", onUp);
    return {
      shortcuts,
      installed: true,
      dispose: () => {
        target?.removeEventListener("keydown", onDown);
        target?.removeEventListener("keyup", onUp);
      }
    };
  }

  // src/model/controls.ts
  var Controls = class extends Collection {
    named = /* @__PURE__ */ new Map();
    /** @internal */
    constructor(client, path) {
      super(client, path, (childPath) => new Control(client, childPath), { levels: 2, commands: false, flatvalue: true });
    }
    /**
     * The control called `name`. Always returns an object; its props are `undefined` until the
     * folder is loaded or the engine pushes it.
     */
    get(name) {
      const listed = this.byId(name);
      if (listed) return listed;
      let c = this.named.get(name);
      if (!c) {
        c = new Control(this.client, `${this.path}/${name}`);
        this.named.set(name, c);
      }
      return c;
    }
    /** @internal Dispose the listed controls and the ones handed out by name before they were listed. */
    dispose() {
      super.dispose();
      for (const c of this.named.values()) c.dispose();
      this.named.clear();
    }
  };

  // src/model/meter.ts
  var Meter = class extends Node {
    /** Current level per stream, 0..1. */
    level;
    /** Held peak per stream, 0..1. */
    peak;
    /** Clip indicator per stream (0/1). */
    clip;
    enabled;
    numStreams;
    listeners = 0;
    unwatch;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.level = this.prop("level");
      this.peak = this.prop("peak");
      this.clip = this.prop("clip");
      this.enabled = this.prop("enabled");
      this.numStreams = this.prop("num_streams");
    }
    /** Streams metered: `num_streams` once read, else the length of the level array, at least 1. */
    get streams() {
      const n = this.numStreams.value;
      return typeof n === "number" && n > 0 ? n : Math.max(1, this.level.value?.length ?? 0);
    }
    /**
     * The highest current level across streams, 0..1: one number for a single bar.
     *
     * @example
     * track.meter.onChange(() => (bar.style.height = `${track.meter.max * 100}%`));
     */
    get max() {
      const levels = this.level.value ?? [];
      return levels.length ? Math.max(...levels) : 0;
    }
    /** Called on every meter push while subscribed. */
    onChange(listener) {
      if (this.listeners++ === 0) {
        this.unwatch = this.client.store.watch(this.path, { load: { flatvalue: true, commands: false, children: false } }).release;
      }
      const unsub = this.level.onChange(listener);
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        unsub();
        if (--this.listeners === 0) {
          this.unwatch?.();
          this.unwatch = void 0;
        }
      };
    }
    release() {
      this.unwatch?.();
      this.unwatch = void 0;
      this.listeners = 0;
    }
  };

  // src/model/output.ts
  var SEND_COUNT = 8;
  var CUE_COUNT = 4;
  var Output = class extends Node {
    uid;
    outputType;
    /** Raw destination rows. Prefer {@link destinations}, which carries the handle to delete one. */
    assignments;
    /**
     * Every destination, live, in LUNA's order. Usually zero or one; {@link assign} appends.
     *
     * @example
     * send.destinations.onChange(() => label.textContent = send.destinations.value.map((d) => d.name).join(', '));
     */
    destinations;
    /** The first destination, or `undefined` when unrouted. */
    destination;
    /** The first destination's bus uid, or `null` when unrouted. LUNA's own `bus_uid` property is always null. */
    busUid;
    controls;
    meter;
    objectsRequested = false;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.uid = this.prop("uid");
      this.outputType = this.prop("output_type");
      this.assignments = this.prop("assignments");
      const objects = client.store.children(`${path}/assignment_objects`);
      this.destinations = derived([this.assignments, objects], () => {
        const rows = Array.isArray(this.assignments.value) ? this.assignments.value : [];
        const uids = objects.value ?? [];
        if (rows.length > uids.length) this.requestObjects();
        return Object.freeze(uids.map((uid, i) => destinationOf(uid, rows[i], client, `${path}/assignment_objects/${uid}`)));
      });
      this.destination = derived([this.destinations], () => this.list()[0]);
      this.busUid = derived([this.destinations], () => this.list()[0]?.busUid ?? null);
      this.controls = new Controls(client, `${path}/controls`);
      this.meter = new Meter(client, `${path}/meters/level`);
    }
    /** The current destinations; `Prop.value` is typed as possibly undefined. */
    list() {
      return this.destinations.value ?? [];
    }
    requestObjects() {
      if (this.objectsRequested) return;
      this.objectsRequested = true;
      void this.client.store.load(`${this.path}/assignment_objects`, { levels: 2, commands: false, flatvalue: true }).catch(() => {
        this.objectsRequested = false;
      });
    }
    /** Whether the output routes anywhere. */
    get assigned() {
      return this.list().length > 0;
    }
    /**
     * True on a stereo channel, where pan is two controls, `pan_left` and `pan_right`
     * (fact 84). Read from the owning channel's `stem_format`, or from the controls when
     * they are loaded.
     */
    get stereo() {
      if (this.controls.byId("pan_left")) return true;
      if (this.controls.byId("pan")) return false;
      const owner = /^(.*\/(?:tracks|buses)\/[^/]+)\/outputs\//.exec(this.path)?.[1];
      return owner !== void 0 && this.client.store.cell(owner, "stem_format").value === "stereo";
    }
    get gain() {
      return this.controls.get("gain");
    }
    /**
     * The pan control: `pan` on a mono channel; on a stereo channel `pan_left`, with
     * {@link panRight} beside it (fact 84). Use {@link pans} to handle both.
     *
     * @example
     * for (const p of track.main.pans) p.normalized.set(0.5);
     */
    get pan() {
      return this.stereo ? this.controls.get("pan_left") : this.controls.get("pan");
    }
    /** Left pan on a stereo channel; the one pan on a mono channel. */
    get panLeft() {
      return this.pan;
    }
    /** Right pan on a stereo channel; the one pan on a mono channel. */
    get panRight() {
      return this.stereo ? this.controls.get("pan_right") : this.controls.get("pan");
    }
    /** Every pan control: one on a mono channel, left and right on a stereo one. */
    get pans() {
      return this.stereo ? [this.controls.get("pan_left"), this.controls.get("pan_right")] : [this.controls.get("pan")];
    }
    get mute() {
      return this.controls.get("mute");
    }
    /** Pre- or post-fader, for a send. A control, not a node property. */
    get preFader() {
      return this.controls.get("pre_fader");
    }
    /** Send enable, for a send. A control, not a node property. */
    get enabled() {
      return this.controls.get("enabled");
    }
    /** `send_0`..`send_7`. */
    get isSend() {
      return this.id.startsWith("send_");
    }
    /** `cue_0`..`cue_3`. Cue outputs are routed by LUNA and refuse the routing commands. */
    get isCue() {
      return this.id.startsWith("cue_");
    }
    /** The slot number for a `send_N` or `cue_N` output, `undefined` for `main`. */
    get index() {
      const n = Number(this.id.slice(this.id.indexOf("_") + 1));
      return this.id.includes("_") && Number.isInteger(n) ? n : void 0;
    }
    /**
     * Who owns this output, read off its own path
     * (`/sessions/<session>/{tracks,buses}/<channel>/outputs/<id>`), so the routing commands
     * can name the session and channel without every caller threading them through.
     */
    owner() {
      this.assertLive();
      const m = /^((\/sessions\/([^/]+))\/(tracks|buses)\/([^/]+))\/outputs\//.exec(this.path);
      if (!m) throw new UAError("unavailable", `${this.path} is not a channel output, so it cannot be routed`, { path: this.path });
      return { channelPath: m[1], sessionPath: m[2], sessionUid: m[3], isTrack: m[4] === "tracks", channelUid: m[5] };
    }
    /** Wait for the routing to show an edit; the assignment verbs can answer before the model moves. */
    settled(done, what) {
      return settle(done, what, {
        path: this.path,
        disposed: () => this.disposed,
        refresh: () => this.client.store.load(this.path, { levels: 3, commands: false, flatvalue: true, propfilter: ["assignments", "uid", "output_type"] }),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    /**
     * Route this send to a bus and resolve to the new assignment uid, once the destination is
     * in {@link destinations}. One "New Output Assignment" undo entry.
     *
     * LUNA **appends**: a send that is already routed keeps its old destination too
     * (fact 43), so use {@link retarget} to replace rather than add.
     *
     * @throws {UAError} `out_of_range` on a cue output; `uasrv.invalid_type` for an unknown bus.
     * @example
     * const reverb = session.buses.items.find((b) => b.name.value === 'Reverb');
     * await track.outputs.byId('send_0').assign(reverb.id);
     */
    async assign(bus) {
      if (this.isCue) throw new UAError("out_of_range", `${this.id}: a cue output is routed by LUNA; assign a send`, { path: this.path });
      const busUid = typeof bus === "string" ? bus : bus.id;
      if (!busUid) throw new UAError("out_of_range", "assign(): a bus uid is required", { path: this.path });
      const { sessionPath, sessionUid, channelUid, isTrack } = this.owner();
      const source = isTrack ? { track_uid: channelUid } : { bus_src_uid: channelUid };
      const reply = await this.wire.post(`${sessionPath}/new_output_assignment`, { session_uid: sessionUid, ...source, output_type: this.id, bus_uid: busUid });
      const uid = reply?.uid;
      if (typeof uid !== "string" || !uid) throw new UAError("invalid_response", "new_output_assignment answered without a uid", { path: this.path });
      await this.settled(() => this.list().some((d) => d.uid === uid && d.busUid !== void 0), "assign send");
      return uid;
    }
    /**
     * Remove one destination (a {@link Destination} or its uid), or every one when called
     * with nothing. One "Delete Output Assignment" entry per removal; nothing to remove is a
     * no-op. Resolves once the destinations are gone.
     *
     * @example await track.outputs.byId('send_0').unassign();
     */
    async unassign(target) {
      const { sessionPath, sessionUid } = this.owner();
      const uids = target === void 0 ? this.list().map((d) => d.uid) : [typeof target === "string" ? target : target.uid];
      if (uids.length === 0) return;
      for (const uid of uids) await this.wire.post(`${sessionPath}/delete_output_assignment`, { session_uid: sessionUid, uid });
      await this.settled(() => !this.list().some((d) => uids.includes(d.uid)), "unassign send");
    }
    /**
     * Replace every destination with `bus`: unassign, then assign, because the engine's
     * forward verb only appends (fact 43). One undo entry named `name` when the send was
     * already routed; inside a caller's `session.transaction()` it joins that batch.
     *
     * @example await track.outputs.byId('send_0').retarget(delayBus.id);
     */
    async retarget(bus, name = `Retarget ${this.id}`) {
      if (this.list().length === 0) return this.assign(bus);
      const { sessionUid } = this.owner();
      const session = this.client.sessions.items.byId(sessionUid);
      const replace = async () => {
        await this.unassign();
        return this.assign(bus);
      };
      if (session) return session.transaction(name, replace);
      return replace();
    }
    /**
     * Move this send's routing and control values to another channel's slot (`move_send`) —
     * the same slot number by default — or copy them with `copy: true`. One "Move Send"
     * entry. Resolves once this slot has emptied (or, for a copy, once LUNA has answered).
     *
     * @example await drums.outputs.byId('send_0').moveTo(bass.id);
     */
    async moveTo(channel, options = {}) {
      if (this.isCue) throw new UAError("out_of_range", `${this.id}: a cue output cannot be moved`, { path: this.path });
      const index = options.index ?? this.index;
      if (index === void 0 || !Number.isInteger(index) || index < 0 || index >= SEND_COUNT) {
        throw new UAError("out_of_range", `moveTo(): index must be 0..${SEND_COUNT - 1}`, { path: this.path });
      }
      const destinationUid = typeof channel === "string" ? channel : channel.id;
      const { sessionPath, sessionUid, channelUid: source } = this.owner();
      await this.wire.post(`${sessionPath}/move_send`, {
        session_uid: sessionUid,
        source_uid: source,
        source: this.id,
        destination_uid: destinationUid,
        destination: `send_${index}`,
        copy: options.copy === true
      });
      if (options.copy !== true) await this.settled(() => this.list().length === 0, "move send");
    }
    release() {
      this.controls.dispose();
      this.meter.dispose();
    }
  };
  function destinationOf(uid, row, client, objectPath) {
    const cell = (name) => client.store.cell(objectPath, name).value;
    const desc = cell("output_desc");
    const busUid = row ? row.value : cell("output_node_uid");
    const error = row ? row.connection_error : cell("connection_error");
    const stem = row?.stem_format ?? desc?.stem_format;
    return Object.freeze({
      uid,
      busUid: typeof busUid === "string" && busUid ? busUid : void 0,
      name: String(row?.name ?? desc?.name ?? ""),
      busType: typeof row?.type === "string" ? row.type : void 0,
      stereo: stem !== "mono",
      error: typeof error === "string" && error ? error : void 0
    });
  }

  // src/model/effect.ts
  var PLUGIN_ERROR_MISSING = "mixer.missing_plug-in";
  var Effect = class extends Node {
    /** @internal */
    constructor(client, path, sessionUid, channelUid) {
      super(client, path);
      this.sessionUid = sessionUid;
      this.channelUid = channelUid;
      this.uid = this.prop("uid");
      this.insertType = this.prop("insert_type");
      this.pluginId = this.prop("plugin_id");
      this.pluginName = this.prop("plugin_name");
      this.enabled = this.prop("enabled");
      this.pluginPower = this.prop("plugin_power");
      this.presetName = this.prop("preset_name");
      this.presetUid = this.prop("preset_uid");
      this.presetDirty = this.prop("preset_uid_dirty");
      this.frozen = this.prop("frozen");
      this.sidechainAllowed = this.prop("sidechain_allowed");
      this.sidechainInUse = this.prop("sidechain_in_use");
      this.pluginError = this.prop("plugin_error");
      this.pluginLicenseError = this.prop("plugin_license_error");
      this.bypassControl = this.prop("bypass_control");
      this.bypassControlActiveLow = this.prop("bypass_control_active_low");
      this.controls = new Controls(client, `${path}/controls`);
      this.instanceId = this.prop("external_sdk_instance_id");
      this.loaded = derived([this.pluginId, this.instanceId, this.pluginError], () => !this.isEmpty && this.instanceId.value !== null && this.instanceId.value !== void 0 && !this.pluginError.value);
      this.editorOpen = derived([client.gui.pluginWindows], () => client.gui.isPluginOpen(this.channelUid, this.id, this.sessionUid));
      const bypassValue = derived([this.bypassControl], () => {
        const name = this.bypassControl.value;
        return name ? this.controls.get(name).value.value : void 0;
      });
      this.in = derived([bypassValue, this.bypassControlActiveLow], () => {
        const name = this.bypassControl.value;
        if (!name) return void 0;
        const v = this.controls.get(name).value.value;
        if (v === void 0) return void 0;
        const nonzero = v !== 0;
        return this.bypassControlActiveLow.value === true ? nonzero : !nonzero;
      });
    }
    sessionUid;
    channelUid;
    uid;
    insertType;
    /** Plugin id (for example `com.uaudio.uadx.1176`), or `null` when the slot is empty. */
    pluginId;
    pluginName;
    /** Reported by the engine; not the bypass state. See {@link in}. */
    enabled;
    pluginPower;
    presetName;
    presetUid;
    presetDirty;
    frozen;
    sidechainAllowed;
    sidechainInUse;
    pluginError;
    pluginLicenseError;
    /** Name of the control that carries the IN/OUT state, or `null` if the plugin has none. */
    bypassControl;
    /** Polarity of {@link bypassControl}: true when a nonzero value means IN; false or `null` when zero means IN. */
    bypassControlActiveLow;
    /** IN (true) or bypassed (false); `undefined` until known or when the plugin has no bypass control. */
    in;
    /**
     * The plugin instance id, set once the plugin has loaded (fact 86). `plugin_name` is not a
     * load signal: it can stay null for a loaded plugin; the catalog has the name.
     */
    instanceId;
    /** True once a plugin is loaded in this slot without an error. */
    loaded;
    /**
     * True while LUNA has this plugin's editor window open, whoever opened it (fact 126).
     * `undefined` until known and on a LUNA that does not report editor windows. Follows LUNA
     * after `session.ready()`.
     */
    editorOpen;
    /**
     * Every child of the slot's `controls` folder, including parameters a cleared plugin left
     * behind (fact 86). Prefer {@link params}.
     */
    controls;
    get isEmpty() {
      const id = this.pluginId.value;
      return id === null || id === void 0 || id === "";
    }
    /** True for the user-facing `effect_N` slots. */
    get isEffectSlot() {
      return this.id.startsWith("effect_");
    }
    /** The control carrying the IN/OUT state, if the plugin has one. */
    get bypass() {
      const name = this.bypassControl.value;
      return name ? this.controls.get(name) : void 0;
    }
    /**
     * The plugin's live parameters, in engine order: the `controls` that are `initialized`.
     * A cleared slot keeps its old parameters as ghosts (fact 86); they are left out here.
     * Writes are touch-bracketed like any control, which makes them undoable (fact 85).
     *
     * @example
     * await slot.controls.load();
     * for (const p of slot.params) console.log(p.name.value, p.display.value);
     */
    get params() {
      return this.controls.items.filter((c) => c.initialized.value === true);
    }
    /**
     * Load a plugin into this slot (replacing any current one) and resolve once it has
     * loaded. `set_inserts` answers `null` whether or not the plugin exists (fact 86), so the
     * slot is the proof: an unknown or unusable plugin rejects with the slot's
     * `plugin_error` as the code (for example `mixer.missing_plug-in`). Pass `wait: false`
     * to resolve on the reply alone.
     *
     * A preset can ride in the same call: `presetUid` (from {@link Presets.find}) makes LUNA
     * load that preset onto the effect — state and identity, which is what the preset browser
     * keys on — while `presetName` alone only labels the effect (fact 99).
     *
     * @example
     * await slot.setPlugin('com.uaudio.uadx.1176');
     * slot.loaded.value; // true
     * const preset = await luna.presets.find('uaudio_qi', '4-Band EQ');
     * await slot.setPlugin('uaudio_qi', { presetName: preset?.name, presetUid: preset?.uid });
     */
    async setPlugin(pluginId, options = {}) {
      const insert = { insert_type: this.id, plugin_id: pluginId };
      if (options.pluginName !== void 0) insert["plugin_name"] = options.pluginName;
      if (options.presetName !== void 0) insert["preset_name"] = options.presetName;
      if (options.presetUid !== void 0) insert["preset_uid"] = options.presetUid;
      const reply = await this.wire.post(`/sessions/${this.sessionUid}/set_inserts`, { session_uid: this.sessionUid, channel_uid: this.channelUid, inserts: [insert] });
      if (options.wait === false) return reply;
      await this.waitForPlugin(options.timeoutMs, pluginId);
      const error = this.pluginError.value;
      if (error) throw new UAError(error, `${pluginId} did not load into ${this.id}: ${error}`, { path: this.path });
      return reply;
    }
    /**
     * The installed plugins LUNA would put in this slot, sorted by name: what LUNA's plugins
     * browser offers here (fact 127). An instrument slot lists instruments, an effect slot
     * effects that run in this channel's format. Narrow with search text, categories and
     * favorites. A LUNA without the query rejects with `Luna.Unsupported`.
     *
     * @example
     * const choices = await slot.validPlugins({ search: 'comp', categories: ['Compressors & Limiters'] });
     * await slot.setPlugin(choices[0].pluginId);
     */
    validPlugins(options = {}) {
      this.assertLive();
      return this.client.plugins.query({ ...options, insertType: this.id, sessionUid: this.sessionUid, channelUid: this.channelUid });
    }
    /** Remove the plugin from this slot. */
    clear() {
      return this.wire.post(`/sessions/${this.sessionUid}/set_inserts`, { session_uid: this.sessionUid, channel_uid: this.channelUid, inserts: [{ insert_type: this.id, plugin_id: "" }] });
    }
    /**
     * Resolve once the slot holds a loaded plugin (it has an instance id) or reports a
     * `plugin_error` (fact 86). With `pluginId`, wait for that plugin rather than whatever
     * the slot held before. Rejects with {@link RequestTimeout} after `timeoutMs`.
     *
     * @example
     * await slot.waitForPlugin();
     * if (slot.pluginError.value) show(slot.pluginError.value);
     */
    waitForPlugin(timeoutMs = 1e4, pluginId) {
      const done = () => {
        if (pluginId !== void 0 && this.pluginId.value !== pluginId) return false;
        return this.loaded.value === true || Boolean(this.pluginError.value);
      };
      if (done()) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const offs = [];
        const finish = (err) => {
          clearTimeout(timer);
          for (const off of offs) off();
          if (err) reject(err);
          else resolve();
        };
        const timer = setTimeout(() => finish(new RequestTimeout("set_inserts", this.path, timeoutMs)), timeoutMs);
        const check = () => {
          if (done()) finish();
        };
        offs.push(this.pluginId.onChange(check), this.instanceId.onChange(check), this.pluginError.onChange(check));
        void this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }).then(check, () => {
        });
      });
    }
    /** Set IN (true) or bypass (false) through the engine's undoable, group-aware path. */
    setIn(on, contextType = "main") {
      return this.wire.post(`/sessions/${this.sessionUid}/contexts/${contextType}/commands/set_inserts_in_out`, {
        session_uid: this.sessionUid,
        channel_uid: this.channelUid,
        inserts: [this.id],
        value: on
      });
    }
    /**
     * Power the plugin in this slot on or off (`plugin_power`) through the edit context's
     * `set_inserts_power`, as LUNA's insert power switch does: one undo step, fanned out over the
     * channel's mix group, and a frozen slot is left alone (fact 171). Power is not bypass (see
     * {@link setIn}): every loaded plugin has it, instruments included. Resolves once
     * {@link pluginPower} shows it; for a frozen slot, on LUNA's reply.
     *
     * @example
     * await slot.setPower(false);
     * slot.pluginPower.value; // false
     */
    async setPower(on, contextType = "main") {
      await this.wire.post(`/sessions/${this.sessionUid}/contexts/${contextType}/commands/set_inserts_power`, {
        session_uid: this.sessionUid,
        channel_uid: this.channelUid,
        inserts: [this.id],
        value: on
      });
      if (this.frozen.value === true) return;
      await settle(() => this.pluginPower.value === on, "set power", {
        path: this.path,
        disposed: () => this.disposed,
        refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    /**
     * Move the plugin in this slot to `destination`, on this channel or another of the session,
     * with its state, parameters, automation and preset, in one undo step (`move_insert`,
     * fact 173). An occupied `effect_N` destination makes room: LUNA shuffles its neighbours
     * toward the nearest empty slot. Resolves once `destination` shows the plugin.
     *
     * The SDK refuses (code `invalid_slot`) a move between slots of different kinds, such as the
     * `console` slot and an `effect_N` slot: LUNA does not check, and such a move corrupts the
     * channel's chain. It refuses an empty source with `empty_slot`, since LUNA would clear the
     * destination.
     *
     * @example
     * await track.effects.byId('effect_0')!.moveTo(track.effects.byId('effect_3')!);
     */
    moveTo(destination, options = {}) {
      return this.transfer(destination, false, options.timeoutMs);
    }
    /**
     * Copy the plugin in this slot, with its state, parameters, automation and preset, to
     * `destination`, leaving this slot as it is. See {@link moveTo} for the rules.
     *
     * @example
     * await vocal.effects.byId('effect_0')!.copyTo(backing.effects.byId('effect_0')!);
     */
    copyTo(destination, options = {}) {
      return this.transfer(destination, true, options.timeoutMs);
    }
    async transfer(destination, copy, timeoutMs) {
      this.assertLive();
      const what = copy ? "copyTo" : "moveTo";
      if (destination.sessionUid !== this.sessionUid) throw new UAError("invalid_slot", `${what}(): the destination is in another session`, { path: destination.path });
      if (slotKind(this.id) !== slotKind(destination.id)) throw new UAError("invalid_slot", `${what}(): ${this.id} and ${destination.id} are different kinds of slot`, { path: this.path });
      const read = { children: false, commands: false, flatvalue: true };
      await Promise.all([this.client.store.load(this.path, read), this.client.store.load(destination.path, read)]);
      const pluginId = this.pluginId.value;
      if (!pluginId) throw new UAError("empty_slot", `${what}(): ${this.id} has no plugin`, { path: this.path });
      if (destination.path === this.path) return;
      await this.wire.post("/move_insert", { session_uid: this.sessionUid, source_uid: this.uid.value, destination_uid: destination.uid.value, copy });
      await settle(() => destination.pluginId.value === pluginId, what, {
        path: destination.path,
        ...timeoutMs !== void 0 ? { timeoutMs } : {},
        disposed: () => destination.disposed,
        refresh: () => this.client.store.load(destination.path, read),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    /**
     * Open this plugin's editor window in LUNA, as clicking it in LUNA's mixer does, or bring
     * it to the front. Resolves once {@link editorOpen} shows it; LUNA's reply alone proves
     * nothing, as an empty slot or a plugin LUNA will not show opens nothing (fact 126). That
     * rejects with code `no_effect`; an empty slot rejects at once with `empty_slot`. Pass
     * `wait: false` to resolve on the reply alone. Needs `/gui`: a headless engine or an older
     * LUNA rejects with `Luna.Unsupported`.
     *
     * @example
     * nameLabel.onclick = () => slot.openEditor();
     * slot.editorOpen.onChange(() => nameLabel.classList.toggle('open', slot.editorOpen.value === true));
     */
    async openEditor(options = {}) {
      if (this.isEmpty) throw new UAError("empty_slot", `openEditor: ${this.id} has no plugin`, { path: this.path });
      await this.client.gui.showPlugin(this.channelUid, this.id, { sessionUid: this.sessionUid });
      if (options.wait !== false) await this.settleEditor(true, "openEditor", options.timeoutMs);
    }
    /**
     * Close this plugin's editor window in LUNA, if it is open. Resolves once
     * {@link editorOpen} is false; see {@link openEditor}.
     *
     * @example
     * if (slot.editorOpen.value) await slot.closeEditor();
     */
    async closeEditor(options = {}) {
      await this.client.gui.hidePlugin(this.channelUid, this.id, { sessionUid: this.sessionUid });
      if (options.wait !== false) await this.settleEditor(false, "closeEditor", options.timeoutMs);
    }
    async settleEditor(open, what, timeoutMs) {
      await this.client.gui.watchPluginWindows();
      if (this.editorOpen.value === void 0) return;
      await settle(() => this.editorOpen.value === open, what, {
        path: this.path,
        ...timeoutMs !== void 0 ? { timeoutMs } : {},
        disposed: () => this.disposed,
        refresh: () => this.client.store.load("/gui/plugin_windows")
      });
    }
    /**
     * Load a preset onto the plugin in this slot: its state and its identity, so `presetUid`
     * and `presetName` follow (fact 122). The preset must belong to the slot's plugin; take its
     * uid from {@link Presets.query}, {@link Presets.recommend} or a {@link PresetSelection}.
     * Rejects with code `unavailable` when the slot is empty.
     *
     * @example
     * const [row] = await luna.presets.query({ pluginId: slot.pluginId.value!, search: 'Clean' });
     * await slot.loadPreset(row.uid);
     * slot.presetName.value; // row.name
     */
    async loadPreset(presetUid) {
      this.assertLive();
      if (this.pluginId.value === void 0 || this.uid.value === void 0) await this.load();
      const pluginId = this.pluginId.value;
      if (!pluginId) throw new UAError("unavailable", `loadPreset(): ${this.id} holds no plugin`, { path: this.path });
      await this.wire.post(`/presets/plugins/${pluginId}/load`, { session_uid: this.sessionUid, uid: this.uid.value, preset_uid: presetUid });
    }
    /** Step through the plugin's presets. */
    nextPreset() {
      return this.post("commands/preset_browser_increment");
    }
    previousPreset() {
      return this.post("commands/preset_browser_decrement");
    }
    release() {
      this.controls.dispose();
    }
  };
  function slotKind(slot) {
    const m = /^(effect|record_fx|midi|clip_effect)_\d+$/.exec(slot);
    return m ? `${m[1]}_N` : slot;
  }

  // src/model/channel.ts
  var Channel = class extends Node {
    /** @internal */
    constructor(client, path, sessionUid) {
      super(client, path);
      this.sessionUid = sessionUid;
      this.uid = this.prop("uid");
      this.name = this.writableProp("name");
      this.order = this.prop("order");
      this.color = this.writableProp("color");
      this.comments = this.writableProp("comments");
      this.stemFormat = this.prop("stem_format");
      this.automationMode = this.prop("automation_mode");
      this.folderUid = this.prop("folder_uid");
      this.frozen = this.prop("frozen");
      this.enabled = this.prop("enabled");
      this.controls = new Controls(client, `${path}/controls`);
      this.outputs = new Collection(client, `${path}/outputs`, (p) => new Output(client, p), { levels: 3, commands: false, flatvalue: true });
      this.main = new Output(client, `${path}/outputs/main`);
      this.effects = new Collection(client, `${path}/effects`, (p) => new Effect(client, p, sessionUid, this.id), { levels: 2, commands: false, flatvalue: true });
    }
    sessionUid;
    uid;
    name;
    order;
    /** ARGB packed integer as the engine stores it. */
    color;
    comments;
    stemFormat;
    automationMode;
    folderUid;
    frozen;
    enabled;
    /** Strip-level controls (`solo`, trims, preamp). */
    controls;
    outputs;
    /** The `main` output, always present. */
    main;
    /** All insert slots, including `console` and `sidechain_filter`. See {@link effectSlots}. */
    effects;
    /** The user-facing `effect_0`..`effect_N` slots in order. */
    get effectSlots() {
      return this.effects.items.filter((e) => e.isEffectSlot).sort((a, b) => a.id.localeCompare(b.id, void 0, { numeric: true }));
    }
    /** Effect slots that hold a plugin. */
    get loadedEffects() {
      return this.effectSlots.filter((e) => !e.isEmpty);
    }
    /** Load a plugin into the first empty effect slot (or a named slot). */
    async insert(pluginId, slot) {
      await this.effects.load();
      const target = slot ? this.effects.byId(slot) : this.effectSlots.find((e) => e.isEmpty);
      if (!target) return void 0;
      await target.setPlugin(pluginId);
      return target;
    }
    /**
     * Set this track's or bus's automation mode (`off | read | write | touch | latch`) in one
     * undo step. `set_automode_on_tracks` takes track and bus uids alike (fact 167);
     * {@link automationMode} follows on LUNA's push.
     *
     * @example
     * await track.setAutomationMode('touch');
     * await session.master!.setAutomationMode('read');
     */
    setAutomationMode(mode) {
      return this.wire.post(`/sessions/${this.sessionUid}/set_automode_on_tracks`, { uid: this.sessionUid, tracks: [this.id], automation_mode: automationModeOrdinal(mode) });
    }
    /** Main output gain. */
    get gain() {
      return this.main.gain;
    }
    /** Main output pan. */
    get pan() {
      return this.main.pan;
    }
    /** Main output mute. */
    get mute() {
      return this.main.mute;
    }
    /** Main output level meter. */
    get meter() {
      return this.main.meter;
    }
    /** Load this strip's properties plus the main output's controls in two round trips. */
    async loadStrip() {
      await Promise.all([this.load({ flatvalue: true, commands: false }), this.main.controls.load()]);
    }
    release() {
      this.controls.dispose();
      this.outputs.dispose();
      this.main.dispose();
      this.effects.dispose();
    }
  };

  // src/model/midi-routing.ts
  var MidiOutputAssignment = class extends Node {
    destinationTrackUid;
    destinationBusUid;
    effectUid;
    /** The MIDI device's name. */
    midiDevice;
    /** The channel as LUNA stores it: 0 for all channels, 1-16 for one (fact 220). */
    channel;
    /** Whichever of the four destination properties is set. `undefined` until loaded. */
    destination;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.destinationTrackUid = this.prop("destination_track_uid");
      this.destinationBusUid = this.prop("destination_bus_uid");
      this.effectUid = this.prop("effect_uid");
      this.midiDevice = this.prop("midi_device");
      this.channel = this.prop("midi_output_channel");
      this.destination = derived([this.destinationTrackUid, this.destinationBusUid, this.effectUid, this.midiDevice], () => destinationOf2(this), { distinct: true });
    }
  };
  function destinationOf2(a) {
    const t = a.destinationTrackUid.value;
    if (t) return { kind: "track", uid: t };
    const b = a.destinationBusUid.value;
    if (b) return { kind: "bus", uid: b };
    const e = a.effectUid.value;
    if (e) return { kind: "effect", uid: e };
    const d = a.midiDevice.value;
    if (d) return { kind: "device", name: d };
    return void 0;
  }
  var MidiOutputs = class extends Collection {
    /** @internal */
    constructor(client, trackPath, sessionUid, trackUid) {
      super(client, `${trackPath}/midi_output_assignments`, (p) => new MidiOutputAssignment(client, p), { levels: 2, commands: false, flatvalue: true });
      this.sessionUid = sessionUid;
      this.trackUid = trackUid;
    }
    sessionUid;
    trackUid;
    /**
     * Replace every assignment of this track with `routes`, in one undo step, through the edit
     * context's `set_midi_output_assignments` as LUNA's channel strip does (fact 219), and
     * resolve once {@link items} shows them. A route to a bus uid becomes a bus assignment.
     * Routes to an effect slot cannot be written this way.
     *
     * @example
     * await track.midiOutputs.set([{ track: synthTrack, channel: 0 }]);
     * await track.midiOutputs.set([{ device: 'IAC Driver Bus 1', channel: 10 }]);
     */
    async set(routes) {
      const devices = [];
      const tracks = [];
      for (const r of routes) {
        if (!Number.isInteger(r.channel) || r.channel < 0 || r.channel > 16) throw new UAError("out_of_range", `midiOutputs.set(): channel must be 0 (all) or 1-16, not ${String(r.channel)}`, { path: this.path });
        if ("device" in r) {
          const name = typeof r.device === "string" ? r.device : r.device.name.value;
          if (!name) throw new UAError("out_of_range", "midiOutputs.set(): a device route needs a device name", { path: this.path });
          devices.push({ value: name, channel: r.channel });
        } else {
          tracks.push({ value: typeof r.track === "string" ? r.track : r.track.id, channel: r.channel });
        }
      }
      await this.load();
      await this.client.raw.post(`/sessions/${this.sessionUid}/contexts/main/commands/set_midi_output_assignments`, { session_uid: this.sessionUid, track_uid: this.trackUid, devices, tracks });
      const want = [...devices.map((d) => `d:${d.value}:${d.channel}`), ...tracks.map((t) => `t:${t.value}:${t.channel}`)].sort().join("|");
      const have = () => this.items.map((a) => {
        const d = a.destination.value;
        if (!d) return "?";
        return d.kind === "device" ? `d:${d.name}:${a.channel.value}` : `t:${d.uid}:${a.channel.value}`;
      }).sort().join("|");
      await settle(() => have() === want, "set MIDI outputs", { path: this.path, refresh: () => this.reload(), flush: () => this.client.store.scheduler.flush() });
    }
  };

  // src/model/track.ts
  var POST_RECORD_COMMANDS = ["extract_lyrics", "extract_chords"];
  var Track = class extends Channel {
    trackType;
    ioType;
    recordEnabled;
    /**
     * The track's input monitor switch (`input_monitor`). LUNA can monitor the input while
     * this is off, for example auto-monitoring an armed track; read `inputMonitoring` for what
     * is happening now. Turning it on rejects with `uasrv.invalid_value` while the record mute
     * preference is on and no Apollo is active (fact 88).
     *
     * @example
     * await t.inputMonitor.set(true);
     * t.inputMonitor.onChange(() => console.log('switch', t.inputMonitor.value));
     */
    inputMonitor;
    /**
     * Whether LUNA is monitoring this track's input right now (`input_monitor_state`,
     * read-only). It can be true while `inputMonitor` is false: an armed track is monitored
     * while stopped or punched in (fact 88).
     *
     * @example
     * t.inputMonitoring.onChange(() => led.classList.toggle('on', t.inputMonitoring.value === true));
     */
    inputMonitoring;
    /** Description of the assigned input. */
    inputDesc;
    inputNodeUid;
    /** Uid of the active playlist; the playlist object lives under `session.playlists`. */
    playlistUid;
    hasPreamp;
    recordMute;
    /**
     * The uid of the track preset (or instrument plugin preset) the track was made from or last
     * had applied, or null (fact 132).
     */
    presetUid;
    /** That preset's name, or null. */
    presetName;
    /**
     * Whether Auto Gain can run on this track's input (`supports_auto_gain`, read-only): true for
     * an input on hardware whose preamp LUNA can set. LUNA works it out after the input changes,
     * so it can arrive a moment later (fact 194).
     *
     * @example
     * button.disabled = track.supportsAutoGain.value !== true;
     */
    supportsAutoGain;
    /**
     * Where this track sends its MIDI (facts 219-220). `await track.midiOutputs.load()` once.
     *
     * @example
     * await track.midiOutputs.set([{ track: synth, channel: 0 }]);
     */
    midiOutputs;
    /**
     * What LUNA runs on each audio take this track records, once the take lands (fact 233):
     * `extract_lyrics` transcribes it into `session.lyrics`, `extract_chords` detects its chords.
     * LUNA keeps the list while the session is open, not in the session file: set it again after
     * reopening. `[]` runs nothing.
     *
     * @example
     * await track.postRecordCommands.set(['extract_lyrics']);
     */
    postRecordCommands;
    /**
     * The instrument LUNA detected on this track (`instrument_determined`), e.g. `"Electric
     * Guitar"`, or `null` (fact 233). Read-only here: it is LUNA's analysis result.
     *
     * @example
     * label.textContent = track.instrumentDetermined.value ?? '';
     */
    instrumentDetermined;
    /**
     * True once the name was set as the user's own (LUNA's rename, or {@link rename}): a track
     * or instrument preset loaded later keeps it (fact 165). `name.set` leaves it as it is.
     */
    nameModified;
    /** @internal */
    constructor(client, path, sessionUid) {
      super(client, path, sessionUid);
      this.trackType = this.prop("track_type");
      this.ioType = this.prop("io_type");
      this.recordEnabled = this.writableProp("record_enabled");
      this.inputMonitor = this.writableProp("input_monitor");
      this.inputMonitoring = this.prop("input_monitor_state");
      this.inputDesc = this.prop("input_desc");
      this.inputNodeUid = this.writableProp("input_node_uid");
      this.playlistUid = this.prop("playlist_uid");
      this.hasPreamp = this.prop("has_preamp");
      this.recordMute = this.prop("record_mute");
      this.presetUid = this.prop("preset_uid");
      this.presetName = this.prop("preset_name");
      this.supportsAutoGain = this.prop("supports_auto_gain");
      this.nameModified = this.prop("name_modified");
      this.midiOutputs = new MidiOutputs(client, path, sessionUid, this.id);
      this.postRecordCommands = this.writableProp("post_record_commands");
      this.instrumentDetermined = this.prop("instrument_determined");
    }
    release() {
      this.midiOutputs.dispose();
      super.release();
    }
    /** Track solo (a track-level control, unlike mute which is on the main output). */
    get solo() {
      return this.controls.get("solo");
    }
    /**
     * Rename the track as LUNA's own rename does: the write carries request parameter
     * `name_modified=true`, so LUNA marks the name as the user's and a track or instrument preset
     * loaded later keeps it (fact 165). `name.set` renames without that mark, and the next
     * {@link loadPreset} replaces the name. Optimistic like `name.set`; {@link nameModified}
     * follows on LUNA's push.
     *
     * @example
     * await track.rename('Lead Vocal');
     * await track.loadPreset(preset); // still 'Lead Vocal'
     */
    async rename(name) {
      this.assertLive();
      await this.client.store.set(this.path, "name", name, name, { name_modified: "true" });
      await settle(() => this.name.value === name, "rename", {
        path: this.path,
        disposed: () => this.disposed,
        refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true, propfilter: ["name", "name_modified"] }),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    /**
     * Apply a preset to this track in one undo step, as LUNA's track header PRESETS > Assign
     * does (fact 132). A track preset replaces the track's plugins, sends and mixer settings; an
     * instrument plugin's preset replaces the instrument only, and needs an instrument track. The
     * track takes the preset's name unless it was renamed in LUNA; a name set with `name.set`
     * does not count, and is replaced; use {@link rename} for a name that stays. `presetUid` follows.
     *
     * @example
     * await track.loadPreset(sel.presets.items[0]);
     * track.presetName.value; // that preset's name
     */
    async loadPreset(preset) {
      const uid = typeof preset === "string" ? preset : preset.uid;
      await this.wire.post("/presets/devices/track/load", { session_uid: this.sessionUid, uid: this.id, preset_uid: uid });
    }
    /** Delete this track. */
    async delete() {
      await this.wire.post(`/sessions/${this.sessionUid}/delete_tracks`, { session_uid: this.sessionUid, track_uid: [this.id] });
    }
    /**
     * Duplicate this track in one undo step and resolve to the new {@link Track} once
     * `session.tracks` lists it with its properties loaded. LUNA copies clips and automation
     * unless `includeContent` is false (then routing, plugins and I/O only). The copy goes
     * right after the track or bus `after` names, else right after this track. (LUNA's field is
     * `before_uid`, but it places the copy after that channel: fact 166.) The SDK names the new
     * uid up front (`destination_track_uid`), so nothing is found by name.
     *
     * @example
     * const copy = await track.duplicate({ includeContent: false, after: otherTrack });
     * copy.name.value; // LUNA's name for the copy
     */
    async duplicate(options = {}) {
      this.assertLive();
      const uid = newChannelUid();
      const payload = { session_uid: this.sessionUid, track_uid: [this.id], destination_track_uid: [uid] };
      if (options.includeContent !== void 0) payload["include_content"] = options.includeContent;
      if (options.after !== void 0) payload["before_uid"] = typeof options.after === "string" ? options.after : options.after.id;
      await this.wire.post(`/sessions/${this.sessionUid}/duplicate_tracks`, payload);
      const tracks = this.client.sessions.items.member(this.sessionUid).tracks;
      await settle(() => tracks.byId(uid) !== void 0, "duplicate track", {
        path: `/sessions/${this.sessionUid}/tracks`,
        ...options.timeoutMs !== void 0 ? { timeoutMs: options.timeoutMs } : {},
        refresh: () => tracks.reload(),
        flush: () => this.client.store.scheduler.flush()
      });
      await tracks.membersReady();
      await this.client.settled();
      return tracks.byId(uid);
    }
  };
  function newChannelUid() {
    return globalThis.crypto.randomUUID().replaceAll("-", "");
  }

  // src/model/bus.ts
  var Bus = class extends Channel {
    busType;
    folderMode;
    /** The uid of the track preset last applied to this bus, or null (fact 169). */
    presetUid;
    /** That preset's name, or null. */
    presetName;
    /** @internal */
    constructor(client, path, sessionUid) {
      super(client, path, sessionUid);
      this.busType = this.prop("bus_type");
      this.folderMode = this.prop("folder_mode");
      this.presetUid = this.prop("preset_uid");
      this.presetName = this.prop("preset_name");
    }
    get isMaster() {
      return this.busType.value === "master";
    }
    /** A folder is an aux bus whose folder mode is not `none`. */
    get isFolder() {
      const m = this.folderMode.value;
      return m !== void 0 && m !== "none";
    }
    /**
     * Change this aux bus's {@link FolderMode} in one undo step, and resolve once
     * {@link folderMode} shows it (fact 136). LUNA reroutes the main output of everything inside
     * it: into a `'summing'` folder, past a `'container'` one. `'none'` makes it an ordinary bus
     * and moves what was directly inside it to the session root.
     *
     * @throws {UAError} `uasrv.invalid_value` for a bus that is not an aux bus.
     * @example
     * const drums = await session.newFolder({ name: 'Drums', mode: 'container' });
     * await drums.setFolderMode('summing'); // its tracks now play through it
     */
    async setFolderMode(mode) {
      if (mode !== "none" && mode !== "summing" && mode !== "container") throw new UAError("out_of_range", `setFolderMode(): unknown mode ${String(mode)}`, { path: this.path });
      const sessionPath = `/sessions/${this.sessionUid}`;
      await this.wire.post(`${sessionPath}/buses/set_folder_mode`, { session_uid: this.sessionUid, bus_uid: this.id, folder_mode: mode });
      await settle(() => this.folderMode.value === mode, "set folder mode", {
        path: this.path,
        refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    /**
     * Delete this bus in one undo step (`delete_bus`), and resolve once it has left
     * `session.buses` (fact 168). A folder's contents stay where they were, now outside it; use
     * {@link deleteWithContents} to take them too. Sends and outputs that fed the bus are kept,
     * marked `device.missing_bus` (fact 83).
     *
     * @throws {UAError} `device.database_error` for the master bus, `uasrv.invalid_type` for a
     * cue bus or one LUNA does not know.
     * @example
     * const fx = await session.newBus({ name: 'Scratch FX' });
     * await fx.delete();
     */
    async delete() {
      this.assertLive();
      const sessionPath = `/sessions/${this.sessionUid}`;
      await this.wire.post(`${sessionPath}/delete_bus`, { session_uid: this.sessionUid, bus_uid: this.id });
      await this.settleGone([this.id], "delete bus");
    }
    /**
     * Delete this folder and everything inside it, nested folders included, in one undo step
     * (`buses/delete_folder_with_contents`), and resolve once all of it has left the session
     * (fact 168).
     *
     * @throws {UAError} `uasrv.invalid_value` when this bus is not a folder (or LUNA does not
     * know it).
     * @example
     * const drums = session.folders.find((f) => f.name.value === 'Drums');
     * await drums?.deleteWithContents();
     */
    async deleteWithContents() {
      this.assertLive();
      const session = this.client.sessions.items.member(this.sessionUid);
      const doomed = [this.id];
      for (let i = 0; i < doomed.length; i++) {
        for (const ch of [...session.tracks.items, ...session.buses.items]) if (ch.folderUid.value === doomed[i] && !doomed.includes(ch.id)) doomed.push(ch.id);
      }
      await this.wire.post(`/sessions/${this.sessionUid}/buses/delete_folder_with_contents`, { session_uid: this.sessionUid, bus_uid: this.id });
      await this.settleGone(doomed, "delete folder");
    }
    /**
     * Apply a track preset to this bus in one undo step, as LUNA's bus header PRESETS > Assign
     * does: `/presets/devices/track/load` with `is_bus` (fact 169). The preset's plugins, sends
     * and mixer settings replace the bus's; {@link presetUid} follows. A plugin's preset is
     * refused on a bus (`uasrv.invalid_type`).
     *
     * @example
     * const [row] = await luna.presets.query({ deviceTypeId: 'track', tags: ['Bus'] });
     * await bus.loadPreset(row);
     */
    async loadPreset(preset) {
      const uid = typeof preset === "string" ? preset : preset.uid;
      await this.wire.post("/presets/devices/track/load", { session_uid: this.sessionUid, uid: this.id, preset_uid: uid, is_bus: true });
    }
    /** Resolve once none of `ids` is listed as a track or bus of the session. */
    async settleGone(ids, what) {
      const session = this.client.sessions.items.member(this.sessionUid);
      await settle(() => ids.every((id) => session.tracks.byId(id) === void 0 && session.buses.byId(id) === void 0), what, {
        path: `/sessions/${this.sessionUid}/buses`,
        refresh: () => Promise.all([session.tracks.reload(), session.buses.reload()]).then(() => void 0),
        flush: () => this.client.store.scheduler.flush()
      });
    }
  };

  // src/model/transport.ts
  var Transport = class extends Node {
    /** @internal */
    constructor(client, sessionPath, musical) {
      super(client, sessionPath);
      this.musical = musical;
      this.playing = this.writableProp("playing");
      this.recordEnabled = this.writableProp("record_enabled");
      this.looping = this.writableProp("looping");
      this.playStart = this.writableProp("play_start");
      this.loopStart = this.writableProp("loop_start");
      this.loopStop = this.writableProp("loop_stop");
      this.arrangementStart = this.writableProp("arrangement_start");
      this.location = this.prop("location");
      this.tempo = derived([this.location], () => this.location.value?.tempo, { distinct: true });
      this.timeSignature = derived([this.location], () => this.location.value?.time_signature, { distinct: true });
      this.countingIn = this.prop("counting_in");
      this.punchedIn = this.prop("punched_in");
      this.maxTick = this.prop("max_tick");
      this.tempoPercent = this.writableProp("tempo_percent");
      this.enableTempoPercent = this.writableProp("enable_tempo_percent");
      this.recPlayMode = this.prop("rec_play_mode");
      this.countInEnabled = this.writableProp("count_in_enabled");
      this.preRollEnabled = this.writableProp("pre_roll_enabled");
      this.postRollEnabled = this.writableProp("post_roll_enabled");
      this.preRoll = this.writableProp("pre_roll");
      this.postRoll = this.writableProp("post_roll");
      this.clickDuringPlay = this.writableProp("click_during_play");
      this.clickDuringRecord = this.writableProp("click_during_record");
      this.clickDuringCountIn = this.writableProp("click_during_count_in");
      this.mergeMidi = this.writableProp("merge_midi");
    }
    musical;
    playing;
    recordEnabled;
    looping;
    /** Where playback starts (ticks); also the resting playhead when stopped. */
    playStart;
    loopStart;
    loopStop;
    /** Where {@link returnToZero} goes (ticks). LUNA reads it as 0 until it is set (fact 89). */
    arrangementStart;
    /** Live playhead, pushed many times per second while playing. */
    location;
    /**
     * Tempo in effect at the playhead (BPM), carved out of the `location` pushes (fact 95: a
     * tempo edit shows here at once). Notifies only when the number moves, so a BPM display is
     * not re-rendered on every playhead push. It follows the playhead only: to recompute
     * anything planned from the tempo map (clip lengths, seconds) when the tempo is edited, use
     * `session.musical.timeline.onChange` and `session.musical.tempoAt(tick)`.
     *
     * @example
     * t.tempo.onChange(() => bpm.textContent = `${t.tempo.value ?? '--'} BPM`);
     */
    tempo;
    /**
     * Time signature in effect at the playhead, carved out of the `location` pushes. Notifies
     * only when it changes. Format with `Luna.formatTimeSignature`.
     *
     * @example
     * t.timeSignature.onChange(() => meter.textContent = Luna.formatTimeSignature(t.timeSignature.value));
     */
    timeSignature;
    countingIn;
    punchedIn;
    maxTick;
    /**
     * Playback speed as a percentage of the tempo map (100 is as written), applied only while
     * {@link enableTempoPercent} is on. Not undoable. LUNA publishes both only when its
     * tempo-percent feature is enabled; elsewhere they stay `undefined` (fact 155).
     *
     * @example
     * await t.tempoPercent.set(80);
     * await t.enableTempoPercent.set(true);   // practice at 80%
     */
    tempoPercent;
    /** Whether {@link tempoPercent} applies (fact 155). @example await t.enableTempoPercent.set(false); */
    enableTempoPercent;
    recPlayMode;
    countInEnabled;
    preRollEnabled;
    postRollEnabled;
    /**
     * How long the pre-roll is, as LUNA stores it: a `"bars,beats,ticks"` duration string
     * (`"1,0,0"` is one bar, `"0,2,0"` two beats; ticks are engine ticks). Read and write it with
     * `Luna.parseRollDuration` and `Luna.formatRollDuration`. Used while
     * {@link preRollEnabled} is on (fact 156).
     *
     * @example await t.preRoll.set(Luna.formatRollDuration({ bars: 2 }));
     */
    preRoll;
    /** How long the post-roll is, in the same form as {@link preRoll} (fact 156). @example await t.postRoll.set('1,0,0'); */
    postRoll;
    /** Whether the click sounds during playback (fact 155). @example await t.clickDuringPlay.set(false); */
    clickDuringPlay;
    /** Whether the click sounds while recording (fact 155). @example await t.clickDuringRecord.set(true); */
    clickDuringRecord;
    /** Whether the click sounds during the count-in (fact 155). @example await t.clickDuringCountIn.set(true); */
    clickDuringCountIn;
    /**
     * Whether MIDI recorded over an existing MIDI clip merges into it (on) or makes a new take
     * (off) (fact 155).
     *
     * @example await t.mergeMidi.set(true);
     */
    mergeMidi;
    /** Current playhead in ticks: the live location while playing, else the play start. */
    get tick() {
      return this.location.value?.tick ?? this.playStart.value ?? 0;
    }
    /**
     * Current playhead in wall-clock seconds: {@link tick} converted through the session's
     * tempo map (`session.musical.timeline.seconds`), so tempo changes are honoured. Like
     * {@link tick}, it is the live location while playing and the play start when stopped.
     *
     * The tempo map loads with the session (`session.ready()`, which `luna.session()` awaits),
     * so it is safe to read on any session obtained normally. Read before that, it throws
     * `unavailable` rather than converting at a guessed tempo.
     *
     * @example
     * el.textContent = Luna.formatMinSec(t.seconds, { fraction: 1 });
     */
    get seconds() {
      if (!this.musical) throw new UAError("unavailable", "transport.seconds: this transport has no timeline", { path: this.path });
      const musical = this.musical();
      if (!musical.timeline.tempoLoaded) {
        throw new UAError("unavailable", "transport.seconds: the tempo map is not loaded; await session.ready() (or session.musical.ready()) first", { path: this.path });
      }
      return musical.timeline.seconds(this.tick);
    }
    play() {
      return this.playing.set(true);
    }
    stop() {
      return this.playing.set(false);
    }
    toggle() {
      return this.playing.set(!(this.playing.value ?? false));
    }
    /** Arm and start recording. */
    async record() {
      await this.recordEnabled.set(true);
      if (!this.playing.value) await this.play();
    }
    /**
     * LUNA's record toggle (fact 80): flip the session's `record_enabled`, and start playback
     * when that turned record on while stopped. Turning record off leaves playback running.
     */
    async toggleRecord() {
      const on = !(this.recordEnabled.value ?? false);
      await this.recordEnabled.set(on);
      if (on && !this.playing.value) await this.play();
    }
    /**
     * Move the playhead the way LUNA's own locate does (fact 89): the play start and both loop
     * points go to the target, so a drawn loop range is replaced by an empty one. Resolves once
     * LUNA shows the move; while playing, the playhead jumps as `options.sync` says.
     *
     * Tick 0 is not necessarily bar 1: a session with bars before bar 1 starts its timeline
     * earlier (fact 91). Seek to `{ bar: 1 }` for the downbeat of bar 1.
     *
     * @example
     * await t.seek({ bar: 1 });                    // the downbeat of bar 1, wherever it is
     * await t.seek({ bar: 9, beat: 3 });
     * await t.seek(Luna.WHOLE_NOTE * 4);           // a raw tick
     * await t.seek({ bar: 17 }, { sync: 'next_bar' });
     */
    async seek(to, options = {}) {
      const tick = requireTick(await this.resolve(to), "seek target");
      await Promise.all([this.playStart.set(tick), this.loopStart.set(tick), this.loopStop.set(tick)]);
      await this.confirmPlayStart(tick, "seek", options);
    }
    /**
     * Move the play start alone, leaving the loop range where it is: {@link seek} without
     * collapsing the loop marks. Resolves once LUNA shows the move (fact 90): stopped, the
     * playhead rests there; while playing, the playhead jumps as `options.sync` says.
     * Writing `playStart.set(tick)` instead only records the start, and while playing the
     * playhead carries on until a `sync`.
     *
     * @example
     * await t.setLoop(Luna.WHOLE_NOTE * 4, Luna.WHOLE_NOTE * 8);
     * await t.setPlayStart({ bar: 3 });               // start before the loop; the loop stays
     * await t.setPlayStart({ bar: 5 }, { sync: 'next_bar' });
     */
    async setPlayStart(to, options = {}) {
      const tick = requireTick(await this.resolve(to), "play start");
      await this.playStart.set(tick);
      await this.confirmPlayStart(tick, "setPlayStart", options);
    }
    async confirmPlayStart(tick, what, options) {
      if (this.playing.value === true) {
        const at = options.sync ?? "now";
        await this.sync(at);
        await this.reread(["play_start", "loop_start", "loop_stop", "playing"]);
        if (this.playStart.value !== tick) throw new UAError("no_effect", `${what}: play start reads ${String(this.playStart.value)}, not ${tick}`, { path: this.path });
        return;
      }
      await settle(() => this.location.value?.tick === tick, what, {
        path: this.path,
        refresh: () => this.reread(["play_start", "location", "playing"]),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    /**
     * LUNA's Return To Zero (fact 89): {@link seek} to the arrangement start. That is tick 0
     * until the session sets one, and tick 0 need not be bar 1 (fact 91); for bar 1 use
     * `seek({ bar: 1 })`. Unlike LUNA's button it leaves the edit selection alone.
     *
     * @example
     * await session.transport.returnToZero();
     */
    async returnToZero(options = {}) {
      await this.reread(["arrangement_start", "playing"]);
      await this.seek(this.arrangementStart.value ?? 0, options);
    }
    async resolve(to) {
      if (typeof to === "number") return to;
      if (!this.musical) throw new UAError("unavailable", "seek: this transport has no timeline for bar positions", { path: this.path });
      const musical = this.musical();
      await musical.ready();
      return musical.timeline.tickAt(to);
    }
    reread(propfilter) {
      return this.client.store.load(this.path, { children: false, commands: false, propfilter });
    }
    async setLoop(startTick, stopTick) {
      await Promise.all([this.loopStart.set(startTick), this.loopStop.set(stopTick)]);
    }
    /** Restart playback, optionally quantised to the next bar or loop end. */
    sync(at = "now") {
      return this.post("sync_playback", { session_uid: this.id, next_bar: at === "next_bar", loop_end: at === "loop_end" }).then(() => void 0);
    }
  };

  // src/model/midi-operations.ts
  function integer(value, min, max, what) {
    if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
      throw new UAError("out_of_range", `midiOperation(): ${what} must be an integer ${min}${max === Infinity ? " or more" : `-${max}`}`);
    }
    return value;
  }
  function midiOperationPayload(op) {
    const wire = (operation, value = 0, valueStr = "") => ({ operation, value, value_str: valueStr });
    switch (op?.type) {
      case "velocity":
        return wire("velocity", integer(op.value, 1, 127, "value"));
      case "velocityPercent":
        return wire("velocity_percent", integer(op.percent, 1, 200, "percent"));
      case "duration": {
        const bars = integer(op.bars ?? 0, 0, Infinity, "bars");
        const beats = integer(op.beats ?? 0, 0, Infinity, "beats");
        const ticks = integer(op.ticks ?? 0, 0, TICKS_PER_BEAT - 1, "ticks");
        if (ticks % TICKS_PER_DISPLAY_TICK !== 0) throw new UAError("out_of_range", "midiOperation(): duration ticks must be whole display ticks (multiples of Luna.TICKS_PER_DISPLAY_TICK)");
        if (bars === 0 && beats === 0 && ticks === 0) throw new UAError("out_of_range", "midiOperation(): a duration needs a length");
        return wire("duration", 0, `${bars}|${beats}|${ticks / TICKS_PER_DISPLAY_TICK}`);
      }
      case "durationPercent":
        return wire("duration_percent", integer(op.percent, 1, Infinity, "percent"));
      case "durationScale": {
        const num2 = integer(op.numerator, 1, Infinity, "numerator");
        const den = integer(op.denominator, 1, Infinity, "denominator");
        return wire("duration_percent", Math.max(1, Math.round(100 * num2 / den)), `${num2}/${den}`);
      }
      case "legato":
        return wire("legato");
      case "staccato":
        return wire("staccato");
      case "reverse":
        return wire("reverse_time");
      case "transpose":
        return wire("transpose", integer(op.semitones, -24, 24, "semitones"));
      case "invert": {
        const around = op.around ?? "range";
        const name = { range: "invert_notes", first: "invert_notes_first", root: "invert_notes_root" }[around];
        if (!name) throw new UAError("out_of_range", "midiOperation(): invert's around must be 'range', 'first' or 'root'");
        const out = wire(name);
        if (op.scale !== void 0) {
          const root = integer(op.scale.root, 0, 11, "scale.root");
          const mask = integer(op.scale.mask, 1, 4095, "scale.mask");
          if ((mask & 1 << root) === 0) throw new UAError("out_of_range", "midiOperation(): scale.mask must include scale.root");
          out["scale_root"] = root;
          out["scale_mask"] = mask;
        } else if (around === "root") {
          throw new UAError("out_of_range", "midiOperation(): invert around 'root' needs a scale");
        }
        return out;
      }
      default:
        throw new UAError("out_of_range", `midiOperation(): unknown operation ${JSON.stringify(op?.type)}`);
    }
  }

  // src/model/context.ts
  var SELECTION_PROPS = ["focus", "selection_start", "selection_stop", "selection_notes", "selection_playlists", "selection_tracks"];
  function selectedNotes(value) {
    if (!Array.isArray(value)) return Object.freeze([]);
    const out = [];
    for (const entry of value) {
      if (typeof entry !== "object" || entry === null) continue;
      const e = entry;
      if (typeof e.playlist_uid !== "string" || !Array.isArray(e.notes)) continue;
      const notes = e.notes.filter((n) => Array.isArray(n) && n.length === 4 && n.every((v) => typeof v === "number")).map((n) => Object.freeze([n[0], n[1], n[2], n[3]]));
      out.push(Object.freeze({ playlist_uid: e.playlist_uid, notes: Object.freeze(notes) }));
    }
    return Object.freeze(out);
  }
  var Context = class extends Node {
    /** @internal */
    constructor(client, path, sessionUid) {
      super(client, path);
      this.sessionUid = sessionUid;
      this.contextType = this.prop("context_type");
      this.selectionStart = this.writableProp("selection_start");
      this.selectionStop = this.writableProp("selection_stop");
      this.selectionTracks = this.writableProp("selection_tracks");
      this.selectionPlaylists = this.writableProp("selection_playlists");
      this.selectionNotes = this.writableProp("selection_notes");
      this.lastSelectedTrack = this.writableProp("last_selected_track");
      this.collapsedFolders = this.writableProp("collapsed_folders");
      this.pinnedTracks = this.prop("pinned_tracks");
      this.hiddenTracks = this.prop("hidden_tracks");
      this.pixelsPerTick = this.writableProp("pixels_per_tick");
      this.timelineViewStartTick = this.writableProp("timeline_view_start_tick");
      this.gridEnable = this.writableProp("grid_enable");
      this.grid = this.writableProp("grid");
      this.linkEditAndPlay = this.writableProp("link_edit_and_play");
      this.focus = this.prop("focus");
      this.settings = this.prop("settings");
      const settings = this.settings;
      this.waveformZoom = derived([settings], () => waveformZoomFrom(settings.value));
    }
    sessionUid;
    contextType;
    /** Selection range in ticks; `null` when nothing is selected. */
    selectionStart;
    selectionStop;
    selectionTracks;
    selectionPlaylists;
    /**
     * Selected notes per playlist, in absolute ticks. The selection-based MIDI verbs
     * (`mute_notes`, `clear`, `change_velocity`) act on this, not on a clip (fact 74).
     */
    selectionNotes;
    /** The focused track, distinct from the selected set. */
    lastSelectedTrack;
    collapsedFolders;
    pinnedTracks;
    hiddenTracks;
    /** Zoom. */
    pixelsPerTick;
    /**
     * The tick at the left edge of this window's timeline view, with {@link pixelsPerTick} the
     * horizontal scroll (fact 159). Stored with the session, not undoable; `undefined` until
     * something has set it. A page that draws its own timeline can share its scroll through it.
     *
     * @example
     * const x = (tick: number) => (tick - (ctx.timelineViewStartTick.value ?? 0)) * ctx.pixelsPerTick.value!;
     * await ctx.timelineViewStartTick.set(Luna.WHOLE_NOTE * 8);
     */
    timelineViewStartTick;
    gridEnable;
    /** Grid size such as `1_4`, `1_8`, `bar`. */
    grid;
    linkEditAndPlay;
    focus;
    /** The window's saved settings, a JSON string LUNA writes on a delayed save. */
    settings;
    /**
     * LUNA's waveform zoom for this window: the amplitude multiplier its timeline draws audio
     * with, 1 by default, doubled or halved by Zoom In/Out Waveform and bounded 1/8..256. Pass
     * it with the clip gain to {@link waveformColumns} to draw at LUNA's height. It is read from
     * {@link settings}, which LUNA saves some time after a change rather than at once (fact 94).
     *
     * @example
     * const gain = session.context.waveformZoom.value * 10 ** ((clip.gain.value ?? 0) / 20);
     */
    waveformZoom;
    /**
     * Set range, tracks, playlists and/or focus in one go; omitted parts are left alone. `focus`
     * is what LUNA's selection commands act on: `timeline` for clips (fact 117).
     *
     * @example
     * await ctx.select({ startTick: 0, stopTick: Luna.WHOLE_NOTE, playlistUids: [lane.id], focus: 'timeline' });
     */
    async select(options) {
      const writes = [];
      if (options.focus !== void 0) writes.push(this.client.store.set(this.path, "focus", options.focus));
      if (options.startTick !== void 0) writes.push(this.selectionStart.set(options.startTick));
      if (options.stopTick !== void 0) writes.push(this.selectionStop.set(options.stopTick));
      if (options.trackUids !== void 0) writes.push(this.selectionTracks.set(options.trackUids));
      if (options.playlistUids !== void 0) writes.push(this.client.store.set(this.path, "selection_playlists", options.playlistUids));
      await Promise.all(writes);
      if (writes.length) await this.wire.get(this.path, { children: false, commands: false, flatvalue: true, propfilter: ["focus", "selection_start", "selection_stop", "selection_tracks", "selection_playlists"] });
    }
    /** The selected notes, decoded. Empty when nothing is selected. */
    get notes() {
      return selectedNotes(this.selectionNotes.value);
    }
    /**
     * The six selection properties as LUNA holds them now. A wrapper that has to move the
     * user's selection to do its work takes one of these first and {@link restore}s it after,
     * so the page never disturbs what the user had selected.
     *
     * @example
     * const saved = ctx.snapshot();
     * try { await ctx.selectNotes(playlistUid, rows); await ctx.run('mute_notes'); }
     * finally { await ctx.restore(saved); }
     */
    snapshot() {
      const read = (p) => this.client.store.cell(this.path, p).value;
      return Object.freeze({
        focus: read("focus"),
        selection_start: read("selection_start"),
        selection_stop: read("selection_stop"),
        selection_notes: read("selection_notes"),
        selection_playlists: read("selection_playlists"),
        selection_tracks: read("selection_tracks")
      });
    }
    /** Write a snapshot back. No undo entry; LUNA echoes each property. */
    async restore(snapshot) {
      const record = snapshot;
      if (!SELECTION_PROPS.some((p) => record[p] !== void 0)) {
        throw new UAError("out_of_range", `restore(): expected a snapshot() value (keys ${SELECTION_PROPS.join(", ")})`, { path: this.path });
      }
      for (const p of SELECTION_PROPS) {
        const value = record[p];
        if (value === void 0) continue;
        await this.client.store.set(this.path, p, value);
      }
    }
    /**
     * Select exactly these notes on one playlist, with the range and focus to match. Ticks are
     * absolute, as LUNA stores them: `[pitch, start, stop, rowid]`.
     */
    async selectNotes(playlistUid, notes) {
      await this.client.store.set(this.path, "focus", "notes");
      await this.client.store.set(this.path, "selection_playlists", [playlistUid]);
      if (notes.length) {
        await this.client.store.set(this.path, "selection_start", Math.min(...notes.map((n) => n[1])));
        await this.client.store.set(this.path, "selection_stop", Math.max(...notes.map((n) => n[2])));
      }
      await this.client.store.set(this.path, "selection_notes", [{ playlist_uid: playlistUid, notes: notes.map((n) => [...n]) }]);
    }
    /** Re-read the six selection properties (they also arrive as events). */
    refreshSelection() {
      return this.client.store.load(this.path, { children: false, commands: false, propfilter: [...SELECTION_PROPS] });
    }
    /** Run one of the context's edit commands (`copy`, `paste`, `duplicate`, `select_all`, ...). */
    /** A context's commands live under its `commands` node. */
    commandPath(command) {
      return `${this.path}/commands/${command}`;
    }
    run(command, payload = {}) {
      return this.wire.post(`${this.path}/commands/${command}`, { session_uid: this.sessionUid, ...payload });
    }
    /**
     * Widen the selected range to everything on the selected tracks' playlists (clips, notes,
     * automation), keeping the tracks (fact 150). No undo entry.
     *
     * @example
     * await session.selectTimeline({ tracks: [track] });
     * await session.context.selectAll();
     */
    selectAll() {
      return this.run("select_all");
    }
    copy() {
      return this.run("copy");
    }
    cut() {
      return this.run("cut");
    }
    paste() {
      return this.run("paste");
    }
    duplicate() {
      return this.run("duplicate");
    }
    /** Delete the selected content. */
    clear() {
      return this.run("clear");
    }
    /** Move the selection by `ticks` (negative moves earlier). */
    nudge(ticks) {
      return this.run("nudge", { ticks });
    }
    separateClips() {
      return this.run("separate_clips");
    }
    consolidate() {
      return this.run("consolidate");
    }
    muteClips() {
      return this.run("mute_clips");
    }
    /**
     * Write an absolute value per control over `[start, stop)`, or over this context's selection
     * when the range is left out (`write_control_values`, fact 227). One undo step for all of
     * them. Resolves on LUNA's reply, which comes after the write; the lanes update by push.
     * An unknown control uid rejects with `device.database_error`.
     *
     * @example
     * await session.context.writeControlValues(
     *   [{ control: vocal.gain, value: -12 }, { control: guitar.gain, value: -9 }],
     *   { start: 0, stop: Luna.WHOLE_NOTE * 2 },
     * );
     */
    async writeControlValues(controls, range = {}) {
      await postControlValues(this.client, this.sessionUid, "write_control_values", controls, range, this.id);
    }
    /**
     * Add a delta per control over `[start, stop)`, or over this context's selection when the
     * range is left out (`trim_control_values`, fact 227). One undo step for all of them.
     * Resolves on LUNA's reply; the lanes update by push.
     *
     * @example
     * await session.context.trimControlValues([{ control: vocal.gain, value: 3 }], { start: 0, stop: Luna.WHOLE_NOTE });
     */
    async trimControlValues(controls, range = {}) {
      await postControlValues(this.client, this.sessionUid, "trim_control_values", controls, range, this.id);
    }
    /**
     * Apply one of LUNA's MIDI operations to what this context selects (fact 158): the selected
     * notes with focus `notes`, the MIDI on the selected tracks in the range with `timeline`.
     * One undo entry. Resolves when LUNA answers; the edits arrive as MIDI table changes and
     * the selected notes follow. With nothing to act on LUNA changes nothing and answers
     * success. Rejects with `out_of_range` before sending for a value outside LUNA's range.
     *
     * @example
     * await ctx.selectNotes(playlist.id, rows);
     * await ctx.midiOperation({ type: 'transpose', semitones: -12 });
     * await ctx.midiOperation({ type: 'duration', beats: 1 });
     * await ctx.midiOperation({ type: 'invert', around: 'root', scale: { root: 0, mask: 0b101010110101 } });
     */
    async midiOperation(op) {
      const midi_operation = midiOperationPayload(op);
      await this.run("midi_operation", { midi_operation });
    }
  };
  function waveformZoomFrom(settings) {
    if (typeof settings !== "string" || !settings) return 1;
    try {
      const zoom = JSON.parse(settings).auido_waveform_zoom;
      return typeof zoom === "number" && Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
    } catch {
      return 1;
    }
  }

  // src/model/warps.ts
  var WARP_TRANSIENT_ZONE_NS = 3e7;
  var Warp = class extends Node {
    /** Clip-relative position, ticks. */
    start;
    /** Offset into the source file, nanoseconds. */
    sourceStart;
    /** Where LUNA first put the marker, ticks. */
    startOriginal;
    /** Where in the source LUNA first put the marker, nanoseconds. */
    sourceStartOriginal;
    /** `user` or `engine`, from the wire's 0 or 1. */
    type;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.start = this.prop("start");
      this.sourceStart = this.prop("source_start");
      this.startOriginal = this.prop("start_original");
      this.sourceStartOriginal = this.prop("source_start_original");
      const raw = this.prop("warp_type");
      this.type = derived([raw], () => raw.value === 0 ? "user" : raw.value === 1 ? "engine" : void 0);
    }
    /** The row id, from the node name. */
    get rowid() {
      return Number(this.id);
    }
  };
  var Warps = class extends Collection {
    /** @internal */
    constructor(client, clipPath, sessionUid) {
      super(client, `${clipPath}/warps`, (p) => new Warp(client, p), { levels: 2, commands: false, flatvalue: true });
      this.clipPath = clipPath;
      this.sessionUid = sessionUid;
    }
    clipPath;
    sessionUid;
    get clipUid() {
      return this.clipPath.slice(this.clipPath.lastIndexOf("/") + 1);
    }
    get playlistUid() {
      return this.clipPath.split("/")[4] ?? "";
    }
    /**
     * The markers as plain data, sorted by `start`; ones whose properties have not loaded are
     * left out.
     *
     * @example
     * for (const w of clip.warps.markers) drawMarker(clip.start.value! + w.start);
     */
    get markers() {
      return this.items.filter((w) => typeof w.start.value === "number" && typeof w.sourceStart.value === "number").map((w) => ({ rowid: w.rowid, start: w.start.value, sourceStart: w.sourceStart.value, type: w.type.value })).sort((a, b) => a.start - b.start);
    }
    post(command, payload) {
      return this.client.raw.post(`/sessions/${this.sessionUid}/${command}`, { session_uid: this.sessionUid, clip_uid: this.clipUid, ...payload });
    }
    settled(done, what) {
      return settle(done, what, { path: this.path, refresh: () => this.reload() });
    }
    /**
     * Add a marker pinning clip tick `start` to `sourceStart` ns, or with `rowid` move that
     * marker there (`set_warp`, fact 230); the marker becomes a `user` one. Where an existing
     * marker's source point is within {@link WARP_TRANSIENT_ZONE_NS} of `sourceStart`, LUNA
     * keeps that marker and adds none. Two markers at one tick or one source point are refused
     * (`uasrv.invalid_object`). One undo step. Resolves to the marker once the list shows it.
     *
     * @example
     * const w = await clip.warps.set({ start: Luna.QUARTER_NOTE, sourceStart: 600_000_000 });
     * await clip.warps.set({ rowid: w.rowid, start: Luna.QUARTER_NOTE * 2, sourceStart: 600_000_000 });
     */
    async set(options) {
      const start = requireTick(options.start, "start");
      const sourceStart = requireTick(options.sourceStart, "sourceStart");
      const move = options.move === void 0 ? 0 : requireTick(options.move, "move");
      const payload = { playlist_uid: this.playlistUid, start, source_start: sourceStart, context_type: options.contextType ?? "main" };
      if (options.rowid !== void 0) payload["rowid"] = options.rowid;
      if (options.move !== void 0) payload["move"] = move;
      await this.post("set_warp", payload);
      const at = start + move;
      const found = () => {
        const ms = this.markers;
        if (options.rowid !== void 0) return ms.find((m) => m.rowid === options.rowid && m.start === at && m.sourceStart === sourceStart);
        return ms.find((m) => m.start === at && m.sourceStart === sourceStart) ?? ms.find((m) => Math.abs(m.sourceStart - sourceStart) <= WARP_TRANSIENT_ZONE_NS);
      };
      await this.settled(() => found() !== void 0, "set warp");
      return found();
    }
    /**
     * Delete the marker at clip tick `start`, or with `stop` every marker strictly between the
     * two: LUNA leaves markers at `start` and at `stop` alone (`delete_warp`, fact 231). One undo
     * step. Resolves once they are gone.
     *
     * @example
     * await clip.warps.delete(Luna.QUARTER_NOTE);
     * await clip.warps.delete(0, Luna.WHOLE_NOTE); // the ones inside, not at 0 or the bar
     */
    async delete(start, stop) {
      const payload = { start: requireTick(start, "start"), context_type: "main" };
      if (stop !== void 0) payload["stop"] = requireTick(stop, "stop");
      await this.post("delete_warp", payload);
      const gone = (m) => stop === void 0 ? m.start !== start : m.start <= start || m.start >= stop;
      await this.settled(() => this.markers.every(gone), "delete warp");
    }
    /**
     * Remove the clip's time stretch (`remove_tce`, fact 231): every marker goes and LUNA sets
     * the clip's `stop` so it plays its source span at the session tempo. One undo step. An
     * audio clip only: LUNA refuses others with `uasrv.invalid_object`. Resolves once the
     * markers are gone; the clip's new `stop` arrives by push.
     *
     * @example
     * await clip.warps.removeTimeStretch();
     */
    async removeTimeStretch() {
      await this.post("remove_tce", { context_type: "main" });
      await this.settled(() => this.items.length === 0, "remove time stretch");
    }
  };

  // src/model/midi.ts
  function decodeMidiData(packed) {
    return { status: packed >>> 16 & 255, data1: packed >>> 8 & 127, data2: packed & 127 };
  }
  function encodeMidiData(status, data1, data2 = 0) {
    return (status & 255) << 16 | (data1 & 127) << 8 | data2 & 127;
  }
  function isRowData(v) {
    return typeof v === "object" && v !== null && Array.isArray(v.row_ids) && typeof v.operation === "string";
  }
  function rowsOf(data, origin) {
    const out = [];
    data.row_ids.forEach((rowid, i) => {
      const packed = data.midi_data?.[i];
      const tick = data.tick?.[i];
      if (typeof rowid !== "number" || typeof packed !== "number" || typeof tick !== "number") return;
      const { status, data1, data2 } = decodeMidiData(packed);
      const sysex = data.sysex?.[i];
      const row = { rowid, tick: tick - origin, status, channel: status & 15, data1, data2, enabled: data.enabled?.[i] !== false };
      out.push(Object.freeze(status === 240 && Array.isArray(sysex) ? { ...row, sysex: Object.freeze([...sysex]) } : row));
    });
    return out;
  }
  var byTick = (a, b) => a.tick - b.tick || a.rowid - b.rowid;
  var isNoteOn = (e) => (e.status & 240) === 144 && e.data2 > 0;
  var isNoteOff = (e) => (e.status & 240) === 128 || (e.status & 240) === 144 && e.data2 === 0;
  function pairNotes(rows) {
    const open = /* @__PURE__ */ new Map();
    const notes = [];
    for (const e of [...rows].sort(byTick)) {
      const key = `${e.channel}:${e.data1}`;
      if (isNoteOn(e)) {
        const list = open.get(key) ?? [];
        list.push(e);
        open.set(key, list);
      } else if (isNoteOff(e)) {
        const on = open.get(key)?.shift();
        if (!on) continue;
        notes.push(Object.freeze({ rowid: on.rowid, offRowid: e.rowid, pitch: on.data1, channel: on.channel, startTick: on.tick, stopTick: e.tick, velocity: on.data2, offVelocity: e.data2, muted: !on.enabled }));
      }
    }
    for (const list of open.values()) {
      for (const on of list) notes.push(Object.freeze({ rowid: on.rowid, offRowid: void 0, pitch: on.data1, channel: on.channel, startTick: on.tick, stopTick: void 0, velocity: on.data2, offVelocity: void 0, muted: !on.enabled }));
    }
    return notes.sort((a, b) => a.startTick - b.startTick || a.rowid - b.rowid);
  }
  function hostFromPath(clipPath) {
    const parts = clipPath.split("/");
    const sessionUid = parts[2] ?? "";
    return {
      sessionPath: `/sessions/${sessionUid}`,
      sessionUid,
      playlistUid: parts[4] ?? "",
      clipUid: parts[6] ?? "",
      startTick: () => void 0
    };
  }
  var MidiClip = class extends Node {
    /** @internal Created by {@link Clip.midi}. */
    constructor(client, clipPath, origin, host) {
      super(client, `${clipPath}/midi/table`);
      this.origin = origin;
      this.host = host ?? hostFromPath(clipPath);
      this.eventsCell = new Cell(client.store.scheduler, []);
      this.notesCell = new Cell(client.store.scheduler, []);
      this.events = listOf(this.eventsCell, (row) => String(row.rowid));
      this.notes = listOf(this.notesCell, (note) => String(note.rowid));
    }
    origin;
    /** Every row, in tick order. `byId` takes a row id. */
    events;
    /** Paired notes, in start order. `byId` takes a note-on row id. */
    notes;
    rows = /* @__PURE__ */ new Map();
    eventsCell;
    notesCell;
    releases = [];
    /** Deltas applied since the last whole table, stamped so a re-read can discard older ones. */
    deltas = [];
    /**
     * The last whole table and the version it arrived at. Kept here rather than read back
     * from the cell, because the cell also receives the deltas (the store applies every push
     * to it), so its value is not necessarily a whole table.
     */
    table = { operation: "update", row_ids: [] };
    tableVersion = 0;
    readyPromise;
    /** The clip this table belongs to, and how to reach its session's edit context. */
    host;
    contextView;
    /** The table tick that sits at the clip's start (fact 41). */
    get shift() {
      return this.origin.value ?? 0;
    }
    /**
     * Read the table and start following edits. Idempotent, like `Node.load`.
     *
     * @example
     * await clip.midi.ready();
     */
    ready() {
      this.readyPromise ??= this.seed();
      return this.readyPromise;
    }
    async seed() {
      const cell = this.client.store.cell(this.path, "row_data");
      this.releases.push(this.client.store.onEvent((event) => this.onEvent(event.path, event.data, event.operation !== void 0)));
      await this.client.store.load(this.path, { children: false, flatvalue: true, commands: false, propfilter: "row_data" });
      if (this.disposed) return;
      this.replace(isRowData(cell.value) ? cell.value : { operation: "update", row_ids: [] }, cell.version);
      this.releases.push(
        cell.onChange(() => {
          if (isRowData(cell.value) && cell.value.operation === "update") this.replace(cell.value, cell.version);
        })
      );
      this.releases.push(this.origin.onChange(() => this.replace(this.table, this.tableVersion)));
      this.client.store.scheduler.flush();
    }
    onEvent(path, data, structural) {
      if (this.disposed || structural) return;
      if (path !== `${this.path}/row_data` || !isRowData(data)) return;
      if (data.operation === "update") return;
      this.deltas.push({ stamp: nextVersion(), delta: data });
      if (this.deltas.length > 256) this.deltas.splice(0, this.deltas.length - 256);
      this.apply(data);
      this.publish();
    }
    replace(table, version) {
      this.table = table;
      this.tableVersion = version;
      this.rows.clear();
      for (const row of rowsOf(table, this.shift)) this.rows.set(row.rowid, row);
      this.deltas = this.deltas.filter((d) => d.stamp > version);
      for (const { delta } of this.deltas) this.apply(delta);
      this.publish();
    }
    apply(delta) {
      if (delta.operation === "deleted") {
        for (const rowid of delta.row_ids) this.rows.delete(rowid);
        return;
      }
      for (const row of rowsOf(delta, this.shift)) this.rows.set(row.rowid, row);
    }
    publish() {
      const events = Object.freeze([...this.rows.values()].sort(byTick));
      this.eventsCell.update(events);
      this.notesCell.update(Object.freeze(pairNotes(events)));
    }
    // ── editing ───────────────────────────────────────────────────────────────────────────
    // Each verb posts once and then waits for the rows to show the change: LUNA answers `null`
    // whether or not anything happened (fact 71), so the reply is not proof.
    /** The session's `main` edit context, for the selection the note verbs act through. */
    get context() {
      this.contextView ??= new Context(this.client, `${this.host.sessionPath}/contexts/main`, this.host.sessionUid);
      return this.contextView;
    }
    /**
     * Set several notes' velocities in one post: one "Change Velocities" undo entry for the
     * whole batch, where {@link setVelocity} in a loop would be one entry per note. `off`
     * targets each note's note-off row instead of its note-on.
     *
     * @example
     * // Scale every velocity in the clip by a percentage, as one undo entry.
     * await clip.midi.setVelocities(clip.midi.notes.items.map((n) => ({ note: n, velocity: Math.max(1, Math.min(127, Math.round(n.velocity * 1.25))) })));
     */
    async setVelocities(changes, options = {}) {
      if (this.disposed) throw new UAError("disposed", "setVelocities(): the clip is gone", { path: this.path });
      if (changes.length === 0) throw new UAError("out_of_range", "setVelocities(): no changes given", { path: this.path });
      const rows = [];
      const expected = [];
      for (const change of changes) {
        const note = this.resolveOne(change.note);
        const rowid = options.off ? note.offRowid : note.rowid;
        if (rowid === void 0) throw new UAError("not_found", "setVelocities(): a note has no note-off row", { path: this.path });
        const velocity = midiByte(change.velocity, "velocity", 1);
        rows.push({ rowid, velocity });
        expected.push({ rowid: note.rowid, velocity });
      }
      await this.wire.post(`${this.host.sessionPath}/contexts/main/commands/change_velocity`, { session_uid: this.host.sessionUid, velocity_on: options.off !== true, notes: rows });
      await this.settleEdit(() => expected.every((e) => (options.off ? this.notes.byId(String(e.rowid))?.offVelocity : this.notes.byId(String(e.rowid))?.velocity) === e.velocity), "change velocities");
    }
    /** Set one note's velocity. `off` targets the note-off row. One "Change Velocities" undo entry. */
    setVelocity(note, velocity, options = {}) {
      return this.setVelocities([{ note, velocity }], options);
    }
    /**
     * Mute or unmute notes. LUNA's `mute_notes` is a toggle over the selection (fact 74), so
     * this selects only the notes whose state must change, posts once, and restores the user's
     * selection. Nothing is posted — and no undo entry made — when nothing needs changing.
     * Which notes need changing is read from {@link notes}, which a batch transaction does not
     * update until its commit: mute a note once per batch.
     *
     * @example
     * // Mute everything quieter than 40, as one undo entry.
     * await clip.midi.setMuted(clip.midi.notes.items.filter((n) => n.velocity < 40), true);
     */
    async setMuted(notes, muted) {
      const targets = this.resolve(notes).filter((n) => n.muted !== muted);
      if (!targets.length) return;
      await this.withSelection(targets, async () => {
        await this.wire.post(`${this.host.sessionPath}/contexts/main/commands/mute_notes`, { session_uid: this.host.sessionUid });
        await this.settleEdit(() => targets.every((t) => this.notes.byId(String(t.rowid))?.muted === muted), "mute notes");
      });
    }
    /**
     * Delete notes: `clear` over a selection of exactly these notes, one undo entry, with the
     * user's selection restored afterwards. Inside a `session.transaction()` batch it joins the
     * batch's undo step, so deleting notes and writing their replacements with
     * {@link Clip.addNotes} undoes as one.
     *
     * @example
     * await clip.midi.deleteNotes([clip.midi.notes.items[0]!]);
     */
    async deleteNotes(notes) {
      const targets = this.resolve(notes);
      if (!targets.length) return;
      await this.withSelection(targets, async () => {
        await this.wire.post(`${this.host.sessionPath}/contexts/main/commands/clear`, { session_uid: this.host.sessionUid });
        await this.settleEdit(() => targets.every((t) => this.notes.byId(String(t.rowid)) === void 0), "delete notes");
      });
    }
    /**
     * Move MIDI rows other than notes — SysEx, CC, program change, pitch bend, aftertouch — by
     * `byTicks`, in one post and one "Move MIDI Events" undo entry (fact 141). Each row keeps its
     * id, bytes and `enabled`. This is how LUNA's own MIDI lane drags a SysEx.
     *
     * Refused before anything is sent: a note-on or note-off row (a note's two rows move
     * together; one alone would break the note), a row not in this clip, a `byTicks` that is not
     * an integer, or a move to before the clip's MIDI origin. A row moved past either end of the
     * clip stays in the table but does not play there; keep `row.tick + byTicks` within the clip
     * if it should. Nothing is posted for no rows or `byTicks` 0. LUNA builds without the command
     * answer with an error.
     *
     * @example
     * // Push every SysEx in the clip one beat later, as one undo entry.
     * await clip.midi.moveEvents(clip.midi.events.items.filter((r) => r.sysex), Luna.TICKS_PER_BEAT);
     */
    async moveEvents(rows, byTicks) {
      if (this.disposed) throw new UAError("disposed", "moveEvents(): the clip is gone", { path: this.path });
      if (typeof byTicks !== "number" || !Number.isInteger(byTicks)) throw new UAError("out_of_range", "moveEvents(): byTicks must be an integer", { path: this.path });
      const targets = [];
      for (const row of rows) {
        const found = this.events.byId(String(typeof row === "number" ? row : row.rowid));
        if (!found) throw new UAError("not_found", "moveEvents(): no such row in this clip", { path: this.path });
        if ((found.status & 240) === 128 || (found.status & 240) === 144) {
          throw new UAError("out_of_range", "moveEvents(): a note row; it moves only with its note-on or note-off", { path: this.path });
        }
        if (found.tick + this.shift + byTicks < 0) throw new UAError("out_of_range", "moveEvents(): a row would move before the clip's MIDI origin", { path: this.path });
        if (!targets.some((t) => t.rowid === found.rowid)) targets.push(found);
      }
      if (!targets.length || byTicks === 0) return;
      await this.wire.post(`${this.host.sessionPath}/contexts/main/commands/move_midi_events`, {
        session_uid: this.host.sessionUid,
        row_ids: targets.map((t) => t.rowid),
        offset: byTicks
      });
      await this.settleEdit(() => targets.every((t) => this.events.byId(String(t.rowid))?.tick === t.tick + byTicks), "move MIDI events");
    }
    resolveOne(note) {
      const found = this.notes.byId(String(typeof note === "number" ? note : note.rowid));
      if (!found) throw new UAError("not_found", "no such note in this clip", { path: this.path });
      return found;
    }
    resolve(notes) {
      if (this.disposed) throw new UAError("disposed", "the clip is gone", { path: this.path });
      return notes.map((n) => this.resolveOne(n));
    }
    /** Save the user's selection, select `targets` (absolute ticks), run `fn`, restore. */
    async withSelection(targets, fn) {
      const base = this.host.startTick();
      if (base === void 0) throw new UAError("unavailable", "the clip has no start tick yet", { path: this.path });
      const context = this.context;
      await context.refreshSelection().catch(() => {
      });
      const saved = context.snapshot();
      await context.selectNotes(
        this.host.playlistUid,
        targets.map((t) => [t.pitch, base + t.startTick, base + (t.stopTick ?? t.startTick), t.rowid])
      );
      try {
        await fn();
      } finally {
        await context.restore(saved).catch(() => {
        });
      }
    }
    /**
     * Wait for an edit to show in the lists. Inside a batch transaction LUNA holds the deltas,
     * and answers reads of the table from before the batch, until the commit (fact 74): there
     * is nothing to wait for yet.
     */
    async settleEdit(done, what) {
      if (this.host.transactionMode?.() === "batch") return;
      await settle(done, what, this.settleOptions());
    }
    settleOptions() {
      return { path: this.path, disposed: () => this.disposed, refresh: () => this.refresh(), flush: () => this.client.store.scheduler.flush() };
    }
    /**
     * Re-read the whole table. LUNA holds deltas back inside a batch transaction, so call
     * this after one if the lists look behind; deltas that arrive later still apply.
     */
    async refresh() {
      if (this.disposed) return;
      await this.client.store.load(this.path, { children: false, flatvalue: true, commands: false, propfilter: "row_data" });
    }
    release() {
      for (const release2 of this.releases) release2();
      this.releases.length = 0;
      this.client.store.forget(this.path);
    }
  };

  // src/model/clip.ts
  var CLIP_TYPES = { 0: "audio", 1: "video", 2: "midi" };
  function clipTypeFrom(raw) {
    if (typeof raw === "number") return CLIP_TYPES[raw];
    if (raw === "audio" || raw === "video" || raw === "midi") return raw;
    return void 0;
  }
  var FADE_SHAPES = ["linear", "equal_power", "log"];
  function requireFadeShape(shape, what) {
    if (shape === void 0) return void 0;
    if (typeof shape !== "string" || !FADE_SHAPES.includes(shape)) throw new UAError("out_of_range", `${what}: shape must be one of ${FADE_SHAPES.join(", ")}`);
    return shape;
  }
  var Clip = class extends Node {
    /** @internal */
    constructor(client, path, sessionUid, transactionMode, siblings) {
      super(client, path);
      this.sessionUid = sessionUid;
      this.transactionMode = transactionMode;
      this.siblings = siblings;
      this.uid = this.prop("uid");
      this.name = this.writableProp("name");
      this.start = this.prop("start");
      this.stop = this.prop("stop");
      this.sourceStart = this.prop("source_start");
      this.sourceStop = this.prop("source_stop");
      this.sourceUid = this.prop("source_uid");
      this.gain = this.writableProp("gain");
      this.layer = this.prop("layer");
      const mute = this.prop("mute");
      this.muted = derived([mute], () => mute.value === void 0 || mute.value === null ? void 0 : mute.value === true || mute.value === 1);
      const rawType = this.prop("clip_type");
      this.clipType = derived([rawType], () => clipTypeFrom(rawType.value));
      this.bypass = this.prop("bypass");
      this.renderSourceUid = this.prop("render_source_uid");
      this.renderState = this.prop("render_state");
      this.midiSourceStart = this.prop("midi_source_start");
    }
    sessionUid;
    transactionMode;
    siblings;
    midiClip;
    deleting = false;
    contextView;
    controlsFolder;
    warpList;
    uid;
    name;
    /** Timeline start, ticks. */
    start;
    /** Timeline end, ticks. */
    stop;
    /** Offset into the source file, nanoseconds. */
    sourceStart;
    /** End offset into the source file, nanoseconds. */
    sourceStop;
    /** Uid of the source audio file under the session's workspace `audio` folder. */
    sourceUid;
    /** Clip gain in dB. */
    gain;
    /** Stacking layer on its playlist; the higher layer plays where clips overlap. */
    layer;
    /** Whether the clip is muted (`mute`, reported as a boolean or 0/1). */
    muted;
    clipType;
    bypass;
    /**
     * The time-stretched source LUNA renders when the clip's tick span does not match its
     * source span at the session tempo, and the state of that render (`current` when it is the
     * audio actually played). {@link clipAudio} picks between this and `sourceUid` (fact 73).
     */
    renderSourceUid;
    renderState;
    /**
     * For a MIDI clip: the MIDI table tick that sits at this clip's start (fact 41). 0 for
     * rows created in place; the clip's start tick for an imported MIDI file.
     */
    midiSourceStart;
    /**
     * This clip's MIDI as live `events` and `notes` lists. Created on first use and shared;
     * call `ready()` before reading. Empty for an audio clip.
     *
     * @example
     * await clip.midi.ready();
     * clip.midi.notes.onChange(() => draw(clip.midi.notes.items));
     */
    get midi() {
      this.midiClip ??= new MidiClip(this.client, this.path, this.midiSourceStart, {
        sessionPath: `/sessions/${this.sessionUid}`,
        sessionUid: this.sessionUid,
        playlistUid: this.playlistUid,
        clipUid: this.id,
        startTick: () => this.start.value,
        transactionMode: this.transactionMode
      });
      return this.midiClip;
    }
    /**
     * Every field at once, as a frozen plain object, so a view draws one consistent state
     * rather than reading props across a push.
     *
     * @example
     * playlist.clips.onChange(() => draw(playlist.clips.items.map((c) => c.snapshot())));
     */
    snapshot() {
      return Object.freeze({
        uid: this.id,
        name: this.name.value,
        clipType: this.clipType.value,
        start: this.start.value,
        stop: this.stop.value,
        sourceUid: this.sourceUid.value,
        sourceStart: this.sourceStart.value,
        sourceStop: this.sourceStop.value,
        layer: this.layer.value,
        muted: this.muted.value,
        gain: this.gain.value,
        renderSourceUid: this.renderSourceUid.value,
        renderState: this.renderState.value,
        midiSourceStart: this.midiSourceStart.value
      });
    }
    /**
     * The clip's own controls (`<clip>/controls/<type>`). LUNA gives every clip a `gain` one
     * (fact 228); see {@link gainControl}.
     *
     * @example
     * await clip.controls.load();
     * clip.controls.items.map((c) => c.controlType.value); // ['gain']
     */
    get controls() {
      this.controlsFolder ??= new Controls(this.client, `${this.path}/controls`);
      return this.controlsFolder;
    }
    /**
     * The clip gain control (fact 228): its `automation` lane is the clip-gain envelope, in dB,
     * with ticks relative to the clip's start, edited with the usual breakpoint verbs. Its value
     * follows {@link gain}. {@link clipGainAt} evaluates the lane as LUNA does.
     *
     * @example
     * await clip.gainControl.load();
     * const lane = clip.gainControl.automation;
     * await lane.insert([{ tick: 0, value: 0 }, { tick: Luna.WHOLE_NOTE, value: -144 }]); // fade to silence
     * Luna.clipGainAt(lane.breakpoints, Luna.HALF_NOTE); // -72
     */
    get gainControl() {
      return this.controls.get("gain");
    }
    /**
     * The clip's warp markers (facts 229-231). Call `load()` before reading.
     *
     * @example
     * await clip.warps.load();
     * clip.warps.markers; // [{ rowid, start, sourceStart, type }]
     */
    get warps() {
      this.warpList ??= new Warps(this.client, this.path, this.sessionUid);
      return this.warpList;
    }
    /** The playlist this clip sits on, taken from its path. */
    get playlistUid() {
      return this.path.split("/")[4] ?? "";
    }
    /** Length on the timeline, ticks. */
    get length() {
      const a = this.start.value;
      const b = this.stop.value;
      return a === void 0 || b === void 0 ? void 0 : b - a;
    }
    sessionPost(command, payload) {
      if (this.disposed) return Promise.reject(new Disposed("Clip", this.path));
      return this.wire.post(`/sessions/${this.sessionUid}/${command}`, { session_uid: this.sessionUid, ...payload });
    }
    /** The cell listing this clip's siblings, and a re-read of it for {@link settle}. */
    settleOptions() {
      const parent = this.path.slice(0, this.path.lastIndexOf("/"));
      return { path: this.path, disposed: () => this.disposed && !this.deleting, refresh: () => this.client.store.load(parent, { levels: 2, commands: false, flatvalue: true }), flush: () => this.client.store.scheduler.flush() };
    }
    /**
     * Delete this clip and resolve once it has left its playlist. `delete_clip` answers the
     * same whether or not anything was deleted (fact 71), so the model is the proof.
     *
     * @example
     * await clip.delete();
     */
    async delete() {
      const reply = await this.sessionPost("delete_clip", { uid: this.id });
      const parent = this.path.slice(0, this.path.lastIndexOf("/"));
      this.deleting = true;
      try {
        await settle(() => !(this.client.store.children(parent).value ?? []).includes(this.id), "delete clip", this.settleOptions());
      } finally {
        this.deleting = false;
      }
      this.client.store.scheduler.flush();
      return reply;
    }
    /**
     * Set new timeline bounds (ticks). With `split`, cut the clip instead of trimming it; with
     * `stretch`, time-compress or expand the content to fit rather than revealing or hiding
     * source audio.
     *
     * `trim_clip` is a command of the **edit context**, not of the session.
     *
     * @example
     * await clip.trim(clip.start.value!, clip.stop.value! - Luna.QUARTER_NOTE);
     */
    async trim(startTick, stopTick, options = {}) {
      this.assertLive();
      const payload = { session_uid: this.sessionUid, clip_uid: this.id, start: requireTick(startTick, "startTick"), stop: requireTick(stopTick, "stopTick") };
      if (options.split !== void 0) payload["split"] = options.split;
      if (options.stretch !== void 0) payload["enable_tce"] = options.stretch;
      let reply;
      try {
        reply = await this.wire.post(`/sessions/${this.sessionUid}/contexts/main/commands/trim_clip`, payload);
      } catch (err) {
        if (err.code !== "uasrv.invalid_object") throw err;
        reply = await this.sessionPost("trim_clip", { clip_uid: this.id, context_type: "main", start: startTick, stop: stopTick, ...options.split !== void 0 ? { split: options.split } : {} });
      }
      if (options.split !== true) {
        await settle(() => this.start.value === startTick && this.stop.value === stopTick, "trim clip", { ...this.settleOptions(), refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }) });
      }
      return reply;
    }
    /**
     * Move the clip so it starts at `toTick`, keeping its length, on its own playlist. One undo
     * step. Resolves to this clip, or with `copy` to the new copy once it is listed. LUNA's
     * `move_clips` moves a range (fact 117): this is the clip's whole span, so a clip lying
     * wholly on top of this one moves with it. To move what shows of a clip that others overlap,
     * the way dragging it in LUNA does, move its pieces from {@link Playlist.compiledClips} with
     * {@link CompiledClip.move}. The user's selection is put back afterwards.
     *
     * @example
     * await clip.move(clip.start.value! + Luna.WHOLE_NOTE);
     * const copy = await clip.move(clip.stop.value!, { copy: true });
     */
    async move(toTick, options = {}) {
      const [start, stop] = this.bounds("move");
      requireTick(toTick, "toTick");
      if (toTick < 0) throw new UAError("out_of_range", "move(): toTick must not be negative", { path: this.path });
      const before = new Set(this.siblingList().items.map((c) => c.id));
      await this.keepingSelection(
        () => this.contextPost("move_clips", { context_type: "main", playlist_uid: [this.playlistUid], start, stop, location: toTick, ...options.copy ? { copy: true } : {} })
      );
      if (!options.copy) {
        await settle(() => this.start.value === toTick, "move clip", this.settleOptions());
        return this;
      }
      const length = stop - start;
      const found = () => this.siblingList().items.find((c) => !before.has(c.id) && c.start.value === toTick && c.stop.value === toTick + length);
      await settle(() => found() !== void 0, "copy clip", this.settleOptions());
      return found();
    }
    /**
     * Copy the clip to start where it ends. One undo step; resolves to the copy.
     *
     * @example
     * const again = await clip.duplicate();
     */
    async duplicate() {
      const [, stop] = this.bounds("duplicate");
      return this.move(stop, { copy: true });
    }
    /**
     * Cut the clip at one or more ticks inside it (LUNA's `separate_clips`). One undo step.
     * Resolves to the pieces in time order; this clip keeps the first. A fade-out moves to the
     * last piece, and a crossfade at a cut is not kept (fact 117).
     *
     * @example
     * const [left, right] = await clip.split(clip.start.value! + Luna.WHOLE_NOTE);
     */
    async split(at) {
      const [start, stop] = this.bounds("split");
      const ticks = [...new Set((typeof at === "number" ? [at] : at).map((t) => requireTick(t, "at")))].sort((a, b) => a - b);
      if (!ticks.length || ticks.some((t) => t <= start || t >= stop)) throw new UAError("out_of_range", "split(): every tick must lie inside the clip", { path: this.path });
      await this.contextPost("separate_clips", { location: ticks, playlist_uid: [this.playlistUid] });
      const pieces = () => ticks.map((t, i) => this.siblingList().items.find((c) => c.start.value === t && c.stop.value === (ticks[i + 1] ?? stop)));
      await settle(() => this.stop.value === ticks[0] && pieces().every((p) => p !== void 0), "split clip", this.settleOptions());
      return [this, ...pieces()];
    }
    /**
     * Mute or unmute the clip. One undo step. (LUNA's `mute_clips` toggles a range instead.)
     *
     * @example
     * await clip.setMuted(true);
     */
    setMuted(muted) {
      return this.property("mute").set(muted);
    }
    /**
     * Slide the audio inside the clip without moving the clip: positive `byNs` moves the audio
     * later, so an earlier part of the source plays at the clip start. LUNA's own content nudge,
     * so warps move with it; one undo step. The step is one sample at the engine rate. Only a
     * clip on its track's active playlist can be slipped. A slip that would run past either end
     * of the source does nothing in LUNA (fact 117); one past the start is refused here with
     * `out_of_range`, one past the end rejects with `no_effect`.
     *
     * @example
     * await clip.slip(-10_000_000);   // 10 ms earlier
     */
    async slip(byNs) {
      const [start, stop] = this.bounds("slip");
      if (!Number.isFinite(byNs)) throw new UAError("out_of_range", "slip(): byNs must be a finite number", { path: this.path });
      const track = this.client.store.cell(this.playlistPath, "track_uid").value;
      if (!track || this.client.store.cell(`/sessions/${this.sessionUid}/tracks/${track}`, "playlist_uid").value !== this.playlistUid) {
        throw new UAError("unavailable", "slip(): LUNA slips only clips on their track's active playlist", { path: this.path });
      }
      const info = await this.sessionPost("get_clip_info", { clip_uid: this.id });
      const rate = info?.sample_rate ?? 48e3;
      const samples = Math.round(Math.abs(byNs) * rate / 1e9);
      if (samples === 0) return;
      const from = this.sourceStart.value ?? 0;
      if (byNs > 0 && from - samples * 1e9 / rate < 0) {
        throw new UAError("out_of_range", `slip(): the source has only ${(from / 1e6).toFixed(1)} ms of audio before the clip start`, { path: this.path });
      }
      const operation = byNs > 0 ? "content_right" : "content_left";
      await this.keepingSelection(async () => {
        await this.context.select({ focus: "timeline", startTick: start, stopTick: stop, trackUids: [track] });
        await this.contextPost("nudge", { nudge_settings: JSON.stringify({ mode: "samples", samples, operation }) });
      });
      const expected = from - Math.sign(byNs) * (samples * 1e9) / rate;
      await settle(() => Math.abs((this.sourceStart.value ?? from) - expected) < 1e9 / rate + 1, "slip clip", this.refreshingOptions());
    }
    /**
     * Fade the clip in over its first `lengthTicks`, or change the length of its fade-in. One
     * undo step, or two when `shape` changes an existing fade's shape. Without `shape` a new
     * fade is `log`, LUNA's default. Audio clips only: a MIDI or video clip rejects with
     * `unavailable`.
     *
     * @example
     * await clip.setFadeIn(Luna.QUARTER_NOTE, { shape: 'equal_power' });
     */
    async setFadeIn(lengthTicks, options = {}) {
      const [start] = this.bounds("setFadeIn");
      const length = this.fadeLength(lengthTicks, "setFadeIn");
      return this.setFade({ fade_type: "fade_in", start, stop_offset: length }, options.shape, "setFadeIn");
    }
    /**
     * Fade the clip out over its last `lengthTicks`, or change the length of its fade-out.
     *
     * @example
     * await clip.setFadeOut(Luna.HALF_NOTE);
     */
    async setFadeOut(lengthTicks, options = {}) {
      const [, stop] = this.bounds("setFadeOut");
      const length = this.fadeLength(lengthTicks, "setFadeOut");
      return this.setFade({ fade_type: "fade_out", stop, start_offset: -length }, options.shape, "setFadeOut");
    }
    /**
     * Crossfade from this clip into `next`, which must start where this one stops on the same
     * playlist. For clips that overlap, such as one on top over the middle of another, crossfade
     * the segments either side of the edit with {@link CompiledClip.crossfade}. `align` puts the fade across the edit (`center`, the default), before it or
     * after it. Calling again changes the length. Each clip's source must reach past the edit by
     * the part of the fade on the other side; LUNA does not check (fact 117).
     *
     * @example
     * await left.crossfade(right, Luna.EIGHTH_NOTE);
     */
    async crossfade(next, lengthTicks, options = {}) {
      const [, stop] = this.bounds("crossfade");
      if (next.playlistUid !== this.playlistUid) throw new UAError("out_of_range", "crossfade(): both clips must be on the same playlist", { path: this.path });
      if (next.start.value !== stop) throw new UAError("out_of_range", "crossfade(): the next clip must start where this one stops", { path: this.path });
      next.requireAudio("crossfade");
      const length = requireTick(lengthTicks, "lengthTicks");
      if (length <= 0) throw new UAError("out_of_range", "crossfade(): lengthTicks must be positive", { path: this.path });
      const align = options.align ?? "center";
      const [startOffset, stopOffset] = align === "before" ? [-length, 0] : align === "after" ? [0, length] : [-Math.floor(length / 2), length - Math.floor(length / 2)];
      return this.setFade({ fade_type: "cross_fade", contributor_clip_uid: next.id, start_offset: startOffset, stop_offset: stopOffset, trim_to_edge: false }, options.shape, "crossfade");
    }
    /**
     * Remove the clip's plain fade-in. Resolves at once when there is none.
     *
     * @example
     * await clip.removeFadeIn();
     */
    async removeFadeIn() {
      const [start] = this.bounds("removeFadeIn");
      const row = (await this.fadeRows()).find((f) => f.type === "fade_in" && !f.contributor);
      if (row) await this.deleteFadeRange(start + row.startOffset, start + row.stopOffset, [{ clip: this, uid: row.uid }]);
    }
    /**
     * Remove the clip's plain fade-out. Resolves at once when there is none.
     *
     * @example
     * await clip.removeFadeOut();
     */
    async removeFadeOut() {
      const [, stop] = this.bounds("removeFadeOut");
      const row = (await this.fadeRows()).find((f) => f.type === "fade_out" && !f.contributor);
      if (row) await this.deleteFadeRange(stop + row.startOffset, stop + row.stopOffset, [{ clip: this, uid: row.uid }]);
    }
    /**
     * Remove the crossfade from this clip into `next`, both halves. Resolves at once when there
     * is none.
     *
     * @example
     * await left.removeCrossfade(right);
     */
    async removeCrossfade(next) {
      const [, stop] = this.bounds("removeCrossfade");
      const row = (await this.fadeRows()).find((f) => f.type === "fade_out" && f.contributor === next.id);
      const other = (await next.fadeRows()).find((f) => f.type === "fade_in" && f.contributor === this.id);
      if (!row && !other) return;
      const offsets = [row, other].filter((f) => f !== void 0);
      const from = Math.min(stop - 1, ...offsets.map((f) => stop + f.startOffset));
      const to = Math.max(stop + 1, ...offsets.map((f) => stop + f.stopOffset));
      await this.deleteFadeRange(from, to, [...row ? [{ clip: this, uid: row.uid }] : [], ...other ? [{ clip: next, uid: other.uid }] : []]);
    }
    /** Add raw MIDI events to this (MIDI) clip in one undo step. */
    addMidi(events) {
      const origin = this.midiSourceStart.value ?? 0;
      return this.sessionPost("add_midi", {
        midi: events.map((e) => {
          const ev = { clip_uid: this.id, tick: e.tick + origin, byte_0: e.status, byte_1: e.data1 };
          if (e.data2 !== void 0) ev["byte_2"] = e.data2;
          return ev;
        })
      });
    }
    /** Add a note: note-on at `tick`, note-off at `tick + lengthTicks`. */
    addNote(note, tick, lengthTicks, velocity = 100, channel = 0) {
      return this.addNotes([{ pitch: note, tick, lengthTicks, velocity, channel }]);
    }
    /**
     * Add several notes to this (MIDI) clip in one `add_midi` post, so they land as one undo
     * step. Each note is a note-on at `tick` and a note-off at `tick + lengthTicks`.
     *
     * @example
     * // A C major triad on beat 1, then its arpeggio.
     * await clip.addNotes([
     *   ...[60, 64, 67].map((pitch) => ({ pitch, tick: 0, lengthTicks: Luna.QUARTER_NOTE })),
     *   ...[60, 64, 67].map((pitch, i) => ({ pitch, tick: (i + 1) * Luna.QUARTER_NOTE, lengthTicks: Luna.QUARTER_NOTE, velocity: 80 })),
     * ]);
     */
    addNotes(notes) {
      if (!notes.length) return Promise.reject(new UAError("out_of_range", "addNotes(): give at least one note", { path: this.path }));
      let events;
      try {
        events = notes.flatMap((n) => {
          const pitch = midiByte(n.pitch, "pitch");
          const tick = requireTick(n.tick, "tick");
          const length = requireTick(n.lengthTicks, "lengthTicks");
          if (length <= 0) throw new UAError("out_of_range", "addNotes(): lengthTicks must be positive", { path: this.path });
          const velocity = midiByte(n.velocity ?? 100, "velocity", 1);
          const ch = n.channel ?? 0;
          if (!Number.isInteger(ch) || ch < 0 || ch > 15) throw new UAError("out_of_range", "addNotes(): channel must be an integer 0-15", { path: this.path });
          return [
            { tick, status: 144 | ch, data1: pitch, data2: velocity },
            { tick: tick + length, status: 128 | ch, data1: pitch, data2: 0 }
          ];
        });
      } catch (err) {
        return Promise.reject(err);
      }
      return this.addMidi(events);
    }
    bringToFront() {
      return this.sessionPost("bring_to_front", { uid: this.id });
    }
    sendToBack() {
      return this.sessionPost("send_to_back", { uid: this.id });
    }
    get playlistPath() {
      return this.path.slice(0, this.path.indexOf("/clips/"));
    }
    get context() {
      this.contextView ??= new Context(this.client, `/sessions/${this.sessionUid}/contexts/main`, this.sessionUid);
      return this.contextView;
    }
    contextPost(command, payload) {
      if (this.disposed) return Promise.reject(new Disposed("Clip", this.path));
      return this.wire.post(`/sessions/${this.sessionUid}/contexts/main/commands/${command}`, { session_uid: this.sessionUid, ...payload });
    }
    /** Commands that select what they act on move the user's selection; put it back after. */
    async keepingSelection(fn) {
      const context = this.context;
      await context.refreshSelection().catch(() => {
      });
      const saved = context.snapshot();
      try {
        return await fn();
      } finally {
        await context.restore(saved).catch(() => {
        });
      }
    }
    bounds(what) {
      this.assertLive();
      const start = this.start.value;
      const stop = this.stop.value;
      if (start === void 0 || stop === void 0) throw new UAError("unavailable", `${what}(): the clip's bounds are not loaded yet`, { path: this.path });
      return [start, stop];
    }
    siblingList() {
      if (!this.siblings) throw new UAError("unavailable", "this clip was not reached through a playlist", { path: this.path });
      return this.siblings();
    }
    /** Settle options that re-read this clip itself, for edits that change only its properties. */
    refreshingOptions() {
      return { ...this.settleOptions(), refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }) };
    }
    fadeLength(lengthTicks, what) {
      const length = requireTick(lengthTicks, "lengthTicks");
      const clipLength = this.length ?? 0;
      if (length <= 0 || length > clipLength) throw new UAError("out_of_range", `${what}(): lengthTicks must be positive and at most the clip's length`, { path: this.path });
      return length;
    }
    /**
     * One `set_fade` (fact 117). LUNA applies `fade_shape` only to a fade it creates, so a shape
     * asked of a fade that already existed goes through `change_fade_curvature` as well.
     */
    async setFade(fade, shape, what) {
      requireFadeShape(shape, `${what}()`);
      this.requireAudio(what);
      const reply = await this.contextPost("set_fade", {
        ...shape ? { fade_shape: shape } : {},
        clips: [{ playlist_uid: this.playlistUid, clip_uid: this.id, fade_reference_edge: "none", ...fade }]
      });
      const changed = (reply?.edit_results?.changed?.fades ?? []).map((f) => f.fade_uid).filter((u) => typeof u === "string");
      if (shape && changed.length) await this.contextPost("change_fade_curvature", { fades: changed, fade_shape: shape });
    }
    /**
     * LUNA fades audio clips only, and answers a fade on any other with success and no change
     * (fact 117), so refuse it here. A clip whose type has not loaded is let through.
     *
     * @internal
     */
    requireAudio(what) {
      const type = this.clipType.value;
      if (type !== void 0 && type !== "audio") throw new UAError("unavailable", `${what}(): LUNA fades audio clips only; this one is ${type}`, { path: this.path });
    }
    /** The clip's stored fade rows, read fresh. */
    /** @internal */
    async fadeRows() {
      const folder = `${this.path}/fades`;
      await this.client.store.load(folder, { levels: 2, commands: false, flatvalue: true });
      return (this.client.store.children(folder).value ?? []).map((uid) => {
        const cell = (name) => this.client.store.cell(`${folder}/${uid}`, name).value;
        return {
          uid,
          type: String(cell("fade_type") ?? ""),
          contributor: cell("contributor_clip_uid") ?? void 0,
          startOffset: Number(cell("start_offset") ?? 0),
          stopOffset: Number(cell("stop_offset") ?? 0)
        };
      });
    }
    /** `delete_fades` takes every fade lying wholly inside a range; aim it at one fade's range. */
    async deleteFadeRange(start, stop, rows) {
      await this.contextPost("delete_fades", { playlist_uid: [this.playlistUid], start, stop });
      const gone = () => rows.every(({ clip, uid }) => !(this.client.store.children(`${clip.path}/fades`).value ?? []).includes(uid));
      await settle(gone, "remove fade", {
        ...this.settleOptions(),
        refresh: async () => {
          for (const { clip } of rows) await this.client.store.load(`${clip.path}/fades`, { levels: 2, commands: false, flatvalue: true });
        }
      });
    }
    release() {
      this.midiClip?.dispose();
      this.midiClip = void 0;
      this.controlsFolder?.dispose();
      this.warpList?.dispose();
    }
  };

  // src/model/compiled-clip.ts
  var CompiledClip = class extends Node {
    /** @internal */
    constructor(client, path, siblings) {
      super(client, path);
      this.siblings = siblings;
      this.clipUid = this.prop("clip_uid");
      this.name = this.prop("name");
      this.start = this.prop("start");
      this.stop = this.prop("stop");
      this.sourceStart = this.prop("source_start");
      this.sourceStop = this.prop("source_stop");
      const fullStart = this.prop("full_start");
      const fullStop = this.prop("full_stop");
      this.fullStart = derived([fullStart, this.start], () => fullStart.value ?? this.start.value);
      this.fullStop = derived([fullStop, this.stop], () => fullStop.value ?? this.stop.value);
      this.reportsFades = derived([fullStart], () => fullStart.value !== void 0 && fullStart.value !== null, { distinct: true });
      this.renderSourceUid = this.prop("render_source_uid");
      this.renderSourceStart = this.prop("render_source_start");
      this.renderSourceStop = this.prop("render_source_stop");
      this.needsRender = this.prop("needs_render");
      this.fadeIn = this.fade("fade_in");
      this.fadeOut = this.fade("fade_out");
    }
    siblings;
    /** The clip this segment is cut from; look it up with `playlist.clips.byId`. */
    clipUid;
    name;
    /** Where this segment starts playing, ticks. */
    start;
    /** Where this segment stops playing, ticks. */
    stop;
    /** Source offset at `start`, nanoseconds. */
    sourceStart;
    /** Source offset at `stop`, nanoseconds. */
    sourceStop;
    /**
     * `start` moved earlier by an incoming crossfade, where this segment's audio already sounds
     * under the one before it. Equal to `start` without one, and on a LUNA that does not report
     * fades.
     */
    fullStart;
    /** `stop` moved later by an outgoing crossfade. Equal to `stop` without one. */
    fullStop;
    fadeIn;
    fadeOut;
    /**
     * Whether this LUNA reports fades on compiled clips. When false, `fadeIn` and `fadeOut` are
     * always `undefined` because LUNA does not say, not because there are none; draw no fades
     * and offer no fade editing.
     */
    reportsFades;
    /**
     * The rendering this segment plays when its clip is time-stretched: LUNA renders each
     * compiled piece of a clip on its own, so a clip split by one on top has a render per piece
     * and its own `renderSourceUid` names only one of them (fact 116). `null` when this segment
     * is not rendered; `undefined` on a LUNA that does not report it.
     */
    renderSourceUid;
    /** This segment's range in {@link renderSourceUid}, nanoseconds; `null` without a render. */
    renderSourceStart;
    renderSourceStop;
    /**
     * Whether this segment plays a rendering: time-stretched, with clip effects, or at another
     * sample rate than the engine's. While LUNA makes one, `renderSourceUid` is `null` and this
     * stays true, so the original file is not what plays (fact 116). `undefined` on a LUNA that
     * does not report it.
     */
    needsRender;
    /**
     * Every field at once, as a frozen plain object, so a view draws one consistent state
     * rather than reading props across a push.
     *
     * @example
     * lane.compiledClips.onChange(() => draw(lane.compiledClips.inOrder().map((c) => c.snapshot())));
     */
    snapshot() {
      return Object.freeze({
        id: this.id,
        clipUid: this.clipUid.value,
        name: this.name.value,
        start: this.start.value,
        stop: this.stop.value,
        sourceStart: this.sourceStart.value,
        sourceStop: this.sourceStop.value,
        fullStart: this.fullStart.value,
        fullStop: this.fullStop.value,
        fadeIn: this.fadeIn.value,
        fadeOut: this.fadeOut.value,
        reportsFades: this.reportsFades.value ?? false,
        renderSourceUid: this.renderSourceUid.value,
        renderSourceStart: this.renderSourceStart.value ?? void 0,
        renderSourceStop: this.renderSourceStop.value ?? void 0,
        needsRender: this.needsRender.value
      });
    }
    /**
     * Move what shows of this clip so it starts at `toTick`, as dragging it in LUNA does: LUNA's
     * `move_clips` over this segment's own range (fact 119). One undo step; resolves to the
     * segment at its new place. Where the clip runs on under another clip:
     *
     * - if it shows again further along (or before), LUNA **splits** it at this segment's edge:
     *   the segment moves as a new clip, and the rest stays where it was;
     * - if the rest is hidden, LUNA **trims** it to this segment's edge and moves it.
     *
     * A clip lying wholly on top of this one is not moved, unlike {@link Clip.move}, which moves
     * everything inside the clip's span. The user's selection is put back afterwards.
     *
     * @example
     * const moved = await seg.move(seg.start.value! + Luna.WHOLE_NOTE);
     * const copy = await seg.move(seg.stop.value!, { copy: true });
     */
    async move(toTick, options = {}) {
      if (this.disposed) throw new UAError("disposed", "the segment is gone", { path: this.path });
      const start = this.start.value;
      const stop = this.stop.value;
      if (start === void 0 || stop === void 0) throw new UAError("unavailable", "move(): the segment's bounds are not loaded yet", { path: this.path });
      requireTick(toTick, "toTick");
      if (toTick < 0) throw new UAError("out_of_range", "move(): toTick must not be negative", { path: this.path });
      const siblings = this.siblings?.();
      if (!siblings) throw new UAError("unavailable", "this segment was not reached through a playlist", { path: this.path });
      const [, , sessionUid, , playlistUid] = this.path.split("/");
      const context = new Context(this.client, `/sessions/${sessionUid}/contexts/main`, sessionUid);
      await context.refreshSelection().catch(() => {
      });
      const saved = context.snapshot();
      try {
        await this.wire.post(`/sessions/${sessionUid}/contexts/main/commands/move_clips`, {
          session_uid: sessionUid,
          context_type: "main",
          playlist_uid: [playlistUid],
          start,
          stop,
          location: toTick,
          ...options.copy ? { copy: true } : {}
        });
      } finally {
        await context.restore(saved).catch(() => {
        });
      }
      const length = stop - start;
      const landed = () => siblings.items.find((c) => c.start.value === toTick && c.stop.value === toTick + length);
      await settle(() => landed() !== void 0, options.copy ? "copy segment" : "move segment", {
        path: this.path,
        refresh: () => siblings.reload(),
        flush: () => this.client.store.scheduler.flush()
      });
      return landed();
    }
    /**
     * Crossfade from this segment into `next`, the segment that starts where this one stops on
     * the same playlist: butted clips, or overlapping ones where a clip on top begins or ends
     * over another (fact 117). `align` puts the fade across the edit (`center`, the default),
     * before it or after it; calling again changes the length. One undo step, or two when
     * `shape` changes an existing crossfade's shape. Resolves once LUNA shows it. Each clip's
     * source must reach past the edit by the part of the fade on the other side; LUNA does not
     * check. Audio clips only.
     *
     * @example
     * const [a, b] = lane.compiledClips.inOrder();
     * await a.crossfade(b, Luna.EIGHTH_NOTE);
     */
    async crossfade(next, lengthTicks, options = {}) {
      const edge = this.edgeWith(next, "crossfade");
      const length = requireTick(lengthTicks, "lengthTicks");
      if (length <= 0) throw new UAError("out_of_range", "crossfade(): lengthTicks must be positive", { path: this.path });
      const shape = options.shape;
      if (shape !== void 0 && !["linear", "equal_power", "log"].includes(shape)) throw new UAError("out_of_range", "crossfade(): shape must be one of linear, equal_power, log", { path: this.path });
      const align = options.align ?? "center";
      const [startOffset, stopOffset] = align === "before" ? [-length, 0] : align === "after" ? [0, length] : [-Math.floor(length / 2), length - Math.floor(length / 2)];
      const [, , sessionUid, , playlistUid] = this.path.split("/");
      const commands = `/sessions/${sessionUid}/contexts/main/commands`;
      const reply = await this.wire.post(`${commands}/set_fade`, {
        session_uid: sessionUid,
        ...shape ? { fade_shape: shape } : {},
        clips: [{ playlist_uid: playlistUid, clip_uid: this.clipUid.value, contributor_clip_uid: next.clipUid.value, fade_type: "cross_fade", start_offset: startOffset, stop_offset: stopOffset, trim_to_edge: false, fade_reference_edge: "none" }]
      });
      const changed = (reply?.edit_results?.changed?.fades ?? []).map((f) => f.fade_uid).filter((u) => typeof u === "string");
      if (shape && changed.length) await this.wire.post(`${commands}/change_fade_curvature`, { session_uid: sessionUid, fades: changed, fade_shape: shape });
      const out = () => this.fadeOut.value;
      await settle(() => out()?.contributorClipUid === next.clipUid.value && out().start === edge + startOffset && out().stop === edge + stopOffset, "crossfade", this.settleOptions());
    }
    /**
     * Remove the crossfade between this segment and `next`, both halves. Resolves at once when
     * there is none.
     *
     * @example
     * await a.removeCrossfade(b);
     */
    async removeCrossfade(next) {
      const edge = this.edgeWith(next, "removeCrossfade");
      const out = this.fadeOut.value;
      const into = next.fadeIn.value;
      const halves = [out, into].filter((f) => f !== void 0 && f.crossfade);
      if (!halves.length) return;
      const [, , sessionUid, , playlistUid] = this.path.split("/");
      await this.wire.post(`/sessions/${sessionUid}/contexts/main/commands/delete_fades`, {
        session_uid: sessionUid,
        playlist_uid: [playlistUid],
        start: Math.min(edge - 1, ...halves.map((f) => f.start)),
        stop: Math.max(edge + 1, ...halves.map((f) => f.stop))
      });
      await settle(() => !this.fadeOut.value?.crossfade && !next.fadeIn.value?.crossfade, "remove crossfade", this.settleOptions());
    }
    /** The edit between this segment and `next`, checked: adjoining, same lane, both audio. */
    edgeWith(next, what) {
      if (this.disposed || next.disposed) throw new UAError("disposed", `${what}(): a segment is gone`, { path: this.path });
      const stop = this.stop.value;
      const lane = (path) => path.slice(0, path.indexOf("/compiled_clips/"));
      if (lane(next.path) !== lane(this.path)) throw new UAError("out_of_range", `${what}(): both segments must be on the same playlist`, { path: this.path });
      if (stop === void 0 || next.start.value !== stop) throw new UAError("out_of_range", `${what}(): the next segment must start where this one stops`, { path: this.path });
      if (!this.reportsFades.value) throw new UAError("unavailable", `${what}(): this LUNA does not report fades on compiled clips`, { path: this.path });
      for (const seg of [this, next]) {
        const type = this.client.store.cell(`${lane(this.path)}/clips/${seg.clipUid.value}`, "clip_type").value;
        if (type !== void 0 && type !== "audio" && type !== 0) throw new UAError("unavailable", `${what}(): LUNA fades audio clips only`, { path: seg.path });
      }
      return stop;
    }
    settleOptions() {
      const siblings = this.siblings?.();
      return {
        path: this.path,
        disposed: () => this.disposed,
        ...siblings ? { refresh: () => siblings.reload() } : {},
        flush: () => this.client.store.scheduler.flush()
      };
    }
    /** The seven flat `<prefix>_*` properties as one object, `undefined` when LUNA sends null. */
    fade(prefix) {
      const uid = this.prop(`${prefix}_uid`);
      const start = this.prop(`${prefix}_start`);
      const stop = this.prop(`${prefix}_stop`);
      const shape = this.prop(`${prefix}_shape`);
      const curvature = this.prop(`${prefix}_curvature`);
      const crossfade = this.prop(`${prefix}_crossfade`);
      const contributor = this.prop(`${prefix}_contributor_clip_uid`);
      return derived(
        [uid, start, stop, shape, curvature, crossfade, contributor],
        () => {
          if (typeof uid.value !== "string" || typeof start.value !== "number" || typeof stop.value !== "number") return void 0;
          return Object.freeze({
            uid: uid.value,
            start: start.value,
            stop: stop.value,
            shape: shape.value ?? "log",
            curvature: curvature.value ?? 0,
            crossfade: crossfade.value === true,
            contributorClipUid: contributor.value ?? void 0
          });
        },
        { distinct: true }
      );
    }
  };
  var CompiledClips = class extends Collection {
    enabling;
    enable;
    /** @internal */
    constructor(client, path, enable) {
      let self;
      super(client, path, (p) => new CompiledClip(client, p, () => self), { levels: 2, commands: false, flatvalue: true });
      self = this;
      this.enable = enable;
    }
    /** Turn on publishing (once), then fetch the members. */
    load() {
      return this.enabled().then(() => super.load());
    }
    async reload() {
      await this.enabled();
      await super.reload();
    }
    watch(options = {}) {
      const ready = this.enabled();
      const w = super.watch(options);
      return { ready: Promise.all([ready, w.ready]).then(() => void 0), release: w.release };
    }
    /**
     * Segments by timeline position, earliest first.
     *
     * @example
     * const first = lane.compiledClips.inOrder()[0];
     */
    inOrder() {
      return [...this.items].sort((a, b) => (a.start.value ?? 0) - (b.start.value ?? 0));
    }
    /**
     * The segments cut from one clip, earliest first: none when it is fully covered, two or
     * more when a clip on a higher layer splits it.
     *
     * @example
     * const shown = lane.compiledClips.ofClip(clip.id).length > 0;
     */
    ofClip(clipUid) {
      return this.inOrder().filter((c) => c.clipUid.value === clipUid);
    }
    enabled() {
      this.enabling ??= this.enable().then(
        () => void 0,
        (err) => {
          this.enabling = void 0;
          throw err;
        }
      );
      return this.enabling;
    }
  };

  // src/model/playlist.ts
  var Playlist = class extends Node {
    uid;
    name;
    trackUid;
    /** Take number, 1-based. */
    version;
    stemFormat;
    frozen;
    clips;
    /**
     * What the playlist actually plays: the clips with overlaps resolved by layer, and their
     * fades (fact 116). Draw from these rather than from `clips`.
     */
    compiledClips;
    sessionUid;
    transactionMode;
    contextView;
    /** @internal */
    constructor(client, path, sessionUid, transactionMode) {
      super(client, path);
      this.uid = this.prop("uid");
      this.name = this.prop("name");
      this.trackUid = this.prop("track_uid");
      this.version = this.prop("version");
      this.stemFormat = this.prop("stem_format");
      this.frozen = this.prop("frozen");
      this.clips = new Collection(client, `${path}/clips`, (p) => new Clip(client, p, sessionUid, transactionMode, () => this.clips), { levels: 2, commands: false, flatvalue: true });
      this.compiledClips = new CompiledClips(client, `${path}/compiled_clips`, () => this.property("enable_compiled_clips").set(true));
      this.sessionUid = sessionUid;
      this.transactionMode = transactionMode;
    }
    /** The session's `main` edit context, which `create_note` both reads and overwrites. */
    get context() {
      this.contextView ??= new Context(this.client, `/sessions/${this.sessionUid}/contexts/main`, this.sessionUid);
      return this.contextView;
    }
    /**
     * Write notes onto this lane, making the MIDI clip to hold them if there is none there
     * (LUNA's `create_note`). One undo entry for the whole batch. Ticks are absolute, and every
     * note is on channel 0.
     *
     * A note goes into the clip its note-on falls in. When no clip on the lane is under the
     * notes, LUNA makes one MIDI clip spanning the whole bars they cover, named after the track,
     * and kept clear of the clips either side (fact 111). Notes whose note-ons fall in two
     * different clips land in both, and the call then rejects with `no_effect`, since it resolves
     * to a single clip: write to one clip per call.
     *
     * The returned `notes` are read back from the clip, so their ticks are clip-relative
     * (fact 41): subtract `clip.start.value` from what you passed in to match them up.
     *
     * LUNA answers `null` and instead *selects* what it created, so the new row ids are read
     * back out of the selection, and the notes out of the clip. The user's selection is
     * restored afterwards.
     *
     * Inside a continuous `session.transaction()` each call replaces the notes the previous
     * call wrote, which is how an Add On previews a part it regenerates as the user adjusts
     * it: one undo step, holding the last take (fact 115). A batch transaction holds the clip's
     * notes back until its commit, so this refuses inside one; write into an existing clip
     * there with {@link Clip.addNotes}.
     *
     * @example
     * const bar = session.musical.timeline.tickAt({ bar: 1 });
     * const { clip, notes } = await lane.createNotes(
     *   [60, 64, 67].map((pitch, i) => ({ pitch, startTick: bar + i * Luna.TICKS_PER_BEAT, stopTick: bar + (i + 1) * Luna.TICKS_PER_BEAT })),
     * );
     *
     * @example
     * // Try three roots as one gesture: LUNA keeps only the last take, and one undo removes it.
     * const bar = session.musical.timeline.tickAt({ bar: 2 });
     * const take = (pitch) => [{ pitch, startTick: bar, stopTick: bar + Luna.TICKS_PER_BEAT }];
     * await session.transaction('Pick a root', async () => {
     *   for (const pitch of [60, 62, 64]) await lane.createNotes(take(pitch));
     * }, { continuous: true });
     */
    async createNotes(notes) {
      if (!notes.length) throw new UAError("out_of_range", "createNotes(): give at least one note", { path: this.path });
      if (this.transactionMode?.() === "batch") {
        throw new UAError(
          "busy",
          "createNotes() reads the notes it made back out of the clip, which a batch transaction holds until its commit: write into an existing clip with clip.addNotes() inside the batch, or use a continuous transaction",
          { path: this.path }
        );
      }
      const body = notes.map((n) => {
        const start = requireTick(n.startTick, "startTick");
        const stop = requireTick(n.stopTick, "stopTick");
        if (stop <= start) throw new UAError("out_of_range", "createNotes(): stopTick must be after startTick", { path: this.path });
        const entry = { note: midiByte(n.pitch, "pitch"), start, stop, velocity: midiByte(n.velocity ?? 100, "velocity", 1) };
        if (n.velocityOff !== void 0) {
          entry["velocity_on"] = entry["velocity"];
          entry["velocity_off"] = midiByte(n.velocityOff, "velocityOff");
        }
        return entry;
      });
      const context = this.context;
      await context.refreshSelection().catch(() => {
      });
      const saved = context.snapshot();
      const previous2 = new Set(context.notes.flatMap((s) => s.notes.map((n) => n[3])));
      let rowids = [];
      let clip;
      let found = [];
      try {
        await this.wire.post(`/sessions/${this.sessionUid}/contexts/main/commands/create_note`, { session_uid: this.sessionUid, playlist_uid: this.id, notes: body });
        await settle(
          () => {
            rowids = context.notes.filter((s) => s.playlist_uid === this.id).flatMap((s) => s.notes.map((n) => n[3])).filter((id) => !previous2.has(id));
            return rowids.length >= notes.length;
          },
          "create notes (selection)",
          { path: this.path, refresh: () => context.refreshSelection(), flush: () => this.client.store.scheduler.flush() }
        );
        await settle(
          () => {
            for (const candidate of this.clips.items) {
              if (candidate.clipType.value !== "midi") continue;
              const hits = rowids.map((id) => candidate.midi.notes.byId(String(id))).filter((n) => n !== void 0);
              if (hits.length === rowids.length) {
                clip = candidate;
                found = hits;
                return true;
              }
            }
            return false;
          },
          "create notes",
          {
            path: this.path,
            refresh: async () => {
              await this.clips.reload();
              for (const candidate of this.clips.items) if (candidate.clipType.value === "midi") await candidate.midi.ready().then(() => candidate.midi.refresh());
            },
            flush: () => this.client.store.scheduler.flush()
          }
        );
      } finally {
        await context.restore(saved).catch(() => {
        });
      }
      return { clip, notes: found };
    }
    /**
     * Cut every clip on this lane at each tick (LUNA's `separate_clips`). One undo step.
     *
     * @example
     * await lane.split([bar(5), bar(9)]);
     */
    async split(at) {
      const ticks = (typeof at === "number" ? [at] : [...at]).map((t) => requireTick(t, "at"));
      if (!ticks.length) throw new UAError("out_of_range", "split(): give at least one tick", { path: this.path });
      await this.contextPost("separate_clips", { location: ticks, playlist_uid: [this.id] });
    }
    /**
     * Join clips that were split apart and still play on from each other in their source
     * (LUNA's `heal_separation`). It acts on clips starting after `startTick` up to and
     * **including** `stopTick`, and on the clip running into `startTick`, so a clip that begins
     * exactly at `stopTick` and continues the same audio is joined too (fact 117). One undo
     * step; the user's selection is put back afterwards.
     *
     * @example
     * await lane.heal(clip.start.value!, clip.stop.value! - 1);
     */
    async heal(startTick, stopTick) {
      requireTick(startTick, "startTick");
      requireTick(stopTick, "stopTick");
      if (stopTick <= startTick) throw new UAError("out_of_range", "heal(): stopTick must be after startTick", { path: this.path });
      const context = this.context;
      await context.refreshSelection().catch(() => {
      });
      const saved = context.snapshot();
      try {
        await context.select({ startTick, stopTick, playlistUids: [this.id] });
        await this.contextPost("heal_separation", {});
      } finally {
        await context.restore(saved).catch(() => {
        });
      }
    }
    /**
     * Fade in and out every clip on the lane between two ticks, `lengthNs` long, the way
     * LUNA's Batch Fades does: butted clips get a crossfade. LUNA picks the lane through its
     * track, so this works only on the track's active playlist (fact 117). One undo step.
     *
     * @example
     * await lane.addFades({ startTick: 0, stopTick: session.transport.maxTick.value!, lengthNs: 10_000_000 });
     */
    async addFades(options) {
      requireTick(options.startTick, "startTick");
      requireTick(options.stopTick, "stopTick");
      if (!(options.lengthNs > 0)) throw new UAError("out_of_range", "addFades(): lengthNs must be positive", { path: this.path });
      const shape = requireFadeShape(options.shape, "addFades()");
      const track = this.trackUid.value;
      if (!track || this.client.store.cell(`/sessions/${this.sessionUid}/tracks/${track}`, "playlist_uid").value !== this.id) {
        throw new UAError("unavailable", "addFades(): LUNA fades only a track's active playlist", { path: this.path });
      }
      await this.contextPost("batch_fades", { track_uid: [track], start: options.startTick, stop: options.stopTick, length: Math.round(options.lengthNs), ...shape ? { fade_shape: shape } : {} });
    }
    /**
     * Remove every fade, crossfades included, that lies wholly between two ticks on this lane
     * (LUNA's `delete_fades`). One undo step.
     *
     * @example
     * await lane.deleteFades(0, session.transport.maxTick.value!);
     */
    async deleteFades(startTick, stopTick) {
      requireTick(startTick, "startTick");
      requireTick(stopTick, "stopTick");
      await this.contextPost("delete_fades", { playlist_uid: [this.id], start: startTick, stop: stopTick });
    }
    contextPost(command, payload) {
      if (this.disposed) return Promise.reject(new UAError("disposed", "the playlist is gone", { path: this.path }));
      return this.wire.post(`/sessions/${this.sessionUid}/contexts/main/commands/${command}`, { session_uid: this.sessionUid, ...payload });
    }
    release() {
      this.clips.dispose();
      this.compiledClips.dispose();
    }
  };

  // src/model/analysis.ts
  var AnalysisNode = class extends Node {
    /** Which analysis this is. */
    kind;
    /** How many entries the result holds (overview pairs, transients, chord segments, guesses). */
    count;
    /** Digest of the stored result; `null` while a recording still writes it. Key a cache on it. */
    md5;
    version;
    versionMinor;
    /** @internal */
    constructor(client, sourcePath, kind) {
      super(client, `${sourcePath}/analysis/${kind}`);
      this.kind = kind;
      this.count = this.prop("count");
      this.md5 = this.prop("md5");
      this.version = this.prop("version");
      this.versionMinor = this.prop("version_minor");
    }
    /**
     * The stored result as LUNA sends it (`{ version, version_minor, index, count, data, ... }`),
     * or `undefined` when there is none. LUNA answers nothing unless a count is asked for, so
     * this asks for all of it unless `count` is given (fact 205).
     *
     * @example
     * const raw = await source.analysis.chord.readRaw();
     */
    async readRaw(options = {}) {
      const { index = 0, count = -1 } = options;
      if (!Number.isSafeInteger(index) || index < 0 || !Number.isSafeInteger(count) || count === 0 || count < -1) {
        throw new UAError("out_of_range", "readRaw(): index must be >= 0 and count -1 or positive", { path: this.path });
      }
      const query = `count=${count}${index > 0 ? `&index=${index}` : ""}`;
      const reply = await this.wire.get(`${this.path}/file/data?${query}`, { properties: true }).catch(() => void 0);
      const value = reply && typeof reply === "object" && "value" in reply ? reply.value : reply;
      if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length === 0) return void 0;
      return value;
    }
  };
  var num = (v) => typeof v === "number" && Number.isFinite(v) ? v : void 0;
  var str = (v) => typeof v === "string" ? v : void 0;
  var obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
  var nums = (v) => Array.isArray(v) || ArrayBuffer.isView(v) ? Array.from(v, (x) => Number(x)) : [];
  var flag = (v) => v === void 0 || v === null ? void 0 : v === true || v === 1;
  var KeyAnalysis = class extends AnalysisNode {
    /** @internal */
    constructor(client, sourcePath) {
      super(client, sourcePath, "key");
    }
    /** @example const r = await source.analysis.key.read(); */
    async read() {
      const raw = await this.readRaw();
      if (!raw) return void 0;
      const list = obj(raw["data"])["keyData"];
      const candidates = (Array.isArray(list) ? list : []).flatMap((c) => {
        const o = obj(c);
        const key = str(o["key"]);
        return key === void 0 ? [] : [{ key, confidence: num(o["confidence"]) ?? 0 }];
      });
      return { candidates, raw };
    }
  };
  var TempoAnalysis = class extends AnalysisNode {
    /** @internal */
    constructor(client, sourcePath) {
      super(client, sourcePath, "tempo");
    }
    /** @example const r = await source.analysis.tempo.read(); */
    async read() {
      const raw = await this.readRaw();
      if (!raw) return void 0;
      const data = obj(raw["data"]);
      const list = data["tempoData"];
      const candidates = (Array.isArray(list) ? list : []).flatMap((c) => {
        const o = obj(c);
        const bpm = num(o["bpm"]);
        return bpm === void 0 ? [] : [{ bpm, ticksPerBeat: num(o["tickPerBeat"]), clamped: flag(o["clamped"]), raw: o }];
      });
      return { candidates, timeUnitS: num(data["timeUnit_s"]), sampleRate: num(data["sampleRate"]), tempoIsConstant: flag(data["tempoIsConstant"]), raw };
    }
  };
  var InstrumentAnalysis = class extends AnalysisNode {
    /** @internal */
    constructor(client, sourcePath) {
      super(client, sourcePath, "instrument");
    }
    /** @example const r = await source.analysis.instrument.read(); */
    async read() {
      const raw = await this.readRaw();
      if (!raw) return void 0;
      const classes = raw["classes"];
      return {
        instrument: str(raw["instrument"]) ?? "",
        confidence: num(raw["confidence"]) ?? 0,
        classes: Array.isArray(classes) ? classes.map(String) : void 0,
        classIdIndex: num(raw["classIDIndex"]),
        raw
      };
    }
  };
  var TransientAnalysis = class extends AnalysisNode {
    /** @internal */
    constructor(client, sourcePath) {
      super(client, sourcePath, "transients");
    }
    /**
     * One page; without `count`, all of them.
     *
     * @example const all = await source.analysis.transients.read();
     */
    async read(options = {}) {
      const raw = await this.readRaw(options);
      if (!raw) return void 0;
      const data = obj(raw["data"]);
      const locations = nums(data["location"]);
      const levels = nums(data["level"]);
      return { index: num(raw["index"]) ?? options.index ?? 0, count: locations.length, locations, levels, timeUnitS: num(data["timeUnit_s"]), sampleRate: num(data["sampleRate"]), raw };
    }
  };
  var ChordAnalysis = class extends AnalysisNode {
    /** @internal */
    constructor(client, sourcePath) {
      super(client, sourcePath, "chord");
    }
    /** @example const r = await source.analysis.chord.read(); */
    async read() {
      const raw = await this.readRaw();
      if (!raw) return void 0;
      const list = raw["data"];
      const segments = (Array.isArray(list) ? list : []).flatMap((s) => {
        const o = obj(s);
        const name = str(o["chord_complex_pop"]);
        const start = num(o["start"]);
        const end = num(o["end"]);
        return name === void 0 || start === void 0 || end === void 0 ? [] : [{ name, start, end }];
      });
      return { key: str(raw["key"]), segments, raw };
    }
  };
  var SourceAnalysis = class {
    /** @internal */
    constructor(client, sourcePath) {
      this.client = client;
      this.path = `${sourcePath}/analysis`;
      this.overview = new AnalysisNode(client, sourcePath, "overview");
      this.overviewCoarse = new AnalysisNode(client, sourcePath, "overview_coarse");
      this.key = new KeyAnalysis(client, sourcePath);
      this.tempo = new TempoAnalysis(client, sourcePath);
      this.instrument = new InstrumentAnalysis(client, sourcePath);
      this.transients = new TransientAnalysis(client, sourcePath);
      this.chord = new ChordAnalysis(client, sourcePath);
      const names = client.store.children(this.path);
      this.kinds = derived([names], () => names.value ?? []);
    }
    client;
    overview;
    overviewCoarse;
    key;
    tempo;
    instrument;
    transients;
    chord;
    /** The analyses LUNA has for this source, by node name. Includes kinds the SDK does not name. */
    kinds;
    /** `<source>/analysis`. */
    path;
    /**
     * Read every analysis node's `count`, `md5` and versions once.
     *
     * @example await source.analysis.load();
     */
    async load() {
      await this.client.store.load(this.path, { levels: 2, commands: false, flatvalue: true });
    }
    /**
     * Subscribe so the analysis props follow LUNA: a new analysis appearing, a count growing, a
     * digest changing. Call `release` when done.
     *
     * @example
     * const w = source.analysis.watch();
     * await w.ready;
     * source.analysis.overview.count.onChange(() => redraw());
     * // later: w.release();
     */
    watch() {
      return this.client.store.watch(this.path, { recursive: true, load: { levels: 2, commands: false, flatvalue: true } });
    }
  };

  // src/model/audio-source.ts
  var FIXED16_SCALE = 32768;
  var MAX_PAGE = 4096;
  var MAX_CHANNELS = 64;
  var analysisName = (kind) => kind === "coarse" ? "overview_coarse" : "overview";
  var AudioSource = class extends Node {
    name;
    /** `mono` or `stereo`. */
    stemFormat;
    /** Duration in nanoseconds. */
    length;
    sampleRate;
    created;
    /**
     * The name to show: `name`, or `undefined` when the file has none. LUNA names some sources
     * with their own uid (fact 238); a blank name, or one that is the uid (with or without dashes
     * or an extension), counts as none. Show your own label then, such as the clip's name.
     *
     * @example
     * row.textContent = source.displayName.value ?? `Untitled (${source.seconds?.toFixed(1)} s)`;
     */
    displayName;
    /**
     * Where the file came from, LUNA's number for it (fact 239): see {@link SourceOrigin}.
     * `undefined` on a LUNA that does not publish it.
     */
    origin;
    /** LUNA's audio file format name, e.g. `wav` (fact 239). */
    format;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.name = this.prop("name");
      this.stemFormat = this.prop("stem_format");
      this.length = this.prop("length");
      this.sampleRate = this.prop("sample_rate");
      this.created = this.prop("created");
      this.displayName = derived([this.name], () => sourceDisplayName(this.name.value, this.id), { distinct: true });
      this.origin = this.prop("origin");
      this.format = this.prop("format");
    }
    /** True when LUNA named the file (see {@link displayName}). */
    get hasName() {
      return this.displayName.value !== void 0;
    }
    /**
     * True for a clip rendering (LUNA's own pass of a clip through its clip effects, time
     * stretch or sample-rate conversion), which LUNA keeps under `renders/clips/` and remakes as
     * needed, rather than a recording, import or bounce (fact 239).
     *
     * @example const files = sources.items.filter((s) => !s.isRender);
     */
    get isRender() {
      const o = this.origin.value;
      return o === SourceOrigin.ClipRendering || o === SourceOrigin.ClipRenderingIntermediate;
    }
    /** The session package uid this file belongs to, from its path. */
    get packageUid() {
      return this.path.split("/")[3] ?? "";
    }
    /**
     * The file's absolute path on disk (fact 239): `<package>/audio/<uid>.wav`, or
     * `<package>/renders/clips/<uid>.wav` for a rendering. Reads the package's folder from the
     * workspace once and keeps it. `undefined` when the package is unknown.
     *
     * Inside a session, `session.sourcePath(source)` answers the same without a read, which a
     * drag needs (see `Luna.startSourceDrag`).
     *
     * @example
     * const path = await source.filePath();
     */
    async filePath() {
      if (this.origin.value === void 0) await this.load({ children: false, commands: false, flatvalue: true }).catch(() => void 0);
      const pkg = await packagePath(this.client, this.packageUid);
      return pkg === void 0 ? void 0 : sourceFilePath(pkg, this.id, this.isRender);
    }
    /**
     * Show the file in Finder or Explorer (`luna.gui.revealPath`). Rejects with `unavailable`
     * when the path is unknown.
     *
     * @example revealButton.onclick = () => void source.reveal();
     */
    async reveal() {
      const path = await this.filePath();
      if (!path) throw new UAError("unavailable", "reveal(): the file path of this source is not known", { path: this.path });
      await this.client.gui.revealPath(path);
    }
    /**
     * Every analysis LUNA keeps for this file (key, tempo, instrument, transients, chord and the
     * overviews), with live `count` and `md5` props (fact 205). Created on first use.
     *
     * @example
     * const w = source.analysis.watch();
     * await w.ready;
     * source.analysis.overview.count.onChange(() => redraw(source.analysis.overview.count.value));
     */
    get analysis() {
      this.analyses ??= new SourceAnalysis(this.client, this.path);
      return this.analyses;
    }
    analyses;
    get channelCount() {
      return this.stemFormat.value === "stereo" ? 2 : 1;
    }
    /** Duration in seconds. */
    get seconds() {
      const ns = this.length.value;
      return ns === void 0 ? void 0 : ns / 1e9;
    }
    /**
     * The analysis node's pair count and digest, or `undefined` when there is no analysis yet
     * (a file LUNA has not finished scanning, or a render it has named but not written).
     *
     * @example
     * const info = await source.overviewInfo();
     * if (info) for (let n = 0; n * 1024 < info.count; n++) draw(await source.overview({ index: n * 1024 }));
     */
    async overviewInfo(options = {}) {
      const kind = options.kind ?? "fine";
      const reply = await this.client.raw.get(`${this.path}/analysis/${analysisName(kind)}`, { children: false, commands: false, propfilter: ["count", "md5"] }).catch(() => void 0);
      const count = readProperty(reply, "count");
      if (typeof count !== "number" || !Number.isInteger(count) || count < 0) return void 0;
      const md5 = readProperty(reply, "md5");
      return Object.freeze({ count, md5: typeof md5 === "string" ? md5 : void 0 });
    }
    /**
     * Read one bounded page of the waveform overview. Bins are int16 min/max pairs per channel
     * on the wire; here they are floats in -1..1.
     *
     * A bare number is the legacy form and means `{ index }` with the default count.
     *
     * @example
     * const page = await source.overview({ index: 0, count: 512, kind: 'coarse' });
     */
    async overview(options = {}) {
      const { index = 0, count = 1024, kind = "fine" } = typeof options === "number" ? { index: options } : options;
      if (!Number.isSafeInteger(index) || index < 0 || !Number.isSafeInteger(count) || count < 1 || count > MAX_PAGE) {
        throw new UAError("out_of_range", `overview(): index must be >= 0 and count 1-${MAX_PAGE}`, { path: this.path });
      }
      const path = `${this.path}/analysis/${analysisName(kind)}/file/data`;
      const query = `count=${count}${index > 0 ? `&index=${index}` : ""}`;
      const reply = await this.client.raw.get(`${path}?${query}`, { properties: true });
      const value = reply && "value" in reply ? reply.value : reply;
      if (!value || !Array.isArray(value.data)) return void 0;
      if (value.data.length > MAX_CHANNELS) throw new UAError("invalid_response", "overview(): implausible channel count", { path });
      const channels = value.data.map((ch) => ({ min: toFloats(ch.min, count, path), max: toFloats(ch.max, count, path) }));
      const returned = channels[0]?.min.length ?? 0;
      if (channels.some((ch) => ch.min.length !== returned || ch.max.length !== returned)) {
        throw new UAError("invalid_response", "overview(): channels disagree on length", { path });
      }
      return { index, count: returned, kind, binsPerSecond: 1e9 / pairNs(kind), channels };
    }
  };
  var SourceOrigin = {
    Unknown: 0,
    Recording: 1,
    Import: 2,
    Consolidate: 3,
    TrackFreeze: 4,
    Bounce: 5,
    Sync: 6,
    Staging: 7,
    ClipRendering: 8,
    ClipRenderingIntermediate: 9
  };
  function sourceDisplayName(name, uid) {
    if (typeof name !== "string") return void 0;
    const trimmed = name.trim();
    if (trimmed === "") return void 0;
    const bare = (s) => s.replace(/\.[a-z0-9]{1,5}$/i, "").replaceAll("-", "").toLowerCase();
    return bare(trimmed) === bare(uid) ? void 0 : name;
  }
  function sourceFilePath(packagePath2, uid, isRender) {
    const sep = packagePath2.includes("\\") && !packagePath2.includes("/") ? "\\" : "/";
    const root = packagePath2.replace(/[\\/]+$/, "");
    const file = `${uid.replaceAll("-", "").toLowerCase()}.wav`;
    return isRender ? [root, "renders", "clips", file].join(sep) : [root, "audio", file].join(sep);
  }
  var packagePaths = /* @__PURE__ */ new WeakMap();
  function packagePath(client, packageUid) {
    let byUid = packagePaths.get(client);
    if (!byUid) packagePaths.set(client, byUid = /* @__PURE__ */ new Map());
    let found = byUid.get(packageUid);
    if (!found) {
      found = client.raw.get(`/workspace/sessions/${packageUid}`, { children: false, commands: false, flatvalue: true, propfilter: ["directory_path", "file_name"] }).then((reply) => {
        const dir = readProperty(reply, "directory_path");
        const file = readProperty(reply, "file_name");
        if (typeof dir !== "string" || typeof file !== "string" || !dir || !file) return void 0;
        const sep = dir.includes("\\") && !dir.includes("/") ? "\\" : "/";
        return `${dir.replace(/[\\/]+$/, "")}${sep}${file}`;
      }).catch(() => void 0);
      found.then((p) => {
        if (p === void 0) byUid.delete(packageUid);
      });
      byUid.set(packageUid, found);
    }
    return found;
  }
  var OVERVIEW_PAIR_NS = 125e9 / 48e3;
  var COARSE_PAIRS_PER_FINE = 12;
  var COARSE_PAIR_NS = OVERVIEW_PAIR_NS * COARSE_PAIRS_PER_FINE;
  function pairNs(kind) {
    return kind === "coarse" ? COARSE_PAIR_NS : OVERVIEW_PAIR_NS;
  }
  function readProperty(reply, name) {
    if (typeof reply !== "object" || reply === null) return void 0;
    const node = reply;
    const properties = node["properties"];
    if (Array.isArray(properties)) {
      for (const entry of properties) {
        if (typeof entry === "object" && entry !== null && entry.name === name) return unwrap(entry.value);
      }
    } else if (typeof properties === "object" && properties !== null && name in properties) {
      return unwrap(properties[name]);
    }
    if (name in node) return unwrap(node[name]);
    return void 0;
  }
  function unwrap(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value) && "value" in value ? value.value : value;
  }
  function toFloats(ints, limit, path) {
    if (ints && ints.length > limit) throw new UAError("invalid_response", "overview(): page longer than requested", { path });
    const out = new Float32Array(ints?.length ?? 0);
    if (ints) for (let i = 0; i < ints.length; i++) out[i] = Number(ints[i]) / FIXED16_SCALE;
    return out;
  }

  // src/model/record.ts
  var RecordMidiRow = class extends Node {
    /** Session tick (fact 149). */
    tick;
    /** The three MIDI bytes packed into one number (fact 39). */
    midiData;
    constructor(client, path) {
      super(client, path);
      this.tick = this.prop("tick");
      this.midiData = this.prop("midi_data");
    }
  };
  var RecordTake = class extends Node {
    /** @internal */
    constructor(client, path, sessionPath) {
      super(client, path);
      this.sessionPath = sessionPath;
      this.trackUid = this.prop("track_uid");
      this.inputNodeUid = this.prop("input_node_uid");
      this.start = this.prop("start");
      this.stop = this.prop("stop");
      this.sourceUid = this.prop("source_uid");
      this.sourceStart = this.prop("source_start");
      this.sourceStop = this.prop("source_stop");
      this.rows = new Collection(client, `${path}/midi`, (p) => new RecordMidiRow(client, p), { levels: 2, commands: false, flatvalue: true });
      const events = derived([this.rows, this.start], () => {
        const origin = this.start.value ?? 0;
        const out = [];
        for (const row of this.rows.items) {
          const tick = row.tick.value;
          const packed = row.midiData.value;
          if (typeof tick !== "number" || typeof packed !== "number") continue;
          const rowid = Number(row.id);
          if (!Number.isFinite(rowid)) continue;
          const { status, data1, data2 } = decodeMidiData(packed);
          out.push(Object.freeze({ rowid, tick: tick - origin, status, channel: status & 15, data1, data2, enabled: true }));
        }
        return out.sort((a, b) => a.tick - b.tick || a.rowid - b.rowid);
      });
      this.events = listOf(events, (e) => String(e.rowid));
      this.notes = listOf(
        derived([events], () => pairNotes(this.events.items)),
        (n) => String(n.rowid)
      );
    }
    sessionPath;
    /** The track this take records onto. */
    trackUid;
    /** The input it records from. */
    inputNodeUid;
    /** Session tick where recording began. */
    start;
    /** Session tick reached so far; grows while recording. */
    stop;
    /** The audio file being written; `undefined` on a MIDI take. */
    sourceUid;
    /** Nanoseconds into the file where the take begins. */
    sourceStart;
    /** Nanoseconds into the file reached so far; grows while recording. */
    sourceStop;
    /** The messages recorded so far, in tick order, ticks from the take's start. */
    events;
    /** {@link events} paired into notes; a held note has no `stopTick` yet. */
    notes;
    rows;
    file;
    /**
     * True for a take on a MIDI-capable track (an instrument track): LUNA gives it a `midi`
     * folder, which its messages arrive in. Known once the take has loaded.
     */
    get isMidi() {
      return (this.childNames().value ?? []).includes("midi");
    }
    /**
     * The file being written and the part of it this take covers, for {@link Waveforms.range}
     * and {@link audioNsAtTick}; `undefined` on a MIDI take or before LUNA names the file. Its
     * overview grows as LUNA records: redraw when `stop` or `sourceStop` moves. The partial last
     * page is read again each time, so the waveform fills in.
     */
    get audio() {
      const uid = this.sourceUid.value;
      const startNs = this.sourceStart.value;
      const stopNs = this.sourceStop.value;
      if (!uid || startNs === void 0 || stopNs === void 0) return void 0;
      if (this.file?.id !== uid) this.file = new AudioSource(this.client, `${this.sessionPath}/record/audio/${uid}`);
      return Object.freeze({ source: this.file, startNs, stopNs, stretched: false });
    }
    /** @internal Read the take's properties and its MIDI so far; later messages follow pushes. */
    async ready() {
      await Promise.all([this.load({ levels: 2, commands: false, flatvalue: true }), this.rows.load()]);
    }
    release() {
      this.rows.dispose();
    }
  };
  var RecordTrack = class extends Node {
    takes;
    constructor(client, path, sessionPath) {
      super(client, path);
      this.takes = new Collection(client, path, (p) => new RecordTake(client, p, sessionPath), { levels: 2, commands: false, flatvalue: true });
    }
    release() {
      this.takes.dispose();
    }
  };
  var RecordTakes = class {
    tracks;
    listeners = /* @__PURE__ */ new Set();
    trackOffs = /* @__PURE__ */ new Map();
    tracksOff;
    loaded = false;
    /** @internal */
    constructor(client, sessionPath) {
      this.tracks = new Collection(client, `${sessionPath}/record/clips`, (p) => new RecordTrack(client, p, sessionPath), { levels: 3, commands: false, flatvalue: true });
    }
    /** Every take recording now, track by track. */
    get items() {
      return this.tracks.items.flatMap((t) => t.takes.items);
    }
    get value() {
      return this.items;
    }
    /** The take with this uid. */
    byId(id) {
      return this.items.find((t) => t.id === id);
    }
    /**
     * The takes recording on one track (normally one), by the track or its uid.
     *
     * @example
     * const [take] = session.recordTakes.forTrack(track);
     */
    forTrack(track) {
      const uid = typeof track === "string" ? track : track.id;
      return this.tracks.byId(uid)?.takes.items.slice() ?? [];
    }
    /** Called when a take starts or ends. */
    onChange(listener) {
      this.listeners.add(listener);
      this.wire();
      return () => {
        this.listeners.delete(listener);
      };
    }
    /**
     * Read the takes recording now. {@link Session.ready} does it; later takes follow pushes.
     *
     * @example
     * await session.recordTakes.load();
     */
    async load() {
      this.loaded = true;
      await this.tracks.load();
      this.wire();
      await Promise.all(this.items.map((t) => t.ready()));
    }
    /** @internal */
    dispose() {
      this.tracksOff?.();
      this.tracksOff = void 0;
      for (const off of this.trackOffs.values()) off();
      this.trackOffs.clear();
      this.listeners.clear();
      this.tracks.dispose();
    }
    /** Follow the track folders and each folder's takes; load what is new. */
    wire() {
      this.tracksOff ??= this.tracks.onChange(() => {
        this.wire();
        this.notify();
      });
      const live = new Set(this.tracks.items);
      for (const [track, off] of this.trackOffs) {
        if (!live.has(track)) {
          off();
          this.trackOffs.delete(track);
        }
      }
      for (const track of live) {
        if (this.trackOffs.has(track)) continue;
        const known = /* @__PURE__ */ new Set();
        const prime = () => {
          if (!this.loaded) return;
          for (const take of track.takes.items) {
            if (known.has(take)) continue;
            known.add(take);
            void take.ready().catch(() => {
            });
          }
        };
        if (this.loaded) void track.takes.load().then(prime, () => {
        });
        this.trackOffs.set(
          track,
          track.takes.onChange(() => {
            prime();
            this.notify();
          })
        );
        prime();
      }
    }
    notify() {
      for (const l of [...this.listeners]) {
        try {
          l();
        } catch (err) {
          console.error("[Luna] recordTakes listener threw", err);
        }
      }
    }
  };

  // src/model/source-usage.ts
  var SourceUsage = class {
    /** @internal */
    constructor(session) {
      this.session = session;
    }
    session;
    entries = [];
    byUid = /* @__PURE__ */ new Map();
    listeners = /* @__PURE__ */ new Set();
    releases = [];
    perPlaylist = /* @__PURE__ */ new Map();
    queued = false;
    disposed = false;
    /** @internal Load every playlist's clips and start following them. */
    async start() {
      await this.session.ready();
      await Promise.all(this.session.playlists.items.map((p) => p.clips.load()));
      this.followPlaylists();
      this.releases.push(
        this.session.playlists.onAnyChange(() => {
          this.followPlaylists();
          this.schedule();
        }, { props: ["trackUid"] }),
        this.session.tracks.onAnyChange(() => this.schedule(), { props: ["playlistUid"] })
      );
      this.recompute();
      return this;
    }
    /** Files in use, each with its uses. A file no clip uses is not listed. */
    get items() {
      return this.entries;
    }
    get value() {
      return this.entries;
    }
    /** The uses of one file, or `undefined` when no clip uses it. */
    byId(sourceUid) {
      return this.byUid.get(sourceUid);
    }
    /** True when some clip, on any playlist, uses the file. */
    isUsed(sourceUid) {
      return this.byUid.has(sourceUid);
    }
    /** Called whenever the usage changes. */
    onChange(listener) {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    }
    /** Stop following the session. */
    dispose() {
      this.disposed = true;
      for (const r of this.releases.splice(0)) r();
      for (const r of this.perPlaylist.values()) r();
      this.perPlaylist.clear();
      this.listeners.clear();
    }
    followPlaylists() {
      const now = new Set(this.session.playlists.items);
      for (const [playlist, release2] of this.perPlaylist) {
        if (now.has(playlist)) continue;
        release2();
        this.perPlaylist.delete(playlist);
      }
      for (const playlist of now) {
        if (this.perPlaylist.has(playlist)) continue;
        void playlist.clips.load().then(() => this.schedule(), () => void 0);
        this.perPlaylist.set(playlist, playlist.clips.onAnyChange(() => this.schedule(), { props: ["sourceUid", "renderSourceUid"] }));
      }
    }
    schedule() {
      if (this.queued || this.disposed) return;
      this.queued = true;
      queueMicrotask(() => {
        this.queued = false;
        if (!this.disposed) this.recompute();
      });
    }
    recompute() {
      const uses = /* @__PURE__ */ new Map();
      const add = (use) => {
        const list = uses.get(use.sourceUid);
        if (list) list.push(use);
        else uses.set(use.sourceUid, [use]);
      };
      for (const playlist of this.session.playlists.items) {
        const trackUid = playlist.trackUid.value;
        const active = trackUid !== void 0 && this.session.tracks.byId(trackUid)?.playlistUid.value === playlist.id;
        for (const clip of playlist.clips.items) {
          const source = clip.sourceUid.value;
          const render = clip.renderSourceUid.value;
          const base = { clipUid: clip.id, playlistUid: playlist.id, trackUid, active };
          if (source) add({ ...base, sourceUid: source, asRender: false });
          if (render && render !== source) add({ ...base, sourceUid: render, asRender: true });
        }
      }
      const entries = [];
      for (const [id, list] of uses) {
        const trackUids = [...new Set(list.map((u) => u.trackUid).filter((t) => t !== void 0))];
        entries.push(Object.freeze({ id, uses: Object.freeze(list), trackUids: Object.freeze(trackUids) }));
      }
      if (sameUsage(this.entries, entries)) return;
      this.entries = Object.freeze(entries);
      this.byUid = new Map(entries.map((e) => [e.id, e]));
      for (const l of [...this.listeners]) l();
    }
  };
  function sameUsage(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  // src/model/waveform.ts
  var WAVEFORM_PAGE = 1024;
  function kindForScale(nsPerPixel) {
    if (!Number.isFinite(nsPerPixel) || nsPerPixel <= 0) throw new UAError("out_of_range", "kindForScale(): nsPerPixel must be a positive number");
    return nsPerPixel >= COARSE_PAIR_NS ? "coarse" : "fine";
  }
  function pairRange(startNs, stopNs, kind = "fine") {
    if (!Number.isFinite(startNs) || !Number.isFinite(stopNs) || startNs < 0) {
      throw new UAError("out_of_range", "pairRange(): source offsets must be finite nanoseconds with start >= 0");
    }
    const p = pairNs(kind);
    const index = Math.floor(startNs / p);
    if (stopNs <= startNs) return Object.freeze({ index, count: 0 });
    return Object.freeze({ index, count: Math.ceil(stopNs / p) - index });
  }
  function snapshotOf(clip) {
    const uid = clip.sourceUid;
    if (typeof uid !== "object" || uid === null) return clip;
    const c = clip;
    return {
      sourceUid: c.sourceUid.value,
      sourceStartNs: c.sourceStart.value,
      sourceStopNs: c.sourceStop.value,
      renderSourceUid: c.renderSourceUid.value,
      renderState: c.renderState.value
    };
  }
  function lookup(sources, uid) {
    return Array.isArray(sources) ? sources.find((s) => s.id === uid) : sources.byId(uid);
  }
  function clipAudio(clip, sources) {
    const find = (uid) => lookup(sources, uid);
    const snap = snapshotOf(clip);
    if (snap.renderState === "current" && snap.renderSourceUid) {
      const render = find(snap.renderSourceUid);
      const length = render?.length.value;
      if (!render || length === void 0) return void 0;
      return Object.freeze({ source: render, startNs: 0, stopNs: length, stretched: true });
    }
    if (!snap.sourceUid || snap.sourceStartNs === void 0 || snap.sourceStopNs === void 0) return void 0;
    const source = find(snap.sourceUid);
    if (!source) return void 0;
    return Object.freeze({ source, startNs: snap.sourceStartNs, stopNs: snap.sourceStopNs, stretched: false });
  }
  function valueOf(v) {
    return typeof v === "object" && v !== null && "value" in v ? v.value : v;
  }
  function compiledClipAudio(timeline, segment, clip, sources) {
    const start = valueOf(segment.start);
    const stop = valueOf(segment.stop);
    if (start === void 0 || stop === void 0) return void 0;
    const render = valueOf(segment.renderSourceUid);
    if (typeof render === "string" && render) {
      const source = lookup(sources, render);
      const from = valueOf(segment.renderSourceStart);
      const to = valueOf(segment.renderSourceStop);
      const length = source?.length.value;
      if (!source || typeof from !== "number" || typeof to !== "number") return void 0;
      return Object.freeze({ source, startNs: Math.max(0, from), stopNs: length === void 0 ? to : Math.min(length, to), stretched: true });
    }
    if (valueOf(segment.needsRender) === true) return void 0;
    const whole = clipAudio(clip, sources);
    const stretchedClip = snapshotOf(clip).renderState === "current";
    if (render === null && stretchedClip) return void 0;
    if (!whole) return void 0;
    if (whole.stretched) {
      const clipStart = "startTicks" in clip ? clip.startTicks : clip.start.value;
      if (clipStart === void 0 || start !== clipStart || !timeline.tempoLoaded) return void 0;
      const at = (tick) => Math.max(0, (timeline.seconds(tick) - timeline.seconds(clipStart)) * 1e9);
      return Object.freeze({ source: whole.source, startNs: at(start), stopNs: Math.min(whole.stopNs, at(stop)), stretched: true });
    }
    const startNs = valueOf(segment.sourceStart);
    const stopNs = valueOf(segment.sourceStop);
    if (startNs === void 0 || stopNs === void 0) return void 0;
    return Object.freeze({ source: whole.source, startNs, stopNs, stretched: false });
  }
  function audioNsAtTick(timeline, clip, audio, tick) {
    const startTicks = "startTicks" in clip ? clip.startTicks : clip.start.value;
    if (startTicks === void 0) throw new UAError("out_of_range", "audioNsAtTick(): the clip has no start tick");
    const offset = timeline.seconds(tick) - timeline.seconds(startTicks);
    return audio.startNs + offset * 1e9;
  }
  var Waveforms = class {
    pages = /* @__PURE__ */ new Map();
    inFlight = /* @__PURE__ */ new Map();
    max;
    constructor(options = {}) {
      this.max = Math.max(1, options.maxPages ?? 256);
    }
    /** Pages held right now. */
    get size() {
      return this.pages.size;
    }
    /** Drop one source's pages, or everything. */
    invalidate(uid) {
      if (uid === void 0) {
        this.pages.clear();
        return;
      }
      for (const key of [...this.pages.keys()]) if (key.startsWith(`${uid}:`)) this.pages.delete(key);
    }
    /** The pairs covering `[startNs, stopNs)` of `source`, assembled from cached and fresh pages. */
    async range(source, startNs, stopNs, kind = "fine") {
      const { index, count } = pairRange(startNs, stopNs, kind);
      const p = pairNs(kind);
      if (count === 0) return Object.freeze({ kind, pairNs: p, index, count: 0, channels: Object.freeze([]), complete: true });
      const first = Math.floor(index / WAVEFORM_PAGE);
      const last = Math.floor((index + count - 1) / WAVEFORM_PAGE);
      const pages = [];
      for (let n = first; n <= last; n++) {
        const page = await this.page(source, kind, n);
        if (!page) break;
        pages.push(page);
        if (page.count < WAVEFORM_PAGE) break;
      }
      const channelCount = Math.max(0, ...pages.map((pg) => pg.channels.length));
      const channels = [];
      for (let c = 0; c < channelCount; c++) {
        const min = [];
        const max = [];
        for (const page of pages) {
          const ch = page.channels[c];
          if (!ch) continue;
          const from = Math.max(index, page.index) - page.index;
          const to = Math.min(index + count, page.index + page.count) - page.index;
          if (to <= from) continue;
          for (let i = from; i < to; i++) {
            min.push(ch.min[i]);
            max.push(ch.max[i]);
          }
        }
        channels.push(Object.freeze({ min: Float32Array.from(min), max: Float32Array.from(max) }));
      }
      const returned = channels[0]?.min.length ?? 0;
      return Object.freeze({ kind, pairNs: p, index, count: returned, channels: Object.freeze(channels), complete: returned === count });
    }
    page(source, kind, n) {
      const key = `${source.id}:${kind}:${n}`;
      const hit = this.pages.get(key);
      if (hit) {
        this.pages.delete(key);
        this.pages.set(key, hit);
        return Promise.resolve(hit);
      }
      let pending2 = this.inFlight.get(key);
      if (!pending2) {
        pending2 = source.overview({ index: n * WAVEFORM_PAGE, count: WAVEFORM_PAGE, kind }).then((page) => {
          if (page && page.count === WAVEFORM_PAGE) {
            this.pages.set(key, page);
            while (this.pages.size > this.max) this.pages.delete(this.pages.keys().next().value);
          }
          return page;
        });
        this.inFlight.set(key, pending2);
        void pending2.catch(() => {
        }).finally(() => this.inFlight.delete(key));
      }
      return pending2;
    }
  };
  function waveformPeak(range) {
    let peak = 0;
    for (const ch of range.channels) {
      for (let p = 0; p < ch.min.length; p++) peak = Math.max(peak, Math.abs(ch.min[p]), Math.abs(ch.max[p]));
    }
    return peak;
  }
  var OWN = 1;
  var BETWEEN = 2;
  function waveformColumns(range, width, nsAt, options = {}) {
    if (!Number.isInteger(width) || width < 0) throw new UAError("out_of_range", "waveformColumns(): width must be a whole number of columns >= 0");
    const gain = options.gain ?? 1;
    if (!Number.isFinite(gain) || gain <= 0) throw new UAError("out_of_range", "waveformColumns(): gain must be a finite number > 0");
    const out = range.channels.map(() => ({ min: new Float32Array(width).fill(Number.NaN), max: new Float32Array(width).fill(Number.NaN) }));
    const pairAt = (ns) => Math.floor(ns / range.pairNs) - range.index;
    const inside = (p) => p >= 0 && p < range.count;
    const reduce = (i, a, b) => {
      range.channels.forEach((ch, c) => {
        let lo = 0;
        let hi = 0;
        for (let p = a; p < b; p++) {
          if (ch.min[p] < lo) lo = ch.min[p];
          if (ch.max[p] > hi) hi = ch.max[p];
        }
        out[c].min[i] = lo;
        out[c].max[i] = hi;
      });
    };
    const state = new Uint8Array(width);
    const lefts = new Float64Array(width);
    let next = pairAt(nsAt(0));
    for (let i = 0; i < width; i++) {
      const first = next;
      next = pairAt(nsAt(i + 1));
      lefts[i] = first;
      if (!Number.isFinite(first) || !Number.isFinite(next)) continue;
      const a = Math.max(0, first);
      const b = Math.min(range.count, next);
      if (b > a) {
        reduce(i, a, b);
        state[i] = OWN;
      } else if (inside(first)) {
        state[i] = BETWEEN;
      }
    }
    const scratch = { min: new Float32Array(range.channels.length), max: new Float32Array(range.channels.length) };
    const pairValue = (p, into) => {
      range.channels.forEach((ch, c) => {
        into.min[c] = Math.min(0, ch.min[p]);
        into.max[c] = Math.max(0, ch.max[p]);
      });
    };
    for (let s = 0; s < width; s++) {
      if (state[s] !== BETWEEN) continue;
      let e = s;
      while (e < width && state[e] === BETWEEN) e++;
      const prev = { min: new Float32Array(range.channels.length), max: new Float32Array(range.channels.length) };
      if (s > 0 && state[s - 1] === OWN) out.forEach((ch, c) => {
        prev.min[c] = ch.min[s - 1];
        prev.max[c] = ch.max[s - 1];
      });
      else pairValue(lefts[s], prev);
      if (e < width && state[e] === OWN) out.forEach((ch, c) => {
        scratch.min[c] = ch.min[e];
        scratch.max[c] = ch.max[e];
      });
      else pairValue(lefts[e - 1], scratch);
      const span = e - s + 1;
      for (let i = s; i < e; i++) {
        const t = (i - s + 1) / span;
        out.forEach((ch, c) => {
          ch.min[i] = prev.min[c] + (scratch.min[c] - prev.min[c]) * t;
          ch.max[i] = prev.max[c] + (scratch.max[c] - prev.max[c]) * t;
        });
      }
      s = e - 1;
    }
    if (gain !== 1) {
      for (const ch of out) {
        for (let i = 0; i < width; i++) {
          ch.min[i] = Math.max(-1, ch.min[i] * gain);
          ch.max[i] = Math.min(1, ch.max[i] * gain);
        }
      }
    }
    return Object.freeze({ width, channels: Object.freeze(out.map((ch) => Object.freeze(ch))) });
  }
  function waveformLanes(channels, top, height, gap = 1) {
    if (!Number.isInteger(channels) || channels < 0) throw new UAError("out_of_range", "waveformLanes(): channels must be a whole number >= 0");
    const lane = channels ? height / channels : 0;
    const half = Math.max(0, lane / 2 - gap);
    return Object.freeze(Array.from({ length: channels }, (_, c) => Object.freeze({ mid: top + lane * (c + 0.5), half })));
  }
  function traceWaveform(target, channel, lane, x0, options = {}) {
    const { columnWidth = 1, axis = 0.5 } = options;
    if (!Number.isFinite(columnWidth) || columnWidth <= 0) throw new UAError("out_of_range", "traceWaveform(): columnWidth must be a finite number > 0");
    const { mid, half } = lane;
    const width = Math.min(channel.min.length, channel.max.length);
    const top = (i) => mid - axis - channel.max[i] * half;
    const bottom = (i) => mid + axis - channel.min[i] * half;
    const centre = (i) => x0 + (i + 0.5) * columnWidth;
    for (let s = 0; s < width; s++) {
      if (Number.isNaN(channel.max[s]) || Number.isNaN(channel.min[s])) continue;
      let e = s;
      while (e < width && !Number.isNaN(channel.max[e]) && !Number.isNaN(channel.min[e])) e++;
      target.moveTo(x0 + s * columnWidth, top(s));
      for (let i = s; i < e; i++) target.lineTo(centre(i), top(i));
      target.lineTo(x0 + e * columnWidth, top(e - 1));
      target.lineTo(x0 + e * columnWidth, bottom(e - 1));
      for (let i = e - 1; i >= s; i--) target.lineTo(centre(i), bottom(i));
      target.lineTo(x0 + s * columnWidth, bottom(s));
      target.closePath();
      s = e;
    }
  }

  // src/model/markers.ts
  var Marker = class extends Node {
    /** @internal */
    constructor(client, path, sessionUid, timeline) {
      super(client, path);
      this.sessionUid = sessionUid;
      this.rowid = this.prop("rowid");
      this.location = this.prop("location");
      this.name = this.prop("name");
      this.comments = this.prop("comments");
      this.color = this.prop("color");
      const maps = { value: void 0, onChange: (l) => timeline().onChange(l) };
      const at = (f) => () => {
        const tick = this.location.value;
        return tick === void 0 ? void 0 : f(timeline(), tick);
      };
      this.barBeat = derived([this.location, maps], at((t, tick) => t.barBeat(tick)), { distinct: true });
      this.seconds = derived([this.location, maps], at((t, tick) => t.tempoLoaded ? t.seconds(tick) : void 0), { distinct: true });
    }
    sessionUid;
    rowid;
    /** Position in ticks. */
    location;
    name;
    comments;
    /** ARGB packed integer. */
    color;
    /**
     * {@link location} as bar|beat, following the marker and the session's time signatures, so
     * a marker list needs no listeners of its own. Format it with `Luna.formatBarBeat`.
     * Assumes 4/4 until `session.musical` has loaded.
     *
     * @example
     * marker.barBeat.onChange(() => cell.textContent = Luna.formatBarBeat(marker.barBeat.value));
     */
    barBeat;
    /**
     * {@link location} in seconds from the session start, following the marker and the tempo
     * map. `undefined` until `session.musical` has loaded the tempo map; it never assumes a tempo.
     *
     * @example
     * marker.seconds.onChange(() => cell.textContent = Luna.formatMinSec(marker.seconds.value));
     */
    seconds;
    get row() {
      return this.rowid.value ?? Number(this.id);
    }
    /**
     * `set_marker` and `delete_marker` answer `null` whether or not the rowid matched
     * (fact 71), so each edit resolves once this marker shows it.
     */
    async edit(fields, done, what) {
      this.assertLive();
      const reply = await this.wire.post(`/sessions/${this.sessionUid}/set_marker`, { session_uid: this.sessionUid, rowid: this.row, ...fields });
      await settle(done, what, { path: this.path, disposed: () => this.disposed, refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }), flush: () => this.client.store.scheduler.flush() });
      return reply;
    }
    /** @example await marker.rename('Bridge'); */
    rename(name) {
      return this.edit({ name }, () => this.name.value === name, "rename marker");
    }
    /** @example await marker.moveTo(Luna.WHOLE_NOTE * 16); */
    moveTo(tick) {
      requireTick(tick, "marker tick");
      return this.edit({ location: tick }, () => this.location.value === tick, "move marker");
    }
    /** @example await marker.setColor(0xffff0000); */
    setColor(argb) {
      return this.edit({ color: argb }, () => this.color.value === argb, "recolor marker");
    }
    /** @example await marker.setComments('double chorus'); */
    setComments(comments) {
      return this.edit({ comments }, () => this.comments.value === comments, "comment marker");
    }
    /**
     * Delete this marker and resolve once it has left the list.
     *
     * @example await marker.delete();
     */
    async delete() {
      this.assertLive();
      const reply = await this.wire.post(`/sessions/${this.sessionUid}/delete_marker`, { session_uid: this.sessionUid, rowid: this.row });
      const parent = this.path.slice(0, this.path.lastIndexOf("/"));
      await settle(() => !(this.client.store.children(parent).value ?? []).includes(this.id), "delete marker", {
        path: this.path,
        refresh: () => this.client.store.load(parent, { levels: 2, commands: false, flatvalue: true }),
        flush: () => this.client.store.scheduler.flush()
      });
      return reply;
    }
  };
  var Markers = class extends Collection {
    /** @internal */
    constructor(client, sessionPath, sessionUid, timeline) {
      super(client, `${sessionPath}/markers`, (p) => new Marker(client, p, sessionUid, timeline), { levels: 2, commands: false, flatvalue: true });
    }
    /** Markers in timeline order. */
    get sorted() {
      return [...this.items].sort((a, b) => (a.location.value ?? 0) - (b.location.value ?? 0));
    }
    /** The last marker at or before `tick`. */
    at(tick) {
      return this.sorted.filter((m) => (m.location.value ?? 0) <= tick).at(-1);
    }
  };

  // src/model/jobs.ts
  function isTerminalJobStatus(status) {
    return status === "completed" || status === "failed" || status === "canceled";
  }
  var NO_RESULT = "job.no_result";
  var DEFAULT_START_MS = 3e4;
  var DEFAULT_DONE_MS = 30 * 6e4;
  var LATCH_CAP = 32;
  var FIELDS = {
    session_uid: "sessionUid",
    job_type: "jobType",
    status: "status",
    stage: "stage",
    error: "error",
    warning: "warning",
    target_uid: "targetUid",
    cancellable: "cancellable",
    percent_complete: "percentComplete"
  };
  function coerce(field, raw) {
    if (field === "cancellable") return raw === true || raw === 1;
    if (field === "percentComplete") return Number(raw) || 0;
    if (field === "targetUid") return typeof raw === "string" && raw !== "" ? raw : void 0;
    return raw === null || raw === void 0 ? "" : String(raw);
  }
  function blank(uid) {
    return Object.freeze({ uid, sessionUid: "", jobType: "", status: "queued", stage: "", error: "", warning: "", targetUid: void 0, cancellable: false, percentComplete: 0 });
  }
  function propertiesOf(reply) {
    if (typeof reply !== "object" || reply === null || Array.isArray(reply)) return void 0;
    const node = reply;
    const props = node["properties"];
    if (Array.isArray(props)) {
      const out = {};
      for (const e of props) if (e && typeof e === "object" && typeof e.name === "string") out[e.name] = propertyValue(e.value);
      return out;
    }
    if (props && typeof props === "object") return Object.fromEntries(Object.entries(props).map(([k, v]) => [k, propertyValue(v)]));
    return Object.keys(node).some((k) => k in FIELDS) ? node : void 0;
  }
  function jobOutcome(job) {
    if (job.status === "completed" || job.status === "failed" && job.error === NO_RESULT) {
      return { result: Object.freeze({ ...job, empty: job.error === NO_RESULT }) };
    }
    const code = job.status === "canceled" ? "canceled" : job.error || "failed";
    return { error: new UAError(code, `${job.jobType || "job"} ${job.uid} ${job.status}${job.error ? `: ${job.error}` : ""}`, { path: `/jobs/${job.uid}` }) };
  }
  var JobTracker = class {
    constructor(client) {
      this.client = client;
    }
    client;
    entries = /* @__PURE__ */ new Map();
    latched = /* @__PURE__ */ new Map();
    runs = /* @__PURE__ */ new Set();
    waiters = /* @__PURE__ */ new Set();
    seq = 0;
    refs = 0;
    release;
    offEvents;
    /** @internal */
    acquire() {
      if (this.refs++ === 0) {
        this.release = this.client.store.watch("/jobs", { recursive: true, load: false }).release;
        this.offEvents = this.client.store.onEvent((e) => this.onEvent(e));
      }
      let done = false;
      return () => {
        if (done) return;
        done = true;
        if (--this.refs === 0) {
          this.release?.();
          this.offEvents?.();
          this.release = this.offEvents = void 0;
          this.entries.clear();
        }
      };
    }
    /** The last state of a job that ended while the SDK was watching, if remembered. */
    ended(uid) {
      return this.latched.get(uid);
    }
    /** @internal */
    nextSeq() {
      return this.seq;
    }
    /** @internal */
    addRun(run2) {
      this.runs.add(run2);
      for (const [uid, e] of this.entries) if (e.fresh) run2.offer(uid, e);
    }
    /** @internal */
    dropRun(run2) {
      this.runs.delete(run2);
    }
    /** @internal Wait for one job by uid; seeds it from `seed` if the tap has not seen it. */
    waitFor(uid, seed, settle2) {
      if (!this.entries.has(uid)) this.entries.set(uid, { snap: Object.freeze({ ...blank(uid), ...stripUndefined(seed) }), seq: this.seq++, fresh: false, removed: false, reading: false });
      const waiter = { uid, settle: settle2 };
      this.waiters.add(waiter);
      return () => this.waiters.delete(waiter);
    }
    /** @internal */
    snapshot(uid) {
      return this.entries.get(uid)?.snap ?? this.latched.get(uid);
    }
    onEvent(event) {
      if (!event.path.startsWith("/jobs/")) return;
      const parts = event.path.slice("/jobs/".length).split("/");
      const uid = parts[0];
      if (!uid) return;
      if (parts.length === 1 && event.operation === "added") {
        const entry = { snap: blank(uid), seq: this.seq++, fresh: true, removed: false, reading: false };
        this.entries.set(uid, entry);
        const props = propertiesOf(event.data);
        if (props && props["job_type"] !== void 0) this.merge(uid, props);
        else this.readIdentity(uid, entry);
        this.changed(uid);
        return;
      }
      if (parts.length === 1 && event.operation === "removed") {
        const entry = this.entries.get(uid);
        if (!entry) return;
        entry.removed = true;
        if (isTerminalJobStatus(entry.snap.status)) this.latch(entry.snap);
        this.changed(uid);
        return;
      }
      if (parts.length === 2 && !event.operation) {
        const name = parts[1];
        if (!this.entries.has(uid)) this.entries.set(uid, { snap: blank(uid), seq: this.seq++, fresh: false, removed: false, reading: false });
        this.merge(uid, { [name]: event.data });
        this.changed(uid);
      }
    }
    /** Native LUNA's add carries no properties (fact 7): read who the job is for (fact 202). */
    readIdentity(uid, entry) {
      entry.reading = true;
      this.client.raw.get(`/jobs/${uid}`, { children: false, commands: false, flatvalue: true }).then(
        (reply) => {
          const props = propertiesOf(reply);
          if (props) {
            const keep = entry.removed ? ["session_uid", "job_type", "target_uid"] : Object.keys(props);
            this.merge(uid, Object.fromEntries(Object.entries(props).filter(([k]) => keep.includes(k))));
          }
        },
        () => void 0
      ).finally(() => {
        entry.reading = false;
        this.changed(uid);
      });
    }
    merge(uid, props) {
      const entry = this.entries.get(uid);
      if (!entry) return;
      const next = { ...entry.snap };
      for (const [name, raw] of Object.entries(props)) {
        const field = FIELDS[name];
        if (field) next[field] = coerce(field, propertyValue(raw));
      }
      entry.snap = Object.freeze(next);
    }
    latch(job) {
      this.latched.delete(job.uid);
      this.latched.set(job.uid, job);
      if (this.latched.size > LATCH_CAP) this.latched.delete(this.latched.keys().next().value);
    }
    changed(uid) {
      const entry = this.entries.get(uid);
      if (!entry) return;
      for (const run2 of [...this.runs]) run2.offer(uid, entry);
      for (const w of [...this.waiters]) {
        if (w.uid !== uid) continue;
        if (isTerminalJobStatus(entry.snap.status) || entry.removed) w.settle(entry.snap, entry.removed);
      }
      if (entry.removed && !entry.reading) this.entries.delete(uid);
    }
    /** @internal Fresh entries seen at or after `seq`, for a run's last-resort match. */
    freshSince(seq) {
      let n = 0;
      for (const e of this.entries.values()) if (e.fresh && e.seq >= seq) n++;
      return n;
    }
  };
  function stripUndefined(value) {
    if (!value) return {};
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== void 0));
  }
  var trackers = /* @__PURE__ */ new WeakMap();
  function jobTracker(client) {
    let t = trackers.get(client);
    if (!t) trackers.set(client, t = new JobTracker(client));
    return t;
  }
  var JobRun = class {
    /** @internal Create before posting the launch command, then hand it the post with {@link launched}. */
    constructor(client, criteria, options = {}) {
      this.client = client;
      this.criteria = criteria;
      const scheduler = client.store.scheduler;
      this.snapCell = new Cell(scheduler);
      this.progressCell = new Cell(scheduler, 0);
      this.snapshot = this.snapCell;
      this.progress = this.progressCell;
      this.outcome = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
      this.outcome.catch(() => void 0);
      const tracker = jobTracker(client);
      this.releaseTracker = tracker.acquire();
      this.minSeq = tracker.nextSeq();
      tracker.addRun(this);
      const startMs = options.startTimeoutMs ?? DEFAULT_START_MS;
      this.startTimer = setTimeout(() => this.fail(new UAError("no_effect", `no ${criteria.jobType} job started within ${startMs} ms`)), startMs);
      const doneMs = options.timeoutMs ?? DEFAULT_DONE_MS;
      this.doneTimer = setTimeout(() => this.fail(new UAError("timeout", `${criteria.jobType} did not finish within ${doneMs} ms`)), doneMs);
    }
    client;
    criteria;
    /** The job's latest snapshot; `undefined` until LUNA starts it. */
    snapshot;
    /** 0..1 from the job's `percent_complete`, ready for a `<progress>` element. */
    progress;
    snapCell;
    progressCell;
    outcome;
    resolve;
    reject;
    pinned;
    finished = false;
    minSeq;
    releaseTracker;
    startTimer;
    doneTimer;
    /** @internal The launch post; its refusal is the run's outcome. */
    launched(post) {
      post.catch((err) => this.fail(err));
      return this;
    }
    /** The job's uid once LUNA has started it. */
    get uid() {
      return this.pinned;
    }
    /**
     * The outcome: resolves with the job's last snapshot, rejects as described on the class.
     * Calling it after the job ended answers at once.
     *
     * @example
     * const { empty } = await session.musical.chords.detect().done();
     */
    done() {
      return this.outcome;
    }
    /**
     * Lets `await run` work: a `JobRun` is a `PromiseLike` of its {@link JobResult}.
     *
     * @example
     * const result = await session.musical.chords.detect({ clip });
     */
    then(onFulfilled, onRejected) {
      return this.outcome.then(onFulfilled, onRejected);
    }
    /**
     * Ask LUNA to cancel the job. LUNA refuses once the job is no longer cancellable; the run
     * then ends however the job does. A cancel accepted ends the run with code `canceled`.
     *
     * @example
     * const run = session.lyrics.transcribe();
     * cancelButton.onclick = () => run.cancel().catch(() => undefined);
     */
    async cancel() {
      const uid = this.pinned;
      if (!uid) throw new UAError("unavailable", "cancel(): the job has not started yet");
      await this.client.raw.post(`/jobs/${uid}/commands/cancel_job`, {});
    }
    /** @internal Offered every change to a job the tracker sees. */
    offer(uid, entry) {
      if (this.finished) return;
      if (this.pinned === void 0) {
        if (!entry.fresh || entry.seq < this.minSeq) return;
        const job2 = entry.snap;
        const c = this.criteria;
        const known = job2.jobType !== "";
        const matches = known && job2.sessionUid === c.sessionUid && job2.jobType === c.jobType && (c.targetUid === void 0 || job2.targetUid === c.targetUid);
        const orphan = !known && entry.removed && !entry.reading && jobTracker(this.client).freshSince(this.minSeq) <= 1;
        if (!matches && !orphan) return;
        this.pinned = uid;
        if (this.startTimer) clearTimeout(this.startTimer);
      }
      if (uid !== this.pinned) return;
      const job = entry.snap;
      this.snapCell.update(job);
      this.progressCell.update(Math.max(0, Math.min(1, job.percentComplete / 100)));
      if (isTerminalJobStatus(job.status)) {
        const o = jobOutcome(job);
        if ("result" in o) this.finish(() => this.resolve(o.result));
        else this.fail(o.error);
      } else if (entry.removed && !entry.reading) {
        this.fail(new UAError("removed", `${job.jobType || "job"} ${uid} was removed without an ending`, { path: `/jobs/${uid}` }));
      }
    }
    fail(err) {
      this.finish(() => this.reject(err));
    }
    finish(settle2) {
      if (this.finished) return;
      this.finished = true;
      if (this.startTimer) clearTimeout(this.startTimer);
      if (this.doneTimer) clearTimeout(this.doneTimer);
      jobTracker(this.client).dropRun(this);
      this.releaseTracker();
      settle2();
    }
  };
  function launchJob(client, criteria, post, options) {
    const run2 = new JobRun(client, criteria, options);
    return run2.launched(Promise.resolve().then(post));
  }
  function extractionTarget(client, options) {
    const clip = options.clip;
    if (clip === void 0) return { clipUid: void 0, trackUid: options.trackUid };
    if (typeof clip === "string") return { clipUid: clip, trackUid: options.trackUid };
    const clipUid = clip.uid?.value ?? clip.id;
    const at = clip.path.lastIndexOf("/clips/");
    const playlist = at > 0 ? clip.path.slice(0, at) : void 0;
    const track = playlist ? client.store.cell(playlist, "track_uid").value : void 0;
    return { clipUid, trackUid: options.trackUid ?? (typeof track === "string" && track ? track : void 0) };
  }
  function runExtraction(client, sessionUid, command, jobType, options, extra = {}) {
    const { clipUid, trackUid } = extractionTarget(client, options);
    const context = options.context ?? "main";
    const body = { session_uid: sessionUid, ...extra };
    if (clipUid !== void 0) body["clip_uid"] = clipUid;
    if (context !== "main") body["context_type"] = context;
    const runOptions = {};
    if (options.startTimeoutMs !== void 0) runOptions.startTimeoutMs = options.startTimeoutMs;
    if (options.timeoutMs !== void 0) runOptions.timeoutMs = options.timeoutMs;
    const criteria = { sessionUid, jobType };
    if (trackUid !== void 0) criteria.targetUid = trackUid;
    return launchJob(client, criteria, () => client.raw.post(`/sessions/${sessionUid}/contexts/${context}/commands/${command}`, body), runOptions);
  }

  // src/model/lyrics.ts
  var NO_SOURCE = /^[0-]*$/;
  var sessionUidOf = (path) => path.split("/")[2] ?? "";
  function requireText(text, what) {
    if (typeof text !== "string" || text === "") throw new UAError("out_of_range", `${what} must be a non-empty string`);
    return text;
  }
  var Lyric = class extends Node {
    rowid;
    /** Where the line starts: a tick for a ruler line, nanoseconds into its source for a transcribed one. */
    location;
    /** How long the line lasts, in the same units as {@link location}. */
    length;
    text;
    /** The audio source a transcribed line came from; LUNA's nil uid for a ruler line. */
    sourceUid;
    /** The line's words with their timing, when LUNA has it (a transcribed line). */
    words;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.rowid = this.prop("rowid");
      this.location = this.prop("location");
      this.length = this.prop("length");
      this.text = this.prop("text");
      this.sourceUid = this.prop("source_uid");
      const raw = this.prop("words");
      this.words = derived([raw], () => parseWords(raw.value), { distinct: true });
    }
    /**
     * Whether the line was transcribed from a recording: it names a source, and its
     * {@link location} is nanoseconds into that source rather than a tick.
     *
     * @example
     * const lines = session.lyrics.sorted.filter((l) => !l.transcribed);   // the ruler's, in ticks
     */
    get transcribed() {
      return !NO_SOURCE.test(this.sourceUid.value ?? "");
    }
    get row() {
      return this.rowid.value ?? Number(this.id);
    }
    get sessionUid() {
      return sessionUidOf(this.path);
    }
    async edit(fields, done, what) {
      this.assertLive();
      const source = this.transcribed ? { source_uid: this.sourceUid.value } : {};
      await this.wire.post(`/sessions/${this.sessionUid}/set_lyric`, { session_uid: this.sessionUid, rowid: this.row, ...source, ...fields });
      await settle(done, what, { path: this.path, disposed: () => this.disposed, refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }), flush: () => this.client.store.scheduler.flush() });
    }
    /**
     * Change the line's text and resolve once LUNA shows it. One undo entry. The words and their
     * timings are left as they were. Rejects with `out_of_range` for an empty string (LUNA would
     * ignore it); to remove a line, {@link delete} it.
     *
     * @example await line.setText('Here comes the sun');
     */
    async setText(text) {
      const wanted = requireText(text, "lyric text");
      if (this.text.value === wanted) return;
      await this.edit({ text: wanted }, () => this.text.value === wanted, "set lyric text");
    }
    /**
     * Move the line to `location`, in its own units: a tick for a ruler line, nanoseconds into
     * its source for a transcribed one. Another line of the same kind already at `location` is
     * replaced, as in LUNA (fact 153). One undo entry.
     *
     * @example await line.moveTo(line.location.value! + Luna.WHOLE_NOTE);
     */
    async moveTo(location) {
      requireTick(location, "lyric location");
      if (this.location.value === location) return;
      await this.edit({ location }, () => this.location.value === location, "move lyric");
    }
    /**
     * Delete this line and resolve once it has left {@link Lyrics}. One undo entry.
     *
     * @example await line.delete();
     */
    async delete() {
      this.assertLive();
      await this.wire.post(`/sessions/${this.sessionUid}/delete_lyric`, { session_uid: this.sessionUid, rowid: this.row });
      const parent = this.path.slice(0, this.path.lastIndexOf("/"));
      await settle(() => !(this.client.store.children(parent).value ?? []).includes(this.id), "delete lyric", {
        path: this.path,
        refresh: () => this.client.store.load(parent, { levels: 2, commands: false, flatvalue: true }),
        flush: () => this.client.store.scheduler.flush()
      });
    }
  };
  var Lyrics = class extends Collection {
    /** @internal */
    constructor(client, sessionPath) {
      super(client, `${sessionPath}/lyrics`, (p) => new Lyric(client, p), { levels: 2, commands: false, flatvalue: true });
      this.sessionUid = sessionPath.slice(sessionPath.lastIndexOf("/") + 1);
    }
    sessionUid;
    /**
     * Transcribe the lyrics of a clip, or of the edit context's selection, as LUNA's Transcribe
     * Lyrics does: `extract_lyrics`, which runs as a `lyric_transcription` job (facts 200, 204).
     * The transcribed lines arrive in this list, each naming its source and placed in
     * nanoseconds into it (fact 152); with `addToRuler` LUNA also writes ruler lines in ticks.
     * The returned {@link JobRun} reports progress and resolves when the job completes, with
     * `empty: true` when there was nothing to transcribe.
     *
     * @example
     * const run = session.lyrics.transcribe({ clip, provider: (await session.lyrics.providers()).defaultProvider });
     * await run;
     * session.lyrics.sorted.filter((l) => l.sourceUid.value === clip.sourceUid.value).map((l) => l.text.value);
     */
    transcribe(options = {}) {
      const extra = {};
      if (options.provider !== void 0) extra["provider"] = options.provider;
      if (options.addToRuler !== void 0) extra["add_to_session"] = options.addToRuler;
      return runExtraction(this.client, this.sessionUid, "extract_lyrics", "lyric_transcription", options, extra);
    }
    /**
     * Read which transcription providers LUNA has. LUNA computes these when asked and pushes
     * no change (fact 204), so this is a read, not a prop.
     *
     * @example
     * const { available, providers, defaultProvider } = await session.lyrics.providers();
     */
    async providers() {
      const reply = await this.client.raw.get("/lyric_transcription", { children: false, commands: false, flatvalue: true });
      const props = reply && typeof reply["properties"] === "object" && reply["properties"] !== null ? reply["properties"] : reply ?? {};
      const unwrap2 = (v) => v && typeof v === "object" && !Array.isArray(v) && "value" in v ? v.value : v;
      const list = unwrap2(props["providers"]);
      const def = unwrap2(props["default_provider"]);
      return {
        available: unwrap2(props["available"]) === true,
        providers: Array.isArray(list) ? list.map(String) : [],
        defaultProvider: typeof def === "string" ? def : ""
      };
    }
    /**
     * The lines by {@link Lyric.location}. Ruler and transcribed lines are in different units,
     * so sort within one kind.
     *
     * @example
     * session.lyrics.sorted.filter((l) => l.sourceUid.value === source.id).map((l) => l.text.value);
     */
    get sorted() {
      return [...this.items].sort((a, b) => (a.location.value ?? 0) - (b.location.value ?? 0));
    }
    /**
     * Add a line at `location` and resolve to it once it is listed. A ruler line by default,
     * at a tick; with `sourceUid`, a line of that recording's lyrics, at nanoseconds into it.
     * A line of the same kind already at `location` is replaced, as in LUNA (fact 153). One
     * undo entry.
     *
     * @example
     * const line = await session.lyrics.add(Luna.WHOLE_NOTE * 8, 'Second verse');
     */
    async add(location, text, options = {}) {
      requireTick(location, "lyric location");
      requireText(text, "lyric text");
      if (options.length !== void 0) requireTick(options.length, "lyric length");
      await this.load();
      const sessionUid = sessionUidOf(this.path);
      const key = (l) => `${l.location.value}|${l.text.value}|${l.transcribed ? l.sourceUid.value : ""}`;
      const wanted = `${location}|${text}|${options.sourceUid ?? ""}`;
      const before = new Map(this.items.map((l) => [l.id, key(l)]));
      const payload = { session_uid: sessionUid, location, text };
      if (options.length !== void 0) payload["length"] = options.length;
      if (options.sourceUid !== void 0) payload["source_uid"] = options.sourceUid;
      await this.client.raw.post(`/sessions/${sessionUid}/set_lyric`, payload);
      const already = [...before.values()].includes(wanted);
      const isIt = (l) => key(l) === wanted && (already || before.get(l.id) !== wanted);
      await settle(() => this.items.some(isIt), "add lyric", {
        path: this.path,
        refresh: () => this.reload(),
        flush: () => this.client.store.scheduler.flush()
      });
      return this.items.find(isIt);
    }
  };
  function parseWords(json) {
    if (!json) return [];
    try {
      const words = JSON.parse(json).words;
      if (!Array.isArray(words)) return [];
      return words.flatMap((w) => {
        const { word, offset, length } = w ?? {};
        return typeof word === "string" ? [{ word, offset: Number(offset) || 0, length: Number(length) || 0 }] : [];
      });
    } catch {
      return [];
    }
  }

  // src/model/preference-context.ts
  var NAME = /^[^/]+$/;
  var PreferenceContext = class {
    /** @internal */
    constructor(client, name) {
      this.client = client;
      if (typeof name !== "string" || !NAME.test(name)) {
        throw new UAError("out_of_range", `preferences.context(): "${String(name)}" is not a context name (not empty, no "/")`);
      }
      this.name = name;
    }
    client;
    /** The `/preferences` context the values live in. */
    name;
    initialised = /* @__PURE__ */ new Set();
    /**
     * The value stored under `key`, or `undefined` when there is none. LUNA reads a context
     * from disk only when a preference in it is initialised (fact 232), so this initialises
     * `key` first; an existing value is kept.
     *
     * @example
     * const last = await prefs.get<string>('lastPreset');
     */
    async get(key) {
      await this.init(key);
      const node = await this.client.raw.get(`/preferences/${this.name}`, { properties: true });
      const value = node?.properties?.[key]?.value;
      return value ?? void 0;
    }
    /**
     * Store `value` (any JSON) under `key`. LUNA writes it to disk at once (fact 232). Store
     * `null` to clear it; LUNA has no way to remove a preference.
     *
     * @example
     * await prefs.set('lastPreset', preset.uid);
     */
    async set(key, value) {
      await this.init(key);
      await this.client.raw.set(`/preferences/${this.name}/${key}`, value === void 0 ? null : value);
    }
    async init(key) {
      if (typeof key !== "string" || !NAME.test(key)) throw new UAError("out_of_range", `preferences: "${String(key)}" is not a preference name`);
      if (this.initialised.has(key)) return;
      await this.client.raw.post("/preferences/init_preference", { context: this.name, preference: key });
      this.initialised.add(key);
    }
  };

  // src/model/error-notices.ts
  var ErrorNotice = class extends Node {
    uid;
    /** When LUNA raised it, in seconds since the epoch; a repeat of the same notice advances it. */
    timestamp;
    level;
    /** The error code, e.g. `uasrv.launch_failed`. */
    code;
    /** The title LUNA shows, e.g. "OPEN IN LUNA". */
    title;
    /** The detail: text, or a JSON object as text (an assert's is `{error, function, file, line}`). */
    payload;
    /** The label of the notice's button, when it has one. */
    buttonTitle;
    /** The notice this one belongs to, when it is part of another. */
    parentUid;
    /** The groups it belongs to, parsed from LUNA's JSON text. */
    groups;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.uid = this.prop("uid");
      this.timestamp = this.prop("error_timestamp");
      this.level = this.prop("error_level");
      this.code = this.prop("error_code");
      this.title = this.prop("error_title");
      this.payload = this.prop("error_payload");
      this.buttonTitle = this.prop("error_btn_title");
      this.parentUid = this.prop("error_parent_uuid");
      const raw = this.prop("error_group");
      this.groups = derived([raw], () => parseGroups(raw.value), { distinct: true });
    }
  };
  var ErrorNotices = class extends Collection {
    /** @internal */
    constructor(client) {
      super(client, "/errors", (p) => new ErrorNotice(client, p), { levels: 2, commands: false, flatvalue: true });
    }
    /**
     * The notices, newest first.
     *
     * @example
     * const latest = luna.errors.sorted[0];
     */
    get sorted() {
      return [...this.items].sort((a, b) => (b.timestamp.value ?? 0) - (a.timestamp.value ?? 0));
    }
  };
  function parseGroups(value) {
    if (Array.isArray(value)) return value.filter((g) => typeof g === "string");
    if (typeof value !== "string" || value === "") return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((g) => typeof g === "string") : [value];
    } catch {
      return [value];
    }
  }

  // src/model/groups.ts
  var GROUP_ATTRIBUTES = ["edit", "mix", "plugin", "send"];
  var uidOf = (c) => typeof c === "string" ? c : c.id;
  function parseAttributes(csv) {
    if (typeof csv !== "string") return void 0;
    const seen = new Set(csv.split(/[, ]/));
    return GROUP_ATTRIBUTES.filter((a) => seen.has(a));
  }
  function attributesCsv(attributes, what) {
    const list = typeof attributes === "string" ? [attributes] : [...attributes];
    if (!list.length || list.some((a) => !GROUP_ATTRIBUTES.includes(a))) {
      throw new UAError("out_of_range", `${what}: attributes must be one or more of ${GROUP_ATTRIBUTES.join(", ")}`);
    }
    return GROUP_ATTRIBUTES.filter((a) => list.includes(a)).join(",");
  }
  var GroupMemberRow = class extends Node {
    trackUid;
    busUid;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.trackUid = this.prop("track_uid");
      this.busUid = this.prop("bus_uid");
    }
  };
  var Group = class extends Node {
    /** @internal */
    constructor(client, path, sessionUid) {
      super(client, path);
      this.sessionUid = sessionUid;
      this.name = this.prop("name");
      const csv = this.prop("group_attributes");
      this.attributes = derived([csv], () => parseAttributes(csv.value), { distinct: true });
      this.order = this.prop("order");
      this.rows = new Collection(client, `${path}/members`, (p) => new GroupMemberRow(client, p), { levels: 2, commands: false, flatvalue: true });
      this.members = derived([this.rows], () => {
        const out = [];
        for (const r of [...this.rows.items].sort((a, b) => Number(a.id) - Number(b.id))) {
          const uid = r.trackUid.value ?? r.busUid.value;
          if (typeof uid === "string" && uid && !out.includes(uid)) out.push(uid);
        }
        return out;
      }, { distinct: true });
      this.rows.load().catch(() => void 0);
    }
    sessionUid;
    name;
    /** Parsed from LUNA's `group_attributes` CSV, in the order `edit, mix, plugin, send`. */
    attributes;
    /** Display order among the session's groups, from 1. */
    order;
    /**
     * Uids of the tracks and buses in the group, each once, in the order they joined. Loaded
     * with the group; follows `addMembers`, `removeMembers` and LUNA's own edits.
     *
     * @example
     * g.members.onChange(() => render(g.members.value ?? []));
     */
    members;
    rows;
    /** @internal Resolve once the member rows are read. */
    membersLoaded() {
      return this.rows.load().then(() => this.rows.membersReady());
    }
    get session() {
      return `/sessions/${this.sessionUid}`;
    }
    waitFor(done, what) {
      return settle(done, what, { path: this.path, disposed: () => this.disposed, refresh: () => this.rows.reload(), flush: () => this.client.store.scheduler.flush() });
    }
    /**
     * Add tracks or buses to this group in one undo step, and resolve once they show in
     * {@link members}.
     *
     * @example
     * await group.addMembers([track, bus.id]);
     */
    async addMembers(channels) {
      this.assertLive();
      const uids = channels.map(uidOf);
      await this.wire.post(`${this.session}/add_group_members`, { uid: this.id, tracks: uids });
      await this.waitFor(() => uids.every((u) => (this.members.value ?? []).includes(u)), "add group members");
    }
    /**
     * Take tracks or buses out of this group in one undo step, and resolve once they have left
     * {@link members}. One that is not in it is ignored.
     *
     * @example
     * await group.removeMembers([track]);
     */
    async removeMembers(channels) {
      this.assertLive();
      const uids = channels.map(uidOf);
      await this.wire.post(`${this.session}/remove_group_members`, { uid: this.id, tracks: uids });
      await this.waitFor(() => !uids.some((u) => (this.members.value ?? []).includes(u)), "remove group members");
    }
    /**
     * Delete this group (its tracks and buses stay) and resolve once it has left
     * `session.groups`.
     *
     * @example
     * await group.delete();
     */
    async delete() {
      this.assertLive();
      await this.wire.post(`${this.session}/delete_group`, { uid: this.id });
      const parent = `${this.session}/groups`;
      await settle(() => !(this.client.store.children(parent).value ?? []).includes(this.id), "delete group", {
        path: this.path,
        refresh: () => this.client.store.load(parent, { levels: 2, commands: false, flatvalue: true }),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    release() {
      this.rows.dispose();
    }
  };
  var Groups = class extends Collection {
    /** @internal */
    constructor(client, sessionPath, sessionUid) {
      super(client, `${sessionPath}/groups`, (p) => new Group(client, p, sessionUid), { levels: 2, commands: false, flatvalue: true });
      this.sessionUid = sessionUid;
    }
    sessionUid;
    /**
     * Read the groups and each group's members.
     *
     * @example
     * await session.groups.load();
     */
    async load() {
      await super.load();
      await Promise.all(this.items.map((g) => g.membersLoaded()));
    }
    /** Groups in LUNA's display order. */
    get sorted() {
      return [...this.items].sort((a, b) => (a.order.value ?? 0) - (b.order.value ?? 0));
    }
    /**
     * Make a group in one undo step, enabled in every edit context, and resolve to it once it
     * and its members are in this list (fact 215).
     *
     * @example
     * const g = await session.groups.add({ name: 'Drums', attributes: ['mix', 'edit'], members: [kick, snare] });
     */
    async add(options) {
      const payload = { group_attributes: attributesCsv(options.attributes, "groups.add()") };
      if (options.name !== void 0) payload["name"] = options.name;
      const members = (options.members ?? []).map(uidOf);
      if (members.length) payload["tracks"] = members;
      if (options.makeNameUnique !== void 0) payload["make_name_unique"] = options.makeNameUnique;
      const reply = await this.client.raw.post(`/sessions/${this.sessionUid}/new_group`, payload);
      const uid = typeof reply?.uid === "string" ? reply.uid : void 0;
      if (!uid) throw new UAError("no_effect", "groups.add(): LUNA did not answer a group uid", { path: this.path });
      await settle(
        () => {
          const g = this.byId(uid);
          return g !== void 0 && g.name.value !== void 0 && members.every((m) => (g.members.value ?? []).includes(m));
        },
        "create group",
        { path: this.path, refresh: () => this.reload().then(() => this.byId(uid)?.membersLoaded()), flush: () => this.client.store.scheduler.flush() }
      );
      return this.byId(uid);
    }
    /**
     * Move `groups` (in the order given) to just after `after`, or to the front when `after`
     * is `null` or left out, and resolve once LUNA shows the new order. LUNA answers the same
     * whether or not it moved anything, so a move it refused rejects with `no_effect`
     * (fact 217).
     *
     * @example
     * await session.groups.reorder([vocals], { after: drums });
     * await session.groups.reorder([drums]);            // to the front
     */
    async reorder(groups, options = {}) {
      const dragged = groups.map((g) => typeof g === "string" ? g : g.id);
      if (!dragged.length) return;
      const after = options.after == null ? void 0 : typeof options.after === "string" ? options.after : options.after.id;
      const current = this.sorted.map((g) => g.id);
      const rest = current.filter((id) => !dragged.includes(id));
      const at = after === void 0 ? 0 : rest.indexOf(after) + 1;
      const expected = [...rest.slice(0, at), ...dragged, ...rest.slice(at)];
      const payload = { session_uid: this.sessionUid, dragged_uids: dragged };
      if (after !== void 0) payload["before_uid"] = after;
      await this.client.raw.post(`/sessions/${this.sessionUid}/group_change_order`, payload);
      await settle(() => this.sorted.map((g) => g.id).join() === expected.join(), "reorder groups", {
        path: this.path,
        refresh: () => this.reload(),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    /**
     * The tracks and buses an operation on `track` would reach (fact 218): the edit context's
     * selection when it holds `track`, else `track` alone, plus every member of each group that
     * holds `track` and shares an attribute with `attributes`. Reads only; changes nothing. The
     * uids come in no particular order.
     *
     * @example
     * const uids = await session.groups.affectedTracks(track, 'mix');
     */
    async affectedTracks(track, attributes, options = {}) {
      const payload = { track_uid: uidOf(track), group_attributes: attributesCsv(attributes, "affectedTracks()") };
      if (options.contextType !== void 0) payload["context_type"] = options.contextType;
      const reply = await this.client.raw.post(`/sessions/${this.sessionUid}/group_affected_tracks`, payload);
      return Array.isArray(reply?.tracks) ? reply.tracks.filter((u) => typeof u === "string") : [];
    }
  };

  // src/model/progress.ts
  var PROGRESS_SUPPRESSION_MAX_MS = 12e4;
  async function suppressProgress(post, uid, options = {}) {
    const maxMs = options.maxMs ?? PROGRESS_SUPPRESSION_MAX_MS;
    if (!(maxMs > 0) || !Number.isFinite(maxMs)) throw new UAError("out_of_range", `suppressProgress(): maxMs must be a positive number, not ${String(maxMs)}`);
    await post("add_progress_suppression", { suppression_uid: uid });
    const page = globalThis;
    let released = false;
    let releasing;
    const onPageHide = () => {
      release2().catch(() => void 0);
    };
    const timer = setTimeout(() => {
      release2().catch(() => void 0);
    }, maxMs);
    timer.unref?.();
    page.addEventListener?.("pagehide", onPageHide);
    const release2 = () => {
      if (releasing) return releasing;
      released = true;
      clearTimeout(timer);
      page.removeEventListener?.("pagehide", onPageHide);
      releasing = post("remove_progress_suppression", { suppression_uid: uid }).then(
        () => void 0,
        (err) => {
          if (err instanceof UAError && err.code === "uasrv.invalid_value") return;
          throw err;
        }
      );
      return releasing;
    };
    return {
      uid,
      get released() {
        return released;
      },
      release: release2
    };
  }

  // src/model/storage.ts
  function sameJson(a, b) {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      const other = b;
      return a.length === other.length && a.every((v, i) => sameJson(v, other[i]));
    }
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => Object.hasOwn(b, k) && sameJson(a[k], b[k]));
  }
  function asStored(value) {
    return value === void 0 ? null : JSON.parse(JSON.stringify(value));
  }
  function requireName(value, what) {
    if (typeof value !== "string" || value === "" || value.includes("/")) {
      throw new UAError("invalid_value", `${what} must be a non-empty string without '/'`);
    }
    return value;
  }
  var StorageContext = class extends Node {
    /** @internal */
    constructor(client, path, owner) {
      super(client, path);
      this.owner = owner;
      this.records = this.childNames();
    }
    owner;
    /** Names of this context's records. */
    records;
    /** The context's reverse-DNS name. */
    get name() {
      return this.id;
    }
    /**
     * Fetch this context's records and their values. Call once before reading
     * {@link value}; pushes keep them current while the session is watched.
     *
     * @example await store.load();
     */
    load() {
      return super.load({ levels: 2, commands: false, flatvalue: true });
    }
    /**
     * The value of one field as a live prop, `undefined` while it does not exist.
     * `set` on it is a non-undoable write of an existing field.
     *
     * @example
     * const timeline = store.value<{ height: number }>('layout', 'timeline');
     * timeline.onChange(() => console.log(timeline.value?.height));
     * await timeline.set({ height: 240 });
     */
    value(record, field) {
      const path = `${this.path}/${requireName(record, "record")}`;
      const cell = this.client.store.cell(path, requireName(field, "field"));
      return {
        get value() {
          return cell.value;
        },
        onChange: (listener) => cell.onChange(listener),
        set: (value) => this.set(record, field, value)
      };
    }
    /**
     * Add a field with an initial value (default `null`) and resolve once it is visible.
     * A field that already exists keeps its value.
     *
     * @example await store.add('layout', 'timeline', { height: 200 });
     */
    add(record, field, value = null, options = {}) {
      return this.owner.add(this.name, record, field, value, options);
    }
    /**
     * Set an existing field and resolve once the new value is visible. Rejects with
     * `uasrv.invalid_property` if the field was never added.
     *
     * @example await store.set('layout', 'timeline', { height: 320 }, { undoable: true });
     */
    set(record, field, value, options = {}) {
      return this.owner.set(this.name, record, field, value, options);
    }
    /**
     * Remove one field, or a whole record when `field` is left out.
     *
     * @example
     * await store.remove('layout', 'timeline');
     * await store.remove('layout');
     */
    remove(record, field, options = {}) {
      return this.owner.remove(this.name, record, field, options);
    }
    /**
     * Remove every record in this context.
     *
     * @example await store.clear();
     */
    clear(options = {}) {
      return this.owner.remove(this.name, void 0, void 0, options);
    }
  };
  var SessionStorage = class extends Node {
    /** Names of the contexts that hold at least one field. */
    contexts;
    byName = /* @__PURE__ */ new Map();
    /** @internal */
    constructor(client, sessionPath) {
      super(client, `${sessionPath}/storage`);
      this.contexts = this.childNames();
    }
    /**
     * Fetch the context names.
     *
     * @example await session.storage.load();
     */
    load() {
      return super.load({ levels: 1, commands: false, flatvalue: true });
    }
    /**
     * One context's records. It need not exist yet: the first {@link StorageContext.add}
     * creates it.
     *
     * `name` is any non-empty name without `/`, not only your Add On's id. Give each kind of data
     * its own context, your id plus a suffix, then use a record per item and a field per part,
     * rather than one record in one value: each `set` replaces a value whole, and only whole
     * values can be undoable or not.
     *
     * @example
     * const store = session.storage.context('com.example.my-add-on');
     * const tracks = session.storage.context('com.example.my-add-on.tracks');
     * await tracks.add(track.id, 'channel', 0);
     */
    context(name) {
      requireName(name, "context");
      let ctx = this.byName.get(name);
      if (!ctx) {
        ctx = new StorageContext(this.client, `${this.path}/${name}`, this);
        this.byName.set(name, ctx);
      }
      return ctx;
    }
    /** @internal */
    async add(context, record, field, value, options) {
      const body = this.body(context, record, field, options);
      await this.post("add_field", { ...body, value });
      await this.settleOn(context, record, () => this.client.store.cell(`${this.path}/${context}/${record}`, field).value !== void 0, "add field");
    }
    /** @internal */
    async set(context, record, field, value, options) {
      const body = this.body(context, record, field, options);
      await this.post("set_field", { ...body, value });
      const stored = asStored(value);
      await this.settleOn(context, record, () => sameJson(this.client.store.cell(`${this.path}/${context}/${record}`, field).value, stored), "set field");
    }
    /** @internal */
    async remove(context, record, field, options) {
      requireName(context, "context");
      if (record !== void 0) requireName(record, "record");
      if (field !== void 0) {
        if (record === void 0) throw new UAError("invalid_value", "remove: a field needs its record");
        requireName(field, "field");
      }
      await this.post("remove_field", {
        context,
        ...record !== void 0 ? { record } : {},
        ...field !== void 0 ? { field } : {},
        undoable: options.undoable === true
      });
      const store = this.client.store;
      const contextPath = `${this.path}/${context}`;
      if (record !== void 0 && field !== void 0) {
        store.cell(`${contextPath}/${record}`, field).update(void 0);
        return;
      }
      const gone = record === void 0 ? () => !(store.children(this.path).value ?? []).includes(context) : () => !(store.children(contextPath).value ?? []).includes(record);
      await this.settleOn(context, record, gone, "remove field");
    }
    body(context, record, field, options) {
      return {
        context: requireName(context, "context"),
        record: requireName(record, "record"),
        field: requireName(field, "field"),
        undoable: options.undoable === true
      };
    }
    /** Wait for the edit to show, re-reading the context while it has not. */
    settleOn(context, record, done, what) {
      const store = this.client.store;
      const contextPath = `${this.path}/${context}`;
      return settle(done, what, {
        path: record !== void 0 ? `${contextPath}/${record}` : contextPath,
        refresh: async () => {
          await store.load(this.path, { levels: 1, commands: false, flatvalue: true });
          if (store.knowsNode(contextPath)) await store.load(contextPath, { levels: 2, commands: false, flatvalue: true });
        },
        flush: () => store.scheduler.flush()
      });
    }
    release() {
      for (const ctx of this.byName.values()) ctx.dispose();
      this.byName.clear();
    }
  };

  // src/model/chords.ts
  var CHORD_NAME = /^([A-Ga-g](?:#|b)?)([^/]*?)\s*(?:\/\s*([A-Ga-g](?:#|b)?))?$/;
  var QUALITY_START = /^(?:maj|min|m|dim|aug|sus|add|[0-9+\-o°ø^Δ(])/i;
  var noteName = (name) => name[0].toUpperCase() + name.slice(1);
  function normalizeChordName2(name) {
    return name.replace(/♭/g, "b").replace(/♯/g, "#");
  }
  function parseChord(name) {
    const match = CHORD_NAME.exec(normalizeChordName2(name.trim()));
    if (!match) return void 0;
    const lowercase = match[1][0] !== match[1][0].toUpperCase();
    if (lowercase && match[2] !== "" && !QUALITY_START.test(match[2])) return void 0;
    return { root: noteName(match[1]), type: match[2], bass: match[3] === void 0 ? null : noteName(match[3]) };
  }
  function requireName2(name, what) {
    if (typeof name !== "string" || name.trim() === "") throw new UAError("out_of_range", `${what} must be a non-empty chord name`);
    return name;
  }
  var Chord = class extends Node {
    /** @internal */
    constructor(client, path, sessionUid) {
      super(client, path);
      this.sessionUid = sessionUid;
      this.rowid = this.prop("rowid");
      this.location = this.prop("location");
      this.name = this.prop("name");
    }
    sessionUid;
    rowid;
    /** Position in ticks. */
    location;
    /** The chord symbol as LUNA shows it, e.g. `Am7`, `C/E`. */
    name;
    get row() {
      return this.rowid.value ?? Number(this.id);
    }
    /** {@link name} split into root, type and bass; `undefined` for text that is not a chord. */
    get parsed() {
      return this.name.value === void 0 ? void 0 : parseChord(this.name.value);
    }
    async edit(fields, done, what) {
      this.assertLive();
      await this.wire.post(`/sessions/${this.sessionUid}/set_chord`, { session_uid: this.sessionUid, rowid: this.row, ...fields });
      await settle(done, what, { path: this.path, disposed: () => this.disposed, refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }), flush: () => this.client.store.scheduler.flush() });
    }
    /** @example await chord.rename('C/E'); */
    rename(name) {
      const wanted = normalizeChordName2(requireName2(name, "chord name"));
      return this.edit({ name }, () => this.name.value === wanted, "rename chord");
    }
    /**
     * Move this chord to `tick`. A chord already at `tick` is replaced, as in LUNA (fact 100).
     *
     * @example await chord.moveTo(Luna.WHOLE_NOTE * 2);
     */
    async moveTo(tick) {
      requireTick(tick, "chord tick");
      if (this.location.value === tick) return;
      await this.edit({ location: tick }, () => this.location.value === tick, "move chord");
    }
    /**
     * Delete this chord and resolve once it has left the ruler.
     *
     * @example await chord.delete();
     */
    async delete() {
      this.assertLive();
      await this.wire.post(`/sessions/${this.sessionUid}/delete_chord`, { session_uid: this.sessionUid, rowid: this.row });
      const parent = this.path.slice(0, this.path.lastIndexOf("/"));
      await settle(() => !(this.client.store.children(parent).value ?? []).includes(this.id), "delete chord", {
        path: this.path,
        refresh: () => this.client.store.load(parent, { levels: 2, commands: false, flatvalue: true }),
        flush: () => this.client.store.scheduler.flush()
      });
    }
  };
  var Chords = class extends Collection {
    /** @internal */
    constructor(client, sessionPath, sessionUid) {
      super(client, `${sessionPath}/chords`, (p) => new Chord(client, p, sessionUid), { levels: 2, commands: false, flatvalue: true });
      this.sessionUid = sessionUid;
    }
    sessionUid;
    /**
     * Detect the chords in a clip, or in the edit context's selection (one track), and write
     * them onto this ruler, as LUNA's Detect Chords does: `extract_chords`, which runs as a
     * `chord_extraction` job (facts 200, 203). The chords land here as they are written; the
     * returned {@link JobRun} reports progress and resolves when the job completes, with
     * `empty: true` when nothing was found. LUNA also keeps what it found per source in
     * `source.analysis.chord`.
     *
     * @example
     * const run = session.musical.chords.detect({ clip });
     * run.progress.onChange(() => (bar.value = run.progress.value ?? 0));
     * await run;
     * session.musical.chords.sorted.map((c) => c.name.value);
     */
    detect(options = {}) {
      return runExtraction(this.client, this.sessionUid, "extract_chords", "chord_extraction", options);
    }
    /** Chords in timeline order. */
    get sorted() {
      return [...this.items].sort((a, b) => (a.location.value ?? 0) - (b.location.value ?? 0));
    }
    /** The chord sounding at `tick`: the last one at or before it. */
    at(tick) {
      return this.sorted.filter((c) => (c.location.value ?? 0) <= tick).at(-1);
    }
  };
  function checkChordSpecs(chords) {
    const ticks = /* @__PURE__ */ new Set();
    for (const c of chords) {
      requireTick(c.tick, "chord tick");
      requireName2(c.name, "chord name");
      if (ticks.has(c.tick)) throw new UAError("out_of_range", `setChords(): two chords at tick ${c.tick}; the ruler holds one per tick`);
      ticks.add(c.tick);
    }
  }

  // src/model/clip-gain.ts
  function clipGainAt(breakpoints, tick) {
    if (breakpoints.length === 0) return void 0;
    const bps2 = isSorted(breakpoints) ? breakpoints : [...breakpoints].sort((a, b) => a.tick - b.tick);
    const first = bps2[0];
    if (bps2.length === 1 || tick <= first.tick) return first.value;
    const last = bps2[bps2.length - 1];
    if (tick >= last.tick) return last.value;
    let lo = 1;
    let hi = bps2.length - 1;
    while (lo < hi) {
      const mid = lo + hi >> 1;
      if (bps2[mid].tick > tick) hi = mid;
      else lo = mid + 1;
    }
    const next = bps2[lo];
    const prev = bps2[lo - 1];
    const span = next.tick - prev.tick;
    if (span <= 0) return next.value;
    return prev.value + (next.value - prev.value) * ((tick - prev.tick) / span);
  }
  function isSorted(bps2) {
    for (let i = 1; i < bps2.length; i++) if (bps2[i].tick < bps2[i - 1].tick) return false;
    return true;
  }

  // src/model/presence.ts
  function childNames(reply) {
    const children = typeof reply === "object" && reply !== null ? reply.children : void 0;
    if (!Array.isArray(children)) return [];
    const out = [];
    for (const child of children) {
      const raw = typeof child === "string" ? child : typeof child === "object" && child !== null ? child.path ?? child.name : void 0;
      if (typeof raw === "string") out.push(raw.slice(raw.lastIndexOf("/") + 1));
    }
    return out;
  }

  // src/model/gui.ts
  var AddOn = class extends Node {
    /** The manifest's `id`, in lowercase: LUNA compares ids without case. */
    addOnId;
    /** The manifest's `name`: its menu item and panel header. */
    name;
    /**
     * Every host the Add On can be shown in, default first (fact 144): the manifest's `targets`, such as
     * `['window', 'browser']`, or a one-entry list from its single `target`. The user can swap an
     * Add On with more than one between them from its header. The host a page is in now is its
     * {@link AddOnInstance.target}. `undefined` on a LUNA older than the property.
     *
     * @example
     * const canBePanel = addOn.targets.value?.includes('browser') ?? false;
     * const defaultHost = addOn.targets.value?.[0];
     */
    targets;
    /** Absolute file path of the icon, or `''`. */
    icon;
    /** The manifest's `floating`: `true` unless it says `false`. Meaningful for `'window'` only. */
    floating;
    /** The manifest's `show_with_session`: `false` unless it says `true`. Meaningful for `'window'` only. */
    showWithSession;
    /**
     * The manifest's `fixed_size`: `false` unless it says `true`. Meaningful for `'window'` only.
     * `undefined` on a LUNA older than the property.
     */
    fixedSize;
    /**
     * The manifest's `run_hidden`: `false` unless it says `true`. With `true` LUNA keeps the page
     * running at full speed while it is hidden. `undefined` on a LUNA older than the property.
     */
    runHidden;
    /**
     * The manifest's `unload_on_close`: `false` unless it says `true`. With `true` LUNA unloads
     * the page when the Add On is closed and loads it fresh when it is opened again, instead of
     * keeping it running hidden. Meaningful for `'window'`, `'browser'` and `'editor'`.
     * `undefined` on a LUNA older than the property.
     */
    unloadOnClose;
    /** The manifest's `manufacturer`, or `''` when it has none. */
    manufacturer;
    /** The manifest's `description`, an array of strings already concatenated, or `''` when it has none. */
    description;
    /**
     * The manifest's `categories`, such as `['MIDI', 'Utility']` (see {@link ADD_ON_CATEGORIES}),
     * or `[]` when it has none. LUNA does not check the names, so one from a newer SDK can appear.
     * `undefined` on a LUNA older than the property.
     *
     * @example
     * const midi = luna.gui.addOns.items.filter((a) => a.categories.value?.includes('MIDI'));
     */
    categories;
    /**
     * Every server the Add On would connect to (fact 147): its manifest's `network` hosts,
     * normalized (`'api.example.com'`, `'*.example.com'`, `'host:8443'`), plus a hosted page's own
     * server. `[]` when none. `undefined` on a LUNA older than the property.
     *
     * @example
     * const servers = addOn.network.value ?? [];
     */
    network;
    /**
     * Those of {@link AddOn.network} the user allowed (fact 147). Only LUNA's own prompts and
     * Settings > Add Ons > SERVERS change it; nothing an Add On sends can. A page loads with the
     * set fixed and is loaded again when it changes.
     *
     * @example
     * const blocked = (addOn.network.value ?? []).filter((h) => !addOn.networkAllowed.value?.includes(h));
     */
    networkAllowed;
    /** The manifest's `version`, or `''` when it has none. Follows a replace (fact 131). */
    version;
    /**
     * Where it is installed (fact 131): `'folder'`, a folder in LUNA's Add Ons folder (from a
     * `.lunaaddon`, the showcase, or copied there); `'link'`, a symlink there, as
     * `ua-builder install` makes on macOS; `'built_in'`, bundled with LUNA. {@link Gui.uninstallAddOn}
     * removes `'folder'` and `'link'` ones (a link loses only the link) and refuses `'built_in'`.
     * `undefined` on a LUNA older than the property.
     *
     * @example
     * const removable = addOn.installedFrom.value === 'folder' || addOn.installedFrom.value === 'link';
     */
    installedFrom;
    /**
     * The manifest's `min_width`, `min_height`, `max_width` and `max_height` (fact 143): the
     * window's size limits in pixels, `null` when the manifest declares none. LUNA stops the
     * user's resize at them and clamps {@link AddOnInstance.resize} to them. Meaningful for
     * `'window'` only. `undefined` on a LUNA older than the properties.
     *
     * @example
     * const tooNarrow = addOn.minWidth.value != null && innerWidth < addOn.minWidth.value;
     */
    minWidth;
    minHeight;
    maxWidth;
    maxHeight;
    /**
     * The manifest's `requires_plugins` as LUNA read it (fact 148): the plugins the Add On needs,
     * each with every `plugin_id` it accepts (always an array), its `min_version` (`''` for any)
     * and whether it is `optional`; `[]` when it has none. Whether each is met is not here, since
     * it changes with the installed plugins: ask {@link Plugins.unmetRequirements}. LUNA lists an
     * Add On whose non-optional requirement is unmet disabled, with the plugin it needs, and
     * will not open it. `undefined` on a LUNA older than the property.
     *
     * @example
     * await luna.plugins.load();
     * const missing = luna.plugins.unmetRequirements(addOn.requiresPlugins.value ?? []);
     * if (missing.length) banner.textContent = `Install ${missing.map((r) => r.name).join(', ')}`;
     */
    requiresPlugins;
    /**
     * Its pages open in LUNA right now, by `add_on_inst` (fact 143): one per window, browser
     * panel, editor panel or app page showing it. Use {@link Gui.thisInstance} for your own page.
     *
     * @example
     * await addOn.instances.load();
     * addOn.instances.items.map((i) => `${i.target.value} ${i.width.value}x${i.height.value}`);
     */
    instances;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.minWidth = this.prop("min_width");
      this.minHeight = this.prop("min_height");
      this.maxWidth = this.prop("max_width");
      this.maxHeight = this.prop("max_height");
      this.instances = new Collection(client, `${path}/instances`, (p) => new AddOnInstance(client, p), { levels: 2, commands: false, flatvalue: true });
      this.addOnId = this.prop("id");
      this.name = this.prop("name");
      this.targets = this.prop("targets");
      this.icon = this.prop("icon");
      this.floating = this.prop("floating");
      this.showWithSession = this.prop("show_with_session");
      this.fixedSize = this.prop("fixed_size");
      this.runHidden = this.prop("run_hidden");
      this.unloadOnClose = this.prop("unload_on_close");
      this.manufacturer = this.prop("manufacturer");
      this.description = this.prop("description");
      this.categories = this.prop("categories");
      this.network = this.prop("network");
      this.networkAllowed = this.prop("network_allowed");
      this.version = this.prop("version");
      this.installedFrom = this.prop("installed_from");
      this.requiresPlugins = this.prop("requires_plugins");
    }
    /** Show it in LUNA in the host it is in now (one of {@link targets}): navigate to an `'app'`,
     *  open a `'window'` (toggling it like its menu item), show a `'browser'` in the secondary
     *  browser, or an `'editor'` in the Timeline's editor panel (never toggling either closed). */
    show() {
      return this.wire.post("/gui/show_add_on", { id: this.id });
    }
  };
  var AddOnInstance = class extends Node {
    /** The host the page is in: one of its Add On's {@link AddOn.targets}. */
    target;
    /** The page's width in points; follows the user's resize. `undefined` until loaded. */
    width;
    /** The page's height in points; follows the user's resize. `undefined` until loaded. */
    height;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.target = this.prop("target");
      this.width = this.prop("width");
      this.height = this.prop("height");
    }
    /** The `add_on_inst` LUNA gave the page. */
    get instanceId() {
      return this.id;
    }
    /** The manifest `id` of the Add On this page belongs to, in lowercase. */
    get addOnId() {
      const parent = this.path.slice(0, this.path.lastIndexOf("/instances/"));
      return parent.slice(parent.lastIndexOf("/") + 1);
    }
    /**
     * Ask LUNA to resize a `'window'` instance's window to this page size, in points. A size left
     * out keeps the current one. LUNA clamps it to the manifest's `min_*`/`max_*`, leaves full
     * screen first, keeps the window's top-left corner, and saves it as it would a user resize
     * (with the session, for a `show_with_session` window). Resolves once the size LUNA applied is
     * in {@link width} and {@link height}. Rejects with `uasrv.read_only` for another
     * target or a `fixed_size` window, and `uasrv.invalid_value` for a size of 0 or less.
     *
     * @example
     * await me.resize(800);          // width only
     * await me.resize(undefined, 600); // height only
     */
    async resize(width, height) {
      if (width !== void 0) await this.wire.set(`${this.path}/width`, Math.round(width));
      if (height !== void 0) await this.wire.set(`${this.path}/height`, Math.round(height));
      await this.reload({ flatvalue: true, commands: false, children: false });
    }
  };
  var GuiWindow = class extends Node {
    /** Current page; writable for `mixer | timeline | home | addon | dashboard`. */
    page;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.page = this.writableProp("page");
    }
  };
  var Gui = class extends Node {
    /** Installed Add Ons, by manifest id in lowercase (`byId('com.example.foo')`). */
    addOns;
    /** Windows by context type; `main` is the arrangement window. */
    windows;
    /** Record-arm mode of LUNA's transport bar. */
    armMode;
    priorLaunchCount;
    /**
     * The folder LUNA creates new sessions in, as set in its Settings (fact 160). Read-only;
     * it follows the setting once `/gui` is watched. `undefined` on an engine without `/gui`.
     *
     * @example
     * await luna.gui.watch().ready;
     * luna.gui.sessionStoragePath.value;   // e.g. "/Users/me/Music/LUNA"
     */
    sessionStoragePath;
    /**
     * The plugin editor windows open in LUNA, opened from the page or by the user (fact 126).
     * `undefined` until known, and on a LUNA that does not publish them. Follows LUNA once
     * {@link watchPluginWindows} has run, which `session.ready()` does. Read one slot's state
     * from `effect.editorOpen`.
     */
    pluginWindows;
    /**
     * The blessed folders (fact 133): the folders the user lets every Add On read, as absolute
     * paths with links resolved. {@link listFiles} and {@link listAllFiles} list anything in
     * them, and {@link serveMediaFile} gives a URL for any file in them, of any type, but hidden
     * ones. The user manages them in LUNA's Settings > Add Ons > FOLDERS; a page asks for one
     * with {@link addBlessedFolder}. `undefined` until known, and on a LUNA without them.
     * Follows LUNA once {@link watchBlessedFolders} has run.
     */
    blessedFolders;
    presence;
    pluginWindowsWatch;
    blessedFoldersWatch;
    /** @internal */
    constructor(client) {
      super(client, "/gui");
      this.addOns = new Collection(client, "/gui/add_ons", (p) => new AddOn(client, p), { levels: 2, commands: false, flatvalue: true });
      this.windows = new Collection(client, "/gui/windows", (p) => new GuiWindow(client, p), { levels: 2, commands: false, flatvalue: true });
      this.armMode = client.store.cell("/gui/transport", "arm_mode");
      this.armMode = {
        get value() {
          return client.store.cell("/gui/transport", "arm_mode").value;
        },
        onChange: (l) => client.store.cell("/gui/transport", "arm_mode").onChange(l),
        set: (v) => client.store.set("/gui/transport", "arm_mode", v)
      };
      this.priorLaunchCount = this.prop("prior_launch_count");
      this.sessionStoragePath = this.prop("session_storage_path");
      const open = client.store.cell("/gui/plugin_windows", "open");
      this.pluginWindows = derived([open], () => {
        const list = open.value;
        if (!Array.isArray(list)) return void 0;
        return list.map((w) => ({ sessionUid: w.session_uid ?? "", channelUid: w.channel_uid ?? "", slot: w.insert_type ?? "" }));
      });
      const blessed = client.store.cell("/gui/add_ons", "blessed_folders");
      this.blessedFolders = derived([blessed], () => Array.isArray(blessed.value) ? blessed.value : void 0);
    }
    /**
     * Follow {@link blessedFolders} for the life of the connection. Idempotent; resolves once
     * the first list is in, or at once on an engine without `/gui`.
     *
     * @example
     * await luna.gui.watchBlessedFolders();
     * luna.gui.blessedFolders.onChange(() => render(luna.gui.blessedFolders.value ?? []));
     */
    watchBlessedFolders() {
      this.blessedFoldersWatch ??= this.available().then((has) => has ? this.client.store.watch("/gui/add_ons", { load: { levels: 1, children: false } }).ready : void 0).catch(() => {
        this.blessedFoldersWatch = void 0;
      });
      return this.blessedFoldersWatch;
    }
    /**
     * Follow {@link pluginWindows} for the life of the connection. Idempotent; resolves once
     * the first list is in, or at once on an engine without `/gui`. `session.ready()` calls it.
     *
     * @example
     * await luna.gui.watchPluginWindows();
     * luna.gui.pluginWindows.value; // [{ sessionUid, channelUid, slot: 'effect_0' }]
     */
    watchPluginWindows() {
      this.pluginWindowsWatch ??= this.available().then((has) => has ? this.client.store.watch("/gui/plugin_windows").ready : void 0).catch(() => {
        this.pluginWindowsWatch = void 0;
      });
      return this.pluginWindowsWatch;
    }
    /** True when LUNA has the editor of `slot` on `channelUid` open; `undefined` until known. */
    isPluginOpen(channelUid, slot, sessionUid) {
      const list = this.pluginWindows.value;
      if (list === void 0) return void 0;
      return list.some((w) => w.slot === slot && sameUid(w.channelUid, channelUid) && (sessionUid === void 0 || sameUid(w.sessionUid, sessionUid)));
    }
    /**
     * This page's own instance (fact 143), from the `add_on_inst` LUNA puts in an Add On page's
     * URL, watched so its size follows LUNA. `undefined` outside LUNA, on a LUNA older than
     * instances, or when no live instance has that id. Pass an id to look up another page.
     *
     * @example
     * const me = await luna.gui.thisInstance();
     * if (me) console.log(me.addOnId, me.instanceId, me.width.value, me.height.value);
     */
    async thisInstance(instanceId = instanceIdFromUrl()) {
      if (!instanceId || !await this.available()) return void 0;
      const reply = await this.client.raw.get("/gui/add_ons", { levels: 3, properties: false, commands: false });
      for (const addOn of replyChildren(reply)) {
        for (const folder of replyChildren(addOn)) {
          if (childName(folder) !== "instances") continue;
          for (const instance of replyChildren(folder)) {
            if (childName(instance) !== instanceId) continue;
            const node = new AddOnInstance(this.client, `/gui/add_ons/${childName(addOn)}/instances/${instanceId}`);
            await node.watch().ready;
            return node;
          }
        }
      }
      return void 0;
    }
    /**
     * True when the engine has LUNA's `/gui` (fact 103). Read once per connection: the
     * root's children are listed, because a `get` of a missing `/gui` answers `{}` (fact 10).
     *
     * @example
     * const paths = (await luna.gui.available()) ? await luna.gui.chooseFiles() : [];
     */
    available() {
      this.presence ??= this.client.raw.get("/", { children: true, properties: false, commands: false }).then((reply) => childNames(reply).includes("gui")).catch((err) => {
        this.presence = void 0;
        throw err;
      });
      return this.presence;
    }
    /** Commands go to `/gui`, so refuse at once, not after a timeout, when it is absent. */
    async post(command, payload) {
      if (!await this.available()) throw new Unsupported(`luna.gui.${command}: this engine has no /gui (a headless engine). Check luna.gui.available() first.`);
      return super.post(command, payload);
    }
    /** The main window. */
    get main() {
      return this.windows.byId("main") ?? new GuiWindow(this.client, "/gui/windows/main");
    }
    /**
     * Switch the main window (or another context's window) to a page, optionally at a view
     * inside it, and resolve once the window's `page` shows it (fact 236). LUNA answers with no
     * data, so the window's `page` is the confirmation. A minimised window is restored and
     * switched a moment later, which this waits for. LUNA refuses a page it cannot switch to,
     * `lunaplay` among them, with `uasrv.invalid_value`, and one this window or LUNA build
     * lacks with `uasrv.not_implemented`.
     *
     * The second argument is the context type (`'main'`) or {@link SetPageOptions}.
     *
     * @example
     * await luna.gui.setPage('mixer');
     * luna.gui.main.page.value; // 'mixer'
     * await luna.gui.setPage('universe', { route: 'index/showcase?kind=addon' });
     */
    async setPage(page, options = {}) {
      const { contextType = "main", route } = typeof options === "string" ? { contextType: options } : options;
      await this.post("set_page", route === void 0 ? { page, context_type: contextType } : { page, context_type: contextType, route });
      const path = `/gui/windows/${contextType}`;
      const shown = this.client.store.cell(path, "page");
      await settle(() => shown.value === page, "setPage", {
        path,
        refresh: () => this.client.store.load(path, { children: false, commands: false, flatvalue: true, propfilter: ["page"] }),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    openUrl(url) {
      return this.post("open_url", { url });
    }
    /** Reveal a file or folder in Finder / Explorer. */
    revealPath(path) {
      return this.post("reveal_path", { path });
    }
    openSettings() {
      return this.post("open_settings");
    }
    openPluginManager() {
      return this.post("open_plugin_manager");
    }
    showFeedback() {
      return this.post("show_feedback");
    }
    showSessionInFinder(sessionPackageUid) {
      return this.post("show_session_in_finder", sessionPackageUid ? { session_package_uid: sessionPackageUid } : {});
    }
    showAddOn(id) {
      return this.post("show_add_on", { id });
    }
    /**
     * Install Add Ons into LUNA, as LUNA's Add On Showcase does (fact 128). Give
     * `{ id }`, a showcase package id or the id of an Add On in one (its whole package
     * installs), or `{ url }`: a public GitHub repo (`https://github.com/<owner>/<repo>`; the
     * scheme, `www.`, `.git` and a path inside the repo are tolerated), whose latest release
     * LUNA lists in the showcase and installs every `.lunaaddon` of; or a Google Drive share
     * link to a `.lunaaddon` (`https://drive.google.com/file/d/<id>/view?usp=sharing`), an
     * iCloud Drive one (`https://www.icloud.com/iclouddrive/<id>#<name>`) or a Dropbox one
     * (`https://www.dropbox.com/scl/fi/<id>/<name>?rlkey=<key>&dl=0`), which LUNA downloads
     * and installs. The file has to be shared with anyone who has the link: LUNA does not
     * sign in to Google, iCloud or Dropbox. Either way LUNA asks the user to add the Add Ons, or
     * replace what is installed, so the user always confirms. A url that installs and is not
     * one of the showcase's own repos is saved, and LUNA lists it in its showcase from
     * then on, to install again; {@link removeAddOn} forgets it.
     *
     * Resolves as LUNA starts, not once installed: watch {@link addOns} for the result. A
     * repo whose latest release has nothing LUNA can install, or a shared file that is not
     * shared with anyone, a folder, or not an Add On, is only found out after this resolves, and LUNA tells the user. Rejects with a `Luna.Error` whose `code` is
     * `uasrv.invalid_value` for an id no showcase package has, a url that is not a GitHub
     * repo or a Drive, iCloud Drive or Dropbox file link, or both given; `uasrv.missing_field` for neither; `uasrv.too_many_requests` while
     * that package is already installing. A LUNA without the command (an older one, or one
     * without its Add On showcase) rejects with `Luna.Unsupported`.
     *
     * @example
     * await luna.gui.installAddOn({ url: 'https://github.com/uaudio-labs/video-window' });
     * await luna.gui.installAddOn({ url: 'https://drive.google.com/file/d/<id>/view?usp=sharing' });
     * await luna.gui.installAddOn({ url: 'https://www.icloud.com/iclouddrive/<id>#my-add-on' });
     * await luna.gui.installAddOn({ url: 'https://www.dropbox.com/scl/fi/<id>/my-add-on.lunaaddon?rlkey=<key>&dl=0' });
     * await luna.gui.installAddOn({ id: 'uaudio-labs.midi-notation' });
     */
    async installAddOn(from) {
      await this.post("install_add_on", from).catch(olderLuna("installAddOn", "install_add_on"));
    }
    /**
     * Forget a link {@link installAddOn} (or LUNA's IMPORT URL) saved, as Remove from
     * Showcase in LUNA does (fact 128). `id` is the package's id under
     * `/gui/showcase/packages`, or the id of an Add On in it. Its listing leaves LUNA's
     * showcase now and at the next launch; the installed Add On is not touched. Rejects with
     * a `Luna.Error` whose `code` is `uasrv.invalid_value` for an id no showcase package
     * has, `uasrv.not_permitted` for a package of the showcase's own repos, and
     * `uasrv.missing_field` with no id. A LUNA without the command rejects with
     * `Luna.Unsupported`.
     *
     * @example
     * await luna.gui.removeAddOn('com.uaudio.qwerty_midi');
     */
    async removeAddOn(id) {
      await this.post("remove_add_on", { id }).catch(olderLuna("removeAddOn", "remove_add_on"));
    }
    /**
     * Ask the user to remove an installed Add On (fact 130). LUNA shows its own prompt ("Remove
     * "Video Window"?"), so a page can never remove one silently. If the user agrees, LUNA closes
     * the Add On wherever it shows, deletes its folder in the Add Ons folder (with every other
     * Add On installed in that folder, which the prompt names) and rescans, so it leaves
     * {@link addOns}. An Add On installed with `ua-builder install` on macOS is a symlink: LUNA
     * removes only the link, never your project.
     *
     * Resolves as the prompt opens, not once removed: watch {@link addOns} for the result (it
     * stays there if the user cancels). Rejects with a `Luna.Error` whose `code` is
     * `uasrv.invalid_value` for an id not in {@link addOns}, `uasrv.not_permitted` for an Add On
     * built into LUNA, `uasrv.too_many_requests` while LUNA is already asking, and
     * `uasrv.missing_field` with no id. A LUNA without the command rejects with
     * `Luna.Unsupported`.
     *
     * @example
     * await luna.gui.uninstallAddOn('com.uaudio.video_window');
     */
    async uninstallAddOn(id) {
      await this.post("uninstall_add_on", { id }).catch(olderLuna("uninstallAddOn", "uninstall_add_on"));
    }
    /**
     * Open the editor window of the plugin in `slot` on a track or bus, as clicking it in
     * LUNA's mixer does (or bring it to the front). LUNA answers before the window opens, and
     * an empty slot opens nothing: `effect.openEditor()` waits for the window and says so.
     * `sessionUid` defaults to the session in LUNA's window. `contextType` names the LUNA window
     * to open it from (`main` by default; an Add On in an alternate window passes its own, such
     * as `alt_1`); a window that is not open rejects with `uasrv.invalid_object`, and a name LUNA
     * does not know means `main` (fact 178). A LUNA without the command rejects with
     * `Luna.Unsupported`.
     *
     * @example
     * await luna.gui.showPlugin(track.id, 'effect_0');
     * await luna.gui.showPlugin(track.id, 'effect_0', { contextType: 'alt_1' });
     */
    showPlugin(channelUid, slot, options = {}) {
      return this.pluginWindow("show_plugin", "showPlugin", pluginPayload(channelUid, slot, options.sessionUid, options.contextType), options.contextType);
    }
    /**
     * Close the editor window of the plugin in `slot`, if it is open. See {@link showPlugin}.
     *
     * @example
     * await luna.gui.hidePlugin(track.id, 'effect_0');
     * await luna.gui.hidePlugin(track.id, 'effect_0', { contextType: 'alt_1' });
     */
    hidePlugin(channelUid, slot, options = {}) {
      return this.pluginWindow("hide_plugin", "hidePlugin", pluginPayload(channelUid, slot, options.sessionUid, options.contextType), options.contextType);
    }
    /**
     * Post show_plugin / hide_plugin. LUNA answers `uasrv.invalid_object` both when it has no
     * such command and when the named window is not open (fact 178): tell them apart by
     * whether `/gui/windows` lists the window.
     */
    async pluginWindow(command, method, payload, contextType) {
      try {
        return await this.post(command, payload);
      } catch (err) {
        if (err instanceof UAError && err.code === "uasrv.invalid_object" && contextType !== void 0 && contextType !== "main" && /^(editor|alt_\d+|editor_\d+)$/.test(contextType)) {
          const windows = await this.wire.get("/gui/windows", { children: true, properties: false, commands: false }).catch(() => void 0);
          const open = (windows?.children ?? []).some((c) => c.path === contextType);
          if (!open) throw new UAError("uasrv.invalid_object", `luna.gui.${method}: LUNA has no open ${contextType} window`, { cmd: "post", path: `/gui/${command}` });
        }
        return olderLuna(method, command)(err);
      }
    }
    /** Run a LUNA rack command by id with extra fields as its data. Escape hatch. */
    execute(command, data = {}) {
      return this.post("execute", { ...data, command });
    }
    /**
     * LUNA's native open-file dialog. Resolves to the chosen **absolute paths**, or `[]` if
     * cancelled. `filters` are wildcards such as `['*.wav', '*.aif;*.aiff']`.
     *
     * This is the **path route**, an optimization for getting files into the session: the
     * engine reads the paths from disk (`session.importPath()`, `session.importFile()`), so the
     * bytes never pass through the page. The page itself cannot read these paths; `fetch`
     * and XHR refuse them. Needs `/gui` ({@link Gui.available}) and a native engine that can
     * see the file.
     *
     * Want the audio in the page (decode, audition, slice)? Do not use this: use
     * `<input type="file">`, which gives `File` objects everywhere, and
     * `session.uploadFile({ bytes: file })` to put one into the session.
     *
     * @example
     * const [path] = await luna.gui.chooseFiles({ filters: ['*.wav'] });
     * if (path) await session.importPath(path);
     */
    chooseFiles(options = {}) {
      const payload = {};
      if (options.title !== void 0) payload["title"] = options.title;
      if (options.filters !== void 0) payload["filters"] = options.filters;
      if (options.allowMultiple !== void 0) payload["allow_multiple"] = options.allowMultiple;
      if (options.defaultPath !== void 0) payload["default_path"] = options.defaultPath;
      return this.dialog("show_open_dialog", payload, "release_file_chooser", options.timeoutMs);
    }
    /**
     * LUNA's native folder dialog. Resolves to the chosen folders' **absolute paths**, or `[]`
     * if cancelled. A path route like {@link chooseFiles}: hand the paths to
     * {@link listFiles} or the engine, not to `fetch`. LUNA then asks the user, once for all the
     * folders picked, whether every Add On may read them (fact 133). If they allow it, each
     * becomes a blessed folder: {@link listFiles} reads it and every folder inside it, from now on
     * and after LUNA restarts. If not, you still get the paths (for `session.importPath()`), but
     * {@link listFiles} refuses them; check {@link blessedFolders}. Nothing is asked for a folder
     * already blessed or inside one. Needs `/gui` ({@link Gui.available}) and a
     * LUNA that has the dialog (fact 106); an older one rejects with `Luna.Unsupported`.
     *
     * @example
     * const [folder] = await luna.gui.chooseFolders({ title: 'Choose a sample folder' });
     * if (folder) console.log(await luna.gui.listFiles(folder));
     */
    chooseFolders(options = {}) {
      const payload = {};
      if (options.title !== void 0) payload["title"] = options.title;
      if (options.allowMultiple !== void 0) payload["allow_multiple"] = options.allowMultiple;
      if (options.defaultPath !== void 0) payload["default_path"] = options.defaultPath;
      return this.dialog("show_folder_dialog", payload, "release_file_chooser", options.timeoutMs).catch(olderLuna("chooseFolders", "show_folder_dialog"));
    }
    /**
     * The files and folders directly inside the folder at `path`, as LUNA sees the disk (fact
     * 106). Hidden entries are left out; the rest are in natural order, as LUNA's own browsers
     * sort: case ignored, and numbers by value, so `take2` comes before `take10`. `path` must
     * be absolute.
     *
     * LUNA lists only the blessed folders ({@link blessedFolders}) and the folders inside them:
     * one picked with {@link chooseFolders} or dropped on an Add On (`Luna.onPathDrop()`) and
     * allowed in LUNA's prompt, allowed through {@link addBlessedFolder}, or added in Settings >
     * Add Ons > FOLDERS. LUNA
     * remembers them across restarts, at most 64 (the oldest are forgotten first), until the
     * user removes them there. They are LUNA-wide, not per Add On. A path is judged where it
     * really is, so `..` or a link out of a blessed folder is refused, and so is a hidden
     * folder inside one (`.git`). For everything below a
     * folder in one call, use {@link listAllFiles}.
     *
     * Rejects with a `Luna.Error` whose `code` is `uasrv.not_permitted` when `path` is not in
     * a granted folder (whether or not anything is there: ask with {@link chooseFolders}),
     * `uasrv.filesystem_error` when nothing is at `path` or it cannot be read, and
     * `uasrv.invalid_value` when `path` is relative or names a file. An older LUNA without
     * the command rejects with `Luna.Unsupported`; an older LUNA lists any folder.
     *
     * @example
     * const [folder] = await luna.gui.chooseFolders({ title: 'Choose a sample folder' });
     * for (const entry of folder ? await luna.gui.listFiles(folder) : []) {
     *   if (!entry.isDirectory && entry.name.endsWith('.wav')) await session.importPath(entry.path);
     * }
     */
    async listFiles(path) {
      const reply = await this.post("list_files", { path }).catch(olderLuna("listFiles", "list_files"));
      return (reply?.files ?? []).map((f) => ({ name: f.name, path: f.path, isDirectory: f.is_directory }));
    }
    /**
     * Everything below the folder at `path`, every folder inside it included (fact 133): each
     * folder's entry is followed by its own contents, each level in {@link listFiles}' order,
     * and every entry has its `relativePath`. Hidden files and folders are left out, and a link
     * to a folder is listed but not followed. `truncated` is true when LUNA stopped at its
     * limit (10,000 entries, or 5 seconds of reading); list a folder further down to see the rest. `path` must be a
     * blessed folder or inside one, with the same errors as {@link listFiles}. A LUNA that
     * cannot list recursively rejects with `Luna.Unsupported`.
     *
     * @example
     * const { files } = await luna.gui.listAllFiles('/Users/me/Samples');
     * const loops = files.filter((f) => !f.isDirectory && f.relativePath.startsWith('Loops/'));
     */
    async listAllFiles(path) {
      const reply = await this.post("list_files", { path, recursive: true }).catch(olderLuna("listAllFiles", "list_files"));
      if (typeof reply?.truncated !== "boolean") throw new Unsupported("luna.gui.listAllFiles: this LUNA lists one folder at a time; it needs a newer LUNA. Use listFiles.");
      const files = (reply.files ?? []).map((f) => ({ name: f.name, path: f.path, isDirectory: f.is_directory, relativePath: f.relative_path ?? f.name }));
      return { files, truncated: reply.truncated };
    }
    /**
     * Ask the user to let every Add On read the folder at `path` and every folder inside it,
     * making it a blessed folder (fact 133). LUNA shows its own prompt ("An Add On wants to read
     * the folder ..."), with DON'T ALLOW as the default, so a page can never bless one
     * silently. Resolves as the prompt opens, not once answered: watch {@link blessedFolders}
     * (after {@link watchBlessedFolders}) for the result. Resolves at once, without asking, when
     * the folder is already blessed or inside one that is.
     *
     * LUNA never asks for a folder too broad for one answer: a disk's root, the home folder or
     * a folder holding it (`/Users`), or `~/Library`; ask for a folder inside one instead
     * (`~/Music`). Once the user says DON'T ALLOW, LUNA does not ask for that folder again until
     * it restarts. The user can still add any folder in Settings > Add Ons > FOLDERS.
     *
     * Rejects with a `Luna.Error` whose `code` is `uasrv.invalid_value` for a relative path or
     * a file, `uasrv.filesystem_error` when nothing is at `path`, `uasrv.not_permitted`
     * (without asking) for a folder too broad or one the user refused this session, and
     * `uasrv.too_many_requests` while LUNA is already asking. A LUNA without the command
     * rejects with `Luna.Unsupported`.
     *
     * @example
     * await luna.gui.watchBlessedFolders();
     * await luna.gui.addBlessedFolder('/Users/me/Samples');
     * luna.gui.blessedFolders.onChange(() => console.log(luna.gui.blessedFolders.value));
     */
    async addBlessedFolder(path) {
      await this.post("add_blessed_folder", { path }).catch(olderLuna("addBlessedFolder", "add_blessed_folder"));
    }
    /**
     * Stop letting Add Ons read a blessed folder (fact 133), without asking: removing access
     * needs no consent. `path` must be one of {@link blessedFolders}; a folder inside one cannot
     * be removed on its own. {@link blessedFolders} has changed by the time this resolves.
     * Rejects with a `Luna.Error` whose `code` is `uasrv.invalid_value` for any other path. A
     * LUNA without the command rejects with `Luna.Unsupported`.
     *
     * @example
     * for (const folder of luna.gui.blessedFolders.value ?? []) await luna.gui.removeBlessedFolder(folder);
     */
    async removeBlessedFolder(path) {
      await this.post("remove_blessed_folder", { path }).catch(olderLuna("removeBlessedFolder", "remove_blessed_folder"));
    }
    /**
     * The URL your Add On's page loads a local file from, given its absolute `path` (from
     * {@link chooseFiles}, {@link listFiles}, `Luna.onPathDrop()`, or a path you saved, say in
     * `session.storage`). Set it as a `<video>`, `<audio>` or `<img>` `src`, or read the bytes
     * with XMLHttpRequest (fact 114). This is how a page plays or reads a file it knows only by
     * path.
     *
     * Any file in a blessed folder ({@link blessedFolders}) is served whatever its type: JSON,
     * text, images, PDFs as well as media (fact 133). Hidden files below the blessed folder
     * (`.git`, `.env`) and links that lead out of it are not. Outside the blessed folders only
     * audio, video and MIDI are served, as below.
     *
     * `addOnId` is your manifest's `id`: the file is served to that Add On's pages only. On
     * macOS the URL is `ua-content://<your Add On>/<path>` and supports byte ranges, so media
     * seeks without reading the whole file; on Windows it is a `file:///` URL, which media
     * elements and XMLHttpRequest load but `fetch()` refuses. Ask again
     * after every reload: LUNA forgets the files it served when it quits.
     *
     * Outside the blessed folders only real media is served. LUNA follows links and checks the file they lead to: it needs
     * an audio, video or MIDI extension (`mp4`, `m4v`, `mov`, `webm`, `ogv`, `wav`, `aif`,
     * `aiff`, `mp3`, `m4a`, `flac`, `ogg`, `oga`, `opus`, `mid`, `midi`) and that format's
     * signature in its first bytes (`MThd` for a Standard MIDI File). Rejects with a
     * `Luna.Error` whose `code` is `uasrv.invalid_value` for a relative path, a folder, or a
     * file outside the blessed folders that is not audio, video or MIDI; `uasrv.filesystem_error` when
     * nothing is at `path` (a session opened on another computer, a file moved) or it cannot
     * be read; `uasrv.not_installed` when `addOnId` names no installed Add On with a local
     * page. A LUNA without the command rejects with `Luna.Unsupported`.
     *
     * @example
     * const [path] = await luna.gui.chooseFiles({ filters: ['*.mov;*.mp4'] });
     * if (path) video.src = await luna.gui.serveMediaFile('com.example.my-add-on', path);
     */
    async serveMediaFile(addOnId, path) {
      const reply = await this.post("serve_media_file", { add_on_id: addOnId, path }).catch(olderLuna("serveMediaFile", "serve_media_file"));
      if (typeof reply?.url !== "string") throw new UAError("uasrv.default_error", "serve_media_file: LUNA replied no url", { cmd: "post", path: "/gui/serve_media_file" });
      return reply.url;
    }
    /**
     * LUNA's native save dialog. Resolves to the chosen absolute path, or `undefined` if
     * cancelled. Like {@link chooseFiles} the path is for the engine (for example a render's
     * `outputPaths`); the page cannot write to it.
     *
     * @example
     * const path = await luna.gui.chooseSavePath({ extensions: ['wav'] });
     */
    async chooseSavePath(options = {}) {
      const payload = {};
      if (options.defaultPath !== void 0) payload["default_path"] = options.defaultPath;
      if (options.extensions !== void 0) payload["extensions"] = options.extensions;
      const files = await this.dialog("show_save_dialog", payload, ["release_file_chooser", "release_save_dialog"], options.timeoutMs);
      return files[0];
    }
    /** Show a progress task in LUNA. Call `progress()` with 0..100, then `done()`. */
    async startTask(title, options = {}) {
      const taskUid = randomUid();
      const payload = { task_uid: taskUid, title };
      if (options.nativeProgressBar !== void 0) payload["use_native_progress_bar"] = options.nativeProgressBar;
      await this.post("add_task", payload);
      return {
        progress: (percent) => this.post("update_task", { task_uid: taskUid, percent_complete: percent }).then(() => void 0),
        done: () => this.post("remove_task", { task_uid: taskUid }).then(() => void 0)
      };
    }
    /**
     * Hold back LUNA's modal progress dialog while this page shows its own progress UI, and
     * close one already open (fact 223). The hold is app-wide: it withholds the dialog of every
     * task but one started with `nativeProgressBar`. Release it from a `finally`; a watchdog
     * releases it after `maxMs` (default two minutes), and so does the page going away when it
     * still can. LUNA does not drop an Add On's hold when the Add On closes (fact 224).
     *
     * @example
     * const hold = await luna.gui.suppressProgress();
     * try {
     *   await work();
     * } finally {
     *   await hold.release();
     * }
     */
    suppressProgress(options = {}) {
      return suppressProgress((command, payload) => this.post(command, payload).catch(olderLuna("suppressProgress", command)), randomUid(), options);
    }
    async dialog(command, payload, release2, timeoutMs = 10 * 6e4) {
      const reply = await this.post(command, payload);
      const uid = typeof reply === "string" ? reply : reply?.uid;
      if (!uid) return [];
      const node = `/gui/file_chooser/${uid}`;
      const status = this.client.store.cell(node, "status");
      const files = this.client.store.cell(node, "files");
      const watch = this.client.store.watch(node, { load: { flatvalue: true, commands: false } });
      try {
        await watch.ready;
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            unsub();
            reject(new RequestTimeout(command, node, timeoutMs));
          }, timeoutMs);
          const check = () => {
            const s = status.value;
            if (s === "selected" || s === "cancelled") {
              clearTimeout(timer);
              unsub();
              resolve();
            }
          };
          const unsub = status.onChange(check);
          check();
        });
        return status.value === "selected" ? (files.value ?? []).map((f) => f.path) : [];
      } finally {
        watch.release();
        for (const name of typeof release2 === "string" ? [release2] : release2) {
          if (await this.post(name, { uid }).then(() => true, () => false)) break;
        }
      }
    }
  };
  function olderLuna(method, command) {
    return (err) => {
      if (err instanceof UAError && err.code === "uasrv.invalid_object") {
        throw new Unsupported(`luna.gui.${method}: this LUNA has no /gui/${command}; it needs a newer LUNA.`);
      }
      throw err;
    };
  }
  function pluginPayload(channelUid, slot, sessionUid, contextType) {
    const payload = { channel_uid: channelUid, insert_type: slot };
    if (sessionUid !== void 0) payload["session_uid"] = sessionUid;
    if (contextType !== void 0) payload["context_type"] = contextType;
    return payload;
  }
  function sameUid(a, b) {
    return a.replaceAll("-", "").toLowerCase() === b.replaceAll("-", "").toLowerCase();
  }
  function randomUid() {
    const g = globalThis;
    const raw = g.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    return raw.replaceAll("-", "");
  }
  function instanceIdFromUrl() {
    const search2 = globalThis.location?.search;
    if (typeof search2 !== "string") return void 0;
    return new URLSearchParams(search2).get("add_on_inst") ?? void 0;
  }
  function replyChildren(reply) {
    const children = typeof reply === "object" && reply !== null ? reply.children : void 0;
    return Array.isArray(children) ? children.filter((c) => typeof c === "object" && c !== null) : [];
  }
  function childName(child) {
    const raw = child.path ?? child.name;
    return typeof raw === "string" ? raw.slice(raw.lastIndexOf("/") + 1) : "";
  }

  // src/model/add-on-categories.ts
  var ADD_ON_CATEGORIES = [
    { name: "AI Tools", description: "Add Ons that use an AI model or agent as the core feature: assistants that answer questions about your session, generate or transform material from a prompt, or carry out tasks on your behalf." },
    { name: "Control", description: "Add Ons that control something (LUNA, plugins, other) from a custom interface: Add On UI, hardware controllers and surfaces, and control surface protocols." },
    { name: "Create", description: "Add Ons for starting something new: idea generators, chord and melody helpers, beat and pattern makers, lyric and arrangement prompts, and other sketching tools." },
    { name: "MIDI", description: "Add Ons that generate, process, route or edit MIDI data: arpeggiators, quantizers, humanizers and MIDI mapping tools." },
    { name: "Recording", description: "Add Ons that support capturing audio and MIDI: take management, punch and comp helpers, input and monitoring setup, and count-in or click tools." },
    { name: "Editing", description: "Add Ons that change existing material on the timeline: clip slicing, rearranging, fades, time and pitch adjustments, and batch edits across clips and tracks." },
    { name: "Mixing & Mastering", description: "Add Ons that shape the sound of a mix or master: level and pan balancing, EQ and dynamics helpers, reference and loudness tools, and metering built for mix decisions." },
    { name: "Workflow", description: "Add Ons that save steps: automation of repeated tasks, session setup and templates, track naming and organizing, shortcuts and macros, and other session tools." },
    { name: "Session Management", description: "Add Ons that show what is in a session and help keep it in order: session stats, track and plugin summaries, version and project notes, and audits of what a session contains." },
    { name: "Import & Export", description: "Add Ons that move material in and out of LUNA: file and stem export, format conversion, sample library and web source import, and exchange with other apps." },
    { name: "Education", description: "Add Ons for learning and teaching music and LUNA: lessons and tutorials, ear training, theory and practice tools, and visual guides that show what is playing." },
    { name: "Utility", description: "Small single-purpose Add Ons and everything that does not fit above: custom displays and panels, and other general helpers." }
  ];
  function isAddOnCategory(name) {
    return typeof name === "string" && ADD_ON_CATEGORIES.some((c) => c.name === name);
  }
  var KEYWORDS = {
    "AI Tools": [["ai", 2], ["agent", 2], ["assistant", 2], ["llm", 2], ["gpt", 2], ["claude", 2], ["chatbot", 2], ["prompt", 1], ["generative", 1], ["machine learning", 2], ["model", 1], ["natural language", 2]],
    Control: [["control surface", 2], ["controller", 2], ["hardware", 1], ["fader", 1], ["knob", 1], ["remote", 1], ["osc", 2], ["mackie", 2], ["hui", 2], ["console", 1], ["channel strip", 1], ["phone", 1], ["tablet", 1], ["plugin parameter", 1], ["control", 1]],
    Create: [["idea", 1], ["chord", 2], ["melody", 2], ["beat", 1], ["drum pattern", 2], ["pattern", 1], ["lyric", 2], ["songwriting", 2], ["sketch", 1], ["progression", 2], ["compos*", 1], ["generator", 1], ["inspiration", 2]],
    MIDI: [["midi", 2], ["arpeggiat*", 2], ["quantiz*", 2], ["humaniz*", 2], ["velocity", 1], ["note", 1], ["sysex", 2], ["cc", 1], ["piano roll", 1], ["notation", 1]],
    Recording: [["record", 2], ["take", 1], ["punch", 2], ["comp", 1], ["input", 1], ["monitor", 1], ["count-in", 2], ["count in", 2], ["click", 1], ["metronome", 2], ["arm", 1], ["capture", 1]],
    Editing: [["edit", 1], ["clip", 1], ["slice", 2], ["split", 1], ["trim", 1], ["fade", 2], ["crossfade", 2], ["rearrang*", 1], ["timeline", 1], ["time stretch", 2], ["pitch", 1], ["nudge", 1], ["batch", 1]],
    "Mixing & Mastering": [["mix", 2], ["master", 2], ["eq", 2], ["compressor", 1], ["dynamics", 1], ["loudness", 2], ["lufs", 2], ["meter", 1], ["metering", 2], ["pan", 1], ["level", 1], ["gain", 1], ["reference", 1], ["send", 1], ["bus", 1], ["reverb", 1]],
    Workflow: [["workflow", 2], ["automat*", 1], ["macro", 2], ["shortcut", 2], ["template", 2], ["rename", 1], ["naming", 1], ["organiz*", 1], ["color", 1], ["setup", 1], ["batch", 1], ["repeat", 1], ["hotkey", 2]],
    "Session Management": [["session", 1], ["stats", 2], ["statistic*", 2], ["summary", 1], ["audit", 2], ["inventory", 2], ["version", 1], ["notes", 1], ["project", 1], ["overview", 1], ["report", 1]],
    "Import & Export": [["import", 2], ["export", 2], ["stem", 2], ["bounce", 2], ["render", 1], ["convert", 2], ["format", 1], ["sample", 1], ["library", 1], ["download", 1], ["upload", 1], ["file", 1], ["share", 1]],
    Education: [["education", 2], ["educational", 2], ["learn*", 2], ["lesson", 2], ["teach*", 2], ["tutorial", 2], ["ear training", 2], ["student", 2], ["course", 1], ["quiz", 2], ["practice", 1], ["theory", 1], ["exercise", 1]],
    Utility: [["utility", 2], ["display", 1], ["panel", 1], ["clock", 1], ["timer", 1], ["helper", 1], ["viewer", 1], ["video", 1], ["notepad", 1], ["calculator", 2], ["tuner", 1]]
  };
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function suggestAddOnCategories(text, max = 3) {
    const lower = text.toLowerCase();
    const scored = [];
    ADD_ON_CATEGORIES.forEach(({ name }, order) => {
      let score = 0;
      for (const [word, weight] of KEYWORDS[name]) {
        const pattern = word.endsWith("*") ? escapeRegExp(word.slice(0, -1)) : `${escapeRegExp(word)}(?:s|es|d|ed|ing|r|er|ers|rs)?(?![a-z0-9])`;
        const matches = lower.match(new RegExp(`(?<![a-z0-9])${pattern}`, "g"));
        if (matches) score += weight * matches.length;
      }
      if (score > 0) scored.push({ name, score, order });
    });
    scored.sort((a, b) => b.score - a.score || a.order - b.order);
    const best = scored.slice(0, Math.max(1, max)).map((s) => s.name);
    return best.length ? best : ["Utility"];
  }

  // src/model/devices.ts
  var INPUT_ANALYSIS_KINDS = ["signal_level", "tempo", "instrument", "stereo_detect"];
  var DeviceInput = class extends Node {
    /** The input's uid; the same as {@link Node.id}. */
    uid;
    name;
    /** The engine's object type, `input`. */
    type;
    /** `mono` or `stereo`. */
    stemFormat;
    /** Uid of the device the input belongs to (`device_id`). */
    deviceId;
    deviceName;
    /** The device's channel numbers this input reads, from 0 (`device_channels`). */
    deviceChannels;
    /** The hardware's channel index list (`ChannelIndex`), as the driver reports it. */
    channelIndex;
    /** The hardware's I/O types (`IOType`), for example `["Mic"]`; empty for a plain driver. */
    ioType;
    /** True while a track in any open session records from this input (fact 185). */
    inUse;
    /**
     * The input's description as LUNA saves it with a track (`io_desc`): `name`, `stem_format`,
     * `device_channels`, `IOType`, `ChannelIndex`, `Name`, `DeviceHwID`, `hardware_index`.
     * Read-only here.
     */
    ioDesc;
    /** `signal_level_analysis_enabled`. Turn it on with {@link watchAnalysis}. */
    signalLevelAnalysisEnabled;
    /** `tempo_analysis_enabled`. */
    tempoAnalysisEnabled;
    /** `instrument_analysis_enabled`. */
    instrumentAnalysisEnabled;
    /** `stereo_detect_analysis_enabled`. */
    stereoDetectAnalysisEnabled;
    /**
     * The input's peak since the last result, as a linear gain (0..1, 1 = full scale), while
     * signal-level analysis is on. `-144` (LUNA's dB floor) means no result: the analysis is off,
     * or the input is below its silence threshold (fact 187).
     */
    signalLevelPeak;
    /** Detected tempo in BPM while tempo analysis is on; `0` means none detected (fact 187). */
    tempo;
    /** Detected instrument name while instrument analysis is on; `null` means none (fact 187). */
    instrument;
    /** True when stereo-detect analysis hears a stereo source; false also means no result (fact 187). */
    stereoDetect;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.uid = this.prop("uid");
      this.name = this.prop("name");
      this.type = this.prop("type");
      this.stemFormat = this.prop("stem_format");
      this.deviceId = this.prop("device_id");
      this.deviceName = this.prop("device_name");
      this.deviceChannels = this.prop("device_channels");
      this.channelIndex = this.prop("ChannelIndex");
      this.ioType = this.prop("IOType");
      this.inUse = this.prop("in_use");
      this.ioDesc = this.prop("io_desc");
      this.signalLevelAnalysisEnabled = this.prop("signal_level_analysis_enabled");
      this.tempoAnalysisEnabled = this.prop("tempo_analysis_enabled");
      this.instrumentAnalysisEnabled = this.prop("instrument_analysis_enabled");
      this.stereoDetectAnalysisEnabled = this.prop("stereo_detect_analysis_enabled");
      this.signalLevelPeak = this.prop("signal_level_peak");
      this.tempo = this.prop("tempo");
      this.instrument = this.prop("instrument");
      this.stereoDetect = this.prop("stereo_detect");
    }
    /**
     * Turn an input analysis on for as long as you hold it, and watch this input so its result
     * prop follows the engine. `release()` turns it back off.
     *
     * The `<kind>_analysis_enabled` switch is shared engine state: LUNA's own GUI, Auto Gain and
     * other clients use the same one (fact 186). So the SDK reference-counts holds per connection
     * and input, reads the switch before the first hold, and turns it on only if it was off; when
     * the last hold is released it turns it off again only if it was the one that turned it on.
     * A switch someone else had on is left on. Another client, or Auto Gain finishing, can still
     * turn it off while you hold it (fact 188); watch `signalLevelAnalysisEnabled` (and friends)
     * if that matters.
     *
     * `ready` rejects if the write is refused; release the hold anyway.
     *
     * @example
     * const hold = input.watchAnalysis('signal_level');
     * await hold.ready;
     * const off = input.signalLevelPeak.onChange(() => meter.value = Math.max(0, input.signalLevelPeak.value ?? 0));
     * // later
     * off();
     * hold.release();
     */
    watchAnalysis(kind) {
      this.assertLive();
      if (!INPUT_ANALYSIS_KINDS.includes(kind)) throw new TypeError(`watchAnalysis: unknown analysis '${String(kind)}'`);
      return holdAnalysis(this.client, this.path, kind);
    }
    /**
     * The input as the plain record {@link Client.audioInputs} returns, from the current props.
     *
     * @example
     * const rows = device.inputs.items.map((i) => i.snapshot());
     */
    snapshot() {
      return Object.freeze({
        uid: this.id,
        name: this.name.value ?? this.id,
        stemFormat: this.stemFormat.value ?? "mono",
        deviceId: this.deviceId.value ?? deviceUidOf(this.path),
        inUse: this.inUse.value === true
      });
    }
  };
  var DeviceInputs = class extends Collection {
    /** @internal */
    constructor(client, devicePath) {
      super(client, `${devicePath}/inputs`, (p) => new DeviceInput(client, p), { levels: 2, commands: false, flatvalue: true });
    }
    /**
     * Subscribe to the inputs and load them. Recursive unless `{ recursive: false }`, which
     * follows only inputs coming and going. Call `release` when done.
     *
     * @example
     * const w = device.inputs.watch();
     * await w.ready;
     */
    watch(options = {}) {
      return super.watch({ recursive: options.recursive ?? true });
    }
  };
  var DeviceOutput = class extends Node {
    uid;
    name;
    /** The engine's object type, `output`. */
    type;
    /** `mono` or `stereo`. */
    stemFormat;
    /**
     * The hardware's I/O types (`IOType`), for example `["CtrlRoom"]` for an Apollo's monitor
     * output; empty for a plain driver (fact 189).
     */
    ioType;
    deviceId;
    deviceName;
    deviceChannels;
    channelIndex;
    inUse;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.uid = this.prop("uid");
      this.name = this.prop("name");
      this.type = this.prop("type");
      this.stemFormat = this.prop("stem_format");
      this.ioType = this.prop("IOType");
      this.deviceId = this.prop("device_id");
      this.deviceName = this.prop("device_name");
      this.deviceChannels = this.prop("device_channels");
      this.channelIndex = this.prop("ChannelIndex");
      this.inUse = this.prop("in_use");
    }
  };
  var DeviceOutputs = class extends Collection {
    /** @internal */
    constructor(client, devicePath) {
      super(client, `${devicePath}/outputs`, (p) => new DeviceOutput(client, p), { levels: 2, commands: false, flatvalue: true });
    }
    /**
     * Subscribe to the outputs and load them; recursive unless `{ recursive: false }`.
     *
     * @example
     * const w = device.outputs.watch();
     * await w.ready;
     */
    watch(options = {}) {
      return super.watch({ recursive: options.recursive ?? true });
    }
  };
  var ActiveAudioEngine = class {
    /** @internal */
    constructor(client) {
      this.client = client;
      this.info = client.store.cell("/", "active_audio_engine");
      this.enabled = derived([this.info], () => this.info.value?.enabled, { distinct: true });
      this.engineType = derived([this.info], () => this.info.value?.audio_engine_type, { distinct: true });
      this.devices = derived([this.info], () => this.info.value?.devices, { distinct: true });
    }
    client;
    /** The whole value, as LUNA sends it. */
    info;
    /** `info.enabled`. */
    enabled;
    /** `info.audio_engine_type`. */
    engineType;
    /** `info.devices`. */
    devices;
    loading;
    /**
     * Read the value once. Later calls return the same promise.
     *
     * @example
     * await luna.activeAudioEngine.load();
     * luna.activeAudioEngine.engineType.value; // 'apollo'
     */
    load() {
      this.loading ??= this.client.store.load(PATH_ACTIVE_ENGINE).then(() => void 0);
      return this.loading;
    }
    /**
     * Subscribe to the property and read it, so the props follow LUNA. Refcounted through the
     * Store; call `release` when done.
     *
     * @example
     * const w = luna.activeAudioEngine.watch();
     * await w.ready;
     */
    watch() {
      const w = this.client.store.watch(PATH_ACTIVE_ENGINE, { load: {} });
      this.loading ??= w.ready;
      return w;
    }
    /**
     * True when the engine is running and uses `driver`: an id from `luna.drivers.connected`
     * (`AudioDeviceInfo.id`) or the entry itself. Not a `/devices/<uid>` uid: those name device
     * databases, not drivers (fact 190). False before the value is loaded.
     *
     * @example
     * await luna.drivers.load();
     * await luna.activeAudioEngine.load();
     * const live = (luna.drivers.connected.value ?? []).filter((d) => luna.activeAudioEngine.isDeviceActive(d));
     */
    isDeviceActive(driver) {
      const id = typeof driver === "string" ? driver : driver.id;
      const info = this.info.value;
      if (!info || info.enabled === false) return false;
      return (info.devices ?? []).some((d) => d.id === id);
    }
  };
  var PATH_ACTIVE_ENGINE = "/active_audio_engine";
  function deviceUidOf(inputPath) {
    return inputPath.split("/")[2] ?? "";
  }
  var holdsByClient = /* @__PURE__ */ new WeakMap();
  var teardownsByClient = /* @__PURE__ */ new WeakMap();
  function holdAnalysis(client, inputPath, kind) {
    const flag2 = `${kind}_analysis_enabled`;
    const key = `${inputPath}|${kind}`;
    let holds = holdsByClient.get(client);
    if (!holds) holdsByClient.set(client, holds = /* @__PURE__ */ new Map());
    let teardowns = teardownsByClient.get(client);
    if (!teardowns) teardownsByClient.set(client, teardowns = /* @__PURE__ */ new Map());
    let hold = holds.get(key);
    if (!hold) {
      const store = client.store;
      const w = store.watch(inputPath, { load: { flatvalue: true, commands: false, children: false } });
      const previous2 = teardowns.get(key) ?? Promise.resolve();
      const made = { refs: 0, owned: false, unwatch: w.release, ready: Promise.resolve() };
      made.ready = previous2.then(() => w.ready).then(async () => {
        await store.load(`${inputPath}/${flag2}`);
        if (store.cell(inputPath, flag2).value === true) return;
        await store.set(inputPath, flag2, true);
        made.owned = true;
      });
      hold = made;
      holds.set(key, hold);
    }
    hold.refs++;
    const h = hold;
    let released = false;
    return {
      ready: h.ready,
      release: () => {
        if (released) return;
        released = true;
        if (--h.refs > 0) return;
        if (holds.get(key) === h) holds.delete(key);
        const teardown = h.ready.catch(() => void 0).then(async () => {
          if (h.owned) await client.store.set(inputPath, flag2, false);
        }).catch(() => void 0).finally(() => {
          h.unwatch();
          if (teardowns.get(key) === teardown) teardowns.delete(key);
        });
        teardowns.set(key, teardown);
      }
    };
  }

  // src/model/system.ts
  var Drivers = class extends Node {
    connected;
    unsupported;
    sampleRates;
    /** @internal */
    constructor(client) {
      super(client, "/drivers");
      this.connected = this.prop("connected");
      this.unsupported = this.prop("unsupported");
      this.sampleRates = this.prop("sample_rates");
    }
  };
  var Device = class extends Node {
    name;
    deviceType;
    online;
    sampleRate;
    clockSource;
    /**
     * The device's audio inputs, live (fact 185). `inputs.watch()` follows hotplug, `in_use` and
     * analysis results.
     *
     * @example
     * const w = device.inputs.watch();
     * await w.ready;
     * device.inputs.items.map((i) => i.name.value);
     */
    inputs;
    /**
     * The device's audio outputs (fact 189).
     *
     * @example
     * await device.outputs.load();
     * device.outputs.items.map((o) => [o.name.value, o.stemFormat.value]);
     */
    outputs;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.inputs = new DeviceInputs(client, path);
      this.outputs = new DeviceOutputs(client, path);
      this.name = this.prop("name");
      this.deviceType = this.prop("device_type");
      this.online = this.prop("online");
      this.sampleRate = this.prop("sample_rate");
      this.clockSource = this.prop("clock_source");
    }
    release() {
      this.inputs.dispose();
      this.outputs.dispose();
    }
  };
  var Devices = class extends Collection {
    /** @internal */
    constructor(client) {
      super(client, "/devices", (p) => new Device(client, p), { levels: 2, commands: false, flatvalue: true });
    }
  };
  var LUNA_DEVICE_UID2 = "d37e009d693549a0b6ab1da3fad05443";
  var PSEUDO_MIDI_DEVICES = /* @__PURE__ */ new Set(["All", "None"]);
  var MidiPort = class extends Node {
    uid;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.uid = this.prop("uid");
    }
    /** True for a port that sends to the device, false for one that receives from it. */
    get isOutput() {
      return this.path.includes("/output_ports/");
    }
  };
  var MidiDevice = class extends Node {
    name;
    /** `normal` for a plain MIDI device; `null` for `All` and `None`. */
    midiDeviceType;
    midiDeviceMode;
    /** Milliseconds LUNA shifts MIDI sent to this device. */
    outputLateness;
    midiClockGenerationEnabled;
    /** For example `song1`. */
    midiClockGenerationMode;
    midiClockGenerationOffsetMs;
    /** `[status, data1, data2]` of the last note LUNA received from it; `[255, 255, 255]` before any. */
    lastMidiNote;
    /** `[status, data1, data2]` of the last controller LUNA received from it; `[255, 255, 255]` before any. */
    lastMidiControl;
    /**
     * Ports that receive MIDI from the device. `All` and `None` have one too. Empty on a LUNA
     * that does not publish ports (fact 123).
     */
    inputPorts;
    /** Ports that send MIDI to the device; empty for a device with no MIDI out (fact 123). */
    outputPorts;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.name = this.prop("name");
      this.midiDeviceType = this.prop("midi_device_type");
      this.midiDeviceMode = this.prop("midi_device_mode");
      this.outputLateness = this.prop("output_lateness");
      this.midiClockGenerationEnabled = this.prop("midi_clock_generation_enabled");
      this.midiClockGenerationMode = this.prop("midi_clock_generation_mode");
      this.midiClockGenerationOffsetMs = this.prop("midi_clock_generation_offset_ms");
      this.lastMidiNote = this.prop("last_midi_note");
      this.lastMidiControl = this.prop("last_midi_control");
      const portOptions = { levels: 2, commands: false, flatvalue: true };
      this.inputPorts = new Collection(client, `${path}/input_ports`, (p) => new MidiPort(client, p), portOptions);
      this.outputPorts = new Collection(client, `${path}/output_ports`, (p) => new MidiPort(client, p), portOptions);
    }
    /** The device's first input port. LUNA gives a device at most one. */
    get inputPort() {
      return this.inputPorts.items[0];
    }
    /** The device's first output port, or `undefined` when it has no MIDI out. */
    get outputPort() {
      return this.outputPorts.items[0];
    }
    release() {
      this.inputPorts.dispose();
      this.outputPorts.dispose();
    }
    /** False for LUNA's `All` and `None` entries, true for a device that exists. */
    get isPhysical() {
      const name = this.name.value;
      return name !== void 0 && !PSEUDO_MIDI_DEVICES.has(name);
    }
  };
  var MidiDevices = class extends Collection {
    /** @internal */
    constructor(client) {
      super(client, `/devices/${LUNA_DEVICE_UID2}/midi`, (p) => new MidiDevice(client, p), { levels: 4, commands: false, flatvalue: true });
    }
    /**
     * Called when a device is added or removed, and also when a device's name or ports arrive
     * or change. A device that comes online is announced before its name and ports (fact 123),
     * so a listener that needs `inputPort` or `outputPort` would otherwise miss it.
     *
     * @example
     * luna.midiDevices.onChange(() => {
     *   const inputs = luna.midiDevices.items.filter((d) => d.isPhysical && d.inputPort);
     *   draw(inputs);
     * });
     */
    onChange(listener) {
      const perDevice = /* @__PURE__ */ new Map();
      const follow = () => {
        const current = new Set(this.items);
        for (const [device, offs] of perDevice) {
          if (current.has(device)) continue;
          for (const off of offs) off();
          perDevice.delete(device);
        }
        for (const device of current) {
          if (perDevice.has(device)) continue;
          perDevice.set(device, [device.name.onChange(listener), device.inputPorts.onChange(listener), device.outputPorts.onChange(listener)]);
        }
      };
      const offMembers = super.onChange(() => {
        follow();
        listener();
      });
      follow();
      return () => {
        offMembers();
        for (const offs of perDevice.values()) for (const off of offs) off();
        perDevice.clear();
      };
    }
  };
  var Preferences = class extends Node {
    ioBufferSize;
    playFromStopLocation;
    recordMute;
    metronomeSound;
    metronomeSounds;
    /** @internal */
    constructor(client) {
      super(client, "/preferences");
      this.ioBufferSize = this.writableProp("io_buffer_size");
      this.playFromStopLocation = this.writableProp("play_from_stop_location");
      this.recordMute = this.writableProp("record_mute");
      this.metronomeSound = this.writableProp("metronome_sound");
      this.metronomeSounds = this.prop("metronome_sounds");
    }
    /**
     * The preferences under context `name`: JSON values kept on this computer across sessions
     * and launches (fact 232). Contexts are shared and unprotected: any Add On, and LUNA itself,
     * can read and write any of them, so pick a name nobody else will (such as your Add On's
     * id) and keep secrets in `luna.secrets` instead.
     *
     * @example
     * const prefs = luna.preferences.context('com.example.my-add-on');
     * await prefs.set('lastTemplate', template.uid);
     */
    context(name) {
      return new PreferenceContext(this.client, name);
    }
  };
  var Render = class extends Node {
    state;
    /** 0..100, as the engine reports it. {@link progress} is the 0..1 view. */
    percentComplete;
    errorMessage;
    name;
    renderType;
    /** Seconds left, as the engine estimates it; absent for an offline render. */
    timeRemaining;
    /** True for an offline (faster than real time) render, which reports no time remaining. */
    isOffline;
    totalSamples;
    /** 0..1, ready for a `<progress>` element. */
    progress;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.state = this.prop("state");
      this.percentComplete = this.prop("percent_complete");
      this.errorMessage = this.prop("error_message");
      this.name = this.prop("name");
      this.renderType = this.prop("type");
      this.timeRemaining = this.prop("time_remaining");
      this.isOffline = this.prop("render_is_offline");
      this.totalSamples = this.prop("total_samples");
      this.progress = derived([this.percentComplete], () => (this.percentComplete.value ?? 0) / 100);
    }
    /** `completed`, `aborted` or `failed`: nothing more will happen. */
    get isTerminal() {
      const s = this.state.value;
      return s === "completed" || s === "aborted" || s === "failed";
    }
    /**
     * Resolve when the render completes; reject when it is aborted, fails, or the engine
     * removes the node before it was seen to finish. A short offline render can finish and
     * vanish before anything observes it (fact 44), which surfaces as a `removed` rejection
     * even though the output was written.
     */
    done(timeoutMs = 10 * 6e4) {
      const watch = this.client.store.watch("/renders", { recursive: true, load: false });
      return new Promise((resolve, reject) => {
        let finish = () => void 0;
        const settle2 = () => {
          const s = this.state.value;
          if (s === "completed") {
            finish();
            resolve();
            return true;
          }
          if (s === "aborted" || s === "failed") {
            finish();
            reject(new UAError(s, `render ${this.name.value ?? this.id} ${s}${this.errorMessage.value ? `: ${this.errorMessage.value}` : ""}`, { path: this.path }));
            return true;
          }
          return false;
        };
        const timer = setTimeout(() => {
          finish();
          reject(new UAError("no_effect", `render ${this.id} did not settle within ${timeoutMs} ms`, { path: this.path }));
        }, timeoutMs);
        const offState = this.state.onChange(() => settle2());
        const renders = this.client.store.children("/renders");
        const offChildren = renders.onChange(() => {
          if (settle2()) return;
          if (!(renders.value ?? []).includes(this.id)) {
            finish();
            reject(new UAError("removed", `render ${this.id} was removed before it was seen to finish`, { path: this.path }));
          }
        });
        finish = () => {
          clearTimeout(timer);
          offState();
          offChildren();
          watch.release();
        };
        settle2();
      });
    }
    abort() {
      return this.wire.post("/renders/abort", { uid: this.id });
    }
    delete() {
      return this.wire.post("/renders/delete", { uid: this.id });
    }
  };
  var Renders = class extends Collection {
    /** @internal */
    constructor(client) {
      super(client, "/renders", (p) => new Render(client, p), { levels: 2, commands: false, flatvalue: true });
    }
  };
  var Job = class extends Node {
    uid;
    /** Nil uuid (32 zeros) when the job belongs to no session. */
    sessionUid;
    jobType;
    /** `queued | running | canceling | completed | failed | canceled`. */
    status;
    stage;
    error;
    warning;
    /** Track uid the job targets, when any. */
    targetUid;
    cancellable;
    percentComplete;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.uid = this.prop("uid");
      this.sessionUid = this.prop("session_uid");
      this.jobType = this.prop("job_type");
      this.status = this.prop("status");
      this.stage = this.prop("stage");
      this.error = this.prop("error");
      this.warning = this.prop("warning");
      this.targetUid = this.prop("target_uid");
      this.cancellable = this.prop("cancellable");
      this.percentComplete = this.prop("percent_complete");
    }
    get isTerminal() {
      const s = this.status.value;
      return s === "completed" || s === "failed" || s === "canceled";
    }
    /**
     * Resolve with the job's last snapshot when it completes (`empty: true` when LUNA found
     * nothing, `job.no_result`); reject with a `UAError` whose code is the job's error, or
     * `canceled`, `removed` (dropped without an ending) or `timeout`, as every SDK wait that runs
     * out of time rejects (`Luna.RequestTimeout` carries the same code). The ending is
     * latched as it arrives, so this answers even after LUNA removed the node, provided the
     * SDK was watching `/jobs` when the job ended (fact 200).
     *
     * @example
     * const result = await job.done();
     * if (result.empty) console.log('nothing found');
     */
    done(timeoutMs = 30 * 6e4) {
      const tracker = jobTracker(this.client);
      const settledEarly = tracker.ended(this.id);
      if (settledEarly) return outcomeOf(settledEarly);
      const release2 = tracker.acquire();
      return new Promise((resolve, reject) => {
        let finished = false;
        const finish = (job, removed, error) => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          off();
          release2();
          if (error) return reject(error);
          if (job && isTerminalJobStatus(job.status)) return void outcomeOf(job).then(resolve, reject);
          if (removed) reject(new UAError("removed", `job ${this.id} was removed before it was seen to finish`, { path: this.path }));
        };
        const timer = setTimeout(() => finish(void 0, false, new UAError("timeout", `job ${this.id} did not finish within ${timeoutMs} ms`, { path: this.path })), timeoutMs);
        const seed = {
          sessionUid: this.sessionUid.value,
          jobType: this.jobType.value,
          status: this.status.value,
          error: this.error.value,
          percentComplete: this.percentComplete.value
        };
        const off = tracker.waitFor(this.id, seed, (job, removed) => finish(job, removed));
        if (isTerminalJobStatus(this.status.value)) return finish(tracker.snapshot(this.id), false);
        this.wire.get(this.path, { children: false, commands: false, flatvalue: true }).then(
          (reply) => {
            const late = tracker.ended(this.id);
            if (late) return finish(late, true);
            const gone = !reply || typeof reply === "object" && Object.keys(reply).length === 0;
            if (gone) setTimeout(() => finish(tracker.ended(this.id) ?? tracker.snapshot(this.id), true), 0);
          },
          () => void 0
        );
      });
    }
    cancel() {
      return this.post("commands/cancel_job", {});
    }
  };
  function outcomeOf(job) {
    const o = jobOutcome(job);
    return "result" in o ? Promise.resolve(o.result) : Promise.reject(o.error);
  }
  var Jobs = class extends Collection {
    /** @internal */
    constructor(client) {
      super(client, "/jobs", (p) => new Job(client, p), { levels: 2, commands: false, flatvalue: true });
    }
  };

  // src/model/send-midi.ts
  var STATUS_NOTE_OFF = 128;
  var STATUS_NOTE_ON = 144;
  var STATUS_CONTROL_CHANGE = 176;
  var STATUS_PROGRAM_CHANGE = 192;
  var CC_BANK_SELECT_MSB = 0;
  var CC_BANK_SELECT_LSB = 32;
  function outputPortUid(target) {
    if (typeof target === "string") {
      if (!target) throw new UAError("invalid_value", "output port uid must not be empty");
      return target;
    }
    const port = target instanceof MidiDevice ? target.outputPort : target;
    if (!port) throw new UAError("not_found", `MIDI device ${target.name.value ?? target.id} has no output port`, { path: target.path });
    if (!(port instanceof MidiPort) || !port.isOutput) throw new UAError("invalid_value", `${port.path} is an input port; MIDI can only be sent to an output port`, { path: port.path });
    const uid = port.uid.value;
    if (!uid) throw new UAError("not_found", `${port.path} has no uid loaded; load luna.midiDevices first`, { path: port.path });
    return uid;
  }
  function statusByte(value) {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 128 || value > 255) {
      throw new UAError("out_of_range", "status byte must be an integer 0x80-0xff");
    }
    return value;
  }
  var MAX_SYSEX_BYTES = 65536;
  function sysexBytes(value) {
    if (!Array.isArray(value) && !(value instanceof Uint8Array)) throw new UAError("invalid_value", "sysex must be an array of bytes");
    const bytes = Array.from(value);
    if (bytes.length < 2 || bytes.length > MAX_SYSEX_BYTES) throw new UAError("out_of_range", `sysex must be 2-${MAX_SYSEX_BYTES} bytes`);
    if (bytes[0] !== 240 || bytes[bytes.length - 1] !== 247) throw new UAError("out_of_range", "sysex must start with 0xf0 and end with 0xf7");
    bytes.forEach((b, i) => {
      if (i > 0 && i < bytes.length - 1 && (typeof b !== "number" || !Number.isInteger(b) || b < 0 || b > 127)) {
        throw new UAError("out_of_range", `sysex data byte ${i} must be an integer 0-127`);
      }
    });
    return bytes;
  }
  function channelOf(value) {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 15) {
      throw new UAError("out_of_range", "channel must be an integer 0-15");
    }
    return value;
  }
  function checked(build, then) {
    let value;
    try {
      value = build();
    } catch (e) {
      return Promise.reject(e);
    }
    return then(value);
  }
  var SendMidi = class {
    constructor(client) {
      this.client = client;
    }
    client;
    /**
     * Send a note-on or note-off on channel 1 to one track. It also hands the note to LUNA's
     * record input (`record_enabled`), so record-enabled tracks hear it too.
     *
     * @example
     * await midi.sendMidiNote(session.uid, track.id, 60, 100, true);  // note-on
     * await midi.sendMidiNote(session.uid, track.id, 60, 0, false);   // note-off
     */
    sendMidiNote(sessionUid, trackUid, note, velocity, noteOn) {
      return this.sendMidi(sessionUid, trackUid, noteOn ? STATUS_NOTE_ON : STATUS_NOTE_OFF, note, velocity);
    }
    /**
     * Send any 3-byte MIDI message to one track: pitch bend, channel pressure and anything else
     * not wrapped here. The channel is in the status byte's low nibble.
     *
     * @example
     * await midi.sendMidi(session.uid, track.id, 0xe0, 0x00, 0x40);  // pitch bend centre
     */
    sendMidi(sessionUid, trackUid, byte0, byte1, byte2) {
      return checked(
        () => ({ session_uid: sessionUid, track_uid: trackUid, byte_0: statusByte(byte0), byte_1: midiByte(byte1, "data byte 1"), byte_2: midiByte(byte2, "data byte 2"), record_enabled: true }),
        (payload) => this.post("send_midi", payload)
      );
    }
    /**
     * Send the same note-on or note-off to several tracks. LUNA's own multi-track form delivers
     * the note but answers `uasrv.invalid_property` every time (fact 109), so this sends one
     * message per track instead, and hands the note to the record input once when any entry
     * asks for it, which is what LUNA's form does.
     *
     * @example
     * await midi.sendNoteToTracks(session.uid, [
     *   { trackUid: piano.id, recordEnable: true },
     *   { trackUid: pad.id },
     * ], 60, 100, true);
     */
    sendNoteToTracks(sessionUid, tracks, note, velocity, noteOn) {
      return checked(
        () => {
          if (!tracks.length) throw new UAError("out_of_range", "sendNoteToTracks(): give at least one track");
          const bytes = { byte_0: noteOn ? STATUS_NOTE_ON : STATUS_NOTE_OFF, byte_1: midiByte(note, "note"), byte_2: midiByte(velocity, "velocity") };
          const recordAt = tracks.findIndex((t) => t.recordEnable === true);
          return tracks.map((t, i) => ({ session_uid: sessionUid, track_uid: t.trackUid, ...bytes, record_enabled: i === recordAt }));
        },
        async (payloads) => {
          await Promise.all(payloads.map((p) => this.post("send_midi", p)));
        }
      );
    }
    /**
     * Send a Control Change to a track.
     *
     * @param controller CC number, 0-127 (7 volume, 10 pan, 64 sustain).
     * @param value CC value, 0-127.
     * @param channel MIDI channel, 0-15. Default 0.
     *
     * @example
     * await midi.sendController(session.uid, track.id, 64, 127);  // sustain down
     */
    sendController(sessionUid, trackUid, controller, value, channel = 0) {
      return checked(
        () => STATUS_CONTROL_CHANGE | channelOf(channel),
        (status) => this.sendMidi(sessionUid, trackUid, status, controller, value)
      );
    }
    /**
     * Send a Program Change to a track, after Bank Select MSB and LSB (CC 0 and CC 32) when
     * either bank is given; the one left out is sent as 0. The messages go in order, one at a
     * time, so another sender on the same track could land between them.
     *
     * @example
     * await midi.sendProgramChange(session.uid, track.id, 0);         // program only
     * await midi.sendProgramChange(session.uid, track.id, 5, 0, 12);  // bank 0/12, program 5
     */
    sendProgramChange(sessionUid, trackUid, program, bankMSB, bankLSB) {
      return checked(
        () => {
          midiByte(program, "program");
          if (bankMSB !== void 0) midiByte(bankMSB, "bankMSB");
          if (bankLSB !== void 0) midiByte(bankLSB, "bankLSB");
          return bankMSB !== void 0 || bankLSB !== void 0;
        },
        async (needsBank) => {
          if (needsBank) {
            await this.sendMidi(sessionUid, trackUid, STATUS_CONTROL_CHANGE, CC_BANK_SELECT_MSB, bankMSB ?? 0);
            await this.sendMidi(sessionUid, trackUid, STATUS_CONTROL_CHANGE, CC_BANK_SELECT_LSB, bankLSB ?? 0);
          }
          await this.sendMidi(sessionUid, trackUid, STATUS_PROGRAM_CHANGE, program, 0);
        }
      );
    }
    /**
     * Panic: send All Notes Off to every MIDI-capable track and connected MIDI device, in every
     * session.
     *
     * @example
     * await midi.sendAllNotesOff();
     */
    async sendAllNotesOff() {
      await this.client.raw.post("/sessions/send_midi_all_notes_off", {});
    }
    /**
     * Send a note-on or note-off on channel 1 to a MIDI input source by name, as though it came
     * from that device, bypassing track routing. It goes into LUNA, not out to the device; to
     * play the hardware use {@link sendNoteToOutput}. LUNA answers success for a name it does not
     * know (fact 108), so a typo fails silently.
     *
     * @example
     * await midi.sendDeviceNote('IAC Driver Bus 1', 60, 100, true);
     */
    sendDeviceNote(midiInputSource, note, velocity, noteOn) {
      return checked(
        () => ({ midi_input_source: midiInputSource, byte_0: noteOn ? STATUS_NOTE_ON : STATUS_NOTE_OFF, byte_1: midiByte(note, "note"), byte_2: midiByte(velocity, "velocity") }),
        (payload) => this.post("send_midi", payload)
      );
    }
    /**
     * Send any 3-byte MIDI message out of a MIDI device's output port, to the hardware rather
     * than a track (fact 124). The channel is in the status byte's low nibble. LUNA answers
     * success whatever the uid, so a port that has gone (the device was unplugged, or LUNA
     * restarted and gave it a new uid) fails silently: look the device up by name each session.
     *
     * @example
     * await luna.midiDevices.load();
     * const synth = luna.midiDevices.items.find((d) => d.name.value === 'Volt 876');
     * if (synth?.outputPort) await midi.sendMidiToOutput(synth, 0xe0, 0x00, 0x40);  // pitch bend centre
     */
    sendMidiToOutput(output, byte0, byte1, byte2) {
      return checked(
        () => ({ midi_input_source: outputPortUid(output), byte_0: statusByte(byte0), byte_1: midiByte(byte1, "data byte 1"), byte_2: midiByte(byte2, "data byte 2") }),
        (payload) => this.post("send_midi", payload)
      );
    }
    /**
     * Send a whole SysEx message out of a MIDI device's output port, to the hardware (fact 140):
     * `0xf0`, data bytes 0-127, `0xf7`, at most 64 KB. A message that breaks those rules rejects
     * with `out_of_range` before reaching LUNA. As with {@link sendMidiToOutput}, a port that has
     * gone fails silently, and a LUNA build without SysEx answers `uasrv.invalid_property`.
     *
     * @example
     * await luna.midiDevices.load();
     * const synth = luna.midiDevices.items.find((d) => d.name.value === 'DX7');
     * if (synth?.outputPort) await midi.sendSysExToOutput(synth, [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]);  // identity request
     */
    sendSysExToOutput(output, sysex) {
      return checked(
        () => ({ midi_input_source: outputPortUid(output), sysex: sysexBytes(sysex) }),
        (payload) => this.post("send_midi", payload)
      );
    }
    /**
     * Send a note-on or note-off out of a MIDI device's output port.
     *
     * @param channel MIDI channel, 0-15. Default 0.
     *
     * @example
     * await midi.sendNoteToOutput(synth, 60, 100, true);  // note-on, middle C
     * await midi.sendNoteToOutput(synth, 60, 0, false);   // note-off
     */
    sendNoteToOutput(output, note, velocity, noteOn, channel = 0) {
      return checked(
        () => (noteOn ? STATUS_NOTE_ON : STATUS_NOTE_OFF) | channelOf(channel),
        (status) => this.sendMidiToOutput(output, status, note, velocity)
      );
    }
    /**
     * Send a Control Change out of a MIDI device's output port.
     *
     * @param controller CC number, 0-127 (7 volume, 10 pan, 64 sustain).
     * @param value CC value, 0-127.
     * @param channel MIDI channel, 0-15. Default 0.
     *
     * @example
     * await midi.sendControllerToOutput(synth, 7, 100);  // volume
     */
    sendControllerToOutput(output, controller, value, channel = 0) {
      return checked(
        () => STATUS_CONTROL_CHANGE | channelOf(channel),
        (status) => this.sendMidiToOutput(output, status, controller, value)
      );
    }
    /**
     * Send a Program Change out of a MIDI device's output port, after Bank Select MSB and LSB
     * (CC 0 and CC 32) when either bank is given; the one left out is sent as 0.
     *
     * @param channel MIDI channel, 0-15. Default 0.
     *
     * @example
     * await midi.sendProgramChangeToOutput(synth, 5, 0, 12);  // bank 0/12, program 5
     */
    sendProgramChangeToOutput(output, program, bankMSB, bankLSB, channel = 0) {
      return checked(
        () => {
          midiByte(program, "program");
          if (bankMSB !== void 0) midiByte(bankMSB, "bankMSB");
          if (bankLSB !== void 0) midiByte(bankLSB, "bankLSB");
          return { uid: outputPortUid(output), channel: channelOf(channel), needsBank: bankMSB !== void 0 || bankLSB !== void 0 };
        },
        async ({ uid, channel: ch, needsBank }) => {
          if (needsBank) {
            await this.sendMidiToOutput(uid, STATUS_CONTROL_CHANGE | ch, CC_BANK_SELECT_MSB, bankMSB ?? 0);
            await this.sendMidiToOutput(uid, STATUS_CONTROL_CHANGE | ch, CC_BANK_SELECT_LSB, bankLSB ?? 0);
          }
          await this.sendMidiToOutput(uid, STATUS_PROGRAM_CHANGE | ch, program, 0);
        }
      );
    }
    async post(command, payload) {
      await this.client.raw.post(`/sessions/${command}`, payload);
    }
  };

  // src/model/midi-input.ts
  var ALL_DEVICE_NAME = "All";
  function isBatch(v) {
    return typeof v === "object" && v !== null && typeof v.seq === "number" && Array.isArray(v.events);
  }
  function typeOf(status, data2) {
    switch (status & 240) {
      case 128:
        return "noteOff";
      case 144:
        return data2 === 0 ? "noteOff" : "noteOn";
      case 160:
        return "polyPressure";
      case 176:
        return "controlChange";
      case 192:
        return "programChange";
      case 208:
        return "channelPressure";
      default:
        return "pitchBend";
    }
  }
  function isSysEx(bytes) {
    if (!Array.isArray(bytes) || bytes.length < 2 || bytes[0] !== 240 || bytes[bytes.length - 1] !== 247) return false;
    return bytes.every((b, i) => typeof b === "number" && Number.isInteger(b) && (i === 0 || i === bytes.length - 1 ? true : b >= 0 && b < 128));
  }
  function decodeMidiEvents(events, port, sysex = false) {
    const out = [];
    for (const e of events) {
      if (sysex && Array.isArray(e) && e.length === 3 && e[1] === 240 && typeof e[0] === "number" && isSysEx(e[2])) {
        out.push(Object.freeze({ type: "sysex", status: 240, channel: -1, data1: 0, data2: 0, sysex: Object.freeze([...e[2]]), time: e[0], port }));
        continue;
      }
      if (!Array.isArray(e) || e.length < 4) continue;
      const [time, status, data1, data2] = e;
      if (typeof time !== "number" || typeof status !== "number" || typeof data1 !== "number" || typeof data2 !== "number") continue;
      if (status < 128 || status > 239) continue;
      out.push(Object.freeze({ type: typeOf(status, data2), status, channel: status & 15, data1, data2, time, port }));
    }
    return out;
  }
  var MidiInput = class {
    constructor(client) {
      this.client = client;
    }
    client;
    /**
     * Call `handler` with every message `target` sends LUNA, in arrival order, until the returned
     * function is called. `target` is a {@link MidiDevice} from `luna.midiDevices` (load it
     * first), one of its input ports, or `'all'` for every device. Throws `not_found` for a
     * device with no MIDI in, or for `'all'` before `luna.midiDevices` has loaded.
     *
     * MIDI device uids change when LUNA restarts (fact 123), so an Add On that remembers a device
     * should remember its name and look it up again.
     *
     * @example
     * await luna.midiDevices.load();
     * const input = new Luna.MidiInput(luna);
     * const stop = input.listen('all', (m) => console.log(m.type, m.channel, m.data1, m.data2));
     */
    listen(target, handler, options = {}) {
      const port = this.inputPort(target);
      const path = `${port.path}/midi_events`;
      let lastSeq;
      let lastDropped;
      return this.client.raw.subscribe(path, (event) => {
        if (event.path !== path || event.operation !== void 0 || !isBatch(event.data)) return;
        const { seq, dropped = 0, events } = event.data;
        const missed = lastSeq !== void 0 && seq > lastSeq + 1 ? seq - lastSeq - 1 : 0;
        const newlyDropped = lastDropped !== void 0 && dropped > lastDropped;
        lastSeq = seq;
        lastDropped = dropped;
        if (missed > 0 || newlyDropped) options.onGap?.({ missed, dropped });
        for (const message of decodeMidiEvents(events, port, options.sysex === true)) handler(message);
      });
    }
    /**
     * Note-ons and note-offs from `target`, as `(note, velocity, noteOn, message)`. A note-on
     * with velocity 0 arrives as a note-off. Same targets and rules as {@link listen}.
     *
     * @example
     * const stop = input.onNote(keys, (note, velocity, on) => {
     *   if (on) lights.light(note, velocity); else lights.clear(note);
     * });
     */
    onNote(target, handler, options) {
      return this.listen(
        target,
        (m) => {
          if (m.type === "noteOn" || m.type === "noteOff") handler(m.data1, m.data2, m.type === "noteOn", m);
        },
        options
      );
    }
    /**
     * Controller changes from `target`, as `(controller, value, message)`. Same targets and
     * rules as {@link listen}.
     *
     * @example
     * const stop = input.onControlChange(keys, (cc, value) => {
     *   if (cc === 1) modWheel.value = String(value);
     * });
     */
    onControlChange(target, handler, options) {
      return this.listen(
        target,
        (m) => {
          if (m.type === "controlChange") handler(m.data1, m.data2, m);
        },
        options
      );
    }
    /**
     * Whole SysEx messages from `target`, as `(bytes, message)`, `bytes` running from `0xf0` to
     * `0xf7`. LUNA joins a SysEx that arrives in pieces and drops one over 64 KB (counted in
     * `onGap`'s `dropped`). Same targets and rules as {@link listen}. LUNA builds without SysEx
     * input send none (fact 138).
     *
     * @example
     * await luna.midiDevices.load();
     * const input = new Luna.MidiInput(luna);
     * const synth = luna.midiDevices.items.find((d) => d.name.value === 'DX7');
     * const stop = input.onSysEx(synth, (bytes) => {
     *   if (bytes[1] === 0x43) console.log('Yamaha SysEx,', bytes.length, 'bytes');
     * });
     */
    onSysEx(target, handler, options = {}) {
      return this.listen(
        target,
        (m) => {
          if (m.type === "sysex" && m.sysex) handler(m.sysex, m);
        },
        { ...options, sysex: true }
      );
    }
    inputPort(target) {
      if (target === "all") {
        const all = this.client.midiDevices.items.find((d) => d.name.value === ALL_DEVICE_NAME);
        if (!all?.inputPort) throw new UAError("not_found", "MIDI device 'All' has no input port; load luna.midiDevices first");
        return all.inputPort;
      }
      if (target instanceof MidiDevice) {
        const port = target.inputPort;
        if (!port) throw new UAError("not_found", `MIDI device ${target.name.value ?? target.id} has no input port`, { path: target.path });
        return port;
      }
      if (!(target instanceof MidiPort) || target.isOutput) {
        throw new UAError("invalid_value", `${target.path} is an output port; MIDI can only be received on an input port`, { path: target.path });
      }
      return target;
    }
  };

  // src/model/qwerty-midi.ts
  var NOTE_OFFSETS = {
    A: 0,
    W: 1,
    S: 2,
    E: 3,
    D: 4,
    F: 5,
    T: 6,
    G: 7,
    Y: 8,
    H: 9,
    U: 10,
    J: 11,
    K: 12,
    O: 13,
    L: 14,
    P: 15,
    ";": 16
  };
  var OCTAVE_MIN = 0;
  var OCTAVE_MAX = 9;
  var VELOCITY_STEP = 8;
  var VELOCITY_MIN = 1;
  var VELOCITY_MAX = 127;
  var clamp = (v, min, max) => Math.min(max, Math.max(min, Math.round(v)));
  function isEditable2(target) {
    const el = target;
    if (!el || typeof el.tagName !== "string") return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName.toUpperCase();
    if (tag === "TEXTAREA" || tag === "SELECT") return true;
    if (tag !== "INPUT") return false;
    const type = (el.type ?? "text").toLowerCase();
    return !["button", "checkbox", "radio", "range", "color", "file", "image", "reset", "submit"].includes(type);
  }
  var keyOf = (e) => e.key.length === 1 ? e.key.toUpperCase() : e.key;
  var QwertyMidi = class {
    constructor(sendMidi) {
      this.sendMidi = sendMidi;
      const scheduler = sendMidi.client.store.scheduler;
      this.octaveCell = new Cell(scheduler, 4);
      this.velocityCell = new Cell(scheduler, 100);
      this.octave = writable(this.octaveCell, async (v) => void this.octaveCell.update(clamp(v, OCTAVE_MIN, OCTAVE_MAX)));
      this.velocity = writable(this.velocityCell, async (v) => void this.velocityCell.update(clamp(v, VELOCITY_MIN, VELOCITY_MAX)));
    }
    sendMidi;
    /** The octave the note keys play, 0-9. A is C in this octave. `set` clamps. */
    octave;
    /** The note-on velocity, 1-127. `set` clamps. */
    velocity;
    octaveCell;
    velocityCell;
    /** Held notes by key: suppresses key repeat and sends the right note-off on keyup. */
    heldNotes = /* @__PURE__ */ new Map();
    /**
     * Handle a keydown. Returns true, having called `preventDefault()`, when the key was a note
     * or a control key; a repeat of a held note key is claimed but not replayed.
     *
     * @example
     * document.addEventListener('keydown', (e) => qwerty.handleKeyDown(e, session.uid, track.id));
     */
    handleKeyDown(e, sessionUid, trackUid) {
      return this.keyDown(e, (note, velocity, noteOn) => this.sendMidi.sendMidiNote(sessionUid, trackUid, note, velocity, noteOn));
    }
    /**
     * Handle a keydown, playing the note out of a MIDI device's output port rather than on a
     * track (fact 124). Same keys and return value as {@link handleKeyDown}; the note-off on
     * keyup goes to the same port.
     *
     * @param channel MIDI channel, 0-15. Default 0.
     *
     * @example
     * await luna.midiDevices.load();
     * const synth = luna.midiDevices.items.find((d) => d.name.value === 'Volt 876');
     * document.addEventListener('keydown', (e) => synth?.outputPort && qwerty.handleKeyDownToOutput(e, synth));
     */
    handleKeyDownToOutput(e, output, channel = 0) {
      return this.keyDown(e, (note, velocity, noteOn) => this.sendMidi.sendNoteToOutput(output, note, velocity, noteOn, channel));
    }
    keyDown(e, send) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing || isEditable2(e.target)) return false;
      const key = keyOf(e);
      const octave = this.octaveCell.value ?? 4;
      const velocity = this.velocityCell.value ?? 100;
      switch (key) {
        case "Z":
          this.octaveCell.update(Math.min(OCTAVE_MAX, octave + 1));
          e.preventDefault();
          return true;
        case "X":
          this.octaveCell.update(Math.max(OCTAVE_MIN, octave - 1));
          e.preventDefault();
          return true;
        case "C":
          this.velocityCell.update(Math.min(VELOCITY_MAX, velocity + VELOCITY_STEP));
          e.preventDefault();
          return true;
        case "V":
          this.velocityCell.update(Math.max(VELOCITY_MIN, velocity - VELOCITY_STEP));
          e.preventDefault();
          return true;
      }
      const offset = NOTE_OFFSETS[key];
      if (offset === void 0) return false;
      e.preventDefault();
      if (this.heldNotes.has(key)) return true;
      const note = octave * 12 + offset;
      this.heldNotes.set(key, { release: () => send(note, 0, false) });
      void send(note, velocity, true).catch(warn2);
      return true;
    }
    /**
     * Handle a keyup. Returns true, having called `preventDefault()`, when it released a held
     * note. The note-off goes to the track or output and pitch the note-on went to, even if the
     * octave or the target changed while it was held.
     *
     * @example
     * document.addEventListener('keyup', (e) => qwerty.handleKeyUp(e));
     */
    handleKeyUp(e) {
      const key = keyOf(e);
      const held = this.heldNotes.get(key);
      if (held === void 0) return false;
      this.heldNotes.delete(key);
      e.preventDefault();
      void held.release().catch(warn2);
      return true;
    }
    /**
     * Send a note-off for every held note. Call it when the page loses focus, which swallows
     * the keyups.
     *
     * @example
     * window.addEventListener('blur', () => qwerty.releaseAll());
     */
    releaseAll() {
      const held = [...this.heldNotes.values()];
      this.heldNotes.clear();
      for (const h of held) void h.release().catch(warn2);
    }
    /** Forget held notes without sending note-offs, after the connection was replaced. */
    resetConnection() {
      this.heldNotes.clear();
    }
    /** Release every held note and forget them. */
    destroy() {
      this.releaseAll();
    }
  };
  function warn2(error) {
    console.warn("Luna.QwertyMidi send failed:", error);
  }

  // src/model/plugins.ts
  function pluginVersionMeets(installed2, minVersion) {
    if (!minVersion) return true;
    if (!installed2 || !VERSION.test(installed2)) return false;
    const a = installed2.split(".").map(Number);
    const b = minVersion.split(".").map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i] ?? 0;
      const y = b[i] ?? 0;
      if (x !== y) return x > y;
    }
    return true;
  }
  var VERSION = /^\d+(\.\d+)*$/;
  var Plugin = class extends Node {
    pluginId;
    name;
    version;
    description;
    installed;
    favorite;
    /** `true`/`false` when licensing applies; `null` for plugins without UA licensing. */
    authorized;
    manifest;
    defaultPresetUid;
    /**
     * The plugin's format as LUNA decides it (`sdk_type`, fact 177). Prefer it to reading the
     * id: a UA-made VST3 or AU wrapper is `'uadx'` although its id says `.vst3.` or `.au.`.
     * `undefined` until loaded, and on a LUNA that does not report it.
     *
     * @example
     * const thirdParty = luna.plugins.items.filter((p) => ['vst', 'vst3', 'au'].includes(p.sdkType.value ?? ''));
     */
    sdkType;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.pluginId = this.prop("plugin_id");
      this.name = this.prop("name");
      this.version = this.prop("version");
      this.description = this.prop("description");
      this.installed = this.prop("installed");
      this.favorite = this.prop("favorite");
      this.authorized = this.prop("authorized");
      this.manifest = this.prop("manifest");
      this.defaultPresetUid = this.prop("default_preset_uid");
      this.sdkType = this.prop("sdk_type");
    }
    get manufacturer() {
      return this.manifest.value?.manufacturer;
    }
    /**
     * Whether it is installed at `minVersion` or later, as LUNA checks an Add On's
     * `requires_plugins` (fact 148). Reads the loaded {@link installed} and {@link version}.
     *
     * @example
     * const ok = luna.plugins.byId('com.eventfield.vst3.clex')?.isAtLeast('0.4.3') ?? false;
     */
    isAtLeast(minVersion) {
      return this.installed.value === true && pluginVersionMeets(this.version.value, minVersion);
    }
    get categories() {
      return this.manifest.value?.categories ?? [];
    }
  };
  var Plugins = class extends Collection {
    /** @internal */
    constructor(client) {
      super(client, "/plugins", (p) => new Plugin(client, p), { levels: 2, commands: false, flatvalue: true });
    }
    /** Case-insensitive match on name, short names, manufacturer or id. */
    find(query) {
      const q = query.toLowerCase();
      return this.items.filter((p) => {
        const m = p.manifest.value;
        return (p.name.value ?? "").toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (m?.manufacturer ?? "").toLowerCase().includes(q) || (m?.short_names ?? []).some((s) => s.toLowerCase().includes(q));
      });
    }
    byCategory(category) {
      return this.items.filter((p) => p.categories.includes(category));
    }
    /**
     * The `requirements` the loaded catalog does not meet, as LUNA decides (fact 148): none of a
     * requirement's `plugin_id` is installed at its `min_version` or later. Pass an Add On's
     * {@link AddOn.requiresPlugins}; with `blockingOnly`, the ones not marked `optional`, which
     * are what keeps LUNA from opening it. Load the catalog first.
     *
     * @example
     * await luna.plugins.load();
     * const me = luna.gui.addOns.byId('com.eventfield.clingy-ex-addon');
     * for (const r of luna.plugins.unmetRequirements(me?.requiresPlugins.value ?? [])) {
     *   console.warn(`needs ${r.name}${r.min_version ? ` ${r.min_version}` : ''}`);
     * }
     */
    unmetRequirements(requirements, options = {}) {
      return requirements.filter(
        (r) => !(options.blockingOnly && r.optional) && !r.plugin_id.some((id) => this.byId(id)?.isAtLeast(r.min_version) === true)
      );
    }
    /** All categories in the catalog, sorted. */
    get categories() {
      const set = /* @__PURE__ */ new Set();
      for (const p of this.items) for (const c of p.categories) set.add(c);
      return [...set].sort();
    }
    /**
     * Ask LUNA for the installed plugins matching a search, categories and favorites, sorted by
     * name (fact 127). With `insertType`, only those LUNA's plugins browser offers for that slot:
     * an instrument slot takes instruments, an effect slot effects, and with `channelUid` only
     * plugins that run in the channel's format. LUNA applies the rules; the catalog need not be
     * loaded. A LUNA without the query rejects with `Luna.Unsupported`.
     *
     * @example
     * const eqs = await luna.plugins.query({ categories: ['EQ'], search: 'pultec' });
     * const instruments = await luna.plugins.query({ insertType: 'instrument' });
     * await track.effects.byId('effect_0')!.setPlugin(eqs[0].pluginId);
     */
    async query(options = {}) {
      const payload = {};
      if (options.search !== void 0) payload["search"] = options.search;
      if (options.categories !== void 0) payload["categories"] = [...options.categories];
      if (options.favoritesOnly !== void 0) payload["favorite"] = options.favoritesOnly;
      if (options.insertType !== void 0) payload["insert_type"] = options.insertType;
      if (options.sessionUid !== void 0) payload["session_uid"] = options.sessionUid;
      if (options.channelUid !== void 0) payload["channel_uid"] = options.channelUid;
      if (options.limit !== void 0) payload["limit"] = options.limit;
      let reply;
      try {
        reply = await this.client.raw.post("/plugins/query", payload);
      } catch (err) {
        if (err instanceof UAError && err.code === "uasrv.invalid_object") throw new Unsupported("luna.plugins.query: this LUNA has no /plugins/query; it needs a newer LUNA.");
        throw err;
      }
      return (reply?.plugins ?? []).map((p) => ({
        pluginId: String(p["plugin_id"] ?? ""),
        name: String(p["name"] ?? ""),
        manufacturer: String(p["manufacturer"] ?? ""),
        categories: Array.isArray(p["categories"]) ? p["categories"].map(String) : [],
        favorite: p["favorite"] === true
      }));
    }
    /** Ask the engine to rescan installed plugins. */
    rescan() {
      return this.client.raw.post("/plugins/rescan");
    }
  };

  // src/model/presets.ts
  var TRACK_PRESET_CATEGORIES = ["Audio", "Instrument", "Bus", "Multi-Track"];
  var TAG_GROUP_WAIT_MS = 3e3;
  var HIDDEN_TRACK_TAGS = /* @__PURE__ */ new Set([...TRACK_PRESET_CATEGORIES, "All"]);
  var Presets = class extends Node {
    instrumentList;
    /** @internal */
    constructor(client) {
      super(client, "/presets");
    }
    /**
     * Query the preset database (fact 98). Columnar on the wire; rows here. Search and tags
     * combine: a row must match both (fact 120).
     *
     * @example
     * const rows = await luna.presets.query({ pluginId: 'uaudio_qi', search: 'EQ' });
     * rows[0]?.uid; rows[0]?.name; rows[0]?.factory;
     * const clean = await luna.presets.query({ pluginId, tags: ['Clean', 'Jazz'], withTags: true });
     * clean[0]?.tags; // ['Clean', 'Jazz', ...]
     */
    async query(options = {}) {
      const payload = {};
      if (options.pluginId !== void 0) payload["plugin_id"] = options.pluginId;
      if (options.deviceTypeId !== void 0) payload["device_type_id"] = options.deviceTypeId;
      if (options.search !== void 0) payload["search"] = options.search;
      if (options.tags !== void 0) payload["tag"] = typeof options.tags === "string" ? options.tags : [...options.tags];
      if (options.matchAnyTag !== void 0) payload["union"] = options.matchAnyTag;
      if (options.withTags) payload["tags"] = true;
      if (options.favorite !== void 0) payload["favorite"] = options.favorite;
      if (options.limit !== void 0) payload["limit"] = options.limit;
      if (options.includeInstrumentPresets !== void 0) payload["include_instrument_presets"] = options.includeInstrumentPresets;
      const reply = await this.post("query", payload);
      const rows = rowsFrom(reply?.results);
      if (rows.some((r) => r.isInstrumentPreset)) await this.namePlugins(rows);
      if (options.withDescriptions && rows.length) await this.describeRows(rows, options);
      return rows;
    }
    /**
     * Fill each row's `description` from its preset node (fact 175): the query does not
     * return it, so read each owner's `presets` folder once, description only.
     */
    async describeRows(rows, options) {
      const owners = /* @__PURE__ */ new Map();
      for (const row of rows) {
        const owner = presetOwner(row, options.pluginId, options.deviceTypeId);
        owners.set(owner, [...owners.get(owner) ?? [], row]);
      }
      await Promise.all(
        [...owners].map(async ([owner, list]) => {
          const reply = await this.wire.get(`${owner}/presets`, { children: true, levels: 2, properties: true, commands: false, flatvalue: true, propfilter: ["description"] });
          const byUid = /* @__PURE__ */ new Map();
          for (const child of reply?.children ?? []) if (child.path) byUid.set(child.path.slice(child.path.lastIndexOf("/") + 1), child.properties?.["description"]);
          for (const row of list) {
            const text = byUid.get(row.uid);
            row.description = typeof text === "string" ? text : "";
          }
        })
      );
    }
    /**
     * Mark a preset a favorite, or not (fact 175): a write of its `favorite`, which LUNA keeps
     * per owner. A plugin's preset is under its plugin: pass `pluginId` (the one you queried
     * with), or a row that carries one (an instrument preset in a track query). Anything else is
     * taken as a track preset. A row passed in has its `favorite` updated once LUNA accepts.
     *
     * @example
     * const [row] = await luna.presets.query({ pluginId: 'uaudio_qi', search: 'Vocal' });
     * await luna.presets.setFavorite(row, true, { pluginId: 'uaudio_qi' });
     * const [track] = await luna.presets.query({ deviceTypeId: 'track', search: 'Bass Rig' });
     * await luna.presets.setFavorite(track, true);
     */
    async setFavorite(preset, favorite, options = {}) {
      const row = typeof preset === "string" ? { uid: preset } : preset;
      const owner = presetOwner(row, options.pluginId, options.deviceTypeId);
      await this.wire.set(`${owner}/presets/${row.uid}/favorite`, favorite);
      if (typeof preset !== "string") preset.favorite = favorite;
    }
    /**
     * The plugins a track preset uses, as LUNA's preset browser checks them before applying
     * one (fact 176): read from the preset's package, `/workspace/sessions/<uid>`. Resolves to
     * `undefined` when LUNA reports no list (not a track preset, or an older LUNA): that means
     * unknown, not "no plugins".
     *
     * @example
     * const needs = await luna.presets.trackPresetPlugins(row);
     * const missing = needs?.filter((p) => !luna.plugins.byId(p.pluginId)?.installed.value) ?? [];
     */
    async trackPresetPlugins(preset) {
      const uid = typeof preset === "string" ? preset : preset.uid;
      const reply = await this.wire.get(`/workspace/sessions/${uid}`, { properties: true, children: false, commands: false, flatvalue: true, propfilter: ["plugins"] });
      let raw = reply?.properties?.["plugins"];
      if (typeof raw === "string") {
        try {
          raw = JSON.parse(raw);
        } catch {
          return void 0;
        }
      }
      if (!Array.isArray(raw)) return void 0;
      return raw.filter((e) => typeof e?.plugin_id === "string" && e.plugin_id !== "").map((e) => ({ pluginId: e.plugin_id, name: typeof e.name === "string" ? e.name : "" }));
    }
    /** Give each instrument preset its plugin, by the preset folder that holds it (fact 132). */
    async namePlugins(rows) {
      const sources = await this.instruments();
      for (const row of rows) {
        if (!row.isInstrumentPreset) continue;
        let best;
        for (const source of sources) {
          for (const root of source.roots) {
            const inside = row.path === root || row.path.startsWith(`${root}/`);
            if (inside && root.length > (best?.length ?? -1)) best = { source, length: root.length };
          }
        }
        if (best) {
          row.pluginId = best.source.pluginId;
          row.pluginName = best.source.name;
        }
      }
    }
    /**
     * The installed instruments with their preset folders, read once and kept: LUNA's own
     * browser asks for the same list. {@link forgetInstruments} reads it again next time.
     */
    instruments() {
      if (!this.instrumentList) {
        const reading = (async () => {
          const plugins = await this.client.plugins.query({ insertType: "instrument" }).catch(() => []);
          return Promise.all(
            plugins.filter((p) => addressable(p.pluginId)).map(async (p) => {
              const node = await within(this.wire.get(`/presets/plugins/${p.pluginId}`, { properties: true, children: false, commands: false, flatvalue: true, propfilter: ["factory_root", "user_root"] }), null);
              const roots = [node?.properties?.["factory_root"], node?.properties?.["user_root"]].filter((r) => typeof r === "string" && r !== "").map((r) => r.replace(/\/+$/, ""));
              return { pluginId: p.pluginId, name: p.name, roots };
            })
          );
        })();
        reading.catch(() => this.instrumentList = void 0);
        this.instrumentList = reading;
      }
      return this.instrumentList;
    }
    /** Read the installed instruments again on the next query, for example after one was installed. */
    forgetInstruments() {
      this.instrumentList = void 0;
    }
    /**
     * The plugin's preset name exactly `name` (case-insensitive), or `undefined`. When the
     * library holds a user preset and a factory preset of the same name, the user one wins,
     * matching what LUNA's preset browser opens.
     *
     * @example
     * const preset = await luna.presets.find('uaudio_qi', '4-Band EQ');
     * preset?.uid;
     */
    async find(pluginId, name) {
      const rows = await this.query({ pluginId, search: name });
      const q = name.trim().toLowerCase();
      const named = rows.filter((r) => r.name.trim().toLowerCase() === q);
      return named.find((r) => !r.factory) ?? named[0];
    }
    /**
     * The plugin's tag groups, in LUNA's order (fact 120). Empty for a plugin whose presets
     * are not tagged.
     *
     * @example
     * const groups = await luna.presets.tagGroups('uaudio_paradise_guitar_studio');
     * groups.map((g) => g.name); // ['TYPE', 'GENRE', 'DESCRIPTION']
     */
    async tagGroups(pluginId) {
      return this.groupsAt(`/presets/plugins/${pluginId}/categories`);
    }
    /**
     * The tag groups LUNA's track preset browser shows: the track presets' own groups and every
     * installed instrument plugin's, merged by group name, without the category tags (`Audio`,
     * `Instrument`, `Bus`, `Multi-Track`), which {@link TRACK_PRESET_CATEGORIES} lists (fact 132).
     *
     * @example
     * const groups = await luna.presets.trackTagGroups();
     * groups.map((g) => g.name); // ['GENRE', 'TYPE', ...]
     */
    async trackTagGroups() {
      const instruments = await this.instruments();
      const sources = [`/presets/devices/track/categories`, ...instruments.map((p) => `/presets/plugins/${p.pluginId}/categories`)];
      const all = (await Promise.all(sources.map((path) => within(this.groupsAt(path), [])))).flat();
      const byName = /* @__PURE__ */ new Map();
      for (const group of all) {
        const tags = group.tags.filter((t) => !HIDDEN_TRACK_TAGS.has(t));
        const seen = byName.get(group.name);
        if (seen) seen.tags.push(...tags.filter((t) => !seen.tags.includes(t)));
        else byName.set(group.name, { ...group, tags: [...new Set(tags)] });
      }
      return [...byName.values()].filter((g) => g.tags.length > 0);
    }
    async groupsAt(path) {
      const tree = await this.wire.get(path, { recursive: true, children: true, properties: true, commands: false, flatvalue: true });
      const groups = [];
      for (const category of tree?.children ?? []) {
        const subs = category.children?.find((c) => c.path === "sub_categories");
        for (const sub of subs?.children ?? []) {
          const tagFolder = sub.children?.find((c) => c.path === "tags");
          groups.push({
            uid: String(sub.properties?.["uid"] ?? sub.path ?? ""),
            name: String(sub.properties?.["name"] ?? ""),
            category: String(category.properties?.["name"] ?? ""),
            categoryUid: String(category.properties?.["uid"] ?? category.path ?? ""),
            tags: (tagFolder?.children ?? []).map((t) => t.properties?.["tag"]).filter((t) => typeof t === "string" && t !== "")
          });
        }
      }
      return groups;
    }
    /**
     * Presets UA Assistant recommends for free text, best first, five at most (fact 121). Needs
     * UA Assistant connected to LUNA ({@link Assistant.enabled}), and an instance of the plugin
     * created since it connected, which is when LUNA builds the plugin's search index. Otherwise
     * this rejects with the engine's code: `ua.unknown` (no assistant),
     * `assistant.preset_search_not_initialized_error` (no index yet), or
     * `assistant.input_classifier_rejected` (text the assistant will not search on). Empty text
     * resolves to `[]` without asking.
     *
     * @example
     * const recs = await luna.presets.recommend('uaudio_paradise_guitar_studio', 'warm jazz clean');
     * await slot.loadPreset(recs[0].uid);
     */
    async recommend(pluginId, text) {
      if (text.trim() === "") return [];
      const reply = await this.post("preset_recommendations", { plugin_id: pluginId, query: text });
      const results = Array.isArray(reply?.results) ? reply.results : [];
      return results.filter((r) => typeof r["preset_uuid"] === "string" && r["preset_uuid"] !== "").map((r) => {
        const rec = { uid: String(r["preset_uuid"]), name: String(r["preset_name"] ?? ""), score: Number(r["rrf_score"] ?? 0) };
        if (typeof r["keyword_score"] === "number") rec.keywordScore = r["keyword_score"];
        if (typeof r["semantic_score"] === "number") rec.semanticScore = r["semantic_score"];
        return rec;
      });
    }
    /**
     * A live preset selection over one plugin: set `search` and `tags`, read `presets` and
     * `recommendations`. Requests are debounced and a reply that a newer one overtook is
     * dropped, so the lists always match the inputs. Recommendations come from the search text,
     * keep only presets carrying the selected tags (so with tags selected there can be fewer
     * than the assistant's five), and stay empty while UA Assistant is not connected. A refused
     * request leaves them empty and its code in `recommendationError`. Call `dispose()` when done.
     *
     * @example
     * const sel = luna.presets.selection('uaudio_paradise_guitar_studio');
     * await sel.ready();
     * sel.groups.value;                       // tag groups for the chips
     * await sel.search.set('warm');
     * await sel.toggleTag('Clean');
     * await sel.settled();
     * sel.presets.items.map((p) => p.name);   // names containing "warm", tagged Clean
     * sel.recommendations.items[0]?.name;     // the assistant's best match, tagged Clean
     * await slot.loadPreset(sel.presets.items[0].uid);
     * sel.dispose();
     */
    selection(pluginId, options = {}) {
      return new PresetSelection(this.client, pluginId, options);
    }
    /**
     * A live selection over track presets, as LUNA's track preset browser offers them: a
     * `category` (one of {@link TRACK_PRESET_CATEGORIES}, or `null` for all), tags, and search
     * text. With no category or `Instrument`, installed instrument plugins' presets are listed
     * too, marked `isInstrumentPreset` (fact 132). Pass a row to {@link Session.newTrackFromPreset}
     * to make a track from it, or to {@link Track.loadPreset} to apply it to a track. Call
     * `dispose()` when done.
     *
     * @example
     * const sel = luna.presets.trackSelection({ category: 'Instrument' });
     * await sel.ready();
     * await sel.search.set('piano');
     * await sel.settled();
     * const [track] = await session.newTrackFromPreset(sel.presets.items[0]);
     * await track.loadPreset(sel.presets.items[1]);   // replace it with another
     * sel.dispose();
     */
    trackSelection(options = {}) {
      return new TrackPresetSelection(this.client, options);
    }
  };
  var Assistant = class extends Node {
    /** True while UA Assistant is connected to LUNA. */
    enabled;
    /** @internal */
    constructor(client) {
      super(client, "/assistant");
      this.enabled = this.prop("enabled");
    }
  };
  var PresetSelectionBase = class {
    constructor(client, base) {
      this.client = client;
      this.base = base;
      const scheduler = client.store.scheduler;
      this.presetsApi = client.presets;
      this.searchCell = new Cell(scheduler, "");
      this.tagsCell = new Cell(scheduler, []);
      this.groupsCell = new Cell(scheduler, []);
      this.presetsCell = new Cell(scheduler, []);
      this.loadingCell = new Cell(scheduler, false);
      this.errorCell = new Cell(scheduler, null);
      this.search = this.input(this.searchCell);
      this.tags = this.input(this.tagsCell);
      this.groups = this.groupsCell;
      this.presets = listOf(this.presetsCell, (row) => row.uid);
      this.loading = this.loadingCell;
      this.error = this.errorCell;
    }
    client;
    base;
    /** Search text. Filters `presets` by name; for a plugin's presets, it is also what recommendations are asked for. */
    search;
    /** Selected tags. */
    tags;
    /** The tag groups, once {@link ready}. */
    groups;
    /** Presets matching the search text and tags, with their tags. */
    presets;
    /** True while a request is in flight or waiting. */
    loading;
    /** The last list query's failure, or `null`. */
    error;
    searchCell;
    tagsCell;
    groupsCell;
    presetsCell;
    loadingCell;
    errorCell;
    presetsApi;
    releases = [];
    timers = /* @__PURE__ */ new Map();
    gens = /* @__PURE__ */ new Map();
    inFlight = 0;
    waiters = [];
    readyPromise;
    isDisposed = false;
    /** A writable input over `cell`: setting a new value queries again. */
    input(cell) {
      return writable(cell, async (value) => {
        if (cell.update(value)) this.changed();
      });
    }
    /**
     * Read the tag groups and the first list (and, for a plugin's presets, start following UA
     * Assistant's connection). Idempotent.
     *
     * @example
     * await sel.ready();
     */
    ready() {
      this.readyPromise ??= this.start();
      return this.readyPromise;
    }
    async start() {
      const groups = this.track(this.loadGroups().catch(() => []));
      this.schedule("query", 0, (current) => this.runQuery(current));
      this.groupsCell.update(await groups);
      await this.settled();
    }
    /**
     * Add `tag` to the selection, or remove it if selected.
     *
     * @example
     * await sel.toggleTag('Clean');
     */
    toggleTag(tag) {
      const now = this.tagsCell.value ?? [];
      return this.tags.set(now.includes(tag) ? now.filter((t) => t !== tag) : [...now, tag]);
    }
    /** Clear the search text and the selected tags. */
    async clear() {
      const searchMoved = this.searchCell.update("");
      const tagsMoved = this.tagsCell.update([]);
      if (searchMoved || tagsMoved) this.changed();
    }
    /** Query again with the current inputs, for example after presets were saved or deleted. */
    refresh() {
      this.changed();
    }
    /**
     * Resolves once nothing is waiting or in flight and the lists match the inputs.
     *
     * @example
     * await sel.search.set('lion');
     * await sel.settled();
     */
    settled() {
      if (this.idle) return this.client.store.scheduler.settled();
      return new Promise((resolve) => this.waiters.push(resolve)).then(() => this.client.store.scheduler.settled());
    }
    /** Stop following and drop pending requests. */
    dispose() {
      if (this.isDisposed) return;
      this.isDisposed = true;
      for (const timer of this.timers.values()) clearTimeout(timer);
      this.timers.clear();
      for (const [key, gen] of this.gens) this.gens.set(key, gen + 1);
      for (const release2 of this.releases.splice(0)) release2();
      this.wake();
    }
    get disposed() {
      return this.isDisposed;
    }
    get started() {
      return this.readyPromise !== void 0;
    }
    get idle() {
      return this.inFlight === 0 && this.timers.size === 0;
    }
    /** An input moved: query again after the quiet time. */
    changed() {
      if (this.isDisposed || !this.started) return;
      this.schedule("query", this.base.queryDelayMs ?? 100, (current) => this.runQuery(current));
    }
    /**
     * Run `job` after `delayMs`, replacing a pending job under the same `key`. `current()` turns
     * false once a newer job for the key is scheduled, so a stale reply can be dropped.
     */
    schedule(key, delayMs, job) {
      if (this.isDisposed) return;
      clearTimeout(this.timers.get(key));
      const gen = (this.gens.get(key) ?? 0) + 1;
      this.gens.set(key, gen);
      this.timers.set(
        key,
        setTimeout(() => {
          this.timers.delete(key);
          void job(() => this.gens.get(key) === gen).finally(() => this.wake());
        }, delayMs)
      );
      this.loadingCell.update(true);
    }
    async runQuery(current) {
      const options = { ...this.listQuery(), withTags: true };
      if (this.base.limit !== void 0) options.limit = this.base.limit;
      try {
        const rows = await this.track(this.presetsApi.query(options));
        if (!current()) return;
        this.presetsCell.update(rows);
        this.errorCell.update(null);
      } catch (err) {
        if (!current()) return;
        this.errorCell.update(asError(err));
      }
    }
    /** Count `work` as in flight until it settles. */
    track(work) {
      this.inFlight++;
      return work.finally(() => {
        this.inFlight--;
        this.wake();
      });
    }
    wake() {
      if (!this.idle && !this.isDisposed) return;
      this.loadingCell.update(false);
      const waiters = this.waiters.splice(0);
      for (const w of waiters) w();
    }
  };
  var PresetSelection = class extends PresetSelectionBase {
    /** @internal Use {@link Presets.selection}. */
    constructor(client, pluginId, options = {}) {
      super(client, options);
      this.pluginId = pluginId;
      this.options = options;
      const scheduler = client.store.scheduler;
      this.anyCell = new Cell(scheduler, false);
      this.recsCell = new Cell(scheduler, []);
      this.recErrorCell = new Cell(scheduler, null);
      this.matchAnyTag = this.input(this.anyCell);
      this.recommendations = listOf(this.recsCell, (rec) => rec.uid);
      this.recommendationsAvailable = derived([client.assistant.enabled], () => client.assistant.enabled.value === true);
      this.recommendationError = this.recErrorCell;
    }
    pluginId;
    options;
    /** Match presets carrying any selected tag rather than all of them. Default false. */
    matchAnyTag;
    /** UA Assistant's picks for the search text, among presets carrying the tags. Best first. */
    recommendations;
    /** True while UA Assistant is connected, so recommendations can come. */
    recommendationsAvailable;
    /** The last recommendation request's failure, or `null`. */
    recommendationError;
    anyCell;
    recsCell;
    recErrorCell;
    /** Uids carrying the selected tags, by tag selection, for filtering recommendations. */
    taggedUids = /* @__PURE__ */ new Map();
    /** Query again with the current inputs, for example after presets were saved or deleted. */
    refresh() {
      this.taggedUids.clear();
      super.refresh();
    }
    async start() {
      if (this.wantsRecommendations) {
        const watch = this.client.assistant.watch();
        this.releases.push(watch.release);
        this.releases.push(this.client.assistant.enabled.onChange(() => this.scheduleRecommendations(0)));
        await watch.ready.catch(() => {
        });
      }
      await super.start();
    }
    loadGroups() {
      return this.presetsApi.tagGroups(this.pluginId);
    }
    listQuery() {
      const tags = this.tagsCell.value ?? [];
      const options = { pluginId: this.pluginId, search: this.searchCell.value ?? "" };
      if (tags.length > 0) {
        options.tags = tags;
        options.matchAnyTag = this.anyCell.value === true;
      }
      return options;
    }
    changed() {
      super.changed();
      this.scheduleRecommendations(this.options.recommendDelayMs ?? 300);
    }
    get wantsRecommendations() {
      return this.options.recommend !== false;
    }
    scheduleRecommendations(delayMs) {
      if (!this.started) return;
      this.schedule("recommend", delayMs, (current) => this.runRecommendations(current));
    }
    async runRecommendations(current) {
      const text = (this.searchCell.value ?? "").trim();
      if (!this.wantsRecommendations || text === "" || this.client.assistant.enabled.value !== true) {
        this.recsCell.update([]);
        this.recErrorCell.update(null);
        return;
      }
      const tags = this.tagsCell.value ?? [];
      const any = this.anyCell.value === true;
      try {
        const [recs, allowed] = await this.track(Promise.all([this.presetsApi.recommend(this.pluginId, text), tags.length > 0 ? this.tagged(tags, any) : Promise.resolve(void 0)]));
        if (!current()) return;
        const kept = allowed ? recs.filter((r) => allowed.has(r.uid)) : recs;
        this.recsCell.update(kept.slice(0, this.options.maxRecommendations ?? 5));
        this.recErrorCell.update(null);
      } catch (err) {
        if (!current()) return;
        this.recsCell.update([]);
        this.recErrorCell.update(asError(err));
      }
    }
    /** Every preset uid carrying `tags`, ignoring the search text. Cached per tag selection. */
    tagged(tags, any) {
      const key = JSON.stringify([any, [...tags].sort()]);
      let found = this.taggedUids.get(key);
      if (!found) {
        found = this.presetsApi.query({ pluginId: this.pluginId, tags, matchAnyTag: any }).then((rows) => new Set(rows.map((r) => r.uid)));
        found.catch(() => this.taggedUids.delete(key));
        this.taggedUids.set(key, found);
      }
      return found;
    }
  };
  var TrackPresetSelection = class extends PresetSelectionBase {
    /**
     * The category, one of {@link TRACK_PRESET_CATEGORIES}, or `null` for all of them. With
     * `null` or `Instrument`, instrument plugins' presets are listed too (fact 132).
     */
    category;
    categoryCell;
    /** @internal Use {@link Presets.trackSelection}. */
    constructor(client, options = {}) {
      super(client, options);
      this.categoryCell = new Cell(client.store.scheduler, options.category ?? null);
      this.category = this.input(this.categoryCell);
    }
    /** Query again with the current inputs, and read the installed instruments again. */
    refresh() {
      this.presetsApi.forgetInstruments();
      super.refresh();
    }
    /** True when the current category lists instrument plugins' presets as well. */
    get includesInstrumentPresets() {
      const category = this.categoryCell.value ?? null;
      return category === null || category === "Instrument";
    }
    loadGroups() {
      return this.presetsApi.trackTagGroups();
    }
    listQuery() {
      const category = this.categoryCell.value ?? null;
      const tags = [...category ? [category] : [], ...this.tagsCell.value ?? []];
      const options = { deviceTypeId: "track", search: this.searchCell.value ?? "", includeInstrumentPresets: this.includesInstrumentPresets };
      if (tags.length > 0) options.tags = tags;
      return options;
    }
  };
  function addressable(pluginId) {
    return pluginId !== "" && pluginId === pluginId.trim();
  }
  function within(work, fallback) {
    let timer;
    const late = new Promise((resolve) => timer = setTimeout(() => resolve(fallback), TAG_GROUP_WAIT_MS));
    return Promise.race([work.catch(() => fallback), late]).finally(() => clearTimeout(timer));
  }
  function presetOwner(row, pluginId, deviceTypeId) {
    const plugin = pluginId ?? row.pluginId;
    if (plugin) return `/presets/plugins/${plugin}`;
    return `/presets/devices/${deviceTypeId ?? "track"}`;
  }
  function asError(err) {
    return err instanceof UAError ? err : new UAError("unknown", err instanceof Error ? err.message : String(err));
  }
  function rowsFrom(results) {
    if (!results) return [];
    const n = typeof results.num_rows === "number" ? results.num_rows : results["uid"]?.length ?? 0;
    const col = (name, i, fallback) => {
      const arr = results[name];
      return Array.isArray(arr) && arr[i] !== void 0 ? arr[i] : fallback;
    };
    const withTags = Array.isArray(results["tags"]);
    const withInstrument = Array.isArray(results["is_instrument_preset"]);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const row = {
        uid: col("uid", i, ""),
        name: col("name", i, ""),
        version: col("version", i, 0),
        // The engine sends favorite and factory as 0/1 integers (fact 98).
        favorite: Boolean(col("favorite", i, 0)),
        factory: Boolean(col("factory", i, 0)),
        path: col("path", i, "")
      };
      if (withTags) row.tags = col("tags", i, []);
      if (withInstrument) row.isInstrumentPreset = Boolean(col("is_instrument_preset", i, false));
      rows.push(row);
    }
    return rows;
  }

  // src/model/musical.ts
  var TempoEvent = class extends Node {
    tick;
    /** Seconds at this event, as the engine computed it. */
    time;
    /** BPM from this event on. Writable: LUNA's own tempo field sets it directly (fact 95). */
    tempo;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.tick = this.prop("tick");
      this.time = this.prop("time");
      this.tempo = this.writableProp("tempo");
    }
  };
  var TimeSignature = class extends Node {
    tick;
    bar;
    numerator;
    denominator;
    partial;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.tick = this.prop("tick");
      this.bar = this.prop("bar");
      this.numerator = this.prop("numerator");
      this.denominator = this.prop("denominator");
      this.partial = this.prop("partial");
    }
    /** Ticks in one bar of this signature. */
    get ticksPerBar() {
      const n = this.numerator.value ?? 4;
      const d = this.denominator.value ?? 4;
      return n * (TICKS_PER_BEAT * 4 / d);
    }
    /** Ticks in one beat of this signature. */
    get ticksPerBeat() {
      const d = this.denominator.value ?? 4;
      return TICKS_PER_BEAT * 4 / d;
    }
  };
  var KeySignature = class extends Node {
    tick;
    /** Positive for sharps, negative for flats. */
    sharpsAndFlats;
    isMinor;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.tick = this.prop("tick");
      this.sharpsAndFlats = this.prop("sharps_and_flats");
      this.isMinor = this.prop("is_minor");
    }
  };
  var Timeline = class {
    /** @internal */
    constructor(tempos, signatures, subscribe = () => () => {
    }) {
      this.tempos = tempos;
      this.signatures = signatures;
      this.subscribe = subscribe;
    }
    tempos;
    signatures;
    subscribe;
    /**
     * Called when a tempo event or time signature is added, removed or edited (a tempo edit
     * rewrites an existing event's `tempo`, so `tempoMap.onChange` alone does not see it), and
     * when the maps finish loading, so anything computed from this timeline (bar|beat, seconds,
     * clip lengths planned from the tempo) should be recomputed. `marker.barBeat` and
     * `marker.seconds` already follow it.
     *
     * @example
     * session.musical.timeline.onChange(() => redrawRuler());
     * session.musical.timeline.onChange(() => (bpm.textContent = `${session.musical.tempoAt(session.transport.tick)} BPM`));
     */
    onChange(listener) {
      return this.subscribe(listener);
    }
    /**
     * Whether the tempo map has at least one event whose tick and BPM have loaded, so
     * {@link tempoAt}, {@link seconds} and {@link tickAtSeconds} can answer. Until then they throw
     * `unavailable` rather than assume a tempo. {@link onChange} fires when it becomes true.
     *
     * @example
     * const bpm = timeline.tempoLoaded ? timeline.tempoAt(tick) : undefined;
     */
    get tempoLoaded() {
      return this.readableTempos().length > 0;
    }
    /** Tempo events whose tick and BPM have both loaded, in tick order. */
    readableTempos() {
      const rows = [];
      for (const t of this.tempos()) {
        const tick = t.tick.value;
        const tempo = t.tempo.value;
        if (typeof tick === "number" && typeof tempo === "number" && Number.isFinite(tempo) && tempo > 0) rows.push({ tick, tempo });
      }
      return rows.sort((a, b) => a.tick - b.tick);
    }
    /** {@link readableTempos}, or `unavailable` when there are none: never a guessed tempo. */
    sortedTempos(what) {
      const rows = this.readableTempos();
      if (rows.length === 0) {
        throw new UAError("unavailable", `timeline.${what}(): the tempo map is not loaded; await session.ready() (or session.musical.ready()) first`);
      }
      return rows;
    }
    sortedSignatures() {
      return this.signatures().map((s) => ({ tick: s.tick.value ?? 0, bar: s.bar.value ?? 1, n: s.numerator.value ?? 4, d: s.denominator.value ?? 4 })).sort((a, b) => a.tick - b.tick);
    }
    /**
     * BPM in effect at `tick`: the last tempo event at or before it, or the first event's when
     * `tick` is before them all. Throws `unavailable` while the tempo map is not loaded
     * ({@link tempoLoaded}); it never assumes 120.
     *
     * @example
     * await session.musical.ready();
     * session.musical.timeline.tempoAt(session.transport.tick);   // 90
     */
    tempoAt(tick) {
      const tempos = this.sortedTempos("tempoAt");
      let tempo = tempos[0].tempo;
      for (const t of tempos) {
        if (t.tick <= tick) tempo = t.tempo;
        else break;
      }
      return tempo;
    }
    /**
     * Ticks to seconds, integrating the tempo map (constant tempo between events). Throws
     * `unavailable` while the tempo map is not loaded ({@link tempoLoaded}).
     *
     * @example
     * timeline.seconds(Luna.TICKS_PER_BEAT * 8);   // 4 at 120 BPM, 5.333… at 90
     */
    seconds(tick) {
      const tempos = this.sortedTempos("seconds");
      let seconds = 0;
      let at = 0;
      let tempo = tempos[0].tempo;
      for (const t of tempos) {
        if (t.tick >= tick) break;
        if (t.tick > at) {
          seconds += (t.tick - at) / TICKS_PER_BEAT * (60 / tempo);
          at = t.tick;
        }
        tempo = t.tempo;
      }
      seconds += (tick - at) / TICKS_PER_BEAT * (60 / tempo);
      return seconds;
    }
    /**
     * The inverse of {@link barBeat}: the tick a bar|beat|tick position lands on. `beat`
     * defaults to 1 and `tick` to 0, so `tickAt({ bar: 9 })` is the downbeat of bar 9 and
     * matches {@link tickAtBar}.
     *
     * @example
     * const tick = timeline.tickAt({ bar: 5, beat: 3, tick: 0 });
     * timeline.barBeat(tick);   // { bar: 5, beat: 3, tick: 0 }
     */
    tickAt(at) {
      const sigs = this.sortedSignatures();
      const applicable = sigs.filter((s) => s.bar <= at.bar);
      const sig = applicable.at(-1) ?? { tick: 0, bar: 1, n: 4, d: 4 };
      const beatTicks = TICKS_PER_BEAT * 4 / sig.d;
      return sig.tick + (at.bar - sig.bar) * beatTicks * sig.n + ((at.beat ?? 1) - 1) * beatTicks + (at.tick ?? 0);
    }
    /**
     * The inverse of {@link seconds}: the tick a wall-clock offset lands on, walking the same
     * tempo map. Use it to place a clip that must play unstretched — its span in ticks
     * depends on the tempo where it sits. Throws `unavailable` while the tempo map is not
     * loaded ({@link tempoLoaded}).
     *
     * @example
     * const start = 4 * Luna.TICKS_PER_BEAT;
     * const stop = timeline.tickAtSeconds(timeline.seconds(start) + source.length.value / 1e9);
     */
    tickAtSeconds(seconds) {
      const tempos = this.sortedTempos("tickAtSeconds");
      if (!(seconds > 0)) return 0;
      let elapsed = 0;
      let at = 0;
      let tempo = tempos[0].tempo;
      for (const t of tempos) {
        if (t.tick <= at) {
          tempo = t.tempo;
          continue;
        }
        const spanSeconds = (t.tick - at) / TICKS_PER_BEAT * (60 / tempo);
        if (elapsed + spanSeconds >= seconds) return at + (seconds - elapsed) / (60 / tempo) * TICKS_PER_BEAT;
        elapsed += spanSeconds;
        at = t.tick;
        tempo = t.tempo;
      }
      return at + (seconds - elapsed) / (60 / tempo) * TICKS_PER_BEAT;
    }
    /**
     * Bar, beat (1-based) and the engine ticks left over within the beat at `tick`, honouring
     * time signature changes. Same units as `location.bar_beat`, so it passes straight to
     * {@link formatBarBeat} (or `Luna.formatBarBeat`) with no conversion.
     *
     * @example
     * timeline.barBeat(Luna.TICKS_PER_BEAT * 5 + Luna.TICKS_PER_DISPLAY_TICK * 120);   // { bar: 2, beat: 2, tick: 12_000_000_000 }
     */
    barBeat(tick) {
      const sigs = this.sortedSignatures();
      let sig = sigs.find((s) => s.tick <= tick) ? sigs.filter((s) => s.tick <= tick).at(-1) : { tick: 0, bar: 1, n: 4, d: 4 };
      if (sigs.length === 0) sig = { tick: 0, bar: 1, n: 4, d: 4 };
      const beatTicks = TICKS_PER_BEAT * 4 / sig.d;
      const barTicks = beatTicks * sig.n;
      const rel = Math.max(0, tick - sig.tick);
      const bar = sig.bar + Math.floor(rel / barTicks);
      const inBar = rel % barTicks;
      const beat = 1 + Math.floor(inBar / beatTicks);
      return { bar, beat, tick: inBar % beatTicks };
    }
    /**
     * `tick` as LUNA's bar|beat counter shows it, `1|1|000` with display ticks (960 per beat):
     * `Luna.formatBarBeat(timeline.barBeat(tick))` in one call.
     *
     * @example
     * timeline.formatBarBeat(marker.location.value!);   // "5|3|240"
     */
    formatBarBeat(tick) {
      return formatBarBeat(tick === void 0 ? void 0 : this.barBeat(tick));
    }
    /** Tick at the start of `bar` (1-based). */
    tickAtBar(bar) {
      const sigs = this.sortedSignatures();
      let sig = { tick: 0, bar: 1, n: 4, d: 4 };
      for (const s of sigs) {
        if (s.bar <= bar) sig = s;
        else break;
      }
      const barTicks = TICKS_PER_BEAT * 4 / sig.d * sig.n;
      return sig.tick + (bar - sig.bar) * barTicks;
    }
  };
  var Musical = class {
    /** @internal */
    constructor(client, sessionPath, sessionUid, transaction = (_name, fn) => fn()) {
      this.client = client;
      this.sessionPath = sessionPath;
      this.sessionUid = sessionUid;
      this.transaction = transaction;
      const opts = { levels: 2, commands: false, flatvalue: true };
      this.tempoMap = new Collection(client, `${sessionPath}/tempo_map`, (p) => new TempoEvent(client, p), opts);
      this.timeSignatures = new Collection(client, `${sessionPath}/time_signatures`, (p) => new TimeSignature(client, p), opts);
      this.keySignatures = new Collection(client, `${sessionPath}/key_signatures`, (p) => new KeySignature(client, p), opts);
      this.chords = new Chords(client, sessionPath, sessionUid);
      this.timeline = new Timeline(
        () => this.tempoMap.items,
        () => this.timeSignatures.items,
        (listener) => this.onMapsChange(listener)
      );
    }
    client;
    sessionPath;
    sessionUid;
    transaction;
    tempoMap;
    timeSignatures;
    keySignatures;
    /** LUNA's Chord ruler. */
    chords;
    timeline;
    readyPromise;
    /** Follow membership of both maps and the fields the timeline reads from each row. */
    onMapsChange(listener) {
      let rows = [];
      const follow = () => {
        for (const u of rows) u();
        rows = [
          ...this.tempoMap.items.flatMap((t) => [t.tick, t.tempo].map((p) => p.onChange(listener))),
          ...this.timeSignatures.items.flatMap((s) => [s.tick, s.bar, s.numerator, s.denominator].map((p) => p.onChange(listener)))
        ];
      };
      const membership = () => {
        follow();
        listener();
      };
      follow();
      const offTempos = this.tempoMap.onChange(membership);
      const offSignatures = this.timeSignatures.onChange(membership);
      return () => {
        offTempos();
        offSignatures();
        for (const u of rows) u();
        rows = [];
      };
    }
    /** Load the three maps and the Chord ruler. Idempotent. */
    ready() {
      this.readyPromise ??= Promise.all([this.tempoMap.load(), this.timeSignatures.load(), this.keySignatures.load(), this.chords.load()]).then(() => void 0);
      return this.readyPromise;
    }
    /**
     * BPM in effect at `tick`; see {@link Timeline.tempoAt}. Throws `unavailable` until
     * {@link ready} has loaded the tempo map, rather than assume 120.
     *
     * @example
     * await session.musical.ready();
     * session.musical.tempoAt(0);   // the session tempo
     */
    tempoAt(tick) {
      return this.timeline.tempoAt(tick);
    }
    post(command, payload) {
      return this.client.raw.post(`${this.sessionPath}/${command}`, { session_uid: this.sessionUid, ...payload });
    }
    /**
     * The tempo event in effect at `tick`: the last one at or before it, or the first when the
     * tick is before them all. `undefined` only while the map is empty or unloaded.
     *
     * @example
     * const row = session.musical.tempoEventAt(session.transport.tick);
     */
    tempoEventAt(tick) {
      const rows = [...this.tempoMap.items].filter((t) => t.tick.value !== void 0).sort((a, b) => a.tick.value - b.tick.value);
      let row = rows[0];
      for (const t of rows) {
        if (t.tick.value <= tick) row = t;
        else break;
      }
      return row;
    }
    /**
     * Change the tempo in effect at `tick` to `bpm`, as LUNA's own tempo field does: it writes
     * the `tempo` of that tempo event rather than adding one (fact 95). In a single-tempo session
     * that is the session tempo. Rejects with `out_of_range` for a non-positive or non-finite
     * BPM, and `not_found` when the map has no events yet.
     *
     * @example
     * await session.musical.ready();
     * await session.musical.setTempoInEffectAt(96, session.transport.tick);
     */
    async setTempoInEffectAt(bpm, tick) {
      if (!Number.isFinite(bpm) || bpm <= 0) throw new UAError("out_of_range", "setTempoInEffectAt(): bpm must be a finite number > 0");
      const row = this.tempoEventAt(tick);
      if (!row) throw new UAError("not_found", "setTempoInEffectAt(): the tempo map has no events; await musical.ready() first");
      await row.tempo.set(bpm);
    }
    /**
     * Add a tempo event at a tick with `set_tempo` (default: the session start). On the measured
     * build `set_tempo` answered `device.database_error`; to change the tempo in effect, use
     * {@link setTempoInEffectAt}.
     */
    setTempo(bpm, tick = 0) {
      return this.post("set_tempo", { tempo: bpm, tick });
    }
    deleteTempo(tick) {
      return this.post("delete_tempo", { tick });
    }
    /** Set the time signature from `bar` (1-based). */
    setTimeSignature(numerator, denominator, bar = 1) {
      return this.post("set_time_signature", { numerator, denominator, bar });
    }
    /**
     * Set the key from `tick` (default: the session start) and resolve to its row once it is in
     * {@link keySignatures}. LUNA keeps one key signature per tick, so one already at `tick` is
     * rewritten in place (the same row), not joined by a second (fact 113). One undo entry. `sharpsAndFlats` is 1..7 sharps, -1..-7
     * flats, 0 for C major or A minor. Rejects with `out_of_range` before anything is sent for a
     * value outside those, a non-boolean `isMinor` or a non-integer tick.
     *
     * @example
     * await session.musical.ready();
     * await session.musical.setKeySignature(-3, true);   // C minor from the start
     * session.musical.keySignatureAt(session.transport.tick)?.sharpsAndFlats.value;   // -3
     */
    async setKeySignature(sharpsAndFlats, isMinor, tick = 0) {
      requireTick(tick, "key signature tick");
      if (!Number.isInteger(sharpsAndFlats) || sharpsAndFlats < -7 || sharpsAndFlats > 7) {
        throw new UAError("out_of_range", "setKeySignature(): sharpsAndFlats must be an integer from -7 (flats) to 7 (sharps)");
      }
      if (typeof isMinor !== "boolean") throw new UAError("out_of_range", "setKeySignature(): isMinor must be a boolean");
      await this.post("set_key_signature", { tick, sharps_and_flats: sharpsAndFlats, is_minor: isMinor });
      const isIt = (k) => k.tick.value === tick && k.sharpsAndFlats.value === sharpsAndFlats && k.isMinor.value === isMinor;
      await settle(() => this.keySignatures.items.some(isIt), "set key signature", {
        path: this.keySignatures.path,
        refresh: () => this.keySignatures.reload(),
        flush: () => this.client.store.scheduler.flush()
      });
      return this.keySignatures.items.find(isIt);
    }
    /**
     * The key signature in effect at `tick`: the last one at or before it. `undefined` when
     * none is, or the list is not loaded (`await musical.ready()` first).
     *
     * @example
     * const key = session.musical.keySignatureAt(session.transport.tick);
     * key && `${key.sharpsAndFlats.value} ${key.isMinor.value ? 'minor' : 'major'}`;
     */
    keySignatureAt(tick) {
      let found;
      for (const k of this.keySignatures.items) {
        const at = k.tick.value;
        if (at === void 0 || at > tick) continue;
        if (found === void 0 || at > found.tick.value) found = k;
      }
      return found;
    }
    /**
     * Delete the time signature that starts at `bar` and resolve once it has left
     * {@link timeSignatures}. The signatures after it keep their bar numbers and move to the
     * ticks the earlier signature now gives them, as LUNA's ruler does (fact 154). One undo
     * entry. Rejects with `not_found` when no loaded signature starts at `bar` (LUNA answers
     * success and changes nothing), and with `out_of_range` for the session's first signature,
     * which every bar is counted from.
     *
     * @example
     * await session.musical.ready();
     * await session.musical.setTimeSignature(3, 4, 9);
     * await session.musical.deleteTimeSignature(9);   // back to the signature before bar 9
     */
    async deleteTimeSignature(bar) {
      if (!Number.isInteger(bar)) throw new UAError("out_of_range", "deleteTimeSignature(): bar must be an integer");
      const rows = [...this.timeSignatures.items].filter((s) => s.tick.value !== void 0).sort((a, b) => a.tick.value - b.tick.value);
      const row = rows.find((s) => s.bar.value === bar);
      if (!row) throw new UAError("not_found", `deleteTimeSignature(): no time signature starts at bar ${bar}; await musical.ready() first`);
      if (row === rows[0]) throw new UAError("out_of_range", "deleteTimeSignature(): the first time signature cannot be deleted; set it instead");
      await this.post("delete_time_signature", { bar });
      await settle(() => !this.timeSignatures.items.some((s) => s.bar.value === bar), "delete time signature", {
        path: this.timeSignatures.path,
        refresh: () => this.timeSignatures.reload(),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    /**
     * Delete the key signature at `tick` and resolve once it has left {@link keySignatures}.
     * One undo entry. Rejects with `out_of_range` for tick 0, the session's key, which LUNA
     * refuses to delete (change it with {@link setKeySignature}), and with `not_found` when no
     * loaded key signature is at `tick` (fact 154).
     *
     * @example
     * await session.musical.ready();
     * const key = session.musical.keySignatureAt(session.transport.tick);
     * if (key && key.tick.value !== 0) await session.musical.deleteKeySignature(key.tick.value!);
     */
    async deleteKeySignature(tick) {
      requireTick(tick, "key signature tick");
      if (tick === 0) throw new UAError("out_of_range", "deleteKeySignature(): the key at tick 0 cannot be deleted; set it instead");
      if (!this.keySignatures.items.some((k) => k.tick.value === tick)) throw new UAError("not_found", `deleteKeySignature(): no key signature at tick ${tick}; await musical.ready() first`);
      await this.post("delete_key_signature", { tick });
      await settle(() => !this.keySignatures.items.some((k) => k.tick.value === tick), "delete key signature", {
        path: this.keySignatures.path,
        refresh: () => this.keySignatures.reload(),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    /** Move bar one to `tick`. */
    setBarOne(tick) {
      return this.post("set_bar_one", { tick });
    }
    settleChords(done, what) {
      return settle(done, what, {
        path: this.chords.path,
        refresh: () => this.chords.reload(),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    hasChord(tick, name, fresh = () => true) {
      const wanted = normalizeChordName2(name);
      return this.chords.items.some((c) => c.location.value === tick && c.name.value === wanted && fresh(c));
    }
    /**
     * Add a chord to the Chord ruler at `tick` and resolve to it once it is in {@link chords}.
     * A chord already at `tick` is replaced, as in LUNA (fact 100). One undo entry.
     *
     * @example
     * const chord = await session.musical.addChord(Luna.WHOLE_NOTE * 4, 'Am7');
     */
    async addChord(tick, name) {
      requireTick(tick, "chord tick");
      if (typeof name !== "string" || name.trim() === "") throw new UAError("out_of_range", "chord name must be a non-empty chord name");
      const before = new Set(this.chords.items.map((c) => c.id));
      await this.post("set_chord", { location: tick, name });
      const fresh = (c) => !before.has(c.id);
      await this.settleChords(() => this.hasChord(tick, name, fresh), "add chord");
      return this.chords.items.find((c) => c.location.value === tick && fresh(c));
    }
    /**
     * Write a chord progression as one undo entry. Each chord replaces any chord at its tick.
     * With `replaceRange: [start, stop]`, every other chord from `start` up to (not including)
     * `stop` is deleted first, so the span holds exactly the progression. Chords already on the
     * ruler as asked are not rewritten, and a call that changes nothing makes no undo entry.
     * Resolves once {@link chords} shows the result.
     *
     * @example
     * const bar = Luna.WHOLE_NOTE;
     * await session.musical.setChords(
     *   ['C', 'Am', 'F', 'G'].map((name, i) => ({ tick: i * bar, name })),
     *   { replaceRange: [0, 4 * bar] },
     * );
     */
    async setChords(chords, options = {}) {
      checkChordSpecs(chords);
      const range = options.replaceRange;
      if (range) {
        requireTick(range[0], "replaceRange start");
        requireTick(range[1], "replaceRange stop");
      }
      const ticks = new Set(chords.map((c) => c.tick));
      const inRange = (c) => range !== void 0 && (c.location.value ?? 0) >= range[0] && (c.location.value ?? 0) < range[1];
      const stale = this.chords.items.filter((c) => inRange(c) && !ticks.has(c.location.value ?? 0));
      const staleIds = new Set(stale.map((c) => c.id));
      const writes = chords.filter((c) => !this.hasChord(c.tick, c.name));
      if (stale.length === 0 && writes.length === 0) return;
      await this.transaction(options.undoName ?? "Set Chords", async () => {
        for (const c of stale) await this.post("delete_chord", { rowid: c.rowid.value ?? Number(c.id) });
        for (const c of writes) await this.post("set_chord", { location: c.tick, name: c.name });
      });
      await this.settleChords(
        () => chords.every((c) => this.hasChord(c.tick, c.name)) && !this.chords.items.some((c) => staleIds.has(c.id)),
        "set chords"
      );
    }
    /**
     * Delete every chord on the ruler as one undo entry ("Clear Chords").
     *
     * @example await session.musical.clearChords();
     */
    async clearChords() {
      await this.post("delete_chord", { all: true });
      await this.settleChords(() => this.chords.items.length === 0, "clear chords");
    }
    /** @internal */
    dispose() {
      this.chords.dispose();
      this.tempoMap.dispose();
      this.timeSignatures.dispose();
      this.keySignatures.dispose();
    }
  };

  // src/model/workspace.ts
  var SessionPackage = class extends Node {
    uid;
    fileName;
    directoryPath;
    sessionType;
    factory;
    favorite;
    comments;
    created;
    modified;
    lastOpened;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.uid = this.prop("uid");
      this.fileName = this.prop("file_name");
      this.directoryPath = this.prop("directory_path");
      this.sessionType = this.prop("session_type");
      this.factory = this.prop("factory");
      this.favorite = this.writableProp("favorite");
      this.comments = this.writableProp("comments");
      this.created = this.prop("created");
      this.modified = this.prop("modified");
      this.lastOpened = this.prop("last_opened");
    }
    /** Display name without the `.luna` or `.lunatemplate` extension. */
    get name() {
      return (this.fileName.value ?? this.id).replace(/\.luna(template)?$/, "");
    }
  };
  var Workspace = class extends Node {
    /** All packages. Large; prefer {@link query} or {@link recent} unless you need live updates. */
    packages;
    /** @internal */
    constructor(client) {
      super(client, "/workspace");
      this.packages = new Collection(client, "/workspace/sessions", (p) => new SessionPackage(client, p), { levels: 2, commands: false, flatvalue: true });
    }
    /** Query the workspace database. Columnar on the wire; rows here. */
    async query(options = {}) {
      const payload = { table_id: options.table ?? "sessions", tags: true, include_online: true };
      if (options.sessionPackageUid !== void 0) payload["session_package_uid"] = options.sessionPackageUid;
      if (options.factory !== void 0) payload["factory"] = options.factory;
      if (options.favorite !== void 0) payload["favorite"] = options.favorite;
      if (options.tags !== void 0) payload["tag"] = options.tags;
      if (options.anyTag !== void 0) payload["union"] = options.anyTag;
      if (options.search !== void 0) payload["search"] = options.search;
      if (options.orderBy !== void 0) payload["order_by"] = options.orderBy;
      if (options.orderAs !== void 0) payload["order_as"] = options.orderAs;
      if (options.lastOpenedMin !== void 0) payload["last_opened_min"] = options.lastOpenedMin;
      if (options.limit !== void 0) payload["limit"] = options.limit;
      const reply = await this.post("query", payload);
      return rowsFrom2(reply?.results);
    }
    /** Most recently opened packages, newest first. */
    recent(limit = 20) {
      return this.query({ orderBy: "last_opened", orderAs: "desc", limit });
    }
    /**
     * The session templates (`.lunatemplate` packages) on disk, for
     * `sessions.createFromTemplate()`. A template's `uid` is stored inside the package, so it is
     * the same on every machine and survives a rename.
     *
     * `tag` keeps the templates carrying that tag, and `factory` the ones LUNA ships (`true`)
     * or the user's (`false`); LUNA filters both itself (fact 162). LUNA restamps its factory
     * templates' uids when it is built, so a tag is the steadier way to find one of those.
     *
     * @example
     * const template = (await luna.workspace.templates()).find((t) => t.uid === MY_TEMPLATE_UID);
     * if (template) await luna.sessions.createFromTemplate({ templatePackageUid: template.uid, name: 'My Song' });
     * const [brochure] = await luna.workspace.templates({ tag: 'brochure', factory: true });
     */
    async templates(options = {}) {
      const payload = { table_id: "sessions", session_type: "session_template", tags: true, include_online: true };
      if (options.tag !== void 0) {
        if (typeof options.tag !== "string" || options.tag.trim() === "") throw new UAError("out_of_range", "templates(): tag must be a non-empty string");
        payload["tag"] = options.tag;
      }
      if (options.factory !== void 0) payload["factory"] = options.factory;
      const reply = await this.post("query", payload);
      return rowsFrom2(reply?.results).filter((row) => row.online && isSessionTemplate(row.sessionType) && (options.factory === void 0 || row.factory === options.factory));
    }
    /**
     * Tag a session package, as a template or session is tagged for {@link templates} and
     * {@link query} to find (fact 161). LUNA writes the tag into the package's metadata, so it
     * travels with it. Rejects with `uasrv.read_only_property` for a factory package and
     * `device.database_error` for an unknown one.
     *
     * @example await luna.workspace.addTag(session.sessionPackageUid.value!, 'brochure');
     */
    async addTag(packageUid, tag) {
      if (typeof packageUid !== "string" || packageUid === "") throw new UAError("out_of_range", "addTag(): packageUid must be a session package uid");
      if (typeof tag !== "string" || tag.trim() === "") throw new UAError("out_of_range", "addTag(): tag must be a non-empty string");
      await this.post("add_tag", { tag, session_package_uid: packageUid });
    }
    /**
     * The most recently opened packages as a live list, newest first, with `openSessionUid` on
     * the rows that are open now. It queries again whenever a session is opened, closed or
     * switched to (LUNA moves `last_opened` then), and on `refresh()`. Call `dispose()` when
     * done.
     *
     * @example
     * const recent = await luna.workspace.recentList(10);
     * const draw = () => list.replaceChildren(...recent.items.map((r) => row(r.name, r.openSessionUid !== undefined)));
     * recent.onChange(draw);
     * draw();
     */
    async recentList(limit = 20) {
      const list = new RecentSessions(this, limit);
      await list.start();
      return list;
    }
    /**
     * What `deleteUnusedMedia` would remove from a package, without removing anything (LUNA's
     * pre-flight, fact 240). `unusedUids` and `kept` need a LUNA that lists files; an older one
     * answers the counts only and leaves both `undefined`.
     *
     * LUNA keeps a file that the session uses now, that undo or a saved version could bring
     * back, or that only an auto-backup uses; `kept` gives the reason for each.
     *
     * @example
     * const plan = await luna.workspace.unusedMedia(session.sessionPackageUid.value!);
     * plan.unusedCount;                                  // files that would go
     * plan.unusedUids?.map((uid) => sources.byId(uid)?.displayName.value);
     * plan.kept?.filter((k) => k.reason === 'undo');     // freed by clearing undo
     */
    async unusedMedia(packageUid, options = {}) {
      const pkg = requirePackageUid(packageUid, "unusedMedia");
      const payload = { session_package_uid: pkg, pre_flight: true };
      if (options.clearUndo) payload["clear_undo"] = true;
      return unusedMediaFrom(await this.post("delete_unused_media", payload));
    }
    /**
     * Remove a package's unused audio files (LUNA's Delete Unused Media, fact 240). By default
     * they go to the trash, in a "<session> (Unused Media)" folder; `toTrash: false` deletes them
     * for good. `clearUndo` first clears the session's undo history, so files only undo kept go
     * too; `deleteAutoBackups` also removes the auto-backups that are all that uses a file,
     * where LUNA allows it. Answers what was removed.
     *
     * @example
     * const done = await luna.workspace.deleteUnusedMedia(pkgUid, { toTrash: true });
     * console.log(`${done.unusedCount} files moved to the trash`);
     */
    async deleteUnusedMedia(packageUid, options = {}) {
      const pkg = requirePackageUid(packageUid, "deleteUnusedMedia");
      const payload = { session_package_uid: pkg, permanently_delete: options.toTrash === false };
      if (options.clearUndo) payload["clear_undo"] = true;
      if (options.deleteAutoBackups) payload["delete_auto_backups"] = true;
      return unusedMediaFrom(await this.post("delete_unused_media", payload));
    }
    /** Full-text search over session metadata. */
    async search(text) {
      return this.post("full_text_search", { search_text: text });
    }
    release() {
      this.packages.dispose();
    }
  };
  function requirePackageUid(packageUid, what) {
    if (typeof packageUid !== "string" || packageUid.trim() === "") throw new UAError("out_of_range", `${what}(): packageUid must be a session package uid`);
    return packageUid.replaceAll("-", "");
  }
  function unusedMediaFrom(reply) {
    const r = reply ?? {};
    const num2 = (v) => typeof v === "number" ? v : 0;
    const unused = Array.isArray(r["unused_files"]) ? r["unused_files"].filter((u) => typeof u === "string") : void 0;
    const kept = Array.isArray(r["kept_files"]) ? r["kept_files"].flatMap((k) => {
      const e = k;
      return e && typeof e.uid === "string" ? [Object.freeze({ uid: e.uid, reason: typeof e.reason === "string" ? e.reason : "unknown" })] : [];
    }) : void 0;
    return Object.freeze({
      totalFiles: num2(r["total_files"]),
      unusedCount: num2(r["total_unused_files"]),
      onlyInBackupsCount: num2(r["files_only_in_backups"]),
      unusedUids: unused && Object.freeze(unused),
      kept: kept && Object.freeze(kept)
    });
  }
  var RecentSessions = class {
    /** @internal */
    constructor(workspace, limit) {
      this.workspace = workspace;
      this.limit = limit;
    }
    workspace;
    limit;
    rows = [];
    listeners = /* @__PURE__ */ new Set();
    releases = [];
    timer;
    generation = 0;
    disposed = false;
    /** @internal */
    async start() {
      const sessions = this.workspace.client.sessions;
      await sessions.ready();
      const again = () => this.schedule();
      this.releases.push(sessions.items.onChange(again), sessions.focusedUid.onChange(again));
      await this.refresh();
    }
    get items() {
      return this.rows;
    }
    get value() {
      return this.rows;
    }
    byId(packageUid) {
      const want = packageUid.replaceAll("-", "").toLowerCase();
      return this.rows.find((r) => r.uid.replaceAll("-", "").toLowerCase() === want);
    }
    onChange(listener) {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    }
    /** Query again now. */
    async refresh() {
      const generation = ++this.generation;
      const rows = await this.workspace.recent(this.limit);
      if (this.disposed || generation !== this.generation) return;
      const sessions = this.workspace.client.sessions;
      await Promise.all(sessions.items.items.map((s) => s.sessionPackageUid.value === void 0 ? this.workspace.client.store.load(s.path, { children: false, commands: false, flatvalue: true }).catch(() => void 0) : void 0));
      if (this.disposed || generation !== this.generation) return;
      const next = rows.map((r) => Object.freeze({ ...r, openSessionUid: sessions.byPackageUid(r.uid)?.uid }));
      if (JSON.stringify(next) === JSON.stringify(this.rows)) return;
      this.rows = Object.freeze(next);
      for (const l of [...this.listeners]) l();
    }
    /** Stop following. */
    dispose() {
      this.disposed = true;
      if (this.timer) clearTimeout(this.timer);
      for (const r of this.releases.splice(0)) r();
      this.listeners.clear();
    }
    /** LUNA writes `last_opened` as a session opens; query a moment after the change, once. */
    schedule() {
      if (this.disposed) return;
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.timer = void 0;
        void this.refresh().catch(() => void 0);
      }, 150);
    }
  };
  function isSessionTemplate(sessionType) {
    return sessionType === 3 || sessionType === "template" || sessionType === "session_template";
  }
  function rowsFrom2(results) {
    if (!results) return [];
    const n = typeof results.num_rows === "number" ? results.num_rows : results["uid"]?.length ?? 0;
    const col = (name, i, fallback) => {
      const arr = results[name];
      return Array.isArray(arr) && arr[i] !== void 0 ? arr[i] : fallback;
    };
    const rows = [];
    for (let i = 0; i < n; i++) {
      rows.push({
        uid: col("uid", i, ""),
        name: col("name", i, "").replace(/\.luna(template)?$/, ""),
        path: col("path", i, ""),
        online: col("file_online", i, true),
        sessionType: col("session_type", i, 0),
        factory: col("factory", i, false),
        favorite: col("favorite", i, false),
        created: col("created", i, 0),
        modified: col("modified", i, 0),
        lastOpened: col("last_opened", i, 0),
        tags: col("tags", i, [])
      });
    }
    return rows;
  }

  // src/model/auto-gain.ts
  var AutoGainChannel = class extends Node {
    sessionUid;
    /** The track (channel) uid. */
    channelUid;
    /** The input's peak as a linear gain, mirrored from the input's `signal_level_peak` (fact 187). */
    signalLevelPeak;
    /** Detected instrument, when LUNA's instrument analysis is on for recording; else absent. */
    instrument;
    /** Detected tempo in BPM, when LUNA's tempo analysis is on for recording; else absent. */
    tempo;
    /** @internal */
    constructor(client, path) {
      super(client, path);
      this.sessionUid = this.prop("session_uid");
      this.channelUid = this.prop("channel_uid");
      this.signalLevelPeak = this.prop("signal_level_peak");
      this.instrument = this.prop("instrument");
      this.tempo = this.prop("tempo");
    }
  };
  var AutoGain = class extends Node {
    /** The service's state. */
    status;
    /** A human-readable status line, as LUNA shows it. */
    statusStr;
    /** Extra information for the current status. */
    info;
    /** Seconds of listening left in the current pass. */
    countDown;
    /** The channels Auto Gain is listening to, with their live peaks. */
    channels;
    presence;
    /** @internal */
    constructor(client) {
      super(client, "/auto_gain");
      this.status = this.prop("status");
      this.statusStr = this.prop("status_str");
      this.info = this.prop("info");
      this.countDown = this.prop("count_down");
      this.channels = new Collection(client, "/auto_gain/channels", (p) => new AutoGainChannel(client, p), { levels: 2, commands: false, flatvalue: true });
    }
    /**
     * Whether this LUNA has the Auto Gain service: true when `/` lists `auto_gain` (fact 191).
     * Cached once answered.
     *
     * @example
     * if (!(await luna.autoGain.available())) button.hidden = true;
     */
    available() {
      this.presence ??= this.client.raw.get("/", { children: true, properties: false, commands: false }).then((reply) => childNames(reply).includes("auto_gain")).catch((err) => {
        this.presence = void 0;
        throw err;
      });
      return this.presence;
    }
    /**
     * Subscribe to the service recursively and load it, so the status and the channels with
     * their peaks follow LUNA. Call `release` when done.
     *
     * @example
     * const w = luna.autoGain.watch();
     * await w.ready;
     */
    watch(options = {}) {
      const w = this.client.store.watch(this.path, { recursive: options.recursive ?? true, load: { flatvalue: true, commands: false } });
      void this.channels.load().catch(() => void 0);
      return w;
    }
    /**
     * The channel Auto Gain is listening to for `target`, if any.
     *
     * @example
     * const listening = luna.autoGain.channelFor(track) !== undefined;
     */
    channelFor(target) {
      const { sessionUid, channelUid } = keyOf2(target);
      return this.channels.items.find((c) => c.sessionUid.value === sessionUid && c.channelUid.value === channelUid);
    }
    /**
     * Start Auto Gain on a track: `post /auto_gain/start_auto_gain {session_uid, channel_uid,
     * auto_start, duration}` (fact 192). LUNA adds a channel under `channels`, turns on the input's
     * signal-level analysis for it, and (with `autoStart`) starts listening. Starting a channel
     * that is already listening changes nothing. LUNA answers before it acts and does not refuse
     * a track whose input cannot take part: check `track.supportsAutoGain` first.
     *
     * @example
     * await luna.autoGain.start(track, { duration: 8 });
     */
    async start(target, options = {}) {
      const { sessionUid, channelUid } = keyOf2(target);
      const body = { session_uid: sessionUid, channel_uid: channelUid, auto_start: options.autoStart ?? true };
      if (options.duration !== void 0) {
        if (!Number.isInteger(options.duration) || options.duration < 0) throw new RangeError("autoGain.start: duration is whole seconds, 0 or more");
        if (options.duration > 0) body["duration"] = options.duration;
      }
      await this.post("start_auto_gain", body);
    }
    /**
     * Stop Auto Gain on a track: `post /auto_gain/stop_auto_gain {session_uid, channel_uid}`
     * (fact 193). Its channel goes, and the input's signal-level analysis is turned off.
     *
     * @example
     * await luna.autoGain.stop(track);
     */
    async stop(target) {
      const { sessionUid, channelUid } = keyOf2(target);
      await this.post("stop_auto_gain", { session_uid: sessionUid, channel_uid: channelUid });
    }
    /**
     * Stop Auto Gain on every channel, whoever started it: `stop_auto_gain {all: true}` (fact 193).
     *
     * @example
     * await luna.autoGain.stopAll();
     */
    async stopAll() {
      await this.post("stop_auto_gain", { all: true });
    }
  };
  function keyOf2(target) {
    return "channelUid" in target ? { sessionUid: target.sessionUid, channelUid: target.channelUid } : { sessionUid: target.sessionUid, channelUid: target.id };
  }

  // src/model/order.ts
  function plannedOrder(rows, moved, anchor) {
    const parentOf2 = new Map(rows.map((r) => [r.id, r.folderUid]));
    const childrenOf = (parent, list) => list.filter((id) => (parentOf2.get(id) ?? null) === parent);
    const flat = rows.map((r) => r.id);
    const block = [];
    const add = (id) => {
      if (block.includes(id)) return;
      block.push(id);
      for (const child of childrenOf(id, flat)) add(child);
    };
    for (const id of moved) add(id);
    const rest = flat.filter((id) => !block.includes(id));
    const at = anchor === null ? 0 : rest.indexOf(anchor) + 1;
    const spliced = anchor !== null && at === 0 ? [...rest, ...block] : [...rest.slice(0, at), ...block, ...rest.slice(at)];
    const out = [];
    const walk = (parent) => {
      for (const id of childrenOf(parent, spliced)) {
        if (out.includes(id)) continue;
        out.push(id);
        walk(id);
      }
    };
    walk(null);
    for (const id of spliced) if (!out.includes(id)) out.push(id);
    return out;
  }

  // src/model/session.ts
  var SYSTEM_TRACK_TYPES = /* @__PURE__ */ new Set(["click", "count_in"]);
  var RECORD_LOOP_MARGIN_TICKS = TICKS_PER_BEAT * 4;
  var CLIP_PROPS = ["uid", "name", "start", "stop", "source_start", "source_stop", "source_uid", "clip_type", "gain", "bypass", "render_source_uid", "render_state", "midi_source_start"];
  var Session = class extends Node {
    uid;
    name;
    loaded;
    readOnly;
    sessionPackageUid;
    sessionPackagePath;
    canUndo;
    canRedo;
    changeCount;
    /**
     * The session's solo mode, writable (fact 157). LUNA refuses any value but the two
     * {@link SoloMode}s. Not undoable.
     *
     * @example await session.soloMode.set('exclusive');
     */
    soloMode;
    tempoEstablished;
    commandStatus;
    commandPercentComplete;
    transport;
    tracks;
    buses;
    /** All playlists (take lanes) in the session; each names its track. */
    playlists;
    /** Tempo map, time and key signatures, and tick/bar/seconds conversion. */
    musical;
    markers;
    /** The session's lyrics, ruler and transcribed (fact 152). */
    lyrics;
    /** Mix, edit, plugin and send groups (facts 215-218). Not loaded by `ready()`: `await session.groups.load()`. */
    groups;
    /** Data Add Ons keep with this session, by reverse-DNS context (fact 129). */
    storage;
    /** Edit contexts (`main`, `editor`, `alt_<n>`). */
    contexts;
    /** The `main` edit context: selection, zoom and the context edit commands. */
    context;
    /**
     * Takes being recorded right now, on every armed track, before they become clips: each with
     * its growing `stop`, its audio file's waveform, or its MIDI so far (fact 149).
     */
    recordTakes;
    /**
     * The track the user is working on: the main context's `lastSelectedTrack`, else the first
     * selected track, else the first visible track. `undefined` only when the session has no
     * visible track. Notifies when the answer moves to a different track, not on every
     * selection write. The last fallback follows tracks being added and removed, not a reorder.
     *
     * @example
     * const draw = () => (label.textContent = session.focusedTrack.value?.name.value ?? 'No track');
     * session.focusedTrack.onChange(draw);
     * draw();
     */
    focusedTrack;
    sourcesCollection;
    sourcesRelease;
    openTransaction;
    watchRelease;
    readyPromise;
    /** @internal */
    constructor(client, uid) {
      super(client, `/sessions/${uid}`);
      this.uid = uid;
      this.name = this.writableProp("name");
      this.loaded = this.prop("loaded");
      this.readOnly = this.prop("read_only");
      this.sessionPackageUid = this.prop("session_package_uid");
      this.sessionPackagePath = this.prop("session_package_path");
      this.canUndo = this.prop("can_undo");
      this.canRedo = this.prop("can_redo");
      this.changeCount = this.prop("change_count");
      this.soloMode = this.writableProp("solo_mode");
      this.tempoEstablished = this.prop("tempo_established");
      this.commandStatus = this.prop("command_status");
      this.commandPercentComplete = this.prop("command_percent_complete");
      this.transport = new Transport(client, this.path, () => this.musical);
      this.tracks = new Collection(client, `${this.path}/tracks`, (p) => new Track(client, p, uid), { levels: 2, commands: false, flatvalue: true });
      this.buses = new Collection(client, `${this.path}/buses`, (p) => new Bus(client, p, uid), { levels: 2, commands: false, flatvalue: true });
      this.playlists = new Collection(client, `${this.path}/playlists`, (p) => new Playlist(client, p, uid, () => this.transactionMode), { levels: 2, commands: false, flatvalue: true });
      this.musical = new Musical(client, this.path, uid, (name, fn) => this.transaction(name, fn));
      this.markers = new Markers(client, this.path, uid, () => this.musical.timeline);
      this.lyrics = new Lyrics(client, this.path);
      this.groups = new Groups(client, this.path, uid);
      this.storage = new SessionStorage(client, this.path);
      this.contexts = new Collection(client, `${this.path}/contexts`, (p) => new Context(client, p, uid), { levels: 2, commands: false, flatvalue: true });
      this.context = new Context(client, `${this.path}/contexts/main`, uid);
      this.recordTakes = new RecordTakes(client, this.path);
      const focusedId = derived([this.context.lastSelectedTrack, this.context.selectionTracks, this.tracks], () => this.focusedTrackId(), { distinct: true });
      this.focusedTrack = derived([focusedId], () => {
        const id = focusedId.value;
        return id === void 0 ? void 0 : this.tracks.byId(id);
      });
    }
    /** The uid behind {@link focusedTrack}; a uid that names no track (a bus, a deleted track) is skipped. */
    focusedTrackId() {
      const isTrack = (id) => typeof id === "string" && this.tracks.byId(id) !== void 0;
      const last = this.context.lastSelectedTrack.value;
      if (isTrack(last)) return last;
      const selected = this.context.selectionTracks.value;
      const first = Array.isArray(selected) ? selected.find(isTrack) : void 0;
      return first ?? this.visibleTracks[0]?.id;
    }
    /**
     * Subscribe to the whole session and load its properties, tracks and buses.
     * Idempotent; resolves when the initial state is in the cells.
     */
    ready() {
      if (!this.readyPromise) {
        const watch = this.client.store.watch(this.path, { recursive: true, load: { flatvalue: true, commands: false } });
        this.watchRelease = watch.release;
        this.readyPromise = watch.ready.then(() => Promise.all([this.tracks.load(), this.buses.load(), this.playlists.load(), this.musical.ready(), this.markers.load(), this.contexts.load(), this.recordTakes.load(), this.client.gui.watchPluginWindows()])).then(() => void 0);
      }
      return this.readyPromise;
    }
    /**
     * Source audio files of this session, under `/workspace/sessions/<package uid>/audio`.
     * `undefined` until the session's package uid is known (after `ready()`).
     */
    get sources() {
      const pkg = this.sessionPackageUid.value;
      if (!pkg) return void 0;
      if (!this.sourcesCollection || !this.sourcesCollection.path.includes(pkg)) {
        this.sourcesCollection?.dispose();
        this.sourcesRelease?.();
        this.sourcesCollection = new Collection(this.client, `/workspace/sessions/${pkg}/audio`, (p) => new AudioSource(this.client, p), { levels: 2, commands: false, flatvalue: true });
        this.sourcesRelease = this.sourcesCollection.watch().release;
      }
      return this.sourcesCollection;
    }
    /**
     * The session's source files, loaded and ready: waits for `ready()` (which brings the
     * package uid), loads the folder and every member's properties, and keeps following it.
     *
     * @example
     * const sources = await session.loadSources();
     * sources.items.map((s) => s.displayName.value);
     * sources.onAnyChange(() => render(sources.items), { props: ['name', 'length'] });
     */
    async loadSources() {
      await this.ready();
      const sources = this.sources;
      if (!sources) throw new UAError("unavailable", "loadSources(): LUNA did not report the session package uid", { path: this.path });
      await sources.load();
      await sources.membersReady();
      await this.client.settled();
      return sources;
    }
    /**
     * A source file's absolute path on disk, from the session's package path (fact 239):
     * `<package>/audio/<uid>.wav`, or `<package>/renders/clips/<uid>.wav` for a rendering.
     * Synchronous, so a `dragstart` handler can use it. `undefined` before `ready()`.
     *
     * @example
     * const path = session.sourcePath(source);
     * if (path) await luna.gui.revealPath(path);
     */
    sourcePath(source) {
      const pkg = this.sessionPackagePath.value;
      if (!pkg) return void 0;
      const member = typeof source === "string" ? this.sources?.byId(source) : source;
      const uid = typeof source === "string" ? source : source.id;
      return sourceFilePath(pkg, uid, member?.isRender ?? false);
    }
    /**
     * The session's own package in the workspace (name, folder, favourite, comments), loaded,
     * without loading every package (`workspace.packages`).
     *
     * @example
     * const pkg = await session.package();
     * pkg.name; pkg.directoryPath.value; await pkg.favorite.set(true);
     */
    async package() {
      await this.ready();
      const uid = this.sessionPackageUid.value;
      if (!uid) throw new UAError("unavailable", "package(): LUNA did not report the session package uid", { path: this.path });
      if (this.packageNode?.id !== uid) {
        this.packageNode?.dispose();
        this.packageNode = new SessionPackage(this.client, `/workspace/sessions/${uid}`);
      }
      await this.packageNode.load({ children: false, commands: false, flatvalue: true });
      return this.packageNode;
    }
    packageNode;
    /**
     * Which tracks and clips use each source file, live: it follows clips being added, deleted,
     * rendered or pointed at another file, and tracks switching playlists. Loads every
     * playlist's clips first. Call `dispose()` on it when done.
     *
     * @example
     * const usage = await session.sourceUsage();
     * usage.byId(source.id)?.trackUids.map((t) => session.tracks.byId(t)?.name.value);
     * usage.isUsed(source.id);
     * usage.onChange(() => render());
     */
    sourceUsage() {
      return new SourceUsage(this).start();
    }
    /** The active playlist of a track, once playlists are loaded. */
    playlistFor(track) {
      const uid = track.playlistUid.value;
      return uid ? this.playlists.byId(uid) : void 0;
    }
    /**
     * Point LUNA's edit selection at tracks on the timeline, as clicking in LUNA's timeline does:
     * the tracks, their active playlists and focus `timeline`, and the range when given (the
     * current one is kept otherwise). Then `context.cut()`, `copy()`, `paste()`, `clear()` and
     * `duplicate()` act on that range of those tracks, and paste lands at the range start
     * (fact 150). No undo entry. Use it before an edit command when the user has not just
     * selected in LUNA's own timeline: LUNA's selection may name other tracks, or the mixer.
     *
     * @example
     * await session.selectTimeline({ tracks: [track], startTick: bar(5), stopTick: bar(9) });
     * await session.context.copy();
     * await session.selectTimeline({ tracks: [other], startTick: bar(17) });
     * await session.context.paste();
     */
    async selectTimeline(options) {
      const ids = options.tracks.map((t) => typeof t === "string" ? t : t.id);
      const playlists = [];
      for (const id of ids) {
        const track = this.tracks.byId(id);
        const lane = track && this.playlistFor(track);
        if (lane) playlists.push(lane.id);
      }
      await this.context.select({
        trackUids: ids,
        playlistUids: playlists,
        focus: "timeline",
        ...options.startTick !== void 0 ? { startTick: options.startTick } : {},
        ...options.stopTick !== void 0 ? { stopTick: options.stopTick } : {}
      });
    }
    /** The master bus, once buses are loaded. */
    get master() {
      return this.buses.items.find((b) => b.isMaster);
    }
    /**
     * Every track and bus in LUNA's order (fact 137): one `order` runs 1..N across both, each
     * folder followed at once by everything inside it. This includes LUNA's system tracks
     * (click, count-in) and buses (master, cues); filter on `trackType` and `busType` for what
     * a page shows. {@link tracksInOrder} is the same order with the buses left out.
     *
     * @example
     * // LUNA's track list as an indented outline.
     * const depth = (ch) => (ch?.folderUid.value ? 1 + depth(session.buses.byId(ch.folderUid.value)) : 0);
     * for (const ch of session.channelsInOrder) console.log('  '.repeat(depth(ch)) + ch.name.value);
     */
    get channelsInOrder() {
      return [...this.tracks.items, ...this.buses.items].sort((a, b) => (a.order.value ?? 0) - (b.order.value ?? 0));
    }
    /** Tracks sorted by their `order` key; buses and folders, which share it, are left out (fact 137). */
    get tracksInOrder() {
      return [...this.tracks.items].sort((a, b) => (a.order.value ?? 0) - (b.order.value ?? 0));
    }
    /**
     * Tracks a user sees: `tracksInOrder` without LUNA's system `click` and `count_in` tracks
     * (fact 28).
     */
    get visibleTracks() {
      return this.tracksInOrder.filter((t) => !SYSTEM_TRACK_TYPES.has(t.trackType.value ?? ""));
    }
    // ---------------------------------------------------------------------------------------
    // Commands
    // ---------------------------------------------------------------------------------------
    /**
     * Create tracks in one undo step, and resolve to them once they are listed in
     * {@link tracks} with their properties loaded: one {@link Track}, or `count` of them. LUNA
     * answers the new uids (fact 135), so nothing has to be found by name.
     *
     * Inside a batch {@link transaction} LUNA holds the new tracks back until the commit (facts
     * 74, 135), so this resolves at once to tracks whose `id` is set and whose props read
     * `undefined` until then. They are the objects `session.tracks` lists after the commit.
     *
     * @example
     * const [bass] = await session.newTrack({ name: 'Bass', stemFormat: 'mono' });
     * bass.name.value; // 'Bass'
     *
     * @example
     * // A track and its clip as one undo entry.
     * await session.transaction('Add loop', async () => {
     *   const [track] = await session.newTrack({ name: 'Loop', stemFormat: 'stereo' });
     *   await session.insertClip({ trackUid: track.id, sourceUid, startTick: 0, stopTick: Luna.WHOLE_NOTE });
     * });
     */
    async newTrack(options = {}) {
      const payload = { uid: this.uid, name: options.name ?? "Untitled", track_type: options.trackType ?? "audio", stem_format: options.stemFormat ?? "mono" };
      if (options.count !== void 0) payload["count"] = options.count;
      if (options.makeNameUnique !== void 0) payload["make_name_unique"] = options.makeNameUnique;
      if (options.folderUid !== void 0) payload["folder_uid"] = options.folderUid;
      const uids = replyUids(await this.post("new_track", payload));
      if (uids.length === 0) throw new UAError("invalid_response", "new_track answered without a track uid", { path: `${this.path}/new_track` });
      return this.resolveTracks(uids);
    }
    /** The tracks `new_track` made: listed and loaded, or handles inside a batch. */
    async resolveTracks(uids) {
      if (this.openTransaction === "batch") return uids.map((uid) => this.tracks.member(uid));
      await settle(() => uids.every((uid) => this.tracks.byId(uid) !== void 0 || this.buses.byId(uid) !== void 0), "new tracks", {
        path: `${this.path}/tracks`,
        refresh: () => Promise.all([this.tracks.reload(), this.buses.reload()]).then(() => void 0),
        flush: () => this.client.store.scheduler.flush()
      });
      await this.tracks.membersReady();
      await this.client.settled();
      return uids.map((uid) => this.tracks.byId(uid)).filter((t) => t !== void 0);
    }
    /**
     * Create an aux bus (`new_track` with `track_type: "bus"`, fact 83) in one undo step, and
     * resolve to the {@link Bus} once it is listed in {@link buses} with its properties loaded.
     *
     * @example
     * const reverb = await session.newBus({ name: 'Reverb' });
     * await track.outputs.byId('send_0').assign(reverb);
     */
    async newBus(options = {}) {
      return this.createBus({ uid: this.uid, name: options.name ?? "Bus", track_type: "bus", stem_format: options.stemFormat ?? "stereo" }, "new bus");
    }
    /** Post `new_track` for a bus and resolve to it, listed and loaded. */
    async createBus(payload, what) {
      const reply = await this.post("new_track", payload);
      const uid = reply?.uid;
      if (typeof uid !== "string" || !uid) throw new UAError("invalid_response", "new_track answered without a bus uid", { path: `${this.path}/new_track` });
      await settle(() => this.buses.byId(uid) !== void 0, what, {
        path: `${this.path}/buses`,
        refresh: () => this.buses.reload(),
        flush: () => this.client.store.scheduler.flush()
      });
      await this.buses.membersReady();
      return this.buses.byId(uid);
    }
    /**
     * Create a folder track in one undo step, and resolve to it once it is listed in
     * {@link buses} with its properties loaded (fact 136). A folder is an aux bus whose
     * {@link Bus.folderMode} is not `'none'`, so it is a {@link Bus} with `isFolder` true. It goes
     * last in the session, or first inside `folderUid` (fact 137). Put
     * tracks in it with `newTrack({ folderUid })` or {@link moveToFolder}; list them with
     * {@link folderContents}.
     *
     * @throws {UAError} `device.database_error` when `folderUid` is not a folder.
     * @example
     * const drums = await session.newFolder({ name: 'Drums' });
     * const [kick, snare] = await session.newTrack({ name: 'Drum', count: 2, makeNameUnique: true, folderUid: drums.id });
     *
     * @example
     * // A folder that only groups, inside another folder.
     * const perc = await session.newFolder({ name: 'Perc', mode: 'container', folderUid: drums.id });
     */
    async newFolder(options = {}) {
      const mode = options.mode ?? "summing";
      if (mode !== "summing" && mode !== "container") throw new UAError("out_of_range", `newFolder(): unknown mode ${String(mode)}`, { path: `${this.path}/new_track` });
      const payload = { uid: this.uid, name: options.name ?? "Folder", track_type: "bus", stem_format: options.stemFormat ?? "stereo", folder_mode: mode };
      if (options.folderUid !== void 0) payload["folder_uid"] = options.folderUid;
      const bus = await this.createBus(payload, "new folder");
      await settle(() => bus.name.value !== void 0 && bus.folderMode.value === mode && (options.folderUid === void 0 || bus.folderUid.value === options.folderUid), "new folder", {
        path: bus.path,
        refresh: () => this.client.store.load(bus.path, { children: false, commands: false, flatvalue: true }),
        flush: () => this.client.store.scheduler.flush()
      });
      return bus;
    }
    /**
     * The folder tracks, in no particular order: the buses whose folder mode is not `'none'`.
     * Use {@link folderContents} for the hierarchy.
     *
     * @example
     * for (const folder of session.folders) console.log(folder.name.value, folder.folderMode.value);
     */
    get folders() {
      return this.buses.items.filter((b) => b.isFolder);
    }
    /**
     * The tracks and buses directly inside `folder`, or at the session root for `null`, sorted
     * by their `order`. Their own `folderUid` names the folder. At the root this includes
     * LUNA's system tracks and buses (click, count-in, master, cues).
     *
     * @example
     * const walk = (folder, depth = 0) => {
     *   for (const ch of session.folderContents(folder)) {
     *     console.log('  '.repeat(depth) + ch.name.value);
     *     if (ch instanceof Luna.Bus && ch.isFolder) walk(ch, depth + 1);
     *   }
     * };
     * walk(null);
     */
    folderContents(folder) {
      const id = folder === null ? null : typeof folder === "string" ? folder : folder.id;
      const inside = (c) => (c.folderUid.value ?? null) === id;
      return [...this.tracks.items.filter(inside), ...this.buses.items.filter(inside)].sort((a, b) => (a.order.value ?? 0) - (b.order.value ?? 0));
    }
    /**
     * Move tracks and buses (folders too, with everything inside them) into `folder`, or to
     * the session root with `null`, in one undo step (LUNA's `move_to_folder`, fact 136), and
     * resolve once each one's {@link Channel.folderUid} shows it. They go first in the folder, or
     * after `options.after` (fact 137); {@link reorder} moves them within it. LUNA reroutes the main output
     * of everything moved to the nearest summing folder it is now in, else the master.
     *
     * @throws {UAError} `uasrv.invalid_value` when `folder` is not a folder, or would end up
     * inside itself.
     * @example
     * const vocals = await session.newFolder({ name: 'Vocals' });
     * await session.moveToFolder([lead, harmony], vocals);
     * await session.moveToFolder([harmony], null); // back to the root
     */
    async moveToFolder(items, folder, options = {}) {
      const ids = items.map((i) => typeof i === "string" ? i : i.id);
      if (ids.length === 0) return;
      const folderUid = folder === null ? null : typeof folder === "string" ? folder : folder.id;
      const anchor = options.after === void 0 || options.after === null ? null : typeof options.after === "string" ? options.after : options.after.id;
      const payload = { session_uid: this.uid, after_uids: ids };
      if (folderUid) payload["folder_uid"] = folderUid;
      if (anchor !== null) payload["before_uid"] = anchor;
      const parentOf2 = new Map(this.channelsInOrder.map((c) => [c.id, c.folderUid.value ?? null]));
      const topLevel = ids.filter((id) => {
        for (let f = parentOf2.get(id) ?? null; f; f = parentOf2.get(f) ?? null) if (ids.includes(f)) return false;
        return true;
      });
      const known = topLevel.every((id) => parentOf2.has(id)) && (anchor === null || parentOf2.has(anchor));
      const rows = this.channelsInOrder.map((c) => ({ id: c.id, folderUid: topLevel.includes(c.id) ? folderUid : c.folderUid.value ?? null }));
      const expected = plannedOrder(rows, topLevel, anchor).join();
      await this.post("tracks/move_to_folder", payload);
      if (this.openTransaction === "batch") return;
      const channels = () => topLevel.map((id) => this.tracks.byId(id) ?? this.buses.byId(id));
      const placed = () => channels().every((c) => c === void 0 || (c.folderUid.value ?? null) === folderUid);
      await settle(() => placed() && (!known || this.channelsInOrder.map((c) => c.id).join() === expected), "move to folder", {
        path: `${this.path}/tracks`,
        refresh: () => Promise.all([this.tracks.reload(), this.buses.reload()]).then(() => void 0),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    /**
     * Move tracks and buses to just after `after`, or first, in one undo step (LUNA's
     * `change_order`, fact 137), and resolve once {@link channelsInOrder} shows the new order.
     * The items keep their order among themselves as given, and a folder moves with everything
     * inside it.
     *
     * Nothing changes folder: LUNA keeps each folder's contents together right after it, so an
     * anchor inside another folder only decides where the item lands among its own siblings.
     * Use {@link moveToFolder} to change folder. LUNA answers the same whether or not anything
     * moved, so an id this session does not list rejects here rather than doing nothing.
     *
     * @throws {UAError} `out_of_range` for a track or bus (or anchor) the session does not list.
     * @example
     * // Put the bass just after the drums, then the vocal first.
     * await session.reorder([bass], { after: drums });
     * await session.reorder([vocal]);
     */
    async reorder(items, options = {}) {
      const ids = items.map((i) => typeof i === "string" ? i : i.id);
      if (ids.length === 0) return;
      const anchor = options.after === void 0 || options.after === null ? null : typeof options.after === "string" ? options.after : options.after.id;
      const listed = (id) => this.tracks.byId(id) !== void 0 || this.buses.byId(id) !== void 0;
      for (const id of anchor === null ? ids : [...ids, anchor]) {
        if (!listed(id)) throw new UAError("out_of_range", `reorder(): no track or bus ${id} in this session`, { path: `${this.path}/tracks/change_order` });
      }
      const current = () => this.channelsInOrder.map((c) => ({ id: c.id, folderUid: c.folderUid.value ?? null }));
      const expected = plannedOrder(current(), ids, anchor).join();
      const payload = { session_uid: this.uid, after_uids: ids };
      if (anchor !== null) payload["before_uid"] = anchor;
      await this.post("tracks/change_order", payload);
      if (this.openTransaction === "batch") return;
      await settle(() => current().map((r) => r.id).join() === expected, "reorder", {
        path: `${this.path}/tracks`,
        refresh: () => Promise.all([this.tracks.reload(), this.buses.reload()]).then(() => void 0),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    /**
     * Make a track from a preset in one undo step (fact 132), as LUNA's New Track From Preset
     * does, and resolve to the new tracks once they are listed in {@link tracks} with their
     * properties loaded. The preset is a row from {@link Presets.trackSelection} or
     * `luna.presets.query({ deviceTypeId: 'track', includeInstrumentPresets: true })`:
     *
     * - a track preset makes its tracks with its plugins and settings: one named `name`, or
     *   for a multi-track preset several, keeping the names saved in it; a master bus preset
     *   loads onto the master bus and makes none, so `[]`;
     * - an instrument plugin's preset makes a stereo instrument track with the plugin on it,
     *   on that preset; an effect plugin's preset an audio track with the plugin.
     *
     * LUNA selects the new tracks. Rejects with `device.database_error` for an unknown preset.
     *
     * @example
     * const sel = luna.presets.trackSelection({ category: 'Instrument' });
     * await sel.ready();
     * const [track] = await session.newTrackFromPreset(sel.presets.items[0]);
     * track.name.value; // the preset's name
     */
    async newTrackFromPreset(preset, options = {}) {
      const payload = { uid: this.uid, name: options.name ?? preset.name, preset_uid: preset.uid, count: 1, make_name_unique: options.makeNameUnique ?? true };
      if (options.beforeUid !== void 0) payload["before_uid"] = options.beforeUid;
      if (options.folderUid !== void 0) payload["folder_uid"] = options.folderUid;
      if (options.stemFormat !== void 0) payload["stem_format"] = options.stemFormat;
      const uids = replyUids(await this.post("new_track", payload));
      if (uids.length === 0) return [];
      return this.resolveTracks(uids);
    }
    undo(count = 1) {
      return this.post("undo", { session_uid: this.uid, count });
    }
    redo(count = 1) {
      return this.post("redo", { session_uid: this.uid, count });
    }
    /** Save (commit) the session. */
    save(options = {}) {
      const payload = { session_uid: this.uid };
      if (options.label !== void 0) payload["label"] = options.label;
      if (options.comments !== void 0) payload["comments"] = options.comments;
      return this.post("save_session", payload);
    }
    /**
     * Run `fn` as one undoable step. Aborts (discarding pending changes) if `fn` throws.
     * Called while a transaction is already open, `fn` runs inside that one: wrappers that batch
     * their own steps (`Output.retarget`) then join the caller's undo entry instead of nesting.
     *
     * A batch (the default) holds LUNA's pushes until the commit, so the model shows the edits
     * only once this resolves. With `continuous`, every command replaces the one before it
     * (see {@link TransactionOptions.continuous}).
     *
     * @example
     * await session.transaction('Rename all', async () => {
     *   for (const t of session.tracks.items) await t.name.set(`${t.name.value} (mix)`);
     * });
     *
     * @example
     * // Rewrite a clip's notes as one undo step: delete the old ones, write the new ones.
     * await session.transaction('Humanize', async () => {
     *   const old = clip.midi.notes.items;
     *   await clip.midi.deleteNotes(old);
     *   await clip.addNotes(old.map((n) => ({ pitch: n.pitch, tick: Math.max(0, n.startTick + Math.round((Math.random() - 0.5) * 40)), lengthTicks: n.stopTick! - n.startTick, velocity: n.velocity })));
     * });
     * await clip.midi.refresh();
     */
    async transaction(name, fn, options = {}) {
      if (this.openTransaction) return fn();
      const continuous = options.continuous ?? false;
      const payload = { session_uid: this.uid, name, is_continuous: continuous };
      if (continuous) payload["sends_undo_notifications"] = true;
      await this.post("begin_transaction", payload);
      this.openTransaction = continuous ? "continuous" : "batch";
      try {
        const result = await fn();
        this.openTransaction = void 0;
        await this.post("commit_transaction", { session_uid: this.uid });
        return result;
      } catch (err) {
        this.openTransaction = void 0;
        await this.post("abort_transaction", { session_uid: this.uid }).catch(() => void 0);
        throw err;
      }
    }
    /** True while a {@link transaction} is open, of either kind. */
    get batching() {
      return this.openTransaction !== void 0;
    }
    /** The kind of {@link transaction} open now, or `undefined` outside one. */
    get transactionMode() {
      return this.openTransaction;
    }
    /**
     * Insert a clip onto a track's active playlist, or onto a given playlist, in one undo step,
     * and resolve to the new {@link Clip} once its playlist lists it with its properties
     * loaded. LUNA answers the clip's uid. Timeline position is in ticks; source offsets are
     * nanoseconds (fact 16).
     *
     * `sourceUid` is required for every clip type, MIDI included: LUNA answers
     * `uasrv.invalid_property` without one (fact 112). To start a MIDI clip of your own, write
     * its notes with {@link Playlist.createNotes}, which makes the clip. With `copyOf` the new
     * clip is a copy of another (its gain, fades, warps and MIDI), and the source, its offsets
     * and the name default to that clip's (fact 135).
     *
     * Inside a batch {@link transaction} this resolves at once to the clip with its `id` set
     * and its props `undefined` until the commit, as {@link newTrack} does.
     *
     * @example
     * const clip = await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: Luna.WHOLE_NOTE });
     * clip.start.value; // 0
     *
     * @example
     * // Repeat a slice four bars later, in front of what is there.
     * const again = await session.insertClip({ playlistUid: lane.id, copyOf: slice, startTick: slice.start.value! + 4 * Luna.WHOLE_NOTE, stopTick: slice.stop.value! + 4 * Luna.WHOLE_NOTE });
     */
    async insertClip(options) {
      const copy = options.copyOf;
      const sourceUid = options.sourceUid ?? copy?.sourceUid.value;
      const payload = { session_uid: this.uid, source_uid: sourceUid ?? "", start: options.startTick, stop: options.stopTick };
      if (options.trackUid !== void 0) payload["track_uid"] = options.trackUid;
      if (options.playlistUid !== void 0) payload["playlist_uid"] = options.playlistUid;
      const sourceStart = options.sourceStartNs ?? copy?.sourceStart.value;
      const sourceStop = options.sourceStopNs ?? copy?.sourceStop.value;
      const name = options.name ?? copy?.name.value;
      if (sourceStart !== void 0) payload["source_start"] = sourceStart;
      if (sourceStop !== void 0) payload["source_stop"] = sourceStop;
      if (name !== void 0) payload["name"] = name;
      if (options.clipType !== void 0) payload["clip_type"] = { audio: 0, video: 1, midi: 2 }[options.clipType];
      if (options.layer !== void 0) payload["layer"] = options.layer;
      if (options.lengthFollows !== void 0) payload["length_follows"] = options.lengthFollows;
      if (options.algType !== void 0) payload["alg_type"] = options.algType;
      if (copy) payload["clip_uid"] = copy.id;
      const [uid] = replyUids(await this.post("insert_clip", payload));
      if (!uid) throw new UAError("invalid_response", "insert_clip answered without a clip uid", { path: `${this.path}/insert_clip` });
      let playlistUid = options.playlistUid ?? (options.trackUid !== void 0 ? this.tracks.byId(options.trackUid)?.playlistUid.value : void 0);
      if (!playlistUid) {
        const info = await this.post("get_clip_info", { session_uid: this.uid, clip_uid: uid });
        if (typeof info?.playlist_uid === "string" && info.playlist_uid) playlistUid = info.playlist_uid;
      }
      if (!playlistUid) throw new UAError("invalid_response", `insert_clip made ${uid}, but its playlist is not known`, { path: `${this.path}/insert_clip` });
      const clips = this.playlists.member(playlistUid).clips;
      if (this.openTransaction === "batch") return clips.member(uid);
      await clips.load();
      await settle(() => clips.byId(uid) !== void 0, "insert clip", {
        path: `${this.path}/playlists/${playlistUid}/clips`,
        refresh: () => clips.reload(),
        flush: () => this.client.store.scheduler.flush()
      });
      await clips.membersReady();
      await this.client.settled();
      return clips.byId(uid);
    }
    /** Create a new playlist version on the given tracks, empty or duplicating the current one. */
    newPlaylists(trackUids, options = {}) {
      return this.post("new_playlists", { session_uid: this.uid, track_uid: trackUids, context_type: "main", duplicate: options.duplicate ?? false });
    }
    /** Make a playlist version active on a track. */
    setPlaylist(trackUid, version) {
      return this.post("set_playlists", { session_uid: this.uid, track_uid: [trackUid], version, context_type: "main" });
    }
    /** Add a marker at `tick`. Resolves to the reply (`{ rowid }` on current engines). */
    /**
     * Add a marker at `tick` and resolve once it is in {@link markers}. `set_marker` answers
     * `null` whether or not it did anything (fact 71), so the list is the proof.
     *
     * @example
     * await session.addMarker(Luna.WHOLE_NOTE * 8, 'Chorus');
     */
    async addMarker(tick, name, options = {}) {
      const payload = { session_uid: this.uid, location: requireTick(tick, "marker tick"), name };
      if (options.color !== void 0) payload["color"] = options.color;
      if (options.comments !== void 0) payload["comments"] = options.comments;
      const before = new Set(this.markers.items.map((m) => m.id));
      const reply = await this.post("set_marker", payload);
      await settle(() => this.markers.items.some((m) => !before.has(m.id) && m.location.value === tick && m.name.value === name), "add marker", {
        path: `${this.path}/markers`,
        refresh: () => this.markers.reload(),
        flush: () => this.client.store.scheduler.flush()
      });
      return reply;
    }
    /**
     * Move or copy the clips in a tick range (or the context selection when omitted) so they
     * start at `toTick`.
     *
     * `playlists` moves them to other tracks: each entry takes the clips of `from` (a playlist
     * or its uid) to `to`. It replaces `trackUids`, which LUNA then ignores (fact 174).
     * `moveAutomation` carries the tracks' automation in the range along; left out, LUNA follows
     * the context's own "automation follows edit" setting.
     *
     * @example
     * // Move bar 1 of the vocal to the double track, at the same time.
     * await session.moveClips(0, {
     *   startTick: 0,
     *   stopTick: Luna.WHOLE_NOTE,
     *   playlists: [{ from: session.playlistFor(vocal)!, to: session.playlistFor(double)! }],
     * });
     */
    moveClips(toTick, options = {}) {
      const payload = { session_uid: this.uid, context_type: options.contextType ?? "main", location: toTick };
      if (options.startTick !== void 0) payload["start"] = options.startTick;
      if (options.stopTick !== void 0) payload["stop"] = options.stopTick;
      if (options.trackUids !== void 0) payload["track_uid"] = options.trackUids;
      if (options.copy !== void 0) payload["copy"] = options.copy;
      if (options.moveAutomation !== void 0) payload["move_automation"] = options.moveAutomation;
      if (options.playlists !== void 0 && options.playlists.length > 0) {
        const uidOf2 = (p) => typeof p === "string" ? p : p.id;
        payload["playlists"] = options.playlists.map((e) => ({ source_playlist: uidOf2(e.from), destination_playlist: uidOf2(e.to) }));
      }
      return this.post("move_clips", payload);
    }
    /**
     * Delete playlist versions in one undo step (`delete_playlists`), and resolve once they
     * have left {@link playlists} (fact 170). A version a track is using can be deleted when
     * the track has another: the track switches to the version before it (after it, for the
     * first). LUNA also applies it to the tracks edit-grouped with them. Deleting nothing
     * deletable (a track's only version) rejects with `uasrv.invalid_value`.
     *
     * @example
     * const old = session.playlists.items.filter((p) => p.trackUid.value === track.id && p.id !== track.playlistUid.value);
     * await session.deletePlaylists(old);
     */
    async deletePlaylists(playlists) {
      const uids = playlists.map((p) => typeof p === "string" ? p : p.id);
      if (!uids.length) throw new UAError("out_of_range", "deletePlaylists(): give at least one playlist");
      await this.playlists.load();
      await this.post("delete_playlists", { session_uid: this.uid, context_type: "main", playlist_uid: uids });
      await this.settlePlaylistsGone(uids, "delete playlists");
    }
    /**
     * Delete every playlist version the given tracks are not using, keeping the one each plays
     * (`delete_playlists` with `delete_unused`, which lists the versions to keep, fact 170).
     * Resolves once they have left {@link playlists}.
     *
     * @example
     * await session.deleteUnusedPlaylists([vocal, double]);
     */
    async deleteUnusedPlaylists(tracks) {
      await this.playlists.load();
      await this.playlists.membersReady();
      const ids = tracks.map((t) => typeof t === "string" ? t : t.id);
      const keep = ids.map((id) => this.tracks.byId(id)?.playlistUid.value).filter((u) => typeof u === "string" && u !== "");
      if (keep.length !== ids.length) throw new UAError("out_of_range", "deleteUnusedPlaylists(): give tracks of this session");
      const doomed = this.playlists.items.filter((p) => ids.includes(p.trackUid.value ?? "") && !keep.includes(p.id)).map((p) => p.id);
      if (!doomed.length) return;
      await this.post("delete_playlists", { session_uid: this.uid, context_type: "main", playlist_uid: keep, delete_unused: true });
      await this.settlePlaylistsGone(doomed, "delete unused playlists");
    }
    async settlePlaylistsGone(uids, what) {
      await settle(() => uids.every((u) => this.playlists.byId(u) === void 0), what, {
        path: `${this.path}/playlists`,
        refresh: () => this.playlists.reload(),
        flush: () => this.client.store.scheduler.flush()
      });
    }
    /**
     * Make one audio track per device input, each recording from its input, in one undo step,
     * as LUNA's "create tracks from inputs" does (`new_tracks_from_inputs`, fact 172), and
     * resolve to the new tracks once listed and loaded. Each is named after its input (made
     * unique) and takes the input's stem format unless `stemFormat` says otherwise.
     * `recordEnable` arms them; `autoGain` starts Auto Gain on those that support it.
     *
     * Inputs LUNA does not make tracks for (talkback, monitor, loopback) are skipped. Because
     * LUNA never answers a request with an unknown input or with none left, the SDK refuses
     * those first: `unknown_input` for an input not in `luna.audioInputs()`, `no_inputs` when
     * nothing is left.
     *
     * @example
     * const inputs = await luna.audioInputs();
     * const tracks = await session.newTracksFromInputs({ inputUids: inputs.slice(0, 2).map((i) => i.uid), recordEnable: true });
     */
    async newTracksFromInputs(options) {
      const known = await this.client.audioInputs();
      for (const uid of options.inputUids) {
        if (!known.some((i) => i.uid === uid)) throw new UAError("unknown_input", `newTracksFromInputs(): no input ${uid}`, { path: `${this.path}/new_tracks_from_inputs` });
      }
      if (!options.inputUids.some((uid) => autoCreatesTrack2(known.find((i) => i.uid === uid).name))) {
        throw new UAError("no_inputs", "newTracksFromInputs(): LUNA makes no track for these inputs", { path: `${this.path}/new_tracks_from_inputs` });
      }
      const payload = { session_uid: this.uid, input_uids: [...options.inputUids] };
      if (options.recordEnable !== void 0) payload["record_enable"] = options.recordEnable;
      if (options.autoGain !== void 0) payload["auto_gain"] = options.autoGain;
      if (options.stemFormat !== void 0) payload["stem_format"] = options.stemFormat;
      const reply = await this.post("new_tracks_from_inputs", payload);
      const uids = Array.isArray(reply?.new_tracks) ? reply.new_tracks.filter((u) => typeof u === "string") : [];
      return uids.length ? this.resolveTracks(uids) : [];
    }
    /**
     * Set the shape and/or curvature of fades, given as `seg.fadeIn.value` / `seg.fadeOut.value`
     * from {@link Playlist.compiledClips} (pass both halves of a crossfade). LUNA's
     * `change_fade_curvature`, one undo step; it also reaches the matching fades of tracks in the
     * same edit group. `curvature` is -1 to 1, 0 being the shape's own curve; `reset` puts back
     * `log` with curvature 0 (fact 117).
     *
     * @example
     * const seg = lane.compiledClips.ofClip(clip.id)[0];
     * await session.setFadeCurve([seg.fadeIn.value], { shape: 'equal_power', curvature: 0.3 });
     */
    async setFadeCurve(fades, options) {
      const uids = fades.map((f) => f?.uid).filter((u) => typeof u === "string" && u.length > 0);
      if (!uids.length) throw new UAError("out_of_range", "setFadeCurve(): give at least one fade");
      const shape = requireFadeShape(options.shape, "setFadeCurve()");
      const payload = { session_uid: this.uid, fades: uids };
      if (options.reset) payload["default"] = true;
      if (shape) payload["fade_shape"] = shape;
      if (options.curvature !== void 0) {
        if (!Number.isFinite(options.curvature) || options.curvature < -1 || options.curvature > 1) throw new UAError("out_of_range", "setFadeCurve(): curvature must be between -1 and 1");
        payload["fade_curvature"] = options.curvature;
        payload["initial_curvature_values"] = uids.map(() => 0);
      }
      if (!options.reset && !shape && options.curvature === void 0) throw new UAError("out_of_range", "setFadeCurve(): give shape, curvature or reset");
      await this.wire.post(`${this.path}/contexts/main/commands/change_fade_curvature`, payload);
    }
    /**
     * Delete tracks by uid in one undo step, and resolve once they have left {@link tracks}.
     *
     * @example
     * await session.deleteTracks([scratch.id]);
     */
    async deleteTracks(trackUids) {
      const reply = await this.post("delete_tracks", { session_uid: this.uid, track_uid: trackUids });
      await settle(() => trackUids.every((id) => this.tracks.byId(id) === void 0 && this.buses.byId(id) === void 0), "delete tracks", {
        path: `${this.path}/tracks`,
        refresh: () => Promise.all([this.tracks.reload(), this.buses.reload()]),
        flush: () => this.client.store.scheduler.flush()
      });
      return reply;
    }
    /**
     * Upload a file the engine cannot read from disk - a browser `File`, or any bytes - into
     * this session's package as a new audio source, and resolve to it once the workspace
     * lists it (fact 42).
     *
     * This is the **File route**, and the one that works everywhere: in LUNA and in a browser,
     * with no `/gui`. Get the `File` from `<input type="file">` or an HTML
     * `drop` event; the page can decode and audition the same `File` too. When the page only
     * needs the file in the session and has an engine-readable path (from
     * `luna.gui.chooseFiles()` or `Luna.onPathDrop()`), {@link importPath} is the faster path
     * route: nothing is copied through the page.
     *
     * The bytes go up base64-encoded in `chunkBytes` pieces through the engine's
     * `begin`/`transfer`/`end` phases, with `onProgress` after each chunk. A failed transfer
     * is cancelled, so a half-written file is not left behind. No clip is made: pass the
     * returned source's `id` to {@link insertClip} for that. LUNA files identical bytes only
     * once: uploading a file already in the session resolves to that source (fact 42). Use
     * {@link importFile} instead
     * when LUNA can already read the path itself.
     *
     * In LUNA 3.1.0.4589 and earlier `<input type="file">` opens nothing (fact 104), so offer an
     * HTML drop zone as well: `zone.ondrop = (e) => { e.preventDefault(); load(e.dataTransfer.files[0]); }`
     * with `zone.ondragover = (e) => e.preventDefault()`.
     *
     * @example
     * const source = await session.uploadFile({
     *   bytes: fileInput.files[0],
     *   onProgress: (sent, total) => (bar.value = sent / total),
     * });
     * await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT });
     */
    async uploadFile(options) {
      await this.ready();
      const sources = this.sources;
      if (!sources) throw new UAError("unavailable", "uploadFile(): the session package uid is not known yet", { path: this.path });
      const pkg = this.sessionPackageUid.value;
      const name = options.name ?? fileName(options.bytes);
      if (!name) throw new UAError("out_of_range", "uploadFile(): give a name, or bytes that carry one", { path: this.path });
      const data = await toBytes(options.bytes);
      if (!data.length) throw new UAError("out_of_range", "uploadFile(): the file is empty", { path: this.path });
      const chunk = Math.max(1024, Math.min(options.chunkBytes ?? 256 * 1024, 4 * 1024 * 1024));
      const body = { session_package_uid: pkg, type: "audio" };
      const importId = Math.floor(Math.random() * 2147483647);
      const post = (payload) => this.wire.post("/workspace/import_file", { ...body, import_id: importId, ...payload });
      const begun = await post({ phase: "begin", name });
      const uid = begun?.uid;
      if (typeof uid !== "string") throw new UAError("invalid_response", "uploadFile(): import_file begin answered without a uid", { path: "/workspace/import_file" });
      let ended;
      try {
        for (let offset = 0; offset < data.length; offset += chunk) {
          await post({ phase: "transfer", uid, file_data: base64(data.subarray(offset, offset + chunk)) });
          options.onProgress?.(Math.min(data.length, offset + chunk), data.length);
        }
        ended = await post({ phase: "end", uid, name });
      } catch (err) {
        await post({ phase: "cancel", uid, name }).catch(() => void 0);
        throw err;
      }
      const filed = typeof ended?.uid === "string" && ended.uid ? ended.uid : uid;
      return this.listedSource(filed, options.timeoutMs ?? 3e4);
    }
    /** Wait for `uid` to appear in the workspace audio folder, re-reading it while waiting. */
    async listedSource(uid, timeoutMs) {
      const sources = this.sources;
      if (!sources) throw new UAError("unavailable", "the session package uid went away during an import", { path: this.path });
      const deadline = Date.now() + timeoutMs;
      for (; ; ) {
        const found = sources.byId(uid);
        if (found) return found;
        if (Date.now() > deadline) throw new UAError("no_effect", `the workspace did not list source ${uid} within ${timeoutMs} ms`, { path: sources.path });
        await this.client.store.load(sources.path, { levels: 2, commands: false, flatvalue: true });
        if (sources.refresh().some((s) => s.id === uid)) continue;
        await new Promise((r) => setTimeout(r, 50));
      }
    }
    async importPath(path, options = {}) {
      const type = options.type ?? "audio";
      if (type !== "audio" && type !== "midi" && type !== "video") throw new UAError("out_of_range", `importPath(): type must be 'audio', 'midi' or 'video'`, { path: this.path });
      await this.ready();
      const sources = this.sources;
      if (!sources) throw new UAError("unavailable", "importPath(): the session package uid is not known yet", { path: this.path });
      const name = options.name ?? path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);
      if (!name) throw new UAError("out_of_range", `importPath(): no file name in ${JSON.stringify(path)}`, { path: this.path });
      const reply = await this.wire.post("/workspace/import_file", {
        session_package_uid: this.sessionPackageUid.value,
        type,
        import_id: Math.floor(Math.random() * 2147483647),
        phase: "local_copy",
        path,
        name
      });
      const uid = reply?.uid;
      if (typeof uid !== "string") throw new UAError("invalid_response", "importPath(): import_file local_copy answered without a uid", { path: "/workspace/import_file" });
      if (type !== "audio") return { uid, type, name };
      return this.listedSource(uid, options.timeoutMs ?? 3e4);
    }
    /**
     * LUNA's own import: the File > Import action. Imports an audio, MIDI or video file at
     * the selection start, onto `trackUid` or a new track, making a clip as LUNA does.
     *
     * A **path route** command run by LUNA's UI, so it needs `/gui`: without it (a headless
     * engine) it rejects with `Luna.Unsupported` (fact 103). To add a source without a
     * clip, or without `/gui`, use {@link importPath}; for a browser `File`, {@link uploadFile}.
     *
     * @example
     * const [path] = await luna.gui.chooseFiles({ filters: ['*.wav', '*.mid'] });
     * if (path) await session.importFile(path, track.id);
     */
    async importFile(path, trackUid) {
      if (!await this.client.gui.available()) throw new Unsupported("importFile(): LUNA imports through its UI, and this engine has no /gui. Use session.importPath(), or session.uploadFile() for a File.");
      const payload = { path };
      if (trackUid !== void 0) payload["track_uid"] = trackUid;
      return this.post("import_files", payload);
    }
    /**
     * Bounce channels through LUNA's render engine (fact 44). Resolves once the render is
     * running, so the caller can watch `render.progress` and `await render.done()`.
     *
     * Without `outputPaths` the finished audio is added to the session as sources, one per
     * channel, under the returned `fileUids`; with them it is written to those paths instead.
     *
     * @example
     * const { render } = await session.bounce({ channelUids: [vocal.id], range: { startTick: 0, stopTick: 8 * Luna.TICKS_PER_BEAT } });
     * await render.done();
     */
    async bounce(options) {
      if (!options.channelUids.length) throw new UAError("out_of_range", "bounce(): give at least one channel", { path: this.path });
      if (options.outputPaths && options.outputPaths.length !== options.channelUids.length) {
        throw new UAError("out_of_range", `bounce(): ${options.outputPaths.length} outputPaths for ${options.channelUids.length} channels`, { path: this.path });
      }
      const tracks = {};
      const buses = {};
      const files = {};
      const fileUids = [];
      options.channelUids.forEach((uid2, i) => {
        const fileUid = newUid();
        fileUids.push(fileUid);
        if (this.tracks.byId(uid2)) tracks[uid2] = fileUid;
        else if (this.buses.byId(uid2)) buses[uid2] = fileUid;
        else throw new UAError("not_found", `bounce(): no channel ${uid2} in this session`, { path: this.path });
        if (options.outputPaths) files[fileUid] = options.outputPaths[i];
      });
      const uid = newUid();
      const addToSession = !options.outputPaths;
      const body = {
        uid,
        type: "bounce",
        name: options.name ?? "Bounce",
        session_uid: this.uid,
        real_time: options.realTime === true,
        add_to_session: addToSession,
        record_point: options.recordPoint ?? "post_pan"
      };
      if (Object.keys(tracks).length) body["tracks"] = tracks;
      if (Object.keys(buses).length) body["buses"] = buses;
      if (options.outputPaths) body["output_paths"] = files;
      const restore = await this.selectRange(options.range);
      try {
        await this.wire.post("/renders/new", body);
        const render = new Render(this.client, `/renders/${uid}`);
        await this.wire.post("/renders/start", { uid });
        await render.reload({ children: false, flatvalue: true, commands: false });
        return { render, fileUids };
      } finally {
        await restore();
      }
    }
    /**
     * LUNA's own export (`export_session`): the main bus over the timeline selection, or
     * `range`, to the session's export folder. The reply carries the path it wrote.
     *
     * The render is already running when this resolves, so a very short offline export can
     * finish and be dropped before anything observes it; `render.done()` then rejects with
     * `removed` although the file was written (fact 44).
     *
     * @example const { render, file } = await session.exportMain({ name: 'Rough mix' });
     */
    async exportMain(options = {}) {
      const restore = await this.selectRange(options.range);
      try {
        const body = { session_uid: this.uid, realtime: options.realTime === true };
        if (options.name !== void 0) body["bounce_name"] = options.name;
        const reply = await this.post("export_session", body);
        const uid = reply?.render_uid;
        if (typeof uid !== "string" || !uid) throw new UAError("no_effect", "exportMain(): LUNA answered without a render_uid", { path: this.path });
        const render = new Render(this.client, `/renders/${uid}`);
        await render.reload({ children: false, flatvalue: true, commands: false }).catch(() => void 0);
        return { render, file: typeof reply.file === "string" ? reply.file : void 0 };
      } finally {
        await restore();
      }
    }
    /**
     * Apply `range` as the timeline selection for the duration of a render, and hand back a
     * function that puts the user's selection back. A no-op when no range is given.
     */
    async selectRange(range) {
      if (!range) return async () => void 0;
      const { startTick, stopTick } = range;
      if (!Number.isFinite(startTick) || !Number.isFinite(stopTick) || startTick < 0 || stopTick <= startTick) {
        throw new UAError("out_of_range", `range ${startTick}..${stopTick} is not a positive tick span`, { path: this.path });
      }
      await this.contexts.load();
      const saved = { start: this.context.selectionStart.value, stop: this.context.selectionStop.value };
      await this.context.select({ startTick: Math.round(startTick), stopTick: Math.round(stopTick) });
      return async () => {
        if (saved.start === null || saved.start === void 0 || saved.stop === null || saved.stop === void 0) return;
        await this.context.select({ startTick: saved.start, stopTick: saved.stop }).catch(() => void 0);
      };
    }
    /**
     * Record one pass onto an audio track and resolve to the finalized take.
     *
     * The flow measured on 4543 (fact 75): route and arm the track and confirm the arm by a
     * read, roll the transport in record (writing the session's `record_enabled` starts
     * playback by itself), wait for `punchedIn` so any count-in is over and capture has really
     * begun, hold for `seconds` or until `signal` aborts, then stop and disarm. The take
     * finalizes onto the track's active playlist as a clip whose source is born under
     * `<session>/record/audio/<uid>` and migrates to the workspace audio folder about half a
     * second later, so this waits for the source to be listed too — the take is drawable by
     * {@link clipAudio} the moment it resolves.
     *
     * LUNA punches in only when the punch point lies inside `loop_start..loop_stop`, looping on
     * or not; outside it the transport rolls, the count-in completes and nothing is captured.
     * The marks are therefore widened around the punch and put back afterwards.
     *
     * The capture is always stopped and the track disarmed, even on error.
     *
     * @example
     * const inputs = await luna.audioInputs();
     * const take = await session.record({ track: drums, inputUid: inputs[0]?.uid, seconds: 8 });
     * console.log(take.name.value, take.length! / Luna.TICKS_PER_BEAT, 'beats');
     */
    async record(options) {
      await this.ready();
      const track = typeof options.track === "string" ? this.tracks.byId(options.track) : options.track;
      if (!track) throw new UAError("not_found", `record(): no track ${String(typeof options.track === "string" ? options.track : "")}`, { path: this.path });
      if (track.trackType.value !== "audio") throw new UAError("out_of_range", `record(): ${String(track.name.value)} is not an audio track`, { path: track.path });
      const lane = this.playlistFor(track);
      if (!lane) throw new UAError("unavailable", `record(): ${String(track.name.value)} has no active playlist`, { path: track.path });
      await lane.clips.load();
      if (options.seconds === void 0 && !options.signal) throw new UAError("out_of_range", "record(): give seconds, a signal, or both", { path: this.path });
      if (options.seconds !== void 0 && (!Number.isFinite(options.seconds) || options.seconds <= 0)) {
        throw new UAError("out_of_range", "record(): seconds must be greater than 0", { path: this.path });
      }
      if (options.inputUid !== void 0) await track.inputNodeUid.set(options.inputUid);
      await track.recordEnabled.set(true);
      await settle(() => track.recordEnabled.value === true, "arm track", {
        path: track.path,
        refresh: () => this.client.store.load(track.path, { children: false, commands: false, propfilter: ["record_enabled"] }),
        flush: () => this.client.store.scheduler.flush()
      });
      await this.transport.looping.set(false);
      if (options.startTick !== void 0) await this.transport.playStart.set(requireTick(options.startTick, "startTick"));
      await this.client.store.load(this.path, { children: false, commands: false, propfilter: ["play_start", "loop_start", "loop_stop"] });
      const punchAt = options.startTick ?? this.transport.playStart.value ?? 0;
      const loopWas = { start: this.transport.loopStart.value, stop: this.transport.loopStop.value };
      let widened = false;
      if (loopWas.start !== void 0 && loopWas.stop !== void 0 && !(punchAt >= loopWas.start && punchAt < loopWas.stop)) {
        await this.transport.setLoop(Math.min(loopWas.start, punchAt), Math.max(loopWas.stop, punchAt + RECORD_LOOP_MARGIN_TICKS));
        widened = true;
      }
      const before = new Set(lane.clips.items.map((c) => c.id));
      try {
        await this.transport.recordEnabled.set(true);
        await settle(() => this.transport.punchedIn.value === true, "punch in", {
          path: this.path,
          timeoutMs: 3e4,
          refresh: () => this.client.store.load(this.path, { children: false, commands: false, propfilter: ["punched_in", "counting_in", "playing"] }),
          flush: () => this.client.store.scheduler.flush()
        });
        await captureWindow(options.seconds, options.maxSeconds ?? 600, options.signal);
      } finally {
        await this.transport.recordEnabled.set(false).catch(() => {
        });
        await this.transport.playing.set(false).catch(() => {
        });
        await track.recordEnabled.set(false).catch(() => {
        });
        await this.client.store.load(track.path, { children: false, commands: false, propfilter: ["record_enabled", "record_mute", "input_monitor", "input_monitor_state"] }).catch(() => {
        });
        await this.client.store.load(this.path, { children: false, commands: false, propfilter: ["record_enabled", "playing", "punched_in", "counting_in"] }).catch(() => {
        });
        if (widened && loopWas.start !== void 0 && loopWas.stop !== void 0) await this.transport.setLoop(loopWas.start, loopWas.stop).catch(() => {
        });
      }
      let take;
      await settle(
        () => {
          take = lane.clips.items.find((c) => !before.has(c.id) && Boolean(c.sourceUid.value) && (c.stop.value ?? 0) > (c.start.value ?? 0));
          return take !== void 0;
        },
        "finalize take",
        {
          path: `${lane.path}/clips`,
          timeoutMs: 8e3,
          refresh: async () => {
            await this.client.store.load(`${lane.path}/clips`, { levels: 2, commands: false, flatvalue: true, propfilter: CLIP_PROPS });
            lane.clips.refresh();
          },
          flush: () => this.client.store.scheduler.flush()
        }
      );
      const sourceUid = take.sourceUid.value;
      if (sourceUid) await this.listedSource(sourceUid, 8e3).catch(() => void 0);
      return take;
    }
    /** Close this session. */
    close() {
      return this.wire.post("/sessions/close_session", { session_uid: this.uid });
    }
    release() {
      this.tracks.dispose();
      this.buses.dispose();
      this.playlists.dispose();
      this.musical.dispose();
      this.markers.dispose();
      this.lyrics.dispose();
      this.groups.dispose();
      this.storage.dispose();
      this.contexts.dispose();
      this.recordTakes.dispose();
      this.sourcesCollection?.dispose();
      this.sourcesRelease?.();
      this.sourcesRelease = void 0;
      this.packageNode?.dispose();
      this.packageNode = void 0;
      this.watchRelease?.();
      this.watchRelease = void 0;
      this.readyPromise = void 0;
      this.client.store.forget(this.path);
    }
  };
  function captureWindow(seconds, maxSeconds, signal) {
    const deadline = Date.now() + Math.min(seconds ?? maxSeconds, maxSeconds) * 1e3;
    return new Promise((resolve) => {
      let timer;
      const finish = () => {
        if (timer) clearInterval(timer);
        signal?.removeEventListener("abort", finish);
        resolve();
      };
      if (signal?.aborted) return finish();
      signal?.addEventListener("abort", finish, { once: true });
      timer = setInterval(() => {
        if (Date.now() >= deadline) finish();
      }, 50);
    });
  }
  async function toBytes(input) {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    return new Uint8Array(await input.arrayBuffer());
  }
  function fileName(input) {
    if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) return void 0;
    const name = input.name;
    return typeof name === "string" && name ? name : void 0;
  }
  function base64(bytes) {
    if (typeof Buffer !== "undefined") return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
    let binary = "";
    for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return btoa(binary);
  }
  function autoCreatesTrack2(name) {
    const lower = name.toLowerCase();
    return lower !== "" && lower !== "mon" && !["talkback", "monitor", "mon ", "loopback"].some((f) => lower.includes(f));
  }
  function newUid() {
    return globalThis.crypto.randomUUID().replaceAll("-", "");
  }
  function replyUids(reply) {
    const rows = Array.isArray(reply) ? reply : reply ? [reply] : [];
    return rows.map((r) => r?.uid).filter((u) => typeof u === "string" && u !== "");
  }

  // src/model/sessions.ts
  function normalizePackageUid(uid) {
    return typeof uid === "string" ? uid.replaceAll("-", "").toLowerCase() : "";
  }
  function newSessionUid() {
    const uuid = globalThis.crypto?.randomUUID?.() ?? "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === "x" ? r : r & 3 | 8).toString(16);
    });
    return uuid.replaceAll("-", "");
  }
  var Sessions = class extends Node {
    /** Open sessions. */
    items;
    /** Uid of the focused session, writable. */
    focusedUid;
    /** The focused Session object, when it is among the open ones. */
    focused;
    readyPromise;
    /** @internal */
    constructor(client) {
      super(client, "/sessions");
      this.items = new Collection(client, "/sessions", (_path, uid) => new Session(client, uid), { levels: 1, commands: false, flatvalue: true });
      this.focusedUid = this.writableProp("focused_session");
      this.focused = derived([this.focusedUid, this.items], () => {
        const uid = this.focusedUid.value;
        return uid ? this.items.byId(uid) : void 0;
      });
    }
    /**
     * Subscribe to `/sessions` and load the list, with each open session's own properties
     * (name, `sessionPackageUid`, `loaded`) but not its contents. Idempotent. A session opened
     * later has its properties read as it appears (`await luna.settled()` waits for that).
     */
    ready() {
      if (!this.readyPromise) {
        const watch = this.client.store.watch("/sessions", { load: { flatvalue: true, commands: false } });
        this.readyPromise = watch.ready.then(async () => {
          this.items.refresh();
          await Promise.all(this.items.items.map((s) => this.readHeader(s)));
          this.items.onChange(() => {
            for (const s of this.items.items) void this.readHeader(s);
          });
        });
      }
      return this.readyPromise;
    }
    headers = /* @__PURE__ */ new WeakSet();
    /** Read a session's own properties once, so `sessionPackageUid` is known without `ready()`. */
    readHeader(session) {
      if (this.headers.has(session) || session.sessionPackageUid.value !== void 0) return Promise.resolve();
      this.headers.add(session);
      return this.client.store.load(session.path, { children: false, commands: false, flatvalue: true }).then(
        () => void 0,
        () => {
          this.headers.delete(session);
        }
      );
    }
    /**
     * The open session whose package is `packageUid`, or `undefined`. Dashes and case are
     * ignored, so a uid from `workspace.recent()` or `query()` matches however it was written.
     * Call after `ready()`.
     *
     * @example
     * await luna.sessions.ready();
     * const open = luna.sessions.byPackageUid(row.uid);
     * if (open) await luna.sessions.focusedUid.set(open.uid);
     * else await luna.sessions.open(row.uid);
     */
    byPackageUid(packageUid) {
      const want = normalizePackageUid(packageUid);
      if (!want) return void 0;
      return this.items.items.find((s) => normalizePackageUid(s.sessionPackageUid.value) === want);
    }
    /**
     * Switch to the session of a package if it is open, else open it: the "open this" of a
     * recent-sessions list.
     *
     * @example
     * row.onclick = () => void luna.sessions.openOrFocus(entry.uid);
     */
    async openOrFocus(packageUid, timeoutMs) {
      await this.ready();
      const open = this.byPackageUid(packageUid);
      if (!open) return this.open(packageUid, timeoutMs);
      if (this.focusedUid.value !== open.uid) await this.focusedUid.set(open.uid);
      return open;
    }
    /** The focused session or, failing that, the first open one. Not yet `ready()`. */
    current() {
      return this.focused.value ?? this.items.items[0];
    }
    /**
     * Create a new session, load it and wait until the engine reports it loaded.
     *
     * @example
     * const s = await luna.sessions.create({ name: 'Demo' });
     *
     * // An Add On's own session, found again by a fixed package uid (fact 237):
     * const sessionPackageUid = '7d3c0f9e2b8a4c61a5e4f0b9c2d1e3a7';
     * const row = (await luna.workspace.query()).find((r) => r.uid === sessionPackageUid);
     * const own = row?.online
     *   ? await luna.sessions.open(sessionPackageUid)
     *   : await luna.sessions.create({ name: 'My Add On', sessionPackageUid });
     */
    async create(options) {
      const payload = { name: options.name };
      if (options.directoryPath !== void 0) payload["directory_path"] = options.directoryPath;
      if (options.sessionPackageUid !== void 0) payload["session_package_uid"] = options.sessionPackageUid.replaceAll("-", "");
      if (options.sessionType !== void 0) payload["session_type"] = options.sessionType;
      if (options.standaloneId !== void 0) payload["standalone_id"] = options.standaloneId;
      const reply = await this.post("new_session", payload);
      const uid = reply?.session_uid;
      if (!uid) throw new Error("new_session did not return a session_uid");
      return this.loadSession(uid, options.timeoutMs);
    }
    /** Open an existing session package by its uid (see `/workspace/sessions`). */
    async open(sessionPackageUid, timeoutMs) {
      const reply = await this.post("open_session", { session_package_uid: sessionPackageUid.replaceAll("-", "") });
      const uid = reply?.session_uid;
      if (!uid) throw new Error("open_session did not return a session_uid");
      return this.loadSession(uid, timeoutMs);
    }
    /**
     * Create a session copied from a session template (see `workspace.templates()`), load it
     * and wait until the engine reports it loaded. The new session is its own package; the
     * template is never changed.
     *
     * @example
     * const [template] = await luna.workspace.templates();
     * const session = await luna.sessions.createFromTemplate({ templatePackageUid: template.uid, name: 'My Song' });
     * session.sessionPackageUid.value;   // the copy's own package, to reopen later with sessions.open()
     */
    async createFromTemplate(options) {
      const templateUid = options.templatePackageUid.replaceAll("-", "");
      if (!templateUid) throw new Error("createFromTemplate needs a templatePackageUid");
      const payload = { name: options.name, session_uid: newSessionUid(), session_package_uid: templateUid, read_only: false };
      if (options.directoryPath !== void 0) payload["path"] = options.directoryPath;
      const reply = await this.post("new_session_from_template", payload);
      return this.loadSession(reply?.session_uid || payload["session_uid"], options.timeoutMs);
    }
    /** Close a session by uid. */
    close(uid) {
      return this.post("close_session", { session_uid: uid });
    }
    /** `load_session` then wait for `/sessions/<uid>/loaded` to become true (fact 15). */
    async loadSession(uid, timeoutMs = 15e3) {
      await this.post("load_session", { session_uid: uid });
      await this.ready();
      await this.client.store.load("/sessions", { flatvalue: true, commands: false });
      const session = this.items.byId(uid) ?? new Session(this.client, uid);
      await session.ready();
      if (session.loaded.value !== true) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            unsub();
            reject(new RequestTimeout("load_session", session.path, timeoutMs));
          }, timeoutMs);
          const unsub = session.loaded.onChange(() => {
            if (session.loaded.value === true) {
              clearTimeout(timer);
              unsub();
              resolve();
            }
          });
          void this.client.store.load(`${session.path}/loaded`).catch(() => void 0);
        });
      }
      return session;
    }
  };

  // src/model/gain.ts
  function gainToDb(gain) {
    if (!(gain > 0)) return -Infinity;
    return 20 * Math.log10(gain);
  }
  var NEG_INFINITY_DB = -144;
  function dbToGain(db) {
    return db <= NEG_INFINITY_DB ? 0 : Math.pow(10, db / 20);
  }

  // src/model/insert-slots.ts
  var INSERT_ALIAS_PREFIX = "alias.";
  var NAMED_SLOTS = {
    instrument: "instrument",
    tape: "tape",
    bus_input: "bus_input",
    console: "console",
    channel_strip: "console",
    reserved_0: "reserved_0",
    sidechain_filter: "sidechain_filter",
    bus_compressor: "bus_compressor",
    ara_editor_renderer: "ara_editor_renderer"
  };
  var INDEXED_SLOT = /^(effect|midi|record_fx)_(\d+)$/;
  var MAX_INDEX = { effect: 64, midi: 64, record_fx: 15 };
  function parseSlot(name) {
    if (Object.prototype.hasOwnProperty.call(NAMED_SLOTS, name)) return NAMED_SLOTS[name];
    const m = INDEXED_SLOT.exec(name);
    if (!m) return void 0;
    return Number(m[2]) <= (MAX_INDEX[m[1]] ?? -1) ? name : void 0;
  }
  function isRecordFxSlot(slot) {
    return /^record_fx_\d+$/.test(slot);
  }
  function isInsertAliasPluginId(pluginId) {
    return insertSlotForAlias(pluginId) !== void 0;
  }
  function insertSlotForAlias(pluginId) {
    if (!pluginId.startsWith(INSERT_ALIAS_PREFIX)) return void 0;
    return parseSlot(pluginId.slice(INSERT_ALIAS_PREFIX.length));
  }
  var LUNA_CHANNEL_PLUGIN_ID = "uaudio_luna_channel";
  var LUNA_EXTENSION_PLUGIN_IDS = [
    "uaudio_neve_console",
    "uaudio_api_summing",
    "uaudio_api_vision_ext",
    "uaudio_tube_channel_strip_ext",
    "uaudio_api_2500_ext",
    "uaudio_ampex_atr_102_ext",
    "UAD API Preamp",
    "uaudio_cambridge_ext",
    "uaudio_rhea",
    "uaudio_hardware_insert",
    LUNA_CHANNEL_PLUGIN_ID
  ];
  function isLunaExtensionPluginId(pluginId) {
    return LUNA_EXTENSION_PLUGIN_IDS.includes(pluginId);
  }
  function pluginFormat(pluginId) {
    if (pluginId.includes(".vst.")) return "vst";
    if (pluginId.includes(".vst3.")) return "vst3";
    if (pluginId.includes(".au.")) return "au";
    if (pluginId.startsWith("cloud:")) return "cloud";
    if (pluginId.startsWith("localml:")) return "localml";
    if (pluginId.startsWith("UAD ")) return "uad2";
    return "uadx";
  }

  // src/model/value-lists.ts
  var TRACK_TYPES = ["audio", "instrument", "midi_matrix", "bus", "click", "count_in", "multi_output", "video"];
  function parseTrackType(value) {
    return TRACK_TYPES.includes(value) ? value : void 0;
  }
  var MAX_CUE_BUSES = 64;
  var BUS_TYPES = ["master", "aux", "input", "talkback", "loopback", "headphone"];
  function parseBusType(value) {
    if (BUS_TYPES.includes(value)) return value;
    if (typeof value !== "string") return void 0;
    const m = /^cue_(0|[1-9]\d*)$/.exec(value);
    return m && Number(m[1]) < MAX_CUE_BUSES ? value : void 0;
  }
  var FOLDER_MODES = ["none", "summing", "container"];
  function parseFolderMode(value) {
    return FOLDER_MODES.includes(value) ? value : void 0;
  }
  var STEM_FORMATS = ["mono", "stereo", "2_1", "lcr", "lcrs", "quad", "5_1", "6_1", "7_1", "5_1_4", "7_1_4", "9_1_6"];
  function parseStemFormat(value) {
    return STEM_FORMATS.includes(value) ? value : void 0;
  }
  var SESSION_TYPES2 = ["default", "multi", "history", "template", "track_preset", "device_mixer", "volt", "standalone"];
  function parseSessionType(value) {
    if (typeof value === "number") return Number.isInteger(value) ? SESSION_TYPES2[value] : void 0;
    return SESSION_TYPES2.includes(value) ? value : void 0;
  }
  var HIDDEN_SESSION_TYPES = ["history", "track_preset"];
  function isHiddenSessionType(value) {
    const type = parseSessionType(value);
    return type !== void 0 && HIDDEN_SESSION_TYPES.includes(type);
  }
  function parseControlType(value) {
    return CONTROL_TYPES.includes(value) ? value : void 0;
  }

  // src/model/error-codes.ts
  var ErrorCodes = {
    // LUNA's UANet server
    /** A property name the node does not have. */
    INVALID_PROPERTY: "uasrv.invalid_property",
    /** A value the command or property refuses (an unknown uid, a range, a bad mode). */
    INVALID_VALUE: "uasrv.invalid_value",
    /** No node or command at the path: often an older LUNA without the feature. */
    INVALID_OBJECT: "uasrv.invalid_object",
    /** A value of the wrong type. */
    INVALID_TYPE: "uasrv.invalid_type",
    /** A write to a read-only property. */
    READ_ONLY: "uasrv.read_only",
    /** A command missing a required field. */
    MISSING_FIELD: "uasrv.missing_field",
    /** A file or folder could not be read or written. */
    FILESYSTEM_ERROR: "uasrv.filesystem_error",
    /** LUNA is busy with the same kind of request; try again later. */
    TOO_MANY_REQUESTS: "uasrv.too_many_requests",
    /** LUNA is busy with another step; try again. */
    SOFTWARE_BUSY: "uasrv.software_busy",
    /** What the request names is not installed (an Add On, an app, LUNA itself for an "open in LUNA"). */
    NOT_INSTALLED: "uasrv.not_installed",
    /** The user has not allowed it (for example a folder `list_files` was not granted). */
    NOT_PERMITTED: "uasrv.not_permitted",
    /** The command exists but is not implemented on this engine. */
    NOT_IMPLEMENTED: "uasrv.not_implemented",
    /** LUNA's catch-all. */
    DEFAULT_ERROR: "uasrv.default_error",
    // LUNA's session engine
    /** The session database refused the change (for example a `folder_uid` that is not a folder). */
    DATABASE_ERROR: "device.database_error",
    /** A file the session needs could not be found or read. */
    DEVICE_FILESYSTEM_ERROR: "device.filesystem_error",
    /** An output assignment names a bus that no longer exists. */
    MISSING_BUS: "device.missing_bus",
    /** An assignment names an input that does not exist. */
    MISSING_INPUT: "device.missing_input",
    /** An assignment names an output that does not exist. */
    MISSING_OUTPUT: "device.missing_output",
    /** The session cannot be written (read-only). */
    SESSION_NOT_WRITABLE: "device.session_not_writable",
    /** An edit that needs a selection was given none. */
    NO_SELECTION: "device.no_selection",
    /** An edit range that is empty or reversed. */
    INVALID_RANGE: "device.invalid_range",
    // LUNA's mixer
    /** A slot's `plugin_error` when its plug-in is not installed (`Luna.PLUGIN_ERROR_MISSING`). */
    MISSING_PLUGIN: "mixer.missing_plug-in",
    // The SDK's own (see the `Luna.Error` subclasses)
    /** No LUNA answered: `Luna.NotRunning`. */
    NOT_RUNNING: "not_running",
    /** A request was not answered in time: `Luna.RequestTimeout`. */
    TIMEOUT: "timeout",
    /** The connection dropped: `Luna.ConnectionLost`. */
    DISCONNECTED: "disconnected",
    /** The engine lacks the feature: `Luna.Unsupported`. */
    UNSUPPORTED: "unsupported",
    /** No session is open: `Luna.NoSessionOpen`. */
    NO_SESSION: "no_session",
    /** The object's node was removed: `Luna.Disposed`. */
    DISPOSED: "disposed",
    /** An argument the SDK refuses before sending anything. */
    OUT_OF_RANGE: "out_of_range"
  };

  // src/model/folder-tree.ts
  var idOf = (ref) => typeof ref === "string" ? ref : ref.id;
  function isFolderChannel(c) {
    const mode = c.folderMode?.value;
    return mode === "summing" || mode === "container";
  }
  function compareOrder(a, b) {
    if (a === void 0 || a === null) return b === void 0 || b === null ? 0 : 1;
    if (b === void 0 || b === null) return -1;
    return a - b;
  }
  function folderTree(source) {
    if (isChannelList(source)) return new FolderTree(source);
    return new FolderTree([...source.tracks.items, ...source.buses.items]);
  }
  function isChannelList(source) {
    return Array.isArray(source);
  }
  var FolderTree = class {
    /** Every row, depth first: a folder comes right before its contents, siblings by `order`. */
    rows;
    /** The rows at the session root, in order, anomalies drawn there included. */
    roots;
    /** Everything malformed about the links; empty for a well-formed session. */
    anomalies;
    byId = /* @__PURE__ */ new Map();
    channels = /* @__PURE__ */ new Map();
    /** @internal Use {@link folderTree}. */
    constructor(channels) {
      const anomalies = [];
      const ordered = [];
      for (const c of channels) {
        if (this.channels.has(c.id)) {
          anomalies.push({ kind: "duplicate-id", id: c.id });
          continue;
        }
        this.channels.set(c.id, c);
        ordered.push(c);
      }
      const parentOf2 = /* @__PURE__ */ new Map();
      for (const c of ordered) {
        const claimed = c.folderUid.value ?? null;
        let parent = null;
        if (claimed === c.id) anomalies.push({ kind: "self-parent", id: c.id, folderUid: claimed });
        else if (claimed !== null && claimed !== "") {
          const folder = this.channels.get(claimed);
          if (!folder) anomalies.push({ kind: "dangling-parent", id: c.id, folderUid: claimed });
          else {
            parent = claimed;
            if (!isFolderChannel(folder)) anomalies.push({ kind: "non-folder-parent", id: c.id, folderUid: claimed });
          }
        }
        parentOf2.set(c.id, parent);
      }
      const inputIndex = new Map(ordered.map((c, i) => [c.id, i]));
      const done = /* @__PURE__ */ new Set();
      for (const c of ordered) {
        const path = [];
        const at = /* @__PURE__ */ new Map();
        let current = c.id;
        while (current !== null && !done.has(current)) {
          const seen = at.get(current);
          if (seen !== void 0) {
            const loop = path.slice(seen);
            let entry = loop[0];
            for (const id of loop.slice(1)) {
              const cmp = compareOrder(this.channels.get(id).order.value, this.channels.get(entry).order.value);
              if (cmp < 0 || cmp === 0 && inputIndex.get(id) < inputIndex.get(entry)) entry = id;
            }
            anomalies.push({ kind: "cycle", id: entry, folderUid: this.channels.get(entry).folderUid.value ?? "" });
            parentOf2.set(entry, null);
            break;
          }
          at.set(current, path.length);
          path.push(current);
          current = parentOf2.get(current) ?? null;
        }
        for (const id of path) done.add(id);
      }
      const childrenOf = /* @__PURE__ */ new Map();
      for (const c of ordered) {
        const parent = parentOf2.get(c.id) ?? null;
        const siblings = childrenOf.get(parent);
        if (siblings) siblings.push(c);
        else childrenOf.set(parent, [c]);
      }
      for (const siblings of childrenOf.values()) siblings.sort((a, b) => compareOrder(a.order.value, b.order.value));
      const rows = [];
      const roots = [];
      const childIds = /* @__PURE__ */ new Map();
      const stack = [];
      const push = (parentId, depth) => {
        const siblings = childrenOf.get(parentId) ?? [];
        for (let i = siblings.length - 1; i >= 0; i--) stack.push({ channel: siblings[i], depth, parentId });
      };
      push(null, 0);
      while (stack.length > 0) {
        const { channel, depth, parentId } = stack.pop();
        if (this.byId.has(channel.id)) continue;
        const kids = [];
        childIds.set(channel.id, kids);
        const row = { channel, id: channel.id, depth, isFolder: isFolderChannel(channel), parentId, childIds: kids };
        rows.push(row);
        this.byId.set(row.id, row);
        if (parentId === null) roots.push(row);
        else childIds.get(parentId)?.push(row.id);
        push(channel.id, depth + 1);
      }
      this.rows = rows;
      this.roots = roots;
      this.anomalies = anomalies;
    }
    /**
     * The row of a track or bus, by id or object; `undefined` when it is not in the tree.
     *
     * @example
     * tree.row(track)?.depth;   // 1 inside a top-level folder
     */
    row(channel) {
      return this.byId.get(idOf(channel));
    }
    /**
     * The rows to draw: {@link rows} without everything inside a collapsed folder, a collapsed
     * folder inside another included, and without what `filter` rejects.
     *
     * @example
     * const ctx = session.context;
     * const rows = tree.visibleRows({
     *   collapsed: ctx.collapsedFolders.value,
     *   filter: (r) => !(r.channel instanceof Luna.Track && ['click', 'count_in'].includes(r.channel.trackType.value ?? '')),
     * });
     */
    visibleRows(options = {}) {
      const collapsed = new Set(options.collapsed ?? []);
      const out = [];
      let hideBelow = Infinity;
      for (const row of this.rows) {
        if (row.depth >= hideBelow) continue;
        hideBelow = Infinity;
        if (row.isFolder && collapsed.has(row.id)) hideBelow = row.depth + 1;
        if (options.filter && !options.filter(row)) continue;
        out.push(row);
      }
      return out;
    }
    /**
     * Everything inside a folder, nested folders' contents included, in order; the folder
     * itself is left out. Empty for a track, an empty folder or an unknown id.
     *
     * @example
     * const inside = tree.descendants(drums).map((r) => r.channel);
     */
    descendants(folder) {
      const start = this.byId.get(idOf(folder));
      if (!start) return [];
      const out = [];
      const stack = [...start.childIds].reverse();
      while (stack.length > 0) {
        const row = this.byId.get(stack.pop());
        if (!row) continue;
        out.push(row);
        for (let i = row.childIds.length - 1; i >= 0; i--) stack.push(row.childIds[i]);
      }
      return out;
    }
    /**
     * A track selection as LUNA widens it (fact 182): a selected folder brings everything inside it, right
     * after it. Order is kept, duplicates are dropped (first place wins), and ids not in the
     * tree are dropped.
     *
     * @example
     * const ctx = session.context;
     * const ids = tree.expandSelection(ctx.selectionTracks.value ?? []);
     */
    expandSelection(ids) {
      const out = [];
      const seen = /* @__PURE__ */ new Set();
      const add = (id) => {
        if (!seen.has(id)) {
          seen.add(id);
          out.push(id);
        }
      };
      for (const ref of ids) {
        const row = this.byId.get(idOf(ref));
        if (!row) continue;
        add(row.id);
        if (row.isFolder) for (const d of this.descendants(row.id)) add(d.id);
      }
      return out;
    }
    /**
     * The summing folder a track or bus's main output goes to, as LUNA routes it (fact 136): the
     * nearest `summing` folder above it, passing through `container` ones; `null` for the master
     * (no summing folder above, or a channel not in the tree). A summing folder gives the one
     * above it, never itself. It follows the channels' own `folderUid` links, as LUNA does, not
     * the re-rooted rows, and stops at a loop.
     *
     * @example
     * const target = tree.summingFolder(track);
     * label.textContent = target ? `→ ${target.name.value}` : '→ Master';
     */
    summingFolder(channel) {
      const start = this.channels.get(idOf(channel));
      if (!start) return null;
      const seen = /* @__PURE__ */ new Set([start.id]);
      let current = start.folderUid.value ?? null;
      while (current && !seen.has(current)) {
        seen.add(current);
        const folder = this.channels.get(current);
        if (!folder) return null;
        if (folder.folderMode?.value === "summing") return folder;
        current = folder.folderUid.value ?? null;
      }
      return null;
    }
  };

  // src/model/session-settings.ts
  function parseRollDuration(value) {
    if (typeof value !== "string") return void 0;
    const parts = value.split(",");
    if (parts.length !== 3) return void 0;
    const [bars, beats, ticks] = parts.map((p) => Number(p.trim()));
    if (![bars, beats, ticks].every((n) => Number.isInteger(n))) return void 0;
    return { bars, beats, ticks };
  }
  function formatRollDuration(duration) {
    const parts = [duration.bars ?? 0, duration.beats ?? 0, duration.ticks ?? 0];
    if (!parts.every((n) => Number.isInteger(n) && n >= 0)) throw new UAError("out_of_range", "formatRollDuration(): bars, beats and ticks must be integers >= 0");
    return parts.join(",");
  }

  // src/client/secrets.ts
  var MAX_SECRET_NAME_LENGTH = 128;
  var MAX_SECRET_BYTES = 2560;
  var NAME2 = /^[A-Za-z0-9._-]+$/;
  var TIMEOUT_MS = 3e4;
  var pending = /* @__PURE__ */ new Map();
  var memory = /* @__PURE__ */ new Map();
  var nextId = 1;
  var warned = false;
  var Secrets = class {
    /**
     * `'keychain'` inside a LUNA that stores secrets; `'memory'` elsewhere, where values last
     * only until the page reloads. Tell the user when it is `'memory'`.
     *
     * @example
     * if (luna.secrets.storage === 'memory') banner.textContent = 'Keys are kept until you close this page.';
     */
    get storage() {
      return bridge() ? "keychain" : "memory";
    }
    /**
     * The value stored under `name`, or `null` if there is none.
     *
     * @example
     * const key = await luna.secrets.get('openai.api_key');
     */
    get(name) {
      checkName(name);
      if (!bridge()) return Promise.resolve(memory.get(name) ?? null);
      return request({ op: "get", name });
    }
    /**
     * Store `value` under `name`, replacing any value already there.
     *
     * @example
     * await luna.secrets.set('openai.api_key', input.value);
     */
    async set(name, value) {
      checkName(name);
      if (typeof value !== "string") throw new UAError("invalid_request", "luna.secrets.set(): value must be a string");
      if (new TextEncoder().encode(value).length > MAX_SECRET_BYTES) {
        throw new UAError("too_large", `luna.secrets.set(): value is over ${MAX_SECRET_BYTES} bytes`);
      }
      if (!bridge()) {
        warnMemory();
        memory.set(name, value);
        return;
      }
      await request({ op: "set", name, value });
    }
    /**
     * Remove `name`. Removing a name that is not stored succeeds.
     *
     * @example
     * await luna.secrets.delete('openai.api_key');
     */
    async delete(name) {
      checkName(name);
      if (!bridge()) {
        memory.delete(name);
        return;
      }
      await request({ op: "delete", name });
    }
  };
  function bridge() {
    const send = globalThis.lunaAPI?.secretsRequest;
    return typeof send === "function" ? send : void 0;
  }
  function checkName(name) {
    if (typeof name !== "string" || name.length > MAX_SECRET_NAME_LENGTH || !NAME2.test(name)) {
      throw new UAError("invalid_name", `luna.secrets: "${String(name)}" is not a valid name (1-${MAX_SECRET_NAME_LENGTH} of A-Z a-z 0-9 . _ -)`);
    }
  }
  function warnMemory() {
    if (warned) return;
    warned = true;
    console.warn("luna.secrets: no OS credential store here (not inside LUNA, or LUNA is too old); secrets are kept in page memory until reload.");
  }
  function request(body) {
    const send = bridge();
    if (!send) return Promise.reject(new UAError("unsupported", "luna.secrets: the LUNA bridge went away"));
    listen();
    const id = nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new RequestTimeout(`secrets.${body.op}`, body.name, TIMEOUT_MS));
      }, TIMEOUT_MS);
      pending.set(id, { resolve, reject, timer });
      send({ id, ...body });
    });
  }
  function listen() {
    const g = globalThis;
    g.lunaHost ??= {};
    g.lunaHost.secretsResult = onResult;
  }
  function onResult(result) {
    if (typeof result?.id !== "number") return;
    const entry = pending.get(result.id);
    if (!entry) return;
    pending.delete(result.id);
    clearTimeout(entry.timer);
    if (result.ok === true) {
      entry.resolve(typeof result.value === "string" ? result.value : null);
      return;
    }
    const code = typeof result.error === "string" ? result.error : "store_error";
    entry.reject(new UAError(code, `luna.secrets: LUNA answered ${code}`));
  }

  // src/client/client.ts
  var Client = class {
    /** The transport. Escape hatch: `luna.raw.get('/sessions')`. */
    raw;
    /** The path-keyed mirror the domain objects read from. */
    store;
    /** Which engine this client is talking to: `'luna'` or `'mock'`. */
    engine;
    /** Connection status as a {@link Prop}. */
    status;
    /** Open sessions and the commands that create or open them. */
    sessions;
    /** The plugin catalog (`/plugins`). Call `load()` once before reading. */
    plugins;
    /** The preset library (`/presets`): query, tag groups, recommendations, live selection. */
    presets;
    /** Whether UA Assistant is connected to LUNA (`/assistant`); preset recommendations need it. */
    assistant;
    /** Session packages on disk and the workspace query. */
    workspace;
    drivers;
    devices;
    /** The MIDI devices LUNA sees (`/devices/<LUNA>/midi`), `All` and `None` included. */
    midiDevices;
    /** The audio engine LUNA is running: on or off, its kind, the drivers it uses (fact 190). */
    activeAudioEngine;
    /** LUNA's Auto Gain service (`/auto_gain`, fact 191). Check `available()` first. */
    autoGain;
    /**
     * LUNA's error notices (fact 235), read-only. Follows LUNA once watched.
     *
     * @example
     * await luna.errors.watch().ready;
     * luna.errors.sorted.map((e) => `${e.level.value}: ${e.title.value}`);
     */
    errors;
    preferences;
    renders;
    jobs;
    /** LUNA's host surface (dialogs, pages, Add Ons). Only present inside LUNA. */
    gui;
    /** API keys and tokens in the OS credential store, scoped to this Add On (page memory outside LUNA). */
    secrets;
    statusCell;
    statusUnsub;
    /** @internal Use {@link connect}. */
    constructor(port, engine, store = new Store(port)) {
      registry.push(this);
      this.raw = port;
      this.store = store;
      this.engine = engine;
      this.statusCell = new Cell(store.scheduler, port.connected ? "connected" : "disconnected");
      this.status = this.statusCell;
      this.statusUnsub = port.onStatus((s) => this.statusCell.update(s));
      this.sessions = new Sessions(this);
      this.plugins = new Plugins(this);
      this.assistant = new Assistant(this);
      this.presets = new Presets(this);
      this.workspace = new Workspace(this);
      this.drivers = new Drivers(this);
      this.devices = new Devices(this);
      this.midiDevices = new MidiDevices(this);
      this.activeAudioEngine = new ActiveAudioEngine(this);
      this.autoGain = new AutoGain(this);
      this.errors = new ErrorNotices(this);
      this.preferences = new Preferences(this);
      this.renders = new Renders(this);
      this.jobs = new Jobs(this);
      this.gui = new Gui(this);
      this.secrets = new Secrets();
    }
    /**
     * The focused session (or the first open one), subscribed and loaded.
     *
     * With no session open it rejects at once with {@link NoSessionOpen}, unless `wait` is set:
     * then it waits for the user to open or create one. Loading is bounded by `timeoutMs`
     * (default 15 000 ms; with `wait`, no limit unless given), after which it rejects with
     * `RequestTimeout` rather than hanging.
     *
     * @example
     * const session = await luna.session();
     * console.log(session.name.value, session.tracks.items.length);
     *
     * // A page that opens before any session does:
     * const s = await luna.session({ wait: true });
     */
    async session(options = {}) {
      const timeoutMs = options.timeoutMs ?? (options.wait ? Infinity : 15e3);
      const deadline = Date.now() + timeoutMs;
      const bounded = (work, what) => {
        const left = deadline - Date.now();
        if (!Number.isFinite(left)) return work;
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new RequestTimeout(what, "/sessions", timeoutMs)), Math.max(0, left));
          work.then(
            (v) => {
              clearTimeout(timer);
              resolve(v);
            },
            (e) => {
              clearTimeout(timer);
              reject(e);
            }
          );
        });
      };
      await bounded(this.sessions.ready(), "session");
      let current = this.sessions.current();
      if (!current) {
        if (!options.wait) throw new NoSessionOpen();
        current = await bounded(
          new Promise((resolve) => {
            const check = () => {
              const found = this.sessions.current();
              if (!found) return;
              stopItems();
              stopFocus();
              resolve(found);
            };
            const stopItems = this.sessions.items.onChange(check);
            const stopFocus = this.sessions.focused.onChange(check);
            check();
          }),
          "session"
        );
      }
      await bounded(current.ready(), "session");
      return current;
    }
    /**
     * The device inputs a track can record from (`/devices/<device>/inputs`, fact 76). Assign
     * one with `track.inputNodeUid.set(input.uid)`, or pass it to `session.record()`.
     *
     * Read on each call and not cached: devices come and go, and `inUse` changes as tracks are
     * armed. To follow those changes, watch `device.inputs` on each of `luna.devices` instead
     * (fact 185); `input.snapshot()` gives the same record.
     *
     * @example
     * const inputs = await luna.audioInputs();
     * for (const i of inputs) console.log(i.name, i.stemFormat, i.inUse ? '(in use)' : '');
     * await track.inputNodeUid.set(inputs[0]!.uid);
     */
    async audioInputs() {
      const devices = await this.raw.get("/devices", { children: true, properties: false, commands: false });
      const out = [];
      for (const device of childNames2(devices)) {
        const inputs = await this.raw.get(`/devices/${device}/inputs`, { children: true, levels: 2, commands: false, propfilter: ["name", "stem_format", "device_id", "in_use"] }).catch(() => void 0);
        for (const child of childEntries(inputs)) {
          out.push(
            Object.freeze({
              uid: child.name,
              name: typeof child.properties["name"] === "string" ? child.properties["name"] : child.name,
              stemFormat: typeof child.properties["stem_format"] === "string" ? child.properties["stem_format"] : "mono",
              deviceId: typeof child.properties["device_id"] === "string" ? child.properties["device_id"] : device,
              inUse: child.properties["in_use"] === true
            })
          );
        }
      }
      return out;
    }
    get connected() {
      return this.raw.connected;
    }
    /**
     * The in-memory engine when `engine === 'mock'`, for driving the page as a second client
     * would: `luna.mock.setValue(path, 'name', 'Lead')`.
     */
    get mock() {
      return this.raw instanceof MockPort ? this.raw.engine : void 0;
    }
    /**
     * The in-page wasm engine (audio, persistence, health) when `engine === 'wasm'`.
     *
     * @hidden
     */
    get wasm() {
      return this.raw instanceof WasmPort ? this.raw.engine : void 0;
    }
    /**
     * Deliver every pending change notification now, and resolve once they have run. Handy in
     * tests: after `await engine.settled()` the prop *values* are already current, but
     * `onChange` listeners are coalesced to the next frame — this flushes them immediately, so
     * `await engine.settled(); await luna.settled();` is deterministic without waiting for a
     * requestAnimationFrame or timer.
     *
     * It also waits for reads in flight, such as the properties of a member the engine just
     * added (the collection holds that member's `onChange` until they land), so a new clip or
     * track has its values when this resolves.
     */
    async settled() {
      for (let round = 0; round < 8; round++) {
        this.store.scheduler.flush();
        await this.store.scheduler.settled();
        if (!this.store.pendingReads) return;
        await this.store.readsSettled();
      }
    }
    /** Disconnect and release everything. */
    async close() {
      const at = registry.indexOf(this);
      if (at >= 0) registry.splice(at, 1);
      this.statusUnsub();
      await this.store.close();
      await this.raw.close();
      this.statusCell.update("closed");
    }
  };
  var registry = [];
  function clients() {
    return [...registry];
  }
  function childNames2(reply) {
    return childEntries(reply).map((c) => c.name);
  }
  function childEntries(reply) {
    if (typeof reply !== "object" || reply === null) return [];
    const children = reply.children;
    if (!Array.isArray(children)) return [];
    const out = [];
    for (const child of children) {
      if (typeof child === "string") {
        out.push({ name: child, properties: {} });
        continue;
      }
      if (typeof child !== "object" || child === null) continue;
      const record = child;
      const raw = record["path"] ?? record["name"] ?? record["id"];
      if (typeof raw !== "string") continue;
      const name = raw.slice(raw.lastIndexOf("/") + 1);
      const properties = {};
      for (const [key, value] of Object.entries(record)) {
        if (key !== "children" && key !== "commands" && key !== "path" && key !== "properties") properties[key] = unwrapValue(value);
      }
      const nested = record["properties"];
      if (Array.isArray(nested)) {
        for (const entry of nested) {
          if (typeof entry === "object" && entry !== null && typeof entry.name === "string") {
            properties[entry.name] = unwrapValue(entry.value);
          }
        }
      } else if (typeof nested === "object" && nested !== null) {
        for (const [key, value] of Object.entries(nested)) properties[key] = unwrapValue(value);
      }
      out.push({ name, properties });
    }
    return out;
  }
  function unwrapValue(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value) && "value" in value ? value.value : value;
  }

  // src/client/connect.ts
  async function connect(options = {}) {
    if (options.port_) {
      return new Client(options.port_, options.engine ?? "mock");
    }
    const fromLocation = locationOptions();
    if (options.engine === "mock" || options.engine === void 0 && fromLocation.engine === "mock") {
      const setup = options.setup ?? globalThis.LunaMockSetup;
      const engine2 = setup ? new MockEngine() : MockEngine.demo();
      await setup?.(engine2);
      await engine2.settled();
      return new Client(engine2.port(), "mock");
    }
    if (options.engine === "wasm" || options.engine === void 0 && fromLocation.engine === "wasm") {
      const boot = { ...options.wasm ?? {} };
      if (options.engineUrl !== void 0) boot.engineUrl = options.engineUrl;
      else if (fromLocation.engineUrl !== void 0) boot.engineUrl = fromLocation.engineUrl;
      const engine2 = await bootWasmEngine(boot);
      const port2 = new WasmPort(engine2, options.requestTimeoutMs !== void 0 ? { requestTimeoutMs: options.requestTimeoutMs } : {});
      return new Client(port2, "wasm");
    }
    const host = options.host ?? fromLocation.host;
    const port = options.port ?? fromLocation.port ?? DEFAULT_LUNA_PORT;
    const wsOptions = { port };
    if (options.url !== void 0) wsOptions.url = options.url;
    if (host !== void 0) wsOptions.host = host;
    if (options.requestTimeoutMs !== void 0) wsOptions.requestTimeoutMs = options.requestTimeoutMs;
    if (options.WebSocket !== void 0) wsOptions.WebSocket = options.WebSocket;
    if (options.log !== void 0) wsOptions.log = options.log;
    const wsPort = new WebSocketPort(wsOptions);
    await wsPort.open();
    const engine = options.engine ?? "luna";
    return new Client(wsPort, engine);
  }

  // src/client/path-drop.ts
  var registered = [];
  var installed;
  var previous;
  function canDropPaths() {
    return hasNativeBridge();
  }
  function onPathDrop(handlers) {
    const g = globalThis;
    const accept = g.lunaAPI?.setAcceptsFileDrops;
    if (typeof accept !== "function") {
      throw new Unsupported("onPathDrop(): native path drops exist only inside LUNA. Use an HTML drop listener, which gives File objects.");
    }
    const entry = typeof handlers === "function" ? { drop: handlers } : handlers;
    registered.push(entry);
    install(g);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const i = registered.indexOf(entry);
      if (i >= 0) registered.splice(i, 1);
      if (registered.length === 0) uninstall(g);
    };
  }
  function install(g) {
    if (installed && g.lunaHost === installed) return;
    const each = (run2) => {
      for (const h of [...registered]) {
        try {
          run2(h);
        } catch (err) {
          console.warn("Luna.onPathDrop: a handler threw", err);
        }
      }
    };
    const host = {
      ...g.lunaHost,
      fileDragEnter: (info) => each((h) => h.dragOver?.(toDrop(info))),
      fileDragOver: (info) => each((h) => h.dragOver?.(toDrop(info))),
      fileDragLeave: () => each((h) => h.dragLeave?.()),
      filesDropped: (info) => {
        const drop = toDrop(info);
        if (drop.paths.length) each((h) => h.drop(drop));
      }
    };
    previous = g.lunaHost;
    g.lunaHost = host;
    installed = host;
    g.lunaAPI?.setAcceptsFileDrops?.(true);
  }
  function uninstall(g) {
    g.lunaAPI?.setAcceptsFileDrops?.(false);
    if (installed && g.lunaHost === installed) {
      if (previous) g.lunaHost = previous;
      else delete g.lunaHost;
    }
    installed = void 0;
    previous = void 0;
  }
  function toDrop(info) {
    const o = typeof info === "object" && info !== null ? info : {};
    return {
      paths: Array.isArray(o.paths) ? o.paths.filter((p) => typeof p === "string") : [],
      x: typeof o.x === "number" ? o.x : 0,
      y: typeof o.y === "number" ? o.y : 0
    };
  }

  // src/client/source-drag.ts
  function startSourceDrag(event, items) {
    const paths = dragPaths(items);
    if (paths.length === 0) throw new UAError("unavailable", "startSourceDrag(): no file path to drag (is the session ready?)");
    const transfer = event.dataTransfer;
    if (!transfer) throw new UAError("unavailable", "startSourceDrag(): the event has no dataTransfer; call it from a dragstart listener");
    transfer.setData("text/uri-list", paths.map(fileUrl).join("\r\n"));
    transfer.setData("text/plain", paths.join("\n"));
    transfer.effectAllowed = "copy";
    return paths;
  }
  function dragPaths(items) {
    if ("path" in items) return (typeof items.path === "string" ? [items.path] : [...items.path]).filter((p) => p !== "");
    const list = Array.isArray(items.source) ? items.source : [items.source];
    return list.map((s) => items.session.sourcePath(s)).filter((p) => typeof p === "string");
  }
  function fileUrl(path) {
    const posix = path.replaceAll("\\", "/");
    const withRoot = /^[A-Za-z]:\//.test(posix) ? `/${posix}` : posix;
    return `file://${withRoot.split("/").map((seg, i) => i === 1 && /^[A-Za-z]:$/.test(seg) ? seg : encodeURIComponent(seg)).join("/")}`;
  }

  // src/luna.ts
  var VERSION2 = "3.1.2";
  return __toCommonJS(global_exports);
})();
