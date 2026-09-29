/**
 * A level meter (`.../meters/level`). Arrays have one entry per stream (1 mono, 2 stereo).
 *
 * The engine pushes meters continuously, so the meter subscribes only while something is
 * listening and unsubscribes when the last listener leaves.
 *
 * @example
 * const stop = track.meter.onChange(() => draw(track.meter.level.value ?? []));
 * // later
 * stop();
 */
import type { Client } from '../client/client';
import type { Prop } from '../store/prop';
import type { Unsubscribe } from '../wire/port';
import { Node } from './node';

export class Meter extends Node {
  /** Current level per stream, 0..1. */
  readonly level: Prop<number[]>;
  /** Held peak per stream, 0..1. */
  readonly peak: Prop<number[]>;
  /** Clip indicator per stream (0/1). */
  readonly clip: Prop<number[]>;
  readonly enabled: Prop<boolean>;
  readonly numStreams: Prop<number>;

  private listeners = 0;
  private unwatch: Unsubscribe | undefined;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.level = this.prop<number[]>('level');
    this.peak = this.prop<number[]>('peak');
    this.clip = this.prop<number[]>('clip');
    this.enabled = this.prop<boolean>('enabled');
    this.numStreams = this.prop<number>('num_streams');
  }

  /** Streams metered: `num_streams` once read, else the length of the level array, at least 1. */
  get streams(): number {
    const n = this.numStreams.value;
    return typeof n === 'number' && n > 0 ? n : Math.max(1, this.level.value?.length ?? 0);
  }

  /**
   * The highest current level across streams, 0..1: one number for a single bar.
   *
   * @example
   * track.meter.onChange(() => (bar.style.height = `${track.meter.max * 100}%`));
   */
  get max(): number {
    const levels = this.level.value ?? [];
    return levels.length ? Math.max(...levels) : 0;
  }

  /** Called on every meter push while subscribed. */
  onChange(listener: () => void): Unsubscribe {
    if (this.listeners++ === 0) {
      this.unwatch = this.client.store.watch(this.path, { load: { flatvalue: true, commands: false, children: false } }).release;
    }
    const unsub = this.level.onChange(listener);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      unsub();
      if (--this.listeners === 0) {
        this.unwatch?.();
        this.unwatch = undefined;
      }
    };
  }

  protected override release(): void {
    this.unwatch?.();
    this.unwatch = undefined;
    this.listeners = 0;
  }
}
