/**
 * An edit context: `/sessions/<uid>/contexts/<id>`. `main` is the arrangement window; `editor`
 * and `alt_<n>` exist for other windows. Selection and zoom are plain property writes; a fixed
 * set of edit operations lives under `commands/`.
 *
 * Many session commands default their range and tracks to this context's selection when the
 * fields are omitted, so setting the selection first is the usual pattern.
 *
 * @example
 * const ctx = session.context;               // 'main'
 * await ctx.select({ startTick: 0, stopTick: Luna.WHOLE_NOTE * 4, trackUids: [track.id] });
 * await ctx.run('duplicate');
 * await ctx.nudge(Luna.SIXTEENTH_NOTE);
 */
import type { Client } from '../client/client';
import { derived, type Prop, type WritableProp } from '../store/prop';
import { UAError } from '../wire/errors';
import { Node } from './node';

export type ContextType = 'main' | 'editor' | `alt_${number}` | string;

/** One playlist's selected notes as LUNA stores them: `[pitch, start, stop, rowid]` in absolute ticks. */
export interface SelectedNotes {
  readonly playlist_uid: string;
  readonly notes: ReadonlyArray<readonly [number, number, number, number]>;
}

/** The six selection properties as LUNA holds them, for {@link Context.restore}. */
export interface SelectionSnapshot {
  readonly focus: unknown;
  readonly selection_start: unknown;
  readonly selection_stop: unknown;
  readonly selection_notes: unknown;
  readonly selection_playlists: unknown;
  readonly selection_tracks: unknown;
}

const SELECTION_PROPS = ['focus', 'selection_start', 'selection_stop', 'selection_notes', 'selection_playlists', 'selection_tracks'] as const;

/** Decode LUNA's `selection_notes` (an array, or `null`, or garbage) into frozen rows. */
export function selectedNotes(value: unknown): readonly SelectedNotes[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  const out: SelectedNotes[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as { playlist_uid?: unknown; notes?: unknown };
    if (typeof e.playlist_uid !== 'string' || !Array.isArray(e.notes)) continue;
    const notes = e.notes
      .filter((n): n is [number, number, number, number] => Array.isArray(n) && n.length === 4 && n.every((v) => typeof v === 'number'))
      .map((n) => Object.freeze([n[0], n[1], n[2], n[3]] as const));
    out.push(Object.freeze({ playlist_uid: e.playlist_uid, notes: Object.freeze(notes) }));
  }
  return Object.freeze(out);
}

export class Context extends Node {
  readonly contextType: Prop<ContextType>;
  /** Selection range in ticks; `null` when nothing is selected. */
  readonly selectionStart: WritableProp<number | null>;
  readonly selectionStop: WritableProp<number | null>;
  readonly selectionTracks: WritableProp<string[] | null>;
  readonly selectionPlaylists: WritableProp<string[] | null>;
  /**
   * Selected notes per playlist, in absolute ticks. The selection-based MIDI verbs
   * (`mute_notes`, `clear`, `change_velocity`) act on this, not on a clip (fact 74).
   */
  readonly selectionNotes: WritableProp<SelectedNotes[] | null>;
  /** The focused track, distinct from the selected set. */
  readonly lastSelectedTrack: WritableProp<string | null>;
  readonly collapsedFolders: WritableProp<string[] | null>;
  readonly pinnedTracks: Prop<string[] | null>;
  readonly hiddenTracks: Prop<string[] | null>;
  /** Zoom. */
  readonly pixelsPerTick: WritableProp<number>;
  readonly gridEnable: WritableProp<boolean>;
  /** Grid size such as `1_4`, `1_8`, `bar`. */
  readonly grid: WritableProp<string>;
  readonly linkEditAndPlay: WritableProp<boolean>;
  readonly focus: Prop<string>;
  /** The window's saved settings, a JSON string LUNA writes on a delayed save. */
  readonly settings: Prop<string>;
  /**
   * LUNA's waveform zoom for this window: the amplitude multiplier its timeline draws audio
   * with, 1 by default, doubled or halved by Zoom In/Out Waveform and bounded 1/8..256. Pass
   * it with the clip gain to {@link waveformColumns} to draw at LUNA's height. It is read from
   * {@link settings}, which LUNA saves some time after a change rather than at once (fact 94).
   *
   * @example
   * const gain = session.context.waveformZoom.value * 10 ** ((clip.gain.value ?? 0) / 20);
   */
  readonly waveformZoom: Prop<number>;

