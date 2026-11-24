# Function: folderTree()

## Call Signature

```ts
function folderTree(source): FolderTree<Track | Bus>;
```

Build the folder tree of a session's tracks and buses, or of a list of channels.

### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | [`Session`](../classes/Session.md) |

### Returns

[`FolderTree`](../classes/FolderTree.md)\<[`Track`](../classes/Track.md) \| [`Bus`](../classes/Bus.md)\>

### Example

```ts
const tree = Luna.folderTree(session);
const collapsed = session.context.collapsedFolders.value;
for (const row of tree.visibleRows({ collapsed })) {
  draw(row.channel.name.value, { indent: row.depth, folder: row.isFolder });
}
```

## Call Signature

```ts
function folderTree<T>(source): FolderTree<T>;
```

Build the folder tree of a session's tracks and buses, or of a list of channels.

### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`FolderChannel`](../interfaces/FolderChannel.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | readonly `T`[] |

### Returns

[`FolderTree`](../classes/FolderTree.md)\<`T`\>

### Example

```ts
const tree = Luna.folderTree(session);
const collapsed = session.context.collapsedFolders.value;
for (const row of tree.visibleRows({ collapsed })) {
  draw(row.channel.name.value, { indent: row.depth, folder: row.isFolder });
}
```
