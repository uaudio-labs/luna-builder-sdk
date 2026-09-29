/**
 * Framework-free reactive primitives. Every observable value in the SDK is a {@link Prop}:
 * read `value` synchronously, `onChange` to be told when it moved. Listeners take no arguments
 * and read `value` themselves, so one convention covers every property.
 *
 * Notifications are coalesced: many changes in one frame produce one call per listener.
 */
import type { Unsubscribe } from '../wire/port';

/** A readable, observable value. `value` is `undefined` until the first load or push. */
export interface Prop<T> {
  readonly value: T | undefined;
  onChange(listener: () => void): Unsubscribe;
}

/** A {@link Prop} that can be written. `set` is optimistic: `value` moves at once and rolls back on rejection. */
export interface WritableProp<T> extends Prop<T> {
  set(value: T): Promise<void>;
}

/** An observable ordered collection with id lookup. */
export interface List<T> extends Prop<readonly T[]> {
  readonly items: readonly T[];
  byId(id: string): T | undefined;
}

/**
 * Coalesces change notifications. In a browser it flushes on the next animation frame with a
 * timer fallback (hidden tabs suspend rAF); elsewhere on a macrotask. Tests call `flush()`.
 */
export class Scheduler {
  private readonly dirty = new Set<() => void>();
  private scheduled = false;
  private rafHandle: number | undefined;
  private timerHandle: ReturnType<typeof setTimeout> | undefined;
  private waiters: (() => void)[] = [];

  /** Queue `notify` to run once at the next flush. */
  enqueue(notify: () => void): void {
    this.dirty.add(notify);
    if (this.scheduled) return;
    this.scheduled = true;
    const g = globalThis as { requestAnimationFrame?: (cb: () => void) => number };
    if (typeof g.requestAnimationFrame === 'function') {
      this.rafHandle = g.requestAnimationFrame(() => this.flush());
      this.timerHandle = setTimeout(() => this.flush(), 100);
    } else {
      this.timerHandle = setTimeout(() => this.flush(), 0);
    }
  }

  /** Run every queued notification now. */
  flush(): void {
    if (!this.scheduled) return;
    this.scheduled = false;
    const g = globalThis as { cancelAnimationFrame?: (h: number) => void };
    if (this.rafHandle !== undefined && typeof g.cancelAnimationFrame === 'function') g.cancelAnimationFrame(this.rafHandle);
    if (this.timerHandle !== undefined) clearTimeout(this.timerHandle);
    this.rafHandle = undefined;
    this.timerHandle = undefined;
    const batch = [...this.dirty];
    this.dirty.clear();
    for (const notify of batch) {
      try {
        notify();
      } catch (err) {
        console.error('[Luna] change listener threw', err);
      }
    }
    const waiters = this.waiters;
    this.waiters = [];
    for (const w of waiters) w();
  }

  /** Resolves after the next flush (or immediately if nothing is queued). */
  settled(): Promise<void> {
    if (!this.scheduled) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push(resolve));
  }
}

let versionCounter = 0;
/** Monotonic stamp; one reply can stamp many cells as equally fresh. */
export function nextVersion(): number {
  return ++versionCounter;
}

/**
 * The concrete {@link Prop}: a value with a version stamp and listeners.
 * The version lets the Store decide whether an incoming value is newer than a pending write.
 */
export class Cell<T> implements Prop<T> {
  private current: T | undefined;
  private stamp = 0;
  private readonly listeners = new Set<() => void>();
  private readonly notify = () => {
    for (const l of [...this.listeners]) l();
  };

  constructor(private readonly scheduler: Scheduler, initial?: T) {
    this.current = initial;
  }

  get value(): T | undefined {
    return this.current;
  }

  /** Version of the current value; 0 until first written. */
  get version(): number {
    return this.stamp;
  }

  /**
   * Write with a stamp. Returns true if the value changed. A write stamped older than the
   * current value is ignored, so a read that was answered late cannot undo a push or a
   * write that landed while it was in flight.
   */
  update(value: T, version: number = nextVersion(), equals: (a: T | undefined, b: T) => boolean = shallowEquals): boolean {
    if (version < this.stamp) return false;
    this.stamp = version;
    if (equals(this.current, value)) return false;
    this.current = value;
    if (this.listeners.size > 0) this.scheduler.enqueue(this.notify);
    return true;
  }

  onChange(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** @internal */
  get listenerCount(): number {
    return this.listeners.size;
  }
}

/** Equality used by cells: `===` for primitives, JSON shape for plain objects and arrays. */
export function shallowEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => shallowEquals(v, b[i]));
  }
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => shallowEquals((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

/**
 * A read-only {@link Prop} computed from other props. Recomputes lazily on read and notifies
 * when any source notifies.
 *
 * @example
 * const isStopped = Luna.derived([transport.playing], () => transport.playing.value === false);
 */
export function derived<T>(sources: readonly Prop<unknown>[], compute: () => T): Prop<T> {
  const listeners = new Set<() => void>();
  let subscriptions: Unsubscribe[] = [];
  const fanOut = () => {
    for (const l of [...listeners]) l();
  };
  return {
    get value() {
      return compute();
    },
    onChange(listener) {
      if (listeners.size === 0) subscriptions = sources.map((s) => s.onChange(fanOut));
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          for (const u of subscriptions) u();
          subscriptions = [];
        }
      };
    },
  };
}

/**
 * Wrap a {@link Prop} with a setter to make a {@link WritableProp}.
 */
export function writable<T>(view: Prop<T>, setter: (value: T) => Promise<void>): WritableProp<T> {
  return {
    get value() {
      return view.value;
    },
    onChange: (l) => view.onChange(l),
    set: setter,
  };
}

/**
 * A {@link List} over a {@link Prop} of arrays.
 */
export function listOf<T>(source: Prop<readonly T[]>, idOf: (item: T) => string): List<T> {
  return {
    get value() {
      return source.value ?? [];
    },
    get items() {
      return source.value ?? [];
    },
    onChange: (l) => source.onChange(l),
    byId(id) {
      return (source.value ?? []).find((item) => idOf(item) === id);
    },
  };
}
