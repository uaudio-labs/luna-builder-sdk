/**
 * Playback state of a session. These are properties of the session node itself
 * (`/sessions/<uid>/playing` etc.); play and stop are property writes.
 *
 * @example
 * const t = session.transport;
 * t.location.onChange(() => counter.textContent = Luna.formatBarBeat(t.location.value?.bar_beat));
 * await t.play();
 * await t.seek({ bar: 5 });
 * await t.setPlayStart({ bar: 9 });   // like seek, but the loop range stays
 * await t.returnToZero();
 * await t.setLoop(0, Luna.WHOLE_NOTE * 4);
 */
import type { Client } from '../client/client';
import { UAError } from '../wire/errors';
import { derived, type Prop, type WritableProp } from '../store/prop';
import type { Musical } from './musical';
import { Node } from './node';
import { requireTick, settle } from './settle';
import type { Location } from './ticks';

export interface TransportLocation extends Location {
  /**
   * The playhead as LUNA's own MIN:SEC counter shows it: whole `minutes`, and `seconds`
   * within the minute (fact 96). Present on the engine's `location` pushes. `seconds`
   * can be fractional, so floor it for display (`Luna.formatMinSec` does). For wall-clock
   * seconds derived from the tick, use {@link Transport.seconds}.
   */
  min_sec?: { minutes: number; seconds: number };
  tempo?: number;
  time_signature?: { numerator: number; denominator: number };
  playing?: boolean;
}

export type RecPlayMode = string;

/** Where to seek: a tick, or a bar|beat|tick position (`beat` defaults to 1, `tick` to 0). */
export type SeekTarget = number | { bar: number; beat?: number; tick?: number };

export interface SeekOptions {
  /**
   * When playing, when the playhead jumps: `'now'` (default), at the `'next_bar'`, or at the
   * `'loop_end'`. A play start moved during playback does nothing until then (fact 90).
   */
  sync?: 'now' | 'next_bar' | 'loop_end';
}

export class Transport extends Node {
  readonly playing: WritableProp<boolean>;
  readonly recordEnabled: WritableProp<boolean>;
  readonly looping: WritableProp<boolean>;
  /** Where playback starts (ticks); also the resting playhead when stopped. */
  readonly playStart: WritableProp<number>;
  readonly loopStart: WritableProp<number>;
  readonly loopStop: WritableProp<number>;
  /** Where {@link returnToZero} goes (ticks). LUNA reads it as 0 until it is set (fact 89). */
  readonly arrangementStart: WritableProp<number>;
  /** Live playhead, pushed many times per second while playing. */
  readonly location: Prop<TransportLocation>;
  /**
   * Tempo in effect at the playhead (BPM), carved out of the `location` pushes (fact 95: a
   * tempo edit shows here at once). Notifies only when the number moves, so a BPM display is
   * not re-rendered on every playhead push. It follows the playhead only: to recompute
   * anything planned from the tempo map (clip lengths, seconds) when the tempo is edited, use
   * `session.musical.timeline.onChange` and `session.musical.tempoAt(tick)`.
   *
   * @example
   * t.tempo.onChange(() => bpm.textContent = `${t.tempo.value ?? '--'} BPM`);
   */
  readonly tempo: Prop<number>;
  /**
   * Time signature in effect at the playhead, carved out of the `location` pushes. Notifies
   * only when it changes. Format with `Luna.formatTimeSignature`.
   *
   * @example
   * t.timeSignature.onChange(() => meter.textContent = Luna.formatTimeSignature(t.timeSignature.value));
   */
  readonly timeSignature: Prop<{ numerator: number; denominator: number }>;
  readonly countingIn: Prop<boolean>;
  readonly punchedIn: Prop<boolean>;
  readonly maxTick: Prop<number>;
  /**
   * Playback speed as a percentage of the tempo map (100 is as written), applied only while
   * {@link enableTempoPercent} is on. Not undoable. LUNA publishes both only when its
   * tempo-percent feature is enabled; elsewhere they stay `undefined` (fact 155).
   *
   * @example
   * await t.tempoPercent.set(80);
   * await t.enableTempoPercent.set(true);   // practice at 80%
   */
  readonly tempoPercent: WritableProp<number>;
  /** Whether {@link tempoPercent} applies (fact 155). @example await t.enableTempoPercent.set(false); */
  readonly enableTempoPercent: WritableProp<boolean>;
  readonly recPlayMode: Prop<RecPlayMode>;
  readonly countInEnabled: WritableProp<boolean>;
  readonly preRollEnabled: WritableProp<boolean>;
  readonly postRollEnabled: WritableProp<boolean>;
  /**
   * How long the pre-roll is, as LUNA stores it: a `"bars,beats,ticks"` duration string
   * (`"1,0,0"` is one bar, `"0,2,0"` two beats; ticks are engine ticks). Read and write it with
   * `Luna.parseRollDuration` and `Luna.formatRollDuration`. Used while
   * {@link preRollEnabled} is on (fact 156).
   *
   * @example await t.preRoll.set(Luna.formatRollDuration({ bars: 2 }));
   */
  readonly preRoll: WritableProp<string>;
  /** How long the post-roll is, in the same form as {@link preRoll} (fact 156). @example await t.postRoll.set('1,0,0'); */
  readonly postRoll: WritableProp<string>;
  /** Whether the click sounds during playback (fact 155). @example await t.clickDuringPlay.set(false); */
  readonly clickDuringPlay: WritableProp<boolean>;
  /** Whether the click sounds while recording (fact 155). @example await t.clickDuringRecord.set(true); */
  readonly clickDuringRecord: WritableProp<boolean>;
  /** Whether the click sounds during the count-in (fact 155). @example await t.clickDuringCountIn.set(true); */
  readonly clickDuringCountIn: WritableProp<boolean>;
  /**
   * Whether MIDI recorded over an existing MIDI clip merges into it (on) or makes a new take
   * (off) (fact 155).
   *
   * @example await t.mergeMidi.set(true);
   */
  readonly mergeMidi: WritableProp<boolean>;

