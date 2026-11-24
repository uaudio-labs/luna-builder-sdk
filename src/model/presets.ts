/**
 * The preset library: the `/presets` node's `query` command over the workspace database
 * (fact 98). Presets are addressed by uid; `find` turns a plugin id and a preset name
 * into that uid so it can be passed to {@link Effect.setPlugin} or {@link Effect.loadPreset}.
 *
 * Preset selection, as LUNA's own plugin pages offer it, is three things over one plugin's
 * presets: search text that filters by name, tags picked from the plugin's tag groups, and
 * recommendations that UA Assistant ranks from the same search text (facts 120-121).
 * {@link Presets.selection} keeps all three current for a page.
 *
 * @example
 * const preset = await luna.presets.find('uaudio_qi', '4-Band EQ');
 * await slot.setPlugin('uaudio_qi', { presetName: preset?.name, presetUid: preset?.uid });
 */
import type { Client } from '../client/client';
import { Cell, derived, listOf, writable, type List, type Prop, type WritableProp } from '../store/prop';
import { UAError } from '../wire/errors';
import type { Unsubscribe } from '../wire/port';
import { Node } from './node';

export interface PresetRow {
  uid: string;
  name: string;
  version: number;
  favorite: boolean;
  factory: boolean;
  path: string;
  /** The preset's tags. Present only when the query asked for them (`withTags`). */
  tags?: string[];
  /**
   * True for an instrument plugin's preset listed among track presets, false for a track
   * preset. Present only when the query asked for them (`includeInstrumentPresets`, fact 132).
   */
  isInstrumentPreset?: boolean;
  /**
   * For an instrument preset, the plugin it belongs to: the instrument whose factory or user
   * preset folder holds it (fact 132). Absent when no installed instrument's folder does.
   */
  pluginId?: string;
  /** That plugin's name, for example `Moog Minimoog Synth`. */
  pluginName?: string;
  /**
   * The preset's description, `''` when it has none. Present only when the query asked for
   * it (`withDescriptions`, fact 175).
   */
  description?: string;
}

/** One plugin a track preset uses, from {@link Presets.trackPresetPlugins}. */
export interface TrackPresetPlugin {
  pluginId: string;
  /** The name the preset saved, which may differ from the installed plugin's. */
  name: string;
}

export interface PresetQueryOptions {
  /** The plugin whose presets to list. One of `pluginId` or `deviceTypeId` is required. */
  pluginId?: string;
  /** A device type (for example `track`) instead of a plugin. */
  deviceTypeId?: string;
  /** Case-insensitive substring to match against preset names. */
  search?: string;
  /** Only presets carrying these tags: all of them, or any with `matchAnyTag` (fact 120). */
  tags?: string | readonly string[];
  /** With several `tags`, match presets carrying any of them rather than all. */
  matchAnyTag?: boolean;
  /** Include each preset's tags in the rows. */
  withTags?: boolean;
  /** Include each preset's `description`: one more read per plugin or device type listed (fact 175). */
  withDescriptions?: boolean;
  /** Only favorites. */
  favorite?: boolean;
  /** Maximum number of rows. */
  limit?: number;
  /**
   * With `deviceTypeId: 'track'`, also list the presets of every installed instrument plugin,
   * marked `isInstrumentPreset`. An `Instrument` tag then selects instrument track presets and
   * every instrument preset; the other tags must match either kind (fact 132).
   */
  includeInstrumentPresets?: boolean;
}

/**
 * The categories LUNA's track preset browser offers. They are ordinary preset tags, which
 * LUNA writes when a track preset is saved (fact 132). No category means all of them.
 */
export const TRACK_PRESET_CATEGORIES = ['Audio', 'Instrument', 'Bus', 'Multi-Track'] as const;
export type TrackPresetCategory = (typeof TRACK_PRESET_CATEGORIES)[number];

/** How long a read of one instrument plugin's preset details may take before it is left out. */
const TAG_GROUP_WAIT_MS = 3000;

/** Tags LUNA's track preset browser keeps out of its tag groups: the categories and `All`. */
const HIDDEN_TRACK_TAGS = new Set<string>([...TRACK_PRESET_CATEGORIES, 'All']);

/**
 * A named group of a plugin's preset tags, for example Paradise's `TYPE`, `GENRE` and
 * `DESCRIPTION`. LUNA keeps them as categories holding sub-categories holding tags (fact 120);
 * a group is one sub-category.
 */
export interface PresetTagGroup {
  /** The sub-category uid. */
  uid: string;
  /** The sub-category name, for example `GENRE`. */
  name: string;
  /** The category it sits in, for example `Default`. */
  category: string;
  categoryUid: string;
  /** Tags in LUNA's order. */
  tags: string[];
}

