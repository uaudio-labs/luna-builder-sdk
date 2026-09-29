/**
 * LUNA's standard keyboard shortcuts for an Add On: the fallback for keys the Add On's own GUI
 * does not handle.
 *
 * An Add On page has the keyboard focus while it is in front, so without this LUNA's own
 * shortcuts (Space to play, Cmd+Z to undo) stop working the moment the user clicks into it.
 * {@link bindShortcuts} restores them: it listens on the window, and a key the page has not
 * already claimed (`event.defaultPrevented`) and that is not typed into a text field runs the
 * matching command on the focused session. Bindings follow LUNA's default map (fact 79) and
 * each command does what LUNA's does (fact 80).
 *
 * To take a key over, handle it in the page and call `preventDefault()`; to drop or change a
 * binding, pass `bindings`.
 *
 * @example
 * const luna = await Luna.connect();
 * Luna.bindShortcuts(luna);
 *
 * // the page's own Space handler wins, because it claims the event
 * canvas.addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); preview(); } });
 *
 * // keep undo and redo, drop the transport keys
 * Luna.bindShortcuts(luna, { bindings: { togglePlayback: [], toggleRecord: [] } });
 */
import type { Client } from '../client/client';
import type { Session } from './session';

/** The commands the standard shortcuts cover. */
export type ShortcutCommand = 'undo' | 'redo' | 'togglePlayback' | 'toggleRecord';

export type ShortcutPlatform = 'mac' | 'other';

/**
 * A key combination as `Modifier+...+Key`. Modifiers are `Mod` (Cmd on a Mac, Ctrl
 * elsewhere), `Cmd`, `Ctrl`, `Alt` and `Shift`, and the ones named must be exactly the ones
 * held. The key is a `KeyboardEvent.key` (`z`, case-insensitive) or `KeyboardEvent.code`
 * (`Space`, `Numpad0`, `KeyZ`).
 */
export type KeyCombo = string;

export type ShortcutBindings = Record<ShortcutCommand, readonly KeyCombo[]>;

/**
 * LUNA's default shortcuts for the four commands (fact 79). Windows uses Ctrl where the Mac
 * uses Cmd, which `Mod` covers.
 */
export const DEFAULT_SHORTCUTS: Readonly<ShortcutBindings> = Object.freeze({
  undo: ['Mod+Z'],
  redo: ['Mod+Shift+Z'],
  togglePlayback: ['Space', 'Numpad0'],
  toggleRecord: ['Mod+Space', 'Numpad3'],
});

export interface ShortcutsOptions {
  /** Replace the combos of some commands; `[]` disables one. The rest keep their defaults. */
  bindings?: Partial<ShortcutBindings>;
  /** Which platform `Mod` resolves for. Detected from `navigator` when omitted. */
  platform?: ShortcutPlatform;
  /** The session a command acts on. Default: `client.sessions.current()` at the keypress. */
  session?: () => Session | undefined;
  /** Called when a command the shortcuts ran fails. Default: `console.warn`. */
  onError?: (error: unknown, command: ShortcutCommand) => void;
  /** Called after a key was matched and its command started. */
  onCommand?: (command: ShortcutCommand, event: KeyboardEvent) => void;
}

/** The parts of a `KeyboardEvent` a binding matches on. */
export type ShortcutKeyEvent = Pick<KeyboardEvent, 'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>;

interface ParsedCombo {
  key: string;
  meta: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
}

const COMMANDS: readonly ShortcutCommand[] = ['undo', 'redo', 'togglePlayback', 'toggleRecord'];
/** Held-down Space must not flap the transport; undo and redo repeat like LUNA's. */
const NO_REPEAT: ReadonlySet<ShortcutCommand> = new Set(['togglePlayback', 'toggleRecord']);

