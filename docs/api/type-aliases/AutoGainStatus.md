# Type Alias: AutoGainStatus

```ts
type AutoGainStatus = 
  | "unknown"
  | "stopped"
  | "waiting_for_signal"
  | "listening"
  | "overload"
  | "adjusting_gain"
  | "done_listening"
  | "overload_error"
  | "low_signal_error";
```

`/auto_gain`'s `status` (fact 191). `done_listening`, `overload_error` and `low_signal_error`
end a pass; `stopped` is the idle state.