/** One preset UA Assistant recommends for a search, best first (fact 121). */
export interface PresetRecommendation {
  uid: string;
  name: string;
  /** The assistant's reciprocal-rank-fusion score, which orders the answer; higher is better. Compare within one answer only. */
  score: number;
  /** The keyword half of the hybrid search, when the assistant reports it. */
  keywordScore?: number;
  /** The semantic half of the hybrid search, when the assistant reports it; -1 when the preset was found by keyword alone. */
  semanticScore?: number;
}

export class Presets extends Node {
  private instrumentList: Promise<InstrumentSource[]> | undefined;

  /** @internal */
  constructor(client: Client) {
    super(client, '/presets');
  }

  /**
   * Query the preset database (fact 98). Columnar on the wire; rows here. Search and tags
   * combine: a row must match both (fact 120).
   *
   * @example
   * const rows = await luna.presets.query({ pluginId: 'uaudio_qi', search: 'EQ' });
   * rows[0]?.uid; rows[0]?.name; rows[0]?.factory;
   * const clean = await luna.presets.query({ pluginId, tags: ['Clean', 'Jazz'], withTags: true });
   * clean[0]?.tags; // ['Clean', 'Jazz', ...]
   */
  async query(options: PresetQueryOptions = {}): Promise<PresetRow[]> {
    const payload: Record<string, unknown> = {};
    if (options.pluginId !== undefined) payload['plugin_id'] = options.pluginId;
    if (options.deviceTypeId !== undefined) payload['device_type_id'] = options.deviceTypeId;
    if (options.search !== undefined) payload['search'] = options.search;
    if (options.tags !== undefined) payload['tag'] = typeof options.tags === 'string' ? options.tags : [...options.tags];
    if (options.matchAnyTag !== undefined) payload['union'] = options.matchAnyTag;
    if (options.withTags) payload['tags'] = true;
    if (options.favorite !== undefined) payload['favorite'] = options.favorite;
    if (options.limit !== undefined) payload['limit'] = options.limit;
    if (options.includeInstrumentPresets !== undefined) payload['include_instrument_presets'] = options.includeInstrumentPresets;
    const reply = (await this.post('query', payload)) as { results?: Record<string, unknown[]> & { num_rows?: number } } | null;
    const rows = rowsFrom(reply?.results);
    if (rows.some((r) => r.isInstrumentPreset)) await this.namePlugins(rows);
    if (options.withDescriptions && rows.length) await this.describeRows(rows, options);
    return rows;
  }

  /**
   * Fill each row's `description` from its preset node (fact 175): the query does not
   * return it, so read each owner's `presets` folder once, description only.
   */
  private async describeRows(rows: PresetRow[], options: PresetQueryOptions): Promise<void> {
    const owners = new Map<string, PresetRow[]>();
    for (const row of rows) {
      const owner = presetOwner(row, options.pluginId, options.deviceTypeId);
      owners.set(owner, [...(owners.get(owner) ?? []), row]);
    }
    await Promise.all(
      [...owners].map(async ([owner, list]) => {
        const reply = (await this.wire.get(`${owner}/presets`, { children: true, levels: 2, properties: true, commands: false, flatvalue: true, propfilter: ['description'] })) as TreeNode | null;
        const byUid = new Map<string, unknown>();
        for (const child of reply?.children ?? []) if (child.path) byUid.set(child.path.slice(child.path.lastIndexOf('/') + 1), child.properties?.['description']);
        for (const row of list) {
          const text = byUid.get(row.uid);
          row.description = typeof text === 'string' ? text : '';
        }
      }),
    );
  }

  /**
   * Mark a preset a favorite, or not (fact 175): a write of its `favorite`, which LUNA keeps
   * per owner. A plugin's preset is under its plugin: pass `pluginId` (the one you queried
   * with), or a row that carries one (an instrument preset in a track query). Anything else is
   * taken as a track preset. A row passed in has its `favorite` updated once LUNA accepts.
   *
   * @example
   * const [row] = await luna.presets.query({ pluginId: 'uaudio_qi', search: 'Vocal' });
   * await luna.presets.setFavorite(row, true, { pluginId: 'uaudio_qi' });
   * const [track] = await luna.presets.query({ deviceTypeId: 'track', search: 'Bass Rig' });
   * await luna.presets.setFavorite(track, true);
   */
  async setFavorite(preset: string | (Pick<PresetRow, 'uid'> & Partial<Pick<PresetRow, 'pluginId' | 'favorite'>>), favorite: boolean, options: { pluginId?: string; deviceTypeId?: string } = {}): Promise<void> {
    const row: Pick<PresetRow, 'uid' | 'pluginId'> = typeof preset === 'string' ? { uid: preset } : preset;
    const owner = presetOwner(row, options.pluginId, options.deviceTypeId);
    await this.wire.set(`${owner}/presets/${row.uid}/favorite`, favorite);
    if (typeof preset !== 'string') preset.favorite = favorite;
  }

