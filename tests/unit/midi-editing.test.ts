/**
 * The MIDI write layer: velocity, mute and deletion. All three go through LUNA's edit
 * context, which acts on the selection rather than on a clip (fact 74), so each one must
 * leave the user's selection exactly as it found it.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const BEAT = Luna.TICKS_PER_BEAT;

/** A MIDI clip at tick 0 holding `count` quarter notes rising from C3, each at velocity 100. */
async function midiClip(count = 3) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Keys'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  const track = session.tracks.byId('Keys')!;
  const playlist = session.playlistFor(track)!;
  await session.insertClip({ trackUid: 'Keys', sourceUid: '', startTick: 0, stopTick: 8 * BEAT, clipType: 'midi' });
  await engine.settled();
  await playlist.clips.load();
  const clip = playlist.clips.items[0]!;
  const rows: Luna.MockMidiRow[] = [];
  for (let i = 0; i < count; i++) {
    rows.push({ tick: i * BEAT, status: NOTE_ON, data1: 60 + i, data2: 100 });
    rows.push({ tick: (i + 1) * BEAT, status: NOTE_OFF, data1: 60 + i, data2: 0 });
  }
  engine.midiEdit(clip.path, 'added', rows);
  await engine.settled();
  await clip.midi.ready();
  return { engine, luna, session, clip, midi: clip.midi };
}

