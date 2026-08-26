import { validateEventDirectory } from "./events/validate.ts";

const usage = "Usage: ciel events validate [events-directory]";

export async function runCli(arguments_: string[]): Promise<number> {
  const [area, action, eventsDirectory = "memory/events"] = arguments_;

  if (area !== "events" || action !== "validate" || arguments_.length > 3) {
    console.error(usage);
    return 2;
  }

  const result = await validateEventDirectory(eventsDirectory);

  for (const file of result.files) {
    console.log(`valid ${file}`);
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
