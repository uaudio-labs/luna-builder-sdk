/**
 * Request encoding and reply decoding for the WebSocket transport.
 *
 * Requests are the text form `<verb> <path>[?params][ <payload>]`. Replies are JSON objects.
 * This is what LUNA's own GUI (uanet-core `TextMessageFormat`) and the shipping LUNA SDK send,
 * so it is the proven framing; the length-prefixed `JSON` dialect from
 * `hbsystem/networking/docs/wire-format.md` is not used over WebSocket (EVIDENCE fact 3).
 */
import type { Verb, WireMessage } from './port';

/** Append query parameters to a path that may already carry some. */
export function appendParams(path: string, params: Record<string, string> | undefined): string {
  if (!params) return path;
  const entries = Object.entries(params);
  if (entries.length === 0) return path;
  const query = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return path + (path.includes('?') ? '&' : '?') + query;
}

/**
 * A number that must reach the engine as a JSON float literal. Some fields are parsed by
 * token type: a breakpoint `value` written as `-6` is stored as 0, while `-6.0` is stored as
 * -6 (fact 79). `JSON.stringify` writes every whole number without a fraction, so wrap the
 * value and the codec writes `-6.0`.
 *
 * @example
 * await luna.raw.post(`${session.path}/insert_bp`, { session_uid, control_uid, values: [{ location: 0, value: Luna.float(-6) }] });
 */
export class FloatLiteral {
  constructor(readonly value: number) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`Luna.float: ${String(value)} is not a finite number`);
  }

  /** The literal as it goes on the wire: always with a fraction or an exponent. */
  toLiteral(): string {
    const text = String(this.value);
    return /[.eE]/.test(text) ? text : `${text}.0`;
  }

  toJSON(): number {
    return this.value;
  }
}

/** Wrap `value` so it is sent as a float literal. See {@link FloatLiteral}. */
export function float(value: number | FloatLiteral): FloatLiteral {
  return value instanceof FloatLiteral ? value : new FloatLiteral(value);
}

let floatNonce = 0;

/**
 * Encode a payload the way the engine parses it: JSON for everything. Strings are quoted so the
 * engine can tell `"1234"` from `1234` (the ambiguity the deprecated String dialect suffers from).
 * {@link FloatLiteral}s are written as float literals.
 */
export function encodePayload(data: unknown): string {
  if (data === undefined) return '';
  let floats = false;
  // A per-call marker that no caller string can contain, swapped for the bare literal after.
  const marker = `\u0001float${++floatNonce}:`;
  const text = JSON.stringify(data, function (this: Record<string, unknown>, key: string, value: unknown) {
    const original = this[key];
    if (original instanceof FloatLiteral) {
      floats = true;
      return marker + original.toLiteral();
    }
    return value;
  });
  if (!floats) return text;
  const quoted = JSON.stringify(marker).slice(1, -1);
  return text.replace(new RegExp(`"${quoted.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')}([^"]*)"`, 'g'), '$1');
}

/**
 * Build one request line.
 *
 * @example
 * encodeRequest('get', '/sessions', { flatvalue: '1', ua_id: 'r1' })
 * // 'get /sessions?flatvalue=1&ua_id=r1'
 * encodeRequest('post', '/sessions/abc/new_track', undefined, { name: 'Vocal' })
 * // 'post /sessions/abc/new_track {"name":"Vocal"}'
 */
export function encodeRequest(verb: Verb, path: string, params?: Record<string, string>, data?: unknown): string {
  const payload = encodePayload(data);
  return `${verb} ${appendParams(path, params)}${payload ? ' ' + payload : ''}`;
}

const JSON_MAGIC = 'JSON';

/**
 * Decode one frame. Tolerates an 8-byte `JSON` header (magic + length) and a trailing NUL, and
 * returns `undefined` for anything unparseable so the receive loop survives a bad frame.
 */
export function decodeMessage(text: string): WireMessage | undefined {
  let body = text;
  if (body.startsWith(JSON_MAGIC)) body = body.slice(8);
  const nul = body.indexOf('\0');
  if (nul >= 0) body = body.slice(0, nul);
  body = body.trim();
  if (body.length === 0) return undefined;
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return undefined;
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const record = raw as Record<string, unknown>;
  const path = typeof record['path'] === 'string' ? record['path'] : typeof record['url'] === 'string' ? record['url'] : undefined;
  if (path === undefined) return undefined;
  const message: WireMessage = { path };
  if ('data' in record) message.data = record['data'];
  if (record['operation'] === 'added' || record['operation'] === 'removed') message.operation = record['operation'];
  if (record['parameters'] !== null && typeof record['parameters'] === 'object') {
    message.parameters = record['parameters'] as Record<string, unknown>;
  }
  if (typeof record['error'] === 'string') message.error = record['error'];
  if (typeof record['cmd'] === 'string') message.cmd = record['cmd'];
  return message;
}

/** The correlation id the engine echoed back, if this message answers one of our requests. */
export function correlationId(message: WireMessage, key: string): string | undefined {
  const value = message.parameters?.[key];
  return value === undefined || value === null ? undefined : String(value);
}
