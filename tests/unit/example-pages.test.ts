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

  it("opens and closes a plugin's editor from its name, and follows LUNA (fact 126)", async () => {
    const engine = engineWithSession(['Vocal']);
    engine.addPlugin('com.uaudio.uadx.1176', { name: 'UA 1176', manufacturer: 'Universal Audio', categories: ['Compressor'] });
    const page = await loadExamplePage('inserts.html', engine);
    await page.waitFor(() => page.all('.slot').length > 0 && page.all('#plugin option').length > 0, 'insert slots and catalog');
    (page.all('#add')[0] as HTMLButtonElement).click();
    const nameButton = () => page.all('.slot button.name')[0] as HTMLButtonElement | undefined;
    await page.waitFor(() => nameButton()?.textContent === 'UA 1176', 'the loaded plugin');
    expect(page.all('.slot button.name')).toHaveLength(1); // empty slots have no editor to open
    expect(nameButton()!.classList.contains('open')).toBe(false);

    nameButton()!.click();
    await page.waitFor(() => nameButton()!.classList.contains('open'), 'editor shown open');
    expect(engine.requests.find((r) => r.path === '/gui/show_plugin')?.data).toEqual({ session_uid: 'abc', channel_uid: 'Vocal', insert_type: 'effect_0' });

    nameButton()!.click();
    await page.waitFor(() => !nameButton()!.classList.contains('open'), 'editor shown closed');
    expect(engine.requests.some((r) => r.path === '/gui/hide_plugin')).toBe(true);

    // Opened from LUNA's own mixer: the page lights the name without being asked.
    engine.setValue('/gui/plugin_windows', 'open', [{ session_uid: 'abc', channel_uid: 'Vocal', insert_type: 'effect_0' }]);
    await page.waitFor(() => nameButton()!.classList.contains('open'), 'editor opened in LUNA');
    expect(nameButton()!.getAttribute('aria-pressed')).toBe('true');
    page.close();
  });

  it("drops a removed plugin's parameters, which LUNA leaves behind as ghosts (fact 86)", async () => {
    const engine = engineWithSession(['Vocal']);
    engine.addPlugin('com.uaudio.uadx.1176', { name: 'UA 1176' });
    const page = await loadExamplePage('inserts.html', engine);
    await page.waitFor(() => page.all('#plugin option').length > 0, 'the plugin list');
    (page.all('#add')[0] as HTMLButtonElement).click();
    await page.waitFor(() => page.all('.slot .param').length > 0, 'the plugin parameters');

    const remove = page.all('.slot .actions button').find((b) => b.textContent === 'Remove') as HTMLButtonElement;
    remove.click();
    await page.waitFor(() => page.all('.slot .name')[0]?.textContent === 'empty', 'the emptied slot');
    await engine.settled();
    await new Promise((r) => setTimeout(r, 50));
    expect(engine.children('/sessions/abc/tracks/Vocal/effects/effect_0/controls').length).toBeGreaterThan(0); // the ghosts are there
    expect(page.all('.slot .param')).toHaveLength(0);
    page.close();
  });

  describe('plugin selection (fact 127)', () => {
    function engineWithPlugins() {
      const engine = engineWithSession(['Vocal']); // a mono track
      engine.addPlugin('com.uaudio.uadx.1176', { name: 'UA 1176', manufacturer: 'Universal Audio', categories: ['Compressors & Limiters'] });
      engine.addPlugin('uaudio_pultec', { name: 'Pultec EQP-1A', manufacturer: 'Universal Audio', categories: ['Equalization'], favorite: true });
      engine.addPlugin('com.appl.au.aufx_bpas', { name: 'AUBandpass', manufacturer: 'Apple', categories: ['Equalization'] });
      engine.addPlugin('uaudio_maximizer', { name: 'Precision Maximizer', categories: ['Compressors & Limiters'], formats: [['stereo', 'stereo']] });
      engine.addPlugin('uaudio_shape', { name: 'Shape', effectType: 'instrument', categories: ['Synthesizer'] });
      return engine;
    }
    const options = (page: Awaited<ReturnType<typeof loadExamplePage>>, id: string) => page.all(`#${id} option`).map((o) => (o as HTMLOptionElement).value);
    const change = (page: Awaited<ReturnType<typeof loadExamplePage>>, id: string, value: string | boolean) => {
      const el = page.document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
      if (typeof value === 'boolean') (el as HTMLInputElement).checked = value;
      else el.value = value;
      el.dispatchEvent(new page.window.Event(id === 'search' ? 'input' : 'change'));
    };

    it("offers what LUNA says the slot takes on this channel, with the slot's categories", async () => {
      const engine = engineWithPlugins();
      const page = await loadExamplePage('inserts.html', engine);
      await page.waitFor(() => options(page, 'plugin').length > 0, 'the plugin list');
      // No instrument in an effect slot, no stereo-only plugin on a mono track.
      expect(options(page, 'plugin')).toEqual(['com.appl.au.aufx_bpas', 'uaudio_pultec', 'com.uaudio.uadx.1176']);
      expect(page.text('#count')).toBe('3 plugins');
      expect(page.all('#plugin option')[1]!.textContent).toBe('★ Pultec EQP-1A (Universal Audio)');
      expect(options(page, 'category')).toEqual(['', 'Compressors & Limiters', 'Equalization']);
      expect(engine.requests.find((r) => r.path === '/plugins/query')?.data).toMatchObject({ insert_type: 'effect_0', session_uid: 'abc', channel_uid: 'Vocal' });
      page.close();
    });

    it('narrows the list by search, category and favorites, each asked of LUNA', async () => {
      const engine = engineWithPlugins();
      const page = await loadExamplePage('inserts.html', engine);
      await page.waitFor(() => options(page, 'plugin').length === 3, 'the plugin list');

      change(page, 'category', 'Equalization');
      await page.waitFor(() => options(page, 'plugin').length === 2, 'the EQs');
      expect(engine.requests.at(-1)?.data).toMatchObject({ categories: ['Equalization'] });

      change(page, 'search', 'pult');
      await page.waitFor(() => options(page, 'plugin').length === 1, 'the search');
      expect(options(page, 'plugin')).toEqual(['uaudio_pultec']);
      expect(engine.requests.at(-1)?.data).toMatchObject({ search: 'pult', categories: ['Equalization'] });

      change(page, 'search', '');
      change(page, 'category', '');
      change(page, 'favorites', true);
      const lastQuery = () => engine.requests.filter((r) => r.path === '/plugins/query').at(-1)?.data as Record<string, unknown> | undefined;
      await page.waitFor(() => lastQuery()?.['favorite'] === true && lastQuery()?.['search'] === undefined && options(page, 'plugin').join() === 'uaudio_pultec', 'the favorites');

      change(page, 'favorites', false);
      change(page, 'search', 'nothing like this');
      await page.waitFor(() => page.text('#count') === '0 plugins', 'an empty list');
      expect((page.document.getElementById('add') as HTMLButtonElement).disabled).toBe(true);
      page.close();
    });

    it('loads the chosen plugin into the chosen slot', async () => {
      const engine = engineWithPlugins();
      const page = await loadExamplePage('inserts.html', engine);
      await page.waitFor(() => options(page, 'plugin').length === 3 && options(page, 'target').includes('effect_3'), 'the picker');
      change(page, 'target', 'effect_3');
      change(page, 'plugin', 'uaudio_pultec');
      (page.all('#add')[0] as HTMLButtonElement).click();
      await page.waitFor(() => engine.value('/sessions/abc/tracks/Vocal/effects/effect_3', 'plugin_id') === 'uaudio_pultec', 'the plugin in slot 4');
      await page.waitFor(() => page.all('#target option').some((o) => o.textContent === 'Slot 4 (Pultec EQP-1A)'), 'the slot label');
      expect(engine.value('/sessions/abc/tracks/Vocal/effects/effect_0', 'plugin_id') ?? '').toBe('');
      page.close();
    });

    it('falls back to the catalog on a LUNA without the query', async () => {
      const engine = engineWithPlugins();
      engine.fail('/plugins/query', 'uasrv.invalid_object', 100);
      const page = await loadExamplePage('inserts.html', engine);
      await page.waitFor(() => options(page, 'plugin').length > 0, 'the catalog list');
      expect(options(page, 'plugin')).toHaveLength(5); // every plugin, the slot's rules unknown
      expect(page.text('#status')).toContain('cannot say which plugins fit a slot');
      change(page, 'category', 'Equalization');
      await page.waitFor(() => options(page, 'plugin').length === 2, 'the catalog EQs');
      page.close();
    });
  });
});

describe('examples/presets.html', () => {
  const AMP = 'uaudio_paradise_guitar_studio';
  function engineWithAmp(options: { assistant?: boolean } = {}) {
    const engine = engineWithSession(['Guitar']);
    engine.addPlugin(AMP, { name: 'Paradise' });
    engine.addPresetTagGroup(AMP, 'TYPE', ['Clean', 'Lead']);
    engine.addPreset(AMP, 'Warm Jazz', { uid: 'p_jazz', factory: true, tags: ['Clean'] });
    engine.addPreset(AMP, 'Warm Stack Lead', { uid: 'p_lead', factory: true, tags: ['Lead'] });
    engine.addPreset(AMP, 'Gritty Lion', { uid: 'p_lion', factory: true, tags: ['Lead'] });
    // Paradise already on the Guitar track's first slot.
    const slot = '/sessions/abc/tracks/Guitar/effects/effect_0';
    engine.setValue(slot, 'plugin_id', AMP);
    engine.setValue(slot, 'external_sdk_instance_id', 1);
    if (options.assistant) engine.setAssistantEnabled(true);
    return engine;
  }
  const names = (page: Awaited<ReturnType<typeof loadExamplePage>>, selector: string) => page.all(selector).map((b) => b.querySelector('.name')?.textContent ?? b.textContent);
  const type = (page: Awaited<ReturnType<typeof loadExamplePage>>, text: string) => {
    const search = page.document.getElementById('search') as HTMLInputElement;
    search.value = text;
    search.dispatchEvent(new page.window.Event('input'));
  };

  it('filters by search and tag, recommends within the tag, and loads a click onto the slot', async () => {
    const engine = engineWithAmp({ assistant: true });
    const page = await loadExamplePage('presets.html', engine);
    await page.waitFor(() => page.all('.preset').length === 3, 'the preset list');
    expect(page.all('#groups .chip').map((c) => c.textContent)).toEqual(['Clean', 'Lead']);
    expect(page.text('#recs')).toContain('type to get recommendations');

    type(page, 'warm');
    await page.waitFor(() => page.all('.preset').length === 2 && page.all('#recs button').length === 2, 'warm presets and recommendations');
    expect(names(page, '.preset')).toEqual(['Warm Jazz', 'Warm Stack Lead']);

    (page.all('#groups .chip').find((c) => c.textContent === 'Lead') as HTMLButtonElement).click();
    await page.waitFor(() => page.all('.preset').length === 1 && page.all('#recs button').length === 1, 'the Lead tag to apply');
    expect(names(page, '.preset')).toEqual(['Warm Stack Lead']);
    expect(page.all('#recs button').map((b) => b.textContent)).toEqual(['Warm Stack Lead']);
    expect(page.all('#groups .chip[aria-pressed="true"]').map((c) => c.textContent)).toEqual(['Lead']);

    (page.all('#recs button')[0] as HTMLButtonElement).click();
    await page.waitFor(() => page.all('.preset[data-current="true"]').length === 1, 'the loaded preset to be marked');
    expect(engine.value('/sessions/abc/tracks/Guitar/effects/effect_0', 'preset_uid')).toBe('p_lead');
    page.close();
  });

  it('says so when UA Assistant is not connected, and still filters', async () => {
    const engine = engineWithAmp();
    const page = await loadExamplePage('presets.html', engine);
    await page.waitFor(() => page.all('.preset').length === 3, 'the preset list');
    type(page, 'lion');
    await page.waitFor(() => page.all('.preset').length === 1, 'the search to apply');
    expect(page.text('#recs')).toContain('UA Assistant is not connected');
    expect(engine.requests.some((r) => r.path === '/presets/preset_recommendations')).toBe(false);
    page.close();
  });

  it('asks for a plugin when no insert holds one', async () => {
    const page = await loadExamplePage('presets.html', engineWithSession(['Vocal']));
    await page.waitFor(() => page.text('#status').includes('insert a plugin'), 'the empty-session message');
    page.close();
  });
});

