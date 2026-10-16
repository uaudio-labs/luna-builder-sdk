# Class: Secrets

Per-Add-On secrets, at `luna.secrets`. Values are strings; names are 1 to 128 characters
from `A-Z a-z 0-9 . _ -`.

Errors are [UAError](Error.md)s with a `code`: `invalid_name`, `too_large`, `store_error` (the
OS store refused, for example the user denied keychain access), and `timeout` when LUNA did
not answer, which is also what a request from outside the Add On's own page gets.

## Example

```ts
let key = await luna.secrets.get('openai.api_key');
if (!key) {
  key = prompt('OpenAI API key') ?? '';
  if (key) await luna.secrets.set('openai.api_key', key);
}
```

## Constructors

### Constructor

```ts
new Secrets(): Secrets;
```

#### Returns

`Secrets`

## Accessors

### storage

#### Get Signature

```ts
get storage(): SecretStorage;
```

`'keychain'` inside a LUNA that stores secrets; `'memory'` elsewhere, where values last
only until the page reloads. Tell the user when it is `'memory'`.

##### Example

```ts
if (luna.secrets.storage === 'memory') banner.textContent = 'Keys are kept until you close this page.';
```

##### Returns

[`SecretStorage`](../type-aliases/SecretStorage.md)

## Methods

### delete()

```ts
delete(name): Promise<void>;
```

Remove `name`. Removing a name that is not stored succeeds.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.secrets.delete('openai.api_key');
```

***

### get()

```ts
get(name): Promise<string | null>;
```

The value stored under `name`, or `null` if there is none.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`Promise`\<`string` \| `null`\>

#### Example

```ts
const key = await luna.secrets.get('openai.api_key');
```

***

### set()

```ts
set(name, value): Promise<void>;
```

Store `value` under `name`, replacing any value already there.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `value` | `string` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.secrets.set('openai.api_key', input.value);
```
