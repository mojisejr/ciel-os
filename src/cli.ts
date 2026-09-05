import { validateEventDirectory } from "./events/validate.ts";
import { validateProjectDirectory } from "./projects/validate.ts";
import { readWakeReport } from "./wake/read.ts";

const usage = [
  "Usage:",
  "  ciel events validate [events-directory]",
  "  ciel projects validate [projects-directory]",
  "  ciel wake [repository-directory]"
].join("\n");

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

  if (area === "wake" && arguments_.length <= 2) {
    const report = await readWakeReport(actionOrDirectory ?? ".");
    console.log(JSON.stringify(report, null, 2));
    return report.validationErrors.length === 0 ? 0 : 1;
  }

  console.error(usage);
  return 2;
}
