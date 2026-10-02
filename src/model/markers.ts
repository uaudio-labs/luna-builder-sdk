/**
 * Timeline markers: `/sessions/<uid>/markers/<rowid>`. The tick field is named `location`.
 *
 * @example
 * await session.markers.load();
 * session.markers.sorted.map((m) => [m.name.value, m.location.value]);
 * await session.addMarker(Luna.WHOLE_NOTE * 8, 'Chorus');
 * await marker.rename('Bridge');
 * await marker.delete();
 * marker.barBeat.onChange(() => row.textContent = Luna.formatBarBeat(marker.barBeat.value));
 */
import type { Client } from '../client/client';
import { derived, type Prop } from '../store/prop';
import type { Timeline } from './musical';
import type { BarBeat } from './ticks';
import { Collection } from './collection';
import { Node } from './node';
import { requireTick, settle } from './settle';

export class Marker extends Node {
  readonly rowid: Prop<number>;
  /** Position in ticks. */
  readonly location: Prop<number>;
  readonly name: Prop<string>;
  readonly comments: Prop<string>;
  /** ARGB packed integer. */
  readonly color: Prop<number>;
  /**
   * {@link location} as bar|beat, following the marker and the session's time signatures, so
   * a marker list needs no listeners of its own. Format it with `Luna.formatBarBeat`.
   * Assumes 4/4 until `session.musical` has loaded.
   *
   * @example
   * marker.barBeat.onChange(() => cell.textContent = Luna.formatBarBeat(marker.barBeat.value));
   */
  readonly barBeat: Prop<BarBeat>;
  /**
   * {@link location} in seconds from the session start, following the marker and the tempo
   * map. Assumes 120 BPM until `session.musical` has loaded.
   *
   * @example
   * marker.seconds.onChange(() => cell.textContent = Luna.formatMinSec(marker.seconds.value));
   */
  readonly seconds: Prop<number>;

  /** @internal */
  constructor(
    client: Client,
    path: string,
    private readonly sessionUid: string,
    timeline: () => Timeline,
  ) {
    super(client, path);
    this.rowid = this.prop<number>('rowid');
    this.location = this.prop<number>('location');
    this.name = this.prop<string>('name');
    this.comments = this.prop<string>('comments');
    this.color = this.prop<number>('color');
    const maps: Prop<unknown> = { value: undefined, onChange: (l) => timeline().onChange(l) };
    const at = <T>(f: (t: Timeline, tick: number) => T) => () => {
      const tick = this.location.value;
      return tick === undefined ? undefined : f(timeline(), tick);
    };
    this.barBeat = derived([this.location, maps], at((t, tick) => t.barBeat(tick)), { distinct: true });
    this.seconds = derived([this.location, maps], at((t, tick) => t.seconds(tick)), { distinct: true });
  }

  private get row(): number {
    return this.rowid.value ?? Number(this.id);
  }

  /**
   * `set_marker` and `delete_marker` answer `null` whether or not the rowid matched
   * (fact 71), so each edit resolves once this marker shows it.
   */
  private async edit(fields: Record<string, unknown>, done: () => boolean, what: string): Promise<unknown> {
    this.assertLive();
    const reply = await this.wire.post(`/sessions/${this.sessionUid}/set_marker`, { session_uid: this.sessionUid, rowid: this.row, ...fields });
    await settle(done, what, { path: this.path, disposed: () => this.disposed, refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }), flush: () => this.client.store.scheduler.flush() });
    return reply;
  }

  /** @example await marker.rename('Bridge'); */
  rename(name: string): Promise<unknown> {
    return this.edit({ name }, () => this.name.value === name, 'rename marker');
  }

  /** @example await marker.moveTo(Luna.WHOLE_NOTE * 16); */
  moveTo(tick: number): Promise<unknown> {
    requireTick(tick, 'marker tick');
    return this.edit({ location: tick }, () => this.location.value === tick, 'move marker');
  }

  /** @example await marker.setColor(0xffff0000); */
  setColor(argb: number): Promise<unknown> {
    return this.edit({ color: argb }, () => this.color.value === argb, 'recolor marker');
  }

  /** @example await marker.setComments('double chorus'); */
  setComments(comments: string): Promise<unknown> {
    return this.edit({ comments }, () => this.comments.value === comments, 'comment marker');
  }

  /**
   * Delete this marker and resolve once it has left the list.
   *
   * @example await marker.delete();
   */
  async delete(): Promise<unknown> {
    this.assertLive();
    const reply = await this.wire.post(`/sessions/${this.sessionUid}/delete_marker`, { session_uid: this.sessionUid, rowid: this.row });
    const parent = this.path.slice(0, this.path.lastIndexOf('/'));
    await settle(() => !(this.client.store.children(parent).value ?? []).includes(this.id), 'delete marker', {
      path: this.path,
      refresh: () => this.client.store.load(parent, { levels: 2, commands: false, flatvalue: true }),
      flush: () => this.client.store.scheduler.flush(),
    });
    return reply;
  }
}

export class Markers extends Collection<Marker> {
  /** @internal */
  constructor(client: Client, sessionPath: string, sessionUid: string, timeline: () => Timeline) {
    super(client, `${sessionPath}/markers`, (p) => new Marker(client, p, sessionUid, timeline), { levels: 2, commands: false, flatvalue: true });
  }

  /** Markers in timeline order. */
  get sorted(): Marker[] {
    return [...this.items].sort((a, b) => (a.location.value ?? 0) - (b.location.value ?? 0));
  }

  /** The last marker at or before `tick`. */
  at(tick: number): Marker | undefined {
    return this.sorted.filter((m) => (m.location.value ?? 0) <= tick).at(-1);
  }
}
