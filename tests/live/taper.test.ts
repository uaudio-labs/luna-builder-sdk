/**
 * Live lane for fader tapers (fact 134): a gain's `taper` is null (so +12) by default, its
 * views agree with `Luna.Taper`, and a summing console on the master bus input switches every
 * fader to that console's taper and pushes the change; undo puts it back.
 *
 * Needs LUNA on 4718 with a session open whose master bus input is empty. It loads API
 * Summing there and undoes it, clearing the slot as well if the undo did not; the undo
 * entries remain, because the wire cannot drop them. It never rolls the transport.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';
const API_SUMMING = 'uaudio_api_summing';

describe.skipIf(!live)('live: tapers', () => {
  let luna: Luna.Client;
  let session: Luna.Session;
  let tracks: Luna.Track[];

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    session = await luna.session();
    await session.ready();
    tracks = session.visibleTracks;
    for (const t of tracks) await t.loadStrip();
  });

  afterAll(async () => {
    await luna?.close();
  });

  it('maps a gain through the +12 taper by default, as Luna.Taper does', async () => {
    for (const t of tracks) {
      const taper = t.gain.taper.value;
      expect(taper?.name).toBe('+12');
      const real = t.gain.real.value as number;
      expect(taper!.toNormalized(real)).toBeCloseTo(t.gain.normalized.value!, 4);
    }
    expect(tracks[0]!.main.pans[0]!.taper.value).toBeNull();
  });

  it('switches every fader to API when API Summing is on the master bus input, and undo restores it', async () => {
    const master = session.master!;
    await master.effects.load();
    const slot = master.effects.byId('bus_input');
    if (!slot) return console.log('fact 134 skipped: the master bus has no bus_input slot');
    if (!slot.isEmpty) return console.log(`fact 134 skipped: the master bus input holds ${slot.pluginId.value}`);
    const gain = tracks[0]!.gain;
    const before = tracks.map((t) => [t.gain.real.value, t.gain.normalized.value] as const);
    let pushes = 0;
    const stop = gain.taper.onChange(() => pushes++);
    try {
      await slot.setPlugin(API_SUMMING);
      await Luna.settle(() => gain.taper.value?.name === 'API', 'taper becomes API', { timeoutMs: 8000 });
      expect(pushes).toBeGreaterThan(0);
      await luna.settled();
      for (const [i, t] of tracks.entries()) {
        expect(t.gain.taper.value?.name).toBe('API');
        const after = [t.gain.real.value, t.gain.normalized.value];
        console.log(`fact 134 ${t.name.value}: +12 ${JSON.stringify(before[i])} -> API ${JSON.stringify(after)}`);
        expect(t.gain.taper.value!.toNormalized(t.gain.real.value as number)).toBeCloseTo(t.gain.normalized.value!, 3);
      }
      await session.undo();
      await Luna.settle(() => gain.taper.value?.name === '+12', 'taper back to +12', { timeoutMs: 8000 });
      expect(slot.isEmpty).toBe(true);
    } finally {
      stop();
      if (!slot.isEmpty) await slot.clear().catch(() => undefined);
    }
  });
});
