/**
 * Live lane for session preferences (fact 110). Needs a LUNA with session preferences on 4718
 * and a session open. Everything is written under a context of its own, which is removed at the
 * end, so the session's other preferences are untouched. The undoable edit is undone again.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';
const CTX = `com.uaudio.sdk-live-test.${Date.now()}`;

describe.skipIf(!live)('live: session preferences', () => {
  let luna: Luna.Client;
  let other: Luna.Client;
  let session: Luna.Session;
  let prefs: Luna.PreferenceContext;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    session = await luna.session();
    await session.ready();
    prefs = session.preferences.context(CTX);
    other = await Luna.connect({ requestTimeoutMs: 8000 });
  });

  afterAll(async () => {
    await prefs?.clear().catch(() => undefined);
    await other?.close();
    await luna?.close();
  });

  it('adds, sets and reaches a second client (fact 110)', async () => {
    const otherSession = await other.session();
    expect(otherSession.uid).toBe(session.uid);
    await otherSession.ready();
    const seen = otherSession.preferences.context(CTX).value<{ height: number }>('layout', 'timeline');

    await prefs.add('layout', 'timeline', { height: 200 });
    expect(prefs.value('layout', 'timeline').value).toEqual({ height: 200 });
    await prefs.add('layout', 'timeline', { height: 999 });
    expect(prefs.value('layout', 'timeline').value).toEqual({ height: 200 });

    await prefs.set('layout', 'timeline', { height: 320 });
    await Luna.settle(() => seen.value?.height === 320, 'second client sees the set');

    await prefs.value('layout', 'timeline').set({ height: 330 });
    await Luna.settle(() => seen.value?.height === 330, 'second client sees the property write');
  });

  it('records an undoable set in the undo history and only that one (fact 110)', async () => {
    await prefs.add('layout', 'mixer', 1);
    await prefs.set('layout', 'mixer', 2);
    await prefs.set('layout', 'mixer', 3, { undoable: true });
    await session.undo();
    await Luna.settle(() => prefs.value('layout', 'mixer').value === 2, 'undo restores the value before the undoable set');
    await session.redo();
    await Luna.settle(() => prefs.value('layout', 'mixer').value === 3, 'redo');
  });

  it('refuses a set of a property that was never added (fact 110)', async () => {
    await expect(prefs.set('layout', 'missing', 1)).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
    await expect(luna.raw.post(`${session.path}/preferences/add_preference`, { context: CTX, preference: 'a/b', property: 'x' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.raw.post(`${session.path}/preferences/add_preference`, { context: CTX, preference: 'a' })).rejects.toMatchObject({ code: 'uasrv.missing_field' });
  });

  it('removes a property, a preference and the context (fact 110)', async () => {
    await prefs.add('channels', 't1', { color: 'green' });
    await prefs.remove('layout', 'timeline');
    expect(prefs.value('layout', 'timeline').value).toBeUndefined();
    await prefs.remove('layout');
    await prefs.load();
    expect(prefs.preferences.value).toEqual(['channels']);
    await prefs.clear();
    expect(session.preferences.contexts.value ?? []).not.toContain(CTX);
  });
});
