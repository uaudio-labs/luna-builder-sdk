/**
 * LUNA's host surface: `/gui`. Lets an Add On ask LUNA to open dialogs, switch pages, show
 * other Add Ons, open URLs and report progress.
 *
 * `/gui` is LUNA's own UI, so it is absent on a headless engine (fact 103). Check
 * {@link Gui.available} rather than inferring it from `Luna.isEmbeddedInLuna()`; without it
 * every command rejects with `Luna.Unsupported`.
 *
 * @example
 * if (await luna.gui.available()) await luna.gui.setPage('mixer');
 * await luna.gui.setPage('mixer');
 * await luna.gui.openUrl('https://uaudio.com');
 * const task = await luna.gui.startTask('Rendering'); await task.progress(50); await task.done();
 * const [folder] = await luna.gui.chooseFolders();
 * if (folder) console.log(await luna.gui.listFiles(folder));
 * await luna.gui.showPlugin(track.id, 'effect_0');
 */
import type { Client } from '../client/client';
import type { PluginRequirement } from './plugins';
import { derived, type Prop, type WritableProp } from '../store/prop';
import { RequestTimeout, UAError, Unsupported } from '../wire/errors';
import { Collection } from './collection';
import { Node } from './node';
import { settle } from './settle';
import { childNames } from './presence';
import { suppressProgress, type ProgressSuppression, type SuppressProgressOptions } from './progress';

/**
 * A page a LUNA window shows. `lunaplay` is reported while LUNA Play shows but cannot be set:
 * {@link Gui.setPage} takes a {@link SettablePage} (fact 236).
 */
export type GuiPage = 'mixer' | 'timeline' | 'home' | 'addon' | 'dashboard' | 'catalog' | 'universe' | 'lunaplay' | (string & {});
/**
 * The pages {@link Gui.setPage} can switch a window to (fact 236). `catalog` and `universe`
 * are in the main window only, and only in LUNA builds that have them; elsewhere LUNA
 * answers `uasrv.not_implemented`.
 */
export type SettablePage = 'mixer' | 'timeline' | 'home' | 'addon' | 'dashboard' | 'catalog' | 'universe';
/** Options for {@link Gui.setPage}. */
export interface SetPageOptions {
  /** The window's context: `main` (the default), `alt_0`, `alt_1`, ... */
  contextType?: string;
  /**
   * A view inside the page for its document to open: the dashboard's `free_with_luna`, the
   * catalog's `filter:free`, or for `universe` a path on the site (`index/showcase?kind=addon`:
   * printable ASCII, no spaces, `\` or `#`). Only those three pages take a route; LUNA refuses
   * one for another page, or an empty one, with `uasrv.invalid_value` before anything changes
   * (fact 243).
   */
  route?: string;
}
export type AddOnTarget = 'window' | 'app' | 'browser' | 'editor';
/** Where an installed Add On lives: see {@link AddOn.installedFrom}. */
export type AddOnInstalledFrom = 'folder' | 'link' | 'built_in';

