/**
 * `ua-builder probe <url>`: open a page in headless Chrome, wait until it is ready (by
 * default, until a `Luna.connect` on the page has settled), evaluate an expression against
 * the live DOM, and print the result as JSON on stdout.
 *
 * Turns "the page must follow" checks into one scriptable command: change LUNA from a second
 * client, then probe the page and assert on what it renders. Status goes to stderr, so stdout
 * stays parseable.
 *
 *   ua-builder probe http://localhost:8790/ --expr "document.querySelector('#status').textContent"
 *   ua-builder probe http://localhost:8790/ --settle 0   # skip the DOM-quiet settle phase
 *   ua-builder probe http://localhost:8790/ --wait "!!globalThis.ready" --expr "ready.state"
 *   ua-builder probe http://localhost:8790/ --mock               # no LUNA: the demo mock session
 *   ua-builder probe http://localhost:8790/ --mock fixture.js    # no LUNA: fixture.js sets LunaMockSetup
 *   ua-builder probe http://localhost:8790/ --screenshot page.png
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { flagNumber, flagString, type Args } from './util';

/**
 * The default readiness check: a page that made a `Luna` client is ready once one is
 * connected AND its focused session has finished loading (`session.ready()` — the scaffold
 * binds its DOM only after that), with "no session open" counting as ready, since a bound
 * page legitimately shows that. A page that never touches `Luna` is ready when it has loaded.
 * A `--wait <js>` replaces all of this; the DOM-quiet settle phase (`--settle`) runs either way.
 */
export const DEFAULT_WAIT = `(async () => {
  if (typeof Luna === 'undefined') return true;
  if (typeof Luna.clients !== 'function') return 'no-clients-hook';
  const client = Luna.clients().find((c) => c.connected);
  if (!client) return false;
  try {
    const session = await client.session();
    await session.ready();
  } catch {
    /* no session open: the page is as bound as it will get */
  }
  await client.settled();
  return true;
})()`;

/**
 * Evaluated before any wait: the tab starts on its initial blank document, where every
 * DOM-based condition is trivially and wrongly true. Nothing runs until the real page has
 * committed and loaded — by then a script-tag SDK page has defined `Luna`, so the default
 * wait's branches are decided on the actual page.
 */
export const LOADED_GATE = "location.href !== 'about:blank' && document.readyState === 'complete'";

/** The default probe: what a user would see. */
export const DEFAULT_EXPR = 'document.body.innerText';

/**
 * Evaluated before a screenshot: two animation frames, so a canvas the page draws from an
 * `onChange` or a `requestAnimationFrame` loop has painted. Without it the capture can land
 * before the first paint and come out blank.
 */
export const PAINTED = 'new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))';

/**
 * The page URL a `--mock` probe opens: `?engine=mock` added, so a page that calls a bare
 * `Luna.connect()` gets an in-memory engine instead of looking for LUNA.
 */
export function mockUrl(url: string): string {
  const u = new URL(url);
  u.searchParams.set('engine', 'mock');
  return u.toString();
}

