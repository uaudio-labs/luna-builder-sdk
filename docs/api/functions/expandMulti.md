# Function: expandMulti()

```ts
function expandMulti(message): WireMessage[];
```

Expand a message into the individual updates it carries. A non-multi message expands to
itself. Entries that cannot be decoded are dropped.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | [`WireMessage`](../interfaces/WireMessage.md) |

## Returns

[`WireMessage`](../interfaces/WireMessage.md)[]

## Example

```ts
expandMulti({ path: 'multi', data: [{ path: '/a/x/value', data: 1 }, { path: '/a/y/value', data: 2 }] })
// [{ path: '/a/x/value', data: 1 }, { path: '/a/y/value', data: 2 }]
```
