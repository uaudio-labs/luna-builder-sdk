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
 * await clip.delete();
 */
import type { Client } from '../client/client';
import { derived, type Prop, type WritableProp } from '../store/prop';
import { MidiClip } from './midi';
import { Disposed, UAError } from '../wire/errors';
import { Node } from './node';
import { midiByte, requireTick, settle } from './settle';

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
    /** @internal Whether a `session.transaction()` batch is open; the note verbs refuse inside one. */
    private readonly batching?: () => boolean,
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
      batching: this.batching,
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

  protected override release(): void {
    this.midiClip?.dispose();
    this.midiClip = undefined;
  }
}
