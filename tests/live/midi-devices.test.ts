/**
 * Live lane: the MIDI devices LUNA lists under its own device (fact 123). Read-only; needs
 * native LUNA running on ws://localhost:4718.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';

describe.skipIf(!live)('live: MIDI devices', () => {
  let luna: Luna.Client;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 5000 });
  });

  afterAll(async () => {
    await luna?.close();
  });

  it('fact 123: LUNA\'s device holds the MIDI folder, with All and None beside the real devices, and their ports', async () => {
    const devices = (await luna.raw.get('/devices', { properties: false, commands: false })) as { children?: { path: string }[] };
    expect(devices.children?.map((c) => c.path)).toContain(Luna.LUNA_DEVICE_UID);

    await luna.midiDevices.load();
    const items = luna.midiDevices.items;
    const names = items.map((d) => d.name.value);
    expect(names).toContain('All');
    expect(names).toContain('None');
    for (const d of items.filter((d) => !d.isPhysical)) expect(d.midiDeviceType.value).toBeNull();
    for (const d of items) {
      expect(typeof d.name.value).toBe('string');
      expect(d.lastMidiNote.value).toHaveLength(3);
    }
    // Ports mirror the mixer's: every entry has an input port, None and All no output port.
    for (const d of items) {
      expect(d.inputPorts.items.length).toBeGreaterThan(0);
      expect(d.inputPort?.uid.value).toMatch(/^[0-9a-f]{32}$/);
      if (d.outputPort) expect(d.outputPort.uid.value).toMatch(/^[0-9a-f]{32}$/);
      if (!d.isPhysical) expect(d.outputPort).toBeUndefined();
    }
    console.log('MIDI devices:', items.filter((d) => d.isPhysical).map((d) => `${d.name.value} (${d.midiDeviceType.value}, out ${d.outputPort?.uid.value ?? 'none'})`).join(', ') || 'none');
  });
});