  /** @internal */
  constructor(
    client: Client,
    sessionPath: string,
    private readonly musical?: () => Musical,
  ) {
    super(client, sessionPath);
    this.playing = this.writableProp<boolean>('playing');
    this.recordEnabled = this.writableProp<boolean>('record_enabled');
    this.looping = this.writableProp<boolean>('looping');
    this.playStart = this.writableProp<number>('play_start');
    this.loopStart = this.writableProp<number>('loop_start');
    this.loopStop = this.writableProp<number>('loop_stop');
    this.arrangementStart = this.writableProp<number>('arrangement_start');
    this.location = this.prop<TransportLocation>('location');
    this.tempo = derived([this.location], () => this.location.value?.tempo, { distinct: true });
    this.timeSignature = derived([this.location], () => this.location.value?.time_signature, { distinct: true });
    this.countingIn = this.prop<boolean>('counting_in');
    this.punchedIn = this.prop<boolean>('punched_in');
    this.maxTick = this.prop<number>('max_tick');
    this.tempoPercent = this.writableProp<number>('tempo_percent');
    this.enableTempoPercent = this.writableProp<boolean>('enable_tempo_percent');
    this.recPlayMode = this.prop<RecPlayMode>('rec_play_mode');
    this.countInEnabled = this.writableProp<boolean>('count_in_enabled');
    this.preRollEnabled = this.writableProp<boolean>('pre_roll_enabled');
    this.postRollEnabled = this.writableProp<boolean>('post_roll_enabled');
    this.preRoll = this.writableProp<string>('pre_roll');
    this.postRoll = this.writableProp<string>('post_roll');
    this.clickDuringPlay = this.writableProp<boolean>('click_during_play');
    this.clickDuringRecord = this.writableProp<boolean>('click_during_record');
    this.clickDuringCountIn = this.writableProp<boolean>('click_during_count_in');
    this.mergeMidi = this.writableProp<boolean>('merge_midi');
  }

  /** Current playhead in ticks: the live location while playing, else the play start. */
  get tick(): number {
    return this.location.value?.tick ?? this.playStart.value ?? 0;
  }

  /**
   * Current playhead in wall-clock seconds: {@link tick} converted through the session's
   * tempo map (`session.musical.timeline.seconds`), so tempo changes are honoured. Like
   * {@link tick}, it is the live location while playing and the play start when stopped.
   *
   * The tempo map loads with the session (`session.ready()`, which `luna.session()` awaits),
   * so it is safe to read on any session obtained normally. Read before that, it throws
   * `unavailable` rather than converting at a guessed tempo.
   *
   * @example
   * el.textContent = Luna.formatMinSec(t.seconds, { fraction: 1 });
   */
  get seconds(): number {
    if (!this.musical) throw new UAError('unavailable', 'transport.seconds: this transport has no timeline', { path: this.path });
    const musical = this.musical();
    if (!musical.timeline.tempoLoaded) {
      throw new UAError('unavailable', 'transport.seconds: the tempo map is not loaded; await session.ready() (or session.musical.ready()) first', { path: this.path });
    }
    return musical.timeline.seconds(this.tick);
  }

  play(): Promise<void> {
    return this.playing.set(true);
  }

  stop(): Promise<void> {
    return this.playing.set(false);
  }

  toggle(): Promise<void> {
    return this.playing.set(!(this.playing.value ?? false));
  }

  /** Arm and start recording. */
  async record(): Promise<void> {
    await this.recordEnabled.set(true);
    if (!this.playing.value) await this.play();
  }

