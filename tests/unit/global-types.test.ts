/**
 * `@uaudio/luna-builder-sdk/global` types the `Luna` global for TypeScript that reads it
 * instead of importing the SDK, and every `Luna.*` type, the wire ones included, is a type.
 */
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bundlePath, packageRoot } from '../../cli/util';

let dir = '';

/** Type errors in `source`, compiled as an Add On's src/main.ts with the global's tsconfig. */
function errors(source: string, types = ['@uaudio/luna-builder-sdk/global']): string[] {
  const file = join(dir, 'main.ts');
  writeFileSync(file, source);
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    strict: true,
    noEmit: true,
    types,
  };
  // `types` resolves from the current directory, as tsc does from the tsconfig.json's folder.
  const host = ts.createCompilerHost(options);
  host.getCurrentDirectory = () => dir;
  const program = ts.createProgram([file], options, host);
  return ts.getPreEmitDiagnostics(program).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

beforeAll(() => {
  if (!bundlePath()) throw new Error('run "npm run build" first: the global types read dist/index.d.ts');
  dir = mkdtempSync(join(tmpdir(), 'ua-global-'));
  mkdirSync(join(dir, 'node_modules', '@uaudio'), { recursive: true });
  symlinkSync(packageRoot(), join(dir, 'node_modules', '@uaudio', 'luna-builder-sdk'), 'junction');
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('@uaudio/luna-builder-sdk/global', () => {
  it('types Luna as a value and its members as types, with no import', () => {
    expect(
      errors(`
        export async function f(): Promise<string> {
          const luna: Luna.Client = await Luna.connect();
          const session: Luna.Session | undefined = luna.sessions.current();
          const stop: Luna.Unsubscribe = luna.status.onChange(() => {});
          const handler: Luna.EventHandler = (e: Luna.Event) => void e.path;
          const options: Luna.GetOptions = {};
          const port: Luna.Port | undefined = undefined;
          stop();
          void [handler, options, port];
          return Luna.formatBarBeat(session?.transport.location.value?.bar_beat);
        }
      `),
    ).toEqual([]);
  });

  it('is checked, not any', () => {
    const found = errors(`
      export const n: number = Luna.formatBarBeat(undefined);
      export function g(t: Luna.Track) { return t.noSuchMember; }
    `);
    expect(found.some((m) => m.includes("'string' is not assignable to type 'number'"))).toBe(true);
    expect(found.some((m) => m.includes("'noSuchMember' does not exist on type 'Track'"))).toBe(true);
  });

  it('leaves Luna undeclared without it', () => {
    expect(errors('export const v = Luna.VERSION;', []).some((m) => m.includes("Cannot find name 'Luna'"))).toBe(true);
  });
});
