# Interface: SourceUsageEntry

Every use of one file.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `readonly` | `string` | The source file's uid. |
| <a id="trackuids"></a> `trackUids` | `readonly` | readonly `string`[] | The distinct tracks among [uses](#uses), in session order of first use. |
| <a id="uses"></a> `uses` | `readonly` | readonly [`SourceUse`](SourceUse.md)[] | - |
