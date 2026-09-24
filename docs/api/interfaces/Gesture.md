# Interface: Gesture

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="active"></a> `active` | `readonly` | `boolean` | True between pointer down and release. Gate `pointermove` writes on it. |

## Methods

### dispose()

```ts
dispose(): void;
```

End any drag and remove every listener.

#### Returns

`void`

***

### end()

```ts
end(): void;
```

End the current drag now, if any (for example when the element is re-bound).

#### Returns

`void`
