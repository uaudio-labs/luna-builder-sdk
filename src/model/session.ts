/**
 * An open session: `/sessions/<uid>`.
 *
 * @example
 * const session = await luna.session();          // focused session, loaded
 * session.name.value;
 * session.tracks.items.forEach((t) => console.log(t.name.value));
 * await session.transport.play();
 * await session.transaction('Mute all', async () => {
 *   for (const t of session.tracks.items) await t.mute.real.set(true);
 * });
 * await session.undo();
 */
import type { Client } from '../client/client';
import { derived, type Prop, type WritableProp } from '../store/prop';
import { UAError, Unsupported } from '../wire/errors';
import type { Unsubscribe } from '../wire/port';
import { AudioSource } from './audio-source';
import { Bus } from './bus';
import { Collection } from './collection';
import { Context } from './context';
import { Markers } from './markers';
import { Musical } from './musical';
import { Node } from './node';
import type { Clip } from './clip';
import { Playlist } from './playlist';
import { requireTick, settle } from './settle';
import { Render } from './system';
import { Track, type TrackType } from './track';
import { TICKS_PER_BEAT } from './ticks';
import { Transport } from './transport';

export type SoloMode = string;

const SYSTEM_TRACK_TYPES = new Set<string>(['click', 'count_in']);

/**
 * How far past the punch point {@link Session.record} widens `loop_stop` when it has to.
 * One bar of 4/4 at any tempo is plenty: the gate is on the punch point, not the take's end.
 */
export const RECORD_LOOP_MARGIN_TICKS = TICKS_PER_BEAT * 4;

/** Properties a clip needs before a take can be drawn. */
const CLIP_PROPS = ['uid', 'name', 'start', 'stop', 'source_start', 'source_stop', 'source_uid', 'clip_type', 'gain', 'bypass', 'render_source_uid', 'render_state', 'midi_source_start'];

export interface RecordOptions {
  /** The audio track to record onto, or its uid. */
  track: Track | string;
  /** A device input to route first, from {@link Client.audioInputs}. Left alone when omitted. */
  inputUid?: string;
  /** Where to punch in. The current play start when omitted. */
  startTick?: number;
  /** How long to hold after the punch. Give this, a `signal`, or both. */
  seconds?: number;
  /** Abort the pass early. */
  signal?: AbortSignal;
  /** Cap on a signal-only pass. Default 600. */
  maxSeconds?: number;
}

export interface UploadOptions {
  /** The file's bytes: a browser `File`/`Blob`, an `ArrayBuffer` or a `Uint8Array`. */
  bytes: Blob | ArrayBuffer | Uint8Array;
  /** File name to store it under. Taken from a `File` when omitted. */
  name?: string;
  /** Bytes per `transfer` post. Clamped to 1 KiB..4 MiB; default 256 KiB. */
  chunkBytes?: number;
  /** Called after each chunk with the bytes sent so far and the total. */
  onProgress?: (sent: number, total: number) => void;
  /** How long to wait for the workspace to list the finished source. Default 30 000 ms. */
  timeoutMs?: number;
}

export interface ImportPathOptions {
  /** Name to store the source under. Default: the file name from `path`. */
  name?: string;
  /** How long to wait for the workspace to list the new source. Default 30 000 ms. */
  timeoutMs?: number;
}

export interface BounceOptions {
  /** Channels to bounce, by uid. Tracks and buses both work. */
  channelUids: string[];
  name?: string;
  /** Render in real time instead of offline (offline reports no time remaining). */
  realTime?: boolean;
  recordPoint?: 'pre_effects' | 'post_effects' | 'post_pan';
  /**
   * One absolute output path per channel, in `channelUids` order. Given these, the render
   * writes files instead of adding sources to the session.
   */
  outputPaths?: string[];
  /** Absolute ticks to render; applied as the timeline selection and restored afterwards. */
  range?: { startTick: number; stopTick: number };
}

export interface ExportOptions {
  name?: string;
  realTime?: boolean;
  range?: { startTick: number; stopTick: number };
}

export interface NewTrackOptions {
  name?: string;
  trackType?: Extract<TrackType, 'audio' | 'instrument' | 'midi_matrix' | 'video'>;
  stemFormat?: 'mono' | 'stereo' | string;
  count?: number;
  makeNameUnique?: boolean;
  folderUid?: string;
}

export interface NewBusOptions {
  /** Default `'Bus'`. */
  name?: string;
  /** Default `'stereo'`. */
  stemFormat?: 'mono' | 'stereo' | string;
}

export interface TransactionOptions {
  /** Only the last command is recorded in the undo queue; notifications still fire per command. */
  continuous?: boolean;
}

export class Session extends Node {
  readonly uid: string;
  readonly name: WritableProp<string>;
  readonly loaded: Prop<boolean>;
  readonly readOnly: Prop<boolean>;
  readonly sessionPackageUid: Prop<string>;
  readonly sessionPackagePath: Prop<string>;
  readonly canUndo: Prop<boolean>;
  readonly canRedo: Prop<boolean>;
  readonly changeCount: Prop<number>;
  readonly soloMode: Prop<SoloMode>;
  readonly tempoEstablished: Prop<boolean>;
  readonly commandStatus: Prop<string | null>;
  readonly commandPercentComplete: Prop<number>;

