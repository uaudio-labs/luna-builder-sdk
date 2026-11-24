/**
 * @internal The mock's range automation edits and warp markers, kept out of mock-port.ts.
 * Each handler follows the deviced command it is named after, step for step:
 *
 * - `write_control_values` / `trim_control_values`: `Edit_WriteControlValues.cpp`,
 *   `Edit_TrimControlValues.cpp`, range from `Edit_Context::GetRangeForEdit` (fact 227).
 * - clip controls and warps: `Sesn_Service.cpp` (clip tree), `Sesn_SessionDataBase::AddClip`
 *   (every clip gets a gain control), `Sesn_SessionDataBase.schema.cpp` (warps table)
 *   (facts 228-229).
 * - `set_warp`, `delete_warp`, `remove_tce`: `Edit_SetWarp.cpp`, `Edit_DeleteWarp.cpp`,
 *   `Edit_RemoveTCE.cpp` (facts 230-231).
 *
 * The automation curve between breakpoints is linear in the control's native value here;
 * LUNA interpolates in normalized (taper) space, so values between breakpoints on a gain
 * control differ slightly. Anchors at breakpoints or on flat stretches are exact.
 */
import { FloatLiteral } from './codec';
import { UAError } from './errors';

/** The parts of `MockEngine` these handlers use. */
export interface MockOps {
  controlPathByUid(uid: string): string | undefined;
  children(path: string): string[];
  value(path: string, property: string): unknown;
  has(path: string): boolean;
  addNode(path: string, spec?: { properties?: Record<string, unknown> }): void;
  removeNode(path: string): void;
  setValue(path: string, property: string, value: unknown): void;
  nextRow(): number;
  findClip(sessionBase: string, clipUid: string): string | undefined;
}

/** What only mock-port can do for these handlers. */
export interface MockHelpers {
  /** Put a control to 0 in its native unit, all views following. */
  zeroControl(path: string): void;
  /** The tick `seconds` after `tick` through the session's tempo map. */
  tickAfter(sessionPath: string, tick: number, seconds: number): number;
}

