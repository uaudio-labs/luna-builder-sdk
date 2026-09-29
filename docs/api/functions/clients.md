# Function: clients()

```ts
function clients(): readonly Client[];
```

Every [Client](../classes/Client.md) this page has made and not closed, in creation order. A tooling hook:
`ua-builder probe` waits on `Luna.clients().some((c) => c.connected)` to know an Add On's
page has finished connecting before it reads the DOM.

## Returns

readonly [`Client`](../classes/Client.md)[]

## Example

```ts
Luna.clients().some((c) => c.connected); // is anything on this page live?
```
