/**
 * Live lane for session storage (fact 129). Needs a LUNA with session storage on 4718
 * and a session open. Everything is written under a context of its own, which is removed at the
 * end, so the session's other storage is untouched. The undoable edit is undone again.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';
const CTX = `com.uaudio.sdk-live-test.${Date.now()}`;

describe.skipIf(!live)('live: session storage', () => {
  let luna: Luna.Client;
  let other: Luna.Client;
  let session: Luna.Session;
  let store: Luna.StorageContext;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    session = await luna.session();
    await session.ready();
    store = session.storage.context(CTX);
    other = await Luna.connect({ requestTimeoutMs: 8000 });
  });

  afterAll(async () => {
    await store?.clear().catch(() => undefined);
    await other?.close();
    await luna?.close();
  });

  it('adds, sets and reaches a second client (fact 129)', async () => {
    const otherSession = await other.session();
    expect(otherSession.uid).toBe(session.uid);
    await otherSession.ready();
    const seen = otherSession.storage.context(CTX).value<{ height: number }>('layout', 'timeline');

    await store.add('layout', 'timeline', { height: 200 });
    expect(store.value('layout', 'timeline').value).toEqual({ height: 200 });
    await store.add('layout', 'timeline', { height: 999 });
    expect(store.value('layout', 'timeline').value).toEqual({ height: 200 });

    await store.set('layout', 'timeline', { height: 320 });
    await Luna.settle(() => seen.value?.height === 320, 'second client sees the set');

    await store.value('layout', 'timeline').set({ height: 330 });
    await Luna.settle(() => seen.value?.height === 330, 'second client sees the field write');
  });

  it('records an undoable set in the undo history and only that one (fact 129)', async () => {
    await store.add('layout', 'mixer', 1);
    await store.set('layout', 'mixer', 2);
    await store.set('layout', 'mixer', 3, { undoable: true });
    await session.undo();
    await Luna.settle(() => store.value('layout', 'mixer').value === 2, 'undo restores the value before the undoable set');
    await session.redo();
    await Luna.settle(() => store.value('layout', 'mixer').value === 3, 'redo');
  });

  it('refuses a set of a field that was never added (fact 129)', async () => {
    await expect(store.set('layout', 'missing', 1)).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
    await expect(luna.raw.post(`${session.path}/storage/add_field`, { context: CTX, record: 'a/b', field: 'x' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.raw.post(`${session.path}/storage/add_field`, { context: CTX, record: 'a' })).rejects.toMatchObject({ code: 'uasrv.missing_field' });
  });

  it('removes a field, a record and the context (fact 129)', async () => {
    await store.add('channels', 't1', { color: 'green' });
    await store.remove('layout', 'timeline');
    expect(store.value('layout', 'timeline').value).toBeUndefined();
    await store.remove('layout');
    await store.load();
    expect(store.records.value).toEqual(['channels']);
    await store.clear();
    expect(session.storage.contexts.value ?? []).not.toContain(CTX);
  });
});
