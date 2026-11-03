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
 * - `new MockEngine({ gui: false })` has no `/gui`, like a headless engine (fact 103).
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
// The one model import: taper.ts is LUNA's taper tables and imports nothing itself.
import { Taper } from '../model/taper';
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

/** LUNA's own device, holder of its MIDI devices: `LUNA_DEVICE_UID` in `model/system.ts` (fact 123). */
const LUNA_DEVICE_UID = 'd37e009d693549a0b6ab1da3fad05443';

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

/** A stored fade row, as the mock keeps it under `<clip>/fades/<uid>`. */
interface MockFadeRow {
  uid: string;
  type: string;
  shape: string;
  curvature: number;
  startOffset: number;
  stopOffset: number;
  contributor: string | undefined;
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

/** One live MIDI message the mock delivered, in {@link MockEngine.midiSent}. */
export interface MockMidiSent {
  sessionUid?: string;
  trackUid?: string;
  midiInputSource?: string;
  /** Sent out of this MIDI output port (a `midi_input_source` naming an output port's uid, fact 124). */
  outputPortUid?: string;
  /** `send_midi_all_notes_off`, recorded as CC 123. */
  allNotesOff?: true;
  bytes: [number, number, number];
  /** Also handed to LUNA's record input. */
  recordEnabled: boolean;
}

const EMPTY_MIDI_TABLE =(): Record<string, unknown> => ({ operation: 'update', row_ids: [], enabled: [], midi_data: [], tick: [] });

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
 * The mock's control-view mappings (fact 97). A gain-type control maps through LUNA's own
 * fader taper, named by its `taper` property (fact 134; `+12` when empty), and formats with one
 * decimal; another continuous control uses the `+12` taper too. A pan maps 0..1 linearly to
 * −100..100, formatted `L<n>`/`C`/`R<n>`, which is the mock's own stand-in.
 */
function faderTaper(p: Map<string, unknown>): Taper {
  return Taper.forControl(String(p.get('control_type') ?? ''), p.get('taper') as string | null | undefined) ?? Taper.named(Taper.DEFAULT_NAME)!;
}

/** Normalized position of 0 dB on the default taper: where the mock seeds its faders. */
const FADER_ZERO = Taper.named(Taper.DEFAULT_NAME)!.toNormalized(0);

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
   * models a headless engine, where `luna.gui.available()` is false (fact 103).
   */
  gui?: boolean;
  /**
   * Publish `full_start`/`full_stop` and the `fade_in_*`/`fade_out_*` properties on compiled
   * clips. Default `true`; `false` models a LUNA from before they were added (fact 116).
   */
  compiledClipFades?: boolean;
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
  /** Live MIDI LUNA delivered through `/sessions/send_midi` and `send_midi_all_notes_off`, oldest first. */
  readonly midiSent: MockMidiSent[] = [];
  private readonly compiledClipFades: boolean;
  /** Per playlist path: published compiled-clip node names by start tick, and the next name. */
  private readonly compiled = new Map<string, { byStart: Map<number, string>; next: number }>();

