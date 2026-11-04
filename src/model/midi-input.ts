/**
 * Live MIDI input: the messages a MIDI device is sending LUNA, as they arrive (fact 125).
 *
 * Each MIDI device's input port has a `midi_events` property. While a client subscribes to it,
 * LUNA pushes every batch of channel messages it receives from that device as one update; the
 * `All` device's port receives every device's messages. Nothing flows, and LUNA does no extra
 * work, while no one listens. MIDI sent with {@link SendMidi} is not echoed back.
 *
 * Channel messages arrive: notes, poly and channel pressure, controllers, program changes and
 * pitch bend. SysEx arrives too, whole, when asked for ({@link MidiInput.onSysEx}, or `sysex:
 * true` in {@link MidiInputListenOptions}); LUNA builds without it send none (fact 138). Clock
 * and timecode do not arrive.
 *
 * Use this, not Web MIDI (`navigator.requestMIDIAccess()`), for MIDI input in an Add On: LUNA's
 * macOS web view has no Web MIDI, and this hears the devices LUNA's MIDI settings list, the
 * same way inside LUNA and in a browser.
 *
 * @example
 * await luna.midiDevices.load();
 * const input = new Luna.MidiInput(luna);
 * const keys = luna.midiDevices.items.find((d) => d.name.value === 'Volt 876');
 * const stop = input.listen(keys, (m) => {
 *   if (m.type === 'noteOn') console.log('note', m.data1, 'velocity', m.data2);
 * });
 * // later
 * stop();
 */
import type { Client } from '../client/client';
import { UAError } from '../wire/errors';
import type { Unsubscribe } from '../wire/port';
import { MidiDevice, MidiPort } from './system';

/** The name LUNA gives the device whose input port receives every device's MIDI. */
const ALL_DEVICE_NAME = 'All';

/**
 * What a message is, from its status byte. A note-on with velocity 0 is a `noteOff`. `sysex` is a
 * whole System Exclusive message, delivered only when asked for.
 */
export type MidiInputType = 'noteOff' | 'noteOn' | 'polyPressure' | 'controlChange' | 'programChange' | 'channelPressure' | 'pitchBend' | 'sysex';

/** One message a MIDI device sent LUNA. */
export interface MidiInputMessage {
  readonly type: MidiInputType;
  /** Status byte with the channel in it, e.g. `0x90`-`0x9f` note on; `0xf0` for a SysEx. */
  readonly status: number;
  /** 0-based channel, `status & 0x0f`; `-1` for a SysEx, which has none. */
  readonly channel: number;
  /** `0` for a SysEx. */
  readonly data1: number;
  /** `0` for a program change or channel pressure, which have one data byte, and for a SysEx. */
  readonly data2: number;
  /**
   * A SysEx's whole message, `0xf0` through `0xf7`, for `type: 'sysex'`; `undefined` for a
   * channel message.
   */
  readonly sysex?: readonly number[];
  /**
   * When LUNA received it, in milliseconds on LUNA's MIDI input clock. Compare it with other
   * messages' times (two notes 250 ms apart read 250 apart); it is not `performance.now()` or
   * `Date.now()`.
   */
  readonly time: number;
  /** The input port it arrived on: the listened device's, or `All`'s for `'all'`. */
  readonly port: MidiPort;
}

/** Where {@link MidiInput.listen} listens: a device (its input port), an input port, or every device. */
export type MidiInputTarget = MidiDevice | MidiPort | 'all';

/** Options for {@link MidiInput.listen}. */
export interface MidiInputListenOptions {
  /**
   * Called when batches went missing between two that arrived (`missed` batches), or when
   * LUNA reports messages it could not queue (`dropped`, LUNA's running total). Held notes may
   * be stuck after either; consider releasing them.
   */
  onGap?: (info: { missed: number; dropped: number }) => void;
  /**
   * Also deliver SysEx messages (`type: 'sysex'`). Default `false`, so a handler written for
   * channel messages never sees one. {@link MidiInput.onSysEx} sets it.
   */
  sysex?: boolean;
}

/** The wire shape of `<input port>/midi_events` (fact 125). */
interface MidiEventsBatch {
  seq: number;
  dropped?: number;
  events: unknown[];
}

