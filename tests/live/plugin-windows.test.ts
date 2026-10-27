/**
 * Live lane for plugin editor windows (fact 126): `/gui/show_plugin`, `/gui/hide_plugin` and
 * `/gui/plugin_windows`, through `effect.openEditor()` and a second client watching.
 *
 * Needs LUNA on 4718 with a session open that has a track whose last insert slot is empty. It
 * loads a stock plugin there, opens and closes its window, and clears the slot again; the undo
 * entries for the insert remain, because the wire cannot drop them.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';
/** A stock plugin every macOS LUNA can load. */
const PLUGIN = 'com.appl.au.aufx_dely';
const SLOT = 'effect_7';

describe.skipIf(!live)('live: plugin editor windows', () => {
  let luna: Luna.Client;
  let watcher: Luna.Client;
  let session: Luna.Session;
  let track: Luna.Track;
  let slot: Luna.Effect;
  let loaded = false;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    session = await luna.session();
    await session.ready();
    const found = session.visibleTracks[0];
    if (!found) throw new Error('the open session needs a track');
    track = found;
    await track.effects.load();
    slot = track.effects.byId(SLOT)!;
    if (!slot.isEmpty) throw new Error(`${SLOT} on ${track.name.value} must be empty`);
    watcher = await Luna.connect({ requestTimeoutMs: 8000 });
  });

  afterAll(async () => {
    if (loaded) {
      await slot.closeEditor().catch(() => undefined);
      await slot.clear().catch(() => undefined);
    }
    await watcher?.close();
    await luna?.close();
  });

  it('publishes the open windows and refuses what is not an insert slot', async () => {
    expect(await luna.gui.available()).toBe(true);
    expect(Array.isArray(luna.gui.pluginWindows.value)).toBe(true);
    expect(slot.editorOpen.value).toBe(false);
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    expect(await code(luna.gui.showPlugin(track.id, 'clip_effect_0', { sessionUid: session.uid }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.showPlugin(track.id, 'nonsense', { sessionUid: session.uid }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.showPlugin('not-a-uid', SLOT, { sessionUid: session.uid }))).toBe('uasrv.invalid_value');
  });

  it('opens nothing for an empty slot, though LUNA answers success', async () => {
    await luna.gui.showPlugin(track.id, SLOT, { sessionUid: session.uid });
    await new Promise((r) => setTimeout(r, 600));
    await luna.store.load('/gui/plugin_windows');
    expect(slot.editorOpen.value).toBe(false);
  });

  it('opens and closes the editor, and another client follows', async () => {
    await slot.setPlugin(PLUGIN);
    loaded = true;
    await watcher.gui.watchPluginWindows();
    const seen = () => watcher.gui.isPluginOpen(track.id, SLOT, session.uid);
    expect(seen()).toBe(false);

    await slot.openEditor();
    expect(slot.editorOpen.value).toBe(true);
    const raw = (await luna.raw.get('/gui/plugin_windows', { children: false, commands: false, flatvalue: true })) as { properties: { open: { session_uid: string; channel_uid: string; insert_type: string }[] } };
    const entry = raw.properties.open.find((w) => w.insert_type === SLOT);
    expect(entry).toBeDefined();
    // Uids without dashes, the same uids the session tree uses.
    expect(entry!.channel_uid.replaceAll('-', '').toLowerCase()).toBe(track.id.replaceAll('-', '').toLowerCase());
    await Luna.settle(() => seen() === true, 'watcher sees the window open', { timeoutMs: 3000 });

    await slot.openEditor(); // already open: to the front, still one entry
    expect(luna.gui.pluginWindows.value!.filter((w) => w.slot === SLOT && w.channelUid === entry!.channel_uid)).toHaveLength(1);

    await slot.closeEditor();
    expect(slot.editorOpen.value).toBe(false);
    await Luna.settle(() => seen() === false, 'watcher sees the window closed', { timeoutMs: 3000 });
    await slot.closeEditor(); // already closed: nothing to do
  });
});
