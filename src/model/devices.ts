/**
 * Device inputs and outputs as live nodes (`/devices/<uid>/inputs/<uid>`,
 * `/devices/<uid>/outputs/<uid>`), the live input analyses LUNA runs on an input, and the
 * active audio engine (the root's `active_audio_engine` property).
 *
 * @example
 * await luna.devices.load();
 * for (const device of luna.devices.items) {
 *   const w = device.inputs.watch();
 *   await w.ready;
 *   for (const input of device.inputs.items) console.log(input.name.value, input.inUse.value);
 * }
 */
import type { Client } from '../client/client';
import { derived, type Prop } from '../store/prop';
import type { Unsubscribe } from '../wire/port';
import type { StemFormat } from './channel';
import { Collection } from './collection';
import { Node } from './node';
import type { AudioDeviceInfo, AudioInput } from './system';

/**
 * A live analysis LUNA can run on a device input (fact 186). The value is the prefix of the
 * engine's `<kind>_analysis_enabled` switch.
 */
export type InputAnalysisKind = 'signal_level' | 'tempo' | 'instrument' | 'stereo_detect';

/** The analysis kinds, in a stable order. */
export const INPUT_ANALYSIS_KINDS: readonly InputAnalysisKind[] = ['signal_level', 'tempo', 'instrument', 'stereo_detect'];

/**
 * `/devices/<device>/inputs/<uid>`: one input of an audio device, the thing a track's
 * `inputNodeUid` points at (facts 76, 185). All of its properties are read-only.
 *
 * The props follow the engine while the input is watched: `device.inputs.watch()` follows every
 * input of the device (hotplug, `in_use`, analysis results); {@link watchAnalysis} watches this
 * one input while it holds an analysis on.
 *
 * @example
 * const input = device.inputs.items[0];
 * console.log(input.name.value, input.stemFormat.value, input.deviceChannels.value);
 * await track.inputNodeUid.set(input.id);
 */