export class AddOn extends Node {
  /** The manifest's `id`, in lowercase: LUNA compares ids without case. */
  readonly addOnId: Prop<string>;
  /** The manifest's `name`: its menu item and panel header. */
  readonly name: Prop<string>;
  /**
   * Every host the Add On can be shown in, default first (fact 144): the manifest's `targets`, such as
   * `['window', 'browser']`, or a one-entry list from its single `target`. The user can swap an
   * Add On with more than one between them from its header. The host a page is in now is its
   * {@link AddOnInstance.target}. `undefined` on a LUNA older than the property.
   *
   * @example
   * const canBePanel = addOn.targets.value?.includes('browser') ?? false;
   * const defaultHost = addOn.targets.value?.[0];
   */
  readonly targets: Prop<AddOnTarget[]>;
  /** Absolute file path of the icon, or `''`. */
  readonly icon: Prop<string>;
  /** The manifest's `floating`: `true` unless it says `false`. Meaningful for `'window'` only. */
  readonly floating: Prop<boolean>;
  /** The manifest's `show_with_session`: `false` unless it says `true`. Meaningful for `'window'` only. */
  readonly showWithSession: Prop<boolean>;
  /**
   * The manifest's `fixed_size`: `false` unless it says `true`. Meaningful for `'window'` only.
   * `undefined` on a LUNA older than the property.
   */
  readonly fixedSize: Prop<boolean>;
  /**
   * The manifest's `run_hidden`: `false` unless it says `true`. With `true` LUNA keeps the page
   * running at full speed while it is hidden. `undefined` on a LUNA older than the property.
   */
  readonly runHidden: Prop<boolean>;
  /**
   * The manifest's `unload_on_close`: `false` unless it says `true`. With `true` LUNA unloads
   * the page when the Add On is closed and loads it fresh when it is opened again, instead of
   * keeping it running hidden. Meaningful for `'window'`, `'browser'` and `'editor'`.
   * `undefined` on a LUNA older than the property.
   */
  readonly unloadOnClose: Prop<boolean>;
  /** The manifest's `manufacturer`, or `''` when it has none. */
  readonly manufacturer: Prop<string>;
  /** The manifest's `description`, an array of strings already concatenated, or `''` when it has none. */
  readonly description: Prop<string>;
  /**
   * The manifest's `categories`, such as `['MIDI', 'Utility']` (see {@link ADD_ON_CATEGORIES}),
   * or `[]` when it has none. LUNA does not check the names, so one from a newer SDK can appear.
   * `undefined` on a LUNA older than the property.
   *
   * @example
   * const midi = luna.gui.addOns.items.filter((a) => a.categories.value?.includes('MIDI'));
   */
  readonly categories: Prop<string[]>;
  /**
   * Every server the Add On would connect to (fact 147): its manifest's `network` hosts,
   * normalized (`'api.example.com'`, `'*.example.com'`, `'host:8443'`), plus a hosted page's own
   * server. `[]` when none. `undefined` on a LUNA older than the property.
   *
   * @example
   * const servers = addOn.network.value ?? [];
   */
  readonly network: Prop<string[]>;
  /**
   * Those of {@link AddOn.network} the user allowed (fact 147). Only LUNA's own prompts and
   * Settings > Add Ons > SERVERS change it; nothing an Add On sends can. A page loads with the
   * set fixed and is loaded again when it changes.
   *
   * @example
   * const blocked = (addOn.network.value ?? []).filter((h) => !addOn.networkAllowed.value?.includes(h));
   */
  readonly networkAllowed: Prop<string[]>;
  /** The manifest's `version`, or `''` when it has none. Follows a replace (fact 131). */
  readonly version: Prop<string>;
  /**
   * Where it is installed (fact 131): `'folder'`, a folder in LUNA's Add Ons folder (from a
   * `.lunaaddon`, the showcase, or copied there); `'link'`, a symlink there, as
   * `ua-builder install` makes on macOS; `'built_in'`, bundled with LUNA. {@link Gui.uninstallAddOn}
   * removes `'folder'` and `'link'` ones (a link loses only the link) and refuses `'built_in'`.
   * `undefined` on a LUNA older than the property.
   *
   * @example
   * const removable = addOn.installedFrom.value === 'folder' || addOn.installedFrom.value === 'link';
   */
  readonly installedFrom: Prop<AddOnInstalledFrom>;
  /**
   * The manifest's `min_width`, `min_height`, `max_width` and `max_height` (fact 143): the
   * window's size limits in pixels, `null` when the manifest declares none. LUNA stops the
   * user's resize at them and clamps {@link AddOnInstance.resize} to them. Meaningful for
   * `'window'` only. `undefined` on a LUNA older than the properties.
   *
   * @example
   * const tooNarrow = addOn.minWidth.value != null && innerWidth < addOn.minWidth.value;
   */
  readonly minWidth: Prop<number | null>;
  readonly minHeight: Prop<number | null>;
  readonly maxWidth: Prop<number | null>;
  readonly maxHeight: Prop<number | null>;
  /**
   * The manifest's `requires_plugins` as LUNA read it (fact 148): the plugins the Add On needs,
   * each with every `plugin_id` it accepts (always an array), its `min_version` (`''` for any)
   * and whether it is `optional`; `[]` when it has none. Whether each is met is not here, since
   * it changes with the installed plugins: ask {@link Plugins.unmetRequirements}. LUNA lists an
   * Add On whose non-optional requirement is unmet disabled, with the plugin it needs, and
   * will not open it. `undefined` on a LUNA older than the property.
   *
   * @example
   * await luna.plugins.load();
   * const missing = luna.plugins.unmetRequirements(addOn.requiresPlugins.value ?? []);
   * if (missing.length) banner.textContent = `Install ${missing.map((r) => r.name).join(', ')}`;
   */
  readonly requiresPlugins: Prop<PluginRequirement[]>;
  /**
   * Its pages open in LUNA right now, by `add_on_inst` (fact 143): one per window, browser
   * panel, editor panel or app page showing it. Use {@link Gui.thisInstance} for your own page.
   *
   * @example
   * await addOn.instances.load();
   * addOn.instances.items.map((i) => `${i.target.value} ${i.width.value}x${i.height.value}`);
   */
  readonly instances: Collection<AddOnInstance>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.minWidth = this.prop<number | null>('min_width');
    this.minHeight = this.prop<number | null>('min_height');
    this.maxWidth = this.prop<number | null>('max_width');
    this.maxHeight = this.prop<number | null>('max_height');
    this.instances = new Collection<AddOnInstance>(client, `${path}/instances`, (p) => new AddOnInstance(client, p), { levels: 2, commands: false, flatvalue: true });
    this.addOnId = this.prop<string>('id');
    this.name = this.prop<string>('name');
    this.targets = this.prop<AddOnTarget[]>('targets');
    this.icon = this.prop<string>('icon');
    this.floating = this.prop<boolean>('floating');
    this.showWithSession = this.prop<boolean>('show_with_session');
    this.fixedSize = this.prop<boolean>('fixed_size');
    this.runHidden = this.prop<boolean>('run_hidden');
    this.unloadOnClose = this.prop<boolean>('unload_on_close');
    this.manufacturer = this.prop<string>('manufacturer');
    this.description = this.prop<string>('description');
    this.categories = this.prop<string[]>('categories');
    this.network = this.prop<string[]>('network');
    this.networkAllowed = this.prop<string[]>('network_allowed');
    this.version = this.prop<string>('version');
    this.installedFrom = this.prop<AddOnInstalledFrom>('installed_from');
    this.requiresPlugins = this.prop<PluginRequirement[]>('requires_plugins');
  }

  /** Show it in LUNA in the host it is in now (one of {@link targets}): navigate to an `'app'`,
   *  open a `'window'` (toggling it like its menu item), show a `'browser'` in the secondary
   *  browser, or an `'editor'` in the Timeline's editor panel (never toggling either closed). */
  show(): Promise<unknown> {
    return this.wire.post('/gui/show_add_on', { id: this.id });
  }
}

/**
 * One page of an installed Add On open in LUNA (fact 143): `/gui/add_ons/<id>/instances/<add_on_inst>`.
 * LUNA gives every Add On page an `add_on_inst` in its URL; {@link Gui.thisInstance} finds the
 * page's own. A window keeps its instance while it exists, and a `show_with_session` window
 * keeps it in the session, so it is the same after the session is closed and opened again: a
 * page can key its own `session.storage` records by it.
 *
 * @example
 * const me = await luna.gui.thisInstance();
 * if (me?.target.value === 'window') await me.resize(640, 480);
 * me?.width.onChange(() => layout(me.width.value ?? 0));
 */
export class AddOnInstance extends Node {
  /** The host the page is in: one of its Add On's {@link AddOn.targets}. */
  readonly target: Prop<AddOnTarget>;
  /** The page's width in points; follows the user's resize. `undefined` until loaded. */
  readonly width: Prop<number>;
  /** The page's height in points; follows the user's resize. `undefined` until loaded. */
  readonly height: Prop<number>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.target = this.prop<AddOnTarget>('target');
    this.width = this.prop<number>('width');
    this.height = this.prop<number>('height');
  }

  /** The `add_on_inst` LUNA gave the page. */
  get instanceId(): string {
    return this.id;
  }

  /** The manifest `id` of the Add On this page belongs to, in lowercase. */
  get addOnId(): string {
    const parent = this.path.slice(0, this.path.lastIndexOf('/instances/'));
    return parent.slice(parent.lastIndexOf('/') + 1);
  }

  /**
   * Ask LUNA to resize a `'window'` instance's window to this page size, in points. A size left
   * out keeps the current one. LUNA clamps it to the manifest's `min_*`/`max_*`, leaves full
   * screen first, keeps the window's top-left corner, and saves it as it would a user resize
   * (with the session, for a `show_with_session` window). Resolves once the size LUNA applied is
   * in {@link width} and {@link height}. Rejects with `uasrv.read_only` for another
   * target or a `fixed_size` window, and `uasrv.invalid_value` for a size of 0 or less.
   *
   * @example
   * await me.resize(800);          // width only
   * await me.resize(undefined, 600); // height only
   */
  async resize(width?: number, height?: number): Promise<void> {
    if (width !== undefined) await this.wire.set(`${this.path}/width`, Math.round(width));
    if (height !== undefined) await this.wire.set(`${this.path}/height`, Math.round(height));
    // LUNA clamps, and a write is not echoed to its writer (fact 6): read back what it applied.
    await this.reload({ flatvalue: true, commands: false, children: false });
  }
}

