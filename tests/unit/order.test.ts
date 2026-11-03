/**
 * `plannedOrder`: the order LUNA's `change_order` writes (fact 137), measured live on the
 * cases below (2026-11-02).
 */
import { describe, expect, it } from 'vitest';
import { plannedOrder, type OrderRow } from '../../src/model/order';

// root: r1 r2 F[b a] bus — as the live probe made them.
const rows: OrderRow[] = [
  { id: 'F', folderUid: null },
  { id: 'b', folderUid: 'F' },
  { id: 'a', folderUid: 'F' },
  { id: 'r1', folderUid: null },
  { id: 'r2', folderUid: null },
  { id: 'bus', folderUid: null },
];

describe('plannedOrder', () => {
  it('moves a folder with its contents after the anchor', () => {
    expect(plannedOrder(rows, ['F'], 'r2')).toEqual(['r1', 'r2', 'F', 'b', 'a', 'bus']);
  });

  it('keeps an item in its folder when the anchor is inside another one', () => {
    const now = plannedOrder(rows, ['F'], 'r2').map((id) => rows.find((r) => r.id === id)!);
    expect(plannedOrder(now, ['r1'], 'b')).toEqual(['r2', 'F', 'b', 'a', 'r1', 'bus']);
  });

  it('moves to the front among siblings with no anchor, and keeps the given order', () => {
    expect(plannedOrder(rows, ['a'], null)).toEqual(['F', 'a', 'b', 'r1', 'r2', 'bus']);
    expect(plannedOrder(rows, ['bus', 'r1'], 'r2')).toEqual(['F', 'b', 'a', 'r2', 'bus', 'r1']);
  });

  it('appends when the anchor is itself moved', () => {
    expect(plannedOrder(rows, ['r1', 'r2'], 'r1')).toEqual(['F', 'b', 'a', 'bus', 'r1', 'r2']);
  });
});