function detectPlatform(): ShortcutPlatform {
  const nav = (globalThis as { navigator?: { platform?: string; userAgentData?: { platform?: string }; userAgent?: string } }).navigator;
  const name = nav?.userAgentData?.platform ?? nav?.platform ?? nav?.userAgent ?? '';
  return /mac|iphone|ipad/i.test(name) ? 'mac' : 'other';
}

function parseCombo(combo: KeyCombo, platform: ShortcutPlatform): ParsedCombo {
  const parts = combo.split('+').map((p) => p.trim());
  // `Mod++` names the plus key itself.
  const key = combo.endsWith('++') ? '+' : (parts.pop() ?? '');
  const out: ParsedCombo = { key, meta: false, ctrl: false, alt: false, shift: false };
  for (const raw of parts) {
    const m = raw.toLowerCase();
    if (m === '') continue;
    if (m === 'mod') out[platform === 'mac' ? 'meta' : 'ctrl'] = true;
    else if (m === 'cmd' || m === 'command' || m === 'meta') out.meta = true;
    else if (m === 'ctrl' || m === 'control') out.ctrl = true;
    else if (m === 'alt' || m === 'option') out.alt = true;
    else if (m === 'shift') out.shift = true;
    else throw new Error(`unknown modifier "${raw}" in shortcut "${combo}"`);
  }
  return out;
}

function keyMatches(key: string, event: ShortcutKeyEvent): boolean {
  if (key === event.code) return true;
  if (key === 'Space') return event.key === ' ';
  // A bare key name (`z`, `Z`, `Enter`) compares with `event.key`; a code-only name such as
  // `Numpad0` never matches the top-row digit, whose `code` is `Digit0`.
  return key.length === 1 ? event.key.toLowerCase() === key.toLowerCase() : event.key === key;
}

function comboMatches(c: ParsedCombo, event: ShortcutKeyEvent): boolean {
  return c.meta === event.metaKey && c.ctrl === event.ctrlKey && c.alt === event.altKey && c.shift === event.shiftKey && keyMatches(c.key, event);
}

/** True for a target that consumes typed keys: a text input, textarea, select or editable. */
function isEditable(target: EventTarget | null): boolean {
  const el = target as { tagName?: string; type?: string; isContentEditable?: boolean } | null;
  if (!el || typeof el.tagName !== 'string') return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName.toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return false;
  const type = (el.type ?? 'text').toLowerCase();
  return !['button', 'checkbox', 'radio', 'range', 'color', 'file', 'image', 'reset', 'submit'].includes(type);
}

/**
 * The standard shortcuts as an object: which command a key means, and running it. Most Add
 * Ons only need {@link bindShortcuts}; use this directly to route keys from a listener the
 * page already has, or to run a command from a menu.
 *
 * @example
 * const shortcuts = new Luna.Shortcuts(luna);
 * shortcuts.commandFor({ key: 'z', code: 'KeyZ', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false }); // 'undo' on a Mac
 * await shortcuts.run('togglePlayback');
 * document.addEventListener('keydown', (e) => shortcuts.handle(e));
 */
export class Shortcuts {
  /** The combos in effect, per command. */
  readonly bindings: Readonly<ShortcutBindings>;
  readonly platform: ShortcutPlatform;
  private readonly parsed: ReadonlyArray<readonly [ShortcutCommand, ParsedCombo]>;
  /** The key whose keydown was handled, so its keyup cannot also click a focused button. */
  private swallowKeyUp: string | undefined;

  constructor(
    private readonly client: Client,
    private readonly options: ShortcutsOptions = {},
  ) {
    this.platform = options.platform ?? detectPlatform();
    this.bindings = Object.freeze({ ...DEFAULT_SHORTCUTS, ...options.bindings });
    this.parsed = COMMANDS.flatMap((cmd) => this.bindings[cmd].map((combo) => [cmd, parseCombo(combo, this.platform)] as const));
  }

  /** The command `event` is bound to, if any. Ignores focus and `defaultPrevented`. */
  commandFor(event: ShortcutKeyEvent): ShortcutCommand | undefined {
    return this.parsed.find(([, combo]) => comboMatches(combo, event))?.[0];
  }

