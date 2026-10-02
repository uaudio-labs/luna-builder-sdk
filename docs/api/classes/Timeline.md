# Class: Timeline

Pure tick arithmetic over the current tempo map and time signatures. Every method reads the
maps as they are now; [onChange](#onchange) says when an answer may have moved.

## Methods

### barBeat()

```ts
barBeat(tick): BarBeat;
```

Bar, beat (1-based) and the engine ticks left over within the beat at `tick`, honouring
time signature changes. Same units as `location.bar_beat`, so it passes straight to
[formatBarBeat](../functions/formatBarBeat.md) (or `Luna.formatBarBeat`) with no conversion.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |

#### Returns

[`BarBeat`](../interfaces/BarBeat.md)

#### Example

```ts
timeline.barBeat(Luna.TICKS_PER_BEAT * 5 + Luna.TICKS_PER_DISPLAY_TICK * 120);   // { bar: 2, beat: 2, tick: 12_000_000_000 }
```

***

### formatBarBeat()

```ts
formatBarBeat(tick): string;
```

`tick` as LUNA's bar|beat counter shows it, `1|1|000` with display ticks (960 per beat):
`Luna.formatBarBeat(timeline.barBeat(tick))` in one call.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` \| `undefined` |

#### Returns

`string`

#### Example

```ts
timeline.formatBarBeat(marker.location.value!);   // "5|3|240"
```

***

### onChange()

```ts
onChange(listener): Unsubscribe;
```

Called when a tempo event or time signature is added, removed or edited, so anything
computed from this timeline (bar|beat, seconds) should be recomputed. `marker.barBeat`
and `marker.seconds` already follow it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | () => `void` |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Example

```ts
session.musical.timeline.onChange(() => redrawRuler());
```

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

The inverse of [seconds](#tickatseconds-1): the tick a wall-clock offset lands on, walking the same
tempo map. Use it to place a clip that must play unstretched — its span in ticks
depends on the tempo where it sits.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `seconds` | `number` |

#### Returns

`number`

#### Example

```ts
const start = 4 * Luna.TICKS_PER_BEAT;
const stop = timeline.tickAtSeconds(timeline.seconds(start) + source.length.value / 1e9);
```
