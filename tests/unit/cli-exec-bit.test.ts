/** The executable-bit healer behind the CLI's self-heal, doctor and the plugin sync. */
import { chmodSync, mkdtempSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ensureExecutable } from '../../cli/util';

describe.skipIf(process.platform === 'win32')('ensureExecutable', () => {
  it('restores a lost executable bit and reports what it did', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'ua-execbit-')), 'cli.js');
    writeFileSync(file, '#!/usr/bin/env node\n');
    chmodSync(file, 0o644);
    expect(ensureExecutable(file)).toBe('fixed');
    expect(statSync(file).mode & 0o111).not.toBe(0);
    expect(ensureExecutable(file)).toBe('ok');
    expect(ensureExecutable(join(file, '..', 'missing.js'))).toBe('failed');
  });
});
