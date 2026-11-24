# Interface: UnusedMedia

The answer of [Workspace.unusedMedia](../classes/Workspace.md#unusedmedia) and [Workspace.deleteUnusedMedia](../classes/Workspace.md#deleteunusedmedia).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="kept"></a> `kept` | `readonly` | readonly `object`[] \| `undefined` | Every other file and why it stays; `undefined` on a LUNA that does not list them. |
| <a id="onlyinbackupscount"></a> `onlyInBackupsCount` | `readonly` | `number` | Files only auto-backups use. |
| <a id="totalfiles"></a> `totalFiles` | `readonly` | `number` | Audio files in the package's folder. |
| <a id="unusedcount"></a> `unusedCount` | `readonly` | `number` | Files removed, or that would be in a pre-flight. |
| <a id="unuseduids"></a> `unusedUids` | `readonly` | readonly `string`[] \| `undefined` | The uids counted by `unusedCount`; `undefined` on a LUNA that does not list them. |
