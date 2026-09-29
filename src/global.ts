/**
 * Entry for the IIFE bundle (`dist/luna.global.js`), which tsup exposes as `globalThis.Luna`.
 *
 * @example
 * <script src="luna.global.js"></script>
 * <script> Luna.connect().then((luna) => console.log(luna.engine)); </script>
 */
export * from './luna';
