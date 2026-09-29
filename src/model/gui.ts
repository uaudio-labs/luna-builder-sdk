/**
 * LUNA's host surface: `/gui`. Present only when connected to LUNA itself (not the wasm
 * engine). Lets an Add On ask LUNA to open dialogs, switch pages, show other Add Ons,
 * open URLs and report progress.
 *
 * @example
 * const files = await luna.gui.chooseFiles({ filters: ['*.wav'], allowMultiple: true });
 * await luna.gui.setPage('mixer');
 * await luna.gui.openUrl('https://uaudio.com');
 * const task = await luna.gui.startTask('Rendering'); await task.progress(50); await task.done();
 */
import type { Client } from '../client/client';
import type { Prop, WritableProp } from '../store/prop';
import { RequestTimeout } from '../wire/errors';
import { Collection } from './collection';
import { Node } from './node';

export type GuiPage = 'mixer' | 'timeline' | 'home' | 'addon' | 'dashboard' | 'lunaplay' | string;
export type AddOnTarget = 'window' | 'app' | 'browser';

export class AddOn extends Node {
  readonly addOnId: Prop<string>;
  readonly title: Prop<string>;
  readonly target: Prop<AddOnTarget>;
  /** Absolute file path of the icon, or `''`. */
  readonly icon: Prop<string>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.addOnId = this.prop<string>('id');
    this.title = this.prop<string>('title');
    this.target = this.prop<AddOnTarget>('target');
    this.icon = this.prop<string>('icon');
  }

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

export interface ProgressTask {
  progress(percent: number): Promise<void>;
  done(): Promise<void>;
}

export class Gui extends Node {
  /** Installed Add Ons, by manifest id. */
  readonly addOns: Collection<AddOn>;
  /** Windows by context type; `main` is the arrangement window. */
  readonly windows: Collection<GuiWindow>;
  /** Record-arm mode of LUNA's transport bar. */
  readonly armMode: WritableProp<boolean>;
  readonly priorLaunchCount: Prop<number>;

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
   * Native open-file dialog. Resolves to the chosen absolute paths, or `[]` if cancelled.
   * `filters` are wildcards such as `['*.wav', '*.aif;*.aiff']`.
   */
  chooseFiles(options: { title?: string; filters?: string[]; allowMultiple?: boolean; defaultPath?: string; timeoutMs?: number } = {}): Promise<string[]> {
    const payload: Record<string, unknown> = {};
    if (options.title !== undefined) payload['title'] = options.title;
    if (options.filters !== undefined) payload['filters'] = options.filters;
    if (options.allowMultiple !== undefined) payload['allow_multiple'] = options.allowMultiple;
    if (options.defaultPath !== undefined) payload['default_path'] = options.defaultPath;
    return this.dialog('show_open_dialog', payload, 'release_file_chooser', options.timeoutMs);
  }

  /** Native save dialog. Resolves to the chosen path, or `undefined` if cancelled. */
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

function randomUid(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  const raw = g.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  return raw.replaceAll('-', '');
}