function isBatch(v: unknown): v is MidiEventsBatch {
  return typeof v === 'object' && v !== null && typeof (v as MidiEventsBatch).seq === 'number' && Array.isArray((v as MidiEventsBatch).events);
}

function typeOf(status: number, data2: number): MidiInputType {
  switch (status & 0xf0) {
    case 0x80:
      return 'noteOff';
    case 0x90:
      return data2 === 0 ? 'noteOff' : 'noteOn';
    case 0xa0:
      return 'polyPressure';
    case 0xb0:
      return 'controlChange';
    case 0xc0:
      return 'programChange';
    case 0xd0:
      return 'channelPressure';
    default:
      return 'pitchBend';
  }
}

function isSysEx(bytes: unknown): bytes is number[] {
  if (!Array.isArray(bytes) || bytes.length < 2 || bytes[0] !== 0xf0 || bytes[bytes.length - 1] !== 0xf7) return false;
  return bytes.every((b, i) => typeof b === 'number' && Number.isInteger(b) && (i === 0 || i === bytes.length - 1 ? true : b >= 0 && b < 0x80));
}

/**
 * Turn one batch into messages, skipping anything that is not a channel message, or a SysEx
 * when `sysex` is true. A SysEx is `[time_ms, 0xf0, [0xf0, ..., 0xf7]]` (fact 138). Exported for
 * tests.
 */
export function decodeMidiEvents(events: readonly unknown[], port: MidiPort, sysex = false): MidiInputMessage[] {
  const out: MidiInputMessage[] = [];
  for (const e of events) {
    if (sysex && Array.isArray(e) && e.length === 3 && e[1] === 0xf0 && typeof e[0] === 'number' && isSysEx(e[2])) {
      out.push(Object.freeze({ type: 'sysex', status: 0xf0, channel: -1, data1: 0, data2: 0, sysex: Object.freeze([...(e[2] as number[])]), time: e[0], port }));
      continue;
    }
    if (!Array.isArray(e) || e.length < 4) continue;
    const [time, status, data1, data2] = e as unknown[];
    if (typeof time !== 'number' || typeof status !== 'number' || typeof data1 !== 'number' || typeof data2 !== 'number') continue;
    if (status < 0x80 || status > 0xef) continue;
    out.push(Object.freeze({ type: typeOf(status, data2), status, channel: status & 0x0f, data1, data2, time, port }));
  }
  return out;
}

/**
 * Live MIDI input from the MIDI devices LUNA sees (fact 125). Use this for MIDI input in an Add
 * On, not Web MIDI (`navigator.requestMIDIAccess()`): LUNA's macOS web view has no Web MIDI,
 * and this works the same inside LUNA and in a browser.
 *
 * @example
 * await luna.midiDevices.load();
 * const input = new Luna.MidiInput(luna);
 * const stop = input.onNote('all', (note, velocity, on) => console.log(note, velocity, on));
 */
export class MidiInput {
  constructor(
    /** @internal */
    readonly client: Client,
  ) {}

  /**
   * Call `handler` with every message `target` sends LUNA, in arrival order, until the returned
   * function is called. `target` is a {@link MidiDevice} from `luna.midiDevices` (load it
   * first), one of its input ports, or `'all'` for every device. Throws `not_found` for a
   * device with no MIDI in, or for `'all'` before `luna.midiDevices` has loaded.
   *
   * MIDI device uids change when LUNA restarts (fact 123), so an Add On that remembers a device
   * should remember its name and look it up again.
   *
   * @example
   * await luna.midiDevices.load();
   * const input = new Luna.MidiInput(luna);
   * const stop = input.listen('all', (m) => console.log(m.type, m.channel, m.data1, m.data2));
   */
  listen(target: MidiInputTarget, handler: (message: MidiInputMessage) => void, options: MidiInputListenOptions = {}): Unsubscribe {
    const port = this.inputPort(target);
    const path = `${port.path}/midi_events`;
    let lastSeq: number | undefined;
    let lastDropped: number | undefined;
    // Its own subscription to the property, not the Store's shared tap: an event that also
    // matches another subscription (say a recursive one on the device) would reach the tap
    // twice. Subscribing to the property is what starts LUNA's stream (fact 125); the first
    // value it sends has no events and only sets where `seq` starts.
    return this.client.raw.subscribe(path, (event) => {
      if (event.path !== path || event.operation !== undefined || !isBatch(event.data)) return;
      const { seq, dropped = 0, events } = event.data;
      // A seq lower than the last one is a restarted LUNA: start counting again.
      const missed = lastSeq !== undefined && seq > lastSeq + 1 ? seq - lastSeq - 1 : 0;
      const newlyDropped = lastDropped !== undefined && dropped > lastDropped;
      lastSeq = seq;
      lastDropped = dropped;
      if (missed > 0 || newlyDropped) options.onGap?.({ missed, dropped });
      for (const message of decodeMidiEvents(events, port, options.sysex === true)) handler(message);
    });
  }

