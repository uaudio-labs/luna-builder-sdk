// @vitest-environment jsdom
/**
 * Runs each example page for real, in jsdom, against Luna.MockEngine.
 *
 * These pages are the SDK's most-read documentation, and a page that throws on load teaches
 * the wrong thing, so each one is loaded, given a session, and checked for the thing it
 * exists to show.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';
import { loadExamplePage } from '../helpers/page';

function engineWithSession(tracks = ['Vocal', 'Bass']) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks, name: 'Demo', packageUid: 'pkg_abc' });
  return engine;
}

/**
 * Wait for the mixer's strips to stop being rebuilt. Loading the strips re-announces the track
 * and bus lists, so the page renders more than once as it starts; an element held from an
 * earlier render is detached, and its listeners released.
 */
async function settledStrips(page: Awaited<ReturnType<typeof loadExamplePage>>): Promise<void> {
  await page.waitFor(() => page.all('.strip').length > 0, 'strips');
  let last: Element | undefined;
  let stable = 0;
  await page.waitFor(() => {
    const first = page.all('.strip')[0];
    stable = first === last ? stable + 1 : 0;
    last = first;
    return stable >= 10;
  }, 'the strips to settle');
}

describe('examples/mixer.html', () => {
  it('builds a strip per visible channel, with the name, dB readout and meter', async () => {
    const engine = engineWithSession();
    const page = await loadExamplePage('mixer.html', engine);
    await settledStrips(page);

    const names = page.all('.strip .name').map((n) => n.textContent);
    expect(names).toContain('Vocal');
    expect(names).toContain('Bass');
    expect(names).toContain('Main Output');          // the master bus gets a strip too
    expect(page.all('.strip.master')).toHaveLength(1);
    expect(page.text('#session')).toBe('Demo');
    // Each strip shows the engine's own dB string and has a meter bar per stream.
    expect(page.all('.strip .db')[0]?.textContent).toBe('0.0');
    expect(page.all('.strip .meter .stream').length).toBeGreaterThanOrEqual(3);
    page.close();
  });

  it('hides the system tracks unless ?all=1', async () => {
    const withClick = engineWithSession();
    withClick.addTrack('abc', 'CLICK', { name: 'CLICK', trackType: 'click' });
    await withClick.settled();

    const plain = await loadExamplePage('mixer.html', withClick);
    await plain.waitFor(() => plain.all('.strip').length > 0, 'strips');
    expect(plain.all('.strip .name').map((n) => n.textContent)).not.toContain('CLICK');
    plain.close();

    const all = await loadExamplePage('mixer.html', withClick, { search: '?all=1' });
    await all.waitFor(() => all.all('.strip').length > 0, 'strips');
    expect(all.all('.strip .name').map((n) => n.textContent)).toContain('CLICK');
    all.close();
  });

  it('follows a mute made elsewhere and toggles one on click', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('mixer.html', engine);
    await settledStrips(page);
    const strip = page.all('.strip')[0]!;
    const muteButton = strip.querySelector('.mute') as HTMLElement;
    expect(muteButton.dataset['on']).toBe('false');

    const mutePath = '/sessions/abc/tracks/Vocal/outputs/main/controls/mute';
    engine.setValue(mutePath, 'real_value', true);
    await page.waitFor(() => muteButton.dataset['on'] === 'true', 'the mute button to follow LUNA');

    muteButton.click();
    await page.waitFor(() => engine.value(mutePath, 'real_value') === false, 'the click to unmute');
    page.close();
  });

  it('touches a fader for the whole drag and a mute for the click (fact 78)', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('mixer.html', engine);
    await settledStrips(page);
    const strip = page.all('.strip')[0]!;
    const fader = strip.querySelector('.fader') as HTMLInputElement;
    const gainPath = '/sessions/abc/tracks/Vocal/outputs/main/controls/gain';
    const mutePath = '/sessions/abc/tracks/Vocal/outputs/main/controls/mute';
    const win = page.document.defaultView!;

    fader.dispatchEvent(new win.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    for (const v of ['200', '400', '600']) {
      fader.value = v;
      fader.dispatchEvent(new win.Event('input', { bubbles: true }));
    }
    fader.dispatchEvent(new win.MouseEvent('pointerup', { bubbles: true, button: 0 }));
    await page.waitFor(() => engine.touches.length === 2, 'the drag to be released');
    expect(engine.touches).toEqual([`${gainPath}:on`, `${gainPath}:off`]);
    expect(engine.value(gainPath, 'normalized_value')).toBe(0.6);

    (strip.querySelector('.mute') as HTMLElement).click();
    await page.waitFor(() => engine.touches.length === 4, 'the click to be released');
    expect(engine.touches.slice(2)).toEqual([`${mutePath}:on`, `${mutePath}:off`]);
    page.close();
  });

  it('holds a rebuild while a fader is dragged, and rebuilds once it is released', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('mixer.html', engine);
    await settledStrips(page);
    const fader = page.all('.strip')[0]!.querySelector('.fader') as HTMLInputElement;
    const gainPath = '/sessions/abc/tracks/Vocal/outputs/main/controls/gain';
    const win = page.document.defaultView!;

    fader.dispatchEvent(new win.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    engine.addTrack('abc', 'Bass', { name: 'Bass' });
    await engine.settled();
    await new Promise((r) => setTimeout(r, 50));
    expect(page.all('.strip .name').map((n) => n.textContent)).not.toContain('Bass');
    expect(fader.isConnected).toBe(true);

    fader.dispatchEvent(new win.MouseEvent('pointerup', { bubbles: true, button: 0 }));
    await page.waitFor(() => page.all('.strip .name').some((n) => n.textContent === 'Bass'), 'the held rebuild');
    await page.waitFor(() => engine.touches.length === 2, 'the drag to be released');
    expect(engine.touches).toEqual([`${gainPath}:on`, `${gainPath}:off`]);
    page.close();
  });

  it('starts and stops the transport from the header', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('mixer.html', engine);
    await settledStrips(page);
    const play = page.document.getElementById('play') as HTMLElement;
    expect(play.textContent).toContain('Play');
    play.click();
    await page.waitFor(() => play.textContent?.includes('Stop') === true, 'the play button to latch');
    expect(engine.value('/sessions/abc', 'playing')).toBe(true);
    page.close();
  });

  it("hands unhandled keys to LUNA's standard shortcuts (fact 79)", async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('mixer.html', engine);
    await settledStrips(page);
    const win = page.window;
    const key = (init: KeyboardEventInit) => page.document.body.dispatchEvent(new win.KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
    key({ key: ' ', code: 'Space' });
    await page.waitFor(() => engine.value('/sessions/abc', 'playing') === true, 'Space to start playback');
    // Cmd+Z on a Mac, Ctrl+Z elsewhere; jsdom reports neither platform as a Mac
    key({ key: 'z', code: 'KeyZ', ctrlKey: true });
    await page.waitFor(() => engine.requests.some((r) => r.path.endsWith('/undo')), 'Ctrl+Z to undo');
    page.close();
  });
});

