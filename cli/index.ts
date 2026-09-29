/**
 * ua-builder: scaffold, serve, test, install and pack LUNA Add Ons.
 *
 *   ua-builder new <name> [--id com.x.y] [--title "..."] [--target window|app] [--width N --height N] [--dir path]
 *   ua-builder serve [dir] [--port 8790] [--host 0.0.0.0] [--luna [--forward-port 4719]]
 *   ua-builder test [dir] [--live]
 *   ua-builder install [dir] [--name "Link Name"]
 *   ua-builder pack [dir] [--out file.zip]
 *   ua-builder doctor
 *   ua-builder tree [path] [--levels N] [--out file.json]
 */
import { doctor } from './doctor';
import { install } from './install';
import { newAddOn } from './new';
import { pack } from './pack';
import { serve } from './serve';
import { test } from './test';
import { tree } from './tree';
import { parseArgs, usage } from './util';

async function main(): Promise<number> {
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
