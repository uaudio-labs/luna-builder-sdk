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
  /** Only favorites. */
  favorite?: boolean;
  /** Maximum number of rows. */
  limit?: number;
}

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
    const reply = (await this.post('query', payload)) as { results?: Record<string, unknown[]> & { num_rows?: number } } | null;
    return rowsFrom(reply?.results);
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
    const tree = (await this.wire.get(`/presets/plugins/${pluginId}/categories`, { recursive: true, children: true, properties: true, commands: false, flatvalue: true })) as TreeNode | null;
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

/** Created by {@link Presets.selection}. */
export class PresetSelection {
  /** Search text. Filters `presets` by name and is what recommendations are asked for. */
  readonly search: WritableProp<string>;
  /** Selected tags. */
  readonly tags: WritableProp<readonly string[]>;
  /** Match presets carrying any selected tag rather than all of them. Default false. */
  readonly matchAnyTag: WritableProp<boolean>;
  /** The plugin's tag groups, once {@link ready}. */
  readonly groups: Prop<readonly PresetTagGroup[]>;
  /** Presets matching the search text and tags, with their tags. */
  readonly presets: List<PresetRow>;
  /** UA Assistant's picks for the search text, among presets carrying the tags. Best first. */
  readonly recommendations: List<PresetRecommendation>;
  /** True while UA Assistant is connected, so recommendations can come. */
  readonly recommendationsAvailable: Prop<boolean>;
  /** True while a list query or a recommendation request is in flight or waiting. */
  readonly loading: Prop<boolean>;
  /** The last list query's failure, or `null`. */
  readonly error: Prop<UAError | null>;
  /** The last recommendation request's failure, or `null`. */
  readonly recommendationError: Prop<UAError | null>;

  private readonly searchCell: Cell<string>;
  private readonly tagsCell: Cell<readonly string[]>;
  private readonly anyCell: Cell<boolean>;
  private readonly groupsCell: Cell<readonly PresetTagGroup[]>;
  private readonly presetsCell: Cell<readonly PresetRow[]>;
  private readonly recsCell: Cell<readonly PresetRecommendation[]>;
  private readonly loadingCell: Cell<boolean>;
  private readonly errorCell: Cell<UAError | null>;
  private readonly recErrorCell: Cell<UAError | null>;
  private readonly presetsApi: Presets;
  private readonly releases: Unsubscribe[] = [];
  private queryTimer: ReturnType<typeof setTimeout> | undefined;
  private recTimer: ReturnType<typeof setTimeout> | undefined;
  private queryGen = 0;
  private recGen = 0;
  private inFlight = 0;
  private waiters: (() => void)[] = [];
  private readyPromise: Promise<void> | undefined;
  /** Uids carrying the selected tags, by tag selection, for filtering recommendations. */
  private taggedUids = new Map<string, Promise<Set<string>>>();
  private isDisposed = false;

  /** @internal Use {@link Presets.selection}. */
  constructor(
    private readonly client: Client,
    readonly pluginId: string,
    private readonly options: PresetSelectionOptions = {},
  ) {
    const scheduler = client.store.scheduler;
    this.presetsApi = client.presets;
    this.searchCell = new Cell<string>(scheduler, '');
    this.tagsCell = new Cell<readonly string[]>(scheduler, []);
    this.anyCell = new Cell<boolean>(scheduler, false);
    this.groupsCell = new Cell<readonly PresetTagGroup[]>(scheduler, []);
    this.presetsCell = new Cell<readonly PresetRow[]>(scheduler, []);
    this.recsCell = new Cell<readonly PresetRecommendation[]>(scheduler, []);
    this.loadingCell = new Cell<boolean>(scheduler, false);
    this.errorCell = new Cell<UAError | null>(scheduler, null);
    this.recErrorCell = new Cell<UAError | null>(scheduler, null);
    const input = <T>(cell: Cell<T>): WritableProp<T> =>
      writable(cell, async (value) => {
        if (cell.update(value)) this.changed();
      });
    this.search = input(this.searchCell);
    this.tags = input(this.tagsCell);
    this.matchAnyTag = input(this.anyCell);
    this.groups = this.groupsCell;
    this.presets = listOf(this.presetsCell, (row) => row.uid);
    this.recommendations = listOf(this.recsCell, (rec) => rec.uid);
    this.recommendationsAvailable = derived([client.assistant.enabled], () => client.assistant.enabled.value === true);
    this.loading = this.loadingCell;
    this.error = this.errorCell;
    this.recommendationError = this.recErrorCell;
  }

