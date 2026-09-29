import { describe, expect, it } from 'vitest';
import { ConnectionLost, UAError } from '../../src/wire/errors';
import { MockEngine } from '../../src/wire/mock-port';
import type { Event } from '../../src/wire/port';

describe('MockEngine / MockPort', () => {
  it('describes a node like the engine does, with and without flatvalue', async () => {
    const engine = new MockEngine();
    engine.addSession('abc', { tracks: ['t1'] });
    const port = engine.port();
    const full = (await port.get('/sessions/abc')) as Record<string, unknown>;
    expect(full['properties']).toMatchObject({ playing: { value: false }, name: { value: 'abc' } });
    expect(full['children']).toEqual(expect.arrayContaining([{ path: 'tracks' }, { path: 'playlists' }, { path: 'buses' }, { path: 'contexts' }, { path: 'markers' }]));
    expect(full['commands']).toEqual(expect.arrayContaining([{ path: 'new_track' }, { path: 'begin_transaction' }]));
    const flat = (await port.get('/sessions/abc', { flatvalue: true, commands: false })) as Record<string, unknown>;
    expect(flat['properties']).toMatchObject({ playing: false });
    expect(flat['commands']).toBeUndefined();
  });

  it('reads properties directly, in both shapes', async () => {
    const engine = new MockEngine();
    engine.addSession('abc');
    const port = engine.port();
    expect(await port.get('/sessions/abc/playing')).toEqual({ value: false });
    expect(await port.get('/sessions/abc/playing', { flatvalue: true })).toBe(false);
    expect(await port.get('/sessions/abc/playing/value')).toBe(false);
  });

  it('answers recursive gets with nested children', async () => {
    const engine = new MockEngine();
    engine.addSession('abc', { tracks: ['t1', 't2'] });
    const port = engine.port();
    const tree = (await port.get('/sessions/abc/tracks', { recursive: true, flatvalue: true })) as { children: Record<string, unknown>[] };
    expect(tree.children.map((c) => c['path'])).toEqual(['t1', 't2']);
    expect(tree.children[0]!['properties']).toMatchObject({ name: 't1' });
  });

  it('answers a get on a missing path with {} and no error (fact 10)', async () => {
    const port = new MockEngine().port();
    await expect(port.get('/nope')).resolves.toEqual({});
  });

  it('omits empty sections (fact 18)', async () => {
    const engine = new MockEngine();
    engine.addNode('/empty');
    const port = engine.port();
    await expect(port.get('/empty')).resolves.toEqual({});
    await expect(port.get('/sessions', { properties: false, commands: false })).resolves.toEqual({});
  });

  it('rejects set on a node and on a read-only property', async () => {
    const engine = new MockEngine();
    engine.addNode('/x', { properties: { ro: 1, rw: 2 }, readOnly: ['ro'] });
    const port = engine.port();
    await expect(port.set('/x', 1)).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
    await expect(port.set('/x/ro', 5)).rejects.toMatchObject({ code: 'uasrv.read_only' });
    await port.set('/x/rw', 5);
    expect(engine.value('/x', 'rw')).toBe(5);
    await port.set('/x/rw/value', 6);
    expect(engine.value('/x', 'rw')).toBe(6);
  });

  it('pushes a set to other ports but not to the writer', async () => {
    const engine = new MockEngine();
    engine.addSession('abc');
    const writer = engine.port();
    const other = engine.port();
    const writerSaw: Event[] = [];
    const otherSaw: Event[] = [];
    writer.subscribe('/sessions/abc', (e) => writerSaw.push(e));
    other.subscribe('/sessions/abc', (e) => otherSaw.push(e));
    await writer.set('/sessions/abc/playing', true);
    await engine.settled();
    expect(writerSaw).toEqual([]);
    expect(otherSaw).toEqual([{ path: '/sessions/abc/playing', data: true }]);
  });

  it('delivers engine-side changes asynchronously to subscribers only', async () => {
    const engine = new MockEngine();
    engine.addSession('abc');
    const port = engine.port();
    const seen: Event[] = [];
    port.subscribe('/sessions/abc/playing', (e) => seen.push(e));
    engine.setValue('/sessions/abc', 'playing', true);
    engine.setValue('/sessions/abc', 'name', 'ignored');
    expect(seen).toEqual([]);
    await engine.settled();
    expect(seen).toEqual([{ path: '/sessions/abc/playing', data: true }]);
  });

  it('runs commands and pushes added/removed on the child path', async () => {
    const engine = new MockEngine();
    engine.addSession('abc');
    const port = engine.port();
    const seen: Event[] = [];
    port.subscribe('/sessions/abc/tracks', (e) => seen.push(e));
    const reply = await port.post('/sessions/abc/new_track', { name: 'Vocal' });
    expect(reply).toEqual({ track_uid: 't1' });
    await engine.settled();
    const direct = () => seen.filter((e) => e.path === '/sessions/abc/tracks/t1');
    expect(direct()).toEqual([{ path: '/sessions/abc/tracks/t1', data: undefined, operation: 'added' }]);
    expect(seen.some((e) => e.path === '/sessions/abc/tracks/t1/outputs/main' && e.operation === 'added')).toBe(true);
    engine.removeNode('/sessions/abc/tracks/t1');
    await engine.settled();
    expect(direct()[1]).toEqual({ path: '/sessions/abc/tracks/t1', data: undefined, operation: 'removed' });
    expect(engine.has('/sessions/abc/tracks/t1')).toBe(false);
    await expect(port.post('/sessions/abc/nope')).rejects.toMatchObject({ code: 'uasrv.invalid_object' });
  });

  it('injects faults for a number of requests', async () => {
    const engine = new MockEngine();
    engine.addSession('abc');
    const port = engine.port();
    engine.fail('/sessions/abc/playing', 'uasrv.busy', 2);
    await expect(port.set('/sessions/abc/playing', true)).rejects.toMatchObject({ code: 'uasrv.busy' });
    await expect(port.get('/sessions/abc/playing')).rejects.toMatchObject({ code: 'uasrv.busy' });
    await expect(port.get('/sessions/abc/playing', { flatvalue: true })).resolves.toBe(false);
  });

  it('records every request and refuses after close or while disconnected', async () => {
    const engine = new MockEngine();
    const port = engine.port();
    await port.get('/status', { flatvalue: true });
    expect(engine.requests[0]).toMatchObject({ verb: 'get', path: '/status?flatvalue=1' });
    const reconnecting = port.reconnect();
    await expect(port.get('/status')).rejects.toBeInstanceOf(ConnectionLost);
    await reconnecting;
    expect(port.connected).toBe(true);
    await port.close();
    expect(port.connected).toBe(false);
    await expect(port.get('/status')).rejects.toBeInstanceOf(ConnectionLost);
  });
});
