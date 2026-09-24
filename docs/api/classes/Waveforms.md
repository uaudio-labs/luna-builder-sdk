# Class: Waveforms

A bounded cache of overview pages, keyed by source, analysis and page index. A short page
(the end of the analysis, or growth in progress) is never cached, so a recording still
being written is re-read until it settles.

The cache does not watch LUNA: call `invalidate(uid)` when a source is removed or its
`overviewInfo().md5` changes.

## Example

```ts
const cache = new Luna.Waveforms({ maxPages: 512 });
const range = await cache.range(audio.source, audio.startNs, audio.stopNs, 'coarse');
```

## Constructors

### Constructor

```ts
new Waveforms(options): Waveforms;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `maxPages?`: `number`; \} |
| `options.maxPages?` | `number` |

#### Returns

`Waveforms`

## Accessors

### size

#### Get Signature

```ts
get size(): number;
```

Pages held right now.

##### Returns

`number`

## Methods

### invalidate()

```ts
invalidate(uid?): void;
```

Drop one source's pages, or everything.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid?` | `string` |

#### Returns

`void`

***

### range()

```ts
range(
   source, 
   startNs, 
   stopNs, 
kind): Promise<WaveformRange>;
```

The pairs covering `[startNs, stopNs)` of `source`, assembled from cached and fresh pages.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `source` | [`AudioSource`](AudioSource.md) | `undefined` |
| `startNs` | `number` | `undefined` |
| `stopNs` | `number` | `undefined` |
| `kind` | [`OverviewKind`](../type-aliases/OverviewKind.md) | `'fine'` |

#### Returns

`Promise`\<[`WaveformRange`](../interfaces/WaveformRange.md)\>