  constructor(options: MockEngineOptions = {}) {
    this.compiledClipFades = options.compiledClipFades ?? true;
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
        // Facts 108 and 109, after deviced's Edit_SendMidi.
        send_midi: (data, engine) => {
          const body = (data ?? {}) as { session_uid?: string; track_uid?: string; tracks?: { track_uid?: string; record_enabled?: boolean }[]; midi_input_source?: string; record_enabled?: boolean; byte_0?: number; byte_1?: number; byte_2?: number };
          const invalid = (): UAError => new UAError('uasrv.invalid_property', 'post /sessions/send_midi: uasrv.invalid_property', { cmd: 'post', path: '/sessions/send_midi' });
          const { byte_0, byte_1, byte_2 } = body;
          if (typeof byte_0 !== 'number' || typeof byte_1 !== 'number' || typeof byte_2 !== 'number') throw invalid();
          const bytes = [byte_0, byte_1, byte_2] as [number, number, number];
          const live = (uid: string | undefined): uid is string => !!uid && engine.has(`/sessions/${uid}`);
          if (body.session_uid !== undefined && body.track_uid !== undefined) {
            if (!live(body.session_uid) || !body.track_uid) throw invalid();
            engine.midiSent.push({ sessionUid: body.session_uid, trackUid: body.track_uid, bytes, recordEnabled: body.record_enabled === true });
            return null;
          }
          if (body.session_uid !== undefined && Array.isArray(body.tracks)) {
            // Delivers each entry that carries record_enabled, then answers invalid_property anyway.
            if (live(body.session_uid)) {
              for (const t of body.tracks) {
                if (t.track_uid && typeof t.record_enabled === 'boolean') engine.midiSent.push({ sessionUid: body.session_uid, trackUid: t.track_uid, bytes, recordEnabled: t.record_enabled });
              }
            }
            throw invalid();
          }
          if (body.midi_input_source !== undefined) {
            // As mixerd routes it: an output port's uid goes out to the device, anything else is
            // taken as a device name and fed in as that device's input (fact 124).
            if (engine.isMidiOutputPortUid(body.midi_input_source)) engine.midiSent.push({ outputPortUid: body.midi_input_source, bytes, recordEnabled: false });
            else engine.midiSent.push({ midiInputSource: body.midi_input_source, bytes, recordEnabled: false });
            return null;
          }
          throw invalid();
        },
        send_midi_all_notes_off: (_data, engine) => {
          engine.midiSent.push({ allNotesOff: true, bytes: [0xb0, 123, 0], recordEnabled: false });
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
    // `query` applies LUNA's slot rules (fact 127): the slot's effect type, and on a channel
    // its format for effect, record FX and instrument slots.
    this.addNode('/plugins', { properties: { type: 'folder' }, commands: { rescan: () => null, query: (data, engine) => engine.queryPlugins(data) } });
    // The preset library: rows seeded with `addPreset`, queried columnar like the workspace
    // (fact 98). `favorite` and `factory` are 0/1 integers on the wire, as LUNA sends them.
    // Search and tags combine; several tags match all of them unless `union` (fact 120).
    this.addNode('/presets', {
      properties: { type: 'folder' },
      commands: {
        query: (data, engine) => engine.queryPresets(data),
        // Fact 121: deviced forwards to UA Assistant's hybrid search; with the assistant not
        // connected it answers `ua.unknown`, and the assistant refuses empty text.
        preset_recommendations: (data, engine) => {
          const body = (data ?? {}) as { plugin_id?: string; query?: string };
          const where = { cmd: 'post', path: '/presets/preset_recommendations' };
          if (!body.plugin_id || body.query === undefined || engine.value('/assistant', 'enabled') !== true) throw new UAError('ua.unknown', 'post /presets/preset_recommendations: ua.unknown', where);
          if (body.query.trim() === '') throw new UAError('assistant.input_classifier_rejected', 'post /presets/preset_recommendations: assistant.input_classifier_rejected', where);
          return { results: engine.recommendPresets(body.plugin_id, body.query) };
        },
      },
    });
    // Track presets: `/presets/devices/track`, seeded with `addTrackPreset`. `load` applies one
    // (or an instrument plugin's preset) to a track (fact 132).
    this.addNode('/presets/devices/track', { properties: { device_type_id: 'track' }, commands: { load: (data, engine) => engine.loadTrackPreset(data) } });
    this.addNode('/presets/devices/track/presets', { properties: { type: 'presets' } });
    this.addNode('/presets/devices/track/categories', { properties: { type: 'categories' } });
    // UA Assistant's connection to LUNA; `setAssistantEnabled` drives it (fact 121).
    this.addNode('/assistant', { properties: { enabled: false }, readOnly: ['enabled'] });
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
        // Fact 128: install_add_on's checks and codes as LUNA's. It records the request
        // instead of downloading and installing anything.
        install_add_on: (data, engine) => {
          const fail = (code: string, why: string) => new UAError(code, `install_add_on: ${why}`, { cmd: 'post', path: '/gui/install_add_on' });
          const body = typeof data === 'object' && data !== null ? (data as { id?: unknown; url?: unknown }) : {};
          const hasId = typeof body.id === 'string';
          const hasUrl = typeof body.url === 'string';
          if (hasId === hasUrl) throw hasId ? fail('uasrv.invalid_value', 'give id or url, not both') : fail('uasrv.missing_field', 'id or url is required');
          if (hasUrl) {
            const target = githubRepoUrl(body.url as string) ?? driveDownloadUrl(body.url as string) ?? iCloudShareUrl(body.url as string) ?? dropboxDownloadUrl(body.url as string);
            if (!target) throw fail('uasrv.invalid_value', 'url is not a GitHub repo, or a Google Drive, iCloud Drive or Dropbox share');
            engine.addOnInstalls.push({ url: target });
            return null;
          }
          const id = (body.id as string).toLowerCase();
          const pkg = engine.marketplace[id] !== undefined ? id : Object.keys(engine.marketplace).find((p) => engine.marketplace[p]?.includes(id));
          if (pkg === undefined) throw fail('uasrv.invalid_value', `no marketplace package or Add On ${id}`);
          if (engine.installingPackages.includes(pkg)) throw fail('uasrv.too_many_requests', `${pkg} is already installing`);
          engine.addOnInstalls.push({ id: pkg });
          return null;
        },
        // Fact 128: remove_imported_add_on's checks and codes as LUNA's.
        remove_imported_add_on: (data, engine) => {
          const fail = (code: string, why: string) => new UAError(code, `remove_imported_add_on: ${why}`, { cmd: 'post', path: '/gui/remove_imported_add_on' });
          const body = typeof data === 'object' && data !== null ? (data as { id?: unknown }) : {};
          if (typeof body.id !== 'string') throw fail('uasrv.missing_field', 'id is required');
          const id = body.id.toLowerCase();
          const pkg = engine.marketplace[id] !== undefined ? id : Object.keys(engine.marketplace).find((p) => engine.marketplace[p]?.includes(id));
          if (pkg === undefined) throw fail('uasrv.invalid_value', `no marketplace package or Add On ${id}`);
          if (!engine.importedPackages.includes(pkg)) throw fail('uasrv.not_permitted', `${pkg} is the marketplace's own`);
          engine.importedPackages = engine.importedPackages.filter((p) => p !== pkg);
          delete engine.marketplace[pkg];
          return null;
        },
        // Fact 130: uninstall_add_on's checks and codes as LUNA's. LUNA's prompt is answered
        // with uninstallAnswer; on 'remove' the Add On leaves /gui/add_ons.
        uninstall_add_on: (data, engine) => {
          const fail = (code: string, why: string) => new UAError(code, `uninstall_add_on: ${why}`, { cmd: 'post', path: '/gui/uninstall_add_on' });
          const body = typeof data === 'object' && data !== null ? (data as { id?: unknown }) : {};
          if (typeof body.id !== 'string') throw fail('uasrv.missing_field', 'id is required');
          const id = body.id.toLowerCase();
          if (!engine.has(`/gui/add_ons/${id}`)) throw fail('uasrv.invalid_value', `no Add On ${id}`);
          if (engine.builtInAddOns.includes(id)) throw fail('uasrv.not_permitted', `${id} is built into LUNA`);
          engine.addOnUninstalls.push(id);
          if (engine.uninstallAnswer === 'remove') engine.removeNode(`/gui/add_ons/${id}`);
          return null;
        },
        // Fact 126: what LUNA's show_plugin / hide_plugin check and do. LUNA opens a window
        // only for a slot with a plugin, and lists it in /gui/plugin_windows by uid.
        show_plugin: (data, engine) => {
          const { slot, key } = engine.pluginWindowTarget(data, 'show_plugin');
          const open = engine.pluginWindowsOpen();
          if (engine.value(slot, 'plugin_id') && !open.some((w) => sameWindow(w, key))) engine.setValue('/gui/plugin_windows', 'open', [...open, key]);
          return null;
        },
        hide_plugin: (data, engine) => {
          const { key } = engine.pluginWindowTarget(data, 'hide_plugin');
          const open = engine.pluginWindowsOpen();
          if (open.some((w) => sameWindow(w, key))) engine.setValue('/gui/plugin_windows', 'open', open.filter((w) => !sameWindow(w, key)));
          return null;
        },
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
            // Facts 106, 133: LUNA asks the user to bless the picked folders (blessAnswer), once,
            // before it reports them; the paths come back either way.
            const ask = engine.nextDialogFiles.map(normalizeFolder).filter((p) => engine.folders[p] !== undefined && engine.blessedRootOf(p) === undefined);
            if (ask.length) {
              engine.blessRequests.push(...ask);
              if (engine.blessAnswer === 'allow') for (const p of ask) engine.grantFolder(p);
            }
            engine.setValue(`/gui/file_chooser/${uid}`, 'files', engine.nextDialogFiles.map((p) => ({ path: p })));
            engine.setValue(`/gui/file_chooser/${uid}`, 'status', engine.nextDialogFiles.length ? 'selected' : 'cancelled');
          }, 5);
          return { uid };
        },
        // Fact 106: validation, hidden entries and order (naturalCompare) as LUNA's list_files.
        // Fact 133: recursive lists each folder followed by its contents, with relative_path,
        // and stops at listLimit entries with truncated.
        list_files: (data, engine) => {
          const fail = (code: string, why: string) => new UAError(code, `list_files: ${why}`, { cmd: 'post', path: '/gui/list_files' });
          const body = typeof data === 'object' && data !== null ? (data as { path?: unknown; recursive?: unknown }) : {};
          const path = body.path;
          if (path === undefined || path === null) throw fail('uasrv.missing_field', 'path is required');
          if (typeof path !== 'string' || !/^(\/|[A-Za-z]:[\\/])/.test(path)) throw fail('uasrv.invalid_value', 'path must be absolute');
          if (body.recursive !== undefined && body.recursive !== null && typeof body.recursive !== 'boolean') throw fail('uasrv.invalid_value', 'recursive must be a bool');
          const recursive = body.recursive === true;
          const dir = normalizeFolder(path);
          // Before the path is looked at, as in LUNA: a refusal does not tell whether it exists.
          if (engine.blessedRootOf(dir) === undefined) {
            throw fail('uasrv.not_permitted', 'path is not in a folder the user granted');
          }
          if (!engine.folders[dir]) {
            const cut = dir.lastIndexOf('/');
            const isFile = engine.folders[cut > 0 ? dir.slice(0, cut) : '/']?.includes(dir.slice(cut + 1));
            throw fail(isFile ? 'uasrv.invalid_value' : 'uasrv.filesystem_error', isFile ? 'path is a file' : 'no folder at path');
          }
          const files: { name: string; path: string; is_directory: boolean; relative_path?: string }[] = [];
          let truncated = false;
          const walk = (folder: string, relative: string): void => {
            const entries = (engine.folders[folder] ?? [])
              .map((raw) => ({ name: raw.replace(/\/$/, ''), is_directory: raw.endsWith('/') }))
              .filter((e) => !e.name.startsWith('.'))
              .sort((a, b) => naturalCompare(a.name, b.name) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
            for (const e of entries) {
              if (recursive && files.length === engine.listLimit) {
                truncated = true;
                return;
              }
              const entryPath = `${folder === '/' ? '' : folder}/${e.name}`;
              const rel = relative ? `${relative}/${e.name}` : e.name;
              files.push(recursive ? { name: e.name, path: entryPath, is_directory: e.is_directory, relative_path: rel } : { name: e.name, path: entryPath, is_directory: e.is_directory });
              if (recursive && e.is_directory) {
                walk(entryPath, rel);
                if (truncated) return;
              }
            }
          };
          walk(dir, '');
          return recursive ? { files, truncated } : { files };
        },
        // Fact 133: add_blessed_folder's checks and codes as LUNA's. LUNA's prompt is answered
        // with blessAnswer; it answers before asking, so a page reads the outcome from
        // /gui/add_ons blessed_folders.
        add_blessed_folder: (data, engine) => {
          const fail = (code: string, why: string) => new UAError(code, `add_blessed_folder: ${why}`, { cmd: 'post', path: '/gui/add_blessed_folder' });
          const path = typeof data === 'object' && data !== null ? (data as { path?: unknown }).path : undefined;
          if (path === undefined || path === null) throw fail('uasrv.missing_field', 'path is required');
          if (typeof path !== 'string' || !/^(\/|[A-Za-z]:[\\/])/.test(path)) throw fail('uasrv.invalid_value', 'path must be absolute');
          const dir = normalizeFolder(path);
          if (!engine.folders[dir]) {
            const cut = dir.lastIndexOf('/');
            const isFile = engine.folders[cut > 0 ? dir.slice(0, cut) : '/']?.includes(dir.slice(cut + 1));
            throw fail(isFile ? 'uasrv.invalid_value' : 'uasrv.filesystem_error', isFile ? 'path is a file' : 'no folder at path');
          }
          if (engine.blessedRootOf(dir) !== undefined) return null;   // already readable: no prompt
          engine.blessRequests.push(dir);
          if (engine.blessAnswer === 'allow') engine.grantFolder(dir);
          return null;
        },
        // Fact 133: remove_blessed_folder takes a listed folder out, without asking.
        remove_blessed_folder: (data, engine) => {
          const fail = (code: string, why: string) => new UAError(code, `remove_blessed_folder: ${why}`, { cmd: 'post', path: '/gui/remove_blessed_folder' });
          const path = typeof data === 'object' && data !== null ? (data as { path?: unknown }).path : undefined;
          if (path === undefined || path === null) throw fail('uasrv.missing_field', 'path is required');
          if (typeof path !== 'string') throw fail('uasrv.invalid_value', 'path must be a string');
          const dir = normalizeFolder(path);
          if (!engine.grantedFolders.includes(dir)) throw fail('uasrv.invalid_value', 'path is not a blessed folder');
          engine.grantedFolders = engine.grantedFolders.filter((f) => f !== dir);
          return null;
        },
        // Fact 114: serve_media_file's checks, codes and URL as LUNA's (macOS form).
        serve_media_file: (data, engine) => {
          const fail = (code: string, why: string) => new UAError(code, `serve_media_file: ${why}`, { cmd: 'post', path: '/gui/serve_media_file' });
          const body = typeof data === 'object' && data !== null ? (data as { add_on_id?: unknown; path?: unknown }) : {};
          if (body.add_on_id === undefined || body.add_on_id === null || body.path === undefined || body.path === null) throw fail('uasrv.missing_field', 'add_on_id and path are required');
          if (typeof body.add_on_id !== 'string' || typeof body.path !== 'string') throw fail('uasrv.invalid_type', 'add_on_id and path must be strings');
          const path = body.path;
          if (!/^(\/|[A-Za-z]:[\\/])/.test(path)) throw fail('uasrv.invalid_value', 'path must be absolute');
          // Fact 133: any file in a blessed folder, but hidden ones, is served whatever its type.
          if (engine.isBlessedFile(path)) {
            const id = body.add_on_id.toLowerCase();
            if (!engine.has(`/gui/add_ons/${id}`)) throw fail('uasrv.not_installed', `no Add On ${id}`);
            const linked = engine.mediaFiles[path];
            const target = typeof linked === 'string' ? linked : normalizeFolder(path);   // LUNA serves the real file
            engine.mediaServed.push({ addOnId: id, path: target });
            return { url: `ua-content://${localContentHost(id)}${encodeMediaPath(target)}` };
          }
          const file = engine.mediaFiles[path];
          if (file === undefined) throw fail('uasrv.filesystem_error', 'no file at path');
          if (file === null) throw fail('uasrv.invalid_value', 'not an audio, video or MIDI file');
          const id = body.add_on_id.toLowerCase();
          if (!engine.has(`/gui/add_ons/${id}`)) throw fail('uasrv.not_installed', `no Add On ${id}`);
          const target = file === true ? path : file;
          engine.mediaServed.push({ addOnId: id, path: target });
          return { url: `ua-content://${localContentHost(id)}${encodeMediaPath(target)}` };
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
    this.addNode('/gui/add_ons', { properties: { blessed_folders: [] }, readOnly: ['blessed_folders'] });
    this.addNode('/gui/add_ons/com.example.demo', { properties: { id: 'com.example.demo', name: 'Demo', target: 'window', icon: '', floating: true, show_with_session: false, fixed_size: false, run_hidden: false, manufacturer: 'Example Co', description: 'A demo Add On.', version: '1.0.0', installed_from: 'folder' } });
    this.addNode('/gui/file_chooser');
    this.addNode('/gui/plugin_windows', { properties: { open: [] }, readOnly: ['open'] });
    if (options.gui === false) this.removeNode('/gui');
  }

  /** @internal The windows listed in `/gui/plugin_windows`. */
  pluginWindowsOpen(): PluginWindowKey[] {
    const open = this.value('/gui/plugin_windows', 'open');
    return Array.isArray(open) ? (open as PluginWindowKey[]) : [];
  }

  /** @internal Validate a show_plugin / hide_plugin payload as LUNA does (fact 126). */
  pluginWindowTarget(data: unknown, command: string): { slot: string; key: PluginWindowKey } {
    const fail = (code: string, why: string) => new UAError(code, `${command}: ${why}`, { cmd: 'post', path: `/gui/${command}` });
    const body = typeof data === 'object' && data !== null ? (data as { session_uid?: unknown; channel_uid?: unknown; insert_type?: unknown }) : {};
    if (typeof body.channel_uid !== 'string') throw fail('uasrv.missing_field', 'channel_uid is required');
    if (typeof body.insert_type !== 'string') throw fail('uasrv.missing_field', 'insert_type is required');
    if (!/^(effect_\d+|record_fx_\d+|midi_\d+|console|tape|bus_input|instrument|sidechain_filter)$/.test(body.insert_type)) throw fail('uasrv.invalid_value', `unknown insert_type ${body.insert_type}`);
    const sessionUid = typeof body.session_uid === 'string' ? body.session_uid : this.children('/sessions')[0];
    if (sessionUid === undefined || !this.has(`/sessions/${sessionUid}`)) throw fail('uasrv.invalid_value', 'no such open session');
    const base = `/sessions/${sessionUid}`;
    const channel = this.has(`${base}/tracks/${body.channel_uid}`) ? `${base}/tracks/${body.channel_uid}` : `${base}/buses/${body.channel_uid}`;
    return { slot: `${channel}/effects/${body.insert_type}`, key: { session_uid: sessionUid, channel_uid: body.channel_uid, insert_type: body.insert_type } };
  }

  /** What the next mock file dialog "selects"; empty means the user cancelled. */
  nextDialogFiles: string[] = [];

  /**
   * The files `/gui/serve_media_file` finds, by absolute path: `true` for an audio, video or
   * MIDI file it serves, `null` for one it refuses (not media, or media in name only), or the
   * path a link leads to, which is served under that path. A path not listed is missing.
   *
   * @example
   * engine.mediaFiles['/Movies/cut.mov'] = true;
   * engine.mediaFiles['/Movies/notes.mp4'] = null;
   * engine.mediaFiles['/Movies/latest.mov'] = '/Movies/cut.mov';
   */
  mediaFiles: Record<string, true | null | string> = {};

  /** Every file `/gui/serve_media_file` served, in order, by lowercase Add On id. */
  mediaServed: { addOnId: string; path: string }[] = [];

  /**
   * The marketplace `/gui/install_add_on` installs from: each package id to the ids of the
   * Add Ons in it, all lowercase.
   *
   * @example
   * engine.marketplace['uaudio-labs.midi-notation'] = ['com.uaudio.midi-notation', 'com.uaudio.score-view'];
   */
  marketplace: Record<string, string[]> = {};

  /** Package ids `/gui/install_add_on` treats as already installing. */
  installingPackages: string[] = [];

  /**
   * Package ids in {@link marketplace} that were imported from a link, which
   * `/gui/remove_imported_add_on` removes (from here and from `marketplace`); any other
   * package is the marketplace's own and is refused.
   */
  importedPackages: string[] = [];

  /**
   * Every install `/gui/install_add_on` started, in order: `{ id }` with the package id, or
   * `{ url }` with what LUNA fetches: a repo's URL (`https://github.com/<owner>/<repo>`), or
   * a Drive file's direct download
   * (`https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t`), or
   * an iCloud Drive share as `https://www.icloud.com/iclouddrive/<id>`, which LUNA resolves,
   * or a Dropbox file's download (`https://www.dropbox.com/scl/fi/<id>/<name>?rlkey=<key>&dl=1`).
   */
  addOnInstalls: ({ id: string } | { url: string })[] = [];

  /** Add On ids (lowercase) under `/gui/add_ons` that are built into LUNA, which `/gui/uninstall_add_on` refuses. */
  builtInAddOns: string[] = [];

  /** How the user answers LUNA's prompt for `/gui/uninstall_add_on`: `'remove'` (the default) takes the Add On out of `/gui/add_ons`, `'cancel'` leaves it. */
  uninstallAnswer: 'remove' | 'cancel' = 'remove';

  /** Every Add On id (lowercase) `/gui/uninstall_add_on` asked the user about, in order, whatever the answer. */
  addOnUninstalls: string[] = [];

  /**
   * The disk `/gui/list_files` reads: each folder's absolute path to the names inside it,
   * a trailing `/` marking a subfolder. A name starting with `.` is hidden, as in LUNA.
   *
   * @example
   * engine.folders['/Samples'] = ['kick.wav', 'Loops/', '.DS_Store'];
   */
  folders: Record<string, string[]> = {};

  /**
   * The folders `/gui/list_files` may read, it and every folder inside them (facts 106, 133):
   * the blessed folders. LUNA asks the user before blessing a folder picked in
   * `show_folder_dialog` (the mock asks {@link blessAnswer} for each of `nextDialogFiles`
   * that is in {@link folders}) or dropped on an Add On; set this, or call
   * {@link grantFolder}, to model an allowed drop or a folder blessed in an earlier run.
   * Anything else is `uasrv.not_permitted`.
   * The mock does not model links or LUNA's cap on how many folders it keeps.
   *
   * @example
   * engine.folders['/Samples'] = ['kick.wav'];
   * engine.grantFolder('/Samples');
   */
  get grantedFolders(): string[] {
    return this.blessed;
  }
  set grantedFolders(folders: string[]) {
    this.blessed = [...folders];
    // /gui/add_ons blessed_folders follows, as LUNA's does (fact 133).
    if (this.has('/gui/add_ons')) this.setValue('/gui/add_ons', 'blessed_folders', [...this.blessed]);
  }
  private blessed: string[] = [];

  /** Let `/gui/list_files` read the folder at `path` and the folders inside it. */
  grantFolder(path: string): void {
    const dir = normalizeFolder(path);
    if (!this.grantedFolders.includes(dir)) this.grantedFolders = [...this.grantedFolders, dir];
  }

  /** How the user answers LUNA's prompt for `/gui/add_blessed_folder` and for folders picked in `show_folder_dialog`: `'allow'` (the default) blesses them, `'dont_allow'` leaves them out. */
  blessAnswer: 'allow' | 'dont_allow' = 'allow';

  /** Every folder LUNA asked the user about (`/gui/add_blessed_folder`, `show_folder_dialog`), in order, whatever the answer. */
  blessRequests: string[] = [];

  /** Entries a recursive `/gui/list_files` returns before it sets `truncated` (LUNA: 10,000). */
  listLimit = 10000;

  /** @internal The blessed folder `dir` (normalized) is, or is inside; `undefined` for none. */
  blessedRootOf(dir: string): string | undefined {
    return this.grantedFolders.find((root) => dir === root || dir.startsWith(root === '/' ? '/' : `${root}/`));
  }

  /**
   * @internal Whether `path` is a file in {@link folders} (or {@link mediaFiles}) inside a
   * blessed folder with no hidden name below it, which serve_media_file serves whatever its
   * type (fact 133).
   */
  isBlessedFile(path: string): boolean {
    const file = normalizeFolder(path);
    const root = this.blessedRootOf(file);
    if (root === undefined || file === root) return false;
    const below = file.slice(root === '/' ? 1 : root.length + 1).split('/');
    if (below.some((part) => part.startsWith('.'))) return false;
    const cut = file.lastIndexOf('/');
    const listed = this.folders[cut > 0 ? file.slice(0, cut) : '/']?.includes(file.slice(cut + 1)) ?? false;
    const media = this.mediaFiles[path];
    // A link (a path in mediaFiles) counts only while it leads to a file inside the same folder.
    if (typeof media === 'string') return this.blessedRootOf(normalizeFolder(media)) === root;
    return listed || media !== undefined;
  }

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

  /**
   * Add a plugin to the catalog. `effectType` is the manifest's (comma separated, `effect`
   * when absent); `formats` the `[input, output]` stem formats it runs in (any when absent).
   */
  addPlugin(pluginId: string, options: { name?: string; manufacturer?: string; categories?: string[]; effectType?: string; formats?: [string, string][]; favorite?: boolean } = {}): void {
    const manifest: Record<string, unknown> = { manufacturer: options.manufacturer ?? 'Mock', name: options.name ?? pluginId, plugin_id: pluginId, categories: options.categories ?? [], short_names: [] };
    if (options.effectType !== undefined) manifest['effect_type'] = options.effectType;
    if (options.formats !== undefined) manifest['supported_stream_formats'] = { primary: options.formats };
    this.addNode(`/plugins/${pluginId}`, {
      properties: {
        plugin_id: pluginId,
        name: options.name ?? pluginId,
        version: '1.0.0',
        description: '',
        installed: true,
        favorite: options.favorite ?? false,
        authorized: null,
        default_preset_uid: null,
        manifest,
      },
    });
  }

  /** `/plugins/query` (fact 127), with LUNA's slot rules. Categories pass through untranslated. */
  queryPlugins(data: unknown): { plugins: Record<string, unknown>[] } {
    const body = (data ?? {}) as { search?: string; categories?: string[]; favorite?: boolean; insert_type?: string; session_uid?: string; channel_uid?: string; limit?: number };
    const fail = (msg: string, code = 'uasrv.invalid_value') => new UAError(code, `query: ${msg}`, { cmd: 'post', path: '/plugins/query' });
    const visible = ['effect', 'instrument', 'midi', 'unison'];
    let slotType: string | undefined;
    let checksFormat = false;
    if (body.insert_type !== undefined) {
      const slot = body.insert_type;
      if (/^(effect|record_fx)_\d+$/.test(slot)) [slotType, checksFormat] = ['effect', true];
      else if (/^midi_\d+$/.test(slot)) slotType = 'midi';
      else if (slot === 'instrument') [slotType, checksFormat] = ['instrument', true];
      else if (slot === 'tape') slotType = 'tape';
      else if (slot === 'bus_input') slotType = 'console';
      else if (slot === 'console') slotType = 'console_ext';
      else if (slot === 'sidechain_filter') slotType = '';
      else if (['reserved_0', 'bus_compressor', 'ara_editor_renderer'].includes(slot)) slotType = 'none';
      else throw fail(`unknown insert_type ${slot}`);
    }
    let channelFormat: string | undefined;
    if (body.channel_uid !== undefined) {
      const base = `/sessions/${body.session_uid ?? ''}`;
      if (!body.session_uid || !this.has(base)) throw fail('unknown session', 'error_code.session_missing');
      const channel = [`${base}/tracks/${body.channel_uid}`, `${base}/buses/${body.channel_uid}`].find((p) => this.has(p));
      if (!channel) throw fail('unknown channel');
      channelFormat = String(this.value(channel, 'stem_format') ?? '');
    }
    const search = (body.search ?? '').toLowerCase();
    const rows = this.children('/plugins')
      .map((id) => {
        const path = `/plugins/${id}`;
        const manifest = (this.value(path, 'manifest') ?? {}) as { manufacturer?: string; categories?: string[]; effect_type?: string; supported_stream_formats?: { primary?: [string, string][] } };
        return {
          plugin_id: id,
          name: String(this.value(path, 'name') ?? ''),
          manufacturer: manifest.manufacturer ?? '',
          categories: manifest.categories ?? [],
          favorite: this.value(path, 'favorite') === true,
          installed: this.value(path, 'installed') !== false,
          effectTypes: (manifest.effect_type || 'effect').split(','),
          formats: manifest.supported_stream_formats?.primary,
        };
      })
      .filter((p) => p.installed && p.name !== '')
      .filter((p) => !body.favorite || p.favorite)
      .filter((p) => !search || p.name.toLowerCase().includes(search) || p.manufacturer.toLowerCase().includes(search))
      .filter((p) => !body.categories?.length || p.categories.some((c) => body.categories!.includes(c)))
      .filter((p) => {
        if (slotType === 'none') return false;
        if (checksFormat && channelFormat && p.formats && !p.formats.some(([i, o]) => (i === channelFormat || i === 'any') && (o === channelFormat || o === 'any'))) return false;
        return slotType ? p.effectTypes.includes(slotType) : p.effectTypes.some((t) => visible.includes(t));
      })
      .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0));
    const limited = body.limit && body.limit > 0 ? rows.slice(0, body.limit) : rows;
    return { plugins: limited.map(({ plugin_id, name, manufacturer, categories, favorite }) => ({ plugin_id, name, manufacturer, categories, favorite })) };
  }

  /**
   * Add a preset for a plugin to the library (fact 98), with any `tags` (fact 120). Returns
   * its uid.
   */
  addPreset(pluginId: string, name: string, options: { uid?: string; factory?: boolean; favorite?: boolean; version?: number; tags?: string[] } = {}): string {
    this.ensurePresetPlugin(pluginId);
    const root = `/presets/plugins/${pluginId}/presets`;
    const uid = options.uid ?? `preset_${this.children(root).length + 1}_${pluginId}`;
    // `path` is the folder holding the preset: the plugin's factory or user root (fact 132).
    const folder = this.value(`/presets/plugins/${pluginId}`, options.factory ? 'factory_root' : 'user_root');
    this.addNode(`${root}/${uid}`, {
      properties: { uid, preset_name: name, version: options.version ?? 1, favorite: options.favorite ?? false, factory: options.factory ?? false, path: folder },
    });
    this.addNode(`${root}/${uid}/tags`, { properties: { type: 'tags' } });
    for (const tag of options.tags ?? []) {
      const rowid = this.nextRow();
      this.addNode(`${root}/${uid}/tags/${rowid}`, { properties: { type: 'tag', rowid, tag } });
    }
    return uid;
  }

  /**
   * `/presets/query` (facts 98, 120, 132). A plugin's presets, or a device type's; with
   * `device_type_id: "track"` and `include_instrument_presets`, also every installed instrument
   * plugin's presets, with `Instrument` dropped from the tags they must match and added to the
   * tags they report, and an `is_instrument_preset` column.
   */
  queryPresets(data: unknown): { results: Record<string, unknown>; folders: unknown[] } {
    const body = (data ?? {}) as { plugin_id?: string; device_type_id?: string; search?: string; favorite?: boolean; limit?: number; tag?: string | string[]; union?: boolean; tags?: boolean; include_instrument_presets?: boolean };
    if (!body.plugin_id && !body.device_type_id) throw new UAError('uasrv.invalid_type', 'query: plugin_id or device_type_id required', { cmd: 'post', path: '/presets/query' });
    const wanted = (Array.isArray(body.tag) ? body.tag : body.tag !== undefined ? [body.tag] : []).filter((t) => t !== '');
    // A single string tag is always matched alone; `union` applies to a list only.
    const any = Array.isArray(body.tag) && body.union === true;
    const search = (body.search ?? '').toLowerCase();
    const list = (root: string, tagsOf: (uid: string) => string[], tags: string[]) =>
      this.children(root)
        .map((uid) => ({
          uid,
          name: String(this.value(`${root}/${uid}`, 'preset_name') ?? uid),
          version: Number(this.value(`${root}/${uid}`, 'version') ?? 1),
          favorite: this.value(`${root}/${uid}`, 'favorite') ? 1 : 0,
          factory: this.value(`${root}/${uid}`, 'factory') ? 1 : 0,
          path: String(this.value(`${root}/${uid}`, 'path') ?? ''),
          tags: tagsOf(uid),
          instrument: false,
        }))
        .filter((r) => tags.length === 0 || (any ? tags.some((t) => r.tags.includes(t)) : tags.every((t) => r.tags.includes(t))))
        .filter((r) => !search || r.name.toLowerCase().includes(search))
        .filter((r) => !body.favorite || r.favorite === 1);
    const limit = <T>(rows: T[]) => (body.limit !== undefined && body.limit > 0 ? rows.slice(0, body.limit) : rows);
    let rows = body.plugin_id
      ? limit(list(`/presets/plugins/${body.plugin_id}/presets`, (uid) => this.presetTags(body.plugin_id!, uid), wanted))
      : limit(list(`/presets/devices/${body.device_type_id}/presets`, (uid) => this.presetTagsAt(`/presets/devices/${body.device_type_id}/presets/${uid}/tags`), wanted));
    const merge = !body.plugin_id && body.device_type_id === 'track' && body.include_instrument_presets === true;
    if (merge) {
      const pluginTags = wanted.filter((t) => t !== 'Instrument');
      for (const pluginId of this.instrumentPluginIds()) {
        const found = limit(list(`/presets/plugins/${pluginId}/presets`, (uid) => this.presetTags(pluginId, uid), pluginTags));
        rows = rows.concat(found.map((r) => ({ ...r, instrument: true, tags: r.tags.includes('Instrument') ? r.tags : [...r.tags, 'Instrument'] })));
      }
    }
    const results: Record<string, unknown> = { num_rows: rows.length };
    for (const k of ['uid', 'name', 'version', 'favorite', 'factory', 'path'] as const) results[k] = rows.map((r) => r[k]);
    if (body.tags) results['tags'] = rows.map((r) => r.tags);
    if (merge) results['is_instrument_preset'] = rows.map((r) => r.instrument);
    return { results, folders: [] };
  }

  /** @internal Installed plugins whose manifest makes them instruments. */
  instrumentPluginIds(): string[] {
    return this.children('/plugins').filter((id) => {
      const manifest = (this.value(`/plugins/${id}`, 'manifest') ?? {}) as { effect_type?: string };
      return this.value(`/plugins/${id}`, 'installed') !== false && (manifest.effect_type ?? '').split(',').includes('instrument');
    });
  }

  /**
   * Add a track preset to the library (fact 132). Like LUNA when it saves one, it is tagged
   * with its category (`Audio`, `Instrument`, `Bus`, or `Multi-Track` for more than one
   * track) besides any `tags`. `new_track` with it makes one track of `trackType` named after
   * it, or, with `trackNames`, a track per name, named as the preset saved them. Returns its uid.
   */
  addTrackPreset(name: string, options: { uid?: string; trackType?: 'audio' | 'instrument' | 'bus'; trackNames?: string[]; factory?: boolean; favorite?: boolean; tags?: string[] } = {}): string {
    const root = '/presets/devices/track/presets';
    const uid = options.uid ?? `track_preset_${this.children(root).length + 1}`;
    const trackType = options.trackType ?? 'audio';
    const count = options.trackNames?.length ?? 1;
    this.addNode(`${root}/${uid}`, {
      properties: { uid, preset_name: name, version: 1, favorite: options.favorite ?? false, factory: options.factory ?? false, path: '', track_type: trackType, track_names: options.trackNames ?? null },
    });
    this.addNode(`${root}/${uid}/tags`, { properties: { type: 'tags' } });
    const category = count > 1 ? 'Multi-Track' : { audio: 'Audio', instrument: 'Instrument', bus: 'Bus' }[trackType];
    for (const tag of [category, ...(options.tags ?? [])]) {
      const rowid = this.nextRow();
      this.addNode(`${root}/${uid}/tags/${rowid}`, { properties: { type: 'tag', rowid, tag } });
    }
    return uid;
  }

  /** Add a group of track preset tags, as {@link addPresetTagGroup} does for a plugin. */
  addTrackPresetTagGroup(name: string, tags: string[], options: { category?: string } = {}): string {
    return this.addTagGroupAt('/presets/devices/track/categories', name, tags, options);
  }

  /** @internal The preset `uid` names: a track preset, or a plugin preset with its plugin. */
  findPreset(uid: string): { kind: 'track'; path: string } | { kind: 'plugin'; path: string; pluginId: string } | undefined {
    const track = `/presets/devices/track/presets/${uid}`;
    if (this.has(track)) return { kind: 'track', path: track };
    for (const pluginId of this.children('/presets/plugins')) {
      const path = `/presets/plugins/${pluginId}/presets/${uid}`;
      if (this.has(path)) return { kind: 'plugin', path, pluginId };
    }
    return undefined;
  }

  /** @internal Put a plugin on a track's instrument slot (or first effect slot), on a preset. */
  putPluginPreset(track: string, pluginId: string, presetPath: string): void {
    const instrument = this.instrumentPluginIds().includes(pluginId);
    const slot = `${track}/effects/${instrument ? 'instrument' : 'effect_0'}`;
    if (!this.has(slot)) {
      this.addNode(slot, { properties: { uid: `${track}_instrument`, insert_type: 'instrument', plugin_id: null, plugin_name: null, external_sdk_instance_id: null, enabled: true, plugin_power: true, preset_name: null, preset_uid: null, preset_uid_dirty: false }, readOnly: ['uid', 'insert_type', 'plugin_id', 'plugin_name'] });
      this.addNode(`${slot}/controls`);
    }
    this.setValue(slot, 'plugin_id', pluginId);
    this.setValue(slot, 'plugin_name', this.value(`/plugins/${pluginId}`, 'name') ?? pluginId);
    this.setValue(slot, 'preset_uid', this.value(presetPath, 'uid'));
    this.setValue(slot, 'preset_name', this.value(presetPath, 'preset_name'));
    this.setValue(slot, 'preset_uid_dirty', false);
  }

  /**
   * `post /presets/devices/track/load` (fact 132): a track preset or an instrument plugin's
   * preset onto a track. The track records the preset and takes its name unless its
   * `name_modified` is true; a name set through `set` does not make it so.
   */
  loadTrackPreset(data: unknown): null {
    const body = (data ?? {}) as { session_uid?: string; uid?: string; preset_uid?: string };
    const where = { cmd: 'post', path: '/presets/devices/track/load' };
    const track = `/sessions/${body.session_uid ?? ''}/tracks/${body.uid ?? ''}`;
    if (!body.session_uid || !body.preset_uid) throw new UAError('uasrv.invalid_property', 'load: session_uid and preset_uid required', where);
    const preset = this.findPreset(body.preset_uid);
    if (!preset || !this.has(track)) throw new UAError('device.database_error', 'load: no such track or preset', where);
    if (preset.kind === 'plugin') {
      if (this.instrumentPluginIds().includes(preset.pluginId) && this.value(track, 'track_type') !== 'instrument') throw new UAError('uasrv.invalid_value', 'load: an instrument preset needs an instrument track', where);
      this.putPluginPreset(track, preset.pluginId, preset.path);
    }
    const name = this.value(preset.path, 'preset_name');
    this.setValue(track, 'preset_uid', body.preset_uid);
    this.setValue(track, 'preset_name', name);
    if (this.value(track, 'name_modified') !== true) this.setValue(track, 'name', name);
    return null;
  }

  /**
   * Add a group of preset tags for a plugin, as LUNA keeps them: a sub-category named `name`
   * under the category `category` (default `Default`) holding the tags (fact 120). Returns
   * the sub-category uid.
   */
  addPresetTagGroup(pluginId: string, name: string, tags: string[], options: { category?: string } = {}): string {
    this.ensurePresetPlugin(pluginId);
    return this.addTagGroupAt(`/presets/plugins/${pluginId}/categories`, name, tags, options);
  }

  private addTagGroupAt(categories: string, name: string, tags: string[], options: { category?: string }): string {
    const categoryName = options.category ?? 'Default';
    let categoryUid = this.children(categories).find((c) => this.value(`${categories}/${c}`, 'name') === categoryName);
    if (!categoryUid) {
      categoryUid = `cat_${this.nextRow()}`;
      this.addNode(`${categories}/${categoryUid}`, { properties: { type: 'category', rowid: this.nextRow(), uid: categoryUid, name: categoryName } });
      this.addNode(`${categories}/${categoryUid}/sub_categories`, { properties: { type: 'sub_categories' } });
    }
    const subUid = `sub_${this.nextRow()}`;
    const sub = `${categories}/${categoryUid}/sub_categories/${subUid}`;
    this.addNode(sub, { properties: { type: 'sub_category', rowid: this.nextRow(), uid: subUid, name } });
    this.addNode(`${sub}/tags`, { properties: { type: 'tags' } });
    for (const tag of tags) {
      const rowid = this.nextRow();
      this.addNode(`${sub}/tags/${rowid}`, { properties: { type: 'tag', rowid, tag } });
    }
    return subUid;
  }

  /** Connect or disconnect UA Assistant, which preset recommendations need (fact 121). */
  setAssistantEnabled(enabled: boolean): void {
    this.setValue('/assistant', 'enabled', enabled);
  }

  /**
   * Script what UA Assistant recommends for a plugin. Without one the mock ranks the plugin's
   * presets by how many words of the query appear in their name or tags.
   */
  setPresetRecommendations(pluginId: string, recommend: (query: string) => { preset_name: string; preset_uuid: string; rrf_score: number }[]): void {
    this.recommenders.set(pluginId, recommend);
  }

  /** @internal */
  presetTags(pluginId: string, uid: string): string[] {
    return this.presetTagsAt(`/presets/plugins/${pluginId}/presets/${uid}/tags`);
  }

  /** @internal */
  presetTagsAt(folder: string): string[] {
    return this.children(folder).map((t) => String(this.value(`${folder}/${t}`, 'tag') ?? '')).filter((t) => t !== '');
  }

  /** @internal */
  recommendPresets(pluginId: string, query: string): { preset_name: string; preset_uuid: string; rrf_score: number }[] {
    const scripted = this.recommenders.get(pluginId);
    if (scripted) return scripted(query);
    const words = query.toLowerCase().split(/\s+/).filter((w) => w !== '');
    const root = `/presets/plugins/${pluginId}/presets`;
    return this.children(root)
      .map((uid) => {
        const name = String(this.value(`${root}/${uid}`, 'preset_name') ?? uid);
        const haystack = [name, ...this.presetTags(pluginId, uid)].join(' ').toLowerCase();
        const hits = words.filter((w) => haystack.includes(w)).length;
        return { preset_name: name, preset_uuid: uid, rrf_score: hits / 60 };
      })
      .filter((r) => r.rrf_score > 0)
      .sort((a, b) => b.rrf_score - a.rrf_score)
      .slice(0, 5);
  }

  /**
   * `/presets/plugins/<id>` with its `load` command: put a preset's identity on the effect
   * whose `uid` is given (fact 122).
   */
  private ensurePresetPlugin(pluginId: string): void {
    const path = `/presets/plugins/${pluginId}`;
    if (this.has(path)) return;
    this.addNode(path, {
      properties: { plugin_id: pluginId, factory_root: `/Mock/factory_presets/${pluginId}`, user_root: `/Mock/Presets/Plug-Ins/${pluginId}` },
      commands: {
        load: (data, engine) => {
          const body = (data ?? {}) as { session_uid?: string; uid?: string; preset_uid?: string };
          const preset = `${path}/presets/${body.preset_uid ?? ''}`;
          const effect = engine.effectPathByUid(body.session_uid ?? '', body.uid ?? '');
          if (!effect || !body.preset_uid || !engine.has(preset)) throw new UAError('uasrv.invalid_property', 'load: no such effect or preset', { cmd: 'post', path: `${path}/load` });
          engine.setValue(effect, 'preset_uid', body.preset_uid);
          engine.setValue(effect, 'preset_name', engine.value(preset, 'preset_name'));
          engine.setValue(effect, 'preset_uid_dirty', false);
          return null;
        },
      },
    });
    this.addNode(`${path}/presets`, { properties: { type: 'presets' } });
    this.addNode(`${path}/categories`, { properties: { type: 'categories' } });
  }

  /** @internal The effect slot under `session` whose `uid` is `uid`. */
  effectPathByUid(session: string, uid: string): string | undefined {
    const prefix = `/sessions/${session}/`;
    for (const [path, node] of this.nodes) {
      if (path.startsWith(prefix) && /\/effects\/[^/]+$/.test(path) && node.properties.get('uid') === uid) return path;
    }
    return undefined;
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
    this.clipChanged(clean);
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
    this.clipChanged(clean);
  }

  /** @internal Drop a property; LUNA pushes nothing for it (fact 110). */
  deleteValue(nodePath: string, property: string): void {
    this.nodes.get(normalize(nodePath))?.properties.delete(property);
  }

  /** Engine-side property change: updates the tree and pushes to every subscribed port. */
  setValue(nodePath: string, property: string, value: unknown): void {
    const clean = normalize(nodePath);
    const node = this.nodes.get(clean);
    if (!node) throw new Error(`MockEngine: no node ${nodePath}`);
    node.properties.set(property, value);
    this.push({ path: `${clean}/${property}/value`, data: value }, undefined);
    this.clipChanged(clean);
    // Stopped, the location follows the play start (fact 90) — engine-side too, so a test
    // moving the play start behaves like LUNA whichever side set it.
    if (property === 'play_start' && /^\/sessions\/[^/]+$/.test(clean) && node.properties.get('playing') !== true) {
      this.setValue(clean, 'location', this.locationAt(clean, Number(value)));
    }
    // A new taper keeps the control's dB and moves its fader (fact 134).
    if (property === 'taper' && typeof node.properties.get('real_value') === 'number' && node.properties.get('discrete') !== true) {
      this.setValue(clean, 'normalized_value', faderTaper(node.properties).toNormalized(Number(node.properties.get('real_value'))));
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

  /**
   * What a playlist plays (fact 116): every clip cut at every clip edge, each piece given to
   * the highest layer (then the narrower clip, then the larger uid), neighbouring pieces of one
   * clip joined. Time order.
   */
  private segmentsOf(playlistPath: string) {
    const clips = this.children(`${playlistPath}/clips`).map((uid) => {
      const p = this.nodes.get(`${playlistPath}/clips/${uid}`)!.properties;
      return { uid, path: `${playlistPath}/clips/${uid}`, name: p.get('name'), start: Number(p.get('start') ?? 0), stop: Number(p.get('stop') ?? 0), layer: Number(p.get('layer') ?? 0), sourceStart: Number(p.get('source_start') ?? 0), sourceStop: Number(p.get('source_stop') ?? 0) };
    }).filter((c) => c.stop > c.start);
    const edges = [...new Set(clips.flatMap((c) => [c.start, c.stop]))].sort((a, b) => a - b);
    const segments: { clip: (typeof clips)[number]; start: number; stop: number }[] = [];
    for (let i = 0; i + 1 < edges.length; i++) {
      const [from, to] = [edges[i]!, edges[i + 1]!];
      const winner = clips
        .filter((c) => c.start <= from && c.stop >= to)
        .sort((a, b) => b.layer - a.layer || (a.stop - a.start) - (b.stop - b.start) || (a.uid < b.uid ? 1 : a.uid > b.uid ? -1 : 0))[0];
      if (!winner) continue;
      const last = segments.at(-1);
      if (last && last.clip === winner && last.stop === from) last.stop = to;
      else segments.push({ clip: winner, start: from, stop: to });
    }
    return segments;
  }

  /**
   * One segment's fades as LUNA compiles them (fact 117): a crossfade with the segment it
   * adjoins, measured from the edit between them, whether the clips are butted or overlap;
   * otherwise the clip's plain fade-in on its first segment and fade-out on its last.
   */
  private segmentFades(segments: ReturnType<MockEngine['segmentsOf']>, i: number, playlistPath: string) {
    const seg = segments[i]!;
    const prev = segments[i - 1]?.stop === seg.start ? segments[i - 1] : undefined;
    const next = segments[i + 1]?.start === seg.stop ? segments[i + 1] : undefined;
    const rows = this.fadeRows(`${playlistPath}/clips/${seg.clip.uid}`);
    const abs = (r: MockFadeRow | undefined, edge: number) => (r ? { ...r, start: edge + r.startOffset, stop: edge + r.stopOffset, clipPath: seg.clip.path } : undefined);
    const crossIn = prev && rows.find((r) => r.type === 'fade_in' && r.contributor === prev.clip.uid);
    const crossOut = next && rows.find((r) => r.type === 'fade_out' && r.contributor === next.clip.uid);
    const plainIn = seg.start === seg.clip.start ? rows.find((r) => r.type === 'fade_in' && !r.contributor) : undefined;
    const plainOut = seg.stop === seg.clip.stop ? rows.find((r) => r.type === 'fade_out' && !r.contributor) : undefined;
    return { fin: crossIn ? abs(crossIn, seg.start) : abs(plainIn, seg.clip.start), fout: crossOut ? abs(crossOut, seg.stop) : abs(plainOut, seg.clip.stop) };
  }

  /** A clip node or one of its properties changed: recompile its playlist if a client enabled that. */
  private clipChanged(path: string): void {
    const m = /^(\/sessions\/[^/]+\/playlists\/[^/]+)\/clips\/[^/]+(?:\/fades(?:\/[^/]+)?)?$/.exec(path);
    if (m && this.nodes.get(m[1]!)?.properties.get('enable_compiled_clips') === true) this.compilePlaylist(m[1]!);
  }

  /**
   * Publish a playlist's compiled clips the way deviced's clip compiler and
   * `Sesn_CompiledClips` do (fact 116): cut every clip at every clip edge, give each piece to
   * the highest layer (then the narrower clip, then the larger uid), join neighbouring pieces
   * of one clip, and cut each segment's source range out through the tempo map. Nodes are
   * named by a running counter and updated in place while their start stays put. The mock
   * keeps no fades, so they publish as null and the full range equals the segment.
   */
  private compilePlaylist(playlistPath: string): void {
    const sessionPath = playlistPath.slice(0, playlistPath.indexOf('/playlists/'));
    const folder = `${playlistPath}/compiled_clips`;
    if (!this.nodes.has(folder)) this.addNode(folder);
    const segments = this.segmentsOf(playlistPath);
    type Seg = (typeof segments)[number];
    const clips = segments.map((s) => s.clip);
    const state = this.compiled.get(playlistPath) ?? { byStart: new Map<number, string>(), next: 0 };
    this.compiled.set(playlistPath, state);
    const sourceAt = (clip: Seg['clip'], tick: number) => Math.round(clip.sourceStart + (this.secondsAt(sessionPath, tick) - this.secondsAt(sessionPath, clip.start)) * 1e9);
    const kept = new Set<number>();
    for (const seg of segments) {
      kept.add(seg.start);
      const props: Record<string, unknown> = { clip_uid: seg.clip.uid, name: seg.clip.name, start: seg.start, stop: seg.stop, source_start: sourceAt(seg.clip, seg.start), source_stop: sourceAt(seg.clip, seg.stop) };
      if (this.compiledClipFades) {
        const { fin, fout } = this.segmentFades(segments, segments.indexOf(seg), playlistPath);
        Object.assign(props, { full_start: fin?.contributor ? Math.min(seg.start, fin.start) : seg.start, full_stop: fout?.contributor ? Math.max(seg.stop, fout.stop) : seg.stop });
        // A stretched clip is rendered piece by piece (fact 116): the clip's own render is its
        // first piece's, and each later piece gets `<render>_<n>`, starting at that piece.
        const clipProps = this.nodes.get(`${playlistPath}/clips/${seg.clip.uid}`)!.properties;
        const clipRender = clipProps.get('render_state') === 'current' ? clipProps.get('render_source_uid') : undefined;
        if (typeof clipRender === 'string' && clipRender) {
          const piece = segments.filter((s) => s.clip === seg.clip).indexOf(seg);
          Object.assign(props, { render_source_uid: piece === 0 ? clipRender : `${clipRender}_${piece}`, render_source_start: 0, render_source_stop: Math.round((this.secondsAt(sessionPath, seg.stop) - this.secondsAt(sessionPath, seg.start)) * 1e9), needs_render: true });
        } else Object.assign(props, { render_source_uid: null, render_source_start: null, render_source_stop: null, needs_render: false });
        for (const [side, f] of [['fade_in', fin], ['fade_out', fout]] as const) {
          props[`${side}_uid`] = f?.uid ?? null;
          props[`${side}_start`] = f?.start ?? null;
          props[`${side}_stop`] = f?.stop ?? null;
          props[`${side}_shape`] = f?.shape ?? null;
          props[`${side}_curvature`] = f ? f.curvature : null;
          props[`${side}_crossfade`] = f ? f.contributor !== undefined : null;
          props[`${side}_contributor_clip_uid`] = f?.contributor ?? null;
        }
      }
      const name = state.byStart.get(seg.start);
      if (name === undefined || !this.nodes.has(`${folder}/${name}`)) {
        const fresh = String(state.next++);
        state.byStart.set(seg.start, fresh);
        this.addNode(`${folder}/${fresh}`, { properties: props, readOnly: Object.keys(props) });
        continue;
      }
      const node = this.nodes.get(`${folder}/${name}`)!;
      for (const [k, v] of Object.entries(props)) if (node.properties.get(k) !== v) this.setValue(`${folder}/${name}`, k, v);
    }
    for (const [start, name] of [...state.byStart]) {
      if (kept.has(start)) continue;
      state.byStart.delete(start);
      this.removeNode(`${folder}/${name}`);
    }
  }

  private fadeCounter = 0;

  /** @internal A clip uid free on the playlist: `clip<n>`, counting on from the clips there. */
  nextClipId(base: string, playlist: string): string {
    const taken = new Set(this.children(`${base}/playlists/${playlist}/clips`));
    let n = taken.size + 1;
    while (taken.has(`clip${n}`)) n++;
    return `clip${n}`;
  }

  /** A clip's stored fade rows (`<clip>/fades/<uid>`), offsets relative to the clip edge. */
  private fadeRows(clipPath: string): MockFadeRow[] {
    return this.children(`${clipPath}/fades`).map((uid) => {
      const p = this.nodes.get(`${clipPath}/fades/${uid}`)!.properties;
      const contributor = p.get('contributor_clip_uid');
      return {
        uid,
        type: String(p.get('fade_type')),
        shape: String(p.get('fade_shape') ?? 'log'),
        curvature: Number(p.get('fade_curvature') ?? 0),
        startOffset: Number(p.get('start_offset') ?? 0),
        stopOffset: Number(p.get('stop_offset') ?? 0),
        contributor: typeof contributor === 'string' && contributor ? contributor : undefined,
      };
    });
  }

  /** Create or update a fade row the way `set_fade` does: shape only for a new one (fact 117). */
  private putFade(clipPath: string, type: 'fade_in' | 'fade_out', contributor: string | undefined, startOffset: number, stopOffset: number, shape: string, results: { added: unknown[]; changed: unknown[] }): void {
    const existing = this.fadeRows(clipPath).find((r) => r.type === type && r.contributor === contributor);
    if (existing) {
      if (existing.startOffset === startOffset && existing.stopOffset === stopOffset) return;
      this.setValue(`${clipPath}/fades/${existing.uid}`, 'start_offset', startOffset);
      this.setValue(`${clipPath}/fades/${existing.uid}`, 'stop_offset', stopOffset);
      results.changed.push({ fade_uid: existing.uid, properties: { start_offset: startOffset, stop_offset: stopOffset } });
      return;
    }
    const uid = `fade${++this.fadeCounter}`;
    const clipUid = splitPath(clipPath).name;
    const properties = { uid, clip_uid: clipUid, contributor_clip_uid: contributor ?? null, fade_type: type, fade_shape: shape, start_offset: startOffset, stop_offset: stopOffset, fade_curvature: 0, fade_reference_edge: false };
    this.addNode(`${clipPath}/fades/${uid}`, { properties, readOnly: ['uid', 'clip_uid', 'contributor_clip_uid'] });
    results.added.push({ clip_uid: clipUid, fade_uid: uid, properties });
  }

  /** The tick `seconds` after `tick` through the tempo map. */
  private tickAfter(sessionPath: string, tick: number, seconds: number): number {
    const target = this.secondsAt(sessionPath, tick) + seconds;
    let lo = tick, hi = tick + 96_000_000_000;
    while (this.secondsAt(sessionPath, hi) < target) hi += hi - tick;
    for (let i = 0; i < 64; i++) {
      const mid = (lo + hi) / 2;
      if (this.secondsAt(sessionPath, mid) < target) lo = mid; else hi = mid;
    }
    return Math.round(hi);
  }

  /** The playlists a context edit names: `playlist_uid`, else `track_uid` (active playlists), else the selection. */
  private editPlaylists(base: string, body: Record<string, unknown>, tracksOnly = false): string[] {
    const list = (v: unknown) => (v === undefined || v === null ? undefined : (Array.isArray(v) ? v : [v]).map(String));
    const tracks = list(body['track_uid']);
    if (tracks) return tracks.map((t) => String(this.value(`${base}/tracks/${t}`, 'playlist_uid')));
    const playlists = tracksOnly ? undefined : list(body['playlist_uid']);
    return playlists ?? list(this.value(`${base}/contexts/main`, 'selection_playlists')) ?? [];
  }

  /**
   * @internal The clip and fade edits of the edit context, as measured on LUNA (fact 117):
   * explicit ranges where LUNA takes them, the selection where it reads one.
   */
  clipEdit(base: string, command: string, data: unknown): unknown {
    const body = (data ?? {}) as Record<string, unknown>;
    const ctx = `${base}/contexts/main`;
    const clipsOf = (pl: string) =>
      this.children(`${base}/playlists/${pl}/clips`).map((uid) => {
        const path = `${base}/playlists/${pl}/clips/${uid}`;
        const p = this.nodes.get(path)!.properties;
        return { uid, path, start: Number(p.get('start')), stop: Number(p.get('stop')), sourceUid: p.get('source_uid'), sourceStart: Number(p.get('source_start') ?? 0), sourceStop: Number(p.get('source_stop') ?? 0) };
      });
    const nsBetween = (a: number, b: number) => Math.round((this.secondsAt(base, b) - this.secondsAt(base, a)) * 1e9);
    const newClipFrom = (pl: string, fromPath: string, props: Record<string, unknown>) => {
      const id = this.nextClipId(base, pl);
      const source = Object.fromEntries(this.nodes.get(fromPath)!.properties);
      this.addNode(`${base}/playlists/${pl}/clips/${id}`, { properties: { ...source, uid: id, ...props } });
      return id;
    };
    switch (command) {
      case 'move_clips': {
        const start = Number(body['start'] ?? this.value(ctx, 'selection_start'));
        const stop = Number(body['stop'] ?? this.value(ctx, 'selection_stop'));
        const location = Number(body['location']);
        if (!Number.isFinite(location)) throw new UAError('uasrv.invalid_property', 'move_clips: location is required', { cmd: 'post', path: `${ctx}/commands/move_clips` });
        for (const pl of this.editPlaylists(base, body)) {
          // LUNA moves the pieces that show, not clips (Edit_MoveClipsHelper, fact 119): each
          // clip with a piece wholly inside the range moves that part of itself. If the clip
          // also shows outside the range it is split there and the part moves as a new clip;
          // if the rest is hidden it is trimmed to the part and moved.
          const segments = this.segmentsOf(`${base}/playlists/${pl}`);
          const inside = segments.filter((s) => s.start >= start && s.stop <= stop);
          for (const clip of [...new Set(inside.map((s) => s.clip))]) {
            const from = Math.max(clip.start, start), to = Math.min(clip.stop, stop);
            const at = (tick: number) => clip.sourceStart + nsBetween(clip.start, tick);
            const dest = location + (from - start);
            const moved = { start: dest, stop: dest + (to - from), source_start: at(from), source_stop: at(to) };
            const before = segments.some((s) => s.clip === clip && s.stop <= start);
            const after = segments.some((s) => s.clip === clip && s.start >= stop);
            if (body['copy'] === true) { newClipFrom(pl, clip.path, moved); continue; }
            if (!before && !after) { for (const [k, v] of Object.entries(moved)) this.setValue(clip.path, k, v); continue; }
            newClipFrom(pl, clip.path, moved);
            if (before && after) newClipFrom(pl, clip.path, { start: to, stop: clip.stop, source_start: at(to), source_stop: clip.sourceStop });
            if (before) { this.setValue(clip.path, 'stop', from); this.setValue(clip.path, 'source_stop', at(from)); }
            else { this.setValue(clip.path, 'start', to); this.setValue(clip.path, 'source_start', at(to)); }
          }
        }
        this.setValue(ctx, 'selection_start', location);
        this.setValue(ctx, 'selection_stop', location + (stop - start));
        return null;
      }
      case 'separate_clips': {
        const locations = [...new Set((Array.isArray(body['location']) ? body['location'] : [body['location']]).map(Number))].sort((a, b) => a - b);
        for (const pl of this.editPlaylists(base, body)) {
          for (const c of clipsOf(pl)) {
            const cuts = locations.filter((l) => l > c.start && l < c.stop);
            if (!cuts.length) continue;
            const edges = [c.start, ...cuts, c.stop];
            const at = (tick: number) => c.sourceStart + nsBetween(c.start, tick);
            // Crossfades are not kept, and the fade-out moves to the last piece (fact 117).
            const rows = this.fadeRows(c.path);
            for (const r of rows.filter((r) => r.contributor)) this.removeNode(`${c.path}/fades/${r.uid}`);
            const fadeOut = rows.find((r) => r.type === 'fade_out' && !r.contributor);
            let last = '';
            for (let i = 1; i + 1 < edges.length; i++) last = newClipFrom(pl, c.path, { start: edges[i], stop: edges[i + 1], source_start: at(edges[i]!), source_stop: at(edges[i + 1]!) });
            this.setValue(c.path, 'stop', cuts[0]);
            this.setValue(c.path, 'source_stop', at(cuts[0]!));
            if (fadeOut) {
              this.removeNode(`${c.path}/fades/${fadeOut.uid}`);
              this.putFade(`${base}/playlists/${pl}/clips/${last}`, 'fade_out', undefined, fadeOut.startOffset, fadeOut.stopOffset, fadeOut.shape, { added: [], changed: [] });
            }
          }
        }
        return null;
      }
      case 'heal_separation': {
        const selStart = Number(this.value(ctx, 'selection_start'));
        const selStop = Number(this.value(ctx, 'selection_stop'));
        for (const pl of this.editPlaylists(base, {})) {
          // The clips starting in (start, stop], and the one running into start, chosen once (fact 117).
          const set = clipsOf(pl).filter((c) => (c.start > selStart && c.start <= selStop) || (c.start <= selStart && c.stop > selStart)).sort((a, b) => a.start - b.start);
          let left = set[0];
          for (const right of set.slice(1)) {
            const continues = left!.sourceUid === right.sourceUid && right.start >= left!.stop && Math.abs(right.sourceStart - nsBetween(left!.stop, right.start) - left!.sourceStop) <= 1024;
            if (!continues) { left = right; continue; }
            this.removeNode(right.path);
            this.setValue(left!.path, 'stop', right.stop);
            this.setValue(left!.path, 'source_stop', right.sourceStop);
            left = { ...left!, stop: right.stop, sourceStop: right.sourceStop };
          }
        }
        return null;
      }
      case 'set_fade': {
        const shape = typeof body['fade_shape'] === 'string' && ['linear', 'equal_power', 'log'].includes(body['fade_shape']) ? body['fade_shape'] : 'log';
        const entries = Array.isArray(body['clips']) ? (body['clips'] as Record<string, unknown>[]) : [body];
        const results = { added: [] as unknown[], changed: [] as unknown[] };
        for (const f of entries) {
          const clipPath = this.findClip(base, String(f['clip_uid'] ?? ''));
          // LUNA answers success, changing nothing, for an unknown or non-audio clip (fact 117).
          if (!clipPath || ![0, 'audio', undefined].includes(this.value(clipPath, 'clip_type') as number | string | undefined)) continue;
          const so = Number(f['start_offset'] ?? 0);
          const eo = Number(f['stop_offset'] ?? 0);
          const contributor = typeof f['contributor_clip_uid'] === 'string' && f['contributor_clip_uid'] ? f['contributor_clip_uid'] : undefined;
          if (f['fade_type'] === 'fade_in') this.putFade(clipPath, 'fade_in', undefined, 0, eo, shape, results);
          else if (f['fade_type'] === 'fade_out') this.putFade(clipPath, 'fade_out', undefined, so, 0, shape, results);
          else if (f['fade_type'] === 'cross_fade' && contributor) {
            const right = this.findClip(base, contributor);
            if (!right) continue;
            this.putFade(clipPath, 'fade_out', contributor, so, eo, shape, results);
            this.putFade(right, 'fade_in', splitPath(clipPath).name, so, eo, shape, results);
          } else throw new UAError('uasrv.invalid_object', 'set_fade: unknown fade_type', { cmd: 'post', path: `${ctx}/commands/set_fade` });
        }
        const out: Record<string, unknown> = {};
        if (results.added.length) out['added'] = { fades: results.added };
        if (results.changed.length) out['changed'] = { fades: results.changed };
        return Object.keys(out).length ? { edit_results: out } : null;
      }
      case 'delete_fades': {
        const start = Number(body['start'] ?? this.value(ctx, 'selection_start'));
        const stop = Number(body['stop'] ?? this.value(ctx, 'selection_stop'));
        for (const pl of this.editPlaylists(base, body)) {
          // Only segments overlapping the range are looked at, and their fades as compiled (fact 117).
          const playlistPath = `${base}/playlists/${pl}`;
          const segments = this.segmentsOf(playlistPath);
          const doomed = segments.flatMap((s, i) => {
            if (!(s.start < stop && s.stop > start)) return [];
            const { fin, fout } = this.segmentFades(segments, i, playlistPath);
            return [fin, fout].filter((f): f is NonNullable<typeof f> => f !== undefined && f.start >= start && f.stop <= stop).map((f) => `${f.clipPath}/fades/${f.uid}`);
          });
          for (const path of new Set(doomed)) this.removeNode(path);
        }
        return null;
      }
      case 'batch_fades': {
        const start = Number(body['start'] ?? this.value(ctx, 'selection_start'));
        const stop = Number(body['stop'] ?? this.value(ctx, 'selection_stop'));
        const seconds = Number(body['length'] ?? 0) / 1e9;
        const shape = typeof body['fade_shape'] === 'string' ? body['fade_shape'] : 'log';
        const results = { added: [] as unknown[], changed: [] as unknown[] };
        // LUNA reaches the lane through the track (fact 117).
        for (const pl of this.editPlaylists(base, body, true)) {
          const clips = clipsOf(pl).filter((c) => c.start < stop && c.stop > start).sort((a, b) => a.start - b.start);
          for (const [i, c] of clips.entries()) {
            const len = (from: number) => this.tickAfter(base, from, seconds) - from;
            const next = clips[i + 1];
            if (next && next.start === c.stop) {
              const half = Math.round(len(c.stop) / 2);
              this.putFade(c.path, 'fade_out', next.uid, -half, half, shape, results);
              this.putFade(next.path, 'fade_in', c.uid, -half, half, shape, results);
            } else this.putFade(c.path, 'fade_out', undefined, -len(c.stop - 1) , 0, shape, results);
            if (!this.fadeRows(c.path).some((r) => r.type === 'fade_in')) this.putFade(c.path, 'fade_in', undefined, 0, len(c.start), shape, results);
          }
        }
        return null;
      }
      case 'change_fade_curvature': {
        const uids = Array.isArray(body['fades']) ? body['fades'].map(String) : [];
        if (!uids.length) throw new UAError('uasrv.missing_field', 'change_fade_curvature: fades', { cmd: 'post', path: `${ctx}/commands/change_fade_curvature` });
        const initial = Array.isArray(body['initial_curvature_values']) ? body['initial_curvature_values'].map(Number) : [];
        for (const pl of this.children(`${base}/playlists`)) {
          for (const c of clipsOf(pl)) {
            for (const r of this.fadeRows(c.path)) {
              const i = uids.indexOf(r.uid);
              if (i < 0) continue;
              const path = `${c.path}/fades/${r.uid}`;
              if (body['default'] === true) { this.setValue(path, 'fade_shape', 'log'); this.setValue(path, 'fade_curvature', 0); continue; }
              if (typeof body['fade_shape'] === 'string') this.setValue(path, 'fade_shape', body['fade_shape']);
              if (typeof body['fade_curvature'] === 'number') this.setValue(path, 'fade_curvature', Math.max(-1, Math.min(1, (initial[i] ?? 0) + body['fade_curvature'] - (initial[0] ?? 0))));
            }
          }
        }
        return null;
      }
      case 'nudge': {
        // LUNA refuses a nudge without settings (`uasrv.invalid_type`); the mock lets a bare
        // post through, as it did before it modelled the slip.
        if (body['nudge_settings'] === undefined) return null;
        const settings = JSON.parse(String(body['nudge_settings'])) as { mode?: string; samples?: number; operation?: string };
        const op = settings.operation ?? '';
        if (!op) throw new UAError('uasrv.invalid_type', 'nudge: nudge_settings.operation', { cmd: 'post', path: `${ctx}/commands/nudge` });
        if (!op.startsWith('content_') || settings.mode !== 'samples') return null; // the mock models the slip only
        const ns = ((settings.samples ?? 0) * 1e9) / 48000 * (op.startsWith('content_right') ? -1 : 1);
        const selStart = Number(this.value(ctx, 'selection_start'));
        const selStop = Number(this.value(ctx, 'selection_stop'));
        const tracks = (this.value(ctx, 'selection_tracks') as string[] | null) ?? [];
        for (const t of tracks) {
          const pl = String(this.value(`${base}/tracks/${t}`, 'playlist_uid'));
          for (const c of clipsOf(pl).filter((c) => c.start >= selStart && c.stop <= selStop)) {
            if (c.sourceStart + ns < 0) continue; // LUNA answers success and leaves it (fact 117)
            this.setValue(c.path, 'source_start', Math.round(c.sourceStart + ns));
            this.setValue(c.path, 'source_stop', Math.round(c.sourceStop + ns));
          }
        }
        return null;
      }
    }
    return null;
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
   * without a `rowid` get the next id free across the session's clips, as in LUNA. Ticks are table ticks.
   *
   * @example
   * engine.midiEdit(clipPath, 'added', [{ tick: 0, status: 0x90, data1: 60, data2: 100 }]);
   * engine.midiEdit(clipPath, 'deleted', [{ rowid: 1 }]);
   */
  midiEdit(clipPath: string, operation: 'added' | 'changed' | 'deleted', rows: MockMidiRow[]): void {
    const table = `${normalize(clipPath)}/midi/table`;
    if (!this.nodes.has(table)) this.addNode(table, { properties: { row_data: EMPTY_MIDI_TABLE() } });
    const stored = decodeMidiTable(this.value(table, 'row_data'));
    // LUNA keeps every clip's rows in one session table, so a new row id is unique across clips.
    const session = table.split('/').slice(0, 3).join('/');
    const used = [...this.nodes.keys()].filter((k) => k.startsWith(`${session}/`) && k.endsWith('/midi/table')).flatMap((k) => decodeMidiTable(this.value(k, 'row_data')).map((r) => r.rowid));
    let next = used.length ? Math.max(...used) + 1 : 1;
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

  /** @internal Every property of a node, copied (no port involved). */
  properties(nodePath: string): Record<string, unknown> {
    return Object.fromEntries(this.nodes.get(normalize(nodePath))?.properties ?? []);
  }

  children(nodePath: string): string[] {
    return [...(this.nodes.get(normalize(nodePath))?.children ?? [])];
  }

  /** Names of a node's properties. */
  propertyNames(nodePath: string): string[] {
    return [...(this.nodes.get(normalize(nodePath))?.properties.keys() ?? [])];
  }

  /** @internal Uploads between `begin` and `end` (fact 42). */
  readonly imports = new Map<string, { pkg: string; name: string; bytes: number; content: string }>();
  /** @internal Uploaded content (package and base64) to the source it was filed as, for fact 42's de-duplication. */
  readonly uploaded = new Map<string, string>();
  private readonly recommenders = new Map<string, (query: string) => { preset_name: string; preset_uuid: string; rrf_score: number }[]>();

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
        const body = (data ?? {}) as { name?: string; track_type?: string; stem_format?: string; preset_uid?: string; folder_mode?: string; folder_uid?: string };
        // `preset_uid` makes the preset's tracks; an instrument plugin's preset a stereo
        // instrument track with the plugin on it (fact 132).
        if (body.preset_uid !== undefined) return engine.newTrackFromPreset(uid, body.preset_uid, body.name, body.stem_format);
        // `track_type: "bus"` makes an aux bus, ordered after everything (fact 83).
        // `folder_uid` must name a folder (fact 136).
        if (body.folder_uid && !engine.isFolder(uid, body.folder_uid)) throw new UAError('device.database_error', 'new_track: folder_uid is not a folder', { cmd: 'post', path: `${base}/new_track` });
        if (body.track_type === 'bus') {
          const id = `bus${engine.children(`${base}/buses`).length + 1}`;
          engine.addBus(uid, id, { name: body.name ?? 'Bus', busType: 'aux', stemFormat: body.stem_format ?? 'stereo' });
          // A `folder_mode` other than none makes the bus a folder routed to the master (fact 136).
          if (body.folder_mode && body.folder_mode !== 'none') {
            engine.setValue(`${base}/buses/${id}`, 'folder_mode', body.folder_mode);
            engine.rerouteFolderSubtree(uid, [id]);
          }
          if (body.folder_uid) engine.moveToFolder(uid, [id], body.folder_uid);
          return { uid: id };
        }
        // One track answers `{ uid }`, several (`count`) an array of them (fact 135).
        const count = Math.max(1, Number((body as { count?: number }).count ?? 1));
        const made: { uid: string }[] = [];
        for (let i = 0; i < count; i++) {
          const id = `t${engine.children(`${base}/tracks`).length + 1}`;
          engine.addTrack(uid, id, { name: body.name ?? 'Untitled', trackType: body.track_type ?? 'audio', stemFormat: body.stem_format ?? 'mono' });
          made.push({ uid: id });
        }
        if (body.folder_uid) engine.moveToFolder(uid, made.map((m) => m.uid), body.folder_uid);
        return count === 1 ? made[0]! : made;
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
        engine.renumber(uid); // gapless again (fact 137)
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
        const body = (data ?? {}) as { playlist_uid?: string; track_uid?: string; name?: string; start?: number; stop?: number; source_uid?: string; source_start?: number; source_stop?: number; clip_type?: number; layer?: number; length_follows?: string; alg_type?: string; clip_uid?: string };
        const playlist = body.playlist_uid ?? (body.track_uid ? String(engine.value(`${base}/tracks/${body.track_uid}`, 'playlist_uid')) : undefined);
        if (!playlist) throw new UAError('uasrv.invalid_object', 'insert_clip: no playlist', { cmd: 'post', path: `${base}/insert_clip` });
        // Every clip type needs a source; a MIDI clip of its own comes from create_note (fact 112).
        if (!body.source_uid) throw new UAError('uasrv.invalid_property', 'insert_clip: source_uid is required', { cmd: 'post', path: `${base}/insert_clip` });
        const start = body.start ?? 0;
        const stop = body.stop ?? 0;
        // `clip_uid` copies a clip; the call's name and source offsets replace the copy's (fact 135).
        const copyPath = body.clip_uid ? engine.findClip(base, body.clip_uid) : undefined;
        if (body.clip_uid && !copyPath) throw new UAError('device.database_error', 'insert_clip: no clip to copy', { cmd: 'post', path: `${base}/insert_clip` });
        const copied: Record<string, unknown> = copyPath ? { ...engine.properties(copyPath) } : {};
        // Left out, the layer is one above the highest clip the new one overlaps (fact 135).
        let layer = body.layer;
        if (layer === undefined) {
          const clipsPath = `${base}/playlists/${playlist}/clips`;
          const overlapping = engine.children(clipsPath).map((c) => `${clipsPath}/${c}`).filter((c) => Number(engine.value(c, 'start')) < stop && Number(engine.value(c, 'stop')) > start);
          layer = overlapping.length ? Math.max(...overlapping.map((c) => Number(engine.value(c, 'layer') ?? 0))) + 1 : 0;
        }
        const clipType = copyPath ? Number(copied['clip_type'] ?? 0) : (body.clip_type ?? 0);
        const id = engine.nextClipId(base, playlist);
        engine.addNode(`${base}/playlists/${playlist}/clips/${id}`, {
          properties: {
            gain: 0, bypass: false, mute: false, ...copied,
            uid: id, name: body.name ?? (copyPath ? '' : 'Clip'), start, stop, layer,
            source_uid: copyPath ? copied['source_uid'] : body.source_uid, source_start: body.source_start ?? 0, source_stop: body.source_stop ?? 0, clip_type: clipType, midi_source_start: 0,
            ...(body.length_follows === 'ticks' || body.length_follows === 'time' ? { length_follows: body.length_follows } : {}),
            ...(body.alg_type !== undefined ? { alg_type: body.alg_type } : {}),
          },
        });
        // A MIDI clip carries its events in a table child (fact 39); a copy takes the original's.
        if (clipType === 2) {
          const rows = copyPath && engine.has(`${copyPath}/midi/table`) ? structuredClone(engine.value(`${copyPath}/midi/table`, 'row_data')) : EMPTY_MIDI_TABLE();
          engine.addNode(`${base}/playlists/${playlist}/clips/${id}/midi/table`, { properties: { row_data: rows } });
        }
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
          engine.addNode(`${base}/playlists/pl_${t}_${n}`, { properties: { uid: `pl_${t}_${n}`, name: `V${n}`, track_uid: t, version: n, stem_format: 'mono', frozen: false, enable_compiled_clips: false } });
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
            // Not active low, so 0 is IN (fact 29): a new plugin starts IN.
            engine.addControl(`${path}/controls/bypass`, 'parameter', { discrete: true, value: 0, real: false, str: 'in', automatable: true });
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
      /** One key signature per tick: setting one where a row already sits rewrites that row (fact 113). */
      set_key_signature: (data, engine) => {
        const body = (data ?? {}) as { tick?: number; sharps_and_flats?: number; is_minor?: boolean };
        if (typeof body.tick !== 'number' || typeof body.sharps_and_flats !== 'number' || typeof body.is_minor !== 'boolean') {
          throw new UAError('uasrv.invalid_property', 'set_key_signature: tick, sharps_and_flats and is_minor are required', { cmd: 'post', path: `${base}/set_key_signature` });
        }
        const existing = engine.children(`${base}/key_signatures`).find((row) => engine.value(`${base}/key_signatures/${row}`, 'tick') === body.tick);
        if (existing !== undefined) {
          engine.setValue(`${base}/key_signatures/${existing}`, 'sharps_and_flats', body.sharps_and_flats);
          engine.setValue(`${base}/key_signatures/${existing}`, 'is_minor', body.is_minor);
          return null;
        }
        const rowid = engine.nextRow();
        engine.addNode(`${base}/key_signatures/${rowid}`, { properties: { rowid, tick: body.tick, sharps_and_flats: body.sharps_and_flats, is_minor: body.is_minor } });
        return null;
      },
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
      move_clips: (data, engine) => engine.clipEdit(base, 'move_clips', data),
      get_clip_info: (data, engine) => {
        const uid = String((data as { clip_uid?: string } | null)?.clip_uid ?? '');
        if (!engine.findClip(base, uid)) throw new UAError('uasrv.invalid_object', 'get_clip_info: no such clip', { cmd: 'post', path: `${base}/get_clip_info` });
        const clipPath = engine.findClip(base, uid)!;
        const playlistUid = clipPath.split('/')[4] ?? '';
        return { sample_rate: 48000, compiled_clips: [], playlist_uid: playlistUid, track_uid: String(engine.value(`${base}/playlists/${playlistUid}`, 'track_uid') ?? '') };
      },
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
            if (typeof ctl !== 'string' || !ctl) continue;
            // As Edit_SetInsertsInOut: IN writes 1 when the control is active low, else 0 (fact 29).
            const on = body.value !== false;
            const raw = (engine.value(`${channel}/effects/${slot}`, 'bypass_control_active_low') === true) === on ? 1 : 0;
            const control = `${channel}/effects/${slot}/controls/${ctl}`;
            engine.setValue(control, 'value', raw);
            engine.setValue(control, 'normalized_value', raw);
            engine.setValue(control, 'real_value', raw === 1);
            engine.setValue(control, 'string_value', on ? 'in' : 'bypassed');
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
         * Writes notes onto a playlist, as deviced's `Edit_CreateNote` does (fact 111): ticks
         * are session ticks; each note goes into the clip under its note-on, else into one new
         * MIDI clip spanning the bars the notes cover. Then LUNA **selects** what it made,
         * which is where the caller reads the new row ids from (fact 74). No channel field:
         * every note is on channel 0.
         */
        create_note: (data, engine) => {
          const body = (data ?? {}) as { playlist_uid?: string; notes?: { note?: number; start?: number; stop?: number; velocity?: number; velocity_on?: number; velocity_off?: number }[]; note?: number; start?: number; stop?: number; velocity?: number };
          const playlist = body.playlist_uid;
          if (!playlist || !engine.has(`${base}/playlists/${playlist}`)) throw new UAError('uasrv.invalid_object', 'create_note: no such playlist', { cmd: 'post', path: `${base}/create_note` });
          type MockNewNote = { note?: number | undefined; start?: number | undefined; stop?: number | undefined; velocity?: number | undefined; velocity_on?: number | undefined; velocity_off?: number | undefined };
          const notes: MockNewNote[] = body.notes ?? (body.note !== undefined ? [{ note: body.note, start: body.start, stop: body.stop, velocity: body.velocity }] : []);
          if (!notes.length) return null;
          const clipsPath = `${base}/playlists/${playlist}/clips`;
          // The playlist's clips in time order, of any type, as deviced's clip compiler lists them.
          const clips = () =>
            engine
              .children(clipsPath)
              .map((uid) => ({ uid, start: Number(engine.value(`${clipsPath}/${uid}`, 'start') ?? 0), stop: Number(engine.value(`${clipsPath}/${uid}`, 'stop') ?? 0) }))
              .sort((a, b) => a.start - b.start);
          // GetFirstClipWithinRange: a point hits a clip it falls in; a range, one it overlaps.
          const firstClip = (from: number, to: number) => clips().find((c) => (from === to ? from >= c.start && from < c.stop : c.start < to && c.stop > from));
          const span = { start: Math.min(...notes.map((n) => n.start ?? 0)), stop: Math.max(...notes.map((n) => n.stop ?? 0)) };
          const onsets = { start: Math.min(...notes.map((n) => n.start ?? 0)), stop: Math.max(...notes.map((n) => n.start ?? 0)) };
          let clipUid = firstClip(onsets.start, onsets.stop)?.uid;
          if (!clipUid) {
            // CreateClipForRange without merging: whole bars, kept clear of the clips around it.
            let start = engine.barLines(base, span.start).floor;
            let stop = engine.barLines(base, span.stop).ceil;
            for (const c of clips()) {
              if (c.start < span.start && c.stop > start) start = Math.max(start, c.stop);
              if (c.start < stop && c.stop > span.stop) stop = Math.min(stop, c.start);
            }
            const trackUid = String(engine.value(`${base}/playlists/${playlist}`, 'track_uid') ?? '');
            const name = engine.value(`${base}/tracks/${trackUid}`, 'name');
            clipUid = engine.addMidiClipToPlaylist(base, playlist, { startTick: start, stopTick: stop, name: typeof name === 'string' ? name : 'MIDI', midiSourceStart: start });
          }
          // Table tick = session tick + midi_source_start - clip start (fact 41).
          const offsetOf = (uid: string): number => Number(engine.value(`${clipsPath}/${uid}`, 'midi_source_start') ?? 0) - Number(engine.value(`${clipsPath}/${uid}`, 'start') ?? 0);
          let offset = offsetOf(clipUid);
          const selected: number[][] = [];
          for (const n of notes) {
            const start = n.start ?? 0;
            const stop = n.stop ?? 0;
            // A note whose note-on falls in another clip goes there instead.
            const hit = firstClip(start, start);
            if (hit) {
              clipUid = hit.uid;
              offset = offsetOf(clipUid);
            }
            const clipPath = `${clipsPath}/${clipUid}`;
            const before = new Set(engine.midiRows(clipPath).map((r) => r.rowid));
            engine.midiEdit(clipPath, 'added', [
              { tick: start + offset, status: 0x90, data1: n.note ?? 60, data2: n.velocity_on ?? n.velocity ?? 100 },
              { tick: stop + offset, status: 0x80, data1: n.note ?? 60, data2: n.velocity_off ?? n.velocity ?? 100 },
            ]);
            const on = engine.midiRows(clipPath).find((r) => !before.has(r.rowid) && (r.status & 0xf0) === 0x90);
            if (on) selected.push([on.data1, start, stop, on.rowid]);
          }
          engine.setValue(`${base}/contexts/main`, 'focus', 'notes');
          engine.setValue(`${base}/contexts/main`, 'selection_playlists', [playlist]);
          engine.setValue(`${base}/contexts/main`, 'selection_start', span.start);
          engine.setValue(`${base}/contexts/main`, 'selection_stop', span.stop);
          // Selected notes carry the session ticks the caller sent (fact 74).
          engine.setValue(`${base}/contexts/main`, 'selection_notes', [{ playlist_uid: playlist, notes: selected }]);
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
        nudge: (data, engine) => engine.clipEdit(base, 'nudge', data),
        separate_clips: (data, engine) => engine.clipEdit(base, 'separate_clips', data),
        heal_separation: (data, engine) => engine.clipEdit(base, 'heal_separation', data),
        move_clips: (data, engine) => engine.clipEdit(base, 'move_clips', data),
        set_fade: (data, engine) => engine.clipEdit(base, 'set_fade', data),
        delete_fades: (data, engine) => engine.clipEdit(base, 'delete_fades', data),
        batch_fades: (data, engine) => engine.clipEdit(base, 'batch_fades', data),
        change_fade_curvature: (data, engine) => engine.clipEdit(base, 'change_fade_curvature', data),
        consolidate: () => null,
        mute_clips: () => null,
      },
    });
    this.addNode(`${base}/tempo_map/1`, { properties: { tick: 0, time: 0, tempo: 120 } });
    this.addNode(`${base}/time_signatures/1`, { properties: { tick: 0, bar: 1, partial: false, numerator: 4, denominator: 4 } });
    this.addNode(`${base}/key_signatures`);
    this.addNode(`${base}/markers`);
    this.addNode(`${base}/chords`);
    this.addNode(`${base}/storage`, { commands: storageCommands(`${base}/storage`) });
    this.addPackage(pkg, { name: options.name ?? uid, lastOpened: Date.now() });
    // Folder tracks (fact 136): a folder is an aux bus whose folder_mode is not none.
    const moveToFolderCommand: CommandHandler = (data, engine) => {
      const body = (data ?? {}) as { folder_uid?: string; before_uid?: string; after_uids?: string[] };
      const folder = body.folder_uid || null;
      const fail = (why: string) => new UAError('uasrv.invalid_value', `move_to_folder: ${why}`, { cmd: 'post', path: `${base}/tracks/move_to_folder` });
      if (!Array.isArray(body.after_uids)) throw new UAError('uasrv.invalid_property', 'move_to_folder: after_uids is required', { cmd: 'post', path: `${base}/tracks/move_to_folder` });
      if (folder && !engine.isFolder(uid, folder)) throw fail('folder_uid is not a folder');
      if (body.before_uid && !engine.channelIds(uid).includes(body.before_uid)) throw fail('no such before_uid');
      for (const id of body.after_uids) {
        if (!engine.has(`${base}/tracks/${id}`) && !engine.has(`${base}/buses/${id}`)) throw fail('no such track or bus');
        // A folder cannot go inside itself or anything inside it.
        for (let f: string | null = folder; f; f = engine.folderOf(uid, f)) if (f === id) throw fail('a folder cannot contain itself');
      }
      engine.moveToFolder(uid, body.after_uids, folder, body.before_uid || undefined);
      return null;
    };
    // Fact 137: change_order answers null whatever it did; an unknown uid changes nothing.
    const changeOrderCommand: CommandHandler = (data, engine) => {
      const body = (data ?? {}) as { before_uid?: string; after_uids?: unknown; reset?: boolean };
      if (body.reset) {
        const ids = engine.channelIds(uid);
        engine.renumber(uid, [...ids.filter((id) => engine.has(`${base}/tracks/${id}`)), ...ids.filter((id) => engine.has(`${base}/buses/${id}`))]);
        return null;
      }
      if (!Array.isArray(body.after_uids) || body.after_uids.some((id) => typeof id !== 'string' || !id)) throw new UAError('uasrv.invalid_property', 'change_order: after_uids is required', { cmd: 'post', path: `${base}/tracks/change_order` });
      const known = engine.channelIds(uid);
      const ids = body.after_uids as string[];
      if (ids.length && ids.every((id) => known.includes(id)) && (!body.before_uid || known.includes(body.before_uid))) engine.changeOrder(uid, ids, body.before_uid || null);
      return null;
    };
    this.addNode(`${base}/tracks`, { commands: { move_to_folder: moveToFolderCommand, change_order: changeOrderCommand } });
    this.addNode(`${base}/buses`, {
      commands: {
        move_to_folder: moveToFolderCommand,
        change_order: changeOrderCommand,
        set_folder_mode: (data, engine) => {
          const body = (data ?? {}) as { bus_uid?: string; folder_mode?: string };
          const bus = `${base}/buses/${body.bus_uid}`;
          if (!body.bus_uid || !engine.has(bus) || engine.value(bus, 'bus_type') !== 'aux') throw new UAError('uasrv.invalid_value', 'set_folder_mode: not an aux bus', { cmd: 'post', path: `${base}/buses/set_folder_mode` });
          if (!['none', 'summing', 'container'].includes(String(body.folder_mode))) throw new UAError('uasrv.invalid_value', 'set_folder_mode: bad folder_mode', { cmd: 'post', path: `${base}/buses/set_folder_mode` });
          engine.setFolderMode(uid, body.bus_uid, body.folder_mode as string);
          return null;
        },
      },
    });
    // LUNA gives every session four cue buses before anything else (fact 83).
    for (let i = 0; i < 4; i++) this.addBus(uid, `cue${i + 1}_${uid}`, { name: `CUE ${i + 1}`, busType: `cue_${i}`, stemFormat: 'stereo' });
    this.addBus(uid, `master_${uid}`, { name: 'Main Output', busType: 'master', stemFormat: 'stereo', color: 4294948970 });
    this.addNode(`/workspace/sessions/${pkg}/audio`);
    for (const name of options.tracks ?? []) this.addTrack(uid, name, { name });
    if (options.focused ?? true) this.setValue('/sessions', 'focused_session', uid);
  }

  /** Add a track with the standard control layout and one playlist. */
  /** @internal `new_track` with `preset_uid` (fact 132). */
  newTrackFromPreset(sessionUid: string, presetUid: string, name: string | undefined, stemFormat: string | undefined): { uid: string } | { uid: string }[] {
    const base = `/sessions/${sessionUid}`;
    const preset = this.findPreset(presetUid);
    if (!preset) throw new UAError('device.database_error', 'new_track: no such preset', { cmd: 'post', path: `${base}/new_track` });
    const presetName = String(this.value(preset.path, 'preset_name') ?? '');
    const made: string[] = [];
    const make = (trackName: string, trackType: string, format: string) => {
      const id = `t${this.children(`${base}/tracks`).length + 1}`;
      this.addTrack(sessionUid, id, { name: trackName, trackType, stemFormat: format });
      this.setValue(`${base}/tracks/${id}`, 'preset_uid', presetUid);
      this.setValue(`${base}/tracks/${id}`, 'preset_name', presetName);
      made.push(id);
      return `${base}/tracks/${id}`;
    };
    if (preset.kind === 'plugin') {
      const instrument = this.instrumentPluginIds().includes(preset.pluginId);
      const track = make(name ?? presetName, instrument ? 'instrument' : 'audio', instrument ? 'stereo' : (stemFormat ?? 'mono'));
      this.putPluginPreset(track, preset.pluginId, preset.path);
    } else {
      // One track takes the requested name; a multi-track preset's keep the names it saved.
      const saved = (this.value(preset.path, 'track_names') as string[] | null) ?? [];
      const trackType = String(this.value(preset.path, 'track_type') ?? 'audio');
      const names = saved.length > 1 ? saved : [name ?? presetName];
      for (const trackName of names) make(trackName, trackType, trackType === 'instrument' ? 'stereo' : 'mono');
    }
    return made.length === 1 ? { uid: made[0]! } : made.map((uid) => ({ uid }));
  }

  addTrack(sessionUid: string, id: string, options: { name?: string; trackType?: string; stemFormat?: string } = {}): void {
    const base = `/sessions/${sessionUid}`;
    const order = this.channelIds(sessionUid).length + 1; // appended to the one shared order (fact 137)
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
        preset_uid: null,
        preset_name: null,
      },
      options.stemFormat === 'stereo',
    );
    this.routeCues(sessionUid, `${base}/tracks/${id}`);
    this.addNode(`${base}/playlists/${playlist}`, { properties: { uid: playlist, name: 'V1', track_uid: id, version: 1, stem_format: options.stemFormat ?? 'mono', frozen: false, enable_compiled_clips: false } });
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
   * Add a MIDI device under LUNA's device (`/devices/<LUNA_DEVICE_UID>/midi`, fact 123). The
   * first call also adds LUNA's device, the `midi` folder, and the `All` and `None` entries
   * LUNA lists beside the real devices, each with an input port only. The device gets an input
   * and an output port unless `input` or `output` is false. Returns the device's uid.
   *
   * @example
   * engine.addMidiDevice('Volt 876');
   * engine.addMidiDevice('IAC Driver Bus 1', { uid: 'iac1' });
   */
  addMidiDevice(name: string, options: { uid?: string; deviceType?: string; input?: boolean; output?: boolean } = {}): string {
    const folder = `/devices/${LUNA_DEVICE_UID}/midi`;
    if (!this.has(folder)) {
      if (!this.has(`/devices/${LUNA_DEVICE_UID}`)) this.addNode(`/devices/${LUNA_DEVICE_UID}`, { properties: { name: 'LUNA', online: true } });
      this.addNode(folder, { properties: { type: 'folder' } });
      for (const [uid, pseudo] of [['midi_all', 'All'], ['midi_none', 'None']] as const) this.addMidiDeviceNode(`${folder}/${uid}`, pseudo, null, true, false);
    }
    const uid = options.uid ?? `midi_${this.children(folder).length + 1}`;
    this.addMidiDeviceNode(`${folder}/${uid}`, name, options.deviceType ?? 'normal', options.input ?? true, options.output ?? true);
    return uid;
  }

  /**
   * MIDI arriving from a device, as LUNA publishes it (fact 125): one batch on the device's
   * input port `midi_events`, and the same batch on `All`'s. Like LUNA, nothing is published
   * on a port no one subscribes to by its `midi_events` path, and a `get` reads no events.
   * `device` is a uid from {@link addMidiDevice} or a device name; each message is
   * `[status, data1, data2]`, stamped `timeMs` (default 0) apart by `stepMs` (default 1).
   * Returns how many ports published.
   *
   * @example
   * engine.addMidiDevice('Volt 876', { uid: 'volt' });
   * engine.receiveMidi('volt', [[0x90, 60, 100], [0x80, 60, 0]]);
   */
  receiveMidi(device: string, messages: ReadonlyArray<readonly [number, number, number]>, options: { timeMs?: number; stepMs?: number } = {}): number {
    const folder = `/devices/${LUNA_DEVICE_UID}/midi`;
    if (!this.has(folder)) throw new Error('MockEngine.receiveMidi: no MIDI devices; call addMidiDevice first');
    const uid = this.children(folder).find((d) => d === device || this.value(`${folder}/${d}`, 'name') === device);
    if (!uid || !this.has(`${folder}/${uid}/input_ports/0`)) throw new Error(`MockEngine.receiveMidi: no MIDI device ${device} with an input port`);
    const start = options.timeMs ?? 0;
    const step = options.stepMs ?? 1;
    const events = messages.map(([status, data1, data2], i) => [start + i * step, status, data1, data2]);
    const all = this.children(folder).find((d) => this.value(`${folder}/${d}`, 'name') === 'All');
    let published = 0;
    for (const id of all && all !== uid ? [uid, all] : [uid]) {
      const port = `${folder}/${id}/input_ports/0`;
      const path = `${port}/midi_events`;
      if (![...this.ports].some((p) => p.subscribesTo(path))) continue;
      const current = this.value(port, 'midi_events') as { seq: number; dropped: number };
      const seq = current.seq + 1;
      // The node keeps an empty batch (what a get reads); subscribers get the events.
      this.nodes.get(port)?.properties.set('midi_events', { seq, dropped: current.dropped, events: [] });
      this.push({ path: `${path}/value`, data: { seq, dropped: current.dropped, events } }, undefined);
      published++;
    }
    return published;
  }

  /** True when `uid` is a mock MIDI device's output port uid. */
  isMidiOutputPortUid(uid: string): boolean {
    const folder = `/devices/${LUNA_DEVICE_UID}/midi`;
    if (!this.has(folder)) return false;
    return this.children(folder).some((d) => this.has(`${folder}/${d}/output_ports/0`) && this.value(`${folder}/${d}/output_ports/0`, 'uid') === uid);
  }

  private addMidiDeviceNode(path: string, name: string, deviceType: string | null, input: boolean, output: boolean): void {
    const real = deviceType !== null;
    this.addNode(path, {
      properties: {
        type: 'midi-device',
        name,
        last_midi_note: [255, 255, 255],
        last_midi_control: [255, 255, 255],
        midi_device_type: deviceType,
        midi_device_mode: null,
        output_lateness: real ? 0 : null,
        midi_clock_generation_enabled: real ? false : null,
        midi_clock_generation_mode: real ? 'song1' : null,
        midi_clock_generation_offset_ms: real ? 0 : null,
      },
    });
    const id = path.slice(path.lastIndexOf('/') + 1);
    if (input) {
      this.addNode(`${path}/input_ports`, { properties: { type: 'folder' } });
      this.addNode(`${path}/input_ports/0`, { properties: { type: 'midi-input', uid: `${id}_in`, midi_events: { seq: 0, dropped: 0, events: [] } } });
    }
    if (output) {
      this.addNode(`${path}/output_ports`, { properties: { type: 'folder' } });
      this.addNode(`${path}/output_ports/0`, { properties: { type: 'midi-output', uid: `${id}_out` } });
    }
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
   * Add an empty MIDI clip to a track's current playlist, the way LUNA makes one for notes
   * drawn in place. `midiSourceStart` is the table tick at the clip's start (fact 41): 0 by
   * default. `insert_clip` cannot make one: it needs a source (fact 112). Returns the clip uid.
   *
   * @example
   * const clipUid = engine.addMidiClip('abc', 'Keys', { startTick: 0, stopTick: Luna.WHOLE_NOTE });
   */
  addMidiClip(sessionUid: string, trackUid: string, options: { startTick?: number; stopTick?: number; name?: string; midiSourceStart?: number } = {}): string {
    const base = `/sessions/${sessionUid}`;
    return this.addMidiClipToPlaylist(base, String(this.value(`${base}/tracks/${trackUid}`, 'playlist_uid')), options);
  }

  /** @internal */
  addMidiClipToPlaylist(sessionPath: string, playlistUid: string, options: { startTick?: number; stopTick?: number; name?: string; midiSourceStart?: number }): string {
    const clips = `${sessionPath}/playlists/${playlistUid}/clips`;
    let n = this.children(clips).length + 1;
    while (this.has(`${clips}/midi${n}`)) n++;
    const clipUid = `midi${n}`;
    const start = options.startTick ?? 0;
    const stop = options.stopTick ?? start + 96e9 * 4;
    this.addNode(`${clips}/${clipUid}`, {
      properties: { uid: clipUid, name: options.name ?? 'MIDI', start, stop, source_uid: '', source_start: start, source_stop: stop, clip_type: 2, gain: 0, bypass: false, render_source_uid: null, render_state: 'none', midi_source_start: options.midiSourceStart ?? 0, layer: 0, mute: false },
    });
    this.addNode(`${clips}/${clipUid}/midi/table`, { properties: { row_data: EMPTY_MIDI_TABLE() } });
    return clipUid;
  }

  /**
   * @internal The bar lines either side of `tick`: the one at or before it and the one at or
   * after it, from the time signature in effect (deviced's `GetBarRangeForNoteEvents`).
   */
  barLines(sessionPath: string, tick: number): { floor: number; ceil: number } {
    const beatTicks = 96_000_000_000;
    const sigs = this.children(`${sessionPath}/time_signatures`)
      .map((id) => this.nodes.get(`${sessionPath}/time_signatures/${id}`)!.properties)
      .map((p) => ({ tick: Number(p.get('tick') ?? 0), n: Number(p.get('numerator') ?? 4), d: Number(p.get('denominator') ?? 4) }))
      .sort((a, b) => a.tick - b.tick);
    const sig = sigs.filter((x) => x.tick <= tick).at(-1) ?? sigs[0] ?? { tick: 0, n: 4, d: 4 };
    const bar = ((beatTicks * 4) / sig.d) * sig.n;
    const floor = sig.tick + Math.floor((tick - sig.tick) / bar) * bar;
    return { floor, ceil: floor === tick ? tick : floor + bar };
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
    const order = this.channelIds(sessionUid).length + 1; // appended to the one shared order (fact 137)
    this.addChannel(
      `${base}/buses/${id}`,
      { uid: id, name: options.name ?? id, bus_type: busType, order, stem_format: options.stemFormat ?? 'stereo', color: options.color ?? 4282400832, folder_mode: 'none', folder_uid: null, automation_mode: 'read', frozen: false, enabled: true, comments: '' },
      stereo,
      !busType.startsWith('cue_'),
    );
    if (!busType.startsWith('cue_')) this.routeCues(sessionUid, `${base}/buses/${id}`);
  }

  /** @internal True when `id` is a bus of the session whose folder_mode is not none (fact 136). */
  isFolder(sessionUid: string, id: string): boolean {
    const mode = this.value(`/sessions/${sessionUid}/buses/${id}`, 'folder_mode');
    return typeof mode === 'string' && mode !== 'none';
  }

  /** @internal The folder a track or bus is in, or null at the session root. */
  folderOf(sessionUid: string, id: string): string | null {
    const base = `/sessions/${sessionUid}`;
    const path = this.has(`${base}/tracks/${id}`) ? `${base}/tracks/${id}` : `${base}/buses/${id}`;
    return (this.value(path, 'folder_uid') as string | null | undefined) ?? null;
  }

  /**
   * @internal Put tracks and buses in `folder` (null: the session root), as LUNA's
   * `move_to_folder` does (fact 136): set each one's `folder_uid` and reroute the main outputs
   * of it and everything inside it. The order is not modelled.
   */
  moveToFolder(sessionUid: string, ids: readonly string[], folder: string | null, before?: string): void {
    const base = `/sessions/${sessionUid}`;
    // Only the items with no moved folder above them change folder; the rest ride along inside
    // theirs (fact 136). Placed just after `before`, else first in the destination: just after
    // the folder, or at the very front for the root (fact 137).
    const topLevel = ids.filter((id) => {
      for (let f = this.folderOf(sessionUid, id); f; f = this.folderOf(sessionUid, f)) if (ids.includes(f)) return false;
      return true;
    });
    const moved = this.withSubtrees(sessionUid, topLevel);
    for (const id of topLevel) {
      const path = this.has(`${base}/tracks/${id}`) ? `${base}/tracks/${id}` : `${base}/buses/${id}`;
      this.setValue(path, 'folder_uid', folder);
    }
    this.renumber(sessionUid, this.spliceAfter(sessionUid, moved, before ?? folder));
    this.rerouteFolderSubtree(sessionUid, topLevel);
  }

  /** @internal Every track and bus of the session, sorted by `order` (fact 137). */
  channelIds(sessionUid: string): string[] {
    const base = `/sessions/${sessionUid}`;
    const rows = [...this.children(`${base}/tracks`).map((id) => [id, `${base}/tracks/${id}`]), ...this.children(`${base}/buses`).map((id) => [id, `${base}/buses/${id}`])] as [string, string][];
    return rows.map(([id, path]) => [id, Number(this.value(path, 'order') ?? 0)] as const).sort((a, b) => a[1] - b[1]).map(([id]) => id);
  }

  /** `ids` in the order given, each folder followed by everything inside it in current order. */
  private withSubtrees(sessionUid: string, ids: readonly string[]): string[] {
    const flat = this.channelIds(sessionUid);
    const out: string[] = [];
    const add = (id: string): void => {
      if (out.includes(id)) return;
      out.push(id);
      if (this.isFolder(sessionUid, id)) for (const child of flat) if (this.folderOf(sessionUid, child) === id) add(child);
    };
    for (const id of ids) add(id);
    return out;
  }

  /** The current order without `moved`, with `moved` put back after `anchor` (null: the front). */
  private spliceAfter(sessionUid: string, moved: readonly string[], anchor: string | null): string[] {
    const rest = this.channelIds(sessionUid).filter((id) => !moved.includes(id));
    const at = anchor === null ? 0 : rest.indexOf(anchor) + 1;
    // An anchor that moved, or is gone, appends (as LUNA's change_order does).
    if (anchor !== null && at === 0) return [...rest, ...moved];
    return [...rest.slice(0, at), ...moved, ...rest.slice(at)];
  }

  /**
   * @internal Write `order` as 1..N from `flat`, re-serialized depth-first so each folder is
   * followed at once by everything inside it, siblings keeping their order in `flat` (fact 137).
   */
  renumber(sessionUid: string, flat: readonly string[] = this.channelIds(sessionUid)): void {
    const base = `/sessions/${sessionUid}`;
    const byParent = new Map<string | null, string[]>();
    for (const id of flat) {
      const parent = this.folderOf(sessionUid, id);
      byParent.set(parent, [...(byParent.get(parent) ?? []), id]);
    }
    const out: string[] = [];
    const walk = (parent: string | null): void => {
      for (const id of byParent.get(parent) ?? []) {
        if (out.includes(id)) continue;
        out.push(id);
        walk(id);
      }
    };
    walk(null);
    for (const id of flat) if (!out.includes(id)) out.push(id); // a parent that is gone
    out.forEach((id, i) => {
      const path = this.has(`${base}/tracks/${id}`) ? `${base}/tracks/${id}` : `${base}/buses/${id}`;
      if (this.value(path, 'order') !== i + 1) this.setValue(path, 'order', i + 1);
    });
  }

  /**
   * @internal LUNA's `change_order` (fact 137): move `ids` (folders with everything inside
   * them) to just after `anchor`, or the front for null, then renumber. Which folder each one
   * is in never changes, so the anchor only picks a place among its siblings.
   */
  changeOrder(sessionUid: string, ids: readonly string[], anchor: string | null): void {
    this.renumber(sessionUid, this.spliceAfter(sessionUid, this.withSubtrees(sessionUid, ids), anchor));
  }

  /**
   * @internal `set_folder_mode` (fact 136): `none` moves the bus's direct children to the
   * session root; any change reroutes everything inside it.
   */
  setFolderMode(sessionUid: string, busUid: string, mode: string): void {
    const base = `/sessions/${sessionUid}`;
    const children = this.folderChildren(sessionUid, busUid);
    this.setValue(`${base}/buses/${busUid}`, 'folder_mode', mode);
    // Released children keep their place in the order, now at the root.
    if (mode === 'none') {
      for (const id of children) this.setValue(this.has(`${base}/tracks/${id}`) ? `${base}/tracks/${id}` : `${base}/buses/${id}`, 'folder_uid', null);
      this.renumber(sessionUid);
    }
    this.rerouteFolderSubtree(sessionUid, children);
  }

  private folderChildren(sessionUid: string, folder: string): string[] {
    const base = `/sessions/${sessionUid}`;
    return [...this.children(`${base}/tracks`), ...this.children(`${base}/buses`)].filter((id) => this.folderOf(sessionUid, id) === folder);
  }

  /**
   * Route the main output of each of `ids`, and of everything inside them, to the nearest
   * summing folder it is in (a container folder passes through), else the master (fact 136).
   */
  /** @internal */
  rerouteFolderSubtree(sessionUid: string, ids: readonly string[]): void {
    const base = `/sessions/${sessionUid}`;
    const master = this.children(`${base}/buses`).find((b) => this.value(`${base}/buses/${b}`, 'bus_type') === 'master');
    for (const id of ids) {
      let target: string | null | undefined = this.folderOf(sessionUid, id);
      while (target && this.value(`${base}/buses/${target}`, 'folder_mode') !== 'summing') target = this.folderOf(sessionUid, target);
      target ??= master;
      const main = `${this.has(`${base}/tracks/${id}`) ? `${base}/tracks/${id}` : `${base}/buses/${id}`}/outputs/main`;
      if (target && this.has(main)) {
        for (const object of this.children(`${main}/assignment_objects`)) this.removeNode(`${main}/assignment_objects/${object}`);
        this.setValue(main, 'assignments', []);
        this.addAssignment(main, target, `${base}/buses/${target}`);
      }
      this.rerouteFolderSubtree(sessionUid, this.folderChildren(sessionUid, id));
    }
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
        this.addControl(`${path}/outputs/${out}/controls/${name}`, name, isSwitch ? { discrete: true, value: 0, real: false, str: 'false', automatable: true } : { discrete: false, value: 0, real: 0, str: isPan ? 'C' : '0.0', automatable: true, normalized: isPan ? 0.5 : FADER_ZERO });
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
        taper: null,
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
    this.clipChanged(nodePath);
    if (name === 'enable_compiled_clips' && /^\/sessions\/[^/]+\/playlists\/[^/]+$/.test(nodePath)) this.compilePlaylist(nodePath);
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
   * fader taper (see {@link faderTaper}); a plugin `parameter`'s `value` tracks its
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
                : faderTaper(p).toDb(Number(data))
              : Number(data);
      const normalized =
        written === 'normalized_value' || (parameter && written === 'value')
          ? Number(data)
          : pan
            ? Math.min(1, Math.max(0, (real + 100) / 200))
            : faderTaper(p).toNormalized(real);
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

  /** @internal True when this port subscribed to exactly `path`. */
  subscribesTo(path: string): boolean {
    return this.status === 'connected' && this.subscriptions.has(path);
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

/**
 * The host of an Add On's `ua-content://` URL, as LUNA builds it (fact 114): the lowercase
 * id with `_` doubled and any other byte a host cannot carry written `_` plus two hex digits.
 */
/**
 * The repo a pasted URL names, as LUNA's `Rack_AddOnMarketplace::RepoURLFromString()` reads
 * it: `https://github.com/<owner>/<repo>`, or `undefined` when it is not a GitHub repo.
 */
function githubRepoUrl(input: string): string | undefined {
  const url = input.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  if (!/^github\.com\//i.test(url)) return undefined;
  const [owner = '', rawName = ''] = (url.slice(11).split(/[?#]/)[0] ?? '').split('/');
  const name = rawName.replace(/\.git$/i, '');
  const ok = (part: string) => /^[A-Za-z0-9._-]+$/.test(part) && !/^\.+$/.test(part);
  return ok(owner) && ok(name) ? `https://github.com/${owner}/${name}` : undefined;
}

/**
 * The direct download of the Google Drive file a share link names, as LUNA's
 * `Rack_AddOnMarketplace::DriveDownloadURLFromString()` builds it, or `undefined`.
 */
function driveDownloadUrl(input: string): string | undefined {
  const url = input.trim().replace(/^https?:\/\//i, '');
  const slash = url.indexOf('/');
  if (slash < 0) return undefined;
  const host = url.slice(0, slash).toLowerCase();
  if (!['drive.google.com', 'docs.google.com', 'drive.usercontent.google.com'].includes(host)) return undefined;
  const rest = url.slice(slash + 1).split('#')[0] ?? '';
  const [path = '', query = ''] = rest.split('?');
  const param = (name: string) => {
    const hit = query.split('&').find((p) => p.split('=')[0] === name);
    return hit === undefined ? '' : decodeURIComponent(hit.slice(name.length + 1));
  };
  const file = /^(?:u\/[^/]+\/)?file\/d\/([^/]*)/.exec(path);
  const id = file ? (file[1] ?? '') : ['open', 'uc', 'download'].includes(path) ? param('id') : '';
  const key = param('resourcekey');
  const ok = (part: string) => /^[A-Za-z0-9_-]*$/.test(part);
  if (!id || !ok(id) || !ok(key)) return undefined;
  return `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t${key ? `&resourcekey=${key}` : ''}`;
}

/**
 * An iCloud Drive share link as `https://www.icloud.com/iclouddrive/<id>`, its short GUID
 * read as LUNA's `Rack_AddOnMarketplace::ICloudShortGUIDFromString()` reads it, or `undefined`.
 */
function iCloudShareUrl(input: string): string | undefined {
  const url = input.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  if (!/^icloud\.com\/iclouddrive\//i.test(url)) return undefined;
  const guid = url.slice(23).split(/[#?/]/)[0] ?? '';
  return /^[A-Za-z0-9_-]+$/.test(guid) ? `https://www.icloud.com/iclouddrive/${guid}` : undefined;
}

/**
 * The `dl=1` download of the Dropbox file a share link names, as LUNA's
 * `Rack_AddOnMarketplace::DropboxDownloadURLFromString()` builds it, or `undefined`.
 */
function dropboxDownloadUrl(input: string): string | undefined {
  const url = input.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  if (!/^dropbox\.com\//i.test(url)) return undefined;
  const rest = url.slice(12).split('#')[0] ?? '';
  const [path = '', query = ''] = rest.split('?');
  const parts = path.split('/').filter(Boolean);
  const current = parts.length === 4 && parts[0] === 'scl' && parts[1] === 'fi';
  const older = parts.length === 3 && parts[0] === 's';
  if (!current && !older) return undefined;
  const id = parts[parts.length - 2] ?? '';
  const name = parts[parts.length - 1] ?? '';
  const hit = query.split('&').find((p) => p.split('=')[0] === 'rlkey');
  const key = hit === undefined ? '' : decodeURIComponent(hit.slice(6));
  const idOk = (part: string) => /^[A-Za-z0-9_-]*$/.test(part);
  let decoded: string;
  try {
    decoded = decodeURIComponent(name);
  } catch {
    return undefined;
  }
  if (!id || !idOk(id) || !/^[A-Za-z0-9._%~+()!-]+$/.test(name) || /[/\\]/.test(decoded) || !idOk(key) || (current && !key)) return undefined;
  return `https://www.dropbox.com/${parts.join('/')}?${key ? `rlkey=${key}&` : ''}dl=1`;
}

function localContentHost(id: string): string {
  let host = '';
  for (const byte of new TextEncoder().encode(id)) {
    const c = String.fromCharCode(byte);
    if (/[a-z0-9.-]/.test(c)) host += c;
    else if (c === '_') host += '__';
    else host += `_${byte.toString(16).padStart(2, '0')}`;
  }
  return host || '_';
}

/** An absolute path percent-encoded as LUNA puts it in a URL: unreserved bytes and `/` kept. */
function encodeMediaPath(path: string): string {
  let out = '';
  for (const byte of new TextEncoder().encode(path.replaceAll('\\', '/'))) {
    const c = String.fromCharCode(byte);
    out += /[A-Za-z0-9\-._~/]/.test(c) ? c : `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
  }
  return out.startsWith('/') ? out : `/${out}`;
}

/** `path` with `.` and `..` resolved and no trailing separator, as LUNA judges a list_files path. */
function normalizeFolder(path: string): string {
  const drive = /^[A-Za-z]:/.exec(path)?.[0] ?? '';
  const parts: string[] = [];
  for (const part of path.slice(drive.length).split(/[\\/]+/).slice(1)) {
    if (part === '' || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return `${drive}/${parts.join('/')}`;
}

/**
 * LUNA's `list_files` order (fact 106): JUCE's `String::compareNatural`, case-insensitive.
 * Whitespace runs count as one, digit runs compare by value (a run with a leading zero
 * digit by digit), A-Z fold case, and a character that is not an ASCII letter or digit
 * sorts before one that is. JUCE classifies through the C library, which in LUNA on macOS
 * knows ASCII only, so `Ü` sorts with the punctuation and folds no case.
 */
function naturalCompare(a: string, b: string): number {
  const s1 = [...a].map((c) => c.codePointAt(0)!).concat(0);
  const s2 = [...b].map((c) => c.codePointAt(0)!).concat(0);
  const isSpace = (c: number) => c === 32 || (c >= 9 && c <= 13);
  const isDigit = (c: number) => c >= 48 && c <= 57;
  const isAlnum = (c: number) => isDigit(c) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
  const upper = (c: number) => (c >= 97 && c <= 122 ? c - 32 : c);
  let i = 0;
  let j = 0;
  for (let first = true; ; first = false) {
    const space1 = isSpace(s1[i]!);
    const space2 = isSpace(s2[j]!);
    if (!first && space1 !== space2) {
      if (s1[i] === 0) return -1;
      if (s2[j] === 0) return 1;
      return space2 ? 1 : -1;
    }
    while (isSpace(s1[i]!)) i++;
    while (isSpace(s2[j]!)) j++;
    if (isDigit(s1[i]!) && isDigit(s2[j]!)) {
      const result = s1[i] === 48 || s2[j] === 48 ? digitsLeft(s1, i, s2, j) : digitsRight(s1, i, s2, j);
      if (result !== 0) return result;
    }
    let c1 = s1[i++]!;
    let c2 = s2[j++]!;
    if (c1 !== c2) {
      c1 = upper(c1);
      c2 = upper(c2);
    }
    if (c1 === c2) {
      if (c1 === 0) return 0;
      continue;
    }
    const alnum1 = isAlnum(c1);
    const alnum2 = isAlnum(c2);
    if (alnum2 && !alnum1) return -1;
    if (alnum1 && !alnum2) return 1;
    return c1 < c2 ? -1 : 1;
  }

  /** Digit runs by value: the longer run is larger; equal lengths go by the first difference. */
  function digitsRight(x: number[], xi: number, y: number[], yi: number): number {
    for (let bias = 0; ; xi++, yi++) {
      const d1 = isDigit(x[xi]!);
      const d2 = isDigit(y[yi]!);
      if (!d1 && !d2) return bias;
      if (!d1) return -1;
      if (!d2) return 1;
      if (x[xi] !== y[yi] && bias === 0) bias = x[xi]! < y[yi]! ? -1 : 1;
    }
  }

  /** Digit runs with a leading zero: digit by digit, like a fraction. */
  function digitsLeft(x: number[], xi: number, y: number[], yi: number): number {
    for (; ; xi++, yi++) {
      const d1 = isDigit(x[xi]!);
      const d2 = isDigit(y[yi]!);
      if (!d1 && !d2) return 0;
      if (!d1) return -1;
      if (!d2) return 1;
      if (x[xi]! < y[yi]!) return -1;
      if (x[xi]! > y[yi]!) return 1;
    }
  }
}

/**
 * `/sessions/<uid>/storage` commands (fact 129). Names must be non-empty and free of `/`; a
 * record with no fields left, and a context with no records left, go away. Values are kept as
 * LUNA keeps them, as JSON, so a key whose value is `undefined` is gone. `undoable` is
 * accepted and ignored: the mock keeps no undo history.
 */
function storageCommands(root: string): Record<string, CommandHandler> {
  const validName = (v: unknown): v is string => typeof v === 'string' && v !== '' && !v.includes('/');
  const asJson = (v: unknown): unknown => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
  type Body = { context?: unknown; record?: unknown; field?: unknown; value?: unknown };
  const target = (body: Body, verb: string) => {
    if (body.context === undefined || body.record === undefined || body.field === undefined) {
      throw new UAError('uasrv.missing_field', `${verb}: uasrv.missing_field`, { cmd: 'post', path: `${root}/${verb}` });
    }
    if (!validName(body.context) || !validName(body.record) || !validName(body.field)) {
      throw new UAError('uasrv.invalid_value', `${verb}: uasrv.invalid_value`, { cmd: 'post', path: `${root}/${verb}` });
    }
    return { node: `${root}/${body.context}/${body.record}`, field: body.field };
  };
  const prune = (engine: MockEngine, context: string) => {
    for (const record of engine.children(`${root}/${context}`)) {
      const path = `${root}/${context}/${record}`;
      if (engine.propertyNames(path).length === 0) engine.removeNode(path);
    }
    if (engine.children(`${root}/${context}`).length === 0) engine.removeNode(`${root}/${context}`);
  };
  return {
    add_field: (data, engine) => {
      const body = (data ?? {}) as Body;
      const { node, field } = target(body, 'add_field');
      if (engine.has(node) && engine.propertyNames(node).includes(field)) return null;
      if (!engine.has(node)) engine.addNode(node, { properties: { [field]: asJson(body.value) } });
      else engine.setValue(node, field, asJson(body.value));
      return null;
    },
    set_field: (data, engine) => {
      const body = (data ?? {}) as Body;
      if (body.value === undefined) throw new UAError('uasrv.missing_field', 'set_field: uasrv.missing_field', { cmd: 'post', path: `${root}/set_field` });
      const { node, field } = target(body, 'set_field');
      if (!engine.has(node) || !engine.propertyNames(node).includes(field)) {
        throw new UAError('uasrv.invalid_property', 'set_field: uasrv.invalid_property', { cmd: 'post', path: `${root}/set_field` });
      }
      engine.setValue(node, field, asJson(body.value));
      return null;
    },
    remove_field: (data, engine) => {
      const body = (data ?? {}) as Body;
      const path = `${root}/remove_field`;
      if (body.context === undefined) throw new UAError('uasrv.missing_field', 'remove_field: uasrv.missing_field', { cmd: 'post', path });
      const record = body.record ?? '';
      const field = body.field ?? '';
      if (!validName(body.context) || (record === '' && field !== '')) throw new UAError('uasrv.invalid_value', 'remove_field: uasrv.invalid_value', { cmd: 'post', path });
      const contextPath = `${root}/${body.context}`;
      if (!engine.has(contextPath)) return null;
      if (record === '') engine.removeNode(contextPath);
      else if (field === '') engine.removeNode(`${contextPath}/${String(record)}`);
      else engine.deleteValue(`${contextPath}/${String(record)}`, String(field));
      prune(engine, body.context);
      return null;
    },
  };
}

interface PluginWindowKey {
  session_uid: string;
  channel_uid: string;
  insert_type: string;
}

function sameWindow(a: PluginWindowKey, b: PluginWindowKey): boolean {
  return a.session_uid === b.session_uid && a.channel_uid === b.channel_uid && a.insert_type === b.insert_type;
}
