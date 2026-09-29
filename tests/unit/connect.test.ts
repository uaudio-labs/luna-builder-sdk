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
    const connecting = Luna.connect({ WebSocket: FakeSocket });
    expect(FakeSocket.latest.url).toBe('ws://10.1.1.1:4719');
    FakeSocket.latest.open();
    const luna = await connecting;
    expect(luna.engine).toBe('luna');
    await luna.close();
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

  it('is not embedded without a port on the URL', () => {
    expect(Luna.isEmbeddedInLuna()).toBe(false);
    expect(Luna.hasNativeBridge()).toBe(false);
  });
});
