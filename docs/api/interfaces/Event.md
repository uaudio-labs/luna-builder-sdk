# Interface: Event

One change pushed by the engine, normalised: a trailing `/value` is stripped, multi-updates
are already expanded, and `operation` marks a child added or removed at `path`.

## Example

```ts
luna.raw.subscribe('/sessions/abc/tracks/t1', (e) => {
  // e.path === '/sessions/abc/tracks/t1/name', e.data === 'Vocal'
});
```

## Properties

| Property | Type |
| ------ | ------ |
| <a id="data"></a> `data` | `unknown` |
| <a id="operation"></a> `operation?` | [`Operation`](../type-aliases/Operation.md) |
| <a id="path"></a> `path` | `string` |
