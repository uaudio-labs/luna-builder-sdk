# Class: MidiInput

Live MIDI input from the MIDI devices LUNA sees (fact 125). Use this for MIDI input in an Add
On, not Web MIDI (`navigator.requestMIDIAccess()`): LUNA's macOS web view has no Web MIDI,
and this works the same inside LUNA and in a browser.

## Example

```ts
await luna.midiDevices.load();
const input = new Luna.MidiInput(luna);
const stop = input.onNote('all', (note, velocity, on) => console.log(note, velocity, on));
```

## Constructors

### Constructor

```ts
new MidiInput(): MidiInput;
```

#### Returns

`MidiInput`

## Methods

### listen()

```ts
listen(
   target, 
   handler, 
   options): Unsubscribe;
```

Call `handler` with every message `target` sends LUNA, in arrival order, until the returned
function is called. `target` is a [MidiDevice](MidiDevice.md) from `luna.midiDevices` (load it
first), one of its input ports, or `'all'` for every device. Throws `not_found` for a
device with no MIDI in, or for `'all'` before `luna.midiDevices` has loaded.

MIDI device uids change when LUNA restarts (fact 123), so an Add On that remembers a device
should remember its name and look it up again.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`MidiInputTarget`](../type-aliases/MidiInputTarget.md) |
| `handler` | (`message`) => `void` |
| `options` | [`MidiInputListenOptions`](../interfaces/MidiInputListenOptions.md) |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Example

```ts
await luna.midiDevices.load();
const input = new Luna.MidiInput(luna);
const stop = input.listen('all', (m) => console.log(m.type, m.channel, m.data1, m.data2));
```

***

### onControlChange()

```ts
onControlChange(
   target, 
   handler, 
   options?): Unsubscribe;
```

Controller changes from `target`, as `(controller, value, message)`. Same targets and
rules as [listen](#listen).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`MidiInputTarget`](../type-aliases/MidiInputTarget.md) |
| `handler` | (`controller`, `value`, `message`) => `void` |
| `options?` | [`MidiInputListenOptions`](../interfaces/MidiInputListenOptions.md) |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Example

```ts
const stop = input.onControlChange(keys, (cc, value) => {
  if (cc === 1) modWheel.value = String(value);
});
```

***

### onNote()

```ts
onNote(
   target, 
   handler, 
   options?): Unsubscribe;
```

Note-ons and note-offs from `target`, as `(note, velocity, noteOn, message)`. A note-on
with velocity 0 arrives as a note-off. Same targets and rules as [listen](#listen).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`MidiInputTarget`](../type-aliases/MidiInputTarget.md) |
| `handler` | (`note`, `velocity`, `noteOn`, `message`) => `void` |
| `options?` | [`MidiInputListenOptions`](../interfaces/MidiInputListenOptions.md) |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Example

```ts
const stop = input.onNote(keys, (note, velocity, on) => {
  if (on) lights.light(note, velocity); else lights.clear(note);
});
```
