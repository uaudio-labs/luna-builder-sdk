/**
 * Loads an example page in jsdom, against `Luna.MockEngine`, and runs its own inline script.
 *
 * The pages are the SDK's most-read documentation, so they are worth executing rather than
 * only reading. Three things are arranged for them:
 *
 *   - the `<script src>` that pulls in the script-tag bundle is dropped, and `window.Luna` is
 *     set to the real namespace with `connect()` routed to the mock engine;
 *   - `getContext('2d')` is stubbed with a recording fake, because jsdom ships no canvas.
 *     A test can assert a page actually drew something;
 *   - `waitFor` polls the DOM, since a page settles across several engine round trips.
 *
 * The SDK itself runs in the Node realm here, so its scheduler takes the macrotask path
 * rather than requestAnimationFrame — deliberate, because that is deterministic.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { Luna } from '../../src/index';

/** Every 2D call a page makes, in order, so a test can prove it painted. */
export interface DrawLog {
  calls: string[];
  /** The same calls with their arguments, for a test that checks where something was drawn. */
  ops: { name: string; args: unknown[]; fillStyle?: unknown; strokeStyle?: unknown }[];
  clear(): void;
}

const CONTEXT_METHODS = [
  'clearRect', 'fillRect', 'strokeRect', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc',
  'rect', 'fill', 'stroke', 'fillText', 'strokeText', 'save', 'restore', 'translate', 'scale',
  'rotate', 'setTransform', 'setLineDash', 'createLinearGradient', 'drawImage', 'measureText',
  'quadraticCurveTo', 'bezierCurveTo', 'ellipse', 'clip', 'putImageData', 'getImageData',
] as const;

function fakeContext(log: DrawLog): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};
  for (const name of CONTEXT_METHODS) {
    ctx[name] = (...args: unknown[]) => {
      log.calls.push(name);
      log.ops.push({ name, args, fillStyle: ctx['fillStyle'], strokeStyle: ctx['strokeStyle'] });
      if (name === 'measureText') return { width: String(args[0] ?? '').length * 6 };
      if (name === 'createLinearGradient') return { addColorStop: () => undefined };
      if (name === 'getImageData') return { data: new Uint8ClampedArray(4) };
      return undefined;
    };
  }
  return ctx;
}

export interface LoadedPage {
  dom: JSDOM;
  document: Document;
  window: Window & typeof globalThis;
  draws: DrawLog;
  /** Resolves when `predicate` holds, or throws naming what it was waiting for. */
  waitFor(predicate: () => boolean, what: string, timeoutMs?: number): Promise<void>;
  text(selector: string): string;
  all(selector: string): Element[];
  close(): void;
}

export interface LoadOptions {
  /** Query string for the page, for example `?all=1`. */
  search?: string;
  /** Extra globals to expose on the page's window. */
  globals?: Record<string, unknown>;
}

/**
 * @example
 * const engine = new Luna.MockEngine();
 * engine.addSession('abc', { tracks: ['Vocal'] });
 * const page = await loadExamplePage('mixer.html', engine);
 * await page.waitFor(() => page.all('.strip').length > 0, 'strips');
 */
export async function loadExamplePage(name: string, engine: Luna.MockEngine, options: LoadOptions = {}): Promise<LoadedPage> {
  // From the package root, not import.meta.url: under the jsdom environment that is not
  // a usable base for a relative URL.
  const path = resolve(process.cwd(), 'examples', name);
  const html = readFileSync(path, 'utf8');
  // Drop the bundle's script tag; `window.Luna` stands in for it.
  const stripped = html.replace(/<script\s+src="[^"]*"\s*>\s*<\/script>/g, '');
  const inline = [...stripped.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1] ?? '');
  const body = stripped.replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g, '');

  const dom = new JSDOM(body, {
    url: `http://localhost/examples/${name}${options.search ?? ''}`,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const window = dom.window as unknown as Window & typeof globalThis;
  const draws: DrawLog = { calls: [], ops: [], clear: () => { draws.calls.length = 0; draws.ops.length = 0; } };
  // jsdom has no canvas; a recording fake keeps drawing pages alive and assertable.
  (window as unknown as { HTMLCanvasElement: { prototype: Record<string, unknown> } }).HTMLCanvasElement.prototype['getContext'] = () => fakeContext(draws);

  // Every client the page opens, closed with the page so no push or pending edit reaches a torn-down document.
  const clients: Luna.Client[] = [];
  // The SDK lives in the Node realm, so its default keyboard target would be the test
  // environment's window rather than this page's; point it at the page.
  const ua = {
    ...Luna,
    connect: async (opts: Luna.ConnectOptions = {}) => {
      const client = await Luna.connect({ ...opts, port_: engine.port() });
      clients.push(client);
      return client;
    },
    bindShortcuts: (client: Luna.Client, opts: Parameters<typeof Luna.bindShortcuts>[1] = {}) => Luna.bindShortcuts(client, { target: window, ...opts }),
  };
  Object.assign(window as unknown as Record<string, unknown>, { Luna: ua }, options.globals ?? {});

  const failures: unknown[] = [];
  window.addEventListener('error', (e) => failures.push((e as ErrorEvent).error ?? e));
  window.addEventListener('unhandledrejection', (e) => failures.push((e as PromiseRejectionEvent).reason));

  for (const script of inline) window.eval(script);

  const page: LoadedPage = {
    dom,
    document: window.document,
    window,
    draws,
    async waitFor(predicate, what, timeoutMs = 4000) {
      const deadline = Date.now() + timeoutMs;
      while (!predicate()) {
        if (failures.length) throw failures[0];
        if (Date.now() > deadline) throw new Error(`timed out waiting for ${what} in ${name}`);
        await new Promise((r) => setTimeout(r, 5));
      }
      if (failures.length) throw failures[0];
    },
    text: (selector) => window.document.querySelector(selector)?.textContent?.trim() ?? '',
    all: (selector) => Array.from(window.document.querySelectorAll(selector)),
    close: () => {
      for (const client of clients) void client.close();
      // Let the page's handlers see the disconnect and finish before the document goes: an edit
      // still waiting for the model notices on its next refresh (about 120 ms) and reports it.
      setTimeout(() => dom.window.close(), 500);
    },
  };
  return page;
}
