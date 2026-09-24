# Function: encodeRequest()

```ts
function encodeRequest(
   verb, 
   path, 
   params?, 
   data?): string;
```

Build one request line.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `verb` | [`Verb`](../type-aliases/Verb.md) |
| `path` | `string` |
| `params?` | `Record`\<`string`, `string`\> |
| `data?` | `unknown` |

## Returns

`string`

## Example

```ts
encodeRequest('get', '/sessions', { flatvalue: '1', ua_id: 'r1' })
// 'get /sessions?flatvalue=1&ua_id=r1'
encodeRequest('post', '/sessions/abc/new_track', undefined, { name: 'Vocal' })
// 'post /sessions/abc/new_track {"name":"Vocal"}'
```
