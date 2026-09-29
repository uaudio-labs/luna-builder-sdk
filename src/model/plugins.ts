/**
 * The plugin catalog: `/plugins/<plugin id>`. Several hundred entries; load once.
 *
 * @example
 * await luna.plugins.load();
 * const eqs = luna.plugins.byCategory('Equalization');
 * const p = luna.plugins.find('1176')[0];
 * await track.effects.byId('effect_0')!.setPlugin(p.id);
 */
import type { Client } from '../client/client';
import type { Prop } from '../store/prop';
import { Collection } from './collection';
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

  /** Ask the engine to rescan installed plugins. */
  rescan(): Promise<unknown> {
    return this.client.raw.post('/plugins/rescan');
  }
}
