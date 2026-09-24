/**
 * The transport seam. A Port speaks UANet verbs on paths and holds no model state.
 *
 * Three implementations exist: {@link WebSocketPort} (native LUNA),
 * `WasmPort` (the in-process WebAssembly engine, Phase 4) and {@link MockPort} (tests).
 * Everything above a Port sees the same normalised {@link Event} stream, so the Store and
 * the domain objects never know which engine they are talking to.
 */
/** UANet verbs. */
type Verb = 'get' | 'set' | 'post' | 'subscribe' | 'unsubscribe';
/** Connection state as reported by {@link Port.onStatus}. */
type PortStatus = 'connecting' | 'connected' | 'disconnected' | 'closed';
/** Structural change carried by an {@link Event}. Absent for a property value change. */
type Operation = 'added' | 'removed';
/** A message as it appears on the wire (JSON dialect), before normalisation. */
interface WireMessage {
    path: string;
    data?: unknown;
    operation?: Operation;
    parameters?: Record<string, unknown>;
    error?: string;
    /** Present on some server messages (`update`); ignored by the client. */
    cmd?: string;
}
/**
 * One change pushed by the engine, normalised: a trailing `/value` is stripped, multi-updates
 * are already expanded, and `operation` marks a child added or removed at `path`.
 *
 * @example
 * luna.raw.subscribe('/sessions/abc/tracks/t1', (e) => {
 *   // e.path === '/sessions/abc/tracks/t1/name', e.data === 'Vocal'
 * });
 */
interface Event {
    path: string;
    data: unknown;
    operation?: Operation;
}
type EventHandler = (event: Event) => void;
type Unsubscribe = () => void;
type StatusListener = (status: PortStatus, detail?: string) => void;
/**
 * Query parameters accepted by `get`, in camelCase. Booleans become `1`/`0` on the wire.
 * See `hbsystem/networking/docs/operations.md`.
 */
interface GetOptions {
    /** Include properties (default on). */
    properties?: boolean;
    /** Include children (default on). */
    children?: boolean;
    /** Include commands (default on). */
    commands?: boolean;
    /** Collapse `{ value: X }` to `X` for every property. */
    flatvalue?: boolean;
    /** Include property metadata. */
    propinfo?: boolean;
    /** Include command parameter schemas. */
    cmdparams?: boolean;
    /** Only these property names; an array goes on the wire as a comma-separated list. */
    propfilter?: string | string[];
    /** Whole subtree. */
    recursive?: boolean;
    /** Subtree depth. */
    levels?: number;
    /** Include hidden objects. */
    hidden?: boolean;
    offset?: number;
    limit?: number;
    includedChildren?: string;
    excludedChildren?: string;
    /** Do not send a reply; the returned promise resolves to `undefined` immediately after send. */
    ignoreResponse?: boolean;
}
interface SubscribeOptions {
    /** Receive changes for the whole subtree, not just this node and its direct properties. */
    recursive?: boolean;
}
/**
 * A connection to one engine.
 *
 * @example
 * const port = new Luna.WebSocketPort({ port: 4718 });
 * await port.open();
 * const sessions = await port.get('/sessions', { properties: false, commands: false });
 * port.subscribe('/sessions', (e) => console.log(e.path, e.operation ?? e.data), { recursive: true });
 * await port.close();
 */
