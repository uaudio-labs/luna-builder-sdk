// @vitest-environment jsdom
/**
 * Luna.Shortcuts / Luna.bindShortcuts: LUNA's standard undo, redo, play and record keys, as the
 * fallback for keys an Add On does not handle (facts 79, 80).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function tick(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

/** A toggle first readies the session, which takes several round trips. */
async function until(predicate: () => boolean, what: string): Promise<void> {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 5));
  }
}

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vocal'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  return { engine, luna, session };
}

interface KeyInit {
  key: string;
  code: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  repeat?: boolean;
}

const Z: KeyInit = { key: 'z', code: 'KeyZ' };
const SPACE: KeyInit = { key: ' ', code: 'Space' };

function press(target: EventTarget, init: KeyInit, type = 'keydown'): KeyboardEvent {
  const e = new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(e);
  return e;
}

const posted = (engine: Luna.MockEngine, command: string) => engine.requests.filter((r) => r.verb === 'post' && r.path.endsWith(`/${command}`));

let bindings: Luna.ShortcutsBinding[] = [];
function bind(luna: Luna.Client, options: Luna.ShortcutsOptions = {}) {
  const b = Luna.bindShortcuts(luna, { platform: 'mac', ...options });
  bindings.push(b);
  return b;
}

afterEach(() => {
  for (const b of bindings) b.dispose();
  bindings = [];
  document.body.innerHTML = '';
});

describe('Luna.Shortcuts key map (fact 79)', () => {
  it('uses Cmd on a Mac and Ctrl elsewhere', async () => {
    const { luna } = await connected();
    const mac = new Luna.Shortcuts(luna, { platform: 'mac' });
    const win = new Luna.Shortcuts(luna, { platform: 'other' });
    const cmdZ = { ...Z, metaKey: true, ctrlKey: false, altKey: false, shiftKey: false };
    const ctrlZ = { ...Z, metaKey: false, ctrlKey: true, altKey: false, shiftKey: false };
    expect(mac.commandFor(cmdZ)).toBe('undo');
    expect(mac.commandFor(ctrlZ)).toBeUndefined();
    expect(win.commandFor(ctrlZ)).toBe('undo');
    expect(win.commandFor(cmdZ)).toBeUndefined();
  });

  it('maps all four commands and their numpad alternates', async () => {
    const { luna } = await connected();
    const s = new Luna.Shortcuts(luna, { platform: 'mac' });
    const k = (init: KeyInit) => s.commandFor({ metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...init });
    expect(k({ key: 'Z', code: 'KeyZ', metaKey: true, shiftKey: true })).toBe('redo');
    expect(k(SPACE)).toBe('togglePlayback');
    expect(k({ key: '0', code: 'Numpad0' })).toBe('togglePlayback');
    expect(k({ ...SPACE, metaKey: true })).toBe('toggleRecord');
    expect(k({ key: '3', code: 'Numpad3' })).toBe('toggleRecord');
    // modifiers must match exactly, and the top-row digit is not the numpad one
    expect(k({ ...Z, metaKey: true, altKey: true })).toBeUndefined();
    expect(k({ key: '0', code: 'Digit0' })).toBeUndefined();
    expect(k(Z)).toBeUndefined();
  });

  it('takes replacement bindings and disables a command with []', async () => {
    const { luna } = await connected();
    const s = new Luna.Shortcuts(luna, { platform: 'other', bindings: { togglePlayback: [], undo: ['Ctrl+Alt+U'] } });
    expect(s.bindings.redo).toEqual(Luna.DEFAULT_SHORTCUTS.redo);
    expect(s.commandFor({ ...SPACE, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false })).toBeUndefined();
    expect(s.commandFor({ key: 'u', code: 'KeyU', metaKey: false, ctrlKey: true, altKey: true, shiftKey: false })).toBe('undo');
    expect(() => new Luna.Shortcuts(luna, { bindings: { undo: ['Hyper+Z'] } })).toThrow(/unknown modifier/);
  });
});

