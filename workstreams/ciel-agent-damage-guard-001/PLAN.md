# CIEL — keep agent-run commands from silently damaging local files, and make the damage recoverable

**Workstream:** `ciel-agent-damage-guard-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** 1
**Execution state:** executing
**Parallelism:** none

## Objective and owner intent

On 2026-10-11 a test the agent wrote ran a real `rm -rf` on the owner's Mac and
deleted a tracked file in mumate-infra (incident record
`memory/events/2026/10/11/20261011T110217_mumate_team_release_test_payload_rm_incident.yaml`).
It is the third silent local damage by an agent-run command in two weeks: a perl
replacement deleted a link in praneet-web on 2026-10-10, raw control bytes in
written files made them binary, and now this. In each case every test stayed
green; only reading the diff or `git status` caught it.

Agreed in a syncup with the owner on 2026-10-11:

- Guard the whole family, not this one incident, **without slowing ordinary
  work**: no new blocking hook, no step that fires on every command.
- A rule all clients follow, a mechanical guard where the repository needs one,
  and a backup so that what Git cannot restore can still be recovered.
- Keep it tidy: a universal rule lives in `AGENTS.md`, a project's mechanism
  lives in that project beside the code it guards, the backup standard lives in
  `docs/portability/` with machine-specific state outside Git.

The owner's go after the shared summary: "เปิด workstream ได้ครับ".

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `ciel-os` | `AGENTS.md` rule; backup standard in `docs/portability/`; this plan | `.` |
| `mumate-infra` | disposable-copy test runner for its `eval`-based shell tests | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |

## Starting evidence

- The existing `~/.claude/hooks/pretooluse-guard.sh` already refuses an `rm -rf`
  the agent types, but cannot see commands inside a script it runs; a sandbox on
  the agent's shell would not have helped either, because the file was inside the
  working directory.
- Only mumate-infra uses an `eval`-based shell test harness (12 of its 16
  `scripts/*.test.sh`); dac2 and mootech-fe have shell tests without `eval`.
- This Mac has no backup: `tmutil destinationinfo` reports no destination.
  Ignored, Git-unrecoverable files exist: `.assets/` (14 MB; about 40 files
  with keys, env values or data exports) and secret-like ignored files in eight
  repositories. The owner keeps copies of the secrets elsewhere.
- `~/dev/ciel-os` plus `~/ghq/github.com/mojisejr` hold about 23 GB, of which
  about 18 GB is regenerable (`node_modules`, `.next`, `target`, …); `.git`
  directories total 1.2 GB and must be kept (unpushed branches live only here).
- No Google Drive client and no backup tool is installed; Homebrew is.
- `ciel-os-template-001` (idle) lists `docs/portability/` among the places that
  carry owner-specific names; the backup standard therefore keeps owner values
  (paths, account, machine name) in local configuration, not in the tracked files.

## Slices

### 1. The rule (ciel-os `AGENTS.md`)

Append two sentences to the existing **Execute** line of the work lifecycle, no
new line or heading: never put a real destructive command in a test, fixture or
example (prove neutralization with a harmless marker); after any local run that
can write, compare `git status` with the intended change, and an unexpected
change stops the work and goes to the owner before any push. Trim the agent's
own memory note to what `AGENTS.md` does not say.

Done when: `bun run check` passes; the agent memory holds no duplicate of the rule.

### 2. Disposable-copy test runner (mumate-infra)

`scripts/test-all.sh` copies the working tree (tracked and untracked, not ignored
files) to a temporary directory, runs every `scripts/*.test.sh` there and
reports; the real checkout cannot be written by a test. Runbook and PR template
point to it.

Done when: owner merges the PR; a deliberately destructive test run through the
runner leaves the real checkout unchanged.

### 3. Backup standard (ciel-os `docs/portability/`) and this Mac

- `docs/portability/BACKUP.md`: set up a machine, restore (plain and encrypted
  parts), turn it off; a Windows section that hands the same standard to a
  session on that machine (same rclone rules, Task Scheduler instead of launchd,
  what must be proven there).
- A tracked rules file: what goes up as plain files, what goes through
  `rclone crypt`, what is never copied (regenerable directories).
- A macOS script; the schedule (launchd), Google token, encryption password and
  the machine's list of roots stay on the machine.
- Google Drive of the owner through rclone with scope `drive.file`, one folder
  per machine `CIEL-backup/<machine>/`; changed or deleted files kept 30 days;
  daily; a macOS notification when the backup is over 100 GB or has failed for
  more than two days.
- This Mac backs up `~/dev/ciel-os` and `~/ghq/github.com/mojisejr` without
  regenerable directories (about 5 GB).
- The owner signs in to Google once and stores the encryption password in his
  password manager.

Done when: first backup on Drive; a restore of one plain and one encrypted file
into a scratch folder matches the original; no sensitive file appears as plain in
Drive; the schedule ran once by itself.

## Boundaries

- No new blocking hook or permission rule; no change to CIEL's read-only CLI.
- No secret, token, password or owner path in a tracked file.
- Windows backup is described, not built.
- Each slice gets its own decision and closeout; ciel-os changes reach `main`
  through the owner's HQ round, mumate-infra through its own PR.