  /**
   * The plugins a track preset uses, as LUNA's preset browser checks them before applying
   * one (fact 176): read from the preset's package, `/workspace/sessions/<uid>`. Resolves to
   * `undefined` when LUNA reports no list (not a track preset, or an older LUNA): that means
   * unknown, not "no plugins".
   *
   * @example
   * const needs = await luna.presets.trackPresetPlugins(row);
   * const missing = needs?.filter((p) => !luna.plugins.byId(p.pluginId)?.installed.value) ?? [];
   */
  async trackPresetPlugins(preset: string | Pick<PresetRow, 'uid'>): Promise<TrackPresetPlugin[] | undefined> {
    const uid = typeof preset === 'string' ? preset : preset.uid;
    const reply = (await this.wire.get(`/workspace/sessions/${uid}`, { properties: true, children: false, commands: false, flatvalue: true, propfilter: ['plugins'] })) as TreeNode | null;
    let raw = reply?.properties?.['plugins'];
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw) as unknown;
      } catch {
        return undefined;
      }
    }
    if (!Array.isArray(raw)) return undefined;
    return raw
      .filter((e): e is { plugin_id: string; name?: unknown } => typeof (e as { plugin_id?: unknown } | null)?.plugin_id === 'string' && (e as { plugin_id: string }).plugin_id !== '')
      .map((e) => ({ pluginId: e.plugin_id, name: typeof e.name === 'string' ? e.name : '' }));
  }

  /** Give each instrument preset its plugin, by the preset folder that holds it (fact 132). */
  private async namePlugins(rows: PresetRow[]): Promise<void> {
    const sources = await this.instruments();
    for (const row of rows) {
      if (!row.isInstrumentPreset) continue;
      let best: { source: InstrumentSource; length: number } | undefined;
      for (const source of sources) {
        for (const root of source.roots) {
          const inside = row.path === root || row.path.startsWith(`${root}/`);
          if (inside && root.length > (best?.length ?? -1)) best = { source, length: root.length };
        }
      }
      if (best) {
        row.pluginId = best.source.pluginId;
        row.pluginName = best.source.name;
      }
    }
  }

  /**
   * The installed instruments with their preset folders, read once and kept: LUNA's own
   * browser asks for the same list. {@link forgetInstruments} reads it again next time.
   */
  private instruments(): Promise<InstrumentSource[]> {
    if (!this.instrumentList) {
      const reading = (async () => {
        const plugins = await this.client.plugins.query({ insertType: 'instrument' }).catch(() => []);
        return Promise.all(
          plugins
            .filter((p) => addressable(p.pluginId))
            .map(async (p) => {
              const node = await within(this.wire.get(`/presets/plugins/${p.pluginId}`, { properties: true, children: false, commands: false, flatvalue: true, propfilter: ['factory_root', 'user_root'] }) as Promise<TreeNode | null>, null);
              const roots = [node?.properties?.['factory_root'], node?.properties?.['user_root']].filter((r): r is string => typeof r === 'string' && r !== '').map((r) => r.replace(/\/+$/, ''));
              return { pluginId: p.pluginId, name: p.name, roots };
            }),
        );
      })();
      reading.catch(() => (this.instrumentList = undefined));
      this.instrumentList = reading;
    }
    return this.instrumentList;
  }

  /** Read the installed instruments again on the next query, for example after one was installed. */
  forgetInstruments(): void {
    this.instrumentList = undefined;
  }

  /**
   * The plugin's preset name exactly `name` (case-insensitive), or `undefined`. When the
   * library holds a user preset and a factory preset of the same name, the user one wins,
   * matching what LUNA's preset browser opens.
   *
   * @example
   * const preset = await luna.presets.find('uaudio_qi', '4-Band EQ');
   * preset?.uid;
   */
  async find(pluginId: string, name: string): Promise<PresetRow | undefined> {
    const rows = await this.query({ pluginId, search: name });
    const q = name.trim().toLowerCase();
    const named = rows.filter((r) => r.name.trim().toLowerCase() === q);
    return named.find((r) => !r.factory) ?? named[0];
  }

  /**
   * The plugin's tag groups, in LUNA's order (fact 120). Empty for a plugin whose presets
   * are not tagged.
   *
   * @example
   * const groups = await luna.presets.tagGroups('uaudio_paradise_guitar_studio');
   * groups.map((g) => g.name); // ['TYPE', 'GENRE', 'DESCRIPTION']
   */
  async tagGroups(pluginId: string): Promise<PresetTagGroup[]> {
    return this.groupsAt(`/presets/plugins/${pluginId}/categories`);
  }

  /**
   * The tag groups LUNA's track preset browser shows: the track presets' own groups and every
   * installed instrument plugin's, merged by group name, without the category tags (`Audio`,
   * `Instrument`, `Bus`, `Multi-Track`), which {@link TRACK_PRESET_CATEGORIES} lists (fact 132).
   *
   * @example
   * const groups = await luna.presets.trackTagGroups();
   * groups.map((g) => g.name); // ['GENRE', 'TYPE', ...]
   */
  async trackTagGroups(): Promise<PresetTagGroup[]> {
    const instruments = await this.instruments();
    const sources = [`/presets/devices/track/categories`, ...instruments.map((p) => `/presets/plugins/${p.pluginId}/categories`)];
    const all = (await Promise.all(sources.map((path) => within(this.groupsAt(path), [] as PresetTagGroup[])))).flat();
    const byName = new Map<string, PresetTagGroup>();
    for (const group of all) {
      const tags = group.tags.filter((t) => !HIDDEN_TRACK_TAGS.has(t));
      const seen = byName.get(group.name);
      if (seen) seen.tags.push(...tags.filter((t) => !seen.tags.includes(t)));
      else byName.set(group.name, { ...group, tags: [...new Set(tags)] });
    }
    return [...byName.values()].filter((g) => g.tags.length > 0);
  }

  private async groupsAt(path: string): Promise<PresetTagGroup[]> {
    const tree = (await this.wire.get(path, { recursive: true, children: true, properties: true, commands: false, flatvalue: true })) as TreeNode | null;
    const groups: PresetTagGroup[] = [];
    for (const category of tree?.children ?? []) {
      const subs = category.children?.find((c) => c.path === 'sub_categories');
      for (const sub of subs?.children ?? []) {
        const tagFolder = sub.children?.find((c) => c.path === 'tags');
        groups.push({
          uid: String(sub.properties?.['uid'] ?? sub.path ?? ''),
          name: String(sub.properties?.['name'] ?? ''),
          category: String(category.properties?.['name'] ?? ''),
          categoryUid: String(category.properties?.['uid'] ?? category.path ?? ''),
          tags: (tagFolder?.children ?? []).map((t) => t.properties?.['tag']).filter((t): t is string => typeof t === 'string' && t !== ''),
        });
      }
    }
    return groups;
  }

  /**
   * Presets UA Assistant recommends for free text, best first, five at most (fact 121). Needs
   * UA Assistant connected to LUNA ({@link Assistant.enabled}), and an instance of the plugin
   * created since it connected, which is when LUNA builds the plugin's search index. Otherwise
   * this rejects with the engine's code: `ua.unknown` (no assistant),
   * `assistant.preset_search_not_initialized_error` (no index yet), or
   * `assistant.input_classifier_rejected` (text the assistant will not search on). Empty text
   * resolves to `[]` without asking.
   *
   * @example
   * const recs = await luna.presets.recommend('uaudio_paradise_guitar_studio', 'warm jazz clean');
   * await slot.loadPreset(recs[0].uid);
   */
  async recommend(pluginId: string, text: string): Promise<PresetRecommendation[]> {
    if (text.trim() === '') return [];
    const reply = (await this.post('preset_recommendations', { plugin_id: pluginId, query: text })) as { results?: unknown } | null;
    const results = Array.isArray(reply?.results) ? (reply.results as Record<string, unknown>[]) : [];
    return results
      .filter((r) => typeof r['preset_uuid'] === 'string' && r['preset_uuid'] !== '')
      .map((r) => {
        const rec: PresetRecommendation = { uid: String(r['preset_uuid']), name: String(r['preset_name'] ?? ''), score: Number(r['rrf_score'] ?? 0) };
        if (typeof r['keyword_score'] === 'number') rec.keywordScore = r['keyword_score'];
        if (typeof r['semantic_score'] === 'number') rec.semanticScore = r['semantic_score'];
        return rec;
      });
  }

  /**
   * A live preset selection over one plugin: set `search` and `tags`, read `presets` and
   * `recommendations`. Requests are debounced and a reply that a newer one overtook is
   * dropped, so the lists always match the inputs. Recommendations come from the search text,
   * keep only presets carrying the selected tags (so with tags selected there can be fewer
   * than the assistant's five), and stay empty while UA Assistant is not connected. A refused
   * request leaves them empty and its code in `recommendationError`. Call `dispose()` when done.
   *
   * @example
   * const sel = luna.presets.selection('uaudio_paradise_guitar_studio');
   * await sel.ready();
   * sel.groups.value;                       // tag groups for the chips
   * await sel.search.set('warm');
   * await sel.toggleTag('Clean');
   * await sel.settled();
   * sel.presets.items.map((p) => p.name);   // names containing "warm", tagged Clean
   * sel.recommendations.items[0]?.name;     // the assistant's best match, tagged Clean
   * await slot.loadPreset(sel.presets.items[0].uid);
   * sel.dispose();
   */
  selection(pluginId: string, options: PresetSelectionOptions = {}): PresetSelection {
    return new PresetSelection(this.client, pluginId, options);
  }

  /**
   * A live selection over track presets, as LUNA's track preset browser offers them: a
   * `category` (one of {@link TRACK_PRESET_CATEGORIES}, or `null` for all), tags, and search
   * text. With no category or `Instrument`, installed instrument plugins' presets are listed
   * too, marked `isInstrumentPreset` (fact 132). Pass a row to {@link Session.newTrackFromPreset}
   * to make a track from it, or to {@link Track.loadPreset} to apply it to a track. Call
   * `dispose()` when done.
   *
   * @example
   * const sel = luna.presets.trackSelection({ category: 'Instrument' });
   * await sel.ready();
   * await sel.search.set('piano');
   * await sel.settled();
   * const [track] = await session.newTrackFromPreset(sel.presets.items[0]);
   * await track.loadPreset(sel.presets.items[1]);   // replace it with another
   * sel.dispose();
   */
  trackSelection(options: TrackPresetSelectionOptions = {}): TrackPresetSelection {
    return new TrackPresetSelection(this.client, options);
  }
}