  readonly transport: Transport;
  readonly tracks: Collection<Track>;
  readonly buses: Collection<Bus>;
  /** All playlists (take lanes) in the session; each names its track. */
  readonly playlists: Collection<Playlist>;
  /** Tempo map, time and key signatures, and tick/bar/seconds conversion. */
  readonly musical: Musical;
  readonly markers: Markers;
  /** Edit contexts (`main`, `editor`, `alt_<n>`). */
  readonly contexts: Collection<Context>;
  /** The `main` edit context: selection, zoom and the context edit commands. */
  readonly context: Context;
  /**
   * The track the user is working on: the main context's `lastSelectedTrack`, else the first
   * selected track, else the first visible track. `undefined` only when the session has no
   * visible track. Notifies when the answer moves to a different track, not on every
   * selection write. The last fallback follows tracks being added and removed, not a reorder.
   *
   * @example
   * const draw = () => (label.textContent = session.focusedTrack.value?.name.value ?? 'No track');
   * session.focusedTrack.onChange(draw);
   * draw();
   */
  readonly focusedTrack: Prop<Track>;
  private sourcesCollection: Collection<AudioSource> | undefined;
  private sourcesRelease: Unsubscribe | undefined;
  private batchDepth = 0;

  private watchRelease: Unsubscribe | undefined;
  private readyPromise: Promise<void> | undefined;

  /** @internal */
  constructor(client: Client, uid: string) {
    super(client, `/sessions/${uid}`);
    this.uid = uid;
    this.name = this.writableProp<string>('name');
    this.loaded = this.prop<boolean>('loaded');
    this.readOnly = this.prop<boolean>('read_only');
    this.sessionPackageUid = this.prop<string>('session_package_uid');
    this.sessionPackagePath = this.prop<string>('session_package_path');
    this.canUndo = this.prop<boolean>('can_undo');
    this.canRedo = this.prop<boolean>('can_redo');
    this.changeCount = this.prop<number>('change_count');
    this.soloMode = this.prop<SoloMode>('solo_mode');
    this.tempoEstablished = this.prop<boolean>('tempo_established');
    this.commandStatus = this.prop<string | null>('command_status');
    this.commandPercentComplete = this.prop<number>('command_percent_complete');
    this.transport = new Transport(client, this.path, () => this.musical);
    this.tracks = new Collection<Track>(client, `${this.path}/tracks`, (p) => new Track(client, p, uid), { levels: 2, commands: false, flatvalue: true });
    this.buses = new Collection<Bus>(client, `${this.path}/buses`, (p) => new Bus(client, p, uid), { levels: 2, commands: false, flatvalue: true });
    this.playlists = new Collection<Playlist>(client, `${this.path}/playlists`, (p) => new Playlist(client, p, uid, () => this.batching), { levels: 2, commands: false, flatvalue: true });
    this.musical = new Musical(client, this.path, uid, (name, fn) => this.transaction(name, fn));
    this.markers = new Markers(client, this.path, uid, () => this.musical.timeline);
    this.contexts = new Collection<Context>(client, `${this.path}/contexts`, (p) => new Context(client, p, uid), { levels: 2, commands: false, flatvalue: true });
    this.context = new Context(client, `${this.path}/contexts/main`, uid);
    const focusedId = derived([this.context.lastSelectedTrack, this.context.selectionTracks, this.tracks], () => this.focusedTrackId(), { distinct: true });
    this.focusedTrack = derived([focusedId], () => {
      const id = focusedId.value;
      return id === undefined ? undefined : this.tracks.byId(id);
    });
  }

  /** The uid behind {@link focusedTrack}; a uid that names no track (a bus, a deleted track) is skipped. */
  private focusedTrackId(): string | undefined {
    const isTrack = (id: unknown): id is string => typeof id === 'string' && this.tracks.byId(id) !== undefined;
    const last = this.context.lastSelectedTrack.value;
    if (isTrack(last)) return last;
    const selected = this.context.selectionTracks.value;
    const first = Array.isArray(selected) ? selected.find(isTrack) : undefined;
    return first ?? this.visibleTracks[0]?.id;
  }

  /**
   * Subscribe to the whole session and load its properties, tracks and buses.
   * Idempotent; resolves when the initial state is in the cells.
   */
  ready(): Promise<void> {
    if (!this.readyPromise) {
      const watch = this.client.store.watch(this.path, { recursive: true, load: { flatvalue: true, commands: false } });
      this.watchRelease = watch.release;
      this.readyPromise = watch.ready.then(() => Promise.all([this.tracks.load(), this.buses.load(), this.playlists.load(), this.musical.ready(), this.markers.load(), this.contexts.load()])).then(() => undefined);
    }
    return this.readyPromise;
  }

