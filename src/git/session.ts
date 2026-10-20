export interface GitResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

export async function runGit(repositoryPath: string, arguments_: string[]): Promise<GitResult> {
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

const fullCommitId = /^[0-9a-f]{40}$/;

// One Wake run's view of Git. Wake is read-only and reports one moment, so a
// question asked twice in a run has one answer: the first call's result is kept
// and shared, including with a call still in flight. Two questions that Wake
// used to ask once per event are answered from one walk each instead. Each
// answer is the one the single call would give, and where that cannot be shown
// the single call is made. Nothing outlives the run.
export class GitSession {
  readonly #calls = new Map<string, Promise<GitResult>>();
  readonly #reachable = new Map<string, Promise<Set<string> | null>>();
  readonly #touches = new Map<string, Promise<Map<string, string[]> | null>>();

  run(repositoryPath: string, arguments_: string[]): Promise<GitResult> {
    const key = JSON.stringify([repositoryPath, arguments_]);
    let call = this.#calls.get(key);
    if (call === undefined) {
      call = runGit(repositoryPath, arguments_);
      this.#calls.set(key, call);
    }
    return call;
  }

  // The answer to `merge-base --is-ancestor <commit> <target>`. Every commit
  // reachable from the target is listed once, so each question becomes a
  // lookup. A commit or target that does not resolve cleanly goes to Git
  // itself, so an error keeps Git's own exit code.
  async isAncestor(repositoryPath: string, commit: string, target: string): Promise<GitResult> {
    const fallback = () => this.run(repositoryPath, ["merge-base", "--is-ancestor", commit, target]);
    const [reachable, commitId] = await Promise.all([
      this.#reachableFrom(repositoryPath, target),
      fullCommitId.test(commit) ? Promise.resolve(commit) : this.#resolveCommit(repositoryPath, commit)
    ]);
    if (reachable === null || commitId === null) {
      return fallback();
    }
    if (reachable.has(commitId)) {
      return { exitCode: 0, stderr: "", stdout: "" };
    }
    // A full id that is not reachable may also not exist, which Git reports as
    // an error rather than as "not an ancestor".
    const exists = await this.run(repositoryPath, ["cat-file", "-e", `${commitId}^{commit}`]);
    return exists.exitCode === 0 ? { exitCode: 1, stderr: "", stdout: "" } : fallback();
  }

  // The answer to `log -1 --format=%H -- <path>` for a path under `directory`.
  // One walk lists, for every path, the commits that changed it, merges
  // included when they differ from every parent. A path changed by exactly one
  // commit was last changed by that commit, whichever walk reaches it. Any
  // other path, including one the walk does not list (uncommitted, or named
  // in a form the walk quotes), is asked of Git directly.
  async lastCommitTouching(repositoryPath: string, directory: string, path: string): Promise<GitResult> {
    const touches = path.startsWith(`${directory}/`) ? await this.#touchesUnder(repositoryPath, directory) : null;
    const commits = touches?.get(path);
    if (commits?.length === 1) {
      return { exitCode: 0, stderr: "", stdout: `${commits[0]}\n` };
    }
    return this.run(repositoryPath, ["log", "-1", "--format=%H", "--", path]);
  }

  #reachableFrom(repositoryPath: string, target: string): Promise<Set<string> | null> {
    const key = JSON.stringify([repositoryPath, target]);
    let reachable = this.#reachable.get(key);
    if (reachable === undefined) {
      reachable = this.run(repositoryPath, ["rev-list", target, "--"]).then((result) =>
        result.exitCode === 0 ? new Set(result.stdout.split("\n").filter((line) => line.length > 0)) : null
      );
      this.#reachable.set(key, reachable);
    }
    return reachable;
  }

  async #resolveCommit(repositoryPath: string, commit: string): Promise<string | null> {
    const resolved = await this.run(repositoryPath, ["rev-parse", "--verify", "--quiet", `${commit}^{commit}`]);
    const id = resolved.stdout.trim();
    return resolved.exitCode === 0 && fullCommitId.test(id) ? id : null;
  }

  #touchesUnder(repositoryPath: string, directory: string): Promise<Map<string, string[]> | null> {
    const key = JSON.stringify([repositoryPath, directory]);
    let touches = this.#touches.get(key);
    if (touches === undefined) {
      touches = this.run(repositoryPath, ["log", "--no-renames", "-c", "--name-only", "--format=%x00%H", "--", directory]).then((result) => {
        if (result.exitCode !== 0) {
          return null;
        }
        const byPath = new Map<string, string[]>();
        for (const block of result.stdout.split("\0").slice(1)) {
          const [commit, ...paths] = block.split("\n").filter((line) => line.length > 0);
          if (commit === undefined) {
            continue;
          }
          for (const path of paths) {
            const commits = byPath.get(path) ?? [];
            commits.push(commit);
            byPath.set(path, commits);
          }
        }
        return byPath;
      });
      this.#touches.set(key, touches);
    }
    return touches;
  }
}
