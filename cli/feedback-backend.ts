/**
 * Where `ua-builder feedback` sends an issue. The command builds an {@link Issue} and hands it
 * to {@link feedbackBackend}; nothing else knows the destination, so moving off GitHub means
 * writing another {@link FeedbackBackend} and returning it from there.
 */
import { gitHubIssueBackend } from './feedback-github';

/** The four kinds of issue, each with its own form and label at the destination. */
export const ISSUE_KINDS = ['improvement', 'bug', 'feature', 'feedback'] as const;
export type IssueKind = (typeof ISSUE_KINDS)[number];

/** What a person or an agent wants to tell UA. */
export interface Issue {
  kind: IssueKind;
  title: string;
  /** Markdown: what happened, what was awkward, the prompt for an improvement. */
  description: string;
  /** Plain `name: value` lines about the machine (SDK, Node, OS, LUNA). */
  environment: string;
}

/** What a backend made of an issue, for the command to open or print. */
export interface PreparedIssue {
  /** Where the person finishes and sends it (a page they sign in to), if there is one. */
  url?: string;
  /** Text the person must paste in themselves because it did not fit; empty when it all fitted. */
  overflow: string;
  /** One line telling the person what they need to finish, e.g. an account. */
  note: string;
}

export interface FeedbackBackend {
  /** Shown in messages, e.g. "GitHub". */
  readonly name: string;
  prepare(issue: Issue): PreparedIssue;
}

/** The backend `ua-builder feedback` uses. */
export function feedbackBackend(): FeedbackBackend {
  return gitHubIssueBackend();
}

export function isIssueKind(value: string): value is IssueKind {
  return (ISSUE_KINDS as readonly string[]).includes(value);
}
