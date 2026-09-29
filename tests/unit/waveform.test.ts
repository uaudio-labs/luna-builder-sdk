/**
 * Waveform placement: pair arithmetic, which source a clip actually plays (fact 73), the
 * tick-to-file-offset mapping through the tempo map, and the page cache.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const BEAT = Luna.TICKS_PER_BEAT;
/** A second of audio at 120 bpm is two beats. */
const SECOND_NS = 1e9;

describe('pair arithmetic', () => {
  it('covers a range with contiguous pairs', () => {
    expect(Luna.pairRange(0, Luna.OVERVIEW_PAIR_NS)).toEqual({ index: 0, count: 1 });
    expect(Luna.pairRange(0, Luna.OVERVIEW_PAIR_NS * 2.5)).toEqual({ index: 0, count: 3 });
    // Starting mid-pair keeps the pair that contains the start.
    expect(Luna.pairRange(Luna.OVERVIEW_PAIR_NS * 1.5, Luna.OVERVIEW_PAIR_NS * 2.5)).toEqual({ index: 1, count: 2 });
  });

  it('is empty for an empty or inverted range, and rejects nonsense', () => {
    expect(Luna.pairRange(100, 100).count).toBe(0);
    expect(Luna.pairRange(200, 100).count).toBe(0);
    expect(() => Luna.pairRange(-1, 100)).toThrow(/finite nanoseconds/);
    expect(() => Luna.pairRange(0, Number.NaN)).toThrow();
  });

  it('picks the analysis that matches the zoom', () => {
    expect(Luna.kindForScale(Luna.COARSE_PAIR_NS)).toBe('coarse');
    expect(Luna.kindForScale(Luna.COARSE_PAIR_NS * 10)).toBe('coarse');
    expect(Luna.kindForScale(Luna.COARSE_PAIR_NS - 1)).toBe('fine');
    expect(Luna.kindForScale(Luna.OVERVIEW_PAIR_NS / 4)).toBe('fine');
    expect(() => Luna.kindForScale(0)).toThrow(/positive/);
  });

  it('agrees with the engine on pair length: 125 samples at 48 kHz, 12 fine per coarse', () => {
    expect(Luna.OVERVIEW_PAIR_NS).toBeCloseTo(2_604_166.67, 1);
    expect(Luna.COARSE_PAIR_NS).toBeCloseTo(31_250_000, 1);
    expect(Luna.pairNs('coarse') / Luna.pairNs('fine')).toBe(Luna.COARSE_PAIRS_PER_FINE);
  });
});

async function sessionWithClip(clipProps: Record<string, unknown> = {}) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Gtr'], name: 'Demo', packageUid: 'pkg1' });
  // 2 s is 768 fine pairs, so page 0 comes back short of WAVEFORM_PAGE; 10 s is 3840, so it does not.
  engine.addSource('pkg1', 'src1', { name: 'take.wav', lengthNs: 2 * SECOND_NS, stemFormat: 'stereo' });
  engine.addSource('pkg1', 'long1', { name: 'long.wav', lengthNs: 10 * SECOND_NS });
  engine.addSource('pkg1', 'rend1', { name: 'stretched.wav', lengthNs: 3 * SECOND_NS });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  await session.insertClip({ trackUid: 'Gtr', sourceUid: 'src1', startTick: 0, stopTick: 4 * BEAT, sourceStartNs: 0, sourceStopNs: 2 * SECOND_NS });
  await engine.settled();
  const playlist = session.playlistFor(session.tracks.byId('Gtr')!)!;
  await playlist.clips.load();
  const clip = playlist.clips.items[0]!;
  for (const [k, v] of Object.entries(clipProps)) engine.setValue(clip.path, k, v);
  await engine.settled();
  await session.sources!.load();
  return { engine, luna, session, clip };
}