  /**
   * Source audio files of this session, under `/workspace/sessions/<package uid>/audio`.
   * `undefined` until the session's package uid is known (after `ready()`).
   */
  get sources(): Collection<AudioSource> | undefined {
    const pkg = this.sessionPackageUid.value;
    if (!pkg) return undefined;
    if (!this.sourcesCollection || !this.sourcesCollection.path.includes(pkg)) {
      this.sourcesCollection?.dispose();
      this.sourcesRelease?.();
      this.sourcesCollection = new Collection<AudioSource>(this.client, `/workspace/sessions/${pkg}/audio`, (p) => new AudioSource(this.client, p), { levels: 2, commands: false, flatvalue: true });
      // The workspace folder is outside the session subtree, so the session's own recursive
      // watch does not cover it and nothing would arrive (fact 34). Subscribe here, so an
      // import, a recorded take or a time-stretch render appears without a reload.
      this.sourcesRelease = this.sourcesCollection.watch().release;
    }
    return this.sourcesCollection;
  }

  /** The active playlist of a track, once playlists are loaded. */
  playlistFor(track: Track): Playlist | undefined {
    const uid = track.playlistUid.value;
    return uid ? this.playlists.byId(uid) : undefined;
  }

  /** The master bus, once buses are loaded. */
  get master(): Bus | undefined {
    return this.buses.items.find((b) => b.isMaster);
  }

  /** Tracks sorted by their `order` key. */
  get tracksInOrder(): Track[] {
    return [...this.tracks.items].sort((a, b) => (a.order.value ?? 0) - (b.order.value ?? 0));
  }

  /**
   * Tracks a user sees: `tracksInOrder` without LUNA's system `click` and `count_in` tracks
   * (fact 28).
   */
  get visibleTracks(): Track[] {
    return this.tracksInOrder.filter((t) => !SYSTEM_TRACK_TYPES.has(t.trackType.value ?? ''));
  }

  // ---------------------------------------------------------------------------------------
  // Commands
  // ---------------------------------------------------------------------------------------

  /** Create a track. Resolves to the engine reply. */
  newTrack(options: NewTrackOptions = {}): Promise<unknown> {
    const payload: Record<string, unknown> = { uid: this.uid, name: options.name ?? 'Untitled', track_type: options.trackType ?? 'audio', stem_format: options.stemFormat ?? 'mono' };
    if (options.count !== undefined) payload['count'] = options.count;
    if (options.makeNameUnique !== undefined) payload['make_name_unique'] = options.makeNameUnique;
    if (options.folderUid !== undefined) payload['folder_uid'] = options.folderUid;
    return this.post('new_track', payload);
  }

  /**
   * Create an aux bus (`new_track` with `track_type: "bus"`, fact 83) in one undo step, and
   * resolve to the {@link Bus} once it is listed in {@link buses}.
   *
   * @example
   * const reverb = await session.newBus({ name: 'Reverb' });
   * await track.outputs.byId('send_0').assign(reverb);
   */
  async newBus(options: NewBusOptions = {}): Promise<Bus> {
    const reply = (await this.post('new_track', { uid: this.uid, name: options.name ?? 'Bus', track_type: 'bus', stem_format: options.stemFormat ?? 'stereo' })) as { uid?: string } | null;
    const uid = reply?.uid;
    if (typeof uid !== 'string' || !uid) throw new UAError('invalid_response', 'new_track answered without a bus uid', { path: `${this.path}/new_track` });
    await settle(() => this.buses.byId(uid) !== undefined, 'new bus', {
      path: `${this.path}/buses`,
      refresh: () => this.buses.reload(),
      flush: () => this.client.store.scheduler.flush(),
    });
    return this.buses.byId(uid)!;
  }

  undo(count = 1): Promise<unknown> {
    return this.post('undo', { session_uid: this.uid, count });
  }

  redo(count = 1): Promise<unknown> {
    return this.post('redo', { session_uid: this.uid, count });
  }

  /** Save (commit) the session. */
  save(options: { label?: string; comments?: string } = {}): Promise<unknown> {
    const payload: Record<string, unknown> = { session_uid: this.uid };
    if (options.label !== undefined) payload['label'] = options.label;
    if (options.comments !== undefined) payload['comments'] = options.comments;
    return this.post('save_session', payload);
  }

  /**
   * Run `fn` as one undoable step. Aborts (discarding pending changes) if `fn` throws.
   * Called while a batch is already open, `fn` runs inside that batch: wrappers that batch
   * their own steps (`Output.retarget`) then join the caller's undo entry instead of nesting.
   *
   * @example
   * await session.transaction('Rename all', async () => {
   *   for (const t of session.tracks.items) await t.name.set(`${t.name.value} (mix)`);
   * });
   */
  async transaction<T>(name: string, fn: () => Promise<T>, options: TransactionOptions = {}): Promise<T> {
    if (this.batching) return fn();
    await this.post('begin_transaction', { session_uid: this.uid, name, is_continuous: options.continuous ?? false });
    this.batchDepth++;
    try {
      const result = await fn();
      this.batchDepth--;
      await this.post('commit_transaction', { session_uid: this.uid });
      return result;
    } catch (err) {
      this.batchDepth--;
      await this.post('abort_transaction', { session_uid: this.uid }).catch(() => undefined);
      throw err;
    }
  }

