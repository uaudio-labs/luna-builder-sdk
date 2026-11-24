# Function: parseSessionType()

```ts
function parseSessionType(value): 
  | "default"
  | "multi"
  | "history"
  | "template"
  | "track_preset"
  | "device_mixer"
  | "volt"
  | "standalone"
  | undefined;
```

A `session_type` value as a [SessionType](../type-aliases/SessionType.md): the string, or its index in
[SESSION\_TYPES](../variables/SESSION_TYPES.md) as a workspace query row carries it. Anything else is `undefined`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

  \| `"default"`
  \| `"multi"`
  \| `"history"`
  \| `"template"`
  \| `"track_preset"`
  \| `"device_mixer"`
  \| `"volt"`
  \| `"standalone"`
  \| `undefined`

## Example

```ts
Luna.parseSessionType(3);              // 'template'
Luna.parseSessionType('track_preset'); // 'track_preset'
Luna.parseSessionType(8);              // undefined
```
