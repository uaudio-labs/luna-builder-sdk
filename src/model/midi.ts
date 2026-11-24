/**
 * A MIDI clip's events and notes as live lists that follow edits made in LUNA.
 *
 * A MIDI clip keeps every message in one property, `<clip>/midi/table/row_data`, as a
 * column table (fact 39). A `get` answers the whole table; each later edit arrives as a
 * *delta* on the same property (fact 40), so this class seeds from one read and then
 * applies deltas in arrival order through `Store.onEvent`, the raw tap — a latest-value
 * cell would keep only the last of two deltas delivered in one frame.
 *
 * Adding events goes through {@link Clip.addNote}, {@link Clip.addNotes} and {@link Clip.addMidi}. Velocity, mute
 * and deletion go through LUNA's edit context, which acts on the *selection* rather than on
 * a clip (fact 74), so {@link MidiClip.setVelocities}, {@link MidiClip.setMuted} and
 * {@link MidiClip.deleteNotes} save the user's selection, write their own, post, and put the
 * user's back. Each is one undo entry. {@link MidiClip.moveEvents} moves rows other than notes
 * (SysEx, controllers) by row id, without touching the selection.
 *
 * All of them run inside `session.transaction()` too. In a batch, LUNA holds the table's
 * deltas until the commit (fact 74), so the verbs post without waiting and the lists catch up
 * once the transaction resolves; call {@link MidiClip.refresh} then if they look behind.
 *
 * @example
 * const midi = clip.midi;
 * await midi.ready();
 * midi.notes.onChange(() => draw(midi.notes.items));
 * // Scale every velocity by 120%, as one undo entry.
 * await midi.setVelocities(midi.notes.items.map((n) => ({ note: n, velocity: Math.min(127, Math.round(n.velocity * 1.2)) })));
 */
