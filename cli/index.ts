/**
 * ua-builder: scaffold, serve, test, install and pack LUNA Add Ons.
 *
 *   ua-builder new <name> [--id com.x.y] [--name "..."] [--manufacturer "..."] [--description "..."] [--categories "MIDI,..."] [--target window|app] [--width N --height N] [--template add-on-basic|add-on-typescript] [--dir path]
 *   ua-builder serve [dir] [--port 8790] [--host 0.0.0.0] [--luna [--forward-port 4719]]
 *   ua-builder test [dir] [--live]
 *   ua-builder probe <url> [--expr <js>] [--wait <js>] [--settle <ms>] [--timeout <ms>] [--mock [setup.js]] [--luna-bridge] [--screenshot <file.png>] [--chrome <path>]
 *   ua-builder install [dir] [--name "Link Name"]
 *   ua-builder pack [dir] [--out Name.lunaaddon] [--source-maps]
 *   ua-builder eject-wasm [dir] [--engine <dir> | --luna-version <x.y.z> [--engine-base <url>]] [--out <folder>]   (hidden: not in usage() until wasm ships)
 *   ua-builder publish-engine <engine dir> --luna-version <x.y.z> --to <remote folder>   (hidden, internal: stands in for the release step)
 *   ua-builder selftest [--junit results.xml] [--only area,check.id] [--list] [--host h] [--port 4718]   (hidden: QA's check of the SDK against a LUNA build)
 *   ua-builder doctor
 *   ua-builder feedback <improvement|bug|feature|feedback> --title "..." [--body "..." | --body-file <file|->] [--luna-version x.y.z] [--print]
 *   ua-builder tree [path] [--levels N] [--out file.json]
 */
import { doctor } from './doctor';
import { ejectWasm } from './eject-wasm';
import { feedback } from './feedback';
import { publishEngineCommand } from './engine-remote';
import { install } from './install';
import { newAddOn } from './new';
import { pack } from './pack';
import { probe } from './probe';
import { selftest } from './selftest';
import { serve } from './serve';
import { test } from './test';
import { tree } from './tree';
import { ensureExecutable, errorMessage, parseArgs, usage } from './util';
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
    case 'eject-wasm':
      return ejectWasm(args);
    case 'publish-engine':
      return publishEngineCommand(args);
    case 'selftest':
      return selftest(args);
    case 'probe':
      return probe(args);
    case 'doctor':
      return doctor(args);
    case 'tree':
      return tree(args);
    case 'feedback':
      return feedback(args);
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
    console.error(errorMessage(err));
    process.exit(1);
  },
);
