# Interface: ProgressSuppression

One held suppression. [release](#release) is idempotent and never rejects for a handle LUNA
already dropped.

## Example

```ts
const hold = await luna.gui.suppressProgress({ maxMs: 30_000 });
hold.released;          // false
await hold.release();
```

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="released"></a> `released` | `readonly` | `boolean` | True once released, by [release](#release), the watchdog or the page going away. |
| <a id="uid"></a> `uid` | `readonly` | `string` | The handle sent to LUNA (`suppression_uid`). |

## Methods

### release()

```ts
release(): Promise<void>;
```

#### Returns

`Promise`\<`void`\>