/** `UAVar::ToDouble`: a float literal or a bare number alike. */
function toDouble(v: unknown): number {
  if (v instanceof FloatLiteral) return v.value;
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

interface Bp {
  path: string;
  tick: number;
  value: number;
}

function bps(e: MockOps, ctl: string): Bp[] {
  return e
    .children(`${ctl}/automation`)
    .map((id) => ({ path: `${ctl}/automation/${id}`, tick: Number(e.value(`${ctl}/automation/${id}`, 'start')), value: Number(e.value(`${ctl}/automation/${id}`, 'value')) }))
    .sort((a, b) => a.tick - b.tick);
}

function insertBp(e: MockOps, ctl: string, tick: number, value: number): void {
  e.addNode(`${ctl}/automation/${e.nextRow()}`, { properties: { start: tick, value } });
}

/** `ClearBPsInRange`: both ends inclusive. */
function clearRange(e: MockOps, ctl: string, a: number, b: number): void {
  for (const bp of bps(e, ctl)) if (bp.tick >= a && bp.tick <= b) e.removeNode(bp.path);
}

/** `TrimBP`: every row at the tick. */
function trimAt(e: MockOps, ctl: string, tick: number, value: number): void {
  for (const bp of bps(e, ctl)) if (bp.tick === tick) e.setValue(bp.path, 'value', value);
}

function maxBefore(e: MockOps, ctl: string, tick: number): number | undefined {
  const t = bps(e, ctl).filter((b) => b.tick < tick).map((b) => b.tick);
  return t.length ? Math.max(...t) : undefined;
}

function minAfter(e: MockOps, ctl: string, tick: number): number | undefined {
  const t = bps(e, ctl).filter((b) => b.tick > tick).map((b) => b.tick);
  return t.length ? Math.min(...t) : undefined;
}

/** `GetAutomationValue` on the curve as it was when the command started. */
function curve(points: readonly Bp[], staticValue: number): (tick: number) => number {
  return (tick) => {
    if (points.length === 0) return staticValue;
    const first = points[0]!;
    const last = points[points.length - 1]!;
    if (tick <= first.tick) return first.value;
    if (tick >= last.tick) return last.value;
    let i = 1;
    while (points[i]!.tick <= tick) i++;
    const prev = points[i - 1]!;
    const next = points[i]!;
    return prev.value + ((next.value - prev.value) * (tick - prev.tick)) / (next.tick - prev.tick);
  };
}

function write(e: MockOps, ctl: string, start: number, stop: number, value: number): void {
  const points = bps(e, ctl);
  const at = curve(points, Number(e.value(ctl, 'value') ?? 0));
  const startAnchor = at(start - 1);
  const stopAnchor = at(stop);
  const has = points.length > 0;
  const anchorBefore = (loc: number) => {
    if (loc <= 0) return;
    const before = maxBefore(e, ctl, loc);
    if (!has || before === undefined || before < loc - 1) insertBp(e, ctl, loc - 1, startAnchor);
  };
  if (start < stop) {
    clearRange(e, ctl, start, stop - 1);
    anchorBefore(start);
    if (has) {
      const after = minAfter(e, ctl, start);
      if (after !== undefined && after === stop) insertBp(e, ctl, stop - 1, value);
      else if (stopAnchor !== value) {
        insertBp(e, ctl, stop - 1, value);
        insertBp(e, ctl, stop, stopAnchor);
      }
    } else {
      insertBp(e, ctl, stop - 1, value);
      insertBp(e, ctl, stop, stopAnchor);
    }
  } else {
    anchorBefore(start);
    if (has) {
      let after = minAfter(e, ctl, start);
      if (after !== undefined && after > start + 1) {
        const anchor = minAfter(e, ctl, after);
        if (anchor !== undefined && anchor === after + 1) {
          after = anchor;
          clearRange(e, ctl, after - 1, after - 1);
        }
        insertBp(e, ctl, after - 1, value);
      }
    }
  }
  clearRange(e, ctl, start, start);
  insertBp(e, ctl, start, value);
}

function trim(e: MockOps, h: MockHelpers, ctl: string, start: number, stop: number, delta: number): void {
  // `ResetTrimControl`: the owning output's gain trim goes back to 0.
  const out = /^(.*\/outputs\/[^/]+)\/controls\/[^/]+$/.exec(ctl);
  if (out && e.has(`${out[1]}/controls/gain_trim`)) h.zeroControl(`${out[1]}/controls/gain_trim`);
  const points = bps(e, ctl);
  const at = curve(points, Number(e.value(ctl, 'value') ?? 0));
  const startAnchor = at(start - 1);
  const stopAnchor = at(stop);
  if (points.length === 0) {
    if (start > 0) insertBp(e, ctl, start - 1, startAnchor);
    insertBp(e, ctl, start, startAnchor + delta);
    if (start < stop) {
      insertBp(e, ctl, stop - 1, startAnchor + delta);
      insertBp(e, ctl, stop, stopAnchor);
    }
    return;
  }
  const before = maxBefore(e, ctl, start);
  if (before === undefined || before < start - 1) insertBp(e, ctl, start - 1, startAnchor);
  if (start < stop) {
    const startValue = at(start);
    const stopValue = at(stop - 1);
    const after = minAfter(e, ctl, stop - 1);
    if (after === undefined || after > stop) insertBp(e, ctl, stop, stopAnchor);
    let foundStart = false;
    let foundStop = false;
    const seen = new Set<number>();
    for (const bp of bps(e, ctl)) {
      if (bp.tick < start || bp.tick >= stop || seen.has(bp.tick)) continue;
      seen.add(bp.tick);
      trimAt(e, ctl, bp.tick, bp.value + delta);
      if (bp.tick === start) foundStart = true;
      if (bp.tick === stop - 1) foundStop = true;
    }
    if (!foundStart) insertBp(e, ctl, start, startValue + delta);
    if (!foundStop) insertBp(e, ctl, stop - 1, stopValue + delta);
    return;
  }
  // A single location.
  const startValue = at(start);
  const after = minAfter(e, ctl, start);
  if (after !== undefined) {
    const afterValue = at(after);
    const anchor = minAfter(e, ctl, after);
    if (anchor !== undefined && anchor === after + 1) trimAt(e, ctl, after, afterValue + delta);
    else insertBp(e, ctl, after - 1, afterValue + delta);
  }
  const atOrAfter = minAfter(e, ctl, start - 1);
  if (atOrAfter === start) trimAt(e, ctl, start, startValue + delta);
  else insertBp(e, ctl, start, startValue + delta);
}

/** @internal `write_control_values` and `trim_control_values` on `/sessions/<uid>`. */
export function controlValuesCommand(command: 'write_control_values' | 'trim_control_values', base: string, e: MockOps, h: MockHelpers) {
  return (data: unknown): null => {
    const body = (data ?? {}) as { context_type?: string; controls?: unknown; start?: number; stop?: number };
    const path = `${base}/${command}`;
    const refuse = (why: string) => new UAError('uasrv.invalid_property', `${command}: ${why}`, { cmd: 'post', path });
    let start: number;
    let stop: number;
    if (body.start !== undefined && body.stop !== undefined) {
      start = Math.trunc(Number(body.start));
      stop = Math.trunc(Number(body.stop));
    } else {
      // No full range: the named context's selection, or nothing to edit.
      const ctx = `${base}/contexts/${body.context_type ?? ''}`;
      if (!body.context_type || !e.has(ctx)) throw refuse('no range and no context');
      start = Number(e.value(ctx, 'selection_start') ?? 0);
      stop = Number(e.value(ctx, 'selection_stop') ?? 0);
    }
    const entries = (Array.isArray(body.controls) ? body.controls : [])
      .filter((c): c is { control_uid: unknown; value: unknown } => typeof c === 'object' && c !== null && 'control_uid' in c && 'value' in c)
      .map((c) => ({ uid: String(c.control_uid), value: Math.fround(toDouble(c.value)) }));
    if (entries.length === 0) throw refuse('no controls');
    // An unknown control fails the whole transaction.
    const paths = entries.map((c) => e.controlPathByUid(c.uid));
    if (paths.some((p) => p === undefined)) throw new UAError('device.database_error', `${command}: unknown control`, { cmd: 'post', path });
    entries.forEach((c, i) => (command === 'write_control_values' ? write(e, paths[i]!, start, stop, c.value) : trim(e, h, paths[i]!, start, stop, c.value)));
    return null;
  };
}

/** @internal Every new clip gets a `controls/gain` and an empty `warps` folder (facts 228-229). */
export function addClipChildren(e: MockOps, clipPath: string, addControl: (path: string, gain: number) => void): void {
  if (!e.has(`${clipPath}/controls/gain`)) addControl(`${clipPath}/controls/gain`, Number(e.value(clipPath, 'gain') ?? 0));
  if (!e.has(`${clipPath}/warps`)) e.addNode(`${clipPath}/warps`);
}

/** LUNA's warp transient zone, `warp_transient_zone_size` (30 ms) in ns. */
const ZONE_NS = 30_000_000;

interface WarpRow {
  path: string;
  rowid: number;
  start: number;
  source: number;
}

function warps(e: MockOps, clip: string): WarpRow[] {
  return e.children(`${clip}/warps`).map((id) => ({ path: `${clip}/warps/${id}`, rowid: Number(id), start: Number(e.value(`${clip}/warps/${id}`, 'start')), source: Number(e.value(`${clip}/warps/${id}`, 'source_start')) }));
}

/** @internal The session's warp commands. */
export function warpCommands(base: string, e: MockOps, h: MockHelpers) {
  const err = (code: string, cmd: string, why: string) => new UAError(code, `${cmd}: ${why}`, { cmd: 'post', path: `${base}/${cmd}` });
  return {
    set_warp: (data: unknown): unknown => {
      const body = (data ?? {}) as { clip_uid?: string; playlist_uid?: string; start?: number; source_start?: number; rowid?: number; move?: number };
      // Without a playlist (or start and source_start) none of set_warp's branches runs, and it
      // answers success having done nothing.
      if (!body.playlist_uid || body.start === undefined || body.source_start === undefined) return null;
      // LUNA finds the clip in the playlist the command names.
      const inPlaylist = `${base}/playlists/${body.playlist_uid}/clips/${body.clip_uid ?? ''}`;
      const clip = e.has(inPlaylist) ? inPlaylist : undefined;
      if (!clip) throw err('device.database_error', 'set_warp', 'no such clip');
      const start = Math.trunc(Number(body.start)) + Math.trunc(Number(body.move ?? 0));
      const source = Math.trunc(Number(body.source_start));
      const rows = warps(e, clip);
      // `CheckClips`: two markers at one tick or one source point roll the edit back.
      const conflict = (others: WarpRow[]) => others.some((w) => w.start === start || w.source === source);
      if (body.rowid !== undefined) {
        const row = rows.find((w) => w.rowid === Number(body.rowid));
        if (!row) return null;
        if (conflict(rows.filter((w) => w !== row))) throw err('uasrv.invalid_object', 'set_warp', 'warp conflict');
        e.setValue(row.path, 'start', start);
        e.setValue(row.path, 'source_start', source);
        e.setValue(row.path, 'warp_type', 0);
        return null;
      }
      // A marker within the transient zone of the new source point is reused.
      const near = rows.find((w) => Math.abs(w.source - source) <= ZONE_NS);
      if (near) return { rowid: near.rowid };
      if (conflict(rows)) throw err('uasrv.invalid_object', 'set_warp', 'warp conflict');
      const rowid = e.nextRow();
      e.addNode(`${clip}/warps/${rowid}`, { properties: { warp_type: 0, start, source_start: source, start_original: start, source_start_original: source } });
      return { rowid };
    },
    delete_warp: (data: unknown): null => {
      const body = (data ?? {}) as { clip_uid?: string; start?: number; stop?: number };
      if (!body.clip_uid || body.start === undefined) throw err('uasrv.invalid_property', 'delete_warp', 'clip_uid and start are required');
      const clip = e.findClip(base, body.clip_uid);
      if (!clip) return null;
      const start = Number(body.start);
      // A range leaves markers on both its ends alone (`start > ? AND start < ?`).
      for (const w of warps(e, clip)) {
        if (body.stop === undefined ? w.start === start : w.start > start && w.start < Number(body.stop)) e.removeNode(w.path);
      }
      return null;
    },
    remove_tce: (data: unknown): null => {
      const body = (data ?? {}) as { clip_uid?: string | string[]; context_type?: string };
      const uids = Array.isArray(body.clip_uid) ? body.clip_uid : body.clip_uid ? [body.clip_uid] : [];
      if (uids.length === 0) throw err('uasrv.invalid_property', 'remove_tce', 'clip_uid is required');
      const clips = uids.map((u) => e.findClip(base, String(u)));
      if (clips.some((c) => c === undefined)) throw err('device.database_error', 'remove_tce', 'no such clip');
      if (clips.some((c) => Number(e.value(c!, 'clip_type') ?? 0) !== 0)) throw err('uasrv.invalid_object', 'remove_tce', 'not an audio clip');
      for (const clip of clips as string[]) {
        for (const w of warps(e, clip)) e.removeNode(w.path);
        // The clip plays its source span at the session tempo again.
        const start = Number(e.value(clip, 'start') ?? 0);
        const span = (Number(e.value(clip, 'source_stop') ?? 0) - Number(e.value(clip, 'source_start') ?? 0)) / 1e9;
        const stop = h.tickAfter(base, start, span);
        e.setValue(clip, 'stop', stop);
        const ctx = `${base}/contexts/${body.context_type ?? 'main'}`;
        if (e.has(ctx)) {
          e.setValue(ctx, 'selection_start', start);
          e.setValue(ctx, 'selection_stop', stop);
        }
      }
      return null;
    },
  };
}
