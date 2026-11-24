# Function: sourceFilePath()

```ts
function sourceFilePath(
   packagePath, 
   uid, 
   isRender): string;
```

The path of a source file inside its session package (fact 239).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `packagePath` | `string` |
| `uid` | `string` |
| `isRender` | `boolean` |

## Returns

`string`

## Example

```ts
Luna.sourceFilePath('/Music/Song/Song.luna', uid, false) // '/Music/Song/Song.luna/audio/<uid>.wav'
```
