import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { expect, test } from "bun:test";

import { readWakeReport } from "../../src/wake/read.ts";

function eventYaml(baseRevision: string): string {
  return [
    "schema_version: ciel.event.v0.1",
    "id: evt_20260826T000000_fixture",
    "type: closeout",
    "recorded_at: 2026-08-26T00:00:00+07:00",
    "recorded_by:",
    "  agent: test",
    "workstream:",
    "  id: fixture-workstream",
    "  objective: Reconstruct a Git-backed fixture.",
    "  scope: []",
    "  out_of_scope: []",
    "outcome:",
    "  status: prepared",
    "evidence:",
    `  base_revision: ${baseRevision}`,
    "unresolved: []",
    "next_action:",
    "  action: Inspect current Git evidence.",
    ""
  ].join("\n");
}

function decisionYaml(priorCheckpoint: string): string {
  return [
    "schema_version: ciel.event.v0.1",
    "id: evt_20260826T000001_decision",
    "type: decision",
    "recorded_at: 2026-08-26T00:00:01+07:00",
    "recorded_by:",
    "  human: owner",
    "workstream:",
    "  id: fixture-workstream",
    "  objective: Reconstruct a Git-backed fixture.",
    "  scope: []",
    "  out_of_scope: []",
    "outcome:",
    "  status: decided",
    "evidence:",
    `  prior_checkpoint: ${priorCheckpoint}`,
    "unresolved: []",
    "next_action:",
    "  action: Inspect current Git evidence.",
    ""
  ].join("\n");
}

function git(repositoryPath: string, arguments_: string[]): string {
  const process = Bun.spawnSync(["git", "-C", repositoryPath, ...arguments_], {
    stderr: "pipe",
    stdout: "pipe"
  });
  const stderr = new TextDecoder().decode(process.stderr).trim();

  if (process.exitCode !== 0) {
    throw new Error(`git ${arguments_.join(" ")} failed: ${stderr}`);
  }

  return new TextDecoder().decode(process.stdout).trim();
}

async function createRepositoryFixture(): Promise<{ baseRevision: string; path: string }> {
  const path = await mkdtemp(join(tmpdir(), "ciel-wake-"));
  git(path, ["init", "--initial-branch=main"]);
  git(path, ["config", "user.name", "CIEL test"]);
  git(path, ["config", "user.email", "ciel-test@example.invalid"]);
  await writeFile(join(path, "README.md"), "# fixture\n");
  await writeFile(join(path, "AGENTS.md"), "# fixture instructions\n");
  git(path, ["add", "README.md", "AGENTS.md"]);
  git(path, ["commit", "-m", "initial fixture"]);

  const baseRevision = git(path, ["rev-parse", "HEAD"]);
  const eventsDirectory = join(path, "memory/events/2026/08/26");
  await mkdir(eventsDirectory, { recursive: true });
  await writeFile(join(eventsDirectory, "20260826T000000_closeout.yaml"), eventYaml(baseRevision));
  git(path, ["add", "."]);
  git(path, ["commit", "-m", "record fixture checkpoint"]);

  return { baseRevision, path };
}

test("reports a clean repository and traceable historical evolution separately", async () => {
  const fixture = await createRepositoryFixture();

  try {
    const report = await readWakeReport(fixture.path);

    expect(report.observed.repository.workingTree).toEqual({ clean: true, entries: [] });
    expect(report.recorded.latestEvent).toEqual(
      expect.objectContaining({ checkpoint: fixture.baseRevision, workstreamId: "fixture-workstream" })
    );
    expect(report.reconciliation.status).toBe("expected-evolution");
    expect(report.reconciliation.detail).toContain(fixture.baseRevision);
  } finally {
    await rm(fixture.path, { force: true, recursive: true });
  }
});

test("reports a deliberate dirty change as observed current state", async () => {
  const fixture = await createRepositoryFixture();

  try {
    await writeFile(join(fixture.path, "README.md"), "# dirty fixture\n");
    const report = await readWakeReport(fixture.path);

    expect(report.observed.repository.workingTree.clean).toBe(false);
    expect(report.observed.repository.workingTree.entries).toEqual([" M README.md"]);
    expect(report.reconciliation.status).toBe("expected-evolution");
  } finally {
    await rm(fixture.path, { force: true, recursive: true });
  }
});

test("reconciles a latest decision through its prior checkpoint", async () => {
  const fixture = await createRepositoryFixture();

  try {
    await writeFile(
      join(fixture.path, "memory/events/2026/08/26/20260826T000001_decision.yaml"),
      decisionYaml(fixture.baseRevision)
    );
    const report = await readWakeReport(fixture.path);

    expect(report.recorded.latestEvent).toEqual(
      expect.objectContaining({ id: "evt_20260826T000001_decision", checkpoint: fixture.baseRevision })
    );
    expect(report.reconciliation.status).toBe("expected-evolution");
  } finally {
    await rm(fixture.path, { force: true, recursive: true });
  }
});

test("labels approval that is not established by the selected record as unknown", async () => {
  const fixture = await createRepositoryFixture();

  try {
    const report = await readWakeReport(fixture.path);

    expect(report.unknowns).toEqual([
      "Human approval, review, and external rules are unknown unless a repository record explicitly establishes them."
    ]);
  } finally {
    await rm(fixture.path, { force: true, recursive: true });
  }
});

test("reports a valid but unrelated current commit as needs-reconciliation", async () => {
  const fixture = await createRepositoryFixture();

  try {
    const tree = git(fixture.path, ["write-tree"]);
    const unrelatedHead = git(fixture.path, ["commit-tree", tree, "-m", "unrelated fixture history"]);
    git(fixture.path, ["update-ref", "refs/heads/unrelated", unrelatedHead]);
    git(fixture.path, ["checkout", "unrelated"]);

    const report = await readWakeReport(fixture.path);

    expect(report.reconciliation.status).toBe("needs-reconciliation");
    expect(report.reconciliation.detail).toContain("not a descendant");
    expect(report.unknowns[0]).toContain("approval");
  } finally {
    await rm(fixture.path, { force: true, recursive: true });
  }
});

test("CLI returns the report without changing the fixture repository", async () => {
  const fixture = await createRepositoryFixture();
  const headBefore = git(fixture.path, ["rev-parse", "HEAD"]);
  const statusBefore = git(fixture.path, ["status", "--porcelain=v1"]);

  try {
    const process = Bun.spawn(["bun", "run", "bin/ciel.ts", "wake", fixture.path], {
      stderr: "pipe",
      stdout: "pipe"
    });

    expect(await process.exited).toBe(0);
    expect(await new Response(process.stdout).text()).toContain("expected-evolution");
    expect(git(fixture.path, ["rev-parse", "HEAD"])).toBe(headBefore);
    expect(git(fixture.path, ["status", "--porcelain=v1"])).toBe(statusBefore);
  } finally {
    await rm(fixture.path, { force: true, recursive: true });
  }
});
