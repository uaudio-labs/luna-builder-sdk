/**
 * The `controls` folder of a track, bus, output or effect. Controls are addressed by name
 * (`gain`, `mute`, `solo`, ...) and can be referenced before the list has loaded.
 */
import type { Client } from '../client/client';
import { Collection } from './collection';
import { Control } from './control';

export class Controls extends Collection<Control> {
  private readonly named = new Map<string, Control>();

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path, (childPath) => new Control(client, childPath), { levels: 2, commands: false, flatvalue: true });
  }

  /**
   * The control called `name`. Always returns an object; its props are `undefined` until the
   * folder is loaded or the engine pushes it.
   */
  get(name: string): Control {
    const listed = this.byId(name);
    if (listed) return listed;
    let c = this.named.get(name);
    if (!c) {
      c = new Control(this.client, `${this.path}/${name}`);
      this.named.set(name, c);
    }
    return c;
  }

  /** @internal Dispose the listed controls and the ones handed out by name before they were listed. */
  override dispose(): void {
    super.dispose();
    for (const c of this.named.values()) c.dispose();
    this.named.clear();
  }
}
