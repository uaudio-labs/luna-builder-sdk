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
 */
import type { Client } from '../client/client';
import type { Prop, WritableProp } from '../store/prop';
import { RequestTimeout, UAError, Unsupported } from '../wire/errors';
import { Collection } from './collection';
import { Node } from './node';

export type GuiPage = 'mixer' | 'timeline' | 'home' | 'addon' | 'dashboard' | 'lunaplay' | string;
export type AddOnTarget = 'window' | 'app' | 'browser' | 'editor';

export class AddOn extends Node {
  /** The manifest's `id`, in lowercase: LUNA compares ids without case. */
  readonly addOnId: Prop<string>;
  /** The manifest's `name`: its menu item and panel header. */
  readonly name: Prop<string>;
  readonly target: Prop<AddOnTarget>;
  /** Absolute file path of the icon, or `''`. */
  readonly icon: Prop<string>;
  /** The manifest's `floating`: `true` unless it says `false`. Meaningful for `'window'` only. */
  readonly floating: Prop<boolean>;
  /** The manifest's `show_with_session`: `false` unless it says `true`. Meaningful for `'window'` only. */
  readonly showWithSession: Prop<boolean>;
  /** The manifest's `manufacturer`, or `''` when it has none. */
  readonly manufacturer: Prop<string>;
  /** The manifest's `description`, an array of strings already concatenated, or `''` when it has none. */
  readonly description: Prop<string>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.addOnId = this.prop<string>('id');
    this.name = this.prop<string>('name');
    this.target = this.prop<AddOnTarget>('target');
    this.icon = this.prop<string>('icon');
    this.floating = this.prop<boolean>('floating');
    this.showWithSession = this.prop<boolean>('show_with_session');
    this.manufacturer = this.prop<string>('manufacturer');
    this.description = this.prop<string>('description');
  }

  /** Show it in LUNA by target: navigate to an `'app'`, open a `'window'` (toggling it like its
   *  menu item), show a `'browser'` in the secondary browser, or an `'editor'` in the Timeline's
   *  editor panel (never toggling either closed). */
  show(): Promise<unknown> {
    return this.wire.post('/gui/show_add_on', { id: this.id });
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
  /** Absolute path, for the engine (`session.importPath()`); the page cannot read it. */
  path: string;
  /** True for a folder, or a link to one. */
  isDirectory: boolean;
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
  private presence: Promise<boolean> | undefined;

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
      .then((reply) => rootChildNames(reply).includes('gui'))
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

  /** Switch the main window (or another context's window) to a page. */
  setPage(page: GuiPage, contextType = 'main'): Promise<unknown> {
    return this.post('set_page', { page, context_type: contextType });
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
   * {@link listFiles} or the engine, not to `fetch`. Picking a folder lets {@link listFiles}
   * read it and every folder inside it, from now on and after LUNA restarts. Needs `/gui` ({@link Gui.available}) and a
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
   * LUNA lists only folders the user gave it: one picked with {@link chooseFolders} or
   * dropped on an Add On (`Luna.onPathDrop()`), or a folder inside one. LUNA remembers
   * them across restarts, at most 64 (the oldest are forgotten first), until the user
   * clicks FORGET FOLDERS in Settings > Add Ons. They are LUNA-wide, not per Add On. A
   * path is judged where it really is, so `..` or a link out of a granted folder is
   * refused.
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
   * The URL your Add On's page loads a local audio or video file from, given its absolute
   * `path` (from {@link chooseFiles}, `Luna.onPathDrop()`, or a path you saved, say in
   * `session.preferences`). Set it as a `<video>` or `<audio>` `src`, or read the bytes with
   * XMLHttpRequest (fact 114). This is how a page plays or reads a file it knows only by path.
   *
   * `addOnId` is your manifest's `id`: the file is served to that Add On's pages only. On
   * macOS the URL is `ua-content://<your Add On>/<path>` and supports byte ranges, so media
   * seeks without reading the whole file; on Windows it is a `file:///` URL, which media
   * elements and XMLHttpRequest load but `fetch()` refuses. Ask again
   * after every reload: LUNA forgets the files it served when it quits.
   *
   * Only real media is served. LUNA follows links and checks the file they lead to: it needs
   * an audio or video extension (`mp4`, `m4v`, `mov`, `webm`, `ogv`, `wav`, `aif`, `aiff`,
   * `mp3`, `m4a`, `flac`, `ogg`, `oga`, `opus`) and that format's signature in its first
   * bytes. Rejects with a `Luna.Error` whose `code` is `uasrv.invalid_value` for a relative
   * path, a folder, or a file that is not audio or video; `uasrv.filesystem_error` when
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
    const files = await this.dialog('show_save_dialog', payload, 'release_save_dialog', options.timeoutMs);
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

  private async dialog(command: string, payload: Record<string, unknown>, release: string, timeoutMs = 10 * 60_000): Promise<string[]> {
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
      await this.post(release, { uid }).catch(() => undefined);
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

function randomUid(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  const raw = g.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  return raw.replaceAll('-', '');
}

/** Child names of a `get /?children=1` reply, as plain names. */
function rootChildNames(reply: unknown): string[] {
  const children = typeof reply === 'object' && reply !== null ? (reply as { children?: unknown }).children : undefined;
  if (!Array.isArray(children)) return [];
  const out: string[] = [];
  for (const child of children) {
    const raw = typeof child === 'string' ? child : typeof child === 'object' && child !== null ? ((child as { path?: unknown; name?: unknown }).path ?? (child as { name?: unknown }).name) : undefined;
    if (typeof raw === 'string') out.push(raw.slice(raw.lastIndexOf('/') + 1));
  }
  return out;
}
