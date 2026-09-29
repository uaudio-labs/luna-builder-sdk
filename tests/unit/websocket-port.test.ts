import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionLost, NotRunning, RequestTimeout, UAError } from '../../src/wire/errors';
import type { Event, PortStatus } from '../../src/wire/port';
import { WebSocketPort } from '../../src/wire/websocket-port';
import { FakeSocket } from '../helpers/fake-socket';

function makePort(extra: Partial<ConstructorParameters<typeof WebSocketPort>[0]> = {}) {
  return new WebSocketPort({ WebSocket: FakeSocket, heartbeat: false, requestTimeoutMs: 1000, reconnectMinMs: 100, reconnectMaxMs: 400, ...extra });
}

async function openPort(extra: Partial<ConstructorParameters<typeof WebSocketPort>[0]> = {}) {
  const port = makePort(extra);
  const opening = port.open();
  FakeSocket.latest.open();
  await opening;
  return { port, socket: FakeSocket.latest };
}

describe('WebSocketPort', () => {
  beforeEach(() => {
    FakeSocket.reset();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults to LUNA on localhost and builds the URL from host/port', () => {
    expect(makePort().url).toBe('ws://localhost:4718');
    expect(makePort({ host: '10.0.0.5', port: 4719 }).url).toBe('ws://10.0.0.5:4719');
    expect(makePort({ url: 'wss://x/luna' }).url).toBe('wss://x/luna');
  });

  it('opens, reports status, and is connected', async () => {
    const port = makePort();
    const statuses: PortStatus[] = [];
    port.onStatus((s) => statuses.push(s));
    const opening = port.open();
    expect(statuses).toEqual(['connecting']);
    FakeSocket.latest.open();
    await opening;
    expect(port.connected).toBe(true);
    expect(statuses).toEqual(['connecting', 'connected']);
  });

  it('rejects with NotRunning when the first attempt fails and does not retry', async () => {
    const port = makePort();
    const opening = port.open();
    FakeSocket.latest.drop();
    await expect(opening).rejects.toBeInstanceOf(NotRunning);
    await vi.advanceTimersByTimeAsync(2000);
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it('sends a correlated get and resolves with the reply data', async () => {
    const { port, socket } = await openPort();
    const p = port.get('/sessions', { properties: false, commands: false, flatvalue: true });
    expect(socket.sent).toEqual(['get /sessions?properties=0&commands=0&flatvalue=1&ua_id=r1']);
    socket.reply('get /sessions', { path: '/sessions', data: { children: [{ path: 's1' }] } });
    await expect(p).resolves.toEqual({ children: [{ path: 's1' }] });
  });

  it('turns an error reply into a UAError carrying the engine code', async () => {
    const { port, socket } = await openPort();
    const p = port.set('/sessions/s1/tracks', 1);
    expect(socket.sent[0]).toBe('set /sessions/s1/tracks?ua_id=r1 1');
    socket.reply('set ', { path: '/sessions/s1/tracks', error: 'uasrv.invalid_property' });
    const err = (await p.catch((e: unknown) => e)) as UAError;
    expect(err).toBeInstanceOf(UAError);
    expect(err.code).toBe('uasrv.invalid_property');
    expect(err.cmd).toBe('set');
    expect(err.path).toBe('/sessions/s1/tracks');
  });

  it('encodes post payloads and resolves null replies', async () => {
    const { port, socket } = await openPort();
    const p = port.post('/sessions/s1/new_track', { name: 'Vocal' });
    expect(socket.sent[0]).toBe('post /sessions/s1/new_track?ua_id=r1 {"name":"Vocal"}');
    socket.reply('post ', { path: '/sessions/s1/new_track', data: null });
    await expect(p).resolves.toBeNull();
  });

  it('matches replies out of order and ignores unknown ids', async () => {
    const { port, socket } = await openPort();
    const a = port.get('/a');
    const b = port.get('/b');
    socket.receive({ path: '/zzz', data: 0, parameters: { ua_id: 'r99' } });
    socket.reply('get /b', { path: '/b', data: 'B' });
    socket.reply('get /a', { path: '/a', data: 'A' });
    expect(await Promise.all([a, b])).toEqual(['A', 'B']);
  });

  it('times out a request that gets no answer', async () => {
    const { port } = await openPort({ requestTimeoutMs: 500 });
    const p = port.get('/slow');
    const settled = p.catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(600);
    const err = (await settled) as UAError;
    expect(err).toBeInstanceOf(RequestTimeout);
    expect(err.code).toBe('timeout');
  });

  it('sends one wire subscribe per path, shares it, and unsubscribes after the last handler', async () => {
    const { port, socket } = await openPort();
    const seen: Event[] = [];
    const u1 = port.subscribe('/sessions/s1', (e) => seen.push(e));
    const u2 = port.subscribe('/sessions/s1', (e) => seen.push(e));
    expect(socket.sent).toEqual(['subscribe /sessions/s1?ignore_response=1']);
    socket.receive({ path: '/sessions/s1/playing/value', data: true });
    expect(seen).toEqual([
      { path: '/sessions/s1/playing', data: true },
      { path: '/sessions/s1/playing', data: true },
    ]);
    u1();
    expect(socket.sent).toHaveLength(1);
    u2();
    u2();
    expect(socket.sent).toEqual(['subscribe /sessions/s1?ignore_response=1', 'unsubscribe /sessions/s1?ignore_response=1']);
  });

  it('adds recursive=1 for recursive subscriptions and keys them separately', async () => {
    const { port, socket } = await openPort();
    port.subscribe('/sessions', () => undefined, { recursive: true });
    port.subscribe('/sessions', () => undefined);
    expect(socket.sent).toEqual(['subscribe /sessions?ignore_response=1&recursive=1', 'subscribe /sessions?ignore_response=1']);
  });

  it('delivers structural operations, expands multi pushes, and reports unhandled pushes', async () => {
    const unhandled: unknown[] = [];
    const { port, socket } = await openPort({ onUnhandled: (m) => unhandled.push(m) });
    const seen: Event[] = [];
    port.subscribe('/sessions', (e) => seen.push(e), { recursive: true });
    socket.receive({ path: '/sessions/s9', operation: 'added' });
    socket.receive({
      path: 'multi',
      data: [
        { path: '/sessions/s1/playing/value', data: false },
        { path: '/sessions/s9', operation: 'removed' },
      ],
    });
    socket.receive({ path: '/elsewhere/value', data: 1 });
    socket.receive({ path: '/status/x', data: 1, parameters: { ignore_response: 1 } });
    expect(seen).toEqual([
      { path: '/sessions/s9', data: undefined, operation: 'added' },
      { path: '/sessions/s1/playing', data: false },
      { path: '/sessions/s9', data: undefined, operation: 'removed' },
    ]);
    expect(unhandled).toEqual([{ path: '/elsewhere/value', data: 1 }]);
  });

  it('survives a handler that throws and a frame that is not JSON', async () => {
    const { port, socket } = await openPort();
    const seen: string[] = [];
    port.subscribe('/a', () => {
      throw new Error('boom');
    });
    port.subscribe('/a', (e) => seen.push(e.path));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    socket.receive('garbage');
    socket.receive({ path: '/a/x/value', data: 1 });
    expect(seen).toEqual(['/a/x']);
    spy.mockRestore();
  });

  it('fails in-flight and new requests on a drop, then reconnects with backoff and resubscribes', async () => {
    const { port, socket } = await openPort();
    const statuses: PortStatus[] = [];
    port.onStatus((s) => statuses.push(s));
    port.subscribe('/sessions', () => undefined, { recursive: true });
    const inflight = port.get('/sessions').catch((e: unknown) => e as UAError);
    socket.drop();
    expect(await inflight).toBeInstanceOf(ConnectionLost);
    expect(port.connected).toBe(false);
    await expect(port.get('/x')).rejects.toBeInstanceOf(ConnectionLost);
    expect(statuses).toEqual(['disconnected']);

    await vi.advanceTimersByTimeAsync(100);
    expect(FakeSocket.instances).toHaveLength(2);
    const second = FakeSocket.latest;
    second.drop(); // attempt fails; backoff doubles
    await vi.advanceTimersByTimeAsync(150);
    expect(FakeSocket.instances).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(100);
    expect(FakeSocket.instances).toHaveLength(3);
    const third = FakeSocket.latest;
    third.open();
    expect(port.connected).toBe(true);
    expect(third.sent).toEqual(['subscribe /sessions?ignore_response=1&recursive=1']);
    expect(statuses).toEqual(['disconnected', 'connecting', 'disconnected', 'connecting', 'connected']);
  });

  it('does not reconnect when reconnect is disabled', async () => {
    const { socket } = await openPort({ reconnect: false });
    socket.drop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it('reads the idle timeout and pings at half the interval', async () => {
    const { port, socket } = await openPort({ heartbeat: true });
    expect(socket.sent).toEqual(['get /status/timeout_ms?flatvalue=1&ua_id=r1']);
    socket.reply('get /status/timeout_ms', { path: '/status/timeout_ms', data: 30000 });
    await vi.advanceTimersByTimeAsync(15000);
    expect(socket.sent).toEqual(['get /status/timeout_ms?flatvalue=1&ua_id=r1', 'get /ping?ignore_response=1']);
    await port.close();
    await vi.advanceTimersByTimeAsync(30000);
    expect(socket.sent).toHaveLength(2);
  });

  it('skips the heartbeat when the engine reports no timeout', async () => {
    const { socket } = await openPort({ heartbeat: true });
    socket.reply('get /status/timeout_ms', { path: '/status/timeout_ms', data: { value: 0 } });
    await vi.advanceTimersByTimeAsync(60000);
    expect(socket.sent).toHaveLength(1);
  });

  it('closes cleanly: status closed, pending rejected, no reconnect, idempotent', async () => {
    const { port, socket } = await openPort();
    const statuses: PortStatus[] = [];
    port.onStatus((s) => statuses.push(s));
    const pending = port.get('/x').catch((e: unknown) => e as UAError);
    await port.close();
    await port.close();
    expect(await pending).toBeInstanceOf(ConnectionLost);
    expect(socket.readyState).toBe(FakeSocket.CLOSED);
    expect(statuses).toEqual(['closed']);
    await vi.advanceTimersByTimeAsync(5000);
    expect(FakeSocket.instances).toHaveLength(1);
    await expect(port.open()).rejects.toBeInstanceOf(ConnectionLost);
  });
  it('reports drops, reconnects, timeouts and listener errors through log', async () => {
    const log = vi.fn();
    const { port, socket } = await openPort({ log });
    port.onStatus(() => {
      throw new Error('listener bug');
    });
    const timedOut = expect(port.get('/slow')).rejects.toBeInstanceOf(RequestTimeout);
    await vi.advanceTimersByTimeAsync(1001);
    await timedOut;
    socket.drop();
    const lines = log.mock.calls.map(([level, message]) => `${level} ${message}`);
    expect(lines).toContain('warn get /slow timed out');
    expect(lines).toContain('warn ws://localhost:4718 disconnected');
    expect(lines).toContain('error status listener threw');
    expect(lines).toContain('info reconnecting to ws://localhost:4718 in 100 ms');
    port.close();
  });
});
