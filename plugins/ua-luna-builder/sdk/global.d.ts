/**
 * The `Luna` global that the script-tag bundle (`luna.global.js`) defines, typed for TypeScript
 * code that reads it instead of importing the SDK. Both values (`Luna.connect()`) and types
 * (`Luna.Session`) resolve.
 *
 * @example
 * // tsconfig.json
 * { "compilerOptions": { "types": ["@uaudio/luna-builder-sdk/global"] } }
 *
 * // src/main.ts: no import, the page loads vendor/luna.global.js first
 * const luna = await Luna.connect();
 * const session: Luna.Session | undefined = luna.sessions.current();
 */
import { Luna as LunaNamespace } from '@uaudio/luna-builder-sdk';

declare global {
  export import Luna = LunaNamespace;
}
