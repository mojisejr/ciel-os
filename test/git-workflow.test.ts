import { resolve } from "node:path";

import { expect, test } from "bun:test";

test("keeps the startup Git rule concise and the workflow discoverable", async () => {
  const [agents, readme, template] = await Promise.all([
    Bun.file(resolve(import.meta.dir, "../AGENTS.md")).text(),
    Bun.file(resolve(import.meta.dir, "../README.md")).text(),
    Bun.file(resolve(import.meta.dir, "../.github/PULL_REQUEST_TEMPLATE.md")).text()
  ]);

  expect(agents).toContain("## Git workflow");
  expect(agents).toContain("Do not develop tracked changes directly on `main`.");
  expect(agents).toContain("return to a clean local `main` that matches fetched `origin/main`");
  expect(agents).toContain("Keep every remote PR as a draft until its phase closeout");
  expect(agents).not.toContain("git switch -c");
  // A word the code acts on must be visibly different from one it ignores.
  // Requiring outcome.status while documenting no values is what let a cold
  // session write a workstream out of the delivery machinery.
  expect(agents).toContain("`outcome.status` is acted on, not free text");
  expect(agents).toContain("`decided` on a decision authorizes the plan revision");
  expect(agents).toContain("`ready-for-owner-merge` on a closeout offers it as the workstream's final delivery");
  expect(agents).toContain("Every other value is recorded and ignored");
  expect(agents).toContain("A plan that declares slices is finished by a closeout for its last declared slice.");
  expect(readme).toContain("## Change workflow");
  expect(readme).toContain("git merge --ff-only feat/<topic>");
  expect(readme).toContain("git pull --ff-only origin main");
  expect(readme).toContain("gh pr create --draft --base main --head feat/<topic>");
  expect(readme).toContain("merge lock while CIEL prepares its final closeout");
  expect(readme).toContain("ancestor of the PR head");
  expect(readme).toContain("final, merge-ready PR to the owner");
  expect(readme).toContain("git log origin/main..<branch>");
  expect(readme).toContain("Do not edit a shared file while another lane is live");
  expect(readme).toContain("the second write silently replaces the first");
  expect(readme).toContain("CIEL currentness is per repository");
  expect(readme).toContain("only once to seed an empty remote repository");
  expect(readme).toContain("Before marking a PR ready");
  expect(readme).toContain(".github/PULL_REQUEST_TEMPLATE.md");
  expect(template).toContain("## Review in one minute");
  expect(template).toContain("## Context");
  expect(template).toContain("## Change");
  expect(template).toContain("## Evidence");
  expect(template).toContain("## Boundaries");
  expect(template).toContain("## Delivery");
});
