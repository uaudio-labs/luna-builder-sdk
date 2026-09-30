/**
 * What {@link connect} returns: one engine connection with its Store and (from Phase 2) the
 * domain objects. `raw` is the only escape hatch to paths; prefer a typed member when one exists.
 */
import type { Port, PortStatus, Unsubscribe } from '../wire/port';
import { NoSessionOpen } from '../wire/errors';
import { Cell, type Prop } from '../store/prop';
import { Store } from '../store/store';
import type { Session } from '../model/session';
import { Sessions } from '../model/sessions';
import { Plugins } from '../model/plugins';
import { Presets } from '../model/presets';
import { Workspace } from '../model/workspace';
import { Devices, Drivers, Jobs, Preferences, Renders, type AudioInput } from '../model/system';
import { Gui } from '../model/gui';
import type { WasmEngine } from '../engine/loader';
import { WasmPort } from '../wire/wasm-port';
import { MockPort, type MockEngine } from '../wire/mock-port';

export type Engine = 'luna' | 'wasm' | 'mock';

export class Client {
  /** The transport. Escape hatch: `luna.raw.get('/sessions')`. */
  readonly raw: Port;
  /** The path-keyed mirror the domain objects read from. */
  readonly store: Store;
  /** Which engine this client is talking to. */
  readonly engine: Engine;
  /** Connection status as a {@link Prop}. */
  readonly status: Prop<PortStatus>;
  /** Open sessions and the commands that create or open them. */
  readonly sessions: Sessions;
  /** The plugin catalog (`/plugins`). Call `load()` once before reading. */
  readonly plugins: Plugins;
  /** The preset library query (`/presets`). */
  readonly presets: Presets;
  /** Session packages on disk and the workspace query. */
  readonly workspace: Workspace;
  readonly drivers: Drivers;
  readonly devices: Devices;
  readonly preferences: Preferences;
  readonly renders: Renders;
  readonly jobs: Jobs;
  /** LUNA's host surface (dialogs, pages, Add Ons). Only present inside LUNA. */
  readonly gui: Gui;

  private readonly statusCell: Cell<PortStatus>;
  private readonly statusUnsub: Unsubscribe;

  /** @internal Use {@link connect}. */
  constructor(port: Port, engine: Engine, store = new Store(port)) {
    registry.push(this);
    this.raw = port;
    this.store = store;
    this.engine = engine;
    this.statusCell = new Cell<PortStatus>(store.scheduler, port.connected ? 'connected' : 'disconnected');
    this.status = this.statusCell;
    this.statusUnsub = port.onStatus((s) => this.statusCell.update(s));
    this.sessions = new Sessions(this);
    this.plugins = new Plugins(this);
    this.presets = new Presets(this);
    this.workspace = new Workspace(this);
    this.drivers = new Drivers(this);
    this.devices = new Devices(this);
    this.preferences = new Preferences(this);
    this.renders = new Renders(this);
    this.jobs = new Jobs(this);
    this.gui = new Gui(this);
  }

  /**
   * The focused session (or the first open one), subscribed and loaded.
   *
   * @example
   * const session = await luna.session();
   * console.log(session.name.value, session.tracks.items.length);
   */
  async session(): Promise<Session> {
    await this.sessions.ready();
    const current = this.sessions.current();
    if (!current) throw new NoSessionOpen();
    await current.ready();
    return current;
  }

  /**
   * The device inputs a track can record from (`/devices/<device>/inputs`, fact 76). Assign
   * one with `track.inputNodeUid.set(input.uid)`, or pass it to `session.record()`.
   *
   * Read on each call and not cached: devices come and go, and `inUse` changes as tracks are
   * armed.
   *
   * @example
   * const inputs = await luna.audioInputs();
   * for (const i of inputs) console.log(i.name, i.stemFormat, i.inUse ? '(in use)' : '');
   * await track.inputNodeUid.set(inputs[0]!.uid);
   */
  async audioInputs(): Promise<AudioInput[]> {
    const devices = (await this.raw.get('/devices', { children: true, properties: false, commands: false })) as unknown;
    const out: AudioInput[] = [];
    for (const device of childNames(devices)) {
      const inputs = (await this.raw
        .get(`/devices/${device}/inputs`, { children: true, levels: 2, commands: false, propfilter: ['name', 'stem_format', 'device_id', 'in_use'] })
        .catch(() => undefined)) as unknown;
      for (const child of childEntries(inputs)) {
        out.push(
          Object.freeze({
            uid: child.name,
            name: typeof child.properties['name'] === 'string' ? (child.properties['name'] as string) : child.name,
            stemFormat: typeof child.properties['stem_format'] === 'string' ? (child.properties['stem_format'] as string) : 'mono',
            deviceId: typeof child.properties['device_id'] === 'string' ? (child.properties['device_id'] as string) : device,
            inUse: child.properties['in_use'] === true,
          }),
        );
      }
    }
    return out;
  }

