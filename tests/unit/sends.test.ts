/**
 * Send routing on `Output`: assign, unassign, retarget and move (facts 43, 83), and the
 * stereo pan layout (fact 84). The mock reproduces LUNA's assignment model: rows carry the
 * bus uid, the handle is the `assignment_objects/<uid>` node, and `bus_uid` stays null.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Drums', 'Bass'], name: 'Demo' });
  engine.addBus('abc', 'fx', { name: 'FX', busType: 'aux', stemFormat: 'stereo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  const drums = session.tracks.byId('Drums')!;
  const bass = session.tracks.byId('Bass')!;
  await Promise.all([drums.outputs.load(), bass.outputs.load()]);
  const fx = session.buses.byId('fx')!;
  const master = session.master!;
  return { engine, luna, session, drums, bass, fx, master };
}

const names = (out: Luna.Output): string[] => (out.destinations.value ?? []).map((d) => d.name);

describe('Luna.Output routing', () => {
  it('identifies sends, cues and the main output', async () => {
    const { drums } = await connected();
    const send0 = drums.outputs.byId('send_0')!;
    expect([send0.isSend, send0.isCue, send0.index]).toEqual([true, false, 0]);
    const cue1 = drums.outputs.byId('cue_1')!;
    expect([cue1.isSend, cue1.isCue, cue1.index]).toEqual([false, true, 1]);
    expect([drums.main.isSend, drums.main.isCue, drums.main.index]).toEqual([false, false, undefined]);
  });

  it('assigns a send and resolves once the destination is listed, with the bus uid derived (fact 83)', async () => {
    const { engine, drums, fx } = await connected();
    const send = drums.outputs.byId('send_0')!;
    const uid = await send.assign(fx.id);
    expect(send.destinations.value).toEqual([{ uid, busUid: 'fx', name: 'FX', busType: 'aux', stereo: true, error: undefined }]);
    expect(send.destination.value?.uid).toBe(uid);
    expect(send.busUid.value).toBe('fx');
    expect(send.assigned).toBe(true);
    // LUNA's own property stays null; the row's `value` is the bus, not the assignment.
    expect(engine.value(send.path, 'bus_uid')).toBe(null);
    expect((engine.value(send.path, 'assignments') as Array<{ value: string }>)[0]!.value).toBe('fx');
  });

  it('appends on a second assign, which is why retarget exists (fact 43)', async () => {
    const { drums, fx, master } = await connected();
    const send = drums.outputs.byId('send_0')!;
    await send.assign(fx.id);
    await send.assign(master.id);
    expect(names(send)).toEqual(['FX', 'Main Output']); // appended, not replaced

    await send.retarget(fx.id);
    expect(names(send)).toEqual(['FX']); // replaced
  });

  it('retargets a routed send as one named batch, and joins a caller batch instead of nesting', async () => {
    const { engine, session, drums, fx, master } = await connected();
    const send = drums.outputs.byId('send_0')!;
    await send.assign(fx.id);
    engine.transactions.length = 0;
    await send.retarget(master.id);
    expect(engine.transactions).toEqual(['begin', 'commit']);
    expect(engine.requests.find((r) => r.path === '/sessions/abc/begin_transaction')).toMatchObject({ data: { name: 'Retarget send_0' } });

    engine.transactions.length = 0;
    await session.transaction('Scene', async () => {
      await send.retarget(fx.id);
    });
    expect(engine.transactions).toEqual(['begin', 'commit']);
    expect(names(send)).toEqual(['FX']);
  });

  it('unassigns one destination by its assignment uid, or all of them', async () => {
    const { drums, fx, master } = await connected();
    const send = drums.outputs.byId('send_0')!;
    const first = await send.assign(fx.id);
    await send.assign(master.id);
    await send.unassign(first);
    expect(names(send)).toEqual(['Main Output']);
    await send.unassign();
    expect(send.destinations.value).toEqual([]);
    expect(send.busUid.value).toBe(null);
    await send.unassign(); // nothing to remove: a no-op
  });

  it('rejects a bus uid as the deletion handle, as LUNA does (fact 83)', async () => {
    const { luna, drums, fx } = await connected();
    const send = drums.outputs.byId('send_0')!;
    await send.assign(fx.id);
    await expect(luna.raw.post('/sessions/abc/delete_output_assignment', { session_uid: 'abc', uid: 'fx' })).rejects.toMatchObject({ code: 'device.database_error' });
    await expect(luna.raw.post('/sessions/abc/delete_output_assignment', { session_uid: 'abc', uid: 'nope' })).rejects.toMatchObject({ code: 'uasrv.invalid_type' });
    expect(names(send)).toEqual(['FX']);
  });

  it('keeps a dangling destination with device.missing_bus when its bus is deleted', async () => {
    const { engine, luna, drums, fx } = await connected();
    const send = drums.outputs.byId('send_0')!;
    const uid = await send.assign(fx.id);
    await luna.raw.post('/sessions/abc/delete_tracks', { session_uid: 'abc', track_uid: 'fx' });
    await engine.settled();
    expect(send.destinations.value).toEqual([{ uid, busUid: undefined, name: 'FX', busType: 'aux', stereo: true, error: 'device.missing_bus' }]);
    await send.unassign(uid);
    expect(send.destinations.value).toEqual([]);
  });

  it('follows routing made by another client', async () => {
    const { engine, drums, fx } = await connected();
    const other = await Luna.connect({ port_: engine.port() });
    const otherSession = await other.session();
    await otherSession.ready();
    const theirs = otherSession.tracks.byId('Drums')!;
    await theirs.outputs.load();
    const send = drums.outputs.byId('send_2')!;
    send.destinations.onChange(() => undefined);
    await theirs.outputs.byId('send_2')!.assign(fx.id);
    await engine.settled();
    await Luna.settle(() => names(send).length === 1, 'second client routing');
    expect(names(send)).toEqual(['FX']);
  });

  it('moves a send to another channel under a new uid, and copies without emptying the source', async () => {
    const { drums, bass, fx } = await connected();
    const from = drums.outputs.byId('send_0')!;
    const to = bass.outputs.byId('send_0')!;
    const uid = await from.assign(fx.id);

    await from.moveTo(bass.id);
    await Luna.settle(() => names(to).length === 1, 'moved');
    expect(names(to)).toEqual(['FX']);
    expect(to.destination.value?.uid).not.toBe(uid);
    expect(names(from)).toEqual([]);

    await to.moveTo(drums.id, { copy: true });
    await Luna.settle(() => names(from).length === 1, 'copied');
    expect(names(from)).toEqual(['FX']);
    expect(names(to)).toEqual(['FX']); // the copy left the source routed
  });

  it('refuses a send slot outside 0..7 before the wire', async () => {
    const { drums, bass } = await connected();
    await expect(drums.outputs.byId('send_0')!.moveTo(bass.id, { index: 8 })).rejects.toMatchObject({ code: 'out_of_range' });
  });

  it('exposes pre_fader and enabled as controls, not properties', async () => {
    const { engine, drums } = await connected();
    const send = drums.outputs.byId('send_0')!;
    await send.controls.load();
    expect(send.preFader.isSwitch).toBe(true);
    expect(send.enabled.isSwitch).toBe(true);
    await send.preFader.toggle();
    await engine.settled();
    expect(engine.value(send.preFader.path, 'real_value')).toBe(true);
  });

  it('refuses to route or move a cue output; LUNA routes cue outputs to CUE 1-4 itself', async () => {
    const { session, drums, master } = await connected();
    const cue = drums.outputs.byId('cue_0')!;
    await expect(cue.assign(master.id)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(cue.moveTo(drums.id)).rejects.toMatchObject({ code: 'out_of_range' });
    await Luna.settle(() => names(cue).length === 1, 'cue routing');
    expect(cue.destination.value).toMatchObject({ name: 'CUE 1', busType: 'cue_0' });
    expect(session.buses.items.filter((b) => b.busType.value?.startsWith('cue_')).map((b) => b.name.value)).toEqual(['CUE 1', 'CUE 2', 'CUE 3', 'CUE 4']);
  });

  it('refuses to route an output that is not on a channel', async () => {
    const { luna } = await connected();
    const stray = new Luna.Output(luna, '/gui/outputs/send_0');
    await expect(stray.assign('x')).rejects.toMatchObject({ code: 'unavailable' });
  });
});

describe('Luna.Output pan', () => {
  it('is one `pan` on a mono channel and `pan_left`/`pan_right` on a stereo one (fact 84)', async () => {
    const { engine, session, drums, master } = await connected();
    await session.newTrack({ name: 'Keys', trackType: 'audio', stemFormat: 'stereo' });
    await engine.settled();
    await session.tracks.reload();
    const keys = session.tracksInOrder.find((t) => t.name.value === 'Keys')!;
    await keys.outputs.load();
    await Promise.all([drums.main.controls.load(), keys.main.controls.load(), master.main.controls.load()]);

    expect(drums.main.stereo).toBe(false);
    expect(drums.pan.id).toBe('pan');
    expect(drums.main.pans.map((c) => c.id)).toEqual(['pan']);

    expect(keys.main.stereo).toBe(true);
    expect(keys.pan.id).toBe('pan_left');
    expect(keys.main.panRight.id).toBe('pan_right');
    expect(keys.main.pans.map((c) => c.id)).toEqual(['pan_left', 'pan_right']);
    expect(master.main.pans.map((c) => c.id)).toEqual(['pan_left', 'pan_right']);

    const send = keys.outputs.byId('send_0')!;
    await send.controls.load();
    expect(send.pans.map((c) => c.id)).toEqual(['pan_left', 'pan_right']);
    expect(send.pan.discrete.value).toBe(false); // a real control, not a phantom path
  });

  it('knows a stereo channel from its stem format before the controls load', async () => {
    const { engine, session } = await connected();
    await session.newTrack({ name: 'Pad', trackType: 'audio', stemFormat: 'stereo' });
    await engine.settled();
    await session.tracks.reload();
    const pad = session.tracksInOrder.find((t) => t.name.value === 'Pad')!;
    await pad.load();
    expect(pad.main.stereo).toBe(true);
    expect(pad.pan.id).toBe('pan_left');
  });
});
