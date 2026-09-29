# Function: formatMinSec()

```ts
function formatMinSec(seconds, options): string;
```

Format seconds as a zero-padded `MM:SS` clock, flooring rather than rounding so a
counting display never shows a time the playhead has not reached. Negative values clamp
to `00:00`; `undefined` (an unloaded prop) gives a placeholder, like [formatBarBeat](formatBarBeat.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `seconds` | `number` \| `undefined` |
| `options` | \{ `fraction?`: `number`; \} |
| `options.fraction?` | `number` |

## Returns

`string`

## Example

```ts
Luna.formatMinSec(90.56);                    // "01:30"
Luna.formatMinSec(90.56, { fraction: 2 });   // "01:30.56"
Luna.formatMinSec(t.seconds, { fraction: 1 });
```
