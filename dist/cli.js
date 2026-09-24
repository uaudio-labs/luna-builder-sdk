#!/usr/bin/env node

// cli/doctor.ts
import { connect as connect2 } from "net";
import { existsSync as existsSync3 } from "fs";

// cli/serve.ts
import { createReadStream, existsSync as existsSync2, statSync } from "fs";
import { createServer as createHttpServer } from "http";
import { connect, createServer as createTcpServer } from "net";
import { networkInterfaces } from "os";
import { extname, join as join2, normalize, resolve as resolve2, sep } from "path";

// cli/util.ts
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      positional.push(a);
      continue;
    }
    const eq = a.indexOf("=");
    if (eq >= 0) {
      flags[a.slice(2, eq)] = a.slice(eq + 1);
      continue;
    }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== void 0 && !next.startsWith("--")) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = true;
    }
  }
  return { positional, flags };
}
function flagString(args, key) {
  const v = args.flags[key];
  return typeof v === "string" ? v : void 0;
}
function flagNumber(args, key, fallback) {
  const v = flagString(args, key);
  const n = v === void 0 ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function packageRoot() {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 4; i++) {
    if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "templates"))) return dir;
    dir = dirname(dir);
  }
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}
function bundlePath() {
  for (const dir of ["dist", "sdk"]) {
    const p = join(packageRoot(), dir, "luna.global.js");
    if (existsSync(p)) return p;
  }
  return void 0;
}
function sdkVersion() {
  try {
    return JSON.parse(readFileSync(join(packageRoot(), "package.json"), "utf8")).version;
  } catch {
    return "0.0.0";
  }
}
function addOnsFolder() {
  if (process.platform === "darwin") return "/Library/Application Support/Universal Audio/LUNA/Add Ons";
  if (process.platform === "win32") return join(process.env["LOCALAPPDATA"] ?? join(process.env["USERPROFILE"] ?? "", "AppData", "Local"), "Universal Audio", "LUNA", "Add Ons");
  throw new Error("LUNA Add Ons are supported on macOS and Windows only");
}
function readManifest(dir) {
  const path = join(dir, "manifest.json");
  if (!existsSync(path)) throw new Error(`no manifest.json in ${dir}`);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(`manifest.json is not valid JSON: ${e.message}`);
  }
  const entries = Array.isArray(manifest.add_ons) ? manifest.add_ons : [manifest];
  const problems = [];
  for (const [i, e] of entries.entries()) {
    const where = `entry ${i} (${e.id ?? "no id"})`;
    for (const k of ["id", "title"]) if (typeof e[k] !== "string" || !e[k]) problems.push(`${where}: "${k}" must be a non-empty string`);
    for (const k of ["width", "height"]) if (typeof e[k] !== "number") problems.push(`${where}: "${k}" must be a number`);
    if ((e.html ? 1 : 0) + (e.url ? 1 : 0) !== 1) problems.push(`${where}: exactly one of "html" or "url" is required`);
    if (e.html && !existsSync(join(dir, e.html))) problems.push(`${where}: html file not found: ${e.html}`);
    if (e.target !== void 0 && !["window", "app", "page", "browser"].includes(e.target)) problems.push(`${where}: unknown target "${e.target}"`);
  }
  if (problems.length) throw new Error(`manifest.json problems:
  - ${problems.join("\n  - ")}`);
  return { manifest, entries };
}
function usage() {
  return `ua-builder ${sdkVersion()} \u2014 build LUNA Add Ons

  ua-builder new <name> [--id com.x.y] [--title "Title"] [--target window|app]
                        [--width 900 --height 600] [--dir path]
  ua-builder serve [dir] [--port 8790] [--host 0.0.0.0] [--luna [--forward-port 4719]]
  ua-builder test [dir] [--live]
  ua-builder install [dir] [--name "Link Name"]
  ua-builder pack [dir] [--out file.zip]
  ua-builder doctor
  ua-builder tree [path] [--levels 1] [--out tree.json]   the shape of LUNA's tree (read-only)

Docs: docs/QUICKSTART.md, docs/MANIFEST.md in the @uaudio/ua-builder-sdk package.`;
}

