import { readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { expect, test } from "bun:test";

import { validateProjectDirectory } from "../../src/projects/validate.ts";

const fixtureDirectory = (name: string): string => join(import.meta.dir, "../fixtures/projects", name);

// The registry is projects/ itself, so this test holds no second copy of it: a hand-written list
// went stale on three of the last four registrations (a827400, ba59b5e, 6ba6ddb). It asserts that
// every project directory carries exactly one valid project.yaml and nothing else is picked up.
// Paths are compared relative and with "/" so the test reads the same on Windows.
test("validates the committed project registry", async () => {
  const projectsDirectory = resolve(import.meta.dir, "../../projects");
  const result = await validateProjectDirectory(projectsDirectory);

  const projectDirectories = readdirSync(projectsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const found = result.files.map((file) => relative(projectsDirectory, file).split(sep).join("/"));

  expect(result.errors).toEqual([]);
  expect(projectDirectories.length).toBeGreaterThan(0);
  expect(found).toEqual(projectDirectories.map((name) => `${name}/project.yaml`));
});

test("accepts a declared local-only Git project identity", async () => {
  const result = await validateProjectDirectory(fixtureDirectory("local-only"));

  expect(result.errors).toEqual([]);
});

test("reports a missing stable repository field", async () => {
  const result = await validateProjectDirectory(fixtureDirectory("missing-remote"));

  expect(result.errors).toEqual([
    expect.objectContaining({ message: "repository field must be a non-empty string: canonical_remote" })
  ]);
});

test("rejects a project identity that does not match its registry directory", async () => {
  const result = await validateProjectDirectory(fixtureDirectory("mismatched-id"));

  expect(result.errors).toEqual([expect.objectContaining({ message: "project id must match its directory name" })]);
});
