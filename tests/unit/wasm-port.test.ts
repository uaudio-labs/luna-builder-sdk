import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bootWasmEngine, resetWasmBoot, WasmEngine, type WasmHooks, type WasmModule } from '../../src/engine/loader';
import { ConnectionLost, RequestTimeout, UAError } from '../../src/wire/errors';
import type { Event, PortStatus } from '../../src/wire/port';
import { WasmPort, wasmUpdateToEvent } from '../../src/wire/wasm-port';
import { Luna } from '../../src/index';

/** Stands in for the Emscripten module: records ccalls and lets tests answer them. */
class FakeModule implements WasmModule {
  sent: { method: number; path: string; body: string }[] = [];
  nextId = 1;
  running = 1;
  audioState = 1;
  /** The browser resumes asynchronously: the state changes this long after the call. */
  resumeDelayMs = 0;
  /** wasmd_audio_input_state: 0 not requested, 1 prompting, 2 connected, 3 denied, 5 failed. */
  inputState = 0;
  calls: string[] = [];
  hooks!: WasmHooks;
  ccall(name: string, _ret: string | null, _types: string[], args: unknown[]): unknown {
    this.calls.push(name);
    switch (name) {
      case 'wasmd_send_export': {
        if (!this.running) return 0;
        this.sent.push({ method: args[0] as number, path: args[1] as string, body: args[2] as string });
        return this.nextId++;
      }
      case 'wasmd_is_running_export':
        return this.running;
      case 'wasmd_audio_state_export':
        return this.audioState;
      case 'wasmd_resume_audio_export':
        if (this.resumeDelayMs) setTimeout(() => (this.audioState = 1), this.resumeDelayMs);
        else this.audioState = 1;
        return 1;
      case 'wasmd_audio_input_state_export':
        return this.inputState;
      case 'wasmd_request_audio_input_export':
      case 'wasmd_retry_audio_input_export':
        this.inputState = 1;
        return 1;
      case 'wasmd_shutdown_export':
        this.running = 0;
        return undefined;
      default:
        return 0;
    }
  }
  reply(id: number, json: unknown, error = ''): void {
    this.hooks.onReply(id, error, json === undefined ? '' : JSON.stringify(json));
  }
  update(path: string, json: unknown): void {
    this.hooks.onUpdate(path, json === undefined ? '' : JSON.stringify(json));
  }
  lastId(): number {
    return this.nextId - 1;
  }
}

async function booted(): Promise<{ mod: FakeModule; engine: WasmEngine; port: WasmPort }> {
  resetWasmBoot();
  const mod = new FakeModule();
  const target: { WasmDeviced?: WasmHooks } = {};
  const boot = bootWasmEngine({
    hooksTarget_: target,
    factory_: async () => {
      // the engine reports state from its worker as soon as it exists
      queueMicrotask(() => {
        target.WasmDeviced!.onState('booting', '');
        target.WasmDeviced!.onState('running', '');
      });
      return mod;
    },
    log: () => undefined,
  });
  const engine = await boot;
  mod.hooks = target.WasmDeviced!;
  const port = new WasmPort(engine, { requestTimeoutMs: 500 });
  return { mod, engine, port };
}

describe('wasmUpdateToEvent', () => {
  it('normalises property, added, removed and bare announcements (fact 13)', () => {
    expect(wasmUpdateToEvent('/sessions/s/looping/value', 'true')).toEqual({ path: '/sessions/s/looping', data: true });
    expect(wasmUpdateToEvent('/sessions/s/tracks/t1', '{"properties":{"type":"track","uid":"t1"}}')).toEqual({
      path: '/sessions/s/tracks/t1',
      data: { properties: { type: 'track', uid: 't1' } },
      operation: 'added',
    });
    expect(wasmUpdateToEvent('/sessions/s/tracks/t1', 'null')).toEqual({ path: '/sessions/s/tracks/t1', data: undefined, operation: 'removed' });
    expect(wasmUpdateToEvent('/initialized', 'false')).toEqual({ path: '/initialized', data: false });
    expect(wasmUpdateToEvent('network_id', '"abc"')).toEqual({ path: 'network_id', data: 'abc' });
    expect(wasmUpdateToEvent('/x/value', 'not json')).toEqual({ path: '/x', data: 'not json' });
  });
});

