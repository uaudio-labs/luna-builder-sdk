/**
 * Client parity, sessions slice: lyric editing (fact 153), deleting time and key signatures
 * (154), session settings (155-157), the timeline scroll (159), MIDI operations (158), the
 * session storage path (160), workspace tags and template filters (161-162) and importing
 * MIDI or video by path (163). All against `Luna.MockEngine`; the facts are unverified until
 * the live lane measures them.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const BAR = Luna.WHOLE_NOTE;
const BEAT = Luna.TICKS_PER_BEAT;
const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const SOURCE = 'c42b76fba5944509b178af83706c52ec';

async function connected(tracks: string[] = ['Vocal']) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks, name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  return { engine, luna, session };
}

const posts = (engine: Luna.MockEngine, command: string) => engine.requests.filter((r) => r.verb === 'post' && r.path.endsWith(`/${command}`));
const ruler = (session: Luna.Session) => session.lyrics.sorted.filter((l) => !l.transcribed).map((l) => [l.location.value, l.text.value]);

describe('lyric editing (fact 153)', () => {
  it('adds a ruler line and resolves to it, replacing a line already at that tick', async () => {
    const { engine, session } = await connected();
    const first = await session.lyrics.add(4 * BAR, 'first take');
    expect(first.text.value).toBe('first take');
    expect(first.transcribed).toBe(false);
    const second = await session.lyrics.add(4 * BAR, 'second take');
    expect(second.id).not.toBe(first.id);
    expect(ruler(session)).toEqual([[4 * BAR, 'second take']]);
    expect(posts(engine, 'set_lyric').at(-1)?.data).toEqual({ session_uid: 'abc', location: 4 * BAR, text: 'second take' });
  });

  it('adds a line to a recording, in nanoseconds into the source', async () => {
    const { engine, session } = await connected();
    const line = await session.lyrics.add(2_000_000_000, 'Na-na-na', { sourceUid: SOURCE, length: 900_000_000 });
    expect(line.transcribed).toBe(true);
    expect(line.length.value).toBe(900_000_000);
    expect(engine.value(line.path, 'units')).toBe(1);
  });

  it('rewrites the text by rowid and moves a line, keeping lines of the other kind', async () => {
    const { engine, session } = await connected();
    engine.addLyric('abc', { location: 2_000_000_000, text: 'from the take', sourceUid: SOURCE });
    engine.addLyric('abc', { location: BAR, text: 'ruler' });
    await engine.settled();
    await session.lyrics.load();
    await session.lyrics.membersReady();
    const line = session.lyrics.items.find((l) => !l.transcribed)!;
    await line.setText('ruler, edited');
    expect(engine.value(line.path, 'text')).toBe('ruler, edited');
    await line.moveTo(2 * BAR);
    expect(line.location.value).toBe(2 * BAR);
    expect(posts(engine, 'set_lyric').at(-1)?.data).toEqual({ session_uid: 'abc', rowid: line.rowid.value, location: 2 * BAR });

    // A transcribed line names its source, so a move collides only with that source's lines.
    const taken = session.lyrics.items.find((l) => l.transcribed)!;
    await taken.moveTo(2 * BAR);
    expect(posts(engine, 'set_lyric').at(-1)?.data).toMatchObject({ source_uid: SOURCE, location: 2 * BAR });
    expect(session.lyrics.items).toHaveLength(2);
  });

  it('does not send a move to where the line already is (deviced would delete it)', async () => {
    const { engine, session } = await connected();
    const line = await session.lyrics.add(BAR, 'stay');
    await line.moveTo(BAR);
    expect(posts(engine, 'set_lyric')).toHaveLength(1);
    expect(session.lyrics.items).toHaveLength(1);
  });

  it('deletes a line by rowid and resolves once it has gone', async () => {
    const { engine, session } = await connected();
    const line = await session.lyrics.add(0, 'gone soon');
    await line.delete();
    expect(session.lyrics.items).toHaveLength(0);
    expect(posts(engine, 'delete_lyric').at(-1)?.data).toEqual({ session_uid: 'abc', rowid: line.rowid.value });
  });

  it('refuses empty text and fractional locations before sending', async () => {
    const { engine, session } = await connected();
    await expect(session.lyrics.add(0, '')).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.lyrics.add(0.5, 'x')).rejects.toMatchObject({ code: 'out_of_range' });
    const line = await session.lyrics.add(0, 'x');
    await expect(line.setText('')).rejects.toMatchObject({ code: 'out_of_range' });
    expect(posts(engine, 'set_lyric')).toHaveLength(1);
  });

  it('models deviced: an empty text on a row is skipped; delete by location and by source', async () => {
    const { engine, luna } = await connected();
    const row = engine.addLyric('abc', { location: 0, text: 'keep me' });
    engine.addLyric('abc', { location: 10, text: 'a', sourceUid: SOURCE });
    engine.addLyric('abc', { location: 20, text: 'b', sourceUid: SOURCE });
    await luna.raw.post('/sessions/abc/set_lyric', { session_uid: 'abc', rowid: row, text: '' });
    expect(engine.value(`/sessions/abc/lyrics/${row}`, 'text')).toBe('keep me');
    await luna.raw.post('/sessions/abc/delete_lyric', { session_uid: 'abc', source_uids: [SOURCE] });
    expect(engine.children('/sessions/abc/lyrics')).toEqual([String(row)]);
    await luna.raw.post('/sessions/abc/delete_lyric', { session_uid: 'abc', location: 0 });
    expect(engine.children('/sessions/abc/lyrics')).toEqual([]);
    await expect(luna.raw.post('/sessions/abc/set_lyric', { session_uid: 'abc', text: 'nowhere' })).rejects.toMatchObject({ code: 'uasrv.missing_field' });
  });
});

describe('deleting time and key signatures (fact 154)', () => {
  it('deletes a time signature by bar and re-ticks the later ones, keeping their bars', async () => {
    const { engine, session } = await connected();
    await session.musical.setTimeSignature(3, 4, 5);
    await session.musical.setTimeSignature(4, 4, 9);
    await engine.settled();
    await session.musical.timeSignatures.reload();
    const at = (bar: number) => session.musical.timeSignatures.items.find((s) => s.bar.value === bar)?.tick.value;
    // Bars 1-4 at 4/4, bars 5-8 at 3/4: bar 9 starts at 4 * BAR + 4 * 3 beats.
    expect(at(5)).toBe(4 * BAR);
    expect(at(9)).toBe(4 * BAR + 12 * BEAT);

    await session.musical.deleteTimeSignature(5);
    expect(at(5)).toBeUndefined();
    await engine.settled();
    expect(at(9)).toBe(8 * BAR);
    expect(posts(engine, 'delete_time_signature').at(-1)?.data).toEqual({ session_uid: 'abc', bar: 5 });
  });

  it('refuses the first signature and a bar with none, sending nothing', async () => {
    const { engine, session } = await connected();
    await expect(session.musical.deleteTimeSignature(1)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.musical.deleteTimeSignature(7)).rejects.toMatchObject({ code: 'not_found' });
    expect(posts(engine, 'delete_time_signature')).toHaveLength(0);
  });

  it('deletes a key signature at a tick; tick 0 and an empty tick are refused', async () => {
    const { engine, session } = await connected();
    await session.musical.setKeySignature(0, false, 0);
    await session.musical.setKeySignature(2, false, 8 * BAR);
    await session.musical.deleteKeySignature(8 * BAR);
    expect(session.musical.keySignatures.items.map((k) => k.tick.value)).toEqual([0]);
    await expect(session.musical.deleteKeySignature(0)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.musical.deleteKeySignature(BAR)).rejects.toMatchObject({ code: 'not_found' });
    expect(posts(engine, 'delete_key_signature')).toHaveLength(1);
  });

  it('models deviced: delete_key_signature at tick 0 is refused', async () => {
    const { luna } = await connected();
    await expect(luna.raw.post('/sessions/abc/delete_key_signature', { session_uid: 'abc', tick: 0 })).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
  });
});

describe('session settings (facts 155-157)', () => {
  it('writes tempo percent, rolls, click flags and MIDI merge on the transport', async () => {
    const { engine, session } = await connected();
    const t = session.transport;
    expect(t.clickDuringPlay.value).toBe(true);
    expect(t.enableTempoPercent.value).toBe(false);
    await t.tempoPercent.set(80);
    await t.enableTempoPercent.set(true);
    await t.preRoll.set(Luna.formatRollDuration({ bars: 2 }));
    await t.postRoll.set(Luna.formatRollDuration({ beats: 1, ticks: BEAT / 2 }));
    await t.clickDuringPlay.set(false);
    await t.clickDuringRecord.set(false);
    await t.clickDuringCountIn.set(false);
    await t.mergeMidi.set(true);
    await engine.settled();
    const p = engine.properties('/sessions/abc');
    expect([p['tempo_percent'], p['enable_tempo_percent'], p['pre_roll'], p['post_roll']]).toEqual([80, true, '2,0,0', `0,1,${BEAT / 2}`]);
    expect([p['click_during_play'], p['click_during_record'], p['click_during_count_in'], p['merge_midi']]).toEqual([false, false, false, true]);
    expect(Luna.parseRollDuration(t.preRoll.value)).toEqual({ bars: 2, beats: 0, ticks: 0 });
  });

  it('reads and writes roll strings strictly', () => {
    expect(Luna.parseRollDuration('1,2,3')).toEqual({ bars: 1, beats: 2, ticks: 3 });
    expect(Luna.parseRollDuration('')).toBeUndefined();
    expect(Luna.parseRollDuration('1|0|0')).toBeUndefined();
    expect(Luna.formatRollDuration({})).toBe('0,0,0');
    expect(() => Luna.formatRollDuration({ bars: -1 })).toThrow(/integers >= 0/);
  });

  it('writes the solo mode, and LUNA refuses anything but its two tokens', async () => {
    const { engine, session } = await connected();
    expect(session.soloMode.value).toBe('latching');
    await session.soloMode.set('exclusive');
    expect(engine.value('/sessions/abc', 'solo_mode')).toBe('exclusive');
    await expect(session.soloMode.set('latch' as Luna.SoloMode)).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
  });
});

describe('Context.timelineViewStartTick (fact 159)', () => {
  it('reads null until set, then follows the write', async () => {
    const { engine, session } = await connected();
    await session.context.load();
    expect(session.context.timelineViewStartTick.value).toBeNull();
    await session.context.timelineViewStartTick.set(8 * BAR);
    expect(engine.value('/sessions/abc/contexts/main', 'timeline_view_start_tick')).toBe(8 * BAR);
  });
});

/** A MIDI clip at tick 0 on `Keys` with three quarter notes C, D, E at velocity 100, all selected. */
async function selectedNotes() {
  const { engine, luna, session } = await connected(['Keys']);
  const track = session.tracks.byId('Keys')!;
  const playlist = session.playlistFor(track)!;
  engine.addMidiClip('abc', 'Keys', { startTick: 0, stopTick: 8 * BEAT });
  await engine.settled();
  await playlist.clips.load();
  const clip = playlist.clips.items[0]!;
  const rows: Luna.MockMidiRow[] = [];
  [60, 62, 64].forEach((pitch, i) => {
    rows.push({ tick: i * BEAT, status: NOTE_ON, data1: pitch, data2: 100 });
    rows.push({ tick: (i + 1) * BEAT - BEAT / 4, status: NOTE_OFF, data1: pitch, data2: 0 });
  });
  engine.midiEdit(clip.path, 'added', rows);
  await engine.settled();
  await clip.midi.ready();
  const notes = clip.midi.notes.items.map((n) => [n.pitch, n.startTick, n.stopTick!, n.rowid] as const);
  await session.context.selectNotes(playlist.id, notes);
  await engine.settled();
  const read = () => clip.midi.notes.items.map((n) => ({ pitch: n.pitch, start: n.startTick, stop: n.stopTick, velocity: n.velocity }));
  return { engine, luna, session, read, playlist };
}

