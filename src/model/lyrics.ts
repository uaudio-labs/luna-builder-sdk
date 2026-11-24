/**
 * A session's lyrics: `/sessions/<uid>/lyrics/<rowid>`, one node per line (fact 152). Two
 * kinds share the list. A line typed on LUNA's lyric ruler has no source and its `location`
 * is a tick. A line transcribed from a recording names the audio source it came from
 * (`sourceUid`) and its `location` is nanoseconds from that source's start, so it is placed on
 * the timeline through the clips that play that source. Units pass through unchanged.
 *
 * @example
 * await session.lyrics.load();
 * for (const line of session.lyrics.sorted) {
 *   line.transcribed ? place(line.sourceUid.value, line.location.value) : at(line.location.value);
 * }
 * session.lyrics.onChange(redraw);
 *
 * // Editing (fact 153): each call resolves once LUNA shows the change.
 * const line = await session.lyrics.add(Luna.WHOLE_NOTE * 4, 'Here comes the sun');
 * await line.setText('Here comes the sun, doo-doo-doo');
 * await line.delete();
 */
import type { Client } from '../client/client';
import { derived, type Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import { Collection } from './collection';
import { Node } from './node';
import { requireTick, settle } from './settle';
import { runExtraction, type ExtractionOptions, type JobRun } from './jobs';

/** One word of a lyric line. `offset` and `length` are in the line's units, from its start. */
export interface LyricWord {
  word: string;
  offset: number;
  length: number;
}

/** LUNA's nil uid, which a line typed on the ruler carries as its source. */
const NO_SOURCE = /^[0-]*$/;

/** `/sessions/<uid>/lyrics[/<rowid>]` → `<uid>`. */
const sessionUidOf = (path: string): string => path.split('/')[2] ?? '';

function requireText(text: unknown, what: string): string {
  // deviced skips an empty text on an existing row (`Edit_SetLyric`), so it could never settle.
  if (typeof text !== 'string' || text === '') throw new UAError('out_of_range', `${what} must be a non-empty string`);
  return text;
}

/** Options for {@link Lyrics.add}. */
export interface AddLyricOptions {
  /** How long the line lasts, in the line's units. Default 0, as LUNA's ruler makes them. */
  length?: number;
  /**
   * Add the line to a recording's lyrics instead of the ruler: `location` and `length` are
   * then nanoseconds from that audio source's start (fact 152).
   */
  sourceUid?: string;
}

export class Lyric extends Node {
  readonly rowid: Prop<number>;
  /** Where the line starts: a tick for a ruler line, nanoseconds into its source for a transcribed one. */
  readonly location: Prop<number>;
  /** How long the line lasts, in the same units as {@link location}. */
  readonly length: Prop<number>;
  readonly text: Prop<string>;
  /** The audio source a transcribed line came from; LUNA's nil uid for a ruler line. */
  readonly sourceUid: Prop<string>;
  /** The line's words with their timing, when LUNA has it (a transcribed line). */
  readonly words: Prop<LyricWord[]>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.rowid = this.prop<number>('rowid');
    this.location = this.prop<number>('location');
    this.length = this.prop<number>('length');
    this.text = this.prop<string>('text');
    this.sourceUid = this.prop<string>('source_uid');
    // LUNA sends the words as a JSON string: {"words":[{"word","offset","length"}]}.
    const raw = this.prop<string>('words');
    this.words = derived([raw], () => parseWords(raw.value), { distinct: true });
  }

  /**
   * Whether the line was transcribed from a recording: it names a source, and its
   * {@link location} is nanoseconds into that source rather than a tick.
   *
   * @example
   * const lines = session.lyrics.sorted.filter((l) => !l.transcribed);   // the ruler's, in ticks
   */
  get transcribed(): boolean {
    return !NO_SOURCE.test(this.sourceUid.value ?? '');
  }

  private get row(): number {
    return this.rowid.value ?? Number(this.id);
  }

  private get sessionUid(): string {
    return sessionUidOf(this.path);
  }

  private async edit(fields: Record<string, unknown>, done: () => boolean, what: string): Promise<void> {
    this.assertLive();
    // A transcribed line names its source, so deviced looks for a line to replace among that
    // source's lines and in its units, not among the ruler's (fact 153).
    const source = this.transcribed ? { source_uid: this.sourceUid.value } : {};
    await this.wire.post(`/sessions/${this.sessionUid}/set_lyric`, { session_uid: this.sessionUid, rowid: this.row, ...source, ...fields });
    await settle(done, what, { path: this.path, disposed: () => this.disposed, refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }), flush: () => this.client.store.scheduler.flush() });
  }

  /**
   * Change the line's text and resolve once LUNA shows it. One undo entry. The words and their
   * timings are left as they were. Rejects with `out_of_range` for an empty string (LUNA would
   * ignore it); to remove a line, {@link delete} it.
   *
   * @example await line.setText('Here comes the sun');
   */
  async setText(text: string): Promise<void> {
    const wanted = requireText(text, 'lyric text');
    if (this.text.value === wanted) return;
    await this.edit({ text: wanted }, () => this.text.value === wanted, 'set lyric text');
  }

  /**
   * Move the line to `location`, in its own units: a tick for a ruler line, nanoseconds into
   * its source for a transcribed one. Another line of the same kind already at `location` is
   * replaced, as in LUNA (fact 153). One undo entry.
   *
   * @example await line.moveTo(line.location.value! + Luna.WHOLE_NOTE);
   */
  async moveTo(location: number): Promise<void> {
    requireTick(location, 'lyric location');
    // deviced deletes whatever line sits at the target first, which here would be this one.
    if (this.location.value === location) return;
    await this.edit({ location }, () => this.location.value === location, 'move lyric');
  }

  /**
   * Delete this line and resolve once it has left {@link Lyrics}. One undo entry.
   *
   * @example await line.delete();
   */
  async delete(): Promise<void> {
    this.assertLive();
    await this.wire.post(`/sessions/${this.sessionUid}/delete_lyric`, { session_uid: this.sessionUid, rowid: this.row });
    const parent = this.path.slice(0, this.path.lastIndexOf('/'));
    await settle(() => !(this.client.store.children(parent).value ?? []).includes(this.id), 'delete lyric', {
      path: this.path,
      refresh: () => this.client.store.load(parent, { levels: 2, commands: false, flatvalue: true }),
      flush: () => this.client.store.scheduler.flush(),
    });
  }
}

