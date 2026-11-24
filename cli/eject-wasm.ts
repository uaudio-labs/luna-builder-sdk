import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { ENGINE_HINT, resolveEngine, type Engine } from './engine';
import { engineFiles, readEngineId } from './engine-build';
import { checkPageReferences, collect, isEjectOutput } from './pack';
import { bundlePath, errorMessage, flagString, readManifest, type Args } from './util';
import { createZip, type ZipEntry } from './zip';

/** The folder the SDK loads the engine from by default (`engineUrl` `/__engine/`). */
const ENGINE_FOLDER = '__engine';

/** Read by `Luna.connect()` when the URL names no engine (src/client/detect.ts). */
export const ENGINE_META = '<meta name="luna-engine" content="wasm">';

/**
 * `html` with {@link ENGINE_META} as the first thing in its `<head>` (or after `<html>`, or at
 * the top), so it is in the document before any script runs. A page that already names an
 * engine is returned unchanged.
 */
export function withEngineMeta(html: string): string {
  if (/<meta\s[^>]*name\s*=\s*["']?luna-engine\b/i.test(html)) return html;
  for (const tag of [/<head\b[^>]*>/i, /<html\b[^>]*>/i]) {
    const m = tag.exec(html);
    if (!m) continue;
    const at = m.index + m[0].length;
    const indent = /^\r?\n([ \t]*)/.exec(html.slice(at))?.[1] ?? '';
    return `${html.slice(0, at)}\n${indent}${ENGINE_META}${html.slice(at)}`;
  }
  return `${ENGINE_META}\n${html}`;
}

/** The engine build in `dir` as zip entries under `<top>/__engine/`, with a folder entry for each folder. */
function engineEntries(dir: string, top: string): ZipEntry[] {
  const files = engineFiles(dir);
  const folders = new Set(['']);
  for (const f of files) {
    const parts = f.path.split('/');
    for (let i = 1; i < parts.length; i++) folders.add(parts.slice(0, i).join('/'));
  }
  const name = (path: string): string => `${top}/${ENGINE_FOLDER}${path ? `/${path}` : ''}`;
  return [
    ...[...folders].sort().map((path): ZipEntry => ({ name: `${name(path)}/`, mtime: statSync(join(dir, ...path.split('/'))).mtime, mode: 0o40755 })),
    ...files.map((f): ZipEntry => ({ name: name(f.path), data: readFileSync(f.file), mtime: f.mtime, mode: 0o100000 | f.mode })),
  ];
}

/** True when `path` is inside `dir` (or is it). */
function isInside(path: string, dir: string): boolean {
  const rel = relative(dir, path);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith(sep) && !/^[a-z]:/i.test(rel));
}

/**
 * The default output folder's name: the manifest's `package_name` (else the Add On folder's
 * name), lower-cased with dashes for spaces, plus `-web`. "StudioLo" gives `studiolo-web`.
 */
export function ejectFolderName(packageName: unknown, dir: string): string {
  const named = typeof packageName === 'string' ? packageName.trim() : '';
  const base = named && !/[\\/]/.test(named) && named !== '.' && named !== '..' ? named : basename(dir);
  return `${base.toLowerCase().replace(/\s+/g, '-')}-web`;
}

/**
 * @hidden Wasm support is not released: this command stays out of `usage()` and the docs.
 *
 * Copy a built Add On, with a wasm engine build, into a folder a browser can run on its own:
 * the Add On's files (the same ones `ua-builder pack` ships, with the vendored SDK bundle
 * replaced by this SDK's), the engine in `__engine/`, a `serve.py` that serves it with the
 * cross-origin isolation headers the engine needs, and a README. Each manifest page gets
 * {@link ENGINE_META}, so it connects to the wasm engine wherever it is hosted. Writes the
 * folder (default: {@link ejectFolderName} in the current directory, as `ua-builder pack` writes
 * its file) and a zip of it. The Add On's own folder is not changed, and an output inside it is
 * left out of later packs and ejects. The engine comes from `--engine`, `--luna-version`, or
 * one found locally (see {@link resolveEngine}); the Add On is checked first, so a mistake there
 * costs no engine download.
 */
export async function ejectWasm(args: Args): Promise<number> {
  const dir = resolve(args.positional[0] ?? process.cwd());
  const { manifest, entries: addOns } = readManifest(dir);
  const out = resolve(flagString(args, 'out') ?? ejectFolderName(manifest['package_name'], dir));
  // Replacing the output deletes it first, so it must not be the Add On or hold it. Inside the
  // Add On is fine: a pack or an eject leaves an eject output out (see isEjectOutput).
  if (isInside(dir, out)) {
    console.error(`Not ejected: the output ${out} would replace the Add On folder ${dir}, or a folder holding it. Pass --out <folder>.`);
    return 1;
  }
  if (existsSync(out) && !isEjectOutput(out)) {
    console.error(`Not ejected: ${out} already exists and is not an earlier eject-wasm output. Remove it or pass --out <folder>.`);
    return 1;
  }
  const top = basename(out);
  const { entries } = collect(dir, top, false);
  const packed = new Set(entries.filter((e) => e.data).map((e) => e.name.slice(top.length + 1)));
  const pages = [...new Set(addOns.flatMap((a) => (a.html ? [a.html.split(/[?#]/)[0]!.split(sep).join('/')] : [])))];
  if (!pages.length) {
    console.error('Not ejected: no Add On in manifest.json has an "html" page to open.');
    return 1;
  }
  const { errors, warnings } = checkPageReferences(dir, pages, packed);
  for (const w of warnings.filter((w) => !/module script/.test(w))) console.warn(`warning: ${w}`);
  if (errors.length) {
    console.error(`Not ejected; the Add On would not load:\n  - ${errors.join('\n  - ')}`);
    return 1;
  }

  let resolved: Engine | undefined;
  try {
    resolved = await resolveEngine(args);
  } catch (err) {
    console.error(`Not ejected: ${errorMessage(err)}.`);
    return 1;
  }
  if (!resolved) {
    console.error(`Not ejected: no wasm engine found; ${ENGINE_HINT}.`);
    return 1;
  }
  const engineDir = resolved.dir;
  let engine: ZipEntry[];
  try {
    engine = engineEntries(engineDir, top);
  } catch (err) {
    console.error(`Not ejected: ${errorMessage(err)}.`);
    return 1;
  }
  const engineId = readEngineId(engineDir);

  const sdkBundle = bundlePath();
  for (const e of entries) {
    const rel = e.name.slice(top.length + 1);
    if (pages.includes(rel) && e.data) e.data = Buffer.from(withEngineMeta(e.data.toString('utf8')), 'utf8');
    // An Add On that vendors the SDK gets this one, which has the wasm engine support.
    if (rel === 'vendor/luna.global.js' && sdkBundle) e.data = readFileSync(sdkBundle);
  }
  const first = addOns.find((a) => a.html)!;
  const name = first.name;
  const version = first.version ?? (typeof manifest['version'] === 'string' ? manifest['version'] : '');
  const now = new Date();
  const file = (rel: string, text: string, mode = 0o644): ZipEntry => ({ name: `${top}/${rel}`, data: Buffer.from(text, 'utf8'), mtime: now, mode: 0o100000 | mode });
  const all = [
    ...entries,
    ...engine,
    file('serve.py', servePy(pages[0]!), 0o755),
    file('README.txt', readme(name, pages[0]!)),
  ];

  rmSync(out, { recursive: true, force: true });
  for (const e of all) {
    const path = join(dirname(out), ...e.name.split('/'));
    if (!e.data) mkdirSync(path, { recursive: true });
    else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, e.data, { mode: e.mode & 0o777 });
    }
  }
  const zip = `${out}.zip`;
  writeFileSync(zip, createZip(all));

  if (engineId === undefined) console.warn(`warning: ${engineDir} has no engine_id in its build.json, so the ejected folder cannot say which engine build it carries.`);
  console.log(`Ejected ${name}${version ? ` ${version}` : ''} with wasm engine ${engineId ?? '?'}${resolved.lunaVersion ? ` (LUNA ${resolved.lunaVersion})` : ''}`);
  console.log(`  ${out}`);
  console.log(`  ${zip}`);
  console.log(`Run it: python3 "${join(realpathSync(out), 'serve.py')}"`);
  return 0;
}

/** The folder's server: stdlib only, so any Python 3 runs it. */
function servePy(page: string): string {
  return `#!/usr/bin/env python3
"""Serve this folder so a browser can run the Add On on the LUNA wasm engine.

The engine needs SharedArrayBuffer, which browsers give only to pages served with
cross-origin isolation headers, so opening the page from disk or with a plain
\`python3 -m http.server\` does not work. This adds those headers.

    python3 serve.py [--port 8790] [--no-browser]

Then open the URL it prints (it opens it for you unless --no-browser). Ctrl-C to stop.
"""

import argparse
import functools
import http.server
import json
import os
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGE = ${JSON.stringify(page)}


class IsolatedHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.wasm': 'application/wasm',
    }

    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


def describe():
    """'StudioLo 0.1.2 on wasm engine 9b50e6a9eff5', from the two manifests."""
    def load(*parts):
        try:
            with open(os.path.join(ROOT, *parts)) as f:
                return json.load(f)
        except (OSError, ValueError):
            return {}
    manifest = load('manifest.json')
    addon = next((a for a in manifest.get('add_ons') or [] if a.get('html')), manifest)
    engine = load('${ENGINE_FOLDER}', 'build.json')
    return '%s %s on wasm engine %s' % (
        addon.get('name') or addon.get('title') or 'Add On',
        addon.get('version') or manifest.get('version') or '?',
        engine.get('engine_id', '?'))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--port', type=int, default=8790)
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()

    handler = functools.partial(IsolatedHandler, directory=ROOT)
    for port in range(args.port, args.port + 20):
        try:
            httpd = http.server.ThreadingHTTPServer(('localhost', port), handler)
            break
        except OSError:
            continue
    else:
        raise SystemExit('ports %d-%d are all in use; pass --port' % (args.port, args.port + 19))

    url = 'http://localhost:%d/%s' % (port, PAGE)
    print(describe(), flush=True)
    print('Open %s in Chrome. Ctrl-C to stop.' % url, flush=True)
    if not args.no_browser:
        webbrowser.open(url)
    with httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
`;
}

function readme(name: string, page: string): string {
  const title = `${name} in the browser (LUNA wasm engine)`;
  return `${title}
${'='.repeat(title.length)}

${name} is a LUNA Add On. This folder runs it in a web browser on the LUNA
engine compiled to WebAssembly, with no LUNA install needed.

Requirements
- Chrome (desktop).
- Python 3. On a Mac, run \`python3 --version\` in Terminal; if macOS offers to
  install the developer tools, accept, then try again.

Start
1. Open Terminal and run:
       python3 <path to this folder>/serve.py
   (Type \`python3 \`, drag serve.py onto the Terminal window, press Return.)
2. Chrome opens http://localhost:8790/${page}. If another browser opens, copy
   that URL into Chrome.
3. Leave Terminal open while it runs. Ctrl-C in Terminal stops the server.

The page must be opened from that URL. Opening ${page} directly does not work.

Using it
- Click anywhere on the page once: browsers keep audio off until you do.
- The engine starts with no session. Create or open one in the Add On.
- Recording asks to use the microphone when a track is armed; allow it. To undo
  a denial, use the site settings icon at the left of Chrome's address bar.

What's in here
- serve.py: a local web server that adds the headers the engine needs.
- ${ENGINE_FOLDER}/: the LUNA wasm engine and the plug-ins it can load
  (${ENGINE_FOLDER}/build.json names the engine build).
- Everything else: the Add On.

Sessions are kept in Chrome's storage for the page's address (port included),
not in this folder. If serve.py reports a different port, earlier sessions
are not visible there.
`;
}