  /**
   * True while a {@link transaction} batch is open. LUNA holds selection writes and MIDI
   * deltas until the commit, so the selection-based verbs refuse to run inside one.
   */
  get batching(): boolean {
    return this.batchDepth > 0;
  }

  /**
   * Insert a clip from a source file onto a track's active playlist. Timeline position is in
   * ticks; source offsets are nanoseconds (fact 16).
   */
  insertClip(options: {
    trackUid?: string;
    playlistUid?: string;
    sourceUid: string;
    startTick: number;
    stopTick: number;
    sourceStartNs?: number;
    sourceStopNs?: number;
    name?: string;
    clipType?: 'audio' | 'video' | 'midi';
  }): Promise<unknown> {
    const payload: Record<string, unknown> = { session_uid: this.uid, source_uid: options.sourceUid, start: options.startTick, stop: options.stopTick };
    if (options.trackUid !== undefined) payload['track_uid'] = options.trackUid;
    if (options.playlistUid !== undefined) payload['playlist_uid'] = options.playlistUid;
    if (options.sourceStartNs !== undefined) payload['source_start'] = options.sourceStartNs;
    if (options.sourceStopNs !== undefined) payload['source_stop'] = options.sourceStopNs;
    if (options.name !== undefined) payload['name'] = options.name;
    if (options.clipType !== undefined) payload['clip_type'] = { audio: 0, video: 1, midi: 2 }[options.clipType];
    return this.post('insert_clip', payload);
  }

  /** Create a new playlist version on the given tracks, empty or duplicating the current one. */
  newPlaylists(trackUids: string[], options: { duplicate?: boolean } = {}): Promise<unknown> {
    return this.post('new_playlists', { session_uid: this.uid, track_uid: trackUids, context_type: 'main', duplicate: options.duplicate ?? false });
  }

  /** Make a playlist version active on a track. */
  setPlaylist(trackUid: string, version: number): Promise<unknown> {
    return this.post('set_playlists', { session_uid: this.uid, track_uid: [trackUid], version, context_type: 'main' });
  }

  /** Add a marker at `tick`. Resolves to the reply (`{ rowid }` on current engines). */
  /**
   * Add a marker at `tick` and resolve once it is in {@link markers}. `set_marker` answers
   * `null` whether or not it did anything (fact 71), so the list is the proof.
   *
   * @example
   * await session.addMarker(Luna.WHOLE_NOTE * 8, 'Chorus');
   */
  async addMarker(tick: number, name: string, options: { color?: number; comments?: string } = {}): Promise<unknown> {
    const payload: Record<string, unknown> = { session_uid: this.uid, location: requireTick(tick, 'marker tick'), name };
    if (options.color !== undefined) payload['color'] = options.color;
    if (options.comments !== undefined) payload['comments'] = options.comments;
    const before = new Set(this.markers.items.map((m) => m.id));
    const reply = await this.post('set_marker', payload);
    await settle(() => this.markers.items.some((m) => !before.has(m.id) && m.location.value === tick && m.name.value === name), 'add marker', {
      path: `${this.path}/markers`,
      refresh: () => this.markers.reload(),
      flush: () => this.client.store.scheduler.flush(),
    });
    return reply;
  }

  /**
   * Move or copy the clips in a tick range (or the context selection when omitted) so they
   * start at `toTick`.
   */
  moveClips(toTick: number, options: { startTick?: number; stopTick?: number; trackUids?: string[]; copy?: boolean; contextType?: string } = {}): Promise<unknown> {
    const payload: Record<string, unknown> = { session_uid: this.uid, context_type: options.contextType ?? 'main', location: toTick };
    if (options.startTick !== undefined) payload['start'] = options.startTick;
    if (options.stopTick !== undefined) payload['stop'] = options.stopTick;
    if (options.trackUids !== undefined) payload['track_uid'] = options.trackUids;
    if (options.copy !== undefined) payload['copy'] = options.copy;
    return this.post('move_clips', payload);
  }

  /**
   * Delete tracks by uid in one undo step, and resolve once they have left {@link tracks}.
   *
   * @example
   * await session.deleteTracks([scratch.id]);
   */
  async deleteTracks(trackUids: string[]): Promise<unknown> {
    const reply = await this.post('delete_tracks', { session_uid: this.uid, track_uid: trackUids });
    await settle(() => trackUids.every((id) => this.tracks.byId(id) === undefined && this.buses.byId(id) === undefined), 'delete tracks', {
      path: `${this.path}/tracks`,
      refresh: () => Promise.all([this.tracks.reload(), this.buses.reload()]),
      flush: () => this.client.store.scheduler.flush(),
    });
    return reply;
  }