export class GuiWindow extends Node {
  /** Current page; writable for `mixer | timeline | home | addon | dashboard`. */
  readonly page: WritableProp<GuiPage>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.page = this.writableProp<GuiPage>('page');
  }
}

/** One entry of {@link Gui.listFiles}: a file or folder directly inside the listed folder. */
export interface FileEntry {
  /** The entry's name, without its folder. */
  name: string;
  /**
   * Absolute path, for the engine (`session.importPath()`) or {@link Gui.serveMediaFile},
   * which gives the page a URL for any file in a blessed folder.
   */
  path: string;
  /** True for a folder, or a link to one. */
  isDirectory: boolean;
}

/** One entry of {@link Gui.listAllFiles}: a {@link FileEntry} anywhere below the listed folder. */
export interface NestedFileEntry extends FileEntry {
  /** Where it is, from the listed folder, `/`-separated: `'Loops/kick.wav'`. */
  relativePath: string;
}

/** One plugin editor window open in LUNA, from {@link Gui.pluginWindows}. */
export interface PluginWindow {
  sessionUid: string;
  /** The track or bus uid. */
  channelUid: string;
  /** The insert slot, for example `effect_0`. */
  slot: string;
}

export interface ProgressTask {
  progress(percent: number): Promise<void>;
  done(): Promise<void>;
}

export class Gui extends Node {
  /** Installed Add Ons, by manifest id in lowercase (`byId('com.example.foo')`). */
  readonly addOns: Collection<AddOn>;
  /** Windows by context type; `main` is the arrangement window. */
  readonly windows: Collection<GuiWindow>;
  /** Record-arm mode of LUNA's transport bar. */
  readonly armMode: WritableProp<boolean>;
  readonly priorLaunchCount: Prop<number>;
  /**
   * The folder LUNA creates new sessions in, as set in its Settings (fact 160). Read-only;
   * it follows the setting once `/gui` is watched. `undefined` on an engine without `/gui`.
   *
   * @example
   * await luna.gui.watch().ready;
   * luna.gui.sessionStoragePath.value;   // e.g. "/Users/me/Music/LUNA"
   */
  readonly sessionStoragePath: Prop<string>;
  /**
   * The plugin editor windows open in LUNA, opened from the page or by the user (fact 126).
   * `undefined` until known, and on a LUNA that does not publish them. Follows LUNA once
   * {@link watchPluginWindows} has run, which `session.ready()` does. Read one slot's state
   * from `effect.editorOpen`.
   */
  readonly pluginWindows: Prop<readonly PluginWindow[] | undefined>;
  /**
   * The blessed folders (fact 133): the folders the user lets every Add On read, as absolute
   * paths with links resolved. {@link listFiles} and {@link listAllFiles} list anything in
   * them, and {@link serveMediaFile} gives a URL for any file in them, of any type, but hidden
   * ones. The user manages them in LUNA's Settings > Add Ons > FOLDERS; a page asks for one
   * with {@link addBlessedFolder}. `undefined` until known, and on a LUNA without them.
   * Follows LUNA once {@link watchBlessedFolders} has run.
   */
  readonly blessedFolders: Prop<readonly string[] | undefined>;
  private presence: Promise<boolean> | undefined;
  private pluginWindowsWatch: Promise<void> | undefined;
  private blessedFoldersWatch: Promise<void> | undefined;

  /** @internal */
  constructor(client: Client) {
    super(client, '/gui');
    this.addOns = new Collection<AddOn>(client, '/gui/add_ons', (p) => new AddOn(client, p), { levels: 2, commands: false, flatvalue: true });
    this.windows = new Collection<GuiWindow>(client, '/gui/windows', (p) => new GuiWindow(client, p), { levels: 2, commands: false, flatvalue: true });
    this.armMode = client.store.cell<boolean>('/gui/transport', 'arm_mode') as unknown as WritableProp<boolean>;
    this.armMode = {
      get value() {
        return client.store.cell<boolean>('/gui/transport', 'arm_mode').value;
      },
      onChange: (l) => client.store.cell<boolean>('/gui/transport', 'arm_mode').onChange(l),
      set: (v) => client.store.set('/gui/transport', 'arm_mode', v),
    };
    this.priorLaunchCount = this.prop<number>('prior_launch_count');
    this.sessionStoragePath = this.prop<string>('session_storage_path');
    const open = client.store.cell<{ session_uid?: string; channel_uid?: string; insert_type?: string }[]>('/gui/plugin_windows', 'open');
    this.pluginWindows = derived([open], () => {
      const list = open.value;
      if (!Array.isArray(list)) return undefined;
      return list.map((w) => ({ sessionUid: w.session_uid ?? '', channelUid: w.channel_uid ?? '', slot: w.insert_type ?? '' }));
    });
    const blessed = client.store.cell<string[]>('/gui/add_ons', 'blessed_folders');
    this.blessedFolders = derived([blessed], () => (Array.isArray(blessed.value) ? blessed.value : undefined));
  }

  /**
   * Follow {@link blessedFolders} for the life of the connection. Idempotent; resolves once
   * the first list is in, or at once on an engine without `/gui`.
   *
   * @example
   * await luna.gui.watchBlessedFolders();
   * luna.gui.blessedFolders.onChange(() => render(luna.gui.blessedFolders.value ?? []));
   */
  watchBlessedFolders(): Promise<void> {
    this.blessedFoldersWatch ??= this.available()
      .then((has) => (has ? this.client.store.watch('/gui/add_ons', { load: { levels: 1, children: false } }).ready : undefined))
      .catch(() => {
        this.blessedFoldersWatch = undefined; // a dropped connection is not an answer
      });
    return this.blessedFoldersWatch;
  }

