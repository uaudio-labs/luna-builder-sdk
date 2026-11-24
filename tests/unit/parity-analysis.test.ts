/**
 * Jobs followed to the end (facts 200-202), chord detection (203), lyric transcription (204)
 * and per-source analysis results (205-207), against the mock's model of deviced.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const BAR = Luna.WHOLE_NOTE;
const SECOND_NS = 1e9;

async function sessionWithClip() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vox', 'Gtr'], name: 'Demo', packageUid: 'pkg1' });
  engine.addSource('pkg1', 'src1', { name: 'vox.wav', lengthNs: 3 * SECOND_NS });
  engine.addSource('pkg1', 'src2', { name: 'gtr.wav', lengthNs: 2 * SECOND_NS });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  await session.insertClip({ trackUid: 'Vox', sourceUid: 'src1', startTick: 0, stopTick: 2 * BAR, sourceStartNs: 0, sourceStopNs: 3 * SECOND_NS });
  await session.insertClip({ trackUid: 'Gtr', sourceUid: 'src2', startTick: 0, stopTick: BAR, sourceStartNs: 0, sourceStopNs: 2 * SECOND_NS });
  await engine.settled();
  const clipOn = async (track: string) => {
    const playlist = session.playlistFor(session.tracks.byId(track)!)!;
    await playlist.clips.load();
    return playlist.clips.items[0]!;
  };
  const vox = await clipOn('Vox');
  const gtr = await clipOn('Gtr');
  await session.musical.ready();
  await session.lyrics.load();
  return { engine, luna, session, vox, gtr };
}

/** Wait on a condition a macrotask at a time; mock jobs move one turn per step. */
async function until(cond: () => boolean): Promise<void> {
  for (let i = 0; i < 200 && !cond(); i++) await new Promise((r) => setTimeout(r, 0));
  expect(cond()).toBe(true);
}

const posted = (engine: Luna.MockEngine, command: string) => engine.requests.filter((r) => r.verb === 'post' && r.path.endsWith(`/${command}`));

