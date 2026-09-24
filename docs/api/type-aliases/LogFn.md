# Type Alias: LogFn()

```ts
type LogFn = (level, message, detail?) => void;
```

Where a port reports what it does: status changes, reconnect attempts, timeouts, and
listeners that threw. The default sends `warn` and `error` to the console.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `level` | [`LogLevel`](LogLevel.md) |
| `message` | `string` |
| `detail?` | `Record`\<`string`, `unknown`\> |

## Returns

`void`

## Example

```ts
const luna = await Luna.connect({ log: (level, message, detail) => console.log(`[${level}] ${message}`, detail ?? '') });
```
