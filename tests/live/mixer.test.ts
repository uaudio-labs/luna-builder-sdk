/**
 * Live lane for the mixer surface: send routing (facts 43, 83), the pan layout (fact 84),
 * breakpoint values on the wire (fact 82), touched writes and undo (fact 85), derived view
 * pushes (fact 97), plugin slots (fact 86) and meters.
 *
 * Needs LUNA on 4718 with a session open that has a mono and a stereo track. It adds an aux
 * bus if the session has none, uses each track's last send and last insert slot, and puts
 * back what it touches; the undo entries remain, because the wire cannot drop them. It
 * never rolls the transport.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';
const B = Luna.TICKS_PER_BEAT;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
/** A stock plugin every macOS LUNA can load. */
const PLUGIN = 'com.appl.au.aufx_dely';

describe.skipIf(!live)('live: mixer', () => {
  let luna: Luna.Client;
  let session: Luna.Session;
  let mono: Luna.Track;
  let stereo: Luna.Track;
  let aux: Luna.Bus;
  let createdBus: string | undefined;

  const undoNames = async (): Promise<{ rowid: number; name: string }[]> => {
    const q = (await luna.raw.get(`${session.path}/undo_queues`, { children: true, levels: 2, commands: false, flatvalue: true, propfilter: ['rowid', 'name'] })) as { children?: { properties?: { rowid: number; name: string } }[] };
    return (q.children ?? []).map((c) => c.properties!).filter((r) => typeof r?.rowid === 'number').sort((a, b) => a.rowid - b.rowid);
  };
  const lastRow = async (): Promise<number> => (await undoNames()).at(-1)?.rowid ?? 0;
  const entriesSince = async (row: number): Promise<string[]> => {
    await sleep(400);
    return (await undoNames()).filter((r) => r.rowid > row).map((r) => r.name);
  };

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    session = await luna.session();
    await session.ready();
    const tracks = session.visibleTracks;
    for (const t of tracks) await t.load();
    mono = tracks.find((t) => t.stemFormat.value === 'mono')!;
    stereo = tracks.find((t) => t.stemFormat.value === 'stereo' && t.trackType.value === 'audio') ?? tracks.find((t) => t.stemFormat.value === 'stereo')!;
    if (!mono || !stereo) throw new Error('the open session needs a mono and a stereo track');
    let found = session.buses.items.find((b) => b.busType.value === 'aux');
    if (!found) {
      const reply = (await luna.raw.post(`${session.path}/new_track`, { uid: session.uid, name: 'SDK live FX', track_type: 'bus', stem_format: 'stereo' })) as { uid: string };
      createdBus = reply.uid;
      await Luna.settle(() => session.buses.byId(reply.uid) !== undefined, 'new aux bus', { refresh: () => session.buses.reload() });
      found = session.buses.byId(reply.uid)!;
    }
    aux = found;
    await Promise.all([mono.outputs.load(), stereo.outputs.load()]);
  });

  afterAll(async () => {
    if (createdBus) await session.deleteTracks([createdBus]).catch(() => undefined);
    await luna?.close();
  });

  it('routes a send: the row carries the bus uid, the handle is the assignment (fact 83)', async () => {
    const send = mono.outputs.byId('send_7')!;
    await send.unassign();
    const row = await lastRow();
    const uid = await send.assign(aux.id);
    expect(send.destinations.value).toEqual([expect.objectContaining({ uid, busUid: aux.id, busType: 'aux', error: undefined })]);
    expect(send.busUid.value).toBe(aux.id);
    const wire = (await luna.raw.get(send.path, { children: false, commands: false, flatvalue: true, propfilter: ['assignments', 'bus_uid'] })) as { properties: { assignments: { value: string }[]; bus_uid: unknown } };
    expect(wire.properties.assignments.map((a) => a.value)).toEqual([aux.id]);
    expect(wire.properties.bus_uid ?? null).toBe(null);
    await expect(luna.raw.post(`${session.path}/delete_output_assignment`, { session_uid: session.uid, uid: aux.id })).rejects.toMatchObject({ code: 'device.database_error' });
    expect(await entriesSince(row)).toEqual(['New Output Assignment']);

    await send.assign(aux.id); // appends (fact 43)
    expect(send.destinations.value).toHaveLength(2);
    const before = await lastRow();
    await send.retarget(aux.id);
    expect(send.destinations.value).toHaveLength(1);
    expect(await entriesSince(before)).toEqual(['Retarget send_7']);

    await send.unassign();
    expect(send.destinations.value).toEqual([]);
  });

  it('lays out pan by stem format on the main output and on sends (fact 84)', async () => {
    await Promise.all([mono.main.controls.load(), stereo.main.controls.load(), stereo.outputs.byId('send_0')!.controls.load()]);
    expect(mono.main.pans.map((c) => c.id)).toEqual(['pan']);
    expect(stereo.main.pans.map((c) => c.id)).toEqual(['pan_left', 'pan_right']);
    expect(stereo.outputs.byId('send_0')!.pans.map((c) => c.id)).toEqual(['pan_left', 'pan_right']);
    for (const c of [...mono.main.pans, ...stereo.main.pans]) expect(c.uid.value).toBeTruthy(); // real nodes, not phantoms
  });

  it('makes a one-shot control write one undo entry named after the control (fact 85)', async () => {
    await mono.loadStrip();
    const was = mono.gain.real.value;
    const row = await lastRow();
    await mono.gain.real.set(-4.5);
    const names = await entriesSince(row);
    expect(names).toEqual(['Volume Change']);
    await session.undo();
    await Luna.settle(() => mono.gain.real.value === was, 'undo the fader', { refresh: () => mono.main.controls.reload() });
  });

  it('pushes the derived views to the writer after a real write (fact 97)', async () => {
    await mono.loadStrip();
    const was = mono.gain.real.value as number;
    const normalizedWas = mono.gain.normalized.value;
    const target = was === -6.5 ? -5.5 : -6.5;
    try {
      await mono.gain.real.set(target);
      // The writer gets no echo of real_value (fact 6), but string_value and
      // normalized_value are derived, so their pushes must arrive without a reload.
      await Luna.settle(() => Number.parseFloat(mono.gain.display.value ?? '') === target, 'derived display push');
      expect(Number.parseFloat(mono.gain.display.value!)).toBe(target);
      expect(mono.gain.normalized.value).not.toBe(normalizedWas);
    } finally {
      await mono.gain.real.set(was);
    }
  });

  it('resets gain and pan to their defaults as one undo entry each (fact 92)', async () => {
    await Promise.all([mono.loadStrip(), mono.main.controls.load()]);
    const pan = mono.main.pans[0]!;
    const was = [mono.gain.normalized.value, pan.normalized.value];
    try {
      await mono.gain.real.set(-7.5);
      await pan.normalized.set(0.2);
      await sleep(800);
      const row = await lastRow();
      await mono.gain.resetToDefault();
      await sleep(700);
      await pan.resetToDefault();
      await Luna.settle(() => mono.gain.real.value === 0 && pan.normalized.value === 0.5, 'reset to defaults', { refresh: () => mono.main.controls.reload() });
      expect(await entriesSince(row)).toEqual(['Volume Change', 'Pan Change']);
    } finally {
      await mono.gain.normalized.set(was[0]!);
      await pan.normalized.set(was[1]!);
    }
  });

  it('keeps a whole-number breakpoint value, which LUNA would store as 0 if sent bare (fact 82)', async () => {
    await mono.loadStrip();
    const lane = mono.gain.automation;
    await lane.load();
    const at = 1000 * B;
    try {
      await lane.insert([{ tick: at, value: -6 }, { tick: at + B, value: -12 }]);
      expect(lane.breakpoints.filter((b) => b.tick >= at)).toEqual([{ tick: at, value: -6 }, { tick: at + B, value: -12 }]);
      await lane.setValue(at, -3);
      expect(lane.breakpoints.find((b) => b.tick === at)?.value).toBe(-3);
    } finally {
      await lane.clear(at, at + B).catch(() => undefined);
    }
    expect(lane.breakpoints.filter((b) => b.tick >= at)).toEqual([]);
  });

  it('loads a plugin by its instance id, lists live parameters only, and refuses an unknown one (fact 86)', async () => {
    await mono.effects.load();
    const slot = mono.effectSlots.filter((e) => e.isEmpty).at(-1);
    if (!slot) return console.log('fact 86 skipped: no empty insert slot on the mono track');
    try {
      await slot.setPlugin(PLUGIN);
      expect(slot.loaded.value).toBe(true);
      await slot.controls.load();
      const params = slot.params;
      expect(params.length).toBeGreaterThan(0);
      const param = params[0]!;
      // LUNA can fold a touched write made within a few hundred ms of the previous edit into
      // that edit's entry (fact 85), so leave a gap after the insert.
      await sleep(800);
      const row = await lastRow();
      // A plugin re-inserted into a slot it held before comes back with its old settings, and
      // writing the value already there makes no entry, so move it somewhere it is not.
      await param.normalized.set((param.normalized.value ?? 0) > 0.5 ? 0.2 : 0.8);
      expect(await entriesSince(row)).toEqual([`${param.name.value} Change`]); // touched, so undoable (fact 85)
      await slot.clear();
      await Luna.settle(() => slot.isEmpty, 'clear the slot');
      await slot.controls.reload();
      expect(slot.params).toEqual([]); // the old parameters linger as ghosts
      await expect(slot.setPlugin('com.nope.nothing')).rejects.toMatchObject({ code: 'mixer.missing_plug-in' });
    } finally {
      await slot.clear().catch(() => undefined);
    }
  });

  it('meters a stereo channel with two streams, subscribed only while listened to', async () => {
    const meter = session.master!.meter;
    const stop = meter.onChange(() => undefined);
    try {
      await Luna.settle(() => meter.numStreams.value !== undefined, 'meter load');
      expect(meter.streams).toBe(2);
      expect(meter.max).toBeGreaterThanOrEqual(0);
    } finally {
      stop();
    }
  });
});