export async function probe(args: Args): Promise<number> {
  const url = args.positional[0];
  if (!url) {
    console.error('usage: ua-builder probe <url> [--expr <js>] [--wait <js>] [--settle <ms>] [--timeout <ms>] [--mock [setup.js]] [--screenshot <file.png>] [--chrome <path>]');
    return 2;
  }
  const mock = args.flags['mock'];
  const mockSetup = typeof mock === 'string' ? mock : undefined;
  if (mockSetup !== undefined && !existsSync(mockSetup)) {
    console.error(`probe: no mock setup file ${mockSetup} (it should assign globalThis.LunaMockSetup = (engine) => { ... })`);
    return 2;
  }
  const screenshot = flagString(args, 'screenshot');
  if (args.flags['screenshot'] === true) {
    console.error('probe: --screenshot needs a file name, for example --screenshot page.png');
    return 2;
  }
  const target = mock ? mockUrl(url) : url;
  const expr = flagString(args, 'expr') ?? DEFAULT_EXPR;
  const wait = flagString(args, 'wait') ?? DEFAULT_WAIT;
  const timeoutMs = flagNumber(args, 'timeout', 20_000);
  const chrome = flagString(args, 'chrome') ?? findChrome();
  if (!chrome) {
    console.error('no Chrome found: pass --chrome <path> or set UA_CHROME');
    return 1;
  }

  const profile = mkdtempSync(join(tmpdir(), 'ua-probe-'));
  // Port 0 avoids collisions; Chrome writes the chosen port to DevToolsActivePort.
  const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--autoplay-policy=no-user-gesture-required', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: 'ignore' });
  try {
    const cdpPort = await devtoolsPort(profile, timeoutMs);
    // Open blank and navigate once connected, so a mock setup can be installed before any page script runs.
    const tab = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/new?about:blank`, { method: 'PUT' })).json()) as { webSocketDebuggerUrl: string };
    const page = await openPage(tab.webSocketDebuggerUrl);
    try {
      await page.send('Page.enable');
      if (mockSetup !== undefined) await page.send('Page.addScriptToEvaluateOnNewDocument', { source: readFileSync(mockSetup, 'utf8') });
      await page.send('Page.navigate', { url: target });
      const started = Date.now();
      const timedOut = async (condition: string): Promise<number> => {
        console.error(`probe: timed out after ${timeoutMs} ms waiting for: ${condition}`);
        console.error(`page shows: ${JSON.stringify(await page.evalJson('document.body.innerText'))}`);
        for (const e of page.errors) console.error('page error:', String(e).slice(0, 300));
        return 1;
      };
      // First the navigation gate: on the tab's initial blank document every wait passes wrongly.
      // Both timeouts are `return await`: a bare `return timedOut(...)` would run the finally
      // (which closes the CDP socket) before the diagnostic reads the page.
      while (!(await page.evalJson(LOADED_GATE))) {
        if (Date.now() - started >= timeoutMs) return await timedOut(`the page to load (${LOADED_GATE})`);
        await sleep(100);
      }
      for (;;) {
        const verdict = await page.evalJson(wait);
        if (verdict === 'no-clients-hook') {
          console.error("probe: this page's vendored SDK predates Luna.clients(), so the probe cannot wait for its connection — refresh the bundle (ua-builder pack) or pass --wait <js>; reading after the settle period only");
          break;
        }
        if (verdict) break;
        if (Date.now() - started >= timeoutMs) return await timedOut(wait === DEFAULT_WAIT ? 'a connected Luna client with its session ready (the default wait; --wait <js> overrides)' : wait);
        await sleep(100);
      }
      // The wait says the data is there; the page may still be a render behind. Read until the
      // DOM holds still for one quiet period, bounded so a page that animates forever (a
      // playing transport clock) is read as it is rather than stalling the probe.
      const settleMs = flagNumber(args, 'settle', 250);
      if (settleMs > 0) {
        const settleDeadline = Date.now() + Math.min(3000, Math.max(0, timeoutMs - (Date.now() - started)));
        let last: unknown;
        for (;;) {
          const dom = await page.evalJson('document.body.innerHTML');
          if (dom === last || Date.now() >= settleDeadline) break;
          last = dom;
          await sleep(settleMs);
        }
      }
      if (screenshot !== undefined) {
        await page.evaluate(PAINTED);
        const shot = (await page.send('Page.captureScreenshot', { format: 'png' })) as { result?: { data?: string } };
        if (!shot.result?.data) {
          console.error('probe: Chrome returned no screenshot');
          return 1;
        }
        writeFileSync(screenshot, Buffer.from(shot.result.data, 'base64'));
        console.error(`probe: wrote ${screenshot}`);
      }
      const result = await page.evaluate(expr);
      if (result.exceptionDetails) {
        console.error(`probe: expression threw: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
        return 1;
      }
      console.log(JSON.stringify(result.result?.value, null, 2));
      for (const e of page.errors) console.error('page error:', String(e).slice(0, 300));
      return 0;
    } finally {
      page.close();
    }
  } finally {
    // Wait for Chrome to exit before removing its profile: it writes during shutdown.
    const exited = new Promise((r) => browser.once('exit', r));
    browser.kill();
    await Promise.race([exited, sleep(3000)]);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* a still-locked temp profile is not worth failing the probe over */
    }
  }
}

/** Shared with tests/engine/run.mjs by convention; a probe has no reason to differ. */
function findChrome(): string | undefined {
  const candidates = [
    process.env['UA_CHROME'],
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].filter((c): c is string => typeof c === 'string' && c.length > 0);
  return candidates.find((c) => existsSync(c));
}

async function devtoolsPort(profile: string, timeoutMs: number): Promise<number> {
  const file = join(profile, 'DevToolsActivePort');
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (existsSync(file)) {
      const port = Number(readFileSync(file, 'utf8').split('\n')[0]);
      if (Number.isFinite(port) && port > 0) return port;
    }
    await sleep(100);
  }
  throw new Error('probe: Chrome did not open its DevTools port');
}

interface EvalResult {
  result?: { value?: unknown; description?: string };
  exceptionDetails?: { text?: string; exception?: { description?: string } };
}

interface Page {
  send(method: string, params?: object): Promise<{ result?: unknown }>;
  evaluate(expr: string): Promise<EvalResult>;
  evalJson(expr: string): Promise<unknown>;
  readonly errors: string[];
  close(): void;
}

/** One CDP session on one tab: `Runtime.evaluate` with promises awaited and errors collected. */
async function openPage(wsUrl: string): Promise<Page> {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map<number, (m: { result?: unknown }) => void>();
  const errors: string[] = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(String(e.data)) as { id?: number; method?: string; result?: EvalResult; params?: { exceptionDetails?: { exception?: { description?: string } } } };
    if (m.id !== undefined && pending.has(m.id)) {
      pending.get(m.id)!(m);
      pending.delete(m.id);
    } else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params?.exceptionDetails?.exception?.description ?? 'exception');
  };
  const send = (method: string, params: object = {}): Promise<{ result?: unknown }> =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  await send('Runtime.enable');
  const evaluate = async (expr: string): Promise<EvalResult> => ((await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result ?? {}) as EvalResult;
  return {
    send,
    evaluate,
    evalJson: async (expr) => (await evaluate(expr)).result?.value,
    errors,
    close: () => ws.close(),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