  /**
   * Upload a file the engine cannot read from disk - a browser `File`, or any bytes - into
   * this session's package as a new audio source, and resolve to it once the workspace
   * lists it (fact 42).
   *
   * This is the **File route**, and the one that works everywhere: in LUNA, in a browser and
   * on the wasm engine, with no `/gui`. Get the `File` from `<input type="file">` or an HTML
   * `drop` event; the page can decode and audition the same `File` too. When the page only
   * needs the file in the session and has an engine-readable path (from
   * `luna.gui.chooseFiles()` or `Luna.onPathDrop()`), {@link importPath} is the faster path
   * route: nothing is copied through the page.
   *
   * The bytes go up base64-encoded in `chunkBytes` pieces through the engine's
   * `begin`/`transfer`/`end` phases, with `onProgress` after each chunk. A failed transfer
   * is cancelled, so a half-written file is not left behind. No clip is made: pass the
   * returned source's `id` to {@link insertClip} for that. LUNA files identical bytes only
   * once: uploading a file already in the session resolves to that source (fact 42). Use
   * {@link importFile} instead
   * when LUNA can already read the path itself.
   *
   * In LUNA 3.1.0.4589 and earlier `<input type="file">` opens nothing (fact 104), so offer an
   * HTML drop zone as well: `zone.ondrop = (e) => { e.preventDefault(); load(e.dataTransfer.files[0]); }`
   * with `zone.ondragover = (e) => e.preventDefault()`.
   *
   * @example
   * const source = await session.uploadFile({
   *   bytes: fileInput.files[0],
   *   onProgress: (sent, total) => (bar.value = sent / total),
   * });
   * await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT });
   */
  async uploadFile(options: UploadOptions): Promise<AudioSource> {
    await this.ready();
    const sources = this.sources;
    if (!sources) throw new UAError('unavailable', 'uploadFile(): the session package uid is not known yet', { path: this.path });
    const pkg = this.sessionPackageUid.value;
    const name = options.name ?? fileName(options.bytes);
    if (!name) throw new UAError('out_of_range', 'uploadFile(): give a name, or bytes that carry one', { path: this.path });
    const data = await toBytes(options.bytes);
    if (!data.length) throw new UAError('out_of_range', 'uploadFile(): the file is empty', { path: this.path });
    const chunk = Math.max(1024, Math.min(options.chunkBytes ?? 256 * 1024, 4 * 1024 * 1024));
    const body = { session_package_uid: pkg, type: 'audio' };
    const importId = Math.floor(Math.random() * 0x7fffffff);
    const post = (payload: Record<string, unknown>): Promise<unknown> => this.wire.post('/workspace/import_file', { ...body, import_id: importId, ...payload });

    const begun = (await post({ phase: 'begin', name })) as { uid?: string } | null;
    const uid = begun?.uid;
    if (typeof uid !== 'string') throw new UAError('invalid_response', 'uploadFile(): import_file begin answered without a uid', { path: '/workspace/import_file' });
    let ended: { uid?: unknown } | null;
    try {
      for (let offset = 0; offset < data.length; offset += chunk) {
        await post({ phase: 'transfer', uid, file_data: base64(data.subarray(offset, offset + chunk)) });
        options.onProgress?.(Math.min(data.length, offset + chunk), data.length);
      }
      ended = (await post({ phase: 'end', uid, name })) as { uid?: unknown } | null;
    } catch (err) {
      await post({ phase: 'cancel', uid, name }).catch(() => undefined);
      throw err;
    }
    // Bytes already in the session are not filed again: `end` names the existing source.
    const filed = typeof ended?.uid === 'string' && ended.uid ? ended.uid : uid;
    return this.listedSource(filed, options.timeoutMs ?? 30_000);
  }

  /** Wait for `uid` to appear in the workspace audio folder, re-reading it while waiting. */
  private async listedSource(uid: string, timeoutMs: number): Promise<AudioSource> {
    const sources = this.sources;
    if (!sources) throw new UAError('unavailable', 'the session package uid went away during an import', { path: this.path });
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const found = sources.byId(uid);
      if (found) return found;
      if (Date.now() > deadline) throw new UAError('no_effect', `the workspace did not list source ${uid} within ${timeoutMs} ms`, { path: sources.path });
      // Collection.load() is once-only, so re-read the folder itself and resync the members.
      await this.client.store.load(sources.path, { levels: 2, commands: false, flatvalue: true });
      if (sources.refresh().some((s) => s.id === uid)) continue;
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  /**
   * Copy a file the engine can read from disk into this session's package as a new audio
   * source, and resolve to it once the workspace lists it (fact 42, `local_copy`). No clip
   * is made: pass the source's `id` to {@link insertClip}.
   *
   * This is the **path route**, an optimization: the engine reads `path` itself, so the bytes
   * never pass through the page. Take the path from `luna.gui.chooseFiles()` or
   * `Luna.onPathDrop()`. It needs no `/gui`, but the engine must see the file: a native
   * engine on the same machine, not the wasm engine. A path the engine cannot open rejects
   * with LUNA's `device.database_error`. For a browser `File`, use {@link uploadFile}.
   *
   * @example
   * const [path] = await luna.gui.chooseFiles({ filters: ['*.wav'] });
   * if (path) {
   *   const source = await session.importPath(path);
   *   await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT });
   * }
   */
  async importPath(path: string, options: ImportPathOptions = {}): Promise<AudioSource> {
    await this.ready();
    const sources = this.sources;
    if (!sources) throw new UAError('unavailable', 'importPath(): the session package uid is not known yet', { path: this.path });
    const name = options.name ?? path.slice(Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) + 1);
    if (!name) throw new UAError('out_of_range', `importPath(): no file name in ${JSON.stringify(path)}`, { path: this.path });
    const reply = (await this.wire.post('/workspace/import_file', {
      session_package_uid: this.sessionPackageUid.value,
      type: 'audio',
      import_id: Math.floor(Math.random() * 0x7fffffff),
      phase: 'local_copy',
      path,
      name,
    })) as { uid?: unknown } | null;
    const uid = reply?.uid;
    if (typeof uid !== 'string') throw new UAError('invalid_response', 'importPath(): import_file local_copy answered without a uid', { path: '/workspace/import_file' });
    return this.listedSource(uid, options.timeoutMs ?? 30_000);
  }

