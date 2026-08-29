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

function plan(
  id: string,
  state: string,
  projectIds: string[],
  options: { executionState?: "executing" | "idle"; parallelism?: "none" | "proposed"; revision?: string } = {}
): string {
  return [
    `# ${id}`,
    "",
    `**Workstream:** \`${id}\`  `,
    `**State:** ${state}  `,
    "**Execution lane:** single  ",
    `**Plan revision:** ${options.revision ?? "1.0"}  `,
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

function decision(id: string, workstreamId: string, planRevision: string, parallelism = "not-proposed"): string {
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
    "unresolved: []",
    "next_action:",
    "  action: fixture",
    ""
  ].join("\n");
}

async function addPlan(
  root: string,
  id: string,
  state: string,
  projectIds: string[],
  options: { executionState?: "executing" | "idle"; parallelism?: "none" | "proposed"; revision?: string } = {}
): Promise<void> {
  const directory = join(root, "workstreams", id);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "PLAN.md"), plan(id, state, projectIds, options));
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
      ["bindings:", "  ready:", `    path: ${ready}`, "  shared:", `    path: ${shared}`, ""].join("\n")
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

test("requires a current owner decision, reconciles interrupted work, and holds proposed parallelism", async () => {
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
      bindings.push(`  ${id}:`, `    path: ${checkout}`);
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
        ["interrupted", "needs-reconciliation"],
        ["clean-interrupted", "interrupted"],
        ["parallel", "owner-confirmation-required"]
      ])
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("reports a mismatched local Git remote without treating it as a valid binding", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-portfolio-"));
  try {
    const checkout = join(root, "checkout");
    await createProject(checkout, "other-project");
    const projectDirectory = join(root, "projects", "expected-project");
    await mkdir(projectDirectory, { recursive: true });
    await writeFile(join(projectDirectory, "project.yaml"), projectYaml("expected-project"));
    await writeFile(join(root, "projects.local.yaml"), ["bindings:", "  expected-project:", `    path: ${checkout}`, ""].join("\n"));
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
