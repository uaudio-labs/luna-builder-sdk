# Interface: GestureOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="capture"></a> `capture?` | `boolean` | Call `setPointerCapture` on pointer down so moves outside the element still reach it. Use it for canvas or div controls that write from `pointermove`; a native range input tracks the pointer by itself. Default false. |
| <a id="onbegin"></a> `onBegin?` | (`event`) => `void` | Called after the controls are touched, with the pointer-down event. |
| <a id="onend"></a> `onEnd?` | (`event?`) => `void` | Called after the controls are released, with the event that ended the drag (none when [Gesture.end](Gesture.md#end) or [Gesture.dispose](Gesture.md#dispose) ended it). A good place to resync the element to the engine's settled value. |