  /**
   * LUNA's own import: the File > Import action. Imports an audio, MIDI or video file at
   * the selection start, onto `trackUid` or a new track, making a clip as LUNA does.
   *
   * A **path route** command run by LUNA's UI, so it needs `/gui`: without it (a headless or
   * wasm engine) it rejects with `Luna.Unsupported` (fact 103). To add a source without a
   * clip, or without `/gui`, use {@link importPath}; for a browser `File`, {@link uploadFile}.
   *
   * @example
   * const [path] = await luna.gui.chooseFiles({ filters: ['*.wav', '*.mid'] });
   * if (path) await session.importFile(path, track.id);
   */
  async importFile(path: string, trackUid?: string): Promise<unknown> {
    if (!(await this.client.gui.available())) throw new Unsupported('importFile(): LUNA imports through its UI, and this engine has no /gui. Use session.importPath(), or session.uploadFile() for a File.');
    const payload: Record<string, unknown> = { path };
    if (trackUid !== undefined) payload['track_uid'] = trackUid;
    return this.post('import_files', payload);
  }

  /**
   * Bounce channels through LUNA's render engine (fact 44). Resolves once the render is
   * running, so the caller can watch `render.progress` and `await render.done()`.
   *
   * Without `outputPaths` the finished audio is added to the session as sources, one per
   * channel, under the returned `fileUids`; with them it is written to those paths instead.
   *
   * @example
   * const { render } = await session.bounce({ channelUids: [vocal.id], range: { startTick: 0, stopTick: 8 * Luna.TICKS_PER_BEAT } });
   * await render.done();
   */
  async bounce(options: BounceOptions): Promise<{ render: Render; fileUids: string[] }> {
    if (!options.channelUids.length) throw new UAError('out_of_range', 'bounce(): give at least one channel', { path: this.path });
    if (options.outputPaths && options.outputPaths.length !== options.channelUids.length) {
      throw new UAError('out_of_range', `bounce(): ${options.outputPaths.length} outputPaths for ${options.channelUids.length} channels`, { path: this.path });
    }
    const tracks: Record<string, string> = {};
    const buses: Record<string, string> = {};
    const files: Record<string, string> = {};
    const fileUids: string[] = [];
    options.channelUids.forEach((uid, i) => {
      const fileUid = newUid();
      fileUids.push(fileUid);
      if (this.tracks.byId(uid)) tracks[uid] = fileUid;
      else if (this.buses.byId(uid)) buses[uid] = fileUid;
      else throw new UAError('not_found', `bounce(): no channel ${uid} in this session`, { path: this.path });
      if (options.outputPaths) files[fileUid] = options.outputPaths[i]!;
    });
    const uid = newUid();
    const addToSession = !options.outputPaths;
    const body: Record<string, unknown> = {
      uid,
      type: 'bounce',
      name: options.name ?? 'Bounce',
      session_uid: this.uid,
      real_time: options.realTime === true,
      add_to_session: addToSession,
      record_point: options.recordPoint ?? 'post_pan',
    };
    if (Object.keys(tracks).length) body['tracks'] = tracks;
    if (Object.keys(buses).length) body['buses'] = buses;
    if (options.outputPaths) body['output_paths'] = files;

    const restore = await this.selectRange(options.range);
    try {
      await this.wire.post('/renders/new', body);
      const render = new Render(this.client, `/renders/${uid}`);
      await this.wire.post('/renders/start', { uid });
      // LUNA has already applied `running` by the time start answers, so read rather than
      // wait a frame for the push (fact 44).
      await render.reload({ children: false, flatvalue: true, commands: false });
      return { render, fileUids };
    } finally {
      await restore();
    }
  }

