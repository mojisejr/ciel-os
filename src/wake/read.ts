import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { parseDocument } from "yaml";

import { findEventCheckpoint } from "../events/checkpoint.ts";
import { validateEventDirectory } from "../events/validate.ts";
import { readPortfolioWakeReport } from "../portfolio/read.ts";
import type { WakeReport } from "./types.ts";

interface GitResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

interface LatestEvent {
  checkpoint: string | null;
  id: string | null;
  objective: string | null;
  path: string;
  recordedAt: string | null;
  workstreamId: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
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

async function requireGit(repositoryPath: string, arguments_: string[]): Promise<string> {
  const result = await runGit(repositoryPath, arguments_);

  if (result.exitCode !== 0) {
    throw new Error(`git ${arguments_.join(" ")} failed: ${result.stderr.trim()}`);
  }

  return result.stdout;
}

function parseWorktrees(output: string): WakeReport["observed"]["repository"]["worktrees"] {
  return output
    .trim()
    .split("\n\n")
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const values = new Map(
        entry.split("\n").map((line) => {
          const separator = line.indexOf(" ");
          return separator === -1 ? [line, ""] : [line.slice(0, separator), line.slice(separator + 1)];
        })
      );
      const branchReference = values.get("branch");

      return {
        path: values.get("worktree") ?? "",
        head: values.get("HEAD") ?? "",
        branch: branchReference?.startsWith("refs/heads/") ? branchReference.slice("refs/heads/".length) : null,
        bare: values.has("bare")
      };
    });
}

async function readLatestEvent(eventsDirectory: string): Promise<LatestEvent | null> {
  const relativePaths = [...new Bun.Glob("**/*.yaml").scanSync(eventsDirectory)].sort();
  const relativePath = relativePaths.at(-1);

  if (relativePath === undefined) {
    return null;
  }

  const path = join(eventsDirectory, relativePath);
  const document = parseDocument(await Bun.file(path).text(), { prettyErrors: false });
  const value = document.toJS();

  if (document.errors.length > 0 || !isRecord(value)) {
    return null;
  }

  const workstream = isRecord(value.workstream) ? value.workstream : {};
  return {
    path,
    id: readString(value, "id"),
    recordedAt: readString(value, "recorded_at"),
    workstreamId: readString(workstream, "id"),
    objective: readString(workstream, "objective"),
    checkpoint: findEventCheckpoint(value)
  };
}

async function readIfPresent(path: string): Promise<boolean> {
  if (!existsSync(path)) {
    return false;
  }

  await Bun.file(path).text();
  return true;
}

async function reconcileCheckpoint(
  repositoryPath: string,
  head: string,
  latestEvent: LatestEvent | null
): Promise<WakeReport["reconciliation"]> {
  if (latestEvent === null) {
    return { status: "unknown", detail: "No event record is available for reconciliation." };
  }

  if (latestEvent.checkpoint === null) {
    return {
      status: "unknown",
      detail: "The latest event has no supported Git checkpoint reference; no ancestry claim is made."
    };
  }

  const exists = await runGit(repositoryPath, ["cat-file", "-e", `${latestEvent.checkpoint}^{commit}`]);
  if (exists.exitCode !== 0) {
    return {
      status: "needs-reconciliation",
      detail: `The latest event references ${latestEvent.checkpoint}, which is not a commit available in this repository.`
    };
  }

  if (head === latestEvent.checkpoint) {
    return {
      status: "at-recorded-checkpoint",
      detail: `Current HEAD matches the latest event checkpoint ${latestEvent.checkpoint}.`
    };
  }

  const isAncestor = await runGit(repositoryPath, ["merge-base", "--is-ancestor", latestEvent.checkpoint, head]);
  if (isAncestor.exitCode === 0) {
    return {
      status: "expected-evolution",
      detail: `Current HEAD ${head} is a traceable descendant of the latest event checkpoint ${latestEvent.checkpoint}.`
    };
  }

  return {
    status: "needs-reconciliation",
    detail: `Current HEAD ${head} is not a descendant of the latest event checkpoint ${latestEvent.checkpoint}.`
  };
}

export async function readWakeReport(repositoryDirectory = "."): Promise<WakeReport> {
  const repositoryPath = resolve(repositoryDirectory);
  const eventsDirectory = join(repositoryPath, "memory/events");
  const head = (await requireGit(repositoryPath, ["rev-parse", "HEAD"])).trim();
  const branchOutput = (await requireGit(repositoryPath, ["branch", "--show-current"])).trim();
  const statusOutput = await requireGit(repositoryPath, ["status", "--porcelain=v1"]);
  const worktreeOutput = await requireGit(repositoryPath, ["worktree", "list", "--porcelain"]);
  const validation = await validateEventDirectory(eventsDirectory);
  const latestEvent = await readLatestEvent(eventsDirectory);
  const portfolio = await readPortfolioWakeReport(repositoryPath);
  const statusEntries = statusOutput.length === 0 ? [] : statusOutput.trimEnd().split("\n");

  return {
    observed: {
      repository: {
        path: repositoryPath,
        head,
        branch: branchOutput.length > 0 ? branchOutput : null,
        workingTree: {
          clean: statusEntries.length === 0,
          entries: statusEntries
        },
        worktrees: parseWorktrees(worktreeOutput)
      },
      instructions: {
        agentsMdPresent: await readIfPresent(join(repositoryPath, "AGENTS.md")),
        // Presence only. A bridge that is deleted or renamed becomes visible to
        // every client; a bridge whose content drifts does not. Verifying the
        // managed section would need a checker that no evidence justifies yet.
        claudeMdPresent: await readIfPresent(join(repositoryPath, "CLAUDE.md")),
        readmePresent: await readIfPresent(join(repositoryPath, "README.md"))
      }
    },
    recorded: { latestEvent, portfolio },
    reconciliation: await reconcileCheckpoint(repositoryPath, head, latestEvent),
    unknowns: [
      "Human approval, review, and external rules are unknown unless a repository record explicitly establishes them."
    ],
    validationErrors: [...validation.errors, ...portfolio.validationErrors],
    validationWarnings: validation.warnings
  };
}
