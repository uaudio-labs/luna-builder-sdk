// @vitest-environment jsdom
/**
 * Luna.SendMidi and Luna.QwertyMidi: live MIDI to a track through /sessions/send_midi
 * (facts 108, 109).
 */
import { describe, expect, it, vi } from 'vitest';
import { Luna } from '../../src/index';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Piano', 'Pad'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  const [piano, pad] = session.tracks.items;
  const midi = new Luna.SendMidi(luna);
  return { engine, luna, session, piano: piano!, pad: pad!, midi };
}

function key(k: string, init: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: k, cancelable: true, ...init });
}

function keyUp(k: string): KeyboardEvent {
  return new KeyboardEvent('keyup', { key: k, cancelable: true });
}

async function flush(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

describe('Luna.SendMidi', () => {
  it('sends a note-on and note-off to one track with record_enabled', async () => {
    const { engine, session, piano, midi } = await connected();
    await midi.sendMidiNote(session.uid, piano.id, 60, 100, true);
    await midi.sendMidiNote(session.uid, piano.id, 60, 0, false);
    expect(engine.midiSent).toEqual([
      { sessionUid: session.uid, trackUid: piano.id, bytes: [0x90, 60, 100], recordEnabled: true },
      { sessionUid: session.uid, trackUid: piano.id, bytes: [0x80, 60, 0], recordEnabled: true },
    ]);
  });

  it('sends a raw message, a controller on a channel, and a program change after bank select', async () => {
    const { engine, session, piano, midi } = await connected();
    await midi.sendMidi(session.uid, piano.id, 0xe0, 0x00, 0x40);
    await midi.sendController(session.uid, piano.id, 64, 127, 2);
    await midi.sendProgramChange(session.uid, piano.id, 7);
    await midi.sendProgramChange(session.uid, piano.id, 5, undefined, 12);
    expect(engine.midiSent.map((m) => m.bytes)).toEqual([
      [0xe0, 0x00, 0x40],
      [0xb2, 64, 127],
      [0xc0, 7, 0],
      [0xb0, 0, 0],
      [0xb0, 32, 12],
      [0xc0, 5, 0],
    ]);
  });

  it('sends to several tracks one at a time, handing the note to the record input once (fact 109)', async () => {
    const { engine, session, piano, pad, midi } = await connected();
    await midi.sendNoteToTracks(session.uid, [{ trackUid: piano.id }, { trackUid: pad.id, recordEnable: true }], 64, 90, true);
    expect(engine.midiSent).toEqual([
      { sessionUid: session.uid, trackUid: piano.id, bytes: [0x90, 64, 90], recordEnabled: false },
      { sessionUid: session.uid, trackUid: pad.id, bytes: [0x90, 64, 90], recordEnabled: true },
    ]);
    // The engine's own multi-track form delivers and still answers invalid_property.
    await expect(
      engine.port().post('/sessions/send_midi', { session_uid: session.uid, tracks: [{ track_uid: piano.id, record_enabled: false }], byte_0: 0x80, byte_1: 64, byte_2: 0 }),
    ).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
    expect(engine.midiSent).toHaveLength(3);
  });

  it('sends a device note by input source, and all notes off', async () => {
    const { engine, midi } = await connected();
    await midi.sendDeviceNote('IAC Driver Bus 1', 60, 100, true);
    await midi.sendAllNotesOff();
    expect(engine.midiSent).toEqual([
      { midiInputSource: 'IAC Driver Bus 1', bytes: [0x90, 60, 100], recordEnabled: false },
      { allNotesOff: true, bytes: [0xb0, 123, 0], recordEnabled: false },
    ]);
  });

  it('rejects out-of-range values before posting', async () => {
    const { engine, session, piano, midi } = await connected();
    const before = engine.requests.length;
    await expect(midi.sendMidiNote(session.uid, piano.id, 128, 100, true)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(midi.sendMidi(session.uid, piano.id, 0x40, 0, 0)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(midi.sendController(session.uid, piano.id, 7, 100, 16)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(midi.sendProgramChange(session.uid, piano.id, 1, 200)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(midi.sendNoteToTracks(session.uid, [], 60, 100, true)).rejects.toMatchObject({ code: 'out_of_range' });
    expect(engine.requests.length).toBe(before);
    expect(engine.midiSent).toEqual([]);
  });

  it('passes the engine error through for an unknown session', async () => {
    const { piano, midi } = await connected();
    await expect(midi.sendMidiNote('nope', piano.id, 60, 100, true)).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
  });
});

describe('Luna.QwertyMidi', () => {
  it('plays A as C4 and releases it on keyup, claiming both events', async () => {
    const { engine, luna, session, piano, midi } = await connected();
    const qwerty = new Luna.QwertyMidi(midi);
    const down = key('a');
    expect(qwerty.handleKeyDown(down, session.uid, piano.id)).toBe(true);
    expect(down.defaultPrevented).toBe(true);
    // Key repeat is claimed but not replayed.
    expect(qwerty.handleKeyDown(key('a', { repeat: true }), session.uid, piano.id)).toBe(true);
    const up = keyUp('a');
    expect(qwerty.handleKeyUp(up)).toBe(true);
    expect(up.defaultPrevented).toBe(true);
    await flush();
    await luna.settled();
    expect(engine.midiSent.map((m) => m.bytes)).toEqual([
      [0x90, 48, 100],
      [0x80, 48, 0],
    ]);
  });

  it('steps octave and velocity, clamps them, and notifies through the props', async () => {
    const { luna, session, piano, midi } = await connected();
    const qwerty = new Luna.QwertyMidi(midi);
    const seen = vi.fn();
    qwerty.octave.onChange(seen);
    qwerty.handleKeyDown(key('z'), session.uid, piano.id);
    await luna.settled();
    expect(qwerty.octave.value).toBe(5);
    expect(seen).toHaveBeenCalledTimes(1);
    qwerty.handleKeyDown(key('c'), session.uid, piano.id);
    expect(qwerty.velocity.value).toBe(108);
    await qwerty.octave.set(42);
    expect(qwerty.octave.value).toBe(9);
    await qwerty.velocity.set(0);
    expect(qwerty.velocity.value).toBe(1);
    qwerty.handleKeyDown(key('v'), session.uid, piano.id);
    expect(qwerty.velocity.value).toBe(1);
  });

  it('sends the note-off to the pitch that was played even if the octave moved', async () => {
    const { engine, session, piano, midi } = await connected();
    const qwerty = new Luna.QwertyMidi(midi);
    qwerty.handleKeyDown(key(';'), session.uid, piano.id);
    qwerty.handleKeyDown(key('x'), session.uid, piano.id);
    qwerty.handleKeyUp(keyUp(';'));
    await flush();
    expect(engine.midiSent.map((m) => m.bytes)).toEqual([
      [0x90, 64, 100],
      [0x80, 64, 0],
    ]);
  });

  it('leaves modified keys, unmapped keys and text fields alone', async () => {
    const { engine, session, piano, midi } = await connected();
    const qwerty = new Luna.QwertyMidi(midi);
    const undo = key('z', { metaKey: true });
    expect(qwerty.handleKeyDown(undo, session.uid, piano.id)).toBe(false);
    expect(undo.defaultPrevented).toBe(false);
    expect(qwerty.octave.value).toBe(4);
    expect(qwerty.handleKeyDown(key('q'), session.uid, piano.id)).toBe(false);
    const input = document.createElement('input');
    document.body.append(input);
    const typed = new KeyboardEvent('keydown', { key: 'a', cancelable: true, bubbles: true });
    let handled: boolean | undefined;
    input.addEventListener('keydown', (e) => (handled = qwerty.handleKeyDown(e, session.uid, piano.id)));
    input.dispatchEvent(typed);
    expect(handled).toBe(false);
    expect(qwerty.handleKeyUp(keyUp('a'))).toBe(false);
    await flush();
    expect(engine.midiSent).toEqual([]);
    input.remove();
  });

  it('releaseAll sends a note-off for every held note; resetConnection forgets them silently', async () => {
    const { engine, session, piano, midi } = await connected();
    const qwerty = new Luna.QwertyMidi(midi);
    qwerty.handleKeyDown(key('a'), session.uid, piano.id);
    qwerty.handleKeyDown(key('d'), session.uid, piano.id);
    qwerty.releaseAll();
    await flush();
    expect(engine.midiSent.filter((m) => m.bytes[0] === 0x80).map((m) => m.bytes[1])).toEqual([48, 52]);
    qwerty.handleKeyDown(key('g'), session.uid, piano.id);
    qwerty.resetConnection();
    expect(qwerty.handleKeyUp(keyUp('g'))).toBe(false);
  });
});
