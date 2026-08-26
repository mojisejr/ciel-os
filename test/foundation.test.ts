import { expect, test } from "bun:test";

import { cielToolchain } from "../src/index.ts";

test("uses the selected TypeScript and Bun toolchain", () => {
  expect(cielToolchain).toEqual({
    language: "typescript",
    runtime: "bun"
  });
  expect(Bun.version).toMatch(/^1\./);
});
