# Class: Timeline

Pure tick arithmetic over the current tempo map and time signatures. Every method reads the
maps as they are now; [onChange](#onchange) says when an answer may have moved.

## Accessors

### tempoLoaded

#### Get Signature

```ts
get tempoLoaded(): boolean;
```

Whether the tempo map has at least one event whose tick and BPM have loaded, so
[tempoAt](#tempoat), [seconds](#seconds) and [tickAtSeconds](#tickatseconds) can answer. Until then they throw
`unavailable` rather than assume a tempo. [onChange](#onchange) fires when it becomes true.

##### Example

```ts
const bpm = timeline.tempoLoaded ? timeline.tempoAt(tick) : undefined;
```

##### Returns

`boolean`

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

Called when a tempo event or time signature is added, removed or edited (a tempo edit
rewrites an existing event's `tempo`, so `tempoMap.onChange` alone does not see it), and
when the maps finish loading, so anything computed from this timeline (bar|beat, seconds,
clip lengths planned from the tempo) should be recomputed. `marker.barBeat` and
`marker.seconds` already follow it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | () => `void` |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Example

```ts
session.musical.timeline.onChange(() => redrawRuler());
session.musical.timeline.onChange(() => (bpm.textContent = `${session.musical.tempoAt(session.transport.tick)} BPM`));
```

***

### seconds()

```ts
seconds(tick): number;
```

Ticks to seconds, integrating the tempo map (constant tempo between events). Throws
`unavailable` while the tempo map is not loaded ([tempoLoaded](#tempoloaded)).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |

#### Returns

`number`

#### Example

```ts
timeline.seconds(Luna.TICKS_PER_BEAT * 8);   // 4 at 120 BPM, 5.333… at 90
```

***

### tempoAt()

```ts
tempoAt(tick): number;
```

BPM in effect at `tick`: the last tempo event at or before it, or the first event's when
`tick` is before them all. Throws `unavailable` while the tempo map is not loaded
([tempoLoaded](#tempoloaded)); it never assumes 120.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |

#### Returns

`number`

#### Example

```ts
await session.musical.ready();
session.musical.timeline.tempoAt(session.transport.tick);   // 90
```

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
depends on the tempo where it sits. Throws `unavailable` while the tempo map is not
loaded ([tempoLoaded](#tempoloaded)).

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
