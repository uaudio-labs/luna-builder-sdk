/**
 * The preset library: the `/presets` node's `query` command over the workspace database
 * (fact 98). Presets are addressed by uid; `find` turns a plugin id and a preset name
 * into that uid so it can be passed to {@link Effect.setPlugin}.
 *
 * @example
 * const preset = await luna.presets.find('uaudio_qi', '4-Band EQ');
 * await slot.setPlugin('uaudio_qi', { presetName: preset?.name, presetUid: preset?.uid });
 */
import type { Client } from '../client/client';
import { Node } from './node';

export interface PresetRow {
  uid: string;
  name: string;
  version: number;
  favorite: boolean;
  factory: boolean;
  path: string;
}

export interface PresetQueryOptions {
  /** The plugin whose presets to list. One of `pluginId` or `deviceTypeId` is required. */
  pluginId?: string;
  /** A device type (for example `track`) instead of a plugin. */
  deviceTypeId?: string;
  /** Substring to match against preset names. */
  search?: string;
  /** Only favorites. */
  favorite?: boolean;
  /** Maximum number of rows. */
  limit?: number;
}

export class Presets extends Node {
  /** @internal */
  constructor(client: Client) {
    super(client, '/presets');
  }

  /**
   * Query the preset database (fact 98). Columnar on the wire; rows here.
   *
   * @example
   * const rows = await luna.presets.query({ pluginId: 'uaudio_qi', search: 'EQ' });
   * rows[0]?.uid; rows[0]?.name; rows[0]?.factory;
   */
  async query(options: PresetQueryOptions = {}): Promise<PresetRow[]> {
    const payload: Record<string, unknown> = {};
    if (options.pluginId !== undefined) payload['plugin_id'] = options.pluginId;
    if (options.deviceTypeId !== undefined) payload['device_type_id'] = options.deviceTypeId;
    if (options.search !== undefined) payload['search'] = options.search;
    if (options.favorite !== undefined) payload['favorite'] = options.favorite;
    if (options.limit !== undefined) payload['limit'] = options.limit;
    const reply = (await this.post('query', payload)) as { results?: Record<string, unknown[]> & { num_rows?: number } } | null;
    return rowsFrom(reply?.results);
  }

  /**
   * The plugin's preset named exactly `name` (case-insensitive), or `undefined`. When the
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
}

function rowsFrom(results: (Record<string, unknown[]> & { num_rows?: number }) | undefined): PresetRow[] {
  if (!results) return [];
  const n = typeof results.num_rows === 'number' ? results.num_rows : (results['uid']?.length ?? 0);
  const col = <T>(name: string, i: number, fallback: T): T => {
    const arr = results[name];
    return Array.isArray(arr) && arr[i] !== undefined ? (arr[i] as T) : fallback;
  };
  const rows: PresetRow[] = [];
  for (let i = 0; i < n; i++) {
    rows.push({
      uid: col('uid', i, ''),
      name: col('name', i, ''),
      version: col('version', i, 0),
      // The engine sends favorite and factory as 0/1 integers (fact 98).
      favorite: Boolean(col('favorite', i, 0)),
      factory: Boolean(col('factory', i, 0)),
      path: col('path', i, ''),
    });
  }
  return rows;
}
