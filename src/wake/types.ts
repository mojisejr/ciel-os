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
      // Branches carrying commits that have not reached fetched origin/main.
      // Work that is finished and pushed leaves no other trace in any report,
      // so a review waiting on the owner is invisible until someone opens the
      // forge and looks. Wake cannot see a pull request and does not pretend to;
      // it reports branches, which local Git can observe. Local heads and
      // remote-tracking refs are grouped by name, because whether the work is
      // pushed is the part that says someone else may be waiting on it.
      unmergedWork: Array<{
        name: string;
        local: boolean;
        pushed: boolean;
        ahead: number;
        lastCommitAt: string | null;
        current: boolean;
      }>;
      // Every merge-state claim above reads refs/remotes/origin/main exactly as
      // the last fetch left it, and Wake never fetches. Reporting how old that
      // view is separates a report honest about its own age from one that
      // asserts merge state as though the view were current.
      remoteView: {
        fetchedAt: string | null;
        detail: string;
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
