# Function: normalizePackageUid()

```ts
function normalizePackageUid(uid): string;
```

A package uid in the form LUNA keeps it: dashes stripped (as `open_session` does), lower case.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` \| `null` \| `undefined` |

## Returns

`string`

## Example

```ts
Luna.normalizePackageUid('7D3C0F9E-2B8A-…') // '7d3c0f9e2b8a…'
```
