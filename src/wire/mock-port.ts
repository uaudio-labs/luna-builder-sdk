/**
 * An in-memory UANet engine for tests. {@link MockEngine} owns a tree of nodes; each
 * {@link MockEngine.port} is one client connection with the same {@link Port} interface as the
 * real transports.
 *
 * The mock reproduces engine behaviours that trip up client code (see `docs/EVIDENCE.md`):
 * - a writer does not receive the push for its own `set`; other ports do (fact 6);
 * - pushes arrive on `<node>/<prop>/value` with the bare value (fact 4);
 * - child add/remove arrives on the child's own path with `operation` (fact 7);
 * - `set` on a node rather than a property fails with `uasrv.invalid_property`;
 * - read-only properties fail with `uasrv.read_only`;
 * - a write to one view of a control (`value`, `real_value`, `normalized_value`,
 *   `string_value`) re-derives the other three and pushes them to every port, the writer
 *   included (fact 97); the mappings are the mock's documented stand-ins, not LUNA's;
 * - pushes are delivered on a later macrotask, never synchronously; `await engine.settled()`;
 * - `new MockEngine({ gui: false })` has no `/gui`, like a headless or wasm engine (fact 103).
 *
 * @example
 * const engine = new Luna.MockEngine();
 * engine.addSession('abc', { tracks: ['t1', 't2'] });
 * const luna = await Luna.connect({ port_: engine.port() });
 * engine.setValue('/sessions/abc', 'playing', true);
 * await engine.settled();
 */
import { ConnectionLost, UAError } from './errors';
import { FloatLiteral } from './codec';
import {
  eventMatches,
  getOptionsToParams,
  splitPath,
  toEvent,
  type Event,
  type EventHandler,
  type GetOptions,
  type Port,
  type PortStatus,
  type StatusListener,
  type SubscribeOptions,
  type Unsubscribe,
  type Verb,
  type WireMessage,
} from './port';

export type CommandHandler = (data: unknown, engine: MockEngine, nodePath: string) => unknown;

export interface MockNodeSpec {
  properties?: Record<string, unknown>;
  readOnly?: string[];
  commands?: Record<string, CommandHandler>;
}

interface MockNode {
  properties: Map<string, unknown>;
  readOnly: Set<string>;
  commands: Map<string, CommandHandler>;
  children: string[];
}

interface Fault {
  code: string;
  remaining: number;
}

/** A row for {@link MockEngine.midiEdit}. */
export interface MockMidiRow {
  rowid?: number;
  tick?: number;
  status?: number;
  data1?: number;
  data2?: number;
  enabled?: boolean;
}

const EMPTY_MIDI_TABLE = (): Record<string, unknown> => ({ operation: 'update', row_ids: [], enabled: [], midi_data: [], tick: [] });

/** Pack rows the way the engine's column table does (fact 39). */
function encodeMidiTable(operation: string, rows: readonly Required<MockMidiRow>[]): Record<string, unknown> {
  return {
    operation,
    row_ids: rows.map((r) => r.rowid),
    enabled: rows.map((r) => r.enabled),
    midi_data: rows.map((r) => ((r.status & 0xff) << 16) | ((r.data1 & 0x7f) << 8) | (r.data2 & 0x7f)),
    tick: rows.map((r) => r.tick),
  };
}

function decodeMidiTable(value: unknown): Required<MockMidiRow>[] {
  const table = value as { row_ids?: number[]; enabled?: boolean[]; midi_data?: number[]; tick?: number[] } | undefined;
  return (table?.row_ids ?? []).map((rowid, i) => {
    const packed = table?.midi_data?.[i] ?? 0;
    return { rowid, tick: table?.tick?.[i] ?? 0, status: (packed >>> 16) & 0xff, data1: (packed >>> 8) & 0x7f, data2: packed & 0x7f, enabled: table?.enabled?.[i] !== false };
  });
}

/** deviced's `NormalizeAccidentals`: chord names store `♭`/`♯` as `b`/`#` (fact 100). */
const normalizeChordName = (name: string): string => name.replace(/\u266D/g, 'b').replace(/\u266F/g, '#');

function groupByClip<T extends { clip_uid?: string }>(rows: readonly T[]): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const uid = row.clip_uid;
    if (!uid) continue;
    out.set(uid, [...(out.get(uid) ?? []), row]);
  }
  return out;
}

function normalize(path: string): string {
  const q = path.indexOf('?');
  const clean = q >= 0 ? path.slice(0, q) : path;
  const parts = clean.split('/').filter((p) => p.length > 0);
  return '/' + parts.join('/');
}

function parentOf(path: string): string {
  return splitPath(path).node;
}

/**
 * A breakpoint value as LUNA stores it (fact 82): a float literal keeps its value, a bare whole
 * number is stored as 0. The mock sees payload objects rather than wire text, so a
 * `FloatLiteral` stands for the literal and a plain integer for the bare token.
 */
function wireFloat(value: unknown): number {
  if (value instanceof FloatLiteral) return value.value;
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Number.isInteger(value) ? 0 : value;
}

/**
 * The mock's control-view mappings (fact 97). LUNA's real tapers and formats are per control
 * and not exposed (fact 85), so these are documented stand-ins chosen to agree with the
 * mock's seeds: a fader maps normalized 0 → −96 dB, 0.78 → 0 dB (the measured resting point)
 * and 1 → +12 dB, formatted with one decimal; a pan maps 0..1 linearly to −100..100,
 * formatted `L<n>`/`C`/`R<n>`.
 */
const FADER_ZERO = 0.78;
const FADER_MIN = -96;
const FADER_MAX = 12;

function faderToReal(n: number): number {
  return n <= FADER_ZERO ? FADER_MIN - (n / FADER_ZERO) * FADER_MIN : ((n - FADER_ZERO) / (1 - FADER_ZERO)) * FADER_MAX;
}

function faderToNormalized(real: number): number {
  const n = real <= 0 ? ((real - FADER_MIN) / -FADER_MIN) * FADER_ZERO : FADER_ZERO + (real / FADER_MAX) * (1 - FADER_ZERO);
  return Math.min(1, Math.max(0, n));
}

function formatPan(real: number): string {
  const n = Math.round(Math.abs(real));
  return n === 0 ? 'C' : real < 0 ? `L${n}` : `R${n}`;
}

function parsePan(text: string): number {
  const m = /^([LR])(\d+(?:\.\d+)?)$/.exec(text);
  if (m) return (m[1] === 'L' ? -1 : 1) * Number(m[2]);
  return text === 'C' ? 0 : Number(text) || 0;
}

/** The four coupled views of a control's value (fact 97). */
const CONTROL_VIEWS = new Set(['value', 'real_value', 'normalized_value', 'string_value']);

export interface MockEngineOptions {
  /**
   * Include LUNA's `/gui` (dialogs, pages, Add Ons). Default `true`, as inside LUNA; `false`
   * models a headless or wasm engine, where `luna.gui.available()` is false (fact 103).
   */
  gui?: boolean;
}

export class MockEngine {
  private readonly nodes = new Map<string, MockNode>();
  private readonly ports = new Set<MockPort>();
  private readonly faults = new Map<string, Fault>();
  private pendingDeliveries = 0;
  private settleWaiters: (() => void)[] = [];
  /** Every request any port made, oldest first. Useful for asserting what a model did. */
  readonly requests: { verb: Verb; path: string; data: unknown }[] = [];
  /** `set_touch` calls, as `<control path>:on|off`, oldest first. */
  readonly touches: string[] = [];
  /** Transaction commands seen: `begin`, `commit`, `abort`. */
  readonly transactions: string[] = [];