  /**
   * Follow {@link pluginWindows} for the life of the connection. Idempotent; resolves once
   * the first list is in, or at once on an engine without `/gui`. `session.ready()` calls it.
   *
   * @example
   * await luna.gui.watchPluginWindows();
   * luna.gui.pluginWindows.value; // [{ sessionUid, channelUid, slot: 'effect_0' }]
   */
  watchPluginWindows(): Promise<void> {
    this.pluginWindowsWatch ??= this.available()
      .then((has) => (has ? this.client.store.watch('/gui/plugin_windows').ready : undefined))
      .catch(() => {
      this.pluginWindowsWatch = undefined; // a dropped connection is not an answer
    });
    return this.pluginWindowsWatch;
  }

  /** True when LUNA has the editor of `slot` on `channelUid` open; `undefined` until known. */
  isPluginOpen(channelUid: string, slot: string, sessionUid?: string): boolean | undefined {
    const list = this.pluginWindows.value;
    if (list === undefined) return undefined;
    return list.some((w) => w.slot === slot && sameUid(w.channelUid, channelUid) && (sessionUid === undefined || sameUid(w.sessionUid, sessionUid)));
  }

  /**
   * This page's own instance (fact 143), from the `add_on_inst` LUNA puts in an Add On page's
   * URL, watched so its size follows LUNA. `undefined` outside LUNA, on a LUNA older than
   * instances, or when no live instance has that id. Pass an id to look up another page.
   *
   * @example
   * const me = await luna.gui.thisInstance();
   * if (me) console.log(me.addOnId, me.instanceId, me.width.value, me.height.value);
   */
  async thisInstance(instanceId: string | undefined = instanceIdFromUrl()): Promise<AddOnInstance | undefined> {
    if (!instanceId || !(await this.available())) return undefined;
    const reply = await this.client.raw.get('/gui/add_ons', { levels: 3, properties: false, commands: false });
    for (const addOn of replyChildren(reply)) {
      for (const folder of replyChildren(addOn)) {
        if (childName(folder) !== 'instances') continue;
        for (const instance of replyChildren(folder)) {
          if (childName(instance) !== instanceId) continue;
          const node = new AddOnInstance(this.client, `/gui/add_ons/${childName(addOn)}/instances/${instanceId}`);
          await node.watch().ready;
          return node;
        }
      }
    }
    return undefined;
  }

  /**
   * True when the engine has LUNA's `/gui` (fact 103). Read once per connection: the
   * root's children are listed, because a `get` of a missing `/gui` answers `{}` (fact 10).
   *
   * @example
   * const paths = (await luna.gui.available()) ? await luna.gui.chooseFiles() : [];
   */
  available(): Promise<boolean> {
    this.presence ??= this.client.raw
      .get('/', { children: true, properties: false, commands: false })
      .then((reply) => childNames(reply).includes('gui'))
      .catch((err: unknown) => {
        this.presence = undefined; // a dropped connection is not an answer
        throw err;
      });
    return this.presence;
  }

  /** Commands go to `/gui`, so refuse at once, not after a timeout, when it is absent. */
  protected override async post<R = unknown>(command: string, payload?: unknown): Promise<R> {
    if (!(await this.available())) throw new Unsupported(`luna.gui.${command}: this engine has no /gui (a headless engine). Check luna.gui.available() first.`);
    return super.post<R>(command, payload);
  }

  /** The main window. */
  get main(): GuiWindow {
    return this.windows.byId('main') ?? new GuiWindow(this.client, '/gui/windows/main');
  }

  /**
   * Switch the main window (or another context's window) to a page, optionally at a view
   * inside it, and resolve once the window's `page` shows it (fact 236). LUNA answers with no
   * data, so the window's `page` is the confirmation. A minimised window is restored and
   * switched a moment later, which this waits for. LUNA refuses a page it cannot switch to,
   * `lunaplay` among them, with `uasrv.invalid_value`, and one this window or LUNA build
   * lacks with `uasrv.not_implemented`.
   *
   * The second argument is the context type (`'main'`) or {@link SetPageOptions}.
   *
   * @example
   * await luna.gui.setPage('mixer');
   * luna.gui.main.page.value; // 'mixer'
   * await luna.gui.setPage('universe', { route: 'index/showcase?kind=addon' });
   */
  async setPage(page: SettablePage, options: string | SetPageOptions = {}): Promise<void> {
    const { contextType = 'main', route } = typeof options === 'string' ? { contextType: options } : options;
    await this.post('set_page', route === undefined ? { page, context_type: contextType } : { page, context_type: contextType, route });
    const path = `/gui/windows/${contextType}`;
    const shown = this.client.store.cell<string>(path, 'page');
    await settle(() => shown.value === page, 'setPage', {
      path,
      refresh: () => this.client.store.load(path, { children: false, commands: false, flatvalue: true, propfilter: ['page'] }),
      flush: () => this.client.store.scheduler.flush(),
    });
  }

  openUrl(url: string): Promise<unknown> {
    return this.post('open_url', { url });
  }

  /** Reveal a file or folder in Finder / Explorer. */
  revealPath(path: string): Promise<unknown> {
    return this.post('reveal_path', { path });
  }

  openSettings(): Promise<unknown> {
    return this.post('open_settings');
  }

  openPluginManager(): Promise<unknown> {
    return this.post('open_plugin_manager');
  }

  showFeedback(): Promise<unknown> {
    return this.post('show_feedback');
  }

  showSessionInFinder(sessionPackageUid?: string): Promise<unknown> {
    return this.post('show_session_in_finder', sessionPackageUid ? { session_package_uid: sessionPackageUid } : {});
  }

  showAddOn(id: string): Promise<unknown> {
    return this.post('show_add_on', { id });
  }

