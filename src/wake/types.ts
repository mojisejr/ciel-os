import type { EventValidationError, EventValidationWarning } from "../events/types.ts";
import type { PortfolioWakeReport } from "../portfolio/types.ts";

export interface WakeReport {
  observed: {
    repository: {
      path: string;
      head: string;
      branch: string | null;
      workingTree: {
        clean: boolean;
        entries: string[];
      };
      worktrees: Array<{
        path: string;
        head: string;
        branch: string | null;
        bare: boolean;
      }>;
    };
    instructions: {
      agentsMdPresent: boolean;
      claudeMdPresent: boolean;
      readmePresent: boolean;
    };
  };
  recorded: {
    latestEvent: null | {
      path: string;
      id: string | null;
      recordedAt: string | null;
      workstreamId: string | null;
      objective: string | null;
      checkpoint: string | null;
    };
    portfolio: PortfolioWakeReport;
  };
  reconciliation: {
    status: "at-recorded-checkpoint" | "expected-evolution" | "needs-reconciliation" | "unknown";
    detail: string;
  };
  unknowns: string[];
  validationErrors: EventValidationError[];
  validationWarnings: EventValidationWarning[];
}
