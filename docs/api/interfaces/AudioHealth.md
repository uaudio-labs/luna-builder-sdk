# Interface: AudioHealth

Audio-path health as the engine reports it.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="callbacks"></a> `callbacks` | `number` | Total AudioWorklet process() callbacks; increasing means the browser is pulling audio. |
| <a id="contextstate"></a> `contextState` | `number` | -1 no context yet, 0 suspended, 1 running, 2 closed, 3 interrupted. |
| <a id="inputpeak"></a> `inputPeak` | `number` | - |
| <a id="inputstate"></a> `inputState` | `number` | 0 not requested, 1 prompting, 2 connected, 3 denied, 4 unavailable. |
| <a id="peak"></a> `peak` | `number` | Peak |sample| of the last output block. |
| <a id="underruns"></a> `underruns` | `number` | - |
