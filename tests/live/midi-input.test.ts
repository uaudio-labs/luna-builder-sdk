/**
 * Live lane: live MIDI input from a device's input port `midi_events` (fact 125). Needs native
 * LUNA on ws://localhost:4718 and a MIDI loopback: set `UA_MIDI_LOOPBACK` to the name of a
 * device whose MIDI out comes back on its MIDI in (on macOS, an IAC Driver bus). The test
 * sends notes out of that device and expects them back on its input port; it plays nothing
 * on a track.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';
const loopback = process.env['UA_MIDI_LOOPBACK'];

async function waitFor(check: () => boolean, ms = 3000): Promise<void> {
  const until = Date.now() + ms;
  while (!check()) {
    if (Date.now() > until) throw new Error('timed out');
    await new Promise((r) => setTimeout(r, 20));
  }
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe.skipIf(!live || !loopback)('live: MIDI input', () => {
  let luna: Luna.Client;
  let device: Luna.MidiDevice;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 5000 });
    await luna.midiDevices.load();
    const found = luna.midiDevices.items.find((d) => d.name.value === loopback);
    if (!found) throw new Error(`no MIDI device named ${loopback}`);
    device = found;
  });

  afterAll(async () => {
    await luna?.close();
  });

  it('fact 125: MIDI arriving on a device reaches its input port and All, in order, and stops on unsubscribe', async () => {
    const input = new Luna.MidiInput(luna);
    const midi = new Luna.SendMidi(luna);
    const mine: Luna.MidiInputMessage[] = [];
    const all: Luna.MidiInputMessage[] = [];
    const gaps: unknown[] = [];
    const stopMine = input.listen(device, (m) => mine.push(m), { onGap: (g) => gaps.push(g) });
    const stopAll = input.listen('all', (m) => {
      if (m.data1 >= 60 && m.data1 < 64) all.push(m);
    });
    await pause(200); // let the subscriptions reach LUNA

    for (let note = 60; note < 64; note++) {
      await midi.sendNoteToOutput(device, note, 100, true, 3);
      await midi.sendNoteToOutput(device, note, 0, false, 3);
    }
    await midi.sendControllerToOutput(device, 1, 64, 3);
    await waitFor(() => mine.length >= 9 && all.length >= 8);
    console.log('received', mine.map((m) => `${m.type}:${m.data1}@${m.time.toFixed(1)}`).join(' '));

    expect(mine.slice(0, 8).map((m) => [m.type, m.channel, m.data1])).toEqual(
      [60, 61, 62, 63].flatMap((n) => [
        ['noteOn', 3, n],
        ['noteOff', 3, n],
      ]),
    );
    expect(mine[8]).toMatchObject({ type: 'controlChange', channel: 3, data1: 1, data2: 64 });
    expect(mine.every((m, i) => i === 0 || m.time >= mine[i - 1]!.time)).toBe(true);
    expect(all.map((m) => m.data1)).toEqual([60, 60, 61, 61, 62, 62, 63, 63]);
    expect(gaps).toEqual([]);

    const value = (await luna.raw.get(`${device.inputPort!.path}/midi_events`, { flatvalue: true })) as { seq: number; events: unknown[] };
    expect(value.events).toEqual([]);
    expect(value.seq).toBeGreaterThan(0);

    stopMine();
    stopAll();
    await pause(200);
    const before = mine.length;
    await midi.sendNoteToOutput(device, 70, 100, true, 3);
    await midi.sendNoteToOutput(device, 70, 0, false, 3);
    await pause(300);
    expect(mine.length).toBe(before);
  });

  it('fact 125: MIDI fed in with send_midi by device name is not echoed', async () => {
    const input = new Luna.MidiInput(luna);
    const midi = new Luna.SendMidi(luna);
    const got: Luna.MidiInputMessage[] = [];
    const stop = input.listen(device, (m) => got.push(m));
    await pause(200);
    await midi.sendDeviceNote(device.name.value!, 65, 100, true);
    await midi.sendDeviceNote(device.name.value!, 65, 0, false);
    // A real message afterwards proves the stream was running.
    await midi.sendNoteToOutput(device, 66, 100, true);
    await midi.sendNoteToOutput(device, 66, 0, false);
    await waitFor(() => got.length >= 2);
    await pause(200);
    stop();
    expect(got.map((m) => m.data1)).toEqual([66, 66]);
  });
});