/** Options for {@link Lyrics.transcribe}. */
export interface TranscribeOptions extends ExtractionOptions {
  /** A name from {@link Lyrics.providers}; LUNA's default when left out. */
  provider?: string;
  /**
   * Also put the lines on the lyric ruler, in ticks, over the clip or selected range
   * (`add_to_session`, fact 204). Default false: only the transcribed lines, in nanoseconds
   * into the source.
   */
  addToRuler?: boolean;
}

/** The lyric transcription services LUNA offers (`/lyric_transcription`, fact 204). */
export interface LyricProviders {
  /** Whether any provider can run now. */
  available: boolean;
  /** Provider names to pass as `provider`. */
  providers: string[];
  /** The one LUNA uses when none is named. */
  defaultProvider: string;
}

export class Lyrics extends Collection<Lyric> {
  /** @internal */
  constructor(client: Client, sessionPath: string) {
    super(client, `${sessionPath}/lyrics`, (p) => new Lyric(client, p), { levels: 2, commands: false, flatvalue: true });
    this.sessionUid = sessionPath.slice(sessionPath.lastIndexOf('/') + 1);
  }

  private readonly sessionUid: string;

  /**
   * Transcribe the lyrics of a clip, or of the edit context's selection, as LUNA's Transcribe
   * Lyrics does: `extract_lyrics`, which runs as a `lyric_transcription` job (facts 200, 204).
   * The transcribed lines arrive in this list, each naming its source and placed in
   * nanoseconds into it (fact 152); with `addToRuler` LUNA also writes ruler lines in ticks.
   * The returned {@link JobRun} reports progress and resolves when the job completes, with
   * `empty: true` when there was nothing to transcribe.
   *
   * @example
   * const run = session.lyrics.transcribe({ clip, provider: (await session.lyrics.providers()).defaultProvider });
   * await run;
   * session.lyrics.sorted.filter((l) => l.sourceUid.value === clip.sourceUid.value).map((l) => l.text.value);
   */
  transcribe(options: TranscribeOptions = {}): JobRun {
    const extra: Record<string, unknown> = {};
    if (options.provider !== undefined) extra['provider'] = options.provider;
    if (options.addToRuler !== undefined) extra['add_to_session'] = options.addToRuler;
    return runExtraction(this.client, this.sessionUid, 'extract_lyrics', 'lyric_transcription', options, extra);
  }

