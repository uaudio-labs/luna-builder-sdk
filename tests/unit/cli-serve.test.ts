/** `ua-builder serve` port handling: a busy default port walks forward, an explicit one fails clearly. */
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { listenWithFallback } from '../../cli/serve';

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
