#!/usr/bin/env node
// Copy the plugin's script-tag SDK bundle into an Add On folder, so the folder is
// self-contained and its page can load `./luna.global.js` by a relative path.
// Resolves its source relative to this file, so the plugin works from anywhere it is
// installed; no provider cache directory is assumed.
//   node <plugin-root>/scripts/vendor-sdk.mjs <add-on-directory>
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const destination = process.argv[2];
if (!destination) throw new Error('Usage: node vendor-sdk.mjs <add-on-directory>');
await mkdir(destination, { recursive: true });
await copyFile(new URL('../sdk/luna.global.js', import.meta.url), resolve(destination, 'luna.global.js'));
console.log(resolve(destination, 'luna.global.js'));
