import { describe, expect, it } from 'vitest';
import { MockEngine } from '../../src/wire/mock-port';
import { Cell, Scheduler, derived, listOf, shallowEquals } from '../../src/store/prop';
import { Store } from '../../src/store/store';

async function tick(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

describe('Cell and Scheduler', () => {
  it('coalesces notifications and delivers once per flush', async () => {
    const scheduler = new Scheduler();
    const cell = new Cell<number>(scheduler);
    let calls = 0;
    cell.onChange(() => calls++);
    cell.update(1);
    cell.update(2);
    expect(cell.value).toBe(2);
    expect(calls).toBe(0);
    await scheduler.settled();
    expect(calls).toBe(1);
  });

  it('does not notify when the value is equal by shape', () => {
    const scheduler = new Scheduler();
    const cell = new Cell<unknown>(scheduler, { a: 1 });
    let calls = 0;
    cell.onChange(() => calls++);
    expect(cell.update({ a: 1 })).toBe(false);
    scheduler.flush();
    expect(calls).toBe(0);
    expect(cell.update({ a: 2 })).toBe(true);
    scheduler.flush();
    expect(calls).toBe(1);
  });

  it('compares primitives, arrays and objects', () => {
    expect(shallowEquals(1, 1)).toBe(true);
    expect(shallowEquals([1, { b: 2 }], [1, { b: 2 }])).toBe(true);
    expect(shallowEquals([1], [1, 2])).toBe(false);
    expect(shallowEquals({ a: 1 }, { a: 2 })).toBe(false);
    expect(shallowEquals(null, {})).toBe(false);
  });

  it('derives values and lists', () => {
    const scheduler = new Scheduler();
    const a = new Cell<number>(scheduler, 2);
    const doubled = derived([a], () => (a.value ?? 0) * 2);
    let calls = 0;
    const unsub = doubled.onChange(() => calls++);
    expect(doubled.value).toBe(4);
    a.update(3);
    scheduler.flush();
    expect(calls).toBe(1);
    expect(doubled.value).toBe(6);
    unsub();
    expect(a.listenerCount).toBe(0);

    const names = new Cell<readonly { id: string }[]>(scheduler, [{ id: 'x' }]);
    const list = listOf(names, (i) => i.id);
    expect(list.items).toHaveLength(1);
    expect(list.byId('x')).toEqual({ id: 'x' });
    expect(list.byId('y')).toBeUndefined();
  });

  it('a distinct derived notifies only when the computed value moves', () => {
    const scheduler = new Scheduler();
    const source = new Cell<{ tick: number; tempo: number }>(scheduler, { tick: 0, tempo: 120 });
    const tempo = derived([source], () => source.value?.tempo, { distinct: true });
    let calls = 0;
    tempo.onChange(() => calls++);
    source.update({ tick: 1, tempo: 120 }); // the source moved, the carved-out value did not
    scheduler.flush();
    expect(calls).toBe(0);
    source.update({ tick: 2, tempo: 128 });
    scheduler.flush();
    expect([calls, tempo.value]).toEqual([1, 128]);
  });
});

describe('Store', () => {
  it('loads a node into property cells and a child list', async () => {
    const engine = new MockEngine();
    engine.addSession('abc', { tracks: ['t1', 't2'] });
    const store = new Store(engine.port());
    await store.load('/sessions/abc');
    expect(store.cell('/sessions/abc', 'playing').value).toBe(false);
    expect(store.cell('/sessions/abc', 'name').value).toBe('abc');
    expect(store.children('/sessions/abc').value).toEqual(expect.arrayContaining(['tracks', 'playlists', 'buses', 'contexts', 'tempo_map', 'markers']));
    await store.load('/sessions/abc/tracks', { recursive: true });
    expect(store.children('/sessions/abc/tracks').value).toEqual(['t1', 't2']);
    expect(store.cell('/sessions/abc/tracks/t2', 'name').value).toBe('t2');
    await store.load('/sessions/abc/playing');
    expect(store.cell('/sessions/abc', 'playing').value).toBe(false);
  });

  it('treats a bare {} reply as an empty node, not a property value (facts 10 and 18)', async () => {
    const engine = new MockEngine();
    const store = new Store(engine.port());
    await store.load('/sessions', { properties: false, commands: false });
    expect(store.children('/sessions').value).toEqual([]);
    expect(store.cell('/', 'sessions').value).toBeUndefined();
    await store.load('/nowhere');
    expect(store.children('/nowhere').value).toEqual([]);
  });

  it('watches a path: cells follow engine pushes and listeners fire once per flush', async () => {
    const engine = new MockEngine();
    engine.addSession('abc');
    const store = new Store(engine.port());
    const { ready, release } = store.watch('/sessions/abc');
    await ready;
    const playing = store.cell<boolean>('/sessions/abc', 'playing');
    let calls = 0;
    playing.onChange(() => calls++);
    engine.setValue('/sessions/abc', 'playing', true);
    await engine.settled();
    expect(playing.value).toBe(true);
    await store.scheduler.settled();
    expect(calls).toBe(1);
    release();
    engine.setValue('/sessions/abc', 'playing', false);
    await engine.settled();
    expect(playing.value).toBe(true);
  });

  it('refcounts watches so one wire subscription serves two watchers', async () => {
    const engine = new MockEngine();
    engine.addSession('abc');
    const store = new Store(engine.port());
    const a = store.watch('/sessions/abc');
    const b = store.watch('/sessions/abc');
    await Promise.all([a.ready, b.ready]);
    await tick();
    expect(engine.requests.filter((r) => r.verb === 'subscribe')).toHaveLength(1);
    a.release();
    await tick();
    expect(engine.requests.filter((r) => r.verb === 'unsubscribe')).toHaveLength(0);
    b.release();
    await tick();
    expect(engine.requests.filter((r) => r.verb === 'unsubscribe')).toHaveLength(1);
  });

  it('tracks children added and removed under a watched node', async () => {
    const engine = new MockEngine();
    engine.addSession('abc', { tracks: ['t1'] });
    const store = new Store(engine.port());
    const w = store.watch('/sessions/abc/tracks', { recursive: true });
    await w.ready;
    const list = store.children('/sessions/abc/tracks');
    expect(list.value).toEqual(['t1']);
    engine.addNode('/sessions/abc/tracks/t2', { properties: { name: 'Bass' } });
    await engine.settled();
    expect(list.value).toEqual(['t1', 't2']);
    engine.setValue('/sessions/abc/tracks/t2', 'name', 'Bass 2');
    await engine.settled();
    expect(store.cell('/sessions/abc/tracks/t2', 'name').value).toBe('Bass 2');
    engine.removeNode('/sessions/abc/tracks/t1');
    await engine.settled();
    expect(list.value).toEqual(['t2']);
    expect(store.knowsNode('/sessions/abc/tracks/t1')).toBe(false);
  });

  it('applies node properties carried by an added push (wasm shape, fact 13)', async () => {
    const engine = new MockEngine();
    engine.addSession('abc');
    const store = new Store(engine.port());
    const w = store.watch('/sessions/abc/markers', { recursive: true });
    await w.ready;
    store.onEvent({ path: '/sessions/abc/markers/1', operation: 'added', data: { properties: { rowid: 1, location: 5, name: 'Verse' } } });
    expect(store.children('/sessions/abc/markers').value).toEqual(['1']);
    expect(store.cell('/sessions/abc/markers/1', 'name').value).toBe('Verse');
    expect(store.cell('/sessions/abc/markers/1', 'location').value).toBe(5);
    store.onEvent({ path: '/sessions/abc/markers/2', operation: 'added', data: undefined });
    expect(store.children('/sessions/abc/markers').value).toEqual(['1', '2']);
    expect(store.children('/sessions/abc/markers/2').value).toEqual([]);
  });

  it('writes optimistically and keeps the value when the engine accepts', async () => {
    const engine = new MockEngine();
    engine.addSession('abc');
    const store = new Store(engine.port());
    await store.load('/sessions/abc');
    const playing = store.cell<boolean>('/sessions/abc', 'playing');
    const p = store.set('/sessions/abc', 'playing', true);
    expect(playing.value).toBe(true);
    await p;
    expect(engine.value('/sessions/abc', 'playing')).toBe(true);
    expect(playing.value).toBe(true);
  });

  it('rolls back a rejected write unless something newer landed', async () => {
    const engine = new MockEngine();
    engine.addSession('abc');
    const store = new Store(engine.port());
    await store.load('/sessions/abc');
    const name = store.cell<string>('/sessions/abc', 'name');

    engine.fail('/sessions/abc/name', 'uasrv.read_only');
    await expect(store.set('/sessions/abc', 'name', 'X')).rejects.toMatchObject({ code: 'uasrv.read_only' });
    expect(name.value).toBe('abc');

    engine.fail('/sessions/abc/name', 'uasrv.read_only');
    const p = store.set('/sessions/abc', 'name', 'Y');
    name.update('from-engine');
    await p.catch(() => undefined);
    expect(name.value).toBe('from-engine');
  });

  it('reloads watched paths after a reconnect', async () => {
    const engine = new MockEngine();
    engine.addSession('abc');
    const port = engine.port();
    const store = new Store(port);
    const w = store.watch('/sessions/abc');
    await w.ready;
    await port.reconnect(async () => {
      engine.setValue('/sessions/abc', 'playing', true); // missed: port is down
      await engine.settled();
      expect(store.cell('/sessions/abc', 'playing').value).toBe(false);
    });
    await tick();
    await tick();
    expect(store.cell('/sessions/abc', 'playing').value).toBe(true);
  });

  it('taps raw events before cells are written', async () => {
    const engine = new MockEngine();
    engine.addSession('abc');
    await engine.settled(); // the 'added' pushes from building the tree are not part of this test
    const store = new Store(engine.port());
    const seen: string[] = [];
    store.onEvent((e) => seen.push(`${e.path}=${String(e.data)}:${store.cell('/sessions/abc', 'playing').value}`));
    const w = store.watch('/sessions/abc');
    await w.ready;
    engine.setValue('/sessions/abc', 'playing', true);
    await engine.settled();
    expect(seen).toEqual(['/sessions/abc/playing=true:false']);
  });
});
