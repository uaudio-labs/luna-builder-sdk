/**
 * Engine-wide nodes outside any session: audio drivers, hardware devices, preferences,
 * renders and jobs. Thin typed views; use `property()` for anything not named here.
 */
import type { Client } from '../client/client';
import { UAError } from '../wire/errors';
import { derived, type Prop } from '../store/prop';
import { Collection } from './collection';
import { Node } from './node';

export interface AudioDeviceInfo {
  id: string;
  name: string;
  type: string;
  manufacture?: string;
  transport?: string;
  num_inputs: number;
  num_outputs: number;
  input_names?: string[] | string;
  output_names?: string[] | string;
  is_system_input?: boolean;
  is_system_output?: boolean;
}

/** `/drivers`: what audio hardware the engine sees. */
export class Drivers extends Node {
  readonly connected: Prop<AudioDeviceInfo[]>;
  readonly unsupported: Prop<AudioDeviceInfo[]>;
  readonly sampleRates: Prop<number[]>;

  /** @internal */
  constructor(client: Client) {
    super(client, '/drivers');
    this.connected = this.prop<AudioDeviceInfo[]>('connected');
    this.unsupported = this.prop<AudioDeviceInfo[]>('unsupported');
    this.sampleRates = this.prop<number[]>('sample_rates');
  }
}

/** A device input a track can record from, as {@link Client.audioInputs} lists it. */
export interface AudioInput {
  /** What a track's `inputNodeUid` is set to. */
  readonly uid: string;
  readonly name: string;
  /** `mono` or `stereo`. */
  readonly stemFormat: string;
  /** The device this input belongs to, e.g. `BuiltInMicrophoneDevice`. */
  readonly deviceId: string;
  /** True when another track already records from it. */
  readonly inUse: boolean;
}

/** `/devices/<uid>`: a hardware or virtual device with its own tracks, buses, inputs, outputs. */
export class Device extends Node {
  readonly name: Prop<string>;
  readonly deviceType: Prop<string>;
  readonly online: Prop<boolean>;
  readonly sampleRate: Prop<number>;
  readonly clockSource: Prop<string>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.name = this.prop<string>('name');
    this.deviceType = this.prop<string>('device_type');
    this.online = this.prop<boolean>('online');
    this.sampleRate = this.prop<number>('sample_rate');
    this.clockSource = this.prop<string>('clock_source');
  }
}

export class Devices extends Collection<Device> {
  /** @internal */
  constructor(client: Client) {
    super(client, '/devices', (p) => new Device(client, p), { levels: 2, commands: false, flatvalue: true });
  }
}

/** `/preferences`: engine preferences as writable properties by name. */
export class Preferences extends Node {
  readonly ioBufferSize: Prop<number>;
  readonly playFromStopLocation: Prop<boolean>;
  readonly recordMute: Prop<boolean>;
  readonly metronomeSound: Prop<string>;
  readonly metronomeSounds: Prop<string[]>;

  /** @internal */
  constructor(client: Client) {
    super(client, '/preferences');
    this.ioBufferSize = this.writableProp<number>('io_buffer_size');
    this.playFromStopLocation = this.writableProp<boolean>('play_from_stop_location');
    this.recordMute = this.writableProp<boolean>('record_mute');
    this.metronomeSound = this.writableProp<string>('metronome_sound');
    this.metronomeSounds = this.prop<string[]>('metronome_sounds');
  }
}

/**
 * `/renders/<uid>`: a bounce or an export. `state` runs `created` -> `running` ->
 * `completed` | `aborted`, and LUNA drops the node shortly after it settles, so latch
 * anything you still need rather than reading it later (fact 44).
 *
 * @example
 * const { render } = await session.bounce({ channelUids: [track.id] });
 * render.progress.onChange(() => (bar.value = render.progress.value ?? 0));
 * await render.done();
 */
