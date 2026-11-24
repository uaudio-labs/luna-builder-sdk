/**
 * A clip on a playlist: `/sessions/<uid>/playlists/<pl>/clips/<clip>`.
 *
 * Units (fact 16): `start`/`stop` are timeline ticks; `sourceStart`/`sourceStop` are
 * nanoseconds into the source file; `gain` is dB.
 *
 * @example
 * for (const c of playlist.clips.items) {
 *   console.log(c.name.value, c.start.value! / Luna.TICKS_PER_BEAT, 'beats');
 * }
 * await clip.trim(clip.start.value!, clip.start.value! + Luna.WHOLE_NOTE);
 * await clip.move(clip.start.value! + Luna.WHOLE_NOTE);
 * await clip.setFadeIn(Luna.QUARTER_NOTE);
 * await clip.delete();
 */
import type { Client } from '../client/client';
import type { Collection } from './collection';
import type { FadeShape } from './compiled-clip';
import { Context } from './context';
import { Controls } from './controls';
import type { Control } from './control';
import { Warps } from './warps';
import { derived, type Prop, type WritableProp } from '../store/prop';
import { MidiClip } from './midi';
import { Disposed, UAError } from '../wire/errors';
import { Node } from './node';
import { midiByte, requireTick, settle } from './settle';
import type { TransactionMode } from './session';

export type ClipType = 'audio' | 'video' | 'midi';

const CLIP_TYPES: Record<number, ClipType> = { 0: 'audio', 1: 'video', 2: 'midi' };

/** The engine sends clip_type as 0/1/2 or as a string; normalise to the string form. */
export function clipTypeFrom(raw: unknown): ClipType | undefined {
  if (typeof raw === 'number') return CLIP_TYPES[raw];
  if (raw === 'audio' || raw === 'video' || raw === 'midi') return raw;
  return undefined;
}

/** One MIDI event to add to a clip. `tick` is relative to the clip start. */
export interface MidiEvent {
  tick: number;
  /** Status byte, e.g. 0x90 note on, 0x80 note off, 0xB0 control change. */
  status: number;
  data1: number;
  data2?: number;
}

/** One note for {@link Clip.addNotes}. `tick` is relative to the clip start. */
export interface ClipNote {
  pitch: number;
  tick: number;
  lengthTicks: number;
  /** Note-on velocity, 1-127. Default 100. */
  velocity?: number;
  /** MIDI channel, 0-15. Default 0. */
  channel?: number;
}

/** Where a crossfade sits on the edit between two clips, for {@link Clip.crossfade}. */
export type CrossfadeAlign = 'center' | 'before' | 'after';

/** One stored fade row of a clip (`<clip>/fades/<uid>`), offsets relative to the clip edge. */
interface FadeRow {
  readonly uid: string;
  readonly type: string;
  readonly contributor: string | undefined;
  readonly startOffset: number;
  readonly stopOffset: number;
}

const FADE_SHAPES: readonly string[] = ['linear', 'equal_power', 'log'];

/** Reject a shape LUNA would refuse or silently replace (fact 117). */
export function requireFadeShape(shape: unknown, what: string): FadeShape | undefined {
  if (shape === undefined) return undefined;
  if (typeof shape !== 'string' || !FADE_SHAPES.includes(shape)) throw new UAError('out_of_range', `${what}: shape must be one of ${FADE_SHAPES.join(', ')}`);
  return shape as FadeShape;
}

/** A clip's state at one moment, as plain data: what a view draws from. */
export interface ClipSnapshot {
  readonly uid: string;
  readonly name: string | undefined;
  readonly clipType: ClipType | undefined;
  readonly start: number | undefined;
  readonly stop: number | undefined;
  readonly sourceUid: string | undefined;
  readonly sourceStart: number | undefined;
  readonly sourceStop: number | undefined;
  readonly layer: number | undefined;
  readonly muted: boolean | undefined;
  readonly gain: number | undefined;
  readonly renderSourceUid: string | undefined;
  readonly renderState: string | undefined;
  readonly midiSourceStart: number | undefined;
}

