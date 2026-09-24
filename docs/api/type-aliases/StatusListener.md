# Type Alias: StatusListener()

```ts
type StatusListener = (status, detail?) => void;
```

The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/ua-builder-sdk'`
or, from a script tag, `globalThis.Luna`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `status` | [`PortStatus`](PortStatus.md) |
| `detail?` | `string` |

## Returns

`void`
