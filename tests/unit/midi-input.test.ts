/**
 * Luna.MidiInput: live MIDI from a device's input port `midi_events` (fact 125).
 */
import { describe, expect, it, vi } from 'vitest';
import { Luna } from '../../src/index';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addMidiDevice('Volt 876', { uid: 'volt' });
  engine.addMidiDevice('Keystep', { uid: 'keystep' });
  engine.addMidiDevice('Out Only', { uid: 'outonly', input: false });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  await luna.midiDevices.load();
  const device = (name: string) => luna.midiDevices.items.find((d) => d.name.value === name)!;
  const input = new Luna.MidiInput(luna);
  return { engine, luna, device, input };
}

describe('Luna.MidiInput', () => {
  it('delivers each message a device sends, decoded, in order', async () => {
    const { engine, device, input } = await connected();
    const got: Luna.MidiInputMessage[] = [];
    input.listen(device('Volt 876'), (m) => got.push(m));
    await engine.settled();
    expect(engine.receiveMidi('volt', [[0x91, 60, 100], [0x91, 60, 0], [0xb0, 1, 64], [0xc2, 5, 0], [0xe0, 0, 64]], { timeMs: 1000, stepMs: 10 })).toBe(1);
    await engine.settled();
    expect(got.map((m) => [m.type, m.channel, m.data1, m.data2, m.time])).toEqual([
      ['noteOn', 1, 60, 100, 1000],
      ['noteOff', 1, 60, 0, 1010],
      ['controlChange', 0, 1, 64, 1020],
      ['programChange', 2, 5, 0, 1030],
      ['pitchBend', 0, 0, 64, 1040],
    ]);
    expect(got[0]!.port).toBe(device('Volt 876').inputPort);
  });

  it('publishes nothing on a port no one listens to, and stops when unsubscribed', async () => {
    const { engine, device, input } = await connected();
    expect(engine.receiveMidi('volt', [[0x90, 60, 100]])).toBe(0);
    const handler = vi.fn();
    const stop = input.listen(device('Volt 876'), handler);
    await engine.settled();
    engine.receiveMidi('volt', [[0x90, 60, 100]]);
    await engine.settled();
    stop();
    await engine.settled();
    expect(engine.receiveMidi('volt', [[0x80, 60, 0]])).toBe(0);
    await engine.settled();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("hears only the listened device, and every device on 'all'", async () => {
    const { engine, device, input } = await connected();
    const volt = vi.fn();
    const all: number[] = [];
    input.listen(device('Volt 876'), volt);
    input.listen('all', (m) => all.push(m.data1));
    await engine.settled();
    engine.receiveMidi('keystep', [[0x90, 48, 90]]);
    engine.receiveMidi('Volt 876', [[0x90, 72, 90]]);
    await engine.settled();
    expect(volt).toHaveBeenCalledTimes(1);
    expect(volt.mock.calls[0]![0].data1).toBe(72);
    expect(all).toEqual([48, 72]);
  });

  it('filters notes and controllers with onNote and onControlChange', async () => {
    const { engine, device, input } = await connected();
    const notes: unknown[] = [];
    const ccs: unknown[] = [];
    input.onNote(device('Volt 876'), (note, velocity, on) => notes.push([note, velocity, on]));
    input.onControlChange(device('Volt 876'), (cc, value) => ccs.push([cc, value]));
    await engine.settled();
    engine.receiveMidi('volt', [[0x90, 60, 100], [0xb0, 64, 127], [0x80, 60, 30], [0xd0, 50, 0]]);
    await engine.settled();
    expect(notes).toEqual([
      [60, 100, true],
      [60, 30, false],
    ]);
    expect(ccs).toEqual([[64, 127]]);
  });

  it('two listeners on one device each hear every message once', async () => {
    const { engine, device, input } = await connected();
    const a = vi.fn();
    const b = vi.fn();
    const stopA = input.listen(device('Volt 876'), a);
    input.listen(device('Volt 876'), b);
    await engine.settled();
    engine.receiveMidi('volt', [[0x90, 60, 100]]);
    await engine.settled();
    stopA();
    await engine.settled();
    engine.receiveMidi('volt', [[0x80, 60, 0]]);
    await engine.settled();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it('reports missed batches through onGap', async () => {
    const { engine, device, input } = await connected();
    const port = device('Volt 876').inputPort!;
    const onGap = vi.fn();
    const handler = vi.fn();
    input.listen(port, handler, { onGap });
    await engine.settled();
    engine.receiveMidi('volt', [[0x90, 60, 100]]);
    await engine.settled();
    // Batches 2 and 3 never arrive.
    engine.setValue(port.path, 'midi_events', { seq: 4, dropped: 0, events: [[0, 0x80, 60, 0]] });
    await engine.settled();
    expect(onGap).toHaveBeenCalledWith({ missed: 2, dropped: 0 });
    engine.setValue(port.path, 'midi_events', { seq: 5, dropped: 3, events: [] });
    await engine.settled();
    expect(onGap).toHaveBeenLastCalledWith({ missed: 0, dropped: 3 });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('a get reads no events', async () => {
    const { engine, luna, device, input } = await connected();
    input.listen(device('Volt 876'), () => {});
    await engine.settled();
    engine.receiveMidi('volt', [[0x90, 60, 100]]);
    await engine.settled();
    const value = Luna.propertyValue(await luna.raw.get(`${device('Volt 876').inputPort!.path}/midi_events`));
    expect(value).toEqual({ seq: 1, dropped: 0, events: [] });
  });

  it('refuses a device with no MIDI in, an output port, and all before devices load', async () => {
    const { device, input } = await connected();
    expect(() => input.listen(device('Out Only'), () => {})).toThrow(/has no input port/);
    expect(() => input.listen(device('Volt 876').outputPort!, () => {})).toThrow(/output port/);
    const engine = new Luna.MockEngine();
    engine.addMidiDevice('Volt 876');
    const fresh = await Luna.connect({ port_: engine.port() });
    expect(() => new Luna.MidiInput(fresh).listen('all', () => {})).toThrow(/load luna.midiDevices/);
  });

  it('decodeMidiEvents skips malformed entries and non-channel messages', () => {
    const port = {} as Luna.MidiPort;
    const out = Luna.decodeMidiEvents([[0, 0x90, 60, 100], [1, 0xf8, 0, 0], 'x', [2, 0x90], [3, 0x40, 1, 2]], port);
    expect(out).toHaveLength(1);
    expect(out[0]!.type).toBe('noteOn');
  });
});