describe('bootWasmEngine', () => {
  it('boots once per page and reports running', async () => {
    const { engine } = await booted();
    expect(engine.state).toBe('running');
    expect(engine.isRunning).toBe(true);
    expect(engine.engineUrl).toBe('/__engine/');
  });

  it('rejects when the engine errors during boot', async () => {
    resetWasmBoot();
    const target: { WasmDeviced?: WasmHooks } = {};
    const boot = bootWasmEngine({
      hooksTarget_: target,
      factory_: async () => {
        queueMicrotask(() => target.WasmDeviced!.onState('error', 'no SharedArrayBuffer'));
        return new FakeModule();
      },
      log: () => undefined,
    });
    const err = (await boot.catch((e: unknown) => e)) as UAError;
    expect(err).toBeInstanceOf(UAError);
    expect(err.code).toBe('engine_boot');
    expect(err.message).toContain('no SharedArrayBuffer');
  });

  /** Boots a suspended engine with gestures on `gestures`; `whileBooting` runs before `running`. */
  async function bootSuspended(gestures: EventTarget, options: { resumeOnGesture?: boolean; whileBooting?: () => void } = {}): Promise<FakeModule> {
    resetWasmBoot();
    const mod = new FakeModule();
    mod.audioState = 0;
    const target: { WasmDeviced?: WasmHooks } = {};
    await bootWasmEngine({
      hooksTarget_: target,
      gestureTarget_: gestures,
      ...(options.resumeOnGesture === undefined ? {} : { resumeOnGesture: options.resumeOnGesture }),
      factory_: async () => {
        queueMicrotask(() => {
          target.WasmDeviced!.onState('booting', '');
          options.whileBooting?.();
          target.WasmDeviced!.onState('running', '');
        });
        return mod;
      },
      log: () => undefined,
    });
    return mod;
  }

  it('resumes audio on a click or key press once running', async () => {
    const gestures = new EventTarget();
    const mod = await bootSuspended(gestures);
    expect(mod.calls).not.toContain('wasmd_resume_audio_export');
    gestures.dispatchEvent(new Event('pointerdown'));
    expect(mod.calls).toContain('wasmd_resume_audio_export');
    expect(mod.audioState).toBe(1);
    mod.calls = [];
    gestures.dispatchEvent(new Event('keydown'));
    expect(mod.calls).toContain('wasmd_resume_audio_export');
  });

  it('replays a click made while the engine was booting', async () => {
    const gestures = new EventTarget();
    const mod = await bootSuspended(gestures, { whileBooting: () => gestures.dispatchEvent(new Event('pointerup')) });
    expect(mod.calls).toContain('wasmd_resume_audio_export');
  });

  it('leaves audio alone with resumeOnGesture: false', async () => {
    const gestures = new EventTarget();
    const mod = await bootSuspended(gestures, { resumeOnGesture: false, whileBooting: () => gestures.dispatchEvent(new Event('pointerdown')) });
    gestures.dispatchEvent(new Event('pointerdown'));
    expect(mod.calls).not.toContain('wasmd_resume_audio_export');
  });

  it('resumeAudio waits for the browser to resume the context', async () => {
    const { mod, engine } = await booted();
    mod.audioState = 0;
    mod.resumeDelayMs = 50;
    expect(await engine.resumeAudio()).toBe(true);
    mod.audioState = 0;
    mod.resumeDelayMs = 500;
    expect(await engine.resumeAudio(100)).toBe(false);
  });

  describe('microphone on record arm', () => {
    const ARM = '/sessions/s/tracks/t1/record_enabled';
    const asked = (mod: FakeModule) => mod.calls.filter((c) => c === 'wasmd_request_audio_input_export' || c === 'wasmd_retry_audio_input_export');

    it('asks inside the click that armed a track', async () => {
      const { mod, engine, port } = await booted();
      engine.noteGesture();
      port.set(ARM, true).catch(() => undefined);
      expect(asked(mod)).toEqual(['wasmd_request_audio_input_export']);
    });

    it('asks on the next click when the arm had no gesture to ask inside', async () => {
      const { mod, engine, port } = await booted();
      port.set(ARM, true).catch(() => undefined);
      expect(asked(mod)).toEqual([]);
      engine.noteGesture();
      expect(asked(mod)).toEqual(['wasmd_request_audio_input_export']);
    });

    it('arms the session too, and leaves disarming and other writes alone', async () => {
      const { mod, engine, port } = await booted();
      engine.noteGesture();
      port.set('/sessions/s/record_enabled_count', true).catch(() => undefined);
      port.set(ARM, false).catch(() => undefined);
      expect(asked(mod)).toEqual([]);
      port.set('/sessions/s/record_enabled', true).catch(() => undefined);
      expect(asked(mod)).toEqual(['wasmd_request_audio_input_export']);
    });

    it('does not ask again while asking or connected, and retries after a denial', async () => {
      const { mod, engine, port } = await booted();
      engine.noteGesture();
      mod.inputState = 2;
      port.set(ARM, true).catch(() => undefined);
      expect(asked(mod)).toEqual([]);
      mod.inputState = 3;
      port.set(ARM, true).catch(() => undefined);
      expect(asked(mod)).toEqual(['wasmd_retry_audio_input_export']);
    });

    it('leaves the microphone alone with audioInputOnRecord off', async () => {
      const { mod, engine, port } = await booted();
      engine.audioInputOnRecord = false;
      engine.noteGesture();
      port.set(ARM, true).catch(() => undefined);
      engine.noteGesture();
      expect(asked(mod)).toEqual([]);
    });
  });

  it('times out when running never arrives', async () => {
    vi.useFakeTimers();
    resetWasmBoot();
    const target: { WasmDeviced?: WasmHooks } = {};
    const boot = bootWasmEngine({ hooksTarget_: target, factory_: async () => new FakeModule(), timeoutMs: 1000, log: () => undefined }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(1100);
    expect(((await boot) as UAError).code).toBe('engine_boot');
    vi.useRealTimers();
  });
});

describe('WasmPort', () => {
  beforeEach(() => resetWasmBoot());
  afterEach(() => vi.useRealTimers());

  it('sends requests through ccall and resolves replies by id', async () => {
    const { mod, port } = await booted();
    expect(port.connected).toBe(true);
    const p = port.get('/sessions', { properties: false, commands: false });
    expect(mod.sent).toEqual([{ method: 0, path: '/sessions?properties=0&commands=0', body: '' }]);
    mod.reply(mod.lastId(), {});
    await expect(p).resolves.toEqual({});
    const s = port.set('/sessions/a/looping', true);
    expect(mod.sent.at(-1)).toEqual({ method: 1, path: '/sessions/a/looping', body: 'true' });
    mod.reply(mod.lastId(), true);
    await s;
    const q = port.post('/sessions/new_session', { name: 'x' });
    expect(mod.sent.at(-1)).toEqual({ method: 2, path: '/sessions/new_session', body: '{"name":"x"}' });
    mod.reply(mod.lastId(), { session_uid: 'a', session_package_uid: 'p' });
    await expect(q).resolves.toEqual({ session_uid: 'a', session_package_uid: 'p' });
  });

  it('turns an error reply into a UAError with the engine code', async () => {
    const { mod, port } = await booted();
    const p = port.get('/definitely/missing').catch((e: unknown) => e);
    mod.reply(mod.lastId(), { error: 'uasrv.invalid_object' }, 'uasrv.invalid_object');
    const err = (await p) as UAError;
    expect(err.code).toBe('uasrv.invalid_object');
    expect(err.path).toBe('/definitely/missing');
  });

  it('times out unanswered requests', async () => {
    vi.useFakeTimers();
    const { port } = await booted();
    const p = port.get('/slow').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(600);
    expect(await p).toBeInstanceOf(RequestTimeout);
  });

  it('subscribes with recursive=1, shares handlers, and dispatches normalised updates', async () => {
    const { mod, port } = await booted();
    const seen: Event[] = [];
    const u1 = port.subscribe('/sessions', (e) => seen.push(e), { recursive: true });
    const u2 = port.subscribe('/sessions', (e) => seen.push(e), { recursive: true });
    expect(mod.sent).toEqual([{ method: 3, path: '/sessions?recursive=1', body: '' }]);
    mod.reply(mod.lastId(), null);
    mod.update('/sessions/a/looping/value', true);
    mod.update('/sessions/a/tracks/t1', { properties: { uid: 't1' } });
    mod.update('/sessions/a/tracks/t1', null);
    mod.update('/elsewhere/value', 1);
    expect(seen.map((e) => [e.path, e.operation ?? e.data])).toEqual([
      ['/sessions/a/looping', true],
      ['/sessions/a/looping', true],
      ['/sessions/a/tracks/t1', 'added'],
      ['/sessions/a/tracks/t1', 'added'],
      ['/sessions/a/tracks/t1', 'removed'],
      ['/sessions/a/tracks/t1', 'removed'],
    ]);
    u1();
    expect(mod.sent).toHaveLength(1);
    u2();
    expect(mod.sent.at(-1)).toEqual({ method: 4, path: '/sessions', body: '' });
  });

  it('closes on engine stop and fails in-flight requests', async () => {
    const { mod, engine, port } = await booted();
    const statuses: PortStatus[] = [];
    port.onStatus((s) => statuses.push(s));
    const p = port.get('/x').catch((e: unknown) => e);
    mod.hooks.onState('stopped', '');
    expect(await p).toBeInstanceOf(ConnectionLost);
    expect(port.connected).toBe(false);
    expect(statuses).toEqual(['closed']);
    await expect(port.get('/y')).rejects.toBeInstanceOf(ConnectionLost);
    expect(engine.state).toBe('stopped');
  });

  it('drives the Store and model like any other port', async () => {
    const { mod, port } = await booted();
    const luna = new Luna.Client(port, 'wasm');
    expect(luna.wasm).toBeDefined();
    expect(luna.wasm?.audio().contextState).toBe(1);
    const ready = luna.sessions.ready();
    // watch('/sessions') -> subscribe then load
    mod.reply(mod.lastId(), null); // subscribe
    await Promise.resolve();
    const load = mod.sent.find((s) => s.method === 0 && s.path.startsWith('/sessions?'));
    expect(load).toBeDefined();
    mod.reply(mod.sent.indexOf(load!) + 1, {});
    await ready;
    expect(luna.sessions.items.items).toEqual([]);
    // a new session appears as an added push carrying its properties
    mod.update('/sessions/abc', { properties: { uid: 'abc', name: 'From wasm' } });
    expect(luna.sessions.items.items.map((s) => s.uid)).toEqual(['abc']);
    mod.update('/sessions/abc/name/value', 'Renamed');
    expect(luna.sessions.items.byId('abc')?.name.value).toBe('Renamed');
    mod.update('/sessions/abc', null);
    expect(luna.sessions.items.items).toEqual([]);
    await luna.close();
  });

  it('connect() picks the wasm engine from options or the page URL', async () => {
    resetWasmBoot();
    const target: { WasmDeviced?: WasmHooks } = {};
    const luna = await Luna.connect({
      engine: 'wasm',
      engineUrl: '/eng/',
      wasm: {
        hooksTarget_: target,
        factory_: async () => {
          queueMicrotask(() => target.WasmDeviced!.onState('running', ''));
          return new FakeModule();
        },
        log: () => undefined,
      },
    });
    expect(luna.engine).toBe('wasm');
    expect(luna.wasm?.engineUrl).toBe('/eng/');
    (globalThis as { location?: unknown }).location = { search: '?engine=wasm&engine_url=/other/' };
    expect(Luna.locationOptions()).toEqual({ engine: 'wasm', engineUrl: '/other/' });
    delete (globalThis as { location?: unknown }).location;
    await luna.close();
  });
});