  /**
   * LUNA's own export (`export_session`): the main bus over the timeline selection, or
   * `range`, to the session's export folder. The reply carries the path it wrote.
   *
   * The render is already running when this resolves, so a very short offline export can
   * finish and be dropped before anything observes it; `render.done()` then rejects with
   * `removed` although the file was written (fact 44).
   *
   * @example const { render, file } = await session.exportMain({ name: 'Rough mix' });
   */
  async exportMain(options: ExportOptions = {}): Promise<{ render: Render; file: string | undefined }> {
    const restore = await this.selectRange(options.range);
    try {
      const body: Record<string, unknown> = { session_uid: this.uid, realtime: options.realTime === true };
      if (options.name !== undefined) body['bounce_name'] = options.name;
      const reply = (await this.post('export_session', body)) as { render_uid?: string; file?: string } | null;
      const uid = reply?.render_uid;
      if (typeof uid !== 'string' || !uid) throw new UAError('no_effect', 'exportMain(): LUNA answered without a render_uid', { path: this.path });
      const render = new Render(this.client, `/renders/${uid}`);
      await render.reload({ children: false, flatvalue: true, commands: false }).catch(() => undefined);
      return { render, file: typeof reply.file === 'string' ? reply.file : undefined };
    } finally {
      await restore();
    }
  }

  /**
   * Apply `range` as the timeline selection for the duration of a render, and hand back a
   * function that puts the user's selection back. A no-op when no range is given.
   */
  private async selectRange(range: { startTick: number; stopTick: number } | undefined): Promise<() => Promise<void>> {
    if (!range) return async () => undefined;
    const { startTick, stopTick } = range;
    if (!Number.isFinite(startTick) || !Number.isFinite(stopTick) || startTick < 0 || stopTick <= startTick) {
      throw new UAError('out_of_range', `range ${startTick}..${stopTick} is not a positive tick span`, { path: this.path });
    }
    await this.contexts.load();
    const saved = { start: this.context.selectionStart.value, stop: this.context.selectionStop.value };
    await this.context.select({ startTick: Math.round(startTick), stopTick: Math.round(stopTick) });
    return async () => {
      if (saved.start === null || saved.start === undefined || saved.stop === null || saved.stop === undefined) return;
      await this.context.select({ startTick: saved.start, stopTick: saved.stop }).catch(() => undefined);
    };
  }

