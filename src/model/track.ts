/**
 * A track: `/sessions/<uid>/tracks/<id>`.
 *
 * @example
 * const t = session.tracks.byId(uid)!;
 * t.name.value; t.trackType.value;      // 'Vocal', 'audio'
 * await t.name.set('Lead Vocal');
 * await t.recordEnabled.set(true);
 * await t.mute.toggle();                 // main output mute
 * await t.solo.toggle();                 // track solo
 * await t.delete();
 */
import type { Client } from '../client/client';
import type { Prop, WritableProp } from '../store/prop';
import { automationModeOrdinal, type AutomationModeName } from './automation';
import { Channel } from './channel';
import type { Control } from './control';
import type { PresetRow } from './presets';

export type TrackType = 'audio' | 'instrument' | 'midi_matrix' | 'bus' | 'click' | 'count_in' | 'multi_output' | 'video';

export class Track extends Channel {
  readonly trackType: Prop<TrackType>;
  readonly ioType: Prop<string>;
  readonly recordEnabled: WritableProp<boolean>;
  /**
   * The track's input monitor switch (`input_monitor`). LUNA can monitor the input while
   * this is off, for example auto-monitoring an armed track; read `inputMonitoring` for what
   * is happening now. Turning it on rejects with `uasrv.invalid_value` while the record mute
   * preference is on and no Apollo is active (fact 88).
   *
   * @example
   * await t.inputMonitor.set(true);
   * t.inputMonitor.onChange(() => console.log('switch', t.inputMonitor.value));
   */
  readonly inputMonitor: WritableProp<boolean>;
  /**
   * Whether LUNA is monitoring this track's input right now (`input_monitor_state`,
   * read-only). It can be true while `inputMonitor` is false: an armed track is monitored
   * while stopped or punched in (fact 88).
   *
   * @example
   * t.inputMonitoring.onChange(() => led.classList.toggle('on', t.inputMonitoring.value === true));
   */
  readonly inputMonitoring: Prop<boolean>;
  /** Description of the assigned input. */
  readonly inputDesc: Prop<unknown>;
  readonly inputNodeUid: WritableProp<string | null>;
  /** Uid of the active playlist; the playlist object lives under `session.playlists`. */
  readonly playlistUid: Prop<string>;
  readonly hasPreamp: Prop<boolean>;
  readonly recordMute: Prop<boolean>;
  /**
   * The uid of the track preset (or instrument plugin preset) the track was made from or last
   * had applied, or null (fact 132).
   */
  readonly presetUid: Prop<string | null>;
  /** That preset's name, or null. */
  readonly presetName: Prop<string | null>;

  /** @internal */
  constructor(client: Client, path: string, sessionUid: string) {
    super(client, path, sessionUid);
    this.trackType = this.prop<TrackType>('track_type');
    this.ioType = this.prop<string>('io_type');
    this.recordEnabled = this.writableProp<boolean>('record_enabled');
    this.inputMonitor = this.writableProp<boolean>('input_monitor');
    this.inputMonitoring = this.prop<boolean>('input_monitor_state');
    this.inputDesc = this.prop<unknown>('input_desc');
    this.inputNodeUid = this.writableProp<string | null>('input_node_uid');
    this.playlistUid = this.prop<string>('playlist_uid');
    this.hasPreamp = this.prop<boolean>('has_preamp');
    this.recordMute = this.prop<boolean>('record_mute');
    this.presetUid = this.prop<string | null>('preset_uid');
    this.presetName = this.prop<string | null>('preset_name');
  }

  /** Track solo (a track-level control, unlike mute which is on the main output). */
  get solo(): Control {
    return this.controls.get('solo');
  }

  /** Set the automation mode (`off | read | write | touch | latch`). */
  setAutomationMode(mode: AutomationModeName): Promise<unknown> {
    return this.wire.post(`/sessions/${this.sessionUid}/set_automode_on_tracks`, { uid: this.sessionUid, tracks: [this.id], automation_mode: automationModeOrdinal(mode) });
  }

  /**
   * Apply a preset to this track in one undo step, as LUNA's track header PRESETS > Assign
   * does (fact 132). A track preset replaces the track's plugins, sends and mixer settings; an
   * instrument plugin's preset replaces the instrument only, and needs an instrument track. The
   * track takes the preset's name unless it was renamed in LUNA; a name set with `name.set`
   * does not count, and is replaced. `presetUid` follows.
   *
   * @example
   * await track.loadPreset(sel.presets.items[0]);
   * track.presetName.value; // that preset's name
   */
  async loadPreset(preset: string | Pick<PresetRow, 'uid'>): Promise<void> {
    const uid = typeof preset === 'string' ? preset : preset.uid;
    await this.wire.post('/presets/devices/track/load', { session_uid: this.sessionUid, uid: this.id, preset_uid: uid });
  }

  /** Delete this track. */
  async delete(): Promise<void> {
    await this.wire.post(`/sessions/${this.sessionUid}/delete_tracks`, { session_uid: this.sessionUid, track_uid: [this.id] });
  }

  /** Duplicate this track. Resolves to the reply, which names the new channel. */
  duplicate(options: { includeContent?: boolean } = {}): Promise<unknown> {
    const payload: Record<string, unknown> = { session_uid: this.sessionUid, track_uid: [this.id] };
    if (options.includeContent !== undefined) payload['include_content'] = options.includeContent;
    return this.wire.post(`/sessions/${this.sessionUid}/duplicate_tracks`, payload);
  }
}
