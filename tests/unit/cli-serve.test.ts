/** `ua-builder serve`: port handling, and which file a request path is answered with. */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { listenWithFallback, servedFile, type ServeMounts } from '../../cli/serve';

const open: ReturnType<typeof createServer>[] = [];
const listening = (server: ReturnType<typeof createServer>, port: number): Promise<void> => new Promise((r) => server.listen(port, '127.0.0.1', () => r()));

afterEach(async () => {
  await Promise.all(open.splice(0).map((s) => new Promise((r) => s.close(r))));
});

describe('listenWithFallback', () => {
  it('walks to the next free port when the default port is busy', async () => {
    const holder = createServer();
    open.push(holder);
    await listening(holder, 0);
    const busy = (holder.address() as AddressInfo).port;

    const server = createServer();
    open.push(server);
    const port = await listenWithFallback(server, busy, '127.0.0.1', false);
    expect(port).toBeGreaterThan(busy);
    expect((server.address() as AddressInfo).port).toBe(port);
  });

  it('never moves an explicit --port: EADDRINUSE surfaces instead', async () => {
    const holder = createServer();
    open.push(holder);
    await listening(holder, 0);
    const busy = (holder.address() as AddressInfo).port;

    const server = createServer();
    open.push(server);
    await expect(listenWithFallback(server, busy, '127.0.0.1', true)).rejects.toMatchObject({ code: 'EADDRINUSE' });
  });
});

describe('servedFile', () => {
  const temps: string[] = [];
  afterEach(() => {
    for (const d of temps.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  /** An Add On, an SDK package and an engine, side by side. */
  function layout(): ServeMounts {
    const t = mkdtempSync(join(tmpdir(), 'ua-serve-'));
    temps.push(t);
    const dir = join(t, 'addon');
    const root = join(t, 'sdk');
    const engineDir = join(t, 'engine');
    for (const d of [join(dir, 'vendor'), join(root, 'dist'), engineDir]) mkdirSync(d, { recursive: true });
    writeFileSync(join(dir, 'index.html'), 'page');
    writeFileSync(join(dir, 'vendor', 'luna.global.js'), 'vendored');
    writeFileSync(join(root, 'dist', 'luna.global.js'), 'sdk');
    writeFileSync(join(engineDir, 'luna-engine.js'), 'engine');
    return { dir, root, engineDir };
  }

  it("serves the Add On's files as they are, including a vendored SDK bundle", () => {
    const m = layout();
    expect(servedFile(m, '/')).toBe(join(m.dir, 'index.html'));
    expect(servedFile(m, '/vendor/luna.global.js')).toBe(join(m.dir, 'vendor', 'luna.global.js'));
    expect(servedFile(m, '/missing.js')).toMatchObject({ status: 404 });
  });

  it('mounts the engine and the SDK package, and refuses a path outside the folder', () => {
    const m = layout();
    expect(servedFile(m, '/__engine/luna-engine.js')).toBe(join(m.engineDir!, 'luna-engine.js'));
    expect(servedFile(m, '/__builder/dist/luna.global.js')).toBe(join(m.root, 'dist', 'luna.global.js'));
    expect(servedFile({ ...m, engineDir: undefined }, '/__engine/luna-engine.js')).toMatchObject({ status: 404 });
    expect(servedFile(m, '/../sdk/dist/luna.global.js')).toMatchObject({ status: 403 });
  });
});
