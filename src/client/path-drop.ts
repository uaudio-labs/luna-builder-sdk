/**
 * Native path drops: LUNA's webview bridge for files dragged onto an Add On (fact 102).
 *
 * This is the **path route**, an optimization for getting a file into the session without
 * its bytes passing through the page: the handler gets absolute paths, not `File`s, and the
 * page cannot `fetch` them. Hand them to `session.importPath()`. To decode, audition or
 * slice the audio in the page, skip this and use an ordinary HTML `drop` listener, which
 * gives `File`s and works in LUNA and a browser alike; then `session.uploadFile()` them.
 *
 * The two kinds of drop are exclusive: while a path-drop handler is registered LUNA claims
 * every file drag, so HTML `drop` events carry no files. Unregister to hand drags back.
 */
import { Unsupported } from '../wire/errors';
import type { Unsubscribe } from '../wire/port';
import { hasNativeBridge } from './detect';

/** Where a native drag is, in page pixels, and the absolute paths it carries. */
export interface PathDrop {
  paths: string[];
  x: number;
  y: number;
}

export interface PathDropHandlers {
  /** The user dropped files on the page. */
  drop(drop: PathDrop): void;
  /** A file drag entered or moved over the page; highlight a drop zone. */
  dragOver?(drag: PathDrop): void;
  /** The drag left the page or was cancelled. */
  dragLeave?(): void;
}

/** The object LUNA calls back on; the page publishes it (fact 102). */
interface LunaHost {
  fileDragEnter?(info: unknown): void;
  fileDragOver?(info: unknown): void;
  fileDragLeave?(): void;
  filesDropped?(info: unknown): void;
}

interface BridgeGlobals {
  lunaAPI?: { setAcceptsFileDrops?: (accepts: boolean) => void };
  lunaHost?: LunaHost;
}

const registered: PathDropHandlers[] = [];
let installed: LunaHost | undefined;
let previous: LunaHost | undefined;

/**
 * True when native path drops can be used: the page is in LUNA's webview, which publishes
 * `window.lunaAPI.setAcceptsFileDrops`. False in a browser and in tests.
 */
export function canDropPaths(): boolean {
  return hasNativeBridge();
}

/**
 * Receive files dropped on the page as **absolute paths** (LUNA only). Resolves nothing and
 * reads nothing: pass the paths to `session.importPath()`, which has the engine read them
 * from disk. Returns an unsubscribe; once the last handler is gone, LUNA hands file drags
 * back to the page's HTML `drop` events.
 *
 * Drops are page-wide: route one to a zone by hit-testing its `x`, `y` (page pixels), for
 * example `document.elementFromPoint(x, y)?.closest('.zone')`.
 *
 * Throws {@link Unsupported} outside LUNA. Check {@link canDropPaths} first and fall back
 * to an HTML `drop` listener there. In LUNA 3.1.0.4589 and earlier, after the Add On's
 * window is closed and reopened, drops arrive as HTML drops instead (fact 105): keep an HTML
 * `drop` listener as well.
 *
 * Want the file's bytes in the page (decode, play, slice)? Do not use this: listen for HTML
 * `drop` and read `event.dataTransfer.files`, then `session.uploadFile({ bytes: file })`.
 *
 * @example
 * if (Luna.canDropPaths()) {
 *   const stop = Luna.onPathDrop({
 *     dragOver: () => zone.classList.add('hot'),
 *     dragLeave: () => zone.classList.remove('hot'),
 *     drop: async ({ paths }) => {
 *       zone.classList.remove('hot');
 *       for (const path of paths) await session.importPath(path);
 *     },
 *   });
 * }
 */
export function onPathDrop(handlers: PathDropHandlers | ((drop: PathDrop) => void)): Unsubscribe {
  const g = globalThis as BridgeGlobals;
  const accept = g.lunaAPI?.setAcceptsFileDrops;
  if (typeof accept !== 'function') {
    throw new Unsupported('onPathDrop(): native path drops exist only inside LUNA. Use an HTML drop listener, which gives File objects.');
  }
  const entry: PathDropHandlers = typeof handlers === 'function' ? { drop: handlers } : handlers;
  registered.push(entry);
  install(g);
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    const i = registered.indexOf(entry);
    if (i >= 0) registered.splice(i, 1);
    if (registered.length === 0) uninstall(g);
  };
}

function install(g: BridgeGlobals): void {
  if (installed && g.lunaHost === installed) return;
  const each = (run: (h: PathDropHandlers) => void): void => {
    for (const h of [...registered]) {
      try {
        run(h);
      } catch (err) {
        console.warn('Luna.onPathDrop: a handler threw', err);
      }
    }
  };
  // Keep members another script published on lunaHost; ours replace only the drop calls.
  const host: LunaHost = {
    ...g.lunaHost,
    fileDragEnter: (info) => each((h) => h.dragOver?.(toDrop(info))),
    fileDragOver: (info) => each((h) => h.dragOver?.(toDrop(info))),
    fileDragLeave: () => each((h) => h.dragLeave?.()),
    filesDropped: (info) => {
      const drop = toDrop(info);
      if (drop.paths.length) each((h) => h.drop(drop));
    },
  };
  previous = g.lunaHost;
  g.lunaHost = host;
  installed = host;
  g.lunaAPI?.setAcceptsFileDrops?.(true);
}

function uninstall(g: BridgeGlobals): void {
  g.lunaAPI?.setAcceptsFileDrops?.(false);
  if (installed && g.lunaHost === installed) {
    if (previous) g.lunaHost = previous;
    else delete g.lunaHost;
  }
  installed = undefined;
  previous = undefined;
}

/** LUNA sends `{ paths, x, y }`, the coordinates rounded to whole page pixels (fact 102). */
function toDrop(info: unknown): PathDrop {
  const o = (typeof info === 'object' && info !== null ? info : {}) as { paths?: unknown; x?: unknown; y?: unknown };
  return {
    paths: Array.isArray(o.paths) ? o.paths.filter((p): p is string => typeof p === 'string') : [],
    x: typeof o.x === 'number' ? o.x : 0,
    y: typeof o.y === 'number' ? o.y : 0,
  };
}
