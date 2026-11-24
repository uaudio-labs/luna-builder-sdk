/**
 * Where a track sends its MIDI: `/sessions/<uid>/tracks/<id>/midi_output_assignments/<uid>`
 * (facts 219-220). Each assignment names one destination (a track, a bus, an effect slot or
 * a MIDI device) and a MIDI channel.
 *
 * @example
 * await track.midiOutputs.load();
 * track.midiOutputs.items.map((a) => [a.destination.value, a.channel.value]);
 * await track.midiOutputs.set([{ track: synth, channel: 0 }, { device: 'IAC Driver Bus 1', channel: 2 }]);
 * await track.midiOutputs.set([]);   // send nowhere
 */
import type { Client } from '../client/client';
import { derived, type Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import { Collection } from './collection';
import { Node } from './node';
import { settle } from './settle';

/** One assignment's destination. `uid` is a track's, a bus's or an effect's; `name` a MIDI device's. */
export type MidiOutputDestination =
  | { kind: 'track'; uid: string }
  | { kind: 'bus'; uid: string }
  | { kind: 'effect'; uid: string }
  | { kind: 'device'; name: string };

/**
 * One route for {@link MidiOutputs.set}: to a track or a bus (by object or uid), or to a MIDI
 * device by its name (`luna.midiDevices` lists them). `channel` is stored as given: LUNA's own
 * menu writes 0 for all channels and 1-16 for one channel (fact 220).
 */
export type MidiRoute = { track: { readonly id: string } | string; channel: number } | { device: { readonly name: Prop<string> } | string; channel: number };

/**
 * One assignment row.
 *
 * @example
 * const a = track.midiOutputs.items[0];
 * a.destination.value; // { kind: 'track', uid: '...' }
 * a.channel.value;     // 0 (all channels)
 */
export class MidiOutputAssignment extends Node {
  readonly destinationTrackUid: Prop<string | null>;
  readonly destinationBusUid: Prop<string | null>;
  readonly effectUid: Prop<string | null>;
  /** The MIDI device's name. */
  readonly midiDevice: Prop<string | null>;
  /** The channel as LUNA stores it: 0 for all channels, 1-16 for one (fact 220). */
  readonly channel: Prop<number>;
  /** Whichever of the four destination properties is set. `undefined` until loaded. */
  readonly destination: Prop<MidiOutputDestination>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.destinationTrackUid = this.prop<string | null>('destination_track_uid');
    this.destinationBusUid = this.prop<string | null>('destination_bus_uid');
    this.effectUid = this.prop<string | null>('effect_uid');
    this.midiDevice = this.prop<string | null>('midi_device');
    this.channel = this.prop<number>('midi_output_channel');
    this.destination = derived([this.destinationTrackUid, this.destinationBusUid, this.effectUid, this.midiDevice], () => destinationOf(this), { distinct: true });
  }
}

function destinationOf(a: MidiOutputAssignment): MidiOutputDestination | undefined {
  const t = a.destinationTrackUid.value;
  if (t) return { kind: 'track', uid: t };
  const b = a.destinationBusUid.value;
  if (b) return { kind: 'bus', uid: b };
  const e = a.effectUid.value;
  if (e) return { kind: 'effect', uid: e };
  const d = a.midiDevice.value;
  if (d) return { kind: 'device', name: d };
  return undefined;
}

/**
 * A track's MIDI output assignments. Under a session that called `ready()` they follow LUNA;
 * call {@link load} once to read them.
 *
 * @example
 * await track.midiOutputs.load();
 * track.midiOutputs.onChange(() => render(track.midiOutputs.items));
 */
export class MidiOutputs extends Collection<MidiOutputAssignment> {
  /** @internal */
  constructor(
    client: Client,
    trackPath: string,
    private readonly sessionUid: string,
    private readonly trackUid: string,
  ) {
    super(client, `${trackPath}/midi_output_assignments`, (p) => new MidiOutputAssignment(client, p), { levels: 2, commands: false, flatvalue: true });
  }

  /**
   * Replace every assignment of this track with `routes`, in one undo step, through the edit
   * context's `set_midi_output_assignments` as LUNA's channel strip does (fact 219), and
   * resolve once {@link items} shows them. A route to a bus uid becomes a bus assignment.
   * Routes to an effect slot cannot be written this way.
   *
   * @example
   * await track.midiOutputs.set([{ track: synthTrack, channel: 0 }]);
   * await track.midiOutputs.set([{ device: 'IAC Driver Bus 1', channel: 10 }]);
   */
  async set(routes: readonly MidiRoute[]): Promise<void> {
    const devices: { value: string; channel: number }[] = [];
    const tracks: { value: string; channel: number }[] = [];
    for (const r of routes) {
      if (!Number.isInteger(r.channel) || r.channel < 0 || r.channel > 16) throw new UAError('out_of_range', `midiOutputs.set(): channel must be 0 (all) or 1-16, not ${String(r.channel)}`, { path: this.path });
      if ('device' in r) {
        const name = typeof r.device === 'string' ? r.device : r.device.name.value;
        if (!name) throw new UAError('out_of_range', 'midiOutputs.set(): a device route needs a device name', { path: this.path });
        devices.push({ value: name, channel: r.channel });
      } else {
        tracks.push({ value: typeof r.track === 'string' ? r.track : r.track.id, channel: r.channel });
      }
    }
    await this.load();
    await this.client.raw.post(`/sessions/${this.sessionUid}/contexts/main/commands/set_midi_output_assignments`, { session_uid: this.sessionUid, track_uid: this.trackUid, devices, tracks });
    const want = [...devices.map((d) => `d:${d.value}:${d.channel}`), ...tracks.map((t) => `t:${t.value}:${t.channel}`)].sort().join('|');
    const have = () =>
      this.items
        .map((a) => {
          const d = a.destination.value;
          if (!d) return '?';
          return d.kind === 'device' ? `d:${d.name}:${a.channel.value}` : `t:${d.uid}:${a.channel.value}`;
        })
        .sort()
        .join('|');
    await settle(() => have() === want, 'set MIDI outputs', { path: this.path, refresh: () => this.reload(), flush: () => this.client.store.scheduler.flush() });
  }
}
