/**
 * Takes being recorded: what LUNA captures on each armed track while the transport is punched
 * in, before it becomes a clip (fact 149).
 *
 * A take is not on any playlist until recording stops; LUNA publishes it meanwhile under the
 * session's `record/clips/<track uid>/<take uid>`, with a `stop` tick that grows as it records
 * and, on an audio track, the file being written under `record/audio/<source uid>`, whose
 * waveform overview grows with it. A MIDI-capable track's take carries each message as it is
 * played. When recording stops the take goes and the finished clip appears on the track's
 * playlist (fact 75).
 *
 * @example
 * session.recordTakes.onChange(draw);
 * for (const take of session.recordTakes.items) {
 *   take.stop.onChange(draw);
 *   if (take.isMidi) take.notes.onChange(draw);
 * }
 */
import type { Client } from '../client/client';
import { derived, listOf, type List, type Prop } from '../store/prop';
import type { Unsubscribe } from '../wire/port';
import { AudioSource } from './audio-source';
import { Collection } from './collection';
import { decodeMidiData, pairNotes, type MidiRow, type Note } from './midi';
import { Node } from './node';
import type { ClipAudio } from './waveform';

/** One recorded MIDI message, as LUNA publishes it under a take: `<take>/midi/<rowid>`. */
class RecordMidiRow extends Node {
  /** Session tick (fact 149). */
  readonly tick: Prop<number>;
  /** The three MIDI bytes packed into one number (fact 39). */
  readonly midiData: Prop<number>;

  constructor(client: Client, path: string) {
    super(client, path);
    this.tick = this.prop<number>('tick');
    this.midiData = this.prop<number>('midi_data');
  }
}

/**
 * A take being recorded on one track. Read it from {@link Session.recordTakes}; it is disposed
 * when recording stops and LUNA turns it into a clip.
 *
 * Ticks are session ticks, like a clip's `start` and `stop`; `sourceStart` and `sourceStop` are
 * nanoseconds into the file being written. {@link events} and {@link notes} use ticks from the
 * take's start, as a clip's MIDI does, so a note at `startTick` sits at `take.start.value +
 * startTick`. A note still held has no `stopTick`: draw it to `take.stop.value`.
 *
 * @example
 * const take = session.recordTakes.forTrack(track)[0];
 * if (take?.audio) {
 *   const range = await waves.range(take.audio.source, take.audio.startNs, take.audio.stopNs, 'coarse');
 * }
 */
export class RecordTake extends Node {
  /** The track this take records onto. */
  readonly trackUid: Prop<string>;
  /** The input it records from. */
  readonly inputNodeUid: Prop<string>;
  /** Session tick where recording began. */
  readonly start: Prop<number>;
  /** Session tick reached so far; grows while recording. */
  readonly stop: Prop<number>;
  /** The audio file being written; `undefined` on a MIDI take. */
  readonly sourceUid: Prop<string>;
  /** Nanoseconds into the file where the take begins. */
  readonly sourceStart: Prop<number>;
  /** Nanoseconds into the file reached so far; grows while recording. */
  readonly sourceStop: Prop<number>;
  /** The messages recorded so far, in tick order, ticks from the take's start. */
  readonly events: List<MidiRow>;
  /** {@link events} paired into notes; a held note has no `stopTick` yet. */
  readonly notes: List<Note>;

  private readonly rows: Collection<RecordMidiRow>;
  private file: AudioSource | undefined;

  /** @internal */
  constructor(
    client: Client,
    path: string,
    private readonly sessionPath: string,
  ) {
    super(client, path);
    this.trackUid = this.prop<string>('track_uid');
    this.inputNodeUid = this.prop<string>('input_node_uid');
    this.start = this.prop<number>('start');
    this.stop = this.prop<number>('stop');
    this.sourceUid = this.prop<string>('source_uid');
    this.sourceStart = this.prop<number>('source_start');
    this.sourceStop = this.prop<number>('source_stop');
    this.rows = new Collection<RecordMidiRow>(client, `${path}/midi`, (p) => new RecordMidiRow(client, p), { levels: 2, commands: false, flatvalue: true });
    const events = derived<readonly MidiRow[]>([this.rows, this.start], () => {
      const origin = this.start.value ?? 0;
      const out: MidiRow[] = [];
      for (const row of this.rows.items) {
        const tick = row.tick.value;
        const packed = row.midiData.value;
        if (typeof tick !== 'number' || typeof packed !== 'number') continue;
        const rowid = Number(row.id);
        if (!Number.isFinite(rowid)) continue;
        const { status, data1, data2 } = decodeMidiData(packed);
        out.push(Object.freeze({ rowid, tick: tick - origin, status, channel: status & 0x0f, data1, data2, enabled: true }));
      }
      return out.sort((a, b) => a.tick - b.tick || a.rowid - b.rowid);
    });
    this.events = listOf(events, (e) => String(e.rowid));
    this.notes = listOf(
      derived<readonly Note[]>([events], () => pairNotes(this.events.items)),
      (n) => String(n.rowid),
    );
  }