  /**
   * Record one pass onto an audio track and resolve to the finalized take.
   *
   * The flow measured on 4543 (fact 75): route and arm the track and confirm the arm by a
   * read, roll the transport in record (writing the session's `record_enabled` starts
   * playback by itself), wait for `punchedIn` so any count-in is over and capture has really
   * begun, hold for `seconds` or until `signal` aborts, then stop and disarm. The take
   * finalizes onto the track's active playlist as a clip whose source is born under
   * `<session>/record/audio/<uid>` and migrates to the workspace audio folder about half a
   * second later, so this waits for the source to be listed too — the take is drawable by
   * {@link clipAudio} the moment it resolves.
   *
   * LUNA punches in only when the punch point lies inside `loop_start..loop_stop`, looping on
   * or not; outside it the transport rolls, the count-in completes and nothing is captured.
   * The marks are therefore widened around the punch and put back afterwards.
   *
   * The capture is always stopped and the track disarmed, even on error.
   *
   * @example
   * const inputs = await luna.audioInputs();
   * const take = await session.record({ track: drums, inputUid: inputs[0]?.uid, seconds: 8 });
   * console.log(take.name.value, take.length! / Luna.TICKS_PER_BEAT, 'beats');
   */
  async record(options: RecordOptions): Promise<Clip> {
    await this.ready();
    const track = typeof options.track === 'string' ? this.tracks.byId(options.track) : options.track;
    if (!track) throw new UAError('not_found', `record(): no track ${String(typeof options.track === 'string' ? options.track : '')}`, { path: this.path });
    if (track.trackType.value !== 'audio') throw new UAError('out_of_range', `record(): ${String(track.name.value)} is not an audio track`, { path: track.path });
    const lane = this.playlistFor(track);
    if (!lane) throw new UAError('unavailable', `record(): ${String(track.name.value)} has no active playlist`, { path: track.path });
    await lane.clips.load();
    if (options.seconds === undefined && !options.signal) throw new UAError('out_of_range', 'record(): give seconds, a signal, or both', { path: this.path });
    if (options.seconds !== undefined && (!Number.isFinite(options.seconds) || options.seconds <= 0)) {
      throw new UAError('out_of_range', 'record(): seconds must be greater than 0', { path: this.path });
    }

    if (options.inputUid !== undefined) await track.inputNodeUid.set(options.inputUid);
    await track.recordEnabled.set(true);
    await settle(() => track.recordEnabled.value === true, 'arm track', {
      path: track.path,
      refresh: () => this.client.store.load(track.path, { children: false, commands: false, propfilter: ['record_enabled'] }),
      flush: () => this.client.store.scheduler.flush(),
    });

    await this.transport.looping.set(false);
    // The play start alone: seek() would also collapse the loop marks the punch gate reads.
    if (options.startTick !== undefined) await this.transport.playStart.set(requireTick(options.startTick, 'startTick'));
    // A raw write by this same connection echoes nothing back (fact 14), so re-read the marks.
    await this.client.store.load(this.path, { children: false, commands: false, propfilter: ['play_start', 'loop_start', 'loop_stop'] });
    const punchAt = options.startTick ?? this.transport.playStart.value ?? 0;
    const loopWas = { start: this.transport.loopStart.value, stop: this.transport.loopStop.value };
    let widened = false;
    if (loopWas.start !== undefined && loopWas.stop !== undefined && !(punchAt >= loopWas.start && punchAt < loopWas.stop)) {
      await this.transport.setLoop(Math.min(loopWas.start, punchAt), Math.max(loopWas.stop, punchAt + RECORD_LOOP_MARGIN_TICKS));
      widened = true;
    }

    const before = new Set(lane.clips.items.map((c) => c.id));
    try {
      await this.transport.recordEnabled.set(true);
      await settle(() => this.transport.punchedIn.value === true, 'punch in', {
        path: this.path,
        timeoutMs: 30_000,
        refresh: () => this.client.store.load(this.path, { children: false, commands: false, propfilter: ['punched_in', 'counting_in', 'playing'] }),
        flush: () => this.client.store.scheduler.flush(),
      });
      await captureWindow(options.seconds, options.maxSeconds ?? 600, options.signal);
    } finally {
      await this.transport.recordEnabled.set(false).catch(() => {});
      await this.transport.playing.set(false).catch(() => {});
      await track.recordEnabled.set(false).catch(() => {});
      // Own writes echo as derived properties, not `value` (fact 14): re-read what was written
      // so the transport and the track read false to the caller.
      await this.client.store.load(track.path, { children: false, commands: false, propfilter: ['record_enabled', 'record_mute', 'input_monitor', 'input_monitor_state'] }).catch(() => {});
      await this.client.store.load(this.path, { children: false, commands: false, propfilter: ['record_enabled', 'playing', 'punched_in', 'counting_in'] }).catch(() => {});
      if (widened && loopWas.start !== undefined && loopWas.stop !== undefined) await this.transport.setLoop(loopWas.start, loopWas.stop).catch(() => {});
    }

    let take: Clip | undefined;
    await settle(
      () => {
        take = lane.clips.items.find((c) => !before.has(c.id) && Boolean(c.sourceUid.value) && (c.stop.value ?? 0) > (c.start.value ?? 0));
        return take !== undefined;
      },
      'finalize take',
      {
        path: `${lane.path}/clips`,
        timeoutMs: 8000,
        refresh: async () => {
          await this.client.store.load(`${lane.path}/clips`, { levels: 2, commands: false, flatvalue: true, propfilter: CLIP_PROPS });
          lane.clips.refresh();
        },
        flush: () => this.client.store.scheduler.flush(),
      },
    );
    // The source leaves `<session>/record/audio` for the workspace folder about half a second
    // after the clip appears; wait for it so the take can be drawn straight away.
    const sourceUid = take!.sourceUid.value;
    if (sourceUid) await this.listedSource(sourceUid, 8000).catch(() => undefined);
    return take!;
  }

  /** Close this session. */
  close(): Promise<unknown> {
    return this.wire.post('/sessions/close_session', { session_uid: this.uid });
  }

  protected override release(): void {
    this.tracks.dispose();
    this.buses.dispose();
    this.playlists.dispose();
    this.musical.dispose();
    this.markers.dispose();
    this.contexts.dispose();
    this.sourcesCollection?.dispose();
    this.sourcesRelease?.();
    this.sourcesRelease = undefined;
    this.watchRelease?.();
    this.watchRelease = undefined;
    this.readyPromise = undefined;
    this.client.store.forget(this.path);
  }
}

/** Hold for `seconds` (capped by `maxSeconds`) or until `signal` aborts, whichever ends first. */
function captureWindow(seconds: number | undefined, maxSeconds: number, signal: AbortSignal | undefined): Promise<void> {
  const deadline = Date.now() + Math.min(seconds ?? maxSeconds, maxSeconds) * 1000;
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const finish = (): void => {
      if (timer) clearInterval(timer);
      signal?.removeEventListener('abort', finish);
      resolve();
    };
    if (signal?.aborted) return finish();
    signal?.addEventListener('abort', finish, { once: true });
    timer = setInterval(() => {
      if (Date.now() >= deadline) finish();
    }, 50);
  });
}

async function toBytes(input: Blob | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return new Uint8Array(await input.arrayBuffer());
}

/**
 * A browser `File` carries its own name; a bare Blob or buffer does not. Read by shape, not
 * `instanceof`, so a `File` from another realm (an iframe, a test DOM) keeps its name.
 */
function fileName(input: Blob | ArrayBuffer | Uint8Array): string | undefined {
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) return undefined;
  const name = (input as { name?: unknown }).name;
  return typeof name === 'string' && name ? name : undefined;
}

function base64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/** A fresh 32-hex uid, the shape LUNA uses for render and file objects. */
function newUid(): string {
  return globalThis.crypto.randomUUID().replaceAll('-', '');
}
