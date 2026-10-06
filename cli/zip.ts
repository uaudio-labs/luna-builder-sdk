import { deflateRawSync } from 'node:zlib';

/** One entry of a zip: a file with its bytes, or a folder (a name ending in `/`, no data). */
export interface ZipEntry {
  /** Path inside the zip, `/`-separated. Folders end in `/`. */
  name: string;
  data?: Buffer;
  mtime: Date;
  /** Unix mode bits, kept so macOS and Linux unzip restore them. */
  mode: number;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/** CRC-32 as zip uses it. `zlib.crc32` only arrived in Node 22.2. */
export function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** MS-DOS date and time, which zip headers store in local time at two-second resolution. */
function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

const UTF8_NAMES = 0x0800;
const MADE_BY_UNIX = (3 << 8) | 20;
const VERSION_NEEDED = 20;
const MAX_32 = 0xffffffff;

/**
 * A zip archive of `entries`, deflated (or stored when deflate does not help). Names are
 * flagged UTF-8. No zip64, so the archive and each entry must stay under 4 GB and 65535
 * entries, far beyond any Add On.
 */
export function createZip(entries: ZipEntry[]): Buffer {
  if (entries.length > 0xffff) throw new Error(`zip: ${entries.length} entries is more than a zip without zip64 holds`);
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const raw = entry.data ?? Buffer.alloc(0);
    const deflated = raw.length ? deflateRawSync(raw, { level: 9 }) : raw;
    const method = deflated.length < raw.length ? 8 : 0;
    const body = method === 8 ? deflated : raw;
    if (raw.length > MAX_32 || offset > MAX_32) throw new Error(`zip: ${entry.name} does not fit in a zip without zip64`);
    const crc = crc32(raw);
    const { time, date } = dosDateTime(entry.mtime);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(VERSION_NEEDED, 4);
    local.writeUInt16LE(UTF8_NAMES, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);

    const isFolder = entry.name.endsWith('/');
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(MADE_BY_UNIX, 4);
    header.writeUInt16LE(VERSION_NEEDED, 6);
    header.writeUInt16LE(UTF8_NAMES, 8);
    header.writeUInt16LE(method, 10);
    header.writeUInt16LE(time, 12);
    header.writeUInt16LE(date, 14);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(body.length, 20);
    header.writeUInt32LE(raw.length, 24);
    header.writeUInt16LE(name.length, 28);
    // Extra field, comment, disk number and internal attributes stay 0.
    header.writeUInt32LE((((entry.mode & 0xffff) << 16) | (isFolder ? 0x10 : 0)) >>> 0, 38);
    header.writeUInt32LE(offset, 42);

    chunks.push(local, name, body);
    central.push(header, name);
    offset += local.length + name.length + body.length;
  }
  const centralSize = central.reduce((n, b) => n + b.length, 0);
  if (offset > MAX_32) throw new Error('zip: archive does not fit in a zip without zip64');
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, ...central, end]);
}
