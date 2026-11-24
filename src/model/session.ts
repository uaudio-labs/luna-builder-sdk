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
import { AudioSource, sourceFilePath } from './audio-source';
import { SourceUsage } from './source-usage';
import { SessionPackage } from './workspace';
import { Bus, type FolderMode } from './bus';
import type { Channel } from './channel';
import { Collection } from './collection';
import { RecordTakes } from './record';
import { Context } from './context';
import { Lyrics } from './lyrics';
import { Markers } from './markers';
import { Groups } from './groups';
import { SessionStorage } from './storage';
import { Musical } from './musical';
import { Node } from './node';
import { requireFadeShape, type Clip } from './clip';
import type { FadeShape } from './compiled-clip';
import { Playlist } from './playlist';
import type { PresetRow } from './presets';
import { plannedOrder } from './order';
import { requireTick, settle } from './settle';
import { Render } from './system';
import { Track, type TrackType } from './track';
import { TICKS_PER_BEAT } from './ticks';
import { Transport } from './transport';

/**
 * How soloing a track treats the others (fact 157): `'latching'` adds it to what is soloed,
 * `'exclusive'` unsolos the rest (LUNA does that only inside a touch, fact 78).
 */
export type SoloMode = 'latching' | 'exclusive';

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
  /**
   * What the file is. Default `'audio'`, which resolves to an {@link AudioSource}; `'midi'`
   * and `'video'` resolve to an {@link ImportedFile} (fact 163). LUNA checks the content is
   * what the type says and refuses it with `uasrv.invalid_value` otherwise.
   */
  type?: 'audio' | 'midi' | 'video';
}

/**
 * A MIDI or video file copied into a session's package by {@link Session.importPath}. Only the
 * file is added: no track or clip is made (fact 163). A MIDI file is filed in the package's
 * `midi` folder, a video file, with its extension, in `video`.
 */
export interface ImportedFile {
  /** The file's uid in the package. */
  uid: string;
  type: 'midi' | 'video';
  /** The name it was stored under. */
  name: string;
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
  /** Default `'Untitled'`. */
  name?: string;
  /** Default `'audio'`. */
  trackType?: Extract<TrackType, 'audio' | 'instrument' | 'midi_matrix' | 'video'>;
  /** Default `'mono'`. */
  stemFormat?: 'mono' | 'stereo' | (string & {});
  /** How many tracks to make. Default 1. */
  count?: number;
  /** Number the name when a track or bus already has it. */
  makeNameUnique?: boolean;
  /** Place the new tracks in this folder track. */
  folderUid?: string;
}

/**
 * What a clip's length follows when the tempo changes (LUNA's `length_follows`): `'ticks'`
 * keeps its musical length, `'time'` its length in seconds. Left out, the clip follows its
 * track.
 */
export type LengthFollows = 'ticks' | 'time';

/** LUNA's time-stretch algorithm for an audio clip (`alg_type`), passed verbatim. */
export type AlgType = 'polyphonic' | 'monophonic' | 'efficient' | 'soloist' | 'varispeed' | 'razor_blade' | 'ua_stretch' | 'clip_effect';

export interface InsertClipOptions {
  /** The track whose active playlist gets the clip. Give this or `playlistUid`. */
  trackUid?: string;
  /** The playlist (lane) that gets the clip. */
  playlistUid?: string;
  /** The source file. Required, except with `copyOf`, which defaults it to that clip's. */
  sourceUid?: string;
  /** Timeline start, in ticks. */
  startTick: number;
  /** Timeline stop, in ticks; after `startTick`. */
  stopTick: number;
  /** Offset into the source, in nanoseconds. With `copyOf`, defaults to that clip's. */
  sourceStartNs?: number;
  /** End in the source, in nanoseconds. With `copyOf`, defaults to that clip's. */
  sourceStopNs?: number;
  /** With `copyOf`, defaults to that clip's name. */
  name?: string;
  /** Default `'audio'`. */
  clipType?: 'audio' | 'video' | 'midi';
  /** Layer for overlapping clips; higher plays on top. Default: above every clip it overlaps. */
  layer?: number;
  /** What the clip's length follows on a tempo change. Default: its track's setting. */
  lengthFollows?: LengthFollows;
  /** Time-stretch algorithm for an audio clip. Default: its track's. */
  algType?: AlgType;
  /**
   * Copy this clip (LUNA's `clip_uid`): the new clip takes its gain, fades, warps, MIDI and
   * settings, placed at `startTick`-`stopTick`.
   */
  copyOf?: Clip;
}

export interface NewTrackFromPresetOptions {
  /** The new track's name. Default: the preset's name. A multi-track preset's tracks keep their own. */
  name?: string;
  /** Number the name when a track or bus already has it, as LUNA's browser does. Default true. */
  makeNameUnique?: boolean;
  /** Place the new tracks before this track. Default: after the last one. */
  beforeUid?: string;
  /** Place the new tracks in this folder track. */
  folderUid?: string;
  /** The stem format of the audio track an effect plugin's preset makes. Default mono. */
  stemFormat?: 'mono' | 'stereo' | (string & {});
}

export interface NewBusOptions {
  /** Default `'Bus'`. */
  name?: string;
  /** Default `'stereo'`. */
  stemFormat?: 'mono' | 'stereo' | (string & {});
}

export interface NewFolderOptions {
  /** Default `'Folder'`. */
  name?: string;
  /**
   * Default `'summing'`: the tracks inside play through the folder, as a bus. `'container'`
   * only groups them; they keep routing to the nearest summing folder above, else the master.
   */
  mode?: Exclude<FolderMode, 'none'>;
  /** Default `'stereo'`. */
  stemFormat?: 'mono' | 'stereo' | (string & {});
  /** Place the new folder inside this folder. Default: the session root. */
  folderUid?: string;
}

export interface MoveToFolderOptions {
  /**
   * Place the moved items just after this track or bus, as {@link Session.reorder} does: LUNA
   * then keeps each folder's contents together, so it decides their place among the items
   * already in the destination. Usually a track or bus in the destination, or the folder
   * itself for first in it. Default (or `null`): first in the destination.
   */
  after?: Channel | string | null;
}

