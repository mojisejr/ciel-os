import { expect, test } from "bun:test";

import type { PortfolioWorkstream } from "../../src/portfolio/types.ts";
import { BRIEF_SOFT_LIMIT_BYTES, briefWakeReport, workstreamCandidates, workstreamDetail } from "../../src/wake/brief.ts";
import type { WakeReport } from "../../src/wake/types.ts";

const NOW = new Date("2026-10-20T12:00:00+07:00");

function workstream(id: string, overrides: Partial<PortfolioWorkstream> = {}): PortfolioWorkstream {
  return {
    checkpointsByLane: { single: [] },
    declaredSlices: ["1"],
    executionPhase: null,
    executionState: "idle",
    id,
    lane: "single",
    latestRecord: {
      eventPath: `memory/events/2026/10/19/20261019T100000_${id}.yaml`,
      nextAction: `Continue ${id}. Then report back.`,
      nextActionState: { detail: "merged detail", state: "merged" },
      recordedAt: "2026-10-19T10:00:00+07:00",
      unresolved: [`open item of ${id}`]
    },
    lifecycle: { decisionEventPath: null, detail: `authorized ${id}`, state: "authorized" },
    path: `/hq/workstreams/${id}/PLAN.md`,
    planRevision: "0.1",
    parallelism: "none",
    projectIds: ["ciel-os"],
    state: "active",
    ...overrides
  };
}

function finished(id: string, events = 1): PortfolioWorkstream {
  const checkpoints = Array.from({ length: events }, (_, index) => ({
    eventId: `evt_${id}_${index}`,
    eventPath: `/hq/memory/events/2026/09/01/20260901T0000${index}_${id}.yaml`,
    recordedAt: "2026-09-01T00:00:00+07:00",
    revision: "0123456789abcdef0123456789abcdef01234567",
    type: "closeout"
  }));
  return workstream(id, {
    checkpointsByLane: { single: checkpoints },
    lifecycle: { decisionEventPath: null, detail: "Final closeout reached origin/main.", state: "completed" }
  });
}

function report(workstreams: PortfolioWorkstream[]): WakeReport {
  return {
    observed: {
      repository: {
        path: "/hq",
        head: "0123456789abcdef0123456789abcdef01234567",
        branch: "main",
        workingTree: { clean: true, entries: [] },
        standingBranch: null,
        mergedStandingBranches: [],
        unmergedWork: [],
        remoteView: { fetchedAt: null, detail: "fixture" },
        worktrees: []
      },
      instructions: {
        agentsMdPresent: true,
        claudeMdPresent: true,
        ownerOperatingContractPresent: true,
        readmePresent: true
      }
    },
    recorded: {
      latestEvent: null,
      portfolio: {
        attention: workstreams
          .filter((entry) => entry.state === "active" || entry.state === "paused")
          .filter((entry) => entry.lifecycle?.state !== "completed")
          .map((entry) => ({
            detail: "fixture",
            projectIds: entry.projectIds,
            state: entry.state === "paused" ? "paused" : "active",
            workstreamId: entry.id
          })),
        projects: [{
          binding: { detail: "fixture", path: "/hq", status: "available" },
          id: "ciel-os",
          observed: { branch: "main", head: "0123", workingTree: { clean: true, entries: [] } },
          repository: { canonicalRemote: null, defaultBranch: "main", identity: "local-only" }
        }],
        validationErrors: [],
        validationWarnings: [],
        workstreams
      }
    },
    reconciliation: { status: "expected-evolution", detail: "fixture" },
    unknowns: [],
    validationErrors: [],
    validationWarnings: [],
    ownerOperatingContract: { path: "OWNER.md", text: "# Owner\n" }
  };
}

test("reports open work in full, paused work in one line, and finished work not at all", () => {
  const brief = briefWakeReport(report([
    workstream("open-lane"),
    workstream("paused-lane", { state: "paused", lifecycle: null }),
    finished("done-lane"),
    workstream("plan-completed", { state: "completed", lifecycle: null }),
    workstream("merged-on-topic-branch", {
      lifecycle: { decisionEventPath: null, detail: "Merged; checkout not on main.", state: "merged-needs-sync" }
    })
  ]), NOW);

  expect(brief.openWork.map((entry) => entry.id)).toEqual(["open-lane"]);
  expect(brief.openWork[0]?.latestRecord?.unresolved).toEqual(["open item of open-lane"]);
  expect(brief.openWork[0]?.latestRecord?.nextAction).toBe("Continue open-lane. Then report back.");
  expect(brief.paused).toEqual([{
    id: "paused-lane",
    stoppedAt: "2026-10-19T10:00:00+07:00",
    record: "memory/events/2026/10/19/20261019T100000_paused-lane.yaml",
    lastNextAction: "Continue paused-lane."
  }]);
  expect(brief.anomalies).toEqual([]);
  expect(JSON.stringify(brief)).not.toContain("done-lane");
  expect(JSON.stringify(brief)).not.toContain("checkpointsByLane");
});

