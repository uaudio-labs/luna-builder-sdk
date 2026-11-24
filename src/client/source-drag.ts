/**
 * Start a drag of session files out of an Add On page onto LUNA's timeline.
 *
 * LUNA's timeline takes a drag whose text is file paths or `file://` URLs, one per line
 * (fact 241). A drop on a track lane places a clip on that track at the drop point; a drop
 * below the tracks makes a new track. A file that is already one of the session's own
 * (`<package>/audio/<uid>.wav`), or has the same content as one, is reused rather than imported
 * again, so dragging a session's own source adds a clip and no file.
 *
 * @example
 * row.draggable = true;
 * row.addEventListener('dragstart', (event) => {
 *   Luna.startSourceDrag(event, { session, source });
 * });
 */
import { UAError } from '../wire/errors';
import type { AudioSource } from '../model/audio-source';
import type { Session } from '../model/session';

/** What {@link startSourceDrag} drags: absolute paths, or a session's sources. */
export type SourceDragItems =
  | { path: string | readonly string[] }
  | { session: Session; source: AudioSource | string | ReadonlyArray<AudioSource | string> };

/** The minimal drag event this needs; a DOM `DragEvent` is one. */
export interface DragStartLike {
  readonly dataTransfer: {
    setData(format: string, data: string): void;
    effectAllowed: string;
  } | null;
}

/**
 * Fill a `dragstart` event with session files so LUNA's timeline can take the drop (fact 241).
 * Synchronous, as `dragstart` must be: a source's path comes from the session's package path,
 * so call `session.ready()` first. Answers the paths dragged.
 *
 * A rendering (`source.isRender`) is not one of the session's sources: LUNA would import a
 * copy. Drag the clip's `sourceUid` instead.
 *
 * @example
 * el.addEventListener('dragstart', (e) => Luna.startSourceDrag(e, { session, source: src }));
 * el.addEventListener('dragstart', (e) => Luna.startSourceDrag(e, { path: '/Users/me/Loops/beat.wav' }));
 */
export function startSourceDrag(event: DragStartLike, items: SourceDragItems): string[] {
  const paths = dragPaths(items);
  if (paths.length === 0) throw new UAError('unavailable', 'startSourceDrag(): no file path to drag (is the session ready?)');
  const transfer = event.dataTransfer;
  if (!transfer) throw new UAError('unavailable', 'startSourceDrag(): the event has no dataTransfer; call it from a dragstart listener');
  transfer.setData('text/uri-list', paths.map(fileUrl).join('\r\n'));
  transfer.setData('text/plain', paths.join('\n'));
  transfer.effectAllowed = 'copy';
  return paths;
}

function dragPaths(items: SourceDragItems): string[] {
  if ('path' in items) return (typeof items.path === 'string' ? [items.path] : [...items.path]).filter((p) => p !== '');
  const list = Array.isArray(items.source) ? items.source : [items.source as AudioSource | string];
  return list.map((s) => items.session.sourcePath(s)).filter((p): p is string => typeof p === 'string');
}

/** `file://` URL of an absolute POSIX or Windows path, percent-encoded per segment. */
export function fileUrl(path: string): string {
  const posix = path.replaceAll('\\', '/');
  const withRoot = /^[A-Za-z]:\//.test(posix) ? `/${posix}` : posix;
  return `file://${withRoot.split('/').map((seg, i) => (i === 1 && /^[A-Za-z]:$/.test(seg) ? seg : encodeURIComponent(seg))).join('/')}`;
}