  constructor(options: MockEngineOptions = {}) {
    this.nodes.set('/', { properties: new Map(), readOnly: new Set(), commands: new Map(), children: [] });
    this.addNode('/status', { properties: { timeout_ms: 0, version: 'mock', name: 'LUNA' } });
    this.addNode('/sessions', {
      properties: { focused_session: '' },
      commands: {
        new_session: (data, engine) => {
          const body = (data ?? {}) as { name?: string };
          const uid = `s${engine.children('/sessions').length + 1}`;
          engine.addSession(uid, { name: body.name ?? 'Untitled', focused: false });
          engine.setValue(`/sessions/${uid}`, 'loaded', false);
          return { session_uid: uid };
        },
        open_session: (data, engine) => {
          const body = (data ?? {}) as { session_package_uid?: string };
          const uid = `s${engine.children('/sessions').length + 1}`;
          engine.addSession(uid, { name: body.session_package_uid ?? 'Opened', focused: false, ...(body.session_package_uid ? { packageUid: body.session_package_uid } : {}) });
          engine.setValue(`/sessions/${uid}`, 'loaded', false);
          return { session_uid: uid };
        },
        load_session: (data, engine) => {
          const body = (data ?? {}) as { session_uid?: string };
          if (!body.session_uid || !engine.has(`/sessions/${body.session_uid}`)) {
            throw new UAError('uasrv.invalid_object', 'load_session: unknown session', { cmd: 'post', path: '/sessions/load_session' });
          }
          setTimeout(() => {
            if (engine.has(`/sessions/${body.session_uid}`)) {
              engine.setValue(`/sessions/${body.session_uid}`, 'loaded', true);
              engine.setValue('/sessions', 'focused_session', body.session_uid);
            }
          }, 5);
          return null;
        },
        close_session: (data, engine) => {
          const body = (data ?? {}) as { session_uid?: string };
          if (body.session_uid) engine.removeNode(`/sessions/${body.session_uid}`);
          return null;
        },
      },
    });
    this.addNode('/ping', {});
    this.addNode('/workspace/sessions');
    this.addNode('/workspace', {
      properties: { type: 'folder' },
      commands: {
        query: (data, engine) => {
          const body = (data ?? {}) as { limit?: number; order_by?: string; order_as?: string; search?: string };
          let rows = engine.children('/workspace/sessions').map((uid) => ({
            uid,
            name: String(engine.value(`/workspace/sessions/${uid}`, 'file_name') ?? uid),
            path: `${String(engine.value(`/workspace/sessions/${uid}`, 'directory_path') ?? '')}/${String(engine.value(`/workspace/sessions/${uid}`, 'file_name') ?? '')}`,
            file_online: true,
            session_type: 0,
            factory: false,
            favorite: Boolean(engine.value(`/workspace/sessions/${uid}`, 'favorite')),
            created: Number(engine.value(`/workspace/sessions/${uid}`, 'created') ?? 0),
            modified: 0,
            last_opened: Number(engine.value(`/workspace/sessions/${uid}`, 'last_opened') ?? 0),
            tags: [] as string[],
          }));
          if (body.search) rows = rows.filter((r) => r.name.toLowerCase().includes(body.search!.toLowerCase()));
          if (body.order_by) {
            const key = body.order_by as keyof (typeof rows)[number];
            rows.sort((a, b) => (a[key] as number) - (b[key] as number));
            if (body.order_as === 'desc') rows.reverse();
          }
          if (body.limit !== undefined) rows = rows.slice(0, body.limit);
          const results: Record<string, unknown> = { num_rows: rows.length };
          for (const k of Object.keys(rows[0] ?? { uid: 0 })) results[k] = rows.map((r) => (r as Record<string, unknown>)[k]);
          return { results };
        },
        full_text_search: () => ({ results: { num_rows: 0 } }),
        /**
         * The chunked import protocol (fact 42): `begin` answers a uid, each `transfer`
         * appends base64 bytes, `end` files the finished source under the package's audio
         * folder, and `cancel` throws the partial away. Bytes identical to an uploaded source
         * already in the package are not filed again: `end` answers that source's uid.
         */
        import_file: (data, engine) => {
          const body = (data ?? {}) as { session_package_uid?: string; phase?: string; name?: string; uid?: string; path?: string; file_data?: string; type?: string };
          const pkg = body.session_package_uid ?? '';
          switch (body.phase) {
            case 'begin': {
              const uid = `src${engine.imports.size + engine.children(`/workspace/sessions/${pkg}/audio`).length + 1}`;
              engine.imports.set(uid, { pkg, name: body.name ?? uid, bytes: 0, content: '' });
              return { uid };
            }
            case 'transfer': {
              const pending = engine.imports.get(body.uid ?? '');
              if (!pending) throw new UAError('uasrv.invalid_object', 'import_file: no import in progress for that uid', { cmd: 'post', path: '/workspace/import_file' });
              // base64 expands 3 bytes to 4 characters; padding marks the short tail.
              const encoded = body.file_data ?? '';
              const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0;
              pending.bytes += Math.max(0, (encoded.length / 4) * 3 - padding);
              pending.content += encoded;
              return null;
            }
            case 'end': {
              const uid = body.uid ?? '';
              const pending = engine.imports.get(uid);
              if (!pending) throw new UAError('uasrv.invalid_object', 'import_file: no import in progress for that uid', { cmd: 'post', path: '/workspace/import_file' });
              engine.imports.delete(uid);
              const same = engine.uploaded.get(`${pending.pkg}:${pending.content}`);
              if (same && engine.has(`/workspace/sessions/${pending.pkg}/audio/${same}`)) return { uid: same };
              engine.uploaded.set(`${pending.pkg}:${pending.content}`, uid);
              engine.addNode(`/workspace/sessions/${pending.pkg}/audio/${uid}`, {
                properties: { uid, name: body.name ?? pending.name, stem_format: 'stereo', length: 0, sample_rate: 48000, created: 0, size: pending.bytes },
              });
              return { uid };
            }
            case 'cancel':
              engine.imports.delete(body.uid ?? '');
              return null;
            case 'local_copy':
            default: {
              const uid = `src${engine.children(`/workspace/sessions/${pkg}/audio`).length + 1}`;
              engine.addNode(`/workspace/sessions/${pkg}/audio/${uid}`, {
                properties: { uid, name: body.name ?? uid, stem_format: 'stereo', length: 0, sample_rate: 48000, created: 0, size: 0 },
              });
              return { uid };
            }
          }
        },
      },
    });
    this.addNode('/plugins', { properties: { type: 'folder' }, commands: { rescan: () => null } });
    // The preset library: rows seeded with `addPreset`, queried columnar like the workspace
    // (fact 98). `favorite` and `factory` are 0/1 integers on the wire, as LUNA sends them.
    this.addNode('/presets', {
      properties: { type: 'folder' },
      commands: {
        query: (data, engine) => {
          const body = (data ?? {}) as { plugin_id?: string; device_type_id?: string; search?: string; favorite?: boolean; limit?: number };
          if (!body.plugin_id && !body.device_type_id) throw new UAError('uasrv.invalid_type', 'query: plugin_id or device_type_id required', { cmd: 'post', path: '/presets/query' });
          const root = `/presets/plugins/${body.plugin_id ?? ''}/presets`;
          let rows = engine.children(root).map((uid) => ({
            uid,
            name: String(engine.value(`${root}/${uid}`, 'preset_name') ?? uid),
            version: Number(engine.value(`${root}/${uid}`, 'version') ?? 1),
            favorite: engine.value(`${root}/${uid}`, 'favorite') ? 1 : 0,
            factory: engine.value(`${root}/${uid}`, 'factory') ? 1 : 0,
            path: String(engine.value(`${root}/${uid}`, 'path') ?? ''),
          }));
          if (body.search) rows = rows.filter((r) => r.name.toLowerCase().includes(body.search!.toLowerCase()));
          if (body.favorite) rows = rows.filter((r) => r.favorite === 1);
          if (body.limit !== undefined) rows = rows.slice(0, body.limit);
          const results: Record<string, unknown> = { num_rows: rows.length };
          for (const k of Object.keys(rows[0] ?? { uid: 0 })) results[k] = rows.map((r) => (r as Record<string, unknown>)[k]);
          return { results, folders: [] };
        },
      },
    });
    this.addNode('/drivers', { properties: { connected: [{ id: 'mock', name: 'Mock Device', type: 'built_in', num_inputs: 2, num_outputs: 2 }], unsupported: [], sample_rates: [44100, 48000] } });
    this.addNode('/preferences', { properties: { io_buffer_size: 256, play_from_stop_location: false, record_mute: false, metronome_sound: 'click', metronome_sounds: ['click', 'beep'] } });
    // Renders: `new` creates the node in `created`, `start` moves it to `running`, and the
    // test drives it to `completed` with `finishRender` (fact 44).
    this.addNode('/renders', {
      properties: { type: 'folder' },
      commands: {
        new: (data, engine) => {
          const body = (data ?? {}) as { uid?: string; name?: string; type?: string; real_time?: boolean; session_uid?: string };
          const uid = body.uid ?? `r${engine.children('/renders').length + 1}`;
          engine.addNode(`/renders/${uid}`, {
            properties: {
              uid,
              name: body.name ?? 'Bounce',
              type: body.type ?? 'bounce',
              session_uid: body.session_uid ?? '',
              state: 'created',
              percent_complete: 0,
              error_message: null,
              render_is_offline: body.real_time !== true,
              time_remaining: body.real_time === true ? 0 : undefined,
              total_samples: 0,
            },
          });
          return { uid };
        },
        start: (data, engine) => {
          const body = (data ?? {}) as { uid?: string };
          const path = `/renders/${body.uid}`;
          if (!engine.has(path)) throw new UAError('uasrv.invalid_object', 'start: no such render', { cmd: 'post', path: '/renders/start' });
          engine.setValue(path, 'state', 'running');
          return null;
        },
        abort: (data, engine) => {
          const body = (data ?? {}) as { uid?: string };
          const path = `/renders/${body.uid}`;
          if (engine.has(path)) engine.setValue(path, 'state', 'aborted');
          return null;
        },
        delete: (data, engine) => {
          const body = (data ?? {}) as { uid?: string };
          const path = `/renders/${body.uid}`;
          if (engine.has(path)) engine.removeNode(path);
          return null;
        },
      },
    });
    this.addNode('/jobs');
    this.addNode('/devices');
    this.addNode('/gui', {
      properties: { prior_launch_count: 1 },
      commands: {
        set_page: (data, engine) => {
          const body = (data ?? {}) as { page?: string; context_type?: string };
          engine.setValue(`/gui/windows/${body.context_type ?? 'main'}`, 'page', body.page ?? 'timeline');
          return null;
        },
        open_url: () => null,
        reveal_path: () => null,
        open_settings: () => null,
        open_plugin_manager: () => null,
        show_feedback: () => null,
        show_session_in_finder: () => null,
        show_add_on: () => null,
        execute: () => null,
        add_task: () => null,
        update_task: () => null,
        remove_task: () => null,
        release_file_chooser: () => null,
        release_save_dialog: () => null,
        show_open_dialog: (_data, engine) => {
          const uid = `fc${engine.nextRow()}`;
          engine.addNode(`/gui/file_chooser/${uid}`, { properties: { status: 'pending', files: [] } });
          setTimeout(() => {
            if (!engine.has(`/gui/file_chooser/${uid}`)) return;
            engine.setValue(`/gui/file_chooser/${uid}`, 'files', engine.nextDialogFiles.map((p) => ({ path: p })));
            engine.setValue(`/gui/file_chooser/${uid}`, 'status', engine.nextDialogFiles.length ? 'selected' : 'cancelled');
          }, 5);
          return { uid };
        },
        show_folder_dialog: (_data, engine) => {
          const uid = `fc${engine.nextRow()}`;
          engine.addNode(`/gui/file_chooser/${uid}`, { properties: { status: 'pending', files: [] } });
          setTimeout(() => {
            if (!engine.has(`/gui/file_chooser/${uid}`)) return;
            engine.setValue(`/gui/file_chooser/${uid}`, 'files', engine.nextDialogFiles.map((p) => ({ path: p })));
            engine.setValue(`/gui/file_chooser/${uid}`, 'status', engine.nextDialogFiles.length ? 'selected' : 'cancelled');
          }, 5);
          return { uid };
        },
        // Fact 106: validation, hidden entries and order as LUNA's list_files.
        list_files: (data, engine) => {
          const fail = (code: string, why: string) => new UAError(code, `list_files: ${why}`, { cmd: 'post', path: '/gui/list_files' });
          const path = typeof data === 'object' && data !== null ? (data as { path?: unknown }).path : undefined;
          if (path === undefined || path === null) throw fail('uasrv.missing_field', 'path is required');
          if (typeof path !== 'string' || !/^(\/|[A-Za-z]:[\\/])/.test(path)) throw fail('uasrv.invalid_value', 'path must be absolute');
          const dir = path.length > 1 ? path.replace(/[\\/]+$/, '') : path;
          const names = engine.folders[dir];
          if (!names) {
            const cut = dir.lastIndexOf('/');
            const isFile = engine.folders[cut > 0 ? dir.slice(0, cut) : '/']?.includes(dir.slice(cut + 1));
            throw fail(isFile ? 'uasrv.invalid_value' : 'uasrv.filesystem_error', isFile ? 'path is a file' : 'no folder at path');
          }
          const fold = (n: string) => n.replace(/[A-Z]/g, (c) => c.toLowerCase());
          const bytes = (n: string) => new TextEncoder().encode(n);
          const compare = (a: Uint8Array, b: Uint8Array) => {
            for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i]! - b[i]!;
            return a.length - b.length;
          };
          const files = names
            .map((raw) => ({ name: raw.replace(/\/$/, ''), is_directory: raw.endsWith('/') }))
            .filter((e) => !e.name.startsWith('.'))
            .sort((a, b) => compare(bytes(fold(a.name)), bytes(fold(b.name))) || compare(bytes(a.name), bytes(b.name)))
            .map((e) => ({ name: e.name, path: `${dir === '/' ? '' : dir}/${e.name}`, is_directory: e.is_directory }));
          return { files };
        },
        show_save_dialog: (_data, engine) => {
          const uid = `fc${engine.nextRow()}`;
          engine.addNode(`/gui/file_chooser/${uid}`, { properties: { status: 'pending', files: [] } });
          setTimeout(() => {
            if (!engine.has(`/gui/file_chooser/${uid}`)) return;
            engine.setValue(`/gui/file_chooser/${uid}`, 'files', engine.nextDialogFiles.map((p) => ({ path: p })));
            engine.setValue(`/gui/file_chooser/${uid}`, 'status', engine.nextDialogFiles.length ? 'selected' : 'cancelled');
          }, 5);
          return { uid };
        },
      },
    });
    this.addNode('/gui/windows/main', { properties: { page: 'timeline' } });
    this.addNode('/gui/transport', { properties: { arm_mode: false } });
    this.addNode('/gui/add_ons/com.example.demo', { properties: { id: 'com.example.demo', name: 'Demo', target: 'window', icon: '', floating: true, show_with_session: false, manufacturer: 'Example Co' } });
    this.addNode('/gui/file_chooser');
    if (options.gui === false) this.removeNode('/gui');
  }

  /** What the next mock file dialog "selects"; empty means the user cancelled. */
  nextDialogFiles: string[] = [];

  /**
   * The disk `/gui/list_files` reads: each folder's absolute path to the names inside it,
   * a trailing `/` marking a subfolder. A name starting with `.` is hidden, as in LUNA.
   *
   * @example
   * engine.folders['/Samples'] = ['kick.wav', 'Loops/', '.DS_Store'];
   */
  folders: Record<string, string[]> = {};

  private rowCounter = 100;
  /** @internal */
  nextRow(): number {
    return ++this.rowCounter;
  }

  /** @internal Find a control node by its `uid` property. */
  /**
   * Route `output` to the bus at `busPath` the way LUNA records it (fact 83): append a row to
   * `assignments` and add an `assignment_objects/<uid>` node. Returns the assignment uid.
   */
  addAssignment(output: string, busUid: string, busPath: string): string {
    const uid = `asg${this.nextRow()}`;
    const name = String(this.value(busPath, 'name') ?? busUid);
    const stem = String(this.value(busPath, 'stem_format') ?? 'stereo');
    const busType = this.value(busPath, 'bus_type');
    const desc = { bus_uid: busUid, name, stem_format: stem, is_bus: 'true', sidechain_in_use: 'false' };
    this.addNode(`${output}/assignment_objects/${uid}`, {
      properties: { type: 'assignment', rowid: this.nextRow(), uid, bus_uid: busUid, output_node_uid: busUid, connection_error: '', output_desc: desc },
      readOnly: ['type', 'rowid', 'uid', 'bus_uid', 'output_node_uid', 'connection_error', 'output_desc'],
    });
    const rows = (this.value(output, 'assignments') as unknown[] | undefined) ?? [];
    this.setValue(output, 'assignments', [...rows, { connection_error: null, name, stem_format: stem, type: typeof busType === 'string' ? busType : null, value: busUid, sidechain_in_use: 'false' }]);
    return uid;
  }

  /** @internal Remove one destination: its `assignments` row and its object, which share an index. */
  removeAssignment(output: string, uid: string): void {
    const index = this.children(`${output}/assignment_objects`).indexOf(uid);
    if (index < 0) return;
    const rows = [...((this.value(output, 'assignments') as unknown[] | undefined) ?? [])];
    rows.splice(index, 1);
    this.removeNode(`${output}/assignment_objects/${uid}`);
    this.setValue(output, 'assignments', rows);
  }

  /** @internal A deleted bus does not cascade: assignments to it stay, marked `device.missing_bus` (fact 83). */
  danglingAssignments(sessionUid: string, busUid: string): void {
    const base = `/sessions/${sessionUid}`;
    for (const kind of ['tracks', 'buses']) {
      for (const ch of this.children(`${base}/${kind}`)) {
        for (const out of this.children(`${base}/${kind}/${ch}/outputs`)) {
          const output = `${base}/${kind}/${ch}/outputs/${out}`;
          const objects = this.children(`${output}/assignment_objects`);
          const rows = (this.value(output, 'assignments') as Array<Record<string, unknown>> | undefined) ?? [];
          if (!rows.some((r) => r['value'] === busUid)) continue;
          for (const uid of objects) {
            const object = `${output}/assignment_objects/${uid}`;
            if (this.value(object, 'bus_uid') !== busUid) continue;
            this.setValue(object, 'output_node_uid', null);
            this.setValue(object, 'connection_error', 'device.missing_bus');
          }
          this.setValue(output, 'assignments', rows.map((r) => (r['value'] === busUid ? { ...r, value: null, connection_error: 'device.missing_bus' } : r)));
        }
      }
    }
  }

  controlPathByUid(uid: string): string | undefined {
    for (const [path, node] of this.nodes) {
      if (node.properties.get('control_type') !== undefined && node.properties.get('uid') === uid) return path;
    }
    return undefined;
  }

  /** Add a plugin to the catalog. */
  addPlugin(pluginId: string, options: { name?: string; manufacturer?: string; categories?: string[] } = {}): void {
    this.addNode(`/plugins/${pluginId}`, {
      properties: {
        plugin_id: pluginId,
        name: options.name ?? pluginId,
        version: '1.0.0',
        description: '',
        installed: true,
        favorite: false,
        authorized: null,
        default_preset_uid: null,
        manifest: { manufacturer: options.manufacturer ?? 'Mock', name: options.name ?? pluginId, plugin_id: pluginId, categories: options.categories ?? [], short_names: [] },
      },
    });
  }

  /** Add a preset for a plugin to the library (fact 98). Returns its uid. */
  addPreset(pluginId: string, name: string, options: { uid?: string; factory?: boolean; favorite?: boolean; version?: number } = {}): string {
    const root = `/presets/plugins/${pluginId}/presets`;
    const uid = options.uid ?? `preset_${this.children(root).length + 1}_${pluginId}`;
    this.addNode(`${root}/${uid}`, {
      properties: { uid, preset_name: name, version: options.version ?? 1, favorite: options.favorite ?? false, factory: options.factory ?? false, path: '' },
    });
    return uid;
  }

  /** Register a session package in the workspace. */
  addPackage(uid: string, options: { name?: string; lastOpened?: number; favorite?: boolean } = {}): void {
    this.addNode(`/workspace/sessions/${uid}`, {
      properties: { uid, file_name: `${options.name ?? uid}.luna`, directory_path: `/tmp/${options.name ?? uid}`, session_type: 'default', factory: false, favorite: options.favorite ?? false, created: options.lastOpened ?? 0, modified: 0, last_opened: options.lastOpened ?? 0, comments: '' },
    });
  }

  /** A new client connection. */
  port(): MockPort {
    const port = new MockPort(this);
    this.ports.add(port);
    return port;
  }

  // ---------------------------------------------------------------------------------------
  // Tree building
  // ---------------------------------------------------------------------------------------

  /** Create a node (and any missing ancestors). Pushes `added` to subscribers. */
  addNode(path: string, spec: MockNodeSpec = {}): void {
    const clean = normalize(path);
    if (clean !== '/' && !this.nodes.has(parentOf(clean))) this.addNode(parentOf(clean));
    const node: MockNode = {
      properties: new Map(Object.entries(spec.properties ?? {})),
      readOnly: new Set(spec.readOnly ?? []),
      commands: new Map(Object.entries(spec.commands ?? {})),
      children: [],
    };
    const existed = this.nodes.has(clean);
    this.nodes.set(clean, node);
    if (clean !== '/') {
      const parent = this.nodes.get(parentOf(clean));
      const name = splitPath(clean).name;
      if (parent && !parent.children.includes(name)) parent.children.push(name);
    }
    if (!existed && clean !== '/') this.push({ path: clean, operation: 'added' }, undefined);
  }

  /** Remove a node and its subtree. Pushes `removed` to subscribers. */
  removeNode(path: string): void {
    const clean = normalize(path);
    if (!this.nodes.has(clean)) return;
    for (const key of [...this.nodes.keys()]) {
      if (key === clean || key.startsWith(clean + '/')) this.nodes.delete(key);
    }
    const parent = this.nodes.get(parentOf(clean));
    const name = splitPath(clean).name;
    if (parent) parent.children = parent.children.filter((c) => c !== name);
    this.push({ path: clean, operation: 'removed' }, undefined);
  }

  /** Engine-side property change: updates the tree and pushes to every subscribed port. */
  setValue(nodePath: string, property: string, value: unknown): void {
    const clean = normalize(nodePath);
    const node = this.nodes.get(clean);
    if (!node) throw new Error(`MockEngine: no node ${nodePath}`);
    node.properties.set(property, value);
    this.push({ path: `${clean}/${property}/value`, data: value }, undefined);
    // Stopped, the location follows the play start (fact 90) — engine-side too, so a test
    // moving the play start behaves like LUNA whichever side set it.
    if (property === 'play_start' && /^\/sessions\/[^/]+$/.test(clean) && node.properties.get('playing') !== true) {
      this.setValue(clean, 'location', this.locationAt(clean, Number(value)));
    }
  }

  /**
   * The session `location` LUNA reports for `tick`: bar|beat from the session's time
   * signatures, whose `bar` numbers need not put bar 1 at tick 0 (fact 91), and `min_sec`
   * from the tempo map (fact 96).
   */
  locationAt(sessionPath: string, tick: number): Record<string, unknown> {
    const beatTicks = 96_000_000_000; // Luna.TICKS_PER_BEAT; the wire layer does not import the model
    const sigs = this.children(`${sessionPath}/time_signatures`)
      .map((id) => this.nodes.get(`${sessionPath}/time_signatures/${id}`)!.properties)
      .map((p) => ({ tick: Number(p.get('tick') ?? 0), bar: Number(p.get('bar') ?? 1), n: Number(p.get('numerator') ?? 4), d: Number(p.get('denominator') ?? 4) }))
      .sort((a, b) => a.tick - b.tick);
    const sig = sigs.filter((x) => x.tick <= tick).at(-1) ?? sigs[0] ?? { tick: 0, bar: 1, n: 4, d: 4 };
    const beat = (beatTicks * 4) / sig.d;
    const rel = tick - sig.tick;
    const inBar = ((rel % (beat * sig.n)) + beat * sig.n) % (beat * sig.n);
    const seconds = this.secondsAt(sessionPath, tick);
    const previous = this.nodes.get(sessionPath)?.properties.get('location') as { tempo?: number } | undefined;
    return {
      tick,
      bar_beat: { bar: sig.bar + Math.floor(rel / (beat * sig.n)), beat: 1 + Math.floor(inBar / beat), tick: inBar % beat },
      min_sec: { minutes: Math.floor(seconds / 60), seconds: seconds % 60 },
      tempo: previous?.tempo ?? 120,
      time_signature: { numerator: sig.n, denominator: sig.d },
      playing: this.nodes.get(sessionPath)?.properties.get('playing') === true,
    };
  }

  /** Seconds at `tick`, integrating the session's tempo map (constant tempo between events). */
  private secondsAt(sessionPath: string, tick: number): number {
    const beatTicks = 96_000_000_000;
    const tempos = this.children(`${sessionPath}/tempo_map`)
      .map((id) => this.nodes.get(`${sessionPath}/tempo_map/${id}`)!.properties)
      .map((p) => ({ tick: Number(p.get('tick') ?? 0), tempo: Number(p.get('tempo') ?? 120) }))
      .sort((a, b) => a.tick - b.tick);
    if (tempos.length === 0) return (tick / beatTicks) * 0.5;
    let seconds = 0;
    let at = 0;
    let tempo = tempos[0]!.tempo;
    for (const t of tempos) {
      if (t.tick >= tick) break;
      if (t.tick > at) {
        seconds += ((t.tick - at) / beatTicks) * (60 / tempo);
        at = t.tick;
      }
      tempo = t.tempo;
    }
    return Math.max(0, seconds + ((tick - at) / beatTicks) * (60 / tempo));
  }

  /**
   * A MIDI clip's table (facts 39-41): apply `rows` and push the matching delta, exactly as
   * LUNA does — the stored property stays the whole table, so a `get` answers the table
   * while subscribers see only the delta.
   *
   * `added` and `changed` carry rows; `deleted` needs only their `rowid`s. Rows given
   * without a `rowid` get the next free one. Ticks are table ticks.
   *
   * @example
   * engine.midiEdit(clipPath, 'added', [{ tick: 0, status: 0x90, data1: 60, data2: 100 }]);
   * engine.midiEdit(clipPath, 'deleted', [{ rowid: 1 }]);
   */
  midiEdit(clipPath: string, operation: 'added' | 'changed' | 'deleted', rows: MockMidiRow[]): void {
    const table = `${normalize(clipPath)}/midi/table`;
    if (!this.nodes.has(table)) this.addNode(table, { properties: { row_data: EMPTY_MIDI_TABLE() } });
    const stored = decodeMidiTable(this.value(table, 'row_data'));
    let next = stored.length ? Math.max(...stored.map((r) => r.rowid)) + 1 : 1;
    const applied: Required<MockMidiRow>[] = [];
    for (const row of rows) {
      const rowid = row.rowid ?? next++;
      if (operation === 'deleted') {
        applied.push({ rowid, tick: 0, status: 0, data1: 0, data2: 0, enabled: true });
        continue;
      }
      const merged = { rowid, tick: row.tick ?? 0, status: row.status ?? 0x90, data1: row.data1 ?? 60, data2: row.data2 ?? 0, enabled: row.enabled ?? true };
      applied.push(merged);
    }
    const kept = operation === 'deleted' ? stored.filter((r) => !applied.some((a) => a.rowid === r.rowid)) : [...stored.filter((r) => !applied.some((a) => a.rowid === r.rowid)), ...applied];
    const node = this.nodes.get(table);
    node?.properties.set('row_data', encodeMidiTable('update', kept));
    this.push({ path: `${table}/row_data/value`, data: operation === 'deleted' ? { operation, row_ids: applied.map((r) => r.rowid) } : encodeMidiTable(operation, applied) }, undefined);
  }

  /**
   * Drive a render to a terminal state, the way LUNA's engine would (fact 44). With
   * `percent` only, it reports progress without finishing.
   *
   * @example
   * engine.finishRender(uid, { percent: 50 });
   * engine.finishRender(uid, { state: 'completed' });
   */
  finishRender(uid: string, options: { percent?: number; state?: 'completed' | 'aborted' | 'failed'; error?: string; remove?: boolean } = {}): void {
    const path = `/renders/${uid}`;
    if (!this.has(path)) throw new Error(`MockEngine: no render ${uid}`);
    if (options.percent !== undefined) this.setValue(path, 'percent_complete', options.percent);
    if (options.error !== undefined) this.setValue(path, 'error_message', options.error);
    if (options.state) {
      if (options.state === 'completed') this.setValue(path, 'percent_complete', 100);
      this.setValue(path, 'state', options.state);
    }
    if (options.remove) this.removeNode(path);
  }

  /** @internal The rows of a clip's MIDI table, decoded. */
  midiRows(clipPath: string): Required<MockMidiRow>[] {
    return decodeMidiTable(this.value(`${normalize(clipPath)}/midi/table`, 'row_data'));
  }

  /**
   * @internal The rows `selection_notes` names, per clip. The selection holds
   * `[pitch, start, stop, rowid]` in absolute ticks, so rows are matched by rowid and the
   * note-off that terminates each one is included.
   */
  selectedRows(sessionBase: string): Map<string, Array<Required<MockMidiRow> & { noteOn: boolean }>> {
    const out = new Map<string, Array<Required<MockMidiRow> & { noteOn: boolean }>>();
    const selection = this.value(`${sessionBase}/contexts/main`, 'selection_notes');
    if (!Array.isArray(selection)) return out;
    for (const entry of selection as Array<{ playlist_uid?: string; notes?: number[][] }>) {
      const playlist = entry?.playlist_uid;
      if (!playlist || !Array.isArray(entry.notes)) continue;
      const rowids = new Set(entry.notes.map((n) => n[3]).filter((v): v is number => typeof v === 'number'));
      for (const clipUid of this.children(`${sessionBase}/playlists/${playlist}/clips`)) {
        const clip = `${sessionBase}/playlists/${playlist}/clips/${clipUid}`;
        const rows = this.midiRows(clip);
        const picked: Array<Required<MockMidiRow> & { noteOn: boolean }> = [];
        for (const row of rows) {
          if (!rowids.has(row.rowid)) continue;
          picked.push({ ...row, noteOn: true });
          // The note-off that ends it: the next row of the same pitch and channel.
          const off = rows.find((r) => r.tick >= row.tick && r.rowid !== row.rowid && (r.data1 === row.data1) && ((r.status & 0xf0) === 0x80 || ((r.status & 0xf0) === 0x90 && r.data2 === 0)) && (r.status & 0x0f) === (row.status & 0x0f));
          if (off && !picked.some((p) => p.rowid === off.rowid)) picked.push({ ...off, noteOn: false });
        }
        if (picked.length) out.set(clip, picked);
      }
    }
    return out;
  }

  /** @internal The path of a clip by uid, across every playlist of a session. */
  findClip(sessionBase: string, clipUid: string): string | undefined {
    for (const pl of this.children(`${sessionBase}/playlists`)) {
      const path = `${sessionBase}/playlists/${pl}/clips/${clipUid}`;
      if (this.has(path)) return path;
    }
    return undefined;
  }

  /** Read a property directly (no port involved). */
  value(nodePath: string, property: string): unknown {
    return this.nodes.get(normalize(nodePath))?.properties.get(property);
  }

  has(path: string): boolean {
    return this.nodes.has(normalize(path));
  }

  children(nodePath: string): string[] {
    return [...(this.nodes.get(normalize(nodePath))?.children ?? [])];
  }

  /** @internal Uploads between `begin` and `end` (fact 42). */
  readonly imports = new Map<string, { pkg: string; name: string; bytes: number; content: string }>();
  /** @internal Uploaded content (package and base64) to the source it was filed as, for fact 42's de-duplication. */
  readonly uploaded = new Map<string, string>();

  /**
   * Replace the handler of the command at `path` (for example
   * `/sessions/abc/set_marker`), to reproduce a verb that answers without acting (fact 71).
   *
   * @example
   * engine.overrideCommand('/sessions/abc/delete_clip', () => null);
   */
  overrideCommand(path: string, handler: CommandHandler): void {
    const { node: nodePath, name } = splitPath(normalize(path));
    const node = this.nodes.get(nodePath);
    if (!node || !node.commands.has(name)) throw new UAError('uasrv.invalid_object', `overrideCommand: no command at ${path}`, { path });
    node.commands.set(name, handler);
  }

  /** Make the next `times` requests on `path` fail with `code`. */
  fail(path: string, code: string, times = 1): void {
    this.faults.set(normalize(path), { code, remaining: times });
  }

  /**
   * Convenience: a session shaped like LUNA's, with a transport, a master bus, named tracks
   * (each with `outputs/main/controls/{gain,pan,mute}`, `controls/solo`, a meter and one
   * playlist), and the session-level commands the SDK uses.
   */
  addSession(uid: string, options: { tracks?: string[]; name?: string; focused?: boolean; packageUid?: string } = {}): void {
    const base = `/sessions/${uid}`;
    const pkg = options.packageUid ?? `pkg_${uid}`;
    const sessionCommands: Record<string, CommandHandler> = {
      new_track: (data, engine) => {
        const body = (data ?? {}) as { name?: string; track_type?: string; stem_format?: string };
        // `track_type: "bus"` makes an aux bus, ordered after everything (fact 83).
        if (body.track_type === 'bus') {
          const id = `bus${engine.children(`${base}/buses`).length + 1}`;
          engine.addBus(uid, id, { name: body.name ?? 'Bus', busType: 'aux', stemFormat: body.stem_format ?? 'stereo' });
          return { uid: id };
        }
        const id = `t${engine.children(`${base}/tracks`).length + 1}`;
        engine.addTrack(uid, id, { name: body.name ?? 'Untitled', trackType: body.track_type ?? 'audio', stemFormat: body.stem_format ?? 'mono' });
        return { track_uid: id };
      },
      delete_tracks: (data, engine) => {
        const body = (data ?? {}) as { track_uid?: string | string[] };
        const ids = Array.isArray(body.track_uid) ? body.track_uid : body.track_uid ? [body.track_uid] : [];
        for (const id of ids) {
          if (engine.has(`${base}/buses/${id}`)) {
            engine.removeNode(`${base}/buses/${id}`);
            engine.danglingAssignments(uid, id);
          } else engine.removeNode(`${base}/tracks/${id}`);
        }
        return { deleted_channels: ids };
      },
      duplicate_tracks: (data, engine) => {
        const body = (data ?? {}) as { track_uid?: string[] };
        const out: string[] = [];
        for (const id of body.track_uid ?? []) {
          const copy = `${id}_copy`;
          engine.addTrack(uid, copy, { name: `${String(engine.value(`${base}/tracks/${id}`, 'name'))} copy` });
          out.push(copy);
        }
        return { duplicated_channels: out.map((id) => ({ channel_id: id })) };
      },
      begin_transaction: (_d, engine) => {
        engine.transactions.push('begin');
        return null;
      },
      commit_transaction: (_d, engine) => {
        engine.transactions.push('commit');
        return null;
      },
      abort_transaction: (_d, engine) => {
        engine.transactions.push('abort');
        return null;
      },
      undo: () => ({ did_undo: true }),
      redo: () => ({ did_redo: true }),
      save_session: () => null,
      // While playing, 'now' restarts from the play start; next_bar and loop_end defer, and
      // stopped it does nothing (fact 90). The mock applies 'now' only.
      sync_playback: (data, engine) => {
        const body = (data ?? {}) as { session_uid?: string; next_bar?: boolean; loop_end?: boolean };
        const path = `/sessions/${body.session_uid}`;
        if (engine.value(path, 'playing') === true && !body.next_bar && !body.loop_end) engine.setValue(path, 'location', engine.locationAt(path, Number(engine.value(path, 'play_start') ?? 0)));
        return null;
      },
      import_files: () => null,
      export_session: (data, engine) => {
        const body = (data ?? {}) as { session_uid?: string; bounce_name?: string; realtime?: boolean };
        const uid = `export_${engine.children('/renders').length + 1}`;
        const name = body.bounce_name ?? 'Export';
        engine.addNode(`/renders/${uid}`, {
          properties: {
            uid,
            name,
            type: 'export',
            session_uid: body.session_uid ?? '',
            state: 'running',
            percent_complete: 0,
            error_message: null,
            render_is_offline: body.realtime !== true,
            time_remaining: body.realtime === true ? 0 : undefined,
            total_samples: 0,
          },
        });
        return { render_uid: uid, file: `/exports/${name} - MAIN.wav` };
      },
      insert_clip: (data, engine) => {
        const body = (data ?? {}) as { playlist_uid?: string; track_uid?: string; name?: string; start?: number; stop?: number; source_uid?: string; source_start?: number; source_stop?: number; clip_type?: number };
        const playlist = body.playlist_uid ?? (body.track_uid ? String(engine.value(`${base}/tracks/${body.track_uid}`, 'playlist_uid')) : undefined);
        if (!playlist) throw new UAError('uasrv.invalid_object', 'insert_clip: no playlist', { cmd: 'post', path: `${base}/insert_clip` });
        const id = `clip${engine.children(`${base}/playlists/${playlist}/clips`).length + 1}`;
        engine.addNode(`${base}/playlists/${playlist}/clips/${id}`, {
          properties: { uid: id, name: body.name ?? 'Clip', start: body.start ?? 0, stop: body.stop ?? 0, source_uid: body.source_uid ?? '', source_start: body.source_start ?? 0, source_stop: body.source_stop ?? 0, clip_type: body.clip_type ?? 0, gain: 0, bypass: false, midi_source_start: 0, layer: 0, mute: false },
        });
        // A MIDI clip carries its events in a table child (fact 39).
        if (body.clip_type === 2) engine.addNode(`${base}/playlists/${playlist}/clips/${id}/midi/table`, { properties: { row_data: EMPTY_MIDI_TABLE() } });
        return { uid: id };
      },
      delete_clip: (data, engine) => {
        const body = (data ?? {}) as { uid?: string };
        for (const pl of engine.children(`${base}/playlists`)) {
          if (engine.has(`${base}/playlists/${pl}/clips/${body.uid}`)) engine.removeNode(`${base}/playlists/${pl}/clips/${body.uid}`);
        }
        return null;
      },
      bring_to_front: () => null,
      send_to_back: () => null,
      new_playlists: (data, engine) => {
        const body = (data ?? {}) as { track_uid?: string[] };
        for (const t of body.track_uid ?? []) {
          const n = engine.children(`${base}/playlists`).filter((p) => engine.value(`${base}/playlists/${p}`, 'track_uid') === t).length + 1;
          engine.addNode(`${base}/playlists/pl_${t}_${n}`, { properties: { uid: `pl_${t}_${n}`, name: `V${n}`, track_uid: t, version: n, stem_format: 'mono', frozen: false } });
          engine.addNode(`${base}/playlists/pl_${t}_${n}/clips`);
        }
        return null;
      },
      set_playlists: () => null,
      set_inserts: (data, engine) => {
        const body = (data ?? {}) as { channel_uid?: string; inserts?: { insert_type?: string; index?: number; plugin_id?: string; plugin_name?: string; preset_name?: string; preset_uid?: string }[] };
        const channel = engine.has(`${base}/tracks/${body.channel_uid}`) ? `${base}/tracks/${body.channel_uid}` : `${base}/buses/${body.channel_uid}`;
        for (const ins of body.inserts ?? []) {
          const slot = ins.insert_type ?? `effect_${ins.index ?? 0}`;
          const path = `${channel}/effects/${slot}`;
          if (!engine.has(path)) throw new UAError('uasrv.invalid_object', `set_inserts: no slot ${slot}`, { cmd: 'post', path: `${base}/set_inserts` });
          const empty = !ins.plugin_id;
          const known = !empty && engine.has(`/plugins/${ins.plugin_id}`);
          // Fact 86: the slot keeps the id it was given; `plugin_name` stays null (the catalog
          // has the name); a loaded plugin gets an `external_sdk_instance_id`; an unknown id
          // answers null and leaves `plugin_error` on the slot.
          engine.setValue(path, 'plugin_id', empty ? null : ins.plugin_id);
          engine.setValue(path, 'plugin_name', null);
          // Preset identity rides in the same call and lands only with a plugin id. A
          // `preset_uid` makes LUNA load that preset onto the effect, which stamps the
          // library's own name over any `preset_name` the caller sent (fact 99).
          if (!empty && ins.preset_name !== undefined) engine.setValue(path, 'preset_name', ins.preset_name);
          if (!empty && ins.preset_uid !== undefined) {
            engine.setValue(path, 'preset_uid', ins.preset_uid);
            const preset = `/presets/plugins/${ins.plugin_id}/presets/${ins.preset_uid}`;
            if (engine.has(preset)) engine.setValue(path, 'preset_name', engine.value(preset, 'preset_name'));
          }
          engine.setValue(path, 'plugin_error', empty || known ? null : 'mixer.missing_plug-in');
          engine.setValue(path, 'external_sdk_instance_id', known ? engine.nextRow() : null);
          if (empty || !known) {
            engine.setValue(path, 'bypass_control', null);
            // Clearing leaves the old parameters behind as ghosts, `initialized: null` (fact 86).
            for (const c of engine.children(`${path}/controls`)) {
              engine.setValue(`${path}/controls/${c}`, 'initialized', null);
              engine.setValue(`${path}/controls/${c}`, 'normalized_value', null);
            }
          } else {
            engine.setValue(path, 'bypass_control', 'bypass');
            engine.setValue(path, 'bypass_control_active_low', false);
            engine.addControl(`${path}/controls/bypass`, 'parameter', { discrete: true, value: 1, real: true, str: 'in', automatable: true });
            engine.addControl(`${path}/controls/input`, 'parameter', { discrete: false, value: 0.5, real: 0, str: '0.0', automatable: true, normalized: 0.5 });
          }
        }
        return null;
      },
      set_tempo: (data, engine) => {
        const body = (data ?? {}) as { tempo?: number; tick?: number };
        const tick = body.tick ?? 0;
        const existing = engine.children(`${base}/tempo_map`).find((id) => engine.value(`${base}/tempo_map/${id}`, 'tick') === tick);
        if (existing) engine.setValue(`${base}/tempo_map/${existing}`, 'tempo', body.tempo ?? 120);
        else engine.addNode(`${base}/tempo_map/${engine.children(`${base}/tempo_map`).length + 1}`, { properties: { tick, time: 0, tempo: body.tempo ?? 120 } });
        return { tempo: body.tempo, position_ticks: tick };
      },
      delete_tempo: (data, engine) => {
        const body = (data ?? {}) as { tick?: number };
        for (const id of engine.children(`${base}/tempo_map`)) if (engine.value(`${base}/tempo_map/${id}`, 'tick') === body.tick && body.tick !== 0) engine.removeNode(`${base}/tempo_map/${id}`);
        return null;
      },
      set_time_signature: (data, engine) => {
        const body = (data ?? {}) as { numerator?: number; denominator?: number; bar?: number };
        const id = engine.children(`${base}/time_signatures`).length + 1;
        engine.addNode(`${base}/time_signatures/${id}`, { properties: { tick: 0, bar: body.bar ?? 1, partial: false, numerator: body.numerator ?? 4, denominator: body.denominator ?? 4 } });
        return null;
      },
      set_key_signature: () => null,
      set_automode_on_tracks: (data, engine) => {
        const body = (data ?? {}) as { tracks?: string[]; automation_mode?: number };
        const names = ['off', 'read', 'write', 'touch', 'latch'];
        for (const t of body.tracks ?? []) if (engine.has(`${base}/tracks/${t}`)) engine.setValue(`${base}/tracks/${t}`, 'automation_mode', names[body.automation_mode ?? 1] ?? 'read');
        return null;
      },
      insert_bp: (data, engine) => {
        const body = (data ?? {}) as { control_uid?: string; values?: { location: number; value: unknown }[]; start?: number; stop?: number };
        const ctl = engine.controlPathByUid(body.control_uid ?? '');
        if (!ctl) throw new UAError('uasrv.invalid_object', 'insert_bp: unknown control', { cmd: 'post', path: `${base}/insert_bp` });
        if (body.start !== undefined && body.stop !== undefined) {
          for (const id of engine.children(`${ctl}/automation`)) {
            const t = Number(engine.value(`${ctl}/automation/${id}`, 'start'));
            if (t >= body.start && t <= body.stop) engine.removeNode(`${ctl}/automation/${id}`);
          }
        }
        for (const v of body.values ?? []) engine.addNode(`${ctl}/automation/${engine.nextRow()}`, { properties: { start: v.location, value: wireFloat(v.value) } });
        return null;
      },
      delete_bp: (data, engine) => {
        const body = (data ?? {}) as { control_uid?: string; start?: number; stop?: number };
        const ctl = engine.controlPathByUid(body.control_uid ?? '');
        if (!ctl) return null;
        for (const id of engine.children(`${ctl}/automation`)) {
          const t = Number(engine.value(`${ctl}/automation/${id}`, 'start'));
          if (t === body.start || (body.stop !== undefined && t >= (body.start ?? 0) && t <= body.stop)) engine.removeNode(`${ctl}/automation/${id}`);
        }
        return null;
      },
      move_bp: (data, engine) => {
        const body = (data ?? {}) as { control_uid?: string; location?: number; new_location?: number };
        const ctl = engine.controlPathByUid(body.control_uid ?? '');
        if (!ctl) return null;
        for (const id of engine.children(`${ctl}/automation`)) {
          const path = `${ctl}/automation/${id}`;
          if (Number(engine.value(path, 'start')) === body.location) {
            engine.setValue(path, 'start', body.new_location ?? body.location);
            break;
          }
        }
        return null;
      },
      trim_bp: (data, engine) => {
        const body = (data ?? {}) as { control_uid?: string; location?: number; value?: unknown };
        const ctl = engine.controlPathByUid(body.control_uid ?? '');
        if (!ctl) return null;
        for (const id of engine.children(`${ctl}/automation`)) {
          const path = `${ctl}/automation/${id}`;
          if (Number(engine.value(path, 'start')) === body.location) {
            engine.setValue(path, 'value', wireFloat(body.value));
            break;
          }
        }
        return null;
      },
      /**
       * Routing, as measured (facts 43, 83): LUNA **appends**; each destination is a row of the
       * output's `assignments` (`value` is the bus uid) and an `assignment_objects/<uid>` node,
       * whose uid is the handle for deletion. The output's own `bus_uid` stays null.
       */
      new_output_assignment: (data, engine) => {
        const body = (data ?? {}) as { track_uid?: string; bus_src_uid?: string; output_type?: string; bus_uid?: string };
        const cmdPath = `${base}/new_output_assignment`;
        const channel = body.track_uid !== undefined ? `${base}/tracks/${body.track_uid}` : `${base}/buses/${body.bus_src_uid}`;
        const outputType = body.output_type ?? 'main';
        const bus = `${base}/buses/${body.bus_uid}`;
        if (body.bus_src_uid !== undefined && String(engine.value(channel, 'bus_type') ?? '').startsWith('cue_')) {
          throw new UAError('device.database_error', 'new_output_assignment: a cue bus cannot be a source', { cmd: 'post', path: cmdPath });
        }
        if (!engine.has(channel) || !engine.has(bus) || outputType.startsWith('cue_') || !engine.has(`${channel}/outputs/${outputType}`)) {
          throw new UAError('uasrv.invalid_type', 'new_output_assignment: uasrv.invalid_type', { cmd: 'post', path: cmdPath });
        }
        return { uid: engine.addAssignment(`${channel}/outputs/${outputType}`, String(body.bus_uid), bus) };
      },
      delete_output_assignment: (data, engine) => {
        const body = (data ?? {}) as { uid?: string };
        const cmdPath = `${base}/delete_output_assignment`;
        const target = String(body.uid ?? '');
        for (const kind of ['tracks', 'buses']) {
          for (const ch of engine.children(`${base}/${kind}`)) {
            if (ch === target) throw new UAError('device.database_error', 'delete_output_assignment: a channel uid is not an assignment', { cmd: 'post', path: cmdPath });
            for (const out of engine.children(`${base}/${kind}/${ch}/outputs`)) {
              const output = `${base}/${kind}/${ch}/outputs/${out}`;
              if (engine.children(`${output}/assignment_objects`).includes(target)) {
                engine.removeAssignment(output, target);
                return null;
              }
            }
          }
        }
        throw new UAError('uasrv.invalid_type', 'delete_output_assignment: uasrv.invalid_type', { cmd: 'post', path: cmdPath });
      },
      /** Moves the routing under new assignment uids and copies the slot's control values; the source keeps its values (fact 83). */
      move_send: (data, engine) => {
        const body = (data ?? {}) as { source_uid?: string; source?: string; destination_uid?: string; destination?: string; copy?: boolean };
        const find = (channelUid: string, out: string): string | undefined => {
          for (const kind of ['tracks', 'buses']) {
            const path = `${base}/${kind}/${channelUid}/outputs/${out}`;
            if (engine.has(path)) return path;
          }
          return undefined;
        };
        const from = find(body.source_uid ?? '', body.source ?? '');
        const to = find(body.destination_uid ?? '', body.destination ?? '');
        if (!from || !to) throw new UAError('uasrv.invalid_object', 'move_send: no such send', { cmd: 'post', path: `${base}/move_send` });
        const rows = (engine.value(from, 'assignments') as Array<{ value: string | null }> | undefined) ?? [];
        for (const row of rows) if (row.value) engine.addAssignment(to, row.value, `${base}/buses/${row.value}`);
        for (const name of engine.children(`${from}/controls`)) {
          if (engine.has(`${to}/controls/${name}`)) for (const prop of ['value', 'real_value', 'normalized_value', 'string_value']) engine.setValue(`${to}/controls/${name}`, prop, engine.value(`${from}/controls/${name}`, prop));
        }
        if (body.copy !== true) for (const uid of [...engine.children(`${from}/assignment_objects`)]) engine.removeAssignment(from, uid);
        return null;
      },
      add_midi: (data, engine) => {
        const body = (data ?? {}) as { midi?: Array<{ clip_uid?: string; tick?: number; byte_0?: number; byte_1?: number; byte_2?: number }> };
        for (const [clipUid, rows] of groupByClip(body.midi ?? [])) {
          const path = engine.findClip(base, clipUid);
          if (!path) continue;
          engine.midiEdit(
            path,
            'added',
            rows.map((r) => ({ tick: r.tick ?? 0, status: r.byte_0 ?? 0x90, data1: r.byte_1 ?? 60, data2: r.byte_2 ?? 0 })),
          );
        }
        return null;
      },
      move_clips: () => null,
      set_bar_one: () => null,
      set_marker: (data, engine) => {
        const body = (data ?? {}) as { rowid?: number; location?: number; name?: string; color?: number; comments?: string };
        // A rowid that matches nothing answers null and changes nothing (fact 71).
        if (body.rowid !== undefined && !engine.has(`${base}/markers/${body.rowid}`)) return null;
        const id = body.rowid ?? engine.nextRow();
        const path = `${base}/markers/${id}`;
        if (engine.has(path)) {
          if (body.name !== undefined) engine.setValue(path, 'name', body.name);
          if (body.location !== undefined) engine.setValue(path, 'location', body.location);
          if (body.color !== undefined) engine.setValue(path, 'color', body.color);
          if (body.comments !== undefined) engine.setValue(path, 'comments', body.comments);
        } else {
          engine.addNode(path, { properties: { rowid: id, location: body.location ?? 0, name: body.name ?? 'Marker', color: body.color ?? 0, comments: body.comments ?? '' } });
        }
        return { rowid: id };
      },
      delete_marker: (data, engine) => {
        const body = (data ?? {}) as { rowid?: number };
        engine.removeNode(`${base}/markers/${body.rowid}`);
        return null;
      },
      set_chord: (data, engine) => {
        const body = (data ?? {}) as { rowid?: number; location?: number; name?: string };
        if (body.rowid !== undefined) {
          const path = `${base}/chords/${body.rowid}`;
          if (!engine.has(path)) throw new UAError('device.database_error', 'set_chord: no such rowid', { cmd: 'post', path: `${base}/set_chord` });
          if (body.location !== undefined) {
            // deviced deletes whatever sits at the target tick first, this chord included (fact 100).
            const occupant = engine.chordAt(uid, body.location);
            if (occupant !== undefined) engine.removeNode(`${base}/chords/${occupant}`);
            if (engine.has(path)) engine.setValue(path, 'location', body.location);
          }
          if (body.name) engine.setValue(path, 'name', normalizeChordName(body.name));
          return null;
        }
        if (body.location === undefined) throw new UAError('uasrv.missing_field', 'set_chord: location is required to add a chord', { cmd: 'post', path: `${base}/set_chord` });
        engine.addChord(uid, body.location, body.name ?? '');
        return null;
      },
      delete_chord: (data, engine) => {
        const body = (data ?? {}) as { rowid?: number; location?: number; all?: boolean };
        const rows = body.all === true ? engine.children(`${base}/chords`) : body.rowid !== undefined ? [String(body.rowid)] : body.location !== undefined ? [engine.chordAt(uid, body.location)].filter((r) => r !== undefined) : undefined;
        if (!rows) throw new UAError('uasrv.missing_field', 'delete_chord: rowid, location or all is required', { cmd: 'post', path: `${base}/delete_chord` });
        for (const row of rows) engine.removeNode(`${base}/chords/${row}`);
        return null;
      },
    };
    this.addNode(base, {
      properties: {
        uid,
        name: options.name ?? uid,
        loaded: true,
        read_only: false,
        session_package_uid: pkg,
        session_package_path: `/tmp/${uid}.luna`,
        can_undo: false,
        can_redo: false,
        change_count: 0,
        solo_mode: 'latch',
        tempo_established: false,
        command_status: null,
        command_percent_complete: 0,
        playing: false,
        record_enabled: false,
        looping: false,
        play_start: 0,
        loop_start: 0,
        arrangement_start: 0,
        arrangement_end: -1,
        loop_stop: 0,
        location: { tick: 0, bar_beat: { bar: 1, beat: 1, tick: 0 }, min_sec: { minutes: 0, seconds: 0 }, tempo: 120, time_signature: { numerator: 4, denominator: 4 }, playing: false },
        counting_in: false,
        punched_in: false,
        max_tick: 0,
        tempo_percent: 100,
        rec_play_mode: 'normal',
        count_in_enabled: false,
        pre_roll_enabled: false,
        post_roll_enabled: false,
      },
      readOnly: ['uid', 'loaded', 'session_package_uid', 'can_undo', 'can_redo', 'change_count', 'location'],
      commands: sessionCommands,
    });
    this.addNode(`${base}/tracks`);
    this.addNode(`${base}/playlists`);
    this.addNode(`${base}/buses`);
    this.addNode(`${base}/contexts/main`, {
      properties: { context_type: 'main', focus: 'tracks', selection_start: null, selection_stop: null, selection_tracks: null, selection_playlists: null, selection_notes: null, last_selected_track: null, pixels_per_tick: 1e-10, grid_enable: true, grid: '1_4', settings: '{}' },
    });
    this.addNode(`${base}/contexts/main/commands`, {
      commands: {
        set_inserts_in_out: (data, engine) => {
          const body = (data ?? {}) as { channel_uid?: string; inserts?: string[]; value?: boolean };
          const channel = engine.has(`${base}/tracks/${body.channel_uid}`) ? `${base}/tracks/${body.channel_uid}` : `${base}/buses/${body.channel_uid}`;
          for (const slot of body.inserts ?? []) {
            const ctl = engine.value(`${channel}/effects/${slot}`, 'bypass_control');
            if (typeof ctl === 'string' && ctl) engine.setValue(`${channel}/effects/${slot}/controls/${ctl}`, 'value', body.value ? 1 : 0);
          }
          return null;
        },
        /** A command of the edit context, not of the session. */
        trim_clip: (data, engine) => {
          const body = (data ?? {}) as { clip_uid?: string; start?: number; stop?: number };
          const path = engine.findClip(base, body.clip_uid ?? '');
          if (!path) return null; // LUNA answers null for an unknown clip too (fact 71)
          if (body.start !== undefined) engine.setValue(path, 'start', body.start);
          if (body.stop !== undefined) engine.setValue(path, 'stop', body.stop);
          return null;
        },
        select_all: () => null,
        copy: () => null,
        cut: () => null,
        paste: () => null,
        duplicate: () => null,
        /**
         * Acts on `selection_notes`, not on a clip (fact 74): deletes the selected note-on
         * rows and the note-offs that terminate them.
         */
        clear: (_d, engine) => {
          for (const [clip, rows] of engine.selectedRows(base)) engine.midiEdit(clip, 'deleted', rows.map((r) => ({ rowid: r.rowid })));
          return null;
        },
        /** A toggle over the selection (fact 74): flips `enabled` on each selected note-on row. */
        mute_notes: (_d, engine) => {
          for (const [clip, rows] of engine.selectedRows(base)) {
            engine.midiEdit(
              clip,
              'changed',
              rows.filter((r) => r.noteOn).map((r) => ({ rowid: r.rowid, tick: r.tick, status: r.status, data1: r.data1, data2: r.data2, enabled: !r.enabled })),
            );
          }
          return null;
        },
        /**
         * Writes notes onto a playlist, making the MIDI clip to hold them if there is none
         * there, and then **selects** what it made: that is where the caller reads the new
         * row ids from (fact 74).
         */
        create_note: (data, engine) => {
          const body = (data ?? {}) as { playlist_uid?: string; notes?: { note?: number; start?: number; stop?: number; velocity?: number; velocity_on?: number; velocity_off?: number }[]; note?: number; start?: number; stop?: number; velocity?: number };
          const playlist = body.playlist_uid;
          if (!playlist || !engine.has(`${base}/playlists/${playlist}`)) throw new UAError('uasrv.invalid_object', 'create_note: no such playlist', { cmd: 'post', path: `${base}/create_note` });
          type MockNewNote = { note?: number | undefined; start?: number | undefined; stop?: number | undefined; velocity?: number | undefined; velocity_on?: number | undefined; velocity_off?: number | undefined };
          const notes: MockNewNote[] = body.notes ?? (body.note !== undefined ? [{ note: body.note, start: body.start, stop: body.stop, velocity: body.velocity }] : []);
          if (!notes.length) return null;
          const span = { start: Math.min(...notes.map((n) => n.start ?? 0)), stop: Math.max(...notes.map((n) => n.stop ?? 0)) };
          let clipUid = engine.children(`${base}/playlists/${playlist}/clips`).find((uid) => engine.value(`${base}/playlists/${playlist}/clips/${uid}`, 'clip_type') === 2);
          if (!clipUid) {
            clipUid = `midi${engine.children(`${base}/playlists/${playlist}/clips`).length + 1}`;
            engine.addNode(`${base}/playlists/${playlist}/clips/${clipUid}`, {
              properties: { uid: clipUid, name: 'MIDI', start: span.start, stop: span.stop, source_uid: '', source_start: 0, source_stop: 0, clip_type: 2, gain: 0, bypass: false, render_source_uid: null, render_state: 'none', midi_source_start: 0 },
            });
            engine.addNode(`${base}/playlists/${playlist}/clips/${clipUid}/midi/table`, { properties: { row_data: EMPTY_MIDI_TABLE() } });
          }
          const clipPath = `${base}/playlists/${playlist}/clips/${clipUid}`;
          const origin = Number(engine.value(clipPath, 'midi_source_start') ?? 0);
          const before = new Set(engine.midiRows(clipPath).map((r) => r.rowid));
          engine.midiEdit(
            clipPath,
            'added',
            notes.flatMap((n) => [
              { tick: (n.start ?? 0) + origin, status: 0x90, data1: n.note ?? 60, data2: n.velocity_on ?? n.velocity ?? 100 },
              { tick: (n.stop ?? 0) + origin, status: 0x80, data1: n.note ?? 60, data2: n.velocity_off ?? 0 },
            ]),
          );
          // LUNA selects what it created; the note-on rows are what the caller wants.
          const added = engine.midiRows(clipPath).filter((r) => !before.has(r.rowid) && (r.status & 0xf0) === 0x90 && r.data2 > 0);
          engine.setValue(`${base}/contexts/main`, 'focus', 'notes');
          engine.setValue(`${base}/contexts/main`, 'selection_playlists', [playlist]);
          engine.setValue(`${base}/contexts/main`, 'selection_start', span.start);
          engine.setValue(`${base}/contexts/main`, 'selection_stop', span.stop);
          engine.setValue(`${base}/contexts/main`, 'selection_notes', [
            { playlist_uid: playlist, notes: added.map((r) => [r.data1, r.tick - origin, r.tick - origin, r.rowid]) },
          ]);
          return null;
        },
        /** Addresses rows by rowid, unlike the other two (fact 74). */
        change_velocity: (data, engine) => {
          const body = (data ?? {}) as { notes?: { rowid?: number; velocity?: number }[] };
          const wanted = new Map<number, number>();
          for (const n of body.notes ?? []) if (typeof n.rowid === 'number') wanted.set(n.rowid, n.velocity ?? 0);
          for (const pl of engine.children(`${base}/playlists`)) {
            for (const clipUid of engine.children(`${base}/playlists/${pl}/clips`)) {
              const clip = `${base}/playlists/${pl}/clips/${clipUid}`;
              const rows = engine.midiRows(clip).filter((r) => wanted.has(r.rowid));
              if (rows.length) engine.midiEdit(clip, 'changed', rows.map((r) => ({ ...r, data2: wanted.get(r.rowid)! })));
            }
          }
          return null;
        },
        nudge: () => null,
        separate_clips: () => null,
        consolidate: () => null,
        mute_clips: () => null,
      },
    });
    this.addNode(`${base}/tempo_map/1`, { properties: { tick: 0, time: 0, tempo: 120 } });
    this.addNode(`${base}/time_signatures/1`, { properties: { tick: 0, bar: 1, partial: false, numerator: 4, denominator: 4 } });
    this.addNode(`${base}/key_signatures`);
    this.addNode(`${base}/markers`);
    this.addNode(`${base}/chords`);
    this.addPackage(pkg, { name: options.name ?? uid, lastOpened: Date.now() });
    // LUNA gives every session four cue buses before anything else (fact 83).
    for (let i = 0; i < 4; i++) this.addBus(uid, `cue${i + 1}_${uid}`, { name: `CUE ${i + 1}`, busType: `cue_${i}`, stemFormat: 'stereo' });
    this.addBus(uid, `master_${uid}`, { name: 'Main Output', busType: 'master', stemFormat: 'stereo', color: 4294948970 });
    this.addNode(`/workspace/sessions/${pkg}/audio`);
    for (const name of options.tracks ?? []) this.addTrack(uid, name, { name });
    if (options.focused ?? true) this.setValue('/sessions', 'focused_session', uid);
  }

  /** Add a track with the standard control layout and one playlist. */
  addTrack(sessionUid: string, id: string, options: { name?: string; trackType?: string; stemFormat?: string } = {}): void {
    const base = `/sessions/${sessionUid}`;
    const order = this.children(`${base}/tracks`).length;
    const playlist = `pl_${id}_1`;
    this.addChannel(
      `${base}/tracks/${id}`,
      {
        uid: id,
        name: options.name ?? id,
        track_type: options.trackType ?? 'audio',
        io_type: 'mono',
        stem_format: options.stemFormat ?? 'mono',
        order,
        color: 4278190335,
        comments: '',
        automation_mode: 'read',
        folder_uid: null,
        frozen: false,
        enabled: true,
        record_enabled: false,
        input_monitor: false,
        input_monitor_state: false,
        input_monitor_source: 'node',
        input_desc: null,
        input_node_uid: null,
        playlist_uid: playlist,
        has_preamp: false,
        record_mute: false,
      },
      options.stemFormat === 'stereo',
    );
    this.routeCues(sessionUid, `${base}/tracks/${id}`);
    this.addNode(`${base}/playlists/${playlist}`, { properties: { uid: playlist, name: 'V1', track_uid: id, version: 1, stem_format: options.stemFormat ?? 'mono', frozen: false } });
    this.addNode(`${base}/playlists/${playlist}/clips`);
  }

  /**
   * Add a source audio file to a session package's workspace folder. With `analysis`, it also
   * carries a fine and a coarse overview, sized from its length the way LUNA's is: one fine
   * pair per 125 samples at 48 kHz, one coarse pair per twelve fine (fact 72).
   */
  addSource(packageUid: string, uid: string, options: { name?: string; stemFormat?: string; lengthNs?: number; sampleRate?: number; analysis?: boolean } = {}): void {
    const path = `/workspace/sessions/${packageUid}/audio/${uid}`;
    const lengthNs = options.lengthNs ?? 1_000_000_000;
    const channels = options.stemFormat === 'stereo' ? 2 : 1;
    this.addNode(path, {
      properties: { uid, name: options.name ?? `${uid}.wav`, stem_format: options.stemFormat ?? 'mono', length: lengthNs, sample_rate: options.sampleRate ?? 48000 },
    });
    if (options.analysis === false) return;
    for (const [kind, pairNs] of [
      ['overview', 125e9 / 48000],
      ['overview_coarse', (125e9 / 48000) * 12],
    ] as const) {
      const count = Math.max(1, Math.floor(lengthNs / pairNs));
      this.addNode(`${path}/analysis/${kind}`, { properties: { count, md5: `md5-${uid}-${kind}` } });
      this.addNode(`${path}/analysis/${kind}/file`, { properties: { data: { count, channels } } });
    }
  }

  /**
   * Add a hardware device with `inputs` named inputs, the shape `luna.audioInputs()` reads
   * (fact 76).
   *
   * @example
   * engine.addDevice('Apollo', { inputs: ['In 1', 'In 2'] });
   */
  addDevice(id: string, options: { inputs?: string[]; stemFormat?: string; online?: boolean } = {}): void {
    const path = `/devices/${id}`;
    this.addNode(path, { properties: { name: id, device_type: 'audio', online: options.online ?? true, sample_rate: 48000, clock_source: 'internal' } });
    this.addNode(`${path}/inputs`);
    (options.inputs ?? []).forEach((name, i) => {
      this.addNode(`${path}/inputs/in_${i + 1}`, { properties: { name, stem_format: options.stemFormat ?? 'mono', device_id: id, in_use: false } });
    });
  }

  /**
   * Finish a record pass the way LUNA does: punch in, then on the caller's stop drop a
   * finalized take clip on the track's active playlist with a source to match (fact 75).
   *
   * @example
   * engine.onRecord(({ sessionUid, trackUid }) => engine.finishTake(sessionUid, trackUid, { startTick: 0, stopTick: Luna.WHOLE_NOTE }));
   */
  finishTake(sessionUid: string, trackUid: string, options: { startTick?: number; stopTick?: number; name?: string } = {}): string {
    const base = `/sessions/${sessionUid}`;
    const playlist = String(this.value(`${base}/tracks/${trackUid}`, 'playlist_uid'));
    const pkg = String(this.value(base, 'session_package_uid'));
    const n = this.children(`${base}/playlists/${playlist}/clips`).length + 1;
    const clipUid = `take${n}`;
    const sourceUid = `src_${clipUid}`;
    const startTick = options.startTick ?? 0;
    const stopTick = options.stopTick ?? startTick + 96e9 * 4;
    this.addSource(pkg, sourceUid, { name: `${options.name ?? 'Take'}.wav`, lengthNs: ((stopTick - startTick) / 96e9) * 0.5e9 });
    this.addNode(`${base}/playlists/${playlist}/clips/${clipUid}`, {
      properties: {
        uid: clipUid,
        name: options.name ?? `Take ${n}`,
        start: startTick,
        stop: stopTick,
        source_uid: sourceUid,
        source_start: 0,
        source_stop: ((stopTick - startTick) / 96e9) * 0.5e9,
        clip_type: 0,
        gain: 0,
        bypass: false,
        render_source_uid: null,
        render_state: 'none',
        midi_source_start: 0,
      },
    });
    return clipUid;
  }

  /**
   * Put a chord on a session's Chord ruler, as a user typing one in LUNA would: it replaces
   * any chord at `tick`, and `♭`/`♯` are stored as `b`/`#` (fact 100). Returns the rowid.
   *
   * @example engine.addChord('abc', 0, 'Am7');
   */
  addChord(sessionUid: string, tick: number, name: string): number {
    const base = `/sessions/${sessionUid}/chords`;
    const existing = this.chordAt(sessionUid, tick);
    if (existing !== undefined) this.removeNode(`${base}/${existing}`);
    const rowid = this.nextRow();
    this.addNode(`${base}/${rowid}`, { properties: { rowid, location: tick, name: normalizeChordName(name) } });
    return rowid;
  }

  /** @internal The rowid of the chord at `tick`, if any. */
  chordAt(sessionUid: string, tick: number): string | undefined {
    const base = `/sessions/${sessionUid}/chords`;
    return this.children(base).find((row) => this.value(`${base}/${row}`, 'location') === tick);
  }

  /**
   * Add a bus. `busType` is `aux`, `master` or `cue_0`..`cue_3`; cue buses have only a main
   * output (fact 83). Orders after everything already in the session.
   */
  addBus(sessionUid: string, id: string, options: { name?: string; busType?: string; stemFormat?: string; color?: number } = {}): void {
    const base = `/sessions/${sessionUid}`;
    const busType = options.busType ?? 'aux';
    const stereo = (options.stemFormat ?? 'stereo') === 'stereo';
    const order = this.children(`${base}/buses`).length;
    this.addChannel(
      `${base}/buses/${id}`,
      { uid: id, name: options.name ?? id, bus_type: busType, order, stem_format: options.stemFormat ?? 'stereo', color: options.color ?? 4282400832, folder_mode: 'none', folder_uid: null, automation_mode: 'read', frozen: false, enabled: true, comments: '' },
      stereo,
      !busType.startsWith('cue_'),
    );
    if (!busType.startsWith('cue_')) this.routeCues(sessionUid, `${base}/buses/${id}`);
  }

  /** LUNA routes a new channel's cue outputs to CUE 1-4 (fact 83). */
  private routeCues(sessionUid: string, channel: string): void {
    const base = `/sessions/${sessionUid}`;
    for (const bus of this.children(`${base}/buses`)) {
      const busType = String(this.value(`${base}/buses/${bus}`, 'bus_type') ?? '');
      const out = `${channel}/outputs/${busType}`;
      if (busType.startsWith('cue_') && this.has(out)) this.addAssignment(out, bus, `${base}/buses/${bus}`);
    }
  }

  /**
   * The standard strip: `controls/solo`, a main output, and (unless `slots` is false) eight
   * sends and four cue outputs. Pan is `pan` on a mono channel and `pan_left`/`pan_right` on
   * a stereo one, on the main output and on every send alike (fact 84).
   */
  private addChannel(path: string, properties: Record<string, unknown>, stereo: boolean, slots = true): void {
    const pans = stereo ? ['pan_left', 'pan_right'] : ['pan'];
    this.addNode(path, { properties, readOnly: ['uid', 'order', 'track_type', 'bus_type', 'io_type', 'folder_uid', 'playlist_uid', 'input_monitor_state'] });
    this.addNode(`${path}/controls`);
    this.addControl(`${path}/controls/solo`, 'solo', { discrete: true, value: 0, real: false, str: 'false', automatable: false });
    const outputs = ['main', ...(slots ? [...Array.from({ length: 8 }, (_, i) => `send_${i}`), ...Array.from({ length: 4 }, (_, i) => `cue_${i}`)] : [])];
    for (const out of outputs) {
      const main = out === 'main';
      this.addNode(`${path}/outputs/${out}`, { properties: { uid: `${path}_${out}`, output_type: out, bus_uid: null, assignments: main ? [{ value: 'out12', name: 'OUTPUT 1-2', stem_format: 'stereo' }] : [] } });
      this.addNode(`${path}/outputs/${out}/controls`);
      this.addNode(`${path}/outputs/${out}/assignment_objects`);
      const names = main ? ['gain', ...pans, 'mute', 'gain_trim'] : ['gain', ...pans, 'mute', 'pre_fader', 'enabled', 'gain_trim'];
      for (const name of names) {
        const isSwitch = name === 'mute' || name === 'pre_fader' || name === 'enabled';
        const isPan = name.startsWith('pan');
        this.addControl(`${path}/outputs/${out}/controls/${name}`, name, isSwitch ? { discrete: true, value: 0, real: false, str: 'false', automatable: true } : { discrete: false, value: 0, real: 0, str: isPan ? 'C' : '0.0', automatable: true, normalized: isPan ? 0.5 : 0.78 });
      }
      this.addNode(`${path}/outputs/${out}/meters/level`, { properties: { type: 'meter', name: 'Level', enabled: true, num_streams: stereo ? 2 : 1, level: stereo ? [0, 0] : [0], peak: stereo ? [0, 0] : [0], clip: stereo ? [0, 0] : [0] } });
    }
    this.addNode(`${path}/effects`);
    // The 3.0 slot layout (fact 86): eight effect slots between the fixed ones.
    for (const slot of ['tape', 'console', 'reserved_0', ...Array.from({ length: 8 }, (_, i) => `effect_${i}`), 'sidechain_filter', ...Array.from({ length: 4 }, (_, i) => `record_fx_${i}`)]) {
      this.addNode(`${path}/effects/${slot}`, {
        properties: { uid: `${path}_${slot}`, insert_type: slot, plugin_id: null, plugin_name: null, external_sdk_instance_id: null, bypass_control: null, bypass_control_active_low: null, enabled: true, plugin_power: true, preset_name: null, preset_uid: null, preset_uid_dirty: false, frozen: false, sidechain_allowed: false, sidechain_in_use: false, plugin_error: null, plugin_license_error: null },
        readOnly: ['uid', 'insert_type', 'plugin_id', 'plugin_name'],
      });
      this.addNode(`${path}/effects/${slot}/controls`);
      this.addNode(`${path}/effects/${slot}/commands`, { commands: { preset_browser_increment: () => null, preset_browser_decrement: () => null, preset_browser_toggle: () => null } });
    }
  }

  /** @internal */
  addControl(path: string, controlType: string, o: { discrete: boolean; value: number; real: number | boolean; str: string; automatable: boolean; normalized?: number }): void {
    this.addNode(path, {
      properties: {
        uid: `ctl_${path.replaceAll('/', '_')}`,
        name: controlType,
        control_type: controlType,
        value: o.value,
        real_value: o.real,
        normalized_value: o.normalized ?? o.value,
        string_value: o.str,
        automatable: o.automatable,
        discrete: o.discrete,
        num_steps: o.discrete ? 2 : 0,
        initialized: true,
        touch_count: 0,
        real_values: o.discrete ? [false, true] : [],
        string_values: o.discrete ? ['false', 'true'] : [],
      },
      readOnly: ['uid', 'control_type', 'automatable', 'discrete', 'num_steps'],
      commands: {
        set_touch: (data, engine, nodePath) => {
          const touching = Boolean((data as { touch?: unknown } | undefined)?.touch);
          engine.touches.push(`${nodePath}:${touching ? 'on' : 'off'}`);
          const count = Number(engine.value(nodePath, 'touch_count') ?? 0) + (touching ? 1 : -1);
          // A release with no touch to release is rejected (fact 78).
          if (count < 0) throw new UAError('uasrv.invalid_value', 'set_touch: control is not touched', { cmd: 'post', path: `${nodePath}/set_touch` });
          engine.setValue(nodePath, 'touch_count', count);
          return null;
        },
        // The control's default is the value it was created with; LUNA answers the default
        // real value (fact 92).
        set_control_default_value: (_data, engine, nodePath) => {
          const defaults = { value: o.value, real_value: o.real, normalized_value: o.normalized ?? o.value, string_value: o.str };
          for (const [prop, v] of Object.entries(defaults)) if (engine.value(nodePath, prop) !== v) engine.setValue(nodePath, prop, v);
          return o.real;
        },
      },
    });
    this.addNode(`${path}/automation`);
  }

  /**
   * A small ready-made engine: one focused session, `Demo`, with four audio tracks. What a
   * page gets from `?engine=mock` when it defines no `LunaMockSetup`.
   *
   * @example
   * const engine = Luna.MockEngine.demo();
   * const luna = await Luna.connect({ port_: engine.port() });
   */
  static demo(options: MockEngineOptions = {}): MockEngine {
    const engine = new MockEngine(options);
    engine.addSession('demo', { name: 'Demo', tracks: ['Vocal', 'Guitar', 'Bass', 'Drums'] });
    return engine;
  }

  /** Resolves once every queued push has been delivered. */
  settled(): Promise<void> {
    if (this.pendingDeliveries === 0) return Promise.resolve();
    return new Promise((resolve) => this.settleWaiters.push(resolve));
  }

  // ---------------------------------------------------------------------------------------
  // Request handling (called by MockPort)
  // ---------------------------------------------------------------------------------------

  /** @internal */
  handle(from: MockPort, verb: Verb, rawPath: string, data: unknown): Promise<unknown> {
    this.requests.push({ verb, path: rawPath, data });
    const path = normalize(rawPath);
    const params = parseQuery(rawPath);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const fault = this.faults.get(path);
        if (fault && fault.remaining > 0) {
          fault.remaining--;
          if (fault.remaining === 0) this.faults.delete(path);
          reject(new UAError(fault.code, `${verb} ${rawPath}: ${fault.code}`, { cmd: verb, path }));
          return;
        }
        try {
          resolve(this.execute(from, verb, path, params, data));
        } catch (err) {
          reject(err);
        }
      }, 0);
    });
  }

  private execute(from: MockPort, verb: Verb, path: string, params: Record<string, string>, data: unknown): unknown {
    switch (verb) {
      case 'get':
        return this.get(path, params);
      case 'set':
        return this.set(from, path, data instanceof FloatLiteral ? data.value : data);
      case 'post':
        return this.post(path, data);
      case 'subscribe':
      case 'unsubscribe':
        return null;
    }
  }

  private get(path: string, params: Record<string, string>): unknown {
    if (path === '/ping') return null;
    if (path.endsWith('/file/data') && path.includes('/analysis/')) return { value: this.overviewPage(path, params) };
    const node = this.nodes.get(path);
    if (node) return this.describe(path, node, params, params['recursive'] === '1' ? Infinity : Number(params['levels'] ?? 1));
    const { node: nodePath, name } = splitPath(path);
    const owner = this.nodes.get(nodePath);
    if (owner && owner.properties.has(name)) {
      const value = owner.properties.get(name);
      return params['flatvalue'] === '1' ? value : { value };
    }
    if (name === 'value') {
      const inner = splitPath(nodePath);
      const holder = this.nodes.get(inner.node);
      if (holder && holder.properties.has(inner.name)) return holder.properties.get(inner.name);
    }
    // Fact 10: a missing path answers `{}` with no error.
    return {};
  }

  /**
   * A bounded page of overview pairs, generated rather than stored: `count` int16 min/max
   * pairs per channel, clamped to what the analysis holds. A request past the end answers an
   * empty page, as LUNA's does.
   */
  private overviewPage(path: string, params: Record<string, string>): unknown {
    const holder = this.nodes.get(splitPath(path).node);
    const info = holder?.properties.get('data') as { count?: number; channels?: number } | undefined;
    if (!info) return undefined;
    const total = info.count ?? 0;
    const channels = info.channels ?? 1;
    const index = Math.max(0, Number(params['index'] ?? 0));
    const want = Math.max(0, Number(params['count'] ?? 1024));
    const n = Math.max(0, Math.min(want, total - index));
    const data = [];
    for (let c = 0; c < channels; c++) {
      const min: number[] = [];
      const max: number[] = [];
      for (let i = 0; i < n; i++) {
        // Deterministic, in range, and min <= max, so a reader can assert on it.
        const amp = Math.round(16384 * Math.abs(Math.sin((index + i) / 32 + c)));
        min.push(-amp);
        max.push(amp);
      }
      data.push({ min, max });
    }
    return { count: n, data };
  }

  private describe(path: string, node: MockNode, params: Record<string, string>, levels: number): Record<string, unknown> {
    // Fact 18: empty sections are omitted, so a node with nothing to say answers `{}`.
    const out: Record<string, unknown> = {};
    const flat = params['flatvalue'] === '1';
    const filter = params['propfilter'] ? new Set(params['propfilter'].split(',')) : undefined;
    if (params['properties'] !== '0' && node.properties.size > 0) {
      const properties: Record<string, unknown> = {};
      for (const [name, value] of node.properties) {
        if (filter && !filter.has(name)) continue;
        properties[name] = flat ? value : { value };
      }
      if (Object.keys(properties).length > 0) out['properties'] = properties;
    }
    if (params['children'] !== '0' && node.children.length > 0) {
      out['children'] = node.children.map((name) => {
        const entry: Record<string, unknown> = { path: name };
        if (levels > 1) {
          const child = this.nodes.get(`${path === '/' ? '' : path}/${name}`);
          if (child) Object.assign(entry, this.describe(`${path === '/' ? '' : path}/${name}`, child, params, levels - 1));
        }
        return entry;
      });
    }
    if (params['commands'] !== '0' && node.commands.size > 0) out['commands'] = [...node.commands.keys()].map((name) => ({ path: name })); // fact 24
    return out;
  }

  private set(from: MockPort, path: string, data: unknown): null {
    if (this.nodes.has(path)) {
      throw new UAError('uasrv.invalid_property', `set ${path}: uasrv.invalid_property`, { cmd: 'set', path });
    }
    let { node: nodePath, name } = splitPath(path);
    if (name === 'value') ({ node: nodePath, name } = splitPath(nodePath));
    const node = this.nodes.get(nodePath);
    if (!node || !node.properties.has(name)) {
      throw new UAError('uasrv.invalid_object', `set ${path}: uasrv.invalid_object`, { cmd: 'set', path });
    }
    if (node.readOnly.has(name)) throw new UAError('uasrv.read_only', `set ${path}: uasrv.read_only`, { cmd: 'set', path });
    // Record mute (no Apollo) refuses turning a track's monitor on (fact 88).
    const isTrack = /^\/sessions\/[^/]+\/tracks\/[^/]+$/.test(nodePath);
    if (isTrack && name === 'input_monitor' && data === true && this.value('/preferences', 'record_mute') === true) {
      throw new UAError('uasrv.invalid_value', `set ${path}: uasrv.invalid_value`, { cmd: 'set', path });
    }
    if (node.properties.get('control_type') !== undefined && CONTROL_VIEWS.has(name)) {
      this.writeControl(nodePath, node, name, data, from);
      return null;
    }
    node.properties.set(name, data);
    this.push({ path: `${nodePath}/${name}/value`, data }, from);
    if (name === 'record_enabled' && /^\/sessions\/[^/]+$/.test(nodePath)) this.runRecord(nodePath, data === true || data === 1);
    // Stopped, the location follows the play start and reaches the writer too (fact 90).
    if (name === 'play_start' && /^\/sessions\/[^/]+$/.test(nodePath) && node.properties.get('playing') !== true) this.setValue(nodePath, 'location', this.locationAt(nodePath, Number(data)));
    // The live state follows the switch (fact 88); auto-monitoring an armed track is not modelled.
    if (isTrack && name === 'input_monitor') this.setValue(nodePath, 'input_monitor_state', data === true);
    return null;
  }

  /**
   * A client write to one view of a control (fact 97): re-derive the other three and push
   * them to every port — the writer too, since they are derived (fact 6); only the written
   * view itself is withheld from the writer. A switch snaps to a step of its
   * `real_values`/`string_values`; a continuous control goes through the mock's stand-in
   * taper and format (see {@link faderToReal}); a plugin `parameter`'s `value` tracks its
   * normalized view, since plugin units are plugin-specific (fact 85).
   */
  private writeControl(nodePath: string, node: MockNode, written: string, data: unknown, from: MockPort): void {
    const p = node.properties;
    const views: Record<string, unknown> = {};
    if (p.get('discrete') === true) {
      const reals = (p.get('real_values') as (number | boolean)[] | undefined) ?? [false, true];
      const strings = (p.get('string_values') as string[] | undefined) ?? ['false', 'true'];
      const steps = Math.max(reals.length, 2);
      const index = Math.max(
        0,
        Math.min(
          steps - 1,
          written === 'real_value'
            ? reals.includes(data as number | boolean)
              ? reals.indexOf(data as number | boolean)
              : data
                ? 1
                : 0
            : written === 'string_value'
              ? Math.max(0, strings.indexOf(String(data)))
              : written === 'normalized_value'
                ? Math.round(Number(data) * (steps - 1))
                : Math.round(Number(data)),
        ),
      );
      views['value'] = index;
      views['real_value'] = reals[index] ?? index;
      views['normalized_value'] = index / (steps - 1);
      views['string_value'] = strings[index] ?? String(index);
    } else {
      const pan = String(p.get('control_type') ?? '').startsWith('pan');
      const parameter = p.get('control_type') === 'parameter';
      const real =
        written === 'real_value'
          ? Number(data)
          : written === 'string_value'
            ? pan
              ? parsePan(String(data))
              : Number(data) || 0
            : written === 'normalized_value' || parameter
              ? pan
                ? Number(data) * 200 - 100
                : faderToReal(Number(data))
              : Number(data);
      const normalized =
        written === 'normalized_value' || (parameter && written === 'value')
          ? Number(data)
          : pan
            ? Math.min(1, Math.max(0, (real + 100) / 200))
            : faderToNormalized(real);
      views['real_value'] = real;
      views['normalized_value'] = normalized;
      views['string_value'] = pan ? formatPan(real) : real.toFixed(1);
      views['value'] = parameter ? normalized : real;
    }
    views[written] = data; // the written view passes through verbatim
    for (const [prop, value] of Object.entries(views)) {
      p.set(prop, value);
      this.push({ path: `${nodePath}/${prop}/value`, data: value }, prop === written ? from : undefined);
    }
  }

  /**
   * Model LUNA's record pass (fact 75): arming the session rolls the transport and punches in
   * once any count-in is over; disarming finalizes a take on every armed track, but only when
   * the punch point lay inside the loop marks — outside them LUNA rolls and captures nothing.
   */
  private runRecord(sessionPath: string, armed: boolean): void {
    const uid = sessionPath.slice('/sessions/'.length);
    if (armed) {
      this.setValue(sessionPath, 'playing', true);
      this.setValue(sessionPath, 'punched_in', true);
      this.recording.set(uid, this.children(`${sessionPath}/tracks`).filter((t) => this.value(`${sessionPath}/tracks/${t}`, 'record_enabled') === true));
      return;
    }
    const armedTracks = this.recording.get(uid) ?? [];
    this.recording.delete(uid);
    const punchAt = Number(this.value(sessionPath, 'play_start') ?? 0);
    const loopStart = Number(this.value(sessionPath, 'loop_start') ?? 0);
    const loopStop = Number(this.value(sessionPath, 'loop_stop') ?? 0);
    this.setValue(sessionPath, 'punched_in', false);
    this.setValue(sessionPath, 'playing', false);
    if (!(punchAt >= loopStart && punchAt < loopStop)) return;
    for (const track of armedTracks) this.finishTake(uid, track, { startTick: punchAt, stopTick: punchAt + 96e9 * 4 });
  }

  /** @internal Tracks armed when each session's record pass began. */
  private readonly recording = new Map<string, string[]>();

  private post(path: string, data: unknown): unknown {
    const { node: nodePath, name } = splitPath(path);
    const node = this.nodes.get(nodePath);
    const handler = node?.commands.get(name);
    if (!node || !handler) throw new UAError('uasrv.invalid_object', `post ${path}: uasrv.invalid_object`, { cmd: 'post', path });
    const result = handler(data, this, nodePath);
    return result === undefined ? null : result;
  }

  private push(message: WireMessage, except: MockPort | undefined): void {
    const event = toEvent(message);
    // Recipients are decided now, like a real engine: a port that subscribes after the change
    // happened does not hear about it.
    const targets = [...this.ports].filter((port) => port !== except && port.wantsEvent(event.path));
    this.pendingDeliveries++;
    setTimeout(() => {
      for (const port of targets) port.deliver(event);
      this.pendingDeliveries--;
      if (this.pendingDeliveries === 0) {
        const waiters = this.settleWaiters;
        this.settleWaiters = [];
        for (const w of waiters) w();
      }
    }, 0);
  }

  /** @internal */
  detach(port: MockPort): void {
    this.ports.delete(port);
  }
}

