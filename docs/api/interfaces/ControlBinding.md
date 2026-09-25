# Interface: ControlBinding

What [bindRange](../functions/bindRange.md) and [bindDrag](../functions/bindDrag.md) return.

## Extends

- [`Gesture`](Gesture.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="active"></a> `active` | `readonly` | `boolean` | True between pointer down and release. Gate `pointermove` writes on it. | [`Gesture`](Gesture.md).[`active`](Gesture.md#active) |

## Methods

### dispose()

```ts
dispose(): void;
```

End any drag and remove every listener.

#### Returns

`void`

#### Inherited from

[`Gesture`](Gesture.md).[`dispose`](Gesture.md#dispose)

***

### end()

```ts
end(): void;
```

End the current drag now, if any (for example when the element is re-bound).

#### Returns

`void`

#### Inherited from

[`Gesture`](Gesture.md).[`end`](Gesture.md#end)

***

### sync()

```ts
sync(): void;
```

Repaint the element from the control's current value now, even mid-drag.

#### Returns

`void`
