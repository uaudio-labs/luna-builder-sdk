/**
 * Waiting for an edit to actually land.
 *
 * Many of LUNA's editing verbs answer `null` whether or not anything happened (fact 71):
 * `delete_clip` with an unknown uid, `set_marker` with a bad rowid, `change_velocity` on a
 * row that is not in the clip. Some failures even leave an empty undo entry behind. A reply
 * is therefore not proof, so every wrapper that must be able to say "this happened" posts
 * and then waits for the live model to show the change, rejecting with `no_effect` when it
 * does not.
 *
 * @example
 * await clip.delete();
 * await Luna.settle(() => playlist.clips.byId(uid) === undefined, 'delete clip');
 */
import { UAError } from '../wire/errors';

/** How long {@link settle} waits by default for the model to reflect an edit. */
export const EDIT_TIMEOUT_MS = 4000;
/** Grace before a waiting `settle` re-reads its node, and the period after that. */
export const REFRESH_AFTER_MS = 120;
export const REFRESH_EVERY_MS = 300;

export interface SettleOptions {
  /** Path to name in the error. */
  path?: string;
  /** Default {@link EDIT_TIMEOUT_MS}. */
  timeoutMs?: number;
  /** Abort early with `disposed` when the object goes away under us. */
  disposed?: () => boolean;
  /** Re-read the node while waiting. LUNA holds pushes back inside a batch transaction but answers reads at once (fact 60). */
  refresh?: () => Promise<unknown>;
  /** Flush the Store scheduler after a refresh so derived props are current. */
  flush?: () => void;
}

/**
 * One macrotask later, through a `MessageChannel` where there is one. A background browser
 * tab throttles timers to about one tick per second but never throttles messages, so a
 * timer-only loop lands on its own timeout in a hidden page even though LUNA finished in
 * milliseconds.
 */
export function yieldTask(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof MessageChannel === 'function') {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        resolve();
      };
      channel.port2.postMessage(0);
    } else setTimeout(resolve, 0);
  });
}

/**
 * Poll `done` until it holds, or reject with `no_effect`. Socket replies and event frames
 * land between the yields; with `refresh`, the node is re-read after a short grace and then
 * periodically, covering both a batch transaction and an event lost on the wire.
 */
export async function settle(done: () => boolean, what: string, options: SettleOptions = {}): Promise<void> {
  const started = Date.now();
  const timeoutMs = options.timeoutMs ?? EDIT_TIMEOUT_MS;
  const deadline = started + timeoutMs;
  let nextRefresh = started + REFRESH_AFTER_MS;
  while (!done()) {
    if (options.disposed?.()) throw new UAError('disposed', `${what}: the object was disposed while waiting`, options.path ? { path: options.path } : {});
    if (Date.now() > deadline) throw new UAError('no_effect', `${what}: LUNA answered, but the change did not appear in ${timeoutMs} ms`, options.path ? { path: options.path } : {});
    for (let i = 0; i < 8 && !done(); i++) await yieldTask();
    if (done()) return;
    if (options.refresh && Date.now() >= nextRefresh) {
      nextRefresh = Date.now() + REFRESH_EVERY_MS;
      await options.refresh().catch((err: unknown) => {
        // A closed or dropped connection will not show the edit; stop waiting instead of polling to the timeout.
        if ((err as { code?: string } | undefined)?.code === 'disconnected') throw err;
      });
      options.flush?.();
      for (let i = 0; i < 8 && !done(); i++) await yieldTask();
      if (done()) return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

/** Reject a non-integer tick before it reaches the wire: LUNA stores whatever it is given (fact 12). */
export function requireTick(value: unknown, what: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new UAError('out_of_range', `${what} must be an integer tick count`);
  }
  return value;
}

/** A 7-bit MIDI value, or `out_of_range`. `min` is 1 for a velocity that must sound. */
export function midiByte(value: unknown, what: string, min = 0): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > 127) {
    throw new UAError('out_of_range', `${what} must be an integer ${min}-127`);
  }
  return value;
}