export class Clip extends Node {
  private midiClip: MidiClip | undefined;
  private deleting = false;
  private contextView: Context | undefined;
  private controlsFolder: Controls | undefined;
  private warpList: Warps | undefined;

  readonly uid: Prop<string>;
  readonly name: WritableProp<string>;
  /** Timeline start, ticks. */
  readonly start: Prop<number>;
  /** Timeline end, ticks. */
  readonly stop: Prop<number>;
  /** Offset into the source file, nanoseconds. */
  readonly sourceStart: Prop<number>;
  /** End offset into the source file, nanoseconds. */
  readonly sourceStop: Prop<number>;
  /** Uid of the source audio file under the session's workspace `audio` folder. */
  readonly sourceUid: Prop<string>;
  /** Clip gain in dB. */
  readonly gain: WritableProp<number>;
  /** Stacking layer on its playlist; the higher layer plays where clips overlap. */
  readonly layer: Prop<number>;
  /** Whether the clip is muted (`mute`, reported as a boolean or 0/1). */
  readonly muted: Prop<boolean>;
  readonly clipType: Prop<ClipType | undefined>;
  readonly bypass: Prop<boolean>;
  /**
   * The time-stretched source LUNA renders when the clip's tick span does not match its
   * source span at the session tempo, and the state of that render (`current` when it is the
   * audio actually played). {@link clipAudio} picks between this and `sourceUid` (fact 73).
   */
  readonly renderSourceUid: Prop<string | undefined>;
  readonly renderState: Prop<string | undefined>;
  /**
   * For a MIDI clip: the MIDI table tick that sits at this clip's start (fact 41). 0 for
   * rows created in place; the clip's start tick for an imported MIDI file.
   */
  readonly midiSourceStart: Prop<number>;

  /** @internal */
  constructor(
    client: Client,
    path: string,
    private readonly sessionUid: string,
    /** @internal The kind of `session.transaction()` open, which decides how the note verbs settle. */
    private readonly transactionMode?: () => TransactionMode | undefined,
    /** @internal The playlist's clip list, to hand back the clips a copy or split makes. */
    private readonly siblings?: () => Collection<Clip>,
  ) {
    super(client, path);
    this.uid = this.prop<string>('uid');
    this.name = this.writableProp<string>('name');
    this.start = this.prop<number>('start');
    this.stop = this.prop<number>('stop');
    this.sourceStart = this.prop<number>('source_start');
    this.sourceStop = this.prop<number>('source_stop');
    this.sourceUid = this.prop<string>('source_uid');
    this.gain = this.writableProp<number>('gain');
    this.layer = this.prop<number>('layer');
    const mute = this.prop<unknown>('mute');
    this.muted = derived([mute], () => (mute.value === undefined || mute.value === null ? undefined : mute.value === true || mute.value === 1) as boolean);
    const rawType = this.prop<unknown>('clip_type');
    this.clipType = derived([rawType], () => clipTypeFrom(rawType.value));
    this.bypass = this.prop<boolean>('bypass');
    this.renderSourceUid = this.prop<string | undefined>('render_source_uid');
    this.renderState = this.prop<string | undefined>('render_state');
    this.midiSourceStart = this.prop<number>('midi_source_start');
  }

  /**
   * This clip's MIDI as live `events` and `notes` lists. Created on first use and shared;
   * call `ready()` before reading. Empty for an audio clip.
   *
   * @example
   * await clip.midi.ready();
   * clip.midi.notes.onChange(() => draw(clip.midi.notes.items));
   */
  get midi(): MidiClip {
    this.midiClip ??= new MidiClip(this.client, this.path, this.midiSourceStart, {
      sessionPath: `/sessions/${this.sessionUid}`,
      sessionUid: this.sessionUid,
      playlistUid: this.playlistUid,
      clipUid: this.id,
      startTick: () => this.start.value,
      transactionMode: this.transactionMode,
    });
    return this.midiClip;
  }

