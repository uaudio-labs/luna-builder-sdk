# Function: parseTrackType()

```ts
function parseTrackType(value): TrackType | undefined;
```

A `track_type` value as a [TrackType](../type-aliases/TrackType.md), or `undefined` when LUNA would not publish it.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

[`TrackType`](../type-aliases/TrackType.md) \| `undefined`

## Example

```ts
Luna.parseTrackType('instrument');   // 'instrument'
Luna.parseTrackType('Audio');        // undefined
```