interface Port {
    /** True between `connected` and the next `disconnected`/`closed`. */
    readonly connected: boolean;
    /** Read a node or property. Resolves to the reply `data`. */
    get(path: string, options?: GetOptions): Promise<unknown>;
    /** Write a property. Resolves when the engine acknowledges. */
    set(path: string, data: unknown): Promise<void>;
    /** Invoke a command. Resolves to the reply `data` (often `null`). */
    post(path: string, data?: unknown): Promise<unknown>;
    /**
     * Receive pushes at or below `path`. Several handlers on one path share one wire subscription;
     * the wire `unsubscribe` is sent when the last handler is removed.
     */
    subscribe(path: string, handler: EventHandler, options?: SubscribeOptions): Unsubscribe;
    onStatus(listener: StatusListener): Unsubscribe;
    /** Disconnect and fail any in-flight requests with {@link ConnectionLost}. Idempotent. */
    close(): Promise<void>;
}
/** Convert {@link GetOptions} to wire query parameters. */
declare function getOptionsToParams(options: GetOptions | undefined): Record<string, string>;
/** Property updates arrive on `<node>/<prop>/value`; the model addresses `<node>/<prop>`. */
declare function stripValueSuffix(path: string): string;
/** Turn a decoded wire message into the normalised event the Store consumes. */
declare function toEvent(message: WireMessage): Event;
/**
 * True when an event at `eventPath` belongs to a subscription on `subPath`.
 * Prefix matching: the engine only pushes what was subscribed, so a wider subscription on the
 * same connection is the only way a handler sees something deeper than it asked for.
 */
declare function eventMatches(subPath: string, eventPath: string): boolean;
/**
 * Unwrap a property reply. A `get` on a property answers `{ value: X }` unless `flatvalue` was
 * requested, in which case it answers `X` directly.
 */
declare function propertyValue(data: unknown): unknown;
/** Split `<node>/<prop>` into its node path and property name. */
declare function splitPath(path: string): {
    node: string;
    name: string;
};
/** Join path segments with single slashes. */
declare function joinPath(...segments: string[]): string;
/** Severity of a {@link LogFn} message. */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
/**
 * Where a port reports what it does: status changes, reconnect attempts, timeouts, and
 * listeners that threw. The default sends `warn` and `error` to the console.
 *
 * @example
 * const luna = await Luna.connect({ log: (level, message, detail) => console.log(`[${level}] ${message}`, detail ?? '') });
 */
type LogFn = (level: LogLevel, message: string, detail?: Record<string, unknown>) => void;
/** The default {@link LogFn}: warnings and errors to the console, the rest dropped. */
declare const consoleLog: LogFn;

/**
 * Errors thrown by the wire layer and everything above it.
 *
 * Every error carries a machine-readable `code`. For failures reported by the engine
 * the code is the engine's own error string (for example `uasrv.invalid_property`);
 * for failures detected by the SDK it is one of the fixed codes below.
 *
 * @example
 * try {
 *   await luna.raw.set('/sessions/abc/tracks', 1);
 * } catch (e) {
 *   if (e instanceof Luna.Error) console.log(e.code, e.path);
 * }
 */
declare class UAError extends Error {
    /** Engine error string or one of the SDK codes. */
    readonly code: string;
    /** Verb of the request that failed, when known. */
    readonly cmd: string | undefined;
    /** Path of the request that failed, when known. */
    readonly path: string | undefined;
    constructor(code: string, message: string, detail?: {
        cmd?: string;
        path?: string;
    });
}
/** No engine answered at the address. Start LUNA, or pass `{ engine: 'wasm' }`. */
declare class NotRunning extends UAError {
    constructor(url: string);
}
/** The engine did not answer a request within the port's timeout. */
declare class RequestTimeout extends UAError {
    constructor(cmd: string, path: string, ms: number);
}
/** The connection dropped (or was closed) while a request was in flight, or a request was made while disconnected. */
declare class ConnectionLost extends UAError {
    constructor(cmd?: string, path?: string);
}
/** The feature is not available on this engine (for example the wasm engine has no licensing). */
declare class Unsupported extends UAError {
    constructor(what: string);
}
/** No session is open in the engine. */
declare class NoSessionOpen extends UAError {
    constructor();
}
/**
 * The object was disposed: the engine removed its node (a deleted track, a closed session),
 * or its owner was disposed. Its props stop updating and its commands refuse to run, so a
 * stale reference cannot act on whatever takes its place.
 *
 * @example
 * try { await track.name.set('x'); } catch (e) { if (e instanceof Luna.Disposed) refreshView(); }
 */
