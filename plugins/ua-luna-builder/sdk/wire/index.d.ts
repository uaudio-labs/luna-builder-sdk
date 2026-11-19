/**
 * The transport seam. A Port speaks UANet verbs on paths and holds no model state.
 *
 * {@link WebSocketPort} talks to native LUNA and {@link MockPort} to an in-memory engine (tests).
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
/** No engine answered at the address. Start LUNA and open a session. */
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
/** The feature is not available on this engine (for example a headless engine has no `/gui`). */
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
     * attempt fails, or has not opened within `requestTimeoutMs`; later drops are handled by
     * reconnect instead.
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
    /** A SysEx row's whole message, `0xf0` through `0xf7`, with `status` `0xf0`; `null` on other rows (fact 139). */
    sysex?: number[] | null;
}
/** One live MIDI message the mock delivered, in {@link MockEngine.midiSent}. */
interface MockMidiSent {
    sessionUid?: string;
    trackUid?: string;
    midiInputSource?: string;
    /** Sent out of this MIDI output port (a `midi_input_source` naming an output port's uid, fact 124). */
    outputPortUid?: string;
    /** `send_midi_all_notes_off`, recorded as CC 123. */
    allNotesOff?: true;
    /** `[0xf0, 0, 0]` for a SysEx, whose message is in {@link sysex}. */
    bytes: [number, number, number];
    /** A SysEx's whole message (fact 140). */
    sysex?: number[];
    /** Also handed to LUNA's record input. */
    recordEnabled: boolean;
}
interface MockEngineOptions {
    /**
     * Include LUNA's `/gui` (dialogs, pages, Add Ons). Default `true`, as inside LUNA; `false`
     * models a headless engine, where `luna.gui.available()` is false (fact 103).
     */
    gui?: boolean;
    /**
     * Publish `full_start`/`full_stop` and the `fade_in_*`/`fade_out_*` properties on compiled
     * clips. Default `true`; `false` models a LUNA from before they were added (fact 116).
     */
    compiledClipFades?: boolean;
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
    /** Live MIDI LUNA delivered through `/sessions/send_midi` and `send_midi_all_notes_off`, oldest first. */
    readonly midiSent: MockMidiSent[];
    private readonly compiledClipFades;
    /** Per playlist path: published compiled-clip node names by start tick, and the next name. */
    private readonly compiled;
    constructor(options?: MockEngineOptions);
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
    openAddOnInstance(addOnId: string, options?: {
        instanceId?: string;
        target?: string;
        width?: number;
        height?: number;
    }): string;
    /** Close a page opened with {@link openAddOnInstance}. */
    closeAddOnInstance(addOnId: string, instanceId: string): void;
    private resizeAddOnInstance;
    /** What the next mock file dialog "selects"; empty means the user cancelled. */
    nextDialogFiles: string[];
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
    mediaFiles: Record<string, true | null | string>;
    /** Every file `/gui/serve_media_file` served, in order, by lowercase Add On id. */
    mediaServed: {
        addOnId: string;
        path: string;
    }[];
    /**
     * The showcase `/gui/install_add_on` installs from: each package id to the ids of the
     * Add Ons in it, all lowercase.
     *
     * @example
     * engine.showcase['uaudio-labs.midi-notation'] = ['com.uaudio.midi-notation', 'com.uaudio.score-view'];
     */
    showcase: Record<string, string[]>;
    /** Package ids `/gui/install_add_on` treats as already installing. */
    installingPackages: string[];
    /**
     * Package ids in {@link showcase} that were imported from a link, which
     * `/gui/remove_add_on` removes (from here and from `showcase`); any other
     * package is the showcase's own and is refused.
     */
    importedPackages: string[];
    /**
     * Every install `/gui/install_add_on` started, in order: `{ id }` with the package id, or
     * `{ url }` with what LUNA fetches: a repo's URL (`https://github.com/<owner>/<repo>`), or
     * a Drive file's direct download
     * (`https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t`), or
     * an iCloud Drive share as `https://www.icloud.com/iclouddrive/<id>`, which LUNA resolves,
     * or a Dropbox file's download (`https://www.dropbox.com/scl/fi/<id>/<name>?rlkey=<key>&dl=1`).
     */
    addOnInstalls: ({
        id: string;
    } | {
        url: string;
    })[];
    /** Add On ids (lowercase) under `/gui/add_ons` that are built into LUNA, which `/gui/uninstall_add_on` refuses. */
    builtInAddOns: string[];
    /** How the user answers LUNA's prompt for `/gui/uninstall_add_on`: `'remove'` (the default) takes the Add On out of `/gui/add_ons`, `'cancel'` leaves it. */
    uninstallAnswer: 'remove' | 'cancel';
    /** Every Add On id (lowercase) `/gui/uninstall_add_on` asked the user about, in order, whatever the answer. */
    addOnUninstalls: string[];
    /**
     * The disk `/gui/list_files` reads: each folder's absolute path to the names inside it,
     * a trailing `/` marking a subfolder. A name starting with `.` is hidden, as in LUNA.
     *
     * @example
     * engine.folders['/Samples'] = ['kick.wav', 'Loops/', '.DS_Store'];
     */
    folders: Record<string, string[]>;
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
    get grantedFolders(): string[];
    set grantedFolders(folders: string[]);
    private blessed;
    /** Let `/gui/list_files` read the folder at `path` and the folders inside it. */
    grantFolder(path: string): void;
    /** How the user answers LUNA's prompt for `/gui/add_blessed_folder` and for folders picked in `show_folder_dialog`: `'allow'` (the default) blesses them, `'dont_allow'` leaves them out. */
    blessAnswer: 'allow' | 'dont_allow';
    /** Every folder LUNA asked the user about (`/gui/add_blessed_folder`, `show_folder_dialog`), in order, whatever the answer. */
    blessRequests: string[];
    /** Entries a recursive `/gui/list_files` returns before it sets `truncated` (LUNA: 10,000). */
    listLimit: number;
    private rowCounter;
    controlPathByUid(uid: string): string | undefined;
    /**
     * Add a plugin to the catalog. `effectType` is the manifest's (comma separated, `effect`
     * when absent); `formats` the `[input, output]` stem formats it runs in (any when absent);
     * `version` its installed version (`1.0.0` when absent).
     */
    addPlugin(pluginId: string, options?: {
        name?: string;
        manufacturer?: string;
        categories?: string[];
        effectType?: string;
        formats?: [string, string][];
        favorite?: boolean;
        version?: string;
    }): void;
    /** `/plugins/query` (fact 127), with LUNA's slot rules. Categories pass through untranslated. */
    queryPlugins(data: unknown): {
        plugins: Record<string, unknown>[];
    };
    /**
     * Add a preset for a plugin to the library (fact 98), with any `tags` (fact 120). Returns
     * its uid.
     */
    addPreset(pluginId: string, name: string, options?: {
        uid?: string;
        factory?: boolean;
        favorite?: boolean;
        version?: number;
        tags?: string[];
    }): string;
    /**
     * `/presets/query` (facts 98, 120, 132). A plugin's presets, or a device type's; with
     * `device_type_id: "track"` and `include_instrument_presets`, also every installed instrument
     * plugin's presets, with `Instrument` dropped from the tags they must match and added to the
     * tags they report, and an `is_instrument_preset` column.
     */
    queryPresets(data: unknown): {
        results: Record<string, unknown>;
        folders: unknown[];
    };
    /**
     * Add a track preset to the library (fact 132). Like LUNA when it saves one, it is tagged
     * with its category (`Audio`, `Instrument`, `Bus`, or `Multi-Track` for more than one
     * track) besides any `tags`. `new_track` with it makes one track of `trackType` named after
     * it, or, with `trackNames`, a track per name, named as the preset saved them. Returns its uid.
     */
    addTrackPreset(name: string, options?: {
        uid?: string;
        trackType?: 'audio' | 'instrument' | 'bus';
        trackNames?: string[];
        factory?: boolean;
        favorite?: boolean;
        tags?: string[];
    }): string;
    /** Add a group of track preset tags, as {@link addPresetTagGroup} does for a plugin. */
    addTrackPresetTagGroup(name: string, tags: string[], options?: {
        category?: string;
    }): string;
    /**
     * `post /presets/devices/track/load` (fact 132): a track preset or an instrument plugin's
     * preset onto a track. The track records the preset and takes its name unless its
     * `name_modified` is true; a name set through `set` does not make it so.
     */
    loadTrackPreset(data: unknown): null;
    /**
     * Add a group of preset tags for a plugin, as LUNA keeps them: a sub-category named `name`
     * under the category `category` (default `Default`) holding the tags (fact 120). Returns
     * the sub-category uid.
     */
    addPresetTagGroup(pluginId: string, name: string, tags: string[], options?: {
        category?: string;
    }): string;
    private addTagGroupAt;
    /** Connect or disconnect UA Assistant, which preset recommendations need (fact 121). */
    setAssistantEnabled(enabled: boolean): void;
    /**
     * Script what UA Assistant recommends for a plugin. Without one the mock ranks the plugin's
     * presets by how many words of the query appear in their name or tags.
     */
    setPresetRecommendations(pluginId: string, recommend: (query: string) => {
        preset_name: string;
        preset_uuid: string;
        rrf_score: number;
    }[]): void;
    /**
     * `/presets/plugins/<id>` with its `load` command: put a preset's identity on the effect
     * whose `uid` is given (fact 122).
     */
    private ensurePresetPlugin;
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
     * signatures, whose `bar` numbers need not put bar 1 at tick 0 (fact 91), and `min_sec`
     * from the tempo map (fact 96).
     */
    locationAt(sessionPath: string, tick: number): Record<string, unknown>;
    /**
     * What a playlist plays (fact 116): every clip cut at every clip edge, each piece given to
     * the highest layer (then the narrower clip, then the larger uid), neighbouring pieces of one
     * clip joined. Time order.
     */
    private segmentsOf;
    /**
     * One segment's fades as LUNA compiles them (fact 117): a crossfade with the segment it
     * adjoins, measured from the edit between them, whether the clips are butted or overlap;
     * otherwise the clip's plain fade-in on its first segment and fade-out on its last.
     */
    private segmentFades;
    /** A clip node or one of its properties changed: recompile its playlist if a client enabled that. */
    private clipChanged;
    /**
     * Publish a playlist's compiled clips the way deviced's clip compiler and
     * `Sesn_CompiledClips` do (fact 116): cut every clip at every clip edge, give each piece to
     * the highest layer (then the narrower clip, then the larger uid), join neighbouring pieces
     * of one clip, and cut each segment's source range out through the tempo map. Nodes are
     * named by a running counter and updated in place while their start stays put. The mock
     * keeps no fades, so they publish as null and the full range equals the segment.
     */
    private compilePlaylist;
    private fadeCounter;
    /** A clip's stored fade rows (`<clip>/fades/<uid>`), offsets relative to the clip edge. */
    private fadeRows;
    /** Create or update a fade row the way `set_fade` does: shape only for a new one (fact 117). */
    private putFade;
    /** The tick `seconds` after `tick` through the tempo map. */
    private tickAfter;
    /** Seconds at `tick`, integrating the session's tempo map (constant tempo between events). */
    private secondsAt;
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
    /** Names of a node's properties. */
    propertyNames(nodePath: string): string[];
    private readonly recommenders;
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
     * Add a MIDI device under LUNA's device (`/devices/<LUNA_DEVICE_UID>/midi`, fact 123). The
     * first call also adds LUNA's device, the `midi` folder, and the `All` and `None` entries
     * LUNA lists beside the real devices, each with an input port only. The device gets an input
     * and an output port unless `input` or `output` is false. Returns the device's uid.
     *
     * @example
     * engine.addMidiDevice('Volt 876');
     * engine.addMidiDevice('IAC Driver Bus 1', { uid: 'iac1' });
     */
    addMidiDevice(name: string, options?: {
        uid?: string;
        deviceType?: string;
        input?: boolean;
        output?: boolean;
    }): string;
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
    receiveMidi(device: string, messages: ReadonlyArray<readonly [number, number, number] | readonly number[]>, options?: {
        timeMs?: number;
        stepMs?: number;
    }): number;
    /** True when `uid` is a mock MIDI device's output port uid. */
    isMidiOutputPortUid(uid: string): boolean;
    private addMidiDeviceNode;
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
     * Add an empty MIDI clip to a track's current playlist, the way LUNA makes one for notes
     * drawn in place. `midiSourceStart` is the table tick at the clip's start (fact 41): 0 by
     * default. `insert_clip` cannot make one: it needs a source (fact 112). Returns the clip uid.
     *
     * @example
     * const clipUid = engine.addMidiClip('abc', 'Keys', { startTick: 0, stopTick: Luna.WHOLE_NOTE });
     */
    addMidiClip(sessionUid: string, trackUid: string, options?: {
        startTick?: number;
        stopTick?: number;
        name?: string;
        midiSourceStart?: number;
    }): string;
    /**
     * Put a chord on a session's Chord ruler, as a user typing one in LUNA would: it replaces
     * any chord at `tick`, and `♭`/`♯` are stored as `b`/`#` (fact 100). Returns the rowid.
     *
     * @example engine.addChord('abc', 0, 'Am7');
     */
    addChord(sessionUid: string, tick: number, name: string): number;
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
    /** `ids` in the order given, each folder followed by everything inside it in current order. */
    private withSubtrees;
    /** The current order without `moved`, with `moved` put back after `anchor` (null: the front). */
    private spliceAfter;
    private folderChildren;
    /** LUNA routes a new channel's cue outputs to CUE 1-4 (fact 83). */
    private routeCues;
    /**
     * The standard strip: `controls/solo`, a main output, and (unless `slots` is false) eight
     * sends and four cue outputs. Pan is `pan` on a mono channel and `pan_left`/`pan_right` on
     * a stereo one, on the main output and on every send alike (fact 84).
     */
    private addChannel;
    /**
     * A small ready-made engine: one focused session, `Demo`, with four audio tracks. What a
     * page gets from `?engine=mock` when it defines no `LunaMockSetup`.
     *
     * @example
     * const engine = Luna.MockEngine.demo();
     * const luna = await Luna.connect({ port_: engine.port() });
     */
    static demo(options?: MockEngineOptions): MockEngine;
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
    /**
     * A plugin parameter's `real_value` wants a float literal (fact 142): a bare whole number is
     * refused with `uasrv.invalid_value`. (LUNA ignores one sent to `value`; the mock cannot
     * address a control's `value` property, which it reads as the `/value` suffix.) The mock sees
     * payload objects, so a `FloatLiteral` stands for the literal and a plain integer for the bare
     * token. Throws for a write to refuse.
     */
    private ignoresBareWhole;
    private set;
    /**
     * A client write to one view of a control (fact 97): re-derive the other three and push
     * them to every port — the writer too, since they are derived (fact 6); only the written
     * view itself is withheld from the writer. A switch snaps to a step of its
     * `real_values`/`string_values`; a continuous control goes through the mock's stand-in
     * fader taper (see {@link faderTaper}); a plugin `parameter`'s `value` tracks its
     * normalized view, since plugin units are plugin-specific (fact 85).
     */
    private writeControl;
    /**
     * Model LUNA's record pass (fact 75): arming the session rolls the transport and punches in
     * once any count-in is over; disarming finalizes a take on every armed track, but only when
     * the punch point lay inside the loop marks — outside them LUNA rolls and captures nothing.
     */
    private runRecord;
    /**
     * Publish a take in progress the way LUNA does while punched in (fact 149):
     * `record/clips/<track>/<take>` with a `stop` that grows, and on an audio track the file being
     * written under `record/audio/<source>` with an overview that grows with it; a MIDI-capable
     * track's take gets a `midi` folder instead.
     */
    private startRecordTake;
    /**
     * Move every take in progress in a session on to `stopTick`, as LUNA does while recording:
     * `stop` and `length` grow, and an audio take's `source_stop`, file length and overview grow
     * with them (fact 149). The mock runs at 120 BPM: a beat is 0.5 s.
     *
     * @example
     * await session.transport.recordEnabled.set(true);
     * engine.recordProgress('abc', Luna.WHOLE_NOTE);
     */
    recordProgress(sessionUid: string, stopTick: number): void;
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
    recordMidi(sessionUid: string, trackUid: string, events: readonly {
        tick: number;
        status: number;
        data1: number;
        data2?: number;
    }[]): number[];
    private recordRowId;
    private post;
    private push;
}
/** One client connection to a {@link MockEngine}. */
declare class MockPort implements Port {
    /** The engine this port talks to, for driving it from a page that connected with `engine: 'mock'`. */
    readonly engine: MockEngine;
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

export { type CommandHandler, ConnectionLost, DEFAULT_LUNA_PORT, Disposed, type Event, type EventHandler, FloatLiteral, type GetOptions, type LogFn, type LogLevel, MockEngine, type MockEngineOptions, type MockMidiRow, type MockMidiSent, type MockNodeSpec, MockPort, NoSessionOpen, NotRunning, type Operation, type Port, type PortStatus, RequestTimeout, type SocketConstructor, type SocketLike, type StatusListener, type SubscribeOptions, UAError, type Unsubscribe, Unsupported, type Verb, WebSocketPort, type WebSocketPortOptions, type WireMessage, appendParams, consoleLog, correlationId, decodeMessage, encodePayload, encodeRequest, eventMatches, expandMulti, float, getOptionsToParams, joinPath, propertyValue, splitPath, stripValueSuffix, toEvent };