  /**
   * LUNA's record toggle (fact 80): flip the session's `record_enabled`, and start playback
   * when that turned record on while stopped. Turning record off leaves playback running.
   */
  async toggleRecord(): Promise<void> {
    const on = !(this.recordEnabled.value ?? false);
    await this.recordEnabled.set(on);
    if (on && !this.playing.value) await this.play();
  }

  /**
   * Move the playhead the way LUNA's own locate does (fact 89): the play start and both loop
   * points go to the target, so a drawn loop range is replaced by an empty one. Resolves once
   * LUNA shows the move; while playing, the playhead jumps as `options.sync` says.
   *
   * Tick 0 is not necessarily bar 1: a session with bars before bar 1 starts its timeline
   * earlier (fact 91). Seek to `{ bar: 1 }` for the downbeat of bar 1.
   *
   * @example
   * await t.seek({ bar: 1 });                    // the downbeat of bar 1, wherever it is
   * await t.seek({ bar: 9, beat: 3 });
   * await t.seek(Luna.WHOLE_NOTE * 4);           // a raw tick
   * await t.seek({ bar: 17 }, { sync: 'next_bar' });
   */
  async seek(to: SeekTarget, options: SeekOptions = {}): Promise<void> {
    const tick = requireTick(await this.resolve(to), 'seek target');
    await Promise.all([this.playStart.set(tick), this.loopStart.set(tick), this.loopStop.set(tick)]);
    await this.confirmPlayStart(tick, 'seek', options);
  }

  /**
   * Move the play start alone, leaving the loop range where it is: {@link seek} without
   * collapsing the loop marks. Resolves once LUNA shows the move (fact 90): stopped, the
   * playhead rests there; while playing, the playhead jumps as `options.sync` says.
   * Writing `playStart.set(tick)` instead only records the start, and while playing the
   * playhead carries on until a `sync`.
   *
   * @example
   * await t.setLoop(Luna.WHOLE_NOTE * 4, Luna.WHOLE_NOTE * 8);
   * await t.setPlayStart({ bar: 3 });               // start before the loop; the loop stays
   * await t.setPlayStart({ bar: 5 }, { sync: 'next_bar' });
   */
  async setPlayStart(to: SeekTarget, options: SeekOptions = {}): Promise<void> {
    const tick = requireTick(await this.resolve(to), 'play start');
    await this.playStart.set(tick);
    await this.confirmPlayStart(tick, 'setPlayStart', options);
  }

  private async confirmPlayStart(tick: number, what: string, options: SeekOptions): Promise<void> {
    if (this.playing.value === true) {
      const at = options.sync ?? 'now';
      await this.sync(at);
      // The playhead moves on, so the play start read back is the proof.
      await this.reread(['play_start', 'loop_start', 'loop_stop', 'playing']);
      if (this.playStart.value !== tick) throw new UAError('no_effect', `${what}: play start reads ${String(this.playStart.value)}, not ${tick}`, { path: this.path });
      return;
    }
    // Stopped, the location follows the play start (fact 90); the writer sees that push.
    await settle(() => this.location.value?.tick === tick, what, {
      path: this.path,
      refresh: () => this.reread(['play_start', 'location', 'playing']),
      flush: () => this.client.store.scheduler.flush(),
    });
  }

  /**
   * LUNA's Return To Zero (fact 89): {@link seek} to the arrangement start. That is tick 0
   * until the session sets one, and tick 0 need not be bar 1 (fact 91); for bar 1 use
   * `seek({ bar: 1 })`. Unlike LUNA's button it leaves the edit selection alone.
   *
   * @example
   * await session.transport.returnToZero();
   */
  async returnToZero(options: SeekOptions = {}): Promise<void> {
    await this.reread(['arrangement_start', 'playing']);
    await this.seek(this.arrangementStart.value ?? 0, options);
  }

  private async resolve(to: SeekTarget): Promise<number> {
    if (typeof to === 'number') return to;
    if (!this.musical) throw new UAError('unavailable', 'seek: this transport has no timeline for bar positions', { path: this.path });
    const musical = this.musical();
    await musical.ready();
    return musical.timeline.tickAt(to);
  }

  private reread(propfilter: string[]): Promise<unknown> {
    return this.client.store.load(this.path, { children: false, commands: false, propfilter });
  }

  async setLoop(startTick: number, stopTick: number): Promise<void> {
    await Promise.all([this.loopStart.set(startTick), this.loopStop.set(stopTick)]);
  }

  /** Restart playback, optionally quantised to the next bar or loop end. */
  sync(at: 'now' | 'next_bar' | 'loop_end' = 'now'): Promise<void> {
    return this.post('sync_playback', { session_uid: this.id, next_bar: at === 'next_bar', loop_end: at === 'loop_end' }).then(() => undefined);
  }
}
