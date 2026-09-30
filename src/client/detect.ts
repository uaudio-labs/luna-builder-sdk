/**
 * Where am I running? LUNA opens an Add On page with `?port=<engine port>` (and optionally
 * `?host=`) appended to the URL. That is the only signal an Add On gets, so it is the switch
 * between "inside LUNA" and "a plain web page".
 */
import { DEFAULT_LUNA_PORT } from '../wire/websocket-port';

export interface LocationOptions {
  host?: string;
  port?: number;
  /** `?engine=wasm` asks for the in-page engine; `?engine=mock` for an in-memory {@link MockEngine}. */
  engine?: 'wasm' | 'luna' | 'mock';
  /** `?engine_url=/path/` overrides where the wasm engine is loaded from. */
  engineUrl?: string;
}

function search(): string | undefined {
  const loc = (globalThis as { location?: { search?: string } }).location;
  return typeof loc?.search === 'string' ? loc.search : undefined;
}

/** `host` and `port` from the page URL, if present. */
export function locationOptions(): LocationOptions {
  const s = search();
  if (!s) return {};
  const params = new URLSearchParams(s);
  const out: LocationOptions = {};
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
