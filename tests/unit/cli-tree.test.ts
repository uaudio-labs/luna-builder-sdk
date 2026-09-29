/** `ua-builder tree` records shape, not state: types and read_only, names, commands. */
import { describe, expect, it } from 'vitest';
import { shapeOf } from '../../cli/tree';

describe('ua-builder tree', () => {
  it('reduces a get reply to its shape, keeping only identifying values', () => {
    const shape = shapeOf({
      properties: { name: { value: 'Vocal', read_only: false }, gain: { value: -6 }, uid: { value: 'abc', read_only: true }, assignments: { value: [] } },
      children: [{ path: 'outputs' }, { path: '/sessions/s/tracks/t/effects' }],
      commands: [{ path: 'set_touch' }, { path: 'delete' }],
    });
    expect(shape).toEqual({
      properties: {
        assignments: { read_only: false, type: 'array' },
        gain: { read_only: false, type: 'number' },
        name: { read_only: false, type: 'string', value: 'Vocal' },
        uid: { read_only: true, type: 'string' },
      },
      children: ['outputs', 'effects'],
      commands: ['delete', 'set_touch'],
    });
  });
});
