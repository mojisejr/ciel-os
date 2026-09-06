export type AttentionState = "active" | "blocked" | "conflict" | "paused" | "unavailable";

export type LifecycleGateState =
  | "authorized"
  | "awaiting-owner-merge"
  | "claimed"
  | "completed"
  | "merged-needs-cleanup"
  | "merged-needs-sync"
  | "needs-owner-decision"
  | "needs-reconciliation"
  | "owner-confirmation-required";

export interface PortfolioValidationError {
  path: string;
  message: string;
}

export interface PortfolioCheckpoint {
  eventId: string | null;
  eventPath: string;
  recordedAt: string | null;
  revision: string | null;
  type: string | null;
}

export interface PortfolioProject {
  binding: {
    detail: string;
    path: string | null;
    status: "available" | "mismatch" | "unavailable";
  };
  id: string;
  observed: null | {
    branch: string | null;
    head: string;
    workingTree: {
      clean: boolean;
      entries: string[];
    };
  };
  repository: {
    canonicalRemote: string | null;
    defaultBranch: string;
    identity: "local-only" | "remote";
  };
}

// What the most recent record for a workstream says a person should do next,
// and what it left open. Both are required in every event and were previously
// unreadable without opening the file, which made "where are we and what now"
// a question the owner had to ask instead of one Wake could answer.
export interface PortfolioLatestRecord {
  eventPath: string;
  nextAction: string | null;
  // Whether the commit that added this record has itself reached the target
  // branch. A record's advice goes stale the moment it is acted on, and a
  // record that has merged has usually been acted on already: one session read
  // a merged record telling it to open a pull request and nearly opened a
  // duplicate for work that had merged. Reported beside the advice rather than
  // replacing it, because only a person can tell whether the advice was
  // carried out or merely travelled along with the merge.
  nextActionState: {
    detail: string;
    state: "merged" | "unknown" | "unmerged";
  };
  recordedAt: string | null;
  unresolved: string[];
}

export interface PortfolioWorkstream {
  checkpointsByLane: Record<string, PortfolioCheckpoint[]>;
  declaredSlices: string[];
  executionPhase: string | null;
  executionState: "executing" | "idle";
  id: string;
  lane: string;
  latestRecord: PortfolioLatestRecord | null;
  lifecycle: {
    decisionEventPath: string | null;
    detail: string;
    state: LifecycleGateState;
  } | null;
  path: string;
  planRevision: string;
  parallelism: "none" | "proposed";
  projectIds: string[];
  state: "active" | "blocked" | "completed" | "paused";
}

export interface PortfolioAttention {
  detail: string;
  projectIds: string[];
  state: AttentionState;
  workstreamId: string;
}

export interface PortfolioWakeReport {
  attention: PortfolioAttention[];
  projects: PortfolioProject[];
  validationErrors: PortfolioValidationError[];
  // A closeout scoped to finish a workstream whose outcome.status the delivery
  // machinery does not act on. It is a warning and never an error: the ledger
  // is append-only, so failing on one would make an uncorrectable record block
  // every later read.
  validationWarnings: PortfolioValidationError[];
  workstreams: PortfolioWorkstream[];
}
