# Class: Musical

The musical structure of one session.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="keysignatures"></a> `keySignatures` | `readonly` | [`Collection`](Collection.md)\<[`KeySignature`](KeySignature.md)\> |
| <a id="tempomap"></a> `tempoMap` | `readonly` | [`Collection`](Collection.md)\<[`TempoEvent`](TempoEvent.md)\> |
| <a id="timeline"></a> `timeline` | `readonly` | [`Timeline`](Timeline.md) |
| <a id="timesignatures"></a> `timeSignatures` | `readonly` | [`Collection`](Collection.md)\<[`TimeSignature`](TimeSignature.md)\> |

## Methods

### deleteTempo()

```ts
deleteTempo(tick): Promise<unknown>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |

#### Returns

`Promise`\<`unknown`\>

***

### ready()

```ts
ready(): Promise<void>;
```

Load the three maps. Idempotent.

#### Returns

`Promise`\<`void`\>

***

### setBarOne()

```ts
setBarOne(tick): Promise<unknown>;
```

Move bar one to `tick`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |

#### Returns

`Promise`\<`unknown`\>

***

### setKeySignature()

```ts
setKeySignature(
   sharpsAndFlats, 
   isMinor, 
tick): Promise<unknown>;
```

`sharpsAndFlats`: 1..7 sharps, -1..-7 flats, 0 for C / A minor.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `sharpsAndFlats` | `number` | `undefined` |
| `isMinor` | `boolean` | `undefined` |
| `tick` | `number` | `0` |

#### Returns

`Promise`\<`unknown`\>

***

### setTempo()

```ts
setTempo(bpm, tick): Promise<unknown>;
```

Set the tempo at a tick (default: the session start).

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `bpm` | `number` | `undefined` |
| `tick` | `number` | `0` |

#### Returns

`Promise`\<`unknown`\>

***

### setTimeSignature()

```ts
setTimeSignature(
   numerator, 
   denominator, 
bar): Promise<unknown>;
```

Set the time signature from `bar` (1-based).

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `numerator` | `number` | `undefined` |
| `denominator` | `number` | `undefined` |
| `bar` | `number` | `1` |

#### Returns

`Promise`\<`unknown`\>

***

### tempoAt()

```ts
tempoAt(tick): number;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |

#### Returns

`number`
