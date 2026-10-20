import { validateEventDirectory } from "./events/validate.ts";
import { validateProjectDirectory } from "./projects/validate.ts";
import { briefWakeReport, workstreamCandidates, workstreamDetail } from "./wake/brief.ts";
import { readWakeReport } from "./wake/read.ts";

const usage = [
  "Usage:",
  "  ciel events validate [events-directory]",
  "  ciel projects validate [projects-directory]",
  "  ciel wake [repository-directory]                      open work; finished work only when wrong",
  "  ciel wake [repository-directory] --workstream <id>    everything recorded for one workstream",
  "  ciel wake [repository-directory] --full               the complete report"
].join("\n");

type WakeOptions =
  | { directory: string; mode: "brief" | "full" }
  | { directory: string; mode: "workstream"; workstreamId: string };

function parseWakeOptions(arguments_: string[]): WakeOptions | null {
  let directory: string | null = null;
  let full = false;
  let workstreamId: string | null = null;

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index] as string;
    if (argument === "--full") {
      full = true;
    } else if (argument === "--workstream") {
      const value = arguments_[index + 1];
      if (value === undefined || value.startsWith("--")) {
        return null;
      }
      workstreamId = value;
      index += 1;
    } else if (!argument.startsWith("--") && directory === null) {
      directory = argument;
    } else {
      return null;
    }
  }

  if (full && workstreamId !== null) {
    return null;
  }
  if (workstreamId !== null) {
    return { directory: directory ?? ".", mode: "workstream", workstreamId };
  }
  return { directory: directory ?? ".", mode: full ? "full" : "brief" };
}

export async function runCli(arguments_: string[]): Promise<number> {
  const [area, actionOrDirectory, optionalDirectory] = arguments_;

  if (area === "events" && actionOrDirectory === "validate" && arguments_.length <= 3) {
    const result = await validateEventDirectory(optionalDirectory ?? "memory/events");

    for (const file of result.files) {
      console.log(`valid ${file}`);
    }

    for (const warning of result.warnings) {
      console.warn(`warning ${warning.path}: ${warning.message}`);
    }

    if (result.errors.length > 0) {
      for (const error of result.errors) {
        console.error(`${error.path}: ${error.message}`);
      }
      return 1;
    }

    console.log(`validated ${result.files.length} event files`);
    return 0;
  }

  if (area === "projects" && actionOrDirectory === "validate" && arguments_.length <= 3) {
    const result = await validateProjectDirectory(optionalDirectory ?? "projects");

    for (const file of result.files) {
      console.log(`valid ${file}`);
    }

    if (result.errors.length > 0) {
      for (const error of result.errors) {
        console.error(`${error.path}: ${error.message}`);
      }
      return 1;
    }

    console.log(`validated ${result.files.length} project files`);
    return 0;
  }

  if (area === "wake") {
    const options = parseWakeOptions(arguments_.slice(1));
    if (options === null) {
      console.error(usage);
      return 2;
    }

    const report = await readWakeReport(options.directory);
    const status = report.validationErrors.length === 0 ? 0 : 1;

    if (options.mode === "full") {
      console.log(JSON.stringify(report));
      return status;
    }

    if (options.mode === "workstream") {
      const detail = workstreamDetail(report, options.workstreamId);
      if (detail === null) {
        console.log(JSON.stringify({
          error: `No workstream has the id ${options.workstreamId}.`,
          candidates: workstreamCandidates(report, options.workstreamId)
        }));
        return 1;
      }
      console.log(JSON.stringify(detail));
      return status;
    }

    console.log(JSON.stringify(briefWakeReport(report)));
    return status;
  }

  console.error(usage);
  return 2;
}
