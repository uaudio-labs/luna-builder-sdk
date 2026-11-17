# Function: pluginVersionMeets()

```ts
function pluginVersionMeets(installed, minVersion): boolean;
```

Whether plugin version `installed` meets `minVersion`, as LUNA compares them (fact 148):
every dot-separated part as a number, missing parts as 0, so `'0.4.10'` meets `'0.4.3'` and
`'0.4.3.1'` meets `'0.4.3'`. An empty `minVersion` is met by anything; an empty or malformed
`installed` meets only that.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `installed` | `string` \| `undefined` |
| `minVersion` | `string` |

## Returns

`boolean`

## Example

```ts
Luna.pluginVersionMeets('0.4.10', '0.4.3'); // true
Luna.pluginVersionMeets('0.4.2', '0.4.3');  // false
```