describe('examples/tracks.html', () => {
  it('lists the session tracks straight off the wire', async () => {
    const engine = engineWithSession();
    const page = await loadExamplePage('tracks.html', engine);
    await page.waitFor(() => page.all('#tracks li').length >= 2, 'the track list');
    expect(page.all('#tracks li').map((li) => li.textContent)).toEqual(expect.arrayContaining(['Vocal', 'Bass']));
    expect(page.text('#status')).toContain('session abc');
    page.close();
  });

  it('says so when no session is open', async () => {
    const page = await loadExamplePage('tracks.html', new Luna.MockEngine());
    await page.waitFor(() => page.text('#status').length > 0, 'the error');
    expect(page.text('#status')).toContain('no session open');
    page.close();
  });
});

describe('examples/ruler.html', () => {
  it('draws the ruler and lists markers you can click to seek', async () => {
    const engine = engineWithSession(['Vocal']);
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.session();
    await session.addMarker(Luna.TICKS_PER_BEAT * 4, 'Verse');
    await engine.settled();
    await luna.close();

    const page = await loadExamplePage('ruler.html', engine);
    await page.waitFor(() => page.all('#markers tr').length > 0, 'the marker table');
    expect(page.all('#markers td').map((td) => td.textContent)).toContain('Verse');
    expect(page.draws.calls).toContain('fillText');   // it painted the ruler
    expect(page.text('#status')).toContain('1 markers');

    (page.all('#markers tr')[0] as HTMLElement).click();
    await page.waitFor(() => engine.value('/sessions/abc', 'play_start') === Luna.TICKS_PER_BEAT * 4, 'the seek');
    page.close();
  });
});