// cli/serve.ts
var MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mid": "audio/midi",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg"
};
async function serve(args) {
  const dir = resolve2(args.positional[0] ?? process.cwd());
  const port = flagNumber(args, "port", 8790);
  const host = flagString(args, "host") ?? (args.flags["luna"] ? "0.0.0.0" : "127.0.0.1");
  const root = packageRoot();
  const engineDir = resolveEngineDir(flagString(args, "engine"));
  const server = createHttpServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    let pathname = decodeURIComponent(url.pathname);
    let base = dir;
    if (pathname.startsWith("/__builder/")) {
      base = root;
      pathname = pathname.slice("/__builder".length);
    } else if (pathname.startsWith("/__engine/")) {
      if (!engineDir) return send(res, 404, "no wasm engine mounted; pass --engine <dir> or set UA_WASM_ENGINE");
      base = engineDir;
      pathname = pathname.slice("/__engine".length);
    }
    const file = safeJoin(base, pathname);
    if (!file) return send(res, 403, "forbidden");
    let target = file;
    if (existsSync2(target) && statSync(target).isDirectory()) target = join2(target, "index.html");
    if (!existsSync2(target) || statSync(target).isDirectory()) return send(res, 404, `not found: ${pathname}`);
    res.writeHead(200, {
      "Content-Type": MIME[extname(target).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "no-store",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin"
    });
    createReadStream(target).pipe(res);
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolveListen());
  });
  const lines = [`Serving ${dir}`, `  http://localhost:${port}/`];
  lines.push(engineDir ? `  http://localhost:${port}/__engine/devicedwasm.js   (wasm engine from ${engineDir})` : "  no wasm engine mounted (--engine <dir>)");
  if (args.flags["luna"]) {
    const forwardPort = flagNumber(args, "forward-port", 4719);
    const lunaPort = flagNumber(args, "luna-port", 4718);
    const proxy = createTcpServer((socket) => {
      const upstream = connect(lunaPort, "127.0.0.1");
      socket.pipe(upstream).pipe(socket);
      const drop = () => {
        socket.destroy();
        upstream.destroy();
      };
      socket.on("error", drop);
      upstream.on("error", drop);
    });
    await new Promise((r) => proxy.listen(forwardPort, "0.0.0.0", () => r()));
    const ip = lanAddress();
    lines.push(`  Forwarding 0.0.0.0:${forwardPort} -> 127.0.0.1:${lunaPort} (LUNA)`);
    lines.push(`  From another device: http://${ip}:${port}/?host=${ip}&port=${forwardPort}`);
  }
  lines.push("", "COOP/COEP headers are on, so pages here can also boot the wasm engine. Ctrl-C to stop.");
  console.log(lines.join("\n"));
  await new Promise(() => void 0);
  return 0;
}
function safeJoin(base, pathname) {
  const full = normalize(join2(base, pathname));
  const baseNorm = normalize(base + sep);
  return full === normalize(base) || full.startsWith(baseNorm) ? full : void 0;
}
function send(res, code, text) {
  res.writeHead(code, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}
function lanAddress() {
  for (const list of Object.values(networkInterfaces())) {
    for (const i of list ?? []) {
      if (i.family === "IPv4" && !i.internal) return i.address;
    }
  }
  return "localhost";
}
function resolveEngineDir(flag) {
  const candidates = [flag, process.env["UA_WASM_ENGINE"]].filter((x) => typeof x === "string" && x.length > 0);
  const root = packageRoot();
  for (const rel of ["../../../hbsystem/wasm_engine/dist/Release", "../../../hbsystem/wasm_engine/dist/Debug"]) candidates.push(resolve2(root, rel));
  for (const c of candidates) {
    const dir = resolve2(c);
    if (existsSync2(join2(dir, "devicedwasm.js"))) return dir;
    if (existsSync2(join2(dir, "Release", "devicedwasm.js"))) return join2(dir, "Release");
  }
  return void 0;
}

// cli/doctor.ts
function probe(port, host = "127.0.0.1", timeoutMs = 800) {
  return new Promise((resolve7) => {
    const s = connect2(port, host);
    const done = (ok) => {
      s.destroy();
      resolve7(ok);
    };
    s.setTimeout(timeoutMs, () => done(false));
    s.once("connect", () => done(true));
    s.once("error", () => done(false));
  });
}
async function doctor(_args) {
  const rows = [];
  rows.push(["ua-builder", sdkVersion()]);
  rows.push(["node", process.version + (Number(process.versions.node.split(".")[0]) >= 22 ? "" : "  (need >= 22)")]);
  rows.push(["SDK bundle", bundlePath() ?? "missing: run npm run build"]);
  const engineDir = resolveEngineDir(void 0);
  rows.push(["wasm engine build", engineDir ?? "not found (set UA_WASM_ENGINE or pass --engine to serve)"]);
  const [luna, wasmBridge] = await Promise.all([probe(4718), probe(4749)]);
  rows.push(["LUNA engine :4718", luna ? "listening" : "not listening (is LUNA running?)"]);
  rows.push(["wasm bridge :4749", wasmBridge ? "listening" : "not listening (only with the luna_connects_to_wasm feature key)"]);
  try {
    const folder = addOnsFolder();
    rows.push(["Add Ons folder", `${folder} ${existsSync3(folder) ? "" : "(does not exist yet)"}`]);
  } catch (e) {
    rows.push(["Add Ons folder", e.message]);
  }
  const width = Math.max(...rows.map(([k]) => k.length));
  for (const [k, v] of rows) console.log(`${k.padEnd(width)}  ${v}`);
  if (!luna) {
    console.log("\nNo engine on 4718. Start LUNA and open a session, or test against Luna.MockEngine (npm test).");
    return 1;
  }
  return 0;
}

// cli/install.ts
import { cpSync, existsSync as existsSync4, lstatSync, mkdirSync, readlinkSync, rmSync, symlinkSync } from "fs";
import { basename, join as join3, resolve as resolve3 } from "path";
async function install(args) {
  const dir = resolve3(args.positional[0] ?? process.cwd());
  const { manifest, entries } = readManifest(dir);
  const name = flagString(args, "name") ?? (typeof manifest.link_name === "string" && manifest.link_name.trim() ? manifest.link_name.trim() : basename(dir));
  if (/[\\/]/.test(name) || name === "." || name === "..") throw new Error(`invalid link name "${name}"`);
  const folder = addOnsFolder();
  mkdirSync(folder, { recursive: true });
  const target = join3(folder, name);
  if (existsSync4(target) || isDanglingLink(target)) {
    const st = lstatSync(target);
    if (st.isSymbolicLink()) {
      const current = readlinkSync(target);
      if (resolve3(current) === dir) {
        console.log(`Already installed: ${target} -> ${dir}`);
        return report(entries);
      }
      rmSync(target);
    } else if (process.platform === "win32" && args.flags["force"]) {
      rmSync(target, { recursive: true, force: true });
    } else {
      throw new Error(`${target} exists and is not a symlink; remove it or pass --force (Windows copy)`);
    }
  }
  if (process.platform === "win32") {
    cpSync(dir, target, { recursive: true, filter: (src) => !src.includes(`${join3("node_modules")}`) });
    console.log(`Copied ${dir} -> ${target}`);
  } else {
    symlinkSync(dir, target);
    console.log(`Linked ${target} -> ${dir}`);
  }
  return report(entries);
}
function isDanglingLink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}
function report(entries) {
  console.log(`LUNA will list:`);
  for (const e of entries) console.log(`  ${e.title}  (${e.id})  in the ${e.target === "app" || e.target === "page" ? "View" : "Window"} menu`);
  return 0;
}

