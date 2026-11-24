/**
 * LUNA's Auto Gain service (`/auto_gain`, facts 191-194): it listens to a track's input, then
 * sets the preamp gain on hardware that supports it (Apollo, Volt). `luna.autoGain` follows the
 * service's status and the channels it is listening to; `track.supportsAutoGain` says whether a
 * track's input can take part.
 *
 * @example
 * if (await luna.autoGain.available() && track.supportsAutoGain.value) {
 *   const w = luna.autoGain.watch();
 *   await w.ready;
 *   luna.autoGain.status.onChange(() => label.textContent = luna.autoGain.status.value ?? '');
 *   await luna.autoGain.start(track, { duration: 10 });
 * }
 */
import { childNames } from './presence';
import type { Client } from '../client/client';
import type { Prop } from '../store/prop';
import type { Unsubscribe } from '../wire/port';
import { Collection } from './collection';
import { Node } from './node';

/**
 * `/auto_gain`'s `status` (fact 191). `done_listening`, `overload_error` and `low_signal_error`
 * end a pass; `stopped` is the idle state.
 */
export type AutoGainStatus =
  | 'unknown'
  | 'stopped'
  | 'waiting_for_signal'
  | 'listening'
  | 'overload'
  | 'adjusting_gain'
  | 'done_listening'
  | 'overload_error'
  | 'low_signal_error';

/** A track (or any channel with an input) Auto Gain can run on: its session and its uid. */
export type AutoGainTarget = { readonly sessionUid: string; readonly id: string } | { sessionUid: string; channelUid: string };

/** Options for {@link AutoGain.start}. */
export interface AutoGainStartOptions {
  /**
   * Start listening at once (`auto_start`), on every channel added so far. Default `true`, as
   * LUNA's own setup does; with `false` the channel is added and waits.
   */
  autoStart?: boolean;
  /**
   * How long to listen, in whole seconds (`duration`). Omitted or 0 uses LUNA's default. It is
   * a service-wide setting: it applies to the whole pass, not only this channel (fact 192).
   */
  duration?: number;
}

/**
 * `/auto_gain/channels/<name>`: a channel Auto Gain is listening to. The node name is LUNA's
 * own key; identify a channel by `sessionUid` and `channelUid` (fact 191).
 *
 * @example
 * const ch = luna.autoGain.channelFor(track);
 * ch?.signalLevelPeak.onChange(() => draw(ch.signalLevelPeak.value ?? 0));
 */
export class AutoGainChannel extends Node {
  readonly sessionUid: Prop<string>;
  /** The track (channel) uid. */
  readonly channelUid: Prop<string>;
  /** The input's peak as a linear gain, mirrored from the input's `signal_level_peak` (fact 187). */
  readonly signalLevelPeak: Prop<number>;
  /** Detected instrument, when LUNA's instrument analysis is on for recording; else absent. */
  readonly instrument: Prop<string>;
  /** Detected tempo in BPM, when LUNA's tempo analysis is on for recording; else absent. */
  readonly tempo: Prop<number>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.sessionUid = this.prop<string>('session_uid');
    this.channelUid = this.prop<string>('channel_uid');
    this.signalLevelPeak = this.prop<number>('signal_level_peak');
    this.instrument = this.prop<string>('instrument');
    this.tempo = this.prop<number>('tempo');
  }
}

/**
 * `/auto_gain`: the Auto Gain service. All of its properties are read-only. The service only
 * exists when LUNA's Auto Gain feature is on; check {@link available} first (fact 191).
 *
 * @example
 * const w = luna.autoGain.watch();
 * await w.ready;
 * await luna.autoGain.start(track);
 * luna.autoGain.status.onChange(() => {
 *   if (luna.autoGain.status.value === 'done_listening') console.log('gain set');
 * });
 */
export class AutoGain extends Node {
  /** The service's state. */
  readonly status: Prop<AutoGainStatus>;
  /** A human-readable status line, as LUNA shows it. */
  readonly statusStr: Prop<string>;
  /** Extra information for the current status. */
  readonly info: Prop<string>;
  /** Seconds of listening left in the current pass. */
  readonly countDown: Prop<number>;
  /** The channels Auto Gain is listening to, with their live peaks. */
  readonly channels: Collection<AutoGainChannel>;
  private presence: Promise<boolean> | undefined;

