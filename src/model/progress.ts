/**
 * Holding back LUNA's own progress dialog while a page draws its own progress UI
 * (`/gui/add_progress_suppression`, facts 223-225). Reached as `luna.gui.suppressProgress()`.
 *
 * @example
 * const hold = await luna.gui.suppressProgress();
 * try {
 *   await longOperationWithOwnProgressBar();
 * } finally {
 *   await hold.release();
 * }
 */
import { UAError } from '../wire/errors';

/** How long a suppression lasts at most unless {@link SuppressProgressOptions.maxMs} says otherwise. */
export const PROGRESS_SUPPRESSION_MAX_MS = 120_000;

export interface SuppressProgressOptions {
  /**
   * Release on its own after this many milliseconds, whatever the page does. Default
   * {@link PROGRESS_SUPPRESSION_MAX_MS}. LUNA keeps an Add On's suppression until it is
   * released (fact 224), so keep this near the longest operation it covers.
   */
  maxMs?: number;
}

/**
 * One held suppression. {@link release} is idempotent and never rejects for a handle LUNA
 * already dropped.
 *
 * @example
 * const hold = await luna.gui.suppressProgress({ maxMs: 30_000 });
 * hold.released;          // false
 * await hold.release();
 */
export interface ProgressSuppression {
  /** The handle sent to LUNA (`suppression_uid`). */
  readonly uid: string;
  /** True once released, by {@link release}, the watchdog or the page going away. */
  readonly released: boolean;
  release(): Promise<void>;
}

type Post = (command: string, payload: Record<string, unknown>) => Promise<unknown>;

interface PageEvents {
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

/** @internal Used by `Gui.suppressProgress`. */
export async function suppressProgress(post: Post, uid: string, options: SuppressProgressOptions = {}): Promise<ProgressSuppression> {
  const maxMs = options.maxMs ?? PROGRESS_SUPPRESSION_MAX_MS;
  if (!(maxMs > 0) || !Number.isFinite(maxMs)) throw new UAError('out_of_range', `suppressProgress(): maxMs must be a positive number, not ${String(maxMs)}`);
  // No `owner`: LUNA accepts only its own pages' names there, so an Add On's handle is a
  // legacy one (fact 223).
  await post('add_progress_suppression', { suppression_uid: uid });
  const page = globalThis as PageEvents;
  let released = false;
  let releasing: Promise<void> | undefined;
  const onPageHide = () => {
    release().catch(() => undefined);
  };
  const timer = setTimeout(() => {
    release().catch(() => undefined);
  }, maxMs);
  (timer as { unref?: () => void }).unref?.();
  page.addEventListener?.('pagehide', onPageHide);
  const release = (): Promise<void> => {
    if (releasing) return releasing;
    released = true;
    clearTimeout(timer);
    page.removeEventListener?.('pagehide', onPageHide);
    releasing = post('remove_progress_suppression', { suppression_uid: uid }).then(
      () => undefined,
      (err: unknown) => {
        // LUNA answers invalid_value for a handle it no longer holds: one of its pages
        // reloading dropped it (fact 224). That is released too.
        if (err instanceof UAError && err.code === 'uasrv.invalid_value') return;
        throw err;
      },
    );
    return releasing;
  };
  return {
    uid,
    get released() {
      return released;
    },
    release,
  };
}