export class DeviceInput extends Node {
  /** The input's uid; the same as {@link Node.id}. */
  readonly uid: Prop<string>;
  readonly name: Prop<string>;
  /** The engine's object type, `input`. */
  readonly type: Prop<string>;
  /** `mono` or `stereo`. */
  readonly stemFormat: Prop<StemFormat>;
  /** Uid of the device the input belongs to (`device_id`). */
  readonly deviceId: Prop<string>;
  readonly deviceName: Prop<string>;
  /** The device's channel numbers this input reads, from 0 (`device_channels`). */
  readonly deviceChannels: Prop<number[]>;
  /** The hardware's channel index list (`ChannelIndex`), as the driver reports it. */
  readonly channelIndex: Prop<number[]>;
  /** The hardware's I/O types (`IOType`), for example `["Mic"]`; empty for a plain driver. */
  readonly ioType: Prop<string[]>;
  /** True while a track in any open session records from this input (fact 185). */
  readonly inUse: Prop<boolean>;
  /**
   * The input's description as LUNA saves it with a track (`io_desc`): `name`, `stem_format`,
   * `device_channels`, `IOType`, `ChannelIndex`, `Name`, `DeviceHwID`, `hardware_index`.
   * Read-only here.
   */
  readonly ioDesc: Prop<Record<string, unknown>>;
  /** `signal_level_analysis_enabled`. Turn it on with {@link watchAnalysis}. */
  readonly signalLevelAnalysisEnabled: Prop<boolean>;
  /** `tempo_analysis_enabled`. */
  readonly tempoAnalysisEnabled: Prop<boolean>;
  /** `instrument_analysis_enabled`. */
  readonly instrumentAnalysisEnabled: Prop<boolean>;
  /** `stereo_detect_analysis_enabled`. */
  readonly stereoDetectAnalysisEnabled: Prop<boolean>;
  /**
   * The input's peak since the last result, as a linear gain (0..1, 1 = full scale), while
   * signal-level analysis is on. `-144` (LUNA's dB floor) means no result: the analysis is off,
   * or the input is below its silence threshold (fact 187).
   */
  readonly signalLevelPeak: Prop<number>;
  /** Detected tempo in BPM while tempo analysis is on; `0` means none detected (fact 187). */
  readonly tempo: Prop<number>;
  /** Detected instrument name while instrument analysis is on; `null` means none (fact 187). */
  readonly instrument: Prop<string | null>;
  /** True when stereo-detect analysis hears a stereo source; false also means no result (fact 187). */
  readonly stereoDetect: Prop<boolean>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.uid = this.prop<string>('uid');
    this.name = this.prop<string>('name');
    this.type = this.prop<string>('type');
    this.stemFormat = this.prop<StemFormat>('stem_format');
    this.deviceId = this.prop<string>('device_id');
    this.deviceName = this.prop<string>('device_name');
    this.deviceChannels = this.prop<number[]>('device_channels');
    this.channelIndex = this.prop<number[]>('ChannelIndex');
    this.ioType = this.prop<string[]>('IOType');
    this.inUse = this.prop<boolean>('in_use');
    this.ioDesc = this.prop<Record<string, unknown>>('io_desc');
    this.signalLevelAnalysisEnabled = this.prop<boolean>('signal_level_analysis_enabled');
    this.tempoAnalysisEnabled = this.prop<boolean>('tempo_analysis_enabled');
    this.instrumentAnalysisEnabled = this.prop<boolean>('instrument_analysis_enabled');
    this.stereoDetectAnalysisEnabled = this.prop<boolean>('stereo_detect_analysis_enabled');
    this.signalLevelPeak = this.prop<number>('signal_level_peak');
    this.tempo = this.prop<number>('tempo');
    this.instrument = this.prop<string | null>('instrument');
    this.stereoDetect = this.prop<boolean>('stereo_detect');
  }

  /**
   * Turn an input analysis on for as long as you hold it, and watch this input so its result
   * prop follows the engine. `release()` turns it back off.
   *
   * The `<kind>_analysis_enabled` switch is shared engine state: LUNA's own GUI, Auto Gain and
   * other clients use the same one (fact 186). So the SDK reference-counts holds per connection
   * and input, reads the switch before the first hold, and turns it on only if it was off; when
   * the last hold is released it turns it off again only if it was the one that turned it on.
   * A switch someone else had on is left on. Another client, or Auto Gain finishing, can still
   * turn it off while you hold it (fact 188); watch `signalLevelAnalysisEnabled` (and friends)
   * if that matters.
   *
   * `ready` rejects if the write is refused; release the hold anyway.
   *
   * @example
   * const hold = input.watchAnalysis('signal_level');
   * await hold.ready;
   * const off = input.signalLevelPeak.onChange(() => meter.value = Math.max(0, input.signalLevelPeak.value ?? 0));
   * // later
   * off();
   * hold.release();
   */
  watchAnalysis(kind: InputAnalysisKind): { ready: Promise<void>; release: Unsubscribe } {
    this.assertLive();
    if (!INPUT_ANALYSIS_KINDS.includes(kind)) throw new TypeError(`watchAnalysis: unknown analysis '${String(kind)}'`);
    return holdAnalysis(this.client, this.path, kind);
  }

  /**
   * The input as the plain record {@link Client.audioInputs} returns, from the current props.
   *
   * @example
   * const rows = device.inputs.items.map((i) => i.snapshot());
   */
  snapshot(): AudioInput {
    return Object.freeze({
      uid: this.id,
      name: this.name.value ?? this.id,
      stemFormat: this.stemFormat.value ?? 'mono',
      deviceId: this.deviceId.value ?? deviceUidOf(this.path),
      inUse: this.inUse.value === true,
    });
  }
}

/**
 * `/devices/<device>/inputs`: a device's inputs. `watch()` here is recursive by default, so a
 * watched collection follows inputs being added and removed (hotplug) and every input's
 * properties: `in_use`, and analysis results while an analysis is on (fact 185).
 *
 * @example
 * const w = device.inputs.watch();
 * await w.ready;
 * device.inputs.onChange(() => render(device.inputs.items));
 * // later
 * w.release();
 */
export class DeviceInputs extends Collection<DeviceInput> {
  /** @internal */
  constructor(client: Client, devicePath: string) {
    super(client, `${devicePath}/inputs`, (p) => new DeviceInput(client, p), { levels: 2, commands: false, flatvalue: true });
  }

  /**
   * Subscribe to the inputs and load them. Recursive unless `{ recursive: false }`, which
   * follows only inputs coming and going. Call `release` when done.
   *
   * @example
   * const w = device.inputs.watch();
   * await w.ready;
   */
  override watch(options: { recursive?: boolean } = {}): { ready: Promise<void>; release: Unsubscribe } {
    return super.watch({ recursive: options.recursive ?? true });
  }
}

