/**
 * ua-builder: scaffold, serve, test, install and pack LUNA Add Ons.
 *
 *   ua-builder new <name> [--id com.x.y] [--title "..."] [--target window|app] [--width N --height N] [--dir path]
 *   ua-builder serve [dir] [--port 8790] [--host 0.0.0.0] [--luna [--forward-port 4719]]
 *   ua-builder test [dir] [--live]
 *   ua-builder probe <url> [--expr <js>] [--wait <js>] [--settle <ms>] [--timeout <ms>] [--chrome <path>]
 *   ua-builder install [dir] [--name "Link Name"]
 *   ua-builder pack [dir] [--out Name.lunaaddon]
 *   ua-builder doctor
 *   ua-builder tree [path] [--levels N] [--out file.json]
 */
import { doctor } from './doctor';
import { install } from './install';
import { newAddOn } from './new';
import { pack } from './pack';
import { probe } from './probe';
import { serve } from './serve';
import { test } from './test';
import { tree } from './tree';
import { ensureExecutable, parseArgs, usage } from './util';
import { fileURLToPath } from 'node:url';

async function main(): Promise<number> {
  // Self-heal a lost executable bit (zip extractions and copies drop it): this run may have
  // come in through `node .../cli.js`, and after this the plain `npx ua-builder` works too.
  try {
    ensureExecutable(fileURLToPath(import.meta.url));
  } catch {
    /* not a file: URL in some bundlers; nothing to heal */
  }
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  switch (command) {
    case 'new':
      return newAddOn(args);
    case 'serve':
      return serve(args);
    case 'test':
      return test(args);
    case 'install':
      return install(args);
    case 'pack':
      return pack(args);
    case 'probe':
      return probe(args);
    case 'doctor':
      return doctor(args);
    case 'tree':
      return tree(args);
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      console.log(usage());
      return 0;
    default:
      console.error(`unknown command: ${command}\n`);
      console.log(usage());
      return 2;
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  },
);
