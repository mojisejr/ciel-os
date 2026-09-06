import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { expect, test } from "bun:test";

import { readPortfolioWakeReport } from "../../src/portfolio/read.ts";

function git(repositoryPath: string, arguments_: string[]): string {
  const process = Bun.spawnSync(["git", "-C", repositoryPath, ...arguments_], { stderr: "pipe", stdout: "pipe" });
  if (process.exitCode !== 0) {
    throw new Error(`git ${arguments_.join(" ")} failed: ${new TextDecoder().decode(process.stderr)}`);
  }
  return new TextDecoder().decode(process.stdout).trim();
}

async function createProject(path: string, id: string): Promise<void> {
  await mkdir(path, { recursive: true });
  git(path, ["init", "--initial-branch=main"]);
  git(path, ["config", "user.name", "CIEL test"]);
  git(path, ["config", "user.email", "ciel-test@example.invalid"]);
  await writeFile(join(path, "README.md"), `# ${id}\n`);
  git(path, ["add", "README.md"]);
  git(path, ["commit", "-m", "initial fixture"]);
  git(path, ["remote", "add", "origin", `https://github.com/example/${id}.git`]);
}

async function createLocalProject(path: string, id: string): Promise<void> {
  await mkdir(path, { recursive: true });
  git(path, ["init", "--initial-branch=main"]);
  git(path, ["config", "user.name", "CIEL test"]);
  git(path, ["config", "user.email", "ciel-test@example.invalid"]);
  await writeFile(join(path, "README.md"), `# ${id}\n`);
  git(path, ["add", "README.md"]);
  git(path, ["commit", "-m", "initial fixture"]);
}

function projectYaml(id: string): string {
  return [
    "schema_version: ciel.project.v0.1",
    `id: ${id}`,
    "repository:",
    "  vcs: git",
    `  canonical_remote: github.com/example/${id}`,
    "  default_branch: main",
    ""
  ].join("\n");
}

function localProjectYaml(id: string): string {
  return [
    "schema_version: ciel.project.v0.1",
    `id: ${id}`,
    "repository:",
    "  vcs: git",
    "  local_only: true",
    "  default_branch: main",
    ""
  ].join("\n");
}

function plan(
  id: string,
  state: string,
  projectIds: string[],
  options: { executionPhase?: string; executionState?: "executing" | "idle"; parallelism?: "none" | "proposed"; revision?: string } = {}
): string {
  return [
    `# ${id}`,
    "",
    `**Workstream:** \`${id}\`  `,
    `**State:** ${state}  `,
    "**Execution lane:** single  ",
    `**Plan revision:** ${options.revision ?? "1.0"}  `,
    `**Execution phase:** ${options.executionPhase ?? "1"}  `,
    `**Execution state:** ${options.executionState ?? "idle"}  `,
    `**Parallelism:** ${options.parallelism ?? "none"}`,
    "",
    "## Project links",
    "",
    "| Project ID | Role | Local binding |",
    "|---|---|---|",
    ...projectIds.map((projectId) => `| \`${projectId}\` | fixture | local |`),
    ""
  ].join("\n");
}

function event(id: string, workstreamId: string, revision: string): string {
  return [
    "schema_version: ciel.event.v0.1",
    `id: evt_${id}`,
    "type: closeout",
    "recorded_at: 2026-08-29T00:00:00+07:00",
    "recorded_by:",
    "  agent: test",
    "workstream:",
    `  id: ${workstreamId}`,
    "  objective: fixture",
    "  scope: []",
    "  out_of_scope: []",
    "outcome:",
    "  status: prepared",
    "evidence:",
    `  base_revision: ${revision}`,
    "unresolved: []",
    "next_action:",
    "  action: fixture",
    ""
  ].join("\n");
}

function decision(id: string, workstreamId: string, planRevision: string, parallelism = "not-proposed", executionPhase = "1"): string {
  return [
    "schema_version: ciel.event.v0.1",
    `id: evt_${id}`,
    "type: decision",
    "recorded_at: 2026-08-29T00:00:00+07:00",
    "recorded_by:",
    "  human: owner",
    "  agent: test",
    "workstream:",
    `  id: ${workstreamId}`,
    "  lane: single",
    "  objective: fixture",
    "  scope: []",
    "  out_of_scope: []",
    "outcome:",
    "  status: decided",
    `  parallelism: ${parallelism}`,
    "evidence:",
    `  plan: workstreams/${workstreamId}/PLAN.md`,
    `  plan_revision: "${planRevision}"`,
    `  execution_phase: "${executionPhase}"`,
    "unresolved: []",
    "next_action:",
    "  action: fixture",
    ""
  ].join("\n");
}

function sliceDecision(id: string, workstreamId: string, planRevision: string, slice: string): string {
  return [
    "schema_version: ciel.event.v0.1",
    `id: evt_${id}`,
    "type: decision",
    "recorded_at: 2026-08-29T00:00:00+07:00",
    "recorded_by:",
    "  human: owner",
    "  agent: test",
    "workstream:",
    `  id: ${workstreamId}`,
    "  lane: single",
    "  objective: fixture",
    "outcome:",
    "  status: decided",
    "  parallelism: not-proposed",
    "evidence:",
    `  plan: workstreams/${workstreamId}/PLAN.md`,
    `  plan_revision: "${planRevision}"`,
    `  slice: "${slice}"`,
    "unresolved: []",
    "next_action:",
    "  action: fixture",
    ""
  ].join("\n");
}

