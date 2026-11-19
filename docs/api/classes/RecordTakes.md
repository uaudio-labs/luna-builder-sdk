# Class: RecordTakes

The takes being recorded in a session, across every track: [Session.recordTakes](Session.md#recordtakes).
Empty while nothing records. `onChange` fires when a take starts or ends; follow a take's own
props (`stop`, `notes`) for its progress.

## Example

```ts
await session.ready();
session.recordTakes.onChange(() => {
  for (const take of session.recordTakes.items) console.log(take.trackUid.value, take.stop.value);
});
```

## Implements

- [`List`](../interfaces/List.md)\<[`RecordTake`](RecordTake.md)\>

## Accessors

### items

#### Get Signature

```ts
get items(): readonly RecordTake[];
```

Every take recording now, track by track.

##### Returns

readonly [`RecordTake`](RecordTake.md)[]

#### Implementation of

[`List`](../interfaces/List.md).[`items`](../interfaces/List.md#items)

***

### value

#### Get Signature

```ts
get value(): readonly RecordTake[];
```

##### Returns

readonly [`RecordTake`](RecordTake.md)[]

#### Implementation of

[`List`](../interfaces/List.md).[`value`](../interfaces/List.md#value)

## Methods

### byId()

```ts
byId(id): RecordTake | undefined;
```

The take with this uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

[`RecordTake`](RecordTake.md) \| `undefined`

#### Implementation of

[`List`](../interfaces/List.md).[`byId`](../interfaces/List.md#byid)

***

### forTrack()

```ts
forTrack(track): RecordTake[];
```

The takes recording on one track (normally one), by the track or its uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `track` | \| `string` \| \{ `id`: `string`; \} |

#### Returns

[`RecordTake`](RecordTake.md)[]

#### Example

```ts
const [take] = session.recordTakes.forTrack(track);
```

***

### load()

```ts
load(): Promise<void>;
```

Read the takes recording now. [Session.ready](Session.md#ready) does it; later takes follow pushes.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await session.recordTakes.load();
```

***

### onChange()

```ts
onChange(listener): Unsubscribe;
```

Called when a take starts or ends.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | () => `void` |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implementation of

[`List`](../interfaces/List.md).[`onChange`](../interfaces/List.md#onchange)
