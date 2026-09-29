import { describe, expect, it } from 'vitest';
import { expandMulti } from '../../src/wire/multi';

// Captured from LUNA 1.9.0 (uanet-core message-expansion.js). One control changed and the
// engine pushed touch_count, real_value and string_value, the last two twice.
const LUNA_1_9_0_PACKED = {
  path: 'multi',
  data: {
    data: [2, 10977, '  24', 10977, '  24'],
    string: [
      'sessions',
      '899865d105b246f9a1cd2e62c0a04536',
      'tracks',
      '4c8529c653da4b3d942dd6d6868597ea',
      'effects',
      'effect_1',
      'controls',
      'depth',
      'touch_count',
      'value',
      'real_value',
      'string_value',
    ],
    name: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 11, 9],
    parent: [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 7, 10, 7, 12],
    path: [9, 11, 13, 11, 13],
  },
};

const DEPTH = '/sessions/899865d105b246f9a1cd2e62c0a04536/tracks/4c8529c653da4b3d942dd6d6868597ea/effects/effect_1/controls/depth';

describe('expandMulti', () => {
  it('returns a non-multi message unchanged', () => {
    const m = { path: '/a/value', data: 1 };
    expect(expandMulti(m)).toEqual([m]);
  });

  it('expands the plain array form and drops malformed entries', () => {
    const out = expandMulti({
      path: 'multi',
      data: [{ path: '/a/value', data: 1 }, { path: '/b', operation: 'removed' }, 'junk', { data: 3 }],
    });
    expect(out).toEqual([{ path: '/a/value', data: 1 }, { path: '/b', operation: 'removed' }]);
  });

  it('decodes the packed form captured from LUNA 1.9.0', () => {
    const out = expandMulti(LUNA_1_9_0_PACKED);
    expect(out.map((m) => m.path)).toEqual([
      `${DEPTH}/touch_count/value`,
      `${DEPTH}/real_value/value`,
      `${DEPTH}/string_value/value`,
      `${DEPTH}/real_value/value`,
      `${DEPTH}/string_value/value`,
    ]);
    expect(out.map((m) => m.data)).toEqual([2, 10977, '  24', 10977, '  24']);
    expect(out.every((m) => m.operation === undefined)).toBe(true);
  });

  it('marks added and removed entries by index into data', () => {
    const out = expandMulti({
      path: 'multi',
      data: {
        data: [null, null, 5],
        string: ['sessions', 's1', 's2', 'playing', 'value'],
        name: [0, 1, 2, 3, 4],
        parent: [0, 0, 0, 1, 3],
        path: [1, 2, 4],
        added: [0],
        removed: [1],
      },
    });
    expect(out).toEqual([
      { path: '/sessions/s1', data: null, operation: 'added' },
      { path: '/sessions/s2', data: null, operation: 'removed' },
      { path: '/sessions/s1/playing/value', data: 5 },
    ]);
  });

  it('returns nothing for an unrecognised multi payload', () => {
    expect(expandMulti({ path: 'multi', data: { nope: true } })).toEqual([]);
    expect(expandMulti({ path: 'multi' })).toEqual([]);
  });
});
