/**
 * A bus: `/sessions/<uid>/buses/<id>`. The master bus has `busType === 'master'`;
 * cue buses report `cue_0`..`cue_N`.
 */
import type { Client } from '../client/client';
import type { Prop } from '../store/prop';
import { Channel } from './channel';

export type BusType = 'master' | 'aux' | 'input' | 'talkback' | 'loopback' | 'headphone' | `cue_${number}` | string;
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
}
