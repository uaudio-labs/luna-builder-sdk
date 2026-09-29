/**
 * Boots the WebAssembly LUNA engine (`devicedwasm`) in the page.
 *
 * The engine is an Emscripten module. Loading `devicedwasm.js` defines `createDevicedModule`;
 * calling it fetches the `.wasm`, starts the engine's main() on a worker (PROXY_TO_PTHREAD)
 * and brings the services up. Progress arrives through `globalThis.WasmDeviced.onState`.
 *
 * Requirements the page must meet (the `ua-builder serve` command does all three):
 * - served over http(s), not file://;
 * - `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`
 *   so SharedArrayBuffer (wasm threads) is available;
 * - `devicedwasm.js` and `.wasm` on the same origin as the page (workers cannot be cross-origin).
 *
 * @example
 * const engine = await Luna.bootWasmEngine({ engineUrl: '/__engine/' });
 * engine.state;               // 'running'
 * await engine.resumeAudio(); // after a user gesture, per browser autoplay policy
 */
import { UAError } from '../wire/errors';

/** Lifecycle states reported by the engine. */
export type WasmState = 'loading' | 'booting' | 'running' | 'stopping' | 'stopped' | 'error';

/** The subset of the Emscripten module the SDK uses. */
export interface WasmModule {
  ccall(name: string, returnType: string | null, argTypes: string[], args: unknown[]): unknown;
  UAPersist?: {
    status(): { mode: string; [k: string]: unknown };
    list?(): Promise<unknown>;
    erase?(): Promise<void>;
  };
}

/** The page-side hooks the engine calls (`globalThis.WasmDeviced`). */
export interface WasmHooks {
  onReply(id: number, error: string, json: string): void;
  onUpdate(path: string, json: string): void;
  onState(state: string, detail: string): void;
}

export type ModuleFactory = (options: Record<string, unknown>) => Promise<WasmModule>;

export interface BootOptions {
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
 */
export class WasmEngine {
  private currentState: WasmState = 'loading';
  private readonly stateListeners = new Set<(state: WasmState, detail: string) => void>();
  private replyHandler: ((id: number, error: string, json: string) => void) | undefined;
  private updateHandler: ((path: string, json: string) => void) | undefined;

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
   * click handler. Resolves true if the context is running afterwards.
   */
  async resumeAudio(): Promise<boolean> {
    const ok = Boolean(this.module.ccall('wasmd_resume_audio_export', 'number', [], []));
    return ok && this.audio().contextState === 1;
  }

  /** Ask for microphone input (getUserMedia). Needs a secure context and a user gesture. */
  requestAudioInput(): boolean {
    return Boolean(this.module.ccall('wasmd_request_audio_input_export', 'number', [], []));
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
    for (const p of pending) engine.setState(p.state as WasmState, p.detail);
    await running;
    if (engine.state !== 'running') engine.setState('running');
    return engine;
  } finally {
    clearTimeout(timer);
  }
}

/** Inject `<script src="<engineUrl>devicedwasm.js">` and return `createDevicedModule`. */
async function loadFactory(engineUrl: string): Promise<ModuleFactory> {
  const g = globalThis as { createDevicedModule?: ModuleFactory; document?: Document };
  if (typeof g.createDevicedModule === 'function') return g.createDevicedModule;
  if (!g.document) throw new UAError('engine_boot', 'the wasm engine needs a browser page');
  await new Promise<void>((resolve, reject) => {
    const script = g.document!.createElement('script');
    script.src = `${engineUrl}devicedwasm.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new UAError('engine_boot', `could not load ${script.src}; is the engine served at ${engineUrl}?`));
    g.document!.head.appendChild(script);
  });
  if (typeof g.createDevicedModule !== 'function') throw new UAError('engine_boot', 'devicedwasm.js loaded but createDevicedModule is missing');
  return g.createDevicedModule;
}

/** @internal Reset the once-per-page boot (tests). */
export function resetWasmBoot(): void {
  booting = undefined;
}
