import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { expect, test } from "bun:test";

import { GitSession, runGit } from "../../src/git/session.ts";

function git(repositoryPath: string, arguments_: string[]): string {
  const process = Bun.spawnSync(["git", "-C", repositoryPath, ...arguments_], { stderr: "pipe", stdout: "pipe" });
  if (process.exitCode !== 0) {
    throw new Error(`git ${arguments_.join(" ")} failed: ${new TextDecoder().decode(process.stderr)}`);
  }
  return new TextDecoder().decode(process.stdout).trim();
}

async function commitFile(root: string, path: string, text: string, message: string): Promise<string> {
  await writeFile(join(root, path), text);
  git(root, ["add", path]);
  git(root, ["commit", "-m", message]);
  return git(root, ["rev-parse", "HEAD"]);
}

// Every answer the session gives must be the one the single Git call gives.
// The history covers each case the walk could plausibly get wrong: a file
// added on a side branch and merged, a file changed twice, a merge that
// changes a file away from both parents, an uncommitted file, a path outside
// the walked directory, and commits that are not ancestors or do not exist.
test("answers exactly as the single Git calls it replaces", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-git-session-"));
  try {
    git(root, ["init", "--initial-branch=main"]);
    git(root, ["config", "user.name", "CIEL test"]);
    git(root, ["config", "user.email", "ciel-test@example.invalid"]);
    await mkdir(join(root, "memory/events"), { recursive: true });
    const first = await commitFile(root, "memory/events/a.yaml", "a: 1\n", "add a");
    await commitFile(root, "memory/events/twice.yaml", "t: 1\n", "add twice");
    await commitFile(root, "memory/events/twice.yaml", "t: 2\n", "change twice");

    git(root, ["switch", "-c", "side"]);
    const side = await commitFile(root, "memory/events/side.yaml", "s: 1\n", "add side");
    await commitFile(root, "memory/events/evil.yaml", "e: side\n", "evil on side");
    git(root, ["switch", "main"]);
    await commitFile(root, "memory/events/evil.yaml", "e: main\n", "evil on main");
    await commitFile(root, "memory/events/main.yaml", "m: 1\n", "add main");
    Bun.spawnSync(["git", "-C", root, "merge", "--no-ff", "-m", "merge side", "side"], { stderr: "pipe", stdout: "pipe" });
    await writeFile(join(root, "memory/events/evil.yaml"), "e: resolved\n");
    git(root, ["add", "memory/events/evil.yaml"]);
    git(root, ["commit", "--no-edit"]);
    const merge = git(root, ["rev-parse", "HEAD"]);
    await commitFile(root, "README.md", "# fixture\n", "outside the walk");
    await writeFile(join(root, "memory/events/uncommitted.yaml"), "u: 1\n");

    git(root, ["switch", "-c", "detour", first]);
    const detour = await commitFile(root, "memory/events/detour.yaml", "d: 1\n", "not on main");
    git(root, ["switch", "main"]);

    const session = new GitSession();
    for (const path of ["a", "twice", "side", "evil", "main", "uncommitted", "detour"].map((name) => `memory/events/${name}.yaml`).concat("README.md")) {
      const expected = await runGit(root, ["log", "-1", "--format=%H", "--", path]);
      const actual = await session.lastCommitTouching(root, "memory/events", path);
      expect({ path, exitCode: actual.exitCode, stdout: actual.stdout }).toEqual({ path, exitCode: expected.exitCode, stdout: expected.stdout });
    }
    expect((await session.lastCommitTouching(root, "memory/events", "memory/events/evil.yaml")).stdout.trim()).toBe(merge);

    const missing = "0123456789abcdef0123456789abcdef01234567";
    for (const [commit, target] of [
      [first, "refs/heads/main"], [side, "refs/heads/main"], [merge, "refs/heads/main"], [detour, "refs/heads/main"],
      [merge, "refs/heads/side"], ["refs/heads/side", "refs/heads/main"], ["refs/heads/detour", "refs/heads/main"],
      [missing, "refs/heads/main"], ["refs/heads/no-such-branch", "refs/heads/main"], [first, "refs/remotes/origin/main"]
    ] as const) {
      const expected = await runGit(root, ["merge-base", "--is-ancestor", commit, target]);
      const actual = await session.isAncestor(root, commit, target);
      expect({ commit, target, exitCode: actual.exitCode }).toEqual({ commit, target, exitCode: expected.exitCode });
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("asks Git once for a question repeated within a run", async () => {
  const root = await mkdtemp(join(tmpdir(), "ciel-git-session-"));
  try {
    git(root, ["init", "--initial-branch=main"]);
    git(root, ["config", "user.name", "CIEL test"]);
    git(root, ["config", "user.email", "ciel-test@example.invalid"]);
    const head = await commitFile(root, "README.md", "# fixture\n", "initial");
    const session = new GitSession();
    const [left, right] = await Promise.all([session.run(root, ["rev-parse", "HEAD"]), session.run(root, ["rev-parse", "HEAD"])]);
    expect(left).toBe(right);
    expect(left.stdout.trim()).toBe(head);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
