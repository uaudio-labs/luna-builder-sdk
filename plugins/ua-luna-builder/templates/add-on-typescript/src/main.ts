// __TITLE__: DOM wiring. Connects to LUNA, follows the focused
// session, and renders what logic.ts computes. Every listener returned by onChange is kept
// so it can be released when the session changes.
//
// npm run build bundles this file and everything it imports into dist/main.js, one classic
// script (an IIFE) that index.html loads after vendor/luna.global.js.

import { locationText, rows } from './logic';

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`index.html has no #${id}`);
  return el;
}

let luna: Luna.Client;
let session: Luna.Session | undefined;
let releases: Luna.Unsubscribe[] = [];
const keep = (u: Luna.Unsubscribe): void => void releases.push(u);
const release = (): void => {
  for (const u of releases) u();
  releases = [];
};

function renderTracks(): void {
  if (!session) return;
  const root = $('tracks');
  root.innerHTML = '';
  for (const row of rows(session)) {
    const el = document.createElement('div');
    el.className = 'track';
    el.innerHTML = `<span class="name"></span><span class="gain"></span><button class="mute">M</button><button class="solo">S</button>`;
    el.querySelector('.name')!.textContent = row.name;
    el.querySelector('.gain')!.textContent = row.gain;
    const mute = el.querySelector<HTMLButtonElement>('.mute')!;
    const solo = el.querySelector<HTMLButtonElement>('.solo')!;
    mute.classList.toggle('on', row.muted);
    solo.classList.toggle('on', row.soloed);
    const track = session.tracks.byId(row.id);
    // Every control the user edits is touched so LUNA records one undo step and one
    // automation pass. A click is one write, which the SDK brackets (touch, write, release).
    // A fader is Luna.bindRange(input, control) and a knob Luna.bindDrag(element, control):
    // touch on press, writes while dragging, release on pointer up. Pass { bindings } from a
    // Luna.Bindings and re-render through bindings.whenIdle(render), so no drag is cut off.
    mute.onclick = () => void track?.mute.toggle();
    solo.onclick = () => void track?.solo.toggle();
    root.appendChild(el);
  }
}

async function bindSession(): Promise<void> {
  release();
  session = luna.sessions.current();
  if (!session) {
    $('status').textContent = 'no session open';
    $('tracks').innerHTML = '';
    return;
  }
  await session.ready();
  $('status').textContent = session.name.value ?? session.uid;

  const t = session.transport;
  const paintTransport = (): void => {
    $('location').textContent = locationText(t);
    $('play').classList.toggle('on', t.playing.value === true);
  };
  paintTransport();
  keep(t.location.onChange(paintTransport));
  keep(t.playing.onChange(paintTransport));
  $('play').onclick = () => void t.play();
  $('stop').onclick = () => void t.stop();

  // Load each strip's controls once, then re-render on any change.
  await Promise.all(session.visibleTracks.map((track) => Promise.all([track.loadStrip(), track.controls.load()])));
  renderTracks();
  keep(session.tracks.onChange(renderTracks));
  for (const track of session.visibleTracks) {
    keep(track.name.onChange(renderTracks));
    keep(track.gain.display.onChange(renderTracks));
    keep(track.mute.real.onChange(renderTracks));
    keep(track.solo.real.onChange(renderTracks));
  }
}

async function connect(): Promise<void> {
  for (;;) {
    try {
      // Inside LUNA the page URL carries ?port=; in a browser this falls back to LUNA on
      // localhost.
      luna = await Luna.connect();
      break;
    } catch (e) {
      $('status').textContent = e instanceof Luna.NotRunning ? 'waiting for LUNA...' : String((e as Error).message ?? e);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  // LUNA's standard undo, redo, play and record keys, for any key this page does not handle.
  // To take a key over, handle it here and call preventDefault(); to change one, pass
  // { bindings }. They act on the focused session, so there is nothing to rebind.
  Luna.bindShortcuts(luna);
  await luna.sessions.ready();
  luna.sessions.focused.onChange(() => void bindSession());
  luna.sessions.items.onChange(() => void bindSession());
  luna.status.onChange(() => {
    if (luna.status.value === 'disconnected') $('status').textContent = 'reconnecting...';
  });
  await bindSession();
}

void connect();
