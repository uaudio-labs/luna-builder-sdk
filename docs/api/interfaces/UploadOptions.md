# Interface: UploadOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="bytes"></a> `bytes` | `ArrayBuffer` \| `Blob` \| `Uint8Array`\<`ArrayBufferLike`\> | The file's bytes: a browser `File`/`Blob`, an `ArrayBuffer` or a `Uint8Array`. |
| <a id="chunkbytes"></a> `chunkBytes?` | `number` | Bytes per `transfer` post. Clamped to 1 KiB..4 MiB; default 256 KiB. |
| <a id="name"></a> `name?` | `string` | File name to store it under. Taken from a `File` when omitted. |
| <a id="onprogress"></a> `onProgress?` | (`sent`, `total`) => `void` | Called after each chunk with the bytes sent so far and the total. |
| <a id="timeoutms"></a> `timeoutMs?` | `number` | How long to wait for the workspace to list the finished source. Default 30 000 ms. |
