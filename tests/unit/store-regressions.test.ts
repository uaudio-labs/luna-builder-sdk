/**
 * Store lifecycle and ordering cases: a late read must not undo a newer push, a refused
 * write rolls back to what the engine confirmed, a read's child lists are authoritative only
 * as deep as it asked, and watches survive a failed first load and a closed Store.
 */
import { describe, expect, it, vi } from 'vitest';
import type { Port } from '../../src/wire/port';
import { MockEngine } from '../../src/wire/mock-port';
import { Store } from '../../src/store/store';

const deferred = <T = void>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

function port(): Port {
  const engine = new MockEngine();
  engine.addNode('/x', { properties: { value: 0 } });
  return engine.port();
}

describe('Store ordering', () => {
  it('does not let a read answered late overwrite a push that landed while it was in flight', async () => {
    const p = port();
    const read = deferred<unknown>();
    vi.spyOn(p, 'get').mockImplementation(() => read.promise);
    const store = new Store(p);
    const loading = store.load('/x', { children: false });
    store.onEvent({ path: '/x/value', data: 2 });
    read.resolve({ properties: { value: 1 } });
    await loading;
    expect(store.cell('/x', 'value').value).toBe(2);
    await store.close();
  });

  it.each(['success', 'failure', 'observation'] as const)('an older refusal respects a newer write that ends in %s', async (outcome) => {
    const p = port();
    const a = deferred(), b = deferred();
    vi.spyOn(p, 'set').mockImplementationOnce(() => a.promise).mockImplementationOnce(() => b.promise);
    const store = new Store(p);
    store.onEvent({ path: '/x/value', data: 0 }); // what the engine last confirmed
    const cell = store.cell('/x', 'value');
    const first = store.set('/x', 'value', 1).catch(() => {});
    const second = store.set('/x', 'value', 2).catch(() => {});
    a.reject(new Error('first refused'));
    await first;
    expect(cell.value).toBe(2); // the newer write stands
    if (outcome === 'observation') store.onEvent({ path: '/x/value', data: 2 }); // an echo supersedes rollback
    if (outcome === 'success') b.resolve();
    else b.reject(new Error('second refused'));
    await second;
    // A refused write goes back to the confirmed 0, never to the other unconfirmed write.
    expect(cell.value).toBe(outcome === 'failure' ? 0 : 2);
    await store.close();
  });
});

describe('Store child lists', () => {
  it('keeps children a read did not ask for, and clears them when a full read says there are none', async () => {
    const p = port();
    let reply: unknown = { children: [{ path: 'a' }, { path: 'b' }] };
    vi.spyOn(p, 'get').mockImplementation(async () => reply);
    const store = new Store(p);
    await store.load('/tracks');
    expect(store.children('/tracks').value).toEqual(['a', 'b']);

    reply = { properties: { type: 'tracks' } };
    await store.load('/tracks', { children: false });
    expect(store.children('/tracks').value).toEqual(['a', 'b']); // not asked: left alone

    reply = {};
    await store.load('/tracks');
    expect(store.children('/tracks').value).toEqual([]); // asked, and none came back (fact 18)
    await store.close();
  });

  it('treats a bare child name below the requested depth as saying nothing about its children', async () => {
    const p = port();
    let reply: unknown = { children: [{ path: 'a', children: [{ path: 'x' }] }] };
    vi.spyOn(p, 'get').mockImplementation(async () => reply);
    const store = new Store(p);
    await store.load('/t', { levels: 2 });
    expect(store.children('/t/a').value).toEqual(['x']);
    reply = { children: [{ path: 'a' }] };
    await store.load('/t', { levels: 1 });
    expect(store.children('/t/a').value).toEqual(['x']); // levels 1 lists `a` bare
    await store.load('/t', { levels: 2 });
    expect(store.children('/t/a').value).toEqual([]); // levels 2 would have listed its children
    await store.close();
  });
});

describe('Store watches', () => {
  it('lets a watch retry after its first load failed', async () => {
    const p = port();
    const get = vi.spyOn(p, 'get').mockRejectedValueOnce(new Error('load failed'));
    const store = new Store(p);
    const first = store.watch('/x');
    await expect(first.ready).rejects.toThrow('load failed');
    const second = store.watch('/x');
    await second.ready;
    expect(get).toHaveBeenCalledTimes(2);
    first.release();
    second.release();
    await store.close();
  });

  it('subscribes to nothing once closed', async () => {
    const p = port();
    const subscribe = vi.spyOn(p, 'subscribe');
    const store = new Store(p);
    await store.close();
    const w = store.watch('/x');
    await w.ready;
    w.release();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it('releases the wire subscription once, even when a failed watch is also released', async () => {
    const p = port();
    const off = vi.fn();
    vi.spyOn(p, 'subscribe').mockReturnValue(off);
    vi.spyOn(p, 'get').mockRejectedValueOnce(new Error('load failed'));
    const store = new Store(p);
    const w = store.watch('/x');
    await expect(w.ready).rejects.toThrow();
    w.release();
    expect(off).toHaveBeenCalledTimes(1);
    await store.close();
  });
});