describe('examples/inserts.html', () => {
  it('lists the effect slots of the first channel', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('inserts.html', engine);
    await page.waitFor(() => page.all('.slot').length > 0, 'insert slots');
    // The user-facing effect_N slots only, eight on 3.0 (fact 86): tape, console,
    // sidechain_filter and record_fx_N are excluded.
    expect(page.all('.slot').length).toBe(8);
    expect(page.all('.slot .name').every((n) => n.textContent === 'empty')).toBe(true);
    expect(page.all('#channel option').map((o) => o.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('Vocal')]));
    page.close();
  });
});

describe('examples/sends.html', () => {
  it('shows a row per send and per cue output, and reroutes one', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('sends.html', engine);
    await page.waitFor(() => page.all('#sends tr').length > 0, 'send rows');
    expect(page.all('#sends tr')).toHaveLength(8);
    expect(page.all('#cues tr')).toHaveLength(4);
    expect(page.text('#status')).toContain('0 of 8 sends routed');
    // Every send starts unrouted.
    expect(page.all('#sends .dest').every((d) => d.textContent === '—')).toBe(true);

    const menu = page.all('#sends tr')[0]!.querySelector('select') as HTMLSelectElement;
    menu.value = 'master_abc';
    menu.dispatchEvent(new page.window.Event('change'));
    await page.waitFor(() => page.text('#status').includes('1 of 8 sends routed'), 'the send to route');
    expect(page.all('#sends .dest')[0]?.textContent).toBe('Main Output');
    page.close();
  });
});

describe('examples/addon', () => {
  it('runs in a real DOM too, not just the hand-rolled shim', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('addon/index.html', engine);
    await page.waitFor(() => page.text('#mute') === 'UNMUTED', 'the mute button to bind');
    expect(page.text('#label')).toBe('Main Output');
    page.close();
  });
});

describe('examples/automation.html', () => {
  it('inserts a ramp, then moves, nudges and deletes the first breakpoint', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('automation.html', engine);
    await page.waitFor(() => page.text('#status').startsWith('Connected'), 'the page to connect');
    expect(page.text('#laneInfo')).toBe('The lane is empty.');
    expect(page.all('#mode option').map((o) => o.textContent)).toEqual([...Luna.AUTOMATION_MODES]);

    (page.document.getElementById('insert') as HTMLElement).click();
    await page.waitFor(() => page.all('#rows tr').length === 3, 'three breakpoints');
    expect(page.draws.calls.length).toBe(0);            // the lane is SVG, not canvas
    expect(page.all('#lane circle')).toHaveLength(3);
    expect(page.text('#laneInfo')).toContain('3 breakpoints');

    // The ramp goes in at beats 400, 404 and 408. Wait for the rows to carry their loaded
    // values, not the zeroes they show before the member fetch lands.
    const beats = () => page.all('#rows tr').map((tr) => Number(tr.children[1]!.textContent));
    const values = () => page.all('#rows tr').map((tr) => Number(tr.children[2]!.textContent));
    await page.waitFor(() => beats().join() === '400,404,408', 'the ramp to load its ticks');
    expect(values()).toEqual([-6, 0, -3]);

    (page.document.getElementById('moveFirst') as HTMLElement).click();
    await page.waitFor(() => beats().join() === '404,404,408', 'the first breakpoint to move +4 beats');

    (page.document.getElementById('trimFirst') as HTMLElement).click();
    await page.waitFor(() => values().includes(-9), 'the first breakpoint value to drop by 3');

    // clear() is tick-addressed, and the move left two breakpoints on beat 404, so
    // "delete the first" takes both.
    (page.document.getElementById('deleteFirst') as HTMLElement).click();
    await page.waitFor(() => page.all('#rows tr').length === 1, 'the breakpoints on that tick to go');

    (page.document.getElementById('clear') as HTMLElement).click();
    await page.waitFor(() => page.text('#laneInfo') === 'The lane is empty.', 'the lane to clear');
    page.close();
  });
});

