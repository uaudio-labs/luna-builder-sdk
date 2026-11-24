# Class: FolderTree\<T\>

A snapshot of the folder hierarchy: rows in LUNA's order (each folder followed by
everything inside it), the rows to draw under collapsed folders, selection expansion, and
the folder a channel's main output sums into. Make one with [folderTree](../functions/folderTree.md).

## Example

```ts
const tree = Luna.folderTree(session);
tree.rows.map((r) => '  '.repeat(r.depth) + r.channel.name.value).join('\n');
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`FolderChannel`](../interfaces/FolderChannel.md) | [`Track`](Track.md) \| [`Bus`](Bus.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="anomalies"></a> `anomalies` | `readonly` | readonly [`FolderAnomaly`](../interfaces/FolderAnomaly.md)[] | Everything malformed about the links; empty for a well-formed session. |
| <a id="roots"></a> `roots` | `readonly` | readonly [`FolderRow`](../interfaces/FolderRow.md)\<`T`\>[] | The rows at the session root, in order, anomalies drawn there included. |
| <a id="rows"></a> `rows` | `readonly` | readonly [`FolderRow`](../interfaces/FolderRow.md)\<`T`\>[] | Every row, depth first: a folder comes right before its contents, siblings by `order`. |

## Methods

### descendants()

```ts
descendants(folder): FolderRow<T>[];
```

Everything inside a folder, nested folders' contents included, in order; the folder
itself is left out. Empty for a track, an empty folder or an unknown id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `folder` | [`ChannelRef`](../type-aliases/ChannelRef.md) |

#### Returns

[`FolderRow`](../interfaces/FolderRow.md)\<`T`\>[]

#### Example

```ts
const inside = tree.descendants(drums).map((r) => r.channel);
```

***

### expandSelection()

```ts
expandSelection(ids): string[];
```

A track selection as LUNA widens it (fact 182): a selected folder brings everything inside it, right
after it. Order is kept, duplicates are dropped (first place wins), and ids not in the
tree are dropped.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ids` | readonly [`ChannelRef`](../type-aliases/ChannelRef.md)[] |

#### Returns

`string`[]

#### Example

```ts
const ctx = session.context;
const ids = tree.expandSelection(ctx.selectionTracks.value ?? []);
```

***

### row()

```ts
row(channel): FolderRow<T> | undefined;
```

The row of a track or bus, by id or object; `undefined` when it is not in the tree.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | [`ChannelRef`](../type-aliases/ChannelRef.md) |

#### Returns

[`FolderRow`](../interfaces/FolderRow.md)\<`T`\> \| `undefined`

#### Example

```ts
tree.row(track)?.depth;   // 1 inside a top-level folder
```

***

### summingFolder()

```ts
summingFolder(channel): T | null;
```

The summing folder a track or bus's main output goes to, as LUNA routes it (fact 136): the
nearest `summing` folder above it, passing through `container` ones; `null` for the master
(no summing folder above, or a channel not in the tree). A summing folder gives the one
above it, never itself. It follows the channels' own `folderUid` links, as LUNA does, not
the re-rooted rows, and stops at a loop.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | [`ChannelRef`](../type-aliases/ChannelRef.md) |

#### Returns

`T` \| `null`

#### Example

```ts
const target = tree.summingFolder(track);
label.textContent = target ? `→ ${target.name.value}` : '→ Master';
```

***

### visibleRows()

```ts
visibleRows(options): FolderRow<T>[];
```

The rows to draw: [rows](#rows) without everything inside a collapsed folder, a collapsed
folder inside another included, and without what `filter` rejects.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`VisibleRowsOptions`](../interfaces/VisibleRowsOptions.md)\<`T`\> |

#### Returns

[`FolderRow`](../interfaces/FolderRow.md)\<`T`\>[]

#### Example

```ts
const ctx = session.context;
const rows = tree.visibleRows({
  collapsed: ctx.collapsedFolders.value,
  filter: (r) => !(r.channel instanceof Luna.Track && ['click', 'count_in'].includes(r.channel.trackType.value ?? '')),
});
```