function parseQuery(path: string): Record<string, string> {
  const q = path.indexOf('?');
  const params: Record<string, string> = {};
  if (q < 0) return params;
  for (const pair of path.slice(q + 1).split('&')) {
    const eq = pair.indexOf('=');
    if (eq < 0) params[decodeURIComponent(pair)] = '';
    else params[decodeURIComponent(pair.slice(0, eq))] = decodeURIComponent(pair.slice(eq + 1));
  }
  return params;
}

interface MockSubscription {
  path: string;
  handlers: Set<EventHandler>;
}

/** One client connection to a {@link MockEngine}. */
export class MockPort implements Port {
  private status: PortStatus = 'connected';
  private readonly subscriptions = new Map<string, MockSubscription>();
  private readonly statusListeners = new Set<StatusListener>();

  /** @internal */
  constructor(
    /** The engine this port talks to, for driving it from a page that connected with `engine: 'mock'`. */
    readonly engine: MockEngine,
  ) {}

  get connected(): boolean {
    return this.status === 'connected';
  }

  get(path: string, options?: GetOptions): Promise<unknown> {
    const params = getOptionsToParams(options);
    const query = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return this.request('get', query ? `${path}${path.includes('?') ? '&' : '?'}${query}` : path, undefined);
  }

  async set(path: string, data: unknown): Promise<void> {
    await this.request('set', path, data);
  }