describe('clipAudio', () => {
  it('uses the clip source range when there is no stretch render', async () => {
    const { session, clip, luna } = await sessionWithClip();
    const audio = Luna.clipAudio(clip, session.sources!)!;
    expect(audio.source.id).toBe('src1');
    expect(audio.stretched).toBe(false);
    expect([audio.startNs, audio.stopNs]).toEqual([0, 2 * SECOND_NS]);
    await luna.close();
  });

  it('uses the whole render when LUNA has time-stretched the clip', async () => {
    const { session, clip, luna } = await sessionWithClip({ render_source_uid: 'rend1', render_state: 'current' });
    const audio = Luna.clipAudio(clip, session.sources!)!;
    expect(audio.source.id).toBe('rend1');
    expect(audio.stretched).toBe(true);
    expect([audio.startNs, audio.stopNs]).toEqual([0, 3 * SECOND_NS]);
    await luna.close();
  });

  it('is undefined when the render is named but not yet announced: draw an outline, never silence', async () => {
    const { session, clip, luna } = await sessionWithClip({ render_source_uid: 'not_here_yet', render_state: 'current' });
    expect(Luna.clipAudio(clip, session.sources!)).toBeUndefined();
    await luna.close();
  });

  it('is undefined for a clip with no source', async () => {
    const { session, clip, luna } = await sessionWithClip({ source_uid: '' });
    expect(Luna.clipAudio(clip, session.sources!)).toBeUndefined();
    await luna.close();
  });

  it('takes a plain snapshot as well as a Clip, and an array as well as a Collection', async () => {
    const { session, luna } = await sessionWithClip();
    const audio = Luna.clipAudio({ sourceUid: 'src1', sourceStartNs: 100, sourceStopNs: 200 }, session.sources!.items)!;
    expect([audio.source.id, audio.startNs, audio.stopNs]).toEqual(['src1', 100, 200]);
    await luna.close();
  });
});

describe('audioNsAtTick', () => {
  it('maps a tick inside the clip to a file offset through the tempo map', async () => {
    const { session, clip, luna } = await sessionWithClip();
    const audio = Luna.clipAudio(clip, session.sources!)!;
    const timeline = session.musical.timeline;
    // 120 bpm: one beat is half a second.
    expect(Luna.audioNsAtTick(timeline, clip, audio, 0)).toBeCloseTo(0, 0);
    expect(Luna.audioNsAtTick(timeline, clip, audio, 2 * BEAT)).toBeCloseTo(SECOND_NS, 0);
    // Outside the clip the mapping still extends; callers clamp.
    expect(Luna.audioNsAtTick(timeline, clip, audio, -2 * BEAT)).toBeCloseTo(-SECOND_NS, 0);
    await luna.close();
  });

  it('throws when the clip has no start tick yet', async () => {
    const { session, clip, luna } = await sessionWithClip();
    const audio = Luna.clipAudio(clip, session.sources!)!;
    expect(() => Luna.audioNsAtTick(session.musical.timeline, { startTicks: undefined }, audio, 0)).toThrow(/start tick/);
    void clip;
    await luna.close();
  });
});

describe('AudioSource.overview', () => {
  it('reads a bounded page of floats in -1..1 with min below max', async () => {
    const { session, luna } = await sessionWithClip();
    const source = session.sources!.byId('src1')!;
    const page = (await source.overview({ index: 0, count: 64 }))!;
    expect(page.index).toBe(0);
    expect(page.count).toBe(64);
    expect(page.kind).toBe('fine');
    expect(page.channels).toHaveLength(2);
    for (const channel of page.channels) {
      expect(channel.min.length).toBe(64);
      for (let i = 0; i < channel.min.length; i++) {
        expect(channel.min[i]!).toBeLessThanOrEqual(channel.max[i]!);
        expect(Math.abs(channel.min[i]!)).toBeLessThanOrEqual(1);
      }
    }
    await luna.close();
  });

  it('reports the analysis size and digest, and answers a short page at the end', async () => {
    const { session, luna } = await sessionWithClip();
    const source = session.sources!.byId('src1')!;
    const info = (await source.overviewInfo())!;
    // Two seconds at 2.604 ms per pair.
    expect(info.count).toBe(768);
    expect(info.md5).toBeTruthy();
    const tail = (await source.overview({ index: 700, count: 1024 }))!;
    expect(tail.count).toBe(68);
    const past = (await source.overview({ index: 5000, count: 16 }))!;
    expect(past.count).toBe(0);
    await luna.close();
  });

  it('has a coarser analysis twelve times shorter', async () => {
    const { session, luna } = await sessionWithClip();
    const source = session.sources!.byId('src1')!;
    const fine = (await source.overviewInfo({ kind: 'fine' }))!;
    const coarse = (await source.overviewInfo({ kind: 'coarse' }))!;
    expect(coarse.count).toBe(Math.floor(fine.count / 12));
    await luna.close();
  });

  it('refuses an unbounded or negative read', async () => {
    const { session, luna } = await sessionWithClip();
    const source = session.sources!.byId('src1')!;
    await expect(source.overview({ count: 99999 })).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(source.overview({ index: -1 })).rejects.toMatchObject({ code: 'out_of_range' });
    await luna.close();
  });
});

