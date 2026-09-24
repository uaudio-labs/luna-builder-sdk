# Class: FloatLiteral

A number that must reach the engine as a JSON float literal. Some fields are parsed by
token type: a breakpoint `value` written as `-6` is stored as 0, while `-6.0` is stored as
-6 (fact 79). `JSON.stringify` writes every whole number without a fraction, so wrap the
value and the codec writes `-6.0`.

## Example

```ts
await luna.raw.post(`${session.path}/insert_bp`, { session_uid, control_uid, values: [{ location: 0, value: Luna.float(-6) }] });
```

## Constructors

### Constructor

```ts
new FloatLiteral(value): FloatLiteral;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

#### Returns

`FloatLiteral`

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="value"></a> `value` | `readonly` | `number` |

## Methods

### toJSON()

```ts
toJSON(): number;
```

#### Returns

`number`

***

### toLiteral()

```ts
toLiteral(): string;
```

The literal as it goes on the wire: always with a fraction or an exponent.

#### Returns

`string`
