# Variable: TRACK\_TYPES

```ts
const TRACK_TYPES: readonly TrackType[];
```

Every [TrackType](../type-aliases/TrackType.md) LUNA defines. `click` and `count_in` are LUNA's system tracks, and
`bus` a track that stands for a bus; `audio`, `instrument`, `midi_matrix` and `video` are what
`session.newTrack()` makes.

## Example

```ts
const menu = Luna.TRACK_TYPES.filter((t) => t !== 'click' && t !== 'count_in');
```
