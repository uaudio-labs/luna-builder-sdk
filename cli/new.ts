import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { addOnClashes, bundlePath, flagNumber, flagString, installedAddOns, isWindow, menuFor, packageRoot, sdkVersion, type Args } from './util';

/** Manifest fields only a `"window"` uses; a browser, app or editor scaffold leaves them out. */
const WINDOW_ONLY_FIELDS = ['floating', 'show_with_session', 'width', 'height'];

/** Drop the named lines from the template's manifest and the comma they leave dangling. */
function withoutFields(manifest: string, fields: string[]): string {
  const kept = manifest.split('\n').filter((line) => !fields.some((f) => line.trimStart().startsWith(`"${f}":`)));
  return kept.join('\n').replace(/,(\s*\})\s*$/, '$1\n');
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function titleCase(name: string): string {
  return name.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

/**
 * The SDK's `file:` spec for a scaffold's package.json. npm resolves it against the
 * package.json, so a relative path keeps working when the Add On, or anything above both
 * it and the SDK (a home folder, a synced drive), moves. Cross-drive on Windows has no
 * relative form; only then is the absolute path written.
 */
function builderPath(dir: string): string {
  const rel = relative(dir, packageRoot());
  return isAbsolute(rel) ? packageRoot() : rel.split(sep).join('/');
}

/** Copy the vendored script-tag bundle into an Add On folder. */
export function vendorBundle(target: string): void {
  const src = bundlePath();
  if (!src) throw new Error(`No SDK bundle under ${packageRoot()}. Run "npm run build" in the builder package.`);
  mkdirSync(join(target, 'vendor'), { recursive: true });
  cpSync(src, join(target, 'vendor', 'luna.global.js'));
  if (existsSync(`${src}.map`)) cpSync(`${src}.map`, join(target, 'vendor', 'luna.global.js.map'));
}

export async function newAddOn(args: Args): Promise<number> {
  const name = args.positional[0];
  if (!name) {
    console.error('usage: ua-builder new <name> [--id com.x.y] [--name "Name"] [--manufacturer "Name"] [--target window|app|browser|editor] [--no-floating] [--show-with-session] [--width N --height N] [--template add-on-basic|add-on-typescript] [--dir path]\n  --no-floating, --show-with-session, --width and --height apply to --target window only');
    return 2;
  }
  const dir = resolve(flagString(args, 'dir') ?? process.cwd(), name);
  if (existsSync(dir)) {
    console.error(`${dir} already exists`);
    return 1;
  }
  const target = flagString(args, 'target') ?? 'window';
  if (!['window', 'app', 'browser', 'editor'].includes(target)) {
    console.error(`unknown --target "${target}"; use window, app, browser or editor`);
    return 2;
  }
  const templates = join(packageRoot(), 'templates');
  const template = join(templates, flagString(args, 'template') ?? 'add-on-basic');
  if (!existsSync(template)) {
    console.error(`template not found: ${template}\navailable: ${readdirSync(templates).filter((t) => !t.startsWith('.')).join(', ')}`);
    return 1;
  }
  // A template with a tsconfig.json builds src/ into dist/ before the page can load.
  const typescript = existsSync(join(template, 'tsconfig.json'));
  const id = flagString(args, 'id') ?? `com.example.${slug(name)}`;
  // --title is the flag's old spelling, kept as an alias.
  const displayName = flagString(args, 'name') ?? flagString(args, 'title') ?? titleCase(name);
  const manufacturer = flagString(args, 'manufacturer');
  const clashes = addOnClashes([{ id, name: displayName }], installedAddOns());
  if (clashes.length) {
    console.error(`An installed Add On already uses this identity:\n  - ${clashes.join('\n  - ')}\nPick another with --id com.x.y and/or --name "Name".`);
    return 1;
  }
  const replacements: Record<string, string> = {
    __NAME__: name,
    __SLUG__: slug(name),
    __ID__: id,
    __TITLE__: displayName,
    __MANUFACTURER__: JSON.stringify(manufacturer ?? '').slice(1, -1),
    __TARGET__: target,
    __FLOATING__: String(!args.flags['no-floating']),
    __SHOW_WITH_SESSION__: String(!!args.flags['show-with-session']),
    __WIDTH__: String(flagNumber(args, 'width', 900)),
    __HEIGHT__: String(flagNumber(args, 'height', 600)),
    __SDK_VERSION__: sdkVersion(),
    __BUILDER_PATH__: builderPath(dir),
  };
  for (const file of walk(template)) {
    const rel = file.slice(template.length + 1);
    const dest = join(dir, rel);
    mkdirSync(join(dest, '..'), { recursive: true });
    let text = readFileSync(file, 'utf8');
    for (const [k, v] of Object.entries(replacements)) text = text.replaceAll(k, v);
    if (rel === 'manifest.json') {
      const omit = [...(isWindow(target) ? [] : WINDOW_ONLY_FIELDS), ...(manufacturer ? [] : ['manufacturer'])];
      if (omit.length) text = withoutFields(text, omit);
    }
    writeFileSync(dest, text);
  }
  vendorBundle(dir);
  if (typescript) {
    console.log(`Created ${dir}

Next:
  cd ${name}
  npm install                 # TypeScript, Vite, vitest and the SDK
  npm test                    # runs against Luna.MockEngine, no LUNA needed
  npm run build               # src/ -> dist/main.js, the classic script index.html loads
  npx ua-builder serve        # http://localhost:8790/ (LUNA must be running for live data)
  npx ua-builder install      # link into LUNA's Add Ons folder; it appears under ${menuFor(target)}
  npm run pack                # build, then a .lunaaddon without sources or source maps

Edit src/main.ts for the UI and src/logic.ts for the parts tests exercise; run npm run dev to
rebuild on save. See docs/QUICKSTART.md.`);
    return 0;
  }
  console.log(`Created ${dir}

Next:
  cd ${name}
  npm install                 # vitest + the SDK for tests
  npm test                    # runs against Luna.MockEngine, no LUNA needed
  npx ua-builder serve        # http://localhost:8790/ (LUNA must be running for live data)
  npx ua-builder install      # link into LUNA's Add Ons folder; it appears under ${menuFor(target)}

Edit main.js for the UI and logic.js for the parts tests exercise. See docs/QUICKSTART.md.`);
  return 0;
}
