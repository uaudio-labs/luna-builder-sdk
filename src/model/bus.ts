/**
 * A bus: `/sessions/<uid>/buses/<id>`. The master bus has `busType === 'master'`;
 * cue buses report `cue_0`..`cue_N`.
 */
import type { Client } from '../client/client';
import type { Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import { Channel } from './channel';
import type { PresetRow } from './presets';
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
  /** The uid of the track preset last applied to this bus, or null (fact 169). */
  readonly presetUid: Prop<string | null>;
  /** That preset's name, or null. */
  readonly presetName: Prop<string | null>;

  /** @internal */
  constructor(client: Client, path: string, sessionUid: string) {
    super(client, path, sessionUid);
    this.busType = this.prop<BusType>('bus_type');
    this.folderMode = this.prop<FolderMode>('folder_mode');
    this.presetUid = this.prop<string | null>('preset_uid');
    this.presetName = this.prop<string | null>('preset_name');
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

  /**
   * Delete this bus in one undo step (`delete_bus`), and resolve once it has left
   * `session.buses` (fact 168). A folder's contents stay where they were, now outside it; use
   * {@link deleteWithContents} to take them too. Sends and outputs that fed the bus are kept,
   * marked `device.missing_bus` (fact 83).
   *
   * @throws {UAError} `device.database_error` for the master bus, `uasrv.invalid_type` for a
   * cue bus or one LUNA does not know.
   * @example
   * const fx = await session.newBus({ name: 'Scratch FX' });
   * await fx.delete();
   */
  async delete(): Promise<void> {
    this.assertLive();
    const sessionPath = `/sessions/${this.sessionUid}`;
    await this.wire.post(`${sessionPath}/delete_bus`, { session_uid: this.sessionUid, bus_uid: this.id });
    await this.settleGone([this.id], 'delete bus');
  }

  /**
   * Delete this folder and everything inside it, nested folders included, in one undo step
   * (`buses/delete_folder_with_contents`), and resolve once all of it has left the session
   * (fact 168).
   *
   * @throws {UAError} `uasrv.invalid_value` when this bus is not a folder (or LUNA does not
   * know it).
   * @example
   * const drums = session.folders.find((f) => f.name.value === 'Drums');
   * await drums?.deleteWithContents();
   */
  async deleteWithContents(): Promise<void> {
    this.assertLive();
    const session = this.client.sessions.items.member(this.sessionUid);
    const doomed = [this.id];
    for (let i = 0; i < doomed.length; i++) {
      for (const ch of [...session.tracks.items, ...session.buses.items]) if (ch.folderUid.value === doomed[i] && !doomed.includes(ch.id)) doomed.push(ch.id);
    }
    await this.wire.post(`/sessions/${this.sessionUid}/buses/delete_folder_with_contents`, { session_uid: this.sessionUid, bus_uid: this.id });
    await this.settleGone(doomed, 'delete folder');
  }

  /**
   * Apply a track preset to this bus in one undo step, as LUNA's bus header PRESETS > Assign
   * does: `/presets/devices/track/load` with `is_bus` (fact 169). The preset's plugins, sends
   * and mixer settings replace the bus's; {@link presetUid} follows. A plugin's preset is
   * refused on a bus (`uasrv.invalid_type`).
   *
   * @example
   * const [row] = await luna.presets.query({ deviceTypeId: 'track', tags: ['Bus'] });
   * await bus.loadPreset(row);
   */
  async loadPreset(preset: string | Pick<PresetRow, 'uid'>): Promise<void> {
    const uid = typeof preset === 'string' ? preset : preset.uid;
    await this.wire.post('/presets/devices/track/load', { session_uid: this.sessionUid, uid: this.id, preset_uid: uid, is_bus: true });
  }

  /** Resolve once none of `ids` is listed as a track or bus of the session. */
  private async settleGone(ids: readonly string[], what: string): Promise<void> {
    const session = this.client.sessions.items.member(this.sessionUid);
    await settle(() => ids.every((id) => session.tracks.byId(id) === undefined && session.buses.byId(id) === undefined), what, {
      path: `/sessions/${this.sessionUid}/buses`,
      refresh: () => Promise.all([session.tracks.reload(), session.buses.reload()]).then(() => undefined),
      flush: () => this.client.store.scheduler.flush(),
    });
  }
}
