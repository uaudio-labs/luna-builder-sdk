/**
 * One group of a page's listeners and gestures, released together, that also knows whether
 * any of its drags is in progress.
 *
 * An Add On that rebuilds part of its DOM (a mixer's strips when tracks come and go) has two
 * chores. It must drop every `onChange` listener and gesture of the old DOM, and it must not
 * rebuild while one of those faders or knobs is being dragged, or the drag's release never
 * arrives (fact 78). `Bindings` does both: {@link Bindings.on} and {@link Bindings.add} collect
 * what to release, {@link bindGesture}, {@link bindRange} and {@link bindDrag} with
 * `{ bindings }` hold the group for the length of each drag, and {@link Bindings.whenIdle}
 * runs a rebuild now, or once when the last drag (and any rebuild still loading) has ended.
 *
 * @example
 * const strips = new Luna.Bindings();
 *
 * function render() {
 *   strips.clear();                                  // old listeners and gestures
 *   host.replaceChildren(...session.tracks.items.map((t) => {
 *     const fader = document.createElement('input');
 *     fader.type = 'range';
 *     Luna.bindRange(fader, t.gain, { bindings: strips });
 *     strips.on(t.name, () => { fader.title = t.name.value ?? ''; });
 *     return fader;
 *   }));
 * }
 * // a rebuild asked for mid-drag waits for the drag to end; several collapse into one
 * session.tracks.onChange(() => void strips.whenIdle(render));
 */
import type { Prop } from '../store/prop';
import type { Unsubscribe } from '../wire/port';

/** Something {@link Bindings} can release: an unsubscribe function or an object with `dispose()`. */
export type Releasable = Unsubscribe | { dispose(): void };

export class Bindings {
  private releases: Releasable[] = [];
  private holds = new Set<object>();
  private pending: { run: () => void | Promise<void>; waiters: { resolve: () => void; reject: (e: unknown) => void }[] } | undefined;
  /** A {@link whenIdle} rebuild that has not settled yet (an async one still loading). */
  private running = false;
  private disposed = false;

  /** True while a drag bound with this group, or a {@link hold}, is in progress. */
  get busy(): boolean {
    return this.holds.size > 0;
  }

  /**
   * Release `item` with the group. After {@link dispose} it is released at once.
   *
   * @example
   * const g = bindings.add(Luna.bindGesture(canvas, control, { capture: true }));
   * bindings.add(() => clearInterval(timer));
   */
  add<T extends Releasable>(item: T): T {
    if (this.disposed) release(item);
    else this.releases.push(item);
    return item;
  }

  /**
   * Subscribe to `prop` for as long as the group lives.
   *
   * @example
   * bindings.on(track.name, () => { label.textContent = track.name.value ?? ''; });
   */
  on(prop: Prop<unknown>, listener: () => void): Unsubscribe {
    return this.add(prop.onChange(listener));
  }

  /**
   * Keep the group busy until the returned function is called, for an edit that is not a drag
   * (an inline rename). Releasing twice is harmless; {@link clear} drops every hold.
   *
   * @example
   * const done = bindings.hold();
   * input.addEventListener('blur', done, { once: true });
   */
  hold(): () => void {
    const token = {};
    this.holds.add(token);
    return () => {
      if (this.holds.delete(token)) this.flush();
    };
  }

  /**
   * Run `rebuild` now when the group is idle. While it is busy, or while an earlier async
   * `rebuild` is still running, run it once afterwards instead; asked again meanwhile, the
   * latest `rebuild` replaces the waiting one, so a burst of changes costs one rebuild. The
   * promise settles when the `rebuild` that finally ran has finished.
   *
   * An async `rebuild` can find the group busy again after an `await` (a drag began while it
   * loaded). It should then ask again and return without touching the DOM:
   * `if (strips.busy) { void strips.whenIdle(render); return; }`. Returning that promise
   * instead would wait on itself.
   *
   * @example
   * session.tracks.onChange(() => void strips.whenIdle(render));
   */
  whenIdle(rebuild: () => void | Promise<void>): Promise<void> {
    if (!this.busy && !this.running) return this.start(rebuild);
    return new Promise((resolve, reject) => {
      const waiters = this.pending?.waiters ?? [];
      waiters.push({ resolve, reject });
      this.pending = { run: rebuild, waiters };
    });
  }

  /**
   * Release everything added so far, end any drag and drop the holds. The group stays usable:
   * call it in each rebuild, just before replacing the DOM. A rebuild still waiting in
   * {@link whenIdle} is kept, and runs once nothing holds the group.
   *
   * @example
   * function render() { strips.clear(); ... }
   */
  clear(): void {
    this.holds.clear();
    const releases = this.releases;
    this.releases = [];
    for (const item of releases) {
      try {
        release(item);
      } catch (err) {
        console.error('[Luna] release threw', err);
      }
    }
    this.flush();
  }

  /**
   * {@link clear}, drop any waiting {@link whenIdle} rebuild (its promise resolves), and
   * release anything added afterwards at once.
   */
  dispose(): void {
    this.disposed = true;
    const pending = this.pending;
    this.pending = undefined;
    this.clear();
    for (const w of pending?.waiters ?? []) w.resolve();
  }

  private start(rebuild: () => void | Promise<void>): Promise<void> {
    this.running = true;
    const done = run(rebuild);
    const settle = (): void => {
      this.running = false;
      this.flush();
    };
    done.then(settle, settle);
    return done;
  }

  private flush(): void {
    const pending = this.pending;
    if (!pending || this.busy || this.running) return;
    this.pending = undefined;
    this.start(pending.run).then(
      () => pending.waiters.forEach((w) => w.resolve()),
      (err: unknown) => pending.waiters.forEach((w) => w.reject(err)),
    );
  }
}

function release(item: Releasable): void {
  if (typeof item === 'function') item();
  else item.dispose();
}

function run(fn: () => void | Promise<void>): Promise<void> {
  try {
    return Promise.resolve(fn());
  } catch (err) {
    return Promise.reject(err);
  }
}