  /**
   * Every field at once, as a frozen plain object, so a view draws one consistent state
   * rather than reading props across a push.
   *
   * @example
   * playlist.clips.onChange(() => draw(playlist.clips.items.map((c) => c.snapshot())));
   */
  snapshot(): ClipSnapshot {
    return Object.freeze({
      uid: this.id,
      name: this.name.value,
      clipType: this.clipType.value,
      start: this.start.value,
      stop: this.stop.value,
      sourceUid: this.sourceUid.value,
      sourceStart: this.sourceStart.value,
      sourceStop: this.sourceStop.value,
      layer: this.layer.value,
      muted: this.muted.value,
      gain: this.gain.value,
      renderSourceUid: this.renderSourceUid.value,
      renderState: this.renderState.value,
      midiSourceStart: this.midiSourceStart.value,
    });
  }

  /**
   * The clip's own controls (`<clip>/controls/<type>`). LUNA gives every clip a `gain` one
   * (fact 228); see {@link gainControl}.
   *
   * @example
   * await clip.controls.load();
   * clip.controls.items.map((c) => c.controlType.value); // ['gain']
   */
  get controls(): Controls {
    this.controlsFolder ??= new Controls(this.client, `${this.path}/controls`);
    return this.controlsFolder;
  }

  /**
   * The clip gain control (fact 228): its `automation` lane is the clip-gain envelope, in dB,
   * with ticks relative to the clip's start, edited with the usual breakpoint verbs. Its value
   * follows {@link gain}. {@link clipGainAt} evaluates the lane as LUNA does.
   *
   * @example
   * await clip.gainControl.load();
   * const lane = clip.gainControl.automation;
   * await lane.insert([{ tick: 0, value: 0 }, { tick: Luna.WHOLE_NOTE, value: -144 }]); // fade to silence
   * Luna.clipGainAt(lane.breakpoints, Luna.HALF_NOTE); // -72
   */
  get gainControl(): Control {
    return this.controls.get('gain');
  }

  /**
   * The clip's warp markers (facts 229-231). Call `load()` before reading.
   *
   * @example
   * await clip.warps.load();
   * clip.warps.markers; // [{ rowid, start, sourceStart, type }]
   */
  get warps(): Warps {
    this.warpList ??= new Warps(this.client, this.path, this.sessionUid);
    return this.warpList;
  }

  /** The playlist this clip sits on, taken from its path. */
  get playlistUid(): string {
    return this.path.split('/')[4] ?? '';
  }

  /** Length on the timeline, ticks. */
  get length(): number | undefined {
    const a = this.start.value;
    const b = this.stop.value;
    return a === undefined || b === undefined ? undefined : b - a;
  }

  private sessionPost(command: string, payload: Record<string, unknown>): Promise<unknown> {
    if (this.disposed) return Promise.reject(new Disposed('Clip', this.path));
    return this.wire.post(`/sessions/${this.sessionUid}/${command}`, { session_uid: this.sessionUid, ...payload });
  }

  /** The cell listing this clip's siblings, and a re-read of it for {@link settle}. */
  private settleOptions() {
    const parent = this.path.slice(0, this.path.lastIndexOf('/'));
    return { path: this.path, disposed: () => this.disposed && !this.deleting, refresh: () => this.client.store.load(parent, { levels: 2, commands: false, flatvalue: true }), flush: () => this.client.store.scheduler.flush() };
  }

  /**
   * Delete this clip and resolve once it has left its playlist. `delete_clip` answers the
   * same whether or not anything was deleted (fact 71), so the model is the proof.
   *
   * @example
   * await clip.delete();
   */
  async delete(): Promise<unknown> {
    const reply = await this.sessionPost('delete_clip', { uid: this.id });
    const parent = this.path.slice(0, this.path.lastIndexOf('/'));
    // Its own removal disposes this clip; that is the success being waited for.
    this.deleting = true;
    try {
      await settle(() => !(this.client.store.children(parent).value ?? []).includes(this.id), 'delete clip', this.settleOptions());
    } finally {
      this.deleting = false;
    }
    // Deliver the removal now, so this clip (and the playlist's list) reflect it on return.
    this.client.store.scheduler.flush();
    return reply;
  }

