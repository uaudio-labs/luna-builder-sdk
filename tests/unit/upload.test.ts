/**
 * `session.uploadFile`: the chunked `begin`/`transfer`/`end` import a browser file takes
 * to become an audio source (fact 42).
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vocal'], name: 'Demo', packageUid: 'pkg_abc' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  return { engine, luna, session };
}

const bytes = (n: number): Uint8Array => new Uint8Array(n).fill(7);

describe('Luna.Session.uploadFile', () => {
  it('uploads in chunks, reports progress and resolves to the listed source', async () => {
    const { session } = await connected();
    const progress: Array<[number, number]> = [];
    const source = await session.uploadFile({
      bytes: bytes(5000),
      name: 'take.wav',
      chunkBytes: 2048,
      onProgress: (sent, total) => progress.push([sent, total]),
    });
    expect(source.name.value).toBe('take.wav');
    expect(session.sources?.byId(source.id)).toBe(source);
    // 5000 bytes in 2048-byte chunks: three posts, the last one short.
    expect(progress).toEqual([
      [2048, 5000],
      [4096, 5000],
      [5000, 5000],
    ]);
  });

  it('sends every byte', async () => {
    const { engine, session } = await connected();
    const source = await session.uploadFile({ bytes: bytes(3000), name: 'x.wav', chunkBytes: 1024 });
    expect(engine.value(source.path, 'size')).toBe(3000);
    expect(engine.imports.size).toBe(0); // nothing left in flight
  });

  it('clamps the chunk size rather than trusting the caller', async () => {
    const { session } = await connected();
    const progress: number[] = [];
    await session.uploadFile({ bytes: bytes(3000), name: 'y.wav', chunkBytes: 1, onProgress: (sent) => progress.push(sent) });
    expect(progress).toEqual([1024, 2048, 3000]); // 1 was raised to the 1 KiB floor
  });

  it('cancels the import when a transfer fails, leaving nothing behind', async () => {
    const { engine, session } = await connected();
    engine.fail('/workspace/import_file', 'uasrv.invalid_object', 1);
    await expect(session.uploadFile({ bytes: bytes(100), name: 'bad.wav' })).rejects.toBeInstanceOf(Luna.Error);
    expect(engine.imports.size).toBe(0);
    expect(engine.children('/workspace/sessions/pkg_abc/audio')).toEqual([]);
  });

  it('refuses an empty file and a nameless one', async () => {
    const { session } = await connected();
    await expect(session.uploadFile({ bytes: bytes(0), name: 'empty.wav' })).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.uploadFile({ bytes: bytes(10) })).rejects.toMatchObject({ code: 'out_of_range' });
  });

  it('gives the uploaded source to insertClip', async () => {
    const { engine, session } = await connected();
    const source = await session.uploadFile({ bytes: bytes(64), name: 'loop.wav' });
    await session.insertClip({ trackUid: 'Vocal', sourceUid: source.id, startTick: 0, stopTick: Luna.TICKS_PER_BEAT });
    await engine.settled();
    const playlist = session.playlistFor(session.tracks.byId('Vocal')!)!;
    await playlist.clips.load();
    expect(playlist.clips.items[0]?.sourceUid.value).toBe(source.id);
  });

  it('takes the name from a File made in another realm', async () => {
    const { session } = await connected();
    // Not an instance of this realm's Blob, as a File from an iframe or a test DOM is not.
    const foreign = { name: 'other-realm.wav', size: 3, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
    const source = await session.uploadFile({ bytes: foreign as unknown as Blob });
    expect(source.name.value).toBe('other-realm.wav');
  });

  it('resolves an upload of bytes already in the session to that source, as LUNA files them once (fact 42)', async () => {
    const { engine, session } = await connected();
    const first = await session.uploadFile({ bytes: bytes(3000), name: 'take.wav' });
    const again = await session.uploadFile({ bytes: bytes(3000), name: 'take copy.wav', timeoutMs: 1000 });
    expect(again).toBe(first);
    expect(engine.children('/workspace/sessions/pkg_abc/audio')).toHaveLength(1);
    const other = await session.uploadFile({ bytes: new Uint8Array(3000).fill(8), name: 'other.wav' });
    expect(other.id).not.toBe(first.id);
  });
});
