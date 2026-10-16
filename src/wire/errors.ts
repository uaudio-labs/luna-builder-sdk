/**
 * Errors thrown by the wire layer and everything above it.
 *
 * Every error carries a machine-readable `code`. For failures reported by the engine
 * the code is the engine's own error string (for example `uasrv.invalid_property`);
 * for failures detected by the SDK it is one of the fixed codes below.
 *
 * @example
 * try {
 *   await luna.raw.set('/sessions/abc/tracks', 1);
 * } catch (e) {
 *   if (e instanceof Luna.Error) console.log(e.code, e.path);
 * }
 */
export class UAError extends Error {
  /** Engine error string or one of the SDK codes. */
  readonly code: string;
  /** Verb of the request that failed, when known. */
  readonly cmd: string | undefined;
  /** Path of the request that failed, when known. */
  readonly path: string | undefined;

  constructor(code: string, message: string, detail: { cmd?: string; path?: string } = {}) {
    super(message);
    this.name = 'UAError';
    this.code = code;
    this.cmd = detail.cmd;
    this.path = detail.path;
  }
}

/** No engine answered at the address. Start LUNA and open a session. */
export class NotRunning extends UAError {
  constructor(url: string) {
    super('not_running', `No LUNA engine at ${url}. Start LUNA and open a session.`);
    this.name = 'NotRunning';
  }
}

/** The engine did not answer a request within the port's timeout. */
export class RequestTimeout extends UAError {
  constructor(cmd: string, path: string, ms: number) {
    super('timeout', `${cmd} ${path} did not answer within ${ms} ms`, { cmd, path });
    this.name = 'RequestTimeout';
  }
}

/** The connection dropped (or was closed) while a request was in flight, or a request was made while disconnected. */
export class ConnectionLost extends UAError {
  constructor(cmd?: string, path?: string) {
    super('disconnected', cmd ? `connection lost during ${cmd} ${path}` : 'connection lost', cmd && path ? { cmd, path } : {});
    this.name = 'ConnectionLost';
  }
}

/** The feature is not available on this engine (for example a headless engine has no `/gui`). */
export class Unsupported extends UAError {
  constructor(what: string) {
    super('unsupported', what);
    this.name = 'Unsupported';
  }
}

/** No session is open in the engine. */
export class NoSessionOpen extends UAError {
  constructor() {
    super('no_session', 'No session is open. Open or create one in LUNA, or call luna.sessions.create().');
    this.name = 'NoSessionOpen';
  }
}

/**
 * The object was disposed: the engine removed its node (a deleted track, a closed session),
 * or its owner was disposed. Its props stop updating and its commands refuse to run, so a
 * stale reference cannot act on whatever takes its place.
 *
 * @example
 * try { await track.name.set('x'); } catch (e) { if (e instanceof Luna.Disposed) refreshView(); }
 */
export class Disposed extends UAError {
  constructor(what: string, path?: string) {
    super('disposed', `${what} was disposed: the engine removed it`, path ? { path } : {});
    this.name = 'Disposed';
  }
}