  /**
   * Read the tag groups and the first list, and start following UA Assistant's connection.
   * Idempotent.
   *
   * @example
   * await sel.ready();
   */
  ready(): Promise<void> {
    this.readyPromise ??= this.start();
    return this.readyPromise;
  }

  private async start(): Promise<void> {
    if (this.wantsRecommendations) {
      const watch = this.client.assistant.watch();
      this.releases.push(watch.release);
      // Assistant connecting (or dropping) changes what a search can recommend.
      this.releases.push(this.client.assistant.enabled.onChange(() => this.scheduleRecommendations(0)));
      await watch.ready.catch(() => {});
    }
    const groups = this.track(this.presetsApi.tagGroups(this.pluginId).catch(() => [] as PresetTagGroup[]));
    this.scheduleQuery(0);
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
    this.taggedUids.clear();
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
    clearTimeout(this.queryTimer);
    clearTimeout(this.recTimer);
    this.queryTimer = this.recTimer = undefined;
    this.queryGen++;
    this.recGen++;
    for (const release of this.releases.splice(0)) release();
    this.wake();
  }

  get disposed(): boolean {
    return this.isDisposed;
  }

  private get wantsRecommendations(): boolean {
    return this.options.recommend !== false;
  }

  private get idle(): boolean {
    return this.inFlight === 0 && this.queryTimer === undefined && this.recTimer === undefined;
  }

  private changed(): void {
    if (this.isDisposed || !this.readyPromise) return;
    this.scheduleQuery(this.options.queryDelayMs ?? 100);
    this.scheduleRecommendations(this.options.recommendDelayMs ?? 300);
  }

  private scheduleQuery(delayMs: number): void {
    if (this.isDisposed) return;
    clearTimeout(this.queryTimer);
    this.queryGen++;
    this.queryTimer = setTimeout(() => {
      this.queryTimer = undefined;
      void this.runQuery();
    }, delayMs);
    this.loadingCell.update(true);
  }

  private scheduleRecommendations(delayMs: number): void {
    if (this.isDisposed || !this.readyPromise) return;
    clearTimeout(this.recTimer);
    this.recGen++;
    this.recTimer = setTimeout(() => {
      this.recTimer = undefined;
      void this.runRecommendations();
    }, delayMs);
    this.loadingCell.update(true);
  }

  private async runQuery(): Promise<void> {
    const gen = this.queryGen;
    const tags = this.tagsCell.value ?? [];
    const options: PresetQueryOptions = { pluginId: this.pluginId, search: this.searchCell.value ?? '', withTags: true };
    if (tags.length > 0) {
      options.tags = tags;
      options.matchAnyTag = this.anyCell.value === true;
    }
    if (this.options.limit !== undefined) options.limit = this.options.limit;
    try {
      const rows = await this.track(this.presetsApi.query(options));
      if (gen !== this.queryGen) return;
      this.presetsCell.update(rows);
      this.errorCell.update(null);
    } catch (err) {
      if (gen !== this.queryGen) return;
      this.errorCell.update(asError(err));
    }
  }

  private async runRecommendations(): Promise<void> {
    const gen = this.recGen;
    const text = (this.searchCell.value ?? '').trim();
    if (!this.wantsRecommendations || text === '' || this.client.assistant.enabled.value !== true) {
      this.recsCell.update([]);
      this.recErrorCell.update(null);
      this.wake();
      return;
    }
    const tags = this.tagsCell.value ?? [];
    const any = this.anyCell.value === true;
    try {
      const [recs, allowed] = await this.track(Promise.all([this.presetsApi.recommend(this.pluginId, text), tags.length > 0 ? this.tagged(tags, any) : Promise.resolve(undefined)]));
      if (gen !== this.recGen) return;
      const kept = allowed ? recs.filter((r) => allowed.has(r.uid)) : recs;
      this.recsCell.update(kept.slice(0, this.options.maxRecommendations ?? 5));
      this.recErrorCell.update(null);
    } catch (err) {
      if (gen !== this.recGen) return;
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

  /** Count `work` as in flight until it settles. */
  private track<T>(work: Promise<T>): Promise<T> {
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

interface TreeNode {
  path?: string;
  properties?: Record<string, unknown>;
  children?: TreeNode[];
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
    rows.push(row);
  }
  return rows;
}
