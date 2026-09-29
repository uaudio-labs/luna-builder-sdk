import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function tick(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

async function connected(tracks: string[] = ['Vocal', 'Bass']) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks, name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  return { engine, luna };
}

describe('Luna.Sessions', () => {
  it('lists open sessions and the focused one', async () => {
    const { luna } = await connected();
    await luna.sessions.ready();
    expect(luna.sessions.items.items.map((s) => s.uid)).toEqual(['abc']);
    expect(luna.sessions.focusedUid.value).toBe('abc');
    expect(luna.sessions.focused.value?.uid).toBe('abc');
    expect(luna.sessions.current()?.uid).toBe('abc');
  });

  it('throws NoSessionOpen when nothing is open', async () => {
    const engine = new Luna.MockEngine();
    const luna = await Luna.connect({ port_: engine.port() });
    await expect(luna.session()).rejects.toBeInstanceOf(Luna.NoSessionOpen);
  });

  it('creates a session, loads it and waits for loaded (fact 15)', async () => {
    const engine = new Luna.MockEngine();
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.sessions.create({ name: 'New' });
    expect(session.uid).toBe('s1');
    expect(session.loaded.value).toBe(true);
    expect(session.name.value).toBe('New');
    expect(engine.requests.map((r) => r.path).filter((p) => p.includes('_session'))).toEqual(['/sessions/new_session', '/sessions/load_session']);
    await engine.settled();
    expect(luna.sessions.focusedUid.value).toBe('s1');
  });

  it('tracks sessions closing', async () => {
    const { engine, luna } = await connected();
    const session = await luna.session();
    let changes = 0;
    luna.sessions.items.onChange(() => changes++);
    await session.close();
    await engine.settled();
    expect(luna.sessions.items.items).toEqual([]);
    await luna.settled();
    expect(changes).toBe(1);
  });
});

describe('Luna.Session', () => {
  it('loads properties, tracks, buses and playlists in ready()', async () => {
    const { luna } = await connected();
    const session = await luna.session();
    expect(session.name.value).toBe('Demo');
    expect(session.tracks.items.map((t) => t.name.value)).toEqual(['Vocal', 'Bass']);
    expect(session.tracks.byId('Vocal')?.trackType.value).toBe('audio');
    expect(session.master?.name.value).toBe('Main Output');
    expect(session.master?.isMaster).toBe(true);
    expect(session.playlists.items).toHaveLength(2);
    const vocal = session.tracks.byId('Vocal')!;
    expect(session.playlistFor(vocal)?.trackUid.value).toBe('Vocal');
    expect(session.sources?.path).toBe('/workspace/sessions/pkg_abc/audio');
  });

  it('hides system click and count_in tracks from visibleTracks (fact 28)', async () => {
    const { engine, luna } = await connected(['Vocal']);
    engine.addTrack('abc', 'click', { name: 'CLICK', trackType: 'click' });
    engine.addTrack('abc', 'cin', { name: 'count_in', trackType: 'count_in' });
    await engine.settled();
    const session = await luna.session();
    expect(session.tracksInOrder.map((t) => t.id)).toEqual(['Vocal', 'click', 'cin']);
    expect(session.visibleTracks.map((t) => t.id)).toEqual(['Vocal']);
  });

  it('follows tracks added and removed by the engine and by commands', async () => {
    const { engine, luna } = await connected(['A']);
    const session = await luna.session();
    const seen: string[][] = [];
    session.tracks.onChange(() => seen.push(session.tracks.items.map((t) => t.id)));

    const reply = (await session.newTrack({ name: 'B' })) as { track_uid: string };
    expect(reply.track_uid).toBe('t2');
    await engine.settled();
    expect(session.tracks.items.map((t) => t.id)).toEqual(['A', 't2']);
    // properties of the new track arrive by push (structural add carries no data)
    await session.tracks.byId('t2')!.load();
    expect(session.tracks.byId('t2')!.name.value).toBe('B');

    await luna.settled();
    await session.tracks.byId('A')!.delete();
    await engine.settled();
    expect(session.tracks.items.map((t) => t.id)).toEqual(['t2']);
    await luna.settled();
    expect(seen).toEqual([['A', 't2'], ['t2']]);
  });

  it('runs transactions and aborts on throw', async () => {
    const { engine, luna } = await connected();
    const session = await luna.session();
    const result = await session.transaction('Rename', async () => {
      await session.tracks.byId('Vocal')!.name.set('Lead');
      return 42;
    });
    expect(result).toBe(42);
    await expect(
      session.transaction('Boom', async () => {
        throw new Error('nope');
      }),
    ).rejects.toThrow('nope');
    expect(engine.transactions).toEqual(['begin', 'commit', 'begin', 'abort']);
    expect(engine.value('/sessions/abc/tracks/Vocal', 'name')).toBe('Lead');
  });

  it('posts undo/redo/save with the session uid', async () => {
    const { engine, luna } = await connected();
    const session = await luna.session();
    await session.undo();
    await session.redo(2);
    await session.save({ label: 'v1' });
    const posts = engine.requests.filter((r) => r.verb === 'post').map((r) => [r.path.split('/').pop(), r.data]);
    expect(posts).toEqual(
      expect.arrayContaining([
        ['undo', { session_uid: 'abc', count: 1 }],
        ['redo', { session_uid: 'abc', count: 2 }],
        ['save_session', { session_uid: 'abc', label: 'v1' }],
      ]),
    );
  });
});