function slicedPlan(id: string, projectIds: string[], sliceCount: number, revision: string): string {
  return [
    `# ${id}`,
    "",
    `**Workstream:** \`${id}\`  `,
    "**State:** active  ",
    "**Execution lane:** single  ",
    `**Plan revision:** ${revision}  `,
    "**Execution phase:** none  ",
    "**Execution state:** idle  ",
    "**Parallelism:** none",
    "",
    "## Project links",
    "",
    "| Project ID | Role | Local binding |",
    "|---|---|---|",
    ...projectIds.map((projectId) => `| \`${projectId}\` | fixture | local |`),
    "",
    "## Execution slices and acceptance criteria",
    "",
    ...Array.from({ length: sliceCount }, (_, index) => [`### ${index + 1}. fixture slice`, ""]).flat()
  ].join("\n");
}

async function addPlan(
  root: string,
  id: string,
  state: string,
  projectIds: string[],
  options: { executionPhase?: string; executionState?: "executing" | "idle"; parallelism?: "none" | "proposed"; revision?: string } = {}
): Promise<void> {
  const directory = join(root, "workstreams", id);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "PLAN.md"), plan(id, state, projectIds, options));
}

function terminalCloseout(workstreamId: string, revision: string): string {
  return [
    "schema_version: ciel.event.v0.1",
    "id: evt_20260904T000000_terminal_fixture",
    "type: closeout",
    "recorded_at: 2026-09-04T00:00:00+07:00",
    "recorded_by:",
    "  agent: test",
    "workstream:",
    `  id: ${workstreamId}`,
    "  lane: single",
    "  objective: fixture",
    "outcome:",
    "  status: ready-for-owner-merge",
    "evidence:",
    `  base_revision: ${revision}`,
    "  plan_revision: \"4.0\"",
    "  execution_phase: \"1\"",
    "  delivery:",
    "    target_branch: main",
    "    topic_branch: feat/fixture",
    "unresolved: []",
    "next_action:",
    "  action: owner merge",
    ""
  ].join("\n");
}

function sliceCloseout(workstreamId: string, revision: string, planRevision: string, slice: string): string {
  return [
    "schema_version: ciel.event.v0.1",
    `id: evt_20260904T000001_slice_${slice}`,
    "type: closeout",
    "recorded_at: 2026-09-04T00:00:01+07:00",
    "recorded_by:",
    "  agent: test",
    "workstream:",
    `  id: ${workstreamId}`,
    "  lane: single",
    "  objective: fixture",
    "outcome:",
    "  status: ready-for-owner-merge",
    "evidence:",
    `  base_revision: ${revision}`,
    `  plan_revision: "${planRevision}"`,
    `  slice: "${slice}"`,
    "  delivery:",
    "    target_branch: main",
    "    topic_branch: feat/fixture",
    "unresolved: []",
    "next_action:",
    "  action: owner merge",
    ""
  ].join("\n");
}

async function initializeWorkspace(root: string): Promise<void> {
  git(root, ["init", "--initial-branch=main"]);
  git(root, ["config", "user.name", "CIEL test"]);
  git(root, ["config", "user.email", "ciel-test@example.invalid"]);
  await writeFile(join(root, "README.md"), "# workspace\n");
  await writeFile(join(root, "AGENTS.md"), "# instructions\n");
  git(root, ["add", "README.md", "AGENTS.md"]);
  git(root, ["commit", "-m", "workspace fixture"]);
}

