# Class: WasmEngine

A booted engine. Created by [bootWasmEngine](../functions/bootWasmEngine.md); the [WasmPort](WasmPort.md) talks through it.
One engine per page: shutdown is terminal, reload the page to boot again.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="engineurl"></a> `engineUrl` | `readonly` | `string` |
| <a id="module"></a> `module` | `readonly` | [`WasmModule`](../interfaces/WasmModule.md) |

## Accessors

### isRunning

#### Get Signature

```ts
get isRunning(): boolean;
```

##### Returns

`boolean`

***

### state

#### Get Signature

```ts
get state(): WasmState;
```

##### Returns

[`WasmState`](../type-aliases/WasmState.md)

## Methods

### audio()

```ts
audio(): AudioHealth;
```

#### Returns

[`AudioHealth`](../interfaces/AudioHealth.md)

***

### onState()

```ts
onState(listener): () => void;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | (`state`, `detail`) => `void` |

#### Returns

```ts
(): void;
```

##### Returns

`void`

***

### persistStatus()

```ts
persistStatus(): 
  | {
[k: string]: unknown;
  mode: string;
}
  | undefined;
```

OPFS persistence status, when the module was built with it.

#### Returns

  \| \{
\[`k`: `string`\]: `unknown`;
  `mode`: `string`;
\}
  \| `undefined`

***

### requestAudioInput()

```ts
requestAudioInput(): boolean;
```

Ask for microphone input (getUserMedia). Needs a secure context and a user gesture.

#### Returns

`boolean`

***

### resumeAudio()

```ts
resumeAudio(): Promise<boolean>;
```

Resume the AudioContext. Browsers only allow this after a user gesture, so call it from a
click handler. Resolves true if the context is running afterwards.

#### Returns

`Promise`\<`boolean`\>

***

### shutdown()

```ts
shutdown(): void;
```

Stop the engine. Terminal: reload the page to boot again.

#### Returns

`void`
