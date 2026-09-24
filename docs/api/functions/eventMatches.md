# Function: eventMatches()

```ts
function eventMatches(subPath, eventPath): boolean;
```

True when an event at `eventPath` belongs to a subscription on `subPath`.
Prefix matching: the engine only pushes what was subscribed, so a wider subscription on the
same connection is the only way a handler sees something deeper than it asked for.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `subPath` | `string` |
| `eventPath` | `string` |

## Returns

`boolean`