  /**
   * Install Add Ons into LUNA, as LUNA's Add On Showcase does (fact 128). Give
   * `{ id }`, a showcase package id or the id of an Add On in one (its whole package
   * installs), or `{ url }`: a public GitHub repo (`https://github.com/<owner>/<repo>`; the
   * scheme, `www.`, `.git` and a path inside the repo are tolerated), whose latest release
   * LUNA lists in the showcase and installs every `.lunaaddon` of; or a Google Drive share
   * link to a `.lunaaddon` (`https://drive.google.com/file/d/<id>/view?usp=sharing`), an
   * iCloud Drive one (`https://www.icloud.com/iclouddrive/<id>#<name>`) or a Dropbox one
   * (`https://www.dropbox.com/scl/fi/<id>/<name>?rlkey=<key>&dl=0`), which LUNA downloads
   * and installs. The file has to be shared with anyone who has the link: LUNA does not
   * sign in to Google, iCloud or Dropbox. Either way LUNA asks the user to add the Add Ons, or
   * replace what is installed, so the user always confirms. A url that installs and is not
   * one of the showcase's own repos is saved, and LUNA lists it in its showcase from
   * then on, to install again; {@link removeAddOn} forgets it.
   *
   * Resolves as LUNA starts, not once installed: watch {@link addOns} for the result. A
   * repo whose latest release has nothing LUNA can install, or a shared file that is not
   * shared with anyone, a folder, or not an Add On, is only found out after this resolves, and LUNA tells the user. Rejects with a `Luna.Error` whose `code` is
   * `uasrv.invalid_value` for an id no showcase package has, a url that is not a GitHub
   * repo or a Drive, iCloud Drive or Dropbox file link, or both given; `uasrv.missing_field` for neither; `uasrv.too_many_requests` while
   * that package is already installing. A LUNA without the command (an older one, or one
   * without its Add On showcase) rejects with `Luna.Unsupported`.
   *
   * @example
   * await luna.gui.installAddOn({ url: 'https://github.com/uaudio-labs/video-window' });
   * await luna.gui.installAddOn({ url: 'https://drive.google.com/file/d/<id>/view?usp=sharing' });
   * await luna.gui.installAddOn({ url: 'https://www.icloud.com/iclouddrive/<id>#my-add-on' });
   * await luna.gui.installAddOn({ url: 'https://www.dropbox.com/scl/fi/<id>/my-add-on.lunaaddon?rlkey=<key>&dl=0' });
   * await luna.gui.installAddOn({ id: 'uaudio-labs.midi-notation' });
   */
  async installAddOn(from: { id: string } | { url: string }): Promise<void> {
    await this.post('install_add_on', from).catch(olderLuna('installAddOn', 'install_add_on'));
  }

  /**
   * Forget a link {@link installAddOn} (or LUNA's IMPORT URL) saved, as Remove from
   * Showcase in LUNA does (fact 128). `id` is the package's id under
   * `/gui/showcase/packages`, or the id of an Add On in it. Its listing leaves LUNA's
   * showcase now and at the next launch; the installed Add On is not touched. Rejects with
   * a `Luna.Error` whose `code` is `uasrv.invalid_value` for an id no showcase package
   * has, `uasrv.not_permitted` for a package of the showcase's own repos, and
   * `uasrv.missing_field` with no id. A LUNA without the command rejects with
   * `Luna.Unsupported`.
   *
   * @example
   * await luna.gui.removeAddOn('com.uaudio.qwerty_midi');
   */
  async removeAddOn(id: string): Promise<void> {
    await this.post('remove_add_on', { id }).catch(olderLuna('removeAddOn', 'remove_add_on'));
  }

  /**
   * Ask the user to remove an installed Add On (fact 130). LUNA shows its own prompt ("Remove
   * "Video Window"?"), so a page can never remove one silently. If the user agrees, LUNA closes
   * the Add On wherever it shows, deletes its folder in the Add Ons folder (with every other
   * Add On installed in that folder, which the prompt names) and rescans, so it leaves
   * {@link addOns}. An Add On installed with `ua-builder install` on macOS is a symlink: LUNA
   * removes only the link, never your project.
   *
   * Resolves as the prompt opens, not once removed: watch {@link addOns} for the result (it
   * stays there if the user cancels). Rejects with a `Luna.Error` whose `code` is
   * `uasrv.invalid_value` for an id not in {@link addOns}, `uasrv.not_permitted` for an Add On
   * built into LUNA, `uasrv.too_many_requests` while LUNA is already asking, and
   * `uasrv.missing_field` with no id. A LUNA without the command rejects with
   * `Luna.Unsupported`.
   *
   * @example
   * await luna.gui.uninstallAddOn('com.uaudio.video_window');
   */
  async uninstallAddOn(id: string): Promise<void> {
    await this.post('uninstall_add_on', { id }).catch(olderLuna('uninstallAddOn', 'uninstall_add_on'));
  }

  /**
   * Open the editor window of the plugin in `slot` on a track or bus, as clicking it in
   * LUNA's mixer does (or bring it to the front). LUNA answers before the window opens, and
   * an empty slot opens nothing: `effect.openEditor()` waits for the window and says so.
   * `sessionUid` defaults to the session in LUNA's window. `contextType` names the LUNA window
   * to open it from (`main` by default; an Add On in an alternate window passes its own, such
   * as `alt_1`); a window that is not open rejects with `uasrv.invalid_object`, and a name LUNA
   * does not know means `main` (fact 178). A LUNA without the command rejects with
   * `Luna.Unsupported`.
   *
   * @example
   * await luna.gui.showPlugin(track.id, 'effect_0');
   * await luna.gui.showPlugin(track.id, 'effect_0', { contextType: 'alt_1' });
   */
  showPlugin(channelUid: string, slot: string, options: { sessionUid?: string; contextType?: string } = {}): Promise<unknown> {
    return this.pluginWindow('show_plugin', 'showPlugin', pluginPayload(channelUid, slot, options.sessionUid, options.contextType), options.contextType);
  }

  /**
   * Close the editor window of the plugin in `slot`, if it is open. See {@link showPlugin}.
   *
   * @example
   * await luna.gui.hidePlugin(track.id, 'effect_0');
   * await luna.gui.hidePlugin(track.id, 'effect_0', { contextType: 'alt_1' });
   */
  hidePlugin(channelUid: string, slot: string, options: { sessionUid?: string; contextType?: string } = {}): Promise<unknown> {
    return this.pluginWindow('hide_plugin', 'hidePlugin', pluginPayload(channelUid, slot, options.sessionUid, options.contextType), options.contextType);
  }

