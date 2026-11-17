import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { connect, createServer as createTcpServer } from 'node:net';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { flagNumber, flagString, packageRoot, type Args } from './util';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.mid': 'audio/midi',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
};

/**
 * Static server with the headers the wasm engine needs (COOP/COEP for SharedArrayBuffer).
 * Mounts:
 *   /                 the Add On folder (default: cwd)
 *   /__builder/       the SDK package (dist, examples, docs)
 *   /__engine/        a wasm engine build (--engine <dir>, or UA_WASM_ENGINE, or auto-detected
 *                     from a sibling hbsystem/wasm_engine/dist/Release in the tree)
 */
export async function serve(args: Args): Promise<number> {
  const dir = resolve(args.positional[0] ?? process.cwd());
  const wantedPort = flagNumber(args, 'port', 8790);
  const portExplicit = args.flags['port'] !== undefined;
  const host = flagString(args, 'host') ?? (args.flags['luna'] ? '0.0.0.0' : '127.0.0.1');
  const root = packageRoot();
  const engineDir = resolveEngineDir(flagString(args, 'engine'));

  const server = createHttpServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://x');
    let pathname = decodeURIComponent(url.pathname);
    let base = dir;
    if (pathname.startsWith('/__builder/')) {
      base = root;
      pathname = pathname.slice('/__builder'.length);
    } else if (pathname.startsWith('/__engine/')) {
      if (!engineDir) return send(res, 404, 'no wasm engine mounted; pass --engine <dir> or set UA_WASM_ENGINE');
      base = engineDir;
      pathname = pathname.slice('/__engine'.length);
    }
    const file = safeJoin(base, pathname);
    if (!file) return send(res, 403, 'forbidden');
    let target = file;
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target) || statSync(target).isDirectory()) return send(res, 404, `not found: ${pathname}`);
    res.writeHead(200, {
      'Content-Type': MIME[extname(target).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    createReadStream(target).pipe(res);
  });

  let port: number;
  try {
    port = await listenWithFallback(server, wantedPort, host, portExplicit);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EADDRINUSE') throw err;
    console.error(`port ${wantedPort} is already in use — a stale 'ua-builder serve' from another session?`);
    console.error(`find it with: lsof -i :${wantedPort}   (or pick another with --port <n>)`);
    return 1;
  }
  if (port !== wantedPort) console.error(`port ${wantedPort} is busy (a stale 'ua-builder serve'?); using ${port} instead`);

  const lines = [`Serving ${dir}`, `  http://localhost:${port}/`];
  if (engineDir) lines.push(`  http://localhost:${port}/__engine/luna-engine.js   (wasm engine from ${engineDir})`);
  if (args.flags['luna']) {
    const forwardPort = flagNumber(args, 'forward-port', 4719);
    const lunaPort = flagNumber(args, 'luna-port', 4718);
    const proxy = createTcpServer((socket) => {
      const upstream = connect(lunaPort, '127.0.0.1');
      socket.pipe(upstream).pipe(socket);
      const drop = () => {
        socket.destroy();
        upstream.destroy();
      };
      socket.on('error', drop);
      upstream.on('error', drop);
    });
    await new Promise<void>((r) => proxy.listen(forwardPort, '0.0.0.0', () => r()));
    const ip = lanAddress();
    lines.push(`  Forwarding 0.0.0.0:${forwardPort} -> 127.0.0.1:${lunaPort} (LUNA)`);
    lines.push(`  From another device: http://${ip}:${port}/?host=${ip}&port=${forwardPort}`);
  }
  lines.push('', 'Ctrl-C to stop.');
  console.log(lines.join('\n'));
  await new Promise(() => undefined);
  return 0;
}

/**
 * Listen on `port`, and when it is taken and the port was not asked for explicitly, walk up
 * to twenty ports until one is free (a stale serve from another session is common). An
 * explicit `--port` never silently moves: EADDRINUSE is rethrown for a clear message.
 */
export async function listenWithFallback(server: ReturnType<typeof createHttpServer>, port: number, host: string, explicit: boolean): Promise<number> {
  const tries = explicit ? 1 : 20;
  for (let i = 0; ; i++) {
    try {
      await new Promise<void>((resolveListen, reject) => {
        const onError = (err: Error) => reject(err);
        server.once('error', onError);
        server.listen(port + i, host, () => {
          server.removeListener('error', onError);
          resolveListen();
        });
      });
      return port + i;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EADDRINUSE' || i + 1 >= tries) throw err;
    }
  }
}

function safeJoin(base: string, pathname: string): string | undefined {
  const full = normalize(join(base, pathname));
  const baseNorm = normalize(base + sep);
  return full === normalize(base) || full.startsWith(baseNorm) ? full : undefined;
}

function send(res: ServerResponse<IncomingMessage>, code: number, text: string): void {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

function lanAddress(): string {
  for (const list of Object.values(networkInterfaces())) {
    for (const i of list ?? []) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return 'localhost';
}

/** Where a wasm engine build lives: flag, env, one shipped in the SDK, or a sibling tree checkout. */
export function resolveEngineDir(flag: string | undefined): string | undefined {
  const candidates = [flag, process.env['UA_WASM_ENGINE']].filter((x): x is string => typeof x === 'string' && x.length > 0);
  const root = packageRoot();
  candidates.push(join(root, 'engine'));
  // builder lives at <tree>/packages/sdk/luna/builder/sdk; the engine at <tree>/packages/hbsystem/wasm_engine/dist
  for (const rel of ['../../../../hbsystem/wasm_engine/dist/Release', '../../../../hbsystem/wasm_engine/dist/Debug']) candidates.push(resolve(root, rel));
  for (const c of candidates) {
    const dir = resolve(c);
    if (existsSync(join(dir, 'luna-engine.js'))) return dir;
    if (existsSync(join(dir, 'Release', 'luna-engine.js'))) return join(dir, 'Release');
  }
  return undefined;
}