  /**
   * Read which transcription providers LUNA has. LUNA computes these when asked and pushes
   * no change (fact 204), so this is a read, not a prop.
   *
   * @example
   * const { available, providers, defaultProvider } = await session.lyrics.providers();
   */
  async providers(): Promise<LyricProviders> {
    const reply = (await this.client.raw.get('/lyric_transcription', { children: false, commands: false, flatvalue: true })) as Record<string, unknown> | undefined;
    const props = (reply && typeof reply['properties'] === 'object' && reply['properties'] !== null ? reply['properties'] : reply ?? {}) as Record<string, unknown>;
    const unwrap = (v: unknown): unknown => (v && typeof v === 'object' && !Array.isArray(v) && 'value' in v ? (v as { value: unknown }).value : v);
    const list = unwrap(props['providers']);
    const def = unwrap(props['default_provider']);
    return {
      available: unwrap(props['available']) === true,
      providers: Array.isArray(list) ? list.map(String) : [],
      defaultProvider: typeof def === 'string' ? def : '',
    };
  }

  /**
   * The lines by {@link Lyric.location}. Ruler and transcribed lines are in different units,
   * so sort within one kind.
   *
   * @example
   * session.lyrics.sorted.filter((l) => l.sourceUid.value === source.id).map((l) => l.text.value);
   */
  get sorted(): Lyric[] {
    return [...this.items].sort((a, b) => (a.location.value ?? 0) - (b.location.value ?? 0));
  }

  /**
   * Add a line at `location` and resolve to it once it is listed. A ruler line by default,
   * at a tick; with `sourceUid`, a line of that recording's lyrics, at nanoseconds into it.
   * A line of the same kind already at `location` is replaced, as in LUNA (fact 153). One
   * undo entry.
   *
   * @example
   * const line = await session.lyrics.add(Luna.WHOLE_NOTE * 8, 'Second verse');
   */
  async add(location: number, text: string, options: AddLyricOptions = {}): Promise<Lyric> {
    requireTick(location, 'lyric location');
    requireText(text, 'lyric text');
    if (options.length !== undefined) requireTick(options.length, 'lyric length');
    await this.load();
    const sessionUid = sessionUidOf(this.path);
    // deviced deletes the line already at `location` and adds one; SQLite may give the new row
    // the deleted one's rowid, so a line is recognised by what it holds, not by a new id.
    const key = (l: Lyric): string => `${l.location.value}|${l.text.value}|${l.transcribed ? l.sourceUid.value : ''}`;
    const wanted = `${location}|${text}|${options.sourceUid ?? ''}`;
    const before = new Map(this.items.map((l) => [l.id, key(l)]));
    const payload: Record<string, unknown> = { session_uid: sessionUid, location, text };
    if (options.length !== undefined) payload['length'] = options.length;
    if (options.sourceUid !== undefined) payload['source_uid'] = options.sourceUid;
    await this.client.raw.post(`/sessions/${sessionUid}/set_lyric`, payload);
    const already = [...before.values()].includes(wanted);
    const isIt = (l: Lyric): boolean => key(l) === wanted && (already || before.get(l.id) !== wanted);
    await settle(() => this.items.some(isIt), 'add lyric', {
      path: this.path,
      refresh: () => this.reload(),
      flush: () => this.client.store.scheduler.flush(),
    });
    return this.items.find(isIt)!;
  }
}

function parseWords(json: string | undefined): LyricWord[] {
  if (!json) return [];
  try {
    const words = (JSON.parse(json) as { words?: unknown }).words;
    if (!Array.isArray(words)) return [];
    return words.flatMap((w) => {
      const { word, offset, length } = (w ?? {}) as Record<string, unknown>;
      return typeof word === 'string' ? [{ word, offset: Number(offset) || 0, length: Number(length) || 0 }] : [];
    });
  } catch {
    return [];
  }
}