  /** @internal */
  constructor(
    client: Client,
    path: string,
    readonly sessionUid: string,
  ) {
    super(client, path);
    this.contextType = this.prop<ContextType>('context_type');
    this.selectionStart = this.writableProp<number | null>('selection_start');
    this.selectionStop = this.writableProp<number | null>('selection_stop');
    this.selectionTracks = this.writableProp<string[] | null>('selection_tracks');
    this.selectionPlaylists = this.writableProp<string[] | null>('selection_playlists');
    this.selectionNotes = this.writableProp<SelectedNotes[] | null>('selection_notes');
    this.lastSelectedTrack = this.writableProp<string | null>('last_selected_track');
    this.collapsedFolders = this.writableProp<string[] | null>('collapsed_folders');
    this.pinnedTracks = this.prop<string[] | null>('pinned_tracks');
    this.hiddenTracks = this.prop<string[] | null>('hidden_tracks');
    this.pixelsPerTick = this.writableProp<number>('pixels_per_tick');
    this.gridEnable = this.writableProp<boolean>('grid_enable');
    this.grid = this.writableProp<string>('grid');
    this.linkEditAndPlay = this.writableProp<boolean>('link_edit_and_play');
    this.focus = this.prop<string>('focus');
    this.settings = this.prop<string>('settings');
    const settings = this.settings;
    this.waveformZoom = derived([settings], () => waveformZoomFrom(settings.value));
  }

  /**
   * Set range, tracks, playlists and/or focus in one go; omitted parts are left alone. `focus`
   * is what LUNA's selection commands act on: `timeline` for clips (fact 117).
   *
   * @example
   * await ctx.select({ startTick: 0, stopTick: Luna.WHOLE_NOTE, playlistUids: [lane.id], focus: 'timeline' });
   */
  async select(options: { startTick?: number; stopTick?: number; trackUids?: string[]; playlistUids?: string[]; focus?: string }): Promise<void> {
    const writes: Promise<void>[] = [];
    if (options.focus !== undefined) writes.push(this.client.store.set(this.path, 'focus', options.focus));
    if (options.startTick !== undefined) writes.push(this.selectionStart.set(options.startTick));
    if (options.stopTick !== undefined) writes.push(this.selectionStop.set(options.stopTick));
    if (options.trackUids !== undefined) writes.push(this.selectionTracks.set(options.trackUids));
    if (options.playlistUids !== undefined) writes.push(this.client.store.set(this.path, 'selection_playlists', options.playlistUids));
    await Promise.all(writes);
    // One read behind the writes before resolving: on 3.0 a command posted straight after a
    // selection write (a bounce) still sees the previous selection, and a read-back is enough
    // to order them (fact 87). The reply is not applied, so it cannot undo the optimistic write.
    if (writes.length) await this.wire.get(this.path, { children: false, commands: false, flatvalue: true, propfilter: ['focus', 'selection_start', 'selection_stop', 'selection_tracks', 'selection_playlists'] });
  }

  /** The selected notes, decoded. Empty when nothing is selected. */
  get notes(): readonly SelectedNotes[] {
    return selectedNotes(this.selectionNotes.value);
  }

  /**
   * The six selection properties as LUNA holds them now. A wrapper that has to move the
   * user's selection to do its work takes one of these first and {@link restore}s it after,
   * so the page never disturbs what the user had selected.
   *
   * @example
   * const saved = ctx.snapshot();
   * try { await ctx.selectNotes(playlistUid, rows); await ctx.run('mute_notes'); }
   * finally { await ctx.restore(saved); }
   */
  snapshot(): SelectionSnapshot {
    const read = (p: string): unknown => this.client.store.cell<unknown>(this.path, p).value;
    return Object.freeze({
      focus: read('focus'),
      selection_start: read('selection_start'),
      selection_stop: read('selection_stop'),
      selection_notes: read('selection_notes'),
      selection_playlists: read('selection_playlists'),
      selection_tracks: read('selection_tracks'),
    });
  }