  /**
   * Post show_plugin / hide_plugin. LUNA answers `uasrv.invalid_object` both when it has no
   * such command and when the named window is not open (fact 178): tell them apart by
   * whether `/gui/windows` lists the window.
   */
  private async pluginWindow(command: string, method: string, payload: Record<string, unknown>, contextType: string | undefined): Promise<unknown> {
    try {
      return await this.post(command, payload);
    } catch (err) {
      if (err instanceof UAError && err.code === 'uasrv.invalid_object' && contextType !== undefined && contextType !== 'main' && /^(editor|alt_\d+|editor_\d+)$/.test(contextType)) {
        const windows = (await this.wire.get('/gui/windows', { children: true, properties: false, commands: false }).catch(() => undefined)) as { children?: { path?: string }[] } | undefined;
        const open = (windows?.children ?? []).some((c) => c.path === contextType);
        if (!open) throw new UAError('uasrv.invalid_object', `luna.gui.${method}: LUNA has no open ${contextType} window`, { cmd: 'post', path: `/gui/${command}` });
      }
      return olderLuna(method, command)(err);
    }
  }

  /** Run a LUNA rack command by id with extra fields as its data. Escape hatch. */
  execute(command: string, data: Record<string, unknown> = {}): Promise<unknown> {
    return this.post('execute', { ...data, command });
  }

  /**
   * LUNA's native open-file dialog. Resolves to the chosen **absolute paths**, or `[]` if
   * cancelled. `filters` are wildcards such as `['*.wav', '*.aif;*.aiff']`.
   *
   * This is the **path route**, an optimization for getting files into the session: the
   * engine reads the paths from disk (`session.importPath()`, `session.importFile()`), so the
   * bytes never pass through the page. The page itself cannot read these paths; `fetch`
   * and XHR refuse them. Needs `/gui` ({@link Gui.available}) and a native engine that can
   * see the file.
   *
   * Want the audio in the page (decode, audition, slice)? Do not use this: use
   * `<input type="file">`, which gives `File` objects everywhere, and
   * `session.uploadFile({ bytes: file })` to put one into the session.
   *
   * @example
   * const [path] = await luna.gui.chooseFiles({ filters: ['*.wav'] });
   * if (path) await session.importPath(path);
   */
  chooseFiles(options: { title?: string; filters?: string[]; allowMultiple?: boolean; defaultPath?: string; timeoutMs?: number } = {}): Promise<string[]> {
    const payload: Record<string, unknown> = {};
    if (options.title !== undefined) payload['title'] = options.title;
    if (options.filters !== undefined) payload['filters'] = options.filters;
    if (options.allowMultiple !== undefined) payload['allow_multiple'] = options.allowMultiple;
    if (options.defaultPath !== undefined) payload['default_path'] = options.defaultPath;
    return this.dialog('show_open_dialog', payload, 'release_file_chooser', options.timeoutMs);
  }

  /**
   * LUNA's native folder dialog. Resolves to the chosen folders' **absolute paths**, or `[]`
   * if cancelled. A path route like {@link chooseFiles}: hand the paths to
   * {@link listFiles} or the engine, not to `fetch`. LUNA then asks the user, once for all the
   * folders picked, whether every Add On may read them (fact 133). If they allow it, each
   * becomes a blessed folder: {@link listFiles} reads it and every folder inside it, from now on
   * and after LUNA restarts. If not, you still get the paths (for `session.importPath()`), but
   * {@link listFiles} refuses them; check {@link blessedFolders}. Nothing is asked for a folder
   * already blessed or inside one. Needs `/gui` ({@link Gui.available}) and a
   * LUNA that has the dialog (fact 106); an older one rejects with `Luna.Unsupported`.
   *
   * @example
   * const [folder] = await luna.gui.chooseFolders({ title: 'Choose a sample folder' });
   * if (folder) console.log(await luna.gui.listFiles(folder));
   */
  chooseFolders(options: { title?: string; allowMultiple?: boolean; defaultPath?: string; timeoutMs?: number } = {}): Promise<string[]> {
    const payload: Record<string, unknown> = {};
    if (options.title !== undefined) payload['title'] = options.title;
    if (options.allowMultiple !== undefined) payload['allow_multiple'] = options.allowMultiple;
    if (options.defaultPath !== undefined) payload['default_path'] = options.defaultPath;
    return this.dialog('show_folder_dialog', payload, 'release_file_chooser', options.timeoutMs).catch(olderLuna('chooseFolders', 'show_folder_dialog'));
  }

  /**
   * The files and folders directly inside the folder at `path`, as LUNA sees the disk (fact
   * 106). Hidden entries are left out; the rest are in natural order, as LUNA's own browsers
   * sort: case ignored, and numbers by value, so `take2` comes before `take10`. `path` must
   * be absolute.
   *
   * LUNA lists only the blessed folders ({@link blessedFolders}) and the folders inside them:
   * one picked with {@link chooseFolders} or dropped on an Add On (`Luna.onPathDrop()`) and
   * allowed in LUNA's prompt, allowed through {@link addBlessedFolder}, or added in Settings >
   * Add Ons > FOLDERS. LUNA
   * remembers them across restarts, at most 64 (the oldest are forgotten first), until the
   * user removes them there. They are LUNA-wide, not per Add On. A path is judged where it
   * really is, so `..` or a link out of a blessed folder is refused, and so is a hidden
   * folder inside one (`.git`). For everything below a
   * folder in one call, use {@link listAllFiles}.
   *
   * Rejects with a `Luna.Error` whose `code` is `uasrv.not_permitted` when `path` is not in
   * a granted folder (whether or not anything is there: ask with {@link chooseFolders}),
   * `uasrv.filesystem_error` when nothing is at `path` or it cannot be read, and
   * `uasrv.invalid_value` when `path` is relative or names a file. An older LUNA without
   * the command rejects with `Luna.Unsupported`; an older LUNA lists any folder.
   *
   * @example
   * const [folder] = await luna.gui.chooseFolders({ title: 'Choose a sample folder' });
   * for (const entry of folder ? await luna.gui.listFiles(folder) : []) {
   *   if (!entry.isDirectory && entry.name.endsWith('.wav')) await session.importPath(entry.path);
   * }
   */
  async listFiles(path: string): Promise<FileEntry[]> {
    const reply = await this.post<{ files?: { name: string; path: string; is_directory: boolean }[] } | null>('list_files', { path }).catch(olderLuna('listFiles', 'list_files'));
    return (reply?.files ?? []).map((f) => ({ name: f.name, path: f.path, isDirectory: f.is_directory }));
  }

