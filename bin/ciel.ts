#!/usr/bin/env bun

import { runCli } from "../src/cli.ts";

process.exitCode = await runCli(Bun.argv.slice(2));