describe('Waveforms cache', () => {
  it('serves a second read of the same pages without going back to the engine', async () => {
    const { session, engine, luna } = await sessionWithClip();
    const source = session.sources!.byId('long1')!;
    const cache = new Luna.Waveforms();
    const reads = () => engine.requests.filter((r) => r.verb === 'get' && r.path.includes('/analysis/overview/file/data')).length;

    const first = await cache.range(source, 0, Luna.OVERVIEW_PAIR_NS * 100);
    const after = reads();
    expect(first.count).toBe(100);
    expect(first.complete).toBe(true);
    expect(cache.size).toBe(1);

    const second = await cache.range(source, 0, Luna.OVERVIEW_PAIR_NS * 50);
    expect(reads()).toBe(after); // page 0 was already held
    expect(second.count).toBe(50);
    expect(Array.from(second.channels[0]!.min)).toEqual(Array.from(first.channels[0]!.min.slice(0, 50)));
    await luna.close();
  });

  it('does not cache a short page, so a growing recording is re-read', async () => {
    const { session, luna } = await sessionWithClip();
    const source = session.sources!.byId('src1')!;
    const cache = new Luna.Waveforms();
    // 768 pairs total, so page 0 comes back short of WAVEFORM_PAGE.
    const range = await cache.range(source, 0, Luna.OVERVIEW_PAIR_NS * 2000);
    expect(range.count).toBe(768);
    expect(range.complete).toBe(false);
    expect(cache.size).toBe(0);
    await luna.close();
  });

  it('drops one source or everything on invalidate', async () => {
    const { session, luna } = await sessionWithClip();
    const cache = new Luna.Waveforms();
    await cache.range(session.sources!.byId('long1')!, 0, Luna.OVERVIEW_PAIR_NS * 100);
    expect(cache.size).toBe(1);
    cache.invalidate('nobody');
    expect(cache.size).toBe(1);
    cache.invalidate('long1');
    expect(cache.size).toBe(0);
    await luna.close();
  });

  it('answers an empty range without reading the analysis at all', async () => {
    const { session, engine, luna } = await sessionWithClip();
    const overviewReads = (): number => engine.requests.filter((r) => r.path.includes('/analysis/')).length;
    const before = overviewReads();
    const range = await new Luna.Waveforms().range(session.sources!.byId('src1')!, 500, 500);
    expect(range.count).toBe(0);
    expect(range.complete).toBe(true);
    expect(overviewReads()).toBe(before);
    await luna.close();
  });
});

/** A hand-built range: one channel per array of [min, max] pairs. */
function fakeRange(...channels: [number, number][][]): Luna.WaveformRange {
  return {
    kind: 'fine',
    pairNs: 10,
    index: 0,
    count: channels[0]?.length ?? 0,
    channels: channels.map((pairs) => ({ min: Float32Array.from(pairs.map((p) => p[0])), max: Float32Array.from(pairs.map((p) => p[1])) })),
    complete: true,
  };
}