describe('MidiClip.setVelocities', () => {
  it('scales every velocity in one post, and the notes follow', async () => {
    const { midi, engine, luna } = await midiClip();
    const before = midi.notes.items.map((n) => n.velocity);
    expect(before).toEqual([100, 100, 100]);

    await midi.setVelocities(midi.notes.items.map((n) => ({ note: n, velocity: Math.round(n.velocity * 0.5) })));
    await engine.settled();

    expect(midi.notes.items.map((n) => n.velocity)).toEqual([50, 50, 50]);
    const posts = engine.requests.filter((r) => r.verb === 'post' && r.path.endsWith('/change_velocity'));
    expect(posts).toHaveLength(1); // one post, so one undo entry for the whole batch
    await luna.close();
  });

  it('sets one note by row id', async () => {
    const { midi, engine, luna } = await midiClip();
    const target = midi.notes.items[1]!;
    await midi.setVelocity(target.rowid, 27);
    await engine.settled();
    expect(midi.notes.byId(String(target.rowid))!.velocity).toBe(27);
    await luna.close();
  });

  it('refuses a velocity outside 1-127, and an unknown note, before anything goes on the wire', async () => {
    const { midi, engine, luna } = await midiClip();
    const posts = () => engine.requests.filter((r) => r.verb === 'post' && r.path.endsWith('/change_velocity')).length;
    const was = posts();
    await expect(midi.setVelocity(midi.notes.items[0]!, 0)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(midi.setVelocity(midi.notes.items[0]!, 200)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(midi.setVelocity(9999, 64)).rejects.toMatchObject({ code: 'not_found' });
    await expect(midi.setVelocities([])).rejects.toMatchObject({ code: 'out_of_range' });
    expect(posts()).toBe(was);
    await luna.close();
  });
});

describe('MidiClip.setMuted', () => {
  it('mutes only the notes given, and restores the selection it had to move', async () => {
    const { midi, session, engine, luna } = await midiClip();
    await session.context.select({ startTick: 0, stopTick: 2 * BEAT, trackUids: ['Keys'] });
    await engine.settled();
    const saved = session.context.snapshot();

    const quiet = midi.notes.items.filter((n) => n.pitch === 61);
    await midi.setMuted(quiet, true);
    await engine.settled();

    expect(midi.notes.items.filter((n) => n.muted).map((n) => n.pitch)).toEqual([61]);
    expect(session.context.snapshot()).toEqual(saved);
    await luna.close();
  });

  it('posts nothing when the notes are already in the state asked for', async () => {
    const { midi, engine, luna } = await midiClip();
    const count = () => engine.requests.filter((r) => r.verb === 'post' && r.path.endsWith('/mute_notes')).length;
    await midi.setMuted(midi.notes.items, false); // they all start unmuted
    expect(count()).toBe(0);
    await luna.close();
  });

  it('refuses inside a transaction, which would hold the selection write until commit', async () => {
    const { midi, session, engine, luna } = await midiClip();
    await expect(
      session.transaction('Mute', async () => {
        await midi.setMuted([midi.notes.items[0]!], true);
      }),
    ).rejects.toMatchObject({ code: 'busy' });
    await engine.settled();
    expect(midi.notes.items.some((n) => n.muted)).toBe(false);
    await luna.close();
  });
});

describe('MidiClip.deleteNotes', () => {
  it('deletes the notes given and leaves the rest', async () => {
    const { midi, engine, luna } = await midiClip();
    const doomed = midi.notes.items[0]!;
    await midi.deleteNotes([doomed]);
    await engine.settled();
    expect(midi.notes.items.map((n) => n.pitch)).toEqual([61, 62]);
    await luna.close();
  });

  it('does nothing, and posts nothing, for an empty list', async () => {
    const { midi, engine, luna } = await midiClip();
    const before = engine.requests.length;
    await midi.deleteNotes([]);
    expect(engine.requests.length).toBe(before);
    await luna.close();
  });
});

describe('Playlist.createNotes', () => {
  async function instrumentLane() {
    const engine = new Luna.MockEngine();
    engine.addSession('abc', { tracks: ['Keys'], name: 'Demo' });
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.session();
    await session.ready();
    const lane = session.playlistFor(session.tracks.byId('Keys')!)!;
    await lane.clips.load();
    return { engine, luna, session, lane };
  }

  it('makes the MIDI clip when there is none, and resolves to the notes it created', async () => {
    const { engine, luna, lane } = await instrumentLane();
    const { clip, notes } = await lane.createNotes([60, 64, 67].map((pitch, i) => ({ pitch, startTick: i * BEAT, stopTick: (i + 1) * BEAT })));
    await engine.settled();

    expect(clip.clipType.value).toBe('midi');
    expect(notes.map((n) => n.pitch)).toEqual([60, 64, 67]);
    expect(clip.midi.notes.items).toHaveLength(3);
    await luna.close();
  });

  it('writes into the MIDI clip already on the lane', async () => {
    const { engine, luna, lane } = await instrumentLane();
    const first = await lane.createNotes([{ pitch: 60, startTick: 0, stopTick: BEAT }]);
    await engine.settled();
    const second = await lane.createNotes([{ pitch: 72, startTick: BEAT, stopTick: 2 * BEAT, velocity: 40 }]);
    await engine.settled();

    expect(second.clip.id).toBe(first.clip.id);
    expect(second.notes[0]!.velocity).toBe(40);
    expect(lane.clips.items.filter((c) => c.clipType.value === 'midi')).toHaveLength(1);
    await luna.close();
  });

  it('restores the selection it had to read the new row ids out of', async () => {
    const { engine, luna, session, lane } = await instrumentLane();
    await session.context.select({ startTick: 0, stopTick: 4 * BEAT, trackUids: ['Keys'] });
    await engine.settled();
    const saved = session.context.snapshot();

    await lane.createNotes([{ pitch: 60, startTick: 0, stopTick: BEAT }]);
    await engine.settled();

    expect(session.context.snapshot()).toEqual(saved);
    await luna.close();
  });

  it('refuses an empty list, a backwards note and a batch', async () => {
    const { engine, luna, session, lane } = await instrumentLane();
    await expect(lane.createNotes([])).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(lane.createNotes([{ pitch: 60, startTick: BEAT, stopTick: 0 }])).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(lane.createNotes([{ pitch: 200, startTick: 0, stopTick: BEAT }])).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(
      session.transaction('Notes', () => lane.createNotes([{ pitch: 60, startTick: 0, stopTick: BEAT }])),
    ).rejects.toMatchObject({ code: 'busy' });
    await engine.settled();
    await luna.close();
  });
});

describe('Context selection', () => {
  it('round-trips a snapshot, including the notes', async () => {
    const { session, engine, luna } = await midiClip();
    await session.context.selectNotes('pl_Keys_1', [[60, 0, BEAT, 1]]);
    await engine.settled();
    expect(session.context.notes).toEqual([{ playlist_uid: 'pl_Keys_1', notes: [[60, 0, BEAT, 1]] }]);
    const saved = session.context.snapshot();

    await session.context.selectNotes('pl_Keys_1', [[64, BEAT, 2 * BEAT, 3]]);
    await engine.settled();
    expect(session.context.notes[0]!.notes[0]![0]).toBe(64);

    await session.context.restore(saved);
    await engine.settled();
    expect(session.context.notes).toEqual([{ playlist_uid: 'pl_Keys_1', notes: [[60, 0, BEAT, 1]] }]);
    await luna.close();
  });

  it('rejects a restore that is not a snapshot', async () => {
    const { session, luna } = await midiClip();
    await expect(session.context.restore({} as never)).rejects.toMatchObject({ code: 'out_of_range' });
    await luna.close();
  });

  it('decodes a malformed selection as empty rather than throwing', () => {
    expect(Luna.selectedNotes(null)).toEqual([]);
    expect(Luna.selectedNotes([{ playlist_uid: 'pl', notes: [[1, 2, 3]] }])).toEqual([{ playlist_uid: 'pl', notes: [] }]);
  });
});
