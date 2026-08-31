import { resolve } from "node:path";

import { expect, test } from "bun:test";

const repositoryRoot = resolve(import.meta.dir, "..");

function runGit(arguments_: string[]): { exitCode: number; stdout: string } {
  const process = Bun.spawnSync(["git", "-C", repositoryRoot, ...arguments_], { stderr: "pipe", stdout: "pipe" });
  return { exitCode: process.exitCode, stdout: new TextDecoder().decode(process.stdout) };
}

test("keeps child checkouts out of HQ Git while tracking the checkout boundary", () => {
  const ignoredChild = runGit(["check-ignore", "-v", "checkouts/example-project/src/index.ts"]);
  const trackedBoundary = runGit(["check-ignore", "checkouts/README.md"]);

  expect(ignoredChild.exitCode).toBe(0);
  expect(ignoredChild.stdout).toContain("/checkouts/*");
  expect(trackedBoundary.exitCode).toBe(1);
});
