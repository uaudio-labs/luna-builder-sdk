import type { SocketLike } from '../../src/wire/websocket-port';

/**
 * Stands in for a browser WebSocket so tests see exactly what the port sends and can feed it
 * replies. Pass `FakeSocket` as `options.WebSocket`.
 */
export class FakeSocket implements SocketLike {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  static instances: FakeSocket[] = [];

  readyState = FakeSocket.CONNECTING;
  readonly sent: string[] = [];
  onopen: ((ev: unknown) => void) | null = null;
  onclose: ((ev: unknown) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;

  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }

  static reset(): void {
    FakeSocket.instances = [];
  }

  static get latest(): FakeSocket {
    const s = FakeSocket.instances[FakeSocket.instances.length - 1];
    if (!s) throw new Error('no FakeSocket constructed');
    return s;
  }

  send(data: string): void {
    if (this.readyState !== FakeSocket.OPEN) throw new Error('send on non-open socket');
    this.sent.push(data);
  }

  close(): void {
    if (this.readyState === FakeSocket.CLOSED) return;
    this.readyState = FakeSocket.CLOSED;
    this.onclose?.({});
  }

  // ---- test controls ----

  /** Server accepted the connection. */
  open(): void {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.({});
  }

  /** Server went away. */
  drop(): void {
    this.readyState = FakeSocket.CLOSED;
    this.onclose?.({});
  }

  /** Connection refused the way Node 22's built-in WebSocket reports it: `error`, no `close`, still CONNECTING. */
  refuse(): void {
    this.onerror?.({});
  }

  /** Deliver a JSON message from the server. */
  receive(message: unknown): void {
    this.onmessage?.({ data: typeof message === 'string' ? message : JSON.stringify(message) });
  }

  /** The correlation id on the most recent request starting with `prefix`. */
  idFor(prefix: string): string {
    for (let i = this.sent.length - 1; i >= 0; i--) {
      const line = this.sent[i]!;
      const match = /ua_id=(r\d+)/.exec(line);
      if (line.startsWith(prefix) && match) return match[1]!;
    }
    throw new Error(`no request starting with '${prefix}' in ${JSON.stringify(this.sent)}`);
  }

  /** Reply to the most recent request starting with `prefix`. */
  reply(prefix: string, message: Record<string, unknown>): void {
    const ua_id = this.idFor(prefix);
    this.receive({ ...message, parameters: { ...(message['parameters'] as object | undefined), ua_id } });
  }
}
