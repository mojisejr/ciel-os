import { join, resolve } from "node:path";

import { expect, test } from "bun:test";

import { validateProjectDirectory } from "../../src/projects/validate.ts";

const fixtureDirectory = (name: string): string => join(import.meta.dir, "../fixtures/projects", name);

test("validates the committed project registry", async () => {
  const result = await validateProjectDirectory(resolve(import.meta.dir, "../../projects"));

  expect(result.errors).toEqual([]);
  expect(result.files).toEqual([expect.stringContaining("projects/ciel-os/project.yaml")]);
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