/**
 * `/assistant`: whether UA Assistant is connected to LUNA. Preset recommendations need it
 * (fact 121). Call `watch()` to follow it.
 *
 * @example
 * const { ready } = luna.assistant.watch();
 * await ready;
 * luna.assistant.enabled.value; // true while UA Assistant is connected
 */
export class Assistant extends Node {
  /** True while UA Assistant is connected to LUNA. */
  readonly enabled: Prop<boolean>;

  /** @internal */
  constructor(client: Client) {
    super(client, '/assistant');
    this.enabled = this.prop<boolean>('enabled');
  }
}

export interface PresetSelectionOptions {
  /** Most rows in `presets`. Default: all of them. */
  limit?: number;
  /** Most rows in `recommendations`. Default 5. */
  maxRecommendations?: number;
  /** Ask UA Assistant for recommendations. Default true. */
  recommend?: boolean;
  /** Quiet time after a change before the list is queried, in ms. Default 100. */
  queryDelayMs?: number;
  /** Quiet time after a change before recommendations are asked for, in ms. Default 300. */
  recommendDelayMs?: number;
}

export interface TrackPresetSelectionOptions {
  /** The category to start on. Default `null`: all of them. */
  category?: TrackPresetCategory | null;
  /** Most rows in `presets`. Default: all of them. */
  limit?: number;
  /** Quiet time after a change before the list is queried, in ms. Default 100. */
  queryDelayMs?: number;
}

