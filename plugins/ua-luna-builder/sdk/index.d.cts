import { Port, Event as Event$1, GetOptions, EventHandler, SubscribeOptions, Unsubscribe, StatusListener, PortStatus, SocketConstructor, LogFn, CommandHandler, ConnectionLost, DEFAULT_LUNA_PORT, Disposed, UAError, FloatLiteral, LogLevel, MockEngine, MockMidiRow, MockNodeSpec, MockPort, NoSessionOpen, NotRunning, Operation, RequestTimeout, SocketLike, Unsupported, Verb, WebSocketPort, WebSocketPortOptions, WireMessage, consoleLog, decodeMessage, encodePayload, encodeRequest, eventMatches, expandMulti, float, getOptionsToParams, joinPath, propertyValue, splitPath, stripValueSuffix, toEvent } from './wire/index.cjs';

/** Lifecycle states reported by the engine. */
type WasmState = 'loading' | 'booting' | 'running' | 'stopping' | 'stopped' | 'error';
/** The subset of the Emscripten module the SDK uses. */
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
/** The page-side hooks the engine calls (`globalThis.WasmDeviced`). */
interface WasmHooks {
    onReply(id: number, error: string, json: string): void;
    onUpdate(path: string, json: string): void;
    onState(state: string, detail: string): void;
}
type ModuleFactory = (options: Record<string, unknown>) => Promise<WasmModule>;
interface BootOptions {
    /** Directory URL holding `devicedwasm.js` and `devicedwasm.wasm`. Default `/__engine/`. */
    engineUrl?: string;
    /** Persist the workspace to OPFS between page loads. Default true. */
    persist?: boolean;
    /** Ask the server for a DWARF-stripped `.wasm` (`?strip=1`, honoured by the engine's own serve scripts). */
    strip?: boolean;
    /** Engine stdout/stderr. Default: `console.debug` / `console.warn`. */
    log?: (line: string, level: 'out' | 'err') => void;
    /** Boot timeout. Default 120 000 ms (the unstripped module is large). */
    timeoutMs?: number;
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
 */
declare class WasmEngine {
    readonly module: WasmModule;
    readonly engineUrl: string;
    private currentState;
    private readonly stateListeners;
    private replyHandler;
    private updateHandler;
    get state(): WasmState;
    get isRunning(): boolean;
    onState(listener: (state: WasmState, detail: string) => void): () => void;
    /**
     * Resume the AudioContext. Browsers only allow this after a user gesture, so call it from a
     * click handler. Resolves true if the context is running afterwards.
     */
    resumeAudio(): Promise<boolean>;
    /** Ask for microphone input (getUserMedia). Needs a secure context and a user gesture. */
    requestAudioInput(): boolean;
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
 * - A missing path answers error `uasrv.invalid_object` (native LUNA answers `{}`).
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
    set(path: string, data: unknown): Promise<void>;
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
 * when any source notifies.
 *
 * @example
 * const isStopped = Luna.derived([transport.playing], () => transport.playing.value === false);
 */
declare function derived<T>(sources: readonly Prop<unknown>[], compute: () => T): Prop<T>;
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
    set(nodePath: string, property: string, value: unknown): Promise<void>;
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
 */
declare const DISPLAY_TICKS_PER_BEAT = 960;
declare const TICKS_PER_DISPLAY_TICK = 100000000;
declare const TICKS_PER_BEAT: number;
declare const WHOLE_NOTE: number;
declare const HALF_NOTE: number;
declare const QUARTER_NOTE: number;
declare const EIGHTH_NOTE: number;
declare const SIXTEENTH_NOTE: number;
/** Bar, beat and display tick as the engine reports them in `location.bar_beat`. */
interface BarBeat {
    bar: number;
    beat: number;
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
/** Format a `bar_beat` as `1|1|000` with the display tick zero-padded. */
declare function formatBarBeat(bb: BarBeat | undefined): string;

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
/** Nanoseconds per fine overview pair: 125 samples at 48 kHz (fact 72). */
declare const OVERVIEW_PAIR_NS: number;
/** Fine pairs per coarse pair. */
declare const COARSE_PAIRS_PER_FINE = 12;
/** Nanoseconds per coarse overview pair: 31.25 ms. */
declare const COARSE_PAIR_NS: number;
/** Nanoseconds one pair of this analysis covers. */
declare function pairNs(kind: OverviewKind): number;

/**
 * A live list of child Nodes under one parent path. Members are created from the parent's
 * child-name cell and disposed when the engine removes them.
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
    private ordered;
    private loading;
    private readonly listeners;
    private namesUnsub;
    private syncedVersion;
    /** Member paths already fetched, so a new child is loaded once and only once. */
    private readonly fetched;
    /** Members in engine order. Empty until loaded or pushed. */
    get items(): readonly T[];
    get value(): readonly T[];
    byId(id: string): T | undefined;
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
    /** Rebuild members if the child-name cell moved since the last sync. */
    private ensureSynced;
    /** Rebuild `members` from the child-name cell; keeps existing instances, disposes removed. */
    private sync;
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
}

type ControlType = 'gain' | 'pan' | 'pan_left' | 'pan_right' | 'mute' | 'record_mute' | 'solo' | 'solo_safe' | 'parameter' | 'pre_fader' | 'enabled' | 'gain_trim' | 'latency_offset' | 'mix_to_mono' | string;
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

type InsertSlot = 'console' | 'reserved_0' | `effect_${number}` | `record_fx_${number}` | 'sidechain_filter' | string;
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
     * @example
     * await slot.setPlugin('com.uaudio.uadx.1176');
     * slot.loaded.value; // true
     */
    setPlugin(pluginId: string, options?: {
        pluginName?: string;
        presetName?: string;
        wait?: boolean;
        timeoutMs?: number;
    }): Promise<unknown>;
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
type StemFormat = 'mono' | 'stereo' | string;
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

type BusType = 'master' | 'aux' | 'input' | 'talkback' | 'loopback' | 'headphone' | `cue_${number}` | string;
type FolderMode = 'none' | 'summing' | 'container';
declare class Bus extends Channel {
    readonly busType: Prop<BusType>;
    readonly folderMode: Prop<FolderMode>;
    get isMaster(): boolean;
    /** A folder is an aux bus whose folder mode is not `none`. */
    get isFolder(): boolean;
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
    readonly gridEnable: WritableProp<boolean>;
    /** Grid size such as `1_4`, `1_8`, `bar`. */
    readonly grid: WritableProp<string>;
    readonly linkEditAndPlay: WritableProp<boolean>;
    readonly focus: Prop<string>;
    /** Set range and/or tracks in one go; omitted parts are left alone. */
    select(options: {
        startTick?: number;
        stopTick?: number;
        trackUids?: string[];
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
    run(command: string, payload?: Record<string, unknown>): Promise<unknown>;
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

declare class TempoEvent extends Node {
    readonly tick: Prop<number>;
    /** Seconds at this event, as the engine computed it. */
    readonly time: Prop<number>;
    readonly tempo: Prop<number>;
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
/** Pure tick arithmetic over the current tempo map and time signatures. */
declare class Timeline {
    private readonly tempos;
    private readonly signatures;
    constructor(tempos: () => readonly TempoEvent[], signatures: () => readonly TimeSignature[]);
    private sortedTempos;
    private sortedSignatures;
    tempoAt(tick: number): number;
    /** Ticks to seconds, integrating the tempo map (constant tempo between events). */
    seconds(tick: number): number;
    /** Bar, beat (1-based) and remaining engine ticks at `tick`, honouring time signature changes. */
    /**
     * The inverse of {@link seconds}: the tick a wall-clock offset lands on, walking the same
     * tempo map. Use it to place a clip that must play unstretched — its span in ticks
     * depends on the tempo where it sits.
     *
     * @example
     * const start = 4 * Luna.TICKS_PER_BEAT;
     * const stop = timeline.tickAtSeconds(timeline.seconds(start) + source.length.value / 1e9);
     */
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
    tickAtSeconds(seconds: number): number;
    barBeat(tick: number): BarBeat;
    /** Tick at the start of `bar` (1-based). */
    tickAtBar(bar: number): number;
}
/** The musical structure of one session. */
declare class Musical {
    private readonly client;
    private readonly sessionPath;
    private readonly sessionUid;
    readonly tempoMap: Collection<TempoEvent>;
    readonly timeSignatures: Collection<TimeSignature>;
    readonly keySignatures: Collection<KeySignature>;
    readonly timeline: Timeline;
    private readyPromise;
    /** Load the three maps. Idempotent. */
    ready(): Promise<void>;
    tempoAt(tick: number): number;
    private post;
    /** Set the tempo at a tick (default: the session start). */
    setTempo(bpm: number, tick?: number): Promise<unknown>;
    deleteTempo(tick: number): Promise<unknown>;
    /** Set the time signature from `bar` (1-based). */
    setTimeSignature(numerator: number, denominator: number, bar?: number): Promise<unknown>;
    /** `sharpsAndFlats`: 1..7 sharps, -1..-7 flats, 0 for C / A minor. */
    setKeySignature(sharpsAndFlats: number, isMinor: boolean, tick?: number): Promise<unknown>;
    /** Move bar one to `tick`. */
    setBarOne(tick: number): Promise<unknown>;
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
}
/** A note-on row paired with the note-off that ends it. */
interface Note {
    /** The note-on row id: the note's identity, and its `List.byId` key. */
    readonly rowid: number;
    /** The note-off row id, `undefined` for an unterminated note-on. */
    readonly offRowid: number | undefined;
    /** MIDI note number, 0-127. */
    readonly pitch: number;
    readonly channel: number;
    /** Clip-relative ticks. */
    readonly startTick: number;
    /** Clip-relative ticks, `undefined` when no note-off follows. */
    readonly stopTick: number | undefined;
    readonly velocity: number;
    readonly offVelocity: number | undefined;
    readonly muted: boolean;
}
/** The wire shape of `midi/table/row_data`: a whole table, or one delta against it (fact 40). */
interface MidiRowData {
    /** `update` is a whole table; `added`, `changed` and `deleted` are deltas. */
    operation: 'update' | 'added' | 'changed' | 'deleted' | string;
    row_ids: number[];
    enabled?: boolean[];
    midi_data?: number[];
    tick?: number[];
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
    /** True while a `session.transaction()` batch is open. */
    readonly batching?: (() => boolean) | undefined;
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
     *
     * @example
     * // Mute everything quieter than 40, as one undo entry.
     * await clip.midi.setMuted(clip.midi.notes.items.filter((n) => n.velocity < 40), true);
     */
    setMuted(notes: ReadonlyArray<Note | number>, muted: boolean): Promise<void>;
    /**
     * Delete notes: `clear` over a selection of exactly these notes, one undo entry, with the
     * user's selection restored afterwards.
     *
     * @example
     * await clip.midi.deleteNotes([clip.midi.notes.items[0]!]);
     */
    deleteNotes(notes: ReadonlyArray<Note | number>): Promise<void>;
    private resolveOne;
    private resolve;
    /** Save the user's selection, select `targets` (absolute ticks), run `fn`, restore. */
    private withSelection;
    private settleOptions;
    /**
     * Re-read the whole table. LUNA holds deltas back inside a batch transaction, so call
     * this after one if the lists look behind; deltas that arrive later still apply.
     */
    refresh(): Promise<void>;
    protected release(): void;
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
    /** Add raw MIDI events to this (MIDI) clip in one undo step. */
    addMidi(events: MidiEvent[]): Promise<unknown>;
    /** Add a note: note-on at `tick`, note-off at `tick + lengthTicks`. */
    addNote(note: number, tick: number, lengthTicks: number, velocity?: number, channel?: number): Promise<unknown>;
    bringToFront(): Promise<unknown>;
    sendToBack(): Promise<unknown>;
    protected release(): void;
}

/** One note for {@link Playlist.createNotes}. Ticks are absolute, as LUNA's verb takes them. */
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
    private readonly sessionUid;
    private readonly batching;
    private contextView;
    /** The session's `main` edit context, which `create_note` both reads and overwrites. */
    private get context();
    /**
     * Write notes onto this lane, making the MIDI clip to hold them if there is none there
     * (LUNA's `create_note`). One undo entry for the whole batch. Ticks are absolute.
     *
     * LUNA answers `null` and instead *selects* what it created, so the new row ids are read
     * back out of the selection — which means this cannot run inside a `transaction()` batch,
     * where LUNA holds selection writes until the commit. The user's selection is restored
     * afterwards.
     *
     * @example
     * const bar = session.musical.timeline.tickAt({ bar: 1 });
     * const { clip, notes } = await lane.createNotes(
     *   [60, 64, 67].map((pitch, i) => ({ pitch, startTick: bar + i * Luna.TICKS_PER_BEAT, stopTick: bar + (i + 1) * Luna.TICKS_PER_BEAT })),
     * );
     */
    createNotes(notes: readonly NewNote[]): Promise<{
        clip: Clip;
        notes: Note[];
    }>;
    protected release(): void;
}

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
}
declare class Devices extends Collection<Device> {
}
/** `/preferences`: engine preferences as writable properties by name. */
declare class Preferences extends Node {
    readonly ioBufferSize: Prop<number>;
    readonly playFromStopLocation: Prop<boolean>;
    readonly recordMute: Prop<boolean>;
    readonly metronomeSound: Prop<string>;
    readonly metronomeSounds: Prop<string[]>;
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
 * `percentComplete` is 0..100. Terminal jobs are published and then removed, so latch the last
 * snapshot if you need it. Only `cancel()` exists; there is no delete.
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
    cancel(): Promise<unknown>;
}
declare class Jobs extends Collection<Job> {
}

type TrackType = 'audio' | 'instrument' | 'midi_matrix' | 'bus' | 'click' | 'count_in' | 'multi_output' | 'video';
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
    /** Track solo (a track-level control, unlike mute which is on the main output). */
    get solo(): Control;
    /** Set the automation mode (`off | read | write | touch | latch`). */
    setAutomationMode(mode: AutomationModeName): Promise<unknown>;
    /** Delete this track. */
    delete(): Promise<void>;
    /** Duplicate this track. Resolves to the reply, which names the new channel. */
    duplicate(options?: {
        includeContent?: boolean;
    }): Promise<unknown>;
}

interface TransportLocation extends Location {
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
    readonly countingIn: Prop<boolean>;
    readonly punchedIn: Prop<boolean>;
    readonly maxTick: Prop<number>;
    readonly tempoPercent: Prop<number>;
    readonly recPlayMode: Prop<RecPlayMode>;
    readonly countInEnabled: WritableProp<boolean>;
    readonly preRollEnabled: WritableProp<boolean>;
    readonly postRollEnabled: WritableProp<boolean>;
    /** Current playhead in ticks: the live location while playing, else the play start. */
    get tick(): number;
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

type SoloMode = string;
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
    name?: string;
    trackType?: Extract<TrackType, 'audio' | 'instrument' | 'midi_matrix' | 'video'>;
    stemFormat?: 'mono' | 'stereo' | string;
    count?: number;
    makeNameUnique?: boolean;
    folderUid?: string;
}
interface TransactionOptions {
    /** Only the last command is recorded in the undo queue; notifications still fire per command. */
    continuous?: boolean;
}
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
    readonly soloMode: Prop<SoloMode>;
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
    /** Edit contexts (`main`, `editor`, `alt_<n>`). */
    readonly contexts: Collection<Context>;
    /** The `main` edit context: selection, zoom and the context edit commands. */
    readonly context: Context;
    private sourcesCollection;
    private sourcesRelease;
    private batchDepth;
    private watchRelease;
    private readyPromise;
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
    /** The active playlist of a track, once playlists are loaded. */
    playlistFor(track: Track): Playlist | undefined;
    /** The master bus, once buses are loaded. */
    get master(): Bus | undefined;
    /** Tracks sorted by their `order` key. */
    get tracksInOrder(): Track[];
    /**
     * Tracks a user sees: `tracksInOrder` without LUNA's system `click` and `count_in` tracks
     * (fact 28).
     */
    get visibleTracks(): Track[];
    /** Create a track. Resolves to the engine reply. */
    newTrack(options?: NewTrackOptions): Promise<unknown>;
    undo(count?: number): Promise<unknown>;
    redo(count?: number): Promise<unknown>;
    /** Save (commit) the session. */
    save(options?: {
        label?: string;
        comments?: string;
    }): Promise<unknown>;
    /**
     * Run `fn` as one undoable step. Aborts (discarding pending changes) if `fn` throws.
     * Called while a batch is already open, `fn` runs inside that batch: wrappers that batch
     * their own steps (`Output.retarget`) then join the caller's undo entry instead of nesting.
     *
     * @example
     * await session.transaction('Rename all', async () => {
     *   for (const t of session.tracks.items) await t.name.set(`${t.name.value} (mix)`);
     * });
     */
    transaction<T>(name: string, fn: () => Promise<T>, options?: TransactionOptions): Promise<T>;
    /**
     * True while a {@link transaction} batch is open. LUNA holds selection writes and MIDI
     * deltas until the commit, so the selection-based verbs refuse to run inside one.
     */
    get batching(): boolean;
    /**
     * Insert a clip from a source file onto a track's active playlist. Timeline position is in
     * ticks; source offsets are nanoseconds (fact 16).
     */
    insertClip(options: {
        trackUid?: string;
        playlistUid?: string;
        sourceUid: string;
        startTick: number;
        stopTick: number;
        sourceStartNs?: number;
        sourceStopNs?: number;
        name?: string;
        clipType?: 'audio' | 'video' | 'midi';
    }): Promise<unknown>;
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
     */
    moveClips(toTick: number, options?: {
        startTick?: number;
        stopTick?: number;
        trackUids?: string[];
        copy?: boolean;
        contextType?: string;
    }): Promise<unknown>;
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
     * The bytes go up base64-encoded in `chunkBytes` pieces through the engine's
     * `begin`/`transfer`/`end` phases, with `onProgress` after each chunk. A failed transfer
     * is cancelled, so a half-written file is not left behind. No clip is made: pass the
     * returned source's `id` to {@link insertClip} for that. Use {@link importFile} instead
     * when LUNA can already read the path itself.
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
    /** Import an audio, MIDI or video file at the selection start, onto `trackUid` or a new track. */
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

interface CreateSessionOptions {
    name: string;
    /** Folder to create the session package in; the engine default when omitted. */
    directoryPath?: string;
    /** How long to wait for `loaded`. Default 15 000 ms. */
    timeoutMs?: number;
}
declare class Sessions extends Node {
    /** Open sessions. */
    readonly items: Collection<Session>;
    /** Uid of the focused session, writable. */
    readonly focusedUid: WritableProp<string>;
    /** The focused Session object, when it is among the open ones. */
    readonly focused: Prop<Session | undefined>;
    private readyPromise;
    /** Subscribe to `/sessions` and load the list. Idempotent. */
    ready(): Promise<void>;
    /** The focused session or, failing that, the first open one. Not yet `ready()`. */
    current(): Session | undefined;
    /** Create a new session, load it and wait until the engine reports it loaded. */
    create(options: CreateSessionOptions): Promise<Session>;
    /** Open an existing session package by its uid (see `/workspace/sessions`). */
    open(sessionPackageUid: string, timeoutMs?: number): Promise<Session>;
    /** Close a session by uid. */
    close(uid: string): Promise<unknown>;
    /** `load_session` then wait for `/sessions/<uid>/loaded` to become true (fact 15). */
    loadSession(uid: string, timeoutMs?: number): Promise<Session>;
}

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
    get manufacturer(): string | undefined;
    get categories(): string[];
}
declare class Plugins extends Collection<Plugin> {
    /** Case-insensitive match on name, short names, manufacturer or id. */
    find(query: string): Plugin[];
    byCategory(category: string): Plugin[];
    /** All categories in the catalog, sorted. */
    get categories(): string[];
    /** Ask the engine to rescan installed plugins. */
    rescan(): Promise<unknown>;
}

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
    sessionPackageUid?: string;
    factory?: boolean;
    favorite?: boolean;
    tags?: string[];
    /** Match any tag rather than all. */
    anyTag?: boolean;
    search?: string;
    orderBy?: 'created' | 'last_opened' | 'modified' | 'name' | string;
    orderAs?: 'asc' | 'desc';
    lastOpenedMin?: number;
    limit?: number;
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
    /** Display name without the `.luna` extension. */
    get name(): string;
}
declare class Workspace extends Node {
    /** All packages. Large; prefer {@link query} or {@link recent} unless you need live updates. */
    readonly packages: Collection<SessionPackage>;
    /** Query the workspace database. Columnar on the wire; rows here. */
    query(options?: QueryOptions): Promise<SessionPackageRow[]>;
    /** Most recently opened packages, newest first. */
    recent(limit?: number): Promise<SessionPackageRow[]>;
    /** Full-text search over session metadata. */
    search(text: string): Promise<unknown>;
    protected release(): void;
}

type GuiPage = 'mixer' | 'timeline' | 'home' | 'addon' | 'dashboard' | 'lunaplay' | string;
type AddOnTarget = 'window' | 'app' | 'browser';
declare class AddOn extends Node {
    readonly addOnId: Prop<string>;
    readonly title: Prop<string>;
    readonly target: Prop<AddOnTarget>;
    /** Absolute file path of the icon, or `''`. */
    readonly icon: Prop<string>;
    show(): Promise<unknown>;
}
declare class GuiWindow extends Node {
    /** Current page; writable for `mixer | timeline | home | addon | dashboard`. */
    readonly page: WritableProp<GuiPage>;
}
interface ProgressTask {
    progress(percent: number): Promise<void>;
    done(): Promise<void>;
}
declare class Gui extends Node {
    /** Installed Add Ons, by manifest id. */
    readonly addOns: Collection<AddOn>;
    /** Windows by context type; `main` is the arrangement window. */
    readonly windows: Collection<GuiWindow>;
    /** Record-arm mode of LUNA's transport bar. */
    readonly armMode: WritableProp<boolean>;
    readonly priorLaunchCount: Prop<number>;
    /** The main window. */
    get main(): GuiWindow;
    /** Switch the main window (or another context's window) to a page. */
    setPage(page: GuiPage, contextType?: string): Promise<unknown>;
    openUrl(url: string): Promise<unknown>;
    /** Reveal a file or folder in Finder / Explorer. */
    revealPath(path: string): Promise<unknown>;
    openSettings(): Promise<unknown>;
    openPluginManager(): Promise<unknown>;
    showFeedback(): Promise<unknown>;
    showSessionInFinder(sessionPackageUid?: string): Promise<unknown>;
    showAddOn(id: string): Promise<unknown>;
    /** Run a LUNA rack command by id with extra fields as its data. Escape hatch. */
    execute(command: string, data?: Record<string, unknown>): Promise<unknown>;
    /**
     * Native open-file dialog. Resolves to the chosen absolute paths, or `[]` if cancelled.
     * `filters` are wildcards such as `['*.wav', '*.aif;*.aiff']`.
     */
    chooseFiles(options?: {
        title?: string;
        filters?: string[];
        allowMultiple?: boolean;
        defaultPath?: string;
        timeoutMs?: number;
    }): Promise<string[]>;
    /** Native save dialog. Resolves to the chosen path, or `undefined` if cancelled. */
    chooseSavePath(options?: {
        defaultPath?: string;
        extensions?: string[];
        timeoutMs?: number;
    }): Promise<string | undefined>;
    /** Show a progress task in LUNA. Call `progress()` with 0..100, then `done()`. */
    startTask(title: string, options?: {
        nativeProgressBar?: boolean;
    }): Promise<ProgressTask>;
    private dialog;
}

/**
 * What {@link connect} returns: one engine connection with its Store and (from Phase 2) the
 * domain objects. `raw` is the only escape hatch to paths; prefer a typed member when one exists.
 */

type Engine = 'luna' | 'wasm' | 'mock';
declare class Client {
    /** The transport. Escape hatch: `luna.raw.get('/sessions')`. */
    readonly raw: Port;
    /** The path-keyed mirror the domain objects read from. */
    readonly store: Store;
    /** Which engine this client is talking to. */
    readonly engine: Engine;
    /** Connection status as a {@link Prop}. */
    readonly status: Prop<PortStatus>;
    /** Open sessions and the commands that create or open them. */
    readonly sessions: Sessions;
    /** The plugin catalog (`/plugins`). Call `load()` once before reading. */
    readonly plugins: Plugins;
    /** Session packages on disk and the workspace query. */
    readonly workspace: Workspace;
    readonly drivers: Drivers;
    readonly devices: Devices;
    readonly preferences: Preferences;
    readonly renders: Renders;
    readonly jobs: Jobs;
    /** LUNA's host surface (dialogs, pages, Add Ons). Only present inside LUNA. */
    readonly gui: Gui;
    private readonly statusCell;
    private readonly statusUnsub;
    /**
     * The focused session (or the first open one), subscribed and loaded.
     *
     * @example
     * const session = await luna.session();
     * console.log(session.name.value, session.tracks.items.length);
     */
    session(): Promise<Session>;
    /**
     * The device inputs a track can record from (`/devices/<device>/inputs`, fact 76). Assign
     * one with `track.inputNodeUid.set(input.uid)`, or pass it to `session.record()`.
     *
     * Read on each call and not cached: devices come and go, and `inUse` changes as tracks are
     * armed.
     *
     * @example
     * const inputs = await luna.audioInputs();
     * for (const i of inputs) console.log(i.name, i.stemFormat, i.inUse ? '(in use)' : '');
     * await track.inputNodeUid.set(inputs[0]!.uid);
     */
    audioInputs(): Promise<AudioInput[]>;
    get connected(): boolean;
    /** The in-page wasm engine (audio, persistence, health) when `engine === 'wasm'`. */
    get wasm(): WasmEngine | undefined;
    /** Resolves after the next batch of change notifications has been delivered. Handy in tests. */
    settled(): Promise<void>;
    /** Disconnect and release everything. */
    close(): Promise<void>;
}

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
    /** Writable property view; `set` is optimistic with rollback, and refuses once disposed. */
    protected writableProp<T>(name: string): WritableProp<T>;
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
 * LUNA's standard keyboard shortcuts for an Add On: the fallback for keys the Add On's own GUI
 * does not handle.
 *
 * An Add On page has the keyboard focus while it is in front, so without this LUNA's own
 * shortcuts (Space to play, Cmd+Z to undo) stop working the moment the user clicks into it.
 * {@link bindShortcuts} restores them: it listens on the window, and a key the page has not
 * already claimed (`event.defaultPrevented`) and that is not typed into a text field runs the
 * matching command on the focused session. Bindings follow LUNA's default map (fact 79) and
 * each command does what LUNA's does (fact 80).
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
type ShortcutCommand = 'undo' | 'redo' | 'togglePlayback' | 'toggleRecord';
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
    /** Remove the listeners. */
    dispose(): void;
}
/**
 * Give an Add On LUNA's standard shortcuts for undo, redo, play and record, as a fallback
 * behind its own key handling.
 *
 * Listens for `keydown` in the bubble phase on `options.target` (default the window), so
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
/**
 * Which audio a clip plays, or `undefined` when there is nothing safe to draw: no source, or
 * a render LUNA has named but not yet announced. In that second case draw the clip's outline
 * rather than the unstretched original at the wrong scale.
 *
 * @example
 * const audio = Luna.clipAudio(clip, session.sources!);
 */
