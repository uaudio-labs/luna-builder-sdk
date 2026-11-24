/**
 * The mock's model of session groups (facts 215-218), track MIDI output routing (facts
 * 219-220), the video sync node (facts 221-222) and `/gui` progress suppression (facts
 * 223-225), kept out of mock-port.ts so that file only wires them in.
 *
 * Each handler follows what LUNA's code does (deviced `services/grouping/Group_*.cpp`,
 * `services/editing/Edit_SetMidiOutputAssignments.cpp`, `services/video/`, and houston
 * `server/gui/commands/RSrvr_Tasks.cpp`); see the facts for the source lines.
 */
import { UAError } from './errors';
import type { CommandHandler, MockEngine } from './mock-port';

// -----------------------------------------------------------------------------------------
// Groups (facts 215-218)
// -----------------------------------------------------------------------------------------

const ATTRIBUTE_BITS: Record<string, number> = { edit: 1, mix: 2, plugin: 4, send: 8, all: 15, mix_and_edit: 3, unknown: 0, '': 0 };
const ATTRIBUTE_NAMES = ['edit', 'mix', 'plugin', 'send'] as const;

/** `UA::StringToGroupAttributes`: split on `,` and space; an unknown token fails the whole string. */
export function groupAttributeBits(csv: string): number | undefined {
  let bits = 0;
  for (const token of csv.split(/[, ]/)) {
    const bit = ATTRIBUTE_BITS[token];
    if (bit === undefined) return undefined;
    bits |= bit;
  }
  return bits;
}

/** `UA::GroupAttributesToString`: canonical order `edit,mix,plugin,send`. */
export function groupAttributeCsv(bits: number): string {
  return ATTRIBUTE_NAMES.filter((_, i) => (bits & (1 << i)) !== 0).join(',');
}

const isNil = (uid: unknown): boolean => typeof uid !== 'string' || uid === '' || /^0+$/.test(uid.replaceAll('-', ''));