describe('examples/jobs.html', () => {
  it('bounces the checked channels and reports the render through to completion', async () => {
    const engine = engineWithSession(['Vocal', 'Bass']);
    const page = await loadExamplePage('jobs.html', engine);
    await page.waitFor(() => page.all('#channels input').length > 0, 'the channel list');
    // Tracks start checked, buses do not.
    expect(page.all('#channels input').filter((i) => (i as HTMLInputElement).checked)).toHaveLength(2);

    (page.document.getElementById('bounce') as HTMLElement).click();
    await page.waitFor(() => page.all('#jobs tr').length === 1, 'a render row');
    await page.waitFor(() => page.all('#jobs tr')[0]!.children[1]!.textContent === 'running', 'the render to run');
    expect(page.all('#jobs tr')[0]!.children[3]!.textContent).toBe('offline');

    const uid = engine.children('/renders')[0]!;
    engine.finishRender(uid, { percent: 40 });
    await page.waitFor(() => (page.all('#jobs tr')[0]!.querySelector('progress') as HTMLProgressElement).value === 0.4, 'progress');

    engine.finishRender(uid, { state: 'completed' });
    await page.waitFor(() => page.all('#jobs tr')[0]!.children[4]!.textContent?.includes('source(s) added') === true, 'the result');
    expect(page.all('#jobs tr')[0]!.children[1]!.textContent).toBe('completed');
    page.close();
  });

  it('exports the main bus and shows the file LUNA wrote', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('jobs.html', engine);
    await page.waitFor(() => page.all('#channels input').length > 0, 'the channel list');
    (page.document.getElementById('name') as HTMLInputElement).value = 'Rough mix';
    (page.document.getElementById('export') as HTMLElement).click();
    await page.waitFor(() => page.all('#jobs tr').length === 1, 'a render row');

    const uid = engine.children('/renders')[0]!;
    engine.finishRender(uid, { state: 'completed' });
    await page.waitFor(() => page.all('#jobs tr')[0]!.children[4]!.textContent?.startsWith('file:') === true, 'the exported path');
    expect(page.all('#jobs tr')[0]!.children[4]!.textContent).toContain('Rough mix - MAIN.wav');
    page.close();
  });

  it('aborts a running render from its row', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('jobs.html', engine);
    await page.waitFor(() => page.all('#channels input').length > 0, 'the channel list');
    (page.document.getElementById('bounce') as HTMLElement).click();
    await page.waitFor(() => page.all('#jobs tr').length === 1, 'a render row');
    (page.all('#jobs tr')[0]!.querySelectorAll('button')[0] as HTMLElement).click();
    await page.waitFor(() => page.all('#jobs tr')[0]!.children[1]!.textContent === 'aborted', 'the abort');
    page.close();
  });
});

