/**
 * The track and bus order LUNA writes for `change_order` (fact 137), so a reorder can wait for
 * the order it will see rather than trust a reply that is `null` whether or not anything moved.
 *
 * One `order`, 1..N, runs across every track and bus. LUNA splices the moved items (a folder
 * with everything inside it) in just after the anchor, or at the front, then rewrites the
 * whole order depth-first: each folder followed at once by what is inside it, siblings in the
 * spliced order. Nothing changes folder, so the anchor only picks a place among siblings.
 */

/** What the plan reads of each track or bus. */
export interface OrderRow {
  readonly id: string;
  /** The folder it is directly in; null at the root. */
  readonly folderUid: string | null;
}

/**
 * The ids in the order LUNA will write after moving `moved` to just after `anchor` (null: the
 * front). `rows` is the current order. An anchor that is itself moved appends, as LUNA does.
 * @internal
 */
export function plannedOrder(rows: readonly OrderRow[], moved: readonly string[], anchor: string | null): string[] {
  const parentOf = new Map(rows.map((r) => [r.id, r.folderUid] as const));
  const childrenOf = (parent: string | null, list: readonly string[]) => list.filter((id) => (parentOf.get(id) ?? null) === parent);
  const flat = rows.map((r) => r.id);

  // The moved block: each item, and for a folder everything inside it in current order.
  const block: string[] = [];
  const add = (id: string): void => {
    if (block.includes(id)) return;
    block.push(id);
    for (const child of childrenOf(id, flat)) add(child);
  };
  for (const id of moved) add(id);

  const rest = flat.filter((id) => !block.includes(id));
  const at = anchor === null ? 0 : rest.indexOf(anchor) + 1;
  const spliced = anchor !== null && at === 0 ? [...rest, ...block] : [...rest.slice(0, at), ...block, ...rest.slice(at)];

  // Depth-first from the root; a row whose folder is gone goes at the end, as LUNA re-roots it.
  const out: string[] = [];
  const walk = (parent: string | null): void => {
    for (const id of childrenOf(parent, spliced)) {
      if (out.includes(id)) continue;
      out.push(id);
      walk(id);
    }
  };
  walk(null);
  for (const id of spliced) if (!out.includes(id)) out.push(id);
  return out;
}