describe('chord detection as a job (facts 200, 201, 203)', () => {
  it('posts extract_chords on the main context and resolves once the chords are on the ruler', async () => {
    const { engine, session, vox } = await sessionWithClip();
    const seen: number[] = [];
    const run = session.musical.chords.detect({ clip: vox });
    run.progress.onChange(() => seen.push(run.progress.value ?? 0));
    const result = await run;
    expect(posted(engine, 'extract_chords')[0]).toMatchObject({ path: '/sessions/abc/contexts/main/commands/extract_chords', data: { session_uid: 'abc', clip_uid: vox.uid.value ?? vox.id } });
    expect(result).toMatchObject({ status: 'completed', jobType: 'chord_extraction', sessionUid: 'abc', targetUid: 'Vox', empty: false });
    expect(run.uid).toBe(result.uid);
    expect(seen).toContain(0.4);
    expect(run.progress.value).toBe(1);
    // LUNA removed the job in the same turn it ended, but the run latched the ending.
    expect(engine.has(`/jobs/${result.uid}`)).toBe(false);
    await expect(run.done()).resolves.toMatchObject({ uid: result.uid, status: 'completed' });
    await session.musical.chords.membersReady();
    expect(session.musical.chords.sorted.map((c) => [c.location.value, c.name.value])).toEqual([
      [0, 'C'],
      [BAR, 'G'],
    ]);
  });

  it('takes the job on its own track, not a concurrent one of the same type', async () => {
    const { engine, session, vox } = await sessionWithClip();
    engine.planNextJob({ outcome: 'failed', error: 'job.internal' });
    const run = session.musical.chords.detect({ clip: vox });
    // Another chord job for the same session, on another track, started at the same time.
    const decoy = engine.startJob({ sessionUid: 'abc', jobType: 'chord_extraction', targetUid: 'Gtr' });
    const result = await run;
    expect(result.uid).not.toBe(decoy);
    expect(result.targetUid).toBe('Vox');
  });

  it('never takes a job that was already running before the launch', async () => {
    const { engine, luna, session } = await sessionWithClip();
    engine.planNextJob({ hold: true });
    const w = luna.jobs.watch();
    await w.ready;
    const old = engine.startJob({ sessionUid: 'abc', jobType: 'chord_extraction' });
    await until(() => luna.jobs.byId(old) !== undefined);
    engine.setValue('/sessions/abc/contexts/main', 'selection_playlists', [session.playlistFor(session.tracks.byId('Vox')!)!.id]);
    await engine.settled();
    const result = await session.musical.chords.detect();
    expect(result.uid).not.toBe(old);
    expect(result.status).toBe('completed');
    engine.finishJob(old);
    w.release();
  });

  it('does not take the job of an earlier launch still running on the same track', async () => {
    const { engine, session, vox } = await sessionWithClip();
    engine.planNextJob({ hold: true });
    const first = session.musical.chords.detect({ clip: vox });
    await until(() => first.snapshot.value?.status === 'running');
    const second = await session.musical.chords.detect({ clip: vox });
    expect(second.uid).not.toBe(first.uid);
    engine.finishJob(first.uid!);
    await expect(first).resolves.toMatchObject({ uid: first.uid, status: 'completed' });
  });

  it('resolves with empty: true when LUNA found nothing (job.no_result)', async () => {
    const { engine, session, vox } = await sessionWithClip();
    engine.planNextJob({ outcome: 'empty' });
    const result = await session.musical.chords.detect({ clip: vox });
    expect(result).toMatchObject({ status: 'failed', error: 'job.no_result', empty: true });
  });

  it('rejects with the job error when it fails, and with the launch error when refused', async () => {
    const { engine, session, vox } = await sessionWithClip();
    engine.planNextJob({ outcome: 'failed', error: 'job.provider_unreachable' });
    await expect(session.musical.chords.detect({ clip: vox })).rejects.toMatchObject({ code: 'job.provider_unreachable' });
    await expect(session.musical.chords.detect({ clip: 'no-such-clip' })).rejects.toMatchObject({ code: 'device.no_selection' });
  });

  it('cancels a running job, which then ends canceled', async () => {
    const { engine, session, vox } = await sessionWithClip();
    engine.planNextJob({ hold: true });
    const run = session.musical.chords.detect({ clip: vox });
    await expect(run.cancel()).rejects.toMatchObject({ code: 'unavailable' });
    await until(() => run.snapshot.value?.status === 'running');
    await run.cancel();
    await expect(run).rejects.toMatchObject({ code: 'canceled' });
  });

  it('follows a job LUNA adds and removes in one turn, before its properties can be read (fact 202)', async () => {
    const { engine, session, vox } = await sessionWithClip();
    engine.planNextJob({ outcome: 'instant' });
    const result = await session.musical.chords.detect({ clip: vox });
    expect(result.status).toBe('completed');
  });

  it('gives up with no_effect when no job starts', async () => {
    const { engine, session, vox } = await sessionWithClip();
    // A command that answers but starts nothing.
    engine.addNode('/sessions/abc/contexts/main/commands', { commands: { extract_chords: () => null } });
    await expect(session.musical.chords.detect({ clip: vox, startTimeoutMs: 30 })).rejects.toMatchObject({ code: 'no_effect' });
  });

  it('rejects with timeout, the code every SDK wait uses, when a started job outlasts timeoutMs', async () => {
    const { engine, session, vox } = await sessionWithClip();
    engine.planNextJob({ hold: true });
    await expect(session.musical.chords.detect({ clip: vox, timeoutMs: 50 })).rejects.toMatchObject({ code: 'timeout' });
  });
});

describe('Job.done() (fact 200)', () => {
  it('resolves on completion and answers again after LUNA removed the node', async () => {
    const { engine, luna } = await sessionWithClip();
    const w = luna.jobs.watch();
    await w.ready;
    engine.planNextJob({ hold: true });
    const uid = engine.startJob({ sessionUid: 'abc', jobType: 'lyric_transcription' });
    await until(() => luna.jobs.byId(uid)?.jobType.value === 'lyric_transcription');
    const job = luna.jobs.byId(uid)!;
    const done = job.done();
    engine.finishJob(uid);
    await expect(done).resolves.toMatchObject({ uid, status: 'completed', empty: false });
    expect(engine.has(`/jobs/${uid}`)).toBe(false);
    await expect(job.done()).resolves.toMatchObject({ uid, status: 'completed' });
    w.release();
  });

  it('rejects with the error code, and with removed when the job vanishes without an ending', async () => {
    const { engine, luna } = await sessionWithClip();
    const w = luna.jobs.watch();
    await w.ready;
    engine.planNextJob({ outcome: 'failed', error: 'job.upload_failed', hold: true });
    const failing = engine.startJob({ sessionUid: 'abc', jobType: 'lyric_transcription' });
    engine.planNextJob({ hold: true });
    const abandoned = engine.startJob({ sessionUid: 'abc', jobType: 'chord_extraction' });
    await until(() => luna.jobs.byId(failing)?.status.value === 'running' && luna.jobs.byId(abandoned)?.status.value === 'running');
    const a = luna.jobs.byId(failing)!.done();
    const b = luna.jobs.byId(abandoned)!.done();
    engine.finishJob(failing);
    // Its session closed: LUNA drops the job without a terminal status.
    engine.removeNode(`/jobs/${abandoned}`);
    await expect(a).rejects.toMatchObject({ code: 'job.upload_failed' });
    await expect(b).rejects.toMatchObject({ code: 'removed' });
    w.release();
  });

  it('rejects with timeout when the job outlasts the wait', async () => {
    const { engine, luna } = await sessionWithClip();
    const w = luna.jobs.watch();
    await w.ready;
    engine.planNextJob({ hold: true });
    const uid = engine.startJob({ sessionUid: 'abc', jobType: 'chord_extraction' });
    await until(() => luna.jobs.byId(uid)?.status.value === 'running');
    await expect(luna.jobs.byId(uid)!.done(50)).rejects.toMatchObject({ code: 'timeout' });
    w.release();
  });
});

