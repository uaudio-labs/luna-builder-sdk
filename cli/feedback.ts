/**
 * `ua-builder feedback <improvement|bug|feature|feedback> --title "..." [--body "..." | --body-file <file|->] [--luna-version x.y.z] [--print]`
 *
 * Opens a prefilled issue for UA to read. Where it goes is {@link feedbackBackend}'s business.
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { arch, release, type } from 'node:os';
import { feedbackBackend, isIssueKind, ISSUE_KINDS, type FeedbackBackend, type Issue, type IssueKind } from './feedback-backend';
import { flagString, sdkVersion, type Args } from './util';

const ALIASES: Record<string, IssueKind> = { 'feature-request': 'feature', request: 'feature', improve: 'improvement' };

export const FEEDBACK_USAGE = `ua-builder feedback <${ISSUE_KINDS.join('|')}> --title "Short summary" [--body "Markdown" | --body-file <file|->] [--luna-version x.y.z] [--print]`;

/** The `name: value` lines every issue carries, so UA can tell which build it came from. */
export function environmentLines(lunaVersion?: string): string {
  const lines = [
    `ua-builder: ${sdkVersion()}`,
    `node: ${process.version}`,
    `os: ${type()} ${release()} (${arch()})`,
  ];
  if (lunaVersion) lines.push(`LUNA: ${lunaVersion}`);
  return lines.join('\n');
}

/** Build the issue from the command line; throws with a message the person can act on. */
export function issueFromArgs(args: Args, readStdin: () => string = () => readFileSync(0, 'utf8')): Issue {
  const raw = (args.positional[0] ?? '').toLowerCase();
  const kind = isIssueKind(raw) ? raw : ALIASES[raw];
  if (!kind) throw new Error(raw ? `unknown feedback kind: ${raw}\n\n${FEEDBACK_USAGE}` : FEEDBACK_USAGE);
  const title = flagString(args, 'title')?.trim();
  if (!title) throw new Error(`--title is required\n\n${FEEDBACK_USAGE}`);
  const file = flagString(args, 'body-file');
  const body = file === '-' ? readStdin() : file ? readFileSync(file, 'utf8') : flagString(args, 'body') ?? '';
  if (!body.trim()) throw new Error(`say what happened with --body or --body-file\n\n${FEEDBACK_USAGE}`);
  return { kind, title, description: body.trim(), environment: environmentLines(flagString(args, 'luna-version')) };
}

/** Open `url` in the default browser without a shell, so `&` in the query stays intact. */
export function openInBrowser(url: string): boolean {
  const [cmd, argv] = process.platform === 'darwin'
    ? ['open', [url]]
    : process.platform === 'win32'
      ? ['rundll32', ['url.dll,FileProtocolHandler', url]]
      : ['xdg-open', [url]];
  try {
    const child = spawn(cmd, argv as string[], { stdio: 'ignore', detached: true });
    child.on('error', () => undefined);
    child.unref();
    return true;
  } catch {
    return false;
  }
}

export async function feedback(args: Args, backend: FeedbackBackend = feedbackBackend(), open: (url: string) => boolean = openInBrowser): Promise<number> {
  let issue: Issue;
  try {
    issue = issueFromArgs(args);
  } catch (e) {
    console.error((e as Error).message);
    return 2;
  }
  const prepared = backend.prepare(issue);
  const print = args.flags['print'] === true;
  if (prepared.url) {
    if (print || !open(prepared.url)) console.log(prepared.url);
    else console.log(`Opened a ${issue.kind} issue on ${backend.name} in your browser.`);
  }
  console.log(prepared.note);
  if (prepared.overflow) {
    console.log('\nThe description was too long for the link. Paste this at the end of it:\n');
    console.log(prepared.overflow);
  }
  return 0;
}
