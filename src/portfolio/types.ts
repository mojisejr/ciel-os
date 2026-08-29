export type AttentionState = "active" | "blocked" | "conflict" | "paused" | "unavailable";

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
    canonicalRemote: string;
    defaultBranch: string;
  };
}

export interface PortfolioWorkstream {
  checkpointsByLane: Record<string, PortfolioCheckpoint[]>;
  id: string;
  lane: string;
  path: string;
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