  /**
   * Note-ons and note-offs from `target`, as `(note, velocity, noteOn, message)`. A note-on
   * with velocity 0 arrives as a note-off. Same targets and rules as {@link listen}.
   *
   * @example
   * const stop = input.onNote(keys, (note, velocity, on) => {
   *   if (on) lights.light(note, velocity); else lights.clear(note);
   * });
   */
  onNote(target: MidiInputTarget, handler: (note: number, velocity: number, noteOn: boolean, message: MidiInputMessage) => void, options?: MidiInputListenOptions): Unsubscribe {
    return this.listen(
      target,
      (m) => {
        if (m.type === 'noteOn' || m.type === 'noteOff') handler(m.data1, m.data2, m.type === 'noteOn', m);
      },
      options,
    );
  }

  /**
   * Controller changes from `target`, as `(controller, value, message)`. Same targets and
   * rules as {@link listen}.
   *
   * @example
   * const stop = input.onControlChange(keys, (cc, value) => {
   *   if (cc === 1) modWheel.value = String(value);
   * });
   */
  onControlChange(target: MidiInputTarget, handler: (controller: number, value: number, message: MidiInputMessage) => void, options?: MidiInputListenOptions): Unsubscribe {
    return this.listen(
      target,
      (m) => {
        if (m.type === 'controlChange') handler(m.data1, m.data2, m);
      },
      options,
    );
  }

  /**
   * Whole SysEx messages from `target`, as `(bytes, message)`, `bytes` running from `0xf0` to
   * `0xf7`. LUNA joins a SysEx that arrives in pieces and drops one over 64 KB (counted in
   * `onGap`'s `dropped`). Same targets and rules as {@link listen}. LUNA builds without SysEx
   * input send none (fact 138).
   *
   * @example
   * await luna.midiDevices.load();
   * const input = new Luna.MidiInput(luna);
   * const synth = luna.midiDevices.items.find((d) => d.name.value === 'DX7');
   * const stop = input.onSysEx(synth, (bytes) => {
   *   if (bytes[1] === 0x43) console.log('Yamaha SysEx,', bytes.length, 'bytes');
   * });
   */
  onSysEx(target: MidiInputTarget, handler: (bytes: readonly number[], message: MidiInputMessage) => void, options: MidiInputListenOptions = {}): Unsubscribe {
    return this.listen(
      target,
      (m) => {
        if (m.type === 'sysex' && m.sysex) handler(m.sysex, m);
      },
      { ...options, sysex: true },
    );
  }

  private inputPort(target: MidiInputTarget): MidiPort {
    if (target === 'all') {
      const all = this.client.midiDevices.items.find((d) => d.name.value === ALL_DEVICE_NAME);
      if (!all?.inputPort) throw new UAError('not_found', "MIDI device 'All' has no input port; load luna.midiDevices first");
      return all.inputPort;
    }
    if (target instanceof MidiDevice) {
      const port = target.inputPort;
      if (!port) throw new UAError('not_found', `MIDI device ${target.name.value ?? target.id} has no input port`, { path: target.path });
      return port;
    }
    if (!(target instanceof MidiPort) || target.isOutput) {
      throw new UAError('invalid_value', `${(target as MidiPort).path} is an output port; MIDI can only be received on an input port`, { path: (target as MidiPort).path });
    }
    return target;
  }
}
