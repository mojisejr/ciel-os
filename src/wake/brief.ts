import type { PortfolioAttention, PortfolioProject, PortfolioWorkstream } from "../portfolio/types.ts";
import type { WakeBrief, WakeReport, WakeWorkstreamDetail } from "./types.ts";

// Above this many bytes the brief says so and names what is largest. It is a
// signal, never a cap: nothing is cut, because a report that silently drops
// facts to fit is worse than one that is too long.
export const BRIEF_SOFT_LIMIT_BYTES = 25 * 1024;

// Open work with no record for this long is named once, so the owner knows it
// exists and can ask. Paused work is quiet by definition and is not counted.
export const QUIET_OPEN_WORK_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

// Lifecycles whose final delivery has reached the target branch. On a topic
// branch every merged lane reads merged-needs-sync until the checkout returns
// to main, which is routine and not worth a line.
const DELIVERED = new Set(["completed", "merged-needs-sync", "merged-needs-cleanup"]);

// Finished work is silent. A delivered lifecycle, or a plan its owner marked
// completed, needs no attention unless something about it is wrong; README
// makes the derived lifecycle outrank the plan header.
function isFinished(workstream: PortfolioWorkstream): boolean {
  return workstream.state === "completed" || (workstream.lifecycle !== null && DELIVERED.has(workstream.lifecycle.state));
}

// Something still wrong, or a fact Wake could not establish. "Could not tell"
// is raised, never treated as fine: a report that hides finished work must not
// hide work it failed to check along with it.
function anomalyOf(workstream: PortfolioWorkstream): string | null {
  const lifecycle = workstream.lifecycle;
  if (lifecycle?.state === "needs-reconciliation" || lifecycle?.state === "merged-needs-cleanup") {
    return `${lifecycle.state}: ${lifecycle.detail}`;
  }
  if (workstream.state === "completed" && lifecycle !== null && !DELIVERED.has(lifecycle.state)) {
    return `plan says completed but lifecycle is ${lifecycle.state}: ${lifecycle.detail}`;
  }
  if (workstream.latestRecord?.nextActionState.state === "unknown") {
    return `unknown: ${workstream.latestRecord.nextActionState.detail}`;
  }
  return null;
}

function firstSentence(text: string | null): string | null {
  if (text === null) {
    return null;
  }
  const flat = text.replace(/\s+/g, " ").trim();
  const end = flat.search(/[.!?](\s|$)/);
  return end === -1 ? flat : flat.slice(0, end + 1);
}

function ageInDays(recordedAt: string | null, now: Date): number | null {
  if (recordedAt === null) {
    return null;
  }
  const time = Date.parse(recordedAt);
  return Number.isNaN(time) ? null : Math.floor((now.getTime() - time) / DAY_MS);
}

function projectNeedsAttention(project: PortfolioProject): boolean {
  return project.binding.status !== "available" || project.observed?.workingTree.clean === false;
}