  /**
   * True for a take on a MIDI-capable track (an instrument track): LUNA gives it a `midi`
   * folder, which its messages arrive in. Known once the take has loaded.
   */
  get isMidi(): boolean {
    return (this.childNames().value ?? []).includes('midi');
  }

  /**
   * The file being written and the part of it this take covers, for {@link Waveforms.range}
   * and {@link audioNsAtTick}; `undefined` on a MIDI take or before LUNA names the file. Its
   * overview grows as LUNA records: redraw when `stop` or `sourceStop` moves. The partial last
   * page is read again each time, so the waveform fills in.
   */
  get audio(): ClipAudio | undefined {
    const uid = this.sourceUid.value;
    const startNs = this.sourceStart.value;
    const stopNs = this.sourceStop.value;
    if (!uid || startNs === undefined || stopNs === undefined) return undefined;
    if (this.file?.id !== uid) this.file = new AudioSource(this.client, `${this.sessionPath}/record/audio/${uid}`);
    return Object.freeze({ source: this.file, startNs, stopNs, stretched: false });
  }

  /** @internal Read the take's properties and its MIDI so far; later messages follow pushes. */
  async ready(): Promise<void> {
    await Promise.all([this.load({ levels: 2, commands: false, flatvalue: true }), this.rows.load()]);
  }

  protected override release(): void {
    this.rows.dispose();
  }
}

/** `record/clips/<track uid>`: the takes recording on one track. */
class RecordTrack extends Node {
  readonly takes: Collection<RecordTake>;

  constructor(client: Client, path: string, sessionPath: string) {
    super(client, path);
    this.takes = new Collection<RecordTake>(client, path, (p) => new RecordTake(client, p, sessionPath), { levels: 2, commands: false, flatvalue: true });
  }

  protected override release(): void {
    this.takes.dispose();
  }
}

/**
 * The takes being recorded in a session, across every track: {@link Session.recordTakes}.
 * Empty while nothing records. `onChange` fires when a take starts or ends; follow a take's own
 * props (`stop`, `notes`) for its progress.
 *
 * @example
 * await session.ready();
 * session.recordTakes.onChange(() => {
 *   for (const take of session.recordTakes.items) console.log(take.trackUid.value, take.stop.value);
 * });
 */
export class RecordTakes implements List<RecordTake> {
  private readonly tracks: Collection<RecordTrack>;
  private readonly listeners = new Set<() => void>();
  private trackOffs = new Map<RecordTrack, Unsubscribe>();
  private tracksOff: Unsubscribe | undefined;
  private loaded = false;

  /** @internal */
  constructor(client: Client, sessionPath: string) {
    this.tracks = new Collection<RecordTrack>(client, `${sessionPath}/record/clips`, (p) => new RecordTrack(client, p, sessionPath), { levels: 3, commands: false, flatvalue: true });
  }

  /** Every take recording now, track by track. */
  get items(): readonly RecordTake[] {
    return this.tracks.items.flatMap((t) => t.takes.items);
  }

  get value(): readonly RecordTake[] {
    return this.items;
  }

  /** The take with this uid. */
  byId(id: string): RecordTake | undefined {
    return this.items.find((t) => t.id === id);
  }

  /**
   * The takes recording on one track (normally one), by the track or its uid.
   *
   * @example
   * const [take] = session.recordTakes.forTrack(track);
   */
  forTrack(track: { readonly id: string } | string): RecordTake[] {
    const uid = typeof track === 'string' ? track : track.id;
    return this.tracks.byId(uid)?.takes.items.slice() ?? [];
  }

  /** Called when a take starts or ends. */
  onChange(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    this.wire();
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Read the takes recording now. {@link Session.ready} does it; later takes follow pushes.
   *
   * @example
   * await session.recordTakes.load();
   */
  async load(): Promise<void> {
    this.loaded = true;
    await this.tracks.load();
    this.wire();
    await Promise.all(this.items.map((t) => t.ready()));
  }

  /** @internal */
  dispose(): void {
    this.tracksOff?.();
    this.tracksOff = undefined;
    for (const off of this.trackOffs.values()) off();
    this.trackOffs.clear();
    this.listeners.clear();
    this.tracks.dispose();
  }

  /** Follow the track folders and each folder's takes; load what is new. */
  private wire(): void {
    this.tracksOff ??= this.tracks.onChange(() => {
      this.wire();
      this.notify();
    });
    const live = new Set(this.tracks.items);
    for (const [track, off] of this.trackOffs) {
      if (!live.has(track)) {
        off();
        this.trackOffs.delete(track);
      }
    }
    for (const track of live) {
      if (this.trackOffs.has(track)) continue;
      const known = new Set<RecordTake>();
      const prime = (): void => {
        if (!this.loaded) return;
        for (const take of track.takes.items) {
          if (known.has(take)) continue;
          known.add(take);
          void take.ready().catch(() => {});
        }
      };
      if (this.loaded) void track.takes.load().then(prime, () => {});
      this.trackOffs.set(
        track,
        track.takes.onChange(() => {
          prime();
          this.notify();
        }),
      );
      prime();
    }
  }

  private notify(): void {
    for (const l of [...this.listeners]) {
      try {
        l();
      } catch (err) {
        console.error('[Luna] recordTakes listener threw', err);
      }
    }
  }
}