  /**
   * Run the command for a keydown the page has not handled. Returns true, having called
   * `preventDefault()`, when it ran one; false for a key that is claimed, typed into a text
   * field, unbound, a held-down transport key, or pressed with no session open.
   */
  handle(event: KeyboardEvent): boolean {
    if (event.defaultPrevented || event.isComposing || isEditable(event.target)) return false;
    const command = this.commandFor(event);
    if (!command || (event.repeat && NO_REPEAT.has(command))) return false;
    const session = this.session();
    if (!session) return false;
    event.preventDefault();
    this.swallowKeyUp = event.code;
    this.options.onCommand?.(command, event);
    this.runOn(session, command).catch((e: unknown) => (this.options.onError ?? warn)(e, command));
    return true;
  }

  /**
   * Keyup half of {@link handle}: claims the keyup of a key whose keydown was handled, so
   * Space does not also activate a focused button.
   */
  handleKeyUp(event: KeyboardEvent): void {
    if (this.swallowKeyUp !== undefined && event.code === this.swallowKeyUp) {
      this.swallowKeyUp = undefined;
      event.preventDefault();
    }
  }

  /**
   * Run a command on the focused session (or `options.session`), as LUNA's own shortcut
   * would. Resolves without doing anything when no session is open.
   */
  async run(command: ShortcutCommand): Promise<void> {
    const session = this.session();
    if (session) await this.runOn(session, command);
  }

  private session(): Session | undefined {
    return this.options.session ? this.options.session() : this.client.sessions.current();
  }

  private async runOn(session: Session, command: ShortcutCommand): Promise<void> {
    switch (command) {
      case 'undo':
        await session.undo();
        return;
      case 'redo':
        await session.redo();
        return;
      case 'togglePlayback':
      case 'toggleRecord': {
        // The toggles read the current state, which a page that never readied the session
        // does not have yet. ready() is idempotent, so this costs nothing afterwards.
        await session.ready();
        await (command === 'togglePlayback' ? session.transport.toggle() : session.transport.toggleRecord());
        return;
      }
    }
  }
}

function warn(error: unknown, command: ShortcutCommand): void {
  console.warn(`Luna shortcut ${command} failed:`, error);
}

/** The listeners {@link bindShortcuts} installed. */
export interface ShortcutsBinding {
  readonly shortcuts: Shortcuts;
  /** Remove the listeners. */
  dispose(): void;
}

/**
 * Give an Add On LUNA's standard shortcuts for undo, redo, play and record, as a fallback
 * behind its own key handling.
 *
 * Listens for `keydown` in the bubble phase on `options.target` (default the window), so
 * handlers on the page's elements and document run first; any of them that calls
 * `preventDefault()` keeps the key. Keys typed into text inputs, textareas, selects and
 * editable elements are left alone. Commands act on the focused session at the keypress,
 * so there is nothing to rebind when the user switches sessions.
 *
 * @example
 * const luna = await Luna.connect();
 * const keys = Luna.bindShortcuts(luna, { onError: (e) => say(e.message, true) });
 * // later
 * keys.dispose();
 */
export function bindShortcuts(client: Client, options: ShortcutsOptions & { target?: EventTarget } = {}): ShortcutsBinding {
  const shortcuts = new Shortcuts(client, options);
  const target = options.target ?? (globalThis as { window?: EventTarget }).window;
  const onDown = (e: Event): void => {
    shortcuts.handle(e as KeyboardEvent);
  };
  const onUp = (e: Event): void => shortcuts.handleKeyUp(e as KeyboardEvent);
  target?.addEventListener('keydown', onDown);
  target?.addEventListener('keyup', onUp);
  return {
    shortcuts,
    dispose: () => {
      target?.removeEventListener('keydown', onDown);
      target?.removeEventListener('keyup', onUp);
    },
  };
}