/**
 * What {@link PresetSelection} and {@link TrackPresetSelection} share: search text and tags
 * in, a list of presets out. Requests are debounced, and a reply that a newer request
 * overtook is dropped.
 */
abstract class PresetSelectionBase {
  /** Search text. Filters `presets` by name; for a plugin's presets, it is also what recommendations are asked for. */
  readonly search: WritableProp<string>;
  /** Selected tags. */
  readonly tags: WritableProp<readonly string[]>;
  /** The tag groups, once {@link ready}. */
  readonly groups: Prop<readonly PresetTagGroup[]>;
  /** Presets matching the search text and tags, with their tags. */
  readonly presets: List<PresetRow>;
  /** True while a request is in flight or waiting. */
  readonly loading: Prop<boolean>;
  /** The last list query's failure, or `null`. */
  readonly error: Prop<UAError | null>;

  protected readonly searchCell: Cell<string>;
  protected readonly tagsCell: Cell<readonly string[]>;
  private readonly groupsCell: Cell<readonly PresetTagGroup[]>;
  private readonly presetsCell: Cell<readonly PresetRow[]>;
  private readonly loadingCell: Cell<boolean>;
  private readonly errorCell: Cell<UAError | null>;
  protected readonly presetsApi: Presets;
  protected readonly releases: Unsubscribe[] = [];
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly gens = new Map<string, number>();
  private inFlight = 0;
  private waiters: (() => void)[] = [];
  private readyPromise: Promise<void> | undefined;
  private isDisposed = false;

  protected constructor(
    protected readonly client: Client,
    private readonly base: { limit?: number; queryDelayMs?: number },
  ) {
    const scheduler = client.store.scheduler;
    this.presetsApi = client.presets;
    this.searchCell = new Cell<string>(scheduler, '');
    this.tagsCell = new Cell<readonly string[]>(scheduler, []);
    this.groupsCell = new Cell<readonly PresetTagGroup[]>(scheduler, []);
    this.presetsCell = new Cell<readonly PresetRow[]>(scheduler, []);
    this.loadingCell = new Cell<boolean>(scheduler, false);
    this.errorCell = new Cell<UAError | null>(scheduler, null);
    this.search = this.input(this.searchCell);
    this.tags = this.input(this.tagsCell);
    this.groups = this.groupsCell;
    this.presets = listOf(this.presetsCell, (row) => row.uid);
    this.loading = this.loadingCell;
    this.error = this.errorCell;
  }

