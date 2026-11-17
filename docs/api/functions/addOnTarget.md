# Function: addOnTarget()

```ts
function addOnTarget(): AddOnTarget | undefined;
```

The host LUNA loaded this Add On page in, from the `?target=` it puts on the page URL (fact 144):
`'window'`, `'browser'`, `'editor'` or `'app'`. `undefined` outside LUNA and on a LUNA older
than the parameter. Synchronous, so a page that lists several manifest `targets` can lay
itself out for its host before it connects. LUNA reloads the page when the user moves it to
another host, so it never changes while the page runs.

## Returns

[`AddOnTarget`](../type-aliases/AddOnTarget.md) \| `undefined`

## Example

```ts
document.body.classList.add(`host-${Luna.addOnTarget() ?? 'window'}`);
```
