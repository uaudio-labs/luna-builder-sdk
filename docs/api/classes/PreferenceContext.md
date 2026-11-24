# Class: PreferenceContext

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="name"></a> `name` | `readonly` | `string` | The `/preferences` context the values live in. |

## Methods

### get()

```ts
get<T>(key): Promise<T | undefined>;
```

The value stored under `key`, or `undefined` when there is none. LUNA reads a context
from disk only when a preference in it is initialised (fact 232), so this initialises
`key` first; an existing value is kept.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

`Promise`\<`T` \| `undefined`\>

#### Example

```ts
const last = await prefs.get<string>('lastPreset');
```

***

### set()

```ts
set(key, value): Promise<void>;
```

Store `value` (any JSON) under `key`. LUNA writes it to disk at once (fact 232). Store
`null` to clear it; LUNA has no way to remove a preference.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `value` | `unknown` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await prefs.set('lastPreset', preset.uid);
```
