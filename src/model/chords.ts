/**
 * LUNA's Chord ruler: `/sessions/<uid>/chords/<rowid>`. Each entry is a name (the chord
 * symbol, as typed) at a tick; the ruler holds at most one chord per tick and a chord lasts
 * until the next one (fact 100). Reached as `session.musical.chords`.
 *
 * @example
 * await session.musical.ready();
 * session.musical.chords.sorted.map((c) => [c.name.value, c.location.value]);
 * await session.musical.addChord(0, 'Cmaj7');
 * await chord.rename('C/E');
 * Luna.parseChord('Am7/G');   // { root: 'A', type: 'm7', bass: 'G' }
 */
import type { Client } from '../client/client';
import type { Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import { Collection } from './collection';
import { Node } from './node';
import { requireTick, settle } from './settle';

/** A chord name split the way LUNA spells chords: root, type suffix, slash bass. */
export interface ParsedChord {
  /** `C`, `F#`, `Bb`. */
  root: string;
  /** What follows the root, verbatim: `''` (major), `m`, `7`, `maj7`, `m7b5`, `sus4`. */
  type: string;
  /** The slash-chord bass, `E` for `C/E`, else `null`. */
  bass: string | null;
}

const CHORD_NAME = /^([A-Ga-g](?:#|b)?)([^/]*?)\s*(?:\/\s*([A-Ga-g](?:#|b)?))?$/;

/**
 * What may follow a lowercase root. The ruler takes free text, and words such as `bridge`,
 * `chorus` and `end` start with a note letter, so a lowercase root counts only before a
 * chord quality or extension.
 */
const QUALITY_START = /^(?:maj|min|m|dim|aug|sus|add|[0-9+\-o°ø^Δ(])/i;

/** A note name with its letter upper-cased: `bb` is B flat, `f#` is F sharp. */
const noteName = (name: string): string => name[0]!.toUpperCase() + name.slice(1);

/**
 * LUNA stores `♭` and `♯` as ASCII `b` and `#` (fact 100); the SDK compares names the same way.
 *
 * @example Luna.normalizeChordName('B♭m7');   // 'Bbm7'
 */
export function normalizeChordName(name: string): string {
  return name.replace(/♭/g, 'b').replace(/♯/g, '#');
}

/**
 * Split a chord name into root, type and bass. `undefined` when it does not start with a
 * note letter, since the ruler accepts any text (`N.C.`, `riff`). A lowercase root or bass
 * is read as the note (`am7` is A minor 7, `bb` is B flat) and returned upper-cased, but only
 * when what follows the root is empty or starts like a chord quality, so `bridge` and
 * `chorus` stay text. Spaces around the slash are ignored.
 *
 * @example
 * Luna.parseChord('C');       // { root: 'C', type: '', bass: null }
 * Luna.parseChord('F#m7b5');  // { root: 'F#', type: 'm7b5', bass: null }
 * Luna.parseChord('C/E');     // { root: 'C', type: '', bass: 'E' }
 * Luna.parseChord('am7 / g'); // { root: 'A', type: 'm7', bass: 'G' }
 */
export function parseChord(name: string): ParsedChord | undefined {
  const match = CHORD_NAME.exec(normalizeChordName(name.trim()));
  if (!match) return undefined;
  const lowercase = match[1]![0] !== match[1]![0]!.toUpperCase();
  if (lowercase && match[2] !== '' && !QUALITY_START.test(match[2]!)) return undefined;
  return { root: noteName(match[1]!), type: match[2]!, bass: match[3] === undefined ? null : noteName(match[3]) };
}

/** A chord to write with `musical.setChords`. */
export interface ChordSpec {
  tick: number;
  name: string;
}

function requireName(name: unknown, what: string): string {
  if (typeof name !== 'string' || name.trim() === '') throw new UAError('out_of_range', `${what} must be a non-empty chord name`);
  return name;
}

export class Chord extends Node {
  readonly rowid: Prop<number>;
  /** Position in ticks. */
  readonly location: Prop<number>;
  /** The chord symbol as LUNA shows it, e.g. `Am7`, `C/E`. */
  readonly name: Prop<string>;

  /** @internal */
  constructor(
    client: Client,
    path: string,
    private readonly sessionUid: string,
  ) {
    super(client, path);
    this.rowid = this.prop<number>('rowid');
    this.location = this.prop<number>('location');
    this.name = this.prop<string>('name');
  }

  private get row(): number {
    return this.rowid.value ?? Number(this.id);
  }

  /** {@link name} split into root, type and bass; `undefined` for text that is not a chord. */
  get parsed(): ParsedChord | undefined {
    return this.name.value === undefined ? undefined : parseChord(this.name.value);
  }

  private async edit(fields: Record<string, unknown>, done: () => boolean, what: string): Promise<void> {
    this.assertLive();
    await this.wire.post(`/sessions/${this.sessionUid}/set_chord`, { session_uid: this.sessionUid, rowid: this.row, ...fields });
    await settle(done, what, { path: this.path, disposed: () => this.disposed, refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }), flush: () => this.client.store.scheduler.flush() });
  }

  /** @example await chord.rename('C/E'); */
  rename(name: string): Promise<void> {
    const wanted = normalizeChordName(requireName(name, 'chord name'));
    return this.edit({ name }, () => this.name.value === wanted, 'rename chord');
  }

  /**
   * Move this chord to `tick`. A chord already at `tick` is replaced, as in LUNA (fact 100).
   *
   * @example await chord.moveTo(Luna.WHOLE_NOTE * 2);
   */
  async moveTo(tick: number): Promise<void> {
    requireTick(tick, 'chord tick');
    // deviced deletes whatever sits at the target tick first, which here is this chord (fact 100).
    if (this.location.value === tick) return;
    await this.edit({ location: tick }, () => this.location.value === tick, 'move chord');
  }

  /**
   * Delete this chord and resolve once it has left the ruler.
   *
   * @example await chord.delete();
   */
  async delete(): Promise<void> {
    this.assertLive();
    await this.wire.post(`/sessions/${this.sessionUid}/delete_chord`, { session_uid: this.sessionUid, rowid: this.row });
    const parent = this.path.slice(0, this.path.lastIndexOf('/'));
    await settle(() => !(this.client.store.children(parent).value ?? []).includes(this.id), 'delete chord', {
      path: this.path,
      refresh: () => this.client.store.load(parent, { levels: 2, commands: false, flatvalue: true }),
      flush: () => this.client.store.scheduler.flush(),
    });
  }
}

export class Chords extends Collection<Chord> {
  /** @internal */
  constructor(client: Client, sessionPath: string, sessionUid: string) {
    super(client, `${sessionPath}/chords`, (p) => new Chord(client, p, sessionUid), { levels: 2, commands: false, flatvalue: true });
  }

  /** Chords in timeline order. */
  get sorted(): Chord[] {
    return [...this.items].sort((a, b) => (a.location.value ?? 0) - (b.location.value ?? 0));
  }

  /** The chord sounding at `tick`: the last one at or before it. */
  at(tick: number): Chord | undefined {
    return this.sorted.filter((c) => (c.location.value ?? 0) <= tick).at(-1);
  }
}

/** @internal Validate a progression before anything reaches the wire. */
export function checkChordSpecs(chords: readonly ChordSpec[]): void {
  const ticks = new Set<number>();
  for (const c of chords) {
    requireTick(c.tick, 'chord tick');
    requireName(c.name, 'chord name');
    if (ticks.has(c.tick)) throw new UAError('out_of_range', `setChords(): two chords at tick ${c.tick}; the ruler holds one per tick`);
    ticks.add(c.tick);
  }
}
