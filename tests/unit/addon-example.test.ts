/**
 * Runs the shipped `examples/addon/index.html` for real: its own inline script, against
 * Luna.MockEngine, through a DOM shim.
 *
 * That example is the plugin's flagship — the one file an agent reads before writing an Add
 * On — so a typo in it is worth catching here rather than in someone's LUNA. A second
 * client stands in for LUNA itself, changing the same mute the page is bound to.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const PAGE = new URL('../../examples/addon/index.html', import.meta.url);

/** The page's one inline script, as an expression that resolves when the page has settled. */
function pageScript(): string {
  const html = readFileSync(PAGE, 'utf8');
  const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  expect(blocks, 'examples/addon/index.html should have exactly one inline script').toHaveLength(1);
  const body = blocks[0]![1]!.trim().replace(/;$/, '');
  expect(body, 'the inline script should be one async IIFE; update this harness if it changes').toMatch(/^\(async \(\) => \{[\s\S]*\}\)\(\)$/);
  return body;
}

/** Only the handful of DOM surface the example touches. */
class FakeElement {
  textContent = '';
  disabled = false;
  readonly dataset: Record<string, string> = {};
  onclick: (() => void) | null = null;
  readonly classes = new Set<string>();
  readonly classList = {
    toggle: (name: string, on?: boolean) => {
      if (on ?? !this.classes.has(name)) this.classes.add(name);
      else this.classes.delete(name);
    },
  };
}

async function until(predicate: () => boolean, what: string, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 5));
  }
}

/** Load the page against this engine, with Luna.connect() routed to the mock port. */
async function loadPage(engine: Luna.MockEngine) {
  const els = { mute: new FakeElement(), status: new FakeElement(), label: new FakeElement() };
  const document = { getElementById: (id: string) => els[id as keyof typeof els] };
  const ua = { ...Luna, connect: () => Luna.connect({ port_: engine.port() }) };
  const run = new Function('Luna', 'document', `return (${pageScript()});`) as (ua: unknown, doc: unknown) => Promise<void>;
  await run(ua, document);
  return els;
}

describe('examples/addon', () => {
  it('binds the master bus mute, follows LUNA, and writes back on click', async () => {
    const engine = new Luna.MockEngine();
    engine.addSession('abc', { tracks: ['Vocal'], name: 'Demo' });
    await engine.settled();

    const els = await loadPage(engine);
    await until(() => els.mute.textContent === 'UNMUTED', 'the page to bind the master mute');
    expect(els.label.textContent).toBe('Main Output');
    expect(els.mute.disabled).toBe(false);
    expect(els.mute.dataset['muted']).toBe('false');
    expect(els.status.textContent).toBe(''); // bound and healthy: nothing to report
    expect(els.status.classes.has('error')).toBe(false);

    // LUNA's own mute button: a second client finds the path, the engine pushes the change.
    const luna = await Luna.connect({ port_: engine.port() });
    const master = (await luna.session()).master!;
    await master.loadStrip();
    engine.setValue(master.mute.path, 'real_value', true);
    await engine.settled();
    await until(() => els.mute.textContent === 'MUTED', 'the page to follow a mute made in LUNA');
    expect(els.mute.dataset['muted']).toBe('true');

    // The button writes back through the model layer.
    els.mute.onclick!();
    await until(() => engine.value(master.mute.path, 'real_value') === false, 'the click to unmute the engine');
    await luna.close();
  });

  it('says so when no session is open instead of failing silently', async () => {
    const engine = new Luna.MockEngine();
    const els = await loadPage(engine);
    await until(() => els.mute.textContent === 'no session', 'the no-session state');
    expect(els.mute.disabled).toBe(true);
    expect(els.status.textContent).toBe('no session open in LUNA');
    expect(els.status.classes.has('error')).toBe(true);
  });
});