describe('waveformColumns', () => {
  it('keeps every channel of a stereo range separate, never folded', () => {
    const range = fakeRange(
      [[-0.5, 0.5], [-0.25, 0.25]],
      [[-0.125, 0.125], [-0.75, 0.75]],
    );
    const cols = Luna.waveformColumns(range, 2, (i) => i * 10);
    expect(cols.width).toBe(2);
    expect(cols.channels).toHaveLength(2);
    expect(Array.from(cols.channels[0]!.max)).toEqual([0.5, 0.25]);
    expect(Array.from(cols.channels[1]!.max)).toEqual([0.125, 0.75]);
    expect(Array.from(cols.channels[1]!.min)).toEqual([-0.125, -0.75]);
  });

  it('keeps the loudest pair when a column covers several', () => {
    const range = fakeRange([[-0.25, 0.25], [-0.5, 0.125], [0, 0.75], [-0.125, 0.125]]);
    // Two pairs per column.
    const cols = Luna.waveformColumns(range, 2, (i) => i * 20);
    expect(Array.from(cols.channels[0]!.min)).toEqual([-0.5, -0.125]);
    expect(Array.from(cols.channels[0]!.max)).toEqual([0.25, 0.75]);
  });

  it('interpolates between pairs when zoomed in past one pair per column, as LUNA does', () => {
    const range = fakeRange([[-0.25, 0.25], [-0.5, 0.5], [-0.125, 0.125]]);
    // Four columns per pair, offset so pair 0 ends in column 2 and pair 1 in column 6.
    const cols = Luna.waveformColumns(range, 8, (i) => (i + 1) * 2.5);
    const max = Array.from(cols.channels[0]!.max);
    expect(max[2]).toBe(0.25);
    expect(max[6]).toBe(0.5);
    // Columns 3-5 ramp from column 2 to column 6 instead of holding a step.
    expect(max.slice(3, 6)).toEqual([0.3125, 0.375, 0.4375]);
    // Columns 0-1 come before any pair ends: they start from the pair under their edge.
    expect(max.slice(0, 2)).toEqual([0.25, 0.25]);
    // Column 7 runs off the view: it heads for the pair under its own edge (pair 2).
    expect(max[7]).toBe(0.3125);
  });

  it('keeps every column touching the zero line', () => {
    // A pair entirely above zero still draws down to the axis, and one below up to it.
    const cols = Luna.waveformColumns(fakeRange([[0.25, 0.5], [-0.5, -0.25]]), 2, (i) => i * 10);
    expect(Array.from(cols.channels[0]!.min)).toEqual([0, -0.5]);
    expect(Array.from(cols.channels[0]!.max)).toEqual([0.5, 0]);
  });

  it('leaves columns outside the range as NaN, not silence', () => {
    const range = { ...fakeRange([[-0.5, 0.5], [-0.25, 0.25]]), index: 5 };
    // Columns start one pair before the range (pair 4) and run one past it (pair 7).
    const cols = Luna.waveformColumns(range, 4, (i) => (4 + i) * 10);
    const max = Array.from(cols.channels[0]!.max);
    expect(Number.isNaN(max[0])).toBe(true);
    expect(max.slice(1, 3)).toEqual([0.5, 0.25]);
    expect(Number.isNaN(max[3])).toBe(true);
  });

  it('draws nothing for an empty range or a non-finite offset, and rejects a bad width', () => {
    expect(Luna.waveformColumns(fakeRange(), 3, (i) => i).channels).toHaveLength(0);
    const cols = Luna.waveformColumns(fakeRange([[-0.5, 0.5]]), 2, (i) => (i === 0 ? Number.NaN : 0));
    expect(Number.isNaN(cols.channels[0]!.max[0])).toBe(true);
    expect(() => Luna.waveformColumns(fakeRange(), -1, (i) => i)).toThrow(/width/);
    expect(() => Luna.waveformColumns(fakeRange(), 1.5, (i) => i)).toThrow(/width/);
  });

  it('draws both channels of a stereo source read through the cache and a clip', async () => {
    const { session, clip, luna } = await sessionWithClip();
    const audio = Luna.clipAudio(clip, session.sources!)!;
    const range = await new Luna.Waveforms().range(audio.source, audio.startNs, audio.stopNs, 'coarse');
    const timeline = session.musical.timeline;
    // The clip spans four beats; draw it 40 columns wide.
    const cols = Luna.waveformColumns(range, 40, (i) => Luna.audioNsAtTick(timeline, clip, audio, (i / 40) * 4 * BEAT));
    expect(cols.channels).toHaveLength(2);
    for (const ch of cols.channels) {
      for (let i = 0; i < cols.width; i++) {
        expect(Number.isNaN(ch.max[i]!)).toBe(false);
        expect(ch.min[i]!).toBeLessThanOrEqual(ch.max[i]!);
      }
    }
    await luna.close();
  });
});