test("finished work and history add nothing to the brief", () => {
  const base = [workstream("open-lane"), workstream("paused-lane", { state: "paused", lifecycle: null })];
  const small = JSON.stringify(briefWakeReport(report(base), NOW));
  const grown = JSON.stringify(briefWakeReport(report([
    ...base,
    ...Array.from({ length: 60 }, (_, index) => finished(`done-${index}`, 40))
  ]), NOW));

  expect(grown).toBe(small);
});

test("raises finished work that is wrong or that Wake could not check", () => {
  const brief = briefWakeReport(report([
    workstream("needs-reconciling", {
      lifecycle: { decisionEventPath: null, detail: "Closeout not in history.", state: "needs-reconciliation" }
    }),
    workstream("branch-left", {
      lifecycle: { decisionEventPath: null, detail: "Topic branch remains.", state: "merged-needs-cleanup" }
    }),
    workstream("completed-but-unmerged", {
      state: "completed",
      lifecycle: { decisionEventPath: null, detail: "Awaiting merge.", state: "awaiting-owner-merge" }
    }),
    {
      ...finished("could-not-check"),
      latestRecord: {
        ...finished("could-not-check").latestRecord!,
        nextActionState: { detail: "git log failed", state: "unknown" }
      }
    }
  ]), NOW);

  expect(brief.anomalies.map((entry) => entry.id)).toEqual(["branch-left", "completed-but-unmerged", "could-not-check"]);
  expect(brief.anomalies.find((entry) => entry.id === "could-not-check")?.detail).toBe("unknown: git log failed");
  // Not finished, so it stays open work, carrying the anomaly with it.
  expect(brief.openWork.find((entry) => entry.id === "needs-reconciling")?.anomaly)
    .toBe("needs-reconciliation: Closeout not in history.");
});

test("names quiet open work and warns when the brief grows past the soft limit", () => {
  const quiet = workstream("quiet-lane", {
    latestRecord: { ...workstream("quiet-lane").latestRecord!, recordedAt: "2026-08-01T10:00:00+07:00" }
  });
  const heavy = workstream("heavy-lane", {
    latestRecord: {
      ...workstream("heavy-lane").latestRecord!,
      unresolved: Array.from({ length: 200 }, (_, index) => `long open item ${index} `.repeat(10))
    }
  });

  const calm = briefWakeReport(report([workstream("open-lane")]), NOW);
  expect(calm.notices).toEqual([]);

  const brief = briefWakeReport(report([workstream("open-lane"), quiet, heavy]), NOW);
  expect(brief.notices[0]).toContain("quiet-lane (80 d)");
  expect(brief.notices[1]).toContain(`soft limit of ${BRIEF_SOFT_LIMIT_BYTES}`);
  expect(brief.notices[1]).toContain("Largest: heavy-lane");
  // A warning only: nothing is cut to fit.
  expect(brief.openWork.find((entry) => entry.id === "heavy-lane")?.latestRecord?.unresolved).toHaveLength(200);
});

test("puts problems first and the owner contract last", () => {
  const keys = Object.keys(briefWakeReport(report([workstream("open-lane")]), NOW));

  expect(keys.slice(0, 4)).toEqual(["validationErrors", "validationWarnings", "reconciliation", "anomalies"]);
  expect(keys.at(-1)).toBe("ownerOperatingContract");
});

test("every fact the full report holds for a workstream stays reachable in its detail", () => {
  const all = [workstream("open-lane"), finished("done-lane", 5), workstream("paused-lane", { state: "paused", lifecycle: null })];
  const full = report(all);

  for (const entry of all) {
    const detail = workstreamDetail(full, entry.id);
    expect(detail?.workstream).toEqual(entry);
    expect(detail?.attention).toEqual(full.recorded.portfolio.attention.filter((item) => item.workstreamId === entry.id));
    expect(detail?.projects.map((project) => project.id)).toEqual(entry.projectIds);
  }
  expect(workstreamDetail(full, "missing")).toBeNull();
  expect(workstreamCandidates(full, "LANE")).toEqual(["open-lane", "done-lane", "paused-lane"]);
});
