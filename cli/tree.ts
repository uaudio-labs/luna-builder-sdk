/**
 * `ua-builder tree`: the shape of LUNA's tree, for wrapping a path the SDK does not type yet
 * and for noticing when a new LUNA build moved something.
 *
 *   ua-builder tree <path> [--levels 1]       one node: properties, children, commands
 *   ua-builder tree [--out tree.json]         the nodes the SDK builds on, as one snapshot
 *
 * Read-only. It records the shape, not the state: each property's `read_only` flag and the
 * JSON type of its value (a few identifying values are kept, such as `type` and `name`),
 * child names, and command names. Values are session-specific; the shape is what a build
 * change breaks.
 */
import { writeFileSync } from 'node:fs';
import { WebSocketPort } from '../src/wire/websocket-port';
import { flagString, type Args } from './util';

interface PropertyShape {
  read_only: boolean;
  type: string;
  value?: unknown;
}

interface Shape {
  properties?: Record<string, PropertyShape>;
  children?: string[];
  commands?: string[];
}

interface WireNode {
  properties?: Record<string, { value?: unknown; read_only?: boolean } | unknown>;
  children?: { path?: string }[];
  commands?: { path?: string }[];
}

/** Values worth keeping in a shape: they identify a node rather than describe its state. */
const KEEP_VALUES = new Set(['type', 'name', 'control_type', 'track_type', 'bus_type', 'stem_format', 'insert_type', 'output_type', 'num_streams', 'discrete', 'version']);

function typeOf(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

/** A property as the engine sends it without `flatvalue`: `{ value, read_only? }`. */
function valueOf(raw: unknown): unknown {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw) && 'value' in raw ? (raw as { value: unknown }).value : raw;
}

function lastSegment(path: string | undefined): string {
  return (path ?? '').split('/').filter(Boolean).pop() ?? '';
}

/** The shape of one `get` reply (made without `flatvalue`, so `read_only` is present). */
export function shapeOf(node: WireNode): Shape {
  const out: Shape = {};
  if (node.properties) {
    out.properties = {};
    for (const [name, raw] of Object.entries(node.properties).sort(([a], [b]) => a.localeCompare(b))) {
      const value = valueOf(raw);
      const readOnly = raw !== null && typeof raw === 'object' && (raw as { read_only?: boolean }).read_only === true;
      const entry: PropertyShape = { read_only: readOnly, type: typeOf(value) };
      if (KEEP_VALUES.has(name) && (typeof value !== 'object' || value === null)) entry.value = value;
      out.properties[name] = entry;
    }
  }
  if (node.children?.length) out.children = node.children.map((c) => lastSegment(c.path));
  if (node.commands?.length) out.commands = node.commands.map((c) => lastSegment(c.path)).sort();
  return out;
}

async function read(port: WebSocketPort, path: string, levels = 1): Promise<WireNode> {
  return (await port.get(path, { children: true, commands: true, levels })) as WireNode;
}

async function snapshot(port: WebSocketPort): Promise<Record<string, unknown>> {
  const nodes: Record<string, Shape> = {};
  const notes: string[] = [];
  const add = async (label: string, path: string | undefined): Promise<WireNode | undefined> => {
    if (!path) return undefined;
    try {
      const node = await read(port, path);
      nodes[label] = shapeOf(node);
      return node;
    } catch (err) {
      notes.push(`${label} (${path}): ${(err as { code?: string }).code ?? String(err)}`);
      return undefined;
    }
  };
  const status = await add('/status', '/status');
  const version = String(valueOf((status?.properties as Record<string, unknown> | undefined)?.['version']) ?? 'unknown');
  const sessions = await add('/sessions', '/sessions');
  const sid = lastSegment(sessions?.children?.[0]?.path);
  if (!sid) notes.push('no session is open: open one with a mono audio track to capture the session nodes');
  const S = sid ? `/sessions/${sid}` : undefined;
  const session = await add('/sessions/<session>', S);
  if (S && session) {
    const tracks = (await port.get(`${S}/tracks`, { children: true, levels: 2, commands: false, flatvalue: true, propfilter: ['track_type', 'stem_format'] })) as { children?: { path?: string; properties?: Record<string, unknown> }[] };
    const audio = tracks.children?.find((c) => c.properties?.['track_type'] === 'audio');
    const T = audio ? `${S}/tracks/${lastSegment(audio.path)}` : undefined;
    if (!T) notes.push('no audio track: the track nodes are missing');
    await add('/sessions/<session>/tracks/<audio track>', T);
    await add('<track>/outputs', T && `${T}/outputs`);
    await add('<track>/outputs/main', T && `${T}/outputs/main`);
    await add('<track>/outputs/main/controls', T && `${T}/outputs/main/controls`);
    await add('<track>/outputs/main/controls/gain', T && `${T}/outputs/main/controls/gain`);
    await add('<track>/outputs/main/meters/level', T && `${T}/outputs/main/meters/level`);
    await add('<track>/outputs/send_0', T && `${T}/outputs/send_0`);
    await add('<track>/outputs/send_0/controls', T && `${T}/outputs/send_0/controls`);
    await add('<track>/controls', T && `${T}/controls`);
    await add('<track>/effects', T && `${T}/effects`);
    await add('<track>/effects/effect_0', T && `${T}/effects/effect_0`);
    await add('/sessions/<session>/buses', `${S}/buses`);
    await add('/sessions/<session>/contexts/main', `${S}/contexts/main`);
    await add('/sessions/<session>/tempo_map', `${S}/tempo_map`);
    await add('/sessions/<session>/playlists', `${S}/playlists`);
  }
  const plugins = await add('/plugins', '/plugins');
  const first = lastSegment(plugins?.children?.[0]?.path);
  await add('/plugins/<plugin>', first ? `/plugins/${first}` : undefined);
  for (const top of ['/workspace', '/renders', '/devices', '/drivers', '/preferences', '/gui']) await add(top, top);
  return { luna: version, dumped: new Date().toISOString().slice(0, 10), note: 'Shape only: property read_only and value type, child names, command names. Made by `ua-builder tree --out`.', ...(notes.length ? { notes } : {}), nodes };
}

/** `ua-builder tree [path] [--levels N] [--out file] [--host h] [--port n]`. */
export async function tree(args: Args): Promise<number> {
  const port = new WebSocketPort({ host: flagString(args, 'host') ?? 'localhost', port: Number(flagString(args, 'port') ?? 4718), heartbeat: false, reconnect: false, requestTimeoutMs: 10_000 });
  await port.open();
  try {
    const path = args.positional[0];
    const result = path ? { path, ...shapeOf(await read(port, path, Number(flagString(args, 'levels') ?? 1))) } : await snapshot(port);
    const text = `${JSON.stringify(result, null, 2)}\n`;
    const out = flagString(args, 'out');
    if (out) {
      writeFileSync(out, text);
      console.log(`wrote ${out}`);
    } else process.stdout.write(text);
    return 0;
  } finally {
    await port.close();
  }
}