/**
 * `/devices/<device>/outputs/<uid>`: one output of an audio device (fact 189). Read-only.
 *
 * @example
 * await device.outputs.load();
 * const monitor = device.outputs.items.find((o) => o.ioType.value?.[0] === 'CtrlRoom');
 */
export class DeviceOutput extends Node {
  readonly uid: Prop<string>;
  readonly name: Prop<string>;
  /** The engine's object type, `output`. */
  readonly type: Prop<string>;
  /** `mono` or `stereo`. */
  readonly stemFormat: Prop<StemFormat>;
  /**
   * The hardware's I/O types (`IOType`), for example `["CtrlRoom"]` for an Apollo's monitor
   * output; empty for a plain driver (fact 189).
   */
  readonly ioType: Prop<string[]>;
  readonly deviceId: Prop<string>;
  readonly deviceName: Prop<string>;
  readonly deviceChannels: Prop<number[]>;
  readonly channelIndex: Prop<number[]>;
  readonly inUse: Prop<boolean>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.uid = this.prop<string>('uid');
    this.name = this.prop<string>('name');
    this.type = this.prop<string>('type');
    this.stemFormat = this.prop<StemFormat>('stem_format');
    this.ioType = this.prop<string[]>('IOType');
    this.deviceId = this.prop<string>('device_id');
    this.deviceName = this.prop<string>('device_name');
    this.deviceChannels = this.prop<number[]>('device_channels');
    this.channelIndex = this.prop<number[]>('ChannelIndex');
    this.inUse = this.prop<boolean>('in_use');
  }
}

/**
 * `/devices/<device>/outputs`: a device's outputs. `watch()` is recursive by default, like
 * {@link DeviceInputs}.
 *
 * @example
 * const w = device.outputs.watch();
 * await w.ready;
 * device.outputs.items.map((o) => o.name.value);
 */
export class DeviceOutputs extends Collection<DeviceOutput> {
  /** @internal */
  constructor(client: Client, devicePath: string) {
    super(client, `${devicePath}/outputs`, (p) => new DeviceOutput(client, p), { levels: 2, commands: false, flatvalue: true });
  }

  /**
   * Subscribe to the outputs and load them; recursive unless `{ recursive: false }`.
   *
   * @example
   * const w = device.outputs.watch();
   * await w.ready;
   */
  override watch(options: { recursive?: boolean } = {}): { ready: Promise<void>; release: Unsubscribe } {
    return super.watch({ recursive: options.recursive ?? true });
  }
}

/** The value of the root's `active_audio_engine` property (fact 190). */
export interface ActiveAudioEngineInfo {
  /** False while LUNA runs with no audio driver. */
  enabled: boolean;
  /** `apollo`, `volt`, `system`, `other`, or `''` when undefined. */
  audio_engine_type: string;
  /** The drivers in use, in the shape `luna.drivers.connected` lists them. */
  devices: AudioDeviceInfo[];
  /** Per-driver output settings; LUNA's own. */
  outputs?: unknown[];
}

/**
 * The audio engine LUNA is running (the root's read-only `active_audio_engine`, fact 190):
 * whether audio is on, which kind of engine, and which drivers it uses. Lets an Add On tell
 * when audio is down.
 *
 * @example
 * const w = luna.activeAudioEngine.watch();
 * await w.ready;
 * luna.activeAudioEngine.enabled.onChange(() => banner.hidden = luna.activeAudioEngine.enabled.value !== false);
 */
export class ActiveAudioEngine {
  /** The whole value, as LUNA sends it. */
  readonly info: Prop<ActiveAudioEngineInfo>;
  /** `info.enabled`. */
  readonly enabled: Prop<boolean>;
  /** `info.audio_engine_type`. */
  readonly engineType: Prop<string>;
  /** `info.devices`. */
  readonly devices: Prop<AudioDeviceInfo[]>;
  private loading: Promise<void> | undefined;

  /** @internal */
  constructor(private readonly client: Client) {
    this.info = client.store.cell<ActiveAudioEngineInfo>('/', 'active_audio_engine');
    this.enabled = derived([this.info], () => this.info.value?.enabled, { distinct: true });
    this.engineType = derived([this.info], () => this.info.value?.audio_engine_type, { distinct: true });
    this.devices = derived([this.info], () => this.info.value?.devices, { distinct: true });
  }