  /** The tag groups to offer. */
  protected abstract loadGroups(): Promise<PresetTagGroup[]>;
  /** The list query for the current inputs, without `limit`. */
  protected abstract listQuery(): PresetQueryOptions;

  /** A writable input over `cell`: setting a new value queries again. */
  protected input<T>(cell: Cell<T>): WritableProp<T> {
    return writable(cell, async (value) => {
      if (cell.update(value)) this.changed();
    });
  }

  /**
   * Read the tag groups and the first list (and, for a plugin's presets, start following UA
   * Assistant's connection). Idempotent.
   *
   * @example
   * await sel.ready();
   */
  ready(): Promise<void> {
    this.readyPromise ??= this.start();
    return this.readyPromise;
  }

  protected async start(): Promise<void> {
    const groups = this.track(this.loadGroups().catch(() => [] as PresetTagGroup[]));
    this.schedule('query', 0, (current) => this.runQuery(current));
    this.groupsCell.update(await groups);
    await this.settled();
  }

  /**
   * Add `tag` to the selection, or remove it if selected.
   *
   * @example
   * await sel.toggleTag('Clean');
   */
  toggleTag(tag: string): Promise<void> {
    const now = this.tagsCell.value ?? [];
    return this.tags.set(now.includes(tag) ? now.filter((t) => t !== tag) : [...now, tag]);
  }

  /** Clear the search text and the selected tags. */
  async clear(): Promise<void> {
    const searchMoved = this.searchCell.update('');
    const tagsMoved = this.tagsCell.update([]);
    if (searchMoved || tagsMoved) this.changed();
  }

  /** Query again with the current inputs, for example after presets were saved or deleted. */
  refresh(): void {
    this.changed();
  }

  /**
   * Resolves once nothing is waiting or in flight and the lists match the inputs.
   *
   * @example
   * await sel.search.set('lion');
   * await sel.settled();
   */
  settled(): Promise<void> {
    if (this.idle) return this.client.store.scheduler.settled();
    return new Promise<void>((resolve) => this.waiters.push(resolve)).then(() => this.client.store.scheduler.settled());
  }

  /** Stop following and drop pending requests. */
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    // A reply still in flight must not land after this.
    for (const [key, gen] of this.gens) this.gens.set(key, gen + 1);
    for (const release of this.releases.splice(0)) release();
    this.wake();
  }

  get disposed(): boolean {
    return this.isDisposed;
  }

  protected get started(): boolean {
    return this.readyPromise !== undefined;
  }

  private get idle(): boolean {
    return this.inFlight === 0 && this.timers.size === 0;
  }

  /** An input moved: query again after the quiet time. */
  protected changed(): void {
    if (this.isDisposed || !this.started) return;
    this.schedule('query', this.base.queryDelayMs ?? 100, (current) => this.runQuery(current));
  }

  /**
   * Run `job` after `delayMs`, replacing a pending job under the same `key`. `current()` turns
   * false once a newer job for the key is scheduled, so a stale reply can be dropped.
   */
  protected schedule(key: string, delayMs: number, job: (current: () => boolean) => Promise<void>): void {
    if (this.isDisposed) return;
    clearTimeout(this.timers.get(key));
    const gen = (this.gens.get(key) ?? 0) + 1;
    this.gens.set(key, gen);
    this.timers.set(
      key,
      setTimeout(() => {
        this.timers.delete(key);
        void job(() => this.gens.get(key) === gen).finally(() => this.wake());
      }, delayMs),
    );
    this.loadingCell.update(true);
  }

  private async runQuery(current: () => boolean): Promise<void> {
    const options: PresetQueryOptions = { ...this.listQuery(), withTags: true };
    if (this.base.limit !== undefined) options.limit = this.base.limit;
    try {
      const rows = await this.track(this.presetsApi.query(options));
      if (!current()) return;
      this.presetsCell.update(rows);
      this.errorCell.update(null);
    } catch (err) {
      if (!current()) return;
      this.errorCell.update(asError(err));
    }
  }

  /** Count `work` as in flight until it settles. */
  protected track<T>(work: Promise<T>): Promise<T> {
    this.inFlight++;
    return work.finally(() => {
      this.inFlight--;
      this.wake();
    });
  }

  private wake(): void {
    // A timer can fire between a reply and this check; only report idle when truly idle.
    if (!this.idle && !this.isDisposed) return;
    this.loadingCell.update(false);
    const waiters = this.waiters.splice(0);
    for (const w of waiters) w();
  }
}

