/**
 * One context of LUNA's preferences: small JSON values kept on this computer across sessions
 * and launches, under `/preferences/<name>` (fact 232). Reached as
 * `luna.preferences.context(name)`.
 *
 * **Shared and unprotected.** A context is only a name: any Add On, and LUNA itself, can read
 * and write any context, including LUNA's own (`next_gen`, `instrument_type`, ...). Nothing
 * here is private to the Add On that wrote it, unlike `luna.secrets`, which LUNA keeps per
 * installed Add On. Pick a name nobody else will, such as your Add On's reverse-DNS id, and
 * never keep a secret here.
 *
 * For what belongs with a session (it travels with the session file), use `session.storage`.
 *
 * @example
 * const prefs = luna.preferences.context('com.example.my-add-on');
 * await prefs.set('lastTemplate', { uid: template.uid });
 * const last = await prefs.get<{ uid: string }>('lastTemplate');
 */
import type { Client } from '../client/client';
import { UAError } from '../wire/errors';

/** A context or preference name: not empty, no path separators. */
const NAME = /^[^/]+$/;

export class PreferenceContext {
  /** The `/preferences` context the values live in. */
  readonly name: string;
  private readonly initialised = new Set<string>();

  /** @internal */
  constructor(
    private readonly client: Client,
    name: string,
  ) {
    if (typeof name !== 'string' || !NAME.test(name)) {
      throw new UAError('out_of_range', `preferences.context(): "${String(name)}" is not a context name (not empty, no "/")`);
    }
    this.name = name;
  }

  /**
   * The value stored under `key`, or `undefined` when there is none. LUNA reads a context
   * from disk only when a preference in it is initialised (fact 232), so this initialises
   * `key` first; an existing value is kept.
   *
   * @example
   * const last = await prefs.get<string>('lastPreset');
   */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    await this.init(key);
    const node = (await this.client.raw.get(`/preferences/${this.name}`, { properties: true })) as { properties?: Record<string, { value?: unknown }> } | null;
    const value = node?.properties?.[key]?.value;
    return (value ?? undefined) as T | undefined;
  }

  /**
   * Store `value` (any JSON) under `key`. LUNA writes it to disk at once (fact 232). Store
   * `null` to clear it; LUNA has no way to remove a preference.
   *
   * @example
   * await prefs.set('lastPreset', preset.uid);
   */
  async set(key: string, value: unknown): Promise<void> {
    await this.init(key);
    await this.client.raw.set(`/preferences/${this.name}/${key}`, value === undefined ? null : value);
  }

  private async init(key: string): Promise<void> {
    if (typeof key !== 'string' || !NAME.test(key)) throw new UAError('out_of_range', `preferences: "${String(key)}" is not a preference name`);
    if (this.initialised.has(key)) return;
    // A write to a preference that was never initialised can be dropped without an error.
    await this.client.raw.post('/preferences/init_preference', { context: this.name, preference: key });
    this.initialised.add(key);
  }
}
