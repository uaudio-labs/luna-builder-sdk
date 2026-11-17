/**
 * Where am I running? LUNA opens an Add On page with `?port=<engine port>` (and optionally
 * `?host=`) appended to the URL. That is the only signal an Add On gets, so it is the switch
 * between "inside LUNA" and "a plain web page".
 */
import { DEFAULT_LUNA_PORT } from '../wire/websocket-port';
import type { AddOnTarget } from '../model/gui';
import type { Engine } from './client';

export interface LocationOptions {
  host?: string;
  port?: number;
  /** `?engine=mock` asks for an in-memory {@link MockEngine}; `?engine=luna` for LUNA. */
  engine?: Engine;
  /** @hidden */
  engineUrl?: string;
}

function search(): string | undefined {
  const loc = (globalThis as { location?: { search?: string } }).location;
  return typeof loc?.search === 'string' ? loc.search : undefined;
}

/** The engine the page itself names in `<meta name="luna-engine" content="...">`, if any. */
function pageEngine(): Engine | undefined {
  type Doc = { querySelector?: (selector: string) => { getAttribute(name: string): string | null } | null };
  const doc = (globalThis as { document?: Doc }).document;
  const engine = doc?.querySelector?.('meta[name="luna-engine"]')?.getAttribute('content');
  return engine === 'wasm' || engine === 'luna' || engine === 'mock' ? engine : undefined;
}

/** `host` and `port` from the page URL, if present. */
export function locationOptions(): LocationOptions {
  const out: LocationOptions = {};
  // `ua-builder eject-wasm` marks its pages with a meta tag: a hosted page gets no `?engine=`.
  // The URL still wins, and LUNA opening the page (`?port=`) always means LUNA.
  const s = search();
  const params = new URLSearchParams(s ?? '');
  if (!params.has('engine') && !params.has('port')) {
    const engine = pageEngine();
    if (engine) out.engine = engine;
  }
  if (!s) return out;
  const host = params.get('host');
  const port = params.get('port');
  if (host) out.host = host;
  if (port && Number.isFinite(Number(port))) out.port = Number(port);
  const engine = params.get('engine');
  if (engine === 'wasm' || engine === 'luna' || engine === 'mock') out.engine = engine;
  const engineUrl = params.get('engine_url');
  if (engineUrl) out.engineUrl = engineUrl;
  return out;
}

/**
 * The host LUNA loaded this Add On page in, from the `?target=` it puts on the page URL (fact 144):
 * `'window'`, `'browser'`, `'editor'` or `'app'`. `undefined` outside LUNA and on a LUNA older
 * than the parameter. Synchronous, so a page that lists several manifest `targets` can lay
 * itself out for its host before it connects. LUNA reloads the page when the user moves it to
 * another host, so it never changes while the page runs.
 *
 * @example
 * document.body.classList.add(`host-${Luna.addOnTarget() ?? 'window'}`);
 */
export function addOnTarget(): AddOnTarget | undefined {
  const target = new URLSearchParams(search() ?? '').get('target');
  return target === 'window' || target === 'browser' || target === 'editor' || target === 'app' ? target : undefined;
}

/** True when the page was opened by LUNA (a `?port=` is on the URL). */
export function isEmbeddedInLuna(): boolean {
  return locationOptions().port !== undefined;
}

/** True when the page is talking to LUNA's own engine on its default port. */
export function isLunaEnginePort(port: number | undefined): boolean {
  return port === DEFAULT_LUNA_PORT;
}

/** True when LUNA's native webview bridge is present. */
export function hasNativeBridge(): boolean {
  const w = globalThis as { lunaAPI?: { setAcceptsFileDrops?: unknown } };
  return typeof w.lunaAPI?.setAcceptsFileDrops === 'function';
}