describe('Context.midiOperation (fact 158)', () => {
  it('transposes the selected notes and keeps them selected', async () => {
    const { engine, session, read } = await selectedNotes();
    await session.context.midiOperation({ type: 'transpose', semitones: 12 });
    await engine.settled();
    expect(read().map((n) => n.pitch)).toEqual([72, 74, 76]);
    expect(session.context.notes[0]!.notes.map((n) => n[0])).toEqual([72, 74, 76]);
    expect(posts(engine, 'midi_operation').at(-1)?.data).toEqual({ session_uid: 'abc', midi_operation: { operation: 'transpose', value: 12, value_str: '' } });
  });

  it('sets and scales velocities', async () => {
    const { engine, session, read } = await selectedNotes();
    await session.context.midiOperation({ type: 'velocity', value: 90 });
    await session.context.midiOperation({ type: 'velocityPercent', percent: 50 });
    await engine.settled();
    expect(read().map((n) => n.velocity)).toEqual([45, 45, 45]);
  });

  it('sets lengths by bar|beat|tick, by an exact scale, and by legato and staccato', async () => {
    const { engine, session, read } = await selectedNotes();
    await session.context.midiOperation({ type: 'duration', beats: 2 });
    await engine.settled();
    expect(read().map((n) => n.stop! - n.start)).toEqual([2 * BEAT, 2 * BEAT, 2 * BEAT]);
    expect(posts(engine, 'midi_operation').at(-1)?.data).toMatchObject({ midi_operation: { operation: 'duration', value_str: '0|2|0' } });

    // The tick part travels in display ticks, as LUNA's duration field reads it.
    await session.context.midiOperation({ type: 'duration', beats: 1, ticks: BEAT / 2 });
    await engine.settled();
    expect(read().map((n) => n.stop! - n.start)).toEqual(Array(3).fill(1.5 * BEAT));
    expect(posts(engine, 'midi_operation').at(-1)?.data).toMatchObject({ midi_operation: { value_str: '0|1|480' } });

    await session.context.midiOperation({ type: 'durationScale', numerator: 1, denominator: 3 });
    await engine.settled();
    expect(read().map((n) => n.stop! - n.start)).toEqual(Array(3).fill(BEAT / 2));
    await session.context.midiOperation({ type: 'duration', beats: 2 });
    await session.context.midiOperation({ type: 'durationScale', numerator: 1, denominator: 4 });
    await engine.settled();
    expect(read().map((n) => n.stop! - n.start)).toEqual([BEAT / 2, BEAT / 2, BEAT / 2]);
    expect(posts(engine, 'midi_operation').at(-1)?.data).toMatchObject({ midi_operation: { operation: 'duration_percent', value: 25, value_str: '1/4' } });

    await session.context.midiOperation({ type: 'legato' });
    await engine.settled();
    expect(read().map((n) => n.stop)).toEqual([BEAT, 2 * BEAT, 3 * BEAT]);

    await session.context.midiOperation({ type: 'staccato' });
    await engine.settled();
    expect(read().map((n) => n.stop! - n.start)).toEqual(Array(3).fill(100 * Luna.TICKS_PER_DISPLAY_TICK));
  });

  it('inverts around the range and the first note, and reverses time in the range', async () => {
    const { engine, session, read } = await selectedNotes();
    await session.context.midiOperation({ type: 'invert' });
    await engine.settled();
    expect(read().map((n) => n.pitch).sort()).toEqual([60, 62, 64]);
    expect(read().find((n) => n.start === 0)?.pitch).toBe(64);

    await session.context.midiOperation({ type: 'reverse' });
    await engine.settled();
    // Selection 0..2.75 beats: each note's end maps to its new start.
    const byStart = [...read()].sort((a, b) => a.start - b.start);
    expect(byStart.map((n) => n.start)).toEqual([0, BEAT, 2 * BEAT]);
  });

  it('refuses out-of-range values before sending, and the mock refuses a bad payload as LUNA does', async () => {
    const { engine, luna, session } = await selectedNotes();
    for (const op of [
      { type: 'velocity', value: 0 },
      { type: 'velocityPercent', percent: 201 },
      { type: 'transpose', semitones: 25 },
      { type: 'duration' },
      { type: 'duration', ticks: 5 },
      { type: 'invert', around: 'root' },
      { type: 'invert', scale: { root: 1, mask: 1 } },
      { type: 'nope' },
    ] as Luna.MidiOperation[]) {
      await expect(session.context.midiOperation(op)).rejects.toMatchObject({ code: 'out_of_range' });
    }
    expect(posts(engine, 'midi_operation')).toHaveLength(0);
    const path = '/sessions/abc/contexts/main/commands/midi_operation';
    await expect(luna.raw.post(path, { session_uid: 'abc', midi_operation: { operation: 'velocity', value: 300 } })).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
    await expect(luna.raw.post(path, { session_uid: 'abc', midi_operation: { operation: 'duration', value: 0, value_str: '' } })).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
  });

  it('changes nothing when the focus holds no notes', async () => {
    const { engine, session, read } = await selectedNotes();
    await session.context.select({ focus: 'tracks' });
    await session.context.midiOperation({ type: 'transpose', semitones: 1 });
    await engine.settled();
    expect(read().map((n) => n.pitch)).toEqual([60, 62, 64]);
  });
});