describe('examples/files.html', () => {
  const logText = (page: Awaited<ReturnType<typeof loadExamplePage>>) => (page.window as unknown as { filesLog: string[] }).filesLog.join('\n');
  const connected = (page: Awaited<ReturnType<typeof loadExamplePage>>) => page.waitFor(() => page.text('#status').startsWith('Session'), 'the page to connect');

  it('reports the environment: /gui present, no native bridge outside LUNA', async () => {
    const page = await loadExamplePage('files.html', engineWithSession(['Vocal']));
    await connected(page);
    expect(page.text('#env')).toContain('luna.gui.available() true');
    expect(page.text('#env')).toContain('Luna.canDropPaths() false');
    expect((page.document.querySelector('#choose') as HTMLButtonElement).disabled).toBe(false);
    expect((page.document.querySelector('#paths') as HTMLInputElement).disabled).toBe(true);
    page.close();
  });

  it('File route: an HTML drop with a File is uploaded as a source', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('files.html', engine);
    await connected(page);
    const file = new page.window.File([new Uint8Array(2048).fill(5)], 'drop.wav', { type: 'audio/wav' });
    const drop = new page.window.Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [file], types: ['Files'] } });
    page.document.querySelector('#zone')!.dispatchEvent(drop);
    await page.waitFor(() => logText(page).includes('uploadFile →'), 'the upload');
    expect(logText(page)).toContain('zone: drop: 1 File(s): drop.wav (2048 bytes, type "audio/wav")');
    expect(engine.children('/workspace/sessions/pkg_abc/audio')).toHaveLength(1);
    page.close();
  });

  it('path route: LUNA’s dialog paths go to importPath', async () => {
    const engine = engineWithSession(['Vocal']);
    engine.nextDialogFiles = ['/Users/me/kick.wav'];
    const page = await loadExamplePage('files.html', engine);
    await connected(page);
    (page.document.querySelector('#choose') as HTMLButtonElement).click();
    await page.waitFor(() => logText(page).includes('importPath →'), 'the import');
    expect(logText(page)).toContain('chooseFiles: 1 path(s): /Users/me/kick.wav');
    expect(logText(page)).toContain('importPath → "kick.wav"');
    page.close();
  });

  it('path route: native path drops are imported, and turning them off opts out', async () => {
    // Luna runs in the Node realm here, so the stand-in bridge goes on its global.
    const g = globalThis as { lunaAPI?: unknown; lunaHost?: { filesDropped?(i: unknown): void } };
    const accepts: boolean[] = [];
    g.lunaAPI = { setAcceptsFileDrops: (b: boolean) => accepts.push(b) };
    try {
      const page = await loadExamplePage('files.html', engineWithSession(['Vocal']));
      await connected(page);
      const box = page.document.querySelector('#paths') as HTMLInputElement;
      expect(box.disabled).toBe(false);
      box.checked = true;
      box.dispatchEvent(new page.window.Event('change'));
      expect(accepts).toEqual([true]);
      g.lunaHost!.filesDropped!({ paths: ['/Users/me/snare.wav'], x: 10, y: 20 });
      await page.waitFor(() => logText(page).includes('importPath →'), 'the import');
      expect(logText(page)).toContain('onPathDrop: drop at 10,20: 1 path(s): /Users/me/snare.wav');
      box.checked = false;
      box.dispatchEvent(new page.window.Event('change'));
      expect(accepts).toEqual([true, false]);
      page.close();
    } finally {
      delete g.lunaAPI;
      delete g.lunaHost;
    }
  });

  it('picks up a session opened after the page loaded', async () => {
    const engine = new Luna.MockEngine();
    const page = await loadExamplePage('files.html', engine);
    await page.waitFor(() => page.text('#status').startsWith('No session open'), 'the no-session status');
    engine.addSession('abc', { tracks: ['Vocal'], name: 'Later', packageUid: 'pkg_abc' });
    engine.setValue('/sessions', 'focused_session', 'abc');
    await page.waitFor(() => page.text('#status').startsWith('Session "Later"'), 'the session to be picked up');
    page.close();
  });

  it('without /gui the dialog is disabled and says why', async () => {
    const engine = new Luna.MockEngine({ gui: false });
    engine.addSession('abc', { tracks: ['Vocal'], name: 'Demo', packageUid: 'pkg_abc' });
    const page = await loadExamplePage('files.html', engine);
    await connected(page);
    expect((page.document.querySelector('#choose') as HTMLButtonElement).disabled).toBe(true);
    expect(page.text('#chooseNote')).toContain('no /gui');
    page.close();
  });
});

describe('examples/import.html', () => {
  it('uploads bytes, lists the source, and places it as a clip', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('import.html', engine);
    await page.waitFor(() => page.text('#status').includes('clips go to'), 'the page to connect');
    expect(page.text('#sources')).toContain('No sources in this session.');
    expect(page.text('#record')).toContain('armed tracks: none');

    // The page exposes uploadBytes() for exactly this.
    const bytes = new Uint8Array(4096).fill(3);
    await (page.window as unknown as { uploadBytes(b: Uint8Array, n: string): Promise<void> }).uploadBytes(bytes, 'take.wav');
    await page.waitFor(() => page.all('#sources tr').length === 1, 'the source row');
    expect(page.text('#importStatus')).toContain('Imported "take.wav"');
    expect(page.all('#sources tr')[0]!.children[1]!.textContent).toBe('48000');

    const place = page.all('#sources tr')[0]!.querySelector('button') as HTMLButtonElement;
    expect(place.disabled).toBe(false);
    place.click();
    await page.waitFor(() => page.text('#importStatus').startsWith('Placed'), 'the clip to be placed');
    const playlist = engine.children('/sessions/abc/playlists')[0]!;
    expect(engine.children(`/sessions/abc/playlists/${playlist}/clips`)).toHaveLength(1);
    page.close();
  });

  it('uploads a File dropped on its drop zone', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('import.html', engine);
    await page.waitFor(() => page.text('#status').includes('clips go to'), 'the page to connect');
    const file = new page.window.File([new Uint8Array(1024).fill(9)], 'dropped.wav', { type: 'audio/wav' });
    const drop = new page.window.Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [file] } });
    page.document.querySelector('#drop')!.dispatchEvent(drop);
    await page.waitFor(() => page.text('#importStatus').includes('Imported "dropped.wav"'), 'the upload');
    page.close();
  });

  it('reports the transport record state and armed tracks', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('import.html', engine);
    await page.waitFor(() => page.text('#record').length > 0, 'the record line');
    engine.setValue('/sessions/abc/tracks/Vocal', 'record_enabled', true);
    await page.waitFor(() => page.text('#record').includes('armed tracks: Vocal'), 'the armed track');
    page.close();
  });
});