  /**
   * Read the value once. Later calls return the same promise.
   *
   * @example
   * await luna.activeAudioEngine.load();
   * luna.activeAudioEngine.engineType.value; // 'apollo'
   */
  load(): Promise<void> {
    this.loading ??= this.client.store.load(PATH_ACTIVE_ENGINE).then(() => undefined);
    return this.loading;
  }

  /**
   * Subscribe to the property and read it, so the props follow LUNA. Refcounted through the
   * Store; call `release` when done.
   *
   * @example
   * const w = luna.activeAudioEngine.watch();
   * await w.ready;
   */
  watch(): { ready: Promise<void>; release: Unsubscribe } {
    const w = this.client.store.watch(PATH_ACTIVE_ENGINE, { load: {} });
    this.loading ??= w.ready;
    return w;
  }

  /**
   * True when the engine is running and uses `driver`: an id from `luna.drivers.connected`
   * (`AudioDeviceInfo.id`) or the entry itself. Not a `/devices/<uid>` uid: those name device
   * databases, not drivers (fact 190). False before the value is loaded.
   *
   * @example
   * await luna.drivers.load();
   * await luna.activeAudioEngine.load();
   * const live = (luna.drivers.connected.value ?? []).filter((d) => luna.activeAudioEngine.isDeviceActive(d));
   */
  isDeviceActive(driver: string | Pick<AudioDeviceInfo, 'id'>): boolean {
    const id = typeof driver === 'string' ? driver : driver.id;
    const info = this.info.value;
    if (!info || info.enabled === false) return false;
    return (info.devices ?? []).some((d) => d.id === id);
  }
}

const PATH_ACTIVE_ENGINE = '/active_audio_engine';

function deviceUidOf(inputPath: string): string {
  // /devices/<device>/inputs/<uid>
  return inputPath.split('/')[2] ?? '';
}

// ---------------------------------------------------------------------------------------------
// Analysis holds: reference-counted per connection, input and kind.

interface Hold {
  refs: number;
  /** True once this hold turned the switch on, so the last release turns it off. */
  owned: boolean;
  ready: Promise<void>;
  unwatch: Unsubscribe;
}

const holdsByClient = new WeakMap<Client, Map<string, Hold>>();
/** A released hold's switch-off, which the next hold on the same key waits for. */
const teardownsByClient = new WeakMap<Client, Map<string, Promise<void>>>();

function holdAnalysis(client: Client, inputPath: string, kind: InputAnalysisKind): { ready: Promise<void>; release: Unsubscribe } {
  const flag = `${kind}_analysis_enabled`;
  const key = `${inputPath}|${kind}`;
  let holds = holdsByClient.get(client);
  if (!holds) holdsByClient.set(client, (holds = new Map()));
  let teardowns = teardownsByClient.get(client);
  if (!teardowns) teardownsByClient.set(client, (teardowns = new Map()));
  let hold = holds.get(key);
  if (!hold) {
    const store = client.store;
    const w = store.watch(inputPath, { load: { flatvalue: true, commands: false, children: false } });
    const previous = teardowns.get(key) ?? Promise.resolve();
    const made: Hold = { refs: 0, owned: false, unwatch: w.release, ready: Promise.resolve() };
    made.ready = previous
      .then(() => w.ready)
      .then(async () => {
        // Read the switch itself, fresh: LUNA can change it without telling (fact 188).
        await store.load(`${inputPath}/${flag}`);
        if (store.cell<boolean>(inputPath, flag).value === true) return;
        await store.set(inputPath, flag, true);
        made.owned = true;
      });
    hold = made;
    holds.set(key, hold);
  }
  hold.refs++;
  const h = hold;
  let released = false;
  return {
    ready: h.ready,
    release: () => {
      if (released) return;
      released = true;
      if (--h.refs > 0) return;
      if (holds.get(key) === h) holds.delete(key);
      const teardown = h.ready
        .catch(() => undefined)
        .then(async () => {
          if (h.owned) await client.store.set(inputPath, flag, false);
        })
        .catch(() => undefined)
        .finally(() => {
          h.unwatch();
          if (teardowns.get(key) === teardown) teardowns.delete(key);
        });
      teardowns.set(key, teardown);
    },
  };
}

/**
 * @internal How many holds this connection has on an input's analysis; for tests.
 */
export function analysisHolds(client: Client, inputPath: string, kind: InputAnalysisKind): number {
  return holdsByClient.get(client)?.get(`${inputPath}|${kind}`)?.refs ?? 0;
}
