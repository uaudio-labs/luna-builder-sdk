# Function: parseFolderMode()

```ts
function parseFolderMode(value): FolderMode | undefined;
```

A `folder_mode` value as a [FolderMode](../type-aliases/FolderMode.md), or `undefined`. A mode that has not arrived
yet is `undefined` too, which is not a folder: test for one with `Bus.isFolder`, not with
`mode !== 'none'`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

[`FolderMode`](../type-aliases/FolderMode.md) \| `undefined`

## Example

```ts
Luna.parseFolderMode('summing');   // 'summing'
Luna.parseFolderMode(2);           // undefined
```
