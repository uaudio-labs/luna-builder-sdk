/**
 * `luna.secrets` over LUNA's native bridge (`lunaAPI.secretsRequest` answered on
 * `lunaHost.secretsResult`, fact 107) and its page-memory fallback outside LUNA.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Luna } from '../../src/index';
import { resetSecretsForTests } from '../../src/client/secrets';

type Request = { id: number; op: string; name: string; value?: string };
type Globals = {
  lunaAPI?: { secretsRequest?: (r: Request) => void; setAcceptsFileDrops?: (a: boolean) => void };
  lunaHost?: Record<string, unknown> & { secretsResult?: (r: unknown) => void };
};
const g = globalThis as Globals;

/** LUNA's side of the bridge: answers asynchronously, as `evaluateJavaScript` does. */
function fakeLuna(options: { refuse?: boolean; fail?: string } = {}) {
  const store = new Map<string, string>();
  const requests: Request[] = [];
  g.lunaAPI = {
    ...g.lunaAPI,
    secretsRequest: (r) => {
      requests.push(r);
      if (options.refuse) return;
      setTimeout(() => {
        if (options.fail) return g.lunaHost?.secretsResult?.({ id: r.id, ok: false, value: null, error: options.fail });
        if (r.op === 'set') store.set(r.name, r.value!);
        if (r.op === 'delete') store.delete(r.name);
        const value = r.op === 'get' ? (store.get(r.name) ?? null) : null;
        g.lunaHost?.secretsResult?.({ id: r.id, ok: true, value });
      }, 0);
    },
  };
  return { store, requests };
}

async function client() {
  const engine = new Luna.MockEngine();
  return Luna.connect({ port_: engine.port() });
}

afterEach(() => {
  delete g.lunaAPI;
  delete g.lunaHost;
  resetSecretsForTests();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('luna.secrets inside LUNA', () => {
  it('reports keychain storage when LUNA publishes the bridge', async () => {
    fakeLuna();
    expect((await client()).secrets.storage).toBe('keychain');
  });

  it('stores, reads back and deletes a value through LUNA', async () => {
    const { store } = fakeLuna();
    const luna = await client();
    await luna.secrets.set('openai.api_key', 'sk-123');
    expect(store.get('openai.api_key')).toBe('sk-123');
    expect(await luna.secrets.get('openai.api_key')).toBe('sk-123');
    await luna.secrets.delete('openai.api_key');
    expect(await luna.secrets.get('openai.api_key')).toBeNull();
  });

  it('answers null for a name that was never stored', async () => {
    fakeLuna();
    expect(await (await client()).secrets.get('missing')).toBeNull();
  });

  it('matches answers to requests by id when several are in flight', async () => {
    const { store } = fakeLuna();
    store.set('a', '1');
    store.set('b', '2');
    const luna = await client();
    expect(await Promise.all([luna.secrets.get('a'), luna.secrets.get('b')])).toEqual(['1', '2']);
  });

  it("rejects with LUNA's error code", async () => {
    fakeLuna({ fail: 'store_error' });
    await expect((await client()).secrets.get('k')).rejects.toMatchObject({ code: 'store_error' });
  });

  it('times out when LUNA does not answer, as for a page outside the Add On', async () => {
    fakeLuna({ refuse: true });
    const luna = await client();
    vi.useFakeTimers();
    const read = luna.secrets.get('k');
    const settled = expect(read).rejects.toBeInstanceOf(Luna.RequestTimeout);
    await vi.advanceTimersByTimeAsync(30_000);
    await settled;
  });

  it('keeps answering after Luna.onPathDrop uninstalls and restores lunaHost', async () => {
    g.lunaAPI = { setAcceptsFileDrops: () => {} };
    fakeLuna();
    const luna = await client();
    await luna.secrets.set('k', 'v');
    const stop = Luna.onPathDrop(() => {});
    stop();
    expect(await luna.secrets.get('k')).toBe('v');
  });
});

describe('luna.secrets validation', () => {
  it('refuses a name with characters outside A-Z a-z 0-9 . _ - without asking LUNA', async () => {
    const { requests } = fakeLuna();
    const luna = await client();
    expect(() => luna.secrets.get('my key')).toThrow(expect.objectContaining({ code: 'invalid_name' }));
    expect(requests).toHaveLength(0);
  });

  it('refuses an empty name and one over 128 characters', async () => {
    const luna = await client();
    expect(() => luna.secrets.get('')).toThrow(expect.objectContaining({ code: 'invalid_name' }));
    expect(() => luna.secrets.get('x'.repeat(Luna.MAX_SECRET_NAME_LENGTH + 1))).toThrow(expect.objectContaining({ code: 'invalid_name' }));
  });

  it('refuses a value over 2560 UTF-8 bytes', async () => {
    const luna = await client();
    await expect(luna.secrets.set('k', 'é'.repeat(Luna.MAX_SECRET_BYTES / 2 + 1))).rejects.toMatchObject({ code: 'too_large' });
  });
});

describe('luna.secrets outside LUNA', () => {
  it('reports memory storage', async () => {
    expect((await client()).secrets.storage).toBe('memory');
  });

  it('keeps values in page memory', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const luna = await client();
    await luna.secrets.set('k', 'v');
    expect(await luna.secrets.get('k')).toBe('v');
    await luna.secrets.delete('k');
    expect(await luna.secrets.get('k')).toBeNull();
  });

  it('warns once that values do not outlive the page', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const luna = await client();
    await luna.secrets.set('a', '1');
    await luna.secrets.set('b', '2');
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