describe('Luna.Transport', () => {
  it('plays, stops, seeks and loops through property writes', async () => {
    const { engine, luna } = await connected();
    const t = (await luna.session()).transport;
    expect(t.playing.value).toBe(false);
    await t.play();
    expect(t.playing.value).toBe(true);
    expect(engine.value('/sessions/abc', 'playing')).toBe(true);
    await t.toggle();
    expect(engine.value('/sessions/abc', 'playing')).toBe(false);
    await t.seek(Luna.WHOLE_NOTE);
    await t.setLoop(0, Luna.WHOLE_NOTE * 2);
    expect(engine.value('/sessions/abc', 'play_start')).toBe(Luna.WHOLE_NOTE);
    expect(engine.value('/sessions/abc', 'loop_stop')).toBe(Luna.WHOLE_NOTE * 2);
    expect(t.tick).toBe(Luna.WHOLE_NOTE); // stopped, the location follows the play start (fact 90)
    await t.sync('next_bar');
    expect(engine.requests.at(-1)).toMatchObject({ path: '/sessions/abc/sync_playback', data: { session_uid: 'abc', next_bar: true, loop_end: false } });
  });

  it('seeks to a bar in a session whose bar 1 is not at tick 0 (fact 91)', async () => {
    const { engine, luna } = await connected();
    // Measured on LUNA 3.0: a bar 0 before bar 1, then 3/4 at bar 73 and 4/4 again at bar 74.
    engine.setValue('/sessions/abc/time_signatures/1', 'tick', 8842824576);
    engine.addNode('/sessions/abc/time_signatures/0', { properties: { tick: -375157175424, bar: 0, partial: false, numerator: 4, denominator: 4 } });
    engine.addNode('/sessions/abc/time_signatures/2', { properties: { tick: 27656842824576, bar: 73, partial: false, numerator: 3, denominator: 4 } });
    engine.addNode('/sessions/abc/time_signatures/3', { properties: { tick: 27944842824576, bar: 74, partial: false, numerator: 4, denominator: 4 } });
    await engine.settled();
    const session = await luna.session();
    const t = session.transport;

    await t.seek({ bar: 1 });
    expect(t.location.value?.tick).toBe(8842824576);
    expect(t.location.value?.bar_beat).toEqual({ bar: 1, beat: 1, tick: 0 });
    await t.seek(0);
    expect(t.location.value?.bar_beat).toMatchObject({ bar: 0, beat: 4 }); // tick 0 is not bar 1
    await t.seek({ bar: 74, beat: 2 });
    expect(t.location.value?.bar_beat).toEqual({ bar: 74, beat: 2, tick: 0 });
    expect(t.location.value?.tick).toBe(27944842824576 + Luna.TICKS_PER_BEAT);
  });

  it('collapses the loop marks onto the target, as LUNA does (fact 89)', async () => {
    const { engine, luna } = await connected();
    const t = (await luna.session()).transport;
    await t.setLoop(0, Luna.WHOLE_NOTE * 4);
    await t.seek({ bar: 3 });
    for (const p of ['play_start', 'loop_start', 'loop_stop']) expect(engine.value('/sessions/abc', p)).toBe(Luna.WHOLE_NOTE * 2);
    await expect(t.seek(1.5)).rejects.toMatchObject({ code: 'out_of_range' });
  });

  it('returns to the arrangement start, which is tick 0 until set (fact 89)', async () => {
    const { engine, luna } = await connected();
    const t = (await luna.session()).transport;
    await t.seek({ bar: 9 });
    await t.returnToZero();
    expect(t.location.value?.tick).toBe(0);
    engine.setValue('/sessions/abc', 'arrangement_start', Luna.WHOLE_NOTE);
    await t.seek({ bar: 9 });
    await t.returnToZero();
    expect(t.location.value?.tick).toBe(Luna.WHOLE_NOTE);
    expect(t.arrangementStart.value).toBe(Luna.WHOLE_NOTE);
    expect(engine.value('/sessions/abc', 'loop_stop')).toBe(Luna.WHOLE_NOTE);
  });

  it('jumps the playhead while playing with sync_playback (fact 90)', async () => {
    const { engine, luna } = await connected();
    const t = (await luna.session()).transport;
    await t.play();
    await engine.settled();
    await t.seek({ bar: 5 });
    expect(engine.requests.filter((r) => r.path === '/sessions/abc/sync_playback').at(-1)).toMatchObject({ data: { next_bar: false, loop_end: false } });
    await engine.settled();
    expect(t.location.value?.tick).toBe(Luna.WHOLE_NOTE * 4);
    await t.returnToZero({ sync: 'next_bar' });
    expect(engine.requests.filter((r) => r.path === '/sessions/abc/sync_playback').at(-1)).toMatchObject({ data: { next_bar: true, loop_end: false } });
    expect(engine.value('/sessions/abc', 'play_start')).toBe(0);
  });

  it('follows location pushes and formats bar|beat', async () => {
    const { engine, luna } = await connected();
    const t = (await luna.session()).transport;
    let calls = 0;
    t.location.onChange(() => calls++);
    engine.setValue('/sessions/abc', 'location', { tick: Luna.TICKS_PER_BEAT * 5 + Luna.TICKS_PER_DISPLAY_TICK * 120, bar_beat: { bar: 2, beat: 2, tick: Luna.TICKS_PER_DISPLAY_TICK * 120 } });
    await engine.settled();
    await luna.settled();
    expect(calls).toBe(1);
    expect(Luna.formatBarBeat(t.location.value?.bar_beat)).toBe('2|2|120');
    expect(t.tick).toBe(Luna.TICKS_PER_BEAT * 5 + Luna.TICKS_PER_DISPLAY_TICK * 120);
  });
});

