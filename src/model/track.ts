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
import { Channel } from './channel';
import { MidiOutputs } from './midi-routing';
import type { Control } from './control';
import type { PresetRow } from './presets';
import { settle } from './settle';

export type TrackType = 'audio' | 'instrument' | 'midi_matrix' | 'bus' | 'click' | 'count_in' | 'multi_output' | 'video';

/** The commands LUNA can run on a take once it is recorded (fact 233). */
export const POST_RECORD_COMMANDS = ['extract_lyrics', 'extract_chords'] as const;
export type PostRecordCommand = (typeof POST_RECORD_COMMANDS)[number];

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
  /**
   * Whether Auto Gain can run on this track's input (`supports_auto_gain`, read-only): true for
   * an input on hardware whose preamp LUNA can set. LUNA works it out after the input changes,
   * so it can arrive a moment later (fact 194).
   *
   * @example
   * button.disabled = track.supportsAutoGain.value !== true;
   */
  readonly supportsAutoGain: Prop<boolean>;
  /**
   * Where this track sends its MIDI (facts 219-220). `await track.midiOutputs.load()` once.
   *
   * @example
   * await track.midiOutputs.set([{ track: synth, channel: 0 }]);
   */
  readonly midiOutputs: MidiOutputs;
  /**
   * What LUNA runs on each audio take this track records, once the take lands (fact 233):
   * `extract_lyrics` transcribes it into `session.lyrics`, `extract_chords` detects its chords.
   * LUNA keeps the list while the session is open, not in the session file: set it again after
   * reopening. `[]` runs nothing.
   *
   * @example
   * await track.postRecordCommands.set(['extract_lyrics']);
   */
  readonly postRecordCommands: WritableProp<PostRecordCommand[]>;
  /**
   * The instrument LUNA detected on this track (`instrument_determined`), e.g. `"Electric
   * Guitar"`, or `null` (fact 233). Read-only here: it is LUNA's analysis result.
   *
   * @example
   * label.textContent = track.instrumentDetermined.value ?? '';
   */
  readonly instrumentDetermined: Prop<string | null>;
  /**
   * True once the name was set as the user's own (LUNA's rename, or {@link rename}): a track
   * or instrument preset loaded later keeps it (fact 165). `name.set` leaves it as it is.
   */
  readonly nameModified: Prop<boolean>;

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
    this.supportsAutoGain = this.prop<boolean>('supports_auto_gain');
    this.nameModified = this.prop<boolean>('name_modified');
    this.midiOutputs = new MidiOutputs(client, path, sessionUid, this.id);
    this.postRecordCommands = this.writableProp<PostRecordCommand[]>('post_record_commands');
    this.instrumentDetermined = this.prop<string | null>('instrument_determined');
  }

  protected override release(): void {
    this.midiOutputs.dispose();
    super.release();
  }

  /** Track solo (a track-level control, unlike mute which is on the main output). */
  get solo(): Control {
    return this.controls.get('solo');
  }

  /**
   * Rename the track as LUNA's own rename does: the write carries request parameter
   * `name_modified=true`, so LUNA marks the name as the user's and a track or instrument preset
   * loaded later keeps it (fact 165). `name.set` renames without that mark, and the next
   * {@link loadPreset} replaces the name. Optimistic like `name.set`; {@link nameModified}
   * follows on LUNA's push.
   *
   * @example
   * await track.rename('Lead Vocal');
   * await track.loadPreset(preset); // still 'Lead Vocal'
   */
  async rename(name: string): Promise<void> {
    this.assertLive();
    await this.client.store.set(this.path, 'name', name, name, { name_modified: 'true' });
    // LUNA can answer before it delivers an earlier push of the old name (just after the track
    // was made, say), which would put the old name back; re-read until LUNA shows the new one.
    await settle(() => this.name.value === name, 'rename', {
      path: this.path,
      disposed: () => this.disposed,
      refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true, propfilter: ['name', 'name_modified'] }),
      flush: () => this.client.store.scheduler.flush(),
    });
  }

  /**
   * Apply a preset to this track in one undo step, as LUNA's track header PRESETS > Assign
   * does (fact 132). A track preset replaces the track's plugins, sends and mixer settings; an
   * instrument plugin's preset replaces the instrument only, and needs an instrument track. The
   * track takes the preset's name unless it was renamed in LUNA; a name set with `name.set`
   * does not count, and is replaced; use {@link rename} for a name that stays. `presetUid` follows.
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

  /**
   * Duplicate this track in one undo step and resolve to the new {@link Track} once
   * `session.tracks` lists it with its properties loaded. LUNA copies clips and automation
   * unless `includeContent` is false (then routing, plugins and I/O only). The copy goes
   * right after the track or bus `after` names, else right after this track. (LUNA's field is
   * `before_uid`, but it places the copy after that channel: fact 166.) The SDK names the new
   * uid up front (`destination_track_uid`), so nothing is found by name.
   *
   * @example
   * const copy = await track.duplicate({ includeContent: false, after: otherTrack });
   * copy.name.value; // LUNA's name for the copy
   */
  async duplicate(options: { includeContent?: boolean; after?: Channel | string; timeoutMs?: number } = {}): Promise<Track> {
    this.assertLive();
    const uid = newChannelUid();
    const payload: Record<string, unknown> = { session_uid: this.sessionUid, track_uid: [this.id], destination_track_uid: [uid] };
    if (options.includeContent !== undefined) payload['include_content'] = options.includeContent;
    if (options.after !== undefined) payload['before_uid'] = typeof options.after === 'string' ? options.after : options.after.id;
    await this.wire.post(`/sessions/${this.sessionUid}/duplicate_tracks`, payload);
    const tracks = this.client.sessions.items.member(this.sessionUid).tracks;
    await settle(() => tracks.byId(uid) !== undefined, 'duplicate track', {
      path: `/sessions/${this.sessionUid}/tracks`,
      ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
      refresh: () => tracks.reload(),
      flush: () => this.client.store.scheduler.flush(),
    });
    await tracks.membersReady();
    await this.client.settled();
    return tracks.byId(uid)!;
  }
}

/** A fresh channel uid as LUNA writes them: 32 lowercase hex digits. */
function newChannelUid(): string {
  return globalThis.crypto.randomUUID().replaceAll('-', '');
}
