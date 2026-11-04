#!/usr/bin/env node

// cli/doctor.ts
import { execFileSync } from "child_process";
import { connect } from "net";
import { existsSync as existsSync2, mkdirSync as mkdirSync2, realpathSync } from "fs";
import { join as join2 } from "path";

// cli/util.ts
import { spawnSync } from "child_process";
import { accessSync, chmodSync, constants, existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
function ensureExecutable(path) {
  if (process.platform === "win32") return "ok";
  try {
    const mode = statSync(path).mode;
    if ((mode & 73) !== 0) return "ok";
    chmodSync(path, mode | 493);
    return "fixed";
  } catch {
    return "failed";
  }
}
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
  const override = process.env["UA_ADDONS_FOLDER"];
  if (override) return override;
  if (process.platform === "darwin") return "/Library/Application Support/Universal Audio/LUNA/Add Ons";
  if (process.platform === "win32") return join(process.env["ProgramData"] ?? "C:\\ProgramData", "Universal Audio", "LUNA", "Add Ons");
  throw new Error("LUNA Add Ons are supported on macOS and Windows only");
}
var ADD_ONS_SETUP_SCRIPT = [
  "on run argv",
  "set d to quoted form of (item 1 of argv)",
  `do shell script "/bin/mkdir -p " & d & " && /usr/sbin/chown root:staff " & d & " && /bin/chmod 0775 " & d & " && /usr/bin/find " & d & " ! -type l -exec /bin/chmod +a 'group:staff allow list,add_file,search,add_subdirectory,delete_child,readattr,writeattr,readextattr,writeextattr,readsecurity,file_inherit,directory_inherit' {} +" with prompt "ua-builder wants to set up the LUNA Add Ons folder so everyone on this Mac can install Add Ons." with administrator privileges`,
  "end run"
].join("\n");
var WINDOWS_ADD_ONS_SETUP_SCRIPT = [
  "$d = $env:UA_ADDONS_SETUP_FOLDER",
  "try {",
  '  $p = Start-Process -FilePath "$env:SystemRoot\\System32\\cmd.exe" -Verb RunAs -Wait -PassThru -WindowStyle Hidden -ArgumentList "/c mkdir `"$d`" & icacls `"$d`" /grant *S-1-5-32-545:(OI)(CI)M /T /L"',
  "  exit $p.ExitCode",
  "} catch {",
  "  for ($e = $_.Exception; $e; $e = $e.InnerException) { if ($e.NativeErrorCode -eq 1223) { exit 1223 } }",
  "  [Console]::Error.WriteLine($_.Exception.Message)",
  "  exit 1",
  "}"
].join("\n");
var WINDOWS_ADD_ONS_CHECK_SCRIPT = [
  "$d = $env:UA_ADDONS_SETUP_FOLDER",
  "$rules = (Get-Acl -LiteralPath $d).GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier])",
  "$ok = @($rules | Where-Object { $_.AccessControlType -eq 'Allow' -and @('S-1-5-32-545', 'S-1-5-11', 'S-1-1-0') -contains $_.IdentityReference.Value -and ($_.InheritanceFlags -band 3) -eq 3 -and ($_.PropagationFlags -band 2) -eq 0 -and ($_.FileSystemRights -band 197055) -eq 197055 }).Count -gt 0",
  "if ($ok) { exit 0 } else { exit 1 }"
].join("\n");
function runAddOnsFolderScript(script, folder) {
  const powershell = join(process.env["SystemRoot"] ?? "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const encoded = Buffer.from(script, "utf16le").toString("base64");
  return spawnSync(powershell, ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded], {
    encoding: "utf8",
    env: { ...process.env, UA_ADDONS_SETUP_FOLDER: folder },
    windowsHide: true
  });
}
function canWriteFolder(folder) {
  try {
    if (!statSync(folder).isDirectory()) return false;
    if (process.platform === "win32") {
      const probe3 = join(folder, `.ua_builder_write_test_${process.pid}`);
      writeFileSync(probe3, "", { flag: "wx" });
      unlinkSync(probe3);
      return true;
    }
    accessSync(folder, constants.W_OK | constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
function isAddOnsFolderReady(folder = addOnsFolder()) {
  if (!canWriteFolder(folder)) return false;
  if (process.platform !== "win32" || process.env["UA_ADDONS_FOLDER"]) return true;
  return runAddOnsFolderScript(WINDOWS_ADD_ONS_CHECK_SCRIPT, folder).status === 0;
}
function prepareAddOnsFolder(folder = addOnsFolder()) {
  if (isAddOnsFolderReady(folder)) return;
  const overridden = !!process.env["UA_ADDONS_FOLDER"];
  if (process.platform !== "win32" || overridden) {
    try {
      mkdirSync(folder, { recursive: true });
    } catch {
    }
    if (isAddOnsFolderReady(folder)) return;
  }
  if (process.platform !== "darwin" && process.platform !== "win32" || overridden) {
    throw new Error(`cannot write the Add Ons folder ${folder}`);
  }
  if (process.platform === "darwin") {
    console.log("Setting up the LUNA Add Ons folder for every user on this Mac (one time; asks for an administrator password)...");
    const result = spawnSync("/usr/bin/osascript", ["-e", ADD_ONS_SETUP_SCRIPT, folder], { encoding: "utf8" });
    if (result.status !== 0) {
      const detail = (result.stderr ?? "").trim() || (result.error?.message ?? "osascript failed");
      throw new Error(detail.includes("(-128)") ? "Setting up the Add Ons folder was cancelled" : `could not set up ${folder}: ${detail}`);
    }
  } else {
    console.log("Setting up the LUNA Add Ons folder for every user on this PC (one time; asks for administrator approval)...");
    const result = runAddOnsFolderScript(WINDOWS_ADD_ONS_SETUP_SCRIPT, folder);
    if (result.status === 1223) throw new Error("Setting up the Add Ons folder was cancelled");
    if (result.status !== 0) {
      const detail = (result.stderr ?? "").trim() || (result.error?.message ?? `exit ${result.status}`);
      throw new Error(`could not set up ${folder}: ${detail}`);
    }
  }
  if (!isAddOnsFolderReady(folder)) throw new Error(`${folder} is still not writable after setup`);
}
function isDescription(d) {
  return typeof d === "string" || Array.isArray(d) && d.every((s) => typeof s === "string");
}
function isWindow(target) {
  return target === void 0 || target === "window";
}
function menuFor(target) {
  if (target === "app" || target === "page") return "Add Ons > Apps";
  if (target === "browser") return "Add Ons > Browsers";
  if (target === "editor") return "Add Ons > Editors";
  return "Add Ons > Windows";
}
function entryName(e) {
  if (e.name !== void 0) return typeof e.name === "string" ? e.name : void 0;
  return typeof e.title === "string" ? e.title : void 0;
}
function installedAddOns(folder) {
  let root;
  try {
    root = folder ?? addOnsFolder();
  } catch {
    return [];
  }
  if (!existsSync(root)) return [];
  const out = [];
  for (const name of readdirSync(root)) {
    const entry = join(root, name);
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(join(entry, "manifest.json"), "utf8"));
    } catch {
      continue;
    }
    const entries = "add_ons" in manifest ? Array.isArray(manifest.add_ons) ? manifest.add_ons : [] : [manifest];
    for (const e of entries) {
      const name2 = e ? entryName(e) : void 0;
      if (typeof e?.id === "string" && name2 !== void 0) out.push({ id: e.id, name: name2, entry });
    }
  }
  return out;
}
function addOnClashes(wanted, installed, except = []) {
  const nameKey = (t) => t.trim().toLowerCase();
  const skip = new Set(except.map((p) => resolve(p)));
  const problems = [];
  for (const w of wanted) {
    for (const i of installed) {
      if (skip.has(resolve(i.entry))) continue;
      if (i.id.toLowerCase() === w.id.toLowerCase()) problems.push(`id "${w.id}" is already used by "${i.name}" in ${i.entry}`);
      else if (nameKey(i.name) === nameKey(w.name)) problems.push(`name "${w.name}" is already used by ${i.id} in ${i.entry}`);
    }
  }
  return problems;
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
  if (Array.isArray(manifest.add_ons) && manifest.manufacturer !== void 0 && typeof manifest.manufacturer !== "string") {
    problems.push('top level: "manufacturer" must be a string');
  }
  if (Array.isArray(manifest.add_ons) && manifest.description !== void 0 && !isDescription(manifest.description)) {
    problems.push('top level: "description" must be a string or an array of strings');
  }
  for (const [i, e] of entries.entries()) {
    const where = `entry ${i} (${e.id ?? "no id"})`;
    if (typeof e.id !== "string" || !e.id) problems.push(`${where}: "id" must be a non-empty string`);
    else if (e.id !== e.id.toLowerCase()) console.warn(`manifest.json ${where}: LUNA reads "id" as "${e.id.toLowerCase()}"; write it in lowercase`);
    const nameKey = e.name === void 0 ? "title" : "name";
    if (nameKey === "title") {
      if (typeof e.title === "string") e.name = e.title;
    } else if (e.title !== void 0 && e.title !== e.name) {
      console.warn(`manifest.json ${where}: "title" differs from "name"; LUNA shows "name" but older LUNA releases show "title". Make them match`);
    }
    if (typeof e.name !== "string" || !e.name) problems.push(`${where}: "${nameKey}" must be a non-empty string`);
    for (const k of ["width", "height"]) {
      if (e[k] === void 0 ? isWindow(e.target) : typeof e[k] !== "number") problems.push(`${where}: "${k}" must be a number${isWindow(e.target) ? "" : " when present"}`);
    }
    if ((e.html ? 1 : 0) + (e.url ? 1 : 0) !== 1) problems.push(`${where}: exactly one of "html" or "url" is required`);
    if (e.html && !existsSync(join(dir, e.html))) problems.push(`${where}: html file not found: ${e.html}`);
    if (e.target !== void 0 && !["window", "app", "page", "browser", "editor"].includes(e.target)) problems.push(`${where}: unknown target "${e.target}"`);
    for (const k of ["floating", "show_with_session", "fixed_size", "run_hidden", "unload_on_close"]) if (e[k] !== void 0 && typeof e[k] !== "boolean") problems.push(`${where}: "${k}" must be true or false`);
    if (e.manufacturer !== void 0 && typeof e.manufacturer !== "string") problems.push(`${where}: "manufacturer" must be a string`);
    if (e.description !== void 0 && !isDescription(e.description)) problems.push(`${where}: "description" must be a string or an array of strings`);
  }
  if (problems.length) throw new Error(`manifest.json problems:
  - ${problems.join("\n  - ")}`);
  return { manifest, entries };
}
function usage() {
  return `ua-builder ${sdkVersion()} \u2014 build LUNA Add Ons

  ua-builder new <name> [--id com.x.y] [--name "Name"] [--manufacturer "Name"] [--description "Text"] [--target window|app|browser|editor]
                        [--no-floating] [--show-with-session] [--width 900 --height 600]
                        [--template add-on-basic|add-on-typescript] [--dir path]
  ua-builder serve [dir] [--port 8790] [--host 0.0.0.0] [--luna [--forward-port 4719]]
  ua-builder test [dir] [--live]
  ua-builder probe <url> [--expr <js>] [--wait <js>] [--timeout <ms>]   read a served page's live DOM
  ua-builder install [dir] [--name "Link Name"]
  ua-builder pack [dir] [--out Name.lunaaddon] [--source-maps]
  ua-builder doctor
  ua-builder tree [path] [--levels 1] [--out tree.json]   the shape of LUNA's tree (read-only)

Docs: docs/QUICKSTART.md, docs/MANIFEST.md in the @uaudio/luna-builder-sdk package.`;
}

// cli/doctor.ts
function probe(port, host = "127.0.0.1", timeoutMs = 800) {
  return new Promise((resolve7) => {
    const s = connect(port, host);
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
  let npm = "";
  try {
    npm = (process.platform === "win32" ? execFileSync("npm --version", { encoding: "utf8", shell: true, stdio: ["ignore", "pipe", "ignore"] }) : execFileSync("npm", ["--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })).trim();
  } catch {
  }
  const npmNote = npm && Number(npm.split(".")[0]) < 11 && !existsSync2(join2(process.cwd(), ".npmrc")) ? "  (npm 10 needs legacy-peer-deps=true in the Add On's .npmrc to npm install it; or use Node.js 24)" : "";
  rows.push(["npm", npm ? npm + npmNote : "not found"]);
  rows.push(["SDK bundle", bundlePath() ?? "missing: run npm run build"]);
  if (process.platform !== "win32") {
    const bin = join2(process.cwd(), "node_modules", ".bin", "ua-builder");
    if (existsSync2(bin)) {
      const target = realpathSync(bin);
      const state = ensureExecutable(target);
      rows.push(["project CLI", state === "ok" ? `${target} (executable)` : state === "fixed" ? `${target} (executable bit restored)` : `${target} is NOT executable and read-only; run: chmod +x "${target}"`]);
    }
  }
  const luna = await probe(4718);
  rows.push(["LUNA engine :4718", luna ? "listening" : "not listening (is LUNA running?)"]);
  try {
    const folder = addOnsFolder();
    const setup = process.platform === "win32" ? " `ua-builder install` or LUNA sets it up for every user, asking once for administrator approval" : " `ua-builder install` sets it up for every user, asking once for an administrator password";
    const canSetUp = (process.platform === "darwin" || process.platform === "win32") && !process.env["UA_ADDONS_FOLDER"];
    const shared = process.platform === "win32" && !process.env["UA_ADDONS_FOLDER"];
    let note = "";
    if (!existsSync2(folder)) {
      try {
        if (shared) throw new Error("not created without the setup");
        mkdirSync2(folder, { recursive: true });
        note = " (created)";
      } catch {
        note = canSetUp ? ` (missing;${setup})` : " (could not create it)";
      }
    } else if (!canWriteFolder(folder)) {
      note = canSetUp ? ` (not writable;${setup})` : " (not writable)";
    } else if (!isAddOnsFolderReady(folder)) {
      note = ` (writable by you only, not set up for every user;${setup})`;
    }
    rows.push(["Add Ons folder", `${folder}${note}`]);
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
import { cpSync, existsSync as existsSync3, lstatSync, readlinkSync, realpathSync as realpathSync2, rmSync, symlinkSync } from "fs";
import { basename, join as join3, resolve as resolve2 } from "path";
async function install(args) {
  const dir = resolve2(args.positional[0] ?? process.cwd());
  const { manifest, entries } = readManifest(dir);
  const name = flagString(args, "name") ?? (typeof manifest.package_name === "string" && manifest.package_name.trim() ? manifest.package_name.trim() : basename(dir));
  if (/[\\/]/.test(name) || name === "." || name === "..") throw new Error(`invalid link name "${name}"`);
  const folder = addOnsFolder();
  prepareAddOnsFolder(folder);
  const target = join3(folder, name);
  const installed = installedAddOns(folder);
  const own = installed.filter((a) => a.entry === target || sameFolder(a.entry, dir)).map((a) => a.entry);
  const clashes = addOnClashes(entries, installed, own);
  if (clashes.length) throw new Error(`An installed Add On already uses this identity:
  - ${clashes.join("\n  - ")}
Change "id" or "name" in manifest.json, or remove the other Add On.`);
  if (existsSync3(target) || isDanglingLink(target)) {
    const st = lstatSync(target);
    if (st.isSymbolicLink()) {
      const current = readlinkSync(target);
      if (resolve2(current) === dir) {
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
function sameFolder(a, b) {
  try {
    return realpathSync2(a) === realpathSync2(b);
  } catch {
    return false;
  }
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
  for (const e of entries) console.log(`  ${e.name}  (${e.id})  under ${menuFor(e.target)}`);
  return 0;
}

// cli/new.ts
import { cpSync as cpSync2, existsSync as existsSync4, mkdirSync as mkdirSync3, readFileSync as readFileSync2, readdirSync as readdirSync2, statSync as statSync2, writeFileSync as writeFileSync2 } from "fs";
import { isAbsolute, join as join4, relative, resolve as resolve3, sep } from "path";
var DOTFILES = { npmrc: ".npmrc", gitignore: ".gitignore" };
var WINDOW_ONLY_FIELDS = ["floating", "show_with_session", "fixed_size", "width", "height"];
function withoutFields(manifest, fields) {
  const kept = manifest.split("\n").filter((line) => !fields.some((f) => line.trimStart().startsWith(`"${f}":`)));
  return kept.join("\n").replace(/,(\s*\})\s*$/, "$1\n");
}
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function titleCase(name) {
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function walk(dir) {
  const out = [];
  for (const entry of readdirSync2(dir)) {
    const p = join4(dir, entry);
    if (statSync2(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
function builderPath(dir) {
  const rel = relative(dir, packageRoot());
  return isAbsolute(rel) ? packageRoot() : rel.split(sep).join("/");
}
function vendorBundle(target) {
  const src = bundlePath();
  if (!src) throw new Error(`No SDK bundle under ${packageRoot()}. Run "npm run build" in the builder package.`);
  mkdirSync3(join4(target, "vendor"), { recursive: true });
  cpSync2(src, join4(target, "vendor", "luna.global.js"));
  if (existsSync4(`${src}.map`)) cpSync2(`${src}.map`, join4(target, "vendor", "luna.global.js.map"));
}
async function newAddOn(args) {
  const name = args.positional[0];
  if (!name) {
    console.error('usage: ua-builder new <name> [--id com.x.y] [--name "Name"] [--manufacturer "Name"] [--description "Text"] [--target window|app|browser|editor] [--no-floating] [--show-with-session] [--width N --height N] [--template add-on-basic|add-on-typescript] [--dir path]\n  --no-floating, --show-with-session, --width and --height apply to --target window only');
    return 2;
  }
  const dir = resolve3(flagString(args, "dir") ?? process.cwd(), name);
  if (existsSync4(dir)) {
    console.error(`${dir} already exists`);
    return 1;
  }
  const target = flagString(args, "target") ?? "window";
  if (!["window", "app", "browser", "editor"].includes(target)) {
    console.error(`unknown --target "${target}"; use window, app, browser or editor`);
    return 2;
  }
  const templates = join4(packageRoot(), "templates");
  const template = join4(templates, flagString(args, "template") ?? "add-on-basic");
  if (!existsSync4(template)) {
    console.error(`template not found: ${template}
available: ${readdirSync2(templates).filter((t) => !t.startsWith(".")).join(", ")}`);
    return 1;
  }
  const typescript = existsSync4(join4(template, "tsconfig.json"));
  const id = flagString(args, "id") ?? `com.example.${slug(name)}`;
  const displayName = flagString(args, "name") ?? flagString(args, "title") ?? titleCase(name);
  const manufacturer = flagString(args, "manufacturer");
  const description = flagString(args, "description");
  const clashes = addOnClashes([{ id, name: displayName }], installedAddOns());
  if (clashes.length) {
    console.error(`An installed Add On already uses this identity:
  - ${clashes.join("\n  - ")}
Pick another with --id com.x.y and/or --name "Name".`);
    return 1;
  }
  const replacements = {
    __NAME__: name,
    __SLUG__: slug(name),
    __ID__: id,
    __TITLE__: displayName,
    __MANUFACTURER__: JSON.stringify(manufacturer ?? "").slice(1, -1),
    __DESCRIPTION__: JSON.stringify(description ?? "").slice(1, -1),
    __TARGET__: target,
    __FLOATING__: String(!args.flags["no-floating"]),
    __SHOW_WITH_SESSION__: String(!!args.flags["show-with-session"]),
    __WIDTH__: String(flagNumber(args, "width", 900)),
    __HEIGHT__: String(flagNumber(args, "height", 600)),
    __SDK_VERSION__: sdkVersion(),
    __BUILDER_PATH__: builderPath(dir)
  };
  for (const file of walk(template)) {
    const rel = file.slice(template.length + 1);
    const dest = join4(dir, DOTFILES[rel] ?? rel);
    mkdirSync3(join4(dest, ".."), { recursive: true });
    let text = readFileSync2(file, "utf8");
    for (const [k, v] of Object.entries(replacements)) text = text.replaceAll(k, v);
    if (rel === "manifest.json") {
      const omit = [...isWindow(target) ? [] : WINDOW_ONLY_FIELDS, ...manufacturer ? [] : ["manufacturer"], ...description ? [] : ["description"]];
      if (omit.length) text = withoutFields(text, omit);
    }
    writeFileSync2(dest, text);
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

// cli/pack.ts
import { existsSync as existsSync5, readdirSync as readdirSync3, readFileSync as readFileSync3, realpathSync as realpathSync3, rmSync as rmSync2, statSync as statSync3, writeFileSync as writeFileSync3 } from "fs";
import { basename as basename2, join as join5, posix, resolve as resolve4, sep as sep2 } from "path";

// cli/zip.ts
import { deflateRawSync } from "zlib";
var CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(data) {
  let c = 4294967295;
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 255] ^ c >>> 8;
  return (c ^ 4294967295) >>> 0;
}
function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: date.getHours() << 11 | date.getMinutes() << 5 | date.getSeconds() >> 1,
    date: year - 1980 << 9 | date.getMonth() + 1 << 5 | date.getDate()
  };
}
var UTF8_NAMES = 2048;
var MADE_BY_UNIX = 3 << 8 | 20;
var VERSION_NEEDED = 20;
var MAX_32 = 4294967295;
function createZip(entries) {
  if (entries.length > 65535) throw new Error(`zip: ${entries.length} entries is more than a zip without zip64 holds`);
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const raw = entry.data ?? Buffer.alloc(0);
    const deflated = raw.length ? deflateRawSync(raw, { level: 9 }) : raw;
    const method = deflated.length < raw.length ? 8 : 0;
    const body = method === 8 ? deflated : raw;
    if (raw.length > MAX_32 || offset > MAX_32) throw new Error(`zip: ${entry.name} does not fit in a zip without zip64`);
    const crc = crc32(raw);
    const { time, date } = dosDateTime(entry.mtime);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(67324752, 0);
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
    const isFolder = entry.name.endsWith("/");
    const header = Buffer.alloc(46);
    header.writeUInt32LE(33639248, 0);
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
    header.writeUInt32LE(((entry.mode & 65535) << 16 | (isFolder ? 16 : 0)) >>> 0, 38);
    header.writeUInt32LE(offset, 42);
    chunks.push(local, name, body);
    central.push(header, name);
    offset += local.length + name.length + body.length;
  }
  const centralSize = central.reduce((n, b) => n + b.length, 0);
  if (offset > MAX_32) throw new Error("zip: archive does not fit in a zip without zip64");
  const end = Buffer.alloc(22);
  end.writeUInt32LE(101010256, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, ...central, end]);
}

// cli/pack.ts
function isExcluded(name) {
  return name === "node_modules" || name === ".git" || name === "tests" || name === "package-lock.json" || name.startsWith("vitest.config.") || name.endsWith(".zip") || name.endsWith(".lunaaddon");
}
var BUILD_CONFIG = /^(tsconfig(\..+)?\.json|(vite|rollup|webpack|esbuild|rspack)\.config\.[cm]?[jt]s)$/;
function hasBuildStep(dir) {
  return readdirSync3(dir).some((name) => BUILD_CONFIG.test(name));
}
function isBuildOnly(name, { isRoot = false, buildStep = false, keepMaps = false } = {}) {
  if (/\.([cm]?ts|tsx|jsx)$/.test(name)) return true;
  if (!keepMaps && name.endsWith(".map")) return true;
  return isRoot && (BUILD_CONFIG.test(name) || buildStep && name === "src");
}
var OS_JUNK = /* @__PURE__ */ new Set(["thumbs.db", "ehthumbs.db", "ehthumbs_vista.db", "desktop.ini"]);
function isJunk(name) {
  return name.startsWith(".") || name === "Icon\r" || OS_JUNK.has(name.toLowerCase());
}
function collect(dir, top, keepMaps) {
  const entries = [];
  const buildOnly = [];
  const visited = /* @__PURE__ */ new Set();
  const buildStep = hasBuildStep(dir);
  let skipped = 0;
  const walk2 = (folder, prefix, isRoot) => {
    const real = realpathSync3(folder);
    if (visited.has(real)) return;
    visited.add(real);
    const stat = statSync3(folder);
    const at = entries.length;
    entries.push({ name: `${prefix}/`, mtime: stat.mtime, mode: 16877 });
    for (const name of readdirSync3(folder).sort()) {
      if (isRoot && isExcluded(name)) continue;
      if (isJunk(name)) {
        skipped++;
        continue;
      }
      if (isBuildOnly(name, { isRoot, buildStep, keepMaps })) {
        buildOnly.push(`${prefix}/${name}`.slice(top.length + 1));
        continue;
      }
      const path = join5(folder, name);
      let entryStat;
      try {
        entryStat = statSync3(path);
      } catch {
        continue;
      }
      if (entryStat.isDirectory()) walk2(path, `${prefix}/${name}`, false);
      else if (entryStat.isFile()) {
        entries.push({ name: `${prefix}/${name}`, data: readFileSync3(path), mtime: entryStat.mtime, mode: 32768 | entryStat.mode & 511 });
      }
    }
    if (!isRoot && entries.length === at + 1) entries.pop();
  };
  walk2(dir, top, true);
  return { entries, skipped, buildOnly };
}
function checkPageReferences(dir, pages, packed) {
  const errors = [];
  const warnings = [];
  for (const page of new Set(pages)) {
    const html = page.split(/[?#]/)[0];
    const path = join5(dir, html);
    if (!existsSync5(path)) continue;
    const text = readFileSync3(path, "utf8").replace(/<!--[\s\S]*?-->/g, "");
    for (const [tag] of text.matchAll(/<(script|link)\b[^>]*>/gi)) {
      if (/^<script/i.test(tag) && /\stype\s*=\s*["']?module\b/i.test(tag)) {
        warnings.push(`${html}: ${tag} is a module script, which LUNA on Windows will not run (it loads Add Ons from file://). Bundle to a classic script instead.`);
      }
      const ref = /\s(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
      const url = ref?.[1] ?? ref?.[2];
      if (!url || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) continue;
      const rel = posix.normalize(posix.join(posix.dirname(html.split(sep2).join("/")), decodeURI(url.split(/[?#]/)[0])));
      if (packed.has(rel)) continue;
      errors.push(
        existsSync5(join5(dir, rel)) ? `${html} loads ${url}, which the pack leaves out (a source, source map or build file). Load the built file instead.` : `${html} loads ${url}, which does not exist.${rel.startsWith("dist/") ? " Run the build first (npm run build)." : ""}`
      );
    }
  }
  return { errors, warnings };
}
async function pack(args) {
  const dir = resolve4(args.positional[0] ?? process.cwd());
  const { entries: addOns } = readManifest(dir);
  if (existsSync5(join5(dir, "vendor", "luna.global.js")) && !args.flags["no-vendor"]) {
    vendorBundle(dir);
    console.log("Refreshed vendor/luna.global.js");
  }
  let out = resolve4(flagString(args, "out") ?? `${basename2(dir)}.lunaaddon`);
  if (!out.endsWith(".lunaaddon")) out += ".lunaaddon";
  const top = basename2(dir);
  const { entries, skipped, buildOnly } = collect(dir, top, !!args.flags["source-maps"]);
  const packed = new Set(entries.filter((e) => e.data).map((e) => e.name.slice(top.length + 1)));
  const pages = addOns.flatMap((a) => a.html ? [a.html] : []);
  const { errors, warnings } = checkPageReferences(dir, pages, packed);
  for (const w of warnings) console.warn(`warning: ${w}`);
  if (errors.length) {
    console.error(`Not packed; the Add On would not load:
  - ${errors.join("\n  - ")}`);
    return 1;
  }
  rmSync2(out, { recursive: true, force: true });
  writeFileSync3(out, createZip(entries));
  console.log(`Packed ${addOns.length} Add On(s) -> ${out}`);
  if (skipped) console.log(`Left out ${skipped} dotfile(s) and OS metadata file(s)`);
  if (buildOnly.length) {
    const shown = buildOnly.slice(0, 6).join(", ") + (buildOnly.length > 6 ? `, and ${buildOnly.length - 6} more` : "");
    console.log(`Left out sources, source maps and build configs: ${shown}${args.flags["source-maps"] ? "" : " (--source-maps keeps the maps)"}`);
  }
  console.log(`Install by opening it in LUNA (double-click it), or run: ua-builder install ${basename2(dir)}`);
  return 0;
}

// cli/probe.ts
import { spawn } from "child_process";
import { existsSync as existsSync6, mkdtempSync, readFileSync as readFileSync4, rmSync as rmSync3, writeFileSync as writeFileSync4 } from "fs";
import { tmpdir } from "os";
import { join as join6 } from "path";
var DEFAULT_WAIT = `(async () => {
  if (typeof Luna === 'undefined') return true;
  if (typeof Luna.clients !== 'function') return 'no-clients-hook';
  const client = Luna.clients().find((c) => c.connected);
  if (!client) return false;
  try {
    const session = await client.session();
    await session.ready();
  } catch {
    /* no session open: the page is as bound as it will get */
  }
  await client.settled();
  return true;
})()`;
var LOADED_GATE = "location.href !== 'about:blank' && document.readyState === 'complete'";
var DEFAULT_EXPR = "document.body.innerText";
var PAINTED = "new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))";
var FILE_HELPERS = `(() => {
  const wav = (seconds = 0.25, rate = 48000) => {
    const n = Math.round(seconds * rate);
    const view = new DataView(new ArrayBuffer(44 + n * 2));
    const tag = (at, s) => { for (let i = 0; i < 4; i++) view.setUint8(at + i, s.charCodeAt(i)); };
    tag(0, 'RIFF'); view.setUint32(4, 36 + n * 2, true); tag(8, 'WAVE'); tag(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); tag(36, 'data'); view.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) view.setInt16(44 + i * 2, Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8000), true);
    return view.buffer;
  };
  const toFile = (f) => {
    if (f instanceof File) return f;
    const spec = typeof f === 'string' ? { name: f } : f;
    const isWav = /.wav$/i.test(spec.name);
    const body = spec.text !== undefined ? spec.text : spec.size !== undefined ? new Uint8Array(spec.size) : isWav ? wav() : '';
    return new File([body], spec.name, { type: spec.type ?? (isWav ? 'audio/wav' : '') });
  };
  const transfer = (files) => {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(toFile(f));
    return dt;
  };
  const element = (target) => (typeof target === 'string' ? document.querySelector(target) : target ?? document.body);
  globalThis.LunaProbe = Object.assign(globalThis.LunaProbe ?? {}, {
    wav,
    async dropFiles(files, target) {
      const el = element(target);
      if (!el) throw new Error('LunaProbe.dropFiles: no element ' + target);
      const dataTransfer = transfer(files);
      const fire = (type) => el.dispatchEvent(new DragEvent(type, { dataTransfer, bubbles: true, cancelable: true }));
      fire('dragenter');
      fire('dragover');
      return !fire('drop');
    },
    async chooseFiles(selector, files) {
      const input = document.querySelector(selector);
      if (!input) throw new Error('LunaProbe.chooseFiles: no element ' + selector);
      input.files = transfer(files).files;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return input.files.length > 0;
    },
  });
})();`;
var FAKE_LUNA_BRIDGE = `(() => {
  let accepts = false;
  globalThis.lunaAPI = { setAcceptsFileDrops: (b) => { accepts = !!b; } };
  const probe = (globalThis.LunaProbe ??= {});
  Object.defineProperty(probe, 'acceptsPathDrops', { get: () => accepts, configurable: true });
  Object.assign(probe, {
    dropPaths(paths, x = 0, y = 0) {
      if (!accepts) return false;
      const call = (method, arg) => {
        const host = globalThis.lunaHost;
        if (host && typeof host[method] === 'function') host[method](arg);
      };
      const info = { paths, x: Math.round(x), y: Math.round(y) };
      call('fileDragEnter', info);
      call('fileDragOver', info);
      call('filesDropped', info);
      return true;
    },
  });
})();`;
function mockUrl(url) {
  const u = new URL(url);
  u.searchParams.set("engine", "mock");
  return u.toString();
}
async function probe2(args) {
  const url = args.positional[0];
  if (!url) {
    console.error("usage: ua-builder probe <url> [--expr <js>] [--wait <js>] [--settle <ms>] [--timeout <ms>] [--mock [setup.js]] [--luna-bridge] [--screenshot <file.png>] [--chrome <path>]");
    return 2;
  }
  const mock = args.flags["mock"];
  const mockSetup = typeof mock === "string" ? mock : void 0;
  if (mockSetup !== void 0 && !existsSync6(mockSetup)) {
    console.error(`probe: no mock setup file ${mockSetup} (it should assign globalThis.LunaMockSetup = (engine) => { ... })`);
    return 2;
  }
  const screenshot = flagString(args, "screenshot");
  if (args.flags["screenshot"] === true) {
    console.error("probe: --screenshot needs a file name, for example --screenshot page.png");
    return 2;
  }
  const target = mock ? mockUrl(url) : url;
  const expr = flagString(args, "expr") ?? DEFAULT_EXPR;
  const wait = flagString(args, "wait") ?? DEFAULT_WAIT;
  const timeoutMs = flagNumber(args, "timeout", 2e4);
  const chrome = flagString(args, "chrome") ?? findChrome();
  if (!chrome) {
    console.error("no Chrome found: pass --chrome <path> or set UA_CHROME");
    return 1;
  }
  const profile = mkdtempSync(join6(tmpdir(), "ua-probe-"));
  const browser = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--autoplay-policy=no-user-gesture-required", `--user-data-dir=${profile}`, "--remote-debugging-port=0", "about:blank"], { stdio: "ignore" });
  try {
    const cdpPort = await devtoolsPort(profile, timeoutMs);
    const tab = await (await fetch(`http://127.0.0.1:${cdpPort}/json/new?about:blank`, { method: "PUT" })).json();
    const page = await openPage(tab.webSocketDebuggerUrl);
    try {
      await page.send("Page.enable");
      await page.send("Page.addScriptToEvaluateOnNewDocument", { source: FILE_HELPERS });
      if (args.flags["luna-bridge"]) await page.send("Page.addScriptToEvaluateOnNewDocument", { source: FAKE_LUNA_BRIDGE });
      if (mockSetup !== void 0) await page.send("Page.addScriptToEvaluateOnNewDocument", { source: readFileSync4(mockSetup, "utf8") });
      await page.send("Page.navigate", { url: target });
      const started = Date.now();
      const timedOut = async (condition) => {
        console.error(`probe: timed out after ${timeoutMs} ms waiting for: ${condition}`);
        console.error(`page shows: ${JSON.stringify(await page.evalJson("document.body.innerText"))}`);
        for (const e of page.errors) console.error("page error:", String(e).slice(0, 300));
        return 1;
      };
      while (!await page.evalJson(LOADED_GATE)) {
        if (Date.now() - started >= timeoutMs) return await timedOut(`the page to load (${LOADED_GATE})`);
        await sleep(100);
      }
      for (; ; ) {
        const verdict = await page.evalJson(wait);
        if (verdict === "no-clients-hook") {
          console.error("probe: this page's vendored SDK predates Luna.clients(), so the probe cannot wait for its connection \u2014 refresh the bundle (ua-builder pack) or pass --wait <js>; reading after the settle period only");
          break;
        }
        if (verdict) break;
        if (Date.now() - started >= timeoutMs) return await timedOut(wait === DEFAULT_WAIT ? "a connected Luna client with its session ready (the default wait; --wait <js> overrides)" : wait);
        await sleep(100);
      }
      const settleMs = flagNumber(args, "settle", 250);
      if (settleMs > 0) {
        const settleDeadline = Date.now() + Math.min(3e3, Math.max(0, timeoutMs - (Date.now() - started)));
        let last;
        for (; ; ) {
          const dom = await page.evalJson("document.body.innerHTML");
          if (dom === last || Date.now() >= settleDeadline) break;
          last = dom;
          await sleep(settleMs);
        }
      }
      if (screenshot !== void 0) {
        await page.evaluate(PAINTED);
        const shot = await page.send("Page.captureScreenshot", { format: "png" });
        if (!shot.result?.data) {
          console.error("probe: Chrome returned no screenshot");
          return 1;
        }
        writeFileSync4(screenshot, Buffer.from(shot.result.data, "base64"));
        console.error(`probe: wrote ${screenshot}`);
      }
      const result = await page.evaluate(expr);
      if (result.exceptionDetails) {
        console.error(`probe: expression threw: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
        return 1;
      }
      console.log(JSON.stringify(result.result?.value, null, 2));
      for (const e of page.errors) console.error("page error:", String(e).slice(0, 300));
      return 0;
    } finally {
      page.close();
    }
  } finally {
    const exited = new Promise((r) => browser.once("exit", r));
    browser.kill();
    await Promise.race([exited, sleep(3e3)]);
    try {
      rmSync3(profile, { recursive: true, force: true });
    } catch {
    }
  }
}
function findChrome() {
  const candidates = [
    process.env["UA_CHROME"],
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  ].filter((c) => typeof c === "string" && c.length > 0);
  return candidates.find((c) => existsSync6(c));
}
async function devtoolsPort(profile, timeoutMs) {
  const file = join6(profile, "DevToolsActivePort");
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (existsSync6(file)) {
      const port = Number(readFileSync4(file, "utf8").split("\n")[0]);
      if (Number.isFinite(port) && port > 0) return port;
    }
    await sleep(100);
  }
  throw new Error("probe: Chrome did not open its DevTools port");
}
async function openPage(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = /* @__PURE__ */ new Map();
  const errors = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(String(e.data));
    if (m.id !== void 0 && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    } else if (m.method === "Runtime.exceptionThrown") errors.push(m.params?.exceptionDetails?.exception?.description ?? "exception");
  };
  const send2 = (method, params = {}) => new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  await send2("Runtime.enable");
  const evaluate = async (expr) => (await send2("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result ?? {};
  return {
    send: send2,
    evaluate,
    evalJson: async (expr) => (await evaluate(expr)).result?.value,
    errors,
    close: () => ws.close()
  };
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// cli/serve.ts
import { createReadStream, existsSync as existsSync7, statSync as statSync4 } from "fs";
import { createServer as createHttpServer } from "http";
import { connect as connect2, createServer as createTcpServer } from "net";
import { networkInterfaces } from "os";
import { extname, join as join7, normalize, resolve as resolve5, sep as sep3 } from "path";
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
  const dir = resolve5(args.positional[0] ?? process.cwd());
  const wantedPort = flagNumber(args, "port", 8790);
  const portExplicit = args.flags["port"] !== void 0;
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
    if (existsSync7(target) && statSync4(target).isDirectory()) target = join7(target, "index.html");
    if (!existsSync7(target) || statSync4(target).isDirectory()) return send(res, 404, `not found: ${pathname}`);
    res.writeHead(200, {
      "Content-Type": MIME[extname(target).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "no-store",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin"
    });
    createReadStream(target).pipe(res);
  });
  let port;
  try {
    port = await listenWithFallback(server, wantedPort, host, portExplicit);
  } catch (err) {
    if (err.code !== "EADDRINUSE") throw err;
    console.error(`port ${wantedPort} is already in use \u2014 a stale 'ua-builder serve' from another session?`);
    console.error(`find it with: lsof -i :${wantedPort}   (or pick another with --port <n>)`);
    return 1;
  }
  if (port !== wantedPort) console.error(`port ${wantedPort} is busy (a stale 'ua-builder serve'?); using ${port} instead`);
  const lines = [`Serving ${dir}`, `  http://localhost:${port}/`];
  if (engineDir) lines.push(`  http://localhost:${port}/__engine/devicedwasm.js   (wasm engine from ${engineDir})`);
  if (args.flags["luna"]) {
    const forwardPort = flagNumber(args, "forward-port", 4719);
    const lunaPort = flagNumber(args, "luna-port", 4718);
    const proxy = createTcpServer((socket) => {
      const upstream = connect2(lunaPort, "127.0.0.1");
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
  lines.push("", "Ctrl-C to stop.");
  console.log(lines.join("\n"));
  await new Promise(() => void 0);
  return 0;
}
async function listenWithFallback(server, port, host, explicit) {
  const tries = explicit ? 1 : 20;
  for (let i = 0; ; i++) {
    try {
      await new Promise((resolveListen, reject) => {
        const onError = (err) => reject(err);
        server.once("error", onError);
        server.listen(port + i, host, () => {
          server.removeListener("error", onError);
          resolveListen();
        });
      });
      return port + i;
    } catch (err) {
      if (err.code !== "EADDRINUSE" || i + 1 >= tries) throw err;
    }
  }
}
function safeJoin(base, pathname) {
  const full = normalize(join7(base, pathname));
  const baseNorm = normalize(base + sep3);
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
  for (const rel of ["../../../hbsystem/wasm_engine/dist/Release", "../../../hbsystem/wasm_engine/dist/Debug"]) candidates.push(resolve5(root, rel));
  for (const c of candidates) {
    const dir = resolve5(c);
    if (existsSync7(join7(dir, "devicedwasm.js"))) return dir;
    if (existsSync7(join7(dir, "Release", "devicedwasm.js"))) return join7(dir, "Release");
  }
  return void 0;
}

// cli/test.ts
import { spawnSync as spawnSync2 } from "child_process";
import { existsSync as existsSync8, readFileSync as readFileSync5 } from "fs";
import { createRequire } from "module";
import { dirname as dirname2, join as join8, resolve as resolve6 } from "path";
async function test(args) {
  const dir = resolve6(args.positional[0] ?? process.cwd());
  if (!existsSync8(join8(dir, "package.json"))) throw new Error(`no package.json in ${dir}; run "npm install" in the Add On folder first`);
  const env = { ...process.env, ...args.flags["live"] ? { UA_LIVE: "1" } : {} };
  let vitest;
  try {
    const pkg = createRequire(join8(dir, "package.json")).resolve("vitest/package.json");
    const { bin } = JSON.parse(readFileSync5(pkg, "utf8"));
    vitest = join8(dirname2(pkg), typeof bin === "string" ? bin : bin["vitest"]);
  } catch {
    throw new Error(`vitest is not installed in ${dir}; run "npm install" in the Add On folder first`);
  }
  const result = spawnSync2(process.execPath, [vitest, "run"], { cwd: dir, stdio: "inherit", env });
  return result.status ?? 1;
}

// cli/tree.ts
import { writeFileSync as writeFileSync5 } from "fs";

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
    super("not_running", `No LUNA engine at ${url}. Start LUNA and open a session.`);
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
   * attempt fails, or has not opened within `requestTimeoutMs`; later drops are handled by
   * reconnect instead.
   */
  open() {
    if (this.closed) return Promise.reject(new ConnectionLost());
    if (this.status === "connected") return Promise.resolve();
    return new Promise((resolve7, reject) => {
      let settled = false;
      const socket = new this.Socket(this.url);
      this.socket = socket;
      this.setStatus("connecting");
      const openTimer = setTimeout(() => {
        if (this.socket !== socket || settled) return;
        this.log("warn", `no answer from ${this.url} within ${this.requestTimeoutMs} ms`, { url: this.url, timeoutMs: this.requestTimeoutMs });
        dropped();
      }, this.requestTimeoutMs);
      unref(openTimer);
      const dropped = () => {
        clearTimeout(openTimer);
        if (this.socket !== socket) return;
        this.socket = void 0;
        socket.onopen = socket.onerror = socket.onclose = socket.onmessage = null;
        try {
          if (socket.readyState !== 3) socket.close();
        } catch {
        }
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
      socket.onopen = () => {
        clearTimeout(openTimer);
        settled = true;
        this.everConnected = true;
        this.reconnectDelay = this.reconnectMinMs;
        this.setStatus("connected");
        this.resubscribeAll();
        this.startHeartbeat();
        resolve7();
      };
      socket.onmessage = (ev) => this.handleFrame(ev.data);
      socket.onerror = dropped;
      socket.onclose = dropped;
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
      writeFileSync5(out, text);
      console.log(`wrote ${out}`);
    } else process.stdout.write(text);
    return 0;
  } finally {
    await port.close();
  }
}

// cli/index.ts
import { fileURLToPath as fileURLToPath2 } from "url";
async function main() {
  try {
    ensureExecutable(fileURLToPath2(import.meta.url));
  } catch {
  }
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
    case "probe":
      return probe2(args);
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
