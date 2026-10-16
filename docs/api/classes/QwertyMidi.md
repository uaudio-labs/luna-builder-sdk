# Class: QwertyMidi

## Constructors

### Constructor

```ts
new QwertyMidi(sendMidi): QwertyMidi;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sendMidi` | [`SendMidi`](SendMidi.md) |

#### Returns

`QwertyMidi`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="octave"></a> `octave` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | The octave the note keys play, 0-9. A is C in this octave. `set` clamps. |
| <a id="velocity"></a> `velocity` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | The note-on velocity, 1-127. `set` clamps. |

## Methods

### destroy()

```ts
destroy(): void;
```

Release every held note and forget them.

#### Returns

`void`

***

### handleKeyDown()

```ts
handleKeyDown(
   e, 
   sessionUid, 
   trackUid): boolean;
```

Handle a keydown. Returns true, having called `preventDefault()`, when the key was a note
or a control key; a repeat of a held note key is claimed but not replayed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `e` | [`QwertyKeyEvent`](../type-aliases/QwertyKeyEvent.md) |
| `sessionUid` | `string` |
| `trackUid` | `string` |

#### Returns

`boolean`

#### Example

```ts
document.addEventListener('keydown', (e) => qwerty.handleKeyDown(e, session.uid, track.id));
```

***

### handleKeyUp()

```ts
handleKeyUp(e): boolean;
```

Handle a keyup. Returns true, having called `preventDefault()`, when it released a held
note. The note-off goes to the track and pitch the note-on went to, even if the octave
changed while it was held.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `e` | `Pick`\<`KeyboardEvent`, `"key"` \| `"preventDefault"`\> |

#### Returns

`boolean`

#### Example

```ts
document.addEventListener('keyup', (e) => qwerty.handleKeyUp(e));
```

***

### releaseAll()

```ts
releaseAll(): void;
```

Send a note-off for every held note. Call it when the page loses focus, which swallows
the keyups.

#### Returns

`void`

#### Example

```ts
window.addEventListener('blur', () => qwerty.releaseAll());
```

***

### resetConnection()

```ts
resetConnection(): void;
```

Forget held notes without sending note-offs, after the connection was replaced.

#### Returns

`void`