describe('Luna.bindShortcuts', () => {
  it('runs undo and redo on the focused session', async () => {
    const { engine, luna } = await connected();
    bind(luna);
    const u = press(document.body, { ...Z, metaKey: true });
    const r = press(document.body, { ...Z, key: 'Z', metaKey: true, shiftKey: true });
    await engine.settled();
    expect(u.defaultPrevented && r.defaultPrevented).toBe(true);
    expect(posted(engine, 'undo')).toHaveLength(1);
    expect(posted(engine, 'redo')).toHaveLength(1);
    expect(posted(engine, 'undo')[0]?.data).toMatchObject({ session_uid: 'abc', count: 1 });
  });

  it('toggles playback with Space', async () => {
    const { engine, luna } = await connected();
    bind(luna);
    press(document.body, SPACE);
    await until(() => engine.value('/sessions/abc', 'playing') === true, 'play');
    press(document.body, SPACE);
    await until(() => engine.value('/sessions/abc', 'playing') === false, 'stop');
  });

  it('toggles record with Cmd+Space, rolling the transport when stopped (fact 80)', async () => {
    const { engine, luna } = await connected();
    bind(luna);
    press(document.body, { ...SPACE, metaKey: true });
    await until(() => engine.value('/sessions/abc', 'record_enabled') === true, 'record on');
    expect(engine.value('/sessions/abc', 'playing')).toBe(true);
    press(document.body, { ...SPACE, metaKey: true });
    await until(() => engine.value('/sessions/abc', 'record_enabled') === false, 'record off');
  });

  it('leaves a key the page already handled', async () => {
    const { engine, luna } = await connected();
    bind(luna);
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.addEventListener('keydown', (e) => e.preventDefault());
    press(canvas, { ...Z, metaKey: true });
    await engine.settled();
    expect(posted(engine, 'undo')).toHaveLength(0);
  });

  it('leaves keys typed into text fields, but not range inputs or buttons', async () => {
    const { engine, luna } = await connected();
    bind(luna);
    for (const html of ['<input type="text">', '<input>', '<textarea></textarea>', '<select></select>', '<div contenteditable="true"></div>']) {
      document.body.innerHTML = html;
      const el = document.body.firstElementChild as HTMLElement;
      // jsdom does not implement isContentEditable
      if (el.hasAttribute('contenteditable')) Object.defineProperty(el, 'isContentEditable', { value: true });
      expect(press(el, SPACE).defaultPrevented, html).toBe(false);
    }
    document.body.innerHTML = '<input type="range"><button>Play</button>';
    const [range, button] = Array.from(document.body.children);
    press(range!, { ...Z, metaKey: true });
    press(button!, { ...Z, metaKey: true });
    await engine.settled();
    expect(posted(engine, 'undo')).toHaveLength(2);
  });

  it('claims the keyup of a handled Space, so a focused button is not clicked too', async () => {
    const { luna } = await connected();
    bind(luna);
    const button = document.createElement('button');
    document.body.appendChild(button);
    expect(press(button, SPACE).defaultPrevented).toBe(true);
    expect(press(button, SPACE, 'keyup').defaultPrevented).toBe(true);
    // an unrelated keyup is untouched
    expect(press(button, { key: 'a', code: 'KeyA' }, 'keyup').defaultPrevented).toBe(false);
  });

  it('ignores a held-down Space but repeats undo', async () => {
    const { engine, luna } = await connected();
    bind(luna);
    expect(press(document.body, { ...SPACE, repeat: true }).defaultPrevented).toBe(false);
    press(document.body, { ...Z, metaKey: true, repeat: true });
    await engine.settled();
    expect(posted(engine, 'undo')).toHaveLength(1);
  });

  it('does nothing with no session open, and stops on dispose', async () => {
    const engine = new Luna.MockEngine();
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    const b = bind(luna);
    expect(press(document.body, SPACE).defaultPrevented).toBe(false);
    b.dispose();

    const { engine: e2, luna: l2 } = await connected();
    const b2 = bind(l2);
    b2.dispose();
    expect(press(document.body, { ...Z, metaKey: true }).defaultPrevented).toBe(false);
    await e2.settled();
    expect(posted(e2, 'undo')).toHaveLength(0);
  });

  it('reports a failing command to onError and names it to onCommand', async () => {
    const { engine, luna } = await connected();
    engine.fail('/sessions/abc/undo', 'uasrv.invalid_value');
    const errors: [unknown, Luna.ShortcutCommand][] = [];
    const ran: Luna.ShortcutCommand[] = [];
    bind(luna, { onError: (e, c) => errors.push([e, c]), onCommand: (c) => ran.push(c) });
    press(document.body, { ...Z, metaKey: true });
    await until(() => errors.length > 0, 'the error');
    expect(ran).toEqual(['undo']);
    expect(errors[0]?.[1]).toBe('undo');
    expect((errors[0]?.[0] as Luna.Error).code).toBe('uasrv.invalid_value');
  });
});

describe('Transport.toggleRecord (fact 80)', () => {
  it('turns record off without touching playback', async () => {
    const { engine, session } = await connected();
    await session.ready();
    engine.setValue('/sessions/abc', 'record_enabled', true);
    engine.setValue('/sessions/abc', 'playing', true);
    await engine.settled();
    await session.transport.toggleRecord();
    await engine.settled();
    expect(engine.value('/sessions/abc', 'record_enabled')).toBe(false);
    expect(engine.requests.filter((r) => r.verb === 'set' && r.path.includes('playing'))).toHaveLength(0);
  });
});
