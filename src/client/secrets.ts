/**
 * Secrets: API keys and tokens an Add On needs, kept out of web storage (fact 107).
 *
 * Inside LUNA they go to the OS credential store (the macOS login keychain, Windows
 * Credential Manager), scoped by LUNA to the Add On's `id`: another Add On cannot read them,
 * nor can an iframe or a page the Add On navigates to. Elsewhere (a plain browser,
 * `ua-builder serve`, a LUNA too old to have the store) they live in page memory and are gone
 * on reload; {@link Secrets.storage} says which, and the first write warns on the console.
 */
import { RequestTimeout, UAError } from '../wire/errors';

/** Where {@link Secrets} keeps values: the OS credential store, or page memory. */
export type SecretStorage = 'keychain' | 'memory';

/** Longest secret name, in characters. */
export const MAX_SECRET_NAME_LENGTH = 128;
/** Largest secret value, in UTF-8 bytes (Windows Credential Manager's limit, applied everywhere). */
export const MAX_SECRET_BYTES = 2560;

const NAME = /^[A-Za-z0-9._-]+$/;
const TIMEOUT_MS = 30_000;

interface SecretsRequest {
  id: number;
  op: 'get' | 'set' | 'delete';
  name: string;
  value?: string;
}

interface SecretsResult {
  id?: unknown;
  ok?: unknown;
  value?: unknown;
  error?: unknown;
}

interface BridgeGlobals {
  lunaAPI?: { secretsRequest?: (request: SecretsRequest) => void };
  lunaHost?: { secretsResult?: (result: SecretsResult) => void };
}

interface Pending {
  resolve(value: string | null): void;
  reject(error: Error): void;
  timer: ReturnType<typeof setTimeout>;
}

const pending = new Map<number, Pending>();
const memory = new Map<string, string>();
let nextId = 1;
let warned = false;

/**
 * Per-Add-On secrets, at `luna.secrets`. Values are strings; names are 1 to 128 characters
 * from `A-Z a-z 0-9 . _ -`.
 *
 * Errors are {@link UAError}s with a `code`: `invalid_name`, `too_large`, `store_error` (the
 * OS store refused, for example the user denied keychain access), and `timeout` when LUNA did
 * not answer, which is also what a request from outside the Add On's own page gets.
 *
 * @example
 * let key = await luna.secrets.get('openai.api_key');
 * if (!key) {
 *   key = prompt('OpenAI API key') ?? '';
 *   if (key) await luna.secrets.set('openai.api_key', key);
 * }
 */
export class Secrets {
  /**
   * `'keychain'` inside a LUNA that stores secrets; `'memory'` elsewhere, where values last
   * only until the page reloads. Tell the user when it is `'memory'`.
   *
   * @example
   * if (luna.secrets.storage === 'memory') banner.textContent = 'Keys are kept until you close this page.';
   */
  get storage(): SecretStorage {
    return bridge() ? 'keychain' : 'memory';
  }

  /**
   * The value stored under `name`, or `null` if there is none.
   *
   * @example
   * const key = await luna.secrets.get('openai.api_key');
   */
  get(name: string): Promise<string | null> {
    checkName(name);
    if (!bridge()) return Promise.resolve(memory.get(name) ?? null);
    return request({ op: 'get', name });
  }

  /**
   * Store `value` under `name`, replacing any value already there.
   *
   * @example
   * await luna.secrets.set('openai.api_key', input.value);
   */
  async set(name: string, value: string): Promise<void> {
    checkName(name);
    if (typeof value !== 'string') throw new UAError('invalid_request', 'luna.secrets.set(): value must be a string');
    if (new TextEncoder().encode(value).length > MAX_SECRET_BYTES) {
      throw new UAError('too_large', `luna.secrets.set(): value is over ${MAX_SECRET_BYTES} bytes`);
    }
    if (!bridge()) {
      warnMemory();
      memory.set(name, value);
      return;
    }
    await request({ op: 'set', name, value });
  }

  /**
   * Remove `name`. Removing a name that is not stored succeeds.
   *
   * @example
   * await luna.secrets.delete('openai.api_key');
   */
  async delete(name: string): Promise<void> {
    checkName(name);
    if (!bridge()) {
      memory.delete(name);
      return;
    }
    await request({ op: 'delete', name });
  }
}

function bridge(): ((request: SecretsRequest) => void) | undefined {
  const send = (globalThis as BridgeGlobals).lunaAPI?.secretsRequest;
  return typeof send === 'function' ? send : undefined;
}

function checkName(name: string): void {
  if (typeof name !== 'string' || name.length > MAX_SECRET_NAME_LENGTH || !NAME.test(name)) {
    throw new UAError('invalid_name', `luna.secrets: "${String(name)}" is not a valid name (1-${MAX_SECRET_NAME_LENGTH} of A-Z a-z 0-9 . _ -)`);
  }
}

function warnMemory(): void {
  if (warned) return;
  warned = true;
  console.warn('luna.secrets: no OS credential store here (not inside LUNA, or LUNA is too old); secrets are kept in page memory until reload.');
}

function request(body: Omit<SecretsRequest, 'id'>): Promise<string | null> {
  const send = bridge();
  if (!send) return Promise.reject(new UAError('unsupported', 'luna.secrets: the LUNA bridge went away'));
  listen();
  const id = nextId++;
  return new Promise<string | null>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new RequestTimeout(`secrets.${body.op}`, body.name, TIMEOUT_MS));
    }, TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });
    send({ id, ...body });
  });
}

/**
 * Publish `lunaHost.secretsResult`, which LUNA calls with each answer (fact 107). Set on every
 * request rather than once, because `Luna.onPathDrop` replaces `lunaHost` when it uninstalls.
 */
function listen(): void {
  const g = globalThis as BridgeGlobals;
  g.lunaHost ??= {};
  g.lunaHost.secretsResult = onResult;
}

function onResult(result: SecretsResult): void {
  if (typeof result?.id !== 'number') return;
  const entry = pending.get(result.id);
  if (!entry) return;
  pending.delete(result.id);
  clearTimeout(entry.timer);
  if (result.ok === true) {
    entry.resolve(typeof result.value === 'string' ? result.value : null);
    return;
  }
  const code = typeof result.error === 'string' ? result.error : 'store_error';
  entry.reject(new UAError(code, `luna.secrets: LUNA answered ${code}`));
}

/** @internal Test hook: forget memory secrets, pending requests and the one-time warning. */
export function resetSecretsForTests(): void {
  for (const entry of pending.values()) clearTimeout(entry.timer);
  pending.clear();
  memory.clear();
  warned = false;
}