declare function clipAudio(clip: ClipLike | Clip, sources: SourceLookup): ClipAudio | undefined;
/**
 * The file offset (ns) that plays at a timeline tick inside a clip: the clip's audio start
 * plus the tempo-map seconds between the clip start and the tick. Linear in seconds, not in
 * ticks, so a tempo change inside the clip bends the mapping exactly as the engine does.
 *
 * The result can lie outside `[audio.startNs, audio.stopNs)` for ticks outside the clip;
 * clamp before drawing there.
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
 * Reduce a {@link WaveformRange} to one min/max per drawn column, per channel: each column
 * holds the loudest of every pair it covers, so peaks survive zooming out, and at least the
 * pair under its left edge, so zooming in repeats pairs rather than leaving gaps.
 *
 * `nsAt(i)` is the file offset (ns) at the left edge of column `i`, for `i` in `0..width`,
 * and must not decrease; column `i` covers `[nsAt(i), nsAt(i + 1))`. For a timeline that is
 * {@link audioNsAtTick} of the tick at that edge, so a tempo change bends the mapping as the
 * engine does. Columns outside the range are `NaN`.
 *
 * Draw each channel in its own lane ({@link waveformLanes}); folding a stereo range into one
 * shape makes it look mono.
 *
 * @example
 * const cols = Luna.waveformColumns(range, width, (i) => Luna.audioNsAtTick(timeline, clip, audio, tickAtPx(x0 + i)));
 * const lanes = Luna.waveformLanes(cols.channels.length, top, height);
 * cols.channels.forEach((ch, c) => {
 *   for (let i = 0; i < cols.width; i++) {
 *     if (Number.isNaN(ch.max[i])) continue;
 *     const { mid, half } = lanes[c];
 *     ctx.fillRect(x0 + i, mid - ch.max[i] * half, 1, Math.max(1, (ch.max[i] - ch.min[i]) * half));
 *   }
 * });
 */
