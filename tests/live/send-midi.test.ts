/**
 * Live lane for `Luna.SendMidi` (facts 108-109). Needs LUNA on 4718 with a session open that
 * has a track (an instrument track is preferred; you will hear middle C briefly). Every note-on
 * is followed by its note-off, and the test ends with All Notes Off. Nothing is written to a
 * clip, and no track's settings change.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';

describe.skipIf(!live)('live: send_midi', () => {
  let luna: Luna.Client;
  let session: Luna.Session;
  let track: Luna.Track;
  let midi: Luna.SendMidi;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    session = await luna.session();
    const tracks = session.tracks.items;
    const pick = tracks.find((t) => t.trackType.value === 'instrument') ?? tracks[0];
    if (!pick) throw new Error('open a session with at least one track');
    track = pick;
    midi = new Luna.SendMidi(luna);
  });

  afterAll(async () => {
    await midi?.sendAllNotesOff().catch(() => undefined);
    await luna?.close();
  });

  it('plays a note-on and note-off on one track (fact 108)', async () => {
    await midi.sendMidiNote(session.uid, track.id, 60, 90, true);
    await new Promise((r) => setTimeout(r, 200));
    await midi.sendMidiNote(session.uid, track.id, 60, 0, false);
    await midi.sendController(session.uid, track.id, 64, 0);
  });

  it('answers invalid_property for an unknown session (fact 108)', async () => {
    await expect(midi.sendMidiNote('nope', track.id, 60, 0, false)).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
  });

  it("LUNA's multi-track form still answers invalid_property; sendNoteToTracks does not (fact 109)", async () => {
    await expect(
      luna.raw.post('/sessions/send_midi', { session_uid: session.uid, tracks: [{ track_uid: track.id, record_enabled: false }], byte_0: 0x80, byte_1: 60, byte_2: 0 }),
    ).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
    await midi.sendNoteToTracks(session.uid, [{ trackUid: track.id }], 60, 0, false);
  });

  it('accepts an unknown device input source and All Notes Off (fact 108)', async () => {
    await midi.sendDeviceNote('Luna SDK live test: no such port', 60, 0, false);
    await midi.sendAllNotesOff();
  });
});

// Sends real MIDI out of a hardware port, so it runs only when UA_MIDI_OUT names a MIDI device
// LUNA lists (for example `UA_MIDI_OUT="Volt 876"`). It plays one soft middle C and releases it.
const outName = process.env['UA_MIDI_OUT'];

describe.skipIf(!live || !outName)('live: send_midi to a MIDI output port (fact 124)', () => {
  let luna: Luna.Client;
  let midi: Luna.SendMidi;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    midi = new Luna.SendMidi(luna);
    await luna.midiDevices.load();
  });

  afterAll(async () => {
    await luna?.close();
  });

  it('sends a note-on and note-off out of the named device', async () => {
    const device = luna.midiDevices.items.find((d) => d.name.value === outName);
    if (!device) throw new Error(`LUNA lists no MIDI device named ${outName}`);
    expect(device.outputPort?.uid.value).toMatch(/^[0-9a-f]{32}$/);
    await midi.sendNoteToOutput(device, 60, 40, true);
    await new Promise((r) => setTimeout(r, 300));
    await midi.sendNoteToOutput(device, 60, 0, false);
  });
});