/** The group-level commands LUNA registers on `/sessions/<uid>` (fact 215). */
export function groupCommands(sessionUid: string): Record<string, CommandHandler> {
  const base = `/sessions/${sessionUid}`;
  const groups = `${base}/groups`;
  const err = (code: string, command: string, why: string) => new UAError(code, `${command}: ${why}`, { cmd: 'post', path: `${base}/${command}` });
  const channelKind = (engine: MockEngine, uid: string): 'track' | 'bus' | undefined =>
    engine.has(`${base}/tracks/${uid}`) ? 'track' : engine.has(`${base}/buses/${uid}`) ? 'bus' : undefined;
  const addMember = (engine: MockEngine, command: string, group: string, uid: string): void => {
    const kind = channelKind(engine, uid);
    if (!kind) throw err('device.database_error', command, `no track or bus ${uid}`);
    // The unique index on (group, track, bus) treats the NULL column as distinct, so LUNA
    // inserts a second row for a member already in the group (fact 216).
    engine.addNode(`${group}/members/${engine.nextRow()}`, { properties: { track_uid: kind === 'track' ? uid : null, bus_uid: kind === 'bus' ? uid : null } });
  };
  const members = (engine: MockEngine, group: string): Array<{ row: string; uid: string }> =>
    engine.children(`${group}/members`).map((row) => ({ row, uid: String(engine.value(`${group}/members/${row}`, 'track_uid') ?? engine.value(`${group}/members/${row}`, 'bus_uid') ?? '') }));
  const sorted = (engine: MockEngine): string[] =>
    [...engine.children(groups)].sort((a, b) => Number(engine.value(`${groups}/${a}`, 'order') ?? 0) - Number(engine.value(`${groups}/${b}`, 'order') ?? 0));

  return {
    new_group: (data, engine) => {
      const body = (data ?? {}) as { group_attributes?: unknown; name?: unknown; uid?: unknown; tracks?: unknown; make_name_unique?: unknown };
      if (body.group_attributes === undefined) throw err('uasrv.missing_field', 'new_group', 'group_attributes is required');
      const bits = groupAttributeBits(String(body.group_attributes));
      if (bits === undefined) throw err('uasrv.invalid_property', 'new_group', 'unknown group attribute');
      if (body.uid !== undefined && isNil(body.uid)) throw err('uasrv.invalid_property', 'new_group', 'uid is not a uuid');
      const uid = body.uid !== undefined ? String(body.uid) : `group${engine.nextRow()}`;
      if (engine.has(`${groups}/${uid}`)) throw err('device.database_error', 'new_group', 'uid already names a group');
      const baseName = body.name !== undefined ? String(body.name) : 'New Group';
      let name = baseName;
      if (body.make_name_unique === true) {
        const taken = new Set(engine.children(groups).map((g) => engine.value(`${groups}/${g}`, 'name')));
        for (let n = 2; taken.has(name); n++) name = `${baseName} ${n}`;
      }
      const tracks = Array.isArray(body.tracks) ? body.tracks : [];
      const memberUids = tracks.map((m) => (typeof m === 'string' ? m : typeof m === 'object' && m !== null ? (m as { track_uid?: unknown }).track_uid : undefined)).filter((m): m is string => typeof m === 'string');
      // The whole command is one transaction: an unknown member makes nothing.
      for (const m of memberUids) if (!channelKind(engine, m)) throw err('device.database_error', 'new_group', `no track or bus ${m}`);
      const order = Math.max(0, ...engine.children(groups).map((g) => Number(engine.value(`${groups}/${g}`, 'order') ?? 0))) + 1;
      engine.addNode(`${groups}/${uid}`, { properties: { uid, name, group_attributes: groupAttributeCsv(bits), order } });
      engine.addNode(`${groups}/${uid}/members`);
      for (const m of memberUids) addMember(engine, 'new_group', `${groups}/${uid}`, m);
      return { uid };
    },
    delete_group: (data, engine) => {
      const body = (data ?? {}) as { uid?: unknown };
      if (body.uid === undefined) throw err('uasrv.missing_field', 'delete_group', 'uid is required');
      const path = `${groups}/${String(body.uid)}`;
      if (!engine.has(path)) throw err('device.database_error', 'delete_group', 'no such group');
      engine.removeNode(path);
      return null;
    },
    add_group_members: (data, engine) => {
      const body = (data ?? {}) as { uid?: unknown; tracks?: unknown };
      if (body.uid === undefined || body.tracks === undefined) throw err('uasrv.missing_field', 'add_group_members', 'uid and tracks are required');
      const group = `${groups}/${String(body.uid)}`;
      if (!engine.has(group)) throw err('device.database_error', 'add_group_members', 'no such group');
      const uids = (Array.isArray(body.tracks) ? body.tracks : []).map(String);
      for (const m of uids) if (!channelKind(engine, m)) throw err('device.database_error', 'add_group_members', `no track or bus ${m}`);
      for (const m of uids) addMember(engine, 'add_group_members', group, m);
      return null;
    },
    remove_group_members: (data, engine) => {
      const body = (data ?? {}) as { uid?: unknown; tracks?: unknown };
      if (body.uid === undefined || body.tracks === undefined) throw err('uasrv.missing_field', 'remove_group_members', 'uid and tracks are required');
      const group = `${groups}/${String(body.uid)}`;
      const gone = new Set((Array.isArray(body.tracks) ? body.tracks : []).map(String));
      if (!engine.has(group)) return null;
      for (const m of members(engine, group)) if (gone.has(m.uid)) engine.removeNode(`${group}/members/${m.row}`);
      return null;
    },
    /**
     * Moves the dragged groups to just AFTER `before_uid`, or to the front when it is absent
     * or nil, and renumbers `order` from 1. An unknown uid changes nothing and still answers
     * success (fact 217).
     */
    group_change_order: (data, engine) => {
      if (typeof data !== 'object' || data === null) throw err('uasrv.invalid_type', 'group_change_order', 'payload must be an object');
      const body = data as { session_uid?: unknown; before_uid?: unknown; dragged_uids?: unknown };
      if (isNil(body.session_uid)) throw err('uasrv.invalid_property', 'group_change_order', 'session_uid is required');
      if (!Array.isArray(body.dragged_uids)) throw err('uasrv.invalid_property', 'group_change_order', 'dragged_uids must be an array');
      if (body.dragged_uids.some((u) => typeof u !== 'string' || isNil(u))) throw err('uasrv.invalid_property', 'group_change_order', 'dragged_uids must be uuids');
      const dragged = body.dragged_uids as string[];
      if (!dragged.length) return null;
      const existing = sorted(engine);
      const before = isNil(body.before_uid) ? undefined : String(body.before_uid);
      if (dragged.some((u) => !existing.includes(u)) || (before !== undefined && !existing.includes(before))) return null;
      const rest = existing.filter((u) => !dragged.includes(u));
      const at = before === undefined ? 0 : rest.indexOf(before) + 1;
      // `before_uid` being one of the dragged groups leaves no anchor: LUNA's checks fail and nothing changes.
      if (before !== undefined && at === 0) return null;
      const next = [...rest.slice(0, at), ...dragged, ...rest.slice(at)];
      if (new Set(next).size !== existing.length) return null;
      next.forEach((u, i) => {
        if (engine.value(`${groups}/${u}`, 'order') !== i + 1) engine.setValue(`${groups}/${u}`, 'order', i + 1);
      });
      return null;
    },
    /**
     * The tracks an operation on `track_uid` reaches (fact 218): the context selection when it
     * holds the track (selection grouping on), else the track, plus every member of a group
     * holding the track whose attributes share a bit with `group_attributes`.
     */
    group_affected_tracks: (data, engine) => {
      const body = (data ?? {}) as { track_uid?: unknown; group_attributes?: unknown; context_type?: unknown };
      if (body.track_uid === undefined || body.group_attributes === undefined) throw err('uasrv.missing_field', 'group_affected_tracks', 'track_uid and group_attributes are required');
      const bits = groupAttributeBits(String(body.group_attributes));
      if (bits === undefined) throw err('uasrv.invalid_value', 'group_affected_tracks', 'unknown group attribute');
      const contextType = body.context_type === undefined ? 'main' : String(body.context_type);
      if (!/^(main|editor|alt_?\d+)$/.test(contextType)) throw err('uasrv.invalid_value', 'group_affected_tracks', 'unknown context_type');
      const src = String(body.track_uid);
      const ctx = `${base}/contexts/${contextType}`;
      const selection = (engine.has(ctx) ? (engine.value(ctx, 'selection_tracks') as string[] | null) : null) ?? [];
      const grouping = !engine.has(ctx) || engine.value(ctx, 'selection_grouping') !== false;
      const out = new Set<string>(grouping && selection.includes(src) ? selection : [src]);
      const suspended = engine.has(ctx) && engine.value(ctx, 'groups_suspended') === true;
      if (!suspended) {
        for (const g of engine.children(groups)) {
          const attrs = groupAttributeBits(String(engine.value(`${groups}/${g}`, 'group_attributes') ?? '')) ?? 0;
          if ((attrs & bits) === 0) continue;
          const list = members(engine, `${groups}/${g}`).map((m) => m.uid);
          if (list.includes(src)) for (const m of list) out.add(m);
        }
      }
      return { tracks: [...out] };
    },
  };
}

