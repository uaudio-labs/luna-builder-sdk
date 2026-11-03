/**
 * A bus: `/sessions/<uid>/buses/<id>`. The master bus has `busType === 'master'`;
 * cue buses report `cue_0`..`cue_N`.
 */
import type { Client } from '../client/client';
import type { Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import { Channel } from './channel';
import { settle } from './settle';

export type BusType = 'master' | 'aux' | 'input' | 'talkback' | 'loopback' | 'headphone' | `cue_${number}` | string;
/**
 * A bus's folder mode (fact 136). `'summing'`: a folder track whose children's main outputs go
 * to it, so it is their bus. `'container'`: a folder that only groups; its children route past
 * it to the nearest summing folder above, else the master. `'none'`: an ordinary bus.
 */
export type FolderMode = 'none' | 'summing' | 'container';

export class Bus extends Channel {
  readonly busType: Prop<BusType>;
  readonly folderMode: Prop<FolderMode>;

  /** @internal */
  constructor(client: Client, path: string, sessionUid: string) {
    super(client, path, sessionUid);
    this.busType = this.prop<BusType>('bus_type');
    this.folderMode = this.prop<FolderMode>('folder_mode');
  }

  get isMaster(): boolean {
    return this.busType.value === 'master';
  }

  /** A folder is an aux bus whose folder mode is not `none`. */
  get isFolder(): boolean {
    const m = this.folderMode.value;
    return m !== undefined && m !== 'none';
  }

  /**
   * Change this aux bus's {@link FolderMode} in one undo step, and resolve once
   * {@link folderMode} shows it (fact 136). LUNA reroutes the main output of everything inside
   * it: into a `'summing'` folder, past a `'container'` one. `'none'` makes it an ordinary bus
   * and moves what was directly inside it to the session root.
   *
   * @throws {UAError} `uasrv.invalid_value` for a bus that is not an aux bus.
   * @example
   * const drums = await session.newFolder({ name: 'Drums', mode: 'container' });
   * await drums.setFolderMode('summing'); // its tracks now play through it
   */
  async setFolderMode(mode: FolderMode): Promise<void> {
    if (mode !== 'none' && mode !== 'summing' && mode !== 'container') throw new UAError('out_of_range', `setFolderMode(): unknown mode ${String(mode)}`, { path: this.path });
    const sessionPath = `/sessions/${this.sessionUid}`;
    await this.wire.post(`${sessionPath}/buses/set_folder_mode`, { session_uid: this.sessionUid, bus_uid: this.id, folder_mode: mode });
    await settle(() => this.folderMode.value === mode, 'set folder mode', {
      path: this.path,
      refresh: () => this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }),
      flush: () => this.client.store.scheduler.flush(),
    });
  }
}
