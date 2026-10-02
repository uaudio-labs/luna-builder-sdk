/**
 * The MIDI read layer: table decoding, note pairing, and the delta stream that keeps
 * `clip.midi` following edits made in LUNA (facts 39-41).
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const BEAT = Luna.TICKS_PER_BEAT;

async function midiClip(rows: Luna.MockMidiRow[] = []) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Keys'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  const track = session.tracks.byId('Keys')!;
  const playlist = session.playlistFor(track)!;
  await session.insertClip({ trackUid: 'Keys', sourceUid: '', startTick: 0, stopTick: 4 * BEAT, clipType: 'midi' });
  await engine.settled();
  await playlist.clips.load();
  const clip = playlist.clips.items[0]!;
  if (rows.length) engine.midiEdit(clip.path, 'added', rows);
  await engine.settled();
  await clip.midi.ready();
  return { engine, luna, clip, midi: clip.midi };
}

describe('Luna.pairNotes', () => {
  it('pairs each note-on with the next note-off of the same channel and pitch', () => {
    const rows = [
      { rowid: 1, tick: 0, status: NOTE_ON, channel: 0, data1: 60, data2: 100, enabled: true },
      { rowid: 2, tick: 0, status: NOTE_ON, channel: 0, data1: 64, data2: 90, enabled: true },
      { rowid: 3, tick: BEAT, status: NOTE_OFF, channel: 0, data1: 60, data2: 0, enabled: true },
      { rowid: 4, tick: 2 * BEAT, status: NOTE_OFF, channel: 0, data1: 64, data2: 0, enabled: true },
    ];
    const notes = Luna.pairNotes(rows);
    expect(notes.map((n) => [n.pitch, n.startTick, n.stopTick])).toEqual([
      [60, 0, BEAT],
      [64, 0, 2 * BEAT],
    ]);
  });

  it('treats a zero-velocity note-on as a note-off, and keeps an unterminated note', () => {
    const notes = Luna.pairNotes([
      { rowid: 1, tick: 0, status: NOTE_ON, channel: 0, data1: 60, data2: 100, enabled: true },
      { rowid: 2, tick: BEAT, status: NOTE_ON, channel: 0, data1: 60, data2: 0, enabled: true },
      { rowid: 3, tick: 2 * BEAT, status: NOTE_ON, channel: 0, data1: 67, data2: 80, enabled: true },
    ]);
    expect(notes).toHaveLength(2);
    expect(notes[0]).toMatchObject({ pitch: 60, stopTick: BEAT, offRowid: 2 });
    expect(notes[1]).toMatchObject({ pitch: 67, stopTick: undefined, offRowid: undefined });
  });

  it('keeps channels apart and reports a muted note-on row', () => {
    const notes = Luna.pairNotes([
      { rowid: 1, tick: 0, status: NOTE_ON | 1, channel: 1, data1: 60, data2: 100, enabled: false },
      { rowid: 2, tick: BEAT, status: NOTE_OFF, channel: 0, data1: 60, data2: 0, enabled: true },
      { rowid: 3, tick: BEAT, status: NOTE_OFF | 1, channel: 1, data1: 60, data2: 0, enabled: true },
    ]);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ channel: 1, muted: true, offRowid: 3 });
  });
});

describe('Luna.encodeMidiData / decodeMidiData', () => {
  it('round-trips the three packed bytes (fact 39)', () => {
    expect(Luna.encodeMidiData(0x90, 0x3c, 0x64)).toBe(0x903c64);
    expect(Luna.decodeMidiData(0x903c64)).toEqual({ status: 0x90, data1: 0x3c, data2: 0x64 });
  });
});

describe('Luna.MidiClip', () => {
  it('seeds events and notes from the table', async () => {
    const { midi } = await midiClip([
      { tick: 0, status: NOTE_ON, data1: 60, data2: 100 },
      { tick: BEAT, status: NOTE_OFF, data1: 60, data2: 0 },
    ]);
    expect(midi.events.items.map((e) => e.data1)).toEqual([60, 60]);
    expect(midi.notes.items).toHaveLength(1);
    expect(midi.notes.items[0]).toMatchObject({ pitch: 60, startTick: 0, stopTick: BEAT, velocity: 100 });
  });

  it('follows an added delta from another client', async () => {
    const { engine, clip, midi } = await midiClip();
    expect(midi.notes.items).toHaveLength(0);
    engine.midiEdit(clip.path, 'added', [
      { rowid: 10, tick: 0, status: NOTE_ON, data1: 67, data2: 80 },
      { rowid: 11, tick: BEAT, status: NOTE_OFF, data1: 67, data2: 0 },
    ]);
    await engine.settled();
    expect(midi.notes.items).toHaveLength(1);
    expect(midi.notes.byId('10')).toMatchObject({ pitch: 67, stopTick: BEAT });
  });

  it('applies both of two deltas delivered in one frame', async () => {
    const { engine, clip, midi } = await midiClip();
    engine.midiEdit(clip.path, 'added', [{ rowid: 20, tick: 0, status: NOTE_ON, data1: 60, data2: 100 }]);
    engine.midiEdit(clip.path, 'added', [{ rowid: 21, tick: BEAT, status: NOTE_ON, data1: 64, data2: 100 }]);
    await engine.settled();
    expect(midi.events.items.map((e) => e.rowid)).toEqual([20, 21]);
  });

  it('upserts on a changed delta and drops rows on a deleted one', async () => {
    const { engine, clip, midi } = await midiClip([{ rowid: 1, tick: 0, status: NOTE_ON, data1: 60, data2: 100 }]);
    engine.midiEdit(clip.path, 'changed', [{ rowid: 1, tick: 0, status: NOTE_ON, data1: 60, data2: 30 }]);
    await engine.settled();
    expect(midi.events.items[0]?.data2).toBe(30);
    expect(midi.events.items).toHaveLength(1);

    engine.midiEdit(clip.path, 'deleted', [{ rowid: 1 }]);
    await engine.settled();
    expect(midi.events.items).toHaveLength(0);
    expect(midi.notes.items).toHaveLength(0);
  });

  it('reports ticks relative to the clip, shifting when the MIDI origin moves (fact 41)', async () => {
    const { engine, luna, clip, midi } = await midiClip([{ rowid: 1, tick: 8 * BEAT, status: NOTE_ON, data1: 60, data2: 100 }]);
    expect(midi.events.items[0]?.tick).toBe(8 * BEAT);
    engine.setValue(clip.path, 'midi_source_start', 8 * BEAT);
    await engine.settled();
    await luna.settled();
    expect(midi.events.items[0]?.tick).toBe(0);
  });

  it('sends clip-relative ticks in the table frame when adding notes (fact 41)', async () => {
    const { engine, luna, clip, midi } = await midiClip();
    engine.setValue(clip.path, 'midi_source_start', 4 * BEAT);
    await engine.settled();
    await luna.settled();
    await clip.addNote(60, 0, BEAT);
    await engine.settled();
    // Stored at the origin, read back at 0.
    expect(midi.events.items[0]?.tick).toBe(0);
    expect(midi.notes.items[0]).toMatchObject({ pitch: 60, startTick: 0, stopTick: BEAT });
  });

  it('reads notes added with addNotes back as clip-relative notes (fact 41)', async () => {
    const { engine, luna, clip, midi } = await midiClip();
    engine.setValue(clip.path, 'midi_source_start', 4 * BEAT);
    await engine.settled();
    await luna.settled();
    await clip.addNotes([
      { pitch: 60, tick: 0, lengthTicks: BEAT },
      { pitch: 67, tick: BEAT, lengthTicks: 2 * BEAT, velocity: 90 },
    ]);
    await engine.settled();
    await luna.settled();
    expect(midi.notes.items).toMatchObject([
      { pitch: 60, startTick: 0, stopTick: BEAT },
      { pitch: 67, startTick: BEAT, stopTick: 3 * BEAT, velocity: 90 },
    ]);
  });

  it('notifies listeners once per frame', async () => {
    const { engine, luna, clip, midi } = await midiClip();
    let calls = 0;
    midi.notes.onChange(() => calls++);
    engine.midiEdit(clip.path, 'added', [{ rowid: 1, tick: 0, status: NOTE_ON, data1: 60, data2: 100 }]);
    engine.midiEdit(clip.path, 'added', [{ rowid: 2, tick: BEAT, status: NOTE_ON, data1: 64, data2: 100 }]);
    await engine.settled();
    await luna.settled();
    expect(calls).toBe(1);
  });

  it('stops following once disposed', async () => {
    const { engine, clip, midi } = await midiClip([{ rowid: 1, tick: 0, status: NOTE_ON, data1: 60, data2: 100 }]);
    midi.dispose();
    engine.midiEdit(clip.path, 'added', [{ rowid: 2, tick: BEAT, status: NOTE_ON, data1: 64, data2: 100 }]);
    await engine.settled();
    expect(midi.events.items.map((e) => e.rowid)).toEqual([1]);
  });
});
