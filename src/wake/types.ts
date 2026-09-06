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
      // Set only while the checkout sits on a standing HQ branch. The name
      // carries the date it was opened, so its age needs no stored state. Age
      // is reported as an observation; when to merge stays the owner's call.
      standingBranch: null | {
        ageDays: number;
        name: string;
        openedOn: string;
      };
      // Standing branches that still exist locally and have already reached
      // fetched origin/main. A standing branch's age is reported only while the
      // checkout sits on it, so without this a merged one left behind becomes
      // invisible the moment the checkout returns to main.
      mergedStandingBranches: Array<{
        ageDays: number | null;
        name: string;
        openedOn: string | null;
      }>;
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