// cli/new.ts
import { cpSync as cpSync2, existsSync as existsSync5, mkdirSync as mkdirSync2, readFileSync as readFileSync2, readdirSync, statSync as statSync2, writeFileSync } from "fs";
import { join as join4, resolve as resolve4 } from "path";
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function titleCase(name) {
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join4(dir, entry);
    if (statSync2(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
function vendorBundle(target) {
  const src = bundlePath();
  if (!src) throw new Error(`No SDK bundle under ${packageRoot()}. Run "npm run build" in the builder package.`);
  mkdirSync2(join4(target, "vendor"), { recursive: true });
  cpSync2(src, join4(target, "vendor", "luna.global.js"));
  if (existsSync5(`${src}.map`)) cpSync2(`${src}.map`, join4(target, "vendor", "luna.global.js.map"));
}
async function newAddOn(args) {
  const name = args.positional[0];
  if (!name) {
    console.error('usage: ua-builder new <name> [--id com.x.y] [--title "Title"] [--target window|app] [--width N --height N] [--dir path]');
    return 2;
  }
  const dir = resolve4(flagString(args, "dir") ?? process.cwd(), name);
  if (existsSync5(dir)) {
    console.error(`${dir} already exists`);
    return 1;
  }
  const template = join4(packageRoot(), "templates", flagString(args, "template") ?? "add-on-basic");
  if (!existsSync5(template)) {
    console.error(`template not found: ${template}`);
    return 1;
  }
  const replacements = {
    __NAME__: name,
    __SLUG__: slug(name),
    __ID__: flagString(args, "id") ?? `com.example.${slug(name)}`,
    __TITLE__: flagString(args, "title") ?? titleCase(name),
    __TARGET__: flagString(args, "target") ?? "window",
    __WIDTH__: String(flagNumber(args, "width", 900)),
    __HEIGHT__: String(flagNumber(args, "height", 600)),
    __SDK_VERSION__: sdkVersion(),
    __BUILDER_PATH__: packageRoot()
  };
  for (const file of walk(template)) {
    const rel = file.slice(template.length + 1);
    const dest = join4(dir, rel);
    mkdirSync2(join4(dest, ".."), { recursive: true });
    let text = readFileSync2(file, "utf8");
    for (const [k, v] of Object.entries(replacements)) text = text.replaceAll(k, v);
    writeFileSync(dest, text);
  }
  vendorBundle(dir);
  console.log(`Created ${dir}

Next:
  cd ${name}
  npm install                 # vitest + the SDK for tests
  npm test                    # runs against Luna.MockEngine, no LUNA needed
  npx ua-builder serve        # http://localhost:8790/ (LUNA must be running for live data)
  npx ua-builder install      # link into LUNA's Add Ons folder; it appears under Window

Edit main.js for the UI and logic.js for the parts tests exercise. See docs/QUICKSTART.md.`);
  return 0;
}

// cli/pack.ts
import { spawnSync } from "child_process";
import { existsSync as existsSync6, rmSync as rmSync2 } from "fs";
import { basename as basename2, dirname as dirname2, join as join5, resolve as resolve5 } from "path";
async function pack(args) {
  const dir = resolve5(args.positional[0] ?? process.cwd());
  const { entries } = readManifest(dir);
  if (existsSync6(join5(dir, "vendor", "luna.global.js")) && !args.flags["no-vendor"]) {
    vendorBundle(dir);
    console.log("Refreshed vendor/luna.global.js");
  }
  const out = resolve5(flagString(args, "out") ?? `${basename2(dir)}.zip`);
  if (existsSync6(out)) rmSync2(out);
  const excludes = ["node_modules/*", ".git/*", "*.zip", "tests/*", "vitest.config.*", "package-lock.json"];
  let result;
  if (process.platform === "win32") {
    const cmd = `Compress-Archive -Path '${dir}\\*' -DestinationPath '${out}' -Force`;
    result = spawnSync("powershell", ["-NoProfile", "-Command", cmd], { stdio: "inherit" });
  } else {
    result = spawnSync("zip", ["-r", "-q", out, basename2(dir), ...excludes.flatMap((x) => ["-x", `${basename2(dir)}/${x}`])], { cwd: dirname2(dir), stdio: "inherit" });
  }
  if (result.status !== 0) throw new Error("zip failed");
  console.log(`Packed ${entries.length} Add On(s) -> ${out}`);
  console.log(`Install by unzipping into LUNA's Add Ons folder, or run: ua-builder install ${basename2(dir)}`);
  return 0;
}

// cli/test.ts
import { spawnSync as spawnSync2 } from "child_process";
import { existsSync as existsSync7 } from "fs";
import { join as join6, resolve as resolve6 } from "path";
async function test(args) {
  const dir = resolve6(args.positional[0] ?? process.cwd());
  if (!existsSync7(join6(dir, "package.json"))) throw new Error(`no package.json in ${dir}; run "npm install" in the Add On folder first`);
  const env = { ...process.env, ...args.flags["live"] ? { UA_LIVE: "1" } : {} };
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync2(npx, ["vitest", "run", ...args.flags["watch"] ? [] : []], { cwd: dir, stdio: "inherit", env });
  return result.status ?? 1;
}

// cli/tree.ts
import { writeFileSync as writeFileSync2 } from "fs";

// src/wire/codec.ts
function appendParams(path, params) {
  if (!params) return path;
  const entries = Object.entries(params);
  if (entries.length === 0) return path;
  const query = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  return path + (path.includes("?") ? "&" : "?") + query;
}
var FloatLiteral = class {
  constructor(value) {
    this.value = value;
    if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`Luna.float: ${String(value)} is not a finite number`);
  }
  value;
  /** The literal as it goes on the wire: always with a fraction or an exponent. */
  toLiteral() {
    const text = String(this.value);
    return /[.eE]/.test(text) ? text : `${text}.0`;
  }
  toJSON() {
    return this.value;
  }
};
var floatNonce = 0;
function encodePayload(data) {
  if (data === void 0) return "";
  let floats = false;
  const marker = `float${++floatNonce}:`;
  const text = JSON.stringify(data, function(key, value) {
    const original = this[key];
    if (original instanceof FloatLiteral) {
      floats = true;
      return marker + original.toLiteral();
    }
    return value;
  });
  if (!floats) return text;
  const quoted = JSON.stringify(marker).slice(1, -1);
  return text.replace(new RegExp(`"${quoted.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")}([^"]*)"`, "g"), "$1");
}
function encodeRequest(verb, path, params, data) {
  const payload = encodePayload(data);
  return `${verb} ${appendParams(path, params)}${payload ? " " + payload : ""}`;
}
var JSON_MAGIC = "JSON";
function decodeMessage(text) {
  let body = text;
  if (body.startsWith(JSON_MAGIC)) body = body.slice(8);
  const nul = body.indexOf("\0");
  if (nul >= 0) body = body.slice(0, nul);
  body = body.trim();
  if (body.length === 0) return void 0;
  let raw;
  try {
    raw = JSON.parse(body);
  } catch {
    return void 0;
  }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return void 0;
  const record = raw;
  const path = typeof record["path"] === "string" ? record["path"] : typeof record["url"] === "string" ? record["url"] : void 0;
  if (path === void 0) return void 0;
  const message = { path };
  if ("data" in record) message.data = record["data"];
  if (record["operation"] === "added" || record["operation"] === "removed") message.operation = record["operation"];
  if (record["parameters"] !== null && typeof record["parameters"] === "object") {
    message.parameters = record["parameters"];
  }
  if (typeof record["error"] === "string") message.error = record["error"];
  if (typeof record["cmd"] === "string") message.cmd = record["cmd"];
  return message;
}
function correlationId(message, key) {
  const value = message.parameters?.[key];
  return value === void 0 || value === null ? void 0 : String(value);
}

// src/wire/errors.ts
var UAError = class extends Error {
  /** Engine error string or one of the SDK codes. */
  code;
  /** Verb of the request that failed, when known. */
  cmd;
  /** Path of the request that failed, when known. */
  path;
  constructor(code, message, detail = {}) {
    super(message);
    this.name = "UAError";
    this.code = code;
    this.cmd = detail.cmd;
    this.path = detail.path;
  }
};
var NotRunning = class extends UAError {
  constructor(url) {
    super("not_running", `No LUNA engine at ${url}. Start LUNA and open a session, or connect with { engine: 'wasm' }.`);
    this.name = "NotRunning";
  }
};
var RequestTimeout = class extends UAError {
  constructor(cmd, path, ms) {
    super("timeout", `${cmd} ${path} did not answer within ${ms} ms`, { cmd, path });
    this.name = "RequestTimeout";
  }
};
var ConnectionLost = class extends UAError {
  constructor(cmd, path) {
    super("disconnected", cmd ? `connection lost during ${cmd} ${path}` : "connection lost", cmd && path ? { cmd, path } : {});
    this.name = "ConnectionLost";
  }
};

// src/wire/multi.ts
function isPacked(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return false;
  const p = data;
  return Array.isArray(p["data"]) && Array.isArray(p["path"]) && Array.isArray(p["name"]) && Array.isArray(p["parent"]) && Array.isArray(p["string"]);
}
var MAX_DEPTH = 256;
function packedPath(p, id) {
  const parts = [];
  let current = id;
  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const nameIndex = p.name[current];
    const parent = p.parent[current];
    if (nameIndex === void 0 || parent === void 0) break;
    parts.push(p.string[nameIndex] ?? "");
    if (parent === current) break;
    current = parent;
  }
  return "/" + parts.reverse().join("/");
}
function expandMulti(message) {
  if (message.path !== "multi") return [message];
  const payload = message.data;
  if (Array.isArray(payload)) {
    const out2 = [];
    for (const entry of payload) {
      if (entry !== null && typeof entry === "object" && typeof entry.path === "string") {
        out2.push(entry);
      }
    }
    return out2;
  }
  if (!isPacked(payload)) return [];
  const out = [];
  for (let i = 0; i < payload.data.length; i++) {
    const pathId = payload.path[i];
    if (pathId === void 0) continue;
    out.push({ path: packedPath(payload, pathId), data: payload.data[i] });
  }
  for (const i of payload.added ?? []) {
    const m = out[i];
    if (m) m.operation = "added";
  }
  for (const i of payload.removed ?? []) {
    const m = out[i];
    if (m) m.operation = "removed";
  }
  return out;
}

// src/wire/port.ts
var WIRE_KEYS = {
  properties: "properties",
  children: "children",
  commands: "commands",
  flatvalue: "flatvalue",
  propinfo: "propinfo",
  cmdparams: "cmdparams",
  propfilter: "propfilter",
  recursive: "recursive",
  levels: "levels",
  hidden: "hidden",
  offset: "offset",
  limit: "limit",
  includedChildren: "included_children",
  excludedChildren: "excluded_children",
  ignoreResponse: "ignore_response"
};
function getOptionsToParams(options) {
  const params = {};
  if (!options) return params;
  for (const key of Object.keys(options)) {
    const value = options[key];
    if (value === void 0) continue;
    params[WIRE_KEYS[key]] = typeof value === "boolean" ? value ? "1" : "0" : String(value);
  }
  return params;
}
function stripValueSuffix(path) {
  return path.endsWith("/value") ? path.slice(0, -"/value".length) : path;
}
function toEvent(message) {
  const event = { path: stripValueSuffix(message.path), data: message.data };
  if (message.operation) event.operation = message.operation;
  return event;
}
function eventMatches(subPath, eventPath) {
  if (subPath === "/" || subPath === "") return true;
  return eventPath === subPath || eventPath.startsWith(subPath + "/");
}
function propertyValue(data) {
  if (data !== null && typeof data === "object" && !Array.isArray(data) && "value" in data) {
    const keys = Object.keys(data);
    if (keys.length === 1 || keys.every((k) => k === "value" || k === "default" || k === "type" || k === "readonly")) {
      return data.value;
    }
  }
  return data;
}
var consoleLog = (level, message, detail) => {
  if (level === "error") console.error(`[Luna] ${message}`, detail ?? "");
  else if (level === "warn") console.warn(`[Luna] ${message}`, detail ?? "");
};

// src/wire/websocket-port.ts
var DEFAULT_LUNA_PORT = 4718;
var OPEN = 1;
function unref(timer) {
  const t = timer;
  if (typeof t.unref === "function") t.unref();
}
var WebSocketPort = class {
  url;
  Socket;
  requestTimeoutMs;
  reconnectEnabled;
  reconnectMinMs;
  reconnectMaxMs;
  heartbeatEnabled;
  idKey;
  onUnhandled;
  log;
  socket;
  status = "disconnected";
  everConnected = false;
  closed = false;
  nextId = 1;
  pending = /* @__PURE__ */ new Map();
  subscriptions = /* @__PURE__ */ new Map();
  statusListeners = /* @__PURE__ */ new Set();
  reconnectTimer;
  reconnectDelay;
  heartbeatTimer;
  constructor(options = {}) {
    this.url = options.url ?? `ws://${options.host ?? "localhost"}:${options.port ?? DEFAULT_LUNA_PORT}`;
    const Socket = options.WebSocket ?? globalThis.WebSocket;
    if (!Socket) throw new UAError("no_websocket", "No WebSocket implementation available; pass one in options.WebSocket");
    this.Socket = Socket;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 1e4;
    this.reconnectEnabled = options.reconnect ?? true;
    this.reconnectMinMs = options.reconnectMinMs ?? 250;
    this.reconnectMaxMs = options.reconnectMaxMs ?? 1e4;
    this.reconnectDelay = this.reconnectMinMs;
    this.heartbeatEnabled = options.heartbeat ?? true;
    this.idKey = options.idKey ?? "ua_id";
    this.onUnhandled = options.onUnhandled;
    this.log = options.log ?? consoleLog;
  }
  get connected() {
    return this.status === "connected";
  }
  /**
   * Connect. Resolves once the socket is open. Rejects with {@link NotRunning} if the first
   * attempt fails; later drops are handled by reconnect instead.
   */
  open() {
    if (this.closed) return Promise.reject(new ConnectionLost());
    if (this.status === "connected") return Promise.resolve();
    return new Promise((resolve7, reject) => {
      let settled = false;
      const socket = new this.Socket(this.url);
      this.socket = socket;
      this.setStatus("connecting");
      socket.onopen = () => {
        settled = true;
        this.everConnected = true;
        this.reconnectDelay = this.reconnectMinMs;
        this.setStatus("connected");
        this.resubscribeAll();
        this.startHeartbeat();
        resolve7();
      };
      socket.onmessage = (ev) => this.handleFrame(ev.data);
      socket.onerror = () => {
      };
      socket.onclose = () => {
        if (this.socket !== socket) return;
        this.socket = void 0;
        this.stopHeartbeat();
        this.failPending();
        if (!settled) {
          settled = true;
          this.setStatus("disconnected");
          if (!this.everConnected) {
            reject(new NotRunning(this.url));
            return;
          }
        } else if (!this.closed) {
          this.setStatus("disconnected");
        }
        this.scheduleReconnect();
      };
    });
  }
  async get(path, options) {
    return this.request("get", path, getOptionsToParams(options), void 0, options?.ignoreResponse === true);
  }
  async set(path, data) {
    await this.request("set", path, {}, data, false);
  }
  async post(path, data) {
    return this.request("post", path, {}, data, false);
  }
  subscribe(path, handler, options) {
    const recursive = options?.recursive === true;
    const key = `${path}|${recursive ? 1 : 0}`;
    let sub = this.subscriptions.get(key);
    if (!sub) {
      sub = { path, recursive, handlers: /* @__PURE__ */ new Set() };
      this.subscriptions.set(key, sub);
      if (this.connected) this.sendSubscribe(sub);
    }
    sub.handlers.add(handler);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const current = this.subscriptions.get(key);
      if (!current) return;
      current.handlers.delete(handler);
      if (current.handlers.size === 0) {
        this.subscriptions.delete(key);
        if (this.connected) this.fireAndForget("unsubscribe", current.path, {});
      }
    };
  }
  onStatus(listener) {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }
  async close() {
    if (this.closed) return;
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = void 0;
    this.stopHeartbeat();
    const socket = this.socket;
    this.socket = void 0;
    this.failPending();
    this.setStatus("closed");
    if (socket) {
      await new Promise((resolve7) => {
        const timer = setTimeout(resolve7, 300);
        unref(timer);
        socket.onclose = () => {
          clearTimeout(timer);
          resolve7();
        };
        try {
          socket.close();
        } catch {
          clearTimeout(timer);
          resolve7();
        }
      });
    }
  }
  // -----------------------------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------------------------
  request(verb, path, params, data, ignoreResponse) {
    const socket = this.socket;
    if (!socket || socket.readyState !== OPEN || !this.connected) {
      return Promise.reject(new ConnectionLost(verb, path));
    }
    if (ignoreResponse) {
      socket.send(encodeRequest(verb, path, params, data));
      return Promise.resolve(void 0);
    }
    const id = `r${this.nextId++}`;
    return new Promise((resolve7, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        this.log("warn", `${verb} ${path} timed out`, { verb, path, ms: this.requestTimeoutMs });
        reject(new RequestTimeout(verb, path, this.requestTimeoutMs));
      }, this.requestTimeoutMs);
      unref(timer);
      this.pending.set(id, { verb, path, resolve: resolve7, reject, timer });
      socket.send(encodeRequest(verb, path, { ...params, [this.idKey]: id }, data));
    });
  }
  fireAndForget(verb, path, params) {
    const socket = this.socket;
    if (!socket || socket.readyState !== OPEN) return;
    socket.send(encodeRequest(verb, appendParams(path, { ignore_response: "1" }), params));
  }
  sendSubscribe(sub) {
    this.fireAndForget("subscribe", sub.path, sub.recursive ? { recursive: "1" } : {});
  }
  resubscribeAll() {
    for (const sub of this.subscriptions.values()) this.sendSubscribe(sub);
  }
  handleFrame(data) {
    if (typeof data !== "string") return;
    const message = decodeMessage(data);
    if (!message) return;
    for (const entry of expandMulti(message)) {
      const id = correlationId(entry, this.idKey);
      if (id !== void 0) {
        const pending = this.pending.get(id);
        if (!pending) continue;
        this.pending.delete(id);
        clearTimeout(pending.timer);
        if (entry.error !== void 0) {
          pending.reject(new UAError(entry.error, `${pending.verb} ${pending.path}: ${entry.error}`, { cmd: pending.verb, path: pending.path }));
        } else {
          pending.resolve(entry.data);
        }
        continue;
      }
      if (entry.parameters && "ignore_response" in entry.parameters) continue;
      const event = toEvent(entry);
      let delivered = false;
      for (const sub of this.subscriptions.values()) {
        if (!eventMatches(sub.path, event.path)) continue;
        delivered = true;
        for (const handler of sub.handlers) {
          try {
            handler(event);
          } catch (err) {
            this.log("error", "subscription handler threw", { path: event.path, error: err });
          }
        }
      }
      if (!delivered) this.onUnhandled?.(entry);
    }
  }
  failPending() {
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      this.pending.delete(id);
      p.reject(new ConnectionLost(p.verb, p.path));
    }
  }
  scheduleReconnect() {
    if (this.closed || !this.reconnectEnabled || !this.everConnected || this.reconnectTimer) return;
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.reconnectMaxMs);
    this.log("info", `reconnecting to ${this.url} in ${delay} ms`, { url: this.url, delayMs: delay });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = void 0;
      if (this.closed) return;
      this.open().catch(() => {
      });
    }, delay);
    unref(this.reconnectTimer);
  }
  startHeartbeat() {
    if (!this.heartbeatEnabled) return;
    this.get("/status/timeout_ms", { flatvalue: true }).then((data) => {
      const timeoutMs = Number(propertyValue(data));
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || this.closed || !this.connected) return;
      const interval = Math.max(1e3, Math.floor(timeoutMs / 2));
      this.stopHeartbeat();
      this.heartbeatTimer = setInterval(() => {
        if (!this.connected) return;
        this.fireAndForget("get", "/ping", {});
      }, interval);
      unref(this.heartbeatTimer);
    }).catch(() => {
    });
  }
  stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = void 0;
  }
  setStatus(status, detail) {
    if (this.status === status) return;
    this.status = status;
    this.log(status === "disconnected" && this.everConnected && !this.closed ? "warn" : "debug", `${this.url} ${status}`, { url: this.url, status });
    for (const listener of this.statusListeners) {
      try {
        listener(status, detail);
      } catch (err) {
        this.log("error", "status listener threw", { status, error: err });
      }
    }
  }
};

