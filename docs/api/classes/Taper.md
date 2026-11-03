# Class: Taper

Fader tapers: how LUNA maps a fader's 0..1 position to dB (fact 134).

A gain-type control names its taper in its `taper` property; [Control.taper](Control.md#taper) resolves
it to one of these. Each taper is LUNA's own breakpoint table, interpolated linearly between
points as LUNA does, so `toNormalized` and `toDb` agree with the control's
`normalized_value` and `real_value`. `marks()` gives the dB values LUNA draws hash marks at.

## Example

```ts
const taper = track.gain.taper.value ?? Luna.Taper.named('+12')!;
for (const db of taper.marks()) {
  const y = height * (1 - taper.toNormalized(db));   // 0 at the top
  drawMark(y, db <= taper.minDb ? '∞' : String(Math.abs(db)));
}
```

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="maxdb"></a> `maxDb` | `readonly` | `number` | `undefined` | Highest dB on the taper: the top of the fader. |
| <a id="mindb"></a> `minDb` | `readonly` | `number` | `undefined` | Lowest dB on the taper; for the dB tapers −144, which LUNA shows as −∞. |
| <a id="name"></a> `name` | `readonly` | [`TaperName`](../type-aliases/TaperName.md) | `undefined` | - |
| <a id="points"></a> `points` | `readonly` | readonly readonly \[`number`, `number`\][] | `undefined` | LUNA's breakpoints as `[dB, normalized]`, highest dB first, as LUNA lists them. |
| <a id="default_name"></a> `DEFAULT_NAME` | `readonly` | [`TaperName`](../type-aliases/TaperName.md) | `'+12'` | The default taper: what LUNA uses for a gain control whose `taper` is empty or unknown. |
| <a id="names"></a> `NAMES` | `readonly` | readonly [`TaperName`](../type-aliases/TaperName.md)[] | `undefined` | Every taper name LUNA defines, `none` aside. |

## Methods

### marks()

```ts
marks(options): number[];
```

The dB values to draw fader hash marks at, top first. The last is [minDb](#mindb), which
LUNA labels ∞. Place each with [toNormalized](#tonormalized).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TaperMarksOptions`](../interfaces/TaperMarksOptions.md) |

#### Returns

`number`[]

#### Example

```ts
taper.marks();                    // [12, 6, 0, -6, -12, -20, -32, -56, -144] for +12
taper.marks({ compact: true });   // [12, 0, -12, -32, -144]
```

***

### toDb()

```ts
toDb(normalized): number;
```

The dB value at a 0..1 fader position, clamped to the taper's range.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `normalized` | `number` |

#### Returns

`number`

#### Example

```ts
Luna.Taper.named('+12')!.toDb(1);   // 12
```

***

### toNormalized()

```ts
toNormalized(db): number;
```

The 0..1 fader position for a dB value, clamped to the taper's range.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `db` | `number` |

#### Returns

`number`

#### Example

```ts
Luna.Taper.named('+12')!.toNormalized(-6);   // 0.6727
```

***

### forControl()

```ts
static forControl(controlType, taper): Taper | null | undefined;
```

The taper a control uses, from its `control_type` and `taper` properties: `null` for a
control LUNA gives no fader taper (pan, mute, a plugin parameter), `undefined` while the
control type has not arrived.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `controlType` | `string` \| `undefined` |
| `taper` | `string` \| `null` \| `undefined` |

#### Returns

`Taper` \| `null` \| `undefined`

#### Example

```ts
Luna.Taper.forControl('gain', null)?.name;   // '+12'
Luna.Taper.forControl('pan', null);          // null
```

***

### named()

```ts
static named(name): Taper | null;
```

The taper LUNA uses for a `taper` property value. Empty, `null` and unknown names give
`+12`, as in LUNA; `none` gives `null`. The same name always gives the same object.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` \| `null` \| `undefined` |

#### Returns

`Taper` \| `null`

#### Example

```ts
Luna.Taper.named('API')!.toNormalized(0);  // 0.59423
Luna.Taper.named('')!.name;                // '+12'
Luna.Taper.named('none');                  // null
```