describe('examples/pianoroll.html', () => {
  it('draws a MIDI clip and follows notes added elsewhere', async () => {
    const engine = engineWithSession(['Keys']);
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.session();
    await session.ready();
    await session.insertClip({ trackUid: 'Keys', sourceUid: '', startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT, clipType: 'midi' });
    await engine.settled();
    const playlist = engine.children('/sessions/abc/playlists')[0]!;
    const clipPath = `/sessions/abc/playlists/${playlist}/clips/clip1`;
    engine.midiEdit(clipPath, 'added', [
      { rowid: 1, tick: 0, status: 0x90, data1: 60, data2: 100 },
      { rowid: 2, tick: Luna.TICKS_PER_BEAT, status: 0x80, data1: 60, data2: 0 },
    ]);
    await engine.settled();
    await luna.close();

    const page = await loadExamplePage('pianoroll.html', engine);
    await page.waitFor(() => page.all('#notes tr').length === 1, 'the note row');
    expect(page.text('#info')).toContain('1 notes');
    expect(page.all('#notes tr')[0]!.children[1]!.textContent).toBe('C4 (60) ch 1');
    expect(page.all('#notes tr')[0]!.children[2]!.textContent).toBe('0.000 → 1.000');
    expect(page.draws.calls).toContain('fillRect');
    expect(page.all('#clips option')).toHaveLength(1);

    // A note added by LUNA arrives as a delta and must appear without a refresh.
    engine.midiEdit(clipPath, 'added', [
      { rowid: 3, tick: 2 * Luna.TICKS_PER_BEAT, status: 0x90, data1: 67, data2: 80 },
      { rowid: 4, tick: 3 * Luna.TICKS_PER_BEAT, status: 0x80, data1: 67, data2: 0 },
    ]);
    await page.waitFor(() => page.all('#notes tr').length === 2, 'the second note');
    expect(page.text('#info')).toContain('2 notes');
    page.close();
  });

  it('says so when the session has no MIDI clip', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('pianoroll.html', engine);
    await page.waitFor(() => page.text('#status').includes('MIDI clip(s)'), 'the status');
    expect(page.text('#status')).toContain('0 MIDI clip(s)');
    expect(page.all('#notes tr')).toHaveLength(0);
    page.close();
  });
});