// -----------------------------------------------------------------------------------------
// MIDI output routing (facts 219-220)
// -----------------------------------------------------------------------------------------

/** `set_midi_output_assignments` on `<session>/contexts/<ctx>/commands` (fact 219). */
export function midiOutputCommand(sessionUid: string): CommandHandler {
  const base = `/sessions/${sessionUid}`;
  const path = `${base}/contexts/main/commands/set_midi_output_assignments`;
  const fail = (code: string, why: string) => new UAError(code, `set_midi_output_assignments: ${why}`, { cmd: 'post', path });
  return (data, engine) => {
    const body = (typeof data === 'object' && data !== null ? data : {}) as { track_uid?: unknown; devices?: unknown; tracks?: unknown };
    if (body.track_uid === undefined || body.devices === undefined || body.tracks === undefined) throw fail('uasrv.invalid_type', 'track_uid, devices and tracks are required');
    if (!Array.isArray(body.devices) || !Array.isArray(body.tracks)) throw fail('uasrv.invalid_object', 'devices and tracks must be arrays');
    const read = (list: unknown[]) =>
      list
        .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null && !Array.isArray(e))
        .map((e) => {
          if (!('channel' in e) || !('value' in e)) throw fail('uasrv.missing_field', 'each entry needs value and channel');
          return { value: String(e['value']), channel: Math.trunc(Number(e['channel'])) };
        });
    const devices = read(body.devices);
    const tracks = read(body.tracks);
    const src = `${base}/tracks/${String(body.track_uid)}`;
    if (!engine.has(src)) throw fail('device.database_error', 'no such track');
    for (const t of tracks) if (!engine.has(`${base}/tracks/${t.value}`) && !engine.has(`${base}/buses/${t.value}`)) throw fail('device.database_error', `no track or bus ${t.value}`);
    const folder = `${src}/midi_output_assignments`;
    if (!engine.has(folder)) engine.addNode(folder);
    for (const row of [...engine.children(folder)]) engine.removeNode(`${folder}/${row}`);
    const row = (props: Record<string, unknown>, channel: number) => {
      const uid = `moa${engine.nextRow()}`;
      engine.addNode(`${folder}/${uid}`, { properties: { uid, destination_track_uid: null, destination_bus_uid: null, effect_uid: null, midi_device: null, midi_output_channel: channel, ...props } });
    };
    for (const d of devices) row({ midi_device: d.value }, d.channel);
    // A `tracks` value that names a bus routes to the bus (NewMIDIToBusAssignment).
    for (const t of tracks) row(engine.has(`${base}/tracks/${t.value}`) ? { destination_track_uid: t.value } : { destination_bus_uid: t.value }, t.channel);
    return null;
  };
}