declare function waveformColumns(range: WaveformRange, width: number, nsAt: (column: number) => number): WaveformColumns;
interface WaveformLane {
    /** The lane's zero line. */
    readonly mid: number;
    /** Pixels from `mid` to full scale; `mid - max * half` is where a pair's maximum lands. */
    readonly half: number;
}
/**
 * Split `height` pixels from `top` into one equal lane per channel, stacked in file order
 * (left above right for stereo), each with a zero line and a full-scale half-height.
 * `gap` pixels are kept clear at the top and bottom of every lane.
 *
 * @example
 * const [left, right] = Luna.waveformLanes(2, 20, 80);   // left.mid 40, right.mid 80
 */
declare function waveformLanes(channels: number, top: number, height: number, gap?: number): readonly WaveformLane[];

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
 * One call to a connected client.
 *
 * Resolution order:
 * 1. `port_` — use this transport as-is (tests, custom transports).
 * 2. `engine: 'wasm'` (or `?engine=wasm` on the page URL) — boot the in-page WebAssembly engine.
 * 3. `url` / `host` / `port` — explicit WebSocket target.
 * 4. `?host=` / `?port=` on the page URL — set by LUNA when it opens an Add On.
 * 5. `ws://localhost:4718` — LUNA's engine on this machine.
 *
 * @example
 * const luna = await Luna.connect();                    // inside LUNA, or LUNA on localhost
 * const luna = await Luna.connect({ engine: 'wasm' });  // plain web page, wasm engine
 * const luna = await Luna.connect({ port_: engine.port() }); // tests
 */