describe('examples/browse.html', () => {
  function engineWithDisk() {
    const engine = engineWithSession(['Vocal']);
    engine.folders['/Samples'] = ['kick.wav', 'Loops/', '.DS_Store', 'notes.txt'];
    engine.folders['/Samples/Loops'] = ['beat.aif'];
    return engine;
  }
  const names = (page: Awaited<ReturnType<typeof loadExamplePage>>) => page.all('#list .name').map((n) => n.textContent);

  it('lists ?path=, opens a subfolder on click and goes back up', async () => {
    const page = await loadExamplePage('browse.html', engineWithDisk(), { search: '?path=/Samples' });
    await page.waitFor(() => names(page).length === 3, 'the listing');
    expect(names(page)).toEqual(['kick.wav', 'Loops', 'notes.txt']);
    expect(page.text('#status')).toContain('1 folder(s), 2 file(s) in /Samples');
    (page.document.querySelector('#list li.dir') as HTMLElement).click();
    await page.waitFor(() => names(page).join() === 'beat.aif', 'the subfolder');
    expect((page.document.querySelector('#path') as HTMLInputElement).value).toBe('/Samples/Loops');
    (page.document.querySelector('#up') as HTMLButtonElement).click();
    await page.waitFor(() => names(page).length === 3, 'the parent');
    page.close();
  });

  it('imports an audio file onto a new track at the playhead, as one undo entry; other files get no button', async () => {
    const engine = engineWithDisk();
    engine.setValue('/sessions/abc', 'play_start', 4 * Luna.TICKS_PER_BEAT);
    const page = await loadExamplePage('browse.html', engine, { search: '?path=/Samples' });
    await page.waitFor(() => page.all('#list button').length === 1, 'the import button');
    await page.waitFor(() => !(page.document.querySelector('#list button') as HTMLButtonElement).disabled, 'a session');
    const tracksBefore = engine.children('/sessions/abc/tracks').length;
    (page.document.querySelector('#list button') as HTMLButtonElement).click();
    await page.waitFor(() => page.text('#status').startsWith('Imported'), 'the import');
    expect(page.text('#status')).toContain('"kick" onto a new track at 2|1|');
    expect(engine.children('/sessions/abc/tracks')).toHaveLength(tracksBefore + 1);
    const posts = engine.requests.filter((r) => r.path.startsWith('/sessions/abc/')).map((r) => r.path.split('/').pop());
    expect(posts).toEqual(expect.arrayContaining(['new_track', 'insert_clip']));
    const insert = engine.requests.find((r) => r.path.endsWith('/insert_clip'))!.data as { start: number; track_uid: string };
    expect(insert.start).toBe(4 * Luna.TICKS_PER_BEAT);
    expect(engine.has(`/sessions/abc/tracks/${insert.track_uid}`)).toBe(true);
    page.close();
  });

  it('makes audio rows draggable with their file:// URL and path; folders and other files are not', async () => {
    const page = await loadExamplePage('browse.html', engineWithDisk(), { search: '?path=/Samples' });
    await page.waitFor(() => page.all('#list li').length === 3, 'the listing');
    const [kick, loops, notes] = page.all('#list li') as HTMLElement[];
    expect([kick!.draggable, loops!.draggable, notes!.draggable]).toEqual([true, false, false]);
    const data: Record<string, string> = {};
    const start = new page.window.Event('dragstart', { bubbles: true });
    Object.defineProperty(start, 'dataTransfer', { value: { setData: (k: string, v: string) => (data[k] = v), effectAllowed: '' } });
    kick!.dispatchEvent(start);
    expect(data).toEqual({ 'text/uri-list': 'file:///Samples/kick.wav', 'text/plain': '/Samples/kick.wav' });
    page.close();
  });

  it('browses the folder chosen in LUNA’s dialog, and explains a bad path', async () => {
    const engine = engineWithDisk();
    engine.nextDialogFiles = ['/Samples/Loops'];
    const page = await loadExamplePage('browse.html', engine);
    await page.waitFor(() => !(page.document.querySelector('#choose') as HTMLButtonElement).disabled, 'the page to connect');
    (page.document.querySelector('#choose') as HTMLButtonElement).click();
    await page.waitFor(() => names(page).join() === 'beat.aif', 'the chosen folder');
    (page.document.querySelector('#path') as HTMLInputElement).value = '/Nope';
    page.document.querySelector('#go')!.dispatchEvent(new page.window.Event('submit', { cancelable: true }));
    await page.waitFor(() => page.text('#status').includes('uasrv.filesystem_error'), 'the error');
    expect(names(page).join()).toBe('beat.aif'); // the last good listing stays
    page.close();
  });

  it('without /gui says there is no listing', async () => {
    const page = await loadExamplePage('browse.html', new Luna.MockEngine({ gui: false }));
    await page.waitFor(() => page.text('#status').includes('no /gui'), 'the no-gui status');
    expect((page.document.querySelector('#choose') as HTMLButtonElement).disabled).toBe(true);
    page.close();
  });
});

describe('examples/secrets.html', () => {
  const logText = (page: Awaited<ReturnType<typeof loadExamplePage>>) => (page.document.querySelector('#log') as HTMLTextAreaElement).value;

  it('outside LUNA keeps the key in page memory and shows only its length and last four characters', async () => {
    const page = await loadExamplePage('secrets.html', engineWithSession());
    await page.waitFor(() => page.text('#status').startsWith('Connected'), 'the page to connect');
    expect(page.text('#storage')).toContain('page memory');
    (page.window as unknown as { console: Console }).console.warn = () => {};
    (page.document.querySelector('#value') as HTMLInputElement).value = 'sk-test-abcd1234';
    (page.document.querySelector('#save') as HTMLButtonElement).click();
    await page.waitFor(() => logText(page).includes('set: ok'), 'the save');
    (page.document.querySelector('#read') as HTMLButtonElement).click();
    await page.waitFor(() => logText(page).includes('get:'), 'the read');
    expect(logText(page)).toContain('get: 16 characters, ending "1234"');
    expect(logText(page)).not.toContain('sk-test');
    page.close();
  });
});
