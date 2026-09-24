# Class: Timeline

Pure tick arithmetic over the current tempo map and time signatures.

## Constructors

### Constructor

```ts
new Timeline(tempos, signatures): Timeline;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tempos` | () => readonly [`TempoEvent`](TempoEvent.md)[] |
| `signatures` | () => readonly [`TimeSignature`](TimeSignature.md)[] |

#### Returns

`Timeline`

## Methods

### barBeat()

```ts
barBeat(tick): BarBeat;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |

#### Returns

[`BarBeat`](../interfaces/BarBeat.md)

***

### seconds()

```ts
seconds(tick): number;
```

Ticks to seconds, integrating the tempo map (constant tempo between events).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |

#### Returns

`number`

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

### tickAt()

```ts
tickAt(at): number;
```

The inverse of [barBeat](#barbeat): the tick a bar|beat|tick position lands on. `beat`
defaults to 1 and `tick` to 0, so `tickAt({ bar: 9 })` is the downbeat of bar 9 and
matches [tickAtBar](#tickatbar).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `at` | \{ `bar`: `number`; `beat?`: `number`; `tick?`: `number`; \} |
| `at.bar` | `number` |
| `at.beat?` | `number` |
| `at.tick?` | `number` |

#### Returns

`number`

#### Example

```ts
const tick = timeline.tickAt({ bar: 5, beat: 3, tick: 0 });
timeline.barBeat(tick);   // { bar: 5, beat: 3, tick: 0 }
```

***

### tickAtBar()

```ts
tickAtBar(bar): number;
```

Tick at the start of `bar` (1-based).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `bar` | `number` |

#### Returns

`number`

***

### tickAtSeconds()

```ts
tickAtSeconds(seconds): number;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `seconds` | `number` |

#### Returns

`number`