declare class Disposed extends UAError {
    constructor(what: string, path?: string);
}

/** The subset of the WebSocket API this port uses; lets tests inject a fake. */
interface SocketLike {
    readonly readyState: number;
    send(data: string): void;
    close(code?: number, reason?: string): void;
    onopen: ((ev: unknown) => void) | null;
    onclose: ((ev: unknown) => void) | null;
    onerror: ((ev: unknown) => void) | null;
    onmessage: ((ev: {
        data: unknown;
    }) => void) | null;
}
type SocketConstructor = new (url: string) => SocketLike;
interface WebSocketPortOptions {
    /** Full URL. Overrides `host`/`port`. */
    url?: string;
    /** Default `localhost`. */
    host?: string;
    /** Default 4718, LUNA's engine. */
    port?: number;
    /** Injected WebSocket implementation (tests). Default `globalThis.WebSocket`. */
    WebSocket?: SocketConstructor;
    /** Per-request timeout. Default 10 000 ms. */
    requestTimeoutMs?: number;
    /** Reconnect after a drop. Default true. */
    reconnect?: boolean;
    /** Backoff bounds. Defaults 250 ms and 10 000 ms. */
    reconnectMinMs?: number;
    reconnectMaxMs?: number;
    /** Send `/ping` to defeat the engine's idle timeout. Default true. */
    heartbeat?: boolean;
    /** Query parameter used for correlation. Default `ua_id`. */
    idKey?: string;
    /** Called for messages that are neither replies nor matched by a subscription. */
    onUnhandled?: (message: unknown) => void;
    /** Status changes, reconnects, timeouts and listener errors. Default: warnings and errors to the console. */
    log?: LogFn;
}
declare const DEFAULT_LUNA_PORT = 4718;
declare class WebSocketPort implements Port {
    readonly url: string;
    private readonly Socket;
    private readonly requestTimeoutMs;
    private readonly reconnectEnabled;
    private readonly reconnectMinMs;
    private readonly reconnectMaxMs;
    private readonly heartbeatEnabled;
    private readonly idKey;
    private readonly onUnhandled;
    private readonly log;
    private socket;
    private status;
    private everConnected;
    private closed;
    private nextId;
    private readonly pending;
    private readonly subscriptions;
    private readonly statusListeners;
    private reconnectTimer;
    private reconnectDelay;
    private heartbeatTimer;
    constructor(options?: WebSocketPortOptions);
    get connected(): boolean;
    /**
     * Connect. Resolves once the socket is open. Rejects with {@link NotRunning} if the first
     * attempt fails; later drops are handled by reconnect instead.
     */
    open(): Promise<void>;
    get(path: string, options?: GetOptions): Promise<unknown>;
    set(path: string, data: unknown): Promise<void>;
    post(path: string, data?: unknown): Promise<unknown>;
    subscribe(path: string, handler: EventHandler, options?: SubscribeOptions): Unsubscribe;
    onStatus(listener: StatusListener): Unsubscribe;
    close(): Promise<void>;
    private request;
    private fireAndForget;
    private sendSubscribe;
    private resubscribeAll;
    private handleFrame;
    private failPending;
    private scheduleReconnect;
    private startHeartbeat;
    private stopHeartbeat;
    private setStatus;
}