describe('Luna.Track and Luna.Control', () => {
  it('exposes gain/pan/mute on the main output and solo on the track', async () => {
    const { luna } = await connected();
    const track = (await luna.session()).tracks.byId('Vocal')!;
    await track.loadStrip();
    expect(track.gain.path).toBe('/sessions/abc/tracks/Vocal/outputs/main/controls/gain');
    expect(track.solo.path).toBe('/sessions/abc/tracks/Vocal/controls/solo');
    expect(track.gain.display.value).toBe('0.0');
    expect(track.gain.normalized.value).toBe(0.78);
    expect(track.pan.display.value).toBe('C');
    expect(track.mute.isSwitch).toBe(true);
    expect(track.mute.on).toBe(false);
  });

  it('brackets a one-shot write with set_touch and leaves a drag to begin/end', async () => {
    const { engine, luna } = await connected();
    const track = (await luna.session()).tracks.byId('Vocal')!;
    await track.loadStrip();
    const gain = track.gain;

    await gain.real.set(-6);
    expect(engine.touches).toEqual([`${gain.path}:on`, `${gain.path}:off`]);
    expect(engine.value(gain.path, 'real_value')).toBe(-6);

    engine.touches.length = 0;
    gain.begin();
    gain.begin(); // nested
    await gain.normalized.set(0.5);
    await gain.normalized.set(0.6);
    gain.end();
    expect(gain.inGesture).toBe(true);
    gain.end();
    await tick();
    expect(engine.touches).toEqual([`${gain.path}:on`, `${gain.path}:off`]);
    expect(engine.value(gain.path, 'normalized_value')).toBe(0.6);
  });

  it('brackets switches even when not automatable, so exclusive solo applies (fact 78)', async () => {
    const { engine, luna } = await connected();
    const track = (await luna.session()).tracks.byId('Vocal')!;
    await Promise.all([track.loadStrip(), track.controls.load()]);
    expect(track.solo.automatable.value).toBe(false);
    expect(track.solo.touchable).toBe(true);
    await track.solo.toggle();
    expect(engine.touches).toEqual([`${track.solo.path}:on`, `${track.solo.path}:off`]);
    expect(engine.value(track.solo.path, 'real_value')).toBe(true);
    await track.mute.toggle();
    expect(engine.value(track.mute.path, 'real_value')).toBe(true);
    expect(engine.touches).toHaveLength(4);
    expect(engine.value(track.mute.path, 'touch_count')).toBe(0);
  });

  it('does not touch a continuous control that is not automatable', async () => {
    const { engine, luna } = await connected();
    const path = '/sessions/abc/tracks/Vocal/controls/meter_point';
    engine.addControl(path, 'parameter', { discrete: false, value: 0.5, real: 0.5, str: '0.5', automatable: false });
    const control = new Luna.Control(luna, path);
    await control.load();
    expect(control.touchable).toBe(false);
    await control.normalized.set(0.2);
    control.begin();
    await control.normalized.set(0.3);
    control.end();
    await tick();
    expect(engine.touches).toEqual([]);
    expect(engine.value(path, 'normalized_value')).toBe(0.3);
  });

  it('releases only the touch a gesture took', async () => {
    const { engine, luna } = await connected();
    const track = (await luna.session()).tracks.byId('Vocal')!;
    await track.loadStrip();
    const gain = track.gain;
    gain.end(); // stray pointer up: nothing to release
    gain.begin();
    await gain.normalized.set(0.4);
    expect(engine.value(gain.path, 'touch_count')).toBe(1);
    gain.end();
    gain.end();
    await tick();
    expect(engine.touches).toEqual([`${gain.path}:on`, `${gain.path}:off`]);
    expect(engine.value(gain.path, 'touch_count')).toBe(0);
  });

  it('rejects a release the engine never saw a touch for (mock, fact 78)', async () => {
    const { luna } = await connected();
    const track = (await luna.session()).tracks.byId('Vocal')!;
    await track.loadStrip();
    await expect(luna.raw.post(`${track.gain.path}/set_touch`, { touch: false })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
  });

  it('resets a control to its engine default, touch-bracketed (fact 92)', async () => {
    const { engine, luna } = await connected();
    const track = (await luna.session()).tracks.byId('Vocal')!;
    await track.loadStrip();
    const { gain, pan } = track;
    await Promise.all([gain.real.set(-12), pan.normalized.set(0.2)]);
    engine.touches.length = 0;

    await gain.resetToDefault();
    await pan.resetToDefault();
    await engine.settled();
    expect(engine.touches).toEqual([`${gain.path}:on`, `${gain.path}:off`, `${pan.path}:on`, `${pan.path}:off`]);
    expect(engine.requests.filter((r) => r.path.endsWith('/set_control_default_value')).map((r) => r.data)).toEqual([{}, {}]);
    expect([gain.real.value, gain.normalized.value, gain.display.value]).toEqual([0, 0.78, '0.0']);
    expect([pan.normalized.value, pan.display.value]).toEqual([0.5, 'C']);
  });

  it('does not touch again when resetting inside a gesture', async () => {
    const { engine, luna } = await connected();
    const track = (await luna.session()).tracks.byId('Vocal')!;
    await track.loadStrip();
    const gain = track.gain;
    gain.begin();
    await gain.normalized.set(0.3);
    await gain.resetToDefault();
    gain.end();
    await tick();
    expect(engine.touches).toEqual([`${gain.path}:on`, `${gain.path}:off`]);
    expect(engine.value(gain.path, 'normalized_value')).toBe(0.78);
  });

  it('writes track properties optimistically and rolls back read-only ones', async () => {
    const { engine, luna } = await connected();
    const track = (await luna.session()).tracks.byId('Vocal')!;
    await track.recordEnabled.set(true);
    expect(engine.value(track.path, 'record_enabled')).toBe(true);
    const p = track.name.set('X');
    expect(track.name.value).toBe('X');
    await p;
    await expect(track.order.value).toBe(0);
  });

  it('subscribes to the meter only while observed', async () => {
    const { engine, luna } = await connected();
    const track = (await luna.session()).tracks.byId('Vocal')!;
    const before = engine.requests.filter((r) => r.verb === 'subscribe').length;
    const stop = track.meter.onChange(() => undefined);
    await tick();
    expect(engine.requests.filter((r) => r.verb === 'subscribe').length).toBe(before + 1);
    expect(engine.requests.at(-2)?.path.startsWith(track.meter.path)).toBe(true);
    engine.setValue(track.meter.path, 'level', [0.5]);
    await engine.settled();
    expect(track.meter.level.value).toEqual([0.5]);
    stop();
    await tick();
    expect(engine.requests.filter((r) => r.verb === 'unsubscribe').length).toBe(1);
  });
});

describe('Luna.Playlist, Luna.Clip and Luna.AudioSource', () => {
  it('inserts, lists, trims and deletes clips', async () => {
    const { engine, luna } = await connected(['Vocal']);
    const session = await luna.session();
    const track = session.tracks.byId('Vocal')!;
    const playlist = session.playlistFor(track)!;
    engine.addSource('pkg_abc', 'src1', { name: 'take.wav', stemFormat: 'stereo', lengthNs: 2_000_000_000 });
    playlist.clips.onChange(() => undefined);
    await playlist.clips.load();
    expect(playlist.clips.items).toEqual([]);

    const reply = (await session.insertClip({ trackUid: 'Vocal', sourceUid: 'src1', startTick: 0, stopTick: Luna.WHOLE_NOTE, sourceStopNs: 2_000_000_000, name: 'Take 1', clipType: 'audio' })) as { uid: string };
    await engine.settled();
    const clip = playlist.clips.byId(reply.uid)!;
    await clip.load();
    expect(clip.name.value).toBe('Take 1');
    expect(clip.length).toBe(Luna.WHOLE_NOTE);
    expect(clip.sourceStop.value).toBe(2_000_000_000);
    expect(clip.clipType.value).toBe('audio');

    // trim_clip is a command of the edit context, not of the session (fact 77).
    await clip.trim(0, Luna.WHOLE_NOTE / 2, { split: true });
    expect(engine.requests.at(-1)).toMatchObject({ path: '/sessions/abc/contexts/main/commands/trim_clip', data: { session_uid: 'abc', clip_uid: reply.uid, split: true } });
    await engine.settled();
    expect(clip.stop.value).toBe(Luna.WHOLE_NOTE / 2);
    await clip.delete();
    await engine.settled();
    expect(playlist.clips.items).toEqual([]);

    await session.sources!.load();
    const src = session.sources!.byId('src1')!;
    expect(src.channelCount).toBe(2);
    expect(src.seconds).toBe(2);
  });

  it('creates new playlist versions', async () => {
    const { engine, luna } = await connected(['Vocal']);
    const session = await luna.session();
    session.playlists.onChange(() => undefined);
    await session.newPlaylists(['Vocal'], { duplicate: true });
    await engine.settled();
    expect(session.playlists.items.map((p) => p.version.value)).toEqual([1, undefined]);
    await session.playlists.byId('pl_Vocal_2')!.load();
    expect(session.playlists.byId('pl_Vocal_2')!.version.value).toBe(2);
    expect(Luna.clipTypeFrom(2)).toBe('midi');
    expect(Luna.clipTypeFrom('x')).toBeUndefined();
  });
});
