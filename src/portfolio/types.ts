export type AttentionState = "active" | "blocked" | "conflict" | "paused" | "unavailable";

export type LifecycleGateState =
  | "authorized"
  | "awaiting-owner-merge"
  | "completed"
  | "interrupted"
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

export interface PortfolioWorkstream {
  checkpointsByLane: Record<string, PortfolioCheckpoint[]>;
  declaredSlices: string[];
  executionPhase: string | null;
  executionState: "executing" | "idle";
  id: string;
  lane: string;
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
  workstreams: PortfolioWorkstream[];
}