describe('lyric transcription (facts 152, 204)', () => {
  it('posts extract_lyrics and the transcribed lines land in session.lyrics, in ns into the source', async () => {
    const { engine, session, vox } = await sessionWithClip();
    const result = await session.lyrics.transcribe({ clip: vox, provider: 'audioshake' });
    expect(posted(engine, 'extract_lyrics')[0]?.data).toEqual({ session_uid: 'abc', provider: 'audioshake', clip_uid: vox.uid.value ?? vox.id });
    expect(result).toMatchObject({ jobType: 'lyric_transcription', targetUid: 'Vox', status: 'completed' });
    await session.lyrics.membersReady();
    const lines = session.lyrics.sorted.filter((l) => l.transcribed);
    expect(lines.map((l) => [l.sourceUid.value, l.location.value, l.text.value])).toEqual([
      ['src1', 0, 'line 1'],
      ['src1', SECOND_NS, 'line 2'],
      ['src1', 2 * SECOND_NS, 'line 3'],
    ]);
    expect(session.lyrics.items.some((l) => !l.transcribed)).toBe(false);
  });

  it('adds ruler lines in ticks with addToRuler', async () => {
    const { engine, session, vox } = await sessionWithClip();
    await session.lyrics.transcribe({ clip: vox, addToRuler: true });
    expect(posted(engine, 'extract_lyrics')[0]?.data).toMatchObject({ add_to_session: true });
    await session.lyrics.membersReady();
    expect(session.lyrics.sorted.filter((l) => !l.transcribed).map((l) => l.location.value)).toEqual([0, 2 * Luna.QUARTER_NOTE, 4 * Luna.QUARTER_NOTE]);
  });

  it('fails the job with job.provider_unavailable for an unknown provider', async () => {
    const { session, vox } = await sessionWithClip();
    await expect(session.lyrics.transcribe({ clip: vox, provider: 'nobody' })).rejects.toMatchObject({ code: 'job.provider_unavailable' });
  });

  it('reads the providers from /lyric_transcription', async () => {
    const { session } = await sessionWithClip();
    await expect(session.lyrics.providers()).resolves.toEqual({ available: true, providers: ['music_ai', 'audioshake'], defaultProvider: 'music_ai' });
  });
});

