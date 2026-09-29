/**
 * An output of a track or bus: `main`, `cue_N` or `send_N`. Gain, pan and mute live here
 * (`.../outputs/<id>/controls/{gain,pan|pan_left+pan_right,mute}`), as does the level meter.
 *
 * Routing (facts 43, 83): each destination is one row of the output's `assignments`, whose
 * `value` is the **bus uid**, and one `assignment_objects/<uid>` node in the same order,
 * whose uid is the handle `delete_output_assignment` takes. The output's own `bus_uid` is
 * always null on LUNA, so {@link Output.busUid} is derived from the first destination.
 */
import type { Client } from '../client/client';
import { derived, type Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import type { Control } from './control';
import { Controls } from './controls';
import { Meter } from './meter';
import { Node } from './node';
import { settle } from './settle';

/** One row of an output's `assignments` property, as LUNA publishes it. */
export interface OutputAssignment {
  /** The destination bus uid (or hardware output id); `null` once that bus was deleted. */
  value: string | null;
  name: string;
  stem_format: string;
  /** The destination's `bus_type` (`aux`, `master`, `cue_0`, ...). */
  type?: string | null;
  /** `device.missing_bus` once the destination bus was deleted. */
  connection_error?: string | null;
  sidechain_in_use?: string;
}

/** Where an output goes. `uid` is the assignment's, the handle {@link Output.unassign} takes. */
export interface Destination {
  readonly uid: string;
  /** The destination bus, or `undefined` once that bus has been deleted (`error` is then set). */
  readonly busUid: string | undefined;
  readonly name: string;
  /** The bus's `bus_type` (`aux`, `master`, `cue_0`...), when LUNA reports it. */
  readonly busType: string | undefined;
  readonly stereo: boolean;
  /** `device.missing_bus` when the bus is gone; `undefined` while connected. */
  readonly error: string | undefined;
}

/** Eight sends per channel, `send_0`..`send_7`. */
export const SEND_COUNT = 8;
/** Four cue outputs per channel, `cue_0`..`cue_3`. */
export const CUE_COUNT = 4;

/** The session-level operations an output needs from its owner. */
interface Owner {
  sessionUid: string;
  channelUid: string;
  channelPath: string;
  isTrack: boolean;
  sessionPath: string;
}

export class Output extends Node {
  readonly uid: Prop<string>;
  readonly outputType: Prop<string>;
  /** Raw destination rows. Prefer {@link destinations}, which carries the handle to delete one. */
  readonly assignments: Prop<OutputAssignment[]>;
  /**
   * Every destination, live, in LUNA's order. Usually zero or one; {@link assign} appends.
   *
   * @example
   * send.destinations.onChange(() => label.textContent = send.destinations.value.map((d) => d.name).join(', '));
   */
  readonly destinations: Prop<readonly Destination[]>;
  /** The first destination, or `undefined` when unrouted. */
  readonly destination: Prop<Destination | undefined>;
  /** The first destination's bus uid, or `null` when unrouted. LUNA's own `bus_uid` property is always null. */
  readonly busUid: Prop<string | null>;
  readonly controls: Controls;
  readonly meter: Meter;
  private objectsRequested = false;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.uid = this.prop<string>('uid');
    this.outputType = this.prop<string>('output_type');
    this.assignments = this.prop<OutputAssignment[]>('assignments');
    const objects = client.store.children(`${path}/assignment_objects`);
    this.destinations = derived([this.assignments, objects], () => {
      const rows = Array.isArray(this.assignments.value) ? this.assignments.value : [];
      const uids = objects.value ?? [];
      // The rows arrive with the output; the object names need one more level. Fetch them
      // once when a row shows up without its object, so a destination always has its handle.
      if (rows.length > uids.length) this.requestObjects();
      return Object.freeze(uids.map((uid, i) => destinationOf(uid, rows[i], client, `${path}/assignment_objects/${uid}`)));
    });
    this.destination = derived([this.destinations], () => this.list()[0]);
    this.busUid = derived([this.destinations], () => this.list()[0]?.busUid ?? null);
    this.controls = new Controls(client, `${path}/controls`);
    this.meter = new Meter(client, `${path}/meters/level`);
  }

  /** The current destinations; `Prop.value` is typed as possibly undefined. */
  private list(): readonly Destination[] {
    return this.destinations.value ?? [];
  }

  private requestObjects(): void {
    if (this.objectsRequested) return;
    this.objectsRequested = true;
    void this.client.store.load(`${this.path}/assignment_objects`, { levels: 2, commands: false, flatvalue: true }).catch(() => {
      this.objectsRequested = false;
    });
  }

  /** Whether the output routes anywhere. */
  get assigned(): boolean {
    return this.list().length > 0;
  }

  /**
   * True on a stereo channel, where pan is two controls, `pan_left` and `pan_right`
   * (fact 84). Read from the owning channel's `stem_format`, or from the controls when
   * they are loaded.
   */
  get stereo(): boolean {
    if (this.controls.byId('pan_left')) return true;
    if (this.controls.byId('pan')) return false;
    const owner = /^(.*\/(?:tracks|buses)\/[^/]+)\/outputs\//.exec(this.path)?.[1];
    return owner !== undefined && this.client.store.cell<string>(owner, 'stem_format').value === 'stereo';
  }

  get gain(): Control {
    return this.controls.get('gain');
  }
  /**
   * The pan control: `pan` on a mono channel; on a stereo channel `pan_left`, with
   * {@link panRight} beside it (fact 84). Use {@link pans} to handle both.
   *
   * @example
   * for (const p of track.main.pans) p.normalized.set(0.5);
   */
  get pan(): Control {
    return this.stereo ? this.controls.get('pan_left') : this.controls.get('pan');
  }
  /** Left pan on a stereo channel; the one pan on a mono channel. */
  get panLeft(): Control {
    return this.pan;
  }
  /** Right pan on a stereo channel; the one pan on a mono channel. */
  get panRight(): Control {
    return this.stereo ? this.controls.get('pan_right') : this.controls.get('pan');
  }
  /** Every pan control: one on a mono channel, left and right on a stereo one. */
  get pans(): Control[] {
    return this.stereo ? [this.controls.get('pan_left'), this.controls.get('pan_right')] : [this.controls.get('pan')];
  }
  get mute(): Control {
    return this.controls.get('mute');
  }
  /** Pre- or post-fader, for a send. A control, not a node property. */
  get preFader(): Control {
    return this.controls.get('pre_fader');
  }
  /** Send enable, for a send. A control, not a node property. */
  get enabled(): Control {
    return this.controls.get('enabled');
  }

  /** `send_0`..`send_7`. */
  get isSend(): boolean {
    return this.id.startsWith('send_');
  }

  /** `cue_0`..`cue_3`. Cue outputs are routed by LUNA and refuse the routing commands. */
  get isCue(): boolean {
    return this.id.startsWith('cue_');
  }

  /** The slot number for a `send_N` or `cue_N` output, `undefined` for `main`. */
  get index(): number | undefined {
    const n = Number(this.id.slice(this.id.indexOf('_') + 1));
    return this.id.includes('_') && Number.isInteger(n) ? n : undefined;
  }

  /**
   * Who owns this output, read off its own path
   * (`/sessions/<session>/{tracks,buses}/<channel>/outputs/<id>`), so the routing commands
   * can name the session and channel without every caller threading them through.
   */
  private owner(): Owner {
    this.assertLive();
    const m = /^((\/sessions\/([^/]+))\/(tracks|buses)\/([^/]+))\/outputs\//.exec(this.path);
    if (!m) throw new UAError('unavailable', `${this.path} is not a channel output, so it cannot be routed`, { path: this.path });
    return { channelPath: m[1]!, sessionPath: m[2]!, sessionUid: m[3]!, isTrack: m[4] === 'tracks', channelUid: m[5]! };
  }

  /** Wait for the routing to show an edit; the assignment verbs can answer before the model moves. */
  private settled(done: () => boolean, what: string): Promise<void> {
    return settle(done, what, {
      path: this.path,
      disposed: () => this.disposed,
      refresh: () => this.client.store.load(this.path, { levels: 3, commands: false, flatvalue: true, propfilter: ['assignments', 'uid', 'output_type'] }),
      flush: () => this.client.store.scheduler.flush(),
    });
  }

  /**
   * Route this send to a bus and resolve to the new assignment uid, once the destination is
   * in {@link destinations}. One "New Output Assignment" undo entry.
   *
   * LUNA **appends**: a send that is already routed keeps its old destination too
   * (fact 43), so use {@link retarget} to replace rather than add.
   *
   * @throws {UAError} `out_of_range` on a cue output; `uasrv.invalid_type` for an unknown bus.
   * @example
   * const reverb = session.buses.items.find((b) => b.name.value === 'Reverb');
   * await track.outputs.byId('send_0').assign(reverb.id);
   */
  async assign(bus: string | { readonly id: string }): Promise<string> {
    if (this.isCue) throw new UAError('out_of_range', `${this.id}: a cue output is routed by LUNA; assign a send`, { path: this.path });
    const busUid = typeof bus === 'string' ? bus : bus.id;
    if (!busUid) throw new UAError('out_of_range', 'assign(): a bus uid is required', { path: this.path });
    const { sessionPath, sessionUid, channelUid, isTrack } = this.owner();
    const source = isTrack ? { track_uid: channelUid } : { bus_src_uid: channelUid };
    const reply = (await this.wire.post(`${sessionPath}/new_output_assignment`, { session_uid: sessionUid, ...source, output_type: this.id, bus_uid: busUid })) as { uid?: string } | null;
    const uid = reply?.uid;
    if (typeof uid !== 'string' || !uid) throw new UAError('invalid_response', 'new_output_assignment answered without a uid', { path: this.path });
    await this.settled(() => this.list().some((d) => d.uid === uid && d.busUid !== undefined), 'assign send');
    return uid;
  }

  /**
   * Remove one destination (a {@link Destination} or its uid), or every one when called
   * with nothing. One "Delete Output Assignment" entry per removal; nothing to remove is a
   * no-op. Resolves once the destinations are gone.
   *
   * @example await track.outputs.byId('send_0').unassign();
   */
  async unassign(target?: string | Destination): Promise<void> {
    const { sessionPath, sessionUid } = this.owner();
    const uids = target === undefined ? this.list().map((d) => d.uid) : [typeof target === 'string' ? target : target.uid];
    if (uids.length === 0) return;
    for (const uid of uids) await this.wire.post(`${sessionPath}/delete_output_assignment`, { session_uid: sessionUid, uid });
    await this.settled(() => !this.list().some((d) => uids.includes(d.uid)), 'unassign send');
  }

  /**
   * Replace every destination with `bus`: unassign, then assign, because the engine's
   * forward verb only appends (fact 43). One undo entry named `name` when the send was
   * already routed; inside a caller's `session.transaction()` it joins that batch.
   *
   * @example await track.outputs.byId('send_0').retarget(delayBus.id);
   */
  async retarget(bus: string | { readonly id: string }, name = `Retarget ${this.id}`): Promise<string> {
    if (this.list().length === 0) return this.assign(bus);
    const { sessionUid } = this.owner();
    const session = this.client.sessions.items.byId(sessionUid);
    const replace = async () => {
      await this.unassign();
      return this.assign(bus);
    };
    if (session) return session.transaction(name, replace);
    return replace();
  }

  /**
   * Move this send's routing and control values to another channel's slot (`move_send`) —
   * the same slot number by default — or copy them with `copy: true`. One "Move Send"
   * entry. Resolves once this slot has emptied (or, for a copy, once LUNA has answered).
   *
   * @example await drums.outputs.byId('send_0').moveTo(bass.id);
   */
  async moveTo(channel: string | { readonly id: string }, options: { index?: number; copy?: boolean } = {}): Promise<void> {
    if (this.isCue) throw new UAError('out_of_range', `${this.id}: a cue output cannot be moved`, { path: this.path });
    const index = options.index ?? this.index;
    if (index === undefined || !Number.isInteger(index) || index < 0 || index >= SEND_COUNT) {
      throw new UAError('out_of_range', `moveTo(): index must be 0..${SEND_COUNT - 1}`, { path: this.path });
    }
    const destinationUid = typeof channel === 'string' ? channel : channel.id;
    const { sessionPath, sessionUid, channelUid: source } = this.owner();
    await this.wire.post(`${sessionPath}/move_send`, {
      session_uid: sessionUid,
      source_uid: source,
      source: this.id,
      destination_uid: destinationUid,
      destination: `send_${index}`,
      copy: options.copy === true,
    });
    if (options.copy !== true) await this.settled(() => this.list().length === 0, 'move send');
  }

  protected override release(): void {
    this.controls.dispose();
    this.meter.dispose();
  }
}

/** One destination: an `assignments` row zipped with its object, the object's cells filling in while the row is late. */
function destinationOf(uid: string, row: OutputAssignment | undefined, client: Client, objectPath: string): Destination {
  const cell = <T>(name: string) => client.store.cell<T>(objectPath, name).value;
  const desc = cell<{ name?: string; stem_format?: string }>('output_desc');
  const busUid = row ? row.value : cell<string | null>('output_node_uid');
  const error = row ? row.connection_error : cell<string>('connection_error');
  const stem = row?.stem_format ?? desc?.stem_format;
  return Object.freeze({
    uid,
    busUid: typeof busUid === 'string' && busUid ? busUid : undefined,
    name: String(row?.name ?? desc?.name ?? ''),
    busType: typeof row?.type === 'string' ? row.type : undefined,
    stereo: stem !== 'mono',
    error: typeof error === 'string' && error ? error : undefined,
  });
}