export class Render extends Node {
  readonly state: Prop<string>;
  /** 0..100, as the engine reports it. {@link progress} is the 0..1 view. */
  readonly percentComplete: Prop<number>;
  readonly errorMessage: Prop<string | null>;
  readonly name: Prop<string>;
  readonly renderType: Prop<string>;
  /** Seconds left, as the engine estimates it; absent for an offline render. */
  readonly timeRemaining: Prop<number | undefined>;
  /** True for an offline (faster than real time) render, which reports no time remaining. */
  readonly isOffline: Prop<boolean>;
  readonly totalSamples: Prop<number | undefined>;
  /** 0..1, ready for a `<progress>` element. */
  readonly progress: Prop<number>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.state = this.prop<string>('state');
    this.percentComplete = this.prop<number>('percent_complete');
    this.errorMessage = this.prop<string | null>('error_message');
    this.name = this.prop<string>('name');
    this.renderType = this.prop<string>('type');
    this.timeRemaining = this.prop<number | undefined>('time_remaining');
    this.isOffline = this.prop<boolean>('render_is_offline');
    this.totalSamples = this.prop<number | undefined>('total_samples');
    this.progress = derived([this.percentComplete], () => (this.percentComplete.value ?? 0) / 100);
  }

  /** `completed`, `aborted` or `failed`: nothing more will happen. */
  get isTerminal(): boolean {
    const s = this.state.value;
    return s === 'completed' || s === 'aborted' || s === 'failed';
  }

  /**
   * Resolve when the render completes; reject when it is aborted, fails, or the engine
   * removes the node before it was seen to finish. A short offline render can finish and
   * vanish before anything observes it (fact 44), which surfaces as a `removed` rejection
   * even though the output was written.
   */
  done(timeoutMs = 10 * 60_000): Promise<void> {
    // Pushes only reach subscribed paths (fact 34), and nothing else here necessarily
    // watches `/renders`, so this owns a subscription for as long as it waits. Recursive,
    // because it needs both this node's `state` and its removal from the folder.
    const watch = this.client.store.watch('/renders', { recursive: true, load: false });
    return new Promise<void>((resolve, reject) => {
      let finish = (): void => undefined;
      const settle = (): boolean => {
        const s = this.state.value;
        if (s === 'completed') {
          finish();
          resolve();
          return true;
        }
        if (s === 'aborted' || s === 'failed') {
          finish();
          reject(new UAError(s, `render ${this.name.value ?? this.id} ${s}${this.errorMessage.value ? `: ${this.errorMessage.value}` : ''}`, { path: this.path }));
          return true;
        }
        return false;
      };
      const timer = setTimeout(() => {
        finish();
        reject(new UAError('no_effect', `render ${this.id} did not settle within ${timeoutMs} ms`, { path: this.path }));
      }, timeoutMs);
      const offState = this.state.onChange(() => settle());
      // The node going away is the other way a render ends.
      const renders = this.client.store.children('/renders');
      const offChildren = renders.onChange(() => {
        if (settle()) return;
        if (!(renders.value ?? []).includes(this.id)) {
          finish();
          reject(new UAError('removed', `render ${this.id} was removed before it was seen to finish`, { path: this.path }));
        }
      });
      finish = () => {
        clearTimeout(timer);
        offState();
        offChildren();
        watch.release();
      };
      settle();
    });
  }

  abort(): Promise<unknown> {
    return this.wire.post('/renders/abort', { uid: this.id });
  }

  delete(): Promise<unknown> {
    return this.wire.post('/renders/delete', { uid: this.id });
  }
}

export class Renders extends Collection<Render> {
  /** @internal */
  constructor(client: Client) {
    super(client, '/renders', (p) => new Render(client, p), { levels: 2, commands: false, flatvalue: true });
  }
}

/**
 * `/jobs/<uid>`: long-running engine jobs (lyric transcription, chord extraction, ...).
 * `percentComplete` is 0..100. Terminal jobs are published and then removed, so latch the last
 * snapshot if you need it. Only `cancel()` exists; there is no delete.
 */
export class Job extends Node {
  readonly uid: Prop<string>;
  /** Nil uuid (32 zeros) when the job belongs to no session. */
  readonly sessionUid: Prop<string>;
  readonly jobType: Prop<string>;
  /** `queued | running | canceling | completed | failed | canceled`. */
  readonly status: Prop<string>;
  readonly stage: Prop<string>;
  readonly error: Prop<string>;
  readonly warning: Prop<string>;
  /** Track uid the job targets, when any. */
  readonly targetUid: Prop<string | undefined>;
  readonly cancellable: Prop<boolean>;
  readonly percentComplete: Prop<number>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.uid = this.prop<string>('uid');
    this.sessionUid = this.prop<string>('session_uid');
    this.jobType = this.prop<string>('job_type');
    this.status = this.prop<string>('status');
    this.stage = this.prop<string>('stage');
    this.error = this.prop<string>('error');
    this.warning = this.prop<string>('warning');
    this.targetUid = this.prop<string | undefined>('target_uid');
    this.cancellable = this.prop<boolean>('cancellable');
    this.percentComplete = this.prop<number>('percent_complete');
  }

  get isTerminal(): boolean {
    const s = this.status.value;
    return s === 'completed' || s === 'failed' || s === 'canceled';
  }

  cancel(): Promise<unknown> {
    return this.post('commands/cancel_job', {});
  }
}

export class Jobs extends Collection<Job> {
  /** @internal */
  constructor(client: Client) {
    super(client, '/jobs', (p) => new Job(client, p), { levels: 2, commands: false, flatvalue: true });
  }
}