describe('waveform gain', () => {
  const quiet = () => fakeRange([[-0.25, 0.125], [-0.0625, 0.25]]);

  it('draws linear values unchanged by default', () => {
    const cols = Luna.waveformColumns(quiet(), 2, (i) => i * 10);
    expect(Array.from(cols.channels[0]!.min)).toEqual([-0.25, -0.0625]);
    expect(Array.from(cols.channels[0]!.max)).toEqual([0.125, 0.25]);
  });

  it('multiplies by gain, clipping at full scale, and normalizes with waveformPeak', () => {
    const range = quiet();
    expect(Luna.waveformPeak(range)).toBe(0.25);
    const cols = Luna.waveformColumns(range, 2, (i) => i * 10, { gain: 1 / Luna.waveformPeak(range) });
    expect(Array.from(cols.channels[0]!.min)).toEqual([-1, -0.25]);
    expect(Array.from(cols.channels[0]!.max)).toEqual([0.5, 1]);
    const hot = Luna.waveformColumns(range, 2, (i) => i * 10, { gain: 8 });
    expect(Array.from(hot.channels[0]!.max)).toEqual([1, 1]);
  });

  it('keeps NaN columns NaN whatever the gain', () => {
    const range = { ...fakeRange([[-0.5, 0.5]]), index: 1 };
    const cols = Luna.waveformColumns(range, 2, (i) => i * 10, { gain: 2 });
    expect(Number.isNaN(cols.channels[0]!.max[0])).toBe(true);
    expect(cols.channels[0]!.max[1]).toBe(1);
  });

  it('reports a zero peak for an empty range and rejects a bad gain', () => {
    expect(Luna.waveformPeak(fakeRange())).toBe(0);
    const nsAt = (i: number) => i * 10;
    expect(() => Luna.waveformColumns(quiet(), 2, nsAt, { gain: 0 })).toThrow(/gain/);
    expect(() => Luna.waveformColumns(quiet(), 2, nsAt, { gain: Number.POSITIVE_INFINITY })).toThrow(/gain/);
  });
});

describe('traceWaveform', () => {
  /** Records path calls as [op, x, y] so the traced outline can be read back. */
  const recorder = () => {
    const ops: (string | number)[][] = [];
    return {
      ops,
      moveTo: (x: number, y: number) => ops.push(['M', x, y]),
      lineTo: (x: number, y: number) => ops.push(['L', x, y]),
      closePath: () => ops.push(['Z']),
    };
  };
  const channel = (pairs: [number, number][]) => ({ min: Float32Array.from(pairs.map((p) => p[0])), max: Float32Array.from(pairs.map((p) => p[1])) });

  it('traces one closed shape through column centres, top then bottom, offset from the axis', () => {
    const path = recorder();
    Luna.traceWaveform(path, channel([[-0.5, 0.5], [-0.25, 1]]), { mid: 50, half: 20 }, 10);
    expect(path.ops).toEqual([
      ['M', 10, 39.5],
      ['L', 10.5, 39.5], ['L', 11.5, 29.5],   // top: mid - 0.5 - max * half
      ['L', 12, 29.5], ['L', 12, 55.5],        // squared off at the right edge
      ['L', 11.5, 55.5], ['L', 10.5, 60.5],    // bottom: mid + 0.5 - min * half, right to left
      ['L', 10, 60.5],
      ['Z'],
    ]);
  });

  it('draws silence as a thin axis line and breaks the shape at NaN columns', () => {
    const path = recorder();
    Luna.traceWaveform(path, channel([[0, 0], [Number.NaN, Number.NaN], [0, 0]]), { mid: 10, half: 5 }, 0, { columnWidth: 0.5 });
    expect(path.ops.filter((op) => op[0] === 'M')).toEqual([['M', 0, 9.5], ['M', 1, 9.5]]);
    expect(path.ops.filter((op) => op[0] === 'Z')).toHaveLength(2);
    const ys = new Set(path.ops.filter((op) => op[0] === 'L').map((op) => op[2]));
    expect(ys).toEqual(new Set([9.5, 10.5]));
    expect(() => Luna.traceWaveform(path, channel([]), { mid: 0, half: 1 }, 0, { columnWidth: 0 })).toThrow(/columnWidth/);
  });
});

describe('waveformLanes', () => {
  it('stacks one lane per channel in file order', () => {
    const [left, right] = Luna.waveformLanes(2, 20, 80, 0);
    expect(left).toEqual({ mid: 40, half: 20 });
    expect(right).toEqual({ mid: 80, half: 20 });
  });

  it('keeps a gap clear inside every lane, and never a negative height', () => {
    expect(Luna.waveformLanes(1, 0, 10)[0]).toEqual({ mid: 5, half: 4 });
    expect(Luna.waveformLanes(1, 0, 1, 5)[0]!.half).toBe(0);
    expect(Luna.waveformLanes(0, 0, 10)).toEqual([]);
    expect(() => Luna.waveformLanes(-1, 0, 10)).toThrow(/channels/);
  });
});
