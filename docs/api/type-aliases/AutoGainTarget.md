# Type Alias: AutoGainTarget

```ts
type AutoGainTarget = 
  | {
  id: string;
  sessionUid: string;
}
  | {
  channelUid: string;
  sessionUid: string;
};
```

A track (or any channel with an input) Auto Gain can run on: its session and its uid.
