#!/usr/bin/env node
/**
 * Read-only gate for the ua-luna-builder agent plugin.
 *
 * The plugin folder is generated (`npm run build`, which runs sync-plugin) and git-ignored.
 * This proves four things about it, because a plugin fails silently in ways a package does not:
 *   1. one version, package.json's, across the generated host manifests and the builds (the
 *      shell manifests and the catalogs carry none);
 *   2. the catalogs point at the plugin folder that is actually here;
 *   3. every generated file (shell, builds, skills, template, examples, docs) matches its
 *      original, and `dist/` itself matches a fresh build, so nothing shipped is stale;
 *   4. the plugin still works relocated — copied somewhere else, with no checkout and no
 *      node_modules, its bundle loads and its helper resolves its own files.
 *
 * `node scripts/check-plugin.mjs --fast` skips the rebuild in (3).
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { BUILDS, DOCS, GLOBAL_DTS, PLUGIN, SHELL, VERSIONED_SHELL, repointExample, withCliNote, withVersion } from './sync-plugin.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const fast = process.argv.includes('--fast');
const read = (p) => readFile(resolve(root, p), 'utf8');
const json = async (p) => JSON.parse(await read(p));
const stripMap = (s) => s.replace(/^\/\/# sourceMappingURL=.*\n?/gm, '');
const stale = (what) => `Stale ${what}: run npm run build`;

// ---------------------------------------------------------------- 1. one version

const pkg = await json('package.json');
// major.minor.patch in source; the installer build appends the Bamboo build number.
assert.match(pkg.version, /^\d+\.\d+\.\d+(\.\d+)?$/, 'package.json version is not major.minor.patch[.build]');

for (const name of VERSIONED_SHELL) {
  assert.equal((await json(`${SHELL}/${name}`)).version, undefined, `${SHELL}/${name} must not set a version; the sync adds package.json's`);
}

const vendored = await json(`${PLUGIN}/package.json`);
assert.equal(vendored.name, pkg.name, 'the plugin must vendor the package under its own name');
assert.equal(vendored.version, pkg.version, stale(`${PLUGIN}/package.json`));
assert.equal(vendored.exports['.'].import, './sdk/index.js');
assert.equal(vendored.bin['ua-builder'], './sdk/cli.js');

for (const host of ['claude', 'codex']) {
  const manifest = await json(`${PLUGIN}/.${host}-plugin/plugin.json`);
  assert.equal(manifest.name, 'ua-luna-builder', `${host}: plugin name`);
  assert.equal(manifest.version, pkg.version, `${host}: plugin.json version`);
  assert.ok(manifest.description?.length > 40, `${host}: plugin.json needs a real description`);
  assert.ok(manifest.author?.name, `${host}: plugin.json needs an author`);
  if (host === 'codex') {
    assert.equal(manifest.skills, './skills/', 'codex discovers skills from an explicit path');
    assert.ok(manifest.interface?.displayName && manifest.interface?.category);
    assert.ok(manifest.interface.defaultPrompt?.length >= 1);
  }
}

// ------------------------------------------------- 2. catalogs point at this folder

const claude = await json('.claude-plugin/marketplace.json');
const claudeEntry = claude.plugins.find((p) => p.name === 'ua-luna-builder');
assert.ok(claudeEntry, 'ua-luna-builder is missing from the Claude catalog');
// The catalogs carry no version, so plugin.json (from package.json) is the only one.
assert.equal(claude.metadata?.version ?? claudeEntry.version, undefined, 'the Claude catalog must not set a version');
// A relative string is the local-directory source form; anything else has to be resolvable.
assert.equal(claudeEntry.source, `./${PLUGIN}`, 'the Claude catalog must point at the plugin in this repo');

const codex = await json('.agents/plugins/marketplace.json');
const codexEntry = codex.plugins.find((p) => p.name === 'ua-luna-builder');
assert.ok(codexEntry, 'ua-luna-builder is missing from the Codex catalog');
assert.equal(codexEntry.source, `./${PLUGIN}`);
assert.equal(codexEntry.policy.installation, 'AVAILABLE');
assert.equal(codexEntry.policy.authentication, 'ON_INSTALL');
assert.ok(codexEntry.category);

await stat(resolve(root, PLUGIN)).catch(() => {
  throw new Error(`Both catalogs name ${PLUGIN}, which does not exist: run npm run build`);
});

// --------------------------------------------------- 3. nothing vendored is stale

const temporary = await mkdtemp(join(tmpdir(), 'ua-builder-plugin-'));
try {
  if (!fast) {
    const output = join(temporary, 'dist');
    execFileSync(process.execPath, [join(root, 'node_modules/tsup/dist/cli-default.js'), '--out-dir', output], { cwd: root, stdio: 'pipe' });
    for (const name of await readdir(output, { recursive: true })) {
      if (name.endsWith('.map') || !/\.(js|cjs|ts|cts)$/.test(name)) continue; // maps embed output-relative paths
      assert.equal(stripMap(await readFile(join(output, name), 'utf8')), stripMap(await read(`dist/${name}`)), stale(`dist/${name}`));
    }
  }

  for (const name of BUILDS) {
    const source = await read(`dist/${name}`);
    assert.equal(await read(`${PLUGIN}/sdk/${name}`), name.endsWith('.ts') ? source : stripMap(source), stale(`${PLUGIN}/sdk/${name}`));
  }
  assert.equal(await read(`${PLUGIN}/${GLOBAL_DTS.to}`), await read(GLOBAL_DTS.from), stale('the Luna global declaration'));
  if (process.platform !== 'win32') {
    // The plugin's bin: without the executable bit, `npx ua-builder` in a scaffold that
    // file:-depends on this plugin dies with "Permission denied".
    assert.ok(((await stat(join(root, PLUGIN, 'sdk', 'cli.js'))).mode & 0o111) !== 0, `${PLUGIN}/sdk/cli.js is not executable; rebuild (npm run sync-plugin)`);
  }

  const skills = (await readdir(join(root, 'skills'), { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  assert.ok(skills.length, 'no skills to vendor');
  for (const skill of skills) {
    const text = await read(`${PLUGIN}/skills/${skill}/SKILL.md`);
    assert.equal(text, withCliNote(await read(`skills/${skill}/SKILL.md`)), stale(`${PLUGIN}/skills/${skill}`));
    assert.match(text, /^---\nname: .+\ndescription: .+\n---/, `${skill}: SKILL.md front matter needs name and description`);
    for (const leak of ['CLAUDE_PLUGIN_ROOT', '.claude/plugins', '.codex/plugins']) {
      assert.ok(!text.includes(leak), `${skill}: provider-specific path "${leak}" — resolve the plugin root relatively instead`);
    }
  }

  for (const [from, into, rewrite] of [
    [SHELL, PLUGIN, (s, relative) => (VERSIONED_SHELL.includes(relative) ? withVersion(s, pkg.version) : s)],
    ['examples', `${PLUGIN}/examples`, repointExample],
    ['templates', `${PLUGIN}/templates`, (s) => s],
  ]) {
    for (const entry of await readdir(join(root, from), { withFileTypes: true, recursive: true })) {
      if (!entry.isFile() || entry.name === '.DS_Store') continue;
      // With / on Windows too, so it matches VERSIONED_SHELL's entries.
      const relative = join(entry.parentPath.slice(join(root, from).length + 1), entry.name).replaceAll('\\', '/');
      assert.equal(await read(join(into, relative)), rewrite(await read(join(from, relative)), relative), stale(join(into, relative)));
    }
  }
  for (const name of DOCS) assert.equal(await read(`${PLUGIN}/docs/${name}`), await read(`docs/${name}`), stale(`${PLUGIN}/docs/${name}`));

  // Every example script must import the plugin's own module build.
  for (const entry of await readdir(join(root, PLUGIN, 'examples'), { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.mjs')) continue;
    const text = await readFile(join(entry.parentPath, entry.name), 'utf8');
    for (const [, spec] of text.matchAll(/from\s+'([^']+)'/g)) {
      if (!spec.startsWith('.')) continue;
      assert.ok(!spec.includes('dist/'), `${entry.name}: imports "${spec}", which points outside the plugin`);
      const resolved = fileURLToPath(new URL(spec, pathToFileURL(join(entry.parentPath, entry.name))));
      await stat(resolved).catch(() => {
        throw new Error(`${entry.name}: imports "${spec}", which does not resolve inside the plugin`);
      });
    }
  }

  // Every example page must load the plugin's own bundle, never reach out of the plugin.
  for (const entry of await readdir(join(root, PLUGIN, 'examples'), { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const text = await readFile(join(entry.parentPath, entry.name), 'utf8');
    for (const [, src] of text.matchAll(/<script src="([^"]+)"/g)) {
      assert.ok(!src.includes('dist/'), `${entry.name}: script src "${src}" points outside the plugin`);
      if (src.includes('luna.global.js')) {
        const resolved = fileURLToPath(new URL(src, pathToFileURL(join(entry.parentPath, entry.name))));
        await stat(resolved).catch(() => {
          throw new Error(`${entry.name}: script src "${src}" does not resolve inside the plugin`);
        });
      }
    }
  }

  // ------------------------------------------------ 4. it works somewhere else entirely

  const relocated = join(temporary, 'ua-luna-builder');
  await cp(join(root, PLUGIN), relocated, { recursive: true });

  const page = join(temporary, 'page');
  execFileSync(process.execPath, [join(relocated, 'scripts/vendor-sdk.mjs'), page], { cwd: temporary, stdio: 'pipe' });
  assert.equal(await readFile(join(page, 'luna.global.js'), 'utf8'), await read(`${PLUGIN}/sdk/luna.global.js`), 'vendor-sdk.mjs copied the wrong file');

  const context = {};
  runInNewContext(await read(`${PLUGIN}/sdk/luna.global.js`), context);
  assert.equal(context.Luna.VERSION, pkg.version, 'the script-tag bundle does not define Luna at this version');
  assert.equal(typeof context.Luna.connect, 'function');

  const esm = JSON.parse(
    execFileSync(
      process.execPath,
      ['--input-type=module', '-e', `import { Luna } from ${JSON.stringify(pathToFileURL(join(relocated, 'sdk/index.js')).href)}; console.log(JSON.stringify({ VERSION: Luna.VERSION, connect: typeof Luna.connect }));`],
      { cwd: temporary, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ),
  );
  assert.deepEqual(esm, { VERSION: pkg.version, connect: 'function' }, 'the relocated module build does not import');

  // The bundled CLI must find the plugin as its package root and scaffold from sdk/.
  const scaffold = join(temporary, 'scaffolded');
  execFileSync(process.execPath, [join(relocated, 'sdk/cli.js'), 'new', 'probe-add-on', '--dir', scaffold, '--name', 'Probe Add On'], { cwd: temporary, stdio: 'pipe' });
  const addOn = join(scaffold, 'probe-add-on');
  assert.equal(await readFile(join(addOn, 'vendor/luna.global.js'), 'utf8'), await read(`${PLUGIN}/sdk/luna.global.js`), 'the relocated CLI vendored the wrong bundle');
  const manifest = JSON.parse(await readFile(join(addOn, 'manifest.json'), 'utf8'));
  assert.equal(manifest.sdk_version, pkg.version);
  assert.equal(manifest.title, 'Probe Add On');
  assert.ok(!(await readFile(join(addOn, 'package.json'), 'utf8')).includes('__'), 'template placeholders survived the scaffold');

  // ------------------------------------------------------- relative links resolve

  // The shell's links resolve only once it is in the generated folder, which is checked.
  const skip = new Set(['node_modules', '.git', 'dist', 'coverage', 'api']);
  async function checkLinks(dir) {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      if (skip.has(item.name)) continue;
      const path = join(dir, item.name);
      if (path === join(root, SHELL)) continue;
      if (item.isDirectory()) {
        await checkLinks(path);
        continue;
      }
      if (!item.name.endsWith('.md')) continue;
      const text = await readFile(path, 'utf8');
      for (const [, link] of text.matchAll(/\]\(([^\s)]+)\)/g)) {
        if (/^[a-z]+:|^#/.test(link)) continue;
        const target = decodeURIComponent(link.split('#')[0]);
        if (!target) continue;
        await stat(resolve(dirname(path), target)).catch(() => {
          throw new Error(`Broken link in ${path.slice(root.length)}: ${link}`);
        });
      }
    }
  }
  await checkLinks(root);

  console.log(`ua-luna-builder ${pkg.version}: version, catalogs, ${BUILDS.length} builds, ${skills.length} skills, template, examples, docs, relocation and links verified${fast ? ' (rebuild skipped)' : ''}.`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