export interface ReorderOptions {
  /**
   * Place the items just after this track or bus. Default (or `null`): first. Nothing changes
   * folder, so the place is among the item's siblings: see {@link Session.reorder}.
   */
  after?: Channel | string | null;
}

export interface TransactionOptions {
  /**
   * A live gesture (a drag, a slider, a preview being regenerated) instead of a batch. Each
   * command first undoes the one before it, so only the last command's effect is kept and
   * recorded; write every step relative to where things were when the transaction began,
   * never as a change from the previous step. Pushes arrive per command (fact 115).
   */
  continuous?: boolean;
}

/**
 * Which kind of {@link Session.transaction} is open: `'batch'` holds every command for one
 * undo step and holds pushes until the commit; `'continuous'` keeps only the last command.
 */
export type TransactionMode = 'batch' | 'continuous';

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
  /**
   * The session's solo mode, writable (fact 157). LUNA refuses any value but the two
   * {@link SoloMode}s. Not undoable.
   *
   * @example await session.soloMode.set('exclusive');
   */
  readonly soloMode: WritableProp<SoloMode>;
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
  /** The session's lyrics, ruler and transcribed (fact 152). */
  readonly lyrics: Lyrics;
  /** Mix, edit, plugin and send groups (facts 215-218). Not loaded by `ready()`: `await session.groups.load()`. */
  readonly groups: Groups;
  /** Data Add Ons keep with this session, by reverse-DNS context (fact 129). */
  readonly storage: SessionStorage;
  /** Edit contexts (`main`, `editor`, `alt_<n>`). */
  readonly contexts: Collection<Context>;
  /** The `main` edit context: selection, zoom and the context edit commands. */
  readonly context: Context;
  /**
   * Takes being recorded right now, on every armed track, before they become clips: each with
   * its growing `stop`, its audio file's waveform, or its MIDI so far (fact 149).
   */
  readonly recordTakes: RecordTakes;
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
  private openTransaction: TransactionMode | undefined;

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
    this.soloMode = this.writableProp<SoloMode>('solo_mode');
    this.tempoEstablished = this.prop<boolean>('tempo_established');
    this.commandStatus = this.prop<string | null>('command_status');
    this.commandPercentComplete = this.prop<number>('command_percent_complete');
    this.transport = new Transport(client, this.path, () => this.musical);
    this.tracks = new Collection<Track>(client, `${this.path}/tracks`, (p) => new Track(client, p, uid), { levels: 2, commands: false, flatvalue: true });
    this.buses = new Collection<Bus>(client, `${this.path}/buses`, (p) => new Bus(client, p, uid), { levels: 2, commands: false, flatvalue: true });
    this.playlists = new Collection<Playlist>(client, `${this.path}/playlists`, (p) => new Playlist(client, p, uid, () => this.transactionMode), { levels: 2, commands: false, flatvalue: true });
    this.musical = new Musical(client, this.path, uid, (name, fn) => this.transaction(name, fn));
    this.markers = new Markers(client, this.path, uid, () => this.musical.timeline);
    this.lyrics = new Lyrics(client, this.path);
    this.groups = new Groups(client, this.path, uid);
    this.storage = new SessionStorage(client, this.path);
    this.contexts = new Collection<Context>(client, `${this.path}/contexts`, (p) => new Context(client, p, uid), { levels: 2, commands: false, flatvalue: true });
    this.context = new Context(client, `${this.path}/contexts/main`, uid);
    this.recordTakes = new RecordTakes(client, this.path);
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
      // Open plugin editors live in /gui, outside the session subtree (effect.editorOpen, fact 126).
      this.readyPromise = watch.ready.then(() => Promise.all([this.tracks.load(), this.buses.load(), this.playlists.load(), this.musical.ready(), this.markers.load(), this.contexts.load(), this.recordTakes.load(), this.client.gui.watchPluginWindows()])).then(() => undefined);
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

  /**
   * The session's source files, loaded and ready: waits for `ready()` (which brings the
   * package uid), loads the folder and every member's properties, and keeps following it.
   *
   * @example
   * const sources = await session.loadSources();
   * sources.items.map((s) => s.displayName.value);
   * sources.onAnyChange(() => render(sources.items), { props: ['name', 'length'] });
   */
  async loadSources(): Promise<Collection<AudioSource>> {
    await this.ready();
    const sources = this.sources;
    if (!sources) throw new UAError('unavailable', 'loadSources(): LUNA did not report the session package uid', { path: this.path });
    await sources.load();
    await sources.membersReady();
    // Let the collection announce its first load now, so a listener added next starts quiet.
    await this.client.settled();
    return sources;
  }

  /**
   * A source file's absolute path on disk, from the session's package path (fact 239):
   * `<package>/audio/<uid>.wav`, or `<package>/renders/clips/<uid>.wav` for a rendering.
   * Synchronous, so a `dragstart` handler can use it. `undefined` before `ready()`.
   *
   * @example
   * const path = session.sourcePath(source);
   * if (path) await luna.gui.revealPath(path);
   */
  sourcePath(source: AudioSource | string): string | undefined {
    const pkg = this.sessionPackagePath.value;
    if (!pkg) return undefined;
    const member = typeof source === 'string' ? this.sources?.byId(source) : source;
    const uid = typeof source === 'string' ? source : source.id;
    return sourceFilePath(pkg, uid, member?.isRender ?? false);
  }

  /**
   * The session's own package in the workspace (name, folder, favourite, comments), loaded,
   * without loading every package (`workspace.packages`).
   *
   * @example
   * const pkg = await session.package();
   * pkg.name; pkg.directoryPath.value; await pkg.favorite.set(true);
   */
  async package(): Promise<SessionPackage> {
    await this.ready();
    const uid = this.sessionPackageUid.value;
    if (!uid) throw new UAError('unavailable', 'package(): LUNA did not report the session package uid', { path: this.path });
    if (this.packageNode?.id !== uid) {
      this.packageNode?.dispose();
      this.packageNode = new SessionPackage(this.client, `/workspace/sessions/${uid}`);
    }
    await this.packageNode.load({ children: false, commands: false, flatvalue: true });
    return this.packageNode;
  }

  private packageNode: SessionPackage | undefined;

  /**
   * Which tracks and clips use each source file, live: it follows clips being added, deleted,
   * rendered or pointed at another file, and tracks switching playlists. Loads every
   * playlist's clips first. Call `dispose()` on it when done.
   *
   * @example
   * const usage = await session.sourceUsage();
   * usage.byId(source.id)?.trackUids.map((t) => session.tracks.byId(t)?.name.value);
   * usage.isUsed(source.id);
   * usage.onChange(() => render());
   */
  sourceUsage(): Promise<SourceUsage> {
    return new SourceUsage(this).start();
  }

  /** The active playlist of a track, once playlists are loaded. */
  playlistFor(track: Track): Playlist | undefined {
    const uid = track.playlistUid.value;
    return uid ? this.playlists.byId(uid) : undefined;
  }

  /**
   * Point LUNA's edit selection at tracks on the timeline, as clicking in LUNA's timeline does:
   * the tracks, their active playlists and focus `timeline`, and the range when given (the
   * current one is kept otherwise). Then `context.cut()`, `copy()`, `paste()`, `clear()` and
   * `duplicate()` act on that range of those tracks, and paste lands at the range start
   * (fact 150). No undo entry. Use it before an edit command when the user has not just
   * selected in LUNA's own timeline: LUNA's selection may name other tracks, or the mixer.
   *
   * @example
   * await session.selectTimeline({ tracks: [track], startTick: bar(5), stopTick: bar(9) });
   * await session.context.copy();
   * await session.selectTimeline({ tracks: [other], startTick: bar(17) });
   * await session.context.paste();
   */
  async selectTimeline(options: { tracks: readonly (Track | string)[]; startTick?: number; stopTick?: number }): Promise<void> {
    const ids = options.tracks.map((t) => (typeof t === 'string' ? t : t.id));
    const playlists: string[] = [];
    for (const id of ids) {
      const track = this.tracks.byId(id);
      const lane = track && this.playlistFor(track);
      if (lane) playlists.push(lane.id);
    }
    await this.context.select({
      trackUids: ids,
      playlistUids: playlists,
      focus: 'timeline',
      ...(options.startTick !== undefined ? { startTick: options.startTick } : {}),
      ...(options.stopTick !== undefined ? { stopTick: options.stopTick } : {}),
    });
  }

  /** The master bus, once buses are loaded. */
  get master(): Bus | undefined {
    return this.buses.items.find((b) => b.isMaster);
  }

  /**
   * Every track and bus in LUNA's order (fact 137): one `order` runs 1..N across both, each
   * folder followed at once by everything inside it. This includes LUNA's system tracks
   * (click, count-in) and buses (master, cues); filter on `trackType` and `busType` for what
   * a page shows. {@link tracksInOrder} is the same order with the buses left out.
   *
   * @example
   * // LUNA's track list as an indented outline.
   * const depth = (ch) => (ch?.folderUid.value ? 1 + depth(session.buses.byId(ch.folderUid.value)) : 0);
   * for (const ch of session.channelsInOrder) console.log('  '.repeat(depth(ch)) + ch.name.value);
   */
  get channelsInOrder(): Array<Track | Bus> {
    return [...this.tracks.items, ...this.buses.items].sort((a, b) => (a.order.value ?? 0) - (b.order.value ?? 0));
  }

  /** Tracks sorted by their `order` key; buses and folders, which share it, are left out (fact 137). */
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

  /**
   * Create tracks in one undo step, and resolve to them once they are listed in
   * {@link tracks} with their properties loaded: one {@link Track}, or `count` of them. LUNA
   * answers the new uids (fact 135), so nothing has to be found by name.
   *
   * Inside a batch {@link transaction} LUNA holds the new tracks back until the commit (facts
   * 74, 135), so this resolves at once to tracks whose `id` is set and whose props read
   * `undefined` until then. They are the objects `session.tracks` lists after the commit.
   *
   * @example
   * const [bass] = await session.newTrack({ name: 'Bass', stemFormat: 'mono' });
   * bass.name.value; // 'Bass'
   *
   * @example
   * // A track and its clip as one undo entry.
   * await session.transaction('Add loop', async () => {
   *   const [track] = await session.newTrack({ name: 'Loop', stemFormat: 'stereo' });
   *   await session.insertClip({ trackUid: track.id, sourceUid, startTick: 0, stopTick: Luna.WHOLE_NOTE });
   * });
   */
  async newTrack(options: NewTrackOptions = {}): Promise<Track[]> {
    const payload: Record<string, unknown> = { uid: this.uid, name: options.name ?? 'Untitled', track_type: options.trackType ?? 'audio', stem_format: options.stemFormat ?? 'mono' };
    if (options.count !== undefined) payload['count'] = options.count;
    if (options.makeNameUnique !== undefined) payload['make_name_unique'] = options.makeNameUnique;
    if (options.folderUid !== undefined) payload['folder_uid'] = options.folderUid;
    const uids = replyUids(await this.post('new_track', payload));
    if (uids.length === 0) throw new UAError('invalid_response', 'new_track answered without a track uid', { path: `${this.path}/new_track` });
    return this.resolveTracks(uids);
  }

  /** The tracks `new_track` made: listed and loaded, or handles inside a batch. */
  private async resolveTracks(uids: readonly string[]): Promise<Track[]> {
    if (this.openTransaction === 'batch') return uids.map((uid) => this.tracks.member(uid));
    await settle(() => uids.every((uid) => this.tracks.byId(uid) !== undefined || this.buses.byId(uid) !== undefined), 'new tracks', {
      path: `${this.path}/tracks`,
      refresh: () => Promise.all([this.tracks.reload(), this.buses.reload()]).then(() => undefined),
      flush: () => this.client.store.scheduler.flush(),
    });
    // Listed is not loaded: wait for the new members' properties and their change notices.
    await this.tracks.membersReady();
    await this.client.settled();
    return uids.map((uid) => this.tracks.byId(uid)).filter((t): t is Track => t !== undefined);
  }

  /**
   * Create an aux bus (`new_track` with `track_type: "bus"`, fact 83) in one undo step, and
   * resolve to the {@link Bus} once it is listed in {@link buses} with its properties loaded.
   *
   * @example
   * const reverb = await session.newBus({ name: 'Reverb' });
   * await track.outputs.byId('send_0').assign(reverb);
   */
  async newBus(options: NewBusOptions = {}): Promise<Bus> {
    return this.createBus({ uid: this.uid, name: options.name ?? 'Bus', track_type: 'bus', stem_format: options.stemFormat ?? 'stereo' }, 'new bus');
  }

  /** Post `new_track` for a bus and resolve to it, listed and loaded. */
  private async createBus(payload: Record<string, unknown>, what: string): Promise<Bus> {
    const reply = (await this.post('new_track', payload)) as { uid?: string } | null;
    const uid = reply?.uid;
    if (typeof uid !== 'string' || !uid) throw new UAError('invalid_response', 'new_track answered without a bus uid', { path: `${this.path}/new_track` });
    await settle(() => this.buses.byId(uid) !== undefined, what, {
      path: `${this.path}/buses`,
      refresh: () => this.buses.reload(),
      flush: () => this.client.store.scheduler.flush(),
    });
    // An `added` push lists the bus before its properties arrive (fact 7); the collection
    // fetches them, and until then name, busType and stemFormat read undefined.
    await this.buses.membersReady();
    return this.buses.byId(uid)!;
  }

  /**
   * Create a folder track in one undo step, and resolve to it once it is listed in
   * {@link buses} with its properties loaded (fact 136). A folder is an aux bus whose
   * {@link Bus.folderMode} is not `'none'`, so it is a {@link Bus} with `isFolder` true. It goes
   * last in the session, or first inside `folderUid` (fact 137). Put
   * tracks in it with `newTrack({ folderUid })` or {@link moveToFolder}; list them with
   * {@link folderContents}.
   *
   * @throws {UAError} `device.database_error` when `folderUid` is not a folder.
   * @example
   * const drums = await session.newFolder({ name: 'Drums' });
   * const [kick, snare] = await session.newTrack({ name: 'Drum', count: 2, makeNameUnique: true, folderUid: drums.id });
   *
   * @example
   * // A folder that only groups, inside another folder.
   * const perc = await session.newFolder({ name: 'Perc', mode: 'container', folderUid: drums.id });
   */
  async newFolder(options: NewFolderOptions = {}): Promise<Bus> {
    const mode = options.mode ?? 'summing';
    if (mode !== 'summing' && mode !== 'container') throw new UAError('out_of_range', `newFolder(): unknown mode ${String(mode)}`, { path: `${this.path}/new_track` });
    const payload: Record<string, unknown> = { uid: this.uid, name: options.name ?? 'Folder', track_type: 'bus', stem_format: options.stemFormat ?? 'stereo', folder_mode: mode };
    if (options.folderUid !== undefined) payload['folder_uid'] = options.folderUid;
    const bus = await this.createBus(payload, 'new folder');
    // `folder_mode` is set after the bus row is made (fact 136), and its push can reach the
    // new member before the member's own read does, so wait for both.
    await settle(() => bus.name.value !== undefined && bus.folderMode.value === mode && (options.folderUid === undefined || bus.folderUid.value === options.folderUid), 'new folder', {
      path: bus.path,
      refresh: () => this.client.store.load(bus.path, { children: false, commands: false, flatvalue: true }),
      flush: () => this.client.store.scheduler.flush(),
    });
    return bus;
  }

  /**
   * The folder tracks, in no particular order: the buses whose folder mode is not `'none'`.
   * Use {@link folderContents} for the hierarchy.
   *
   * @example
   * for (const folder of session.folders) console.log(folder.name.value, folder.folderMode.value);
   */
  get folders(): Bus[] {
    return this.buses.items.filter((b) => b.isFolder);
  }

  /**
   * The tracks and buses directly inside `folder`, or at the session root for `null`, sorted
   * by their `order`. Their own `folderUid` names the folder. At the root this includes
   * LUNA's system tracks and buses (click, count-in, master, cues).
   *
   * @example
   * const walk = (folder, depth = 0) => {
   *   for (const ch of session.folderContents(folder)) {
   *     console.log('  '.repeat(depth) + ch.name.value);
   *     if (ch instanceof Luna.Bus && ch.isFolder) walk(ch, depth + 1);
   *   }
   * };
   * walk(null);
   */
  folderContents(folder: Bus | string | null): Array<Track | Bus> {
    const id = folder === null ? null : typeof folder === 'string' ? folder : folder.id;
    const inside = (c: Track | Bus) => (c.folderUid.value ?? null) === id;
    return [...this.tracks.items.filter(inside), ...this.buses.items.filter(inside)].sort((a, b) => (a.order.value ?? 0) - (b.order.value ?? 0));
  }

  /**
   * Move tracks and buses (folders too, with everything inside them) into `folder`, or to
   * the session root with `null`, in one undo step (LUNA's `move_to_folder`, fact 136), and
   * resolve once each one's {@link Channel.folderUid} shows it. They go first in the folder, or
   * after `options.after` (fact 137); {@link reorder} moves them within it. LUNA reroutes the main output
   * of everything moved to the nearest summing folder it is now in, else the master.
   *
   * @throws {UAError} `uasrv.invalid_value` when `folder` is not a folder, or would end up
   * inside itself.
   * @example
   * const vocals = await session.newFolder({ name: 'Vocals' });
   * await session.moveToFolder([lead, harmony], vocals);
   * await session.moveToFolder([harmony], null); // back to the root
   */
  async moveToFolder(items: ReadonlyArray<Channel | string>, folder: Bus | string | null, options: MoveToFolderOptions = {}): Promise<void> {
    const ids = items.map((i) => (typeof i === 'string' ? i : i.id));
    if (ids.length === 0) return;
    const folderUid = folder === null ? null : typeof folder === 'string' ? folder : folder.id;
    const anchor = options.after === undefined || options.after === null ? null : typeof options.after === 'string' ? options.after : options.after.id;
    const payload: Record<string, unknown> = { session_uid: this.uid, after_uids: ids };
    if (folderUid) payload['folder_uid'] = folderUid;
    if (anchor !== null) payload['before_uid'] = anchor;
    // LUNA re-parents only the items with no moved folder above them; the rest ride along
    // inside their folder (fact 136). Plan the order it will write from that (fact 137).
    const parentOf = new Map(this.channelsInOrder.map((c) => [c.id, c.folderUid.value ?? null] as const));
    const topLevel = ids.filter((id) => {
      for (let f = parentOf.get(id) ?? null; f; f = parentOf.get(f) ?? null) if (ids.includes(f)) return false;
      return true;
    });
    const known = topLevel.every((id) => parentOf.has(id)) && (anchor === null || parentOf.has(anchor));
    const rows = this.channelsInOrder.map((c) => ({ id: c.id, folderUid: topLevel.includes(c.id) ? folderUid : (c.folderUid.value ?? null) }));
    const expected = plannedOrder(rows, topLevel, anchor).join();
    await this.post('tracks/move_to_folder', payload);
    // A batch transaction holds the change back until its commit.
    if (this.openTransaction === 'batch') return;
    const channels = () => topLevel.map((id) => this.tracks.byId(id) ?? this.buses.byId(id));
    const placed = () => channels().every((c) => c === undefined || (c.folderUid.value ?? null) === folderUid);
    // An item this session does not list yet can only be checked by its folder.
    await settle(() => placed() && (!known || this.channelsInOrder.map((c) => c.id).join() === expected), 'move to folder', {
      path: `${this.path}/tracks`,
      refresh: () => Promise.all([this.tracks.reload(), this.buses.reload()]).then(() => undefined),
      flush: () => this.client.store.scheduler.flush(),
    });
  }

  /**
   * Move tracks and buses to just after `after`, or first, in one undo step (LUNA's
   * `change_order`, fact 137), and resolve once {@link channelsInOrder} shows the new order.
   * The items keep their order among themselves as given, and a folder moves with everything
   * inside it.
   *
   * Nothing changes folder: LUNA keeps each folder's contents together right after it, so an
   * anchor inside another folder only decides where the item lands among its own siblings.
   * Use {@link moveToFolder} to change folder. LUNA answers the same whether or not anything
   * moved, so an id this session does not list rejects here rather than doing nothing.
   *
   * @throws {UAError} `out_of_range` for a track or bus (or anchor) the session does not list.
   * @example
   * // Put the bass just after the drums, then the vocal first.
   * await session.reorder([bass], { after: drums });
   * await session.reorder([vocal]);
   */
  async reorder(items: ReadonlyArray<Channel | string>, options: ReorderOptions = {}): Promise<void> {
    const ids = items.map((i) => (typeof i === 'string' ? i : i.id));
    if (ids.length === 0) return;
    const anchor = options.after === undefined || options.after === null ? null : typeof options.after === 'string' ? options.after : options.after.id;
    const listed = (id: string) => this.tracks.byId(id) !== undefined || this.buses.byId(id) !== undefined;
    for (const id of anchor === null ? ids : [...ids, anchor]) {
      if (!listed(id)) throw new UAError('out_of_range', `reorder(): no track or bus ${id} in this session`, { path: `${this.path}/tracks/change_order` });
    }
    const current = () => this.channelsInOrder.map((c) => ({ id: c.id, folderUid: c.folderUid.value ?? null }));
    const expected = plannedOrder(current(), ids, anchor).join();
    const payload: Record<string, unknown> = { session_uid: this.uid, after_uids: ids };
    if (anchor !== null) payload['before_uid'] = anchor; // LUNA's name for the item to follow
    await this.post('tracks/change_order', payload);
    if (this.openTransaction === 'batch') return;
    await settle(() => current().map((r) => r.id).join() === expected, 'reorder', {
      path: `${this.path}/tracks`,
      refresh: () => Promise.all([this.tracks.reload(), this.buses.reload()]).then(() => undefined),
      flush: () => this.client.store.scheduler.flush(),
    });
  }

  /**
   * Make a track from a preset in one undo step (fact 132), as LUNA's New Track From Preset
   * does, and resolve to the new tracks once they are listed in {@link tracks} with their
   * properties loaded. The preset is a row from {@link Presets.trackSelection} or
   * `luna.presets.query({ deviceTypeId: 'track', includeInstrumentPresets: true })`:
   *
   * - a track preset makes its tracks with its plugins and settings: one named `name`, or
   *   for a multi-track preset several, keeping the names saved in it; a master bus preset
   *   loads onto the master bus and makes none, so `[]`;
   * - an instrument plugin's preset makes a stereo instrument track with the plugin on it,
   *   on that preset; an effect plugin's preset an audio track with the plugin.
   *
   * LUNA selects the new tracks. Rejects with `device.database_error` for an unknown preset.
   *
   * @example
   * const sel = luna.presets.trackSelection({ category: 'Instrument' });
   * await sel.ready();
   * const [track] = await session.newTrackFromPreset(sel.presets.items[0]);
   * track.name.value; // the preset's name
   */
  async newTrackFromPreset(preset: Pick<PresetRow, 'uid' | 'name'>, options: NewTrackFromPresetOptions = {}): Promise<Track[]> {
    const payload: Record<string, unknown> = { uid: this.uid, name: options.name ?? preset.name, preset_uid: preset.uid, count: 1, make_name_unique: options.makeNameUnique ?? true };
    if (options.beforeUid !== undefined) payload['before_uid'] = options.beforeUid;
    if (options.folderUid !== undefined) payload['folder_uid'] = options.folderUid;
    if (options.stemFormat !== undefined) payload['stem_format'] = options.stemFormat;
    // One track answers `{ uid }`, several an array of them, none (a master bus preset) nothing.
    const uids = replyUids(await this.post('new_track', payload));
    if (uids.length === 0) return [];
    return this.resolveTracks(uids);
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
   * Called while a transaction is already open, `fn` runs inside that one: wrappers that batch
   * their own steps (`Output.retarget`) then join the caller's undo entry instead of nesting.
   *
   * A batch (the default) holds LUNA's pushes until the commit, so the model shows the edits
   * only once this resolves. With `continuous`, every command replaces the one before it
   * (see {@link TransactionOptions.continuous}).
   *
   * @example
   * await session.transaction('Rename all', async () => {
   *   for (const t of session.tracks.items) await t.name.set(`${t.name.value} (mix)`);
   * });
   *
   * @example
   * // Rewrite a clip's notes as one undo step: delete the old ones, write the new ones.
   * await session.transaction('Humanize', async () => {
   *   const old = clip.midi.notes.items;
   *   await clip.midi.deleteNotes(old);
   *   await clip.addNotes(old.map((n) => ({ pitch: n.pitch, tick: Math.max(0, n.startTick + Math.round((Math.random() - 0.5) * 40)), lengthTicks: n.stopTick! - n.startTick, velocity: n.velocity })));
   * });
   * await clip.midi.refresh();
   */
  async transaction<T>(name: string, fn: () => Promise<T>, options: TransactionOptions = {}): Promise<T> {
    if (this.openTransaction) return fn();
    const continuous = options.continuous ?? false;
    // Without sends_undo_notifications, the undo that replaces each continuous step is silent:
    // rows it deletes stay in LUNA's served tables, for every client (fact 115).
    const payload: Record<string, unknown> = { session_uid: this.uid, name, is_continuous: continuous };
    if (continuous) payload['sends_undo_notifications'] = true;
    await this.post('begin_transaction', payload);
    this.openTransaction = continuous ? 'continuous' : 'batch';
    try {
      const result = await fn();
      this.openTransaction = undefined;
      await this.post('commit_transaction', { session_uid: this.uid });
      return result;
    } catch (err) {
      this.openTransaction = undefined;
      await this.post('abort_transaction', { session_uid: this.uid }).catch(() => undefined);
      throw err;
    }
  }

  /** True while a {@link transaction} is open, of either kind. */
  get batching(): boolean {
    return this.openTransaction !== undefined;
  }

  /** The kind of {@link transaction} open now, or `undefined` outside one. */
  get transactionMode(): TransactionMode | undefined {
    return this.openTransaction;
  }

  /**
   * Insert a clip onto a track's active playlist, or onto a given playlist, in one undo step,
   * and resolve to the new {@link Clip} once its playlist lists it with its properties
   * loaded. LUNA answers the clip's uid. Timeline position is in ticks; source offsets are
   * nanoseconds (fact 16).
   *
   * `sourceUid` is required for every clip type, MIDI included: LUNA answers
   * `uasrv.invalid_property` without one (fact 112). To start a MIDI clip of your own, write
   * its notes with {@link Playlist.createNotes}, which makes the clip. With `copyOf` the new
   * clip is a copy of another (its gain, fades, warps and MIDI), and the source, its offsets
   * and the name default to that clip's (fact 135).
   *
   * Inside a batch {@link transaction} this resolves at once to the clip with its `id` set
   * and its props `undefined` until the commit, as {@link newTrack} does.
   *
   * @example
   * const clip = await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: Luna.WHOLE_NOTE });
   * clip.start.value; // 0
   *
   * @example
   * // Repeat a slice four bars later, in front of what is there.
   * const again = await session.insertClip({ playlistUid: lane.id, copyOf: slice, startTick: slice.start.value! + 4 * Luna.WHOLE_NOTE, stopTick: slice.stop.value! + 4 * Luna.WHOLE_NOTE });
   */
  async insertClip(options: InsertClipOptions): Promise<Clip> {
    const copy = options.copyOf;
    const sourceUid = options.sourceUid ?? copy?.sourceUid.value;
    const payload: Record<string, unknown> = { session_uid: this.uid, source_uid: sourceUid ?? '', start: options.startTick, stop: options.stopTick };
    if (options.trackUid !== undefined) payload['track_uid'] = options.trackUid;
    if (options.playlistUid !== undefined) payload['playlist_uid'] = options.playlistUid;
    // LUNA's copy overwrites these with what the call sends, 0 or '' when left out (fact 135).
    const sourceStart = options.sourceStartNs ?? copy?.sourceStart.value;
    const sourceStop = options.sourceStopNs ?? copy?.sourceStop.value;
    const name = options.name ?? copy?.name.value;
    if (sourceStart !== undefined) payload['source_start'] = sourceStart;
    if (sourceStop !== undefined) payload['source_stop'] = sourceStop;
    if (name !== undefined) payload['name'] = name;
    if (options.clipType !== undefined) payload['clip_type'] = { audio: 0, video: 1, midi: 2 }[options.clipType];
    if (options.layer !== undefined) payload['layer'] = options.layer;
    if (options.lengthFollows !== undefined) payload['length_follows'] = options.lengthFollows;
    if (options.algType !== undefined) payload['alg_type'] = options.algType;
    if (copy) payload['clip_uid'] = copy.id;
    const [uid] = replyUids(await this.post('insert_clip', payload));
    if (!uid) throw new UAError('invalid_response', 'insert_clip answered without a clip uid', { path: `${this.path}/insert_clip` });

    // The playlist: given, the track's active one, or (a track made in this same batch) LUNA's
    // record of the clip, which reads the session database the batch writes to (fact 135).
    let playlistUid = options.playlistUid ?? (options.trackUid !== undefined ? this.tracks.byId(options.trackUid)?.playlistUid.value : undefined);
    if (!playlistUid) {
      const info = (await this.post('get_clip_info', { session_uid: this.uid, clip_uid: uid })) as { playlist_uid?: unknown } | null;
      if (typeof info?.playlist_uid === 'string' && info.playlist_uid) playlistUid = info.playlist_uid;
    }
    if (!playlistUid) throw new UAError('invalid_response', `insert_clip made ${uid}, but its playlist is not known`, { path: `${this.path}/insert_clip` });
    const clips = this.playlists.member(playlistUid).clips;
    if (this.openTransaction === 'batch') return clips.member(uid);
    await clips.load();
    await settle(() => clips.byId(uid) !== undefined, 'insert clip', {
      path: `${this.path}/playlists/${playlistUid}/clips`,
      refresh: () => clips.reload(),
      flush: () => this.client.store.scheduler.flush(),
    });
    await clips.membersReady();
    await this.client.settled();
    return clips.byId(uid)!;
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
   *
   * `playlists` moves them to other tracks: each entry takes the clips of `from` (a playlist
   * or its uid) to `to`. It replaces `trackUids`, which LUNA then ignores (fact 174).
   * `moveAutomation` carries the tracks' automation in the range along; left out, LUNA follows
   * the context's own "automation follows edit" setting.
   *
   * @example
   * // Move bar 1 of the vocal to the double track, at the same time.
   * await session.moveClips(0, {
   *   startTick: 0,
   *   stopTick: Luna.WHOLE_NOTE,
   *   playlists: [{ from: session.playlistFor(vocal)!, to: session.playlistFor(double)! }],
   * });
   */
  moveClips(
    toTick: number,
    options: {
      startTick?: number;
      stopTick?: number;
      trackUids?: string[];
      copy?: boolean;
      contextType?: string;
      playlists?: ReadonlyArray<{ from: Playlist | string; to: Playlist | string }>;
      moveAutomation?: boolean;
    } = {},
  ): Promise<unknown> {
    const payload: Record<string, unknown> = { session_uid: this.uid, context_type: options.contextType ?? 'main', location: toTick };
    if (options.startTick !== undefined) payload['start'] = options.startTick;
    if (options.stopTick !== undefined) payload['stop'] = options.stopTick;
    if (options.trackUids !== undefined) payload['track_uid'] = options.trackUids;
    if (options.copy !== undefined) payload['copy'] = options.copy;
    if (options.moveAutomation !== undefined) payload['move_automation'] = options.moveAutomation;
    if (options.playlists !== undefined && options.playlists.length > 0) {
      const uidOf = (p: Playlist | string) => (typeof p === 'string' ? p : p.id);
      payload['playlists'] = options.playlists.map((e) => ({ source_playlist: uidOf(e.from), destination_playlist: uidOf(e.to) }));
    }
    return this.post('move_clips', payload);
  }

  /**
   * Delete playlist versions in one undo step (`delete_playlists`), and resolve once they
   * have left {@link playlists} (fact 170). A version a track is using can be deleted when
   * the track has another: the track switches to the version before it (after it, for the
   * first). LUNA also applies it to the tracks edit-grouped with them. Deleting nothing
   * deletable (a track's only version) rejects with `uasrv.invalid_value`.
   *
   * @example
   * const old = session.playlists.items.filter((p) => p.trackUid.value === track.id && p.id !== track.playlistUid.value);
   * await session.deletePlaylists(old);
   */
  async deletePlaylists(playlists: ReadonlyArray<Playlist | string>): Promise<void> {
    const uids = playlists.map((p) => (typeof p === 'string' ? p : p.id));
    if (!uids.length) throw new UAError('out_of_range', 'deletePlaylists(): give at least one playlist');
    await this.playlists.load();
    await this.post('delete_playlists', { session_uid: this.uid, context_type: 'main', playlist_uid: uids });
    await this.settlePlaylistsGone(uids, 'delete playlists');
  }

  /**
   * Delete every playlist version the given tracks are not using, keeping the one each plays
   * (`delete_playlists` with `delete_unused`, which lists the versions to keep, fact 170).
   * Resolves once they have left {@link playlists}.
   *
   * @example
   * await session.deleteUnusedPlaylists([vocal, double]);
   */
  async deleteUnusedPlaylists(tracks: ReadonlyArray<Track | string>): Promise<void> {
    await this.playlists.load();
    await this.playlists.membersReady();
    const ids = tracks.map((t) => (typeof t === 'string' ? t : t.id));
    const keep = ids.map((id) => this.tracks.byId(id)?.playlistUid.value).filter((u): u is string => typeof u === 'string' && u !== '');
    if (keep.length !== ids.length) throw new UAError('out_of_range', 'deleteUnusedPlaylists(): give tracks of this session');
    const doomed = this.playlists.items.filter((p) => ids.includes(p.trackUid.value ?? '') && !keep.includes(p.id)).map((p) => p.id);
    if (!doomed.length) return;
    await this.post('delete_playlists', { session_uid: this.uid, context_type: 'main', playlist_uid: keep, delete_unused: true });
    await this.settlePlaylistsGone(doomed, 'delete unused playlists');
  }

  private async settlePlaylistsGone(uids: readonly string[], what: string): Promise<void> {
    await settle(() => uids.every((u) => this.playlists.byId(u) === undefined), what, {
      path: `${this.path}/playlists`,
      refresh: () => this.playlists.reload(),
      flush: () => this.client.store.scheduler.flush(),
    });
  }

  /**
   * Make one audio track per device input, each recording from its input, in one undo step,
   * as LUNA's "create tracks from inputs" does (`new_tracks_from_inputs`, fact 172), and
   * resolve to the new tracks once listed and loaded. Each is named after its input (made
   * unique) and takes the input's stem format unless `stemFormat` says otherwise.
   * `recordEnable` arms them; `autoGain` starts Auto Gain on those that support it.
   *
   * Inputs LUNA does not make tracks for (talkback, monitor, loopback) are skipped. Because
   * LUNA never answers a request with an unknown input or with none left, the SDK refuses
   * those first: `unknown_input` for an input not in `luna.audioInputs()`, `no_inputs` when
   * nothing is left.
   *
   * @example
   * const inputs = await luna.audioInputs();
   * const tracks = await session.newTracksFromInputs({ inputUids: inputs.slice(0, 2).map((i) => i.uid), recordEnable: true });
   */
  async newTracksFromInputs(options: { inputUids: readonly string[]; recordEnable?: boolean; autoGain?: boolean; stemFormat?: 'mono' | 'stereo' }): Promise<Track[]> {
    const known = await this.client.audioInputs();
    for (const uid of options.inputUids) {
      if (!known.some((i) => i.uid === uid)) throw new UAError('unknown_input', `newTracksFromInputs(): no input ${uid}`, { path: `${this.path}/new_tracks_from_inputs` });
    }
    if (!options.inputUids.some((uid) => autoCreatesTrack(known.find((i) => i.uid === uid)!.name))) {
      throw new UAError('no_inputs', 'newTracksFromInputs(): LUNA makes no track for these inputs', { path: `${this.path}/new_tracks_from_inputs` });
    }
    const payload: Record<string, unknown> = { session_uid: this.uid, input_uids: [...options.inputUids] };
    if (options.recordEnable !== undefined) payload['record_enable'] = options.recordEnable;
    if (options.autoGain !== undefined) payload['auto_gain'] = options.autoGain;
    if (options.stemFormat !== undefined) payload['stem_format'] = options.stemFormat;
    const reply = (await this.post('new_tracks_from_inputs', payload)) as { new_tracks?: unknown } | null;
    const uids = Array.isArray(reply?.new_tracks) ? reply.new_tracks.filter((u): u is string => typeof u === 'string') : [];
    return uids.length ? this.resolveTracks(uids) : [];
  }

  /**
   * Set the shape and/or curvature of fades, given as `seg.fadeIn.value` / `seg.fadeOut.value`
   * from {@link Playlist.compiledClips} (pass both halves of a crossfade). LUNA's
   * `change_fade_curvature`, one undo step; it also reaches the matching fades of tracks in the
   * same edit group. `curvature` is -1 to 1, 0 being the shape's own curve; `reset` puts back
   * `log` with curvature 0 (fact 117).
   *
   * @example
   * const seg = lane.compiledClips.ofClip(clip.id)[0];
   * await session.setFadeCurve([seg.fadeIn.value], { shape: 'equal_power', curvature: 0.3 });
   */
  async setFadeCurve(fades: ReadonlyArray<{ readonly uid: string } | undefined>, options: { shape?: FadeShape; curvature?: number; reset?: boolean }): Promise<void> {
    const uids = fades.map((f) => f?.uid).filter((u): u is string => typeof u === 'string' && u.length > 0);
    if (!uids.length) throw new UAError('out_of_range', 'setFadeCurve(): give at least one fade');
    const shape = requireFadeShape(options.shape, 'setFadeCurve()');
    const payload: Record<string, unknown> = { session_uid: this.uid, fades: uids };
    if (options.reset) payload['default'] = true;
    if (shape) payload['fade_shape'] = shape;
    if (options.curvature !== undefined) {
      if (!Number.isFinite(options.curvature) || options.curvature < -1 || options.curvature > 1) throw new UAError('out_of_range', 'setFadeCurve(): curvature must be between -1 and 1');
      // LUNA moves every fade by (curvature - initial[0]) from its own initial value; equal
      // initial values make that an absolute setting for all of them.
      payload['fade_curvature'] = options.curvature;
      payload['initial_curvature_values'] = uids.map(() => 0);
    }
    if (!options.reset && !shape && options.curvature === undefined) throw new UAError('out_of_range', 'setFadeCurve(): give shape, curvature or reset');
    await this.wire.post(`${this.path}/contexts/main/commands/change_fade_curvature`, payload);
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
   * This is the **File route**, and the one that works everywhere: in LUNA and in a browser,
   * with no `/gui`. Get the `File` from `<input type="file">` or an HTML
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
   * engine on the same machine. A path the engine cannot open rejects
   * with LUNA's `device.database_error`. For a browser `File`, use {@link uploadFile}.
   *
   * With `type: 'midi'` or `'video'` the file is copied into the package's `midi` or
   * `video` folder instead, and the call resolves to an {@link ImportedFile} as soon as LUNA
   * answers (fact 163). Nothing plays it yet: LUNA's own import (`importFile`) also makes the
   * track and clip.
   *
   * @example
   * const [path] = await luna.gui.chooseFiles({ filters: ['*.wav'] });
   * if (path) {
   *   const source = await session.importPath(path);
   *   await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT });
   * }
   * const midi = await session.importPath('/Users/me/groove.mid', { type: 'midi' });   // { uid, type: 'midi', name }
   */
  importPath(path: string, options?: ImportPathOptions & { type?: 'audio' }): Promise<AudioSource>;
  importPath(path: string, options: ImportPathOptions & { type: 'midi' | 'video' }): Promise<ImportedFile>;
  async importPath(path: string, options: ImportPathOptions = {}): Promise<AudioSource | ImportedFile> {
    const type = options.type ?? 'audio';
    if (type !== 'audio' && type !== 'midi' && type !== 'video') throw new UAError('out_of_range', `importPath(): type must be 'audio', 'midi' or 'video'`, { path: this.path });
    await this.ready();
    const sources = this.sources;
    if (!sources) throw new UAError('unavailable', 'importPath(): the session package uid is not known yet', { path: this.path });
    const name = options.name ?? path.slice(Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) + 1);
    if (!name) throw new UAError('out_of_range', `importPath(): no file name in ${JSON.stringify(path)}`, { path: this.path });
    const reply = (await this.wire.post('/workspace/import_file', {
      session_package_uid: this.sessionPackageUid.value,
      type,
      import_id: Math.floor(Math.random() * 0x7fffffff),
      phase: 'local_copy',
      path,
      name,
    })) as { uid?: unknown } | null;
    const uid = reply?.uid;
    if (typeof uid !== 'string') throw new UAError('invalid_response', 'importPath(): import_file local_copy answered without a uid', { path: '/workspace/import_file' });
    if (type !== 'audio') return { uid, type, name };
    return this.listedSource(uid, options.timeoutMs ?? 30_000);
  }

  /**
   * LUNA's own import: the File > Import action. Imports an audio, MIDI or video file at
   * the selection start, onto `trackUid` or a new track, making a clip as LUNA does.
   *
   * A **path route** command run by LUNA's UI, so it needs `/gui`: without it (a headless
   * engine) it rejects with `Luna.Unsupported` (fact 103). To add a source without a
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
    this.lyrics.dispose();
    this.groups.dispose();
    this.storage.dispose();
    this.contexts.dispose();
    this.recordTakes.dispose();
    this.sourcesCollection?.dispose();
    this.sourcesRelease?.();
    this.sourcesRelease = undefined;
    this.packageNode?.dispose();
    this.packageNode = undefined;
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
/**
 * Whether LUNA makes a track for a device input of this name in `new_tracks_from_inputs`: not
 * for talkback, monitor or loopback inputs (fact 172).
 */
function autoCreatesTrack(name: string): boolean {
  const lower = name.toLowerCase();
  return lower !== '' && lower !== 'mon' && !['talkback', 'monitor', 'mon ', 'loopback'].some((f) => lower.includes(f));
}

function newUid(): string {
  return globalThis.crypto.randomUUID().replaceAll('-', '');
}

/** The uids in a reply of `{ uid }` or `[{ uid }, ...]` (`new_track`, `insert_clip`). */
function replyUids(reply: unknown): string[] {
  const rows = Array.isArray(reply) ? reply : reply ? [reply] : [];
  return rows.map((r) => (r as { uid?: unknown } | null)?.uid).filter((u): u is string => typeof u === 'string' && u !== '');
}
