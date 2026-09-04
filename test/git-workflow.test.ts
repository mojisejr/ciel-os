import { resolve } from "node:path";

import { expect, test } from "bun:test";

test("keeps the startup Git rule concise and the workflow discoverable", async () => {
  const [agents, readme] = await Promise.all([
    Bun.file(resolve(import.meta.dir, "../AGENTS.md")).text(),
    Bun.file(resolve(import.meta.dir, "../README.md")).text()
  ]);

  expect(agents).toContain("## Git workflow");
  expect(agents).toContain("Do not develop tracked changes directly on `main`.");
  expect(agents).toContain("return to a clean local `main` that matches fetched `origin/main`");
  expect(agents).not.toContain("git switch -c");
  expect(readme).toContain("## Change workflow");
  expect(readme).toContain("git merge --ff-only feat/<topic>");
  expect(readme).toContain("git pull --ff-only origin main");
  expect(readme).toContain("Before requesting a merge, prepare the phase closeout event");
  expect(readme).toContain("git log origin/main..<branch>");
  expect(readme).toContain("gh pr create --base main --head feat/<topic>");
  expect(readme).toContain("only once to seed an empty remote repository");
});