  /** Write a snapshot back. No undo entry; LUNA echoes each property. */
  async restore(snapshot: SelectionSnapshot): Promise<void> {
    const record = snapshot as unknown as Record<string, unknown>;
    if (!SELECTION_PROPS.some((p) => record[p] !== undefined)) {
      throw new UAError('out_of_range', `restore(): expected a snapshot() value (keys ${SELECTION_PROPS.join(', ')})`, { path: this.path });
    }
    for (const p of SELECTION_PROPS) {
      const value = record[p];
      if (value === undefined) continue;
      await this.client.store.set(this.path, p, value);
    }
  }

  /**
   * Select exactly these notes on one playlist, with the range and focus to match. Ticks are
   * absolute, as LUNA stores them: `[pitch, start, stop, rowid]`.
   */
  async selectNotes(playlistUid: string, notes: ReadonlyArray<readonly [number, number, number, number]>): Promise<void> {
    await this.client.store.set(this.path, 'focus', 'notes');
    await this.client.store.set(this.path, 'selection_playlists', [playlistUid]);
    if (notes.length) {
      await this.client.store.set(this.path, 'selection_start', Math.min(...notes.map((n) => n[1])));
      await this.client.store.set(this.path, 'selection_stop', Math.max(...notes.map((n) => n[2])));
    }
    await this.client.store.set(this.path, 'selection_notes', [{ playlist_uid: playlistUid, notes: notes.map((n) => [...n]) }]);
  }

  /** Re-read the six selection properties (they also arrive as events). */
  refreshSelection(): Promise<unknown> {
    return this.client.store.load(this.path, { children: false, commands: false, propfilter: [...SELECTION_PROPS] });
  }

  /** Run one of the context's edit commands (`copy`, `paste`, `duplicate`, `select_all`, ...). */
  run(command: string, payload: Record<string, unknown> = {}): Promise<unknown> {
    return this.wire.post(`${this.path}/commands/${command}`, { session_uid: this.sessionUid, ...payload });
  }

  /**
   * Widen the selected range to everything on the selected tracks' playlists (clips, notes,
   * automation), keeping the tracks (fact 150). No undo entry.
   *
   * @example
   * await session.selectTimeline({ tracks: [track] });
   * await session.context.selectAll();
   */
  selectAll(): Promise<unknown> {
    return this.run('select_all');
  }
  copy(): Promise<unknown> {
    return this.run('copy');
  }
  cut(): Promise<unknown> {
    return this.run('cut');
  }
  paste(): Promise<unknown> {
    return this.run('paste');
  }
  duplicate(): Promise<unknown> {
    return this.run('duplicate');
  }
  /** Delete the selected content. */
  clear(): Promise<unknown> {
    return this.run('clear');
  }
  /** Move the selection by `ticks` (negative moves earlier). */
  nudge(ticks: number): Promise<unknown> {
    return this.run('nudge', { ticks });
  }
  separateClips(): Promise<unknown> {
    return this.run('separate_clips');
  }
  consolidate(): Promise<unknown> {
    return this.run('consolidate');
  }
  muteClips(): Promise<unknown> {
    return this.run('mute_clips');
  }
}

/** `auido_waveform_zoom` (LUNA's spelling) from a context's settings JSON; 1 when absent or unreadable. */
function waveformZoomFrom(settings: string | undefined): number {
  if (typeof settings !== 'string' || !settings) return 1;
  try {
    const zoom = (JSON.parse(settings) as { auido_waveform_zoom?: unknown }).auido_waveform_zoom;
    return typeof zoom === 'number' && Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  } catch {
    return 1;
  }
}
