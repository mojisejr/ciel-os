import { basename, dirname, join } from "node:path";

import { parseDocument } from "yaml";

import type { ProjectValidationError, ProjectValidationResult } from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateProjectValue(path: string, value: unknown): ProjectValidationError[] {
  if (!isRecord(value)) {
    return [{ path, message: "project document must be a mapping" }];
  }

  const errors: ProjectValidationError[] = [];
  const requiredFields = ["schema_version", "id", "repository"] as const;

  for (const field of requiredFields) {
    if (!(field in value)) {
      errors.push({ path, message: `missing required field: ${field}` });
    }
  }

  for (const field of ["schema_version", "id"] as const) {
    if (field in value && !isNonEmptyString(value[field])) {
      errors.push({ path, message: `field must be a non-empty string: ${field}` });
    }
  }

  if (value.schema_version !== "ciel.project.v0.1") {
    errors.push({ path, message: "unsupported project schema_version" });
  }

  if (isNonEmptyString(value.id) && value.id !== basename(dirname(path))) {
    errors.push({ path, message: "project id must match its directory name" });
  }

  if (!isRecord(value.repository)) {
    errors.push({ path, message: "field must be a mapping: repository" });
    return errors;
  }

  for (const field of ["vcs", "default_branch"] as const) {
    if (!isNonEmptyString(value.repository[field])) {
      errors.push({ path, message: `repository field must be a non-empty string: ${field}` });
    }
  }

  if ("local_only" in value.repository && typeof value.repository.local_only !== "boolean") {
    errors.push({ path, message: "repository field must be a boolean when present: local_only" });
  }

  if (value.repository.local_only === true) {
    if (isNonEmptyString(value.repository.canonical_remote)) {
      errors.push({ path, message: "local-only project must not declare canonical_remote" });
    }
  } else if (!isNonEmptyString(value.repository.canonical_remote)) {
    errors.push({ path, message: "repository field must be a non-empty string: canonical_remote" });
  }

  if (value.repository.vcs !== "git") {
    errors.push({ path, message: "unsupported repository vcs" });
  }

  return errors;
}

export async function validateProjectDirectory(projectsDirectory: string): Promise<ProjectValidationResult> {
  const relativePaths = [...new Bun.Glob("**/project.yaml").scanSync(projectsDirectory)].sort();
  const files = relativePaths.map((relativePath) => join(projectsDirectory, relativePath));
  const errors: ProjectValidationError[] = [];

  if (files.length === 0) {
    return {
      errors: [{ path: projectsDirectory, message: "no project.yaml files found" }],
      files
    };
  }

  for (const path of files) {
    const document = parseDocument(await Bun.file(path).text(), { prettyErrors: false });

    for (const error of document.errors) {
      errors.push({ path, message: `invalid YAML: ${error.message}` });
    }

    if (document.errors.length === 0) {
      errors.push(...validateProjectValue(path, document.toJS()));
    }
  }

  return { errors, files };
}