describe('luna.gui.sessionStoragePath (fact 160)', () => {
  it('reads the read-only folder LUNA saves new sessions in', async () => {
    const { luna } = await connected();
    await luna.gui.load();
    expect(luna.gui.sessionStoragePath.value).toBe('/Users/mock/Music/LUNA');
    await expect(luna.gui.property('session_storage_path').set('/tmp')).rejects.toMatchObject({ code: 'uasrv.read_only' });
  });
});

describe('workspace tags and template filters (facts 161-162)', () => {
  it('tags a package, and templates() filters by tag and factory', async () => {
    const { engine, luna } = await connected();
    engine.addPackage('t-user', { name: 'Mine', template: true });
    engine.addPackage('t-factory', { name: 'Brochure', template: true, factory: true });
    engine.addPackage('t-other', { name: 'Other', template: true, factory: true });
    engine.packageTags.set('t-factory', ['brochure']);
    await luna.workspace.addTag('t-user', 'brochure');
    expect((await luna.workspace.templates({ tag: 'brochure' })).map((t) => t.uid).sort()).toEqual(['t-factory', 't-user']);
    expect((await luna.workspace.templates({ tag: 'brochure', factory: true })).map((t) => t.uid)).toEqual(['t-factory']);
    expect((await luna.workspace.templates({ factory: false })).map((t) => t.uid)).toEqual(['t-user']);
    expect((await luna.workspace.templates()).length).toBe(3);
    expect(engine.requests.filter((r) => r.path === '/workspace/query').at(-3)?.data).toMatchObject({ tag: 'brochure', factory: true });
  });

  it('refuses an empty tag before sending; LUNA refuses a factory or unknown package', async () => {
    const { engine, luna } = await connected();
    engine.addPackage('f', { factory: true });
    await expect(luna.workspace.addTag('f', ' ')).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(luna.workspace.templates({ tag: '' })).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(luna.workspace.addTag('f', 'x')).rejects.toMatchObject({ code: 'uasrv.read_only_property' });
    await expect(luna.workspace.addTag('missing', 'x')).rejects.toMatchObject({ code: 'device.database_error' });
  });
});

describe('session.importPath type (fact 163)', () => {
  it('imports MIDI and video by path and resolves to the file, making no clip', async () => {
    const { engine } = await connected();
    engine.addPackage('pkg');
    engine.setValue('/sessions/abc', 'session_package_uid', 'pkg');
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.session();
    const midi = await session.importPath('/Users/me/groove.mid', { type: 'midi' });
    expect(midi).toEqual({ uid: 'midi1', type: 'midi', name: 'groove.mid' });
    expect(engine.has('/workspace/sessions/pkg/midi/midi1')).toBe(true);
    const video = await session.importPath('C:\\clips\\take.mov', { type: 'video' });
    expect(video).toMatchObject({ type: 'video', name: 'take.mov' });
    expect(engine.requests.filter((r) => r.path === '/workspace/import_file').map((r) => (r.data as { type: string }).type)).toEqual(['midi', 'video']);
    const audio = await session.importPath('/Users/me/vox.wav');
    expect(audio).toBeInstanceOf(Luna.AudioSource);
    await expect(session.importPath('/x.txt', { type: 'text' as 'midi' })).rejects.toMatchObject({ code: 'out_of_range' });
  });
});