test("derives attention from plans, verified local projects, and per-lane checkpoints", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    const ready = join(root, "checkouts", "ready");
    const shared = join(root, "checkouts", "shared");
    await createProject(ready, "ready");
    await createProject(shared, "shared");
    for (const id of ["ready", "shared", "missing"]) {
      const directory = join(root, "projects", id);
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, "project.yaml"), projectYaml(id));
    }
    await writeFile(
      join(root, "projects.local.yaml"),
      [
        "bindings:",
        "  ready:",
        "    path: checkouts/ready",
        "  shared:",
        "    path: checkouts/shared",
        "  missing:",
        "    path: checkouts/missing",
        ""
      ].join("\n")
    );
    await addPlan(root, "active-ready", "active", ["ready"]);
    await addPlan(root, "paused", "paused", ["ready"]);
    await addPlan(root, "blocked", "blocked", ["ready"]);
    await addPlan(root, "unavailable", "active", ["missing"]);
    await addPlan(root, "conflict-one", "active", ["shared"]);
    await addPlan(root, "conflict-two", "active", ["shared"]);
    await addPlan(root, "completed", "completed", ["ready"]);
    const eventsDirectory = join(root, "memory/events/2026/08/29");
    await mkdir(eventsDirectory, { recursive: true });
    const revision = git(ready, ["rev-parse", "HEAD"]);
    await writeFile(join(eventsDirectory, "20260829T000000_closeout.yaml"), event("one", "active-ready", revision));
    await writeFile(join(eventsDirectory, "20260829T000001_closeout.yaml"), event("two", "active-ready", revision));

    const report = await readPortfolioWakeReport(root);
    const attention = new Map(report.attention.map((item) => [item.workstreamId, item.state]));

    expect(report.validationErrors).toEqual([]);
    expect(attention).toEqual(
      new Map([
        ["active-ready", "active"],
        ["paused", "paused"],
        ["blocked", "blocked"],
        ["unavailable", "unavailable"],
        ["conflict-one", "conflict"],
        ["conflict-two", "conflict"]
      ])
    );
    expect(attention.has("completed")).toBe(false);
    expect(report.projects.find((project) => project.id === "missing")?.binding.status).toBe("unavailable");
    expect(report.projects.find((project) => project.id === "ready")?.observed).toEqual(
      expect.objectContaining({ branch: "main", workingTree: { clean: true, entries: [] } })
    );
    expect(report.workstreams.find((workstream) => workstream.id === "active-ready")?.checkpointsByLane.single).toHaveLength(2);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("requires a current owner decision, reports a claimed lane without judging it, and holds proposed parallelism", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    const bindings: string[] = ["bindings:"];
    const checkouts = new Map<string, string>();
    for (const id of ["authorized-app", "stale-app", "interrupted-app", "clean-interrupted-app", "parallel-app"]) {
      const checkout = join(root, "checkouts", id);
      checkouts.set(id, checkout);
      await createProject(checkout, id);
      const projectDirectory = join(root, "projects", id);
      await mkdir(projectDirectory, { recursive: true });
      await writeFile(join(projectDirectory, "project.yaml"), projectYaml(id));
      bindings.push(`  ${id}:`, `    path: checkouts/${id}`);
    }
    await writeFile(join(root, "projects.local.yaml"), [...bindings, ""].join("\n"));
    await addPlan(root, "authorized", "active", ["authorized-app"], { revision: "2.0" });
    await addPlan(root, "stale-decision", "active", ["stale-app"], { revision: "2.1" });
    await addPlan(root, "interrupted", "active", ["interrupted-app"], { executionState: "executing", revision: "2.0" });
    await addPlan(root, "clean-interrupted", "active", ["clean-interrupted-app"], { executionState: "executing", revision: "2.0" });
    await addPlan(root, "parallel", "active", ["parallel-app"], { parallelism: "proposed", revision: "2.0" });
    const eventsDirectory = join(root, "memory/events/2026/08/29");
    await mkdir(eventsDirectory, { recursive: true });
    await writeFile(join(eventsDirectory, "20260829T000000_decision.yaml"), decision("authorized", "authorized", "2.0"));
    await writeFile(join(eventsDirectory, "20260829T000001_decision.yaml"), decision("stale", "stale-decision", "2.0"));
    await writeFile(join(eventsDirectory, "20260829T000002_decision.yaml"), decision("interrupted", "interrupted", "2.0"));
    await writeFile(join(checkouts.get("interrupted-app") ?? "", "README.md"), "# dirty interrupted fixture\n");

    const report = await readPortfolioWakeReport(root);
    const lifecycle = new Map(report.workstreams.map((workstream) => [workstream.id, workstream.lifecycle?.state]));

    expect(report.validationErrors).toEqual([]);
    expect(lifecycle).toEqual(
      new Map([
        ["authorized", "authorized"],
        ["stale-decision", "needs-owner-decision"],
        ["interrupted", "claimed"],
        ["clean-interrupted", "claimed"],
        ["parallel", "owner-confirmation-required"]
      ])
    );

    // A claimed lane must be described, not diagnosed: nothing here can tell a
    // running session from an abandoned one, so neither detail may say so.
    const detailOf = new Map(report.workstreams.map((workstream) => [workstream.id, workstream.lifecycle?.detail ?? ""]));
    expect(detailOf.get("interrupted")).toContain("interrupted-app");
    for (const id of ["interrupted", "clean-interrupted"]) {
      expect(detailOf.get(id)).toContain("either running in another session or was interrupted");
      expect(detailOf.get(id)).not.toContain("left open");
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("does not authorize a Phase 4 decision for Phase 5 execution", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    const checkout = join(root, "checkouts", "pilot-app");
    await createProject(checkout, "pilot-app");
    const projectDirectory = join(root, "projects", "pilot-app");
    await mkdir(projectDirectory, { recursive: true });
    await writeFile(join(projectDirectory, "project.yaml"), projectYaml("pilot-app"));
    await writeFile(join(root, "projects.local.yaml"), ["bindings:", "  pilot-app:", "    path: checkouts/pilot-app", ""].join("\n"));
    await addPlan(root, "pilot-phase-five", "active", ["pilot-app"], { executionPhase: "5", revision: "3.0" });
    const eventsDirectory = join(root, "memory/events/2026/08/29");
    await mkdir(eventsDirectory, { recursive: true });
    await writeFile(join(eventsDirectory, "20260829T000000_decision.yaml"), decision("phase-four", "pilot-phase-five", "3.0", "not-proposed", "4"));

    const report = await readPortfolioWakeReport(root);
    const workstream = report.workstreams.find((item) => item.id === "pilot-phase-five");

    expect(report.validationErrors).toEqual([]);
    expect(workstream?.lifecycle).toEqual(expect.objectContaining({ state: "needs-owner-decision" }));
    expect(workstream?.lifecycle?.detail).toContain("phase 5");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("derives remote delivery lifecycle from a closeout-bearing commit instead of plan execution state", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    await initializeWorkspace(root);
    git(root, ["remote", "add", "origin", "https://github.com/example/hq.git"]);
    await mkdir(join(root, "projects", "hq"), { recursive: true });
    await writeFile(join(root, "projects", "hq", "project.yaml"), projectYaml("hq"));
    await writeFile(join(root, "projects.local.yaml"), ["bindings:", "  hq:", "    path: .", ""].join("\n"));
    await addPlan(root, "delivery", "active", ["hq"], { executionState: "executing", revision: "4.0" });
    await addPlan(root, "new-work", "active", ["hq"], { executionState: "idle", revision: "4.0" });
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "declare delivery plan"]);
    const base = git(root, ["rev-parse", "HEAD"]);
    git(root, ["update-ref", "refs/remotes/origin/main", base]);

    const eventsDirectory = join(root, "memory/events/2026/09/04");
    await mkdir(eventsDirectory, { recursive: true });
    await writeFile(join(eventsDirectory, "20260904T000000_terminal.yaml"), terminalCloseout("delivery", base));
    git(root, ["add", "memory"]);
    git(root, ["commit", "-m", "record final closeout"]);
    const closeoutCommit = git(root, ["rev-parse", "HEAD"]);

    let report = await readPortfolioWakeReport(root);
    expect(report.workstreams.find((item) => item.id === "delivery")?.lifecycle?.state).toBe("awaiting-owner-merge");

    git(root, ["update-ref", "refs/remotes/origin/main", closeoutCommit]);
    git(root, ["switch", "-c", "stale"]);
    report = await readPortfolioWakeReport(root);
    expect(report.workstreams.find((item) => item.id === "delivery")?.lifecycle?.state).toBe("merged-needs-sync");
    // The work has reached origin/main; only this checkout is behind. That must
    // not raise attention, and must not make the workstream occupy its projects.
    expect(report.attention.some((item) => item.workstreamId === "delivery")).toBe(false);
    expect(report.attention.every((item) => item.state !== "conflict")).toBe(true);

    git(root, ["switch", "main"]);
    git(root, ["branch", "feat/fixture"]);
    report = await readPortfolioWakeReport(root);
    expect(report.workstreams.find((item) => item.id === "delivery")?.lifecycle?.state).toBe("merged-needs-cleanup");

    git(root, ["branch", "-d", "feat/fixture"]);
    report = await readPortfolioWakeReport(root);
    expect(report.workstreams.find((item) => item.id === "delivery")?.lifecycle).toEqual(expect.objectContaining({ state: "completed" }));
    expect(report.attention.some((item) => item.workstreamId === "delivery")).toBe(false);
    expect(report.attention).toEqual([expect.objectContaining({ state: "active", workstreamId: "new-work" })]);

    git(root, ["switch", "-c", "feat/fixture"]);
    await writeFile(join(root, "unmerged.md"), "# unmerged\n");
    git(root, ["add", "unmerged.md"]);
    git(root, ["commit", "-m", "unmerged fixture evidence"]);
    git(root, ["switch", "main"]);
    report = await readPortfolioWakeReport(root);
    expect(report.workstreams.find((item) => item.id === "delivery")?.lifecycle?.state).toBe("needs-reconciliation");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("verifies a declared local-only Git checkout without an origin remote", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    const checkout = join(root, "checkouts", "local-pilot");
    await createLocalProject(checkout, "local-pilot");
    const projectDirectory = join(root, "projects", "local-pilot");
    await mkdir(projectDirectory, { recursive: true });
    await writeFile(join(projectDirectory, "project.yaml"), localProjectYaml("local-pilot"));
    await writeFile(join(root, "projects.local.yaml"), ["bindings:", "  local-pilot:", "    path: checkouts/local-pilot", ""].join("\n"));
    await addPlan(root, "local-pilot-workstream", "active", ["local-pilot"]);

    const report = await readPortfolioWakeReport(root);
    const project = report.projects.find((item) => item.id === "local-pilot");

    expect(report.validationErrors).toEqual([]);
    expect(project?.binding).toEqual(expect.objectContaining({ status: "available" }));
    expect(project?.repository).toEqual(expect.objectContaining({ canonicalRemote: null, identity: "local-only" }));
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("reports a mismatched local Git remote without treating it as a valid binding", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    const checkout = join(root, "checkouts", "expected-project");
    await createProject(checkout, "other-project");
    const projectDirectory = join(root, "projects", "expected-project");
    await mkdir(projectDirectory, { recursive: true });
    await writeFile(join(projectDirectory, "project.yaml"), projectYaml("expected-project"));
    await writeFile(
      join(root, "projects.local.yaml"),
      ["bindings:", "  expected-project:", "    path: checkouts/expected-project", ""].join("\n")
    );
    await addPlan(root, "needs-expected", "active", ["expected-project"]);

    const report = await readPortfolioWakeReport(root);

    expect(report.validationErrors).toEqual([]);
    expect(report.projects[0]?.binding).toEqual(expect.objectContaining({ status: "mismatch" }));
    expect(report.projects[0]?.observed).toBeNull();
    expect(report.attention).toEqual([expect.objectContaining({ state: "unavailable", workstreamId: "needs-expected" })]);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("authorizes a plan that declares no execution phase when a decision names a declared slice", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    const bindings: string[] = ["bindings:"];
    for (const id of ["sliced-app", "undeclared-app"]) {
      const checkout = join(root, "checkouts", id);
      await createProject(checkout, id);
      const projectDirectory = join(root, "projects", id);
      await mkdir(projectDirectory, { recursive: true });
      await writeFile(join(projectDirectory, "project.yaml"), projectYaml(id));
      bindings.push(`  ${id}:`, `    path: checkouts/${id}`);
    }
    await writeFile(join(root, "projects.local.yaml"), [...bindings, ""].join("\n"));

    for (const [id, projectId] of [["sliced", "sliced-app"], ["undeclared", "undeclared-app"]] as const) {
      const directory = join(root, "workstreams", id);
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, "PLAN.md"), slicedPlan(id, [projectId], 3, "5.0"));
    }

    const eventsDirectory = join(root, "memory/events/2026/08/29");
    await mkdir(eventsDirectory, { recursive: true });
    await writeFile(join(eventsDirectory, "20260829T000000_decision.yaml"), sliceDecision("sliced", "sliced", "5.0", "2"));
    await writeFile(join(eventsDirectory, "20260829T000001_decision.yaml"), sliceDecision("undeclared", "undeclared", "5.0", "9"));

    const report = await readPortfolioWakeReport(root);
    const sliced = report.workstreams.find((item) => item.id === "sliced");
    const undeclared = report.workstreams.find((item) => item.id === "undeclared");

    expect(report.validationErrors).toEqual([]);
    expect(sliced?.declaredSlices).toEqual(["1", "2", "3"]);
    expect(sliced?.lifecycle?.state).toBe("authorized");
    expect(sliced?.lifecycle?.detail).toContain("slice 2");
    expect(undeclared?.lifecycle?.state).toBe("needs-owner-decision");
    expect(undeclared?.lifecycle?.detail).toContain("declared slice");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("treats only a closeout for the last declared slice as a terminal delivery", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    await initializeWorkspace(root);
    git(root, ["remote", "add", "origin", "https://github.com/example/hq.git"]);
    await mkdir(join(root, "projects", "hq"), { recursive: true });
    await writeFile(join(root, "projects", "hq", "project.yaml"), projectYaml("hq"));
    await writeFile(join(root, "projects.local.yaml"), ["bindings:", "  hq:", "    path: .", ""].join("\n"));
    const directory = join(root, "workstreams", "sliced-delivery");
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "PLAN.md"), slicedPlan("sliced-delivery", ["hq"], 3, "6.0"));
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "declare sliced plan"]);
    const base = git(root, ["rev-parse", "HEAD"]);

    const eventsDirectory = join(root, "memory/events/2026/09/04");
    await mkdir(eventsDirectory, { recursive: true });
    await writeFile(join(eventsDirectory, "20260904T000001_slice_one.yaml"), sliceCloseout("sliced-delivery", base, "6.0", "1"));
    git(root, ["add", "memory"]);
    git(root, ["commit", "-m", "record slice 1 closeout"]);
    git(root, ["update-ref", "refs/remotes/origin/main", git(root, ["rev-parse", "HEAD"])]);

    let report = await readPortfolioWakeReport(root);
    expect(report.workstreams.find((item) => item.id === "sliced-delivery")?.lifecycle?.state).toBe("needs-owner-decision");

    await writeFile(join(eventsDirectory, "20260904T000002_slice_three.yaml"), sliceCloseout("sliced-delivery", base, "6.0", "3"));
    git(root, ["add", "memory"]);
    git(root, ["commit", "-m", "record slice 3 closeout"]);
    git(root, ["update-ref", "refs/remotes/origin/main", git(root, ["rev-parse", "HEAD"])]);

    report = await readPortfolioWakeReport(root);
    expect(report.workstreams.find((item) => item.id === "sliced-delivery")?.lifecycle?.state).toBe("completed");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("counts an overlap on a child project but never on the HQ project every workstream lists", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    await initializeWorkspace(root);
    git(root, ["remote", "add", "origin", "https://github.com/example/hq.git"]);
    const bindings: string[] = ["bindings:", "  hq:", "    path: ."];
    for (const id of ["child-a", "child-b"]) {
      await createProject(join(root, "checkouts", id), id);
      await mkdir(join(root, "projects", id), { recursive: true });
      await writeFile(join(root, "projects", id, "project.yaml"), projectYaml(id));
      bindings.push(`  ${id}:`, `    path: checkouts/${id}`);
    }
    await mkdir(join(root, "projects", "hq"), { recursive: true });
    await writeFile(join(root, "projects", "hq", "project.yaml"), projectYaml("hq"));
    await writeFile(join(root, "projects.local.yaml"), [...bindings, ""].join("\n"));

    await addPlan(root, "alpha", "active", ["hq", "child-a"], { revision: "1.0" });
    await addPlan(root, "beta", "active", ["hq", "child-b"], { revision: "1.0" });

    let report = await readPortfolioWakeReport(root);
    let lifecycle = new Map(report.workstreams.map((item) => [item.id, item.lifecycle?.state]));
    expect(report.validationErrors).toEqual([]);
    // Sharing only HQ is not an overlap. Every workstream keeps its plan and
    // events there, so counting it would block all concurrent work outright.
    expect(lifecycle.get("alpha")).toBe("needs-owner-decision");
    expect(lifecycle.get("beta")).toBe("needs-owner-decision");
    expect(report.attention.every((item) => item.state !== "conflict")).toBe(true);

    await addPlan(root, "gamma", "active", ["hq", "child-a"], { revision: "1.0" });
    report = await readPortfolioWakeReport(root);
    lifecycle = new Map(report.workstreams.map((item) => [item.id, item.lifecycle?.state]));
    // Sharing a child is a real collision and still needs an owner decision.
    expect(lifecycle.get("alpha")).toBe("owner-confirmation-required");
    expect(lifecycle.get("gamma")).toBe("owner-confirmation-required");
    expect(lifecycle.get("beta")).toBe("needs-owner-decision");
    const conflict = report.attention.find((item) => item.workstreamId === "alpha");
    expect(conflict?.state).toBe("conflict");
    expect(conflict?.detail).toContain("child-a");
    expect(conflict?.detail).not.toContain("hq");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("reports what the latest record says to do next and what it left open", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    await createProject(join(root, "checkouts", "pilot-app"), "pilot-app");
    await mkdir(join(root, "projects", "pilot-app"), { recursive: true });
    await writeFile(join(root, "projects", "pilot-app", "project.yaml"), projectYaml("pilot-app"));
    await writeFile(join(root, "projects.local.yaml"), ["bindings:", "  pilot-app:", "    path: checkouts/pilot-app", ""].join("\n"));
    await addPlan(root, "recorded", "active", ["pilot-app"], { revision: "1.0" });
    await addPlan(root, "unrecorded", "active", ["pilot-app"], { revision: "1.0" });

    const eventsDirectory = join(root, "memory/events/2026/08/29");
    await mkdir(eventsDirectory, { recursive: true });
    await writeFile(join(eventsDirectory, "20260829T000000_first.yaml"), event("first", "recorded", "1.0"));
    await writeFile(join(eventsDirectory, "20260829T000001_latest.yaml"), [
      "schema_version: ciel.event.v0.1",
      "id: evt_latest",
      "type: closeout",
      "recorded_at: 2026-08-29T09:00:00+07:00",
      "recorded_by:",
      "  agent: test",
      "workstream:",
      "  id: recorded",
      "  objective: fixture",
      "outcome:",
      "  status: prepared",
      "evidence:",
      "  base_revision: 1.0",
      "unresolved:",
      "  - the vendor mapping is still an assumption",
      "next_action:",
      "  action: measure the mapping against hardware before relying on it",
      ""
    ].join("\n"));

    const report = await readPortfolioWakeReport(root);
    const recorded = report.workstreams.find((item) => item.id === "recorded");

    expect(report.validationErrors).toEqual([]);
    // The newest record wins, so a later change of direction can be read
    // against what was last proposed rather than against nothing.
    expect(recorded?.latestRecord?.nextAction).toBe("measure the mapping against hardware before relying on it");
    expect(recorded?.latestRecord?.unresolved).toEqual(["the vendor mapping is still an assumption"]);
    expect(recorded?.latestRecord?.recordedAt).toBe("2026-08-29T09:00:00+07:00");
    expect(recorded?.latestRecord?.eventPath).toBe("memory/events/2026/08/29/20260829T000001_latest.yaml");
    expect(report.workstreams.find((item) => item.id === "unrecorded")?.latestRecord).toBeNull();
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

function terminalCloseoutOn(eventId: string, workstreamId: string, revision: string, topicBranch: string): string {
  return [
    "schema_version: ciel.event.v0.1",
    `id: evt_${eventId}`,
    "type: closeout",
    "recorded_at: 2026-09-04T00:00:00+07:00",
    "recorded_by:",
    "  agent: test",
    "workstream:",
    `  id: ${workstreamId}`,
    "  lane: single",
    "  objective: fixture",
    "outcome:",
    "  status: ready-for-owner-merge",
    "evidence:",
    `  base_revision: ${revision}`,
    "  plan_revision: \"4.0\"",
    "  execution_phase: \"1\"",
    "  delivery:",
    "    target_branch: main",
    `    topic_branch: ${topicBranch}`,
    "unresolved: []",
    "next_action:",
    "  action: owner merge",
    ""
  ].join("\n");
}

test("reports whether a record's own advice has already travelled through a merge", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    await initializeWorkspace(root);
    git(root, ["remote", "add", "origin", "https://github.com/example/hq.git"]);
    await mkdir(join(root, "projects", "hq"), { recursive: true });
    await writeFile(join(root, "projects", "hq", "project.yaml"), projectYaml("hq"));
    await writeFile(join(root, "projects.local.yaml"), ["bindings:", "  hq:", "    path: .", ""].join("\n"));
    await addPlan(root, "advised", "active", ["hq"], { revision: "1.0" });
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "declare plan"]);
    git(root, ["update-ref", "refs/remotes/origin/main", git(root, ["rev-parse", "HEAD"])]);

    const eventsDirectory = join(root, "memory/events/2026/08/29");
    await mkdir(eventsDirectory, { recursive: true });
    await writeFile(join(eventsDirectory, "20260829T000000_advice.yaml"), event("advice", "advised", "1.0"));

    // An uncommitted record cannot be placed against the target branch at all,
    // and saying so is truer than implying its advice is current.
    let report = await readPortfolioWakeReport(root);
    expect(report.workstreams.find((item) => item.id === "advised")?.latestRecord?.nextActionState.state).toBe("unknown");

    git(root, ["add", "memory"]);
    git(root, ["commit", "-m", "record advice"]);
    const adviceCommit = git(root, ["rev-parse", "HEAD"]);

    // Committed but not merged: nothing has carried this advice through
    // delivery, so it stands as written.
    report = await readPortfolioWakeReport(root);
    expect(report.workstreams.find((item) => item.id === "advised")?.latestRecord?.nextActionState.state).toBe("unmerged");

    git(root, ["update-ref", "refs/remotes/origin/main", adviceCommit]);

    // The record itself has merged. Its advice may already have been carried
    // out, which is how a session was nearly led to open a pull request for
    // work that had already merged. The advice is still reported; what changes
    // is that the reader can tell the two cases apart.
    report = await readPortfolioWakeReport(root);
    const record = report.workstreams.find((item) => item.id === "advised")?.latestRecord;
    expect(record?.nextActionState.state).toBe("merged");
    expect(record?.nextAction).toBe("fixture");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("does not attribute a topic branch that more than one workstream's closeout records", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    await initializeWorkspace(root);
    git(root, ["remote", "add", "origin", "https://github.com/example/hq.git"]);
    await mkdir(join(root, "projects", "hq"), { recursive: true });
    await writeFile(join(root, "projects", "hq", "project.yaml"), projectYaml("hq"));
    await writeFile(join(root, "projects.local.yaml"), ["bindings:", "  hq:", "    path: .", ""].join("\n"));
    await addPlan(root, "first-lane", "active", ["hq"], { revision: "4.0" });
    await addPlan(root, "second-lane", "active", ["hq"], { revision: "4.0" });
    await addPlan(root, "sole-lane", "active", ["hq"], { revision: "4.0" });
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "declare plans"]);
    const base = git(root, ["rev-parse", "HEAD"]);

    const eventsDirectory = join(root, "memory/events/2026/09/04");
    await mkdir(eventsDirectory, { recursive: true });
    await writeFile(join(eventsDirectory, "20260904T000000_first.yaml"), terminalCloseoutOn("first", "first-lane", base, "hq/20260906"));
    await writeFile(join(eventsDirectory, "20260904T000001_second.yaml"), terminalCloseoutOn("second", "second-lane", base, "hq/20260906"));
    await writeFile(join(eventsDirectory, "20260904T000002_sole.yaml"), terminalCloseoutOn("sole", "sole-lane", base, "feat/sole"));
    git(root, ["add", "memory"]);
    git(root, ["commit", "-m", "record closeouts"]);
    git(root, ["update-ref", "refs/remotes/origin/main", git(root, ["rev-parse", "HEAD"])]);

    // A new round of shared work reuses the standing branch name. It carries a
    // commit outside the target branch, which is what made two merged and
    // complete workstreams both report needs-reconciliation.
    git(root, ["switch", "-c", "hq/20260906"]);
    await writeFile(join(root, "unrelated.md"), "# a later round\n");
    git(root, ["add", "unrelated.md"]);
    git(root, ["commit", "-m", "unrelated later work"]);
    git(root, ["switch", "main"]);

    const report = await readPortfolioWakeReport(root);
    const lifecycleOf = (id: string): string | undefined => report.workstreams.find((item) => item.id === id)?.lifecycle?.state;

    // A standing branch carries several workstreams by design, so no single
    // closeout can decide whether it may be removed. Neither lane is told to
    // reconcile a branch that is not its own to reconcile.
    expect(lifecycleOf("first-lane")).toBe("completed");
    expect(lifecycleOf("second-lane")).toBe("completed");

    // A branch recorded by exactly one workstream is still that workstream's
    // to clean up. The remedy narrows what is attributed; it does not remove
    // the check.
    git(root, ["branch", "feat/sole", "main"]);
    const afterSole = await readPortfolioWakeReport(root);
    expect(afterSole.workstreams.find((item) => item.id === "sole-lane")?.lifecycle?.state).toBe("merged-needs-cleanup");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

