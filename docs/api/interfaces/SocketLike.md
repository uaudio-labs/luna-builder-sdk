# Interface: SocketLike

The subset of the WebSocket API this port uses; lets tests inject a fake.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="onclose"></a> `onclose` | `public` | (`ev`) => `void` \| `null` |
| <a id="onerror"></a> `onerror` | `public` | (`ev`) => `void` \| `null` |
| <a id="onmessage"></a> `onmessage` | `public` | (`ev`) => `void` \| `null` |
| <a id="onopen"></a> `onopen` | `public` | (`ev`) => `void` \| `null` |
| <a id="readystate"></a> `readyState` | `readonly` | `number` |

## Methods

### close()

```ts
close(code?, reason?): void;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `code?` | `number` |
| `reason?` | `string` |

#### Returns

`void`

***

### send()

```ts
send(data): void;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `string` |

#### Returns

`void`