  /** @internal */
  constructor(client: Client) {
    super(client, '/auto_gain');
    this.status = this.prop<AutoGainStatus>('status');
    this.statusStr = this.prop<string>('status_str');
    this.info = this.prop<string>('info');
    this.countDown = this.prop<number>('count_down');
    this.channels = new Collection<AutoGainChannel>(client, '/auto_gain/channels', (p) => new AutoGainChannel(client, p), { levels: 2, commands: false, flatvalue: true });
  }

  /**
   * Whether this LUNA has the Auto Gain service: true when `/` lists `auto_gain` (fact 191).
   * Cached once answered.
   *
   * @example
   * if (!(await luna.autoGain.available())) button.hidden = true;
   */
  available(): Promise<boolean> {
    this.presence ??= this.client.raw
      .get('/', { children: true, properties: false, commands: false })
      .then((reply) => childNames(reply).includes('auto_gain'))
      .catch((err: unknown) => {
        this.presence = undefined; // a dropped connection is not an answer
        throw err;
      });
    return this.presence;
  }

  /**
   * Subscribe to the service recursively and load it, so the status and the channels with
   * their peaks follow LUNA. Call `release` when done.
   *
   * @example
   * const w = luna.autoGain.watch();
   * await w.ready;
   */
  override watch(options: { recursive?: boolean } = {}): { ready: Promise<void>; release: Unsubscribe } {
    const w = this.client.store.watch(this.path, { recursive: options.recursive ?? true, load: { flatvalue: true, commands: false } });
    void this.channels.load().catch(() => undefined);
    return w;
  }

  /**
   * The channel Auto Gain is listening to for `target`, if any.
   *
   * @example
   * const listening = luna.autoGain.channelFor(track) !== undefined;
   */
  channelFor(target: AutoGainTarget): AutoGainChannel | undefined {
    const { sessionUid, channelUid } = keyOf(target);
    return this.channels.items.find((c) => c.sessionUid.value === sessionUid && c.channelUid.value === channelUid);
  }

  /**
   * Start Auto Gain on a track: `post /auto_gain/start_auto_gain {session_uid, channel_uid,
   * auto_start, duration}` (fact 192). LUNA adds a channel under `channels`, turns on the input's
   * signal-level analysis for it, and (with `autoStart`) starts listening. Starting a channel
   * that is already listening changes nothing. LUNA answers before it acts and does not refuse
   * a track whose input cannot take part: check `track.supportsAutoGain` first.
   *
   * @example
   * await luna.autoGain.start(track, { duration: 8 });
   */
  async start(target: AutoGainTarget, options: AutoGainStartOptions = {}): Promise<void> {
    const { sessionUid, channelUid } = keyOf(target);
    const body: Record<string, unknown> = { session_uid: sessionUid, channel_uid: channelUid, auto_start: options.autoStart ?? true };
    if (options.duration !== undefined) {
      if (!Number.isInteger(options.duration) || options.duration < 0) throw new RangeError('autoGain.start: duration is whole seconds, 0 or more');
      if (options.duration > 0) body['duration'] = options.duration;
    }
    await this.post('start_auto_gain', body);
  }

  /**
   * Stop Auto Gain on a track: `post /auto_gain/stop_auto_gain {session_uid, channel_uid}`
   * (fact 193). Its channel goes, and the input's signal-level analysis is turned off.
   *
   * @example
   * await luna.autoGain.stop(track);
   */
  async stop(target: AutoGainTarget): Promise<void> {
    const { sessionUid, channelUid } = keyOf(target);
    await this.post('stop_auto_gain', { session_uid: sessionUid, channel_uid: channelUid });
  }

  /**
   * Stop Auto Gain on every channel, whoever started it: `stop_auto_gain {all: true}` (fact 193).
   *
   * @example
   * await luna.autoGain.stopAll();
   */
  async stopAll(): Promise<void> {
    await this.post('stop_auto_gain', { all: true });
  }
}

function keyOf(target: AutoGainTarget): { sessionUid: string; channelUid: string } {
  return 'channelUid' in target ? { sessionUid: target.sessionUid, channelUid: target.channelUid } : { sessionUid: target.sessionUid, channelUid: target.id };
}

