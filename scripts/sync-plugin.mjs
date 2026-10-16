#!/usr/bin/env node
/**
 * Generate plugins/ua-luna-builder from this package: the hand-written shell in `plugin/`
 * (host manifests, package.json, README, NOTICE, scripts/), plus copies of the builds, the
 * skills, the consumer docs, the add-on template and the examples.
 *
 * The plugin has to be self-contained — an agent installs it with no checkout, no npm
 * install and no network — so everything it needs is copied in. The folder is generated
 * and git-ignored, like `dist/`, and ships through package.json "files": `npm run build`
 * regenerates it, `npm run check:plugin` proves it is current. Edit `plugin/` and the
 * originals, never the generated folder.
 *
 * Three rewrites happen on the way in:
 *   - builds lose their `sourceMappingURL` line; the maps are not shipped.
 *   - example pages load `../../sdk/luna.global.js` instead of `../../dist/luna.global.js`.
 *   - SKILL.md files gain the CLI note below, because inside the plugin there is no
 *     `npx ua-builder` yet.
 */
import { chmod, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export const PLUGIN = 'plugins/ua-luna-builder';
export const SHELL = 'plugin';
const plugin = join(root, PLUGIN);
const read = (p) => readFile(join(root, p), 'utf8');
const noDsStore = (src) => !src.endsWith('.DS_Store');
const stripMap = (s) => s.replace(/^\/\/# sourceMappingURL=.*\n?/gm, '');

async function write(relative, contents) {
  const target = join(plugin, relative);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents);
}

export const CLI_NOTE = `> **Running the CLI from this plugin.** In a project that already depends on
> \`@uaudio/luna-builder-sdk\`, run \`npx ua-builder <command>\`. Installed as a plugin there is
> no npm project yet: resolve the plugin root as two directories above this skill's
> directory and run \`node <plugin-root>/sdk/cli.js <command>\` instead — the arguments are
> identical. The plugin also carries the script-tag bundle (\`sdk/luna.global.js\`, copied into
> an Add On folder by \`node <plugin-root>/scripts/vendor-sdk.mjs <directory>\`), the
> \`add-on-basic\` template, the examples and the docs this skill names.
`;

/** Insert the CLI note after the YAML front matter, leaving the body untouched. */
export function withCliNote(text) {
  const end = text.indexOf('\n---\n', 3);
  if (!text.startsWith('---\n') || end < 0) throw new Error('SKILL.md has no front matter');
  const head = text.slice(0, end + 5);
  return `${head}\n${CLI_NOTE}${text.slice(end + 5)}`;
}

/**
 * Example pages and scripts reach the plugin's own copy of the bundle. Pages sit either
 * flat in `examples/` (`../dist/...`) or one folder deeper (`../../dist/...`), and the
 * scripts import the module build, so all three forms are rewritten.
 */
export function repointExample(text) {
  return text
    .replaceAll('../../dist/luna.global.js', '../../sdk/luna.global.js')
    .replaceAll('../dist/luna.global.js', '../sdk/luna.global.js')
    .replaceAll('../../dist/index.js', '../../sdk/index.js')
    .replaceAll('../dist/index.js', '../sdk/index.js');
}

/** Shell manifests that carry the package version: `plugin/` leaves it out, the sync adds it. */
export const VERSIONED_SHELL = ['package.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json'];

/** A shell manifest with the package version placed after its name. */
export function withVersion(text, version) {
  const { name, version: _, ...rest } = JSON.parse(text);
  return `${JSON.stringify({ name, version, ...rest }, null, 2)}\n`;
}

/** Builds: module, CJS, declarations, the script-tag bundle and the CLI. */
export const BUILDS = [
  'index.js',
  'index.cjs',
  'index.d.ts',
  'index.d.cts',
  'wire/index.js',
  'wire/index.cjs',
  'wire/index.d.ts',
  'wire/index.d.cts',
  'luna.global.js',
  'cli.js',
];

/** Consumer docs only. `api/` is generated and large. */
export const DOCS = ['QUICKSTART.md', 'FILES.md', 'MANIFEST.md', 'PROTOCOL.md', 'EVIDENCE.md', 'RECIPES.md', 'tree/luna-3.0.0.15776.json'];

/** The typed `Luna` global (`@uaudio/luna-builder-sdk/global`), hand-written in `types/`. */
export const GLOBAL_DTS = { from: 'types/global.d.ts', to: 'sdk/global.d.ts' };

async function main() {
  // Every file in the folder is generated, so start from nothing.
  await rm(plugin, { recursive: true, force: true });
  await cp(join(root, SHELL), plugin, { recursive: true, filter: noDsStore });
  const { version } = JSON.parse(await read('package.json'));
  for (const name of VERSIONED_SHELL) await write(name, withVersion(await read(`${SHELL}/${name}`), version));

  for (const name of BUILDS) {
    const text = await read(`dist/${name}`);
    await write(`sdk/${name}`, name.endsWith('.ts') ? text : stripMap(text));
  }
  // The plugin's package.json bin points here; writeFile drops the executable bit that
  // `npx ua-builder` needs in a scaffold that file:-depends on this plugin.
  await chmod(join(plugin, 'sdk', 'cli.js'), 0o755);
  await write(GLOBAL_DTS.to, await read(GLOBAL_DTS.from));

  for (const skill of (await readdir(join(root, 'skills'), { withFileTypes: true })).filter((e) => e.isDirectory())) {
    await cp(join(root, 'skills', skill.name), join(plugin, 'skills', skill.name), { recursive: true });
    await write(`skills/${skill.name}/SKILL.md`, withCliNote(await read(`skills/${skill.name}/SKILL.md`)));
  }

  await cp(join(root, 'templates'), join(plugin, 'templates'), { recursive: true, filter: noDsStore });

  for (const entry of await readdir(join(root, 'examples'), { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || entry.name === '.DS_Store') continue;
    const relative = join(entry.parentPath.slice(join(root, 'examples').length + 1), entry.name);
    await write(join('examples', relative), repointExample(await read(join('examples', relative))));
  }

  for (const name of DOCS) await write(`docs/${name}`, await read(`docs/${name}`));

  console.log(`Generated ${PLUGIN}: shell, ${BUILDS.length} builds, skills, template, examples, ${DOCS.length} docs.`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