// -----------------------------------------------------------------------------------------
// Progress suppression (facts 223-225)
// -----------------------------------------------------------------------------------------

const suppressions = new WeakMap<MockEngine, Map<string, string>>();
const KNOWN_OWNERS = new Set(['dashboard', 'luna_play', 'catalog', 'universe']);

/** The engine's suppression handles, uid to owner (`legacy` when none was given). */
export function progressSuppressions(engine: MockEngine): Map<string, string> {
  let map = suppressions.get(engine);
  if (!map) suppressions.set(engine, (map = new Map()));
  return map;
}

/** `/gui/add_progress_suppression` and `/gui/remove_progress_suppression` (fact 223). */
export function progressSuppressionCommands(): Record<string, CommandHandler> {
  const parse = (data: unknown, command: string): string => {
    const raw = typeof data === 'object' && data !== null ? (data as { suppression_uid?: unknown }).suppression_uid : undefined;
    const path = `/gui/${command}`;
    if (typeof raw !== 'string') throw new UAError('uasrv.missing_field', `${command}: suppression_uid is required`, { cmd: 'post', path });
    const hex = raw.replaceAll('-', '').toLowerCase();
    if (!/^[0-9a-f]{32}$/.test(hex) || /^0+$/.test(hex)) throw new UAError('uasrv.invalid_value', `${command}: suppression_uid is not a uuid`, { cmd: 'post', path });
    return hex;
  };
  return {
    add_progress_suppression: (data, engine) => {
      const uid = parse(data, 'add_progress_suppression');
      const owner = (data as { owner?: unknown }).owner;
      const path = '/gui/add_progress_suppression';
      if (owner !== undefined && owner !== null && typeof owner !== 'string') throw new UAError('uasrv.invalid_type', 'add_progress_suppression: owner must be a string', { cmd: 'post', path });
      if (typeof owner === 'string' && !KNOWN_OWNERS.has(owner)) throw new UAError('uasrv.invalid_value', 'add_progress_suppression: unknown owner', { cmd: 'post', path });
      const map = progressSuppressions(engine);
      if (map.has(uid)) throw new UAError('uasrv.invalid_value', 'add_progress_suppression: handle already held', { cmd: 'post', path });
      map.set(uid, typeof owner === 'string' ? owner : 'legacy');
      return null;
    },
    remove_progress_suppression: (data, engine) => {
      const uid = parse(data, 'remove_progress_suppression');
      if (!progressSuppressions(engine).delete(uid)) throw new UAError('uasrv.invalid_value', 'remove_progress_suppression: no such handle', { cmd: 'post', path: '/gui/remove_progress_suppression' });
      return null;
    },
  };
}

/**
 * `RSrvr_GUI::ResetWebClientState(owner)`: an embedded LUNA page (dashboard, LUNA Play,
 * catalog, universe) reloading or going away drops its own handles and every legacy one
 * (fact 224).
 */
export function resetWebClient(engine: MockEngine, owner: string): void {
  const map = progressSuppressions(engine);
  for (const [uid, o] of [...map]) if (o === owner || o === 'legacy') map.delete(uid);
}
