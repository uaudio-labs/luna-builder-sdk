/**
 * The plugin catalog: `/plugins/<plugin id>`. Several hundred entries; load once.
 *
 * @example
 * await luna.plugins.load();
 * const eqs = luna.plugins.byCategory('Equalization');
 * const p = luna.plugins.find('1176')[0];
 * await track.effects.byId('effect_0')!.setPlugin(p.id);
 *
 * Which plugins fit a slot is LUNA's decision, not the catalog's: ask with {@link Plugins.query}
 * or {@link Effect.validPlugins} (fact 127).
 */
import type { Client } from '../client/client';
import type { Prop } from '../store/prop';
import { UAError, Unsupported } from '../wire/errors';
import { Collection } from './collection';
import type { InsertSlot } from './effect';
import { Node } from './node';

export interface PluginManifest {
  manufacturer?: string;
  name?: string;
  version?: string;
  plugin_id?: string;
  short_names?: string[];
  categories?: string[];
  effect_type?: string;
  supported_stream_formats?: Record<string, [string, string][]>;
  is_v3?: boolean;
}

export interface PluginQueryOptions {
  /** Case-insensitive text matched against plugin names and manufacturers. */
  search?: string;
  /** Only plugins in any of these categories, named as LUNA's plugins browser names them (`EQ`, `Reverb`, ...). */
  categories?: readonly string[];
  /** Only favorites. */
  favoritesOnly?: boolean;
  /** Only plugins LUNA would put in this slot (`effect_0`, `instrument`, `midi_0`, `record_fx_0`, ...). */
  insertType?: InsertSlot;
  /** With `insertType`, the track or bus whose format (mono, stereo) the plugins must run in. Needs `sessionUid`. */
  channelUid?: string;
  sessionUid?: string;
  /** Maximum number of rows. */
  limit?: number;
}

/** One plugin {@link Plugins.query} returned. */
export interface PluginRow {
  pluginId: string;
  name: string;
  manufacturer: string;
  /** As LUNA's plugins browser names them. */
  categories: string[];
  favorite: boolean;
}

export class Plugin extends Node {
  readonly pluginId: Prop<string>;
  readonly name: Prop<string>;
  readonly version: Prop<string>;
  readonly description: Prop<string>;
  readonly installed: Prop<boolean>;
  readonly favorite: Prop<boolean>;
  /** `true`/`false` when licensing applies; `null` for plugins without UA licensing. */
  readonly authorized: Prop<boolean | null>;
  readonly manifest: Prop<PluginManifest>;
  readonly defaultPresetUid: Prop<string | null>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.pluginId = this.prop<string>('plugin_id');
    this.name = this.prop<string>('name');
    this.version = this.prop<string>('version');
    this.description = this.prop<string>('description');
    this.installed = this.prop<boolean>('installed');
    this.favorite = this.prop<boolean>('favorite');
    this.authorized = this.prop<boolean | null>('authorized');
    this.manifest = this.prop<PluginManifest>('manifest');
    this.defaultPresetUid = this.prop<string | null>('default_preset_uid');
  }

  get manufacturer(): string | undefined {
    return this.manifest.value?.manufacturer;
  }

  get categories(): string[] {
    return this.manifest.value?.categories ?? [];
  }
}

export class Plugins extends Collection<Plugin> {
  /** @internal */
  constructor(client: Client) {
    super(client, '/plugins', (p) => new Plugin(client, p), { levels: 2, commands: false, flatvalue: true });
  }

  /** Case-insensitive match on name, short names, manufacturer or id. */
  find(query: string): Plugin[] {
    const q = query.toLowerCase();
    return this.items.filter((p) => {
      const m = p.manifest.value;
      return (
        (p.name.value ?? '').toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (m?.manufacturer ?? '').toLowerCase().includes(q) ||
        (m?.short_names ?? []).some((s) => s.toLowerCase().includes(q))
      );
    });
  }

  byCategory(category: string): Plugin[] {
    return this.items.filter((p) => p.categories.includes(category));
  }

  /** All categories in the catalog, sorted. */
  get categories(): string[] {
    const set = new Set<string>();
    for (const p of this.items) for (const c of p.categories) set.add(c);
    return [...set].sort();
  }

  /**
   * Ask LUNA for the installed plugins matching a search, categories and favorites, sorted by
   * name (fact 127). With `insertType`, only those LUNA's plugins browser offers for that slot:
   * an instrument slot takes instruments, an effect slot effects, and with `channelUid` only
   * plugins that run in the channel's format. LUNA applies the rules; the catalog need not be
   * loaded. A LUNA without the query rejects with `Luna.Unsupported`.
   *
   * @example
   * const eqs = await luna.plugins.query({ categories: ['EQ'], search: 'pultec' });
   * const instruments = await luna.plugins.query({ insertType: 'instrument' });
   * await track.effects.byId('effect_0')!.setPlugin(eqs[0].pluginId);
   */
  async query(options: PluginQueryOptions = {}): Promise<PluginRow[]> {
    const payload: Record<string, unknown> = {};
    if (options.search !== undefined) payload['search'] = options.search;
    if (options.categories !== undefined) payload['categories'] = [...options.categories];
    if (options.favoritesOnly !== undefined) payload['favorite'] = options.favoritesOnly;
    if (options.insertType !== undefined) payload['insert_type'] = options.insertType;
    if (options.sessionUid !== undefined) payload['session_uid'] = options.sessionUid;
    if (options.channelUid !== undefined) payload['channel_uid'] = options.channelUid;
    if (options.limit !== undefined) payload['limit'] = options.limit;
    let reply: { plugins?: Record<string, unknown>[] } | null;
    try {
      reply = (await this.client.raw.post('/plugins/query', payload)) as { plugins?: Record<string, unknown>[] } | null;
    } catch (err) {
      // A LUNA that predates the command answers as for any missing command (fact 106).
      if (err instanceof UAError && err.code === 'uasrv.invalid_object') throw new Unsupported('luna.plugins.query: this LUNA has no /plugins/query; it needs a newer LUNA.');
      throw err;
    }
    return (reply?.plugins ?? []).map((p) => ({
      pluginId: String(p['plugin_id'] ?? ''),
      name: String(p['name'] ?? ''),
      manufacturer: String(p['manufacturer'] ?? ''),
      categories: Array.isArray(p['categories']) ? p['categories'].map(String) : [],
      favorite: p['favorite'] === true,
    }));
  }

  /** Ask the engine to rescan installed plugins. */
  rescan(): Promise<unknown> {
    return this.client.raw.post('/plugins/rescan');
  }
}