/** Created by {@link Presets.selection}. */
export class PresetSelection extends PresetSelectionBase {
  /** Match presets carrying any selected tag rather than all of them. Default false. */
  readonly matchAnyTag: WritableProp<boolean>;
  /** UA Assistant's picks for the search text, among presets carrying the tags. Best first. */
  readonly recommendations: List<PresetRecommendation>;
  /** True while UA Assistant is connected, so recommendations can come. */
  readonly recommendationsAvailable: Prop<boolean>;
  /** The last recommendation request's failure, or `null`. */
  readonly recommendationError: Prop<UAError | null>;

  private readonly anyCell: Cell<boolean>;
  private readonly recsCell: Cell<readonly PresetRecommendation[]>;
  private readonly recErrorCell: Cell<UAError | null>;
  /** Uids carrying the selected tags, by tag selection, for filtering recommendations. */
  private taggedUids = new Map<string, Promise<Set<string>>>();

  /** @internal Use {@link Presets.selection}. */
  constructor(
    client: Client,
    readonly pluginId: string,
    private readonly options: PresetSelectionOptions = {},
  ) {
    super(client, options);
    const scheduler = client.store.scheduler;
    this.anyCell = new Cell<boolean>(scheduler, false);
    this.recsCell = new Cell<readonly PresetRecommendation[]>(scheduler, []);
    this.recErrorCell = new Cell<UAError | null>(scheduler, null);
    this.matchAnyTag = this.input(this.anyCell);
    this.recommendations = listOf(this.recsCell, (rec) => rec.uid);
    this.recommendationsAvailable = derived([client.assistant.enabled], () => client.assistant.enabled.value === true);
    this.recommendationError = this.recErrorCell;
  }

  /** Query again with the current inputs, for example after presets were saved or deleted. */
  override refresh(): void {
    this.taggedUids.clear();
    super.refresh();
  }

  protected override async start(): Promise<void> {
    if (this.wantsRecommendations) {
      const watch = this.client.assistant.watch();
      this.releases.push(watch.release);
      // Assistant connecting (or dropping) changes what a search can recommend.
      this.releases.push(this.client.assistant.enabled.onChange(() => this.scheduleRecommendations(0)));
      await watch.ready.catch(() => {});
    }
    await super.start();
  }

  protected loadGroups(): Promise<PresetTagGroup[]> {
    return this.presetsApi.tagGroups(this.pluginId);
  }

  protected listQuery(): PresetQueryOptions {
    const tags = this.tagsCell.value ?? [];
    const options: PresetQueryOptions = { pluginId: this.pluginId, search: this.searchCell.value ?? '' };
    if (tags.length > 0) {
      options.tags = tags;
      options.matchAnyTag = this.anyCell.value === true;
    }
    return options;
  }

  protected override changed(): void {
    super.changed();
    this.scheduleRecommendations(this.options.recommendDelayMs ?? 300);
  }

  private get wantsRecommendations(): boolean {
    return this.options.recommend !== false;
  }

  private scheduleRecommendations(delayMs: number): void {
    if (!this.started) return;
    this.schedule('recommend', delayMs, (current) => this.runRecommendations(current));
  }

  private async runRecommendations(current: () => boolean): Promise<void> {
    const text = (this.searchCell.value ?? '').trim();
    if (!this.wantsRecommendations || text === '' || this.client.assistant.enabled.value !== true) {
      this.recsCell.update([]);
      this.recErrorCell.update(null);
      return;
    }
    const tags = this.tagsCell.value ?? [];
    const any = this.anyCell.value === true;
    try {
      const [recs, allowed] = await this.track(Promise.all([this.presetsApi.recommend(this.pluginId, text), tags.length > 0 ? this.tagged(tags, any) : Promise.resolve(undefined)]));
      if (!current()) return;
      const kept = allowed ? recs.filter((r) => allowed.has(r.uid)) : recs;
      this.recsCell.update(kept.slice(0, this.options.maxRecommendations ?? 5));
      this.recErrorCell.update(null);
    } catch (err) {
      if (!current()) return;
      this.recsCell.update([]);
      this.recErrorCell.update(asError(err));
    }
  }

  /** Every preset uid carrying `tags`, ignoring the search text. Cached per tag selection. */
  private tagged(tags: readonly string[], any: boolean): Promise<Set<string>> {
    const key = JSON.stringify([any, [...tags].sort()]);
    let found = this.taggedUids.get(key);
    if (!found) {
      found = this.presetsApi.query({ pluginId: this.pluginId, tags, matchAnyTag: any }).then((rows) => new Set(rows.map((r) => r.uid)));
      found.catch(() => this.taggedUids.delete(key));
      this.taggedUids.set(key, found);
    }
    return found;
  }
}

