# Function: suggestAddOnCategories()

```ts
function suggestAddOnCategories(text, max): AddOnCategory[];
```

Categories that suit an Add On, best first, guessed from what it says about itself (its
name, description, a prompt that asked for it). At most `max` (default 3); when nothing in
the text points anywhere, `['Utility']`. A guess to confirm with the author, never to write
into a manifest unasked.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `text` | `string` | `undefined` |
| `max` | `number` | `3` |

## Returns

[`AddOnCategory`](../type-aliases/AddOnCategory.md)[]

## Example

```ts
Luna.suggestAddOnCategories('Quantize and humanize MIDI notes'); // ['MIDI', ...]
```
