/**
 * The MIDI devices LUNA sees, under its own device (fact 123).
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function connected(names: string[]) {
  const engine = new Luna.MockEngine();
  for (const name of names) engine.addMidiDevice(name);
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  return { engine, luna };
}

describe('Luna.MidiDevices', () => {
  it('reads the devices under LUNA\'s device, All and None included', async () => {
    const { luna } = await connected(['Volt 876', 'IAC Driver Bus 1']);
    expect(luna.midiDevices.path).toBe(`/devices/${Luna.LUNA_DEVICE_UID}/midi`);
    await luna.midiDevices.load();
    expect(luna.midiDevices.items.map((d) => d.name.value)).toEqual(['All', 'None', 'Volt 876', 'IAC Driver Bus 1']);
  });

  it('marks All and None as not physical, and reads their settings as null', async () => {
    const { luna } = await connected(['Volt 876']);
    await luna.midiDevices.load();
    const [all, none, volt] = luna.midiDevices.items;
    expect(all!.isPhysical).toBe(false);
    expect(none!.isPhysical).toBe(false);
    expect(all!.midiDeviceType.value).toBeNull();
    expect(volt!.isPhysical).toBe(true);
    expect(volt!.midiDeviceType.value).toBe('normal');
    expect(volt!.outputLateness.value).toBe(0);
    expect(volt!.midiClockGenerationMode.value).toBe('song1');
    expect(volt!.lastMidiNote.value).toEqual([255, 255, 255]);
  });

  it('follows a device plugged in while watched', async () => {
    const { engine, luna } = await connected(['Volt 876']);
    const w = luna.midiDevices.watch();
    await w.ready;
    let changes = 0;
    luna.midiDevices.onChange(() => changes++);
    engine.addMidiDevice('Keystep', { uid: 'keystep' });
    await engine.settled();
    await luna.settled();
    expect(changes).toBeGreaterThan(0);
    expect(luna.midiDevices.byId('keystep')?.name.value).toBe('Keystep');
    w.release();
  });

  it('tells onChange when a new device\'s name and ports arrive after it does (fact 123)', async () => {
    const { engine, luna } = await connected(['Volt 876']);
    await luna.midiDevices.watch().ready;
    const seen: string[][] = [];
    luna.midiDevices.onChange(() => {
      seen.push(luna.midiDevices.items.filter((d) => d.isPhysical && d.inputPort).map((d) => d.name.value!));
    });
    // LUNA's order for a device coming online: the node with a null name and no ports, then
    // the name, then the ports, each in its own push.
    const path = `${luna.midiDevices.path}/iac`;
    // The client reads the new device before the next push, as it does from LUNA.
    engine.addNode(path, { properties: { type: 'midi-device', name: null, midi_device_type: 'normal' } });
    await engine.settled();
    await luna.settled();
    engine.setValue(path, 'name', 'IAC Driver Bus 1');
    await engine.settled();
    await luna.settled();
    engine.addNode(`${path}/input_ports`, { properties: { type: 'folder' } });
    engine.addNode(`${path}/input_ports/0`, { properties: { type: 'midi-input', uid: 'iac_in' } });
    await engine.settled();
    await luna.settled();
    expect(seen.at(-1)).toEqual(['Volt 876', 'IAC Driver Bus 1']);
  });

  it('reads each device\'s input and output ports with the list', async () => {
    const { engine, luna } = await connected([]);
    engine.addMidiDevice('Volt 876', { uid: 'volt' });
    engine.addMidiDevice('Keyboard', { uid: 'kbd', output: false });
    await engine.settled();
    await luna.midiDevices.load();
    const volt = luna.midiDevices.byId('volt')!;
    expect(volt.inputPort?.uid.value).toBe('volt_in');
    expect(volt.outputPort?.uid.value).toBe('volt_out');
    expect(volt.inputPort?.isOutput).toBe(false);
    expect(volt.outputPort?.isOutput).toBe(true);
    expect(luna.midiDevices.byId('kbd')!.outputPort).toBeUndefined();
    const all = luna.midiDevices.items.find((d) => d.name.value === 'All')!;
    expect(all.inputPorts.items).toHaveLength(1);
    expect(all.outputPorts.items).toHaveLength(0);
  });

  it('is empty when LUNA lists no MIDI devices', async () => {
    const { luna } = await connected([]);
    await luna.midiDevices.load();
    expect(luna.midiDevices.items).toEqual([]);
  });
});
