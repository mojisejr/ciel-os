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

// A standing HQ branch is named hq/<yyyymmdd>. The date in the name is the
// only record of when the current round of shared work opened, so its age is
// derived rather than stored. Reporting the age is deliberate; deciding that
// the age is too high is not, and belongs to the owner.
function parseStandingBranch(branch: string | null, today = new Date()): WakeReport["observed"]["repository"]["standingBranch"] {
  const match = branch?.match(/^hq\/(\d{4})(\d{2})(\d{2})$/);
  if (match?.[1] === undefined || match[2] === undefined || match[3] === undefined) {
    return null;
  }

  const openedOn = `${match[1]}-${match[2]}-${match[3]}`;
  const opened = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (Number.isNaN(opened)) {
    return null;
  }

  return {
    ageDays: Math.max(0, Math.round((current - opened) / 86_400_000)),
    name: branch as string,
    openedOn
  };
}

// A standing branch that has merged is finished, but nothing points at it once
// the checkout leaves it. Listing it keeps a forgotten one visible from a clean
// main. Derived from local Git refs; nothing is stored, and no judgement is
// attached, because deciding that a leftover branch matters is the owner's.
async function readMergedStandingBranches(
  repositoryPath: string,
  today = new Date()
): Promise<WakeReport["observed"]["repository"]["mergedStandingBranches"]> {
  const remoteTarget = "refs/remotes/origin/main";
  const remoteExists = await runGit(repositoryPath, ["show-ref", "--verify", "--quiet", remoteTarget]);
  if (remoteExists.exitCode !== 0) {
    return [];
  }

  const refs = await runGit(repositoryPath, ["for-each-ref", "--format=%(refname:short)", "refs/heads/hq"]);
  if (refs.exitCode !== 0) {
    return [];
  }

  const merged: WakeReport["observed"]["repository"]["mergedStandingBranches"] = [];
  for (const name of refs.stdout.trim().split("\n").filter((line) => line.length > 0).sort()) {
    const reachable = await runGit(repositoryPath, ["merge-base", "--is-ancestor", `refs/heads/${name}`, remoteTarget]);
    if (reachable.exitCode !== 0) {
      continue;
    }
    merged.push(parseStandingBranch(name, today) ?? { ageDays: null, name, openedOn: null });
  }

  return merged;
}