type CommandHandler = (data: unknown, engine: MockEngine, nodePath: string) => unknown;
interface MockNodeSpec {
    properties?: Record<string, unknown>;
    readOnly?: string[];
    commands?: Record<string, CommandHandler>;
}
/** A row for {@link MockEngine.midiEdit}. */
interface MockMidiRow {
    rowid?: number;
    tick?: number;
    status?: number;
    data1?: number;
    data2?: number;
    enabled?: boolean;
}
declare class MockEngine {
    private readonly nodes;
    private readonly ports;
    private readonly faults;
    private pendingDeliveries;
    private settleWaiters;
    /** Every request any port made, oldest first. Useful for asserting what a model did. */
    readonly requests: {
        verb: Verb;
        path: string;
        data: unknown;
    }[];
    /** `set_touch` calls, as `<control path>:on|off`, oldest first. */
    readonly touches: string[];
    /** Transaction commands seen: `begin`, `commit`, `abort`. */
    readonly transactions: string[];
    constructor();
    /** What the next mock file dialog "selects"; empty means the user cancelled. */
    nextDialogFiles: string[];
    private rowCounter;
    controlPathByUid(uid: string): string | undefined;
    /** Add a plugin to the catalog. */
    addPlugin(pluginId: string, options?: {
        name?: string;
        manufacturer?: string;
        categories?: string[];
    }): void;
    /** Register a session package in the workspace. */
    addPackage(uid: string, options?: {
        name?: string;
        lastOpened?: number;
        favorite?: boolean;
    }): void;
    /** A new client connection. */
    port(): MockPort;
    /** Create a node (and any missing ancestors). Pushes `added` to subscribers. */
    addNode(path: string, spec?: MockNodeSpec): void;
    /** Remove a node and its subtree. Pushes `removed` to subscribers. */
    removeNode(path: string): void;
    /** Engine-side property change: updates the tree and pushes to every subscribed port. */
    setValue(nodePath: string, property: string, value: unknown): void;
    /**
     * The session `location` LUNA reports for `tick`: bar|beat from the session's time
     * signatures, whose `bar` numbers need not put bar 1 at tick 0 (fact 91).
     */
    locationAt(sessionPath: string, tick: number): Record<string, unknown>;
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
    midiEdit(clipPath: string, operation: 'added' | 'changed' | 'deleted', rows: MockMidiRow[]): void;
    /**
     * Drive a render to a terminal state, the way LUNA's engine would (fact 44). With
     * `percent` only, it reports progress without finishing.
     *
     * @example
     * engine.finishRender(uid, { percent: 50 });
     * engine.finishRender(uid, { state: 'completed' });
     */
    finishRender(uid: string, options?: {
        percent?: number;
        state?: 'completed' | 'aborted' | 'failed';
        error?: string;
        remove?: boolean;
    }): void;
    /** Read a property directly (no port involved). */
    value(nodePath: string, property: string): unknown;
    has(path: string): boolean;
    children(nodePath: string): string[];
    /**
     * Replace the handler of the command at `path` (for example
     * `/sessions/abc/set_marker`), to reproduce a verb that answers without acting (fact 71).
     *
     * @example
     * engine.overrideCommand('/sessions/abc/delete_clip', () => null);
     */
    overrideCommand(path: string, handler: CommandHandler): void;
    /** Make the next `times` requests on `path` fail with `code`. */
    fail(path: string, code: string, times?: number): void;
    /**
     * Convenience: a session shaped like LUNA's, with a transport, a master bus, named tracks
     * (each with `outputs/main/controls/{gain,pan,mute}`, `controls/solo`, a meter and one
     * playlist), and the session-level commands the SDK uses.
     */
    addSession(uid: string, options?: {
        tracks?: string[];
        name?: string;
        focused?: boolean;
        packageUid?: string;
    }): void;
    /** Add a track with the standard control layout and one playlist. */
    addTrack(sessionUid: string, id: string, options?: {
        name?: string;
        trackType?: string;
        stemFormat?: string;
    }): void;
    /**
     * Add a source audio file to a session package's workspace folder. With `analysis`, it also
     * carries a fine and a coarse overview, sized from its length the way LUNA's is: one fine
     * pair per 125 samples at 48 kHz, one coarse pair per twelve fine (fact 72).
     */
    addSource(packageUid: string, uid: string, options?: {
        name?: string;
        stemFormat?: string;
        lengthNs?: number;
        sampleRate?: number;
        analysis?: boolean;
    }): void;
    /**
     * Add a hardware device with `inputs` named inputs, the shape `luna.audioInputs()` reads
     * (fact 76).
     *
     * @example
     * engine.addDevice('Apollo', { inputs: ['In 1', 'In 2'] });
     */
    addDevice(id: string, options?: {
        inputs?: string[];
        stemFormat?: string;
        online?: boolean;
    }): void;
    /**
     * Finish a record pass the way LUNA does: punch in, then on the caller's stop drop a
     * finalized take clip on the track's active playlist with a source to match (fact 75).
     *
     * @example
     * engine.onRecord(({ sessionUid, trackUid }) => engine.finishTake(sessionUid, trackUid, { startTick: 0, stopTick: Luna.WHOLE_NOTE }));
     */
    finishTake(sessionUid: string, trackUid: string, options?: {
        startTick?: number;
        stopTick?: number;
        name?: string;
    }): string;
    /**
     * Add a bus. `busType` is `aux`, `master` or `cue_0`..`cue_3`; cue buses have only a main
     * output (fact 83). Orders after everything already in the session.
     */
    addBus(sessionUid: string, id: string, options?: {
        name?: string;
        busType?: string;
        stemFormat?: string;
        color?: number;
    }): void;
    /** LUNA routes a new channel's cue outputs to CUE 1-4 (fact 83). */
    private routeCues;
    /**
     * The standard strip: `controls/solo`, a main output, and (unless `slots` is false) eight
     * sends and four cue outputs. Pan is `pan` on a mono channel and `pan_left`/`pan_right` on
     * a stereo one, on the main output and on every send alike (fact 84).
     */
    private addChannel;
    /** Resolves once every queued push has been delivered. */
    settled(): Promise<void>;
    private execute;
    private get;
    /**
     * A bounded page of overview pairs, generated rather than stored: `count` int16 min/max
     * pairs per channel, clamped to what the analysis holds. A request past the end answers an
     * empty page, as LUNA's does.
     */
    private overviewPage;
    private describe;
    private set;
    /**
     * Model LUNA's record pass (fact 75): arming the session rolls the transport and punches in
     * once any count-in is over; disarming finalizes a take on every armed track, but only when
     * the punch point lay inside the loop marks — outside them LUNA rolls and captures nothing.
     */
    private runRecord;
    private post;
    private push;
}
/** One client connection to a {@link MockEngine}. */
declare class MockPort implements Port {
    private readonly engine;
    private status;
    private readonly subscriptions;
    private readonly statusListeners;
    get connected(): boolean;
    get(path: string, options?: GetOptions): Promise<unknown>;
    set(path: string, data: unknown): Promise<void>;
    post(path: string, data?: unknown): Promise<unknown>;
    subscribe(path: string, handler: EventHandler, _options?: SubscribeOptions): Unsubscribe;
    onStatus(listener: StatusListener): Unsubscribe;
    close(): Promise<void>;
    /**
     * Simulate a drop and recovery; subscriptions survive as they do on the real port.
     * Anything `during` does happens while the port is down, so its pushes are missed.
     */
    reconnect(during?: () => void | Promise<void>): Promise<void>;
    private request;
    private setStatus;
}

