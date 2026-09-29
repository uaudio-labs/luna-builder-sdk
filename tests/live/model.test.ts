/**
 * Live lane for the domain model. Needs LUNA on 4718 with a session open.
 * Read-mostly: the writes toggle a track's mute, add and delete a marker, turn an audio
 * track's input monitor on for as long as it takes to read it back, and move the play start
 * and loop marks while stopped; each is restored.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';

describe.skipIf(!live)('live: model', () => {
  let luna: Luna.Client;
  let session: Luna.Session;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    session = await luna.session();
  });

  afterAll(async () => {
    await luna?.close();
  });

  it('loads the focused session with tracks, buses and playlists', () => {
    expect(session.loaded.value).toBe(true);
    expect(typeof session.name.value).toBe('string');
    expect(session.master?.busType.value).toBe('master');
    expect(session.tracks.items.length).toBeGreaterThan(0);
    for (const t of session.tracks.items) {
      expect(typeof t.name.value).toBe('string');
      expect(t.trackType.value).toBeDefined();
      expect(session.playlistFor(t)?.trackUid.value).toBe(t.id);
    }
    expect(session.sources?.path).toMatch(/^\/workspace\/sessions\/[0-9a-f]+\/audio$/);
  });

  it('reads the transport and follows location', async () => {
    const t = session.transport;
    expect(typeof t.playing.value).toBe('boolean');
    expect(typeof t.location.value?.tick).toBe('number');
    expect(Luna.formatBarBeat(t.location.value?.bar_beat)).toMatch(/^\d+\|\d+\|\d{3}$/);
    // Fact 96: location carries min_sec. The wasm engine sends fractional seconds; log the
    // raw value so a run records what native LUNA sends (the fact's open check).
    const minSec = t.location.value?.min_sec;
    expect(minSec).toMatchObject({ minutes: expect.any(Number), seconds: expect.any(Number) });
    console.info('[live] location.min_sec =', JSON.stringify(minSec));
    expect(typeof t.seconds).toBe('number');
    expect(t.seconds).toBeGreaterThanOrEqual(0);
  });

  it('reads main output controls and the meter path of the first track', async () => {
    const track = session.tracks.items[0]!;
    await track.loadStrip();
    expect(track.gain.controlType.value).toBe('gain');
    expect(typeof track.gain.normalized.value).toBe('number');
    expect(typeof track.gain.display.value).toBe('string');
    expect(track.mute.isSwitch).toBe(true);
    await track.controls.load();
    expect(track.solo.controlType.value).toBe('solo');
  });

  it('lists effect slots, the plugin catalog and musical structure', async () => {
    const track = session.visibleTracks[0] ?? session.tracks.items[0]!;
    await track.effects.load();
    expect(track.effectSlots.length).toBeGreaterThanOrEqual(4);
    expect(track.effects.byId('console')?.insertType.value).toBe('console');
    await luna.plugins.load();
    expect(luna.plugins.items.length).toBeGreaterThan(10);
    expect(luna.plugins.categories.length).toBeGreaterThan(0);
    expect(session.musical.tempoAt(0)).toBeGreaterThan(0);
    expect(session.musical.timeSignatures.items[0]?.numerator.value).toBeDefined();
    expect(session.musical.timeline.barBeat(0)).toEqual({ bar: 1, beat: 1, tick: 0 });
    expect(session.context.contextType.value).toBe('main');
  });

  it('queries the workspace and reads the LUNA host surface', async () => {
    const recent = await luna.workspace.recent(3);
    expect(recent.length).toBeGreaterThan(0);
    expect(recent[0]).toMatchObject({ uid: expect.any(String), name: expect.any(String), online: expect.any(Boolean) });
    await Promise.all([luna.gui.addOns.load(), luna.gui.windows.load(), luna.drivers.load()]);
    expect(luna.gui.main.page.value).toBeDefined();
    expect(Array.isArray(luna.drivers.connected.value)).toBe(true);
    expect(luna.gui.addOns.items.every((a) => typeof a.title.value === 'string')).toBe(true);
  });

  it('adds and deletes a marker', async () => {
    session.markers.onChange(() => undefined);
    const before = session.markers.items.length;
    await session.addMarker(Luna.WHOLE_NOTE * 64, 'builder-live-probe');
    await new Promise((r) => setTimeout(r, 300));
    const marker = session.markers.items.find((m) => m.name.value === 'builder-live-probe') ?? (await (async () => {
      await Promise.all(session.markers.items.map((m) => m.load()));
      return session.markers.items.find((m) => m.name.value === 'builder-live-probe');
    })());
    expect(marker).toBeDefined();
    expect(marker!.location.value).toBe(Luna.WHOLE_NOTE * 64);
    await marker!.delete();
    await new Promise((r) => setTimeout(r, 300));
    expect(session.markers.items.length).toBe(before);
  });

  it('writes the input monitor switch and reads the live state (fact 88)', async () => {
    const track = session.tracks.items.find((t) => t.trackType.value === 'audio' && t.recordEnabled.value === false && t.inputMonitor.value === false);
    if (!track) return console.info('input monitor: no unarmed, unmonitored audio track; skipped');
    const reload = (): Promise<unknown> => luna.store.load(track.path, { children: false, commands: false, propfilter: ['input_monitor', 'input_monitor_state'] });
    expect(track.inputMonitoring.value).toBe(false); // unarmed with the switch off
    await luna.preferences.load();
    if (luna.preferences.property<boolean>('record_mute').value === true) {
      // Monitoring through the built-in mic and speakers is what record mute prevents.
      await expect(track.inputMonitor.set(true)).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
      await reload();
      expect(track.inputMonitor.value).toBe(false);
      expect(track.inputMonitoring.value).toBe(false);
      return console.info('input monitor: record mute is on, so only the refusal was measured');
    }
    try {
      await track.inputMonitor.set(true);
      await Luna.settle(() => track.inputMonitoring.value === true, 'input monitor on', { refresh: reload });
    } finally {
      await track.inputMonitor.set(false);
    }
    await Luna.settle(() => track.inputMonitoring.value === false, 'input monitor off', { refresh: reload });
    expect(track.inputMonitor.value).toBe(false);
  });

  it('seeks to bar 1 and returns to zero, then restores the play start (facts 89-91)', async () => {
    const t = session.transport;
    const marks = ['play_start', 'loop_start', 'loop_stop'] as const;
    const was = (await luna.raw.get(session.path, { flatvalue: true, children: false, commands: false, propfilter: [...marks, 'playing', 'arrangement_start'] })) as { properties: Record<string, number | boolean> };
    if (was.properties['playing'] === true) return console.info('seek: the transport is rolling; skipped');
    try {
      await t.seek({ bar: 1 });
      expect(t.location.value?.bar_beat).toEqual({ bar: 1, beat: 1, tick: 0 });
      expect(t.location.value?.tick).toBe(session.musical.timeline.tickAtBar(1));
      await t.returnToZero();
      expect(t.location.value?.tick).toBe(was.properties['arrangement_start'] ?? 0);
      expect(t.loopStart.value).toBe(t.location.value?.tick);
    } finally {
      // Raw writes, so the loop marks come back as they were rather than collapsed by seek().
      for (const m of marks) await luna.raw.set(`${session.path}/${m}`, was.properties[m]);
    }
    await Luna.settle(() => t.location.value?.tick === was.properties['play_start'], 'restore play start', {
      refresh: () => luna.store.load(session.path, { children: false, commands: false, propfilter: [...marks, 'location'] }),
    });
  });

  it('toggles mute with touch bracketing and restores it', async () => {
    const track = session.tracks.items[0]!;
    await track.loadStrip();
    const before = track.mute.on;
    await track.mute.toggle();
    await new Promise((r) => setTimeout(r, 300));
    expect(track.mute.on).toBe(!before);
    await track.mute.real.set(before);
    await new Promise((r) => setTimeout(r, 300));
    expect(track.mute.on).toBe(before);
  });
});
