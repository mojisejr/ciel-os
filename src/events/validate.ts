import { join } from "node:path";

import { parseDocument } from "yaml";

import {
  supportedEventTypes,
  type EventValidationError,
  type EventValidationResult
} from "./types.ts";

const requiredFields = [
  "schema_version",
  "id",
  "type",
  "recorded_at",
  "recorded_by",
  "workstream",
  "outcome",
  "evidence",
  "unresolved",
  "next_action"
] as const;

const requiredStringFields = ["schema_version", "id", "recorded_at"] as const;
const requiredObjectFields = [
  "recorded_by",
  "workstream",
  "outcome",
  "evidence",
  "next_action"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateEventValue(path: string, value: unknown): EventValidationError[] {
  if (!isRecord(value)) {
    return [{ path, message: "event document must be a mapping" }];
  }

  const errors: EventValidationError[] = [];

  for (const field of requiredFields) {
    if (!(field in value)) {
      errors.push({ path, message: `missing required field: ${field}` });
    }
  }

  for (const field of requiredStringFields) {
    if (field in value && !isNonEmptyString(value[field])) {
      errors.push({ path, message: `field must be a non-empty string: ${field}` });
    }
  }

  for (const field of requiredObjectFields) {
    if (field in value && !isRecord(value[field])) {
      errors.push({ path, message: `field must be a mapping: ${field}` });
    }
  }

  if ("unresolved" in value && !Array.isArray(value.unresolved)) {
    errors.push({ path, message: "field must be a list: unresolved" });
  }

  if (
    "type" in value &&
    (!isNonEmptyString(value.type) || !supportedEventTypes.includes(value.type as (typeof supportedEventTypes)[number]))
  ) {
    errors.push({
      path,
      message: `unsupported event type: ${String(value.type)}`
    });
  }

  return errors;
}

export async function validateEventDirectory(eventsDirectory: string): Promise<EventValidationResult> {
  const relativePaths = [...new Bun.Glob("**/*.yaml").scanSync(eventsDirectory)].sort();
  const files = relativePaths.map((relativePath) => join(eventsDirectory, relativePath));
  const errors: EventValidationError[] = [];

  if (files.length === 0) {
    return {
      errors: [{ path: eventsDirectory, message: "no YAML event files found" }],
      files
    };
  }

  for (const path of files) {
    const document = parseDocument(await Bun.file(path).text(), { prettyErrors: false });

    for (const error of document.errors) {
      errors.push({ path, message: `invalid YAML: ${error.message}` });
    }

    if (document.errors.length === 0) {
      errors.push(...validateEventValue(path, document.toJS()));
    }
  }

  return { errors, files };
}