  get connected(): boolean {
    return this.raw.connected;
  }

  /**
   * The in-memory engine when `engine === 'mock'`, for driving the page as a second client
   * would: `luna.mock.setValue(path, 'name', 'Lead')`.
   */
  get mock(): MockEngine | undefined {
    return this.raw instanceof MockPort ? this.raw.engine : undefined;
  }

  /** The in-page wasm engine (audio, persistence, health) when `engine === 'wasm'`. */
  get wasm(): WasmEngine | undefined {
    return this.raw instanceof WasmPort ? this.raw.engine : undefined;
  }

  /**
   * Deliver every pending change notification now, and resolve once they have run. Handy in
   * tests: after `await engine.settled()` the prop *values* are already current, but
   * `onChange` listeners are coalesced to the next frame — this flushes them immediately, so
   * `await engine.settled(); await luna.settled();` is deterministic without waiting for a
   * requestAnimationFrame or timer.
   *
   * It also waits for reads in flight, such as the properties of a member the engine just
   * added (the collection holds that member's `onChange` until they land), so a new clip or
   * track has its values when this resolves.
   */
  async settled(): Promise<void> {
    // A flush can start a read (a collection fetching a member it just learned of), and a read
    // that lands queues more notifications, so alternate until both are quiet.
    for (let round = 0; round < 8; round++) {
      this.store.scheduler.flush();
      await this.store.scheduler.settled();
      if (!this.store.pendingReads) return;
      await this.store.readsSettled();
    }
  }

  /** Disconnect and release everything. */
  async close(): Promise<void> {
    const at = registry.indexOf(this);
    if (at >= 0) registry.splice(at, 1);
    this.statusUnsub();
    await this.store.close();
    await this.raw.close();
    this.statusCell.update('closed');
  }
}

const registry: Client[] = [];

/**
 * Every {@link Client} this page has made and not closed, in creation order. A tooling hook:
 * `ua-builder probe` waits on `Luna.clients().some((c) => c.connected)` to know an Add On's
 * page has finished connecting before it reads the DOM.
 *
 * @example
 * Luna.clients().some((c) => c.connected); // is anything on this page live?
 */
export function clients(): readonly Client[] {
  return [...registry];
}

/** Child names of a `get` reply, whatever shape the engine used for them. */
function childNames(reply: unknown): string[] {
  return childEntries(reply).map((c) => c.name);
}

interface ChildEntry {
  name: string;
  properties: Record<string, unknown>;
}

/**
 * Children of a `get` reply. The engine answers either `{ children: [{ path/name, ... }] }`
 * or a flat value map; both are normalised to a name plus whatever properties came with it.
 */
function childEntries(reply: unknown): ChildEntry[] {
  if (typeof reply !== 'object' || reply === null) return [];
  const children = (reply as { children?: unknown }).children;
  if (!Array.isArray(children)) return [];
  const out: ChildEntry[] = [];
  for (const child of children) {
    if (typeof child === 'string') {
      out.push({ name: child, properties: {} });
      continue;
    }
    if (typeof child !== 'object' || child === null) continue;
    const record = child as Record<string, unknown>;
    const raw = record['path'] ?? record['name'] ?? record['id'];
    if (typeof raw !== 'string') continue;
    const name = raw.slice(raw.lastIndexOf('/') + 1);
    const properties: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (key !== 'children' && key !== 'commands' && key !== 'path' && key !== 'properties') properties[key] = unwrapValue(value);
    }
    const nested = record['properties'];
    if (Array.isArray(nested)) {
      for (const entry of nested) {
        if (typeof entry === 'object' && entry !== null && typeof (entry as { name?: unknown }).name === 'string') {
          properties[(entry as { name: string }).name] = unwrapValue((entry as { value?: unknown }).value);
        }
      }
    } else if (typeof nested === 'object' && nested !== null) {
      for (const [key, value] of Object.entries(nested as Record<string, unknown>)) properties[key] = unwrapValue(value);
    }
    out.push({ name, properties });
  }
  return out;
}

/** Without `flatvalue` a property arrives as `{ value: X }`. */
function unwrapValue(value: unknown): unknown {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'value' in (value as object) ? (value as { value: unknown }).value : value;
}