  /**
   * Everything below the folder at `path`, every folder inside it included (fact 133): each
   * folder's entry is followed by its own contents, each level in {@link listFiles}' order,
   * and every entry has its `relativePath`. Hidden files and folders are left out, and a link
   * to a folder is listed but not followed. `truncated` is true when LUNA stopped at its
   * limit (10,000 entries, or 5 seconds of reading); list a folder further down to see the rest. `path` must be a
   * blessed folder or inside one, with the same errors as {@link listFiles}. A LUNA that
   * cannot list recursively rejects with `Luna.Unsupported`.
   *
   * @example
   * const { files } = await luna.gui.listAllFiles('/Users/me/Samples');
   * const loops = files.filter((f) => !f.isDirectory && f.relativePath.startsWith('Loops/'));
   */
  async listAllFiles(path: string): Promise<{ files: NestedFileEntry[]; truncated: boolean }> {
    const reply = await this.post<{ files?: { name: string; path: string; is_directory: boolean; relative_path?: string }[]; truncated?: boolean } | null>('list_files', { path, recursive: true }).catch(olderLuna('listAllFiles', 'list_files'));
    // An older LUNA ignores `recursive` and lists one level, without `truncated`.
    if (typeof reply?.truncated !== 'boolean') throw new Unsupported('luna.gui.listAllFiles: this LUNA lists one folder at a time; it needs a newer LUNA. Use listFiles.');
    const files = (reply.files ?? []).map((f) => ({ name: f.name, path: f.path, isDirectory: f.is_directory, relativePath: f.relative_path ?? f.name }));
    return { files, truncated: reply.truncated };
  }

  /**
   * Ask the user to let every Add On read the folder at `path` and every folder inside it,
   * making it a blessed folder (fact 133). LUNA shows its own prompt ("An Add On wants to read
   * the folder ..."), with DON'T ALLOW as the default, so a page can never bless one
   * silently. Resolves as the prompt opens, not once answered: watch {@link blessedFolders}
   * (after {@link watchBlessedFolders}) for the result. Resolves at once, without asking, when
   * the folder is already blessed or inside one that is.
   *
   * LUNA never asks for a folder too broad for one answer: a disk's root, the home folder or
   * a folder holding it (`/Users`), or `~/Library`; ask for a folder inside one instead
   * (`~/Music`). Once the user says DON'T ALLOW, LUNA does not ask for that folder again until
   * it restarts. The user can still add any folder in Settings > Add Ons > FOLDERS.
   *
   * Rejects with a `Luna.Error` whose `code` is `uasrv.invalid_value` for a relative path or
   * a file, `uasrv.filesystem_error` when nothing is at `path`, `uasrv.not_permitted`
   * (without asking) for a folder too broad or one the user refused this session, and
   * `uasrv.too_many_requests` while LUNA is already asking. A LUNA without the command
   * rejects with `Luna.Unsupported`.
   *
   * @example
   * await luna.gui.watchBlessedFolders();
   * await luna.gui.addBlessedFolder('/Users/me/Samples');
   * luna.gui.blessedFolders.onChange(() => console.log(luna.gui.blessedFolders.value));
   */
  async addBlessedFolder(path: string): Promise<void> {
    await this.post('add_blessed_folder', { path }).catch(olderLuna('addBlessedFolder', 'add_blessed_folder'));
  }

  /**
   * Stop letting Add Ons read a blessed folder (fact 133), without asking: removing access
   * needs no consent. `path` must be one of {@link blessedFolders}; a folder inside one cannot
   * be removed on its own. {@link blessedFolders} has changed by the time this resolves.
   * Rejects with a `Luna.Error` whose `code` is `uasrv.invalid_value` for any other path. A
   * LUNA without the command rejects with `Luna.Unsupported`.
   *
   * @example
   * for (const folder of luna.gui.blessedFolders.value ?? []) await luna.gui.removeBlessedFolder(folder);
   */
  async removeBlessedFolder(path: string): Promise<void> {
    await this.post('remove_blessed_folder', { path }).catch(olderLuna('removeBlessedFolder', 'remove_blessed_folder'));
  }

  /**
   * The URL your Add On's page loads a local file from, given its absolute `path` (from
   * {@link chooseFiles}, {@link listFiles}, `Luna.onPathDrop()`, or a path you saved, say in
   * `session.storage`). Set it as a `<video>`, `<audio>` or `<img>` `src`, or read the bytes
   * with XMLHttpRequest (fact 114). This is how a page plays or reads a file it knows only by
   * path.
   *
   * Any file in a blessed folder ({@link blessedFolders}) is served whatever its type: JSON,
   * text, images, PDFs as well as media (fact 133). Hidden files below the blessed folder
   * (`.git`, `.env`) and links that lead out of it are not. Outside the blessed folders only
   * audio, video and MIDI are served, as below.
   *
   * `addOnId` is your manifest's `id`: the file is served to that Add On's pages only. On
   * macOS the URL is `ua-content://<your Add On>/<path>` and supports byte ranges, so media
   * seeks without reading the whole file; on Windows it is a `file:///` URL, which media
   * elements and XMLHttpRequest load but `fetch()` refuses. Ask again
   * after every reload: LUNA forgets the files it served when it quits.
   *
   * Outside the blessed folders only real media is served. LUNA follows links and checks the file they lead to: it needs
   * an audio, video or MIDI extension (`mp4`, `m4v`, `mov`, `webm`, `ogv`, `wav`, `aif`,
   * `aiff`, `mp3`, `m4a`, `flac`, `ogg`, `oga`, `opus`, `mid`, `midi`) and that format's
   * signature in its first bytes (`MThd` for a Standard MIDI File). Rejects with a
   * `Luna.Error` whose `code` is `uasrv.invalid_value` for a relative path, a folder, or a
   * file outside the blessed folders that is not audio, video or MIDI; `uasrv.filesystem_error` when
   * nothing is at `path` (a session opened on another computer, a file moved) or it cannot
   * be read; `uasrv.not_installed` when `addOnId` names no installed Add On with a local
   * page. A LUNA without the command rejects with `Luna.Unsupported`.
   *
   * @example
   * const [path] = await luna.gui.chooseFiles({ filters: ['*.mov;*.mp4'] });
   * if (path) video.src = await luna.gui.serveMediaFile('com.example.my-add-on', path);
   */
  async serveMediaFile(addOnId: string, path: string): Promise<string> {
    const reply = await this.post<{ url?: string } | null>('serve_media_file', { add_on_id: addOnId, path }).catch(olderLuna('serveMediaFile', 'serve_media_file'));
    if (typeof reply?.url !== 'string') throw new UAError('uasrv.default_error', 'serve_media_file: LUNA replied no url', { cmd: 'post', path: '/gui/serve_media_file' });
    return reply.url;
  }

