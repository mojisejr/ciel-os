export const cielToolchain = {
  language: "typescript",
  runtime: "bun"
} as const;

export { validateEventDirectory } from "./events/validate.ts";
export type { EventValidationError, EventValidationResult } from "./events/types.ts";
