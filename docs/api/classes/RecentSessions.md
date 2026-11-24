# Class: RecentSessions

The live list [Workspace.recentList](Workspace.md#recentlist) answers. `byId` takes a package uid with or
without dashes.

## Example

```ts
const recent = await luna.workspace.recentList(10);
recent.items[0]?.name;
await recent.refresh();
recent.dispose();
```

## Implements

- [`List`](../interfaces/List.md)\<[`RecentSessionRow`](../interfaces/RecentSessionRow.md)\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="limit"></a> `limit` | `readonly` | `number` |

## Accessors

### items

#### Get Signature

```ts
get items(): readonly RecentSessionRow[];
```

##### Returns

readonly [`RecentSessionRow`](../interfaces/RecentSessionRow.md)[]

#### Implementation of

[`List`](../interfaces/List.md).[`items`](../interfaces/List.md#items)

***

### value

#### Get Signature

```ts
get value(): readonly RecentSessionRow[];
```

##### Returns

readonly [`RecentSessionRow`](../interfaces/RecentSessionRow.md)[]

#### Implementation of

[`List`](../interfaces/List.md).[`value`](../interfaces/List.md#value)

## Methods

### byId()

```ts
byId(packageUid): RecentSessionRow | undefined;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `packageUid` | `string` |

#### Returns

[`RecentSessionRow`](../interfaces/RecentSessionRow.md) \| `undefined`

#### Implementation of

[`List`](../interfaces/List.md).[`byId`](../interfaces/List.md#byid)

***

### dispose()

```ts
dispose(): void;
```

Stop following.

#### Returns

`void`

***

### onChange()

```ts
onChange(listener): Unsubscribe;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | () => `void` |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implementation of

[`List`](../interfaces/List.md).[`onChange`](../interfaces/List.md#onchange)

***

### refresh()

```ts
refresh(): Promise<void>;
```

Query again now.

#### Returns

`Promise`\<`void`\>