/** Created by {@link Presets.trackSelection}. */
export class TrackPresetSelection extends PresetSelectionBase {
  /**
   * The category, one of {@link TRACK_PRESET_CATEGORIES}, or `null` for all of them. With
   * `null` or `Instrument`, instrument plugins' presets are listed too (fact 132).
   */
  readonly category: WritableProp<TrackPresetCategory | null>;

  private readonly categoryCell: Cell<TrackPresetCategory | null>;

  /** @internal Use {@link Presets.trackSelection}. */
  constructor(client: Client, options: TrackPresetSelectionOptions = {}) {
    super(client, options);
    this.categoryCell = new Cell<TrackPresetCategory | null>(client.store.scheduler, options.category ?? null);
    this.category = this.input(this.categoryCell);
  }

  /** Query again with the current inputs, and read the installed instruments again. */
  override refresh(): void {
    this.presetsApi.forgetInstruments();
    super.refresh();
  }

  /** True when the current category lists instrument plugins' presets as well. */
  get includesInstrumentPresets(): boolean {
    const category = this.categoryCell.value ?? null;
    return category === null || category === 'Instrument';
  }

  protected loadGroups(): Promise<PresetTagGroup[]> {
    return this.presetsApi.trackTagGroups();
  }

  protected listQuery(): PresetQueryOptions {
    // The category is one more tag, matched with the others: LUNA's browser does the same.
    const category = this.categoryCell.value ?? null;
    const tags = [...(category ? [category] : []), ...(this.tagsCell.value ?? [])];
    const options: PresetQueryOptions = { deviceTypeId: 'track', search: this.searchCell.value ?? '', includeInstrumentPresets: this.includesInstrumentPresets };
    if (tags.length > 0) options.tags = tags;
    return options;
  }
}

interface InstrumentSource {
  pluginId: string;
  name: string;
  /** Its factory and user preset folders, without a trailing slash. */
  roots: string[];
}

/**
 * LUNA cannot address a plugin id with leading or trailing spaces by path, and never answers a
 * read of one (an Apple AU, fact 132).
 */
function addressable(pluginId: string): boolean {
  return pluginId !== '' && pluginId === pluginId.trim();
}

/** `work`'s answer, or `fallback` if it fails or takes longer than {@link TAG_GROUP_WAIT_MS}: one slow plugin must not hold up the rest. */
function within<T>(work: Promise<T>, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<T>((resolve) => (timer = setTimeout(() => resolve(fallback), TAG_GROUP_WAIT_MS)));
  return Promise.race([work.catch(() => fallback), late]).finally(() => clearTimeout(timer));
}

interface TreeNode {
  path?: string;
  properties?: Record<string, unknown>;
  children?: TreeNode[];
}

/**
 * The node a preset lives under (fact 175): its plugin's, `/presets/plugins/<id>`, given or
 * carried by the row; else the device type's, `/presets/devices/<type>` (`track` by default).
 */
function presetOwner(row: Pick<PresetRow, 'pluginId'>, pluginId: string | undefined, deviceTypeId: string | undefined): string {
  const plugin = pluginId ?? row.pluginId;
  if (plugin) return `/presets/plugins/${plugin}`;
  return `/presets/devices/${deviceTypeId ?? 'track'}`;
}

function asError(err: unknown): UAError {
  return err instanceof UAError ? err : new UAError('unknown', err instanceof Error ? err.message : String(err));
}

function rowsFrom(results: (Record<string, unknown[]> & { num_rows?: number }) | undefined): PresetRow[] {
  if (!results) return [];
  const n = typeof results.num_rows === 'number' ? results.num_rows : (results['uid']?.length ?? 0);
  const col = <T>(name: string, i: number, fallback: T): T => {
    const arr = results[name];
    return Array.isArray(arr) && arr[i] !== undefined ? (arr[i] as T) : fallback;
  };
  const withTags = Array.isArray(results['tags']);
  const withInstrument = Array.isArray(results['is_instrument_preset']);
  const rows: PresetRow[] = [];
  for (let i = 0; i < n; i++) {
    const row: PresetRow = {
      uid: col('uid', i, ''),
      name: col('name', i, ''),
      version: col('version', i, 0),
      // The engine sends favorite and factory as 0/1 integers (fact 98).
      favorite: Boolean(col('favorite', i, 0)),
      factory: Boolean(col('factory', i, 0)),
      path: col('path', i, ''),
    };
    if (withTags) row.tags = col<string[]>('tags', i, []);
    if (withInstrument) row.isInstrumentPreset = Boolean(col('is_instrument_preset', i, false));
    rows.push(row);
  }
  return rows;
}