function unsliceableCloseout(workstreamId: string, revision: string, planRevision: string, status: string): string {
  return [
    "schema_version: ciel.event.v0.1",
    `id: evt_20260904T000003_unsliceable_${workstreamId.replace(/-/g, "_")}`,
    "type: closeout",
    "recorded_at: 2026-09-04T00:00:03+07:00",
    "recorded_by:",
    "  agent: test",
    "workstream:",
    `  id: ${workstreamId}`,
    "  lane: single",
    "  objective: fixture",
    "outcome:",
    `  status: ${status}`,
    "evidence:",
    `  base_revision: ${revision}`,
    `  plan_revision: "${planRevision}"`,
    "unresolved: []",
    "next_action:",
    "  action: owner merge",
    ""
  ].join("\n");
}

test("does not finish a plan that declares slices with a closeout naming none, and says why", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    await initializeWorkspace(root);
    git(root, ["remote", "add", "origin", "https://github.com/example/hq.git"]);
    await mkdir(join(root, "projects", "hq"), { recursive: true });
    await writeFile(join(root, "projects", "hq", "project.yaml"), projectYaml("hq"));
    await writeFile(join(root, "projects.local.yaml"), ["bindings:", "  hq:", "    path: .", ""].join("\n"));
    const directory = join(root, "workstreams", "sliced-delivery");
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "PLAN.md"), slicedPlan("sliced-delivery", ["hq"], 3, "6.0"));
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "declare sliced plan"]);
    const base = git(root, ["rev-parse", "HEAD"]);

    const eventsDirectory = join(root, "memory/events/2026/09/04");
    await mkdir(eventsDirectory, { recursive: true });
    await writeFile(join(eventsDirectory, "20260904T000003_unsliceable.yaml"), unsliceableCloseout("sliced-delivery", base, "6.0", "ready-for-owner-merge"));
    git(root, ["add", "memory"]);
    git(root, ["commit", "-m", "record a closeout naming no slice"]);
    git(root, ["update-ref", "refs/remotes/origin/main", git(root, ["rev-parse", "HEAD"])]);

    const report = await readPortfolioWakeReport(root);
    const workstream = report.workstreams.find((item) => item.id === "sliced-delivery");

    // A closeout naming no slice is a record about the workstream, not its
    // delivery. Letting one through reported a workstream as complete with
    // three of its four slices unstarted.
    expect(workstream?.lifecycle?.state).toBe("needs-owner-decision");
    // The change to what this workstream derives is explained where it is read,
    // rather than left for someone to work out from the code.
    expect(workstream?.lifecycle?.detail).toContain("names no slice");
    expect(workstream?.lifecycle?.detail).toContain("20260904T000003_unsliceable.yaml");
    // It is not a validation warning: a plan-revision closeout takes this shape
    // legitimately every time a plan is revised mid-flight.
    expect(report.validationWarnings).toEqual([]);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("warns about an unrecognised status on a closeout that would otherwise finish a workstream", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    await initializeWorkspace(root);
    git(root, ["remote", "add", "origin", "https://github.com/example/hq.git"]);
    await mkdir(join(root, "projects", "hq"), { recursive: true });
    await writeFile(join(root, "projects", "hq", "project.yaml"), projectYaml("hq"));
    await writeFile(join(root, "projects.local.yaml"), ["bindings:", "  hq:", "    path: .", ""].join("\n"));
    const directory = join(root, "workstreams", "lost-delivery");
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "PLAN.md"), slicedPlan("lost-delivery", ["hq"], 1, "6.0"));
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "declare plan"]);
    const base = git(root, ["rev-parse", "HEAD"]);

    // The word a cold session actually chose. It is required, it reads as a
    // completion, and the code ignores it.
    const eventsDirectory = join(root, "memory/events/2026/09/04");
    await mkdir(eventsDirectory, { recursive: true });
    await writeFile(join(eventsDirectory, "20260904T000004_lost.yaml"), sliceCloseout("lost-delivery", base, "6.0", "1").replace("status: ready-for-owner-merge", "status: completed"));
    git(root, ["add", "memory"]);
    git(root, ["commit", "-m", "record a closeout the code ignores"]);
    git(root, ["update-ref", "refs/remotes/origin/main", git(root, ["rev-parse", "HEAD"])]);

    let report = await readPortfolioWakeReport(root);

    // Reported, and reported as a warning naming the file. Failing would make
    // an append-only record that cannot be corrected block every later read.
    expect(report.validationErrors).toEqual([]);
    expect(report.validationWarnings).toHaveLength(1);
    expect(report.validationWarnings[0]?.path).toBe("memory/events/2026/09/04/20260904T000004_lost.yaml");
    expect(report.validationWarnings[0]?.message).toContain("completed");
    expect(report.workstreams.find((item) => item.id === "lost-delivery")?.lifecycle?.state).toBe("needs-owner-decision");

    // The repair is a new record beside the original, never an edit to it. Once
    // the machinery can read a delivery, the warning has nothing left to say.
    await writeFile(join(eventsDirectory, "20260904T000005_repair.yaml"), sliceCloseout("lost-delivery", base, "6.0", "1").replace("evt_20260904T000001_slice_1", "evt_20260904T000005_repair"));
    git(root, ["add", "memory"]);
    git(root, ["commit", "-m", "record the repair beside it"]);
    git(root, ["update-ref", "refs/remotes/origin/main", git(root, ["rev-parse", "HEAD"])]);

    report = await readPortfolioWakeReport(root);
    expect(report.validationWarnings).toEqual([]);
    expect(report.workstreams.find((item) => item.id === "lost-delivery")?.lifecycle?.state).toBe("completed");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
