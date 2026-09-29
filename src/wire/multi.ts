/**
 * Multi-update expansion.
 *
 * The engine batches pushes into one message with `path: "multi"`. Two encodings exist
 * (`hbsystem/networking/docs/advanced.md`):
 *
 * - plain: `data` is an array of ordinary messages;
 * - packed: `data` is `{ data, path, name, parent, string, added?, removed? }`, a string table plus
 *   parent links, used whenever the client has not asked for pretty JSON.
 *
 * Packed decoding matches uanet-core `message-expansion.js`: path id `i` names
 * `'/' + string[name[i]]`, its parent is `parent[i]`, and the root is the id whose parent is itself.
 */
import type { WireMessage } from './port';

interface PackedMulti {
  data: unknown[];
  path: number[];
  name: number[];
  parent: number[];
  string: string[];
  added?: number[];
  removed?: number[];
}

function isPacked(data: unknown): data is PackedMulti {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return false;
  const p = data as Record<string, unknown>;
  return (
    Array.isArray(p['data']) &&
    Array.isArray(p['path']) &&
    Array.isArray(p['name']) &&
    Array.isArray(p['parent']) &&
    Array.isArray(p['string'])
  );
}

const MAX_DEPTH = 256;

function packedPath(p: PackedMulti, id: number): string {
  const parts: string[] = [];
  let current = id;
  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const nameIndex = p.name[current];
    const parent = p.parent[current];
    if (nameIndex === undefined || parent === undefined) break;
    parts.push(p.string[nameIndex] ?? '');
    if (parent === current) break;
    current = parent;
  }
  return '/' + parts.reverse().join('/');
}

/**
 * Expand a message into the individual updates it carries. A non-multi message expands to
 * itself. Entries that cannot be decoded are dropped.
 *
 * @example
 * expandMulti({ path: 'multi', data: [{ path: '/a/x/value', data: 1 }, { path: '/a/y/value', data: 2 }] })
 * // [{ path: '/a/x/value', data: 1 }, { path: '/a/y/value', data: 2 }]
 */
export function expandMulti(message: WireMessage): WireMessage[] {
  if (message.path !== 'multi') return [message];
  const payload = message.data;
  if (Array.isArray(payload)) {
    const out: WireMessage[] = [];
    for (const entry of payload) {
      if (entry !== null && typeof entry === 'object' && typeof (entry as WireMessage).path === 'string') {
        out.push(entry as WireMessage);
      }
    }
    return out;
  }
  if (!isPacked(payload)) return [];
  const out: WireMessage[] = [];
  for (let i = 0; i < payload.data.length; i++) {
    const pathId = payload.path[i];
    if (pathId === undefined) continue;
    out.push({ path: packedPath(payload, pathId), data: payload.data[i] });
  }
  for (const i of payload.added ?? []) {
    const m = out[i];
    if (m) m.operation = 'added';
  }
  for (const i of payload.removed ?? []) {
    const m = out[i];
    if (m) m.operation = 'removed';
  }
  return out;
}
