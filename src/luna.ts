/**
 * The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/ua-builder-sdk'`
 * or, from a script tag, `globalThis.Luna`.
 */

// wire
export type {
  Port,
  PortStatus,
  Event,
  EventHandler,
  GetOptions,
  SubscribeOptions,
  Unsubscribe,
  StatusListener,
  Operation,
  Verb,
  WireMessage,
  LogFn,
  LogLevel,
} from './wire/port';
export { eventMatches, getOptionsToParams, joinPath, propertyValue, splitPath, stripValueSuffix, toEvent, consoleLog } from './wire/port';
export { UAError as Error, NotRunning, RequestTimeout, ConnectionLost, Unsupported, NoSessionOpen, Disposed } from './wire/errors';
export { WebSocketPort, DEFAULT_LUNA_PORT } from './wire/websocket-port';
export type { WebSocketPortOptions, SocketLike, SocketConstructor } from './wire/websocket-port';
export { MockEngine, MockPort } from './wire/mock-port';
export { WasmPort, wasmUpdateToEvent } from './wire/wasm-port';
export type { WasmPortOptions } from './wire/wasm-port';
export { WasmEngine, bootWasmEngine } from './engine/loader';
export type { WasmState, BootOptions, AudioHealth, WasmModule, WasmHooks, ModuleFactory } from './engine/loader';
export type { MockNodeSpec, CommandHandler, MockMidiRow } from './wire/mock-port';
export { expandMulti } from './wire/multi';
export { encodeRequest, decodeMessage, encodePayload, float, FloatLiteral } from './wire/codec';

// store
export type { Prop, WritableProp, List } from './store/prop';
export { Cell, Scheduler, derived, listOf, writable, shallowEquals } from './store/prop';
export { Store } from './store/store';

// model
export * from './model/index';

// client
export { connect } from './client/connect';
export type { ConnectOptions } from './client/connect';
export { Client } from './client/client';
export type { Engine } from './client/client';
export { isEmbeddedInLuna, locationOptions, hasNativeBridge, isLunaEnginePort } from './client/detect';
export type { LocationOptions } from './client/detect';

/** SDK version, kept in sync with package.json by the build. */
export const VERSION = '0.1.0-alpha.2';