  post(path: string, data?: unknown): Promise<unknown> {
    return this.request('post', path, data);
  }

  subscribe(path: string, handler: EventHandler, _options?: SubscribeOptions): Unsubscribe {
    let sub = this.subscriptions.get(path);
    if (!sub) {
      sub = { path, handlers: new Set() };
      this.subscriptions.set(path, sub);
      void this.request('subscribe', path, undefined).catch(() => undefined);
    }
    sub.handlers.add(handler);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const current = this.subscriptions.get(path);
      if (!current) return;
      current.handlers.delete(handler);
      if (current.handlers.size === 0) {
        this.subscriptions.delete(path);
        void this.request('unsubscribe', path, undefined).catch(() => undefined);
      }
    };
  }

  onStatus(listener: StatusListener): Unsubscribe {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  async close(): Promise<void> {
    if (this.status === 'closed') return;
    this.engine.detach(this);
    this.setStatus('closed');
  }

  /**
   * Simulate a drop and recovery; subscriptions survive as they do on the real port.
   * Anything `during` does happens while the port is down, so its pushes are missed.
   */
  async reconnect(during?: () => void | Promise<void>): Promise<void> {
    this.setStatus('disconnected');
    await during?.();
    await this.engine.settled();
    await new Promise((r) => setTimeout(r, 0));
    this.setStatus('connected');
  }

  /** @internal */
  wantsEvent(path: string): boolean {
    if (this.status !== 'connected') return false;
    for (const sub of this.subscriptions.values()) {
      if (eventMatches(sub.path, path)) return true;
    }
    return false;
  }

  /** @internal */
  deliver(event: Event): void {
    if (this.status !== 'connected') return;
    for (const sub of this.subscriptions.values()) {
      if (!eventMatches(sub.path, event.path)) continue;
      for (const handler of sub.handlers) handler(event);
    }
  }

  private request(verb: Verb, path: string, data: unknown): Promise<unknown> {
    if (this.status !== 'connected') return Promise.reject(new ConnectionLost(verb, path));
    return this.engine.handle(this, verb, path, data);
  }

  private setStatus(status: PortStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const listener of this.statusListeners) listener(status);
  }
}
