# MuMate infra — safe tools for production database work and env edits, so no secret is ever printed

**Workstream:** `mumate-infra-safe-access-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** none

## Objective and owner intent

A production database credential was printed into an agent session twice
(2026-10-12 and 2026-10-24). Both times the agent wrote a one-off command
against a quoted value in a prod-1 env file, and a filter that should have hidden the value
failed open. The same one-off commands are the ones the harness sometimes
refuses, which stops the work until the owner runs them by hand.
mumate-infra has safe scripts for deploys, backups and cron, but none for
reading or writing production data or for changing one env key.

The owner agreed in a two-round syncup on 2026-10-24:

- **Protection lives in the project.** The tools belong in mumate-infra, not
  in ciel-os. A cross-project template waits until a second project needs
  production access of its own.
- **Not a cage.** The one hard guarantee is that a tool never prints a secret.
  Everything else is done and then reported. The agent stops to ask only for
  something serious in the sense of `OWNER.md`: data loss that cannot be
  recovered, secret exposure, an irreversible action, or acting without
  authority. Work must stay smooth for the agent, which does the work while
  the owner waits for its reports.
- **What every tool guarantees** (the standard other projects can take later):
  1. never prints a secret value;
  2. prints only result lines of a declared shape and drops everything else;
     an error prints a fixed failure line, never the error text;
  3. passes values through the environment, never on a command line;
  4. ships a test that plants a canary value and proves it never appears,
     on success and on every failure path;
  5. backs up an env file before changing it, and changes one key at a time.
- **Guidance where the agent already looks:** each tool's `--help` and
  header, and the agent section of runbook 01, which the agent reads before
  any production work.
- **Rotation of the exposed database password is not a slice.** The owner picks
  the day when traffic is low. Slice 2 leaves a ready procedure for it, and
  the rotation is recorded separately when it happens.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mumate-infra` | `bin/prod-sql.sh`, `bin/env-set.sh`, their tests, runbook 01 | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence (2026-10-24, mumate-infra ef7026d)

- Production database URLs on prod-1: `env/fe.env` `DATABASE_URL` and
  `env/bazi.env` `APP_DATABASE_URL`, stored shell-quoted. Docker
  `--env-file` keeps the quotes, so psql rejects the value and echoes it.
- `bin/backup.sh` already reads `env/backup.env` itself and never prints it;
  `bin/hosts.sh compare` prints key names only. Tests live in
  `scripts/*.test.sh` and run from `scripts/test-all.sh`.
- The PDPA clean start on 2026-10-24 ran through a one-off script in the agent's
  scratchpad, with silent quote stripping, the URL passed by environment, and
  output limited to `name|number` lines. It printed nothing secret and is
  the starting shape for `prod-sql.sh`.
- Not yet known: whether `env/backup.env` shares the same credential. A
  one-off check was refused by the harness on 2026-10-24.

## Boundaries

- One pull request per slice in mumate-infra. The agent merges after its own
  checks.
- Out of scope: the rotation itself; a guard rule on the owner's machine; a
  least-privilege database role; a cross-project template; Vercel env;
  changing `OWNER.md`.
- Outside this plan, on the owner's machine: a Claude permission rule that lets the read mode
  of the tools run without a prompt (owner agreed 2026-10-24). It is host
  configuration, not CIEL.

## Slices

- [1. prod-sql.sh](slices/1.md)
- [2. env-set.sh and the rotation procedure](slices/2.md)
