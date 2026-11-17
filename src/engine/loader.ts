/**
 * Boots the WebAssembly LUNA engine (hbsystem `wasm_engine`) in the page.
 *
 * The engine is an Emscripten module. Loading `luna-engine.js` defines `createLunaEngineModule`;
 * calling it fetches the `.wasm`, starts the engine's main() on a worker (PROXY_TO_PTHREAD)
 * and brings the services up. Progress arrives through `globalThis.WasmDeviced.onState`.
 *
 * Requirements the page must meet (the `ua-builder serve` command does all three):
 * - served over http(s), not file://;
 * - `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`
 *   so SharedArrayBuffer (wasm threads) is available;
 * - `luna-engine.js` and `.wasm` on the same origin as the page (workers cannot be cross-origin).
 *
 * Browsers start the engine's AudioContext suspended and honour a resume only from a user
 * gesture, so the loader resumes audio on the page's clicks and key presses
 * (`resumeOnGesture`). It listens from before the engine starts and replays a gesture made
 * while it was booting, because a page is clickable seconds before the engine runs.
 *
 * @example
 * const engine = await Luna.bootWasmEngine({ engineUrl: '/__engine/' });
 * engine.state;               // 'running'
 * engine.audio().contextState; // 1 once the user has clicked or pressed a key
 */
import { UAError } from '../wire/errors';

/**
 * Lifecycle states reported by the engine.
 *
 * @hidden
 */
export type WasmState = 'loading' | 'booting' | 'running' | 'stopping' | 'stopped' | 'error';

/**
 * The subset of the Emscripten module the SDK uses.
 *
 * @hidden
 */
export interface WasmModule {
  ccall(name: string, returnType: string | null, argTypes: string[], args: unknown[]): unknown;
  UAPersist?: {
    status(): { mode: string; [k: string]: unknown };
    list?(): Promise<unknown>;
    erase?(): Promise<void>;
  };
}

/**
 * The page-side hooks the engine calls (`globalThis.WasmDeviced`).
 *
 * @hidden
 */
export interface WasmHooks {
  onReply(id: number, error: string, json: string): void;
  onUpdate(path: string, json: string): void;
  onState(state: string, detail: string): void;
}

export type ModuleFactory = (options: Record<string, unknown>) => Promise<WasmModule>;

export interface BootOptions {
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
  hooksTarget_?: { WasmDeviced?: WasmHooks };
}

/** Audio-path health as the engine reports it. */
export interface AudioHealth {
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
export class WasmEngine {
  private currentState: WasmState = 'loading';
  private readonly stateListeners = new Set<(state: WasmState, detail: string) => void>();
  private replyHandler: ((id: number, error: string, json: string) => void) | undefined;
  private updateHandler: ((path: string, json: string) => void) | undefined;
  /** `Date.now()` of the last click or key press seen while running. */
  private lastGestureAt = 0;
  /** A microphone was wanted with no gesture to ask inside; the next one asks. */
  private inputWanted = false;
  /** @internal Ask for the microphone when a track or the session is record-armed. */
  audioInputOnRecord = true;

  /** @internal */
  constructor(
    readonly module: WasmModule,
    readonly engineUrl: string,
  ) {}

  get state(): WasmState {
    return this.currentState;
  }

  get isRunning(): boolean {
    return this.currentState === 'running' && Boolean(this.module.ccall('wasmd_is_running_export', 'number', [], []));
  }

