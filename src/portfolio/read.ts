import { existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { parseDocument } from "yaml";

import type {
  PortfolioAttention,
  PortfolioCheckpoint,
  PortfolioLatestRecord,
  PortfolioProject,
  PortfolioValidationError,
  PortfolioWakeReport,
  PortfolioWorkstream
} from "./types.ts";

interface ProjectIdentity {
  id: string;
  path: string;
  repository: {
    canonicalRemote: string | null;
    defaultBranch: string;
    identity: "local-only" | "remote";
  };
}

interface LocalBinding {
  path: string;
}

interface GitResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

interface WorkstreamEvent {
  lane: string;
  path: string;
  value: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function canonicalizeRemote(remote: string): string {
  const withoutGitSuffix = remote.trim().replace(/\.git$/, "");
  const urlMatch = withoutGitSuffix.match(/^[a-z]+:\/\/([^/]+)\/(.+)$/i);
  if (urlMatch?.[1] !== undefined && urlMatch[2] !== undefined) {
    return `${urlMatch[1]}/${urlMatch[2]}`;
  }

  const sshMatch = withoutGitSuffix.match(/^[^@]+@([^:]+):(.+)$/);
  if (sshMatch?.[1] !== undefined && sshMatch[2] !== undefined) {
    return `${sshMatch[1]}/${sshMatch[2]}`;
  }

  return withoutGitSuffix.replace(/^\/+/, "");
}

async function runGit(repositoryPath: string, arguments_: string[]): Promise<GitResult> {
  const process = Bun.spawn(["git", "-C", repositoryPath, ...arguments_], {
    stderr: "pipe",
    stdout: "pipe"
  });

  return {
    exitCode: await process.exited,
    stderr: await new Response(process.stderr).text(),
    stdout: await new Response(process.stdout).text()
  };
}

function extractProjectIds(plan: string): string[] {
  const projectLinksStart = plan.indexOf("## Project links");
  if (projectLinksStart === -1) {
    return [];
  }
  const afterProjectLinks = plan.slice(projectLinksStart);
  const nextSection = afterProjectLinks.search(/\n## /);
  const projectLinks = nextSection === -1 ? afterProjectLinks : afterProjectLinks.slice(0, nextSection);
  return [...projectLinks.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map((match) => match[1] ?? "");
}

function readPlanField(plan: string, name: string): string | null {
  return plan.match(new RegExp(`^\\*\\*${name}:\\*\\*\\s*(.+?)\\s*$`, "m"))?.[1]?.trim() ?? null;
}

function parsePlan(path: string, text: string): { errors: PortfolioValidationError[]; workstream: PortfolioWorkstream | null } {
  const errors: PortfolioValidationError[] = [];
  const declaredId = readPlanField(text, "Workstream")?.replace(/^`|`$/g, "") ?? null;
  const state = readPlanField(text, "State");
  const lane = readPlanField(text, "Execution lane");
  const planRevision = readPlanField(text, "Plan revision");
  const executionPhase = readPlanField(text, "Execution phase");
  const executionState = readPlanField(text, "Execution state");
  const parallelism = readPlanField(text, "Parallelism");
  const directoryId = path.split("/").at(-2) ?? "";

  if (declaredId === null) {
    errors.push({ path, message: "missing required plan field: Workstream" });
  } else if (declaredId !== directoryId) {
    errors.push({ path, message: "workstream id must match its directory name" });
  }

  if (state !== "active" && state !== "blocked" && state !== "completed" && state !== "paused") {
    errors.push({ path, message: "plan State must be active, blocked, completed, or paused" });
  }

  if (lane === null || !/^[a-z0-9][a-z0-9-]*$/.test(lane)) {
    errors.push({ path, message: "plan Execution lane must be a lowercase lane identifier" });
  }

  if (planRevision === null || !/^\d+\.\d+$/.test(planRevision)) {
    errors.push({ path, message: "plan Plan revision must be a major.minor identifier" });
  }

  if (executionState !== "executing" && executionState !== "idle") {
    errors.push({ path, message: "plan Execution state must be idle or executing" });
  }

  if (executionPhase !== "none" && (executionPhase === null || !/^[1-9]\d*$/.test(executionPhase))) {
    errors.push({ path, message: "plan Execution phase must be none or a positive integer" });
  }

  if (executionState === "executing" && executionPhase === "none") {
    errors.push({ path, message: "plan Execution phase must name a phase while execution is executing" });
  }

  if (parallelism !== "none" && parallelism !== "proposed") {
    errors.push({ path, message: "plan Parallelism must be none or proposed" });
  }

  const declaredSlices = [...text.matchAll(/^### (\d+)\.\s/gm)].map((match) => match[1] as string);
  const projectIds = extractProjectIds(text);
  if (projectIds.length === 0) {
    errors.push({ path, message: "plan must list at least one project under Project links" });
  }

  if (
    errors.length > 0 ||
    declaredId === null ||
    lane === null ||
    state === null ||
    planRevision === null ||
    executionPhase === null ||
    executionState === null ||
    parallelism === null
  ) {
    return { errors, workstream: null };
  }

  return {
    errors,
    workstream: {
      checkpointsByLane: {},
      declaredSlices,
      executionPhase: executionPhase === "none" ? null : executionPhase,
      executionState: executionState as PortfolioWorkstream["executionState"],
      id: declaredId,
      lane,
      latestRecord: null,
      lifecycle: null,
      path,
      planRevision,
      parallelism: parallelism as PortfolioWorkstream["parallelism"],
      projectIds,
      state: state as PortfolioWorkstream["state"]
    }
  };
}

async function readProjectIdentities(repositoryPath: string): Promise<{ errors: PortfolioValidationError[]; projects: ProjectIdentity[] }> {
  const projectsDirectory = join(repositoryPath, "projects");
  if (!existsSync(projectsDirectory)) {
    return { errors: [], projects: [] };
  }
  const paths = [...new Bun.Glob("**/project.yaml").scanSync(projectsDirectory)].sort();
  const errors: PortfolioValidationError[] = [];
  const projects: ProjectIdentity[] = [];

  for (const relativePath of paths) {
    const path = join(projectsDirectory, relativePath);
    const document = parseDocument(await Bun.file(path).text(), { prettyErrors: false });
    const value = document.toJS();

    if (document.errors.length > 0 || !isRecord(value) || !isRecord(value.repository)) {
      errors.push({ path, message: "project identity must be a valid project.yaml mapping" });
      continue;
    }

    const id = readString(value, "id");
    const canonicalRemote = readString(value.repository, "canonical_remote");
    const defaultBranch = readString(value.repository, "default_branch");
    const localOnly = value.repository.local_only === true;
    if (id === null || defaultBranch === null || (localOnly ? canonicalRemote !== null : canonicalRemote === null)) {
      errors.push({ path, message: "project identity is missing a required stable field" });
      continue;
    }

    projects.push({
      id,
      path,
      repository: { canonicalRemote, defaultBranch, identity: localOnly ? "local-only" : "remote" }
    });
  }

  return { errors, projects };
}

async function readLocalBindings(repositoryPath: string): Promise<{ bindings: Map<string, LocalBinding>; errors: PortfolioValidationError[] }> {
  const path = join(repositoryPath, "projects.local.yaml");
  if (!existsSync(path)) {
    return { bindings: new Map(), errors: [] };
  }

  const document = parseDocument(await Bun.file(path).text(), { prettyErrors: false });
  const value = document.toJS();
  if (document.errors.length > 0 || !isRecord(value) || !isRecord(value.bindings)) {
    return { bindings: new Map(), errors: [{ path, message: "local bindings must contain a bindings mapping" }] };
  }

  const bindings = new Map<string, LocalBinding>();
  const errors: PortfolioValidationError[] = [];
  for (const [id, binding] of Object.entries(value.bindings)) {
    if (!isRecord(binding) || readString(binding, "path") === null) {
      errors.push({ path, message: `local binding for ${id} must contain a non-empty path` });
      continue;
    }
    bindings.set(id, { path: readString(binding, "path") ?? "" });
  }

  return { bindings, errors };
}

async function observeProject(repositoryPath: string, project: ProjectIdentity, binding: LocalBinding | undefined): Promise<PortfolioProject> {
  if (binding === undefined) {
    return {
      id: project.id,
      observed: null,
      repository: project.repository,
      binding: { detail: "No machine-local binding is configured for this project.", path: null, status: "unavailable" }
    };
  }

  const path = resolve(repositoryPath, binding.path);
  if (!existsSync(path)) {
    return {
      id: project.id,
      observed: null,
      repository: project.repository,
      binding: { detail: "The configured machine-local path does not exist.", path, status: "unavailable" }
    };
  }

  const remote = await runGit(path, ["remote", "get-url", "origin"]);
  if (project.repository.identity === "local-only" && remote.exitCode === 0) {
    return {
      id: project.id,
      observed: null,
      repository: project.repository,
      binding: { detail: "The declared local-only project must not configure an origin remote.", path, status: "mismatch" }
    };
  }

  if (project.repository.identity === "remote" && remote.exitCode !== 0) {
    return {
      id: project.id,
      observed: null,
      repository: project.repository,
      binding: { detail: "The configured path is not a Git checkout with an origin remote.", path, status: "unavailable" }
    };
  }

  const observedRemote = remote.exitCode === 0 ? canonicalizeRemote(remote.stdout) : null;
  if (project.repository.identity === "remote" && observedRemote !== project.repository.canonicalRemote) {
    return {
      id: project.id,
      observed: null,
      repository: project.repository,
      binding: {
        detail: `The origin remote resolves to ${observedRemote}, not ${project.repository.canonicalRemote}.`,
        path,
        status: "mismatch"
      }
    };
  }

  const [head, branch, status] = await Promise.all([
    runGit(path, ["rev-parse", "HEAD"]),
    runGit(path, ["branch", "--show-current"]),
    runGit(path, ["status", "--porcelain=v1"])
  ]);
  if (head.exitCode !== 0 || branch.exitCode !== 0 || status.exitCode !== 0) {
    return {
      id: project.id,
      observed: null,
      repository: project.repository,
      binding: { detail: "The configured Git checkout could not provide its current state.", path, status: "unavailable" }
    };
  }

  const entries = status.stdout.length === 0 ? [] : status.stdout.trimEnd().split("\n");

  return {
    id: project.id,
    observed: {
      branch: branch.stdout.trim().length > 0 ? branch.stdout.trim() : null,
      head: head.stdout.trim(),
      workingTree: { clean: entries.length === 0, entries }
    },
    repository: project.repository,
    binding: {
      detail: project.repository.identity === "local-only"
        ? "Local Git checkout matches the committed local-only identity."
        : "Local Git origin matches the committed project identity.",
      path,
      status: "available"
    }
  };
}

function checkpointFromEvent(path: string, value: Record<string, unknown>): { checkpoint: PortfolioCheckpoint; lane: string; workstreamId: string | null } {
  const workstream = isRecord(value.workstream) ? value.workstream : {};
  const evidence = isRecord(value.evidence) ? value.evidence : {};
  const repository = isRecord(evidence.repository) ? evidence.repository : {};
  return {
    checkpoint: {
      eventId: readString(value, "id"),
      eventPath: path,
      recordedAt: readString(value, "recorded_at"),
      revision: readString(repository, "head") ?? readString(repository, "base_revision") ?? readString(evidence, "base_revision"),
      type: readString(value, "type")
    },
    lane: readString(workstream, "lane") ?? "single",
    workstreamId: readString(workstream, "id")
  };
}

async function groupCheckpoints(
  repositoryPath: string,
  workstreams: PortfolioWorkstream[]
): Promise<{ errors: PortfolioValidationError[]; events: Map<string, WorkstreamEvent[]> }> {
  const eventsDirectory = join(repositoryPath, "memory/events");
  if (!existsSync(eventsDirectory)) {
    return { errors: [], events: new Map() };
  }
  const workstreamsById = new Map(workstreams.map((workstream) => [workstream.id, workstream]));
  const errors: PortfolioValidationError[] = [];
  const events = new Map<string, WorkstreamEvent[]>();

  for (const relativePath of [...new Bun.Glob("**/*.yaml").scanSync(eventsDirectory)].sort()) {
    const path = join(eventsDirectory, relativePath);
    const document = parseDocument(await Bun.file(path).text(), { prettyErrors: false });
    const value = document.toJS();
    if (document.errors.length > 0 || !isRecord(value)) {
      continue;
    }

    const event = checkpointFromEvent(path, value);
    const workstream = event.workstreamId === null ? undefined : workstreamsById.get(event.workstreamId);
    if (workstream === undefined) {
      continue;
    }
    const checkpoints = workstream.checkpointsByLane[event.lane] ?? [];
    checkpoints.push(event.checkpoint);
    workstream.checkpointsByLane[event.lane] = checkpoints;
    const workstreamEvents = events.get(workstream.id) ?? [];
    workstreamEvents.push({ lane: event.lane, path, value });
    events.set(workstream.id, workstreamEvents);
  }

  return { errors, events };
}

function decisionAuthorizedSlice(event: WorkstreamEvent, workstream: PortfolioWorkstream): string | null {
  const evidence = isRecord(event.value.evidence) ? event.value.evidence : {};
  const slice = readString(evidence, "slice");
  return slice !== null && workstream.declaredSlices.includes(slice) ? slice : null;
}

function decisionAuthorizesPlan(event: WorkstreamEvent, workstream: PortfolioWorkstream): boolean {
  const evidence = isRecord(event.value.evidence) ? event.value.evidence : {};
  const outcome = isRecord(event.value.outcome) ? event.value.outcome : {};
  const recordedBy = isRecord(event.value.recorded_by) ? event.value.recorded_by : {};
  const relativePlanPath = `workstreams/${workstream.id}/PLAN.md`;

  if (
    event.lane !== workstream.lane ||
    readString(event.value, "type") !== "decision" ||
    readString(outcome, "status") !== "decided" ||
    readString(recordedBy, "human") === null ||
    readString(evidence, "plan") !== relativePlanPath ||
    readString(evidence, "plan_revision") !== workstream.planRevision
  ) {
    return false;
  }

  // A decision names the slice it authorizes, and that slice must be one the
  // plan declares. The earlier execution-phase key is still honoured so every
  // decision recorded against a phase-declaring plan keeps authorizing it.
  if (decisionAuthorizedSlice(event, workstream) !== null) {
    return true;
  }

  return workstream.executionPhase !== null && readString(evidence, "execution_phase") === workstream.executionPhase;
}

function decisionAuthorizesParallelism(event: WorkstreamEvent): boolean {
  const outcome = isRecord(event.value.outcome) ? event.value.outcome : {};
  return readString(outcome, "parallelism") === "approved";
}

function isTerminalCloseout(event: WorkstreamEvent, workstream: PortfolioWorkstream): boolean {
  const outcome = isRecord(event.value.outcome) ? event.value.outcome : {};
  const evidence = isRecord(event.value.evidence) ? event.value.evidence : {};
  const status = readString(outcome, "status");

  if (status !== "ready-for-owner-merge" && status !== "draft-pr-closeout-prepared-for-final-pr-review") {
    return false;
  }

  if (readString(evidence, "plan_revision") !== workstream.planRevision) {
    return false;
  }

  // A slice-scoped closeout delivers one slice, not the workstream. Only a
  // closeout naming the last slice the plan declares can be terminal, which the
  // plan states without recording any progress in its header.
  const slice = readString(evidence, "slice");
  if (slice !== null && workstream.declaredSlices.length > 0) {
    return slice === workstream.declaredSlices.at(-1);
  }

  // A plan that still declares a numeric phase keeps the original strict join.
  // A plan following the current policy declares no phase, so a closeout's phase
  // cannot bind it; plan revision alone carries the match.
  if (workstream.executionPhase === null) {
    return true;
  }

  return readString(evidence, "execution_phase") === workstream.executionPhase;
}

function readDelivery(event: WorkstreamEvent): { targetBranch: string; topicBranch: string | null } {
  const evidence = isRecord(event.value.evidence) ? event.value.evidence : {};
  const delivery = isRecord(evidence.delivery) ? evidence.delivery : {};
  const pullRequest = isRecord(evidence.pull_request) ? evidence.pull_request : {};
  return {
    targetBranch: readString(delivery, "target_branch") ?? readString(pullRequest, "base") ?? "main",
    topicBranch: readString(delivery, "topic_branch") ?? readString(pullRequest, "head")
  };
}

async function deriveTerminalLifecycle(
  repositoryPath: string,
  workstream: PortfolioWorkstream,
  events: WorkstreamEvent[]
): Promise<PortfolioWorkstream["lifecycle"]> {
  const event = [...events].reverse().find((candidate) => isTerminalCloseout(candidate, workstream));
  if (event === undefined) {
    return null;
  }

  const eventPath = relative(repositoryPath, event.path);
  const eventCommit = await runGit(repositoryPath, ["log", "-1", "--format=%H", "--", eventPath]);
  if (eventCommit.exitCode !== 0 || eventCommit.stdout.trim().length === 0) {
    return {
      decisionEventPath: null,
      detail: "The final closeout is not present in local Git history; inspect before continuing.",
      state: "needs-reconciliation"
    };
  }

  const delivery = readDelivery(event);
  const remoteTarget = `refs/remotes/origin/${delivery.targetBranch}`;
  const remoteExists = await runGit(repositoryPath, ["show-ref", "--verify", "--quiet", remoteTarget]);
  if (remoteExists.exitCode !== 0) {
    return {
      decisionEventPath: null,
      detail: `No fetched ${remoteTarget} ref is available to reconcile the final closeout.`,
      state: "needs-reconciliation"
    };
  }

  const merged = await runGit(repositoryPath, ["merge-base", "--is-ancestor", eventCommit.stdout.trim(), remoteTarget]);
  if (merged.exitCode === 1) {
    return {
      decisionEventPath: null,
      detail: "The final closeout is committed locally but is not yet reachable from fetched origin/main.",
      state: "awaiting-owner-merge"
    };
  }
  if (merged.exitCode !== 0) {
    return {
      decisionEventPath: null,
      detail: "Git could not reconcile the final closeout against the fetched target branch.",
      state: "needs-reconciliation"
    };
  }

  const [head, branch, status, targetHead] = await Promise.all([
    runGit(repositoryPath, ["rev-parse", "HEAD"]),
    runGit(repositoryPath, ["branch", "--show-current"]),
    runGit(repositoryPath, ["status", "--porcelain=v1"]),
    runGit(repositoryPath, ["rev-parse", remoteTarget])
  ]);
  if (
    head.exitCode !== 0 || branch.exitCode !== 0 || status.exitCode !== 0 || targetHead.exitCode !== 0 ||
    branch.stdout.trim() !== delivery.targetBranch || head.stdout.trim() !== targetHead.stdout.trim() || status.stdout.length > 0
  ) {
    return {
      decisionEventPath: null,
      detail: "The final closeout has merged, but this checkout has not returned to a clean, current target branch.",
      state: "merged-needs-sync"
    };
  }

  if (delivery.topicBranch !== null) {
    for (const reference of [`refs/heads/${delivery.topicBranch}`, `refs/remotes/origin/${delivery.topicBranch}`]) {
      const exists = await runGit(repositoryPath, ["show-ref", "--verify", "--quiet", reference]);
      if (exists.exitCode === 0) {
        const fullyMerged = await runGit(repositoryPath, ["merge-base", "--is-ancestor", reference, remoteTarget]);
        if (fullyMerged.exitCode !== 0) {
          return {
            decisionEventPath: null,
            detail: `The topic branch at ${reference} has commits outside the fetched target branch; do not clean it up.`,
            state: "needs-reconciliation"
          };
        }
        return {
          decisionEventPath: null,
          detail: `The merged topic branch still exists at ${reference}; clean it up after confirming no open PR references it.`,
          state: "merged-needs-cleanup"
        };
      }
    }
  }

  return {
    decisionEventPath: null,
    detail: "The final closeout is reachable from fetched origin/main and this checkout is clean, current, and branch-cleaned.",
    state: "completed"
  };
}

function readStringList(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()) : [];
}

// The most recent record for a workstream, read for what it tells a person to
// do rather than for reconciliation. Knowing what was last proposed is what
// makes a later change of direction legible instead of unexplained.
function readLatestRecord(repositoryPath: string, events: WorkstreamEvent[]): PortfolioLatestRecord | null {
  const event = events.at(-1);
  if (event === undefined) {
    return null;
  }
  const nextAction = isRecord(event.value.next_action) ? readString(event.value.next_action, "action") : null;
  return {
    eventPath: relative(repositoryPath, event.path),
    nextAction,
    recordedAt: readString(event.value, "recorded_at"),
    unresolved: readStringList(event.value, "unresolved")
  };
}

// HQ is the project bound to the repository root. Every workstream lists it,
// because plans and events live there, so counting it would make each pair of
// concurrent workstreams look like a collision and would let HQ's own working
// state decide whether unrelated work needs reconciling. It is identified from
// the binding that already exists rather than from a new field.
function headquartersProjectIds(repositoryPath: string, projects: PortfolioProject[]): Set<string> {
  return new Set(projects.filter((project) => project.binding.path === repositoryPath).map((project) => project.id));
}

// A workstream stops occupying its projects once its work has reached the
// target branch. `completed` says the checkout has caught up as well;
// `merged-needs-sync` says only that this checkout has not, which is a fact
// about the desk rather than about the work.
function occupiesItsProjects(workstream: PortfolioWorkstream): boolean {
  return workstream.state === "active"
    && workstream.lifecycle?.state !== "completed"
    && workstream.lifecycle?.state !== "merged-needs-sync";
}

async function deriveLifecycle(
  repositoryPath: string,
  workstreams: PortfolioWorkstream[],
  projects: PortfolioProject[],
  eventsByWorkstream: Map<string, WorkstreamEvent[]>
): Promise<void> {
  for (const workstream of workstreams) {
    if (workstream.state !== "active") {
      continue;
    }
    const terminalLifecycle = await deriveTerminalLifecycle(repositoryPath, workstream, eventsByWorkstream.get(workstream.id) ?? []);
    if (terminalLifecycle !== null) {
      workstream.lifecycle = terminalLifecycle;
    }
  }

  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const headquarters = headquartersProjectIds(repositoryPath, projects);
  const activeByProject = new Map<string, string[]>();
  for (const workstream of workstreams.filter(occupiesItsProjects)) {
    for (const projectId of workstream.projectIds.filter((id) => !headquarters.has(id))) {
      const ids = activeByProject.get(projectId) ?? [];
      ids.push(workstream.id);
      activeByProject.set(projectId, ids);
    }
  }

  for (const workstream of workstreams) {
    if (workstream.state !== "active") {
      continue;
    }
    if (workstream.lifecycle !== null) {
      continue;
    }
    const matchingDecisions = (eventsByWorkstream.get(workstream.id) ?? []).filter((event) => decisionAuthorizesPlan(event, workstream));
    const decision = matchingDecisions.at(-1) ?? null;
    const conflicts = workstream.projectIds.filter((projectId) => (activeByProject.get(projectId)?.length ?? 0) > 1);
    const parallelismApproved = decision !== null && decisionAuthorizesParallelism(decision);
    if ((workstream.parallelism === "proposed" || conflicts.length > 0) && !parallelismApproved) {
      workstream.lifecycle = {
        decisionEventPath: decision?.path ?? null,
        detail: "Parallel execution or same-project overlap requires an explicit owner decision for parallelism.",
        state: "owner-confirmation-required"
      };
      continue;
    }
    // A claimed lane cannot be told apart from an abandoned one. Sessions are
    // not recorded, so nothing here can establish whether one is still running.
    // Report the marker and what the projects look like; leave the conclusion
    // to a person rather than asserting that the work was left behind.
    if (workstream.executionState === "executing") {
      const unsettledProjects = workstream.projectIds.filter((projectId) => {
        if (headquarters.has(projectId)) {
          return false;
        }
        const project = projectsById.get(projectId);
        return project?.binding.status !== "available" || project.observed?.workingTree.clean !== true;
      });
      workstream.lifecycle = {
        decisionEventPath: decision?.path ?? null,
        detail: unsettledProjects.length > 0
          ? `This lane is claimed and has no closeout, and has uncommitted or unverified work in: ${unsettledProjects.join(", ")}. It is either running in another session or was interrupted; establish which with the owner before touching it.`
          : "This lane is claimed and has no closeout, and its projects are clean. It is either running in another session or was interrupted; establish which with the owner before touching it.",
        state: "claimed"
      };
      continue;
    }
    if (decision === null) {
      workstream.lifecycle = {
        decisionEventPath: null,
        detail: workstream.executionPhase === null
          ? `No owner decision names a declared slice of plan revision ${workstream.planRevision}.`
          : `No owner decision authorizes plan revision ${workstream.planRevision} phase ${workstream.executionPhase}.`,
        state: "needs-owner-decision"
      };
      continue;
    }
    const authorizedSlice = decisionAuthorizedSlice(decision, workstream);
    workstream.lifecycle = {
      decisionEventPath: decision.path,
      detail: authorizedSlice !== null
        ? `Owner decision authorizes plan revision ${workstream.planRevision} slice ${authorizedSlice}.`
        : `Owner decision authorizes plan revision ${workstream.planRevision} phase ${workstream.executionPhase}.`,
      state: "authorized"
    };
  }
}

function deriveAttention(repositoryPath: string, workstreams: PortfolioWorkstream[], projects: PortfolioProject[]): PortfolioAttention[] {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const headquarters = headquartersProjectIds(repositoryPath, projects);
  const activeByProject = new Map<string, string[]>();
  for (const workstream of workstreams.filter(occupiesItsProjects)) {
    for (const projectId of workstream.projectIds.filter((id) => !headquarters.has(id))) {
      const ids = activeByProject.get(projectId) ?? [];
      ids.push(workstream.id);
      activeByProject.set(projectId, ids);
    }
  }

  return workstreams.flatMap<PortfolioAttention>((workstream) => {
    // Work that has reached the target branch needs no attention. Whether this
    // checkout has caught up is reported on the workstream itself, so a lane
    // that is merged but unsynced stays visible without being raised here.
    if (workstream.state === "completed" || workstream.lifecycle?.state === "completed" || workstream.lifecycle?.state === "merged-needs-sync") {
      return [];
    }
    if (workstream.state === "paused" || workstream.state === "blocked") {
      return [{
        detail: `Plan state is ${workstream.state}.`,
        projectIds: workstream.projectIds,
        state: workstream.state,
        workstreamId: workstream.id
      }];
    }

    const unavailable = workstream.projectIds.filter((id) => projectById.get(id)?.binding.status !== "available");
    if (unavailable.length > 0) {
      return [{
        detail: `Local Git verification is unavailable or mismatched for: ${unavailable.join(", ")}.`,
        projectIds: workstream.projectIds,
        state: "unavailable",
        workstreamId: workstream.id
      }];
    }

    const conflictingProjects = workstream.projectIds.filter((id) => (activeByProject.get(id)?.length ?? 0) > 1);
    if (conflictingProjects.length > 0) {
      return [{
        detail: `Active workstreams overlap on: ${conflictingProjects.join(", ")}; owner confirmation is required before parallel execution.`,
        projectIds: workstream.projectIds,
        state: "conflict",
        workstreamId: workstream.id
      }];
    }

    return [{
      detail: "All referenced projects have verified machine-local Git bindings.",
      projectIds: workstream.projectIds,
      state: "active",
      workstreamId: workstream.id
    }];
  });
}

export async function readPortfolioWakeReport(repositoryDirectory = "."): Promise<PortfolioWakeReport> {
  const repositoryPath = resolve(repositoryDirectory);
  const validationErrors: PortfolioValidationError[] = [];
  const { errors: projectErrors, projects: projectIdentities } = await readProjectIdentities(repositoryPath);
  validationErrors.push(...projectErrors);
  const { bindings, errors: bindingErrors } = await readLocalBindings(repositoryPath);
  validationErrors.push(...bindingErrors);

  const projects = await Promise.all(projectIdentities.map((project) => observeProject(repositoryPath, project, bindings.get(project.id))));
  const workstreams: PortfolioWorkstream[] = [];
  const workstreamsDirectory = join(repositoryPath, "workstreams");
  if (!existsSync(workstreamsDirectory)) {
    return { attention: [], projects, validationErrors, workstreams };
  }
  for (const relativePath of [...new Bun.Glob("*/PLAN.md").scanSync(workstreamsDirectory)].sort()) {
    const path = join(workstreamsDirectory, relativePath);
    const parsed = parsePlan(path, await Bun.file(path).text());
    validationErrors.push(...parsed.errors);
    if (parsed.workstream !== null) {
      workstreams.push(parsed.workstream);
    }
  }

  const checkpoints = await groupCheckpoints(repositoryPath, workstreams);
  validationErrors.push(...checkpoints.errors);
  for (const workstream of workstreams) {
    workstream.latestRecord = readLatestRecord(repositoryPath, checkpoints.events.get(workstream.id) ?? []);
  }
  await deriveLifecycle(repositoryPath, workstreams, projects, checkpoints.events);
  return {
    attention: deriveAttention(repositoryPath, workstreams, projects),
    projects,
    validationErrors,
    workstreams
  };
}
