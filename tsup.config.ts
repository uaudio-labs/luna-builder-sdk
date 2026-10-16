import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

// package.json is the one place the version is set; Luna.VERSION is compiled in from it.
const define = { __PACKAGE_VERSION__: JSON.stringify(JSON.parse(readFileSync('package.json', 'utf8')).version) };

// Outputs:
//   dist/index.{js,cjs} + dist/wire/index.{js,cjs}  — module consumers, `import { Luna } from '@uaudio/luna-builder-sdk'`
//   dist/luna.global.js                                — script-tag consumers, `globalThis.Luna`
// The IIFE has its own entry because `export * as Luna` would otherwise put everything under Luna.Luna.
// Windows loads Add Ons from file://, where module scripts are blocked, so the IIFE is not optional.
//
// Each module entry's declarations are bundled on their own. Bundled together, index.d.ts
// imports the wire types from wire/index.js, and the Luna namespace then declares the type-only
// ones (Luna.Port, Luna.Unsubscribe, ...) as values, so they cannot be used as types. The JS
// builds do not share code either (no splitting), so this matches what runs.
const declarationsOnly = (entry: Record<string, string>) => ({ entry, format: ['esm', 'cjs'] as ('esm' | 'cjs')[], dts: { only: true }, target: 'es2022', platform: 'neutral' as const, define });

export default defineConfig([
  {
    entry: { index: 'src/index.ts', 'wire/index': 'src/wire/index.ts' },
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    splitting: false,
    clean: true,
    target: 'es2022',
    platform: 'neutral',
    define,
  },
  declarationsOnly({ index: 'src/index.ts' }),
  declarationsOnly({ 'wire/index': 'src/wire/index.ts' }),
  {
    entry: { luna: 'src/global.ts' },
    format: ['iife'],
    globalName: 'Luna',
    sourcemap: true,
    define,
    target: 'es2022',
    platform: 'browser',
  },
  {
    entry: { cli: 'cli/index.ts' },
    format: ['esm'],
    platform: 'node',
    target: 'node22',
    define,
    banner: { js: '#!/usr/bin/env node' },
    sourcemap: false,
  },
]);
