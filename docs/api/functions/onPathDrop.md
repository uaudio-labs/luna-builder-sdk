# Function: onPathDrop()

```ts
function onPathDrop(handlers): Unsubscribe;
```

Receive files dropped on the page as **absolute paths** (LUNA only). Resolves nothing and
reads nothing: pass the paths to `session.importPath()`, which has the engine read them
from disk. Returns an unsubscribe; once the last handler is gone, LUNA hands file drags
back to the page's HTML `drop` events.

Drops are page-wide: route one to a zone by hit-testing its `x`, `y` (page pixels), for
example `document.elementFromPoint(x, y)?.closest('.zone')`.

Throws [Unsupported](../classes/Unsupported.md) outside LUNA. Check [canDropPaths](canDropPaths.md) first and fall back
to an HTML `drop` listener there. In LUNA 3.1.0.4589 and earlier, after the Add On's
window is closed and reopened, drops arrive as HTML drops instead (fact 105): keep an HTML
`drop` listener as well.

Want the file's bytes in the page (decode, play, slice)? Do not use this: listen for HTML
`drop` and read `event.dataTransfer.files`, then `session.uploadFile({ bytes: file })`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `handlers` | \| [`PathDropHandlers`](../interfaces/PathDropHandlers.md) \| (`drop`) => `void` |

## Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

## Example

```ts
if (Luna.canDropPaths()) {
  const stop = Luna.onPathDrop({
    dragOver: () => zone.classList.add('hot'),
    dragLeave: () => zone.classList.remove('hot'),
    drop: async ({ paths }) => {
      zone.classList.remove('hot');
      for (const path of paths) await session.importPath(path);
    },
  });
}
```