/**
 * Multi-update expansion.
 *
 * The engine batches pushes into one message with `path: "multi"`. Two encodings exist
 * (`hbsystem/networking/docs/advanced.md`):
 *
 * - plain: `data` is an array of ordinary messages;
 * - packed: `data` is `{ data, path, name, parent, string, added?, removed? }`, a string table plus
 *   parent links, used whenever the client has not asked for pretty JSON.
 *
 * Packed decoding matches uanet-core `message-expansion.js`: path id `i` names
 * `'/' + string[name[i]]`, its parent is `parent[i]`, and the root is the id whose parent is itself.
 */

/**
 * Expand a message into the individual updates it carries. A non-multi message expands to
 * itself. Entries that cannot be decoded are dropped.
 *
 * @example
 * expandMulti({ path: 'multi', data: [{ path: '/a/x/value', data: 1 }, { path: '/a/y/value', data: 2 }] })
 * // [{ path: '/a/x/value', data: 1 }, { path: '/a/y/value', data: 2 }]
 */
declare function expandMulti(message: WireMessage): WireMessage[];

/**
 * Request encoding and reply decoding for the WebSocket transport.
 *
 * Requests are the text form `<verb> <path>[?params][ <payload>]`. Replies are JSON objects.
 * This is what LUNA's own GUI (uanet-core `TextMessageFormat`) and the shipping LUNA SDK send,
 * so it is the proven framing; the length-prefixed `JSON` dialect from
 * `hbsystem/networking/docs/wire-format.md` is not used over WebSocket (EVIDENCE fact 3).
 */

