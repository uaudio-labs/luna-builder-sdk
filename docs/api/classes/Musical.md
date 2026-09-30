# Class: Musical

The musical structure of one session.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="chords"></a> `chords` | `readonly` | [`Chords`](Chords.md) | LUNA's Chord ruler. |
| <a id="keysignatures"></a> `keySignatures` | `readonly` | [`Collection`](Collection.md)\<[`KeySignature`](KeySignature.md)\> | - |
| <a id="tempomap"></a> `tempoMap` | `readonly` | [`Collection`](Collection.md)\<[`TempoEvent`](TempoEvent.md)\> | - |
| <a id="timeline"></a> `timeline` | `readonly` | [`Timeline`](Timeline.md) | - |
| <a id="timesignatures"></a> `timeSignatures` | `readonly` | [`Collection`](Collection.md)\<[`TimeSignature`](TimeSignature.md)\> | - |

## Methods

### addChord()

```ts
addChord(tick, name): Promise<Chord>;
```

Add a chord to the Chord ruler at `tick` and resolve to it once it is in [chords](#chords).
A chord already at `tick` is replaced, as in LUNA (fact 100). One undo entry.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |
| `name` | `string` |

#### Returns

`Promise`\<[`Chord`](Chord.md)\>

#### Example

```ts
const chord = await session.musical.addChord(Luna.WHOLE_NOTE * 4, 'Am7');
```

***

### clearChords()

```ts
clearChords(): Promise<void>;
```

Delete every chord on the ruler as one undo entry ("Clear Chords").

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await session.musical.clearChords();
```

***

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

Load the three maps and the Chord ruler. Idempotent.

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

### setChords()

```ts
setChords(chords, options): Promise<void>;
```

Write a chord progression as one undo entry. Each chord replaces any chord at its tick.
With `replaceRange: [start, stop]`, every other chord from `start` up to (not including)
`stop` is deleted first, so the span holds exactly the progression. Chords already on the
ruler as asked are not rewritten, and a call that changes nothing makes no undo entry.
Resolves once [chords](#setchords-1) shows the result.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `chords` | readonly [`ChordSpec`](../interfaces/ChordSpec.md)[] |
| `options` | \{ `replaceRange?`: \[`number`, `number`\]; `undoName?`: `string`; \} |
| `options.replaceRange?` | \[`number`, `number`\] |
| `options.undoName?` | `string` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
const bar = Luna.WHOLE_NOTE;
await session.musical.setChords(
  ['C', 'Am', 'F', 'G'].map((name, i) => ({ tick: i * bar, name })),
  { replaceRange: [0, 4 * bar] },
);
```

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

Add a tempo event at a tick with `set_tempo` (default: the session start). On the measured
build `set_tempo` answered `device.database_error`; to change the tempo in effect, use
[setTempoInEffectAt](#settempoineffectat).

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `bpm` | `number` | `undefined` |
| `tick` | `number` | `0` |

#### Returns

`Promise`\<`unknown`\>

***

### setTempoInEffectAt()

```ts
setTempoInEffectAt(bpm, tick): Promise<void>;
```

Change the tempo in effect at `tick` to `bpm`, as LUNA's own tempo field does: it writes
the `tempo` of that tempo event rather than adding one (fact 95). In a single-tempo session
that is the session tempo. Rejects with `out_of_range` for a non-positive or non-finite
BPM, and `not_found` when the map has no events yet.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `bpm` | `number` |
| `tick` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await session.musical.ready();
await session.musical.setTempoInEffectAt(96, session.transport.tick);
```

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

***

### tempoEventAt()

```ts
tempoEventAt(tick): TempoEvent | undefined;
```

The tempo event in effect at `tick`: the last one at or before it, or the first when the
tick is before them all. `undefined` only while the map is empty or unloaded.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |

#### Returns

[`TempoEvent`](TempoEvent.md) \| `undefined`

#### Example

```ts
const row = session.musical.tempoEventAt(session.transport.tick);
```