  onState(listener: (state: WasmState, detail: string) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /** @internal Route replies and updates to the port. */
  attach(reply: (id: number, error: string, json: string) => void, update: (path: string, json: string) => void): void {
    this.replyHandler = reply;
    this.updateHandler = update;
  }

  /** @internal Send one request; returns the request id or 0 on failure. */
  send(method: number, path: string, bodyJson: string): number {
    return Number(this.module.ccall('wasmd_send_export', 'number', ['number', 'string', 'string'], [method, path, bodyJson]));
  }

  /** @internal The hooks object installed on the page. */
  hooks(): WasmHooks {
    return {
      onReply: (id, error, json) => this.replyHandler?.(id, error, json),
      onUpdate: (path, json) => this.updateHandler?.(path, json),
      onState: (state, detail) => this.setState(state as WasmState, detail),
    };
  }

  /** @internal */
  setState(state: WasmState, detail = ''): void {
    this.currentState = state;
    for (const l of [...this.stateListeners]) l(state, detail);
  }

  /**
   * Resume the AudioContext. Browsers only allow this after a user gesture, so call it from a
   * click handler; the loader already does on every click and key press. Resolves true once
   * the context runs, or false if it is not running within `timeoutMs` (the browser resumes
   * asynchronously, so the state lags the call).
   */
  async resumeAudio(timeoutMs = 1000): Promise<boolean> {
    if (!this.module.ccall('wasmd_resume_audio_export', 'number', [], [])) return false;
    const deadline = Date.now() + timeoutMs;
    while (this.audio().contextState !== 1) {
      if (Date.now() >= deadline) return false;
      await new Promise((r) => setTimeout(r, 20));
    }
    return true;
  }

  /** Ask for microphone input (getUserMedia). Needs a secure context and a user gesture. */
  requestAudioInput(): boolean {
    return Boolean(this.module.ccall('wasmd_request_audio_input_export', 'number', [], []));
  }

  /**
   * @internal A click or key press while running: resume audio, and ask for a microphone that
   * was wanted without a gesture to ask inside.
   */
  noteGesture(): void {
    this.lastGestureAt = Date.now();
    void this.resumeAudio();
    if (this.inputWanted) this.askForInput();
  }

  /**
   * @internal A track or the session was record-armed. Asks for the microphone inside the
   * gesture that armed it when there is one, or else on the next click or key press. Does
   * nothing while asking or connected, and asks again after a denial or a failure.
   */
  wantAudioInput(): void {
    if (!this.audioInputOnRecord) return;
    const state = this.inputState();
    if (state === 1 || state === 2 || state === 4) return;
    if (hasActivation(this.lastGestureAt)) this.askForInput();
    else this.inputWanted = true;
  }

  private askForInput(): void {
    this.inputWanted = false;
    const state = this.inputState();
    if (state === 1 || state === 2 || state === 4) return;
    // The first request is one-shot per audio context; a denied or failed one needs the retry.
    this.module.ccall(state === 3 || state === 5 ? 'wasmd_retry_audio_input_export' : 'wasmd_request_audio_input_export', 'number', [], []);
  }

  private inputState(): number {
    return Number(this.module.ccall('wasmd_audio_input_state_export', 'number', [], []));
  }

  audio(): AudioHealth {
    const n = (name: string) => Number(this.module.ccall(name, 'number', [], []));
    return {
      contextState: n('wasmd_audio_state_export'),
      callbacks: n('wasmd_audio_callbacks_export'),
      underruns: n('wasmd_audio_underruns_export'),
      peak: n('wasmd_audio_peak_export'),
      inputState: n('wasmd_audio_input_state_export'),
      inputPeak: n('wasmd_audio_input_peak_export'),
    };
  }

  /** OPFS persistence status, when the module was built with it. */
  persistStatus(): { mode: string; [k: string]: unknown } | undefined {
    return this.module.UAPersist?.status();
  }

  /** Stop the engine. Terminal: reload the page to boot again. */
  shutdown(): void {
    this.setState('stopping');
    this.module.ccall('wasmd_shutdown_export', null, [], []);
  }
}

let booting: Promise<WasmEngine> | undefined;

/**
 * Load and boot the engine once per page. Resolves when the services report `running`.
 * Rejects with `Luna.Error` code `engine_boot` on failure or timeout.
 */
export function bootWasmEngine(options: BootOptions = {}): Promise<WasmEngine> {
  booting ??= doBoot(options).catch((err) => {
    booting = undefined;
    throw err;
  });
  return booting;
}

async function doBoot(options: BootOptions): Promise<WasmEngine> {
  const engineUrl = (options.engineUrl ?? '/__engine/').replace(/\/?$/, '/');
  const log = options.log ?? ((line, level) => (level === 'err' ? console.warn('[wasm]', line) : console.debug('[wasm]', line)));
  const factory = options.factory_ ?? (await loadFactory(engineUrl));
  const target = options.hooksTarget_ ?? (globalThis as { WasmDeviced?: WasmHooks });

  let engine: WasmEngine | undefined;
  let resolveRunning!: () => void;
  let rejectRunning!: (e: Error) => void;
  const running = new Promise<void>((res, rej) => {
    resolveRunning = res;
    rejectRunning = rej;
  });
  // Hooks must exist before the module is created: state events start on the worker at once.
  const pending: { state: string; detail: string }[] = [];
  target.WasmDeviced = {
    onReply: (id, error, json) => engine?.hooks().onReply(id, error, json),
    onUpdate: (path, json) => engine?.hooks().onUpdate(path, json),
    onState: (state, detail) => {
      if (engine) engine.hooks().onState(state, detail);
      else pending.push({ state, detail });
      if (state === 'running') resolveRunning();
      if (state === 'error' || state === 'stopped') rejectRunning(new UAError('engine_boot', `wasm engine ${state}${detail ? ': ' + detail : ''}`));
    },
  };

  // Armed before the module exists and left armed for the page's lifetime: a resume is a no-op
  // once audio runs, and the context can be suspended again (an iPhone call, a closed lid).
  let sawGesture = false;
  const onGesture = () => {
    sawGesture = true;
    if (engine?.isRunning) engine.noteGesture();
  };
  const gestureTarget = options.resumeOnGesture === false ? undefined : (options.gestureTarget_ ?? (globalThis as { document?: EventTarget }).document);
  for (const type of GESTURE_EVENTS) gestureTarget?.addEventListener(type, onGesture, true);

  const timeoutMs = options.timeoutMs ?? 120_000;
  const timer = setTimeout(() => rejectRunning(new UAError('engine_boot', `wasm engine did not reach running within ${timeoutMs} ms`)), timeoutMs);
  try {
    const module = await factory({
      print: (t: string) => log(t, 'out'),
      printErr: (t: string) => log(t, 'err'),
      onAbort: (what: unknown) => {
        log(`abort: ${String(what)}`, 'err');
        rejectRunning(new UAError('engine_boot', `wasm engine aborted: ${String(what)}`));
      },
      locateFile: (path: string, prefix: string) => `${prefix || engineUrl}${path}${options.strip && path.endsWith('.wasm') ? '?strip=1' : ''}`,
      UAPersistDisabled: options.persist === false,
      UAPersistLog: (t: string) => log(`persist ${t}`, 'out'),
    });
    engine = new WasmEngine(module, engineUrl);
    engine.audioInputOnRecord = options.audioInputOnRecord !== false;
    for (const p of pending) engine.setState(p.state as WasmState, p.detail);
    await running;
    if (engine.state !== 'running') engine.setState('running');
    // Replay a click made while the engine booted. A gesture's activation lasts a few seconds,
    // so this resume is honoured when the boot was quick; otherwise the next click resumes.
    const activated = (globalThis as { navigator?: { userActivation?: { hasBeenActive?: boolean } } }).navigator?.userActivation?.hasBeenActive;
    if (gestureTarget && (sawGesture || activated)) void engine.resumeAudio();
    return engine;
  } catch (err) {
    for (const type of GESTURE_EVENTS) gestureTarget?.removeEventListener(type, onGesture, true);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** The events that carry a user activation, on which audio is resumed. */
const GESTURE_EVENTS = ['pointerdown', 'pointerup', 'keydown'] as const;

/**
 * Whether the page holds a user activation now, so a getUserMedia call is honoured. Browsers
 * keep one for a few seconds after a click; without `navigator.userActivation` (older Safari,
 * tests), a gesture in the last 4 s counts.
 */
function hasActivation(lastGestureAt: number): boolean {
  const active = (globalThis as { navigator?: { userActivation?: { isActive?: boolean } } }).navigator?.userActivation?.isActive;
  return active ?? Date.now() - lastGestureAt < 4000;
}

/** Inject `<script src="<engineUrl>luna-engine.js">` and return `createLunaEngineModule`. */
async function loadFactory(engineUrl: string): Promise<ModuleFactory> {
  const g = globalThis as { createLunaEngineModule?: ModuleFactory; document?: Document };
  if (typeof g.createLunaEngineModule === 'function') return g.createLunaEngineModule;
  if (!g.document) throw new UAError('engine_boot', 'the wasm engine needs a browser page');
  await new Promise<void>((resolve, reject) => {
    const script = g.document!.createElement('script');
    script.src = `${engineUrl}luna-engine.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new UAError('engine_boot', `could not load ${script.src}; is the engine served at ${engineUrl}?`));
    g.document!.head.appendChild(script);
  });
  if (typeof g.createLunaEngineModule !== 'function') throw new UAError('engine_boot', 'luna-engine.js loaded but createLunaEngineModule is missing');
  return g.createLunaEngineModule;
}

/** @internal Reset the once-per-page boot (tests). */
export function resetWasmBoot(): void {
  booting = undefined;
}
