/**
 * @internal How the SDK tells whether LUNA serves an optional part of its tree: list the
 * parent's children and look for it. A `get` of a missing node answers `{}`, not an error
 * (fact 10), so reading the node itself cannot tell.
 *
 * Every optional part answers the same way, as `available(): Promise<boolean>`, cached once
 * answered (DESIGN.md, "Optional parts of LUNA's tree").
 */
/** The last path segment of each child in a `get` reply. */
export function childNames(reply: unknown): string[] {
  const children = typeof reply === 'object' && reply !== null ? (reply as { children?: unknown }).children : undefined;
  if (!Array.isArray(children)) return [];
  const out: string[] = [];
  for (const child of children) {
    const raw = typeof child === 'string' ? child : typeof child === 'object' && child !== null ? ((child as { path?: unknown; name?: unknown }).path ?? (child as { name?: unknown }).name) : undefined;
    if (typeof raw === 'string') out.push(raw.slice(raw.lastIndexOf('/') + 1));
  }
  return out;
}
