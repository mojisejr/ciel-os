# MuMate — an off-platform backup that runs, fails loudly, and has been restored against a clock

**Workstream:** `mumate-backup-001`
**State:** completed
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

MuMate's production database (Supabase Pro, project on the `aws-1-ap-southeast-1`
pooler) has two recovery layers today, and one of them exists mostly on paper:

- Supabase Pro's own daily backups, seven days back, to the day. PITR is off.
- `mumate-infra`'s `bin/backup.sh`: a `pg_dump` streamed to the DigitalOcean
  Spaces bucket `mumate-backups`. This is the layer in a different failure
  domain from Supabase. When last observed it held **one object, dated
  2026-09-19**, and `mumate-backup.timer` was disabled by design.

Both lanes of the last round shipped work that rests on that thinness: login
identity writes member data on production, and the infrastructure move built
the stack that is meant to become MuMate's main server. The login lane's final
handoff named this the first thing to do next.

The owner agreed the plan on 2026-09-26 in this session, answering seven
questions (K1-K7). The answers, as given:

| # | Question | Owner's answer |
|---|---|---|
| K1 | Open this workstream and authorize slice 1 | Open it |
| K2 | Keep the DigitalOcean Droplet | Keep it. **DigitalOcean is to become MuMate's main server, not only staging** — so the backup runner stays there |
| K3 | Nightly timer at 09:00 Bangkok, 14-day retention | OK |
| K4 | Real member data lives in the private Spaces bucket for 14 days | Accepted |
| K5 | Restore drill target | The disposable `pgtmp` on the Droplet; a restore into a fresh Supabase project is deferred |
| K6 | Supabase PITR ($100/month) | Not until truly needed |
| K7 | If the dump runs as a superuser, create a read-only role for it | OK |

## Relationship to existing work

- `mumate-infra-move-001` (completed at slice 3) built `backup.sh`,
  `restore-verify.sh`, `arena.sh` and runbook 02, and carried
  "backup layer is thinner than the documents said" as a candidate for a new
  workstream. This is that workstream. It cites the closing decision
  `memory/events/2026/09/26/20260926T131821_mumate_infra_move_close_at_slice_3.yaml`
  and does not reopen that plan.
- `mumate-login-identity-001` is active and idle. Nothing here touches
  mootech-fe or its slices 4b and 5.

## Verified starting evidence

- `mumate-infra` `main` at `978c2de`: `bin/backup.sh`, `bin/restore-verify.sh`,
  `bin/arena.sh`, `systemd/mumate-backup.{service,timer}`,
  `runbooks/02-backup-restore.md`, `env/backup.env.example`.
- `bin/_lib.sh:11` — `fail()` logs and exits without calling `alert`, and
  `backup.sh` alerts only when the object is under 1000 bytes. **Any other
  failure (dump, upload, credentials) is silent.** Nothing checks that a backup
  happened at all.
- 2026-09-26 00:40 record: `arena.sh up` loaded
  `pg/mumate-1-20260919T220406Z.sql.gz` — 185 public tables, 5,018 `user` rows —
  and the shadow FE served `/api/health` 200 from it. The dump is restorable;
  how long a restore takes has never been measured.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mumate-infra` | Backup scripts, timers, health notifier, runbooks | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | Plan, decisions, and continuity | `.` |

## Boundaries

- Every script change is a `mumate-infra` pull request, applied on the host
  through `bin/` after merge. Secrets stay in `env/backup.env` on the host; no
  value is read into a session, printed, or committed.
- Production Supabase is read (by `pg_dump`) and never written, with one
  exception authorized by K7: creating a read-only role for the dump, only if
  the current role is found to be a superuser or owner.
- The restore drill uses `pgtmp` only. The shadow FE may point at it for the
  timing and must be returned to production before the slice closes; `be` and
  `bazi` are not repointed.
- Out of scope: PITR, a restore into a new Supabase project, Supabase Storage
  or AWS `s3-ps-cdn` backups (inventoried here, not solved), DNS, Vercel,
  Render, application repositories, and the flip.

## Execution slices and acceptance criteria

### 1. Backup runs nightly, fails loudly, and a timed restore is written down

Steps:

0. Open this workstream (this plan and its decision).
1. Read the host, read-only: bucket listing, timer state, key names in
   `env/backup.env`, and the privileges of the dump's database role.
2. `mumate-infra` pull request: every `backup.sh` failure alerts Discord;
   `health-notify` alerts when the newest backup object is older than 26 hours;
   a test that must fail if either alert is removed.
3. Run `backup.sh` then `restore-verify.sh` by hand on the host.
4. Enable `mumate-backup.timer`; watch two nights.
5. Timed restore drill into `pgtmp` with the shadow FE pointed at it, then
   returned to production.
6. Rewrite runbook 02's "real restore" section as executable steps with the
   measured time.
7. Inventory what `pg_dump` does not cover.
8. Closeout.

DoD 1:

| # | Criterion | Evidence |
|---|---|---|
| D1 | The timer produces a backup two nights running | Two new objects in `s3://mumate-backups/pg/`, each larger than 1 MB, and two 💾 messages in Discord |
| D2 | A failed backup always alerts | One real induced failure produces 🚨 in Discord and a non-zero exit |
| D3 | A missing backup is noticed | A stale newest object makes `health-notify` alert; a test fails when the check is removed |
| D4 | The newest backup restores | `restore-verify.sh` passes on a D1 object: tables > 100, users > 0, errors only vault/extension noise |
| D5 | Restore time is known | Minutes measured in the drill, recorded in the closeout and runbook; the FE answered `/api/health` 200 from restored data |
| D6 | Someone else can restore from the runbook | Runbook 02 "real restore" is command-by-command and matches what the drill did |
| D7 | What is not in the backup is known | A list in the closeout: each item, lost or recoverable, and how |
| D8 | No secret or member data leaked | gitleaks clean; no value in logs or events; `pgtmp` gone after the drill and the shadow FE back on production |