// Branches whose commits have not reached fetched origin/main. This is the
// half of the report that PR 42 needed: it sat ready for review and unmerged
// for roughly six hours while Wake reported as unfinished the very workstream
// its records completed, and the owner found it by opening the forge for an
// unrelated reason.
//
// Local heads and remote-tracking refs are both walked and then grouped by
// branch name. Reading remote-tracking refs is what lets a branch pushed from
// another machine appear at all, and whether a branch is pushed is the part
// that says someone else may already be waiting on it. Nothing here says pull
// request, because Wake cannot see one and must not imply otherwise.
//
// No judgement is attached, in keeping with the branch reporting beside it.
// "This is not on origin/main" is a fact. "You forgot to merge it" is the
// owner's to say, and the branch the checkout is standing on is marked rather
// than hidden, so a reader can tell their own work from work left behind.
async function readUnmergedWork(
  repositoryPath: string,
  currentBranch: string | null
): Promise<WakeReport["observed"]["repository"]["unmergedWork"]> {
  const remoteTarget = "refs/remotes/origin/main";
  const remoteExists = await runGit(repositoryPath, ["show-ref", "--verify", "--quiet", remoteTarget]);
  if (remoteExists.exitCode !== 0) {
    return [];
  }

  const refs = await runGit(repositoryPath, [
    "for-each-ref",
    "--format=%(refname)%09%(committerdate:iso-strict)",
    "refs/heads",
    "refs/remotes/origin"
  ]);
  if (refs.exitCode !== 0) {
    return [];
  }

  const grouped = new Map<string, { lastCommitAt: string | null; local: boolean; pushed: boolean; reference: string }>();

  for (const line of refs.stdout.trim().split("\n").filter((entry) => entry.length > 0)) {
    const [reference, committedAt] = line.split("\t");
    if (reference === undefined || reference === remoteTarget || reference === "refs/remotes/origin/HEAD") {
      continue;
    }

    const local = reference.startsWith("refs/heads/");
    const name = local ? reference.slice("refs/heads/".length) : reference.slice("refs/remotes/origin/".length);
    const reachable = await runGit(repositoryPath, ["merge-base", "--is-ancestor", reference, remoteTarget]);
    if (reachable.exitCode === 0) {
      continue;
    }

    const existing = grouped.get(name);
    grouped.set(name, {
      // The remote-tracking ref is what the forge holds, so it decides the
      // count and the date when both exist.
      lastCommitAt: local ? existing?.lastCommitAt ?? committedAt ?? null : committedAt ?? null,
      local: local || existing?.local === true,
      pushed: !local || existing?.pushed === true,
      reference: local ? existing?.reference ?? reference : reference
    });
  }

  const unmerged: WakeReport["observed"]["repository"]["unmergedWork"] = [];
  for (const [name, entry] of [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const counted = await runGit(repositoryPath, ["rev-list", "--count", `${remoteTarget}..${entry.reference}`]);
    unmerged.push({
      name,
      local: entry.local,
      pushed: entry.pushed,
      ahead: counted.exitCode === 0 ? Number.parseInt(counted.stdout.trim(), 10) || 0 : 0,
      lastCommitAt: entry.lastCommitAt,
      current: currentBranch !== null && currentBranch === name
    });
  }

  return unmerged;
}

// How old this checkout's view of origin/main is. Wake never fetches, so every
// merge-state claim it makes is only as fresh as the last time a human or agent
// did. The wording already in this file concedes as much by saying "fetched
// origin/main"; this says how long ago that was.
//
// Git resolves the path, which keeps this correct inside a linked worktree, and
// the filesystem supplies the time. The reflog was the other candidate and
// records when the ref last moved rather than when it was last looked at, so a
// fetch that found nothing new would leave it reporting an alarming age for a
// view that is current. Answering the wrong question confidently is worse than
// reaching outside Git for a modification time.
async function readRemoteView(repositoryPath: string): Promise<WakeReport["observed"]["repository"]["remoteView"]> {
  const remoteExists = await runGit(repositoryPath, ["show-ref", "--verify", "--quiet", "refs/remotes/origin/main"]);
  if (remoteExists.exitCode !== 0) {
    return { fetchedAt: null, detail: "No origin/main ref exists in this checkout, so there is no view of it to age." };
  }

  const gitPath = await runGit(repositoryPath, ["rev-parse", "--git-path", "FETCH_HEAD"]);
  if (gitPath.exitCode !== 0) {
    return { fetchedAt: null, detail: "Git could not resolve where a fetch would record itself, so the age of this view is unknown." };
  }

  const marker = Bun.file(resolve(repositoryPath, gitPath.stdout.trim()));
  if (!(await marker.exists())) {
    return {
      fetchedAt: null,
      detail: "No fetch is recorded in this checkout, so every merge-state claim here rests on a view of origin/main of unknown age."
    };
  }

  const fetchedAt = new Date(marker.lastModified).toISOString();
  return {
    fetchedAt,
    detail: `Merge state here is read from origin/main as the last fetch left it, at ${fetchedAt}. Wake does not fetch.`
  };
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
        standingBranch: parseStandingBranch(branchOutput.length > 0 ? branchOutput : null),
        mergedStandingBranches: await readMergedStandingBranches(repositoryPath),
        unmergedWork: await readUnmergedWork(repositoryPath, branchOutput.length > 0 ? branchOutput : null),
        remoteView: await readRemoteView(repositoryPath),
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
    validationWarnings: [...validation.warnings, ...portfolio.validationWarnings]
  };
}
