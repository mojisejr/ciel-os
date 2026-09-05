import { join, resolve } from "node:path";

import { expect, test } from "bun:test";

import { validateEventDirectory } from "../../src/events/validate.ts";

const fixtureDirectory = (name: string): string => join(import.meta.dir, "../fixtures/events", name);

test("validates the repository event records and reports their paths", async () => {
  const result = await validateEventDirectory(resolve(import.meta.dir, "../../memory/events"));

  expect(result.errors).toEqual([]);
  expect(result.files.length).toBeGreaterThanOrEqual(11);
  expect(result.files.every((path) => path.startsWith("/"))).toBe(true);
});

test("reports a missing common field with the fixture path", async () => {
  const result = await validateEventDirectory(fixtureDirectory("missing-evidence"));

  expect(result.errors).toEqual([
    expect.objectContaining({
      message: "missing required field: evidence",
      path: expect.stringContaining("missing-evidence")
    })
  ]);
});

test("rejects an event type outside the approved initial boundary", async () => {
  const result = await validateEventDirectory(fixtureDirectory("unsupported-type"));

  expect(result.errors).toEqual([
    expect.objectContaining({ message: "unsupported event type: observation" })
  ]);
});

test("CLI returns non-zero and names the failed field", async () => {
  const process = Bun.spawn(
    ["bun", "run", "bin/ciel.ts", "events", "validate", fixtureDirectory("missing-evidence")],
    { stderr: "pipe", stdout: "pipe" }
  );

  expect(await process.exited).toBe(1);
  expect(await new Response(process.stderr).text()).toContain("missing required field: evidence");
});

test("warns when the newest event records no Git checkpoint", async () => {
  const result = await validateEventDirectory(fixtureDirectory("newest-without-checkpoint"));

  expect(result.errors).toEqual([]);
  expect(result.warnings).toEqual([
    {
      path: join(fixtureDirectory("newest-without-checkpoint"), "20260827T000000_without_checkpoint.yaml"),
      message:
        "newest event has no Git checkpoint reference; Wake will report reconciliation as unknown until a later event records one"
    }
  ]);
});

test("does not warn about historical events that record no Git checkpoint", async () => {
  const result = await validateEventDirectory(resolve(import.meta.dir, "../../memory/events"));

  expect(result.errors).toEqual([]);
  expect(result.warnings).toEqual([]);
});
