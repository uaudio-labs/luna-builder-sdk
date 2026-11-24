/**
 * Following LUNA's background jobs (`/jobs/<uid>`, fact 200) to the end.
 *
 * Three things about LUNA's jobs shape this file:
 * - a launch command (`extract_chords`, `extract_lyrics`) answers on acceptance with no job
 *   uid, so a job is matched to its launch by session, job type and target track, watching
 *   from *before* the command is posted (fact 201);
 * - LUNA publishes the terminal status and removes the node right after (fact 200), so the
 *   last state is latched here as the pushes arrive, and a caller that asks afterwards still
 *   gets it;
 * - native LUNA announces a new job with no properties (fact 7), so its identity is read once
 *   when it appears (fact 202).
 *
 * @example
 * const run = session.musical.chords.detect({ clip });
 * run.progress.onChange(() => (bar.value = run.progress.value ?? 0));
 * const result = await run;            // rejects with Luna.UAError on failure or cancel
 * if (result.empty) console.log('no chords found');
 */
import type { Client } from '../client/client';
import { Cell, type Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import { propertyValue, type Event, type Unsubscribe } from '../wire/port';

/** A job as LUNA last reported it. Frozen; safe to keep. */
export interface JobSnapshot {
  readonly uid: string;
  /** Nil uuid (32 zeros) when the job belongs to no session. */
  readonly sessionUid: string;
  /** `lyric_transcription` or `chord_extraction`. */
  readonly jobType: string;
  /** `queued | running | canceling | completed | failed | canceled`. */
  readonly status: string;
  /** Machine key such as `processing` or `downloading`; `''` when none. */
  readonly stage: string;
  /** A `job.*` code such as `job.provider_unavailable`; `''` when none. */
  readonly error: string;
  /** A `job.warning.*` code; `''` when none. */
  readonly warning: string;
  /** The track the job works on, when LUNA names one. */
  readonly targetUid: string | undefined;
  readonly cancellable: boolean;
  /** 0..100, as LUNA reports it. */
  readonly percentComplete: number;
}

/** How a job that did what it was asked ended. */
export interface JobResult extends JobSnapshot {
  /**
   * True when the job worked and found nothing (no chords, no lyrics). LUNA reports that as
   * `failed` with the error `job.no_result` and calls it "not a failure" (fact 200), so the
   * SDK resolves it rather than rejecting.
   */
  readonly empty: boolean;
}

/** What a launch is matched on (fact 201). */
export interface JobCriteria {
  sessionUid: string;
  jobType: string;
  /** The **track** the job targets; leave out when LUNA picks it from the selection. */
  targetUid?: string;
}

/** Status values after which nothing more happens to a job. */
export function isTerminalJobStatus(status: string | undefined): boolean {
  return status === 'completed' || status === 'failed' || status === 'canceled';
}

const NO_RESULT = 'job.no_result';
const DEFAULT_START_MS = 30_000;
const DEFAULT_DONE_MS = 30 * 60_000;
/** How many ended jobs are remembered for callers that ask late. */
const LATCH_CAP = 32;

const FIELDS: Record<string, keyof Omit<JobSnapshot, 'uid'>> = {
  session_uid: 'sessionUid',
  job_type: 'jobType',
  status: 'status',
  stage: 'stage',
  error: 'error',
  warning: 'warning',
  target_uid: 'targetUid',
  cancellable: 'cancellable',
  percent_complete: 'percentComplete',
};

function coerce(field: keyof JobSnapshot, raw: unknown): unknown {
  if (field === 'cancellable') return raw === true || raw === 1;
  if (field === 'percentComplete') return Number(raw) || 0;
  if (field === 'targetUid') return typeof raw === 'string' && raw !== '' ? raw : undefined;
  return raw === null || raw === undefined ? '' : String(raw);
}

function blank(uid: string): JobSnapshot {
  return Object.freeze({ uid, sessionUid: '', jobType: '', status: 'queued', stage: '', error: '', warning: '', targetUid: undefined, cancellable: false, percentComplete: 0 });
}

/** A `get` reply or an added-node payload as a flat property map; `undefined` when it has none. */
function propertiesOf(reply: unknown): Record<string, unknown> | undefined {
  if (typeof reply !== 'object' || reply === null || Array.isArray(reply)) return undefined;
  const node = reply as Record<string, unknown>;
  const props = node['properties'];
  if (Array.isArray(props)) {
    const out: Record<string, unknown> = {};
    for (const e of props) if (e && typeof e === 'object' && typeof (e as { name?: unknown }).name === 'string') out[(e as { name: string }).name] = propertyValue((e as { value?: unknown }).value);
    return out;
  }
  if (props && typeof props === 'object') return Object.fromEntries(Object.entries(props).map(([k, v]) => [k, propertyValue(v)]));
  // A flatvalue read of a node answers the bare map.
  return Object.keys(node).some((k) => k in FIELDS) ? node : undefined;
}

/**
 * How a finished job's last snapshot reads as a promise outcome: completed (and
 * `job.no_result`) resolve, a failure or a cancel rejects with the job's error code.
 */
export function jobOutcome(job: JobSnapshot): { result: JobResult } | { error: UAError } {
  if (job.status === 'completed' || (job.status === 'failed' && job.error === NO_RESULT)) {
    return { result: Object.freeze({ ...job, empty: job.error === NO_RESULT }) };
  }
  const code = job.status === 'canceled' ? 'canceled' : job.error || 'failed';
  return { error: new UAError(code, `${job.jobType || 'job'} ${job.uid} ${job.status}${job.error ? `: ${job.error}` : ''}`, { path: `/jobs/${job.uid}` }) };
}

interface Entry {
  snap: JobSnapshot;
  /** Order first seen; a watch only takes jobs seen after it began. */
  seq: number;
  /** First seen through an `added` push, so it can be the job a launch made. */
  fresh: boolean;
  removed: boolean;
  /** The identity read is still out. */
  reading: boolean;
}

interface Waiter {
  uid: string;
  settle: (job: JobSnapshot, removed: boolean) => void;
}

/** @internal One per client: taps `/jobs` while anything waits on a job. */
export class JobTracker {
  private readonly entries = new Map<string, Entry>();
  private readonly latched = new Map<string, JobSnapshot>();
  private readonly runs = new Set<JobRun>();
  private readonly waiters = new Set<Waiter>();
  private seq = 0;
  private refs = 0;
  private release: Unsubscribe | undefined;
  private offEvents: Unsubscribe | undefined;

  constructor(private readonly client: Client) {}

  /** @internal */
  acquire(): () => void {
    if (this.refs++ === 0) {
      // Recursive: both the node's add and removal and its property pushes (fact 34).
      this.release = this.client.store.watch('/jobs', { recursive: true, load: false }).release;
      // The tap runs before the store applies the event, so a removal is seen with the job's
      // last state still in hand.
      this.offEvents = this.client.store.onEvent((e) => this.onEvent(e));
    }
    let done = false;
    return () => {
      if (done) return;
      done = true;
      if (--this.refs === 0) {
        this.release?.();
        this.offEvents?.();
        this.release = this.offEvents = undefined;
        // Live entries go stale without the tap; ended ones stay in `latched`.
        this.entries.clear();
      }
    };
  }

  /** The last state of a job that ended while the SDK was watching, if remembered. */
  ended(uid: string): JobSnapshot | undefined {
    return this.latched.get(uid);
  }

  /** @internal */
  nextSeq(): number {
    return this.seq;
  }

  /** @internal */
  addRun(run: JobRun): void {
    this.runs.add(run);
    // A job already seen may match once its identity arrives; offer what is known now.
    for (const [uid, e] of this.entries) if (e.fresh) run.offer(uid, e);
  }

  /** @internal */
  dropRun(run: JobRun): void {
    this.runs.delete(run);
  }

  /** @internal Wait for one job by uid; seeds it from `seed` if the tap has not seen it. */
  waitFor(uid: string, seed: Partial<JobSnapshot> | undefined, settle: Waiter['settle']): Unsubscribe {
    if (!this.entries.has(uid)) this.entries.set(uid, { snap: Object.freeze({ ...blank(uid), ...stripUndefined(seed) }), seq: this.seq++, fresh: false, removed: false, reading: false });
    const waiter: Waiter = { uid, settle };
    this.waiters.add(waiter);
    return () => this.waiters.delete(waiter);
  }

  /** @internal */
  snapshot(uid: string): JobSnapshot | undefined {
    return this.entries.get(uid)?.snap ?? this.latched.get(uid);
  }

  private onEvent(event: Event): void {
    if (!event.path.startsWith('/jobs/')) return;
    const parts = event.path.slice('/jobs/'.length).split('/');
    const uid = parts[0];
    if (!uid) return;
    if (parts.length === 1 && event.operation === 'added') {
      const entry: Entry = { snap: blank(uid), seq: this.seq++, fresh: true, removed: false, reading: false };
      this.entries.set(uid, entry);
      // The wasm engine sends the node's properties with the add (fact 13); native LUNA does not.
      const props = propertiesOf(event.data);
      if (props && props['job_type'] !== undefined) this.merge(uid, props);
      else this.readIdentity(uid, entry);
      this.changed(uid);
      return;
    }
    if (parts.length === 1 && event.operation === 'removed') {
      const entry = this.entries.get(uid);
      if (!entry) return;
      entry.removed = true;
      if (isTerminalJobStatus(entry.snap.status)) this.latch(entry.snap);
      this.changed(uid);
      return;
    }
    if (parts.length === 2 && !event.operation) {
      const name = parts[1]!;
      // A push for a job the tap never saw added: it was there before anyone watched.
      if (!this.entries.has(uid)) this.entries.set(uid, { snap: blank(uid), seq: this.seq++, fresh: false, removed: false, reading: false });
      this.merge(uid, { [name]: event.data });
      this.changed(uid);
    }
  }

  /** Native LUNA's add carries no properties (fact 7): read who the job is for (fact 202). */
  private readIdentity(uid: string, entry: Entry): void {
    entry.reading = true;
    this.client.raw
      .get(`/jobs/${uid}`, { children: false, commands: false, flatvalue: true })
      .then(
        (reply) => {
          const props = propertiesOf(reply);
          if (props) {
            // Identity never changes; the rest only while the job is still there.
            const keep = entry.removed ? ['session_uid', 'job_type', 'target_uid'] : Object.keys(props);
            this.merge(uid, Object.fromEntries(Object.entries(props).filter(([k]) => keep.includes(k))));
          }
        },
        () => undefined,
      )
      .finally(() => {
        entry.reading = false;
        this.changed(uid);
      });
  }

  private merge(uid: string, props: Record<string, unknown>): void {
    const entry = this.entries.get(uid);
    if (!entry) return;
    const next: Record<string, unknown> = { ...entry.snap };
    for (const [name, raw] of Object.entries(props)) {
      const field = FIELDS[name];
      if (field) next[field] = coerce(field, propertyValue(raw));
    }
    entry.snap = Object.freeze(next as unknown as JobSnapshot);
  }

  private latch(job: JobSnapshot): void {
    this.latched.delete(job.uid);
    this.latched.set(job.uid, job);
    if (this.latched.size > LATCH_CAP) this.latched.delete(this.latched.keys().next().value!);
  }

  private changed(uid: string): void {
    const entry = this.entries.get(uid);
    if (!entry) return;
    for (const run of [...this.runs]) run.offer(uid, entry);
    for (const w of [...this.waiters]) {
      if (w.uid !== uid) continue;
      if (isTerminalJobStatus(entry.snap.status) || entry.removed) w.settle(entry.snap, entry.removed);
    }
    if (entry.removed && !entry.reading) this.entries.delete(uid);
  }

  /** @internal Fresh entries seen at or after `seq`, for a run's last-resort match. */
  freshSince(seq: number): number {
    let n = 0;
    for (const e of this.entries.values()) if (e.fresh && e.seq >= seq) n++;
    return n;
  }
}

function stripUndefined<T extends object>(value: T | undefined): Partial<T> {
  if (!value) return {};
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

const trackers = new WeakMap<Client, JobTracker>();

/** @internal */
export function jobTracker(client: Client): JobTracker {
  let t = trackers.get(client);
  if (!t) trackers.set(client, (t = new JobTracker(client)));
  return t;
}

/** How long a {@link JobRun} waits: for LUNA to start the job, and for it to finish. */
export interface JobRunOptions {
  /** How long to wait for LUNA to start the job. Default 30 s. */
  startTimeoutMs?: number;
  /** How long to wait for it to finish. Default 30 min. */
  timeoutMs?: number;
}

/**
 * One launched job, followed from the command that started it to its end: what
 * `session.musical.chords.detect()` and `session.lyrics.transcribe()` return. Await it (or
 * {@link done}) for the outcome; read {@link progress} and {@link snapshot} on the way.
 *
 * It resolves when the job completes, and with `empty: true` when it worked and found nothing.
 * It rejects with a {@link UAError} whose `code` is the job's error (`job.provider_unavailable`,
 * ...), `canceled`, `removed` (LUNA dropped the job without an ending, e.g. its session closed),
 * `no_effect` (LUNA took the command but no job started), `timeout` (the job did not end in
 * time, the code `Luna.RequestTimeout` carries too), or the launch command's own error.
 *
 * @example
 * const run = session.lyrics.transcribe({ clip });
 * run.progress.onChange(() => console.log(Math.round((run.progress.value ?? 0) * 100), '%'));
 * try {
 *   const result = await run;
 *   console.log(result.empty ? 'nothing sung' : 'lyrics ready');
 * } catch (err) {
 *   console.warn((err as Luna.UAError).code);
 * }
 */
export class JobRun implements PromiseLike<JobResult> {
  /** The job's latest snapshot; `undefined` until LUNA starts it. */
  readonly snapshot: Prop<JobSnapshot>;
  /** 0..1 from the job's `percent_complete`, ready for a `<progress>` element. */
  readonly progress: Prop<number>;

  private readonly snapCell: Cell<JobSnapshot>;
  private readonly progressCell: Cell<number>;
  private readonly outcome: Promise<JobResult>;
  private resolve!: (r: JobResult) => void;
  private reject!: (e: unknown) => void;
  private pinned: string | undefined;
  private finished = false;
  private readonly minSeq: number;
  private readonly releaseTracker: () => void;
  private startTimer: ReturnType<typeof setTimeout> | undefined;
  private doneTimer: ReturnType<typeof setTimeout> | undefined;

  /** @internal Create before posting the launch command, then hand it the post with {@link launched}. */
  constructor(
    private readonly client: Client,
    private readonly criteria: JobCriteria,
    options: JobRunOptions = {},
  ) {
    const scheduler = client.store.scheduler;
    this.snapCell = new Cell<JobSnapshot>(scheduler);
    this.progressCell = new Cell<number>(scheduler, 0);
    this.snapshot = this.snapCell;
    this.progress = this.progressCell;
    this.outcome = new Promise<JobResult>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    // Nobody may await a run they only watch the progress of; that is not an unhandled error.
    this.outcome.catch(() => undefined);
    const tracker = jobTracker(client);
    this.releaseTracker = tracker.acquire();
    this.minSeq = tracker.nextSeq();
    tracker.addRun(this);
    const startMs = options.startTimeoutMs ?? DEFAULT_START_MS;
    this.startTimer = setTimeout(() => this.fail(new UAError('no_effect', `no ${criteria.jobType} job started within ${startMs} ms`)), startMs);
    const doneMs = options.timeoutMs ?? DEFAULT_DONE_MS;
    this.doneTimer = setTimeout(() => this.fail(new UAError('timeout', `${criteria.jobType} did not finish within ${doneMs} ms`)), doneMs);
  }

  /** @internal The launch post; its refusal is the run's outcome. */
  launched(post: Promise<unknown>): this {
    post.catch((err: unknown) => this.fail(err));
    return this;
  }

  /** The job's uid once LUNA has started it. */
  get uid(): string | undefined {
    return this.pinned;
  }

  /**
   * The outcome: resolves with the job's last snapshot, rejects as described on the class.
   * Calling it after the job ended answers at once.
   *
   * @example
   * const { empty } = await session.musical.chords.detect().done();
   */
  done(): Promise<JobResult> {
    return this.outcome;
  }

  /**
   * Lets `await run` work: a `JobRun` is a `PromiseLike` of its {@link JobResult}.
   *
   * @example
   * const result = await session.musical.chords.detect({ clip });
   */
  then<A = JobResult, B = never>(onFulfilled?: ((value: JobResult) => A | PromiseLike<A>) | null, onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null): Promise<A | B> {
    return this.outcome.then(onFulfilled, onRejected);
  }

  /**
   * Ask LUNA to cancel the job. LUNA refuses once the job is no longer cancellable; the run
   * then ends however the job does. A cancel accepted ends the run with code `canceled`.
   *
   * @example
   * const run = session.lyrics.transcribe();
   * cancelButton.onclick = () => run.cancel().catch(() => undefined);
   */
  async cancel(): Promise<void> {
    const uid = this.pinned;
    if (!uid) throw new UAError('unavailable', 'cancel(): the job has not started yet');
    await this.client.raw.post(`/jobs/${uid}/commands/cancel_job`, {});
  }

  /** @internal Offered every change to a job the tracker sees. */
  offer(uid: string, entry: { snap: JobSnapshot; seq: number; fresh: boolean; removed: boolean; reading: boolean }): void {
    if (this.finished) return;
    if (this.pinned === undefined) {
      if (!entry.fresh || entry.seq < this.minSeq) return;
      const job = entry.snap;
      const c = this.criteria;
      const known = job.jobType !== '';
      const matches = known && job.sessionUid === c.sessionUid && job.jobType === c.jobType && (c.targetUid === undefined || job.targetUid === c.targetUid);
      // A job that was added and gone before its identity could be read (an instant job,
      // fact 202) is this launch's only when nothing else started since the launch.
      const orphan = !known && entry.removed && !entry.reading && jobTracker(this.client).freshSince(this.minSeq) <= 1;
      if (!matches && !orphan) return;
      this.pinned = uid;
      if (this.startTimer) clearTimeout(this.startTimer);
    }
    if (uid !== this.pinned) return;
    const job = entry.snap;
    this.snapCell.update(job);
    this.progressCell.update(Math.max(0, Math.min(1, job.percentComplete / 100)));
    if (isTerminalJobStatus(job.status)) {
      const o = jobOutcome(job);
      if ('result' in o) this.finish(() => this.resolve(o.result));
      else this.fail(o.error);
    } else if (entry.removed && !entry.reading) {
      this.fail(new UAError('removed', `${job.jobType || 'job'} ${uid} was removed without an ending`, { path: `/jobs/${uid}` }));
    }
  }

  private fail(err: unknown): void {
    this.finish(() => this.reject(err));
  }

  private finish(settle: () => void): void {
    if (this.finished) return;
    this.finished = true;
    if (this.startTimer) clearTimeout(this.startTimer);
    if (this.doneTimer) clearTimeout(this.doneTimer);
    jobTracker(this.client).dropRun(this);
    this.releaseTracker();
    settle();
  }
}

/**
 * @internal Launch a job-backed command: start watching, post, and follow the job it makes.
 */
export function launchJob(client: Client, criteria: JobCriteria, post: () => Promise<unknown>, options?: JobRunOptions): JobRun {
  const run = new JobRun(client, criteria, options);
  // Posted after the watch exists, so the job's add cannot slip past (fact 201).
  return run.launched(Promise.resolve().then(post));
}

/** What a chord detection or lyric transcription works on. */
export interface ExtractionOptions extends JobRunOptions {
  /**
   * The clip to analyse, as a `Clip` or its uid. Without one LUNA uses the edit context's
   * selection (one track for chords).
   */
  clip?: { readonly id: string; readonly path: string; readonly uid?: Prop<string> } | string;
  /**
   * The clip's track, which the job is matched on (fact 201). Found from a `Clip` itself; give
   * it with a bare clip uid so a concurrent job on another track cannot be taken for this one.
   */
  trackUid?: string;
  /** The edit context whose selection is used without a clip. Default `main`. */
  context?: string;
}

/** @internal The command payload and the job's target track for {@link ExtractionOptions}. */
export function extractionTarget(client: Client, options: ExtractionOptions): { clipUid: string | undefined; trackUid: string | undefined } {
  const clip = options.clip;
  if (clip === undefined) return { clipUid: undefined, trackUid: options.trackUid };
  if (typeof clip === 'string') return { clipUid: clip, trackUid: options.trackUid };
  const clipUid = clip.uid?.value ?? clip.id;
  // `<session>/playlists/<pl>/clips/<clip>`: the playlist names its track.
  const at = clip.path.lastIndexOf('/clips/');
  const playlist = at > 0 ? clip.path.slice(0, at) : undefined;
  const track = playlist ? client.store.cell<string>(playlist, 'track_uid').value : undefined;
  return { clipUid, trackUid: options.trackUid ?? (typeof track === 'string' && track ? track : undefined) };
}

/** @internal Post a context extraction command and follow its job. */
export function runExtraction(client: Client, sessionUid: string, command: string, jobType: string, options: ExtractionOptions, extra: Record<string, unknown> = {}): JobRun {
  const { clipUid, trackUid } = extractionTarget(client, options);
  const context = options.context ?? 'main';
  const body: Record<string, unknown> = { session_uid: sessionUid, ...extra };
  if (clipUid !== undefined) body['clip_uid'] = clipUid;
  if (context !== 'main') body['context_type'] = context;
  const runOptions: JobRunOptions = {};
  if (options.startTimeoutMs !== undefined) runOptions.startTimeoutMs = options.startTimeoutMs;
  if (options.timeoutMs !== undefined) runOptions.timeoutMs = options.timeoutMs;
  const criteria: JobCriteria = { sessionUid, jobType };
  if (trackUid !== undefined) criteria.targetUid = trackUid;
  return launchJob(client, criteria, () => client.raw.post(`/sessions/${sessionUid}/contexts/${context}/commands/${command}`, body), runOptions);
}