describe('examples/track-presets.html', () => {
  const SYNTH = 'uaudio_moog_minimoog';
  function engineWithPresets() {
    const engine = engineWithSession(['Vocal']);
    engine.addPlugin(SYNTH, { name: 'Minimoog', effectType: 'instrument' });
    engine.addPresetTagGroup(SYNTH, 'TYPE', ['Bass', 'Lead']);
    engine.addPreset(SYNTH, 'Fat Bass', { uid: 'p_fat_bass', factory: true, tags: ['Bass', 'Techno'] });
    engine.addPreset(SYNTH, 'Screaming Lead', { uid: 'p_lead', factory: true, tags: ['Lead'] });
    engine.addTrackPresetTagGroup('TYPE', ['Bass', 'Vocal']);
    engine.addPresetTagGroup(SYNTH, 'GENRE', ['Techno']);
    engine.addTrackPreset('Bass Rig', { uid: 'tp_bass', trackType: 'instrument', factory: true, tags: ['Bass'] });
    engine.addTrackPreset('Lead Vocal', { uid: 'tp_vocal', trackType: 'audio', factory: true, tags: ['Vocal'] });
    return engine;
  }
  const names = (page: Awaited<ReturnType<typeof loadExamplePage>>) => page.all('.preset').map((b) => b.querySelector('.name')?.textContent);
  const click = (el: Element | undefined) => (el as HTMLButtonElement).click();

  it('filters by category and tag, makes a track from an instrument preset, then replaces presets on it until Done', async () => {
    const engine = engineWithPresets();
    const page = await loadExamplePage('track-presets.html', engine);
    await page.waitFor(() => page.all('.preset').length === 4, 'track and instrument presets');
    expect(page.all('#categories .chip').map((c) => c.textContent)).toEqual(['All', 'Audio', 'Instrument', 'Bus', 'Multi-Track']);
    // A tab per tag group, the first open; nothing selected yet.
    expect(page.all('#tabs button').map((t) => t.textContent)).toEqual(['TYPE', 'GENRE']);
    expect(page.all('#groupTags .chip').map((c) => c.textContent)).toEqual(['Bass', 'Vocal', 'Lead']);
    expect(page.text('#chosen')).toContain('none selected');
    expect(page.all('.preset[data-instrument="true"]')).toHaveLength(2);
    expect(page.all('.preset[data-instrument="true"] .kind').map((k) => k.textContent)).toEqual(['Instrument preset · Minimoog', 'Instrument preset · Minimoog']);
    expect(page.all('.preset[data-instrument="false"] .kind').map((k) => k.textContent)).toEqual(['Track preset', 'Track preset']);

    click(page.all('#categories .chip').find((c) => c.textContent === 'Instrument'));
    await page.waitFor(() => page.all('.preset').length === 3, 'the Instrument category');
    // Selecting in one tab and then another gathers both above the tabs, each tab counting its own.
    click(page.all('#groupTags .chip').find((c) => c.textContent === 'Bass'));
    await page.waitFor(() => page.all('.preset').length === 2, 'the Bass tag');
    expect(names(page)).toEqual(['Bass Rig', 'Fat Bass']);
    click(page.all('#tabs button').find((t) => t.textContent === 'GENRE'));
    expect(page.all('#groupTags .chip').map((c) => c.textContent)).toEqual(['Techno']);
    click(page.all('#groupTags .chip')[0]);
    await page.waitFor(() => page.all('.preset').length === 1, 'the Techno tag');
    expect(page.all('#chosen .chip').map((c) => c.textContent)).toEqual(['Bass', 'Techno']);
    expect(page.all('#tabs button').map((t) => t.textContent)).toEqual(['TYPE1', 'GENRE1']);
    // Clicking a selected tag removes it.
    click(page.all('#chosen .chip').find((c) => c.textContent === 'Techno'));
    await page.waitFor(() => page.all('.preset').length === 2, 'Techno removed');
    expect(page.all('#chosen .chip').map((c) => c.textContent)).toEqual(['Bass']);
    expect(names(page)).toEqual(['Bass Rig', 'Fat Bass']);

    // The first click makes the track ...
    click(page.all('.preset').find((b) => b.querySelector('.name')?.textContent === 'Fat Bass'));
    await page.waitFor(() => !(page.document.getElementById('mode') as HTMLElement).hidden, 'replace mode');
    expect(page.text('#mode')).toContain('Fat Bass');
    const track = '/sessions/abc/tracks/t2';
    expect(engine.value(track, 'track_type')).toBe('instrument');
    expect(engine.value(`${track}/effects/instrument`, 'preset_uid')).toBe('p_fat_bass');
    await page.waitFor(() => page.all('.preset[data-current="true"]').length === 1, 'the current preset to be marked');

    // ... and the next ones replace its preset instead of making more tracks.
    click(page.all('.preset').find((b) => b.querySelector('.name')?.textContent === 'Bass Rig'));
    await page.waitFor(() => engine.value(track, 'preset_uid') === 'tp_bass', 'the preset to be replaced');
    expect(engine.children('/sessions/abc/tracks')).toHaveLength(2);
    expect(engine.requests.filter((r) => r.path === '/presets/devices/track/load')).toHaveLength(1);

    click(page.document.getElementById('done') ?? undefined);
    await page.waitFor(() => (page.document.getElementById('mode') as HTMLElement).hidden, 'back to new tracks');
    click(page.all('.preset').find((b) => b.querySelector('.name')?.textContent === 'Fat Bass'));
    await page.waitFor(() => engine.children('/sessions/abc/tracks').length === 3, 'a second new track');
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

describe('examples/folders.html', () => {
  const rowName = (tr: Element) => (tr.querySelector('.name')?.textContent ?? '').replace('▾ ', '');
  const rowOf = (page: Awaited<ReturnType<typeof loadExamplePage>>, name: string) => page.all('#tree tr').find((tr) => rowName(tr) === name);
  const choose = (page: Awaited<ReturnType<typeof loadExamplePage>>, select: Element | null | undefined, value: string) => {
    const sel = select as HTMLSelectElement;
    sel.value = value;
    sel.dispatchEvent(new page.window.Event('change'));
  };

  it('creates a folder, a track inside it, moves a track in, and changes the mode (fact 136)', async () => {
    const engine = engineWithSession(['Vocal', 'Bass']);
    const page = await loadExamplePage('folders.html', engine);
    await page.waitFor(() => page.text('#count') === '2 tracks and buses, 0 folders', 'the tree');

    (page.document.getElementById('folderName') as HTMLInputElement).value = 'Rhythm';
    (page.document.getElementById('createFolder') as HTMLButtonElement).click();
    await page.waitFor(() => rowOf(page, 'Rhythm') !== undefined && page.text('#count').endsWith('1 folder'), 'the folder row');
    const folderId = rowOf(page, 'Rhythm')!.getAttribute('data-id')!;
    expect(rowOf(page, 'Rhythm')!.querySelector('.kind')?.textContent).toBe('folder (summing)');
    expect(rowOf(page, 'Rhythm')!.querySelector('.routes')?.textContent).toBe('Main Output');

    // A new track inside the folder routes through it, and is drawn under it.
    await page.waitFor(() => page.text('#status') === 'Create folder: done', 'the folder to finish');
    await page.waitFor(() => [...(page.document.getElementById('trackParent') as HTMLSelectElement).options].some((o) => o.value === folderId), 'the folder in the picker');
    (page.document.getElementById('trackParent') as HTMLSelectElement).value = folderId;
    (page.document.getElementById('trackName') as HTMLInputElement).value = 'Kick';
    (page.document.getElementById('createTrack') as HTMLButtonElement).click();
    await page.waitFor(() => rowOf(page, 'Kick')?.querySelector('.routes')?.textContent === 'Rhythm', 'the track to route through the folder');
    const names = () => page.all('#tree tr').map(rowName);
    expect(names().indexOf('Kick')).toBe(names().indexOf('Rhythm') + 1);

    // Move Bass in from its row.
    choose(page, rowOf(page, 'Bass')?.querySelector('select'), folderId);
    await page.waitFor(() => rowOf(page, 'Bass')?.querySelector('.routes')?.textContent === 'Rhythm', 'Bass to move into the folder');
    expect(engine.value('/sessions/abc/tracks/Bass', 'folder_uid')).toBe(folderId);

    // A container folder only groups: its tracks route past it to the master.
    const mode = rowOf(page, 'Rhythm')!.querySelectorAll('select')[1];
    choose(page, mode, 'container');
    await page.waitFor(() => rowOf(page, 'Bass')?.querySelector('.routes')?.textContent === 'Main Output', 'Bass to route past the container');
    expect(rowOf(page, 'Rhythm')!.querySelector('.kind')?.textContent).toBe('folder (container)');
    page.close();
  });

  it('moves rows up and down among their siblings, a folder with its contents (fact 137)', async () => {
    const engine = engineWithSession(['Vocal', 'Bass']);
    const page = await loadExamplePage('folders.html', engine);
    await page.waitFor(() => page.text('#count') === '2 tracks and buses, 0 folders', 'the tree');
    const names = () => page.all('#tree tr').map(rowName);
    const button = (name: string, label: string) => rowOf(page, name)?.querySelector(`button[aria-label="${label} ${name}"]`) as HTMLButtonElement | null;
    // The first frames can come before every row's order has loaded; wait for the settled one.
    await page.waitFor(() => names().join() === 'Vocal,Bass' && button('Vocal', 'Move up')?.disabled === true && button('Bass', 'Move down')?.disabled === true && button('Vocal', 'Move down')?.disabled === false, 'the first and last rows to stop at the ends');

    button('Vocal', 'Move down')!.click();
    await page.waitFor(() => names().join() === 'Bass,Vocal' && page.text('#status') === 'Move down Vocal: done', 'Vocal to move down');

    (page.document.getElementById('folderName') as HTMLInputElement).value = 'Kit';
    (page.document.getElementById('createFolder') as HTMLButtonElement).click();
    await page.waitFor(() => page.text('#status') === 'Create folder: done' && rowOf(page, 'Kit') !== undefined, 'the folder');
    const kit = rowOf(page, 'Kit')!.getAttribute('data-id')!;
    (page.document.getElementById('trackParent') as HTMLSelectElement).value = kit;
    (page.document.getElementById('trackName') as HTMLInputElement).value = 'Kick';
    (page.document.getElementById('createTrack') as HTMLButtonElement).click();
    await page.waitFor(() => names().join() === 'Bass,Vocal,Kit,Kick', 'Kick inside Kit');

    // Kit moves up past Vocal and takes Kick with it; Kick alone in Kit cannot move.
    await page.waitFor(() => button('Kit', 'Move up')?.disabled === false, 'the buttons back');
    button('Kit', 'Move up')!.click();
    await page.waitFor(() => names().join() === 'Bass,Kit,Kick,Vocal', 'Kit to move up with Kick');
    await page.waitFor(() => button('Kick', 'Move up')?.disabled === true && button('Kick', 'Move down')?.disabled === true, 'Kick to stop at both ends of Kit');
    page.close();
  });

  it('does not offer a folder as a destination inside itself', async () => {
    const engine = engineWithSession(['Vocal']);
    const page = await loadExamplePage('folders.html', engine);
    await page.waitFor(() => page.text('#count').startsWith('1 tracks and buses'), 'the tree');
    (page.document.getElementById('createFolder') as HTMLButtonElement).click();
    await page.waitFor(() => rowOf(page, 'Folder') !== undefined, 'the folder row');
    const options = [...(rowOf(page, 'Folder')!.querySelector('select') as HTMLSelectElement).options].map((o) => o.value);
    expect(options).toEqual(['-', '']);
    page.close();
  });
});

describe('examples/order.html', () => {
  const rowName = (tr: Element) => (tr.querySelector('.name')?.textContent ?? '').replace('▾ ', '');
  const rows = (page: Awaited<ReturnType<typeof loadExamplePage>>) => page.all('#rows tr').map((tr) => `${tr.querySelector('.order')?.textContent}.${rowName(tr)}`);
  const rowOf = (page: Awaited<ReturnType<typeof loadExamplePage>>, name: string) => page.all('#rows tr').find((tr) => rowName(tr) === name);
  const choose = (page: Awaited<ReturnType<typeof loadExamplePage>>, select: Element | null | undefined, value: string) => {
    const sel = select as HTMLSelectElement;
    sel.value = value;
    sel.dispatchEvent(new page.window.Event('change'));
  };
  const done = (page: Awaited<ReturnType<typeof loadExamplePage>>, label: string) => page.waitFor(() => page.text('#status') === `${label}: done`, label);

  it("lists every track and bus with LUNA's one order, and hides LUNA's own on request (fact 137)", async () => {
    const engine = engineWithSession(['Vocal', 'Bass']);
    const page = await loadExamplePage('order.html', engine);
    await page.waitFor(() => rows(page).join() === '1.CUE 1,2.CUE 2,3.CUE 3,4.CUE 4,5.Main Output,6.Vocal,7.Bass', 'every channel with its order');
    expect(page.text('#count')).toBe('7 tracks and buses, 7 shown');
    const system = page.document.getElementById('system') as HTMLInputElement;
    system.checked = false;
    system.dispatchEvent(new page.window.Event('change'));
    await page.waitFor(() => rows(page).join() === '6.Vocal,7.Bass', "LUNA's own hidden, gaps showing");
    page.close();
  });

  /**
   * Drag `from` onto `onto`, with `y` deciding the half: jsdom lays nothing out, so every row's
   * box is 0 high at 0 and y < 0 means "above", y >= 0 "below".
   */
  function dragRows(page: Awaited<ReturnType<typeof loadExamplePage>>, from: string, onto: string, where: 'before' | 'after', x = 10) {
    // x picks the level below a folder's last row: 18 px a level from the name's left (0 here).
    const y = where === 'before' ? -1 : 1;
    const fire = (el: EventTarget, type: string, init: MouseEventInit) => el.dispatchEvent(new page.window.MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init }));
    fire(rowOf(page, from)!, 'pointerdown', { clientX: 10, clientY: 0 });
    fire(page.document, 'pointermove', { clientX: 10, clientY: 30 });          // past the click slop
    fire(rowOf(page, onto)!, 'pointermove', { clientX: x, clientY: y });
    const ghost = page.text('#ghost');
    fire(page.document, 'pointerup', { clientX: x, clientY: y });
    return ghost;
  }
  const click = (page: Awaited<ReturnType<typeof loadExamplePage>>, name: string, keys: MouseEventInit = {}) => {
    const tr = rowOf(page, name)!;
    tr.dispatchEvent(new page.window.MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: 10, clientY: 0, ...keys }));
    page.document.dispatchEvent(new page.window.MouseEvent('pointerup', { bubbles: true, button: 0, clientX: 10, clientY: 0 }));
  };
  const selectedNames = (page: Awaited<ReturnType<typeof loadExamplePage>>) => page.all('#rows tr.selected').map(rowName);

  async function userTracks(names: string[]) {
    const engine = engineWithSession(names);
    const page = await loadExamplePage('order.html', engine);
    await page.waitFor(() => page.all('#rows tr').length === 5 + names.length, 'the rows');
    const system = page.document.getElementById('system') as HTMLInputElement;
    system.checked = false;
    system.dispatchEvent(new page.window.Event('change'));
    await page.waitFor(() => page.all('#rows tr').length === names.length, 'the user tracks');
    return { engine, page };
  }

  it('selects with click, Cmd/Ctrl-click (with gaps) and Shift-click, and clears with Esc', async () => {
    const { page } = await userTracks(['A', 'B', 'C', 'D', 'E']);
    click(page, 'B');
    expect(selectedNames(page)).toEqual(['B']);
    click(page, 'D', { metaKey: true });
    click(page, 'E', { ctrlKey: true });
    expect(selectedNames(page)).toEqual(['B', 'D', 'E']);
    click(page, 'D', { metaKey: true });
    expect(selectedNames(page)).toEqual(['B', 'E']);
    click(page, 'A');
    click(page, 'C', { shiftKey: true });
    expect(selectedNames(page)).toEqual(['A', 'B', 'C']);
    expect(page.text('#selection')).toBe('3 selected');
    click(page, 'B');                                    // a plain click narrows to that row
    expect(selectedNames(page)).toEqual(['B']);
    page.document.dispatchEvent(new page.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(selectedNames(page)).toEqual([]);
    page.close();
  });

  it('drags one row above or below another, one undo entry each (fact 137)', async () => {
    const { engine, page } = await userTracks(['A', 'B', 'C']);
    dragRows(page, 'C', 'A', 'before');
    await done(page, 'Move C');
    await page.waitFor(() => rows(page).join() === '6.C,7.A,8.B', 'C dropped just above A, the hidden rows left where they are');
    dragRows(page, 'C', 'A', 'after');
    await done(page, 'Move C');
    await page.waitFor(() => rows(page).join() === '6.A,7.C,8.B', 'C dropped below A');
    expect(engine.requests.filter((r) => r.path.endsWith('/move_to_folder'))).toHaveLength(2);
    page.close();
  });

  it('drags a selection with gaps as one block, in list order, wherever the drag starts', async () => {
    const { engine, page } = await userTracks(['A', 'B', 'C', 'D', 'E']);
    click(page, 'A');
    click(page, 'C', { metaKey: true });
    click(page, 'E', { metaKey: true });
    dragRows(page, 'C', 'D', 'after');                   // drag starts on the middle one
    await done(page, 'Move 3 rows');
    await page.waitFor(() => rows(page).join() === '6.B,7.D,8.A,9.C,10.E', 'A, C and E together after D');
    const post = engine.requests.filter((r) => r.path.endsWith('/move_to_folder')).at(-1)!;
    expect(post.data).toEqual({ session_uid: 'abc', after_uids: ['A', 'C', 'E'], before_uid: 'D' });
    expect(selectedNames(page)).toEqual(['A', 'C', 'E']);  // the selection stays on the moved rows
    page.close();
  });

  it('a click without a drag moves nothing; a selected row is not a drop target', async () => {
    const { engine, page } = await userTracks(['A', 'B']);
    click(page, 'A');
    dragRows(page, 'A', 'A', 'after');
    expect(page.all('#rows tr.drop-before, #rows tr.drop-after')).toEqual([]);
    expect(engine.requests.some((r) => r.path.endsWith('/change_order'))).toBe(false);
    expect(page.document.body.classList.contains('dragging')).toBe(false);
    page.close();
  });

  async function withKit(names: string[]) {
    const { engine, page } = await userTracks(names);
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.session();
    await session.ready();
    const kit = await session.newFolder({ name: 'Kit' });
    await session.newTrack({ name: 'Kick', folderUid: kit.id });
    return { engine, page, session, kit };
  }
  const folderOf = (engine: Luna.MockEngine, track: string) => engine.value(`/sessions/abc/tracks/${track}`, 'folder_uid');

  it('drops into a folder: below the folder row (first), or above a row inside it (fact 136)', async () => {
    const { engine, page, kit } = await withKit(['A', 'B']);
    await page.waitFor(() => rows(page).join() === '6.A,7.B,8.Kit,9.Kick', 'the folder in the list');

    expect(dragRows(page, 'A', 'Kit', 'after')).toBe('A → in Kit');
    await done(page, 'Move A');
    await page.waitFor(() => rows(page).join() === '6.B,7.Kit,8.A,9.Kick', 'A first in Kit');
    expect(folderOf(engine, 'A')).toBe(kit.id);
    expect(engine.requests.filter((r) => r.path.endsWith('/move_to_folder')).at(-1)!.data).toEqual({ session_uid: 'abc', after_uids: ['A'], folder_uid: kit.id, before_uid: kit.id });

    expect(dragRows(page, 'B', 'Kick', 'before')).toBe('B → in Kit');
    await done(page, 'Move B');
    await page.waitFor(() => rows(page).join() === '6.Kit,7.A,8.B,9.Kick', 'B just above Kick, in Kit');
    expect(folderOf(engine, 'B')).toBe(kit.id);
    // The routing follows: a summing folder is its tracks' bus.
    await page.waitFor(() => engine.value('/sessions/abc/tracks/B/outputs/main', 'assignments') !== undefined, 'routing');
    expect((engine.value('/sessions/abc/tracks/B/outputs/main', 'assignments') as Array<{ value: string }>)[0]!.value).toBe(kit.id);
    page.close();
  });

  it("below a folder's last row, the pointer's x picks in the folder or after it", async () => {
    const { engine, page, kit } = await withKit(['A', 'B']);
    await page.waitFor(() => rows(page).join() === '6.A,7.B,8.Kit,9.Kick', 'the folder in the list');
    expect(dragRows(page, 'A', 'Kick', 'after', 40)).toBe('A → in Kit');       // one level in
    await done(page, 'Move A');
    await page.waitFor(() => rows(page).join() === '6.B,7.Kit,8.Kick,9.A', 'A last in Kit');
    expect(folderOf(engine, 'A')).toBe(kit.id);

    expect(dragRows(page, 'B', 'A', 'after', 10)).toBe('B → top level');       // left: out of Kit
    await done(page, 'Move B');
    await page.waitFor(() => rows(page).join() === '6.Kit,7.Kick,8.A,9.B', 'B after the whole folder');
    expect(folderOf(engine, 'B')).toBeNull();

    // And out again: A from inside Kit to the top level, by dropping it above B.
    dragRows(page, 'A', 'B', 'before');
    await done(page, 'Move A');
    await page.waitFor(() => rows(page).join() === '6.Kit,7.Kick,8.A,9.B' && folderOf(engine, 'A') === null, 'A out of Kit');
    page.close();
  });

  it('moves a folder with its contents into another folder, never into itself, with a selection with gaps', async () => {
    const { engine, page, session, kit } = await withKit(['A', 'B']);
    const band = await session.newFolder({ name: 'Band' });
    await page.waitFor(() => rows(page).join() === '6.A,7.B,8.Kit,9.Kick,10.Band', 'two folders');

    click(page, 'Kit');
    click(page, 'A', { metaKey: true });
    // Band is empty and last, so below it x picks the level: one level in is inside Band.
    expect(dragRows(page, 'Kit', 'Band', 'after', 40)).toBe('2 rows → in Band');
    await done(page, 'Move 2 rows');
    await page.waitFor(() => rows(page).join() === '6.B,7.Band,8.A,9.Kit,10.Kick', 'A then Kit (with Kick) first in Band');
    const kick = session.tracks.items.find((t) => t.name.value === 'Kick')!;
    expect([folderOf(engine, 'A'), engine.value(`/sessions/abc/buses/${kit.id}`, 'folder_uid'), folderOf(engine, kick.id)]).toEqual([band.id, band.id, kit.id]);

    // Band onto its own contents is no target.
    click(page, 'Band');
    dragRows(page, 'Band', 'Kick', 'after');
    expect(page.text('#status')).toBe('Move 2 rows: done');

    (rowOf(page, 'B')!.querySelector('button[aria-label="Move down B"]') as HTMLButtonElement).click();
    await done(page, 'Move down B');
    await page.waitFor(() => rows(page).join() === '6.Band,7.A,8.Kit,9.Kick,10.B', 'B below Band with ▼');
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

describe('examples/files.html Folders tab', () => {
  function engineWithDisk() {
    const engine = engineWithSession(['Vocal']);
    engine.folders['/Users/me/Samples'] = ['kick.wav', 'Loops/', '.DS_Store', 'notes.txt', 'cover.png'];
    engine.folders['/Users/me/Samples/Loops'] = ['beat.aif'];
    engine.folders['/Users/me/Movies'] = [];
    engine.grantFolder('/Users/me/Samples');
    engine.grantFolder('/Users/me/Movies');
    engine.grantFolder('/Volumes/Gone/Takes');   // blessed, on a drive that is not connected
    return engine;
  }
  type Page = Awaited<ReturnType<typeof loadExamplePage>>;
  const names = (page: Page) => page.all('#fList td.name').map((n) => n.textContent);
  const kinds = (page: Page) => page.all('#fList td.kind').map((n) => n.textContent);
  // Each sidebar row as its label, indented two spaces per level, '▸'/'▾' when it can open or is open.
  const sidebar = (page: Page) => page.all('#fSidebar li').map((li) => {
    const depth = (parseInt((li as HTMLElement).style.paddingLeft || '8', 10) - 8) / 14;
    const twisty = li.querySelector('.twisty')?.textContent ?? '';
    const flag = li.querySelector('.flag') ? ' (Not available)' : '';
    return `${'  '.repeat(depth)}${twisty}${li.querySelector('.label')?.textContent ?? li.textContent}${flag}`;
  });
  const notice = (page: Page) => ((page.document.querySelector('#fNotice') as HTMLElement).hidden ? '' : page.text('#fNotice'));
  const dblclick = (page: Page, el: Element) => el.dispatchEvent(new page.window.MouseEvent('dblclick', { bubbles: true }));

  it('lists the blessed folders, opens one like the Finder, and walks into and back out of a subfolder', async () => {
    const page = await loadExamplePage('files.html', engineWithDisk(), { search: '?tab=folders&folder=/Users/me/Samples' });
    expect((page.document.querySelector('#folders') as HTMLElement).hidden).toBe(false);
    expect((page.document.querySelector('#routes') as HTMLElement).hidden).toBe(true);
    await page.waitFor(() => names(page).length === 4, 'the listing');
    expect(names(page)).toEqual(['📄cover.png', '🎵kick.wav', '📁Loops', '📄notes.txt'].map((n) => n.replace('📄cover', '🖼️cover')));
    expect(kinds(page)).toEqual(['Image', 'Audio', 'Folder', 'Text']);
    expect(page.text('#fCount')).toBe('4 items (1 folder, 3 files)');
    expect(page.all('#fSidebar li.current .label').map((li) => li.textContent)).toEqual(['Samples']);
    // Only audio gets an Import button.
    expect(page.all('#fList button.import')).toHaveLength(1);
    expect((page.document.querySelector('#fUp') as HTMLButtonElement).disabled).toBe(true); // the top of the blessed folder
    dblclick(page, page.all('#fList tr')[2]!);
    await page.waitFor(() => names(page).join() === '🎵beat.aif', 'the subfolder');
    expect(page.all('#fCrumbs button').map((b) => b.textContent)).toEqual(['Samples', 'Loops']);
    (page.document.querySelector('#fBack') as HTMLButtonElement).click();
    await page.waitFor(() => names(page).length === 4, 'back');
    (page.document.querySelector('#fForward') as HTMLButtonElement).click();
    await page.waitFor(() => names(page).length === 1, 'forward');
    (page.document.querySelector('#fUp') as HTMLButtonElement).click();
    await page.waitFor(() => names(page).length === 4, 'up');
    page.close();
  });

  it('shows a blessed folder that is not there as not available, and an empty one as empty', async () => {
    const page = await loadExamplePage('files.html', engineWithDisk(), { search: '?tab=folders&folder=/Users/me/Movies' });
    await page.waitFor(() => notice(page).includes('Empty folder'), 'the empty folder');
    expect(page.text('#fCount')).toBe('0 items');
    await page.waitFor(() => sidebar(page).some((t) => t.includes('Not available')), 'the missing folder flagged');
    expect(sidebar(page)).toEqual(['Movies', '▸Samples', 'Takes (Not available)']);
    (page.all('#fSidebar li')[2] as HTMLElement).click();
    await page.waitFor(() => notice(page).includes('“Takes” is not available'), 'the not-available notice');
    expect(notice(page)).toContain('drive it is on is not connected');
    expect(names(page)).toEqual([]);
    page.close();
  });

  it('a folder removed from the blessed folders while open becomes not available, and asking LUNA brings it back', async () => {
    const engine = engineWithDisk();
    const page = await loadExamplePage('files.html', engine, { search: '?tab=folders&folder=/Users/me/Samples' });
    await page.waitFor(() => names(page).length === 4, 'the listing');
    engine.grantedFolders = engine.grantedFolders.filter((f) => f !== '/Users/me/Samples');
    await page.waitFor(() => notice(page).includes('not in a blessed folder'), 'the not-permitted notice');
    expect(sidebar(page).join()).not.toContain('Samples');
    engine.blessAnswer = 'allow';
    (page.document.querySelector('#fNotice button') as HTMLButtonElement).click();
    await page.waitFor(() => names(page).length === 4, 'the folder back');
    expect(engine.blessRequests).toEqual(['/Users/me/Samples']);
    page.close();
  });

  it('imports an audio file onto a new track at the playhead, with the button or by double-click', async () => {
    const engine = engineWithDisk();
    engine.setValue('/sessions/abc', 'play_start', 4 * Luna.TICKS_PER_BEAT);
    const page = await loadExamplePage('files.html', engine, { search: '?tab=folders&folder=/Users/me/Samples' });
    await page.waitFor(() => page.all('#fList button.import').length === 1 && !(page.document.querySelector('#fList button.import') as HTMLButtonElement).disabled, 'an enabled Import');
    const tracksBefore = engine.children('/sessions/abc/tracks').length;
    (page.document.querySelector('#fList button.import') as HTMLButtonElement).click();
    await page.waitFor(() => page.text('#fMessage').startsWith('Imported'), 'the import');
    expect(page.text('#fMessage')).toContain('“kick” onto a new track at 2|1|');
    expect(engine.children('/sessions/abc/tracks')).toHaveLength(tracksBefore + 1);
    const insert = engine.requests.find((r) => r.path.endsWith('/insert_clip'))!.data as { start: number };
    expect(insert.start).toBe(4 * Luna.TICKS_PER_BEAT);
    dblclick(page, page.all('#fList tr')[1]!);
    await page.waitFor(() => engine.children('/sessions/abc/tracks').length === tracksBefore + 2, 'the second import');
    page.close();
  });

  it('Add Folder blesses and opens the folder chosen in LUNA’s dialog; arrows and Enter move and open', async () => {
    const engine = engineWithDisk();
    engine.grantedFolders = [];
    engine.nextDialogFiles = ['/Users/me/Samples'];
    const page = await loadExamplePage('files.html', engine, { search: '?tab=folders' });
    await page.waitFor(() => !(page.document.querySelector('#fAdd') as HTMLButtonElement).disabled, 'the page to connect');
    expect(notice(page)).toContain('No folder open');
    (page.document.querySelector('#fAdd') as HTMLButtonElement).click();
    await page.waitFor(() => names(page).length === 4 && sidebar(page).join() === '▸Samples', 'the chosen folder');
    const list = page.document.querySelector('#fList')!;
    const key = (k: string) => list.dispatchEvent(new page.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    key('ArrowDown'); key('ArrowDown'); key('ArrowDown');
    expect(page.all('#fList tr.selected').map((tr) => tr.textContent)).toEqual(['📁LoopsFolder›']);
    key('Enter');
    await page.waitFor(() => names(page).join() === '🎵beat.aif', 'the subfolder');
    page.close();
  });

  it('a double-click opens a subfolder (a click only selects), and the sidebar tree follows it down and opens subfolders itself', async () => {
    const engine = engineWithDisk();
    engine.folders['/Users/me/Samples/Loops'] = ['beat.aif', 'Drums/'];
    engine.folders['/Users/me/Samples/Loops/Drums'] = ['snare.wav'];
    const page = await loadExamplePage('files.html', engine, { search: '?tab=folders&folder=/Users/me/Samples' });
    await page.waitFor(() => names(page).length === 4, 'the listing');
    expect(sidebar(page)).toEqual(['Movies', '▸Samples', 'Takes (Not available)']);
    // A click selects; a double-click opens.
    (page.all('#fList tr.dir')[0] as HTMLElement).click();
    expect(page.all('#fList tr.selected').map((tr) => tr.querySelector('td.name')!.textContent)).toEqual(['📁Loops']);
    expect(names(page)).toHaveLength(4);
    dblclick(page, page.all('#fList tr.dir')[0]!);
    await page.waitFor(() => names(page).join() === '🎵beat.aif,📁Drums', 'Loops');
    await page.waitFor(() => sidebar(page).join('|') === 'Movies|▾Samples|  ▸Loops|Takes (Not available)', 'the tree down to Loops');
    expect(page.all('#fSidebar li.current .label').map((l) => l.textContent)).toEqual(['Loops']);
    // The triangle opens Loops in the tree without leaving the window's folder...
    const loops = () => page.all('#fSidebar li').find((li) => li.querySelector('.label')?.textContent === 'Loops') as HTMLElement;
    (loops().querySelector('.twisty') as HTMLElement).click();
    await page.waitFor(() => sidebar(page).includes('    ▸Drums'), 'Drums in the tree');
    expect(names(page).join()).toBe('🎵beat.aif,📁Drums');
    // ...and a folder in the tree opens in the window.
    (page.all('#fSidebar li').find((li) => li.querySelector('.label')?.textContent === 'Drums') as HTMLElement).click();
    await page.waitFor(() => names(page).join() === '🎵snare.wav', 'Drums');
    expect(page.all('#fCrumbs button').map((b) => b.textContent)).toEqual(['Samples', 'Loops', 'Drums']);
    // Closing a branch hides it.
    (loops().querySelector('.twisty') as HTMLElement).click();
    await page.waitFor(() => !sidebar(page).includes('    ▸Drums'), 'Loops closed');
    page.close();
  });

  it('says why Import is off while no session is open, and turns it on when one opens', async () => {
    const engine = new Luna.MockEngine();
    engine.folders['/Users/me/Samples'] = ['kick.wav'];
    engine.grantFolder('/Users/me/Samples');
    const page = await loadExamplePage('files.html', engine, { search: '?tab=folders&folder=/Users/me/Samples' });
    await page.waitFor(() => page.text('#fMessage').startsWith('Import needs a session'), 'the no-session message');
    expect((page.document.querySelector('#fList button.import') as HTMLButtonElement).disabled).toBe(true);
    engine.addSession('abc', { tracks: ['Vocal'], name: 'Later', packageUid: 'pkg_abc' });
    engine.setValue('/sessions', 'focused_session', 'abc');
    await page.waitFor(() => !(page.document.querySelector('#fList button.import') as HTMLButtonElement).disabled, 'Import on');
    expect(page.text('#fMessage')).toBe('');
    page.close();
  });

  it('a hidden notice is not displayed, so it cannot cover the list and take its clicks', async () => {
    const page = await loadExamplePage('files.html', engineWithDisk(), { search: '?tab=folders&folder=/Users/me/Samples' });
    await page.waitFor(() => names(page).length === 4, 'the listing');
    expect((page.document.querySelector('#fNotice') as HTMLElement).hidden).toBe(true);
    // `.finder .notice` sets display: flex, which beats the hidden attribute: without a rule
    // for `[hidden]` the empty notice sat over the list in a real browser and took every
    // click. jsdom does not cascade that, so check the rule is there.
    const rules = [...page.document.styleSheets].flatMap((sheet) => [...sheet.cssRules]) as CSSStyleRule[];
    expect(rules.some((r) => /\.notice\[hidden\]/.test(r.selectorText ?? '') && r.style.display === 'none')).toBe(true);
    page.close();
  });

  it('removes a blessed folder from the sidebar with a confirmed ✕, moving the window off it', async () => {
    const engine = engineWithDisk();
    const page = await loadExamplePage('files.html', engine, { search: '?tab=folders&folder=/Users/me/Samples' });
    await page.waitFor(() => names(page).length === 4, 'the listing');
    const row = (label: string) => page.all('#fSidebar li').find((li) => li.querySelector('.label')?.textContent === label) as HTMLElement | undefined;
    // Only the blessed folders have one, not the folders inside them.
    (row('Samples')!.querySelector('.twisty') as HTMLElement).click();
    await page.waitFor(() => row('Loops') !== undefined, 'Loops in the tree');
    expect(row('Loops')!.querySelector('.remove')).toBeNull();
    const x = row('Samples')!.querySelector('.remove') as HTMLButtonElement;
    expect(x.textContent).toBe('✕');
    x.click();
    // The first click only asks.
    expect(x.textContent).toBe('Remove');
    expect(engine.grantedFolders).toContain('/Users/me/Samples');
    x.click();
    await page.waitFor(() => !engine.grantedFolders.includes('/Users/me/Samples'), 'the removal');
    expect(engine.requests.some((r) => r.path === '/gui/remove_blessed_folder')).toBe(true);
    // The window was inside it, so it moves to another blessed folder, with no way back into it.
    await page.waitFor(() => page.all('#fCrumbs button').map((b) => b.textContent).join() === 'Movies', 'the next folder');
    await page.waitFor(() => !sidebar(page).some((t) => t.includes('Samples')), 'Samples gone from the sidebar');
    expect(page.text('#fMessage')).toContain('Removed “Samples”');
    expect((page.document.querySelector('#fBack') as HTMLButtonElement).disabled).toBe(true);
    page.close();
  });

  it('removes a blessed folder that is not there from its notice, and one with the Delete key', async () => {
    const engine = engineWithDisk();
    const page = await loadExamplePage('files.html', engine, { search: '?tab=folders&folder=/Volumes/Gone/Takes' });
    await page.waitFor(() => notice(page).includes('“Takes” is not available'), 'the not-available notice');
    (page.document.querySelector('#fNotice button') as HTMLButtonElement).click();
    await page.waitFor(() => !engine.grantedFolders.includes('/Volumes/Gone/Takes'), 'the removal');
    await page.waitFor(() => page.all('#fCrumbs button').map((b) => b.textContent).join() === 'Samples', 'the next folder');
    const movies = page.all('#fSidebar li').find((li) => li.querySelector('.label')?.textContent === 'Movies')!;
    const key = (k: string) => movies.dispatchEvent(new page.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    key('Delete');
    expect(engine.grantedFolders).toContain('/Users/me/Movies');   // asked, not removed
    key('Delete');
    await page.waitFor(() => engine.grantedFolders.join() === '/Users/me/Samples', 'Movies removed');
    page.close();
  });

  it('removing the last blessed folder leaves no folder open', async () => {
    const engine = new Luna.MockEngine();
    engine.folders['/Users/me/Samples'] = ['kick.wav'];
    engine.grantFolder('/Users/me/Samples');
    const page = await loadExamplePage('files.html', engine, { search: '?tab=folders&folder=/Users/me/Samples' });
    await page.waitFor(() => names(page).length === 1, 'the listing');
    const x = page.document.querySelector('#fSidebar .remove') as HTMLButtonElement;
    x.click(); x.click();
    await page.waitFor(() => notice(page).includes('No folder open'), 'no folder open');
    expect(page.all('#fCrumbs button')).toHaveLength(0);
    await page.waitFor(() => page.text('#fSidebar').includes('None yet'), 'the empty sidebar');
    page.close();
  });

  it('Add Folder with DON’T ALLOW in LUNA’s prompt shows the folder as not available, with a way to ask again', async () => {
    const engine = engineWithDisk();
    engine.grantedFolders = [];
    engine.blessAnswer = 'dont_allow';
    engine.nextDialogFiles = ['/Users/me/Samples'];
    const page = await loadExamplePage('files.html', engine, { search: '?tab=folders' });
    await page.waitFor(() => !(page.document.querySelector('#fAdd') as HTMLButtonElement).disabled, 'the page to connect');
    (page.document.querySelector('#fAdd') as HTMLButtonElement).click();
    await page.waitFor(() => notice(page).includes('not in a blessed folder'), 'the not-allowed notice');
    expect(engine.blessRequests).toEqual(['/Users/me/Samples']);
    expect(page.text('#fSidebar')).toContain('None yet');
    engine.blessAnswer = 'allow';
    (page.document.querySelector('#fNotice button') as HTMLButtonElement).click();
    await page.waitFor(() => names(page).length === 4, 'the folder once allowed');
    page.close();
  });

  it('a blessed folder’s ✕ takes only its own width, leaving the row to the folder’s name', async () => {
    const page = await loadExamplePage('files.html', engineWithDisk(), { search: '?tab=folders&folder=/Users/me/Samples' });
    await page.waitFor(() => page.all('#fSidebar .remove').length === 3, 'the sidebar');
    // jsdom does not lay out, so check the rules: none that reaches the ✕ may size it, as the
    // sidebar's full-width Add Folder rule once did, squeezing the name to nothing.
    const x = page.document.querySelector('#fSidebar .remove')!;
    const rules = [...page.document.styleSheets].flatMap((sheet) => [...sheet.cssRules]) as CSSStyleRule[];
    const sizing = rules.filter((r) => r.selectorText && x.matches(r.selectorText) && r.style.width && r.style.width !== 'auto');
    expect(sizing.map((r) => `${r.selectorText} { width: ${r.style.width} }`)).toEqual([]);
    page.close();
  });

  it('without /gui says there are no folders', async () => {
    const engine = new Luna.MockEngine({ gui: false });
    engine.addSession('abc', { tracks: ['Vocal'], name: 'Demo', packageUid: 'pkg_abc' });
    const page = await loadExamplePage('files.html', engine, { search: '?tab=folders' });
    await page.waitFor(() => notice(page).includes('no /gui'), 'the no-gui notice');
    expect((page.document.querySelector('#fAdd') as HTMLButtonElement).disabled).toBe(true);
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
    const clipUid = engine.addMidiClip('abc', 'Keys', { startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT });
    await engine.settled();
    const playlist = engine.children('/sessions/abc/playlists')[0]!;
    const clipPath = `/sessions/abc/playlists/${playlist}/clips/${clipUid}`;
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
    engine.grantFolder('/Samples');   // chosen or dropped in an earlier run
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
    engine.grantedFolders = [];
    engine.nextDialogFiles = ['/Samples/Loops'];
    const page = await loadExamplePage('browse.html', engine);
    await page.waitFor(() => !(page.document.querySelector('#choose') as HTMLButtonElement).disabled, 'the page to connect');
    (page.document.querySelector('#choose') as HTMLButtonElement).click();
    await page.waitFor(() => names(page).join() === 'beat.aif', 'the chosen folder');
    const go = (path: string) => {
      (page.document.querySelector('#path') as HTMLInputElement).value = path;
      page.document.querySelector('#go')!.dispatchEvent(new page.window.Event('submit', { cancelable: true }));
    };
    go('/Samples/Loops/Nope');
    await page.waitFor(() => page.text('#status').includes('uasrv.filesystem_error'), 'the error');
    expect(names(page).join()).toBe('beat.aif'); // the last good listing stays
    // Only the chosen folder was granted, not the one above it.
    go('/Samples');
    await page.waitFor(() => page.text('#status').includes('uasrv.not_permitted'), 'the refusal');
    expect(page.text('#status')).toContain('only folders you gave it');
    expect(names(page).join()).toBe('beat.aif');
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

describe('examples/arrangement.html', () => {
  async function overlapping(options: { compiledClipFades?: boolean } = {}) {
    const engine = new Luna.MockEngine(options);
    engine.addSession('abc', { tracks: ['Gtr'], name: 'Demo', packageUid: 'pkg_abc' });
    engine.addSource('pkg_abc', 'src1', { name: 'take.wav', lengthNs: 10e9 });
    const B = Luna.TICKS_PER_BEAT;
    const playlist = engine.children('/sessions/abc/playlists')[0]!;
    const clips = `/sessions/abc/playlists/${playlist}/clips`;
    for (const [uid, start, stop, layer] of [['under', 0, 8 * B, 0], ['over', 2 * B, 4 * B, 1]] as const) {
      engine.addNode(`${clips}/${uid}`, { properties: { uid, name: uid, start, stop, source_uid: 'src1', source_start: 0, source_stop: ((stop - start) / B) * 0.5e9, clip_type: 0, gain: 0, bypass: false, midi_source_start: 0, layer, mute: false } });
    }
    await engine.settled();
    return { engine, clips };
  }

  it('draws a MIDI clip\'s notes', async () => {
    const { engine } = await overlapping();
    const uid = engine.addMidiClip('abc', 'Gtr', { startTick: 12 * Luna.TICKS_PER_BEAT, stopTick: 16 * Luna.TICKS_PER_BEAT, name: 'keys' });
    const playlist = engine.children('/sessions/abc/playlists')[0]!;
    engine.midiEdit(`/sessions/abc/playlists/${playlist}/clips/${uid}`, 'added', [
      { rowid: 1, tick: 0, status: 0x90, data1: 60, data2: 100 },
      { rowid: 2, tick: Luna.TICKS_PER_BEAT, status: 0x80, data1: 60, data2: 0 },
    ]);
    const page = await loadExamplePage('arrangement.html', engine);
    await page.waitFor(() => page.draws.ops.some((o) => o.name === 'fillRect' && String(o.fillStyle).startsWith('rgba(0, 0, 255,') && (o.args[3] as number) <= 6), 'a note bar');
    page.close();
  });

  it('fills waveforms in the track colour', async () => {
    const { engine } = await overlapping();
    const page = await loadExamplePage('arrangement.html', engine);
    await page.waitFor(() => page.draws.ops.some((o) => o.name === 'fill' && o.fillStyle === 'rgba(0, 0, 255, 1)'), 'a blue waveform');
    page.close();
  });

  it('draws the compiled segments, so the clip on top hides the one beneath', async () => {
    const { engine, clips } = await overlapping();
    const page = await loadExamplePage('arrangement.html', engine);
    await page.waitFor(() => /3 segments/.test(page.text('#timelineStatus')), 'three segments');
    expect(page.text('#timelineStatus')).toContain('0 fades');
    // The page turned publishing on for the lane it draws (fact 116).
    expect(engine.requests.some((r) => r.verb === 'set' && r.path.includes('enable_compiled_clips'))).toBe(true);
    // A fade LUNA reports on a segment is drawn, live.
    const folder = `${clips.replace(/clips$/, 'compiled_clips')}`;
    const seg = engine.children(folder).find((n) => engine.value(`${folder}/${n}`, 'clip_uid') === 'over')!;
    const B = Luna.TICKS_PER_BEAT;
    for (const [k, v] of Object.entries({ fade_in_uid: 'f1', fade_in_start: 2 * B, fade_in_stop: 3 * B, fade_in_shape: 'log', fade_in_curvature: 0, fade_in_crossfade: false })) engine.setValue(`${folder}/${seg}`, k, v);
    await page.waitFor(() => page.text('#timelineStatus').includes('1 fade '), 'the fade');
    expect(page.draws.calls).toContain('lineTo');
    // Removing the clip on top joins the one beneath back into one segment, live.
    engine.removeNode(`${clips}/over`);
    await page.waitFor(() => /1 segment\b/.test(page.text('#timelineStatus')), 'one segment');
    page.close();
  });

  it('says so when LUNA does not report fades', async () => {
    const { engine } = await overlapping({ compiledClipFades: false });
    const page = await loadExamplePage('arrangement.html', engine);
    await page.waitFor(() => /3 segments/.test(page.text('#timelineStatus')), 'three segments');
    expect(page.text('#timelineStatus')).toContain('this LUNA does not report fades');
    page.close();
  });
});

describe('examples/clip-editor.html', () => {
  const B = Luna.TICKS_PER_BEAT;
  async function twoLanes(options: { compiledClipFades?: boolean } = {}) {
    const engine = new Luna.MockEngine(options);
    engine.addSession('abc', { tracks: ['Gtr', 'Bass'], name: 'Demo', packageUid: 'pkg_abc' });
    engine.addSource('pkg_abc', 'src1', { name: 'take.wav', lengthNs: 30e9 });
    const playlists = engine.children('/sessions/abc/playlists');
    const clip = (pl: string, uid: string, startBeat: number, stopBeat: number, sourceS: number) =>
      engine.addNode(`/sessions/abc/playlists/${pl}/clips/${uid}`, {
        properties: { uid, name: uid, start: startBeat * B, stop: stopBeat * B, source_uid: 'src1', source_start: sourceS * 1e9, source_stop: (sourceS + (stopBeat - startBeat) / 2) * 1e9, clip_type: 0, gain: 0, bypass: false, midi_source_start: 0, layer: 0, mute: false },
      });
    clip(playlists[0]!, 'left', 0, 4, 2);
    clip(playlists[0]!, 'right', 4, 8, 10);
    clip(playlists[1]!, 'bass', 8, 12, 20);
    await engine.settled();
    const page = await loadExamplePage('clip-editor.html', engine);
    await page.waitFor(() => /2 lanes · 3 segments/.test(page.text('#status')), 'the lanes');
    const select = async (uid: string) => {
      (page.document.querySelector(`#clips tr[data-clip="${uid}"]`) as HTMLElement).click();
      await page.waitFor(() => page.text('#info').startsWith(uid), `${uid} selected`);
    };
    const press = async (id: string) => {
      await page.waitFor(() => !(page.document.getElementById(id) as HTMLButtonElement).disabled, `${id} enabled`);
      (page.document.getElementById(id) as HTMLButtonElement).click();
    };
    const row = (uid: string) => [...page.document.querySelector(`#clips tr[data-clip="${uid}"]`)!.children].map((c) => c.textContent);
    const clipPath = (uid: string) => `/sessions/abc/playlists/${playlists.find((p) => engine.has(`/sessions/abc/playlists/${p}/clips/${uid}`))}/clips/${uid}`;
    return { engine, page, select, press, row, clipPath };
  }

  it('fades, crossfades and mutes the selected clip from the panel', async () => {
    const { page, select, press, row } = await twoLanes();
    await select('left');
    await press('fadeIn');
    await page.waitFor(() => row('left')[4] === 'in', 'the fade-in');
    await press('crossfade');
    await page.waitFor(() => row('left')[4] === 'in, crossfade out' && row('right')[4] === 'crossfade in', 'the crossfade');
    await press('removeCross');
    await page.waitFor(() => row('right')[4] === '—', 'the crossfade removed');
    await press('mute');
    await page.waitFor(() => row('left')[5] === 'yes', 'muted');
    expect(page.text('#log')).toContain('Mute left');
    expect(page.all('#log .error')).toHaveLength(0);
    page.close();
  });

  it('moves a clip by dragging it, and splits it with the keyboard', async () => {
    const { engine, page, row, clipPath } = await twoLanes();
    // 8 bars across 1100 px: 34.375 px per beat. Lane 2 (Bass) body spans y 116-174.
    const px = 1100 / 32;
    const fire = (type: string, x: number, y: number) => page.document.getElementById('timeline')!.dispatchEvent(new page.window.MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
    fire('pointerdown', 10 * px, 140);
    fire('pointermove', 12 * px, 140);
    fire('pointermove', 14 * px, 140);
    fire('pointerup', 14 * px, 140);
    await page.waitFor(() => engine.value(clipPath('bass'), 'start') === 12 * B, 'the move');
    await page.waitFor(() => row('bass')[2] === '12.00 → 16.00', 'the table');
    // The compiled clips follow the clip by a push: hover until the page sees the moved clip there.
    const canvas = page.document.getElementById('timeline') as HTMLCanvasElement;
    await page.waitFor(() => { fire('pointermove', 14 * px, 140); return canvas.dataset['edit'] === 'move'; }, 'the moved clip under the pointer');
    // A click inside the moved clip places the cursor; S splits there.
    fire('pointerdown', 14 * px, 140);
    fire('pointerup', 14 * px, 140);
    page.document.getElementById('timeline')!.dispatchEvent(new page.window.KeyboardEvent('keydown', { key: 's', bubbles: true }));
    await page.waitFor(() => engine.value(clipPath('bass'), 'stop') === 14 * B, 'the split');
    expect(page.all('#log .error')).toHaveLength(0);
    page.close();
  });

  it('drags only what shows of a clip that another overlaps, splitting it as LUNA does', async () => {
    const { engine, page, clipPath } = await twoLanes();
    // A clip on top of the middle of Bass (beats 8-12): Bass shows at 8-9 and 10-12.
    const bassLane = clipPath('bass').replace(/\/clips\/bass$/, '');
    engine.addNode(`${bassLane}/clips/top`, { properties: { uid: 'top', name: 'top', start: 9 * B, stop: 10 * B, source_uid: 'src1', source_start: 0, source_stop: 0.5e9, clip_type: 0, gain: 0, bypass: false, midi_source_start: 0, layer: 1, mute: false } });
    await page.waitFor(() => /2 lanes · 5 segments/.test(page.text('#status')), 'the split lane');
    await engine.settled();
    await new Promise((r) => setTimeout(r, 20));
    const px = 1100 / 32;
    const canvas = page.document.getElementById('timeline')!;
    const fire = (type: string, x: number) => canvas.dispatchEvent(new page.window.MouseEvent(type, { clientX: x, clientY: 150, bubbles: true }));
    // Grab the first piece (8-9) and drop it 8 beats later.
    fire('pointerdown', 8.5 * px);
    fire('pointermove', 12.5 * px);
    fire('pointermove', 16.5 * px);
    fire('pointerup', 16.5 * px);
    const spans = () => engine.children(`${bassLane}/clips`).map((c) => [c, Number(engine.value(`${bassLane}/clips/${c}`, 'start')) / B, Number(engine.value(`${bassLane}/clips/${c}`, 'stop')) / B]).sort((a, b) => (a[1] as number) - (b[1] as number));
    await page.waitFor(() => spans().some((s) => s[1] === 16 && s[2] === 17), 'the moved piece');
    // Bass kept the rest (9-12, part under the top clip); the top clip did not move.
    expect(spans().map((s) => s.slice(1))).toEqual([[9, 12], [9, 10], [16, 17]]);
    expect(spans().find((s) => s[0] === 'top')!.slice(1)).toEqual([9, 10]);
    expect(page.all('#log .error')).toHaveLength(0);
    page.close();
  });

  it('crossfades a clip on top of the middle of another, at both of its edits', async () => {
    const { engine, page, select, press, row, clipPath } = await twoLanes();
    // A clip on top of the middle of Bass (beats 8-12): edits at 9 and 10.
    const bassLane = clipPath('bass').replace(/\/clips\/bass$/, '');
    engine.addNode(`${bassLane}/clips/top`, { properties: { uid: 'top', name: 'top', start: 9 * B, stop: 10 * B, source_uid: 'src1', source_start: 15e9, source_stop: 15.5e9, clip_type: 0, gain: 0, bypass: false, midi_source_start: 0, layer: 1, mute: false } });
    await page.waitFor(() => /2 lanes · 5 segments/.test(page.text('#status')), 'the split lane');
    const canvas = page.document.getElementById('timeline') as HTMLCanvasElement;
    const px = 1100 / 32, y = 22 + 78 + 16 + 3.5;
    const fire = (type: string, x: number) => canvas.dispatchEvent(new page.window.MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
    const over = (x: number) => { fire('pointermove', x); return canvas.dataset['edit']; };
    // A crossfade handle on each edit, though Bass runs on under the top clip.
    await page.waitFor(() => over(9 * px) === 'crossfade' && over(10 * px) === 'crossfade', 'handles on both edits');
    // The panel crossfades Bass into the clip on top.
    await select('bass');
    await press('crossfade');
    await page.waitFor(() => row('bass')[4] === 'crossfade out' && row('top')[4] === 'crossfade in', 'the first crossfade');
    await page.waitFor(() => !(page.document.getElementById('duplicate') as HTMLButtonElement).disabled, 'the edit to finish');
    // Dragging the second edit's handle crossfades the top clip back into Bass (snap off for a short one).
    (page.document.getElementById('snap') as HTMLSelectElement).value = '0';
    fire('pointerdown', 10 * px);
    fire('pointermove', 10.2 * px);
    fire('pointermove', 10.25 * px);
    fire('pointerup', 10.25 * px);
    await page.waitFor(() => row('top')[4] === 'crossfade in, crossfade out' && row('bass')[4] === 'crossfade out, crossfade in', 'the second crossfade');
    expect(page.all('#log .error')).toHaveLength(0);
    page.close();
  });

  it('selects the piece of a clip that was clicked, not the clip under another one', async () => {
    const { engine, page, press, clipPath } = await twoLanes();
    const bassLane = clipPath('bass').replace(/\/clips\/bass$/, '');
    engine.addNode(`${bassLane}/clips/top`, { properties: { uid: 'top', name: 'top', start: 9 * B, stop: 10 * B, source_uid: 'src1', source_start: 15e9, source_stop: 15.5e9, clip_type: 0, gain: 0, bypass: false, midi_source_start: 0, layer: 1, mute: false } });
    await page.waitFor(() => /2 lanes · 5 segments/.test(page.text('#status')), 'the split lane');
    const canvas = page.document.getElementById('timeline') as HTMLCanvasElement;
    const px = 1100 / 32;
    const click = async (x: number) => {
      await page.waitFor(() => { canvas.dispatchEvent(new page.window.MouseEvent('pointermove', { clientX: x, clientY: 150, bubbles: true })); return canvas.dataset['edit'] === 'move'; }, 'a clip under the pointer');
      canvas.dispatchEvent(new page.window.MouseEvent('pointerdown', { clientX: x, clientY: 150, bubbles: true }));
      canvas.dispatchEvent(new page.window.MouseEvent('pointerup', { clientX: x, clientY: 150, bubbles: true }));
    };
    // Highlighted bodies (the selected fill) in the last frame, by start beat.
    const highlighted = () => {
      const ops = page.draws.ops.slice(page.draws.ops.map((o) => o.name).lastIndexOf('clearRect'));
      return ops.filter((o) => o.name === 'fillRect' && o.args[3] === 58 && o.fillStyle === '#1f3550').map((o) => Math.round((o.args[0] as number) / px));
    };
    await click(11 * px);
    expect(highlighted()).toEqual([10]);
    expect(page.text('#info')).toContain('showing 10.00–12.00');
    await click(8.5 * px);
    expect(highlighted()).toEqual([8]);
    // Duplicate copies the selected piece only: the clip and the one on top stay as they were.
    await click(11 * px);
    await press('duplicate');
    const spans = () => engine.children(`${bassLane}/clips`).map((c) => [Number(engine.value(`${bassLane}/clips/${c}`, 'start')) / B, Number(engine.value(`${bassLane}/clips/${c}`, 'stop')) / B]).sort((a, b) => a[0]! - b[0]! || a[1]! - b[1]!);
    await page.waitFor(() => spans().length === 3, 'the copy');
    expect(spans()).toEqual([[8, 12], [9, 10], [12, 14]]);
    await page.waitFor(() => highlighted().join() === '12', 'the copy selected');
    page.close();
  });

  it('keeps a waveform up while LUNA re-renders the piece, instead of flashing', async () => {
    const { engine, page, clipPath } = await twoLanes();
    engine.addSource('pkg_abc', 'rend1', { name: 'r1.wav', lengthNs: 2e9 });
    engine.addSource('pkg_abc', 'rend2', { name: 'r2.wav', lengthNs: 2e9 });
    engine.setValue(clipPath('left'), 'render_source_uid', 'rend1');
    engine.setValue(clipPath('left'), 'render_state', 'current');
    const fillsPerFrame = () => {
      const counts: number[] = [];
      for (const o of page.draws.ops) {
        if (o.name === 'clearRect') counts.push(0);
        else if (o.name === 'fill' && o.fillStyle === 'rgba(0, 0, 255, 1)' && counts.length) counts[counts.length - 1]!++;
      }
      return counts;
    };
    await page.waitFor(() => fillsPerFrame().at(-1) === 3, 'three waveforms');
    page.draws.clear();
    // LUNA's gap after an edit (fact 116): the piece's render is null while a new one is made.
    const folder = clipPath('left').replace(/clips\/left$/, 'compiled_clips');
    const seg = engine.children(folder).find((n) => engine.value(`${folder}/${n}`, 'clip_uid') === 'left')!;
    // (On the compiled piece only: touching the clip would make the mock recompile it.)
    engine.setValue(`${folder}/${seg}`, 'render_source_uid', null);
    await engine.settled();
    await new Promise((r) => setTimeout(r, 60));
    engine.setValue(`${folder}/${seg}`, 'render_source_uid', 'rend2');
    await engine.settled();
    await new Promise((r) => setTimeout(r, 60));
    const frames = fillsPerFrame();
    expect(frames.length).toBeGreaterThan(1);
    // No frame lost the waveform while the render was missing.
    expect(frames.filter((n) => n < 3)).toEqual([]);
    page.close();
  });

  it('keeps a drag\'s preview up until the edit is painted, so nothing snaps back', async () => {
    const { engine, page, clipPath } = await twoLanes();
    const px = 1100 / 32;
    const canvas = page.document.getElementById('timeline')!;
    const fire = (type: string, x: number) => canvas.dispatchEvent(new page.window.MouseEvent(type, { clientX: x, clientY: 140, bubbles: true }));
    fire('pointerdown', 10 * px);
    fire('pointermove', 12 * px);
    fire('pointermove', 14 * px);
    page.draws.clear();
    fire('pointerup', 14 * px);
    await page.waitFor(() => engine.value(clipPath('bass'), 'start') === 12 * B && page.text('#log').includes('Move bass'), 'the move');
    await page.waitFor(() => !(page.document.getElementById('duplicate') as HTMLButtonElement).disabled, 'the edit to finish');
    // Every frame from the release on shows the clip at its target: as the dashed preview, or
    // painted there. None shows it back at beat 8 alone.
    const frames: { preview: boolean; at12: boolean }[] = [];
    let dashed = false;
    for (const o of page.draws.ops) {
      if (o.name === 'clearRect') { frames.push({ preview: false, at12: false }); dashed = false; }
      const f = frames.at(-1);
      if (!f) continue;
      if (o.name === 'setLineDash') dashed = (o.args[0] as number[])[0] === 5;
      const atTarget = Math.abs((o.args[0] as number) - 12 * px) < 1;
      if (o.name === 'strokeRect' && dashed && atTarget) f.preview = true;
      if (o.name === 'fillRect' && o.args[3] === 58 && atTarget) f.at12 = true;
    }
    expect(frames.length).toBeGreaterThan(0);
    expect(frames.filter((f) => !f.preview && !f.at12)).toEqual([]);
    expect(frames.at(-1)).toEqual({ preview: false, at12: true });
    page.close();
  });

  it('keeps the view where it is when an edit lengthens the session', async () => {
    const { engine, page, clipPath } = await twoLanes();
    // Two bars across the canvas, scrolled so beat 4 is at the left edge (content ends at 16 + 8).
    const zoom = page.document.getElementById('zoom') as HTMLSelectElement;
    zoom.value = '8';
    zoom.dispatchEvent(new page.window.Event('change'));
    const scroll = page.document.getElementById('scroll') as HTMLInputElement;
    scroll.value = '250';
    scroll.dispatchEvent(new page.window.Event('input'));
    const px = 1100 / 8;
    const rightAtLeftEdge = () => {
      const ops = page.draws.ops.slice(page.draws.ops.map((o) => o.name).lastIndexOf('clearRect'));
      return ops.some((o) => o.name === 'fillRect' && o.args[3] === 58 && Math.abs(o.args[0] as number) < 1 && (o.args[2] as number) > 3.9 * px);
    };
    await page.waitFor(rightAtLeftEdge, 'beat 4 at the left edge');
    // LUNA moves Bass far right: the session gets longer, the view must not move.
    engine.setValue(clipPath('bass'), 'start', 40 * B);
    engine.setValue(clipPath('bass'), 'stop', 44 * B);
    await page.waitFor(() => page.all('#clips tr').some((r) => r.textContent!.includes('40.00 → 44.00')), 'the moved clip');
    await new Promise((r) => setTimeout(r, 50));
    expect(rightAtLeftEdge()).toBe(true);
    // The scroll bar follows: the same start is a smaller fraction of a longer session.
    expect(Number(scroll.value)).toBeLessThan(250);
    page.close();
  });

  it('previews a fade-out falling, a fade-in rising and a crossfade as both', async () => {
    const { page } = await twoLanes();
    const px = 1100 / 32;
    const canvas = page.document.getElementById('timeline')!;
    const fire = (type: string, x: number, y: number) => canvas.dispatchEvent(new page.window.MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
    // The dashed preview: the moveTo/lineTo pairs after setLineDash([5, 3]), as [x0, y0, x1, y1].
    const preview = () => {
      const ops = page.draws.ops;
      const at = ops.map((o) => o.name === 'setLineDash' && (o.args[0] as number[])[0] === 5).lastIndexOf(true);
      const end = ops.findIndex((o, i) => i > at && o.name === 'setLineDash');
      const lines: number[][] = [];
      for (let i = at; i < end - 1; i++) if (ops[i]!.name === 'moveTo' && ops[i + 1]!.name === 'lineTo') lines.push([...(ops[i]!.args as number[]), ...(ops[i + 1]!.args as number[])]);
      return lines.map(([x0, y0, x1, y1]) => (y1! < y0! ? 'rises' : 'falls') + (x1! > x0! ? '' : ' backwards'));
    };
    const drag = (fromX: number, toX: number, y: number) => {
      page.draws.clear();
      fire('pointerdown', fromX, y);
      fire('pointermove', (fromX + toX) / 2, y);
      fire('pointermove', toX, y);
      const lines = preview();
      page.document.getElementById('timeline')!.dispatchEvent(new page.window.Event('pointercancel'));
      return lines;
    };
    // Lane 1's handles sit at y = 22 + 16 + 3.5. Bass (lane 2, beats 8-12) has no neighbour.
    const y2 = 22 + 78 + 16 + 3.5;
    expect(drag(12 * px - 7, 11 * px, y2)).toEqual(['falls']);
    expect(drag(8 * px + 7, 9 * px, y2)).toEqual(['rises']);
    expect(drag(4 * px, 4.5 * px, 22 + 16 + 3.5)).toEqual(['rises', 'falls']);
    page.close();
  });

  it('draws both halves of a crossfade over the segments on either side', async () => {
    const { page, select, press, row } = await twoLanes();
    await select('left');
    (page.document.getElementById('fadeBeats') as HTMLInputElement).value = '2';
    await press('crossfade');
    await page.waitFor(() => row('right')[4] === 'crossfade in', 'the crossfade');
    // The last whole frame: everything after its clearRect.
    const frame = () => page.draws.ops.slice(page.draws.ops.map((o) => o.name).lastIndexOf('clearRect'));
    const ramps = (ops: ReturnType<typeof frame>) => {
      const out: { at: number; dir: string }[] = [];
      ops.forEach((o, i) => {
        const next = ops[i + 1];
        if (o.name === 'moveTo' && next?.name === 'lineTo' && o.strokeStyle === '#c792ea') out.push({ at: i, dir: (next.args[1] as number) < (o.args[1] as number) ? 'rises' : 'falls' });
      });
      return out;
    };
    await page.waitFor(() => ramps(frame()).length === 2, 'two crossfade ramps');
    const ops = frame();
    const lastBody = ops.map((o) => o.name === 'fillRect' && o.args[3] === 58).lastIndexOf(true);
    const both = ramps(ops);
    expect(both.map((r) => r.dir).sort()).toEqual(['falls', 'rises']);
    // Both after every segment body, so neither half is painted over by the next segment.
    expect(both.every((r) => r.at > lastBody)).toBe(true);
    page.close();
  });

  it('changes the pointer and hint for each kind of edit under it', async () => {
    const { page, select, press, row } = await twoLanes();
    await select('left');
    await press('crossfade');
    await page.waitFor(() => row('right')[4] === 'crossfade in', 'the crossfade');
    // The edit resolves once LUNA shows it; until then the pointer says LUNA is busy.
    await page.waitFor(() => !(page.document.getElementById('duplicate') as HTMLButtonElement).disabled, 'the edit to finish');
    const canvas = page.document.getElementById('timeline') as HTMLCanvasElement;
    const px = 1100 / 32;
    const over = (x: number, y: number) => {
      canvas.dispatchEvent(new page.window.MouseEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
      return [canvas.dataset['edit'], canvas.title !== '', canvas.style.cursor !== ''];
    };
    // Lane 1 (left 0-4, right 4-8, crossfaded at 4): handles at y 41.5, bodies 38-96.
    expect(over(7 + 0.5, 41.5)).toEqual(['fadeIn', true, true]);
    expect(over(4 * px, 41.5)).toEqual(['crossfade', true, true]);
    expect(over(8 * px - 7, 41.5)).toEqual(['fadeOut', true, true]);
    expect(over(2 * px, 70)).toEqual(['move', true, true]);
    expect(over(8 * px - 2, 70)).toEqual(['trimStop', true, true]);
    // Bass (lane 2) starts at beat 8: its left edge trims, empty lane space places the cursor.
    expect(over(8 * px + 2, 140)).toEqual(['trimStart', true, true]);
    expect(over(20 * px, 140)).toEqual(['cursor', true, true]);
    // Over the ruler nothing happens.
    expect(over(20 * px, 5)[0]).toBe('');
    // While dragging a clip, the hand closes.
    canvas.dispatchEvent(new page.window.MouseEvent('pointerdown', { clientX: 2 * px, clientY: 70, bubbles: true }));
    canvas.dispatchEvent(new page.window.MouseEvent('pointermove', { clientX: 2 * px + 20, clientY: 70, bubbles: true }));
    expect(canvas.style.cursor).toBe('grabbing');
    canvas.dispatchEvent(new page.window.Event('pointercancel'));
    // Trims draw their own pointer, not a CSS keyword some web views show as an arrow.
    over(8 * px - 2, 70);
    expect(canvas.style.cursor).toContain('svg');
    canvas.dispatchEvent(new page.window.Event('pointercancel'));
    page.close();
  });

  it('gives a MIDI clip no fade handles or fade settings', async () => {
    const { engine, page, row } = await twoLanes();
    const uid = engine.addMidiClip('abc', 'Bass', { startTick: 16 * B, stopTick: 20 * B, name: 'keys' });
    await page.waitFor(() => page.document.querySelector(`#clips tr[data-clip="${uid}"]`) !== null && row(uid)[1] === 'keys', 'the MIDI clip');
    const canvas = page.document.getElementById('timeline') as HTMLCanvasElement;
    const px = 1100 / 32;
    const over = (x: number, y: number) => {
      canvas.dispatchEvent(new page.window.MouseEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
      return canvas.dataset['edit'];
    };
    // Where an audio clip has its fade handles (y 119.5 on lane 2), a MIDI clip trims or moves.
    expect(over(8 * px + 7.5, 119.5)).toBe('fadeIn');
    expect(over(16 * px + 7.5, 119.5)).toBe('trimStart');
    expect(over(20 * px - 7.5, 119.5)).toBe('trimStop');
    expect(over(18 * px, 119.5)).toBe('move');
    (page.document.querySelector(`#clips tr[data-clip="${uid}"]`) as HTMLElement).click();
    await page.waitFor(() => page.text('#info').startsWith('keys'), 'the MIDI clip selected');
    for (const id of ['fadeIn', 'fadeOut', 'crossfade', 'removeIn', 'removeOut', 'removeCross', 'applyCurve', 'resetCurve']) {
      expect((page.document.getElementById(id) as HTMLButtonElement).disabled, id).toBe(true);
    }
    for (const id of ['duplicate', 'mute', 'delete']) expect((page.document.getElementById(id) as HTMLButtonElement).disabled, id).toBe(false);
    page.close();
  });

  it('draws a MIDI clip\'s notes, and follows notes added in LUNA', async () => {
    const { engine, page } = await twoLanes();
    const uid = engine.addMidiClip('abc', 'Bass', { startTick: 16 * B, stopTick: 20 * B, name: 'keys' });
    const clipPath = `/sessions/abc/playlists/${engine.children('/sessions/abc/playlists')[1]}/clips/${uid}`;
    engine.midiEdit(clipPath, 'added', [
      { rowid: 1, tick: 0, status: 0x90, data1: 60, data2: 100 },
      { rowid: 2, tick: B, status: 0x80, data1: 60, data2: 0 },
      { rowid: 3, tick: B, status: 0x90, data1: 67, data2: 50 },
      { rowid: 4, tick: 3 * B, status: 0x80, data1: 67, data2: 0 },
    ]);
    const px = 1100 / 32;
    // Note bars: small fillRects in the track colour inside the clip.
    const bars = () => {
      const ops = page.draws.ops.slice(page.draws.ops.map((o) => o.name).lastIndexOf('clearRect'));
      return ops.filter((o) => o.name === 'fillRect' && String(o.fillStyle).startsWith('rgba(0, 0, 255,') && (o.args[0] as number) >= 16 * px - 1 && (o.args[3] as number) <= 6)
        .map((o) => [Math.round((o.args[0] as number) / px), Math.round((o.args[2] as number) / px), Math.round(o.args[1] as number)]);
    };
    await page.waitFor(() => bars().length === 2, 'two note bars');
    const [low, high] = bars().sort((a, b) => b[2]! - a[2]!);
    // [start beat, length in beats, y]: the higher note sits higher, and starts and ends where it plays.
    expect([low![0], low![1]]).toEqual([16, 1]);
    expect([high![0], high![1]]).toEqual([17, 2]);
    expect(high![2]).toBeLessThan(low![2]!);
    engine.midiEdit(clipPath, 'added', [{ rowid: 5, tick: 3 * B, status: 0x90, data1: 64, data2: 90 }, { rowid: 6, tick: 4 * B, status: 0x80, data1: 64, data2: 0 }]);
    await page.waitFor(() => bars().length === 3, 'the added note');
    page.close();
  });

  it('fills waveforms in the track colour, and follows a recolour', async () => {
    const { engine, page } = await twoLanes();
    const fills = () => page.draws.ops.filter((o) => o.name === 'fill').map((o) => o.fillStyle);
    // The mock's tracks are 0xFF0000FF.
    await page.waitFor(() => fills().includes('rgba(0, 0, 255, 1)'), 'a blue waveform');
    page.draws.clear();
    engine.setValue('/sessions/abc/tracks/Gtr', 'color', 0xff10a020);
    await page.waitFor(() => fills().includes('rgba(16, 160, 32, 1)'), 'the new colour');
    page.close();
  });

  it('turns fade editing off on a LUNA that does not report fades', async () => {
    const { page, select } = await twoLanes({ compiledClipFades: false });
    await page.waitFor(() => page.text('#status').includes('fade editing is off'), 'the note');
    await select('left');
    for (const id of ['fadeIn', 'fadeOut', 'crossfade', 'applyCurve', 'batch']) expect((page.document.getElementById(id) as HTMLButtonElement).disabled).toBe(true);
    expect((page.document.getElementById('duplicate') as HTMLButtonElement).disabled).toBe(false);
    page.close();
  });
});

describe('examples/sysex.html', () => {
  function engineWithDevices() {
    const engine = new Luna.MockEngine();
    engine.addMidiDevice('Volt 876', { uid: 'volt' });
    engine.addMidiDevice('DX7', { uid: 'dx7' });
    return engine;
  }
  const click = (page: Awaited<ReturnType<typeof loadExamplePage>>, id: string) => (page.document.getElementById(id) as HTMLButtonElement).click();
  const ready = (page: Awaited<ReturnType<typeof loadExamplePage>>) => page.waitFor(() => page.text('#status').includes('listening to 2 devices'), 'the listeners');
  const yamaha = [0xf0, 0x43, 0x10, 0x4c, 0x00, 0x00, 0x7e, 0x00, 0xf7];
  // Identity reply from a Roland: family 0x0123 (291), model 2, version 1.0.3.0.
  const identity = [0xf0, 0x7e, 0x10, 0x06, 0x02, 0x41, 0x23, 0x02, 0x02, 0x00, 0x01, 0x00, 0x03, 0x00, 0xf7];

  it('logs each SysEx with its device, manufacturer and length, newest first, and ignores channel messages', async () => {
    const engine = engineWithDevices();
    const page = await loadExamplePage('sysex.html', engine);
    await ready(page);
    await engine.settled();
    engine.receiveMidi('volt', [[0x90, 60, 100], yamaha]);
    engine.receiveMidi('dx7', [[0xf0, 0x00, 0x20, 0x6b, 0x7f, 0x42, 0xf7]]);
    await page.waitFor(() => page.all('#log tr').length === 2, 'two rows');
    const rows = page.all('#log tr').map((tr) => [...tr.querySelectorAll('td')].slice(1, 4).map((td) => td.textContent));
    expect(rows).toEqual([
      ['DX7', 'Arturia', '7'],
      ['Volt 876', 'Yamaha', '9'],
    ]);
    expect(page.all('#log tr')[1]!.querySelector('.hex')!.textContent).toBe('F0 43 10 4C 00 00 7E 00 F7');
    expect(page.text('#count')).toContain('2 messages');

    // Selecting one shows its dump and lets it be sent back out.
    (page.all('#log tr')[1] as HTMLElement).click();
    expect(page.text('#dump')).toBe('0000  F0 43 10 4C 00 00 7E 00 F7');
    click(page, 'resend');
    await page.waitFor(() => engine.midiSent.length === 1, 'the resend');
    expect(engine.midiSent[0]).toMatchObject({ outputPortUid: 'volt_out', sysex: yamaha });

    click(page, 'clear');
    expect(page.all('#log tr')).toHaveLength(0);
    expect((page.document.getElementById('resend') as HTMLButtonElement).disabled).toBe(true);
    page.close();
  });

  it('sends an Identity Request and decodes the reply', async () => {
    const engine = engineWithDevices();
    const page = await loadExamplePage('sysex.html', engine);
    await ready(page);
    const output = page.document.getElementById('output') as HTMLSelectElement;
    output.value = 'DX7';
    output.dispatchEvent(new page.window.Event('change'));
    click(page, 'identityRequest');
    await page.waitFor(() => engine.midiSent.length === 1, 'the request');
    expect(engine.midiSent[0]).toMatchObject({ outputPortUid: 'dx7_out', sysex: [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7] });
    await engine.settled();
    engine.receiveMidi('dx7', [identity]);
    await page.waitFor(() => !(page.document.getElementById('identity') as HTMLElement).hidden, 'the decoded reply');
    expect(page.text('#identity')).toBe('DX7 is a Roland device: family 291, model 2, version 1.0.3.0 (device id 16)');
    page.close();
  });

  it('makes the picked In device the Out device too, and leaves Out alone for one without a MIDI out', async () => {
    const engine = engineWithDevices();
    engine.addMidiDevice('Pads', { uid: 'pads', output: false });
    const page = await loadExamplePage('sysex.html', engine);
    await page.waitFor(() => page.text('#status').includes('listening to 3 devices'), 'the listeners');
    const input = page.document.getElementById('input') as HTMLSelectElement;
    const output = page.document.getElementById('output') as HTMLSelectElement;
    const pick = (name: string) => {
      input.value = name;
      input.dispatchEvent(new page.window.Event('change'));
    };
    expect(output.value).toBe('Volt 876');
    pick('DX7');
    expect(output.value).toBe('DX7');
    click(page, 'identityRequest');
    await page.waitFor(() => engine.midiSent.length === 1, 'the request');
    expect(engine.midiSent[0]).toMatchObject({ outputPortUid: 'dx7_out' });
    pick('Pads'); // no MIDI out: Out stays on DX7
    expect(output.value).toBe('DX7');
    // Out can still be changed by hand, and choosing All keeps that choice.
    output.value = 'Volt 876';
    output.dispatchEvent(new page.window.Event('change'));
    pick('');
    expect(output.value).toBe('Volt 876');
    page.close();
  });

  it('sends typed hex, and refuses text that is not a whole SysEx before LUNA sees it', async () => {
    const engine = engineWithDevices();
    const page = await loadExamplePage('sysex.html', engine);
    await ready(page);
    const hex = page.document.getElementById('hex') as HTMLTextAreaElement;
    hex.value = '0xF0, 0x41 10\n42 F7';
    click(page, 'send');
    await page.waitFor(() => page.text('#sendNote').startsWith('sent 5 bytes'), 'the send');
    expect(engine.midiSent[0]).toMatchObject({ outputPortUid: 'volt_out', sysex: [0xf0, 0x41, 0x10, 0x42, 0xf7] });

    hex.value = 'F0 4G F7';
    click(page, 'send');
    await page.waitFor(() => page.text('#sendNote').includes('"4G" is not a hex byte'), 'the hex error');
    hex.value = 'F0 41 10';
    click(page, 'send');
    await page.waitFor(() => page.text('#sendNote').includes('0xf7'), 'the SDK check');
    expect(engine.midiSent).toHaveLength(1);
    page.close();
  });

  it('sends every message in a .syx file, skipping what lies between them', async () => {
    const engine = engineWithDevices();
    const page = await loadExamplePage('sysex.html', engine);
    await ready(page);
    const input = page.document.getElementById('syxFile') as HTMLInputElement;
    const file = new page.window.File([new Uint8Array([0x00, ...yamaha, 0x55, 0xf0, 0x7d, 0x01, 0xf7])], 'patches.syx');
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new page.window.Event('change'));
    await page.waitFor(() => engine.midiSent.length === 2, 'both messages', 3000);
    expect(engine.midiSent.map((m) => m.sysex)).toEqual([yamaha, [0xf0, 0x7d, 0x01, 0xf7]]);
    expect(page.text('#sendNote')).toBe('sent message 2 of 2 from patches.syx to Volt 876');
    page.close();
  });
});

describe('examples/midi-input.html', () => {
  function engineWithDevices() {
    const engine = new Luna.MockEngine();
    engine.addMidiDevice('Volt 876', { uid: 'volt' });
    engine.addMidiDevice('Keystep', { uid: 'keystep' });
    return engine;
  }

  const rows = (page: Awaited<ReturnType<typeof loadExamplePage>>) =>
    page.all('#log tr').map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent).slice(1, 6));

  it('logs what every device sends, newest first, with held notes and controller values', async () => {
    const engine = engineWithDevices();
    const page = await loadExamplePage('midi-input.html', engine);
    await page.waitFor(() => page.text('#status').includes('listening to 2 devices'), 'the listeners');
    await engine.settled();
    engine.receiveMidi('volt', [[0x90, 60, 100], [0xb1, 74, 33]]);
    engine.receiveMidi('keystep', [[0x92, 64, 90], [0x82, 64, 0]]);
    await page.waitFor(() => page.all('#log tr').length === 4, 'four rows');
    expect(rows(page)).toEqual([
      ['Keystep', 'noteOff', '3', '64 (E4)', '0'],
      ['Keystep', 'noteOn', '3', '64 (E4)', '90'],
      ['Volt 876', 'controlChange', '2', '74', '33'],
      ['Volt 876', 'noteOn', '1', '60 (C4)', '100'],
    ]);
    expect(page.all('#log tr')[3]!.querySelector('.raw')!.textContent).toBe('90 3C 64');
    expect(page.all('#held .chip').map((c) => c.textContent)).toEqual(['C4 ch1']);
    expect(page.all('#ccs .chip').map((c) => c.textContent)).toEqual(['CC74 ch2: 33']);
    expect(page.text('#count')).toContain('4 messages');
    page.close();
  });

  it('listens to one device when picked, and pauses and clears the log', async () => {
    const engine = engineWithDevices();
    const page = await loadExamplePage('midi-input.html', engine);
    await page.waitFor(() => page.all('#device option').length === 3, 'the device list');
    const select = page.document.getElementById('device') as HTMLSelectElement;
    select.value = 'Keystep';
    select.dispatchEvent(new page.window.Event('change'));
    await page.waitFor(() => page.text('#status').includes('listening to Keystep'), 'the Keystep listener');
    await engine.settled();
    engine.receiveMidi('volt', [[0x90, 60, 100]]);
    engine.receiveMidi('keystep', [[0x90, 48, 80]]);
    await page.waitFor(() => page.all('#log tr').length === 1, 'one row');
    expect(rows(page)[0]![0]).toBe('Keystep');

    (page.document.getElementById('pause') as HTMLButtonElement).click();
    engine.receiveMidi('keystep', [[0x80, 48, 0]]);
    await page.waitFor(() => page.text('#count').includes('2 messages'), 'the second message');
    expect(page.all('#log tr')).toHaveLength(1); // paused: counted, not logged
    expect(page.all('#held .chip')).toHaveLength(0); // the note-off still released it

    (page.document.getElementById('clear') as HTMLButtonElement).click();
    expect(page.all('#log tr')).toHaveLength(0);
    expect(page.text('#count')).toContain('0 messages');
    page.close();
  });

  it('picks up a device that comes online, whose name and ports arrive after it', async () => {
    const engine = engineWithDevices();
    const page = await loadExamplePage('midi-input.html', engine);
    await page.waitFor(() => page.text('#status').includes('listening to 2 devices'), 'the listeners');
    const path = `/devices/${Luna.LUNA_DEVICE_UID}/midi/iac`;
    engine.addNode(path, { properties: { type: 'midi-device', name: null, midi_device_type: 'normal' } });
    await engine.settled();
    await new Promise((r) => setTimeout(r, 20)); // let the page read the bare device first
    engine.setValue(path, 'name', 'IAC Driver Bus 1');
    engine.addNode(`${path}/input_ports`, { properties: { type: 'folder' } });
    engine.addNode(`${path}/input_ports/0`, { properties: { type: 'midi-input', uid: 'iac_in', midi_events: { seq: 0, dropped: 0, events: [] } } });
    await page.waitFor(() => page.text('#status').includes('listening to 3 devices'), 'the new device');
    expect(page.all('#device option').map((o) => o.textContent)).toContain('IAC Driver Bus 1');
    await engine.settled();
    engine.receiveMidi('iac', [[0x90, 67, 70]]);
    await page.waitFor(() => page.all('#log tr').length === 1, 'its message');
    expect(page.all('#log tr')[0]!.querySelector('.device')!.textContent).toBe('IAC Driver Bus 1');
    page.close();
  });

  it('says so when LUNA sees no MIDI input device', async () => {
    const engine = new Luna.MockEngine();
    engine.addMidiDevice('Out Only', { input: false });
    const page = await loadExamplePage('midi-input.html', engine);
    await page.waitFor(() => page.text('#status').includes('no MIDI input devices'), 'the message');
    page.close();
  });
});
