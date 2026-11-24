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
interface Event$1 {
    path: string;
    data: unknown;
    operation?: Operation;
}
type EventHandler = (event: Event$1) => void;
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
    /**
     * Write a property. Resolves when the engine acknowledges. `params` are request parameters
     * sent beside the write as query parameters, for a write the engine qualifies by them
     * (`name_modified=true` on a track rename, fact 165); most writes have none.
     */
    set(path: string, data: unknown, params?: Record<string, string>): Promise<void>;
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
declare function toEvent(message: WireMessage): Event$1;
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
    set(path: string, data: unknown, params?: Record<string, string>): Promise<void>;
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
/** How {@link MockEngine.startJob} ends the next job; see {@link MockEngine.planNextJob}. */
interface MockJobPlan {
    outcome?: 'completed' | 'empty' | 'failed' | 'instant' | undefined;
    /** The `job.*` error a `failed` job reports. Default `job.internal`. */
    error?: string;
    /** Keep the job running until `engine.finishJob(uid)` or a cancel. */
    hold?: boolean;
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
    /**
     * Publish LUNA's Auto Gain service at `/auto_gain`. Default `true`; `false` models a LUNA
     * whose Auto Gain feature is off, where the node does not exist (fact 191).
     */
    autoGain?: boolean;
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
     * Each installed Add On's install token, by lowercase id: 32 lowercase hex digits that LUNA
     * gives an install (fact 114) and that end its page host (`<id>_t<token>`). The mock makes
     * one up the first time an id needs it; set one to pin it.
     *
     * @example
     * engine.installTokens['com.example.demo'] = '0123456789abcdef0123456789abcdef';
     */
    installTokens: Record<string, string>;
    /**
     * The install token of the Add On `id` (lowercase), made up on first use.
     *
     * @example
     * const host = `com.example.demo_t${engine.installToken('com.example.demo')}`;
     */
    installToken(id: string): string;
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
        sdkType?: string;
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
        description?: string;
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
        description?: string;
        plugins?: {
            plugin_id: string;
            name: string;
        }[];
    }): string;
    /** Add a group of track preset tags, as {@link addPresetTagGroup} does for a plugin. */
    addTrackPresetTagGroup(name: string, tags: string[], options?: {
        category?: string;
    }): string;
    private static readonly SLOT_STATE;
    private slotState;
    private applySlotState;
    private clearSlot;
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
    addAnalysis(packageUid: string, sourceUid: string, kind: string, payload: Record<string, unknown>, options?: {
        count?: number;
        md5?: string | null;
        sourcePath?: string;
    }): void;
    /** A `file/data` read of a non-overview analysis: LUNA answers nothing without a count (fact 205). */
    private analysisPage;
    /**
     * How the next job the mock starts ends (facts 200-202): `completed` (default), `empty`
     * (LUNA's `failed` with `job.no_result`), `failed` with `error`, or `instant`, where the job
     * is added, finished and removed in one turn, as LUNA's cached-analysis path can (fact 202).
     * `hold` keeps it running until {@link finishJob} or a cancel.
     *
     * @example
     * engine.planNextJob({ outcome: 'failed', error: 'job.provider_unavailable' });
     */
    planNextJob(plan: MockJobPlan): void;
    /**
     * Start a job under `/jobs/<uid>` as deviced's Job_Service does (fact 200): the node appears
     * (status `queued`) a turn after the command answers, runs and reports progress a turn at a
     * time, then publishes its error and terminal status and is removed in the same turn.
     * `work` runs just before it ends and answers whether anything was found. Returns the uid.
     *
     * @example
     * const uid = engine.startJob({ sessionUid: 'abc', jobType: 'chord_extraction' });
     */
    startJob(spec: {
        sessionUid: string;
        jobType: string;
        targetUid?: string;
        work?: () => boolean;
    }): string;
    /** End a job started under a `hold` plan (see {@link planNextJob}). */
    finishJob(uid: string): void;
    private readonly jobPlans;
    private readonly jobFinishers;
    /**
     * `extract_chords` and `extract_lyrics` on the session's main context (facts 203, 204): a
     * clip, or the context's selected playlists; the job targets the clip's track. What they
     * find is the mock's stand-in, not a detector's: chords `C G Am F` a bar apart over the clip,
     * and one transcribed line per second of source.
     */
    private installExtractionCommands;
    /**
     * Add a lyric line to a session (fact 152): a ruler line at a tick, or with `sourceUid` a line
     * transcribed from that source, at nanoseconds into it. `words` is stored as LUNA sends it, a
     * JSON string. Answers the line's rowid.
     */
    addLyric(session: string, line: {
        location: number;
        text: string;
        length?: number;
        sourceUid?: string;
        words?: {
            word: string;
            offset: number;
            length: number;
        }[];
        rowid?: number;
    }): number;
    /**
     * Register a session package in the workspace. `template` makes it a session template
     * (`.lunatemplate`) that `new_session_from_template` copies, with `tracks` as the new
     * session's tracks; `online: false` is one whose file is missing. `sessionType` is the
     * row's `session_type` (`'default'`, `'standalone'`, ...), `directoryPath` its folder.
     */
    addPackage(uid: string, options?: {
        name?: string;
        lastOpened?: number;
        favorite?: boolean;
        factory?: boolean;
        template?: boolean;
        tracks?: string[];
        online?: boolean;
        directoryPath?: string;
        sessionType?: string;
    }): void;
    /**
     * Make `delete_unused_media` keep a file of a package for `reason` (`'undo'`, `'version'`,
     * `'backup'`, ...), as LUNA keeps one undo history or a saved version still uses (fact 240).
     *
     * @example engine.keepMedia('pkg_abc', 'src3', 'undo');
     */
    keepMedia(packageUid: string, uid: string, reason: string): void;
    /**
     * Publish whether `command` on `nodePath` is enabled, as LUNA does at
     * `<nodePath>/<command>/enabled` (fact 234), and push changes. Posting the command is not
     * affected: LUNA's own handlers decide what a disabled command does.
     */
    setCommandEnabled(nodePath: string, command: string, enabled: boolean): void;
    /**
     * Raise an error notice in `/errors` (fact 235), as LUNA's error service does: `group` is
     * stored as LUNA stores it, JSON text. Answers its uid.
     */
    addErrorNotice(notice: {
        level?: string;
        code: string;
        title?: string;
        payload?: string;
        groups?: string[];
        uid?: string;
        timestamp?: number;
    }): string;
    /** Per template package, the tracks a session made from it starts with. */
    readonly templateTracks: Map<string, string[]>;
    /**
     * Preference contexts as LUNA keeps them on disk, one record per context (fact 232): a
     * context is loaded into `/preferences/<context>` only when `init_preference` names it.
     * Seed one to model values left by an earlier run.
     */
    readonly preferenceFiles: Map<string, Record<string, unknown>>;
    /** Packages whose file is missing: the query answers `file_online: false` for them. */
    readonly offlinePackages: Set<string>;
    /** Tags per session package, added with `/workspace/add_tag` or set here (fact 161). */
    readonly packageTags: Map<string, string[]>;
    /** MIDI and video files `import_file` copied into packages (fact 163). */
    readonly importedFiles: {
        pkg: string;
        uid: string;
        type: 'midi' | 'video';
        name: string;
        path: string;
    }[];
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
     * `/sessions/abc/set_marker`), to reproduce a verb that answers without acting (fact 71),
     * or add a command the mock does not model to a node it has.
     *
     * @example
     * engine.overrideCommand('/sessions/abc/delete_clip', () => null);
     * engine.overrideCommand('/workspace/some_new_command', (data) => ({ ok: true }));
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
    /** The `/gui` progress suppression handles held, uid (no dashes) to owner (fact 223). */
    get progressSuppressions(): ReadonlyMap<string, string>;
    /** An embedded LUNA page (`dashboard`, `luna_play`, ...) reloading: drops its and every legacy suppression (fact 224). */
    resetWebClient(owner: string): void;
    /**
     * Add a source audio file to a session package's workspace folder. With `analysis`, it also
     * carries a fine and a coarse overview, sized from its length the way LUNA's is: one fine
     * pair per 125 samples at 48 kHz, one coarse pair per twelve fine (fact 72).
     */
    addSource(packageUid: string, uid: string, options?: {
        name?: string;
        unnamed?: boolean;
        stemFormat?: string;
        lengthNs?: number;
        sampleRate?: number;
        analysis?: boolean;
        origin?: number;
        format?: string;
    }): void;
    /**
     * Add a hardware device with `inputs` named inputs (uids `in_1`, `in_2`, ...) and `outputs`
     * named outputs (`out_1`, ...), with the properties LUNA's input and output nodes publish
     * (facts 76, 185, 189). Each input carries the four live analyses, off (fact 186). With
     * `autoGain`, tracks routed to its inputs report `supports_auto_gain` (fact 194).
     *
     * @example
     * engine.addDevice('Apollo', { inputs: ['In 1', 'In 2'], outputs: ['Monitor'], autoGain: true });
     */
    addDevice(id: string, options?: {
        inputs?: string[];
        outputs?: string[];
        stemFormat?: string;
        online?: boolean;
        autoGain?: boolean;
        ioType?: string;
    }): void;
    /**
     * Plug an input into a device that exists (hotplug): LUNA pushes it as `added` (fact 185).
     * Unplug one with `removeNode`.
     *
     * @example
     * engine.addDeviceInput('Apollo', 'Hi-Z', { uid: 'hiz' });
     */
    addDeviceInput(deviceId: string, name: string, options?: {
        uid?: string;
        stemFormat?: string;
        channel?: number;
        ioType?: string;
    }): string;
    /**
     * Publish analysis results on a device input, as LUNA does when a result is due (fact 187).
     * A result for an analysis that is off is dropped, as LUNA has nothing running to produce it;
     * returns whether anything was published. A signal-level peak also reaches any Auto Gain
     * channel listening to a track on that input (fact 191).
     *
     * @example
     * engine.setInputAnalysis('Apollo', 'in_1', { signalLevelPeak: 0.5, tempo: 120 });
     */
    setInputAnalysis(deviceId: string, inputUid: string, results: {
        signalLevelPeak?: number;
        tempo?: number;
        instrument?: string | null;
        stereoDetect?: boolean;
    }): boolean;
    /**
     * Change the root's `active_audio_engine` (fact 190), as LUNA does when the driver or the
     * audio setting changes.
     *
     * @example
     * engine.setActiveAudioEngine({ enabled: false, audio_engine_type: '', devices: [] });
     */
    setActiveAudioEngine(info: {
        enabled: boolean;
        audio_engine_type: string;
        devices: unknown[];
        outputs?: unknown[];
    }): void;
    /** Devices whose inputs support Auto Gain (`addDevice({ autoGain })`). */
    private readonly autoGainDevices;
    /** True when a track in any session is routed to the input `uid` (fact 185). */
    private inputUsed;
    /** The device input path a track is routed to, if it names one. */
    private inputOfChannel;
    /** After a routing change: every input's `in_use`, and the track's `supports_auto_gain` (facts 185, 194). */
    private routingChanged;
    /** An analysis switch moved: LUNA republishes the result at its no-result value (facts 186-187). */
    private analysisSwitched;
    /** LUNA itself moving an input's signal-level switch (Auto Gain, fact 188): pushed to every client. */
    private switchSignalLevel;
    /** `/auto_gain`, its `channels` and its commands (facts 191-193). */
    private addAutoGainService;
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
    set(path: string, data: unknown, params?: Record<string, string>): Promise<void>;
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
 * Lifecycle states reported by the engine.
 *
 * @hidden
 */
type WasmState = 'loading' | 'booting' | 'running' | 'stopping' | 'stopped' | 'error';
/**
 * The subset of the Emscripten module the SDK uses.
 *
 * @hidden
 */
interface WasmModule {
    ccall(name: string, returnType: string | null, argTypes: string[], args: unknown[]): unknown;
    UAPersist?: {
        status(): {
            mode: string;
            [k: string]: unknown;
        };
        list?(): Promise<unknown>;
        erase?(): Promise<void>;
    };
}
/**
 * The page-side hooks the engine calls (`globalThis.WasmDeviced`).
 *
 * @hidden
 */
interface WasmHooks {
    onReply(id: number, error: string, json: string): void;
    onUpdate(path: string, json: string): void;
    onState(state: string, detail: string): void;
}
type ModuleFactory = (options: Record<string, unknown>) => Promise<WasmModule>;
interface BootOptions {
    /** Directory URL holding `luna-engine.js` and `luna-engine.wasm`. Default `/__engine/`. */
    engineUrl?: string;
    /** Persist the workspace to OPFS between page loads. Default true. */
    persist?: boolean;
    /** Ask the server for a DWARF-stripped `.wasm` (`?strip=1`, honoured by the engine's own serve scripts). */
    strip?: boolean;
    /** Engine stdout/stderr. Default: `console.debug` / `console.warn`. */
    log?: (line: string, level: 'out' | 'err') => void;
    /** Boot timeout. Default 120 000 ms (the unstripped module is large). */
    timeoutMs?: number;
    /** Resume audio on the page's clicks and key presses. Default true. */
    resumeOnGesture?: boolean;
    /**
     * Ask for the microphone when a track or the session is record-armed, inside the click that
     * armed it (or the next one). Default true. False leaves it to `requestAudioInput()`.
     */
    audioInputOnRecord?: boolean;
    /** Listen for gestures on this target instead of `document` (tests). */
    gestureTarget_?: EventTarget;
    /** Already-loaded module factory (tests, or a page that loaded the script itself). */
    factory_?: ModuleFactory;
    /** Install hooks on this object instead of `globalThis.WasmDeviced` (tests). */
    hooksTarget_?: {
        WasmDeviced?: WasmHooks;
    };
}
/** Audio-path health as the engine reports it. */
interface AudioHealth {
    /** -1 no context yet, 0 suspended, 1 running, 2 closed, 3 interrupted. */
    contextState: number;
    /** Total AudioWorklet process() callbacks; increasing means the browser is pulling audio. */
    callbacks: number;
    underruns: number;
    /** Peak |sample| of the last output block. */
    peak: number;
    /** 0 not requested, 1 prompting, 2 connected, 3 denied, 4 unavailable. */
    inputState: number;
    inputPeak: number;
}
/**
 * A booted engine. Created by {@link bootWasmEngine}; the {@link WasmPort} talks through it.
 * One engine per page: shutdown is terminal, reload the page to boot again.
 *
 * @hidden
 */
declare class WasmEngine {
    readonly module: WasmModule;
    readonly engineUrl: string;
    private currentState;
    private readonly stateListeners;
    private replyHandler;
    private updateHandler;
    /** `Date.now()` of the last click or key press seen while running. */
    private lastGestureAt;
    /** A microphone was wanted with no gesture to ask inside; the next one asks. */
    private inputWanted;
    get state(): WasmState;
    get isRunning(): boolean;
    onState(listener: (state: WasmState, detail: string) => void): () => void;
    /**
     * Resume the AudioContext. Browsers only allow this after a user gesture, so call it from a
     * click handler; the loader already does on every click and key press. Resolves true once
     * the context runs, or false if it is not running within `timeoutMs` (the browser resumes
     * asynchronously, so the state lags the call).
     */
    resumeAudio(timeoutMs?: number): Promise<boolean>;
    /** Ask for microphone input (getUserMedia). Needs a secure context and a user gesture. */
    requestAudioInput(): boolean;
    private askForInput;
    private inputState;
    audio(): AudioHealth;
    /** OPFS persistence status, when the module was built with it. */
    persistStatus(): {
        mode: string;
        [k: string]: unknown;
    } | undefined;
    /** Stop the engine. Terminal: reload the page to boot again. */
    shutdown(): void;
}
/**
 * Load and boot the engine once per page. Resolves when the services report `running`.
 * Rejects with `Luna.Error` code `engine_boot` on failure or timeout.
 */
declare function bootWasmEngine(options?: BootOptions): Promise<WasmEngine>;

/**
 * {@link Port} over the in-page WebAssembly engine. Same paths, payloads and error codes as
 * native LUNA; a different transport. Measured against a real engine (EVIDENCE facts 35-38):
 *
 * - Out: `wasmd_send(method, pathWithQuery, bodyJson)` returns a request id.
 * - In: `WasmDeviced.onReply(id, error, json)` answers a request; `onUpdate(path, json)`
 *   carries pushes. A property push is `<node>/<prop>/value` with the value; a structural
 *   add is the node path with a `{ properties, ... }` object; a removal is the node path with
 *   `null`. A few boot-time announcements use a bare property path with a scalar.
 * - The engine does echo the writer's own `set` (unlike native LUNA); the Store dedupes.
 * - A missing path answers `{}`, as on native LUNA; engines before November 2026 answered
 *   error `uasrv.invalid_object` (fact 10).
 * - No reconnect: the engine boots once per page. `stopped`/`error` close the port.
 */

interface WasmPortOptions {
    requestTimeoutMs?: number;
    onUnhandled?: (event: Event$1) => void;
}
/** Turn one `onUpdate(path, json)` into a normalised event. Exported for tests. */
declare function wasmUpdateToEvent(path: string, json: string): Event$1;
declare class WasmPort implements Port {
    readonly engine: WasmEngine;
    private status;
    private readonly pending;
    private readonly subscriptions;
    private readonly statusListeners;
    private readonly requestTimeoutMs;
    private readonly onUnhandled;
    private stateUnsub;
    constructor(engine: WasmEngine, options?: WasmPortOptions);
    get connected(): boolean;
    /** Engine descriptor for logs. */
    get url(): string;
    get(path: string, options?: GetOptions): Promise<unknown>;
    set(path: string, data: unknown, params?: Record<string, string>): Promise<void>;
    post(path: string, data?: unknown): Promise<unknown>;
    subscribe(path: string, handler: EventHandler, options?: SubscribeOptions): Unsubscribe;
    onStatus(listener: StatusListener): Unsubscribe;
    /** Detach from the engine. The engine keeps running; use `engine.shutdown()` to stop it. */
    close(): Promise<void>;
    private request;
    private handleReply;
    private handleUpdate;
    private failPending;
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

/**
 * Framework-free reactive primitives. Every observable value in the SDK is a {@link Prop}:
 * read `value` synchronously, `onChange` to be told when it moved. Listeners take no arguments
 * and read `value` themselves, so one convention covers every property.
 *
 * Notifications are coalesced: many changes in one frame produce one call per listener.
 */

/** A readable, observable value. `value` is `undefined` until the first load or push. */
interface Prop<T> {
    readonly value: T | undefined;
    onChange(listener: () => void): Unsubscribe;
}
/** A {@link Prop} that can be written. `set` is optimistic: `value` moves at once and rolls back on rejection. */
interface WritableProp<T> extends Prop<T> {
    set(value: T): Promise<void>;
}
/** An observable ordered collection with id lookup. */
interface List<T> extends Prop<readonly T[]> {
    readonly items: readonly T[];
    byId(id: string): T | undefined;
}
/**
 * Coalesces change notifications. In a browser it flushes on the next animation frame with a
 * timer fallback (hidden tabs suspend rAF); elsewhere on a macrotask. Tests call `flush()`.
 */
declare class Scheduler {
    private readonly dirty;
    private scheduled;
    private rafHandle;
    private timerHandle;
    private waiters;
    /** Queue `notify` to run once at the next flush. */
    enqueue(notify: () => void): void;
    /** Run every queued notification now. */
    flush(): void;
    /** Resolves after the next flush (or immediately if nothing is queued). */
    settled(): Promise<void>;
}
/**
 * The concrete {@link Prop}: a value with a version stamp and listeners.
 * The version lets the Store decide whether an incoming value is newer than a pending write.
 */
declare class Cell<T> implements Prop<T> {
    private readonly scheduler;
    private current;
    private stamp;
    private readonly listeners;
    private readonly notify;
    constructor(scheduler: Scheduler, initial?: T);
    get value(): T | undefined;
    /** Version of the current value; 0 until first written. */
    get version(): number;
    /**
     * Write with a stamp. Returns true if the value changed. A write stamped older than the
     * current value is ignored, so a read that was answered late cannot undo a push or a
     * write that landed while it was in flight.
     */
    update(value: T, version?: number, equals?: (a: T | undefined, b: T) => boolean): boolean;
    onChange(listener: () => void): Unsubscribe;
}
/** Equality used by cells: `===` for primitives, JSON shape for plain objects and arrays. */
declare function shallowEquals(a: unknown, b: unknown): boolean;
/**
 * A read-only {@link Prop} computed from other props. Recomputes lazily on read and notifies
 * when any source notifies. With `distinct: true` it notifies only when the computed value
 * actually moved ({@link shallowEquals}) — for a value carved out of a chatty source, such as
 * the tempo on `location` pushes.
 *
 * @example
 * const isStopped = Luna.derived([transport.playing], () => transport.playing.value === false);
 * const tempo = Luna.derived([t.location], () => t.location.value?.tempo, { distinct: true });
 */
declare function derived<T>(sources: readonly Prop<unknown>[], compute: () => T | undefined, options?: {
    distinct?: boolean;
}): Prop<T>;
/**
 * Wrap a {@link Prop} with a setter to make a {@link WritableProp}.
 */
declare function writable<T>(view: Prop<T>, setter: (value: T) => Promise<void>): WritableProp<T>;
/**
 * A {@link List} over a {@link Prop} of arrays.
 */
declare function listOf<T>(source: Prop<readonly T[]>, idOf: (item: T) => string): List<T>;

/**
 * A path-keyed mirror of the engine tree.
 *
 * - One {@link Cell} per `<node>/<property>` and one per node's child list.
 * - `load` fills cells from a `get`; `watch` subscribes and keeps them current.
 * - Subscriptions are refcounted by path so two views cost one wire subscription.
 * - `set` is optimistic: the cell moves now; if the engine rejects, the previous value is
 *   restored unless something newer has landed since.
 * - After a drop, every watched path is reloaded because pushes during the outage are gone.
 *
 * The Store is transport-agnostic: it only uses {@link Port}.
 */

declare class Store {
    readonly port: Port;
    readonly scheduler: Scheduler;
    private readonly cells;
    private readonly childCells;
    private readonly watches;
    private readonly loaded;
    /** Nodes that have had at least one property written, by a read or a push. */
    private readonly propertied;
    /** Reads sent and not yet answered, for {@link readsSettled}. */
    private readonly inflight;
    private readonly eventListeners;
    /** The last value the engine confirmed for each property cell, for rolling back a refused write. */
    private readonly confirmed;
    private readonly statusUnsub;
    private wasDisconnected;
    private closed;
    constructor(port: Port, scheduler?: Scheduler);
    /** The cell for `<node>/<property>`. Created on demand, `undefined` until loaded or pushed. */
    cell<T = unknown>(nodePath: string, property: string): Cell<T>;
    /** The cell holding a node's child names, in engine order. */
    children(nodePath: string): Cell<string[]>;
    /** True once `load` or a push has given this node a child list. */
    knowsNode(nodePath: string): boolean;
    /**
     * `get` a path and apply the reply to cells. Resolves to the raw reply. A property path fills
     * its own cell; a node path fills its properties and children, recursing into nested children
     * when the reply carries them (`levels`/`recursive`).
     */
    load(path: string, options?: GetOptions): Promise<unknown>;
    /**
     * Resolve once no read is in flight, including reads started while waiting (a member the
     * engine just added is fetched on its own, and that fetch can start another). Never
     * rejects; a failed read counts as finished.
     *
     * @example
     * await luna.store.readsSettled();
     */
    readsSettled(): Promise<void>;
    /** How many reads are in flight. */
    get pendingReads(): number;
    /** True once any property of `nodePath` has been written by a read or a push. */
    hasProperties(nodePath: string): boolean;
    private read;
    /**
     * Subscribe to `path` and load it. Refcounted: the wire subscription is shared and released
     * when the last watcher calls `release`.
     */
    watch(path: string, options?: {
        recursive?: boolean;
        load?: GetOptions | false;
    }): {
        ready: Promise<void>;
        release: Unsubscribe;
    };
    /**
     * Optimistic write. The cell takes `value` immediately with a fresh version; the engine's
     * acknowledgement resolves the promise. On rejection the previous value is restored if the
     * cell still holds our write, then the error is rethrown.
     */
    /**
     * Write a property: the cell takes `value` at once, and `wire` (default `value`) is what is
     * sent, for a value whose wire form differs, such as a number that must go as a float literal.
     */
    set(nodePath: string, property: string, value: unknown, wire?: unknown, params?: Record<string, string>): Promise<void>;
    /** Raw event tap, called before cells are written. For delta-stream properties. */
    onEvent(listener: (event: Event$1) => void): Unsubscribe;
    /** Drop a subtree from the mirror (after a `removed`, or when a view is disposed). */
    forget(nodePath: string): void;
    /** Re-`get` every loaded path. Called automatically after a reconnect. */
    reloadAll(): Promise<void>;
    close(): Promise<void>;
    private applyEvent;
    /** Write a value the engine reported, and remember it as confirmed if it took. */
    private write;
    /**
     * Apply a `get` reply. `depth` is how many levels below `path` the reply lists children
     * completely: there a missing `children` section means "no children" (fact 18); deeper,
     * a child is a bare name and says nothing about its own children.
     */
    private apply;
}

/**
 * Musical time units (EVIDENCE fact 16).
 *
 * Every timeline position the engine exposes (`location.tick`, clip `start`/`stop`, loop points)
 * is in engine ticks. Display code usually wants display ticks (960 per beat).
 *
 * @example
 * const beats = location.tick / Luna.TICKS_PER_BEAT;
 * const displayTick = Math.floor((location.tick % Luna.TICKS_PER_BEAT) / Luna.TICKS_PER_DISPLAY_TICK);
 * const grid = Luna.triplet(Luna.THIRTY_SECOND_NOTE);   // note lengths, in engine ticks
 */
declare const DISPLAY_TICKS_PER_BEAT = 960;
declare const TICKS_PER_DISPLAY_TICK = 100000000;
declare const TICKS_PER_BEAT: number;
declare const WHOLE_NOTE: number;
declare const HALF_NOTE: number;
declare const QUARTER_NOTE: number;
declare const EIGHTH_NOTE: number;
declare const SIXTEENTH_NOTE: number;
declare const THIRTY_SECOND_NOTE: number;
declare const SIXTY_FOURTH_NOTE: number;
declare const ONE_TWENTY_EIGHTH_NOTE: number;
/**
 * The dotted length of a note: one and a half times it. Takes and gives engine ticks, so it
 * composes with the note constants for a grid or a quantize value.
 *
 * @example
 * Luna.dotted(Luna.QUARTER_NOTE);              // 144e9, a dotted quarter
 * Luna.dotted(Luna.dotted(Luna.EIGHTH_NOTE));  // not double-dotted: 1.5 * 1.5 * an eighth
 */
declare function dotted(note: number): number;
/**
 * The triplet length of a note: two thirds of it, so three fill the time of two. Takes and
 * gives engine ticks (whole numbers for every note constant here, 128th included).
 *
 * @example
 * Luna.triplet(Luna.EIGHTH_NOTE);    // 32e9, three of them per beat
 * const grid = Luna.triplet(Luna.SIXTEENTH_NOTE);
 */
declare function triplet(note: number): number;
/**
 * A bar|beat position as the engine reports it in `location.bar_beat`, and as
 * `timeline.barBeat()` returns it. `tick` is in **engine** ticks (the remainder within the
 * beat), not display ticks; {@link formatBarBeat} does the conversion.
 */
interface BarBeat {
    bar: number;
    /** 1-based beat within the bar. */
    beat: number;
    /** Engine ticks into the beat, `0 <= tick < TICKS_PER_BEAT` (for a quarter-note beat). */
    tick: number;
}
/** The `location` property of a session. */
interface Location {
    tick: number;
    bar_beat?: BarBeat;
}
/** Ticks to beats (floating). */
declare function ticksToBeats(ticks: number): number;
/** Beats to ticks. */
declare function beatsToTicks(beats: number): number;
/** Ticks to seconds at a constant tempo. */
declare function ticksToSeconds(ticks: number, bpm: number): number;
/** Seconds to ticks at a constant tempo. */
declare function secondsToTicks(seconds: number, bpm: number): number;
/**
 * Format a {@link BarBeat} as LUNA's counter shows it, `1|1|000`: it converts the engine-tick
 * remainder to display ticks (960 per beat) and zero-pads them. Pass `location.bar_beat` or
 * `timeline.barBeat(tick)` as they are; do not convert `tick` first. For a bare tick,
 * `timeline.formatBarBeat(tick)` does both steps.
 *
 * @example
 * Luna.formatBarBeat(t.location.value?.bar_beat);                 // "2|2|120"
 * Luna.formatBarBeat(session.musical.timeline.barBeat(tick));     // same as timeline.formatBarBeat(tick)
 */
declare function formatBarBeat(bb: BarBeat | undefined): string;
/**
 * Format a time signature as `4/4`; `undefined` (an unloaded prop) gives a placeholder, like
 * {@link formatBarBeat}. Pairs with `transport.timeSignature`.
 *
 * @example
 * Luna.formatTimeSignature(t.timeSignature.value);   // "4/4"
 * Luna.formatTimeSignature(undefined);               // "-/-"
 */
declare function formatTimeSignature(ts: {
    numerator: number;
    denominator: number;
} | undefined): string;
/**
 * Format seconds as a zero-padded `MM:SS` clock, flooring rather than rounding so a
 * counting display never shows a time the playhead has not reached. Negative values clamp
 * to `00:00`; `undefined` (an unloaded prop) gives a placeholder, like {@link formatBarBeat}.
 *
 * @example
 * Luna.formatMinSec(90.56);                    // "01:30"
 * Luna.formatMinSec(90.56, { fraction: 2 });   // "01:30.56"
 * Luna.formatMinSec(t.seconds, { fraction: 1 });
 */
declare function formatMinSec(seconds: number | undefined, options?: {
    fraction?: number;
}): string;

/** The analysis node names LUNA uses (fact 205). */
type AnalysisKind = 'overview' | 'overview_coarse' | 'key' | 'tempo' | 'instrument' | 'transients' | 'chord';
/**
 * One analysis of a source. `count` and `md5` change when the analysis does: a recording's
 * overview `count` grows as LUNA writes it (its `md5` stays `null` until the take is stored),
 * and a finished analysis gets its digest (facts 205, 206).
 *
 * @example
 * await source.analysis.tempo.load();
 * if (source.analysis.tempo.count.value) console.log(await source.analysis.tempo.read());
 */
declare class AnalysisNode extends Node {
    /** Which analysis this is. */
    readonly kind: AnalysisKind;
    /** How many entries the result holds (overview pairs, transients, chord segments, guesses). */
    readonly count: Prop<number>;
    /** Digest of the stored result; `null` while a recording still writes it. Key a cache on it. */
    readonly md5: Prop<string | null>;
    readonly version: Prop<number>;
    readonly versionMinor: Prop<number>;
    /**
     * The stored result as LUNA sends it (`{ version, version_minor, index, count, data, ... }`),
     * or `undefined` when there is none. LUNA answers nothing unless a count is asked for, so
     * this asks for all of it unless `count` is given (fact 205).
     *
     * @example
     * const raw = await source.analysis.chord.readRaw();
     */
    readRaw(options?: {
        index?: number;
        count?: number;
    }): Promise<Record<string, unknown> | undefined>;
}
/** A key guess, best first. */
interface KeyCandidate {
    /** The key as the detector names it, e.g. `C major`. */
    key: string;
    confidence: number;
}
/** `analysis/key`: the detector's key guesses (fact 207). */
interface KeyAnalysisResult {
    candidates: KeyCandidate[];
    /** The whole stored result, for fields the SDK does not name. */
    raw: Record<string, unknown>;
}
/** A tempo guess, best first. */
interface TempoCandidate {
    bpm: number;
    /** The detector's `tickPerBeat`, verbatim. */
    ticksPerBeat: number | undefined;
    /** The detector's `clamped` flag: the tempo was held inside its range. */
    clamped: boolean | undefined;
    /** The guess as stored, including its per-beat arrays. */
    raw: Record<string, unknown>;
}
/** `analysis/tempo` (fact 207). */
interface TempoAnalysisResult {
    candidates: TempoCandidate[];
    /** Seconds per unit of the integer timestamps in the guesses; absent before minor version 2. */
    timeUnitS: number | undefined;
    sampleRate: number | undefined;
    tempoIsConstant: boolean | undefined;
    raw: Record<string, unknown>;
}
/** `analysis/instrument` (fact 207). */
interface InstrumentAnalysisResult {
    /** The class the detector chose, e.g. `vocals`; `''` when it had none. */
    instrument: string;
    confidence: number;
    /** Every class the detector could answer; absent before minor version 2. */
    classes: string[] | undefined;
    /** Index of {@link instrument} in {@link classes}. */
    classIdIndex: number | undefined;
    raw: Record<string, unknown>;
}
/** One page of `analysis/transients` (fact 207). */
interface TransientAnalysisResult {
    /** The first transient in this page. */
    index: number;
    /** Transients in this page. */
    count: number;
    /** Positions from the source's start, in {@link timeUnitS} units (nanoseconds when that is absent). */
    locations: number[];
    /** Level of each transient. */
    levels: number[];
    timeUnitS: number | undefined;
    sampleRate: number | undefined;
    raw: Record<string, unknown>;
}
/** One detected chord over a stretch of the source. */
interface ChordSegment {
    /** The detector's chord label, verbatim (`N` is its "no chord"). */
    name: string;
    /** Seconds from the source's start. */
    start: number;
    end: number;
}
/** `analysis/chord`: what chord detection found in the source (fact 207). */
interface ChordAnalysisResult {
    /** The key the detector settled on, when it reports one. */
    key: string | undefined;
    segments: ChordSegment[];
    raw: Record<string, unknown>;
}
/**
 * `analysis/key`.
 *
 * @example
 * const best = (await source.analysis.key.read())?.candidates[0]?.key;
 */
declare class KeyAnalysis extends AnalysisNode {
    /** @example const r = await source.analysis.key.read(); */
    read(): Promise<KeyAnalysisResult | undefined>;
}
/**
 * `analysis/tempo`.
 *
 * @example
 * const bpm = (await source.analysis.tempo.read())?.candidates[0]?.bpm;
 */
declare class TempoAnalysis extends AnalysisNode {
    /** @example const r = await source.analysis.tempo.read(); */
    read(): Promise<TempoAnalysisResult | undefined>;
}
/**
 * `analysis/instrument`.
 *
 * @example
 * const what = (await source.analysis.instrument.read())?.instrument;
 */
declare class InstrumentAnalysis extends AnalysisNode {
    /** @example const r = await source.analysis.instrument.read(); */
    read(): Promise<InstrumentAnalysisResult | undefined>;
}
/**
 * `analysis/transients`, read a page at a time like the overview.
 *
 * @example
 * const page = await source.analysis.transients.read({ index: 0, count: 512 });
 */
declare class TransientAnalysis extends AnalysisNode {
    /**
     * One page; without `count`, all of them.
     *
     * @example const all = await source.analysis.transients.read();
     */
    read(options?: {
        index?: number;
        count?: number;
    }): Promise<TransientAnalysisResult | undefined>;
}
/**
 * `analysis/chord`: written by chord detection (`session.musical.chords.detect()`), next to
 * the chords it puts on the ruler.
 *
 * @example
 * const segs = (await source.analysis.chord.read())?.segments ?? [];
 */
declare class ChordAnalysis extends AnalysisNode {
    /** @example const r = await source.analysis.chord.read(); */
    read(): Promise<ChordAnalysisResult | undefined>;
}
/**
 * `source.analysis`: every analysis LUNA keeps for one source.
 *
 * @example
 * await source.analysis.load();
 * source.analysis.kinds.value;                 // e.g. ['overview', 'overview_coarse', 'key']
 */
declare class SourceAnalysis {
    private readonly client;
    readonly overview: AnalysisNode;
    readonly overviewCoarse: AnalysisNode;
    readonly key: KeyAnalysis;
    readonly tempo: TempoAnalysis;
    readonly instrument: InstrumentAnalysis;
    readonly transients: TransientAnalysis;
    readonly chord: ChordAnalysis;
    /** The analyses LUNA has for this source, by node name. Includes kinds the SDK does not name. */
    readonly kinds: Prop<string[]>;
    /** `<source>/analysis`. */
    readonly path: string;
    /**
     * Read every analysis node's `count`, `md5` and versions once.
     *
     * @example await source.analysis.load();
     */
    load(): Promise<void>;
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
    watch(): {
        ready: Promise<void>;
        release: Unsubscribe;
    };
}

/** `fine` is `analysis/overview` (2.604 ms per pair), `coarse` is `analysis/overview_coarse` (12 fine pairs, 31.25 ms). Fact 72. */
type OverviewKind = 'fine' | 'coarse';
interface OverviewOptions {
    /** Zero-based overview-pair index, not a sample or channel index. Default 0. */
    index?: number;
    /** Maximum pairs per channel, 1-4096. Default 1024; no unbounded reads. */
    count?: number;
    /** Which analysis to page. Default `fine`. */
    kind?: OverviewKind;
}
/** What LUNA reports about one analysis: total pairs, and a digest that changes when the pairs do. */
interface OverviewInfo {
    readonly count: number;
    /** Stable while the analysis is; a page cache keys on it. */
    readonly md5: string | undefined;
}
interface Overview {
    /** The first pair returned: `channels[c].min[i]` covers pair `index + i`. */
    index: number;
    /** Pairs actually returned per channel. Short of what was asked means the analysis ended there, or is still growing. */
    count: number;
    /** Which analysis this came from. */
    kind: OverviewKind;
    /** Bins per second of audio: 384 fine, 32 coarse. */
    binsPerSecond: number;
    channels: {
        min: Float32Array;
        max: Float32Array;
    }[];
}
declare class AudioSource extends Node {
    readonly name: Prop<string>;
    /** `mono` or `stereo`. */
    readonly stemFormat: Prop<string>;
    /** Duration in nanoseconds. */
    readonly length: Prop<number>;
    readonly sampleRate: Prop<number>;
    readonly created: Prop<unknown>;
    /**
     * The name to show: `name`, or `undefined` when the file has none. LUNA names some sources
     * with their own uid (fact 238); a blank name, or one that is the uid (with or without dashes
     * or an extension), counts as none. Show your own label then, such as the clip's name.
     *
     * @example
     * row.textContent = source.displayName.value ?? `Untitled (${source.seconds?.toFixed(1)} s)`;
     */
    readonly displayName: Prop<string | undefined>;
    /**
     * Where the file came from, LUNA's number for it (fact 239): see {@link SourceOrigin}.
     * `undefined` on a LUNA that does not publish it.
     */
    readonly origin: Prop<number | undefined>;
    /** LUNA's audio file format name, e.g. `wav` (fact 239). */
    readonly format: Prop<string | undefined>;
    /** True when LUNA named the file (see {@link displayName}). */
    get hasName(): boolean;
    /**
     * True for a clip rendering (LUNA's own pass of a clip through its clip effects, time
     * stretch or sample-rate conversion), which LUNA keeps under `renders/clips/` and remakes as
     * needed, rather than a recording, import or bounce (fact 239).
     *
     * @example const files = sources.items.filter((s) => !s.isRender);
     */
    get isRender(): boolean;
    /** The session package uid this file belongs to, from its path. */
    get packageUid(): string;
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
    filePath(): Promise<string | undefined>;
    /**
     * Show the file in Finder or Explorer (`luna.gui.revealPath`). Rejects with `unavailable`
     * when the path is unknown.
     *
     * @example revealButton.onclick = () => void source.reveal();
     */
    reveal(): Promise<void>;
    /**
     * Every analysis LUNA keeps for this file (key, tempo, instrument, transients, chord and the
     * overviews), with live `count` and `md5` props (fact 205). Created on first use.
     *
     * @example
     * const w = source.analysis.watch();
     * await w.ready;
     * source.analysis.overview.count.onChange(() => redraw(source.analysis.overview.count.value));
     */
    get analysis(): SourceAnalysis;
    private analyses;
    get channelCount(): number;
    /** Duration in seconds. */
    get seconds(): number | undefined;
    /**
     * The analysis node's pair count and digest, or `undefined` when there is no analysis yet
     * (a file LUNA has not finished scanning, or a render it has named but not written).
     *
     * @example
     * const info = await source.overviewInfo();
     * if (info) for (let n = 0; n * 1024 < info.count; n++) draw(await source.overview({ index: n * 1024 }));
     */
    overviewInfo(options?: {
        kind?: OverviewKind;
    }): Promise<OverviewInfo | undefined>;
    /**
     * Read one bounded page of the waveform overview. Bins are int16 min/max pairs per channel
     * on the wire; here they are floats in -1..1.
     *
     * A bare number is the legacy form and means `{ index }` with the default count.
     *
     * @example
     * const page = await source.overview({ index: 0, count: 512, kind: 'coarse' });
     */
    overview(options?: OverviewOptions | number): Promise<Overview | undefined>;
}
/**
 * Where a source file came from: LUNA's `origin` numbers (fact 239). Only the renderings are
 * kept outside the package's `audio/` folder.
 */
declare const SourceOrigin: {
    readonly Unknown: 0;
    readonly Recording: 1;
    readonly Import: 2;
    readonly Consolidate: 3;
    readonly TrackFreeze: 4;
    readonly Bounce: 5;
    readonly Sync: 6;
    readonly Staging: 7;
    readonly ClipRendering: 8;
    readonly ClipRenderingIntermediate: 9;
};
/**
 * `name` unless it is blank or the file's own uid (fact 238), else `undefined`.
 *
 * @example Luna.sourceDisplayName('Vocal.wav', 'f87c…') // 'Vocal.wav'
 */
declare function sourceDisplayName(name: string | undefined | null, uid: string): string | undefined;
/**
 * The path of a source file inside its session package (fact 239).
 *
 * @example Luna.sourceFilePath('/Music/Song/Song.luna', uid, false) // '/Music/Song/Song.luna/audio/<uid>.wav'
 */
declare function sourceFilePath(packagePath: string, uid: string, isRender: boolean): string;
/** Nanoseconds per fine overview pair: 125 samples at 48 kHz (fact 72). */
declare const OVERVIEW_PAIR_NS: number;
/** Fine pairs per coarse pair. */
declare const COARSE_PAIRS_PER_FINE = 12;
/** Nanoseconds per coarse overview pair: 31.25 ms. */
declare const COARSE_PAIR_NS: number;
/** Nanoseconds one pair of this analysis covers. */
declare function pairNs(kind: OverviewKind): number;

/**
 * Which tracks and clips use each source file of a session, kept current as clips are added,
 * moved between files, rendered or deleted, and as tracks switch playlists. From
 * `session.sourceUsage()`.
 *
 * A clip uses a file through its `sourceUid` and, once LUNA has rendered it, its
 * `renderSourceUid` too (fact 73). Every playlist counts, not only the active ones: LUNA keeps
 * a file a hidden take uses, so `active` says whether the clip is on its track's playing
 * playlist.
 *
 * @example
 * const usage = await session.sourceUsage();
 * const draw = () => {
 *   for (const src of sources.items) {
 *     const used = usage.byId(src.id);
 *     console.log(src.displayName.value, used ? used.trackUids.length : 0, 'tracks');
 *   }
 * };
 * usage.onChange(draw);
 * draw();
 * usage.dispose();   // when the page no longer shows it
 */

/** One clip's use of one file. */
interface SourceUse {
    readonly sourceUid: string;
    readonly clipUid: string;
    readonly playlistUid: string;
    /** The track the playlist belongs to. */
    readonly trackUid: string | undefined;
    /** True when the file is the clip's rendering (`renderSourceUid`), not its source. */
    readonly asRender: boolean;
    /** True when the playlist is its track's active (playing) one. */
    readonly active: boolean;
}
/** Every use of one file. */
interface SourceUsageEntry {
    /** The source file's uid. */
    readonly id: string;
    readonly uses: readonly SourceUse[];
    /** The distinct tracks among {@link uses}, in session order of first use. */
    readonly trackUids: readonly string[];
}
declare class SourceUsage implements List<SourceUsageEntry> {
    private readonly session;
    private entries;
    private byUid;
    private readonly listeners;
    private readonly releases;
    private readonly perPlaylist;
    private queued;
    private disposed;
    /** Files in use, each with its uses. A file no clip uses is not listed. */
    get items(): readonly SourceUsageEntry[];
    get value(): readonly SourceUsageEntry[];
    /** The uses of one file, or `undefined` when no clip uses it. */
    byId(sourceUid: string): SourceUsageEntry | undefined;
    /** True when some clip, on any playlist, uses the file. */
    isUsed(sourceUid: string): boolean;
    /** Called whenever the usage changes. */
    onChange(listener: () => void): Unsubscribe;
    /** Stop following the session. */
    dispose(): void;
    private followPlaylists;
    private schedule;
    private recompute;
}

/**
 * A live list of child Nodes under one parent path. Members are created from the parent's
 * child-name cell and disposed when the engine removes them.
 *
 * Once the collection is loaded, a member the engine adds later is in `items` at once, but
 * native LUNA announces an add with no data (fact 7), so its props read `undefined` until the
 * SDK has fetched it. `onChange` waits for that fetch: a listener never sees the new member
 * empty. `await collection.membersReady()`, or `await luna.settled()`, waits for it too.
 *
 * @example
 * session.tracks.items.map((t) => t.name.value);
 * session.tracks.byId(uid);
 * session.tracks.onChange(() => render());
 */

declare class Collection<T extends Node> implements List<T> {
    readonly client: Client;
    /** Path of the node whose children are the members, for example `/sessions/<uid>/tracks`. */
    readonly path: string;
    private readonly create;
    private readonly loadOptions;
    private members;
    /** Members handed out by {@link member} before the engine listed them, by name. */
    private early;
    private ordered;
    private loading;
    private readonly listeners;
    private namesUnsub;
    private syncedVersion;
    /** Member paths already fetched, so a new child is loaded once and only once. */
    private readonly fetched;
    /** Added members whose first read has not landed, by name. `onChange` waits for them. */
    private readonly pending;
    private disposed;
    /** The members listeners were last told about. */
    private announced;
    /** Members in engine order. Empty until loaded or pushed. */
    get items(): readonly T[];
    get value(): readonly T[];
    byId(id: string): T | undefined;
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
    membersReady(): Promise<void>;
    /** Fetch the member list (and, with the default `levels: 2`, each member's properties). */
    load(): Promise<void>;
    /**
     * Fetch the member list again, ignoring the once-only cache of {@link load}, and re-sync
     * the members. Use it after an edit whose push LUNA held back, or inside a transaction.
     *
     * @example
     * await session.tracks.reload();
     */
    reload(): Promise<void>;
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
    watch(options?: {
        recursive?: boolean;
    }): {
        ready: Promise<void>;
        release: Unsubscribe;
    };
    /** Called when members are added or removed. */
    onChange(listener: () => void): Unsubscribe;
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
    onAnyChange(listener: () => void, options?: {
        props?: ReadonlyArray<PropKey<T>>;
    }): Unsubscribe;
    /** Rebuild members if the child-name cell moved since the last sync. */
    private ensureSynced;
    /** Rebuild `members` from the child-name cell; keeps existing instances, disposes removed. */
    private sync;
    /** A held member's first read landed (or failed): tell listeners. */
    private arrived;
    /** Notify if the members a listener can see differ from those it was last told about. */
    private announce;
}
/** The names of a member's fields that are props, for {@link Collection.onAnyChange}. */
type PropKey<T> = {
    [K in keyof T]: T[K] extends {
        onChange(listener: () => void): Unsubscribe;
        readonly value: unknown;
    } ? K : never;
}[keyof T] & string;

interface SessionPackageRow {
    uid: string;
    name: string;
    path: string;
    online: boolean;
    sessionType: number | string;
    factory: boolean;
    favorite: boolean;
    /** Milliseconds since the epoch. */
    created: number;
    /** Seconds since the epoch, as the engine reports it. */
    modified: number;
    /** Milliseconds since the epoch. */
    lastOpened: number;
    tags: string[];
}
interface QueryOptions {
    table?: 'sessions' | 'versions' | 'tutorials';
    /**
     * The package whose versions or tutorials to list. LUNA ignores it for the `'sessions'`
     * table, which always answers every package: find one there by its row's `uid` (fact 237).
     */
    sessionPackageUid?: string;
    factory?: boolean;
    favorite?: boolean;
    tags?: string[];
    /** Match any tag rather than all. */
    anyTag?: boolean;
    search?: string;
    orderBy?: 'created' | 'last_opened' | 'modified' | 'name' | (string & {});
    orderAs?: 'asc' | 'desc';
    lastOpenedMin?: number;
    limit?: number;
}
/** Filters for {@link Workspace.templates}. */
interface TemplateQueryOptions {
    /** Only templates carrying this tag. */
    tag?: string;
    /** `true` for LUNA's own templates only, `false` for the user's only. */
    factory?: boolean;
}
/** One session package as a live node. */
declare class SessionPackage extends Node {
    readonly uid: Prop<string>;
    readonly fileName: Prop<string>;
    readonly directoryPath: Prop<string>;
    readonly sessionType: Prop<string>;
    readonly factory: Prop<boolean>;
    readonly favorite: WritableProp<boolean>;
    readonly comments: WritableProp<string>;
    readonly created: Prop<number>;
    readonly modified: Prop<number>;
    readonly lastOpened: Prop<number>;
    /** Display name without the `.luna` or `.lunatemplate` extension. */
    get name(): string;
}
declare class Workspace extends Node {
    /** All packages. Large; prefer {@link query} or {@link recent} unless you need live updates. */
    readonly packages: Collection<SessionPackage>;
    /** Query the workspace database. Columnar on the wire; rows here. */
    query(options?: QueryOptions): Promise<SessionPackageRow[]>;
    /** Most recently opened packages, newest first. */
    recent(limit?: number): Promise<SessionPackageRow[]>;
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
    templates(options?: TemplateQueryOptions): Promise<SessionPackageRow[]>;
    /**
     * Tag a session package, as a template or session is tagged for {@link templates} and
     * {@link query} to find (fact 161). LUNA writes the tag into the package's metadata, so it
     * travels with it. Rejects with `uasrv.read_only_property` for a factory package and
     * `device.database_error` for an unknown one.
     *
     * @example await luna.workspace.addTag(session.sessionPackageUid.value!, 'brochure');
     */
    addTag(packageUid: string, tag: string): Promise<void>;
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
    recentList(limit?: number): Promise<RecentSessions>;
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
    unusedMedia(packageUid: string, options?: {
        clearUndo?: boolean;
    }): Promise<UnusedMedia>;
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
    deleteUnusedMedia(packageUid: string, options?: {
        toTrash?: boolean;
        clearUndo?: boolean;
        deleteAutoBackups?: boolean;
    }): Promise<UnusedMedia>;
    /** Full-text search over session metadata. */
    search(text: string): Promise<unknown>;
    protected release(): void;
}
/** Why LUNA keeps a file that {@link Workspace.unusedMedia} does not offer to remove. */
type KeptReason = 'session' | 'undo' | 'version' | 'backup' | 'origin' | 'move_failed' | (string & {});
/** The answer of {@link Workspace.unusedMedia} and {@link Workspace.deleteUnusedMedia}. */
interface UnusedMedia {
    /** Audio files in the package's folder. */
    readonly totalFiles: number;
    /** Files removed, or that would be in a pre-flight. */
    readonly unusedCount: number;
    /** Files only auto-backups use. */
    readonly onlyInBackupsCount: number;
    /** The uids counted by `unusedCount`; `undefined` on a LUNA that does not list them. */
    readonly unusedUids: readonly string[] | undefined;
    /** Every other file and why it stays; `undefined` on a LUNA that does not list them. */
    readonly kept: readonly {
        readonly uid: string;
        readonly reason: KeptReason;
    }[] | undefined;
}
/** A {@link Workspace.recentList} row: the package, and the open session showing it, if any. */
interface RecentSessionRow extends SessionPackageRow {
    /** The uid of the open session of this package, or `undefined` when it is not open. */
    readonly openSessionUid: string | undefined;
}
/**
 * The live list {@link Workspace.recentList} answers. `byId` takes a package uid with or
 * without dashes.
 *
 * @example
 * const recent = await luna.workspace.recentList(10);
 * recent.items[0]?.name;
 * await recent.refresh();
 * recent.dispose();
 */
declare class RecentSessions implements List<RecentSessionRow> {
    private readonly workspace;
    readonly limit: number;
    private rows;
    private readonly listeners;
    private readonly releases;
    private timer;
    private generation;
    private disposed;
    get items(): readonly RecentSessionRow[];
    get value(): readonly RecentSessionRow[];
    byId(packageUid: string): RecentSessionRow | undefined;
    onChange(listener: () => void): Unsubscribe;
    /** Query again now. */
    refresh(): Promise<void>;
    /** Stop following. */
    dispose(): void;
    /** LUNA writes `last_opened` as a session opens; query a moment after the change, once. */
    private schedule;
}

declare const AUTOMATION_MODES: readonly ["off", "read", "write", "touch", "latch"];
type AutomationModeName = (typeof AUTOMATION_MODES)[number];
/** Commands take the mode as an integer ordinal; the track property reports it as a string. */
declare function automationModeOrdinal(mode: AutomationModeName): number;
interface Breakpoint {
    tick: number;
    value: number;
}
declare class BreakpointNode extends Node {
    readonly start: Prop<number>;
    readonly value: Prop<number>;
}
declare class Automation extends Collection<BreakpointNode> {
    private readonly controlUidProp;
    private readonly sessionUid;
    /** Breakpoints sorted by tick. */
    get breakpoints(): Breakpoint[];
    private post;
    /**
     * Wait until the lane shows the edit. The breakpoint verbs answer `null` whether or not
     * anything changed (fact 71), and LUNA holds pushes inside a batch but answers reads
     * (fact 60), so the lane is re-read while waiting.
     */
    private settled;
    private at;
    /**
     * Insert breakpoints. With `clearRange`, existing breakpoints in that range are removed first;
     * without it, new points stack on existing ones. Values go on the wire as float literals,
     * because LUNA stores a bare whole number as 0 (fact 82). Resolves once every point is in
     * the lane.
     *
     * @example
     * await track.gain.automation.insert([{ tick: 0, value: 0 }, { tick: Luna.WHOLE_NOTE, value: -6 }]);
     */
    insert(points: Breakpoint[], clearRange?: {
        startTick: number;
        stopTick: number;
    }): Promise<void>;
    /**
     * Delete the breakpoint at `tick`, or every breakpoint in `[startTick, stopTick]`. Resolves
     * once they are gone.
     *
     * @example
     * await track.gain.automation.clear(0, Luna.WHOLE_NOTE * 4);
     */
    clear(startTick: number, stopTick?: number): Promise<void>;
    /**
     * Move the breakpoint at `fromTick` to `toTick`. Resolves once it has moved.
     *
     * @example
     * await track.gain.automation.move(0, Luna.QUARTER_NOTE);
     */
    move(fromTick: number, toTick: number): Promise<void>;
    /**
     * Set the value of the breakpoint at `tick`, sent as a float literal (fact 82). Resolves
     * once the lane shows it.
     *
     * @example
     * await track.gain.automation.setValue(0, -3);
     */
    setValue(tick: number, value: number): Promise<void>;
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
    writeRange(value: number, range: {
        start: number;
        stop: number;
    }): Promise<void>;
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
    trimRange(delta: number, range: {
        start: number;
        stop: number;
    }): Promise<void>;
    private uidOrThrow;
}

/** A fader taper name as LUNA writes it in a control's `taper` property. */
type TaperName = '+18' | '+12' | '+12Neve' | 'API' | '+6' | '+0' | 'preamp' | 'volt_monitor_gain';
/** Options for {@link Taper.marks}. */
interface TaperMarksOptions {
    /**
     * The short set, for a fader too short for the full one. LUNA switches to it when the
     * 0 dB and −6 dB marks would be 10 px apart or less (20 px for `API`).
     */
    compact?: boolean;
}
/**
 * Fader tapers: how LUNA maps a fader's 0..1 position to dB (fact 134).
 *
 * A gain-type control names its taper in its `taper` property; {@link Control.taper} resolves
 * it to one of these. Each taper is LUNA's own breakpoint table, interpolated linearly between
 * points as LUNA does, so `toNormalized` and `toDb` agree with the control's
 * `normalized_value` and `real_value`. `marks()` gives the dB values LUNA draws hash marks at.
 *
 * @example
 * const taper = track.gain.taper.value ?? Luna.Taper.named('+12')!;
 * for (const db of taper.marks()) {
 *   const y = height * (1 - taper.toNormalized(db));   // 0 at the top
 *   drawMark(y, db <= taper.minDb ? '∞' : String(Math.abs(db)));
 * }
 */
declare class Taper {
    readonly name: TaperName;
    private static readonly cache;
    /** The default taper: what LUNA uses for a gain control whose `taper` is empty or unknown. */
    static readonly DEFAULT_NAME: TaperName;
    /** Every taper name LUNA defines, `none` aside. */
    static readonly NAMES: readonly TaperName[];
    /** Lowest dB on the taper; for the dB tapers −144, which LUNA shows as −∞. */
    readonly minDb: number;
    /** Highest dB on the taper: the top of the fader. */
    readonly maxDb: number;
    /** LUNA's breakpoints as `[dB, normalized]`, highest dB first, as LUNA lists them. */
    readonly points: readonly (readonly [number, number])[];
    private readonly byDb;
    private readonly byNormalized;
    private constructor();
    /**
     * The taper LUNA uses for a `taper` property value. Empty, `null` and unknown names give
     * `+12`, as in LUNA; `none` gives `null`. The same name always gives the same object.
     *
     * @example
     * Luna.Taper.named('API')!.toNormalized(0);  // 0.59423
     * Luna.Taper.named('')!.name;                // '+12'
     * Luna.Taper.named('none');                  // null
     */
    static named(name: string | null | undefined): Taper | null;
    /**
     * The taper a control uses, from its `control_type` and `taper` properties: `null` for a
     * control LUNA gives no fader taper (pan, mute, a plugin parameter), `undefined` while the
     * control type has not arrived.
     *
     * @example
     * Luna.Taper.forControl('gain', null)?.name;   // '+12'
     * Luna.Taper.forControl('pan', null);          // null
     */
    static forControl(controlType: string | undefined, taper: string | null | undefined): Taper | null | undefined;
    /**
     * The 0..1 fader position for a dB value, clamped to the taper's range.
     *
     * @example
     * Luna.Taper.named('+12')!.toNormalized(-6);   // 0.6727
     */
    toNormalized(db: number): number;
    /**
     * The dB value at a 0..1 fader position, clamped to the taper's range.
     *
     * @example
     * Luna.Taper.named('+12')!.toDb(1);   // 12
     */
    toDb(normalized: number): number;
    /**
     * The dB values to draw fader hash marks at, top first. The last is {@link minDb}, which
     * LUNA labels ∞. Place each with {@link toNormalized}.
     *
     * @example
     * taper.marks();                    // [12, 6, 0, -6, -12, -20, -32, -56, -144] for +12
     * taper.marks({ compact: true });   // [12, 0, -12, -32, -144]
     */
    marks(options?: TaperMarksOptions): number[];
}

/**
 * Every control type LUNA defines, as it writes them in `control_type` (`UA::ControlTypeToString`).
 * The list mirrors LUNA's and must track it; {@link ControlType} stays open (`| string`) so a
 * type a later LUNA adds still reads.
 *
 * @example
 * Luna.CONTROL_TYPES.includes(control.controlType.value as Luna.KnownControlType);
 */
declare const CONTROL_TYPES: readonly ["gain", "pan", "pan_left", "pan_right", "mute", "record_mute", "solo", "solo_safe", "parameter", "audio_source", "pre_fader", "enabled", "gain_trim", "input_trim_left", "input_trim_right", "input_trim_invert_left", "input_trim_invert_right", "input_trim_mono", "input_trim_invert_mono", "input_trim_link", "sidechain_input_trim", "latency_offset", "mix_to_mono", "preamp_gain", "preamp_hiz", "preamp_invert", "preamp_48v", "preamp_limitor", "preamp_compressor", "preamp_max_compressor", "preamp_tone", "preamp_pad", "preamp_low_cut"];
/** One of {@link CONTROL_TYPES}. */
type KnownControlType = (typeof CONTROL_TYPES)[number];
/** A control's `control_type`: one LUNA defines ({@link CONTROL_TYPES}), or a newer one. */
type ControlType = KnownControlType | (string & {});
declare class Control extends Node {
    /** Owning session uid; needed for automation commands. Derived from the path when omitted. */
    readonly sessionUid: string;
    /** Engine-native value. Writing here is undoable. */
    readonly value: WritableProp<number>;
    /** 0..1 view. */
    readonly normalized: WritableProp<number>;
    /** Value in units (dB, pan position) or boolean for switches. */
    readonly real: WritableProp<number | boolean>;
    /** Formatted for display, as the engine formats it. */
    readonly display: Prop<string>;
    readonly uid: Prop<string>;
    readonly name: Prop<string>;
    readonly controlType: Prop<ControlType>;
    readonly automatable: Prop<boolean>;
    readonly discrete: Prop<boolean>;
    readonly numSteps: Prop<number>;
    readonly touchCount: Prop<number>;
    /**
     * `true` on a live control. A plugin parameter left behind when its slot was cleared has
     * `initialized: null` (fact 86); {@link Effect.params} lists only live ones.
     */
    readonly initialized: Prop<boolean | null>;
    /** For discrete controls: the real value of each step. */
    readonly realValues: Prop<(number | boolean)[]>;
    /** For discrete controls: the display string of each step. */
    readonly displayValues: Prop<string[]>;
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
    readonly taper: Prop<Taper | null>;
    private gestureDepth;
    /** Whether the outermost {@link begin} sent a touch, so {@link end} releases only that. */
    private gestureTouched;
    private automationLane;
    private recordingLane;
    /** Playback automation lane. Call `load()` on it before reading breakpoints. */
    get automation(): Automation;
    /** Automation captured during the current record pass. */
    get automationRecording(): Automation;
    protected release(): void;
    /**
     * A number written to a continuous control goes as a float literal (fact 142): LUNA refuses a
     * bare whole number for a plugin parameter's `real_value` and ignores one for its `value`, so
     * `real.set(-3)` would fail where `real.set(-3.5)` works. A discrete control's step value
     * stays a whole number, which is what it requires; so do booleans and anything else.
     */
    private wireNumber;
    /** True when `real` is boolean-like (mute, solo, switches). */
    get isSwitch(): boolean;
    /** For switches: current state as a boolean. */
    get on(): boolean;
    /** For switches: flip the state. */
    toggle(): Promise<void>;
    /**
     * True when writes to this control are touch-bracketed: automatable controls, and discrete
     * ones (switches, stepped parameters), which LUNA's GUI always brackets (fact 78). A control
     * whose `automatable` has not arrived yet counts as automatable.
     *
     * @example
     * track.gain.touchable; // true
     * track.solo.touchable; // true: a switch, though not automatable
     */
    get touchable(): boolean;
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
    begin(): void;
    /**
     * Finish a continuous gesture (pointer up). Releases the touch the matching {@link begin}
     * took; an unmatched call is ignored, since LUNA rejects a release it never saw a touch for
     * (fact 78).
     */
    end(): void;
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
    resetToDefault(): Promise<void>;
    /** True while inside a {@link begin}/{@link end} pair. */
    get inGesture(): boolean;
    /** Raw touch state on the engine (`set_touch` command). Prefer begin/end; errors are swallowed. */
    touch(touching: boolean): Promise<void>;
    /** Wrap a writable view so one-shot writes outside a gesture are touch-bracketed. */
    private gated;
}

declare class Controls extends Collection<Control> {
    private readonly named;
    /**
     * The control called `name`. Always returns an object; its props are `undefined` until the
     * folder is loaded or the engine pushes it.
     */
    get(name: string): Control;
}

/**
 * Insert slots, LUNA's extensions and plug-in formats: pure helpers over slot names and
 * plug-in ids (fact 181). The id lists mirror LUNA's own and must be kept in step with it; an id LUNA
 * adds later is not recognised until the SDK learns it.
 */

/**
 * The prefix of LUNA's synthetic alias plug-in ids. LUNA shows an extension slot inside an
 * ordinary effect chain as a plug-in id `alias.<slot>`: a channel's console plug-in (LUNA
 * Channel, a summing console) appears among its `effect_N` inserts as `alias.console`.
 */
declare const INSERT_ALIAS_PREFIX = "alias.";
/**
 * Whether a slot is one of the record FX slots (`record_fx_0`, `record_fx_1`, ...): the
 * inserts LUNA prints into a recording, as opposed to the `effect_N` playback inserts.
 *
 * @example
 * Luna.isRecordFxSlot('record_fx_0');   // true
 * Luna.isRecordFxSlot('effect_0');      // false
 * const recordFx = track.effects.items.filter((e) => Luna.isRecordFxSlot(e.id));
 */
declare function isRecordFxSlot(slot: string): boolean;
/**
 * Whether a plug-in id is one of LUNA's synthetic `alias.<slot>` ids rather than a real
 * plug-in. Today LUNA makes only `alias.console`, but it reads any `alias.<slot>` whose slot it
 * knows, and so does this.
 *
 * @example
 * Luna.isInsertAliasPluginId('alias.console');           // true
 * Luna.isInsertAliasPluginId('com.uaudio.uadx.1176');    // false
 */
declare function isInsertAliasPluginId(pluginId: string): boolean;
/**
 * The slot an alias plug-in id stands for, so a chain's `alias.console` entry can be shown
 * as the channel's console slot: `alias.console` gives `'console'`. Any other id, an alias
 * included whose slot LUNA does not know, gives `undefined`.
 *
 * @example
 * for (const slot of track.effects.items) {
 *   const target = Luna.insertSlotForAlias(slot.pluginId.value ?? '');
 *   if (target) showAsLink(slot, track.effects.byId(target));   // the console plug-in
 * }
 */
declare function insertSlotForAlias(pluginId: string): InsertSlot | undefined;
/** LUNA Channel's plug-in id. */
declare const LUNA_CHANNEL_PLUGIN_ID = "uaudio_luna_channel";
/**
 * The plug-in ids of LUNA's extensions: plug-ins LUNA hosts as part of itself (the summing
 * consoles, tape, the sampler, the hardware insert, LUNA Channel), whose window is LUNA's own.
 * This list mirrors LUNA's and must track it: an extension added in a later LUNA is not in it
 * until the SDK is updated.
 */
declare const LUNA_EXTENSION_PLUGIN_IDS: readonly string[];
/**
 * Whether a plug-in id is one of {@link LUNA_EXTENSION_PLUGIN_IDS}. The test is by exact id,
 * so the list must track LUNA's.
 *
 * @example
 * Luna.isLunaExtensionPluginId('uaudio_luna_channel');    // true
 * Luna.isLunaExtensionPluginId('com.uaudio.uadx.1176');   // false
 * const plugins = slots.filter((e) => !Luna.isLunaExtensionPluginId(e.pluginId.value ?? ''));
 */
declare function isLunaExtensionPluginId(pluginId: string): boolean;
/**
 * A plug-in format, as LUNA names its SDK types: third-party `vst`, `vst3`, `au` and `aax`,
 * UA's `uad2` and `uadx`, and the server-hosted `cloud` and `localml` clip effects. A plug-in's
 * reported format (`plugin.sdkType`, {@link PluginSdkType}) is one of these, or `''`.
 */
type PluginFormat = 'vst' | 'vst3' | 'au' | 'aax' | 'uad2' | 'uadx' | 'cloud' | 'localml';
/**
 * A plug-in's format guessed from its id, with the patterns LUNA itself uses: `.vst.`,
 * `.vst3.` or `.au.` anywhere in the id, a `cloud:` or `localml:` prefix, a `UAD ` prefix for
 * UAD-2, and `uadx` for anything else. It is a heuristic: an id that matches none of them is
 * reported as `uadx`, as LUNA does, and LUNA may treat a `cloud:` effect as unavailable when
 * cloud clip effects are off. Prefer the format LUNA reports for an installed plug-in
 * (`Plugin.sdkType`) where you have it.
 *
 * @example
 * Luna.pluginFormat('com.fabfilter.vst3.ProQ3');   // 'vst3'
 * Luna.pluginFormat('UAD 1176LN');                 // 'uad2'
 * Luna.pluginFormat('com.uaudio.uadx.1176');       // 'uadx'
 */
declare function pluginFormat(pluginId: string): PluginFormat;

interface PluginManifest {
    manufacturer?: string;
    name?: string;
    version?: string;
    plugin_id?: string;
    short_names?: string[];
    categories?: string[];
    effect_type?: string;
    supported_stream_formats?: Record<string, [string, string][]>;
    is_v3?: boolean;
}
interface PluginQueryOptions {
    /** Case-insensitive text matched against plugin names and manufacturers. */
    search?: string;
    /** Only plugins in any of these categories, named as LUNA's plugins browser names them (`EQ`, `Reverb`, ...). */
    categories?: readonly string[];
    /** Only favorites. */
    favoritesOnly?: boolean;
    /** Only plugins LUNA would put in this slot (`effect_0`, `instrument`, `midi_0`, `record_fx_0`, ...). */
    insertType?: InsertSlot;
    /** With `insertType`, the track or bus whose format (mono, stereo) the plugins must run in. Needs `sessionUid`. */
    channelUid?: string;
    sessionUid?: string;
    /** Maximum number of rows. */
    limit?: number;
}
/**
 * One entry of an Add On manifest's `requires_plugins`, as LUNA reports it on
 * {@link AddOn.requiresPlugins} (fact 148). It is met when any of `plugin_id` is installed at
 * `min_version` or later (any version when `''`). One plugin has a different id per format (AU,
 * VST3, ...), so list each. `name` is what LUNA shows, since a plugin that is not installed has
 * no name to look up. Unless `optional`, LUNA will not open the Add On while it is unmet.
 */
interface PluginRequirement {
    name: string;
    plugin_id: string[];
    min_version: string;
    optional: boolean;
}
/**
 * Whether plugin version `installed` meets `minVersion`, as LUNA compares them (fact 148):
 * every dot-separated part as a number, missing parts as 0, so `'0.4.10'` meets `'0.4.3'` and
 * `'0.4.3.1'` meets `'0.4.3'`. An empty `minVersion` is met by anything; an empty or malformed
 * `installed` meets only that.
 *
 * @example
 * Luna.pluginVersionMeets('0.4.10', '0.4.3'); // true
 * Luna.pluginVersionMeets('0.4.2', '0.4.3');  // false
 */
declare function pluginVersionMeets(installed: string | undefined, minVersion: string): boolean;
/** One plugin {@link Plugins.query} returned. */
interface PluginRow {
    pluginId: string;
    name: string;
    manufacturer: string;
    /** As LUNA's plugins browser names them. */
    categories: string[];
    favorite: boolean;
}
/**
 * A plugin's format as LUNA reports it (`sdk_type`, fact 177): a {@link PluginFormat}, or `''`
 * when LUNA cannot tell (a `cloud:` plugin while cloud clip effects are off).
 */
type PluginSdkType = PluginFormat | '';
declare class Plugin extends Node {
    readonly pluginId: Prop<string>;
    readonly name: Prop<string>;
    readonly version: Prop<string>;
    readonly description: Prop<string>;
    readonly installed: Prop<boolean>;
    readonly favorite: Prop<boolean>;
    /** `true`/`false` when licensing applies; `null` for plugins without UA licensing. */
    readonly authorized: Prop<boolean | null>;
    readonly manifest: Prop<PluginManifest>;
    readonly defaultPresetUid: Prop<string | null>;
    /**
     * The plugin's format as LUNA decides it (`sdk_type`, fact 177). Prefer it to reading the
     * id: a UA-made VST3 or AU wrapper is `'uadx'` although its id says `.vst3.` or `.au.`.
     * `undefined` until loaded, and on a LUNA that does not report it.
     *
     * @example
     * const thirdParty = luna.plugins.items.filter((p) => ['vst', 'vst3', 'au'].includes(p.sdkType.value ?? ''));
     */
    readonly sdkType: Prop<PluginSdkType>;
    get manufacturer(): string | undefined;
    /**
     * Whether it is installed at `minVersion` or later, as LUNA checks an Add On's
     * `requires_plugins` (fact 148). Reads the loaded {@link installed} and {@link version}.
     *
     * @example
     * const ok = luna.plugins.byId('com.eventfield.vst3.clex')?.isAtLeast('0.4.3') ?? false;
     */
    isAtLeast(minVersion: string): boolean;
    get categories(): string[];
}
declare class Plugins extends Collection<Plugin> {
    /** Case-insensitive match on name, short names, manufacturer or id. */
    find(query: string): Plugin[];
    byCategory(category: string): Plugin[];
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
    unmetRequirements(requirements: readonly PluginRequirement[], options?: {
        blockingOnly?: boolean;
    }): PluginRequirement[];
    /** All categories in the catalog, sorted. */
    get categories(): string[];
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
    query(options?: PluginQueryOptions): Promise<PluginRow[]>;
    /** Ask the engine to rescan installed plugins. */
    rescan(): Promise<unknown>;
}

/**
 * An insert slot's name, as LUNA writes it in `insert_type` and in the effect's path.
 * `'instrument'` is an instrument track's instrument slot (`effects/instrument`), ahead of the
 * `effect_N` inserts. {@link isRecordFxSlot} and {@link insertSlotForAlias} help with the rest.
 */
type InsertSlot = 'console' | 'instrument' | 'reserved_0' | `effect_${number}` | `record_fx_${number}` | 'sidechain_filter' | (string & {});
/** The engine reports a missing plugin with this error string. */
declare const PLUGIN_ERROR_MISSING = "mixer.missing_plug-in";
declare class Effect extends Node {
    private readonly sessionUid;
    private readonly channelUid;
    readonly uid: Prop<string>;
    readonly insertType: Prop<InsertSlot>;
    /** Plugin id (for example `com.uaudio.uadx.1176`), or `null` when the slot is empty. */
    readonly pluginId: Prop<string | null>;
    readonly pluginName: Prop<string | null>;
    /** Reported by the engine; not the bypass state. See {@link in}. */
    readonly enabled: Prop<boolean>;
    readonly pluginPower: Prop<boolean>;
    readonly presetName: Prop<string | null>;
    readonly presetUid: Prop<string | null>;
    readonly presetDirty: Prop<boolean>;
    readonly frozen: Prop<boolean>;
    readonly sidechainAllowed: Prop<boolean>;
    readonly sidechainInUse: Prop<boolean>;
    readonly pluginError: Prop<string | null>;
    readonly pluginLicenseError: Prop<string | null>;
    /** Name of the control that carries the IN/OUT state, or `null` if the plugin has none. */
    readonly bypassControl: Prop<string | null>;
    /** Polarity of {@link bypassControl}: true when a nonzero value means IN; false or `null` when zero means IN. */
    readonly bypassControlActiveLow: Prop<boolean | null>;
    /** IN (true) or bypassed (false); `undefined` until known or when the plugin has no bypass control. */
    readonly in: Prop<boolean | undefined>;
    /**
     * The plugin instance id, set once the plugin has loaded (fact 86). `plugin_name` is not a
     * load signal: it can stay null for a loaded plugin; the catalog has the name.
     */
    readonly instanceId: Prop<number | null>;
    /** True once a plugin is loaded in this slot without an error. */
    readonly loaded: Prop<boolean>;
    /**
     * True while LUNA has this plugin's editor window open, whoever opened it (fact 126).
     * `undefined` until known and on a LUNA that does not report editor windows. Follows LUNA
     * after `session.ready()`.
     */
    readonly editorOpen: Prop<boolean | undefined>;
    /**
     * Every child of the slot's `controls` folder, including parameters a cleared plugin left
     * behind (fact 86). Prefer {@link params}.
     */
    readonly controls: Controls;
    get isEmpty(): boolean;
    /** True for the user-facing `effect_N` slots. */
    get isEffectSlot(): boolean;
    /** The control carrying the IN/OUT state, if the plugin has one. */
    get bypass(): Control | undefined;
    /**
     * The plugin's live parameters, in engine order: the `controls` that are `initialized`.
     * A cleared slot keeps its old parameters as ghosts (fact 86); they are left out here.
     * Writes are touch-bracketed like any control, which makes them undoable (fact 85).
     *
     * @example
     * await slot.controls.load();
     * for (const p of slot.params) console.log(p.name.value, p.display.value);
     */
    get params(): Control[];
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
    setPlugin(pluginId: string, options?: {
        pluginName?: string;
        presetName?: string;
        presetUid?: string;
        wait?: boolean;
        timeoutMs?: number;
    }): Promise<unknown>;
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
    validPlugins(options?: Omit<PluginQueryOptions, 'insertType' | 'sessionUid' | 'channelUid'>): Promise<PluginRow[]>;
    /** Remove the plugin from this slot. */
    clear(): Promise<unknown>;
    /**
     * Resolve once the slot holds a loaded plugin (it has an instance id) or reports a
     * `plugin_error` (fact 86). With `pluginId`, wait for that plugin rather than whatever
     * the slot held before. Rejects with {@link RequestTimeout} after `timeoutMs`.
     *
     * @example
     * await slot.waitForPlugin();
     * if (slot.pluginError.value) show(slot.pluginError.value);
     */
    waitForPlugin(timeoutMs?: number, pluginId?: string): Promise<void>;
    /** Set IN (true) or bypass (false) through the engine's undoable, group-aware path. */
    setIn(on: boolean, contextType?: string): Promise<unknown>;
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
    setPower(on: boolean, contextType?: string): Promise<void>;
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
    moveTo(destination: Effect, options?: {
        timeoutMs?: number;
    }): Promise<void>;
    /**
     * Copy the plugin in this slot, with its state, parameters, automation and preset, to
     * `destination`, leaving this slot as it is. See {@link moveTo} for the rules.
     *
     * @example
     * await vocal.effects.byId('effect_0')!.copyTo(backing.effects.byId('effect_0')!);
     */
    copyTo(destination: Effect, options?: {
        timeoutMs?: number;
    }): Promise<void>;
    private transfer;
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
    openEditor(options?: {
        wait?: boolean;
        timeoutMs?: number;
    }): Promise<void>;
    /**
     * Close this plugin's editor window in LUNA, if it is open. Resolves once
     * {@link editorOpen} is false; see {@link openEditor}.
     *
     * @example
     * if (slot.editorOpen.value) await slot.closeEditor();
     */
    closeEditor(options?: {
        wait?: boolean;
        timeoutMs?: number;
    }): Promise<void>;
    private settleEditor;
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
    loadPreset(presetUid: string): Promise<void>;
    /** Step through the plugin's presets. */
    nextPreset(): Promise<unknown>;
    previousPreset(): Promise<unknown>;
    protected release(): void;
}

declare class Meter extends Node {
    /** Current level per stream, 0..1. */
    readonly level: Prop<number[]>;
    /** Held peak per stream, 0..1. */
    readonly peak: Prop<number[]>;
    /** Clip indicator per stream (0/1). */
    readonly clip: Prop<number[]>;
    readonly enabled: Prop<boolean>;
    readonly numStreams: Prop<number>;
    private listeners;
    private unwatch;
    /** Streams metered: `num_streams` once read, else the length of the level array, at least 1. */
    get streams(): number;
    /**
     * The highest current level across streams, 0..1: one number for a single bar.
     *
     * @example
     * track.meter.onChange(() => (bar.style.height = `${track.meter.max * 100}%`));
     */
    get max(): number;
    /** Called on every meter push while subscribed. */
    onChange(listener: () => void): Unsubscribe;
    protected release(): void;
}

/** One row of an output's `assignments` property, as LUNA publishes it. */
interface OutputAssignment {
    /** The destination bus uid (or hardware output id); `null` once that bus was deleted. */
    value: string | null;
    name: string;
    stem_format: string;
    /** The destination's `bus_type` (`aux`, `master`, `cue_0`, ...). */
    type?: string | null;
    /** `device.missing_bus` once the destination bus was deleted. */
    connection_error?: string | null;
    sidechain_in_use?: string;
}
/** Where an output goes. `uid` is the assignment's, the handle {@link Output.unassign} takes. */
interface Destination {
    readonly uid: string;
    /** The destination bus, or `undefined` once that bus has been deleted (`error` is then set). */
    readonly busUid: string | undefined;
    readonly name: string;
    /** The bus's `bus_type` (`aux`, `master`, `cue_0`...), when LUNA reports it. */
    readonly busType: string | undefined;
    readonly stereo: boolean;
    /** `device.missing_bus` when the bus is gone; `undefined` while connected. */
    readonly error: string | undefined;
}
/** Eight sends per channel, `send_0`..`send_7`. */
declare const SEND_COUNT = 8;
/** Four cue outputs per channel, `cue_0`..`cue_3`. */
declare const CUE_COUNT = 4;
declare class Output extends Node {
    readonly uid: Prop<string>;
    readonly outputType: Prop<string>;
    /** Raw destination rows. Prefer {@link destinations}, which carries the handle to delete one. */
    readonly assignments: Prop<OutputAssignment[]>;
    /**
     * Every destination, live, in LUNA's order. Usually zero or one; {@link assign} appends.
     *
     * @example
     * send.destinations.onChange(() => label.textContent = send.destinations.value.map((d) => d.name).join(', '));
     */
    readonly destinations: Prop<readonly Destination[]>;
    /** The first destination, or `undefined` when unrouted. */
    readonly destination: Prop<Destination | undefined>;
    /** The first destination's bus uid, or `null` when unrouted. LUNA's own `bus_uid` property is always null. */
    readonly busUid: Prop<string | null>;
    readonly controls: Controls;
    readonly meter: Meter;
    private objectsRequested;
    /** The current destinations; `Prop.value` is typed as possibly undefined. */
    private list;
    private requestObjects;
    /** Whether the output routes anywhere. */
    get assigned(): boolean;
    /**
     * True on a stereo channel, where pan is two controls, `pan_left` and `pan_right`
     * (fact 84). Read from the owning channel's `stem_format`, or from the controls when
     * they are loaded.
     */
    get stereo(): boolean;
    get gain(): Control;
    /**
     * The pan control: `pan` on a mono channel; on a stereo channel `pan_left`, with
     * {@link panRight} beside it (fact 84). Use {@link pans} to handle both.
     *
     * @example
     * for (const p of track.main.pans) p.normalized.set(0.5);
     */
    get pan(): Control;
    /** Left pan on a stereo channel; the one pan on a mono channel. */
    get panLeft(): Control;
    /** Right pan on a stereo channel; the one pan on a mono channel. */
    get panRight(): Control;
    /** Every pan control: one on a mono channel, left and right on a stereo one. */
    get pans(): Control[];
    get mute(): Control;
    /** Pre- or post-fader, for a send. A control, not a node property. */
    get preFader(): Control;
    /** Send enable, for a send. A control, not a node property. */
    get enabled(): Control;
    /** `send_0`..`send_7`. */
    get isSend(): boolean;
    /** `cue_0`..`cue_3`. Cue outputs are routed by LUNA and refuse the routing commands. */
    get isCue(): boolean;
    /** The slot number for a `send_N` or `cue_N` output, `undefined` for `main`. */
    get index(): number | undefined;
    /**
     * Who owns this output, read off its own path
     * (`/sessions/<session>/{tracks,buses}/<channel>/outputs/<id>`), so the routing commands
     * can name the session and channel without every caller threading them through.
     */
    private owner;
    /** Wait for the routing to show an edit; the assignment verbs can answer before the model moves. */
    private settled;
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
    assign(bus: string | {
        readonly id: string;
    }): Promise<string>;
    /**
     * Remove one destination (a {@link Destination} or its uid), or every one when called
     * with nothing. One "Delete Output Assignment" entry per removal; nothing to remove is a
     * no-op. Resolves once the destinations are gone.
     *
     * @example await track.outputs.byId('send_0').unassign();
     */
    unassign(target?: string | Destination): Promise<void>;
    /**
     * Replace every destination with `bus`: unassign, then assign, because the engine's
     * forward verb only appends (fact 43). One undo entry named `name` when the send was
     * already routed; inside a caller's `session.transaction()` it joins that batch.
     *
     * @example await track.outputs.byId('send_0').retarget(delayBus.id);
     */
    retarget(bus: string | {
        readonly id: string;
    }, name?: string): Promise<string>;
    /**
     * Move this send's routing and control values to another channel's slot (`move_send`) —
     * the same slot number by default — or copy them with `copy: true`. One "Move Send"
     * entry. Resolves once this slot has emptied (or, for a copy, once LUNA has answered).
     *
     * @example await drums.outputs.byId('send_0').moveTo(bass.id);
     */
    moveTo(channel: string | {
        readonly id: string;
    }, options?: {
        index?: number;
        copy?: boolean;
    }): Promise<void>;
    protected release(): void;
}

type AutomationMode = 'off' | 'read' | 'write' | 'touch' | 'latch';
type StemFormat = 'mono' | 'stereo' | (string & {});
declare abstract class Channel extends Node {
    /** Uid of the owning session, for session-level commands that name this channel. */
    readonly sessionUid: string;
    readonly uid: Prop<string>;
    readonly name: WritableProp<string>;
    readonly order: Prop<number>;
    /** ARGB packed integer as the engine stores it. */
    readonly color: WritableProp<number>;
    readonly comments: WritableProp<string>;
    readonly stemFormat: Prop<StemFormat>;
    readonly automationMode: Prop<AutomationMode>;
    readonly folderUid: Prop<string | null>;
    readonly frozen: Prop<boolean>;
    readonly enabled: Prop<boolean>;
    /** Strip-level controls (`solo`, trims, preamp). */
    readonly controls: Controls;
    readonly outputs: Collection<Output>;
    /** The `main` output, always present. */
    readonly main: Output;
    /** All insert slots, including `console` and `sidechain_filter`. See {@link effectSlots}. */
    readonly effects: Collection<Effect>;
    /** The user-facing `effect_0`..`effect_N` slots in order. */
    get effectSlots(): Effect[];
    /** Effect slots that hold a plugin. */
    get loadedEffects(): Effect[];
    /** Load a plugin into the first empty effect slot (or a named slot). */
    insert(pluginId: string, slot?: string): Promise<Effect | undefined>;
    /**
     * Set this track's or bus's automation mode (`off | read | write | touch | latch`) in one
     * undo step. `set_automode_on_tracks` takes track and bus uids alike (fact 167);
     * {@link automationMode} follows on LUNA's push.
     *
     * @example
     * await track.setAutomationMode('touch');
     * await session.master!.setAutomationMode('read');
     */
    setAutomationMode(mode: AutomationModeName): Promise<unknown>;
    /** Main output gain. */
    get gain(): Control;
    /** Main output pan. */
    get pan(): Control;
    /** Main output mute. */
    get mute(): Control;
    /** Main output level meter. */
    get meter(): Meter;
    /** Load this strip's properties plus the main output's controls in two round trips. */
    loadStrip(): Promise<void>;
    protected release(): void;
}

/**
 * The preset library: the `/presets` node's `query` command over the workspace database
 * (fact 98). Presets are addressed by uid; `find` turns a plugin id and a preset name
 * into that uid so it can be passed to {@link Effect.setPlugin} or {@link Effect.loadPreset}.
 *
 * Preset selection, as LUNA's own plugin pages offer it, is three things over one plugin's
 * presets: search text that filters by name, tags picked from the plugin's tag groups, and
 * recommendations that UA Assistant ranks from the same search text (facts 120-121).
 * {@link Presets.selection} keeps all three current for a page.
 *
 * @example
 * const preset = await luna.presets.find('uaudio_qi', '4-Band EQ');
 * await slot.setPlugin('uaudio_qi', { presetName: preset?.name, presetUid: preset?.uid });
 */

interface PresetRow {
    uid: string;
    name: string;
    version: number;
    favorite: boolean;
    factory: boolean;
    path: string;
    /** The preset's tags. Present only when the query asked for them (`withTags`). */
    tags?: string[];
    /**
     * True for an instrument plugin's preset listed among track presets, false for a track
     * preset. Present only when the query asked for them (`includeInstrumentPresets`, fact 132).
     */
    isInstrumentPreset?: boolean;
    /**
     * For an instrument preset, the plugin it belongs to: the instrument whose factory or user
     * preset folder holds it (fact 132). Absent when no installed instrument's folder does.
     */
    pluginId?: string;
    /** That plugin's name, for example `Moog Minimoog Synth`. */
    pluginName?: string;
    /**
     * The preset's description, `''` when it has none. Present only when the query asked for
     * it (`withDescriptions`, fact 175).
     */
    description?: string;
}
/** One plugin a track preset uses, from {@link Presets.trackPresetPlugins}. */
interface TrackPresetPlugin {
    pluginId: string;
    /** The name the preset saved, which may differ from the installed plugin's. */
    name: string;
}
interface PresetQueryOptions {
    /** The plugin whose presets to list. One of `pluginId` or `deviceTypeId` is required. */
    pluginId?: string;
    /** A device type (for example `track`) instead of a plugin. */
    deviceTypeId?: string;
    /** Case-insensitive substring to match against preset names. */
    search?: string;
    /** Only presets carrying these tags: all of them, or any with `matchAnyTag` (fact 120). */
    tags?: string | readonly string[];
    /** With several `tags`, match presets carrying any of them rather than all. */
    matchAnyTag?: boolean;
    /** Include each preset's tags in the rows. */
    withTags?: boolean;
    /** Include each preset's `description`: one more read per plugin or device type listed (fact 175). */
    withDescriptions?: boolean;
    /** Only favorites. */
    favorite?: boolean;
    /** Maximum number of rows. */
    limit?: number;
    /**
     * With `deviceTypeId: 'track'`, also list the presets of every installed instrument plugin,
     * marked `isInstrumentPreset`. An `Instrument` tag then selects instrument track presets and
     * every instrument preset; the other tags must match either kind (fact 132).
     */
    includeInstrumentPresets?: boolean;
}
/**
 * The categories LUNA's track preset browser offers. They are ordinary preset tags, which
 * LUNA writes when a track preset is saved (fact 132). No category means all of them.
 */
declare const TRACK_PRESET_CATEGORIES: readonly ["Audio", "Instrument", "Bus", "Multi-Track"];
type TrackPresetCategory = (typeof TRACK_PRESET_CATEGORIES)[number];
/**
 * A named group of a plugin's preset tags, for example Paradise's `TYPE`, `GENRE` and
 * `DESCRIPTION`. LUNA keeps them as categories holding sub-categories holding tags (fact 120);
 * a group is one sub-category.
 */
interface PresetTagGroup {
    /** The sub-category uid. */
    uid: string;
    /** The sub-category name, for example `GENRE`. */
    name: string;
    /** The category it sits in, for example `Default`. */
    category: string;
    categoryUid: string;
    /** Tags in LUNA's order. */
    tags: string[];
}
/** One preset UA Assistant recommends for a search, best first (fact 121). */
interface PresetRecommendation {
    uid: string;
    name: string;
    /** The assistant's reciprocal-rank-fusion score, which orders the answer; higher is better. Compare within one answer only. */
    score: number;
    /** The keyword half of the hybrid search, when the assistant reports it. */
    keywordScore?: number;
    /** The semantic half of the hybrid search, when the assistant reports it; -1 when the preset was found by keyword alone. */
    semanticScore?: number;
}
declare class Presets extends Node {
    private instrumentList;
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
    query(options?: PresetQueryOptions): Promise<PresetRow[]>;
    /**
     * Fill each row's `description` from its preset node (fact 175): the query does not
     * return it, so read each owner's `presets` folder once, description only.
     */
    private describeRows;
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
    setFavorite(preset: string | (Pick<PresetRow, 'uid'> & Partial<Pick<PresetRow, 'pluginId' | 'favorite'>>), favorite: boolean, options?: {
        pluginId?: string;
        deviceTypeId?: string;
    }): Promise<void>;
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
    trackPresetPlugins(preset: string | Pick<PresetRow, 'uid'>): Promise<TrackPresetPlugin[] | undefined>;
    /** Give each instrument preset its plugin, by the preset folder that holds it (fact 132). */
    private namePlugins;
    /**
     * The installed instruments with their preset folders, read once and kept: LUNA's own
     * browser asks for the same list. {@link forgetInstruments} reads it again next time.
     */
    private instruments;
    /** Read the installed instruments again on the next query, for example after one was installed. */
    forgetInstruments(): void;
    /**
     * The plugin's preset name exactly `name` (case-insensitive), or `undefined`. When the
     * library holds a user preset and a factory preset of the same name, the user one wins,
     * matching what LUNA's preset browser opens.
     *
     * @example
     * const preset = await luna.presets.find('uaudio_qi', '4-Band EQ');
     * preset?.uid;
     */
    find(pluginId: string, name: string): Promise<PresetRow | undefined>;
    /**
     * The plugin's tag groups, in LUNA's order (fact 120). Empty for a plugin whose presets
     * are not tagged.
     *
     * @example
     * const groups = await luna.presets.tagGroups('uaudio_paradise_guitar_studio');
     * groups.map((g) => g.name); // ['TYPE', 'GENRE', 'DESCRIPTION']
     */
    tagGroups(pluginId: string): Promise<PresetTagGroup[]>;
    /**
     * The tag groups LUNA's track preset browser shows: the track presets' own groups and every
     * installed instrument plugin's, merged by group name, without the category tags (`Audio`,
     * `Instrument`, `Bus`, `Multi-Track`), which {@link TRACK_PRESET_CATEGORIES} lists (fact 132).
     *
     * @example
     * const groups = await luna.presets.trackTagGroups();
     * groups.map((g) => g.name); // ['GENRE', 'TYPE', ...]
     */
    trackTagGroups(): Promise<PresetTagGroup[]>;
    private groupsAt;
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
    recommend(pluginId: string, text: string): Promise<PresetRecommendation[]>;
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
    selection(pluginId: string, options?: PresetSelectionOptions): PresetSelection;
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
    trackSelection(options?: TrackPresetSelectionOptions): TrackPresetSelection;
}
/**
 * `/assistant`: whether UA Assistant is connected to LUNA. Preset recommendations need it
 * (fact 121). Call `watch()` to follow it.
 *
 * @example
 * const { ready } = luna.assistant.watch();
 * await ready;
 * luna.assistant.enabled.value; // true while UA Assistant is connected
 */
declare class Assistant extends Node {
    /** True while UA Assistant is connected to LUNA. */
    readonly enabled: Prop<boolean>;
}
interface PresetSelectionOptions {
    /** Most rows in `presets`. Default: all of them. */
    limit?: number;
    /** Most rows in `recommendations`. Default 5. */
    maxRecommendations?: number;
    /** Ask UA Assistant for recommendations. Default true. */
    recommend?: boolean;
    /** Quiet time after a change before the list is queried, in ms. Default 100. */
    queryDelayMs?: number;
    /** Quiet time after a change before recommendations are asked for, in ms. Default 300. */
    recommendDelayMs?: number;
}
interface TrackPresetSelectionOptions {
    /** The category to start on. Default `null`: all of them. */
    category?: TrackPresetCategory | null;
    /** Most rows in `presets`. Default: all of them. */
    limit?: number;
    /** Quiet time after a change before the list is queried, in ms. Default 100. */
    queryDelayMs?: number;
}
/**
 * What {@link PresetSelection} and {@link TrackPresetSelection} share: search text and tags
 * in, a list of presets out. Requests are debounced, and a reply that a newer request
 * overtook is dropped.
 */
declare abstract class PresetSelectionBase {
    protected readonly client: Client;
    private readonly base;
    /** Search text. Filters `presets` by name; for a plugin's presets, it is also what recommendations are asked for. */
    readonly search: WritableProp<string>;
    /** Selected tags. */
    readonly tags: WritableProp<readonly string[]>;
    /** The tag groups, once {@link ready}. */
    readonly groups: Prop<readonly PresetTagGroup[]>;
    /** Presets matching the search text and tags, with their tags. */
    readonly presets: List<PresetRow>;
    /** True while a request is in flight or waiting. */
    readonly loading: Prop<boolean>;
    /** The last list query's failure, or `null`. */
    readonly error: Prop<UAError | null>;
    protected readonly searchCell: Cell<string>;
    protected readonly tagsCell: Cell<readonly string[]>;
    private readonly groupsCell;
    private readonly presetsCell;
    private readonly loadingCell;
    private readonly errorCell;
    protected readonly presetsApi: Presets;
    protected readonly releases: Unsubscribe[];
    private readonly timers;
    private readonly gens;
    private inFlight;
    private waiters;
    private readyPromise;
    private isDisposed;
    protected constructor(client: Client, base: {
        limit?: number;
        queryDelayMs?: number;
    });
    /** The tag groups to offer. */
    protected abstract loadGroups(): Promise<PresetTagGroup[]>;
    /** The list query for the current inputs, without `limit`. */
    protected abstract listQuery(): PresetQueryOptions;
    /** A writable input over `cell`: setting a new value queries again. */
    protected input<T>(cell: Cell<T>): WritableProp<T>;
    /**
     * Read the tag groups and the first list (and, for a plugin's presets, start following UA
     * Assistant's connection). Idempotent.
     *
     * @example
     * await sel.ready();
     */
    ready(): Promise<void>;
    protected start(): Promise<void>;
    /**
     * Add `tag` to the selection, or remove it if selected.
     *
     * @example
     * await sel.toggleTag('Clean');
     */
    toggleTag(tag: string): Promise<void>;
    /** Clear the search text and the selected tags. */
    clear(): Promise<void>;
    /** Query again with the current inputs, for example after presets were saved or deleted. */
    refresh(): void;
    /**
     * Resolves once nothing is waiting or in flight and the lists match the inputs.
     *
     * @example
     * await sel.search.set('lion');
     * await sel.settled();
     */
    settled(): Promise<void>;
    /** Stop following and drop pending requests. */
    dispose(): void;
    get disposed(): boolean;
    protected get started(): boolean;
    private get idle();
    /** An input moved: query again after the quiet time. */
    protected changed(): void;
    /**
     * Run `job` after `delayMs`, replacing a pending job under the same `key`. `current()` turns
     * false once a newer job for the key is scheduled, so a stale reply can be dropped.
     */
    protected schedule(key: string, delayMs: number, job: (current: () => boolean) => Promise<void>): void;
    private runQuery;
    /** Count `work` as in flight until it settles. */
    protected track<T>(work: Promise<T>): Promise<T>;
    private wake;
}
/** Created by {@link Presets.selection}. */
declare class PresetSelection extends PresetSelectionBase {
    readonly pluginId: string;
    private readonly options;
    /** Match presets carrying any selected tag rather than all of them. Default false. */
    readonly matchAnyTag: WritableProp<boolean>;
    /** UA Assistant's picks for the search text, among presets carrying the tags. Best first. */
    readonly recommendations: List<PresetRecommendation>;
    /** True while UA Assistant is connected, so recommendations can come. */
    readonly recommendationsAvailable: Prop<boolean>;
    /** The last recommendation request's failure, or `null`. */
    readonly recommendationError: Prop<UAError | null>;
    private readonly anyCell;
    private readonly recsCell;
    private readonly recErrorCell;
    /** Uids carrying the selected tags, by tag selection, for filtering recommendations. */
    private taggedUids;
    /** Query again with the current inputs, for example after presets were saved or deleted. */
    refresh(): void;
    protected start(): Promise<void>;
    protected loadGroups(): Promise<PresetTagGroup[]>;
    protected listQuery(): PresetQueryOptions;
    protected changed(): void;
    private get wantsRecommendations();
    private scheduleRecommendations;
    private runRecommendations;
    /** Every preset uid carrying `tags`, ignoring the search text. Cached per tag selection. */
    private tagged;
}
/** Created by {@link Presets.trackSelection}. */
declare class TrackPresetSelection extends PresetSelectionBase {
    /**
     * The category, one of {@link TRACK_PRESET_CATEGORIES}, or `null` for all of them. With
     * `null` or `Instrument`, instrument plugins' presets are listed too (fact 132).
     */
    readonly category: WritableProp<TrackPresetCategory | null>;
    private readonly categoryCell;
    /** Query again with the current inputs, and read the installed instruments again. */
    refresh(): void;
    /** True when the current category lists instrument plugins' presets as well. */
    get includesInstrumentPresets(): boolean;
    protected loadGroups(): Promise<PresetTagGroup[]>;
    protected listQuery(): PresetQueryOptions;
}

type BusType = 'master' | 'aux' | 'input' | 'talkback' | 'loopback' | 'headphone' | `cue_${number}` | string;
/**
 * A bus's folder mode (fact 136). `'summing'`: a folder track whose children's main outputs go
 * to it, so it is their bus. `'container'`: a folder that only groups; its children route past
 * it to the nearest summing folder above, else the master. `'none'`: an ordinary bus.
 */
type FolderMode = 'none' | 'summing' | 'container';
declare class Bus extends Channel {
    readonly busType: Prop<BusType>;
    readonly folderMode: Prop<FolderMode>;
    /** The uid of the track preset last applied to this bus, or null (fact 169). */
    readonly presetUid: Prop<string | null>;
    /** That preset's name, or null. */
    readonly presetName: Prop<string | null>;
    get isMaster(): boolean;
    /** A folder is an aux bus whose folder mode is not `none`. */
    get isFolder(): boolean;
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
    setFolderMode(mode: FolderMode): Promise<void>;
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
    delete(): Promise<void>;
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
    deleteWithContents(): Promise<void>;
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
    loadPreset(preset: string | Pick<PresetRow, 'uid'>): Promise<void>;
    /** Resolve once none of `ids` is listed as a track or bus of the session. */
    private settleGone;
}

/**
 * One row of a clip's MIDI table: a single MIDI message at a clip-relative tick.
 *
 * This is the shape read back from the engine. {@link MidiEvent} is the (smaller) shape
 * accepted when writing.
 */
interface MidiRow {
    /** The engine's row id: this row's identity, stable across moves and trims. */
    readonly rowid: number;
    /** Ticks from the clip's start (fact 41), `TICKS_PER_BEAT` per quarter note. */
    readonly tick: number;
    /** Status byte with the channel in it: `0x90`-`0x9f` note on, `0xb0`-`0xbf` CC, and so on. */
    readonly status: number;
    /** 0-based channel, `status & 0x0f`. */
    readonly channel: number;
    readonly data1: number;
    readonly data2: number;
    /** `false` is LUNA's per-note mute on a note-on row. */
    readonly enabled: boolean;
    /**
     * A SysEx row's whole message, `0xf0` through `0xf7` (`status` is `0xf0`, `data1` and `data2`
     * are 0); `undefined` on every other row, and on LUNA builds without SysEx (fact 139).
     */
    readonly sysex?: readonly number[];
}
/**
 * A note-on row paired with the note-off that ends it.
 *
 * `startTick` and `stopTick` are clip-relative: they count from the clip's start, not from
 * the start of the session (fact 41). A note at the clip's downbeat has `startTick` 0
 * wherever the clip sits, and moving the clip does not change it. For a position on the
 * session timeline add the clip's start.
 *
 * @example
 * const sessionTick = (clip.start.value ?? 0) + note.startTick;
 */
interface Note {
    /** The note-on row id: the note's identity, and its `List.byId` key. */
    readonly rowid: number;
    /** The note-off row id, `undefined` for an unterminated note-on. */
    readonly offRowid: number | undefined;
    /** MIDI note number, 0-127. */
    readonly pitch: number;
    readonly channel: number;
    /** Ticks from the clip's start, not the session's; add `clip.start.value` for a session tick. */
    readonly startTick: number;
    /** Ticks from the clip's start, like `startTick`; `undefined` when no note-off follows. */
    readonly stopTick: number | undefined;
    readonly velocity: number;
    readonly offVelocity: number | undefined;
    readonly muted: boolean;
}
/** The wire shape of `midi/table/row_data`: a whole table, or one delta against it (fact 40). */
interface MidiRowData {
    /** `update` is a whole table; `added`, `changed` and `deleted` are deltas. */
    operation: 'update' | 'added' | 'changed' | 'deleted' | (string & {});
    row_ids: number[];
    enabled?: boolean[];
    midi_data?: number[];
    tick?: number[];
    /** A SysEx row's bytes, `null` on other rows; absent before LUNA stored SysEx (fact 139). */
    sysex?: (number[] | null)[];
}
/** Unpack the three MIDI bytes the engine packs into one number (fact 39). */
declare function decodeMidiData(packed: number): {
    status: number;
    data1: number;
    data2: number;
};
/** Pack three MIDI bytes the way the engine's table stores them (fact 39). */
declare function encodeMidiData(status: number, data1: number, data2?: number): number;
/**
 * Pair note-on rows with the next note-off of the same channel and pitch, in tick order.
 * Pure, and exported because a page that draws its own lanes often wants it directly.
 *
 * @example
 * const notes = Luna.pairNotes(midi.events.items);
 */
declare function pairNotes(rows: readonly MidiRow[]): Note[];
/**
 * What a MIDI edit needs to reach LUNA's edit context: the session it lives in, the playlist
 * that holds the clip, and the clip's own start tick (the selection is in absolute ticks).
 */
interface MidiHost {
    readonly sessionPath: string;
    readonly sessionUid: string;
    readonly playlistUid: string;
    readonly clipUid: string;
    /** The clip's timeline start, ticks, or `undefined` before it loads. */
    readonly startTick: () => number | undefined;
    /** The kind of `session.transaction()` open, if any. */
    readonly transactionMode?: (() => TransactionMode | undefined) | undefined;
}
/**
 * The MIDI of one clip, reached as `clip.midi`. Both lists notify once per frame, like
 * every other {@link List}. An audio clip's table is empty.
 */
declare class MidiClip extends Node {
    private readonly origin;
    /** Every row, in tick order. `byId` takes a row id. */
    readonly events: List<MidiRow>;
    /** Paired notes, in start order. `byId` takes a note-on row id. */
    readonly notes: List<Note>;
    private readonly rows;
    private readonly eventsCell;
    private readonly notesCell;
    private readonly releases;
    /** Deltas applied since the last whole table, stamped so a re-read can discard older ones. */
    private deltas;
    /**
     * The last whole table and the version it arrived at. Kept here rather than read back
     * from the cell, because the cell also receives the deltas (the store applies every push
     * to it), so its value is not necessarily a whole table.
     */
    private table;
    private tableVersion;
    private readyPromise;
    /** The clip this table belongs to, and how to reach its session's edit context. */
    private readonly host;
    private contextView;
    /** The table tick that sits at the clip's start (fact 41). */
    private get shift();
    /**
     * Read the table and start following edits. Idempotent, like `Node.load`.
     *
     * @example
     * await clip.midi.ready();
     */
    ready(): Promise<void>;
    private seed;
    private onEvent;
    private replace;
    private apply;
    private publish;
    /** The session's `main` edit context, for the selection the note verbs act through. */
    private get context();
    /**
     * Set several notes' velocities in one post: one "Change Velocities" undo entry for the
     * whole batch, where {@link setVelocity} in a loop would be one entry per note. `off`
     * targets each note's note-off row instead of its note-on.
     *
     * @example
     * // Scale every velocity in the clip by a percentage, as one undo entry.
     * await clip.midi.setVelocities(clip.midi.notes.items.map((n) => ({ note: n, velocity: Math.max(1, Math.min(127, Math.round(n.velocity * 1.25))) })));
     */
    setVelocities(changes: ReadonlyArray<{
        note: Note | number;
        velocity: number;
    }>, options?: {
        off?: boolean;
    }): Promise<void>;
    /** Set one note's velocity. `off` targets the note-off row. One "Change Velocities" undo entry. */
    setVelocity(note: Note | number, velocity: number, options?: {
        off?: boolean;
    }): Promise<void>;
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
    setMuted(notes: ReadonlyArray<Note | number>, muted: boolean): Promise<void>;
    /**
     * Delete notes: `clear` over a selection of exactly these notes, one undo entry, with the
     * user's selection restored afterwards. Inside a `session.transaction()` batch it joins the
     * batch's undo step, so deleting notes and writing their replacements with
     * {@link Clip.addNotes} undoes as one.
     *
     * @example
     * await clip.midi.deleteNotes([clip.midi.notes.items[0]!]);
     */
    deleteNotes(notes: ReadonlyArray<Note | number>): Promise<void>;
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
    moveEvents(rows: ReadonlyArray<MidiRow | number>, byTicks: number): Promise<void>;
    private resolveOne;
    private resolve;
    /** Save the user's selection, select `targets` (absolute ticks), run `fn`, restore. */
    private withSelection;
    /**
     * Wait for an edit to show in the lists. Inside a batch transaction LUNA holds the deltas,
     * and answers reads of the table from before the batch, until the commit (fact 74): there
     * is nothing to wait for yet.
     */
    private settleEdit;
    private settleOptions;
    /**
     * Re-read the whole table. LUNA holds deltas back inside a batch transaction, so call
     * this after one if the lists look behind; deltas that arrive later still apply.
     */
    refresh(): Promise<void>;
    protected release(): void;
}

/** LUNA's fade shapes. Another string is passed through as LUNA sent it. */
type FadeShape = 'linear' | 'equal_power' | 'log';
/** One fade of a compiled clip, as LUNA applies it (fact 116). Ticks are absolute. */
interface CompiledFade {
    /** The fade row, for editing it. */
    readonly uid: string;
    readonly start: number;
    readonly stop: number;
    readonly shape: FadeShape | string;
    /** -1 to 1; 0 is the shape's own curve. */
    readonly curvature: number;
    /** True when this fade is one side of a crossfade with {@link contributorClipUid}. */
    readonly crossfade: boolean;
    /** The clip on the other side of a crossfade; `undefined` for a plain fade. */
    readonly contributorClipUid: string | undefined;
}
/** A compiled clip's state at one moment, as plain data: what a view draws from. */
interface CompiledClipSnapshot {
    readonly id: string;
    readonly clipUid: string | undefined;
    readonly name: string | undefined;
    readonly start: number | undefined;
    readonly stop: number | undefined;
    readonly sourceStart: number | undefined;
    readonly sourceStop: number | undefined;
    readonly fullStart: number | undefined;
    readonly fullStop: number | undefined;
    readonly fadeIn: CompiledFade | undefined;
    readonly fadeOut: CompiledFade | undefined;
    readonly reportsFades: boolean;
    readonly renderSourceUid: string | null | undefined;
    readonly renderSourceStart: number | undefined;
    readonly renderSourceStop: number | undefined;
    readonly needsRender: boolean | undefined;
}
declare class CompiledClip extends Node {
    /** The clip this segment is cut from; look it up with `playlist.clips.byId`. */
    readonly clipUid: Prop<string>;
    readonly name: Prop<string>;
    /** Where this segment starts playing, ticks. */
    readonly start: Prop<number>;
    /** Where this segment stops playing, ticks. */
    readonly stop: Prop<number>;
    /** Source offset at `start`, nanoseconds. */
    readonly sourceStart: Prop<number>;
    /** Source offset at `stop`, nanoseconds. */
    readonly sourceStop: Prop<number>;
    /**
     * `start` moved earlier by an incoming crossfade, where this segment's audio already sounds
     * under the one before it. Equal to `start` without one, and on a LUNA that does not report
     * fades.
     */
    readonly fullStart: Prop<number>;
    /** `stop` moved later by an outgoing crossfade. Equal to `stop` without one. */
    readonly fullStop: Prop<number>;
    readonly fadeIn: Prop<CompiledFade | undefined>;
    readonly fadeOut: Prop<CompiledFade | undefined>;
    /**
     * Whether this LUNA reports fades on compiled clips. When false, `fadeIn` and `fadeOut` are
     * always `undefined` because LUNA does not say, not because there are none; draw no fades
     * and offer no fade editing.
     */
    readonly reportsFades: Prop<boolean>;
    /**
     * The rendering this segment plays when its clip is time-stretched: LUNA renders each
     * compiled piece of a clip on its own, so a clip split by one on top has a render per piece
     * and its own `renderSourceUid` names only one of them (fact 116). `null` when this segment
     * is not rendered; `undefined` on a LUNA that does not report it.
     */
    readonly renderSourceUid: Prop<string | null>;
    /** This segment's range in {@link renderSourceUid}, nanoseconds; `null` without a render. */
    readonly renderSourceStart: Prop<number | null>;
    readonly renderSourceStop: Prop<number | null>;
    /**
     * Whether this segment plays a rendering: time-stretched, with clip effects, or at another
     * sample rate than the engine's. While LUNA makes one, `renderSourceUid` is `null` and this
     * stays true, so the original file is not what plays (fact 116). `undefined` on a LUNA that
     * does not report it.
     */
    readonly needsRender: Prop<boolean>;
    /**
     * Every field at once, as a frozen plain object, so a view draws one consistent state
     * rather than reading props across a push.
     *
     * @example
     * lane.compiledClips.onChange(() => draw(lane.compiledClips.inOrder().map((c) => c.snapshot())));
     */
    snapshot(): CompiledClipSnapshot;
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
    move(toTick: number, options?: {
        copy?: boolean;
    }): Promise<CompiledClip>;
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
    crossfade(next: CompiledClip, lengthTicks: number, options?: {
        align?: 'center' | 'before' | 'after';
        shape?: FadeShape;
    }): Promise<void>;
    /**
     * Remove the crossfade between this segment and `next`, both halves. Resolves at once when
     * there is none.
     *
     * @example
     * await a.removeCrossfade(b);
     */
    removeCrossfade(next: CompiledClip): Promise<void>;
    /** The edit between this segment and `next`, checked: adjoining, same lane, both audio. */
    private edgeWith;
    private settleOptions;
    /** The seven flat `<prefix>_*` properties as one object, `undefined` when LUNA sends null. */
    private fade;
}
/**
 * A playlist's compiled clips. Loading or watching turns on `enable_compiled_clips` first,
 * since LUNA publishes nothing until a client asks (fact 116). The SDK never turns it off: the
 * switch is shared by every client of the session.
 *
 * Members come in the order LUNA made them, not timeline order; use {@link inOrder} to draw.
 *
 * @example
 * await lane.compiledClips.load();
 * lane.compiledClips.onChange(() => draw(lane.compiledClips.inOrder()));
 */
declare class CompiledClips extends Collection<CompiledClip> {
    private enabling;
    private readonly enable;
    /** Turn on publishing (once), then fetch the members. */
    load(): Promise<void>;
    reload(): Promise<void>;
    watch(options?: {
        recursive?: boolean;
    }): {
        ready: Promise<void>;
        release: Unsubscribe;
    };
    /**
     * Segments by timeline position, earliest first.
     *
     * @example
     * const first = lane.compiledClips.inOrder()[0];
     */
    inOrder(): CompiledClip[];
    /**
     * The segments cut from one clip, earliest first: none when it is fully covered, two or
     * more when a clip on a higher layer splits it.
     *
     * @example
     * const shown = lane.compiledClips.ofClip(clip.id).length > 0;
     */
    ofClip(clipUid: string): CompiledClip[];
    private enabled;
}

/** Who placed a warp marker: the user (0 on the wire) or LUNA's own analysis (1). */
type WarpType = 'user' | 'engine';
/** One warp marker as plain data, for {@link Warps.markers}. */
interface WarpMarker {
    /** The marker's row id, which {@link Warps.set} takes to move it. */
    readonly rowid: number;
    /** Clip-relative position, ticks. */
    readonly start: number;
    /** Offset into the source file, nanoseconds. */
    readonly sourceStart: number;
    readonly type: WarpType | undefined;
}
/** Options for {@link Warps.set}. */
interface SetWarpOptions {
    /** Clip-relative position, ticks. */
    start: number;
    /** Offset into the source file, nanoseconds. */
    sourceStart: number;
    /** Move the marker with this row id instead of adding one. */
    rowid?: number;
    /** Ticks added to `start` before LUNA stores it. */
    move?: number;
    /** Edit context whose edit groups follow the new marker. Default `main`. */
    contextType?: string;
}
/**
 * LUNA's warp transient zone (feature key `warp_transient_zone_size`, 30 ms by default): a new
 * marker whose source point is this close to an existing one's reuses it (fact 230).
 */
declare const WARP_TRANSIENT_ZONE_NS = 30000000;
/** One warp marker node. */
declare class Warp extends Node {
    /** Clip-relative position, ticks. */
    readonly start: Prop<number>;
    /** Offset into the source file, nanoseconds. */
    readonly sourceStart: Prop<number>;
    /** Where LUNA first put the marker, ticks. */
    readonly startOriginal: Prop<number>;
    /** Where in the source LUNA first put the marker, nanoseconds. */
    readonly sourceStartOriginal: Prop<number>;
    /** `user` or `engine`, from the wire's 0 or 1. */
    readonly type: Prop<WarpType | undefined>;
    /** The row id, from the node name. */
    get rowid(): number;
}
/** The `warps` folder of a clip. */
declare class Warps extends Collection<Warp> {
    private readonly clipPath;
    private readonly sessionUid;
    private get clipUid();
    private get playlistUid();
    /**
     * The markers as plain data, sorted by `start`; ones whose properties have not loaded are
     * left out.
     *
     * @example
     * for (const w of clip.warps.markers) drawMarker(clip.start.value! + w.start);
     */
    get markers(): WarpMarker[];
    private post;
    private settled;
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
    set(options: SetWarpOptions): Promise<WarpMarker>;
    /**
     * Delete the marker at clip tick `start`, or with `stop` every marker strictly between the
     * two: LUNA leaves markers at `start` and at `stop` alone (`delete_warp`, fact 231). One undo
     * step. Resolves once they are gone.
     *
     * @example
     * await clip.warps.delete(Luna.QUARTER_NOTE);
     * await clip.warps.delete(0, Luna.WHOLE_NOTE); // the ones inside, not at 0 or the bar
     */
    delete(start: number, stop?: number): Promise<void>;
    /**
     * Remove the clip's time stretch (`remove_tce`, fact 231): every marker goes and LUNA sets
     * the clip's `stop` so it plays its source span at the session tempo. One undo step. An
     * audio clip only: LUNA refuses others with `uasrv.invalid_object`. Resolves once the
     * markers are gone; the clip's new `stop` arrives by push.
     *
     * @example
     * await clip.warps.removeTimeStretch();
     */
    removeTimeStretch(): Promise<void>;
}

type ClipType = 'audio' | 'video' | 'midi';
/** The engine sends clip_type as 0/1/2 or as a string; normalise to the string form. */
declare function clipTypeFrom(raw: unknown): ClipType | undefined;
/** One MIDI event to add to a clip. `tick` is relative to the clip start. */
interface MidiEvent {
    tick: number;
    /** Status byte, e.g. 0x90 note on, 0x80 note off, 0xB0 control change. */
    status: number;
    data1: number;
    data2?: number;
}
/** One note for {@link Clip.addNotes}. `tick` is relative to the clip start. */
interface ClipNote {
    pitch: number;
    tick: number;
    lengthTicks: number;
    /** Note-on velocity, 1-127. Default 100. */
    velocity?: number;
    /** MIDI channel, 0-15. Default 0. */
    channel?: number;
}
/** Where a crossfade sits on the edit between two clips, for {@link Clip.crossfade}. */
type CrossfadeAlign = 'center' | 'before' | 'after';
/** A clip's state at one moment, as plain data: what a view draws from. */
interface ClipSnapshot {
    readonly uid: string;
    readonly name: string | undefined;
    readonly clipType: ClipType | undefined;
    readonly start: number | undefined;
    readonly stop: number | undefined;
    readonly sourceUid: string | undefined;
    readonly sourceStart: number | undefined;
    readonly sourceStop: number | undefined;
    readonly layer: number | undefined;
    readonly muted: boolean | undefined;
    readonly gain: number | undefined;
    readonly renderSourceUid: string | undefined;
    readonly renderState: string | undefined;
    readonly midiSourceStart: number | undefined;
}
declare class Clip extends Node {
    private readonly sessionUid;
    private midiClip;
    private deleting;
    private contextView;
    private controlsFolder;
    private warpList;
    readonly uid: Prop<string>;
    readonly name: WritableProp<string>;
    /** Timeline start, ticks. */
    readonly start: Prop<number>;
    /** Timeline end, ticks. */
    readonly stop: Prop<number>;
    /** Offset into the source file, nanoseconds. */
    readonly sourceStart: Prop<number>;
    /** End offset into the source file, nanoseconds. */
    readonly sourceStop: Prop<number>;
    /** Uid of the source audio file under the session's workspace `audio` folder. */
    readonly sourceUid: Prop<string>;
    /** Clip gain in dB. */
    readonly gain: WritableProp<number>;
    /** Stacking layer on its playlist; the higher layer plays where clips overlap. */
    readonly layer: Prop<number>;
    /** Whether the clip is muted (`mute`, reported as a boolean or 0/1). */
    readonly muted: Prop<boolean>;
    readonly clipType: Prop<ClipType | undefined>;
    readonly bypass: Prop<boolean>;
    /**
     * The time-stretched source LUNA renders when the clip's tick span does not match its
     * source span at the session tempo, and the state of that render (`current` when it is the
     * audio actually played). {@link clipAudio} picks between this and `sourceUid` (fact 73).
     */
    readonly renderSourceUid: Prop<string | undefined>;
    readonly renderState: Prop<string | undefined>;
    /**
     * For a MIDI clip: the MIDI table tick that sits at this clip's start (fact 41). 0 for
     * rows created in place; the clip's start tick for an imported MIDI file.
     */
    readonly midiSourceStart: Prop<number>;
    /**
     * This clip's MIDI as live `events` and `notes` lists. Created on first use and shared;
     * call `ready()` before reading. Empty for an audio clip.
     *
     * @example
     * await clip.midi.ready();
     * clip.midi.notes.onChange(() => draw(clip.midi.notes.items));
     */
    get midi(): MidiClip;
    /**
     * Every field at once, as a frozen plain object, so a view draws one consistent state
     * rather than reading props across a push.
     *
     * @example
     * playlist.clips.onChange(() => draw(playlist.clips.items.map((c) => c.snapshot())));
     */
    snapshot(): ClipSnapshot;
    /**
     * The clip's own controls (`<clip>/controls/<type>`). LUNA gives every clip a `gain` one
     * (fact 228); see {@link gainControl}.
     *
     * @example
     * await clip.controls.load();
     * clip.controls.items.map((c) => c.controlType.value); // ['gain']
     */
    get controls(): Controls;
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
    get gainControl(): Control;
    /**
     * The clip's warp markers (facts 229-231). Call `load()` before reading.
     *
     * @example
     * await clip.warps.load();
     * clip.warps.markers; // [{ rowid, start, sourceStart, type }]
     */
    get warps(): Warps;
    /** The playlist this clip sits on, taken from its path. */
    get playlistUid(): string;
    /** Length on the timeline, ticks. */
    get length(): number | undefined;
    private sessionPost;
    /** The cell listing this clip's siblings, and a re-read of it for {@link settle}. */
    private settleOptions;
    /**
     * Delete this clip and resolve once it has left its playlist. `delete_clip` answers the
     * same whether or not anything was deleted (fact 71), so the model is the proof.
     *
     * @example
     * await clip.delete();
     */
    delete(): Promise<unknown>;
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
    trim(startTick: number, stopTick: number, options?: {
        split?: boolean;
        stretch?: boolean;
    }): Promise<unknown>;
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
    move(toTick: number, options?: {
        copy?: boolean;
    }): Promise<Clip>;
    /**
     * Copy the clip to start where it ends. One undo step; resolves to the copy.
     *
     * @example
     * const again = await clip.duplicate();
     */
    duplicate(): Promise<Clip>;
    /**
     * Cut the clip at one or more ticks inside it (LUNA's `separate_clips`). One undo step.
     * Resolves to the pieces in time order; this clip keeps the first. A fade-out moves to the
     * last piece, and a crossfade at a cut is not kept (fact 117).
     *
     * @example
     * const [left, right] = await clip.split(clip.start.value! + Luna.WHOLE_NOTE);
     */
    split(at: number | readonly number[]): Promise<Clip[]>;
    /**
     * Mute or unmute the clip. One undo step. (LUNA's `mute_clips` toggles a range instead.)
     *
     * @example
     * await clip.setMuted(true);
     */
    setMuted(muted: boolean): Promise<void>;
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
    slip(byNs: number): Promise<void>;
    /**
     * Fade the clip in over its first `lengthTicks`, or change the length of its fade-in. One
     * undo step, or two when `shape` changes an existing fade's shape. Without `shape` a new
     * fade is `log`, LUNA's default. Audio clips only: a MIDI or video clip rejects with
     * `unavailable`.
     *
     * @example
     * await clip.setFadeIn(Luna.QUARTER_NOTE, { shape: 'equal_power' });
     */
    setFadeIn(lengthTicks: number, options?: {
        shape?: FadeShape;
    }): Promise<void>;
    /**
     * Fade the clip out over its last `lengthTicks`, or change the length of its fade-out.
     *
     * @example
     * await clip.setFadeOut(Luna.HALF_NOTE);
     */
    setFadeOut(lengthTicks: number, options?: {
        shape?: FadeShape;
    }): Promise<void>;
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
    crossfade(next: Clip, lengthTicks: number, options?: {
        align?: CrossfadeAlign;
        shape?: FadeShape;
    }): Promise<void>;
    /**
     * Remove the clip's plain fade-in. Resolves at once when there is none.
     *
     * @example
     * await clip.removeFadeIn();
     */
    removeFadeIn(): Promise<void>;
    /**
     * Remove the clip's plain fade-out. Resolves at once when there is none.
     *
     * @example
     * await clip.removeFadeOut();
     */
    removeFadeOut(): Promise<void>;
    /**
     * Remove the crossfade from this clip into `next`, both halves. Resolves at once when there
     * is none.
     *
     * @example
     * await left.removeCrossfade(right);
     */
    removeCrossfade(next: Clip): Promise<void>;
    /** Add raw MIDI events to this (MIDI) clip in one undo step. */
    addMidi(events: MidiEvent[]): Promise<unknown>;
    /** Add a note: note-on at `tick`, note-off at `tick + lengthTicks`. */
    addNote(note: number, tick: number, lengthTicks: number, velocity?: number, channel?: number): Promise<unknown>;
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
    addNotes(notes: readonly ClipNote[]): Promise<unknown>;
    bringToFront(): Promise<unknown>;
    sendToBack(): Promise<unknown>;
    private get playlistPath();
    private get context();
    private contextPost;
    /** Commands that select what they act on move the user's selection; put it back after. */
    private keepingSelection;
    private bounds;
    private siblingList;
    /** Settle options that re-read this clip itself, for edits that change only its properties. */
    private refreshingOptions;
    private fadeLength;
    /**
     * One `set_fade` (fact 117). LUNA applies `fade_shape` only to a fade it creates, so a shape
     * asked of a fade that already existed goes through `change_fade_curvature` as well.
     */
    private setFade;
    /** `delete_fades` takes every fade lying wholly inside a range; aim it at one fade's range. */
    private deleteFadeRange;
    protected release(): void;
}

/** A job as LUNA last reported it. Frozen; safe to keep. */
interface JobSnapshot {
    readonly uid: string;
    /** Nil uuid (32 zeros) when the job belongs to no session. */
    readonly sessionUid: string;
    /** `lyric_transcription` or `chord_extraction`. */
    readonly jobType: string;
    /** `queued | running | canceling | completed | failed | canceled`. */
    readonly status: string;
    /** Machine key such as `processing` or `downloading`; `''` when none. */
    readonly stage: string;
    /** A `job.*` code such as `job.provider_unavailable`; `''` when none. */
    readonly error: string;
    /** A `job.warning.*` code; `''` when none. */
    readonly warning: string;
    /** The track the job works on, when LUNA names one. */
    readonly targetUid: string | undefined;
    readonly cancellable: boolean;
    /** 0..100, as LUNA reports it. */
    readonly percentComplete: number;
}
/** How a job that did what it was asked ended. */
interface JobResult extends JobSnapshot {
    /**
     * True when the job worked and found nothing (no chords, no lyrics). LUNA reports that as
     * `failed` with the error `job.no_result` and calls it "not a failure" (fact 200), so the
     * SDK resolves it rather than rejecting.
     */
    readonly empty: boolean;
}
/** What a launch is matched on (fact 201). */
interface JobCriteria {
    sessionUid: string;
    jobType: string;
    /** The **track** the job targets; leave out when LUNA picks it from the selection. */
    targetUid?: string;
}
/** Status values after which nothing more happens to a job. */
declare function isTerminalJobStatus(status: string | undefined): boolean;
/** How long a {@link JobRun} waits: for LUNA to start the job, and for it to finish. */
interface JobRunOptions {
    /** How long to wait for LUNA to start the job. Default 30 s. */
    startTimeoutMs?: number;
    /** How long to wait for it to finish. Default 30 min. */
    timeoutMs?: number;
}
/**
 * One launched job, followed from the command that started it to its end: what
 * `session.musical.chords.detect()` and `session.lyrics.transcribe()` return. Await it (or
 * {@link done}) for the outcome; read {@link progress} and {@link snapshot} on the way.
 *
 * It resolves when the job completes, and with `empty: true` when it worked and found nothing.
 * It rejects with a {@link UAError} whose `code` is the job's error (`job.provider_unavailable`,
 * ...), `canceled`, `removed` (LUNA dropped the job without an ending, e.g. its session closed),
 * `no_effect` (LUNA took the command but no job started), `timeout` (the job did not end in
 * time, the code `Luna.RequestTimeout` carries too), or the launch command's own error.
 *
 * @example
 * const run = session.lyrics.transcribe({ clip });
 * run.progress.onChange(() => console.log(Math.round((run.progress.value ?? 0) * 100), '%'));
 * try {
 *   const result = await run;
 *   console.log(result.empty ? 'nothing sung' : 'lyrics ready');
 * } catch (err) {
 *   console.warn((err as Luna.UAError).code);
 * }
 */
declare class JobRun implements PromiseLike<JobResult> {
    private readonly client;
    private readonly criteria;
    /** The job's latest snapshot; `undefined` until LUNA starts it. */
    readonly snapshot: Prop<JobSnapshot>;
    /** 0..1 from the job's `percent_complete`, ready for a `<progress>` element. */
    readonly progress: Prop<number>;
    private readonly snapCell;
    private readonly progressCell;
    private readonly outcome;
    private resolve;
    private reject;
    private pinned;
    private finished;
    private readonly minSeq;
    private readonly releaseTracker;
    private startTimer;
    private doneTimer;
    /** The job's uid once LUNA has started it. */
    get uid(): string | undefined;
    /**
     * The outcome: resolves with the job's last snapshot, rejects as described on the class.
     * Calling it after the job ended answers at once.
     *
     * @example
     * const { empty } = await session.musical.chords.detect().done();
     */
    done(): Promise<JobResult>;
    /**
     * Lets `await run` work: a `JobRun` is a `PromiseLike` of its {@link JobResult}.
     *
     * @example
     * const result = await session.musical.chords.detect({ clip });
     */
    then<A = JobResult, B = never>(onFulfilled?: ((value: JobResult) => A | PromiseLike<A>) | null, onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null): Promise<A | B>;
    /**
     * Ask LUNA to cancel the job. LUNA refuses once the job is no longer cancellable; the run
     * then ends however the job does. A cancel accepted ends the run with code `canceled`.
     *
     * @example
     * const run = session.lyrics.transcribe();
     * cancelButton.onclick = () => run.cancel().catch(() => undefined);
     */
    cancel(): Promise<void>;
    private fail;
    private finish;
}
/** What a chord detection or lyric transcription works on. */
interface ExtractionOptions extends JobRunOptions {
    /**
     * The clip to analyse, as a `Clip` or its uid. Without one LUNA uses the edit context's
     * selection (one track for chords).
     */
    clip?: {
        readonly id: string;
        readonly path: string;
        readonly uid?: Prop<string>;
    } | string;
    /**
     * The clip's track, which the job is matched on (fact 201). Found from a `Clip` itself; give
     * it with a bare clip uid so a concurrent job on another track cannot be taken for this one.
     */
    trackUid?: string;
    /** The edit context whose selection is used without a clip. Default `main`. */
    context?: string;
}

/** A chord name split the way LUNA spells chords: root, type suffix, slash bass. */
interface ParsedChord {
    /** `C`, `F#`, `Bb`. */
    root: string;
    /** What follows the root, verbatim: `''` (major), `m`, `7`, `maj7`, `m7b5`, `sus4`. */
    type: string;
    /** The slash-chord bass, `E` for `C/E`, else `null`. */
    bass: string | null;
}
/**
 * LUNA stores `♭` and `♯` as ASCII `b` and `#` (fact 100); the SDK compares names the same way.
 *
 * @example Luna.normalizeChordName('B♭m7');   // 'Bbm7'
 */
declare function normalizeChordName(name: string): string;
/**
 * Split a chord name into root, type and bass. `undefined` when it does not start with a
 * note letter, since the ruler accepts any text (`N.C.`, `riff`). A lowercase root or bass
 * is read as the note (`am7` is A minor 7, `bb` is B flat) and returned upper-cased, but only
 * when what follows the root is empty or starts like a chord quality, so `bridge` and
 * `chorus` stay text. Spaces around the slash are ignored.
 *
 * @example
 * Luna.parseChord('C');       // { root: 'C', type: '', bass: null }
 * Luna.parseChord('F#m7b5');  // { root: 'F#', type: 'm7b5', bass: null }
 * Luna.parseChord('C/E');     // { root: 'C', type: '', bass: 'E' }
 * Luna.parseChord('am7 / g'); // { root: 'A', type: 'm7', bass: 'G' }
 */
declare function parseChord(name: string): ParsedChord | undefined;
/** A chord to write with `musical.setChords`. */
interface ChordSpec {
    tick: number;
    name: string;
}
declare class Chord extends Node {
    private readonly sessionUid;
    readonly rowid: Prop<number>;
    /** Position in ticks. */
    readonly location: Prop<number>;
    /** The chord symbol as LUNA shows it, e.g. `Am7`, `C/E`. */
    readonly name: Prop<string>;
    private get row();
    /** {@link name} split into root, type and bass; `undefined` for text that is not a chord. */
    get parsed(): ParsedChord | undefined;
    private edit;
    /** @example await chord.rename('C/E'); */
    rename(name: string): Promise<void>;
    /**
     * Move this chord to `tick`. A chord already at `tick` is replaced, as in LUNA (fact 100).
     *
     * @example await chord.moveTo(Luna.WHOLE_NOTE * 2);
     */
    moveTo(tick: number): Promise<void>;
    /**
     * Delete this chord and resolve once it has left the ruler.
     *
     * @example await chord.delete();
     */
    delete(): Promise<void>;
}
declare class Chords extends Collection<Chord> {
    private readonly sessionUid;
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
    detect(options?: ExtractionOptions): JobRun;
    /** Chords in timeline order. */
    get sorted(): Chord[];
    /** The chord sounding at `tick`: the last one at or before it. */
    at(tick: number): Chord | undefined;
}

declare class TempoEvent extends Node {
    readonly tick: Prop<number>;
    /** Seconds at this event, as the engine computed it. */
    readonly time: Prop<number>;
    /** BPM from this event on. Writable: LUNA's own tempo field sets it directly (fact 95). */
    readonly tempo: WritableProp<number>;
}
declare class TimeSignature extends Node {
    readonly tick: Prop<number>;
    readonly bar: Prop<number>;
    readonly numerator: Prop<number>;
    readonly denominator: Prop<number>;
    readonly partial: Prop<boolean>;
    /** Ticks in one bar of this signature. */
    get ticksPerBar(): number;
    /** Ticks in one beat of this signature. */
    get ticksPerBeat(): number;
}
declare class KeySignature extends Node {
    readonly tick: Prop<number>;
    /** Positive for sharps, negative for flats. */
    readonly sharpsAndFlats: Prop<number>;
    readonly isMinor: Prop<boolean>;
}
/**
 * Pure tick arithmetic over the current tempo map and time signatures. Every method reads the
 * maps as they are now; {@link onChange} says when an answer may have moved.
 */
declare class Timeline {
    private readonly tempos;
    private readonly signatures;
    private readonly subscribe;
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
    onChange(listener: () => void): Unsubscribe;
    /**
     * Whether the tempo map has at least one event whose tick and BPM have loaded, so
     * {@link tempoAt}, {@link seconds} and {@link tickAtSeconds} can answer. Until then they throw
     * `unavailable` rather than assume a tempo. {@link onChange} fires when it becomes true.
     *
     * @example
     * const bpm = timeline.tempoLoaded ? timeline.tempoAt(tick) : undefined;
     */
    get tempoLoaded(): boolean;
    /** Tempo events whose tick and BPM have both loaded, in tick order. */
    private readableTempos;
    /** {@link readableTempos}, or `unavailable` when there are none: never a guessed tempo. */
    private sortedTempos;
    private sortedSignatures;
    /**
     * BPM in effect at `tick`: the last tempo event at or before it, or the first event's when
     * `tick` is before them all. Throws `unavailable` while the tempo map is not loaded
     * ({@link tempoLoaded}); it never assumes 120.
     *
     * @example
     * await session.musical.ready();
     * session.musical.timeline.tempoAt(session.transport.tick);   // 90
     */
    tempoAt(tick: number): number;
    /**
     * Ticks to seconds, integrating the tempo map (constant tempo between events). Throws
     * `unavailable` while the tempo map is not loaded ({@link tempoLoaded}).
     *
     * @example
     * timeline.seconds(Luna.TICKS_PER_BEAT * 8);   // 4 at 120 BPM, 5.333… at 90
     */
    seconds(tick: number): number;
    /**
     * The inverse of {@link barBeat}: the tick a bar|beat|tick position lands on. `beat`
     * defaults to 1 and `tick` to 0, so `tickAt({ bar: 9 })` is the downbeat of bar 9 and
     * matches {@link tickAtBar}.
     *
     * @example
     * const tick = timeline.tickAt({ bar: 5, beat: 3, tick: 0 });
     * timeline.barBeat(tick);   // { bar: 5, beat: 3, tick: 0 }
     */
    tickAt(at: {
        bar: number;
        beat?: number;
        tick?: number;
    }): number;
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
    tickAtSeconds(seconds: number): number;
    /**
     * Bar, beat (1-based) and the engine ticks left over within the beat at `tick`, honouring
     * time signature changes. Same units as `location.bar_beat`, so it passes straight to
     * {@link formatBarBeat} (or `Luna.formatBarBeat`) with no conversion.
     *
     * @example
     * timeline.barBeat(Luna.TICKS_PER_BEAT * 5 + Luna.TICKS_PER_DISPLAY_TICK * 120);   // { bar: 2, beat: 2, tick: 12_000_000_000 }
     */
    barBeat(tick: number): BarBeat;
    /**
     * `tick` as LUNA's bar|beat counter shows it, `1|1|000` with display ticks (960 per beat):
     * `Luna.formatBarBeat(timeline.barBeat(tick))` in one call.
     *
     * @example
     * timeline.formatBarBeat(marker.location.value!);   // "5|3|240"
     */
    formatBarBeat(tick: number | undefined): string;
    /** Tick at the start of `bar` (1-based). */
    tickAtBar(bar: number): number;
}
/** The musical structure of one session. */
declare class Musical {
    private readonly client;
    private readonly sessionPath;
    private readonly sessionUid;
    private readonly transaction;
    readonly tempoMap: Collection<TempoEvent>;
    readonly timeSignatures: Collection<TimeSignature>;
    readonly keySignatures: Collection<KeySignature>;
    /** LUNA's Chord ruler. */
    readonly chords: Chords;
    readonly timeline: Timeline;
    private readyPromise;
    /** Follow membership of both maps and the fields the timeline reads from each row. */
    private onMapsChange;
    /** Load the three maps and the Chord ruler. Idempotent. */
    ready(): Promise<void>;
    /**
     * BPM in effect at `tick`; see {@link Timeline.tempoAt}. Throws `unavailable` until
     * {@link ready} has loaded the tempo map, rather than assume 120.
     *
     * @example
     * await session.musical.ready();
     * session.musical.tempoAt(0);   // the session tempo
     */
    tempoAt(tick: number): number;
    private post;
    /**
     * The tempo event in effect at `tick`: the last one at or before it, or the first when the
     * tick is before them all. `undefined` only while the map is empty or unloaded.
     *
     * @example
     * const row = session.musical.tempoEventAt(session.transport.tick);
     */
    tempoEventAt(tick: number): TempoEvent | undefined;
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
    setTempoInEffectAt(bpm: number, tick: number): Promise<void>;
    /**
     * Add a tempo event at a tick with `set_tempo` (default: the session start). On the measured
     * build `set_tempo` answered `device.database_error`; to change the tempo in effect, use
     * {@link setTempoInEffectAt}.
     */
    setTempo(bpm: number, tick?: number): Promise<unknown>;
    deleteTempo(tick: number): Promise<unknown>;
    /** Set the time signature from `bar` (1-based). */
    setTimeSignature(numerator: number, denominator: number, bar?: number): Promise<unknown>;
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
    setKeySignature(sharpsAndFlats: number, isMinor: boolean, tick?: number): Promise<KeySignature>;
    /**
     * The key signature in effect at `tick`: the last one at or before it. `undefined` when
     * none is, or the list is not loaded (`await musical.ready()` first).
     *
     * @example
     * const key = session.musical.keySignatureAt(session.transport.tick);
     * key && `${key.sharpsAndFlats.value} ${key.isMinor.value ? 'minor' : 'major'}`;
     */
    keySignatureAt(tick: number): KeySignature | undefined;
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
    deleteTimeSignature(bar: number): Promise<void>;
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
    deleteKeySignature(tick: number): Promise<void>;
    /** Move bar one to `tick`. */
    setBarOne(tick: number): Promise<unknown>;
    private settleChords;
    private hasChord;
    /**
     * Add a chord to the Chord ruler at `tick` and resolve to it once it is in {@link chords}.
     * A chord already at `tick` is replaced, as in LUNA (fact 100). One undo entry.
     *
     * @example
     * const chord = await session.musical.addChord(Luna.WHOLE_NOTE * 4, 'Am7');
     */
    addChord(tick: number, name: string): Promise<Chord>;
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
    setChords(chords: readonly ChordSpec[], options?: {
        replaceRange?: [number, number];
        undoName?: string;
    }): Promise<void>;
    /**
     * Delete every chord on the ruler as one undo entry ("Clear Chords").
     *
     * @example await session.musical.clearChords();
     */
    clearChords(): Promise<void>;
}

/** Pairs per cached page; four pages cover a minute of fine pairs. */
declare const WAVEFORM_PAGE = 1024;
/**
 * The analysis to draw at a zoom level: `coarse` once a pixel spans at least one coarse pair
 * (31.25 ms), `fine` when zoomed closer. Below one fine pair per pixel the same pair repeats;
 * neither analysis is PCM.
 */
declare function kindForScale(nsPerPixel: number): OverviewKind;
interface PairRange {
    /** First pair whose span touches `startNs`. */
    readonly index: number;
    /** Pairs up to the one containing `stopNs`; 0 when the range is empty. */
    readonly count: number;
}
/** The overview pairs covering `[startNs, stopNs)` of a source. Both are file offsets, never timeline ticks. */
declare function pairRange(startNs: number, stopNs: number, kind?: OverviewKind): PairRange;
/** The clip fields placement needs. A {@link Clip} satisfies it, as does a plain snapshot. */
interface ClipLike {
    readonly sourceUid: string | undefined;
    readonly sourceStartNs: number | undefined;
    readonly sourceStopNs: number | undefined;
    readonly renderSourceUid?: string | undefined;
    readonly renderState?: string | undefined;
}
interface ClipAudio {
    /** The source whose overview matches what the engine plays. */
    readonly source: AudioSource;
    /** File range in nanoseconds: the clip's source range, or the whole render. */
    readonly startNs: number;
    readonly stopNs: number;
    /** True when `source` is LUNA's time-stretched render rather than the original file. */
    readonly stretched: boolean;
}
/** Anything that can resolve a source uid: `session.sources`, or a plain array. */
type SourceLookup = {
    byId(uid: string): AudioSource | undefined;
} | readonly AudioSource[];
declare function clipAudio(clip: ClipLike | Clip, sources: SourceLookup): ClipAudio | undefined;
interface CompiledClipLike {
    readonly start: number | undefined | {
        readonly value: number | undefined;
    };
    readonly stop: number | undefined | {
        readonly value: number | undefined;
    };
    readonly sourceStart: number | undefined | {
        readonly value: number | undefined;
    };
    readonly sourceStop: number | undefined | {
        readonly value: number | undefined;
    };
    /** The segment's own rendering: a uid, `null` for none, `undefined` when LUNA does not say. */
    readonly renderSourceUid?: string | null | undefined | {
        readonly value: string | null | undefined;
    };
    readonly renderSourceStart?: number | null | undefined | {
        readonly value: number | null | undefined;
    };
    readonly renderSourceStop?: number | null | undefined | {
        readonly value: number | null | undefined;
    };
    /** True when the segment plays a rendering, made or still being made. */
    readonly needsRender?: boolean | undefined | {
        readonly value: boolean | undefined;
    };
}
/**
 * Which audio one compiled segment plays, over the segment only, or `undefined` when there is
 * nothing safe to draw (see {@link clipAudio}). `clip` is the raw clip the segment is cut from
 * (`playlist.clips.byId(segment.clipUid.value)`): it names the source. Map ticks with
 * {@link audioNsAtTick} anchored at the segment, which also reaches into a crossfade's
 * `fullStart`..`fullStop`.
 *
 * A time-stretched clip plays LUNA's renders, one per compiled piece (fact 116), so a segment
 * draws its own `renderSourceUid` over `renderSourceStart`..`renderSourceStop`. On a LUNA that
 * does not report those, only the clip's first piece can be placed, by cutting the clip's own
 * render by time; a later piece is `undefined`, an outline rather than the wrong audio. While
 * LUNA makes a segment's rendering (after an edit that changes it, such as a crossfade) the
 * answer is `undefined` too, not the original file at the wrong scale.
 *
 * @example
 * for (const seg of lane.compiledClips.inOrder()) {
 *   const clip = lane.clips.byId(seg.clipUid.value);
 *   const audio = clip && Luna.compiledClipAudio(timeline, seg, clip, session.sources);
 *   if (!audio) continue;
 *   const range = await cache.range(audio.source, audio.startNs, audio.stopNs, kind);
 *   const cols = Luna.waveformColumns(range, width, (i) => Luna.audioNsAtTick(timeline, seg, audio, tickAtPx(i)));
 * }
 */
declare function compiledClipAudio(timeline: Timeline, segment: CompiledClipLike, clip: (ClipLike & {
    readonly startTicks: number | undefined;
}) | Clip, sources: SourceLookup): ClipAudio | undefined;
/**
 * The file offset (ns) that plays at a timeline tick inside a clip: the clip's audio start
 * plus the tempo-map seconds between the clip start and the tick. Linear in seconds, not in
 * ticks, so a tempo change inside the clip bends the mapping exactly as the engine does.
 *
 * The result can lie outside `[audio.startNs, audio.stopNs)` for ticks outside the clip;
 * clamp before drawing there. Throws `unavailable` while the tempo map is not loaded.
 *
 * @example
 * const ns = Luna.audioNsAtTick(session.musical.timeline, clip, audio, playheadTick);
 */
declare function audioNsAtTick(timeline: Timeline, clip: {
    start: {
        value: number | undefined;
    };
} | {
    startTicks: number | undefined;
}, audio: ClipAudio, tick: number): number;
interface WaveformChannel {
    readonly min: Float32Array;
    readonly max: Float32Array;
}
interface WaveformRange {
    readonly kind: OverviewKind;
    readonly pairNs: number;
    /** The first pair returned; `channels[c].min[i]` covers `[(index + i) * pairNs, (index + i + 1) * pairNs)`. */
    readonly index: number;
    /** Pairs actually returned per channel. */
    readonly count: number;
    readonly channels: readonly WaveformChannel[];
    /** False when the analysis ended (or is still growing) before the requested range. */
    readonly complete: boolean;
}
/**
 * A bounded cache of overview pages, keyed by source, analysis and page index. A short page
 * (the end of the analysis, or growth in progress) is never cached, so a recording still
 * being written is re-read until it settles.
 *
 * The cache does not watch LUNA: call `invalidate(uid)` when a source is removed or its
 * `overviewInfo().md5` changes.
 *
 * @example
 * const cache = new Luna.Waveforms({ maxPages: 512 });
 * const range = await cache.range(audio.source, audio.startNs, audio.stopNs, 'coarse');
 */
declare class Waveforms {
    private readonly pages;
    private readonly inFlight;
    private readonly max;
    constructor(options?: {
        maxPages?: number;
    });
    /** Pages held right now. */
    get size(): number;
    /** Drop one source's pages, or everything. */
    invalidate(uid?: string): void;
    /** The pairs covering `[startNs, stopNs)` of `source`, assembled from cached and fresh pages. */
    range(source: AudioSource, startNs: number, stopNs: number, kind?: OverviewKind): Promise<WaveformRange>;
    private page;
}
/** Options for {@link waveformColumns}. */
interface WaveformScale {
    /**
     * Linear multiplier on every value, clipped to -1..1; default 1. Must be finite and > 0.
     * LUNA multiplies by its waveform zoom and the clip's gain:
     * `session.context.waveformZoom.value * 10 ** (clip.gain.value / 20)`.
     */
    readonly gain?: number;
}
/**
 * The loudest absolute value in a range, across every channel, in 0..1; 0 when the range is
 * empty. To normalize a clip, pass `gain: 1 / peak` to {@link waveformColumns}, taking the
 * peak from the clip's whole range, not the visible columns, so the scale holds while
 * scrolling.
 *
 * @example
 * const peak = Luna.waveformPeak(range);   // 0.25 for a clip peaking at -12 dBFS
 */
declare function waveformPeak(range: WaveformRange): number;
interface WaveformColumns {
    /** Columns returned; `channels[c].min[i]` is column `i`. */
    readonly width: number;
    /**
     * One entry per source channel, in file order (left then right for stereo), never folded
     * together. A column with no pair under it is `NaN` in both arrays: draw nothing there.
     */
    readonly channels: readonly WaveformChannel[];
}
/**
 * Reduce a {@link WaveformRange} to one min/max per drawn column, per channel, the way LUNA's
 * own timeline does:
 *
 * - a column holds the loudest of the pairs that end inside it, so peaks survive zooming out;
 * - its minimum is never above zero and its maximum never below, so the shape always touches
 *   the zero line;
 * - zoomed in past one pair per column, the columns between two pairs are interpolated
 *   linearly between them rather than repeating a pair as a step;
 * - values are linear, times `gain` ({@link WaveformScale}), clipped to -1..1. LUNA draws no
 *   decibel curve; its gain is the window's waveform zoom times the clip gain.
 *
 * `nsAt(i)` is the file offset (ns) at the left edge of column `i`, for `i` in `0..width`,
 * and must not decrease; column `i` covers `[nsAt(i), nsAt(i + 1))`. For a timeline that is
 * {@link audioNsAtTick} of the tick at that edge, so a tempo change bends the mapping as the
 * engine does. Columns outside the range are `NaN`. For a sharp shape on a high-density
 * display, use one column per device pixel.
 *
 * Draw each channel in its own lane ({@link waveformLanes}) with {@link traceWaveform};
 * folding a stereo range into one shape makes it look mono.
 *
 * @example
 * const cols = Luna.waveformColumns(range, width, (i) => Luna.audioNsAtTick(timeline, clip, audio, tickAtPx(x0 + i)),
 *   { gain: session.context.waveformZoom.value * 10 ** ((clip.gain.value ?? 0) / 20) });
 * const lanes = Luna.waveformLanes(cols.channels.length, top, height);
 * ctx.beginPath();
 * cols.channels.forEach((ch, c) => Luna.traceWaveform(ctx, ch, lanes[c], x0));
 * ctx.fill();
 */
declare function waveformColumns(range: WaveformRange, width: number, nsAt: (column: number) => number, options?: WaveformScale): WaveformColumns;
interface WaveformLane {
    /** The lane's zero line. */
    readonly mid: number;
    /** Pixels from `mid` to full scale; `mid - max * half` is where a pair's maximum lands. */
    readonly half: number;
}
/**
 * Split `height` pixels from `top` into one equal lane per channel, stacked in file order
 * (left above right for stereo), each with a zero line and a full-scale half-height.
 * `gap` pixels are kept clear at the top and bottom of every lane; LUNA keeps none.
 *
 * @example
 * const [left, right] = Luna.waveformLanes(2, 20, 80, 0);   // left.mid 40, right.mid 80, half 20
 */
declare function waveformLanes(channels: number, top: number, height: number, gap?: number): readonly WaveformLane[];
/** The part of a canvas 2D context {@link traceWaveform} draws with; `CanvasRenderingContext2D` and `Path2D` both fit. */
interface WaveformPathTarget {
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    closePath(): void;
}
interface TraceWaveformOptions {
    /** Width of one column in the target's units; default 1. Use `1 / devicePixelRatio` for device-pixel columns. */
    readonly columnWidth?: number;
    /**
     * Distance each outline sits beyond the zero line, so silence draws a thin axis line rather
     * than vanishing; default 0.5, as LUNA draws it.
     */
    readonly axis?: number;
}
/**
 * Add one channel's waveform to a path as LUNA fills it: for every run of drawable columns,
 * one closed shape through the column centres, the top outline (`mid - axis - max * half`)
 * left to right and the bottom outline (`mid + axis - min * half`) back, squared off at the
 * run's outer edges. `NaN` columns break the shape. It only adds subpaths; call
 * `beginPath()` before and `fill()` after, so several channels or clips fill in one go.
 *
 * @example
 * ctx.beginPath();
 * cols.channels.forEach((ch, c) => Luna.traceWaveform(ctx, ch, lanes[c], x0, { columnWidth: 1 / devicePixelRatio }));
 * ctx.fillStyle = '#000000a0';
 * ctx.fill();
 */
declare function traceWaveform(target: WaveformPathTarget, channel: WaveformChannel, lane: WaveformLane, x0: number, options?: TraceWaveformOptions): void;

/**
 * A take being recorded on one track. Read it from {@link Session.recordTakes}; it is disposed
 * when recording stops and LUNA turns it into a clip.
 *
 * Ticks are session ticks, like a clip's `start` and `stop`; `sourceStart` and `sourceStop` are
 * nanoseconds into the file being written. {@link events} and {@link notes} use ticks from the
 * take's start, as a clip's MIDI does, so a note at `startTick` sits at `take.start.value +
 * startTick`. A note still held has no `stopTick`: draw it to `take.stop.value`.
 *
 * @example
 * const take = session.recordTakes.forTrack(track)[0];
 * if (take?.audio) {
 *   const range = await waves.range(take.audio.source, take.audio.startNs, take.audio.stopNs, 'coarse');
 * }
 */
declare class RecordTake extends Node {
    private readonly sessionPath;
    /** The track this take records onto. */
    readonly trackUid: Prop<string>;
    /** The input it records from. */
    readonly inputNodeUid: Prop<string>;
    /** Session tick where recording began. */
    readonly start: Prop<number>;
    /** Session tick reached so far; grows while recording. */
    readonly stop: Prop<number>;
    /** The audio file being written; `undefined` on a MIDI take. */
    readonly sourceUid: Prop<string>;
    /** Nanoseconds into the file where the take begins. */
    readonly sourceStart: Prop<number>;
    /** Nanoseconds into the file reached so far; grows while recording. */
    readonly sourceStop: Prop<number>;
    /** The messages recorded so far, in tick order, ticks from the take's start. */
    readonly events: List<MidiRow>;
    /** {@link events} paired into notes; a held note has no `stopTick` yet. */
    readonly notes: List<Note>;
    private readonly rows;
    private file;
    /**
     * True for a take on a MIDI-capable track (an instrument track): LUNA gives it a `midi`
     * folder, which its messages arrive in. Known once the take has loaded.
     */
    get isMidi(): boolean;
    /**
     * The file being written and the part of it this take covers, for {@link Waveforms.range}
     * and {@link audioNsAtTick}; `undefined` on a MIDI take or before LUNA names the file. Its
     * overview grows as LUNA records: redraw when `stop` or `sourceStop` moves. The partial last
     * page is read again each time, so the waveform fills in.
     */
    get audio(): ClipAudio | undefined;
    protected release(): void;
}
/**
 * The takes being recorded in a session, across every track: {@link Session.recordTakes}.
 * Empty while nothing records. `onChange` fires when a take starts or ends; follow a take's own
 * props (`stop`, `notes`) for its progress.
 *
 * @example
 * await session.ready();
 * session.recordTakes.onChange(() => {
 *   for (const take of session.recordTakes.items) console.log(take.trackUid.value, take.stop.value);
 * });
 */
declare class RecordTakes implements List<RecordTake> {
    private readonly tracks;
    private readonly listeners;
    private trackOffs;
    private tracksOff;
    private loaded;
    /** Every take recording now, track by track. */
    get items(): readonly RecordTake[];
    get value(): readonly RecordTake[];
    /** The take with this uid. */
    byId(id: string): RecordTake | undefined;
    /**
     * The takes recording on one track (normally one), by the track or its uid.
     *
     * @example
     * const [take] = session.recordTakes.forTrack(track);
     */
    forTrack(track: {
        readonly id: string;
    } | string): RecordTake[];
    /** Called when a take starts or ends. */
    onChange(listener: () => void): Unsubscribe;
    /**
     * Read the takes recording now. {@link Session.ready} does it; later takes follow pushes.
     *
     * @example
     * await session.recordTakes.load();
     */
    load(): Promise<void>;
    /** Follow the track folders and each folder's takes; load what is new. */
    private wire;
    private notify;
}

/** One MIDI operation. Ranges are LUNA's; anything outside them is refused before it is sent. */
type MidiOperation = 
/** Set every note's velocity, 1-127. */
{
    type: 'velocity';
    value: number;
}
/** Scale every velocity by `percent`, 1-200, clamped to 1-127. */
 | {
    type: 'velocityPercent';
    percent: number;
}
/**
 * Make every note this long, counted from its start through the time signatures: whole
 * bars, beats and engine ticks (fewer than a beat, in whole display ticks). Omitted parts
 * are 0.
 */
 | {
    type: 'duration';
    bars?: number;
    beats?: number;
    ticks?: number;
}
/** Scale every length by `percent` (1 or more; 50 halves, 200 doubles). */
 | {
    type: 'durationPercent';
    percent: number;
}
/** Scale every length by exactly `numerator / denominator`, rounded to the nearest tick (`1/3` and back round-trips). */
 | {
    type: 'durationScale';
    numerator: number;
    denominator: number;
}
/** Stretch each note to the next note start in its clip, or to the next beat. */
 | {
    type: 'legato';
}
/** Make every note 100 display ticks long. */
 | {
    type: 'staccato';
}
/** Mirror the notes' timing inside the selected range. */
 | {
    type: 'reverse';
}
/** Move every pitch by `semitones`, -24 to 24, clamped to 0-127. */
 | {
    type: 'transpose';
    semitones: number;
}
/**
 * Mirror the pitches: `'range'` (default) around the middle of the lowest and highest,
 * `'first'` around the first note, `'root'` around the scale root nearest the middle. With
 * `scale`, in scale degrees rather than semitones: `root` 0-11 (C = 0) and `mask`, a 12-bit
 * pitch-class set (bit N = pitch class N) that includes the root; `'root'` needs one.
 */
 | {
    type: 'invert';
    around?: 'range' | 'first' | 'root';
    scale?: {
        root: number;
        mask: number;
    };
};

/** One control and its value for {@link Context.writeControlValues} / {@link Context.trimControlValues}. */
interface ControlValue {
    /** The control, or its `uid`. A `Control` must have its `uid` loaded. */
    control: Control | string;
    /** Absolute value for a write, delta for a trim; in the control's native unit (dB for gain). */
    value: number;
}
/**
 * The tick range of a write or trim: `[start, stop)`. Give both or neither; with neither, LUNA
 * uses the context's selection (fact 227).
 */
interface ControlValueRange {
    start?: number;
    stop?: number;
}

type ContextType = 'main' | 'editor' | `alt_${number}` | string;
/** One playlist's selected notes as LUNA stores them: `[pitch, start, stop, rowid]` in absolute ticks. */
interface SelectedNotes {
    readonly playlist_uid: string;
    readonly notes: ReadonlyArray<readonly [number, number, number, number]>;
}
/** The six selection properties as LUNA holds them, for {@link Context.restore}. */
interface SelectionSnapshot {
    readonly focus: unknown;
    readonly selection_start: unknown;
    readonly selection_stop: unknown;
    readonly selection_notes: unknown;
    readonly selection_playlists: unknown;
    readonly selection_tracks: unknown;
}
/** Decode LUNA's `selection_notes` (an array, or `null`, or garbage) into frozen rows. */
declare function selectedNotes(value: unknown): readonly SelectedNotes[];
declare class Context extends Node {
    readonly sessionUid: string;
    readonly contextType: Prop<ContextType>;
    /** Selection range in ticks; `null` when nothing is selected. */
    readonly selectionStart: WritableProp<number | null>;
    readonly selectionStop: WritableProp<number | null>;
    readonly selectionTracks: WritableProp<string[] | null>;
    readonly selectionPlaylists: WritableProp<string[] | null>;
    /**
     * Selected notes per playlist, in absolute ticks. The selection-based MIDI verbs
     * (`mute_notes`, `clear`, `change_velocity`) act on this, not on a clip (fact 74).
     */
    readonly selectionNotes: WritableProp<SelectedNotes[] | null>;
    /** The focused track, distinct from the selected set. */
    readonly lastSelectedTrack: WritableProp<string | null>;
    readonly collapsedFolders: WritableProp<string[] | null>;
    readonly pinnedTracks: Prop<string[] | null>;
    readonly hiddenTracks: Prop<string[] | null>;
    /** Zoom. */
    readonly pixelsPerTick: WritableProp<number>;
    /**
     * The tick at the left edge of this window's timeline view, with {@link pixelsPerTick} the
     * horizontal scroll (fact 159). Stored with the session, not undoable; `undefined` until
     * something has set it. A page that draws its own timeline can share its scroll through it.
     *
     * @example
     * const x = (tick: number) => (tick - (ctx.timelineViewStartTick.value ?? 0)) * ctx.pixelsPerTick.value!;
     * await ctx.timelineViewStartTick.set(Luna.WHOLE_NOTE * 8);
     */
    readonly timelineViewStartTick: WritableProp<number>;
    readonly gridEnable: WritableProp<boolean>;
    /** Grid size such as `1_4`, `1_8`, `bar`. */
    readonly grid: WritableProp<string>;
    readonly linkEditAndPlay: WritableProp<boolean>;
    readonly focus: Prop<string>;
    /** The window's saved settings, a JSON string LUNA writes on a delayed save. */
    readonly settings: Prop<string>;
    /**
     * LUNA's waveform zoom for this window: the amplitude multiplier its timeline draws audio
     * with, 1 by default, doubled or halved by Zoom In/Out Waveform and bounded 1/8..256. Pass
     * it with the clip gain to {@link waveformColumns} to draw at LUNA's height. It is read from
     * {@link settings}, which LUNA saves some time after a change rather than at once (fact 94).
     *
     * @example
     * const gain = session.context.waveformZoom.value * 10 ** ((clip.gain.value ?? 0) / 20);
     */
    readonly waveformZoom: Prop<number>;
    /**
     * Set range, tracks, playlists and/or focus in one go; omitted parts are left alone. `focus`
     * is what LUNA's selection commands act on: `timeline` for clips (fact 117).
     *
     * @example
     * await ctx.select({ startTick: 0, stopTick: Luna.WHOLE_NOTE, playlistUids: [lane.id], focus: 'timeline' });
     */
    select(options: {
        startTick?: number;
        stopTick?: number;
        trackUids?: string[];
        playlistUids?: string[];
        focus?: string;
    }): Promise<void>;
    /** The selected notes, decoded. Empty when nothing is selected. */
    get notes(): readonly SelectedNotes[];
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
    snapshot(): SelectionSnapshot;
    /** Write a snapshot back. No undo entry; LUNA echoes each property. */
    restore(snapshot: SelectionSnapshot): Promise<void>;
    /**
     * Select exactly these notes on one playlist, with the range and focus to match. Ticks are
     * absolute, as LUNA stores them: `[pitch, start, stop, rowid]`.
     */
    selectNotes(playlistUid: string, notes: ReadonlyArray<readonly [number, number, number, number]>): Promise<void>;
    /** Re-read the six selection properties (they also arrive as events). */
    refreshSelection(): Promise<unknown>;
    /** Run one of the context's edit commands (`copy`, `paste`, `duplicate`, `select_all`, ...). */
    /** A context's commands live under its `commands` node. */
    protected commandPath(command: string): string;
    run(command: string, payload?: Record<string, unknown>): Promise<unknown>;
    /**
     * Widen the selected range to everything on the selected tracks' playlists (clips, notes,
     * automation), keeping the tracks (fact 150). No undo entry.
     *
     * @example
     * await session.selectTimeline({ tracks: [track] });
     * await session.context.selectAll();
     */
    selectAll(): Promise<unknown>;
    copy(): Promise<unknown>;
    cut(): Promise<unknown>;
    paste(): Promise<unknown>;
    duplicate(): Promise<unknown>;
    /** Delete the selected content. */
    clear(): Promise<unknown>;
    /** Move the selection by `ticks` (negative moves earlier). */
    nudge(ticks: number): Promise<unknown>;
    separateClips(): Promise<unknown>;
    consolidate(): Promise<unknown>;
    muteClips(): Promise<unknown>;
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
    writeControlValues(controls: readonly ControlValue[], range?: ControlValueRange): Promise<void>;
    /**
     * Add a delta per control over `[start, stop)`, or over this context's selection when the
     * range is left out (`trim_control_values`, fact 227). One undo step for all of them.
     * Resolves on LUNA's reply; the lanes update by push.
     *
     * @example
     * await session.context.trimControlValues([{ control: vocal.gain, value: 3 }], { start: 0, stop: Luna.WHOLE_NOTE });
     */
    trimControlValues(controls: readonly ControlValue[], range?: ControlValueRange): Promise<void>;
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
    midiOperation(op: MidiOperation): Promise<void>;
}

/** One word of a lyric line. `offset` and `length` are in the line's units, from its start. */
interface LyricWord {
    word: string;
    offset: number;
    length: number;
}
/** Options for {@link Lyrics.add}. */
interface AddLyricOptions {
    /** How long the line lasts, in the line's units. Default 0, as LUNA's ruler makes them. */
    length?: number;
    /**
     * Add the line to a recording's lyrics instead of the ruler: `location` and `length` are
     * then nanoseconds from that audio source's start (fact 152).
     */
    sourceUid?: string;
}
declare class Lyric extends Node {
    readonly rowid: Prop<number>;
    /** Where the line starts: a tick for a ruler line, nanoseconds into its source for a transcribed one. */
    readonly location: Prop<number>;
    /** How long the line lasts, in the same units as {@link location}. */
    readonly length: Prop<number>;
    readonly text: Prop<string>;
    /** The audio source a transcribed line came from; LUNA's nil uid for a ruler line. */
    readonly sourceUid: Prop<string>;
    /** The line's words with their timing, when LUNA has it (a transcribed line). */
    readonly words: Prop<LyricWord[]>;
    /**
     * Whether the line was transcribed from a recording: it names a source, and its
     * {@link location} is nanoseconds into that source rather than a tick.
     *
     * @example
     * const lines = session.lyrics.sorted.filter((l) => !l.transcribed);   // the ruler's, in ticks
     */
    get transcribed(): boolean;
    private get row();
    private get sessionUid();
    private edit;
    /**
     * Change the line's text and resolve once LUNA shows it. One undo entry. The words and their
     * timings are left as they were. Rejects with `out_of_range` for an empty string (LUNA would
     * ignore it); to remove a line, {@link delete} it.
     *
     * @example await line.setText('Here comes the sun');
     */
    setText(text: string): Promise<void>;
    /**
     * Move the line to `location`, in its own units: a tick for a ruler line, nanoseconds into
     * its source for a transcribed one. Another line of the same kind already at `location` is
     * replaced, as in LUNA (fact 153). One undo entry.
     *
     * @example await line.moveTo(line.location.value! + Luna.WHOLE_NOTE);
     */
    moveTo(location: number): Promise<void>;
    /**
     * Delete this line and resolve once it has left {@link Lyrics}. One undo entry.
     *
     * @example await line.delete();
     */
    delete(): Promise<void>;
}
/** Options for {@link Lyrics.transcribe}. */
interface TranscribeOptions extends ExtractionOptions {
    /** A name from {@link Lyrics.providers}; LUNA's default when left out. */
    provider?: string;
    /**
     * Also put the lines on the lyric ruler, in ticks, over the clip or selected range
     * (`add_to_session`, fact 204). Default false: only the transcribed lines, in nanoseconds
     * into the source.
     */
    addToRuler?: boolean;
}
/** The lyric transcription services LUNA offers (`/lyric_transcription`, fact 204). */
interface LyricProviders {
    /** Whether any provider can run now. */
    available: boolean;
    /** Provider names to pass as `provider`. */
    providers: string[];
    /** The one LUNA uses when none is named. */
    defaultProvider: string;
}
declare class Lyrics extends Collection<Lyric> {
    private readonly sessionUid;
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
    transcribe(options?: TranscribeOptions): JobRun;
    /**
     * Read which transcription providers LUNA has. LUNA computes these when asked and pushes
     * no change (fact 204), so this is a read, not a prop.
     *
     * @example
     * const { available, providers, defaultProvider } = await session.lyrics.providers();
     */
    providers(): Promise<LyricProviders>;
    /**
     * The lines by {@link Lyric.location}. Ruler and transcribed lines are in different units,
     * so sort within one kind.
     *
     * @example
     * session.lyrics.sorted.filter((l) => l.sourceUid.value === source.id).map((l) => l.text.value);
     */
    get sorted(): Lyric[];
    /**
     * Add a line at `location` and resolve to it once it is listed. A ruler line by default,
     * at a tick; with `sourceUid`, a line of that recording's lyrics, at nanoseconds into it.
     * A line of the same kind already at `location` is replaced, as in LUNA (fact 153). One
     * undo entry.
     *
     * @example
     * const line = await session.lyrics.add(Luna.WHOLE_NOTE * 8, 'Second verse');
     */
    add(location: number, text: string, options?: AddLyricOptions): Promise<Lyric>;
}

declare class Marker extends Node {
    private readonly sessionUid;
    readonly rowid: Prop<number>;
    /** Position in ticks. */
    readonly location: Prop<number>;
    readonly name: Prop<string>;
    readonly comments: Prop<string>;
    /** ARGB packed integer. */
    readonly color: Prop<number>;
    /**
     * {@link location} as bar|beat, following the marker and the session's time signatures, so
     * a marker list needs no listeners of its own. Format it with `Luna.formatBarBeat`.
     * Assumes 4/4 until `session.musical` has loaded.
     *
     * @example
     * marker.barBeat.onChange(() => cell.textContent = Luna.formatBarBeat(marker.barBeat.value));
     */
    readonly barBeat: Prop<BarBeat>;
    /**
     * {@link location} in seconds from the session start, following the marker and the tempo
     * map. `undefined` until `session.musical` has loaded the tempo map; it never assumes a tempo.
     *
     * @example
     * marker.seconds.onChange(() => cell.textContent = Luna.formatMinSec(marker.seconds.value));
     */
    readonly seconds: Prop<number>;
    private get row();
    /**
     * `set_marker` and `delete_marker` answer `null` whether or not the rowid matched
     * (fact 71), so each edit resolves once this marker shows it.
     */
    private edit;
    /** @example await marker.rename('Bridge'); */
    rename(name: string): Promise<unknown>;
    /** @example await marker.moveTo(Luna.WHOLE_NOTE * 16); */
    moveTo(tick: number): Promise<unknown>;
    /** @example await marker.setColor(0xffff0000); */
    setColor(argb: number): Promise<unknown>;
    /** @example await marker.setComments('double chorus'); */
    setComments(comments: string): Promise<unknown>;
    /**
     * Delete this marker and resolve once it has left the list.
     *
     * @example await marker.delete();
     */
    delete(): Promise<unknown>;
}
declare class Markers extends Collection<Marker> {
    /** Markers in timeline order. */
    get sorted(): Marker[];
    /** The last marker at or before `tick`. */
    at(tick: number): Marker | undefined;
}

/** What a group links: timeline edits, mix moves, plugin changes, send changes. */
type GroupAttribute = 'edit' | 'mix' | 'plugin' | 'send';
/** The attributes in LUNA's own order, which is how it writes `group_attributes` (fact 215). */
declare const GROUP_ATTRIBUTES: readonly GroupAttribute[];
/**
 * A track, a bus, or its uid: anything with an `id`, or the id itself.
 *
 * @example
 * await group.addMembers([vocal, 'bus_7']);
 */
type ChannelRef = {
    readonly id: string;
} | string;
interface NewGroupOptions {
    /** At least one. */
    attributes: readonly GroupAttribute[];
    /** Default: LUNA's localized `New Group`. */
    name?: string;
    /** Tracks and buses to put in it. */
    members?: readonly ChannelRef[];
    /** Number the name when another group has it, as LUNA's own menu does. Default false. */
    makeNameUnique?: boolean;
}
interface AffectedTracksOptions {
    /** The edit context whose selection and group switches apply. Default `main`. */
    contextType?: string;
}
/**
 * One group.
 *
 * @example
 * const g = session.groups.byId(uid)!;
 * g.name.value; g.attributes.value; g.members.value;
 */
declare class Group extends Node {
    private readonly sessionUid;
    readonly name: Prop<string>;
    /** Parsed from LUNA's `group_attributes` CSV, in the order `edit, mix, plugin, send`. */
    readonly attributes: Prop<readonly GroupAttribute[]>;
    /** Display order among the session's groups, from 1. */
    readonly order: Prop<number>;
    /**
     * Uids of the tracks and buses in the group, each once, in the order they joined. Loaded
     * with the group; follows `addMembers`, `removeMembers` and LUNA's own edits.
     *
     * @example
     * g.members.onChange(() => render(g.members.value ?? []));
     */
    readonly members: Prop<readonly string[]>;
    private readonly rows;
    private get session();
    private waitFor;
    /**
     * Add tracks or buses to this group in one undo step, and resolve once they show in
     * {@link members}.
     *
     * @example
     * await group.addMembers([track, bus.id]);
     */
    addMembers(channels: readonly ChannelRef[]): Promise<void>;
    /**
     * Take tracks or buses out of this group in one undo step, and resolve once they have left
     * {@link members}. One that is not in it is ignored.
     *
     * @example
     * await group.removeMembers([track]);
     */
    removeMembers(channels: readonly ChannelRef[]): Promise<void>;
    /**
     * Delete this group (its tracks and buses stay) and resolve once it has left
     * `session.groups`.
     *
     * @example
     * await group.delete();
     */
    delete(): Promise<void>;
    protected release(): void;
}
/**
 * The session's groups. Not loaded by `session.ready()`: call {@link load} first.
 *
 * @example
 * await session.groups.load();
 * session.groups.sorted.map((g) => g.name.value);
 */
declare class Groups extends Collection<Group> {
    private readonly sessionUid;
    /**
     * Read the groups and each group's members.
     *
     * @example
     * await session.groups.load();
     */
    load(): Promise<void>;
    /** Groups in LUNA's display order. */
    get sorted(): Group[];
    /**
     * Make a group in one undo step, enabled in every edit context, and resolve to it once it
     * and its members are in this list (fact 215).
     *
     * @example
     * const g = await session.groups.add({ name: 'Drums', attributes: ['mix', 'edit'], members: [kick, snare] });
     */
    add(options: NewGroupOptions): Promise<Group>;
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
    reorder(groups: readonly (Group | string)[], options?: {
        after?: Group | string | null;
    }): Promise<void>;
    /**
     * The tracks and buses an operation on `track` would reach (fact 218): the edit context's
     * selection when it holds `track`, else `track` alone, plus every member of each group that
     * holds `track` and shares an attribute with `attributes`. Reads only; changes nothing. The
     * uids come in no particular order.
     *
     * @example
     * const uids = await session.groups.affectedTracks(track, 'mix');
     */
    affectedTracks(track: ChannelRef, attributes: GroupAttribute | readonly GroupAttribute[], options?: AffectedTracksOptions): Promise<string[]>;
}

/** Options for an edit of session storage. */
interface StorageEditOptions {
    /** Record the edit in the session's undo history. Default `false`. */
    undoable?: boolean;
}
/**
 * `/sessions/<uid>/storage/<context>`: one context's records. Get one with
 * `session.storage.context(name)`.
 *
 * @example
 * const store = session.storage.context('com.example.my-add-on');
 * await store.load();
 * store.records.value; // ['layout']
 */
declare class StorageContext extends Node {
    private readonly owner;
    /** Names of this context's records. */
    readonly records: Prop<string[]>;
    /** The context's reverse-DNS name. */
    get name(): string;
    /**
     * Fetch this context's records and their values. Call once before reading
     * {@link value}; pushes keep them current while the session is watched.
     *
     * @example await store.load();
     */
    load(): Promise<void>;
    /**
     * The value of one field as a live prop, `undefined` while it does not exist.
     * `set` on it is a non-undoable write of an existing field.
     *
     * @example
     * const timeline = store.value<{ height: number }>('layout', 'timeline');
     * timeline.onChange(() => console.log(timeline.value?.height));
     * await timeline.set({ height: 240 });
     */
    value<T = unknown>(record: string, field: string): WritableProp<T>;
    /**
     * Add a field with an initial value (default `null`) and resolve once it is visible.
     * A field that already exists keeps its value.
     *
     * @example await store.add('layout', 'timeline', { height: 200 });
     */
    add(record: string, field: string, value?: unknown, options?: StorageEditOptions): Promise<void>;
    /**
     * Set an existing field and resolve once the new value is visible. Rejects with
     * `uasrv.invalid_property` if the field was never added.
     *
     * @example await store.set('layout', 'timeline', { height: 320 }, { undoable: true });
     */
    set(record: string, field: string, value: unknown, options?: StorageEditOptions): Promise<void>;
    /**
     * Remove one field, or a whole record when `field` is left out.
     *
     * @example
     * await store.remove('layout', 'timeline');
     * await store.remove('layout');
     */
    remove(record: string, field?: string, options?: StorageEditOptions): Promise<void>;
    /**
     * Remove every record in this context.
     *
     * @example await store.clear();
     */
    clear(options?: StorageEditOptions): Promise<void>;
}
/**
 * `/sessions/<uid>/storage`: every Add On's session storage, by context.
 *
 * @example
 * await session.storage.load();
 * session.storage.contexts.value; // ['com.example.my-add-on']
 * const store = session.storage.context('com.example.my-add-on');
 */
declare class SessionStorage extends Node {
    /** Names of the contexts that hold at least one field. */
    readonly contexts: Prop<string[]>;
    private readonly byName;
    /**
     * Fetch the context names.
     *
     * @example await session.storage.load();
     */
    load(): Promise<void>;
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
    context(name: string): StorageContext;
    private body;
    /** Wait for the edit to show, re-reading the context while it has not. */
    private settleOn;
    protected release(): void;
}

/**
 * One note for {@link Playlist.createNotes}. Ticks are absolute (session ticks), as LUNA's
 * verb takes them, unlike the clip-relative ticks of the {@link Note}s it returns. There is no
 * channel: LUNA's `create_note` writes every note on channel 0 (fact 111). For another
 * channel, add the notes to a clip with {@link Clip.addNotes}, which takes one.
 */
interface NewNote {
    pitch: number;
    startTick: number;
    stopTick: number;
    /** Note-on and note-off velocity, 1-127. Default 100. */
    velocity?: number;
    /** Note-off velocity, when it differs from the note-on. */
    velocityOff?: number;
}
declare class Playlist extends Node {
    readonly uid: Prop<string>;
    readonly name: Prop<string>;
    readonly trackUid: Prop<string>;
    /** Take number, 1-based. */
    readonly version: Prop<number>;
    readonly stemFormat: Prop<string>;
    readonly frozen: Prop<boolean>;
    readonly clips: Collection<Clip>;
    /**
     * What the playlist actually plays: the clips with overlaps resolved by layer, and their
     * fades (fact 116). Draw from these rather than from `clips`.
     */
    readonly compiledClips: CompiledClips;
    private readonly sessionUid;
    private readonly transactionMode;
    private contextView;
    /** The session's `main` edit context, which `create_note` both reads and overwrites. */
    private get context();
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
    createNotes(notes: readonly NewNote[]): Promise<{
        clip: Clip;
        notes: Note[];
    }>;
    /**
     * Cut every clip on this lane at each tick (LUNA's `separate_clips`). One undo step.
     *
     * @example
     * await lane.split([bar(5), bar(9)]);
     */
    split(at: number | readonly number[]): Promise<void>;
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
    heal(startTick: number, stopTick: number): Promise<void>;
    /**
     * Fade in and out every clip on the lane between two ticks, `lengthNs` long, the way
     * LUNA's Batch Fades does: butted clips get a crossfade. LUNA picks the lane through its
     * track, so this works only on the track's active playlist (fact 117). One undo step.
     *
     * @example
     * await lane.addFades({ startTick: 0, stopTick: session.transport.maxTick.value!, lengthNs: 10_000_000 });
     */
    addFades(options: {
        startTick: number;
        stopTick: number;
        lengthNs: number;
        shape?: FadeShape;
    }): Promise<void>;
    /**
     * Remove every fade, crossfades included, that lies wholly between two ticks on this lane
     * (LUNA's `delete_fades`). One undo step.
     *
     * @example
     * await lane.deleteFades(0, session.transport.maxTick.value!);
     */
    deleteFades(startTick: number, stopTick: number): Promise<void>;
    private contextPost;
    protected release(): void;
}

declare class PreferenceContext {
    private readonly client;
    /** The `/preferences` context the values live in. */
    readonly name: string;
    private readonly initialised;
    /**
     * The value stored under `key`, or `undefined` when there is none. LUNA reads a context
     * from disk only when a preference in it is initialised (fact 232), so this initialises
     * `key` first; an existing value is kept.
     *
     * @example
     * const last = await prefs.get<string>('lastPreset');
     */
    get<T = unknown>(key: string): Promise<T | undefined>;
    /**
     * Store `value` (any JSON) under `key`. LUNA writes it to disk at once (fact 232). Store
     * `null` to clear it; LUNA has no way to remove a preference.
     *
     * @example
     * await prefs.set('lastPreset', preset.uid);
     */
    set(key: string, value: unknown): Promise<void>;
    private init;
}

/**
 * A live analysis LUNA can run on a device input (fact 186). The value is the prefix of the
 * engine's `<kind>_analysis_enabled` switch.
 */
type InputAnalysisKind = 'signal_level' | 'tempo' | 'instrument' | 'stereo_detect';
/** The analysis kinds, in a stable order. */
declare const INPUT_ANALYSIS_KINDS: readonly InputAnalysisKind[];
/**
 * `/devices/<device>/inputs/<uid>`: one input of an audio device, the thing a track's
 * `inputNodeUid` points at (facts 76, 185). All of its properties are read-only.
 *
 * The props follow the engine while the input is watched: `device.inputs.watch()` follows every
 * input of the device (hotplug, `in_use`, analysis results); {@link watchAnalysis} watches this
 * one input while it holds an analysis on.
 *
 * @example
 * const input = device.inputs.items[0];
 * console.log(input.name.value, input.stemFormat.value, input.deviceChannels.value);
 * await track.inputNodeUid.set(input.id);
 */
declare class DeviceInput extends Node {
    /** The input's uid; the same as {@link Node.id}. */
    readonly uid: Prop<string>;
    readonly name: Prop<string>;
    /** The engine's object type, `input`. */
    readonly type: Prop<string>;
    /** `mono` or `stereo`. */
    readonly stemFormat: Prop<StemFormat>;
    /** Uid of the device the input belongs to (`device_id`). */
    readonly deviceId: Prop<string>;
    readonly deviceName: Prop<string>;
    /** The device's channel numbers this input reads, from 0 (`device_channels`). */
    readonly deviceChannels: Prop<number[]>;
    /** The hardware's channel index list (`ChannelIndex`), as the driver reports it. */
    readonly channelIndex: Prop<number[]>;
    /** The hardware's I/O types (`IOType`), for example `["Mic"]`; empty for a plain driver. */
    readonly ioType: Prop<string[]>;
    /** True while a track in any open session records from this input (fact 185). */
    readonly inUse: Prop<boolean>;
    /**
     * The input's description as LUNA saves it with a track (`io_desc`): `name`, `stem_format`,
     * `device_channels`, `IOType`, `ChannelIndex`, `Name`, `DeviceHwID`, `hardware_index`.
     * Read-only here.
     */
    readonly ioDesc: Prop<Record<string, unknown>>;
    /** `signal_level_analysis_enabled`. Turn it on with {@link watchAnalysis}. */
    readonly signalLevelAnalysisEnabled: Prop<boolean>;
    /** `tempo_analysis_enabled`. */
    readonly tempoAnalysisEnabled: Prop<boolean>;
    /** `instrument_analysis_enabled`. */
    readonly instrumentAnalysisEnabled: Prop<boolean>;
    /** `stereo_detect_analysis_enabled`. */
    readonly stereoDetectAnalysisEnabled: Prop<boolean>;
    /**
     * The input's peak since the last result, as a linear gain (0..1, 1 = full scale), while
     * signal-level analysis is on. `-144` (LUNA's dB floor) means no result: the analysis is off,
     * or the input is below its silence threshold (fact 187).
     */
    readonly signalLevelPeak: Prop<number>;
    /** Detected tempo in BPM while tempo analysis is on; `0` means none detected (fact 187). */
    readonly tempo: Prop<number>;
    /** Detected instrument name while instrument analysis is on; `null` means none (fact 187). */
    readonly instrument: Prop<string | null>;
    /** True when stereo-detect analysis hears a stereo source; false also means no result (fact 187). */
    readonly stereoDetect: Prop<boolean>;
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
    watchAnalysis(kind: InputAnalysisKind): {
        ready: Promise<void>;
        release: Unsubscribe;
    };
    /**
     * The input as the plain record {@link Client.audioInputs} returns, from the current props.
     *
     * @example
     * const rows = device.inputs.items.map((i) => i.snapshot());
     */
    snapshot(): AudioInput;
}
/**
 * `/devices/<device>/inputs`: a device's inputs. `watch()` here is recursive by default, so a
 * watched collection follows inputs being added and removed (hotplug) and every input's
 * properties: `in_use`, and analysis results while an analysis is on (fact 185).
 *
 * @example
 * const w = device.inputs.watch();
 * await w.ready;
 * device.inputs.onChange(() => render(device.inputs.items));
 * // later
 * w.release();
 */
declare class DeviceInputs extends Collection<DeviceInput> {
    /**
     * Subscribe to the inputs and load them. Recursive unless `{ recursive: false }`, which
     * follows only inputs coming and going. Call `release` when done.
     *
     * @example
     * const w = device.inputs.watch();
     * await w.ready;
     */
    watch(options?: {
        recursive?: boolean;
    }): {
        ready: Promise<void>;
        release: Unsubscribe;
    };
}
/**
 * `/devices/<device>/outputs/<uid>`: one output of an audio device (fact 189). Read-only.
 *
 * @example
 * await device.outputs.load();
 * const monitor = device.outputs.items.find((o) => o.ioType.value?.[0] === 'CtrlRoom');
 */
declare class DeviceOutput extends Node {
    readonly uid: Prop<string>;
    readonly name: Prop<string>;
    /** The engine's object type, `output`. */
    readonly type: Prop<string>;
    /** `mono` or `stereo`. */
    readonly stemFormat: Prop<StemFormat>;
    /**
     * The hardware's I/O types (`IOType`), for example `["CtrlRoom"]` for an Apollo's monitor
     * output; empty for a plain driver (fact 189).
     */
    readonly ioType: Prop<string[]>;
    readonly deviceId: Prop<string>;
    readonly deviceName: Prop<string>;
    readonly deviceChannels: Prop<number[]>;
    readonly channelIndex: Prop<number[]>;
    readonly inUse: Prop<boolean>;
}
/**
 * `/devices/<device>/outputs`: a device's outputs. `watch()` is recursive by default, like
 * {@link DeviceInputs}.
 *
 * @example
 * const w = device.outputs.watch();
 * await w.ready;
 * device.outputs.items.map((o) => o.name.value);
 */
declare class DeviceOutputs extends Collection<DeviceOutput> {
    /**
     * Subscribe to the outputs and load them; recursive unless `{ recursive: false }`.
     *
     * @example
     * const w = device.outputs.watch();
     * await w.ready;
     */
    watch(options?: {
        recursive?: boolean;
    }): {
        ready: Promise<void>;
        release: Unsubscribe;
    };
}
/** The value of the root's `active_audio_engine` property (fact 190). */
interface ActiveAudioEngineInfo {
    /** False while LUNA runs with no audio driver. */
    enabled: boolean;
    /** `apollo`, `volt`, `system`, `other`, or `''` when undefined. */
    audio_engine_type: string;
    /** The drivers in use, in the shape `luna.drivers.connected` lists them. */
    devices: AudioDeviceInfo[];
    /** Per-driver output settings; LUNA's own. */
    outputs?: unknown[];
}
/**
 * The audio engine LUNA is running (the root's read-only `active_audio_engine`, fact 190):
 * whether audio is on, which kind of engine, and which drivers it uses. Lets an Add On tell
 * when audio is down.
 *
 * @example
 * const w = luna.activeAudioEngine.watch();
 * await w.ready;
 * luna.activeAudioEngine.enabled.onChange(() => banner.hidden = luna.activeAudioEngine.enabled.value !== false);
 */
declare class ActiveAudioEngine {
    private readonly client;
    /** The whole value, as LUNA sends it. */
    readonly info: Prop<ActiveAudioEngineInfo>;
    /** `info.enabled`. */
    readonly enabled: Prop<boolean>;
    /** `info.audio_engine_type`. */
    readonly engineType: Prop<string>;
    /** `info.devices`. */
    readonly devices: Prop<AudioDeviceInfo[]>;
    private loading;
    /**
     * Read the value once. Later calls return the same promise.
     *
     * @example
     * await luna.activeAudioEngine.load();
     * luna.activeAudioEngine.engineType.value; // 'apollo'
     */
    load(): Promise<void>;
    /**
     * Subscribe to the property and read it, so the props follow LUNA. Refcounted through the
     * Store; call `release` when done.
     *
     * @example
     * const w = luna.activeAudioEngine.watch();
     * await w.ready;
     */
    watch(): {
        ready: Promise<void>;
        release: Unsubscribe;
    };
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
    isDeviceActive(driver: string | Pick<AudioDeviceInfo, 'id'>): boolean;
}

/**
 * Engine-wide nodes outside any session: audio drivers, hardware devices, preferences,
 * renders and jobs. Thin typed views; use `property()` for anything not named here.
 */

interface AudioDeviceInfo {
    id: string;
    name: string;
    type: string;
    manufacture?: string;
    transport?: string;
    num_inputs: number;
    num_outputs: number;
    input_names?: string[] | string;
    output_names?: string[] | string;
    is_system_input?: boolean;
    is_system_output?: boolean;
}
/** `/drivers`: what audio hardware the engine sees. */
declare class Drivers extends Node {
    readonly connected: Prop<AudioDeviceInfo[]>;
    readonly unsupported: Prop<AudioDeviceInfo[]>;
    readonly sampleRates: Prop<number[]>;
}
/** A device input a track can record from, as {@link Client.audioInputs} lists it. */
interface AudioInput {
    /** What a track's `inputNodeUid` is set to. */
    readonly uid: string;
    readonly name: string;
    /** `mono` or `stereo`. */
    readonly stemFormat: string;
    /** The device this input belongs to, e.g. `BuiltInMicrophoneDevice`. */
    readonly deviceId: string;
    /** True when another track already records from it. */
    readonly inUse: boolean;
}
/** `/devices/<uid>`: a hardware or virtual device with its own tracks, buses, inputs, outputs. */
declare class Device extends Node {
    readonly name: Prop<string>;
    readonly deviceType: Prop<string>;
    readonly online: Prop<boolean>;
    readonly sampleRate: Prop<number>;
    readonly clockSource: Prop<string>;
    /**
     * The device's audio inputs, live (fact 185). `inputs.watch()` follows hotplug, `in_use` and
     * analysis results.
     *
     * @example
     * const w = device.inputs.watch();
     * await w.ready;
     * device.inputs.items.map((i) => i.name.value);
     */
    readonly inputs: DeviceInputs;
    /**
     * The device's audio outputs (fact 189).
     *
     * @example
     * await device.outputs.load();
     * device.outputs.items.map((o) => [o.name.value, o.stemFormat.value]);
     */
    readonly outputs: DeviceOutputs;
    protected release(): void;
}
declare class Devices extends Collection<Device> {
}
/** The uid of LUNA's own device under `/devices`, which holds its MIDI devices (fact 123). */
declare const LUNA_DEVICE_UID = "d37e009d693549a0b6ab1da3fad05443";
/**
 * `/devices/<LUNA>/midi/<uid>/input_ports/<n>` or `output_ports/<n>`: one of a MIDI device's
 * ports. `uid` is the engine node MIDI from the device (an input port) or to it (an output
 * port) passes through (fact 123).
 *
 * @example
 * await luna.midiDevices.load();
 * const volt = luna.midiDevices.items.find((d) => d.name.value === 'Volt 876');
 * console.log(volt?.outputPort?.uid.value);
 */
declare class MidiPort extends Node {
    readonly uid: Prop<string>;
    /** True for a port that sends to the device, false for one that receives from it. */
    get isOutput(): boolean;
}
/**
 * `/devices/<LUNA>/midi/<uid>`: a MIDI device LUNA sees, as its MIDI settings list it. Besides
 * the real devices, LUNA lists `All` and `None`, whose settings read `null`; `isPhysical` is
 * false for those two (fact 123).
 *
 * @example
 * await luna.midiDevices.load();
 * for (const d of luna.midiDevices.items.filter((d) => d.isPhysical)) {
 *   console.log(d.name.value, d.midiDeviceType.value);
 * }
 */
declare class MidiDevice extends Node {
    readonly name: Prop<string>;
    /** `normal` for a plain MIDI device; `null` for `All` and `None`. */
    readonly midiDeviceType: Prop<string | null>;
    readonly midiDeviceMode: Prop<string | null>;
    /** Milliseconds LUNA shifts MIDI sent to this device. */
    readonly outputLateness: Prop<number | null>;
    readonly midiClockGenerationEnabled: Prop<boolean | null>;
    /** For example `song1`. */
    readonly midiClockGenerationMode: Prop<string | null>;
    readonly midiClockGenerationOffsetMs: Prop<number | null>;
    /** `[status, data1, data2]` of the last note LUNA received from it; `[255, 255, 255]` before any. */
    readonly lastMidiNote: Prop<number[]>;
    /** `[status, data1, data2]` of the last controller LUNA received from it; `[255, 255, 255]` before any. */
    readonly lastMidiControl: Prop<number[]>;
    /**
     * Ports that receive MIDI from the device. `All` and `None` have one too. Empty on a LUNA
     * that does not publish ports (fact 123).
     */
    readonly inputPorts: Collection<MidiPort>;
    /** Ports that send MIDI to the device; empty for a device with no MIDI out (fact 123). */
    readonly outputPorts: Collection<MidiPort>;
    /** The device's first input port. LUNA gives a device at most one. */
    get inputPort(): MidiPort | undefined;
    /** The device's first output port, or `undefined` when it has no MIDI out. */
    get outputPort(): MidiPort | undefined;
    protected release(): void;
    /** False for LUNA's `All` and `None` entries, true for a device that exists. */
    get isPhysical(): boolean;
}
/**
 * `/devices/<LUNA>/midi`: the MIDI devices LUNA sees. The folder is outside any session, so
 * `watch()` it to follow devices plugged in or removed (fact 34).
 *
 * @example
 * const w = luna.midiDevices.watch();
 * await w.ready;
 * luna.midiDevices.onChange(() => draw(luna.midiDevices.items.filter((d) => d.isPhysical)));
 */
declare class MidiDevices extends Collection<MidiDevice> {
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
    onChange(listener: () => void): Unsubscribe;
}
/** `/preferences`: engine preferences as writable properties by name. */
declare class Preferences extends Node {
    readonly ioBufferSize: Prop<number>;
    readonly playFromStopLocation: Prop<boolean>;
    readonly recordMute: Prop<boolean>;
    readonly metronomeSound: Prop<string>;
    readonly metronomeSounds: Prop<string[]>;
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
    context(name: string): PreferenceContext;
}
/**
 * `/renders/<uid>`: a bounce or an export. `state` runs `created` -> `running` ->
 * `completed` | `aborted`, and LUNA drops the node shortly after it settles, so latch
 * anything you still need rather than reading it later (fact 44).
 *
 * @example
 * const { render } = await session.bounce({ channelUids: [track.id] });
 * render.progress.onChange(() => (bar.value = render.progress.value ?? 0));
 * await render.done();
 */
declare class Render extends Node {
    readonly state: Prop<string>;
    /** 0..100, as the engine reports it. {@link progress} is the 0..1 view. */
    readonly percentComplete: Prop<number>;
    readonly errorMessage: Prop<string | null>;
    readonly name: Prop<string>;
    readonly renderType: Prop<string>;
    /** Seconds left, as the engine estimates it; absent for an offline render. */
    readonly timeRemaining: Prop<number | undefined>;
    /** True for an offline (faster than real time) render, which reports no time remaining. */
    readonly isOffline: Prop<boolean>;
    readonly totalSamples: Prop<number | undefined>;
    /** 0..1, ready for a `<progress>` element. */
    readonly progress: Prop<number>;
    /** `completed`, `aborted` or `failed`: nothing more will happen. */
    get isTerminal(): boolean;
    /**
     * Resolve when the render completes; reject when it is aborted, fails, or the engine
     * removes the node before it was seen to finish. A short offline render can finish and
     * vanish before anything observes it (fact 44), which surfaces as a `removed` rejection
     * even though the output was written.
     */
    done(timeoutMs?: number): Promise<void>;
    abort(): Promise<unknown>;
    delete(): Promise<unknown>;
}
declare class Renders extends Collection<Render> {
}
/**
 * `/jobs/<uid>`: long-running engine jobs (lyric transcription, chord extraction, ...).
 * `percentComplete` is 0..100. LUNA publishes the terminal status and removes the node in the
 * same turn (fact 200); {@link done} latches the ending for you. Only `cancel()` exists; there
 * is no delete. A job you launch yourself is easier to follow through the `Luna.JobRun` its
 * command returns (`session.musical.chords.detect()`, `session.lyrics.transcribe()`).
 *
 * @example
 * await luna.jobs.load();
 * const job = luna.jobs.items.find((j) => j.jobType.value === 'lyric_transcription');
 * if (job) console.log((await job.done()).status);
 */
declare class Job extends Node {
    readonly uid: Prop<string>;
    /** Nil uuid (32 zeros) when the job belongs to no session. */
    readonly sessionUid: Prop<string>;
    readonly jobType: Prop<string>;
    /** `queued | running | canceling | completed | failed | canceled`. */
    readonly status: Prop<string>;
    readonly stage: Prop<string>;
    readonly error: Prop<string>;
    readonly warning: Prop<string>;
    /** Track uid the job targets, when any. */
    readonly targetUid: Prop<string | undefined>;
    readonly cancellable: Prop<boolean>;
    readonly percentComplete: Prop<number>;
    get isTerminal(): boolean;
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
    done(timeoutMs?: number): Promise<JobResult>;
    cancel(): Promise<unknown>;
}
declare class Jobs extends Collection<Job> {
}

/** One assignment's destination. `uid` is a track's, a bus's or an effect's; `name` a MIDI device's. */
type MidiOutputDestination = {
    kind: 'track';
    uid: string;
} | {
    kind: 'bus';
    uid: string;
} | {
    kind: 'effect';
    uid: string;
} | {
    kind: 'device';
    name: string;
};
/**
 * One route for {@link MidiOutputs.set}: to a track or a bus (by object or uid), or to a MIDI
 * device by its name (`luna.midiDevices` lists them). `channel` is stored as given: LUNA's own
 * menu writes 0 for all channels and 1-16 for one channel (fact 220).
 */
type MidiRoute = {
    track: {
        readonly id: string;
    } | string;
    channel: number;
} | {
    device: {
        readonly name: Prop<string>;
    } | string;
    channel: number;
};
/**
 * One assignment row.
 *
 * @example
 * const a = track.midiOutputs.items[0];
 * a.destination.value; // { kind: 'track', uid: '...' }
 * a.channel.value;     // 0 (all channels)
 */
declare class MidiOutputAssignment extends Node {
    readonly destinationTrackUid: Prop<string | null>;
    readonly destinationBusUid: Prop<string | null>;
    readonly effectUid: Prop<string | null>;
    /** The MIDI device's name. */
    readonly midiDevice: Prop<string | null>;
    /** The channel as LUNA stores it: 0 for all channels, 1-16 for one (fact 220). */
    readonly channel: Prop<number>;
    /** Whichever of the four destination properties is set. `undefined` until loaded. */
    readonly destination: Prop<MidiOutputDestination>;
}
/**
 * A track's MIDI output assignments. Under a session that called `ready()` they follow LUNA;
 * call {@link load} once to read them.
 *
 * @example
 * await track.midiOutputs.load();
 * track.midiOutputs.onChange(() => render(track.midiOutputs.items));
 */
declare class MidiOutputs extends Collection<MidiOutputAssignment> {
    private readonly sessionUid;
    private readonly trackUid;
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
    set(routes: readonly MidiRoute[]): Promise<void>;
}

type TrackType = 'audio' | 'instrument' | 'midi_matrix' | 'bus' | 'click' | 'count_in' | 'multi_output' | 'video';
/** The commands LUNA can run on a take once it is recorded (fact 233). */
declare const POST_RECORD_COMMANDS: readonly ["extract_lyrics", "extract_chords"];
type PostRecordCommand = (typeof POST_RECORD_COMMANDS)[number];
declare class Track extends Channel {
    readonly trackType: Prop<TrackType>;
    readonly ioType: Prop<string>;
    readonly recordEnabled: WritableProp<boolean>;
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
    readonly inputMonitor: WritableProp<boolean>;
    /**
     * Whether LUNA is monitoring this track's input right now (`input_monitor_state`,
     * read-only). It can be true while `inputMonitor` is false: an armed track is monitored
     * while stopped or punched in (fact 88).
     *
     * @example
     * t.inputMonitoring.onChange(() => led.classList.toggle('on', t.inputMonitoring.value === true));
     */
    readonly inputMonitoring: Prop<boolean>;
    /** Description of the assigned input. */
    readonly inputDesc: Prop<unknown>;
    readonly inputNodeUid: WritableProp<string | null>;
    /** Uid of the active playlist; the playlist object lives under `session.playlists`. */
    readonly playlistUid: Prop<string>;
    readonly hasPreamp: Prop<boolean>;
    readonly recordMute: Prop<boolean>;
    /**
     * The uid of the track preset (or instrument plugin preset) the track was made from or last
     * had applied, or null (fact 132).
     */
    readonly presetUid: Prop<string | null>;
    /** That preset's name, or null. */
    readonly presetName: Prop<string | null>;
    /**
     * Whether Auto Gain can run on this track's input (`supports_auto_gain`, read-only): true for
     * an input on hardware whose preamp LUNA can set. LUNA works it out after the input changes,
     * so it can arrive a moment later (fact 194).
     *
     * @example
     * button.disabled = track.supportsAutoGain.value !== true;
     */
    readonly supportsAutoGain: Prop<boolean>;
    /**
     * Where this track sends its MIDI (facts 219-220). `await track.midiOutputs.load()` once.
     *
     * @example
     * await track.midiOutputs.set([{ track: synth, channel: 0 }]);
     */
    readonly midiOutputs: MidiOutputs;
    /**
     * What LUNA runs on each audio take this track records, once the take lands (fact 233):
     * `extract_lyrics` transcribes it into `session.lyrics`, `extract_chords` detects its chords.
     * LUNA keeps the list while the session is open, not in the session file: set it again after
     * reopening. `[]` runs nothing.
     *
     * @example
     * await track.postRecordCommands.set(['extract_lyrics']);
     */
    readonly postRecordCommands: WritableProp<PostRecordCommand[]>;
    /**
     * The instrument LUNA detected on this track (`instrument_determined`), e.g. `"Electric
     * Guitar"`, or `null` (fact 233). Read-only here: it is LUNA's analysis result.
     *
     * @example
     * label.textContent = track.instrumentDetermined.value ?? '';
     */
    readonly instrumentDetermined: Prop<string | null>;
    /**
     * True once the name was set as the user's own (LUNA's rename, or {@link rename}): a track
     * or instrument preset loaded later keeps it (fact 165). `name.set` leaves it as it is.
     */
    readonly nameModified: Prop<boolean>;
    protected release(): void;
    /** Track solo (a track-level control, unlike mute which is on the main output). */
    get solo(): Control;
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
    rename(name: string): Promise<void>;
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
    loadPreset(preset: string | Pick<PresetRow, 'uid'>): Promise<void>;
    /** Delete this track. */
    delete(): Promise<void>;
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
    duplicate(options?: {
        includeContent?: boolean;
        after?: Channel | string;
        timeoutMs?: number;
    }): Promise<Track>;
}

interface TransportLocation extends Location {
    /**
     * The playhead as LUNA's own MIN:SEC counter shows it: whole `minutes`, and `seconds`
     * within the minute (fact 96). Present on the engine's `location` pushes. `seconds`
     * can be fractional, so floor it for display (`Luna.formatMinSec` does). For wall-clock
     * seconds derived from the tick, use {@link Transport.seconds}.
     */
    min_sec?: {
        minutes: number;
        seconds: number;
    };
    tempo?: number;
    time_signature?: {
        numerator: number;
        denominator: number;
    };
    playing?: boolean;
}
type RecPlayMode = string;
/** Where to seek: a tick, or a bar|beat|tick position (`beat` defaults to 1, `tick` to 0). */
type SeekTarget = number | {
    bar: number;
    beat?: number;
    tick?: number;
};
interface SeekOptions {
    /**
     * When playing, when the playhead jumps: `'now'` (default), at the `'next_bar'`, or at the
     * `'loop_end'`. A play start moved during playback does nothing until then (fact 90).
     */
    sync?: 'now' | 'next_bar' | 'loop_end';
}
declare class Transport extends Node {
    private readonly musical?;
    readonly playing: WritableProp<boolean>;
    readonly recordEnabled: WritableProp<boolean>;
    readonly looping: WritableProp<boolean>;
    /** Where playback starts (ticks); also the resting playhead when stopped. */
    readonly playStart: WritableProp<number>;
    readonly loopStart: WritableProp<number>;
    readonly loopStop: WritableProp<number>;
    /** Where {@link returnToZero} goes (ticks). LUNA reads it as 0 until it is set (fact 89). */
    readonly arrangementStart: WritableProp<number>;
    /** Live playhead, pushed many times per second while playing. */
    readonly location: Prop<TransportLocation>;
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
    readonly tempo: Prop<number>;
    /**
     * Time signature in effect at the playhead, carved out of the `location` pushes. Notifies
     * only when it changes. Format with `Luna.formatTimeSignature`.
     *
     * @example
     * t.timeSignature.onChange(() => meter.textContent = Luna.formatTimeSignature(t.timeSignature.value));
     */
    readonly timeSignature: Prop<{
        numerator: number;
        denominator: number;
    }>;
    readonly countingIn: Prop<boolean>;
    readonly punchedIn: Prop<boolean>;
    readonly maxTick: Prop<number>;
    /**
     * Playback speed as a percentage of the tempo map (100 is as written), applied only while
     * {@link enableTempoPercent} is on. Not undoable. LUNA publishes both only when its
     * tempo-percent feature is enabled; elsewhere they stay `undefined` (fact 155).
     *
     * @example
     * await t.tempoPercent.set(80);
     * await t.enableTempoPercent.set(true);   // practice at 80%
     */
    readonly tempoPercent: WritableProp<number>;
    /** Whether {@link tempoPercent} applies (fact 155). @example await t.enableTempoPercent.set(false); */
    readonly enableTempoPercent: WritableProp<boolean>;
    readonly recPlayMode: Prop<RecPlayMode>;
    readonly countInEnabled: WritableProp<boolean>;
    readonly preRollEnabled: WritableProp<boolean>;
    readonly postRollEnabled: WritableProp<boolean>;
    /**
     * How long the pre-roll is, as LUNA stores it: a `"bars,beats,ticks"` duration string
     * (`"1,0,0"` is one bar, `"0,2,0"` two beats; ticks are engine ticks). Read and write it with
     * `Luna.parseRollDuration` and `Luna.formatRollDuration`. Used while
     * {@link preRollEnabled} is on (fact 156).
     *
     * @example await t.preRoll.set(Luna.formatRollDuration({ bars: 2 }));
     */
    readonly preRoll: WritableProp<string>;
    /** How long the post-roll is, in the same form as {@link preRoll} (fact 156). @example await t.postRoll.set('1,0,0'); */
    readonly postRoll: WritableProp<string>;
    /** Whether the click sounds during playback (fact 155). @example await t.clickDuringPlay.set(false); */
    readonly clickDuringPlay: WritableProp<boolean>;
    /** Whether the click sounds while recording (fact 155). @example await t.clickDuringRecord.set(true); */
    readonly clickDuringRecord: WritableProp<boolean>;
    /** Whether the click sounds during the count-in (fact 155). @example await t.clickDuringCountIn.set(true); */
    readonly clickDuringCountIn: WritableProp<boolean>;
    /**
     * Whether MIDI recorded over an existing MIDI clip merges into it (on) or makes a new take
     * (off) (fact 155).
     *
     * @example await t.mergeMidi.set(true);
     */
    readonly mergeMidi: WritableProp<boolean>;
    /** Current playhead in ticks: the live location while playing, else the play start. */
    get tick(): number;
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
    get seconds(): number;
    play(): Promise<void>;
    stop(): Promise<void>;
    toggle(): Promise<void>;
    /** Arm and start recording. */
    record(): Promise<void>;
    /**
     * LUNA's record toggle (fact 80): flip the session's `record_enabled`, and start playback
     * when that turned record on while stopped. Turning record off leaves playback running.
     */
    toggleRecord(): Promise<void>;
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
    seek(to: SeekTarget, options?: SeekOptions): Promise<void>;
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
    setPlayStart(to: SeekTarget, options?: SeekOptions): Promise<void>;
    private confirmPlayStart;
    /**
     * LUNA's Return To Zero (fact 89): {@link seek} to the arrangement start. That is tick 0
     * until the session sets one, and tick 0 need not be bar 1 (fact 91); for bar 1 use
     * `seek({ bar: 1 })`. Unlike LUNA's button it leaves the edit selection alone.
     *
     * @example
     * await session.transport.returnToZero();
     */
    returnToZero(options?: SeekOptions): Promise<void>;
    private resolve;
    private reread;
    setLoop(startTick: number, stopTick: number): Promise<void>;
    /** Restart playback, optionally quantised to the next bar or loop end. */
    sync(at?: 'now' | 'next_bar' | 'loop_end'): Promise<void>;
}

/**
 * How soloing a track treats the others (fact 157): `'latching'` adds it to what is soloed,
 * `'exclusive'` unsolos the rest (LUNA does that only inside a touch, fact 78).
 */
type SoloMode = 'latching' | 'exclusive';
/**
 * How far past the punch point {@link Session.record} widens `loop_stop` when it has to.
 * One bar of 4/4 at any tempo is plenty: the gate is on the punch point, not the take's end.
 */
declare const RECORD_LOOP_MARGIN_TICKS: number;
interface RecordOptions {
    /** The audio track to record onto, or its uid. */
    track: Track | string;
    /** A device input to route first, from {@link Client.audioInputs}. Left alone when omitted. */
    inputUid?: string;
    /** Where to punch in. The current play start when omitted. */
    startTick?: number;
    /** How long to hold after the punch. Give this, a `signal`, or both. */
    seconds?: number;
    /** Abort the pass early. */
    signal?: AbortSignal;
    /** Cap on a signal-only pass. Default 600. */
    maxSeconds?: number;
}
interface UploadOptions {
    /** The file's bytes: a browser `File`/`Blob`, an `ArrayBuffer` or a `Uint8Array`. */
    bytes: Blob | ArrayBuffer | Uint8Array;
    /** File name to store it under. Taken from a `File` when omitted. */
    name?: string;
    /** Bytes per `transfer` post. Clamped to 1 KiB..4 MiB; default 256 KiB. */
    chunkBytes?: number;
    /** Called after each chunk with the bytes sent so far and the total. */
    onProgress?: (sent: number, total: number) => void;
    /** How long to wait for the workspace to list the finished source. Default 30 000 ms. */
    timeoutMs?: number;
}
interface ImportPathOptions {
    /** Name to store the source under. Default: the file name from `path`. */
    name?: string;
    /** How long to wait for the workspace to list the new source. Default 30 000 ms. */
    timeoutMs?: number;
    /**
     * What the file is. Default `'audio'`, which resolves to an {@link AudioSource}; `'midi'`
     * and `'video'` resolve to an {@link ImportedFile} (fact 163). LUNA checks the content is
     * what the type says and refuses it with `uasrv.invalid_value` otherwise.
     */
    type?: 'audio' | 'midi' | 'video';
}
/**
 * A MIDI or video file copied into a session's package by {@link Session.importPath}. Only the
 * file is added: no track or clip is made (fact 163). A MIDI file is filed in the package's
 * `midi` folder, a video file, with its extension, in `video`.
 */
interface ImportedFile {
    /** The file's uid in the package. */
    uid: string;
    type: 'midi' | 'video';
    /** The name it was stored under. */
    name: string;
}
interface BounceOptions {
    /** Channels to bounce, by uid. Tracks and buses both work. */
    channelUids: string[];
    name?: string;
    /** Render in real time instead of offline (offline reports no time remaining). */
    realTime?: boolean;
    recordPoint?: 'pre_effects' | 'post_effects' | 'post_pan';
    /**
     * One absolute output path per channel, in `channelUids` order. Given these, the render
     * writes files instead of adding sources to the session.
     */
    outputPaths?: string[];
    /** Absolute ticks to render; applied as the timeline selection and restored afterwards. */
    range?: {
        startTick: number;
        stopTick: number;
    };
}
interface ExportOptions {
    name?: string;
    realTime?: boolean;
    range?: {
        startTick: number;
        stopTick: number;
    };
}
interface NewTrackOptions {
    /** Default `'Untitled'`. */
    name?: string;
    /** Default `'audio'`. */
    trackType?: Extract<TrackType, 'audio' | 'instrument' | 'midi_matrix' | 'video'>;
    /** Default `'mono'`. */
    stemFormat?: 'mono' | 'stereo' | (string & {});
    /** How many tracks to make. Default 1. */
    count?: number;
    /** Number the name when a track or bus already has it. */
    makeNameUnique?: boolean;
    /** Place the new tracks in this folder track. */
    folderUid?: string;
}
/**
 * What a clip's length follows when the tempo changes (LUNA's `length_follows`): `'ticks'`
 * keeps its musical length, `'time'` its length in seconds. Left out, the clip follows its
 * track.
 */
type LengthFollows = 'ticks' | 'time';
/** LUNA's time-stretch algorithm for an audio clip (`alg_type`), passed verbatim. */
type AlgType = 'polyphonic' | 'monophonic' | 'efficient' | 'soloist' | 'varispeed' | 'razor_blade' | 'ua_stretch' | 'clip_effect';
interface InsertClipOptions {
    /** The track whose active playlist gets the clip. Give this or `playlistUid`. */
    trackUid?: string;
    /** The playlist (lane) that gets the clip. */
    playlistUid?: string;
    /** The source file. Required, except with `copyOf`, which defaults it to that clip's. */
    sourceUid?: string;
    /** Timeline start, in ticks. */
    startTick: number;
    /** Timeline stop, in ticks; after `startTick`. */
    stopTick: number;
    /** Offset into the source, in nanoseconds. With `copyOf`, defaults to that clip's. */
    sourceStartNs?: number;
    /** End in the source, in nanoseconds. With `copyOf`, defaults to that clip's. */
    sourceStopNs?: number;
    /** With `copyOf`, defaults to that clip's name. */
    name?: string;
    /** Default `'audio'`. */
    clipType?: 'audio' | 'video' | 'midi';
    /** Layer for overlapping clips; higher plays on top. Default: above every clip it overlaps. */
    layer?: number;
    /** What the clip's length follows on a tempo change. Default: its track's setting. */
    lengthFollows?: LengthFollows;
    /** Time-stretch algorithm for an audio clip. Default: its track's. */
    algType?: AlgType;
    /**
     * Copy this clip (LUNA's `clip_uid`): the new clip takes its gain, fades, warps, MIDI and
     * settings, placed at `startTick`-`stopTick`.
     */
    copyOf?: Clip;
}
interface NewTrackFromPresetOptions {
    /** The new track's name. Default: the preset's name. A multi-track preset's tracks keep their own. */
    name?: string;
    /** Number the name when a track or bus already has it, as LUNA's browser does. Default true. */
    makeNameUnique?: boolean;
    /** Place the new tracks before this track. Default: after the last one. */
    beforeUid?: string;
    /** Place the new tracks in this folder track. */
    folderUid?: string;
    /** The stem format of the audio track an effect plugin's preset makes. Default mono. */
    stemFormat?: 'mono' | 'stereo' | (string & {});
}
interface NewBusOptions {
    /** Default `'Bus'`. */
    name?: string;
    /** Default `'stereo'`. */
    stemFormat?: 'mono' | 'stereo' | (string & {});
}
interface NewFolderOptions {
    /** Default `'Folder'`. */
    name?: string;
    /**
     * Default `'summing'`: the tracks inside play through the folder, as a bus. `'container'`
     * only groups them; they keep routing to the nearest summing folder above, else the master.
     */
    mode?: Exclude<FolderMode, 'none'>;
    /** Default `'stereo'`. */
    stemFormat?: 'mono' | 'stereo' | (string & {});
    /** Place the new folder inside this folder. Default: the session root. */
    folderUid?: string;
}
interface MoveToFolderOptions {
    /**
     * Place the moved items just after this track or bus, as {@link Session.reorder} does: LUNA
     * then keeps each folder's contents together, so it decides their place among the items
     * already in the destination. Usually a track or bus in the destination, or the folder
     * itself for first in it. Default (or `null`): first in the destination.
     */
    after?: Channel | string | null;
}
interface ReorderOptions {
    /**
     * Place the items just after this track or bus. Default (or `null`): first. Nothing changes
     * folder, so the place is among the item's siblings: see {@link Session.reorder}.
     */
    after?: Channel | string | null;
}
interface TransactionOptions {
    /**
     * A live gesture (a drag, a slider, a preview being regenerated) instead of a batch. Each
     * command first undoes the one before it, so only the last command's effect is kept and
     * recorded; write every step relative to where things were when the transaction began,
     * never as a change from the previous step. Pushes arrive per command (fact 115).
     */
    continuous?: boolean;
}
/**
 * Which kind of {@link Session.transaction} is open: `'batch'` holds every command for one
 * undo step and holds pushes until the commit; `'continuous'` keeps only the last command.
 */
type TransactionMode = 'batch' | 'continuous';
declare class Session extends Node {
    readonly uid: string;
    readonly name: WritableProp<string>;
    readonly loaded: Prop<boolean>;
    readonly readOnly: Prop<boolean>;
    readonly sessionPackageUid: Prop<string>;
    readonly sessionPackagePath: Prop<string>;
    readonly canUndo: Prop<boolean>;
    readonly canRedo: Prop<boolean>;
    readonly changeCount: Prop<number>;
    /**
     * The session's solo mode, writable (fact 157). LUNA refuses any value but the two
     * {@link SoloMode}s. Not undoable.
     *
     * @example await session.soloMode.set('exclusive');
     */
    readonly soloMode: WritableProp<SoloMode>;
    readonly tempoEstablished: Prop<boolean>;
    readonly commandStatus: Prop<string | null>;
    readonly commandPercentComplete: Prop<number>;
    readonly transport: Transport;
    readonly tracks: Collection<Track>;
    readonly buses: Collection<Bus>;
    /** All playlists (take lanes) in the session; each names its track. */
    readonly playlists: Collection<Playlist>;
    /** Tempo map, time and key signatures, and tick/bar/seconds conversion. */
    readonly musical: Musical;
    readonly markers: Markers;
    /** The session's lyrics, ruler and transcribed (fact 152). */
    readonly lyrics: Lyrics;
    /** Mix, edit, plugin and send groups (facts 215-218). Not loaded by `ready()`: `await session.groups.load()`. */
    readonly groups: Groups;
    /** Data Add Ons keep with this session, by reverse-DNS context (fact 129). */
    readonly storage: SessionStorage;
    /** Edit contexts (`main`, `editor`, `alt_<n>`). */
    readonly contexts: Collection<Context>;
    /** The `main` edit context: selection, zoom and the context edit commands. */
    readonly context: Context;
    /**
     * Takes being recorded right now, on every armed track, before they become clips: each with
     * its growing `stop`, its audio file's waveform, or its MIDI so far (fact 149).
     */
    readonly recordTakes: RecordTakes;
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
    readonly focusedTrack: Prop<Track>;
    private sourcesCollection;
    private sourcesRelease;
    private openTransaction;
    private watchRelease;
    private readyPromise;
    /** The uid behind {@link focusedTrack}; a uid that names no track (a bus, a deleted track) is skipped. */
    private focusedTrackId;
    /**
     * Subscribe to the whole session and load its properties, tracks and buses.
     * Idempotent; resolves when the initial state is in the cells.
     */
    ready(): Promise<void>;
    /**
     * Source audio files of this session, under `/workspace/sessions/<package uid>/audio`.
     * `undefined` until the session's package uid is known (after `ready()`).
     */
    get sources(): Collection<AudioSource> | undefined;
    /**
     * The session's source files, loaded and ready: waits for `ready()` (which brings the
     * package uid), loads the folder and every member's properties, and keeps following it.
     *
     * @example
     * const sources = await session.loadSources();
     * sources.items.map((s) => s.displayName.value);
     * sources.onAnyChange(() => render(sources.items), { props: ['name', 'length'] });
     */
    loadSources(): Promise<Collection<AudioSource>>;
    /**
     * A source file's absolute path on disk, from the session's package path (fact 239):
     * `<package>/audio/<uid>.wav`, or `<package>/renders/clips/<uid>.wav` for a rendering.
     * Synchronous, so a `dragstart` handler can use it. `undefined` before `ready()`.
     *
     * @example
     * const path = session.sourcePath(source);
     * if (path) await luna.gui.revealPath(path);
     */
    sourcePath(source: AudioSource | string): string | undefined;
    /**
     * The session's own package in the workspace (name, folder, favourite, comments), loaded,
     * without loading every package (`workspace.packages`).
     *
     * @example
     * const pkg = await session.package();
     * pkg.name; pkg.directoryPath.value; await pkg.favorite.set(true);
     */
    package(): Promise<SessionPackage>;
    private packageNode;
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
    sourceUsage(): Promise<SourceUsage>;
    /** The active playlist of a track, once playlists are loaded. */
    playlistFor(track: Track): Playlist | undefined;
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
    selectTimeline(options: {
        tracks: readonly (Track | string)[];
        startTick?: number;
        stopTick?: number;
    }): Promise<void>;
    /** The master bus, once buses are loaded. */
    get master(): Bus | undefined;
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
    get channelsInOrder(): Array<Track | Bus>;
    /** Tracks sorted by their `order` key; buses and folders, which share it, are left out (fact 137). */
    get tracksInOrder(): Track[];
    /**
     * Tracks a user sees: `tracksInOrder` without LUNA's system `click` and `count_in` tracks
     * (fact 28).
     */
    get visibleTracks(): Track[];
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
    newTrack(options?: NewTrackOptions): Promise<Track[]>;
    /** The tracks `new_track` made: listed and loaded, or handles inside a batch. */
    private resolveTracks;
    /**
     * Create an aux bus (`new_track` with `track_type: "bus"`, fact 83) in one undo step, and
     * resolve to the {@link Bus} once it is listed in {@link buses} with its properties loaded.
     *
     * @example
     * const reverb = await session.newBus({ name: 'Reverb' });
     * await track.outputs.byId('send_0').assign(reverb);
     */
    newBus(options?: NewBusOptions): Promise<Bus>;
    /** Post `new_track` for a bus and resolve to it, listed and loaded. */
    private createBus;
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
    newFolder(options?: NewFolderOptions): Promise<Bus>;
    /**
     * The folder tracks, in no particular order: the buses whose folder mode is not `'none'`.
     * Use {@link folderContents} for the hierarchy.
     *
     * @example
     * for (const folder of session.folders) console.log(folder.name.value, folder.folderMode.value);
     */
    get folders(): Bus[];
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
    folderContents(folder: Bus | string | null): Array<Track | Bus>;
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
    moveToFolder(items: ReadonlyArray<Channel | string>, folder: Bus | string | null, options?: MoveToFolderOptions): Promise<void>;
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
    reorder(items: ReadonlyArray<Channel | string>, options?: ReorderOptions): Promise<void>;
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
    newTrackFromPreset(preset: Pick<PresetRow, 'uid' | 'name'>, options?: NewTrackFromPresetOptions): Promise<Track[]>;
    undo(count?: number): Promise<unknown>;
    redo(count?: number): Promise<unknown>;
    /** Save (commit) the session. */
    save(options?: {
        label?: string;
        comments?: string;
    }): Promise<unknown>;
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
    transaction<T>(name: string, fn: () => Promise<T>, options?: TransactionOptions): Promise<T>;
    /** True while a {@link transaction} is open, of either kind. */
    get batching(): boolean;
    /** The kind of {@link transaction} open now, or `undefined` outside one. */
    get transactionMode(): TransactionMode | undefined;
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
    insertClip(options: InsertClipOptions): Promise<Clip>;
    /** Create a new playlist version on the given tracks, empty or duplicating the current one. */
    newPlaylists(trackUids: string[], options?: {
        duplicate?: boolean;
    }): Promise<unknown>;
    /** Make a playlist version active on a track. */
    setPlaylist(trackUid: string, version: number): Promise<unknown>;
    /** Add a marker at `tick`. Resolves to the reply (`{ rowid }` on current engines). */
    /**
     * Add a marker at `tick` and resolve once it is in {@link markers}. `set_marker` answers
     * `null` whether or not it did anything (fact 71), so the list is the proof.
     *
     * @example
     * await session.addMarker(Luna.WHOLE_NOTE * 8, 'Chorus');
     */
    addMarker(tick: number, name: string, options?: {
        color?: number;
        comments?: string;
    }): Promise<unknown>;
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
    moveClips(toTick: number, options?: {
        startTick?: number;
        stopTick?: number;
        trackUids?: string[];
        copy?: boolean;
        contextType?: string;
        playlists?: ReadonlyArray<{
            from: Playlist | string;
            to: Playlist | string;
        }>;
        moveAutomation?: boolean;
    }): Promise<unknown>;
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
    deletePlaylists(playlists: ReadonlyArray<Playlist | string>): Promise<void>;
    /**
     * Delete every playlist version the given tracks are not using, keeping the one each plays
     * (`delete_playlists` with `delete_unused`, which lists the versions to keep, fact 170).
     * Resolves once they have left {@link playlists}.
     *
     * @example
     * await session.deleteUnusedPlaylists([vocal, double]);
     */
    deleteUnusedPlaylists(tracks: ReadonlyArray<Track | string>): Promise<void>;
    private settlePlaylistsGone;
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
    newTracksFromInputs(options: {
        inputUids: readonly string[];
        recordEnable?: boolean;
        autoGain?: boolean;
        stemFormat?: 'mono' | 'stereo';
    }): Promise<Track[]>;
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
    setFadeCurve(fades: ReadonlyArray<{
        readonly uid: string;
    } | undefined>, options: {
        shape?: FadeShape;
        curvature?: number;
        reset?: boolean;
    }): Promise<void>;
    /**
     * Delete tracks by uid in one undo step, and resolve once they have left {@link tracks}.
     *
     * @example
     * await session.deleteTracks([scratch.id]);
     */
    deleteTracks(trackUids: string[]): Promise<unknown>;
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
    uploadFile(options: UploadOptions): Promise<AudioSource>;
    /** Wait for `uid` to appear in the workspace audio folder, re-reading it while waiting. */
    private listedSource;
    /**
     * Copy a file the engine can read from disk into this session's package as a new audio
     * source, and resolve to it once the workspace lists it (fact 42, `local_copy`). No clip
     * is made: pass the source's `id` to {@link insertClip}.
     *
     * This is the **path route**, an optimization: the engine reads `path` itself, so the bytes
     * never pass through the page. Take the path from `luna.gui.chooseFiles()` or
     * `Luna.onPathDrop()`. It needs no `/gui`, but the engine must see the file: a native
     * engine on the same machine. A path the engine cannot open rejects
     * with LUNA's `device.database_error`. For a browser `File`, use {@link uploadFile}.
     *
     * With `type: 'midi'` or `'video'` the file is copied into the package's `midi` or
     * `video` folder instead, and the call resolves to an {@link ImportedFile} as soon as LUNA
     * answers (fact 163). Nothing plays it yet: LUNA's own import (`importFile`) also makes the
     * track and clip.
     *
     * @example
     * const [path] = await luna.gui.chooseFiles({ filters: ['*.wav'] });
     * if (path) {
     *   const source = await session.importPath(path);
     *   await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT });
     * }
     * const midi = await session.importPath('/Users/me/groove.mid', { type: 'midi' });   // { uid, type: 'midi', name }
     */
    importPath(path: string, options?: ImportPathOptions & {
        type?: 'audio';
    }): Promise<AudioSource>;
    importPath(path: string, options: ImportPathOptions & {
        type: 'midi' | 'video';
    }): Promise<ImportedFile>;
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
    importFile(path: string, trackUid?: string): Promise<unknown>;
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
    bounce(options: BounceOptions): Promise<{
        render: Render;
        fileUids: string[];
    }>;
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
    exportMain(options?: ExportOptions): Promise<{
        render: Render;
        file: string | undefined;
    }>;
    /**
     * Apply `range` as the timeline selection for the duration of a render, and hand back a
     * function that puts the user's selection back. A no-op when no range is given.
     */
    private selectRange;
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
    record(options: RecordOptions): Promise<Clip>;
    /** Close this session. */
    close(): Promise<unknown>;
    protected release(): void;
}

/**
 * The kind of session package `new_session` makes. LUNA's own list; `'default'` is an
 * ordinary session, `'standalone'` one kept in a standalone sessions subfolder named by
 * {@link CreateSessionOptions.standaloneId}.
 */
type NewSessionType = 'default' | 'multi' | 'history' | 'template' | 'track_preset' | 'device_mixer' | 'volt' | 'standalone';
interface CreateSessionOptions {
    name: string;
    /** Folder to create the session package in; the engine default when omitted. */
    directoryPath?: string;
    /**
     * The new package's uid, a UUID (dashes are ignored); LUNA makes one when omitted. Give a
     * fixed one so an Add On can find its own session again in `workspace.query()` (the row whose
     * `uid` it is) and reopen it with `sessions.open()` (fact 237).
     */
    sessionPackageUid?: string;
    /** The kind of package; `'default'` when omitted. An unknown value is treated as `'default'` by LUNA. */
    sessionType?: NewSessionType;
    /**
     * With `sessionType: 'standalone'`: the standalone sessions subfolder to create the package
     * in, in place of `directoryPath`.
     */
    standaloneId?: string;
    /** How long to wait for `loaded`. Default 15 000 ms. */
    timeoutMs?: number;
}
interface CreateFromTemplateOptions {
    /** The template's package uid, from `workspace.templates()`. Dashes are ignored. */
    templatePackageUid: string;
    /** The new session's name. */
    name: string;
    /** Folder to create the session package in; the engine default when omitted. */
    directoryPath?: string;
    /** How long to wait for `loaded`. Default 15 000 ms. */
    timeoutMs?: number;
}
/**
 * A package uid in the form LUNA keeps it: dashes stripped (as `open_session` does), lower case.
 *
 * @example Luna.normalizePackageUid('7D3C0F9E-2B8A-…') // '7d3c0f9e2b8a…'
 */
declare function normalizePackageUid(uid: string | undefined | null): string;
declare class Sessions extends Node {
    /** Open sessions. */
    readonly items: Collection<Session>;
    /** Uid of the focused session, writable. */
    readonly focusedUid: WritableProp<string>;
    /** The focused Session object, when it is among the open ones. */
    readonly focused: Prop<Session | undefined>;
    private readyPromise;
    /**
     * Subscribe to `/sessions` and load the list, with each open session's own properties
     * (name, `sessionPackageUid`, `loaded`) but not its contents. Idempotent. A session opened
     * later has its properties read as it appears (`await luna.settled()` waits for that).
     */
    ready(): Promise<void>;
    private readonly headers;
    /** Read a session's own properties once, so `sessionPackageUid` is known without `ready()`. */
    private readHeader;
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
    byPackageUid(packageUid: string): Session | undefined;
    /**
     * Switch to the session of a package if it is open, else open it: the "open this" of a
     * recent-sessions list.
     *
     * @example
     * row.onclick = () => void luna.sessions.openOrFocus(entry.uid);
     */
    openOrFocus(packageUid: string, timeoutMs?: number): Promise<Session>;
    /** The focused session or, failing that, the first open one. Not yet `ready()`. */
    current(): Session | undefined;
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
    create(options: CreateSessionOptions): Promise<Session>;
    /** Open an existing session package by its uid (see `/workspace/sessions`). */
    open(sessionPackageUid: string, timeoutMs?: number): Promise<Session>;
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
    createFromTemplate(options: CreateFromTemplateOptions): Promise<Session>;
    /** Close a session by uid. */
    close(uid: string): Promise<unknown>;
    /** `load_session` then wait for `/sessions/<uid>/loaded` to become true (fact 15). */
    loadSession(uid: string, timeoutMs?: number): Promise<Session>;
}

/** How long a suppression lasts at most unless {@link SuppressProgressOptions.maxMs} says otherwise. */
declare const PROGRESS_SUPPRESSION_MAX_MS = 120000;
interface SuppressProgressOptions {
    /**
     * Release on its own after this many milliseconds, whatever the page does. Default
     * {@link PROGRESS_SUPPRESSION_MAX_MS}. LUNA keeps an Add On's suppression until it is
     * released (fact 224), so keep this near the longest operation it covers.
     */
    maxMs?: number;
}
/**
 * One held suppression. {@link release} is idempotent and never rejects for a handle LUNA
 * already dropped.
 *
 * @example
 * const hold = await luna.gui.suppressProgress({ maxMs: 30_000 });
 * hold.released;          // false
 * await hold.release();
 */
interface ProgressSuppression {
    /** The handle sent to LUNA (`suppression_uid`). */
    readonly uid: string;
    /** True once released, by {@link release}, the watchdog or the page going away. */
    readonly released: boolean;
    release(): Promise<void>;
}

/**
 * A page a LUNA window shows. `lunaplay` is reported while LUNA Play shows but cannot be set:
 * {@link Gui.setPage} takes a {@link SettablePage} (fact 236).
 */
type GuiPage = 'mixer' | 'timeline' | 'home' | 'addon' | 'dashboard' | 'lunaplay' | (string & {});
/** The pages {@link Gui.setPage} can switch a window to (fact 236). */
type SettablePage = 'mixer' | 'timeline' | 'home' | 'addon' | 'dashboard';
type AddOnTarget = 'window' | 'app' | 'browser' | 'editor';
/** Where an installed Add On lives: see {@link AddOn.installedFrom}. */
type AddOnInstalledFrom = 'folder' | 'link' | 'built_in';
declare class AddOn extends Node {
    /** The manifest's `id`, in lowercase: LUNA compares ids without case. */
    readonly addOnId: Prop<string>;
    /** The manifest's `name`: its menu item and panel header. */
    readonly name: Prop<string>;
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
    readonly targets: Prop<AddOnTarget[]>;
    /** Absolute file path of the icon, or `''`. */
    readonly icon: Prop<string>;
    /** The manifest's `floating`: `true` unless it says `false`. Meaningful for `'window'` only. */
    readonly floating: Prop<boolean>;
    /** The manifest's `show_with_session`: `false` unless it says `true`. Meaningful for `'window'` only. */
    readonly showWithSession: Prop<boolean>;
    /**
     * The manifest's `fixed_size`: `false` unless it says `true`. Meaningful for `'window'` only.
     * `undefined` on a LUNA older than the property.
     */
    readonly fixedSize: Prop<boolean>;
    /**
     * The manifest's `run_hidden`: `false` unless it says `true`. With `true` LUNA keeps the page
     * running at full speed while it is hidden. `undefined` on a LUNA older than the property.
     */
    readonly runHidden: Prop<boolean>;
    /**
     * The manifest's `unload_on_close`: `false` unless it says `true`. With `true` LUNA unloads
     * the page when the Add On is closed and loads it fresh when it is opened again, instead of
     * keeping it running hidden. Meaningful for `'window'`, `'browser'` and `'editor'`.
     * `undefined` on a LUNA older than the property.
     */
    readonly unloadOnClose: Prop<boolean>;
    /** The manifest's `manufacturer`, or `''` when it has none. */
    readonly manufacturer: Prop<string>;
    /** The manifest's `description`, an array of strings already concatenated, or `''` when it has none. */
    readonly description: Prop<string>;
    /**
     * The manifest's `categories`, such as `['MIDI', 'Utility']` (see {@link ADD_ON_CATEGORIES}),
     * or `[]` when it has none. LUNA does not check the names, so one from a newer SDK can appear.
     * `undefined` on a LUNA older than the property.
     *
     * @example
     * const midi = luna.gui.addOns.items.filter((a) => a.categories.value?.includes('MIDI'));
     */
    readonly categories: Prop<string[]>;
    /**
     * Every server the Add On would connect to (fact 147): its manifest's `network` hosts,
     * normalized (`'api.example.com'`, `'*.example.com'`, `'host:8443'`), plus a hosted page's own
     * server. `[]` when none. `undefined` on a LUNA older than the property.
     *
     * @example
     * const servers = addOn.network.value ?? [];
     */
    readonly network: Prop<string[]>;
    /**
     * Those of {@link AddOn.network} the user allowed (fact 147). Only LUNA's own prompts and
     * Settings > Add Ons > SERVERS change it; nothing an Add On sends can. A page loads with the
     * set fixed and is loaded again when it changes.
     *
     * @example
     * const blocked = (addOn.network.value ?? []).filter((h) => !addOn.networkAllowed.value?.includes(h));
     */
    readonly networkAllowed: Prop<string[]>;
    /** The manifest's `version`, or `''` when it has none. Follows a replace (fact 131). */
    readonly version: Prop<string>;
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
    readonly installedFrom: Prop<AddOnInstalledFrom>;
    /**
     * The manifest's `min_width`, `min_height`, `max_width` and `max_height` (fact 143): the
     * window's size limits in pixels, `null` when the manifest declares none. LUNA stops the
     * user's resize at them and clamps {@link AddOnInstance.resize} to them. Meaningful for
     * `'window'` only. `undefined` on a LUNA older than the properties.
     *
     * @example
     * const tooNarrow = addOn.minWidth.value != null && innerWidth < addOn.minWidth.value;
     */
    readonly minWidth: Prop<number | null>;
    readonly minHeight: Prop<number | null>;
    readonly maxWidth: Prop<number | null>;
    readonly maxHeight: Prop<number | null>;
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
    readonly requiresPlugins: Prop<PluginRequirement[]>;
    /**
     * Its pages open in LUNA right now, by `add_on_inst` (fact 143): one per window, browser
     * panel, editor panel or app page showing it. Use {@link Gui.thisInstance} for your own page.
     *
     * @example
     * await addOn.instances.load();
     * addOn.instances.items.map((i) => `${i.target.value} ${i.width.value}x${i.height.value}`);
     */
    readonly instances: Collection<AddOnInstance>;
    /** Show it in LUNA in the host it is in now (one of {@link targets}): navigate to an `'app'`,
     *  open a `'window'` (toggling it like its menu item), show a `'browser'` in the secondary
     *  browser, or an `'editor'` in the Timeline's editor panel (never toggling either closed). */
    show(): Promise<unknown>;
}
/**
 * One page of an installed Add On open in LUNA (fact 143): `/gui/add_ons/<id>/instances/<add_on_inst>`.
 * LUNA gives every Add On page an `add_on_inst` in its URL; {@link Gui.thisInstance} finds the
 * page's own. A window keeps its instance while it exists, and a `show_with_session` window
 * keeps it in the session, so it is the same after the session is closed and opened again: a
 * page can key its own `session.storage` records by it.
 *
 * @example
 * const me = await luna.gui.thisInstance();
 * if (me?.target.value === 'window') await me.resize(640, 480);
 * me?.width.onChange(() => layout(me.width.value ?? 0));
 */
declare class AddOnInstance extends Node {
    /** The host the page is in: one of its Add On's {@link AddOn.targets}. */
    readonly target: Prop<AddOnTarget>;
    /** The page's width in points; follows the user's resize. `undefined` until loaded. */
    readonly width: Prop<number>;
    /** The page's height in points; follows the user's resize. `undefined` until loaded. */
    readonly height: Prop<number>;
    /** The `add_on_inst` LUNA gave the page. */
    get instanceId(): string;
    /** The manifest `id` of the Add On this page belongs to, in lowercase. */
    get addOnId(): string;
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
    resize(width?: number, height?: number): Promise<void>;
}
declare class GuiWindow extends Node {
    /** Current page; writable for `mixer | timeline | home | addon | dashboard`. */
    readonly page: WritableProp<GuiPage>;
}
/** One entry of {@link Gui.listFiles}: a file or folder directly inside the listed folder. */
interface FileEntry {
    /** The entry's name, without its folder. */
    name: string;
    /**
     * Absolute path, for the engine (`session.importPath()`) or {@link Gui.serveMediaFile},
     * which gives the page a URL for any file in a blessed folder.
     */
    path: string;
    /** True for a folder, or a link to one. */
    isDirectory: boolean;
}
/** One entry of {@link Gui.listAllFiles}: a {@link FileEntry} anywhere below the listed folder. */
interface NestedFileEntry extends FileEntry {
    /** Where it is, from the listed folder, `/`-separated: `'Loops/kick.wav'`. */
    relativePath: string;
}
/** One plugin editor window open in LUNA, from {@link Gui.pluginWindows}. */
interface PluginWindow {
    sessionUid: string;
    /** The track or bus uid. */
    channelUid: string;
    /** The insert slot, for example `effect_0`. */
    slot: string;
}
interface ProgressTask {
    progress(percent: number): Promise<void>;
    done(): Promise<void>;
}
declare class Gui extends Node {
    /** Installed Add Ons, by manifest id in lowercase (`byId('com.example.foo')`). */
    readonly addOns: Collection<AddOn>;
    /** Windows by context type; `main` is the arrangement window. */
    readonly windows: Collection<GuiWindow>;
    /** Record-arm mode of LUNA's transport bar. */
    readonly armMode: WritableProp<boolean>;
    readonly priorLaunchCount: Prop<number>;
    /**
     * The folder LUNA creates new sessions in, as set in its Settings (fact 160). Read-only;
     * it follows the setting once `/gui` is watched. `undefined` on an engine without `/gui`.
     *
     * @example
     * await luna.gui.watch().ready;
     * luna.gui.sessionStoragePath.value;   // e.g. "/Users/me/Music/LUNA"
     */
    readonly sessionStoragePath: Prop<string>;
    /**
     * The plugin editor windows open in LUNA, opened from the page or by the user (fact 126).
     * `undefined` until known, and on a LUNA that does not publish them. Follows LUNA once
     * {@link watchPluginWindows} has run, which `session.ready()` does. Read one slot's state
     * from `effect.editorOpen`.
     */
    readonly pluginWindows: Prop<readonly PluginWindow[] | undefined>;
    /**
     * The blessed folders (fact 133): the folders the user lets every Add On read, as absolute
     * paths with links resolved. {@link listFiles} and {@link listAllFiles} list anything in
     * them, and {@link serveMediaFile} gives a URL for any file in them, of any type, but hidden
     * ones. The user manages them in LUNA's Settings > Add Ons > FOLDERS; a page asks for one
     * with {@link addBlessedFolder}. `undefined` until known, and on a LUNA without them.
     * Follows LUNA once {@link watchBlessedFolders} has run.
     */
    readonly blessedFolders: Prop<readonly string[] | undefined>;
    private presence;
    private pluginWindowsWatch;
    private blessedFoldersWatch;
    /**
     * Follow {@link blessedFolders} for the life of the connection. Idempotent; resolves once
     * the first list is in, or at once on an engine without `/gui`.
     *
     * @example
     * await luna.gui.watchBlessedFolders();
     * luna.gui.blessedFolders.onChange(() => render(luna.gui.blessedFolders.value ?? []));
     */
    watchBlessedFolders(): Promise<void>;
    /**
     * Follow {@link pluginWindows} for the life of the connection. Idempotent; resolves once
     * the first list is in, or at once on an engine without `/gui`. `session.ready()` calls it.
     *
     * @example
     * await luna.gui.watchPluginWindows();
     * luna.gui.pluginWindows.value; // [{ sessionUid, channelUid, slot: 'effect_0' }]
     */
    watchPluginWindows(): Promise<void>;
    /** True when LUNA has the editor of `slot` on `channelUid` open; `undefined` until known. */
    isPluginOpen(channelUid: string, slot: string, sessionUid?: string): boolean | undefined;
    /**
     * This page's own instance (fact 143), from the `add_on_inst` LUNA puts in an Add On page's
     * URL, watched so its size follows LUNA. `undefined` outside LUNA, on a LUNA older than
     * instances, or when no live instance has that id. Pass an id to look up another page.
     *
     * @example
     * const me = await luna.gui.thisInstance();
     * if (me) console.log(me.addOnId, me.instanceId, me.width.value, me.height.value);
     */
    thisInstance(instanceId?: string | undefined): Promise<AddOnInstance | undefined>;
    /**
     * True when the engine has LUNA's `/gui` (fact 103). Read once per connection: the
     * root's children are listed, because a `get` of a missing `/gui` answers `{}` (fact 10).
     *
     * @example
     * const paths = (await luna.gui.available()) ? await luna.gui.chooseFiles() : [];
     */
    available(): Promise<boolean>;
    /** Commands go to `/gui`, so refuse at once, not after a timeout, when it is absent. */
    protected post<R = unknown>(command: string, payload?: unknown): Promise<R>;
    /** The main window. */
    get main(): GuiWindow;
    /**
     * Switch the main window (or another context's window) to a page, and resolve once the
     * window's `page` shows it (fact 236). LUNA refuses a page it cannot switch to, `lunaplay`
     * among them, with `uasrv.invalid_value`.
     *
     * @example
     * await luna.gui.setPage('mixer');
     * luna.gui.main.page.value; // 'mixer'
     */
    setPage(page: SettablePage, contextType?: string): Promise<void>;
    openUrl(url: string): Promise<unknown>;
    /** Reveal a file or folder in Finder / Explorer. */
    revealPath(path: string): Promise<unknown>;
    openSettings(): Promise<unknown>;
    openPluginManager(): Promise<unknown>;
    showFeedback(): Promise<unknown>;
    showSessionInFinder(sessionPackageUid?: string): Promise<unknown>;
    showAddOn(id: string): Promise<unknown>;
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
    installAddOn(from: {
        id: string;
    } | {
        url: string;
    }): Promise<void>;
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
    removeAddOn(id: string): Promise<void>;
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
    uninstallAddOn(id: string): Promise<void>;
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
    showPlugin(channelUid: string, slot: string, options?: {
        sessionUid?: string;
        contextType?: string;
    }): Promise<unknown>;
    /**
     * Close the editor window of the plugin in `slot`, if it is open. See {@link showPlugin}.
     *
     * @example
     * await luna.gui.hidePlugin(track.id, 'effect_0');
     * await luna.gui.hidePlugin(track.id, 'effect_0', { contextType: 'alt_1' });
     */
    hidePlugin(channelUid: string, slot: string, options?: {
        sessionUid?: string;
        contextType?: string;
    }): Promise<unknown>;
    /**
     * Post show_plugin / hide_plugin. LUNA answers `uasrv.invalid_object` both when it has no
     * such command and when the named window is not open (fact 178): tell them apart by
     * whether `/gui/windows` lists the window.
     */
    private pluginWindow;
    /** Run a LUNA rack command by id with extra fields as its data. Escape hatch. */
    execute(command: string, data?: Record<string, unknown>): Promise<unknown>;
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
    chooseFiles(options?: {
        title?: string;
        filters?: string[];
        allowMultiple?: boolean;
        defaultPath?: string;
        timeoutMs?: number;
    }): Promise<string[]>;
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
    chooseFolders(options?: {
        title?: string;
        allowMultiple?: boolean;
        defaultPath?: string;
        timeoutMs?: number;
    }): Promise<string[]>;
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
    listFiles(path: string): Promise<FileEntry[]>;
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
    listAllFiles(path: string): Promise<{
        files: NestedFileEntry[];
        truncated: boolean;
    }>;
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
    addBlessedFolder(path: string): Promise<void>;
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
    removeBlessedFolder(path: string): Promise<void>;
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
    serveMediaFile(addOnId: string, path: string): Promise<string>;
    /**
     * LUNA's native save dialog. Resolves to the chosen absolute path, or `undefined` if
     * cancelled. Like {@link chooseFiles} the path is for the engine (for example a render's
     * `outputPaths`); the page cannot write to it.
     *
     * @example
     * const path = await luna.gui.chooseSavePath({ extensions: ['wav'] });
     */
    chooseSavePath(options?: {
        defaultPath?: string;
        extensions?: string[];
        timeoutMs?: number;
    }): Promise<string | undefined>;
    /** Show a progress task in LUNA. Call `progress()` with 0..100, then `done()`. */
    startTask(title: string, options?: {
        nativeProgressBar?: boolean;
    }): Promise<ProgressTask>;
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
    suppressProgress(options?: SuppressProgressOptions): Promise<ProgressSuppression>;
    private dialog;
}

/**
 * `/auto_gain`'s `status` (fact 191). `done_listening`, `overload_error` and `low_signal_error`
 * end a pass; `stopped` is the idle state.
 */
type AutoGainStatus = 'unknown' | 'stopped' | 'waiting_for_signal' | 'listening' | 'overload' | 'adjusting_gain' | 'done_listening' | 'overload_error' | 'low_signal_error';
/** A track (or any channel with an input) Auto Gain can run on: its session and its uid. */
type AutoGainTarget = {
    readonly sessionUid: string;
    readonly id: string;
} | {
    sessionUid: string;
    channelUid: string;
};
/** Options for {@link AutoGain.start}. */
interface AutoGainStartOptions {
    /**
     * Start listening at once (`auto_start`), on every channel added so far. Default `true`, as
     * LUNA's own setup does; with `false` the channel is added and waits.
     */
    autoStart?: boolean;
    /**
     * How long to listen, in whole seconds (`duration`). Omitted or 0 uses LUNA's default. It is
     * a service-wide setting: it applies to the whole pass, not only this channel (fact 192).
     */
    duration?: number;
}
/**
 * `/auto_gain/channels/<name>`: a channel Auto Gain is listening to. The node name is LUNA's
 * own key; identify a channel by `sessionUid` and `channelUid` (fact 191).
 *
 * @example
 * const ch = luna.autoGain.channelFor(track);
 * ch?.signalLevelPeak.onChange(() => draw(ch.signalLevelPeak.value ?? 0));
 */
declare class AutoGainChannel extends Node {
    readonly sessionUid: Prop<string>;
    /** The track (channel) uid. */
    readonly channelUid: Prop<string>;
    /** The input's peak as a linear gain, mirrored from the input's `signal_level_peak` (fact 187). */
    readonly signalLevelPeak: Prop<number>;
    /** Detected instrument, when LUNA's instrument analysis is on for recording; else absent. */
    readonly instrument: Prop<string>;
    /** Detected tempo in BPM, when LUNA's tempo analysis is on for recording; else absent. */
    readonly tempo: Prop<number>;
}
/**
 * `/auto_gain`: the Auto Gain service. All of its properties are read-only. The service only
 * exists when LUNA's Auto Gain feature is on; check {@link available} first (fact 191).
 *
 * @example
 * const w = luna.autoGain.watch();
 * await w.ready;
 * await luna.autoGain.start(track);
 * luna.autoGain.status.onChange(() => {
 *   if (luna.autoGain.status.value === 'done_listening') console.log('gain set');
 * });
 */
declare class AutoGain extends Node {
    /** The service's state. */
    readonly status: Prop<AutoGainStatus>;
    /** A human-readable status line, as LUNA shows it. */
    readonly statusStr: Prop<string>;
    /** Extra information for the current status. */
    readonly info: Prop<string>;
    /** Seconds of listening left in the current pass. */
    readonly countDown: Prop<number>;
    /** The channels Auto Gain is listening to, with their live peaks. */
    readonly channels: Collection<AutoGainChannel>;
    private presence;
    /**
     * Whether this LUNA has the Auto Gain service: true when `/` lists `auto_gain` (fact 191).
     * Cached once answered.
     *
     * @example
     * if (!(await luna.autoGain.available())) button.hidden = true;
     */
    available(): Promise<boolean>;
    /**
     * Subscribe to the service recursively and load it, so the status and the channels with
     * their peaks follow LUNA. Call `release` when done.
     *
     * @example
     * const w = luna.autoGain.watch();
     * await w.ready;
     */
    watch(options?: {
        recursive?: boolean;
    }): {
        ready: Promise<void>;
        release: Unsubscribe;
    };
    /**
     * The channel Auto Gain is listening to for `target`, if any.
     *
     * @example
     * const listening = luna.autoGain.channelFor(track) !== undefined;
     */
    channelFor(target: AutoGainTarget): AutoGainChannel | undefined;
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
    start(target: AutoGainTarget, options?: AutoGainStartOptions): Promise<void>;
    /**
     * Stop Auto Gain on a track: `post /auto_gain/stop_auto_gain {session_uid, channel_uid}`
     * (fact 193). Its channel goes, and the input's signal-level analysis is turned off.
     *
     * @example
     * await luna.autoGain.stop(track);
     */
    stop(target: AutoGainTarget): Promise<void>;
    /**
     * Stop Auto Gain on every channel, whoever started it: `stop_auto_gain {all: true}` (fact 193).
     *
     * @example
     * await luna.autoGain.stopAll();
     */
    stopAll(): Promise<void>;
}

/** How serious a notice is. */
type ErrorNoticeLevel = 'error' | 'warning' | 'info';
declare class ErrorNotice extends Node {
    readonly uid: Prop<string>;
    /** When LUNA raised it, in seconds since the epoch; a repeat of the same notice advances it. */
    readonly timestamp: Prop<number>;
    readonly level: Prop<ErrorNoticeLevel | (string & {})>;
    /** The error code, e.g. `uasrv.launch_failed`. */
    readonly code: Prop<string>;
    /** The title LUNA shows, e.g. "OPEN IN LUNA". */
    readonly title: Prop<string>;
    /** The detail: text, or a JSON object as text (an assert's is `{error, function, file, line}`). */
    readonly payload: Prop<string>;
    /** The label of the notice's button, when it has one. */
    readonly buttonTitle: Prop<string>;
    /** The notice this one belongs to, when it is part of another. */
    readonly parentUid: Prop<string | null>;
    /** The groups it belongs to, parsed from LUNA's JSON text. */
    readonly groups: Prop<string[]>;
}
declare class ErrorNotices extends Collection<ErrorNotice> {
    /**
     * The notices, newest first.
     *
     * @example
     * const latest = luna.errors.sorted[0];
     */
    get sorted(): ErrorNotice[];
}

/** Where {@link Secrets} keeps values: the OS credential store, or page memory. */
type SecretStorage = 'keychain' | 'memory';
/** Longest secret name, in characters. */
declare const MAX_SECRET_NAME_LENGTH = 128;
/** Largest secret value, in UTF-8 bytes (Windows Credential Manager's limit, applied everywhere). */
declare const MAX_SECRET_BYTES = 2560;
/**
 * Per-Add-On secrets, at `luna.secrets`. Values are strings; names are 1 to 128 characters
 * from `A-Z a-z 0-9 . _ -`.
 *
 * Errors are {@link UAError}s with a `code`: `invalid_name`, `too_large`, `store_error` (the
 * OS store refused, for example the user denied keychain access), and `timeout` when LUNA did
 * not answer, which is also what a request from outside the Add On's own page gets.
 *
 * @example
 * let key = await luna.secrets.get('openai.api_key');
 * if (!key) {
 *   key = prompt('OpenAI API key') ?? '';
 *   if (key) await luna.secrets.set('openai.api_key', key);
 * }
 */
declare class Secrets {
    /**
     * `'keychain'` inside a LUNA that stores secrets; `'memory'` elsewhere, where values last
     * only until the page reloads. Tell the user when it is `'memory'`.
     *
     * @example
     * if (luna.secrets.storage === 'memory') banner.textContent = 'Keys are kept until you close this page.';
     */
    get storage(): SecretStorage;
    /**
     * The value stored under `name`, or `null` if there is none.
     *
     * @example
     * const key = await luna.secrets.get('openai.api_key');
     */
    get(name: string): Promise<string | null>;
    /**
     * Store `value` under `name`, replacing any value already there.
     *
     * @example
     * await luna.secrets.set('openai.api_key', input.value);
     */
    set(name: string, value: string): Promise<void>;
    /**
     * Remove `name`. Removing a name that is not stored succeeds.
     *
     * @example
     * await luna.secrets.delete('openai.api_key');
     */
    delete(name: string): Promise<void>;
}

/**
 * What {@link connect} returns: one engine connection with its Store and (from Phase 2) the
 * domain objects. `raw` is the only escape hatch to paths; prefer a typed member when one exists.
 */

/** @hidden */
type Engine = 'luna' | 'wasm' | 'mock';
declare class Client {
    /** The transport. Escape hatch: `luna.raw.get('/sessions')`. */
    readonly raw: Port;
    /** The path-keyed mirror the domain objects read from. */
    readonly store: Store;
    /** Which engine this client is talking to: `'luna'` or `'mock'`. */
    readonly engine: Engine;
    /** Connection status as a {@link Prop}. */
    readonly status: Prop<PortStatus>;
    /** Open sessions and the commands that create or open them. */
    readonly sessions: Sessions;
    /** The plugin catalog (`/plugins`). Call `load()` once before reading. */
    readonly plugins: Plugins;
    /** The preset library (`/presets`): query, tag groups, recommendations, live selection. */
    readonly presets: Presets;
    /** Whether UA Assistant is connected to LUNA (`/assistant`); preset recommendations need it. */
    readonly assistant: Assistant;
    /** Session packages on disk and the workspace query. */
    readonly workspace: Workspace;
    readonly drivers: Drivers;
    readonly devices: Devices;
    /** The MIDI devices LUNA sees (`/devices/<LUNA>/midi`), `All` and `None` included. */
    readonly midiDevices: MidiDevices;
    /** The audio engine LUNA is running: on or off, its kind, the drivers it uses (fact 190). */
    readonly activeAudioEngine: ActiveAudioEngine;
    /** LUNA's Auto Gain service (`/auto_gain`, fact 191). Check `available()` first. */
    readonly autoGain: AutoGain;
    /**
     * LUNA's error notices (fact 235), read-only. Follows LUNA once watched.
     *
     * @example
     * await luna.errors.watch().ready;
     * luna.errors.sorted.map((e) => `${e.level.value}: ${e.title.value}`);
     */
    readonly errors: ErrorNotices;
    readonly preferences: Preferences;
    readonly renders: Renders;
    readonly jobs: Jobs;
    /** LUNA's host surface (dialogs, pages, Add Ons). Only present inside LUNA. */
    readonly gui: Gui;
    /** API keys and tokens in the OS credential store, scoped to this Add On (page memory outside LUNA). */
    readonly secrets: Secrets;
    private readonly statusCell;
    private readonly statusUnsub;
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
    session(options?: {
        wait?: boolean;
        timeoutMs?: number;
    }): Promise<Session>;
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
    audioInputs(): Promise<AudioInput[]>;
    get connected(): boolean;
    /**
     * The in-memory engine when `engine === 'mock'`, for driving the page as a second client
     * would: `luna.mock.setValue(path, 'name', 'Lead')`.
     */
    get mock(): MockEngine | undefined;
    /**
     * The in-page wasm engine (audio, persistence, health) when `engine === 'wasm'`.
     *
     * @hidden
     */
    get wasm(): WasmEngine | undefined;
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
    settled(): Promise<void>;
    /** Disconnect and release everything. */
    close(): Promise<void>;
}
/**
 * Every {@link Client} this page has made and not closed, in creation order. A tooling hook:
 * `ua-builder probe` waits on `Luna.clients().some((c) => c.connected)` to know an Add On's
 * page has finished connecting before it reads the DOM.
 *
 * @example
 * Luna.clients().some((c) => c.connected); // is anything on this page live?
 */
declare function clients(): readonly Client[];

/**
 * Base for every domain object. A Node is a view over one engine path: its properties are
 * {@link Prop}s backed by Store cells, its commands are `post`s on child paths.
 *
 * Nodes hold no state of their own; two Nodes on the same path see the same cells.
 */

declare abstract class Node {
    readonly client: Client;
    /** Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. */
    readonly path: string;
    private loading;
    private isDisposed;
    private disposeListeners;
    /** Last path segment: the uid or name the engine addresses this node by. */
    get id(): string;
    /**
     * Fetch this node's properties (and child names) once. Later calls return the same promise.
     * Pushes keep the cells current afterwards as long as an ancestor is watched.
     */
    load(options?: GetOptions): Promise<void>;
    /** Fetch again, ignoring the once-only cache of {@link load}. */
    reload(options?: GetOptions): Promise<void>;
    /**
     * Subscribe to this node so its props follow engine pushes, and load it. Nodes under a
     * session that called `ready()` are already covered; use this for nodes outside a session
     * (for example `luna.gui.main`, `luna.preferences`). Call `release` when done.
     */
    watch(options?: {
        recursive?: boolean;
    }): {
        ready: Promise<void>;
        release: Unsubscribe;
    };
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
    commandEnabled(command: string): Prop<boolean>;
    private readonly commandWatches;
    /** Where `command`'s node is: under this node. */
    protected commandPath(command: string): string;
    /** Read-only property view. `value` is `undefined` until loaded or pushed. */
    protected prop<T>(name: string): Prop<T>;
    /**
     * Any property of this node by its engine name, for properties the typed surface does not
     * cover yet. Prefer a typed member when one exists.
     *
     * @example
     * track.property<number>('latency_override').value
     * await track.property<string>('comments').set('take 3')
     */
    property<T = unknown>(name: string): WritableProp<T>;
    /** Invoke any command on this node by name. Prefer a typed method when one exists. */
    command<R = unknown>(name: string, payload?: unknown): Promise<R>;
    /**
     * Writable property view; `set` is optimistic with rollback, and refuses once disposed.
     * `toWire` gives the form sent to the engine when it differs from the value the view holds.
     */
    protected writableProp<T>(name: string, toWire?: (value: T) => unknown): WritableProp<T>;
    /** The cell holding this node's child names. */
    protected childNames(): Cell<string[]>;
    /** Invoke a command on this node. Refuses once disposed. */
    protected post<R = unknown>(command: string, payload?: unknown): Promise<R>;
    /**
     * `client.raw` for this object's own commands, refusing with {@link Disposed} once the
     * object is gone. Domain methods post through this rather than `client.raw`.
     */
    protected get wire(): Pick<Port, 'get' | 'set' | 'post'>;
    /** Throw {@link Disposed} if this object is gone. Commands that post elsewhere call it first. */
    protected assertLive(): void;
    /**
     * True once the engine removed this node or its owner was disposed. A disposed object's
     * props stop updating and its commands reject with {@link Disposed}.
     */
    get disposed(): boolean;
    /**
     * Called once when this object is disposed. Returns an unsubscribe.
     *
     * @example
     * track.onDispose(() => row.remove());
     */
    onDispose(listener: () => void): Unsubscribe;
    /** Release what this object owns. Subclasses override this, not {@link dispose}. */
    protected release(): void;
}

/**
 * One group of a page's listeners and gestures, released together, that also knows whether
 * any of its drags is in progress.
 *
 * An Add On that rebuilds part of its DOM (a mixer's strips when tracks come and go) has two
 * chores. It must drop every `onChange` listener and gesture of the old DOM, and it must not
 * rebuild while one of those faders or knobs is being dragged, or the drag's release never
 * arrives (fact 78). `Bindings` does both: {@link Bindings.on} and {@link Bindings.add} collect
 * what to release, {@link bindGesture}, {@link bindRange} and {@link bindDrag} with
 * `{ bindings }` hold the group for the length of each drag, and {@link Bindings.whenIdle}
 * runs a rebuild now, or once when the last drag (and any rebuild still loading) has ended.
 *
 * @example
 * const strips = new Luna.Bindings();
 *
 * function render() {
 *   strips.clear();                                  // old listeners and gestures
 *   host.replaceChildren(...session.tracks.items.map((t) => {
 *     const fader = document.createElement('input');
 *     fader.type = 'range';
 *     Luna.bindRange(fader, t.gain, { bindings: strips });
 *     strips.on(t.name, () => { fader.title = t.name.value ?? ''; });
 *     return fader;
 *   }));
 * }
 * // a rebuild asked for mid-drag waits for the drag to end; several collapse into one
 * session.tracks.onChange(() => void strips.whenIdle(render));
 */

/** Something {@link Bindings} can release: an unsubscribe function or an object with `dispose()`. */
type Releasable = Unsubscribe | {
    dispose(): void;
};
declare class Bindings {
    private releases;
    private holds;
    private pending;
    /** A {@link whenIdle} rebuild that has not settled yet (an async one still loading). */
    private running;
    private disposed;
    /** True while a drag bound with this group, or a {@link hold}, is in progress. */
    get busy(): boolean;
    /**
     * Release `item` with the group. After {@link dispose} it is released at once.
     *
     * @example
     * const g = bindings.add(Luna.bindGesture(canvas, control, { capture: true }));
     * bindings.add(() => clearInterval(timer));
     */
    add<T extends Releasable>(item: T): T;
    /**
     * Subscribe to `prop` for as long as the group lives.
     *
     * @example
     * bindings.on(track.name, () => { label.textContent = track.name.value ?? ''; });
     */
    on(prop: Prop<unknown>, listener: () => void): Unsubscribe;
    /**
     * Keep the group busy until the returned function is called, for an edit that is not a drag
     * (an inline rename). Releasing twice is harmless; {@link clear} drops every hold.
     *
     * @example
     * const done = bindings.hold();
     * input.addEventListener('blur', done, { once: true });
     */
    hold(): () => void;
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
    whenIdle(rebuild: () => void | Promise<void>): Promise<void>;
    /**
     * Release everything added so far, end any drag and drop the holds. The group stays usable:
     * call it in each rebuild, just before replacing the DOM. A rebuild still waiting in
     * {@link whenIdle} is kept, and runs once nothing holds the group.
     *
     * @example
     * function render() { strips.clear(); ... }
     */
    clear(): void;
    /**
     * {@link clear}, drop any waiting {@link whenIdle} rebuild (its promise resolves), and
     * release anything added afterwards at once.
     */
    dispose(): void;
    private start;
    private flush;
}

/**
 * Touch-bracket a DOM control's drag: `begin()` on pointer down, `end()` on pointer up.
 *
 * LUNA turns a `set_touch` on / writes / `set_touch` off sequence into one undo step and one
 * automation pass (fact 26). A fader or knob in an Add On must therefore touch its controls
 * when the pointer goes down, write while it moves, and release when it comes up, and must
 * release exactly once whatever ends the drag: pointer up over another element, a cancelled
 * pointer, lost capture, the window losing focus. {@link bindGesture} owns that part. The Add
 * On keeps writing values from its own `input` or `pointermove` listener; inside the gesture
 * those writes are not bracketed one by one. For a range input or a knob, {@link bindRange}
 * and {@link bindDrag} do the writing and the following too; this is the part they share.
 *
 * Clicks (buttons, toggles, menus) need no gesture: a one-shot `set()` or `toggle()` is
 * bracketed by the control itself.
 *
 * @example
 * // <input type="range">: the browser fires `input` while dragging
 * Luna.bindGesture(fader, track.gain);
 * fader.addEventListener('input', () => track.gain.normalized.set(Number(fader.value)));
 *
 * // a canvas knob: capture the pointer and write from pointermove
 * const g = Luna.bindGesture(canvas, [left.gain, right.gain], { capture: true });
 * canvas.addEventListener('pointermove', (e) => {
 *   if (g.active) for (const c of [left.gain, right.gain]) void c.normalized.set(valueAt(e));
 * });
 */

interface GestureOptions {
    /**
     * Call `setPointerCapture` on pointer down so moves outside the element still reach it.
     * Use it for canvas or div controls that write from `pointermove`; a native range input
     * tracks the pointer by itself. Default false.
     */
    capture?: boolean;
    /** Called after the controls are touched, with the pointer-down event. */
    onBegin?: (event: Event) => void;
    /**
     * Called after the controls are released, with the event that ended the drag (none when
     * {@link Gesture.end} or {@link Gesture.dispose} ended it). A good place to resync the
     * element to the engine's settled value.
     */
    onEnd?: (event?: Event) => void;
    /**
     * Hold this group for the length of each drag, so its {@link Bindings.whenIdle} rebuilds
     * wait for the release, and dispose the gesture with the group. The hold ends after `onEnd`.
     */
    bindings?: Bindings;
}
interface Gesture {
    /** True between pointer down and release. Gate `pointermove` writes on it. */
    readonly active: boolean;
    /** End the current drag now, if any (for example when the element is re-bound). */
    end(): void;
    /** End any drag and remove every listener. */
    dispose(): void;
}
/**
 * Bracket every drag on `target` with `begin()`/`end()` on `controls` (one control, or all
 * the controls one element drives).
 *
 * Only the primary button starts a drag, and a second pointer pressed during a drag is
 * ignored. The drag ends on the first of `pointerup` or `pointercancel` (on the element or
 * anywhere in its window), `lostpointercapture`, or the window's `blur`, and each control is
 * released exactly once.
 *
 * @example
 * const gesture = Luna.bindGesture(slider, control, {
 *   onEnd: () => { slider.value = String(control.normalized.value ?? 0); },
 * });
 * slider.addEventListener('input', () => control.normalized.set(Number(slider.value)));
 * // later
 * gesture.dispose();
 */
declare function bindGesture(target: EventTarget, controls: Control | readonly Control[], options?: GestureOptions): Gesture;

/**
 * Bind a fader or knob element to a control in one call.
 *
 * Every continuous control on a page does the same four things: touch the control on press and
 * release it once however the drag ends (fact 78, {@link bindGesture}), write the new value on
 * every move, follow LUNA's value except mid-drag so a late echo never fights the pointer, and
 * settle on LUNA's value on release. {@link bindRange} does them for a native
 * `<input type="range">`; {@link bindDrag} also turns pointer travel into a value for a div or
 * canvas knob, and adds the keyboard, double-click reset and slider semantics a native input
 * has for free.
 *
 * @example
 * Luna.bindRange(fader, track.gain);                                   // <input type="range">
 * Luna.bindDrag(knob, track.pan, { render: (v) => knob.style.setProperty('--turn', `${(v - 0.5) * 300}deg`) });
 */

/** What {@link bindRange} and {@link bindDrag} return. */
interface ControlBinding extends Gesture {
    /** Repaint the element from the control's current value now, even mid-drag. */
    sync(): void;
}
interface CommonOptions {
    /** Called after the controls are touched, with the pointer-down event. */
    onBegin?: (event: Event) => void;
    /** Called after the release, once the element shows LUNA's settled value. */
    onEnd?: (event?: Event) => void;
    /** A rejected write or reset. Default: `console.error`. */
    onError?: (error: unknown) => void;
    /**
     * Double-click puts the controls back to LUNA's default (`resetToDefault()`, one undo step).
     * Default true.
     */
    reset?: boolean;
    /** Hold this group for each drag and dispose the binding with it. */
    bindings?: Bindings;
}
interface RangeOptions extends CommonOptions {
    /**
     * Which view of the control the input's value is. `'normalized'` (default) maps the input's
     * `min`..`max` onto 0..1, so `min="0" max="1000"` gives a finer fader. `'real'` writes the
     * input's value as units (dB, pan position), for an input whose `min`/`max` are in units.
     */
    view?: 'normalized' | 'real';
}
interface DragOptions extends CommonOptions {
    /** Which pointer travel moves the value: up (`'y'`, default), right (`'x'`), or either (`'both'`). */
    axis?: 'x' | 'y' | 'both';
    /** Pixels of travel for the whole 0..1 range. Default 200. */
    pixelsPerUnit?: number;
    /** Arrow-key step in normalized units; Page Up/Down move ten steps, Home/End go to the ends. Default 0.01. */
    step?: number;
    /**
     * Paint the element for a normalized value. Called on bind, on every write the element
     * makes, and on LUNA's changes outside a drag.
     */
    render?: (normalized: number) => void;
    /** `aria-label`, when the element has none. */
    label?: string;
}
/**
 * Bind a native `<input type="range">` to `control`: touch on press, write on `input`, follow
 * LUNA outside a drag, settle on LUNA's value on release, double-click to reset. Keyboard
 * changes the browser makes are one-shot writes, which the control brackets itself.
 *
 * @example
 * const fader = document.createElement('input');
 * fader.type = 'range';
 * fader.min = '0'; fader.max = '1000';
 * Luna.bindRange(fader, track.gain, {
 *   onBegin: () => strip.classList.add('adjusting'),
 *   onEnd: () => strip.classList.remove('adjusting'),
 * });
 *
 * // units instead: a trim input from -20 to +20 dB
 * Luna.bindRange(trim, track.gainTrim, { view: 'real' });
 */
declare function bindRange(input: HTMLInputElement, control: Control, options?: RangeOptions): ControlBinding;
/**
 * Bind a div or canvas knob (or fader, or one axis of an XY pad) to one control, or to several
 * that move together. Dragging captures the pointer and moves the value by pointer travel;
 * arrow, Page and Home/End keys nudge it; double-click resets it. The element becomes a
 * focusable `role="slider"` whose `aria-valuenow` and `aria-valuetext` follow the control.
 * Writes go to the controls' `normalized` view, and the first control's value is the one shown.
 *
 * @example
 * const knob = document.createElement('div');
 * Luna.bindDrag(knob, track.pan, {
 *   label: 'Pan',
 *   axis: 'both',
 *   pixelsPerUnit: 160,
 *   render: (v) => knob.style.setProperty('--turn', `${(v - 0.5) * 300}deg`),
 * });
 *
 * // a stereo bus's two pans on one knob
 * Luna.bindDrag(knob, bus.main.pans, { render });
 */
declare function bindDrag(el: HTMLElement, controls: Control | readonly Control[], options?: DragOptions): ControlBinding;

/**
 * A smooth playback clock for an element, in the spirit of {@link bindRange}/{@link bindDrag}.
 *
 * The engine pushes `location` only several times a second, so a display with sub-second
 * digits stutters if it repaints only on pushes. {@link bindClock} anchors on each push —
 * the engine stays authoritative — and interpolates between them with requestAnimationFrame
 * while the transport is playing: estimated seconds are the anchored {@link Transport.seconds}
 * plus the wall-clock time since that push. Stopped, it repaints once per change (a seek moves
 * the resting playhead) and runs no frames.
 *
 * @example
 * const release = Luna.bindClock(el, session.transport);   // "01:30.5", tenths
 *
 * // hundredths, custom paint
 * Luna.bindClock(el, session.transport, {
 *   render: (seconds) => { el.textContent = Luna.formatMinSec(seconds, { fraction: 2 }); },
 *   bindings: strips,
 * });
 */

interface ClockOptions {
    /**
     * Paint the element for the estimated playhead seconds. Called on bind, on every engine
     * push, and each animation frame while playing. Default: `el.textContent` set to
     * `Luna.formatMinSec(seconds, { fraction: 1 })`.
     */
    render?: (seconds: number) => void;
    /** Release the clock with this group. */
    bindings?: Bindings;
}
/**
 * Bind `el` to the transport's playhead clock. Reads {@link Transport.seconds}, so the
 * session's tempo map must be loaded (`session.ready()` does that). Returns a release
 * function that cancels the frame loop and the listeners.
 */
declare function bindClock(el: HTMLElement, transport: Transport, options?: ClockOptions): Unsubscribe;

/**
 * LUNA's standard keyboard shortcuts for a page: the fallback for keys its own GUI does not
 * handle.
 *
 * Inside LUNA there is nothing to do: LUNA receives every key an Add On page does not
 * `preventDefault()` and runs it through its own shortcut table, the user's remappings
 * included (fact 81), so {@link bindShortcuts} installs nothing there. Outside LUNA (a browser,
 * the wasm engine) it listens on the window, and a key the page has not already claimed
 * (`event.defaultPrevented`) and that is not typed into a text field runs the matching command
 * on the focused session. Bindings follow LUNA's default map (fact 79) and each command does
 * what LUNA's does (fact 80).
 *
 * To take a key over, handle it in the page and call `preventDefault()`; to drop or change a
 * binding, pass `bindings`.
 *
 * @example
 * const luna = await Luna.connect();
 * Luna.bindShortcuts(luna);
 *
 * // the page's own Space handler wins, because it claims the event
 * canvas.addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); preview(); } });
 *
 * // keep undo and redo, drop the transport keys
 * Luna.bindShortcuts(luna, { bindings: { togglePlayback: [], toggleRecord: [] } });
 */

/** The commands the standard shortcuts cover. */
type ShortcutCommand = 'undo' | 'redo' | 'togglePlayback' | 'toggleRecord' | 'selectAll' | 'cut' | 'copy' | 'paste' | 'clear' | 'duplicate';
type ShortcutPlatform = 'mac' | 'other';
/**
 * A key combination as `Modifier+...+Key`. Modifiers are `Mod` (Cmd on a Mac, Ctrl
 * elsewhere), `Cmd`, `Ctrl`, `Alt` and `Shift`, and the ones named must be exactly the ones
 * held. The key is a `KeyboardEvent.key` (`z`, case-insensitive) or `KeyboardEvent.code`
 * (`Space`, `Numpad0`, `KeyZ`).
 */
type KeyCombo = string;
type ShortcutBindings = Record<ShortcutCommand, readonly KeyCombo[]>;
/**
 * LUNA's default shortcuts for the four commands (fact 79). Windows uses Ctrl where the Mac
 * uses Cmd, which `Mod` covers.
 */
declare const DEFAULT_SHORTCUTS: Readonly<ShortcutBindings>;
/**
 * LUNA's default keys for its edit commands (fact 150): Cmd+A to select all, Cmd+X, Cmd+C,
 * Cmd+V (Ctrl off the Mac), Backspace or Delete to clear, and Cmd+D for Duplicate Selection. Pass them as
 * `bindings` to have {@link Shortcuts} run them; each acts on LUNA's edit selection, which
 * `options.prepare` can point at what the page shows first (`session.selectTimeline`).
 *
 * @example
 * const keys = new Luna.Shortcuts(luna, {
 *   bindings: Luna.EDIT_SHORTCUTS,
 *   prepare: (command, session) => session.selectTimeline({ tracks: [shownTrack] }),
 * });
 * document.addEventListener('keydown', (e) => keys.handle(e));
 */
declare const EDIT_SHORTCUTS: Readonly<Pick<ShortcutBindings, 'selectAll' | 'cut' | 'copy' | 'paste' | 'clear' | 'duplicate'>>;
interface ShortcutsOptions {
    /** Replace the combos of some commands; `[]` disables one. The rest keep their defaults. */
    bindings?: Partial<ShortcutBindings>;
    /** Which platform `Mod` resolves for. Detected from `navigator` when omitted. */
    platform?: ShortcutPlatform;
    /** The session a command acts on. Default: `client.sessions.current()` at the keypress. */
    session?: () => Session | undefined;
    /** Called when a command the shortcuts ran fails. Default: `console.warn`. */
    onError?: (error: unknown, command: ShortcutCommand) => void;
    /** Called after a key was matched and its command started. */
    onCommand?: (command: ShortcutCommand, event: KeyboardEvent) => void;
    /**
     * Called before an edit command (`selectAll`, `cut`, `copy`, `paste`, `clear`, `duplicate`) runs, and
     * awaited: point LUNA's edit selection at what the page shows here, for example with
     * `session.selectTimeline`. A rejection stops the command and goes to `onError`.
     */
    prepare?: (command: ShortcutCommand, session: Session) => void | Promise<void>;
}
/** The parts of a `KeyboardEvent` a binding matches on. */
type ShortcutKeyEvent = Pick<KeyboardEvent, 'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>;
/**
 * The standard shortcuts as an object: which command a key means, and running it. Most Add
 * Ons only need {@link bindShortcuts}; use this directly to route keys from a listener the
 * page already has, or to run a command from a menu.
 *
 * @example
 * const shortcuts = new Luna.Shortcuts(luna);
 * shortcuts.commandFor({ key: 'z', code: 'KeyZ', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false }); // 'undo' on a Mac
 * await shortcuts.run('togglePlayback');
 * document.addEventListener('keydown', (e) => shortcuts.handle(e));
 */
declare class Shortcuts {
    private readonly client;
    private readonly options;
    /** The combos in effect, per command. */
    readonly bindings: Readonly<ShortcutBindings>;
    readonly platform: ShortcutPlatform;
    private readonly parsed;
    /** The key whose keydown was handled, so its keyup cannot also click a focused button. */
    private swallowKeyUp;
    constructor(client: Client, options?: ShortcutsOptions);
    /** The command `event` is bound to, if any. Ignores focus and `defaultPrevented`. */
    commandFor(event: ShortcutKeyEvent): ShortcutCommand | undefined;
    /**
     * Run the command for a keydown the page has not handled. Returns true, having called
     * `preventDefault()`, when it ran one; false for a key that is claimed, typed into a text
     * field, unbound, a held-down transport key, or pressed with no session open.
     */
    handle(event: KeyboardEvent): boolean;
    /**
     * Keyup half of {@link handle}: claims the keyup of a key whose keydown was handled, so
     * Space does not also activate a focused button.
     */
    handleKeyUp(event: KeyboardEvent): void;
    /**
     * Run a command on the focused session (or `options.session`), as LUNA's own shortcut
     * would. Resolves without doing anything when no session is open.
     */
    run(command: ShortcutCommand): Promise<void>;
    private session;
    private runOn;
}
/** The listeners {@link bindShortcuts} installed. */
interface ShortcutsBinding {
    readonly shortcuts: Shortcuts;
    /** False inside LUNA, which handles the page's unclaimed keys itself (fact 81). */
    readonly installed: boolean;
    /** Remove the listeners. */
    dispose(): void;
}
/**
 * Give a page LUNA's standard shortcuts for undo, redo, play and record, as a fallback behind
 * its own key handling, when LUNA is not there to handle them.
 *
 * Inside LUNA (its native bridge is present) this installs nothing: LUNA already runs every
 * key the page does not `preventDefault()` through its own shortcut table (fact 81), which
 * covers every command and follows the user's remapping; claiming four keys here would
 * override that. Elsewhere it
 * listens for `keydown` in the bubble phase on `options.target` (default the window), so
 * handlers on the page's elements and document run first; any of them that calls
 * `preventDefault()` keeps the key. Keys typed into text inputs, textareas, selects and
 * editable elements are left alone. Commands act on the focused session at the keypress,
 * so there is nothing to rebind when the user switches sessions.
 *
 * @example
 * const luna = await Luna.connect();
 * const keys = Luna.bindShortcuts(luna, { onError: (e) => say(e.message, true) });
 * // later
 * keys.dispose();
 */
declare function bindShortcuts(client: Client, options?: ShortcutsOptions & {
    target?: EventTarget;
}): ShortcutsBinding;

/**
 * Clip gain as LUNA evaluates it (fact 228). A clip's gain automation lives on its `gain`
 * control (`<clip>/controls/gain`, {@link Clip.gainControl}); its breakpoints are in dB and
 * their ticks are relative to the clip's start. These helpers are pure: they read breakpoints
 * you pass in and talk to nothing.
 *
 * @example
 * const lane = clip.gainControl.automation;
 * await clip.gainControl.load();
 * await lane.load();
 * const db = Luna.clipGainAt(lane.breakpoints, Luna.QUARTER_NOTE) ?? clip.gain.value ?? 0;
 * const amplitude = Luna.dbToGain(db);
 */

/**
 * The gain in dB at `tick` (clip-relative ticks) from a clip gain lane, the way LUNA's clip
 * compiler evaluates it (fact 228): linear in dB between breakpoints, so 0 dB and -6 dB read
 * -3 dB half way; the first and last values hold outside the end points, with no slope carried
 * past them; two breakpoints at one tick are a step, the later one winning from that tick on.
 * `undefined` for an empty lane: LUNA then plays the clip's static `gain`.
 *
 * Breakpoints are sorted by tick here, so `automation.breakpoints` or any order will do.
 *
 * @example
 * Luna.clipGainAt([{ tick: 0, value: 0 }, { tick: 960, value: -6 }], 480); // -3
 * Luna.clipGainAt([{ tick: 0, value: 0 }, { tick: 960, value: -6 }], 5000); // -6, held
 * Luna.clipGainAt([], 0);                                                    // undefined
 */
declare function clipGainAt(breakpoints: readonly Breakpoint[], tick: number): number | undefined;

/**
 * The categories an Add On's manifest `categories` names (HBH-36068): one or more of these, by
 * `name`. LUNA reports them as {@link AddOn.categories}; `ua-builder` checks each against this
 * list and suggests some with {@link suggestAddOnCategories} when a manifest has none.
 */
/** One Add On category: its `name`, as a manifest writes it, and what belongs in it. */
interface AddOnCategoryInfo {
    readonly name: AddOnCategory;
    readonly description: string;
}
/** A category name a manifest's `categories` can hold. */
type AddOnCategory = 'AI Tools' | 'Control' | 'Create' | 'MIDI' | 'Recording' | 'Editing' | 'Mixing & Mastering' | 'Workflow' | 'Session Management' | 'Import & Export' | 'Education' | 'Utility';
/** Every Add On category, in the order the showcase lists them. */
declare const ADD_ON_CATEGORIES: readonly AddOnCategoryInfo[];
/** True when `name` is one of {@link ADD_ON_CATEGORIES}, written exactly (case included). */
declare function isAddOnCategory(name: unknown): name is AddOnCategory;
/**
 * Categories that suit an Add On, best first, guessed from what it says about itself (its
 * name, description, a prompt that asked for it). At most `max` (default 3); when nothing in
 * the text points anywhere, `['Utility']`. A guess to confirm with the author, never to write
 * into a manifest unasked.
 *
 * @example
 * Luna.suggestAddOnCategories('Quantize and humanize MIDI notes'); // ['MIDI', ...]
 */
declare function suggestAddOnCategories(text: string, max?: number): AddOnCategory[];

/**
 * Live MIDI: play a message on a track now, the way a MIDI keyboard would, through
 * `/sessions/send_midi` and `/sessions/send_midi_all_notes_off` (fact 108). Nothing is written to
 * a clip; to add notes to a clip use {@link Clip.addNotes}. A track that is not record-enabled
 * still plays what it is sent, and `record_enabled` also hands the message to LUNA's record
 * input, so record-enabled tracks hear (and record) it too.
 *
 * The `...ToOutput` methods send to a MIDI device's output port instead, straight out to the
 * hardware (fact 124).
 *
 * Every value is checked first: a byte out of range rejects with `out_of_range` instead of
 * reaching LUNA, which would take it unchecked.
 *
 * @example
 * const midi = new Luna.SendMidi(luna);
 * await midi.sendMidiNote(session.uid, track.id, 60, 100, true);  // note-on, middle C
 * await midi.sendMidiNote(session.uid, track.id, 60, 0, false);   // note-off
 * await midi.sendAllNotesOff();                                   // panic
 */

/** A track entry for {@link SendMidi.sendNoteToTracks}. */
interface SendMidiTrackTarget {
    trackUid: string;
    /** Also hand the event to LUNA's record input. Default `false`. */
    recordEnable?: boolean;
}
/**
 * Where a `...ToOutput` method sends: a MIDI device (its output port), one of its output ports,
 * or an output port's `uid`.
 */
type MidiOutputTarget = MidiDevice | MidiPort | string;
/** The largest SysEx LUNA sends (fact 140): its MIDI output's limit. */
declare const MAX_SYSEX_BYTES = 65536;
declare class SendMidi {
    constructor(
    /** @internal */
    client: Client);
    /**
     * Send a note-on or note-off on channel 1 to one track. It also hands the note to LUNA's
     * record input (`record_enabled`), so record-enabled tracks hear it too.
     *
     * @example
     * await midi.sendMidiNote(session.uid, track.id, 60, 100, true);  // note-on
     * await midi.sendMidiNote(session.uid, track.id, 60, 0, false);   // note-off
     */
    sendMidiNote(sessionUid: string, trackUid: string, note: number, velocity: number, noteOn: boolean): Promise<void>;
    /**
     * Send any 3-byte MIDI message to one track: pitch bend, channel pressure and anything else
     * not wrapped here. The channel is in the status byte's low nibble.
     *
     * @example
     * await midi.sendMidi(session.uid, track.id, 0xe0, 0x00, 0x40);  // pitch bend centre
     */
    sendMidi(sessionUid: string, trackUid: string, byte0: number, byte1: number, byte2: number): Promise<void>;
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
    sendNoteToTracks(sessionUid: string, tracks: ReadonlyArray<SendMidiTrackTarget>, note: number, velocity: number, noteOn: boolean): Promise<void>;
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
    sendController(sessionUid: string, trackUid: string, controller: number, value: number, channel?: number): Promise<void>;
    /**
     * Send a Program Change to a track, after Bank Select MSB and LSB (CC 0 and CC 32) when
     * either bank is given; the one left out is sent as 0. The messages go in order, one at a
     * time, so another sender on the same track could land between them.
     *
     * @example
     * await midi.sendProgramChange(session.uid, track.id, 0);         // program only
     * await midi.sendProgramChange(session.uid, track.id, 5, 0, 12);  // bank 0/12, program 5
     */
    sendProgramChange(sessionUid: string, trackUid: string, program: number, bankMSB?: number, bankLSB?: number): Promise<void>;
    /**
     * Panic: send All Notes Off to every MIDI-capable track and connected MIDI device, in every
     * session.
     *
     * @example
     * await midi.sendAllNotesOff();
     */
    sendAllNotesOff(): Promise<void>;
    /**
     * Send a note-on or note-off on channel 1 to a MIDI input source by name, as though it came
     * from that device, bypassing track routing. It goes into LUNA, not out to the device; to
     * play the hardware use {@link sendNoteToOutput}. LUNA answers success for a name it does not
     * know (fact 108), so a typo fails silently.
     *
     * @example
     * await midi.sendDeviceNote('IAC Driver Bus 1', 60, 100, true);
     */
    sendDeviceNote(midiInputSource: string, note: number, velocity: number, noteOn: boolean): Promise<void>;
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
    sendMidiToOutput(output: MidiOutputTarget, byte0: number, byte1: number, byte2: number): Promise<void>;
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
    sendSysExToOutput(output: MidiOutputTarget, sysex: ReadonlyArray<number> | Uint8Array): Promise<void>;
    /**
     * Send a note-on or note-off out of a MIDI device's output port.
     *
     * @param channel MIDI channel, 0-15. Default 0.
     *
     * @example
     * await midi.sendNoteToOutput(synth, 60, 100, true);  // note-on, middle C
     * await midi.sendNoteToOutput(synth, 60, 0, false);   // note-off
     */
    sendNoteToOutput(output: MidiOutputTarget, note: number, velocity: number, noteOn: boolean, channel?: number): Promise<void>;
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
    sendControllerToOutput(output: MidiOutputTarget, controller: number, value: number, channel?: number): Promise<void>;
    /**
     * Send a Program Change out of a MIDI device's output port, after Bank Select MSB and LSB
     * (CC 0 and CC 32) when either bank is given; the one left out is sent as 0.
     *
     * @param channel MIDI channel, 0-15. Default 0.
     *
     * @example
     * await midi.sendProgramChangeToOutput(synth, 5, 0, 12);  // bank 0/12, program 5
     */
    sendProgramChangeToOutput(output: MidiOutputTarget, program: number, bankMSB?: number, bankLSB?: number, channel?: number): Promise<void>;
    private post;
}

/**
 * Live MIDI input: the messages a MIDI device is sending LUNA, as they arrive (fact 125).
 *
 * Each MIDI device's input port has a `midi_events` property. While a client subscribes to it,
 * LUNA pushes every batch of channel messages it receives from that device as one update; the
 * `All` device's port receives every device's messages. Nothing flows, and LUNA does no extra
 * work, while no one listens. MIDI sent with {@link SendMidi} is not echoed back.
 *
 * Channel messages arrive: notes, poly and channel pressure, controllers, program changes and
 * pitch bend. SysEx arrives too, whole, when asked for ({@link MidiInput.onSysEx}, or `sysex:
 * true` in {@link MidiInputListenOptions}); LUNA builds without it send none (fact 138). Clock
 * and timecode do not arrive.
 *
 * Use this, not Web MIDI (`navigator.requestMIDIAccess()`), for MIDI input in an Add On: LUNA's
 * macOS web view has no Web MIDI, and this hears the devices LUNA's MIDI settings list, the
 * same way inside LUNA and in a browser.
 *
 * @example
 * await luna.midiDevices.load();
 * const input = new Luna.MidiInput(luna);
 * const keys = luna.midiDevices.items.find((d) => d.name.value === 'Volt 876');
 * const stop = input.listen(keys, (m) => {
 *   if (m.type === 'noteOn') console.log('note', m.data1, 'velocity', m.data2);
 * });
 * // later
 * stop();
 */

/**
 * What a message is, from its status byte. A note-on with velocity 0 is a `noteOff`. `sysex` is a
 * whole System Exclusive message, delivered only when asked for.
 */
type MidiInputType = 'noteOff' | 'noteOn' | 'polyPressure' | 'controlChange' | 'programChange' | 'channelPressure' | 'pitchBend' | 'sysex';
/** One message a MIDI device sent LUNA. */
interface MidiInputMessage {
    readonly type: MidiInputType;
    /** Status byte with the channel in it, e.g. `0x90`-`0x9f` note on; `0xf0` for a SysEx. */
    readonly status: number;
    /** 0-based channel, `status & 0x0f`; `-1` for a SysEx, which has none. */
    readonly channel: number;
    /** `0` for a SysEx. */
    readonly data1: number;
    /** `0` for a program change or channel pressure, which have one data byte, and for a SysEx. */
    readonly data2: number;
    /**
     * A SysEx's whole message, `0xf0` through `0xf7`, for `type: 'sysex'`; `undefined` for a
     * channel message.
     */
    readonly sysex?: readonly number[];
    /**
     * When LUNA received it, in milliseconds on LUNA's MIDI input clock. Compare it with other
     * messages' times (two notes 250 ms apart read 250 apart); it is not `performance.now()` or
     * `Date.now()`.
     */
    readonly time: number;
    /** The input port it arrived on: the listened device's, or `All`'s for `'all'`. */
    readonly port: MidiPort;
}
/** Where {@link MidiInput.listen} listens: a device (its input port), an input port, or every device. */
type MidiInputTarget = MidiDevice | MidiPort | 'all';
/** Options for {@link MidiInput.listen}. */
interface MidiInputListenOptions {
    /**
     * Called when batches went missing between two that arrived (`missed` batches), or when
     * LUNA reports messages it could not queue (`dropped`, LUNA's running total). Held notes may
     * be stuck after either; consider releasing them.
     */
    onGap?: (info: {
        missed: number;
        dropped: number;
    }) => void;
    /**
     * Also deliver SysEx messages (`type: 'sysex'`). Default `false`, so a handler written for
     * channel messages never sees one. {@link MidiInput.onSysEx} sets it.
     */
    sysex?: boolean;
}
/**
 * Turn one batch into messages, skipping anything that is not a channel message, or a SysEx
 * when `sysex` is true. A SysEx is `[time_ms, 0xf0, [0xf0, ..., 0xf7]]` (fact 138). Exported for
 * tests.
 */
declare function decodeMidiEvents(events: readonly unknown[], port: MidiPort, sysex?: boolean): MidiInputMessage[];
/**
 * Live MIDI input from the MIDI devices LUNA sees (fact 125). Use this for MIDI input in an Add
 * On, not Web MIDI (`navigator.requestMIDIAccess()`): LUNA's macOS web view has no Web MIDI,
 * and this works the same inside LUNA and in a browser.
 *
 * @example
 * await luna.midiDevices.load();
 * const input = new Luna.MidiInput(luna);
 * const stop = input.onNote('all', (note, velocity, on) => console.log(note, velocity, on));
 */
declare class MidiInput {
    constructor(
    /** @internal */
    client: Client);
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
    listen(target: MidiInputTarget, handler: (message: MidiInputMessage) => void, options?: MidiInputListenOptions): Unsubscribe;
    /**
     * Note-ons and note-offs from `target`, as `(note, velocity, noteOn, message)`. A note-on
     * with velocity 0 arrives as a note-off. Same targets and rules as {@link listen}.
     *
     * @example
     * const stop = input.onNote(keys, (note, velocity, on) => {
     *   if (on) lights.light(note, velocity); else lights.clear(note);
     * });
     */
    onNote(target: MidiInputTarget, handler: (note: number, velocity: number, noteOn: boolean, message: MidiInputMessage) => void, options?: MidiInputListenOptions): Unsubscribe;
    /**
     * Controller changes from `target`, as `(controller, value, message)`. Same targets and
     * rules as {@link listen}.
     *
     * @example
     * const stop = input.onControlChange(keys, (cc, value) => {
     *   if (cc === 1) modWheel.value = String(value);
     * });
     */
    onControlChange(target: MidiInputTarget, handler: (controller: number, value: number, message: MidiInputMessage) => void, options?: MidiInputListenOptions): Unsubscribe;
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
    onSysEx(target: MidiInputTarget, handler: (bytes: readonly number[], message: MidiInputMessage) => void, options?: MidiInputListenOptions): Unsubscribe;
    private inputPort;
}

/**
 * The computer keyboard as a MIDI keyboard: turns key presses into live notes through
 * {@link SendMidi}, with an octave and a velocity the user steps with keys.
 *
 * Key layout (piano-style, two rows):
 *
 *     White keys: A S D F G H J K L ;
 *     Black keys: W E   T Y U   O P
 *
 * Z and X step the octave up and down (0-9, default 4, so A is C4 = 48), C and V the velocity
 * (1-127 in steps of 8, default 100).
 *
 * Octave and velocity are props. A handled key is claimed with `preventDefault()`, because inside LUNA a
 * key the page leaves alone also runs LUNA's own shortcut (fact 81). And a key pressed with
 * Cmd, Ctrl or Alt, or typed into a text field, is left alone, so Cmd+Z stays undo.
 *
 * A note-off is only sent on keyup, and a page that loses focus with a key down never gets
 * one, so release held notes on `blur`.
 *
 * @example
 * const qwerty = new Luna.QwertyMidi(new Luna.SendMidi(luna));
 * document.addEventListener('keydown', (e) => qwerty.handleKeyDown(e, session.uid, track.id));
 * document.addEventListener('keyup', (e) => qwerty.handleKeyUp(e));
 * window.addEventListener('blur', () => qwerty.releaseAll());
 * qwerty.octave.onChange(() => (label.textContent = `Octave ${qwerty.octave.value}`));
 *
 * To play a hardware synth instead of a track, use {@link handleKeyDownToOutput} with one of
 * `luna.midiDevices`; `handleKeyUp` and `releaseAll` are the same for both.
 */

/** The parts of a `KeyboardEvent` the keyboard reads. */
type QwertyKeyEvent = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'preventDefault'> & Partial<Pick<KeyboardEvent, 'target' | 'isComposing'>>;
declare class QwertyMidi {
    private readonly sendMidi;
    /** The octave the note keys play, 0-9. A is C in this octave. `set` clamps. */
    readonly octave: WritableProp<number>;
    /** The note-on velocity, 1-127. `set` clamps. */
    readonly velocity: WritableProp<number>;
    private readonly octaveCell;
    private readonly velocityCell;
    /** Held notes by key: suppresses key repeat and sends the right note-off on keyup. */
    private readonly heldNotes;
    constructor(sendMidi: SendMidi);
    /**
     * Handle a keydown. Returns true, having called `preventDefault()`, when the key was a note
     * or a control key; a repeat of a held note key is claimed but not replayed.
     *
     * @example
     * document.addEventListener('keydown', (e) => qwerty.handleKeyDown(e, session.uid, track.id));
     */
    handleKeyDown(e: QwertyKeyEvent, sessionUid: string, trackUid: string): boolean;
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
    handleKeyDownToOutput(e: QwertyKeyEvent, output: MidiOutputTarget, channel?: number): boolean;
    private keyDown;
    /**
     * Handle a keyup. Returns true, having called `preventDefault()`, when it released a held
     * note. The note-off goes to the track or output and pitch the note-on went to, even if the
     * octave or the target changed while it was held.
     *
     * @example
     * document.addEventListener('keyup', (e) => qwerty.handleKeyUp(e));
     */
    handleKeyUp(e: Pick<KeyboardEvent, 'key' | 'preventDefault'>): boolean;
    /**
     * Send a note-off for every held note. Call it when the page loses focus, which swallows
     * the keyups.
     *
     * @example
     * window.addEventListener('blur', () => qwerty.releaseAll());
     */
    releaseAll(): void;
    /** Forget held notes without sending note-offs, after the connection was replaced. */
    resetConnection(): void;
    /** Release every held note and forget them. */
    destroy(): void;
}

/** How long {@link settle} waits by default for the model to reflect an edit. */
declare const EDIT_TIMEOUT_MS = 4000;
interface SettleOptions {
    /** Path to name in the error. */
    path?: string;
    /** Default {@link EDIT_TIMEOUT_MS}. */
    timeoutMs?: number;
    /** Abort early with `disposed` when the object goes away under us. */
    disposed?: () => boolean;
    /** Re-read the node while waiting. LUNA holds pushes back inside a batch transaction but answers reads at once (fact 60). */
    refresh?: () => Promise<unknown>;
    /** Flush the Store scheduler after a refresh so derived props are current. */
    flush?: () => void;
}
/**
 * One macrotask later, through a `MessageChannel` where there is one. A background browser
 * tab throttles timers to about one tick per second but never throttles messages, so a
 * timer-only loop lands on its own timeout in a hidden page even though LUNA finished in
 * milliseconds.
 */
declare function yieldTask(): Promise<void>;
/**
 * Poll `done` until it holds, or reject with `no_effect`. Socket replies and event frames
 * land between the yields; with `refresh`, the node is re-read after a short grace and then
 * periodically, covering both a batch transaction and an event lost on the wire.
 */
declare function settle(done: () => boolean, what: string, options?: SettleOptions): Promise<void>;
/** Reject a non-integer tick before it reaches the wire: LUNA stores whatever it is given (fact 12). */
declare function requireTick(value: unknown, what: string): number;
/** A 7-bit MIDI value, or `out_of_range`. `min` is 1 for a velocity that must sound. */
declare function midiByte(value: unknown, what: string, min?: number): number;

/**
 * Linear gain and decibels: the amplitude ratio a signal is multiplied by, and the same ratio
 * in dB (`20 * log10(gain)`). Use them for meter levels, a plug-in parameter that takes a
 * linear gain, or arithmetic on dB values (adding two gains, for example).
 *
 * They are **not** fader positions. A fader's 0..1 position maps to dB through LUNA's taper
 * tables, which are not logarithmic; that is {@link Taper} (`taper.toDb(normalized)`,
 * `taper.toNormalized(db)`), or simply a gain control's `real` view.
 */
/**
 * A linear gain as decibels: `20 * log10(gain)`. Silence (0, or anything not above it) is
 * `-Infinity`.
 *
 * @example
 * Luna.gainToDb(1);     // 0
 * Luna.gainToDb(0.5);   // -6.02
 * Luna.gainToDb(0);     // -Infinity
 * // not a fader position: for that use the control's taper
 * track.gain.taper.value?.toDb(track.gain.normalized.value ?? 0);
 */
declare function gainToDb(gain: number): number;
/** LUNA's "-infinity" gain in dB: at or below it, {@link dbToGain} answers exactly 0 (fact 228). */
declare const NEG_INFINITY_DB = -144;
/**
 * Decibels as a linear gain: `10 ** (db / 20)`, with LUNA's hard zero at or below
 * {@link NEG_INFINITY_DB} (fact 228). `-Infinity` is 0.
 *
 * @example
 * Luna.dbToGain(0);           // 1
 * Luna.dbToGain(-6);          // 0.501
 * Luna.dbToGain(-144);        // 0
 */
declare function dbToGain(db: number): number;

/**
 * Runtime value lists and parsers for the string properties LUNA publishes: track, bus,
 * folder-mode, stem-format, session and control types (fact 181). Each list mirrors LUNA's own enum and
 * must track it. A parser returns the value when LUNA would publish it and `undefined` for
 * anything else (an unknown string, `null`, a number), so a page can validate what it reads,
 * fill a menu, or check user input before sending it.
 */

/**
 * Every {@link TrackType} LUNA defines. `click` and `count_in` are LUNA's system tracks, and
 * `bus` a track that stands for a bus; `audio`, `instrument`, `midi_matrix` and `video` are what
 * `session.newTrack()` makes.
 *
 * @example
 * const menu = Luna.TRACK_TYPES.filter((t) => t !== 'click' && t !== 'count_in');
 */
declare const TRACK_TYPES: readonly TrackType[];
/**
 * A `track_type` value as a {@link TrackType}, or `undefined` when LUNA would not publish it.
 *
 * @example
 * Luna.parseTrackType('instrument');   // 'instrument'
 * Luna.parseTrackType('Audio');        // undefined
 */
declare function parseTrackType(value: unknown): TrackType | undefined;
/** LUNA's cue buses: `cue_0` .. `cue_63`. */
declare const MAX_CUE_BUSES = 64;
/**
 * The named {@link BusType}s LUNA defines. Cue buses are not in it: LUNA numbers them
 * `cue_0` .. `cue_63` ({@link MAX_CUE_BUSES}), which {@link parseBusType} accepts. `headphone`
 * is a device bus (Volt), not one a session holds.
 *
 * @example
 * Luna.BUS_TYPES.includes('aux');   // true
 */
declare const BUS_TYPES: readonly BusType[];
/**
 * A `bus_type` value as a {@link BusType}: one of {@link BUS_TYPES}, or a cue bus `cue_N` with
 * N below {@link MAX_CUE_BUSES}. Anything else is `undefined`.
 *
 * @example
 * Luna.parseBusType('cue_2');    // 'cue_2'
 * Luna.parseBusType('cue_64');   // undefined
 */
declare function parseBusType(value: unknown): BusType | undefined;
/**
 * Every {@link FolderMode} (fact 136): `none` is an ordinary bus, `summing` and `container`
 * are folders.
 *
 * @example
 * for (const mode of Luna.FOLDER_MODES) select.add(new Option(mode));
 */
declare const FOLDER_MODES: readonly FolderMode[];
/**
 * A `folder_mode` value as a {@link FolderMode}, or `undefined`. A mode that has not arrived
 * yet is `undefined` too, which is not a folder: test for one with `Bus.isFolder`, not with
 * `mode !== 'none'`.
 *
 * @example
 * Luna.parseFolderMode('summing');   // 'summing'
 * Luna.parseFolderMode(2);           // undefined
 */
declare function parseFolderMode(value: unknown): FolderMode | undefined;
/**
 * The stem formats LUNA's enum publishes, in its spelling. A channel in a LUNA session is
 * `mono` or `stereo`; the rest are its multichannel formats (`2_1`, `lcr`, ..., `9_1_6`).
 *
 * @example
 * Luna.STEM_FORMATS.slice(0, 2);   // ['mono', 'stereo']
 */
declare const STEM_FORMATS: readonly ["mono", "stereo", "2_1", "lcr", "lcrs", "quad", "5_1", "6_1", "7_1", "5_1_4", "7_1_4", "9_1_6"];
/** One of {@link STEM_FORMATS}. */
type KnownStemFormat = (typeof STEM_FORMATS)[number];
/**
 * A `stem_format` value as one of {@link STEM_FORMATS}, or `undefined`.
 *
 * @example
 * Luna.parseStemFormat('stereo');      // 'stereo'
 * Luna.parseStemFormat('mid-side');    // undefined
 */
declare function parseStemFormat(value: unknown): KnownStemFormat | undefined;
/**
 * Session package types, in LUNA's order: a package's `session_type` is this index in a
 * `/workspace/query` row (a template is 3, fact 151) and this string on a session or package
 * node. `multi` is no longer made, `history` and `track_preset` are LUNA's own packages (see
 * {@link HIDDEN_SESSION_TYPES}).
 *
 * @example
 * Luna.SESSION_TYPES[3];   // 'template'
 */
declare const SESSION_TYPES: readonly ["default", "multi", "history", "template", "track_preset", "device_mixer", "volt", "standalone"];
/** One of {@link SESSION_TYPES}. */
type SessionType = (typeof SESSION_TYPES)[number];
/**
 * A `session_type` value as a {@link SessionType}: the string, or its index in
 * {@link SESSION_TYPES} as a workspace query row carries it. Anything else is `undefined`.
 *
 * @example
 * Luna.parseSessionType(3);              // 'template'
 * Luna.parseSessionType('track_preset'); // 'track_preset'
 * Luna.parseSessionType(8);              // undefined
 */
declare function parseSessionType(value: unknown): SessionType | undefined;
/**
 * The session types an Add On listing the user's sessions should leave out: LUNA's undo
 * history packages and the packages that hold track presets, which the user never opens as
 * sessions.
 *
 * @example
 * const shown = rows.filter((row) => !Luna.isHiddenSessionType(row.sessionType));
 */
declare const HIDDEN_SESSION_TYPES: readonly SessionType[];
/**
 * Whether a `session_type` (string or index) is one of {@link HIDDEN_SESSION_TYPES}.
 *
 * @example
 * Luna.isHiddenSessionType(2);           // true, 'history'
 * Luna.isHiddenSessionType('default');   // false
 */
declare function isHiddenSessionType(value: unknown): boolean;
/**
 * A `control_type` value as one of {@link CONTROL_TYPES}, or `undefined`.
 *
 * @example
 * Luna.parseControlType('preamp_gain');   // 'preamp_gain'
 * Luna.parseControlType('volume');        // undefined
 */
declare function parseControlType(value: unknown): KnownControlType | undefined;

/**
 * Codes a `Luna.Error` can carry, to compare `error.code` against instead of
 * a string literal. The `uasrv.*`, `device.*` and `mixer.*` ones are LUNA's own error strings,
 * passed through unchanged; the rest are the SDK's fixed codes. The engine list is the subset
 * the SDK documents (docs/EVIDENCE.md); LUNA defines more, and an unlisted code still arrives
 * unchanged in `error.code`.
 *
 * @example
 * try {
 *   await session.moveToFolder([track], someBus);
 * } catch (e) {
 *   if (e instanceof Luna.Error && e.code === Luna.ErrorCodes.INVALID_VALUE) showHint('Not a folder');
 *   else throw e;
 * }
 */
declare const ErrorCodes: {
    /** A property name the node does not have. */
    readonly INVALID_PROPERTY: "uasrv.invalid_property";
    /** A value the command or property refuses (an unknown uid, a range, a bad mode). */
    readonly INVALID_VALUE: "uasrv.invalid_value";
    /** No node or command at the path: often an older LUNA without the feature. */
    readonly INVALID_OBJECT: "uasrv.invalid_object";
    /** A value of the wrong type. */
    readonly INVALID_TYPE: "uasrv.invalid_type";
    /** A write to a read-only property. */
    readonly READ_ONLY: "uasrv.read_only";
    /** A command missing a required field. */
    readonly MISSING_FIELD: "uasrv.missing_field";
    /** A file or folder could not be read or written. */
    readonly FILESYSTEM_ERROR: "uasrv.filesystem_error";
    /** LUNA is busy with the same kind of request; try again later. */
    readonly TOO_MANY_REQUESTS: "uasrv.too_many_requests";
    /** LUNA is busy with another step; try again. */
    readonly SOFTWARE_BUSY: "uasrv.software_busy";
    /** What the request names is not installed (an Add On, an app, LUNA itself for an "open in LUNA"). */
    readonly NOT_INSTALLED: "uasrv.not_installed";
    /** The user has not allowed it (for example a folder `list_files` was not granted). */
    readonly NOT_PERMITTED: "uasrv.not_permitted";
    /** The command exists but is not implemented on this engine. */
    readonly NOT_IMPLEMENTED: "uasrv.not_implemented";
    /** LUNA's catch-all. */
    readonly DEFAULT_ERROR: "uasrv.default_error";
    /** The session database refused the change (for example a `folder_uid` that is not a folder). */
    readonly DATABASE_ERROR: "device.database_error";
    /** A file the session needs could not be found or read. */
    readonly DEVICE_FILESYSTEM_ERROR: "device.filesystem_error";
    /** An output assignment names a bus that no longer exists. */
    readonly MISSING_BUS: "device.missing_bus";
    /** An assignment names an input that does not exist. */
    readonly MISSING_INPUT: "device.missing_input";
    /** An assignment names an output that does not exist. */
    readonly MISSING_OUTPUT: "device.missing_output";
    /** The session cannot be written (read-only). */
    readonly SESSION_NOT_WRITABLE: "device.session_not_writable";
    /** An edit that needs a selection was given none. */
    readonly NO_SELECTION: "device.no_selection";
    /** An edit range that is empty or reversed. */
    readonly INVALID_RANGE: "device.invalid_range";
    /** A slot's `plugin_error` when its plug-in is not installed (`Luna.PLUGIN_ERROR_MISSING`). */
    readonly MISSING_PLUGIN: "mixer.missing_plug-in";
    /** No LUNA answered: `Luna.NotRunning`. */
    readonly NOT_RUNNING: "not_running";
    /** A request was not answered in time: `Luna.RequestTimeout`. */
    readonly TIMEOUT: "timeout";
    /** The connection dropped: `Luna.ConnectionLost`. */
    readonly DISCONNECTED: "disconnected";
    /** The engine lacks the feature: `Luna.Unsupported`. */
    readonly UNSUPPORTED: "unsupported";
    /** No session is open: `Luna.NoSessionOpen`. */
    readonly NO_SESSION: "no_session";
    /** The object's node was removed: `Luna.Disposed`. */
    readonly DISPOSED: "disposed";
    /** An argument the SDK refuses before sending anything. */
    readonly OUT_OF_RANGE: "out_of_range";
};
/** One of the {@link ErrorCodes} values. `UAError.code` stays a `string`, since LUNA defines more. */
type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Folder tracks as a tree (fact 136): the flat `folderUid` links and `order` keys of a
 * session's tracks and buses turned into rows to draw, with the rules LUNA applies to them.
 *
 * Built from a snapshot: call {@link folderTree} again when `folderUid`, `order`,
 * `folderMode` or the track and bus lists change.
 *
 * Malformed links never cost a row. A session can hold them for a moment (a folder demoted
 * before its children move, an undo landing out of order), so instead of hiding or moving
 * anything silently the tree reports each in {@link FolderTree.anomalies}: a channel whose
 * folder is itself, is missing, or is caught in a loop is drawn at the root; a channel whose
 * folder is a bus that is not (or no longer) a folder stays inside it.
 */

/**
 * What a tree is built from: a {@link Track} or {@link Bus}, or anything shaped like one.
 * Only a channel with a `folderMode` that is `summing` or `container` is a folder.
 */
interface FolderChannel {
    readonly id: string;
    readonly folderUid: {
        readonly value: string | null | undefined;
    };
    readonly order: {
        readonly value: number | undefined;
    };
    readonly folderMode?: {
        readonly value: FolderMode | undefined;
    };
}
/** One row of a {@link FolderTree}. */
interface FolderRow<T extends FolderChannel = Track | Bus> {
    /** The track or bus. */
    readonly channel: T;
    /** `channel.id`. */
    readonly id: string;
    /** 0 at the session root, one more per folder level. */
    readonly depth: number;
    /** Whether the channel is a folder (`summing` or `container`). */
    readonly isFolder: boolean;
    /**
     * The folder it is drawn in, `null` at the root. For a channel re-rooted as an anomaly this
     * differs from its `folderUid`, which the anomaly keeps.
     */
    readonly parentId: string | null;
    /** The rows directly inside it, in order; empty for a track or an empty folder. */
    readonly childIds: readonly string[];
}
/** What was wrong with a channel's `folderUid`. */
type FolderAnomalyKind = 
/** Its `folderUid` is its own id. Drawn at the root. */
'self-parent'
/** Its `folderUid` names no track or bus in the tree. Drawn at the root. */
 | 'dangling-parent'
/** Its `folderUid` names a bus that is not a folder, or a track. Kept inside it. */
 | 'non-folder-parent'
/** Its folder chain loops back on itself. This one, the loop's first by order, is drawn at the root. */
 | 'cycle'
/** A second channel with an id already in the tree. Left out. */
 | 'duplicate-id';
/** One anomaly in a {@link FolderTree}. */
interface FolderAnomaly {
    readonly kind: FolderAnomalyKind;
    /** The channel it is about. */
    readonly id: string;
    /** The `folderUid` it claimed, for the parent anomalies. */
    readonly folderUid?: string;
}
/** Options for {@link FolderTree.visibleRows}. */
interface VisibleRowsOptions<T extends FolderChannel = Track | Bus> {
    /**
     * Ids of collapsed folders: pass the edit context's `collapsedFolders.value` as it is.
     * Everything inside a collapsed folder is hidden; ids of anything else are ignored, since
     * LUNA does not prune that list when a folder is deleted.
     */
    collapsed?: Iterable<string> | null;
    /**
     * Which rows to draw. It hides only the rows it rejects: a folder left out by it still hides
     * its contents when collapsed, and its contents are judged on their own.
     */
    filter?: (row: FolderRow<T>) => boolean;
}
/**
 * Build the folder tree of a session's tracks and buses, or of a list of channels.
 *
 * @example
 * const tree = Luna.folderTree(session);
 * const collapsed = session.context.collapsedFolders.value;
 * for (const row of tree.visibleRows({ collapsed })) {
 *   draw(row.channel.name.value, { indent: row.depth, folder: row.isFolder });
 * }
 */
declare function folderTree(source: Session): FolderTree<Track | Bus>;
declare function folderTree<T extends FolderChannel>(source: ReadonlyArray<T>): FolderTree<T>;
/**
 * A snapshot of the folder hierarchy: rows in LUNA's order (each folder followed by
 * everything inside it), the rows to draw under collapsed folders, selection expansion, and
 * the folder a channel's main output sums into. Make one with {@link folderTree}.
 *
 * @example
 * const tree = Luna.folderTree(session);
 * tree.rows.map((r) => '  '.repeat(r.depth) + r.channel.name.value).join('\n');
 */
declare class FolderTree<T extends FolderChannel = Track | Bus> {
    /** Every row, depth first: a folder comes right before its contents, siblings by `order`. */
    readonly rows: readonly FolderRow<T>[];
    /** The rows at the session root, in order, anomalies drawn there included. */
    readonly roots: readonly FolderRow<T>[];
    /** Everything malformed about the links; empty for a well-formed session. */
    readonly anomalies: readonly FolderAnomaly[];
    private readonly byId;
    private readonly channels;
    /**
     * The row of a track or bus, by id or object; `undefined` when it is not in the tree.
     *
     * @example
     * tree.row(track)?.depth;   // 1 inside a top-level folder
     */
    row(channel: ChannelRef): FolderRow<T> | undefined;
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
    visibleRows(options?: VisibleRowsOptions<T>): FolderRow<T>[];
    /**
     * Everything inside a folder, nested folders' contents included, in order; the folder
     * itself is left out. Empty for a track, an empty folder or an unknown id.
     *
     * @example
     * const inside = tree.descendants(drums).map((r) => r.channel);
     */
    descendants(folder: ChannelRef): FolderRow<T>[];
    /**
     * A track selection as LUNA widens it (fact 182): a selected folder brings everything inside it, right
     * after it. Order is kept, duplicates are dropped (first place wins), and ids not in the
     * tree are dropped.
     *
     * @example
     * const ctx = session.context;
     * const ids = tree.expandSelection(ctx.selectionTracks.value ?? []);
     */
    expandSelection(ids: ReadonlyArray<ChannelRef>): string[];
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
    summingFolder(channel: ChannelRef): T | null;
}

/**
 * A pre- or post-roll length: whole bars, then beats, then engine ticks, counted in the
 * session's time signatures where the roll falls.
 */
interface RollDuration {
    bars: number;
    beats: number;
    /** Engine ticks (`Luna.TICKS_PER_BEAT` to a beat), as LUNA stores them. */
    ticks: number;
}
/**
 * Read a roll string, `"bars,beats,ticks"`, as LUNA stores `pre_roll` and `post_roll`
 * (fact 156). `undefined` for anything else, which is what a session that never set its
 * roll holds; LUNA then uses no roll.
 *
 * @example Luna.parseRollDuration('1,2,0');   // { bars: 1, beats: 2, ticks: 0 }
 */
declare function parseRollDuration(value: string | null | undefined): RollDuration | undefined;
/**
 * Write a roll length in LUNA's form for `transport.preRoll.set()` or `postRoll.set()`.
 * Omitted parts are 0. Rejects with `out_of_range` for a negative or non-integer part.
 *
 * @example await session.transport.postRoll.set(Luna.formatRollDuration({ bars: 1 }));   // "1,0,0"
 */
declare function formatRollDuration(duration: Partial<RollDuration>): string;

/**
 * One call to a connected client.
 *
 * Resolution order:
 * 1. `port_` — use this transport as-is (tests, custom transports).
 * 2. `engine: 'mock'` (or `?engine=mock`) — an in-memory {@link MockEngine}, filled by `setup`,
 *    else by a page-defined `globalThis.LunaMockSetup`, else with {@link MockEngine.demo}.
 * 3. `url` / `host` / `port` — explicit WebSocket target.
 * 4. `?host=` / `?port=` on the page URL — set by LUNA when it opens an Add On.
 * 5. `ws://localhost:4718` — LUNA's engine on this machine.
 *
 * @example
 * const luna = await Luna.connect();                    // inside LUNA, or LUNA on localhost
 * const luna = await Luna.connect({ port_: engine.port() }); // tests
 * const luna = await Luna.connect({ engine: 'mock', setup: (e) => e.addSession('s', { tracks: ['Vox'] }) });
 */

interface ConnectOptions {
    /** Which engine to reach: `'luna'` or `'mock'`. Default: infer from the other options and the page URL. */
    engine?: Engine;
    url?: string;
    host?: string;
    port?: number;
    /** Per-request timeout. Default 10 000 ms. */
    requestTimeoutMs?: number;
    /** Injected WebSocket implementation (tests, Node). */
    WebSocket?: SocketConstructor;
    /** Use this transport instead of opening one. Its status is taken as-is. */
    port_?: Port;
    /** @hidden */
    engineUrl?: string;
    /**
     * For `engine: 'mock'`: fill the engine before the client connects. Without it the page's
     * `globalThis.LunaMockSetup` is used, and without that {@link MockEngine.demo}'s session.
     * The client reaches the engine afterwards as `luna.mock`.
     *
     * @example
     * await Luna.connect({ engine: 'mock', setup: (engine) => engine.addSession('s', { tracks: ['Vox', 'Bass'] }) });
     */
    setup?: (engine: MockEngine) => void | Promise<void>;
    /** @hidden */
    wasm?: Omit<BootOptions, 'engineUrl'>;
    /**
     * Where the connection reports status changes, reconnects, timeouts and listener errors.
     * Default: warnings and errors to the console.
     *
     * @example
     * await Luna.connect({ log: (level, message) => level !== 'debug' && console.log(level, message) });
     */
    log?: LogFn;
}
declare function connect(options?: ConnectOptions): Promise<Client>;

interface LocationOptions {
    host?: string;
    port?: number;
    /** `?engine=mock` asks for an in-memory {@link MockEngine}; `?engine=luna` for LUNA. */
    engine?: Engine;
    /** @hidden */
    engineUrl?: string;
}
/** `host` and `port` from the page URL, if present. */
declare function locationOptions(): LocationOptions;
/**
 * The host LUNA loaded this Add On page in, from the `?target=` it puts on the page URL (fact 144):
 * `'window'`, `'browser'`, `'editor'` or `'app'`. `undefined` outside LUNA and on a LUNA older
 * than the parameter. Synchronous, so a page that lists several manifest `targets` can lay
 * itself out for its host before it connects. LUNA reloads the page when the user moves it to
 * another host, so it never changes while the page runs.
 *
 * @example
 * document.body.classList.add(`host-${Luna.addOnTarget() ?? 'window'}`);
 */
declare function addOnTarget(): AddOnTarget | undefined;
/** True when the page was opened by LUNA (a `?port=` is on the URL). */
declare function isEmbeddedInLuna(): boolean;
/** True when the page is talking to LUNA's own engine on its default port. */
declare function isLunaEnginePort(port: number | undefined): boolean;
/** True when LUNA's native webview bridge is present. */
declare function hasNativeBridge(): boolean;

/** Where a native drag is, in page pixels, and the absolute paths it carries. */
interface PathDrop {
    paths: string[];
    x: number;
    y: number;
}
interface PathDropHandlers {
    /** The user dropped files on the page. */
    drop(drop: PathDrop): void;
    /** A file drag entered or moved over the page; highlight a drop zone. */
    dragOver?(drag: PathDrop): void;
    /** The drag left the page or was cancelled. */
    dragLeave?(): void;
}
/**
 * True when native path drops can be used: the page is in LUNA's webview, which publishes
 * `window.lunaAPI.setAcceptsFileDrops`. False in a browser and in tests.
 */
declare function canDropPaths(): boolean;
/**
 * Receive files dropped on the page as **absolute paths** (LUNA only). Resolves nothing and
 * reads nothing: pass the paths to `session.importPath()`, which has the engine read them
 * from disk. Returns an unsubscribe; once the last handler is gone, LUNA hands file drags
 * back to the page's HTML `drop` events.
 *
 * Drops are page-wide: route one to a zone by hit-testing its `x`, `y` (page pixels), for
 * example `document.elementFromPoint(x, y)?.closest('.zone')`.
 *
 * Throws {@link Unsupported} outside LUNA. Check {@link canDropPaths} first and fall back
 * to an HTML `drop` listener there. In LUNA 3.1.0.4589 and earlier, after the Add On's
 * window is closed and reopened, drops arrive as HTML drops instead (fact 105): keep an HTML
 * `drop` listener as well.
 *
 * Want the file's bytes in the page (decode, play, slice)? Do not use this: listen for HTML
 * `drop` and read `event.dataTransfer.files`, then `session.uploadFile({ bytes: file })`.
 *
 * @example
 * if (Luna.canDropPaths()) {
 *   const stop = Luna.onPathDrop({
 *     dragOver: () => zone.classList.add('hot'),
 *     dragLeave: () => zone.classList.remove('hot'),
 *     drop: async ({ paths }) => {
 *       zone.classList.remove('hot');
 *       for (const path of paths) await session.importPath(path);
 *     },
 *   });
 * }
 */
declare function onPathDrop(handlers: PathDropHandlers | ((drop: PathDrop) => void)): Unsubscribe;

/** What {@link startSourceDrag} drags: absolute paths, or a session's sources. */
type SourceDragItems = {
    path: string | readonly string[];
} | {
    session: Session;
    source: AudioSource | string | ReadonlyArray<AudioSource | string>;
};
/** The minimal drag event this needs; a DOM `DragEvent` is one. */
interface DragStartLike {
    readonly dataTransfer: {
        setData(format: string, data: string): void;
        effectAllowed: string;
    } | null;
}
/**
 * Fill a `dragstart` event with session files so LUNA's timeline can take the drop (fact 241).
 * Synchronous, as `dragstart` must be: a source's path comes from the session's package path,
 * so call `session.ready()` first. Answers the paths dragged.
 *
 * A rendering (`source.isRender`) is not one of the session's sources: LUNA would import a
 * copy. Drag the clip's `sourceUid` instead.
 *
 * @example
 * el.addEventListener('dragstart', (e) => Luna.startSourceDrag(e, { session, source: src }));
 * el.addEventListener('dragstart', (e) => Luna.startSourceDrag(e, { path: '/Users/me/Loops/beat.wav' }));
 */
declare function startSourceDrag(event: DragStartLike, items: SourceDragItems): string[];
/** `file://` URL of an absolute POSIX or Windows path, percent-encoded per segment. */
declare function fileUrl(path: string): string;

/**
 * The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/luna-builder-sdk'`
 * or, from a script tag, `globalThis.Luna`.
 */

/**
 * SDK version, compiled in from package.json: major.minor.patch in source, and with the
 * Bamboo build number as a fourth part in a shipped SDK, e.g. 0.1.0.1234 (0 for a local build).
 */
declare const VERSION: string;

declare const luna_ADD_ON_CATEGORIES: typeof ADD_ON_CATEGORIES;
declare const luna_AUTOMATION_MODES: typeof AUTOMATION_MODES;
type luna_ActiveAudioEngine = ActiveAudioEngine;
declare const luna_ActiveAudioEngine: typeof ActiveAudioEngine;
type luna_ActiveAudioEngineInfo = ActiveAudioEngineInfo;
type luna_AddLyricOptions = AddLyricOptions;
type luna_AddOn = AddOn;
declare const luna_AddOn: typeof AddOn;
type luna_AddOnCategory = AddOnCategory;
type luna_AddOnCategoryInfo = AddOnCategoryInfo;
type luna_AddOnInstalledFrom = AddOnInstalledFrom;
type luna_AddOnInstance = AddOnInstance;
declare const luna_AddOnInstance: typeof AddOnInstance;
type luna_AddOnTarget = AddOnTarget;
type luna_AffectedTracksOptions = AffectedTracksOptions;
type luna_AlgType = AlgType;
type luna_AnalysisKind = AnalysisKind;
type luna_AnalysisNode = AnalysisNode;
declare const luna_AnalysisNode: typeof AnalysisNode;
type luna_Assistant = Assistant;
declare const luna_Assistant: typeof Assistant;
type luna_AudioDeviceInfo = AudioDeviceInfo;
type luna_AudioHealth = AudioHealth;
type luna_AudioInput = AudioInput;
type luna_AudioSource = AudioSource;
declare const luna_AudioSource: typeof AudioSource;
type luna_AutoGain = AutoGain;
declare const luna_AutoGain: typeof AutoGain;
type luna_AutoGainChannel = AutoGainChannel;
declare const luna_AutoGainChannel: typeof AutoGainChannel;
type luna_AutoGainStartOptions = AutoGainStartOptions;
type luna_AutoGainStatus = AutoGainStatus;
type luna_AutoGainTarget = AutoGainTarget;
type luna_Automation = Automation;
declare const luna_Automation: typeof Automation;
type luna_AutomationMode = AutomationMode;
type luna_AutomationModeName = AutomationModeName;
declare const luna_BUS_TYPES: typeof BUS_TYPES;
type luna_BarBeat = BarBeat;
type luna_Bindings = Bindings;
declare const luna_Bindings: typeof Bindings;
type luna_BootOptions = BootOptions;
type luna_BounceOptions = BounceOptions;
type luna_Breakpoint = Breakpoint;
type luna_BreakpointNode = BreakpointNode;
declare const luna_BreakpointNode: typeof BreakpointNode;
type luna_Bus = Bus;
declare const luna_Bus: typeof Bus;
type luna_BusType = BusType;
declare const luna_COARSE_PAIRS_PER_FINE: typeof COARSE_PAIRS_PER_FINE;
declare const luna_COARSE_PAIR_NS: typeof COARSE_PAIR_NS;
declare const luna_CONTROL_TYPES: typeof CONTROL_TYPES;
declare const luna_CUE_COUNT: typeof CUE_COUNT;
type luna_Cell<T> = Cell<T>;
declare const luna_Cell: typeof Cell;
type luna_Channel = Channel;
declare const luna_Channel: typeof Channel;
type luna_ChannelRef = ChannelRef;
type luna_Chord = Chord;
declare const luna_Chord: typeof Chord;
type luna_ChordAnalysis = ChordAnalysis;
declare const luna_ChordAnalysis: typeof ChordAnalysis;
type luna_ChordAnalysisResult = ChordAnalysisResult;
type luna_ChordSegment = ChordSegment;
type luna_ChordSpec = ChordSpec;
type luna_Chords = Chords;
declare const luna_Chords: typeof Chords;
type luna_Client = Client;
declare const luna_Client: typeof Client;
type luna_Clip = Clip;
declare const luna_Clip: typeof Clip;
type luna_ClipAudio = ClipAudio;
type luna_ClipLike = ClipLike;
type luna_ClipNote = ClipNote;
type luna_ClipSnapshot = ClipSnapshot;
type luna_ClipType = ClipType;
type luna_ClockOptions = ClockOptions;
type luna_Collection<T extends Node> = Collection<T>;
declare const luna_Collection: typeof Collection;
type luna_CommandHandler = CommandHandler;
type luna_CompiledClip = CompiledClip;
declare const luna_CompiledClip: typeof CompiledClip;
type luna_CompiledClipLike = CompiledClipLike;
type luna_CompiledClipSnapshot = CompiledClipSnapshot;
type luna_CompiledClips = CompiledClips;
declare const luna_CompiledClips: typeof CompiledClips;
type luna_CompiledFade = CompiledFade;
type luna_ConnectOptions = ConnectOptions;
type luna_ConnectionLost = ConnectionLost;
declare const luna_ConnectionLost: typeof ConnectionLost;
type luna_Context = Context;
declare const luna_Context: typeof Context;
type luna_ContextType = ContextType;
type luna_Control = Control;
declare const luna_Control: typeof Control;
type luna_ControlBinding = ControlBinding;
type luna_ControlType = ControlType;
type luna_ControlValue = ControlValue;
type luna_ControlValueRange = ControlValueRange;
type luna_Controls = Controls;
declare const luna_Controls: typeof Controls;
type luna_CreateFromTemplateOptions = CreateFromTemplateOptions;
type luna_CreateSessionOptions = CreateSessionOptions;
type luna_CrossfadeAlign = CrossfadeAlign;
declare const luna_DEFAULT_LUNA_PORT: typeof DEFAULT_LUNA_PORT;
declare const luna_DEFAULT_SHORTCUTS: typeof DEFAULT_SHORTCUTS;
declare const luna_DISPLAY_TICKS_PER_BEAT: typeof DISPLAY_TICKS_PER_BEAT;
type luna_Destination = Destination;
type luna_Device = Device;
declare const luna_Device: typeof Device;
type luna_DeviceInput = DeviceInput;
declare const luna_DeviceInput: typeof DeviceInput;
type luna_DeviceInputs = DeviceInputs;
declare const luna_DeviceInputs: typeof DeviceInputs;
type luna_DeviceOutput = DeviceOutput;
declare const luna_DeviceOutput: typeof DeviceOutput;
type luna_DeviceOutputs = DeviceOutputs;
declare const luna_DeviceOutputs: typeof DeviceOutputs;
type luna_Devices = Devices;
declare const luna_Devices: typeof Devices;
type luna_Disposed = Disposed;
declare const luna_Disposed: typeof Disposed;
type luna_DragOptions = DragOptions;
type luna_DragStartLike = DragStartLike;
type luna_Drivers = Drivers;
declare const luna_Drivers: typeof Drivers;
declare const luna_EDIT_SHORTCUTS: typeof EDIT_SHORTCUTS;
declare const luna_EDIT_TIMEOUT_MS: typeof EDIT_TIMEOUT_MS;
declare const luna_EIGHTH_NOTE: typeof EIGHTH_NOTE;
type luna_Effect = Effect;
declare const luna_Effect: typeof Effect;
type luna_Engine = Engine;
type luna_ErrorCode = ErrorCode;
declare const luna_ErrorCodes: typeof ErrorCodes;
type luna_ErrorNotice = ErrorNotice;
declare const luna_ErrorNotice: typeof ErrorNotice;
type luna_ErrorNoticeLevel = ErrorNoticeLevel;
type luna_ErrorNotices = ErrorNotices;
declare const luna_ErrorNotices: typeof ErrorNotices;
type luna_EventHandler = EventHandler;
type luna_ExportOptions = ExportOptions;
type luna_ExtractionOptions = ExtractionOptions;
declare const luna_FOLDER_MODES: typeof FOLDER_MODES;
type luna_FadeShape = FadeShape;
type luna_FileEntry = FileEntry;
type luna_FloatLiteral = FloatLiteral;
declare const luna_FloatLiteral: typeof FloatLiteral;
type luna_FolderAnomaly = FolderAnomaly;
type luna_FolderAnomalyKind = FolderAnomalyKind;
type luna_FolderChannel = FolderChannel;
type luna_FolderMode = FolderMode;
type luna_FolderRow<T extends FolderChannel = Track | Bus> = FolderRow<T>;
type luna_FolderTree<T extends FolderChannel = Track | Bus> = FolderTree<T>;
declare const luna_FolderTree: typeof FolderTree;
declare const luna_GROUP_ATTRIBUTES: typeof GROUP_ATTRIBUTES;
type luna_Gesture = Gesture;
type luna_GestureOptions = GestureOptions;
type luna_GetOptions = GetOptions;
type luna_Group = Group;
declare const luna_Group: typeof Group;
type luna_GroupAttribute = GroupAttribute;
type luna_Groups = Groups;
declare const luna_Groups: typeof Groups;
type luna_Gui = Gui;
declare const luna_Gui: typeof Gui;
type luna_GuiPage = GuiPage;
type luna_GuiWindow = GuiWindow;
declare const luna_GuiWindow: typeof GuiWindow;
declare const luna_HALF_NOTE: typeof HALF_NOTE;
declare const luna_HIDDEN_SESSION_TYPES: typeof HIDDEN_SESSION_TYPES;
declare const luna_INPUT_ANALYSIS_KINDS: typeof INPUT_ANALYSIS_KINDS;
declare const luna_INSERT_ALIAS_PREFIX: typeof INSERT_ALIAS_PREFIX;
type luna_ImportPathOptions = ImportPathOptions;
type luna_ImportedFile = ImportedFile;
type luna_InputAnalysisKind = InputAnalysisKind;
type luna_InsertClipOptions = InsertClipOptions;
type luna_InsertSlot = InsertSlot;
type luna_InstrumentAnalysis = InstrumentAnalysis;
declare const luna_InstrumentAnalysis: typeof InstrumentAnalysis;
type luna_InstrumentAnalysisResult = InstrumentAnalysisResult;
type luna_Job = Job;
declare const luna_Job: typeof Job;
type luna_JobCriteria = JobCriteria;
type luna_JobResult = JobResult;
type luna_JobRun = JobRun;
declare const luna_JobRun: typeof JobRun;
type luna_JobRunOptions = JobRunOptions;
type luna_JobSnapshot = JobSnapshot;
type luna_Jobs = Jobs;
declare const luna_Jobs: typeof Jobs;
type luna_KeptReason = KeptReason;
type luna_KeyAnalysis = KeyAnalysis;
declare const luna_KeyAnalysis: typeof KeyAnalysis;
type luna_KeyAnalysisResult = KeyAnalysisResult;
type luna_KeyCandidate = KeyCandidate;
type luna_KeyCombo = KeyCombo;
type luna_KeySignature = KeySignature;
declare const luna_KeySignature: typeof KeySignature;
type luna_KnownControlType = KnownControlType;
type luna_KnownStemFormat = KnownStemFormat;
declare const luna_LUNA_CHANNEL_PLUGIN_ID: typeof LUNA_CHANNEL_PLUGIN_ID;
declare const luna_LUNA_DEVICE_UID: typeof LUNA_DEVICE_UID;
declare const luna_LUNA_EXTENSION_PLUGIN_IDS: typeof LUNA_EXTENSION_PLUGIN_IDS;
type luna_LengthFollows = LengthFollows;
type luna_List<T> = List<T>;
type luna_Location = Location;
type luna_LocationOptions = LocationOptions;
type luna_LogFn = LogFn;
type luna_LogLevel = LogLevel;
type luna_Lyric = Lyric;
declare const luna_Lyric: typeof Lyric;
type luna_LyricProviders = LyricProviders;
type luna_LyricWord = LyricWord;
type luna_Lyrics = Lyrics;
declare const luna_Lyrics: typeof Lyrics;
declare const luna_MAX_CUE_BUSES: typeof MAX_CUE_BUSES;
declare const luna_MAX_SECRET_BYTES: typeof MAX_SECRET_BYTES;
declare const luna_MAX_SECRET_NAME_LENGTH: typeof MAX_SECRET_NAME_LENGTH;
declare const luna_MAX_SYSEX_BYTES: typeof MAX_SYSEX_BYTES;
type luna_Marker = Marker;
declare const luna_Marker: typeof Marker;
type luna_Markers = Markers;
declare const luna_Markers: typeof Markers;
type luna_Meter = Meter;
declare const luna_Meter: typeof Meter;
type luna_MidiClip = MidiClip;
declare const luna_MidiClip: typeof MidiClip;
type luna_MidiDevice = MidiDevice;
declare const luna_MidiDevice: typeof MidiDevice;
type luna_MidiDevices = MidiDevices;
declare const luna_MidiDevices: typeof MidiDevices;
type luna_MidiEvent = MidiEvent;
type luna_MidiHost = MidiHost;
type luna_MidiInput = MidiInput;
declare const luna_MidiInput: typeof MidiInput;
type luna_MidiInputListenOptions = MidiInputListenOptions;
type luna_MidiInputMessage = MidiInputMessage;
type luna_MidiInputTarget = MidiInputTarget;
type luna_MidiInputType = MidiInputType;
type luna_MidiOperation = MidiOperation;
type luna_MidiOutputAssignment = MidiOutputAssignment;
declare const luna_MidiOutputAssignment: typeof MidiOutputAssignment;
type luna_MidiOutputDestination = MidiOutputDestination;
type luna_MidiOutputTarget = MidiOutputTarget;
type luna_MidiOutputs = MidiOutputs;
declare const luna_MidiOutputs: typeof MidiOutputs;
type luna_MidiPort = MidiPort;
declare const luna_MidiPort: typeof MidiPort;
type luna_MidiRoute = MidiRoute;
type luna_MidiRow = MidiRow;
type luna_MidiRowData = MidiRowData;
type luna_MockEngine = MockEngine;
declare const luna_MockEngine: typeof MockEngine;
type luna_MockEngineOptions = MockEngineOptions;
type luna_MockJobPlan = MockJobPlan;
type luna_MockMidiRow = MockMidiRow;
type luna_MockMidiSent = MockMidiSent;
type luna_MockNodeSpec = MockNodeSpec;
type luna_MockPort = MockPort;
declare const luna_MockPort: typeof MockPort;
type luna_ModuleFactory = ModuleFactory;
type luna_MoveToFolderOptions = MoveToFolderOptions;
type luna_Musical = Musical;
declare const luna_Musical: typeof Musical;
declare const luna_NEG_INFINITY_DB: typeof NEG_INFINITY_DB;
type luna_NestedFileEntry = NestedFileEntry;
type luna_NewBusOptions = NewBusOptions;
type luna_NewFolderOptions = NewFolderOptions;
type luna_NewGroupOptions = NewGroupOptions;
type luna_NewNote = NewNote;
type luna_NewSessionType = NewSessionType;
type luna_NewTrackFromPresetOptions = NewTrackFromPresetOptions;
type luna_NewTrackOptions = NewTrackOptions;
type luna_NoSessionOpen = NoSessionOpen;
declare const luna_NoSessionOpen: typeof NoSessionOpen;
type luna_Node = Node;
declare const luna_Node: typeof Node;
type luna_NotRunning = NotRunning;
declare const luna_NotRunning: typeof NotRunning;
type luna_Note = Note;
declare const luna_ONE_TWENTY_EIGHTH_NOTE: typeof ONE_TWENTY_EIGHTH_NOTE;
declare const luna_OVERVIEW_PAIR_NS: typeof OVERVIEW_PAIR_NS;
type luna_Operation = Operation;
type luna_Output = Output;
declare const luna_Output: typeof Output;
type luna_OutputAssignment = OutputAssignment;
type luna_Overview = Overview;
type luna_OverviewInfo = OverviewInfo;
type luna_OverviewKind = OverviewKind;
type luna_OverviewOptions = OverviewOptions;
declare const luna_PLUGIN_ERROR_MISSING: typeof PLUGIN_ERROR_MISSING;
declare const luna_POST_RECORD_COMMANDS: typeof POST_RECORD_COMMANDS;
declare const luna_PROGRESS_SUPPRESSION_MAX_MS: typeof PROGRESS_SUPPRESSION_MAX_MS;
type luna_PairRange = PairRange;
type luna_ParsedChord = ParsedChord;
type luna_PathDrop = PathDrop;
type luna_PathDropHandlers = PathDropHandlers;
type luna_Playlist = Playlist;
declare const luna_Playlist: typeof Playlist;
type luna_Plugin = Plugin;
declare const luna_Plugin: typeof Plugin;
type luna_PluginFormat = PluginFormat;
type luna_PluginManifest = PluginManifest;
type luna_PluginQueryOptions = PluginQueryOptions;
type luna_PluginRequirement = PluginRequirement;
type luna_PluginRow = PluginRow;
type luna_PluginSdkType = PluginSdkType;
type luna_PluginWindow = PluginWindow;
type luna_Plugins = Plugins;
declare const luna_Plugins: typeof Plugins;
type luna_Port = Port;
type luna_PortStatus = PortStatus;
type luna_PostRecordCommand = PostRecordCommand;
type luna_PreferenceContext = PreferenceContext;
declare const luna_PreferenceContext: typeof PreferenceContext;
type luna_Preferences = Preferences;
declare const luna_Preferences: typeof Preferences;
type luna_PresetQueryOptions = PresetQueryOptions;
type luna_PresetRecommendation = PresetRecommendation;
type luna_PresetRow = PresetRow;
type luna_PresetSelection = PresetSelection;
declare const luna_PresetSelection: typeof PresetSelection;
type luna_PresetSelectionOptions = PresetSelectionOptions;
type luna_PresetTagGroup = PresetTagGroup;
type luna_Presets = Presets;
declare const luna_Presets: typeof Presets;
type luna_ProgressSuppression = ProgressSuppression;
type luna_ProgressTask = ProgressTask;
type luna_Prop<T> = Prop<T>;
type luna_PropKey<T> = PropKey<T>;
declare const luna_QUARTER_NOTE: typeof QUARTER_NOTE;
type luna_QueryOptions = QueryOptions;
type luna_QwertyKeyEvent = QwertyKeyEvent;
type luna_QwertyMidi = QwertyMidi;
declare const luna_QwertyMidi: typeof QwertyMidi;
declare const luna_RECORD_LOOP_MARGIN_TICKS: typeof RECORD_LOOP_MARGIN_TICKS;
type luna_RangeOptions = RangeOptions;
type luna_RecPlayMode = RecPlayMode;
type luna_RecentSessionRow = RecentSessionRow;
type luna_RecentSessions = RecentSessions;
declare const luna_RecentSessions: typeof RecentSessions;
type luna_RecordOptions = RecordOptions;
type luna_RecordTake = RecordTake;
declare const luna_RecordTake: typeof RecordTake;
type luna_RecordTakes = RecordTakes;
declare const luna_RecordTakes: typeof RecordTakes;
type luna_Releasable = Releasable;
type luna_Render = Render;
declare const luna_Render: typeof Render;
type luna_Renders = Renders;
declare const luna_Renders: typeof Renders;
type luna_ReorderOptions = ReorderOptions;
type luna_RequestTimeout = RequestTimeout;
declare const luna_RequestTimeout: typeof RequestTimeout;
type luna_RollDuration = RollDuration;
declare const luna_SEND_COUNT: typeof SEND_COUNT;
declare const luna_SESSION_TYPES: typeof SESSION_TYPES;
declare const luna_SIXTEENTH_NOTE: typeof SIXTEENTH_NOTE;
declare const luna_SIXTY_FOURTH_NOTE: typeof SIXTY_FOURTH_NOTE;
declare const luna_STEM_FORMATS: typeof STEM_FORMATS;
type luna_Scheduler = Scheduler;
declare const luna_Scheduler: typeof Scheduler;
type luna_SecretStorage = SecretStorage;
type luna_Secrets = Secrets;
declare const luna_Secrets: typeof Secrets;
type luna_SeekOptions = SeekOptions;
type luna_SeekTarget = SeekTarget;
type luna_SelectedNotes = SelectedNotes;
type luna_SelectionSnapshot = SelectionSnapshot;
type luna_SendMidi = SendMidi;
declare const luna_SendMidi: typeof SendMidi;
type luna_SendMidiTrackTarget = SendMidiTrackTarget;
type luna_Session = Session;
declare const luna_Session: typeof Session;
type luna_SessionPackage = SessionPackage;
declare const luna_SessionPackage: typeof SessionPackage;
type luna_SessionPackageRow = SessionPackageRow;
type luna_SessionStorage = SessionStorage;
declare const luna_SessionStorage: typeof SessionStorage;
type luna_SessionType = SessionType;
type luna_Sessions = Sessions;
declare const luna_Sessions: typeof Sessions;
type luna_SetWarpOptions = SetWarpOptions;
type luna_SettablePage = SettablePage;
type luna_SettleOptions = SettleOptions;
type luna_ShortcutBindings = ShortcutBindings;
type luna_ShortcutCommand = ShortcutCommand;
type luna_ShortcutKeyEvent = ShortcutKeyEvent;
type luna_ShortcutPlatform = ShortcutPlatform;
type luna_Shortcuts = Shortcuts;
declare const luna_Shortcuts: typeof Shortcuts;
type luna_ShortcutsBinding = ShortcutsBinding;
type luna_ShortcutsOptions = ShortcutsOptions;
type luna_SocketConstructor = SocketConstructor;
type luna_SocketLike = SocketLike;
type luna_SoloMode = SoloMode;
type luna_SourceAnalysis = SourceAnalysis;
declare const luna_SourceAnalysis: typeof SourceAnalysis;
type luna_SourceDragItems = SourceDragItems;
type luna_SourceLookup = SourceLookup;
declare const luna_SourceOrigin: typeof SourceOrigin;
type luna_SourceUsage = SourceUsage;
declare const luna_SourceUsage: typeof SourceUsage;
type luna_SourceUsageEntry = SourceUsageEntry;
type luna_SourceUse = SourceUse;
type luna_StatusListener = StatusListener;
type luna_StemFormat = StemFormat;
type luna_StorageContext = StorageContext;
declare const luna_StorageContext: typeof StorageContext;
type luna_StorageEditOptions = StorageEditOptions;
type luna_Store = Store;
declare const luna_Store: typeof Store;
type luna_SubscribeOptions = SubscribeOptions;
type luna_SuppressProgressOptions = SuppressProgressOptions;
declare const luna_THIRTY_SECOND_NOTE: typeof THIRTY_SECOND_NOTE;
declare const luna_TICKS_PER_BEAT: typeof TICKS_PER_BEAT;
declare const luna_TICKS_PER_DISPLAY_TICK: typeof TICKS_PER_DISPLAY_TICK;
declare const luna_TRACK_PRESET_CATEGORIES: typeof TRACK_PRESET_CATEGORIES;
declare const luna_TRACK_TYPES: typeof TRACK_TYPES;
type luna_Taper = Taper;
declare const luna_Taper: typeof Taper;
type luna_TaperMarksOptions = TaperMarksOptions;
type luna_TaperName = TaperName;
type luna_TemplateQueryOptions = TemplateQueryOptions;
type luna_TempoAnalysis = TempoAnalysis;
declare const luna_TempoAnalysis: typeof TempoAnalysis;
type luna_TempoAnalysisResult = TempoAnalysisResult;
type luna_TempoCandidate = TempoCandidate;
type luna_TempoEvent = TempoEvent;
declare const luna_TempoEvent: typeof TempoEvent;
type luna_TimeSignature = TimeSignature;
declare const luna_TimeSignature: typeof TimeSignature;
type luna_Timeline = Timeline;
declare const luna_Timeline: typeof Timeline;
type luna_TraceWaveformOptions = TraceWaveformOptions;
type luna_Track = Track;
declare const luna_Track: typeof Track;
type luna_TrackPresetCategory = TrackPresetCategory;
type luna_TrackPresetPlugin = TrackPresetPlugin;
type luna_TrackPresetSelection = TrackPresetSelection;
declare const luna_TrackPresetSelection: typeof TrackPresetSelection;
type luna_TrackPresetSelectionOptions = TrackPresetSelectionOptions;
type luna_TrackType = TrackType;
type luna_TransactionMode = TransactionMode;
type luna_TransactionOptions = TransactionOptions;
type luna_TranscribeOptions = TranscribeOptions;
type luna_TransientAnalysis = TransientAnalysis;
declare const luna_TransientAnalysis: typeof TransientAnalysis;
type luna_TransientAnalysisResult = TransientAnalysisResult;
type luna_Transport = Transport;
declare const luna_Transport: typeof Transport;
type luna_TransportLocation = TransportLocation;
type luna_Unsubscribe = Unsubscribe;
type luna_Unsupported = Unsupported;
declare const luna_Unsupported: typeof Unsupported;
type luna_UnusedMedia = UnusedMedia;
type luna_UploadOptions = UploadOptions;
declare const luna_VERSION: typeof VERSION;
type luna_Verb = Verb;
type luna_VisibleRowsOptions<T extends FolderChannel = Track | Bus> = VisibleRowsOptions<T>;
declare const luna_WARP_TRANSIENT_ZONE_NS: typeof WARP_TRANSIENT_ZONE_NS;
declare const luna_WAVEFORM_PAGE: typeof WAVEFORM_PAGE;
declare const luna_WHOLE_NOTE: typeof WHOLE_NOTE;
type luna_Warp = Warp;
declare const luna_Warp: typeof Warp;
type luna_WarpMarker = WarpMarker;
type luna_WarpType = WarpType;
type luna_Warps = Warps;
declare const luna_Warps: typeof Warps;
type luna_WasmEngine = WasmEngine;
declare const luna_WasmEngine: typeof WasmEngine;
type luna_WasmHooks = WasmHooks;
type luna_WasmModule = WasmModule;
type luna_WasmPort = WasmPort;
declare const luna_WasmPort: typeof WasmPort;
type luna_WasmPortOptions = WasmPortOptions;
type luna_WasmState = WasmState;
type luna_WaveformChannel = WaveformChannel;
type luna_WaveformColumns = WaveformColumns;
type luna_WaveformLane = WaveformLane;
type luna_WaveformPathTarget = WaveformPathTarget;
type luna_WaveformRange = WaveformRange;
type luna_WaveformScale = WaveformScale;
type luna_Waveforms = Waveforms;
declare const luna_Waveforms: typeof Waveforms;
type luna_WebSocketPort = WebSocketPort;
declare const luna_WebSocketPort: typeof WebSocketPort;
type luna_WebSocketPortOptions = WebSocketPortOptions;
type luna_WireMessage = WireMessage;
type luna_Workspace = Workspace;
declare const luna_Workspace: typeof Workspace;
type luna_WritableProp<T> = WritableProp<T>;
declare const luna_addOnTarget: typeof addOnTarget;
declare const luna_audioNsAtTick: typeof audioNsAtTick;
declare const luna_automationModeOrdinal: typeof automationModeOrdinal;
declare const luna_beatsToTicks: typeof beatsToTicks;
declare const luna_bindClock: typeof bindClock;
declare const luna_bindDrag: typeof bindDrag;
declare const luna_bindGesture: typeof bindGesture;
declare const luna_bindRange: typeof bindRange;
declare const luna_bindShortcuts: typeof bindShortcuts;
declare const luna_bootWasmEngine: typeof bootWasmEngine;
declare const luna_canDropPaths: typeof canDropPaths;
declare const luna_clients: typeof clients;
declare const luna_clipAudio: typeof clipAudio;
declare const luna_clipGainAt: typeof clipGainAt;
declare const luna_clipTypeFrom: typeof clipTypeFrom;
declare const luna_compiledClipAudio: typeof compiledClipAudio;
declare const luna_connect: typeof connect;
declare const luna_consoleLog: typeof consoleLog;
declare const luna_dbToGain: typeof dbToGain;
declare const luna_decodeMessage: typeof decodeMessage;
declare const luna_decodeMidiData: typeof decodeMidiData;
declare const luna_decodeMidiEvents: typeof decodeMidiEvents;
declare const luna_derived: typeof derived;
declare const luna_dotted: typeof dotted;
declare const luna_encodeMidiData: typeof encodeMidiData;
declare const luna_encodePayload: typeof encodePayload;
declare const luna_encodeRequest: typeof encodeRequest;
declare const luna_eventMatches: typeof eventMatches;
declare const luna_expandMulti: typeof expandMulti;
declare const luna_fileUrl: typeof fileUrl;
declare const luna_float: typeof float;
declare const luna_folderTree: typeof folderTree;
declare const luna_formatBarBeat: typeof formatBarBeat;
declare const luna_formatMinSec: typeof formatMinSec;
declare const luna_formatRollDuration: typeof formatRollDuration;
declare const luna_formatTimeSignature: typeof formatTimeSignature;
declare const luna_gainToDb: typeof gainToDb;
declare const luna_getOptionsToParams: typeof getOptionsToParams;
declare const luna_hasNativeBridge: typeof hasNativeBridge;
declare const luna_insertSlotForAlias: typeof insertSlotForAlias;
declare const luna_isAddOnCategory: typeof isAddOnCategory;
declare const luna_isEmbeddedInLuna: typeof isEmbeddedInLuna;
declare const luna_isHiddenSessionType: typeof isHiddenSessionType;
declare const luna_isInsertAliasPluginId: typeof isInsertAliasPluginId;
declare const luna_isLunaEnginePort: typeof isLunaEnginePort;
declare const luna_isLunaExtensionPluginId: typeof isLunaExtensionPluginId;
declare const luna_isRecordFxSlot: typeof isRecordFxSlot;
declare const luna_isTerminalJobStatus: typeof isTerminalJobStatus;
declare const luna_joinPath: typeof joinPath;
declare const luna_kindForScale: typeof kindForScale;
declare const luna_listOf: typeof listOf;
declare const luna_locationOptions: typeof locationOptions;
declare const luna_midiByte: typeof midiByte;
declare const luna_normalizeChordName: typeof normalizeChordName;
declare const luna_normalizePackageUid: typeof normalizePackageUid;
declare const luna_onPathDrop: typeof onPathDrop;
declare const luna_pairNotes: typeof pairNotes;
declare const luna_pairNs: typeof pairNs;
declare const luna_pairRange: typeof pairRange;
declare const luna_parseBusType: typeof parseBusType;
declare const luna_parseChord: typeof parseChord;
declare const luna_parseControlType: typeof parseControlType;
declare const luna_parseFolderMode: typeof parseFolderMode;
declare const luna_parseRollDuration: typeof parseRollDuration;
declare const luna_parseSessionType: typeof parseSessionType;
declare const luna_parseStemFormat: typeof parseStemFormat;
declare const luna_parseTrackType: typeof parseTrackType;
declare const luna_pluginFormat: typeof pluginFormat;
declare const luna_pluginVersionMeets: typeof pluginVersionMeets;
declare const luna_propertyValue: typeof propertyValue;
declare const luna_requireTick: typeof requireTick;
declare const luna_secondsToTicks: typeof secondsToTicks;
declare const luna_selectedNotes: typeof selectedNotes;
declare const luna_settle: typeof settle;
declare const luna_shallowEquals: typeof shallowEquals;
declare const luna_sourceDisplayName: typeof sourceDisplayName;
declare const luna_sourceFilePath: typeof sourceFilePath;
declare const luna_splitPath: typeof splitPath;
declare const luna_startSourceDrag: typeof startSourceDrag;
declare const luna_stripValueSuffix: typeof stripValueSuffix;
declare const luna_suggestAddOnCategories: typeof suggestAddOnCategories;
declare const luna_ticksToBeats: typeof ticksToBeats;
declare const luna_ticksToSeconds: typeof ticksToSeconds;
declare const luna_toEvent: typeof toEvent;
declare const luna_traceWaveform: typeof traceWaveform;
declare const luna_triplet: typeof triplet;
declare const luna_wasmUpdateToEvent: typeof wasmUpdateToEvent;
declare const luna_waveformColumns: typeof waveformColumns;
declare const luna_waveformLanes: typeof waveformLanes;
declare const luna_waveformPeak: typeof waveformPeak;
declare const luna_writable: typeof writable;
declare const luna_yieldTask: typeof yieldTask;
declare namespace luna {
  export { luna_ADD_ON_CATEGORIES as ADD_ON_CATEGORIES, luna_AUTOMATION_MODES as AUTOMATION_MODES, luna_ActiveAudioEngine as ActiveAudioEngine, type luna_ActiveAudioEngineInfo as ActiveAudioEngineInfo, type luna_AddLyricOptions as AddLyricOptions, luna_AddOn as AddOn, type luna_AddOnCategory as AddOnCategory, type luna_AddOnCategoryInfo as AddOnCategoryInfo, type luna_AddOnInstalledFrom as AddOnInstalledFrom, luna_AddOnInstance as AddOnInstance, type luna_AddOnTarget as AddOnTarget, type luna_AffectedTracksOptions as AffectedTracksOptions, type luna_AlgType as AlgType, type luna_AnalysisKind as AnalysisKind, luna_AnalysisNode as AnalysisNode, luna_Assistant as Assistant, type luna_AudioDeviceInfo as AudioDeviceInfo, type luna_AudioHealth as AudioHealth, type luna_AudioInput as AudioInput, luna_AudioSource as AudioSource, luna_AutoGain as AutoGain, luna_AutoGainChannel as AutoGainChannel, type luna_AutoGainStartOptions as AutoGainStartOptions, type luna_AutoGainStatus as AutoGainStatus, type luna_AutoGainTarget as AutoGainTarget, luna_Automation as Automation, type luna_AutomationMode as AutomationMode, type luna_AutomationModeName as AutomationModeName, luna_BUS_TYPES as BUS_TYPES, type luna_BarBeat as BarBeat, luna_Bindings as Bindings, type luna_BootOptions as BootOptions, type luna_BounceOptions as BounceOptions, type luna_Breakpoint as Breakpoint, luna_BreakpointNode as BreakpointNode, luna_Bus as Bus, type luna_BusType as BusType, luna_COARSE_PAIRS_PER_FINE as COARSE_PAIRS_PER_FINE, luna_COARSE_PAIR_NS as COARSE_PAIR_NS, luna_CONTROL_TYPES as CONTROL_TYPES, luna_CUE_COUNT as CUE_COUNT, luna_Cell as Cell, luna_Channel as Channel, type luna_ChannelRef as ChannelRef, luna_Chord as Chord, luna_ChordAnalysis as ChordAnalysis, type luna_ChordAnalysisResult as ChordAnalysisResult, type luna_ChordSegment as ChordSegment, type luna_ChordSpec as ChordSpec, luna_Chords as Chords, luna_Client as Client, luna_Clip as Clip, type luna_ClipAudio as ClipAudio, type luna_ClipLike as ClipLike, type luna_ClipNote as ClipNote, type luna_ClipSnapshot as ClipSnapshot, type luna_ClipType as ClipType, type luna_ClockOptions as ClockOptions, luna_Collection as Collection, type luna_CommandHandler as CommandHandler, luna_CompiledClip as CompiledClip, type luna_CompiledClipLike as CompiledClipLike, type luna_CompiledClipSnapshot as CompiledClipSnapshot, luna_CompiledClips as CompiledClips, type luna_CompiledFade as CompiledFade, type luna_ConnectOptions as ConnectOptions, luna_ConnectionLost as ConnectionLost, luna_Context as Context, type luna_ContextType as ContextType, luna_Control as Control, type luna_ControlBinding as ControlBinding, type luna_ControlType as ControlType, type luna_ControlValue as ControlValue, type luna_ControlValueRange as ControlValueRange, luna_Controls as Controls, type luna_CreateFromTemplateOptions as CreateFromTemplateOptions, type luna_CreateSessionOptions as CreateSessionOptions, type luna_CrossfadeAlign as CrossfadeAlign, luna_DEFAULT_LUNA_PORT as DEFAULT_LUNA_PORT, luna_DEFAULT_SHORTCUTS as DEFAULT_SHORTCUTS, luna_DISPLAY_TICKS_PER_BEAT as DISPLAY_TICKS_PER_BEAT, type luna_Destination as Destination, luna_Device as Device, luna_DeviceInput as DeviceInput, luna_DeviceInputs as DeviceInputs, luna_DeviceOutput as DeviceOutput, luna_DeviceOutputs as DeviceOutputs, luna_Devices as Devices, luna_Disposed as Disposed, type luna_DragOptions as DragOptions, type luna_DragStartLike as DragStartLike, luna_Drivers as Drivers, luna_EDIT_SHORTCUTS as EDIT_SHORTCUTS, luna_EDIT_TIMEOUT_MS as EDIT_TIMEOUT_MS, luna_EIGHTH_NOTE as EIGHTH_NOTE, luna_Effect as Effect, type luna_Engine as Engine, UAError as Error, type luna_ErrorCode as ErrorCode, luna_ErrorCodes as ErrorCodes, luna_ErrorNotice as ErrorNotice, type luna_ErrorNoticeLevel as ErrorNoticeLevel, luna_ErrorNotices as ErrorNotices, type Event$1 as Event, type luna_EventHandler as EventHandler, type luna_ExportOptions as ExportOptions, type luna_ExtractionOptions as ExtractionOptions, luna_FOLDER_MODES as FOLDER_MODES, type luna_FadeShape as FadeShape, type luna_FileEntry as FileEntry, luna_FloatLiteral as FloatLiteral, type luna_FolderAnomaly as FolderAnomaly, type luna_FolderAnomalyKind as FolderAnomalyKind, type luna_FolderChannel as FolderChannel, type luna_FolderMode as FolderMode, type luna_FolderRow as FolderRow, luna_FolderTree as FolderTree, luna_GROUP_ATTRIBUTES as GROUP_ATTRIBUTES, type luna_Gesture as Gesture, type luna_GestureOptions as GestureOptions, type luna_GetOptions as GetOptions, luna_Group as Group, type luna_GroupAttribute as GroupAttribute, luna_Groups as Groups, luna_Gui as Gui, type luna_GuiPage as GuiPage, luna_GuiWindow as GuiWindow, luna_HALF_NOTE as HALF_NOTE, luna_HIDDEN_SESSION_TYPES as HIDDEN_SESSION_TYPES, luna_INPUT_ANALYSIS_KINDS as INPUT_ANALYSIS_KINDS, luna_INSERT_ALIAS_PREFIX as INSERT_ALIAS_PREFIX, type luna_ImportPathOptions as ImportPathOptions, type luna_ImportedFile as ImportedFile, type luna_InputAnalysisKind as InputAnalysisKind, type luna_InsertClipOptions as InsertClipOptions, type luna_InsertSlot as InsertSlot, luna_InstrumentAnalysis as InstrumentAnalysis, type luna_InstrumentAnalysisResult as InstrumentAnalysisResult, luna_Job as Job, type luna_JobCriteria as JobCriteria, type luna_JobResult as JobResult, luna_JobRun as JobRun, type luna_JobRunOptions as JobRunOptions, type luna_JobSnapshot as JobSnapshot, luna_Jobs as Jobs, type luna_KeptReason as KeptReason, luna_KeyAnalysis as KeyAnalysis, type luna_KeyAnalysisResult as KeyAnalysisResult, type luna_KeyCandidate as KeyCandidate, type luna_KeyCombo as KeyCombo, luna_KeySignature as KeySignature, type luna_KnownControlType as KnownControlType, type luna_KnownStemFormat as KnownStemFormat, luna_LUNA_CHANNEL_PLUGIN_ID as LUNA_CHANNEL_PLUGIN_ID, luna_LUNA_DEVICE_UID as LUNA_DEVICE_UID, luna_LUNA_EXTENSION_PLUGIN_IDS as LUNA_EXTENSION_PLUGIN_IDS, type luna_LengthFollows as LengthFollows, type luna_List as List, type luna_Location as Location, type luna_LocationOptions as LocationOptions, type luna_LogFn as LogFn, type luna_LogLevel as LogLevel, luna_Lyric as Lyric, type luna_LyricProviders as LyricProviders, type luna_LyricWord as LyricWord, luna_Lyrics as Lyrics, luna_MAX_CUE_BUSES as MAX_CUE_BUSES, luna_MAX_SECRET_BYTES as MAX_SECRET_BYTES, luna_MAX_SECRET_NAME_LENGTH as MAX_SECRET_NAME_LENGTH, luna_MAX_SYSEX_BYTES as MAX_SYSEX_BYTES, luna_Marker as Marker, luna_Markers as Markers, luna_Meter as Meter, luna_MidiClip as MidiClip, luna_MidiDevice as MidiDevice, luna_MidiDevices as MidiDevices, type luna_MidiEvent as MidiEvent, type luna_MidiHost as MidiHost, luna_MidiInput as MidiInput, type luna_MidiInputListenOptions as MidiInputListenOptions, type luna_MidiInputMessage as MidiInputMessage, type luna_MidiInputTarget as MidiInputTarget, type luna_MidiInputType as MidiInputType, type luna_MidiOperation as MidiOperation, luna_MidiOutputAssignment as MidiOutputAssignment, type luna_MidiOutputDestination as MidiOutputDestination, type luna_MidiOutputTarget as MidiOutputTarget, luna_MidiOutputs as MidiOutputs, luna_MidiPort as MidiPort, type luna_MidiRoute as MidiRoute, type luna_MidiRow as MidiRow, type luna_MidiRowData as MidiRowData, luna_MockEngine as MockEngine, type luna_MockEngineOptions as MockEngineOptions, type luna_MockJobPlan as MockJobPlan, type luna_MockMidiRow as MockMidiRow, type luna_MockMidiSent as MockMidiSent, type luna_MockNodeSpec as MockNodeSpec, luna_MockPort as MockPort, type luna_ModuleFactory as ModuleFactory, type luna_MoveToFolderOptions as MoveToFolderOptions, luna_Musical as Musical, luna_NEG_INFINITY_DB as NEG_INFINITY_DB, type luna_NestedFileEntry as NestedFileEntry, type luna_NewBusOptions as NewBusOptions, type luna_NewFolderOptions as NewFolderOptions, type luna_NewGroupOptions as NewGroupOptions, type luna_NewNote as NewNote, type luna_NewSessionType as NewSessionType, type luna_NewTrackFromPresetOptions as NewTrackFromPresetOptions, type luna_NewTrackOptions as NewTrackOptions, luna_NoSessionOpen as NoSessionOpen, luna_Node as Node, luna_NotRunning as NotRunning, type luna_Note as Note, luna_ONE_TWENTY_EIGHTH_NOTE as ONE_TWENTY_EIGHTH_NOTE, luna_OVERVIEW_PAIR_NS as OVERVIEW_PAIR_NS, type luna_Operation as Operation, luna_Output as Output, type luna_OutputAssignment as OutputAssignment, type luna_Overview as Overview, type luna_OverviewInfo as OverviewInfo, type luna_OverviewKind as OverviewKind, type luna_OverviewOptions as OverviewOptions, luna_PLUGIN_ERROR_MISSING as PLUGIN_ERROR_MISSING, luna_POST_RECORD_COMMANDS as POST_RECORD_COMMANDS, luna_PROGRESS_SUPPRESSION_MAX_MS as PROGRESS_SUPPRESSION_MAX_MS, type luna_PairRange as PairRange, type luna_ParsedChord as ParsedChord, type luna_PathDrop as PathDrop, type luna_PathDropHandlers as PathDropHandlers, luna_Playlist as Playlist, luna_Plugin as Plugin, type luna_PluginFormat as PluginFormat, type luna_PluginManifest as PluginManifest, type luna_PluginQueryOptions as PluginQueryOptions, type luna_PluginRequirement as PluginRequirement, type luna_PluginRow as PluginRow, type luna_PluginSdkType as PluginSdkType, type luna_PluginWindow as PluginWindow, luna_Plugins as Plugins, type luna_Port as Port, type luna_PortStatus as PortStatus, type luna_PostRecordCommand as PostRecordCommand, luna_PreferenceContext as PreferenceContext, luna_Preferences as Preferences, type luna_PresetQueryOptions as PresetQueryOptions, type luna_PresetRecommendation as PresetRecommendation, type luna_PresetRow as PresetRow, luna_PresetSelection as PresetSelection, type luna_PresetSelectionOptions as PresetSelectionOptions, type luna_PresetTagGroup as PresetTagGroup, luna_Presets as Presets, type luna_ProgressSuppression as ProgressSuppression, type luna_ProgressTask as ProgressTask, type luna_Prop as Prop, type luna_PropKey as PropKey, luna_QUARTER_NOTE as QUARTER_NOTE, type luna_QueryOptions as QueryOptions, type luna_QwertyKeyEvent as QwertyKeyEvent, luna_QwertyMidi as QwertyMidi, luna_RECORD_LOOP_MARGIN_TICKS as RECORD_LOOP_MARGIN_TICKS, type luna_RangeOptions as RangeOptions, type luna_RecPlayMode as RecPlayMode, type luna_RecentSessionRow as RecentSessionRow, luna_RecentSessions as RecentSessions, type luna_RecordOptions as RecordOptions, luna_RecordTake as RecordTake, luna_RecordTakes as RecordTakes, type luna_Releasable as Releasable, luna_Render as Render, luna_Renders as Renders, type luna_ReorderOptions as ReorderOptions, luna_RequestTimeout as RequestTimeout, type luna_RollDuration as RollDuration, luna_SEND_COUNT as SEND_COUNT, luna_SESSION_TYPES as SESSION_TYPES, luna_SIXTEENTH_NOTE as SIXTEENTH_NOTE, luna_SIXTY_FOURTH_NOTE as SIXTY_FOURTH_NOTE, luna_STEM_FORMATS as STEM_FORMATS, luna_Scheduler as Scheduler, type luna_SecretStorage as SecretStorage, luna_Secrets as Secrets, type luna_SeekOptions as SeekOptions, type luna_SeekTarget as SeekTarget, type luna_SelectedNotes as SelectedNotes, type luna_SelectionSnapshot as SelectionSnapshot, luna_SendMidi as SendMidi, type luna_SendMidiTrackTarget as SendMidiTrackTarget, luna_Session as Session, luna_SessionPackage as SessionPackage, type luna_SessionPackageRow as SessionPackageRow, luna_SessionStorage as SessionStorage, type luna_SessionType as SessionType, luna_Sessions as Sessions, type luna_SetWarpOptions as SetWarpOptions, type luna_SettablePage as SettablePage, type luna_SettleOptions as SettleOptions, type luna_ShortcutBindings as ShortcutBindings, type luna_ShortcutCommand as ShortcutCommand, type luna_ShortcutKeyEvent as ShortcutKeyEvent, type luna_ShortcutPlatform as ShortcutPlatform, luna_Shortcuts as Shortcuts, type luna_ShortcutsBinding as ShortcutsBinding, type luna_ShortcutsOptions as ShortcutsOptions, type luna_SocketConstructor as SocketConstructor, type luna_SocketLike as SocketLike, type luna_SoloMode as SoloMode, luna_SourceAnalysis as SourceAnalysis, type luna_SourceDragItems as SourceDragItems, type luna_SourceLookup as SourceLookup, luna_SourceOrigin as SourceOrigin, luna_SourceUsage as SourceUsage, type luna_SourceUsageEntry as SourceUsageEntry, type luna_SourceUse as SourceUse, type luna_StatusListener as StatusListener, type luna_StemFormat as StemFormat, luna_StorageContext as StorageContext, type luna_StorageEditOptions as StorageEditOptions, luna_Store as Store, type luna_SubscribeOptions as SubscribeOptions, type luna_SuppressProgressOptions as SuppressProgressOptions, luna_THIRTY_SECOND_NOTE as THIRTY_SECOND_NOTE, luna_TICKS_PER_BEAT as TICKS_PER_BEAT, luna_TICKS_PER_DISPLAY_TICK as TICKS_PER_DISPLAY_TICK, luna_TRACK_PRESET_CATEGORIES as TRACK_PRESET_CATEGORIES, luna_TRACK_TYPES as TRACK_TYPES, luna_Taper as Taper, type luna_TaperMarksOptions as TaperMarksOptions, type luna_TaperName as TaperName, type luna_TemplateQueryOptions as TemplateQueryOptions, luna_TempoAnalysis as TempoAnalysis, type luna_TempoAnalysisResult as TempoAnalysisResult, type luna_TempoCandidate as TempoCandidate, luna_TempoEvent as TempoEvent, luna_TimeSignature as TimeSignature, luna_Timeline as Timeline, type luna_TraceWaveformOptions as TraceWaveformOptions, luna_Track as Track, type luna_TrackPresetCategory as TrackPresetCategory, type luna_TrackPresetPlugin as TrackPresetPlugin, luna_TrackPresetSelection as TrackPresetSelection, type luna_TrackPresetSelectionOptions as TrackPresetSelectionOptions, type luna_TrackType as TrackType, type luna_TransactionMode as TransactionMode, type luna_TransactionOptions as TransactionOptions, type luna_TranscribeOptions as TranscribeOptions, luna_TransientAnalysis as TransientAnalysis, type luna_TransientAnalysisResult as TransientAnalysisResult, luna_Transport as Transport, type luna_TransportLocation as TransportLocation, type luna_Unsubscribe as Unsubscribe, luna_Unsupported as Unsupported, type luna_UnusedMedia as UnusedMedia, type luna_UploadOptions as UploadOptions, luna_VERSION as VERSION, type luna_Verb as Verb, type luna_VisibleRowsOptions as VisibleRowsOptions, luna_WARP_TRANSIENT_ZONE_NS as WARP_TRANSIENT_ZONE_NS, luna_WAVEFORM_PAGE as WAVEFORM_PAGE, luna_WHOLE_NOTE as WHOLE_NOTE, luna_Warp as Warp, type luna_WarpMarker as WarpMarker, type luna_WarpType as WarpType, luna_Warps as Warps, luna_WasmEngine as WasmEngine, type luna_WasmHooks as WasmHooks, type luna_WasmModule as WasmModule, luna_WasmPort as WasmPort, type luna_WasmPortOptions as WasmPortOptions, type luna_WasmState as WasmState, type luna_WaveformChannel as WaveformChannel, type luna_WaveformColumns as WaveformColumns, type luna_WaveformLane as WaveformLane, type luna_WaveformPathTarget as WaveformPathTarget, type luna_WaveformRange as WaveformRange, type luna_WaveformScale as WaveformScale, luna_Waveforms as Waveforms, luna_WebSocketPort as WebSocketPort, type luna_WebSocketPortOptions as WebSocketPortOptions, type luna_WireMessage as WireMessage, luna_Workspace as Workspace, type luna_WritableProp as WritableProp, luna_addOnTarget as addOnTarget, luna_audioNsAtTick as audioNsAtTick, luna_automationModeOrdinal as automationModeOrdinal, luna_beatsToTicks as beatsToTicks, luna_bindClock as bindClock, luna_bindDrag as bindDrag, luna_bindGesture as bindGesture, luna_bindRange as bindRange, luna_bindShortcuts as bindShortcuts, luna_bootWasmEngine as bootWasmEngine, luna_canDropPaths as canDropPaths, luna_clients as clients, luna_clipAudio as clipAudio, luna_clipGainAt as clipGainAt, luna_clipTypeFrom as clipTypeFrom, luna_compiledClipAudio as compiledClipAudio, luna_connect as connect, luna_consoleLog as consoleLog, luna_dbToGain as dbToGain, luna_decodeMessage as decodeMessage, luna_decodeMidiData as decodeMidiData, luna_decodeMidiEvents as decodeMidiEvents, luna_derived as derived, luna_dotted as dotted, luna_encodeMidiData as encodeMidiData, luna_encodePayload as encodePayload, luna_encodeRequest as encodeRequest, luna_eventMatches as eventMatches, luna_expandMulti as expandMulti, luna_fileUrl as fileUrl, luna_float as float, luna_folderTree as folderTree, luna_formatBarBeat as formatBarBeat, luna_formatMinSec as formatMinSec, luna_formatRollDuration as formatRollDuration, luna_formatTimeSignature as formatTimeSignature, luna_gainToDb as gainToDb, luna_getOptionsToParams as getOptionsToParams, luna_hasNativeBridge as hasNativeBridge, luna_insertSlotForAlias as insertSlotForAlias, luna_isAddOnCategory as isAddOnCategory, luna_isEmbeddedInLuna as isEmbeddedInLuna, luna_isHiddenSessionType as isHiddenSessionType, luna_isInsertAliasPluginId as isInsertAliasPluginId, luna_isLunaEnginePort as isLunaEnginePort, luna_isLunaExtensionPluginId as isLunaExtensionPluginId, luna_isRecordFxSlot as isRecordFxSlot, luna_isTerminalJobStatus as isTerminalJobStatus, luna_joinPath as joinPath, luna_kindForScale as kindForScale, luna_listOf as listOf, luna_locationOptions as locationOptions, luna_midiByte as midiByte, luna_normalizeChordName as normalizeChordName, luna_normalizePackageUid as normalizePackageUid, luna_onPathDrop as onPathDrop, luna_pairNotes as pairNotes, luna_pairNs as pairNs, luna_pairRange as pairRange, luna_parseBusType as parseBusType, luna_parseChord as parseChord, luna_parseControlType as parseControlType, luna_parseFolderMode as parseFolderMode, luna_parseRollDuration as parseRollDuration, luna_parseSessionType as parseSessionType, luna_parseStemFormat as parseStemFormat, luna_parseTrackType as parseTrackType, luna_pluginFormat as pluginFormat, luna_pluginVersionMeets as pluginVersionMeets, luna_propertyValue as propertyValue, luna_requireTick as requireTick, luna_secondsToTicks as secondsToTicks, luna_selectedNotes as selectedNotes, luna_settle as settle, luna_shallowEquals as shallowEquals, luna_sourceDisplayName as sourceDisplayName, luna_sourceFilePath as sourceFilePath, luna_splitPath as splitPath, luna_startSourceDrag as startSourceDrag, luna_stripValueSuffix as stripValueSuffix, luna_suggestAddOnCategories as suggestAddOnCategories, luna_ticksToBeats as ticksToBeats, luna_ticksToSeconds as ticksToSeconds, luna_toEvent as toEvent, luna_traceWaveform as traceWaveform, luna_triplet as triplet, luna_wasmUpdateToEvent as wasmUpdateToEvent, luna_waveformColumns as waveformColumns, luna_waveformLanes as waveformLanes, luna_waveformPeak as waveformPeak, luna_writable as writable, luna_yieldTask as yieldTask };
}

export { luna as Luna };