describe('per-source analysis (facts 205-207)', () => {
  it('reads key, tempo, instrument, transients and chord in their LUNA shapes', async () => {
    const { engine, session } = await sessionWithClip();
    engine.addAnalysis('pkg1', 'src1', 'key', { version: 1, index: 0, count: 2, data: { keyData: [{ key: 'A minor', confidence: 0.7 }, { key: 'C major', confidence: 0.2 }] } });
    engine.addAnalysis('pkg1', 'src1', 'tempo', { version: 1, version_minor: 2, count: 1, data: { tempoData: [{ bpm: 121.5, tickPerBeat: 960, clamped: 0, beats: [1, 2] }], timeUnit_s: 1e-9, sampleRate: 48000, tempoIsConstant: 1 } });
    engine.addAnalysis('pkg1', 'src1', 'instrument', { version: 1, version_minor: 2, instrument: 'vocals', confidence: 0.9, classes: ['drums', 'vocals'], classIDIndex: 1 });
    engine.addAnalysis('pkg1', 'src1', 'transients', { version: 1, version_minor: 3, data: { location: [10, 20, 30, 40], level: [0.1, 0.2, 0.3, 0.4], timeUnit_s: 1e-9, sampleRate: 48000 } });
    engine.addAnalysis('pkg1', 'src1', 'chord', { version: 1, count: 2, key: 'C major', data: [{ chord_complex_pop: 'C (I)', start: 0.01, end: 1.8 }, { chord_complex_pop: 'N', start: 1.8, end: 2 }] });
    await engine.settled();
    await session.sources!.load();
    const a = session.sources!.byId('src1')!.analysis;
    expect((await a.key.read())?.candidates).toEqual([{ key: 'A minor', confidence: 0.7 }, { key: 'C major', confidence: 0.2 }]);
    expect(await a.tempo.read()).toMatchObject({ candidates: [{ bpm: 121.5, ticksPerBeat: 960, clamped: false }], timeUnitS: 1e-9, sampleRate: 48000, tempoIsConstant: true });
    expect(await a.instrument.read()).toMatchObject({ instrument: 'vocals', confidence: 0.9, classes: ['drums', 'vocals'], classIdIndex: 1 });
    expect(await a.transients.read({ index: 1, count: 2 })).toMatchObject({ index: 1, count: 2, locations: [20, 30], levels: [0.2, 0.3], timeUnitS: 1e-9 });
    expect((await a.transients.read())?.locations).toEqual([10, 20, 30, 40]);
    expect(await a.chord.read()).toMatchObject({ key: 'C major', segments: [{ name: 'C (I)', start: 0.01, end: 1.8 }, { name: 'N', start: 1.8, end: 2 }] });
    await a.load();
    expect(a.kinds.value).toEqual(expect.arrayContaining(['overview', 'overview_coarse', 'key', 'tempo', 'instrument', 'transients', 'chord']));
    expect(a.transients.count.value).toBe(4);
    // A source with no tempo analysis answers undefined, not an error.
    expect(await session.sources!.byId('src2')!.analysis.tempo.read()).toBeUndefined();
  });

  it('asks LUNA for the whole result, since a read without a count answers nothing', async () => {
    const { engine, session } = await sessionWithClip();
    engine.addAnalysis('pkg1', 'src1', 'key', { data: { keyData: [{ key: 'D major', confidence: 1 }] } });
    await engine.settled();
    await session.sources!.load();
    await session.sources!.byId('src1')!.analysis.key.read();
    expect(engine.requests.filter((r) => r.verb === 'get' && r.path.includes('/analysis/key/file/data')).map((r) => r.path)).toEqual([expect.stringMatching(/^\/workspace\/sessions\/pkg1\/audio\/src1\/analysis\/key\/file\/data\?count=-1(&|$)/)]);
    await expect(session.sources!.byId('src1')!.analysis.key.readRaw({ count: 0 })).rejects.toMatchObject({ code: 'out_of_range' });
  });

  it('follows count and md5 as watched props, and overviewInfo still reads them', async () => {
    const { engine, luna, session } = await sessionWithClip();
    await session.sources!.load();
    const src = session.sources!.byId('src1')!;
    const w = src.analysis.watch();
    await w.ready;
    const overview = src.analysis.overview;
    const first = overview.count.value;
    expect(first).toBe(Math.floor((3 * SECOND_NS) / Luna.OVERVIEW_PAIR_NS));
    let changes = 0;
    overview.count.onChange(() => changes++);
    engine.setValue(overview.path, 'count', first! + 100);
    engine.setValue(overview.path, 'md5', 'new-digest');
    await engine.settled();
    await luna.settled();
    expect(overview.count.value).toBe(first! + 100);
    expect(overview.md5.value).toBe('new-digest');
    expect(changes).toBeGreaterThan(0);
    await expect(src.overviewInfo()).resolves.toEqual({ count: first! + 100, md5: 'new-digest' });
    // A new analysis appears in kinds while watched.
    engine.addAnalysis('pkg1', 'src1', 'instrument', { instrument: 'vocals', confidence: 1 });
    await engine.settled();
    expect(src.analysis.kinds.value).toContain('instrument');
    w.release();
  });

  it('writes the chord analysis next to the ruler chords when detecting', async () => {
    const { session, vox } = await sessionWithClip();
    await session.musical.chords.detect({ clip: vox });
    await session.sources!.load();
    expect((await session.sources!.byId('src1')!.analysis.chord.read())?.segments.map((s) => s.name)).toEqual(['C', 'G']);
  });
});