/** Append query parameters to a path that may already carry some. */
declare function appendParams(path: string, params: Record<string, string> | undefined): string;
/**
 * A number that must reach the engine as a JSON float literal. Some fields are parsed by
 * token type: a breakpoint `value` written as `-6` is stored as 0, while `-6.0` is stored as
 * -6 (fact 79). `JSON.stringify` writes every whole number without a fraction, so wrap the
 * value and the codec writes `-6.0`.
 *
 * @example
 * await luna.raw.post(`${session.path}/insert_bp`, { session_uid, control_uid, values: [{ location: 0, value: Luna.float(-6) }] });
 */
declare class FloatLiteral {
    readonly value: number;
    constructor(value: number);
    /** The literal as it goes on the wire: always with a fraction or an exponent. */
    toLiteral(): string;
    toJSON(): number;
}
/** Wrap `value` so it is sent as a float literal. See {@link FloatLiteral}. */
declare function float(value: number | FloatLiteral): FloatLiteral;
/**
 * Encode a payload the way the engine parses it: JSON for everything. Strings are quoted so the
 * engine can tell `"1234"` from `1234` (the ambiguity the deprecated String dialect suffers from).
 * {@link FloatLiteral}s are written as float literals.
 */
declare function encodePayload(data: unknown): string;
/**
 * Build one request line.
 *
 * @example
 * encodeRequest('get', '/sessions', { flatvalue: '1', ua_id: 'r1' })
 * // 'get /sessions?flatvalue=1&ua_id=r1'
 * encodeRequest('post', '/sessions/abc/new_track', undefined, { name: 'Vocal' })
 * // 'post /sessions/abc/new_track {"name":"Vocal"}'
 */
declare function encodeRequest(verb: Verb, path: string, params?: Record<string, string>, data?: unknown): string;
/**
 * Decode one frame. Tolerates an 8-byte `JSON` header (magic + length) and a trailing NUL, and
 * returns `undefined` for anything unparseable so the receive loop survives a bad frame.
 */
declare function decodeMessage(text: string): WireMessage | undefined;
/** The correlation id the engine echoed back, if this message answers one of our requests. */
declare function correlationId(message: WireMessage, key: string): string | undefined;

export { type CommandHandler, ConnectionLost, DEFAULT_LUNA_PORT, Disposed, type Event, type EventHandler, FloatLiteral, type GetOptions, type LogFn, type LogLevel, MockEngine, type MockMidiRow, type MockNodeSpec, MockPort, NoSessionOpen, NotRunning, type Operation, type Port, type PortStatus, RequestTimeout, type SocketConstructor, type SocketLike, type StatusListener, type SubscribeOptions, UAError, type Unsubscribe, Unsupported, type Verb, WebSocketPort, type WebSocketPortOptions, type WireMessage, appendParams, consoleLog, correlationId, decodeMessage, encodePayload, encodeRequest, eventMatches, expandMulti, float, getOptionsToParams, joinPath, propertyValue, splitPath, stripValueSuffix, toEvent };