interface ConnectOptions {
    /** Which engine to reach. Default: infer from the other options and the page URL. */
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
    /** Directory URL of `devicedwasm.js`/`.wasm` for `engine: 'wasm'`. Default `/__engine/` (the `ua-builder serve` mount). */
    engineUrl?: string;
    /** Extra wasm boot options (persistence, logging, timeout). */
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
    /** `?engine=wasm` asks for the in-page engine. */
    engine?: 'wasm' | 'luna';
    /** `?engine_url=/path/` overrides where the wasm engine is loaded from. */
    engineUrl?: string;
}
/** `host` and `port` from the page URL, if present. */
declare function locationOptions(): LocationOptions;
/** True when the page was opened by LUNA (a `?port=` is on the URL). */
declare function isEmbeddedInLuna(): boolean;
/** True when the page is talking to LUNA's own engine on its default port. */
declare function isLunaEnginePort(port: number | undefined): boolean;
/** True when LUNA's native webview bridge is present. */
declare function hasNativeBridge(): boolean;

/**
 * The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/ua-builder-sdk'`
 * or, from a script tag, `globalThis.Luna`.
 */

/** SDK version, kept in sync with package.json by the build. */
declare const VERSION = "0.1.0-alpha.0";

declare const luna_AUTOMATION_MODES: typeof AUTOMATION_MODES;
type luna_AddOn = AddOn;
declare const luna_AddOn: typeof AddOn;
type luna_AddOnTarget = AddOnTarget;
type luna_AudioDeviceInfo = AudioDeviceInfo;
type luna_AudioHealth = AudioHealth;
type luna_AudioInput = AudioInput;
type luna_AudioSource = AudioSource;
declare const luna_AudioSource: typeof AudioSource;
type luna_Automation = Automation;
declare const luna_Automation: typeof Automation;
type luna_AutomationMode = AutomationMode;
type luna_AutomationModeName = AutomationModeName;
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
declare const luna_CUE_COUNT: typeof CUE_COUNT;
type luna_Cell<T> = Cell<T>;
declare const luna_Cell: typeof Cell;
type luna_Channel = Channel;
declare const luna_Channel: typeof Channel;
type luna_Client = Client;
declare const luna_Client: typeof Client;
type luna_Clip = Clip;
declare const luna_Clip: typeof Clip;
type luna_ClipAudio = ClipAudio;
type luna_ClipLike = ClipLike;
type luna_ClipSnapshot = ClipSnapshot;
type luna_ClipType = ClipType;
type luna_Collection<T extends Node> = Collection<T>;
declare const luna_Collection: typeof Collection;
declare const luna_CommandHandler: typeof CommandHandler;
type luna_ConnectOptions = ConnectOptions;
declare const luna_ConnectionLost: typeof ConnectionLost;
type luna_Context = Context;
declare const luna_Context: typeof Context;
type luna_ContextType = ContextType;
type luna_Control = Control;
declare const luna_Control: typeof Control;
type luna_ControlBinding = ControlBinding;
type luna_ControlType = ControlType;
type luna_Controls = Controls;
declare const luna_Controls: typeof Controls;
type luna_CreateSessionOptions = CreateSessionOptions;
declare const luna_DEFAULT_LUNA_PORT: typeof DEFAULT_LUNA_PORT;
declare const luna_DEFAULT_SHORTCUTS: typeof DEFAULT_SHORTCUTS;
declare const luna_DISPLAY_TICKS_PER_BEAT: typeof DISPLAY_TICKS_PER_BEAT;
type luna_Destination = Destination;
type luna_Device = Device;
declare const luna_Device: typeof Device;
type luna_Devices = Devices;
declare const luna_Devices: typeof Devices;
declare const luna_Disposed: typeof Disposed;
type luna_DragOptions = DragOptions;
type luna_Drivers = Drivers;
declare const luna_Drivers: typeof Drivers;
declare const luna_EDIT_TIMEOUT_MS: typeof EDIT_TIMEOUT_MS;
declare const luna_EIGHTH_NOTE: typeof EIGHTH_NOTE;
type luna_Effect = Effect;
declare const luna_Effect: typeof Effect;
type luna_Engine = Engine;
declare const luna_EventHandler: typeof EventHandler;
type luna_ExportOptions = ExportOptions;
declare const luna_FloatLiteral: typeof FloatLiteral;
type luna_FolderMode = FolderMode;
type luna_Gesture = Gesture;
type luna_GestureOptions = GestureOptions;
declare const luna_GetOptions: typeof GetOptions;
type luna_Gui = Gui;
declare const luna_Gui: typeof Gui;
type luna_GuiPage = GuiPage;
type luna_GuiWindow = GuiWindow;
declare const luna_GuiWindow: typeof GuiWindow;
declare const luna_HALF_NOTE: typeof HALF_NOTE;
type luna_InsertSlot = InsertSlot;
type luna_Job = Job;
declare const luna_Job: typeof Job;
type luna_Jobs = Jobs;
declare const luna_Jobs: typeof Jobs;
type luna_KeyCombo = KeyCombo;
type luna_KeySignature = KeySignature;
declare const luna_KeySignature: typeof KeySignature;
type luna_List<T> = List<T>;
type luna_Location = Location;
type luna_LocationOptions = LocationOptions;
declare const luna_LogFn: typeof LogFn;
declare const luna_LogLevel: typeof LogLevel;
type luna_Marker = Marker;
declare const luna_Marker: typeof Marker;
type luna_Markers = Markers;
declare const luna_Markers: typeof Markers;
type luna_Meter = Meter;
declare const luna_Meter: typeof Meter;
type luna_MidiClip = MidiClip;
declare const luna_MidiClip: typeof MidiClip;
type luna_MidiEvent = MidiEvent;
type luna_MidiHost = MidiHost;
type luna_MidiRow = MidiRow;
type luna_MidiRowData = MidiRowData;
declare const luna_MockEngine: typeof MockEngine;
declare const luna_MockMidiRow: typeof MockMidiRow;
declare const luna_MockNodeSpec: typeof MockNodeSpec;
declare const luna_MockPort: typeof MockPort;
type luna_ModuleFactory = ModuleFactory;
type luna_Musical = Musical;
declare const luna_Musical: typeof Musical;
type luna_NewNote = NewNote;
type luna_NewTrackOptions = NewTrackOptions;
declare const luna_NoSessionOpen: typeof NoSessionOpen;
type luna_Node = Node;
declare const luna_Node: typeof Node;
declare const luna_NotRunning: typeof NotRunning;
type luna_Note = Note;
declare const luna_OVERVIEW_PAIR_NS: typeof OVERVIEW_PAIR_NS;
declare const luna_Operation: typeof Operation;
type luna_Output = Output;
declare const luna_Output: typeof Output;
type luna_OutputAssignment = OutputAssignment;
type luna_Overview = Overview;
type luna_OverviewInfo = OverviewInfo;
type luna_OverviewKind = OverviewKind;
type luna_OverviewOptions = OverviewOptions;
declare const luna_PLUGIN_ERROR_MISSING: typeof PLUGIN_ERROR_MISSING;
type luna_PairRange = PairRange;
type luna_Playlist = Playlist;
declare const luna_Playlist: typeof Playlist;
type luna_Plugin = Plugin;
declare const luna_Plugin: typeof Plugin;
type luna_PluginManifest = PluginManifest;
type luna_Plugins = Plugins;
declare const luna_Plugins: typeof Plugins;
declare const luna_Port: typeof Port;
declare const luna_PortStatus: typeof PortStatus;
type luna_Preferences = Preferences;
declare const luna_Preferences: typeof Preferences;
type luna_ProgressTask = ProgressTask;
type luna_Prop<T> = Prop<T>;
declare const luna_QUARTER_NOTE: typeof QUARTER_NOTE;
type luna_QueryOptions = QueryOptions;
declare const luna_RECORD_LOOP_MARGIN_TICKS: typeof RECORD_LOOP_MARGIN_TICKS;
type luna_RangeOptions = RangeOptions;
type luna_RecPlayMode = RecPlayMode;
type luna_RecordOptions = RecordOptions;
type luna_Releasable = Releasable;
type luna_Render = Render;
declare const luna_Render: typeof Render;
type luna_Renders = Renders;
declare const luna_Renders: typeof Renders;
declare const luna_RequestTimeout: typeof RequestTimeout;
declare const luna_SEND_COUNT: typeof SEND_COUNT;
declare const luna_SIXTEENTH_NOTE: typeof SIXTEENTH_NOTE;
type luna_Scheduler = Scheduler;
declare const luna_Scheduler: typeof Scheduler;
type luna_SeekOptions = SeekOptions;
type luna_SeekTarget = SeekTarget;
type luna_SelectedNotes = SelectedNotes;
type luna_SelectionSnapshot = SelectionSnapshot;
type luna_Session = Session;
declare const luna_Session: typeof Session;
type luna_SessionPackage = SessionPackage;
declare const luna_SessionPackage: typeof SessionPackage;
type luna_SessionPackageRow = SessionPackageRow;
type luna_Sessions = Sessions;
declare const luna_Sessions: typeof Sessions;
type luna_SettleOptions = SettleOptions;
type luna_ShortcutBindings = ShortcutBindings;
type luna_ShortcutCommand = ShortcutCommand;
type luna_ShortcutKeyEvent = ShortcutKeyEvent;
type luna_ShortcutPlatform = ShortcutPlatform;
type luna_Shortcuts = Shortcuts;
declare const luna_Shortcuts: typeof Shortcuts;
type luna_ShortcutsBinding = ShortcutsBinding;
type luna_ShortcutsOptions = ShortcutsOptions;
declare const luna_SocketConstructor: typeof SocketConstructor;
declare const luna_SocketLike: typeof SocketLike;
type luna_SoloMode = SoloMode;
type luna_SourceLookup = SourceLookup;
declare const luna_StatusListener: typeof StatusListener;
type luna_StemFormat = StemFormat;
type luna_Store = Store;
declare const luna_Store: typeof Store;
declare const luna_SubscribeOptions: typeof SubscribeOptions;
declare const luna_TICKS_PER_BEAT: typeof TICKS_PER_BEAT;
declare const luna_TICKS_PER_DISPLAY_TICK: typeof TICKS_PER_DISPLAY_TICK;
type luna_TempoEvent = TempoEvent;
declare const luna_TempoEvent: typeof TempoEvent;
type luna_TimeSignature = TimeSignature;
declare const luna_TimeSignature: typeof TimeSignature;
type luna_Timeline = Timeline;
declare const luna_Timeline: typeof Timeline;
type luna_Track = Track;
declare const luna_Track: typeof Track;
type luna_TrackType = TrackType;
type luna_TransactionOptions = TransactionOptions;
type luna_Transport = Transport;
declare const luna_Transport: typeof Transport;
type luna_TransportLocation = TransportLocation;
declare const luna_Unsubscribe: typeof Unsubscribe;
declare const luna_Unsupported: typeof Unsupported;
type luna_UploadOptions = UploadOptions;
declare const luna_VERSION: typeof VERSION;
declare const luna_Verb: typeof Verb;
declare const luna_WAVEFORM_PAGE: typeof WAVEFORM_PAGE;
declare const luna_WHOLE_NOTE: typeof WHOLE_NOTE;
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
type luna_WaveformRange = WaveformRange;
type luna_Waveforms = Waveforms;
declare const luna_Waveforms: typeof Waveforms;
declare const luna_WebSocketPort: typeof WebSocketPort;
declare const luna_WebSocketPortOptions: typeof WebSocketPortOptions;
declare const luna_WireMessage: typeof WireMessage;
type luna_Workspace = Workspace;
declare const luna_Workspace: typeof Workspace;
type luna_WritableProp<T> = WritableProp<T>;
declare const luna_audioNsAtTick: typeof audioNsAtTick;
declare const luna_automationModeOrdinal: typeof automationModeOrdinal;
declare const luna_beatsToTicks: typeof beatsToTicks;
declare const luna_bindDrag: typeof bindDrag;
declare const luna_bindGesture: typeof bindGesture;
declare const luna_bindRange: typeof bindRange;
declare const luna_bindShortcuts: typeof bindShortcuts;
declare const luna_bootWasmEngine: typeof bootWasmEngine;
declare const luna_clipAudio: typeof clipAudio;
declare const luna_clipTypeFrom: typeof clipTypeFrom;
declare const luna_connect: typeof connect;
declare const luna_consoleLog: typeof consoleLog;
declare const luna_decodeMessage: typeof decodeMessage;
declare const luna_decodeMidiData: typeof decodeMidiData;
declare const luna_derived: typeof derived;
declare const luna_encodeMidiData: typeof encodeMidiData;
declare const luna_encodePayload: typeof encodePayload;
declare const luna_encodeRequest: typeof encodeRequest;
declare const luna_eventMatches: typeof eventMatches;
declare const luna_expandMulti: typeof expandMulti;
declare const luna_float: typeof float;
declare const luna_formatBarBeat: typeof formatBarBeat;
declare const luna_getOptionsToParams: typeof getOptionsToParams;
declare const luna_hasNativeBridge: typeof hasNativeBridge;
declare const luna_isEmbeddedInLuna: typeof isEmbeddedInLuna;
declare const luna_isLunaEnginePort: typeof isLunaEnginePort;
declare const luna_joinPath: typeof joinPath;
declare const luna_kindForScale: typeof kindForScale;
declare const luna_listOf: typeof listOf;
declare const luna_locationOptions: typeof locationOptions;
declare const luna_midiByte: typeof midiByte;
declare const luna_pairNotes: typeof pairNotes;
declare const luna_pairNs: typeof pairNs;
declare const luna_pairRange: typeof pairRange;
declare const luna_propertyValue: typeof propertyValue;
declare const luna_requireTick: typeof requireTick;
declare const luna_secondsToTicks: typeof secondsToTicks;
declare const luna_selectedNotes: typeof selectedNotes;
declare const luna_settle: typeof settle;
declare const luna_shallowEquals: typeof shallowEquals;
declare const luna_splitPath: typeof splitPath;
declare const luna_stripValueSuffix: typeof stripValueSuffix;
declare const luna_ticksToBeats: typeof ticksToBeats;
declare const luna_ticksToSeconds: typeof ticksToSeconds;
declare const luna_toEvent: typeof toEvent;
declare const luna_wasmUpdateToEvent: typeof wasmUpdateToEvent;
declare const luna_waveformColumns: typeof waveformColumns;
declare const luna_waveformLanes: typeof waveformLanes;
declare const luna_writable: typeof writable;
declare const luna_yieldTask: typeof yieldTask;
declare namespace luna {
  export { luna_AUTOMATION_MODES as AUTOMATION_MODES, luna_AddOn as AddOn, type luna_AddOnTarget as AddOnTarget, type luna_AudioDeviceInfo as AudioDeviceInfo, type luna_AudioHealth as AudioHealth, type luna_AudioInput as AudioInput, luna_AudioSource as AudioSource, luna_Automation as Automation, type luna_AutomationMode as AutomationMode, type luna_AutomationModeName as AutomationModeName, type luna_BarBeat as BarBeat, luna_Bindings as Bindings, type luna_BootOptions as BootOptions, type luna_BounceOptions as BounceOptions, type luna_Breakpoint as Breakpoint, luna_BreakpointNode as BreakpointNode, luna_Bus as Bus, type luna_BusType as BusType, luna_COARSE_PAIRS_PER_FINE as COARSE_PAIRS_PER_FINE, luna_COARSE_PAIR_NS as COARSE_PAIR_NS, luna_CUE_COUNT as CUE_COUNT, luna_Cell as Cell, luna_Channel as Channel, luna_Client as Client, luna_Clip as Clip, type luna_ClipAudio as ClipAudio, type luna_ClipLike as ClipLike, type luna_ClipSnapshot as ClipSnapshot, type luna_ClipType as ClipType, luna_Collection as Collection, luna_CommandHandler as CommandHandler, type luna_ConnectOptions as ConnectOptions, luna_ConnectionLost as ConnectionLost, luna_Context as Context, type luna_ContextType as ContextType, luna_Control as Control, type luna_ControlBinding as ControlBinding, type luna_ControlType as ControlType, luna_Controls as Controls, type luna_CreateSessionOptions as CreateSessionOptions, luna_DEFAULT_LUNA_PORT as DEFAULT_LUNA_PORT, luna_DEFAULT_SHORTCUTS as DEFAULT_SHORTCUTS, luna_DISPLAY_TICKS_PER_BEAT as DISPLAY_TICKS_PER_BEAT, type luna_Destination as Destination, luna_Device as Device, luna_Devices as Devices, luna_Disposed as Disposed, type luna_DragOptions as DragOptions, luna_Drivers as Drivers, luna_EDIT_TIMEOUT_MS as EDIT_TIMEOUT_MS, luna_EIGHTH_NOTE as EIGHTH_NOTE, luna_Effect as Effect, type luna_Engine as Engine, UAError as Error, Event$1 as Event, luna_EventHandler as EventHandler, type luna_ExportOptions as ExportOptions, luna_FloatLiteral as FloatLiteral, type luna_FolderMode as FolderMode, type luna_Gesture as Gesture, type luna_GestureOptions as GestureOptions, luna_GetOptions as GetOptions, luna_Gui as Gui, type luna_GuiPage as GuiPage, luna_GuiWindow as GuiWindow, luna_HALF_NOTE as HALF_NOTE, type luna_InsertSlot as InsertSlot, luna_Job as Job, luna_Jobs as Jobs, type luna_KeyCombo as KeyCombo, luna_KeySignature as KeySignature, type luna_List as List, type luna_Location as Location, type luna_LocationOptions as LocationOptions, luna_LogFn as LogFn, luna_LogLevel as LogLevel, luna_Marker as Marker, luna_Markers as Markers, luna_Meter as Meter, luna_MidiClip as MidiClip, type luna_MidiEvent as MidiEvent, type luna_MidiHost as MidiHost, type luna_MidiRow as MidiRow, type luna_MidiRowData as MidiRowData, luna_MockEngine as MockEngine, luna_MockMidiRow as MockMidiRow, luna_MockNodeSpec as MockNodeSpec, luna_MockPort as MockPort, type luna_ModuleFactory as ModuleFactory, luna_Musical as Musical, type luna_NewNote as NewNote, type luna_NewTrackOptions as NewTrackOptions, luna_NoSessionOpen as NoSessionOpen, luna_Node as Node, luna_NotRunning as NotRunning, type luna_Note as Note, luna_OVERVIEW_PAIR_NS as OVERVIEW_PAIR_NS, luna_Operation as Operation, luna_Output as Output, type luna_OutputAssignment as OutputAssignment, type luna_Overview as Overview, type luna_OverviewInfo as OverviewInfo, type luna_OverviewKind as OverviewKind, type luna_OverviewOptions as OverviewOptions, luna_PLUGIN_ERROR_MISSING as PLUGIN_ERROR_MISSING, type luna_PairRange as PairRange, luna_Playlist as Playlist, luna_Plugin as Plugin, type luna_PluginManifest as PluginManifest, luna_Plugins as Plugins, luna_Port as Port, luna_PortStatus as PortStatus, luna_Preferences as Preferences, type luna_ProgressTask as ProgressTask, type luna_Prop as Prop, luna_QUARTER_NOTE as QUARTER_NOTE, type luna_QueryOptions as QueryOptions, luna_RECORD_LOOP_MARGIN_TICKS as RECORD_LOOP_MARGIN_TICKS, type luna_RangeOptions as RangeOptions, type luna_RecPlayMode as RecPlayMode, type luna_RecordOptions as RecordOptions, type luna_Releasable as Releasable, luna_Render as Render, luna_Renders as Renders, luna_RequestTimeout as RequestTimeout, luna_SEND_COUNT as SEND_COUNT, luna_SIXTEENTH_NOTE as SIXTEENTH_NOTE, luna_Scheduler as Scheduler, type luna_SeekOptions as SeekOptions, type luna_SeekTarget as SeekTarget, type luna_SelectedNotes as SelectedNotes, type luna_SelectionSnapshot as SelectionSnapshot, luna_Session as Session, luna_SessionPackage as SessionPackage, type luna_SessionPackageRow as SessionPackageRow, luna_Sessions as Sessions, type luna_SettleOptions as SettleOptions, type luna_ShortcutBindings as ShortcutBindings, type luna_ShortcutCommand as ShortcutCommand, type luna_ShortcutKeyEvent as ShortcutKeyEvent, type luna_ShortcutPlatform as ShortcutPlatform, luna_Shortcuts as Shortcuts, type luna_ShortcutsBinding as ShortcutsBinding, type luna_ShortcutsOptions as ShortcutsOptions, luna_SocketConstructor as SocketConstructor, luna_SocketLike as SocketLike, type luna_SoloMode as SoloMode, type luna_SourceLookup as SourceLookup, luna_StatusListener as StatusListener, type luna_StemFormat as StemFormat, luna_Store as Store, luna_SubscribeOptions as SubscribeOptions, luna_TICKS_PER_BEAT as TICKS_PER_BEAT, luna_TICKS_PER_DISPLAY_TICK as TICKS_PER_DISPLAY_TICK, luna_TempoEvent as TempoEvent, luna_TimeSignature as TimeSignature, luna_Timeline as Timeline, luna_Track as Track, type luna_TrackType as TrackType, type luna_TransactionOptions as TransactionOptions, luna_Transport as Transport, type luna_TransportLocation as TransportLocation, luna_Unsubscribe as Unsubscribe, luna_Unsupported as Unsupported, type luna_UploadOptions as UploadOptions, luna_VERSION as VERSION, luna_Verb as Verb, luna_WAVEFORM_PAGE as WAVEFORM_PAGE, luna_WHOLE_NOTE as WHOLE_NOTE, luna_WasmEngine as WasmEngine, type luna_WasmHooks as WasmHooks, type luna_WasmModule as WasmModule, luna_WasmPort as WasmPort, type luna_WasmPortOptions as WasmPortOptions, type luna_WasmState as WasmState, type luna_WaveformChannel as WaveformChannel, type luna_WaveformColumns as WaveformColumns, type luna_WaveformLane as WaveformLane, type luna_WaveformRange as WaveformRange, luna_Waveforms as Waveforms, luna_WebSocketPort as WebSocketPort, luna_WebSocketPortOptions as WebSocketPortOptions, luna_WireMessage as WireMessage, luna_Workspace as Workspace, type luna_WritableProp as WritableProp, luna_audioNsAtTick as audioNsAtTick, luna_automationModeOrdinal as automationModeOrdinal, luna_beatsToTicks as beatsToTicks, luna_bindDrag as bindDrag, luna_bindGesture as bindGesture, luna_bindRange as bindRange, luna_bindShortcuts as bindShortcuts, luna_bootWasmEngine as bootWasmEngine, luna_clipAudio as clipAudio, luna_clipTypeFrom as clipTypeFrom, luna_connect as connect, luna_consoleLog as consoleLog, luna_decodeMessage as decodeMessage, luna_decodeMidiData as decodeMidiData, luna_derived as derived, luna_encodeMidiData as encodeMidiData, luna_encodePayload as encodePayload, luna_encodeRequest as encodeRequest, luna_eventMatches as eventMatches, luna_expandMulti as expandMulti, luna_float as float, luna_formatBarBeat as formatBarBeat, luna_getOptionsToParams as getOptionsToParams, luna_hasNativeBridge as hasNativeBridge, luna_isEmbeddedInLuna as isEmbeddedInLuna, luna_isLunaEnginePort as isLunaEnginePort, luna_joinPath as joinPath, luna_kindForScale as kindForScale, luna_listOf as listOf, luna_locationOptions as locationOptions, luna_midiByte as midiByte, luna_pairNotes as pairNotes, luna_pairNs as pairNs, luna_pairRange as pairRange, luna_propertyValue as propertyValue, luna_requireTick as requireTick, luna_secondsToTicks as secondsToTicks, luna_selectedNotes as selectedNotes, luna_settle as settle, luna_shallowEquals as shallowEquals, luna_splitPath as splitPath, luna_stripValueSuffix as stripValueSuffix, luna_ticksToBeats as ticksToBeats, luna_ticksToSeconds as ticksToSeconds, luna_toEvent as toEvent, luna_wasmUpdateToEvent as wasmUpdateToEvent, luna_waveformColumns as waveformColumns, luna_waveformLanes as waveformLanes, luna_writable as writable, luna_yieldTask as yieldTask };
}

export { luna as Luna };