  /**
   * Set new timeline bounds (ticks). With `split`, cut the clip instead of trimming it; with
   * `stretch`, time-compress or expand the content to fit rather than revealing or hiding
   * source audio.
   *
   * `trim_clip` is a command of the **edit context**, not of the session.
   *
   * @example
   * await clip.trim(clip.start.value!, clip.stop.value! - Luna.QUARTER_NOTE);
   */
  async trim(startTick: number, stopTick: number, options: { split?: boolean; stretch?: boolean } = {}): Promise<unknown> {
    this.assertLive();
    const payload: Record<string, unknown> = { session_uid: this.sessionUid, clip_uid: this.id, start: requireTick(startTick, 'startTick'), stop: requireTick(stopTick, 'stopTick') };
    if (options.split !== undefined) payload['split'] = options.split;
    if (options.stretch !== undefined) payload['enable_tce'] = options.stretch;
    let reply: unknown;
    try {
      reply = await this.wire.post(`/sessions/${this.sessionUid}/contexts/main/commands/trim_clip`, payload);
    } catch (err) {
      // Older builds carry `trim_clip` on the session instead of on the edit context (fact 77).
      if ((err as { code?: string }).code !== 'uasrv.invalid_object') throw err;
      reply = await this.sessionPost('trim_clip', { clip_uid: this.id, context_type: 'main', start: startTick, stop: stopTick, ...(options.split !== undefined ? { split: options.split } : {}) });
    }
    // A split leaves this clip on one side of the cut, so only a plain trim has bounds to wait for (fact 71).
    if (options.split !== true) {
      await settle(() => this.start.value === startTick && this.stop.value === stopTick, 'trim clip', { ...this.settleOptions(), refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }) });
    }
    return reply;
  }

  /**
   * Move the clip so it starts at `toTick`, keeping its length, on its own playlist. One undo
   * step. Resolves to this clip, or with `copy` to the new copy once it is listed. LUNA's
   * `move_clips` moves a range (fact 117): this is the clip's whole span, so a clip lying
   * wholly on top of this one moves with it. To move what shows of a clip that others overlap,
   * the way dragging it in LUNA does, move its pieces from {@link Playlist.compiledClips} with
   * {@link CompiledClip.move}. The user's selection is put back afterwards.
   *
   * @example
   * await clip.move(clip.start.value! + Luna.WHOLE_NOTE);
   * const copy = await clip.move(clip.stop.value!, { copy: true });
   */
  async move(toTick: number, options: { copy?: boolean } = {}): Promise<Clip> {
    const [start, stop] = this.bounds('move');
    requireTick(toTick, 'toTick');
    if (toTick < 0) throw new UAError('out_of_range', 'move(): toTick must not be negative', { path: this.path });
    const before = new Set(this.siblingList().items.map((c) => c.id));
    await this.keepingSelection(() =>
      this.contextPost('move_clips', { context_type: 'main', playlist_uid: [this.playlistUid], start, stop, location: toTick, ...(options.copy ? { copy: true } : {}) }),
    );
    if (!options.copy) {
      await settle(() => this.start.value === toTick, 'move clip', this.settleOptions());
      return this;
    }
    const length = stop - start;
    const found = () => this.siblingList().items.find((c) => !before.has(c.id) && c.start.value === toTick && c.stop.value === toTick + length);
    await settle(() => found() !== undefined, 'copy clip', this.settleOptions());
    return found()!;
  }

  /**
   * Copy the clip to start where it ends. One undo step; resolves to the copy.
   *
   * @example
   * const again = await clip.duplicate();
   */
  async duplicate(): Promise<Clip> {
    const [, stop] = this.bounds('duplicate');
    return this.move(stop, { copy: true });
  }

  /**
   * Cut the clip at one or more ticks inside it (LUNA's `separate_clips`). One undo step.
   * Resolves to the pieces in time order; this clip keeps the first. A fade-out moves to the
   * last piece, and a crossfade at a cut is not kept (fact 117).
   *
   * @example
   * const [left, right] = await clip.split(clip.start.value! + Luna.WHOLE_NOTE);
   */
  async split(at: number | readonly number[]): Promise<Clip[]> {
    const [start, stop] = this.bounds('split');
    const ticks = [...new Set((typeof at === 'number' ? [at] : at).map((t) => requireTick(t, 'at')))].sort((a, b) => a - b);
    if (!ticks.length || ticks.some((t) => t <= start || t >= stop)) throw new UAError('out_of_range', 'split(): every tick must lie inside the clip', { path: this.path });
    await this.contextPost('separate_clips', { location: ticks, playlist_uid: [this.playlistUid] });
    const pieces = () => ticks.map((t, i) => this.siblingList().items.find((c) => c.start.value === t && c.stop.value === (ticks[i + 1] ?? stop)));
    await settle(() => this.stop.value === ticks[0] && pieces().every((p) => p !== undefined), 'split clip', this.settleOptions());
    return [this, ...(pieces() as Clip[])];
  }

  /**
   * Mute or unmute the clip. One undo step. (LUNA's `mute_clips` toggles a range instead.)
   *
   * @example
   * await clip.setMuted(true);
   */
  setMuted(muted: boolean): Promise<void> {
    return this.property<boolean>('mute').set(muted);
  }

  /**
   * Slide the audio inside the clip without moving the clip: positive `byNs` moves the audio
   * later, so an earlier part of the source plays at the clip start. LUNA's own content nudge,
   * so warps move with it; one undo step. The step is one sample at the engine rate. Only a
   * clip on its track's active playlist can be slipped. A slip that would run past either end
   * of the source does nothing in LUNA (fact 117); one past the start is refused here with
   * `out_of_range`, one past the end rejects with `no_effect`.
   *
   * @example
   * await clip.slip(-10_000_000);   // 10 ms earlier
   */
  async slip(byNs: number): Promise<void> {
    const [start, stop] = this.bounds('slip');
    if (!Number.isFinite(byNs)) throw new UAError('out_of_range', 'slip(): byNs must be a finite number', { path: this.path });
    const track = this.client.store.cell<string>(this.playlistPath, 'track_uid').value;
    if (!track || this.client.store.cell<string>(`/sessions/${this.sessionUid}/tracks/${track}`, 'playlist_uid').value !== this.playlistUid) {
      throw new UAError('unavailable', "slip(): LUNA slips only clips on their track's active playlist", { path: this.path });
    }
    const info = (await this.sessionPost('get_clip_info', { clip_uid: this.id })) as { sample_rate?: number } | null;
    const rate = info?.sample_rate ?? 48000;
    const samples = Math.round((Math.abs(byNs) * rate) / 1e9);
    if (samples === 0) return;
    const from = this.sourceStart.value ?? 0;
    if (byNs > 0 && from - (samples * 1e9) / rate < 0) {
      throw new UAError('out_of_range', `slip(): the source has only ${(from / 1e6).toFixed(1)} ms of audio before the clip start`, { path: this.path });
    }
    const operation = byNs > 0 ? 'content_right' : 'content_left';
    await this.keepingSelection(async () => {
      await this.context.select({ focus: 'timeline', startTick: start, stopTick: stop, trackUids: [track] });
      await this.contextPost('nudge', { nudge_settings: JSON.stringify({ mode: 'samples', samples, operation }) });
    });
    // Moving the audio later plays earlier source at the clip start.
    const expected = from - Math.sign(byNs) * (samples * 1e9) / rate;
    await settle(() => Math.abs((this.sourceStart.value ?? from) - expected) < 1e9 / rate + 1, 'slip clip', this.refreshingOptions());
  }

  /**
   * Fade the clip in over its first `lengthTicks`, or change the length of its fade-in. One
   * undo step, or two when `shape` changes an existing fade's shape. Without `shape` a new
   * fade is `log`, LUNA's default. Audio clips only: a MIDI or video clip rejects with
   * `unavailable`.
   *
   * @example
   * await clip.setFadeIn(Luna.QUARTER_NOTE, { shape: 'equal_power' });
   */
  async setFadeIn(lengthTicks: number, options: { shape?: FadeShape } = {}): Promise<void> {
    const [start] = this.bounds('setFadeIn');
    const length = this.fadeLength(lengthTicks, 'setFadeIn');
    return this.setFade({ fade_type: 'fade_in', start, stop_offset: length }, options.shape, 'setFadeIn');
  }

  /**
   * Fade the clip out over its last `lengthTicks`, or change the length of its fade-out.
   *
   * @example
   * await clip.setFadeOut(Luna.HALF_NOTE);
   */
  async setFadeOut(lengthTicks: number, options: { shape?: FadeShape } = {}): Promise<void> {
    const [, stop] = this.bounds('setFadeOut');
    const length = this.fadeLength(lengthTicks, 'setFadeOut');
    return this.setFade({ fade_type: 'fade_out', stop, start_offset: -length }, options.shape, 'setFadeOut');
  }

  /**
   * Crossfade from this clip into `next`, which must start where this one stops on the same
   * playlist. For clips that overlap, such as one on top over the middle of another, crossfade
   * the segments either side of the edit with {@link CompiledClip.crossfade}. `align` puts the fade across the edit (`center`, the default), before it or
   * after it. Calling again changes the length. Each clip's source must reach past the edit by
   * the part of the fade on the other side; LUNA does not check (fact 117).
   *
   * @example
   * await left.crossfade(right, Luna.EIGHTH_NOTE);
   */
  async crossfade(next: Clip, lengthTicks: number, options: { align?: CrossfadeAlign; shape?: FadeShape } = {}): Promise<void> {
    const [, stop] = this.bounds('crossfade');
    if (next.playlistUid !== this.playlistUid) throw new UAError('out_of_range', 'crossfade(): both clips must be on the same playlist', { path: this.path });
    if (next.start.value !== stop) throw new UAError('out_of_range', 'crossfade(): the next clip must start where this one stops', { path: this.path });
    next.requireAudio('crossfade');
    const length = requireTick(lengthTicks, 'lengthTicks');
    if (length <= 0) throw new UAError('out_of_range', 'crossfade(): lengthTicks must be positive', { path: this.path });
    const align = options.align ?? 'center';
    const [startOffset, stopOffset] = align === 'before' ? [-length, 0] : align === 'after' ? [0, length] : [-Math.floor(length / 2), length - Math.floor(length / 2)];
    return this.setFade({ fade_type: 'cross_fade', contributor_clip_uid: next.id, start_offset: startOffset, stop_offset: stopOffset, trim_to_edge: false }, options.shape, 'crossfade');
  }

  /**
   * Remove the clip's plain fade-in. Resolves at once when there is none.
   *
   * @example
   * await clip.removeFadeIn();
   */
  async removeFadeIn(): Promise<void> {
    const [start] = this.bounds('removeFadeIn');
    const row = (await this.fadeRows()).find((f) => f.type === 'fade_in' && !f.contributor);
    if (row) await this.deleteFadeRange(start + row.startOffset, start + row.stopOffset, [{ clip: this, uid: row.uid }]);
  }

  /**
   * Remove the clip's plain fade-out. Resolves at once when there is none.
   *
   * @example
   * await clip.removeFadeOut();
   */
  async removeFadeOut(): Promise<void> {
    const [, stop] = this.bounds('removeFadeOut');
    const row = (await this.fadeRows()).find((f) => f.type === 'fade_out' && !f.contributor);
    if (row) await this.deleteFadeRange(stop + row.startOffset, stop + row.stopOffset, [{ clip: this, uid: row.uid }]);
  }

  /**
   * Remove the crossfade from this clip into `next`, both halves. Resolves at once when there
   * is none.
   *
   * @example
   * await left.removeCrossfade(right);
   */
  async removeCrossfade(next: Clip): Promise<void> {
    const [, stop] = this.bounds('removeCrossfade');
    const row = (await this.fadeRows()).find((f) => f.type === 'fade_out' && f.contributor === next.id);
    const other = (await next.fadeRows()).find((f) => f.type === 'fade_in' && f.contributor === this.id);
    if (!row && !other) return;
    // `delete_fades` looks only at clips whose segment overlaps the range, so reach one tick
    // past the edit on each side, or a crossfade wholly before or after it keeps one half (fact 117).
    const offsets = [row, other].filter((f): f is FadeRow => f !== undefined);
    const from = Math.min(stop - 1, ...offsets.map((f) => stop + f.startOffset));
    const to = Math.max(stop + 1, ...offsets.map((f) => stop + f.stopOffset));
    await this.deleteFadeRange(from, to, [...(row ? [{ clip: this as Clip, uid: row.uid }] : []), ...(other ? [{ clip: next, uid: other.uid }] : [])]);
  }

  /** Add raw MIDI events to this (MIDI) clip in one undo step. */
  addMidi(events: MidiEvent[]): Promise<unknown> {
    // Ticks given here are clip-relative; the table stores them in its own frame, offset by
    // the clip's MIDI origin (fact 41). That offset is 0 for a clip recorded or drawn in
    // place, and the clip's start tick for one made from an imported MIDI file.
    const origin = this.midiSourceStart.value ?? 0;
    return this.sessionPost('add_midi', {
      midi: events.map((e) => {
        const ev: Record<string, unknown> = { clip_uid: this.id, tick: e.tick + origin, byte_0: e.status, byte_1: e.data1 };
        if (e.data2 !== undefined) ev['byte_2'] = e.data2;
        return ev;
      }),
    });
  }

  /** Add a note: note-on at `tick`, note-off at `tick + lengthTicks`. */
  addNote(note: number, tick: number, lengthTicks: number, velocity = 100, channel = 0): Promise<unknown> {
    return this.addNotes([{ pitch: note, tick, lengthTicks, velocity, channel }]);
  }

  /**
   * Add several notes to this (MIDI) clip in one `add_midi` post, so they land as one undo
   * step. Each note is a note-on at `tick` and a note-off at `tick + lengthTicks`.
   *
   * @example
   * // A C major triad on beat 1, then its arpeggio.
   * await clip.addNotes([
   *   ...[60, 64, 67].map((pitch) => ({ pitch, tick: 0, lengthTicks: Luna.QUARTER_NOTE })),
   *   ...[60, 64, 67].map((pitch, i) => ({ pitch, tick: (i + 1) * Luna.QUARTER_NOTE, lengthTicks: Luna.QUARTER_NOTE, velocity: 80 })),
   * ]);
   */
  addNotes(notes: readonly ClipNote[]): Promise<unknown> {
    if (!notes.length) return Promise.reject(new UAError('out_of_range', 'addNotes(): give at least one note', { path: this.path }));
    let events: MidiEvent[];
    try {
      events = notes.flatMap((n) => {
        const pitch = midiByte(n.pitch, 'pitch');
        const tick = requireTick(n.tick, 'tick');
        const length = requireTick(n.lengthTicks, 'lengthTicks');
        if (length <= 0) throw new UAError('out_of_range', 'addNotes(): lengthTicks must be positive', { path: this.path });
        const velocity = midiByte(n.velocity ?? 100, 'velocity', 1);
        const ch = n.channel ?? 0;
        if (!Number.isInteger(ch) || ch < 0 || ch > 15) throw new UAError('out_of_range', 'addNotes(): channel must be an integer 0-15', { path: this.path });
        return [
          { tick, status: 0x90 | ch, data1: pitch, data2: velocity },
          { tick: tick + length, status: 0x80 | ch, data1: pitch, data2: 0 },
        ];
      });
    } catch (err) {
      return Promise.reject(err);
    }
    return this.addMidi(events);
  }

  bringToFront(): Promise<unknown> {
    return this.sessionPost('bring_to_front', { uid: this.id });
  }

  sendToBack(): Promise<unknown> {
    return this.sessionPost('send_to_back', { uid: this.id });
  }

  private get playlistPath(): string {
    return this.path.slice(0, this.path.indexOf('/clips/'));
  }

  private get context(): Context {
    this.contextView ??= new Context(this.client, `/sessions/${this.sessionUid}/contexts/main`, this.sessionUid);
    return this.contextView;
  }

  private contextPost(command: string, payload: Record<string, unknown>): Promise<unknown> {
    if (this.disposed) return Promise.reject(new Disposed('Clip', this.path));
    return this.wire.post(`/sessions/${this.sessionUid}/contexts/main/commands/${command}`, { session_uid: this.sessionUid, ...payload });
  }

  /** Commands that select what they act on move the user's selection; put it back after. */
  private async keepingSelection<T>(fn: () => Promise<T>): Promise<T> {
    const context = this.context;
    await context.refreshSelection().catch(() => {});
    const saved = context.snapshot();
    try {
      return await fn();
    } finally {
      await context.restore(saved).catch(() => {});
    }
  }

  private bounds(what: string): [number, number] {
    this.assertLive();
    const start = this.start.value;
    const stop = this.stop.value;
    if (start === undefined || stop === undefined) throw new UAError('unavailable', `${what}(): the clip's bounds are not loaded yet`, { path: this.path });
    return [start, stop];
  }

  private siblingList(): Collection<Clip> {
    if (!this.siblings) throw new UAError('unavailable', 'this clip was not reached through a playlist', { path: this.path });
    return this.siblings();
  }

  /** Settle options that re-read this clip itself, for edits that change only its properties. */
  private refreshingOptions() {
    return { ...this.settleOptions(), refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }) };
  }

  private fadeLength(lengthTicks: number, what: string): number {
    const length = requireTick(lengthTicks, 'lengthTicks');
    const clipLength = this.length ?? 0;
    if (length <= 0 || length > clipLength) throw new UAError('out_of_range', `${what}(): lengthTicks must be positive and at most the clip's length`, { path: this.path });
    return length;
  }

  /**
   * One `set_fade` (fact 117). LUNA applies `fade_shape` only to a fade it creates, so a shape
   * asked of a fade that already existed goes through `change_fade_curvature` as well.
   */
  private async setFade(fade: Record<string, unknown>, shape: FadeShape | undefined, what: string): Promise<void> {
    requireFadeShape(shape, `${what}()`);
    this.requireAudio(what);
    const reply = (await this.contextPost('set_fade', {
      ...(shape ? { fade_shape: shape } : {}),
      clips: [{ playlist_uid: this.playlistUid, clip_uid: this.id, fade_reference_edge: 'none', ...fade }],
    })) as { edit_results?: { changed?: { fades?: { fade_uid?: string }[] } } } | null;
    const changed = (reply?.edit_results?.changed?.fades ?? []).map((f) => f.fade_uid).filter((u): u is string => typeof u === 'string');
    if (shape && changed.length) await this.contextPost('change_fade_curvature', { fades: changed, fade_shape: shape });
  }

  /**
   * LUNA fades audio clips only, and answers a fade on any other with success and no change
   * (fact 117), so refuse it here. A clip whose type has not loaded is let through.
   *
   * @internal
   */
  requireAudio(what: string): void {
    const type = this.clipType.value;
    if (type !== undefined && type !== 'audio') throw new UAError('unavailable', `${what}(): LUNA fades audio clips only; this one is ${type}`, { path: this.path });
  }

  /** The clip's stored fade rows, read fresh. */
  /** @internal */
  async fadeRows(): Promise<FadeRow[]> {
    const folder = `${this.path}/fades`;
    await this.client.store.load(folder, { levels: 2, commands: false, flatvalue: true });
    return (this.client.store.children(folder).value ?? []).map((uid) => {
      const cell = <T>(name: string) => this.client.store.cell<T>(`${folder}/${uid}`, name).value;
      return {
        uid,
        type: String(cell<string>('fade_type') ?? ''),
        contributor: cell<string | null>('contributor_clip_uid') ?? undefined,
        startOffset: Number(cell<number>('start_offset') ?? 0),
        stopOffset: Number(cell<number>('stop_offset') ?? 0),
      };
    });
  }

  /** `delete_fades` takes every fade lying wholly inside a range; aim it at one fade's range. */
  private async deleteFadeRange(start: number, stop: number, rows: readonly { clip: Clip; uid: string }[]): Promise<void> {
    await this.contextPost('delete_fades', { playlist_uid: [this.playlistUid], start, stop });
    const gone = () => rows.every(({ clip, uid }) => !(this.client.store.children(`${clip.path}/fades`).value ?? []).includes(uid));
    await settle(gone, 'remove fade', {
      ...this.settleOptions(),
      refresh: async () => {
        for (const { clip } of rows) await this.client.store.load(`${clip.path}/fades`, { levels: 2, commands: false, flatvalue: true });
      },
    });
  }

  protected override release(): void {
    this.midiClip?.dispose();
    this.midiClip = undefined;
    this.controlsFolder?.dispose();
    this.warpList?.dispose();
  }
}
