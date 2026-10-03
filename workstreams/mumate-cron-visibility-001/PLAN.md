# MuMate — one Grafana view of every cron job on both droplets, before the cutover

**Workstream:** `mumate-cron-visibility-001`
**State:** active
**Execution lane:** single
**Plan revision:** 0.1
**Execution phase:** none
**Execution state:** idle
**Parallelism:** proposed

## Objective and owner agreement

The owner wants to know, without asking an agent, which cron jobs MuMate has,
what each one does, when it runs, whether it reaches members one by one or
the system only, and whether it is working right now — on production (DO) and
staging (DO) alike (2026-10-02 evening). Vercel shows a cron run history today;
after the cutover the DigitalOcean hosts show nothing in Grafana, because the
cron runs are logged only in each host's journal. The owner chose to build this
**before** the cutover: "ทำ cron panel ก่อนย้ายเลยครับผมว่าดีสุด".

Separate from `mumate-vercel-to-do-001` so that authorizing this work does not
touch the slice-6 go.

## Project links

| Project ID | Role | Local binding |
|---|---|---|
| `mumate-infra` | cron table, cron-call, health timer, Alloy, Grafana definitions | `/Users/non/ghq/github.com/mojisejr/mumate-infra` |
| `ciel-os` | this plan and its events | `.` |

## Starting evidence (verified 2026-10-02, mumate-infra origin/main fb94491, fe origin/main bfcef7a, bazi origin/pdf-dev)

- Six jobs in `cron.tsv`, one systemd timer each, UTC as on Vercel; `bin/cron-check.sh` compares the table with the running image's `/app/vercel.json`. Draft PR 39 turns five on for production at runbook 06 step 3; bazi-alerts stays off (owner 2026-10-01: it fails daily on Vercel, no LINE_*).
- Staging (owner Q2, 2026-09-28): push-reminders, manifest-morning, qi-quota-reset, account-purge on; reconcile-payment drill-only; bazi-alerts off.
- `bin/cron-call.sh` logs `cron <job>: <code> <bytes>B <secs>s` to the journal, discards the response body, keeps an ok/bad state file in `/var/tmp`, and posts to Discord on failure, every 30 min while failing, and on recovery.
- Alloy ships container logs only (`loki.source.docker`); it mounts `/` read-only at `/rootfs`. Grafana has no cron panel and no cron alert (`observability/grafana/*`, `runbooks/04`).
- `mumate-health.timer` runs `ops-status.sh` every 5 minutes on each host; Alloy and the log-silence alert already cover both hosts in `hosts.tsv`.
- None of the six routes records its runs. Each returns a JSON summary; account-purge's lists purged anonIds.
- No job broadcasts: push-reminders and manifest-morning (web push), account-purge (deletes) and bazi-alerts (LINE) act per member by a condition; reconcile-payment per pending payment; qi-quota-reset is system-only.

## Execution slices and acceptance criteria

### 1. Built and proven on staging

1. `cron.tsv` carries, per job, a Thai one-line purpose and its reach (`ราย user` / `ราย payment` / `ระบบ`); `cron-check.sh`, `cron-install.sh`, `cron-call.sh` and their tests keep working with the new columns.
2. `cron-call.sh` writes one structured line per run (job, host, env, HTTP code, seconds, and only the numeric counts from the response — never ids) to a log file Alloy tails, and records the time of the last success.
3. The health timer writes one state line per job every 5 minutes: enabled or off on this host (and why, from `enable_on`), last run, last success, age.
4. Alloy ships those lines to Loki with `host`/`env` labels; the redact stage still applies.
5. `dashboard-mumate-ops.json` gains a cron section: a table per host — job, purpose, reach, schedule in Bangkok time, on/off, last run, last success, last result, counts over 24 h.
6. `alert-rules.yaml` gains "cron silent": a job that is ON on a host and has no success for twice its interval (daily jobs 25 h) → Discord, with a `runbook_url`.
7. `runbooks/04` explains the section in a few lines.

DoD:
- `scripts/*.test.sh` green, including a test that a response id never reaches the log line.
- On mumate-2: four jobs show recent successes, reconcile-payment and bazi-alerts show "off (reason)"; stopping fe for two minutes turns the minute jobs red in the panel and the existing Discord alert fires once; the panel recovers.
- mumate-prod-1 is not changed in this slice; its rows appear after slice 2.
- The owner opens the dashboard and reads the six rows without help.

### 2. Production host

After the owner merges the PR: `git pull` and `cron-install.sh` on mumate-prod-1 (all timers stay off there until runbook 06 step 3), Alloy restarted, the panel shows prod-1's six rows as off. At the cutover, step 3 is also checked in this panel.

## Boundaries

- No production change before the owner's merge; mumate-prod-1 serves no traffic until the cutover, but it is still touched only in slice 2.
- Importing the dashboard and creating the alert in Grafana Cloud is an external write: the agent asks the owner at that step (or the owner imports the file).
- No member data in logs: counts only, through the existing redact stage.
- Not in scope: Vercel's cron history (stays in Vercel until the cutover), turning reconcile-payment or bazi-alerts on anywhere, fixing bazi-alerts (it sends before it marks sent, so two runners would double-send — recorded for the day it is turned on).

## Relations to other workstreams

- `mumate-vercel-to-do-001`: this lands before slice 6 and does not change its runbook; PR 39 must be rebased on top of it at the cutover.
- `mumate-control-room-ops-001` (completed): built the ops dashboard and alert style this extends.

## Review and estimated effort

About half a day plus the owner's look at the panel. Risk is low: the change is in logging and monitoring; the timers' schedules and the routes do not change.
