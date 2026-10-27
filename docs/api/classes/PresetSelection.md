# Class: PresetSelection

Created by [Presets.selection](Presets.md#selection).

## Extends

- `PresetSelectionBase`

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="error"></a> `error` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`Error`](Error.md) \| `null`\> | The last list query's failure, or `null`. | `PresetSelectionBase.error` |
| <a id="groups"></a> `groups` | `readonly` | [`Prop`](../interfaces/Prop.md)\<readonly [`PresetTagGroup`](../interfaces/PresetTagGroup.md)[]\> | The tag groups, once [ready](#ready). | `PresetSelectionBase.groups` |
| <a id="loading"></a> `loading` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | True while a request is in flight or waiting. | `PresetSelectionBase.loading` |
| <a id="matchanytag"></a> `matchAnyTag` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`boolean`\> | Match presets carrying any selected tag rather than all of them. Default false. | - |
| <a id="pluginid"></a> `pluginId` | `readonly` | `string` | - | - |
| <a id="presets"></a> `presets` | `readonly` | [`List`](../interfaces/List.md)\<[`PresetRow`](../interfaces/PresetRow.md)\> | Presets matching the search text and tags, with their tags. | `PresetSelectionBase.presets` |
| <a id="recommendationerror"></a> `recommendationError` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`Error`](Error.md) \| `null`\> | The last recommendation request's failure, or `null`. | - |
| <a id="recommendations"></a> `recommendations` | `readonly` | [`List`](../interfaces/List.md)\<[`PresetRecommendation`](../interfaces/PresetRecommendation.md)\> | UA Assistant's picks for the search text, among presets carrying the tags. Best first. | - |
| <a id="recommendationsavailable"></a> `recommendationsAvailable` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | True while UA Assistant is connected, so recommendations can come. | - |
| <a id="search"></a> `search` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string`\> | Search text. Filters `presets` by name; for a plugin's presets, it is also what recommendations are asked for. | `PresetSelectionBase.search` |
| <a id="tags"></a> `tags` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<readonly `string`[]\> | Selected tags. | `PresetSelectionBase.tags` |

## Accessors

### disposed

#### Get Signature

```ts
get disposed(): boolean;
```

##### Returns

`boolean`

#### Inherited from

```ts
PresetSelectionBase.disposed
```

## Methods

### clear()

```ts
clear(): Promise<void>;
```

Clear the search text and the selected tags.

#### Returns

`Promise`\<`void`\>

#### Inherited from

```ts
PresetSelectionBase.clear
```

***

### dispose()

```ts
dispose(): void;
```

Stop following and drop pending requests.

#### Returns

`void`

#### Inherited from

```ts
PresetSelectionBase.dispose
```

***

### ready()

```ts
ready(): Promise<void>;
```

Read the tag groups and the first list (and, for a plugin's presets, start following UA
Assistant's connection). Idempotent.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await sel.ready();
```

#### Inherited from

```ts
PresetSelectionBase.ready
```

***

### refresh()

```ts
refresh(): void;
```

Query again with the current inputs, for example after presets were saved or deleted.

#### Returns

`void`

#### Overrides

```ts
PresetSelectionBase.refresh
```

***

### settled()

```ts
settled(): Promise<void>;
```

Resolves once nothing is waiting or in flight and the lists match the inputs.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await sel.search.set('lion');
await sel.settled();
```

#### Inherited from

```ts
PresetSelectionBase.settled
```

***

### toggleTag()

```ts
toggleTag(tag): Promise<void>;
```

Add `tag` to the selection, or remove it if selected.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tag` | `string` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await sel.toggleTag('Clean');
```

#### Inherited from

```ts
PresetSelectionBase.toggleTag
```
