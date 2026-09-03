import { resolve } from "node:path";

import { expect, test } from "bun:test";
import { parseDocument } from "yaml";

test("keeps the committed local-binding bootstrap relative and complete", async () => {
  const path = resolve(import.meta.dir, "../projects.local.example.yaml");
  const document = parseDocument(await Bun.file(path).text(), { prettyErrors: false });

  expect(document.errors).toEqual([]);
  expect(document.toJS()).toEqual({
    bindings: {
      "ciel-os": { path: "." },
      "cu12-simulator": { path: "checkouts/cu12-simulator" }
    }
  });
});
