# Class: SourceUsage

An observable ordered collection with id lookup.

## Implements

- [`List`](../interfaces/List.md)\<[`SourceUsageEntry`](../interfaces/SourceUsageEntry.md)\>

## Accessors

### items

#### Get Signature

```ts
get items(): readonly SourceUsageEntry[];
```

Files in use, each with its uses. A file no clip uses is not listed.

##### Returns

readonly [`SourceUsageEntry`](../interfaces/SourceUsageEntry.md)[]

#### Implementation of

[`List`](../interfaces/List.md).[`items`](../interfaces/List.md#items)

***

### value

#### Get Signature

```ts
get value(): readonly SourceUsageEntry[];
```

##### Returns

readonly [`SourceUsageEntry`](../interfaces/SourceUsageEntry.md)[]

#### Implementation of

[`List`](../interfaces/List.md).[`value`](../interfaces/List.md#value)

## Methods

### byId()

```ts
byId(sourceUid): SourceUsageEntry | undefined;
```

The uses of one file, or `undefined` when no clip uses it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourceUid` | `string` |

#### Returns

[`SourceUsageEntry`](../interfaces/SourceUsageEntry.md) \| `undefined`

#### Implementation of

[`List`](../interfaces/List.md).[`byId`](../interfaces/List.md#byid)

***

### dispose()

```ts
dispose(): void;
```

Stop following the session.

#### Returns

`void`

***

### isUsed()

```ts
isUsed(sourceUid): boolean;
```

True when some clip, on any playlist, uses the file.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourceUid` | `string` |

#### Returns

`boolean`

***

### onChange()

```ts
onChange(listener): Unsubscribe;
```

Called whenever the usage changes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | () => `void` |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implementation of

[`List`](../interfaces/List.md).[`onChange`](../interfaces/List.md#onchange)