export function briefWakeReport(report: WakeReport, now = new Date()): WakeBrief {
  const portfolio = report.recorded.portfolio;
  const attentionById = new Map<string, PortfolioAttention>(
    portfolio.attention.map((entry) => [entry.workstreamId, entry])
  );

  const anomalies: WakeBrief["anomalies"] = [];
  const openWork: WakeBrief["openWork"] = [];
  const paused: WakeBrief["paused"] = [];

  for (const workstream of portfolio.workstreams) {
    const anomaly = anomalyOf(workstream);
    if (isFinished(workstream)) {
      if (anomaly !== null) {
        anomalies.push({ id: workstream.id, detail: anomaly });
      }
      continue;
    }

    const latest = workstream.latestRecord;
    if (workstream.state === "paused") {
      paused.push({
        id: workstream.id,
        stoppedAt: latest?.recordedAt ?? null,
        record: latest?.eventPath ?? null,
        lastNextAction: firstSentence(latest?.nextAction ?? null)
      });
      continue;
    }

    const attention = attentionById.get(workstream.id);
    openWork.push({
      id: workstream.id,
      state: workstream.state,
      executionState: workstream.executionState,
      lifecycle: workstream.lifecycle === null
        ? null
        : { state: workstream.lifecycle.state, detail: workstream.lifecycle.detail },
      // Only a non-routine attention verdict is repeated here; "active" with
      // verified bindings is the normal case and says nothing new.
      attention: attention === undefined || attention.state === "active"
        ? null
        : { state: attention.state, detail: attention.detail },
      projectIds: workstream.projectIds,
      latestRecord: latest === null
        ? null
        : {
            eventPath: latest.eventPath,
            recordedAt: latest.recordedAt,
            nextAction: latest.nextAction,
            nextActionState: latest.nextActionState.state,
            unresolved: latest.unresolved
          },
      ...(anomaly === null ? {} : { anomaly })
    });
  }

  const quiet = openWork
    .map((entry) => ({ id: entry.id, days: ageInDays(entry.latestRecord?.recordedAt ?? null, now) }))
    .filter((entry): entry is { id: string; days: number } => entry.days !== null && entry.days > QUIET_OPEN_WORK_DAYS);

  const notices: string[] = [];
  if (quiet.length > 0) {
    notices.push(
      `${quiet.length} open workstream(s) have had no record for over ${QUIET_OPEN_WORK_DAYS} days: ` +
        quiet.map((entry) => `${entry.id} (${entry.days} d)`).join(", ") + "."
    );
  }

  const brief: WakeBrief = {
    validationErrors: report.validationErrors,
    validationWarnings: report.validationWarnings,
    reconciliation: report.reconciliation,
    anomalies,
    openWork,
    paused,
    notices,
    repository: report.observed.repository,
    projectsNeedingAttention: portfolio.projects.filter(projectNeedsAttention),
    latestEvent: report.recorded.latestEvent,
    instructions: report.observed.instructions,
    unknowns: report.unknowns,
    howToSeeMore: [
      "Finished workstreams are omitted unless listed under anomalies.",
      "For any one workstream: bun run wake -- --workstream <id> (all recorded facts, including every checkpoint).",
      "For the complete report: bun run wake -- --full.",
      "nextActionState merged: the record has reached origin/main, so its next action may already be done; check before acting."
    ],
    ownerOperatingContract: report.ownerOperatingContract
  };

  // Measured with the notice slot empty, then filled, so the number describes
  // the report a reader receives. The owner text is counted: it is read too.
  const bytes = Buffer.byteLength(JSON.stringify(brief));
  if (bytes > BRIEF_SOFT_LIMIT_BYTES) {
    const largest = [...openWork]
      .map((entry) => ({ id: entry.id, bytes: Buffer.byteLength(JSON.stringify(entry)) }))
      .sort((left, right) => right.bytes - left.bytes)
      .slice(0, 3);
    notices.push(
      `Wake brief is ${bytes} bytes, above the soft limit of ${BRIEF_SOFT_LIMIT_BYTES}. Largest: ` +
        largest.map((entry) => `${entry.id} (${entry.bytes} B)`).join(", ") +
        ". Consider closing finished work, pausing idle work, or shortening long unresolved lists."
    );
  }

  return brief;
}

export function workstreamDetail(report: WakeReport, id: string): WakeWorkstreamDetail | null {
  const portfolio = report.recorded.portfolio;
  const workstream = portfolio.workstreams.find((candidate) => candidate.id === id);
  if (workstream === undefined) {
    return null;
  }
  const projectIds = new Set(workstream.projectIds);
  return {
    workstream,
    attention: portfolio.attention.filter((entry) => entry.workstreamId === id),
    projects: portfolio.projects.filter((project) => projectIds.has(project.id))
  };
}

// A loose name such as "praneet" or "vercel" should lead somewhere rather than
// to nothing, so an unknown id returns the ids that contain it.
export function workstreamCandidates(report: WakeReport, text: string): string[] {
  const needle = text.toLowerCase();
  return report.recorded.portfolio.workstreams
    .map((workstream) => workstream.id)
    .filter((id) => id.toLowerCase().includes(needle));
}
