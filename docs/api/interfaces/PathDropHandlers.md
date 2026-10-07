# Interface: PathDropHandlers

## Methods

### dragLeave()?

```ts
optional dragLeave(): void;
```

The drag left the page or was cancelled.

#### Returns

`void`

***

### dragOver()?

```ts
optional dragOver(drag): void;
```

A file drag entered or moved over the page; highlight a drop zone.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `drag` | [`PathDrop`](PathDrop.md) |

#### Returns

`void`

***

### drop()

```ts
drop(drop): void;
```

The user dropped files on the page.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `drop` | [`PathDrop`](PathDrop.md) |

#### Returns

`void`
