/**
 * The GitHub backend: a prefilled "new issue" page on the SDK's public repo. The person signs
 * in with their own GitHub account, reads what will be sent and presses Submit; no token ever
 * touches the SDK. The forms are `.github/ISSUE_TEMPLATE/<kind>.yml`, and their field ids
 * (`description`, `environment`) are the query parameters filled here.
 */
import type { FeedbackBackend, Issue, IssueKind, PreparedIssue } from './feedback-backend';

export const GITHUB_REPO = 'uaudio-labs/luna-builder-sdk';

/** Each kind's form file and the title prefix that form starts with. */
export const GITHUB_FORMS: Record<IssueKind, { template: string; titlePrefix: string }> = {
  improvement: { template: 'improvement.yml', titlePrefix: '[Improvement] ' },
  bug: { template: 'bug.yml', titlePrefix: '[Bug] ' },
  feature: { template: 'feature.yml', titlePrefix: '[Feature] ' },
  feedback: { template: 'feedback.yml', titlePrefix: '[Feedback] ' },
};

/**
 * GitHub, and the browsers in between, stop reading a URL somewhere past 8 KB; staying under
 * this keeps the page from opening empty or with an error.
 */
export const GITHUB_MAX_URL = 7500;

const TRUNCATED = '\n\n_(Cut short to fit the link: paste the rest below.)_';

export function gitHubIssueUrl(repo: string, kind: IssueKind, title: string, description: string, environment: string): string {
  const form = GITHUB_FORMS[kind];
  const params = new URLSearchParams({
    template: form.template,
    title: title.startsWith(form.titlePrefix) ? title : form.titlePrefix + title,
    description,
    environment,
  });
  return `https://github.com/${repo}/issues/new?${params.toString()}`;
}

/** Fit the issue into one link, cutting the description at a line break when it is too long. */
export function prepareGitHubIssue(issue: Issue, repo = GITHUB_REPO, maxUrl = GITHUB_MAX_URL): PreparedIssue {
  const note = `Sending needs a GitHub account: sign in on the page that opens, check the text, then submit it.`;
  const full = gitHubIssueUrl(repo, issue.kind, issue.title, issue.description, issue.environment);
  if (full.length <= maxUrl) return { url: full, overflow: '', note };
  // Binary search for the longest description prefix that fits with the truncation note.
  let lo = 0;
  let hi = issue.description.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const url = gitHubIssueUrl(repo, issue.kind, issue.title, issue.description.slice(0, mid) + TRUNCATED, issue.environment);
    if (url.length <= maxUrl) lo = mid;
    else hi = mid - 1;
  }
  const lineBreak = issue.description.lastIndexOf('\n', lo);
  const cut = lineBreak > lo / 2 ? lineBreak : lo;
  return {
    url: gitHubIssueUrl(repo, issue.kind, issue.title, issue.description.slice(0, cut) + TRUNCATED, issue.environment),
    overflow: issue.description.slice(cut).replace(/^\n/, ''),
    note,
  };
}

export function gitHubIssueBackend(repo = GITHUB_REPO): FeedbackBackend {
  return { name: 'GitHub', prepare: (issue) => prepareGitHubIssue(issue, repo) };
}