  /**
   * LUNA's native save dialog. Resolves to the chosen absolute path, or `undefined` if
   * cancelled. Like {@link chooseFiles} the path is for the engine (for example a render's
   * `outputPaths`); the page cannot write to it.
   *
   * @example
   * const path = await luna.gui.chooseSavePath({ extensions: ['wav'] });
   */
  async chooseSavePath(options: { defaultPath?: string; extensions?: string[]; timeoutMs?: number } = {}): Promise<string | undefined> {
    const payload: Record<string, unknown> = {};
    if (options.defaultPath !== undefined) payload['default_path'] = options.defaultPath;
    if (options.extensions !== undefined) payload['extensions'] = options.extensions;
    // LUNA honours release_file_chooser for every dialog; release_save_dialog is the name LUNA
    // 3.0 had, kept by later builds only as an alias due to be removed (fact 180).
    const files = await this.dialog('show_save_dialog', payload, ['release_file_chooser', 'release_save_dialog'], options.timeoutMs);
    return files[0];
  }

  /** Show a progress task in LUNA. Call `progress()` with 0..100, then `done()`. */
  async startTask(title: string, options: { nativeProgressBar?: boolean } = {}): Promise<ProgressTask> {
    const taskUid = randomUid();
    const payload: Record<string, unknown> = { task_uid: taskUid, title };
    if (options.nativeProgressBar !== undefined) payload['use_native_progress_bar'] = options.nativeProgressBar;
    await this.post('add_task', payload);
    return {
      progress: (percent) => this.post('update_task', { task_uid: taskUid, percent_complete: percent }).then(() => undefined),
      done: () => this.post('remove_task', { task_uid: taskUid }).then(() => undefined),
    };
  }

  /**
   * Hold back LUNA's modal progress dialog while this page shows its own progress UI, and
   * close one already open (fact 223). The hold is app-wide: it withholds the dialog of every
   * task but one started with `nativeProgressBar`. Release it from a `finally`; a watchdog
   * releases it after `maxMs` (default two minutes), and so does the page going away when it
   * still can. LUNA does not drop an Add On's hold when the Add On closes (fact 224).
   *
   * @example
   * const hold = await luna.gui.suppressProgress();
   * try {
   *   await work();
   * } finally {
   *   await hold.release();
   * }
   */
  suppressProgress(options: SuppressProgressOptions = {}): Promise<ProgressSuppression> {
    return suppressProgress((command, payload) => this.post(command, payload).catch(olderLuna('suppressProgress', command)), randomUid(), options);
  }

  private async dialog(command: string, payload: Record<string, unknown>, release: string | readonly string[], timeoutMs = 10 * 60_000): Promise<string[]> {
    const reply = (await this.post(command, payload)) as { uid?: string } | string | null;
    const uid = typeof reply === 'string' ? reply : reply?.uid;
    if (!uid) return [];
    const node = `/gui/file_chooser/${uid}`;
    const status = this.client.store.cell<string>(node, 'status');
    const files = this.client.store.cell<{ path: string }[]>(node, 'files');
    const watch = this.client.store.watch(node, { load: { flatvalue: true, commands: false } });
    try {
      await watch.ready;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          unsub();
          reject(new RequestTimeout(command, node, timeoutMs));
        }, timeoutMs);
        const check = () => {
          const s = status.value;
          if (s === 'selected' || s === 'cancelled') {
            clearTimeout(timer);
            unsub();
            resolve();
          }
        };
        const unsub = status.onChange(check);
        check();
      });
      return status.value === 'selected' ? (files.value ?? []).map((f) => f.path) : [];
    } finally {
      watch.release();
      // The first release name LUNA accepts; the rest are older names for it.
      for (const name of typeof release === 'string' ? [release] : release) {
        if (await this.post(name, { uid }).then(() => true, () => false)) break;
      }
    }
  }
}

/**
 * A LUNA that predates a `/gui` command answers it `uasrv.invalid_object` (fact 106); say
 * so instead of passing on an error that reads like a bad path.
 */
function olderLuna(method: string, command: string): (err: unknown) => never {
  return (err) => {
    if (err instanceof UAError && err.code === 'uasrv.invalid_object') {
      throw new Unsupported(`luna.gui.${method}: this LUNA has no /gui/${command}; it needs a newer LUNA.`);
    }
    throw err;
  };
}

function pluginPayload(channelUid: string, slot: string, sessionUid: string | undefined, contextType?: string): Record<string, unknown> {
  const payload: Record<string, unknown> = { channel_uid: channelUid, insert_type: slot };
  if (sessionUid !== undefined) payload['session_uid'] = sessionUid;
  if (contextType !== undefined) payload['context_type'] = contextType;
  return payload;
}

/** LUNA writes uids without dashes in `/gui/plugin_windows`; compare them in one form. */
function sameUid(a: string, b: string): boolean {
  return a.replaceAll('-', '').toLowerCase() === b.replaceAll('-', '').toLowerCase();
}

function randomUid(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  const raw = g.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  return raw.replaceAll('-', '');
}

/** Child names of a `get /?children=1` reply, as plain names. */
/** The page's `add_on_inst` query parameter, or `undefined` (not an Add On page, or no `location`). */
function instanceIdFromUrl(): string | undefined {
  const search = (globalThis as { location?: { search?: unknown } }).location?.search;
  if (typeof search !== 'string') return undefined;
  return new URLSearchParams(search).get('add_on_inst') ?? undefined;
}

/** The children of a `get` reply, as objects. */
function replyChildren(reply: unknown): unknown[] {
  const children = typeof reply === 'object' && reply !== null ? (reply as { children?: unknown }).children : undefined;
  return Array.isArray(children) ? children.filter((c) => typeof c === 'object' && c !== null) : [];
}

/** The last path segment of a reply child. */
function childName(child: unknown): string {
  const raw = (child as { path?: unknown; name?: unknown }).path ?? (child as { name?: unknown }).name;
  return typeof raw === 'string' ? raw.slice(raw.lastIndexOf('/') + 1) : '';
}

