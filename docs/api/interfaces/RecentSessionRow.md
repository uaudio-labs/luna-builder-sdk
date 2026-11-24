# Interface: RecentSessionRow

A [Workspace.recentList](../classes/Workspace.md#recentlist) row: the package, and the open session showing it, if any.

## Extends

- [`SessionPackageRow`](SessionPackageRow.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="created"></a> `created` | `public` | `number` | Milliseconds since the epoch. | [`SessionPackageRow`](SessionPackageRow.md).[`created`](SessionPackageRow.md#created) |
| <a id="factory"></a> `factory` | `public` | `boolean` | - | [`SessionPackageRow`](SessionPackageRow.md).[`factory`](SessionPackageRow.md#factory) |
| <a id="favorite"></a> `favorite` | `public` | `boolean` | - | [`SessionPackageRow`](SessionPackageRow.md).[`favorite`](SessionPackageRow.md#favorite) |
| <a id="lastopened"></a> `lastOpened` | `public` | `number` | Milliseconds since the epoch. | [`SessionPackageRow`](SessionPackageRow.md).[`lastOpened`](SessionPackageRow.md#lastopened) |
| <a id="modified"></a> `modified` | `public` | `number` | Seconds since the epoch, as the engine reports it. | [`SessionPackageRow`](SessionPackageRow.md).[`modified`](SessionPackageRow.md#modified) |
| <a id="name"></a> `name` | `public` | `string` | - | [`SessionPackageRow`](SessionPackageRow.md).[`name`](SessionPackageRow.md#name) |
| <a id="online"></a> `online` | `public` | `boolean` | - | [`SessionPackageRow`](SessionPackageRow.md).[`online`](SessionPackageRow.md#online) |
| <a id="opensessionuid"></a> `openSessionUid` | `readonly` | `string` \| `undefined` | The uid of the open session of this package, or `undefined` when it is not open. | - |
| <a id="path"></a> `path` | `public` | `string` | - | [`SessionPackageRow`](SessionPackageRow.md).[`path`](SessionPackageRow.md#path) |
| <a id="sessiontype"></a> `sessionType` | `public` | `string` \| `number` | - | [`SessionPackageRow`](SessionPackageRow.md).[`sessionType`](SessionPackageRow.md#sessiontype) |
| <a id="tags"></a> `tags` | `public` | `string`[] | - | [`SessionPackageRow`](SessionPackageRow.md).[`tags`](SessionPackageRow.md#tags) |
| <a id="uid"></a> `uid` | `public` | `string` | - | [`SessionPackageRow`](SessionPackageRow.md).[`uid`](SessionPackageRow.md#uid) |