import type { Client } from '../client/client';
import { Cell, listOf, nextVersion, type List, type Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import type { Unsubscribe } from '../wire/port';
import { Context } from './context';
import { Node } from './node';
import { midiByte, settle } from './settle';
import type { TransactionMode } from './session';

/**
 * One row of a clip's MIDI table: a single MIDI message at a clip-relative tick.
 *
 * This is the shape read back from the engine. {@link MidiEvent} is the (smaller) shape
 * accepted when writing.
 */
export interface MidiRow {
  /** The engine's row id: this row's identity, stable across moves and trims. */
  readonly rowid: number;
  /** Ticks from the clip's start (fact 41), `TICKS_PER_BEAT` per quarter note. */
  readonly tick: number;
  /** Status byte with the channel in it: `0x90`-`0x9f` note on, `0xb0`-`0xbf` CC, and so on. */
  readonly status: number;
  /** 0-based channel, `status & 0x0f`. */
  readonly channel: number;
  readonly data1: number;
  readonly data2: number;
  /** `false` is LUNA's per-note mute on a note-on row. */
  readonly enabled: boolean;
  /**
   * A SysEx row's whole message, `0xf0` through `0xf7` (`status` is `0xf0`, `data1` and `data2`
   * are 0); `undefined` on every other row, and on LUNA builds without SysEx (fact 139).
   */
  readonly sysex?: readonly number[];
}

/**
 * A note-on row paired with the note-off that ends it.
 *
 * `startTick` and `stopTick` are clip-relative: they count from the clip's start, not from
 * the start of the session (fact 41). A note at the clip's downbeat has `startTick` 0
 * wherever the clip sits, and moving the clip does not change it. For a position on the
 * session timeline add the clip's start.
 *
 * @example
 * const sessionTick = (clip.start.value ?? 0) + note.startTick;
 */
export interface Note {
  /** The note-on row id: the note's identity, and its `List.byId` key. */
  readonly rowid: number;
  /** The note-off row id, `undefined` for an unterminated note-on. */
  readonly offRowid: number | undefined;
  /** MIDI note number, 0-127. */
  readonly pitch: number;
  readonly channel: number;
  /** Ticks from the clip's start, not the session's; add `clip.start.value` for a session tick. */
  readonly startTick: number;
  /** Ticks from the clip's start, like `startTick`; `undefined` when no note-off follows. */
  readonly stopTick: number | undefined;
  readonly velocity: number;
  readonly offVelocity: number | undefined;
  readonly muted: boolean;
}

/** The wire shape of `midi/table/row_data`: a whole table, or one delta against it (fact 40). */
export interface MidiRowData {
  /** `update` is a whole table; `added`, `changed` and `deleted` are deltas. */
  operation: 'update' | 'added' | 'changed' | 'deleted' | (string & {});
  row_ids: number[];
  enabled?: boolean[];
  midi_data?: number[];
  tick?: number[];
  /** A SysEx row's bytes, `null` on other rows; absent before LUNA stored SysEx (fact 139). */
  sysex?: (number[] | null)[];
}

/** Unpack the three MIDI bytes the engine packs into one number (fact 39). */
export function decodeMidiData(packed: number): { status: number; data1: number; data2: number } {
  return { status: (packed >>> 16) & 0xff, data1: (packed >>> 8) & 0x7f, data2: packed & 0x7f };
}

/** Pack three MIDI bytes the way the engine's table stores them (fact 39). */
export function encodeMidiData(status: number, data1: number, data2 = 0): number {
  return ((status & 0xff) << 16) | ((data1 & 0x7f) << 8) | (data2 & 0x7f);
}

function isRowData(v: unknown): v is MidiRowData {
  return typeof v === 'object' && v !== null && Array.isArray((v as MidiRowData).row_ids) && typeof (v as MidiRowData).operation === 'string';
}

/** Rows of a whole table or a delta, shifted into clip-relative ticks by `origin` (fact 41). */
function rowsOf(data: MidiRowData, origin: number): MidiRow[] {
  const out: MidiRow[] = [];
  data.row_ids.forEach((rowid, i) => {
    const packed = data.midi_data?.[i];
    const tick = data.tick?.[i];
    if (typeof rowid !== 'number' || typeof packed !== 'number' || typeof tick !== 'number') return; // an incomplete row is not a row
    const { status, data1, data2 } = decodeMidiData(packed);
    const sysex = data.sysex?.[i];
    const row = { rowid, tick: tick - origin, status, channel: status & 0x0f, data1, data2, enabled: data.enabled?.[i] !== false };
    out.push(Object.freeze(status === 0xf0 && Array.isArray(sysex) ? { ...row, sysex: Object.freeze([...sysex]) } : row));
  });
  return out;
}

const byTick = (a: MidiRow, b: MidiRow): number => a.tick - b.tick || a.rowid - b.rowid;
const isNoteOn = (e: MidiRow): boolean => (e.status & 0xf0) === 0x90 && e.data2 > 0;
const isNoteOff = (e: MidiRow): boolean => (e.status & 0xf0) === 0x80 || ((e.status & 0xf0) === 0x90 && e.data2 === 0);

/**
 * Pair note-on rows with the next note-off of the same channel and pitch, in tick order.
 * Pure, and exported because a page that draws its own lanes often wants it directly.
 *
 * @example
 * const notes = Luna.pairNotes(midi.events.items);
 */
export function pairNotes(rows: readonly MidiRow[]): Note[] {
  const open = new Map<string, MidiRow[]>();
  const notes: Note[] = [];
  for (const e of [...rows].sort(byTick)) {
    const key = `${e.channel}:${e.data1}`;
    if (isNoteOn(e)) {
      const list = open.get(key) ?? [];
      list.push(e);
      open.set(key, list);
    } else if (isNoteOff(e)) {
      const on = open.get(key)?.shift();
      if (!on) continue; // a note-off with no note-on before it is not a note
      notes.push(Object.freeze({ rowid: on.rowid, offRowid: e.rowid, pitch: on.data1, channel: on.channel, startTick: on.tick, stopTick: e.tick, velocity: on.data2, offVelocity: e.data2, muted: !on.enabled }));
    }
  }
  // Note-ons still open at the end: a note being held, or a stray.
  for (const list of open.values()) {
    for (const on of list) notes.push(Object.freeze({ rowid: on.rowid, offRowid: undefined, pitch: on.data1, channel: on.channel, startTick: on.tick, stopTick: undefined, velocity: on.data2, offVelocity: undefined, muted: !on.enabled }));
  }
  return notes.sort((a, b) => a.startTick - b.startTick || a.rowid - b.rowid);
}

/**
 * What a MIDI edit needs to reach LUNA's edit context: the session it lives in, the playlist
 * that holds the clip, and the clip's own start tick (the selection is in absolute ticks).
 */
export interface MidiHost {
  readonly sessionPath: string;
  readonly sessionUid: string;
  readonly playlistUid: string;
  readonly clipUid: string;
  /** The clip's timeline start, ticks, or `undefined` before it loads. */
  readonly startTick: () => number | undefined;
  /** The kind of `session.transaction()` open, if any. */
  readonly transactionMode?: (() => TransactionMode | undefined) | undefined;
}

/** Derive a host from `/sessions/<uid>/playlists/<pl>/clips/<clip>` when the Clip did not supply one. */
function hostFromPath(clipPath: string): MidiHost {
  const parts = clipPath.split('/'); // '', 'sessions', uid, 'playlists', pl, 'clips', clip
  const sessionUid = parts[2] ?? '';
  return {
    sessionPath: `/sessions/${sessionUid}`,
    sessionUid,
    playlistUid: parts[4] ?? '',
    clipUid: parts[6] ?? '',
    startTick: () => undefined,
  };
}

/**
 * The MIDI of one clip, reached as `clip.midi`. Both lists notify once per frame, like
 * every other {@link List}. An audio clip's table is empty.
 */
export class MidiClip extends Node {
  /** Every row, in tick order. `byId` takes a row id. */
  readonly events: List<MidiRow>;
  /** Paired notes, in start order. `byId` takes a note-on row id. */
  readonly notes: List<Note>;

  private readonly rows = new Map<number, MidiRow>();
  private readonly eventsCell: Cell<readonly MidiRow[]>;
  private readonly notesCell: Cell<readonly Note[]>;
  private readonly releases: Unsubscribe[] = [];
  /** Deltas applied since the last whole table, stamped so a re-read can discard older ones. */
  private deltas: Array<{ stamp: number; delta: MidiRowData }> = [];
  /**
   * The last whole table and the version it arrived at. Kept here rather than read back
   * from the cell, because the cell also receives the deltas (the store applies every push
   * to it), so its value is not necessarily a whole table.
   */
  private table: MidiRowData = { operation: 'update', row_ids: [] };
  private tableVersion = 0;
  private readyPromise: Promise<void> | undefined;

  /** The clip this table belongs to, and how to reach its session's edit context. */
  private readonly host: MidiHost;
  private contextView: Context | undefined;

  /** @internal Created by {@link Clip.midi}. */
  constructor(
    client: Client,
    clipPath: string,
    private readonly origin: Prop<number>,
    host?: MidiHost,
  ) {
    super(client, `${clipPath}/midi/table`);
    this.host = host ?? hostFromPath(clipPath);
    this.eventsCell = new Cell<readonly MidiRow[]>(client.store.scheduler, []);
    this.notesCell = new Cell<readonly Note[]>(client.store.scheduler, []);
    this.events = listOf(this.eventsCell, (row) => String(row.rowid));
    this.notes = listOf(this.notesCell, (note) => String(note.rowid));
  }

  /** The table tick that sits at the clip's start (fact 41). */
  private get shift(): number {
    return this.origin.value ?? 0;
  }

  /**
   * Read the table and start following edits. Idempotent, like `Node.load`.
   *
   * @example
   * await clip.midi.ready();
   */
  ready(): Promise<void> {
    this.readyPromise ??= this.seed();
    return this.readyPromise;
  }

  private async seed(): Promise<void> {
    const cell = this.client.store.cell<unknown>(this.path, 'row_data');
    // Tap raw events before the cell is written: two deltas in one frame must both apply.
    this.releases.push(this.client.store.onEvent((event) => this.onEvent(event.path, event.data, event.operation !== undefined)));
    await this.client.store.load(this.path, { children: false, flatvalue: true, commands: false, propfilter: 'row_data' });
    if (this.disposed) return;
    this.replace(isRowData(cell.value) ? cell.value : { operation: 'update', row_ids: [] }, cell.version);
    // A reconnect reloads the node, landing a whole table in the cell: take it and re-apply newer deltas.
    this.releases.push(
      cell.onChange(() => {
        if (isRowData(cell.value) && cell.value.operation === 'update') this.replace(cell.value, cell.version);
      }),
    );
    // Trimming an imported clip moves the origin, which shifts every row (fact 41). Re-seed
    // from the table we hold, then re-apply the deltas that came after it.
    this.releases.push(this.origin.onChange(() => this.replace(this.table, this.tableVersion)));
    this.client.store.scheduler.flush();
  }

  private onEvent(path: string, data: unknown, structural: boolean): void {
    if (this.disposed || structural) return;
    if (path !== `${this.path}/row_data` || !isRowData(data)) return;
    if (data.operation === 'update') return; // whole tables come through the cell
    this.deltas.push({ stamp: nextVersion(), delta: data });
    if (this.deltas.length > 256) this.deltas.splice(0, this.deltas.length - 256);
    this.apply(data);
    this.publish();
  }

  private replace(table: MidiRowData, version: number): void {
    this.table = table;
    this.tableVersion = version;
    this.rows.clear();
    for (const row of rowsOf(table, this.shift)) this.rows.set(row.rowid, row);
    // Keep only deltas that arrived after the read that produced this table.
    this.deltas = this.deltas.filter((d) => d.stamp > version);
    for (const { delta } of this.deltas) this.apply(delta);
    this.publish();
  }

  private apply(delta: MidiRowData): void {
    if (delta.operation === 'deleted') {
      for (const rowid of delta.row_ids) this.rows.delete(rowid);
      return;
    }
    for (const row of rowsOf(delta, this.shift)) this.rows.set(row.rowid, row); // added and changed are both upserts
  }

  private publish(): void {
    const events = Object.freeze([...this.rows.values()].sort(byTick));
    this.eventsCell.update(events);
    this.notesCell.update(Object.freeze(pairNotes(events)));
  }

  // ── editing ───────────────────────────────────────────────────────────────────────────
  // Each verb posts once and then waits for the rows to show the change: LUNA answers `null`
  // whether or not anything happened (fact 71), so the reply is not proof.

  /** The session's `main` edit context, for the selection the note verbs act through. */
  private get context(): Context {
    this.contextView ??= new Context(this.client, `${this.host.sessionPath}/contexts/main`, this.host.sessionUid);
    return this.contextView;
  }

  /**
   * Set several notes' velocities in one post: one "Change Velocities" undo entry for the
   * whole batch, where {@link setVelocity} in a loop would be one entry per note. `off`
   * targets each note's note-off row instead of its note-on.
   *
   * @example
   * // Scale every velocity in the clip by a percentage, as one undo entry.
   * await clip.midi.setVelocities(clip.midi.notes.items.map((n) => ({ note: n, velocity: Math.max(1, Math.min(127, Math.round(n.velocity * 1.25))) })));
   */
  async setVelocities(changes: ReadonlyArray<{ note: Note | number; velocity: number }>, options: { off?: boolean } = {}): Promise<void> {
    if (this.disposed) throw new UAError('disposed', 'setVelocities(): the clip is gone', { path: this.path });
    if (changes.length === 0) throw new UAError('out_of_range', 'setVelocities(): no changes given', { path: this.path });
    const rows: Array<{ rowid: number; velocity: number }> = [];
    const expected: Array<{ rowid: number; velocity: number }> = [];
    for (const change of changes) {
      const note = this.resolveOne(change.note);
      const rowid = options.off ? note.offRowid : note.rowid;
      if (rowid === undefined) throw new UAError('not_found', 'setVelocities(): a note has no note-off row', { path: this.path });
      const velocity = midiByte(change.velocity, 'velocity', 1);
      rows.push({ rowid, velocity });
      expected.push({ rowid: note.rowid, velocity });
    }
    await this.wire.post(`${this.host.sessionPath}/contexts/main/commands/change_velocity`, { session_uid: this.host.sessionUid, velocity_on: options.off !== true, notes: rows });
    await this.settleEdit(() => expected.every((e) => (options.off ? this.notes.byId(String(e.rowid))?.offVelocity : this.notes.byId(String(e.rowid))?.velocity) === e.velocity), 'change velocities');
  }

  /** Set one note's velocity. `off` targets the note-off row. One "Change Velocities" undo entry. */
  setVelocity(note: Note | number, velocity: number, options: { off?: boolean } = {}): Promise<void> {
    return this.setVelocities([{ note, velocity }], options);
  }

  /**
   * Mute or unmute notes. LUNA's `mute_notes` is a toggle over the selection (fact 74), so
   * this selects only the notes whose state must change, posts once, and restores the user's
   * selection. Nothing is posted — and no undo entry made — when nothing needs changing.
   * Which notes need changing is read from {@link notes}, which a batch transaction does not
   * update until its commit: mute a note once per batch.
   *
   * @example
   * // Mute everything quieter than 40, as one undo entry.
   * await clip.midi.setMuted(clip.midi.notes.items.filter((n) => n.velocity < 40), true);
   */
  async setMuted(notes: ReadonlyArray<Note | number>, muted: boolean): Promise<void> {
    const targets = this.resolve(notes).filter((n) => n.muted !== muted);
    if (!targets.length) return;
    await this.withSelection(targets, async () => {
      await this.wire.post(`${this.host.sessionPath}/contexts/main/commands/mute_notes`, { session_uid: this.host.sessionUid });
      await this.settleEdit(() => targets.every((t) => this.notes.byId(String(t.rowid))?.muted === muted), 'mute notes');
    });
  }

  /**
   * Delete notes: `clear` over a selection of exactly these notes, one undo entry, with the
   * user's selection restored afterwards. Inside a `session.transaction()` batch it joins the
   * batch's undo step, so deleting notes and writing their replacements with
   * {@link Clip.addNotes} undoes as one.
   *
   * @example
   * await clip.midi.deleteNotes([clip.midi.notes.items[0]!]);
   */
  async deleteNotes(notes: ReadonlyArray<Note | number>): Promise<void> {
    const targets = this.resolve(notes);
    if (!targets.length) return;
    await this.withSelection(targets, async () => {
      await this.wire.post(`${this.host.sessionPath}/contexts/main/commands/clear`, { session_uid: this.host.sessionUid });
      await this.settleEdit(() => targets.every((t) => this.notes.byId(String(t.rowid)) === undefined), 'delete notes');
    });
  }

  /**
   * Move MIDI rows other than notes — SysEx, CC, program change, pitch bend, aftertouch — by
   * `byTicks`, in one post and one "Move MIDI Events" undo entry (fact 141). Each row keeps its
   * id, bytes and `enabled`. This is how LUNA's own MIDI lane drags a SysEx.
   *
   * Refused before anything is sent: a note-on or note-off row (a note's two rows move
   * together; one alone would break the note), a row not in this clip, a `byTicks` that is not
   * an integer, or a move to before the clip's MIDI origin. A row moved past either end of the
   * clip stays in the table but does not play there; keep `row.tick + byTicks` within the clip
   * if it should. Nothing is posted for no rows or `byTicks` 0. LUNA builds without the command
   * answer with an error.
   *
   * @example
   * // Push every SysEx in the clip one beat later, as one undo entry.
   * await clip.midi.moveEvents(clip.midi.events.items.filter((r) => r.sysex), Luna.TICKS_PER_BEAT);
   */
  async moveEvents(rows: ReadonlyArray<MidiRow | number>, byTicks: number): Promise<void> {
    if (this.disposed) throw new UAError('disposed', 'moveEvents(): the clip is gone', { path: this.path });
    if (typeof byTicks !== 'number' || !Number.isInteger(byTicks)) throw new UAError('out_of_range', 'moveEvents(): byTicks must be an integer', { path: this.path });
    const targets: MidiRow[] = [];
    for (const row of rows) {
      const found = this.events.byId(String(typeof row === 'number' ? row : row.rowid));
      if (!found) throw new UAError('not_found', 'moveEvents(): no such row in this clip', { path: this.path });
      if ((found.status & 0xf0) === 0x80 || (found.status & 0xf0) === 0x90) {
        throw new UAError('out_of_range', 'moveEvents(): a note row; it moves only with its note-on or note-off', { path: this.path });
      }
      if (found.tick + this.shift + byTicks < 0) throw new UAError('out_of_range', "moveEvents(): a row would move before the clip's MIDI origin", { path: this.path });
      if (!targets.some((t) => t.rowid === found.rowid)) targets.push(found);
    }
    if (!targets.length || byTicks === 0) return;
    await this.wire.post(`${this.host.sessionPath}/contexts/main/commands/move_midi_events`, {
      session_uid: this.host.sessionUid,
      row_ids: targets.map((t) => t.rowid),
      offset: byTicks,
    });
    await this.settleEdit(() => targets.every((t) => this.events.byId(String(t.rowid))?.tick === t.tick + byTicks), 'move MIDI events');
  }

  private resolveOne(note: Note | number): Note {
    const found = this.notes.byId(String(typeof note === 'number' ? note : note.rowid));
    if (!found) throw new UAError('not_found', 'no such note in this clip', { path: this.path });
    return found;
  }

  private resolve(notes: ReadonlyArray<Note | number>): Note[] {
    if (this.disposed) throw new UAError('disposed', 'the clip is gone', { path: this.path });
    return notes.map((n) => this.resolveOne(n));
  }

  /** Save the user's selection, select `targets` (absolute ticks), run `fn`, restore. */
  private async withSelection(targets: readonly Note[], fn: () => Promise<void>): Promise<void> {
    const base = this.host.startTick();
    if (base === undefined) throw new UAError('unavailable', 'the clip has no start tick yet', { path: this.path });
    const context = this.context;
    await context.refreshSelection().catch(() => {});
    const saved = context.snapshot();
    await context.selectNotes(
      this.host.playlistUid,
      targets.map((t) => [t.pitch, base + t.startTick, base + (t.stopTick ?? t.startTick), t.rowid] as const),
    );
    try {
      await fn();
    } finally {
      await context.restore(saved).catch(() => {});
    }
  }

  /**
   * Wait for an edit to show in the lists. Inside a batch transaction LUNA holds the deltas,
   * and answers reads of the table from before the batch, until the commit (fact 74): there
   * is nothing to wait for yet.
   */
  private async settleEdit(done: () => boolean, what: string): Promise<void> {
    if (this.host.transactionMode?.() === 'batch') return;
    await settle(done, what, this.settleOptions());
  }

  private settleOptions(): { path: string; disposed: () => boolean; refresh: () => Promise<unknown>; flush: () => void } {
    return { path: this.path, disposed: () => this.disposed, refresh: () => this.refresh(), flush: () => this.client.store.scheduler.flush() };
  }

  /**
   * Re-read the whole table. LUNA holds deltas back inside a batch transaction, so call
   * this after one if the lists look behind; deltas that arrive later still apply.
   */
  async refresh(): Promise<void> {
    if (this.disposed) return;
    await this.client.store.load(this.path, { children: false, flatvalue: true, commands: false, propfilter: 'row_data' });
  }

  protected override release(): void {
    for (const release of this.releases) release();
    this.releases.length = 0;
    this.client.store.forget(this.path);
  }
}
