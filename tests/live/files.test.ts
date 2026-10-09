/**
 * Live lane for getting files in: `/gui` presence (fact 103), `listFiles` (fact 106) and the
 * path route's `importPath` (fact 42, `local_copy`). Needs LUNA on 4718 with a session open. It writes a
 * quarter-second WAV to the temp folder, imports it as a source and trashes the source again;
 * nothing is placed on the timeline.
 *
 * The File route inside LUNA (picking and dropping a real file) needs a person: see
 * docs/FILES.md, Testing.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';

/** A 16-bit mono sine WAV. */
function wav(seconds = 0.25, rate = 48000): Uint8Array {
  const n = Math.round(seconds * rate);
  const view = new DataView(new ArrayBuffer(44 + n * 2));
  const tag = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  tag(0, 'RIFF'); view.setUint32(4, 36 + n * 2, true); tag(8, 'WAVE'); tag(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); tag(36, 'data'); view.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) view.setInt16(44 + i * 2, Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8000), true);
  return new Uint8Array(view.buffer);
}

// Needs no session: /gui answers with LUNA on its home page.
describe.skipIf(!live)('live: listing a folder', () => {
  let luna: Luna.Client;
  let dir: string;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    dir = mkdtempSync(join(tmpdir(), 'ua-live-list-'));
  });

  afterAll(async () => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    await luna?.close();
  });

  it('fact 106: listFiles lists a folder without hidden entries, in natural order', async () => {
    const folder = join(dir, 'listing');
    mkdirSync(join(folder, 'Sub'), { recursive: true });
    for (const name of ['b.txt', 'A.wav', 'c.aif', '.hidden', 'Ünïcode.txt', 'take10.wav', 'take2.wav']) writeFileSync(join(folder, name), '');
    const entries = await luna.gui.listFiles(folder);
    expect(entries.map((e) => e.name)).toEqual(['Ünïcode.txt', 'A.wav', 'b.txt', 'c.aif', 'Sub', 'take2.wav', 'take10.wav']);
    expect(entries.find((e) => e.name === 'Sub')?.isDirectory).toBe(true);
    expect(entries.find((e) => e.name === 'A.wav')?.path.endsWith('/listing/A.wav')).toBe(true);
    await expect(luna.gui.listFiles(join(folder, 'missing'))).rejects.toMatchObject({ code: 'uasrv.filesystem_error' });
    await expect(luna.gui.listFiles(join(folder, 'b.txt'))).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.listFiles('relative/path')).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
  });
});

describe.skipIf(!live)('live: files', () => {
  let luna: Luna.Client;
  let session: Luna.Session;
  let dir: string;
  const imported: string[] = [];

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    session = await luna.session();
    dir = mkdtempSync(join(tmpdir(), 'ua-live-files-'));
  });

  afterAll(async () => {
    if (imported.length) {
      await luna.raw
        .post('/workspace/delete_audio_files', { session_package_uid: session.sessionPackageUid.value, files: imported, move_to_trash: true })
        .catch(() => undefined);
    }
    rmSync(dir, { recursive: true, force: true });
    await luna?.close();
  });

  it('fact 103: LUNA lists gui among the root children', async () => {
    expect(await luna.gui.available()).toBe(true);
  });

  it('fact 42: importPath copies a file LUNA can read into the session as a listed source', async () => {
    const path = join(dir, 'builder-live-import.wav');
    writeFileSync(path, wav());
    const source = await session.importPath(path);
    imported.push(source.id);
    expect(source.name.value).toContain('builder-live-import');
    expect(source.sampleRate.value).toBe(48000);
    expect(source.length.value).toBe(250_000_000); // nanoseconds
  });

  it('fact 42: uploading the same bytes twice resolves to the one source LUNA filed', async () => {
    const bytes = wav(0.3);
    const first = await session.uploadFile({ bytes, name: 'builder-live-upload.wav' });
    imported.push(first.id);
    const again = await session.uploadFile({ bytes, name: 'builder-live-upload-again.wav', timeoutMs: 5000 });
    expect(again.id).toBe(first.id);
  });

  it('importPath of a missing file rejects rather than hanging', async () => {
    await expect(session.importPath(join(dir, 'no-such-file.wav'), { timeoutMs: 5000 })).rejects.toMatchObject({ code: 'device.database_error' });
  });
});
