import { defineConfig } from 'tsup';

// Three outputs:
//   dist/index.{js,cjs} + dist/wire/index.{js,cjs}  — module consumers, `import { Luna } from '@uaudio/luna-builder-sdk'`
//   dist/luna.global.js                                — script-tag consumers, `globalThis.Luna`
// The IIFE has its own entry because `export * as Luna` would otherwise put everything under Luna.Luna.
// Windows loads Add Ons from file://, where module scripts are blocked, so the IIFE is not optional.
export default defineConfig([
  {
    entry: { index: 'src/index.ts', 'wire/index': 'src/wire/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    splitting: false,
    clean: true,
    target: 'es2022',
    platform: 'neutral',
  },
  {
    entry: { luna: 'src/global.ts' },
    format: ['iife'],
    globalName: 'Luna',
    sourcemap: true,
    target: 'es2022',
    platform: 'browser',
  },
  {
    entry: { cli: 'cli/index.ts' },
    format: ['esm'],
    platform: 'node',
    target: 'node22',
    banner: { js: '#!/usr/bin/env node' },
    sourcemap: false,
  },
]);
