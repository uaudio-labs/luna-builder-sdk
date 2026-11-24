/** `ua-builder feedback`: an issue built from the command line, handed to a swappable backend. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ISSUE_KINDS, type FeedbackBackend, type Issue } from '../../cli/feedback-backend';
import { feedback, issueFromArgs } from '../../cli/feedback';
import { GITHUB_FORMS, GITHUB_REPO, gitHubIssueUrl, prepareGitHubIssue } from '../../cli/feedback-github';
import { parseArgs } from '../../cli/util';

const FORMS = join(__dirname, '..', '..', '.github', 'ISSUE_TEMPLATE');

function issue(description: string): Issue {
  return { kind: 'improvement', title: 'Batch note edits', description, environment: 'ua-builder: 3.1.2' };
}

describe('ua-builder feedback', () => {
  afterEach(() => vi.restoreAllMocks());

  it('builds an issue from the kind, title and body, with the environment filled in', () => {
    const got = issueFromArgs(parseArgs(['bug', '--title', 'serve drops 404s', '--body', '  It hangs.  ', '--luna-version', '3.1.2']));
    expect(got.kind).toBe('bug');
    expect(got.title).toBe('serve drops 404s');
    expect(got.description).toBe('It hangs.');
    expect(got.environment).toMatch(/^ua-builder: .+\nnode: v\d+.+\nos: .+\nLUNA: 3\.1\.2$/);
  });

  it('accepts feature-request for feature and reads the body from stdin with --body-file -', () => {
    const got = issueFromArgs(parseArgs(['feature-request', '--title', 'T', '--body-file', '-']), () => 'from stdin\n');
    expect(got.kind).toBe('feature');
    expect(got.description).toBe('from stdin');
  });

  it('refuses an unknown kind, a missing title and an empty body', () => {
    expect(() => issueFromArgs(parseArgs(['praise', '--title', 'T', '--body', 'B']))).toThrow(/unknown feedback kind: praise/);
    expect(() => issueFromArgs(parseArgs(['bug', '--body', 'B']))).toThrow(/--title is required/);
    expect(() => issueFromArgs(parseArgs(['bug', '--title', 'T']))).toThrow(/--body or --body-file/);
  });

  it('hands the issue to the backend and opens what it prepared', async () => {
    const seen: Issue[] = [];
    const backend: FeedbackBackend = { name: 'Test', prepare: (i) => (seen.push(i), { url: 'https://example.test/new', overflow: '', note: 'Needs an account.' }) };
    const opened: string[] = [];
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const code = await feedback(parseArgs(['feedback', '--title', 'Nice', '--body', 'Thanks']), backend, (u) => (opened.push(u), true));
    expect(code).toBe(0);
    expect(seen[0]?.kind).toBe('feedback');
    expect(opened).toEqual(['https://example.test/new']);
    expect(log.mock.calls.flat().join('\n')).toContain('Needs an account.');
  });

  it('prints the link instead of opening it with --print', async () => {
    const backend: FeedbackBackend = { name: 'Test', prepare: () => ({ url: 'https://example.test/new', overflow: '', note: '' }) };
    const open = vi.fn(() => true);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await feedback(parseArgs(['bug', '--title', 'T', '--body', 'B', '--print']), backend, open);
    expect(open).not.toHaveBeenCalled();
    expect(log.mock.calls.flat()).toContain('https://example.test/new');
  });

  it('exits 2 without calling the backend when the arguments are wrong', async () => {
    const prepare = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await feedback(parseArgs(['bug']), { name: 'Test', prepare })).toBe(2);
    expect(prepare).not.toHaveBeenCalled();
  });
});

describe('GitHub feedback backend', () => {
  it('prefills the kind\'s form on the SDK repo, prefixing the title once', () => {
    const url = new URL(gitHubIssueUrl(GITHUB_REPO, 'improvement', 'Batch note edits', 'Body & more', 'env'));
    expect(url.origin + url.pathname).toBe('https://github.com/uaudio-labs/luna-builder-sdk/issues/new');
    expect(url.searchParams.get('template')).toBe('improvement.yml');
    expect(url.searchParams.get('title')).toBe('[Improvement] Batch note edits');
    expect(url.searchParams.get('description')).toBe('Body & more');
    expect(url.searchParams.get('environment')).toBe('env');
    const again = new URL(gitHubIssueUrl(GITHUB_REPO, 'improvement', '[Improvement] X', 'B', 'E'));
    expect(again.searchParams.get('title')).toBe('[Improvement] X');
  });

  it('keeps a short issue whole and says a GitHub account is needed', () => {
    const got = prepareGitHubIssue(issue('Short.'));
    expect(got.overflow).toBe('');
    expect(new URL(got.url!).searchParams.get('description')).toBe('Short.');
    expect(got.note).toMatch(/GitHub account/);
  });

  it('cuts a long description at a line break to fit the link, returning the rest to paste', () => {
    const description = Array.from({ length: 400 }, (_, i) => `line ${i} of the improvement prompt`).join('\n');
    const got = prepareGitHubIssue(issue(description), GITHUB_REPO, 4000);
    expect(got.url!.length).toBeLessThanOrEqual(4000);
    const sent = new URL(got.url!).searchParams.get('description')!;
    expect(sent).toMatch(/Cut short to fit the link/);
    const kept = sent.slice(0, sent.indexOf('\n\n_(Cut short'));
    expect(kept + '\n' + got.overflow).toBe(description);
  });

  it('has a form for every kind whose fields are the ones the backend fills', () => {
    const files = readdirSync(FORMS);
    for (const kind of ISSUE_KINDS) {
      const { template, titlePrefix } = GITHUB_FORMS[kind];
      expect(files).toContain(template);
      // Read the few lines that matter without a YAML parser (not a dependency of the SDK).
      const text = readFileSync(join(FORMS, template), 'utf8');
      expect(text).toMatch(new RegExp(`^title: "${titlePrefix.replace(/[[\]]/g, '\\$&')}"$`, 'm'));
      expect(text).toMatch(/^labels: \["[a-z]+"\]$/m);
      expect([...text.matchAll(/^ {4}id: (\S+)$/gm)].map((m) => m[1])).toEqual(['description', 'environment']);
    }
  });
});
