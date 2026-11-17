#!/usr/bin/env node
// Engine lane: boots the real wasm engine in headless Chrome and runs tests/engine/index.html.
//
//   npm run test:engine                       # auto-detects Chrome and an engine build
//   UA_WASM_ENGINE=<dir> npm run test:engine  # engine build dir holding luna-engine.js
//   UA_CHROME=<path> npm run test:engine      # browser binary
//
// No Playwright: Chrome is driven over its DevTools protocol with Node's WebSocket.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const candidates = [
    process.env.UA_CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  return candidates.find((c) => existsSync(c));
}

function findEngine() {
  const candidates = [process.env.UA_WASM_ENGINE, resolve(root, '../../../../hbsystem/wasm_engine/dist/Release'), resolve(root, '../../../../hbsystem/wasm_engine/dist/Debug')].filter(Boolean);
  for (const c of candidates) {
    if (existsSync(join(c, 'luna-engine.js'))) return c;
    if (existsSync(join(c, 'Release', 'luna-engine.js'))) return join(c, 'Release');
  }
  return undefined;
}

const chrome = findChrome();
const engine = findEngine();
if (!chrome || !engine) {
  console.log(`engine lane skipped: ${!chrome ? 'no Chrome found (set UA_CHROME)' : ''} ${!engine ? 'no wasm engine build found (set UA_WASM_ENGINE)' : ''}`.trim());
  process.exit(0);
}
if (!existsSync(join(root, 'dist', 'cli.js')) || !existsSync(join(root, 'dist', 'luna.global.js'))) {
  console.error('build first: npm run build');
  process.exit(1);
}

const httpPort = 8793;
const cdpPort = 9335;
const server = spawn(process.execPath, [join(root, 'dist', 'cli.js'), 'serve', join(root, 'tests', 'engine'), '--port', String(httpPort), '--engine', engine], { stdio: 'ignore' });
const profile = mkdtempSync(join(tmpdir(), 'ua-engine-lane-'));
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--autoplay-policy=no-user-gesture-required', `--user-data-dir=${profile}`, `--remote-debugging-port=${cdpPort}`, 'about:blank'], { stdio: 'ignore' });
const cleanup = () => {
  server.kill();
  browser.kill();
};
process.on('exit', cleanup);

try {
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      break;
    } catch {
      await sleep(500);
    }
  }
  await sleep(500);
  const tab = await (await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent(`http://127.0.0.1:${httpPort}/index.html`)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    } else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.exception?.description ?? 'exception');
  };
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  await send('Runtime.enable');
  const evalJson = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value;

  const started = Date.now();
  const timeoutMs = Number(process.env.UA_ENGINE_TIMEOUT_MS ?? 180_000);
  while (Date.now() - started < timeoutMs) {
    if (await evalJson('!!globalThis.__done')) break;
    await sleep(1000);
  }
  const results = JSON.parse((await evalJson('JSON.stringify(globalThis.__results || [])')) ?? '[]');
  const done = await evalJson('!!globalThis.__done');
  ws.close();

  let failed = 0;
  for (const r of results) {
    console.log(`${r.ok ? '  ok ' : ' FAIL'} ${r.name}${r.detail ? '  ' + r.detail : ''}`);
    if (!r.ok) failed++;
  }
  if (!done) {
    console.log(` FAIL timed out after ${timeoutMs} ms (${results.length} steps completed)`);
    failed++;
  }
  for (const e of errors) console.log(' page error:', String(e).slice(0, 200));
  console.log(`\nengine lane: ${results.length - failed} passed, ${failed} failed  (${Math.round((Date.now() - started) / 1000)} s, engine ${engine})`);
  process.exit(failed ? 1 : 0);
} finally {
  cleanup();
}
