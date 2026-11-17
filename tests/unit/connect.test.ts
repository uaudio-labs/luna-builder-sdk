import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';
import { FakeSocket } from '../helpers/fake-socket';

type G = { location?: { search: string } };

describe('Luna.connect', () => {
  beforeEach(() => FakeSocket.reset());
  afterEach(() => {
    delete (globalThis as G).location;
  });

  it('exposes the namespace and version', () => {
    expect(typeof Luna.connect).toBe('function');
    expect(Luna.VERSION).toMatch(/^\d+\.\d+\.\d+/);
    expect(new Luna.NotRunning('ws://x')).toBeInstanceOf(Luna.Error);
  });

  it('wraps an injected port and reports status as a Prop', async () => {
    const engine = new Luna.MockEngine();
    engine.addSession('abc');
    const luna = await Luna.connect({ port_: engine.port() });
    expect(luna.engine).toBe('mock');
    expect(luna.connected).toBe(true);
    expect(luna.status.value).toBe('connected');
    expect(await luna.raw.get('/sessions/abc/name', { flatvalue: true })).toBe('abc');
    await luna.close();
    expect(luna.status.value).toBe('closed');
  });

  it('opens a WebSocket to LUNA by default', async () => {
    const connecting = Luna.connect({ WebSocket: FakeSocket });
    expect(FakeSocket.latest.url).toBe('ws://localhost:4718');
    FakeSocket.latest.open();
    const luna = await connecting;
    expect(luna.engine).toBe('luna');
    await luna.close();
  });

  it('honours ?host= and ?port= from the page URL', async () => {
    (globalThis as G).location = { search: '?port=4719&host=10.1.1.1' };
    expect(Luna.isEmbeddedInLuna()).toBe(true);
    expect(Luna.locationOptions()).toEqual({ host: '10.1.1.1', port: 4719 });
    expect(Luna.addOnTarget()).toBeUndefined();   // a LUNA older than ?target=
    const connecting = Luna.connect({ WebSocket: FakeSocket });
    expect(FakeSocket.latest.url).toBe('ws://10.1.1.1:4719');
    FakeSocket.latest.open();
    const luna = await connecting;
    expect(luna.engine).toBe('luna');
    await luna.close();
  });

  it('takes the engine from a <meta name="luna-engine"> when the URL names none, and never inside LUNA', () => {
    type D = { document?: { querySelector: (s: string) => { getAttribute: (n: string) => string | null } | null } };
    (globalThis as D).document = {
      querySelector: (s) => (s === 'meta[name="luna-engine"]' ? { getAttribute: (n) => (n === 'content' ? 'wasm' : null) } : null),
    };
    try {
      expect(Luna.locationOptions()).toEqual({ engine: 'wasm' });
      (globalThis as G).location = { search: '?host=10.1.1.1' };
      expect(Luna.locationOptions()).toEqual({ engine: 'wasm', host: '10.1.1.1' });
      (globalThis as G).location = { search: '?engine=luna' };
      expect(Luna.locationOptions().engine).toBe('luna');
      (globalThis as G).location = { search: '?port=4718' };
      expect(Luna.locationOptions()).toEqual({ port: 4718 });
    } finally {
      delete (globalThis as D).document;
    }
  });

  it('lets explicit options beat the page URL', async () => {
    (globalThis as G).location = { search: '?port=4718' };
    const connecting = Luna.connect({ WebSocket: FakeSocket, host: 'studio.local', port: 5000 });
    expect(FakeSocket.latest.url).toBe('ws://studio.local:5000');
    FakeSocket.latest.open();
    await (await connecting).close();
  });

  it('throws NotRunning when nothing answers', async () => {
    const connecting = Luna.connect({ WebSocket: FakeSocket });
    FakeSocket.latest.drop();
    await expect(connecting).rejects.toBeInstanceOf(Luna.NotRunning);
  });

  it('refuses to boot the wasm engine outside a browser page', async () => {
    const err = (await Luna.connect({ engine: 'wasm', wasm: { log: () => undefined } }).catch((e: unknown) => e)) as Luna.Error;
    expect(err).toBeInstanceOf(Luna.Error);
    expect(err.code).toBe('engine_boot');
  });

  it('connects to an in-memory engine with engine: mock, filled by setup, and exposes it as luna.mock', async () => {
    const luna = await Luna.connect({ engine: 'mock', setup: (engine) => engine.addSession('s', { name: 'Fixture', tracks: ['Vox', 'Bass'] }) });
    expect(luna.engine).toBe('mock');
    const session = await luna.session();
    expect(session.name.value).toBe('Fixture');
    expect(session.tracks.items.map((t) => t.id)).toEqual(['Vox', 'Bass']);
    luna.mock!.setValue('/sessions/s/tracks/Vox', 'name', 'Lead');
    await luna.mock!.settled();
    expect(session.tracks.byId('Vox')!.name.value).toBe('Lead');
    await luna.close();
  });

  it('takes ?engine=mock from the page URL, using the page-defined LunaMockSetup or else the demo session', async () => {
    (globalThis as G).location = { search: '?engine=mock&port=4718' };
    expect(Luna.locationOptions().engine).toBe('mock');
    const demo = await Luna.connect();
    expect(demo.engine).toBe('mock');
    expect((await demo.session()).tracks.items.map((t) => t.id)).toEqual(['Vocal', 'Guitar', 'Bass', 'Drums']);
    await demo.close();

    const g = globalThis as { LunaMockSetup?: (engine: InstanceType<typeof Luna.MockEngine>) => void };
    g.LunaMockSetup = (engine) => engine.addSession('p', { name: 'From page', tracks: ['One'] });
    try {
      const luna = await Luna.connect();
      expect((await luna.session()).name.value).toBe('From page');
      await luna.close();
    } finally {
      delete g.LunaMockSetup;
    }
  });

  it('reads the host LUNA loaded the page in from ?target=, ignoring an unknown one', () => {
    (globalThis as G).location = { search: '?port=4718&add_on_inst=abc&target=browser' };
    expect(Luna.addOnTarget()).toBe('browser');
    (globalThis as G).location = { search: '?port=4718&target=panel' };
    expect(Luna.addOnTarget()).toBeUndefined();
  });

  it('is not embedded without a port on the URL', () => {
    expect(Luna.addOnTarget()).toBeUndefined();
    expect(Luna.isEmbeddedInLuna()).toBe(false);
    expect(Luna.hasNativeBridge()).toBe(false);
  });
});