// cli/tree.ts
var KEEP_VALUES = /* @__PURE__ */ new Set(["type", "name", "control_type", "track_type", "bus_type", "stem_format", "insert_type", "output_type", "num_streams", "discrete", "version"]);
function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}
function valueOf(raw) {
  return raw !== null && typeof raw === "object" && !Array.isArray(raw) && "value" in raw ? raw.value : raw;
}
function lastSegment(path) {
  return (path ?? "").split("/").filter(Boolean).pop() ?? "";
}
function shapeOf(node) {
  const out = {};
  if (node.properties) {
    out.properties = {};
    for (const [name, raw] of Object.entries(node.properties).sort(([a], [b]) => a.localeCompare(b))) {
      const value = valueOf(raw);
      const readOnly = raw !== null && typeof raw === "object" && raw.read_only === true;
      const entry = { read_only: readOnly, type: typeOf(value) };
      if (KEEP_VALUES.has(name) && (typeof value !== "object" || value === null)) entry.value = value;
      out.properties[name] = entry;
    }
  }
  if (node.children?.length) out.children = node.children.map((c) => lastSegment(c.path));
  if (node.commands?.length) out.commands = node.commands.map((c) => lastSegment(c.path)).sort();
  return out;
}
async function read(port, path, levels = 1) {
  return await port.get(path, { children: true, commands: true, levels });
}
async function snapshot(port) {
  const nodes = {};
  const notes = [];
  const add = async (label, path) => {
    if (!path) return void 0;
    try {
      const node = await read(port, path);
      nodes[label] = shapeOf(node);
      return node;
    } catch (err) {
      notes.push(`${label} (${path}): ${err.code ?? String(err)}`);
      return void 0;
    }
  };
  const status = await add("/status", "/status");
  const version = String(valueOf(status?.properties?.["version"]) ?? "unknown");
  const sessions = await add("/sessions", "/sessions");
  const sid = lastSegment(sessions?.children?.[0]?.path);
  if (!sid) notes.push("no session is open: open one with a mono audio track to capture the session nodes");
  const S = sid ? `/sessions/${sid}` : void 0;
  const session = await add("/sessions/<session>", S);
  if (S && session) {
    const tracks = await port.get(`${S}/tracks`, { children: true, levels: 2, commands: false, flatvalue: true, propfilter: ["track_type", "stem_format"] });
    const audio = tracks.children?.find((c) => c.properties?.["track_type"] === "audio");
    const T = audio ? `${S}/tracks/${lastSegment(audio.path)}` : void 0;
    if (!T) notes.push("no audio track: the track nodes are missing");
    await add("/sessions/<session>/tracks/<audio track>", T);
    await add("<track>/outputs", T && `${T}/outputs`);
    await add("<track>/outputs/main", T && `${T}/outputs/main`);
    await add("<track>/outputs/main/controls", T && `${T}/outputs/main/controls`);
    await add("<track>/outputs/main/controls/gain", T && `${T}/outputs/main/controls/gain`);
    await add("<track>/outputs/main/meters/level", T && `${T}/outputs/main/meters/level`);
    await add("<track>/outputs/send_0", T && `${T}/outputs/send_0`);
    await add("<track>/outputs/send_0/controls", T && `${T}/outputs/send_0/controls`);
    await add("<track>/controls", T && `${T}/controls`);
    await add("<track>/effects", T && `${T}/effects`);
    await add("<track>/effects/effect_0", T && `${T}/effects/effect_0`);
    await add("/sessions/<session>/buses", `${S}/buses`);
    await add("/sessions/<session>/contexts/main", `${S}/contexts/main`);
    await add("/sessions/<session>/tempo_map", `${S}/tempo_map`);
    await add("/sessions/<session>/playlists", `${S}/playlists`);
  }
  const plugins = await add("/plugins", "/plugins");
  const first = lastSegment(plugins?.children?.[0]?.path);
  await add("/plugins/<plugin>", first ? `/plugins/${first}` : void 0);
  for (const top of ["/workspace", "/renders", "/devices", "/drivers", "/preferences", "/gui"]) await add(top, top);
  return { luna: version, dumped: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), note: "Shape only: property read_only and value type, child names, command names. Made by `ua-builder tree --out`.", ...notes.length ? { notes } : {}, nodes };
}
async function tree(args) {
  const port = new WebSocketPort({ host: flagString(args, "host") ?? "localhost", port: Number(flagString(args, "port") ?? 4718), heartbeat: false, reconnect: false, requestTimeoutMs: 1e4 });
  await port.open();
  try {
    const path = args.positional[0];
    const result = path ? { path, ...shapeOf(await read(port, path, Number(flagString(args, "levels") ?? 1))) } : await snapshot(port);
    const text = `${JSON.stringify(result, null, 2)}
`;
    const out = flagString(args, "out");
    if (out) {
      writeFileSync2(out, text);
      console.log(`wrote ${out}`);
    } else process.stdout.write(text);
    return 0;
  } finally {
    await port.close();
  }
}

// cli/index.ts
async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  switch (command) {
    case "new":
      return newAddOn(args);
    case "serve":
      return serve(args);
    case "test":
      return test(args);
    case "install":
      return install(args);
    case "pack":
      return pack(args);
    case "doctor":
      return doctor(args);
    case "tree":
      return tree(args);
    case void 0:
    case "help":
    case "--help":
    case "-h":
      console.log(usage());
      return 0;
    default:
      console.error(`unknown command: ${command}
`);
      console.log(usage());
      return 2;
  }
}
main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
);
