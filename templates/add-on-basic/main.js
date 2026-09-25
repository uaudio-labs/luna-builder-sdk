// __TITLE__: DOM wiring. Connects to LUNA (or the wasm engine), follows the focused
// session, and renders what logic.js computes. Every listener returned by onChange is kept
// so it can be released when the session changes.

const $ = (id) => document.getElementById(id);
let luna;
let session;
let releases = [];
const keep = (u) => releases.push(u);
const release = () => {
  for (const u of releases) u();
  releases = [];
};

function renderTracks() {
  const root = $('tracks');
  root.innerHTML = '';
  for (const row of AddOnLogic.rows(session)) {
    const el = document.createElement('div');
    el.className = 'track';
    el.innerHTML = `<span class="name"></span><span class="gain"></span><button class="mute">M</button><button class="solo">S</button>`;
    el.querySelector('.name').textContent = row.name;
    el.querySelector('.gain').textContent = row.gain;
    el.querySelector('.mute').classList.toggle('on', row.muted);
    el.querySelector('.solo').classList.toggle('on', row.soloed);
    const track = session.tracks.byId(row.id);
    // Every control the user edits is touched so LUNA records one undo step and one
    // automation pass. A click is one write, which the SDK brackets (touch, write, release).
    // A fader is Luna.bindRange(input, control) and a knob Luna.bindDrag(element, control):
    // touch on press, writes while dragging, release on pointer up. Pass { bindings } from a
    // Luna.Bindings and re-render through bindings.whenIdle(render), so no drag is cut off.
    el.querySelector('.mute').onclick = () => track.mute.toggle();
    el.querySelector('.solo').onclick = () => track.solo.toggle();
    root.appendChild(el);
  }
}

async function bindSession() {
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
  const paintTransport = () => {
    $('location').textContent = AddOnLogic.locationText(t);
    $('play').classList.toggle('on', t.playing.value === true);
  };
  paintTransport();
  keep(t.location.onChange(paintTransport));
  keep(t.playing.onChange(paintTransport));
  $('play').onclick = () => t.play();
  $('stop').onclick = () => t.stop();

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

async function connect() {
  for (;;) {
    try {
      // Inside LUNA the page URL carries ?port=; in a browser this falls back to LUNA on
      // localhost. Pass { engine: 'wasm' } to run on the in-page engine instead.
      luna = await Luna.connect();
      break;
    } catch (e) {
      $('status').textContent = e instanceof Luna.NotRunning ? 'waiting for LUNA...' : e.message;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  // LUNA's standard undo, redo, play and record keys, for any key this page does not handle.
  // To take a key over, handle it here and call preventDefault(); to change one, pass
  // { bindings }. They act on the focused session, so there is nothing to rebind.
  Luna.bindShortcuts(luna);
  await luna.sessions.ready();
  luna.sessions.focused.onChange(bindSession);
  luna.sessions.items.onChange(bindSession);
  luna.status.onChange(() => {
    if (luna.status.value === 'disconnected') $('status').textContent = 'reconnecting...';
  });
  await bindSession();
}

connect();
