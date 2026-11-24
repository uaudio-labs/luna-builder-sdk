# Function: sourceDisplayName()

```ts
function sourceDisplayName(name, uid): string | undefined;
```

`name` unless it is blank or the file's own uid (fact 238), else `undefined`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` \| `null` \| `undefined` |
| `uid` | `string` |

## Returns

`string` \| `undefined`

## Example

```ts
Luna.sourceDisplayName('Vocal.wav', 'f87c…') // 'Vocal.wav'
```
