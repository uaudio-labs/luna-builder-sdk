# Function: parseRollDuration()

```ts
function parseRollDuration(value): RollDuration | undefined;
```

Read a roll string, `"bars,beats,ticks"`, as LUNA stores `pre_roll` and `post_roll`
(fact 156). `undefined` for anything else, which is what a session that never set its
roll holds; LUNA then uses no roll.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` \| `null` \| `undefined` |

## Returns

[`RollDuration`](../interfaces/RollDuration.md) \| `undefined`

## Example

```ts
Luna.parseRollDuration('1,2,0');   // { bars: 1, beats: 2, ticks: 0 }
```
